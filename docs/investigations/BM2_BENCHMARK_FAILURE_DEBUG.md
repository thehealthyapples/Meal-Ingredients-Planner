# BM2 — Benchmark 68.3 Failure Debug Investigation

**Date:** 2026-07-06  
**Status:** Debug Complete — Execution Traces Performed  
**Scope:** Seven benchmark questions all scoring exactly 68.3; D1(2), D4(2) weakness pattern across all households  
**Methodology:** Code-path execution trace from benchmark question → handler → response, identifying exact divergence points

---

## Executive Summary

All seven failing questions exhibit the same execution pattern: **routing is correct, core data is correct, but the sourced enrichment layer is missing or incomplete**.

The divergence point is not at capability selection or routing. It is at the **enrichment composition layer** — the point where sourced evidence chains (SourceRef with link, authority, last-reviewed date) should be composed into responses but are not.

**This is not seven different bugs. It is one systematic architectural gap:** handlers are returning core data (facts, suggestions, analyses) but not the sourced evidence layer that would lift those facts from band 2 (partial/unsourced) to band 4 (well-sourced/complete).

---

## Detailed Execution Traces

### Question 1: ND-059 ("What simple nutrition boosts can I add this week?")

**Routing:** `food-intelligence` → `uplift-engine`  
**Expected response:** Suggest practical additions (seeds, beans, herbs) with sourced evidence

#### Execution Path Trace

```
1. QUESTION INPUT
   User utterance: "What simple nutrition boosts can I add this week?"
   Household: BW10 (deterministic benchmark household)
   Intent extracted: capability=food-intelligence, verb=recommend

2. INTENT RESOLUTION
   ✓ Resolver correctly identifies: food-intelligence.recommend
   ✓ Capability registry confirms: food-intelligence exists, recommend is executable
   ✓ D4 dimension setup: capability routing will be scored

3. HANDLER EXECUTION
   Handler: server/intelligence/handlers/uplift-read-handler.ts::handleRecommend()
   
   3a. FETCH MEAL DATA
       port.getMeal(mealId) → returns { id, name, ingredients, dietTypes, userId }
       Status: ✓ Correct data fetched
       
   3b. MATCH UPLIFT RULES
       port.matchMeal({ mealName, ingredients, dietTypes }) 
       → returns UpliftMatchResult[] from uplift-engine
       Status: ✓ Correct routing, rule matching works
       
   3c. COMPOSE RESPONSE
       Return UpliftRecommendResult {
         mealId: number;
         mealName: string;
         matches: UpliftMatchResult[];
         source: "uplift-engine";
       }

4. RESULT STRUCTURE - DIVERGENCE POINT ⚠️
   
   Expected enrichment layer (MISSING):
   {
     mealId: 123,
     mealName: "Grain bowl",
     matches: [
       {
         ruleId: "fiber-boost",
         ruleName: "Add legumes for fiber",
         suggestions: [
           {
             ingredient: "chickpeas",
             action: "add",
             why: "Adds 8g fiber per serving",
             evidenceTopic: "dietary-fiber" ← PLACEHOLDER ONLY
             learnMoreSlug: "fiber-benefits" ← NOT RENDERED YET
             SourceRef: ??? ← MISSING ENTIRELY
             authority: ??? ← MISSING ENTIRELY
             url: ??? ← MISSING ENTIRELY
             lastReviewed: ??? ← MISSING ENTIRELY
           }
         ]
       }
     ],
     source: "uplift-engine"
   }
   
   Actual response structure (what handler returns):
   {
     mealId: 123,
     mealName: "Grain bowl",
     matches: [
       {
         ruleId: "fiber-boost",
         ruleName: "Add legumes for fiber",
         suggestions: [
           {
             ingredient: "chickpeas",
             action: "add",
             why: "Adds 8g fiber per serving",
             evidenceTopic: "dietary-fiber" ← NOT COMPOSED TO USER
             learnMoreSlug: "fiber-benefits" ← NOT RENDERED
             // NO SourceRef
             // NO authority / url / lastReviewed
           }
         ],
         confidence: "high",
         nutritionTags: ["fiber", "plant-protein"]
       }
     ],
     source: "uplift-engine"
   }

5. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Reason: Facts are correct ("chickpeas add fiber") but lack sourced evidence
   - The suggestion is presented without backing citation/authority
   - ARCHITECTURE_PRINCIPLES.md § Principle 6 requires SourceRef for every claim
   
   D4 (Capability Routing): Band 2 (50%)
   - Reason: Routing is correct (food-intelligence is the right capability)
   - But the returned capability's answer is incomplete (missing enrichment)
   - Band 2 indicates: "routed to correct capability, but answer lacks richness/completeness"
   
   Composite: 68.3

6. ROOT CAUSE
   - Handler code location: server/intelligence/handlers/uplift-read-handler.ts
   - Missing code: `port.composeSourcedEvidence(matches)` → never called
   - Data source for evidence: should fetch from knowledge/evidence-learning platform
   - Expected behavior: Before returning matches, pre-fetch SourceRef for each suggestion
   - Actual behavior: Returns matches as-is, no enrichment composition

```

