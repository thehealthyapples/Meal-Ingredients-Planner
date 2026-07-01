# INT23A — Canonical Intent Engine Placement Investigation

**Status:** Investigation only — no code, schema, route, or capability changes made  
**Date:** 2026-07-01  
**Parent:** INT23 (`INT23_CANONICAL_INTENT_RESOLVER_DESIGN.md`)  
**Source investigation:** INT22 (`INT22_NUTRITION_CONVERSATION_GROUNDING_INVESTIGATION.md`)  
**Classification:** Intelligence architecture investigation  

---

## 1. The Question

INT23 designed the Canonical Intent Resolver as a conversation component — a function called inside the Conversation Gateway, replacing `selectCapabilities()` and `buildCapabilityParams()`.

INT23A asks whether that placement is correct, or whether the resolver should be promoted to a first-class Intelligence Platform service, owned and instantiated at the platform level alongside `intelligencePlatform`.

Three sub-questions:
1. **Ownership** — what domain does the resolver belong to?
2. **Lifecycle** — when is it created, what depends on it, what does it depend on?
3. **Future reuse** — can Voice, Camera, OCR, and future input adapters benefit from a platform-level resolver that a conversation-scoped resolver cannot provide?

---

## 2. Architectural Grounding — What The Documents Already Say

### 2a. `types.ts` line 183 — The PARSE Stage Was Reserved At INT1

```
"The platform does NOT do natural-language parsing in INT1 — it receives an
 already-interpreted typed intent (the 'PARSE' stage is a future workstream
 / external interpreter)."
```

Two things are explicit here:
- The platform itself never does NL parsing. Its `handle()` method receives a typed `Intent` and executes it.
- The PARSE stage is described as an **"external interpreter"** — not a conversation component, not an internal gateway function. The word "external" was chosen deliberately to signal that parsing is a peer at the intelligence layer, not embedded within any single consumer.

### 2b. `intelligence-platform.ts` — The Platform Is Orchestration Only

The platform's role is precisely defined: registry + intent engine + permissions. Its constructor wire-in comment says clearly: *"It DOES NOT and MUST NOT perform planner logic, shopping logic, nutrition analysis, or profile management directly."*

The same principle extends to NL parsing. If NL → Intent resolution were embedded in the platform class, the platform would be doing two jobs: routing typed intents AND parsing natural language. These are different concerns with different failure modes, different provider dependencies, and different test contracts.

### 2c. `intent-engine.ts` — The Engine Is Already Downstream Of Parsing

The IntentEngine's pipeline is: LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND. Step 0 (parse NL → typed Intent) is explicitly absent. The engine receives an `Intent` object; it has never seen a user utterance. This is the correct design and must not be broken.

### 2d. INT19 — Input Adapters Feed The Conversation Gateway, Not The Platform

INT19 defines a clean adapter contract:

```
Human signal → [Input Adapter] → InputEvent { utterance, surface, surfaceHints }
                                       ↓
                             Conversation Gateway (INT18)
                                       ↓
                             intelligencePlatform.handle()
```

INT19's "key finding" on scan: *"Scan infrastructure is mature. The gap is not the scan capability — it is routing scan results through the Conversation Gateway."*

This describes the current state. But the investigation question is whether **all input adapters must route through the full Conversation Gateway** (with its conversation history, thread management, and LLM grounding), or whether some of them only need intent resolution + platform execution — a lighter path that skips the conversation layer.

---

## 3. What The Conversation Gateway Actually Is

The Conversation Gateway (INT18) does five distinct things:

| Step | What it does | Conversation-specific? |
|---|---|---|
| 1. Thread management | Create/reuse threads, record turns | ✅ Yes |
| 2. Context Frame assembly | Derive who/what/when from conversation state | ✅ Yes (prior entity refs) |
| 3. **Intent resolution** | Select capabilities, build parameters, choose verb | ⚠️ Not inherently |
| 4. Platform execution | Call `intelligencePlatform.handle()` | ❌ No |
| 5. LLM grounding | Ground LLM response on capability data, return plain text | ✅ Yes (for conversational output) |

Step 3 — intent resolution — is the only step that has no fundamental dependency on conversation state. It needs an utterance, a surface, and optional context hints. It does not need thread history, turn records, or prior entity refs to perform its core routing function.

