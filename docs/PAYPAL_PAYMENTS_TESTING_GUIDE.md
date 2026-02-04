# PayPal Payments Testing Guide - Opttius SaaS

This guide provides instructions for testing the PayPal payment integration using the Sandbox environment.

## 1. Prerequisites

- **PayPal Developer Account**: Sign up at [developer.paypal.com](https://developer.paypal.com).
- **Sandbox Accounts**:
  - **Business Account**: To receive payments (configured in your `.env.local`).
  - **Personal Account**: To simulate a buyer.
- **Local Tunnel**: Use `ngrok` to receive webhooks if testing end-to-end flow locally.

## 2. Test Cases

### TC-01: Order Creation (Standard Flow)

- **Action**: In Checkout, select "PayPal" and click "Proceed".
- **Expected Result**:
  - Backend creates a PayPal Order.
  - User is redirected to `https://www.sandbox.paypal.com/checkoutnow?token=...`.
  - A payment record is created in Supabase with `gateway: "paypal"` and `status: "pending"`.

### TC-02: User Cancels Payment

- **Action**: On the PayPal login/payment page, click "Cancel and return to Opttius".
- **Expected Result**:
  - Redirected back to `/checkout/result?success=0`.
  - The UI shows a "Payment Cancelled" message.
  - The payment record remains in `pending` or marked as `failed` (if logic implemented).

### TC-03: Successful Capture (Webhook Simulation)

- **Action**: Complete the purchase in the sandbox UI or simulate the `CHECKOUT.ORDER.COMPLETED` webhook.
- **Expected Result**:
  - Webhook endpoint receives the event.
  - The payment record status in Supabase updates to `succeeded`.
  - The subscription is activated for the user organization.

### TC-04: Insufficient Funds / Bank Decline

- **Action**: In the PayPal Sandbox, use a "Negative Testing" amount or a test card designed to decline.
- **Expected Result**:
  - PayPal returns an error or fails the capture.
  - The system logs the failure.
  - The UI informs the user and allows them to try another payment method.

## 3. Mocking Webhooks (Development)

You can use the following payload to test your `/api/webhooks/paypal` endpoint:

```json
{
  "id": "WH-MOCKED-EVENT-ID",
  "event_type": "CHECKOUT.ORDER.COMPLETED",
  "resource": {
    "id": "PAYPAL_ORDER_ID_HERE",
    "status": "COMPLETED",
    "purchase_units": [
      {
        "reference_id": "YOUR_LOCAL_PAYMENT_ID",
        "amount": {
          "currency_code": "CLP",
          "value": "15000"
        },
        "custom_id": "ORG_ID_HERE"
      }
    ]
  }
}
```

## 4. Environment Verification

Ensure your `.env.local` contains:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com`

## 5. Sandbox Tools

Use the [PayPal Sandbox Dashboard](https://www.sandbox.paypal.com) to:

- Verify that money "moved" between test accounts.
- View transaction details and logs.
- Simulate different IPN/Webhook responses.
