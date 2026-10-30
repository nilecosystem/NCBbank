// Real Nile Institutional Backend API Client

const BASE = import.meta.env.VITE_API_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(BASE + endpoint, {
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
    console.warn(`[Nile API] Request to ${BASE + endpoint} failed or offline:`, err);
    return null;
  }
}

export const api = {
  checkHealth: () => request('/api/health'),
  getMarketPrices: () => request('/api/market/prices'),

  login: (payload: any) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  signup: (payload: any) => request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  sendOtp: (identifier: string, channel: string = 'sms') => request('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, channel })
  }),

  verifyOtp: (identifier: string, code: string) => request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, code })
  }),

  resetPassword: (payload: any) => request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  verifyBiometrics: (payload: any) => request('/api/auth/biometrics/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getUserProfile: () => request('/api/user/profile'),
  updateUserProfile: (data: any) => request('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  submitKyc: (payload: any) => request('/api/user/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getTreasuryBalances: () => request('/api/treasury/balances'),
  executeSwap: (fromAsset: string, toAsset: string, amount: number) => request('/api/treasury/swap', {
    method: 'POST',
    body: JSON.stringify({ fromAsset, toAsset, amount })
  }),

  getInvestments: () => request('/api/investments'),
  getStakingPools: () => request('/api/investments/pools'),
  enrollInvestment: (payload: any) => request('/api/investments/enroll', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  claimRewards: (positionId: string) => request('/api/investments/claim', {
    method: 'POST',
    body: JSON.stringify({ positionId })
  }),
  unstakePosition: (positionId: string, reason?: string) => request('/api/investments/unstake', {
    method: 'POST',
    body: JSON.stringify({ positionId, reason })
  }),

  getTransactions: (params?: { category?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request(`/api/transactions${q ? '?' + q : ''}`);
  },

  submitDeposit: (payload: { amount: number; currency: string; txHash: string; network?: string }) => request('/api/transactions/deposit', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  requestWithdrawal: (payload: { amount: number; currency: string; destinationAddress: string; ledgerSource?: string }) => request('/api/transactions/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getCards: () => request('/api/cards'),
  issueCard: (payload: any) => request('/api/cards/issue', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  toggleCardFreeze: (cardId: string, freeze: boolean) => request('/api/cards/freeze', {
    method: 'POST',
    body: JSON.stringify({ cardId, freeze })
  }),
  loadCard: (cardId: string, amount: number) => request('/api/cards/load', {
    method: 'POST',
    body: JSON.stringify({ cardId, amount })
  }),

  getAdminOverview: () => request('/api/admin/overview')
};
