# Normal Meal Compatibility Engine — Feasibility Investigation

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `investigation/normal-meal-compatibility-engine-feasibility-2026-06-12`
**Status:** Investigation only. No code changes made.
**Confidence level:** HIGH — all findings from direct full-file code inspection.

---

## Rollback Protection

```
Tag: investigation/normal-meal-compatibility-engine-feasibility-2026-06-12
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout investigation/normal-meal-compatibility-engine-feasibility-2026-06-12
```

---

## Files Inspected

| File | Lines Read | Purpose |
|------|-----------|---------|
| `shared/schema.ts` | 48–133 | Full `mealTemplates` and `meals` table definitions |
| `server/lib/household-meal-matcher.ts` | 1–411 | Full file — compatibility engine |
| `server/lib/meal-scoring-service.ts` | 1–285 | `ScoredCandidate`, `convertMealToCandidate`, `scoreMeal` |

---

## Compatibility Dependency Map

```
scoreTemplate(template, members, settings, swapMap)
  │
  ├── INPUTS FROM template (MealTemplate):
  │     sharedBaseComponents[]   → assembled into allSlotIngredients[]
  │     proteinSlots[]           → assembled into allSlotIngredients[]
  │     carbSlots[]              → assembled into allSlotIngredients[]
  │     vegSlots[]               → assembled into allSlotIngredients[]
  │     toppingSlots[]           → assembled into allSlotIngredients[]
  │     sauceSlots[]             → assembled into allSlotIngredients[]
  │     compatibleDiets[]        → Path A check
  │     estimatedExtraTimePerVariant → extraPrepMinutes calculation
  │     estimatedTotalTime       → scoreTimeFit()
  │     costBand                 → scoreCostFit()
  │
  ├── INPUTS FROM members (MemberProfile[]):
  │     displayName, userId, dietTypes, excludedIngredients,
  │     preferredIngredients, maxPrepTolerance, upfSensitivity, healthGoals
  │
  ├── INPUTS FROM settings (HouseholdSettings):
  │     mealMode, maxExtraPrepMinutes, maxTotalCookTime,
  │     preferLessProcessed, budgetLevel
  │
  └── INPUTS FROM swapMap (Map<string, string>):
        ingredient_swaps DB table rows
  │
  COMPUTATION (template-independent):
  ├── Path A: template.compatibleDiets vs member.dietTypes     ← generic, not shell-specific
  ├── Path B: allSlotIngredients vs member.excludedIngredients  ← generic, not shell-specific
  ├── memberChanges construction                                ← generic
  ├── swapsNeeded (→ strings only)                             ← generic
  ├── scoreCompatibility(totalDietConflicts, memberCount)      ← generic
  ├── scoreSwapSimplicity(memberChanges, memberCount)          ← generic
  ├── scoreHealthAlignment(members, settings)                  ← generic
  └── scorePreferenceConfidence(members)                       ← generic
  
  COMPUTATION (template-specific, graceful defaults):
  ├── scoreSharedBase(sharedIngredients, base)                 ← returns 1.0 if base is empty
  ├── scoreTimeFit(template, extraPrepMinutes, settings)       ← returns 1.0 if no time data
  └── scoreCostFit(template, settings)                        ← returns 1.0 if no costBand
```

---

## Question 1 — Schema Comparison: mealTemplates vs meals

### `mealTemplates` table (`shared/schema.ts:48–72`)

```typescript
{
  id, name, category, description, imageUrl,
  defaultCalories, defaultProtein, defaultCarbs, defaultFat,
  title, cuisine,
  sharedBaseComponents: text[],   // ← slot: shared ingredients
  proteinSlots:         text[],   // ← slot: protein options
  carbSlots:            text[],   // ← slot: carb options
  vegSlots:             text[],   // ← slot: vegetable options
  toppingSlots:         text[],   // ← slot: topping options
  sauceSlots:           text[],   // ← slot: sauce options
  compatibleDiets:      text[],   // ← declared dietary compatibility
  estimatedTotalTime:   integer,  // ← time metadata
  estimatedExtraTimePerVariant: integer,  // ← per-variant extra time
  costBand:             text,     // ← "budget" | "standard" | "premium"
  isActive:             boolean,
}
```

