
-- 1) EXPOSED_SENSITIVE_DATA: revoke column-level SELECT on sensitive profile columns
REVOKE SELECT (discord_id, discord_username, discord_avatar, preferences)
  ON public.profiles FROM anon, authenticated;

-- 2) MISSING_RLS_PROTECTION: restrictive INSERT block on discord_bot_action_logs
DROP POLICY IF EXISTS "Deny client inserts to discord_bot_action_logs" ON public.discord_bot_action_logs;
CREATE POLICY "Deny client inserts to discord_bot_action_logs"
  ON public.discord_bot_action_logs
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- 3) PRIVILEGE_ESCALATION: make is_admin_user ignore caller-supplied uuid
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
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
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM anon, public;

-- 4) SUPA_anon_security_definer_function_executable: revoke EXECUTE from anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_login_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_vote_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_ticket(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_vote_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
