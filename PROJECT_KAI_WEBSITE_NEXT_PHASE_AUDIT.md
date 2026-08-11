# Project KAI Website — Next Phase Audit

Read-only. No page, component, or data file was modified while writing this document. This audit covers the pre-implementation checklist from the mission brief (repository, Sprint 13 docs, architecture/components, reusable pieces, routes, data sources, animation infrastructure, CSS/design tokens, agent-related code, duplication risk) and closes with the open questions that should be resolved before Architecture/Foundation work starts, consistent with the mission's own "work incrementally" rule.

## 1. Current state — confirmed directly, not assumed

**16 real routes** (all previously verified building with 0 errors, 0 console errors, 0 horizontal overflow at 375/768/1024/1440px, per the Sprint 13 report — not re-verified today since nothing has changed): `/`, `/about`, `/agents`, `/blog` (+1 post), `/changelog`, `/contact`, `/desktop-operator`, `/docs`, `/knowledge`, `/privacy`, `/research`, `/security`, `/status`, `/terms`, `/404`.

**16 components**: `Header`, `Footer`, `Hero`, `Stats`, `About`, `AgentEcosystem`, `Agents`, `CTA`, `Community` (existing "channels coming soon" section — see §6), `DocumentationPreview`, `Features`, `Founder`, `HowKaiWorks`, `Research`, `Roadmap`, `TrustTransparency`. One shared `Layout.astro` (title/description/canonical/OG/Twitter/JSON-LD/favicon, all real).

**4 data files**: `agents.js` (13 real agents, rich per-agent schema — see §5), `changelog.js` (git-log-sourced), `docs.js` (documentation index), `generated/kai-os-public-data.json` (build-time snapshot from real KAI OS source — agents, desktop_operator, engineering, production, security, knowledge_brain blocks).

**No backend, no database, no auth, no comment system, no chat/assistant, no client-side data persistence anywhere in the current site.** Confirmed by direct inspection, consistent with every prior sprint's explicit "static, no backend" statements. This is the single most important fact for scoping this mission: Phases 4, 12, and 13 all imply some form of interactivity beyond what a pure static build provides, and none of that infrastructure exists yet in any form — not even a stub.

## 2. Reusable infrastructure — real, working, should not be duplicated

