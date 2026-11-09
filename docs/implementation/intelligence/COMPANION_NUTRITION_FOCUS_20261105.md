# Companion nutrition focuses — 2026-11-05

## THA Governance Preflight Receipt
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** integrated-dev / `feat/integrated-dev`
- **Base HEAD:** `3467abad4eca8d82ffc52756fee13874e389597f`
- **Git status:** broad, pre-existing modified and untracked work was present. It was preserved. Exact-byte snapshots for every pre-existing tracked file modified in this task, with SHA-256 hashes, are in `.engineering/session/rollback-evidence/COMPANION_NUTRITION_FOCUS_20261105/manifest.json`.
- **User request:** implement a distinct nutrition-focus profile field, let Companion propose a write that the user confirms, and make focuses visible under Profile; keep ordinary profile editing available.
- **Mandatory governance read:** `AGENTS.md`, `PROJECT_GOVERNANCE.md` mandatory governance bootstrap and receipt, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/change-control.md`, `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`.
- **Task-specific architecture read:** `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, `capabilities/profile.md`, `capabilities/household.md`, Experience Blueprint, Experience Architecture, Experience Language, UI Architecture, Product Knowledge Registry Architecture, plus the app's relevant Companion / Profile / Household implementation and consent/privacy owners.
- **Existing implementation inspected:** `household_eaters` schema/storage and migration runner; Profile and Household capability bindings/handlers/ports; Action Language, Action Resolution, Conversation Gateway, action proposal store and confirm/cancel routes; Profile page and household eater projection; privacy export/erasure registry; existing consent check and product registry entries.
- **Authorized scope:** add per-eater voluntary nutrition focuses; allow self-editing on Profile; allow Companion to propose one focus for the caller or an account-less dependent; save only after the existing confirm flow; display focuses on the correct Profile card; preserve privacy consent, export and withdrawal behavior.
- **Explicit non-goals:** no medical diagnosis or treatment, no nutrient target or intake estimation, no hard restriction, no adult-to-adult profile writes, no unconfirmed writes, no new assistant/conversation store, no database migration application, server restart, deployment, or production/staging work.
- **Architecture/governance conflicts:** NONE found. Domain 16 `household_eaters` remains the single owner; existing Profile/Household capabilities, Intent Engine, Capability Registry, permission/consent checks and confirmation lifecycle are extended.
- **Decision / risk:** RED — personal health-adjacent preference data, persistence, AI write behavior and household privacy.
- **Implementation permitted:** YES — explicit user approval in this conversation plus the standing authority for `feat/integrated-dev`. No promotion authority inferred.
- **Rollback:** existing tag `rollback/companion-household-health-write-20261105` at base HEAD, plus exact working-copy snapshots in `.engineering/session/rollback-evidence/COMPANION_NUTRITION_FOCUS_20261105/`. Remove the newly added `shared/nutrition-focus.ts` and reverse only this task's diffs to roll back; do not reset the branch.

## Architecture compliance
- **One owner:** `household_eaters.nutrition_focuses` is the sole persisted owner for every eater's selected focuses (Domain 16). It is separate from `hard_restrictions`, `reported_health_context`, and the broad `user_preferences.healthGoals` field because these facts have different meanings.
- **No duplicate state/workflow:** Companion calls the existing Profile or Household capability and the existing confirmed action endpoint. No parallel assistant, chat memory, or profile table was added.
- **AI platform reuse:** the existing Intelligence Platform, Capability Registry, Intent Engine / Action Resolution, owner ports, consent service, permissions and action proposal confirm/cancel lifecycle are reused. The LLM does not choose or calculate a nutrient target.
- **Privacy boundary:** self focuses are projected only to that adult's Profile. Account-less dependent focuses are projected to active household adults after current consent. Adult focus data is omitted from the shared household eater projection. Writes are scoped to the caller or a server-resolved account-less dependent inside the active household.
- **Profile manual edit:** the account holder can select and save their own focus list directly from Profile. Companion's confirmed add supplements that path.

