create table if not exists public.user_streaks (
  user_id uuid primary key,
  login_streak integer not null default 0,
  login_best integer not null default 0,
  last_login_date date,
  total_logins integer not null default 0,
  vote_streak integer not null default 0,
  vote_best integer not null default 0,
  last_vote_date date,
  total_votes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

drop policy if exists "Streaks public read" on public.user_streaks;
create policy "Streaks public read" on public.user_streaks for select using (true);

create or replace function public.record_login_streak()
returns public.user_streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  row public.user_streaks;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_streaks (user_id, login_streak, login_best, last_login_date, total_logins)
  values (uid, 1, 1, today, 1)
  on conflict (user_id) do update set
    login_streak = case
      when public.user_streaks.last_login_date = today then public.user_streaks.login_streak
      when public.user_streaks.last_login_date = today - 1 then public.user_streaks.login_streak + 1
      else 1
    end,
    total_logins = public.user_streaks.total_logins
      + case when public.user_streaks.last_login_date = today then 0 else 1 end,
    last_login_date = today,
    updated_at = now()
  returning * into row;

  update public.user_streaks
    set login_best = greatest(login_best, login_streak)
    where user_id = uid
    returning * into row;

  return row;
end;
$$;

create or replace function public.record_vote_streak()
returns public.user_streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  row public.user_streaks;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_streaks (user_id, vote_streak, vote_best, last_vote_date, total_votes)
  values (uid, 1, 1, today, 1)
  on conflict (user_id) do update set
    vote_streak = case
      when public.user_streaks.last_vote_date = today then public.user_streaks.vote_streak
      when public.user_streaks.last_vote_date = today - 1 then public.user_streaks.vote_streak + 1
      else 1
    end,
    total_votes = public.user_streaks.total_votes + 1,
    last_vote_date = today,
    updated_at = now()
  returning * into row;

  update public.user_streaks
    set vote_best = greatest(vote_best, vote_streak)
    where user_id = uid
    returning * into row;

  return row;
end;
$$;

grant execute on function public.record_login_streak() to authenticated;
grant execute on function public.record_vote_streak() to authenticated;