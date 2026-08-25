# PROJECT KAI — PHASE 10: BACKEND BRIDGE ARCHITECTURE AUDIT

Architecture audit only. Nothing was deployed, no DNS was touched, no Cloudflare configuration was changed, no code was written. Every claim below is from direct inspection of the actual files this pass, re-confirmed fresh — not from memory of earlier sessions.

## 1. Current architecture

```
GitHub (drkamrantakbnys-a11y15/kai-os-website, branch master)
    -> Cloudflare Pages (kai-os-website project, Git-connected, auto-deploy)
    -> projectkai.dev / www.projectkai.dev / kai-os-website.pages.dev
```
Static Astro site, `output` default (no adapter), zero server-side code today. Verified live and current as of the last promotion (commit `e814311`+docs).

## 2. Existing backend inventory

All paths relative to `D:\JARVIS_SYSTEM\KAI_OS\`.

| File | Purpose | Current endpoints | Read/Write | Authentication | Dependencies | Port | Security concerns | Test coverage |
|---|---|---|---|---|---|---|---|---|
| `backend_api/app.py` | Flask app, 7 read-only routes wrapping already-tested KAI_OS functions | `GET /api/health`, `/api/health/details`, `/api/youtube/channels`, `/api/content/queue`, `/api/agents`, `/api/self-upgrade/proposals`, `/api/system/status` | **Read-only** — no `POST`/`PUT`/`DELETE` route exists anywhere in the file | Bearer token, enforced in a global `before_request` hook | `flask`, `waitress`, `infrastructure_health_check`, `youtube_gateway.YOUTUBE_CHANNELS`, `developer_memory.ledger.DeveloperMemoryLedger` | `127.0.0.1:8787` (localhost bind only, confirmed in `serve()` call) | **No CORS configuration exists at all** (confirmed by grep — no `flask-cors` import, no `Access-Control-*` header anywhere). A browser `fetch()` from `projectkai.dev` directly to this API would be blocked by the browser's same-origin policy today; this is protective by accident, not by design, and must be handled deliberately in any bridge (Section 15). | 30/30 tests, `backend_api_tests/` (re-run this pass, still passing) |
| `backend_api/auth.py` | Bearer-token check | n/a (library) | n/a | `hmac.compare_digest`-based exact match against `KAI_BRIDGE_API_KEY`; fails closed if the key is unset (app refuses to start) | `core.secrets.get_credential` | n/a | None found — key never logged, never echoed in error responses, constant-time comparison confirmed in source | Covered by `test_auth.py` (7 tests) |
| `backend_api/rate_limit.py` | In-memory sliding-window limiter | n/a (library) | n/a | n/a | stdlib only | n/a | Single-process, in-memory — resets on restart, not distributed. Acceptable for a single-owner bridge behind Cloudflare's own edge rate limiting (see Section 15), not sufficient as the sole control if the bridge were ever run multi-process. | Covered by `test_rate_limit.py` (3 tests) |
| `backend_api/sanitize.py` | Output sanitization gate, reuses `generate_health_snapshot.py`'s forbidden-substring list | n/a (library) | n/a | n/a | `scripts/generate_health_snapshot._FORBIDDEN_SUBSTRINGS` | n/a | None found — blocks on match rather than truncating/redacting (fails closed) | Covered by `test_sanitize.py` (6 tests) |
| `backend_api/README.md` | Setup + Cloudflare Tunnel instructions | n/a (docs) | n/a | n/a | n/a | n/a | Documents `cloudflared tunnel login/create/route dns/run` — **none of these commands have been executed**; no tunnel exists today (confirmed: `cloudflared` absent from this machine, re-confirmed in an earlier turn this session) | n/a |
| `infrastructure_health_check.py` | 13 real health checks (Ollama, env vars, YouTube identity ×2, content queue, stale items, recent errors, disk, scheduled task, Supabase config presence, token gitignore coverage, website build, LLM providers, channel-ID consistency) | n/a (library, called by `backend_api.app` and the build-time snapshot generator) | Read-only by design (docstring: "never modifies production state") | n/a — this module has no auth of its own; auth is the caller's responsibility (`backend_api` or the snapshot generator) | `core.secrets`, `youtube_gateway`, live network calls (Ollama HTTP, 2× YouTube Data API, `schtasks` subprocess) | n/a | None found this pass | Extensive existing suite, re-confirmed passing this session |
| `desktop_operator/operator_command_control/youtube_gateway.py` | Two-channel registry, fail-closed identity verification, upload/thumbnail/read functions | n/a (library) | Both — `schedule_upload`/`set_thumbnail` write to YouTube; `get_channel_info`/`verify_video_status`/`list_playlists` read | OAuth token file per destination (`youtube_primary_token.json`/`youtube_secondary_token.json`), verified against `YOUTUBE_CHANNELS` channel IDs before any write | `google-auth`, `google-api-python-client` | n/a | Channel-identity guard confirmed intact, unmodified this pass | 37+ dedicated tests, re-confirmed this session |
| `developer_memory/ledger.py` | Append-only JSONL ledger; `record_change_proposal()` (always starts `PENDING_HUMAN_APPROVAL`) and `record_change_outcome()` (new linked entry, never mutates the original) | n/a (library — **no HTTP endpoint wraps this today**) | Both — read via `all_entries()`/`by_type()`; write via `record_entry()`/`record_change_proposal()`/`record_change_outcome()` | None at the library level — any caller with filesystem access can call these functions directly; the only real gate today is that nothing public calls this module at all | stdlib only | n/a | `record_change_outcome()` already exists and is exactly the function a future write endpoint should wrap (Section 14) — confirmed still present, unmodified | Existing `developer_memory/tests/`, re-confirmed passing |
| Cloudflare/Tunnel references | `backend_api/README.md` only | — | — | — | — | — | — | — |
| Existing localhost ports | `127.0.0.1:8787` (`backend_api/app.py`) only | — | — | — | — | — | — | — |
| Existing CORS configuration | **None anywhere in the repository** | — | — | — | — | — | — | — |
| Existing environment variables | `KAI_BRIDGE_API_KEY` (in `.env.example` and the real local `.env`, generated last session, never printed) | — | — | — | — | — | — | — |

## 3. Current Command Center data flow (traced from actual code, not assumed)

```
kai-os-website/src/pages/command-center.astro:
  line 5: import kaiOsData from "../data/generated/kai-os-public-data.json";
  line 11: healthSnapshot = (await import("../data/generated/kai-os-health-snapshot.json")).default;
