import fs from 'fs';
import path from 'path';

export interface StorageData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    phone?: string;
    accountNumber: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    kycTier: number;
    kycSubmittedAt?: string;
    kycApprovedAt?: string;
    referralCode: string;
    rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    badges: string[];
    twoFactorEnabled: boolean;
    registeredAt: string;
    avatarUrl?: string;
    authProvider?: 'google' | 'wallet' | 'phone' | 'passkey' | 'email';
    walletAddress?: string;
    passkeyRegistered?: boolean;
    biometric2FAEnabled?: boolean;
    biometricType?: string;
    biometricDeviceName?: string;
    passwordHash?: string;
  }>;
  balances: {
    USD: number;
    EUR: number;
    GBP: number;
    BTC: number;
    ETH: number;
    USDT: number;
    TRX: number;
    NILE: number;
    SOL: number;
    AED: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'failed' | 'rejected';
    network?: string;
    txHash?: string;
    recipientOrDetails?: string;
    timestamp: string;
  }>;
  investments: Array<{
    id: string;
    planCategory: string;
    planName: string;
    principalAmount: number;
    currency: string;
    aprPercent: number;
    durationDays: number;
    startDate: string;
    maturityDate: string;
    accruedReturn: number;
    status: 'active' | 'completed' | 'withdrawn';
    lastYieldAccruedAt?: string;
  }>;
  cards: Array<{
    id: string;
    type: 'visa' | 'mastercard';
    cardholderName: string;
    tier: 'standard' | 'metal' | 'black_elite';
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    isVirtual: boolean;
    isFrozen: boolean;
    spendingLimitUsd: number;
    currentSpentUsd: number;
    balanceUsd: number;
    perTransactionLimitUsd: number;
    allowAtm: boolean;
    allowInternational: boolean;
    allowOnline: boolean;
  }>;
  stakingPools: Array<{
    id: string;
    title: string;
    lockDays: number;
    baseAprPercent: number;
    multiplier: number;
    minDepositNile: number;
    maxDepositNile: number;
    totalStakedInPool: number;
    isFeatured: boolean;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    actor: string;
    target: string;
    details: string;
    timestamp: string;
    ipAddress?: string;
  }>;
  supportTickets: Array<{
    id: string;
    userEmail: string;
    subject: string;
    messages: Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }>;
    status: 'open' | 'resolved';
    createdAt: string;
  }>;
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');

