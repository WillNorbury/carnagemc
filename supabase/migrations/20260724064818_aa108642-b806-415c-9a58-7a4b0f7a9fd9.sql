
CREATE POLICY "Authenticated can read user-skripts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-skripts');

CREATE POLICY "Anon can read user-skripts"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'user-skripts');

CREATE POLICY "Users upload to own user-skripts folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-skripts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own user-skripts objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-skripts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own user-skripts objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-skripts' AND (storage.foldername(name))[1] = auth.uid()::text);