### `meals` table (`shared/schema.ts:88–121`)

```typescript
{
  id, userId, name,
  ingredients:   text[].notNull(),  // ← flat ingredient list (NOT slotted)
  instructions:  text[],
  imageUrl, servings, categoryId, sourceUrl,
  mealTemplateId,                   // ← optional link to mealTemplates
  mealSourceType, isReadyMeal, isSystemMeal, mealFormat,
  dietTypes:     text[].notNull().default([]),  // ← declared dietary types
  isFreezerEligible, audience,
  isDrink, drinkType, barcode, brand,
  originalMealId, kind,
  createdAt,
  isHouseholdSafeVariant,           // ← AI variant flag
  householdSafeFor,                 // ← restriction snapshot
  variantKind, showInCookbook,
}
```

### Side-by-side comparison

| Field purpose | mealTemplates | meals |
|--------------|---------------|-------|
| Ingredient list | 6 slot arrays: sharedBase, protein, carb, veg, topping, sauce | Single flat `ingredients[]` |
| Dietary compatibility | `compatibleDiets: text[]` | `dietTypes: text[]` |
| Category | `category: text` (direct) | `categoryId: integer` (FK lookup) |
| Time metadata | `estimatedTotalTime`, `estimatedExtraTimePerVariant` | Not present |
| Cost metadata | `costBand: text` | Not present |
| Cuisine | `cuisine: text` | Not present |
| Active flag | `isActive: boolean` | Not present (all meals are live) |

**Key finding:** `meals.dietTypes` is structurally equivalent to `mealTemplates.compatibleDiets`. Both are `text[]` arrays declaring which dietary patterns the item satisfies. The field names differ; the semantics are identical.

**Key finding:** `meals.ingredients` is a single flat array. `mealTemplates` distributes ingredients across six typed slot arrays. The slot structure encodes semantic roles (protein, carb, sauce) that a flat list does not have — but for Path B conflict detection, this distinction is irrelevant. The engine only needs to check whether any ingredient string matches an exclusion string.

---

## Question 2 — What Does scoreTemplate() Actually Consume?

### Fields read from `template: MealTemplate`

| Field | Line(s) in matcher.ts | Required? | Default if absent |
|-------|----------------------|-----------|-------------------|
| `template.sharedBaseComponents` | 250, 260, 298 | **REQUIRED** (one slot must be non-empty) | — |
| `template.proteinSlots` | 251 | Optional | `[]` |
| `template.carbSlots` | 252 | Optional | `[]` |
| `template.vegSlots` | 253 | Optional | `[]` |
| `template.toppingSlots` | 254 | Optional | `[]` |
| `template.sauceSlots` | 255 | Optional | `[]` |
| `template.compatibleDiets` | 269 | Optional | `[]` — Path A is skipped entirely |
| `template.estimatedExtraTimePerVariant` | 307 | Optional | `0` (null-safe via `?? 0`) |
| `template.estimatedTotalTime` | 106 | Optional | `1.0` score (penalty only if exceeds limit) |
| `template.costBand` | 118 | Optional | `1.0` score (returns 1 when null) |

### The actual hard requirement

```typescript
// household-meal-matcher.ts:258
if (allSlotIngredients.length === 0) return null;
```

Only one thing is structurally required: the assembled `allSlotIngredients` must be non-empty. This array is formed by concatenating all six slot arrays. As long as at least one slot array has at least one element, the function proceeds.

**Everything else degrades gracefully.** Missing `compatibleDiets` skips Path A (line 270: `if (templateDiets.length > 0 && member.dietTypes.length > 0)`). Missing time/cost metadata defaults scores to 1.0. Missing `estimatedExtraTimePerVariant` produces `extraPrepMinutes = 0`.

