# INT26-27 — Nutrition Intelligence Capability Activation

**Status:** Implemented  
**Date:** 2026-07-01  
**Scope:** EWO-INT26 (Nutrition Knowledge Discovery — pattern matchers) + EWO-INT27 (Nutrition Discovery — new capability)

---

## Overview

This document records the implementation of two nutrition intelligence workstreams as a single architecture-compliant change. The two investigations identified independent gaps at different platform layers:

| Workstream | Gap layer | Fix |
|---|---|---|
| INT26 | Pattern-intent resolver | Add 5 matcher arrays + nutrient misfire guard |
| INT27 | Capability layer | New `nutrition-discovery` capability — 13th live, 15th registered |

---

## INT26 — Nutrition Knowledge Discovery (Pattern Matcher Activation)

### Root cause

The `nutrition-knowledge` binding (INT4) already implements `read { scope:"nutrient" }`, `read { scope:"benefit" }`, `search { query }`, and `explain { benefitSlug }`. All four intents have live handler code paths. The gap was entirely in `pattern-intent-resolver.ts` — no matchers routed user utterances to these intents.

**Critical misfire also fixed:** "vitamin C" matched `NUTRITION_EXPLAIN_MATCHERS` via `foodExplain()` → `explain { foodSlug: "vitamin-c" }`. The handler would receive a food slug lookup for a nutrient name and return a gap. Now `foodExplain()` guards against `KNOWN_NUTRIENT_TERMS` and returns `null`, letting the correct matcher array handle it.

### Files changed (INT26)

**`server/intelligence/pattern-intent-resolver.ts`** — only file changed:

| Addition | Purpose |
|---|---|
| `KNOWN_NUTRIENT_TERMS` regex | 40+ nutrient terms — used as guard in 3 places |
| `KNOWN_BENEFIT_TERMS` regex | 30+ health-benefit concepts — used as guard in 2 places |
| Guard in `foodExplain()` | Blocks nutrient-named entities from being routed to `explain { foodSlug }` |
| `NUTRITION_NUTRIENT_MATCHERS` (7 rules) | Routes nutrient queries to `read { scope:"nutrient" }` or `search { query }` |
| `NUTRITION_BENEFIT_EXPLAIN_MATCHERS` (2 rules) | Routes benefit queries to `explain { benefitSlug }` |
| `NUTRITION_GENERAL_EXPLAIN_MATCHERS` (3 rules) | Routes generic food queries to `explain { foodSlug }` — lower confidence |
| `NUTRITION_KNOWLEDGE_SEARCH_MATCHERS` (3 rules) | Routes open nutrient/benefit searches to `search { query }` |
| `ALL_SPECIFIC_MATCHERS` order updated | Nutrient matchers first, benefit matchers second, food matchers third, discovery matchers fourth |

### Routing before and after

| Utterance | Before INT26 | After INT26 |
|---|---|---|
| "tell me about vitamin C" | `explain { foodSlug: "vitamin-c" }` → gap | `read { scope:"nutrient", slug:"vitamin-c" }` ✓ |
| "what does iron do?" | `explain { foodSlug: "iron" }` → gap | `read { scope:"nutrient", slug:"iron" }` ✓ |
| "tell me about immunity" | no match → surface fallback | `explain { benefitSlug: "immunity" }` ✓ |
| "foods rich in omega-3" | no match → surface fallback | `search { query: "omega-3" }` ✓ |
| "tell me about broccoli" | `explain { foodSlug: "broccoli" }` ✓ | `explain { foodSlug: "broccoli" }` ✓ (unchanged) |
| "look up vitamin D" | no match | `search { query: "vitamin d" }` ✓ |
| "what foods contain iron?" | no match | `search { query: "iron" }` ✓ |

### No handler / registry / test count changes

INT26 activates no new capability. Registered count (15) and live count (13) are unchanged by the pattern-matcher work alone.

---

## INT27 — Nutrition Discovery (New Capability)

### Summary

Thirteenth live capability on the THA Intelligence Platform. Enables macro-filtered meal discovery: "meals under 400 calories", "high protein meals", "low carb recipes", "at least 30g protein".

**Key design decision:** The `nutrition` table stores macro columns as TEXT, not NUMERIC. The engine tolerates this by parsing text in application code rather than SQL casts. See `parseMacroText()` in `nutrition-discovery-engine.ts`.

### Architecture (Port → Handler → Binding — INT27)

```
Pattern resolver
  └─ NUTRITION_DISCOVERY_MATCHERS → intent: search { query }
       │
       ▼
IntelligencePlatform.handle()
  └─ capability: "nutrition-discovery"
       │
       ▼
NutritionDiscoveryHandler
  └─ parseNutritionFilter(query) → NutritionFilter (or gap if unparseable)
       │
       ▼
NutritionDiscoveryEngine.discover(filter, userId)
  └─ port.getMealRows(userId)
       │    (personal meals ∪ system meals, left-joined to nutrition table)
       ▼
  parseMacroText() per row → ParsedNutrition
  satisfiesFilter() per row → boolean
       │
       ▼
  NutritionDiscoveryItem[] (capped at 15)
       │
       ▼
NutritionDiscoverySearchResult {
  scope: "nutrition-filter",
  filter, rawQuery, totalCount,
  mealsWithNutritionCount, mealsWithoutNutritionCount,
  results, source: "nutrition-discovery"
}
```

### Files created (INT27)

