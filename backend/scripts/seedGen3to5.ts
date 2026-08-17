// One-time (idempotent) data seed: the full Gen 3-5 Pokémon roster (National
// Dex #252-649, real types) and every Gen 3-5 damaging move, both pulled
// from pokemondb.net this session rather than typed from memory. Mirrors
// backend/scripts/seedGen1Gen2.ts — see that file for the general approach.
//
// Sprites use the same black-white anim sprite set, which conveniently
// covers exactly National Dex #1-649 (through Gen 5) — the upper bound the
// user asked for lines up with the sprite set's own ceiling.
//
// Run with: npx tsx scripts/seedGen3to5.ts   (from backend/)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Species data — National Dex #252-649, real types (pokemondb.net)
// ============================================================
type SpeciesRow = [number, string, string, string | null];

const SPECIES: SpeciesRow[] = [
  // Gen 3: #252-386
  [252, "Treecko", "grass", null], [253, "Grovyle", "grass", null], [254, "Sceptile", "grass", null],
  [255, "Torchic", "fire", null], [256, "Combusken", "fire", "fighting"], [257, "Blaziken", "fire", "fighting"],
  [258, "Mudkip", "water", null], [259, "Marshtomp", "water", "ground"], [260, "Swampert", "water", "ground"],
  [261, "Poochyena", "dark", null], [262, "Mightyena", "dark", null],
  [263, "Zigzagoon", "normal", null], [264, "Linoone", "normal", null],
  [265, "Wurmple", "bug", null], [266, "Silcoon", "bug", null], [267, "Beautifly", "bug", "flying"],
  [268, "Cascoon", "bug", null], [269, "Dustox", "bug", "poison"],
  [270, "Lotad", "water", "grass"], [271, "Lombre", "water", "grass"], [272, "Ludicolo", "water", "grass"],
  [273, "Seedot", "grass", null], [274, "Nuzleaf", "grass", "dark"], [275, "Shiftry", "grass", "dark"],
  [276, "Taillow", "normal", "flying"], [277, "Swellow", "normal", "flying"],
  [278, "Wingull", "water", "flying"], [279, "Pelipper", "water", "flying"],
  [280, "Ralts", "psychic", "fairy"], [281, "Kirlia", "psychic", "fairy"], [282, "Gardevoir", "psychic", "fairy"],
  [283, "Surskit", "bug", "water"], [284, "Masquerain", "bug", "flying"],
  [285, "Shroomish", "grass", null], [286, "Breloom", "grass", "fighting"],
  [287, "Slakoth", "normal", null], [288, "Vigoroth", "normal", null], [289, "Slaking", "normal", null],
  [290, "Nincada", "bug", "ground"], [291, "Ninjask", "bug", "flying"], [292, "Shedinja", "bug", "ghost"],
  [293, "Whismur", "normal", null], [294, "Loudred", "normal", null], [295, "Exploud", "normal", null],
  [296, "Makuhita", "fighting", null], [297, "Hariyama", "fighting", null],
  [298, "Azurill", "normal", "fairy"],
  [299, "Nosepass", "rock", null],
  [300, "Skitty", "normal", null], [301, "Delcatty", "normal", null],
  [302, "Sableye", "dark", "ghost"],
  [303, "Mawile", "steel", "fairy"],
  [304, "Aron", "steel", "rock"], [305, "Lairon", "steel", "rock"], [306, "Aggron", "steel", "rock"],
  [307, "Meditite", "fighting", "psychic"], [308, "Medicham", "fighting", "psychic"],
  [309, "Electrike", "electric", null], [310, "Manectric", "electric", null],
  [311, "Plusle", "electric", null], [312, "Minun", "electric", null],
  [313, "Volbeat", "bug", null], [314, "Illumise", "bug", null],
  [315, "Roselia", "grass", "poison"],
  [316, "Gulpin", "poison", null], [317, "Swalot", "poison", null],
  [318, "Carvanha", "water", "dark"], [319, "Sharpedo", "water", "dark"],
  [320, "Wailmer", "water", null], [321, "Wailord", "water", null],
  [322, "Numel", "fire", "ground"], [323, "Camerupt", "fire", "ground"],
  [324, "Torkoal", "fire", null],
  [325, "Spoink", "psychic", null], [326, "Grumpig", "psychic", null],
  [327, "Spinda", "normal", null],
  [328, "Trapinch", "ground", null], [329, "Vibrava", "ground", "dragon"], [330, "Flygon", "ground", "dragon"],
  [331, "Cacnea", "grass", null], [332, "Cacturne", "grass", "dark"],
  [333, "Swablu", "normal", "flying"], [334, "Altaria", "dragon", "flying"],
  [335, "Zangoose", "normal", null],
  [336, "Seviper", "poison", null],
  [337, "Lunatone", "rock", "psychic"], [338, "Solrock", "rock", "psychic"],
  [339, "Barboach", "water", "ground"], [340, "Whiscash", "water", "ground"],
  [341, "Corphish", "water", null], [342, "Crawdaunt", "water", "dark"],
  [343, "Baltoy", "ground", "psychic"], [344, "Claydol", "ground", "psychic"],
  [345, "Lileep", "rock", "grass"], [346, "Cradily", "rock", "grass"],
  [347, "Anorith", "rock", "bug"], [348, "Armaldo", "rock", "bug"],
  [349, "Feebas", "water", null], [350, "Milotic", "water", null],
  [351, "Castform", "normal", null],
  [352, "Kecleon", "normal", null],
  [353, "Shuppet", "ghost", null], [354, "Banette", "ghost", null],
  [355, "Duskull", "ghost", null], [356, "Dusclops", "ghost", null],
  [357, "Tropius", "grass", "flying"],
  [358, "Chimecho", "psychic", null],
  [359, "Absol", "dark", null],
  [360, "Wynaut", "psychic", null],
  [361, "Snorunt", "ice", null], [362, "Glalie", "ice", null],
  [363, "Spheal", "ice", "water"], [364, "Sealeo", "ice", "water"], [365, "Walrein", "ice", "water"],
  [366, "Clamperl", "water", null], [367, "Huntail", "water", null], [368, "Gorebyss", "water", null],
  [369, "Relicanth", "water", "rock"],
  [370, "Luvdisc", "water", null],
  [371, "Bagon", "dragon", null], [372, "Shelgon", "dragon", null], [373, "Salamence", "dragon", "flying"],
  [374, "Beldum", "steel", "psychic"], [375, "Metang", "steel", "psychic"], [376, "Metagross", "steel", "psychic"],
  [377, "Regirock", "rock", null], [378, "Regice", "ice", null], [379, "Registeel", "steel", null],
  [380, "Latias", "dragon", "psychic"], [381, "Latios", "dragon", "psychic"],
  [382, "Kyogre", "water", null], [383, "Groudon", "ground", null], [384, "Rayquaza", "dragon", "flying"],
  [385, "Jirachi", "steel", "psychic"],
  [386, "Deoxys", "psychic", null],
  // Gen 4: #387-493
  [387, "Turtwig", "grass", null], [388, "Grotle", "grass", null], [389, "Torterra", "grass", "ground"],
  [390, "Chimchar", "fire", null], [391, "Monferno", "fire", "fighting"], [392, "Infernape", "fire", "fighting"],
  [393, "Piplup", "water", null], [394, "Prinplup", "water", null], [395, "Empoleon", "water", "steel"],
  [396, "Starly", "normal", "flying"], [397, "Staravia", "normal", "flying"], [398, "Staraptor", "normal", "flying"],
  [399, "Bidoof", "normal", null], [400, "Bibarel", "normal", "water"],
  [401, "Kricketot", "bug", null], [402, "Kricketune", "bug", null],
  [403, "Shinx", "electric", null], [404, "Luxio", "electric", null], [405, "Luxray", "electric", null],
  [406, "Budew", "grass", "poison"], [407, "Roserade", "grass", "poison"],
  [408, "Cranidos", "rock", null], [409, "Rampardos", "rock", null],
  [410, "Shieldon", "rock", "steel"], [411, "Bastiodon", "rock", "steel"],
  [412, "Burmy", "bug", null], [413, "Wormadam", "bug", "grass"], [414, "Mothim", "bug", "flying"],
  [415, "Combee", "bug", "flying"], [416, "Vespiquen", "bug", "flying"],
  [417, "Pachirisu", "electric", null],
  [418, "Buizel", "water", null], [419, "Floatzel", "water", null],
  [420, "Cherubi", "grass", null], [421, "Cherrim", "grass", null],
  [422, "Shellos", "water", null], [423, "Gastrodon", "water", "ground"],
  [424, "Ambipom", "normal", null],
  [425, "Drifloon", "ghost", "flying"], [426, "Drifblim", "ghost", "flying"],
  [427, "Buneary", "normal", null], [428, "Lopunny", "normal", null],
  [429, "Mismagius", "ghost", null],
  [430, "Honchkrow", "dark", "flying"],
  [431, "Glameow", "normal", null], [432, "Purugly", "normal", null],
  [433, "Chingling", "psychic", null],
  [434, "Stunky", "poison", "dark"], [435, "Skuntank", "poison", "dark"],
  [436, "Bronzor", "steel", "psychic"], [437, "Bronzong", "steel", "psychic"],
  [438, "Bonsly", "rock", null],
  [439, "Mime Jr.", "psychic", "fairy"],
  [440, "Happiny", "normal", null],
  [441, "Chatot", "normal", "flying"],
  [442, "Spiritomb", "ghost", "dark"],
  [443, "Gible", "dragon", "ground"], [444, "Gabite", "dragon", "ground"], [445, "Garchomp", "dragon", "ground"],
  [446, "Munchlax", "normal", null],
  [447, "Riolu", "fighting", null], [448, "Lucario", "fighting", "steel"],
  [449, "Hippopotas", "ground", null], [450, "Hippowdon", "ground", null],
  [451, "Skorupi", "poison", "bug"], [452, "Drapion", "poison", "dark"],
  [453, "Croagunk", "poison", "fighting"], [454, "Toxicroak", "poison", "fighting"],
  [455, "Carnivine", "grass", null],
  [456, "Finneon", "water", null], [457, "Lumineon", "water", null],
  [458, "Mantyke", "water", "flying"],
  [459, "Snover", "grass", "ice"], [460, "Abomasnow", "grass", "ice"],
  [461, "Weavile", "dark", "ice"],
  [462, "Magnezone", "electric", "steel"],
  [463, "Lickilicky", "normal", null],
  [464, "Rhyperior", "ground", "rock"],
  [465, "Tangrowth", "grass", null],
  [466, "Electivire", "electric", null],
  [467, "Magmortar", "fire", null],
  [468, "Togekiss", "fairy", "flying"],
  [469, "Yanmega", "bug", "flying"],
  [470, "Leafeon", "grass", null], [471, "Glaceon", "ice", null],
  [472, "Gliscor", "ground", "flying"],
  [473, "Mamoswine", "ice", "ground"],
  [474, "Porygon-Z", "normal", null],
  [475, "Gallade", "psychic", "fighting"],
  [476, "Probopass", "rock", "steel"],
  [477, "Dusknoir", "ghost", null],
  [478, "Froslass", "ice", "ghost"],
  [479, "Rotom", "electric", "ghost"],
  [480, "Uxie", "psychic", null], [481, "Mesprit", "psychic", null], [482, "Azelf", "psychic", null],
  [483, "Dialga", "steel", "dragon"], [484, "Palkia", "water", "dragon"],
  [485, "Heatran", "fire", "steel"],
  [486, "Regigigas", "normal", null],
  [487, "Giratina", "ghost", "dragon"],
  [488, "Cresselia", "psychic", null],
  [489, "Phione", "water", null], [490, "Manaphy", "water", null],
  [491, "Darkrai", "dark", null],
  [492, "Shaymin", "grass", null],
  [493, "Arceus", "normal", null],
  // Gen 5: #494-649
  [495, "Snivy", "grass", null], [496, "Servine", "grass", null], [497, "Serperior", "grass", null],
  [498, "Tepig", "fire", null], [499, "Pignite", "fire", "fighting"], [500, "Emboar", "fire", "fighting"],
  [501, "Oshawott", "water", null], [502, "Dewott", "water", null], [503, "Samurott", "water", null],
  [504, "Patrat", "normal", null], [505, "Watchog", "normal", null],
  [506, "Lillipup", "normal", null], [507, "Herdier", "normal", null], [508, "Stoutland", "normal", null],
  [509, "Purrloin", "dark", null], [510, "Liepard", "dark", null],
  [511, "Pansage", "grass", null], [512, "Simisage", "grass", null],
  [513, "Pansear", "fire", null], [514, "Simisear", "fire", null],
  [515, "Panpour", "water", null], [516, "Simipour", "water", null],
  [517, "Munna", "psychic", null], [518, "Musharna", "psychic", null],
  [519, "Pidove", "normal", "flying"], [520, "Tranquill", "normal", "flying"], [521, "Unfezant", "normal", "flying"],
  [522, "Blitzle", "electric", null], [523, "Zebstrika", "electric", null],
  [524, "Roggenrola", "rock", null], [525, "Boldore", "rock", null], [526, "Gigalith", "rock", null],
  [527, "Woobat", "psychic", "flying"], [528, "Swoobat", "psychic", "flying"],
  [529, "Drilbur", "ground", null], [530, "Excadrill", "ground", "steel"],
  [531, "Audino", "normal", null],
  [532, "Timburr", "fighting", null], [533, "Gurdurr", "fighting", null], [534, "Conkeldurr", "fighting", null],
  [535, "Tympole", "water", null], [536, "Palpitoad", "water", "ground"], [537, "Seismitoad", "water", "ground"],
  [538, "Throh", "fighting", null], [539, "Sawk", "fighting", null],
  [540, "Sewaddle", "bug", "grass"], [541, "Swadloon", "bug", "grass"], [542, "Leavanny", "bug", "grass"],
  [543, "Venipede", "bug", "poison"], [544, "Whirlipede", "bug", "poison"], [545, "Scolipede", "bug", "poison"],
  [546, "Cottonee", "grass", "fairy"], [547, "Whimsicott", "grass", "fairy"],
  [548, "Petilil", "grass", null], [549, "Lilligant", "grass", null],
  [550, "Basculin", "water", null],
  [551, "Sandile", "ground", "dark"], [552, "Krokorok", "ground", "dark"], [553, "Krookodile", "ground", "dark"],
  [554, "Darumaka", "fire", null], [555, "Darmanitan", "fire", null],
  [556, "Maractus", "grass", null],
  [557, "Dwebble", "bug", "rock"], [558, "Crustle", "bug", "rock"],
  [559, "Scraggy", "dark", "fighting"], [560, "Scrafty", "dark", "fighting"],
  [561, "Sigilyph", "psychic", "flying"],
  [562, "Yamask", "ghost", null], [563, "Cofagrigus", "ghost", null],
  [564, "Tirtouga", "water", "rock"], [565, "Carracosta", "water", "rock"],
  [566, "Archen", "rock", "flying"], [567, "Archeops", "rock", "flying"],
  [568, "Trubbish", "poison", null], [569, "Garbodor", "poison", null],
  [570, "Zorua", "dark", null], [571, "Zoroark", "dark", null],
  [572, "Minccino", "normal", null], [573, "Cinccino", "normal", null],
  [574, "Gothita", "psychic", null], [575, "Gothorita", "psychic", null], [576, "Gothitelle", "psychic", null],
  [577, "Solosis", "psychic", null], [578, "Duosion", "psychic", null], [579, "Reuniclus", "psychic", null],
  [580, "Ducklett", "water", "flying"], [581, "Swanna", "water", "flying"],
  [582, "Vanillite", "ice", null], [583, "Vanillish", "ice", null], [584, "Vanilluxe", "ice", null],
  [585, "Deerling", "normal", "grass"], [586, "Sawsbuck", "normal", "grass"],
  [587, "Emolga", "electric", "flying"],
  [588, "Karrablast", "bug", null], [589, "Escavalier", "bug", "steel"],
  [590, "Foongus", "grass", "poison"], [591, "Amoonguss", "grass", "poison"],
  [592, "Frillish", "water", "ghost"], [593, "Jellicent", "water", "ghost"],
  [594, "Alomomola", "water", null],
  [595, "Joltik", "bug", "electric"], [596, "Galvantula", "bug", "electric"],
  [597, "Ferroseed", "grass", "steel"], [598, "Ferrothorn", "grass", "steel"],
  [599, "Klink", "steel", null], [600, "Klang", "steel", null], [601, "Klinklang", "steel", null],
  [602, "Tynamo", "electric", null], [603, "Eelektrik", "electric", null], [604, "Eelektross", "electric", null],
  [605, "Elgyem", "psychic", null], [606, "Beheeyem", "psychic", null],
  [607, "Litwick", "ghost", "fire"], [608, "Lampent", "ghost", "fire"], [609, "Chandelure", "ghost", "fire"],
  [610, "Axew", "dragon", null], [611, "Fraxure", "dragon", null], [612, "Haxorus", "dragon", null],
  [613, "Cubchoo", "ice", null], [614, "Beartic", "ice", null],
  [615, "Cryogonal", "ice", null],
  [616, "Shelmet", "bug", null], [617, "Accelgor", "bug", null],
  [618, "Stunfisk", "ground", "electric"],
  [619, "Mienfoo", "fighting", null], [620, "Mienshao", "fighting", null],
  [621, "Druddigon", "dragon", null],
  [622, "Golett", "ground", "ghost"], [623, "Golurk", "ground", "ghost"],
  [624, "Pawniard", "dark", "steel"], [625, "Bisharp", "dark", "steel"],
  [626, "Bouffalant", "normal", null],
  [627, "Rufflet", "normal", "flying"], [628, "Braviary", "normal", "flying"],
  [629, "Vullaby", "dark", "flying"], [630, "Mandibuzz", "dark", "flying"],
  [631, "Heatmor", "fire", null],
  [632, "Durant", "bug", "steel"],
  [633, "Deino", "dark", "dragon"], [634, "Zweilous", "dark", "dragon"], [635, "Hydreigon", "dark", "dragon"],
  [636, "Larvesta", "bug", "fire"], [637, "Volcarona", "bug", "fire"],
  [638, "Cobalion", "steel", "fighting"], [639, "Terrakion", "rock", "fighting"], [640, "Virizion", "grass", "fighting"],
  [641, "Tornadus", "flying", null], [642, "Thundurus", "electric", "flying"],
  [643, "Reshiram", "dragon", "fire"], [644, "Zekrom", "dragon", "electric"],
  [645, "Landorus", "ground", "flying"],
  [646, "Kyurem", "dragon", "ice"],
  [647, "Keldeo", "water", "fighting"],
  [648, "Meloetta", "normal", "psychic"],
  [649, "Genesect", "bug", "steel"],
];

