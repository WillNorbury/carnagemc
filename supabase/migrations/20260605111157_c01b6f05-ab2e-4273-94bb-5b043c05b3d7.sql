CREATE POLICY "Authenticated users can upload resource packs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resource-packs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update their own resource packs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resource-packs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'resource-packs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete their own resource packs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resource-packs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view resource packs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'resource-packs');