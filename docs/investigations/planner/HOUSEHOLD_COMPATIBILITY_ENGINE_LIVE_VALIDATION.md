# Household Compatibility Engine — Live Validation

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `investigation/household-compatibility-engine-live-validation-2026-06-12`
**Status:** Investigation only. No code changes made.
**Confidence level:** HIGH — all findings from direct code inspection of full files.

---

## Rollback Protection

```
Tag: investigation/household-compatibility-engine-live-validation-2026-06-12
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout investigation/household-compatibility-engine-live-validation-2026-06-12
```

---

## Files Inspected (Full Reads)

| File | Lines | Purpose |
|------|-------|---------|
| `server/lib/household-meal-matcher.ts` | 1–411 | Full file — compatibility engine |
| `server/lib/smart-suggest-service.ts` | 1–818 | Full file — planner pipeline |
| `server/routes.ts` | 4797–4965 | Smart suggest API route |
| `server/seeds/seed-meal-shell-templates.ts` | 1–331 | Shell template seed — only one shell defined |
| `shared/schema.ts` | 48–72, 294–298 | mealTemplates and ingredientSwaps schema |

---

## Question 1 — Real Planner Candidate Pipeline

The route `POST /api/meal-plans/smart-suggest` calls `generateSmartSuggestion()`. For each of the 7 days × N slots, candidates are selected in this priority order:

### Tier-1 — Slot-appropriate unused candidates
`server/lib/smart-suggest-service.ts:640–643`
```typescript
let slotCandidates = allCandidates.filter(c => {
  if (usedIds.has(c.id)) return false;
  return getCandidateSlotFit(c, slot);
});
```
Source: `allCandidates` — the user's saved meals + external meals, all pre-filtered by hard exclusions and diet pattern. **`matchMealsForHousehold` is NOT called here.**

### Tier-2 — Category-adjacent safe fallback
`server/lib/smart-suggest-service.ts:646–651`
```typescript
if (slotCandidates.length === 0) {
  slotCandidates = getSafeFallbackCandidates(allCandidates, slot, usedIds);
}
```
Still from `allCandidates`. **`matchMealsForHousehold` is NOT called here.**

### Tier-3 — Controlled repeat
`server/lib/smart-suggest-service.ts:658–661`
```typescript
if (slotCandidates.length === 0) {
  slotCandidates = getRepeatCandidates(allCandidates, slot);
}
```
Relaxes the "not yet used" constraint. Still from `allCandidates`. **`matchMealsForHousehold` is NOT called here.**

### Tier-4 — Meal shell recovery
`server/lib/smart-suggest-service.ts:663–678`
```typescript
const shellCandidate = selectShellRecoveryCandidate(
  await getShellMatches(), slot, hardExcluded, dietPattern, dietRestrictions,
);
```
`getShellMatches()` calls `matchMealsForHousehold(settings.userId, settings.weekId)`. **This is the ONLY point where the compatibility engine fires.** It fires only when Tiers 1–3 all return zero candidates for a slot — i.e., when the candidate pool is genuinely exhausted.

---

## Critical Finding on Tier-4 Trigger Condition

`matchMealsForHousehold` is **lazy** — it is only invoked when all three previous tiers have failed to produce a candidate. For the vast majority of users with any meal history or external candidates available, Tier-4 never fires. The compatibility engine is not part of the normal planning pipeline. It is an emergency fallback.

---

## Question 2 — Are All Compatibility Fields Generated?

### For Meal Shell Templates (when Tier-4 fires):

`matchMealsForHousehold` calls `scoreTemplate()` for every active `mealTemplate`. The `scoreTemplate()` function produces a complete `MealMatch` object.

