CREATE TABLE public.user_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  ip text NOT NULL,
  port integer,
  description text,
  long_description text,
  version text,
  tags text[] NOT NULL DEFAULT '{}',
  icon_url text,
  banner_url text,
  website_url text,
  discord_url text,
  published boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_servers TO authenticated;
GRANT SELECT ON public.user_servers TO anon;
GRANT ALL ON public.user_servers TO service_role;

ALTER TABLE public.user_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published servers"
  ON public.user_servers FOR SELECT
  USING (published = true);

CREATE POLICY "Owners can view their servers"
  ON public.user_servers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all servers"
  ON public.user_servers FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can create their own servers"
  ON public.user_servers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own servers"
  ON public.user_servers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own servers"
  ON public.user_servers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all servers"
  ON public.user_servers FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER user_servers_set_updated_at
  BEFORE UPDATE ON public.user_servers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.user_servers_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := public.slugify(NEW.name);
    IF base IS NULL OR base = '' THEN base := 'server'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.user_servers WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_servers_slug
  BEFORE INSERT OR UPDATE ON public.user_servers
  FOR EACH ROW EXECUTE FUNCTION public.user_servers_set_slug();