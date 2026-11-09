# Diary coffee journal layout revision — 2026-11-04

## Task and authority

Owner: `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `3467abad4eca8d82ffc52756fee13874e389597f`. Colin asked to remove the separate header row, put Daily Log and Progress at the top right of the photograph, retain the same background in Progress, avoid desktop page scrolling, and add month/year selection. This is a 🟢 Green visual and navigation-control revision; **Implementation permitted: YES** under the direct request and the standing dev-branch authority in `PROJECT_GOVERNANCE.md`. No promotion is included.

Read for this revision: repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 21, and task-relevant passages of `ARCHITECTURE_PRINCIPLES.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, and `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`. Also read `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`. No missing or conflicting authority was found for this task-scoped, owner-approved Diary photo treatment.

**Verified:** Diary data remains owned by `food_diary_days`, `food_diary_entries`, and `food_diary_metrics` (Source of Truth Register Domain 21). The page still uses the existing query, mutation, settings, import, and Progress paths. The Experience Constitution Check passes on hospitality, weight, voice, ownership, agency, restraint, and layer: this removes surplus chrome and retains the household's own facts and controls without coaching, duplicate state, or a second shell.

## Changes

- The shared `WorkspaceHeader` still registers the Diary realm, while the page's semantic `h1` is screen-reader-only. Its visible header slot is hidden for this immersive route.
- Daily Log, Progress, and the existing workspace menu sit in a small control group at the top right of the photograph. Progress period controls appear beside that group when selected.
- The approved coffee photograph remains behind both views. Progress charts and statistics now sit together on a readable journal surface.
- Native month and year selectors change the selected Diary date. The day is clamped to the last valid day when changing to a shorter month.
- The desktop journal fits within the shell's available height; chart plotting areas are slightly shorter. The journal remains internally scrollable if a household has unusually long expanded entries or extra fields. On narrow mobile screens, vertical scrolling remains available so all existing controls stay reachable.

## Verification

- `npm run build`: passed.
- `npm run typecheck`: 14 existing errors in unrelated server scripts/tests; no diagnostics in the changed Diary page or app shell.
- `git diff --check` on touched tracked files: passed.
- Built-client browser preview at 1266×729 with mocked Diary responses: Daily Log main and journal `scrollHeight <= clientHeight`; populated Progress with three charts also fits without main or journal scrolling. Both views show the photo. Month and year selectors changed to February 2025. Workspace menu visible; no browser page errors.
- Mobile preview at 390×844: no horizontal document overflow; view tabs and workspace menu visible. Vertical scrolling remains available.
- Screenshots: `G:\The Healthy Apples\artifacts\diary-coffee-agenda-20261103\coded-diary-revision-daily-20261104.png`, `coded-diary-revision-progress-20261104.png`, and `coded-diary-revision-mobile-20261104.png`. Preview used mocked API data; it does not prove persistence or live household content.

## Rollback and impact

This resumes the same session, so rollback identifier is preserved: `rollback/DIARY-coffee-journal-20261103` → `3467abad4eca8d82ffc52756fee13874e389597f` (annotated tag; committed state only). The worktree was already dirty (119 entries at this revision's start), including this session's uncommitted Diary implementation. No pre-existing unrelated files were reset or committed. Undo this revision by reversing only its hunks in `food-diary-page.tsx` and `food-diary-page.css`; retain the earlier Diary implementation and all unrelated work.

No schema, database, API, live service, configuration, scheduled task, staging, or production change. No commit, push, or deployment. Colin remains the visual acceptance owner.
