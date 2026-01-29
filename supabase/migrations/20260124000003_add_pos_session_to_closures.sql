-- Migration: Add pos_session_id to cash_register_closures table
-- Links cash register closures to POS sessions for reopening capability

ALTER TABLE public.cash_register_closures
  ADD COLUMN IF NOT EXISTS pos_session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_cash_register_closures_pos_session_id 
  ON public.cash_register_closures(pos_session_id);

-- Comment
COMMENT ON COLUMN public.cash_register_closures.pos_session_id IS 'References the POS session that was closed in this cash register closure';
