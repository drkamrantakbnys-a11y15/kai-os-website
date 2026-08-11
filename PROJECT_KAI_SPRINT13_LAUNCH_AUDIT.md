# Project KAI — Sprint 13 Launch Audit

Read-only. No code changed while writing this document. Sources: full Sprint 1–12 report history (condensed separately, see "Prior sprint history" below), direct inspection of `kai-os-website` source on `main` (uncommitted working-tree changes included), the running localhost build (`npm run dev`, port 4321), and the live production domain `https://projectkai.dev/` fetched fresh.

## Headline finding

**Production (`projectkai.dev`) and the local repository have diverged severely.** The live domain is still serving something close to the very first commit (`b8d3715 "Launch KAI OS website v1.0"`) — its own hero literally says **"V1.0 Static Launch"** and its stat strip claims **"11+ AI Agents, 100+ Workflows, 25+ Research Areas."** None of the last ~10 sprints of real work (Agents page, Docs, Status, Changelog, Knowledge Brain, Security, real agent data, mobile nav, JSON-LD, OG metadata) exist on production. Its `sitemap.xml` lists only 9 URLs; the local build has 15 real pages. There is no CI/CD workflow file, no `wrangler.toml`, no Vercel/Netlify config anywhere in the repo, and the locally-available `wrangler` CLI is unauthenticated — **the actual deployment mechanism for `projectkai.dev` cannot be determined from this repository alone.** See §15/§19 for what this means for Part 19.

This is not a blocker for continuing local implementation work (Parts 3–18 all operate on the repository, not the live domain), but it is a hard blocker for Part 19 (actual production deployment) until you tell me how `projectkai.dev` is actually connected to a build, or provide the access to do it.

## Prior sprint history (condensed)

Full detail was extracted from all 24 requested Sprint 1–12 reports plus the improvement backlog; not reproduced in full here to keep this audit focused on *current* state. Key carried-forward facts:
- The backlog (`PROJECT_KAI_WEBSITE_IMPROVEMENT_BACKLOG.md`) lists as **still not started**: Knowledge Brain visualization, a real Blog (1 real post + 3 stubs), a real Research page beyond placeholder, a Developer Portal (explicitly placeholder-only), a dedicated Trust hub page, and newsletter/email capture (blocked on a real destination decision).
- `kai-os-public-data.json`'s `security` block was generated during Sprint 12, when exactly 2 capabilities (`knowledge.search`, `memory.search`) were active. `memory.write` was activated in the KAI OS repo in the session immediately before this one (Sprint 11 Phase 3.4) — the website was never regenerated since, so it currently undercounts by one.
- Sprint 11's security series flagged several still-open KAI OS-internal items (audit log has no tamper-evidence/hash-chaining, symlink/path-escape risk unverified, `task.output` not scanned for secrets, etc.) — these are internal engineering gaps, not something the public site should ever surface in more detail than it already does (it currently doesn't, correctly).
- A real production-ledger contamination incident happened during the `memory.write` activation (one garbage entry written, caught and manually corrected same-session). Not a website concern; noted here only because Part 9 asks about production truth broadly.

## 1. Localhost state

**REAL NOW.** `npm run dev` serves cleanly on port 4321. 15 pages under `src/pages/`: `index`, `about`, `agents`, `blog` (+1 post), `changelog`, `contact`, `docs`, `knowledge`, `privacy`, `research`, `security`, `status`, `terms`, `404`. No console errors observed on the homepage. Working tree has 6 uncommitted files (`sitemap.xml`, `Footer.astro`, `TrustTransparency.astro`, `docs.js`, `kai-os-public-data.json`, `status.astro`) — these are real, coherent, in-progress Sprint 12 changes (adding `/security` to nav/sitemap/docs index, refreshing the data snapshot), not stray edits. They should be committed as part of this sprint's work, not discarded.

## 2. Production-domain state

**STALE — pre-Sprint-1 content.** See headline finding. `Server: cloudflare`, `cf-cache-status: DYNAMIC`, Cloudflare RUM beacon present (`/cdn-cgi/rum`) — production is served through Cloudflare, consistent with Cloudflare Pages, but this cannot be confirmed as Pages-vs-Cloudflare-in-front-of-something-else without dashboard access.

