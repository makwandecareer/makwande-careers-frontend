# Makwande Careers World-Class Payment Backend

This package adds a production-oriented Paystack billing system for:

- **R45 one-time access for 14 days**
- **R300 recurring monthly premium**
- Server-side transaction verification
- Idempotent payment fulfilment
- Signed Paystack webhooks
- Subscription cancellation at period end
- Subscription reactivation
- Payment-method management links
- Payment history
- Automatic expiry
- Admin reconciliation
- PostgreSQL models and migration SQL
- Billing audit logs
- Safe card metadata storage only: brand and last four digits

## Install

Copy the package into the backend repository root and run:

```cmd
cd /d E:\Makwande_Careers_Backend\makwande-Careers-backend
install-worldclass-billing.cmd
python -m pip install -r requirements.txt
```

Copy `.env.billing.example` values into `.env`.

## Required environment variables

```env
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_PREMIUM_PLAN_CODE=PLN_...
FRONTEND_URL=http://localhost:3000
BILLING_CRON_SECRET=
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://...
```

Never commit real keys.

## API endpoints

- `GET /api/billing/plans`
- `GET /api/billing/subscription`
- `GET /api/billing/payments`
- `POST /api/billing/checkout`
- `POST /api/billing/verify`
- `POST /api/billing/cancel`
- `POST /api/billing/reactivate`
- `GET /api/billing/manage-payment-method`
- `POST /api/billing/webhook`
- `POST /api/billing/internal/expire-subscriptions`
- `POST /api/billing/internal/reconcile`

## Paystack webhook

Set:

```text
https://makwande-careers-backend.onrender.com/api/billing/webhook
```

## Render scheduled expiry

Call daily:

```text
POST /api/billing/internal/expire-subscriptions
Header: X-Billing-Cron-Secret: YOUR_SECRET
```

## Important

Paystack monthly subscriptions bill on the recurring calendar schedule determined by Paystack. The local 30-day period is used as a temporary access window and is updated from Paystack invoice webhooks when available.

Rotate any Paystack secret key that was exposed in chat or screenshots before accepting real money.