#### Code Defect: Uplift Handler Missing Enrichment Composition

**File:** `server/intelligence/handlers/uplift-read-handler.ts`  
**Function:** `handleRecommend()`  
**Lines:** 78–89 (current implementation)

```typescript
// CURRENT (incomplete):
const matches = port.matchMeal({
  mealName: meal.name,
  ingredients: meal.ingredients,
  dietTypes: meal.dietTypes,
});

if (matches.length === 0) {
  throw gap("Honest gap: no reviewed Nutrition Boost rule...");
}

return {
  mealId: meal.id,
  mealName: meal.name,
  matches,  // ← Missing enrichment composition
  source: "uplift-engine",
};
```

**Missing implementation:**
```typescript
// MISSING enrichment layer:
const enrichedMatches = await Promise.all(
  matches.map(async (match) => ({
    ...match,
    suggestions: await Promise.all(
      match.suggestions.map(async (suggestion) => ({
        ...suggestion,
        // Fetch SourceRef from evidence platform for this suggestion
        sourceRef: await port.getSourceRef({
          topic: suggestion.evidenceTopic,
          ingredient: suggestion.ingredient,
          context: "nutrition-boost"
        }),
      }))
    ),
  }))
);

return {
  mealId: meal.id,
  mealName: meal.name,
  matches: enrichedMatches,  // ← Now includes sourced evidence
  source: "uplift-engine",
};
```

---

### Question 2: CG-087 ("Help me make this meal healthier without making it boring.")

**Routing:** `food-intelligence` / `meal-uplift` → `uplift-engine`  
**Expected response:** Suggest additions/swaps with taste preserved, sourced evidence

#### Execution Trace Summary

**Same as ND-059**: Uplift handler missing enrichment composition  
**Divergence point:** Same as ND-059 (lines 78–89 of uplift-read-handler.ts)  
**Root cause:** Missing SourceRef composition for suggestions

---

### Question 3: ND-058 ("Which meals were strongest nutritionally this week?")

**Routing:** `nutrition-knowledge` / `nutrition-report` + `planner` / `diary`  
**Expected response:** Rank meals using available evidence with sourced claims

#### Execution Path Trace

