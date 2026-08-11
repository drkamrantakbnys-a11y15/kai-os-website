# Sprint 11 — Capability Activation Evidence Review #2

Read-only. No file was modified while producing this document. No `.grant()` call was added. `activated_policy.py` was not touched.

## Executive Summary

Every capability in the closed vocabulary was re-enumerated directly from source (not from prior reports) and run through a 30-question security gate plus an explicit hard-stop list. Of the 9 currently-ungranted capabilities, all 9 fail at least one hard-stop condition — 8 have no real owning agent or implementation at all, and the 9th (`memory.write`) performs a genuine filesystem write. **Zero candidates pass. No capability should be activated this round.**

## Current Authorization State (verified live, not assumed)

```python
from orchestration.security.activated_policy import build_phase3_activated_policy
```
Grants exactly two (agent, capability) pairs:
- `knowledge_brain` → `knowledge.search`
- `developer_memory` → `memory.search`

Confirmed by evaluating every (agent, capability) pair for both real agents against the real policy object — no other pair returns `ALLOW` or `REQUIRES_APPROVAL`. Confirmed by `grep`: exactly 2 `.grant()` call sites exist anywhere in the non-test codebase, both in `activated_policy.py`. Confirmed: exactly one `SecurityPolicy` class exists (`orchestration/security/policy.py`) — no second authorization mechanism anywhere. Kill switch confirmed released at all scopes (global, `knowledge_brain`, `developer_memory`). Test baseline confirmed: **204/204 passing** (`orchestration/tests/`, `test_kai.py`, `test_kai_ceo.py`, `test_kai_entrypoint_security.py`, `test_kai_memory_search_activation.py`), unchanged from the Sprint 11 Phase 3.3 / Sprint 12 baseline.

## Complete Capability Inventory (mechanically enumerated from `Capability.ALL`, cross-referenced against real agent classes)

| Capability | Risk | Owning agent (real, from `Agent.capabilities`) | Status |
|---|---|---|---|
| `knowledge.search` | LOW | `knowledge_brain` | **GRANTED** |
| `memory.search` | LOW | `developer_memory` | **GRANTED** |
| `memory.write` | LOW | `developer_memory` | DECLARED, owned, ungranted |
| `filesystem.read` | LOW | none | DECLARED, no owning agent |
| `filesystem.write` | MEDIUM | none | DECLARED, no owning agent |
| `filesystem.delete` | HIGH | none | DECLARED, no owning agent |
| `network.request` | MEDIUM | none | DECLARED, no owning agent |
| `credential.read` | HIGH | none | DECLARED, no owning agent |
| `content.publish` | HIGH | none | DECLARED, no owning agent |
| `human_approval.request` | MEDIUM | none | DECLARED, no owning agent |
| `process.execute` | HIGH | none | DECLARED, no owning agent |

No capability exists outside this 11-item closed vocabulary (`SecurityPolicy.evaluate()` denies anything not in `Capability.ALL` before checking grants at all — an "UNAVAILABLE" capability in the strictest sense is any string not in this set, which is denied by construction, not something to enumerate individually).

**PLANNED, not a declared capability today**: `desktop_operator/` is real, extensively tested architecture (command/control and approval-gating infrastructure) but is not wired to any `Capability` constant and owns no agent registered with `KaiOrchestrator`. It is not a candidate this round — granting anything requires an existing `Capability` constant, and declaring a new one is itself a code change outside this review's read-only scope. Noted for completeness, not evaluated further.

Only 2 real agent classes exist at all: `KnowledgeBrainAgent`, `DeveloperMemoryAgent` (`orchestration/agents/*.py`, confirmed by directory listing). Every capability without one of these two as its owner has zero real implementation to activate, full stop.

## Candidate Capabilities

Only capabilities with a real owning agent are even nominally eligible for activation without inventing new infrastructure (which is out of scope for "activate an existing capability"). That leaves exactly one candidate: **`memory.write`** (owned by `developer_memory`, the same agent `memory.search` already runs on).

## Security Gate Matrix — `memory.write`