const INITIAL_DB_DATA: StorageData = {
  users: [
    {
      id: 'usr-nile-001',
      name: 'Matin Parsa',
      email: 'owner@nileecosystem.com',
      role: 'super_admin',
      phone: '+44 7558 847468',
      accountNumber: 'NCB-84291647',
      address: '10 Downing Street, Westminster',
      city: 'London',
      postalCode: 'SW1A 2AA',
      country: 'United Kingdom',
      kycStatus: 'verified',
      kycTier: 3,
      kycSubmittedAt: '2026-01-15',
      kycApprovedAt: '2026-01-16',
      referralCode: 'NILE-PARSA-2026',
      rank: 'Diamond',
      badges: ['badge-pioneer', 'badge-bullion', 'badge-highroller', 'badge-community', 'badge-diamond'],
      twoFactorEnabled: true,
      registeredAt: '2026-01-10',
      avatarUrl: '/default-avatar.jpg',
      authProvider: 'email',
      passkeyRegistered: true,
      biometric2FAEnabled: true,
      biometricType: 'FaceID',
      biometricDeviceName: 'Apple Secure Enclave FIDO2'
    }
  ],
  balances: {
    USD: 2000000.00,
    EUR: 450000.00,
    GBP: 320000.00,
    BTC: 14.50,
    ETH: 120.00,
    USDT: 500000.00,
    TRX: 185000.00,
    NILE: 1250000.00,
    SOL: 850.00,
    AED: 250000.00
  },
  transactions: [
    {
      id: 'tx-101',
      type: 'deposit',
      amount: 25000,
      currency: 'USDT',
      status: 'confirmed',
      network: 'Tron (TRC20)',
      txHash: '0x3f9b8c7e1a4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
      recipientOrDetails: 'Direct Treasury Liquidity Provision',
      timestamp: '2026-04-18 10:14'
    },
    {
      id: 'tx-104',
      type: 'staking_claim',
      amount: 2450,
      currency: 'NILE',
      status: 'confirmed',
      network: 'Nile Smart Chain',
      recipientOrDetails: 'Staking Reward Payout: 180-Day Institutional Reserve (APR 24%)',
      txHash: '0x7b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      timestamp: '2026-04-17 18:30'
    },
    {
      id: 'tx-105',
      type: 'withdrawal',
      amount: 3500,
      currency: 'USDT',
      status: 'confirmed',
      network: 'Tron (TRC20)',
      recipientOrDetails: 'Disbursement to External TRC20 Wallet (Liquid Ledger)',
      txHash: '0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2109876543',
      timestamp: '2026-04-16 15:45'
    },
    {
      id: 'tx-106',
      type: 'deposit',
      amount: 0.75,
      currency: 'BTC',
      status: 'confirmed',
      network: 'Bitcoin (Native SegWit)',
      recipientOrDetails: 'Cold Custody Treasury Inflow',
      txHash: 'btc-tx-7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      timestamp: '2026-04-15 11:20'
    },
    {
      id: 'tx-107',
      type: 'staking_claim',
      amount: 1800,
      currency: 'NILE',
      status: 'confirmed',
      network: 'Nile Smart Chain',
      recipientOrDetails: 'Staking Reward Payout: Diamond Apex Staking Pool (APR 28.5%)',
      txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      timestamp: '2026-04-14 09:00'
    },
    {
      id: 'tx-108',
      type: 'withdrawal',
      amount: 1200,
      currency: 'USDT',
      status: 'confirmed',
      network: 'Visa / Banking Gateway',
      recipientOrDetails: 'Disbursement to Corporate Black Elite Virtual Card',
      txHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
      timestamp: '2026-04-13 16:10'
    }
  ],
  investments: [
    {
      id: 'inv-pos-101',
      planCategory: 'asset',
      planName: 'USDT Asset-Backed Yield Vault',
      principalAmount: 25000,
      currency: 'USDT',
      aprPercent: 14.5,
      durationDays: 180,
      startDate: '2026-01-15',
      maturityDate: '2026-07-14',
      accruedReturn: 1785.42,
      status: 'active'
    },
    {
      id: 'inv-pos-102',
      planCategory: 'time',
      planName: '90 Days Strategic Horizon',
      principalAmount: 10000,
      currency: 'USDT',
      aprPercent: 12.0,
      durationDays: 90,
      startDate: '2026-02-01',
      maturityDate: '2026-05-02',
      accruedReturn: 821.90,
      status: 'active'
    },
    {
      id: 'inv-pos-103',
      planCategory: 'nile_benefits',
      planName: 'NILE Token Diamond Multiplier Vault',
      principalAmount: 50000,
      currency: 'NILE',
      aprPercent: 22.0,
      durationDays: 365,
      startDate: '2026-01-10',
      maturityDate: '2027-01-10',
      accruedReturn: 3013.70,
      status: 'active'
    }
  ],
  cards: [
    {
      id: 'card-1',
      type: 'visa',
      cardholderName: 'MATIN PARSA',
      tier: 'black_elite',
      cardNumber: '•••• •••• •••• 8492',
      expiryDate: '12/29',
      cvv: '842',
      isVirtual: false,
      isFrozen: false,
      spendingLimitUsd: 100000,
      currentSpentUsd: 14250,
      balanceUsd: 35750,
      perTransactionLimitUsd: 25000,
      allowAtm: true,
      allowInternational: true,
      allowOnline: true
    },
    {
      id: 'card-2',
      type: 'mastercard',
      cardholderName: 'MATIN PARSA',
      tier: 'metal',
      cardNumber: '•••• •••• •••• 3147',
      expiryDate: '08/28',
      cvv: '915',
      isVirtual: true,
      isFrozen: false,
      spendingLimitUsd: 25000,
      currentSpentUsd: 3820,
      balanceUsd: 11180,
      perTransactionLimitUsd: 10000,
      allowAtm: false,
      allowInternational: true,
      allowOnline: true
    }
  ],
  stakingPools: [
    {
      id: 'pool-daily',
      title: 'Daily Spot Liquidity Pool',
      lockDays: 1,
      baseAprPercent: 4.5,
      multiplier: 1.0,
      minDepositNile: 500,
      maxDepositNile: 50000,
      totalStakedInPool: 1250000,
      isFeatured: false
    },
    {
      id: 'pool-30d',
      title: 'Monthly Yield Reserve',
      lockDays: 30,
      baseAprPercent: 9.0,
      multiplier: 1.2,
      minDepositNile: 1000,
      maxDepositNile: 250000,
      totalStakedInPool: 4850000,
      isFeatured: false
    },
    {
      id: 'pool-90d',
      title: '90-Day Strategic Vault',
      lockDays: 90,
      baseAprPercent: 12.0,
      multiplier: 1.5,
      minDepositNile: 2500,
      maxDepositNile: 1000000,
      totalStakedInPool: 9800000,
      isFeatured: true
    },
    {
      id: 'pool-180d',
      title: '180-Day Institutional Reserve',
      lockDays: 180,
      baseAprPercent: 14.5,
      multiplier: 1.8,
      minDepositNile: 5000,
      maxDepositNile: 5000000,
      totalStakedInPool: 16500000,
      isFeatured: true
    },
    {
      id: 'pool-365d',
      title: 'Diamond Apex 1-Year Horizon',
      lockDays: 365,
      baseAprPercent: 17.5,
      multiplier: 2.0,
      minDepositNile: 10000,
      maxDepositNile: 10000000,
      totalStakedInPool: 24500000,
      isFeatured: true
    }
  ],
  auditLogs: [
    {
      id: 'audit-1',
      action: 'SYSTEM_BOOT',
      actor: 'system',
      target: 'treasury',
      details: 'Nile 4-Ledger Accounting Engine initialized with multi-sig security.',
      timestamp: '2026-04-18 00:00:00',
      ipAddress: '127.0.0.1'
    }
  ],
  supportTickets: []
};

