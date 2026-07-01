# INT26 — Nutrition Knowledge Discovery: Investigation

**Date:** 2026-07-01  
**Status:** Investigation complete. No implementation performed.  
**Scope:** Activation of the existing `nutrition-knowledge` binding's discovery surface — pattern matcher gaps, handler coverage, routing correctness, and recommended additions.  
**Relates to:** INT4 (nutrition-knowledge binding), INT22 (grounding investigation), INT26 Nutrition Discovery (separate capability for macro-filtered meal search)

---

## 1. Framing

"Nutrition Knowledge Discovery" is the ability of the Intelligence Platform to answer questions about **food facts, nutrients, and health benefits** using the source-gated knowledge graph.

Examples:

> *"What is broccoli good for?"*  
> *"Tell me about vitamin C."*  
> *"What foods are good for immunity?"*  
> *"What does iron do?"*  
> *"What are good sources of omega-3?"*  

These questions are already owned by the existing `nutrition-knowledge` capability (INT4). The binding is live, its handler implements `read`, `search`, and `explain` verbs, and those verbs delegate to `nutrition-knowledge-registry.ts` — a source-gated knowledge graph over the `knowledge_*` tables (WS0).

**The question this investigation answers:** Are there routing gaps that prevent the platform from reaching the right verb and scope, and if so, what changes are required?

---

## 2. What Already Exists and Works

### 2a. Binding — INT4 (live)

| Item | Value |
|---|---|
| Capability ID | `nutrition-knowledge` |
| Executable intents | `read`, `search`, `explain` |
| Gap intents (honest) | `analyse`, `compare`, `report` |
| Handler | `nutrition-knowledge-read-handler.ts` |
| Port | `nutrition-knowledge-read-port.ts` → `nutrition-knowledge-registry.ts` |

The handler's three live verbs:

| Verb | Parameters required | Delegates to |
|---|---|---|
| `read` | `{ scope: "food", slug }` | `port.getFoodDetailView(slug)` |
| `read` | `{ scope: "nutrient", slug }` | `port.getNutrientDetailView(slug)` |
| `read` | `{ scope: "benefit", slug }` | `port.getBenefitDetailView(slug)` |
| `read` | `{ scope: "categories" }` | `port.listFoodCategories()` |
| `read` | `{ scope: "foods", category? }` | `port.listFoodCards(category)` |
| `search` | `{ query }` | `port.searchKnowledgeRegistry(query)` — unified search across foods, nutrients, and benefits |
| `explain` | `{ foodSlug }` | `port.getFoodDetailView(slug)` + `port.getFoodBenefitsForDisplay(slug)` |
| `explain` | `{ benefitSlug }` | `port.getBenefitDetailView(slug)` — returns the benefit's linked foods |
| `explain` | `{ foodSlug, benefitSlug }` | Verifies the specific (food, benefit) link exists in the owner |

### 2b. Pattern Matchers — already in `pattern-intent-resolver.ts`

Three matcher arrays are already registered in `ALL_SPECIFIC_MATCHERS`:

**`NUTRITION_EXPLAIN_MATCHERS`** (6 patterns, verb: `explain`) — correctly routes food-benefit queries:

| Pattern | Example | Routed as |
|---|---|---|
| `what is X good/useful/helpful for?` | "what is broccoli good for?" | `explain { foodSlug: "broccoli" }` |
| `what are the benefits of X?` | "what are the benefits of oats?" | `explain { foodSlug: "oats" }` |
| `(health) benefits of X` | "health benefits of spinach" | `explain { foodSlug: "spinach" }` |
| `is X good/healthy/beneficial for?` | "is salmon good for you?" | `explain { foodSlug: "salmon" }` |
| `why is X healthy/nutritious?` | "why is kale healthy?" | `explain { foodSlug: "kale" }` |
| `what does X do for your body?` | "what does broccoli do for you?" | `explain { foodSlug: "broccoli" }` |

**`NUTRITION_BENEFIT_FOODS_MATCHERS`** (5 patterns, verb: `search`) — correctly routes benefit→foods queries:

| Pattern | Example | Routed as |
|---|---|---|
| `foods that help with X` | "foods that help with sleep" | `search { query: "sleep" }` |
| `N foods that help/support X` | "5 foods that help with digestion" | `search { query: "digestion" }` |
| `tell me N foods that help with X` | "tell me 5 foods that help with energy" | `search { query: "energy" }` |
| `foods good for X` | "foods good for immunity" | `search { query: "immunity" }` |
| `what helps/aids/supports with X?` | "what helps with sleep?" | `search { query: "sleep" }` |

