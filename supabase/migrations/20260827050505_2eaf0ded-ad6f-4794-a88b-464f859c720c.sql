-- 1) profiles.preferences no longer readable by the public
REVOKE SELECT (preferences) ON public.profiles FROM anon, authenticated;

-- 2) store_coupons: stop public enumeration
ALTER TABLE public.store_coupons
  ADD COLUMN IF NOT EXISTS public_listed boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.store_coupons;
REVOKE SELECT ON public.store_coupons FROM anon;

-- Validate a single submitted code
CREATE OR REPLACE FUNCTION public.validate_store_coupon(_code text)
RETURNS TABLE(id uuid, code text, description text, discount_type text, discount_value numeric,
              currency text, min_subtotal numeric, starts_at timestamptz, expires_at timestamptz,
              limit_reached boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.code, c.description, c.discount_type, c.discount_value, c.currency,
         c.min_subtotal, c.starts_at, c.expires_at,
         (c.max_uses IS NOT NULL AND c.uses_count >= c.max_uses) AS limit_reached
  FROM public.store_coupons c
  WHERE lower(c.code) = lower(trim(_code)) AND c.active = true
  LIMIT 1;
$$;

-- Only explicitly advertised coupons can be listed
CREATE OR REPLACE FUNCTION public.list_public_coupons(_limit integer DEFAULT 4)
RETURNS TABLE(id uuid, code text, description text, discount_type text, discount_value numeric,
              currency text, min_subtotal numeric, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.code, c.description, c.discount_type, c.discount_value, c.currency,
         c.min_subtotal, c.expires_at
  FROM public.store_coupons c
  WHERE c.active = true
    AND c.public_listed = true
    AND (c.starts_at IS NULL OR c.starts_at <= now())
    AND (c.expires_at IS NULL OR c.expires_at > now())
    AND (c.max_uses IS NULL OR c.uses_count < c.max_uses)
  ORDER BY c.discount_value DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 4), 20));
$$;

GRANT EXECUTE ON FUNCTION public.validate_store_coupon(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_coupons(integer) TO anon, authenticated;