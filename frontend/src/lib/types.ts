export interface Profile {
  id: string;
  username: string;
  level: number;
  current_exp: number;
  coins: number;
  goals_completed_count: number;
  streak_current: number;
  streak_longest: number;
  last_completed_date: string | null;
  background_url: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "completed";
  difficulty_tier: "easy" | "medium" | "hard" | "epic" | null;
  exp_reward: number | null;
  is_daily: boolean;
  completed_today?: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface CharacterSprite {
  slot: number;
  image_url: string;
}

export interface Character {
  id: string;
  name: string;
  types: string[];
  character_sprites: CharacterSprite[];
}

export interface OwnedCharacter {
  id: string;
  is_main: boolean;
  is_on_homescreen: boolean;
  pos_x: number;
  pos_y: number;
  characters: Character;
}

export interface ShopCharacter extends Character {
  coin_cost: number;
}

export interface Move {
  id: string;
  name: string;
  type: string;
  base_damage: number;
  daily_limit: number;
}

export interface ShopMove extends Move {
  coin_cost: number;
}

export interface ShopResponse {
  characters: ShopCharacter[];
  moves: ShopMove[];
}

export interface EquippedMove {
  slot: number;
  move: Move;
  usesToday: number;
}

export interface BattleState {
  profile: { level: number; coins: number };
  mainCharacter: { id: string; character_id: string; characters: { id: string; name: string; types: string[] } } | null;
  equippedMoves: EquippedMove[];
}

export interface BossEncounter {
  id: string;
  level_number: number;
  boss_max_health: number;
  boss_current_health: number;
  user_max_health: number;
  user_current_health: number;
  status: "in_progress" | "defeated";
  boss_character_id: string;
  boss_character: Character | null;
}

export interface LevelProgress {
  level_number: number;
  status: "in_progress" | "defeated";
}

export interface AttackResult {
  damage: number;
  stab: boolean;
  bossCurrentHealth: number;
  defeated: boolean;
  coinsAwarded: number;
  bossDamage?: number;
  userCurrentHealth?: number;
  lost: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
}
