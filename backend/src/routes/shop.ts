import { Router } from "express";
import { fetchAllRows, supabaseAdmin } from "../lib/supabase.js";

export const shopRouter = Router();

shopRouter.get("/", async (req, res) => {
  const userId = req.userId!;

  try {
    const [ownedCharactersRes, characters, ownedMovesRes, moves] = await Promise.all([
      supabaseAdmin.from("user_characters").select("character_id").eq("user_id", userId),
      fetchAllRows((from, to) =>
        supabaseAdmin
          .from("characters")
          .select("id, name, types, coin_cost, character_sprites(slot, image_url)")
          .range(from, to),
      ),
      supabaseAdmin.from("user_moves").select("move_id").eq("user_id", userId),
      fetchAllRows((from, to) =>
        supabaseAdmin.from("moves").select("id, name, type, base_damage, daily_limit, coin_cost").range(from, to),
      ),
    ]);

    const ownedCharacterIds = new Set((ownedCharactersRes.data ?? []).map((o) => o.character_id));
    const ownedMoveIds = new Set((ownedMovesRes.data ?? []).map((o) => o.move_id));

    res.json({
      characters: characters.filter((c) => !ownedCharacterIds.has(c.id)),
      moves: moves.filter((m) => !ownedMoveIds.has(m.id)),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

shopRouter.post("/buy/character/:characterId", async (req, res) => {
  const userId = req.userId!;
  const characterId = req.params.characterId;

  const { data: character, error: characterError } = await supabaseAdmin
    .from("characters")
    .select("id, coin_cost")
    .eq("id", characterId)
    .single();
  if (characterError || !character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("user_characters")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .maybeSingle();
  if (existing) {
    res.status(400).json({ error: "Already owned" });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .single();
  if (profileError || !profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (profile.coins < character.coin_cost) {
    res.status(402).json({ error: "Not enough coins" });
    return;
  }

  const { error: deductError } = await supabaseAdmin
    .from("profiles")
    .update({ coins: profile.coins - character.coin_cost })
    .eq("id", userId);
  if (deductError) {
    res.status(500).json({ error: deductError.message });
    return;
  }

  const { data: unlocked, error: insertError } = await supabaseAdmin
    .from("user_characters")
    .insert({ user_id: userId, character_id: characterId, is_main: false, is_on_homescreen: true, pos_x: 50, pos_y: 50 })
    .select("*")
    .single();

  if (insertError) {
    // Refund on failure to keep coins/ownership consistent.
    await supabaseAdmin.from("profiles").update({ coins: profile.coins }).eq("id", userId);
    res.status(500).json({ error: insertError.message });
    return;
  }

  res.status(201).json(unlocked);
});

shopRouter.post("/buy/move/:moveId", async (req, res) => {
  const userId = req.userId!;
  const moveId = req.params.moveId;

  const { data: move, error: moveError } = await supabaseAdmin
    .from("moves")
    .select("id, coin_cost")
    .eq("id", moveId)
    .single();
  if (moveError || !move) {
    res.status(404).json({ error: "Move not found" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("user_moves")
    .select("move_id")
    .eq("user_id", userId)
    .eq("move_id", moveId)
    .maybeSingle();
  if (existing) {
    res.status(400).json({ error: "Already owned" });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .single();
  if (profileError || !profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (profile.coins < move.coin_cost) {
    res.status(402).json({ error: "Not enough coins" });
    return;
  }

  const { error: deductError } = await supabaseAdmin
    .from("profiles")
    .update({ coins: profile.coins - move.coin_cost })
    .eq("id", userId);
  if (deductError) {
    res.status(500).json({ error: deductError.message });
    return;
  }

  const { data: unlocked, error: insertError } = await supabaseAdmin
    .from("user_moves")
    .insert({ user_id: userId, move_id: moveId })
    .select("*")
    .single();

  if (insertError) {
    await supabaseAdmin.from("profiles").update({ coins: profile.coins }).eq("id", userId);
    res.status(500).json({ error: insertError.message });
    return;
  }

  res.status(201).json(unlocked);
});
