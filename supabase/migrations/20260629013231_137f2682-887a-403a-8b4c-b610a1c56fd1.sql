
DROP POLICY IF EXISTS "Organization members viewable to authenticated" ON public.organization_members;

CREATE POLICY "Members can view their org memberships"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.org_id AND o.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.organization_members m2
    WHERE m2.org_id = organization_members.org_id AND m2.user_id = auth.uid()
  )
);
