# DEVROUTE1 — Remove arrival development preview routes

- Date: 2026-11-05
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch / base: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- Risk: Amber — frontend route availability.
- Approval: user directly requested retirement of the eight listed development preview pages.
- Rollback: `rollback/DEVROUTE1-remove-arrival-previews-20261105` points to the base commit. Dirty-state snapshots are under `.engineering/session/rollback-evidence/DEVROUTE1_REMOVE_ARRIVAL_PREVIEWS_20261105/`.

## Scope and result

Removed the eight `/dev/arrival*` lazy imports and route entries from `client/src/App.tsx`. `/home` and `/cookbook` remain registered. No page component, shared helper, capture script, service, data, database, or runtime configuration was deleted or changed for this task.

The preview page modules remain at `client/src/pages/dev/`, their shared helper remains, and four capture scripts remain. Automatic approval review rejected deleting these source and capture files because the request authorized route retirement, not this broader destructive cleanup. No alternate deletion method was used. The adoption register now records the retained unreferenced modules as known pending-cleanup items; its generated Markdown was synchronized. The original adoption floor remains because those source modules remain present.

## Governance and architecture

- Verified: the owning repo is integrated-dev on the authorized `feat/integrated-dev` branch, as required by repo `AGENTS.md` and `PROJECT_GOVERNANCE.md`.
- Verified: route ownership remains singular in `client/src/App.tsx`; route availability was removed at its existing owner. No duplicate route state or workflow was introduced.
- Verified: this is a UI route retirement and does not change service, persistence, household data, or AI behavior.
- Definition of done: none of the eight preview paths resolve to their preview pages, while the normal app routes remain.
- Data impact: none; no database or user data touched.
- Trust check: route and file status are verified from the worktree. Whether the owner wants source files permanently deleted remains undecided.
- Rollback: restore the `App.tsx` route imports and entries from the pre-edit snapshot or revert the focused route diff; the tag protects committed base only.
- Scope lock: source deletion, capture-harness deletion, production promotion, commit, and deploy are outside this request.

## Verification

- Static route scan: 60 route declarations with paths; none of the eight `/dev/arrival*` paths remain; `/home` and `/cookbook` remain.
- `npm run build`: passed before report finalization; existing Browserslist/PostCSS/import-meta/chunk warnings were emitted.
- `npm run adoption:check`: 107 passed, 0 notices, 13 failures. The eight route modules are now recorded and pass as known orphans. Remaining failures are unrelated baseline issues: rising Loader2/raw useMutation/raw button counts, quantity-string floor, tone adoption floor, and eight unrelated orphan modules.
- No test suite or live browser acceptance was run for this route change.
- No service, database, migration, provider, scheduled task, or configuration was touched.

## User acceptance

Starting page: any of the eight `/dev/arrival*` URLs. Expected: no arrival preview is rendered (the application's normal not-found behavior applies). Success: all eight paths are absent from the route table. Regression: `/home` and `/cookbook` remain available. Source removal requires a separate explicit scope authorization because automatic approval review blocked it.

## Files changed for this task

- `client/src/App.tsx` — route imports and entries removed; file already contained unrelated pre-existing dirty changes, preserved.
- `docs/implementation/ux/adoption-register.json` and generated `ADOPTION_REGISTER.md` — retained source modules recorded and docs synchronized.
- `docs/investigations/ux/APP_ROUTE_INVENTORY_20261105.md` — inventory clarified as a baseline plus current route count.
- `.engineering/session/CURRENT.md` and this run record.