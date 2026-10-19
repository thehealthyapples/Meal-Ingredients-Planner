# Failed Execution / Applied Change Investigation

**Date:** 2026-08-26
**Scope:** Investigation only. No repository files modified. No decision
minted, approved, or executed.

## Governance re-check

`docs/architecture/README.md`: zero Gate 5/7/9 mentions, unchanged.
`PROJECT_GOVERNANCE.md`: searched for rollback/atomic/copy-back/partial
language (lines 28, 34, 56, 59, 87, 106, 107, 114, 131, 151, 170-171, 187,
214, re-read directly). The only directly relevant invariant found is line
214 (historical, from the terminated Gate 8 dependency-free verifier
bootstrap section): **"failed verification cannot copy back."** This is a
**pre-copy-back** invariant — it governs the case where deterministic/Hermes
verification fails *before* any scope file is written to the live tree. It
does not speak to the case here: verification succeeded, copy-back began,
and a *third*, later safety check failed *after* copy-back had already
written the scope file. **No governing text was found that explicitly
states what must happen in that specific case.** This is a genuine textual
gap, not a violation of an explicit rule — reported as such, not overclaimed
as drift.

## TRACE — `tha-dec-d45c9e238b7559f41d45ec13ba5f167a`

```
EXECUTION_ID:      tha-exec-1787771001565-e4e4b05a
LEDGER_FILE:       executions/tha-exec-1787771001565-e4e4b05a.json
                   (Gate 9 canonical ledger, written by
                   gate9-execution-runner.mjs) — Verified, read directly
LEDGER_PHASE_HISTORY: startedAt 19:03:21.689Z -> finishedAt 19:04:04.735Z,
                   terminal status FAILED (the runner overwrites the whole
                   record on each save; only the final state is visible in
                   the file, not an append-only phase log)
TERMINAL_STATUS:   FAILED

ISOLATED_WORKTREE_RESULT: implementation succeeded (worker scope check PASS)
DETERMINISTIC_VERIFICATION: PASS (gitignore-config-scope test passed)
HERMES_VERDICT:    PASS (VERDICT: PASS, SCOPE_COMPLIANT: YES,
                   CONTRACTS_PRESERVED: YES)

COPY_BACK_OCCURRED: yes
COPIED_FILES:      .gitignore (the only SCOPE file for this decision)

POST_APPLY_CHECK_RESULT: FAILED — "Unexpected live worktree change detected
                   after apply" (gate8-execute-approved-decision.mjs:1403)

ROLLBACK_TRIGGERED: yes (the catch block's liveApplied branch ran, confirmed
                   by "Post-apply failure detected -- restoring exact
                   protected dirty baseline." / "Protected dirty baseline
                   restored." in both stdout capture and the ledger's own
                   error field)
ROLLBACK_SCOPE:    receipt.dirtyPreState.baselineFiles only -- Verified by
                   reading the exact code (gate8-execute-approved-decision.mjs:1468-1484)
ROLLBACK_FILES:    309 files (the decision's own captured "protected dirty"
                   baseline, i.e. every file that was already
                   modified/untracked in the live tree BEFORE this decision
                   was even minted) -- Verified: receipt.dirtyPreState.baselineFiles.length === 309
WAS .gitignore ROLLED BACK: no
WHY/WHY NOT:       .gitignore is a SCOPE file, not a "protected" file.
                   Verified directly: receipt.dirtyPreState.scopeFiles is []
                   and .gitignore does not appear in baselineFiles at all --
                   because .gitignore was clean (matching HEAD, unmodified)
                   at decision-creation time, so there was nothing dirty to
                   capture for it in the first place. The catch block's
                   restore loop iterates only receipt.dirtyPreState.baselineFiles
                   -- it contains no code path that reverts SCOPE files
                   (e.g. no `git checkout HEAD -- <scope file>` call exists
                   anywhere in this catch block). This is not a targeted
                   omission for .gitignore specifically -- it is a structural
                   property of the catch block: it can only ever restore
                   protected (pre-existing-dirty) files, never scope files,
                   regardless of which decision or which scope file is
                   involved.

GATE8_LAST_EXECUTION_UPDATED: no
WHY/WHY NOT:       gate8-last-execution.json is written only on the success
                   path (gate8-execute-approved-decision.mjs:1450-1457,
                   inside the try block, after the post-apply check passes).
                   The catch block never writes it. Verified directly: the
                   file's current content still shows the PRIOR decision
                   (tha-dec-e405300f0e180378c1daebd46e3c7b19, timestamp
                   18:20:00.059Z), untouched by this failed run. This is
                   arguably the single-slot file behaving correctly (it
                   never claims a false success) -- but it also means
                   neither ledger anywhere records "SCOPE file was actually
                   copied to the live tree despite the terminal FAILED
                   status" -- see LEDGER_DEFECT below.
```

