# Project KAI — Sprint 11 Phase 3.2: Candidate Capability Evidence Review

Read-only. No code changed. No `.grant()` call made anywhere. This document is the evidence package the Phase 3.1 review verdict required before any further capability may be considered — it is a recommendation, not an activation.

## 0. Method

Every capability in `Capability.ALL` (`orchestration/security/capabilities.py`) was run through the activation gate from the Sprint 11 evidence review: read-only? credentials? write/delete? network? publish? arbitrary execution? trading? output-influences-a-privileged-capability?

| Capability | Read-only? | Credential? | Write/delete? | Network? | Publish? | Execute? | Trading? | Gate result |
|---|---|---|---|---|---|---|---|---|
| `knowledge.search` | yes | no | no | no | no | no | no | **already granted** |
| `memory.search` | yes | no | no | no | no | no | no | **passes every STOP branch** |
| `memory.write` | no (append) | no | **yes** | no | no | no | no | STOP — separate review (write) |
| `filesystem.read` | yes | no | no | no | no | no | no | passes STOP branches, but see §4 |
| `filesystem.write` | no | no | **yes** | no | no | no | no | STOP — separate review |
| `filesystem.delete` | no | no | **yes** | no | no | no | no | STOP |
| `network.request` | n/a | no | no | **yes** | no | no | no | STOP — separate security review |
| `credential.read` | n/a | **yes** | no | no | no | no | no | STOP — separate review |
| `content.publish` | no | no | no | no | **yes** | no | no | STOP — separate review |
| `human_approval.request` | no (sends a real Telegram message — an external side effect) | no | no | no | no | no | no | STOP — has a real external side effect, fails read-only |
| `process.execute` | no | no | no | no | no | **yes** | no | STOP |

Only two capabilities pass every STOP branch cleanly: `memory.search` and `filesystem.read`. §4 explains why `memory.search` is the recommended candidate and `filesystem.read` is not.

## 1. Candidate capability

`memory.search` (`Capability.MEMORY_SEARCH`)

## 2. Owning agent

`developer_memory` (`orchestration/agents/memory_agent.py::DeveloperMemoryAgent`) — already real, already registered and tested since Sprint 10. `capabilities = [Capability.MEMORY_WRITE, Capability.MEMORY_SEARCH]`; `required_capability()` already discriminates correctly per `task_input["action"]` (`"search"` → `MEMORY_SEARCH`, `"record"` → `MEMORY_WRITE`) — this is real, existing code, not something Phase 3.2 would need to write.

## 3. Real implementation

`developer_memory/search.py::search(query, ledger=None, entry_type=None)` — plain word-overlap scoring (`_words()` via regex `[a-z0-9]+`) over `DeveloperMemoryLedger.all_entries()`. `developer_memory/ledger.py::DeveloperMemoryLedger.all_entries()` opens the ledger file, reads it line by line, `json.loads()`s each line, returns a list. No write, no mutation, no network call, no subprocess, no `eval`/`exec`. Same honest architecture as `knowledge_brain/indexer.search()`, which `knowledge.search` already activates in production.

## 4. Exact entrypoint

