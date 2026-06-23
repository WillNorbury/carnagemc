
-- 1) discover_items_slugify: set search_path
CREATE OR REPLACE FUNCTION public.discover_items_slugify(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_name,'')), '[^a-z0-9]+', '-', 'g'));
$function$;

-- 2) profiles: column-level restriction so anon + authenticated cannot read discord_* / preferences
REVOKE SELECT ON public.profiles FROM PUBLIC;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, bio, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3) quiz_options: hide is_correct from anon + authenticated
REVOKE SELECT ON public.quiz_options FROM PUBLIC;
REVOKE SELECT ON public.quiz_options FROM anon;
REVOKE SELECT ON public.quiz_options FROM authenticated;
GRANT SELECT (id, question_id, label, sort_order, created_at)
  ON public.quiz_options TO anon, authenticated;
GRANT ALL ON public.quiz_options TO service_role;

-- 4) site_content: add discord_role_map to the public-read exclusion list
DROP POLICY IF EXISTS "Site content public read" ON public.site_content;
CREATE POLICY "Site content public read"
  ON public.site_content FOR SELECT
  USING (
    key <> ALL (ARRAY[
      'cron_secret',
      'discord_bot',
      'discord_role_map',
      'role_permissions',
      'maintenance',
      'feature_flags',
      'admin_config'
    ])
  );

-- 5) user_streaks: keep public counts readable, but hide last_login_date / last_vote_date
REVOKE SELECT ON public.user_streaks FROM PUBLIC;
REVOKE SELECT ON public.user_streaks FROM anon;
REVOKE SELECT ON public.user_streaks FROM authenticated;
GRANT SELECT (user_id, login_streak, login_best, total_logins, vote_streak, vote_best, total_votes, created_at, updated_at)
  ON public.user_streaks TO anon, authenticated;
GRANT ALL ON public.user_streaks TO service_role;
