ALTER TABLE public.mods ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.plugins ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mods_org_id_idx ON public.mods(org_id);
CREATE INDEX IF NOT EXISTS plugins_org_id_idx ON public.plugins(org_id);

-- Allow org owners to update org_id on mods/plugins they want to attach
CREATE POLICY "Org owners can attach mods"
  ON public.mods FOR UPDATE TO authenticated
  USING (
    org_id IS NULL
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = mods.org_id AND o.owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IS NULL
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = mods.org_id AND o.owner_id = auth.uid())
  );

CREATE POLICY "Org owners can attach plugins"
  ON public.plugins FOR UPDATE TO authenticated
  USING (
    org_id IS NULL
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = plugins.org_id AND o.owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IS NULL
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = plugins.org_id AND o.owner_id = auth.uid())
  );