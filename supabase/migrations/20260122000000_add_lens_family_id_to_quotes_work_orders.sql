-- Migration: Add lens_family_id to quotes and work_orders
-- This allows tracking which lens family was used for price calculation

-- Add lens_family_id to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL;

-- Add lens_family_id to lab_work_orders table
ALTER TABLE public.lab_work_orders
ADD COLUMN IF NOT EXISTS lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_lens_family_id ON public.quotes(lens_family_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_lens_family_id ON public.lab_work_orders(lens_family_id);

-- Comments
COMMENT ON COLUMN public.quotes.lens_family_id IS 'Referencia a la familia de lentes usada para calcular el precio (opcional)';
COMMENT ON COLUMN public.lab_work_orders.lens_family_id IS 'Referencia a la familia de lentes usada para calcular el precio (opcional)';
