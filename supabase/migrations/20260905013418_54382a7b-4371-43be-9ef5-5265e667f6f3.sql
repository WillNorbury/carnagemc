-- profiles: hide the private preferences column from direct table reads.
-- The app reads preferences via the get_my_private_profile() security-definer
-- function (owned by postgres), which is unaffected by column grants.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

-- plugin_versions: hide internal jar storage paths/filenames from anonymous visitors.
-- Authenticated users (plugin owners/admins managing their plugins) keep full access.
REVOKE SELECT ON public.plugin_versions FROM anon;
GRANT SELECT (id, plugin_id, version, changelog, jar_size, download_url, created_by, created_at)
  ON public.plugin_versions TO anon;