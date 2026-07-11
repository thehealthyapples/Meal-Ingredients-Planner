# INT34 — Conversation Gateway Capability Routing Audit

**Status:** 🔴 RED  
**Date:** 2026-07-01  
**Scope:** End-to-end trace of four live assistant queries through PatternIntentResolver → Conversation Gateway → capability routing → handler execution → LLM response.

---

## Executive Summary

| Query | Routes? | Executes? | Verdict |
|---|---|---|---|
| `show me meals under 400 calories` | ✅ nutrition-discovery/search | ✅ parseNutritionFilter → calorie ceiling | **WORKS** |
| `tell me 5 foods that help with sleep` | ✅ nutrition-knowledge/search | ✅ searchKnowledgeRegistry("sleep") | **WORKS** |
| `show me a past meal` | ❌ no matcher fires | ❌ only profile always-on | **ROUTING FAILURE** |
| `what pasta meals have I got` | ❌ no matcher fires | ❌ only profile always-on | **ROUTING FAILURE** |

Two of the four queries route and execute correctly. Two fail at the PatternIntentResolver step with zero capability data reaching the LLM — the assistant responds "I don't have that information right now."

---

## Architecture Recap (INT18 / INT24)

The full turn pipeline:

```
User utterance
  │
  ▼
[1] ConversationGateway.processUserTurn()
      → detectWriteIntent()          — bail early if write detected
      → assembleContextFrame()       — pointer IDs only
      → record user turn
      → buildGroundedResponse()
          │
          ▼
      [2] PatternIntentResolver.resolve(utterance, hints)
              0. Compound matchers    (confidence 0.80–0.88)
              1. Specific matchers    (confidence 0.70–0.92)
              2. Surface-primary rule (confidence 0.65)
              3. Keyword fallbacks    (confidence 0.55–0.65)
              4. Profile always-on   (confidence 0.50)
              5. Deduplicate by capability (keep highest)
              6. Sort desc, cap at MAX_INTENTS = 4
          │
          ▼
      [3] For each ResolvedIntent (where !intent.gap):
              intelligencePlatform.handle({
                verb:         intent.verb,           ← from resolver, not hardcoded
                capabilityId: intent.capability,
                parameters:   intent.parameters,
              }, ctx)
          │
          ▼
      [4] IntentEngine.route()
              LOCATE  → registry.get(capabilityId)
              VALIDATE → supports(capabilityId, verb)
              PERMISSION → canInvokeCapability(ctx, cap)
              CONFIRM → confirmationFor(cap, verb)
              INVOKE  → handler(intent, ctx)
          │
          ▼
      [5] capData[capability] = JSON.stringify(outcome.result)
                                truncated to 1,800 chars
          │
          ▼
      [6] LLM system prompt: CONTEXT DATA sections
              "Answer ONLY from the CONTEXT DATA provided."
          │
          ▼
      [7] JSON response parsed → { text, entityRefs }
```

---

## Query 1: "show me meals under 400 calories"

### PatternIntentResolver Output

**Step 0 — Compounds:** No compound matcher fires. No planner signal alongside the nutrition signal, so `NUTRITION_DISCOVERY_PLANNER_COMPOUND` does not trigger.

**Step 1 — Specific matchers:** `NUTRITION_DISCOVERY_MATCHERS[0]` fires:

```typescript
// Pattern:
/\b(?:meals?|recipes?|dishes?|something)\s+under\s+\d+\s*(?:kcal|calories?|cals?)\b/i

// Against: "show me meals under 400 calories"
// Match: "meals under 400 calories" ✓
```

Resolved intent emitted:
```json
{
  "capability": "nutrition-discovery",
  "verb": "search",
  "parameters": { "query": "show me meals under 400 calories" },
  "confidence": 0.90
}
```

**Step 4 — Profile always-on:**
```json
{ "capability": "profile", "verb": "read", "parameters": {}, "confidence": 0.50 }
```

