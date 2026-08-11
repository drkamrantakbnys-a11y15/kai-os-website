# Project KAI — Website Data Integration

Sprint 2 deliverable. Documents the real bridge now connecting `KAI_OS` to `kai-os-website`.

## Source of truth

`D:\JARVIS_SYSTEM\KAI_OS\scripts\generate_public_website_data.py`, run manually (or as a future deploy step — not currently automated) from the `KAI_OS` repo root. It reads real files on disk and writes one JSON file:

`kai-os-website/src/data/generated/kai-os-public-data.json`

This is the **only** generated public data source. Per Sprint 2 Step 12, no competing files (`agents-live.js`, `agents-status.js`, etc.) were created. `src/data/agents.js` — the existing, hand-curated, richly-detailed per-agent source — is untouched and remains the editorial source of truth for agent narrative content (purpose, inputs, outputs, dependencies, roadmap). The generated file supplies aggregate, mechanically-verifiable facts that supplement it, and one real cross-check between the two (see "Failure behavior" below).

## Real data sources read

| Field(s) | Read from | Method |
|---|---|---|
| `agents.total_capabilities`, `capability_status_counts`, `autonomy_status_counts` | `kai-os-website/src/data/agents.js` | Regex-parses the already-curated `capabilityStatus`/`agentStatus` fields — does not re-derive judgment calls, only tallies them |
| Cross-check count | `KAI_OS/sub_agents/agents.py` | Counts `class \w+(SubAgentSkeleton):` occurrences; must equal `agents.js`'s count or the script refuses to generate (see below) |
| `desktop_operator.test_file_count` | `KAI_OS/desktop_operator/` | Counts `test_*.py` files on disk |
| `desktop_operator.status`, `status_detail`, `human_control` | Hand-written in the generator, based on reading the package's own module docstrings (`desktop_operator/__init__.py`, `execution_readiness/__init__.py`, etc.) during this sprint — **this is the one field set that is prose, not purely mechanical**, because "what a subsystem's real status is" required reading and judgment, not just counting. Flagged here for exactly that reason. |
| `engineering.total_test_files` | Whole `KAI_OS` repo | Counts `test_*.py` files, excluding venv/dependency directories |
| `production.queue_total`, `queue_status_counts`, `completed_total` | `KAI_OS/content_pipeline/topic_queue.json` | Reads the real `queue`/`completed` arrays directly |

## Sanitization rules