const SLUG_OVERRIDES: Record<string, string> = {};

function slugify(name: string): string {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const LEGENDARY_PRICES: Record<string, number> = {
  // Sub-legendary trios/quads
  Regirock: 2000, Regice: 2000, Registeel: 2000, Latias: 2000, Latios: 2000,
  Uxie: 2000, Mesprit: 2000, Azelf: 2000, Regigigas: 2000,
  Cobalion: 2000, Terrakion: 2000, Virizion: 2000, Tornadus: 2000, Thundurus: 2000, Landorus: 2000,
  // Box legendaries
  Kyogre: 3500, Groudon: 3500, Rayquaza: 3500, Dialga: 3500, Palkia: 3500, Giratina: 3500,
  Heatran: 3500, Cresselia: 3500, Reshiram: 3500, Zekrom: 3500, Kyurem: 3500,
  // Mythicals
  Jirachi: 5000, Deoxys: 5000, Phione: 5000, Manaphy: 5000, Darkrai: 5000, Shaymin: 5000,
  Arceus: 5000, Keldeo: 5000, Meloetta: 5000, Genesect: 5000,
};

function characterPrice(dex: number, name: string, typeCount: number): number {
  if (LEGENDARY_PRICES[name] !== undefined) return LEGENDARY_PRICES[name];
  return 50 + (dex % 97) * 3 + typeCount * 25;
}

// ============================================================
// Move data — every damaging (Physical/Special, numeric power) move
// introduced in Gen 3-5, pulled live from pokemondb.net this session.
// ============================================================
type MoveRow = [string, string, number];

const MOVES: MoveRow[] = [
  // Gen 3
  ["Aerial Ace", "flying", 60], ["Air Cutter", "flying", 60], ["Arm Thrust", "fighting", 15],
  ["Astonish", "ghost", 30], ["Blast Burn", "fire", 150], ["Blaze Kick", "fire", 85],
  ["Bounce", "flying", 85], ["Brick Break", "fighting", 75], ["Bullet Seed", "grass", 25],
  ["Covet", "normal", 60], ["Crush Claw", "normal", 75], ["Dive", "water", 80],
  ["Doom Desire", "steel", 140], ["Dragon Claw", "dragon", 80], ["Eruption", "fire", 150],
  ["Extrasensory", "psychic", 80], ["Facade", "normal", 70], ["Fake Out", "normal", 40],
  ["Focus Punch", "fighting", 150], ["Frenzy Plant", "grass", 150], ["Heat Wave", "fire", 95],
  ["Hydro Cannon", "water", 150], ["Hyper Voice", "normal", 90], ["Ice Ball", "ice", 30],
  ["Icicle Spear", "ice", 25], ["Knock Off", "dark", 65], ["Leaf Blade", "grass", 90],
  ["Luster Purge", "psychic", 95], ["Magical Leaf", "grass", 60], ["Meteor Mash", "steel", 90],
  ["Mist Ball", "psychic", 95], ["Mud Shot", "ground", 55], ["Muddy Water", "water", 90],
  ["Needle Arm", "grass", 60], ["Overheat", "fire", 130], ["Poison Fang", "poison", 50],
  ["Poison Tail", "poison", 50], ["Psycho Boost", "psychic", 140], ["Revenge", "fighting", 60],
  ["Rock Blast", "rock", 25], ["Rock Tomb", "rock", 60], ["Sand Tomb", "ground", 35],
  ["Secret Power", "normal", 70], ["Shadow Punch", "ghost", 60], ["Shock Wave", "electric", 60],
  ["Signal Beam", "bug", 75], ["Silver Wind", "bug", 60], ["Sky Uppercut", "fighting", 85],
  ["Smelling Salts", "normal", 70], ["Superpower", "fighting", 120], ["Uproar", "normal", 90],
  ["Volt Tackle", "electric", 120], ["Water Pulse", "water", 60], ["Water Spout", "water", 150],
  ["Weather Ball", "normal", 50],
  // Gen 4
  ["Air Slash", "flying", 75], ["Aqua Jet", "water", 40], ["Aqua Tail", "water", 90],
  ["Assurance", "dark", 60], ["Attack Order", "bug", 90], ["Aura Sphere", "fighting", 80],
  ["Avalanche", "ice", 60], ["Brave Bird", "flying", 120], ["Brine", "water", 65],
  ["Bug Bite", "bug", 60], ["Bug Buzz", "bug", 90], ["Bullet Punch", "steel", 40],
  ["Charge Beam", "electric", 50], ["Chatter", "flying", 65], ["Close Combat", "fighting", 120],
  ["Cross Poison", "poison", 70], ["Dark Pulse", "dark", 80], ["Discharge", "electric", 80],
  ["Double Hit", "normal", 35], ["Draco Meteor", "dragon", 130], ["Dragon Pulse", "dragon", 85],
  ["Dragon Rush", "dragon", 100], ["Drain Punch", "fighting", 75], ["Earth Power", "ground", 90],
  ["Energy Ball", "grass", 90], ["Feint", "normal", 30], ["Fire Fang", "fire", 65],
  ["Flare Blitz", "fire", 120], ["Focus Blast", "fighting", 120], ["Force Palm", "fighting", 60],
  ["Giga Impact", "normal", 150], ["Gunk Shot", "poison", 120], ["Hammer Arm", "fighting", 100],
  ["Head Smash", "rock", 150], ["Ice Fang", "ice", 65], ["Ice Shard", "ice", 40],
  ["Judgment", "normal", 100], ["Last Resort", "normal", 140], ["Lava Plume", "fire", 80],
  ["Leaf Storm", "grass", 130], ["Magma Storm", "fire", 100], ["Magnet Bomb", "steel", 60],
  ["Mirror Shot", "steel", 65], ["Mud Bomb", "ground", 65], ["Night Slash", "dark", 70],
  ["Ominous Wind", "ghost", 60], ["Payback", "dark", 50], ["Pluck", "flying", 60],
  ["Power Gem", "rock", 80], ["Power Whip", "grass", 120], ["Psycho Cut", "psychic", 70],
  ["Rock Climb", "normal", 90], ["Rock Wrecker", "rock", 150], ["Roar of Time", "dragon", 150],
  ["Seed Bomb", "grass", 80], ["Seed Flare", "grass", 120], ["Shadow Claw", "ghost", 70],
  ["Shadow Force", "ghost", 120], ["Shadow Sneak", "ghost", 40], ["Spacial Rend", "dragon", 100],
  ["Stone Edge", "rock", 100], ["Sucker Punch", "dark", 70], ["Thunder Fang", "electric", 65],
  ["U-turn", "bug", 70], ["Vacuum Wave", "fighting", 40], ["Wake-Up Slap", "fighting", 70],
  ["Wood Hammer", "grass", 120], ["X-Scissor", "bug", 80], ["Zen Headbutt", "psychic", 80],
  // Gen 5
  ["Acid Spray", "poison", 40], ["Acrobatics", "flying", 55], ["Blue Flare", "fire", 130],
  ["Bolt Strike", "electric", 130], ["Bulldoze", "ground", 60], ["Chip Away", "normal", 70],
  ["Circle Throw", "fighting", 60], ["Clear Smog", "poison", 50], ["Dragon Tail", "dragon", 60],
  ["Drill Run", "ground", 80], ["Dual Chop", "dragon", 40], ["Echoed Voice", "normal", 40],
  ["Electroweb", "electric", 55], ["Fiery Dance", "fire", 80], ["Fire Pledge", "fire", 80],
  ["Flame Burst", "fire", 70], ["Flame Charge", "fire", 50], ["Foul Play", "dark", 95],
  ["Freeze Shock", "ice", 140], ["Frost Breath", "ice", 60], ["Fusion Bolt", "electric", 100],
  ["Fusion Flare", "fire", 100], ["Gear Grind", "steel", 50], ["Glaciate", "ice", 65],
  ["Grass Pledge", "grass", 80], ["Head Charge", "normal", 120], ["Heart Stamp", "psychic", 60],
  ["Hex", "ghost", 65], ["Horn Leech", "grass", 75], ["Hurricane", "flying", 110],
  ["Ice Burn", "ice", 140], ["Icicle Crash", "ice", 85], ["Incinerate", "fire", 60],
  ["Inferno", "fire", 100], ["Leaf Tornado", "grass", 65], ["Low Sweep", "fighting", 65],
  ["Night Daze", "dark", 85], ["Psyshock", "psychic", 80], ["Psystrike", "psychic", 100],
  ["Razor Shell", "water", 75], ["Relic Song", "normal", 75], ["Retaliate", "normal", 70],
  ["Round", "normal", 60], ["Sacred Sword", "fighting", 90], ["Scald", "water", 80],
  ["Searing Shot", "fire", 100], ["Secret Sword", "fighting", 85], ["Sky Drop", "flying", 60],
  ["Sludge Wave", "poison", 95], ["Smack Down", "rock", 50], ["Snarl", "dark", 55],
  ["Steamroller", "bug", 65], ["Stored Power", "psychic", 20], ["Storm Throw", "fighting", 60],
  ["Struggle Bug", "bug", 50], ["Synchronoise", "psychic", 120], ["Tail Slap", "normal", 25],
  ["Techno Blast", "normal", 120], ["V-create", "fire", 180], ["Venoshock", "poison", 65],
  ["Volt Switch", "electric", 70], ["Water Pledge", "water", 80], ["Wild Charge", "electric", 90],
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
  const newSpecies = SPECIES.filter(([, name]) => !existingCharNames.has(name.toLowerCase()));
  console.log(`Inserting ${newSpecies.length} new characters (skipping ${SPECIES.length - newSpecies.length} already present)…`);

  const characterRows = newSpecies.map(([dex, name, t1, t2]) => {
    const types = t2 ? [t1, t2] : [t1];
    return {
      name,
      types,
      coin_cost: characterPrice(dex, name, types.length),
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

  const { count: finalCharCount } = await supabase.from("characters").select("id", { count: "exact", head: true });
  const { count: finalMoveCount } = await supabase.from("moves").select("id", { count: "exact", head: true });
  console.log(`Done. Characters: ${finalCharCount}, Moves: ${finalMoveCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
