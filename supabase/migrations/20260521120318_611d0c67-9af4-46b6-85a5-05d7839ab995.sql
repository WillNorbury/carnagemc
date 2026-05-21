revoke execute on function public.record_login_streak() from public, anon;
revoke execute on function public.record_vote_streak() from public, anon;
grant execute on function public.record_login_streak() to authenticated;
grant execute on function public.record_vote_streak() to authenticated;