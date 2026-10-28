import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const treasuryRouter = Router();

// GET /api/treasury/balances
treasuryRouter.get('/balances', (req: Request, res: Response) => {
  const data = db.getData();
  
  // Calculate 4-Ledger Accounting Structure
  const liquidUsdt = data.balances.USDT || 500000;
  const investmentUsdt = data.investments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.principalAmount, 0);
  const nileTokens = data.balances.NILE || 1250000;
  const affiliateUsdt = 14500.00; // Affiliate commission balance

  return res.json({
    success: true,
    ledgers: {
      liquid: { currency: 'USDT', balance: liquidUsdt, status: 'spot_ready' },
      investment: { currency: 'USDT', balance: investmentUsdt, status: 'yielding' },
      nileToken: { currency: 'NILE', balance: nileTokens, multiplier: '2.0x' },
      affiliate: { currency: 'USDT', balance: affiliateUsdt, tiers: 10 }
    },
    rawBalances: data.balances,
    totalPortfolioUsd: liquidUsdt + investmentUsdt + (nileTokens * 0.12) + affiliateUsdt
  });
});

// POST /api/treasury/swap - Zero-Slippage In-Wallet Swap
treasuryRouter.post('/swap', (req: Request, res: Response) => {
  try {
    const { fromAsset, toAsset, amount } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid swap amount required' });
    }

    const data = db.getData();
    const currentFrom = (data.balances as any)[fromAsset] || 0;
    if (currentFrom < numAmount) {
      return res.status(400).json({ success: false, message: `Insufficient ${fromAsset} balance` });
    }

    // Rate calculation: NILE is $0.1200
    let rate = 1.0;
    if (fromAsset === 'USDT' && toAsset === 'NILE') {
      rate = 1 / 0.12; // 8.333 NILE per 1 USDT
    } else if (fromAsset === 'NILE' && toAsset === 'USDT') {
      rate = 0.12;
    } else if (fromAsset === 'BTC' && toAsset === 'USDT') {
      rate = 68450;
    } else if (fromAsset === 'ETH' && toAsset === 'USDT') {
      rate = 3580;
    }

    const received = numAmount * rate;

    // Update balances
    const newBalances: Record<string, number> = {
      [fromAsset]: currentFrom - numAmount,
      [toAsset]: ((data.balances as any)[toAsset] || 0) + received
    };
    db.updateBalances(newBalances);

    db.addTransaction({
      id: `tx-swap-${Date.now().toString(36)}`,
      type: 'transfer',
      amount: numAmount,
      currency: fromAsset,
      status: 'confirmed',
      network: 'Internal Treasury Engine',
      recipientOrDetails: `Zero-Slippage Swap: ${numAmount} ${fromAsset} ➔ ${received.toFixed(2)} ${toAsset}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    return res.json({
      success: true,
      message: `Successfully swapped ${numAmount} ${fromAsset} for ${received.toFixed(2)} ${toAsset}!`,
      receivedAmount: received,
      effectiveRate: rate,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
