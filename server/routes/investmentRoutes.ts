import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const investmentRouter = Router();

// GET /api/investments - List positions
investmentRouter.get('/', (req: Request, res: Response) => {
  const data = db.getData();
  return res.json({
    success: true,
    positions: data.investments,
    totalPrincipalUsd: data.investments.reduce((acc, p) => acc + p.principalAmount, 0)
  });
});

// GET /api/investments/pools - Staking Pools
investmentRouter.get('/pools', (req: Request, res: Response) => {
  const data = db.getData();
  return res.json({
    success: true,
    pools: data.stakingPools
  });
});

// POST /api/investments/enroll - Create new position
investmentRouter.post('/enroll', (req: Request, res: Response) => {
  try {
    const { planCategory, planName, principalAmount, currency, aprPercent, durationDays } = req.body;
    if (!principalAmount || principalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid principal amount required' });
    }

    const data = db.getData();

    // Check balance
    const userBal = data.balances[currency as keyof typeof data.balances] || data.balances.USDT;
    if (userBal < principalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient ${currency} balance. Available: ${userBal}, Required: ${principalAmount}` 
      });
    }

    // Deduct balance
    const updatedBal: Record<string, number> = {};
    if (currency === 'NILE') {
      updatedBal['NILE'] = data.balances.NILE - principalAmount;
    } else {
      updatedBal['USDT'] = (data.balances.USDT || 500000) - principalAmount;
    }
    db.updateBalances(updatedBal);

    const startDate = new Date().toISOString().split('T')[0];
    const maturity = new Date();
    maturity.setDate(maturity.getDate() + (durationDays || 90));
    const maturityDate = maturity.toISOString().split('T')[0];

    const newPosition = db.addInvestment({
      id: `inv-${Date.now().toString(36)}`,
      planCategory: planCategory || 'time',
      planName: planName || `${durationDays || 90} Days Horizon Strategy`,
      principalAmount: Number(principalAmount),
      currency: currency || 'USDT',
      aprPercent: Number(aprPercent || 12.0),
      durationDays: Number(durationDays || 90),
      startDate,
      maturityDate,
      accruedReturn: 0,
      status: 'active',
      lastYieldAccruedAt: new Date().toISOString()
    });

    // Record ledger transaction
    db.addTransaction({
      id: `tx-inv-${Date.now().toString(36)}`,
      type: 'staking_deposit',
      amount: Number(principalAmount),
      currency: currency || 'USDT',
      status: 'confirmed',
      network: 'Nile Smart Chain / Internal Treasury',
      recipientOrDetails: `Enrollment in ${newPosition.planName} (${durationDays} Days @ ${aprPercent}%)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    db.addAuditLog({
      action: 'INVESTMENT_ENROLLMENT',
      actor: data.users[0]?.email || 'user',
      target: newPosition.id,
      details: `Enrolled ${principalAmount} ${currency} into ${newPosition.planName}`
    });

    return res.json({
      success: true,
      message: 'Investment position enrolled successfully',
      position: newPosition,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/investments/claim - Claim accrued returns
investmentRouter.post('/claim', (req: Request, res: Response) => {
  try {
    const { positionId } = req.body;
    const data = db.getData();
    const position = data.investments.find(p => p.id === positionId);

    if (!position) {
      return res.status(404).json({ success: false, message: 'Position not found' });
    }

    const accrued = position.accruedReturn || 125.50; // Current yield
    if (accrued <= 0) {
      return res.status(400).json({ success: false, message: 'No accrued rewards available to claim at this time' });
    }

    // Credit to balance
    const currentNile = data.balances.NILE || 0;
    db.updateBalances({ NILE: currentNile + accrued });

    position.accruedReturn = 0;
    position.lastYieldAccruedAt = new Date().toISOString();
    db.save();

    db.addTransaction({
      id: `tx-clm-${Date.now().toString(36)}`,
      type: 'staking_claim',
      amount: accrued,
      currency: 'NILE',
      status: 'confirmed',
      network: 'Nile Smart Chain',
      recipientOrDetails: `Accrued yield payout from ${position.planName}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    return res.json({
      success: true,
      message: `Successfully claimed +${accrued.toFixed(2)} NILE to your liquid wallet!`,
      claimedAmount: accrued,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/investments/unstake - Emergency or maturity unstaking
investmentRouter.post('/unstake', (req: Request, res: Response) => {
  try {
    const { positionId, reason } = req.body;
    const data = db.getData();
    const position = data.investments.find(p => p.id === positionId);

    if (!position) {
      return res.status(404).json({ success: false, message: 'Position not found' });
    }

    // Check if maturity has passed or emergency cooldown applies
    const isMatured = new Date(position.maturityDate) <= new Date();
    const penaltyFee = isMatured ? 0 : position.principalAmount * 0.015; // 1.5% early liquidation fee
    const returnedPrincipal = position.principalAmount - penaltyFee;

    // Credit back to balance
    const currentUsdt = data.balances.USDT || 0;
    db.updateBalances({ USDT: currentUsdt + returnedPrincipal });

    position.status = 'withdrawn';
    db.save();

    db.addTransaction({
      id: `tx-unstake-${Date.now().toString(36)}`,
      type: 'staking_unstake',
      amount: returnedPrincipal,
      currency: position.currency,
      status: 'confirmed',
      network: 'Nile Smart Chain',
      recipientOrDetails: isMatured 
        ? `Maturity settlement of ${position.planName}` 
        : `Early emergency liquidation of ${position.planName} (1.5% fee applied: ${penaltyFee.toFixed(2)})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    return res.json({
      success: true,
      message: isMatured 
        ? 'Position matured and full principal unlocked to Liquid Wallet!' 
        : 'Emergency unstake executed. Capital credited after compliance cooldown.',
      returnedPrincipal,
      penaltyFee,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
