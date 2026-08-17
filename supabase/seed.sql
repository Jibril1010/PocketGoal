-- GoalGame example seed data
-- Run after 0001_init.sql. Sprite URLs point at pokemondb.net's animated sprite
-- assets (personal/local reference only — do not redistribute).

-- ============================================================
-- Characters (fixed ids so the sprite/move inserts below can reference them)
-- ============================================================

insert into characters (id, name, types, coin_cost, is_starter) values
  ('11111111-1111-1111-1111-111111111111', 'Victini',   '{fire,psychic}', 0,   true),
  ('22222222-2222-2222-2222-222222222222', 'Squirtle',  '{water}',        150, false),
  ('33333333-3333-3333-3333-333333333333', 'Bulbasaur', '{grass,poison}', 150, false),
  ('44444444-4444-4444-4444-444444444444', 'Pikachu',   '{electric}',     150, false),
  ('55555555-5555-5555-5555-555555555555', 'Klefki',    '{steel,fairy}',  250, false),
  ('66666666-6666-6666-6666-666666666666', 'Charmander','{fire}',         150, false);

-- 4 sprite slots per character: front normal / front shiny / back normal / back shiny
insert into character_sprites (character_id, slot, image_url) values
  ('11111111-1111-1111-1111-111111111111', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/victini.gif'),
  ('11111111-1111-1111-1111-111111111111', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/victini.gif'),
  ('11111111-1111-1111-1111-111111111111', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/victini.gif'),
  ('11111111-1111-1111-1111-111111111111', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/victini.gif'),

  ('22222222-2222-2222-2222-222222222222', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/squirtle.gif'),
  ('22222222-2222-2222-2222-222222222222', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/squirtle.gif'),
  ('22222222-2222-2222-2222-222222222222', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/squirtle.gif'),
  ('22222222-2222-2222-2222-222222222222', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/squirtle.gif'),

  ('33333333-3333-3333-3333-333333333333', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/bulbasaur.gif'),
  ('33333333-3333-3333-3333-333333333333', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/bulbasaur.gif'),
  ('33333333-3333-3333-3333-333333333333', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/bulbasaur.gif'),
  ('33333333-3333-3333-3333-333333333333', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/bulbasaur.gif'),

  ('44444444-4444-4444-4444-444444444444', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/pikachu.gif'),
  ('44444444-4444-4444-4444-444444444444', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/pikachu.gif'),
  ('44444444-4444-4444-4444-444444444444', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/pikachu.gif'),
  ('44444444-4444-4444-4444-444444444444', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/pikachu.gif'),

  ('55555555-5555-5555-5555-555555555555', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/klefki.gif'),
  ('55555555-5555-5555-5555-555555555555', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/klefki.gif'),
  ('55555555-5555-5555-5555-555555555555', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/klefki.gif'),
  ('55555555-5555-5555-5555-555555555555', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/klefki.gif'),

  ('66666666-6666-6666-6666-666666666666', 1, 'https://img.pokemondb.net/sprites/black-white/anim/normal/charmander.gif'),
  ('66666666-6666-6666-6666-666666666666', 2, 'https://img.pokemondb.net/sprites/black-white/anim/shiny/charmander.gif'),
  ('66666666-6666-6666-6666-666666666666', 3, 'https://img.pokemondb.net/sprites/black-white/anim/back-normal/charmander.gif'),
  ('66666666-6666-6666-6666-666666666666', 4, 'https://img.pokemondb.net/sprites/black-white/anim/back-shiny/charmander.gif');

-- ============================================================
-- Moves
-- ============================================================

insert into moves (id, name, type, base_damage, daily_limit) values
  ('a0000000-0000-0000-0000-000000000001', 'Tackle',       'normal',   10, 8),
  ('a0000000-0000-0000-0000-000000000002', 'Ember',        'fire',     15, 5),
  ('a0000000-0000-0000-0000-000000000003', 'Fire Blast',   'fire',     35, 2),
  ('a0000000-0000-0000-0000-000000000004', 'Water Gun',    'water',    15, 5),
  ('a0000000-0000-0000-0000-000000000005', 'Hydro Pump',   'water',    35, 2),
  ('a0000000-0000-0000-0000-000000000006', 'Vine Whip',    'grass',    15, 5),
  ('a0000000-0000-0000-0000-000000000007', 'Solar Beam',   'grass',    35, 2),
  ('a0000000-0000-0000-0000-000000000008', 'Thunder Shock','electric', 15, 5),
  ('a0000000-0000-0000-0000-000000000009', 'Thunderbolt',  'electric', 30, 3),
  ('a0000000-0000-0000-0000-00000000000a', 'Iron Head',    'steel',    25, 3),
  ('a0000000-0000-0000-0000-00000000000b', 'Flash Cannon', 'steel',    35, 2),
  ('a0000000-0000-0000-0000-00000000000c', 'Fairy Wind',   'fairy',    15, 5),
  ('a0000000-0000-0000-0000-00000000000d', 'Moonblast',    'fairy',    35, 2),
  ('a0000000-0000-0000-0000-00000000000e', 'Psybeam',      'psychic',  20, 4),
  ('a0000000-0000-0000-0000-00000000000f', 'Poison Jab',   'poison',   20, 4);

-- ============================================================
-- Which moves each character can equip (own-type moves + a couple generalists)
-- ============================================================

insert into character_moves (character_id, move_id) values
  -- Victini: fire, psychic
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000003'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000e'),
  -- Squirtle: water
  ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000004'),
  ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000005'),
  ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-00000000000e'),
  -- Bulbasaur: grass, poison
  ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001'),
  ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000006'),
  ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000007'),
  ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-00000000000f'),
  -- Pikachu: electric
  ('44444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-000000000001'),
  ('44444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-000000000008'),
  ('44444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-000000000009'),
  ('44444444-4444-4444-4444-444444444444', 'a0000000-0000-0000-0000-00000000000a'),
  -- Klefki: steel, fairy
  ('55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-000000000001'),
  ('55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-00000000000a'),
  ('55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-00000000000b'),
  ('55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-00000000000c'),
  ('55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-00000000000d'),
  -- Charmander: fire
  ('66666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-000000000001'),
  ('66666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-000000000002'),
  ('66666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-000000000003'),
  ('66666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-00000000000e');
