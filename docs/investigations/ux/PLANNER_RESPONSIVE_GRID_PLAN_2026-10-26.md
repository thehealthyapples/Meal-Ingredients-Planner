# Codex Luna — Planner responsive week-grid plan

Date: 2026-10-26
Task: Read-only UX plan for desktop/laptop and mobile weekly Planner, plus image candidate handoff.
Agent: Codex CLI, gpt-6-luna, low reasoning effort.

## Scope and authority

- Repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
- Branch/HEAD verified: feat/integrated-dev / bffc533d65f58ae30c1faf7d3026b50dcc17be89.
- Existing Planner code changes were preserved. Risk: Green planning/investigation; no implementation was authorized.
- Parent governance preflight sources: AGENTS.md; PROJECT_GOVERNANCE.md; docs/architecture/README.md; docs/architecture/ENGINEERING_WORKFLOW.md; docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md; docs/architecture/THA_UI_ARCHITECTURE.md; docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md; docs/architecture/THA_EXPERIENCE_BLUEPRINT.md; docs/architecture/THA_EXPERIENCE_LANGUAGE.md; docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md; docs/architecture/HOME_OWNER_ARCHITECTURE.md; prior Planner implementation/session records. Codex relied on this parent preflight and did not reread the documents.

## Verified current behavior

- The mobile branch renders a single-day view and horizontal day selector; the desktop seven-day matrix is hidden below md: client/src/pages/weekly-planner-page.tsx:2246, 2517.
- The desktop matrix has seven day columns and meal rows, with sticky meal labels: weekly-planner-page.tsx:2521-2528, 2569-2580.
- Phone CSS keeps the kitchen photo, uses cover, and hides the grid: client/src/styles/planner-physical.css:336-370, 456-458. Desktop base photo uses contain: planner-physical.css:47-55.

## Recommended model

Use one shared weekly grid, with Monday–Sunday as horizontal columns and Breakfast, Lunch, Dinner, Snacks as vertical rows, backed by the same planner entries on every device.

On phones, offer two presentations of that same grid:
1. Overview: fit the whole week and make empty slots easy to scan/select.
2. Detail: readable cells in a horizontally scrollable week grid for inspection and editing.

Treat these as presentation/zoom states, not duplicated planner state. When a slot is selected in overview, focus that same day and row in detail. Keep meal labels pinned on the left during horizontal movement; keep day headings and meal labels legible, and mark empty slots with both a visual cue and accessible text. Do not make drag the only editing operation.

Keep a narrow portrait kitchen composition with a smaller board than the laptop/desktop image. Preserve the photo’s proportions. The interactive grid needs a calm, opaque enough paper surface for text contrast; do not let photo detail reduce legibility.

## Phases and checks

1. Replace the mobile day-only presentation with the shared weekly-grid structure.
2. Add overview/detail zoom presentations over the same data and define how a selected slot moves into detail.
3. Tune the mobile board composition, horizontal scrolling, sticky labels/headings, touch targets, and empty-slot contrast.

Acceptance checks (not run): desktop/laptop show the complete seven-day matrix at once; phone overview shows all seven days and empty slots; phone detail scrolls continuously through all days; selection preserves the same day/meal location; keyboard, touch, and assistive technology can identify and operate slots.

Main unresolved decision: which phone presentation is the default (full-week overview or readable detail) and what overview scale keeps empty-slot patterns visible without making controls too small. Trade-off: overview improves gap scanning but reduces meal-name legibility; detail is readable but requires horizontal scrolling.

## Image candidates and task limits

- Laptop candidate: docs/investigations/ux/planner-image-candidates/PLANNER_LAPTOP_CANDIDATE_20261026.png.
- Revised narrow-board mobile candidate: docs/investigations/ux/planner-image-candidates/PLANNER_MOBILE_NARROW_BOARD_CANDIDATE_20261026.png.
- These are exploratory previews, not approved production assets and are not referenced by app code. The accepted original image remains unchanged.
- Codex CLI made no source changes; no tests/builds or services/data were accessed. Parent copied the two requested preview images into the candidate folder for handoff.

