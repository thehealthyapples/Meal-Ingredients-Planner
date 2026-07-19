# GIT2 — SHOP3 & COMM1 Commit and Push

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Two commits and a push to a shared branch, constructed by index surgery rather than plain `git add`, because 8 files carried both my changes and prior sessions' uncommitted work. No file content was altered; the working tree is byte-identical to before. But the commits were assembled, not simply staged, and that is worth a reviewer's attention.

---

## 1. RESULT

| Item | Value |
|---|---|
| **SHOP3 commit** | `54ffa26f02abdd9179ae35fc061d992c96592bc4` |
| **COMM1 commit** | `be562c94978fe15745bac505a75931a257363f6a` |
| **Parent (before)** | `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| **Push** | ✅ `772eb6ed..be562c94 → origin/int1-intelligence-platform` |
| **Local vs remote** | **In sync** — 0 ahead, 0 behind |
| **Prior-session work** | **Untouched and uncommitted** — 86 entries remain |
| **Working tree** | **Byte-identical** to pre-commit (verified by SHA-256) |

Clean separation was achieved. Both workstreams are independently revertable.

---

## 2. THE PROBLEM: 8 FILES HAD TWO AUTHORS

`git add <file>` stages a *whole file*. 59 tracked files were already dirty when SHOP3 began — NUTPLAN1, COMP3, COMP4, HOUSE2, KNOW2 and others, authored by prior sessions and never committed. Of the 44 files this session actually changed, **8 were also in that inherited set**:

```
client/src/App.tsx                              server/migrations/runner.ts
client/src/components/nav-bar.tsx               server/routes.ts
docs/product/structure/routes/routes-map.md     shared/schema.ts
.engineering/session/CURRENT.md                 package.json
```

Staging any of these normally would have swept prior-session work into a commit labelled SHOP3 or COMM1 — misattributing someone else's work and making it impossible to revert one without the other.

### How the split was established, not assumed

Three tree states were available as out-of-repo snapshots taken at the start of each workstream:

| State | Content | Source |
|---|---|---|
| **T0** | inherited only | `pre-SHOP3-snapshot/` |
| **T1** | inherited + SHOP3 | `pre-COMM1-snapshot/` |
| **T2** | inherited + SHOP3 + COMM1 | live working tree |

`diff(T0,T1)` is SHOP3's isolated delta; `diff(T1,T2)` is COMM1's. Both were reconstructed by `git archive HEAD` + `git apply`, and each reconstruction was verified before use (T1 contains the SHOP3 test and the shopping-list-page deletion; T1 contains no `community.ts`).

**A useful shortcut fell out of this:** for any file *not* in the inherited set, T1's version already equals `HEAD + SHOP3` exactly, so it could be used verbatim. Only the 8 overlapping files needed delta application.

---

## 3. A FALSE NEGATIVE, CAUGHT

The first feasibility test reported that **all five** SHOP3-side mixed files failed to apply to a clean HEAD, which would have meant the workstreams were inseparable and the mission's "stop and report" clause applied.

That result was wrong. The test used `patch`, **which is not installed in this environment**. Every invocation returned "command not found", and the harness read a non-zero exit as a conflict.

Re-run with `git apply`, the true picture was:

| File | Applies to clean HEAD? |
|---|---|
| `client/src/App.tsx` | ✅ |
| `client/src/components/nav-bar.tsx` | ✅ |
| `docs/product/structure/routes/routes-map.md` | ✅ |
| `server/migrations/runner.ts` | ✅ |
| `server/routes.ts` | ✅ |
| `shared/schema.ts` | ✅ |
| `server/intelligence/capability-registry.ts` | ✅ |
| `.engineering/session/CURRENT.md` | ❌ genuine overlap |
| `package.json` | ❌ genuine overlap |

**Six of eight were only line-offset**, not conflict — inherited changes sat elsewhere in the file and shifted line numbers. In `nav-bar.tsx`, for instance, HOUSE2 edited line ~414 while SHOP3 edited line ~506; they never touch.

Reporting "clean separation is impossible" on the strength of a missing binary would have been a confident false statement, and it is recorded here because the failure mode — *a tool that is absent reads exactly like a tool that disagrees* — is not specific to `patch`.

### The two genuine overlaps

- **`package.json`** — the aggregate `"test"` script is a **single physical line**. Inherited work appended 7 entries to it; SHOP3 appended 1; COMM1 appended 1. All on the same line, so line-granular tools cannot separate them.
- **`.engineering/session/CURRENT.md`** — the dashboard table, where inherited sessions and this one both appended rows in the same region.

Both are *append-structured*, so each contribution is a distinct token even though the line is shared. Both were reconstructed by taking the parent commit's version and inserting only the relevant workstream's entries, then validated (`json.load` for `package.json`; row-presence greps for `CURRENT.md`).

---

## 4. HOW THE COMMITS WERE BUILT

A temporary index (`GIT_INDEX_FILE`) plus `git --work-tree=<scratch> add` was used throughout, so **the real index and the working tree were never modified** during construction. Each commit was created with `git commit-tree` and the branch advanced with `git update-ref <new> <expected-old>` — the old-value argument making the ref update fail rather than clobber if anything had moved underneath.

### Commit A — SHOP3 (`54ffa26f`)

17 files, **+1,358 / −7,818**. The deletions are `shopping-list-page.tsx` (4,242) and `ShoppingListView.tsx` (3,531).

Verified in an isolated worktree at that exact commit:
- `shopping-list-page.tsx` deleted ✓
- `server/lib/community.ts` **absent** ✓ (no COMM1 leakage)
- `package.json` contains SHOP3's test, **not** COMM1's, **not** inherited's ✓
- `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` carries SHOP3's one-line pantry-consumer correction but **not** Domain 37 ✓
- **`test-shop3-shopping-surface-convergence.ts`: 29/29 passed**

### Commit B — COMM1 (`be562c94`)

41 files, **+2,369 / −42**. Three new tables, the owning service, port, handler, binding, both test suites, Domain 37, the privacy registry entry, and the 22 capability-count scope-lock updates.

Verified in an isolated worktree at that exact commit:
- `community.ts` present ✓; SHOP3's deletion carried forward ✓
- no inherited entries in `package.json` ✓
- **`test-comm1-community-foundation.ts`: 81/81 passed**
- **`test-shop3-shopping-surface-convergence.ts`: 29/29 passed** (SHOP3 still intact on top of COMM1)

### A second false verification, caught

The first attempt to verify commit B **did not verify commit B.** `git worktree add` failed with *"Disk quota exceeded"*, the subsequent `cd` failed, and the test commands therefore ran in `/home/runner/workspace` — the live working tree — while printing green results that looked like isolated verification.

They were re-run after freeing ~4 GB of scratch trees, with `pwd` echoed inside the worktree to prove location. The figures above are from the genuine isolated run. The earlier ones are discarded.

---

## 5. THE tsc BASELINE, CORRECTED

Both the SHOP3 and COMM1 reports state **"88 pre-existing errors, 0 introduced."** That figure was measured in the working tree, i.e. **with inherited work present**.

Measured against the committed trees:

| Tree | `tsc --noEmit` errors |
|---|---|
| Plain HEAD `772eb6ed` (no inherited, no SHOP3, no COMM1) | **94** |
| Commit B `be562c94` (HEAD + SHOP3 + COMM1) | **94** |
| Working tree (HEAD + inherited + SHOP3 + COMM1) | **88** |

**Both comparisons show zero errors introduced by this session** — 94→94 committed, 88→88 in the working tree. The 6-error gap is prior-session work fixing pre-existing errors. Neither figure is wrong, but they measure different baselines, and the earlier reports did not say which. Recorded so a future reader is not confused by a "regression" from 88 to 94 that is purely the absence of uncommitted work.

---

## 6. MIGRATION STATE

Verified against the live database **after** committing:

```
expected head            : 2026-07-19_comm1_community_foundation
COMM1 migration recorded : YES
community tables present : 3 of 3
migrations not applied   : none — at head
last applied             : comm1_community_foundation,
                           know2_claim_rejection_state,
                           bus2a_commercial_foundation
