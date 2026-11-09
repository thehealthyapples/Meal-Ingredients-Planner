# Planner top-left control spacing — 2026-10-26

## Request and scope
Improve spacing between the small controls in the Planner's upper-left intelligence area and keep the household profile/override control easy to click. CSS-only; Green visual polish.

## Governing authority and architecture
Repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, architecture entry point, Planner experience/UI guidance, and rollback/risk rules were read in the active Planner task chain. Implementation remains permitted under the standing authority for `feat/integrated-dev`. The existing household override button continues to call its established state handler; no ownership or workflow was added.

## Change
- `client/src/styles/planner-physical.css`: distribute the intelligence strip's visible controls across its row using flex space-between and an explicit gap, remove the expand button's auto-margin packing, and raise the household override region above the strip with pointer events enabled.
- The existing household control remains a button with the `setWeekDietsOpen` handler and accessible label/expanded state.

## Rollback and preservation
- Rollback tag: `rollback/planner-mobile-image-adoption-20261026`.
- Pre-edit snapshot: `.engineering/session/rollback-evidence/planner-followup-20261026/planner-physical.css.before-top-left-control-spacing-20261026T222356`.
- Pre-existing dirty and untracked work preserved; no commit/reset/stash/branch switch/cleanup performed.

## Verification
- `npm run build`: passed (existing Browserslist/PostCSS/bundle/import-meta warnings remain).
- `git diff --check -- client/src/styles/planner-physical.css`: passed.
- No tests added or run. No fresh browser capture made after the change.
- No live services, databases, scheduled tasks, or configuration touched.
