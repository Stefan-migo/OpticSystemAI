-- Migration: Fix cash register closure status and add reopen support
-- This migration:
-- 1. Adds 'closed' status to the CHECK constraint
-- 2. Adds fields to track reopening of cash registers
-- 3. Ensures proper session management

-- ===== UPDATE STATUS CONSTRAINT TO INCLUDE 'closed' =====
ALTER TABLE public.cash_register_closures
  DROP CONSTRAINT IF EXISTS cash_register_closures_status_check;

ALTER TABLE public.cash_register_closures
  ADD CONSTRAINT cash_register_closures_status_check 
  CHECK (status IN ('draft', 'confirmed', 'reviewed', 'closed'));

-- ===== ADD REOPEN TRACKING FIELDS =====
ALTER TABLE public.cash_register_closures
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reopen_notes TEXT;

-- ===== ADD INDEX FOR REOPENED CLOSURES =====
CREATE INDEX IF NOT EXISTS idx_cash_register_closures_reopened 
  ON public.cash_register_closures(reopened_at) 
  WHERE reopened_at IS NOT NULL;

-- ===== UPDATE POS_SESSIONS TO SUPPORT REOPENING =====
-- Add a field to track if session was reopened
ALTER TABLE public.pos_sessions
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0;

-- ===== COMMENT ON NEW FIELDS =====
COMMENT ON COLUMN public.cash_register_closures.reopened_at IS 'Timestamp when the cash register was reopened (superadmin only)';
COMMENT ON COLUMN public.cash_register_closures.reopened_by IS 'User ID who reopened the cash register';
COMMENT ON COLUMN public.cash_register_closures.reopen_count IS 'Number of times this closure has been reopened';
COMMENT ON COLUMN public.cash_register_closures.reopen_notes IS 'Notes about why the cash register was reopened';

COMMENT ON COLUMN public.pos_sessions.reopened_at IS 'Timestamp when the POS session was reopened';
COMMENT ON COLUMN public.pos_sessions.reopened_by IS 'User ID who reopened the session';
COMMENT ON COLUMN public.pos_sessions.reopen_count IS 'Number of times this session has been reopened';
