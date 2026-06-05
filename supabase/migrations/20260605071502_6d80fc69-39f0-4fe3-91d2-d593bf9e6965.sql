
-- 1. Re-apply column-level REVOKEs on sensitive profile columns
REVOKE SELECT (discord_id, discord_username, discord_avatar, preferences)
  ON public.profiles FROM anon, authenticated, public;

-- 2. Fix mods UPDATE policy: prevent hijacking of unowned mods
DROP POLICY IF EXISTS "Org owners can attach mods" ON public.mods;
CREATE POLICY "Org owners can attach mods"
  ON public.mods
  FOR UPDATE
  TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR (
      org_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = mods.org_id AND o.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR (
      org_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = mods.org_id AND o.owner_id = auth.uid()
      )
    )
  );

-- 3. Revoke EXECUTE on SECURITY DEFINER functions from anon/public
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_login_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_vote_streak() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_ticket(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_owner_as_org_member() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin_logged(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_vote_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(uuid) TO authenticated;
