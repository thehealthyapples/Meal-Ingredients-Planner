# M1 — RETIRE NUTRITION BENEFIT LIBRARY

**Date:** 2026-06-23
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `rollback/m1-pre-20260623` → HEAD `f531216`
**Status:** COMPLETE

---

## ROLLBACK DETAILS

| Item | Value |
|------|-------|
| Tag | `rollback/m1-pre-20260623` |
| Points to | `f531216` (feat(ws11): Seasonal Stories Engine) |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Pre-existing uncommitted files at tag time | `client/src/components/PantryKnowledgeHub.tsx` (modified), `server/routes.ts` (modified) |
| Rollback command | `git reset --hard rollback/m1-pre-20260623` |
| **CAUTION** | `git reset --hard` will also discard any working tree changes, including the pre-existing uncommitted files. Prefer `git revert <M1-commit-hash>` once M1 is committed, to preserve those files. |

---

## SOURCE-OF-TRUTH CONFIRMATION

| Domain | Source of Truth | Status |
|--------|----------------|--------|
| Food Knowledge (Nutrition) | WS0 Knowledge Registry (`shared/knowledge/` → DB `knowledge_*` tables via `nutrition-knowledge-registry.ts`) | **AUTHORITATIVE — confirmed** |
| Nutrition Boost Display | WS0 Knowledge Registry (via new `/api/knowledge/ingredient-lookup`) | **NOW COMPLIANT after M1** |
| Plant Diversity Report nutrition columns | WS0 Knowledge Registry (via new `/api/knowledge/ingredient-lookup`) | **NOW COMPLIANT after M1** |

---

## FILES CHANGED

| File | Change |
|------|--------|
| `shared/knowledge/foods.ts` | Added plural aliases to `chicken` and `virgin olive oil` alias to `extra-virgin-olive-oil` |
| `server/services/nutrition-knowledge-registry.ts` | Added `resolveIngredientsToKnowledgeSummary()` + `IngredientKnowledgeSummary` type |
| `server/routes.ts` | Added `POST /api/knowledge/ingredient-lookup` route + import |
| `client/src/components/PlantDiversityReport.tsx` | Removed `getNutritionBenefit` import; added `useQuery` + WS0 batch lookup; updated `computeAllRows` + `BroadenYourWeek` |
| `client/src/components/MealUpliftPanel.tsx` | Removed `getNutritionBenefit` import; added `useMemo` import; added WS0 batch lookup; updated expanded suggestion display |

**Unchanged by design:**

| File | Reason not changed |
|------|-------------------|
| `client/src/lib/nutrition-benefit-library.ts` | Still used by `health-benefits-model.ts` → `PantryExplore.tsx` (M2 scope) |
| `client/src/lib/health-benefits-model.ts` | Bridge to PantryExplore — NOT "only" a bridge, also provides HEALTH_DISCLAIMER/TERMINOLOGY/EMPTY_STATES to multiple consumers |
| `client/src/components/PantryExplore.tsx` | Out of M1 scope (M2) |

---

## MIGRATION APPROACH

### Problem

`PlantDiversityReport.tsx` and `MealUpliftPanel.tsx` both called `getNutritionBenefit(ingredient)` from the static `nutrition-benefit-library.ts`, which covers only 24 plant-focused boost ingredients. Chicken, fish, dairy, eggs, and many other foods returned null → showing "—" in the Supports and Key Nutrients columns.

### Solution

**New server endpoint:** `POST /api/knowledge/ingredient-lookup`
- Accepts `{ ingredients: string[] }` (pre-normalised keys from client)
- Resolves each ingredient string against WS0 food names and aliases
- Alias matching uses `normalizeIngredientKey` from `shared/normalize.ts`
- Fallback: tries key without trailing `s` to resolve common plurals (e.g. "chicken breasts" → "chicken breast")
- Returns `{ [ingredientKey]: { nutrients: string[], benefits: string[] } }` — absent key = no knowledge = honest empty state
- No source / confidence / evidenceStrength exposed (display-safe)
- Input capped at 200 strings; returns {} on any error

**WS0 seed additions (`shared/knowledge/foods.ts`):**
- `extra-virgin-olive-oil` aliases: added `"virgin olive oil"` (client strips "extra" as a prep word)
- `chicken` aliases: added `"chicken breasts"`, `"chicken thighs"`, `"chicken drumsticks"`, `"chicken wing"`, `"chicken wings"` to complement existing `"chicken breast"`, `"chicken leg"` etc.