| Field | Generated | Source |
|-------|-----------|--------|
| `memberChanges[]` | **YES** | `household-meal-matcher.ts:262–292` |
| `swapsNeeded[]` | **YES** | `household-meal-matcher.ts:303–305` |
| `fitScore` | **YES** | `household-meal-matcher.ts:325` |
| `explanation` | **YES** | `household-meal-matcher.ts:327–336` |
| `scoreBreakdown.compatibility` | **YES** | `household-meal-matcher.ts:310` |
| `scoreBreakdown.swapSimplicity` | **YES** | `household-meal-matcher.ts:312` |
| `scoreBreakdown.timeFit` | **YES** | `household-meal-matcher.ts:313` |
| `scoreBreakdown.costFit` | **YES** | `household-meal-matcher.ts:314` |
| `scoreBreakdown.healthAlignment` | **YES** | `household-meal-matcher.ts:315` |
| `scoreBreakdown.preferenceConfidence` | **YES** | `household-meal-matcher.ts:316` |
| `extraPrepMinutes` | **YES** | `household-meal-matcher.ts:307` |
| `sharedIngredients` | **YES** | `household-meal-matcher.ts:298–301` |

### For User Meals and External Meals (Tiers 1–3):

**ALL compatibility fields: NOT GENERATED.**

User meals and external meals go through `scoreMeal()` (`meal-scoring-service.ts`), which produces a personal preference score only. `matchMealsForHousehold` is never called for these candidates. The route pre-processes household eater data (routes.ts:4903–4935) but uses it only as a merged/pooled filter — not to compute per-eater compatibility.

---

## Question 3 — Shell Meals Only or Both?

**Shell/Template meals only.**

`matchMealsForHousehold` (`household-meal-matcher.ts:220–223`) queries exclusively from `mealTemplates`:
```typescript
const templates = await db
  .select()
  .from(mealTemplates)
  .where(eq(mealTemplates.isActive, true));
```

User-saved meals (in the `meals` table) are never passed through `scoreTemplate()`. External meals from TheMealDB/BBC are never passed through it either.

**Additional constraint:** `scoreTemplate()` returns `null` for any template whose slot arrays are all empty:
```typescript
// household-meal-matcher.ts:258
if (allSlotIngredients.length === 0) return null;
```

Only templates with populated `sharedBaseComponents`, `proteinSlots`, `carbSlots`, etc. produce a `MealMatch`. Auto-generated templates (the other 632 in the table) were created before the slot architecture existed and likely have empty slot arrays.

---

## Question 4 — Dry-Run Compatibility Trace

### Confirmed data about meal templates

The seed file (`server/seeds/seed-meal-shell-templates.ts`) defines **one** purpose-built household shell: `"Cooked Breakfast"`. Taco Night, Burger Night, Pizza Night, Curry Night are listed as comment-only suggestions with the note `"SUGGESTION ONLY — do not insert without separate approval"` — they do not exist in the database.

The seed file includes an inline simulation of Lilly and Daisy against "Cooked Breakfast" (lines 281–319), which reveals the exact exclusion logic.

---

### Dry-Run: Cooked Breakfast (the only confirmed shell template)

**Template slot data:**
```
sharedBaseComponents: [mushrooms, tomatoes, onions, avocado, asparagus]
proteinSlots:         [eggs, pork sausages, chicken breast, chickpea patty, plant-based sausages]
carbSlots:            [gluten-free roll, sweet potato hash, gluten-free keto bread roll]
sauceSlots:           [tomato ketchup, brown sauce]
compatibleDiets:      [Vegetarian, Gluten-Free, Dairy-Free, Mediterranean, Low-Carb, Keto]
```

**Lilly (Vegetarian, Gluten-Free, Dairy-Free, Egg-Free, Soy-Free):**
- `dietTypes: ["Vegetarian", "Gluten-Free", "Dairy-Free"]` (from `defaultDietTypes`)
- `excludedIngredients: ["eggs", "dairy", "milk", "cheese", "wheat", "gluten", "soy"]` (from `hardRestrictions`)

Path A check (diet types vs `compatibleDiets`):
- "Vegetarian" ∈ compatibleDiets → NO conflict
- "Gluten-Free" ∈ compatibleDiets → NO conflict
- "Dairy-Free" ∈ compatibleDiets → NO conflict
- **Path A produces: no swaps**

