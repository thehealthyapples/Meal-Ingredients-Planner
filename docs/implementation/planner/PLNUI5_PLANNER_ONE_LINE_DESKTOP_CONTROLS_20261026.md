# PLNUI5 — Planner one-line desktop controls

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — desktop visual layout only.  
**Approval:** User's direct request, clarified by the red-marked screenshot, authorizes the one-row toolbar.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`. Fresh exact-byte snapshots: `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\weekly-planner-page.tsx.before-one-line-controls-20261026T152300` and `...\planner-physical.css.before-one-line-controls-20261026T152300`.

## Scope

Read the supplied annotated screenshot as placing the family override icon at the far left; search next; the week/date controls in the center; and Plan immediately to the left of Workspace and the overflow menu. The provisions dropdown was not marked and remains in its existing row. The goal is to consolidate the marked controls into one desktop row and reduce the toolbar's vertical footprint.

## Governance and architecture

- **Owning area:** Planner UI in `tha-integrated-dev`.
- **Governing chain:** root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/OPERATING_MANUAL.md`; `docs/ai-operating-model/README.md` and its implementation, approval, and rollback guidance; THA operating-model skill.
- **Pre-change status:** 28 dirty entries, all preserved. Branch and HEAD verified before the change. Fresh snapshots created before modifying the already-dirty Planner sources.
- **Approval / risk:** Direct request approves this exact desktop composition; Green because this changes presentation only. No promotion or Gate 9 request.
- **Experience check:** Consolidating these controls gives the weekly grid more room and lowers interface density. Existing household choice, voice, agency, and action behavior remain.
- **Canonical owner — Verified:** Planner weeks/days/entries/assignments remain with Domain 14 in `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`. Existing `WorkspaceHeader`, Planner overlay, and override query/state are reused. No duplicate owner, state, entity, or workflow is introduced.

## Changes

- `client/src/styles/planner-physical.css`: put search at the left of the top paper row; retain the date/week controls at center; move Plan up to the right beside Workspace and the overflow menu; move the family icon/count onto the same line. Desktop breakpoint only.
- `client/src/pages/weekly-planner-page.tsx`: existing `planner-week-toolbar` and icon/count markup from the prior change are used; no further behavior change.

## Verification and acceptance

- **Build:** `npm run build` passed. Existing Browserslist, PostCSS, large-chunk, and CJS `import.meta` warnings remain.
- **Diff check:** scoped `git diff --check` passed; Git emitted LF/CRLF normalization warnings.
- **Tests:** none added or run.
- **Acceptance target:** `http://127.0.0.1:5001/planner`, at desktop width: family icon → search → centered week/date → Plan → Workspace/menu; provisions remains below. Expected result: controls occupy one line and the planner keeps the space below. Screenshot capture timed out, so no pixel-level visual confirmation is claimed.
- **Data impact:** none. No services, database, scheduled task, or configuration touched. No commit, push, or deployment.
- **Remaining uncertainty:** visual clearance and actual grid breathing room need review in the running browser; the build does not verify geometry.

## Rollback

Restore the two source files from the fresh `.before-one-line-controls-20261026T152300` snapshots in the rollback evidence folder; preserve all other dirty work. The rollback tag anchors committed history only.
