
-- Server-side validation: enforce lowercase email, valid format, and dedupe case-insensitively
ALTER TABLE public.allowed_from_addresses
  ADD CONSTRAINT allowed_from_addresses_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND length(email) <= 254);

ALTER TABLE public.allowed_from_addresses
  ADD CONSTRAINT allowed_from_addresses_display_name_len
  CHECK (display_name IS NULL OR length(display_name) <= 120);

CREATE OR REPLACE FUNCTION public.allowed_from_addresses_normalize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name := nullif(trim(NEW.display_name), '');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS allowed_from_addresses_normalize_trg ON public.allowed_from_addresses;
CREATE TRIGGER allowed_from_addresses_normalize_trg
BEFORE INSERT OR UPDATE ON public.allowed_from_addresses
FOR EACH ROW EXECUTE FUNCTION public.allowed_from_addresses_normalize();
