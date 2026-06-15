
-- 1) Add fixed search_path to pgmq wrappers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2) Revoke EXECUTE from PUBLIC / anon / authenticated on trigger-only and internal helper SECURITY DEFINER functions.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.handle_new_user()',
    'public.set_updated_at()',
    'public.notify_ban_appeal_event()',
    'public.add_owner_as_org_member()',
    'public.enqueue_email(text, jsonb)',
    'public.read_email_batch(text, integer, integer)',
    'public.delete_email(text, bigint)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.plugins_set_slug()',
    'public.discover_items_set_updated_at()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END$$;

-- 3) Functions called from client RPC: keep authenticated, revoke from PUBLIC/anon
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.check_is_admin_logged(text, text)',
    'public.get_my_private_profile()',
    'public.record_vote_streak()',
    'public.record_login_streak()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END$$;

-- 4) Policy helper functions used inside RLS — only need to be callable in policy context.
--    Keep authenticated grant (policies evaluate as the calling role) but drop PUBLIC/anon.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.can_access_ticket(uuid)',
    'public.is_current_user_admin()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END$$;
