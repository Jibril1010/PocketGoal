-- Flags legendary/mythical characters (and their shiny counterparts) so max
-- HP can be boosted for owning them. Additive — safe to run on existing data.

alter table characters add column if not exists is_legendary boolean not null default false;

update characters set is_legendary = true
where regexp_replace(name, '^Shiny ', '') = any (array[
  'Articuno','Zapdos','Moltres','Raikou','Entei','Suicune','Mewtwo','Lugia','Ho-oh','Mew','Celebi',
  'Regirock','Regice','Registeel','Latias','Latios','Uxie','Mesprit','Azelf','Regigigas',
  'Cobalion','Terrakion','Virizion','Tornadus','Thundurus','Landorus',
  'Kyogre','Groudon','Rayquaza','Dialga','Palkia','Giratina','Heatran','Cresselia',
  'Reshiram','Zekrom','Kyurem','Jirachi','Deoxys','Phione','Manaphy','Darkrai','Shaymin','Arceus',
  'Keldeo','Meloetta','Genesect'
]);
