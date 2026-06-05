DROP POLICY IF EXISTS "Org owners can attach plugins" ON public.plugins;
CREATE POLICY "Org owners can attach plugins" ON public.plugins FOR UPDATE TO authenticated
  USING (
    (org_id IS NULL AND auth.uid() = user_id)
    OR (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = plugins.org_id AND o.owner_id = auth.uid()))
  )
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id)
    OR (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = plugins.org_id AND o.owner_id = auth.uid()))
  );