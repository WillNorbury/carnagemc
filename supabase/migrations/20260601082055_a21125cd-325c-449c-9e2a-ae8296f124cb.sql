
CREATE TABLE public.plugin_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  version text NOT NULL,
  changelog text,
  jar_path text,
  jar_filename text,
  jar_size bigint,
  download_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plugin_versions_plugin_id ON public.plugin_versions(plugin_id, created_at DESC);

GRANT SELECT ON public.plugin_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_versions TO authenticated;
GRANT ALL ON public.plugin_versions TO service_role;

ALTER TABLE public.plugin_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plugin versions public read"
ON public.plugin_versions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.published)
  OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.user_id = auth.uid()))
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Plugin owners insert versions"
ON public.plugin_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Plugin owners update versions"
ON public.plugin_versions FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Plugin owners delete versions"
ON public.plugin_versions FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND p.user_id = auth.uid())
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);
