-- 1. Reviews: remove blanket public read
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "Item reviews public read" ON public.item_reviews;
DROP POLICY IF EXISTS "Mod reviews public read" ON public.mod_reviews;

CREATE POLICY "Users read own review" ON public.reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own item review" ON public.item_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own mod review" ON public.mod_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE SELECT ON public.reviews FROM anon;
REVOKE SELECT ON public.item_reviews FROM anon;
REVOKE SELECT ON public.mod_reviews FROM anon;

-- 2. Organizations: hide owner_id
DROP POLICY IF EXISTS "Organizations are publicly viewable" ON public.organizations;
CREATE POLICY "Organizations viewable by signed-in users" ON public.organizations
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.organizations FROM anon, authenticated;
GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at)
  ON public.organizations TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_organizations()
RETURNS TABLE(id uuid, name text, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.slug
  FROM public.organizations o
  WHERE o.owner_id = auth.uid()
  ORDER BY o.name
$$;
REVOKE ALL ON FUNCTION public.get_my_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_organizations() TO authenticated;

-- 3. SECURITY DEFINER function execution hardening
REVOKE ALL ON FUNCTION public.notify_new_user_report() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_application_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_report_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_creator_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_recent_plugin_downloads(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mc_server_rotate_secret(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_plugin_favorite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_explanations(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff_user(uuid) FROM anon;