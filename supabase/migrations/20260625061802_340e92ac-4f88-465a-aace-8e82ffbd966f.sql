
-- =========================================
-- profiles: column-level restriction
-- =========================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Public/anon and signed-in users can read non-sensitive columns only.
CREATE POLICY "Public profile fields are viewable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Revoke broad table-level SELECT and grant only safe columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT
  (id, display_name, avatar_url, mc_username, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- service_role keeps full access (used by edge functions / admin RPCs).
GRANT ALL ON public.profiles TO service_role;

-- =========================================
-- user_follows: restrict social graph
-- =========================================
DROP POLICY IF EXISTS "Follows are publicly readable" ON public.user_follows;

CREATE POLICY "Users can read their own follow rows"
ON public.user_follows
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = followee_id);

-- Secure helpers so public profile pages can still show counts
-- without exposing the full follower/followee pairs.
CREATE OR REPLACE FUNCTION public.get_follower_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::int
  FROM public.user_follows
  WHERE followee_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::int
  FROM public.user_follows
  WHERE follower_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_follower_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_count(uuid) TO anon, authenticated;
