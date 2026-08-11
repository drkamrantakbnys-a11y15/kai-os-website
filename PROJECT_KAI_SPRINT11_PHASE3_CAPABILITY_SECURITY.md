# Project KAI — Sprint 11 Phase 3: Capability Activation Security Gate

Status: IMPLEMENTED. Extends `orchestration/security/` from Sprint 11 Phase 2 — no component was rebuilt, only new modules and additive changes to existing ones. See `PROJECT_KAI_SPRINT11_SECURITY_IMPLEMENTATION.md` for the Phase 2 foundation this phase builds on.

Objective, stated plainly: not "impossible to hack" (that claim is never made about this or any system). The objective is default-deny, least-privilege, explicit authorization, strict scope, human approval where risk warrants it, validation, auditability, revocation, and fail-closed behavior — measured by how hard it is for a compromised agent, a malicious prompt, a replayed approval, a buggy policy, or a compromised component to cross its authorized boundary.

## 1. Architecture

Unchanged core: `SecurityPolicy` (default-deny) → `ControlledExecutor` (single mediation chokepoint, independent re-verification) → `Agent.execute()`. Phase 3 adds five checks inside that same chokepoint, in this order, each fail-closed and each its own audit `event_type`:

```
kill switch (global/agent/capability)  -> KILL_SWITCHED
policy.evaluate() (wrapped)            -> POLICY_ERROR (if evaluate() itself raises)
                                        -> DENY / REVOKED (if denied)
rate limiter                           -> RATE_LIMITED
filesystem scope (if applicable)       -> SCOPE_VIOLATION
human approval (if REQUIRES_APPROVAL)  -> REQUIRE_APPROVAL, then DENY on denial/timeout/unavailable
agent.execute()                        -> ALLOW (SUCCESS or FAILED execution_result)
```

No implicit allow fallback exists anywhere in this chain — every branch either raises a `SecurityError` subclass or falls through to the next check.

## 2. Capability inventory