---

## Question 3 — Could scoreTemplate() Operate on meal.ingredients[] Without Slot Architecture?

**Answer: B — Yes, with a minimal adapter layer.**

`scoreTemplate()` does not care which slot array an ingredient comes from. By line 258, all six slot arrays have already been merged into a single `allSlotIngredients[]`. The slot structure is irrelevant to all subsequent computation — Path A, Path B, memberChanges construction, swap lookup, and all scoring functions operate exclusively on this flattened list.

**Proof from code:**

```typescript
// household-meal-matcher.ts:249–256
const allSlotIngredients = [
  ...(template.sharedBaseComponents ?? []),
  ...(template.proteinSlots        ?? []),
  ...(template.carbSlots           ?? []),
  ...(template.vegSlots            ?? []),
  ...(template.toppingSlots        ?? []),
  ...(template.sauceSlots          ?? []),
];

// Line 258: only guard — list must be non-empty
if (allSlotIngredients.length === 0) return null;

// Line 260: base is sharedBaseComponents only
const base = template.sharedBaseComponents ?? [];
```

After line 258, `allSlotIngredients` is a `string[]`. The subsequent logic (lines 262–317) treats it as a plain list of ingredient strings with no slot identity. Every operation — `ingredient.toLowerCase()`, `excluded.some(...)`, `swapMap.get(key)` — works on the string values, not on which slot they came from.

**The adapter construction:**

A normal meal can be represented as a synthetic template by placing all ingredients into `sharedBaseComponents` and leaving other slots empty:

```
Meal: Chicken Tikka Masala
  ingredients: ["chicken", "onion", "garlic", "tomatoes", "cream", "rice"]

Synthetic template:
  sharedBaseComponents: ["chicken", "onion", "garlic", "tomatoes", "cream", "rice"]
  proteinSlots:   []
  carbSlots:      []
  vegSlots:       []
  toppingSlots:   []
  sauceSlots:     []
  compatibleDiets: meal.dietTypes   ← maps directly
  estimatedExtraTimePerVariant: null → 0
  estimatedTotalTime: null          → 1.0 timeFit
  costBand: null                    → 1.0 costFit
```

This satisfies the only hard requirement (non-empty slot list) and produces valid output for all three scoring paths.

**One semantic difference:** Using `sharedBaseComponents` for all meal ingredients means `base = meal.ingredients` and `scoreSharedBase` measures what fraction of ALL meal ingredients everyone can eat. For a shell meal, `base` is the shared foundation and protein/carb slots are the variable parts. For a normal meal, there are no explicitly "shared" vs "variable" parts — treating everything as base is conceptually correct: it measures "what can everyone eat from this dish?"

---

## Question 4 — Adapter Feasibility: Would All Paths Still Function?

### With `allSlotIngredients = meal.ingredients`:

**Path A (diet type check) — YES, with caveat**

```typescript
// household-meal-matcher.ts:269–277
const templateDiets = template.compatibleDiets ?? [];
if (templateDiets.length > 0 && member.dietTypes.length > 0) {
  for (const diet of member.dietTypes) {
    if (!templateDiets.includes(diet)) {
      totalDietConflicts++;
      swaps.push(`${diet} diet not covered`);
    }
  }
}
```

`compatibleDiets` would map to `meal.dietTypes`. Both are `text[]` with the same semantics.

**Caveat:** `convertMealToCandidate()` (`meal-scoring-service.ts:258`) always sets `dietTypes: []` in the `ScoredCandidate`, but the adapter would read `meal.dietTypes` from the DB row directly (not from the converted candidate). The DB field IS populated when meals are saved with dietary classification. Path A would fire correctly for meals with populated `dietTypes`.

For meals where `dietTypes` is empty (many user-saved meals), Path A is silently skipped (the `templateDiets.length > 0` guard handles this) — same behaviour as shell templates with no `compatibleDiets`.

