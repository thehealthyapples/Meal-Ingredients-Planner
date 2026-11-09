# Diary date and Health Snapshot reflow — 2026-11-04

## Task and preflight

Owner: `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `3467abad4eca8d82ffc52756fee13874e389597f`. Colin's annotated screenshot `codex-clipboard-144c6022-e3c4-49ad-8752-e307ff8c2883.png` requested that weekdays move into the empty area alongside month/year, with Health Snapshot immediately below the dates. The screenshot was used as visual evidence and was not copied into the repository. Risk: 🟢 Green layout correction. Implementation permitted: **YES** by the direct request and the dev-branch authority in `PROJECT_GOVERNANCE.md`.

Read for this correction: repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 21, and the shared issue screenshot README. The previously read Diary experience, UI, and rollback documents remain in force. No missing or conflicting authority was identified. The Experience Constitution Check remains satisfied: this reuses the existing controls, reduces scroll, preserves factual content, and adds no coaching, state owner, or new workflow.

## Changes

- `client/src/pages/food-diary-page.tsx`: the weekday strip now shares the top row with the month and year selectors. The existing Health Snapshot renders directly underneath it. The savings card stays in the right column below Looking Forward.
- `client/src/pages/food-diary-page.css`: grid alignment for the top row, a compact full-width Health Snapshot strip, and compact savings card spacing. The mobile layout retains a stacked date row.
- No data binding, route, service, schema, or shared navigation change.

## Checks and evidence

- `npm run build`: passed.
- `npm run typecheck`: 14 existing errors in unrelated server scripts/tests; no changed Diary file diagnostic. The baseline was not altered.
- `git diff --check` on touched tracked code: passed.
- Built-client browser preview at 1278×676, using synthetic meal entries, Daily Signals, an upcoming item, Health Snapshot, and savings: journal overflow **0 px**; document horizontal overflow **0 px**. The savings card and Health Snapshot are both fully visible. Screenshot: `G:\The Healthy Apples\artifacts\diary-coffee-agenda-20261103\coded-diary-date-health-reflow-20261104.png`. This preview verifies layout with mocked data, not live persistence.

## Rollback and impact

This is a continuation of the Diary session. Rollback identifier remains `rollback/DIARY-coffee-journal-20261103` → `3467abad4eca8d82ffc52756fee13874e389597f` (annotated tag, committed HEAD only). The existing dirty worktree is outside that tag. Undo only this correction's page and CSS hunks to preserve earlier Diary work and unrelated changes. No live service, database, scheduled task, configuration, staging, or production system was touched. No commit, push, or deployment.