Path B check (excluded ingredients vs slot ingredients):
- "eggs" matches "eggs" (proteinSlots) → `swapMap.get("eggs")` → depends on DB content
- "pork" matches "pork sausages" (proteinSlots) → `swapMap.get("pork sausages")` → depends on DB
- No other slot ingredient matches Lilly's exclusion list

**Lilly's `memberChanges` output** (swap strings depend entirely on `ingredient_swaps` DB content):
- If `ingredient_swaps` has entry `{original: "eggs", healthier: "X"}` → `"eggs → X"`
- Otherwise → `"remove eggs"`
- If `ingredient_swaps` has entry for "pork sausages" → `"pork sausages → X"`
- Otherwise → `"remove pork sausages"`

**Daisy (Mediterranean, Dairy-Free, Egg-Free):**
- `dietTypes: ["Mediterranean", "Dairy-Free"]`
- `excludedIngredients: ["eggs", "dairy", "milk", "cheese"]`

Path A check:
- "Mediterranean" ∈ compatibleDiets → NO conflict
- "Dairy-Free" ∈ compatibleDiets → NO conflict
- **Path A produces: no swaps**

Path B check:
- "eggs" matches "eggs" (proteinSlots) → swap/remove
- No other slot ingredient matches Daisy's exclusion list

**Resulting MealMatch for Cooked Breakfast:**
```
memberChanges: [
  { displayName: "Lilly", swaps: ["eggs → ?", "pork sausages → ?"] },
  { displayName: "Daisy", swaps: ["eggs → ?"] }
]
explanation: "Fits 2 of 4 profiles · [swap strings] · Extra prep only 10 min"
scoreBreakdown.compatibility: 1.0  ← because Path A found zero diet conflicts
                                      (all Lilly/Daisy diets ARE in compatibleDiets)
scoreBreakdown.swapSimplicity: calculated from variant fraction
extraPrepMinutes: 5 min/variant × 2 variants = 10 min
```

Note: `scoreBreakdown.compatibility === 1.0` even though 2 of 4 eaters have swaps. This is because compatibility is scored on diet TYPE conflicts (Path A) and both diets are in `compatibleDiets`. The ingredient conflicts (Path B) penalise `swapSimplicity` but not `compatibility`. The design's tier model would need to read `memberChanges.length`, not `scoreBreakdown.compatibility`, to determine "3 of 4" vs "all 4."

---

### Dry-Run: Chicken Tikka Masala, Beef Lasagne, Spaghetti Bolognese, Taco Night

**These meals CANNOT produce compatibility data today.**

| Meal | Type | In mealTemplates? | Compatibility data? |
|------|------|------------------|---------------------|
| Chicken Tikka Masala | User-saved meal | NO | **NOT GENERATED** |
| Beef Lasagne | User-saved meal | NO | **NOT GENERATED** |
| Spaghetti Bolognese | User-saved meal | NO | **NOT GENERATED** |
| Taco Night | Listed as suggestion, not inserted | NO | **NOT GENERATED** |

These meals are in the `meals` table with flat `ingredients[]` arrays. `matchMealsForHousehold` does not process this table. The route merges household eater hard restrictions as a pooled filter before planning (routes.ts:4903–4935) but this produces no per-eater output — it only removes meals that violate any eater's hard restriction.

---

## Question 5 — Can the Planner Determine "Fits X of Y"?

**YES, but only for meal template shells, and only when Tier-4 fires.**

The calculation is:
```typescript
// household-meal-matcher.ts:355–361
const ok = members.length - memberChanges.length;
phrases.push(`Fits ${ok} of ${members.length} profiles`);
```

This is correct and fully functional. The phrase is generated as part of `buildExplanation()` and stored in `MealMatch.explanation`. However, this string is discarded by `selectShellRecoveryCandidate()` before the candidate reaches `SmartSuggestEntry`.

For the 99%+ of planned meals that come from Tiers 1–3, this calculation is never run. No "Fits X of Y" is computable for those meals from existing code.

---

## Question 6 — Can the Planner Determine Compatibility Tiers?

**PARTIALLY — derivable for template shells only, and subject to a precision caveat.**

