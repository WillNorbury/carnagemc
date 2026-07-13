
CREATE TABLE public.mc_public_servers (
  slug text PRIMARY KEY,
  name text NOT NULL,
  ip text,
  online boolean NOT NULL DEFAULT false,
  players_online integer NOT NULL DEFAULT 0,
  players_max integer NOT NULL DEFAULT 100,
  tps numeric(4,2) NOT NULL DEFAULT 20.00,
  uptime_pct numeric(5,2) NOT NULL DEFAULT 100.00,
  motd text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mc_public_servers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mc_public_servers TO authenticated;
GRANT ALL ON public.mc_public_servers TO service_role;

ALTER TABLE public.mc_public_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read server status" ON public.mc_public_servers
  FOR SELECT USING (true);

CREATE POLICY "Admins/owners manage server status" ON public.mc_public_servers
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER mc_public_servers_updated_at
  BEFORE UPDATE ON public.mc_public_servers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.mc_public_servers (slug, name, online, players_online, players_max, tps, uptime_pct, motd, sort_order)
VALUES
  ('survival', 'Survival (S1)', true, 0, 100, 20.00, 100.00, 'Season 1 survival — land claims, economy, and events.', 1),
  ('lifesteal', 'Lifesteal (Development)', false, 0, 50, 20.00, 100.00, 'Heart-stealing PvP — currently in active development.', 2)
ON CONFLICT (slug) DO NOTHING;
