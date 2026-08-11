# Project KAI — Media Network Architecture & Implementation Classification

Companion to `PROJECT_KAI_MEDIA_NETWORK_AUDIT.md` (the prior read-only audit). This document is the required pre-implementation classification for the "Media Network + Engagement Expansion" master prompt, followed by the architecture reference the prompt's Section 68 asks for. Written before any new code in this phase; the classification below governs what gets built in this pass versus documented as planned.

## 0. Fresh state re-check (not reused from memory)

Re-inspected directly, this pass:

- Pages today: `about, agents, ai-jokes, blog, changelog, command-center, contact, desktop-operator, docs, fun-facts, index, knowledge, privacy, research, security, status, terms` (17, plus `404`).
- Data files today: `agents.js` (13 real sub-agents), `changelog.js`, `docs.js`, `facts.js` (12 curated), `jokes.js` (15 curated). No `channels.js`, `contentRouter.js`, `categories.js`, `news.js`, `futureRadar.js`, `discoveries.js`, `experiments.js`, `reviews.js` exist yet.
- `CommentSection.astro` and `src/scripts/share.js` exist, both real and reusable, confirmed by full read this pass.
- Two-tier status CSS confirmed intact and unchanged: legacy `.status-pill--*` (9 variants) and four-tier `.status-badge` + `.status-operational/-development/-experimental/-planned` (with a code comment explicitly warning against merging the two). New work uses the four-tier system only, per the standing rule.
- `generate_public_website_data.py` (KAI_OS side) was re-read in full. It already contains a `trading_snapshot()` function and a `"trading"` key in `build_snapshot()` — added by unrelated Era 6 trading-platform work, not by this website workstream. The currently-committed `kai-os-public-data.json` on the website side predates that addition (no `trading` key present in the file on disk right now). This is noted, not acted on: **no website page will read or render the `trading` field**, regardless of whether a future regeneration includes it. This satisfies "do not connect the website to the trading system" without requiring an edit to KAI_OS's trading code, which is out of scope.
- `youtube_gateway.py`'s `KAI_YOUTUBE_CHANNEL_ID` guard confirmed unchanged (`UCgEKqjS1eM4Q8KUxloKVNKA`) — not touched this pass, and nothing in this website phase calls `authorize_youtube.py`, `schedule_upload()`, or any live YouTube API.
- Header nav today: `Home, About, How It Works, Agents, Trust, Roadmap, Blog, Contact` (anchors + real routes). Footer today links 12 real routes across Platform/Resources/Legal. Confirmed by full read this pass — this is the nav/footer this phase's Section 40/42 changes will extend, not replace.
- `git status` confirms no destructive operation has occurred; prior phases' edits remain uncommitted in the working tree, consistent with "never commit unless asked."

## 1. Classification (Section 0.1 requirement)

Legend: **REAL/REUSABLE** already exists, reuse as-is · **ENHANCE** existing thing gets extended · **NEW** genuinely new, real, functioning code · **PLANNED** architecture/design documented, not executed this pass · **OUT OF SCOPE** explicitly excluded by the prompt itself