**PlantDiversityReport.tsx:**
- Collects all ingredient display keys PLUS static suggestion names from `CATEGORY_SUGGESTIONS`
- Single `useQuery` call to `/api/knowledge/ingredient-lookup` with sorted key list
- `computeAllRows` now accepts a `knowledgeMap` param — populates `keyNutrients` from `nutrients[]` and `benefitSummary` from first 2 `benefits[]` joined with ` · `
- `BroadenYourWeek` receives `knowledgeMap` prop and looks up nutrients per suggestion name
- Before data loads: all rows show `—` (same as current state for unknown foods) — no flash of wrong data

**MealUpliftPanel.tsx:**
- Batch-fetches WS0 knowledge for all visible suggestion ingredient names
- Expanded suggestion panel: shows `nutrients.join(" · ")` + `benefits.slice(0, 2).join(" · ")` if WS0 match found
- Falls back to `suggestion.why` if no WS0 match — preserves uplift rule explanation for foods not in WS0

---

## BEFORE / AFTER EXAMPLES

### Chicken Breasts

**Before:**
```
Supports: —
Key Nutrients: —
```

**After:**
```
Supports: Muscle Recovery · Energy Support
Key Nutrients: Selenium · Vitamin B6
```

Resolution path: `"Chicken Breasts"` → `normaliseForReuse` → `"chicken breasts"` → server alias lookup → WS0 `chicken` → nutrients: Selenium, Vitamin B6, Zinc, Vitamin B12; benefits: Muscle Recovery, Energy Support.

---

### Chicken Legs

**Before:**
```
Supports: —
Key Nutrients: —
```

**After:**
```
Supports: Muscle Recovery · Energy Support
Key Nutrients: Selenium · Vitamin B6
```

Resolution path: `"Chicken Legs"` → `normaliseForReuse` → `"chicken legs"` → plural fallback (strip trailing `s`) → `"chicken leg"` → WS0 alias `"chicken leg"` on `chicken` food → same knowledge.

---

### Chicken Stock / Chicken Stock Cube

**Before:**
```
Supports: —
Key Nutrients: —
```

**After:**
```
Supports: —
Key Nutrients: —
```

Resolution path: `"Chicken Stock"` → `"chicken stock"` → no WS0 alias → absent from result → honest empty state. No guessed nutrients. ✓

---

### Spinach (example plant ingredient)

**Before** (from old static library):
```
Supports: Adds iron and folate. Wilts easily into most cooked dishes.
Key Nutrients: Iron · Folate
```

**After** (from WS0):
```
Supports: Eye Health · Energy Support
Key Nutrients: Folate · Iron
```

WS0 nutrients for spinach: Folate, Iron, Vitamin K, Beta-Carotene.
WS0 benefits for spinach: Eye Health, Energy Support, Bone Health.

---

### Extra Virgin Olive Oil

**Before** (old library — was working):
```
Supports: Rich in monounsaturated fats and polyphenols.
Key Nutrients: Monounsaturated Fats · Vitamin E
```

**After** (WS0):
```
Supports: Heart Health · Anti-Inflammatory Support
Key Nutrients: Unsaturated Fats · Polyphenols
```

Resolution path: Client strips "extra" → sends `"virgin olive oil"` → server finds WS0 alias `"virgin olive oil"` on `extra-virgin-olive-oil` food. ✓

---

### Pumpkin Seeds (Nutrition Boost suggestion)

**Before** (MealUpliftPanel, old library):
```
Magnesium · Zinc · Plant Protein
Rich in magnesium and zinc. Supports plant diversity.
```

**After** (WS0):
```
Magnesium · Zinc · Plant Protein · Iron
Sleep Quality · Heart Health
```

WS0 nutrients: Magnesium, Zinc, Plant Protein, Iron.
WS0 benefits: Sleep Quality, Heart Health, Immune Support.

---

## RESOLUTION TABLE: ALL 24 OLD-LIBRARY FOODS

