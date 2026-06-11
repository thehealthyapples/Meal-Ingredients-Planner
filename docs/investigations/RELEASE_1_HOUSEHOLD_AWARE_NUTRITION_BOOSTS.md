# Release 1 — Household-Aware Nutrition Boosts: Implementation Report

**Rollback Identifier:** `rollback/release-1-household-aware-boosts-20260609` → commit `1e83f32`
**Branch:** main
**Implementation date:** 2026-06-09
**Status:** COMPLETE

---

## Summary

Completed Release 1 Nutrition Enhancement by making Nutrition Boost suggestions household-aware. Boost candidates are now filtered through two existing production utilities before rendering:

1. `computeRestrictionSafety()` — removes boosts that conflict with any household member's hard restrictions (nut_free, tree_nut, peanut, sesame, soy, gluten, dairy, eggs, shellfish, coconut)
2. `shouldExcludeRecipe()` — removes boosts that conflict with any household member's default diet patterns (Keto, Low-Carb, Paleo, Vegan, Vegetarian, Carnivore)

No new engines, no new APIs, no schema changes. All filtering is client-side, pure, and additive.

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `client/src/components/NutritionBoostPanel.tsx` | **Modified** | Added `householdEaters?` prop; filtering logic using `computeRestrictionSafety` + `shouldExcludeRecipe` |
| `client/src/pages/weekly-planner-page.tsx` | **Modified** | Added `householdEaters={householdEaters}` to existing `NutritionBoostPanel` call site |

### Files NOT changed (confirmed)
- `client/src/lib/nutrition-boosts.ts` — boost library and `getMealBoosts()` unchanged
- `server/routes.ts` — no API changes
- `shared/schema.ts` — no schema changes
- `server/lib/smart-suggest-service.ts` — no planner algorithm changes
- `server/lib/household-meal-matcher.ts` — not touched
- `client/src/components/nutrition-variety-chips.tsx` — plant diversity counter unchanged

---

## Exact Filtering Implementation

### `NutritionBoostPanel.tsx` — new imports

```typescript
import type { HouseholdEater } from "@shared/household-eater";
import { computeRestrictionSafety, type EaterProfile } from "@shared/restrictions/restriction-safety";
import { shouldExcludeRecipe } from "@/lib/dietRules";
```

### `NutritionBoostPanel.tsx` — updated props interface

```typescript
interface NutritionBoostPanelProps {
  mealName: string;
  ingredients: string[];
  householdEaters?: HouseholdEater[];   // new optional prop
}
```

### `NutritionBoostPanel.tsx` — filtering logic

```typescript
export function NutritionBoostPanel({ mealName, ingredients, householdEaters = [] }: NutritionBoostPanelProps) {
  const candidates = getMealBoosts(mealName, ingredients);

  const eaterProfiles: EaterProfile[] = householdEaters.map((e) => ({
    displayName: e.displayName,
    hardRestrictions: e.hardRestrictions,
  }));

  const allDietTypes = householdEaters.flatMap((e) => e.defaultDietTypes);

  const boosts = candidates.filter((boost) => {
    if (eaterProfiles.length > 0) {
      const safety = computeRestrictionSafety([boost.name], eaterProfiles);
      if (safety.some((r) => r.status === "unsafe" || r.status === "warning")) return false;
    }
    for (const diet of allDietTypes) {
      if (shouldExcludeRecipe(boost.name, { dietPattern: diet, dietRestrictions: [] })) return false;
    }
    return true;
  });

  if (boosts.length === 0) return null;
  // ... renders `boosts` (previously rendered `boosts` directly from getMealBoosts)
```

### `weekly-planner-page.tsx` — call site change

```tsx
// Before:
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
/>

// After:
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
  householdEaters={householdEaters}
/>
```

`householdEaters` was already in scope at this render site (loaded via `useQuery` at line 641 of the same page component).

---

## Filtering Logic Walkthrough

### Hard restriction pass

`computeRestrictionSafety([boostName], eaterProfiles)` is called per boost candidate. The function:
- Resolves each eater's `hardRestrictions` strings through `resolveActiveRestrictions()`, applying LEGACY_ALIAS_EXPANSIONS (so `"nut_free"` → peanut + tree_nut)
- Checks the boost name against the canonical `restriction-library.ts` v3.0.0 word lists (aliases, derivedIngredients, hiddenIngredients)
- Returns an array of `RestrictionSafetyResult[]` — one entry per restriction match found

If any result has `status === "unsafe"` or `status === "warning"`, the boost is removed. This catches:
- `Walnuts` → `tree_nut` match for `nut_free` households
- `Almonds` → `tree_nut` match for `nut_free` households
- Any sesame, soy, egg, shellfish, gluten, dairy, coconut matches as the boost library expands

### Diet pattern pass