**Path B (ingredient exclusion check) — YES, fully**

```typescript
// household-meal-matcher.ts:279–287
const excluded = member.excludedIngredients.map((e) => e.toLowerCase());
for (const ingredient of allSlotIngredients) {
  const key = ingredient.toLowerCase();
  const isExcluded = excluded.some((ex) => key.includes(ex) || ex.includes(key));
  if (isExcluded) {
    const healthier = swapMap.get(key);
    swaps.push(healthier ? `${ingredient} → ${healthier}` : `remove ${ingredient}`);
  }
}
```

`meal.ingredients[]` is a `text[]` of the same string format as slot ingredients. The matching logic (`key.includes(ex) || ex.includes(key)`) is purely string-based. It works identically regardless of whether the strings came from a slot array or a flat ingredient list.

**Swap lookup — YES, no change**

`swapMap` is built from the `ingredient_swaps` DB table. It is keyed by lowercase original ingredient name. `meal.ingredients[]` entries are ingredient name strings. The lookup `swapMap.get(ingredient.toLowerCase())` functions identically.

**memberChanges[] — YES, fully**

```typescript
// household-meal-matcher.ts:289–292
if (swaps.length > 0) {
  membersNeedingVariant++;
  memberChanges.push({ userId: member.userId, displayName: member.displayName, swaps });
}
```

This is pure logic — no template field references. Works for any input.

**swapsNeeded[] — YES, fully**

```typescript
// household-meal-matcher.ts:303–305
const swapsNeeded = Array.from(
  new Set(memberChanges.flatMap((c) => c.swaps).filter((s) => s.includes("→")))
);
```

Pure string filtering. No template dependency.

**explanation (buildExplanation) — YES, fully**

`buildExplanation()` (`matcher.ts:342–410`) receives `members`, `memberChanges`, `sharedIngredients`, `base`, `swapsNeeded`, `extraPrepMinutes`, `breakdown`, and `settings`. Zero template-specific fields. Fully compatible.

**fitScore — YES, with score distortion on time/cost dimensions**

`computeFitScore()` is a weighted composite. `scoreTimeFit` and `scoreCostFit` would return 1.0 for all normal meals (no time/cost metadata). These two dimensions are weighted at 10% each, so the distortion is bounded: a maximum of 20% of the score is inaccurate (over-estimated). The 80% driven by compatibility, swap simplicity, shared base, health alignment, and preference confidence is fully accurate.

---

## Question 5 — Theoretical Compatibility Trace: Real Meals

### Household: Colin, Daisy, Lilly (Vegetarian, Gluten-Free, Dairy-Free)

Assuming:
- Lilly: `defaultDietTypes: ["Vegetarian", "Gluten-Free", "Dairy-Free"]`, `hardRestrictions: ["chicken", "cream", "milk", "cheese", "wheat", "pasta"]`
- Daisy: `defaultDietTypes: ["Mediterranean", "Dairy-Free"]`, `hardRestrictions: ["milk", "cream", "cheese"]`
- Colin: `defaultDietTypes: ["Mediterranean"]`, `hardRestrictions: []`

*(Note: these are child eater values. Adult eater rows have empty arrays per prior investigation. This trace assumes the adult data gap has been resolved.)*

---

#### Chicken Tikka Masala

