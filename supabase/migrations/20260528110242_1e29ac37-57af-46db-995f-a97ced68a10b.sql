-- Revoke read access on sensitive profile columns from anon and authenticated.
-- RLS policies cannot restrict columns, so we use column-level GRANTs.
REVOKE SELECT (preferences, discord_id, discord_username, discord_avatar)
  ON public.profiles FROM anon, authenticated;

-- Security-definer function so the owner (or admins) can still read their own private fields.
CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE (
  preferences jsonb,
  discord_id text,
  discord_username text,
  discord_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.preferences, p.discord_id, p.discord_username, p.discord_avatar
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
