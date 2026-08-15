-- reviews
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, rating, body, created_at, updated_at) ON public.reviews TO anon;

-- item_reviews
REVOKE SELECT ON public.item_reviews FROM anon;
GRANT SELECT (id, target_type, target_id, rating, body, created_at, updated_at) ON public.item_reviews TO anon;

-- mod_reviews
REVOKE SELECT ON public.mod_reviews FROM anon;
GRANT SELECT (id, mod_id, rating, body, created_at, updated_at) ON public.mod_reviews TO anon;

-- organizations
REVOKE SELECT ON public.organizations FROM anon;
GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at) ON public.organizations TO anon;