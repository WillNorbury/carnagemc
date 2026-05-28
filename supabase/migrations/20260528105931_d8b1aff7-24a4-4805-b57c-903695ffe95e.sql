-- Fully lock down the admin check function from direct API calls
REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM authenticated;