-- Per-Pokémon move loadouts: each owned character remembers its own 4
-- equipped moves, instead of one shared loadout for the whole account.
-- Additive/backfilling — safe to run on a project with existing data.

alter table user_equipped_moves add column if not exists character_id uuid references characters(id);

update user_equipped_moves uem
set character_id = uc.character_id
from user_characters uc
where uc.user_id = uem.user_id
  and uc.is_main = true
  and uem.character_id is null;

-- Guard: drop any row that still has no character_id (e.g. a user with no
-- main character somehow) rather than leaving it to violate the new NOT NULL.
delete from user_equipped_moves where character_id is null;

alter table user_equipped_moves alter column character_id set not null;

alter table user_equipped_moves drop constraint user_equipped_moves_pkey;
alter table user_equipped_moves add primary key (user_id, character_id, slot);
