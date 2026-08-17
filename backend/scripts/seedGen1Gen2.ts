// One-time (idempotent) data seed: the full Gen 1-2 Pokémon roster and every
// damaging move introduced in Gen 1-2, pulled live from pokemondb.net.
// Skips anything whose name already exists so it's safe to re-run and won't
// duplicate the original hand-seeded characters/moves.
//
// Run with: npx tsx scripts/seedGen1Gen2.ts   (from backend/)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Species data — National Dex #001-251, real types (pokemondb.net)
// ============================================================
type SpeciesRow = [number, string, string, string | null];

const SPECIES: SpeciesRow[] = [
  [1, "Bulbasaur", "grass", "poison"], [2, "Ivysaur", "grass", "poison"], [3, "Venusaur", "grass", "poison"],
  [4, "Charmander", "fire", null], [5, "Charmeleon", "fire", null], [6, "Charizard", "fire", "flying"],
  [7, "Squirtle", "water", null], [8, "Wartortle", "water", null], [9, "Blastoise", "water", null],
  [10, "Caterpie", "bug", null], [11, "Metapod", "bug", null], [12, "Butterfree", "bug", "flying"],
  [13, "Weedle", "bug", "poison"], [14, "Kakuna", "bug", "poison"], [15, "Beedrill", "bug", "poison"],
  [16, "Pidgey", "normal", "flying"], [17, "Pidgeotto", "normal", "flying"], [18, "Pidgeot", "normal", "flying"],
  [19, "Rattata", "normal", null], [20, "Raticate", "normal", null],
  [21, "Spearow", "normal", "flying"], [22, "Fearow", "normal", "flying"],
  [23, "Ekans", "poison", null], [24, "Arbok", "poison", null],
  [25, "Pikachu", "electric", null], [26, "Raichu", "electric", null],
  [27, "Sandshrew", "ground", null], [28, "Sandslash", "ground", null],
  [29, "Nidoran-f", "poison", null], [30, "Nidorina", "poison", null], [31, "Nidoqueen", "poison", "ground"],
  [32, "Nidoran-m", "poison", null], [33, "Nidorino", "poison", null], [34, "Nidoking", "poison", "ground"],
  [35, "Clefairy", "fairy", null], [36, "Clefable", "fairy", null],
  [37, "Vulpix", "fire", null], [38, "Ninetales", "fire", null],
  [39, "Jigglypuff", "normal", "fairy"], [40, "Wigglytuff", "normal", "fairy"],
  [41, "Zubat", "poison", "flying"], [42, "Golbat", "poison", "flying"],
  [43, "Oddish", "grass", "poison"], [44, "Gloom", "grass", "poison"], [45, "Vileplume", "grass", "poison"],
  [46, "Paras", "bug", "grass"], [47, "Parasect", "bug", "grass"],
  [48, "Venonat", "bug", "poison"], [49, "Venomoth", "bug", "poison"],
  [50, "Diglett", "ground", null], [51, "Dugtrio", "ground", null],
  [52, "Meowth", "normal", null], [53, "Persian", "normal", null],
  [54, "Psyduck", "water", null], [55, "Golduck", "water", null],
  [56, "Mankey", "fighting", null], [57, "Primeape", "fighting", null],
  [58, "Growlithe", "fire", null], [59, "Arcanine", "fire", null],
  [60, "Poliwag", "water", null], [61, "Poliwhirl", "water", null], [62, "Poliwrath", "water", "fighting"],
  [63, "Abra", "psychic", null], [64, "Kadabra", "psychic", null], [65, "Alakazam", "psychic", null],
  [66, "Machop", "fighting", null], [67, "Machoke", "fighting", null], [68, "Machamp", "fighting", null],
  [69, "Bellsprout", "grass", "poison"], [70, "Weepinbell", "grass", "poison"], [71, "Victreebel", "grass", "poison"],
  [72, "Tentacool", "water", "poison"], [73, "Tentacruel", "water", "poison"],
  [74, "Geodude", "rock", "ground"], [75, "Graveler", "rock", "ground"], [76, "Golem", "rock", "ground"],
  [77, "Ponyta", "fire", null], [78, "Rapidash", "fire", null],
  [79, "Slowpoke", "water", "psychic"], [80, "Slowbro", "water", "psychic"],
  [81, "Magnemite", "electric", "steel"], [82, "Magneton", "electric", "steel"],
  [83, "Farfetchd", "normal", "flying"],
  [84, "Doduo", "normal", "flying"], [85, "Dodrio", "normal", "flying"],
  [86, "Seel", "water", null], [87, "Dewgong", "water", "ice"],
  [88, "Grimer", "poison", null], [89, "Muk", "poison", null],
  [90, "Shellder", "water", null], [91, "Cloyster", "water", "ice"],
  [92, "Gastly", "ghost", "poison"], [93, "Haunter", "ghost", "poison"], [94, "Gengar", "ghost", "poison"],
  [95, "Onix", "rock", "ground"],
  [96, "Drowzee", "psychic", null], [97, "Hypno", "psychic", null],
  [98, "Krabby", "water", null], [99, "Kingler", "water", null],
  [100, "Voltorb", "electric", null], [101, "Electrode", "electric", null],
  [102, "Exeggcute", "grass", "psychic"], [103, "Exeggutor", "grass", "psychic"],
  [104, "Cubone", "ground", null], [105, "Marowak", "ground", null],
  [106, "Hitmonlee", "fighting", null], [107, "Hitmonchan", "fighting", null],
  [108, "Lickitung", "normal", null],
  [109, "Koffing", "poison", null], [110, "Weezing", "poison", null],
  [111, "Rhyhorn", "ground", "rock"], [112, "Rhydon", "ground", "rock"],
  [113, "Chansey", "normal", null],
  [114, "Tangela", "grass", null],
  [115, "Kangaskhan", "normal", null],
  [116, "Horsea", "water", null], [117, "Seadra", "water", null],
  [118, "Goldeen", "water", null], [119, "Seaking", "water", null],
  [120, "Staryu", "water", null], [121, "Starmie", "water", "psychic"],
  [122, "Mr-mime", "psychic", "fairy"],
  [123, "Scyther", "bug", "flying"],
  [124, "Jynx", "ice", "psychic"],
  [125, "Electabuzz", "electric", null], [126, "Magmar", "fire", null],
  [127, "Pinsir", "bug", null],
  [128, "Tauros", "normal", null],
  [129, "Magikarp", "water", null], [130, "Gyarados", "water", "flying"],
  [131, "Lapras", "water", "ice"],
  [132, "Ditto", "normal", null],
  [133, "Eevee", "normal", null], [134, "Vaporeon", "water", null], [135, "Jolteon", "electric", null], [136, "Flareon", "fire", null],
  [137, "Porygon", "normal", null],
  [138, "Omanyte", "rock", "water"], [139, "Omastar", "rock", "water"],
  [140, "Kabuto", "rock", "water"], [141, "Kabutops", "rock", "water"],
  [142, "Aerodactyl", "rock", "flying"],
  [143, "Snorlax", "normal", null],
  [144, "Articuno", "ice", "flying"], [145, "Zapdos", "electric", "flying"], [146, "Moltres", "fire", "flying"],
  [147, "Dratini", "dragon", null], [148, "Dragonair", "dragon", null], [149, "Dragonite", "dragon", "flying"],
  [150, "Mewtwo", "psychic", null], [151, "Mew", "psychic", null],
  [152, "Chikorita", "grass", null], [153, "Bayleef", "grass", null], [154, "Meganium", "grass", null],
  [155, "Cyndaquil", "fire", null], [156, "Quilava", "fire", null], [157, "Typhlosion", "fire", null],
  [158, "Totodile", "water", null], [159, "Croconaw", "water", null], [160, "Feraligatr", "water", null],
  [161, "Sentret", "normal", null], [162, "Furret", "normal", null],
  [163, "Hoothoot", "normal", "flying"], [164, "Noctowl", "normal", "flying"],
  [165, "Ledyba", "bug", "flying"], [166, "Ledian", "bug", "flying"],
  [167, "Spinarak", "bug", "poison"], [168, "Ariados", "bug", "poison"],
  [169, "Crobat", "poison", "flying"],
  [170, "Chinchou", "water", "electric"], [171, "Lanturn", "water", "electric"],
  [172, "Pichu", "electric", null], [173, "Cleffa", "fairy", null], [174, "Igglybuff", "normal", "fairy"],
  [175, "Togepi", "fairy", null], [176, "Togetic", "fairy", "flying"],
  [177, "Natu", "psychic", "flying"], [178, "Xatu", "psychic", "flying"],
  [179, "Mareep", "electric", null], [180, "Flaaffy", "electric", null], [181, "Ampharos", "electric", null],
  [182, "Bellossom", "grass", null],
  [183, "Marill", "water", "fairy"], [184, "Azumarill", "water", "fairy"],
  [185, "Sudowoodo", "rock", null],
  [186, "Politoed", "water", null],
  [187, "Hoppip", "grass", "flying"], [188, "Skiploom", "grass", "flying"], [189, "Jumpluff", "grass", "flying"],
  [190, "Aipom", "normal", null],
  [191, "Sunkern", "grass", null], [192, "Sunflora", "grass", null],
  [193, "Yanma", "bug", "flying"],
  [194, "Wooper", "water", "ground"], [195, "Quagsire", "water", "ground"],
  [196, "Espeon", "psychic", null], [197, "Umbreon", "dark", null],
  [198, "Murkrow", "dark", "flying"],
  [199, "Slowking", "water", "psychic"],
  [200, "Misdreavus", "ghost", null],
  [201, "Unown", "psychic", null],
  [202, "Wobbuffet", "psychic", null],
  [203, "Girafarig", "normal", "psychic"],
  [204, "Pineco", "bug", null], [205, "Forretress", "bug", "steel"],
  [206, "Dunsparce", "normal", null],
  [207, "Gligar", "ground", "flying"],
  [208, "Steelix", "steel", "ground"],
  [209, "Snubbull", "fairy", null], [210, "Granbull", "fairy", null],
  [211, "Qwilfish", "water", "poison"],
  [212, "Scizor", "bug", "steel"],
  [213, "Shuckle", "bug", "rock"],
  [214, "Heracross", "bug", "fighting"],
  [215, "Sneasel", "dark", "ice"],
  [216, "Teddiursa", "normal", null], [217, "Ursaring", "normal", null],
  [218, "Slugma", "fire", null], [219, "Magcargo", "fire", "rock"],
  [220, "Swinub", "ice", "ground"], [221, "Piloswine", "ice", "ground"],
  [222, "Corsola", "water", "rock"],
  [223, "Remoraid", "water", null], [224, "Octillery", "water", null],
  [225, "Delibird", "ice", "flying"],
  [226, "Mantine", "water", "flying"],
  [227, "Skarmory", "steel", "flying"],
  [228, "Houndour", "dark", "fire"], [229, "Houndoom", "dark", "fire"],
  [230, "Kingdra", "water", "dragon"],
  [231, "Phanpy", "ground", null], [232, "Donphan", "ground", null],
  [233, "Porygon2", "normal", null],
  [234, "Stantler", "normal", null],
  [235, "Smeargle", "normal", null],
  [236, "Tyrogue", "fighting", null],
  [237, "Hitmontop", "fighting", null],
  [238, "Smoochum", "ice", "psychic"],
  [239, "Elekid", "electric", null],
  [240, "Magby", "fire", null],
  [241, "Miltank", "normal", null],
  [242, "Blissey", "normal", null],
  [243, "Raikou", "electric", null], [244, "Entei", "fire", null], [245, "Suicune", "water", null],
  [246, "Larvitar", "rock", "ground"], [247, "Pupitar", "rock", "ground"], [248, "Tyranitar", "rock", "dark"],
  [249, "Lugia", "psychic", "flying"], [250, "Ho-oh", "fire", "flying"],
  [251, "Celebi", "psychic", "grass"],
];

