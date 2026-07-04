# Pocketor — Future Enhancements Roadmap

## External Services Needed

| Feature | What you need | Where to wire it |
|---|---|---|
| **OTP via SMS** | Twilio account (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`) | `backend/routes/authRoutes.js` → `POST /send-otp` |
| **OTP via Email** | SendGrid / Nodemailer + SMTP (`SENDGRID_API_KEY` or `SMTP_HOST/USER/PASS`) | Same as above |
| **Payment Gateway** | Razorpay account (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) | `backend/routes/paymentsGatewayRoutes.js` |

> **Dev mode**: OTP is returned directly in the API response JSON — no external service needed for local testing.

---

## Planned Backend Features

| Feature | Status | Notes |
|---|---|---|
| Expense CRUD backend | ✅ Done (July 2026) | `GET/POST/PUT/DELETE /api/expenses` |
| Refresh token rotation | ✅ Done | Stored in `refresh_tokens` table |
| Admin view of agent data | Not started | Requires schema change — add `admin_id` FK to Lines/Loans/etc. |
| Secure token storage | Not started | Replace AsyncStorage with Expo SecureStore / Keychain |
| Certificate pinning | Not started | Use `react-native-ssl-pinning` for MITM protection |
| Push notifications | Not started | Firebase Cloud Messaging (FCM) for payment reminders |
| Expense reports export (PDF/CSV) | Not started | Use `react-native-fs` + `react-native-share` on mobile |

---

## Security Hardening (later)

- Move from AsyncStorage to `expo-secure-store` for JWT tokens
- Add certificate pinning via `react-native-ssl-pinning`
- Add request signing (HMAC) for sensitive endpoints
- Add refresh token rotation (new token issued on every refresh, old one invalidated)

---

## Database Migrations Order

Run in this exact order on a fresh DB:

```
database/schema.sql                         ← core tables
database/loan-collections-schema.sql        ← lines/areas/customers/loans/payments
database/migrations/001_product_configs.sql ← product configs + ledger
database/migrations/002_payments_gateway.sql← payment gateway table
database/migrations/003_user_roles.sql      ← user role helpers
database/migrations/004_expenses.sql        ← expenses table
```