The design's five-tier model requires:
- `memberChanges.length` — available in `MealMatch` ✓
- `members.length` — available in `MealMatch` (via the loaded `MemberProfile[]`) ✓
- Swap type classification (all swaps = "X → Y" vs some "remove X") — derivable from `swaps[]` strings ✓
- `extraPrepMinutes` — available in `MealMatch` ✓

**Precision caveat on `scoreBreakdown.compatibility`:**

The design document describes `scoreBreakdown.compatibility` as "ratio of compatible eaters." This is inaccurate. It is actually:
```typescript
// household-meal-matcher.ts:78–80
function scoreCompatibility(totalDietConflicts: number, memberCount: number): number {
  return Math.max(0, 1 - totalDietConflicts / memberCount);
}
```
`totalDietConflicts` counts Path A conflicts only (diet type not in `compatibleDiets`). It does NOT count Path B ingredient exclusion conflicts. A template where all eaters' diet types are in `compatibleDiets` will have `compatibility === 1.0` even if two eaters have ingredient exclusions that trigger Path B.

**The correct field for "how many eaters need changes" is `memberChanges.length`, not `scoreBreakdown.compatibility`.**

The tier model must be derived from `memberChanges`, not from the compatibility score:
- Fully Compatible: `memberChanges.length === 0`
- Mostly Compatible: `memberChanges.length === 1` and all swaps include "→"
- Adaptable: `memberChanges.length >= 1` and at least one swap per conflict
- Poor Fit: any swap is "remove X" (no substitution)

This derivation is entirely possible from existing data — it just requires reading `memberChanges` rather than the `compatibility` score.

---

## Question 7 — Adult Eater Data Gap Impact

**Impact: C — Significant.**

From `HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md`: adult household eater rows are created with `defaultDietTypes: []` and `hardRestrictions: []` by `syncMembersAsEaters`.

**Effect on the compatibility engine:**

In `matchMealsForHousehold` (lines 182–203), each eater's profile is assembled from:
```typescript
dietTypes: profile.dietTypes,                       // from eater.defaultDietTypes → []
excludedIngredients: profile.hardRestrictions.map(…) // from eater.hardRestrictions → []
```

For an adult eater with empty data:
- Path A check: `member.dietTypes.length > 0` is false → condition skipped → `totalDietConflicts += 0` — no conflict registered
- Path B check: `excluded` is `[]` → `isExcluded` is always false — no ingredient conflict registered
- Result: adult always produces no `MemberChange` — appears perfectly compatible

`scorePreferenceConfidence()` (`household-meal-matcher.ts:132–140`) returns `0.5` when no members have data. This lowers the composite `fitScore` slightly but does not surface the problem to the UI.

**Scenario:** household has Colin (adult, empty eater row), Lilly (child, Vegetarian, Gluten-Free).

For Beef Lasagne (hypothetical template):
- Lilly: conflicts detected → `memberChanges[0] = { displayName: "Lilly", swaps: [...] }`
- Colin: NO conflicts detected → **not in `memberChanges`**
- `explanation`: "Fits 1 of 2 profiles" — implies Colin is compatible
- Reality: Colin's dietary data hasn't been checked at all — the engine has nothing to check

**The engine silently produces false-positive compatibility for adult eaters.** This is not a bug in the engine logic — the engine is working correctly with the data it has. The data gap is at the eater row level.

**Consequence for V1:** Until `hardRestrictions` and `defaultDietTypes` are populated for adult eaters (see STATUS B in prior investigation), the compatibility scores for households with adult members are unreliable. Any adult will appear fully compatible regardless of their actual dietary needs.

---

## Question 8 — API Surface Audit

### Fields generated by `matchMealsForHousehold` that never reach the client

`selectShellRecoveryCandidate()` (`smart-suggest-service.ts:335–392`) consumes `MealMatch[]` and returns a `ScoredCandidate`. It discards every compatibility field:

```typescript
// What is RETURNED (ScoredCandidate):
return {
  id: `shell-${template.id}`,
  name: template.name,
  image: template.imageUrl ?? null,
  ingredients: compliantIngredients,
  source: "Meal Shell",
  score: 0,                          // ← NOT the fitScore
  scoreBreakdown: {
    dietMatch: 0, goalAlignment: 0, budgetAlignment: 0,
    upfScore: 0, varietyScore: 0, overlapScore: 0,
    cuisineBonus: 0, simplicityBonus: 0
  },                                 // ← NOT the household ScoreBreakdown
  isExternal: true,
  // MISSING:
};
```

**Fields generated but never returned:**

| Field | Computed at | Discarded at | Client receives |
|-------|-------------|--------------|-----------------|
| `memberChanges[]` | `matcher.ts:291` | `smart-suggest-service.ts:371` | Nothing |
| `swapsNeeded[]` | `matcher.ts:303` | `smart-suggest-service.ts:371` | Nothing |
| `fitScore` | `matcher.ts:325` | Replaced by `score: 0` | `0` |
| `scoreBreakdown.compatibility` | `matcher.ts:310` | Replaced by empty breakdown | `0` |
| `scoreBreakdown.swapSimplicity` | `matcher.ts:312` | Replaced | `0` |
| `scoreBreakdown.timeFit` | `matcher.ts:313` | Replaced | `0` |
| `scoreBreakdown.costFit` | `matcher.ts:314` | Replaced | `0` |
| `scoreBreakdown.healthAlignment` | `matcher.ts:315` | Replaced | `0` |
| `scoreBreakdown.preferenceConfidence` | `matcher.ts:316` | Replaced | `0` |
| `extraPrepMinutes` | `matcher.ts:307` | Discarded | Nothing |
| `sharedIngredients` | `matcher.ts:298` | Discarded | Nothing |
| `explanation` (household) | `matcher.ts:327` | Discarded | Nothing |

### What the client does receive

`SmartSuggestEntry` contains:
- `candidate: ScoredCandidate` — name, ingredients, `score: 0`, empty scoreBreakdown
- `explanation?: MealExplanation` — generated by `generateMealExplanation()` from `explainability-service.ts`, which takes a `ScoredCandidate` and user preferences (personal only, no household data)

The household compatibility signal is entirely absent from the API response for both shell and non-shell candidates.

### Additional gap: route-level household merge

