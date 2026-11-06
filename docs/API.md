# Nile Backend API

Base URL: `/api` (same origin as the app).

## Conventions

- Request and response bodies are JSON (`Content-Type: application/json`).
- Success responses include `success: true`. Failures include `success: false` and a `message`.
- Server errors return HTTP `500` with `{ "success": false, "message": "..." }`.
- Duplicate signup returns HTTP `400` with `{ "success": false, "message": "Account already registered with this email or phone" }`.

## Authentication

- `POST /api/auth/login` returns a `token` string. Send it on later requests as `Authorization: Bearer <token>` (intended behavior; the server does not currently check it).
- **Current state:** tokens are unsigned base64 strings and are not verified by any route. Treat all endpoints below as unauthenticated until this is fixed.

## Known issues (fix before production)

1. **Login does not check passwords.** `POST /api/auth/login` ignores `password`.
2. **Unmatched logins fall back to the owner account.** If no user matches, the server returns `data.users[0]` (the platform owner). Any unknown email or phone signs in as the owner.
3. **Google and wallet login create accounts without verification.** Unknown Google or wallet identities are created on the fly with `kycStatus` set to `verified` (Google) or `pending` (wallet).
4. **Tokens are forgeable.** The token is `base64(userId:timestamp)`.
5. **Data is stored in a JSON file** (`data/db.json`), not a database.

## Endpoint index

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server status |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/send-otp` | Send one-time code |
| POST | `/api/auth/verify-otp` | Check one-time code |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/biometrics/verify` | Verify device biometrics |
| GET | `/api/market/prices` | Price list |
| GET | `/api/market/ticker/:symbol` | Price for one symbol |
| GET | `/api/investments/` | List positions |
| GET | `/api/investments/pools` | List staking pools |
| POST | `/api/investments/enroll` | Enroll in a plan |
| POST | `/api/investments/claim` | Claim rewards |
| POST | `/api/investments/unstake` | Unstake |
| GET | `/api/treasury/balances` | Balances |
| POST | `/api/treasury/swap` | Swap between currencies |
| GET | `/api/transactions/` | List transactions |
| POST | `/api/transactions/deposit` | Record deposit |
| POST | `/api/transactions/withdraw` | Record withdrawal |
| GET | `/api/transactions/export-csv` | Export transactions as CSV |
| GET | `/api/cards/` | List cards |
| POST | `/api/cards/issue` | Issue card |
| POST | `/api/cards/freeze` | Freeze or unfreeze card |
| POST | `/api/cards/load` | Load card balance |
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update profile |
| POST | `/api/user/kyc/submit` | Submit KYC |
| GET | `/api/admin/overview` | Admin dashboard summary |
| GET | `/api/admin/audit-logs` | Audit log |

## Endpoint template

Copy this block for each endpoint and fill it in.

```
### METHOD /api/path

Purpose: one sentence.
Auth: none | bearer token | admin role.

Request body:
{ "field": "type, required or optional, meaning" }

Success (200):
{ "success": true, ... }

Errors:
- 400: when this happens
- 500: { "success": false, "message": "..." }

Example:
curl -X METHOD https://<host>/api/path -H "Content-Type: application/json" -d '{ ... }'
```

## Endpoint details

Details are pending verification. Fields below are from code reading and need confirming against each handler before publishing.

### POST /api/auth/login
Auth: none (currently not enforced).
Request: `provider` (`email` | `phone` | `wallet` | `google` | `passkey`), plus `email`, `phone`, `address`, `password`, `name`, `avatar`.
Success: `{ success, message, token, user }`.

### POST /api/auth/signup
Request: `name`, `email`, `phone`, `password`, `provider`, `address`, `role`.
Errors: `400` if email or phone already registered.

### GET /api/health
Success: `{ status: "online", timestamp, engine }`.

## Recommended tooling

- **Swagger / OpenAPI:** write `openapi.yaml` by hand now, or generate it with `swagger-jsdoc` from comments. Render with Swagger UI or Redocly.
- **Scalar** or **Redoc**: nicer hosted docs from an OpenAPI file.
- **Postman:** import the OpenAPI file to get runnable collections.
- **zod-to-openapi:** if request validation is added with zod, generate the spec from the same schemas.

Start with the OpenAPI file once the auth issues above are fixed, since the spec will need to describe the real authentication.
