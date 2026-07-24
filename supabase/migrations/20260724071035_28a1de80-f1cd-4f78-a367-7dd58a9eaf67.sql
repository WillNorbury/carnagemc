
DROP POLICY IF EXISTS "Anon can read user-skripts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read user-skripts" ON storage.objects;

-- Owners can read their own uploads
CREATE POLICY "Owners read own user-skripts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-skripts'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Anyone (including anon) can read files that belong to a published user_skripts row
CREATE POLICY "Published user-skripts readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'user-skripts'
  AND EXISTS (
    SELECT 1 FROM public.user_skripts s
    WHERE s.storage_path = storage.objects.name
      AND s.published = true
  )
);
