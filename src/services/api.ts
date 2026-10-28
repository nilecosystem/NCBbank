// Real Nile Institutional Backend API Client

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `API error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[Nile API] Request to ${endpoint} failed or offline:`, err);
    return null;
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string }>('/api/health'),

  // Market & Crypto Prices
  getMarketPrices: () => request<{ success: boolean; data: Record<string, any> }>('/api/market/prices'),

  // Auth
  login: (payload: any) => request<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  signup: (payload: any) => request<any>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  sendOtp: (identifier: string, channel: string = 'sms') => request<any>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, channel })
  }),

  verifyOtp: (identifier: string, code: string) => request<any>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, code })
  }),

  resetPassword: (payload: any) => request<any>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  verifyBiometrics: (payload: any) => request<any>('/api/auth/biometrics/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // User Profile & KYC
  getUserProfile: () => request<any>('/api/user/profile'),
  updateUserProfile: (data: any) => request<any>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  submitKyc: (payload: any) => request<any>('/api/user/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Treasury & 4-Ledger Accounting
  getTreasuryBalances: () => request<any>('/api/treasury/balances'),
  executeSwap: (fromAsset: string, toAsset: string, amount: number) => request<any>('/api/treasury/swap', {
    method: 'POST',
    body: JSON.stringify({ fromAsset, toAsset, amount })
  }),

  // Investments & Staking
  getInvestments: () => request<any>('/api/investments'),
  getStakingPools: () => request<any>('/api/investments/pools'),
  enrollInvestment: (payload: any) => request<any>('/api/investments/enroll', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  claimRewards: (positionId: string) => request<any>('/api/investments/claim', {
    method: 'POST',
    body: JSON.stringify({ positionId })
  }),
  unstakePosition: (positionId: string, reason?: string) => request<any>('/api/investments/unstake', {
    method: 'POST',
    body: JSON.stringify({ positionId, reason })
  }),

  // Transactions
  getTransactions: (params?: { category?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any>(`/api/transactions${q ? '?' + q : ''}`);
  },
  submitDeposit: (payload: { amount: number; currency: string; txHash: string; network?: string }) => request<any>('/api/transactions/deposit', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  requestWithdrawal: (payload: { amount: number; currency: string; destinationAddress: string; ledgerSource?: string }) => request<any>('/api/transactions/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Cards
  getCards: () => request<any>('/api/cards'),
  issueCard: (payload: any) => request<any>('/api/cards/issue', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  toggleCardFreeze: (cardId: string, freeze: boolean) => request<any>('/api/cards/freeze', {
    method: 'POST',
    body: JSON.stringify({ cardId, freeze })
  }),
  loadCard: (cardId: string, amount: number) => request<any>('/api/cards/load', {
    method: 'POST',
    body: JSON.stringify({ cardId, amount })
  }),

  // Admin
  getAdminOverview: () => request<any>('/api/admin/overview')
};
