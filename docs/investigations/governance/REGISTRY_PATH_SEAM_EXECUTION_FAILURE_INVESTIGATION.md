# registryPath Testability Seam — First Execution FAILED

**Date:** 2026-08-27. Direct evidence only. No retry attempted.

## Execution record

```
decisionId:  tha-dec-5d13576b5d7e79f886f561881ef30a1d
executionId: tha-exec-1787788358423-4bdde642
status:      FAILED
startedAt:   2026-08-26T23:52:38.538Z
finishedAt:  2026-08-27T00:02:59.485Z
```

## Attempt 1 — FAILED, verification_failed (EISDIR)

```
Error: EISDIR: illegal operation on a directory, read
  at async readFileHandle (node:internal/fs/promises:556:24)
  at async createAndBindDecision (.../decision-factory.mjs:264:19)
  at async main (.../test-decision-factory-registry-path-seam.mjs:72:23)
  at async .../test-decision-factory-registry-path-seam.mjs:161:3
```
Same class of defect as both EISDIR crashes seen during the (separate, also
failed) `sourceRequestId` provenance attempts: a `readFile` inside
`createAndBindDecision` hit a path that was, on disk, a directory rather than
a file. Test file line 72 is inside a `main()` function, line 161 is the
top-level call site -- consistent with one of the required test cases (2, or
7's sibling/temp sub-cases) constructing a disposable registry fixture
incorrectly (most likely `mkdir`-ing the leaf file path itself rather than
only its parent directory, mirroring the exact same mistake pattern already
seen twice in the unrelated provenance work).

**Verified:** the crash signature and location.
**Inferred, not verified** (the attempt-1 worktree no longer exists): the
specific fixture-construction mistake that caused it.

## Attempt 2 — deterministic verification PASSED, Hermes REJECTED

```
VERDICT: FAIL
SCOPE_COMPLIANT: NO
CONTRACTS_PRESERVED: NO
REASON: The diff includes an unrelated EISDIR baseline-files behavior change
and the test does not assert the actual module namespace export-key set as
required.
```

Two distinct problems in one verdict, both verified directly from Hermes's
own stated reason:

1. **"An unrelated EISDIR baseline-files behavior change."** Reading this
   together with attempt 1's crash: after hitting the EISDIR failure on
   attempt 1, the worker's attempt-2 fix appears to have gone further than
   fixing its own test fixture -- it also modified `decision-factory.mjs`'s
   *production* baseline-file-scanning behavior (the code that reads each
   dirty pre-existing file into the rollback package), most likely adding
   defensive handling for directory entries there. This is scope creep: the
   decision's instructions never asked for any change to baseline-file
   handling, only to the seven named REGISTRY reference sites. **Inferred**
   (the worktree diff no longer exists to inspect directly), but strongly
   supported by Hermes's own wording.
2. **"The test does not assert the actual module namespace export-key set as
   required."** This is CASE 4 (SAME WORKFLOW) from the decision's own test
   instructions: `assert decision-factory.mjs's exported surface used by this
   test is exactly { createAndBindDecision, REGISTRY }`. Hermes states this
   assertion was not implemented as specified. **Verified** as a fact about
   the outcome (Hermes's own statement); **inferred** as to whether it was
   omitted entirely or implemented incorrectly (worktree gone).

## Live tree safety — verified directly

```
decision-factory.mjs: grep for "registryPath" -> 0 matches (unchanged)
test-decision-factory-registry-path-seam.mjs: FILE_ABSENT
gate9-current-decision.json: decisionId unchanged, still this decision's id
  (expected -- the registry always reflects the most recently bound
  decision regardless of its execution outcome; the artifact's own approval
  record still shows this decision as APPROVED but execution FAILED, exactly
  matching every prior FAILED-after-approval case this session)
execution-worktrees/: no directory remaining for this decisionId (cleaned up)
```
No copy-back occurred. Live tree is clean and consistent with the FAILED
ledger.

## Pattern across sessions worth naming plainly

This is the **third** time in this session that an EISDIR crash from
worker-authored test-fixture construction has appeared -- twice in the
unrelated `sourceRequestId` provenance work, now once here, in an
independently-designed decision for an unrelated feature. This is no longer
plausibly a one-off; it looks like a recurring failure mode specifically
around worker-authored Node.js test fixtures that construct a disposable
file inside a fresh directory (mkdir vs. writeFile confusion), independent
of which feature is being implemented or how explicitly the instructions
describe the correct construction order.

## No replacement decision has been prepared

Per the standing rule (investigate before minting, never silently retry),
this is being reported for your direction rather than acted on. Two
different corrective strategies were already tried and failed for the
similarly-shaped `sourceRequestId` case (tightening prose twice); this
failure is in a different decision entirely, so it is new evidence, not a
repeat of the same specific defect -- but the EISDIR pattern itself is now a
recurring category worth deciding how to address structurally, rather than
per-decision.