1. **Construction-level**: the generator only ever builds output values from the specific fields listed above — it never copies a whole source object wholesale (e.g., it never touches `asset_ledger.jsonl`'s `output_path` field at all, because nothing in the script reads that file).
2. **Output-level gate**: before writing, the script checks the entire serialized JSON string against a forbidden-substring list (`D:\JARVIS_SYSTEM`, `C:\Users`, `.env`, `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `TELEGRAM`, `OAUTH`, `CLIENT_SECRET`, `PRIVATE_KEY`) and refuses to write if any appear.
3. **Independent re-verification**: this sprint additionally ran a second, independent fixed-string scan (not the generator's own check) against both the generated JSON and the full `dist/` build output. Zero real matches. One false positive was investigated and confirmed benign: pre-existing, honest prose in `agents.js` ("YouTube Analytics API OAuth scope not yet authorized") — descriptive text about a scope not yet granted, not a leaked credential.

## Fields exposed

`generated_at`, `note`, `agents.{total_capabilities, capability_status_counts, autonomy_status_counts, source}`, `desktop_operator.{purpose, status, status_detail, human_control, test_file_count, source}`, `engineering.{total_test_files, source}`, `production.{queue_total, queue_status_counts, completed_total}`, `knowledge_brain.{total_reports, root_reports, topic_reports, mechanism, persisted_index, automated, source}` (Sprint 6).

**Sprint 6 addition**: `knowledge_brain_report_counts()` in the generator imports `knowledge_brain/indexer.py` directly (`sys.path.insert` + real import, not a subprocess or file scrape) and calls its real `all_reports()` function, then counts by category. Only counts and category labels leave the generator -- no report file paths, no report content/snippets, since `search()`'s real return value includes a content snippet that is genuine internal engineering material never vetted for public display. The generator never calls `search()`, only `all_reports()`.

## Fields deliberately excluded

Anything from `asset_ledger.jsonl` (especially `output_path` — confirmed to contain full local Windows paths), raw `developer_memory` ledger entries, raw `knowledge_brain` report contents, any `desktop_operator` live evaluator state (there isn't any — see status correction below), per-video `script.json` narration text, and everything on the "must never leave KAI_OS" list from `PROJECT_KAI_PUBLIC_DATA_MAP.md`.

## Update mechanism

Manual today: run `python scripts/generate_public_website_data.py` from `KAI_OS`, then rebuild the website. Not wired into CI or a scheduled job yet — this sprint deliberately did not add new automation/infrastructure per the "no new backend, no new database, no new auth system" constraint. A future sprint could wire this into a deploy-time step; flagged as a real gap, not silently assumed.

## Build integration

The generated JSON is a static file checked into the website's own source tree (`src/data/generated/`), imported directly by Astro components (`import kaiOsData from "../data/generated/kai-os-public-data.json"`) exactly like any other static data import — no runtime fetch, no API call, no live dependency on `KAI_OS` being reachable at build or request time.

## Security considerations

- The forbidden-substring gate runs on every generation, not just this one.
- The full `dist/` build output was independently scanned after this sprint's changes (see Regression Results in the sprint report) — clean.
- The generator script lives in `KAI_OS` (private repo), not in `kai-os-website` — it is never part of the public build itself, only its JSON output is.

## Failure behavior

If a required source file is missing, or if `agents.js`'s agent count and `sub_agents/agents.py`'s real class count ever disagree, the script prints an error to stderr, **writes nothing**, and exits non-zero. The previously-generated JSON file (already checked into the website repo) is left untouched, so the website's last known-good data keeps building correctly rather than the build breaking outright or silently substituting fabricated values. This was a deliberate choice between the two options Sprint 2 Step 13 allowed ("fail clearly" vs. "use a clearly marked last-known-safe dataset") — this implementation does a bit of both: the *generator* fails clearly (loud stderr, non-zero exit), while the *website build* stays on the last-known-safe dataset because nothing forces it to re-run the generator as part of `npm run build`.

## Known limitations

- No automatic regeneration — a real engineering gap, not hidden.
- `desktop_operator`'s status fields are the one part of this pipeline that required human reading and judgment rather than pure counting; if the package's docstrings change, this field needs a human to re-read and update it, not just a re-run of the script.
- The generated data currently powers four surfaces: the homepage `Agents` footer, the `/agents` page's summary strip, the `/status` page, and `/changelog` (static, hand-curated from git log, not from the generator — see its own header comment in `src/data/changelog.js`).
- **Sprint 4 addition**: `agents.js` now has a `layer` field per agent (grouping into Intelligence/Creation/Quality & Safety/Knowledge/Analytics/Operations/Developer Infrastructure), and `AgentEcosystem.astro`'s Analytics/Knowledge Brain nodes now carry a `plannedConnection` flag. Both are editorial additions to hand-curated files, not generated data — they don't touch `generate_public_website_data.py` or `kai-os-public-data.json`, and didn't need to: the underlying facts (each agent's real purpose; which pipeline steps aren't automatically wired yet) were already established, this sprint just made them visible in the UI.
- **Sprint 6 addition**: new `/knowledge` page, powered by the generator's new `knowledge_brain` field. Full read-only inspection of `knowledge_brain/indexer.py` confirmed: no persisted index (fresh scan per call), pure word-overlap keyword search (not semantic), and zero callers anywhere in the codebase outside its own package (repo-wide grep for `from knowledge_brain` / `import knowledge_brain` returned nothing) -- confirming it is genuinely manual-invocation-only, not just described that way in comments. `engineering.total_test_files` was 683 at Sprint 2, 687 by Sprint 6 -- real drift from ongoing engineering work between data-sync runs, not a bug.
