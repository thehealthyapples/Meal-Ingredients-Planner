# INT24 — Canonical Intent Engine: Implementation Report

**Status:** Implemented and tested  
**Date:** 2026-07-01  
**Parent investigations:** INT22, INT23, INT23A  
**Classification:** Intelligence platform implementation  

---

## 1. Scope Delivered

| Item | Status |
|---|---|
| `server/intelligence/intent-resolver.ts` — `IIntentResolver` interface + types | ✅ Created |
| `server/intelligence/pattern-intent-resolver.ts` — `PatternIntentResolver` | ✅ Created |
| `server/intelligence/conversation/conversation-gateway.ts` — resolver wired in | ✅ Updated |
| `server/tests/test-intent-resolver.ts` — INT24 resolver tests | ✅ Created |
| `server/tests/test-intelligence-conversation-gateway.ts` — updated (§2 removed) | ✅ Updated |
| Schema changes | None |
| UI changes | None |
| Voice changes | None |
| Capability handler changes | None |

---

## 2. What Was The Problem (INT22 Root Cause)

The Conversation Gateway hardcoded `verb: "read"` for every capability query. For nutrition questions:

- "What is broccoli good for?" → `{ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "foods" } }`
- "Tell me 5 foods that help with sleep" → same

Neither `explain` nor `search` was ever invoked. The capability handlers returned generic food lists, providing no grounding that could help the LLM answer the actual question. The LLM said "I don't have that information right now" because the context data was irrelevant to the utterance.

---

## 3. Architecture (INT23A placement verdict)

The resolver is a **platform-level service** — a peer singleton to `intelligencePlatform`, not a conversation component.

```
utterance
    │
    ├─[write guard: detectWriteIntent]──→ honest gap (no resolver called)
    │
    ▼
intentResolver.resolve(utterance, IntentResolutionHints)
    │
    ▼
ResolvedIntent[] (capability, verb, parameters, confidence)
    │
    ▼
intelligencePlatform.handle(intent, identity)
    │
    ▼
LLM grounded response
```

**Why platform-level, not conversation-scoped:**
- Voice adapters (INT19) can call the resolver directly for deterministic commands without needing a conversation thread
- Scan/OCR adapters can resolve intent from extracted text without the full conversation pipeline
- The `IntentResolutionHints` type is a pure value object — no conversation state required
- Matches the "external interpreter" designation in `types.ts` line 183

---

## 4. Files Created

### `server/intelligence/intent-resolver.ts`

Defines the contract any future implementation must satisfy:

```typescript
interface IIntentResolver {
  resolve(utterance: string, hints: IntentResolutionHints): Promise<ResolvedIntent[]>;
}

interface ResolvedIntent {
  capability: string;
  verb: IntentVerb;
  parameters: Readonly<Record<string, unknown>>;
  confidence: number;       // 0.0–1.0
  termQuery?: string;       // raw benefit term for future slug pre-resolution
  gap?: ResolverGap;        // when present, prefer clarification over platform call
}

interface IntentResolutionHints {
  surface: ConversationSurface;
  temporalAnchor: string;
  currentFoodSlug?: string;
  activePlannerWeekId?: number;
  selectedMealId?: number;
}
```

Hard boundaries on every implementation: no storage reads, no platform calls, no business logic, always returns at least one `ResolvedIntent`.

### `server/intelligence/pattern-intent-resolver.ts`

Pattern-only strategy. Resolution pipeline per call:

1. **Specific pattern matchers** (confidence 0.80–0.92) — entity extraction
2. **Surface-primary rule** (confidence 0.65) — surface → primary capability
3. **Keyword fallbacks** (confidence 0.55–0.65) — vocabulary scan
4. **Profile always-on** (confidence 0.50) — personalisation context guaranteed
5. Deduplicate by capability (keep highest confidence per capability)
6. Sort descending, cap at 4

**Production singleton:**
```typescript
export const patternIntentResolver = new PatternIntentResolver();
```

---

## 5. Gateway Changes

### Constructor — DI for resolver

```typescript
constructor(
  private readonly store: IConversationStore,
  llmProvider?: ILlmProvider,
  intentResolver?: IIntentResolver,   // ← INT24
) {
  this.llmProvider = llmProvider ?? createDefaultLlmProvider();
  this.intentResolver = intentResolver ?? patternIntentResolver;
}
```

### Removed

- `selectCapabilities(utterance, surface)` — replaced by `intentResolver.resolve()`
- `buildCapabilityParams(capId, frame)` — parameters now come from `ResolvedIntent.parameters`
- The `SURFACE_CAP` map in the gateway (moved to `PatternIntentResolver`)

### `queryCapability` — verb no longer hardcoded

```typescript
// Before (INT18):
{ verb: "read", capabilityId: capId, parameters: buildCapabilityParams(capId, frame) }

// After (INT24):
{ verb: intent.verb, capabilityId: intent.capability, parameters: intent.parameters }
```

### `buildGroundedResponse` — resolver injection

