ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS license text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS issues_url text,
  ADD COLUMN IF NOT EXISTS discord_url text;