**Final resolved set (after dedup + sort + cap 4):**
```
nutrition-discovery  search  0.90
profile              read    0.50
(+ surface-primary if surface maps to a capability)
```

### Gateway — Parameter Building

The gateway calls `queryCapability(ri, frame.identity)` for both intents in parallel:

```typescript
intelligencePlatform.handle({
  verb:         "search",
  capabilityId: "nutrition-discovery",
  parameters:   { query: "show me meals under 400 calories" }
}, identityCtx)
```

### IntentEngine — Route

| Step | Result |
|---|---|
| LOCATE | `nutrition-discovery` found in registry ✓ |
| VALIDATE | `"search"` in `supportedIntents` ✓ |
| PERMISSION | user role ≥ "user" ✓ |
| CONFIRM | read-only — `"none"` ✓ |
| INVOKE | `createNutritionDiscoveryHandler` bound ✓ |

### Handler Execution

`nutrition-discovery-handler.ts`:
1. `readOnlyVerbGuard(intent, ["search"], ...)` — passes ✓
2. `requireUserId(ctx)` — passes ✓
3. `rawQuery = "show me meals under 400 calories"` — non-empty ✓
4. `parseNutritionFilter("show me meals under 400 calories")`:

```typescript
// Pattern tested:
/\b(?:under|less\s+than|below|no\s+more\s+than|max(?:imum)?)\s+(\d+)\s*(?:kcal|calories?|cals?)/i
// → matches "under 400 calories" → caloriesMax = 400 ✓
```

Returns `NutritionFilter { caloriesMax: 400 }`.

5. `NutritionDiscoveryEngine.discover({ caloriesMax: 400 }, userId)` runs:
   - Fetches personal + system meals with nutrition rows via port
   - Parses text-stored macro columns using `parseMacroText()`
   - Applies `calories ≤ 400` predicate
   - Returns up to `NUTRITION_DISCOVERY_MAX_RESULTS = 15` matches

### Final Assistant Response

LLM context section:
```
### nutrition-discovery
{ "scope": "nutrition-filter", "filter": { "caloriesMax": 400 }, "totalCount": N, "results": [...] }
```

LLM formats a warm, grounded list of meals from context.

**Verdict: WORKS** — full pipeline executes. Quality depends on how many of the user's meals have nutrition rows with parseable calorie values. Meals without nutrition data are counted in `mealsWithoutNutritionCount` and excluded from results.

---

## Query 2: "tell me 5 foods that help with sleep"

### PatternIntentResolver Output

**Step 0 — Compounds:** No compound matcher fires.

**Step 1 — Specific matchers:** `NUTRITION_BENEFIT_FOODS_MATCHERS[2]` fires:

```typescript
// Pattern:
/\btell\s+me\s+(?:\d+|five|ten|some)\s+foods?\s+(?:that\s+)?(?:help|support|aid)\s+(?:with\s+)?(.+?)[\?.,]?\s*$/i

// Against: "tell me 5 foods that help with sleep"
//   "tell me"   ✓
//   "5"         matches \d+  ✓
//   "foods"     matches foods? ✓
//   "that help" matches (?:that\s+)?(?:help|support|aid) ✓
//   "with sleep" → captured entity = "sleep" ✓
```

`benefitSearch("sleep", 0.88)` is called:
```json
{
  "capability": "nutrition-knowledge",
  "verb": "search",
  "parameters": { "query": "sleep" },
  "confidence": 0.88
}
```

Note: `NUTRITION_NUTRIENT_MATCHERS[0]` (`tell me about X`) does NOT fire — the phrase is "tell me 5 foods that help with sleep", not "tell me about sleep".

**Final resolved set:**
```
nutrition-knowledge  search  0.88
profile              read    0.50
```

### Gateway — Parameter Building

```typescript
intelligencePlatform.handle({
  verb:         "search",
  capabilityId: "nutrition-knowledge",
  parameters:   { query: "sleep" }
}, identityCtx)
```

### IntentEngine — Route

