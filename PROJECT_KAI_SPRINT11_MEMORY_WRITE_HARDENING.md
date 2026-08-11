# Sprint 11 — memory.write Security Hardening Phase

**memory.write remains UNGRANTED.** This document describes hardening built to make `memory.write` *eligible* for a future dedicated evidence review — it does not authorize, activate, or recommend activating it. `orchestration/security/activated_policy.py` was not modified; `AgentGrant` for `memory.write` was not added anywhere in the real policy.

## Threat Model

`memory.write` is the only ungranted capability with a real owning agent (`developer_memory`) and a real, reachable implementation (`DeveloperMemoryLedger.record_entry()`). Its defining risk, absent from both currently-active capabilities, is **persistence**: every call permanently appends one line to an on-disk, append-only ledger. Three threats follow directly from that:

1. **Secret exfiltration via persisted content** — a caller pastes a credential-shaped string into `title`/`description`/`files`, and it is written to disk, unredacted, before this phase. (Addressed: Phase A.)
2. **Malformed or oversized input reaching disk** — no prior bound existed on field types, lengths, or unexpected keys. (Addressed: Phase B.)
3. **Irreversibility** — once written, a bad or malicious entry has no correction path by design. (Analyzed, not "solved": Phase E.)

Explicitly *not* new threats introduced by this phase: filesystem path redirection (the ledger's destination was already hardcoded and unreachable from `task_input`, confirmed structurally — see Phase C), network/credential/subprocess exposure (none exist in `ledger.py`, confirmed by source read), and policy tampering via content (already disproven for `memory.search` in Sprint 11 Phase 2/3.3, re-confirmed for `memory.write` in this phase's own tests).

## Exact Write Path

```
DeveloperMemoryAgent.execute({"action": "record", ...})
  -> field-presence / unexpected-field / type / length validation  (NEW, Phase B, in memory_agent.py)
  -> DeveloperMemoryLedger.record_entry(entry_type, title, description, files, occurred_at)
  -> open(self.path, "a") ; f.write(json.dumps(record) + "\n")
```

Preceding all of this, inside `ControlledExecutor.execute()` (the single mediation chokepoint, unchanged in structure):

```
kill switch (global/agent/capability)
  -> SecurityPolicy.evaluate()  (fail-closed wrapped, unchanged)
  -> rate limiter  (unchanged, generic)
  -> filesystem scope check  (not applicable -- MEMORY_WRITE is not a FILESYSTEM_* capability)
  -> content-safety gate  (NEW, Phase A -- content_gate.py)
  -> [approval gate, if REQUIRES_APPROVAL -- not applicable, MEMORY_WRITE is LOW risk]
  -> agent.execute(task_input)
  -> audit event
```

The content-safety gate runs **before** `agent.execute()` is ever called — a rejection means `DeveloperMemoryAgent.execute()`, and therefore `record_entry()`, is never entered at all (proven in `test_memory_write_hardening.py::Q_SecretContentNeverReachesRecordEntryTests`).

## Arguments Reaching `record_entry()`

`entry_type: str` (must be one of `("decision", "bug", "fix", "workaround", "regression", "lesson")`), `title: str`, `description: str`, `files: list[str] | None`, `occurred_at: str | None`. All five come directly from `task_input`, with no transformation beyond the new validation in Phase B.

## What Data Is Persisted

Exactly the dict `record_entry()` constructs: `entry_id` (server-generated UUID), `entry_type`, `title`, `description`, `files`, `occurred_at`, `recorded_at` (server-generated timestamp). No field is redacted or transformed before writing — this is why Phase A rejects the whole record upstream instead of trying to sanitize it in place.

## Exact Filesystem Path Determination

`DeveloperMemoryLedger.__init__(path=None)` — `path` defaults to a **hardcoded** module-level constant (`_DEFAULT_LEDGER_PATH`, resolved once at import time, pointing at `content_pipeline/developer_memory_data/developer_memory.jsonl`). `record_entry()` itself takes **no path parameter at all** (confirmed via `inspect.signature`, asserted in `test_memory_write_hardening.py::S_PathTraversalTests::test_record_entry_signature_has_no_path_parameter`). The only way to change which file gets written is to construct a *different* `DeveloperMemoryLedger` instance with a different `path` — and that construction happens exactly once, at `DeveloperMemoryAgent.__init__()` time (or in a test harness), never per-request, never from `task_input`.

## Can the Path Be Influenced by an Attacker/Request?

**No.** Confirmed two ways: (1) structurally, by the signature check above; (2) behaviorally, by a real test that submits a `files` list containing `../../../../etc/passwd`-shaped strings and a `title` containing an absolute-path-shaped string naming a real file that does not exist yet in the test's own tmpdir, then confirms that file is never created and the real ledger's single ".jsonl" file is the only thing written to. Traversal-shaped or path-shaped strings are stored as ordinary JSON string *data*, never interpreted as a destination.

## Existing Validation (before this phase)

`DeveloperMemoryAgent.execute()` already checked: `action` present; for `record`, `entry_type`/`title`/`description` present; `entry_type` in `ENTRY_TYPES`. Nothing validated types, lengths, or rejected unexpected fields.

