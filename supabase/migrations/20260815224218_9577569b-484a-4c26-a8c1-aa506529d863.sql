GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon;

CREATE POLICY "Organizations viewable by everyone"
ON public.organizations FOR SELECT TO anon USING (true);

GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at) ON public.organizations TO anon;