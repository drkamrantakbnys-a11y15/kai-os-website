# Project KAI — Sprint 11 Phase 3.3: memory.search Capability Activation

Status: IMPLEMENTED. Extends the existing `orchestration/security/` architecture (Phases 2, 3, 3.1) and the Phase 3.2 evidence review — no component was rebuilt.

## Architecture changes

One new grant in the single, canonical policy object every real entrypoint already used (`orchestration/security/activated_policy.py::build_phase3_activated_policy()`):

```python
policy.grant(AgentGrant("knowledge_brain", frozenset({Capability.KNOWLEDGE_SEARCH})))
policy.grant(AgentGrant("developer_memory", frozenset({Capability.MEMORY_SEARCH})))  # new
```

No second `SecurityPolicy`, no second `ControlledExecutor`, no memory-specific bypass. `kai.py`'s `_get_orchestrator()` now registers `DeveloperMemoryAgent()` alongside `KnowledgeBrainAgent()` on the same singleton orchestrator, and gained one new function, `search_memory()`, that mirrors `search_knowledge()`'s exact shape — same `submit_task()` call, same real `AuditLog`/`KillSwitch`/`RateLimiter`. `kai_ceo.py` gained a `search_memory` command (`"search memory for <topic>"`) that calls it. No code anywhere imports `developer_memory.search.search` (or `orchestration.agents.memory_agent.memory_search`) outside `DeveloperMemoryAgent.execute()` itself and this phase's own tests.

## Exact capability

`memory.search` (`Capability.MEMORY_SEARCH`)

## Owning agent

`developer_memory` (`orchestration/agents/memory_agent.py::DeveloperMemoryAgent`) — pre-existing, unmodified by this phase. `required_capability()` already correctly selected `MEMORY_SEARCH` for a `"search"` action before this phase; no agent-contract code changed.

## Security boundaries

Identical shape to `knowledge.search`'s (Phase 3.1), verified independently for this capability rather than assumed:

- **Read-only**: `DeveloperMemoryLedger.all_entries()` opens the ledger in `"r"` mode only; `search()` never calls `record_entry()`.
- **No credential**: no import of `core.secrets` anywhere in `developer_memory/search.py` or `ledger.py`.
- **No network**: none.
- **No write/delete**: confirmed by source inspection; a `search` action cannot reach `record_entry()`.
- **Filesystem scope**: reads exactly one hardcoded path (`content_pipeline/developer_memory_data/developer_memory.jsonl`), not derived from task input — there is no attacker-controllable path parameter, so `filesystem_boundary.py`'s traversal protections don't even apply here (nothing to traverse).
- **Revocable**: `SecurityPolicy.revoke("developer_memory", Capability.MEMORY_SEARCH)` — generic, no new code.
- **Kill-switch protected**: global, agent (`developer_memory`), and capability (`memory.search`) scopes — generic, no new code.
- **Rate limited**: `RateLimiter.DEFAULT_LIMITS` (20/min, 200/hr, 1000/day) — same defaults as `knowledge.search`, no override configured, no new code.
- **Audit logged**: same `AuditLog`/`event_type` machinery, no new code.

## Entrypoint path

```
kai.py / kai_ceo.py
      |
kai.search_memory(query, entry_type=None)
      |
_get_orchestrator()  (the one real singleton, shared with knowledge.search)
      |
KaiOrchestrator.submit_task("developer_memory", {"action": "search", "query": ...})
      |
agent.required_capability()  ->  Capability.MEMORY_SEARCH
      |
AuthorizationRequest
      |
ControlledExecutor.execute()
      |-- kill switch (global/agent/capability)
      |-- SecurityPolicy.evaluate()  (independent re-verification, wrapped for fail-closed policy errors)
      |-- rate limiter
      |-- (no filesystem scope check -- MEMORY_SEARCH is not a FILESYSTEM_* capability; the ledger
      |    path itself is hardcoded, not a request target)
      |-- DeveloperMemoryAgent.execute()  ->  developer_memory/search.py::search()
      |
AuditLog.record()
```

## Rate limit

20 calls/minute, 200/hour, 1000/day — the existing generic default, unchanged, no per-capability override configured (same justification as `knowledge.search`: generous for legitimate ad hoc use, bounding for a compromised/buggy caller).

## Audit behavior

No new event categories were needed. `memory.search` events use the same `event_type` vocabulary already built in Phase 2/3: `ALLOW`, `DENY`, `REVOKED`, `RATE_LIMITED`, `KILL_SWITCHED`, `VALIDATION_FAILED`, `POLICY_ERROR`. Verified live against the real default-path audit log (`content_pipeline/orchestration_security_data/security_audit.jsonl`) for every scenario in the test suite.

## Kill-switch behavior

Verified at all three scopes through the real, file-backed `KillSwitch` kai.py's singleton actually holds — global, `agent_name="developer_memory"`, and `capability="memory.search"` — each independently denies, each guaranteed released via `addCleanup` regardless of test outcome, each confirmed released after the full run.

## Revocation behavior

`policy.revoke("developer_memory", Capability.MEMORY_SEARCH)` denies immediately (no cache to invalidate); a fresh singleton (equivalent to an explicit re-grant / process restart) restores it. Revoking `memory.search` does not affect `knowledge.search` or vice versa (independently verified).

## Tests

25 new tests in `test_kai_memory_search_activation.py` (root, matching the existing `test_kai.py`/`test_kai_ceo.py`/`test_kai_entrypoint_security.py` convention), covering scenarios A through R from the Phase 3.3 directive. Every denial scenario asserts the underlying `search()` function was never called via `unittest.mock.patch.object(...)` + `assert_not_called()` — not inferred from task status alone. Two existing tests were updated because the underlying real state legitimately changed (not weakened):

- `orchestration/tests/security/test_capability_inventory.py`: split the single `test_memory_capabilities_are_declared_but_not_granted_this_sprint` into `test_memory_search_is_active_as_of_sprint11_phase3_3` (now asserts `ACTIVE`) and `test_memory_write_remains_declared_but_not_granted` (still asserts `DECLARED_NOT_GRANTED`).
- `orchestration/tests/security/test_phase3_capability_gate.py::ProveTheGateTests::test_unauthorized_request_wrong_capability_fails`: previously used `developer_memory`'s `search` action as its "unauthorized" example, which is no longer unauthorized. Changed to a `record` action (requires `MEMORY_WRITE`, still ungranted) so the test continues to prove what its name claims.

## Known limitations

Identical, unchanged limitations from Phase 2/3/3.1 (documented there, not repeated in full here): `task.output` isn't scanned for secret-shaped strings; duplicate `register_agent()` name silently overwrites; direct `.execute()` calls bypass the gate (a Python-language limitation). One new, honest observation from this phase's own review: `DeveloperMemoryLedger.record_entry()` (the `MEMORY_WRITE` path, still ungranted) accepts freeform `description` text — nothing today prevents a future entry from containing something sensitive, which would then be surfaced by `memory.search`. This is a pre-existing property of the ledger itself, already noted in the Phase 3.2 evidence review, not introduced by this activation, and structurally incapable of affecting `SecurityPolicy` regardless (verified again in this phase's own `test_a_poisoned_ledger_entry_returned_by_search_does_not_alter_policy_grants_identity_or_kill_switch`).
