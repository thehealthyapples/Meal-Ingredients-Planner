# HOME1 — Consolidate Home at `/`

**Date:** 2026-11-05  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`  
**Risk:** AMBER (navigation behavior)  
**Status:** complete in local development worktree; uncommitted and not promoted

## Result

The user noticed duplicate Home destinations and approved consolidating `/` and `/home`. Both existing views now share `/`: signed-out visitors retain the public welcome; signed-in households see the protected Home; incomplete onboarding still routes to `/onboarding`. `/home` is removed and shows the friendly not-found page.

## Governance and architecture

The task's governance receipt and Experience Constitution Check are in `.engineering/session/runs/HOME1_UNIFY_ROOT_HOUSEHOLD_HOME_20261105.md`. Read: workspace AGENTS supplied by the user; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`.

**[Verified]** the public welcome remains the signed-out branch of the existing HomeRoute, and household Home remains behind the existing ProtectedRoute/AppShell boundary. One `page-home` entry now describes the one route; the separate `page-landing` entry is removed. No duplicate state or workflow was added.

## Files changed

- Runtime routing/links: `client/src/App.tsx`; `client/src/components/layout/app-shell.tsx`; `client/src/components/nav-bar.tsx`; `client/src/index.css`; `client/src/pages/invitation-page.tsx`; `client/src/pages/not-found.tsx`; `shared/support/help-centre.ts`.
- Product knowledge: `docs/product/inventory/product.yaml`; generated `product.json`, `OWNERS.md`, and `VISIBILITY.md`; `docs/product/structure/pages/page-home.md`; removed `docs/product/structure/pages/page-landing.md`; `docs/product/structure/pages/page-auth.md`; `docs/product/structure/domains/dom-home.md`; `docs/product/structure/routes/routes-map.md`; six marketing-message entries; `docs/product/surfaces/hidden/hid-routing-telemetry.md`; screenshot manifest.
- Route inventory: `docs/investigations/ux/APP_ROUTE_INVENTORY_20261105.md`.
- Current route harnesses: 23 capture/verification scripts under `scripts/`, updated to use `/` for Home and `/diary` for Diary.
- Session records: `.engineering/session/CURRENT.md`; `.engineering/session/runs/HOME1_UNIFY_ROOT_HOUSEHOLD_HOME_20261105.md`.

## Verification and data impact

- Browser: `/` showed signed-in Home; `/home` showed friendly not-found, whose Home link points to `/`.
- Source: 51 declared route patterns. No active runtime or capture/verification script reference to `/home` or `/my-diary` remains. Route map intentionally documents both removed addresses.
- Signed-out branch and onboarding redirect were reviewed in `HomeRoute`; no signed-out browser session was tested.
- Product inventory generator completed (165 entries, 39 pages); registry navigation generator completed.
- No tests or build run. No database, API, schema, account, credentials, external provider, production/staging, commit, push, or deployment touched.
- Pre-existing state: 276 dirty entries before this task; preserved. Rollback tag: `rollback/HOME1-unify-root-household-home-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Pre-edit snapshots: `G:\The Healthy Apples\Incoming\Rollback Evidence\HOME1_UNIFY_ROOT_HOUSEHOLD_HOME_20261105\manifest.json` (50 files).
- **Post-change status:** 314 modified/untracked entries across the worktree. The increase includes this task's route, current capture/verification-script and registry updates plus its reports; unrelated work remains preserved. Snapshot-delta whitespace check found no source/document whitespace errors; the session dashboard's existing CRLF line endings trigger Git's trailing-whitespace warning on its new row.

## Definition of done and rollback

Done when `/` serves the public or protected Home view according to existing sign-in/onboarding state, all current links use `/`, `/home` is no longer a route, and the Product Registry has one Home page. These conditions are met. Restore only the Home1 snapshot files to recover the uncommitted pre-state; the tag anchors committed state only.

**SUGGESTIONS:** None in scope.
