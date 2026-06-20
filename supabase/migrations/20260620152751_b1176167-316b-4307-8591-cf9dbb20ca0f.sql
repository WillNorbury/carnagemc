
REVOKE UPDATE (discord_id, discord_username, discord_avatar) ON public.profiles FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb, integer) TO authenticated;