- **Status-pill system** (`global.css`): 8 existing variants — `--operational` (green), `--in-development` (blue), `--planned` (gray), `--coming-soon` (dashed gray), `--partially-implemented` (yellow), `--human-controlled` (violet), `--illustrative` (dashed), `--published`/`--upcoming` (blue). This mission's requested 4-tier badge system (🟢 LIVE / 🟡 IN DEVELOPMENT / 🔵 EXPERIMENTAL / ⚪ PLANNED) does **not** map 1:1 onto the existing one — the existing "in-development" is blue, this mission wants blue reserved for "EXPERIMENTAL" and yellow for "IN DEVELOPMENT." Reusing the existing classes under their current names but with the mission's meanings would silently break every place `--in-development`/`--partially-implemented` are already used (`/status`, `/agents`, `/security`, `/desktop-operator`, `/docs`). **Recommend**: keep the existing classes and their current meanings exactly as-is (they're real, tested, in production), and add four new, distinctly-named classes for this mission's specific 4-tier system (e.g. `--tier-live`, `--tier-development`, `--tier-experimental`, `--tier-planned`) rather than repaint or reinterpret the existing ones.
- **Reveal-on-scroll system** (`interactions.js`, `setupReveal()`): `IntersectionObserver`-driven, respects `prefers-reduced-motion`, already targets `.content-card`/`.stat-card`/`.agent-card`/etc. New card types just need to be added to `REVEAL_SELECTOR` — no new animation engine needed for Phase 16's "scroll animations."
- **Counter animation** (`animateCounter`/`setupCounters()`): already real, already used by `Stats.astro`. Directly reusable for any new numeric stat card (Phase 16's "animated counters").
- **Sticky header + scroll class** (`setupHeaderScroll()`): real, already works.
- **Card/grid/container patterns** (`global.css`, `.content-card`, `.container`, `.content-grid`, section spacing tokens): consistent, reusable base for every new page this mission proposes.
- **Design tokens**: full color/spacing/shadow system already defined (`--primary`, `--violet`, `--text-main/soft/muted`, `--border`/`--border-bright`, `--shadow-soft`/`--shadow-glow`, `--max-width: 1360px`, `--section-padding: 120px`). New pages should consume these, not introduce parallel values.
- **Public data bridge** (`kai-os-public-data.json` + `KAI_OS/scripts/generate_public_website_data.py`): the exact right pattern for Phase 20's "future agents must be able to populate these datasets" principle — extending this generator (adding new sanitized blocks) is the correct mechanism for any new real, KAI-OS-sourced data this mission needs, not a new pipeline.
- **Only 2 real `@keyframes`** exist (`heroFadeUp`, `glowDrift`) — confirms the current site is deliberately animation-light. No particle library, no command-palette library, no comment-system library, no charting library is present. Phase 16/17/19's "avoid unnecessary JavaScript / no large libraries" constraint is easy to honor because nothing pulls one in today.

## 3. `agents.js` — how far the existing schema already goes toward Phase 2's requirements

Existing per-agent fields: `slug`, `name`, `layer`, `capabilityStatus`, `agentStatus`, `purpose`, `inputs`, `outputs`, `dependencies`, `currentCapability`, `automationLevel`, `roadmap`. This already covers Mission (`purpose`), Current status (`capabilityStatus`+`agentStatus`), Current capabilities (`currentCapability`), Integrations (`dependencies`), Planned/roadmap (`roadmap`). **Missing** two of Phase 2's requested fields: **Security boundary** and **Current limitations** — genuinely new fields to add, not duplicated. `agents.js`'s own header comment explains its two-dimensional status model precisely (`capabilityStatus`: is the capability real today; `agentStatus`: is it callable as an autonomous agent — currently never "Operational" for any of the 13, since `SubAgentSkeleton.execute()` unconditionally raises `NotImplementedError`). Any new status work must preserve this distinction, not collapse it.

## 4. Command Center (Phase 3) — a real boundary conflict to resolve before building

The mission's proposed Command Center module list includes **Trading Agent** and implies each module "must open a real route or expandable panel." Direct inspection of the KAI_OS backend (this session's own immediately-prior audit, `PROJECT_KAI_NEXT_PHASE_AUDIT.md`) found a large, real, separate trading system (`core/trading/`, `core/trading_professional/`, `agents/trading/`) that every standing instruction this entire session has said must remain untouched and unreferenced beyond an honest "exists, out of scope" mention. **A Trading module in the Command Center is fine and expected — as a PLANNED-only card with zero live data, zero route into anything trading-related, and explicit boundary language — but it must not attempt to surface real trading system status, metrics, or state.** This audit flags it rather than deciding it unilaterally, since it's a judgment call about presentation, not a pure technical fact.

The remaining proposed modules map cleanly onto real, already-audited things: YouTube Automation → real (`produce_next_video.py`/`approve_and_upload.py`, 12 real uploads), Research/Affiliate/Digital Products/Remote Job/Content agents → map to `sub_agents/agents.py`'s declared-but-skeleton agents or the dormant `agents/` (root) framework flagged as needing classification in the KAI_OS audit, Desktop Operator → already real (`/desktop-operator` page, built Sprint 13), Memory/Security → already real (`orchestration/` security package, 3 active capabilities).

## 5. Content-fabrication risk — the phases needing the most editorial care

Phases 5 (AI Facts), 6 (AI Jokes), 7 (AI Newsroom), and 8/9 (Future Radar/Launch Radar) each explicitly require sourced, non-fabricated content ("Facts must be sourced and must not be fabricated," "Do not fabricate news," "Never present predictions as facts"). **None of this content exists anywhere in the repository today** — there is no facts database, no joke database, no news corpus, no prediction dataset. Building the honest version of these pages means: (a) real data schemas and empty/seed-only datasets, clearly marked as awaiting a real population mechanism (exactly Phase 20's own instruction — "design so future agents can populate them"), or (b) a small amount of genuinely-sourced seed content with real citations, added carefully and sparingly. **Recommend seed content be minimal and explicitly source-linked (e.g., a handful of well-known, easily-verifiable AI facts/jokes with real attribution) rather than bulk-generated, and that AI Newsroom launch with zero fabricated articles — an honest "awaiting the Research Agent" empty state is better than invented headlines.** This is squarely what Phase 21's Honesty Rule is guarding against, and it's the single easiest place for this mission to accidentally violate its own rule if rushed.

## 6. Phases needing a backend/persistence decision

- **Phase 4 (Ask KAI)**: explicitly allowed to be "deterministic/local knowledge layer," no paid API required. This is achievable entirely client-side (a static Q&A lookup table sourced from real site data — agents, status, roadmap) with zero new infrastructure. Real, buildable now.
- **Phase 12 (Comments)** and **Phase 13 (KAI Community Assistant)**: both need *some* place to durably store comments, which a static Astro site with "no backend, no database" (stated as a positive privacy fact on `/privacy` and `TrustTransparency.astro` today) does not have. The mission says "do not over-engineer authentication" and "design for future" — read together, this means Phase 12's *first* version should be **UI + data-schema only** (exactly what the mission's own Phase 13 fallback says: "create the UI and architecture only if the backend is not yet available" — which is the current reality for comments too, not just the assistant). Actually building a live, persisted comment system would be a genuinely new architecture decision (which third-party service, what data retention, what moderation) that shouldn't be made silently inside a large multi-phase build. **Recommend flagging this explicitly for your decision before Phase 12 is implemented for real**, and shipping the interactive-but-non-persistent version (comments UI works, submissions are not saved anywhere, clearly labeled) in the meantime if the mission wants visible progress on it.

## 7. `Community.astro` — existing component with a name collision

An existing `Community.astro` component already exists on the homepage today (per the Sprint 1-12 changelog: "all channels shown as Coming Soon" — real Discord/GitHub/social destinations were never resolved). Phase 12's "AI Community" (comments) is a **different concept** with the same word. **Recommend naming the new comments system something distinct in code** (e.g. `CommunityDiscussion`/`Comments`) to avoid confusing it with the existing, unrelated `Community.astro` social-channels section during implementation.

## 8. Security Center (Phase 15)

`/security` already reads `security.*` from `kai-os-public-data.json` (controls list, capability model, active capabilities with per-row risk, not-activated categories, test-file count, activation principle) — all real, all mechanically generated. "Expand into interactive capability cards" is a presentation change on top of already-real data, not new data plumbing. No duplication risk here; this is the page most ready for enhancement as-is.

## 9. KAI Memory (Phase 14)

No page exists yet. Content must describe the real memory system (`orchestration/agents/memory_agent.py` / `DeveloperMemoryAgent`, append-only, `memory.search`+`memory.write` — both real, active, LOW-risk capabilities per the security audit) rather than a generic "AI memory" explainer disconnected from what KAI OS actually has. Real source material exists (this session's own Sprint 11 Phase 3.3/3.4 reports); genuinely new page, low fabrication risk since the underlying system is small and already well-documented.

## 10. Experiments (Phase 10) — content mapping

The mission's example experiment list (Autonomous YouTube Production, Agent Orchestration, Desktop Operator, Trading Intelligence) maps directly onto real, already-audited systems — "Autonomous YouTube Production" is the single most real, most evidenced thing in the entire KAI OS system (12 real uploads) and should probably be the flagship, LIVE-or-near-LIVE-status experiment rather than framed as equally speculative alongside genuinely early-stage ones. "Trading Intelligence" as an experiment card is subject to the same boundary as §4 — PLANNED/EXPERIMENTAL framing only, no live data surfaced.

## 11. Performance / dependency baseline

`package.json` has exactly one dependency: `astro`. No animation library, no icon library, no state-management library, no comment-widget library. Phase 19's "do not introduce large libraries unless absolutely necessary" is easy to honor by continuing this pattern — a command palette (Phase 17) and expandable interactive nodes (Phase 11's Agent Builder) are both achievable with vanilla JS/CSS given what's already proven working in `interactions.js`.

## Recommended order (confirms the mission's own sequencing, with specifics)

1. **Architecture decisions first** (this audit's open questions, §4/§5/§6/§7) — small, cheap to decide now, expensive to unwind after 14 pages are built on top of an unresolved assumption.
2. **Foundation**: new shared status-tier CSS classes (§2), extend `agents.js` with the two missing fields (§3), extend the data generator if any new real KAI-OS-sourced block is needed.
3. **Command Center** (Phase 3) — ties together existing real data (agents, security, status, production) into one new interactive page; lowest fabrication risk of the new pages since everything it shows already exists elsewhere on the site.
4. **Agents / KAI Memory / Security Center enhancements** — all backed by real, already-generated data.
5. **AI Facts / AI Jokes** — small, isolated, easiest to ship honestly with a handful of real, sourced seed entries.
6. **AI Newsroom / Future Radar / Future Launch Radar** — highest fabrication risk; ship with honest empty/seed states per §5.
7. **Experiments** — straightforward, maps to real systems per §10.
8. **Agent Builder** — pure front-end interactive diagram, no data risk, can be built any time after Foundation.
9. **Comments / KAI Community Assistant** — per §6, UI/architecture-only first, pending your decision on persistence.
10. **Futuristic interaction polish + Command Palette** (Phases 16-17) — layer on last, across all pages at once, so it's applied consistently rather than page-by-page.
11. **Full responsive/build/security testing, then documentation** (Phases 18/19/24/25).

## What this audit deliberately did not do

Did not modify any page, component, data file, or the generator script. Did not start the dev server or run a build (nothing changed yet to verify). Did not decide the Trading module's exact wording, the comments persistence mechanism, or the seed-content source list — these are flagged as open questions for you, not resolved unilaterally, since each is a real product/editorial decision rather than a technical fact this audit could just look up.

---

## Addendum — Implementation Map (Next Phase master prompt)

Your follow-up prompt resolved all four open questions above: new, separately-named status classes (not a repaint of the existing ones); Trading Agent is PLANNED-only, no live data, no import; comments/assistant ship UI-only with a `<CommentSection />` "Coming Soon" state, no database, no auth; Facts/Jokes use a small, real, curated seed set. This map is the concrete route-by-route consequence of that, confirming what's real/reusable vs. genuinely new before Step 1 starts.

| Route | State | Notes |
|---|---|---|
| `/command-center` | **NEW** | Composes existing real data only (`kai-os-public-data.json` agents/security/production/desktop_operator blocks) — no new data source needed for System Status; Agent Matrix needs the `agents.js` extension (§3) |
| `/memory` | **NEW** | Content-only page; real material already exists in this session's Sprint 11 Phase 3.3/3.4 reports (`memory.search`/`memory.write`, both real, LOW-risk, active) |
| `/security` | **ENHANCE** | Already real, already data-driven — add the visual capability graph and interactive cards on top of existing `security.*` data, no backend change |
| `/ai-facts` | **NEW** | New data file, small curated seed set (real, sourced, dated) |
| `/ai-jokes` | **NEW** | New data file, small curated seed set |
| `/future-radar` | **NEW** | New data file; every entry must carry "Experimental KAI Estimate" framing per Phase 6 |
| `/ai-news` | **NEW** | New data file; ship with zero fabricated articles — "Research Agent feed coming online" empty state is the honest default until a real source exists |
| `/experiments` | **NEW** | Maps to real systems (YouTube Production, Agent Orchestration, Desktop Operator) plus honestly-labeled prototypes; Trading Intelligence entry is PLANNED/EXPERIMENTAL only, no live data |
| `/agent-builder` | **NEW** | Pure front-end; explicitly labeled "Prototype — does not deploy agents yet," produces a config preview only |
| `/community` | **NEW** | "Community interaction layer — coming soon" per Phase 10; distinct component name from the existing, unrelated `Community.astro` (social channels) to avoid confusion (§7) |
| `<CommentSection />` | **NEW component** | Shared, 4-state (`coming-soon` default / `login-required` / `active` / `disabled`), attached to Facts/Jokes/News/Radar/Experiments/Builder/Knowledge/Research/Community |
| KAI Community Assistant | **NEW component** | Floating UI, bottom-right, page-context-aware canned responses only (no LLM call) — same "deterministic/local" constraint as Ask KAI |
| `/activity` | **NEW** | Sourced from `changelog.js` (already real, git-log-based) reshaped into a sprint timeline, plus a `PLANNED` future entry |
| `/roadmap` | **ENHANCE** | A `Roadmap.astro` component already exists (homepage `#roadmap` section, Now/Next/Future/Vision framing per Sprint 1); promoting it to its own full page and re-framing into NOW/NEXT/EXPERIMENTAL/FUTURE is a reshape of real, already-approved content, not new claims |
| Interactive Hero (`KAI CORE` node diagram) | **ENHANCE** | Replaces/extends the existing `hero-system` static grid in `Hero.astro` with clickable nodes routing to `/memory`, `/agents`, `/security`, `/desktop-operator` |
| Command Palette (Ctrl+K) | **NEW** | Vanilla JS, extends `interactions.js`; every entry routes to a real page (list in Phase 17 of the mission is exactly the route table above) |
| New 4-tier status classes | **NEW, additive** | `status-operational` / `status-development` / `status-experimental` / `status-planned` in `global.css`, alongside (not replacing) the existing `status-pill--*` system |

**Step 1 scope, precisely**: only the last row (new status classes) plus the shared groundwork they imply (a small, reusable badge markup pattern new pages will use). No page, no data file, and no existing component changes yet — those start at Step 2 onward per the mission's own ordering.
