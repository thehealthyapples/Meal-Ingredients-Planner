# Plant Diversity Explorer — Implementation

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/plant-diversity-explorer-20260610`

---

## Objective

Expand the existing 30 Plants This Week counter into a full educational report view. The Explorer gives households visibility into which plants they're eating, which meals contribute, and which nutrients are represented — without introducing calorie tracking, macro counts, or any new data schema.

---

## Files Changed

| File | Change |
|---|---|
| `client/src/lib/nutrition-variety.ts` | Added `PlantCategory` type and `getPlantCategory()` export |
| `client/src/components/PlantDiversityExplorer.tsx` | New component — full Explorer UI |
| `client/src/components/nutrition-variety-chips.tsx` | Added `onExplore` prop to `WeeklyPlantDiversityCounter` |
| `client/src/pages/weekly-planner-page.tsx` | Wired up Explorer: `weekMealsData` memo, `plantExplorerOpen` state, dialog render |

---

## Architecture

### New export: `getPlantCategory` (`nutrition-variety.ts`)

```typescript
export type PlantCategory =
  | "Vegetables" | "Fruits" | "Whole Grains" | "Herbs & Spices"
  | "Olive Oil" | "Legumes" | "Seeds" | "Nuts" | "Fermented Foods";

export function getPlantCategory(ingredient: string): PlantCategory | null
```

Uses the same nine word lists and priority order as `isPlantIngredient`. Herbs & Spices checked before Vegetables to prevent "chilli powder" matching "chilli" in the vegetables list.

`computeMealVariety`, `VarietyScore`, `NutritionVarietyDots`, and `DayVarietySummary` are **completely unchanged**.

---

### New component: `PlantDiversityExplorer.tsx`

A Dialog-based report view triggered when the user clicks/taps the `WeeklyPlantDiversityCounter`.

**Props:**

```typescript
interface PlantDiversityExplorerProps {
  open: boolean;
  onClose: () => void;
  weekMeals: WeekMealEntry[];
}

interface WeekMealEntry {
  mealName: string;    // e.g. "Pizza Night"
  dayName: string;     // e.g. "Mon"
  ingredients: string[];
}
```

**Data computation (`computePlantData`):**

For each ingredient across all meals:
1. `isPlantIngredient(raw)` — skip non-plants
2. `normaliseForReuse(raw)` → canonical key (e.g. "cherry tomatoes" → "tomatoes")
3. Track meal names, day names, and raw variant forms per canonical key
4. `getPlantCategory(canonicalKey)` — assigns the plant to a category
5. `getNutritionBenefit(canonicalKey)` — attaches key nutrients and benefit summary

Rows are sorted by category order (Vegetables → Fruits → Legumes → Whole Grains → Seeds → Nuts → Herbs & Spices → Olive Oil → Fermented Foods), then alphabetically within each category.

**Variant logic:**

When multiple raw forms resolve to the same canonical key, variants are recorded. The variant is only shown if its display form differs from the canonical display name:
- "cherry tomatoes" → canonical "Tomatoes" → variant "Cherry Tomatoes" ✓
- "tomatoes" → canonical "Tomatoes" → not shown (same) ✓
- "2 tomatoes" → quantity-stripped to "tomatoes" → not shown ✓

**Layout:**

- Fixed Dialog header: count display + progress bar + status message
- Scrollable body:
  - **Categories Covered** grid (9 categories, ✓/○ based on presence)
  - **Plant table**: responsive — all columns on md+, Plant + Nutrients on mobile
  - Each row expands to show: varieties used, meals with days, all key nutrients, benefit summary
- Footer note about approximation
- `backgroundImage: "none"` override — clean white/dark surface for data reading
- Image placeholder comment in each row for future imagery layer

---

### Modified: `WeeklyPlantDiversityCounter`

Added optional `onExplore?: () => void` prop.

When provided:
- Component renders as a `<button>` instead of a `<div>`
- A `ChevronRight` icon appears as a click affordance
- `hover:opacity-80 transition-opacity` applied

When not provided: no change to existing behaviour.

---

### Modified: `weekly-planner-page.tsx`

**New memo:**

```typescript
const weekMealsData = useMemo<WeekMealEntry[]>(() => {
  if (!activeWeekData) return [];
  const result: WeekMealEntry[] = [];
  for (const day of activeWeekData.days) {
    const dayName = DAY_SHORT[day.dayOfWeek];
    for (const entry of day.entries) {
      const meal = mealById.get(entry.mealId);
      if (meal?.ingredients?.length) {
        result.push({ mealName: meal.name, dayName, ingredients: meal.ingredients });
      }
    }
  }
  return result;
}, [activeWeekData, mealById]);
```

This is a superset of `weekIngredients` — it includes meal names and day labels for the Explorer. The existing `weekIngredients` memo is unchanged.

**New state:**

```typescript
const [plantExplorerOpen, setPlantExplorerOpen] = useState(false);
```

**Counter update:**

```tsx
<WeeklyPlantDiversityCounter
  weekIngredients={weekIngredients}
  onExplore={() => setPlantExplorerOpen(true)}
/>
```

**Dialog render** (placed alongside other dialogs at end of JSX):

```tsx
<PlantDiversityExplorer
  open={plantExplorerOpen}
  onClose={() => setPlantExplorerOpen(false)}
  weekMeals={weekMealsData}
