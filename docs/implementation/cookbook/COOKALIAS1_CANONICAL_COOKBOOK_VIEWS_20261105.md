# COOKALIAS1 — Canonical Cookbook views and route aliases

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** integrated-dev / `feat/integrated-dev`
- **Base HEAD:** `3467abad4eca8d82ffc52756fee13874e389597f`
- **Git status:** 248 dirty entries at preflight; 260 after the task (+12 entries). Several touched files were already modified. Exact pre-edit copies were captured in `.engineering/session/rollback-evidence/COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105/` and all prior work was preserved.
- **User request:** make Cookbook + Cookbook concept/real-book resolve to the same data; make Cookbook Grid + Meals resolve to the same data; retain the Cookbook and Cookbook Grid views; update internal links.
- **Governing documents read:** workspace `G:\The Healthy Apples\AGENTS.md` (provided in current task); repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`; `docs/architecture/capabilities/meals.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` §5.3; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` §§4–5; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/REPOSITORY_CONVENTIONS.md` §4; `docs/product/README.md` and `docs/product/inventory/schema/product-schema.json`.
- **Implementation inspected:** `client/src/App.tsx`; both view components and their shared `useMeals` hook; the AppShell and navigation alias maps; Companion landing route; onboarding, Help and planner scan/import links; server route classifier; route and product registries.
- **Authorised scope:** aliases redirect to the two canonical view routes; internal links use canonical routes; update product registry and route documentation to match.
- **Non-goals:** no recipe CRUD/query changes, schema or data migration, change to `/meals/:id`, API endpoint change, removal of the legacy alias paths, production/staging change, commit, push or deploy.
- **Architecture/governance conflicts:** NONE identified.
- **Risk:** Amber — frontend route and navigation behavior.
- **Implementation permitted:** YES under the standing `feat/integrated-dev` development authority; direct user instruction authorizes this scope.

## Rollback information

`rollback/COOKALIAS1-cookbook-view-canonicalization-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.

The tag protects committed state. Pre-existing dirty contents of touched files are protected by exact snapshots in the rollback-evidence directory listed above. No pre-existing work was reverted or overwritten.

## Changes made

- `/cookbook` remains the real-book view. `/cookbook/concept-real-book` redirects to `/cookbook` and preserves its query string.
- `/cookbook/grid` remains the grid view. `/meals` redirects to `/cookbook/grid` and preserves its query string, including planner-import and scan context.
- Updated route and navigation context maps so both canonical views remain part of the Cookbook room and the Cookbook navigation state stays active.
- Updated onboarding, Help, Companion “View All,” and planner import links to use `/cookbook` or `/cookbook/grid` directly. Meal-detail URLs such as `/meals/:id` remain unchanged.
- Both view components continue to read the shared Meals owner through `useMeals` and the same `/api/meals` cache. No recipe data is copied, migrated or separately stored.
- Updated the Product Knowledge Registry: YAML is the authored source; generated JSON and generated ownership/visibility indices were rebuilt. Added a `page-cookbook-grid` entry and prose page so the retained grid route is represented as a separate view over the same Cookbook domain.
- Updated route map, Cookbook page/domain descriptions, and the current route inventory.

## Architecture compliance

- **Verified:** one meal identity and one underlying data owner remain. `docs/architecture/capabilities/meals.md` identifies Meals / Cookbook as the D12 owner; both pages consume `useMeals`.
- **Verified:** `GOV2_CANONICAL_ALIAS_PRINCIPLE.md` is realized at route level: legacy addresses point to canonical view routes; they do not fork recipe records or query state.
- **Verified:** Product Knowledge Registry authorship remains singular in `docs/product/inventory/product.yaml`; JSON and navigation indexes were generated from it.
- **Verified:** no new persistence, duplicate state, parallel workflow, capability or route data store was introduced. `/meals/:id` and `/api/meals` remain intact.
- **Experience Constitution Check:** preserves familiar bookmarks while making the destination predictable; lowers confusion and increases confidence that the same recipes are present; adds no visual weight or new voice; changes no decision or household data; implements existing Cookbook purpose and navigation-integrity rules.

