
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS slug text;

-- Backfill from name (lowercase, dashes)
UPDATE public.mods
SET slug = regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')
WHERE slug IS NULL OR slug = '';

-- Deduplicate by appending short_id when collisions occur
UPDATE public.mods m
SET slug = m.slug || '-' || m.short_id
WHERE EXISTS (
  SELECT 1 FROM public.mods m2
  WHERE m2.slug = m.slug AND m2.id <> m.id
);

ALTER TABLE public.mods ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mods_slug_key ON public.mods (slug);
