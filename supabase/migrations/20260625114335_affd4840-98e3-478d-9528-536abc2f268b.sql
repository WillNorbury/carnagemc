CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result text;
BEGIN
  IF NOT (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT email INTO result FROM auth.users WHERE id = _user_id;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_email(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;