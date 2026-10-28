import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const transactionRouter = Router();

// GET /api/transactions - Full ledger history
transactionRouter.get('/', (req: Request, res: Response) => {
  const { category, search, status } = req.query;
  const data = db.getData();
  let list = [...data.transactions];

  if (category) {
    if (category === 'deposits') {
      list = list.filter(t => t.type === 'deposit' || t.type === 'card_load');
    } else if (category === 'withdrawals') {
      list = list.filter(t => t.type === 'withdrawal');
    } else if (category === 'staking_rewards') {
      list = list.filter(t => t.type === 'staking_claim' || t.type === 'staking_unstake' || t.type === 'staking_deposit');
    }
  }

  if (status && status !== 'all') {
    list = list.filter(t => t.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(t => 
      t.id.toLowerCase().includes(q) ||
      (t.txHash && t.txHash.toLowerCase().includes(q)) ||
      (t.recipientOrDetails && t.recipientOrDetails.toLowerCase().includes(q)) ||
      t.currency.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    total: list.length,
    transactions: list
  });
});

// POST /api/transactions/deposit - Submit deposit TXID for verification
transactionRouter.post('/deposit', (req: Request, res: Response) => {
  try {
    const { amount, currency, txHash, network } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid deposit amount required' });
    }
    if (!txHash || txHash.length < 8) {
      return res.status(400).json({ success: false, message: 'Valid on-chain TXID or blockchain hash required' });
    }

    const data = db.getData();
    const newTx = db.addTransaction({
      id: `tx-dep-${Date.now().toString(36)}`,
      type: 'deposit',
      amount: Number(amount),
      currency: currency || 'USDT',
      status: 'pending',
      network: network || 'Tron (TRC20)',
      txHash,
      recipientOrDetails: `Deposit (${currency || 'USDT'}) via Blockchain TXID: ${txHash} - Compliance Queue`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    db.addAuditLog({
      action: 'DEPOSIT_SUBMITTED',
      actor: data.users[0]?.email || 'user',
      target: newTx.id,
      details: `Deposit of ${amount} ${currency} submitted with TXID ${txHash}`
    });

    return res.json({
      success: true,
      message: `Deposit of ${amount} ${currency} submitted successfully for compliance verification!`,
      transaction: newTx
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions/withdraw - Request outbound disbursement
transactionRouter.post('/withdraw', (req: Request, res: Response) => {
  try {
    const { amount, currency, destinationAddress, ledgerSource } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid withdrawal amount required' });
    }
    if (!destinationAddress || destinationAddress.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid external receiving wallet address required' });
    }

    const data = db.getData();
    const currentBal = data.balances.USDT || 0;
    if (currentBal < numAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in Liquid Wallet' });
    }

    // Deduct balance
    db.updateBalances({ USDT: currentBal - numAmount });

    const newTx = db.addTransaction({
      id: `tx-wdr-${Date.now().toString(36)}`,
      type: 'withdrawal',
      amount: numAmount,
      currency: currency || 'USDT',
      status: 'pending',
      network: 'Tron (TRC20) / External Gateway',
      recipientOrDetails: `Withdrawal to ${destinationAddress} (${ledgerSource || 'LIQUID'} Ledger) - Compliance Review`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    db.addAuditLog({
      action: 'WITHDRAWAL_REQUESTED',
      actor: data.users[0]?.email || 'user',
      target: newTx.id,
      details: `Withdrawal of ${numAmount} ${currency} requested to ${destinationAddress}`
    });

    return res.json({
      success: true,
      message: `Withdrawal of $${numAmount.toLocaleString()} requested. Status: Pending Compliance Review.`,
      transaction: newTx,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/export-csv
transactionRouter.get('/export-csv', (req: Request, res: Response) => {
  const data = db.getData();
  const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Status', 'Network', 'TX Hash', 'Details'];
  const rows = data.transactions.map(t => [
    `"${t.id}"`,
    `"${t.timestamp}"`,
    `"${t.type}"`,
    t.amount,
    `"${t.currency}"`,
    `"${t.status}"`,
    `"${t.network || 'Internal'}"`,
    `"${t.txHash || ''}"`,
    `"${(t.recipientOrDetails || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=NILE_Ledger_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
  return res.send(csv);
});
