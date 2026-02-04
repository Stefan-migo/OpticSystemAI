# 🚀 Quick Start Guide: NOWPayments Crypto Integration

Get your cryptocurrency payment integration up and running in 5 minutes!

## Prerequisites

- ✅ NOWPayments account ([Sign up here](https://nowpayments.io))
- ✅ Node.js 18+ installed
- ✅ Opttius project cloned and dependencies installed

## Step 1: Get Your API Keys (2 minutes)

### Sandbox (Testing)

1. Go to [NOWPayments Sandbox](https://account-sandbox.nowpayments.io/)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Sandbox API Key**
4. Go to **Settings** → **IPN**
5. Copy your **IPN Secret**

### Production (When ready)

1. Go to [NOWPayments Dashboard](https://account.nowpayments.io/)
2. Complete KYC verification
3. Generate production API keys
4. Copy IPN secret

## Step 2: Configure Environment (1 minute)

Run the interactive setup script:

```bash
node scripts/setup-nowpayments.js
```

Or manually add to `.env.local`:

```bash
# NOWPayments Configuration
NOWPAYMENTS_SANDBOX_MODE=true
NOWPAYMENTS_SANDBOX_API_KEY=your_sandbox_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
```

## Step 3: Set Up Webhook URL (1 minute)

### For Local Development

1. Start ngrok tunnel:

```bash
npm run tunnel
```

2. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

3. Update `.env.local`:

```bash
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
```

4. Configure in NOWPayments Dashboard:
   - Go to **Settings** → **IPN**
   - Set IPN Callback URL: `https://abc123.ngrok-free.app/api/webhooks/nowpayments`
   - Save settings

### For Production

Set your production domain:

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Configure webhook in NOWPayments:

```
https://your-domain.com/api/webhooks/nowpayments
```

## Step 4: Start the Application (30 seconds)

```bash
npm run dev
```

Your app is now running at `http://localhost:3000`

## Step 5: Test the Integration (30 seconds)

1. Navigate to `/checkout`
2. Select a subscription tier
3. Choose **"Cripto"** as payment method
4. Click **"Pagar con Cripto"**
5. You'll be redirected to NOWPayments invoice page
6. In sandbox mode, use the dashboard to simulate payment

## 🧪 Testing Checklist

- [ ] Invoice creation works
- [ ] Redirect to NOWPayments page successful
- [ ] Webhook receives IPN notifications
- [ ] Payment status updates in database
- [ ] Subscription activates on successful payment

## 🔍 Verify Installation

### Check Webhook Endpoint

```bash
curl http://localhost:3000/api/webhooks/nowpayments
```

Expected response:

```json
{
  "status": "ok",
  "message": "NOWPayments webhook endpoint is active"
}
```

### Check Payment Gateway

```bash
# In your browser console or API client
fetch('/api/checkout/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10,
    currency: 'USD',
    gateway: 'nowpayments',
    subscription_tier: 'pro'
  })
})
```

## 📊 Monitor Payments

### View Logs

```bash
# Watch application logs
npm run dev

# Look for:
# ✓ NOWPayments invoice created
# ✓ NOWPayments webhook received
# ✓ Payment updated successfully
```

### Check Database

```sql
-- View recent crypto payments
SELECT id, status, amount, gateway, metadata, created_at
FROM payments
WHERE gateway = 'nowpayments'
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Problem**: NOWPayments sends webhook but nothing happens

**Solution**:

1. Verify ngrok is running: `npm run tunnel`
2. Check `NEXT_PUBLIC_BASE_URL` matches ngrok URL
3. Confirm webhook URL in NOWPayments dashboard
4. Check application logs for errors

### Signature Verification Failed

**Problem**: Webhook returns "Invalid IPN signature"

**Solution**:

1. Verify `NOWPAYMENTS_IPN_SECRET` is correct
2. Check for extra spaces in `.env.local`
3. Ensure IPN secret matches dashboard

### API Key Invalid

**Problem**: "401 Unauthorized" when creating invoice

**Solution**:

1. Verify API key is correct
2. Check sandbox mode matches key type:
   - Sandbox mode = Sandbox API key
   - Production mode = Production API key
3. Regenerate API key if needed

## 📚 Next Steps

1. **Read the docs**: `src/lib/payments/nowpayments/README.md`
2. **Run tests**: `npm test nowpayments`
3. **Review security**: Check signature verification
4. **Test scenarios**: Try failed/expired payments
5. **Go live**: Switch to production keys

## 🎯 Production Deployment

Before going live:

- [ ] Complete NOWPayments KYC verification
- [ ] Generate production API keys
- [ ] Set `NOWPAYMENTS_SANDBOX_MODE=false`
- [ ] Update webhook URL to production domain
- [ ] Test with small real payment
- [ ] Monitor first transactions closely
- [ ] Set up error alerting

## 💡 Tips

- **Start with sandbox**: Always test in sandbox first
- **Small amounts**: Test with minimum payment amounts
- **Monitor webhooks**: Watch logs for IPN delivery
- **Keep secrets safe**: Never commit API keys to git
- **Use HTTPS**: Webhooks require HTTPS in production

## 🆘 Need Help?

- **Documentation**: `docs/CRYPTO_PAYMENTS_IMPLEMENTATION_SUMMARY.md`
- **Testing Guide**: `docs/CRYPTO_PAYMENTS_TESTING_GUIDE.md`
- **NOWPayments Docs**: https://documenter.getpostman.com/view/7907941/S1a32n38
- **Support**: support@nowpayments.io

---

**Estimated Setup Time**: 5 minutes  
**Difficulty**: Easy ⭐  
**Status**: Production Ready ✅

Happy crypto payments! 🚀💰
