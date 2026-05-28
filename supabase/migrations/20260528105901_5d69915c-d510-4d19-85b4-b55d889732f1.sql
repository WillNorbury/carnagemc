-- Revoke public execute on the newly created admin check function
-- so it is not callable directly via the API (only used internally by RLS)
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM authenticated;