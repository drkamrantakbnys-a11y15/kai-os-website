# Project KAI — Sprint 12: Public Security & Trust Architecture — Implementation

Status: IMPLEMENTED. Extends the existing website architecture and public-data generator only — no KAI_OS security code was touched, no capability was activated. See `PROJECT_KAI_SPRINT12_SECURITY_AUDIT.md` for the read-only Phase 1 findings this implementation is based on.

## Architecture changes

**New page**: `src/pages/security.astro` (`/security`) — justified per the audit's own reasoning: the real content here (11 controls, a capability inventory, activation status, test evidence) is substantially more than fits as one more card on `/status`, and the site already has an established pattern for exactly this shape of overflow (`/status` → `/agents` deep-dive). Security follows the identical pattern.

**Extended, not duplicated**: `KAI_OS/scripts/generate_public_website_data.py` gained one new function, `security_snapshot()`, and one new `security` key in the existing `build_snapshot()` output — the same generator, same `SourceUnavailable`-on-missing-source / forbidden-substring-gate / no-fabricated-fallback pattern already used for every other section (`agents`, `desktop_operator`, `engineering`, `production`, `knowledge_brain`). No second data pipeline was created.

## Exact capability status shown (verified live, not copied from an old report)

- 11 capabilities declared in the closed vocabulary (`len(Capability.ALL)`).
- Exactly 2 active: `knowledge.search → knowledge_brain` (LOW risk), `memory.search → developer_memory` (LOW risk) — both mechanically derived by evaluating the real `build_phase3_activated_policy()` object against every declared capability, not hand-typed.
- "Not activated" category list is a human-reviewed, source-verified list (filesystem write/delete, network, credentials, publishing, process execution, future capabilities) plus a separate, more precise statement that trading and analytics automation have **no capability declared for them at all** — a stronger and more accurate claim than "ungranted," verified against `Capability.ALL`'s real contents.

## Security boundaries respected

- `orchestration/security/activated_policy.py` was not modified. Verified: `git diff --stat` shows no change, and `build_phase3_activated_policy()` still grants exactly the same 2 (agent, capability) pairs it did before this sprint (re-checked live).
- No `.grant()` call was added anywhere.
- No KAI_OS security module was edited — the only KAI_OS file touched is `scripts/generate_public_website_data.py`, which only *reads* `orchestration/security/` to build a public summary.
- 204/204 KAI_OS security-relevant tests still pass, unchanged.

## Public data field allowlist (`security` block)

```
total_capabilities_declared   int, from len(Capability.ALL)
active_capabilities           [{capability, agent, risk}], from live policy.evaluate() calls
active_capability_count       int, len(active_capabilities)
security_test_file_count      int, real file count via os.walk (no test execution -- see below)
controls                      human-reviewed list of control names, each verified against real code this sprint
activation_principle          one human-reviewed, source-verified sentence
source                        attribution string
```

**Deliberately excluded** (see audit §4): exact rate-limit thresholds, the itemized "known limitations" list from internal reports, audit log / kill-switch file paths, internal module structure, any local filesystem path, any credential/token name.

**Why test *file* count, not test *pass* count**: generating public data must never execute the test suite — this session independently discovered that Sprint 10's orchestrator-level tests write real events into the production audit log when run (no isolated `AuditLog` injected). Running pytest from a website-data generator would risk exactly that side effect for no transparency benefit a static file count doesn't already provide. This is a "manually reviewed value, risk documented" case per the sprint's own instructions, except the count itself remains mechanically generated (`os.walk`), only the *method* (static count vs. live execution) was a reviewed choice.

## Files changed

- `src/pages/status.astro` — added a 5th summary card ("Security Architecture") to the existing status grid, sourcing the new `security` block.
- `src/components/TrustTransparency.astro` — replaced the stale "Broader security documentation beyond that is still being built out" sentence with an accurate summary; kept the existing `/privacy` link on that pillar unchanged (did not hijack it for `/security`, to avoid losing the pillar's own dedicated link).
- `src/components/Footer.astro` — added one "Security" link under the existing Resources column.
- `src/data/docs.js` — added one entry under the existing "04 — Transparency" category, alongside Trust & Transparency and Privacy Policy (no new category created).
- `public/sitemap.xml` — added `/security`.
- `KAI_OS/scripts/generate_public_website_data.py` — added `security_snapshot()` and wired it into `build_snapshot()`.
- `src/data/generated/kai-os-public-data.json` — regenerated (build-time artifact, not hand-edited).

## Files created

- `src/pages/security.astro`
- `PROJECT_KAI_SPRINT12_SECURITY_AUDIT.md`, `PROJECT_KAI_SPRINT12_SECURITY_IMPLEMENTATION.md`, `PROJECT_KAI_SPRINT12_SECURITY_REPORT.md`

## Design

Reused existing sitewide classes (`.content-card`, `.status-pill`, `.page-hero`, `.section-badge`, `.status-grid`) — no new visual language, no stock cybersecurity imagery, no fake dashboards, no animated counters, no fabricated "live" framing. The page explicitly states it is a build-time snapshot, matching `/status`'s own established honesty pattern.

## Known limitations

- The "not activated" category list on `/security` is a reviewed, hardcoded list of category *names* (filesystem write/delete, network, etc.), not mechanically re-derived from `Capability.ALL` each build. If a new capability category is ever declared in KAI_OS without a corresponding website update, the page could under- or over-state the "not activated" list until manually refreshed. Documented rather than silently accepted; the `active_capabilities` list (the part that actually matters for "what's currently on") *is* fully mechanically derived and cannot drift.
- `security_test_file_count` counts files, not test functions or a pass/fail result — stated precisely as "test files" on the page itself to avoid overclaiming.
