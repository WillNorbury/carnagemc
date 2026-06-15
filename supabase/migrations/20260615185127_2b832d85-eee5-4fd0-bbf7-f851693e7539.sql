-- Remove column-level SELECT on sensitive Discord fields from public-facing roles.
-- The app reads these via public.get_my_private_profile() (SECURITY DEFINER),
-- which bypasses these grants, so user-facing behavior is preserved.
REVOKE SELECT (discord_id, discord_username, discord_avatar) ON public.profiles FROM anon;
REVOKE SELECT (discord_id, discord_username, discord_avatar) ON public.profiles FROM authenticated;

-- Re-grant SELECT on the remaining (non-sensitive) columns so existing
-- SELECT queries that don't request the discord_* columns keep working.
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at, preferences)
  ON public.profiles TO anon, authenticated;