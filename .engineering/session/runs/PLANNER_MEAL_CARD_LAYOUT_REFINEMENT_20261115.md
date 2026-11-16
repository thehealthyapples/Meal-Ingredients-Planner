# Planner Meal Card Layout Refinement — 2026-11-15

## THA Governance Preflight Receipt
- **Repository / area:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, Planner desktop grid and shared meal-card display.
- **Branch / HEAD:** `feat/integrated-dev` / `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- **Worktree:** already intentionally dirty across unrelated features; both implementation targets already had unrelated edits. Preserved them. No commit, push, deploy, database, service, or configuration change.
- **Governing files read:** workspace `G:\The Healthy Apples\AGENTS.md` (provided in current conversation); repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_UI_ARCHITECTURE.md` §§6, 18; and the THA operating-model skill `thehealthyapples-ai-operating-model`.
- **Authority/conflicts:** none identified. Standing `feat/integrated-dev` development authority allows this scoped implementation.
- **Risk:** GREEN — visual presentation only; no data, interaction behavior, or workflow changes.
- **Rollback:** reused existing annotated tag `rollback/UX-planner-meal-card-layout-20261115` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`, created before the original layout task. The tag anchors committed state only. Exact pre-refinement copies of both already-dirty targets and `CURRENT.md` are in `.engineering/session/prestate/PLANNER_MEAL_CARD_LAYOUT_REFINEMENT_20261115/`.

## Experience Constitution Check
The change lowers visual weight and protects legibility by retaining a small thumbnail beside the meal title, with existing status and add controls before the title content. It uses existing entities and controls, changes no copy, adds no workflow, and does not alter user data.

## Architecture / scope lock
- **Verified:** Planner remains the owner of the grid and shared `PlannerMealCardContent` remains the owner of meal-card presentation.
- **Verified:** no duplicate state, workflow, component, or data owner is introduced.
- **Scope:** compact horizontal meal thumbnail/title layout; status marker precedes the card content; constrain seven desktop tracks with `minmax(0, 1fr)` and allow cells/entries to shrink. Existing single per-slot Add (+) control remains first. Mobile meal-card row remains horizontal.
- **Definition of done:** full-screen populated desktop grid has no horizontal clipping or vertical card spill; multi-entry cells stay readable; mobile remains intact; typecheck and diff check recorded.
- **Data impact:** none. No DB reads/writes or migration.
- **Rollback plan:** restore only this refinement from the byte-exact pre-refinement snapshots; do not reset the worktree or disturb unrelated dirty changes.

## Changes
- `client/src/components/PlannerMealCard.tsx`: removed desktop vertical stacking and full-cell image sizing; retained the existing fixed 48×40 thumbnail alongside title.
- `client/src/pages/weekly-planner-page.tsx`: constrained the day tracks with `minmax(0, 1fr)`, added `min-w-0` to grid entries, and placed status markers before each meal's thumbnail/title row. The existing single Add control remains before the card list.

## Verification
- `git diff --check` on both scoped files: PASS.
- `npm run typecheck`: 16 errors, matching the previously observed baseline; none references either scoped file.
- The full-screen Edge window was confirmed on `/planner`; its accessibility tree listed the full Monday–Sunday grid and populated meal cards. Native full-screen screenshot capture timed out repeatedly, so the final desktop appearance and clipping could not be independently confirmed in an after screenshot during this pass. A 644px in-app browser view confirmed the mobile single-day layout still displays its meal thumbnail/title on one row; that view also shows a narrow responsive header and is not evidence for desktop.
- No client-specific component test was found in the previous task review; no focused UI test was run in this refinement.

## Outcome
The incorrect stacked layout has been removed and the inline layout restored while constraining column widths. No commit or deployment was made. Desktop visual acceptance remains to be confirmed by an after screenshot because capture timed out.

## Owner screenshot follow-up — 2026-11-15 19:44 capture
- **Evidence:** `G:\The Healthy Apples\Incoming\Issue Screenshots\2026-11-15 19_44_49-The Healthy Apples and 19 more pages - Personal​ Edge.png` (read-only; original preserved). It showed the seven days fitting horizontally but meal titles reduced to a few characters, with second dinner cards crossing the bottom paper edge.
- **Verified cause:** desktop CSS overrode the component's 48×40px thumbnail to 72×60px (`client/src/styles/planner-physical.css`), while `minmax(0, 1fr)` constrained seven tracks to the available board width. The earlier status-before-content order spent additional width before the title.
- **Correction:** set the desktop image to 48×40px; remove title's 12px right padding in the paper grid; return basket/freezer/cooked status marks after the photo/title content; make the content flex item consume only remaining row width. Existing `+` remains first in each slot; photo remains before the title. Shorter image height also reduces multi-meal cell spill.
- **Prestate:** exact snapshots in `.engineering/session/prestate/PLANNER_MEAL_CARD_LAYOUT_SCREENSHOT_CORRECTION_20261115/`, plus original `PlannerMealCard.tsx` snapshot from `.engineering/session/prestate/PLANNER_MEAL_CARD_LAYOUT_20261115/`.
- **Checks:** scoped `git diff --check` passed. `npm run typecheck` remains at the same 16 baseline errors, none in the scoped UI files.
- **Live evidence limit:** full-screen Edge on `/planner` exposes the complete populated Monday–Sunday grid in its accessibility tree; full-screen screenshot capture timed out, so this correction is not claimed as visually verified from an after screenshot. The owner's capture is used as the before evidence.
