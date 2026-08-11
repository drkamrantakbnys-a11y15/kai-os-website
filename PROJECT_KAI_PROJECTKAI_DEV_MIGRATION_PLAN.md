# PROJECT KAI — projectkai.dev PRODUCTION MIGRATION PLAN

Read-only audit. No DNS, Cloudflare, hosting, or credential changes were made while producing this document. Every claim below is either a direct file read, a live HTTP check against `projectkai.dev` performed this pass, or an explicit citation of a prior session's already-written report (`PROJECT_KAI_SPRINT13_LAUNCH_AUDIT.md`, dated 2026-07-07) — never inferred or assumed.

## 1. Current production architecture (`projectkai.dev`)

**Confirmed live, this pass:**
- `https://projectkai.dev/` → `200 OK`. Response headers: `Server: cloudflare`, `cf-cache-status: DYNAMIC`, a Cloudflare `Report-To`/`Nel` beacon, `CF-RAY` present. **The domain is genuinely proxied through Cloudflare** — not a DNS misconfiguration or parked domain.
- `http://projectkai.dev/` (no TLS) → `301` to `https://projectkai.dev/`. TLS is enforced.
- `https://www.projectkai.dev/` → `200 OK` independently (does **not** redirect to the apex — both resolve to the same Cloudflare-fronted origin and serve identical content).
- The `404` page is a **genuine, custom Astro 404** ("Page Not Found | Project KAI"), not Cloudflare's generic error page — confirms a real, intentionally-deployed Astro static build sits behind Cloudflare, not an empty/misconfigured origin.
- **The content is byte-for-byte the same stale build** `PROJECT_KAI_SPRINT13_LAUNCH_AUDIT.md` documented over a month ago (2026-07-07): hero "Project KAI builds KAI OS", "V1.0 Static Launch" badge, stat strip "11+ AI Agents / 100+ Workflows / 25+ Research Areas / V1", 6-item nav (Home/About/Agents/Research/Features/Roadmap/Blog), no Command Center, no Media Network, no Status/Security/Docs/Changelog/Knowledge/Admin. This matches the very first commit (`b8d3715 "Launch KAI OS website v1.0"`), not any of the dozens of sprints since.
- **`sitemap.xml` on production still lists exactly 9 routes** (`/`, `/about`, `/agents`, `/research`, `/blog`, `/blog/practical-ai-workflows-for-solo-creators/`, `/contact`, `/privacy`, `/terms`) — re-verified live this pass, unchanged from Sprint 13.
- **Route-parity check (this pass, live)**: `/status`, `/security`, `/command-center`, `/media`, `/admin`, `/docs`, `/knowledge`, `/changelog` all return `404` on production. None of this session's (or the last several months') work is reachable on the real domain.

**Deployment mechanism: UNKNOWN — REQUIRES CLOUDFLARE DASHBOARD VERIFICATION.** This was Sprint 13's exact conclusion and nothing has changed:
- No `wrangler.toml`, no GitHub Actions/CI workflow, no Netlify/Vercel config exists anywhere in this repository, at any commit.
- The local machine has **no `cloudflared` and no `wrangler` installed** (confirmed absent from `PATH`, from `kai-os-website/node_modules/.bin/`, and from every standard config location — `~/.cloudflared`, `~/.wrangler`, `~/.config/wrangler` — this pass).
- No `CLOUDFLARE_*`/`CF_*` credentials exist in this shell's environment or in `KAI_OS/.env` (checked by variable name only).
- **This machine has never been authenticated with Cloudflare for deployment purposes**, and nothing in this repository can deploy to or even identify the exact Cloudflare Pages/Workers project (if any) serving `projectkai.dev` today.

The most plausible explanation, based on the evidence (real Cloudflare proxy + a genuine but frozen-in-time Astro build + zero in-repo deployment config): a Cloudflare Pages project was created and deployed **once**, a long time ago, likely via a one-time manual upload or a Git integration that was later disconnected/repointed — and has not been touched since. This is a reasonable inference from the evidence, not a confirmed fact.

