# PROJECT KAI — SUPABASE ACTIVATION GUIDE

Exact, current steps to turn on the website's Supabase backend (comments, reactions, bookmarks, feature requests, `/admin` moderation, page-view analytics). Written from direct inspection of `src/lib/supabase.js`, `supabase/schema.sql`, and `.env.example` this pass — nothing here is invented or aspirational.

## Current state (verified this pass)

- 🔴 Not configured. `infrastructure_health_check.py`'s `check_supabase()` reports **BLOCKED_EXTERNAL_ACTION**: "Website environment configuration file does not exist."
- The site is not broken by this — every backend-dependent component checks `isBackendConfigured` (`src/lib/supabase.js`) and falls back to **DEMO MODE**: real UI, an honest "not saved" message, zero fabricated persistence. This has been true and tested throughout the session.
- Only the public **anon key** is ever used client-side (`getClient()` in `src/lib/supabase.js`). The service-role key is never referenced anywhere in this codebase — confirmed by repeated `dist/` secrets scans this session, most recently this pass (0 leaks).

## Step-by-step activation

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (your account — this session cannot do this for you).
2. **Run the schema**: open the project's SQL Editor and run the full contents of `kai-os-website/supabase/schema.sql` (315 lines — tables, indexes, and Row Level Security policies for comments, reactions, bookmarks, feature requests, analytics, and the `admins` allowlist table).
3. **Grant yourself admin access**: the schema creates an `admins` table with **no public policies at all** — it's readable/writable only via the Supabase dashboard (service role) or the `is_admin()` SQL function, which checks `auth.jwt() ->> 'email'` against that table. In the dashboard's Table Editor, insert one row into `admins` with your email (the one you'll sign in with via magic link on `/admin`).
4. **Enable email auth**: in Authentication → Providers, confirm Email (magic link) is enabled — this is what `/admin` uses to authenticate, gated by the `is_admin()` check from step 3.
5. **Get your credentials**: in Project Settings → API, copy the **Project URL** and the **anon/public key** (NOT the service-role key — that must never enter this codebase).
6. **Create the website's environment file**: copy `kai-os-website/.env.example` to `kai-os-website/.env` and fill in:
   ```
   PUBLIC_SUPABASE_URL=<your project URL>
   PUBLIC_SUPABASE_ANON_KEY=<your anon key>
   ```
7. **Rebuild**: `npm run build` from `kai-os-website/`, then redeploy (see `PROJECT_KAI_FINAL_GO_LIVE_REPORT.md` Section C for the deploy command — note the separate, already-documented Netlify Team Protection blocker in `PROJECT_KAI_PRODUCTION_INTEGRATION_AUDIT.md` and `PROJECT_KAI_PRODUCTION_INTEGRATION_FINAL.md` must also be resolved for the rebuilt site to be publicly reachable).
8. **Verify**: re-run `python scripts/generate_health_snapshot.py` in `KAI_OS/` — `check_supabase()` should flip from RED/BLOCKED to GREEN once the `.env` file and both variables are present. This is the same honest, build-time-only signal Command Center already displays; nothing about this check requires a live network call to Supabase, it only confirms the configuration file and variables exist.

## What activation turns on

Comments (`CommentSection.astro`), reactions, bookmarks, feature requests, `/admin` moderation center, and real (non-localStorage-only) page-view analytics — all already code-complete and tested against the schema above; none of this requires further website code changes, only the five external steps above.

## What activation does NOT do

It does not create any connection between the website and the local KAI_OS Python backend — Supabase is purely the website's own comments/reactions/analytics database, unrelated to the build-time snapshot pattern that carries KAI_OS health/production data into the site (see `PROJECT_KAI_PRODUCTION_INTEGRATION_AUDIT.md` for that separate architecture).
