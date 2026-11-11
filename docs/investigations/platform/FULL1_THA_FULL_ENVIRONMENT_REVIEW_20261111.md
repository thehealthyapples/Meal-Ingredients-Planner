# FULL1 — THA Full Environment Review

**Date:** 2026-11-11 (Europe/London)  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `82f23226f43a3a8e8298f8863c483239a3e2a89d`  
**Risk:** 🟢 GREEN — read-only investigation. This report proposes no implementation.  
**Evidence mode:** Static code/document reading. No tests, build, profiler, browser, or database were run. No live behavior is claimed.

## Governance preflight

**Verified governing files read:** workspace `G:\The Healthy Apples\AGENTS.md`; canonical Bridge `G:\The Healthy Apples\Infrastructure\AI Agent Bridge\AGENTS.md`; repository `AGENTS.md` and `PROJECT_GOVERNANCE.md`; `.engineering/README.md`, `.engineering/OPERATING_MANUAL.md`; `docs/architecture/README.md`, `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md`; `docs/ai-operating-model/README.md`; and the task-specific governing architecture `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `NK2_THA_NUTRITION_METHODOLOGY.md`, `INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, and `THA_COMPANION_PLATFORM_ARCHITECTURE.md`.

The user authorized audit and report only. No implementation permission is claimed or needed; source, schema, configuration, runtime, and data remain untouched. No rollback tag was created because there is no implementation. The initial Git inspection was denied by Git's dubious-ownership check; retry succeeded using a command-local `safe.directory` override. No Git global configuration was changed. At preflight the tree was already dirty and ahead four commits: modified `.engineering/session/CURRENT.md`, four resolver/discovery files under `server/intelligence/`, two intelligence test files, and several pre-existing untracked reports/runs. Those were preserved.

**Known limitation:** Postgres access has previously returned EACCES; this review did not attempt a database connection. Runtime route availability and page load status are therefore **unknown**, not passed. No browser/profiler or production-scale measurements were available. Architecture documents were sampled by affected area; this is not a substitute for resolving every domain-specific architecture question.

## 1. Page-by-page inventory

**Verification status for every page below:** its source was located and route/import wiring inspected where applicable. None was loaded in a browser and no workflow was exercised end-to-end. Workflows below are source-level purpose inferred from names/UI code; they are not runtime passes. `App.tsx` contains 58 `.tsx` page modules under `client/src/pages` (including development concepts); non-TSX helpers/styles are excluded.

