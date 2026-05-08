
CREATE OR REPLACE FUNCTION public.gen_plugin_short_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  exists_already boolean;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 100000000))::int::text, 8, '0');
    SELECT EXISTS(SELECT 1 FROM public.plugins WHERE short_id = candidate) INTO exists_already;
    IF NOT exists_already THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE public.plugins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  long_description text,
  version text,
  author text,
  download_url text,
  icon_url text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plugins_short_id_format CHECK (short_id ~ '^[0-9]{8}$')
);

ALTER TABLE public.plugins ALTER COLUMN short_id SET DEFAULT public.gen_plugin_short_id();

CREATE INDEX plugins_published_idx ON public.plugins(published);

ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plugins published public read"
ON public.plugins FOR SELECT TO public
USING (published);

CREATE POLICY "Admins view all plugins"
ON public.plugins FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plugins"
ON public.plugins FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER plugins_set_updated_at
BEFORE UPDATE ON public.plugins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
