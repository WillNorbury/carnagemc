-- 1. player_stats: RPC-only access
DROP POLICY IF EXISTS "Public read player stats" ON public.player_stats;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.player_stats FROM anon, authenticated;
GRANT ALL ON public.player_stats TO service_role;

-- 2. mc_servers: never expose ingest_secret through PostgREST
REVOKE SELECT, UPDATE ON public.mc_servers FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, enabled, last_seen_at, created_by, created_at, updated_at) ON public.mc_servers TO authenticated;
GRANT UPDATE (name, slug, description, enabled, updated_at) ON public.mc_servers TO authenticated;
GRANT ALL ON public.mc_servers TO service_role;

-- 3. mods: only admins may re-assign organizations
DROP POLICY IF EXISTS "Org owners can attach mods" ON public.mods;

-- 4. SECURITY DEFINER functions: lock down execution
-- Internal / service-only functions: no client execution at all
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_org_member() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_ban_appeal_event() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_user_report() FROM anon, authenticated;

-- Signed-in only functions: remove anon execution
REVOKE EXECUTE ON FUNCTION public.admin_get_application_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_report_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_email(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mc_server_get_ingest_secret(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mc_server_rotate_secret(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_ticket(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_recent_plugin_downloads(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_login_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_vote_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_plugin_favorite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_explanations(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_creator_code(text) FROM anon;