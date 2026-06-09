DROP POLICY IF EXISTS "Authenticated can view uptime checks" ON public.uptime_checks;
DROP POLICY IF EXISTS "Anyone can view uptime checks" ON public.uptime_checks;
DROP POLICY IF EXISTS "Public can view uptime checks" ON public.uptime_checks;

CREATE POLICY "Admins and owners can view uptime checks"
ON public.uptime_checks
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

REVOKE SELECT ON public.uptime_checks FROM anon;