// Special-case sprite slugs where kebab-casing the display name doesn't
// match pokemondb's actual URL slug.
const SLUG_OVERRIDES: Record<string, string> = {
  "Nidoran-f": "nidoran-f",
  "Nidoran-m": "nidoran-m",
  "Farfetchd": "farfetchd",
  "Mr-mime": "mr-mime",
};

function slugify(name: string): string {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Display name cleanup for the handful of species whose SPECIES entry above
// uses a slug-safe stand-in (Nidoran-f/m, Farfetchd, Mr-mime).
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "Nidoran-f": "Nidoran♀",
  "Nidoran-m": "Nidoran♂",
  "Farfetchd": "Farfetch'd",
  "Mr-mime": "Mr. Mime",
};

const LEGENDARY_PRICES: Record<string, number> = {
  Articuno: 2000, Zapdos: 2000, Moltres: 2000,
  Raikou: 2000, Entei: 2000, Suicune: 2000,
  Mewtwo: 3500, Lugia: 3500, "Ho-oh": 3500,
  Mew: 5000, Celebi: 5000,
};

function characterPrice(dex: number, name: string, typeCount: number): number {
  if (LEGENDARY_PRICES[name] !== undefined) return LEGENDARY_PRICES[name];
  return 50 + (dex % 97) * 3 + typeCount * 25;
}