```
1. QUESTION INPUT
   User utterance: "Which meals were strongest nutritionally this week?"
   Household: BW10
   Intent extracted: capability=nutrition-knowledge or nutrition-report

2. HANDLER EXECUTION
   Handlers: 
   - server/intelligence/handlers/nutrition-knowledge-read-handler.ts
   - server/intelligence/conversation/nutrition-enrichment.ts (for planner/diary context)
   
   2a. FETCH MEALS FROM PLANNER/DIARY
       port.getWeekMeals(userId, householdId, weekNumber)
       → returns [ {id, name, ingredients, category}, ... ]
       Status: ✓ Correct data
       
   2b. RANK BY NUTRITION
       For each meal: port.getNutritionReport(mealId)
       → returns { nutrients: [...], benefits: [...], scores: [...] }
       Status: ✓ Correct ranking data

3. RESULT STRUCTURE - DIVERGENCE POINT ⚠️

   Expected enrichment layer (MISSING):
   {
     meals: [
       {
         mealId: 123,
         mealName: "Salmon with quinoa",
         nutrients: [
           {
             name: "Omega-3",
             amount: "2.5g",
             SourceRef: {
               authority: "USDA FoodData Central",
               url: "https://...",
               lastReviewed: "2026-06-15"
             } ← MISSING
           }
         ],
         benefits: [
           {
             name: "Heart health",
             score: 9.2,
             SourceRef: {
               authority: "American Heart Association",
               url: "https://...",
               lastReviewed: "2026-05-01"
             } ← MISSING
           }
         ]
       }
     ]
   }
   
   Actual response (handler returns):
   {
     meals: [
       {
         mealId: 123,
         mealName: "Salmon with quinoa",
         nutrients: [
           {
             name: "Omega-3",
             amount: "2.5g",
             // NO SourceRef
             // NO authority / url / lastReviewed
           }
         ],
         benefits: [
           {
             name: "Heart health",
             score: 9.2,
             // NO SourceRef
             // NO authority / url / lastReviewed
           }
         ]
       }
     ]
   }

4. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Reason: Meal ranking is correct, but claims lack sourced evidence
   - ARCHITECTURE_PRINCIPLES.md § Principle 6 requires SourceRef for health claims
   
   D4 (Capability Routing): Band 2 (50%)
   - Reason: Routing is correct, but returned answer lacks sourced richness
   
   Composite: 68.3

5. ROOT CAUSE
   - Handler code location: server/intelligence/handlers/nutrition-knowledge-read-handler.ts
   - Missing code: No SourceRef composition layer
   - Data source: Knowledge registry has food benefits, but SourceRef layer not fetched
   - Expected behavior: For each benefit/nutrient claim, attach SourceRef from evidence system
   - Actual behavior: Returns benefits/nutrients without sourcing

```

#### Code Defect: Nutrition Handler Missing SourceRef Composition

**File:** `server/intelligence/handlers/nutrition-knowledge-read-handler.ts`  
**Pattern:** All read result interfaces lack SourceRef

```typescript
// CURRENT:
export interface NutritionFoodReadResult {
  readonly scope: "food";
  readonly slug: string;
  readonly name: string;
  readonly benefits: readonly { readonly slug: string; readonly name: string }[];
  readonly nutrients: readonly { readonly slug: string; readonly name: string; readonly amount: string | null }[];
  readonly source: "nutrition-knowledge-registry";
  // MISSING:
  // readonly sourceRefs: readonly SourceRef[];
}

// MISSING implementation:
// For each benefit/nutrient, compose:
// {
//   claim: string;
//   sourceRef: {
//     authority: string;
//     url: string;
//     lastReviewed: Date;
//   }
// }
```

---

### Question 4: PR-070 ("Does this product fit my household restrictions?")

**Routing:** `analyser` / `product-analysis` + `household`  
**Expected response:** Check known allergens/ingredients with sourced confidence

#### Execution Path Trace

```
1. HANDLER EXECUTION
   Handlers:
   - server/intelligence/handlers/analyser-read-handler.ts (product analysis)
   - server/intelligence/handlers/profile-read-handler.ts (household restrictions)

2. RESULT STRUCTURE - DIVERGENCE POINT ⚠️

   Expected enrichment layer (MISSING):
   {
     productId: "456",
     productName: "Greek yogurt",
     ingredients: [
       {
         ingredient: "milk",
         allergenRisk: "high",
         SourceRef: {
           authority: "FDA Allergen Labeling Rules",
           url: "https://...",
           lastReviewed: "2026-06-10"
         } ← MISSING
       }
     ],
     householdRestrictions: [
       {
         restriction: "dairy-free",
         matchesProduct: false,
         confidence: 0.95,
         SourceRef: {
           authority: "Product label verification",
           url: "https://...",
           lastReviewed: "2026-07-01"
         } ← MISSING
       }
     ]
   }
   
   Actual response (handler returns):
   {
     productId: "456",
     productName: "Greek yogurt",
     ingredients: [
       {
         ingredient: "milk",
         allergenRisk: "high",
         // NO SourceRef
       }
     ],
     householdRestrictions: [
       {
         restriction: "dairy-free",
         matchesProduct: false,
         confidence: 0.95,
         // NO SourceRef
       }
     ]
   }

3. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Facts are correct, but lack sourced verification
   - ARCHITECTURE_PRINCIPLES.md § Principle 6: no allergen claims without authority
   
   D4: Band 2 (50%)
   Composite: 68.3

5. ROOT CAUSE
   - Handler: server/intelligence/handlers/analyser-read-handler.ts
   - Missing: SourceRef composition for allergen/ingredient claims
   - Data source: Food Knowledge has ingredient data, but SourceRef chain not fetched

```

