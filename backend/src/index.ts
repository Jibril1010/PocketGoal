import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";
import { requireAuth } from "./lib/auth.js";
import { goalsRouter } from "./routes/goals.js";
import { battleRouter } from "./routes/battle.js";
import { shopRouter } from "./routes/shop.js";
import { homescreenRouter } from "./routes/homescreen.js";
import { pushRouter } from "./routes/push.js";
import { charactersRouter } from "./routes/characters.js";
import { profileRouter } from "./routes/profile.js";
import { musicRouter } from "./routes/music.js";
import { scheduleDailyStreakCheck, runDailyStreakCheck } from "./jobs/dailyStreakCheck.js";

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (curl, server-to-server) — allow.
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/goals", requireAuth, goalsRouter);
app.use("/battle", requireAuth, battleRouter);
app.use("/shop", requireAuth, shopRouter);
app.use("/homescreen", requireAuth, homescreenRouter);
app.use("/characters", requireAuth, charactersRouter);
app.use("/push", requireAuth, pushRouter);
app.use("/profile", requireAuth, profileRouter);
app.use("/music", requireAuth, musicRouter);

// Dev-only: manually fire the daily streak/notification sweep instead of
// waiting for the cron schedule, to verify it end-to-end.
app.post("/internal/run-streak-check", async (_req, res) => {
  const result = await runDailyStreakCheck();
  res.json(result);
});

scheduleDailyStreakCheck();

app.listen(env.port, () => {
  console.log(`GoalGame backend listening on http://localhost:${env.port}`);
});
