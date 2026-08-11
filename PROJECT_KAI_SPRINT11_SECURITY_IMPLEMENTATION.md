# Project KAI — Sprint 11 Phase 2: Security Architecture Implementation

Status: IMPLEMENTED (Phase 2A–2I complete, tested). Companion to `PROJECT_KAI_SPRINT11_SECURITY_AUDIT.md` (Phase 1 read-only audit).

Scope: the new `orchestration/security/` subpackage and its integration into `orchestration/orchestrator.py`, both in the `KAI_OS` repo. This layer governs only the Sprint 10 orchestrator (Knowledge Brain + Developer Memory agents). It does **not** touch, wrap, or govern `produce_next_video.py`, `core/trading/**`, or `core/orchestrator.py` — those remain entirely outside this sprint's scope, as in Sprint 10.

## 1. Threat model coverage

Phase 1 enumerated 34 threats against the orchestrator. This implementation mitigates the categories that apply to a two-agent, no-filesystem-write, no-network, no-credential-currently-granted system:

- Capability abuse / privilege escalation → `SecurityPolicy` (default-deny, least privilege)
- Malformed / malicious task input → `AuthorizationRequest` validation
- Filesystem traversal → `filesystem_boundary.py` (declared, not yet wired to a granted agent — no agent currently holds a filesystem capability)
- Credential exposure → `credential_gate.py` wrapping `core.secrets`
- Unattended high-risk action → `HumanApprovalGate` (reuses real `telegram_gateway.py`)
- Untraceable action → `AuditLog` (append-only JSONL, secret-redacting)
- Runaway/compromised agent → `KillSwitch` (file-backed, fail-closed on corruption)
- Agent impersonating authority / trusting agent output → `ControlledExecutor` independent re-verification; agent output never consulted for authorization

Threats explicitly **not** mitigated (real, documented gaps — see §7):
- Secret-shaped strings appearing in `task.output` are not scanned or redacted.
- Duplicate `register_agent()` calls with the same `name` silently overwrite the earlier registration.
- Code holding a direct reference to an `Agent` instance can call `.execute()` outside `ControlledExecutor` entirely — Python has no access modifiers to prevent this.

## 2. Capability model

`orchestration/security/capabilities.py` defines a closed vocabulary (`Capability.ALL`). Any capability string not in that set — typo, made-up, or attacker-supplied — is rejected by `SecurityPolicy.evaluate()` before anything else runs, and is classified `RiskLevel.HIGH` by `risk_of()` if ever queried directly (never defaults to LOW).

Currently granted in this sprint: `knowledge.search` (Knowledge Brain agent), `memory.write` / `memory.search` (Developer Memory agent). All other declared capabilities (`filesystem.*`, `network.request`, `credential.read`, `content.publish`, `human.approval_request`, `process.execute`) exist in the vocabulary for future use but have zero grants — any attempt to use them today is denied.

## 3. Policy model

`orchestration/security/policy.py` — `SecurityPolicy` holds an explicit per-agent `AgentGrant` map. `evaluate(agent_name, capability)` returns one of:

- `DENY` — unknown capability, unregistered agent, or capability not in that agent's grant. This always wins over risk classification: an ungranted capability is `DENY` regardless of how risky it is.
- `REQUIRES_APPROVAL` — capability **is** granted, but its risk is at or above `approval_threshold` (default `HIGH`), or a per-agent override forces approval on an otherwise-low-risk capability.
- `ALLOW` — granted and below the approval threshold.

No agent constructor takes a reference to the policy object; only the orchestrator/executor construction path can register grants.

## 4. Enforcement path

`KaiOrchestrator._run()` → `agent.required_capability(task.input)` → build `AuthorizationRequest` → `ControlledExecutor.execute(request, agent, task_input)`:

1. Kill switch checked first (blocks everything, even already-allowed capabilities).
2. Policy re-evaluated **independently** inside the executor — never trusts a decision computed earlier or embedded in the request object itself (verified by `test_independent_reverification_even_with_a_pre_built_request`).
3. `REQUIRES_APPROVAL` → routed to `HumanApprovalGate`, which reuses the existing `telegram_gateway.py` (real Telegram send/poll, owner-chat-ID validated). Denial/timeout/unavailable all raise — none fall through to execution.
4. Only after ALLOW (immediate or post-approval) does `agent.execute(task_input)` run.
5. Every step — ALLOW, DENY, REQUIRES_APPROVAL outcome, execution SUCCESS/FAILED — is written to `AuditLog` before returning or raising.

