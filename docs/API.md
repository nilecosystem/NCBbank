# Nile Backend API

Base URL: `/api` (same origin as the app). All bodies are JSON (`Content-Type: application/json`).

Status: **Draft reflecting the current code.** Several endpoints are insecure today. The Known Issues section lists them. Do not treat this API as production-ready.

---

## 1. Conventions

### Response envelope

Every handler returns JSON with a `success` boolean.

- Success: `{ "success": true, "message"?: string, ...payload }`
- Failure: `{ "success": false, "message": string }`

### Status codes used

| Code | Meaning in this API |
|---|---|
| 200 | Success. All successful handlers return 200. |
| 400 | Validation failure or business rule failure (missing field, insufficient balance, duplicate account). |
| 404 | The referenced record (card, position, etc.) does not exist. |
| 500 | Unhandled server error. Body is `{ "success": false, "message": "..." }`. |

No handler returns 201, 401, 403, or 409. Nothing returns a 401 or 403 today because nothing checks authentication.

### Common error examples

```json
{ "success": false, "message": "Account already registered with this email or phone" }
```

```json
{ "success": false, "message": "Insufficient balance in Liquid Wallet to fund card" }
```

---

## 2. Authentication

| Item | Current behavior |
|---|---|
| Token issued by | `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/biometrics/verify` (login/signup only return `token`). |
| Token format | `nile_jwt_` + base64(`<userId>:<timestamp>`). Not signed. |
| Intended header | `Authorization: Bearer <token>` |
| Enforcement | **None.** No route reads or verifies the header. |

Auth labels used in each endpoint below:

- `none enforced`: anyone can call it. This is every endpoint today.
- `intended: bearer`: should require a signed user token once auth is fixed.
- `intended: admin`: should require the admin role once auth is fixed.

---

## 3. Known Issues

These are current behaviors, not intended design. Fix them before launch.

1. **Login ignores passwords.** `POST /api/auth/login` never checks `password`.
2. **Unknown logins fall back to the owner account.** If no match is found, the server returns `data.users[0]`, which is the platform owner (`usr-nile-001`, `super_admin`). The same fallback applies to `reset-password`, `biometrics/verify`, `GET/PUT /api/user/profile`, and `POST /api/user/kyc/submit`.
3. **Self-assignable roles.** `POST /api/auth/signup` accepts `role` from the body.
4. **Demo OTP is always accepted.** `verify-otp` accepts `849201` for any identifier. `send-otp` returns that code in `demoCode`.
5. **Weak credential storage.** Passwords are stored as base64 (`passwordHash`). Tokens are base64 and forgeable.
6. **Mass assignment.** `PUT /api/user/profile` spreads the whole body into the user record, so a caller can set `role`, `kycStatus`, or `passwordHash`. `kyc/submit` spreads `personalData` the same way.
7. **KYC auto-verifies.** `kyc/submit` sets `kycStatus: "verified"` and `kycTier: 3` without review.
8. **No authorization on money or admin routes.** Cards, investments, transactions, treasury, and admin routes do not check who is calling.
9. **Plaintext CVVs.** Cards store and return CVV values.
10. **Non-atomic balance changes.** Card funding and enrollment write balances and records in separate saves. A crash between them can leave them inconsistent.
11. **Unstake has no double-spend guard.** The same position can be unstaked more than once.
12. **Claim never returns zero.** `accrued = accruedReturn || 125.50`, so the `<= 0` check never fires and a placeholder amount is paid.
13. **Unstake always pays USDT.** The payout currency ignores the position's currency.
14. **Deposits are not verified.** `POST /api/transactions/deposit` accepts any `txHash` of 8+ characters and does not check the chain.
15. **Withdrawals debit before approval.** The balance is reduced immediately when a withdrawal is requested.
16. **CSV export is not escaped.** `GET /api/transactions/export-csv` does not guard against spreadsheet formula injection.
17. **Swap uses fixed rates and does not validate assets.** Unknown asset pairs use a rate of 1.0.
18. **Admin overview has hard-coded stats.** `totalTvlUsd`, `totalVolume24hUsd`, and `verifiedClientsCount` are constants. `users` returns every user record, including credential fields.
19. **Storage is a JSON file.** `data/db.json` is not a database and is slated for replacement with Supabase.

