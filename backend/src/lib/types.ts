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
  user_id: string;
  title: string;
  description: string | null;
  status: "active" | "completed";
  difficulty_tier: string | null;
  exp_reward: number | null;
  is_daily: boolean;
  created_at: string;
  completed_at: string | null;
}
