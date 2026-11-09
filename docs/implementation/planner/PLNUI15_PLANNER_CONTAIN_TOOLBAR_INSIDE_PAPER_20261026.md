# Keep Planner controls inside the light paper — 2026-10-26

## Request and scope
The owner clarified from the supplied screenshot that “Planner” means the light paper area, and reported the controls still extended outside that surface. Keep the full desktop toolbar and its rendered actions inside the paper's inner bounds. CSS-only, Green.

## Authority and architecture
Repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, architecture entry points, Planner experience/UI guidance, rollback rules, risk standard, and change control were read in the active Planner task chain. Standing approval applies to this visual implementation on `feat/integrated-dev`. Existing WorkspaceHeader, household override, and provisioning component ownership/state remains unchanged.

## Change
`client/src/styles/planner-physical.css` narrows the header to the visible paper bounds, reduces the search field to leave a clear gap before week controls, and gives the right-hand Workspace/menu group a wider slot whose end aligns with the paper's right inner edge. This prevents the controls' intrinsic button widths from overflowing the previous slot. The provisioning control and Plan action remain in their own paper slots.

## Rollback and preservation
- Rollback tag: `rollback/planner-mobile-image-adoption-20261026`.
- Before-edit snapshot: `.engineering/session/rollback-evidence/planner-followup-20261026/planner-physical.css.before-contained-paper-toolbar-20261026T224316`.
- Existing dirty/untracked work preserved; no reset, stash, cleanup, branch switch, or commit performed.

## Verification
- `npm run build`: passed; existing toolchain warnings remain.
- `git diff --check -- client/src/styles/planner-physical.css`: passed.
- The supplied screenshot was reviewed; no post-change screenshot has been captured, so final pixel alignment remains to be visually confirmed.
- No tests added or run. No live services, databases, scheduled tasks, or configuration touched.
