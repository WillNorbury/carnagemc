CREATE TABLE public.server_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.server_maps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_maps TO authenticated;
GRANT ALL ON public.server_maps TO service_role;

ALTER TABLE public.server_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enabled maps are viewable by everyone"
  ON public.server_maps FOR SELECT
  USING (enabled OR public.is_current_user_admin());

CREATE POLICY "Admins manage server maps"
  ON public.server_maps FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER server_maps_set_updated_at
  BEFORE UPDATE ON public.server_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();