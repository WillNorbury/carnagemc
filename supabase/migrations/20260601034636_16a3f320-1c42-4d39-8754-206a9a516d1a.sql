CREATE OR REPLACE FUNCTION public.discover_items_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.discover_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('resource_pack','data_pack','shader','modpack','server')),
  user_id UUID,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  long_description TEXT,
  author TEXT,
  version TEXT,
  icon_url TEXT,
  banner_url TEXT,
  download_url TEXT,
  external_url TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discover_items_kind ON public.discover_items(kind);
CREATE INDEX idx_discover_items_user ON public.discover_items(user_id);

GRANT SELECT ON public.discover_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discover_items TO authenticated;
GRANT ALL ON public.discover_items TO service_role;

ALTER TABLE public.discover_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published discover items are viewable by everyone"
ON public.discover_items FOR SELECT USING (published = true);

CREATE POLICY "Owners can view their discover items"
ON public.discover_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their discover items"
ON public.discover_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their discover items"
ON public.discover_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their discover items"
ON public.discover_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all discover items"
ON public.discover_items FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert any discover items"
ON public.discover_items FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update any discover items"
ON public.discover_items FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete any discover items"
ON public.discover_items FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));

CREATE TRIGGER set_discover_items_updated_at
BEFORE UPDATE ON public.discover_items
FOR EACH ROW EXECUTE FUNCTION public.discover_items_set_updated_at();