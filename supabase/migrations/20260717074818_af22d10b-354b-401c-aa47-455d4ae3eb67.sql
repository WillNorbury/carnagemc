
-- === mc_servers: hide ingest_secret column, expose via RPC ===
REVOKE SELECT (ingest_secret) ON public.mc_servers FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.mc_server_get_ingest_secret(_server_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT private.has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT ingest_secret INTO s
  FROM public.mc_servers
  WHERE id = _server_id AND created_by = auth.uid();
  IF s IS NULL THEN
    RAISE EXCEPTION 'not found';
  END IF;
  RETURN s;
END;
$$;

REVOKE ALL ON FUNCTION public.mc_server_get_ingest_secret(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mc_server_get_ingest_secret(uuid) TO authenticated;

-- === mod_likes: restrict SELECT to owner, expose aggregate counts via RPC ===
DROP POLICY IF EXISTS "mod_likes authenticated read" ON public.mod_likes;

CREATE POLICY "mod_likes user read own"
  ON public.mod_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_mod_like_counts(_mod_ids uuid[])
RETURNS TABLE(mod_id uuid, likes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.mod_id, count(*)::bigint AS likes
  FROM public.mod_likes l
  WHERE l.mod_id = ANY(_mod_ids)
  GROUP BY l.mod_id;
$$;

REVOKE ALL ON FUNCTION public.get_mod_like_counts(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.get_mod_like_counts(uuid[]) TO anon, authenticated;

-- === organizations: hide owner_id from anonymous readers ===
REVOKE SELECT (owner_id) ON public.organizations FROM anon;
GRANT SELECT (id, slug, name, description, avatar_url, created_at, updated_at) ON public.organizations TO anon;
-- authenticated retains full SELECT (needed for OrgProfile isOwner check)
