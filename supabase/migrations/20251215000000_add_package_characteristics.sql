-- Add package_characteristics column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS package_characteristics TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.products.package_characteristics IS 'Package/container characteristics for biocosmetic products';
