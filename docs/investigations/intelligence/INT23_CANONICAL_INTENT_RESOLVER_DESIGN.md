# INT23 — Canonical Intent Resolver Design

**Status:** Investigation only — no code, schema, route, or capability changes made  
**Date:** 2026-07-01  
**Source investigation:** INT22 (`INT22_NUTRITION_CONVERSATION_GROUNDING_INVESTIGATION.md`)  
**Classification:** Intelligence design investigation  

---

## 1. Why This Resolver Exists — The INT22 Root Cause

INT22 established that conversational nutrition questions ("What is broccoli good for?", "Tell me 5 foods that help with sleep") return honest gaps not because the data is missing, but because the Conversation Gateway never asks for the right data. Three structural gaps were identified:

| Gap | Location | Effect |
|---|---|---|
| **A** | `buildCapabilityParams()` | Only one code path for `nutrition-knowledge`: returns a generic food list. Cannot express "benefits for food X" or "foods for benefit Y". |
| **B** | `queryCapability()` | Hardcodes `verb: "read"` for every call. `search` and `explain` — the verbs designed for conversational queries — are never invoked. |
| **C** | `selectCapabilities()` | Keyword set misses food names, benefit concepts, and natural-language phrasings. |

The fix is not a patch inside the gateway. The architecture anticipated this exactly. `types.ts` line 183 reads:

> *"The platform does NOT do natural-language parsing in INT1 — it receives an already-interpreted typed intent (the 'PARSE' stage is a future workstream / external interpreter)."*

The Canonical Intent Resolver is that future workstream made concrete. It is the "PARSE" stage the architecture always reserved.

---

## 2. Architecture Compliance Review

| Principle | INT23 compliance | Verdict |
|---|---|---|
| **One canonical assistant** | The resolver is a sub-component of the Conversation Gateway pipeline, not a second assistant. | ✅ |
| **One Intelligence Platform** | The resolver produces `Intent` values that the existing `intelligencePlatform.handle()` executes. It adds no second platform. | ✅ |
| **One Capability Registry** | Every `ResolvedIntent` maps to a `(verb × capabilityId)` pair already registered. The resolver can only route to known capabilities. | ✅ |
| **No business logic** | The resolver extracts intent signals (entity type, question pattern, parameters) but knows no nutrition facts, no planner rules, no shopping logic. All data retrieval stays in handlers and services. | ✅ |
| **No duplicate capability handlers** | The resolver never reads from the database, never calls a registry method, and never re-implements handler logic. It produces routing instructions only. | ✅ |
| **Provider-neutral** | `IIntentResolver` is a pure TypeScript interface. Implementations may be regex, LLM-based, or hybrid. The gateway depends only on the interface. | ✅ |
| **Honest gaps over fabrication** | Low-confidence resolutions surface a structured `ResolverGap` rather than a guess. The existing honest-gap chain (handler → platform → gateway) is preserved. | ✅ |
| **Extend existing architecture** | The gateway's `selectCapabilities()` and `buildCapabilityParams()` are replaced by a call to `IIntentResolver.resolve()`. `intelligencePlatform.handle()` is unchanged. | ✅ |

**Gate result: PASS.** INT23 fills the explicitly reserved "PARSE" seam in the architecture. It replaces no existing authority and introduces no second owner of any fact.

---

## 3. Where The Resolver Sits

### Current pipeline

```
User utterance
      ↓
selectCapabilities()          ← keyword regex → capability id list
      ↓
buildCapabilityParams()       ← surface/frame → parameters (verb hardcoded "read")
      ↓
queryCapability() × N         ← always verb:"read"
      ↓
intelligencePlatform.handle()
      ↓
Handler → Registry → Data
      ↓
LLM (grounded on capability data)
```

### Proposed pipeline with the resolver

