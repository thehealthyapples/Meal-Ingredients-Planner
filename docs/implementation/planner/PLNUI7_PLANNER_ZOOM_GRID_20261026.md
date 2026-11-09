# PLNUI7 — Planner zoom diagnosis and grid expansion

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — grid sizing only. The separate image-breakpoint expansion is not implemented pending owner authorization to update the governing exception.  
**Approval:** User's report authorizes fixing grid utilization and investigating zoom distortion.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`; fresh snapshots: `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\weekly-planner-page.tsx.before-zoom-breakpoint-20261026T154200` and `...\planner-physical.css.before-zoom-breakpoint-20261026T154200`.

## Diagnosis

- **Verified:** `weekly-planner-page.tsx` selects the dominant desktop photo only at `min-width:1024px`; `planner-physical.css` switches to its 1836:856 desktop stage under the same 1024px threshold. When browser zoom reduces the CSS viewport below 1024px, both rules stop matching and the page falls back to the 4:3 photo/stage. This causes a composition switch during zoom and is the likely source of the reported distortion and reduced grid area.
- **Verified:** `THA_EXPERIENCE_BLUEPRINT.md` records the exact-byte dominant desktop asset as approved for widths ≥1024px. Applying it below that width would broaden the recorded exception. No exception or breakpoint change was made.
- **Owner decision needed:** keep the current ≥1024px image rule, or approve recording and implementing a landscape desktop/laptop breakpoint that keeps the approved image and wide stage when browser zoom lowers CSS width below 1024px. This is the remaining action needed to fix the zoom-induced scene switch.

## Implemented scope

The desktop grid is widened within the already approved composition: `left` changed from 16.8% to 13.5%, `width` from 69% to 74.5%; existing top and height are preserved. This gives the week grid more of the photographed planner's paper area without changing its vertical clearance from the provisions control.

## Governance and architecture

- **Owning area:** Planner UI in `tha-integrated-dev`.
- **Governing chain:** root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/OPERATING_MANUAL.md`; relevant `docs/ai-operating-model/` entries; THA operating-model skill.
- **Pre-change status:** 34 existing dirty entries were preserved. Branch/HEAD verified. Fresh exact-byte snapshots were created before this edit.
- **Architecture — Verified:** Planner state remains Domain 14 in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`. The grid remains the existing live overlay; no duplicate data, owner, workflow, or write path is added.
- **Data impact:** none. No services, database, schedules, configuration, deployment, commit, or push touched.

## Verification

- `npm run build`: **PASS**; existing Browserslist, PostCSS, large-chunk, and CJS `import.meta` warnings remain.
- Scoped `git diff --check`: **PASS**; Git emitted line-ending normalization warnings.
- No tests added or run.
- Browser screenshot capture timed out. Pixel fit and zoom behavior need visual confirmation after an approved breakpoint change.

## Rollback

Restore `planner-physical.css` from the `.before-zoom-breakpoint-20261026T154200` snapshot. The second snapshot is retained unchanged for source integrity. Preserve unrelated dirty state. The rollback tag protects committed history only.

