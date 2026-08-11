# Project KAI — Agent Orchestration (Sprint 10)

Documents the real orchestration layer built in `KAI_OS/orchestration/`. Scope is deliberately narrow — see "Why so small" below.

## Architecture

```
KaiOrchestrator
  ├── register_agent(Agent)          -- explicit registration, no auto-discovery
  ├── submit_task(task_type, input)  -- creates a Task, runs it, returns it
  └── health_report()                -- calls health_check() on every registered agent

Agent (abstract contract)
  ├── name, capabilities
  ├── execute(task_input) -> JSON-serializable result, or raises
  └── health_check() -> AVAILABLE | DEGRADED | BLOCKED | NOT_CONNECTED

Real agents registered so far (exactly two):
  ├── KnowledgeBrainAgent   -- adapter over knowledge_brain/indexer.py (search, all_reports)
  └── DeveloperMemoryAgent  -- adapter over developer_memory/ledger.py + search.py (record, search)
```

Both agents are **adapters, not rewrites** — no search or ledger logic was duplicated. `orchestration/agents/knowledge_agent.py` and `memory_agent.py` each import and call the real, pre-existing functions directly.

## Task lifecycle

`orchestration/task.py` implements the full model Sprint 10 specified: `task_id`, `task_type`, `requested_by`, `created_at`, `status`, `current_agent`, `input`, `output`, `errors`, `human_approval_required`, `human_approval_status`, `next_step`, plus `started_at`/`completed_at`/`attempts` for observability.

Statuses: `QUEUED → RUNNING → COMPLETED` or `FAILED`. `WAITING_FOR_HUMAN` and `CANCELLED` exist in the model (per Sprint 10's explicit spec) but are not currently exercised by either real agent — both operations are safe enough to run without a human gate. `WAITING_FOR_HUMAN` is real and tested (see `test_human_approval_required_blocks_execution`), ready for a future agent that needs it.

## Active connections

| Source | Destination | Trigger | Data passed | Error handling | Retry | Human gate |
|---|---|---|---|---|---|---|
| `KaiOrchestrator.submit_task("knowledge_brain", ...)` | `KnowledgeBrainAgent.execute()` → `knowledge_brain.indexer.search()` | Explicit call | `{query, limit}` | Any exception → task FAILED, sanitized message | 1 retry only on `TransientAgentError` (not currently raised by this agent — nothing about a local file read is meaningfully "transient") | None (read-only) |
| `KaiOrchestrator.submit_task("developer_memory", ...)` | `DeveloperMemoryAgent.execute()` → `developer_memory.ledger.record_entry()` / `developer_memory.search.search()` | Explicit call | `{action, entry_type, title, description, ...}` or `{action, query}` | Same | Same | None (append-only, validated by the ledger itself before any write) |

## Remaining disconnected systems (honestly listed, not silently ignored)

- **The YouTube content-production pipeline** (`produce_next_video.py` and its gateway modules — Visual/Voice/Music/Thumbnail/Compliance) is **not** wrapped by this orchestrator. It already runs safely as a working linear script; wrapping it here would duplicate a system that isn't broken, and touching those modules while production is actively running/recovering (PK-014 failed earlier this session from resource contention) is exactly the kind of interference the parallel-work rule exists to prevent.
- **`sub_agents/`'s 13 `SubAgentSkeleton` classes** remain exactly as inert as before — this orchestrator does not wire them to anything, since `.execute()` still unconditionally raises `NotImplementedError` by explicit design.
- **`collect_analytics.py`** remains manual/unauthorized (YouTube Analytics OAuth scope not granted) — not connected.
- **`desktop_operator/`** remains In Development per its own module documentation — not connected, and this orchestrator makes no attempt to.
- **`core/orchestrator.py` and everything under `core/trading/`** — a separate, large, real autonomous-trading system discovered during this sprint's audit (see `PROJECT_KAI_SPRINT10_AUDIT.md`). Explicitly out of scope. This orchestrator does not import, reference, or depend on anything in `core/`.

## Human control points

Unchanged from every prior sprint's finding: Human Review before any video is marked ready, and Publishing itself, remain entirely outside this orchestrator's scope — both stay exactly as human-gated as they were before this sprint. This orchestrator adds a `human_approval_required` mechanism to the task model for future use, but does not retroactively apply it to anything that wasn't already human-gated, and doesn't remove human control from anything that was.

## Failure handling

Any exception from an agent's `execute()` is caught, converted to a sanitized `f"{ExceptionType}: {message}"` string (never a raw traceback, never the exception's `__traceback__`), and the task is marked `FAILED` — never silently treated as success. A dedicated `TransientAgentError` exists for agents to explicitly request one bounded retry (max 2 attempts total); anything else raised is treated as final. Neither real agent currently raises `TransientAgentError` — both operations (local file read, local file append) don't have a meaningful "try again, it might work this time" failure mode, so no retry logic was forced in artificially.

## Security boundaries

- Error messages are sanitized to type+message only before being stored on a task (`_sanitize_error()` in `orchestrator.py`), tested directly (`test_local_paths_in_exceptions_do_not_leak_unsanitized`).
- `KnowledgeBrainAgent` has an explicit second gate (beyond `knowledge_brain/indexer.py`'s own `os.path.relpath()`) refusing to return any result containing an absolute path.
- Neither agent touches `.env`, credentials, or anything under `core/trading/`.
- No new public data was generated or exposed — this is purely an internal KAI_OS capability; nothing here changes `generate_public_website_data.py` or the website.

## Current limitations

- In-memory task log only — restarting the orchestrator process loses task history. No persistence layer was built because nothing in Sprint 10's actual safe scope (two synchronous, fast, local operations) needs one; a real requirement for durable task history across restarts would be a genuine, separate next step.
- Duplicate-task protection compares `(task_type, input)` for exact equality against already-`COMPLETED` tasks only — a reasonable, tested, simple idempotency guard, not a general-purpose distributed dedup mechanism.
- Only two agents exist. Extending this to any content-pipeline capability requires the same audit-first discipline this sprint used — not assumed safe by analogy.

## Test results

31/31 tests passed (`orchestration/tests/`): 15 orchestrator-contract tests (registration, lifecycle, retry ceiling, human-approval branching, duplicate protection, error sanitization, shutdown) + 8 real `KnowledgeBrainAgent` tests (including one true end-to-end task against the real report corpus) + 8 real `DeveloperMemoryAgent` tests (all writes to an isolated temp ledger, never the real `developer_memory.jsonl`).

One additional live demonstration was run directly (not just via the test suite): 3 real tasks through one orchestrator instance — a real Knowledge Brain search (10 real results from the live corpus), a real Developer Memory record, and a real Developer Memory search confirming that record is retrievable — all `COMPLETED`, none fabricated.

## Files

`KAI_OS/orchestration/__init__.py`, `task.py`, `agent_contract.py`, `orchestrator.py`, `agents/__init__.py`, `agents/knowledge_agent.py`, `agents/memory_agent.py`, `tests/__init__.py`, `tests/test_orchestrator.py`, `tests/test_knowledge_agent.py`, `tests/test_memory_agent.py`. Not committed to KAI_OS's git per this session's established practice (KAI_OS changes are written to disk and tested, not git-committed unless explicitly authorized) — flagging that boundary explicitly per Sprint 10's own git-discipline instructions.