```
User utterance + surface + ContextFrame
      ↓
IIntentResolver.resolve()     ← THE NEW SEAM
      ↓
ResolvedIntent[]              ← capability, verb, parameters, confidence, gap?
      ↓
Gateway: filter by confidence, honour gaps
      ↓
queryCapability(ResolvedIntent) × N    ← verb now from resolver, not hardcoded
      ↓
intelligencePlatform.handle()  ← unchanged
      ↓
Handler → Registry → Data
      ↓
LLM (grounded on richer, correctly-routed data)
```

The resolver replaces the `selectCapabilities` + `buildCapabilityParams` combination. `queryCapability` is updated to accept a `ResolvedIntent` instead of just a capability id.

---

## 4. The `ResolvedIntent` Shape

```typescript
/**
 * A fully-resolved, typed intent produced by the Canonical Intent Resolver.
 * This is the output of the "PARSE" stage (types.ts line 183). It is transient —
 * never persisted. It maps directly to the existing `Intent` type for platform dispatch.
 */
interface ResolvedIntent {
  /** Target capability id — must exist in the Capability Registry. */
  readonly capability: string;

  /** The canonical verb from the closed IntentVerb set. */
  readonly verb: IntentVerb;

  /** Handler-ready parameters. The resolver builds these; it does not validate them — 
   *  the handler validates against its own schema as always. */
  readonly parameters: Readonly<Record<string, unknown>>;

  /** 0.0–1.0. Resolver's confidence that this intent correctly captures the utterance. */
  readonly confidence: number;

  /**
   * Raw entity term that needs slug resolution before the handler can use it.
   * Present when the resolver extracted a food name or benefit concept from free text
   * and could not guarantee it matches a canonical slug exactly.
   * The gateway may use this to pre-resolve via { verb:"search", query: termQuery }
   * before calling the primary intent.
   */
  readonly termQuery?: string;

  /**
   * Present when the resolver cannot produce a confident intent and the gateway
   * should surface a clarification or honest gap rather than proceeding.
   * A gap does not mean an error — it means honest uncertainty.
   */
  readonly gap?: ResolverGap;
}

interface ResolverGap {
  /**
   * - "ambiguous"           : multiple valid interpretations, needs user choice
   * - "unknown"             : utterance intent is unrecognisable
   * - "out-of-scope"        : intent recognised but not expressible via any capability
   * - "needs-clarification" : resolvable if user provides one specific missing detail
   */
  readonly kind: "ambiguous" | "unknown" | "out-of-scope" | "needs-clarification";

  /** A prompt to surface to the user when kind is "ambiguous" or "needs-clarification". */
  readonly clarificationPrompt?: string;
}
```

A `ResolvedIntent` with `gap` set and `confidence < CONFIDENCE_THRESHOLD` signals the gateway to return the gap message without calling the platform. A `ResolvedIntent` with `gap` set but `confidence >= CONFIDENCE_THRESHOLD` is a soft signal — the gateway may still attempt the intent and let the platform's honest-gap chain handle misses.

---

## 5. The `IIntentResolver` Interface

```typescript
import type { ConversationSurface } from "./conversation-store.js";
import type { ContextFrame } from "./context-frame-assembler.js";

/**
 * The Canonical Intent Resolver contract. Implementations are provider-neutral:
 * the gateway depends only on this interface, not on any specific parsing strategy.
 *
 * HARD BOUNDARIES:
 *  - resolve() must not call intelligencePlatform.handle() or read from storage.
 *  - resolve() must not fabricate a capability that does not exist in the registry.
 *  - resolve() must not contain business logic (nutrition facts, planner rules, etc.).
 *  - resolve() must never return an empty array — at least one ResolvedIntent or gap
 *    must always be returned so the gateway can act.
 */
interface IIntentResolver {
  /**
   * Convert a user utterance into one or more typed, ordered intents.
   * Results are ordered by confidence descending. The gateway takes the first
   * result at or above its confidence threshold. If all results are below threshold
   * or carry a gap, the gateway surfaces the gap rather than guessing.
   */
  resolve(
    utterance: string,
    surface: ConversationSurface,
    frame: ContextFrame,
  ): Promise<ResolvedIntent[]>;
}
```

