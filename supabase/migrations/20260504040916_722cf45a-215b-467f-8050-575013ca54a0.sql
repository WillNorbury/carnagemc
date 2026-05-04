-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  mc_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Trigger: auto-create profile + default 'user' role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Profiles RLS
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- user_roles RLS
create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- News
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  cover_url text,
  author_id uuid references auth.users(id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.news enable row level security;
create trigger news_updated_at before update on public.news for each row execute function public.set_updated_at();

create policy "Published news viewable by all" on public.news for select using (published or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage news" on public.news for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Site content (key/value)
create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
create trigger site_content_updated_at before update on public.site_content for each row execute function public.set_updated_at();
create policy "Site content public read" on public.site_content for select using (true);
create policy "Admins manage site content" on public.site_content for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.site_content (key, value) values
  ('hero', '{"title":"Join the Adventure","subtitle":"Explore, build, and forge legends in Zyphora''s unique survival world.","badge":"Minecraft 1.21.x • Paper"}'::jsonb),
  ('server', '{"ip":"play.zyphoramc.net","discord":"https://discord.zyphoramc.net","version":"1.21.x","tagline":"Premium & Cracked supported • 99.9% uptime"}'::jsonb);

-- Server status
create table public.server_status (
  id int primary key default 1,
  online boolean not null default true,
  players_online int not null default 0,
  players_max int not null default 100,
  motd text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
alter table public.server_status enable row level security;
create trigger server_status_updated_at before update on public.server_status for each row execute function public.set_updated_at();
create policy "Server status public read" on public.server_status for select using (true);
create policy "Admins update status" on public.server_status for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.server_status (id, online, players_online, players_max, motd) values (1, true, 0, 500, 'Welcome to ZyphoraMC');