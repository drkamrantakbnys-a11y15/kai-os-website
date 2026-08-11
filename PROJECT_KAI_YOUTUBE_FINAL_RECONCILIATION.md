# PROJECT KAI — YOUTUBE FINAL RECONCILIATION

Fresh, read-only reconciliation (Part 7 of the Two-Channel YouTube Safety sprint). Every field below is from a live API call or a live file check made this pass, via the new destination-aware `verify_kai_youtube_channel()`/`verify_video_status()` — not carried over from a prior report. No video was deleted, reuploaded, rescheduled, or modified while producing this document.

## Live channel identity check (both destinations, this pass)

| Destination | Expected channel ID | Result |
|---|---|---|
| primary | `UCgEKqjS1eM4Q8KUxloKVNKA` (ProjectKAIAI) | `CHANNEL_IDENTITY_UNAVAILABLE` — `YOUTUBE_NOT_CONFIGURED` (no `youtube_primary_token.json` exists yet) |
| secondary | `UC75pRQ4fzmpNDXUSaI9BNKQ` (Project Kai AI Lessons) | `VERIFIED` — actual channel returned: `Project Kai AI Lessons`, id `UC75pRQ4fzmpNDXUSaI9BNKQ` |

## Per-topic reconciliation

| Topic ID | Local asset | Video ID | Current channel ID | Current channel name | Privacy | Scheduled publish | Processing | Intended channel | Migration status | Required action | Risk | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PK-001 | **Missing** — `video_folder` does not exist on disk | *(none)* | — | — | — | — | — | Undetermined (never produced) | **MISSING** | Correct the queue record's `status` (currently `produced_and_uploaded`, which is factually wrong) once a human confirms nothing is recoverable | None — nothing exists to leak or duplicate | Fix bookkeeping only; not a migration case |
| PK-002 | Present | `obhd7xAbk7o` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | **public** (live) | — | processed | Historically primary (queued before the two-token split existed) | **REVIEW REQUIRED** | Human decision: keep on secondary, or reupload to primary and decide fate of this copy | Low (already public, stable) | Keep — content reads as tutorial/lesson-style, fits secondary's actual purpose |
| PK-003 | Present | `KHuoBhn28Wc` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | **public** (live) | — | processed | Historically primary | **REVIEW REQUIRED** | Same as PK-002 | Low | Keep |
| PK-004 | Present | `BkKZEoSWjjw` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | **public** (live) | — | processed | Historically primary | **REVIEW REQUIRED** | Same as PK-002 | Low | Keep |
| PK-005 | Present | `FH9W5_pjXcU` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | **public** (live) | — | processed | Historically primary | **REVIEW REQUIRED** | Same as PK-002 | Low | Keep |
| PK-006 | Present | `2NC_OcSnt1M` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | **private** | `2026-08-12T09:30:00Z` — **~18 hours from this check** | processed | Historically primary | **URGENT — REVIEW REQUIRED** | Human decision needed before auto-publish; no code path in this repo can unschedule it | **Time-sensitive** — auto-goes-public via YouTube itself, no pipeline code involved | See "PK-006" section below |
| PK-007 | Present | `y0kaPPXIddo` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-08-15T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet — time to decide | None currently | Revisit once PK-006 decided (same pattern) |
| PK-008 | Present | `UdiSCgfcvLk` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-08-19T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet | None currently | Revisit |
| PK-009 | Present | `uSW5tFI76u4` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-08-22T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet | None currently | Revisit |
| PK-010 | Present | `FHI5GHMMskU` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-08-26T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet | None currently | Revisit |
| PK-011 | Present | `ZFRoSp-Zhug` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-08-29T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet | None currently | Revisit |
| PK-012 | Present | `UYqR_I4z2X8` | `UC75pRQ4fzmpNDXUSaI9BNKQ` | Project Kai AI Lessons | private | `2026-09-02T09:30:00Z` | processed | Historically primary | DO NOT TOUCH | None yet | None currently | Revisit |

**None of PK-001 through PK-012 have a `destination_channel` field recorded** — they predate this sprint's explicit destination model. Going forward, every new topic queued for production should have `destination_channel: "primary"` or `"secondary"` set explicitly at queueing time (see `approve_and_upload.py`'s `_resolve_destination()`), so this ambiguity doesn't recur for PK-013 onward.

## PK-006 — the time-sensitive one, re-confirmed this pass

Still private, still scheduled for `2026-08-12T09:30:00Z`, now roughly **18 hours** away as of this check (2026-08-11, ~15:38 local). Nothing changed since the prior report. Three options remain, none decided here:

- **Keep on secondary** (default outcome if no action taken) — consistent with treating PK-002–006 as legitimately secondary-channel content.
- **Reupload to primary once authorized, leave secondary copy in place** — duplicates content across channels.
- **Reupload to primary, then remove/unlist the secondary copy** — cleanest but destroys the secondary copy's accumulating stats; deletion is outside this session's authority without direct authorization.

No code in this repository can cancel or reschedule PK-006's `publishAt` — that would require the YouTube read/write scope (broader than what's currently authorized) and is not something this session implements or executes without explicit instruction. If you want to change its outcome before it auto-publishes, the only path is directly in YouTube Studio, done by you.

## What this session did

Only read operations: two live `verify_kai_youtube_channel()` calls (primary, secondary) and eleven live `verify_video_status()` calls. No upload, delete, reschedule, or metadata change on any of PK-001–012.
