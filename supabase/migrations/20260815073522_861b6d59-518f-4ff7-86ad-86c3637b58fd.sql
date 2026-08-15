-- ===== Gallery video support =====
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_provider text;

-- ===== Player stats table =====
CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES public.mc_servers(id) ON DELETE SET NULL,
  player_uuid text NOT NULL,
  player_name text NOT NULL,
  kills integer NOT NULL DEFAULT 0,
  deaths integer NOT NULL DEFAULT 0,
  killstreak integer NOT NULL DEFAULT 0,
  best_killstreak integer NOT NULL DEFAULT 0,
  playtime_seconds bigint NOT NULL DEFAULT 0,
  balance double precision NOT NULL DEFAULT 0,
  mob_kills integer NOT NULL DEFAULT 0,
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_uuid)
);

CREATE INDEX IF NOT EXISTS player_stats_name_idx ON public.player_stats (lower(player_name));
CREATE INDEX IF NOT EXISTS player_stats_kills_idx ON public.player_stats (kills DESC);
CREATE INDEX IF NOT EXISTS player_stats_balance_idx ON public.player_stats (balance DESC);

GRANT SELECT ON public.player_stats TO anon, authenticated;
GRANT ALL ON public.player_stats TO service_role;

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player stats"
  ON public.player_stats FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===== Leaderboard RPC (aggregated across servers by player name) =====
CREATE OR REPLACE FUNCTION public.get_stats_leaderboard(_metric text, _limit integer DEFAULT 50)
RETURNS TABLE (
  player_name text,
  kills integer,
  deaths integer,
  killstreak integer,
  best_killstreak integer,
  playtime_seconds bigint,
  balance double precision,
  mob_kills integer,
  kdr numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    player_name,
    SUM(kills)::integer AS kills,
    SUM(deaths)::integer AS deaths,
    MAX(killstreak)::integer AS killstreak,
    MAX(best_killstreak)::integer AS best_killstreak,
    SUM(playtime_seconds)::bigint AS playtime_seconds,
    SUM(balance)::double precision AS balance,
    SUM(mob_kills)::integer AS mob_kills,
    CASE WHEN SUM(deaths) > 0
      THEN round(SUM(kills)::numeric / SUM(deaths), 2)
      ELSE SUM(kills)::numeric
    END AS kdr
  FROM public.player_stats
  GROUP BY player_name
  ORDER BY
    CASE _metric
      WHEN 'kills'           THEN SUM(kills)::double precision
      WHEN 'deaths'          THEN SUM(deaths)::double precision
      WHEN 'killstreak'      THEN MAX(killstreak)::double precision
      WHEN 'best_killstreak' THEN MAX(best_killstreak)::double precision
      WHEN 'playtime'        THEN SUM(playtime_seconds)::double precision
      WHEN 'balance'         THEN SUM(balance)
      WHEN 'mob_kills'       THEN SUM(mob_kills)::double precision
      WHEN 'kdr'             THEN CASE WHEN SUM(deaths) > 0 THEN SUM(kills)::double precision / SUM(deaths) ELSE SUM(kills)::double precision END
      ELSE 0
    END DESC,
    player_name ASC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_stats_leaderboard(text, integer) TO anon, authenticated;

-- ===== Single player stats RPC (aggregated) =====
CREATE OR REPLACE FUNCTION public.get_player_stats_by_name(_player_name text)
RETURNS TABLE (
  player_name text,
  kills integer,
  deaths integer,
  killstreak integer,
  best_killstreak integer,
  playtime_seconds bigint,
  balance double precision,
  mob_kills integer,
  kdr numeric,
  last_seen_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    player_name,
    SUM(kills)::integer,
    SUM(deaths)::integer,
    MAX(killstreak)::integer,
    MAX(best_killstreak)::integer,
    SUM(playtime_seconds)::bigint,
    SUM(balance)::double precision,
    SUM(mob_kills)::integer,
    CASE WHEN SUM(deaths) > 0
      THEN round(SUM(kills)::numeric / SUM(deaths), 2)
      ELSE SUM(kills)::numeric
    END,
    MAX(last_seen_at),
    MAX(updated_at)
  FROM public.player_stats
  WHERE lower(player_name) = lower(_player_name)
  GROUP BY player_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_stats_by_name(text) TO anon, authenticated;