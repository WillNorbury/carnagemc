UPDATE public.plugins
SET download_url = NULL
WHERE download_url ILIKE '%/storage/v1/object/public/plugin-jars/%';

UPDATE public.plugin_versions
SET download_url = NULL
WHERE download_url ILIKE '%/storage/v1/object/public/plugin-jars/%';