## 2. Current local architecture (`D:\JARVIS_SYSTEM\kai-os-website`)

- Astro 7, `output: "static"` (default, no adapter in `astro.config.mjs`).
- **31 pages build successfully** (`npm run build` → 31/31, 0 errors, re-confirmed this session multiple times).
- Real, tested features not present on production at all: Command Center (with live-structured YouTube channel data), Infrastructure Health, PRIMARY/SECONDARY YouTube channel monitoring, the deterministic content router (`destination`/`requires_human_review`/`safety_flags`/`recommended_action`), the self-upgrade/change-proposal ledger's public surface, Media Network, Agents (13 real entries), AI News, Future Radar, Discover, Search, Reviews, Learn, Experiments, `/admin` (Supabase-gated), Analytics, Security, Status, Changelog, Knowledge, Docs.
- `netlify.toml` present: build command, publish dir, security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` site-wide; `X-Robots-Tag: noindex, nofollow` on `/admin`).
- **No `wrangler.toml` and no Cloudflare Pages config exist in this repo.** If Cloudflare Pages becomes the target, that project (new or existing) will need its own build configuration — nothing to reuse from this repo today beyond the Astro build itself.

## 3. Current deployment provider (Netlify)

- Project `project-kai-ai`, linked and authenticated via the Netlify CLI (confirmed working this session — `npx netlify status` returns the account `drkamrantakbnys@gmail.com` and project details without any login prompt).
- **Live, current, and verified** at `https://project-kai-ai.netlify.app`: 31/31 pages, the Netlify "Team protection" wall that previously blocked public access has been resolved, security headers confirmed live via direct header inspection, Command Center's new YouTube-channels section confirmed rendering with 0 console errors, at both desktop and mobile viewports.
- **`project-kai-ai.netlify.app` and `projectkai.dev` are completely disconnected today** — no DNS record, no redirect, no shared configuration links them. They are two independent deployments of (at very different points in time) the same source repository.

## 4. Cloudflare configuration status (this machine)

| Item | Status |
|---|---|
| `cloudflared` installed | ABSENT |
| `wrangler` installed (global or local) | ABSENT |
| `wrangler.toml` in repo | ABSENT |
| `~/.cloudflared` config dir | ABSENT |
| `~/.wrangler` / `~/.config/wrangler` | ABSENT |
| `CLOUDFLARE_*`/`CF_*` env vars (shell or `.env`) | ABSENT |
| Machine authenticated with Cloudflare | **NO** — no CLI tool is even installed, let alone logged in |
| Cloudflare Tunnel for `backend_api/` | Not created (by design — deferred pending your `cloudflared` setup, per `backend_api/README.md`) |

## 5. Production vs. local feature migration matrix

| Feature | Current Prod (`projectkai.dev`) | Local (`kai-os-website`) | Migration Needed |
|---|---|---|---|
| Page count | 9 routes (sitemap-confirmed) | 31 pages | Full redeploy |
| Homepage | Pre-Sprint-1 "V1.0 Static Launch" hero/stats | Current, multi-sprint redesigned hero | Yes |
| Command Center | Does not exist (404) | Live, with Infrastructure Health + YouTube channel cards | Yes |
| Infrastructure Health | Does not exist | Live, 13-check build-time snapshot | Yes |
| YouTube channel monitoring (PRIMARY/SECONDARY) | Does not exist | Live, structured per-channel data | Yes |
| Content router (`destination`/`requires_human_review`/`safety_flags`/`recommended_action`) | Does not exist | Live, on `/media` | Yes |
| Self-upgrade / change-proposal ledger surface | Does not exist | Present (design-documented, read surface exists) | Yes |
| Media Network | Does not exist | Live | Yes |
| Agents | Old placeholder page (6 hardcoded generic cards) | 13 real, data-driven agent entries | Yes |
| AI News / Future Radar / Discover / Reviews / Learn / Experiments / Search | Do not exist | All live | Yes |
| Status / Security / Docs / Changelog / Knowledge | Do not exist (404) | All live, data-driven from `kai-os-public-data.json` | Yes |
| `/admin` | Does not exist | Live, Supabase Auth-gated (DEMO MODE until Supabase is configured) | Yes |
| Analytics | Does not exist | Live (local + Supabase-backed when configured) | Yes |
| `robots.txt` / `sitemap.xml` | 9 stale URLs | 30 current URLs, correct `/admin` disallow | Yes |
| Security headers | Cloudflare's own defaults only (no app-level headers observed) | `netlify.toml`-defined (`X-Frame-Options`, etc.) | Yes, if migrating off Netlify — must be replicated at the new origin/Cloudflare rule level |
| Backend bridge (`backend_api/`) | N/A — not built for production use yet | Built, tested, **not deployed/exposed anywhere** | No migration action yet (Phase 3-only, per your explicit instruction not to expose it) |

