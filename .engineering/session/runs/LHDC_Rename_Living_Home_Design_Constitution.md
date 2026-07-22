# Session: LHDC_Rename_Living_Home_Design_Constitution

| Field | Value |
|---|---|
| **Session ID** | `LHDC_Rename_Living_Home_Design_Constitution` |
| **Rollback ID** | `rollback/LHDC-rename-living-home-design-constitution-20260722` → `a362e01b` (annotated tag; created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Start time** | 2026-07-22 |
| **Current stage** | Documentation → Waiting for User (committed & pushed; awaiting acceptance) |

## Objective
Rename `docs/architecture/ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` → `docs/architecture/LIVING_HOME_DESIGN_CONSTITUTION.md` and establish it as the **THA Living Home Design Constitution** (`LHDC1`). Rename + reference convergence **only**. Preserve the approved substance and ownership; do not broaden ownership silently. Preserve `EDDC1`/`ED3` as legacy identifiers. No duplicate governing document. No runtime/UI/asset/schema/business-logic/AI change.

## Key discipline
The historical report `docs/implementation/ED3_ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` is **NOT** renamed (its filename contains the substring) — path references were edited surgically, never blanket-replaced.

## Trust Check — the one tension, reported not silently rewritten
The new name "Living Home Design Constitution" could read as governing the whole Living Home's design, which would collide with existing owners (UIA colour/tokens, Blueprint/OHDB1/TRANSLATION1 materials/light, EXPLANG feeling, room behaviour, HOMEOWNER1 approval). **Reconciliation:** the rename broadens the *name*, not the *ownership*. § 1's owned scope is unchanged — the object-level visual/material admission standard, serving the Environmental Dressing layer today. An explicit non-broadening clause was added (header note + § 1 framing) rather than rewriting any rule. No approved rule was altered or expanded.

## Checkpoints
- [x] Read `docs/architecture/README.md`; confirmed git status (clean apart from heartbeat).
- [x] Created annotated rollback tag `a362e01b` and reported it before any change.
- [x] `git mv` architecture doc to the new filename.
- [x] Updated the renamed doc: title → "THA Living Home Design Constitution"; ID `LHDC1` (legacy `EDDC1`/`ED3`); status; rename/non-broadening note; self-name + self-path references.
- [x] Updated README: table row, blockquote (title/ID + non-broadening note), Live-status link.
- [x] Updated ED3 report: rename note at top + 4 architecture-doc path references (report filename unchanged).
- [x] Updated both session records (this run file + the ED3 run file) + CURRENT.md (ED3 row path + new rename row).
- [x] Wrote the task record `docs/implementation/LIVING_HOME_DESIGN_CONSTITUTION_RENAME.md`.
- [x] Verified: old filename absent, new present, no stale references, links resolve, diff is docs + session only.
- [x] Commit + push.

## Result
Renamed to the Living Home Design Constitution (`LHDC1`); one canonical constitution; `EDDC1`/`ED3` preserved as legacy identifiers; ownership intact; no competing document remains.

## Next action
Acceptance of the rename. Substantive work continues at **ED4 — Standing Welcome Admission** (unchanged by this rename), now admitted against the Living Home Design Constitution.

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
