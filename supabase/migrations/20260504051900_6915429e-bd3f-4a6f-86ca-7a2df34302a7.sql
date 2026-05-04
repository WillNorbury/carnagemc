
create table if not exists public.admin_check_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  is_admin boolean not null,
  roles_found text[],
  context text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.admin_check_logs enable row level security;

create policy "Admins read admin check logs"
on public.admin_check_logs for select
to authenticated
using (private.has_role(auth.uid(), 'admin'::app_role));

create policy "Anyone can insert their own check log"
on public.admin_check_logs for insert
to authenticated, anon
with check (true);

create or replace function public.check_is_admin_logged(_context text default null, _user_agent text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  is_a boolean := false;
  found_roles text[];
  user_email text;
begin
  if uid is not null then
    select array_agg(role::text) into found_roles from public.user_roles where user_id = uid;
    is_a := private.has_role(uid, 'admin'::app_role);
    select email into user_email from auth.users where id = uid;
  end if;

  insert into public.admin_check_logs (user_id, email, is_admin, roles_found, context, user_agent)
  values (uid, user_email, coalesce(is_a, false), found_roles, _context, _user_agent);

  return coalesce(is_a, false);
end;
$$;

grant execute on function public.check_is_admin_logged(text, text) to authenticated, anon;
