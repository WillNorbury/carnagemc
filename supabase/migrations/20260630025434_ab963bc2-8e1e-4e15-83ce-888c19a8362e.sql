CREATE POLICY "Authenticated can read bridge jars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mc-bridge-jars');

CREATE POLICY "Owners can upload bridge jars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mc-bridge-jars' AND private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update bridge jars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'mc-bridge-jars' AND private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete bridge jars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'mc-bridge-jars' AND private.has_role(auth.uid(), 'owner'::app_role));