/>
```

---

## Trust Check Results

All checks verified via node simulation with a realistic test week (Pizza Night, Pasta, Porridge, Chicken Curry, Omelette):

### Canonical grouping

| Ingredient variants | Canonical key | Grouped correctly |
|---|---|---|
| cherry tomatoes, vine tomatoes, plum tomatoes, tomatoes | tomatoes | ✓ |
| baby spinach, spinach | spinach | ✓ |
| extra virgin olive oil, olive oil | olive oil | ✓ |

### Plant count parity

Counter count (existing `WeeklyPlantDiversityCounter`): **13**  
Explorer rows: **13**  
Match: **✓**

The Explorer and the counter always show the same number. They use the same `isPlantIngredient` + `normaliseForReuse` pipeline.

### Non-plant exclusion

All correctly excluded: pizza dough, mozzarella, milk, honey, chicken, eggs, cheese, pasta.

### No calorie tracking

The component renders: plant names, meal names, day names, nutrient names.  
It does NOT render: calories, grams, macro amounts.

### Nutrition Benefit Library reused

`getNutritionBenefit(canonicalKey)` called for every canonical plant. Library data (key nutrients, benefit summary) displayed in expanded rows. Pumpkin Seeds → Magnesium, Zinc, Plant Protein ✓.

---

## Manual Test Checklist

### Test 1 — Open Plant Diversity Explorer

1. Open Planner, ensure at least one week has meals with ingredients
2. Locate "30 Plants This Week" counter in the toolbar
3. Click/tap the counter
4. Verify: Explorer dialog opens
5. Verify: current plant count is displayed as X / 30
6. Verify: progress bar fills proportionally

### Test 2 — Expand Tomatoes (or any vegetable with variants)

1. Open Explorer, look for a plant that appears in multiple meals with different tomato forms
2. Click the row
3. Verify: varieties list appears (e.g. "Cherry Tomatoes", "Vine Tomatoes")
4. Verify: meals and days are shown in expanded area
5. Verify: no row for "Cherry Tomatoes" and a separate row for "Vine Tomatoes" — only one "Tomatoes" row

### Test 3 — Expand Pumpkin Seeds

1. Open Explorer, find "Pumpkin Seeds"
2. Expand the row
3. Verify: "Magnesium", "Zinc", "Plant Protein" appear as nutrient tags
4. Verify: benefit summary shown

### Test 4 — Mobile layout

1. Open Explorer on a narrow viewport (< 768px)
2. Verify: Meals and Days columns are hidden
3. Verify: Plant name and Key Nutrients visible
4. Verify: expanding a row reveals meals and days in the expanded section
5. Verify: dialog is scrollable

### Test 5 — Desktop layout

1. Open Explorer on a wide viewport (≥ 768px)
2. Verify: Plant, Meals, Days, Key Nutrients columns all visible
3. Verify: dialog uses max-w-2xl (reasonable width)
4. Verify: table is scannable and not excessively wide

### Test 6 — Empty state

1. Open Planner with an empty week (no meals)
2. Click the counter
3. Verify: "No plant foods found in this week's meals yet." message shown

### Test 7 — Existing counter unaffected

1. Verify the 30 Plants counter still displays correctly without the Explorer open
2. Verify count still matches Explorer count when Explorer is opened

---

## Definition of Done

- [x] User can open Plant Diversity Explorer by clicking the counter
- [x] Canonical plants displayed (not raw ingredient variants as separate rows)
- [x] Meals shown per plant
- [x] Days shown per plant
- [x] Key nutrients shown (from Nutrition Benefit Library)
- [x] Rows can expand to show varieties, all meals/days, full nutrients, benefit summary
- [x] Nutrition Benefit Library reused — no duplicate data
- [x] Categories Covered grid shows 9 plant categories with ✓/○
- [x] Plant count matches existing WeeklyPlantDiversityCounter
- [x] Mobile layout: Plant + Nutrients visible; Meals/Days in expand area
- [x] Desktop layout: all columns visible
- [x] No calorie tracking, no macro tracking, no gram amounts
- [x] TypeScript: zero new errors

---

## What Was NOT Implemented (Scope Lock)

- Ingredient imagery — image placeholder comment left in PlantTableRow for future imagery layer
- Household Familiarity
- Planner archive
- Nutrition scoring
- Historical reporting
- New database tables or migrations
- New API routes

---

## Suggestions (Not Implemented)

**Ingredient imagery:** The image placeholder comment in `PlantTableRow` is the intended extension point. When `client/src/lib/ingredient-imagery.ts` is built (per the Ingredient Imagery Library investigation), a small image can be added before the plant name by uncommenting the placeholder div.

**Category grouping headers:** The plant table could add a sticky category header row ("Vegetables (5)", "Legumes (3)") to further clarify the grouping. Not implemented to keep the report clean.

**"You're missing these categories" prompt:** A follow-up section below the categories grid could suggest easy ways to add uncovered categories. Out of scope for this implementation.

**Keyboard navigation:** Expanding/collapsing rows via ArrowDown/ArrowUp for accessibility. Currently keyboard accessible via Enter/Space on the button.
