
-- 1) New application_types table
CREATE TABLE IF NOT EXISTS public.application_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'ClipboardList',
  color text NOT NULL DEFAULT 'primary',
  sort_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  accepting boolean NOT NULL DEFAULT true,
  requires_portfolio boolean NOT NULL DEFAULT false,
  portfolio_label text,
  intro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.application_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.application_types TO authenticated;
GRANT ALL ON public.application_types TO service_role;

ALTER TABLE public.application_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view enabled types"
ON public.application_types FOR SELECT
USING (enabled = true OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "admins manage types insert"
ON public.application_types FOR INSERT
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "admins manage types update"
ON public.application_types FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "admins manage types delete"
ON public.application_types FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER application_types_set_updated_at
BEFORE UPDATE ON public.application_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Convert applications.type from enum to text so admin can add new slugs
ALTER TABLE public.applications ALTER COLUMN type TYPE text USING type::text;

-- 3) Seed defaults
INSERT INTO public.application_types (slug, label, description, icon, color, sort_order, requires_portfolio, portfolio_label)
VALUES
  ('staff',   'Staff',   'Help moderate, support players, and keep the server safe.', 'ShieldCheck', 'primary', 1, false, NULL),
  ('builder', 'Builder', 'Design and build spawns, hubs, and event arenas.',           'Hammer',      'amber',   2, true,  'Portfolio URL (Imgur, Planet Minecraft, etc.)'),
  ('creator', 'Content Creator', 'Stream or create videos featuring the server.',     'Youtube',     'rose',    3, true,  'Channel URL (YouTube, Twitch, TikTok)')
ON CONFLICT (slug) DO NOTHING;
