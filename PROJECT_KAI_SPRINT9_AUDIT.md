# Project KAI — Sprint 9 Audit

Read-only audit, produced before any code changes, per Sprint 9 Phase 1.

## Method

Re-read every page/component listed in Phase 1 (Homepage, About, Agents, Status, Changelog, Knowledge, Docs, Contact, Privacy, Research, Blog, Header, Footer, Hero, AgentEcosystem, HowKaiWorks, DocumentationPreview, TrustTransparency, Roadmap) plus the relevant real KAI_OS source (`agents.js`, `kai-os-public-data.json`, `sub_agents/agents.py`, `knowledge_brain/indexer.py`, `desktop_operator/`). Cross-checked against the 8 prior sprint reports for what's already been verified, rather than re-deriving facts already established.

## Current strengths (confirmed, not re-litigated)

- The Capability Status / Autonomous Agent Status distinction is intact everywhere it appears (agents.js, /agents, AgentEcosystem, /status).
- `/status` already correctly frames itself as a "build-time system snapshot, not a live feed" (Sprint 2/3/8) — Phase 3's concern is already resolved.
- No fabricated data found anywhere: zero customers/revenue/users/partnerships/testimonials across the entire site.
- `/docs`, `/status`, `/changelog`, `/knowledge` are now cross-linked (Sprint 8) — the standalone-evidence-page discoverability gap is closed.
- Hero and Footer already avoid cliché language and fake social links (verified Sprint 8).
- Desktop Operator is already correctly represented as "In Development," not live (corrected Sprint 2, after catching the audit's own earlier mistake).

## Real weaknesses found this sprint

### 1. No connection between an agent's card and where it actually appears in the pipeline (highest-value gap)

`/agents` shows each agent's `dependencies` field as plain text (e.g., Compliance Agent lists `compliance_gateway.py, fact_verification_gateway.py`). Separately, `AgentEcosystem.astro`'s pipeline flow and `HowKaiWorks.astro`'s 8 stages reference many of these exact same real files (`compliance_gateway.py` appears in both the Compliance Agent's dependencies AND the Review stage's technical details AND the Compliance Agent's own AgentEcosystem node). A visitor reading about the Compliance Agent on `/agents` has no way to jump to where that same capability shows up in the actual pipeline flow, or vice versa. The underlying data already proves the connection (same file names, independently verified in separate sprints) — it's just not surfaced as a link.

**Evidence**: Direct string comparison of `agents.js`'s `dependencies` fields against `HowKaiWorks.astro`'s `technicalDetails` arrays and `AgentEcosystem.astro`'s per-node agent slugs confirms exact overlaps for the 5 Operational agents (Visual, Thumbnail, Music, Voice, Compliance) plus 2 Planned agents that already have ecosystem nodes (Analytics, Knowledge).

**Recommended change**: Add stable per-node anchor IDs to `AgentEcosystem.astro`'s flow nodes (currently the section has one id; individual nodes don't), then add a real, precise "See this in the pipeline flow →" link on each matching `/agents` card. This uses zero new data — only the connections that already exist.

### 2. The homepage has no signal that engineering work is ongoing

Per Phase 10, a real (not fake) "this is alive" signal is one of the more effective low-risk credibility improvements available. The homepage currently has no reference to the changelog at all — a visitor has to already know `/changelog` exists (reachable via footer or `/docs`) to discover that real engineering work has a dated history. A small, real, changelog-sourced teaser near the bottom of the homepage (matching the existing "Public Evidence" pattern from Sprint 7) would close this without inventing anything — `changelog.js`'s most recent entry is already real, dated, and commit-hash-backed.

**Recommended change**: A small homepage strip showing the single most recent changelog entry's date and title, linking to `/changelog`.

## What should NOT be changed

- **Header navigation**: audited again this sprint, same conclusion as Sprint 8 — the current 7-item bar performs well; the "Engineering Center" consolidation suggested in Phase 6 is already effectively what `/docs` does, and building a second consolidation page would violate the sprint's own "ONE PURPOSE → ONE CLEAR DESTINATION" rule.
- **`/agents` field set**: already includes Purpose, Inputs, Outputs, Dependencies, Current Capability, Automation Level, Roadmap, plus both statuses — this already satisfies Phase 4's requested field list. No runtime metrics exist in the source (no success rate, execution count, latency, etc.), so none are added, per Phase 4's explicit prohibition.
- **A dedicated "KAI OS Stack" section (Phase 5)**: the 7 functional layers built in Sprint 4 already are this concept. A second, differently-labeled version of the same architecture would be genuine duplication.
- **`/status`'s live/build-time framing**: already correct, already explicit. No change needed.
- **About/Founder copy**: re-confirmed still accurate and appropriately restrained.

## What would be misleading if built

- Any per-agent "execution count," "success rate," or "last run" — `SubAgentSkeleton.execute()` raises `NotImplementedError` for all 13 agents; there is no execution to count.
- A live-updating homepage activity feed — no live infrastructure exists; would need to be build-time-generated and static, which is what the recommended changelog teaser already is.
- Deep-linking `/agents` cards to specific KAI_OS source line numbers — the real dependencies are file/module-level facts, not line-level; a fake precision here would overstate what's actually been verified.

## Proposed Sprint 9 implementation sequence

1. Add per-node anchor IDs to `AgentEcosystem.astro`.
2. Add "See this in the pipeline flow →" links to the 7 `/agents` cards that have a matching ecosystem node (Visual, Thumbnail, Music, Voice, Compliance, Analytics, Knowledge).
3. Add a small, real, changelog-sourced "Recently" teaser to the homepage.
4. Build, security-scan, browser-verify (desktop + 375px mobile), commit.
5. Report.

Deliberately excluded from this sprint: any new generated-data field (no gap requires one), any new page (no gap requires one), any navigation restructuring (already correct).