class StorageManager {
  private data: StorageData;

  constructor() {
    this.data = this.load();
  }

  private load(): StorageData {
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database from disk, using fallback initialization:', err);
    }
    this.save(INITIAL_DB_DATA);
    return INITIAL_DB_DATA;
  }

  public save(dataToSave?: StorageData): void {
    try {
      if (dataToSave) {
        this.data = dataToSave;
      }
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  public getData(): StorageData {
    return this.data;
  }

  public updateUser(partialUser: Partial<StorageData['users'][0]> & { id: string }) {
    const idx = this.data.users.findIndex(u => u.id === partialUser.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...partialUser };
    } else {
      this.data.users.push(partialUser as any);
    }
    this.save();
    return this.data.users[idx >= 0 ? idx : this.data.users.length - 1];
  }

  public addTransaction(tx: StorageData['transactions'][0]) {
    this.data.transactions.unshift(tx);
    this.save();
    return tx;
  }

  public addInvestment(inv: StorageData['investments'][0]) {
    this.data.investments.unshift(inv);
    this.save();
    return inv;
  }

  public updateBalances(balances: Partial<StorageData['balances']>) {
    this.data.balances = { ...this.data.balances, ...balances };
    this.save();
    return this.data.balances;
  }

  public updateCard(cardId: string, partial: Partial<StorageData['cards'][0]>) {
    const idx = this.data.cards.findIndex(c => c.id === cardId);
    if (idx >= 0) {
      this.data.cards[idx] = { ...this.data.cards[idx], ...partial };
      this.save();
      return this.data.cards[idx];
    }
    return null;
  }

  public addCard(card: StorageData['cards'][0]) {
    this.data.cards.push(card);
    this.save();
    return card;
  }

  public addAuditLog(entry: Omit<StorageData['auditLogs'][0], 'id' | 'timestamp'>) {
    const newEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(newEntry);
    this.save();
    return newEntry;
  }
}

export const db = new StorageManager();
