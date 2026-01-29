-- Migration: Add customer_name field to orders table
-- This allows storing customer name for easier identification in POS sales
-- especially for unregistered customers

-- Add customer_name column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add comment
COMMENT ON COLUMN public.orders.customer_name IS 'Nombre completo del cliente para identificación rápida en ventas POS. Puede ser de cliente registrado o no registrado.';