| Page module | Route/reachability and primary source-level workflow | Load / E2E |
|---|---|---|
| `admin-activity-monitor-page.tsx` | `/admin/activity`; inspect activity | Unknown / not run |
| `admin-behaviour-workbench-page.tsx` | `/admin/behaviour`; inspect/test behavior | Unknown / not run |
| `admin-benchmark-households-page.tsx` | `/admin/benchmark-households`; benchmark household management | Unknown / not run |
| `admin-canonical-publication-integrity-page.tsx` | Admin publication-integrity surface; direct route wiring not fully traced | Unknown / not run |
| `admin-companion-intelligence-page.tsx` | `/admin/companion-intelligence`; Companion intelligence review | Unknown / not run |
| `admin-development-world-household-page.tsx` | `/admin/development-world/:id`; inspect a development household | Unknown / not run |
| `admin-development-world-page.tsx` | `/admin/development-world`; development-world list | Unknown / not run |
| `admin-ingredient-products-page.tsx` | `/admin/ingredient-products`; ingredient/product curation | Unknown / not run |
| `admin-intelligence-page.tsx` | `/admin/intelligence`; intelligence operations | Unknown / not run |
| `admin-knowledge-claims-page.tsx` | Admin claims surface; appears wired via admin chrome | Unknown / not run |
| `admin-knowledge-review-page.tsx` | `/admin/knowledge-review`; knowledge review | Unknown / not run |
| `admin-nutrient-reference-review-page.tsx` | Nutrient reference review; route/import chain needs runtime confirmation | Unknown / not run |
| `admin-observation-workbench-page.tsx` | `/admin/observations`; observation review | Unknown / not run |
| `admin-page.tsx` | `/admin`; admin landing | Unknown / not run |
| `admin-recipe-sources-page.tsx` | `/admin/recipe-sources`; recipe-source admin | Unknown / not run |
| `admin-users-page.tsx` | `/admin/users`; user administration | Unknown / not run |
| `auth-page.tsx` | `/auth`; sign-in/account entry | Unknown / not run |
| `contact-page.tsx` | `/contact`; support/contact request | Unknown / not run |
| `cookbook-real-book-concept.tsx` | `/cookbook`; browse family cookbook | Unknown / not run |
| `dashboard.tsx` | `/dashboard`; household home/dashboard | Unknown / not run |
| `food-comparison-page.tsx` | `/compare`; compare food records | Unknown / not run |
| `food-detail-page.tsx` | `/foods/:slug`; food detail and nutrition context | Unknown / not run |
| `food-diary-page.tsx` | Food diary module; no direct route found in route listing sampled | Unknown / not run |
| `fridge-interaction-preview.tsx` | `/pantry/fridge-preview`; interaction preview, not a core workflow | Unknown / not run |
| `help-centre-page.tsx` | `/help`; help content | Unknown / not run |
| `home-experience-page.tsx` | Home experience composition; routed via home shell/route wrapper | Unknown / not run |
| `home-page.tsx` | Home route fallback/landing path; exact selection depends on wrapper state | Unknown / not run |
| `import-recipe-page.tsx` | `/import-recipe`; immediate redirect to `/cookbook`, no import form or import logic in this module (lines 4–7) | Unknown / not run |
| `invitation-page.tsx` | Invitation acceptance; direct route not confirmed in sampled lines | Unknown / not run |
| `larder-category-view.tsx` | Larder category subview; embedded route/component reachability | Unknown / not run |
| `larder-plaque-room.tsx` | Larder room subview/plaque; embedded reachability | Unknown / not run |
| `larder-room.tsx` | Larder/pantry room and category content | Unknown / not run |
| `legal-page.tsx` | `/legal` and `/legal/:slug`; legal documents | Unknown / not run |
| `living-home-room.tsx` | Living Home room; routed from Home composition | Unknown / not run |
| `meal-detail-page.tsx` | `/meals/:id`; meal details | Unknown / not run |
| `meals-page.tsx` | `/cookbook/grid`; meal catalogue/grid | Unknown / not run |
| `not-found.tsx` | Router catch-all; recovery link to home | Unknown / not run |
| `onboarding-page.tsx` | `/onboarding`; household onboarding | Unknown / not run |
| `orchard-page.tsx` | `/orchard`; Orchard navigation/room chooser | Unknown / not run |
| `pantry-area-interaction-preview.tsx` | `/pantry/shelves-preview` and `/pantry/cupboard-preview`; interaction concepts | Unknown / not run |
| `partners-page.tsx` | **No active `/partners` route**; App comments say the route was withdrawn (App.tsx around lines 74–77, 341–346). Orphaned module unless another non-router consumer exists. | Unknown / not run |
| `plant-diversity-page.tsx` | `/food`; nutrition/food lookup and plant diversity | Unknown / not run |
| `privacy-settings-page.tsx` | `/privacy-settings`; privacy/data rights settings | Unknown / not run |
| `products-page.tsx` | `/products` and `/analyser`; product lookup/analyser paths share one page | Unknown / not run |
| `profile-page.tsx` | `/profile`; personal/household preferences and settings | Unknown / not run |
| `quick-meal-page.tsx` | `/quick-meal`; quick meal creation/selection | Unknown / not run |
| `shared-plan-page.tsx` | Shared plan public/view or invitation landing; direct route not confirmed | Unknown / not run |
| `shopping-workspace-page.tsx` | `/shopping-workspace`; shopping list workspace | Unknown / not run |
| `supermarkets-page.tsx` | `/supermarkets`; supermarket choices/links | Unknown / not run |
| `weekly-planner-page.tsx` | `/planner` and `/weekly-planner`; weekly meal planning | Unknown / not run |
| `dev/arrival-a-welcome.tsx` | Development arrival concept; no production route found | Unknown / not run |
| `dev/arrival-b-orchard.tsx` | Development arrival concept; no production route found | Unknown / not run |
| `dev/arrival-c-workspace.tsx` | Development arrival concept; no production route found | Unknown / not run |
| `dev/arrival-d-quiet.tsx` | Development arrival concept; no production route found | Unknown / not run |
| `dev/arrival-e-restraint.tsx` | Development arrival concept; no production route found | Unknown / not run |
| `dev/arrival-experience.tsx` | Development arrival prototype; no production route found | Unknown / not run |
| `dev/arrival-s1-quiet.tsx` | Development arrival prototype; no production route found | Unknown / not run |
| `dev/arrival-s2-walking-home.tsx` | Development arrival prototype; no production route found | Unknown / not run |

**Findings**

