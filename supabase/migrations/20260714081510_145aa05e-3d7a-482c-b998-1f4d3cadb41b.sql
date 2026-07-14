
CREATE TABLE public.store_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  min_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX store_coupons_code_lower_idx ON public.store_coupons (lower(code));

GRANT SELECT ON public.store_coupons TO anon, authenticated;
GRANT ALL ON public.store_coupons TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.store_coupons TO authenticated;

ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons"
  ON public.store_coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view all coupons"
  ON public.store_coupons FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can insert coupons"
  ON public.store_coupons FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update coupons"
  ON public.store_coupons FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can delete coupons"
  ON public.store_coupons FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER store_coupons_set_updated_at
  BEFORE UPDATE ON public.store_coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
