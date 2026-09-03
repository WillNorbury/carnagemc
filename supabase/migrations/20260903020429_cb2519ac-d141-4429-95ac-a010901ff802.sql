REVOKE SELECT (owner_id) ON public.organizations FROM authenticated;
REVOKE SELECT (preferences) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_organization_owner(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = _org_id AND o.owner_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_organization_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(uuid) TO authenticated;