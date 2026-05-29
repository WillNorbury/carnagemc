
-- 1. Lock down sensitive profile columns from broad SELECT
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, bio, mc_username, created_at, updated_at) ON public.profiles TO anon, authenticated;

-- 2. Explicit deny INSERT into admin_check_logs from client roles (writes only via SECURITY DEFINER function)
CREATE POLICY "Deny client inserts to admin_check_logs"
ON public.admin_check_logs
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3. Lock down discord_link_states writes from clients (writes only via SECURITY DEFINER / service role edge functions)
CREATE POLICY "Deny client inserts to discord_link_states"
ON public.discord_link_states
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny client deletes to discord_link_states"
ON public.discord_link_states
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);

-- 4. Remove broad listing policy on mod-jars public bucket (files still accessible via public URL)
DROP POLICY IF EXISTS "Mod jars public read" ON storage.objects;
