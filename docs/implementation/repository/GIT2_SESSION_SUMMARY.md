# GIT2 — Session Summary

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Full report:** [`GIT2_SHOP3_COMM1_COMMIT_AND_PUSH.md`](./GIT2_SHOP3_COMM1_COMMIT_AND_PUSH.md)

> This is the short-form close-out. The full report carries the method, the
> evidence and the caveats.

---

## Commit SHAs

| Commit | SHA | Scope |
|---|---|---|
| **SHOP3** | `54ffa26f02abdd9179ae35fc061d992c96592bc4` | 17 files, +1,358 / −7,818 |
| **COMM1** | `be562c94978fe15745bac505a75931a257363f6a` | 41 files, +2,369 / −42 |
| **GIT2** | `f6614c4008df9f028151b809c2b4fb58d730ef13` | 1 file (the report) |

**Push:** succeeded — `local == origin/int1-intelligence-platform == f6614c40`, 0 ahead / 0 behind.

**Final status:** 86 uncommitted entries (57 modified, 27 untracked, 2 staged
deletions), all prior-session work, verified complete against the session-start
snapshot with nothing missing. Working tree byte-identical (SHA-256 confirmed).

---

## The actual problem

`git add` stages whole files, and **8 files carried both this session's changes
and prior sessions' uncommitted work** — including `package.json`,
`shared/schema.ts` and `server/routes.ts`. Staging any of them normally would
have swept NUTPLAN1 / COMP3 / COMP4 / HOUSE2 work into a commit labelled SHOP3
or COMM1.

Resolved using three snapshotted tree states (T0 inherited, T1 inherited+SHOP3,
T2 current), computing each workstream's isolated delta and building both
commits through a **temporary index** — so the real index and working tree were
never touched during construction.

Each commit was then verified by checking it out into a worktree and running its
tests:

- **SHOP3 29/29** inside `54ffa26f`
- **COMM1 81/81** and **SHOP3 29/29** inside `be562c94`

---

## Three errors made and caught

1. **Nearly reported "clean separation is impossible."** The feasibility test
   said all five SHOP3 files failed to apply — using `patch`, which **is not
   installed in this environment**. Every call returned command-not-found and
   the harness read it as a conflict. With `git apply`, six of eight applied
   cleanly; only line-offset, not overlap. *A missing tool reads exactly like a
   disagreeing one.*

2. **The first COMM1 verification verified nothing.** `git worktree add` hit
   disk quota, the subsequent `cd` failed, and the tests ran in the live working
   tree while printing green. Re-run after freeing ~4 GB, with `pwd` echoed
   inside the worktree to prove location.

3. **The first GIT2 commit swept in two inherited staged deletions** (484
   lines) — because it was the one commit built with plain `git add` instead of
   an explicit file list. Amended away and force-pushed with
   `--force-with-lease` (which would have refused had anything fetched the bad
   commit); the deletions are back to staged-but-uncommitted, as found.

---

## One correction to the earlier reports

Both the SHOP3 and COMM1 reports claim *"88 pre-existing tsc errors, 0
introduced."* That figure was measured **with inherited work present**.

| Tree | Errors |
|---|---|
| Plain HEAD `772eb6ed` | 94 |
| Commit B `be562c94` | 94 |
| Working tree | 88 |

**Zero errors were introduced either way** — 94→94 committed, 88→88 in the
working tree. The gap is prior-session work fixing pre-existing errors. Recorded
so nobody reads 88→94 as a regression.

---

## Rollback protection restored

Both tags still resolve to `772eb6ed`, but the commits now give the granularity
the tags could not:

```
git revert be562c94          # COMM1 only, SHOP3 untouched
git revert 54ffa26f          # SHOP3 only, COMM1 untouched
git reset --hard 54ffa26f    # keep SHOP3, drop COMM1
```

> **Reverting COMM1's code does not drop its database tables.** The migration is
> applied (verified at head, 3 of 3 tables present). They would be left empty and
> unreferenced — inert, but present — and THA's append-only migration model has
> no down-migration.

---

## Open

The **86 uncommitted entries remain exposed to any hard reset**. This session
deliberately did not commit work it did not author; it should be reviewed and
committed by whoever owns it.

---

## Verification at close

| Check | Result |
|---|---|
| `test:shop3-shopping-surface-convergence` | 29 passed, 0 failed |
| `test:comm1-community-foundation` | 81 passed, 0 failed |
| `test:comm1-community-database` (DB-backed) | 14 passed, 0 failed |
| `tsc --noEmit` | 88 working tree / 94 committed — 0 introduced |
| Migration applied and at head | ✅ `2026-07-19_comm1_community_foundation` |
| Local vs remote | In sync |
| Prior-session work | Nothing missing |
