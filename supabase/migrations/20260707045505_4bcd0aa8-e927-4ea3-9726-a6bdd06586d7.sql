
-- ============ plugin_downloads ============
CREATE TABLE public.plugin_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plugin_downloads_plugin_created_idx ON public.plugin_downloads(plugin_id, created_at DESC);
CREATE INDEX plugin_downloads_user_created_idx ON public.plugin_downloads(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Grants: allow inserts from anon+auth so counts can include signed-out visitors.
-- No SELECT to end-users (aggregates come from SECURITY DEFINER functions).
GRANT INSERT ON public.plugin_downloads TO anon, authenticated;
GRANT ALL ON public.plugin_downloads TO service_role;

ALTER TABLE public.plugin_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a download"
  ON public.plugin_downloads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Ensure signed-in users only stamp their own uid; anon must leave it null.
    (auth.uid() IS NULL AND user_id IS NULL) OR
    (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

-- ============ plugin_favorites ============
CREATE TABLE public.plugin_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, plugin_id)
);
CREATE INDEX plugin_favorites_plugin_idx ON public.plugin_favorites(plugin_id);

GRANT SELECT, INSERT, DELETE ON public.plugin_favorites TO authenticated;
GRANT ALL ON public.plugin_favorites TO service_role;

ALTER TABLE public.plugin_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own favorites"
  ON public.plugin_favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============ Helper functions ============
CREATE OR REPLACE FUNCTION public.record_plugin_download(_plugin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.plugins WHERE id = _plugin_id AND published = true) THEN
    RETURN;
  END IF;
  INSERT INTO public.plugin_downloads (plugin_id, user_id)
  VALUES (_plugin_id, auth.uid());
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_plugin_download(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_plugin_download_counts(_plugin_ids uuid[] DEFAULT NULL)
RETURNS TABLE(plugin_id uuid, total bigint, last_7d bigint, last_30d bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.plugin_id,
         count(*)::bigint AS total,
         count(*) FILTER (WHERE d.created_at >= now() - interval '7 days')::bigint AS last_7d,
         count(*) FILTER (WHERE d.created_at >= now() - interval '30 days')::bigint AS last_30d
  FROM public.plugin_downloads d
  WHERE _plugin_ids IS NULL OR d.plugin_id = ANY(_plugin_ids)
  GROUP BY d.plugin_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_plugin_download_counts(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_plugin_favorite_counts(_plugin_ids uuid[] DEFAULT NULL)
RETURNS TABLE(plugin_id uuid, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.plugin_id, count(*)::bigint
  FROM public.plugin_favorites f
  WHERE _plugin_ids IS NULL OR f.plugin_id = ANY(_plugin_ids)
  GROUP BY f.plugin_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_plugin_favorite_counts(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_trending_plugins(_days int DEFAULT 7, _limit int DEFAULT 6)
RETURNS TABLE(plugin_id uuid, downloads bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.plugin_id, count(*)::bigint AS downloads
  FROM public.plugin_downloads d
  JOIN public.plugins p ON p.id = d.plugin_id AND p.published = true
  WHERE d.created_at >= now() - (GREATEST(_days,1) || ' days')::interval
  GROUP BY d.plugin_id
  ORDER BY downloads DESC
  LIMIT GREATEST(_limit, 1);
$$;
GRANT EXECUTE ON FUNCTION public.get_trending_plugins(int, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.toggle_plugin_favorite(_plugin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existed boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.plugins WHERE id = _plugin_id) THEN
    RAISE EXCEPTION 'plugin not found';
  END IF;
  DELETE FROM public.plugin_favorites
    WHERE user_id = uid AND plugin_id = _plugin_id
    RETURNING true INTO existed;
  IF existed THEN RETURN false; END IF;
  INSERT INTO public.plugin_favorites(user_id, plugin_id) VALUES (uid, _plugin_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_plugin_favorite(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_recent_plugin_downloads(_limit int DEFAULT 10)
RETURNS TABLE(plugin_id uuid, last_downloaded timestamptz, download_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.plugin_id, max(d.created_at) AS last_downloaded, count(*)::bigint
  FROM public.plugin_downloads d
  WHERE d.user_id = auth.uid()
  GROUP BY d.plugin_id
  ORDER BY last_downloaded DESC
  LIMIT GREATEST(_limit, 1);
$$;
GRANT EXECUTE ON FUNCTION public.get_my_recent_plugin_downloads(int) TO authenticated;
