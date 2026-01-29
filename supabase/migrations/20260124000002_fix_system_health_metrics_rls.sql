-- Migration: Fix RLS policies for system_health_metrics
-- Add INSERT policy that was missing

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Admin users can view health metrics" ON public.system_health_metrics;

-- Create SELECT policy
CREATE POLICY "Admin users can view health metrics" ON public.system_health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create INSERT policy (this was missing!)
CREATE POLICY "Admin users can insert health metrics" ON public.system_health_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create UPDATE policy (for completeness)
CREATE POLICY "Admin users can update health metrics" ON public.system_health_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create DELETE policy (for cleanup operations)
CREATE POLICY "Admin users can delete health metrics" ON public.system_health_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

COMMENT ON POLICY "Admin users can insert health metrics" ON public.system_health_metrics IS 
  'Allows admin users to insert health metrics when collecting system health data';
