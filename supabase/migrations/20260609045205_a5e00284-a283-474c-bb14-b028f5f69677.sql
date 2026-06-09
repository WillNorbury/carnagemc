
-- alert_settings: unify on admin OR owner
DROP POLICY IF EXISTS "Allow admin read" ON public.alert_settings;
DROP POLICY IF EXISTS "Allow admin insert" ON public.alert_settings;
DROP POLICY IF EXISTS "Allow admin update" ON public.alert_settings;
DROP POLICY IF EXISTS "Admins delete alert settings" ON public.alert_settings;

CREATE POLICY "Admins or owners read alert settings"
  ON public.alert_settings FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "Admins or owners insert alert settings"
  ON public.alert_settings FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "Admins or owners update alert settings"
  ON public.alert_settings FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "Admins or owners delete alert settings"
  ON public.alert_settings FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

-- uptime_checks: remove anonymous read
DROP POLICY IF EXISTS "Uptime checks public read" ON public.uptime_checks;

CREATE POLICY "Authenticated users can read uptime checks"
  ON public.uptime_checks FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.uptime_checks FROM anon;
