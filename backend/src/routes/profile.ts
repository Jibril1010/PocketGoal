import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const profileRouter = Router();

profileRouter.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", req.userId).single();
  if (error || !data) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(data);
});

const ALLOWED_BACKGROUNDS = new Set([
  "/backgrounds/bb1.jpg",
  "/backgrounds/bb2.jpg",
  "/backgrounds/bb3.jpg",
  "/backgrounds/bb4.jpg",
  null,
]);

profileRouter.post("/background", async (req, res) => {
  const { backgroundUrl } = req.body as { backgroundUrl?: string | null };
  if (!ALLOWED_BACKGROUNDS.has(backgroundUrl ?? null)) {
    res.status(400).json({ error: "Unknown background" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ background_url: backgroundUrl ?? null })
    .eq("id", req.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});
