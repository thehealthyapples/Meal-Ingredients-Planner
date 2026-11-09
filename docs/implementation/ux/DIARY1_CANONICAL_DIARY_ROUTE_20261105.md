# DIARY1 — Make Diary the canonical route

**Date:** 2026-11-05  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`  
**Risk:** AMBER (navigation behavior)  
**Status:** complete in local development worktree; uncommitted and not promoted

## User request and result

The user asked to remove “My Diary” in favour of “Diary”. `/diary` is now the only route. `/my-diary` is no longer registered and now receives the app’s friendly not-found page. The visible page title and navigation name both say “Diary”.

## Governance and architecture

Preflight receipt and Experience Constitution Check are recorded in `.engineering/session/runs/DIARY1_CANONICAL_DIARY_ROUTE_20261105.md`. Governing files read: workspace `AGENTS.md` supplied in the task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`.

**[Verified]** Diary remains one page/domain owner. The change updates existing route, nav, shell and registry consumers without introducing another state or workflow. No architecture conflict found.

## Files changed

- Runtime: `client/src/App.tsx`; `client/src/components/layout/app-shell.tsx`; `client/src/components/nav-bar.tsx`; `client/src/pages/dashboard.tsx`; `client/src/pages/food-diary-page.tsx`.
- Product knowledge: `docs/product/structure/pages/page-diary.md`; `docs/product/structure/domains/dom-diary.md`; `docs/product/structure/routes/routes-map.md`; `docs/product/inventory/product.yaml`; generated `docs/product/inventory/product.json`; `docs/product/OWNERS.md`; `docs/product/VISIBILITY.md`; `docs/product/assets/screenshots/manifest.json`.
- Route inventory: `docs/investigations/ux/APP_ROUTE_INVENTORY_20261105.md`.
- Session records: `.engineering/session/CURRENT.md`; `.engineering/session/runs/DIARY1_CANONICAL_DIARY_ROUTE_20261105.md`.

## Verification and data impact

- Browser: `/diary` renders the Diary screen with heading “Diary” and Diary navigation; `/my-diary` renders friendly not-found with Home navigation.
- Source: 52 route patterns declared; no active client/shared/server UI link references to `/my-diary` remain. The route map names it only as a removed path.
- Product inventory generator completed: 166 entries.
- No tests or build run. No database, API, schema, Diary data, credentials, external provider, production/staging, commit, push, or deployment touched.
- Global worktree remains heavily dirty from pre-existing work; this task preserved it. The pre-edit baseline had 270 status entries. Rollback tag: `rollback/DIARY1-canonical-diary-route-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Exact pre-edit snapshots for 14 target files: `G:\The Healthy Apples\Incoming\Rollback Evidence\DIARY1_CANONICAL_DIARY_ROUTE_20261105\manifest.json`.

## Definition of done and rollback

Done when `/diary` is the sole route, all in-app Diary entry points use it, page/registry labels agree, and old URL resolves to not-found. This was verified. To restore the uncommitted pre-state, restore only the snapshotted task targets and retain unrelated dirty changes; the tag anchors committed state only.

**SUGGESTIONS:** None in scope. The user separately mentioned possible duplication between `/` and `/home`; no Home route change is included here pending clarification.
