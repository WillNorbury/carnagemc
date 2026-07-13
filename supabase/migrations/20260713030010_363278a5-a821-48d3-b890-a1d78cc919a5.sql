
-- plugin_downloads: remove open INSERT policy and revoke direct insert grants.
-- The record_plugin_download() SECURITY DEFINER RPC is the only supported path.
DROP POLICY IF EXISTS "Anyone can record a download" ON public.plugin_downloads;
REVOKE INSERT ON public.plugin_downloads FROM anon, authenticated;

-- profiles: hide sensitive `preferences` column from direct reads.
-- Owners still read it via get_my_private_profile() SECURITY DEFINER RPC.
REVOKE SELECT (preferences) ON public.profiles FROM anon, authenticated;