## Live tree truth

- Current `.gitignore` content: Verified — contains exactly one new line,
  `preparation-receipts/`, grouped correctly with `logs/` and `executions/`,
  formatting/CRLF preserved, nothing else touched (`git diff HEAD --
  .gitignore` shows a single clean `+preparation-receipts/` hunk).
- Captured pre-execution baseline for `.gitignore`: none exists, because it
  was clean/tracked-unmodified at mint time (confirmed: absent from
  `baselineFiles`, and the stdout log's own "Scope baseline status:
  .gitignore=absent" line, meaning "not part of the dirty pre-state set" —
  the ordinary, correct meaning of that log line, not evidence of file
  non-existence).
- Exact diff between baseline (HEAD) and live tree: shown above — one line
  added, nothing else.
- Does the live file equal the isolated worktree's successful
  implementation: yes — the copy that ran before the post-apply check is
  the standard `copyFile(temp/relative -> EXECUTION_REPO/relative)` for
  every SCOPE file, and no code path modifies the file again afterward.
- Did any other tracked file change during the execution window: **not
  established**. The post-apply check only reports a boolean mismatch, not
  which path(s) differed — it does not log the actual diff. I do not have
  direct evidence of which file(s) caused `outsideScopeStatus(finalStatus)
  !== outsideBefore`, or why.
- Current git status stability: Verified — three consecutive `git status
  --porcelain=v1 -uall` calls run back-to-back just now produced identical,
  zero-diff output (314 lines each). The repository is not currently
  exhibiting flaky/non-deterministic status.

**EXTERNAL CAUSE: UNKNOWN.** Per instruction, this is not attributed to
antivirus, sync software, or any other process without direct evidence —
none was found. No log captures the specific path(s) involved in the
mismatch, and nothing in this session issued a concurrent write during that
exact window that I can point to. The trigger for that one comparison
remains genuinely unexplained.

## Post-apply safety check — exact mechanism

```
PRE_APPLY_SNAPSHOT:  outsideBefore = outsideScopeStatus(liveStatusNow), where
                     liveStatusNow is a `git status --porcelain=v1 -uall`
                     taken just before the SCOPE-file copy loop
                     (gate8-execute-approved-decision.mjs:1355-1360, reused
                     at line ~1391)
POST_APPLY_SNAPSHOT: finalStatus = a fresh `git status --porcelain=v1
                     -uall` taken immediately after the copy loop
                     (line 1395-1398)
COMPARISON_METHOD:   string equality of outsideScopeStatus(finalStatus) vs
                     outsideBefore -- outsideScopeStatus() filters porcelain
                     lines to exclude SCOPE, ISOLATED_GENERATED_FILES,
                     `gate8-last-execution.json`, anything under
                     `executions/`, anything under `execution-worktrees/`,
                     and `logs/gate8-attempt-<n>.json` -- then sorts and
                     joins the remainder (gate8-execute-approved-decision.mjs:120-136)
APPROVED_SCOPE_EXCLUDED_FROM_COMPARISON: yes -- .gitignore itself cannot be
                     the cause of the mismatch; the filter explicitly
                     removes SCOPE paths before comparing
OUTSIDE_SCOPE_DIFFERENCE_FOUND: yes (the throw fired) -- but which path(s)
                     is not captured anywhere in the logs
EXACT_DIFFERENCE:    not recoverable from available evidence -- the code
                     does not log the two strings it compared
SOURCE_OF_DIFFERENCE: Unknown
```

