# DIARY1 — Canonical Diary route

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch / base HEAD:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- **Git status:** 270 pre-existing modified/untracked entries before changes. All unrelated work preserved.
- **User request:** remove `My Diary` in favour of `Diary`; make `/diary` the sole Diary URL and remove `/my-diary`.
- **Mandatory governance read:** workspace `AGENTS.md` supplied in current task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md` mandatory bootstrap and dev-branch authority; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task-specific architecture read:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`.
- **Existing implementation inspected:** `client/src/App.tsx`; `client/src/components/layout/app-shell.tsx`; `client/src/components/nav-bar.tsx`; `client/src/pages/dashboard.tsx`; `client/src/pages/food-diary-page.tsx`; Diary page/domain registry entries; routes map; route inventory; screenshot manifest; NotFound page.
- **Authorized scope:** make `/diary` the only Diary route; update Diary navigation, shell room key/purpose, Dashboard destination, visible page title, screenshot metadata, Product Registry, route map and route inventory.
- **Non-goals:** no Diary data/API/schema changes; no data migration; no layout redesign; no Home route consolidation; no build/test suite; no promotion/deployment.
- **Architecture/governance conflicts:** NONE identified.
- **Decision / risk:** direct user instruction authorizes the bounded change on `feat/integrated-dev`. AMBER because it changes navigation behavior. Standing dev authority in `PROJECT_GOVERNANCE.md` permits this work without promotion.
- **Implementation permitted:** YES.

## Experience Constitution Check

Hospitality and reduced confusion are served by one clear Diary door. This adds no UI weight, voice, interpretation, or decision. The household retains control of Diary content. The change stays at the route/navigation and Product Registry layers; existing Diary page/data owners remain unchanged.

## Implementation record

- **Rollback:** `rollback/DIARY1-canonical-diary-route-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Dirty-file copies and hash manifest: `G:\The Healthy Apples\Incoming\Rollback Evidence\DIARY1_CANONICAL_DIARY_ROUTE_20261105\manifest.json`.
- **Changes:** removed `/my-diary` route; `/diary` is the sole canonical route. Updated bottom-nav URL and active-room styling, shell room resolution/purpose, Dashboard “Log Food” target, visible Diary heading, page/domain registry, owners/visibility indexes, screenshot manifest, route map and route inventory. Regenerated `docs/product/inventory/product.json` from the Product Registry.
- **Consumers found:** App router; shared app shell; bottom navigation and its route-keyed style/active map; Dashboard Log Food shortcut; Diary page header; Product Registry page/domain entries and indexes; screenshot route manifest; route map and route inventory.
- **Verified:** local browser `/diary` rendered the page headed “Diary” and Diary navigation. `/my-diary` rendered the friendly not-found page with a Home link. Router count is 52 patterns. No runtime/UI references to `/my-diary` remain outside the explicit route-map statement that it is retired; internal persistence/API terminology is unchanged.
- **Data impact:** none. No database, profile, Diary entries, API contracts, or schema changed.
- **Architecture and trust:** [Verified] Diary remains one page and one domain (`docs/product/structure/pages/page-diary.md`, `docs/product/structure/domains/dom-diary.md`). [Verified] only one registered URL resolves to the page (`client/src/App.tsx`). [Verified] existing nav/shell mechanisms were extended; no state or workflow duplicated. No material claim depends on an unverified external source.
- **Definition of done:** old path removed, internal app navigation targets `/diary`, visible title is Diary, canonical route inventory and product registry agree, browser confirms canonical and former-path outcomes.
- **Rollback plan:** restore the captured target files from the snapshot for the uncommitted state, or use the tag to recover the committed baseline. Do not use reset/clean or overwrite other dirty work.
- **Scope lock:** no unrelated route/page cleanup. Home route duplication was raised by the user separately and is awaiting scope clarification.
- **Acceptance evidence:** start at `/my-diary`; expected friendly not-found. Start at `/diary` or choose Diary in bottom nav; expected Diary page headed “Diary”. Both route outcomes observed in local browser.
- **Verification limits:** no tests/build run. Product inventory generation completed. No deploy, commit, push, migration, provider, or database operation.
- **Status:** completed in local dev worktree, uncommitted, not promoted.
