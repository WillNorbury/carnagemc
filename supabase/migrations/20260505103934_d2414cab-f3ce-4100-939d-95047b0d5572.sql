-- 1) Tighten site_content public read policy: hide secret keys from public/anon
DROP POLICY IF EXISTS "Site content public read" ON public.site_content;

CREATE POLICY "Site content public read"
ON public.site_content
FOR SELECT
TO public
USING (key NOT IN ('cron_secret', 'discord_bot'));

-- Admins keep full access via existing "Admins manage site content" policy.

-- 2) Drop the public.has_role function entirely.
-- All policies and code use private.has_role; the public copy only enabled
-- authenticated users to enumerate role membership for arbitrary user_ids.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);