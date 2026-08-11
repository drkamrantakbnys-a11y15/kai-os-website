# PROJECT KAI — OPERATING RUNBOOK

Practical day-to-day manual. For architecture history and how each piece came to exist, see the sprint reports (`PROJECT_KAI_FINAL_*_STATUS.md`/`_REPORT.md` series). This document is meant to stay current — update it when a command, path, or behavior changes.

## Daily check: is everything healthy?

```bash
cd D:\JARVIS_SYSTEM\KAI_OS
python infrastructure_health_check.py
```
Read-only, ~5 seconds, checks Ollama, env vars, both YouTube channels, the content queue (including stale items), recent production errors, disk space, the scheduled task, Supabase, and token-file `.gitignore` coverage. Add `--json` for machine-readable output (a `severity` of GREEN/YELLOW/RED and a `repair_category` on every problem). Never modifies anything — every RED/YELLOW is a real fact for you to act on, not something this script fixes itself.

## YouTube — channel status

```bash
python youtube_channel_status.py
```
Prints PRIMARY and SECONDARY authentication/verification status. Never prints tokens or secrets.

## YouTube — authorizing a channel (interactive, human-only)

```bash
python authorize_youtube.py primary      # ProjectKAIAI
python authorize_youtube.py secondary    # Project Kai AI Lessons
```
Opens a real browser OAuth consent screen. **The same Google account owns both channels** — if prompted to pick a channel/brand account, pick the one matching the destination you asked for. The script verifies the actual returned channel ID before saving anything:
- Match → saves to `youtube_primary_token.json` or `youtube_secondary_token.json`, backing up any existing token first (never overwritten, never deleted).
- Mismatch → prints `WRONG CHANNEL AUTHORIZED`, discards the new token, leaves the existing one (if any) completely untouched.

Never run this speculatively "just to see" — it's a real, if reversible, action against Google's OAuth flow.

## YouTube — approving and uploading a produced video

```bash
python approve_and_upload.py PK-XXX
```
Only works on a topic with `status: "produced_awaiting_review"`. Resolves its destination from an explicit `destination_channel` field on the topic (`"primary"`/`"secondary"`, defaults to `"primary"` if absent), then calls the channel-identity-verified upload path — refuses to upload if the authenticated token doesn't match the expected channel for that destination. Idempotent: safe to re-run after a crash, will not double-upload.

**Never uploads publicly** — every video goes up `private` with a scheduled `publishAt`; YouTube itself flips it public at that time.

## Production pipeline — how a video gets made

```bash
python produce_next_video.py
```
Normally run by the scheduled task (see below), not by hand. Runs real preflight checks first (Ollama reachability with bounded retries, required env vars) and stops cleanly — no partial work, a logged/Telegram-notified failure — if they don't pass. Picks the next `queued` topic by priority, produces script/visuals/voice/captions/thumbnail/metadata, and stops at `produced_awaiting_review` for a human to look at before `approve_and_upload.py` runs.

## Scheduled automation

Task name: `KAI_OS_Content_Production`. Check its real state:
```bash
schtasks /query /tn "KAI_OS_Content_Production" /fo LIST /v
```
**Known limitation as of this writing**: only a logon trigger exists (no fixed daily schedule), and modifying it requires Administrator elevation this environment doesn't have by default. To add a daily trigger, open PowerShell **as Administrator** and run:
```powershell
$task = Get-ScheduledTask -TaskName "KAI_OS_Content_Production"
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At "08:00"
$newSettings = $task.Settings
$newSettings.StartWhenAvailable = $true
Set-ScheduledTask -TaskName "KAI_OS_Content_Production" -Trigger ($task.Triggers + $dailyTrigger) -Settings $newSettings
```

## Self-upgrade / change proposals

