# Project KAI — Public Data Map

Companion to `PROJECT_KAI_REAL_COMPANY_ARCHITECTURE_AUDIT.md`. This maps *specific real files* in `KAI_OS` to *specific possible website features*, and marks what's safe to expose as-is, what needs a sanitize step first, and what must never leave `KAI_OS`.

## Architecture: read-only observer, one direction

```
KAI_OS (private repo, real production data)
   |
   v
Sanitized public projection (new, small, generated — NOT a copy of internal files)
   |
   v
JSON checked into kai-os-website OR generated at build time
   |
   v
Astro static site
   |
   v
Public pages
```

The website must never read `KAI_OS` files directly at request time, and must never write back to `KAI_OS`. The only safe direction is a **build-time or scheduled export step** that reads `KAI_OS`, strips anything private, and writes a small public JSON file into `kai-os-website/src/data/`. This matches the existing pattern (`src/data/agents.js` is already exactly this — a hand-curated public projection of `sub_agents/agents.py`, not a live read of it).

## Safe to expose as-is (public-safe, no sanitization needed)

| Real source | What it contains | Website use |
|---|---|---|
| `content_pipeline/topic_queue.json` (`queue`/`completed` arrays) | Topic titles, status (`queued`/`produced_awaiting_review`), theme track — no personal data, no secrets | Real production-count stats: "N videos produced," "N in the queue" — already partially used for the "13 agents" style claims |
| `content_pipeline/pipeline_metrics.jsonl` | Aggregate KPIs per run: repair counts, compliance pass rate, scene counts, trend flags | A future `/status` or `/activity` page's real metrics section |
| `visual_reuse_report.json` / `.md` (per video) | Scene count, provider used, dedup decisions | Illustrative example of the compliance/dedup system on `/how-it-works` — already the pattern `HowKaiWorks.astro` uses |
| `compliance_report.json` (per video) | Pass/fail status per check category, no script text | Real evidence for the "every video is checked" claim — status only, never the underlying script |
| `asset_ledger.jsonl` (`provider`, `license_url`, `photographer`, `cost_usd`, `source_page`) | Real licensing attribution — already designed to be safe (no API keys, no file-system paths beyond a relative structure) | A future "how we source visuals" transparency note; do not expose `output_path` (contains full local Windows paths) |
| `git log` on either repo | Commit dates, messages | `/changelog` if built — real dates already used for `AGENTS_LAST_UPDATED` |
| `sub_agents/agents.py` (structure only, not the `NotImplementedError` internals) | 13 class names + docstrings | Already the `src/data/agents.js` source of truth — no change needed |
| Test file counts (`find . -iname "test_*.py" | wc -l`) | A count, not test content | Safe as a rounded, dated claim only (see Architecture Audit's note on staleness) |

## Needs a sanitize step before any exposure

| Real source | Why it's not safe as-is | What a safe projection would look like |
|---|---|---|
| `developer_memory/` ledger entries | Some entries reference internal file paths, and a few discuss real defects in enough technical detail to double as an attack map of the validation logic (e.g. exact tokenization gaps in `compliance_gateway.py`) | A hand-picked, rewritten subset for a "Lessons Learned" blog series — never the raw ledger |
| `knowledge_brain`'s report index | It indexes *every* root and per-video report, including ones never meant to be public (raw internal audits, cost breakdowns) | Scope the public index to an explicit allowlist of report types, not "everything in the repo" |
| `asset_ledger.jsonl`'s `output_path` field | Full local Windows file paths (`D:\JARVIS_SYSTEM\...`) | Strip this field entirely in the projection; keep `provider`/`license_url`/`photographer`/`cost_usd` |
| `desktop_operator/`'s live approval/risk state | Could reveal exactly how the kill-switch and risk evaluator are tuned, which is a legitimate thing to keep private even though the *architecture* is fine to describe | Publish the architecture description only (already partially true of how Trust page discusses "review, approval, rollback") — never live evaluator state |
| Per-video `script.json` (raw narration text) | It's unpublished content — publishing the script before the video goes live would be a real content leak, independent of any security concern | Never expose; only expose post-publish, and even then only if explicitly desired |

## Must never leave KAI_OS under any circumstance

- Any `.env` file or its values
- `YOUTUBE_API_KEY` and any other provider API key (Pexels, Jamendo, edge-tts config, OAuth tokens) — **note: memory from earlier in this engagement flags `YOUTUBE_API_KEY` as previously exposed and still pending rotation; this is unrelated to the website but worth resurfacing since this audit touches the same credential surface**
- Telegram bot tokens (`_notify()` in `produce_next_video.py` and `collect_analytics.py` sends real Telegram pushes)
- Any full local filesystem path beyond what's already safely embedded in already-public strings
- Kamran's personal contact information, unless and until explicitly approved for the Contact page (per the standing rule already established this session)
- Raw `desktop_operator` approval/audit logs

## Verified: no secrets currently in the website's build output

A previous sprint's audit already checked `dist/` for exposed credentials (Priority A: "Verify all production credentials — no secrets printed"). This data map doesn't repeat that check since nothing about the current website's data sources changed since that audit — but **any new export step built under this directive must re-run that check before its first real deploy**, since it introduces a genuinely new data path (`KAI_OS` → website) that didn't exist before.

## What this means for Phase 16 (Live Data Architecture)

Static, build-time-generated JSON is sufficient for everything in the "safe as-is" table above. Nothing in this audit found a case that actually requires a live backend/API — every real data source is either a file already on disk or a value derivable from `git log`. Recommend: no new backend, no new database, an export script (new, small) that runs at deploy time and writes to `src/data/`, matching the existing `agents.js` pattern exactly.
