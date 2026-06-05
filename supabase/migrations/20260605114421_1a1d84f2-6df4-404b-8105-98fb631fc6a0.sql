CREATE TABLE public.uptime_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  is_up boolean NOT NULL,
  latency_ms integer,
  status_code integer,
  error text
);

CREATE INDEX idx_uptime_checks_service_time ON public.uptime_checks (service_key, checked_at DESC);

GRANT SELECT ON public.uptime_checks TO anon, authenticated;
GRANT ALL ON public.uptime_checks TO service_role;

ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uptime checks public read"
  ON public.uptime_checks FOR SELECT
  TO public USING (true);

-- Aggregated daily uptime per service for the last 365 days
CREATE OR REPLACE FUNCTION public.get_uptime_daily(_days integer DEFAULT 30)
RETURNS TABLE(service_key text, day date, total_checks bigint, up_checks bigint, uptime_pct numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    service_key,
    (checked_at AT TIME ZONE 'UTC')::date AS day,
    count(*) AS total_checks,
    count(*) FILTER (WHERE is_up) AS up_checks,
    ROUND(100.0 * count(*) FILTER (WHERE is_up) / NULLIF(count(*), 0), 2) AS uptime_pct
  FROM public.uptime_checks
  WHERE checked_at >= (now() - (_days || ' days')::interval)
  GROUP BY service_key, day
  ORDER BY service_key, day;
$$;

GRANT EXECUTE ON FUNCTION public.get_uptime_daily(integer) TO anon, authenticated;

-- Enable pg_cron + pg_net for scheduled checks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;