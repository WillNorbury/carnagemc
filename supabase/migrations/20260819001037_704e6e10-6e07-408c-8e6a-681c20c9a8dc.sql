GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at) ON public.organizations TO anon;