# VEGETARIAN / VEGAN HOUSEHOLD ENFORCEMENT PATH

## ROLLBACK

**Git Tag:** `rollback/pre-veg-vegan-enforcement-investigation`
**On Commit:** `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore: `git checkout rollback/pre-veg-vegan-enforcement-investigation`

---

## OBJECTIVE

Determine the safest implementation path for making Vegetarian and Vegan household eater diet patterns hard-enforced in Smart Planner (currently scoring-only).

---

## Q1: Current Flow Trace

### Child Household Eater — `defaultDietTypes = ["Vegetarian"]`

| Step | File:Line | What Happens |
|------|-----------|--------------|
| 1. Household load | routes.ts:4910 | `getHouseholdEaters(householdId)` — fetches all eaters including child rows |
| 2. Hard restrictions merge | routes.ts:4913–4916 | Child `hardRestrictions` added to `hardRestrictedSet` |
| 3. Diet type merge | routes.ts:4918–4921 | Child `defaultDietTypes` unioned into `mergedDietTypes` |
| 4. Build mergedPrefs | routes.ts:4937–4941 | `mergedPrefs = { ...prefs, dietTypes: mergedDietTypes }` |
| 5. Pass to planner | routes.ts:4954 | `generateSmartSuggestion(userId, settings, mergedPrefs, ...)` |
| 6. Pool construction | smart-suggest-service.ts:478–615 | Candidates iterated |
| 7. Hard exclusion gate | smart-suggest-service.ts:533 | `isHardExcluded()` — checks `hardExcludedIngredients` only |
| 8. Diet exclusion gate | smart-suggest-service.ts:551 | `candidateDietExcluded()` → `shouldExcludeRecipe()` |

**Critical finding at step 8:**

`candidateDietExcluded()` (smart-suggest-service.ts:224–240) calls `shouldExcludeRecipe()` from `dietRules.ts`, which receives `settings.dietPattern` — the **request user's own diet pattern**, not the merged household diet types.

`mergedPrefs.dietTypes` (which contains "Vegetarian" from the child eater) is passed to `scoreMeal()` in `meal-scoring-service.ts:116–126` where it applies a `dietMatch = -10` penalty — a scoring penalty only.

**Exact transition point to scoring-only:**
- `routes.ts:4937`: `mergedPrefs.dietTypes` is set to `mergedDietTypes` (union including child Vegetarian)
- `smart-suggest-service.ts:551`: `candidateDietExcluded()` receives `settings.dietPattern` (request user's pattern), NOT `mergedPrefs.dietTypes`
- `meal-scoring-service.ts:116`: `prefs.dietTypes` (which IS `mergedPrefs.dietTypes`) applies scoring penalty only

The child's Vegetarian preference enters `mergedPrefs.dietTypes` but `candidateDietExcluded()` is never called with it. Only the request user's `settings.dietPattern` triggers hard exclusion.

### For Vegan — Identical Flow

- `defaultDietTypes = ["Vegan"]` merges into `mergedDietTypes`
- `mergedPrefs.dietTypes` includes "Vegan"
- `meal-scoring-service.ts:116–126` uses `DIET_EXCLUDED_KEYWORDS["vegan"]` for scoring penalty
- `dietRules.ts:303–315` Vegan hard exclusion is never called via the household path

---

## Q2: Adult Eater Issue

### Where is adult diet pattern stored?

| Table | Column | Usage |
|-------|--------|-------|
| `users` | `dietPattern` | User's primary diet type (e.g., "Vegetarian", "Mediterranean") |
| `user_preferences` | `dietRestrictions` | Additional restrictions array |
| `household_eaters` | `defaultDietTypes` | Child-only: explicitly stored per-row |

### Does Smart Planner read adult household member diets?

**No — only the request user's own diet pattern is read.**

routes.ts:4825–4826:
```typescript
dietPattern: req.user?.dietPattern ?? null,
dietRestrictions: req.user?.dietRestrictions?.filter(Boolean) ?? [],
```

Adult household eaters whose `userId != req.user.id` have their `users.dietPattern` and `user_preferences.dietRestrictions` completely ignored during plan generation.

**The merge loop at routes.ts:4913–4921 reads `eater.hardRestrictions` and `eater.defaultDietTypes`.**

For an adult household eater (`kind = "user"`), `defaultDietTypes` is typically empty — their diet preference lives in `users.dietPattern`, which is never fetched.

### Is adult diet display-only elsewhere?

Yes — `users.dietPattern` is used for profile page display. It is not a dead column, but it is not fed into Smart Planner.

### Must Smart Planner enrich adult eaters from users/user_preferences?

**Yes — this is a missing feature.**

`household-meal-matcher.ts:243–266` (Tier-4 shell recovery) DOES enrich adult eaters:

```typescript
if (eater.userId != null) {
  // Adult: derive dietary data from profile
  const prefDietTypes = prefs?.dietTypes ?? [];
  if (prefDietTypes.length > 0) {
    dietTypes = prefDietTypes;
  } else if (userRow?.dietPattern) {
    const mapped = DIET_PATTERN_TO_DIET_TYPE[userRow.dietPattern];
    dietTypes = mapped ? [mapped] : [userRow.dietPattern];
  }
} else {
  // Child: use stored household_eaters values
  dietTypes = profile.dietTypes;
}
```

Smart Planner's routes.ts does not follow this pattern. The shell matcher is more correct than the main planner route here.

---

## Q3: Enforcement Semantics

### Vegetarian — excluded by `dietRules.ts:317–323`

| Category | Keywords Source | Examples |
|----------|----------------|---------|
| Meat | `MEAT_KEYWORDS` (dietRules.ts:35–40) | chicken, beef, pork, lamb, turkey, duck, bacon, ham, mince, sausage, veal, venison |
| Fish/Seafood | `FISH_SEAFOOD_KEYWORDS` (dietRules.ts:42–50) | fish, salmon, tuna, cod, haddock, prawn, shrimp, lobster, crab, squid |
| Derived | Hardcoded (dietRules.ts:321) | gelatin, gelatine, lard, suet, rennet |
| Named dishes | `DISH_NAME_MEAT_OR_SEAFOOD` (dietRules.ts:57–63) | carbonara, ragu, bolognese, birria, ossobuco |

**Dairy and eggs are NOT excluded by Vegetarian** (by correct definition).

### Vegan — excluded by `dietRules.ts:303–315`

Everything in Vegetarian, plus:

| Category | Keywords Source | Examples |
|----------|----------------|---------|
| Dairy | `DAIRY_KEYWORDS` (dietRules.ts:27–33) — with plant-milk safe-list | milk, cream, butter, cheese, yogurt, parmesan, mozzarella, feta, ghee, whey, casein, kefir |
| Eggs | Hardcoded (dietRules.ts:312) | egg, eggs |
| Honey | Hardcoded (dietRules.ts:312) | honey |
| Gelatin | Hardcoded (dietRules.ts:312) | gelatin, gelatine |

Plant milk safe-list (dietRules.ts:225–232, via `removePlantMilkPhrases()`):
- almond milk, oat milk, soy milk, coconut milk, rice milk, hemp milk, cashew milk, hazelnut milk, pea milk, macadamia milk, oat mylk, coconut cream, oat cream, soya cream, cashew cream, rice cream

Additional `excludedCompounds` layer in `restriction-library.ts:162–186` provides defensive double-protection for plant milks.

### Vegan supersedes Vegetarian?

**Yes — inherently.** Vegan is a strict superset of Vegetarian exclusions. Both run through `shouldExcludeRecipe()`. If a household has both, the union of exclusions applies. No explicit precedence logic is needed.

---

## Q4: Implementation Options

### OPTION A — Hard filter pass on merged household diet types inside smart-suggest-service

**Files touched:**
- `server/lib/smart-suggest-service.ts` — add household diet loop in pool construction
- `server/routes.ts` — pass `mergedDietTypes` down into settings or as a separate param

**Behaviour change:**
- After user diet exclusion check (line 551), loop each diet in `mergedDietTypes`
- Call `shouldExcludeRecipe()` per diet type
- Meals excluded by any household diet are removed from pool

**Blast radius:** Low — isolated to pool construction phase. No schema changes, no migration.

**Risk:** Low — reuses existing `shouldExcludeRecipe()` engine. New call site only.

**Testability:** Good — unit test with constructed candidates + diet list. Integration test with household fixture.

**Schema needed:** No

**Migration needed:** No

**Shell matching affected:** Not directly — Tier-4 shell recovery has its own gate. Would need separate alignment work.

**Existing user profile enforcement affected:** No — user's own `dietPattern` continues unchanged. Household diets are additive.

---

### OPTION B — Add `householdHardDietPatterns` to SmartSuggestSettings and call `candidateDietExcluded()` per pattern

**Files touched:**
- `server/lib/smart-suggest-service.ts` — extend `SmartSuggestSettings` interface, apply per-pattern loop
- `server/routes.ts` — build `householdHardDietPatterns` from household eater union

**Behaviour change:**
- `settings.householdHardDietPatterns = ["Vegetarian"]` for a household with a vegetarian child
- In pool construction, loop each pattern and call `candidateDietExcluded({ dietPattern: p, ... })`

**Blast radius:** Very low — additive new field, no mutation of existing fields. Clean separation from user pattern.

**Risk:** Very low — explicit intent, no ambiguity between user diet and household diet.

**Testability:** Best of all options — field is visible in settings, testable in isolation.

**Schema needed:** No

**Migration needed:** No

**Shell matching affected:** `selectShellRecoveryCandidate()` would need `householdHardDietPatterns` passed in. Currently only receives `dietPattern` and `dietRestrictions`.

**Existing user profile enforcement affected:** None.

---

### OPTION C — Translate Vegetarian/Vegan into excluded ingredient groups and treat as hard restrictions

**Files touched:**
- `server/routes.ts` — add diet-to-ingredients translation step in household merge

**Behaviour change:**
- For each Vegetarian eater, add "meat", "fish" to `hardExcludedIngredients`
- For each Vegan eater, add "meat", "fish", "dairy", "egg", "honey" to `hardExcludedIngredients`
- Existing `isHardExcluded()` via restriction resolver catches these

**Blast radius:** Moderate — conflates dietary preferences with allergies/medical restrictions.

**Risk:** Moderate-high. Semantic mismatch: treating a lifestyle choice as a medical restriction. No override path. If a user wants to temporarily allow meat for a guest meal, they cannot without changing a hard restriction. Also: the restriction resolver uses category-based matching, not keyword matching — translating "Vegetarian" to a category string may not match correctly without aligning with `restriction-library.ts` category IDs.

**Testability:** Harder to test because the effect is spread through the restriction resolver path.

**Schema needed:** No

**Migration needed:** No

**Shell matching affected:** Yes — `selectShellRecoveryCandidate()` already respects hard restrictions, so this would propagate automatically.

**Existing user profile enforcement affected:** Could collide if user has explicit ingredient preferences that overlap with the injected restrictions.

**Not recommended.**

---

### OPTION D — Dedicated `isHouseholdDietExcluded()` helper, explicit gate in pool construction

**Files touched:**
- `server/lib/smart-suggest-service.ts` — new helper, new gate call
- `server/routes.ts` — pass household diet types alongside existing settings

**Behaviour change:**
- New function: `isHouseholdDietExcluded(candidate, householdDietTypes: string[]): boolean`
- Loops each diet type, calls `shouldExcludeRecipe()` with synthetic settings
- Called after existing user diet gate in pool construction loop

**Blast radius:** Very low — entirely additive new function. Zero mutations to existing code paths.

**Risk:** Very low. Explicit naming. New code path, existing code unchanged.

**Testability:** Best — unit test the helper directly, independent of routing.

**Schema needed:** No

**Migration needed:** No

**Shell matching affected:** Same as Option A — Tier-4 shell recovery needs separate alignment.

**Existing user profile enforcement affected:** None.

**Assessment:** Option D is the cleanest implementation. Option B is equivalent but slightly wider because it changes the settings interface. For implementation, prefer Option D as the core engine change and Option B's settings field as the data carrier.

---

## Q5: Household Precedence

### Colin (Omnivore) + Lilly (Vegetarian) — what should happen?

**Option A:** Exclude meat entirely from the shared plan. Both eat vegetarian. Colin loses meat diversity.

**Option B:** Allow meat meals but provide a vegetarian adaptation for Lilly via shell/variant system.

**Current system capability:**

Option A is what hard enforcement would do — and it is safe to implement now.

Option B requires a variant system. Assessing current Tier-4 shell recovery:

`household-meal-matcher.ts:334–419` (`computeIngredientCompatibility`) identifies conflicts and suggests ingredient swaps:
```typescript
// If a swap rule exists: beef → mushroom
const healthier = swapMap.get(key);
swaps.push(healthier ? `${ingredient} → ${healthier}` : `remove ${ingredient}`);
```

However, shell recovery finds **alternative meal templates**, not variants of the selected meal. A beef template would have `compatibleDiets` that does not include "Vegetarian", so shell recovery would log a diet conflict and seek a different template — not produce a vegetarian version of the beef meal.

**Conclusion:** The current system cannot produce a vegetarian variant of a meat meal. No variant UI exists. Tier-4 is a "find a different meal" fallback, not a swap engine.

**Safe approach now:** Option A only. Exclude meat entirely for any household containing a Vegetarian eater.

---

## Q6: Shell Interaction

### Should household diet enforcement apply before, inside, or after Tier-4 shell recovery?

**Current shell recovery gate** (`smart-suggest-service.ts:339–397`):

```typescript
// Per slot ingredient:
const compliantIngredients = allSlotIngredients.filter(ing =>
  !candidateHardExcluded(ing, [ing], hardExcluded) &&
  !candidateDietExcluded({ name: ing, ingredients: [ing] }, dietPattern, dietRestrictions)
);

