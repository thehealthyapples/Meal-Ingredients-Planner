# Diary coffee journal implementation — 2026-11-04

## Task and scope

Code the approved Diary background scene and calendar-like daily journal while retaining existing Diary items. Owner: `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `3467abad4eca8d82ffc52756fee13874e389597f`. Risk: 🟢 Green visual UI. Implementation permitted: **YES** by the repository's standing dev-branch authority in `PROJECT_GOVERNANCE.md` and Colin's direct request. No promotion is included.

## Governance preflight and authority

Read: repository `AGENTS.md`, `PROJECT_GOVERNANCE.md` (mandatory bootstrap and dev-branch amendment), `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 21, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` §§5,15, `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, and the shared screenshot README. No missing authority found.

**Verified:** Domain 21 owns daily logs and metrics in `food_diary_days`, `food_diary_entries`, and `food_diary_metrics` (`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 21). The change does not create another data owner or route. The existing `food-diary-page.tsx` remains the sole Diary client workflow. Colin previously approved a task-specific Diary exception for the literal window-seat photo and no visible Diary title, then approved the coffee-scene concept by requesting it be coded. This exception is confined to this page; governing architecture was not changed.

Experience Constitution Check: the journal foregrounds the household's existing record and actions, keeps interpretation and coaching out of the room, preserves household choice, reduces the former threshold/snapshot space, and uses one approved image without adding a new state, score, notice, or workflow. The room remains Diary; its primary purpose is recording a day. The shell and bottom navigation remain shared.

## Changes

- `client/src/components/layout/app-shell.tsx`: Diary now uses its page as the immersive working surface, removing the oversized orchard threshold. The pre-existing dirty file was copied byte-for-byte before this one-line edit.
- `client/src/pages/food-diary-page.tsx`: week date strip and selected-day navigation; existing meal, snack, drink, Daily Signals, Looking Forward, Progress, editing, imports, settings, and dialogs remain connected. Health Snapshot and savings follow the day's entries.
- `client/src/pages/food-diary-page.css`: approved photo background, readable journal sheet, compact toolbar, desktop and mobile layout, accessible hidden page heading.
- `client/public/images/diary/coffee-window-seat.png`: approved coffee scene copied from the reviewed artifact, SHA-256 `595A82EE8D996EBB3B05A3864D3D638C3199347B22E1FDDEE0564FC76CEB26EC`.
- Session run and dashboard record the rollback tag.

## Verification and acceptance evidence

- `npm run build`: passed on 2026-11-04.
- `npm run typecheck`: fails on existing errors in unrelated server scripts/tests; no error reported in changed Diary files. No baseline was altered.
- `git diff --check -- client/src/pages/food-diary-page.tsx client/src/components/layout/app-shell.tsx`: passed.
- Built-client browser preview with mocked, empty API responses at desktop 1266×729 and mobile 390×844: five meal slots rendered; next-day navigation changed the date; Add Breakfast opened its existing dialog; Progress rendered its range control; workspace menu visible; mobile document had no horizontal overflow; no browser page error with valid mock responses. This verifies rendering and navigation, not persistence or real household data.
- Screenshots: `G:\The Healthy Apples\artifacts\diary-coffee-agenda-20261103\coded-diary-preview-20261104.png` and `coded-diary-mobile-preview-20261104.png`. Colin remains visual acceptance owner.

## Data, trust, rollback, scope

No schema, API, service, database, configuration, scheduled task, staging, or production change. No live household data was accessed. Timed mood/discomfort/tiredness and fasting storage were not added; those require a separate owner decision because the current Diary has daily Mood/Energy only. The existing forms are unchanged.

Rollback ID: `rollback/DIARY-coffee-journal-20261103` → `3467abad4eca8d82ffc52756fee13874e389597f`. It protects committed HEAD only. The worktree had 114 pre-existing dirty entries. A byte-exact pre-edit copy of the already-dirty shell file and session dashboard is in `G:\The Healthy Apples\Incoming\Rollback Evidence\DIARY-coffee-journal-20261103`. Reversal should remove only this task's additions and restore only this task's hunks, preserving other dirty work. No commit, push, or deployment was performed.

## SUGGESTIONS

After Colin reviews the coded page, decide separately whether timed feelings and fasting should become new Diary data fields and where their canonical records belong.