- **[moderate] Nutrition query state is dropped by legacy route redirects.** `plant-diversity-page.tsx:137` constructs `/nutrition?items=…`; `App.tsx:332` redirects `/nutrition` to `/food` without preserving the query. The receiving lookup can therefore lose the requested items. The same redirect shape exists for `/plant-diversity` at `App.tsx:333`; inspect inbound query producers before deciding whether it also drops meaningful state. Static source evidence only.
- **[polish] `partners-page.tsx` is orphaned after route withdrawal.** `App.tsx:74–77,341–346` explicitly says the route was withdrawn and does not import the page; the page module remains in `client/src/pages`. No other consumer was found in the route scan. This may be intentionally retained history, not a user-facing defect.
- **[polish] Import Recipe is a stub/compatibility redirect.** The route exists, but `import-recipe-page.tsx:4–7` only redirects to Cookbook. This is coherent if import moved into Cookbook; it is incomplete if the route label still promises a dedicated import flow.
- **[polish] Several development prototypes and pantry previews are routeless or reachable only by manually entered paths.** The arrival variants have no production route in `App.tsx`; preview routes are registered but no primary navigation entry was identified. Treat as intentional concepts unless they are expected user workflows.
- **[moderate, unconfirmed] Food diary, invitation, and some admin page modules need route-chain confirmation.** Their page files exist, but sampled route declarations do not clearly establish direct routability for every module; further full route/import mapping is needed. No claim that these pages fail at runtime.

Duplicate-purpose observations: `/products` and `/analyser` deliberately share `ProductsPage`; `/planner` and `/weekly-planner` deliberately share the planner wrapper; `/nutrition` and `/plant-diversity` are legacy redirects to `/food`. These look like compatibility aliases rather than duplicated implementations.

## 2. Navigation and routing integrity

**Verified statically:** `client/src/App.tsx` route declarations and sampled navigation/link construction. No live route was opened. The requested `client/src/components/app-shell.tsx` path does not exist at that exact location; the shell is assembled elsewhere and a complete component discovery pass remains open.

- **[moderate] Query loss on `/nutrition` redirect** — see §1. This is an actual source-level parameter-preservation defect candidate.
- **[polish] Navigation consistency / alias debt.** Several features retain two paths to one component (`/planner` + `/weekly-planner`, `/products` + `/analyser`) while Nutrition uses redirects. Aliases may be intentional for old deep links, but users and internal links use mixed route vocabulary. Recommend canonical-link consistency and a regression check for query/hash preservation if addressed.
- **[polish] Orphan route/module distinctions.** Withdrawn `/partners` is not dead route code, but its page file is dead/unreferenced from App. Registered pantry previews are direct paths with no primary nav. The route comments explain intentional withdrawal; no missing production navigation is asserted.
- **Status:** no comprehensive automated inbound-link graph was run; unregistered destinations in every dynamically constructed link remain unverified.

## 3. Business logic and query correctness

**Verified statically:** selected `storage.ts`, `routes.ts`, schema, and nutrition handler/port source. Postgres was not queried and multi-step behavior was not executed. No blanket claim that joins/transactions are correct is possible from this pass.

- **[moderate] Household member projection issues one user lookup per active member.** `server/storage.ts:2888–2907` loads a household, lists active members, then maps each member to a separate `users.findFirst`. This is a clear N+1 query shape, bounded by membership count but repeated for each request. Candidate improvement for review: fetch users in one `inArray` query or a joined projection while preserving the owner’s permission/data boundary. Not measured against production.
- **[moderate, needs transaction/concurrency review] Household creation uses retry + existence checks.** `server/storage.ts:2840–2860` appears to generate candidate identifiers and check existence before proceeding. A read-then-write check can race unless a database uniqueness constraint/transaction is the final authority; schema constraints and complete write block were not yet cross-verified, so this is a review lead, not a confirmed race defect.
- **[moderate, coverage gap] Routes contain large multi-step workflows and repeated storage reads; this pass did not audit every route body.** For instance `server/routes.ts:560+` centralizes route registration and multiple workflow paths; the source volume is too broad to certify every authorization, join, or transaction from sampled patterns. Further bounded review needed before any correctness/compliance assertion.
- **Positive pattern:** `server/intelligence/handlers/nutrition-knowledge-read-handler.ts:2–20` explicitly delegates facts to the Nutrition Knowledge owner and projects source-gated output; it does not duplicate nutrition reasoning in the capability handler. `:188–197` maps the owner's source refs into response citations.
- **Data limitation:** no database query execution, plan inspection, row-count validation, race reproduction, or stale-data check. No missing index finding is asserted without a complete query-to-index comparison.

## 4. Performance

