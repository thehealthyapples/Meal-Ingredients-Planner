# SHOP — Recipe Context Popup for Shopping

**Date:** 2026-11-13  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD at start:** `feat/integrated-dev` / `834c1d46cdf8c9108e05fed4e6044252b03a3a20`  
**Risk:** Amber — user workflow behavior  
**Rollback:** `rollback/shopping-recipe-context-popup-20261113` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`

## Objective and implementation approach

Give shoppers meal context for planned ingredients. The shopping page already reads per-user ingredient source records, and each record includes the source meal ID and name. The UI now exposes those existing names in an on-demand popup; no new mapping, API, or persisted state was introduced.

## Component locations

- `client/src/pages/shopping-workspace-page.tsx` — `WorkspaceRow` displays each ingredient and receives its existing `IngredientSource[]` rows from the page-level `/api/shopping-list/sources` query. When rows contain source meal names, the ingredient name becomes an accessible popover trigger. The popup deduplicates by meal ID and shows “Needed for” plus the meal names. Hover and click open it; leaving the trigger/content closes hover-opened context.
- `shared/schema.ts` — existing `ingredient_sources` table owns `shoppingListItemId`, `mealId`, and `mealName`.
- `server/routes.ts` — existing planner-to-shopping route creates these source records as meals are added.
- `docs/product/structure/pages/page-shopping-workspace.md` and `docs/product/inventory/product.yaml` — updated the existing Shopping page description; `docs/product/inventory/product.json` was regenerated from its YAML source.

## Governance preflight receipt

- **Repository:** integrated development repository, the task’s named scope.
- **Worktree / branch:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` / `feat/integrated-dev`.
- **Base HEAD:** `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- **Initial Git status:** intentionally dirty with pre-existing untracked platform diagnostics, inventory backups, and startup logs. All were preserved. The rollback tag protects committed HEAD only.
- **User request:** add recipe context popups to shopping ingredients, verify interactions, typecheck, and avoid database changes.
- **Mandatory governance read:** workspace and repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`; `docs/change-control.md`; `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, and `implementation-and-compliance.md`.
- **Task architecture read:** `ARCHITECTURE_PRINCIPLES.md`; `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_BLUEPRINT.md`; `THA_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_LANGUAGE.md`; `THA_UI_ARCHITECTURE.md`; `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `REPOSITORY_CONVENTIONS.md`; `ENGINEERING_WORKFLOW.md`; `docs/product/README.md`; the Shopping page and domain entries; and the existing `templates` and `meals` capability cards.
- **Existing implementation/assets inspected:** shopping workspace page, ingredient source schema and routes, plan-to-shopping review flow, Popover primitive, product registry entry, and issue-screenshot README. No user-provided meal-plan screenshots were present in the shared screenshot folder.
- **Authorized scope:** the requested feature on `feat/integrated-dev`; the user explicitly authorized the required rollback tag. Scope excludes schema/API changes, production or staging, database writes, and unrelated type/test repairs.
- **Architecture/governance conflicts:** none identified for the feature. Verification has pre-existing repository gaps described below.
- **Decision/risk status:** user-authorized Amber workflow change.
- **Implementation permitted:** YES under the repository’s standing dev-branch authority.

## Experience Constitution Check

- **Hospitality:** no welcome-versus-efficiency trade-off is needed; the context is optional and stays with the ingredient.
- **Outcome:** more confidence in a shopping decision, by showing which planned meals need the ingredient.
- **Weight:** no new page, strip, badge, or interrupting panel; details appear only on hover or click.
- **Voice:** the room reports stored meal names without interpretation.
- **Ownership:** the display reads source meal names from the existing ingredient source records; the UI owns no meal facts.
- **Agency:** shoppers decide what to do with the information.
- **Restraint:** only rows with source meal names receive an affordance; no empty or guessed context appears.
- **Layer:** the Experience Architecture owns behavior; the UI Architecture owns presentation; the existing Shopping page remains canonical.

## Architecture Compliance