// ============================================================
// Move data — every damaging (Physical/Special, numeric power) move
// introduced in Gen 1-2, pulled live from pokemondb.net/move/generation/1
// and /2. Status moves and variable-damage moves (Counter, Seismic Toss,
// Dragon Rage, etc.) are excluded — they don't fit this game's fixed-damage
// combat model.
// ============================================================
type MoveRow = [string, string, number];

const MOVES: MoveRow[] = [
  ["Absorb", "grass", 20], ["Acid", "poison", 40], ["Aurora Beam", "ice", 65], ["Barrage", "normal", 15],
  ["Bind", "normal", 15], ["Bite", "dark", 60], ["Blizzard", "ice", 110], ["Body Slam", "normal", 85],
  ["Bone Club", "ground", 65], ["Bonemerang", "ground", 50], ["Bubble", "water", 40], ["Bubble Beam", "water", 65],
  ["Clamp", "water", 35], ["Comet Punch", "normal", 18], ["Confusion", "psychic", 50], ["Constrict", "normal", 10],
  ["Crabhammer", "water", 100], ["Cut", "normal", 50], ["Dig", "ground", 80], ["Dizzy Punch", "normal", 70],
  ["Double Kick", "fighting", 30], ["Double Slap", "normal", 15], ["Double-Edge", "normal", 120],
  ["Dream Eater", "psychic", 100], ["Drill Peck", "flying", 80], ["Earthquake", "ground", 100],
  ["Egg Bomb", "normal", 100], ["Explosion", "normal", 250], ["Fire Punch", "fire", 75], ["Fire Spin", "fire", 35],
  ["Flamethrower", "fire", 90], ["Fly", "flying", 90], ["Fury Attack", "normal", 15], ["Fury Swipes", "normal", 18],
  ["Gust", "flying", 40], ["Headbutt", "normal", 70], ["High Jump Kick", "fighting", 130], ["Horn Attack", "normal", 65],
  ["Hyper Beam", "normal", 150], ["Hyper Fang", "normal", 80], ["Ice Beam", "ice", 90], ["Ice Punch", "ice", 75],
  ["Jump Kick", "fighting", 100], ["Karate Chop", "fighting", 50], ["Leech Life", "bug", 80], ["Lick", "ghost", 30],
  ["Mega Drain", "grass", 40], ["Mega Kick", "normal", 120], ["Mega Punch", "normal", 80], ["Pay Day", "normal", 40],
  ["Peck", "flying", 35], ["Petal Dance", "grass", 120], ["Pin Missile", "bug", 25], ["Poison Sting", "poison", 15],
  ["Pound", "normal", 40], ["Psychic", "psychic", 90], ["Quick Attack", "normal", 40], ["Rage", "normal", 20], ["Razor Leaf", "grass", 55],
  ["Razor Wind", "normal", 80], ["Rock Slide", "rock", 75], ["Rock Throw", "rock", 50], ["Rolling Kick", "fighting", 60],
  ["Scratch", "normal", 40], ["Self-Destruct", "normal", 200], ["Skull Bash", "normal", 130], ["Sky Attack", "flying", 140],
  ["Slam", "normal", 80], ["Slash", "normal", 70], ["Sludge", "poison", 65], ["Smog", "poison", 30],
  ["Spike Cannon", "normal", 20], ["Stomp", "normal", 65], ["Strength", "normal", 80], ["Struggle", "normal", 50],
  ["Submission", "fighting", 80], ["Surf", "water", 90], ["Swift", "normal", 60], ["Take Down", "normal", 90],
  ["Thrash", "normal", 120], ["Thunder", "electric", 110], ["Thunder Punch", "electric", 75], ["Tri Attack", "normal", 80],
  ["Twineedle", "bug", 25], ["Vise Grip", "normal", 55], ["Waterfall", "water", 80], ["Wing Attack", "flying", 60],
  ["Wrap", "normal", 15],
  // Gen 2
  ["Aeroblast", "flying", 100], ["Ancient Power", "rock", 60], ["Bone Rush", "ground", 25], ["Cross Chop", "fighting", 100],
  ["Crunch", "dark", 80], ["Dragon Breath", "dragon", 60], ["Dynamic Punch", "fighting", 100], ["Extreme Speed", "normal", 80],
  ["False Swipe", "normal", 40], ["Feint Attack", "dark", 60], ["Flame Wheel", "fire", 60], ["Fury Cutter", "bug", 40],
  ["Future Sight", "psychic", 120], ["Giga Drain", "grass", 75], ["Hidden Power", "normal", 60], ["Icy Wind", "ice", 55],
  ["Iron Tail", "steel", 100], ["Mach Punch", "fighting", 40], ["Megahorn", "bug", 120], ["Metal Claw", "steel", 50],
  ["Mud-Slap", "ground", 20], ["Octazooka", "water", 65], ["Outrage", "dragon", 120], ["Powder Snow", "ice", 40],
  ["Pursuit", "dark", 40], ["Rapid Spin", "normal", 50], ["Rock Smash", "fighting", 40], ["Rollout", "rock", 30],
  ["Sacred Fire", "fire", 100], ["Shadow Ball", "ghost", 80], ["Sludge Bomb", "poison", 90], ["Snore", "normal", 50], ["Spark", "electric", 65],
  ["Steel Wing", "steel", 70], ["Thief", "dark", 60], ["Triple Kick", "fighting", 10], ["Twister", "dragon", 40],
  ["Vital Throw", "fighting", 70], ["Whirlpool", "water", 35], ["Zap Cannon", "electric", 120],
];