| # | Feature area (prompt section) | Classification | Notes |
|---|---|---|---|
| 1–2 | Two-channel strategy, safety boundary | REAL/REUSABLE | Channel IDs, guard, migration plan already exist (`youtube_gateway.py`, `PROJECT_KAI_YOUTUBE_MIGRATION_PLAN.md`). Nothing to build; the guard is referenced, never touched. |
| 5 | Media Network Hub | NEW | No `/media` route exists. Building it. |
| 6 | Content Routing Engine | NEW | `src/data/contentRouter.js` — deterministic function, explicit `reason` string, no AI claim. |
| 7 | Content categories | NEW (data-driven) | `src/data/categories.js`, one taxonomy object, no per-category page files — routed through `/discover?category=` filters, per Section 70's anti-duplication rule. |
| 8–9 | Fun Facts / AI Jokes | ENHANCE | Pages and data already real (12 facts, 15 jokes). Adding category filter UI parity, related-content, KAI Take, comment prompts. Not rebuilding. |
| 10 | AI News Center | NEW, curated/demo state | `/ai-news`, explicit `CURATED`/`AWAITING RESEARCH AGENT` states — never claims to be live. |
| 11–12 | Future Radar | NEW | `/future-radar`, `KAI Estimate` labeling required by the prompt itself — enforced in the data shape, not just copy. |
| 13–14 | Discovery + Documentary | NEW (merged) | One `/discover` route hosting both discovery stories and the "KAI Documentary" format tag, per Section 70 ("don't create 20 duplicate routes" — a documentary is a content *format*, not a separate section). |
| 15 | Experiments | NEW | `/experiments`, `PROPOSED` status only (no experiment has actually been run for this pass). |
| 16 | App/Gadget Reviews | NEW | `/reviews`, `NOT YET TESTED` status only (no hands-on testing occurred). |
| 17 | Community / comments everywhere | ENHANCE | `CommentSection.astro` reused on every new content page, not rebuilt. |
| 18–19 | Comment Assistant + intent detection | PLANNED (design only) | Flow diagram + data contract documented below. No code executes comment analysis — would require a real backend/LLM call this phase explicitly doesn't authorize. |
| 20–23 | Engagement mechanics, trending labels | NEW (local-state only) | Reactions use `localStorage`, never claimed as shared/persisted. Trending/Editor's Pick use static curated flags, never fabricated counts. |
| 21–22 | Surprise Me / What Should I Watch | NEW | Client-side only, over `src/data/contentIndex.js`. |
| 24 | Search | NEW | `/search`, client-side search over the same content index. No backend. |
| 25 | Content detail pages | PARTIAL / PLANNED | Cards expand in-place on hub pages this pass (not full per-item permalinked routes) to avoid the 20+ duplicate-route trap Section 70 explicitly warns against; dedicated detail routes are listed as a next-phase item, not built now. |
| 26 | Channel-aware website data | NEW | Adds a static `channels` array to the KAI_OS generator (IDs/names/roles/pillars only — no OAuth call, no live metrics) + richer `src/data/channels.js` on the website side for editorial content. |
| 27 | Command Center upgrade | ENHANCE | Adds Media Network/Channel/Routing/News/Future Radar/Community/Facts/Jokes/Discovery cards to the existing page; existing sections untouched. |
| 28 | Agent Network upgrade | ENHANCE | `agents.astro`'s existing 15-card network array gets Comment/Future Radar/News agent entries; the real 13 sub-agents are untouched. |
| 29–31 | Research/News/Future Radar Agent architecture | PLANNED (design only) | Pipelines documented below; zero execution code, consistent with "no false activation." |
| 32–33 | Fact-checking labels, AI transparency | NEW (data field) | Added as a `sourceQuality`/`transparency` field on real content items, not a new page. |
| 34–39 | Visual design, mobile, perf, a11y, SEO, sharing | REAL/REUSABLE + verify | Reuses existing tokens/animations/`share.js`; verified, not rebuilt. |
| 40–42 | Navigation, homepage, footer | ENHANCE | Structure reorganized per the prompt's suggested grouping, using only routes that exist after this phase. |
| 43 | Coming-soon honesty rule | REAL/REUSABLE (policy) | Already the site's working convention (`status-badge`, the Command Center's "coming soon" interaction pattern). Applied consistently to every new page. |
| 44 | Comments roadmap | PLANNED (doc only) | Documented below; no database introduced. |
| 45–47 | Content data architecture, relationships, Next Discovery | NEW | Stable IDs (`NEWS-001`, `FUTURE-001`, etc.), `related` arrays, shared `NextDiscovery.astro` component. |
| 48 | KAI Take | NEW (component) | Reusable `KaiTake.astro`, explicitly labeled editorial. |
| 49 | Comment-based engagement prompts | ENHANCE | Contextual prompt text passed into `CommentSection.astro`'s existing `topic` prop pattern (extended with an optional `prompt` prop). |
| 50 | Feature request system | NEW (UI-only) | `FeatureRequest.astro`, same honesty pattern as `CommentSection.astro`. |
| 51 | KAI Votes | PLANNED (design only this pass) | Architecture documented; not built as a working UI this pass — would need the same "is this actually stored" honesty treatment as comments, and duplicating that exact pattern for a third UI-only form was judged lower priority than the flagship pages within this pass's scope. |
| 52 | Daily Discovery | NEW (deterministic) | Date-seeded pick from `contentIndex.js` (deterministic function of the calendar date, not random per page load, not "live curation"). |
| 53–56 | Repurposing architecture, content pipeline, YouTube bridge, Analytics | PLANNED (design) + NEW page | Architecture documented below; `/analytics` page built with explicit `NOT_CONNECTED` states per Section 56's own instruction. |
| 57 | Security | REAL/REUSABLE + verify | Existing secrets-scan discipline applied to all new files. |
| 58 | Trading boundary | OUT OF SCOPE | Confirmed untouched; see re-check above. |
| 59 | Agent Builder | NEW (educational/demo, static) | `/agent-builder`, a static flow visualization — explicitly not a real agent deployment tool. |
| 60–62 | AI Education Mode, Discovery Mode, cross-channel relationship | ENHANCE (folded into /media) | Given as content/copy within the Media Network hub's channel cards rather than a fully separate `/ai-lessons` section, to avoid a duplicate route for what is fundamentally channel-card content (Section 70). |
| 63–64 | Engagement loop, content loop | PLANNED (doc only) | Documented below as the target loop; several of its real steps (comments→feedback, research→website) don't exist yet. |
| 65 | Data honesty | REAL/REUSABLE (policy) | The site's existing non-negotiable; re-applied explicitly to every new data file. |
| 66–67 | Testing / regression | REAL (process) | Build + browser verification + existing-route regression, run at the end of this pass. |
| 69 | Implementation phases A–Q | REAL (process) | Followed in this document's numbering below. |
| 71 | Final vision | N/A | Narrative framing, not a discrete deliverable. |
| 72–73 | YouTube safety, acceptance criteria | REAL (policy) | Enforced throughout; final report addresses each checklist item explicitly. |

