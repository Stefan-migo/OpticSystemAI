# NOWPayments Integration - Opttius SaaS

## Overview

This directory contains the implementation of cryptocurrency payment processing using **NOWPayments** as the payment gateway. NOWPayments enables users to pay for their Opttius subscriptions using 300+ cryptocurrencies including Bitcoin, Ethereum, USDT, and more.

## Features

- ✅ **Multi-Currency Support**: Accept 300+ cryptocurrencies
- ✅ **Hosted Invoice Pages**: Secure, pre-built payment UI
- ✅ **Auto-Conversion**: Optional conversion to stablecoins (USDT/USDC)
- ✅ **IPN Webhooks**: Real-time payment status updates
- ✅ **Signature Verification**: HMAC-SHA512 webhook validation
- ✅ **Sandbox Mode**: Full testing environment support
- ✅ **Low Fees**: Competitive 0.5% - 1% transaction fees

## Architecture

### Gateway Implementation

The `NowPaymentsGateway` class implements the `IPaymentGateway` interface:

```typescript
class NowPaymentsGateway implements IPaymentGateway {
  createPaymentIntent(): Promise<PaymentIntentResponse>;
  processWebhookEvent(request: NextRequest): Promise<WebhookEvent>;
  mapStatus(nowpaymentsStatus: string): PaymentStatus;
}
```

### Payment Flow

1. **User Selection**: User selects "Crypto" payment method in checkout
2. **Invoice Creation**: System creates a NOWPayments invoice via API
3. **Redirect**: User is redirected to NOWPayments hosted invoice page
4. **Payment**: User completes payment using their preferred cryptocurrency
5. **IPN Callback**: NOWPayments sends webhook to `/api/webhooks/nowpayments`
6. **Verification**: System verifies webhook signature
7. **Update**: Payment status is updated in database
8. **Activation**: Subscription is activated upon successful payment

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# NOWPayments API Configuration
NOWPAYMENTS_API_KEY=your_production_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_key
NOWPAYMENTS_SANDBOX_API_KEY=your_sandbox_api_key
NOWPAYMENTS_SANDBOX_MODE=true  # Set to false for production
```

### Getting API Keys

1. Sign up at [NOWPayments.io](https://nowpayments.io)
2. Navigate to **Settings** → **API Keys**
3. Generate a new API key
4. Copy the IPN Secret from **Settings** → **IPN**
5. For sandbox testing, use the sandbox dashboard

### Webhook Configuration

1. In NOWPayments dashboard, go to **Settings** → **IPN**
2. Set IPN Callback URL to: `https://your-domain.com/api/webhooks/nowpayments`
3. Enable IPN notifications
4. Copy the IPN Secret to your environment variables

⚠️ **Important**: The webhook URL must be HTTPS in production. For local development, use `ngrok`:

```bash
npm run tunnel
# Copy the HTTPS URL and update NEXT_PUBLIC_BASE_URL
```

## API Reference

### Create Payment Intent

**Endpoint**: `POST /api/checkout/create-intent`

**Request Body**:

```json
{
  "amount": 10000,
  "currency": "USD",
  "gateway": "nowpayments",
  "subscription_tier": "pro"
}
```

**Response**:

```json
{
  "paymentId": "uuid-v4",
  "invoiceUrl": "https://nowpayments.io/payment/invoice_id",
  "gatewayPaymentIntentId": "invoice_id",
  "status": "pending"
}
```

### Webhook Handler

**Endpoint**: `POST /api/webhooks/nowpayments`

**Headers**:

- `x-nowpayments-sig`: HMAC-SHA512 signature

**Payload Example**:

```json
{
  "payment_id": "123456",
  "invoice_id": "invoice_123",
  "payment_status": "finished",
  "price_amount": 100,
  "price_currency": "USD",
  "pay_amount": 0.05,
  "pay_currency": "BTC",
  "order_id": "order_123"
}
```

## Status Mapping