---

## 6. Capability + Verb Routing Table

This is the complete routing map the resolver must implement. It lists every `(question pattern → capability + verb + parameter shape)` the resolver needs to cover. It is exhaustive for `nutrition-knowledge` (the INT22 subject) and representative for all other capabilities.

### 6a. `nutrition-knowledge`

| Question pattern | Entity extracted | Capability | Verb | Parameters |
|---|---|---|---|---|
| "What is X good for?" | food: X | nutrition-knowledge | `explain` | `{ foodSlug: X }` |
| "What are the benefits of X?" | food: X | nutrition-knowledge | `explain` | `{ foodSlug: X }` |
| "Benefits of X" | food: X | nutrition-knowledge | `explain` | `{ foodSlug: X }` |
| "Is X good for me?" | food: X | nutrition-knowledge | `explain` | `{ foodSlug: X }` |
| "Tell me about X" (food context) | food: X | nutrition-knowledge | `read` | `{ scope: "food", slug: X }` |
| "What nutrients does X have?" | food: X | nutrition-knowledge | `read` | `{ scope: "food", slug: X }` |
| "Foods that help with Y" | benefit: Y | nutrition-knowledge | `search` | `{ query: Y }` |
| "Foods good for Y" | benefit: Y | nutrition-knowledge | `search` | `{ query: Y }` |
| "What helps with Y?" | benefit: Y | nutrition-knowledge | `search` | `{ query: Y }` |
| "What foods contain [nutrient]?" | nutrient: N | nutrition-knowledge | `search` | `{ query: N }` |
| "Show me all foods" / "What foods are in here?" | — | nutrition-knowledge | `read` | `{ scope: "foods" }` |
| "What nutrients are tracked?" | — | nutrition-knowledge | `read` | `{ scope: "categories" }` |

### 6b. Other capabilities (representative patterns)

| Question pattern | Capability | Verb | Parameters |
|---|---|---|---|
| "What's on my plan this week?" | planner | `read` | `{ scope: "week", weekId: frame.activePlannerWeekId }` |
| "What's in my basket / shopping list?" | shopping | `read` | `{ scope: "list" }` |
| "What's in my fridge / pantry?" | pantry | `read` | `{ scope: "list" }` |
| "What did I eat on [date]?" | diary | `read` | `{ scope: "day", date: X }` |
| "Who's in my household?" | household | `read` | `{ scope: "household" }` |
| "Does [meal] contain additives?" | analyser | `read` | `{ scope: "additives" }` |
| "Find me a recipe for X" | meals | `search` | `{ query: X }` |
| "Tell me about [meal]" | meals | `read` | `{ scope: "meal", mealId: frame.selectedMealId }` |

---

## 7. Entity Extraction Design

Entity extraction is the step that converts free text into the parameter values the routing table uses. The resolver extracts two entity types relevant to INT22: **food entities** and **benefit/concept entities**.

### 7a. Food entity extraction

A food entity is a noun phrase that names an ingredient, vegetable, fruit, protein, or grain. Detection signals:

1. **Pattern anchors**: after stripping question prefixes ("what is", "tell me about", "what are the benefits of", "is X good for"), the remaining noun phrase is the candidate food.
2. **Negative signals**: words that are not food names even if left behind ("me", "my", "a", "the", "it", "that").
3. **Normalization**: lowercase, trim, replace spaces with hyphens to produce a slug candidate.

Example: *"What is broccoli good for?"* → strip "what is ... good for" → "broccoli" → slug "broccoli".

### 7b. Benefit / concept entity extraction

A benefit entity is a concept that describes a health outcome or body system. Detection signals:

