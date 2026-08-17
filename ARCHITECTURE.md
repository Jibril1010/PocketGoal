# GoalGame — File-by-File Guide

What each file does, and why key functions were built the way they were. See [README.md](README.md) for setup instructions.

## Database (`supabase/`)

Migrations are additive and numbered — each one only adds columns/tables so it's always safe to run on a project that already has real data, rather than requiring a destructive reset.

- **`migrations/0001_init.sql`** — the original schema: `profiles`, `characters`/`character_sprites`/`moves`/`character_moves` (public reference data), `user_characters`, `user_equipped_moves`, `user_move_usage`, `goals`, `daily_completions`, `boss_encounters`, `push_subscriptions`. Row Level Security is enabled everywhere and scoped to `auth.uid() = user_id`, even though the backend uses the service-role key (which bypasses RLS) for almost all writes — the policies exist as defense-in-depth in case anything ever queries Supabase directly from the client.
  - `handle_new_user()` trigger function: fires on signup to create the `profiles` row and grant the starter character. **Why a trigger and not a backend endpoint**: signup happens through Supabase Auth directly (not through our API), so there's no request the backend could hook — a database trigger is the only reliable place to react to "a new `auth.users` row appeared."
- **`migrations/0002_daily_goals_battle_shop_music.sql`** — adds `goals.is_daily`, `daily_goal_completions`, HP columns on `boss_encounters`, `moves.coin_cost`, `user_moves` (move ownership), `songs`, `user_music_selection`. Also re-declares `handle_new_user()` to grant a free starter move kit — **why**: once moves cost coins, a brand-new account would otherwise have zero equippable moves.
- **`migrations/0003_per_character_moves.sql`** — adds `character_id` to `user_equipped_moves` and changes its primary key from `(user_id, slot)` to `(user_id, character_id, slot)`. **Why**: moves used to be one shared loadout for the whole account; this makes each owned Pokémon remember its own 4 moves, like the real games. The migration backfills existing rows to the user's then-current main character before enforcing `NOT NULL`, so it doesn't break existing equips.
- **`seed.sql`** — the original hand-written 6 characters (Victini as starter + 5 purchasable) and 15 moves. Kept separate from the later bulk-generated roster so the two data sources stay easy to tell apart.

## Backend (`backend/src/`)

Express + TypeScript API. Every route except `/health` sits behind `requireAuth`, which verifies the caller's Supabase JWT and attaches `req.userId`.

### `index.ts`
Wires up Express: CORS restricted to the frontend origin, mounts every router under its path, starts the daily cron (`scheduleDailyStreakCheck`), and exposes `POST /internal/run-streak-check` — **why**: lets the cron's logic be triggered on demand for testing instead of waiting for the actual scheduled time.