// Per template:
if (candidateHardExcluded(template.name, compliantIngredients, hardExcluded)) continue;
if (candidateDietExcluded({ name: template.name, ... }, dietPattern, dietRestrictions)) continue;
```

The shell recovery applies `dietPattern` (request user's own) but NOT household eater diet types.

**Answer:** Enforcement should apply **inside** Tier-4 shell matching, not before it.

Reasoning:
- The purpose of Tier-4 is to find any compliant meal when the scored pool is exhausted
- If household diet enforcement is only applied before Tier-4, shell recovery can produce non-compliant shells
- If applied inside, the shell selector rejects non-compliant templates before proposing them

Specific insertion point: after the existing `candidateDietExcluded(template...)` check, add a loop over `householdDietTypes` calling `shouldExcludeRecipe()` per type.

Both the main pool construction AND shell recovery need the enforcement — they share the same semantic contract.

---

## Q7: Test Cases

### Vegetarian Household Eater

| Meal | Key Ingredient | Expected | Reason |
|------|---------------|----------|--------|
| Chicken Stir Fry | chicken | EXCLUDED | `MEAT_KEYWORDS` (dietRules.ts:319) |
| Beef Bolognese | beef + bolognese | EXCLUDED | `MEAT_KEYWORDS` + `DISH_NAME_MEAT_OR_SEAFOOD` |
| Pork Ramen | pork | EXCLUDED | `MEAT_KEYWORDS` |
| Salmon Fillet | salmon | EXCLUDED | `FISH_SEAFOOD_KEYWORDS` |
| Cheese Omelette | eggs, cheese | **ALLOWED** | Dairy/eggs not in Vegetarian exclusions |
| Chickpea Curry | chickpeas | **ALLOWED** | Plant-based |
| Lentil Soup | lentils | **ALLOWED** | Plant-based |
| Roasted Vegetables | vegetables | **ALLOWED** | Plant-based |
| Carbonara | carbonara (name) | EXCLUDED | `DISH_NAME_MEAT_OR_SEAFOOD` even if no explicit meat keyword |

### Vegan Household Eater

| Meal | Key Ingredient | Expected | Reason |
|------|---------------|----------|--------|
| Chicken Curry | chicken | EXCLUDED | `MEAT_KEYWORDS` |
| Fish Pie | fish, butter | EXCLUDED | `FISH_SEAFOOD_KEYWORDS` |
| Cheese Sandwich | cheddar | EXCLUDED | `DAIRY_KEYWORDS` |
| Milk Porridge | milk | EXCLUDED | `DAIRY_KEYWORDS` |
| Scrambled Eggs | egg | EXCLUDED | hardcoded "egg" |
| Honey Cake | honey | EXCLUDED | hardcoded "honey" |
| Bean Chilli | beans | **ALLOWED** | Plant-based |
| Roasted Vegetables | vegetables | **ALLOWED** | Plant-based |
| Oat Milk Latte | oat milk | **ALLOWED** | `removePlantMilkPhrases()` safe-list |
| Coconut Milk Curry | coconut milk | **ALLOWED** | `removePlantMilkPhrases()` safe-list (post plant-milk fix) |
| Tofu Stir Fry | tofu | **ALLOWED** | Soy not in Vegan exclusions |

### Mixed Household: Colin (Omnivore) + Lilly (Vegetarian)

- Merged diet types: `["Vegetarian"]`
- Expected pool: vegetarian meals only
- Chicken excluded, fish excluded
- Cheese omelette allowed, chickpea curry allowed

### Mixed Household: Colin (Keto) + Lilly (Vegetarian)

- Colin's `dietPattern = "Keto"` — hard-excludes high-carb (bread, pasta, rice, sugar)
- Lilly's Vegetarian merged into `mergedDietTypes`
- Combined effect: low-carb AND vegetarian meals only
- Edge risk: very few meals satisfy Keto+Vegetarian intersection — pool may be small
- Bolognese excluded (Vegetarian rule + named dish), bread excluded (Keto rule)

### Daisy (Mediterranean) + Lilly (Vegan)

- Daisy's `dietPattern = "Mediterranean"` — scoring-only, no hard exclusions
- Lilly's Vegan merged into `mergedDietTypes`
- Current (broken) behaviour: Vegan scoring penalty only, meat/dairy still in pool
- Desired behaviour after fix: Vegan hard exclusion applied, only vegan-safe meals

### Adult Non-Request-User Vegetarian

- Colin requests plan; household contains adult Alice (userId=5) with `users.dietPattern = "Vegetarian"`
- Alice's `household_eaters.defaultDietTypes = []` (not populated from users table)
- Current behaviour: Alice's Vegetarian preference **ignored** — no merge occurs
- Required fix: Fetch Alice's `users.dietPattern`, convert to diet type, merge like child eater

### Adult Non-Request-User Vegan

Same gap as above — adult Vegan preference stored in `users.dietPattern`, not read, not enforced.

---

## Q8: Final Recommendation

### STATUS B — Needs adult eater enrichment first, then enforcement

**Justification:**

**Problem 1 — Adult eater diet types are not read (routes.ts:4825–4826)**

```typescript
dietPattern: req.user?.dietPattern ?? null,          // request user only
dietRestrictions: req.user?.dietRestrictions?.filter(Boolean) ?? [],  // request user only
```

Any adult household member with `userId != req.user.id` has their `users.dietPattern` silently ignored. Their `household_eaters.defaultDietTypes` is typically empty (that column is designed for children). Implementing hard enforcement now without fixing this would produce inconsistency: child Vegetarian is enforced, adult Vegetarian is not.

**Problem 2 — Household diet types reach scoring only (routes.ts:4937, meal-scoring-service.ts:116)**

`mergedPrefs.dietTypes` flows into `scoreMeal()` as a scoring input, not into `candidateDietExcluded()` as a hard gate. The diet type union from child eaters currently only changes scores, not the candidate pool.

**Precedent confirming enrichment pattern exists:**

`household-meal-matcher.ts:243–266` already enriches adult eaters from `users.dietPattern` for Tier-4 shell recovery. Smart Planner's routes.ts must follow the same pattern.

---

### Recommended Implementation Sequence

**Phase 1 — Adult Eater Enrichment (prerequisite)**

File: `server/routes.ts` — household eater merge loop (lines 4908–4935)

Change: For eaters with `userId != null` (adult kind), fetch `users.dietPattern` and `user_preferences.dietRestrictions`. Convert `dietPattern` via `DIET_PATTERN_TO_DIET_TYPE` mapping (same as `household-meal-matcher.ts:263`). Merge into `mergedDietTypes`.

Risk: Low. Additive. If adult has no dietPattern, behaviour unchanged. Non-breaking.

**Phase 2 — Hard Enforcement (post Phase 1)**

File: `server/lib/smart-suggest-service.ts` — pool construction loop, after line 551

Change: Add a `householdDietTypes` parameter. Loop each diet type and call `shouldExcludeRecipe()`. Use Option D (dedicated helper) or Option B (explicit settings field). Do not mix into `hardExcludedIngredients` (Option C rejected — semantic mismatch).

Risk: Medium. New exclusion layer. Reduces pool for mixed-diet households. Test with small household fixtures before shipping.

**Phase 3 — Shell Recovery Alignment**

File: `server/lib/smart-suggest-service.ts` — `selectShellRecoveryCandidate()` (lines 339–397)

Change: Pass `householdDietTypes` into shell selector. Apply same hard diet loop inside Tier-4 candidate loop.

Risk: Low. Consistent with Phase 2. Shell recovery already filters by user dietPattern; household types are additive.

---

### What is NOT needed

- No schema changes
- No database migrations
- No UI changes
- No changes to `dietRules.ts` (existing `shouldExcludeRecipe()` is correct and complete)
- No changes to `restriction-library.ts`

---

*Investigation complete. No code was modified. Tag `rollback/pre-veg-vegan-enforcement-investigation` is safe.*