1. **Pattern anchors**: after stripping "foods that help with", "foods good for", "foods for", "what helps with", the remaining phrase is the benefit candidate.
2. **Common concept vocabulary**: sleep, energy, immunity, digestion, heart, gut, bone, brain, skin, mood, weight, inflammation. Presence of these words in the utterance is a strong signal, even without anchor patterns.
3. **Normalization**: lowercase, trim.

Example: *"Tell me 5 foods that help with sleep"* → strip "tell me 5 foods that help with" → "sleep" → term "sleep".

### 7c. What the resolver does NOT do

- It does not look up whether "broccoli" exists in the database.
- It does not know what benefits broccoli has.
- It does not validate slugs. The handler returns an honest gap if the slug is unrecognised.
- It does not interpret the number "5" as a parameter — the LLM interprets user preferences like counts from context.

---

## 8. Slug Resolution — The Mismatch Problem

The resolver extracts entity terms from free text. The handlers expect canonical slugs (e.g. `"broccoli"`, `"better-sleep"`). These may not match exactly when:
- The user says "sweet potato" but the slug is `"sweet-potatoes"`
- The user says "sleep" but the benefit slug is `"better-sleep"` or `"sleep-quality"`

### Two approaches

**V1 — Pass-through (recommended for first implementation)**

The resolver normalizes the term (lowercase, hyphenate spaces) and uses it directly as the slug. If the slug does not exist, the handler returns an honest gap (e.g., "no food recorded for slug 'sweet-potato'"). The gateway receives a gap, the LLM acknowledges it cannot find the food, and the user can rephrase. This works reliably for most common food names whose slugs are predictable.

For benefit concepts like "sleep", the resolver uses `verb: "search"` with `{ query: "sleep" }` instead of `verb: "read"` with `{ scope: "benefit", slug: "sleep" }`. The `search` verb does partial-match searching over names and slugs — it will find any benefit whose name contains "sleep" regardless of exact slug form.

**V2 — Pre-resolve via search (future extension)**

When the resolver sets `termQuery`, the gateway optionally performs a pre-resolve step:
1. Call `{ verb: "search", parameters: { query: termQuery } }` → get canonical slugs
2. Use the best-match slug for the primary intent

This eliminates the mismatch problem entirely but adds a round trip. Suitable for a V2 once V1 coverage is measured.

---

## 9. Confidence Scoring and Gap Handling

### Confidence levels

| Score | Meaning | Gateway action |
|---|---|---|
| ≥ 0.75 | High confidence — resolver is certain of the intent | Proceed with the resolved intent |
| 0.45–0.74 | Medium confidence — likely correct but uncertain entity or pattern | Proceed; accept handler honest-gap if it comes back |
| < 0.45 | Low confidence — resolver cannot reliably determine intent | Surface a `ResolverGap` to the user; do not call the platform |

### Gap kinds and responses

| `gap.kind` | When | Example clarification prompt |
|---|---|---|
| `"needs-clarification"` | The resolver detected a partial pattern but is missing a required entity | *"Are you asking about a specific food, or a health benefit you're interested in?"* |
| `"ambiguous"` | Two or more equally plausible intents (e.g. "tell me about iron" — food or nutrient?) | *"Do you mean iron as a nutrient, or a specific food that contains iron?"* |
| `"out-of-scope"` | Intent is clear but no capability covers it (e.g. a write intent, a medical diagnosis) | Existing write-intent guard response is returned unchanged |
| `"unknown"` | Utterance is too short, garbled, or off-topic | *"I'm not sure what you're looking for — could you rephrase?"* |

The write-intent guard in the gateway runs **before** the resolver. The resolver never sees write utterances.

---

## 10. Provider-Neutral Implementation Strategies

### Strategy A — `PatternIntentResolver` (regex/heuristic)

**Mechanism:** A library of compiled `RegExp` patterns paired with routing rules. Each pattern match produces a `ResolvedIntent` with a pre-set confidence score based on match quality.

