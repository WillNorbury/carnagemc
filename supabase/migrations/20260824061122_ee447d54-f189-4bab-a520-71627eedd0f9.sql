CREATE TABLE public.player_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'B',
  category TEXT NOT NULL DEFAULT 'Overall',
  region TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_tiers TO authenticated;
GRANT ALL ON public.player_tiers TO service_role;

ALTER TABLE public.player_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player tiers are publicly readable"
  ON public.player_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert player tiers"
  ON public.player_tiers FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update player tiers"
  ON public.player_tiers FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete player tiers"
  ON public.player_tiers FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

CREATE TRIGGER player_tiers_set_updated_at
  BEFORE UPDATE ON public.player_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX player_tiers_category_idx ON public.player_tiers (category, sort_order);