
-- 1) profiles: hide discord_* from anonymous users
REVOKE SELECT (discord_id, discord_username, discord_avatar) ON public.profiles FROM anon;

-- 2) quiz_options: never expose is_correct via PostgREST; SECURITY DEFINER functions bypass column grants
REVOKE SELECT (is_correct) ON public.quiz_options FROM anon, authenticated;

-- 3) user_streaks: remove public read-all policy; restrict to own row; expose leaderboard via SECURITY DEFINER
DROP POLICY IF EXISTS "Streaks public read" ON public.user_streaks;

CREATE POLICY "Users read own streaks"
ON public.user_streaks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_streak_leaderboard(_metric text DEFAULT 'login_streak', _limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  mc_username text,
  avatar_url text,
  login_streak int,
  login_best int,
  total_logins int,
  vote_streak int,
  vote_best int,
  total_votes int
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _metric NOT IN ('login_streak','login_best','total_logins','vote_streak','vote_best','total_votes') THEN
    _metric := 'login_streak';
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT s.user_id, p.display_name, p.mc_username, p.avatar_url,
           s.login_streak, s.login_best, s.total_logins,
           s.vote_streak, s.vote_best, s.total_votes
    FROM public.user_streaks s
    LEFT JOIN public.profiles p ON p.id = s.user_id
    ORDER BY s.%I DESC NULLS LAST
    LIMIT %L
  $q$, _metric, GREATEST(_limit, 1));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_streak_leaderboard(text, int) TO anon, authenticated;