**Can the check be triggered by:**
- expected scoped-file changes — **no**, explicitly excluded by the filter
- generated ignored files (`ISOLATED_GENERATED_FILES`) — **no**, explicitly
  excluded
- timestamps — **no**, `git status --porcelain` reports path + status code
  only, not mtimes
- line-ending conversion — **possible in principle** (a CRLF/LF
  normalization touching some *other*, unrelated dirty file's on-disk bytes
  between the two snapshots could change its status line), **not confirmed**
  here
- unrelated dirty files — **plausible**: this repository carries roughly
  300+ already-dirty/untracked files at any given time (confirmed:
  `baselineFiles.length === 309`), any one of which transitioning state in
  that exact ~1-second window would trigger this
- temporary filesystem changes — **possible**, **not confirmed**
- another verified mechanism — **none found**

None of these can be confirmed as *the* cause from available evidence;
reported as Unknown, not guessed.

## Atomicity / rollback ownership

```
PRE-APPLY BASELINE OWNER:     decision-factory.mjs::createAndBindDecision()
                              (captures dirtyPreState.baselineFiles at mint
                              time)
COPY-BACK OWNER:              gate8-execute-approved-decision.mjs (the
                              per-SCOPE-file copyFile loop)
POST-APPLY VERIFICATION OWNER: same file, same function (the
                              outsideScopeStatus comparison)
ROLLBACK OWNER:               same file, same function's catch block --
                              but only for protected (non-scope) files
EXECUTION TERMINAL STATUS OWNER: two separate, both real: gate8-last-execution.json
                              (single-slot, success-path-only, owned by
                              gate8-execute-approved-decision.mjs) and
                              executions/*.json (owned by
                              gate9-execution-runner.mjs, written on both
                              success and failure)
```

**Consumers found:** `server.gate5.mjs::buildActivityProjection()` (reads
`executions/*.json` and `gate8-last-execution.json` indirectly via the
`gate9_execution` record kind and the canonical-phase-consumption work just
completed); `server.gate9.mjs::/v1/tha/current-decision` (reads
`gate8-last-execution.json` via `alreadyExecuted`, and `executions/*.json`
via `readAllExecutionRecords`); `complete-reconciliation-decision.mjs`
(reads `executions/*.json` via `noExecutionFor`).

```
CANONICAL EXECUTION STATE SINGULAR: yes for each of the two ledgers
                                    individually -- but see LEDGER_DEFECT:
                                    the two ledgers can now disagree with
                                    live tree state simultaneously, which is
                                    the actual problem, not a duplication of
                                    ownership
OWNERSHIP SINGULAR:                 yes -- no second rollback mechanism, no
                                    second copy-back mechanism found anywhere
NO DUPLICATED STATE:                yes -- confirmed, no new finding here
NO DUPLICATED WORKFLOW:             yes -- confirmed, no new finding here
```

## Drift check

```
GOVERNANCE DRIFT:      no -- no explicit governing text requires that a
                       post-apply-detected failure leave the live tree
                       unchanged; the one relevant invariant found
                       ("failed verification cannot copy back") was
                       satisfied here (copy-back only began after
                       verification had already passed). This is a gap in
                       what governance addresses, not a violation of what it
                       states.
IMPLEMENTATION DEFECT: yes -- Verified. The catch block's restoration logic
                       is structurally incapable of reverting SCOPE files on
                       post-apply failure; it only ever restores
                       dirtyPreState.baselineFiles (protected, non-scope
                       files). This is not specific to .gitignore or to this
                       decision -- it would reproduce for any decision whose
                       post-apply check fails after copy-back begins.
ROLLBACK DEFECT:       yes -- same finding, the more precise label: the
                       rollback is asymmetric/incomplete by construction,
                       not merely unlucky this one time.
LEDGER DEFECT:         yes -- Verified. Neither gate8-last-execution.json
                       (never written on this path) nor the Gate 9
                       executions/*.json record (written, but its schema has
                       no `applied` field on the failure path -- `applied`
                       is only ever constructed on the success path) records
                       that a SCOPE file was actually copied to the live
                       tree despite the terminal FAILED status. A reader of
                       either canonical ledger, today, would have no way to
                       discover that .gitignore was silently changed by this
                       failed execution without independently diffing the
                       live file against HEAD, exactly as this investigation
                       had to do.
```

