-- Migration: Add gateway_payment_method_id to subscriptions (Phase C - Save payment method)
-- Stores Mercado Pago card id for saved card / recurring billing

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS gateway_payment_method_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_payment_method
  ON public.subscriptions(gateway_payment_method_id) WHERE gateway_payment_method_id IS NOT NULL;

COMMENT ON COLUMN public.subscriptions.gateway_payment_method_id IS 'Gateway saved card/payment method ID (e.g. Mercado Pago card id for recurring)';