## 2. Two-channel architecture (Section 68 requirement)

```
PROJECTKAIAI                          PROJECT KAI AI LESSONS
UCgEKqjS1eM4Q8KUxloKVNKA               UC75pRQ4fzmpNDXUSaI9BNKQ
PRIMARY -- Discover                    SECONDARY -- Learn
AI · tech · gadgets · science ·        AI lessons · tutorials · workflows ·
future · documentaries · experiments   productivity · automation · KAI updates
Sole automated upload target,          Not an automated upload target.
protected by the fail-closed guard     Real channel, human-operated.
in youtube_gateway.py.
```

The website is the hub connecting both: a viewer can discover a concept on ProjectKAIAI and learn to use it on Project Kai AI Lessons. This loop is expressed in `/media`'s copy and in each content item's optional `crossChannelPrompt` field — never as a live cross-link driven by real analytics (none exist yet).

## 3. Content routing architecture

`src/data/contentRouter.js` exports one pure function:

```js
routeContent({ topic, category, format, audience, educational_depth, entertainment_score, technology_score, science_score, news_score })
// -> { recommended_channel, confidence, reason, secondary_channel_option }
```

Deterministic, explainable, rule-based (score comparison + category lookup table) — explicitly not an AI classifier, and never described as one anywhere in the UI. The Media Network hub's "Where does this story belong?" visualization renders the worked examples from the prompt's Section 5 directly, and a small interactive form on the same page calls this exact function live in the browser so a visitor can see the same deterministic logic run in real time.

## 4. Content taxonomy

21 primary categories, one flat list in `src/data/categories.js` (`AI, TECHNOLOGY, SCIENCE, GADGETS, APPS, SOFTWARE, DISCOVERIES, FUTURE, FACTS, EXPERIMENTS, REVIEWS, TUTORIALS, NEWS, IDEAS, DOCUMENTARIES, PRODUCTIVITY, AUTOMATION, INTERNET, SPACE, ROBOTICS, DIGITAL LIFE`). Content items reference categories by key; `/discover` filters over this shared list rather than one page per category.

## 5. Future agents (design only, per Sections 29–31)

