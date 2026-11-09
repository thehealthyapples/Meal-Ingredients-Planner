# Planner toolbar spacing and intelligence strip — 2026-10-26

## Task and scope
Address the Planner screenshot markup: remove the large empty Workspace Search row, place the drop target affordance on the upper toolbar, recover vertical room for the week grid, and correct the blurred upper-left intelligence strip. This is a desktop visual/UI change. Existing provisioning items and drag/drop ownership remain with the current provisioning component.

## Repository and governance
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch: `feat/integrated-dev`
- HEAD at start: `bffc533d65f58ae30c1faf7d3026b50dcc17be89`
- Governing files read for this task (see preflight in the task history): repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`, `docs/change-control.md`, and `Incoming/Issue Screenshots/README.md`.
- Approval: task governance showed `Implementation permitted: YES` under standing authority for `feat/integrated-dev`.
- Risk: Green, visual UI presentation only; no business logic or persistence changes.

## Evidence and diagnosis
- `PlannerIntelligenceStrip` was rendered in the normal stage flow underneath the inline workspace header. The header's global `.workspace-pill` applies `backdrop-filter: blur(6px)`, causing the strip to appear blurred through the overlay.
- The provisioning drop zone itself rendered a full-width empty panel with “Workspace Search: drag a result here.” when expanded. Its empty-state instruction duplicated the drop affordance and occupied planner space.

## Changes
- `client/src/pages/weekly-planner-page.tsx`: show “Workspace Search · drop here” inside the existing provisions button while there are no provisions; show “Provisions” when items exist. Keep the existing `DroppableProvisioning`, data flow, and populated item list. The empty expanded panel no longer repeats the hint.
- `client/src/styles/planner-physical.css`: position the intelligence strip in the upper paper margin above the translucent header, compact it, place the provisioning target on the toolbar's right side, and raise the grid into the space formerly consumed by the empty row.

## Rollback and preservation
- Required rollback tag `rollback/planner-mobile-image-adoption-20261026` remains the committed baseline at the start commit.
- Pre-edit snapshots were saved in `.engineering/session/rollback-evidence/planner-followup-20261026/` with the suffix `before-workspace-search-relocation-20261026T215329` for both touched files.
- Preserved all pre-existing dirty and untracked work. No reset, stash, branch switch, or cleanup performed.

## Checks
- `npm run build`: passed.
- `git diff --check`: passed.
- No tests were added or run.
- No live services, databases, scheduled tasks, or configuration were changed.
- No fresh browser screenshot verification was completed in this turn; the earlier attached screenshot was used as visual evidence. Build confirms compilation, not final pixel alignment.

## Remaining uncertainty
The desktop toolbar placement is proportion-based. Validate at the target desktop viewport and browser zoom levels; the absolute positions may need small tuning after visual inspection.