## Existing Secret Redaction (before this phase)

`AuditLog._redact_secret_like()` (now `secret_detection.redact_secret_like()`) redacted secret-shaped strings **only in the audit log's own `target`/`denial_reason` fields** — never in the ledger content itself, since nothing previously inspected `task_input` before it reached `record_entry()`.

## Existing Audit Behavior

Every decision (ALLOW/DENY and their sub-categories) was already audited generically by `ControlledExecutor`. No memory.write-specific audit code existed or was needed — the new `CONTENT_REJECTED` event type is just one more value in the same existing `event_type` field.

## Existing Rate Limiting

Fully generic (`RateLimiter`, per-(agent, capability)) — already applied automatically to any capability, `memory.write` included, with zero new code.

## Existing Kill-Switch / Revocation Behavior

Fully generic (three-scope `KillSwitch`, `SecurityPolicy.revoke()`) — already applied automatically, zero new code.

## Existing Failure Handling

Generic fail-closed behavior (policy-error wrapping, validation-failure handling) already covered `memory.write` with zero new code, since none of it is capability-specific.

## Partial Writes

Not possible before or after this phase: `record_entry()` performs exactly one `f.write()` call with a complete, pre-serialized JSON line (`json.dumps(record) + "\n"`) — there is no multi-step write sequence to interrupt. Combined with Phase A running strictly before `record_entry()` is ever called, a rejected write leaves the ledger file byte-for-byte unchanged (asserted directly in `test_memory_write_hardening.py::R_RejectedContentZeroMutationTests`, comparing the raw file bytes before and after).

## Malformed Content Reaching Disk

Before this phase: yes, possible — no type/length/unexpected-field checks existed. After this phase: no known way (validated at the agent level; see Phase B).

## Correction / Deletion

None exists, before or after this phase. See Phase E below.

---

## Phase A — Pre-Write Secret Protection

**New module**: `orchestration/security/secret_detection.py` — extracts the exact regex previously private to `audit.py` (`(?i)(api[_-]?key|token|secret|password|bearer)\s*[:=]\s*\S+|\b[A-Za-z0-9_\-]{32,}\b`) into a shared, public utility (`contains_secret_like()`, `redact_secret_like()`). `audit.py` now imports from this module instead of defining its own copy — same regex, same behavior, verified unchanged by the existing, still-passing audit redaction tests.

**New module**: `orchestration/security/content_gate.py` — `check_content_safe(task_input)`, called from `ControlledExecutor.execute()` for any capability in `CONTENT_SCANNED_CAPABILITIES` (currently exactly `{Capability.MEMORY_WRITE}` — a named allowlist, not "every write capability automatically"). Recursively inspects every string value in `task_input` (covers `title`, `description`, each `files` entry, and degrades safely for any other shape). Raises `ContentRejected` (new `SecurityError` subclass) on the first match, or on **any** exception from the detector itself — an inspection failure is treated as "reject," never as "must be clean" (fail-closed on detection uncertainty, exactly as required).

**Why reject instead of redact-and-save**: redacting a secret in place and still writing the record would let a caller believe their content was stored intact when a piece of it was silently altered — a second, undocumented transformation the codebase would then need to explain, and one that risks a false sense of safety (a redacted-but-still-written record still tells an attacker a secret *existed* at that location and roughly when). An honest, whole-record rejection is simpler, more predictable, and matches the directive's own instruction: "never silently transform sensitive content into something that appears trustworthy."

**Wired**: `ControlledExecutor.execute()` calls `check_content_safe(task_input)` after the rate-limit and filesystem-scope checks, before the approval branch — i.e., strictly before `agent.execute()` under every code path. On rejection, audits `event_type="CONTENT_REJECTED"`, `decision="DENY"`, and raises `ContentRejected` — added to `orchestrator.py`'s `_SECURITY_DENIAL_TYPES` tuple so it is never retried, exactly like every other security denial.

**Tests** (`test_memory_write_hardening.py`, classes `P`, `Q`, `R`): secret-shaped `title`, `description`, and `files` entries each independently rejected; `record_entry()` proven never called (`mock.patch` + `assert_not_called()`); the *agent's own* `execute()` proven never entered at all (proves the gate lives upstream of the agent, not inside it); rejected content proven to cause zero byte-level change to the ledger file; safe, non-secret content proven to still write successfully.

## Phase B — Content Validation

Real input contract, enforced in `DeveloperMemoryAgent.execute()`'s `record` branch, grounded in the real ledger's current content (45 entries measured at review time: title 52–161 chars, description 86–822 chars, 0–2 files per entry, longest file string 72 chars):

| Field | Rule |
|---|---|
| `entry_type` | must be one of `ENTRY_TYPES` (pre-existing) |
| `title` | required, non-empty string, ≤ 500 chars |
| `description` | required, non-empty string, ≤ 5000 chars |
| `files` | optional; if present, must be a list of strings, ≤ 20 entries, each ≤ 300 chars |
| `occurred_at` | optional; if present, must be a string, ≤ 64 chars |
| unexpected keys | any `task_input` key outside `{action, entry_type, title, description, files, occurred_at}` is rejected |

