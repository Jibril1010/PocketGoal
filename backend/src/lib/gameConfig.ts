export type DifficultyTier = "easy" | "medium" | "hard" | "epic";

// Fixed EXP ranges per tier. The AI only ever picks a tier — it never supplies
// a raw number — so a goal's text can't be used to self-assign an arbitrary
// reward via prompt injection.
export const EXP_RANGES: Record<DifficultyTier, [number, number]> = {
  easy: [10, 25],
  medium: [25, 60],
  hard: [60, 120],
  epic: [120, 200],
};

export function expRewardForTier(tier: DifficultyTier): number {
  const [min, max] = EXP_RANGES[tier];
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function expToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(1.25, level - 1));
}

// How many goal completions between coin payouts, and how many coins each time.
export const COINS_PER_MILESTONE = 5;
export const COINS_PER_PAYOUT = 50;

export function bossMaxHealth(levelNumber: number): number {
  return Math.round(50 * Math.pow(1.15, levelNumber));
}

// Coins awarded for defeating a boss, scaled gently with level.
export function bossCoinReward(levelNumber: number): number {
  return Math.round(20 + levelNumber * 5);
}

const HP_PER_POKEMON_OWNED = 5;
const HP_PER_LEGENDARY_OWNED = 15; // on top of the flat per-Pokémon bonus above
const HP_PER_LEVEL_CLEARED = 3;

// Max HP scales with the player's level (existing progression), plus how
// large their collection is (more Pokémon owned = more HP, legendaries
// count extra), plus how many stages they've already cleared.
export function userMaxHealth(params: {
  playerLevel: number;
  pokemonOwned: number;
  legendaryOwned: number;
  levelsCleared: number;
}): number {
  const base = 80 + params.playerLevel * 20;
  const collectionBonus = params.pokemonOwned * HP_PER_POKEMON_OWNED + params.legendaryOwned * HP_PER_LEGENDARY_OWNED;
  const progressBonus = params.levelsCleared * HP_PER_LEVEL_CLEARED;
  return Math.round(base + collectionBonus + progressBonus);
}

const ATK_PCT_PER_POKEMON_OWNED = 0.01; // +1% damage per Pokémon owned
const ATK_PCT_PER_LEGENDARY_OWNED = 0.03; // an extra +3% per legendary owned
const ATK_PCT_PER_LEVEL_CLEARED = 0.005; // +0.5% per stage already cleared

// Same idea as userMaxHealth, applied to outgoing damage: a percentage
// multiplier (not a flat add) so it scales sensibly across both a 10-power
// move and a 250-power one instead of trivializing weak moves.
export function collectionAttackMultiplier(params: { pokemonOwned: number; legendaryOwned: number; levelsCleared: number }): number {
  return (
    1 +
    params.pokemonOwned * ATK_PCT_PER_POKEMON_OWNED +
    params.legendaryOwned * ATK_PCT_PER_LEGENDARY_OWNED +
    params.levelsCleared * ATK_PCT_PER_LEVEL_CLEARED
  );
}

// Boss counter-attack damage, with some run-to-run variance.
export function bossAttackDamage(levelNumber: number): number {
  const base = 8 + levelNumber * 4;
  const jitter = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x
  return Math.max(1, Math.round(base * jitter));
}

// Flat coin bonus for completing a daily (repeatable) goal, on top of
// its normal AI-scored EXP and the shared 5-goal milestone payout.
export const DAILY_GOAL_COIN_BONUS = 10;
