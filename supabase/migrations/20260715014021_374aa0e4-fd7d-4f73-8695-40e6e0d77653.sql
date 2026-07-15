CREATE POLICY "uptime_checks public read" ON public.uptime_checks FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.uptime_checks TO anon, authenticated;
GRANT SELECT ON public.uptime_incidents TO anon, authenticated;