function dailyLimitFor(power: number): number {
  if (power <= 40) return 6;
  if (power <= 80) return 4;
  if (power <= 120) return 2;
  return 1;
}

function movePrice(power: number): number {
  return Math.round(15 + power * 1.8);
}

const SPRITE_SLOTS: [number, string][] = [
  [1, "normal"],
  [2, "shiny"],
  [3, "back-normal"],
  [4, "back-shiny"],
];

function spriteUrl(slug: string, variant: string): string {
  return `https://img.pokemondb.net/sprites/black-white/anim/${variant}/${slug}.gif`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log("Fetching existing characters/moves to avoid duplicates…");
  const [{ data: existingChars }, { data: existingMoves }] = await Promise.all([
    supabase.from("characters").select("id, name"),
    supabase.from("moves").select("id, name, base_damage"),
  ]);

  const existingCharNames = new Set((existingChars ?? []).map((c) => c.name.toLowerCase()));
  const existingMoveNames = new Set((existingMoves ?? []).map((m) => m.name.toLowerCase()));

  // --- Characters + sprites ---
  const newSpecies = SPECIES.filter(([, name]) => !existingCharNames.has((DISPLAY_NAME_OVERRIDES[name] ?? name).toLowerCase()));
  console.log(`Inserting ${newSpecies.length} new characters (skipping ${SPECIES.length - newSpecies.length} already present)…`);

  const characterRows = newSpecies.map(([dex, name, t1, t2]) => {
    const types = t2 ? [t1, t2] : [t1];
    return {
      name: DISPLAY_NAME_OVERRIDES[name] ?? name,
      types,
      coin_cost: characterPrice(dex, DISPLAY_NAME_OVERRIDES[name] ?? name, types.length),
      is_starter: false,
      _slug: slugify(name),
    };
  });

  for (const batch of chunk(characterRows, 50)) {
    const { data: inserted, error } = await supabase
      .from("characters")
      .insert(batch.map(({ _slug, ...row }) => row))
      .select("id, name");
    if (error) throw new Error(`character insert failed: ${error.message}`);

    const spriteRows = (inserted ?? []).flatMap((row) => {
      const src = batch.find((b) => b.name === row.name);
      if (!src) return [];
      return SPRITE_SLOTS.map(([slot, variant]) => ({
        character_id: row.id,
        slot,
        image_url: spriteUrl(src._slug, variant),
      }));
    });
    const { error: spriteError } = await supabase.from("character_sprites").insert(spriteRows);
    if (spriteError) throw new Error(`sprite insert failed: ${spriteError.message}`);
  }

  // --- Moves ---
  const newMoves = MOVES.filter(([name]) => !existingMoveNames.has(name.toLowerCase()));
  console.log(`Inserting ${newMoves.length} new moves (skipping ${MOVES.length - newMoves.length} already present)…`);

  const moveRows = newMoves.map(([name, type, power]) => ({
    name,
    type,
    base_damage: power,
    daily_limit: dailyLimitFor(power),
    coin_cost: movePrice(power),
  }));

  for (const batch of chunk(moveRows, 100)) {
    const { error } = await supabase.from("moves").insert(batch);
    if (error) throw new Error(`move insert failed: ${error.message}`);
  }

  // --- Backfill coin_cost/daily_limit on the original hand-seeded moves too ---
  console.log("Backfilling pricing on pre-existing moves…");
  for (const m of existingMoves ?? []) {
    const cost = movePrice(m.base_damage);
    const limit = dailyLimitFor(m.base_damage);
    await supabase.from("moves").update({ coin_cost: cost, daily_limit: limit }).eq("id", m.id);
  }

  // --- Backfill starter move kit for any profile with zero owned moves ---
  console.log("Backfilling starter move kit for existing users with no owned moves…");
  const { data: starterMoves } = await supabase.from("moves").select("id, name").in("name", ["Tackle", "Ember", "Psybeam"]);
  const { data: profiles } = await supabase.from("profiles").select("id");
  for (const profile of profiles ?? []) {
    const { count } = await supabase
      .from("user_moves")
      .select("move_id", { count: "exact", head: true })
      .eq("user_id", profile.id);
    if (count && count > 0) continue;
    const rows = (starterMoves ?? []).map((m) => ({ user_id: profile.id, move_id: m.id }));
    if (rows.length > 0) {
      await supabase.from("user_moves").upsert(rows, { onConflict: "user_id,move_id" });
    }
  }

  const { count: finalCharCount } = await supabase.from("characters").select("id", { count: "exact", head: true });
  const { count: finalMoveCount } = await supabase.from("moves").select("id", { count: "exact", head: true });
  console.log(`Done. Characters: ${finalCharCount}, Moves: ${finalMoveCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