```
ingredients: ["chicken", "onion", "garlic", "ginger", "tomatoes", "cream", "garam masala", "rice"]
dietTypes: []  (assume not populated)

allSlotIngredients = meal.ingredients (via adapter)
base = same (via sharedBaseComponents mapping)

Path A: compatibleDiets = [] → SKIPPED for all members

Path B per member:
  Colin:
    excludedIngredients = []
    → no conflicts
    → no MemberChange

  Daisy:
    excludedIngredients = ["milk", "cream", "cheese"]
    "cream" matches "cream" → swapMap.get("cream") → depends on DB
    → swap: "cream → X" or "remove cream"
    → MemberChange: { displayName: "Daisy", swaps: ["cream → X"] }

  Lilly:
    excludedIngredients = ["chicken", "cream", "milk", "cheese", "wheat", "pasta"]
    "chicken" matches "chicken" → swapMap.get("chicken") → "chickpeas" (if seeded)
    "cream" matches "cream" → swapMap.get("cream") → depends on DB
    → MemberChange: { displayName: "Lilly", swaps: ["chicken → chickpeas", "cream → X"] }

RESULT:
  memberChanges: [Daisy(1 swap), Lilly(2 swaps)]
  swapsNeeded: ["chicken → chickpeas", "cream → X"]  ← only → strings
  explanation: "Fits 1 of 3 profiles · 2 easy swaps · High ingredient overlap"
  compatibility: 1.0  ← (0 Path A conflicts)
  swapSimplicity: ~0.47  ← (2 of 3 members need changes, some swaps available)
  fitScore: computed from weighted breakdown

Can memberChanges[] be generated?  YES
Can swapsNeeded[] be generated?    YES
Can explanation be generated?      YES
Can fitScore be generated?         YES (time/cost dimensions default to 1.0)
```

---

#### Beef Lasagne

```
ingredients: ["beef mince", "pasta sheets", "tomato sauce", "ricotta", "mozzarella", "onion", "garlic"]
dietTypes: []  (assume not populated)

Path A: SKIPPED (no compatibleDiets)

Path B per member:
  Colin:
    excludedIngredients = []
    → no conflicts

  Daisy:
    excludedIngredients = ["milk", "cream", "cheese"]
    "ricotta" — does "ricotta".includes("cheese") or "cheese".includes("ricotta")? NO
    "mozzarella" — does "mozzarella".includes("cheese") or "cheese".includes("mozzarella")? NO
    → no Path B conflicts for Daisy from hardRestrictions

    NOTE: "ricotta" and "mozzarella" are not matched by "cheese" keyword.
    This is a precision gap: Daisy's dairy exclusion would need to include "ricotta" and
    "mozzarella" explicitly, or the ingredient_swaps / restriction-resolver must handle
    dairy-derived terms. The current household-meal-matcher.ts uses simple substring
    matching (not the canonical restriction resolver used by Tiers 1–3).

  Lilly:
    excludedIngredients includes "pasta":
    "pasta sheets" — "pasta sheets".includes("pasta") = TRUE → swap/remove
    excludedIngredients includes "chicken", "cream" — no match in this meal
    → MemberChange: { displayName: "Lilly", swaps: ["pasta sheets → GF pasta sheets" or "remove pasta sheets"] }

    NOTE: "beef mince" — "beef mince".includes("chicken") = NO, "beef mince".includes("cream") = NO
    Lilly's beef exclusion would require "beef" in hardRestrictions for Path B to catch it.
    If Lilly is classified as Vegetarian via defaultDietTypes only (not hardRestrictions),
    beef would not be caught unless Path A fires (requires compatibleDiets on the meal).

RESULT (assuming Lilly has "beef" in hardRestrictions and "pasta" in hardRestrictions):
  memberChanges: [Lilly(swaps)]
  explanation: "Fits 2 of 3 profiles · ..."

Can memberChanges[] be generated?  YES — for Path B conflicts (ingredient-level)
Can swapsNeeded[] be generated?    YES
Can explanation be generated?      YES
Can fitScore be generated?         YES

Key precision gap: Path A (dietary pattern) requires meal.dietTypes to be populated.
Without it, vegetarian/dairy conflicts are only caught when the SPECIFIC ingredient
is in hardRestrictions (e.g. "beef" must be explicit, not just "Vegetarian" diet type).
```

---

#### Spaghetti Bolognese

