# Session: SHOP3_Shopping_Surface_Convergence

| Field | Value |
|---|---|
| **Session ID** | `SHOP3_Shopping_Surface_Convergence` |
| **Rollback ID** | `rollback/SHOP3-shopping-surface-convergence-20260719` → `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| **Start time** | 2026-07-19T16:25:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Converge the two live Shopping surfaces (`/shopping-workspace` and `/basket`
+ `/analyse-basket`) into one canonical household Shopping destination,
preserving every existing capability and resolving the safety-behaviour
divergence — `shopping-restriction-conflict`, the sole member of the closed
`critical` allowlist, currently reaches only one of the two doors.

## Rollback coverage caveat
The working tree was **dirty** at tag time (60 modified tracked files, 2 staged
deletions, from prior sessions this session did not author). The tag protects
**committed state only**. Uncommitted state snapshotted outside the repo at
`scratchpad/pre-SHOP3-snapshot/` (`uncommitted-tracked.patch`,
`untracked.tar.gz`, `status.txt`). SHOP3 is scoped to shopping files, none of
which appear in the pre-existing dirty set.

## Decisions taken (user-confirmed)
- **Canonical destination:** `/shopping-workspace`.
- **Method:** port `/basket`'s genuinely-unique capabilities into the canonical
  surface, *then* retire the duplicate door. Not "mount safety on both" —
  SHOP1:425-434 explicitly rejects that as entrenching the duplication.
- **In scope additionally:** the `'Industrial'`-from-null fabrication at
  `shopping-list-page.tsx:1150` (SHOP2 ranked it "do it first among the fixes").

## Files being modified
- `client/src/App.tsx` — route table: retire `/basket`, `/analyse-basket`
- `client/src/components/nav-bar.tsx` — remove the alias that lights the
  Shopping pip on the non-canonical door
- `client/src/pages/dashboard.tsx` — repoint 3 links away from `/basket`
- `client/src/pages/shopping-workspace-page.tsx` — receive ported capabilities
- `client/src/pages/shopping-list-page.tsx` — fabrication fix; then retirement
- `docs/implementation/shopping/SHOP3_SHOPPING_SURFACE_CONVERGENCE.md` — report

## Checkpoints
- [x] Git status confirmed; rollback tag created and reported
- [x] Both Shopping surfaces audited (file:line evidence captured)
- [x] Convergence method confirmed with user
- [x] Unique-capability differential proven (53 capabilities classified,
      file:line) — overturned the first audit: "full product database" was a
      TRIPLICATE (do not port), and the real blocker was single-item delete,
      absent from the canonical surface entirely
- [x] Capabilities ported: deletion granularity, pricing layer, extras table
- [x] Duplicate door retired; 9 inbound references repointed; 7,773 lines deleted
- [x] Safety divergence proven closed by test (29/29, and proven non-vacuous by
      reopening the door → 3 failures)
- [x] Verification: build OK; tsc 88 = baseline, 0 introduced; 771 assertions
      across 19 suites, 0 failures; coherence 3 failures → 2 (the introduced one
      fixed, 2 remaining are pre-existing and not this session's)
- [x] Implementation report written

**Last checkpoint:** Implementation report written

## Next action
Await user review. Nothing is committed — the tree carries SHOP3's changes
alongside the pre-existing dirty state from prior sessions. If accepted, commit
SHOP3's files only (they are disjoint from the inherited dirty set except
`package.json` and `routes-map.md`, both changed additively).

Recommended before merge: **visual verification of the canonical surface**. The
~640 lines of ported pricing UI are typechecked, built and asserted against, but
have not been exercised by a household.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