The Conversation Gateway needs intent resolution as a consumer. It is not the correct owner.

---

## 4. What Each Future Input Adapter Actually Needs

### 4a. Voice (INT19 primary focus)

Voice produces an utterance from speech. The VoiceInputAdapter's output is:
```
InputEvent { utterance: "What is broccoli good for?", surface: "nutrition", ... }
```

This goes to the Conversation Gateway. The gateway handles thread persistence, LLM grounding, and conversational response. Voice gets intent resolution "for free" by flowing through the gateway.

**Does voice need platform-level resolution?** In the basic case, no — the gateway path works. But INT19 also identifies a future use case: *"voice commands might need to skip the conversation thread entirely"* (e.g. a cooking-mode command: "Add olive oil to my shopping list" does not need LLM grounding — it needs a direct write intent routed straight to the shopping capability). For these, routing through the full gateway is wasteful and adds latency from LLM grounding that serves no purpose for a deterministic action.

### 4b. Camera / Scan (`PlannerScanReview`, `RecipeScanReview`, `ShoppingListScanReview`)

Today scan components bypass the gateway entirely — they call business services directly:
- `PlannerScanReview` → planner route directly
- `RecipeScanReview` → recipe import route directly
- `ShoppingListScanReview` → shopping list route directly

INT19 noted this as a gap. But routing scan results through the **full** Conversation Gateway is not obviously correct either. A scan of a recipe card produces a structured recipe object — the intent is unambiguous (import this recipe). No LLM grounding is needed. No conversation thread is needed. What is needed is:

1. Intent resolution: "this scan result is a recipe import intent"
2. Platform execution: `intelligencePlatform.handle({ verb: "import", capabilityId: "meals" })`
3. Structured result back to the scan review component

The full conversation pipeline (threads, LLM grounding, conversation history) adds nothing here.

### 4c. OCR (image → text)

OCR produces raw text extracted from an image. That text may contain a meal plan, a recipe, a shopping list, or free text. After OCR, the question is: what should happen to this text?

- If it contains a meal plan → `{ verb: "import", capabilityId: "planner" }`
- If it contains a recipe → `{ verb: "import", capabilityId: "meals" }`
- If it contains a shopping list → `{ verb: "add", capabilityId: "shopping" }`
- If it's ambiguous → a clarification is needed

This is exactly what the resolver produces. But none of this requires a conversation thread, a user message record, or LLM grounding. It requires intent classification.

### 4d. Barcode scan

A barcode produces a product ID. The intent is always the same: look up this product. The resolver produces `{ verb: "read", capabilityId: "analyser" }` or `{ verb: "read", capabilityId: "shopping" }`. No conversation needed.

### 4e. Quick actions (chips, surface buttons)

Quick actions have semi-structured intent (the button label names an action). They need validation against the registry (does this verb exist for this capability?) and confidence is always high. The resolver can validate and route them without conversation involvement.

### 4f. Future: programmatic / API callers

An admin pipeline, an automated nutrition report, a background enrichment job — any of these may want to produce a typed intent from a string without spinning up a conversation thread. A platform-level resolver serves them.

---

## 5. The Dependency Analysis

### If the resolver lives inside the Conversation Gateway (INT23 original proposal)

```
Conversation Gateway
  └── IIntentResolver              ← resolver scoped here
        └── utterance + surface + ContextFrame

Voice → Conversation Gateway → IIntentResolver ✓
Scan  → Conversation Gateway → IIntentResolver (full gateway overhead) ✗
OCR   → Conversation Gateway → IIntentResolver (full gateway overhead) ✗
Quick action → Conversation Gateway → IIntentResolver (full gateway overhead) ✗
Future API → must instantiate a Conversation Gateway to get resolution ✗
```

The resolver works for the conversation case. For all other cases, callers are forced to drag the full conversation stack (thread creation, LLM grounding, turn recording) into contexts where none of it is needed.

### If the resolver is a platform-level service

```
intentResolver (standalone singleton)   ← new peer at intelligence layer
intelligencePlatform (existing singleton)

Conversation Gateway → intentResolver → intelligencePlatform.handle() ✓
Voice (direct)       → intentResolver → intelligencePlatform.handle() ✓
Scan (direct)        → intentResolver → intelligencePlatform.handle() ✓
OCR (direct)         → intentResolver → intelligencePlatform.handle() ✓
Quick action         → intentResolver → intelligencePlatform.handle() ✓
Future API           → intentResolver → intelligencePlatform.handle() ✓
```