| # | Question | Answer |
|---|---|---|
| 1 | Real implementation exists? | Yes — `developer_memory/ledger.py::DeveloperMemoryLedger.record_entry()` |
| 2 | Real owning agent exists? | Yes — `DeveloperMemoryAgent`, already registered and granted `memory.search` |
| 3 | Implementation reachable? | Yes — `DeveloperMemoryAgent.execute({"action": "record", ...})` |
| 4 | Read-only? | **No.** |
| 5 | Can modify files? | **Yes** — appends a new line to `content_pipeline/developer_memory_data/developer_memory.jsonl` |
| 6 | Can delete files? | No — append-only, no delete/update path exists in `ledger.py` |
| 7 | Arbitrary filesystem paths? | No — path is hardcoded (`_DEFAULT_LEDGER_PATH`), not attacker-influenced |
| 8 | Credential access? | No |
| 9 | Environment variable access? | No |
| 10 | Network access? | No |
| 11 | Subprocess invocation? | No |
| 12 | Arbitrary code execution? | No |
| 13 | Attacker-controlled target/path/command? | No — path fixed; `title`/`description`/`files` are free-text *content*, not a path or command |
| 14 | Attacker-controlled data alters policy decisions? | No — nothing reads ledger content back into `SecurityPolicy` (re-verified this session, matching Sprint 11 Phase 2's adversarial test) |
| 15 | Publishes externally? | No |
| 16 | Sends external messages? | No |
| 17 | Financial/trading effect? | No — no trading capability exists in the vocabulary at all |
| 18 | Creates persistent state? | **Yes** — every call permanently adds one line to a real, on-disk, append-only ledger. This is the operative difference from `memory.search`: a granted, denied, or even successfully-executed `memory.write` call leaves a permanent trace an operator did not necessarily review beforehand, whereas every currently-active capability (`knowledge.search`, `memory.search`) is a pure read with zero persistent side effect. |
| 19 | DoS via resource consumption? | Bounded in principle by the existing generic rate limiter, but unlike a read, each call grows a real file with no cap — an authorized-but-compromised caller could write an unbounded number of real entries within the rate limit's ceiling (e.g. 1000/day, every day, indefinitely) with no existing rollback/cleanup mechanism. |
| 20 | Meaningful existing tests? | Yes — `test_memory_agent.py::test_record_writes_a_real_entry` and related, but these test the *agent's* input validation, not a security-reviewed record-content policy (there is none) |
| 21 | Output validated before returning? | The `record` dict is returned as-is; no content-safety check exists on `title`/`description`/`files` before they're written to disk |
| 22 | Fully stoppable by kill switches? | Yes — generic mechanism, would apply automatically if granted |
| 23 | Independently revocable? | Yes — generic mechanism |
| 24 | Rate-limitable? | Yes — generic mechanism |
| 25 | Success/denial auditable? | Yes — generic mechanism |
| 26 | Secret-shaped input redacted? | Only in the *audit log's* `target`/`denial_reason` fields (existing redaction) — **not** in the ledger entry itself, which is exactly what gets permanently written to disk. A secret-shaped string pasted into `description` would be written to a real file unredacted. This is a materially different risk than `memory.search`, where nothing is ever written. |
| 27 | Unauthorized invocation provably does not execute? | Yes, mechanism-wise (same proof pattern as `memory.search`'s Phase 3.3 tests would apply) |
| 28 | Reversible? | **No** — an append-only ledger has no delete/undo path by design; a bad or malicious entry cannot be un-written, only ignored |
| 29 | Necessary for `developer_memory`'s verified purpose? | Not clearly — the agent's verified, currently-useful purpose (searching engineering history) is already served by the active `memory.search` grant |
| 30 | Activatable without new security mechanism? | Yes, mechanism-wise — but "the mechanism exists" is not the same as "the specific risk is covered" (see #26, #28) |

## Hard-Stop Evaluation

`memory.write` fails explicitly on:
- **"performs filesystem writes"** — confirmed from source (`open(path, "a")` + `f.write(...)`), not inferred.

This alone is dispositive under Phase 3's rules ("A candidate MUST automatically FAIL if any of these apply... performs filesystem writes"). No weakening applied.

Every other ungranted capability (`filesystem.read`, `filesystem.write`, `filesystem.delete`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`) fails explicitly on:
- **"has no real owning agent"** / **"has no real implementation"** — confirmed by directory listing (only 2 agent classes exist) and by the inventory table above.

`content.publish`, `credential.read`, `process.execute` would additionally fail on their own named hard stops (publishes externally / requires credentials / executes arbitrary code) even if an owning agent existed. `human_approval.request`'s only real implementation (`telegram_gateway.py`) sends a real external message, which independently hard-stops it under "sends external communications."

## Attack Surface / Threat Model (for the one candidate that reached a full gate evaluation, `memory.write`)

- **Surface**: one append-only write to one hardcoded file, triggered only by an authorized `developer_memory` call with a `record` action.
- **Threats considered**: (a) a compromised or buggy caller writing unbounded low-value entries within rate limits — bounded but not prevented by existing controls; (b) a secret-shaped string landing in `description` and persisting to disk unredacted — real gap, no mitigation exists today; (c) content-based injection into future `memory.search` results — already disproven as a policy-influence vector, but the entry itself would still be real, permanent, and unreviewed at write time.
- **Filesystem scope**: single hardcoded path, no traversal surface (consistent with `memory.search`'s own scope).
- **Network scope**: none.
- **Credential scope**: none.
- **Execution scope**: none (no subprocess/eval/exec anywhere in `ledger.py`).
- **Persistence scope**: real and irreversible — this is the capability's defining risk, not a formality. Every other currently-active or previously-reviewed capability (`knowledge.search`, `memory.search`) has zero persistence footprint.

## Rate-Limit / Audit / Revocation / Kill-Switch Requirements (if ever reconsidered)

All four are mechanically available today with zero new code (same generic `RateLimiter`, `AuditLog`, `SecurityPolicy.revoke()`, `KillSwitch` used by both active capabilities) — this was not the blocking factor. The blocking factor is the hard-stop itself (filesystem write) plus two unresolved gaps specific to a *write* capability that a *read* capability never exposed: no content-safety/secret-redaction check before a ledger line is written, and no reversal mechanism for a bad entry once written.

## Failure Behavior

Not evaluated further — the candidate does not reach implementation. For the record, the existing generic fail-closed behaviors (kill switch, policy error, rate limit, validation) would all apply automatically to any future grant without new code, exactly as they already do for both active capabilities.

## Real Implementation / Owning-Agent / Test Evidence

Documented inline in the gate matrix above — all citations are to real, currently-existing source (`developer_memory/ledger.py`, `orchestration/agents/memory_agent.py`, `test_memory_agent.py`), not to prior reports.

## Unauthorized-Execution Proof Requirements (if ever reconsidered)

Would need the same shape of evidence Phase 3.3 produced for `memory.search`: every denial path (unauthorized agent, no grant, revoked, all three kill-switch scopes, malformed request, policy failure, rate limit) proven via `mock.patch` + `assert_not_called()` on `record_entry()` specifically — not yet built, not needed until/unless this capability is separately re-reviewed and authorized.

## Recommended Capability

**NONE.**

## Security Decision

**FAIL** for `memory.write` (the only candidate with a real owning agent). **FAIL** for every other ungranted capability (no real owning agent/implementation, or an independent named hard stop). Overall result: **NO CAPABILITY SHOULD BE ACTIVATED.**

## Reason (precise evidence)

`memory.write` is the only ungranted capability with a real, tested, reachable implementation and owning agent — but it performs a genuine, irreversible filesystem write (confirmed from source: `open(path, "a")`), which is an explicit, non-negotiable hard-stop condition regardless of how narrow or well-scoped the write is. It additionally lacks two controls its currently-active sibling capability never needed: content-level secret redaction before persistence, and any reversal path for a written entry. Every other ungranted capability has no real owning agent or implementation at all, which is independently disqualifying under this review's own rules, and several would also fail their own named hard stops (external communication, credential access, arbitrary execution) even if an implementation existed.

## Hard Stops (triggered)

- `memory.write`: performs filesystem writes.
- `filesystem.read`, `filesystem.write`, `filesystem.delete`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`: no real owning agent / no real implementation.
- `content.publish`: additionally, publishes externally.
- `credential.read`: additionally, requires credentials.
- `process.execute`: additionally, executes arbitrary code.
- `human_approval.request`: additionally, sends external communications (via its only real implementation, `telegram_gateway.py`).

## Implementation Required (if `memory.write` — or any capability — is reconsidered in a future review)

- A content-level check (not just the existing audit-log redaction) that inspects `title`/`description`/`files` for secret-shaped strings *before* the ledger write occurs, since the audit log's existing redaction never touches the persisted ledger content itself.
- An explicit decision on reversal: either accept irreversibility as a documented, bounded risk (with a tighter rate limit than the current generic default) or add a real correction/redaction mechanism for a bad entry — neither exists today.
- The full Phase 3.3-style proof suite: authorized/unauthorized/no-grant/revoked/re-granted/three kill-switch scopes/malformed request/policy failure/rate limit/audit success+denial, each proving `record_entry()` was not called on denial paths.
- A fresh, dedicated evidence review — this document is not that authorization, and does not recommend proceeding to one.

## What Must Remain Ungranted

`memory.write`, `filesystem.read`, `filesystem.write`, `filesystem.delete`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`. No trading capability exists in the vocabulary and none should be added without its own dedicated security architecture review, per the standing trading boundary.

## 30-Video Production Status (single read-only check)

- Completed: 5
- Awaiting review: 12
- Queued: 13
- Running: 0 (no lock file found)
- Failed: 0 surfaced by this check

Not restarted, not modified, not interfered with. `topic_queue.json` was only read, never written, during this review.
