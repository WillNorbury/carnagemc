-- Hide profiles.preferences from public/anon and normal authenticated reads.
-- App reads user preferences from public.profiles_private / get_my_private_profile();
-- edge functions use the service role, which keeps full access.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Hide organizations.owner_id from anonymous visitors; signed-in users still need it
-- for ownership checks in the UI.
REVOKE SELECT ON public.organizations FROM anon;
GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at)
  ON public.organizations TO anon;
GRANT ALL ON public.organizations TO service_role;