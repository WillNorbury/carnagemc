
CREATE TABLE public.vote_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  reward TEXT NOT NULL DEFAULT '1 Vote Crate Key',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vote_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vote_links TO authenticated;
GRANT ALL ON public.vote_links TO service_role;

ALTER TABLE public.vote_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vote links are publicly readable"
  ON public.vote_links FOR SELECT
  USING (true);

CREATE POLICY "Admins and owners can manage vote links"
  ON public.vote_links FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER vote_links_set_updated_at
  BEFORE UPDATE ON public.vote_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.vote_links (site_key, name, url, reward, sort_order) VALUES
  ('mcservers', 'MinecraftServers.org', 'https://minecraftservers.org/', '1 Vote Crate Key', 10),
  ('mcmp', 'MinecraftMP', 'https://minecraft-mp.com/', '1 Vote Crate Key', 20),
  ('planetmc', 'PlanetMinecraft', 'https://www.planetminecraft.com/', '1 Vote Crate Key', 30),
  ('topg', 'TopG', 'https://topg.org/minecraft-servers/', '1 Vote Crate Key', 40);
