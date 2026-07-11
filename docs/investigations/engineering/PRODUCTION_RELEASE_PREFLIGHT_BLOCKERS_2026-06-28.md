# Production Release — Pre-Flight Blockers & Open Questions

**Date:** 2026-06-28
**Author:** Claude Code (release pre-flight)
**Task type:** Release (pre-flight verification)
**Status:** ⛔ HALTED at pre-flight — no push, commit, branch move, or build performed
**Production (`origin/main`) currently at:** `c0ea8d5`

---

## Summary

Pre-flight verification was performed before executing the approved THA production
release (GitHub `main` → Render auto-deploy). The verification found **material
discrepancies** between the approved preconditions and the actual repository state,
making "execute the release" ambiguous and unsafe to perform without disambiguation.

The release was therefore **halted at pre-flight and escalated**. No production-affecting
action was taken: nothing pushed, no commits created, `main` not moved, build not run
(the topology questions gate everything downstream). Five open questions must be answered
before the release can safely proceed or be closed out.

---

## Findings

### Approved preconditions (as stated) vs. observed reality

| # | Stated precondition | Observed reality |
|---|---------------------|------------------|
| 1 | "GitHub push is a clean fast-forward." | True **only** for `main`→`origin/main` (32 commits). The branch HEAD that was "confirmed" (556747e) is 96 commits ahead of prod. Ambiguous which is the target. |
| 2 | "Production verification alignment completed." | The alignment edits to `scripts/verify-prod.ts` and `RELEASE.md` are **uncommitted** in the working tree. Nothing will ship them unless committed. |
| 3 | "Build passes." | Not re-verified — blocked behind the unresolved target/commit questions. |
| 4 | "Rollback tag exists." | No rollback tag points at the **current production commit** (`c0ea8d5`). The 2026-06-28 rollback tags point elsewhere (see Rollback Information). |

### Branch topology (history is linear)

```
c0ea8d5 (origin/main = LIVE PROD)
   │  … 32 commits …
   ▼
f384f6a (local main)        ← "+32" fast-forward payload
   │  … 64 commits …
   ▼
556747e (safety/preserve-since-last-prod-20260617-1613 = current HEAD)  ← "+96" payload
```

- Current checked-out branch: `safety/preserve-since-last-prod-20260617-1613` @ `556747e`
- Local `main`: `f384f6a` — **64 commits behind** current HEAD, **32 commits ahead** of `origin/main`
- `origin/main` (live prod): `c0ea8d5`
- `merge-base(main, 556747e)` = `f384f6a` → `main` is an ancestor of the safety HEAD (clean linear line)
- `origin/main` → `main` **is** a fast-forward (32 commits)

**Implication:** "Fast-forward main and push" ships **32 commits** (up to f384f6a). But the
HEAD the summary confirmed (556747e) is **96 commits** ahead of prod and additionally
contains the WX14 / WX14a workspace-apple work. These are materially different releases.

### Uncommitted release-gate changes

The working tree is dirty, and the dirty files are the verification gates themselves:

```
 M RELEASE.md
 M scripts/verify-prod.ts
?? GITHUB_TO_RENDER_RELEASE_MODEL_CHECK_2026-06-28.md
?? docs/investigations/engineering/PRODUCTION_MIGRATION_VERIFICATION_ALIGNMENT_2026-06-28.md
?? docs/investigations/engineering/PRODUCTION_VERIFICATION_ALIGNMENT_IMPLEMENTATION.md
?? docs/investigations/engineering/PRODUCTION_RELEASE_PREFLIGHT_BLOCKERS_2026-06-28.md  (this file)
```

`scripts/verify-prod.ts`:
```diff
-    const expectedHead = "2026-05-23_add_pantry_need_quantity";
+    const expectedHead = "2026-06-18_ws0_knowledge_registry";
```

`RELEASE.md`:
```diff
-[Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state
+[Migrations] Schema at head: 2026-06-18_ws0_knowledge_registry
...
-Expected head (as of 2026-04-19):
-2026-04-19_backfill_shopping_list_null_resolution_state
+Expected head (as of 2026-06-18):
+2026-06-18_ws0_knowledge_registry
```

The tag `rollback/pre-verify-prod-alignment-20260628` → `556747e` confirms 556747e is the
state **before** this alignment. If these changes are not committed onto the release target,
production verification will expect the **old** migration head and likely report a mismatch.

---

## Decisions

- **Halt the release at pre-flight.** A production push is hard to reverse and outward-facing;
  the observed state contradicts how the release was described, so the action is surfaced
  rather than performed.
- **Take no production-affecting action** (no push, commit, branch move, tag, or build)
  until the open questions are resolved by the user.