```
ingredients: ["beef mince", "spaghetti", "tomato passata", "onion", "garlic", "red wine", "herbs"]
dietTypes: []

Path B per member:
  Lilly (has "beef", "pasta"/"wheat" in hardRestrictions):
    "beef mince".includes("beef") = TRUE → swap/remove beef mince
    "spaghetti" — does it match "pasta" or "wheat"?
      "spaghetti".includes("pasta") = NO
      "spaghetti".includes("wheat") = NO
      "pasta".includes("spaghetti") = NO
      "wheat".includes("spaghetti") = NO
      → "spaghetti" NOT detected as a gluten conflict via substring matching
    
    PRECISION GAP: "spaghetti" contains gluten (wheat pasta) but the substring
    check does not connect "spaghetti" to "wheat" or "pasta". The canonical
    restriction resolver used by Tiers 1–3 (resolveIngredientRestrictions)
    handles derived/hidden ingredients. household-meal-matcher.ts uses
    raw substring matching only.

Can memberChanges[] be generated?  YES — for direct substring matches
Can swapsNeeded[] be generated?    YES
Can explanation be generated?      YES
Can fitScore be generated?         YES

Precision gap: raw substring matching misses indirect ingredient relationships
(spaghetti→wheat, ricotta→dairy, etc.) that the canonical resolver handles.
```

---

## Question 6 — One Engine or Two?

**One engine. Single source of truth.**

The computation inside `scoreTemplate()` (lines 262–317) has zero shell-specific logic. It is a pure function that takes:
1. `allSlotIngredients: string[]` — any ingredient list
2. `compatibleDiets: string[]` — any dietary tags
3. `members: MemberProfile[]` — household eater data
4. `settings: HouseholdSettings` — user settings
5. `swapMap: Map<string, string>` — ingredient swap rules

None of these inputs are shell-specific. The function name `scoreTemplate` and parameter type `MealTemplate` are the only shell-coupling.

**Cleanest architecture: extract a pure `scoreIngredientList()` function**

```
Current:
  matchMealsForHousehold()
    └── scoreTemplate(MealTemplate, members, settings, swapMap)
           ├── [assemble allSlotIngredients from slots]  ← shell-specific
           └── [core scoring logic]                      ← generic

Proposed:
  matchMealsForHousehold()
    └── scoreTemplate(MealTemplate, members, settings, swapMap)
           ├── [assemble allSlotIngredients from slots]  ← shell-specific
           └── scoreIngredientList(allSlotIngredients, compatibleDiets, base,
                                   extraPrepMinutes, timingMeta, costMeta,
                                   members, settings, swapMap)
                   └── [core scoring logic]  ← shared, generic

  New: scoreMealCompatibility(meal, members, settings, swapMap)
    ├── allSlotIngredients = meal.ingredients
    ├── compatibleDiets = meal.dietTypes
    ├── base = meal.ingredients  (whole recipe is the shared base)
    ├── extraPrepMinutes = 0
    ├── timingMeta = null
    ├── costMeta = null
    └── scoreIngredientList(...)  ← same function as above
```

This maintains a single scoring function, a single swap lookup, a single Path A/B logic. The only bifurcation is the input assembly, which is 7 lines for shells and 4 lines for meals.

**What about `MealMatch.template`?**

`MealMatch` currently holds `template: MealTemplate`. If extended to normal meals, a discriminated union avoids a fake template object:

```typescript
type CompatibilityMatch =
  | { kind: "template"; template: MealTemplate; /* ... */ }
  | { kind: "meal"; meal: Meal; /* ... */ }
```

Or simpler: extract only the compatible fields into a neutral `CompatibilitySource` type, and `MealMatch` holds that instead.

---

## Question 7 — Effort Estimates

### Option A — Minimal Adapter Layer

**What:** Create a function `mealToSyntheticTemplate(meal: Meal): Partial<MealTemplate>` that returns an object with `sharedBaseComponents = meal.ingredients` and `compatibleDiets = meal.dietTypes`. Call `scoreTemplate()` with this object.