**Verified statically only.** No profiler, bundle analyzer, production dataset, or network trace was used; no magnitudes are estimated.

- **[moderate] N+1 noted in §3:** household member resolution at `server/storage.ts:2888–2907` creates one user lookup per active member.
- **[polish, candidate] Large page modules merit bundle/chunk review.** Source sizes include `meals-page.tsx` ~349 KB, `weekly-planner-page.tsx` ~245 KB, `shopping-workspace-page.tsx` ~156 KB, `products-page.tsx` ~123 KB, and `profile-page.tsx` ~110 KB (source file byte counts, not bundled or compressed JS). `App.tsx` uses lazy imports for route pages, which should limit initial transfer; whether intra-page imports/chunks remain heavy is unmeasured.
- **[polish, unverified] Memoization/re-render and image optimization:** not audited component-by-component and not measured. No concrete defect is claimed.
- **Indexes:** schema declarations were sampled but a full mapping of query predicates/orderings to existing indexes was not completed. No index recommendation is ready for implementation.

## 5. UX / workflow friction

**Verified from source wording and route wiring only; no user session was performed.** The user-provided calibration example (`opportunity-engine.ts`) was considered; copy quality observations below are limited to specific friction signals, not a full copy audit.

- **[moderate] Nutrition lookup can silently lose selected items at the legacy URL boundary** — §1. This is a user-facing dead-end/empty-state risk rather than merely naming inconsistency.
- **[polish] Import Recipe route immediately changes destination.** Users arriving on `/import-recipe` get no explanation from that page before redirect (`client/src/pages/import-recipe-page.tsx:4–7`). If this route is still linked or bookmarked, explain where recipe import now happens or update inbound links.
- **[polish] Route naming is inconsistent around the same destinations.** Planner and analyser retain aliases while Nutrition redirects; nav/link consistency should be checked against canonical routes, with legacy deep links preserved.
- **Not verified:** the comparative number of steps for adding meals, creating a shopping list, planning, or recording diary entries; accessibility/focus behavior; error/empty/loading messages across pages. No UX task was exercised.

## 6. Nutrition/domain correctness

**Verified statically against NK1/NK2 and source. No nutrition science was independently re-derived.**

- **Architecture-consistent pattern (verified):** the Capability Registry handler identifies itself as a read projection and delegates nutrition facts and health claims to the canonical knowledge owner (`server/intelligence/handlers/nutrition-knowledge-read-handler.ts:2–20`). The handler maps source refs rather than writing a competing claim catalogue (`:188–197`).
- **Architecture-consistent source material (verified):** `shared/knowledge/claim-sources.ts:23–57` describes official EU Register wording and typed evidence/source references. `shared/schema.ts:1748–1787` marks `evidenceStrength` as stored-only/not for user display. This supports honest separation between internal confidence metadata and published claims.
- **[moderate, audit gap] Claim display/citation integrity not fully traced end-to-end.** This pass did not trace every registry record through service projection, API serialization, client display, source URL validation, and claim approval state. No blanket claim of citation correctness is made. Recommend a focused source-to-render trace before relying on all visible claims.
- **No unsupported health-science conclusion is made.** The consistency check is architectural and source-flow oriented only.

## 7. What is working well

- **Capability boundary appears deliberately thin:** the Nutrition Knowledge read handler documents its no-facts/no-claims rule and delegates to the owner. That is a concrete example of preserving one owner per fact.
- **Source-gated claim representation is explicit:** evidence strength and source references are represented distinctly, and schema commentary prevents a stored internal field from being mistaken for display authorization.
- **Compatibility intent is documented in routing:** `App.tsx` comments explain the withdrawn partner route and why canonical nutrition paths changed. This makes intentional orphaning distinguishable from accidental breakage.
- **Route-level lazy loading is present:** App page modules are dynamically imported, a useful baseline for limiting initial client work. Actual bundle impact still needs measurement.
- **The investigation boundary was respected:** no source/config/schema changes, no service/database access, and no commit/push occurred.

## Scope, unknowns, and suggested morning follow-up

This is an initial static whole-app pass, not a runtime certification. It does not establish that all 58 pages load, that all workflows complete against live logic, or that all database queries are performant/correct. The two highest-value review items from this pass are (1) preserve `items` across the `/nutrition` → `/food` compatibility redirect and (2) collapse the household-member per-row lookup after confirming the intended user projection and constraints. Before changing either, verify against the relevant route/storage contracts and add focused regression evidence. Continue the incomplete route graph, all storage/route/handler writes and reads, UI navigation links, and citation render chain.

## Files/artifacts and checks

