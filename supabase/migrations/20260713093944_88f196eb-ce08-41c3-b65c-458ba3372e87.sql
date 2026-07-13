
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = _org_id AND user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Members can view their org memberships" ON public.organization_members;

CREATE POLICY "Members can view their org memberships"
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.org_id AND o.owner_id = auth.uid()
  )
  OR public.is_org_member(org_id, auth.uid())
);