- **Verified:** the Shopping page is the canonical shopping surface (`docs/product/structure/pages/page-shopping-workspace.md`, `docs/product/structure/domains/dom-shopping.md`).
- **Verified:** `ingredient_sources` already stores the shopping item and source meal identity/name (`shared/schema.ts`); the shopping page already reads the authenticated user’s source rows (`client/src/pages/shopping-workspace-page.tsx`, `/api/shopping-list/sources`).
- **Inferred from verified flow:** using those records extends the existing owner and introduces no parallel ingredient-to-meal state.
- Canonical identity and ownership remain singular: **YES**.
- Duplicate state or workflow introduced: **NO**.
- Existing architecture extended: **YES** — the current source records and Popover primitive are reused.
- Consumers found for the data: planner-to-shopping writer in `server/routes.ts`; shopping workspace reader in `client/src/pages/shopping-workspace-page.tsx`.
- AI architecture compliance: **not applicable**; no AI behavior or capability changed.

## Definition of Done

- An ingredient with source meals shows their names in a popup on hover or click.
- Duplicate source rows for the same meal display once.
- An ingredient without source meals remains a plain ingredient name.
- Existing shopping row controls remain available and no schema/API change occurs.
- Manual interaction was exercised in the local frontend against mocked source rows; the actual household screenshot plan was unavailable.

## Product Registry Impact

- Registry affected: **YES** — updated the existing Shopping page description to include meal context on planned ingredients.
- Entries created: **NONE**.
- Entries updated: **page-shopping-workspace**, household visibility, owner Colin Clapson; YAML version 3 and `last_verified: 2026-11-13`; generated JSON refreshed.
- Entries retired: **NONE**.
- New public/household visibility: **NONE**; existing household visibility retained.
- Product knowledge added to prompts/templates/fallbacks: **NO**.
- Registry verifier: **FAIL** with 8 findings and 179 warnings elsewhere in the repository (including existing orphan/missing inventory entries); it did not report the updated `page-shopping-workspace` entry. The repository-wide registry bijection therefore remains unverified.
- `.engineering/scripts/repo-structure-verify.sh` and `session-complete.sh`: **NOT RUN** — the Windows Bash launcher returned `E_ACCESSDENIED`; report and session files are in their prescribed locations.

## Adoption Register Impact

- Register affected: **NO** — no new shared component, hook, token, utility class, or canonical owner was created/adopted/retired. The existing `components/ui/popover.tsx` primitive is used locally by the Shopping page.
- Owners created/adopted; predecessors retired; rival ceilings; exemptions: **NONE**.
- `npm run adoption:check`: **not run**, because no client-side building block or owner was added, changed, or retired.

## Domain Impact and Data Impact

- **Domain:** Shopping State; supporting source relationship to Meal Identity.
- **Declared owner:** `ingredient_sources` records in `shared/schema.ts`, created by the existing planner-to-shopping flow in `server/routes.ts`.
- New store created: **NO**.
- Existing store extended: **NO**; existing rows are read as-is.
- Consumer created: **NO**; the existing Shopping page consumer now exposes the data.
- Reads existing data: **YES**.
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Backfill required: **NO**.
- Database/schema/migration changes: **NONE**.

## Trust Check

- Could this mislead? Only if an existing source record is wrong or stale; the UI shows its stored meal name without adding interpretation.
- Could this fabricate certainty? No; rows without source meal names do not show the popup.
- Guessed values shown as real: **NONE**.
- If source data is wrong, the user sees the stored source name; the popup does not alter shopping quantities, checklist state, or meal data.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- Live services, databases, scheduled tasks, configuration, credentials, production/staging: **NOT TOUCHED**. A temporary frontend-only Vite process used mocked API responses and was stopped.

## Verification Results

- `npm run build`: **PASS** — Vite built the Shopping page bundle and the server bundle completed. Existing build warnings remain (Browserslist data, PostCSS `from`, esbuild CJS/import-meta and defined `NODE_ENV`).
- `npm run typecheck`: **FAIL** — 16 TypeScript errors across unrelated existing files; none were reported in `client/src/pages/shopping-workspace-page.tsx`. Errors include `plan-to-shopping-review-dialog.tsx` missing a required button variant, admin UI, scripts, and server tests. No unrelated type fixes were made.
- `npm run test:shop1-intelligent-shopping`: **PASS**, 34 passed, 0 failed.
- `npm run test:shop3-shopping-surface-convergence`: **FAIL** — existing assertions failed for `/basket` and `/analyse-basket` route convergence and Shopping `AmbientIntelligence` mounting; then the test process could not run its `grep`/`true` child command in Windows PowerShell. No files in those assertions were changed by this task.
- Ephemeral Playwright frontend interaction check with mocked source rows: **PASS** — hover opens; click opens; “Homemade Burgers”, “Omelette”, and “Vegetarian Shakshuka” each render once; pointer exit closes; an ingredient with no source row has no trigger. Screenshot: `%TEMP%\tha-shopping-recipe-popup-20261113.png`.
- `git diff --check`: **PASS**.
- Product inventory build: **PASS** — generated 172 entries from YAML.
- Product inventory verification: **FAIL** — 8 repository-wide findings / 179 warnings; updated Shopping entry was not among failures. See Product Registry Impact.
- User-provided screenshot meal-plan verification: **NOT AVAILABLE** — no screenshots were present in `G:\The Healthy Apples\Incoming\Issue Screenshots`.
- Live household data interaction: **NOT RUN** — backend/database were not started or accessed; interaction test used explicit mocked rows only.

