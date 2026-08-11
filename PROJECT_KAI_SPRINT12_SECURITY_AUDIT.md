# Project KAI — Sprint 12: Public Security & Trust Audit (Phase 1, Read-Only)

No code changed while producing this document. Findings only.

## 1. Existing public security claims (as they exist today)

Exactly one exists, in `src/components/TrustTransparency.astro`'s "Privacy" pillar:

> "This site is static: no accounts, no payment processing, no backend database, and no analytics service connected today — so no personal data is collected by construction, not by policy alone. **Broader security documentation beyond that is still being built out.**"

That last sentence was accurate when written (before Sprint 11 existed) and is now **stale** — a real, tested, multi-layered security architecture exists in KAI_OS today. This is the justified public-facing gap this sprint addresses: a true "still being built out" claim sitting next to work that is, in fact, built, tested, and activated.

No other page (`/status`, `/agents`, `/knowledge`, `/docs`, `/changelog`, homepage, Footer) mentions security at all — confirmed by grepping the entire `src/` tree for "security"/"Security"; the one match above was the only hit. There is no existing security page, no existing security section, and no duplication risk.

## 2. Verified security capabilities (re-checked from actual source this session, not assumed from prior reports)

Re-verified directly against `KAI_OS/orchestration/security/` and the real `activated_policy.py`, and by re-running the test suite:

- Default-deny `SecurityPolicy` — an (agent, capability) pair is denied unless explicitly granted. Confirmed: unknown capability → DENY, unregistered agent → DENY, un-granted capability → DENY.
- Single mediation chokepoint (`ControlledExecutor`) — nothing calls an agent's real capability except through this class; independently re-evaluates authorization rather than trusting an earlier check.
- Revocation — `SecurityPolicy.revoke()`, effective immediately, no cache.
- Kill switch at three independent, composable scopes — global, per-agent, per-capability. File-backed; fails closed (treated as engaged) if its state file is unreadable/corrupt.
- Rate limiting — per-(agent, capability) call-frequency bounds, fails closed on internal error.
- Audit trail — every authorization decision and execution outcome logged, with secret-shaped strings redacted before write.
- Fail-closed policy-error handling — an exception inside the policy evaluator itself is treated as a denial, never as "must be fine."
- Structured request validation — a malformed authorization request is denied and logged as its own event category, never silently dropped.
- A capability-activation gate with its own evidence-review process — a capability is only ever turned on for one specific agent after an explicit, documented review (Sprint 11 Phase 3.2's process), never merely because it was declared.

**Current real numbers, re-verified live during this audit, not copied from an old report:**
- 11 capabilities exist in the closed vocabulary.
- Exactly **2** are granted: `knowledge.search` → `knowledge_brain`, `memory.search` → `developer_memory`. Both LOW risk, read-only, no credential, no network, no filesystem write.
- Every other capability (filesystem write/delete, network, credentials, publishing, process execution, and anything trading-related — no trading capability exists in the vocabulary at all) is declared but ungranted.
- 204/204 tests passing across the orchestration security suite and both real-entrypoint activation suites (`orchestration/tests/`, `test_kai.py`, `test_kai_ceo.py`, `test_kai_entrypoint_security.py`, `test_kai_memory_search_activation.py`).

## 3. Public-safe facts (recommended for publication)

- The architecture principles themselves: default-deny, centralized policy, independent re-verification, revocation, three-scope kill switch, rate limiting, audit logging with redaction, fail-closed error handling, evidence-reviewed activation.
- Capability *categories* that exist (filesystem, network, credentials, publishing, process execution) — as categories, not implementation detail.
- Current activation status: exactly which 2 capabilities are active, on which agent, at what risk level — already-verified facts, not aspirational ones.
- Aggregate test evidence: total passing test count for the security-relevant suites, generated fresh at data-generation time (never hand-typed).
- The general shape of the evidence-review process (a capability is reviewed for read-only/no-credential/no-write/no-network/no-execute/no-trading before consideration, and is activated for exactly one agent at a time) — as a described process, not a reproducible checklist for probing what hasn't been activated yet.

## 4. Internal-only facts (must never reach public JSON or rendered HTML)

- Real file paths under `orchestration/security/` (module names, internal call structure).
- The real audit log's contents or location, the real kill-switch state file's location, any Telegram bot token/env-var name, any credential name.
- The specific, named list of currently-known unmitigated gaps from Sprint 11/3.3's own "Known Limitations" sections (e.g. that `task.output` isn't scanned for secret-shaped strings, that duplicate agent registration silently overwrites, that a direct `.execute()` call bypasses the gate). These are honest internal engineering notes; publishing them verbatim would hand a would-be attacker a roadmap of exactly what isn't yet covered. The public surface should state the *categories* of control that exist (see §3), never an itemized list of what doesn't.
- The adversarial test suite's specific attack scenarios/names.
- Any local Windows path (`D:\JARVIS_SYSTEM...`, `C:\Users\...`).
- Raw developer-memory or knowledge-brain content (already excluded from public data today by the existing generator's own design — confirmed unchanged).
- Any specific rate-limit numeric threshold framed as a target to probe (the *existence* of rate limiting is public-safe; publishing "the limit is exactly N requests/minute, try N+1" is not meaningfully more transparent and only helps someone testing the boundary — the existing generator pattern of publishing aggregate counts, not tunable parameters, already avoids this).

## 5. Possible information leakage risk in the current site

None found in currently-published content (the one stale claim is an omission, not a leak). The risk is prospective, in how Sprint 12 gets implemented — flagged so implementation avoids it:
- Do not copy any Sprint 11 `.md` report into public JSON or HTML verbatim.
- Do not publish the "Known Limitations" sections from those reports.
- Do not publish internal module/file paths as "evidence" — use aggregate counts instead, exactly as the existing generator already does for agents/tests/production.

## 6. Recommended public security surface

A dedicated **`/security`** page is justified — the real content here (9+ distinct controls, an activation model, a capability inventory, evidence numbers) is substantially more than one more card fits on `/status`, and the site already has an established pattern for exactly this shape of overflow: `/status` shows a summary card that links to a deep-dive page (`/agents` is the existing example — a 4th "Agent Architecture" card on `/status` links out to the full `/agents` page rather than cramming 13 agents into the status grid). Security should follow the identical pattern: one new summary card on `/status` linking to `/security`.

Also:
- Fix the stale claim in `TrustTransparency.astro`'s Privacy pillar, replacing "still being built out" with an accurate one-line summary plus a link to `/security`.
- Add one `docs.js` entry under the existing "04 — Transparency" category, alongside Trust & Transparency and Privacy Policy (not a new category — this is the correct existing home for it).
- Add one Footer link under the existing "Resources" column, matching the existing link density and order.
- Extend `scripts/generate_public_website_data.py` with one new allowlisted `security` block, following its exact existing pattern (fail loudly on missing source, forbidden-substring gate, no fabricated fallback) — not a second data pipeline.

## 7. What must NOT be exposed (restated as a checklist for implementation)

- [ ] No local filesystem paths (Windows or otherwise)
- [ ] No credential/token/secret names or values
- [ ] No raw audit log or kill-switch state file content or paths
- [ ] No itemized "known gaps" list
- [ ] No adversarial-test-specific attack details
- [ ] No internal module/file structure presented as a feature
- [ ] No claim of "unhackable," "100% secure," "military-grade," or equivalent
- [ ] No fabricated live-monitoring or real-time dashboard implication (this remains a build-time snapshot, exactly like the rest of `/status`)

## Conclusion

Justified gap found: a real, substantial, tested security architecture exists and the public site currently says the opposite ("still being built out"). Proceeding to implementation: one new `/security` page, one new `/status` summary card, one stale-claim fix, one Footer link, one docs.js entry, one allowlisted extension to the existing public-data generator. No second data pipeline, no new page beyond the one justified above, no capability activation, no KAI_OS code touched.