```
Both are **build-time imports**, resolved by Astro/Vite when `astro build` runs — not runtime, not client-side JS. Grepped the entire file for `fetch(`, `XMLHttpRequest`, `axios`, any `/api/` path, any reference to `backend_api` or port `8787`: **zero matches.** Command Center today has no live data path of any kind. The JSON files it imports are produced by `scripts/generate_health_snapshot.py` and `scripts/generate_public_website_data.py`, run manually, on your machine, on no fixed schedule.

**`backend_api` is fully built and tested but is not called by anything in the deployed website today.** It is a parallel, disconnected system.

## 4. Security assessment

- The website's attack surface today is minimal: static HTML/CSS/JS, no server-side code, no secrets in the bundle (confirmed by repeated scans this session).
- `backend_api` is well-built for what it does (auth, rate limiting, sanitization all real and tested) but was designed to be reached through a Cloudflare Tunnel that does not exist yet — it is currently unreachable from the internet by construction (localhost bind only), which is the correct state to be in before Phase 10.
- The single biggest structural gap: **there is no mechanism today by which a public, anonymous browser could call `backend_api` without either (a) the bridge becoming unauthenticated for reads, or (b) a secret being shipped to every visitor's browser.** This is not a bug to fix in `backend_api` itself — it's the reason a gateway layer (Sections 5, 15) is required, not optional.

## 5. Option A evaluation — Cloudflare Tunnel + local backend API directly

```
projectkai.dev (browser) --X--> tunnel-hostname.example.com --> cloudflared --> backend_api (127.0.0.1:8787)
```
- **Security**: Weak for a public read use case. The tunnel hostname becomes a second public origin; anything reaching it still needs the bearer token, which cannot be safely held by anonymous browser JS. Either the read endpoints become unauthenticated (contradicts the existing design) or Command Center can't call them from the browser at all.
- **Complexity**: Lowest of the four — one tunnel, no new Cloudflare product.
- **Cost**: Free (Cloudflare Tunnel is free).
- **CORS**: Would need to be added to `backend_api` itself (new `flask-cors` dependency, new code, new thing to get wrong) since the tunnel hostname and `projectkai.dev` are different origins.
- **Local-machine exposure**: The tunnel hostname is a direct, standing path to the Windows machine's Flask process, reachable by anyone who discovers or guesses the hostname (mitigated only by the bearer token, which — again — can't be given to the browser).
- **Verdict**: Rejected as the sole layer. Useful only as the last hop (site-to-machine), not as the public-facing boundary.

## 6. Option B evaluation — Cloudflare Worker gateway + Tunnel + local backend

```
projectkai.dev (browser) --> Worker (validates, holds secrets) --> Tunnel --> backend_api
```
- **Security**: Strong. The Worker is the only thing that ever sees `KAI_BRIDGE_API_KEY` (stored as a Worker secret, never shipped to the browser); the tunnel hostname can itself be locked down (Cloudflare Access Service Tokens, Section 15) so only the Worker can reach it, not the open internet.
- **Complexity**: Medium — a new Worker project to write, test, and deploy, separate from the Pages project.
- **Cost**: Free tier covers this comfortably (Workers free tier: 100k requests/day).
- **CORS**: Solved cleanly — the Worker can set `Access-Control-Allow-Origin: https://projectkai.dev` explicitly, or (better) be same-origin via a route binding.
- **Local-machine exposure**: Tunnel hostname only reachable by the Worker (Access Service Token), not the public internet.
- **Verdict**: Strong option, but introduces a second deployable (Worker) alongside the existing Pages project when the same effect can be had with less new infrastructure (Option D).

## 7. Option C evaluation — Worker/API layer + hosted backend service + KAI OS local system

```
projectkai.dev --> Worker --> hosted backend service (cloud VM/container) --> ??? --> KAI OS (local)
```
- **Security**: The weak point moves, it doesn't disappear — now the *hosted service* needs its own secure connection back to the local KAI OS machine, which is the same unsolved problem one layer removed (unless the hosted service only reads a periodically-pushed snapshot, which is the "push-based, no tunnel" architecture you explicitly moved away from earlier this session in favor of a real tunnel).
- **Complexity**: Highest of the four — a new hosting account, a new deployment pipeline, a new always-on cloud cost, plus everything Option B already requires.
- **Cost**: Real, ongoing (a VM/container doesn't have Workers' generous free tier).
- **Maintenance**: Two systems to patch/monitor instead of one.
- **Suitability for KAI OS**: Poor fit — KAI OS's real state (health, YouTube identity, queue, ledger) lives and changes on your Windows machine; duplicating a service elsewhere just to read it back is redundant infrastructure for no security benefit over Option B/D.
- **Verdict**: Rejected — strictly more complex and costly than B/D with no corresponding security gain, and reintroduces the tradeoff you already decided against.

## 8. Option D evaluation — Cloudflare Pages Functions + local backend through secure tunnel

```
projectkai.dev/api/* (Pages Function, same project/domain as the site) --> Tunnel --> backend_api (127.0.0.1:8787)
```
- **Security**: Equivalent to Option B (Pages Functions run on the same Workers runtime — a Pages Function *is* a scoped Worker). Secrets (`KAI_BRIDGE_API_KEY`) stored as a Pages environment variable/secret, never shipped to the browser.
- **Complexity**: **Lowest of the three viable options.** No new Cloudflare project — it's an addition to the `kai-os-website` Pages project you already have, already Git-connected, already deploying on every `master` push.
- **CORS**: **Eliminated entirely** — `/api/*` on `projectkai.dev` is same-origin with the page calling it. No CORS configuration needed anywhere.
- **Cost**: Free tier (Pages Functions share Workers' free-tier limits).
- **Local-machine exposure**: Same as B — tunnel hostname locked to Access Service Tokens, reachable only by the Pages Function.
- **Maintenance**: One project, one deploy pipeline, one place to look for logs — directly reuses the deployment pattern you just finished verifying end-to-end (Git push → Cloudflare build → live).
- **Future scalability**: Pages Functions scale the same way Workers do; nothing about this choice caps future growth.
- **Verdict**: **Recommended.**

## 9. Recommended architecture

**Option D (Cloudflare Pages Functions as the API gateway) + Cloudflare Tunnel (Function → local `backend_api`) + Cloudflare Access Service Tokens gating the tunnel hostname + the existing Supabase Auth `/admin` identity as the human-approval gate for writes.**

```
                          INTERNET (any visitor)
                                 |
                                 v
                          projectkai.dev
                                 |
                    Cloudflare Pages (kai-os-website)
                    /                              \
      static pages (unchanged)          /api/* -- Pages Functions (NEW)
      served exactly as today            |  holds KAI_BRIDGE_API_KEY + Access
                                          |  Service Token as Pages secrets
                                          |  (never sent to the browser)
                                          v
                              Cloudflare Access (Service Token check)
                                          |
                                 Cloudflare Tunnel (NEW --
                                 cloudflared on the KAI OS machine,
                                 outbound-only connection)
                                          |
                                          v
                                backend_api (Flask, 127.0.0.1:8787,
                                unchanged -- still requires its own
                                KAI_BRIDGE_API_KEY bearer token, now
                                presented by the Pages Function, never
                                by the browser)
                                          |
                                          v
                        KAI OS (infrastructure_health_check,
                        youtube_gateway, developer_memory.ledger)

        TRADING SYSTEM -- unreachable from any of the above,
        unchanged, not connected during this phase.
```

## 10. Why it was selected

- Reuses infrastructure you've already provisioned and verified working this session (the Pages project, its Git-triggered deploy pipeline, the Supabase `/admin` auth pattern) rather than standing up a parallel Worker project or a hosted service.
- Solves the one real structural problem (Section 4) cleanly: the browser never holds any secret; the Pages Function is the only thing that ever presents `KAI_BRIDGE_API_KEY` or the Access Service Token.
- Keeps `backend_api` itself completely unchanged — its bearer-token/rate-limit/sanitize design was already correct for "a trusted caller reaches this," it just never had a trusted caller. This design gives it one, without weakening anything it already does.
- Matches your explicit "avoid overengineering" instruction (Section 15 explains exactly which Cloudflare products are and aren't needed).

## 11. Authentication model

| Layer | Who authenticates | To what | Mechanism |
|---|---|---|---|
| Browser → Pages Function | Nobody (public) for reads; Supabase session for writes | `/api/*` on `projectkai.dev` | Reads: none required (data is already public-safe, matching Command Center's existing public design). Writes: Supabase Auth session cookie, same magic-link + `is_admin()` allowlist already gating `/admin` today. |
| Pages Function → Tunnel | The Function itself | Cloudflare Access | Cloudflare Access **Service Token** (a client-ID/client-secret pair issued by Access, stored as Pages secrets) — this is the standard Cloudflare-recommended way for a service (not a human) to authenticate through Access. |
| Function (via Tunnel) → `backend_api` | The Function itself | `backend_api`'s existing bearer-token check | The already-built `KAI_BRIDGE_API_KEY`, stored as a Pages secret, sent as `Authorization: Bearer ...` exactly as `backend_api` already expects — **zero code changes required in `backend_api` itself.** |

## 12. Authorization model

- **Reads** (`GET /api/health`, `/api/youtube/channels`, etc.): authorized for anyone — the data is already the same sanitized information Command Center displays today via the snapshot. No new disclosure.
- **Writes** (approve/reject a self-upgrade proposal): authorized only for a session where Supabase's `is_admin()` RPC returns true **and** the Pages Function's own Access Service Token succeeds **and** `backend_api`'s bearer token succeeds. Three independent layers must all agree; any one failing blocks the action. This directly satisfies Step 4's requirement that writes be substantially more protected than reads — reads need zero of these three checks, writes need all three.

## 13. Read API design

All 7 endpoints already exist in `backend_api/app.py`; the Pages Function layer is a thin, transparent proxy — it does not reinvent them.

| Method | Path (Function, same-origin) | Proxies to | Purpose | Auth required | Read/Write | Response | Errors | Rate limit | Audit |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/health` | `backend_api` `/api/health` | Summary severity counts | None (public) | Read | `{summary, total_checks, last_verified}` | 502 if backend unreachable (Section 17) | Cloudflare edge default + `backend_api`'s existing 60/min | Function logs request; `backend_api` already logs to `logs/backend_api.log` |
| GET | `/api/health/details` | same | Full check list | None | Read | `{checks[], last_verified}` | same | same | same |
| GET | `/api/youtube/channels` | same | PRIMARY/SECONDARY status | None | Read | `{channels[], last_verified}` | same | same | same |
| GET | `/api/content/queue` | same | Queue counts | None | Read | `{queued, completed, status_breakdown}` | same | same | same |
| GET | `/api/agents` | same | Agent capability counts | None | Read | `{agents}` | same | same | same |
| GET | `/api/self-upgrade/proposals` | same | Proposal list + status | None | Read | `{proposals[], count}` | same | same | same |
| GET | `/api/system/status` | same | Combined overview | None | Read | `{health_summary, youtube_channels_ok, pending_self_upgrade_proposals, last_verified}` | same | same | same |

## 14. Write API design (proposed only — not implemented, not to be implemented this phase)

| Method | Path | Purpose | Auth required | Read/Write | Request body | Response | Errors | Rate limit | Audit requirement |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/approvals/:id/approve` | Approve a pending self-upgrade proposal | Supabase admin session **+** Access Service Token **+** bearer token (all three) | Write | `{"reason": "optional free-text"}` | `{"entry_id", "approval_status": "APPROVED", "recorded_at"}` | 401 (no admin session), 403 (Access/bearer failure), 404 (unknown `:id`), 409 (already resolved — see idempotency below), 500 (generic, sanitized) | Stricter than reads — proposed: 10/min per admin session, enforced in the Function | Every call, success or failure, appended to `developer_memory`'s existing ledger via `record_change_outcome()` — never a second, separate audit log |
| POST | `/api/approvals/:id/reject` | Reject a pending self-upgrade proposal | same as approve | Write | `{"reason": "required free-text — why"}` | `{"entry_id", "approval_status": "REJECTED", "recorded_at"}` | same | same | same |

**Idempotency**: before calling `record_change_outcome()`, the handler must check the proposal's *current* resolved status (the same resolution logic `GET /api/self-upgrade/proposals` already implements) — if already `APPROVED`/`REJECTED`/`APPLIED`/`ROLLED_BACK`, return 409 with the existing outcome rather than appending a duplicate ledger entry. This mirrors the exact idempotency pattern already used in `approve_and_upload.py` for YouTube upload resumption.

**The AI itself must never be a valid caller of these two endpoints** — enforced by requiring a real Supabase admin session, which only a human logging in via magic link can produce.

## 15. Cloudflare architecture — necessary vs. unnecessary components

| Component | Necessary? | Why |
|---|---|---|
| **Cloudflare Tunnel** | **Necessary** | The only way to reach the local machine without opening a port or exposing a raw public IP. Non-negotiable per your own absolute rules. |
| **Cloudflare Pages Functions** | **Necessary** | The gateway layer that lets the browser call `/api/*` same-origin without ever holding a secret (Section 8). |
| **Cloudflare Access, Service Tokens only** | **Necessary** | Locks the tunnel hostname so only the Pages Function (holding the service token) can reach it — without this, the tunnel hostname is a bare, discoverable path to the Flask app protected by nothing but `backend_api`'s own bearer token. |
| **Cloudflare Access, full login-wall/identity policies** | **Unnecessary** | Would require every visitor (or admin) to authenticate through Access itself — redundant with Supabase Auth, which already exists and already gates `/admin`. Do not add a second identity system. |
| **A standalone Cloudflare Worker** | **Unnecessary** | Pages Functions already provide the same runtime; a separate Worker would be a second deployable doing the same job (Section 6 vs. 8). |
| **JWT validation (custom)** | **Unnecessary** | Supabase Auth's own session token already serves this role for the write path; inventing a second JWT scheme adds complexity with no benefit. |
| **CORS configuration** | **Unnecessary** | Eliminated by same-origin design (Section 8) — do not add `flask-cors` to `backend_api`, and do not add CORS headers in the Pages Function; there should be no cross-origin call anywhere in this design. |
| **Cloudflare Rate Limiting rules (edge)** | **Optional, recommended, not urgent** | Cloudflare's own edge rate limiting is a free/low-cost defense-in-depth layer on top of `backend_api`'s existing in-process limiter; worth enabling when the bridge goes live, not a blocker for the design itself. |
| **Cloudflare WAF (managed rules)** | **Optional** | Reasonable baseline hardening for any public endpoint; not specific to this bridge's threat model, low priority relative to the auth layers above. |

## 16. Failure handling

Every scenario below must degrade to the **existing, already-built snapshot fallback** — Command Center's current build-time JSON — never to an error page, a stack trace, or a hang.

| Scenario | Behavior |
|---|---|
| KAI OS machine offline | Tunnel connection drops; Pages Function's request to the tunnel hostname times out (bounded timeout, e.g. 5s) → Function returns `{"status": "SNAPSHOT", "reason": "live backend unreachable"}` with the last build-time snapshot values, not a 5xx to the browser. |
| Ollama offline | `backend_api`'s own `check_ollama()` already reports this as a normal RED result (not a crash) — surfaces through the API exactly as it does in the snapshot today. No special handling needed at the gateway. |
| `backend_api` process offline (but tunnel/machine up) | Tunnel connects but gets connection-refused on `127.0.0.1:8787` → same timeout/fallback path as "machine offline." |
| Cloudflare Tunnel offline | Function's request to the tunnel hostname fails at the Cloudflare edge (502/524) → same fallback. |
| YouTube API unavailable | Already handled inside `youtube_gateway`/`infrastructure_health_check` — surfaces as a normal RED/`CHANNEL_IDENTITY_UNAVAILABLE` result, not a crash. |
| Access Service Token expired/invalid | Access itself rejects the request before it reaches the tunnel (403) → Function treats this identically to "backend unreachable" for the read path; for the write path, surfaces as a clear "bridge unavailable, action not performed" — never silently retried. |
| Authentication fails (bearer, Access, or Supabase) | Fails closed at whichever layer caught it; generic error to the browser, full detail only in that layer's own log (Function logs, `backend_api.log`, or Supabase's own auth logs) — never a stack trace or path in the response body. |
| Backend times out | Bounded timeout (proposed 5s for reads, matching a UI's "give up and show snapshot" expectation) enforced in the Pages Function, not left to the browser's own default (which could hang far longer). |
| Malformed request | Standard 400 from the Function or `backend_api`, generic message, never reflecting the malformed input back verbatim (avoids reflected-content issues). |
| Write request repeated | Idempotency check (Section 14) returns 409 with the existing outcome — never a duplicate ledger entry. |
| Approval request replayed | Same idempotency check; a replayed identical request against an already-resolved proposal is a no-op, reported as such. |

**The public website must never expose internal stack traces, filesystem paths, secrets, or localhost addresses** — already true of `backend_api` (Section 2, confirmed via `sanitize.py` and the generic 500 handler) and must be equally true of the new Pages Function layer (its own error handler must never forward a raw exception).

## 17. Secret management

| Secret | Where it lives | Who/what can read it |
|---|---|---|
| `KAI_BRIDGE_API_KEY` | Local `KAI_OS/.env` (existing, already generated, never printed) **and** as a Cloudflare Pages environment secret (new — added via the Pages dashboard, not committed to the repo) | `backend_api` process (reads its own copy) and the Pages Function (reads the Pages-secret copy) — never the browser |
| Cloudflare Access Service Token (client ID + secret) | Issued by Cloudflare Access when the Access policy is created; stored as a Pages environment secret | Only the Pages Function |
| Supabase session token | Supabase's own cookie/session mechanism, already in production use for `/admin` | Browser holds it (as it already does today for `/admin`), validated server-side by Supabase, not by this bridge directly |

No new secret type is introduced beyond what Cloudflare Access itself issues; everything else reuses credentials that already exist.

## 18. Audit logging

- **Reads**: `backend_api`'s existing per-request log (`logs/backend_api.log`) already records method/path/client/outcome for every call — unchanged, sufficient for a read-only surface.
- **Writes**: every approve/reject call must be recorded in `developer_memory`'s existing append-only ledger via `record_change_outcome()` — this **is** the audit trail, not a separate system. The ledger already captures who/what/when/result by construction (Section 14). Additionally, the Pages Function should log (to Cloudflare's own request logs) the Supabase admin identity that initiated the call, for a second, independent record outside the ledger itself.

## 19. Rollback strategy

- **Any stage of this design can be un-deployed independently**: the Pages Function is just an addition to the existing Pages project (removable via a single commit reverting `functions/api/*`); the Tunnel can be stopped (`cloudflared` process killed) without touching DNS or the website; Access policies can be deleted from the dashboard without affecting anything else.
- **The website's existing snapshot-based rendering must remain the fallback path forever**, not just during rollout — this is what makes every failure mode in Section 16 safe, and what makes rollback trivial: turning the bridge off simply means Command Center behaves exactly as it does today.
- **No destructive step exists anywhere in this design** — nothing about it requires modifying, replacing, or deleting the current build-time snapshot generation, which stays exactly as-is.

## 20. Implementation phases (proposed, not started)

1. **Phase 11a**: Install and authenticate `cloudflared` on the KAI OS machine (your interactive action — already documented in `backend_api/README.md`). Create the tunnel, but do not yet route it to a public hostname — verify it connects.
2. **Phase 11b**: Create a Cloudflare Access application scoped to the tunnel hostname, Service Tokens only (no login-wall policy). Generate the Service Token, store it — not printed to chat.
3. **Phase 11c**: Add a single Pages Function (`functions/api/health.js` or similar, one file per read endpoint or one catch-all proxy) that reads its two secrets (bearer key, Access Service Token) from Pages environment variables and proxies `GET` requests to the tunnel hostname → `backend_api`. Deploy via the same Git-push pipeline already in use; verify on a preview deployment first (same pattern as the last two production promotions).
4. **Phase 11d**: Wire Command Center's frontend to call `/api/system/status` (and friends) client-side, with the existing snapshot as the fallback if the call fails (Section 16) — display LIVE/SNAPSHOT/OFFLINE state explicitly, never silently pretend snapshot data is live.
5. **Phase 12 (separate, later approval)**: Only after 11a–d are live and verified for at least one real observation period, design and implement the write endpoints (Section 14) with the full three-layer auth model, gated behind its own explicit human approval — not bundled into Phase 11.

## 21. Human approvals required

- Installing and authenticating `cloudflared` (interactive login).
- Creating the Cloudflare Access application and Service Token (dashboard action).
- Adding two new secrets to the Cloudflare Pages project's environment variables (dashboard action, or CLI with your credentials).
- Explicit go-ahead for Phase 11a–d before any of it is implemented — this report is the design, not the implementation.
- A **separate**, later explicit go-ahead before Phase 12 (write endpoints) — the higher-risk half of this system, deliberately not bundled with the read-only rollout.

## 22. Exact commands that would eventually be required (documentation only — not run this pass)

```bash
# 11a -- tunnel setup (you run this interactively)
cd D:\JARVIS_SYSTEM\KAI_OS
npx wrangler login          # if not already authenticated (it is, from the last session)
# cloudflared must be installed separately -- see backend_api/README.md Section 2, Step 1-2
cloudflared tunnel login
cloudflared tunnel create kai-backend-bridge
# (no public DNS route yet -- Phase 11a stops at "tunnel connects")

# 11b -- Access Service Token (dashboard action, not CLI)
# Cloudflare dashboard -> Zero Trust -> Access -> Service Auth -> Create Service Token

# 11c -- Pages Function secrets (dashboard action, or:)
npx wrangler pages secret put KAI_BRIDGE_API_KEY --project-name=kai-os-website
npx wrangler pages secret put CF_ACCESS_SERVICE_TOKEN_ID --project-name=kai-os-website
npx wrangler pages secret put CF_ACCESS_SERVICE_TOKEN_SECRET --project-name=kai-os-website
```