**Pros:** Zero latency, zero cost, zero external dependency, fully deterministic, easy to unit test.  
**Cons:** Lower recall. Natural language variation means misses. Requires manual pattern maintenance as the app grows.  
**Confidence assignment:** Pattern matches assign fixed confidence levels (exact anchor match → 0.85, keyword-only match → 0.6).

### Strategy B — `LlmIntentResolver` (structured LLM call)

**Mechanism:** A tightly constrained LLM call with a structured system prompt that instructs the model to output only a `ResolvedIntent` JSON object. The model sees the utterance, the registered capability list, and the verb taxonomy — not any business data.

**System prompt outline:**
```
You are a routing classifier for a meal planning assistant.
Your ONLY job is to classify the user's utterance into a structured intent.
You must not answer the question. You must not use nutrition knowledge.
You must only output valid JSON matching the ResolvedIntent schema.

Available capabilities: [nutrition-knowledge, planner, shopping, pantry, diary,
  household, meals, templates, partners, analyser, profile]
Available verbs: [read, explain, search, recommend, suggest]

Output: { "capability": "...", "verb": "...", "parameters": {...}, "confidence": 0.0–1.0 }
If you cannot determine the intent, output: { "gap": { "kind": "...", "clarificationPrompt": "..." }, "confidence": 0.0 }
```

**Pros:** High recall, handles paraphrasing and language variation naturally, scales to new capabilities without pattern authoring.  
**Cons:** ~200–400ms latency per turn (adds to existing LLM call), small incremental cost, non-deterministic (though constrained by JSON mode + low temperature).

### Strategy C — `HybridIntentResolver` (recommended)

**Mechanism:** Tries `PatternIntentResolver` first. If the result has `confidence >= 0.75`, returns it immediately. If confidence is below the threshold, falls back to `LlmIntentResolver`.

**Pros:** Fast path for common, well-formed questions. LLM fallback for unusual phrasings. Cost is low because the pattern resolver handles most traffic.  
**Cons:** Two resolver implementations to maintain.

**Recommended starting point:** Build `PatternIntentResolver` first with coverage for the INT22 nutrition patterns. Add `LlmIntentResolver` as the fallback once baseline coverage is measured.

---

## 11. The Two INT22 Questions — End-to-End Design Trace

### Question 1: "What is broccoli good for?"

```
Utterance: "What is broccoli good for?"
Surface:   floating (no surface-specific primary capability)

─── PatternIntentResolver ───────────────────────────────────────────────
  Pattern match: /what is (.+?) good for/i
  Captured entity: "broccoli"
  Normalized slug: "broccoli"
  Intent signal: food-benefits
  Route:
    capability: "nutrition-knowledge"
    verb:       "explain"
    parameters: { foodSlug: "broccoli" }
    confidence: 0.90

─── Gateway ─────────────────────────────────────────────────────────────
  confidence 0.90 ≥ 0.75 → proceed
  Always adds "profile" for personalisation context
  Calls intelligencePlatform.handle({
    verb:         "explain",
    capabilityId: "nutrition-knowledge",
    parameters:   { foodSlug: "broccoli" }
  }, identity)

─── Handler ─────────────────────────────────────────────────────────────
  handleExplain({ foodSlug: "broccoli" })
  → getFoodDetailView("broccoli")         [exists: ✓]
  → getFoodBenefitsForDisplay("broccoli") [returns linked benefits]
  Returns NutritionExplainResult {
    scope: "food-benefits",
    foodName: "Broccoli",
    benefits: [
      { slug: "immune-support",    name: "Immune Support",    description: "..." },
      { slug: "bone-health",       name: "Bone Health",       description: "..." },
      { slug: "digestive-health",  name: "Digestive Health",  description: "..." }
    ]
  }

─── LLM ─────────────────────────────────────────────────────────────────
  Context data includes broccoli benefit descriptions (source-gated).
  System prompt: "Answer ONLY from the CONTEXT DATA provided."
  Model can now answer: "Broccoli is great for immune support, bone health,
  and digestive health — here's why…"

─── Before INT23 ─────────────────────────────────────────────────────────
  Context data: flat list of 47 food names with no benefit data.
  Model: "I don't have that information right now."
```

