import cron from "node-cron";
import { supabaseAdmin } from "../lib/supabase.js";
import { webpush, webPushConfigured } from "../lib/webPush.js";

// For every profile with no completion today: reset their streak and push a
// reminder to every device they've subscribed on. Exported as a plain
// function so it can be invoked directly (outside the cron schedule) to
// verify behavior without waiting for the clock.
export async function runDailyStreakCheck(): Promise<{ checked: number; reset: number; notified: number }> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: profiles, error } = await supabaseAdmin.from("profiles").select("id, streak_current");
  if (error || !profiles) {
    console.error("dailyStreakCheck: failed to load profiles", error);
    return { checked: 0, reset: 0, notified: 0 };
  }

  let reset = 0;
  let notified = 0;

  for (const profile of profiles) {
    const { data: completion } = await supabaseAdmin
      .from("daily_completions")
      .select("user_id")
      .eq("user_id", profile.id)
      .eq("completion_date", todayStr)
      .maybeSingle();

    if (completion) continue;
    if (profile.streak_current === 0) continue; // already broken / never started

    await supabaseAdmin.from("profiles").update({ streak_current: 0 }).eq("id", profile.id);
    reset += 1;

    if (!webPushConfigured) continue;

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", profile.id);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "Your streak is waiting!",
            body: "You haven't completed a goal today — keep your streak alive.",
          }),
        );
        notified += 1;
      } catch (err) {
        console.error(`dailyStreakCheck: push failed for subscription ${sub.id}`, err);
        // Endpoint likely expired/unsubscribed — remove it.
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return { checked: profiles.length, reset, notified };
}

export function scheduleDailyStreakCheck() {
  // Runs once a day at 20:00 server time.
  cron.schedule("0 20 * * *", () => {
    runDailyStreakCheck().then((result) => console.log("dailyStreakCheck", result));
  });
}