| NOWPayments Status | Opttius Status | Description                                |
| ------------------ | -------------- | ------------------------------------------ |
| `waiting`          | `pending`      | Awaiting payment                           |
| `confirming`       | `pending`      | Payment received, confirming on blockchain |
| `sending`          | `pending`      | Sending to merchant wallet                 |
| `finished`         | `succeeded`    | Payment completed successfully             |
| `confirmed`        | `succeeded`    | Payment confirmed                          |
| `failed`           | `failed`       | Payment failed                             |
| `expired`          | `failed`       | Payment expired                            |
| `refunded`         | `failed`       | Payment refunded                           |
| `partially_paid`   | `pending`      | Partial payment received                   |

## Testing

### Unit Tests

Run the gateway unit tests:

```bash
npm test src/__tests__/unit/lib/payments/nowpayments-gateway.test.ts
```

### Integration Tests

Run the webhook integration tests:

```bash
npm test src/__tests__/integration/api/webhooks/nowpayments.test.ts
```

### Manual Testing with Sandbox

1. Set `NOWPAYMENTS_SANDBOX_MODE=true`
2. Use sandbox API key
3. Start ngrok: `npm run tunnel`
4. Update `NEXT_PUBLIC_BASE_URL` with ngrok URL
5. Create a test payment in the app
6. Use NOWPayments sandbox dashboard to simulate payment statuses

### Mock Webhook Testing

Test webhook locally with curl:

```bash
curl -X POST http://localhost:3000/api/webhooks/nowpayments \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: test_signature" \
  -d '{
    "payment_id": "123456",
    "payment_status": "finished",
    "price_amount": 100,
    "price_currency": "USD",
    "pay_amount": 0.05,
    "pay_currency": "BTC",
    "order_id": "your_payment_record_id"
  }'
```

## Security Considerations

### IPN Signature Verification

All webhooks are verified using HMAC-SHA512:

```typescript
const hmac = crypto.createHmac("sha512", IPN_SECRET);
hmac.update(rawPayload);
const calculatedSignature = hmac.digest("hex");
```

⚠️ **Never disable signature verification in production!**

### Best Practices

1. ✅ Always use HTTPS for webhooks
2. ✅ Verify IPN signatures on every webhook
3. ✅ Log all gateway interactions for auditing
4. ✅ Use environment-specific API keys
5. ✅ Never expose API keys in client-side code
6. ✅ Implement rate limiting on webhook endpoints
7. ✅ Handle idempotency for duplicate webhooks

## Troubleshooting

### Webhook Not Arriving

- ✅ Check ngrok is running: `npm run tunnel`
- ✅ Verify webhook URL in NOWPayments dashboard
- ✅ Check `NEXT_PUBLIC_BASE_URL` matches ngrok URL
- ✅ Ensure webhook endpoint is accessible via HTTPS

### Signature Verification Failed

- ✅ Verify `NOWPAYMENTS_IPN_SECRET` matches dashboard
- ✅ Check for whitespace in environment variable
- ✅ Ensure raw body is used for signature calculation

### Payment Status Not Updating

- ✅ Check webhook logs in application
- ✅ Verify payment record exists in database
- ✅ Check `order_id` in webhook matches payment record ID
- ✅ Review error logs for database update failures

### API Errors (401 Unauthorized)

- ✅ Verify API key is correct
- ✅ Check sandbox mode matches API key type
- ✅ Ensure `x-api-key` header is included in requests

## Support

For NOWPayments-specific issues:

- Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
- Support: support@nowpayments.io
- Status Page: https://status.nowpayments.io/

For Opttius integration issues:

- Check application logs
- Review test cases
- Contact development team

## Future Enhancements

- [ ] Support for specific cryptocurrency selection
- [ ] Multi-currency pricing display
- [ ] Automatic refund handling
- [ ] Payment analytics dashboard
- [ ] Recurring crypto subscriptions
- [ ] Lightning Network support

## License

This integration is part of the Opttius SaaS platform.
