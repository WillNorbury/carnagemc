
create policy "Users read their own check logs"
on public.admin_check_logs for select
to authenticated
using (auth.uid() = user_id);