The resolver is accessible from any caller. The conversation gateway remains one consumer among many, not the sole path.

---

## 6. The ContextFrame Coupling Problem — And Its Resolution

**The objection:** The resolver needs context (current food slug, active planner week, prior entity refs for pronoun resolution). These come from the ContextFrame, which is a conversation concept. If the resolver is a platform service, does it drag in conversation concepts?

**The resolution:** The resolver does not need the full ContextFrame. It needs a lightweight bag of optional hints — a proper subset that any caller can populate from its own context, with or without a conversation thread.

```typescript
/**
 * The minimal context the resolver needs. Any caller can construct this —
 * the Conversation Gateway populates it from the ContextFrame; Voice and Scan
 * populate it from surface hints; a bare API caller populates only surface.
 * This is NOT a conversation concept. It is a context snapshot.
 */
interface IntentResolutionHints {
  /** Which surface/page context the user is in. */
  readonly surface: ConversationSurface;
  /** Today's date anchor (for temporal utterances like "this week"). */
  readonly temporalAnchor: string;
  /** Food slug if the user is viewing a food detail page. */
  readonly currentFoodSlug?: string;
  /** Active planner week, if any. */
  readonly activePlannerWeekId?: number;
  /** Selected meal, if any. */
  readonly selectedMealId?: number;
  /**
   * Prior entity refs from the conversation thread, used for pronoun resolution.
   * Only the Conversation Gateway populates this. Other callers omit it and
   * accept that pronouns ("it", "that one") will not resolve.
   */
  readonly priorEntityRefs?: readonly EntityRef[];
}
```

`IntentResolutionHints` is a pure value type with no conversation imports. The Conversation Gateway can derive it from its ContextFrame. A scan adapter can derive it from the page surface and current UI state. A voice command in cooking mode can derive it from the active recipe context. The resolver's interface is decoupled from the conversation layer.

---

## 7. Ownership — What Domain The Resolver Belongs To

The resolver's job is to map `(utterance, surface, hints)` → `(capability id, verb, parameters, confidence)`. This mapping requires knowledge of:

1. Which capabilities exist (the Capability Registry vocabulary)
2. Which verbs those capabilities support (the IntentVerb taxonomy)
3. How to extract entity terms from free text (NL patterns, optionally LLM)

It does NOT require knowledge of:
- Any business data (nutrition facts, planner entries, shopping items)
- Conversation history or thread state
- LLM grounding or response generation
- Output formatting

This makes the resolver **intelligence infrastructure** — it is a peer of the platform, serving the same spine-level role as the registry and the intent engine, but in the layer below them (parse → route → execute). It belongs in `server/intelligence/`, alongside `intelligence-platform.ts`, not inside `server/intelligence/conversation/`.

---

## 8. Lifecycle

```
App startup
      ↓
  intelligencePlatform (singleton)    ← orchestrates capability execution
  intentResolver (singleton)          ← translates NL → typed Intents
      │
      │  Both initialized at startup.
      │  Neither depends on the other.
      │  intentResolver knows the capability vocabulary (from registry, not from the platform instance).
      │  intelligencePlatform knows nothing about utterances.
      │
      ├── Conversation Gateway (creates at first request, uses both singletons)
      ├── Voice Adapter (uses intentResolver directly for deterministic commands)
      ├── Scan Adapter (uses intentResolver directly for structured results)
      ├── OCR pipeline (uses intentResolver for free-text classification)
      └── Quick action handler (uses intentResolver for validation)
```

The resolver singleton is initialized once. Its strategy (pattern, LLM, hybrid) is injected at construction time. The resolver holds no state between calls; it is stateless apart from its compiled pattern library and strategy configuration.

**Registry dependency:** The resolver needs the capability vocabulary to validate its output. It reads the capability list and executable verbs from the Capability Registry — but it reads from the same registry instance the platform uses. It does NOT construct a second registry.

```typescript
// At app startup (alongside the platform initialization):
import { intentResolver } from "./intelligence/intent-resolver.js";
// intentResolver reads the registry for vocabulary at construction time.
// No circular dependency: resolver reads registry, registry is not aware of resolver.
```

---

## 9. The Two Paths — When To Use Each

