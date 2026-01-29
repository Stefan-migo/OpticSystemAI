-- Migration: Add cancellation_reason to orders table
-- Documents the reason for cancelling an order

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Comment
COMMENT ON COLUMN public.orders.cancellation_reason IS 'Reason for cancelling the order, documented by admin';
