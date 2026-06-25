
-- Allow authenticated users to upload .sk files into their own folder
CREATE POLICY "Users can upload skripts to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'skripts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own skripts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'skripts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own skripts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'skripts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can manage all skripts"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'skripts' AND public.is_current_user_admin())
WITH CHECK (bucket_id = 'skripts' AND public.is_current_user_admin());

-- Authenticated users can read skript files (signed URL still possible for anon)
CREATE POLICY "Authenticated can read skripts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'skripts');
