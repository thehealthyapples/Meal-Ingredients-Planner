# PLNUI8 — Planner visible grid and controls

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — Planner visual presentation and explanatory copy only.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.

## Scope and preflight

Address the screenshots' visible Planner issues: the weekly provisions control is too large and its expanded content covers weekday headings; the household override icon does not read as an interactive control; Snacks is clipped; and the kitchen image should fill more of the vertical stage. Keep the approved desktop/mobile images, responsive source breakpoint, seven-day meal model, persistence, and existing add/remove pathways unchanged.

**Governance read:** repository `AGENTS.md`; `PROJECT_GOVERNANCE.md` (mandatory bootstrap, Planner direction, standing development-branch authority); `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (including §18.2); `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` (including the exact-byte desktop image approval); `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`; and `G:\The Healthy Apples\Incoming\Issue Screenshots\README.md`.

The repository preflight recorded 36 existing dirty entries before this follow-up. The two source files were already modified; exact pre-follow-up bytes are preserved at:

- `.engineering/session/rollback-evidence/planner-followup-20261026/weekly-planner-page.tsx.before-followup-20261026T165339`
- `.engineering/session/rollback-evidence/planner-followup-20261026/planner-physical.css.before-followup-20261026T165339`

**Implementation permitted: YES** under the standing authority for work confined to `feat/integrated-dev`. No governing conflict found for the requested presentation changes. The image source and breakpoint were held fixed to the exact approved compositions and breakpoint recorded in the Blueprint.

## Changes made

- `client/src/pages/weekly-planner-page.tsx`: the empty provisions state now tells the household how to use the existing Workspace Search drag-and-drop target. No manual-entry or persistence path was added.
- `client/src/styles/planner-physical.css`: reduced the provisions section's desktop footprint and constrained its open tray so it stays in the paper's upper margin; applied the slight proportional stage zoom; tightened desktop meal-cell and row-label padding; gave the family override icon a quiet hover/focus outline. Existing click handlers and accessible labels remain in place.

## Architecture compliance

- **Verified:** canonical Planner data remains `planner_weeks`, `planner_days`, and `planner_entries`, owned by Planner State in `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 14); no data owner or consumer workflow changed.
- **Verified:** provisions continue to use the existing `DroppableProvisioning` target and its current drag operation. No second add flow, duplicated state, or persistence was introduced.
- **Verified:** the exact approved desktop image remains `PLANNER_DESKTOP_BOARD_DOMINANT.png`; mobile remains its approved portrait image. The Blueprint's ≥1024px selection boundary was not changed.
- **Experience check:** the smaller provisions tray and tighter grid reduce competition and recover visible writing space. The copy answers the household's immediate “how do I add?” question without adding a new control or panel.

## Definition of done and verification

- Success: the provisions control takes less room, open empty-state copy explains drag-to-add, override control visibly responds to pointer/keyboard focus, and grid rows can use the paper height more efficiently.
- Must not break: seven-day grid, meal assignment, shopping, diet override behavior, image source selection, mobile surface, or persistence.
- **Build:** `npm run build` completed successfully. Existing warnings noted: stale Browserslist data, PostCSS `from` option notice, and four esbuild `import.meta`/CJS warnings.
- **Diff hygiene:** `git diff --check -- client/src/pages/weekly-planner-page.tsx client/src/styles/planner-physical.css` passed (Git emitted existing line-ending conversion warnings).
- No tests were added or run. No browser screenshot was captured in this follow-up, so pixel-level acceptance remains with Colin in the live Planner.
- Manual acceptance: open `/planner` at desktop width with Workspace closed and open; verify all seven headings, Snacks and Summary fit; expand provisions and verify it does not cover weekday labels; focus/click the family icon and confirm its existing overrides panel opens; test drag from Workspace Search into provisions.

## Data, trust, rollback, and scope

- Data impact: reads existing Planner UI state; writes no data; changes no meaning; no backfill.
- Trust check: guidance describes the verified existing drag route. The icon retains its accessible name and click behavior.
- Rollback the new follow-up's exact dirty files using the two timestamped snapshots above. The existing rollback tag anchors committed HEAD only and does not restore prior dirty work.
- No live services, database, scheduled task, configuration, staging, or production state was touched. No commit, push, deploy, migration, or promotion occurred.
- Scope lock: only the two Planner source files were edited by this follow-up. All earlier dirty work remains present.

## Product and adoption registries

- Product Knowledge Registry impact: NO; no product capability or behavior changed.
- UI adoption register impact: NO; no building block or shared UI pattern was introduced or retired.

## SUGGESTIONS

- After the browser refresh, have Colin confirm the image crop and row visibility at the actual desktop zoom levels; this run did not capture a new screenshot.