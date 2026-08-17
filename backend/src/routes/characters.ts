import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export const charactersRouter = Router();

// Everything the current user owns, with sprite art — used for the home screen.
charactersRouter.get("/mine", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_characters")
    .select("id, is_main, is_on_homescreen, pos_x, pos_y, unlocked_at, characters(id, name, types, character_sprites(slot, image_url))")
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// Switch which owned Pokémon is active in battle (its back sprite shows,
// its types apply for STAB, and its own move loadout is what's used).
charactersRouter.post("/main", async (req, res) => {
  const userId = req.userId!;
  const { userCharacterId } = req.body as { userCharacterId?: string };
  if (!userCharacterId) {
    res.status(400).json({ error: "userCharacterId is required" });
    return;
  }

  const { data: target } = await supabaseAdmin
    .from("user_characters")
    .select("id")
    .eq("id", userCharacterId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) {
    res.status(404).json({ error: "You don't own this Pokémon" });
    return;
  }

  const { error: clearError } = await supabaseAdmin
    .from("user_characters")
    .update({ is_main: false })
    .eq("user_id", userId)
    .eq("is_main", true);
  if (clearError) {
    res.status(500).json({ error: clearError.message });
    return;
  }

  const { error: setError } = await supabaseAdmin
    .from("user_characters")
    .update({ is_main: true })
    .eq("id", userCharacterId);
  if (setError) {
    res.status(500).json({ error: setError.message });
    return;
  }

  res.status(204).send();
});
