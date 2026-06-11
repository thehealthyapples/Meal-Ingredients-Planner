# Meal Enhancement — Weekly Ingredient Reuse Implementation

**Date:** 2026-06-10
**Status:** Complete
**Rollback tag:** `rollback/meal-enhancement-weekly-reuse-impl-20260610-182339`

---

## Objective

Surface "Already used this week" labels on Meal Enhancement suggestions where the
recommended ingredient already appears in another meal in the current planner week.
Rank reuse suggestions (P1) ahead of discovery suggestions (P2), while enforcing the
Meal Fit Protection Rule at all times.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/lib/ingredient-reuse.ts` | **New** — normalisation pipeline + map builder + label formatter |
| `client/src/pages/weekly-planner-page.tsx` | Import + `weeklyReuseMap` useMemo + new props at `MealUpliftPanel` call site |
| `client/src/components/MealUpliftPanel.tsx` | Import + props interface + reuse-aware ranking + reuse label rendering |

---

## Architecture

### 1. `ingredient-reuse.ts` (client utility)

Three exports:

- `normaliseForReuse(ingredient)` — two-pass pipeline:
  1. `stripForMatch` — strips quantities, units, and 27 prep/modifier words (mirrors `normaliseIngredientForDedupe` from `server/lib/uplift-persistence.ts`)
  2. `resolveIngredientAlias` — canonicalises ~80 known variants (fresh basil → basil, baby spinach → spinach, extra virgin olive oil → olive oil)

- `buildWeeklyReuseMap(meals)` — walks `{ name, ingredients }[]`, normalises each ingredient, deduplicates meal names per key. Returns `Map<string, string[]>`.

- `getReuseLabel(ingredient, weeklyReuseMap, currentMealName)` — looks up key, filters out the current meal name (self-reference guard), formats:
  - 1 meal → `"Pizza Night"`
  - 2 meals → `"Pizza Night, Tomato Pasta"`
  - 3+ meals → `"Pizza Night, Tomato Pasta and 1 more"`
  - Not found → `null`

### 2. `weekly-planner-page.tsx`

`weeklyReuseMap` useMemo added after `weekIngredients`:

```typescript
const weeklyReuseMap = useMemo<Map<string, string[]>>(() => {
  if (!activeWeekData) return new Map();
  const mealsThisWeek = [];
  for (const day of activeWeekData.days) {
    for (const entry of day.entries) {
      const meal = mealById.get(entry.mealId);
      if (meal?.ingredients?.length) {
        mealsThisWeek.push({ name: meal.name, ingredients: meal.ingredients });
      }
    }
  }
  return buildWeeklyReuseMap(mealsThisWeek);
}, [activeWeekData, mealById]);
```

`MealUpliftPanel` call site now receives `currentMealName={meal.name}` and
`weeklyReuseMap={weeklyReuseMap}`.

### 3. `MealUpliftPanel.tsx`

**Reuse-aware ranking** replaces the previous `allSuggestions.slice(0, 2)`:

- Partition `allSuggestions` into `reuseSuggestions` (ingredient found in other meals this week) and `discoverySuggestions` (not found)
- Take max 1 from `reuseSuggestions` (P1 slot)
- Fill remaining slots from `discoverySuggestions` (P2)
- Combine: `[...selectedReuse, ...selectedDiscovery]`

This guarantees: max 1 reuse, min 1 discovery (when available), max 2 total.

**Reuse label** renders below `suggestion.why`:

```
Already used this week: Pizza Night
```

Styled `text-[10px] text-emerald-600/55` — subdued, non-intrusive.

---

## Meal Fit Protection

The uplift engine runs **server-side** before any of this code executes. The
`upliftMatches` prop is the already-filtered result set — only suggestions that
passed meal-fit matching are present. Reuse ranking operates on that set only.

Basil will never appear for Porridge regardless of reuse signals, because it will not
be present in `upliftMatches` for a porridge meal.

---

## Priority Order

1. Safety (hard restrictions, diet incompatibility — enforced by uplift engine)
2. Meal Fit (rule matching — enforced by uplift engine)
3. Weekly Reuse (client-side P1 slot — this implementation)
4. Nutrition Value (preserved: reuse only reorders, never adds)
5. Discovery / Variety (client-side P2 slot — always guaranteed min 1)

---

## Display Slot Rules

| Condition | Result |
|-----------|--------|
| ≥1 reuse suggestion + ≥1 discovery | 1 reuse + 1 discovery |
| No reuse suggestions | 2 discovery |
| Multiple reuse suggestions | 1 reuse (first) + 1 discovery |
| Only 1 valid enhancement total | 1 shown |

---

## User-Facing Copy

`Already used this week: {meal names}` — appears only on suggestions matching the
reuse map. Intentionally avoids:

- "already in pantry" / "in stock" / "already at home" — pantry is not live inventory
- "available" — implies certainty we don't have

---

## Normalisation

Exact equality on normalised canonical keys — **no substring matching**.

False positives on user-facing labels are unacceptable: "chicken stock" must not
match "chicken", "peanut butter" must not match "butter".

---

## Non-Goals (not implemented)

- Pantry awareness (not live inventory)
- Shopping list cross-referencing
- Reuse labels for accepted/provenance items
- Sorting within P1 or P2 by meal name alphabetically
- Reuse signal for NutritionBoostPanel (System 1 — static, out of scope)

---

## TypeScript Build

`npx tsc --noEmit` — zero new errors introduced. Pre-existing errors in
`server/seeds/` and `server/tests/` are unrelated to this work.

---

## Manual Test Scenarios

| Scenario | Expected |
|----------|---------|
| Basil used in Pizza Night; viewing another pizza → basil suggestion | "Already used this week: Pizza Night" label |
| Basil used in Pizza Night; viewing Porridge | Basil not in uplift suggestions (meal-fit gate) |
| Spinach used in 3 meals; viewing Chicken Stir-Fry | "Already used this week: Meal A, Meal B and 1 more" |
| No ingredients shared with other meals | 2 discovery suggestions, no labels |
| Viewing Pizza Night itself | basil label suppressed (self-reference filter) |
| Only 1 valid enhancement available | 1 suggestion shown |
| No uplift matches | Panel does not render |
| weeklyReuseMap not provided (prop absent) | Falls back to slice(0, 2) — all treated as discovery |