`orchestration/security/capability_inventory.py::build_capability_inventory()` is mechanically derived — every row comes from `Capability.ALL`, `risk_of()`, and each real `Agent` subclass's own `.capabilities` class attribute (read without instantiating the agent, so building the inventory never touches a real ledger file). Nothing is hand-typed. 11 real capabilities exist in the closed vocabulary; of those, 3 are declared and used by a real agent (`knowledge.search`, `memory.write`, `memory.search`), and exactly 1 is `ACTIVE` in this sprint's real policy (see §5). The other 8 (`filesystem.*`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`) are declared for the security model's completeness but used by no real agent this sprint — `DECLARED_NOT_USED_BY_ANY_AGENT`.

Run `python3 -c "from orchestration.security.capability_inventory import render_markdown_table; print(render_markdown_table())"` from `KAI_OS` to regenerate the live table.

## 3. Default-deny registry (extended)

`SecurityPolicy.evaluate()`'s existing rules (unknown capability → DENY, no grant → DENY, capability not in grant → DENY, else risk-based ALLOW/REQUIRES_APPROVAL) are unchanged. Phase 3 adds:

- **Revoked capability → DENY**, distinguishable from "never granted" in the audit trail (`event_type: "REVOKED"` vs `"DENY"`) via a new `SecurityPolicy._revoked` set, populated by `revoke()` and cleared the moment a capability is granted again.
- **Policy evaluation failure → DENY.** `ControlledExecutor.execute()` wraps `policy.evaluate()` in a try/except; any exception from the policy layer itself raises `PolicyEvaluationError` (a `SecurityError` subclass) rather than propagating an unhandled exception past the chokepoint.
- **Rate limit exceeded → DENY.** New `RateLimiter` component (see §6).
- **Filesystem scope violation → DENY.** The previously-declared-but-unwired `filesystem_boundary.resolve_and_verify()` and `AgentGrant.filesystem_roots` are now load-bearing: any request for `FILESYSTEM_READ/WRITE/DELETE` with a real target path is verified against the agent's granted roots before execution.

There is still no implicit-allow code path anywhere in this stack.

## 4. Agent-specific grants and scope enforcement

Unchanged: `AgentGrant(agent_name, capabilities, filesystem_roots, requires_approval_override)`. No agent constructor takes a policy reference (verified by `test_policy_tampering_agent_cannot_call_grant_on_the_policy_object`, still passing).

Filesystem scope: case-insensitive, traversal-resistant, UNC-aware (Sprint 11 Phase 2's `filesystem_boundary.py`, unchanged) — now actually exercised in the execution path for the first time. No agent this sprint holds a filesystem capability, so this branch runs only under test today; the moment any future agent is granted `FILESYSTEM_WRITE` with real `filesystem_roots`, the check is already live.

Network/API scope: not built this sprint. No agent has `NETWORK_REQUEST` granted or plans to; inventing an unused `NetworkScope` module ahead of a real need would be speculative generality, not defense in depth. The filesystem-boundary pattern (resolve, normalize, compare against an explicit allow-list, fail closed on empty allow-list) is the template a future network-scope module would follow.

## 5. First real capability activation

`orchestration/security/activated_policy.py::build_phase3_activated_policy()` is the one real, canonical `SecurityPolicy` this sprint turns on:

- **Capability**: `knowledge.search`
- **Agent**: `knowledge_brain` (`KnowledgeBrainAgent`)
- **Risk**: LOW
- **Reversible**: yes — a search has no side effect at all
- **Requires credential**: no
- **Requires filesystem write**: no (read-only against the existing report corpus)
- **Requires network**: no
- **Rate limit**: 20/minute, 200/hour, 1000/day (the documented safe default; no override configured)
- **Human approval required**: no (LOW risk, below the HIGH approval threshold)
- **How to revoke**: `policy.revoke("knowledge_brain", Capability.KNOWLEDGE_SEARCH)` — takes effect on the very next `evaluate()` call
- **How the kill switch blocks it**: any of `kill_switch.engage(reason=...)` (global), `engage(reason=..., agent_name="knowledge_brain")`, or `engage(reason=..., capability=Capability.KNOWLEDGE_SEARCH)` all deny it immediately

**Why this one**: it is the lowest-impact real capability in the entire inventory — read-only, non-destructive, no external account touched, no credential exposed, and already the most heavily tested capability in the codebase (Sprint 10, Sprint 11 Phase 2, and this phase's own tests). `memory.write`/`memory.search` were deliberately left ungranted: Phase 3's mandate is to activate exactly one capability, not two "while we're at it" — a second activation is a future sprint's explicit decision.

**Honest scope note**: no production entrypoint (`kai.py`, `kai_ceo.py`, or any script outside `orchestration/tests/`) currently constructs `KaiOrchestrator` with this activated policy — confirmed by `grep -rln "KaiOrchestrator(" . | grep -v /tests/` returning nothing. This capability is real, tested, and provably gated end-to-end (§8), but it is not yet wired into anything a human operator invokes day-to-day. Wiring it into a real entrypoint is next-step work, not claimed as done here.

## 6. Rate and resource limits

`orchestration/security/rate_limiter.py::RateLimiter` — in-memory, per-(agent, capability) fixed-window counters (minute/hour/day), no database or external service (matches "do not overbuild"). Default limits (20/min, 200/hr, 1000/day) are deliberately generous for legitimate human-triggered use while bounding a compromised or buggy agent's ability to loop. Fail-closed: any internal bookkeeping error denies rather than allows. Does not persist across process restarts by design — a fresh process starting a fresh window is correct behavior for a frequency bound, unlike the kill switch, which must persist to stay fail-closed across a crash.

Financial capabilities: none exist in this system's capability vocabulary, none were added, and none will be activated by this phase — see §10.

## 7. Kill switch (extended)

Three independent, composable scopes, one state file (`content_pipeline/orchestration_security_data/kill_switch.json`):

- **Global**: `engage(reason)` with no agent/capability — blocks everything.
- **Agent-scoped**: `engage(reason, agent_name="x")` — blocks only that agent.
- **Capability-scoped**: `engage(reason, capability="y")` — blocks that capability for every agent.

`is_engaged(agent_name=, capability=)` returns True if the global switch OR the matching agent scope OR the matching capability scope is engaged — a narrower scope can never override a broader one. Still file-backed and fails closed (engaged) on a corrupt/unreadable state file, unchanged from Phase 2. No `Agent` subclass holds a `KillSwitch` reference (verified structurally) — an agent cannot disable its own kill switch, at any scope.

## 8. Revocation

`SecurityPolicy.revoke(agent_name, capability=None)` — removes one capability (or the agent's entire grant if `capability=None`) from the live policy object. Takes effect immediately: `evaluate()` always reads `self._grants` live, there is no cache to invalidate. Re-granting requires an explicit new `grant()` call — nothing auto-restores a revoked capability. A revoked denial is tagged `event_type: "REVOKED"` in the audit trail, distinguishable from a plain "never granted" `DENY`.

## 9. Audit events (extended)

`AuditLog.record()` gained an optional `event_type` field (defaults to `decision` when a caller omits it, so every Phase 2 event remains valid). Categories now in use: `ALLOW`, `DENY`, `REVOKED`, `REQUIRE_APPROVAL`, `RATE_LIMITED`, `KILL_SWITCHED`, `VALIDATION_FAILED`, `SCOPE_VIOLATION`, `POLICY_ERROR`. Redaction (secret-shaped strings in `target`/`denial_reason`) is unchanged and still applies to every event regardless of category.

**Known limitation found during this phase's secrets scan**: the redaction regex targets credential-*shaped* strings (`key=value`, long tokens), not local filesystem paths. An exception message containing a raw local path (e.g. from a test fixture's `OSError`) can land in `denial_reason` unredacted. This is not a credential leak, but it is a real gap — see §11.

## 10. Trading agent boundary

No trading capability exists in `Capability.ALL`. No trading credential was read, referenced, or connected. No file under `core/trading/` or `core/orchestrator.py` was opened this phase. Live trading is explicitly not activated and this phase's activation mechanism (`activated_policy.py`) grants exactly one non-trading, read-only capability. The Trading Agent requires its own dedicated security review before any capability activation, per this sprint's absolute rule — untouched.

## 11. Known gaps (honest, not hidden)

Carried forward from Phase 2 (still real, still unmitigated by this phase — none of them involve the capability actually activated in §5, since it grants no credential/filesystem/network access):
- `task.output` not scanned for secret-shaped strings.
- Duplicate `register_agent()` name silently overwrites.
- Direct `agent.execute()` call bypasses the gate entirely (Python has no access modifiers).

New, found during this phase:
- Audit-log redaction does not cover local filesystem paths in exception messages, only credential-shaped strings.
- `content_pipeline/orchestration_security_data/security_audit.jsonl` is written to by Sprint 10's orchestrator-level tests (`test_orchestrator.py`, `test_knowledge_agent.py`, `test_memory_agent.py`), which construct `KaiOrchestrator()` without an isolated `ControlledExecutor`/`AuditLog`, so every test run appends non-sensitive test events to the real default-path audit file. Confirmed non-sensitive (no secrets, only test fixture data and one benign local path) but sloppy; recommend those three test files inject an isolated `AuditLog`/`KillSwitch` the same way every Sprint 11 security test already does. Not fixed in this phase — those are Sprint 10 test files, out of this phase's stated scope, and changing them risks touching assertions unrelated to security.

## 12. Deliberately unactivated

Filesystem write/delete, network requests, credential reads, content publishing, process execution, and anything trading-related. All exist as declared, tested, fail-closed-by-default capabilities in the vocabulary and policy engine — none are granted to any agent by `build_phase3_activated_policy()`. Activating any of them is a future sprint's explicit decision, made one capability at a time, the same way `knowledge.search` was activated this sprint.
