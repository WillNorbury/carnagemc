
drop policy if exists "Anyone can insert their own check log" on public.admin_check_logs;

revoke execute on function public.check_is_admin_logged(text, text) from anon, public;
grant execute on function public.check_is_admin_logged(text, text) to authenticated;