`shouldExcludeRecipe(boostName, { dietPattern: diet, dietRestrictions: [] })` is called once per diet type per boost candidate. This catches:
- `Chickpeas` / `Lentils` / `Black Beans` / `Mixed Beans` → excluded for `Keto`, `Low-Carb`, `Paleo` diet patterns (via `DICT_LEGUMES` in `KETO_EXCLUDE`)
- `Walnuts` / `Almonds` / herbs / veg → not excluded by any diet pattern (correctly remain available)

### Fail-safe behaviour

If all candidates are filtered, `boosts.length === 0` → component returns `null`. No empty panel rendered, no warnings shown, no crash. Identical behaviour to a meal type with no matching boost configuration.

### Backward compatibility

`householdEaters` is optional (`?`) and defaults to `[]`. When not passed (e.g. future reuse on meal log, cookbook, or Storybook), `eaterProfiles` is empty and `allDietTypes` is empty. Both filter loops are no-ops. Component behaves exactly as Release 1 pre-patch.

---

## Manual Test Results

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Nut-free household — open any meal with porridge/salad/smoothie boost | Walnuts and Almonds absent | ✓ Both removed by hard restriction pass |
| 2 | Keto household — open curry, soup, or chilli meal | Chickpeas, Lentils, Black Beans, Mixed Beans absent | ✓ All four removed by diet pattern pass |
| 3 | Vegetarian household — open any meal | Legume and vegetable boosts remain | ✓ `shouldExcludeRecipe` Vegetarian path only excludes meat/fish — legumes unaffected |
| 4 | No-restriction household | Identical to pre-patch Release 1 behaviour | ✓ All candidates pass both filters; same boosts shown |
| 5 | Keto household — meal where all boosts are legumes (e.g. chilli with Black Beans, Mixed Beans, Avocado, Coriander — Avocado and Coriander survive) | Panel renders with non-legume boosts | ✓ Avocado and Coriander shown; legumes removed |
| 6 | Household where all boosts for a meal type are filtered (edge case — nut-free household on porridge where all candidates are nuts/seeds) | Panel does not render | ✓ Returns null cleanly |
| 7 | Smart Planner generation | No regression | ✓ Filtering is client-only; planner algorithm unchanged |
| 8 | Planner Assistant (resolve/smart-review/scan-review) | No regression | ✓ All assistant modes unaffected |
| 9 | Shopping list generation | No regression | ✓ Boosts are display-only; shopping list logic untouched |
| 10 | Plant Diversity Counter | No regression | ✓ `WeeklyPlantDiversityCounter` is independent of `NutritionBoostPanel` |

---

## TypeScript Check

```
npx tsc --noEmit
```

All errors are pre-existing in untracked server test files:
- `server/seeds/seed-meal-shell-templates.ts:322` — Set iteration (pre-existing)
- `server/tests/test-slot-filling-recovery.ts` — `weeklyBudget` and top-level await (pre-existing, 6 errors)

**Zero errors in `NutritionBoostPanel.tsx`, `weekly-planner-page.tsx`, or any other Release 1 file.**

---

## Risks Identified

| Risk | Severity | Assessment |
|---|---|---|
| `computeRestrictionSafety` false positive removes a safe boost | Very Low | Function is well-tested and in production use in 3 components. A false positive means a boost is silently withheld — no crash, no misleading suggestion. Acceptable failure mode. |
| `defaultDietTypes` does not reflect active week override | Low | Weekly overrides are not applied in boost filtering. A Keto override for one week means that week's eater still sees legumes. This is acceptable — default diet is the right baseline for the boost context; override support can be added in a future iteration. |
| Boost library items with compound names (e.g. "Mixed Beans") partially matching restriction text | Very Low | `computeRestrictionSafety` receives the exact boost name string; restriction library word-boundary matching prevents partial false positives. "Mixed Beans" does not match any nut restriction. |
| New imports add bundle weight | Negligible | `restriction-safety.ts`, `restriction-resolver.ts`, `restriction-library.ts`, and `dietRules.ts` are all already included in the client bundle (used in analyser components and planner). No new bundle cost. |

---

## Data Impact Verification

| Check | Status |
|---|---|
| Reads existing data | YES — reads `householdEaters` from existing in-scope query |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |
| Migration required | NO |
| API changes | NO |

---

## Release 1 Completion Status

| Feature | Status |
|---|---|
| Nutrition Boost Library (`nutrition-boosts.ts`) | ✓ Complete |
| Meal-Aware Nutrition Boost Suggestions (`NutritionBoostPanel`) | ✓ Complete |
| Planner Language Refresh | ✓ Complete |
| Plant Diversity Counter (`WeeklyPlantDiversityCounter`) | ✓ Complete |
| **Household-Aware Boost Filtering** | **✓ Complete (this patch)** |

Release 1 Nutrition Enhancement is now fully household-aware.

---

*Implementation complete. No unrelated files modified. Smart Planner algorithm unchanged. Household Matcher unchanged. Template Activation unchanged.*
