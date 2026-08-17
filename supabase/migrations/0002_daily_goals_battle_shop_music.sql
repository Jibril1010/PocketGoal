-- GoalGame v2 schema additions: daily goals, HP-based battles, purchasable
-- moves, music. Additive only — safe to run after 0001_init.sql + seed.sql
-- on a project that already has data.

-- ============================================================
-- Daily goals
-- ============================================================

alter table goals add column if not exists is_daily boolean not null default false;

create table if not exists daily_goal_completions (
  goal_id uuid not null references goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null default current_date,
  primary key (goal_id, completion_date)
);

alter table daily_goal_completions enable row level security;

create policy "own daily_goal_completions" on daily_goal_completions
  for select using (auth.uid() = user_id);

-- ============================================================
-- Battle: HP for both sides + a randomly-assigned boss sprite
-- ============================================================

alter table boss_encounters add column if not exists boss_character_id uuid references characters(id);
alter table boss_encounters add column if not exists user_current_health integer;
alter table boss_encounters add column if not exists user_max_health integer;

-- ============================================================
-- Moves become purchasable; ownership replaces the old
-- character_moves eligibility gate for equipping.
-- ============================================================

alter table moves add column if not exists coin_cost integer not null default 0;

create table if not exists user_moves (
  user_id uuid not null references auth.users(id) on delete cascade,
  move_id uuid not null references moves(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, move_id)
);

alter table user_moves enable row level security;

create policy "own user_moves select" on user_moves for select using (auth.uid() = user_id);
create policy "own user_moves insert" on user_moves for insert with check (auth.uid() = user_id);

-- ============================================================
-- Music
-- ============================================================

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  file_url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table songs enable row level security;

create policy "public read songs" on songs for select using (true);
create policy "authenticated insert songs" on songs for insert with check (auth.uid() = uploaded_by);

create table if not exists user_music_selection (
  user_id uuid primary key references auth.users(id) on delete cascade,
  song_id uuid references songs(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table user_music_selection enable row level security;

create policy "own user_music_selection select" on user_music_selection for select using (auth.uid() = user_id);
create policy "own user_music_selection upsert" on user_music_selection for insert with check (auth.uid() = user_id);
create policy "own user_music_selection update" on user_music_selection for update using (auth.uid() = user_id);

-- ============================================================
-- New-user bootstrap: also grant a free starter move kit
-- (Tackle + one move per starter-type, matched by name) so new
-- signups aren't stuck with zero equippable moves now that moves
-- cost coins. Re-declares the whole function (same name as 0001).
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

  insert into public.user_moves (user_id, move_id)
  select new.id, id from public.moves where name in ('Tackle', 'Ember', 'Psybeam')
  on conflict do nothing;

  return new;
end;
$$;
