---
name: INT24 Canonical Intent Resolver
description: PatternIntentResolver placement, wiring pattern, write-guard ordering, and DI contract for future implementors.
---

## Rule
The Canonical Intent Resolver (`IIntentResolver`) is a platform-level service, NOT a conversation component.
`PatternIntentResolver` and its singleton `patternIntentResolver` live in `server/intelligence/`, peer to `intelligencePlatform`.

**Why:** Any input adapter (Voice, Scan, OCR, future API) must be able to call the resolver without spinning up the full conversation pipeline (threads, LLM grounding, turn recording). Conversation-scoped placement would prevent this reuse.

## How to apply
- New resolver implementations go in `server/intelligence/`, named `<strategy>-intent-resolver.ts`.
- The gateway receives `IIntentResolver` via its third constructor parameter (optional, defaults to `patternIntentResolver`).
- Write guard (`detectWriteIntent`) always runs **before** `intentResolver.resolve()`. Write intents must never reach the resolver or the platform.
- `queryCapability` uses `intent.verb` from `ResolvedIntent` — never hardcode `"read"`. This is what INT22 was about.
- `IntentResolutionHints` is a pure value type — no conversation imports. Derive it from `ContextFrame` in the gateway; construct it directly in scan/voice adapters.

## Key confidence thresholds (PatternIntentResolver)
- Specific entity extraction: 0.80–0.92
- Surface-primary fallback: 0.65
- Keyword-only fallbacks: 0.55–0.65
- Profile always-on: 0.50
- Hard cap: 4 intents per call

## Test locations
- `server/tests/test-intent-resolver.ts` — resolver tests (109 assertions, INT24)
- `server/tests/test-intelligence-conversation-gateway.ts` — gateway tests (64 assertions, INT18/INT24)
- The old `selectCapabilities` export was removed from the gateway in INT24; routing tests moved to test-intent-resolver.ts.