## 6. Recommended target architecture

Evaluated against your stated priority order (security → ownership → reliability → simple deployment → Cloudflare integration → cost → evolvability → rollback → backend-bridge compatibility → trading isolation):

### Primary recommendation: **Option A — Cloudflare Pages**, gated on one dashboard check

```
projectkai.dev
      |
  Cloudflare
      |
  Astro static build (Cloudflare Pages)
      |
  sanitized snapshots (unchanged build-time pattern)
```

**Why this wins on the priorities that matter most here:**
- **Ownership (#2)**: everything — DNS, CDN, hosting, and (later) the Cloudflare Tunnel for `backend_api/` — sits under the one Cloudflare account you already control, no standing dependency on a second third-party platform (Netlify).
- **Cloudflare integration (#5) and backend-bridge compatibility (#9)**: Pages and the planned Cloudflare Tunnel share infrastructure, auth model, and dashboard — the cleanest fit for the "public site + secure API behind the same edge" shape already designed in `PROJECT_KAI_BACKEND_BRIDGE_DESIGN.md`.
- **Trading isolation (#10)**: unaffected either way — the trading system was never reachable from any web-facing deployment, Netlify or Cloudflare.

**Why it's gated, not immediate**: whether a Cloudflare Pages project already exists for this domain (possibly the very thing serving the stale content today) is genuinely unknown from this machine — Section 1 above explains why. **The first concrete step is a dashboard check, not a new deployment.**

### Fast, low-risk interim option: **Option C — Netlify behind Cloudflare DNS**

```
projectkai.dev
      |
  Cloudflare DNS (proxy or DNS-only)
      |
  Netlify (project-kai-ai, already live/tested)
      |
  Astro site (current, 31 pages)
```

If you want `projectkai.dev` showing the **current, correct** site quickly while a proper Cloudflare Pages migration is planned at leisure, this requires only: (1) adding `projectkai.dev` as a custom domain in the Netlify dashboard, and (2) one Cloudflare DNS record change (a `CNAME`/`ALIAS` at the apex, or Netlify's provided target) pointing to Netlify instead of whatever currently serves the stale build. **Zero new build pipeline, zero new hosting to test** — reuses the exact deployment already verified this session. The tradeoff: `projectkai.dev` would depend on two vendors (Cloudflare for DNS/edge, Netlify for hosting) rather than one.

### Not recommended right now: Option B (reuse whatever's already there)

Cannot be evaluated until the dashboard check confirms what "already there" actually is — it may turn out to be the same thing as Option A (an existing but disconnected/stale Pages project, simply needing a redeploy) or something else entirely.

## 7. Backend bridge status (Phase 6 — unchanged, not activated)

Confirmed by re-reading `backend_api/` and `PROJECT_KAI_BACKEND_BRIDGE_DESIGN.md` this pass, no code changed:
- **7 read-only endpoints** exist: `/api/health`, `/api/health/details`, `/api/youtube/channels`, `/api/content/queue`, `/api/agents`, `/api/self-upgrade/proposals`, `/api/system/status`.
- **Authentication**: `Authorization: Bearer <KAI_BRIDGE_API_KEY>` required on every endpoint, checked via `hmac.compare_digest`; the app fails to start at all if the key is unset — no unauthenticated mode exists.
- **Data exposed**: channel IDs, health severities, aggregate queue counts, agent capability counts, self-upgrade proposal status — all already-public-safe, matching what the build-time snapshot already contains.
- **Explicitly never exposed** (verified by the field-allowlist design plus a dedicated sanitization gate, tested): YouTube tokens, API keys, Telegram tokens, any LLM provider keys, broker/trading credentials, filesystem paths (`video_folder` is deliberately stripped from `/api/content/queue`), self-upgrade `files` paths, arbitrary shell/Python execution, unrestricted approval endpoints (no write/approval endpoint exists at all yet).
- **Still read-only.** No `POST` endpoint of any kind exists.
- **Cloudflare Tunnel: NOT created.** `cloudflared` is not installed on this machine (Section 4). `backend_api/README.md` documents the exact steps but none have been executed.
- **The public website does not call this API at all yet.** Command Center still reads only the build-time snapshot — unchanged, per your explicit "keep it snapshot-based" decision earlier this session and the more recent choice to eventually build a real tunnel.
- **The trading dashboard (`KAI_OS/dashboard/app.py`) remains completely separate** — re-confirmed by inspection last pass, not re-touched this pass.

## 8. Target architecture diagram

```
                        INTERNET
                           |
                           v
                     projectkai.dev
                           |
                       CLOUDFLARE
                           |
              +------------+-------------+
              |                          |
              v                          v
        PUBLIC WEBSITE               SECURE API
      Astro (Cloudflare Pages,        (future --
       or Netlify behind CF           NOT built/exposed
       DNS as an interim step)         this pass)
              |                          |
              |                          v
              |                     backend_api/
              |                     (read-only today,
              |                      7 endpoints, tested)
              |                          |
              |                    Cloudflare Tunnel
              |                    (NOT created yet --
              |                     requires your
              |                     cloudflared login)
              |                          |
              v                          v
      sanitized snapshots            KAI OS
      (build-time, unchanged)     (local Windows machine,
                                    never directly exposed)

        TRADING SYSTEM -- fully isolated, no path from
        either the public website or backend_api/ reaches it.
```

## 9. Exact migration steps (once you approve a direction — none executed yet)

**Step 0 (required regardless of which option you pick): verify what's actually in the Cloudflare dashboard.**
1. Log into the Cloudflare dashboard for the account managing `projectkai.dev`.
2. Check **Workers & Pages** — is there a Pages project already connected to this domain? If so: is it Git-connected (to which repo/branch?) or a manual-upload project? When was its last deployment?
3. Check **DNS** — what record currently resolves the apex and `www`? (A record to a Pages/Workers target, CNAME to something else, etc.)

**If Option A (Cloudflare Pages) — after Step 0 confirms either an existing project to reconnect, or that a new one is needed:**
1. If reusing an existing, disconnected project: reconnect it to this repository (or set up a fresh Git integration) and configure the build command (`npm run build`) and output directory (`dist`) — same values already proven in `netlify.toml`.
2. If creating new: `wrangler pages project create`, then either connect Git or `wrangler pages deploy dist` for a first manual deploy — requires `cloudflared`/`wrangler` installed and you completing an interactive login (same category of action already deferred for the backend bridge).
3. Replicate `netlify.toml`'s security headers as Cloudflare Pages `_headers` file or a dashboard-configured Transform Rule — Cloudflare Pages does not read `netlify.toml`.
4. Verify the new Pages deployment serves the current 31-page build correctly (dev/preview URL first, never the production domain directly).
5. Only then: update DNS to point `projectkai.dev` at the verified Pages deployment.

**If Option C (Netlify behind Cloudflare DNS) — faster interim path:**
1. In the Netlify dashboard, add `projectkai.dev` (and `www`) as a custom domain on the `project-kai-ai` site.
2. Note the exact target Netlify provides (usually a `CNAME` to `project-kai-ai.netlify.app` or an apex-compatible record).
3. In Cloudflare DNS, update the existing record(s) to that target — this is the one DNS change this whole plan requires for this path.
4. Verify `projectkai.dev` serves the current site correctly before considering this complete.

**Either path — do not skip:**
- Full regression (Python + router scripts + build) immediately before the switch, matching this session's established pattern.
- A live post-migration verification pass identical to what was done for the Netlify deploy this session (headers, Command Center, mobile, console errors).

## 10. Rollback procedure

- **DNS-only changes (Option C, or Option A once already on Cloudflare)**: revert the DNS record to its prior value. Cloudflare DNS changes propagate quickly and are trivially reversible — the previous origin (whatever serves the stale build today) is not deleted or modified by either migration path, so reverting the DNS record restores exactly today's state.
- **New Cloudflare Pages project (Option A, if created fresh)**: simply stop pointing DNS at it; the old origin is untouched. The new Pages project can be deleted later or left dormant.
- **Netlify**: entirely unaffected by any of this — `project-kai-ai.netlify.app` keeps working as its own independent URL regardless of what `projectkai.dev` points to.
- **No production credentials, no existing hosting, and no DNS records have been touched by this audit** — there is nothing to roll back from this pass itself.

## 11. Security considerations

- Whichever origin is chosen, replicate the same three security headers already proven on Netlify (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) plus `/admin`'s `X-Robots-Tag: noindex, nofollow` — do not launch on `projectkai.dev` with weaker headers than the already-tested Netlify deployment has.
- `/admin` remains Supabase Auth-gated regardless of hosting choice; Supabase itself remains unconfigured (`kai-os-website/.env` absent, confirmed again this pass) — this is independent of the domain migration.
- The backend bridge stays un-exposed through this entire migration — nothing in this plan changes that. Exposing it is a separate, later decision requiring your own `cloudflared` login, exactly as already documented.
- Whatever currently serves the stale `projectkai.dev` content should not be deleted casually — until Step 0 confirms what it is, deleting it could be destroying the only surviving copy of a deployment configuration (e.g., a Pages project's build settings) that would otherwise need to be recreated from scratch.

## 12. What requires your explicit approval

- Which target architecture (A or C) to pursue.
- Any Cloudflare dashboard login/check (Step 0) — this session cannot access your Cloudflare dashboard.
- Any DNS record change.
- Any new Cloudflare Pages project creation.
- `cloudflared`/`wrangler` installation and interactive login, if Option A is chosen.
- The actual cutover moment (switching `projectkai.dev` from its current stale origin to the new one).

## 13. What Claude can automate once a direction is approved

- Building/verifying the Astro output for whichever target (already proven repeatable this session).
- Writing the Cloudflare Pages `_headers` file or Netlify custom-domain configuration file, as applicable.
- Running the full regression/build/secrets-scan sequence before and after cutover.
- Live post-migration verification (headers, routes, console errors, mobile) — the same checklist already used for the Netlify deploy.
- Updating `robots.txt`/`sitemap.xml` if anything about the domain structure changes (it won't, both target options keep `projectkai.dev` as the canonical URL, matching what `Layout.astro` already hardcodes).

## 14. What must NOT be automated

- Cloudflare dashboard login and account-level checks (Step 0) — requires your credentials.
- DNS record changes — explicit, single-action, easy to get right once verified, high-blast-radius if wrong.
- Deleting or disabling whatever currently serves the stale build, until its nature is confirmed.
- Any change to production secrets/credentials.
- The final cutover — should happen only after you've reviewed a working preview/staging URL, never straight to the live domain.

## 15. Verification checklist (for whichever path is approved)

- [ ] Cloudflare dashboard checked — Step 0's 3 questions answered
- [ ] Target origin (Pages or Netlify-via-DNS) serves a preview/non-production URL matching the current 31-page local build exactly
- [ ] Security headers present on the preview URL, matching `netlify.toml`'s current set
- [ ] `robots.txt`/`sitemap.xml` correct on the preview URL
- [ ] Full regression passes immediately before cutover (Python targeted suite, router scripts, `npm run build`, secrets scan)
- [ ] DNS changed
- [ ] `https://projectkai.dev/` serves the new content (re-fetch, don't assume propagation is instant)
- [ ] All 30 real routes return 200 on the real domain (not 404)
- [ ] `/admin` still returns `X-Robots-Tag: noindex, nofollow` and is not indexed
- [ ] 0 console errors on Command Center, `/media`, homepage (live, on the real domain)
- [ ] 0 secrets found in a fresh scan of the deployed output
- [ ] Rollback path re-confirmed working (know the exact DNS revert value before cutover, not after)

## 16. Addendum — Phase 1 dashboard check status, and execution-ready Phase A (Cloudflare Pages) plan

Written this pass in response to your follow-up request to actually prepare (not execute) the Cloudflare Pages deployment. Nothing in this section has been run.

### 16.1 Phase 1 dashboard check — BLOCKED, not completed

You asked me to inspect the Cloudflare dashboard "through the authenticated environment/browser/CLI." I attempted this via the Claude in Chrome extension (which can read pages in your real, already-logged-in browser without me ever seeing or entering credentials). **The extension is not currently connected** — repeated attempts returned "not reachable." Section 4 (this doc) already confirmed no CLI (`wrangler`/`cloudflared`) is installed or authenticated on this machine either. **Questions A–F from your prompt remain genuinely unanswered** — I have not guessed at them anywhere in this document. Two ways to unblock this:
1. Reconnect the Claude in Chrome extension (chrome://extensions, confirm it's enabled and signed into the same account as this session) and tell me to retry, or
2. Check the Cloudflare dashboard yourself (Workers & Pages, and DNS, for `projectkai.dev`) and tell me what you find — the exact 3 questions are in Section 9, Step 0 above.

### 16.2 Local site re-audit (Phase 3) — confirmed this pass, no drift

- `astro.config.mjs`: `defineConfig({})` — static output (Astro's default), no adapter. Cloudflare Pages supports this natively with zero config changes.
- `package.json`: `astro build` → `dist/`, no framework beyond Astro + `@supabase/supabase-js`. No change needed for Cloudflare compatibility.
- `public/`: `favicon.ico`, `favicon.svg`, `og-image.png`, `og-image.svg`, `robots.txt`, `sitemap.xml` — all present, all copy verbatim into `dist/` on build, framework-agnostic.
- **No `public/_headers` or `public/_redirects` exists today** — confirmed this pass. `netlify.toml` is the only place headers are currently defined, and Cloudflare Pages does not read it.
- Clean rebuild this pass: **31/31 pages, 0 errors.**

### 16.3 Security headers — Cloudflare Pages equivalent (Phase 4, designed, not yet added to `public/`)

Cloudflare Pages reads a `_headers` file from the build output root (`dist/_headers`), same syntax family as Netlify's own (Cloudflare adopted a compatible format). The direct translation of `netlify.toml`'s existing rules:

```
/admin/*
  X-Robots-Tag: noindex, nofollow

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

`Permissions-Policy` is a real addition, not in `netlify.toml` today — a reasonable, low-risk baseline (denies three sensor APIs the site never uses) matching what you asked me to consider in Phase 4. **This file has deliberately NOT been created in `public/` yet.** Cloudflare Pages and Netlify both honor the `_headers` filename convention — if I dropped it into `public/` now, the *next* `npm run build` would bundle it into `dist/`, and if that `dist/` were later pushed through the existing, still-live Netlify deploy, it would silently start affecting `project-kai-ai.netlify.app` too (duplicate, functionally-identical header directives — harmless in effect, but a real, unapproved change to the currently-live site's response headers, which your instructions say not to touch). This file is staged as the content above, ready to create in `public/_headers` as literally the first step of Phase 8, once you approve.

### 16.4 Build verification (Phase 5) — re-run fresh this pass

| Check | Result |
|---|---|
| `npm run build` (clean, `dist/` removed first) | **31/31 pages, 0 errors** |
| `node scripts/verify-router.mjs` | **11/11 passed** |
| `node scripts/verify-router-production-test.mjs` | **20/20 passed** |
| Python targeted regression (`backend_api_tests/`, `test_infrastructure_health_check.py`, `test_youtube_gateway.py`, `developer_memory/tests/`) | **118/118 passed** |
| Secrets scan of fresh `dist/` | 0 leaks — the one substring match (`_astro/supabase.*.js`) is the vendored Supabase SDK's own internal field names (`refresh_token` as a JSON key, not a value), same finding as every prior scan this session |
| `localhost` string scan of fresh `dist/` | 2 matches, both previously confirmed benign: Command Center's own honestly-labeled "Reachable at http://localhost:11434" Ollama health-check detail, and the same vendored Supabase SDK's internal GoTrue default-URL constant |

### 16.5 Exact deployment commands (Phase 6) — prepared, NOT executed

**Tooling approach**: `npx wrangler` — no global install, no persistent dependency added to `package.json`, matching your "repository-local/project-safe, don't install unnecessary packages" instruction. `npx` downloads Wrangler on first use into npm's cache, not into this project or your system PATH permanently.

**Step 1 — authenticate (you must do this interactively; I cannot):**
```bash
cd D:\JARVIS_SYSTEM\kai-os-website
npx wrangler login
```
Opens your browser for Cloudflare OAuth consent. Once done, tell me and I can proceed with the remaining steps below (still stopping before DNS, per Phase 6/7).

**Step 2 — determine if a Pages project already exists (answers Phase 1/Phase 2's reuse question the CLI way, if the dashboard check remains blocked):**
```bash
npx wrangler pages project list
```
Read-only. If a project already associated with `projectkai.dev` appears, Phase 2 says reuse it — no new project gets created.

**Step 3a — if reusing an existing project, first deploy (creates a new *preview* deployment, not production traffic, until you point DNS at it):**
```bash
npx wrangler pages deploy dist --project-name=<existing-project-name>
```

**Step 3b — if no suitable project exists, create one, then deploy:**
```bash
npx wrangler pages project create project-kai --production-branch=main
npx wrangler pages deploy dist --project-name=project-kai
```
(`project-kai` is a proposed name, not fixed — happy to use whatever you prefer.)

Either 3a or 3b prints a `*.pages.dev` preview URL. **This is the URL Phase 8's full verification checklist (all 31 routes, Command Center, YouTube channels, headers, mobile, console errors) runs against — never `projectkai.dev` directly, until that preview is confirmed correct.**

**Step 4 — add the `_headers` file for real (only once Step 3 confirms Pages works at all):**
Create `public/_headers` with the content in Section 16.3, rebuild, redeploy (same `wrangler pages deploy dist` command), re-verify headers on the preview URL.

**Step 5 — DNS (the one production-facing step, explicitly gated behind your approval, Phase 7):**
Cloudflare Pages provides an exact CNAME target (shown after Step 3, typically `<project-name>.pages.dev`). The DNS change would be: update the existing `projectkai.dev` DNS record (whatever Step 0/Phase 1 determines it currently is) to that CNAME target. **Not run. Not even fully specified yet — the current record's exact type/value is still unknown pending the Phase 1 dashboard check.**

### 16.6 What's still blocking a complete Phase 7 report

Only one thing: **Phase 1's three dashboard questions (existing Pages project? current DNS record? what's currently live?) remain unanswered**, because dashboard access isn't available from this session right now. Steps 1–2 above (`wrangler login`, `wrangler pages project list`) would answer the "existing project" question via the CLI instead, if you'd rather do that than open the dashboard yourself — your call.
