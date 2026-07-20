-- TRAINify — initial schema
--
-- Two independent gates guard every table:
--   1. GRANT — whether a role can reach the table through the Data API at all.
--      Required since 2026-04-28; new public-schema tables are no longer
--      exposed automatically. Without it the API returns 42501 *before* RLS is
--      evaluated, which looks exactly like a broken policy.
--   2. RLS  — which rows that role may see once it is through gate 1.
--
-- No table here grants anything to `anon`: all of it is private user data.

-- ---------------------------------------------------------------------------
-- Shared: keep updated_at honest (server-side, never trusted from the client)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- profiles — extends auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  avatar_url    text,
  bio           text,
  fitness_goal  text check (fitness_goal in ('lose','maintain','gain','build-muscle','endurance')),
  -- The profile UI collects a plain age, not a birth date, so store what is
  -- actually captured rather than a date the user is never asked for.
  age           int check (age between 1 and 120),
  height_cm     numeric(5,2) check (height_cm > 0 and height_cm < 300),
  weight_kg     numeric(5,2) check (weight_kg > 0 and weight_kg < 700),
  gender        text check (gender in ('male','female','other')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row automatically so the app never handles "no profile yet".
-- security definer is required (the new user cannot yet write this table) and is
-- safe here: it takes no user-supplied arguments, only the inserted row, and
-- search_path = '' blocks search-path hijacking.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),   -- Google supplies this
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, update on table public.profiles to authenticated;
alter table public.profiles enable row level security;

-- Predicate is `id`, not `user_id`. No INSERT policy: the trigger owns creation.
-- No DELETE policy: rows cascade from auth.users.
create policy "profiles: select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


-- ---------------------------------------------------------------------------
-- workout_plans
-- ---------------------------------------------------------------------------
-- `schedule` stays JSONB rather than normalized child tables: the UI edits and
-- saves a plan as one document, so this matches the access pattern and avoids a
-- 3-table join on every render.
create table if not exists public.workout_plans (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade,
  name                 text not null,
  goal                 text,
  days_per_week        int check (days_per_week between 1 and 7),
  time_per_session_min int,
  experience_level     text,
  equipment            text[] not null default '{}',
  schedule             jsonb  not null default '[]'::jsonb,
  is_active            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists workout_plans_user_created_idx
  on public.workout_plans (user_id, created_at desc);

create trigger workout_plans_set_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- diet_plans
-- ---------------------------------------------------------------------------
create table if not exists public.diet_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  purpose      text,
  calorie_goal int,
  restrictions text[] not null default '{}',
  daily_meals  jsonb  not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists diet_plans_user_created_idx
  on public.diet_plans (user_id, created_at desc);

create trigger diet_plans_set_updated_at
  before update on public.diet_plans
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- calorie_entries — immutable log; a recalculation is a new row
-- ---------------------------------------------------------------------------
create table if not exists public.calorie_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  age            int  not null check (age between 1 and 120),
  gender         text not null,
  weight_kg      numeric(5,2) not null check (weight_kg > 0),
  height_cm      numeric(5,2) not null check (height_cm > 0),
  activity_level text not null,
  goal           text not null,
  bmr            int  not null,
  tdee           int  not null,
  target         int  not null,
  created_at     timestamptz not null default now()
);

create index if not exists calorie_entries_user_created_idx
  on public.calorie_entries (user_id, created_at desc);


-- ---------------------------------------------------------------------------
-- workout_sessions — source for all profile statistics
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  exercise_id   text not null,   -- matches WORKOUTS[].id in the tracker
  exercise_name text not null,   -- denormalized so history survives renames
  reps          int  not null default 0 check (reps >= 0),
  duration_sec  int  not null default 0 check (duration_sec >= 0),
  good_form_pct numeric(5,2) check (good_form_pct between 0 and 100),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists workout_sessions_user_created_idx
  on public.workout_sessions (user_id, created_at desc);


-- ---------------------------------------------------------------------------
-- Grants + RLS for the four user-owned tables
-- ---------------------------------------------------------------------------
-- calorie_entries and workout_sessions are append-only logs, so neither gets an
-- UPDATE grant or policy. Note UPDATE would also require a SELECT policy to
-- function at all — without one it silently affects zero rows.
grant select, insert, update, delete on table public.workout_plans     to authenticated;
grant select, insert, update, delete on table public.diet_plans        to authenticated;
grant select, insert, delete         on table public.calorie_entries   to authenticated;
grant select, insert, delete         on table public.workout_sessions  to authenticated;

alter table public.workout_plans    enable row level security;
alter table public.diet_plans       enable row level security;
alter table public.calorie_entries  enable row level security;
alter table public.workout_sessions enable row level security;

-- `TO authenticated` alone would be authentication without authorization (any
-- logged-in user could read any row). The auth.uid() predicate is what scopes
-- it to the owner. auth.uid() is wrapped in a subselect so Postgres evaluates it
-- once per statement instead of once per row.
do $$
declare t text;
begin
  foreach t in array array['workout_plans','diet_plans','calorie_entries','workout_sessions']
  loop
    execute format($f$
      create policy "%1$s: select own" on public.%1$I
        for select to authenticated using ((select auth.uid()) = user_id);
      create policy "%1$s: insert own" on public.%1$I
        for insert to authenticated with check ((select auth.uid()) = user_id);
      create policy "%1$s: delete own" on public.%1$I
        for delete to authenticated using ((select auth.uid()) = user_id);
    $f$, t);
  end loop;

  -- UPDATE only for the two mutable tables. WITH CHECK is essential: with USING
  -- alone a user could reassign a row's user_id to somebody else.
  foreach t in array array['workout_plans','diet_plans']
  loop
    execute format($f$
      create policy "%1$s: update own" on public.%1$I
        for update to authenticated
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id);
    $f$, t);
  end loop;
end;
$$;


-- ---------------------------------------------------------------------------
-- Storage: avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Files live at <uid>/<filename>, so the first path segment is the owner.
-- Upsert (replacing an avatar) needs INSERT *and* SELECT *and* UPDATE — with
-- INSERT alone the replace fails silently.
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "avatars: update own" on storage.objects
  for update to authenticated
  using      (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
