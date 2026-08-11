# PROJECT KAI — ARCHITECTURE MAP & SECURE BACKEND BRIDGE DESIGN

Written per this sprint's Phase 0 ("produce a concise architecture map before making changes") and Phase 2 ("design a secure architecture"). **Design only below Section 2 — nothing in Phase 3 onward (the actual API server) has been implemented.** See the STOP note at the end for why.

## 1. Real current architecture (verified fresh this pass, not assumed from prior reports)

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│   NETLIFY (public internet)  │         │   KAI_OS (local Windows machine)   │
│   project-kai-ai.netlify.app │         │   D:\JARVIS_SYSTEM\KAI_OS           │
│                               │         │                                    │
│   Astro static site           │         │   - youtube_gateway.py (2-channel  │
│   - Command Center             │         │     registry, fail-closed guards)  │
│   - /media, /status, etc.       │         │   - approve_and_upload.py          │
│   - Supabase (browser→REST,    │         │   - infrastructure_health_check.py │
│     anon key only, DEMO MODE   │         │   - developer_memory/ledger.py     │
│     when unconfigured)          │         │     (append-only, never           │
│                                  │         │      self-approves)               │
└──────────────┬────────────────┘         │   - Windows Scheduled Task         │
               │                            │     (logon-trigger only)          │
               │  ONE-DIRECTIONAL,          │   - Nothing listens on a network   │
               │  BUILD-TIME ONLY           │     port. No live path exists.     │
               │  (human runs a script,     └──────────────┬─────────────────┘
               │   commits JSON, rebuilds)                  │
               └────────────────────────────────────────────┘
     scripts/generate_health_snapshot.py, generate_public_website_data.py
     → sanitized JSON → kai-os-website/src/data/generated/ → Astro import
```

**The only real connection today is build-time and one-directional.** No live HTTP path, webhook, socket, or shared database exists between the two systems. This was independently re-confirmed this pass by re-reading `youtube_gateway.py`, `authorize_youtube.py`, `approve_and_upload.py`, `contentRouter.js`, `infrastructure_health_check.py`, and `generate_health_snapshot.py` in full — all match prior reports exactly, no drift.

## 2. What changed since the last report (real, verified this pass)

- **The Netlify Team Protection wall is gone.** `https://project-kai-ai.netlify.app` now serves the real site (confirmed via live browser navigation — title, content, and Command Center all render correctly). This was a Netlify dashboard setting outside this session's control; it appears to have been resolved on your end since the last check.
- **A stale build was live.** The deployed site predated last session's Command Center YouTube-channels addition. Rebuilt (`npm run build`, 31/31 pages, 0 errors), secrets-scanned (0 leaks, same benign vendored-SDK match as every prior scan), and redeployed (`npx netlify deploy --prod`, already-authenticated CLI linked to your account) per this sprint's explicit Phase 11 instruction. **Production now genuinely matches the local repository.**
- **Verified live on production** (not just locally): security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` site-wide; `X-Robots-Tag: noindex, nofollow` correctly scoped to `/admin` only, absent elsewhere), `robots.txt`, the new YouTube Channels section on Command Center (PRIMARY `NOT AUTHENTICATED` / SECONDARY `VERIFIED`, matching the local health snapshot exactly), `/media` (200 OK), 0 browser console errors, correct mobile layout.

## 3. YouTube upload safety flow (verified, already matches this sprint's Phase 7/8 spec exactly)

Re-read `youtube_gateway.py`, `authorize_youtube.py`, `approve_and_upload.py` line by line this pass. The 10-step flow this sprint asks for already exists, unmodified:
destination resolved from the topic (`_resolve_destination`) → expected channel ID resolved from `YOUTUBE_CHANNELS` (never a display name) → token resolved per-destination (`_token_path_for`, no cross-destination fallback for primary) → live `verify_kai_youtube_channel()` API call → hard fail-closed compare against the expected ID → upload only proceeds after a `VERIFIED` result → `verify_video_status()` confirms the real post-upload state → `set_thumbnail()` re-runs its own independent channel-identity check before touching the video → every mismatch is logged (`KAI_YOUTUBE_CHANNEL_MISMATCH`, channel IDs only, never tokens). Nothing here needed changing.

## 4. Secure backend bridge — design

### 4.1 The real architectural insight: reads and writes have very different risk profiles

Every read-only endpoint this sprint asks for (`/api/health`, `/api/youtube/channels`, `/api/content/queue`, `/api/agents`, `/api/self-upgrade/proposals`, `/api/system/status`) already has a **build-time-generated, sanitized JSON equivalent** (`kai-os-health-snapshot.json`, `kai-os-public-data.json`) produced by scripts that already pass through the forbidden-substring gate. This means a read-only bridge can be built **without ever putting the Windows machine on the public internet**, by pushing those same sanitized snapshots to a small cloud-hosted store on a schedule, rather than tunneling live requests into KAI_OS. Approval writes (`POST /api/approvals/{id}/approve`) are different in kind — they must eventually reach the append-only ledger on your machine, so they either stay human-local (today's model) or require a real authenticated tunnel. This distinction is the main output of this design pass and should drive the hosting decision below.

### 4.2 Target shape (either read path)

```
Netlify (browser)
    │  HTTPS, GET only, no credentials sent
    ▼
Read API  ──────────────────────────────────────────┐
    │  serves the last-pushed sanitized snapshot      │  Write API (approvals only)
    │  + "last_verified" timestamp                    │  HTTPS, authenticated,
    │                                                   │  rate-limited, logged
    ▼                                                   ▼
