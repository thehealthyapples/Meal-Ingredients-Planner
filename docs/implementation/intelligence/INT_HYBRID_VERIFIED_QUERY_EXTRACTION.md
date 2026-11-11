# INT Hybrid Verified Query Extraction

Date: 2026-11-11  
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
Branch: `feat/integrated-dev`  
Risk: RED — AI reasoning and routing behavior.

## Objective and scope

The existing HybridIntentResolver may now accept an optional free-text `query` from its model classification only for a `search` intent on a registered discovery sibling, and only when the trimmed query is a case-insensitive literal substring of the original utterance. This is additive to the weak-match fallback. Generic and specific pattern matchers were not changed.

## Contract evidence

- **Verified:** `planner-discovery-handler.ts` reads `intent.parameters.query` as a string, trims it, and reports an honest gap when it is empty. `planner-discovery-port.ts` delegates `discover(query: string, userId: number)`.
- **Verified:** `meal-discovery-handler.ts` and its port use the same `{ query: string }` contract. The other existing discovery handlers likewise read the free-text `parameters.query` for their search operation; reviewed handler files include diary, household, nutrition, pantry, and shopping discovery.
- **Verified:** each discovery sibling is marked through `Capability.discoveryOf` in the runtime registry (`server/intelligence/capability-registry.ts`). The resolver uses this existing metadata rather than adding a second capability list.
- **Verified:** non-discovery capabilities such as `planner` do not receive this free-text field, even if the model includes `query` in its JSON.

## Implementation

- Extended the existing model classification prompt with optional `query` and restricted its intended use to discovery searches.
- Added server-side `verifiedSearchQuery`: requires `verb === "search"`, registered `discoveryOf` metadata, a non-empty string, and `utterance.toLowerCase().includes(query.toLowerCase())` after trimming.
- Only the verified query is copied to `ResolvedIntent.parameters`. A missing, non-string, invented, or out-of-contract query is omitted while the independently validated capability/verb route retains the previous behavior.
- Added mocked Hybrid resolver regressions for chicken query extraction, an invented “beef” query, and a planner read route that must not receive a query field.

## Architecture and AI compliance

- **Verified:** the work extends the existing Pattern → Hybrid resolver and runtime Capability Registry path. No assistant, conversation store, capability, business owner, workflow, or data store was added.
- **Verified:** capability and executable-verb validation remains in force. Permission-aware access remains at invocation in the existing Intent Engine; no permission path changed.
- **Verified:** discovery handlers delegate through their existing ports to existing business services. No handler, port, engine, or business-data owner changed.
- **Verified:** the existing Conversation Gateway remains the sole conversation path; no conversation state was added or duplicated.
- Data impact: reads the current utterance already supplied to resolution; no writes, backfill, or meaning changes to persisted data.
- Product Knowledge Registry impact: none; no THA product concept or user-facing capability was introduced.
- Trust check: model output remains advisory. A query value is accepted only if present in the user's own text and valid for the existing discovery-search contract. Other free-text model parameters are not extracted.

## Definition of done and checks

- `npx tsx server/tests/test-hybrid-intent-resolver.ts` — PASS, including valid substring, invented query rejection, and non-query contract regressions.
- `npx tsx server/tests/test-intent-resolver.ts` — PASS, 143 passed, 0 failed.
- `npx tsx server/tests/test-intelligence-conversation-gateway.ts` — INCOMPLETE: the suite reaches the state-management stage and attempts Postgres; sandbox network policy returns `EACCES`. It is not reported as passed.
- Live Companion retest — pending. Starting page: Planner with the floating Companion panel. Action: ask “how many chicken meals on my planner”. Expected: validated `planner-discovery:search` with query `chicken`; success means the existing discovery path returns the planner matches for the current user. This runtime acceptance was not performed here.
- Highest-risk remaining inference: passing mocked routing tests is not evidence that the live Companion UI renders the discovered answer; verify by the owner retest above.

## Rollback, release, and scope

- Rollback tag: `rollback/INT-hybrid-verified-query-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Rollback only this task's additions to the resolver and tests and its task records. Do not reset or discard the pre-existing working tree. The previous weak-fallback and meal-image work remains preserved.
- No release, database, configuration, service restart, migration, or deployment is included. No promotion is authorized.
- Scope lock: only resolver query contract/verification, three regression cases, and this task's session/implementation records.

## SUGGESTIONS

- After owner UI acceptance, consider a separate follow-up for interpreting count language (“how many”) into a count answer. This change supplies only a literal discovery term; it does not infer aggregation semantics.
