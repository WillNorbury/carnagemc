CREATE TABLE public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  price_monthly numeric(10,2),
  price_lifetime numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  color text NOT NULL DEFAULT '#0082A2',
  badge_label text,
  perks text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.membership_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_tiers TO authenticated;
GRANT ALL ON public.membership_tiers TO service_role;

ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published membership tiers are viewable by everyone"
ON public.membership_tiers FOR SELECT
USING (published = true OR public.is_current_user_admin());

CREATE POLICY "Admins can insert membership tiers"
ON public.membership_tiers FOR INSERT TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update membership tiers"
ON public.membership_tiers FOR UPDATE TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete membership tiers"
ON public.membership_tiers FOR DELETE TO authenticated
USING (public.is_current_user_admin());

CREATE TRIGGER membership_tiers_set_updated_at
BEFORE UPDATE ON public.membership_tiers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.membership_tiers (name, slug, tagline, description, price_monthly, price_lifetime, color, badge_label, perks, sort_order, featured)
VALUES
  ('Guardian', 'guardian', 'Start supporting the network', 'Entry membership with cosmetic and queue perks.', 4.99, 24.99, '#005155', 'Starter', ARRAY['Guardian chat tag','Coloured chat','/hat and /nick','Priority queue slot'], 1, false),
  ('Sentinel', 'sentinel', 'More kits, more power', 'Everything in Guardian plus expanded kits and homes.', 9.99, 49.99, '#0082A2', 'Popular', ARRAY['Everything in Guardian','Sentinel chat tag','5 extra /home slots','Weekly kit','2x vote rewards'], 2, true),
  ('Warden', 'warden', 'The full Warden experience', 'Everything in Sentinel plus premium commands and cosmetics.', 19.99, 89.99, '#00B3C7', 'Best value', ARRAY['Everything in Sentinel','Warden chat tag & glow','10 extra /home slots','Particle trails & pets','Early event access'], 3, false),
  ('Ascendant', 'ascendant', 'Top-tier lifetime status', 'Our highest membership with every perk unlocked.', 39.99, 179.99, '#7FE9F5', 'Elite', ARRAY['Everything in Warden','Ascendant prefix','Unlimited homes','Exclusive cosmetics','Direct staff support channel'], 4, false);