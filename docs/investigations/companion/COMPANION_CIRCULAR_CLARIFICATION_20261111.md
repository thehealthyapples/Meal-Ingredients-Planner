# Companion Circular Clarification — Root Cause

Date: 2026-11-11  
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
Branch: `feat/integrated-dev`  
Classification: RED investigation — Companion AI intent resolution.

## Question

Why does Companion ask “Are you asking whether amount of chicken needed this week?” and then repeat the question after the user says, “I am asking how much chicken is needed this week”?

## Short answer

The resolver lets the model classify both turns as `clarify`, then turns the model's summary into a yes/no question without checking whether it clarifies anything. The second user turn is sent back to the model with the first clarification in context, so the model can choose `clarify` again. The recently added verified-query extraction does not run on either turn if the model returns `kind=clarify`; it only applies after a `kind=route` result.

There is also a capability gap beneath the wording: planner discovery searches planned meal names; it does not inspect recipe ingredients or total their quantities. Shopping discovery can show a quantity already stored on the household shopping list, but it does not derive one from this week's planned recipes.

## Evidence

- **Verified:** `server/intelligence/hybrid-intent-resolver.ts` instructs the model to choose a route only when clear and to return `kind=clarify` when a plausible interpretation needs confirmation.
- **Verified:** its `clarify` branch checks only that the summary is a safe string, then builds `Are you asking whether ${summary}?`. It has no check that the summary asks about a real distinction, and it does not recover a route from an affirmative restatement.
- **Verified:** `server/intelligence/conversation/conversation-gateway.ts` includes the previous resolver clarification and recent turns in `clarificationContext` when the last assistant turn ended in `no-route`. A bare negative gets a dedicated fallback; a substantive restatement calls the provider again.
- **Verified:** `verifiedSearchQuery` is reached only after the model response passes the `clarify` return branch. Thus the prior query-extraction change cannot fix this transcript by itself.
- **Verified:** `server/intelligence/services/planner-discovery-engine.ts` filters planner entries by substring match against the meal name and returns planner entries. Its storage port reads planner weeks, entries, and meal names, not recipe ingredients.
- **Verified:** `server/intelligence/services/shopping-discovery-engine.ts` filters the existing caller-scoped shopping list by product name and returns each stored `quantityValue` and `unit`.
- **Verified:** the supplied transcript shows the second user message restates the request rather than choosing between alternatives.
- **Inferred:** the model is uncertain which capability or source should answer the quantity question. The current resolver prompt supplies capability IDs/names/executable verbs, not detailed parameter/answer contracts. The raw provider classification for the live turns was not available, so the model's internal reason for choosing `clarify` cannot be established from this transcript.

## Root cause and impact

This is a two-part defect:

1. **Clarification quality:** the resolver treats any sanitized model summary as a meaningful clarification and wraps it in the same yes/no wording. It can ask a user to confirm the words they just used.
2. **Answer capability:** no inspected Companion discovery path computes the total amount of an ingredient required by meals planned for a specific week. The user may instead mean the quantity already present on the shopping list; that path can return stored values but is not equivalent to a plan-derived total.

The text is therefore understandable to a person, but the system has neither a strong enough routing contract nor a validation rule that prevents circular clarifications. Query substring verification protects against invented terms only after a route has been chosen; it does not ensure the right capability is selected or create missing quantity aggregation.

## Recommended resolution

Do not repeat the user's request as a yes/no clarification. When the user asks for an amount, use `shopping-discovery:search` only to report a matching amount already stored on the shopping list, and label it as such. If the user means a total calculated from this week's planned recipe ingredients, state that this calculation is not currently available unless a separate, approved business path is implemented. If ambiguity remains, ask one useful distinction: existing shopping-list quantity or recipe-derived weekly total.

This investigation does not change runtime behavior. The choice of quantity source determines any follow-up implementation scope and data owner.

## Governance and risk

- Owner: existing Shopping storage owner for stored shopping-list quantity; existing Planner and meal/recipe owners for planner placement and ingredient composition. No new owner is proposed here.
- No duplicate assistant, conversation state, or workflow is introduced.
- No data/configuration/service changes were made.
- Rollback tag for this investigation's documentation artifacts: `rollback/COMPANION-circular-clarification-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Starting worktree had 21 pre-existing dirty status entries. All were preserved; no product source was touched.
- Tests: none run; investigation only.
- User acceptance: supplied transcript is evidence of the problem; no live browser/provider session was inspected.

## Remaining uncertainty

The exact model-selected `kind`, capability, verb, and summary for these two live turns are not logged in evidence supplied to this investigation. The observed wording matches the resolver's `kind=clarify` branch, but the model's internal rationale remains inferred. A sanitized trace would verify it.

## Follow-up after implementation — 2026-11-11

The owner subsequently directed the system to derive requested food amounts from that week's planner recipes. The dev implementation now adds deterministic `planner:read` ingredient analysis, utterance routing, and a clarification question that distinguishes the planner total from an already-listed shopping quantity. Pattern Resolver (148/148), Planner Binding (53/53), Context Composition (171/171), and Hybrid Resolver tests pass. The Gateway integration suite remains blocked by Postgres sandbox `EACCES`, and live Companion acceptance is still pending. Therefore the implementation supersedes this report's recommendation to defer recipe-derived totals; the original source analysis remains a historical root-cause record.
