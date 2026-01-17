-- Migration: Add Optical Shop Notification Types and Settings
-- This migration extends the notification system for optical shop specific events

-- Add new notification types for optical shop
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'quote_new';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'quote_status_change';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'quote_converted';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'work_order_new';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'work_order_status_change';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'work_order_completed';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'appointment_new';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'appointment_cancelled';
ALTER TYPE public.admin_notification_type ADD VALUE IF NOT EXISTS 'sale_new';

-- Create notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification type and enabled status
  notification_type admin_notification_type NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  
  -- Priority override (null = use default)
  priority admin_notification_priority,
  
  -- Target settings
  notify_all_admins BOOLEAN DEFAULT true,
  notify_specific_roles TEXT[], -- Array of roles to notify
  
  -- Additional settings
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default settings for all notification types
INSERT INTO public.notification_settings (notification_type, enabled, notify_all_admins)
VALUES
  ('order_new', true, true),
  ('order_status_change', true, true),
  ('low_stock', true, true),
  ('out_of_stock', true, true),
  ('new_customer', true, true),
  ('new_review', true, true),
  ('review_pending', true, true),
  ('support_ticket_new', true, true),
  ('support_ticket_update', true, true),
  ('payment_received', true, true),
  ('payment_failed', true, true),
  ('system_alert', true, true),
  ('system_update', false, true),
  ('security_alert', true, true),
  ('custom', true, true),
  -- Optical shop types
  ('quote_new', true, true),
  ('quote_status_change', true, true),
  ('quote_converted', true, true),
  ('work_order_new', true, true),
  ('work_order_status_change', true, true),
  ('work_order_completed', true, true),
  ('appointment_new', true, true),
  ('appointment_cancelled', true, true),
  ('sale_new', true, true)
ON CONFLICT (notification_type) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_notification_settings_type ON public.notification_settings(notification_type);
CREATE INDEX idx_notification_settings_enabled ON public.notification_settings(enabled) WHERE enabled = true;

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view and modify notification settings
CREATE POLICY "Admins can manage notification settings" ON public.notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create function to check if notification type is enabled
CREATE OR REPLACE FUNCTION public.is_notification_enabled(p_notification_type admin_notification_type)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT enabled FROM public.notification_settings WHERE notification_type = p_notification_type),
    true -- Default to enabled if not found
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get notification priority (with override support)
CREATE OR REPLACE FUNCTION public.get_notification_priority(
  p_notification_type admin_notification_type,
  p_default_priority admin_notification_priority DEFAULT 'medium'
)
RETURNS admin_notification_priority AS $$
DECLARE
  v_priority admin_notification_priority;
BEGIN
  SELECT COALESCE(priority, p_default_priority)
  INTO v_priority
  FROM public.notification_settings
  WHERE notification_type = p_notification_type;
  
  RETURN COALESCE(v_priority, p_default_priority);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_notification_enabled(admin_notification_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_priority(admin_notification_type, admin_notification_priority) TO authenticated;

-- Add comment
COMMENT ON TABLE public.notification_settings IS 'Configuration for enabling/disabling and customizing notification types';
