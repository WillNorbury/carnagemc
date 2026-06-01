
DROP POLICY IF EXISTS "Admins manage plugins" ON public.plugins;
DROP POLICY IF EXISTS "Admins view all plugins" ON public.plugins;

CREATE POLICY "Admins and owners manage plugins"
ON public.plugins
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners view all plugins"
ON public.plugins
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
