import { Router } from "express";
import { fetchAllRows, supabaseAdmin } from "../lib/supabase.js";
import {
  bossAttackDamage,
  bossCoinReward,
  bossMaxHealth,
  collectionAttackMultiplier,
  userMaxHealth,
} from "../lib/gameConfig.js";

export const battleRouter = Router();

async function getMainCharacter(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_characters")
    .select("id, character_id, characters(id, name, types, character_sprites(slot, image_url))")
    .eq("user_id", userId)
    .eq("is_main", true)
    .single();
  if (error || !data) return null;
  return data;
}

async function equippedMovesFor(userId: string, characterId: string) {
  const { data: equipped, error } = await supabaseAdmin
    .from("user_equipped_moves")
    .select("slot, move_id, moves(id, name, type, base_damage, daily_limit)")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("slot");
  if (error) throw error;

  const todayStr = new Date().toISOString().slice(0, 10);
  const moveIds = (equipped ?? []).map((e) => e.move_id);
  let usageByMove: Record<string, number> = {};
  if (moveIds.length > 0) {
    const { data: usage } = await supabaseAdmin
      .from("user_move_usage")
      .select("move_id, uses_count")
      .eq("user_id", userId)
      .eq("usage_date", todayStr)
      .in("move_id", moveIds);
    usageByMove = Object.fromEntries((usage ?? []).map((u) => [u.move_id, u.uses_count]));
  }

  return (equipped ?? []).map((e) => ({
    slot: e.slot,
    move: e.moves,
    usesToday: usageByMove[e.move_id] ?? 0,
  }));
}

// Current battle setup: main character, its own equipped moves, and today's usage.
battleRouter.get("/state", async (req, res) => {
  const userId = req.userId!;

  const [{ data: profile, error: profileError }, main] = await Promise.all([
    supabaseAdmin.from("profiles").select("level, coins").eq("id", userId).single(),
    getMainCharacter(userId),
  ]);

  if (profileError || !profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const equippedMoves = main ? await equippedMovesFor(userId, main.character_id) : [];

  res.json({ profile, mainCharacter: main, equippedMoves });
});

// A specific owned Pokémon's equipped moves — used by the Home-screen
// loadout editor, which can edit any owned Pokémon, not just the active one.
battleRouter.get("/moveset/:characterId", async (req, res) => {
  const userId = req.userId!;
  const characterId = req.params.characterId;

  const { data: owned } = await supabaseAdmin
    .from("user_characters")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .maybeSingle();
  if (!owned) {
    res.status(404).json({ error: "You don't own this Pokémon" });
    return;
  }

  const equippedMoves = await equippedMovesFor(userId, characterId);
  res.json(equippedMoves);
});

// Moves the user owns and can equip (ownership is the only gate — STAB is
// the incentive to match types, not a hard eligibility rule).
battleRouter.get("/available-moves", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_moves")
    .select("moves(id, name, type, base_damage, daily_limit)")
    .eq("user_id", req.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map((d) => d.moves));
});

