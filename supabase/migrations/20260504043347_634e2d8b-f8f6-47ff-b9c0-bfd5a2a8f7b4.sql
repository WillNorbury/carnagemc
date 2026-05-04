create schema if not exists private;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.has_role(uuid, public.app_role) to anon, authenticated;

-- news policies
drop policy if exists "Admins manage news" on public.news;
drop policy if exists "Published news viewable by all" on public.news;
drop policy if exists "Admins can view all news" on public.news;

create policy "Published news viewable by all"
on public.news
for select
to public
using (published);

create policy "Admins can view all news"
on public.news
for select
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins manage news"
on public.news
for all
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- server status policies
drop policy if exists "Admins update status" on public.server_status;

create policy "Admins update status"
on public.server_status
for all
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- site content policies
drop policy if exists "Admins manage site content" on public.site_content;

create policy "Admins manage site content"
on public.site_content
for all
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user role policies
drop policy if exists "Admins manage roles" on public.user_roles;
drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Admins can view roles" on public.user_roles;

create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view roles"
on public.user_roles
for select
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins manage roles"
on public.user_roles
for all
to authenticated
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));