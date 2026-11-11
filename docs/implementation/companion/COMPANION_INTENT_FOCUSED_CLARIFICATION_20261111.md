# Companion intent focused clarification

**Date:** 2026-11-11  
**Risk:** 🔴 Red — AI reasoning and conversation behavior  
**Status:** Implemented in the development branch; awaiting live user acceptance.

## Scope

Replace resolver clarification paraphrase confirmations with direct questions that distinguish plausible meanings. For the reported example, the intended clarification is: “Do you mean the chicken needed by meals planned this week, or the amount already on your shopping list?”

This change follows the owner's steering that Companion should clarify the meaning of the question instead of focusing on answering a possibly misinterpreted question.

## Architecture and trust

**Verified:** The Hybrid Intent Resolver remains the existing model-assisted classifier; it uses the existing registry and executable-verb validation. It does not create a new assistant, conversation store, capability, or business workflow. Relevant owners: `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, and `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`.

**Verified:** Clarification text is model-generated and bounded/validated before display. It must be a short direct question beginning “Do you mean” or “Which”, offer two options with “or”, and end with a question mark. The old “Are you asking whether …?” paraphrase is rejected. Existing historical prompts remain recognized in bounded follow-up context.

**Inferred:** This should reduce circular confirmation turns because the question surfaces the two competing interpretations and leaves the choice to the person. The precise model behavior still requires live acceptance.

## Definition of done and evidence

- [x] Direct disambiguation question contract implemented in Hybrid resolver.
- [x] Gateway follows up using the same bounded clarification context and still recognizes historical wording.
- [x] Mocked regression covers an intent-focused question, rejection of confirmation-paraphrase wording, and historical context.
- [x] Hybrid resolver suite passes.
- [x] Pattern resolver suite passes: 143 passed, 0 failed.
- [ ] Conversation Gateway suite: unable to complete because its DB connection is denied by the sandbox (`EACCES`, TCP port 5432).
- [ ] Live Companion acceptance by the owner.

## Data, release, rollback, and scope lock

No schema, persisted data, live service, database, scheduled task, or configuration was changed. This remains a development-branch change; no deployment was performed.

Rollback reference created before edits: `rollback/COMPANION-clarify-intent-20261111` at `82f23226f43a3a8e8298f8863c483239a3e2a89d`.

Scope lock: only resolver clarification wording/validation and its bounded Gateway context recognition were added for this task. Previously dirty meal-image files and other unrelated changes were preserved. No matcher classification, query extraction, quantity computation, or capability behavior was changed as part of this clarification task.

## Acceptance

Please try “how much chicken is needed this week” and confirm that Companion asks what you mean (such as planned meal quantity versus shopping-list amount) instead of asking whether it is a question about chicken being needed.
