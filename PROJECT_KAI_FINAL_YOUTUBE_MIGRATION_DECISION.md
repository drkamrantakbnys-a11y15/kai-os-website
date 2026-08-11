# PROJECT KAI — FINAL YOUTUBE MIGRATION DECISION

Phase 3 of the Final Infrastructure Activation & Production Test Sprint. Read-only. No video was deleted, reuploaded, rescheduled, or modified while producing this document. Every row below is a fresh live read taken this pass (`verify_video_status()` for the two boundary cases; `topic_queue.json` + local filesystem for the rest), not carried over from memory.

## Governing fact (unchanged from every prior report)

`youtube_gateway.py`'s internal channel key `"project_kai"` currently resolves, in practice, to the **secondary** real YouTube channel — `UC75pRQ4fzmpNDXUSaI9BNKQ`, "Project Kai AI Lessons" — because that is the channel the active OAuth token authenticates as. The **primary** channel, `UCgEKqjS1eM4Q8KUxloKVNKA` ("ProjectKAIAI"), has never received an upload from this pipeline. This is not a per-video misconfiguration; every one of PK-002 through PK-012 was uploaded under the same token, so all eleven are consistently on the wrong channel for the same single reason.

## Per-video state (fresh live pull this pass)

| Topic | YouTube ID | Real channel | Privacy | Publish/scheduled | Local asset | Classification |
|---|---|---|---|---|---|---|
| PK-001 | *(none)* | — | — | — | **Missing** (`video_folder` does not exist on disk) | **MISSING** |
| PK-002 | `obhd7xAbk7o` | Secondary | **public** (live now) | published 2026-07-28 | Present | **REVIEW REQUIRED** |
| PK-003 | `KHuoBhn28Wc` | Secondary | public (live now) | published 2026-08-01 | Present | **REVIEW REQUIRED** |
| PK-004 | `BkKZEoSWjjw` | Secondary | public (live now) | published 2026-07-29 | Present | **REVIEW REQUIRED** |
| PK-005 | `FH9W5_pjXcU` | Secondary | public (live now) | published 2026-08-05 | Present | **REVIEW REQUIRED** |
| PK-006 | `2NC_OcSnt1M` | Secondary | **private** | **auto-publishes 2026-08-12T09:30:00Z — under 19 hours from now** | Present | **URGENT — REVIEW REQUIRED** |
| PK-007 | `y0kaPPXIddo` | Secondary | private | scheduled 2026-08-15 | Present | DO NOT TOUCH (time to decide) |
| PK-008 | `UdiSCgfcvLk` | Secondary | private | scheduled 2026-08-19 | Present | DO NOT TOUCH |
| PK-009 | `uSW5tFI76u4` | Secondary | private | scheduled 2026-08-22 | Present | DO NOT TOUCH |
| PK-010 | `FHI5GHMMskU` | Secondary | private | scheduled 2026-08-26 | Present | DO NOT TOUCH |
| PK-011 | `ZFRoSp-Zhug` | Secondary | private | scheduled 2026-08-29 | Present | DO NOT TOUCH |
| PK-012 | `UYqR_I4z2X8` | Secondary | private | scheduled 2026-09-02 | Present | DO NOT TOUCH |

**PK-001 data anomaly, flagged not fixed**: its queue record has `status: "produced_and_uploaded"` but `youtube_video_id: null` and no local `video_folder`. That status is factually wrong — nothing was uploaded and nothing is left to reupload from. This is a bookkeeping error from an earlier session, not a video that needs migrating. Recommended action (not taken here, since it's a data edit, not a read): correct its `status` field to reflect reality once a human confirms there's nothing recoverable, so it stops appearing as "done" in any future audit.

## Classification taxonomy applied

- **KEEP** — leave exactly as-is, no action needed.
- **MIGRATE** — move the existing upload to the primary channel (not possible via YouTube's API; a "migration" is actually a delete + reupload, i.e. functionally the same as REUPLOAD, just phrased differently).
- **REUPLOAD** — publish a fresh copy to ProjectKAIAI; decide separately whether the secondary-channel copy is deleted, unlisted, or left public.
- **DO NOT TOUCH** — still private/scheduled, still time to decide before it goes live; no urgency.
- **MISSING** — no usable asset or video ID exists to act on.
- **REVIEW REQUIRED** — already public and irreversibly on the secondary channel; a business decision, not a technical one.

## The decision that must not be made silently

PK-002 through PK-006 are either already public or about to become public on **Project Kai AI Lessons** — a real, legitimate secondary channel per Project KAI's own two-channel architecture (`docs on file: primary = flagship AI/tech content, secondary = tutorials/lessons`), not a mistake channel. The open question is not "is this bad" — it's **what should permanently live on which channel going forward**, and this session will not decide that unilaterally. Three real options, with honest tradeoffs:

**Option A — Keep as-is, treat as retroactively-correct secondary-channel content.**
Do nothing to PK-002–006. If their subject matter (tutorials/lessons-style, per the "AI Automation…" titles seen above) genuinely fits the secondary channel's own stated purpose, this requires zero further action and loses zero existing views/watch history. Downside: they were *intended* for the primary channel when queued, so this silently changes their destination after the fact — acceptable only if the content itself fits the secondary channel's stated purpose, which the titles below suggest it does.

**Option B — Reupload to ProjectKAIAI as new videos, leave the secondary copies in place.**
Primary channel gets its own copies; nothing is deleted. Downside: duplicate content across two channels the user owns, which YouTube does not penalize between owned channels but does mean double the moderation/comment surface for the same material, and the secondary-channel copies keep whatever views/comments they already have.

**Option C — Reupload to ProjectKAIAI, then unlist or delete the secondary copies.**
Cleanest single-source-of-truth outcome. Downside: destroys any existing views/comments/watch history on the secondary copies (`obhd7xAbk7o` is already public with real accumulated stats as of this check) — a real, irreversible loss, and deletion is explicitly on this sprint's do-not-touch list without direct authorization.

**This session's recommendation, not a decision**: given the titles ("AI Automation Myths Debunked," "AI Automation Without Coding: A Beginner's Guide") read as tutorial/lesson content, Option A is the least destructive and most consistent with the channel's own stated purpose — but the user should confirm this explicitly rather than have it assumed, since it permanently reclassifies where five videos "belong."

## PK-006 — the time-sensitive one

Everything above applies to PK-006 too, but it alone has a clock: it auto-publishes on the secondary channel in **under 19 hours** purely via YouTube's own scheduling, with zero pipeline code involved. If the user wants a different outcome than "goes public on Project Kai AI Lessons as scheduled," the only way to change that before 2026-08-12T09:30:00Z is to manually edit its privacy/schedule directly in YouTube Studio — this session did not do so, per the do-not-touch boundary, and no code in this repository can do it either (there is no "unschedule" pathway wired into any script). If no action is taken, Option A above is what happens by default.

## What this session did not do

No delete, no reupload, no reschedule, no privacy change, no thumbnail change, on any of PK-001 through PK-012. `authorize_youtube.py` was not run. The only write in this entire phase was this document.
