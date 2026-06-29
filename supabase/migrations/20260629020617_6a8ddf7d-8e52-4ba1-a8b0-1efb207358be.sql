
-- Restrict public exposure of profiles.preferences via column-level grants
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT SELECT (preferences) ON public.profiles TO service_role;

-- Restrict mod_likes SELECT to authenticated users only
DROP POLICY IF EXISTS "mod_likes public read" ON public.mod_likes;
CREATE POLICY "mod_likes authenticated read" ON public.mod_likes
  FOR SELECT TO authenticated USING (true);