### Question 2: "Tell me 5 foods that help with sleep"

```
Utterance: "Tell me 5 foods that help with sleep"
Surface:   floating

─── PatternIntentResolver ───────────────────────────────────────────────
  Pattern match: /foods that help with (.+)/i
  Captured entity: "sleep"
  Intent signal: benefit-foods
  Route:
    capability:  "nutrition-knowledge"
    verb:        "search"
    parameters:  { query: "sleep" }
    confidence:  0.82
    termQuery:   "sleep"   ← raw term flagged for slug resolution awareness

─── Gateway ─────────────────────────────────────────────────────────────
  confidence 0.82 ≥ 0.75 → proceed
  Calls intelligencePlatform.handle({
    verb:         "search",
    capabilityId: "nutrition-knowledge",
    parameters:   { query: "sleep" }
  }, identity)

─── Handler ─────────────────────────────────────────────────────────────
  handleSearch({ query: "sleep" })
  → searchKnowledgeRegistry("sleep")
  Returns NutritionSearchResult {
    query: "sleep",
    foods:     [],               ← no food names contain "sleep"
    nutrients: [],
    benefits:  [{ slug: "better-sleep", name: "Better Sleep" }]
  }

─── Gateway (optional V2 follow-up) ─────────────────────────────────────
  Resolver set termQuery → gateway detects a benefit match ("better-sleep")
  Calls a follow-up read:
    { verb: "read", scope: "benefit", slug: "better-sleep" }
  Returns BenefitReadResult {
    scope: "benefit",
    name: "Better Sleep",
    description: "...",
    foods: [
      { slug: "oats",       name: "Oats" },
      { slug: "almonds",    name: "Almonds" },
      { slug: "kiwi",       name: "Kiwi" },
      { slug: "chamomile",  name: "Chamomile" },
      { slug: "turkey",     name: "Turkey" }
    ]
  }

─── LLM ─────────────────────────────────────────────────────────────────
  V1 context: benefit name "Better Sleep" with slug. LLM acknowledges the
  benefit exists and lists slug names (limited but grounded).
  V2 context: full foods list for Better Sleep. LLM answers directly:
  "Here are 5 foods that may support better sleep: Oats, Almonds, Kiwi…"

─── Before INT23 ─────────────────────────────────────────────────────────
  "sleep" matched the diary keyword → diary data added to context.
  nutrition-knowledge not selected.
  Context: diary entries for today (irrelevant).
  Model: "I don't have that information right now."
```

---

## 12. Changes Required in the Gateway

The resolver does not replace the gateway — it replaces two internal functions inside it. The gateway's pipeline, persistence, thread management, write-intent guard, and LLM call are all unchanged.

| Current gateway function | After resolver |
|---|---|
| `selectCapabilities(utterance, surface)` | Removed. Resolver selects the capability. Profile is always appended separately. |
| `buildCapabilityParams(capId, frame)` | Removed. Resolver builds the parameters. |
| `queryCapability(capId, frame)` | Signature changes to `queryCapability(intent: ResolvedIntent, frame)`. Uses `intent.verb` and `intent.parameters` instead of hardcoded `"read"` and scope. |
| Write-intent guard | Unchanged — runs before the resolver. |
| LLM call + system prompt | Unchanged. |
| Turn recording | Unchanged. |
| `CAP_DATA_MAX_CHARS` truncation | Unchanged. |

The hard cap of 4 capabilities per turn (for latency) is preserved: the resolver returns up to 4 `ResolvedIntent` values, and the gateway applies the cap before dispatching.

---

## 13. Files This Design Would Touch

