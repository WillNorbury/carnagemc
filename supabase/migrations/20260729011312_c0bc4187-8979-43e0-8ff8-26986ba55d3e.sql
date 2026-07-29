CREATE TABLE public.game_modes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  long_description text,
  banner_url text,
  icon text NOT NULL DEFAULT 'Swords',
  accent text NOT NULL DEFAULT 'primary',
  features text[] NOT NULL DEFAULT '{}',
  screenshots text[] NOT NULL DEFAULT '{}',
  server_ip text,
  status text NOT NULL DEFAULT 'live',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_modes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_modes TO authenticated;
GRANT ALL ON public.game_modes TO service_role;

ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published game modes are viewable by everyone"
ON public.game_modes FOR SELECT
USING (published = true OR public.is_current_user_admin());

CREATE POLICY "Admins can insert game modes"
ON public.game_modes FOR INSERT TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update game modes"
ON public.game_modes FOR UPDATE TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete game modes"
ON public.game_modes FOR DELETE TO authenticated
USING (public.is_current_user_admin());

CREATE TRIGGER update_game_modes_updated_at
BEFORE UPDATE ON public.game_modes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.game_modes (slug, name, tagline, description, long_description, icon, accent, features, server_ip, status, sort_order) VALUES
('survival', 'Survival', 'Season 1 — build, trade, conquer', 'Classic long-term survival with land claims, a player economy, and a thriving town scene.', E'## Survival (Season 1)\n\nCarnageMC Survival is a long-form, grief-protected world built for players who want their work to last. Claim land, found a town, run a shop, and grind toward the top of the economy leaderboards.\n\n### What makes it different\n\nNo pay-to-win gear, no resets without warning, and a fully player-driven market. Season 1 runs with regular content drops rather than hard wipes.', 'Pickaxe', 'primary', ARRAY['Land claims & grief protection','Player-run economy and shops','Towns, nations and alliances','Custom enchants and gear tiers','Weekly community events','Full leaderboard tracking'], 'play.carnagemc.net', 'live', 1),
('lifesteal', 'Lifesteal', 'Take hearts. Lose hearts. Stay alive.', 'High-stakes PvP survival where every kill steals a heart and running out means elimination.', E'## Lifesteal\n\nEvery kill takes a heart from your victim and gives it to you. Hit zero and you are locked out of the world until you buy your way back in with a revive beacon.\n\n### The loop\n\nRaid, defend, trade, betray. Hearts are the only currency that truly matters, and the leaderboard is a live record of who is winning the war.', 'Heart', 'destructive', ARRAY['Steal a heart on every kill','Elimination at zero hearts','Revive beacons and heart crafting','Base raiding with withdraw items','Open-world PvP everywhere','Live heart leaderboard'], 'play.carnagemc.net', 'beta', 2),
('4dupe', '4Dupe', 'Duping is the feature, not the bug', 'A chaotic anarchy-flavoured sandbox where duping is fully allowed and nothing is off limits.', E'## 4Dupe\n\nA deliberately broken economy sandbox. Duping is legal, stacking is unlimited, and the only hard rule is that cheat clients still get you banned.\n\n### Expect chaos\n\nMega bases, absurd gear, and an economy that means nothing. Come for the lag jokes, stay for the wars.', 'Copy', 'accent', ARRAY['Duping fully allowed','No economy restrictions','Open PvP and raiding','Massive world border','Regular chaos events','Minimal rules, maximum freedom'], 'play.carnagemc.net', 'live', 3),
('hub-2', 'Hub-2', 'The gateway to every CarnageMC world', 'Our secondary lobby — parkour, cosmetics, and instant access to every game mode.', E'## Hub-2\n\nHub-2 is the overflow and event lobby for CarnageMC. Warp to any game mode, show off cosmetics, run the parkour course, or hang out between matches.\n\n### Why a second hub\n\nIt keeps the main lobby fast during peak hours and gives us a dedicated space for tournaments and seasonal builds.', 'Compass', 'secondary', ARRAY['Instant warps to every mode','Parkour and mini-games','Cosmetic showcase area','Seasonal event builds','Low-latency lobby routing','Friends and party system'], 'play.carnagemc.net', 'live', 4);