Cloud store (Netlify Blobs / Supabase table,      Tunnel (Cloudflare Tunnel or
public-read, no write access from browser)         Tailscale Funnel) → KAI_OS
    ▲                                                   │  local process, binds only
    │  pushed on a schedule by                          │  to the tunnel, never a
    │  the existing Windows Scheduled Task              │  raw public port
    │  (already exists, currently logon-trigger only)   ▼
KAI_OS (local, unchanged) ─────────────────────────  developer_memory/ledger.py
  generate_health_snapshot.py already produces        (existing append-only,
  exactly this payload today, manually                 PENDING_HUMAN_APPROVAL-first
                                                          system, unchanged)
```

### 4.3 Non-negotiable requirements (all of Phase 2's list), and how the shape above satisfies each

| Requirement | How it's satisfied |
|---|---|
| HTTPS | Netlify Blobs/Supabase and any tunnel provider (Cloudflare/Tailscale) are HTTPS-only by default |
| Authentication + authorization | Reads: none needed (data is already public-safe, same as today's Command Center). Writes: bearer token or mTLS through the tunnel, checked before the request ever reaches `ledger.py` |
| Never expose tokens/`.env`/OAuth secrets | The push script is the *same* `generate_health_snapshot.py`/`generate_public_website_data.py` already gated by the forbidden-substring check — nothing new to leak |
| Never expose filesystem paths | Same existing sanitization; the write API's error handler must catch and rewrite exceptions (Section 4.4) rather than passing them through |
| Never raw Python exceptions | Write API wraps every handler in a try/except that returns a fixed, generic error shape; full exception detail goes only to a local log file, never the HTTP response |
| No arbitrary command/Python/shell execution | The write API's entire surface is exactly the existing `record_change_proposal`/approve/reject functions in `ledger.py` — no endpoint accepts code, a shell string, or a file path as input |
| No anonymous upload approval / self-upgrade / scheduler control / agent restart | All write endpoints require the authenticated-human-approver check from Section 4.5; the AI/system identity can never satisfy it (see Phase 6) |
| Log all privileged actions | Every write appends to the existing ledger (already append-only, already tested) — the bridge adds no second, unaudited log |
| Fail-closed | Missing/invalid auth, an unreachable tunnel, or any unexpected error returns "unavailable," never a default-allow |
| Rate limiting | Cloudflare (if used for the tunnel) provides this for free at the edge; a Netlify Function read endpoint gets Netlify's own default abuse protection |
| Input validation | Every write endpoint validates `proposal ID` against the real ledger before acting; every read endpoint takes no user input at all (no query parameters that reach the filesystem or a shell) |
| Read/write separation | Structurally two different deployments in the diagram above — the read path has no code path that can reach `ledger.py`'s write functions at all, not just a permission check |

### 4.4 Sanitized response shape (Phase 3's example, unchanged) and error handling

```json
{
  "destination": "primary",
  "channel_id": "UCgEKqjS1eM4Q8KUxloKVNKA",
  "channel_name": "ProjectKAIAI",
  "authentication": "NOT_AUTHENTICATED",
  "last_verified": "2026-08-11T20:59:00Z"
}
```
Never `access_token`, `refresh_token`, `client_secret`, OAuth credentials, token file contents, or environment variables — this is already exactly what `check_youtube_channels()`'s `channels` array contains today (see `test_infrastructure_health_check.py`'s dedicated `test_channels_never_contain_token_or_secret` test). `token_file` (the example in this sprint's prompt) is a filename only, never a path or contents — matches what `youtube_channel_status.py` already prints safely.

### 4.5 Approval architecture (Phase 5), mapped onto the existing ledger

`developer_memory/ledger.py` already has everything Phase 5 asks for structurally: `record_change_proposal()` always starts `PENDING_HUMAN_APPROVAL`; `record_change_outcome()` creates a new linked entry (never mutates the original) with an `entry_id`, timestamp, and resulting state. A future `POST /api/approvals/{id}/approve` would be a thin, authenticated wrapper around `record_change_outcome()` — no new state machine needed, no risk of drifting from the tested ledger semantics. **The KAI system's own process identity must never be a valid value for "approver"** — this needs one explicit new check (reject if approver == a reserved system identity), not present yet because no write endpoint exists yet to need it.

### 4.6 Self-upgrade lifecycle (Phase 6)

`DETECTED → PROPOSED → PENDING_HUMAN_APPROVAL → APPROVED → VALIDATION → TEST → STAGED → DEPLOYED → VERIFIED` (with `FAILED → ROLLBACK_REQUIRED`) is a **superset** of the ledger's current `RISK_LEVELS`/`APPROVAL_STATUSES` (`PENDING_HUMAN_APPROVAL`/`APPROVED`/`REJECTED`/`APPLIED`/`ROLLED_BACK`). Extending the ledger's status enum to the finer-grained lifecycle is a small, safe, additive schema change — but implementing the actual VALIDATION/TEST/STAGED machinery (running tests, staging a deploy) is real new code with real risk if built hastily, and is out of scope until the transport layer (Section 4.2) is decided.

## 5. STOP: the one decision this design cannot make for you

Sections 4.1–4.6 above are safe to build regardless of hosting choice — they're either pure design or additive to code already proven safe. **What genuinely cannot proceed without your input is which transport the write path (and, if you want it, a "truly live" read path instead of the push-snapshot model) uses.** This is exactly the category of decision this sprint's own "CRITICAL OPERATING RULE" says to stop for: it affects authentication, authorization, and production deployment, and it's infrastructure only you can provision (a Cloudflare/Tailscale account, a cloud read-store, ongoing cost, ongoing maintenance). It's also a direct reversal of the explicit "keep it snapshot-based, no bridge" decision you made earlier this session — worth deciding deliberately, not by default. See the question that follows this report.
