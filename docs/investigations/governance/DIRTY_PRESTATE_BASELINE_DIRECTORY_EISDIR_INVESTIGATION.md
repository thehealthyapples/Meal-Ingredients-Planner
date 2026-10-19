# Dirty Pre-State Baseline Capture — Directory EISDIR Root Cause

**Date:** 2026-08-27. Investigation only, using persisted FAILED-execution
diagnostics (the newly-implemented `generatedScope` capture worked exactly
as designed) plus a live empirical reproduction.

## Root cause — confirmed, not inferred

`createAndBindDecision`'s dirty pre-state baseline-capture loop
(`decision-factory.mjs`, currently at line 232 in the live file) reads
`git status --porcelain -uall` on the governed repository root, filters out
only the handful of just-created decision artifact names, and then blindly
`readFile()`s every remaining reported path, assuming each one is a file:

```js
for (const relative of initialPaths) {
  const source = path.join(root, relative);
  ...
  const bytes = await readFile(source);   // <- EISDIR when `source` is a directory
```

`git status --porcelain --untracked-files=all` (`-uall`) normally expands
untracked directories into one line per file inside them -- **except** when
the directory itself is a nested git repository (contains its own `.git`
entry), in which case git always treats it as an opaque boundary and
reports it as a single line with a trailing slash, regardless of `-uall`.

**Empirically reproduced live:** created a real `git worktree add` inside
this exact bridge repository and confirmed `git status --porcelain -uall`
on the parent repo reports it as exactly one line: `?? execution-worktrees-probe-test/`
(cleaned up immediately after the test).

Every Gate 8 execution creates its own isolated worktree at
`execution-worktrees/<decisionId>/` -- itself a git worktree with its own
`.git` file -- **inside the bridge repository's own working tree**, and
that worktree still exists (cleanup only happens in the outer script's
`finally` block, after the test has already run). Any test that calls
`createAndBindDecision` with `repositoryRoot` set to the real bridge
repository **while running from inside that same active worktree** --
exactly the "CRITICAL SAFETY REQUIREMENT: use the real governed root, there
is no sandboxed alternative" pattern used by both the `registryPath` seam
test and, earlier this session, the `sourceRequestId` provenance test --
will deterministically see its own execution-worktrees entry in `git status`
and crash.

**This was not a test-fixture-construction bug, a worker mistake, or a
`registryPath`/`sourceRequestId` design defect.** It is a pre-existing,
deterministic defect in `decision-factory.mjs` itself, present before any
of this session's work began, that only manifests for this specific
"self-test against the real governed root from inside an active worktree"
pattern -- which is exactly the pattern both of this session's two
most-repeatedly-failed decisions needed. This retroactively explains all
four `registryPath` EISDIR failures and, very likely, the two earlier
`sourceRequestId` EISDIR failures as well (not re-litigated here, since
that work is explicitly out of scope for this task).

```
ROOT_CAUSE: confirmed live (persisted diagnostics + empirical reproduction)
```

## Ownership and consumers

`OWNER: decision-factory.mjs::createAndBindDecision` (the sole producer of
`baselineFiles`/`receipt.dirtyPreState.baselineFiles`).

`AFFECTED_CONSUMERS` (grepped exhaustively across `gate8-execute-approved-decision.mjs`):
baseline hash re-verification, `classifyScopeBaselineStatus`,
`buildScopeDiffText`, the pre/post-apply drift comparisons ("Unexpected
live worktree change detected after apply"), and
`computeScopeRollbackPlan`/`executeScopeRollbackPlan` (rollback-on-failure).
**Every one of these consumers already assumes each `baselineFiles` entry
is a real file with byte content and a SHA-256** -- none has, or could
sensibly have, special handling for a directory-shaped entry. This is
corroborating evidence, not merely an assumption: if the crash were
somehow avoided without excluding the entry, every downstream consumer
would still be handed a nonsensical "file" record for something that has
no byte content.

## Existing architectural precedent for this exact class of path

`gate8-execute-approved-decision.mjs::outsideScopeStatus()` (a **separate**
function, used for a **separate** purpose -- detecting unexpected
post-apply drift, not baseline capture) already excludes exactly this
category of path from its own scan:

```js
SCOPE.includes(relative) ||
ISOLATED_GENERATED_FILES.includes(relative) ||
relative === 'gate8-last-execution.json' ||
/^executions(?:\/|$)/.test(relative) ||
/^execution-worktrees(?:\/|$)/.test(relative) ||
/^logs\/gate8-attempt-\d+\.json$/.test(relative)
```

`execution-worktrees/` is already named there. This establishes that
**skipping** this class of structural path -- not failing closed -- is
the architecture's already-settled position for `execution-worktrees/`
specifically. `decision-factory.mjs`'s baseline loop has no equivalent
exclusion at all today; that is the actual gap.

## Options

**A. Skip directory entries safely, via a general type check** (e.g.
`lstat(source)` before `readFile`, omit from `baselineFiles` if
`isDirectory()`) -- catches this exact bug class regardless of which
directory name triggers it (not just `execution-worktrees/`, but any
future nested-repo or git-collapsed directory), requires no coupling to
`gate8-execute-approved-decision.mjs`'s specific path-pattern list, and
matches what every consumer already assumes.

**B. Fail closed with a clear governed error when a directory entry is
encountered.** Rejected: this exact scenario (an active execution worktree
inside the bridge repo) is the **normal, expected state** during every
real Gate 8 self-test that legitimately targets the real governed root --
failing closed would make an entire class of already-designed test
patterns (both `registryPath`'s and `sourceRequestId`'s "CRITICAL SAFETY
REQUIREMENT" designs) permanently unable to execute, which is a
disproportionate blast radius for something structurally benign.

**C. Name-pattern exclusion, copying `outsideScopeStatus()`'s specific
list into `decision-factory.mjs`.** Viable but narrower and less robust
than A -- ties `decision-factory.mjs` to `gate8-execute-approved-decision.mjs`'s
specific pattern list (a duplication/coupling this session has
consistently avoided elsewhere), and would still miss any other
directory-shaped entry this session hasn't happened to name.

```
RECOMMENDED_OPTION: A
RISK: RED (decision-factory.mjs is the sole implementation of createAndBindDecision, used by every governed decision this session)
```

## Scope

```
FILES_IN_SCOPE (proposed repair, not minted in this task):
  decision-factory.mjs, test-decision-factory-baseline-directory-safety.mjs
EXISTING_SCOPE_FAMILY: none -- checked live; the natural scope
  (decision-factory.mjs + a dedicated new test) does not classify under any
  of the 12 current Gate 8 scope families (the closest, DECISION_FACTORY_PORCELAIN_REPAIR_SCOPE,
  governs the git-porcelain *string parser*, a different concern from the
  baseline-capture *loop* that misuses an already-correctly-parsed path)
BOOTSTRAP_REQUIRED: yes -- the fifth such bootstrap this session
  (gitignore-config, decision-factory-provenance, decision-factory-registry-path,
  disposable-json-fixture, now this)
```

Per the same pattern already established and approved four times this
session, the bootstrap decision (scope classification only, no behaviour
change) is prepared and minted in this task. The actual repair to
`decision-factory.mjs` remains a separate, later, distinct decision -- not
started here.
