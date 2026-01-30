-- Migration: Allow Authenticated Users to Create Their Own Organization
-- Phase SaaS Onboarding: Add RLS policy to allow users to create organizations during onboarding
-- This policy allows any authenticated user to INSERT an organization where they are the owner

-- ===== RLS POLICY: Users can create their own organization =====
-- This policy allows authenticated users to create an organization where owner_id = auth.uid()
-- This is needed for the onboarding flow where new users create their first organization

CREATE POLICY "Users can create their own organization"
ON public.organizations
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  -- User must be the owner of the organization they're creating
  AND owner_id = auth.uid()
  -- User must not already have an organization (prevent duplicates)
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND organization_id IS NOT NULL
  )
);

-- ===== COMMENT =====
COMMENT ON POLICY "Users can create their own organization" ON public.organizations IS 
'Allows authenticated users to create an organization during onboarding. User must be the owner and must not already have an organization assigned.';
