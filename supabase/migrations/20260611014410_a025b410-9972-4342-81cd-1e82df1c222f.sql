DROP POLICY IF EXISTS "Authenticated users can read uptime checks" ON public.uptime_checks;
REVOKE SELECT ON public.uptime_checks FROM anon;