# Sprint 11 — Phase 3.4: memory.write Explicit Capability Activation

**EVIDENCE REVIEW: PASS** (`PROJECT_KAI_SPRINT11_CAPABILITY_REVIEW_3.md`) → **ACTIVATION: COMPLETED** (this document). These are two distinct events, kept explicitly distinct per this phase's own instruction: a PASS review is eligibility, not authorization; this document records the separate, explicit authorization and the activation it produced.

## Exact Capability Activated

`memory.write` (`Capability.MEMORY_WRITE`)

## Exact Owning Agent

`developer_memory` (`DeveloperMemoryAgent`) — the same agent already granted `memory.search` since Phase 3.3. No new agent was created.

## Mandatory Pre-Activation Check (performed before touching `activated_policy.py`)

1. Read `PROJECT_KAI_SPRINT11_CAPABILITY_REVIEW_3.md` — confirmed PASS.
2. Read the current `activated_policy.py` — confirmed exactly 2 grants (`knowledge.search`, `memory.search`).
3. Confirmed live: `build_phase3_activated_policy()` grants exactly those 2 pairs.
4. Confirmed live: `policy.evaluate('developer_memory', Capability.MEMORY_WRITE)` → `DENY`.
5. Confirmed present: `content_gate.py`, `secret_detection.py`, `test_memory_write_hardening.py` (the full hardening implementation from the prior phase).
6. Confirmed no drift: full regression run before any edit — **240/240 passed**, matching Evidence Review #3's own recorded baseline exactly.

Activation proceeded only after all six checks passed.

## Exact Authorization Path

```
real entrypoint (kai.py, via _get_orchestrator())
  -> existing KaiOrchestrator
  -> existing SecurityPolicy (build_phase3_activated_policy())
  -> existing ControlledExecutor
  -> existing memory.write hardening (content_gate.py content-safety scan, then memory_agent.py input-contract validation)
  -> DeveloperMemoryAgent
  -> DeveloperMemoryLedger.record_entry()
```

No second `SecurityPolicy`, no second executor, no bypass, and no new direct access was created: `kai.py` and `kai_ceo.py` were **not modified** — grepped for `record_entry`/`DeveloperMemoryLedger` in both files, zero matches, confirming no direct-access shortcut exists.

## The Change Itself

One line changed in `orchestration/security/activated_policy.py`:

```python
# before
policy.grant(AgentGrant("developer_memory", frozenset({Capability.MEMORY_SEARCH})))
# after
policy.grant(AgentGrant("developer_memory", frozenset({Capability.MEMORY_SEARCH, Capability.MEMORY_WRITE})))
```

**Why one merged grant, not a separate third `policy.grant()` call**: `SecurityPolicy.grant()` has *replace*, not *merge*, semantics (`self._grants[agent_grant.agent_name] = agent_grant` — a plain dict assignment). A second, separate `policy.grant(AgentGrant("developer_memory", frozenset({MEMORY_WRITE})))` call would have silently **overwritten** the existing `memory.search` grant, dropping it entirely — a real regression bug, not a style choice. The safe, correct, non-restructuring way to add a second capability to an already-granted agent is to extend that agent's existing grant's capability set in place, which is what was done. `SecurityPolicy.grant()`'s own semantics were not changed, per this phase's explicit "do not restructure the grant system" boundary.

**Mechanical result**: 2 `policy.grant()` call sites in `activated_policy.py`, granting exactly 3 (agent, capability) pairs. Reported precisely rather than forcing a literal "3 call sites" that would have required either a bug (silent overwrite) or an actual restructuring of `grant()`'s semantics (also out of scope).

## Security Controls (all pre-existing, reused unmodified)

Default-deny `SecurityPolicy`, independent re-verification in `ControlledExecutor`, revocation, three-scope kill switch (global/agent/capability), rate limiting, structured request validation, pre-persistence content-safety gate (secret rejection), real input-contract validation, redacting audit trail, fail-closed policy-error handling. Zero new security-layer mechanisms were introduced this phase — only the one policy grant.

## Tests

25 new tests in `test_kai_memory_write_activation.py` (root, matching the `test_kai_memory_search_activation.py` naming convention), scenarios A–W from the directive. One test (`U`) exercises the real `kai.py` singleton's actual policy/executor object graph; it swaps the registered agent's ledger to an isolated tmpdir for its own duration only (the same established pattern `test_kai.py` already uses for `kai.QUEUE_PATH`), proving the real singleton both authorizes and executes correctly without ever opening the real production ledger for writing.