Security denials (`CapabilityDenied`, `KillSwitchEngaged`, `ApprovalDenied`, `ApprovalTimedOut`, `ApprovalUnavailable`, `RequestValidationError`) are a dedicated branch in the orchestrator's retry loop and are **never retried** — only genuine `TransientAgentError`s are.

## 5. Filesystem boundary

`filesystem_boundary.py::resolve_and_verify()` resolves both the requested path and each allowed root via `Path.resolve(strict=False)`, rejects UNC paths unless a root is itself UNC, and performs case-insensitive containment (`os.path.normcase()`-based, not `Path.is_relative_to()`, which is case-sensitive on Windows). Empty `allowed_roots` always denies. 13 tests cover traversal, sibling-directory-with-shared-prefix (rules out naive string-prefix matching), different drive letters, and UNC paths. Not currently wired to any granted agent — no agent has a filesystem capability yet.

## 6. Credential authority

`credential_gate.py::get_credential_for_agent()` evaluates `Capability.CREDENTIAL_READ` through the same policy before importing `core.secrets` at all. DENY or REQUIRES_APPROVAL both raise `CredentialAccessDenied` — this gate never auto-proceeds past an approval requirement. No new credential-loading code was written; this wraps the existing, real `core.secrets.get_credential()` / `redact()`.

Correction from Phase 1: the audit's claim that `config/provider_config.py` bypasses `core.secrets` for Pexels/Jamendo credentials was re-checked against actual call sites during Phase 2 and found incorrect — `get_provider_setting()` is only ever called for Ollama's non-secret `base_url`/`default_model`. The real Pexels/Jamendo/YouTube credential paths already used `get_credential()` correctly. No change was made to `provider_config.py`.

## 7. Known limitations (honest, not hidden)

| Gap | Why it exists | Mitigation today |
|---|---|---|
| `task.output` not scanned for secret-shaped strings | No agent currently has `CREDENTIAL_READ`, so no real secret can reach output today | Documented, tested (`test_secret_exfiltration_via_task_output_field` asserts the leak occurs), flagged as future work |
| Duplicate `register_agent()` name silently overwrites | Registration is a simple dict assignment, not identity-checked | Documented, tested; only the orchestrator's own construction code calls `register_agent()`, and that code is not attacker-reachable today |
| Direct `agent.execute()` call bypasses all gates | Python has no access modifiers; nothing stops a reference-holder from skipping `ControlledExecutor` | Documented, tested; the boundary is a convention enforced by the orchestrator's own code path, not a language-level seal — anyone extending this system must route through `ControlledExecutor`, never call `.execute()` directly |
| Audit log has no tamper-evidence (no hash chain / signing) | Out of scope for "do not overbuild" — no HSM/signing infra exists in this project | Append-only file, redaction on write |
| `content_pipeline/orchestration_security_data/security_audit.jsonl` is not yet in `.gitignore` | Pre-existing gap, unrelated to this sprint's code | Contains only non-sensitive dev/test event data (verified during this sprint's secrets scan); recommend adding to `.gitignore` as cleanup, not done here to stay in scope |

## 8. Security invariants (verified by the adversarial suite)

1. Default deny — no agent has any capability unless explicitly granted.
2. Unknown capability → HIGH risk, never LOW.
3. Agent output is never treated as an authorization decision.
4. Policy is re-evaluated at the point of execution, never trusted from an earlier check.
5. Kill switch overrides every other decision, including existing ALLOWs.
6. Kill switch fails closed (engaged) on unreadable/corrupt state.
7. Approval denial/timeout/unavailable never falls through to execution.
8. Filesystem containment is case-insensitive and traversal-resistant on Windows.
9. Credential access always goes through the policy gate before `core.secrets` is even imported.
10. Every authorization decision and execution outcome is audit-logged, with secret-shaped values redacted.

## 9. Testing

101 tests in `orchestration/tests/` (31 Sprint 10 lifecycle/registration/retry/approval-flag tests, unchanged in assertions; 70 Sprint 11 security tests including a 12-scenario adversarial/red-team suite in `test_adversarial_simulations.py`). All use fake transports/isolated temp files for anything that would otherwise hit real Telegram or production data. See `PROJECT_KAI_SPRINT11_SECURITY_REPORT.md` for the actual run output.

## 10. Explicitly not built (do-not-overbuild constraint honored)

No Kubernetes, no microservices split, no new database, no cloud IAM integration, no encryption-at-rest for the audit log or kill-switch state (both are non-secret operational metadata), no signing/HSM infrastructure.
