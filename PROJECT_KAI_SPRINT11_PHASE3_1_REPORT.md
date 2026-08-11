SPRINT: Sprint 11 — Phase 3.1: Real Entrypoint Wiring

STATUS: COMPLETE

WIRING:
`kai.py` gained `_get_orchestrator()` (a lazy module-level singleton built from `build_phase3_activated_policy()` — Phase 3's real, one-capability policy) and `search_knowledge(query, limit, requested_by)`, which is the only function in this codebase that reaches `knowledge.search`. It submits a task to the real `KaiOrchestrator` exactly as any other caller would — no parallel authorization path exists (verified structurally: `kai.py` never imports the underlying indexer function, never constructs a second `SecurityPolicy`). `kai_ceo.py` gained a `search` command (`"search knowledge for <topic>"`, plus a `_SEARCH_PATTERN` regex) whose handler calls `kai.search_knowledge()` and displays the result or the denial reason — a denial is a normal, non-exceptional CLI outcome.

Execution path, exactly as specified:
`kai.py`/`kai_ceo.py` → `search_knowledge()` → `KaiOrchestrator.submit_task("knowledge_brain", ...)` → `agent.required_capability()` → `AuthorizationRequest` → `ControlledExecutor.execute()` → kill switch → `SecurityPolicy.evaluate()` → rate limiter → (no filesystem scope; not applicable to this capability) → `KnowledgeBrainAgent.execute()` → `AuditLog.record()`.

The real `knowledge.search` implementation (`KnowledgeBrainAgent`, `knowledge_brain/indexer.search()`) was not changed. One integration defect was found and fixed: `kai_ceo.py`'s new search-result display crashed on Windows console output containing non-cp1252 characters (real report prose has smart quotes/em dashes) — fixed with a `_console_safe()` encode/decode step local to the search handler; no other command's output path was touched.

PROOF (all verified by `test_kai_entrypoint_security.py`, run against the real singleton `kai.py` itself uses — 16/16 passed):
- Authorized `knowledge.search` → ALLOW → executes → real audit event recorded (`event_type: ALLOW`, `decision: ALLOW`, `execution_result: SUCCESS`).
- Unauthorized agent (`developer_memory`, an ad hoc impersonator agent registered on the real orchestrator, several other names) → DENY on the real policy object; the impersonator case additionally proves the underlying search function was never called (`mock_search.assert_not_called()`).
- Revoked capability → DENY, `event_type: REVOKED`, search never called; re-granted (fresh singleton) → ALLOW again.
- Global kill switch → DENY, search never called, real switch released and verified released afterward.
- Agent-scoped kill switch (`knowledge_brain`) → DENY, search never called; an unrelated agent scope does NOT block the real capability (negative control).
- Capability-scoped kill switch (`knowledge.search`) → DENY, search never called.
- Malformed request (empty actor), presented to the real singleton's real `ControlledExecutor` → `RequestValidationError`, `event_type: VALIDATION_FAILED` recorded. (Honest note, consistent with Phase 3's own finding: `search_knowledge()`'s normal usage can never itself produce a malformed request — actor/capability are code-controlled and target is pre-truncated — so this proves the real executor's handling, not a reachable real-world path.)
- Policy backend failure (`policy.evaluate()` raising) → `PolicyEvaluationError`, fail-closed, `event_type: POLICY_ERROR`, search never called.
- Secret-shaped query text → redacted in the audit `target` field.

Every "search never called" claim above is enforced by `unittest.mock.patch.object(knowledge_agent, "search")` and an explicit `assert_not_called()` — not inferred from the returned task status alone.

REGRESSION: `python3 -m pytest orchestration/tests/ test_kai.py test_kai_ceo.py test_kai_entrypoint_security.py -v` → **178 passed, 0 failed** (143 from Sprint 10/11 Phase 2/Phase 3, unchanged + 6 existing `test_kai.py` + 13 existing `test_kai_ceo.py` + 16 new Phase 3.1 tests).

SELF-AUDIT: No `os.environ`/`eval`/`exec`/hardcoded secrets/bare `except: pass` in `kai.py`, `kai_ceo.py`, or the new test file. `subprocess` usage in `kai.py` is pre-existing (production script runner) and confirmed not present anywhere in the new search code path. Exactly one `SecurityPolicy` construction site in `kai.py` (`build_phase3_activated_policy()`); zero `.grant()` calls anywhere in `kai.py`/`kai_ceo.py` — no capability was granted beyond Phase 3's original activation. `python3 -m py_compile` clean.

REAL KILL SWITCH: every test that engages the real, file-backed kill switch (global/agent/capability) pairs it with `addCleanup`-guaranteed release. Verified after the full run: `content_pipeline/orchestration_security_data/kill_switch.json` shows `engaged: false` at all three scopes.

30-VIDEO WORKSTREAM (single read-only check, performed once before implementation began; not polled again):
Completed (published): not determined by this check — the queue's `completed` list (used for publish scheduling) was not separately re-parsed this phase; see Phase 3's original check for the same caveat.
Awaiting Review: 12 (`produced_awaiting_review`)
Running: none detected (no lock/marker file for an in-progress run)
Queued: 13
Failed: none surfaced by this check
Remaining: 25 of 25 queued-or-produced items are not yet published; the queue has not been expanded to the full 30-topic target
No production file was read-modified by this phase; `topic_queue.json`'s last real modification predates this session (2026-08-03). This workstream was not interrupted.

TRADING: untouched, ungranted — no trading capability exists in the vocabulary, none was referenced.

CAPABILITIES GRANTED: unchanged from Phase 3 — `knowledge.search` on `knowledge_brain` only. No unintended capability became granted; verified by static grep (zero `.grant()` calls in the new/changed files) and by the unauthorized-agent test suite exercising the real policy object directly.

NEXT STEP: per the completion gate, stopping here. Awaiting a separate evidence review before authorizing any further capability or entrypoint wiring.
