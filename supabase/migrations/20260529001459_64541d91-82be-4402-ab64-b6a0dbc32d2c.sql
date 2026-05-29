ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.slugify(_input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_input,'')), '[^a-z0-9]+', '-', 'g'))
$$;

UPDATE public.plugins SET slug = public.slugify(name) WHERE slug IS NULL;

-- handle duplicates by appending short_id
UPDATE public.plugins p SET slug = public.slugify(name) || '-' || short_id
WHERE EXISTS (SELECT 1 FROM public.plugins p2 WHERE p2.slug = p.slug AND p2.id <> p.id);

CREATE OR REPLACE FUNCTION public.plugins_set_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.name);
    IF EXISTS (SELECT 1 FROM public.plugins WHERE slug = NEW.slug AND id <> NEW.id) THEN
      NEW.slug := NEW.slug || '-' || NEW.short_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plugins_set_slug_trg ON public.plugins;
CREATE TRIGGER plugins_set_slug_trg BEFORE INSERT OR UPDATE ON public.plugins
FOR EACH ROW EXECUTE FUNCTION public.plugins_set_slug();