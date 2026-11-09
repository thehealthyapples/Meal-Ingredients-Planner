# Planner header and viewport investigation — 2026-10-24

## Scope and outcome

Read-only review of the attached Planner screenshot and the Planner header/surface source in `tha-integrated-dev-g-native-20261003`. No source files were changed. The user asked Claude to assess the top region outlined in red and whether the Planner can better fill the page.

## Governance preflight receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** exact requested checkout; `feat/integrated-dev`
- **Base HEAD:** `bffc533d65f58ae30c1faf7d3026b50dcc17be89`
- **Git status at start and end:** `AGENTS.md` and `PROJECT_GOVERNANCE.md` modified; five pre-existing untracked reports/investigations; no Planner source files changed. Branch was one commit ahead of `origin/feat/integrated-dev`.
- **User request:** ask Claude to inspect the visible Planner top banner/viewport and recommend what could make the Planner occupy more of the page.
- **Governing files read:** workspace instructions supplied in the conversation; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (including §18.2); `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/REPOSITORY_CONVENTIONS.md`; `docs/ai-operating-model/README.md`; `docs/ai-operating-model/risk-and-approval.md`; `docs/ai-operating-model/evidence-and-architecture.md`; `docs/ai-operating-model/principles.md`; `docs/ai-operating-model/rollback-and-output.md`; `docs/investigations/README.md`.
- **Task-specific source inspected:** `client/src/pages/weekly-planner-page.tsx`, `client/src/styles/planner-physical.css`; Claude was scoped to those plus `client/src/components/workspace-header.tsx`.
- **Authorised scope:** read-only assessment and recommendation; no implementation.
- **Non-goals:** editing UI, running tests, altering config/services/database, or promotion.
- **Architecture/governance conflicts:** none identified for this investigation. Any actual visual change needs the Experience Constitution Check before design, as required by `GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2.
- **Risk:** Green investigation; no behavioral change was made.
- **Implementation permitted:** NO (no implementation requested or performed).

## Preliminary findings (repository evidence)

- **Verified:** In the normal Planner render, `WorkspaceHeader` is rendered before the planner surface, with the title, search control, and a context bar that contains week selection and actions. See `client/src/pages/weekly-planner-page.tsx:1858-1871` and the actions around `:1956-1970`.
- **Verified:** The physical Planner surface is a separate sibling after the header (`weekly-planner-page.tsx:2059`). Its desktop minimum height is `100dvh - 68px` and it clips overflow (`planner-physical.css:25-32`). The grid itself is placed within that surface using a top offset and fixed percentage height (`planner-physical.css:50-56`).
- **Inferred:** The screenshot's substantial top area is primarily the shared workspace header occupying normal document flow *above* a viewport-height surface. Since the surface height calculation does not subtract the header or bottom navigation, it cannot make the meal canvas fill the remaining visible area; the browser viewport shows the header plus only part of the surface. Actual pixel contribution depends on the shared `WorkspaceHeader` implementation, browser viewport, and zoom, which were not measured live.
- **Verified:** The local Planner stylesheet already reduces the workspace pill's margins and controls' minimum height, and its comment says the room label is intentionally repeated in the threshold so the pill can be shorter (`planner-physical.css:9-22`). This suggests an earlier compacting attempt but does not explain or remove the full header height.
- **Inferred:** The most conservative design direction is to keep the planner actions discoverable while reducing the header's vertical footprint or sizing the physical surface to the actual remaining viewport. A CSS-only height tweak may crop the photo/grid or create overlap because the grid's percentages are relative to its surface. Moving or hiding controls has usability and governance trade-offs and should be evaluated against the Experience and UI architecture before design.

## Claude review attempt

Two read-only Claude tasks were submitted through the new local AI Agent Bridge. Both exited with code 1 without a successful result; neither changed any allowlisted or repository source file. Bridge-generated failure reports:

- `G:\The Healthy Apples\Incoming\Agent Reports\THA-AI-Agent-Bridge-aab-20261024224440-48e029b8-CLAUDE-2026-10-24.md`
- `G:\The Healthy Apples\Incoming\Agent Reports\THA-AI-Agent-Bridge-aab-20261024224758-4dad4189-CLAUDE-2026-10-24.md`

The bridge provides no underlying Claude error detail (`error_event: null`), so the cause of the CLI failure is unknown. The bridge process has been stopped. No persistent Git configuration, application config, database, scheduled task, or deployment was changed. The bridge did create task records and failure reports under its documented local paths.

## Recommendation and limits

The code evidence points to the boundary between the shared header and the dedicated physical surface as the first place to investigate. Before proposing a visual change, measure the header, bottom navigation, and remaining viewport at the screenshot's dimensions; compare a compact single-line/two-line header treatment with a surface-height calculation that accounts for both persistent regions. Preserve accessible access to search, week navigation, and planning/basket actions. This is a direction for a later design review, not an approved implementation.

The Claude opinion is unavailable because both delegated runs failed. The attached screenshot is evidence of the user's visible issue, not proof of the layout at other viewport sizes. No live browser/runtime verification or tests were run. No database, scheduled task, or deployment was touched.
