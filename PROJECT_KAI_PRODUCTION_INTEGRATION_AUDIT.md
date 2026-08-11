# PROJECT KAI — PRODUCTION INTEGRATION AUDIT

Phase 1 of the Production Integration & Autonomous Command Center Activation sprint. Read-only audit, produced before any code change. Every fact below comes from direct file inspection or a real command/browser check this pass — not from prior reports, which are explicitly not treated as authoritative here.

## Real finding, read first: the production URL is not publicly reachable right now

Navigating to `https://project-kai-ai.netlify.app` this pass returns a **Netlify "Team protection" login wall** (`Team protection | Netlify` — "This site is private. Sign in with an invited Netlify account to view it."), not the actual Project KAI site. This is a **Netlify site/team access-control setting** (Site settings → Access control in the Netlify dashboard), not anything in this repository — `netlify.toml` added last pass contains no auth/access config, and the local build itself is confirmed correct (31/31 pages, verified separately). **Human action required**: in the Netlify dashboard, Site configuration → Access control (or Team settings, depending on plan), disable "Team protection" / visitor restriction, or add the intended public visitors. This session cannot change Netlify dashboard settings.

## Current frontend architecture

- **Astro 7, fully static** (`output` default, no adapter in `astro.config.mjs`). No server-side rendering, no API routes, no Netlify Functions currently exist anywhere in the repo.
- **Build-time data injection pattern**, used consistently across the whole site: Python scripts in `KAI_OS/scripts/` (`generate_public_website_data.py`, `generate_health_snapshot.py`) read real KAI_OS state, sanitize it (a hard-coded forbidden-substring gate blocks paths/secrets/keys from ever being written), and write small JSON files into `kai-os-website/src/data/generated/`. Astro pages `import` these JSON files directly at build time — no runtime fetch, no live connection. This is the same pattern `/status`, `/changelog`, `/knowledge`, and now `/command-center`'s health section all use.
- **Client-side Supabase** (`@supabase/supabase-js`, browser → Supabase REST API directly, authorized by RLS + the public anon key only). No custom backend server exists or is needed for this — by design, confirmed via `src/lib/supabase.js`.
- **No API layer of any kind** exists between the website and the KAI_OS Python backend. `PROJECT_KAI_WEBSITE_IMPROVEMENT_BACKLOG.md` (Backlog — New pages) explicitly confirms: *"API / SDK (Sprint 10) — marked '(future)'; no real API exists yet."* This is a long-standing, deliberate architectural choice, not an oversight.

## Current backend architecture (KAI_OS, Python)

- Real, tested modules: `desktop_operator/operator_command_control/youtube_gateway.py` (destination-aware, fail-closed channel guard covering upload/thumbnail/authorization), `authorize_youtube.py`, `approve_and_upload.py`, `infrastructure_health_check.py` (13 checks, severity + repair_category + recommended_action), `developer_memory/ledger.py` (append-only change-proposal pipeline, never self-approving).
- All of this runs **locally only**, invoked by hand or by the Windows Scheduled Task (`KAI_OS_Content_Production`, logon-triggered). Nothing in KAI_OS listens on a network port for external requests; there is no running server process at all today.
- `sub_agents/`, `ai_router/` are explicitly design-only/skeleton per prior audits this session — not live agent execution.

## Communication paths that actually exist

1. **Build-time, one-directional, KAI_OS → website**: the two `generate_*.py` scripts, run by hand, produce JSON committed into the website's `src/data/generated/`. This is the *only* real communication path between the two systems.
2. **Nothing else.** No live HTTP path, no webhook, no shared database, no message queue. The website and the KAI_OS backend are two genuinely separate systems connected only by a human periodically re-running a generator script and rebuilding/redeploying.

## What is genuinely live

- The deployed static site itself (once Netlify access control is fixed — see finding above).
- Supabase-backed comments/reactions/bookmarks/feature-requests/analytics/admin — **only once Supabase credentials are configured**, currently absent (confirmed by the health monitor's own Supabase check).
- Local-device analytics and local bookmarks (localStorage, genuinely live in any visitor's browser, no backend needed).

## What is local-only / build-time-snapshot only

- Everything YouTube-related shown on the site (channel status, both channels' identity, upload/thumbnail readiness) — accurate as of whenever `generate_health_snapshot.py` was last run, not live.
- Infrastructure health (Ollama, scheduler, disk, queue, etc.) — same build-time snapshot model.
- Self-upgrade proposals — live only in `developer_memory`'s local JSONL ledger on the machine running KAI_OS; not exposed to the website at all today.

## What is missing (relative to this sprint's ask)

- A live backend API/bridge letting the public site read real-time KAI_OS state or submit real approve/reject actions. **Decision this pass (asked and answered): keep the existing snapshot-based model.** No live bridge was built or exposed this pass — see `PROJECT_KAI_PRODUCTION_INTEGRATION_FINAL.md` for the reasoning and what a future bridge would require.
- Authentication for any admin/owner-only view — `/admin` currently gates via Supabase Auth magic-link + an `is_admin()` RPC allowlist (code-complete, untested live since Supabase is unconfigured); Command Center itself has no authentication boundary at all (it's fully public, by design, since it currently shows only aggregate/non-sensitive snapshot data).

## Security boundaries (confirmed, not assumed)

- No OAuth token, Supabase service-role key, or other secret has ever been found in `dist/`, `src/`, or the generated JSON files (repeated secret scans, most recently this session).
- The two `generate_*.py` scripts share one hard-coded forbidden-substring gate (paths, `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, etc.) that refuses to write output containing any of them — a real, tested backstop, not just a convention.
- `/admin` is excluded from search indexing via `robots.txt` and a `noindex` prop; `netlify.toml` (added last pass) reinforces this with an `X-Robots-Tag` HTTP header.

## Recommended integration architecture (documented, not built this pass)

If a live bridge is wanted in the future: a small, separately-hosted, authenticated API (not exposing the local filesystem or Ollama directly) that only ever proxies specific, narrow, already-sanitized operations (e.g., "return the latest health snapshot," "list pending change proposals") — never raw shell/filesystem access. Realistic options: (a) a lightweight FastAPI/Flask service run on the KAI_OS machine behind a secure tunnel (Cloudflare Tunnel, Tailscale Funnel) with token auth, or (b) Netlify Functions calling out to that same tunnel-exposed service. Either requires you to choose and provision hosting/tunnel infrastructure and an auth mechanism — genuinely your call, not something built silently this pass.
