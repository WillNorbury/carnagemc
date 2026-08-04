
-- suppressed_emails
CREATE POLICY "Admins read suppressed emails" ON public.suppressed_emails
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins delete suppressed emails" ON public.suppressed_emails
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

-- status_subscribers
CREATE POLICY "Admins read status subscribers" ON public.status_subscribers
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins delete status subscribers" ON public.status_subscribers
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

-- uptime_incidents
CREATE POLICY "Admins read uptime incidents" ON public.uptime_incidents
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins update uptime incidents" ON public.uptime_incidents
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins delete uptime incidents" ON public.uptime_incidents
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
GRANT SELECT, UPDATE, DELETE ON public.uptime_incidents TO authenticated;

-- user_skripts moderation
CREATE POLICY "Admins view all skripts" ON public.user_skripts
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins update any skript" ON public.user_skripts
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins delete any skript" ON public.user_skripts
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