| Step | Result |
|---|---|
| LOCATE | `nutrition-knowledge` found ✓ |
| VALIDATE | `"search"` in `supportedIntents` ✓ |
| PERMISSION | ✓ |
| CONFIRM | `"none"` ✓ |
| INVOKE | `createNutritionKnowledgeReadHandler` bound, `"search"` in `NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS` ✓ |

### Handler Execution

`nutrition-knowledge-read-handler.ts` → `handleSearch`:
1. `query = toSlug("sleep")` → `"sleep"`
2. `port.searchKnowledgeRegistry("sleep")` → searches food registry by slug/name for benefits, foods, and nutrients matching "sleep"
3. Returns `{ query: "sleep", foods: [...], nutrients: [...], benefits: [...] }`

### Final Assistant Response

LLM context section contains the knowledge registry matches for "sleep". The LLM formats up to the requested count (5) from the returned foods list.

**Verdict: WORKS** — routing and execution are correct. Quality depends on whether "sleep" (as a benefit slug or name) is populated in the nutrition knowledge registry. If the registry has no entries linked to "sleep", the handler returns empty arrays and the LLM responds "I don't have that information right now" — which is the correct honest gap, not a routing failure.

---

## Query 3: "show me a past meal"

### PatternIntentResolver Output

**Step 0 — Compounds:** No compound matcher fires.

**Step 1 — Specific matchers:** Exhaustive trace — every matcher block tested:

| Matcher block | Reason for no-match |
|---|---|
| `NUTRITION_NUTRIENT_MATCHERS` | No nutrient vocabulary term present |
| `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` | No benefit vocabulary; no "tell me about" |
| `NUTRITION_EXPLAIN_MATCHERS` | Requires "what is X good for?", "benefits of X", "is X good for me?", "why is X healthy?", "what does X do for your body?" — none match |
| `NUTRITION_BENEFIT_FOODS_MATCHERS` | Requires "foods that help with X" structure — no match |
| `NUTRITION_FOOD_DETAIL_MATCHERS` | Requires "nutrients in X", "nutritional value of X" — no match |
| `NUTRITION_GENERAL_EXPLAIN_MATCHERS` | Requires "tell me about X", "I want to know about X", "give me information on X" — no match |
| `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` | Requires "search for X", "look up X", "find information about X" — no match |
| `NUTRITION_DISCOVERY_MATCHERS` | Requires numeric calorie/macro values or qualitative terms (high-protein, low-carb etc.) — no match |
| `PLANNER_DISCOVERY_MATCHERS` | Requires "search my plan for", "find X in my plan", "is X planned", "look for X in my planner", "do I have X planned" — no match |
| `HOUSEHOLD_DISCOVERY_MATCHERS` | Requires household vocabulary — no match |
| `SHOPPING_DISCOVERY_MATCHERS` | Requires shopping list vocabulary — no match |
| `PANTRY_DISCOVERY_MATCHERS` | Requires pantry/fridge vocabulary — no match |
| `DIARY_DISCOVERY_MATCHERS` | Requires "diary", "what have I eaten", "show me my diary", "have I eaten X", "did I eat X" — no match |
| `PLANNER_MATCHERS` | Requires "what's on my meal plan", "show me my plan" — no match |
| `SHOPPING_MATCHERS` | Requires "show my shopping list" / "what's in my basket" — no match |
| `PANTRY_MATCHERS` | Requires "what's in my pantry/fridge/freezer" — no match |
| `DIARY_MATCHERS` | Requires "what did I eat today?", "my food diary", "show my diary" — no match |
| `HOUSEHOLD_MATCHERS` | Requires "who's in my household/family" — no match |
| `MEAL_DISCOVERY_MATCHERS` | Requires "find me a recipe for X", "search for X recipe", "look up X dish/meal", "find/show/give me a X recipe", "what can I cook with X?", "something with X" — **"show me a past meal" does not match any of these** |
| `MEALS_MATCHERS[0]` | Requires "search my meals for X" — no match |
| `MEALS_MATCHERS[1]` | Pattern: `\b(?:do\s+i\s+have\|have\s+i\s+got)\s+(?:any\s+)?(.+?)\s+(?:meals?\|recipes?\|dishes?)\b` — requires the verb phrase to precede the noun. "show me a past meal" has none of "do I have" / "have I got" |
| `TEMPLATES_MATCHERS` | Requires "templates" vocabulary — no match |
| `ANALYSER_MATCHERS` | Requires UPF/additive vocabulary — no match |
| `PARTNERS_MATCHERS` | Requires retailer/supermarket vocabulary — no match |

