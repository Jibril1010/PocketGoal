import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Service-role client: bypasses RLS, used only in trusted backend code paths
// (awarding exp/coins, generating boss encounters, sending push notifications).
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Supabase caps any unranged select at 1000 rows. Tables like `characters`
// have grown past that (1300+ with shiny variants), so any query that wants
// "every row" has to page through with .range() instead of a plain select.
export async function fetchAllRows<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}
