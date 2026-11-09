# COOKALIAS2 — Retire obsolete Cookbook and Larder routes

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / base HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- **Initial status:** 260 dirty entries; all pre-existing work preserved. **Final status:** 263 entries (+3 task artifacts: rollback evidence and task records).
- **User request:** retire `/meals` and `/cookbook/concept-real-book` redirects; update links to `/cookbook` or `/cookbook/grid`; remove `/larder` redirect and check that Pantry links remain healthy.
- **Governing files read:** workspace `AGENTS.md` supplied in the current task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/LIVING_LARDER_ARCHITECTURE.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task-specific sources inspected:** route table and app-shell aliases, Cookbook and Pantry Product Registry records, Cookbook/Meals shared query/data access, Planner deep-link navigation, server route classification, current route inventory.
- **Authorized scope:** remove only obsolete URL registrations/aliases and update active internal links and current registry documentation.
- **Non-goals:** remove the active Cookbook Grid, real-book Cookbook, Pantry page, meal detail route `/meals/:id`, or Meals API; delete historic backups; change recipe/pantry data or application persistence; deploy.
- **Architecture/conflicts:** NONE. Canonical Meals owner and canonical Pantry path remain singular.
- **Risk:** AMBER (route/navigation behavior). **Implementation permitted:** YES under the standing dev-branch authority.

## Rollback information

`rollback/COOKALIAS2-remove-legacy-cookbook-routes-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.

The tag protects committed state. Exact snapshots of the already-dirty paths are in `.engineering/session/rollback-evidence/COOKALIAS2_REMOVE_LEGACY_COOKBOOK_ROUTES_20261105/` (before Cookbook edits) and `.engineering/session/rollback-evidence/LARDER_ROUTE1_REMOVE_REDIRECT_20261105/` (before the added Larder redirect edit).

## Changes made

- Deleted the `/meals` and `/cookbook/concept-real-book` redirect route declarations and the now-unused redirect helper.
- Updated the Planner's recipe scan navigation to `/cookbook/grid`; removed the obsolete `/meals` room alias and server route classifier entry.
- Deleted the `/larder` redirect and its shell alias. `/pantry` remains the canonical route. No in-app link to `/larder` was found.
- Removed obsolete aliases from the Cookbook page/Product Registry entries and removed the redirect claim from Pantry documentation. Regenerated Product Registry JSON from YAML.
- Updated the current app route inventory. Kept `/meals/:id` detail links and route unchanged.

## Architecture compliance

- **Verified:** Cookbook real-book and grid views share the existing Meals source and no recipe data or query owner was added or copied (`client/src/pages/cookbook-real-book-concept.tsx`, `client/src/pages/meals-page.tsx`, existing `useMeals`).
- **Verified:** `/pantry` remains the single Pantry/Larder room route, consistent with `docs/architecture/LIVING_LARDER_ARCHITECTURE.md`'s route ownership reference. Only an extra redirect door was removed.
- **Verified:** Product Registry authored source remains `docs/product/inventory/product.yaml`; `product.json` was regenerated.
- **Data impact:** no data writes, schema changes, changed meanings, or backfill.
- **Trust check:** active route claims are supported by code and registry files; no outstanding unsupported claim.
- **Definition of done:** only `/cookbook` and `/cookbook/grid` are collection views; obsolete collection URLs no longer register; `/larder` no longer redirects; `/pantry` and `/meals/:id` still work; in-app collection links use canonical URLs.
- **User acceptance evidence:** dev browser showed both canonical Cookbook views, not-found at both retired Cookbook collection paths, not-found at `/larder`, and the Pantry room rendered at `/pantry`.

## Verification

- Browser checks were read-only against integrated-dev.
- `npx tsx scripts/build-product-inventory.ts` completed and emitted 166 registry entries.
- No unit/integration test suite or full build was run.
- No database, migration, provider, scheduled task, configuration, production, or staging state was changed.

## Rollback plan and promotion status

Rollback committed history to the named tag only with owner direction; restore the task's prior dirty files from the corresponding snapshot package as needed. No commit, push, promotion, or deploy was performed. The work remains uncommitted on `feat/integrated-dev`.
