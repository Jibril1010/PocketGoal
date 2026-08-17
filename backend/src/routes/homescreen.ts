import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const homescreenRouter = Router();

homescreenRouter.post("/position", async (req, res) => {
  const { userCharacterId, posX, posY } = req.body as {
    userCharacterId?: string;
    posX?: number;
    posY?: number;
  };
  if (!userCharacterId || typeof posX !== "number" || typeof posY !== "number") {
    res.status(400).json({ error: "userCharacterId, posX, posY are required" });
    return;
  }

  const clampedX = Math.min(100, Math.max(0, posX));
  const clampedY = Math.min(100, Math.max(0, posY));

  const { error } = await supabaseAdmin
    .from("user_characters")
    .update({ pos_x: clampedX, pos_y: clampedY })
    .eq("id", userCharacterId)
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});

homescreenRouter.post("/toggle", async (req, res) => {
  const { userCharacterId, onHomescreen } = req.body as {
    userCharacterId?: string;
    onHomescreen?: boolean;
  };
  if (!userCharacterId || typeof onHomescreen !== "boolean") {
    res.status(400).json({ error: "userCharacterId and onHomescreen are required" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("user_characters")
    .update({ is_on_homescreen: onHomescreen })
    .eq("id", userCharacterId)
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});
