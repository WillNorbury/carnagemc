
-- 1. Ensure sensitive profile columns are not readable by anon/authenticated via the public SELECT policy
REVOKE SELECT (discord_id, discord_username, discord_avatar, preferences) ON public.profiles FROM anon, authenticated;

-- 2. Fix misleading is_admin_user signature - drop parameterized version, recreate with no params
-- First update RLS policies that use is_admin_user(auth.uid()) to use a new no-arg version
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Update discover_items policies to use the new function
DROP POLICY IF EXISTS "Admins can delete any discover items" ON public.discover_items;
DROP POLICY IF EXISTS "Admins can insert any discover items" ON public.discover_items;
DROP POLICY IF EXISTS "Admins can update any discover items" ON public.discover_items;
DROP POLICY IF EXISTS "Admins can view all discover items" ON public.discover_items;

CREATE POLICY "Admins can delete any discover items" ON public.discover_items FOR DELETE TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert any discover items" ON public.discover_items FOR INSERT TO authenticated WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update any discover items" ON public.discover_items FOR UPDATE TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Admins can view all discover items" ON public.discover_items FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- Update mod_reviews admin policies
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.mod_reviews;
DROP POLICY IF EXISTS "Admins can insert reviews" ON public.mod_reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.mod_reviews;

CREATE POLICY "Admins can delete reviews" ON public.mod_reviews FOR DELETE TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Admins can insert reviews" ON public.mod_reviews FOR INSERT TO authenticated WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins can update reviews" ON public.mod_reviews FOR UPDATE TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

-- Now safe to drop the misleading function
DROP FUNCTION IF EXISTS public.is_admin_user(uuid);

-- 3. Lock down site_content - extend blocklist to internal config keys
DROP POLICY IF EXISTS "Site content public read" ON public.site_content;
CREATE POLICY "Site content public read" ON public.site_content
  FOR SELECT TO public
  USING (key <> ALL (ARRAY['cron_secret', 'discord_bot', 'role_permissions', 'maintenance', 'feature_flags', 'admin_config']));

-- 4. Revoke EXECUTE from anon/public on all remaining SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_login_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_vote_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_ticket(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_vote_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
