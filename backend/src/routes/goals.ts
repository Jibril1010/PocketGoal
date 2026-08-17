import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { rateGoalDifficulty } from "../lib/ai.js";
import {
  COINS_PER_MILESTONE,
  COINS_PER_PAYOUT,
  DAILY_GOAL_COIN_BONUS,
  expRewardForTier,
  expToNextLevel,
} from "../lib/gameConfig.js";
import { applyStreakCompletion } from "../lib/streak.js";
import type { Goal, Profile } from "../lib/types.js";

export const goalsRouter = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

goalsRouter.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const dailyGoalIds = (data ?? []).filter((g) => g.is_daily).map((g) => g.id);
  let completedTodayIds = new Set<string>();
  if (dailyGoalIds.length > 0) {
    const { data: completions } = await supabaseAdmin
      .from("daily_goal_completions")
      .select("goal_id")
      .eq("user_id", req.userId)
      .eq("completion_date", todayStr())
      .in("goal_id", dailyGoalIds);
    completedTodayIds = new Set((completions ?? []).map((c) => c.goal_id));
  }

  res.json((data ?? []).map((g) => ({ ...g, completed_today: g.is_daily ? completedTodayIds.has(g.id) : undefined })));
});

goalsRouter.post("/", async (req, res) => {
  const { title, description, isDaily } = req.body as { title?: string; description?: string; isDaily?: boolean };
  if (!title || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  let tier: Awaited<ReturnType<typeof rateGoalDifficulty>>["tier"] = "medium";
  try {
    const rating = await rateGoalDifficulty(title, description);
    tier = rating.tier;
  } catch (err) {
    console.error("Gemini rating failed, defaulting to medium", err);
  }

  const expReward = expRewardForTier(tier);

  const { data, error } = await supabaseAdmin
    .from("goals")
    .insert({
      user_id: req.userId,
      title: title.trim(),
      description: description?.trim() || null,
      status: "active",
      difficulty_tier: tier,
      exp_reward: expReward,
      is_daily: Boolean(isDaily),
    })
    .select("*")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

goalsRouter.post("/:id/complete", async (req, res) => {
  const goalId = req.params.id;

  const { data: goal, error: goalError } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", req.userId)
    .single<Goal & { is_daily: boolean }>();

  if (goalError || !goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const today = todayStr();

  if (goal.is_daily) {
    const { data: existing } = await supabaseAdmin
      .from("daily_goal_completions")
      .select("goal_id")
      .eq("goal_id", goalId)
      .eq("completion_date", today)
      .maybeSingle();
    if (existing) {
      res.status(400).json({ error: "Already completed today" });
      return;
    }
  } else if (goal.status === "completed") {
    res.status(400).json({ error: "Goal already completed" });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.userId)
    .single<Profile>();

  if (profileError || !profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const { error: dailyError } = await supabaseAdmin
    .from("daily_completions")
    .upsert({ user_id: req.userId, completion_date: today }, { onConflict: "user_id,completion_date", ignoreDuplicates: true });
  if (dailyError) {
    res.status(500).json({ error: dailyError.message });
    return;
  }

  if (goal.is_daily) {
    const { error: dailyGoalError } = await supabaseAdmin
      .from("daily_goal_completions")
      .insert({ goal_id: goalId, user_id: req.userId, completion_date: today });
    if (dailyGoalError) {
      res.status(500).json({ error: dailyGoalError.message });
      return;
    }
  }

  const streakUpdate = applyStreakCompletion(profile);

  let level = profile.level;
  let currentExp = profile.current_exp + (goal.exp_reward ?? 0);
  while (currentExp >= expToNextLevel(level)) {
    currentExp -= expToNextLevel(level);
    level += 1;
  }

  const goalsCompletedCount = profile.goals_completed_count + 1;
  const earnedMilestone = goalsCompletedCount % COINS_PER_MILESTONE === 0;
  const dailyBonus = goal.is_daily ? DAILY_GOAL_COIN_BONUS : 0;
  const coins = profile.coins + (earnedMilestone ? COINS_PER_PAYOUT : 0) + dailyBonus;

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      level,
      current_exp: currentExp,
      coins,
      goals_completed_count: goalsCompletedCount,
      streak_current: streakUpdate.streak_current,
      streak_longest: streakUpdate.streak_longest,
      last_completed_date: streakUpdate.last_completed_date,
    })
    .eq("id", req.userId)
    .select("*")
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  // One-off goals are marked completed permanently. Daily goals stay
  // 'active' forever — "completed today?" is derived from
  // daily_goal_completions each time /goals is fetched, so they
  // naturally become available again the next day with no reset job.
  let updatedGoal = goal;
  if (!goal.is_daily) {
    const { data: goalRow, error: goalUpdateError } = await supabaseAdmin
      .from("goals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", goalId)
      .select("*")
      .single();
    if (goalUpdateError) {
      res.status(500).json({ error: goalUpdateError.message });
      return;
    }
    updatedGoal = goalRow;
  }

  res.json({
    goal: updatedGoal,
    profile: updatedProfile,
    leveledUp: level > profile.level,
    coinsAwarded: (earnedMilestone ? COINS_PER_PAYOUT : 0) + dailyBonus,
  });
});
