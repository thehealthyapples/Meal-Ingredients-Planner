# Planner toolbar aligned to paper — 2026-10-26

## Request and scope
The owner clarified that “Planner width” means the light paper area inside the kitchen photograph, not the full web page/photo. Align every desktop top-row control to the paper's inner bounds. Green visual layout only.

## Authority and architecture
Repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, architecture entry points, Planner experience/UI guidance, rollback rules, risk standard, and change control were read in the active Planner task chain. Standing implementation authority remains applicable to `feat/integrated-dev`. Existing header, household override and provisioning controls remain their canonical state/data owners; no duplicate control or state is added.

## Change
`client/src/styles/planner-physical.css` now constrains the desktop inline toolbar to the measured paper region rather than the image/page width. The family override and intelligence strip occupy distinct left-side positions; search, week controls, provisioning, Plan, and Workspace/menu controls are positioned across the paper with gaps and without extending beyond its right edge.

## Rollback and preservation
- Rollback tag: `rollback/planner-mobile-image-adoption-20261026`.
- Before-edit snapshot: `.engineering/session/rollback-evidence/planner-followup-20261026/planner-physical.css.before-paper-bounds-toolbar-20261026T224041`.
- Existing dirty/untracked work preserved; no reset, stash, branch switch, cleanup, or commit performed.

## Verification
- `npm run build`: passed (existing Browserslist/PostCSS/bundle/import-meta warnings remain).
- `git diff --check -- client/src/styles/planner-physical.css`: passed.
- The supplied screenshot was reviewed as evidence of the prior controls overflowing the paper. No fresh post-change browser screenshot was captured.
- No tests added or run. No live services, databases, scheduled tasks, or configuration touched.
