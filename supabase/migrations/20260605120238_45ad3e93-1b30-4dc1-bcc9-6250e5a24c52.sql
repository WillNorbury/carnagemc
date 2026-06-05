CREATE TABLE public.uptime_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  last_error text,
  alerted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uptime_incidents_open_unique ON public.uptime_incidents(service_key) WHERE closed_at IS NULL;
GRANT SELECT ON public.uptime_incidents TO anon, authenticated;
GRANT ALL ON public.uptime_incidents TO service_role;
ALTER TABLE public.uptime_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents public read" ON public.uptime_incidents FOR SELECT USING (true);