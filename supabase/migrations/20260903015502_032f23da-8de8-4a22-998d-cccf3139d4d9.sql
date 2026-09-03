CREATE TABLE public.server_panel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_ip text NOT NULL DEFAULT '',
  motd text NOT NULL DEFAULT '',
  motd_color text NOT NULL DEFAULT '#ff3b30',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.server_panel_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_panel_settings TO authenticated;
GRANT ALL ON public.server_panel_settings TO service_role;

ALTER TABLE public.server_panel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read server panel settings"
  ON public.server_panel_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage server panel settings"
  ON public.server_panel_settings FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER server_panel_settings_set_updated_at
  BEFORE UPDATE ON public.server_panel_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.server_panel_settings (server_ip, motd, motd_color)
VALUES ('play.carnagemc.net', 'Welcome to CarnageMC', '#ff3b30');