- **Document and escalate** the discrepancies and open questions (this file).

No autonomous decision was made on the release target, the disposition of the uncommitted
alignment changes, or the rollback anchor — those are the user's to make.

---

## Architecture Compliance

No architectural or code changes were made. This task was read-only verification plus
documentation. No refactoring, no architecture modification, no schema or data changes —
consistent with the instruction to "execute only the approved production release" and
"do not perform unrelated refactoring."

---

## Changes Made

- **Code/config:** None.
- **Production:** None.
- **Git state:** Unchanged (no commits, no branch moves, no tags, no pushes).
- **Documentation:** Created this investigation document under `docs/investigations/`
  (currently untracked in the working tree).

---

## Validation Performed

Read-only git inspection only:

- `git status` — confirmed dirty working tree (2 modified gate files, untracked docs).
- `git rev-parse` / `git log` — confirmed current branch (`safety/…` @ 556747e), local
  `main` (f384f6a), and `origin/main` (c0ea8d5).
- `git merge-base --is-ancestor` — confirmed linear history; `main` is an ancestor of
  556747e; `origin/main`→`main` is a fast-forward.
- `git rev-list --count` — confirmed +32 (main vs origin/main), +64 (safety vs main),
  +96 (safety vs origin/main).
- `git tag` enumeration — confirmed no rollback tag at the live prod commit (c0ea8d5).
- `git diff` — captured the uncommitted `verify-prod.ts` / `RELEASE.md` alignment edits.

**Not performed (blocked by open questions):** build, push, deploy, runtime migration check,
production verification run, smoke tests.

---

## Data Impact

None. No migrations were run, no production database touched, no deploy triggered. The
release that would carry migrations (up to `2026-06-18_ws0_knowledge_registry`) has not
been shipped.

---

## Trust Check

- **Reversibility:** A production push of 32–96 commits is hard to reverse and outward-facing
  → confirmation required before proceeding. Halt is the conservative, correct posture.
- **Faithful reporting:** The "clean fast-forward," "single confirmed HEAD," and "alignment
  completed" claims do not match the working tree; this is surfaced rather than glossed.
- **No silent action:** Nothing was pushed or committed under ambiguity. The release target
  and alignment disposition are escalated to the user, not assumed.

---

## Rollback Information

- **Live prod:** `origin/main` = `c0ea8d5`. The only tag on it is
  `rollback/profile-ux-investigation-2026-06-05` (an old investigation tag, **not** a
  deliberate pre-release anchor).
- **2026-06-28 rollback tags point elsewhere:**

  | Tag | Commit |
  |-----|--------|
  | `rollback/pre-verify-prod-alignment-20260628` | `556747e` |
  | `rollback/pre-migration-verify-investigation-20260628-2259` | `556747e` |
  | `migration-journal-repair-rollback-20260628-223249` | `e3db63f` |
  | `rollback/wx14a-pre-20260628` | `4667feb` |

- **No tag marks the currently-live production commit** as a clean revert target for this deploy.
- **Recommended:** create a rollback tag at `c0ea8d5` before any push (see Next Steps).
- **Rollback for this halt itself:** none needed — no state was changed.

---

## Outcome

Release **HALTED at pre-flight**. Production untouched and healthy at `c0ea8d5`. The
approved preconditions were found not to hold as described; five open questions block
safe execution. Awaiting user decisions.

---

## Next Steps

Open questions that must be answered before the release proceeds or is closed:

1. **Release target** — Is the approved HEAD `f384f6a` (local `main`, +32, excludes
   WX14/WX14a) or `556747e` (current HEAD, +96, includes WX14/WX14a)?
2. **Intended payload** — Which line of work is this release meant to ship (meal-detail/
   planner/dietary changes only, or also the WX14/WX14a workspace-apple work)?
3. **Last deployed commit** — Is `c0ea8d5` the expected current production state?
4. **Verification alignment** — Are the uncommitted `verify-prod.ts` / `RELEASE.md` edits
   intended-to-ship work (commit & include) or leftover/experimental (exclude)?
5. **Rollback anchor** — Should a rollback tag be created at the current production commit
   (`c0ea8d5`) before any push, as a safety net?

Recommended minimum corrective sequence once answered:

1. Confirm the release target commit (Q1/Q2) and the verification-alignment disposition (Q4).
2. If alignment is to ship: commit `verify-prod.ts` + `RELEASE.md` onto the chosen target first.
3. Create a rollback tag at `c0ea8d5` (current prod) before any push.
4. Re-run the build on the final, committed target.
5. Only then fast-forward `main` and push, and resume the monitored deploy sequence.

**Until Q1–Q5 are resolved, the release remains halted.**
