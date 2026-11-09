# DEVROUTE1 — Remove arrival development preview routes

## Task and authority

- Date: 2026-11-05
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch / base: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- Risk: Amber — route availability affects the development UI.
- Scope approval: the user directly requested that the eight named development preview pages no longer be available.
- Rollback protection: `rollback/DEVROUTE1-remove-arrival-previews-20261105` points to the base commit. Dirty-state snapshots are under `.engineering/session/rollback-evidence/DEVROUTE1_REMOVE_ARRIVAL_PREVIEWS_20261105/`.

## Result

Removed the eight `/dev/arrival*` lazy imports and route entries from `client/src/App.tsx`. The current router has 60 route declarations with paths. `/home` and `/cookbook` remain registered.

The page source files, shared helper, and four capture scripts remain on disk. Automatic approval review rejected deleting those files because that is broader destructive cleanup than the user's request to retire routes. I did not try another deletion method. The adoption register records the eight unreferenced page modules as known cleanup items, and its generated Markdown is synchronized. The greeting adoption floor remains as recorded because source modules remain.

## Governance and architecture

- **Verified:** integrated-dev is the owning repo and `feat/integrated-dev` is the authorized development branch, per repository `AGENTS.md` and `PROJECT_GOVERNANCE.md`.
- **Verified:** route ownership remains in `client/src/App.tsx`; the existing route owner was extended by removing its route declarations. No duplicate state or workflow was introduced.
- **Verified:** the change is limited to frontend routing and its adoption/inventory/session records. No service, persistence, household data, or AI behavior changed.
- **Definition of done:** all eight named preview routes are absent, while `/home` and `/cookbook` remain.
- **Data impact:** no database or user data read or changed.
- **Trust check:** route registration and retained source files were checked in the worktree. Owner intent about deleting source modules remains unknown.
- **Rollback:** restore the route imports and entries from `.engineering/session/rollback-evidence/DEVROUTE1_REMOVE_ARRIVAL_PREVIEWS_20261105/` or revert the focused route diff. The rollback tag anchors committed history; the snapshot protects pre-existing dirty state.
- **Scope lock:** source/harness deletion, commit, push, promotion, and deploy were not authorized or performed.

## Verification

- Static route scan: 60 declarations with `path`; the eight preview paths are absent; `/home` and `/cookbook` remain.
- `npm run build`: passed. Existing Browserslist, PostCSS, import-meta, and chunk-size warnings were emitted.
- `npm run adoption:check`: 107 passed, 0 notices, 13 failures. The eight preview modules are recorded as known orphans. Remaining failures concern unrelated existing adoption counts/floors and eight other orphan modules.
- No test suite or live browser acceptance was run.
- No live service, database, migration, provider, scheduled task, or configuration was touched.

## User acceptance

Open any of the eight former `/dev/arrival*` URLs. The arrival preview should no longer render; the app's normal missing-route behavior should apply. Confirm `/home` and `/cookbook` still render. Permanent deletion of the retained source and capture files needs a separate explicit scope authorization because automatic approval review blocked that broader action.

## Files

- `client/src/App.tsx` — removed route imports and entries. This file already contained unrelated dirty user changes; those were preserved.
- `docs/implementation/ux/adoption-register.json` and `ADOPTION_REGISTER.md` — recorded retained page modules and synchronized the generated record.
- `docs/investigations/ux/APP_ROUTE_INVENTORY_20261105.md` — marks the original inventory as a baseline and records the current count.
- `.engineering/session/CURRENT.md` and `.engineering/session/runs/DEVROUTE1_REMOVE_ARRIVAL_PREVIEWS_20261105.md` — recovery records.
- `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__devroute1-remove-arrival-previews.md` — required task report.