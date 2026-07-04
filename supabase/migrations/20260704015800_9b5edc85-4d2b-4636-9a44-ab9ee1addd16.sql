
-- Restrict overly-broad storage SELECT policies flagged by scanner

DROP POLICY IF EXISTS "Authenticated can read bridge jars" ON storage.objects;
CREATE POLICY "Owners can read bridge jars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'mc-bridge-jars'
    AND private.has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated can read skripts" ON storage.objects;
CREATE POLICY "Owners or admins can read own skripts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'skripts'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR public.is_current_user_admin()
    )
  );

DROP POLICY IF EXISTS "Anyone can view resource packs" ON storage.objects;
CREATE POLICY "Owners or admins can view resource packs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-packs'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR public.is_current_user_admin()
    )
  );
