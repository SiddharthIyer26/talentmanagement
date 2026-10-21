-- ==============================================================================
-- Supabase Storage Setup: Influencer Profile Avatars Bucket & Public Policies
-- Run this in the Supabase SQL Editor if you wish to host profile images
-- in Supabase Storage buckets: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create the public bucket for influencer avatars if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'influencer-avatars',
  'influencer-avatars',
  true,
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Enable public read access to avatar images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access for Influencer Avatars'
  ) THEN
    CREATE POLICY "Public Access for Influencer Avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'influencer-avatars');
  END IF;
END $$;

-- 3. Allow uploads into influencer-avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Uploads to Influencer Avatars'
  ) THEN
    CREATE POLICY "Allow Uploads to Influencer Avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'influencer-avatars');
  END IF;
END $$;

-- 4. Allow updates and deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Updates to Influencer Avatars'
  ) THEN
    CREATE POLICY "Allow Updates to Influencer Avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'influencer-avatars');
  END IF;
END $$;
