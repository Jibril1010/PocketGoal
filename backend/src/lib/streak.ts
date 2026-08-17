import type { Profile } from "./types.js";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Given the profile state and "today", returns the updated streak fields
// after a goal completion. Assumes the caller has already confirmed this is
// the user's first completion of today (see daily_completions upsert).
export function applyStreakCompletion(profile: Pick<Profile, "streak_current" | "streak_longest" | "last_completed_date">) {
  const today = new Date();
  const todayStr = toDateOnly(today);
  const yesterdayStr = toDateOnly(new Date(today.getTime() - 24 * 60 * 60 * 1000));

  let streakCurrent: number;
  if (profile.last_completed_date === yesterdayStr) {
    streakCurrent = profile.streak_current + 1;
  } else if (profile.last_completed_date === todayStr) {
    streakCurrent = profile.streak_current;
  } else {
    streakCurrent = 1;
  }

  const streakLongest = Math.max(profile.streak_longest, streakCurrent);

  return { streak_current: streakCurrent, streak_longest: streakLongest, last_completed_date: todayStr };
}