**`NUTRITION_FOOD_DETAIL_MATCHERS`** (4 patterns, verb: `read`) — correctly routes nutrient-detail queries for foods:

| Pattern | Example | Routed as |
|---|---|---|
| `what nutrients does X have?` | "what nutrients does broccoli have?" | `read { scope: "food", slug: "broccoli" }` |
| `nutrients in X` | "nutrients in spinach" | `read { scope: "food", slug: "spinach" }` |
| `nutritional value/content/profile of X` | "nutritional value of salmon" | `read { scope: "food", slug: "salmon" }` |
| `what's in X nutritionally?` | "what's in kale nutritionally?" | `read { scope: "food", slug: "kale" }` |

**Keyword fallback** (confidence 0.58):  
Pattern `/\b(?:nutrients?|vitamins?|minerals?|nutrition(?:al)?|(?:health\s+)?benefits?)\b/i` → `nutrition-knowledge` `read { scope: "foods" }`.  
This catches broad vocabulary terms but always resolves to a flat food-name list — not a useful discovery response.

---

## 3. Gap Analysis — What Is Not Covered

### Gap 1 — Nutrient-specific queries: no `read { scope: "nutrient" }` matcher

The handler supports `read { scope: "nutrient", slug }` and delegates to `getNutrientDetailView(slug)` — which returns the nutrient's description, the foods that contain it, and the health benefits it links to. **No pattern matcher routes to this scope.**

| Unmatched utterance | Expected route | Actual route |
|---|---|---|
| "tell me about vitamin C" | `read { scope: "nutrient", slug: "vitamin-c" }` | Keyword fallback → `read { scope: "foods" }` (flat list, useless) |
| "what is iron?" | `read { scope: "nutrient", slug: "iron" }` | Keyword fallback → `read { scope: "foods" }` |
| "what does zinc do?" | `read { scope: "nutrient", slug: "zinc" }` | Misfire: `NUTRITION_EXPLAIN_MATCHERS` "what does X do for…" only triggers on "…for your body/you/me" — "what does zinc do?" alone is unmatched → keyword fallback |
| "explain omega-3 to me" | `read { scope: "nutrient" }` or `search` | No match → keyword fallback |
| "what are good sources of iron?" | `search { query: "iron" }` | Partially caught by `NUTRITION_BENEFIT_FOODS_MATCHERS` `"what helps with iron?"` — but "good sources of" does not match any benefit-foods pattern. Falls to keyword fallback |

**Root cause:** No `NUTRITION_NUTRIENT_MATCHERS` array exists. The `read { scope: "nutrient" }` code path in the handler has never been reachable from natural-language input.

---

### Gap 2 — Benefit-specific queries: no `read { scope: "benefit" }` or `explain { benefitSlug }` matcher

