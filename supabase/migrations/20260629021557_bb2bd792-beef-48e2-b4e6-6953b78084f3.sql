
-- 1) news_email_opt_outs: allow users to insert their own opt-out
CREATE POLICY "Users can insert own opt-out"
ON public.news_email_opt_outs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) profiles: enforce column-level access so 'preferences' is never readable by anon/authenticated
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT SELECT (preferences) ON public.profiles TO service_role;

-- Replace the overly-broad public SELECT policy with an explicit one (column grants are the real gate)
DROP POLICY IF EXISTS "Public profile fields are viewable" ON public.profiles;
CREATE POLICY "Public profile non-private columns viewable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

COMMENT ON POLICY "Public profile non-private columns viewable" ON public.profiles IS
  'Row access is public; the preferences column is excluded via column-level GRANTs (only service_role can read it). Users read their own preferences via get_my_private_profile().';