---

## 4. Endpoint Index

| Method | Path | Auth (current / intended) | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | none / public | Sign in |
| POST | `/api/auth/signup` | none / public | Create account |
| POST | `/api/auth/send-otp` | none / public | Send one-time code |
| POST | `/api/auth/verify-otp` | none / public | Check one-time code |
| POST | `/api/auth/reset-password` | none / public | Reset password with code |
| POST | `/api/auth/biometrics/verify` | none / public | Verify device biometrics |
| GET | `/api/market/prices` | none / public | Price list |
| GET | `/api/market/ticker/:symbol` | none / public | Price for one symbol |
| GET | `/api/investments/` | none / bearer | List positions |
| GET | `/api/investments/pools` | none / public | List staking pools |
| POST | `/api/investments/enroll` | none / bearer | Enroll in a plan |
| POST | `/api/investments/claim` | none / bearer | Claim rewards |
| POST | `/api/investments/unstake` | none / bearer | Unstake a position |
| GET | `/api/treasury/balances` | none / admin | Ledger balances |
| POST | `/api/treasury/swap` | none / bearer | Swap between assets |
| GET | `/api/transactions/` | none / bearer | List transactions |
| POST | `/api/transactions/deposit` | none / bearer | Record a deposit |
| POST | `/api/transactions/withdraw` | none / bearer | Request a withdrawal |
| GET | `/api/transactions/export-csv` | none / bearer | Export transactions as CSV |
| GET | `/api/cards/` | none / bearer | List cards |
| POST | `/api/cards/issue` | none / bearer | Issue a card |
| POST | `/api/cards/freeze` | none / bearer | Freeze or unfreeze a card |
| POST | `/api/cards/load` | none / bearer | Fund a card from liquid balance |
| GET | `/api/user/profile` | none / bearer | Get profile |
| PUT | `/api/user/profile` | none / bearer | Update profile |
| POST | `/api/user/kyc/submit` | none / bearer | Submit KYC |
| GET | `/api/admin/overview` | none / admin | Admin dashboard summary |
| GET | `/api/admin/audit-logs` | none / admin | Audit log |
| GET | `/api/health` | none / public | Server status (not verified, see section 9) |

---

## 5. Endpoints: Authentication

### POST /api/auth/login

Purpose: Sign in or create an account via email, phone, wallet, Google, or passkey.
Auth: none enforced. Intended: public.

Request body:

```json
{
  "provider": "email | phone | wallet | google | passkey",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional, wallet)",
  "password": "string (ignored by the server, see Known Issues 1)",
  "credentialId": "string (optional, passkey)",
  "role": "string (optional)",
  "name": "string (optional)",
  "avatar": "string (optional)"
}
```

Lookup matches by email, phone, or wallet address. Google and wallet misses create a user. Other misses return the owner account (Known Issues 2).

Success (200):

```json
{
  "success": true,
  "message": "Login successful",
  "token": "nile_jwt_dXNyLTAwMTo...",
  "user": { "id": "usr-nile-001", "email": "owner@nileecosystem.com", "role": "super_admin" }
}
```

Errors: 500 on unhandled failure.

Example:

```bash
curl -X POST https://<host>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"provider":"email","email":"owner@nileecosystem.com","password":"ignored"}'
```

### POST /api/auth/signup

Purpose: Create an account.
Auth: none enforced. Intended: public.

