DROP POLICY IF EXISTS "Anyone can read active creator codes" ON public.creator_codes;

CREATE OR REPLACE FUNCTION public.validate_creator_code(_code text)
RETURNS TABLE(id uuid, code text, creator_name text, discount_percent numeric, limit_reached boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.code, c.creator_name, c.discount_percent,
         (c.max_uses IS NOT NULL AND c.uses_count >= c.max_uses) AS limit_reached
  FROM public.creator_codes c
  WHERE lower(c.code) = lower(trim(_code)) AND c.active = true
  LIMIT 1;
$$;