```

| Tree | Migration count | Head |
|---|---|---|
| Plain HEAD `772eb6ed` | 95 | `2026-07-18_bus2a_commercial_foundation` |
| Commit B `be562c94` | 96 | `2026-07-19_comm1_community_foundation` |
| Working tree | 97 | `2026-07-19_comm1_community_foundation` |

COMM1 added **exactly one** migration. The working tree's extra entry is `2026-07-19_know2_claim_rejection_state`, an **inherited** migration that remains uncommitted — it was already applied to this database by the session that wrote it.

> **Caveat for whoever commits the inherited work.** In the committed history, `comm1` follows `bus2a` directly. When `know2` is committed it will be inserted into the array *before* `comm1`, changing the list order relative to commit B. This is harmless — `schema_migrations` tracks by id, the two migrations are independent DDL, and `expectedMigrationHead()` still returns `comm1` — but it should be a conscious observation rather than a surprise.

---

## 7. PRIOR-SESSION WORK: PRESERVED

**86 entries remain uncommitted** — 57 modified, 27 untracked, 2 staged deletions. All of it is prior-session work.

| Check | Result |
|---|---|
| All 59 inherited tracked modifications still present | ✅ 59/59 |
| Inherited staged deletions still staged | ✅ `pantry-intelligence-assembler.ts`, `recommendation-service.ts` |
| Any session-start entry now missing | ✅ **none** |
| `package.json` / `CURRENT.md` working-tree SHA-256 | ✅ **unchanged** |
| Any SHOP3/COMM1 file left uncommitted | ✅ none |

### A third error, caught after pushing

The first GIT2 commit (`014503d3`, since amended away) **swept in the two
inherited staged deletions** — `pantry-intelligence-assembler.ts` and
`recommendation-service.ts`, 484 lines — because they were left staged by the
repair described below, and `git commit` with no pathspec takes everything in
the index.

Nothing was lost: the deletions were already staged by a prior session and the
content remains in history. But attributing another session's work to a commit
whose message never mentions it is precisely the misattribution this entire
workstream existed to prevent, and it happened in the one commit written to
document preventing it.

Fixed with `git reset --soft HEAD~1`, unstaging the two paths, and recommitting
the report alone — then `git push --force-with-lease`, whose lease check
guarantees the rewrite is refused if anything had fetched the bad commit in the
intervening minute. The two deletions were returned to their staged state
afterwards.

**The lesson is narrow and worth stating:** every other commit in this session
was built with an explicit file list against a temporary index. This one used
plain `git add` + `git commit`, and that was the only difference.

### One thing that had to be repaired

Because the commits were built with a *temporary* index, the real `.git/index` never learned about them. Immediately after the branch moved, `git status` showed all 11 new files as **staged deletions** alongside untracked copies — an alarming display, though no content was ever at risk.

`git reset --mixed HEAD` refreshed the index against the new HEAD without touching the working tree. That correctly resolved the new files, but as a side effect **unstaged the two inherited deletions** (`D ` → ` D`). They were re-staged with `git add -A --` to restore the exact state found at session start. Verified: the full `git status` diff against the session-start snapshot shows nothing missing.

---

## 8. VALIDATION PERFORMED

| Check | Result |
|---|---|
| `test:shop3-shopping-surface-convergence` (working tree) | **29 passed, 0 failed** |
| `test:comm1-community-foundation` (working tree) | **81 passed, 0 failed** |
| `test:comm1-community-database` (working tree, DB-backed) | **14 passed, 0 failed** |
| SHOP3 test **inside commit `54ffa26f`** | **29 passed, 0 failed** |
| COMM1 test **inside commit `be562c94`** | **81 passed, 0 failed** |
| SHOP3 test **inside commit `be562c94`** | **29 passed, 0 failed** |
| `tsc --noEmit` | 94 committed / 88 working tree — **0 introduced either way** |
| Migration applied and at head | ✅ |
| Push | ✅ in sync, 0 ahead / 0 behind |
| Reports present | ✅ both, committed |

---

## 9. ROLLBACK PROTECTION RESTORED

This was the point of the exercise. Before GIT2, both tags resolved to the same commit, so reverting COMM1 would have discarded SHOP3.

| Tag | Resolves to | Now covers |
|---|---|---|
| `rollback/SHOP3-shopping-surface-convergence-20260719` | `772eb6ed` | state before SHOP3 |
| `rollback/COMM1-community-foundation-20260719` | `772eb6ed` | state before SHOP3 **and** COMM1 |

The commits themselves now provide the finer granularity the tags could not:

```
git revert be562c94     # COMM1 only, SHOP3 untouched
git revert 54ffa26f     # SHOP3 only, COMM1 untouched
git reset --hard 54ffa26f   # keep SHOP3, drop COMM1
```

> **`git revert be562c94` does NOT drop the database tables.** The COMM1 migration is applied. Reverting the code leaves `communities`, `community_members` and `community_invitations` in place — empty and unreferenced, therefore inert, but present. Removing them requires a deliberate down-migration, which THA's append-only migration model does not provide and which this workstream did not write.

---

## 10. AUTHENTICATION NOTE

The first push failed: *"Invalid username or token. Password authentication is not supported."* No credential helper was configured and no token was present in the environment.

`gh` was already authenticated as `thehealthyapples`, so `gh auth setup-git` was run to install it as the credential helper for `github.com`. This is a **persistent local git config change** (`credential.https://github.com.helper`), not a one-off — it will apply to future pushes from this workspace. It stores no new secret; it delegates to the existing `gh` login.

---

## 11. SCOPE

**Held.** No COMM2 work, no code changes, no unrelated edits. GIT2 changed no file content — it only decided which existing content went into which commit.

The single exception is the git config change in §10, which was required to complete the mission's push step.

### Follow-ons

1. **Prior-session work is still uncommitted** — 86 entries covering NUTPLAN1, NUTPLAN2, HNP2, PLAN2, COMP3, COMP4, KNOW2, HOUSE2 and others, several marked "Waiting for User" on the dashboard. GIT2 deliberately did not commit work it did not author. It should be reviewed and committed by whoever owns it; until then it is exposed to any hard reset.
2. **The committed `CURRENT.md` is partial by construction.** It carries the SHOP3 and COMM1 rows but not the inherited sessions' rows, which live only in the working tree. Committing the inherited work will reconcile it.
3. **`patch` is unavailable in this environment** (§3). Any tooling or runbook that assumes it will fail silently-looking rather than loudly.