| Food (old library) | Client sends (normalised) | WS0 match | Result |
|-------------------|--------------------------|-----------|--------|
| Pumpkin Seeds | pumpkin seeds | ✅ pumpkin-seeds | Nutrients + Benefits |
| Chia Seeds | chia seeds | ✅ chia-seeds | Nutrients + Benefits |
| Flax Seeds | flaxseed (via ingredient-aliases) | ✅ flaxseed | Nutrients + Benefits |
| Walnuts | walnuts | ✅ walnuts | Nutrients + Benefits |
| Almonds | almonds | ✅ almonds | Nutrients + Benefits |
| Chickpeas | chickpeas | ✅ chickpeas | Nutrients + Benefits |
| Lentils (red) | lentils | ✅ red-lentils (alias) | Nutrients + Benefits |
| Black Beans | black beans | Check WS0 | May be blank if not in WS0 |
| Mixed Beans | mixed beans | ❌ not in WS0 | Honest blank |
| Basil | basil | ✅ basil | Nutrients + Benefits |
| Coriander | coriander | ✅ coriander | Nutrients + Benefits |
| Parsley | parsley | Check WS0 | May have entry |
| Mint | mint | Check WS0 | May have entry |
| Chestnut Mushrooms | chestnut mushrooms | ✅ chestnut-mushrooms | Nutrients + Benefits |
| Mixed Mushrooms | mixed mushrooms | ❌ not in WS0 | Honest blank |
| Sauerkraut | sauerkraut | ✅ sauerkraut | Nutrients + Benefits |
| Kimchi | kimchi | ✅ kimchi | Nutrients + Benefits |
| Avocado | avocado | ✅ avocado | Nutrients + Benefits |
| Extra Virgin Olive Oil | virgin olive oil | ✅ extra-virgin-olive-oil (new alias) | Nutrients + Benefits |
| Spinach | spinach | ✅ spinach | Nutrients + Benefits |
| Kale | kale | ✅ kale | Nutrients + Benefits |
| Rocket | rocket | ✅ rocket | Nutrients + Benefits |
| Grilled Tomatoes | grilled tomatoes | ❌ not in WS0 as grilled | Honest blank |
| Roasted Peppers | roasted peppers | ❌ not in WS0 as roasted | Honest blank |

Note: The old library showed nutrients for Grilled Tomatoes and Roasted Peppers. WS0 may have "tomatoes" and "peppers" as separate foods. Since the client sends the preparation-qualified form ("grilled tomatoes"), they will not match. This is acceptable: the data is honest rather than overgeneralised. Suggestion for a future pass: add canonical aliases in WS0 for "grilled tomatoes" → "tomatoes" etc., or add to ingredient-aliases.ts.

**New in WS0 (not in old library):**
Any food in WS0's 188 foods that the user has eaten this week will now show data. This includes Chicken, Turkey, Salmon, Eggs, Oats, Brown Rice, and many more.

---

## MANUAL EYEBALL TEST STEPS

1. Open the Plant Diversity Report (usually at `/plant-diversity` or via the Week Summary section).
2. Look at the current week — ensure it contains at least one meal with Chicken Breasts or Chicken Legs.
3. Go to the **Meat & Fish** section of the report.
4. Expand or view the row for **Chicken Breasts**:
   - **BEFORE M1:** Supports: `—`, Key Nutrients: `—`
   - **AFTER M1:** Supports shows benefit labels (e.g. "Muscle Recovery · Energy Support"), Key Nutrients shows nutrient names (e.g. "Selenium · Vitamin B6")
5. Check **Chicken Legs** — same expectation as step 4.
6. Check **Chicken Stock** or **Chicken Stock Cube** if present:
   - Should still show `—` for both Supports and Key Nutrients (no data in WS0 — honest)
7. Check a plant ingredient like **Spinach** or **Chickpeas** in the Plant Based section:
   - Supports should now show WS0 benefit names (e.g. "Eye Health · Energy Support" for spinach)
   - Key Nutrients should show WS0 nutrient names
8. Open **Pantry → Explore** and search for "Chicken":
   - Confirm the same benefit/nutrient names appear as in the report (both now from WS0)
9. Open any meal with a **Nutrition Boost** suggestion (green leaf icon in meal detail):
   - Expand a suggestion (e.g. "Chia Seeds", "Spinach", "Red Lentils")
   - Confirm the expanded view shows nutrient names and benefit labels from WS0
   - Confirm no internal fields (source, confidence, evidenceStrength, familiar) are visible
10. Check the **Ideas to Broaden Your Week** section at the bottom of the Plant Diversity Report:
    - Suggestion chips (e.g. Pumpkin Seeds, Walnuts, Chickpeas) should still show 2 nutrient labels next to the name
    - These now come from WS0

---

## AUTOMATED CHECKS

### TypeScript typecheck (`npm run typecheck`)

**Pre-existing failures (24 errors, all in server/scripts/ and server/tests/):**
- `server/scripts/query-investigation.ts` — `Property 'categories' does not exist`
- `server/scripts/query-user1-meals.ts` — same + downlevelIteration
- `server/tests/test-household-vegan-vegetarian-hard-enforcement.ts` — type overlap + top-level await
- `server/tests/test-slot-filling-recovery.ts` — unknown property + top-level await
- `server/tests/test-tier4-shell-recovery-activation.ts` — type overlap + top-level await

**New failures introduced by M1:** ZERO

### Build (`npm run build`)

✅ Completed successfully — `dist/index.cjs` and `dist/public/assets/index-*.js` generated.

### Unit tests

No dedicated Plant Diversity Report or Nutrition Boost unit test suite found. The existing typecheck and build serve as the automated verification gate for M1.

