-- Migration: Add gateway_plan_id to subscription_tiers (Phase C - Recurring)
-- Stores Mercado Pago PreApproval Plan id for recurring subscriptions

ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS gateway_plan_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscription_tiers_gateway_plan
  ON public.subscription_tiers(gateway_plan_id) WHERE gateway_plan_id IS NOT NULL;

COMMENT ON COLUMN public.subscription_tiers.gateway_plan_id IS 'Mercado Pago PreApproval Plan id for recurring billing (optional)';
