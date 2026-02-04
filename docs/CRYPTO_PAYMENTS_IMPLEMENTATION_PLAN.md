# Crypto Payment Integration Plan - Opttius SaaS

This document outlines the strategy, technical design, and implementation steps for integrating cryptocurrency payments into the Opttius SaaS platform using **NOWPayments**.

## 1. Why NOWPayments?

After researching multiple gateways (Coinbase Commerce, BitPay, CoinGate, etc.), NOWPayments was selected for the following reasons:

- **Low Fees**: Competitive flat fee (usually 0.5% - 1%).
- **Broad Currency Support**: Supports 300+ cryptocurrencies.
- **Auto-Conversion**: Built-in fiat conversion to stablecoins (USDT/USDC).
- **Developer Friendly**: Excellent REST API and Sandbox environment.
- **Custodial/Non-Custodial**: Flexible payout options.

## 2. Technical Architecture

### 2.1 Extension of Payment Factory

The existing `PaymentGatewayFactory` will be extended to include the `nowpayments` type.

- **New Type**: Add `"nowpayments"` to `PaymentGatewayType`.
- **New Gateway Class**: Implement `NowPaymentsGateway` implementing `IPaymentGateway`.

### 2.2 Data Model Changes

The `payments` table in Supabase already has a `gateway` field. No schema changes are required as we will store `"nowpayments"` in that column. Metadata will store the specific crypto used and the network.

### 2.3 Workflow: Payment Flow

1. **Selection**: User selects "Cryptocurrency" in the checkout UI.
2. **Intent Creation**: Frontend calls `/api/checkout/create-intent` with `gateway: "nowpayments"`.
3. **Gateway Call**: `NowPaymentsGateway` calls the NOWPayments API to create a payment.
4. **Redirect/Invoice**: NOWPayments returns an `invoice_url` or `payment_id`. For best UX, we will use the Hosted Invoice.
5. **Async Processing**: The user pays on the NOWPayments hosted page.
6. **Webhook (IPN)**: NOWPayments sends a POST request to `/api/webhooks/nowpayments` when the status changes (e.g., `finished`).
7. **Confirmation**: The webhook updates the payment record in Supabase and triggers the subscription activation.

## 3. Implementation Steps

### Phase 1: Environment Setup

- Register at [NOWPayments.io](https://nowpayments.io).
- Generate API Key (Mainnet) and IPN Secret.
- Set up Sandbox account for development.
- Add environment variables:
  ```env
  NOWPAYMENTS_API_KEY=your_api_key
  NOWPAYMENTS_IPN_SECRET=your_secret
  NOWPAYMENTS_SANDBOX_API_KEY=your_sandbox_key
  ```

### Phase 2: Core Gateway Logic

- Create `src/lib/payments/nowpayments/gateway.ts`.
- Implement `createPaymentIntent`: This will call `POST /v1/payment` or `POST /v1/invoice`.
- Implement `confirmPayment`: Minimal logic as confirmation is async via webhooks.

### Phase 3: Webhook Implementation

- Create `src/app/api/webhooks/nowpayments/route.ts`.
- Implement signature verification using `NOWPAYMENTS_IPN_SECRET`.
- Update Supabase payment status based on NOWPayments status:
  - `finished` -> `completed`
  - `failed` / `expired` -> `failed`
  - `partially_paid` -> Handle as partial (or require full amount).

### Phase 4: UI Integration

- Update `src/components/checkout/CheckoutPageContent.tsx`.
- Add a new "Crypto" card to the payment method selection.
- Handle the redirect to the `invoice_url` returned by the API.

## 4. Security Considerations

- **IPN Validation**: Mandatory validation of the IPN signature to prevent fraudulent status updates.
- **SSL**: Webhooks must be served over HTTPS.
- **Logging**: Detailed logging of all gateway interactions for auditing.

## 5. Timeline (Estimated)

| Task                   | Effort           |
| :--------------------- | :--------------- |
| Gateway Implementation | 4-6 hours        |
| Webhook & Logic        | 3-4 hours        |
| UI/UX Integration      | 2-3 hours        |
| Testing & QA           | 4 hours          |
| **Total**              | **~15-18 hours** |