battleRouter.post("/equip", async (req, res) => {
  const userId = req.userId!;
  const { characterId, moveId, slot } = req.body as { characterId?: string; moveId?: string; slot?: number };
  if (!characterId || !moveId || !slot || slot < 1 || slot > 4) {
    res.status(400).json({ error: "characterId, moveId, and slot (1-4) are required" });
    return;
  }

  const [{ data: ownedCharacter }, { data: ownedMove }] = await Promise.all([
    supabaseAdmin.from("user_characters").select("id").eq("user_id", userId).eq("character_id", characterId).maybeSingle(),
    supabaseAdmin.from("user_moves").select("move_id").eq("user_id", userId).eq("move_id", moveId).maybeSingle(),
  ]);
  if (!ownedCharacter) {
    res.status(400).json({ error: "You don't own this Pokémon" });
    return;
  }
  if (!ownedMove) {
    res.status(400).json({ error: "You don't own this move yet — buy it in the shop first" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("user_equipped_moves")
    .upsert({ user_id: userId, character_id: characterId, move_id: moveId, slot }, { onConflict: "user_id,character_id,slot" });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});

// Every stage the user has attempted, so the frontend can compute the
// unlocked frontier without probing level-by-level.
battleRouter.get("/progress", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("boss_encounters")
    .select("level_number, status")
    .eq("user_id", req.userId)
    .order("level_number");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data ?? []);
});

// How large the account's collection/progress is — feeds both max HP and
// outgoing attack damage, so a bigger roster makes you sturdier AND stronger.
async function getCollectionStats(userId: string) {
  const [{ count: pokemonOwned }, { count: legendaryOwned }, { count: levelsCleared }] = await Promise.all([
    supabaseAdmin.from("user_characters").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseAdmin
      .from("user_characters")
      .select("id, characters!inner(is_legendary)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("characters.is_legendary", true),
    supabaseAdmin.from("boss_encounters").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "defeated"),
  ]);
  return {
    pokemonOwned: pokemonOwned ?? 0,
    legendaryOwned: legendaryOwned ?? 0,
    levelsCleared: levelsCleared ?? 0,
  };
}

async function isLevelUnlocked(userId: string, levelNumber: number): Promise<boolean> {
  if (levelNumber === 1) return true;
  const { data } = await supabaseAdmin
    .from("boss_encounters")
    .select("status")
    .eq("user_id", userId)
    .eq("level_number", levelNumber - 1)
    .maybeSingle();
  return data?.status === "defeated";
}

battleRouter.get("/levels/:n", async (req, res) => {
  const userId = req.userId!;
  const levelNumber = Number(req.params.n);
  if (!Number.isInteger(levelNumber) || levelNumber < 1) {
    res.status(400).json({ error: "Invalid level number" });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("boss_encounters")
    .select("*, boss_character:characters(id, name, types, character_sprites(slot, image_url))")
    .eq("user_id", userId)
    .eq("level_number", levelNumber)
    .maybeSingle();

  if (existing) {
    res.json(existing);
    return;
  }

  if (!(await isLevelUnlocked(userId, levelNumber))) {
    res.status(403).json({ error: "Level locked — beat the previous stage first" });
    return;
  }

  const [{ data: profile }, allCharacters, stats] = await Promise.all([
    supabaseAdmin.from("profiles").select("level").eq("id", userId).single(),
    fetchAllRows((from, to) => supabaseAdmin.from("characters").select("id").range(from, to)),
    getCollectionStats(userId),
  ]);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  if (allCharacters.length === 0) {
    res.status(500).json({ error: "No characters available to generate a boss" });
    return;
  }
  const bossCharacterId = allCharacters[Math.floor(Math.random() * allCharacters.length)].id;

  const bossHealth = bossMaxHealth(levelNumber);
  const playerHealth = userMaxHealth({ playerLevel: profile.level, ...stats });

  const { data: created, error } = await supabaseAdmin
    .from("boss_encounters")
    .insert({
      user_id: userId,
      level_number: levelNumber,
      boss_character_id: bossCharacterId,
      boss_max_health: bossHealth,
      boss_current_health: bossHealth,
      user_max_health: playerHealth,
      user_current_health: playerHealth,
      status: "in_progress",
    })
    .select("*, boss_character:characters(id, name, types, character_sprites(slot, image_url))")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(created);
});

battleRouter.post("/move", async (req, res) => {
  const userId = req.userId!;
  const { levelNumber, moveId } = req.body as { levelNumber?: number; moveId?: string };
  if (!levelNumber || !moveId) {
    res.status(400).json({ error: "levelNumber and moveId are required" });
    return;
  }

  const [{ data: encounter }, { data: move }, main] = await Promise.all([
    supabaseAdmin
      .from("boss_encounters")
      .select("*")
      .eq("user_id", userId)
      .eq("level_number", levelNumber)
      .single(),
    supabaseAdmin.from("moves").select("*").eq("id", moveId).single(),
    getMainCharacter(userId),
  ]);

  if (!encounter) {
    res.status(404).json({ error: "Boss encounter not found — visit the level first" });
    return;
  }
  if (encounter.status === "defeated") {
    res.status(400).json({ error: "Boss already defeated" });
    return;
  }
  if (!move) {
    res.status(404).json({ error: "Move not found" });
    return;
  }
  if (!main) {
    res.status(404).json({ error: "No main character" });
    return;
  }

  const { data: equippedRow } = await supabaseAdmin
    .from("user_equipped_moves")
    .select("slot")
    .eq("user_id", userId)
    .eq("character_id", main.character_id)
    .eq("move_id", moveId)
    .maybeSingle();
  if (!equippedRow) {
    res.status(400).json({ error: "Move is not equipped on your active Pokémon" });
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: usageRow } = await supabaseAdmin
    .from("user_move_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("move_id", moveId)
    .eq("usage_date", todayStr)
    .maybeSingle();

  const usesSoFar = usageRow?.uses_count ?? 0;
  if (usesSoFar >= move.daily_limit) {
    res.status(429).json({ error: "Daily limit reached for this move" });
    return;
  }

  // The move-use is spent regardless of outcome — including on a loss.
  await supabaseAdmin
    .from("user_move_usage")
    .upsert(
      { user_id: userId, move_id: moveId, usage_date: todayStr, uses_count: usesSoFar + 1 },
      { onConflict: "user_id,move_id,usage_date" },
    );

  // 1) The user always attacks first. Damage gets a STAB bonus plus a
  // collection-power multiplier — the more Pokémon (and legendaries, and
  // cleared stages) you have, the harder every hit lands.
  const characterTypes: string[] = (main as any).characters?.types ?? [];
  const stab = characterTypes.includes(move.type);
  const stats = await getCollectionStats(userId);
  const damage = Math.round(move.base_damage * (stab ? 1.5 : 1) * collectionAttackMultiplier(stats));
  const bossHealthAfter = Math.max(0, encounter.boss_current_health - damage);
  const defeated = bossHealthAfter <= 0;

  if (defeated) {
    const coinsAwarded = bossCoinReward(levelNumber);
    const [, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("boss_encounters")
        .update({ boss_current_health: 0, status: "defeated", defeated_at: new Date().toISOString() })
        .eq("id", encounter.id),
      supabaseAdmin.from("profiles").select("coins").eq("id", userId).single(),
    ]);
    if (profile) {
      await supabaseAdmin.from("profiles").update({ coins: profile.coins + coinsAwarded }).eq("id", userId);
    }
    res.json({ damage, stab, bossCurrentHealth: 0, defeated: true, coinsAwarded, lost: false });
    return;
  }

  // 2) Boss counter-attacks.
  const bossDamage = bossAttackDamage(levelNumber);
  const userHealthAfter = Math.max(0, encounter.user_current_health - bossDamage);
  const lost = userHealthAfter <= 0;

  if (lost) {
    // The boss keeps the damage dealt this fight — only the player's HP
    // resets to full for the retry. The daily move-use spent above is NOT
    // refunded either way.
    await supabaseAdmin
      .from("boss_encounters")
      .update({ boss_current_health: bossHealthAfter, user_current_health: encounter.user_max_health })
      .eq("id", encounter.id);
    res.json({
      damage,
      stab,
      bossCurrentHealth: bossHealthAfter,
      defeated: false,
      coinsAwarded: 0,
      bossDamage,
      userCurrentHealth: 0,
      lost: true,
    });
    return;
  }

  await supabaseAdmin
    .from("boss_encounters")
    .update({ boss_current_health: bossHealthAfter, user_current_health: userHealthAfter })
    .eq("id", encounter.id);

  res.json({
    damage,
    stab,
    bossCurrentHealth: bossHealthAfter,
    defeated: false,
    coinsAwarded: 0,
    bossDamage,
    userCurrentHealth: userHealthAfter,
    lost: false,
  });
});