### `lib/`
- **`env.ts`** — reads and validates required env vars once at boot (`required()` throws immediately if something's missing), rather than letting a missing key surface later as a confusing runtime error deep in a request handler.
- **`supabase.ts`** — the service-role Supabase client used by nearly every route. **Why service-role and not the user's own token**: the backend needs to perform multi-step operations (deduct coins *and* grant an item, for example) atomically from the server's perspective, and RLS would otherwise require every table touched mid-transaction to have a matching user-scoped policy.
- **`auth.ts`** — `requireAuth` middleware: pulls the `Bearer` token, asks Supabase to validate it, and attaches `req.userId`. Centralizing this means route handlers never touch tokens directly.
- **`ai.ts`** — calls Gemini to rate a goal's difficulty. `rateGoalDifficulty()` forces a structured JSON response (`responseSchema`) constrained to the four-tier enum, and the system prompt explicitly tells the model the goal text is untrusted input, not instructions. **Why**: the model only ever returns a tier name, never a number — so goal text can't be used to prompt-inject an arbitrary EXP reward. The actual number is decided separately (see `gameConfig.expRewardForTier`).
- **`gameConfig.ts`** — every game-balance formula lives here as a pure function, not scattered across routes: `expRewardForTier`, `expToNextLevel`, `bossMaxHealth`, `bossCoinReward`, `userMaxHealth`, `bossAttackDamage`, plus constants like `COINS_PER_MILESTONE` and `DAILY_GOAL_COIN_BONUS`. **Why one file**: tuning difficulty/pacing means editing numbers in one place instead of hunting through route handlers.
- **`streak.ts`** — `applyStreakCompletion()` computes the new streak count from "was yesterday the last completed day?" logic. Pulled out of `goals.ts` into its own pure function so the date-math edge cases (already-completed-today vs. streak-broken vs. streak-continuing) are testable in isolation.
- **`webPush.ts`** — configures the `web-push` library from the VAPID keys once, and exports `webPushConfigured` so callers can no-op gracefully instead of crashing when push isn't set up in a given environment.
- **`types.ts`** — shared `Profile`/`Goal` row shapes used across routes, kept minimal (only the fields routes actually destructure) rather than mirroring the full DB schema.

### `routes/`
- **`goals.ts`** — CRUD + completion for goals.
  - `POST /` scores difficulty via `ai.ts`, falling back to `"medium"` if the Gemini call throws — **why**: a flaky AI call shouldn't block goal creation entirely.
  - `GET /` computes `completed_today` per daily goal by checking `daily_goal_completions` for today's date rather than storing a boolean that would need a nightly reset job — **why**: a derived value can't drift out of sync with the calendar.
  - `POST /:id/complete` branches on `is_daily`: one-off goals flip to `status: 'completed'` permanently; daily goals stay `'active'` forever and just gain a new `daily_goal_completions` row each day. Both paths run the same EXP/level/streak/milestone-coin logic; daily goals additionally add `DAILY_GOAL_COIN_BONUS`.
- **`battle.ts`** — the combat system.
  - `getMainCharacter()` / `equippedMovesFor()` are small shared helpers so `/state`, `/moveset/:characterId`, and `/move` don't each re-implement "fetch this character's active loadout with today's usage counts."
  - `isLevelUnlocked()` replaces the old "your character level ≥ stage number" gate with "level 1, or the previous stage's `boss_encounters` row is `defeated`" — **why**: the feature was explicitly requested as sequential progression, not level-gating.
  - `GET /levels/:n` picks a random `boss_character_id` the *first* time a stage is visited and persists it, rather than re-rolling on every fetch — **why**: otherwise the boss's sprite would change every time you reloaded the page mid-fight.
  - `POST /move` always resolves the user's attack first, then the boss's counter-attack, matching "the user always attacks first." On a loss, both sides' HP reset to full but the daily move-use already spent is *not* refunded — **why**: that was an explicit requirement ("the moves they used are still lost"), and it's what makes the daily-limit mechanic meaningful even after a loss.
  - `POST /equip` now takes `characterId` and validates both the character and the move are owned before upserting on `(user_id, character_id, slot)` — one loadout per owned Pokémon, not one for the whole account.
- **`shop.ts`** — `GET /` returns unowned characters and unowned moves in one response (`{characters, moves}`) so the frontend can render both shop tabs from a single query. `POST /buy/character/:id` and `POST /buy/move/:id` share the same pattern: check affordability, deduct coins, insert ownership, and refund the coins if the ownership insert fails — **why the refund step**: without it, a transient insert failure would silently take the user's coins without granting the item.
- **`characters.ts`** — `GET /mine` returns everything a user owns with nested sprites, used by the home screen, shop, and battle setup. `POST /main` swaps which owned Pokémon is "active" (unsets the old `is_main`, sets the new one) — **why two separate updates instead of one**: `is_main` has no uniqueness constraint enforced at the DB level, so the clear-then-set order in application code is what actually guarantees only one Pokémon is ever main.
- **`homescreen.ts`** — `POST /position` (drag placement) clamps `posX`/`posY` to 0–100 server-side — **why**: the frontend already clamps during drag, but a raw API caller shouldn't be able to place a sprite off-canvas. `POST /toggle` shows/hides an owned character on the board.
- **`music.ts`** — `GET/POST /songs` (catalog), `GET/POST /selection` (per-user "what's currently selected"). Deliberately thin — all the interesting behavior (autoplay, persistence across navigation) lives in the frontend's `MusicContext`, not here.
- **`push.ts`** — `GET /public-key` hands the VAPID public key to the frontend so it can be embedded in a client-side `PushSubscription` call; `POST /subscribe` stores the resulting subscription, upserting on `endpoint` so re-subscribing the same browser doesn't create duplicate rows.
- **`profile.ts`** — a single `GET /` returning the full profile row. Split out from `battle.ts`'s `/state` (which only returns `level`/`coins`) because the Profile page needs the full row (streak, EXP, goals-completed count) and fetching all of it on every battle-related query would be wasteful.

### `jobs/dailyStreakCheck.ts`
`runDailyStreakCheck()` is exported as a plain function (not just registered as a cron callback) specifically so it can be invoked on demand via the `/internal/run-streak-check` route — **why**: verifying "does the reminder actually get sent" shouldn't require waiting for 8pm. For each profile with no completion today, it zeroes the streak and pushes a reminder to every subscribed device, removing subscriptions that fail to send (expired/unsubscribed endpoints).

### `scripts/`
One-off data-loading scripts, run manually with `tsx`, not part of the running server.
- **`seedGen1Gen2.ts`** — bulk-inserts the full Gen 1–2 Pokémon roster (251 species, real types) and every Gen 1–2 damaging move (128 moves, real power/type), both pulled from pokemondb.net rather than typed from memory, to avoid data-entry errors at this scale. Skips any name that already exists so it's safe to re-run. Pricing is computed by formula (`characterPrice`, `movePrice`, `dailyLimitFor`) rather than hand-assigned per item — **why**: assigning 379 individual prices by hand isn't tractable; a formula keeps prices varied but consistent (legendaries cost more, higher-power moves cost more and get fewer daily uses).
- **`registerLocalSongs.ts`** — scans `frontend/public/music/` and inserts a `songs` row per file, deriving a clean title from the filename (stripping leading track numbers). **Why a script instead of the in-app "Add track" form**: registering 13 files one-by-one through the UI would've been tedious; this does it in one pass and stays safe to re-run as more files are added.

## Frontend (`frontend/src/`)

React + TypeScript + Vite. React Query handles all server state; there's no separate global store.

### Entry points
- **`main.tsx`** — mounts the app inside `QueryClientProvider` → `AuthProvider` → `BrowserRouter`.
- **`App.tsx`** — defines routes. `ProtectedLayout` is rendered once via a parent `<Route element={<ProtectedLayout/>}>` wrapping child routes with `<Outlet/>`, rather than each page wrapping itself in its own layout instance — **why this matters**: the `MusicProvider` (and its `<audio>` element) lives inside `ProtectedLayout`, so mounting it once per session instead of once per page navigation is what lets background music keep playing as you move between pages instead of restarting on every click. `GesturePill` renders a "🔊 Tap to play music" button when the browser has blocked autoplay, satisfying the browser's require-a-user-gesture policy with one click.
- **`vite.config.ts`** / **`vite-env.d.ts`** — standard Vite + React plugin config and the `import.meta.env` type reference.

### `lib/`
- **`supabase.ts`** — the browser Supabase client (anon key), used only for auth (sign in/up/out, session listening) — all other data access goes through the backend API, not directly through Supabase from the client.
- **`api.ts`** — a thin `fetch` wrapper (`api.get`/`api.post`) that automatically attaches the current Supabase session's access token as a `Bearer` header. Centralizing this means no page has to manually thread the auth token through every request.
- **`AuthContext.tsx`** — exposes `session`/`loading` via `useAuth()`, subscribing to Supabase's `onAuthStateChange` so every page reacts immediately to sign-in/out without polling.
- **`MusicContext.tsx`** — the persistent player. On mount (once per session, since `ProtectedLayout` only mounts once) it fetches the song catalog and picks a random track, per the requirement that a fresh random song plays every app start. `selectSong()` both switches playback and persists the choice via `POST /music/selection`. The `needsGesture` flag exists because `audio.play()` returns a rejected promise when the browser blocks autoplay-with-sound; rather than failing silently, the context surfaces that state so `GesturePill` can offer a one-click fix.
- **`push.ts`** — wraps the browser's Notification/Push APIs (`enablePushNotifications`) for the Profile page's opt-in flow; converts the VAPID public key from base64 to the `Uint8Array` format `pushManager.subscribe` requires.
- **`types.ts`** — every shape returned by the backend API, kept in one file so a backend response-shape change is easy to trace to every page that consumes it.

### `hooks/useDraggableSprite.ts`
A custom pointer-events drag hook (no external drag-and-drop library) that tracks position as a percentage of a container while dragging and reports the final position on drop. **Why hand-rolled**: the home screen's drag behavior is simple enough (free placement within a bounded canvas, no reordering/collision logic) that a full drag-and-drop library would be more dependency than the feature needs.

### `components/`
- **`NavBar.tsx`** — top navigation plus a live level/coins readout, fetched independently from `/battle/state` so it stays current without every page having to lift that state up.
- **`FocusTimer.tsx`** — countdown timer (local `setInterval` state, nothing persisted server-side since a timer is inherently ephemeral) with an embedded song picker built on `useMusic()`. Fires a browser `Notification` on completion only if permission was already granted elsewhere — **why not request permission itself**: a timer finishing isn't a good moment to interrupt the user with a permission prompt for the first time.

### `pages/`
- **`LoginPage.tsx` / `SignupPage.tsx`** — thin forms around Supabase Auth's `signInWithPassword`/`signUp`.
- **`HomePage.tsx`** — the drag-and-drop board (`SpriteItem`, using `useDraggableSprite`), plus two cards: `BattleSetupCard` (switch active Pokémon via `POST /characters/main`, edit that Pokémon's 4 moves via `POST /battle/equip`) and `ManageBoardCard` (dropdown + toggle to add/remove any owned Pokémon from the board via `POST /homescreen/toggle`). The move-slot `<select>` placeholders are non-disabled empty options rather than `disabled` ones — **why**: a disabled placeholder that doesn't match the current controlled value can make some browsers silently auto-select a real option and fire `onChange`, which was observed to spuriously equip moves when switching characters before this fix.
- **`GoalsPage.tsx`** — goal creation/completion, split into Daily / Active / Completed sections by `is_daily`/`status`, plus the `FocusTimer` card.
- **`BattlePage.tsx`** — level grid (frontier computed from `/battle/progress`, showing a few locked stages ahead rather than the whole infinite range), the HP-bar battle view with the player's back sprite facing the boss's front sprite, and a dedicated lose-screen state (`justLost`) that replaces the whole view rather than being an inline banner — **why a full replacement**: it's meant to read as a clear stopping point ("you lost, here's what happened, go home") rather than something easy to miss alongside the regular battle UI.
- **`ShopPage.tsx`** — tabbed Pokémon/Moves shop sections against the combined `GET /shop` response.
- **`ProfilePage.tsx`** — EXP/streak display, the push-notification opt-in, and the music card (now driven by `useMusic()` instead of page-local state, so picking a song here affects the same player that follows you across the app).

### `index.css`
All styling as plain CSS with a small set of reusable class names (`.card`, `.goal-row`, `.badge`, `.move-grid`, etc.) rather than a component library or CSS-in-JS — **why**: the app's visual surface is small enough that a component library would add more overhead than it saves, and plain CSS keeps the whole style layer readable in one file.
