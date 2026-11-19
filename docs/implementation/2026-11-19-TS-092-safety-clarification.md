# Implementation report — TS-092 safety clarification

Date: 2026-11-19
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
Branch: `feat/integrated-dev`
Base HEAD: `21a9dd1789c32bc2baa70f739276e17b77f3f8b3`
Risk: 🔴 AI safety behavior.
Rollback tag: `rollback/TS-092-clarification-20261119-1100` → `21a9dd1789c32bc2baa70f739276e17b77f3f8b3`.

## Scope and preflight
Implemented the attached `PROMPT-TS-092-Safety-Clarification.md`. Task document is a requirement/evidence source, not architecture authority. The governance preflight authorized dev-branch implementation. Pre-existing unrelated modified and untracked files were preserved.

Read: workspace `AGENTS.md`; Bridge `AGENTS.md`; app `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/change-control.md`; AI operating-model `README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`; THA operating-model skill; `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`; `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`; `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `capabilities/meals.md`; `GOVERNING_EXPERIENCE_ARCHITECTURE.md`.

Verified baseline evidence: the latest benchmark classified TS-092 as accepted honest gap because no route was found, but its saved response preview was generic error text. It did not evidence the requested exact question.

## Changes
- `server/intelligence/conversation/ambiguous-meal-safety.ts`: pure detector for a question containing safety/allergy language and an ambiguous “this/that/the meal/dish/recipe” reference; returns the fixed question “Which meal would you like me to check for safety?”
- `server/intelligence/conversation/conversation-gateway.ts`: deterministic guard runs before safety-boundary handling, intent resolution, capability calls, and model generation. It returns the fixed clarification as an honest `gap`, with no safety assertion and no resolved capability.
- `server/tests/test-ambiguous-meal-safety-clarification.ts`: matcher regression checks for TS-092, equivalent wording, specific meal, non-safety question, and non-question statement.

## Compliance
**Verified:** the single Conversation Gateway and Intent Engine remain the owners of turn orchestration; the guard adds no capability, household fact, persistent safety state, or parallel workflow. It defers any eventual meal assessment to the existing household dietary-safety owner. It exits before intent resolution and LLM generation. The change reads only the current utterance in the guard; normal conversation logging remains part of the existing turn lifecycle.

Definition of done: exact clarification for ambiguous meal-safety questions, no ungrounded claim, guard before capability/model invocation, offline regression coverage. Trust check: matcher behavior and benchmark baseline are cited above; highest-risk remaining assumption is that the existing `gap` response path is rendered unchanged by the live application, which requires a DB-backed gateway check unavailable here. Rollback: revert the two implementation files and the test file to the rollback tag. Scope lock: no provider, registry, schema, data, or deployment changes. User-acceptance evidence: submit “Are you sure this meal is safe for my allergy?”; expected exact text is the clarification above and no safety assertion; focused test coverage below.

## Checks
- `npx tsx server/tests/test-ambiguous-meal-safety-clarification.ts`: 5 passed.
- `npm run test:intent-routing-attribution`: 81 passed.
- `npm run test:benchmark-dietary-safety-gate`: 13 passed.
- `git diff --check`: passed (line-ending warnings only).
- `npm run typecheck:ci`: did not pass. It reports baseline 14/current 18 and four diagnostics in unrelated pre-existing files/tests: two UI `ButtonProps.variant` errors and two provider-test errors. No TS-092 file was reported.
- `npx tsx server/tests/test-intelligence-personality-platform.ts`: pure assertions ran, then its gateway voicing check attempted Postgres and failed with sandbox `EACCES`. No retry/escalation.
- No live benchmark or database-backed acceptance run was completed. The exact gateway return is evidenced by code inspection and unit test of the matcher, not a live turn.

## Data and runtime
No schema, business data, credentials, configuration, scheduled task, deployment, or production/staging service was changed. No external provider call was made for this task. Existing conversation lifecycle is unchanged. Rollback tag anchors committed HEAD; it does not capture pre-existing dirty work.

## SUGGESTIONS
Add an approved DB-backed acceptance check for the full `processUserTurn` path when an authorized test database is available; confirm the response is surfaced verbatim and no capability call is recorded.
> **Reverted on 2026-11-19.** The safety clarification approach was withdrawn after benchmark regression feedback. The gateway is restored to match commit `21a9dd17`; the untracked matcher and test files were removed. This report is retained as an audit record of the attempted change and its tests, not as a statement of current behavior. The request-provided revert note identifies a response type contract concern; that cause has not been independently verified in this revert task. No tracked TS-092 changes remain to commit.