- Investigation: `docs/investigations/platform/FULL1_THA_FULL_ENVIRONMENT_REVIEW_20261111.md`
- Progress/session run: `.engineering/session/runs/FULL1_PLATFORM_REVIEW_20261111.md`
- Shared Agent Report: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-11__FULL1_THA_FULL_ENVIRONMENT_REVIEW.md`
- Checks performed: Git branch/status/HEAD read-only; `rg` inventories and source inspection. No tests/build/browser/database/profiler run.
- Files changed by this audit: new report and run record only; no tracked source/config/schema changes. Existing dirty work preserved. No live services, database, scheduled task, or configuration touched.

## Phase 2 — targeted reproductions and test-mode/runtime evidence (2026-11-11)

### Reproduction: Nutrition redirect parameter loss

**Source trace:** `client/src/pages/plant-diversity-page.tsx:137` constructs `/nutrition?items=${encodeURIComponent(...)}`; `client/src/App.tsx:332` renders `<Redirect to="/food" />` and does not read/forward the incoming search string. The existing receiving page reads lookup state from the URL (`plant-diversity-page.tsx:95–98`).

**Minimal reproduction run (Node URL semantics):** input `/nutrition?items=apple%2Cpear`; apply the exact static route target `/food`; observed output `/food`, `itemsPreserved: false`. This reproduces the redirect contract independently of browser/server and demonstrates parameter loss. It is not a live HTTP request. Result: **confirmed source-level failure mode**.

### Reproduction: household member N+1 query shape

**Source trace:** `server/storage.ts:2888–2907` queries active membership rows, then `Promise.all(activeMembers.map(async member => db.query.users.findFirst(...member.userId)))` issues one user read per member. No batching/join in this block.

**Minimal source-shaped mock reproduction run:** three fake active members were passed through the same per-member lookup shape with a counted `findUser`; observed `members: 3`, `userSelects: 3`, `onePerMember: true`. Result: **confirmed N+1 call shape in the implementation**. This mock establishes the number of application-level lookups, not DB latency or query plans. The actual storage function was not invoked because importing it leads to the configured DB pool; no live Postgres query is claimed.

### Test-mode/database investigation and attempted checks

- `package.json` exposes many pure/injected-port tests and `ci:setup-db` (`scripts/ci/setup-test-database.ts`); inspected the script. It provisions a Postgres test database, not an in-memory SQL engine. `server/db.ts:8–29` loads `.env` only if needed, requires `DATABASE_URL`, and constructs `pg.Pool` against that URL. The in-memory fakes found are service/Capability ports, not a drop-in implementation of Drizzle storage/query semantics.
- `npm run test:intelligence-context-composition` — **PASS**, 170 checks. This exercises pure Context View/composition logic without Postgres.
- `npm run test:hybrid-intent-resolver` — **PASS**. Exercises injected/model fallback resolver behavior without Postgres.
- `npm run test:intelligence-native-discovery` — partial output showed its pure discovery checks pass, then its conversation-gateway integration attempted Postgres and failed with `EACCES` on port 5432 (IPv4/IPv6 addresses printed by the tool). The command exited after that failure. This is direct evidence that the suite is not DB-free end-to-end.
- No database setup, credentials, env files, or live services were changed. Did not retry under elevated/network permissions.

### Pattern search — status, not yet exhaustive

- `opportunity-engine.ts` has 11 `suggestedAction` construction sites (lines 408, 444, 495, 590, 659, 752, 812, 881, 943, 1015, 1079). Several are imperative and do not themselves state a reason; the object carries a separate `explanation`. Whether the rendered user-facing sentence combines explanation and action must be traced through `opportunity-delivery` and the client for each kind before calling these defects. **Open audit item**, not counted as confirmed findings.
- `ContextViewSpec` is centrally registered in `server/intelligence/context/context-view.ts:134,363`; strict per-capability field comparison against every Full Result type has not yet been completed. Existing composition tests cover known projection invariants and pass; this does not prove absence of a new missing field.
- `PLANNER_MATCHERS` and `isGenuineMiss` have exact source locations in `pattern-intent-resolver.ts` and `hybrid-intent-resolver.ts`; current hybrid tests pass for known planner discovery cases and true unknown fallback. Cross-capability matcher coverage remains open.
- Search for `docs/product/intelligence/*-capabilities/*.md` returned zero files under the named directory pattern in the current tree. Need verify alternate docs path/index and inspect any matched capability documents before treating this as a no-docs conclusion.

These Phase 2 steps deepen the earlier report but do not complete its exhaustive page data-path or all-capabilities audits. The original phase-one limitations remain in force.
