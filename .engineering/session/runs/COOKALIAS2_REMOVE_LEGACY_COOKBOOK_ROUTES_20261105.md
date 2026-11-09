# COOKALIAS2 — Remove obsolete Cookbook route aliases

## Governance receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- **Initial worktree:** 260 dirty entries; existing changes preserved. **After task:** 263 entries (+3 task artifacts: rollback evidence and task records).
- **Request:** remove `/meals` and `/cookbook/concept-real-book` redirect routes, update in-app links to the canonical Cookbook routes, and remove the `/larder` redirect to `/pantry` without breaking Pantry.
- **Governing files read:** workspace `AGENTS.md` supplied in the current task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/LIVING_LARDER_ARCHITECTURE.md` (route ownership references); `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task-specific sources inspected:** Cookbook page components and shared `useMeals`; route registrations and app shell aliases; planner's recipe scan navigation; server route classification; Product Registry YAML/JSON and Cookbook/Pantry page records; active route inventory.
- **Authorized scope:** remove the three legacy route entries and their shell aliases, replace any in-app collection links with canonical routes, and update current Product Registry/route documentation.
- **Non-goals:** removing `/meals/:id` or `/api/meals`; deleting active Cookbook or Pantry page components; deleting historical backup/report files; changing recipe data, schema, services, deployment, or production/staging state.
- **Risk:** Amber (navigation behavior). **Implementation permitted:** YES under the standing `feat/integrated-dev` authority and the user's direct instruction. **Conflicts:** NONE identified.

## Rollback and dirty-state protection

- Rollback tag: `rollback/COOKALIAS2-remove-legacy-cookbook-routes-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.
- Exact pre-edit snapshots for the Cookbook cleanup: `.engineering/session/rollback-evidence/COOKALIAS2_REMOVE_LEGACY_COOKBOOK_ROUTES_20261105/manifest.json`.
- Exact pre-edit snapshots for the subsequently added Larder cleanup: `.engineering/session/rollback-evidence/LARDER_ROUTE1_REMOVE_REDIRECT_20261105/manifest.json`.
- The rollback tag protects committed HEAD only. Both snapshot packages preserve the dirty versions of touched files at their respective pre-edit points.

## Changes

- Removed `/meals` and `/cookbook/concept-real-book` from the client router and removed their redirect helper. `/cookbook` and `/cookbook/grid` remain; `/meals/:id` remains the recipe-detail route.
- Changed the remaining Planner collection navigation from `/meals?...` to `/cookbook/grid?...`; removed the obsolete `/meals` app-shell alias and server route classification.
- Removed `/larder` from the router and app-shell alias map. `/pantry` remains the single Pantry/Larder room route; no current in-app link to `/larder` was found.
- Removed the retired aliases/redirect claims from current Product Registry and route/page documentation; regenerated `docs/product/inventory/product.json` from the authored YAML.
- Historical `.bak` inventory copies and the previous implementation report still contain the old route text as historical evidence; they are not active product links or route registrations and were not edited.

## Architecture compliance and data impact

- **Verified:** one Cookbook / Meals data owner is retained. Both views still use the existing Meals implementation; recipe identity, `/api/meals`, and `/meals/:id` are untouched.
- **Verified:** the existing canonical Pantry route is `/pantry` (`docs/architecture/LIVING_LARDER_ARCHITECTURE.md`, route reference to LARDER1 §15). Removing `/larder` eliminates an extra door; it creates no second owner, data state, or workflow.
- **Verified:** Product Knowledge remains authored in `docs/product/inventory/product.yaml`; generated JSON was rebuilt from that single source.
- **Data impact:** reads existing data; no writes, data meaning changes, schema changes, or backfill.
- **Trust check:** current route and owner statements above are backed by cited route/source files. No remaining material assumption.
- **Scope lock:** only route registration, shell mapping, one Planner URL, current registry/docs, and task records changed. No active page component was deleted.

## Verification and user acceptance

- **Browser:** `/cookbook` rendered the real-book collection; `/cookbook/grid` rendered the grid. `/meals` and `/cookbook/concept-real-book` displayed the app's not-found state. `/larder` displayed the not-found state; `/pantry` loaded the pantry room and its areas. These were read-only local dev-browser checks.
- **Link scan:** no active in-app route link to `/meals` collection or `/larder` remains. `/meals/:id` detail links remain intentionally. Old route strings remain only in current explanatory investigation text and pre-existing historical `.bak` files.
- **Product Registry generation:** `npx tsx scripts/build-product-inventory.ts` completed; 166 entries emitted.
- **Tests/build:** no test suite or build was run.
- **Runtime/data:** local development browser only; no database, migration, provider, scheduled task, config, production, or staging was touched.
- **Manual acceptance:** open `/cookbook` and `/cookbook/grid`; both retained views load. Try `/meals`, `/cookbook/concept-real-book`, and `/larder`; each shows not-found. `/pantry` remains available and `/meals/:id` still identifies the detail route.

## Completion

No commit, push, promotion, or deployment was performed. Existing dirty work was preserved. The user may review and explicitly authorize any commit separately.