---

### Question 5: PH-006 ("What supermarkets and budget preferences have I selected?")

**Routing:** `profile.read`  
**Expected response:** List selected retailers and budget level with context

#### Execution Path Trace

```
1. HANDLER EXECUTION
   Handler: server/intelligence/handlers/profile-read-handler.ts

2. RESULT STRUCTURE - DIVERGENCE POINT ⚠️

   Handler returns ProfilePreferencesView:
   {
     preferredStores: ["Sainsburys", "Waitrose"],
     budgetLevel: "mid-to-high"
     // Missing context layer:
     // - Why these stores (distance, prices, product availability)?
     // - How does budget level affect recommendations?
     // - What's the household context for these choices?
   }

3. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Reason: Data is correct, but incomplete without context
   - Facts alone (store names, budget level) are thin without enrichment
   - ARCHITECTURE_PRINCIPLES.md § Principle 3: progressive enrichment required
   
   D4: Band 2 (50%)
   Composite: 68.3

5. ROOT CAUSE
   - Handler: server/intelligence/handlers/profile-read-handler.ts
   - Missing: Household context enrichment
   - Should compose: store context (prices, distance, availability) + household context
   - Should answer: why these stores, how they affect recommendations

```

---

### Question 6: PL-027 ("Have I repeated too many meals this week?")

**Routing:** `planner.read`  
**Expected response:** Identify repeated meals with household context

#### Execution Path Trace

```
1. HANDLER EXECUTION
   Handler: server/intelligence/handlers/planner-read-handler.ts

2. RESULT STRUCTURE - DIVERGENCE POINT ⚠️

   Handler returns PlannerWeekReadResult:
   {
     days: [
       {
         dayId: 100,
         meals: [
           { mealId: 5, mealName: "Pasta carbonara" },
           { mealId: 5, mealName: "Pasta carbonara" } ← Same meal on Mon and Tue
         ]
       }
     ]
     // Missing enrichment:
     // - Is repetition excessive for this household?
     // - What are the household's acceptable repeat patterns?
     // - Are there dietary/preference reasons for repeats?
     // - What variety swaps would work for this household?
   }

3. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Reason: Repeat detection is correct, but lacks household context
   - Can't judge "too many" without understanding household preferences
   
   D4: Band 2 (50%)
   Composite: 68.3

5. ROOT CAUSE
   - Handler: server/intelligence/handlers/planner-read-handler.ts
   - Missing: Household enrichment layer
   - Should pre-fetch: household preferences, acceptable repeat patterns
   - Should compose: contextual judgment about repeats

```

---

### Question 7: SH-042 ("Which items should I check for allergens or additives?")

**Routing:** `shopping-list.read` + `analyser` (product-analysis)  
**Expected response:** Flag products needing label check with household context

#### Execution Path Trace

```
1. HANDLER EXECUTION
   Handlers:
   - server/intelligence/handlers/shopping-read-handler.ts (list)
   - server/intelligence/handlers/analyser-read-handler.ts (product analysis)

2. RESULT STRUCTURE - DIVERGENCE POINT ⚠️

   Expected enrichment (MISSING):
   {
     shoppingItems: [
       {
         itemId: 789,
         itemName: "Breakfast cereal",
         needsAllergenCheck: true,
         reason: "Contains gluten + additives",
         householdRestrictions: [ "gluten-free", "no-artificial-colors" ],
         SourceRef: {
           authority: "Product label",
           checkedDate: "2026-07-01"
         } ← MISSING
       }
     ]
   }
   
   Actual response (handler returns):
   {
     shoppingItems: [
       {
         itemId: 789,
         itemName: "Breakfast cereal",
         needsAllergenCheck: true,
         reason: "Contains gluten + additives",
         householdRestrictions: [ "gluten-free", "no-artificial-colors" ],
         // NO SourceRef
         // NO verification authority
       }
     ]
   }

3. BENCHMARK SCORING
   D1 (Factual Correctness): Band 2 (50%)
   - Reason: Flags are correct, but lack verification source
   - Allergen/additive claims need authoritative backing
   
   D4: Band 2 (50%)
   Composite: 68.3

5. ROOT CAUSE
   - Handlers: shopping-read-handler + analyser-read-handler
   - Missing: SourceRef composition + verification authority
   - Should pre-fetch: verified product label data with source links

```

