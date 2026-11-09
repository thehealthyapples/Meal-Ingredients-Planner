# HOME1 — One Home address

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch / base HEAD:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- **Git status:** 276 modified/untracked entries before HOME1; unrelated and prior DIARY1 work preserved.
- **Post-change status:** 314 modified/untracked entries across the worktree; no reset, clean, stash, stage, or commit performed.
- **User request:** consolidate `/` and `/home` into one Home destination; the user explicitly selected “Consolidate `/` and `/home` too”.
- **Mandatory governance read:** workspace `AGENTS.md` supplied in current task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md` mandatory bootstrap and dev-branch authority; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task-specific architecture read:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (including Rule PKR7); `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`.
- **Existing implementation inspected:** `HomeRoute`, `ProtectedRoute`, root and `/home` route declarations in `client/src/App.tsx`; app shell and nav; Home and public landing components; every runtime `/home` navigation reference; Home and Landing Product Registry entries and cross-links; route map, route inventory, screenshot manifest, Home domain/page docs, capture/verification scripts.
- **Authorized scope:** preserve the signed-out public welcome and signed-in household Home under the single `/` route; remove `/home`; update all internal destinations, executable route capture/verification scripts, Home page registry/docs, and links to the removed Landing page record.
- **Non-goals:** remove or redesign either Home view; change onboarding, authentication, Home data/APIs, Dashboard, profile/legal navigation, schemas, or database; alter historical audit artifacts; promote/deploy.
- **Architecture/governance conflicts:** NONE identified.
- **Decision / risk:** user’s direct instruction authorizes this dev-branch change. AMBER because it changes route/navigation behavior. Standing dev authority in `PROJECT_GOVERNANCE.md` permits implementation but not promotion.
- **Implementation permitted:** YES.

## Experience Constitution Check

One Home address reduces route confusion without removing the signed-out welcome or the household's room. It adds no interface weight, coaching voice, data, or decision. Household Home stays protected behind the existing `ProtectedRoute`; the existing public welcome remains for signed-out visitors. The single Home route is recorded in the Product Registry, replacing the two page entries.

## Implementation record

- **Rollback:** `rollback/HOME1-unify-root-household-home-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Pre-edit dirty-file copies and hashes: `G:\The Healthy Apples\Incoming\Rollback Evidence\HOME1_UNIFY_ROOT_HOUSEHOLD_HOME_20261105\manifest.json` (50 files, including current capture/verification scripts).
- **Changes:** `/` now renders the signed-out welcome or, after successful sign-in and onboarding, the protected household Home in place. Removed `/home`; all runtime Home links now target `/`. Consolidated `page-landing` into `page-home`, deleted its separate page document, migrated Product Registry cross-links, and regenerated `product.json`, `OWNERS.md`, and `VISIBILITY.md`. Updated screenshot metadata, route map, route inventory, routing telemetry doc, and 23 executable capture/verification scripts (including Diary path usage in the UX3 harness).
- **Consumers found:** root route and auth/onboarding branch; ProtectedRoute/AppShell; canonical bottom navigation, brand logo, not-found Home link, invitation completion, Help Centre deep link; Product Registry and its marketing/auth/first-run references; screenshot/capture/verification scripts.
- **Verified:** the running local app at `/` rendered the signed-in household Home with the canonical Home nav; `/home` rendered friendly not-found with its Home link to `/`. Source preserves `HomePage` for signed-out users and routes incomplete onboarding to `/onboarding`. The router declares 51 paths. Search found no executable runtime/capture reference to `/home` or `/my-diary`; the route map intentionally names both as removed paths. Product inventory generation completed with 165 entries and 39 page entries; registry navigation generation completed.
- **Verification limit:** no signed-out browser session was used, so the retained public-welcome branch was source-verified, not separately browser-observed. No tests/build run.
- **Data impact:** none. No database, schema, API, account, household, or profile data changed.
- **Architecture/trust:** [Verified] Home domain remains household-owned; only one canonical Home page/route record remains (`docs/product/inventory/product.yaml`, `page-home.md`). [Verified] Home UI, Household Home behavior, public welcome, auth boundary, and protected app shell are existing owners; no second data/workflow created. [Verified] route and registry now agree. No material external claim.
- **Definition of done:** one Home address in the router, all app entry points point to `/`, both public/authenticated route branches preserved, `/home` yields not-found, Product Registry has one Home page entry, route inventory matches 51 patterns.
- **Rollback plan:** restore the Home1 snapshot files for the uncommitted pre-state, or use the rollback tag for committed baseline. Restore only captured task files; do not reset, clean, or overwrite other dirty work.
- **Scope lock:** only Home address consolidation and its current consumers/registry. Diary cleanup remains its separately reported task. Profile Legal-link discovery was not changed. Historical audit evidence remains historical.
- **Acceptance evidence:** start at `/`; signed-in user sees Home, signed-out user retains public welcome, incomplete onboarding goes to onboarding. `/home` should show not-found. Signed-in and removed-route browser results observed; signed-out branch source reviewed.
- **Status:** complete in local dev worktree, uncommitted, not promoted.
