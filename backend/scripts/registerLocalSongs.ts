// One-time (idempotent) helper: registers every mp3 already sitting in
// frontend/public/music/ as a row in the `songs` table, deriving a clean
// title from the filename. Skips any file_url already present, so it's
// safe to re-run after dropping in more tracks.
//
// Run with: npx tsx scripts/registerLocalSongs.ts   (from backend/)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const musicDir = path.resolve(__dirname, "../../frontend/public/music");

function titleFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.mp3$/i, "");
  // Strip a leading track number like "14. ", "68 ", "33a "
  return withoutExt.replace(/^\d+[a-zA-Z]?\.?\s+/, "").trim();
}

async function main() {
  const files = readdirSync(musicDir).filter((f) => f.toLowerCase().endsWith(".mp3"));
  console.log(`Found ${files.length} mp3 files in ${musicDir}`);

  const { data: existing } = await supabase.from("songs").select("file_url");
  const existingUrls = new Set((existing ?? []).map((s) => s.file_url));

  const rows = files
    .map((f) => ({ title: titleFromFilename(f), file_url: `/music/${f}` }))
    .filter((row) => !existingUrls.has(row.file_url));

  if (rows.length === 0) {
    console.log("Nothing new to register.");
    return;
  }

  const { data: inserted, error } = await supabase.from("songs").insert(rows).select("title, file_url");
  if (error) throw new Error(`insert failed: ${error.message}`);

  console.log(`Registered ${inserted?.length ?? 0} tracks:`);
  for (const row of inserted ?? []) console.log(` - ${row.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
