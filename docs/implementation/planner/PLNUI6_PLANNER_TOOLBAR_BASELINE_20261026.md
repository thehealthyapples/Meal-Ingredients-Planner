# PLNUI6 — Planner toolbar baseline alignment

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — desktop visual alignment only.  
**Approval:** User asked to refine alignment of the one-line controls.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`; fresh CSS copy `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\planner-physical.css.before-toolbar-baseline-20261026T153400`.

## Scope

Give the existing desktop toolbar a common 38px height and vertically center date controls, search, Plan, Workspace/menu, and the household family icon/count inside that row. No horizontal placement, behavior, mobile/tablet layout, or Planner data changes were intended.

## Governance and architecture

- **Owning repo/area:** `tha-integrated-dev`, Planner UI.
- **Governing chain:** root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/OPERATING_MANUAL.md`; `docs/ai-operating-model/README.md` and applicable implementation/rollback guidance; THA operating-model skill.
- **Pre-change status:** 32 existing dirty entries; preserved. Branch and HEAD verified. Fresh exact-byte CSS snapshot created before edit.
- **Approval/risk:** direct user instruction, Green. No architecture or interaction change.
- **Experience check:** maintains the one-line arrangement while bringing controls onto a shared visual baseline, reducing apparent clutter.
- **Architecture — Verified:** Planner state remains owned by Domain 14 in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`. The change only adjusts CSS for existing controls; no entity, state, workflow, service, or persistence changes.

## Files changed

- `client/src/styles/planner-physical.css` — consistent 38px row height, vertical centering, common sizing for family icon control.

## Verification

- `npm run build`: **PASS**. Existing Browserslist, PostCSS, large-chunk, and CJS `import.meta` warnings remain.
- Scoped `git diff --check`: **PASS**; line-ending normalization warnings only.
- No tests added or run.
- Acceptance page: `http://127.0.0.1:5001/planner`. Screenshot capture remains unavailable due Edge capture timeout; final visual alignment is not confirmed.
- Data impact: none. No service, database, schedule, configuration, deployment, commit, or push touched.
- Remaining uncertainty: visual review is still needed to confirm alignment at the user's desktop viewport.

## Rollback

Restore `client/src/styles/planner-physical.css` from the exact-byte `.before-toolbar-baseline-20261026T153400` snapshot in the rollback evidence directory. Preserve all unrelated dirty state. The Git tag protects committed history only.
