
CREATE TABLE public.creator_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  creator_name TEXT NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (discount_percent > 0 AND discount_percent <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX creator_codes_code_lower_idx ON public.creator_codes (lower(code));

GRANT SELECT ON public.creator_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_codes TO authenticated;
GRANT ALL ON public.creator_codes TO service_role;

ALTER TABLE public.creator_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active creator codes"
  ON public.creator_codes FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can read all creator codes"
  ON public.creator_codes FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can insert creator codes"
  ON public.creator_codes FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update creator codes"
  ON public.creator_codes FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can delete creator codes"
  ON public.creator_codes FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER creator_codes_set_updated_at
  BEFORE UPDATE ON public.creator_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.apply_creator_code(_code TEXT)
RETURNS TABLE(id uuid, code text, creator_name text, discount_percent numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.creator_codes;
BEGIN
  SELECT * INTO row FROM public.creator_codes
  WHERE lower(code) = lower(trim(_code)) AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid creator code';
  END IF;

  IF row.max_uses IS NOT NULL AND row.uses_count >= row.max_uses THEN
    RAISE EXCEPTION 'This creator code has reached its usage limit';
  END IF;

  UPDATE public.creator_codes
    SET uses_count = uses_count + 1
    WHERE id = row.id;

  RETURN QUERY SELECT row.id, row.code, row.creator_name, row.discount_percent;
END;
$$;