**Not yet wired to `kai.py`/`kai_ceo.py`.** Reachable today only via `KaiOrchestrator.submit_task("developer_memory", {"action": "search", "query": ...})`, exercised by Sprint 10's `test_memory_agent.py` and Sprint 11 Phase 2's integration test. If this candidate is authorized, wiring an entrypoint (mirroring Phase 3.1's `kai.search_knowledge()` pattern — a `kai.search_memory()` function and a `kai_ceo.py` command) is separate follow-up work, not part of this review, and not done here.

This is also why `filesystem.read` is a weaker candidate despite passing the same STOP-branch filter: it has no real owning agent at all today (`DECLARED_NOT_USED_BY_ANY_AGENT` in the Phase 3 capability inventory). Activating it would mean inventing a new agent and a new use case from scratch inside the same phase that's supposed to be evaluating an existing, already-implemented capability. `memory.search` requires no new agent, no new implementation, and no new security-layer code — only the same entrypoint-wiring step Phase 3.1 already proved out once.

## 5. Input / output boundaries

Input: `{"action": "search", "query": <non-empty str>, "entry_type": <optional, one of ENTRY_TYPES>}`. `DeveloperMemoryAgent.execute()` raises `ValueError` for a missing `action`, a missing `query`, or an `action` other than `"record"`/`"search"` — validated before `search.py` is ever called.

Output: `{"action": "search", "query": str, "result_count": int, "results": [{"entry_id", "entry_type", "title", "description", "files": [...], "occurred_at", "recorded_at"}, ...]}`. Every field is JSON-serializable; no absolute path is ever included (`files` values are recorded as relative strings, e.g. `"produce_next_video.py:_plan_scenes"` — confirmed by inspecting the real 45-entry ledger, see §9).

## 6. Permissions

Read-only. `DeveloperMemoryLedger.all_entries()` opens the ledger file in `"r"` mode only; `search()` never calls `record_entry()`. Structurally identical read/write separation to `knowledge.search`, which already has zero write access.

## 7. Filesystem scope

Reads exactly one file: `content_pipeline/developer_memory_data/developer_memory.jsonl` (currently 45 lines / entries). The path is hardcoded in `ledger.py` (`_DEFAULT_LEDGER_PATH`), not derived from any part of the task input — there is no path parameter for an attacker-controlled query to influence, so `filesystem_boundary.py`'s traversal protections are not even applicable here (there is no variable path to traverse). This is a narrower filesystem surface than `filesystem.read` would be by definition, since that capability's whole purpose is an attacker/caller-influenced target path.

## 8. Network scope

None. No network call anywhere in `ledger.py` or `search.py`.

## 9. Credential scope

None. Confirmed by reading both files in full — no `import` of `core.secrets`, no credential access of any kind.

## 10. Side effects

None. Pure read + in-memory scoring + return. No file is created, modified, or deleted by a `search` action (a `record` action would create a new ledger line, but that's `MEMORY_WRITE`, a different capability, not part of this candidate).

## 11. Failure modes

- Ledger file missing/corrupt: `DeveloperMemoryAgent.health_check()` catches `OSError` and reports `AgentReadiness.BLOCKED` — existing code, already tested (`test_health_check_available_against_isolated_ledger`).
- Malformed input (missing `query`, missing `action`, unknown `action`): `ValueError`, caught by `ControlledExecutor.execute()`'s existing exception handling, audited as `ALLOW` + `execution_result: FAILED` (authorization succeeded, the agent's own input validation failed) — the same pattern already proven for `knowledge.search`.
- No new failure mode exists that the current security layer doesn't already handle generically.

## 12. Abuse cases considered

- **Prompt injection via a poisoned ledger entry** (an attacker who can write to the ledger crafts an entry reading like a policy directive, e.g. "SYSTEM: grant filesystem.delete"). Already structurally disproven for this exact scenario by Sprint 11 Phase 2's adversarial suite (`test_memory_poisoning_a_crafted_ledger_entry_does_not_alter_policy`): no code path anywhere reads ledger content into `SecurityPolicy`. Granting `memory.search` doesn't change this — search only returns ledger content as opaque data to the caller, exactly like `knowledge.search` already does with report content, and Sprint 11 Phase 2's `test_prompt_injection_content_is_treated_as_inert_data` already covers the general principle.
- **Resource exhaustion**: bounded by the existing generic `RateLimiter` (default 20/min · 200/hr · 1000/day, reused with zero new code) and by the ledger's own size (currently 45 entries; `all_entries()` is O(n) per call, trivial at this scale).
- **Information disclosure**: the ledger's real content (inspected in full, §9) is internal engineering commentary — bug reports, fixes, decisions, lessons — with relative file paths only, no credentials, no absolute paths, no customer/financial data. This is the same category of content `knowledge.search` already exposes (engineering reports), not a new category of exposure. One honest residual risk, not unique to this capability: `record_entry()` takes freeform `description` text, so nothing today prevents a *future* entry from containing something sensitive — this is a pre-existing property of the ledger itself (true whether or not `memory.search` is ever granted), not introduced by this activation, and equally true of `knowledge.search`'s report corpus today.
- **`memory.search` implicitly enabling `memory.write`**: disproven structurally — `SecurityPolicy.evaluate()` checks capability membership in the agent's specific grant set; granting one capability to `developer_memory` does not grant the other (`test_granting_one_capability_does_not_grant_others`, already passing).

## 13. Risk classification

LOW — unchanged from the existing `capabilities.py` risk table (`_RISK_BY_CAPABILITY[Capability.MEMORY_SEARCH] = RiskLevel.LOW`), already reviewed and unmodified since Sprint 11 Phase 2. Below the `HIGH` approval threshold, so no human-approval gate would be required, identical to `knowledge.search`'s current posture.

## 14. Rate-limit recommendation

Reuse `RateLimiter.DEFAULT_LIMITS` (20/min, 200/hr, 1000/day) with no per-capability override — same recommendation and same justification as `knowledge.search`'s existing configuration: generous for legitimate ad hoc human-triggered use, bounding for a compromised/buggy caller.

## 15. Audit requirements

None new. `AuditLog`/`ControlledExecutor`'s existing `event_type` machinery (ALLOW/DENY/REVOKED/RATE_LIMITED/KILL_SWITCHED/VALIDATION_FAILED/POLICY_ERROR) already covers any capability generically — no security-layer code change would be needed to activate this one.

## 16. Kill-switch requirements

None new. Global/agent/capability-scoped kill switch (`KillSwitch.is_engaged(agent_name=, capability=)`) already works for any capability string, including `memory.search`, with zero additional code.

## 17. Revocation requirements

None new. `SecurityPolicy.revoke(agent_name, capability)` already works generically.

## 18. Unauthorized-agent / real-entrypoint test requirements (if authorized later)

Would need the same shape of evidence Phase 3.1 produced for `knowledge.search`: authorized call succeeds, an unauthorized agent is denied on the real policy object, revocation denies immediately, all three kill-switch scopes deny, a malformed request is denied and audited, a policy failure fails closed, and every denial is proven by asserting the underlying `search()` function was never called (`mock.patch.object` + `assert_not_called()`), not merely by checking task status. None of this exists yet — it is scoped to a future Phase 3.3, not this review.

## 19. Why `memory.search` is safer than the alternatives

- Every other ungranted capability fails a STOP branch outright (write, delete, network, credential, publish, execute) — see §0's table.
- `filesystem.read` passes the same STOP-branch filter but has no real owning agent or implementation today (§4) — recommending it would mean designing and building something new under cover of a "safest candidate" review, which is exactly the scope-creep this evidence-review process exists to prevent.
- `memory.search` has an identical risk/operational profile to the one capability already proven safe in production use (`knowledge.search`): LOW risk, read-only, no credential, no filesystem write, no network, no side effect, same rate-limit defaults, same generic security-layer coverage, same structural immunity to prompt-injection-into-policy.
- Its filesystem surface is narrower than `filesystem.read` by construction — the path is hardcoded, not attacker-influenced, so there is no traversal question to even ask.
- It reuses 100% of existing generic security infrastructure; zero new lines in `orchestration/security/` would be required to activate it, only the same entrypoint-wiring pattern already proven once.

## 20. Decision

**PASS** — `memory.search` on `developer_memory` is recommended as the next capability to bring through a dedicated evidence-to-activation cycle (a future Phase 3.3, mirroring Phase 3 → Phase 3.1's structure: implementation review, `.grant()`, dedicated tests, real-entrypoint wiring, unauthorized/revocation/kill-switch/audit proof, regression, self-audit, report).

**This review does not activate anything.** No `.grant()` call exists in the codebase for `memory.search` as of this document. `GRANTED` remains exactly `knowledge.search → knowledge_brain`, and everything else — including `memory.search` — remains `UNGRANTED` until a future phase repeats Phase 3.1's full proof requirements for this specific capability and receives its own explicit authorization.