**Step 2 — Surface-primary:** If the user is on the `meals` surface:
```json
{ "capability": "meals", "verb": "read", "parameters": { "scope": "list" }, "confidence": 0.65 }
```
If on any other surface (home, planner, diary, etc.): the surface cap maps to that capability, or no surface cap applies.

**Step 3 — Keyword fallbacks:**

```typescript
// The meals keyword fallback:
{ pattern: /\b(?:recipe|cook|dish|ingredient)\b/i, capability: "meals", ... }

// "show me a past meal" — "meal" is NOT in this pattern.
// "meal" has NO keyword fallback anywhere in KEYWORD_FALLBACKS.
```

**→ No keyword fallback fires. "meal" and "meals" are absent from every keyword fallback entry.**

**Step 4 — Profile always-on:**
```json
{ "capability": "profile", "verb": "read", "parameters": {}, "confidence": 0.50 }
```

**Final resolved set (on meals surface):**
```
meals    read  { scope: "list" }  0.65   ← returns ALL user meals, unfiltered
profile  read  {}                 0.50
```

**Final resolved set (on any other surface):**
```
profile  read  {}  0.50   ← only personalisation context
(possibly a surface-primary for the active page)
```

### Gateway — Capability Execution

The `meals` read at `scope: "list"` returns the user's entire meals library — there is no "past meal" filter. The LLM receives a complete, unordered meal list and is told to answer only from context. It cannot determine which meals are "past" because there is no temporal ordering or diary linkage in the meals list response.

### Final Assistant Response

If on meals surface: LLM receives a meals list with no temporal filter. It may attempt to answer but cannot identify "past" meals from an unordered library listing.

If on any other surface: LLM context is `(No specific data was retrieved for this query.)` and responds "I don't have that information right now."

**Verdict: ROUTING FAILURE**

The root failure is in the PatternIntentResolver. "Show me a past meal" contains:
- `show me` — a display verb used in many meal discovery contexts, but only covered in `MEAL_DISCOVERY_MATCHERS[2]` when followed by `a X recipe` (not `a X meal`)
- `past meal` — a temporal reference to diary or planner history with no dedicated matcher
- `meal` — present in the utterance but absent from keyword fallbacks

The intended target capability is ambiguous between:
1. **diary-discovery** — if "past meal" means something previously logged in the food diary
2. **meals** (`verb: search`) — if "past meal" means a recipe in the user's cookbook
3. **planner-discovery** — if "past meal" means something previously planned

No matcher covers the `show me a [adjective] meal` phrasing where `meal` is the terminal noun without `recipe`.

---

## Query 4: "what pasta meals have I got"

### PatternIntentResolver Output

**Step 0 — Compounds:** No compound matcher fires.

**Step 1 — Specific matchers:** The most likely intended matcher is `MEALS_MATCHERS[1]`:

```typescript
// Pattern:
/\b(?:do\s+i\s+have|have\s+i\s+got)\s+(?:any\s+)?(.+?)\s+(?:meals?|recipes?|dishes?)\b/i

// Expected match: captures "X" in "do I have/have I got any? X meals/recipes/dishes"
// This requires the verb phrase BEFORE the subject noun.
```

Testing against "what pasta meals have I got":

```
"what pasta meals have I got"
         ↑            ↑
     noun first    verb last
```

The regex requires `have\s+i\s+got` followed by `(any? X meals/recipes/dishes)`. In this utterance "have I got" appears at the **end** with nothing following it. The regex does not match inverted SOV/OVS word order.

