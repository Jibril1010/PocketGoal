// One-time (idempotent) data seed: adds a purchasable "Shiny" counterpart
// for every character that doesn't have one yet, priced higher than the
// original. Reuses each character's own already-seeded shiny sprite URLs
// (character_sprites slot 2 = front-shiny, slot 4 = back-shiny) rather than
// recomputing anything, so it stays consistent with whatever art each
// character actually has.
//
// Run with: npx tsx scripts/seedShinyVariants.ts   (from backend/)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SHINY_PREFIX = "Shiny ";
const SHINY_MULTIPLIER = 3.5;
const SHINY_MIN_PRICE = 300;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log("Fetching characters and their sprites…");
  const { data: allCharacters, error: charError } = await supabase
    .from("characters")
    .select("id, name, types, coin_cost");
  if (charError) throw new Error(charError.message);

  const baseCharacters = (allCharacters ?? []).filter((c) => !c.name.startsWith(SHINY_PREFIX));
  const existingShinyNames = new Set(
    (allCharacters ?? []).filter((c) => c.name.startsWith(SHINY_PREFIX)).map((c) => c.name),
  );

  const baseCharacterIds = new Set(baseCharacters.map((c) => c.id));
  const spritesByCharacter = new Map<string, { front?: string; back?: string }>();
  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error: spriteError } = await supabase
      .from("character_sprites")
      .select("character_id, slot, image_url")
      .range(from, from + PAGE_SIZE - 1);
    if (spriteError) throw new Error(spriteError.message);
    for (const s of page ?? []) {
      if (!baseCharacterIds.has(s.character_id)) continue;
      const entry = spritesByCharacter.get(s.character_id) ?? {};
      if (s.slot === 2) entry.front = s.image_url;
      if (s.slot === 4) entry.back = s.image_url;
      spritesByCharacter.set(s.character_id, entry);
    }
    if (!page || page.length < PAGE_SIZE) break;
  }

  const toCreate = baseCharacters.filter((c) => {
    const shinyName = `${SHINY_PREFIX}${c.name}`;
    if (existingShinyNames.has(shinyName)) return false;
    const spr = spritesByCharacter.get(c.id);
    return Boolean(spr?.front && spr?.back);
  });

  console.log(
    `Creating ${toCreate.length} shiny variants (skipping ${baseCharacters.length - toCreate.length} already present or missing sprite data)…`,
  );

  const rows = toCreate.map((c) => {
    const spr = spritesByCharacter.get(c.id)!;
    return {
      name: `${SHINY_PREFIX}${c.name}`,
      types: c.types,
      coin_cost: Math.max(SHINY_MIN_PRICE, Math.round(c.coin_cost * SHINY_MULTIPLIER)),
      is_starter: false,
      _front: spr.front!,
      _back: spr.back!,
    };
  });

  for (const batch of chunk(rows, 50)) {
    const { data: inserted, error } = await supabase
      .from("characters")
      .insert(batch.map(({ _front, _back, ...row }) => row))
      .select("id, name");
    if (error) throw new Error(`character insert failed: ${error.message}`);

    const spriteRows = (inserted ?? []).flatMap((row) => {
      const src = batch.find((b) => b.name === row.name);
      if (!src) return [];
      return [
        { character_id: row.id, slot: 1, image_url: src._front },
        { character_id: row.id, slot: 2, image_url: src._front },
        { character_id: row.id, slot: 3, image_url: src._back },
        { character_id: row.id, slot: 4, image_url: src._back },
      ];
    });
    const { error: spriteInsertError } = await supabase.from("character_sprites").insert(spriteRows);
    if (spriteInsertError) throw new Error(`sprite insert failed: ${spriteInsertError.message}`);
  }

  const { count: finalCharCount } = await supabase.from("characters").select("id", { count: "exact", head: true });
  console.log(`Done. Total characters (including shinies): ${finalCharCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
