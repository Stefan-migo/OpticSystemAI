# PayPal Payment Integration Plan - Opttius SaaS

This document outlines the strategy, technical design, and implementation steps for integrating PayPal payments into the Opttius SaaS platform using the **PayPal REST SDK (Orders V2 API)**.

## 1. Why PayPal?

PayPal is one of the most trusted and widely used payment methods globally. It provides:

- **Trust**: High brand recognition and buyer protection.
- **Convenience**: One-click payments for users with PayPal accounts.
- **Security**: Robust fraud detection and secondary authentication.
- **Card Processing**: Option for users to pay with credit/debit cards without a PayPal account.

## 2. Technical Architecture

### 2.1 Integration Strategy

Since Opttius uses a custom billing logic where tiers and prorations are calculated on the server, we will use the **Orders V2 API (Checkout)** instead of the Subscription API for better control over the initial payment and upgrade/downgrade amounts.

### 2.2 Extended Gateway Implementation

The `PayPalGateway` class (already implemented in `src/lib/payments/paypal/gateway.ts`) implements the `IPaymentGateway` interface.

- **Intent**: `CAPTURE` (Immediate payment).
- **Flow**:
  1. Frontend calls `/api/checkout/create-intent` with `gateway: "paypal"`.
  2. Backend calls PayPal Orders API to create a pending order.
  3. PayPal returns an `approve` link.
  4. Backend returns `approvalUrl` to Frontend.
  5. Frontend redirects the user to PayPal.
  6. After approval, the user returns to `/checkout/result`.
  7. PayPal sends a webhook (`CHECKOUT.ORDER.COMPLETED`) to confirm the capture.

### 2.3 Data Model Integration

- **Gateway Name**: `paypal`
- **Metadata**: Stores the PayPal Order ID and Payer ID.
- **Status Mapping**:
  - `APPROVED` -> `pending`
  - `COMPLETED` / `CAPTURED` -> `succeeded`
  - `VOIDED` / `FAILED` -> `failed`

## 3. Implementation Steps

### Phase 1: Environment Setup

- Register at [PayPal Developer](https://developer.paypal.com).
- Create a REST API app in the Sandbox for development and Live for production.
- Configure Environment Variables:
  ```env
  PAYPAL_CLIENT_ID=your_client_id
  PAYPAL_CLIENT_SECRET=your_client_secret
  PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com # Use api-m.paypal.com for production
  PAYPAL_WEBHOOK_ID=your_webhook_id # For signature verification
  ```

### Phase 2: Webhook Security

- Implement signature verification for webhooks in `src/lib/payments/paypal/gateway.ts`.
- Use the `PAYPAL-AUTH-ALGO`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-SIG`, and `PAYPAL-TRANSMISSION-TIME` headers to verify requests from PayPal.

### Phase 3: Redirect Handling

- Ensure `src/app/checkout/result/page.tsx` handles the `orderId` parameter returned by PayPal's `return_url`.
- Add a confirmation step on the result page to show the transaction status.

### Phase 4: UI Integration

- Update `src/components/checkout/CheckoutPageContent.tsx`.
- Enable the PayPal card in the payment method selection.
- Update the "Pay" button to reflect the PayPal flow.

## 4. Security Considerations

- **Webhook Verification**: Mandatory in production to prevent "man-in-the-middle" status updates.
- **Server-Side Validation**: Never trust the amount sent from the client; always recalculate on the server.
- **Idempotency**: Use the PayPal Order ID as a unique key to prevent duplicate processing.

## 5. Future Enhancements

- **PayPal Subscriptions**: For automated recurring billing without manual intervention.
- **Vaulting**: Save PayPal accounts for one-click future renewals (if supported by the target region).
