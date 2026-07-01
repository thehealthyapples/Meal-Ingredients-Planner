---
name: INT18 LLM Provider pattern
description: How to swap/test the LLM provider in the Conversation Gateway
---

The `ConversationGateway` accepts an optional `ILlmProvider` as its second constructor arg.
Production singleton omits it → `createDefaultLlmProvider()` returns `OpenAIProvider` if `OPENAI_API_KEY` is set, else `NoOpProvider`.
Tests pass a `StubProvider` (in-memory, no HTTP) — this is how all 74 Phase 1 gateway tests run without a real LLM call.

**Why:** Direct OpenAI dependency in the gateway made it untestable and tied Phase 2 to a single model vendor.

**How to apply:** Any test that exercises `ConversationGateway.processUserTurn()` must pass a stub or the `NoOpProvider` as the second arg. Never rely on `OPENAI_API_KEY` being present in tests.
