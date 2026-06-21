# Pocketor Backend

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
```

---

## Database Migrations

Run in order inside MySQL Workbench (or `mysql` CLI):

```sql
SOURCE database/schema.sql;
SOURCE database/loan-collections-schema.sql;
SOURCE database/migrations/001_product_configs.sql;
SOURCE database/migrations/002_payments_gateway.sql;
```

To verify:
```sql
SHOW TABLES;
-- Should include: product_configs, feature_flags, ledger_entries, gateway_payments
```

---

## Adding a Sample Product Config

1. Start the server: `npm start`
2. Login to get a JWT token:
   ```
   POST /api/auth/login  { email, password }
   ```
3. Create a config (paste the contents of `database/sample-product-config.json`):
   ```
   POST /api/product-configs
   Authorization: Bearer <token>
   Body: { "name": "Daily Loan - Standard", "json_schema": { ... } }
   ```
4. Approve it:
   ```
   POST /api/product-configs/:id/approve
   ```

---

## Testing the Calc Endpoint

```
POST /api/product-configs/:id/calc
Authorization: Bearer <token>
{
  "principal": 10000,
  "noOfInstalls": 100,
  "interestPerHundred": 20,
  "lineType": "Daily",
  "startDate": "2026-01-10"
}
```

Expected summary output:
```json
{
  "principal": 10000,
  "interestModel": "flat",
  "totalInterest": 2000,
  "processingFee": 100,
  "totalAmount": 12100,
  "installmentAmount": 120,
  "installments": 100,
  "lineType": "daily"
}
```

---

## Testing Payment Webhooks Locally

1. Set `PAYMENT_PROVIDER=razorpay` and fill in `RAZORPAY_*` env vars (use test keys from Razorpay dashboard).
2. Expose local server with [ngrok](https://ngrok.com/):
   ```bash
   ngrok http 3000
   ```
3. Set the ngrok URL as Razorpay webhook URL: `https://<ngrok-id>.ngrok.io/api/payments/webhook`
4. Trigger a test payment in Razorpay test dashboard.
5. Check `gateway_payments` and `ledger_entries` tables for updates.

---

## Rolling Back a Config

```
POST /api/product-configs/:id/archive
```
Then re-activate a previous version by creating a new config with the old `json_schema`.

---

## Feature Flags

Enable product configs or payment gateway per user directly in DB:

```sql
UPDATE feature_flags
SET enabled = TRUE
WHERE user_id = '<user-id>' AND flag_key = 'product_configs_enabled';
```

---

## Sandbox Formula Safety

`calcService.js` uses a hand-rolled recursive-descent AST parser.
Only arithmetic operators (`+`, `-`, `*`, `/`, `%`, `**`) and a whitelist of
`Math` functions (`floor`, `ceil`, `round`, `abs`, `min`, `max`, `pow`, `sqrt`)
are allowed. `eval`, `new Function`, and `vm` are **not used**.

---

## Recommended Payment Providers by Region

| Region        | Provider              | Notes                            |
|---------------|-----------------------|----------------------------------|
| India         | **Razorpay** ✅ (default) | Easy sandbox, UPI, cards, NetBanking |
| Africa        | Paystack / Flutterwave | Paystack simpler for Nigeria/Ghana  |
| Global/EU     | Stripe                | Best docs, 3DS2 built-in         |
| South Asia    | Razorpay / Stripe     | Both supported                   |

To switch provider: set `PAYMENT_PROVIDER=stripe` in `.env` and add `STRIPE_*` keys.
