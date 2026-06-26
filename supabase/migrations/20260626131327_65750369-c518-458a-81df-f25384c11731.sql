
CREATE TABLE public.allowed_from_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.allowed_from_addresses TO authenticated;
GRANT ALL ON public.allowed_from_addresses TO service_role;

ALTER TABLE public.allowed_from_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view allowed from addresses"
  ON public.allowed_from_addresses FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins manage allowed from addresses"
  ON public.allowed_from_addresses FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER allowed_from_addresses_set_updated_at
  BEFORE UPDATE ON public.allowed_from_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed with the current hardcoded entries
INSERT INTO public.allowed_from_addresses (email, display_name) VALUES
  ('noreply@carnagemc.net', 'CarnageMC'),
  ('updates@notify.carnagemc.net', 'CarnageMC Updates'),
  ('william@notify.carnagemc.net', 'William @ CarnageMC'),
  ('william@carnagemc.net', 'William @ CarnageMC')
ON CONFLICT (email) DO NOTHING;
