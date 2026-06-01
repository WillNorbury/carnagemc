
DROP POLICY IF EXISTS "Admins manage site content" ON public.site_content;

CREATE POLICY "Admins and owners manage site content"
ON public.site_content
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