```typescript
async function buildGroundedResponse(
  utterance: string,
  frame: ContextFrame,
  recentHistory: ConversationTurn[],
  llmProvider: ILlmProvider,
  intentResolver: IIntentResolver,    // ← INT24
): Promise<{ text: string; entityRefs: EntityRef[]; outcome?: IntentOutcome }> {

  // Write guard FIRST — write intents never reach the resolver
  const writeAction = detectWriteIntent(utterance);
  if (writeAction) { ... }

  // Resolve typed intents
  const resolvedIntents = await intentResolver.resolve(utterance, hints);

  // Query each via platform (with resolved verb, not hardcoded "read")
  await Promise.all(
    resolvedIntents.filter(ri => !ri.gap).map(async (ri) => {
      const data = await queryCapability(ri, frame.identity);
      if (data) capData[ri.capability] = data;
    }),
  );
```

### What did NOT change

- `detectWriteIntent` — unchanged, still runs first, still exported
- Conversation store, threads, turn recording — unchanged
- `ILlmProvider` abstraction — unchanged
- ContextFrame assembly and pointer discipline — unchanged
- `serializeFrameRef` — unchanged
- All 11 capability handlers — unchanged
- `intelligencePlatform.handle()` interface — unchanged
- Production singleton wiring — unchanged

---

## 6. Nutrition Routing — Before / After

### "What is broccoli good for?"

| | Before | After |
|---|---|---|
| Capability selected | `nutrition-knowledge`, `profile` | `nutrition-knowledge`, `profile` |
| **Verb** | `"read"` | **`"explain"`** |
| **Parameters** | `{ scope: "foods" }` | **`{ foodSlug: "broccoli" }`** |
| Confidence score | n/a (no resolver) | **0.90** |
| Handler invoked | generic food list read | food-specific explain (handler can return benefit data) |

### "Tell me 5 foods that help with sleep"

| | Before | After |
|---|---|---|
| Capability selected | `nutrition-knowledge`, `diary` (sleep keyword), `profile` | `nutrition-knowledge`, `profile` |
| **Verb** | `"read"` | **`"search"`** |
| **Parameters** | `{ scope: "foods" }` | **`{ query: "sleep" }`** |
| `termQuery` | — | `"sleep"` (for future slug pre-resolution) |
| Confidence score | n/a | **0.88** |

The "sleep" keyword no longer routes to `diary` — the specific `foods that help with` pattern has higher confidence and the deduplication + cap prevents the keyword match from hijacking the result.

---

## 7. Test Results

```
INT24 — Canonical Intent Resolver (PatternIntentResolver) tests
Passed: 109  Failed: 0
All tests passed ✓

INT18 Phase 1 — Conversation Gateway tests
Passed: 64   Failed: 0
All tests passed ✓

Total: 173 / 173
```

### INT24 test coverage

| §  | What | Tests |
|---|---|---|
| §1 | Broccoli → nutrition-knowledge explain | 18 |
| §2 | Sleep → nutrition-knowledge search (benefit→foods) | 17 |
| §3 | All 11 capabilities routed | 39 |
| §4 | Write guard fires before resolver | 12 |
| §5 | Confidence ordering + cap at 4 | 5 |
| §6 | Surface-based primary routing (9 named surfaces) | 11 |
| §7 | Entity slug normalisation | 7 |

### INT18 gateway test coverage

| §  | What | Tests |
|---|---|---|
| §1 | detectWriteIntent — 12 assertions | 12 |
| §2 | serializeFrameRef pointer discipline | 12 |
| §3 | assembleContextFrame surface hint priority | 6 |
| §4 | ConversationGateway state management | 18 |
| §5 | Write intent guard honest gap | 4 |
| §6 | contextFrameRef pointer discipline | 7 |
| §7 | listThreads | 5 |

---

## 8. Preserved Invariants

| Invariant | Preserved? |
|---|---|
| LLM Provider abstraction (`ILlmProvider`) | ✅ |
| Conversation Store (`IConversationStore`) | ✅ |
| Pointer-only ContextFrame discipline | ✅ |
| Write intents honest-gap BEFORE resolver | ✅ |
| intelligencePlatform.handle() interface | ✅ |
| All capability handlers | ✅ |
| No schema changes | ✅ |
| No UI changes | ✅ |
| One canonical Intelligence Platform | ✅ |

---

## 9. What Remains (Not In INT24 Scope)

| Future | When |
|---|---|
| `explain` and `search` verb handlers in the 11 bindings | Follow-on workstream |
| LLM strategy (`LlmIntentResolver`) | Future intent |
| Hybrid strategy | Future intent |
| Pronoun resolution via `priorEntityRefs` | Future — requires hint extension |
| `termQuery` → slug pre-resolution (benefit concept → slug) | Future — V2 path (INT23A §9) |
| Voice adapter calling resolver directly | INT19 implementation |
| Scan/OCR adapters calling resolver directly | INT19 implementation |