## 3. Route parity

**FAIL.** Production sitemap: `/`, `/about`, `/agents`, `/research`, `/blog`, `/blog/practical-ai-workflows-for-solo-creators/`, `/contact`, `/privacy`, `/terms` (9 routes). Local build has all of those **plus** `/docs`, `/status`, `/changelog`, `/knowledge`, `/security`, `/404` (custom). Production is missing 6 real routes entirely.

## 4. Homepage parity

**FAIL.** Production homepage hero/copy/stats do not match any commit newer than `b8d3715`. Local homepage has gone through at least 5 further redesign passes (Sprint 1 visual-language cleanup, Sprint 2 "How KAI Works," Sprint 5 storytelling pass, Sprint 9 agent-pipeline linking, and more) that never reached production.

## 5. Agents page

**REAL NOW locally** (`/agents`, not live on production). 13 real agent entries in `src/data/agents.js`: 5 `Operational` / 7 `Planned` / 1 `Coming Soon` (capability status); 5 `In Development` / 7 `Planned` / 1 `Coming Soon` (autonomy status). Cross-checked mechanically at generation time against `sub_agents/agents.py`'s real class count by `scripts/generate_public_website_data.py::build_snapshot()` — the generator hard-fails rather than publish a mismatched count. Agent cards are linked to their real pipeline-flow nodes on the homepage (`AgentEcosystem.astro`, added Sprint 9/12).

## 6. Docs page

**REAL NOW locally**, not live on production. `src/data/docs.js` lists real destinations (Agents, Status, Changelog, Knowledge Brain, Security [uncommitted addition], Privacy, Terms) each marked `Available`, plus items honestly marked otherwise where not yet built.

## 7. Status page

**REAL NOW locally**, not live on production. Entirely data-driven from `kai-os-public-data.json` — no hardcoded numbers in the template itself. Explicitly labeled "build-time system snapshot, not a live feed," with the exact generation date shown. This is the correct pattern the rest of the site should be held to.

## 8. Changelog

**REAL NOW locally**, not live on production. `src/data/changelog.js` — git-log-sourced per Sprint 2 report, not fabricated.

## 9. Knowledge

**REAL NOW locally**, not live on production. `/knowledge` describes the real `knowledge_brain/indexer.py` mechanism honestly ("word-overlap keyword search... not semantic search — no embeddings, no vector index").

## 10. Security

**REAL NOW locally, currently stale, not live on production.** `/security` is entirely data-driven from `kai-os-public-data.json`'s `security` block — same good pattern as Status. Two concrete accuracy bugs found (see §26/§27):
1. `active_capability_count` is **2**, should be **3** (regeneration needed — mechanical fix, no template change required).
2. The template hardcodes `<p>Both are read-only, require no credential, and make no network or filesystem-write call.</p>` (`security.astro:111`) describing the active-capabilities list. This sentence is only true for exactly 2 read-only capabilities. Once `memory.write` (a real, if append-only/non-destructive, filesystem write) is correctly counted, "both" and "no filesystem-write call" both become false. **This line must be rewritten, not just have its data source refreshed** — flagged for Part 7 implementation.

## 11. Contact

**FAIL — dead-end CTA.** `/contact` (both locally and, differently, in whatever old form exists on production) provides **no actual contact method** — no email address, no form, no link. Its own copy says "Use your preferred direct contact channel for now." Every page's header/footer "Contact Kamran" button points here. This directly violates Part 4's "Do not create fake CTAs. Every CTA must lead somewhere real." **Requires your input**: what public contact method (if any) should actually be published? I have your email on file for this session but will not publish personal contact information without you explicitly saying so — that's your call, not mine to assume.

## 12. About/founder

