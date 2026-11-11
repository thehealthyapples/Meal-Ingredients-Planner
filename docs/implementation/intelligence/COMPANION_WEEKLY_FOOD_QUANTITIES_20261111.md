# Companion Weekly Food Quantities — 2026-11-11

## Scope and evidence

- Owning repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`.
- Risk: **RED** — Companion answer reasoning and nutrition claims.
- Owner request: answer questions such as “how much chicken is needed this week” from the displayed planner week and stop unsupported generic nutrition advice when THA lacks intake evidence.
- Governing sources read: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `REPOSITORY_CONVENTIONS.md`, `CAPABILITY_BOUNDARY_ASSESSMENT.md`, and the task-routed Companion/Intelligence Platform, Capability Registry, Intent Engine, Companion Card, Food Intelligence, Nutrition Knowledge, Household Time, Intelligence Language Guide and Experience Constitution material. The repo-governed bootstrap and standing dev-branch implementation authorization were confirmed before editing.
- Governing architecture gap: reviewed numeric food-composition amounts and reviewed per-person nutrient reference values for this calculation are not available. Existing candidate references are unpublished/unreviewed; composition amount data is unused/uncited. This prevents a defensible nutrient adequacy result.

## Change

- Added `server/intelligence/handlers/planner-ingredient-analysis.ts`: read-only ingredient quantity aggregation from existing planner meal recipe lines. It converts compatible mass/volume units using the shared ingredient parser, keeps incompatible units separate, retains day totals, and reports partial/unavailable/no-match states without inventing missing recipe quantities.
- Extended the existing `planner:read` projection with optional utterance-scoped `ingredientQuery` analysis. No new capability, owner, persistence, or workflow was introduced.
- Added high-confidence routing for “how much/many [ingredient] ... needed/required ... this week” to the active planner week. Generic planner overview matchers were left untouched by this change.
- Pinned the calculation into planner Context View so budgeting cannot silently drop it.
- Added Companion prompt constraints: use the supplied calculation as-is, label partial totals accurately, and do not claim dietary nutrient adequacy/shortfalls from planned meals. When quantified intake and reviewed reference values are absent, state THA cannot yet compare the week with daily nutrient requirements; do not replace that answer with generic diet advice.

## Architecture and trust

- **Verified:** planner read remains the single owner and is permission-aware; this extends the existing planner projection and keeps ingredient data sourced from planner-owned recipes.
- **Verified:** one canonical planner week pointer is used. No new state or second conversation path was added.
- **Verified:** calculations derive only from stored ingredient lines. No serving-size or household-size assumption is made; each planned recipe is counted once as written.
- **Verified:** mass and volume remain distinct units; unknown/unquantified lines and unreadable meals are surfaced as partial/unavailable.
- **Verified:** no food-composition nutrient value is used to infer actual intake or missing nutrients.

## Definition of done and user acceptance

- Weekly chicken/egg questions route to planner read with the ingredient query and active week.
- Compatible ingredient quantities sum across meals and remain inspectable by day.
- Unreadable or unquantified recipe lines do not become false absence or exact totals.
- Nutrient deficiency claims and generic substitute advice are blocked at the Companion instruction boundary when evidence is absent.
- User acceptance remains pending owner retest in the Companion UI.

## Data impact and operational actions

- Read-only over existing planner weeks and recipe ingredient lines; no schema, data, configuration, database, live service, scheduled task, restart, deployment, or external provider changes.
- Meal-image work and other pre-existing dirty paths were preserved.
- Rollback tag: `rollback/COMPANION-weekly-food-quantities-20261111` at `82f23226f43a3a8e8298f8863c483239a3e2a89d`. Byte-exact pre-edit snapshots of previously dirty target files are in `G:\The Healthy Apples\Incoming\Rollback Evidence\COMPANION-WEEKLY-FOOD-QUANTITIES-20261111`.
- Scope lock: no changes outside weekly ingredient analysis/routing/context constraints and their tests/reporting. No promotion, push, or deployment.

## Verification

- `npx tsx server/tests/test-intent-resolver.ts`: **148 passed, 0 failed**.
- `npx tsx server/tests/test-intelligence-planner-binding.ts`: **53 passed, 0 failed**.
- `npx tsx server/tests/test-intelligence-context-composition.ts`: **171 passed, 0 failed**.
- `npx tsx server/tests/test-hybrid-intent-resolver.ts`: passed, including verified query extraction and rejected invented query regressions.
- `npx tsx server/tests/test-intelligence-conversation-gateway.ts`: blocked after initial assertions by sandbox database network `EACCES` while `DatabaseStorage.getUserPreferences` connects to Postgres. It did **not** pass.
- `npm run typecheck`: started `tsc --noEmit`, produced no diagnostics, but did not finish within the available run window; interrupted. Typecheck is **inconclusive**.
- Repository shell verification scripts were inaccessible through Bash (`Bash/E_ACCESSDENIED`). `git diff --check` reports trailing whitespace in pre-existing/new `CURRENT.md` rows, while no source-code whitespace error was reported.

## Rollback

Revert only the implementation hunks/files listed above and restore the pre-edit snapshots for files that had pre-existing modifications. Do not reset/clean the repository or revert unrelated work. The baseline rollback tag does not contain the pre-existing uncommitted work; use the snapshot evidence for those files.

## Commit-all follow-up verification — 2026-11-11

Freshly rerun during the owner-requested push-all follow-up: Pattern Resolver **148/148**, Planner Binding **53/53**, Context Composition **171/171**, Hybrid Resolver **PASS**. The Conversation Gateway integration suite was attempted and stopped at Postgres with sandbox `EACCES`; it did not pass. Full typecheck returned 15 diagnostics; the checked-in baseline is 14, and `typecheck:ci` identifies one unbaselined TS2741 in untouched `client/src/pages/admin-knowledge-claims-page.tsx`. No diagnostic points to the weekly quantity implementation files. UI acceptance remains pending.
