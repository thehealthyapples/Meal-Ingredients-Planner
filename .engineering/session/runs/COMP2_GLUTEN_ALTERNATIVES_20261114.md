# COMP2 — Companion dietary alternatives, 2026-11-14

## Governance preflight receipt

- Repository/worktree: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; branch `feat/integrated-dev`; base HEAD `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Git status: 29 tracked modifications and 17 untracked paths before this task. `action-language.ts` and this dashboard were already modified; byte-exact copies are in `.engineering/session/prestate/COMP2_GLUTEN_ALTERNATIVES_20261114/`.
- Owner request: Companion should recognise the planner request, flag a dietary restriction, acknowledge the proposed gluten-free pasta correction, and give the household other suitable choices without silently changing the recipe or plan.
- Mandatory governance read: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, relevant `docs/ai-operating-model/` files, `docs/change-control.md`.
- Task architecture read: `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`.
- Existing implementation inspected: Companion action parser/resolver/gateway and conversation store, meals read binding, canonical household safety, restriction resolver/library, diet rules, substitution rules, planner write handler, direct planner route, and relevant tests.
- Scope: existing Companion action/follow-up path and canonical dietary substitute matching; focused regression tests, session and implementation reports. No unrelated client work, new assistant, schema, migration, production data, config, commit, push, or deployment.
- Architecture conflicts: existing Companion add path does not check meal safety, and safe substitute phrases currently match broad gluten terms. The fix must close these gaps within the existing owners and keep confirmation as the only write door.
- Risk/decision: Red, owner approved the local tag and the flag-and-choices flow in this chat. The project standing dev-branch authority applies. Implementation permitted: **YES** for this scoped dev change.
- Rollback: annotated tag `rollback/COMP2-gluten-alternatives-20261114` resolves to `834c1d46cdf8c9108e05fed4e6044252b03a3a20`. It protects committed state only; the pre-existing dirty files are separately snapshotted.
- Data: reads stored meal and dietary facts; no schema, backfill, or automatic business-data write. Planner add still requires existing confirmation. No deployment in this task.
- Trust: unverified substitutions must remain options, not safety claims. Unknown recipe or safety context must yield a question or gap, never a proposal.
- Acceptance: from Companion on Planner, “Can you add a spaghetti bolognaise as Thursdays dinner next week” names the restriction and offers alternatives for an unsafe stored meal; “I can buy gluten free pasta” acknowledges the option and continues the same task. No unsafe or unverified meal is proposed. Existing safe planner adds still resolve.

## Progress

- Rollback tag created and verified before edits.
- Baseline `test:int20-natural-language-actions`: 61 passed / 0 failed. Baseline Conversation Gateway suite could not connect to sandbox database (`EACCES`), not counted as passing.
- Implementation completed by Codex: action parser extended for "as Thursday's dinner" / missing-apostrophe possessives; action resolver now checks the saved meal against household safety before proposing a planner add (`defaultCheckPlannerMeal`, wired as the default `Deps.checkPlannerMeal`); substitution rule engine extended to expose multiple options; `dietRules.ts` dietary matching narrowed so a named safe substitute no longer masks a separate conflicting ingredient (e.g. soy sauce) in the same recipe; `recentPlannerDietaryCorrection()` in the gateway re-resolves the prior planner-add as a one-turn continuation when the household names a substitute, never via a second pending-action store.

## Picked up by Claude after Codex ran out of usage credit — verification completed

- `npm run typecheck`: clean. No errors in any file Codex touched; all remaining errors are the same pre-existing, unrelated ones present throughout this branch.
- `npm run build`: passes.
- `test:int20-natural-language-actions`: 67/67 (was 61 at baseline; +6 for the new phrasing).
- `test-restriction-resolver.ts`: 348/348.
- `test-substitution-rules.ts`: 133/133.
- `test-intelligence-conversation-gateway.ts`: 64/64 — the baseline `EACCES` sandbox DB issue did **not** reproduce when run directly; the suite passes cleanly outside Codex's sandboxed shell.
- **Resolved Codex's own open question** ("checking that the safety decision is exercised through the real capability read path, not only through a test stub"): traced `resolveActionCommand`'s dependency wiring directly — `checkPlannerMeal: overrides.checkPlannerMeal ?? defaultCheckPlannerMeal` follows the exact same injectable-dependency pattern already used for `read`/`canExecute`/`getCapability` in this file. Production (no caller passes `overrides.checkPlannerMeal`) always resolves to `defaultCheckPlannerMeal`, which calls the real `household-dietary-safety.js` module (`resolveHouseholdSafetyContext`, `isMealSafeForHousehold`, `validateAdaptationSafety` — the same canonical safety gate `meal-discovery-engine.ts` already uses elsewhere) and reads the real meal detail through `readResult(read, ...)`, the same capability-platform path every other read in this file already uses. Only test files inject an override; production never does.
- No files reverted or altered beyond this verification; no commit, push, or deploy.
