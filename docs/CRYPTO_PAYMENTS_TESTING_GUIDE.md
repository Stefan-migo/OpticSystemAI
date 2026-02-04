# Crypto Payments Testing Guide - Opttius SaaS

This guide provides instructions for testing the cryptocurrency payment integration, specifically for the **NOWPayments** gateway.

## 1. Prerequisites

- **Local Tunnel**: Since NOWPayments needs to send webhooks to your local environment, use `ngrok` or similar.
  ```bash
  ngrok http 3000
  ```
- **Sandbox API Key**: Ensure you have a NOWPayments Sandbox API key configured in `.env.local`.
- **Crypto Wallet**: A testnet wallet (e.g., Metamask on Sepolia or a BTC testnet wallet) or simply use the NOWPayments Sandbox dashboard to simulate payments.

## 2. Test Cases

### TC-01: Intent Creation

- **Action**: In the Checkout page, select "Crypto" and click "Proceed".
- **Expected Result**:
  - A new record appears in the `payments` table with `gateway: "nowpayments"` and `status: "pending"`.
  - The browser redirects to the NOWPayments Hosted Invoice page.
  - The `gateway_payment_intent_id` is correctly stored in the record.

### TC-02: Successful Payment (Webhook)

- **Action**: Use the NOWPayments Sandbox dashboard to simulate a `finished` status for a `payment_id`. Alternatively, send a mocked IPN request to `/api/webhooks/nowpayments`.
- **Expected Result**:
  - The payment record status updates to `completed`.
  - The user's subscription in `admin_users` or `subscriptions` table is activated/updated.
  - An entry is added to the activity log.

### TC-03: Failed/Expired Payment

- **Action**: Simulate an `expired` status from the gateway.
- **Expected Result**:
  - The payment record status updates to `failed`.
  - The user is notified (via UI or email if implemented).
  - No subscription changes are made.

### TC-04: Partially Paid Error

- **Action**: Simulate a `partially_paid` status.
- **Expected Result**:
  - The system logs a warning.
  - The payment remains `pending` or marks as `partially_paid` in metadata.
  - No subscription activation occurs until full payment.

## 3. Mocking Webhooks (Local Testing)

You can use `curl` to test the webhook endpoint without a real gateway call:

```bash
curl -X POST http://localhost:3000/api/webhooks/nowpayments \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: MOCKED_SIGNATURE_IF_BYPASS_ENABLED" \
  -d '{
    "payment_id": "123456",
    "payment_status": "finished",
    "pay_address": "0x...",
    "price_amount": 10000,
    "price_currency": "usd",
    "pay_amount": 0.05,
    "pay_currency": "eth",
    "order_id": "PAYMENT_RECORD_ID",
    "order_description": "Opttius Pro Subscription"
  }'
```

## 4. Verification in Supabase

Run the following SQL to verify payment status:

```sql
SELECT id, status, amount, gateway, metadata
FROM payments
WHERE gateway = 'nowpayments'
ORDER BY created_at DESC
LIMIT 5;
```

## 5. Troubleshooting

- **Webhook not arriving**: Check if `ngrok` is running and the URL is correctly configured in the NOWPayments dashboard.
- **Signature Verification Failed**: Ensure `NOWPAYMENTS_IPN_SECRET` matches exactly what is in the dashboard.
- **Unauthorized (401)**: Ensure the API key is passed correctly in the `x-api-key` header for outgoing requests.
