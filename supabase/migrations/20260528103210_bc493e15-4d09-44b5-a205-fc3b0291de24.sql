
-- Mods table
CREATE TABLE public.mods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id text NOT NULL DEFAULT public.gen_plugin_short_id(),
  name text NOT NULL,
  description text,
  long_description text,
  version text,
  mc_version text,
  loader text,
  author text,
  icon_url text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  jar_path text,
  jar_filename text,
  jar_size bigint,
  download_url text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mods TO authenticated;
GRANT ALL ON public.mods TO service_role;

ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mods published public read" ON public.mods
  FOR SELECT TO public USING (published);

CREATE POLICY "Admins view all mods" ON public.mods
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage mods" ON public.mods
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_mods_updated_at
BEFORE UPDATE ON public.mods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for mod jars
INSERT INTO storage.buckets (id, name, public) VALUES ('mod-jars', 'mod-jars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Mod jars public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'mod-jars');

CREATE POLICY "Admins upload mod jars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mod-jars' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update mod jars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'mod-jars' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete mod jars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'mod-jars' AND private.has_role(auth.uid(), 'admin'::app_role));
