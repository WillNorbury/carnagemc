
CREATE OR REPLACE FUNCTION public.gen_plugin_short_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  exists_already boolean;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 100000000))::int::text, 8, '0');
    SELECT EXISTS(SELECT 1 FROM public.plugins WHERE short_id = candidate) INTO exists_already;
    IF NOT exists_already THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;