Three pre-existing tests, whose premises assumed `memory.write` was still ungranted, were updated to reflect the new, correctly-authorized reality (not weakened — each still asserts a real security property, just against a still-true example rather than one this activation made obsolete):
- `test_capability_inventory.py::test_memory_write_remains_declared_but_not_granted` → renamed and rewritten to assert `ACTIVE`.
- `test_phase3_capability_gate.py::test_unauthorized_request_wrong_capability_fails` → switched from a `developer_memory` "record" action (now legitimately authorized) to a direct `policy.evaluate()` check against `filesystem.delete` (still genuinely ungranted).
- `test_kai_memory_search_activation.py::test_real_policy_grants_exactly_memory_search_to_developer_memory` → renamed and rewritten to assert `memory.write` is now also `ALLOW`, with an explicit comment that this happened through its own separate evidence review, never implicitly.

## Incident: Accidental Production Ledger Contamination, Found and Corrected

**Full disclosure, not summarized away.** During the very first regression run after adding the grant (before the three tests above were fixed), `test_phase3_capability_gate.py::test_unauthorized_request_wrong_capability_fails` — in its *pre-fix* form — submitted a `developer_memory` "record" task through `self._real_harness()`, which constructs a `KaiOrchestrator` using the **real** `build_phase3_activated_policy()` and a **fresh `DeveloperMemoryAgent()` with no ledger override** (i.e., the real production ledger path). That test was originally written to prove this action would be *denied* (since `memory.write` was ungranted when the test was written) — the instant the grant was added, the same submission legitimately *succeeded*, and wrote one real entry (`entry_type: "bug"`, `title: "x"`, `description: "y"`) into the real, production `content_pipeline/developer_memory_data/developer_memory.jsonl`.

This is exactly the class of incident this phase's own directive warned against ("Do NOT write arbitrary test content into the production memory ledger merely to prove activation") — it happened via a *stale pre-existing test* that became unsafe the moment the grant was added, not via the new Phase 3.4 test suite (which was deliberately designed with the ledger-swap protection specifically to avoid this).

**Detection**: found by directly inspecting the real ledger's line count and content immediately after the regression run, before writing any report — not assumed clean.

**Remediation**: the single contaminating line was identified precisely (matched on its exact, distinctive content — `title: "x"`, `description: "y"` — verified as the *only* such entry in the file before touching anything) and removed via a direct, manual, one-time file edit — restoring the ledger to its exact prior 45-entry state. This was **not** performed through any application code path (the ledger has no delete/correction mechanism by design, per Phase E of the hardening review, and none was added here) — it was a manual operator correction of an accidental artifact, not a new capability or mechanism. Verified afterward: 45 entries, no `x`/`y` content remaining, all real content intact.

**Process lesson**: activating a *write* capability carries a real, categorically different regression risk that activating a *read* capability (Phase 3.1, 3.3) never did — a stale test that assumes a capability is denied can, the moment that assumption becomes false, silently produce a real, unintended write. The fix applied here (running regression *before* any test-suite cleanup, catching the failure, tracing it to a real write, and correcting both the test and the resulting data) is recorded here so it isn't repeated silently in a future activation.

## Known Limitations

- Carried from the hardening/evidence-review phases: no correction/deletion mechanism exists for the ledger (intentional, documented); audit-subsystem's own internal failure mode remains untested (traced from source in Evidence Review #3, does not compromise authorization); secret detection is a conservative heuristic (false positives possible, accepted).
- New from this phase: activating a write capability via a policy grant that also touches a pre-existing agent's grant set carries real regression risk from any pre-existing test that assumed the old, more restrictive state — mitigated this time by running regression before finalizing, not by any new automated safeguard.
- `memory.write` is not yet wired to any human-facing command in `kai.py`/`kai_ceo.py` (deliberately, per this phase's explicit boundary against creating new direct-access paths). A future, separate phase would need to add a `kai.record_memory()`-style function, mirroring `search_memory()`'s own pattern, if human-triggered recording is ever wanted.

## Confirmation

No other capability was activated. `filesystem.read`, `filesystem.write`, `filesystem.delete`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute` remain ungranted, mechanically verified. No trading capability exists and none was created.