## "Do not fabricate success" — evaluated

Proposed idea from the prior turn: mint a fresh decision whose purpose is
only to confirm/re-affirm the already-landed `.gitignore` state and obtain a
SUCCEEDED execution record.

**Rejected**, per instruction, and independently confirmed by code: no
existing canonical mechanism supports this. The only close candidate,
reconciliation, is schematically incompatible —
`complete-reconciliation-decision.mjs` requires `noExecutionFor(decisionId)`
to hold (explicitly refuses if *any* execution record already exists for
that decisionId) and its own record schema hardcodes
`noImplementationExecution: true, noWorkerInvocation: true, noCopyBack:
true` (verified by direct read, `complete-reconciliation-decision.mjs:85`)
— every one of those three claims would be **false** for this decision's
actual history (an execution record exists, a worker was invoked, and a
copy-back did occur). Using reconciliation here would itself be a fabricated
canonical record, not a truthful one. A synthetic "re-affirmation" decision
would additionally misrepresent *when* and *through what process* the change
was actually applied. Neither is created.

## Recovery options (not minted, not executed)

**A — Restore `.gitignore` to its pre-execution baseline (HEAD), returning
this failed execution to an honest no-change state; then run the originally
intended change through a fresh, complete, correctly-recorded decision.**
Makes live state and canonical execution history agree again (both say "no
change yet"), then produces a truthful SUCCEEDED record when the real change
lands. Smallest, most direct fix for the *symptom* observed here. Does not
address the underlying rollback gap for future decisions.

**B — Retain the already-applied `.gitignore` content; create a distinct
"acknowledged partial apply" record.** **REJECTED**, confirmed above: no
existing canonical mechanism supports this, and reconciliation's schema
would be factually false if repurposed for it. Inventing a new record type
for this would itself be exactly the kind of new, uncoordinated mechanism
this investigation was told not to create.

**C — Fix the rollback/copy-back defect in `gate8-execute-approved-decision.mjs`
itself before retrying anything**, so a post-apply failure after copy-back
always reverts SCOPE files too (e.g. `git checkout <head> -- <scope files
not already in dirtyPreState>` alongside the existing protected-baseline
restore), closing the gap for every future decision, not just this one.
Larger, more sensitive change (touches the most sensitive file in this
entire chain, the same one the earlier standalone-invocation-enforcement
decision touched) — deliberately not bundled with A, per the "ONE DECISION
ONLY" discipline this whole engagement has followed throughout.

**RECOMMENDED: A now** (restores an honest, consistent state — required
before any Follow-up A retry can produce truthful history), **C as a
separate, later, explicitly-approved decision** (closes the structural gap
for all future executions, not just this one). B rejected outright.

A and C are not mutually exclusive and are not in conflict — A is the
immediate state-consistency fix; C is the durable process fix. Neither is
minted in this turn.

```
DECISION_REQUIRED: yes (for A; C also warrants a decision, separately,
  later)
```

---

Persisted at:
`docs/investigations/governance/FAILED_EXECUTION_APPLIED_CHANGE_INVESTIGATION.md`

## TRUST CHECK

- Highest-risk claim still Inferred or Assumed: none of the load-bearing
  findings are Inferred or Assumed — the rollback's scope-file blind spot,
  the ledger's silence on the partial apply, and reconciliation's schema
  incompatibility were all directly verified by reading the exact code and
  the exact live artifacts this turn. The one item explicitly left
  **Unknown** (not Inferred, not Assumed) is the root trigger of the
  specific `outsideScopeStatus` mismatch — I do not know which file changed
  or why, and said so rather than guessing.
- Evidence required to verify the Unknown trigger: the code would need to
  log the actual differing path(s) at the point of comparison (it currently
  does not), or the mismatch would need to be reproduced live with a diff
  captured at the exact moment, to identify the specific file involved.