The handler supports `read { scope: "benefit", slug }` (returns the benefit's linked foods) and `explain { benefitSlug }` (same data via the explain path). **No matcher targets either.**

| Unmatched utterance | Expected route | Actual route |
|---|---|---|
| "tell me about the immunity benefit" | `explain { benefitSlug: "immunity" }` | No match → no route |
| "what is bone health?" | `read { scope: "benefit", slug: "bone-health" }` | No match → no route |
| "explain heart health" | `explain { benefitSlug: "heart-health" }` | No match → no route |
| "what is the energy benefit?" | `explain { benefitSlug: "energy" }` | Keyword fallback → `read { scope: "foods" }` (contains "energy" keyword — wrong capability keyword match misses it actually; no match at all) |

---

### Gap 3 — General "tell me about X" / "what is X?" food queries

The `NUTRITION_EXPLAIN_MATCHERS` covers "what is X **good for**?" but does NOT cover:

| Unmatched utterance | Expected route | Actual route |
|---|---|---|
| "tell me about broccoli" | `explain { foodSlug: "broccoli" }` | No specific match; keyword fallback if "nutrients/benefits" present, else no route |
| "what is kale?" | `explain { foodSlug: "kale" }` or `read { scope: "food", slug: "kale" }` | No match — "what is X?" alone is not covered |
| "can you explain spinach to me?" | `explain { foodSlug: "spinach" }` | No match |
| "I want to know about oats" | `explain { foodSlug: "oats" }` | No match |
| "give me information on salmon" | `read { scope: "food", slug: "salmon" }` | No match |

---

### Gap 4 — Knowledge search (unified): no `search { query: X }` matcher for open lookups

`searchKnowledgeRegistry(query)` performs a unified case-insensitive search across foods, nutrients, and benefits — it is the most versatile discovery method, returning matches from all three entity types in one call. No matcher routes to it for general "look up X" or "search for X" queries.

| Unmatched utterance | Expected route | Actual route |
|---|---|---|
| "search for vitamin C" | `search { query: "vitamin c" }` | No match → keyword fallback → `read { scope: "foods" }` |
| "look up omega-3" | `search { query: "omega-3" }` | No match → no route |
| "find information about iron" | `search { query: "iron" }` | No match → no route |
| "what do you know about broccoli?" | `search { query: "broccoli" }` | No match → no route |

---

### Gap 5 — "Foods rich in / high in" nutrient queries

"Foods rich in vitamin C", "foods high in iron", "what foods contain omega-3?" — these are nutrient-centric discovery queries that should route to `search { query: "vitamin c" }` (the unified search will surface the nutrient and its linked foods). No matcher covers this pattern family.

| Unmatched utterance | Expected route |
|---|---|
| "foods rich in vitamin C" | `search { query: "vitamin c" }` |
| "foods high in iron" | `search { query: "iron" }` |
| "what foods contain omega-3?" | `search { query: "omega-3" }` |
| "where do I get protein from?" | `search { query: "protein" }` |

---

### Gap 6 — Accidental misfire: nutrient names through food-explain patterns

The `NUTRITION_EXPLAIN_MATCHERS` "what are the benefits of X?" pattern successfully captures **"what are the benefits of vitamin C?"** and routes it to `explain { foodSlug: "vitamin-c" }`. But `"vitamin-c"` is NOT a food slug — it is a nutrient slug. The handler calls `port.getFoodDetailView("vitamin-c")`, finds nothing, and returns an honest gap:

> *"Honest gap: the Nutrition / Knowledge owner has no food recorded for slug 'vitamin-c'."*

The user receives a gap when the correct answer exists — it requires routing to `read { scope: "nutrient", slug: "vitamin-c" }` or `search { query: "vitamin c" }` instead.

**This is the most important misfire.** It means queries phrased as food-benefit questions about nutrient names produce honest gaps rather than the right answer, despite the data existing in the knowledge graph.

---

## 4. No New Capability Required

All of the above gaps can be resolved within the **existing `nutrition-knowledge` binding**. The handler already implements every needed verb and scope. The port already exposes every needed registry method. Nothing in the architecture or the capability registry needs to change.

**What needs to change:**

1. New pattern matcher arrays added to `pattern-intent-resolver.ts`, targeting the existing `nutrition-knowledge` capability.
2. One routing refinement to prevent nutrient names from being misrouted through food-explain paths.
3. No changes to the handler, port, registry, schema, or capability registry.

---

## 5. Proposed Pattern Matchers

### 5a. `NUTRITION_NUTRIENT_MATCHERS` (new) — verb: `read { scope: "nutrient" }` / `search`

```
Target questions:
- "tell me about vitamin C"
- "what is iron?"
- "what does zinc do?"
- "explain omega-3"
- "I want to know about protein"
```

**Routing strategy:** Extract the entity name, apply a `KNOWN_NUTRIENT_TERMS` guard (a set of canonical nutrient name fragments: `vitamin`, `mineral`, `iron`, `zinc`, `calcium`, `omega`, `protein`, `fibre`, `fiber`, `magnesium`, `potassium`, `selenium`, etc.) to prevent food names from being captured by this matcher, then route to `read { scope: "nutrient", slug: normalised-entity }`.

| Pattern | Example | Route |
|---|---|---|
| `tell me about [nutrient]` | "tell me about vitamin C" | `read { scope: "nutrient", slug: "vitamin-c" }` |
| `what is [nutrient]?` (with nutrient guard) | "what is iron?" | `read { scope: "nutrient", slug: "iron" }` |
| `what does [nutrient] do?` | "what does zinc do?" | `read { scope: "nutrient", slug: "zinc" }` |
| `explain [nutrient]` | "explain omega-3" | `read { scope: "nutrient", slug: "omega-3" }` |
| `what are good sources of [nutrient]` | "what are good sources of iron?" | `search { query: "iron" }` |
| `foods rich in / foods high in / foods containing [nutrient]` | "foods rich in vitamin D" | `search { query: "vitamin-d" }` |
| `where do I get [nutrient] from?` | "where do I get iron from?" | `search { query: "iron" }` |

**`KNOWN_NUTRIENT_TERMS` guard prevents misfire:** Foods like "iron fish" or "protein balls" (meal names) must not be captured. The guard tests that the entity contains a known nutrient fragment before routing.

---

### 5b. `NUTRITION_GENERAL_EXPLAIN_MATCHERS` (new) — verb: `explain` / `read { scope: "food" }`

```
Target questions:
- "tell me about broccoli"
- "what is kale?"
- "can you explain spinach?"
- "what do you know about oats?"
- "give me information on salmon"
```

These route to `explain { foodSlug: entity }` (which surfaces all the food's benefits and nutrients from the owner). No nutrient-name guard is needed here because `NUTRITION_NUTRIENT_MATCHERS` is placed first in `ALL_SPECIFIC_MATCHERS` and will intercept nutrient-named entities before this array runs.

| Pattern | Example | Route |
|---|---|---|
| `tell me about [food]` | "tell me about broccoli" | `explain { foodSlug: "broccoli" }` |
| `what is [food]?` (lower confidence) | "what is kale?" | `explain { foodSlug: "kale" }` |
| `explain [food] to me` | "explain spinach to me" | `explain { foodSlug: "spinach" }` |
| `I want to know about [food]` | "I want to know about oats" | `explain { foodSlug: "oats" }` |
| `give me information on [food]` | "give me information on salmon" | `read { scope: "food", slug: "salmon" }` |
| `what do you know about [food]?` | "what do you know about broccoli?" | `search { query: "broccoli" }` |

---

### 5c. `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` (new) — verb: `explain { benefitSlug }` / `read { scope: "benefit" }`

```
Target questions:
- "tell me about immunity"
- "what is bone health?"
- "explain heart health"
- "what is the energy benefit?"
```

A `KNOWN_BENEFIT_TERMS` guard (containing: `immunity`, `bone health`, `heart`, `digestion`, `energy`, `sleep`, `skin`, `mood`, `inflammation`, `antioxidant`, `brain`, `eye`) prevents food names from being misrouted as benefit slugs.

| Pattern | Example | Route |
|---|---|---|
| `tell me about [benefit]` (with guard) | "tell me about immunity" | `explain { benefitSlug: "immunity" }` |
| `what is [benefit]?` (with guard) | "what is bone health?" | `explain { benefitSlug: "bone-health" }` |
| `explain [benefit]` (with guard) | "explain heart health" | `explain { benefitSlug: "heart-health" }` |

---

### 5d. `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` (new) — verb: `search { query }`

General lookup queries where the user is explicitly searching the knowledge graph without specifying a food/nutrient/benefit context:

| Pattern | Example | Route |
|---|---|---|
| `search (nutrition/knowledge) for X` | "search for vitamin C" | `search { query: "vitamin c" }` |
| `look up X (in nutrition)` | "look up omega-3" | `search { query: "omega-3" }` |
| `find information about X` | "find information about iron" | `search { query: "iron" }` |
| `what do you know about X in nutrition?` | "what do you know about broccoli nutritionally?" | `search { query: "broccoli" }` |

These have lower confidence (0.70–0.75) because `"search for X"` and `"find information about X"` are ambiguous without a nutrition signal. The patterns must require either an explicit nutrition/knowledge/food/vitamin/mineral word or be guarded to only fire when the entity matches either `KNOWN_NUTRIENT_TERMS` or `KNOWN_BENEFIT_TERMS`.

---

### 5e. Routing refinement — prevent nutrient misfire through `NUTRITION_EXPLAIN_MATCHERS`

The pattern `"what are the benefits of X?"` in `NUTRITION_EXPLAIN_MATCHERS` currently routes ALL entities to `explain { foodSlug: X }`. When X is a nutrient name (e.g. "vitamin C", "omega-3", "iron"), this produces a gap because the food detail view does not contain those slugs.

**Fix:** Add a `KNOWN_NUTRIENT_TERMS` check to the `foodExplain()` helper — if the entity matches a nutrient name, fall through and allow `NUTRITION_NUTRIENT_MATCHERS` to capture it instead.

This is a targeted guard inside `foodExplain()`, not a structural change to the handler.

---

## 6. Matcher Priority Order

The new arrays must be placed in `ALL_SPECIFIC_MATCHERS` as follows:

```ts
const ALL_SPECIFIC_MATCHERS: Matcher[] = [
  ...NUTRITION_EXPLAIN_MATCHERS,          // existing (with nutrient misfire guard added)
  ...NUTRITION_NUTRIENT_MATCHERS,         // NEW — intercepts nutrient queries before general explain
  ...NUTRITION_BENEFIT_EXPLAIN_MATCHERS,  // NEW — intercepts benefit queries
  ...NUTRITION_BENEFIT_FOODS_MATCHERS,    // existing
  ...NUTRITION_FOOD_DETAIL_MATCHERS,      // existing
  ...NUTRITION_GENERAL_EXPLAIN_MATCHERS,  // NEW — broad "tell me about X" fallback (lower confidence)
  ...NUTRITION_KNOWLEDGE_SEARCH_MATCHERS, // NEW — explicit search (lowest confidence)
  ...PLANNER_MATCHERS,
  // ... rest unchanged
];
```

Priority rationale:
- `NUTRITION_EXPLAIN_MATCHERS` first — highest confidence, most specific food-benefit patterns (0.84–0.90).
- `NUTRITION_NUTRIENT_MATCHERS` second — intercepts nutrient entities before they can misfire through general explain (0.82–0.88).
- `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` third — intercepts benefit entities before general explain (0.82–0.86).
- `NUTRITION_BENEFIT_FOODS_MATCHERS` fourth — benefit→foods search patterns (0.80–0.88).
- `NUTRITION_FOOD_DETAIL_MATCHERS` fifth — existing food nutrient read (0.80–0.84).
- `NUTRITION_GENERAL_EXPLAIN_MATCHERS` sixth — broadest food "tell me about" (0.72–0.80).
- `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` last — lowest confidence, explicit search guard (0.70–0.75).

---

## 7. Handler Coverage — No Changes Required

All proposed routes are already handled by the existing INT4 handler:

| Proposed route | Handler code path | Status |
|---|---|---|
| `read { scope: "nutrient", slug }` | `readNutrient()` → `port.getNutrientDetailView(slug)` | ✅ Exists |
| `read { scope: "benefit", slug }` | `readBenefit()` → `port.getBenefitDetailView(slug)` | ✅ Exists |
| `search { query }` | `handleSearch()` → `port.searchKnowledgeRegistry(query)` | ✅ Exists |
| `explain { foodSlug }` | `handleExplain()` → food detail + benefits | ✅ Exists |
| `explain { benefitSlug }` | `handleExplain()` → benefit detail + linked foods | ✅ Exists |

The handler is not touched.

---

## 8. Port Coverage — No Changes Required

All needed registry methods already exist in `NutritionKnowledgeReadPort` and `nutrition-knowledge-registry.ts`:

| Method | Used by |
|---|---|
| `getNutrientDetailView(slug)` | `read { scope: "nutrient" }` — new routes |
| `getBenefitDetailView(slug)` | `read { scope: "benefit" }` + `explain { benefitSlug }` — new routes |
| `searchKnowledgeRegistry(query)` | `search` — already executable, just underrouted |
| `getFoodDetailView(slug)` | `read { scope: "food" }` + `explain { foodSlug }` — existing |
| `getFoodBenefitsForDisplay(slug)` | `explain { foodSlug }` — existing |
| `listFoodCategories()` | `read { scope: "categories" }` — existing |
| `listFoodCards(category?)` | `read { scope: "foods" }` — existing |

The port is not touched.

---

## 9. Relationship to INT22 (Conversation Gateway Gap)

INT22 identified that the conversation gateway's `buildCapabilityParams()` always returns `verb: "read"` for `nutrition-knowledge`, bypassing the `search` and `explain` verbs regardless of what the user asked. That gap is in the **conversation gateway layer** and is a separate concern from this investigation.

This investigation addresses the **Intelligence Platform pattern resolver layer** — the canonical intent engine that the platform uses when called directly (e.g. from the floating assistant via `intelligencePlatform.handle()`). The pattern resolver correctly routes `explain` and `search` when a pattern matches. The gaps identified here are unanswered because no pattern matches, not because the platform ignores the verb.

Both gaps need fixing independently:
- This investigation → new pattern matchers in `pattern-intent-resolver.ts`
- INT22's finding → `buildCapabilityParams()` fix in `conversation-gateway.ts`

---

## 10. Files to Modify (Implementation Phase)

| File | Action | Detail |
|---|---|---|
| `server/intelligence/pattern-intent-resolver.ts` | Edit | Add `NUTRITION_NUTRIENT_MATCHERS`, `NUTRITION_BENEFIT_EXPLAIN_MATCHERS`, `NUTRITION_GENERAL_EXPLAIN_MATCHERS`, `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS`; update `ALL_SPECIFIC_MATCHERS` priority order; add nutrient-misfire guard to `foodExplain()` |

**No other files require modification.** The handler, port, binding, capability registry, schema, and routes are all unchanged.

---

## 11. Test Coverage Required

The existing INT4 test suite (`test-intelligence-nutrition-knowledge-binding.ts`) tests the handler with constructed intents — it does not test pattern resolution. The implementation phase should add:

A new test file (or extension of the existing file) that exercises the pattern resolver directly with the new utterances listed in §3, verifying:

1. `NUTRITION_NUTRIENT_MATCHERS` captures nutrient-named entities and routes to `read { scope: "nutrient" }` or `search`.
2. `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` captures benefit-named entities and routes to `explain { benefitSlug }`.
3. `NUTRITION_GENERAL_EXPLAIN_MATCHERS` captures "tell me about X" and routes to `explain { foodSlug }`.
4. `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` captures explicit search queries and routes to `search`.
5. The misfire guard: "what are the benefits of vitamin C?" no longer routes to `explain { foodSlug: "vitamin-c" }` and instead falls to `NUTRITION_NUTRIENT_MATCHERS`.
6. Existing matchers (`NUTRITION_EXPLAIN_MATCHERS`, `NUTRITION_BENEFIT_FOODS_MATCHERS`, `NUTRITION_FOOD_DETAIL_MATCHERS`) continue to resolve correctly — no regression.

---

## 12. Scope Lock

**What is out of scope for this investigation and the subsequent implementation:**

- No changes to the handler (`nutrition-knowledge-read-handler.ts`)
- No changes to the port (`nutrition-knowledge-read-port.ts`)
- No changes to the registry (`nutrition-knowledge-registry.ts`)
- No new capability registration — `nutrition-knowledge` is the correct and sufficient home
- No changes to the conversation gateway's `buildCapabilityParams()` — that is INT22's fix, not this one
- No UI changes
- No schema changes
- No changes to the keyword fallback (the fallback routes to `read { scope: "foods" }` which remains a useful last-resort for broad vocabulary terms)
- No changes to the `read { scope: "categories" }` or `read { scope: "foods" }` paths — both remain accessible

---

## 13. Summary of Gaps and Proposed Fixes

| Gap | Severity | Fix |
|---|---|---|
| No matcher for `read { scope: "nutrient" }` — nutrient queries fall to useless flat food list | HIGH | `NUTRITION_NUTRIENT_MATCHERS` (new) |
| No matcher for `read { scope: "benefit" }` / `explain { benefitSlug }` — benefit queries are unrouted | MEDIUM | `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` (new) |
| No "tell me about X" / "what is X?" matcher for foods | MEDIUM | `NUTRITION_GENERAL_EXPLAIN_MATCHERS` (new) |
| No `search { query }` matcher for open knowledge lookups | MEDIUM | `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` (new) |
| No "foods rich in / high in / sources of" nutrient matcher | MEDIUM | Covered by `NUTRITION_NUTRIENT_MATCHERS` `search` path |
| Nutrient names ("vitamin C") misfire through food-explain → honest gap | HIGH | Nutrient guard in `foodExplain()` |
| `search` verb on `nutrition-knowledge` is executable but effectively unreachable | HIGH | Resolved by new matcher arrays |

---

## 14. Definition of Investigation Done

- [x] Existing binding (INT4) fully audited — handler, port, executable intents
- [x] All existing pattern matchers catalogued and tested against representative utterances
- [x] Six gap categories identified and classified by severity
- [x] Critical misfire documented (nutrient names through food-explain → gap)
- [x] No new capability required — all gaps resolved within existing `nutrition-knowledge` binding
- [x] Four new matcher arrays specified with example patterns and target routes
- [x] Routing priority order established
- [x] Handler and port confirmed unchanged
- [x] Relationship to INT22 (conversation gateway layer) separated
- [x] Files to modify identified: one file only (`pattern-intent-resolver.ts`)
- [x] Test coverage requirements specified
- [x] No implementation performed