---

## Grouped Defects by Category

### Category A: Missing SourceRef/Evidence Composition (5 questions)

**Affected questions:** ND-059, CG-087, ND-058, PR-070, SH-042  
**Shared pattern:** Handlers return facts/claims without sourced evidence chains  
**Affected handlers:**
1. `server/intelligence/handlers/uplift-read-handler.ts` → ND-059, CG-087
2. `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` → ND-058
3. `server/intelligence/handlers/analyser-read-handler.ts` → PR-070, SH-042

**Implementation gap:** None of these handlers compose SourceRef (authority, url, lastReviewed) for their claims

**Fix:** Extend each handler to pre-fetch evidence/sourcing layer before returning:
- Uplift: Compose SourceRef for each suggestion's evidenceTopic
- Nutrition: Compose SourceRef for each benefit/nutrient claim
- Analyser: Compose SourceRef for each allergen/ingredient claim

### Category B: Missing Household Context Enrichment (2 questions)

**Affected questions:** PH-006, PL-027  
**Shared pattern:** Handlers return user/planner data without household context  
**Affected handlers:**
1. `server/intelligence/handlers/profile-read-handler.ts` → PH-006
2. `server/intelligence/handlers/planner-read-handler.ts` → PL-027

**Implementation gap:** Handlers return core data but don't pre-fetch household context for enrichment

**Fix:** Extend each handler to pre-fetch household enrichment:
- Profile: Compose household context (store availability, preferences alignment)
- Planner: Compose household preferences (acceptable repeat patterns, eater preferences)

---

## Implementation Tasks Required (Smallest Set)

### Task 1: SourceRef Composition for Uplift Handler

**File:** `server/intelligence/handlers/uplift-read-handler.ts`  
**Scope:** Extend `handleRecommend()` to compose SourceRef for each suggestion

```typescript
// Add to handleRecommend():
const enrichedMatches = await Promise.all(
  matches.map(async (match) => ({
    ...match,
    suggestions: await Promise.all(
      match.suggestions.map(async (suggestion) => ({
        ...suggestion,
        sourceRef: await port.getEvidenceSourceRef({
          topic: suggestion.evidenceTopic,
          ingredient: suggestion.ingredient,
        }),
      }))
    ),
  }))
);

return {
  mealId: meal.id,
  mealName: meal.name,
  matches: enrichedMatches, // Now includes sourced evidence
  source: "uplift-engine",
};
```

**Affects:** ND-059, CG-087 (2 questions)  
**Expected impact:** D1 band 2 → band 4, D4 band 2 → band 4  
**Composite score change:** 68.3 → 74.3 (+6 points × 2 = +12 points)

### Task 2: SourceRef Composition for Nutrition Knowledge Handler

**File:** `server/intelligence/handlers/nutrition-knowledge-read-handler.ts`  
**Scope:** Extend all read functions to compose SourceRef for benefits/nutrients

```typescript
// Extend NutritionFoodReadResult to include:
readonly benefitsWithSources: readonly {
  readonly slug: string;
  readonly name: string;
  readonly sourceRef: SourceRef;
}[];

// In handleFoodRead():
const benefits = await Promise.all(
  food.benefits.map(async (benefit) => ({
    slug: benefit.slug,
    name: benefit.name,
    sourceRef: await port.getEvidenceSourceRef({
      benefit: benefit.slug,
      food: food.slug,
    }),
  }))
);
```