Request body:

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string (currently stored as base64)",
  "provider": "string",
  "address": "string (optional)",
  "role": "string (currently self-assignable, see Known Issues 3)"
}
```

Success (200):

```json
{
  "success": true,
  "message": "Account created",
  "token": "nile_jwt_...",
  "user": { "id": "usr-...", "name": "Ada", "email": "ada@example.com", "role": "client" }
}
```

Errors:

- 400: `{ "success": false, "message": "Account already registered with this email or phone" }`

Example:

```bash
curl -X POST https://<host>/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","phone":"+15550100","password":"secret1","provider":"email","role":"client"}'
```

### POST /api/auth/send-otp

Purpose: Send a one-time code to an email or phone.
Auth: none enforced. Intended: public, rate limited.

Request body:

```json
{ "identifier": "string (required, email or phone)", "channel": "email | sms" }
```

Success (200):

```json
{
  "success": true,
  "message": "Verification code sent",
  "demoCode": "849201",
  "expiresInSeconds": 600
}
```

Note: `demoCode` must be removed before launch (Known Issues 4).

Errors:

- 400: missing `identifier`.

### POST /api/auth/verify-otp

Purpose: Check a one-time code.
Auth: none enforced.

Request body:

```json
{ "identifier": "string (required)", "code": "string (required)" }
```

Accepts `849201` for any identifier, or any active code stored in memory (10-minute expiry).

Success (200):

```json
{ "success": true, "message": "Code verified" }
```

Errors:

- 400: `{ "success": false, "message": "Invalid or expired verification code" }`

### POST /api/auth/reset-password

Purpose: Set a new password.
Auth: none enforced. Intended: requires a valid, unexpired code.

Request body:

```json
{ "identifier": "string (required)", "newPassword": "string (required, min 6 chars)", "code": "string (currently ignored)" }
```

Errors:

- 400: missing identifier, or `newPassword` shorter than 6 characters.

Known issue: falls back to the owner account when the identifier is unknown, and ignores `code`.

Success (200):

```json
{ "success": true, "message": "Password updated" }
```

### POST /api/auth/biometrics/verify

Purpose: Verify a device biometric assertion.
Auth: none enforced.

Request body:

```json
{ "credentialId": "string", "challenge": "string", "biometricType": "face | fingerprint | ..." }
```

Success (200):

```json
{
  "success": true,
  "verified": true,
  "device": "string",
  "enclaveSignature": "string",
  "user": { "id": "usr-nile-001" }
}
```

Known issue: always returns `data.users[0]` and does not check the signature. Treat `verified: true` as unproven.

---

## 6. Endpoints: Market

### GET /api/market/prices

Purpose: Current prices for BTC, ETH, SOL, BNB, TRX (from Binance public 24h tickers, 15s cache) plus NILE (synthetic).
Auth: none (public, intended).

Success (200):

```json
{
  "success": true,
  "data": [{ "symbol": "BTC", "price": 68450.12, "changePercent": 1.2 }],
  "timestamp": "2026-11-07T12:00:00.000Z"
}
```

Errors: fallback values are returned when Binance is unreachable, so this endpoint does not normally return an error.

### GET /api/market/ticker/:symbol

Purpose: Price for one symbol.
Auth: none (public, intended).

Path parameter: `symbol` (for example `BTC`).

Success (200):

```json
{ "success": true, "data": { "symbol": "BTC", "price": 68450.12 } }
```

Note: unknown symbols silently return NILE data instead of 404 (see section 9).

---

## 7. Endpoints: Investments

### GET /api/investments/

Purpose: List the current user's staking positions.
Auth: none enforced. Intended: bearer.

Success (200):

```json
{
  "success": true,
  "positions": [{ "id": "pos-...", "planName": "Core 90", "principal": 1000, "currency": "USDT", "aprPercent": 12, "durationDays": 90, "status": "active" }],
  "totalPrincipalUsd": 1000
}
```

### GET /api/investments/pools

Purpose: List available staking pools.
Auth: none (public, intended).

Success (200):

```json
{ "success": true, "pools": [{ "name": "string", "aprPercent": 12, "durationDays": 90 }] }
```

### POST /api/investments/enroll

Purpose: Lock funds into a plan.
Auth: none enforced. Intended: bearer.

Request body:

```json
{
  "planCategory": "string",
  "planName": "string",
  "principalAmount": 1000,
  "currency": "NILE | USDT",
  "aprPercent": 12,
  "durationDays": 90
}
```

Defaults: `durationDays` 90, `aprPercent` 12.

Success (200):

```json
{
  "success": true,
  "message": "Enrolled successfully",
  "position": { "id": "pos-...", "principal": 1000, "status": "active" },
  "balances": { "USDT": 0, "NILE": 0 }
}
```

Errors:

- 400: principal ≤ 0.
- 400: insufficient balance in the chosen currency (USDT falls back to a 500000 default if missing).

Known issue: deduction and position write are not atomic (section 3, item 10).

### POST /api/investments/claim

Purpose: Claim accrued rewards for a position as NILE.
Auth: none enforced. Intended: bearer.

Request body:

```json
{ "positionId": "pos-..." }
```

Success (200):

```json
{
  "success": true,
  "message": "Rewards claimed",
  "claimedAmount": 125.5,
  "balances": { "NILE": 1125.5 }
}
```

Errors:

- 404: `{ "success": false, "message": "Position not found" }`

Known issue: a placeholder amount of 125.50 is paid when accrual is zero (section 3, item 12).

### POST /api/investments/unstake

Purpose: Withdraw a position's principal before or after maturity.
Auth: none enforced. Intended: bearer.

Request body:

```json
{ "positionId": "pos-...", "reason": "string (optional, currently unused)" }
```

Penalty: 1.5% when the position has not matured.

Success (200):

```json
{
  "success": true,
  "message": "Position unstaked",
  "returnedPrincipal": 985,
  "penaltyFee": 15,
  "balances": { "USDT": 985 }
}
```

Errors:

- 404: position not found.

Known issues: no double-unstake guard; payout is always USDT (section 3, items 11 and 13).

---

## 8. Endpoints: Treasury and Transactions

### GET /api/treasury/balances

Purpose: Ledger balances and total portfolio value.
Auth: none enforced. Intended: admin.

Success (200):

```json
{
  "success": true,
  "ledgers": { "liquid": 500000, "investment": 0, "nileToken": 1250000, "affiliate": 14500 },
  "rawBalances": { "USDT": 500000, "NILE": 1250000 },
  "totalPortfolioUsd": 0
}
```

Known issue: `affiliate` is hard-coded at 14500. Fallbacks are 500000 USDT and 1250000 NILE.

### POST /api/treasury/swap

Purpose: Swap between assets at fixed rates.
Auth: none enforced. Intended: bearer.

Request body:

```json
{ "fromAsset": "USDT | NILE | BTC | ETH", "toAsset": "USDT | NILE | BTC | ETH", "amount": 100 }
```

Fixed rates: USDT to NILE = 1 / 0.12, NILE to USDT = 0.12, BTC to USDT = 68450, ETH to USDT = 3580. Unknown pairs use 1.0.

Success (200):

```json
{
  "success": true,
  "message": "Swap completed",
  "receivedAmount": 833.33,
  "effectiveRate": 8.3333,
  "balances": { "USDT": 0, "NILE": 833.33 }
}
```

Errors:

- 400: amount ≤ 0.
- 400: insufficient `fromAsset` balance.

### GET /api/transactions/

Purpose: List transactions with optional filters.
Auth: none enforced. Intended: bearer.

Query parameters (all optional):

- `category`: `deposits` | `withdrawals` | `staking_rewards`
- `status`: e.g. `pending` | `completed`
- `search`: free text

Success (200):

```json
{
  "success": true,
  "total": 1,
  "transactions": [{ "id": "txn-...", "type": "deposit", "amount": 500, "currency": "USDT", "status": "pending", "txHash": "0xabc12345" }]
}
```

### POST /api/transactions/deposit

Purpose: Record a deposit that is awaiting confirmation.
Auth: none enforced. Intended: bearer. Intended: verify the transaction on chain.

Request body:

```json
{ "amount": 500, "currency": "USDT", "txHash": "string (min 8 chars)", "network": "string" }
```

Success (200):

```json
{ "success": true, "message": "Deposit submitted", "transaction": { "id": "txn-...", "status": "pending" } }
```

Errors:

- 400: amount ≤ 0.
- 400: `txHash` shorter than 8 characters.

Known issue: the transaction hash is not checked on chain (section 3, item 14).

### POST /api/transactions/withdraw

Purpose: Request a withdrawal to an external address.
Auth: none enforced. Intended: bearer.

Request body:

```json
{
  "amount": 100,
  "currency": "USDT",
  "destinationAddress": "string (min 10 chars)",
  "ledgerSource": "liquid | investment | ..."
}
```

Success (200):

```json
{
  "success": true,
  "message": "Withdrawal requested",
  "transaction": { "id": "txn-...", "status": "pending" },
  "balances": { "USDT": 400 }
}
```

Errors:

- 400: amount ≤ 0.
- 400: `destinationAddress` shorter than 10 characters.
- 400: insufficient USDT balance.

### GET /api/transactions/export-csv

Purpose: Download transactions as CSV.
Auth: none enforced. Intended: bearer.

Response: `text/csv` with `Content-Disposition: attachment`.

Known issue: fields are not escaped for spreadsheet formula injection (section 3, item 16).

---

## 9. Endpoints: Cards, User, Admin, Health

### GET /api/cards/

Purpose: List the user's cards.
Auth: none enforced. Intended: bearer.

Success (200):

```json
{
  "success": true,
  "cards": [{ "id": "card-...", "type": "virtual", "tier": "standard", "cardholderName": "Ada", "last4": "4242", "cvv": "123", "status": "active", "balanceUsd": 1000 }]
}
```

Known issue: `cvv` is returned in plaintext (section 3, item 9).

### POST /api/cards/issue

Purpose: Issue a new card.
Auth: none enforced. Intended: bearer.

Request body:

```json
{
  "type": "virtual | physical",
  "tier": "string",
  "cardholderName": "string",
  "isVirtual": true,
  "spendingLimitUsd": 5000
}
```

Success (200):

```json
{ "success": true, "message": "Card issued", "card": { "id": "card-...", "cvv": "456", "balanceUsd": 1000 } }
```

Note: `balanceUsd` is fixed at 1000 regardless of input.

### POST /api/cards/freeze

Purpose: Freeze or unfreeze a card.
Auth: none enforced. Intended: bearer, owner only.

Request body:

```json
{ "cardId": "card-...", "freeze": true }
```

Errors:

- 404: `{ "success": false, "message": "Card not found" }`

Known issue: no ownership check.

### POST /api/cards/load

Purpose: Move funds from the liquid wallet onto a card.
Auth: none enforced. Intended: bearer, owner only.

Request body:

```json
{ "cardId": "card-...", "amount": 100 }
```

Success (200):

```json
{
  "success": true,
  "message": "Card loaded",
  "card": { "id": "card-...", "balanceUsd": 1100 },
  "balances": { "USDT": 400 }
}
```

Errors:

- 400: amount ≤ 0.
- 404: card not found.
- 400: `{ "success": false, "message": "Insufficient balance in Liquid Wallet to fund card" }`

Known issue: the wallet debit and card credit are saved separately (section 3, item 10).

### GET /api/user/profile

Purpose: Get the current user's profile.
Auth: none enforced. Intended: bearer.

Success (200):

```json
{ "success": true, "user": { "id": "usr-...", "name": "Ada", "email": "ada@example.com", "kycStatus": "pending", "kycTier": 0 } }
```

Known issue: returns the owner account when no user context exists (section 3, item 2).

### PUT /api/user/profile

Purpose: Update profile fields.
Auth: none enforced. Intended: bearer. Allowed fields should be an explicit list.

Request body: any fields (currently all are accepted).

Success (200):

```json
{ "success": true, "message": "Profile updated", "user": { "id": "usr-...", "name": "Ada Lovelace" } }
```

Known issue: mass assignment (section 3, item 6).

### POST /api/user/kyc/submit

Purpose: Submit identity information for verification.
Auth: none enforced. Intended: bearer.

Request body:

```json
{
  "documents": "array (currently unused)",
  "personalData": { "legalName": "string", "dateOfBirth": "YYYY-MM-DD", "country": "string" }
}
```

Success (200):

```json
{ "success": true, "message": "KYC submitted", "user": { "kycStatus": "verified", "kycTier": 3 } }
```

Known issues: auto-verifies (section 3, item 7) and spreads `personalData` into the user record (item 6).

### GET /api/admin/overview

Purpose: Admin dashboard data.
Auth: none enforced. Intended: admin role.

Success (200):

```json
{
  "success": true,
  "stats": { "totalTvlUsd": 48500000, "totalVolume24hUsd": 12450000, "verifiedClientsCount": 1420 },
  "users": [{ "id": "usr-nile-001", "email": "owner@nileecosystem.com", "role": "super_admin" }],
  "auditLogs": [{ "action": "USER_LOGIN", "actor": "usr-nile-001", "timestamp": "2026-11-07T12:00:00.000Z" }]
}
```

Known issues: stats are hard-coded, `users` includes credential fields, and `auditLogs` returns only the first 50 entries (section 3, item 18).

### GET /api/admin/audit-logs

Purpose: Full audit log.
Auth: none enforced. Intended: admin role.

Success (200):

```json
{ "success": true, "logs": [{ "action": "USER_LOGIN", "actor": "usr-nile-001", "timestamp": "2026-11-07T12:00:00.000Z" }] }
```

### GET /api/health

Purpose: Liveness check.
Auth: none (public, intended).

The handler was not captured in the last code read, so the response shape below is unverified. Confirm against `server.ts` before publishing.

```json
{ "status": "online", "timestamp": "2026-11-07T12:00:00.000Z" }
```

---

## 10. Template for New Endpoints

Copy this block when the API grows.

```markdown
### METHOD /api/path

