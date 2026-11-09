# Codex Luna — Planner desktop layout investigation

Date: 2026-10-26
Task: Initial read-only investigation of the current Planner desktop layout feedback.
Agent: Codex CLI, model gpt-6-luna, low reasoning effort.

## Scope and preflight

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch/HEAD verified by Codex CLI: `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
- The worktree was already dirty, including the Planner page, panel, CSS, workspace header, governance files, and unrelated docs. The investigation made no source changes.
- Parent preflight sources: `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md`; `docs/architecture/HOME_OWNER_ARCHITECTURE.md`; `docs/implementation/planner/PLNUI1_PLANNER_SURFACE_HEADER.md`; `.engineering/session/runs/PLNUI2_Calm_Planner_20261026.md`.
- Codex CLI was told to rely on this completed parent preflight and did not independently re-read the governance documents.
- Risk: Green, investigation only. No implementation or acceptance decision was made.

## Findings

1. **The 4:3 image can shrink when the workspace opens.** `client/src/styles/planner-physical.css:38-44` caps the stage by both available width and height. At desktop widths, `:285-288` adds a 244px column for the workspace, taking width away from the scene; the panel is also 244px wide (`PlannerAssistantPanel.tsx:1894-1902, 1925-1932`). This explains a smaller image when the panel is open. How much side margin appears depends on the viewport and parent height, which were not verified in the completed CLI pass.

2. **The title is forced visible by the inline header mode.** The page passes `title="Planner"` and `inline` (`weekly-planner-page.tsx:1893-1899`). `workspace-header.tsx:159-166` sets `showTitle` when `inline` is true. This directly explains why “Planner” is rendered; preserving a semantic heading for assistive technology is a separate requirement from displaying the word on the board.

3. **Sunday may be beyond the visible grid, rather than absent.** The matrix includes a 900px minimum-width container inside a horizontal overflow region (`weekly-planner-page.tsx:2516-2524) desktop panel opening narrows the scene track (`planner-physical.css:285-299`). Together these can put Sunday out of view. The CLI could not establish whether the live viewport/scroll position actually clips it or whether data/rendering is involved.

4. **Controls still have separate interface styling.** The CSS gives the workspace toggle a bordered capsule (`planner-physical.css:96-120`) and presents week-level diet/provision controls as dark translucent buttons (`:169-201`). The visual feedback that they look attached over the scene is consistent with these styles, but the current desktop screenshot was not available to this read-only source pass.

## Direction to consider

Keep the kitchen asset undistorted. Remove the visible redundant title while retaining an accessible page heading. When the workspace is closed, let the board use the full scene width available to it; when opened, avoid reducing the board's 4:3 dimensions if doing so makes the week unusable. Rework the grid's 900px minimum/overflow so all seven days remain visible at the agreed desktop viewport, and restyle controls as quiet inset or printed elements of the paper margin. Verify the actual target viewport before choosing exact sizing. Alternative: retain the side-docked workspace and expose horizontal grid overflow clearly; this is simpler but does not ensure Sunday is visible at once.

These are recommendations for discussion only. They do not settle whether the panel should overlap the kitchen margin, dock beneath the board, or use a different arrangement; that requires a review at the target desktop size.

## Actions and limits

- The successful pass used Codex CLI `--model gpt-6-luna`, `--sandbox read-only`, and low reasoning. Two earlier launches were stopped before a complete investigation because their source extraction exceeded the intended output bound; the final pass used bounded source windows.
- No files were edited by Codex CLI; no tests/builds were run; no application services, databases, or user data were accessed.
- No live desktop capture or viewport dimensions were available to the completed pass. Sunday visibility and side-margin size therefore remain runtime-dependent hypotheses.


