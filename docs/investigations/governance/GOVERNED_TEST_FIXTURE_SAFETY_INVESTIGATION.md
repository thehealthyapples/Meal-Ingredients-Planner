# Governed Test Fixture Safety Investigation

**Date:** 2026-08-27. Investigation only, triggered by the third EISDIR
crash this session (two prior in the sourceRequestId provenance work, one
in the registryPath seam work), all from worker-authored disposable
fixture setup.

## Existing fixture-creation code, searched exhaustively

`mkdtemp` appears in exactly two real, existing files (a third and fourth
hit are this session's own prose-only decision-preparation scripts, not
helpers):

1. **`test-gate8-repair-loop.mjs`, Section B** -- creates a disposable
   scratch **git repository** via `mkdtemp(path.join(tmpdir(),
   'gate8-rollback-test-'))`, then hand-writes tracked files and runs real
   `git` commands against it. Purpose-built for testing
   `executeScopeRollbackPlan`'s git-repo interactions; not a general JSON
   fixture helper, not exported, not reusable outside this one test.
2. **`test-transition-current-decision-owner.mjs`** -- creates a disposable
   directory via `mkdtemp(path.join(tmpdir(), 'tha-transition-tool-test-'))`,
   writes one file (`malformed.json`) directly inside it, cleans up in
   `finally`. This is close in shape to what's needed, but it is inline,
   local to this one file, not exported, and -- critically -- does **not**
   perform the one safety check that would have prevented all three EISDIR
   crashes: verifying the target path is absent or a file before writing to
   it.

**Neither is a shared, importable, reusable module.** Both are one-off,
duplicated-by-hand inline code, written fresh each time a test needed
disposable filesystem state. There is no dedicated fixture-utility module
anywhere in this repository (`gate8-paths.mjs`, `governed-root-paths.mjs`,
and `gate8-verification.mjs` were checked directly and contain no fixture
helpers -- they own path-safety and verification-plan concerns, not test
fixture creation).

```
EXISTING_FIXTURE_OWNER: none (no module owns this concern)
EXISTING_REUSABLE_HELPER: none (two inline, non-exported, non-reusable
  one-off implementations, neither with the missing safety check)
REUSE_POSSIBLE: no
```

## Recurring defect, re-confirmed

Three EISDIR crashes this session, all sharing the same shape (a `readFile`
or similar operation hit a path that was, on disk, a directory rather than
a file, inside worker-authored test-fixture setup code):

1. `tha-exec-1787780547872-538ff6ce` attempt 1 (sourceRequestId, first mint)
2. `tha-exec-1787784725362-7d39e91b` attempt 1 (sourceRequestId, retry after tightened prose)
3. `tha-exec-1787788358423-4bdde642` attempt 1 (registryPath seam, independently designed decision)

```
RECURRING_EISDIR_DEFECT: Verified (three independent execution ledger
  records, read directly, each showing the identical EISDIR/directory-vs-file
  crash signature during worker-authored fixture setup, across two
  unrelated decisions)
```

## Options evaluated

**A. Reuse an existing helper unchanged** -- not possible; none exists.

**B. Extend an existing test-fixture owner** -- not possible; there is no
existing owner module to extend, only inline duplicated code in two
unrelated test files.

**C. Create one new, narrow fixture helper + dedicated regression** --
required, since A and B are both unavailable. This is deliberately the
smallest option that closes the gap: a single function that creates a
disposable directory and an explicitly named JSON file inside it, refuses
to ever `mkdir` the file's own path, checks the target is absent-or-a-file
before writing, and returns structured values for the caller to clean up.
Not a general testing framework, not a second registry/decision owner, not
consumed by any production code path.

```
RECOMMENDED_OPTION: C
RISK: RED (new shared code that future governed test regressions would
  depend on for correctness)
```

## Why this actually closes the gap, unlike prose tightening

Both prior attempts to fix the EISDIR pattern relied on strengthening
prose instructions to the worker ("verify the fixture path is a file, not
a directory, before use") -- and the defect recurred verbatim both times,
in two unrelated decisions. A shared helper moves the safety check out of
prose and into code every future fixture-writing test can call instead of
hand-rolling its own `mkdir`/`writeFile` sequence. If the registryPath and
sourceRequestId retries are instructed to call this helper rather than
constructing fixtures manually, the specific recurring mistake (creating a
directory at the path a file was meant to occupy) becomes structurally
impossible for them to repeat, rather than merely warned against again.

## Scope

```
SCOPE_REQUIRED: a new dedicated scope family for
  [disposable-json-fixture.mjs, test-disposable-json-fixture.mjs]
CURRENT_SCOPE_CLASSIFIABLE: no -- checked every one of the 11 existing
  gate8-repair-loop.mjs scope-family constants directly; none contains or
  could truthfully contain this new file pair without dragging in
  unrelated files or misnaming the concern
BOOTSTRAP_REQUIRED: yes -- same structural gap, same resolution pattern,
  as the three prior bootstraps this session (gitignore-config,
  decision-factory-provenance, decision-factory-registry-path)
```

Per instruction, only the scope-bootstrap decision is prepared here. The
fixture helper's actual implementation remains a separate, later, distinct
decision -- not created in this task.
