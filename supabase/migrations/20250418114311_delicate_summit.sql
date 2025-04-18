/*
  # Storage Buckets and Policies Setup

  1. Changes
    - Create storage buckets if they don't exist
    - Set up storage policies for avatars and post images
    - Handle cases where buckets already exist
*/

-- Create storage buckets if they don't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('avatars', 'avatars', true),
    ('post-images', 'post-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Set up storage policies
DO $$ 
BEGIN
  -- Avatar policies
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
  CREATE POLICY "Users can upload avatar images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.role() = 'authenticated'
    );

  DROP POLICY IF EXISTS "Users can update own avatar images" ON storage.objects;
  CREATE POLICY "Users can update own avatar images"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars' AND
      auth.role() = 'authenticated'
    );

  DROP POLICY IF EXISTS "Users can delete own avatar images" ON storage.objects;
  CREATE POLICY "Users can delete own avatar images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars' AND
      auth.role() = 'authenticated'
    );

  -- Post image policies
  DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
  CREATE POLICY "Post images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-images');

  DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
  CREATE POLICY "Users can upload post images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'post-images' AND
      auth.role() = 'authenticated'
    );

  DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;
  CREATE POLICY "Users can update own post images"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'post-images' AND
      auth.role() = 'authenticated'
    );

  DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;
  CREATE POLICY "Users can delete own post images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'post-images' AND
      auth.role() = 'authenticated'
    );
END $$;