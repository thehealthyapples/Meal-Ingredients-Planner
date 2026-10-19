# registryPath Testability Seam — Second Execution (Retry Using the Fixture Helper) Also FAILED

**Date:** 2026-08-27. Direct evidence only; no retry attempted following this
failure.

## Execution record

```
decisionId:  tha-dec-4f7ae368bd5614f7e11a94e90bedb4bd
executionId: tha-exec-1787820909001-eb1bb4a5
status:      FAILED
startedAt:   2026-08-27T08:55:09.102Z
finishedAt:  2026-08-27T09:13:25.489Z
```

## All three attempts, verified directly from the execution ledger

All three attempts crashed **identically** -- same error, same location,
never reaching Hermes review, deterministic verification never passing even
once:

```
Error: EISDIR: illegal operation on a directory, read
  at async readFileHandle (node:internal/fs/promises:556:24)
  at async createAndBindDecision (.../decision-factory.mjs:264:19)
  at async callHarmlessWithRetry (.../test-decision-factory-registry-path-seam.mjs:46:14 [attempt 2] / :51:14 [attempt 3])
  at async .../test-decision-factory-registry-path-seam.mjs:75:23 [attempt 2] / :81:23 [attempt 3]
```
(Attempt 1 has the same crash without the `callHarmlessWithRetry` frame,
suggesting that helper function was introduced or renamed between attempts
1 and 2, but the underlying crash never changed.)

## This is a different defect than the prior EISDIR crashes -- verified, not assumed

The crash site this time is **inside `createAndBindDecision`'s own
`readFile(resolvedRegistryPath)` call** (`decision-factory.mjs:264`), not
inside the test's fixture-construction code. This means `disposable-json-fixture.mjs`
worked as designed -- it was not the source of this crash. The test itself
was calling `createAndBindDecision` with a `registryPath` argument that, at
read time, pointed at a directory rather than a file.

**Inferred** (the worktree no longer exists to inspect the actual diff, so
this cannot be fully Verified): the worker-written `callHarmlessWithRetry`
helper, invoked from multiple call sites across the CASE 7 path-safety
matrix, most likely passed `result.tempRoot` or `result.directoryPath` --
both real directories -- instead of `result.filePath` (the actual file) as
`registryPath` for at least one of the two ACCEPT sub-cases (7(d)'s sibling
fixture or 7(h), which reuses CASE 2's fixture).

## Root cause of *why* this specific mistake -- traced to this decision's own instruction text

CASE 7's instructions said, for every sub-case: *"call createAndBindDecision
with a harmless scope, real purpose/risk, and the given candidate as
registryPath."* Sub-case (h) was described separately: *"reuse CASE 2's own
createDisposableJsonFixture-based disposable path as the concrete proof this
class of path is accepted -- no separate call needed, cross-reference CASE
2's success as satisfying this sub-case."*

These two statements are in tension: the general CASE 7 preamble implies
every sub-case, including (h), gets its own `createAndBindDecision` call;
the (h)-specific note says no separate call is needed. The instructions
never stated explicitly which specific field of CASE 2's `result` object
(`filePath`, as opposed to `tempRoot` or `directoryPath`) must be used if a
call *is* made. This is the same category of defect as the earlier
CASE K substring-vs-import-statement bug in the `disposable-json-fixture.mjs`
decision -- an ambiguity in this session's own instruction-writing, not a
worker mistake or a repeat of the original fixture-construction EISDIR
pattern.

## Live tree safety -- verified directly

```
decision-factory.mjs: grep for "registryPath" -> 0 matches (unchanged)
test-decision-factory-registry-path-seam.mjs: FILE_ABSENT
execution-worktrees/: no directory remaining for this decisionId
OS temp directory: no stray tha-fixture-* directories left behind
```
No copy-back occurred. Live tree and temp state are both clean.

## Conclusion

No replacement decision has been prepared yet. The fix is narrow: CASE 7(h)
must be made unambiguous -- either genuinely require no additional call at
all (removed from the "for every sub-case, call..." blanket instruction
explicitly), or, if a call is kept for symmetry/robustness, must explicitly
name `result.filePath` as the only field authorised for use as `registryPath`.
This does not implicate the disposable-json-fixture helper itself, which
behaved exactly as designed and verified.
