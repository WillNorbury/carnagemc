
-- Remove public read access on internal infrastructure tables
DROP POLICY IF EXISTS "uptime_checks public read" ON public.uptime_checks;
DROP POLICY IF EXISTS "incidents public read" ON public.uptime_incidents;

-- SECURITY DEFINER RPCs expose only what the public /status pages need.
CREATE OR REPLACE FUNCTION public.get_public_uptime_incidents(_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  incident_number bigint,
  service_key text,
  opened_at timestamptz,
  closed_at timestamptz,
  last_error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, incident_number, service_key, opened_at, closed_at, last_error
  FROM public.uptime_incidents
  ORDER BY opened_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 20), 100));
$$;

CREATE OR REPLACE FUNCTION public.get_public_uptime_incident_by_number(_number bigint)
RETURNS TABLE (
  id uuid,
  incident_number bigint,
  service_key text,
  opened_at timestamptz,
  closed_at timestamptz,
  last_error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, incident_number, service_key, opened_at, closed_at, last_error
  FROM public.uptime_incidents
  WHERE incident_number = _number
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_active_uptime_incidents(_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  incident_number bigint,
  service_key text,
  opened_at timestamptz,
  closed_at timestamptz,
  last_error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, incident_number, service_key, opened_at, closed_at, last_error
  FROM public.uptime_incidents
  WHERE closed_at IS NULL
  ORDER BY opened_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 20), 100));
$$;

CREATE OR REPLACE FUNCTION public.get_public_uptime_checks_for_service(_service_key text, _limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  checked_at timestamptz,
  is_up boolean,
  latency_ms int,
  status_code int,
  error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, checked_at, is_up, latency_ms, status_code, error
  FROM public.uptime_checks
  WHERE service_key = _service_key
  ORDER BY checked_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 30), 500));
$$;

CREATE OR REPLACE FUNCTION public.get_public_uptime_checks_between(
  _service_key text,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  id uuid,
  checked_at timestamptz,
  is_up boolean,
  latency_ms int,
  status_code int,
  error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, checked_at, is_up, latency_ms, status_code, error
  FROM public.uptime_checks
  WHERE service_key = _service_key
    AND checked_at >= _from
    AND checked_at <= _to
  ORDER BY checked_at ASC
  LIMIT 2000;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_uptime_incidents(int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_uptime_incident_by_number(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_active_uptime_incidents(int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_uptime_checks_for_service(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_uptime_checks_between(text, timestamptz, timestamptz) TO anon, authenticated;
