-- GoalGame schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- Reference tables (public read-only)
-- ============================================================

create table characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  types text[] not null default '{}',
  coin_cost integer not null default 0,
  is_starter boolean not null default false,
  created_at timestamptz not null default now()
);

create table character_sprites (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  image_url text not null,
  unique (character_id, slot)
);

create table moves (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  base_damage integer not null check (base_damage > 0),
  daily_limit integer not null check (daily_limit > 0)
);

create table character_moves (
  character_id uuid not null references characters(id) on delete cascade,
  move_id uuid not null references moves(id) on delete cascade,
  primary key (character_id, move_id)
);

-- ============================================================
-- Per-user tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  level integer not null default 1,
  current_exp integer not null default 0,
  coins integer not null default 0,
  goals_completed_count integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now()
);

create table user_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  is_main boolean not null default false,
  is_on_homescreen boolean not null default true,
  pos_x numeric not null default 50,
  pos_y numeric not null default 50,
  unlocked_at timestamptz not null default now(),
  unique (user_id, character_id)
);

create table user_equipped_moves (
  user_id uuid not null references auth.users(id) on delete cascade,
  move_id uuid not null references moves(id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  primary key (user_id, slot)
);

create table user_move_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  move_id uuid not null references moves(id) on delete cascade,
  usage_date date not null default current_date,
  uses_count integer not null default 0,
  primary key (user_id, move_id, usage_date)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed')),
  difficulty_tier text check (difficulty_tier in ('easy', 'medium', 'hard', 'epic')),
  exp_reward integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table daily_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null default current_date,
  primary key (user_id, completion_date)
);

create table boss_encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level_number integer not null check (level_number > 0),
  boss_max_health integer not null,
  boss_current_health integer not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'defeated')),
  created_at timestamptz not null default now(),
  defeated_at timestamptz,
  unique (user_id, level_number)
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table characters enable row level security;
alter table character_sprites enable row level security;
alter table moves enable row level security;
alter table character_moves enable row level security;
alter table profiles enable row level security;
alter table user_characters enable row level security;
alter table user_equipped_moves enable row level security;
alter table user_move_usage enable row level security;
alter table goals enable row level security;
alter table daily_completions enable row level security;
alter table boss_encounters enable row level security;
alter table push_subscriptions enable row level security;

-- Public read-only reference data
create policy "public read characters" on characters for select using (true);
create policy "public read character_sprites" on character_sprites for select using (true);
create policy "public read moves" on moves for select using (true);
create policy "public read character_moves" on character_moves for select using (true);

-- Row-owned tables: users may only see/modify their own rows.
-- (The backend uses the service-role key for writes that need to bypass these,
--  e.g. awarding coins/exp; these policies also allow direct client reads.)

create policy "own profile select" on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);

create policy "own user_characters" on user_characters for select using (auth.uid() = user_id);
create policy "own user_characters update" on user_characters for update using (auth.uid() = user_id);
create policy "own user_characters insert" on user_characters for insert with check (auth.uid() = user_id);

create policy "own user_equipped_moves" on user_equipped_moves for select using (auth.uid() = user_id);
create policy "own user_equipped_moves upsert" on user_equipped_moves for insert with check (auth.uid() = user_id);
create policy "own user_equipped_moves update" on user_equipped_moves for update using (auth.uid() = user_id);

create policy "own user_move_usage" on user_move_usage for select using (auth.uid() = user_id);

create policy "own goals select" on goals for select using (auth.uid() = user_id);
create policy "own goals insert" on goals for insert with check (auth.uid() = user_id);
create policy "own goals update" on goals for update using (auth.uid() = user_id);

create policy "own daily_completions" on daily_completions for select using (auth.uid() = user_id);

create policy "own boss_encounters" on boss_encounters for select using (auth.uid() = user_id);

create policy "own push_subscriptions select" on push_subscriptions for select using (auth.uid() = user_id);
create policy "own push_subscriptions insert" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "own push_subscriptions delete" on push_subscriptions for delete using (auth.uid() = user_id);

-- ============================================================
-- New-user bootstrap: create a profile row + grant the starter character
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  starter_id uuid;
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));

  select id into starter_id from public.characters where is_starter = true limit 1;

  if starter_id is not null then
    insert into public.user_characters (user_id, character_id, is_main, is_on_homescreen, pos_x, pos_y)
    values (new.id, starter_id, true, true, 50, 50);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
