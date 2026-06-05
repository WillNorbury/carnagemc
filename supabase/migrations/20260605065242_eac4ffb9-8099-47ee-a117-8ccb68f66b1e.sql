
ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mc_versions text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.mods
  ADD COLUMN IF NOT EXISTS loaders text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mc_versions text[] NOT NULL DEFAULT '{}';

-- Backfill from legacy singular columns
UPDATE public.plugins
  SET platforms = ARRAY[platform]
  WHERE platform IS NOT NULL AND platform <> '' AND (platforms IS NULL OR array_length(platforms,1) IS NULL);

UPDATE public.mods
  SET loaders = ARRAY[loader]
  WHERE loader IS NOT NULL AND loader <> '' AND (loaders IS NULL OR array_length(loaders,1) IS NULL);

UPDATE public.mods
  SET mc_versions = ARRAY[mc_version]
  WHERE mc_version IS NOT NULL AND mc_version <> '' AND (mc_versions IS NULL OR array_length(mc_versions,1) IS NULL);
