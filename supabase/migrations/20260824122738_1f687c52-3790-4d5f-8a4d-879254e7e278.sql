CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  number integer,
  theme text,
  summary text,
  description text,
  banner_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'upcoming',
  winners jsonb NOT NULL DEFAULT '[]'::jsonb,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published seasons"
  ON public.seasons FOR SELECT
  USING (published = true OR public.is_current_user_admin());

CREATE POLICY "Admins can insert seasons"
  ON public.seasons FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update seasons"
  ON public.seasons FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete seasons"
  ON public.seasons FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

CREATE TRIGGER seasons_set_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();