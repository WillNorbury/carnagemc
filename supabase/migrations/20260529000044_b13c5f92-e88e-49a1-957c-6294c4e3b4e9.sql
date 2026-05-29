-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  avatar_url text,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are publicly viewable"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their organizations"
  ON public.organizations FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins manage organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Organization members
CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.organization_members (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

GRANT SELECT ON public.organization_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members are publicly viewable"
  ON public.organization_members FOR SELECT
  USING (true);

CREATE POLICY "Org owners manage members"
  ON public.organization_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = org_id AND o.owner_id = auth.uid()));

CREATE POLICY "Users can leave organizations"
  ON public.organization_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-add owner as member on org creation
CREATE OR REPLACE FUNCTION public.add_owner_as_org_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_add_owner_member
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_org_member();