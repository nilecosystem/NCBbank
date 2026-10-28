import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const cardRouter = Router();

// GET /api/cards
cardRouter.get('/', (req: Request, res: Response) => {
  const data = db.getData();
  return res.json({
    success: true,
    cards: data.cards
  });
});

// POST /api/cards/issue
cardRouter.post('/issue', (req: Request, res: Response) => {
  try {
    const { type, tier, cardholderName, isVirtual, spendingLimitUsd } = req.body;
    const data = db.getData();

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCard = db.addCard({
      id: `card-${Date.now().toString(36)}`,
      type: type || 'visa',
      tier: tier || 'black_elite',
      cardholderName: (cardholderName || data.users[0]?.name || 'VALUED CLIENT').toUpperCase(),
      cardNumber: `•••• •••• •••• ${randomDigits}`,
      expiryDate: '12/29',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      isVirtual: Boolean(isVirtual),
      isFrozen: false,
      spendingLimitUsd: Number(spendingLimitUsd || 50000),
      currentSpentUsd: 0,
      balanceUsd: 1000,
      perTransactionLimitUsd: 10000,
      allowAtm: true,
      allowInternational: true,
      allowOnline: true
    });

    db.addAuditLog({
      action: 'CARD_ISSUED',
      actor: data.users[0]?.email || 'user',
      target: newCard.id,
      details: `Issued new ${newCard.tier} ${newCard.type.toUpperCase()} card for ${newCard.cardholderName}`
    });

    return res.json({
      success: true,
      message: 'Corporate Crypto Card issued and provisioned successfully!',
      card: newCard
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cards/freeze
cardRouter.post('/freeze', (req: Request, res: Response) => {
  try {
    const { cardId, freeze } = req.body;
    const card = db.updateCard(cardId, { isFrozen: Boolean(freeze) });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    db.addAuditLog({
      action: freeze ? 'CARD_FROZEN' : 'CARD_UNFROZEN',
      actor: 'user',
      target: cardId,
      details: `Card status updated to ${freeze ? 'FROZEN' : 'ACTIVE'}`
    });

    return res.json({
      success: true,
      message: `Card ${freeze ? 'frozen' : 'unfrozen'} successfully`,
      card
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cards/load
cardRouter.post('/load', (req: Request, res: Response) => {
  try {
    const { cardId, amount } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid reload amount required' });
    }

    const data = db.getData();
    const card = data.cards.find(c => c.id === cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const currentBal = data.balances.USDT || 0;
    if (currentBal < numAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in Liquid Wallet to fund card' });
    }

    // Deduct from liquid wallet, add to card
    db.updateBalances({ USDT: currentBal - numAmount });
    const updated = db.updateCard(cardId, { balanceUsd: card.balanceUsd + numAmount });

    db.addTransaction({
      id: `tx-card-load-${Date.now().toString(36)}`,
      type: 'card_load',
      amount: numAmount,
      currency: 'USD',
      status: 'confirmed',
      network: 'Visa / Mastercard Treasury Gateway',
      recipientOrDetails: `Funded Corporate Card (${card.cardNumber}) from Liquid Ledger`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    return res.json({
      success: true,
      message: `Loaded $${numAmount.toLocaleString()} to card ${card.cardNumber}`,
      card: updated,
      balances: db.getData().balances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