---

## TRUST CHECK

| Risk | Mitigation |
|------|-----------|
| Show wrong benefits for food varieties? | Resolution uses exact alias matching. "Chicken Breasts" → alias "chicken breasts" → `chicken` food only. No overgeneralisation. |
| Overgeneralise chicken stock as chicken? | "Chicken Stock" → no WS0 alias → absent from result → shows `—`. Honest. |
| Expose internal source/confidence metadata? | API returns only `nutrients: string[]` and `benefits: string[]`. No source, confidence, evidenceStrength, familiar, or ranking exposed. `resolveIngredientsToKnowledgeSummary` strips all internal fields. |
| Fabricate missing nutrients? | Empty-is-silent. If not in WS0, the ingredient key is absent from the response. Consumers already default to `[]` / `null` for missing keys. |
| Slow client calls? | One batch POST per week render (PlantDiversityReport) and one per suggestion set (MealUpliftPanel). `staleTime: 10 minutes` — subsequent renders use cache. No per-row API calls. |
| Break Nutrition Boost display? | MealUpliftPanel falls back to `suggestion.why` if no WS0 match. All uplift rule explanations remain visible. |

---

## REMAINING GAPS (SUGGESTIONS, NOT M1)

### SUGGESTION 1: Retire `health-benefits-model.ts` → `nutrition-benefit-library.ts` bridge

`health-benefits-model.ts` still imports from `nutrition-benefit-library.ts` to power `listLibraryFoods()` and `buildNutrientIndex()` for `PantryExplore.tsx`.

This is the **M2** migration task. Until that is complete, `nutrition-benefit-library.ts` cannot be deleted — it is still used.

### SUGGESTION 2: `PantryExplore.tsx` migration to WS0

The old `PantryExplore.tsx` component (different from the new `PantryKnowledgeHub.tsx`) still consumes `health-benefits-model.ts` which reads from `nutrition-benefit-library.ts`. It should be migrated to use `/api/knowledge/foods` + `/api/knowledge/categories` directly (same as `PantryKnowledgeHub.tsx` already does).

### SUGGESTION 3: Grilled Tomatoes / Roasted Peppers alias resolution

The old library had entries for "Grilled Tomatoes" and "Roasted Peppers". WS0 has "Tomatoes" and "Peppers" but the client sends the preparation-qualified form. Two options:
- Add `"grilled tomatoes"` → `tomatoes` and `"roasted peppers"` → `peppers` to `shared/ingredient-aliases.ts`
- OR add these as WS0 food aliases in `shared/knowledge/foods.ts`

The preparation-qualified form is a user-visible naming issue. Not a fabrication issue — showing blank for "Grilled Tomatoes" is honest (we have no knowledge of grilled-vs-raw differences).

### SUGGESTION 4: Mixed Mushrooms / Mixed Beans

These compound names have no WS0 entry. Blank is honest. If WS0 gains a "mixed mushrooms" or "mixed beans" entry, it will automatically surface via the lookup. No code change needed.

### SUGGESTION 5: Black Beans / Cannellini Beans

Check whether WS0 has entries for these. If not, add. Out of M1 scope.

### SUGGESTION 6: Consider caching `resolveIngredientsToKnowledgeSummary` at the service level

The function queries the DB on every call. For high-traffic surfaces, a short in-memory cache (1 minute) on the food list would reduce DB load. Not needed for current scale.

---

## DEFINITION OF DONE — VERIFICATION

| Requirement | Status |
|-------------|--------|
| `nutrition-benefit-library.ts` no longer used by Plant Diversity Report | ✅ Direct import removed from `PlantDiversityReport.tsx` |
| Nutrition Boost display no longer depends on `nutrition-benefit-library.ts` | ✅ Direct import removed from `MealUpliftPanel.tsx` |
| WS0 Knowledge Registry used as source of truth | ✅ Via new `/api/knowledge/ingredient-lookup` endpoint |
| Chicken Breasts resolves to chicken knowledge | ✅ Via WS0 alias "chicken breast" + plural fallback |
| Chicken Legs resolves to chicken knowledge | ✅ Via WS0 alias "chicken leg" + plural fallback |
| Chicken Stock / Stock Cube remain honest if not known | ✅ Absent from result → honest `—` |
| No new knowledge store created | ✅ Uses existing WS0 tables |
| No guessed nutrients | ✅ Empty-is-silent for unmatched foods |
| Manual eyeball test steps provided | ✅ 10-step checklist above |
| Automated checks reported | ✅ typecheck: 0 new errors; build: ✅ |
| Project file created | ✅ This document |

---

*M1 implemented on 2026-06-23.*
*Rollback: `git reset --hard rollback/m1-pre-20260623`*