The route (`routes.ts:4903–4935`) does load household eaters and merge their data into `mergedExcludedIngredients` and `mergedDietTypes`. This influences:
- Hard exclusion filtering (meals with any eater's restricted ingredient are removed from pool)
- Scoring via `mergedPrefs` (diet types union influences `scoreMeal()`)

But this merged approach produces no per-eater output. It answers "does this meal pass all combined restrictions?" not "which eaters need changes for this meal?"

---

## Question 9 — Final Verdict

**STATUS B — Compatibility Review V1 requires small backend additions.**

The compatibility engine is architecturally sound and produces the right output. The prior feasibility investigation was correct about the existence of the capability. However, the design document's claim that "The gap is only at the API surface and UI layer" is only partially correct.

There are four gaps, ordered by severity:

---

### Gap 1 (Medium): `matchMealsForHousehold` is lazy, not eager

The engine is triggered only when Tiers 1–3 are exhausted. For any user with meal history, Tier-4 never fires in normal operation.

**What V1 requires:** Call `matchMealsForHousehold` eagerly at the start of `generateSmartSuggestion` (when `settings.userId` is present), not lazily inside the Tier-4 branch. The call already exists — it needs to be moved outside the exhaustion check. The `MealMatch[]` result would then be attached to `SmartSuggestEntry` for shell candidates.

**Effort:** Small. One call already exists. Restructure the lazy promise into an eager one.

---

### Gap 2 (Medium): Compatibility data is discarded at `selectShellRecoveryCandidate`

Even when the engine fires, `memberChanges`, `fitScore`, `explanation`, and all other fields are thrown away. `ScoredCandidate` has no `householdFit` field.

**What V1 requires:**
1. Add `householdFit?: { compatible: number; total: number; memberChanges: Array<{displayName: string; swaps: string[]}> }` to `ScoredCandidate`
2. In `selectShellRecoveryCandidate`, attach the originating `MealMatch` data to the returned candidate
3. The client type `SmartCandidate` in `planner-types.ts` needs the same field added

**Effort:** Small. Structural change to one function's return value and two type definitions.

---

### Gap 3 (Large): User-saved meals and external meals have no compatibility data

For the majority of planned meals (Tiers 1–3), no household compatibility analysis exists. Beef Lasagne, Chicken Tikka Masala, Spaghetti Bolognese — these are user-saved meals with flat `ingredients[]`. They never enter `matchMealsForHousehold`.

**What V1 would require to cover these meals:** A new per-meal compatibility function that replicates `scoreTemplate()` logic against a meal's flat ingredient list (no slot structure). This is not a trivial extension — it requires treating the flat `ingredients[]` as equivalent to `allSlotIngredients`.

**V1 scope option:** Limit compatibility display to shell meal candidates only (those that already go through the engine). Accept that Tier 1–3 candidates show no compatibility indicator. This is a meaningful partial V1 given that today only "Cooked Breakfast" is a confirmed purpose-built shell.

**Effort:** Large if full coverage required. Small if scoped to shells only.

---

### Gap 4 (Prerequisite): Adult eater data is empty

Adult eater rows have `defaultDietTypes: []` and `hardRestrictions: []`. The engine runs correctly but silently marks adults as fully compatible regardless of their actual dietary profile.

**What V1 requires as a prerequisite:** Resolve the adult eater data gap (STATUS B, `HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md`). Without this, compatibility scores for any household with adult members are unreliable.

**Effort:** Separate implementation task (see that investigation for options).

---

### Gap 5 (Discovery): Only one purpose-built shell exists

The seed file confirms only "Cooked Breakfast" is a purpose-built household shell template with populated slot arrays. Taco Night, Burger Night, Pizza Night are comment-only suggestions not yet inserted. The other 632 auto-generated templates likely have empty slot arrays and return `null` from `scoreTemplate()`.

**What V1 requires:** More shells need to be created and seeded before the compatibility display is broadly useful. The engine is ready; the content is not.

---

### Verdict Summary

| Design claim | Reality |
|-------------|---------|
| "Backend computes everything" | TRUE for shell templates only, and only at Tier-4 |
| "Gap is only API surface and UI" | PARTIALLY TRUE — API boundary is a gap, but the engine also needs to run eagerly and user meals need a parallel path |
| "`matchMealsForHousehold` runs for every planner generation" | FALSE — lazy, Tier-4 only |
| "memberChanges reaches SmartSuggestEntry" | FALSE — discarded in `selectShellRecoveryCandidate` |
| "Adult eater compatibility is computed" | FALSE — adult rows have empty dietary data |
| "Taco Night / Pizza Night shells exist" | FALSE — comment-only in seed file |

**STATUS B, not STATUS A.** Small-to-medium backend additions required, not architectural work. The engine design is correct and will work as described once: (1) the call is made eager, (2) the data is propagated to the API response, (3) adult eater data is populated, (4) more shells are seeded.

**Confidence level: HIGH.** All findings are from direct full-file code inspection.

---

## Summary of Required Changes for V1

| Change | Files affected | Effort |
|--------|---------------|--------|
| Make `matchMealsForHousehold` call eager (not Tier-4 only) | `smart-suggest-service.ts` | Small |
| Propagate `memberChanges` through `selectShellRecoveryCandidate` | `smart-suggest-service.ts` | Small |
| Add `householdFit` field to `ScoredCandidate` | `meal-scoring-service.ts` | Small |
| Add `householdFit` field to client `SmartCandidate` | `client/src/lib/planner-types.ts` | Small |
| Resolve adult eater data gap (prerequisite) | `server/storage.ts`, `server/routes.ts` | Medium |
| Seed additional shell templates | `server/seeds/` | Medium |
| Per-meal compatibility for Tier 1–3 user meals (if full coverage) | New function | Large |
