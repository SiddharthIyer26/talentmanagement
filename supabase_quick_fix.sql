-- ==============================================================================
-- Supabase Quick Fix: Non-Exclusive Talent Columns & Schema Cache Reload
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Allow influencer_id to be nullable for non-exclusive talent campaigns
DO $$
BEGIN
  ALTER TABLE public.campaigns ALTER COLUMN influencer_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Add talent_type column if not already present
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS talent_type TEXT NOT NULL DEFAULT 'exclusive';

-- 3. Add non_exclusive_talent JSONB column if not already present
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS non_exclusive_talent JSONB DEFAULT NULL;

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