## Definition of Done
- Supported focus ids are presented as food preferences (protein, iron, fibre, calcium, potassium, magnesium, zinc, iodine, selenium, vitamins A/C/D/B6/B12/E/K, omega-3, folate).
- Explicit natural-language statements can become a single exact focus proposal; ambiguous/multiple nutrient statements do not create a proposal.
- Profile self writes and dependent Companion writes require current health-data consent; Companion writes require explicit confirmation.
- Focus appears on the matching person's Profile / Household Eaters card and refreshes after confirmed action.
- No focus is treated as a restriction, diagnosis, numeric requirement, or intake record.
- Manual acceptance begins on `/profile`, toggles and saves a focus, then checks persistence after reload. Companion acceptance asks “I want to boost iron” and confirms the proposal; dependent acceptance names a dependent and confirms; verify another adult's private focus is not returned by the shared household endpoint; withdraw consent and verify the privacy lifecycle. These manual checks were not run because the authored migration is not applied and the server was not restarted.

## Data impact and trust check
- **Reads existing data:** yes — authenticated Profile / active household and current consent.
- **Writes new data:** yes — append/update values in the new JSONB `household_eaters.nutrition_focuses` column.
- **Changes meaning of existing data:** no — distinct field and vocabulary; no reinterpretation of health goals, restrictions, or reported conditions.
- **Backfill:** none; additive empty-array default.
- **Migration:** authored in the existing runner, not applied.
- **Trust check:** UI and Companion wording says food preference, not target. Unknown or multiple focuses do not get guessed. Each value is allowlisted. Confirmation occurs before write. Consent withdrawal clears own focuses and dependent focuses the reporter added; data rights export/erasure includes authored dependent entries.
- **Highest-risk remaining inference:** dependent focuses are visible to active household adults under the existing health-data consent model. No live household was accessed to verify runtime behavior.

## Product and adoption registry impact
- **Product Knowledge Registry:** updated existing Companion entry and Profile page entry; no product capability entry was added as a second owner.
- **Adoption Register:** no shared/canonical component, hook, token, utility class, or reusable pattern was added; the Profile section uses existing Card, Button, Badge and form primitives. The new display component is local to Profile.

## Changes made
- Added the shared allowlisted nutrition-focus vocabulary and labels.
- Added `household_eaters.nutrition_focuses` and an additive migration.
- Added storage methods for self and dependent adds plus self profile replacement; duplicate values are idempotent.
- Extended Profile/Household handlers and ports with consent-gated reads and writes.
- Extended deterministic action parsing/resolution for explicit adult and dependent focus requests; uses existing confirmation; redacts the raw utterance and clears proposal parameters on terminal confirmation/cancel.
- Added direct self editing and per-person display under Profile; action success invalidates the corresponding profile cache.
- Extended consent withdrawal and personal-data export/erasure handling.
- Updated Domain 16, Profile/Household capability cards, Companion and Profile product entries, and Intelligence implementation documentation.
- Updated the household handler fixture for the additive required schema field.

## Verification
- `npm run typecheck`: **fails on pre-existing errors in untouched scripts and fixtures** (`shared/schema.categories` in two scripts; stale Context Composition, resolver, meal and discovery fixtures). No errors were reported in the changed feature files after correcting the new household fixture and Profile button props.
- `git diff --check` on all task-touched tracked files: passed with no whitespace diagnostics.
- `npm run adoption:check`: failed with **13 existing adoption/register failures** and one notice in unrelated worktree modules (e.g. authored-but-unadopted modules and stale register data). It reported 98 passed; no failure identified the Profile section or a task-owned shared building block. Register was not edited.
- No test suite run. No browser acceptance run. No database, live service, provider, configuration, or scheduled task touched.
- **Activation:** the running app will not expose the persisted field until the backend is restarted and the additive migration runs. Not performed; the dirty migration runner may include unrelated pending migrations.

## Files changed for this task
- `shared/nutrition-focus.ts` (new), `shared/schema.ts`
- `server/migrations/runner.ts`, `server/storage.ts`, `server/routes.ts`, `server/privacy/personal-data-registry.ts`
- `server/intelligence/handlers/profile-read-port.ts`, `profile-read-handler.ts`, `household-read-port.ts`, `household-read-handler.ts`
- `server/intelligence/bindings/profile.ts`, `household.ts`, `server/intelligence/capability-registry.ts`, `server/intelligence/README.md`
- `server/intelligence/conversation/action-language.ts`, `action-resolution.ts`, `companion-action-store.ts`, `conversation-gateway.ts`
- `client/src/pages/profile-page.tsx`, `client/src/components/conversation/FloatingAssistant.tsx`
- `server/tests/test-intelligence-household-binding.ts` (fixture compatibility only)
- `docs/architecture/capabilities/profile.md`, `docs/architecture/capabilities/household.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- `docs/product/intelligence/companion-capabilities/cap-companion.md`, `docs/product/structure/pages/page-profile.md`