**Change scope:**
- New function: ~15 lines
- `scoreTemplate()` signature accepts `Partial<MealTemplate>` instead of `MealTemplate` — or a duck-typed subset
- No changes to `matchMealsForHousehold`
- No changes to scoring functions

**Risk: LOW**
- Zero changes to existing code paths
- Existing shell scoring is untouched
- Adapter is isolated and independently testable
- `MealMatch.template` field holds a fake synthetic object — confusing for consumers

**Drawback:** `MealMatch.template` is semantically wrong for a normal meal. The fake template object has `id: undefined`, `isActive: undefined`, etc. Consumers that read `match.template.name` would get the meal name; consumers that read `match.template.id` would get undefined.

---

### Option B — Shared Compatibility Service (Recommended)

**What:** Extract the core scoring computation (lines 262–317) from `scoreTemplate()` into a standalone function `computeIngredientCompatibility(ingredientList, compatibleDiets, base, timingAndCostMeta, members, settings, swapMap): CompatibilityResult`. Both `scoreTemplate()` and a new `scoreMealCompatibility()` delegate to it.

**Change scope:**
- Extract inner function: ~60 lines moved, not rewritten
- `scoreTemplate()` calls the extracted function instead of containing the logic directly
- New `scoreMealCompatibility(meal, members, settings, swapMap)`: ~20 lines
- New `CompatibilityResult` type (subset of `MealMatch` fields): ~10 lines
- `matchMealsForHousehold` gains a `meals?: Meal[]` parameter or the caller pre-segments

**Risk: LOW-MEDIUM**
- Core logic is moved, not changed — full test coverage possible
- External API of `matchMealsForHousehold` can remain unchanged initially
- `MealMatch.template` issue is cleanly resolved (normal meals have a `meal` field instead)
- Slightly more surface area than Option A, but semantically cleaner

**This option preserves single source of truth and does not duplicate any scoring logic.**

---

### Option C — Major Refactor

Not required. The existing architecture is clean enough for Option B. No major refactor is warranted.

---

### Effort Summary

| Option | New lines | Changed lines | Risk | Semantic cleanliness |
|--------|-----------|---------------|------|---------------------|
| A (Adapter) | ~15 | ~5 | LOW | Poor (fake template object) |
| B (Shared service) | ~90 | ~70 | LOW-MEDIUM | Clean (discriminated union or separate path) |
| C (Major refactor) | — | — | — | Not needed |

---

## Question 8 — What Remains Unique About Shell Meals?

Shell meals remain architecturally distinct in three meaningful ways even after normal meals gain compatibility scoring:

### 1. Participation model vs adaptation model

Normal meal compatibility asks: "which of Lilly's hard restrictions conflict with this fixed recipe?" The answer is a list of ingredients to swap or remove from a specific dish.

Shell meal compatibility asks: "which components in this meal format are available to Lilly?" The answer is a list of valid options from the slot arrays — "pick from: black beans, tofu, chickpea patty" not "replace the chicken."

This is a fundamentally different experience for the cook. Normal meal adaptation involves modifying a recipe. Shell meal participation involves selecting from a menu of options. The code structure encodes this: shells have `proteinSlots: ["chicken", "tofu", "black beans"]` which explicitly presents alternatives. A normal meal has `ingredients: ["chicken"]` with no alternatives.

### 2. `estimatedExtraTimePerVariant` — shells know their preparation cost

Shells have an explicit per-variant time cost baked in. Taco Night knows that preparing an extra protein takes 5 minutes. This feeds `extraPrepMinutes` and `scoreTimeFit` with real data. Normal meals get `extraPrepMinutes = 0` from the adapter — which is wrong if the cook actually does need to prepare a variant, but the system has no data to estimate it.

### 3. Swap quality hierarchy

