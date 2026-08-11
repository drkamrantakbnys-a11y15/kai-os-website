# Project KAI — Company Roadmap

Companion to the Architecture Audit and Public Data Map. This separates what's actually committed from what's speculative, per the standing rule: **never publish exploration as a guaranteed product.**

## NOW — running in production today

- Content production pipeline: topic queue → script → pre-generation validation → scene planning → visual sourcing → narration → music → assembly → thumbnail → compliance check → human review → (optional) publish. Real, running, produces a video whenever `produce_next_video.py` executes (rate-limited to one new production per calendar day by design — see `_already_ran_today()`).
- Compliance gateway with a two-layer safety net (pre-generation gate + post-assembly final check), both real and tested.
- 683 real automated test files across the codebase.
- Developer Memory and Pipeline Metrics: real, append-only, used directly by engineers.
- The website itself: live, static, Astro-built, premium design system in place.

## NEXT — actively being worked on, real code exists, not finished

- Formalizing the 13 real capabilities (visual, voice, music, thumbnail, compliance, analytics, knowledge, developer, SEO, research, trend, website, memory) into standalone, autonomously-callable agents. Currently: all 13 are `SubAgentSkeleton` classes whose `.execute()` raises `NotImplementedError` by explicit design — this is real, in-progress architecture work, not vaporware, but it is not done.
- Expanding the topic queue toward 30 topics and producing videos against it (in progress this session: 25 queued/produced, 5 completed).
- This website-to-KAI_OS data integration itself (the subject of the current directive) — Sprint 1 of 10 (per the directive's own suggested order) is this audit; Sprints 2-10 are not yet built.

## IN DEVELOPMENT — capability exists as code, not yet wired into daily production

- Analytics collection (`collect_analytics.py` is real, tested code, but has zero real data because zero videos have been uploaded yet — `future_analytics_placeholder.json` on every video says so explicitly).
- Knowledge Brain wiring into per-video runs (the search engine itself works today when queried manually; it isn't triggered automatically per production run yet).
- Developer Memory automatic wiring (same situation — real ledger, manual use today).

## PLANNED — designed, not yet built

- Research Agent (would drive automated, research-based topic scheduling — today's queue is 100% human-curated, and the website's own Hero section was recently corrected to stop implying otherwise).
- `ai_router/` dispatch (the routing table design exists in `ai_router/`; nothing dispatches through it yet — it's a design document expressed in code, not a working router).
- A public `/status` page, `/activity` feed, and `/changelog` — all technically buildable today from real data already on disk (see Public Data Map), but none exist yet.

## VISION / EXPLORATION — not committed, not scheduled, no real timeline

Earlier directives in this engagement referenced initiatives like **Trading Intelligence** and **Project HIVE / Autonomous Companies**. Per this session's own explicit instruction ("if later roadmap phases are not confirmed commitments, label them clearly as VISION or EXPLORATION rather than presenting them as guaranteed future products") and per an open question already flagged in the site's own Improvement Backlog (never resolved by Kamran), **these are not treated as committed roadmap items in this document or on the live site.** The current live `Roadmap.astro` component already reflects this correctly — its "Long-Term Vision" tier says only "A Self-Evolving AI Operating System... This is a direction, not a committed timeline," with no mention of Trading Intelligence or Project HIVE by name. This roadmap document does not change that; it confirms the existing site copy is already the honest version and should not be walked back toward more specific speculative claims without Kamran explicitly confirming they're real commitments.

## The website's own roadmap under this directive (Phases 1–22)

The current directive proposes a 10-sprint build order (Real Company Information Architecture → Agent/Website Data Integration → Status Page → Activity/Changelog → Production Metrics → How-KAI-Works refinement → Roadmap/Company Future → Documentation/Engineering Journal → Contact/Founder/Identity → Final Security+A11y+Perf Audit). This is website *engineering* work, not a KAI OS *product* roadmap — worth keeping the two conceptually separate on the public Roadmap page itself (visitors care about what KAI OS does, not about the site's own build sequence). Recommend: the public `/roadmap` page continues to describe KAI OS's real trajectory (as above); the website's own sprint sequence stays internal, tracked the same way this session has tracked every other sprint (Improvement Backlog + per-sprint reports), not published as a company roadmap item.

## What this roadmap deliberately does not do

It does not commit to dates. Every item above is either "already running," "in progress with real code to show for it," or explicitly labeled speculative. No item in this document should be read by a website visitor as a promise with a deadline.