**New files (if implemented):**

| File | Purpose |
|---|---|
| `server/intelligence/conversation/intent-resolver.ts` | `IIntentResolver` interface, `ResolvedIntent`, `ResolverGap` types |
| `server/intelligence/conversation/pattern-intent-resolver.ts` | `PatternIntentResolver` — regex strategy |
| `server/intelligence/conversation/llm-intent-resolver.ts` | `LlmIntentResolver` — LLM strategy (future) |
| `server/intelligence/conversation/hybrid-intent-resolver.ts` | `HybridIntentResolver` — composite strategy |
| `server/tests/test-intent-resolver.ts` | Unit tests (deterministic pattern tests, LLM stub tests) |

**Modified files (if implemented):**

| File | Change |
|---|---|
| `server/intelligence/conversation/conversation-gateway.ts` | Remove `selectCapabilities` + `buildCapabilityParams`. Update `queryCapability` to accept `ResolvedIntent`. Inject `IIntentResolver`. |

**Unchanged files:**

All capability handlers, the Intelligence Platform, the Capability Registry, the Intent Engine, the Context Frame Assembler, all schemas, all routes.

---

## 14. Open Questions

### Q1 — Profile capability
The gateway currently always includes `profile` for personalisation context. The resolver should always append a profile read alongside any resolved intent. Should the resolver return this as a second `ResolvedIntent`, or should the gateway continue to add it as a fixed step? Recommendation: gateway always appends profile separately (keeps profile logic out of the resolver).

### Q2 — Multi-intent turns
Some utterances express two intents: *"What's on my plan this week and what would broccoli add to it nutritionally?"* The resolver should return two `ResolvedIntent` values (planner + nutrition-knowledge). The gateway's existing cap of 4 handles the limit. How should the gateway merge multi-intent context data for the LLM? (Current: one data block per capability — unchanged.)

### Q3 — V2 benefit-to-foods chain
The two-step resolve for "foods that help with sleep" (search → read benefit) is described in section 8. Should the gateway handle this internally when `termQuery` is set and the search result contains a single benefit match? Or should the resolver declare a `resolveChain` instruction? Recommendation: gateway handles it as an optional post-search follow-up, transparent to the resolver.

### Q4 — LLM resolver prompt safety
The `LlmIntentResolver` system prompt instructs the model not to use nutrition knowledge. This is prompting, not enforcement. A safeguard: the resolver validates its output against the registered capability list and verb allow-list before returning — if the LLM produces a capability that does not exist in the registry, the output is treated as `confidence: 0.0` and a gap is returned.

### Q5 — Confidence calibration
The confidence thresholds (0.75 high, 0.45 medium) are proposed values. They need empirical calibration against real user utterances once a resolver is deployed. The thresholds should be externally configurable, not hardcoded.

---

## 15. Summary

The Canonical Intent Resolver is the "PARSE" stage that was explicitly reserved in `types.ts` at INT1. It fills the structural gap INT22 identified in the gateway: the inability to convert a user utterance into the right `(capability, verb, parameters)` triple.

**What it is:**
- A narrow TypeScript interface (`IIntentResolver`) with a single method
- A set of concrete implementations (pattern, LLM, hybrid) behind that interface
- A producer of typed `ResolvedIntent` values consumed by the existing gateway

**What it is not:**
- A second Intelligence Platform
- A source of nutrition facts or business logic
- A replacement for any capability handler or registry entry
- A modification to the LLM grounding system

**The INT22 nutrition questions resolved:**

| Question | Before INT23 | After INT23 |
|---|---|---|
| "What is broccoli good for?" | `verb:"read"` → flat food list → honest gap | `verb:"explain"` → broccoli benefit descriptions → grounded answer |
| "Tell me 5 foods that help with sleep" | `diary` selected; nutrition-knowledge skipped → honest gap | `verb:"search"` → benefit match → V2 follow-up foods list → grounded answer |
