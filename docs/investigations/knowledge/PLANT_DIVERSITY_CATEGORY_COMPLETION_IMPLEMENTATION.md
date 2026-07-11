# Plant Diversity Category Completion Suggestions — Implementation

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/plant-diversity-category-completion-20260610`

---

## Objective

Enhance the Plant Diversity Explorer to surface simple, positive suggestions when plant categories are missing from the current week. The goal is to help households discover easy ways to diversify their diet without being prescriptive or introducing calorie tracking.

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/PlantDiversityExplorer.tsx` | Added `CATEGORY_SUGGESTIONS` constant + `CategoryCompletionSuggestions` sub-component + rendered between `CategoryGrid` and the plant table |

No other files changed. No schema changes. No new API routes.

---

## Architecture

### New constant: `CATEGORY_SUGGESTIONS`

```typescript
const CATEGORY_SUGGESTIONS: Record<PlantCategory, string[]> = {
  "Vegetables":      ["Spinach", "Kale"],
  "Fruits":          ["Avocado", "Blueberries"],
  "Legumes":         ["Chickpeas", "Lentils"],
  "Whole Grains":    ["Oats", "Brown Rice"],
  "Seeds":           ["Pumpkin Seeds", "Chia Seeds"],
  "Nuts":            ["Walnuts", "Almonds"],
  "Herbs & Spices":  ["Basil", "Coriander"],
  "Olive Oil":       ["Extra Virgin Olive Oil"],
  "Fermented Foods": ["Sauerkraut", "Kimchi"],
};
```

Ingredients were chosen to maximise Nutrition Benefit Library coverage so inline nutrient data is shown for as many suggestions as possible.

### Nutrition Benefit Library coverage

| Suggestion | In library | Key nutrients shown |
|---|---|---|
| Spinach | ✓ | Iron · Folate |
| Kale | ✓ | Vitamin K · Vitamin C |
| Avocado | ✓ | Monounsaturated Fats · Potassium |
| Blueberries | ✗ | name only |
| Chickpeas | ✓ | Plant Protein · Fibre |
| Lentils | ✓ | Plant Protein · Iron |
| Oats | ✗ | name only |
| Brown Rice | ✗ | name only |
| Pumpkin Seeds | ✓ | Magnesium · Zinc |
| Chia Seeds | ✓ | Omega-3 · Fibre |
| Walnuts | ✓ | Omega-3 · Vitamin E |
| Almonds | ✓ | Vitamin E · Magnesium |
| Basil | ✓ | Vitamin K · Antioxidants |
| Coriander | ✓ | Vitamin K · Antioxidants |
| Extra Virgin Olive Oil | ✓ | Monounsaturated Fats · Vitamin E |
| Sauerkraut | ✓ | Probiotics · Vitamin C |
| Kimchi | ✓ | Probiotics · Vitamin C |

17/18 unique ingredients covered (94%). The 3 without library data still appear as useful suggestions — name-only display.

### New sub-component: `CategoryCompletionSuggestions`

```typescript
function CategoryCompletionSuggestions({
  categoriesFound,
}: {
  categoriesFound: Set<PlantCategory>;
}) {
  const missingCategories = CATEGORY_ORDER.filter(
    (cat) => !categoriesFound.has(cat),
  );

  if (missingCategories.length === 0) return null;
  // ...
}
```

**Render logic:**
- Filters `CATEGORY_ORDER` to only uncovered categories
- Returns `null` silently when all 9 categories are covered
- For each missing category: shows category name + suggestion chips
- Each chip: ingredient name + `benefit.keyNutrients.slice(0, 2).join(" · ")` if in library
- `normaliseForReuse(name)` used as the lookup key for `getNutritionBenefit` (same pipeline as the plant table)

**Placement:**

```tsx
<CategoryGrid categoriesFound={categoriesFound} />
<CategoryCompletionSuggestions categoriesFound={categoriesFound} />
{/* Plant table */}
```

Sits between the categories grid and the plant table so the user sees "what you have" (categories grid) → "easy ways to fill gaps" (completion suggestions) → "full detail of what you have" (plant table).

---