```
Research Agent:   DISCOVER -> VERIFY -> CLASSIFY -> SUMMARIZE -> SOURCE -> HUMAN REVIEW -> PUBLISH
News Agent:       SOURCE -> DEDUPLICATE -> VERIFY -> SUMMARIZE -> CLASSIFY -> IMPORTANCE SCORE -> HUMAN REVIEW -> PUBLISH
Future Radar Agent: MONITOR -> IDENTIFY SIGNALS -> COMPARE -> BUILD TIMELINE -> ESTIMATE CONFIDENCE -> EXPLAIN UNCERTAINTY -> UPDATE ENTRY
```

All three are `PLANNED` in `agents.astro`'s network array. None has a callable implementation; `/ai-news` and `/future-radar` ship with curated seed data precisely because these agents don't exist yet.

## 6. Comment Assistant architecture (design only, per Sections 18–19)

```
COMMENT -> KAI ANALYSIS -> INTENT DETECTION -> TONE SUGGESTION -> SUGGESTED REPLY -> EDIT -> APPROVE (human, mandatory) -> PUBLISH
```

Intent classes: `QUESTION, PRAISE, CRITICISM, CONFUSION, REQUEST, JOKE, TROLLING, SPAM, MISINFORMATION, IDEA, FEATURE REQUEST`. Reply tones: `HUMOROUS, LOGICAL, HELPFUL, EDUCATIONAL, SHORT, DETAILED`. This is documented and shown as a static, non-interactive diagram on `/command-center`'s Community card — it never runs, since comments themselves have no backend yet to analyze in the first place. Status: `PLANNED`.

## 7. Comments and KAI Votes roadmap (Section 44/51)

Current phase: UI-only (`CommentSection.astro`, unchanged behavior, extended to more pages). Before any persistence is added, this roadmap requires documenting: provider, database, retention, moderation, privacy, deletion, spam protection, backup, cost, security — then explicit authorization. None of that exists yet; this document does not pre-select a provider. KAI Votes follows the identical rule and is not built as a working UI this pass (see classification table).

## 8. Website ↔ YouTube bridge / Analytics (Section 55–56)

`/analytics` ships with four explicit states — `DATA AVAILABLE`, `DATA LIMITED`, `AWAITING OAUTH SCOPE`, `NOT CONNECTED` — and today shows `NOT CONNECTED` for every metric, since `collect_analytics.py` exists in KAI_OS but its OAuth scope was never authorized (confirmed in the agent registry: the Analytics Agent's own `currentCapability` field already says this). No views/CTR/subscriber numbers are fabricated anywhere.

## 9. Engagement loop / content loop (Sections 63–64, target state)

```
Engagement loop (website):  DISCOVER -> WATCH -> READ -> COMMENT -> SHARE -> EXPLORE RELATED -> LEARN -> RETURN
Content loop (production):  RESEARCH -> WEBSITE -> YOUTUBE -> SHORT-FORM -> COMMUNITY -> FEEDBACK -> NEW RESEARCH
```

Today, only `DISCOVER -> WATCH/READ -> SHARE -> EXPLORE RELATED` is real (via `share.js` and the new `NextDiscovery` component). `COMMENT`, `FEEDBACK`, and the content loop's `COMMUNITY -> FEEDBACK -> NEW RESEARCH` leg all depend on the not-yet-built comment backend and Research Agent — documented as the target, not claimed as working.

## 10. Data honesty rules (Section 65, restated for this phase)

No fabricated views, subscribers, analytics, news, sources, probabilities, comments, engagement, agent activity, or YouTube status anywhere in this phase's new pages. Every Future Radar probability carries a `KAI Estimate` / `EXPLORATORY PROBABILITY` label. Every news item states its status explicitly. Every review states `TESTED / RESEARCHED / NOT YET TESTED`. Every experiment states `PROPOSED` unless actually run. Reactions and votes use local-only state and are never described as shared totals.

## 11. What this phase does NOT build (explicit, per Section 43's honesty rule)

Real comment/vote persistence, any backend or database, live YouTube analytics, a working Comment Assistant, a working Research/News/Future Radar Agent, per-item permalinked detail routes, real hands-on product testing, real experiment execution, and any change to YouTube production state (upload/delete/reschedule/reauthorize) or the trading system. All appear in the UI as `PLANNED`, `DEVELOPMENT`, `PROPOSED`, `NOT YET TESTED`, `AWAITING RESEARCH AGENT`, or `NOT CONNECTED` — never disguised as working.
