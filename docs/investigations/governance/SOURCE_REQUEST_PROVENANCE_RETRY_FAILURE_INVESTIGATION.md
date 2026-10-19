# sourceRequestId Implementation — Second Execution Attempt, Also FAILED

**Date:** 2026-08-26/27. Direct evidence only; no retry has been attempted
following this failure.

## Execution record

```
decisionId:  tha-dec-3f1a4803654c29875bab3378a6ebbc8d
executionId: tha-exec-1787784725362-7d39e91b
status:      FAILED
startedAt:   2026-08-26T22:52:05.477Z
finishedAt:  2026-08-26T23:00:53.199Z
```

This is the **second** execution of this decision. The first execution
(`tha-exec-1787782722765-cdfe0c57`) FAILED before any implementation attempt,
because the Claude Code CLI worker had hit its own session rate limit. This
second execution ran after that limit reset and reached the worker three
times.

## The decision text was tightened after the *first* implementation attempt
(a different, earlier decision: `tha-dec-5dfc0d5e1f21b822d11bada560734939`)
specifically to prevent:
1. an EISDIR crash from an unsafe test fixture path,
2. a receipt-field duplication bug,
3. Hermes-rejected scope creep / incomplete cleanup assertions.

## What actually happened this execution — verified directly from captured stdout/stderr

**Attempt 1: FAILED — identical EISDIR crash, recurred despite the added "FIXTURE SAFETY" instruction.**
```
Error: EISDIR: illegal operation on a directory, read
  at async readFileHandle (node:internal/fs/promises:556:24)
  at async createAndBindDecision (.../execution-worktrees/.../decision-factory.mjs:274:19)
  at async .../test-decision-factory-provenance.mjs:86:20
```
Same failure signature, same code path, as the prior (separate, failed)
execution's attempt 1.

**Attempt 2: FAILED — identical duplicated-field assertion failure, recurred despite the added "ABSOLUTE REQUIREMENT" / self-check instruction.**
```
AssertionError [ERR_ASSERTION]: decision artifact must not duplicate receipt field "createdAt"
  at .../test-decision-factory-provenance.mjs:116:14
  true !== false
```
Same specific field (`createdAt`), same assertion, as the prior execution's
attempt 2.

**Attempt 3: deterministic verification PASSED. Hermes rejected it — a different specific reason than the prior execution's attempt-3 rejection, but the same general category.**
```
VERDICT: FAIL
SCOPE_COMPLIANT: NO
CONTRACTS_PRESERVED: NO
REASON: The implementation adds an unrequested baseline-path filtering
behavior, and the test targets the worktree for registry/artifact checks
and restoration instead of consistently handling the real bridge
repository state.
```
The prior execution's attempt-3 rejection was: "adds an unrequested
stat-based change... plus incomplete cleanup/receipt-field assertions." Not
identical wording, but the same underlying pattern: the worker adds
behavior beyond what was asked, and gets the worktree-vs-real-repository
distinction for the test's own cleanup/verification logic wrong.

## Root cause determination

**Verified:** the two "prevented" failure modes (EISDIR, field duplication)
recurred **with identical signatures**, despite decision-text changes
specifically written to prevent each one by name.

**Inferred (not verified against internal model behavior, which is opaque
from outside):** tightening the prose instructions for a bounded, single
Claude Code invocation with `--max-turns 30` did not change what the worker
actually produced on attempts 1 and 2 of this run. Each attempt is a fresh
invocation; the only thing carried forward between attempts within one
execution is the `failedSteps` diagnostic text fed back into the next
attempt's prompt (visible in the "Prior attempt evidence" JSON), not the
original decision's instruction text being read more carefully. This means
stronger wording in the *original* decision purpose does not, by itself,
guarantee the worker avoids repeating the same class of mistake — the
existing bounded-repair-loop mechanism (repairable-failure retry, feeding
back the specific error) is what actually got attempt 3 past deterministic
verification, not the tightened original prose.

**Not yet determined:** whether attempt 3's specific new defect (worktree
vs. real-repository handling in the test's own registry-restoration logic)
is a recurring pattern across attempts at this exact test-writing task, or
a one-off. Only one execution's attempt 3 has been observed with this exact
Hermes complaint.

## Live tree safety — verified directly

```
decision-factory.mjs: grep for "sourceRequestId" -> 0 matches (unchanged)
test-decision-factory-provenance.mjs: FILE_ABSENT
gate9-current-decision.json: decisionId unchanged (tha-dec-3f1a4803654c29875bab3378a6ebbc8d),
                              still the current registry entry
execution-worktrees/: no directory remaining for this decisionId (cleaned up)
```
No copy-back occurred — consistent with FAILED at the Hermes-rejection
stage, before the copy-back step. Live tree is clean.

## Conclusion

No replacement decision has been prepared or minted. The evidence shows
that simply tightening decision-instruction prose a second time is not
proven to change worker output — two of the three same defects reappeared
verbatim. Before minting a third attempt at this decision, the design
question raised here needs an explicit answer: whether to (a) try tightening
the prose again with even more specific fixture-construction/cleanup code
(same approach, likely same risk of non-convergence), (b) restructure the
scopeFileInstructions to be more prescriptive/mechanical for the two
recurring defects (e.g., specify the exact fixture-path construction
pattern verbatim rather than describing the requirement), or (c) something
else. This is a judgment call, not something the persisted evidence alone
resolves.
