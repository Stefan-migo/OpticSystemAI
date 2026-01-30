-- Script to fix cash register closure status constraint
-- Run this directly in your Supabase SQL editor or via psql
-- This adds 'closed' to the allowed status values

-- Drop the existing constraint
ALTER TABLE public.cash_register_closures
  DROP CONSTRAINT IF EXISTS cash_register_closures_status_check;

-- Recreate the constraint with 'closed' included
ALTER TABLE public.cash_register_closures
  ADD CONSTRAINT cash_register_closures_status_check 
  CHECK (status IN ('draft', 'confirmed', 'reviewed', 'closed'));

-- Verify the constraint was created correctly
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'cash_register_closures_status_check'
AND conrelid = 'public.cash_register_closures'::regclass;