All other matcher blocks: same result as Query 3 — no match (exhaustive trace omitted, same reasoning applies).

**Step 2 — Surface-primary:** same as Query 3.

**Step 3 — Keyword fallbacks:**

```
"what pasta meals have I got"
  "pasta" — no keyword match
  "meals" — NOT in keyword fallbacks (only "recipe|cook|dish|ingredient")
```

**Both failures compound:**
1. `MEALS_MATCHERS[1]` uses SVO order: `have I got [any] X meals` — it does not cover inverted OVS: `X meals have I got`
2. `KEYWORD_FALLBACKS` for the `meals` capability uses `/\b(?:recipe|cook|dish|ingredient)\b/i` — the word "meal/meals" is absent

**Step 4 — Profile always-on:**
```json
{ "capability": "profile", "verb": "read", "confidence": 0.50 }
```

**Final resolved set:**
```
profile  read  0.50   ← only personalisation context
(+ surface-primary if applicable)
```

### Final Assistant Response

The LLM context contains no meals search result. It cannot answer "what pasta meals have I got."

**Verdict: ROUTING FAILURE**

Two independent gaps compound:

**Gap A — Pattern word-order constraint:** `MEALS_MATCHERS[1]` only matches SVO phrasing (`have I got any pasta meals`). Natural British English frequently inverts to `pasta meals have I got` or `what pasta meals have I got` — the pattern never fires.

**Gap B — Keyword fallback omission:** The keyword fallback for the `meals` capability is `/\b(?:recipe|cook|dish|ingredient)\b/i`. The word "meal" and "meals" are absent. Any query that uses "meal/meals" as the primary noun without a specific pattern match falls through with zero capability coverage.

---

## Failure Classification

### Failure 1 — "show me a past meal"

| Layer | Status | Detail |
|---|---|---|
| Write-intent guard | ✅ pass | Not a write intent |
| PatternIntentResolver | ❌ **MISS** | No matcher covers `show me a [adj/noun] meal` |
| Keyword fallback | ❌ **MISS** | "meal" absent from keyword table |
| Gateway parameter build | ❌ n/a | No capability intent to build |
| Capability execution | ❌ n/a | No capability invoked |
| Handler result | ❌ n/a | No data returned |
| LLM response | ❌ empty context | "I don't have that information right now" |

**Root cause:** Resolver. `MEAL_DISCOVERY_MATCHERS[2]` covers `show me a X recipe` but not `show me a X meal`. The terminal noun `meal` is not in the pattern. No separate matcher for `show me a [adjective] meal` phrasing exists.

**Secondary root cause:** Keyword fallback. `meals` keyword entry misses `meal/meals` as trigger words.

### Failure 2 — "what pasta meals have I got"

| Layer | Status | Detail |
|---|---|---|
| Write-intent guard | ✅ pass | Not a write intent |
| PatternIntentResolver | ❌ **MISS** | `MEALS_MATCHERS[1]` requires SVO; utterance is OVS |
| Keyword fallback | ❌ **MISS** | "meals" absent from keyword table |
| Gateway parameter build | ❌ n/a | No capability intent to build |
| Capability execution | ❌ n/a | No capability invoked |
| Handler result | ❌ n/a | No data returned |
| LLM response | ❌ empty context | "I don't have that information right now" |

**Root cause:** Resolver. `MEALS_MATCHERS[1]` pattern `\b(?:do\s+i\s+have|have\s+i\s+got)\s+(?:any\s+)?(.+?)\s+(?:meals?|recipes?|dishes?)\b` places the verb phrase before the subject. "what pasta meals have I got" reverses the order — verb phrase follows the noun.

**Secondary root cause:** Keyword fallback. Same omission as Failure 1.

---

## Working Queries — Confirmation

### Query 1: "show me meals under 400 calories" — WORKS

