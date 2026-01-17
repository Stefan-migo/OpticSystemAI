-- Migration: Make email optional for customers
-- Some customers (especially from rural areas) may not have email addresses

-- First, remove the NOT NULL constraint from email
ALTER TABLE public.profiles
ALTER COLUMN email DROP NOT NULL;

-- Note: We keep the UNIQUE constraint so if an email is provided, it must be unique
-- But now NULL emails are allowed

