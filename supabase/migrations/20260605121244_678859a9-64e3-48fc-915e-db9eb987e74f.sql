CREATE TABLE public.alert_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  webhook_urls text[] NOT NULL DEFAULT '{}',
  email_recipients text[] NOT NULL DEFAULT '{}',
  down_payload_template jsonb DEFAULT NULL,
  up_payload_template jsonb DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only one row exists
INSERT INTO public.alert_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT, UPDATE ON public.alert_settings TO authenticated;
GRANT ALL ON public.alert_settings TO service_role;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read" ON public.alert_settings FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "Allow admin update" ON public.alert_settings FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "Allow admin insert" ON public.alert_settings FOR INSERT WITH CHECK (public.is_current_user_admin());