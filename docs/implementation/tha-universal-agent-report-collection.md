# THA universal agent report collection

## Scope and approval

Approved by Colin, THA Governance Owner, 2026-10-19 ("THA — UNIVERSAL AGENT REPORT
COLLECTION, OWNER-APPROVED IMPLEMENTATION"). Objective: ensure every eligible THA
agent-generated report reaches `G:\The Healthy Apples\Incoming\Agent Reports`, regardless of
where it was originally saved, without rebuilding the existing Google Drive sync, without
creating a parallel report collector, and without ever letting an unclassified or excluded
report bypass the existing security-exclusion rules.

## Governance review and the central discovery

`PROJECT_GOVERNANCE.md` and `AGENTS.md` define Gate 5/Gate 9/Governance-Owner authority but
do **not** define any "HOLD"/"owner-review"/"excluded-from-AI" classification scheme by those
names. Searching further found that a complete, mature classification and indexing system
**already exists**, separate from either repository, at
`G:\The Healthy Apples\Knowledge Base\Agent Reports\`:

- `reports-index.csv` (861 rows after this task) — one row per report, with a `secure_review`
  column (`yes`/`no`) and a `status` column, among others.
- `review-queue.md` / `change-queue.json` — the live queue; every item is tagged either
  **`pending Codex GUI review`** (new, not yet reviewed) or **`owner review; excluded from
  AI`** (held; never opened by an AI reviewer).
- `owner-decisions.json` — the only durable record of Colin's own explicit decision to clear
  an `owner review; excluded from AI` item; written only by `owner_review_closure.py`.
- `complete_review.py` — clears a `pending Codex GUI review` item once genuinely reviewed;
  refuses `owner review; excluded from AI` items unconditionally.
- `scan_flagged.py` — the keyword/pattern classifier that assigns a new or changed file's
  queue state; local-only, filenames/categories only, never reproduces matched text.
- `run-daily-index.ps1` → `queue_changes.py` — the existing, already-scheduled daily watcher
  that detects new/changed files and updates the queue.

**[Verified]**: this is the reliable eligibility signal the task asked me to find or, failing
that, propose a replacement for. One did not need proposing — it already exists, is mature
(backed by its own test suite), and this task's job is to feed it, not duplicate or replace
it.

**Decisive, load-bearing fact**: `index_reports.py`'s `SOURCE = Path(r"G:\...\Incoming\Agent
Reports")` — **the entire existing classification/indexing system only ever scans inside
`Incoming\Agent Reports` itself.** Every row in `reports-index.csv` already has its `path`
pointing there. This confirms the actual gap this task exists to close: a report written
anywhere **else** (a `docs/implementation` or `docs/investigations` file in either THA
repository) is invisible to this entire system — not merely unclassified, but never even
scanned — until something places a copy of it inside `Incoming\Agent Reports`. **[Verified]**

## Report-writing pathways surveyed

| Pathway | Writes narrative reports today? | Current destination |
|---|---|---|
| Claude Code (this session, terminal) | Yes | Both: a `docs/implementation`/`docs/investigations` file in the owning repo, and a separately hand-written signed report directly in `Incoming\Agent Reports` — an established convention this session, not automated anywhere in code. |
| Codex CLI | Yes (per the many `CODEX-*`/`THA-*-CODEX-*` reports already indexed) | Historically, directly into `Incoming\Agent Reports` or a repo's `docs/` folder, by the same manual convention. |
| Codex GUI/Desktop | **Unclear; not verified in this task** — `~/.codex/config.toml` configures plugins and MCP servers but nothing found ties a GUI session to a specific report-writing destination. **[Inferred: no programmatic hook point was found; documented as an exact blocker below, not assumed resolved.]** |
| Gate 5 / Gate 9 | **No** — these services produce structured JSON (decision/receipt/current-decision records), not narrative Markdown reports. Narrative reports *about* Gate 5/9 work are written by the agent investigating/implementing against them, already covered under Claude Code/Codex above. **[Verified by reading `server.gate5.mjs`/`server.gate9.mjs` and this session's own extensive prior work against both — neither writes a narrative report file.]** |
| Development Centre | **No** — `start-tha-services.ps1` and its helpers write log files and JSON receipts (`logs/`, acceptance/managed-dev receipts), not narrative agent reports. |
| Bridge investigations/implementations | Yes — this is the same Claude Code/Codex pathway above, applied to Bridge-specific work; no separate mechanism. |

**No existing code anywhere in either THA repository references `Incoming\Agent Reports` at
all** (confirmed by a repository-wide search) — the hand-written, manual convention is the
*entire* current mechanism. **[Verified]**

## Implementation: one common, reusable collection step

Added `collect_report.py` to the existing `Knowledge Base\Agent Reports\` directory (matching
its own established conventions: `pathlib`, atomic temp-file-then-`os.replace` writes, a
focused `unittest` test file, no external dependencies). This is the "one common reporting
requirement reused across all agents" (implementation requirement #1):

```
python collect_report.py --source "<exact absolute path to the finished report>"
```

- **Preserves the original** (requirement #2) — it only ever reads the source; it never
  deletes or moves it.
- **Copies once writing is complete** (requirement #3) — refuses a source that does not end
  with a trailing newline, treating that as evidence the file may still be mid-write (every
  writer already used in this project — the `Write` tool, the Knowledge Base's own atomic
  writers — always ends a finished file with one).
- **Preserves complete content** (requirement #4) — a byte-for-byte `shutil.copy2` copy,
  verified by a post-write SHA-256 comparison against the source.
- **One stable identity** (requirement #5) — the source's absolute path, recorded in a new,
  separate ledger (`collection-state.json`), never the knowledge base's own files.
- **Hash match → no-op** (requirement #6) — re-running on an unchanged source is verified,
  tested, and real (see "Real acceptance evidence" below).
- **Legitimate update → atomic, recoverable overwrite** (requirement #7) — only when this
  tool's own ledger shows it previously placed that exact destination for that exact source.
- **Collision → STOP, never overwrite** (requirement #8) — a destination filename already
  occupied by content this tool has no record of placing there is refused outright.
- **Confirmed delivery, visible failure, no silent partial success** (requirements #9–11) —
  every outcome is a verified hash comparison or an explicit `CollectionError`, printed as
  `{"ok": false, "error": "..."}`; an unreachable destination (tested against a genuinely
  absent drive letter on this machine) fails with a clear message, not a raw traceback.
- **Naming convention preserved** (requirement #12) — the destination filename is always
  exactly the source's own filename; this tool never renames anything.
- **Reuses, does not parallel, the existing hook** (requirement #13) — the existing daily
  watcher (`run-daily-index.ps1`/`queue_changes.py`) is completely unmodified; this tool only
  makes sure files reach the one folder that watcher already scans. Proven, not assumed: see
  "Real acceptance evidence."
- **Google Drive sync untouched** (requirement #15) — nothing about the sync itself, its
  configuration, or its security boundary was read, inspected, or changed; this tool only
  writes ordinary files into a folder that sync already watches, exactly as every
  manually-placed report already does today.

`README.md` in the same directory was updated with a short section describing this step and
its relationship to the existing pipeline (addition only; no existing section was changed).

## Files changed

All new, in `G:\The Healthy Apples\Knowledge Base\Agent Reports\` (not a git repository; no
`.git` found at or above this path):

| File | Change |
|---|---|
| `collect_report.py` | New. The collection tool. |
| `test_collect_report.py` | New. 7 tests: fresh copy, idempotent re-run, legitimate update, collision detection, missing source, partially-written source, unreachable destination. |
| `README.md` | Appended one new section ("Central collection (added 2026-10-19)"); every existing line unchanged. |
| `collection-state.json` | New, created on first real run — the identity ledger. |

No file in `tha-chatgpt-bridge` or `tha-integrated-dev` was changed, beyond this report and
the three report files it describes collecting (listed below, already written in prior
tasks this session; not rewritten by this task).

## Rollback

This directory is not a git repository; its own established convention (seen throughout its
existing files) is dated `.bak`/rollback-folder copies rather than git. Rollback here is
exact and trivial because every change is additive: delete `collect_report.py`,
`test_collect_report.py`, and `collection-state.json`; in `README.md`, remove the appended
"Central collection (added 2026-10-19)" section (its exact boundaries are the section heading
through the end of the file — nothing above it was touched). No existing Knowledge Base file
(`reports-index.csv`, `change-queue.json`, `review-queue.md`, `owner-decisions.json`,
`watch-state.json`, `source-inventory.csv`, `ingestion-log.jsonl`) was edited by this task
directly — their updates below came entirely from running the **existing, unmodified** daily
watcher, which is itself fully reversible by that watcher's own established operation (it
only ever adds/updates queue entries for real file changes; nothing here asked it to do
anything it would not already do for any other new file).

## Real acceptance evidence (not a unit test alone)

1. Collected three already-written, known-safe reports from this session's own immediately
   preceding tasks (`tha-bridge-delegated-agent-governance-full-repair.md`,
   `tha-bridge-worker-trust-enforcement-option-b.md`,
   `tha-codex-os-read-containment-investigation.md`) from their `docs/implementation`/
   `docs/investigations` locations in `tha-integrated-dev` — all three: `{"ok": true,
   "outcome": "copied", ...}`, byte-identical at the destination (verified by direct hash
   comparison, not just the tool's own self-report).
2. Re-ran the first of the three with no change: `{"ok": true, "outcome": "unchanged", ...}`
   — proves requirement #6 for real, not only in the disposable test suite.
3. **Ran the real, existing, unmodified `run-daily-index.ps1`** against the live folders:
   `{"new_or_changed": 6, "pending": 57, "excluded": 36, "missing": 0, "failures": []}`. All
   three newly-collected reports appear in the real `review-queue.md`, correctly classified
   **`owner review; excluded from AI`** (they discuss credential/governance/security topics)
   — proving the existing classification pipeline, completely unchanged, correctly holds
   them. **This is the single most important piece of evidence in this report**: it proves
   the new collection step does not create a bypass — a newly-collected report about
   sensitive infrastructure was automatically held by the pre-existing rules, not trusted
   merely because it was new or self-authored.
4. Ran the existing Knowledge Base's own full test suite (`test_index_reports.py`,
   `test_queue_changes.py`, `test_owner_review_closure.py`,
   `test_record_new_held_review.py`, `test_validate_historical_review.py`) — all pass,
   unaffected.

## Existing reports — historical reconciliation (inventory only; nothing bulk-copied)

Filename-only comparison (no content opened) between every `docs/implementation`/
`docs/investigations` file in each repository and the current contents of `Incoming\Agent
Reports`:

- `tha-chatgpt-bridge`: 38 candidate files; **35 have no matching filename** in the central
  folder today.
- `tha-integrated-dev`: 62 candidate files; **all 62 have no matching filename** in the
  central folder today.

**These 97 files are explicitly not bulk-copied by this task.** None of them has ever been
scanned by `scan_flagged.py`; copying 97 files with completely unknown content in bulk,
including a materially non-zero chance that older ones predate this project's later,
hard-won credential-handling discipline, is exactly the "uncontrolled bulk copying" this
task's own brief prohibits. The smallest owner-governed next step is: Colin names a batch (or
asks for one, filename-by-filename or by date range) to be collected, mirroring exactly how
the existing Knowledge Base's own owner-decision-packet process already works for held
reports — not a new mechanism, the same one, applied to this backlog when and if Colin wants
it worked through.

## Pathways not yet covered, with exact blockers

- **Codex GUI/Desktop**: no programmatic hook point was found in this task. Exact blocker:
  Codex GUI session lifecycle is not scriptable from this environment the way a CLI
  invocation is; closing this requires either a Codex-side extension point (not found to
  exist) or Colin manually running `collect_report.py` after a GUI-authored report, which is
  no worse than today's fully-manual baseline.
- **Codex CLI / further Claude Code sessions**: not yet *enforced* — nothing prevents a future
  agent from forgetting to call `collect_report.py`. The tool exists and is proven; wiring a
  call to it into this session's own end-of-task habit (as demonstrated in "Real acceptance
  evidence" above) is the only enforcement available today. A stronger guarantee (e.g. a
  required step before a task is reported complete) would need its own, separately-governed
  instruction change to `AGENTS.md`/`PROJECT_GOVERNANCE.md`, explicitly out of this task's
  scope (`docs/architecture` was read-only this round).

## Data impact

None.

## Security impact

Net reduction in the risk that a genuinely important report (implementation, investigation,
acceptance, blocked-task) never reaches the one place the existing review pipeline, Google
Drive sync, and Colin's own later reading all depend on. No change to what gets classified as
sensitive, who can clear a hold, or how Google Drive sync works. Real evidence (above) shows
the exclusion rules held correctly on the very first real reports run through the new step.

## Tests and results

All pass: the 7 new `test_collect_report.py` cases; the existing Knowledge Base's own 5 test
files (`test_index_reports.py`, `test_queue_changes.py`, `test_owner_review_closure.py`,
`test_record_new_held_review.py`, `test_validate_historical_review.py`), unaffected. Real,
non-unit-test acceptance: 3 real reports collected, re-run idempotency confirmed, the real
daily watcher run and all three correctly held.

## Definition of done

Every identified, currently-active report-writing pathway (Claude Code, Codex CLI, Bridge/
Gate5/9-adjacent investigation and implementation work) now has access to one common,
tested, reusable collection step; Codex GUI/Desktop has a documented, exact blocker rather
than a silent gap. Reports remain in their original destinations. The three reports collected
this task each have one verified central copy. No excluded or unclassified report entered
the synced folder outside the existing, unchanged classification pipeline's own handling —
proven by real evidence, not assumed. Collection failures are visible (`CollectionError`,
never a silent skip) and recoverable (source is never touched; destination is never partially
written). No duplicate architectural ownership was introduced — `collect_report.py` has
exactly one job, feeding exactly one existing pipeline, unchanged.

The 97-file historical backlog and the Codex GUI/Desktop gap are the two remaining, explicitly
documented items — not silently treated as resolved.
