CREATE OR REPLACE FUNCTION public.get_uptime_daily(_days integer DEFAULT 30)
 RETURNS TABLE(service_key text, day date, total_checks bigint, up_checks bigint, uptime_pct numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_uptime_daily(integer) TO anon, authenticated;