For a shell, "Lilly gets tofu from the proteinSlots array" is a first-class accommodation — the shell was designed for it. For a normal meal, "Lilly needs beef → lentils" is a runtime adaptation derived from the `ingredient_swaps` table. The shell's swap is structural; the normal meal's swap is inferred.

### Summary

Normal meals being scoreable does not make shells redundant. Shells provide:
- First-class multi-option presentation (pick from slot; no swap needed)
- Accurate prep time modelling per variant
- Explicit "this meal was designed for dietary variety" signal
- "Build your own" framing for participatory household cooking

Normal meal compatibility adds: "this fixed recipe works for everyone / here's what Lilly needs instead."

These are complementary, not competing.

---

## Question 9 — Final Verdict

**STATUS A — Existing compatibility engine can score normal meals with a lightweight adapter.**

Evidence:
1. `scoreTemplate()` lines 262–317 contain zero shell-specific logic
2. All six slot arrays are merged into one flat `string[]` at line 256 before any computation
3. `meal.ingredients[]` is structurally identical to that flat list
4. `meal.dietTypes` is semantically identical to `template.compatibleDiets`
5. All scoring functions (Path A, Path B, swap lookup, memberChanges, swapsNeeded, explanation, fitScore) work on `string[]` inputs with no slot identity awareness
6. The only hard requirement (`allSlotIngredients.length > 0`) is satisfied by any non-empty meal ingredient list
7. Missing time/cost metadata defaults gracefully to 1.0 scores

**One precision gap must be noted:** The household matcher uses raw substring matching (`ingredient.includes(exclusion)`). The canonical restriction resolver (`resolveIngredientRestrictions`, used by Tiers 1–3) handles derived/hidden ingredient relationships (spaghetti→wheat, ricotta→dairy, etc.). This gap already exists for shell templates — it is not introduced by the adapter. Closing this gap requires replacing the substring check with the canonical resolver, which is a separate improvement applicable to both shells and normal meals.

**Architecture recommendation:** Option B (Shared Compatibility Service). Extract ~60 lines of pure computation from `scoreTemplate()` into a standalone function. Both shells and normal meals call the same function. No logic is duplicated. The architecture enforces a single source of truth by construction.

---

## Architecture Summary

```
BEFORE (today):
  household-meal-matcher.ts
    scoreTemplate(MealTemplate)
      ├── [slot assembly]         ← shell only
      └── [compatibility scoring] ← used for shells only

AFTER (Option B):
  household-meal-matcher.ts
    scoreTemplate(MealTemplate)
      ├── [slot assembly]                 ← shells: intact, unchanged
      └── computeIngredientCompatibility() ← extracted, shared

    scoreMealCompatibility(Meal)
      ├── ingredients = meal.ingredients  ← adapter: 4 lines
      └── computeIngredientCompatibility() ← same shared function

SINGLE SOURCE OF TRUTH:
  computeIngredientCompatibility() — one function
  contains Path A, Path B, memberChanges, swapsNeeded,
  scoring, explanation — used by both shells and meals
  
PRECISION GAP (existing, not new):
  Raw substring matching vs canonical restriction resolver
  Affects both shells and normal meals equally
  Fixable as a separate improvement
```

---

## Risk Classification

| Risk | Severity | Notes |
|------|----------|-------|
| Regression to shell matching | LOW | `scoreTemplate()` is refactored by extraction only — logic unchanged |
| Precision gap (substring vs canonical resolver) | MEDIUM | Exists today for shells; adapter does not worsen it |
| `meal.dietTypes` sparsely populated | MEDIUM | Path A silent-skips when empty; Path B still fires on ingredient exclusions |
| `extraPrepMinutes` always 0 for normal meals | LOW | Bounded inaccuracy; `estimatedExtraTimePerVariant` field could be added to meals later |
| Time/cost score distortion (max 20%) | LOW | Defaults to 1.0 (generous, not penalising) |
| Adult eater data gap | HIGH (prerequisite) | Unchanged from prior investigation — must be resolved before compatibility scores are meaningful for adults |
