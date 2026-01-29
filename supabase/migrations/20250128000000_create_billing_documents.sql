-- Migration: Create Billing Documents System
-- This migration creates tables and functions for managing invoices (boletas/facturas)
-- Supports both internal tickets and SII-integrated documents
-- Note: Orders table already has document_type, internal_folio, sii_folio fields
-- This table provides a more complete document management system

-- ===== CREATE BILLING_DOCUMENTS TABLE =====
CREATE TABLE IF NOT EXISTS public.billing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document identification
  document_type TEXT NOT NULL CHECK (document_type IN ('boleta', 'factura', 'internal_ticket')),
  folio TEXT NOT NULL, -- Internal folio (e.g., TKT-000001, BOL-000001)
  sii_folio TEXT, -- SII folio (when integrated with SII)
  
  -- Related order
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  
  -- Customer information (snapshot at time of emission)
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT, -- For unregistered customers
  customer_rut TEXT, -- RUT at time of emission
  customer_email TEXT,
  customer_address TEXT,
  
  -- Document status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'emitted', 'accepted', 'rejected', 'cancelled')),
  sii_status TEXT, -- SII status: 'pending', 'accepted', 'rejected', 'cancelled'
  sii_status_detail TEXT, -- Details from SII response
  
  -- Financial information
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CLP',
  
  -- PDF and files
  pdf_url TEXT, -- URL to PDF file in storage
  xml_url TEXT, -- URL to XML file (for SII)
  
  -- SII integration fields
  sii_track_id TEXT, -- SII tracking ID
  sii_response_data JSONB, -- Full SII API response
  sii_emission_date TIMESTAMPTZ, -- When document was sent to SII
  
  -- Customization
  custom_header_text TEXT, -- Custom text for header
  custom_footer_text TEXT, -- Custom text for footer
  logo_url TEXT, -- URL to logo image
  
  -- Metadata
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  emitted_at TIMESTAMPTZ, -- When document was emitted
  emitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_documents_order_id ON public.billing_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_branch_id ON public.billing_documents(branch_id);
CREATE INDEX IF NOT EXISTS idx_billing_documents_folio ON public.billing_documents(folio);
CREATE INDEX IF NOT EXISTS idx_billing_documents_sii_folio ON public.billing_documents(sii_folio) WHERE sii_folio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_documents_status ON public.billing_documents(status);
CREATE INDEX IF NOT EXISTS idx_billing_documents_document_type ON public.billing_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_billing_documents_created_at ON public.billing_documents(created_at DESC);

-- ===== CREATE BILLING_DOCUMENT_ITEMS TABLE =====
-- Stores line items for each billing document
CREATE TABLE IF NOT EXISTS public.billing_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_document_id UUID NOT NULL REFERENCES public.billing_documents(id) ON DELETE CASCADE,
  
  -- Item information
  line_number INTEGER NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  
  -- Additional info
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_document_items_document_id ON public.billing_document_items(billing_document_id);
CREATE INDEX IF NOT EXISTS idx_billing_document_items_line_number ON public.billing_document_items(billing_document_id, line_number);

-- ===== CREATE BILLING_SETTINGS TABLE =====
-- Stores customization settings for billing documents
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  
  -- Organization information
  business_name TEXT NOT NULL,
  business_rut TEXT NOT NULL,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  
  -- Logo
  logo_url TEXT,
  
  -- Customization
  header_text TEXT,
  footer_text TEXT,
  terms_and_conditions TEXT,
  
  -- SII configuration (for future integration)
  sii_environment TEXT CHECK (sii_environment IN ('development', 'production')) DEFAULT 'development',
  sii_api_key TEXT, -- Encrypted
  sii_api_url TEXT,
  
  -- Defaults
  default_document_type TEXT CHECK (default_document_type IN ('boleta', 'factura')) DEFAULT 'boleta',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure one setting per branch
  UNIQUE(branch_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_billing_settings_branch_id ON public.billing_settings(branch_id);

-- ===== FUNCTIONS =====

-- Function to generate folio for boletas/facturas
CREATE OR REPLACE FUNCTION generate_billing_folio(
  p_branch_id UUID,
  p_document_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_last_folio TEXT;
  v_next_number INTEGER;
BEGIN
  -- Determine prefix based on document type
  v_prefix := CASE 
    WHEN p_document_type = 'boleta' THEN 'BOL'
    WHEN p_document_type = 'factura' THEN 'FAC'
    WHEN p_document_type = 'internal_ticket' THEN 'TKT'
    ELSE 'DOC'
  END;
  
  -- Get last folio for this branch and document type
  SELECT folio INTO v_last_folio
  FROM public.billing_documents
  WHERE branch_id = p_branch_id
    AND document_type = p_document_type
    AND folio LIKE v_prefix || '-%'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Extract number and increment
  IF v_last_folio IS NOT NULL THEN
    v_next_number := CAST(SUBSTRING(v_last_folio FROM '\d+$') AS INTEGER) + 1;
  ELSE
    v_next_number := 1;
  END IF;
  
  -- Format with 6-digit padding
  RETURN v_prefix || '-' || LPAD(v_next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER billing_documents_updated_at
  BEFORE UPDATE ON public.billing_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_documents_updated_at();

-- Trigger for billing_settings updated_at
CREATE TRIGGER billing_settings_updated_at
  BEFORE UPDATE ON public.billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_documents_updated_at();

-- ===== COMMENTS =====
COMMENT ON TABLE public.billing_documents IS 'Almacena documentos de facturación (boletas, facturas, tickets internos)';
COMMENT ON TABLE public.billing_document_items IS 'Items de línea para documentos de facturación';
COMMENT ON TABLE public.billing_settings IS 'Configuración y personalización de documentos de facturación por sucursal';
COMMENT ON FUNCTION generate_billing_folio IS 'Genera folio secuencial para documentos de facturación por tipo y sucursal';
