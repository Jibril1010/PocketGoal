# GoalGame

A gamified goal tracker: complete real-life goals to earn AI-judged EXP and level up, keep a daily streak alive (with push-notification nudges), spend coins on collectible sprites you place freely on a home screen, and fight procedurally-generated bosses using a 4-move kit with same-type damage bonuses.

## Stack

- **Frontend**: React + TypeScript + Vite (`frontend/`)
- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **Database/Auth**: Supabase (Postgres + Auth) (`supabase/`)
- **AI difficulty scoring**: Google Gemini API (free tier)

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. From Project Settings → API, grab:
   - `Project URL`
   - `anon public` key (for the frontend)
   - `service_role` key (for the backend — **keep secret, never ship to the client**)

## 2. Get a Gemini API key (free)

Create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required on the free tier (rate-limited, but plenty for personal use). Used server-side only, to rate how hard each goal is.

## 3. Generate VAPID keys (for push notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the public/private key pair into both `.env` files below.

## 4. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in:
- `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `frontend/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the backend serves its own VAPID public key to the client at runtime, so nothing else is required there)

## 5. Install & run

```bash
cd backend && npm install && npm run dev   # http://localhost:4000
cd frontend && npm install && npm run dev  # http://localhost:5173
```

Sign up in the app (Supabase sends a confirmation email by default — you can disable "Confirm email" in Supabase Auth settings for faster local testing), then:

1. **Goals** — add a goal; Gemini rates its difficulty (easy/medium/hard/epic) and assigns an EXP reward within a fixed range per tier. Complete it to gain EXP, build your streak, and periodically earn coins (every 5 completed goals, by default — see `COINS_PER_MILESTONE` in `backend/src/lib/gameConfig.ts`).
2. **Battle** — pick an unlocked level, equip up to 4 moves on your starter (Victini), and attack. Moves that share a type with your character deal 1.5x (STAB) damage. Moves have daily-use limits, so tougher bosses may take several days. Defeating a boss awards coins.
3. **Shop** — spend coins to unlock more sprites (Squirtle, Bulbasaur, Pikachu, Klefki, Charmander in the seed data).
4. **Home** — drag any unlocked sprite anywhere on the board; position is saved automatically.
5. **Profile** — see your level/EXP bar and streak, and enable browser push notifications.

## Notifications

The backend runs a daily cron job (`backend/src/jobs/dailyStreakCheck.ts`, scheduled for 20:00 server time) that resets any broken streaks and sends a web-push reminder to users who haven't completed a goal that day. To test it immediately instead of waiting for the schedule:

```bash
curl -X POST http://localhost:4000/internal/run-streak-check
```

## Sprite artwork

Seed data references animated sprite URLs from pokemondb.net directly (e.g. the Victini sprite you get from `https://img.pokemondb.net/sprites/black-white/anim/normal/victini.gif`). These are Nintendo/Game Freak's copyrighted artwork — fine to reference for this personal/local project, but don't redistribute or ship this app publicly using that art. Swap `supabase/seed.sql` for your own art source if you plan to share the app.

## Notes on the AI scoring

Goal titles/descriptions are untrusted user text. The backend (`backend/src/lib/ai.ts`) only ever reads a constrained `difficulty_tier` enum out of a forced JSON schema response — never a raw EXP number — and `backend/src/lib/gameConfig.ts` clamps the actual EXP reward to a fixed range per tier. This means goal text can't be used to self-assign an arbitrary reward via prompt injection.