## Scope Lock

- Implemented: recipe context popup in the existing Shopping row, derived from the existing source rows; Shopping page registry description updated.
- Excluded: schema/migration/API work, persisted mapping changes, actual household database access, unrelated typecheck/test/registry repairs, and promotion/deployment.
- **SUGGESTIONS:** separately repair the repository’s baseline TypeScript errors and product registry bijection; resolve the failing SHOP3 route convergence assertions/test shell assumptions. These are outside this feature’s scope.

## Rollback Plan

- Rollback identifier: `rollback/shopping-recipe-context-popup-20261113` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Modified task files: `client/src/pages/shopping-workspace-page.tsx`; `docs/product/structure/pages/page-shopping-workspace.md`; `docs/product/inventory/product.yaml`; generated `docs/product/inventory/product.json`; this report; `.engineering/session/CURRENT.md`; `.engineering/session/runs/SHOP_RECIPE_CONTEXT_POPUP_20261113.md`.
- To undo task changes while preserving pre-existing work: restore only those task-authored paths from `HEAD` with `git restore --source=HEAD -- <listed paths>`; do not use a whole-tree reset/checkout. Verify `git diff --check`, rerun the build, and verify the shopping page and registry return to their pre-task versions.
- No commit, push, deployment, migration, or promotion was performed.

## Implementation Completion Report

- Architecture Complete: **YES** — existing source ownership, user-scoped read route, and canonical Shopping surface were reused; no duplicate data or workflow was created.
- Engineering Complete: **PARTIAL** — production build and focused SHOP1 test passed; full typecheck, SHOP3 suite, and repository-wide product registry verifier did not pass for pre-existing findings/tool assumptions documented above.
- Interaction Complete: **YES for mocked frontend scenarios** — hover, click, deduplication, dismissal, and no-source behavior passed. Actual household screenshot plan/live data remain unverified because the screenshots and live app were unavailable.
- Existing Assets Used: `ingredient_sources`, `api.shoppingList.sources`, Shopping `WorkspaceRow`, existing Popover primitive, and the Shopping product registry entry.
- New Assets Required: **NONE**.
- Remaining Gaps:
  - **Repository Gap** — full TypeScript baseline has 16 errors outside the modified shopping page; impact: cannot claim full project typecheck passes; next action: resolve in a separate typecheck remediation task; recommended capability: platform quality/typecheck.
  - **Repository Gap** — SHOP3 convergence suite has unrelated route/surface assertion failures and assumes Unix `grep`/`true`; impact: that regression suite is not green in this Windows run; next action: investigate in its own scope; recommended capability: shopping surface convergence / cross-platform test harness.
  - **Repository Gap** — product inventory verifier reports 8 unrelated bijection failures and 179 warnings; impact: global registry consistency cannot be certified; next action: reconcile existing registry findings separately; recommended capability: Product Knowledge Registry maintenance.
  - **Asset Gap** — requested meal-plan screenshots were absent from the shared screenshot folder; impact: exact supplied plan could not be tested; next action: rerun the interaction check with those screenshots/data when available; recommended capability: task evidence.
- Stop Test: **PASS** — all independent work possible without resolving unrelated repository gaps or accessing unavailable household data was completed; no in-scope work remains unattempted.

## User Acceptance Evidence

Mocked local frontend at `/shopping-workspace`, Review stage: the “onions” row opened its meal list on hover and click, listed the three example meals exactly once each, closed on pointer exit, and the “milk” row with no source did not show a trigger. A screenshot of the final popup state was captured under the system temporary directory.