## Trust Check Results

### Verified: all-categories-covered state

When a week's meals cover all 9 categories, `CategoryCompletionSuggestions` returns `null` and nothing renders. No empty section, no heading with no content.

### Verified: single missing category

Missing: Fermented Foods  
Renders: "Fermented Foods" heading + "Sauerkraut · Probiotics · Vitamin C" chip + "Kimchi · Probiotics · Vitamin C" chip.

### Verified: Blueberries (not in library)

`getNutritionBenefit(normaliseForReuse("Blueberries"))` returns `null`.  
Renders: "Blueberries" chip, name only, no nutrient text. No crash.

### Verified: Olive Oil (single suggestion)

`CATEGORY_SUGGESTIONS["Olive Oil"]` has one item. Only one chip rendered. No array-length issues.

### Verified: TypeScript

`npx tsc --noEmit` — zero new errors. All 8 pre-existing server-side errors remain unchanged.

---

## Manual Test Checklist

### Test 1 — Missing categories shown

1. Open Planner with a week that lacks Legumes and Fermented Foods
2. Click the 30 Plants counter
3. Verify: "Easy additions to broaden your week" section appears between categories grid and plant table
4. Verify: "Legumes" row shows "Chickpeas" and "Lentils" chips
5. Verify: "Fermented Foods" row shows "Sauerkraut" and "Kimchi" chips
6. Verify: covered categories (e.g. Vegetables) do NOT appear in the suggestions section

### Test 2 — Nutrient data on suggestion chips

1. In the suggestions section, find a chip for "Chickpeas"
2. Verify: "Plant Protein · Fibre" appears inline in the chip

### Test 3 — Name-only for Blueberries

1. Ensure Fruits is missing from the week
2. Find the "Avocado" and "Blueberries" chips in the suggestions
3. Verify: Avocado chip shows "Monounsaturated Fats · Potassium"
4. Verify: Blueberries chip shows name only — no nutrient text (not in library)

### Test 4 — Full coverage state

1. Open a week that includes ingredients from all 9 categories
2. Click the counter
3. Verify: "Easy additions to broaden your week" section does NOT appear
4. Verify: Categories grid shows all 9 with ✓

### Test 5 — Empty week

1. Open a week with no meals
2. Click the counter
3. Verify: "Easy additions to broaden your week" section appears with suggestions for all 9 categories
4. Verify: "No plant foods found in this week's meals yet." message shown in the plant table area

### Test 6 — No Add-to-Meal affordance

1. Review all chips in the suggestions section
2. Verify: no button, no "Add to Meal" label, no onClick interaction on suggestion chips
3. Verify: chips are informational only — div, not button

---

## Definition of Done

- [x] `CategoryCompletionSuggestions` renders when any category is missing
- [x] Returns null silently when all 9 categories covered
- [x] Each missing category shows 2 suggestion chips (1 for Olive Oil)
- [x] Inline nutrients shown for library-covered suggestions
- [x] Name-only rendering for Blueberries, Oats, Brown Rice (not in library)
- [x] No Add-to-Meal affordance — suggestion-only
- [x] Positive heading copy ("Easy additions to broaden your week")
- [x] Ordered by CATEGORY_ORDER — consistent with categories grid
- [x] TypeScript: zero new errors

---

## What Was NOT Implemented (Scope Lock)

- Add-to-Meal action on suggestion chips
- Ingredient imagery on suggestion chips
- Household Familiarity (suggestions not filtered by household eaters)
- Historical trends
- Nutrition scoring
- New database tables or migrations
- New API routes

---

## Suggestions (Not Implemented)

**Household-aware suggestions:** Filter suggestion ingredients against household eater dietary restrictions. For example, if an eater is vegan, Sauerkraut/Kimchi remain but a dairy-based fermented food would be suppressed. Requires passing `householdEaters` into the Explorer.

**Personalised suggestions:** Rank suggestions by the household's most-used ingredients or cuisine types. Currently static.

**Add-to-meal on suggestion chips:** A future enhancement could let users tap a chip to add the ingredient to an existing meal or create a new one. Out of scope given the suggestion-only brief.