## Definition of done and data impact

The four URLs now resolve in pairs to two distinct, retained views: `/cookbook` and `/cookbook/grid`. Internal application links point to these canonical routes. Recipe reads and writes are unchanged. No user data was changed. Browser verification was read-only and displayed existing development recipes through the current UI.

## Verification

- **Browser:** opening `/meals?q=porridge` redirected to `/cookbook/grid?q=porridge`; the query survived and the grid rendered. Opening `/cookbook/concept-real-book` redirected to `/cookbook`; the real-book view rendered the recipe collection. The canonical `/cookbook` page and grid view both loaded.
- **Source:** both views call `useMeals`; its single query key is `/api/meals`.
- **Build:** `npm run build` passed (client and server). Existing Browserslist/PostCSS/import-meta/chunk-size warnings were emitted.
- **Typecheck:** `npm run typecheck` failed with 14 errors in other server scripts/tests; none of the files changed for this task appears in the diagnostics. No typecheck error named a changed file.
- **Product registry verification:** `npx tsx scripts/verify-product-inventory.ts` reported 166 inventory records and six failures in unrelated entries/documents: glossary describes multiple concepts; screenshots/README/OWNERS/VISIBILITY files lack a single entry marker; and `adm-activity-monitor` has no inventory record. It emitted 193 warnings. No failure named `page-cookbook`, `page-cookbook-grid`, `dom-cookbook`, or `routes-map`.
- **Repository structure:** `.engineering/scripts/repo-structure-verify.sh` ran via Git Bash and failed on existing root-level files, loose docs, four unindexed architecture documents, and other workstream filing (including earlier session reports). The COOKALIAS1 implementation report is filed in `docs/implementation/cookbook/` and was not listed as a violation.
- **Tests:** no test suite was run. The existing Companion card assertion was updated to expect the canonical `/cookbook/grid` route.
- **Runtime/data:** only the local development browser was used; no service, database, migration, provider, scheduled task, or configuration was changed.

## Files changed for this task

- Runtime: `client/src/App.tsx`, `client/src/components/layout/app-shell.tsx`, `client/src/components/nav-bar.tsx`, `client/src/components/PlannerScanReview.tsx`, `client/src/components/PlannerAssistantPanel.tsx` (route comment), `client/src/components/conversation/companion-card.ts`, `client/src/pages/meals-page.tsx`, `client/src/pages/onboarding-page.tsx`, `shared/support/help-centre.ts`, `server/lib/routing.ts`, `server/tests/test-intelligence-companion-card.ts` (expected canonical link).
- Product registry and route docs: `docs/product/inventory/product.yaml`, generated `product.json`, `docs/product/OWNERS.md`, `docs/product/VISIBILITY.md`, `docs/product/structure/routes/routes-map.md`, `docs/product/structure/pages/page-cookbook.md`, new `docs/product/structure/pages/page-cookbook-grid.md`, `docs/product/structure/domains/dom-cookbook.md`, and `docs/investigations/ux/APP_ROUTE_INVENTORY_20261105.md`.
- Session/report/evidence: `.engineering/session/CURRENT.md`, `.engineering/session/runs/COOKALIAS1_Canonical_Cookbook_Views_20261105.md`, `.engineering/session/rollback-evidence/COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105/`, this report, and `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__cookalias1-canonical-cookbook-views.md`.
## User acceptance

- Open `http://127.0.0.1:5001/cookbook` and `http://127.0.0.1:5001/cookbook/concept-real-book`; both land on the real-book Cookbook.
- Open `http://127.0.0.1:5001/cookbook/grid` and `http://127.0.0.1:5001/meals`; both land on Cookbook Grid. Query parameters survive the `/meals` redirect.
- Open a recipe detail at `/meals/:id`; it still opens the individual recipe.

## Commit / promotion

No commit, push, promotion or deploy was performed. Repository governance prohibits committing without explicit user authorization. The change remains in the integrated-dev worktree.