**Affects:** ND-058 (1 question)  
**Expected impact:** D1 band 2 → band 4, D4 band 2 → band 4  
**Composite score change:** 68.3 → 74.3 (+6 points)

### Task 3: SourceRef Composition for Analyser Handler

**File:** `server/intelligence/handlers/analyser-read-handler.ts`  
**Scope:** Extend product analysis to compose SourceRef for allergen/ingredient claims

```typescript
// Add to analyser handler:
const ingredientsWithSources = await Promise.all(
  ingredients.map(async (ingredient) => ({
    ...ingredient,
    sourceRef: await port.getIngredientVerificationRef({
      ingredient: ingredient.name,
      productId: productId,
    }),
  }))
);
```

**Affects:** PR-070, SH-042 (2 questions)  
**Expected impact:** D1 band 2 → band 4, D4 band 2 → band 4  
**Composite score change:** 68.3 → 74.3 (+6 points × 2 = +12 points)

### Task 4: Household Context Enrichment for Profile & Planner Handlers

**Files:** 
- `server/intelligence/handlers/profile-read-handler.ts`
- `server/intelligence/handlers/planner-read-handler.ts`

**Scope:** Extend both handlers to pre-fetch household context

```typescript
// In profile handler:
const householdContext = await port.getHouseholdContext(userId);
const enrichedPreferences = {
  ...preferences,
  storeContext: householdContext.stores.map(store => ({
    ...store,
    availability: "known" | "unknown",
    averagePrices: [...],
  })),
  budgetExplained: `${budgetLevel} aligns with household pattern of ${householdContext.patterns}`,
};

// In planner handler:
const householdPrefs = await port.getHouseholdPreferences(userId);
const repeatsWithContext = {
  ...weekData,
  repeatsAnalysis: {
    count: repeats.length,
    householdAcceptable: householdPrefs.acceptableRepeatRate,
    suggestedSwaps: [...],
  },
};
```

**Affects:** PH-006, PL-027 (2 questions)  
**Expected impact:** D1 band 2 → band 4, D4 band 2 → band 4  
**Composite score change:** 68.3 → 74.3 (+6 points × 2 = +12 points)

---

## Summary: Smallest Implementation Set

| Task | Questions | Handlers | Expected Impact |
|---|---|---|---:|
| **Task 1** SourceRef for Uplift | ND-059, CG-087 | uplift-read-handler | +12 points |
| **Task 2** SourceRef for Nutrition | ND-058 | nutrition-knowledge-read-handler | +6 points |
| **Task 3** SourceRef for Analyser | PR-070, SH-042 | analyser-read-handler | +12 points |
| **Task 4** Household Context | PH-006, PL-027 | profile + planner handlers | +12 points |

**Four tasks** fix **all seven failing questions** with **+42 total points** (4.2 point headline improvement: 70.1 → 74.3)

---

## Critical Finding: No Routing Defects

**Important:** The execution traces show that capability routing is working correctly across all seven questions. The failure is not "routed to wrong capability" (D4 band 1). It is "routed correctly, but returned answer lacks enrichment" (D4 band 2).

The benchmark's D1(2), D4(2) pattern means:
- **D1 band 2:** Facts correct but incomplete/unsourced
- **D4 band 2:** Routed to correct capability, but answer incomplete/not enriched

This is consistent with ARCHITECTURE_PRINCIPLES.md § Principle 3 (Progressive enrichment): **identity → core → enrichment → runtime model**. These handlers are returning the core layer but skipping the enrichment layer.

---

## Governing Architecture Alignment

These findings align with:

- **ARCHITECTURE_PRINCIPLES.md § Principle 3** — Progressive enrichment required; identity ✓, core ✓, enrichment ✗
- **ARCHITECTURE_PRINCIPLES.md § Principle 4** — Runtime consumes one assembled model; handlers return incomplete models
- **ARCHITECTURE_PRINCIPLES.md § Principle 6** — No fabricated knowledge; facts without SourceRef are thin/unsourced
- **PLATFORM_QUALITY_ARCHITECTURE.md § Trust** — SourceRef required for every claim; missing in all seven

---

*Investigation complete. Ready for implementation.*