Every non-trivial infrastructure change should be recorded before being applied:
```python
from developer_memory.ledger import DeveloperMemoryLedger
ledger = DeveloperMemoryLedger()
proposal = ledger.record_change_proposal(
    title="...", reason="...", files=["..."],
    risk_level="LOW",  # LOW / MEDIUM / HIGH / CRITICAL
    tests_required="...", expected_result="...",
)
```
Always starts `PENDING_HUMAN_APPROVAL` — there is no code path that self-approves. To record what happened after review:
```python
ledger.record_change_outcome(proposal["entry_id"], approval_status="APPROVED")  # or REJECTED / APPLIED / ROLLED_BACK
```
This never edits the original proposal row — the ledger is append-only; read both to get the full history of a change.

To review open proposals:
```python
from developer_memory.ledger import DeveloperMemoryLedger
ledger = DeveloperMemoryLedger()
for e in ledger.by_type("change_proposal"):
    if e.get("approval_status") == "PENDING_HUMAN_APPROVAL":
        print(e["entry_id"], e["title"], e["risk_level"])
```

## Website

```bash
cd D:\JARVIS_SYSTEM\kai-os-website
npm run build       # production build, 31 pages
npx astro dev        # local dev server
```
Fully static (`output: "static"`) — no server-side code, all backend calls (when Supabase is configured) go browser→Supabase directly, authorized by Row Level Security using only the public anon key. Never add a service-role key to any client-visible file or `PUBLIC_*` env var.

**Activating the backend**: create a Supabase project → run `supabase/schema.sql` in its SQL editor → `insert into admins (email) values (...)` → enable email auth in the dashboard → set `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` in `kai-os-website/.env` → `npm run build`. No code changes needed — every comment/reaction/bookmark/feature-request/admin/analytics component already checks for these two variables and switches out of DEMO MODE automatically.

## Content routing

`src/data/contentRouter.js`'s `routeContent({category, ...scores})` is deterministic — a lookup table plus a fallback score comparison, never an LLM. Every result includes `recommended_channel_id`/`secondary_channel_id` (real channel IDs, matching `youtube_gateway.py`'s registry exactly) and a real `safety_flags` array — non-empty when the router had low confidence or no real signal, meaning: send this one to a human, don't trust it blindly. Verify it any time with:
```bash
cd kai-os-website
node scripts/verify-router.mjs
node scripts/verify-router-production-test.mjs
```

## Testing — full regression

```bash
cd D:\JARVIS_SYSTEM\KAI_OS
./venv/Scripts/python.exe -m pytest orchestration/tests/ test_kai.py test_kai_ceo.py test_kai_entrypoint_security.py test_kai_memory_search_activation.py test_kai_memory_write_activation.py test_produce_next_video.py test_approve_and_upload.py test_production_recovery.py test_collect_analytics.py test_authorize_youtube.py test_youtube_channel_status.py test_infrastructure_health_check.py developer_memory/tests/ desktop_operator/operator_command_control_tests/ -q
```
Current baseline: **647/647 passing**. Use `venv/Scripts/python.exe`, not the bare system `python` — the venv is the only interpreter with `pytest` installed.

## Security checklist (re-run periodically)

```bash
git check-ignore -v youtube_primary_token.json youtube_secondary_token.json youtube_token.json
grep -rEn "sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{35}|service_role" kai-os-website/dist/
```
Both should show every token file matched by `.gitignore`, and the secrets grep should return nothing.

## Absolute boundaries (do not change without explicit authorization)

- Never delete or destructively modify either YouTube channel (`ProjectKAIAI`, `UCgEKqjS1eM4Q8KUxloKVNKA`; `Project Kai AI Lessons`, `UC75pRQ4fzmpNDXUSaI9BNKQ`).
- Never route a YouTube upload by channel name, Google account, or browser state — channel ID only, via `verify_kai_youtube_channel(destination=...)`.
- Never touch the trading system (`core/trading/`, `core/quant_research/`, `dashboard/`) from this codebase's content/website work.
- Never commit `.env`, `.env.*` (except `.env.example`), or any `youtube_*_token.json*` file.
- Never let a `change_proposal` reach `APPLIED` without a preceding human-reviewed `record_change_outcome(..., approval_status="APPROVED")`.