| File | Role |
|---|---|
| `server/intelligence/handlers/nutrition-discovery-port.ts` | Port interface + types (`MealNutritionRow`, `NutritionFilter`, `NutritionDiscoveryItem`, `NutritionDiscoverySearchResult`) |
| `server/intelligence/services/nutrition-discovery-engine.ts` | `parseMacroText()`, `parseNutritionFilter()`, `satisfiesFilter()`, `NutritionDiscoveryEngine` |
| `server/intelligence/handlers/nutrition-discovery-handler.ts` | `createNutritionDiscoveryHandler()` — delegates to engine |
| `server/intelligence/bindings/nutrition-discovery.ts` | `bindNutritionDiscoveryCapability()` — activates on platform |
| `server/tests/test-intelligence-nutrition-discovery-binding.ts` | 86-assertion test — engine units + handler contract + singleton scope-lock |

### Files edited (INT27)

| File | Change |
|---|---|
| `server/storage.ts` | `getMealsByNutritionFilter(userId)` added to `IStorage` + `DatabaseStorage` |
| `server/intelligence/capability-registry.ts` | `nutrition-discovery` seed entry (15th registered) |
| `server/intelligence/intelligence-platform.ts` | `import + bindNutritionDiscoveryCapability()` call; singleton comment updated |
| `server/intelligence/index.ts` | INT27 exports added |
| `server/intelligence/pattern-intent-resolver.ts` | `NUTRITION_DISCOVERY_MATCHERS` (8 rules) + `ALL_SPECIFIC_MATCHERS` update |

### Scope-lock updates (12 → 13 live, 14 → 15 registered)

All 12 existing binding test files updated:
- `test-intelligence-analyser-binding.ts`
- `test-intelligence-diary-binding.ts`
- `test-intelligence-household-binding.ts`
- `test-intelligence-meal-discovery-binding.ts`
- `test-intelligence-meals-binding.ts`
- `test-intelligence-nutrition-knowledge-binding.ts`
- `test-intelligence-pantry-binding.ts`
- `test-intelligence-partners-binding.ts`
- `test-intelligence-profile-binding.ts`
- `test-intelligence-templates-binding.ts`
- `test-intelligence-platform.ts` (14 → 15 registered)
- `test-intelligence-registry-executability.ts` (12 → 13 live + `NUTRITION_DISCOVERY_CAPABILITY_ID` import + assertion)

### Supported patterns (NUTRITION_DISCOVERY_MATCHERS)

| Pattern | Confidence |
|---|---|
| "meals/recipes under N calories/kcal" | 0.90 |
| "what can I have under N calories?" | 0.89 |
| "high-protein meals/recipes" | 0.88 |
| "low-carb meals/recipes" | 0.88 |
| "meals with less than N calories/carbs/fat" | 0.87 |
| "low-fat meals/recipes" | 0.86 |
| "low-sugar meals/recipes" | 0.86 |
| "at least Ng protein" / "over Ng protein" | 0.86 |

### Qualitative thresholds (parseNutritionFilter)

| Term | Default threshold |
|---|---|
| "high protein" | proteinMin = 20g |
| "low carb" | carbsMax = 20g |
| "low fat" | fatMax = 10g |
| "low sugar" | sugarMax = 5g |

These are documented constants in the engine, not magic numbers.

### Honest gaps

- Empty query → gap
- Query with no parseable nutrition filter → gap (message cites examples)
- Meals without a nutrition row → excluded from filtered results, counted in `mealsWithoutNutritionCount`
- Null parsed macro (text could not be parsed) → meal excluded from filter (never silently assumed to pass)

---

## Test Results

### New test: INT27 Nutrition Discovery binding
**86 passed, 0 failed**

Covers: parseMacroText (12), parseNutritionFilter (10), satisfiesFilter (7), binding lifecycle (5), permission guard (2), search scenarios (23), capping (2), write-verb rejection (4), singleton scope-lock (7), canExecute (3), plus result shape validation.

### Registry executability (updated)
**123 passed, 0 failed**

### All 10 existing binding tests
All pass at previous counts (30–72 assertions each).

### Platform test (updated)
**33 passed, 0 failed**

---

## Capability Registry State After INT26-27

| # | Capability ID | Status | Executable Intents |
|---|---|---|---|
| 1 | planner | available | read, explain |
| 2 | shopping | available | read, explain |
| 3 | nutrition-knowledge | available | read, search, explain |
| 4 | diary | available | read, explain |
| 5 | profile | available | read |
| 6 | household | available | read |
| 7 | partners | available | read |
| 8 | meals | available | read, search |
| 9 | templates | available | read |
| 10 | pantry | available | read, explain |
| 11 | analyser | available | read |
| 12 | meal-discovery | available | search |
| **13** | **nutrition-discovery** | **available** | **search** |
| 14 | administration | registered | — |
| 15 | developer | never | — |

---

## Architecture Compliance

- **Port → Handler → Binding pattern** maintained (identical to INT2–INT26).
- **Dynamic imports only** — no DB connection at module-load time.
- **Read-only enforcement** — `readOnlyVerbGuard` in handler; write verbs return `unsupported_intent` (nutrition-discovery does not declare write verbs in `supportedIntents`).
- **Honest gaps** — all failure paths return structured gap outcomes, never fabricated data.
- **No schema changes** — storage method is a join of existing `meals` + `nutrition` tables.
- **Database audit rule** — no new columns; no migration required.
- **Scope-lock count** — all 13 test files updated in lockstep.
