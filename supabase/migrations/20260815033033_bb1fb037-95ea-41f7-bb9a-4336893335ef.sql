-- 1. Hide identity columns from anonymous visitors
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.item_reviews FROM anon;
REVOKE SELECT (user_id) ON public.mod_reviews FROM anon;
REVOKE SELECT (owner_id) ON public.organizations FROM anon;

-- 2. Public-safe review readers
CREATE OR REPLACE FUNCTION public.get_public_reviews(_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_avatar text,
  author_mc_username text,
  author_ref text,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.rating::smallint, r.body, r.created_at, r.updated_at,
         p.display_name, p.avatar_url, p.mc_username,
         left(r.user_id::text, 8),
         (auth.uid() IS NOT NULL AND r.user_id = auth.uid())
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT greatest(1, least(coalesce(_limit, 30), 200));
$$;

CREATE OR REPLACE FUNCTION public.get_public_item_reviews(_target_type text, _target_id uuid)
RETURNS TABLE (
  id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_avatar text,
  author_mc_username text,
  author_ref text,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.rating, r.body, r.created_at, r.updated_at,
         p.display_name, p.avatar_url, p.mc_username,
         left(r.user_id::text, 8),
         (auth.uid() IS NOT NULL AND r.user_id = auth.uid())
  FROM public.item_reviews r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.target_type = _target_type AND r.target_id = _target_id
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_public_mod_reviews(_mod_id uuid)
RETURNS TABLE (
  id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_avatar text,
  author_mc_username text,
  author_ref text,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.rating, r.body, r.created_at, r.updated_at,
         p.display_name, p.avatar_url, p.mc_username,
         left(r.user_id::text, 8),
         (auth.uid() IS NOT NULL AND r.user_id = auth.uid())
  FROM public.mod_reviews r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.mod_id = _mod_id
  ORDER BY r.created_at DESC;
$$;

-- 3. Ownership check without exposing owner_id
CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = _org_id AND o.owner_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reviews(int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_item_reviews(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_mod_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;