All limits are generous multiples of real observed usage (title: ~3×, description: ~6×, files count: 10×, file length: ~4×) — bounding, not constraining legitimate use. Violations raise `ValueError`, caught by `ControlledExecutor`'s existing exception handling around `agent.execute()`, audited as `ALLOW` (authorization succeeded) + `execution_result: FAILED` (the agent's own input validation rejected it) — the same pattern already established and tested for `memory.search`'s malformed-query case.

**Tests** (class `U`, `V`): missing required field, unexpected field, wrong type for `files`, invalid `entry_type`, oversized `title`/`description`, too many `files` entries, and a positive control proving content at exactly the limits still succeeds.

## Phase C — Filesystem Boundary

No new enforcement code was needed or added. The ledger's destination is fixed at construction time (`_DEFAULT_LEDGER_PATH`, a module-level constant) and `record_entry()` accepts no path argument — there is no per-request path to secure. This was verified, not assumed: structurally (signature inspection) and behaviorally (traversal-shaped and absolute-path-shaped strings submitted as content, confirmed to land only as inert data in the one real ledger file, never as a write destination).

## Phase D — Write Integrity

Proven directly (class tests `C` through `M`, `R`, `X`): capability-not-granted, wrong-agent, revoked, all three kill-switch scopes, malformed `AuthorizationRequest`, policy-backend failure, and rate-limit denial each cause **zero** ledger mutation (asserted via exact pre/post line-count or byte-content comparison, not merely a task-status check). A successful, authorized write is proven to produce exactly the one intended entry, with no possibility of a partial write (single atomic `f.write()` call, content gate strictly precedes it).

## Phase E — Reversibility / Correction Analysis

**No correction, versioning, or supersede mechanism exists in `developer_memory/ledger.py`**, confirmed by reading the file in full: `record_entry()`, `all_entries()`, `by_type()` — no update, no delete, no soft-delete flag, no "superseded_by" field. This matches the module's own docstring ("never overwrite history") and is the same design already shared with `visual_intelligence/ledger.py` elsewhere in this codebase.

**Decision: append-only remains intentional. No correction mechanism was added.** Per the directive's own instruction, deletion/correction was not automatically invented — adding one would itself be a new write-shaped operation requiring its own dedicated security review (a "delete" or "amend" capability is not a smaller version of `memory.write`, it is a different, arguably higher-risk capability), which is out of scope for a hardening phase whose explicit boundary is "do not implement filesystem/... capabilities" beyond what's needed to harden the one already-real candidate.

**Why it remains append-only**: consistency with the existing, already-shared ledger design; avoiding a second write-shaped surface (delete/amend) that would need its own full security review; and because the actual severity of irreversibility is now bounded by Phase A — the single worst irreversible outcome (a secret permanently persisted) is the one this phase specifically prevents.

**What compensates for irreversibility**: Phase A (no secret-shaped content can ever be written); Phase B (malformed/oversized content can't be written either); the existing rate limiter (bounds how much low-value content could accumulate even from a fully authorized, repeatedly-calling source); the existing audit trail (every write's authorization context — actor, timestamp, request ID — is permanently recorded alongside, even though the ledger content itself has no built-in link back to that audit event today).

**What happens if malicious/incorrect-but-not-secret-shaped content is accepted**: it persists permanently, exactly as designed for this ledger, with no automated remediation. This is an accepted, documented limitation of a "never overwrite history" design — not a gap this phase claims to have closed.

## Tests

67 total new/changed test assertions across:
- `orchestration/tests/security/test_memory_write_hardening.py` — **36 new tests**, scenarios A–Z from the directive, all using an isolated (never the real) policy, ledger, audit log, and kill switch.
- No existing test file's assertions were weakened. `audit.py`'s redaction behavior is unchanged (verified by its existing, still-passing tests, now exercising the extracted shared module).

## Known Limitations

- `memory.write` is still **ungranted** — this phase does not change that, and nothing here should be read as a recommendation to grant it. A dedicated evidence review (mirroring Phase 3.2's structure) is still required before any `.grant()` call.
- Content-safety detection is the same conservative, regex-based heuristic already used for audit-log redaction — false positives (rejecting legitimate content that merely looks secret-shaped, e.g. a long hash or ID mentioned in a bug report) are possible and accepted; false negatives are the higher-priority risk this phase minimizes but cannot claim to eliminate.
- No correction/deletion mechanism exists — a mistakenly-accepted, non-secret-shaped bad entry is permanent. Documented, not solved, per Phase E.
- The oversized-content limits (500/5000/20/300/64 chars) are human-reviewed, grounded in real observed data, not mechanically re-derived each time the real ledger grows — if real usage patterns change substantially, these should be revisited.
- This hardening applies only to `memory.write`. No other ungranted capability (`filesystem.*`, `network.request`, `credential.read`, `content.publish`, `human_approval.request`, `process.execute`) was touched, per the explicit sprint boundary.