The platform-level resolver does not mean every caller must use it. Two clean paths exist:

### Path A — Conversational (with thread, grounding, LLM response)
```
Text / Voice utterance
      ↓
Conversation Gateway
  → intentResolver.resolve()         (platform service)
  → intelligencePlatform.handle()    (platform)
  → LLM grounding
  → ConversationTurn recorded
  → Plain text response
```
Used by: the floating assistant, voice conversations, contextual chat in any surface.

### Path B — Deterministic (no thread, no grounding, direct result)
```
Scan / OCR / Barcode / Quick action / API
      ↓
intentResolver.resolve()             (platform service)
      ↓
intelligencePlatform.handle()        (platform)
      ↓
Structured result (JSON, not plain text)
```
Used by: scan review components, barcode lookup, admin pipelines, cooking-mode voice commands, quick actions.

Path B exists only if the resolver is a platform service. If the resolver lives inside the Conversation Gateway, Path B requires invoking the full gateway, which records threads, calls the LLM, and expects a conversational response — all wasteful overhead for a deterministic operation.

---

## 10. What Does NOT Change At The Platform Layer

Making the resolver a platform-level service does not change:

| Component | Change? |
|---|---|
| `IntelligencePlatform` class | None. `handle()` still receives a typed `Intent`. |
| `IntentEngine` | None. It still receives a typed `Intent`. |
| `CapabilityRegistry` | None. The resolver reads from it; the registry is not aware of the resolver. |
| `CapabilityHandler` pattern | None. |
| All 11 capability bindings | None. |
| Conversation Gateway pipeline | The gateway replaces its internal `selectCapabilities` + `buildCapabilityParams` with a call to `intentResolver.resolve()`. Everything else (thread management, LLM grounding, turn recording) is unchanged. |
| INT18 conversation contracts | None. |
| INT19 input adapter contracts | None. The adapter produces an `InputEvent` as before. For Path A, that event goes to the gateway as today. For Path B, the adapter calls the resolver directly without the gateway. |

---

## 11. Verdict

### Ownership

The Canonical Intent Resolver is **intelligence infrastructure**, not a conversation component. Its domain is the translation layer between human language and the typed intent vocabulary. It has no conversation state, no business data, and no LLM grounding responsibility. It belongs in `server/intelligence/` as a peer of `intelligence-platform.ts`.

### Lifecycle

A singleton, initialized at app startup alongside `intelligencePlatform`. Stateless between calls. Strategy (pattern/LLM/hybrid) is injected at construction. It reads the Capability Registry for vocabulary but is not owned by or embedded in the platform class.

### Future reuse

| Adapter | Needs gateway? | Needs resolver? | Verdict |
|---|---|---|---|
| Text (chat) | ✅ Yes (conversation) | ✅ Yes | Platform resolver via gateway |
| Voice (conversation) | ✅ Yes | ✅ Yes | Platform resolver via gateway |
| Voice (deterministic command) | ❌ No | ✅ Yes | Platform resolver directly |
| Camera / Scan | ❌ No | ✅ Yes | Platform resolver directly |
| OCR free text | ❌ No | ✅ Yes | Platform resolver directly |
| Barcode | ❌ No | ⚠️ Minimal (intent is fixed) | Platform resolver for validation |
| Quick actions | ❌ No | ⚠️ Validation only | Platform resolver for validation |
| Future API | ❌ No | ✅ Yes | Platform resolver directly |

A conversation-scoped resolver serves only the first two rows. A platform-level resolver serves all eight.

### Recommendation

**Promote the Canonical Intent Resolver to a platform-level service.** Specifically:

- File: `server/intelligence/intent-resolver.ts` (interface + `IIntentResolver`)
- Implementations: `server/intelligence/pattern-intent-resolver.ts`, `server/intelligence/llm-intent-resolver.ts`, `server/intelligence/hybrid-intent-resolver.ts`
- Input type: `IntentResolutionHints` (a pure value type, not a conversation concept)
- No changes to `IntelligencePlatform`, `IntentEngine`, or any capability handler
- The Conversation Gateway becomes one consumer of the resolver, not its owner

This fulfils the "external interpreter" designation in `types.ts`, serves all present and future input adapters, and keeps the Conversation Gateway focused on what it uniquely owns: threads, history, LLM grounding, and conversational response.