Purpose: one sentence describing the user-visible result.
Auth: none enforced | bearer | admin. Note any gap between current and intended.

Request body:
{ "field": "type, required or optional, meaning" }

Success (200):
{ "success": true, ... }

Errors:
- 400: when this happens
- 404: when this happens

Example:
curl -X METHOD https://<host>/api/path -H "Content-Type: application/json" -d '{ ... }'
```

---

## 11. Recommended Tooling for Automatic API Docs

Keep one OpenAPI 3.1 file as the source of truth, then generate everything else from it.

1. **Hand-written or generated OpenAPI spec.** Start with `openapi.yaml`. This is the recommended single source.
   - **swagger-jsdoc:** write `@openapi` comments above each Express route, and it builds the spec at build time. Low effort, good for an existing codebase.
   - **zod-to-openapi:** if request validation is added with Zod, define each schema once and generate the spec from it. Best long-term choice, because docs cannot drift from validation.
2. **Viewer.** Scalar (modern, try-it-out panel) or Swagger UI (familiar). Serve the rendered page from a `/api/docs` route.
3. **Linting.** Redocly CLI (`redocly lint openapi.yaml`) in CI to catch missing responses and bad schemas.
4. **Collections.** Import the spec into Postman or Insomnia to get runnable requests for testing.

Recommendation: adopt Zod validation on each route first, then generate the spec with zod-to-openapi and render with Scalar. Fix the auth issues in section 3 before publishing the spec, because the spec must describe real authentication.

---

## 12. Next Steps

1. Fix the critical items in section 3 (login, owner fallback, auth enforcement, mass assignment, demo OTP).
2. Move storage to Supabase with row-level security (in progress).
3. Generate `openapi.yaml` and wire up a docs viewer.
