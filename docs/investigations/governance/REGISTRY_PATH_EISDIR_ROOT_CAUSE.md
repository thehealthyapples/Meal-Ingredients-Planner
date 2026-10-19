# registryPath EISDIR Root-Cause Investigation (Line 91)

**Date:** 2026-08-27. Investigation only. No retry, re-mint, or code change
performed.

## Evidence inspected

- Gate 9 execution ledger: `executions/tha-exec-1787824307657-7352affd.json`
  (full `stdout`/`stderr`/`error` fields read in their entirety, not
  truncated -- 3547/658/3360 bytes respectively, all captured).
- `logs/gate8-attempt-*.json`: checked timestamps -- all three files
  (`gate8-attempt-1.json` through `-3.json`) are dated **2026-08-21**, three
  days before this execution ran. They are not from this run.
- `execution-worktrees/`: confirmed empty for this decisionId -- no
  worktree directory remains.
- No other log (gate9-access.log, hermes-gateway logs, tha-backend logs)
  contains generated source code or a diff for this execution.

## What the ledger actually shows

Attempts 1 and 2 failed with **byte-for-byte identical** crash text:
```
Error: EISDIR: illegal operation on a directory, read
  at async readFileHandle (node:internal/fs/promises:556:24)
  at async createAndBindDecision (.../decision-factory.mjs:261:19)
  at async .../test-decision-factory-registry-path-seam.mjs:91:17
```
Only two stack frames are present -- no named intermediate helper frame
(unlike the previous failed execution, which showed a `callHarmlessWithRetry`
frame). This means either the call is made directly from top-level test
code, or from an anonymous/arrow function whose frame is not separately
named.

Attempt 3 did not reach verification at all -- the Claude Code worker hit
its own session rate limit (`You've hit your session limit`), an
infrastructure failure unrelated to the test's correctness.

## Why the deeper questions cannot be answered from persisted evidence

**Confirmed by reading `gate8-execute-approved-decision.mjs` directly:**
each attempt, immediately after the worker finishes and scope-completeness
is confirmed (before verification runs), Gate 8 *does* capture full
diagnostic data -- `git diff` output plus the complete text of every scope
file -- and writes it to `path.join(temp, 'logs', 'gate8-attempt-${attempt}.json')`
(line ~1144-1160). This would have contained the exact generated source of
both `decision-factory.mjs` and `test-decision-factory-registry-path-seam.mjs`
for attempts 1 and 2 of this very execution -- everything needed to answer
every question below with certainty.

**But `temp` is the isolated execution worktree, and `cleanWorktree(temp)`
runs unconditionally inside a `finally` block** (line 1517-1519 of the same
file) regardless of whether the execution ultimately succeeds or fails. This
calls `git worktree remove --force temp`, which deletes the entire worktree
-- including the just-described per-attempt diagnostic logs -- before this
investigation (or any investigation) can ever read them. The data existed
during the run and was destroyed by design immediately afterward.

This means the specific evidence needed to trace the exact `registryPath`
expression, its runtime value, whether the guard ran against the same
value, and whether the defect is in the test or in `decision-factory.mjs`'s
own implementation, **no longer exists and cannot be recovered.**

## Findings, precisely scoped to what is actually knowable

Marked UNKNOWN wherever the evidence genuinely does not support a
conclusion, per instruction not to infer without evidence.

```
CALL_SITE (attempts 1 & 2, identical):  test-decision-factory-registry-path-seam.mjs:91:17
                                          -> decision-factory.mjs:261:19 (inside createAndBindDecision)
CASE_NUMBER:                            UNKNOWN (source not recoverable; a weak structural
                                          inference -- not a finding -- is that line ~261 in a
                                          worker-modified decision-factory.mjs falls in the
                                          region of createAndBindDecision's own pre-state-capture
                                          readFile, a code path shared by BOTH of this file's
                                          ACCEPT call sites (CASE 2 and CASE 7(d)), so this alone
                                          cannot distinguish which test case triggered it)
EXACT registryPath EXPRESSION PASSED:   UNKNOWN
VALUE/TYPE AT RUNTIME:                  UNKNOWN (confirmed only that whatever path was supplied
                                          was, at read time, a directory -- that is what EISDIR means)
GUARD_PRESENT:                          UNKNOWN (cannot confirm assertRegistryPathIsFile was
                                          called at all before this call site)
GUARD_CHECKED_SAME_VALUE:               UNKNOWN
FIXTURE_HELPER_USED:                    UNKNOWN (cannot confirm createDisposableJsonFixture was
                                          used for whichever call this was)
WHY_PATH_WAS_DIRECTORY:                 UNKNOWN
```

## Classification (A-E)

```
A. worker ignored the bound instruction         -- UNKNOWN, cannot confirm or rule out
B. guard was applied to one value, another passed -- UNKNOWN, cannot confirm or rule out
C. helper result was misused                    -- UNKNOWN, cannot confirm or rule out
D. createAndBindDecision transformed the path    -- UNKNOWN, cannot confirm or rule out.
                                                    Worth stating plainly: decision-factory.mjs's
                                                    own registryPath-threading changes are equally
                                                    worker-authored in this same attempt, so the
                                                    defect is not automatically attributable to the
                                                    test file merely because the crash's outer frame
                                                    is inside createAndBindDecision.
E. another verified cause                       -- none found
```
**No option can be selected over the others.** This is itself the finding.

## The diagnostic gap, and the smallest fix (not implemented)

Gate 8 already captures exactly the right data at exactly the right moment
for every attempt -- it is only ever destroyed by the unconditional
worktree cleanup. The smallest fix: before (or as part of) `cleanWorktree(temp)`,
on a FAILED execution only, copy `temp/logs/gate8-attempt-*.json` out to a
persistent, execution-scoped location outside the worktree (e.g.
`logs/executions/<executionId>/` in the real bridge repo) so this exact
class of investigation becomes possible after the fact. Restricting this to
failed executions avoids retaining diagnostic bloat for every successful
run. Not implemented here, per instruction.

## Polling deadline

This execution ran 09:51:47 to 10:13:54 -- **~22 minutes**, exceeding the
1200-second (20-minute) internal polling deadline used this session by
about 2 minutes. The poller's own timeout fired before the real execution
finished, forcing a direct canonical-ledger check to recover the true
result. Three-attempt repair loops with a large test suite (8 cases plus a
9-part path-safety matrix, as here) can plausibly run long; one attempt in
this very execution spent ~8.5 minutes on the worker call alone before
failing on an unrelated rate limit. Recommend widening the internal
deadline to 2400 seconds (40 minutes) for decisions of this size going
forward, purely as an operator-side polling parameter -- no bridge code
change.
