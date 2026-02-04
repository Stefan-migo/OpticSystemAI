# NOWPayments Production Deployment Checklist

Use this checklist to ensure a smooth deployment of cryptocurrency payments to production.

## Pre-Deployment (Development/Staging)

### ✅ Account Setup

- [ ] NOWPayments account created and verified
- [ ] KYC verification completed
- [ ] Business information submitted
- [ ] Payout wallet configured

### ✅ API Configuration

- [ ] Production API keys generated
- [ ] IPN Secret obtained
- [ ] API keys tested in sandbox
- [ ] Webhook URL configured in dashboard

### ✅ Code Review

- [ ] All NOWPayments code reviewed
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No hardcoded credentials
- [ ] Error handling implemented
- [ ] Logging configured

### ✅ Testing

- [ ] Unit tests pass (`npm test nowpayments`)
- [ ] Integration tests pass
- [ ] Sandbox payments tested end-to-end
- [ ] Webhook signature verification tested
- [ ] Failed payment scenarios tested
- [ ] Expired payment scenarios tested
- [ ] Partially paid scenarios tested

### ✅ Security

- [ ] IPN signature verification enabled
- [ ] HTTPS enforced for webhooks
- [ ] API keys stored in environment variables
- [ ] No sensitive data in logs
- [ ] Rate limiting configured
- [ ] CORS properly configured

### ✅ Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Troubleshooting guide created
- [ ] Runbook prepared for operations team

---

## Deployment Day

### 🔧 Environment Configuration

#### 1. Update Environment Variables

```bash
# Production .env
NOWPAYMENTS_SANDBOX_MODE=false
NOWPAYMENTS_API_KEY=prod_api_key_here
NOWPAYMENTS_IPN_SECRET=prod_ipn_secret_here
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

#### 2. Verify Environment

- [ ] `NOWPAYMENTS_SANDBOX_MODE=false`
- [ ] Production API key configured
- [ ] Production IPN secret configured
- [ ] Production base URL configured
- [ ] Webhook URL uses HTTPS

#### 3. NOWPayments Dashboard Configuration

- [ ] Webhook URL updated: `https://your-domain.com/api/webhooks/nowpayments`
- [ ] IPN notifications enabled
- [ ] Payout settings configured
- [ ] Auto-conversion settings (if desired)

### 🚀 Deployment Steps

#### 1. Deploy Application

```bash
# Build for production
npm run build

# Deploy to hosting platform
# (Vercel, AWS, etc.)
```

#### 2. Verify Deployment

- [ ] Application accessible at production URL
- [ ] Webhook endpoint accessible
- [ ] Health check passes: `GET /api/webhooks/nowpayments`

#### 3. Test Webhook Connectivity

```bash
# From NOWPayments dashboard, send test IPN
# Or use curl:
curl https://your-domain.com/api/webhooks/nowpayments
```

Expected response:

```json
{
  "status": "ok",
  "message": "NOWPayments webhook endpoint is active"
}
```

### 🧪 Production Testing

#### Test Payment Flow

1. [ ] Navigate to checkout page
2. [ ] Select crypto payment method
3. [ ] Create test payment (small amount)
4. [ ] Verify redirect to NOWPayments
5. [ ] Complete payment
6. [ ] Verify webhook received
7. [ ] Verify payment status updated
8. [ ] Verify subscription activated

#### Monitor First Transactions

- [ ] Watch application logs
- [ ] Monitor webhook delivery
- [ ] Check database updates
- [ ] Verify email notifications (if configured)

---

## Post-Deployment

### 📊 Monitoring Setup

#### Application Monitoring

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Log aggregation setup
- [ ] Webhook delivery monitoring
- [ ] Payment success rate tracking

#### Alerts Configuration

- [ ] Failed payment alerts
- [ ] Webhook delivery failures
- [ ] API error rate alerts
- [ ] Signature verification failures

### 📈 Analytics

#### Metrics to Track

- [ ] Payment success rate
- [ ] Average payment time
- [ ] Popular cryptocurrencies
- [ ] Conversion rate (crypto vs traditional)
- [ ] Failed payment reasons

#### Dashboard Setup

- [ ] Payment analytics dashboard
- [ ] Real-time payment monitoring
- [ ] Revenue tracking by payment method

### 🔍 Health Checks

#### Daily Checks (First Week)

- [ ] Review payment logs
- [ ] Check webhook delivery rate
- [ ] Monitor error rates
- [ ] Review customer feedback

#### Weekly Checks

- [ ] Analyze payment trends
- [ ] Review failed payments
- [ ] Check API performance
- [ ] Update documentation if needed

---

## Rollback Plan

### If Issues Occur

#### Immediate Actions

1. [ ] Disable crypto payment option in UI
2. [ ] Redirect users to alternative payment methods
3. [ ] Notify operations team
4. [ ] Document the issue

#### Rollback Steps

```bash
# Option 1: Disable in UI only
# Update CheckoutPageContent.tsx to hide crypto option

# Option 2: Full rollback
git revert <commit-hash>
npm run build
# Deploy previous version
```

#### Communication

- [ ] Notify affected users
- [ ] Update status page
- [ ] Communicate with NOWPayments support
- [ ] Document root cause

---

## Maintenance

### Regular Tasks

#### Weekly

- [ ] Review payment logs
- [ ] Check for failed webhooks
- [ ] Monitor API performance
- [ ] Review customer support tickets

#### Monthly

- [ ] Analyze payment trends
- [ ] Review and optimize conversion rates
- [ ] Update documentation
- [ ] Security audit

#### Quarterly

- [ ] Review API integration
- [ ] Update dependencies
- [ ] Performance optimization
- [ ] Feature enhancements planning

---

## Support Contacts

### NOWPayments

- **Email**: support@nowpayments.io
- **Status Page**: https://status.nowpayments.io/
- **Documentation**: https://documenter.getpostman.com/view/7907941/S1a32n38

### Internal Team

- **DevOps**: [contact]
- **Backend Team**: [contact]
- **Support Team**: [contact]
- **On-Call**: [contact]

---

## Success Criteria

### Launch Success Indicators

- [ ] ✅ Zero critical errors in first 24 hours
- [ ] ✅ Webhook delivery rate > 99%
- [ ] ✅ Payment success rate > 95%
- [ ] ✅ No security incidents
- [ ] ✅ Positive user feedback

### Week 1 Goals

- [ ] 📊 Process at least 10 crypto payments
- [ ] 📊 Maintain 99%+ uptime
- [ ] 📊 Zero data loss incidents
- [ ] 📊 Customer satisfaction > 4.5/5

---

## Sign-Off

### Pre-Deployment Approval

- [ ] **Technical Lead**: ********\_******** Date: **\_\_\_**
- [ ] **Security Team**: ********\_******** Date: **\_\_\_**
- [ ] **Product Owner**: ********\_******** Date: **\_\_\_**

### Post-Deployment Verification

- [ ] **DevOps**: ********\_******** Date: **\_\_\_**
- [ ] **QA Lead**: ********\_******** Date: **\_\_\_**
- [ ] **Support Lead**: ********\_******** Date: **\_\_\_**

---

## Notes

### Deployment Date: ****\_\_****

### Deployed By: ****\_\_****

### Version: ****\_\_****

### Issues Encountered:

```
[Document any issues here]
```

### Lessons Learned:

```
[Document lessons learned]
```

---

**Last Updated**: February 3, 2026  
**Version**: 1.0.0  
**Status**: Ready for Production ✅