```
PatternIntentResolver
  NUTRITION_DISCOVERY_MATCHERS[0] → nutrition-discovery/search  conf:0.90

IntentEngine
  LOCATE    nutrition-discovery ✓
  VALIDATE  "search" ∈ supportedIntents ✓
  INVOKE    createNutritionDiscoveryHandler ✓

Handler
  parseNutritionFilter("show me meals under 400 calories") → { caloriesMax: 400 }
  NutritionDiscoveryEngine.discover({ caloriesMax: 400 }, userId)
  → NutritionDiscoverySearchResult { scope: "nutrition-filter", results: [...] }

LLM
  Context: meals filtered by ≤400 kcal
  Response: grounded list
```

### Query 2: "tell me 5 foods that help with sleep" — WORKS

```
PatternIntentResolver
  NUTRITION_BENEFIT_FOODS_MATCHERS[2] → nutrition-knowledge/search  conf:0.88
  entity captured: "sleep"
  parameters: { query: "sleep" }

IntentEngine
  LOCATE    nutrition-knowledge ✓
  VALIDATE  "search" ∈ executableIntents ["read","search","explain"] ✓
  INVOKE    createNutritionKnowledgeReadHandler ✓

Handler
  handleSearch → toSlug("sleep") = "sleep"
  port.searchKnowledgeRegistry("sleep")
  → { foods: [...], nutrients: [...], benefits: [...] }

LLM
  Context: knowledge registry results for "sleep"
  Response: grounded list of foods (count request "5" passed as natural language to LLM)
```

---

## Precise Gap Locations for Implementation

### Gap G1 — `show me a past meal`

**File:** `server/intelligence/pattern-intent-resolver.ts`  
**Affected block:** `MEAL_DISCOVERY_MATCHERS`

**Missing pattern:** `show me a [adjective|qualifier] meal` — the terminal noun `meal` (singular) is not covered by any matcher. `MEAL_DISCOVERY_MATCHERS[2]` covers `show me a X recipe` but the equivalent with `meal` as the terminal noun is absent.

**Also missing:** Any temporal qualifier ("past", "recent", "last", "old") that would route to diary-discovery rather than meal-discovery.

**Keyword fallback gap:** `KEYWORD_FALLBACKS` entry for `meals` capability uses pattern `/\b(?:recipe|cook|dish|ingredient)\b/i`. "meal" and "meals" are not present.

---

### Gap G2 — `what pasta meals have I got`

**File:** `server/intelligence/pattern-intent-resolver.ts`  
**Affected block:** `MEALS_MATCHERS[1]`

**Current pattern (SVO only):**
```typescript
/\b(?:do\s+i\s+have|have\s+i\s+got)\s+(?:any\s+)?(.+?)\s+(?:meals?|recipes?|dishes?)\b/i
```

**Missing OVS pattern variants:**
- `what [X] meals have I got`
- `what [X] meals do I have`
- `[X] meals have I got`
- `which [X] meals have I got`

**Keyword fallback gap:** same as G1 — `meal/meals` absent from the keyword fallback for the `meals` capability.

---

## Scope of Implementation Required

Neither failure requires:
- Changes to the Conversation Gateway
- Changes to the IntentEngine
- Changes to any capability handler
- Changes to any port or binding
- Schema changes

Both failures require only changes to `PatternIntentResolver` matcher arrays and/or keyword fallbacks in `server/intelligence/pattern-intent-resolver.ts`.

Specifically:

1. Add OVS word-order variants to `MEALS_MATCHERS[1]` (or add a new matcher in the same block) to cover `what X meals have I got` / `what X meals do I have` / `which X meals have I got`
2. Add `meal|meals` to the keyword fallback pattern for the `meals` capability
3. Add a matcher in `MEAL_DISCOVERY_MATCHERS` for `show me a [adjective|qualifier] meal` — routing to `meal-discovery/search` with the qualifier as the query string
4. Optionally: add temporal qualifier recognition (`past`, `recent`, `last time I made`) that routes `show me a past meal` toward `diary-discovery/search` rather than `meal-discovery/search`, since "past" implies something already eaten rather than a recipe to discover

The fix is confined to a single file. No handler, binding, engine, or gateway changes are needed.
