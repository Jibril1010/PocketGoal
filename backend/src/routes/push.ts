import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { env } from "../lib/env.js";
import { webPushConfigured } from "../lib/webPush.js";

export const pushRouter = Router();

pushRouter.get("/public-key", (_req, res) => {
  res.json({ publicKey: env.vapidPublicKey, enabled: webPushConfigured });
});

pushRouter.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid push subscription payload" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      { user_id: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint" },
    );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});
