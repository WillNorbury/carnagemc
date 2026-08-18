GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at) ON public.organizations TO anon;
GRANT SELECT (id, slug, name, description, avatar_url, owner_id, created_at, updated_at) ON public.organizations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;