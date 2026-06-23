
CREATE OR REPLACE FUNCTION public.discover_items_slugify(_name text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_name,'')), '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.discover_items_set_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base := public.discover_items_slugify(NEW.name);
    IF base IS NULL OR base = '' THEN
      base := 'item';
    END IF;
    candidate := base;
    WHILE EXISTS (
      SELECT 1 FROM public.discover_items
      WHERE kind = NEW.kind AND slug = candidate AND id <> NEW.id
    ) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discover_items_set_slug_trg ON public.discover_items;
CREATE TRIGGER discover_items_set_slug_trg
BEFORE INSERT OR UPDATE OF name, slug ON public.discover_items
FOR EACH ROW EXECUTE FUNCTION public.discover_items_set_slug();

-- Backfill existing rows
DO $$
DECLARE r record; base text; candidate text; n int;
BEGIN
  FOR r IN SELECT id, kind, name FROM public.discover_items WHERE slug IS NULL OR length(trim(slug)) = 0 LOOP
    base := public.discover_items_slugify(r.name);
    IF base = '' OR base IS NULL THEN base := 'item'; END IF;
    candidate := base; n := 0;
    WHILE EXISTS (SELECT 1 FROM public.discover_items WHERE kind = r.kind AND slug = candidate AND id <> r.id) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    UPDATE public.discover_items SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;
