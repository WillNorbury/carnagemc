REVOKE ALL ON FUNCTION public.can_access_ticket(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(uuid) TO authenticated;