**REAL NOW locally**, not live on production (production's About predates the current founder section entirely). `Founder.astro` names Kamran Tak as Founder/Architect — matches what's already true and previously verified.

## 13. Footer

**REAL NOW locally.** Comprehensive — links to every real route including the not-yet-committed `/security` addition. Good.

## 14. Header/navigation

**PARTIAL.** Primary nav only surfaces `Home / About / How It Works / Agents / Trust / Roadmap / Blog / Contact` — `Status`, `Security`, `Docs`, `Changelog`, `Knowledge` are reachable only via the footer or in-page cross-links, not the primary nav. Not a broken-link issue, but a real connectivity weakness for a site whose whole positioning is "explore the evidence" — a first-time visitor scanning the header wouldn't know `/security` or `/status` exist. Candidate fix for Part 5, not urgent enough to block anything.

## 15. Mobile layout

**Hamburger menu present and functional** (`Header.astro`, checkbox-driven, no JS framework dependency, activates at `max-width: 980px`). Not yet re-verified at the specific 375/768/1024 breakpoints requested by Part 13 for every page — flagged as outstanding verification work for Part 13, not a known-broken item (nothing found broken in source; needs actual viewport testing before claiming PASS).

## 16. Desktop layout

Not yet re-verified beyond the homepage screenshot taken during this audit (renders correctly at default desktop width, no visible clipping/overflow). Full per-page desktop pass outstanding for Part 12/13.

## 17. Broken links

No broken internal links found in the components/pages inspected (Footer, Header, Docs all point to real, existing routes). A full mechanical link-check across every page is still outstanding (Part 18) — this audit inspected the nav/footer/docs link sources directly rather than crawling every rendered page.

## 18. Canonical URLs

**REAL NOW, correct.** `Layout.astro` computes `canonicalUrl` from `https://projectkai.dev` + `canonicalPath`, passed per-page. Verified on `index`, `security`, `status`, `contact`.

## 19. Metadata

**REAL NOW, correct.** Per-page `title`/`description` props flow through `Layout.astro`. No missing metadata found on inspected pages.

## 20. Open Graph / social preview metadata

**MOSTLY REAL, one known risk carried forward from the backlog.** `og:title/description/url/type/site_name/image(+width/height/alt)` and `twitter:card=summary_large_image` + `twitter:title/description/image` all present in `Layout.astro`. **Risk**: `og-image.svg` is the only OG image — some crawlers (notably X/Twitter historically) don't reliably render SVG `og:image`. Not verified fixed since the original backlog flag. Recommend a PNG/JPG fallback before calling social sharing done — flagged for Part 14, not yet actioned.

## 21. Favicon / site identity

**REAL NOW.** `favicon.svg` + `favicon.ico` both present and linked.

## 22. 404 handling

**REAL on both.** `src/pages/404.astro` exists locally. Production also returns a genuine HTTP 404 status for an unknown path (verified: `curl -o /dev/null -w "%{http_code}"` → `404`), though its actual page content will reflect whatever old build is live, not the current 404 page.

## 23. Console errors

**None observed** on the localhost homepage (`read_console_messages` clean). Full per-page console sweep still outstanding (Part 18).

## 24. Security / public-data leakage

**CLEAN.** Direct `grep` across `src/components`, `src/pages`, `src/data` for local filesystem paths (`localhost`, `127.0.0.1`, `D:\JARVIS_SYSTEM`, `C:\Users`) found **zero matches**. The KAI OS-side generator (`generate_public_website_data.py`) additionally has its own belt-and-suspenders forbidden-substring gate (paths, `.env`, `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `TELEGRAM`, `OAUTH`, `CLIENT_SECRET`, `PRIVATE_KEY`) checked on every generation before it will write output. No fabricated statistics/testimonials/social links found anywhere in components or pages (see §26).

## 25. Stale claims

Two concrete, confirmed instances (see §10 and §26); no others found in the pages/components directly inspected. `TrustTransparency.astro` explicitly disclaims fabricated stats/testimonials/team members/customer logos — and that disclaim is itself accurate, which is a good sign of prior-sprint discipline.

## 26. Capability counts

**KAI OS source of truth, mechanically checked this session**: exactly 3 active (agent, capability) grants — `knowledge_brain→knowledge.search`, `developer_memory→memory.search`, `developer_memory→memory.write` — out of 6 declared capabilities in `Capability.ALL` (not 11 as the currently-committed JSON says either — `total_capabilities_declared` itself needs to be re-verified on regeneration, since the committed file also predates capability-vocabulary changes; the generator computes this live from `Capability.ALL` so a regeneration is the fix, not a manual edit).
The **committed** `kai-os-public-data.json` currently says `active_capability_count: 2`. **This is the single highest-value mechanical fix available in this sprint**: re-run `python scripts/generate_public_website_data.py` from the KAI_OS root.

## 27. Active vs. declared capabilities

**Correction after full re-read of `capabilities.py` (my first pass truncated the file):** the declared vocabulary (`Capability.ALL`) genuinely has 11 members — `knowledge.search`, `memory.write`, `memory.search`, `filesystem.read`, `filesystem.write`, `filesystem.delete`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`. `total_capabilities_declared: 11` in the regenerated JSON is correct, not stale. `security.astro`'s `NOT_ACTIVATED` list (`Filesystem write / delete`, `Network access`, `Credential access`, `Content publishing`, `Process execution`, `Any future capability...`) is directionally accurate and covers 5 of the 6 remaining ungranted capabilities as named categories (it doesn't separately itemize `filesystem.read` or `human_approval.request` — not false, just not exhaustively itemized; a minor completeness gap, not a correctness bug). `memory.write` is a distinct, separate, narrower capability (LOW risk, "append-only, non-destructive" per its own risk-classification comment in `capabilities.py`), so the `NOT_ACTIVATED` list itself doesn't need new entries — only the hardcoded "both are read-only" sentence needs rewriting (§10).

## 28. Desktop Operator truth

**Accurately represented already.** `kai-os-public-data.json`'s `desktop_operator` block: status `"In Development"`, explicit detail "Real, extensively tested architecture — not yet wired to observe or control anything live," sourced from the package's own module documentation. This matches what Part 6 requires (never claim live control that doesn't exist) and needs no correction — it's already honest. No dedicated public Desktop Operator page/section exists yet beyond this status-card-level summary; Part 6 asks whether a fuller page is *justified* — that's a design decision for implementation, not an audit finding.

## 29. Production/video truth

`kai-os-public-data.json`'s `production` block currently shows `completed_total: 5` and a `queue_status_counts` breakdown — this was accurate as of Sprint 12/PK-014-recovery time. Given the Production Resume Hardening work completed in the session immediately before this one, the real current KAI OS queue state is: **5 completed, 13 awaiting review, 12 queued, 0 running, 0 failed, 0 needing human intervention** (30 total) — the committed JSON's queue numbers should be re-verified against this on regeneration. No PK-014-specific narrative appears anywhere on the public site today (correctly — nothing forces it to), and per this sprint's own directive, none should be fabricated or hidden if a future page specifically discusses production evidence in more detail.

## 30. Roadmap truth

Not re-read in full this pass (`Roadmap.astro`/`PROJECT_KAI_COMPANY_ROADMAP.md` already confirmed in a prior sprint's audit to correctly keep "Trading Intelligence"/"Project HIVE" as unconfirmed vision items, not committed roadmap items) — flagged for a spot-check during implementation rather than re-verified from scratch here, since no code touched it since that confirmation.

## Launch-blocker determination

**No critical blocker to continuing Parts 3–18** (positioning, hero, connectivity, security-page accuracy, design pass, mobile/desktop verification, SEO, testing) — all of that is repository-local work. Proceeding.

**Part 19 (production deployment) cannot be completed autonomously.** The exact gap: no deployment config file exists in the repo (no CI workflow, no `wrangler.toml`, no Vercel/Netlify project file), and the local `wrangler` CLI is unauthenticated. I cannot determine whether `projectkai.dev` is connected to Cloudflare Pages via a dashboard Git integration (in which case a `git push` might be all that's needed, if it's just misconfigured or paused) or was deployed via a one-time manual `wrangler pages deploy` (in which case it needs a fresh manual deploy, requiring your Cloudflare login). **This will be reported again at the end with the exact question(s) I need answered before Part 19 can proceed** — I am not stopping the rest of the sprint for it now, per the directive's own "otherwise continue."
