# Nutrition Benefit Library — Implementation

**Date:** 2026-06-10
**Status:** Complete
**Rollback tag:** `rollback/nutrition-benefit-library-impl-20260610-183716`

---

## Objective

Add a reusable Nutrition Benefit Library to the existing enhancement architecture so
that Nutrition Boost suggestions display concise educational context alongside the
"Add to meal" button.

Target display format:

```
Add Pumpkin Seeds

Magnesium · Zinc · Plant Protein
Rich in magnesium and zinc. Supports plant diversity.

Already used this week: Pizza Night   ← (if reuse signal applies)

[Add to Meal]
```

---

## Investigation

### Existing architecture

System 1 — `NutritionBoostPanel` (static, display-only)
- `client/src/lib/nutrition-boosts.ts` — 26 ingredients, 8 categories
- `client/src/components/NutritionBoostPanel.tsx` — renders up to 3 suggestions
- Each `BoostItem` has only `name` and `category` — no nutrient data, no summary

System 2 — `MealUpliftPanel` (interactive, DB-backed)
- `client/src/components/MealUpliftPanel.tsx`
- Each `UpliftSuggestion` has `ingredient`, `why`, `action`, `quantity`
- `why` text comes from server-side uplift rules — useful but variable quality
- Currently shows `why` as a text line below the ingredient name

### What was missing

Neither system had any nutrient-level educational data. The `why` field from the
uplift engine provides reasoning, but it is rule-specific and inconsistent. A shared
library was needed to provide:
1. Uniform nutrient labels (2–3 nutrients per ingredient)
2. One-sentence benefit summaries (consistent tone, no medical claims)

---

## Implementation

### Files changed

| File | Change |
|------|--------|
| `client/src/lib/nutrition-benefit-library.ts` | **New** — full library with lookup function |
| `client/src/components/MealUpliftPanel.tsx` | Updated rendering — library data replaces `why` when available |

### `client/src/lib/nutrition-benefit-library.ts`

New reusable library. 24 ingredients covering all 8 categories from `BOOST_LIBRARY`:
Seeds, Nuts, Legumes, Herbs, Mushrooms, Fermented, Healthy Fats, Leafy Greens/Extra Veg.
Plus Rocket (requested example in spec).

Public API:

```typescript
export interface NutritionBenefit {
  name: string;
  category: string;
  keyNutrients: string[];   // 2–3 nutrients
  summary: string;          // 1 sentence, no medical claims
}

export function getNutritionBenefit(ingredient: string): NutritionBenefit | null
```

Lookup uses the same two-pass normalisation pipeline as `ingredient-reuse.ts`:
`stripForMatch` + `resolveIngredientAlias`. The internal map is built once at module
load. This means "fresh pumpkin seeds", "Pumpkin Seeds", and "pumpkin seeds (30g)"
all resolve to the same entry.

### `client/src/components/MealUpliftPanel.tsx`

Import added:
```typescript
import { getNutritionBenefit } from "@/lib/nutrition-benefit-library";
```

Rendering updated in the pending suggestions loop:

```typescript
const benefit = getNutritionBenefit(suggestion.ingredient);
```

**If benefit found (library item):**
- Nutrient tags line: `Magnesium · Zinc · Plant Protein`
  — `text-[10px]` emerald, `font-medium`, dot-separated
- Summary text: library `summary`
  — `text-xs` muted foreground
- HelpCircle button hidden (info is already inline)

**If benefit not found (non-library item):**
- `suggestion.why` shown as before
- HelpCircle button shown as before (expandedWhy still works)

Reuse labels (from previous implementation) appear after benefit/why in both paths —
unchanged.

---

## Library Contents

### Seeds

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Pumpkin Seeds | Magnesium · Zinc · Plant Protein | Rich in magnesium and zinc. Supports plant diversity. |
| Chia Seeds | Omega-3 · Fibre · Calcium | A source of omega-3 and fibre. Easy to stir into almost anything. |
| Flax Seeds | Omega-3 · Lignans · Fibre | A good plant-based source of omega-3. Adds to weekly plant diversity. |

### Nuts

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Walnuts | Omega-3 · Vitamin E · Plant Protein | One of the richest plant sources of omega-3 fatty acids. |
| Almonds | Vitamin E · Magnesium · Calcium | A good source of vitamin E and magnesium. Adds nutritional variety. |

### Legumes

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Chickpeas | Plant Protein · Fibre · Folate | High in plant protein and fibre. Counts towards weekly plant diversity. |
| Lentils | Plant Protein · Iron · Folate | A versatile source of plant protein and iron. Counts as a plant this week. |
| Black Beans | Plant Protein · Fibre · Antioxidants | Rich in plant protein and fibre. Contributes to weekly plant diversity. |
| Mixed Beans | Plant Protein · Fibre · Iron | A practical way to add plant protein and variety to any meal. |

### Herbs

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Basil | Vitamin K · Antioxidants | Adds plant diversity and a burst of fresh flavour. Source of vitamin K. |
| Coriander | Vitamin K · Antioxidants | Brightens dishes and contributes to weekly plant variety. |
| Parsley | Vitamin K · Vitamin C · Folate | One of the more nutrient-rich herbs. Adds to your weekly plant count. |
| Mint | Antioxidants · Vitamin A | Adds freshness and plant variety. A simple way to broaden your herb range. |

### Mushrooms

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Chestnut Mushrooms | Vitamin D · B Vitamins · Selenium | One of the few plant sources of vitamin D. Adds to weekly plant diversity. |
| Mixed Mushrooms | Vitamin D · B Vitamins · Selenium | Variety in mushroom choice adds plant diversity and vitamin D. |

### Fermented

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Sauerkraut | Probiotics · Vitamin C · Fibre | A fermented food that adds gut-friendly variety to your diet. |
| Kimchi | Probiotics · Vitamin C · Vitamin K | Adds plant diversity and fermented food variety to your week. |

### Healthy Fats

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Avocado | Monounsaturated Fats · Potassium · Folate | A source of heart-healthy fats and folate. Adds plant diversity. |
| Extra Virgin Olive Oil | Monounsaturated Fats · Vitamin E · Polyphenols | Rich in monounsaturated fats and polyphenols. |

### Leafy Greens & Extra Veg

| Ingredient | Nutrients | Summary |
|-----------|-----------|---------|
| Spinach | Iron · Folate · Vitamin K | Adds iron and folate. Wilts easily into most cooked dishes. |
| Kale | Vitamin K · Vitamin C · Calcium | One of the more nutrient-dense leafy greens. Adds to plant diversity. |
| Rocket | Vitamin K · Folate · Nitrates | Adds plant diversity and a peppery flavour. A source of vitamin K. |
| Grilled Tomatoes | Lycopene · Vitamin C · Potassium | Cooking tomatoes concentrates lycopene. Adds to plant diversity. |
| Roasted Peppers | Vitamin C · Vitamin A · Antioxidants | One of the richest plant sources of vitamin C. Counts as a plant this week. |

---

## Architecture Notes

### Relation to existing systems

- The library is a **new standalone module** — it does not modify `nutrition-boosts.ts`
  or the uplift engine.
- It is **additive** — when a benefit is found, it replaces `why` in the display only.
  The `why` field and all uplift engine logic are unchanged.
- The lookup is **normalisation-aware** — shares the same key pipeline as the weekly
  reuse map, so there is zero risk of missed matches from prep words or aliases.

### What was NOT implemented

Per scope lock:
- NutritionBoostPanel (System 1) was not updated — it has no interactive "Add to meal"
  flow, and the spec only targets the planner display path (MealUpliftPanel)
- No Smart Planner changes
- No Plant Diversity scoring
- No Pantry awareness
- No Household Familiarity changes

The library is designed for future reuse by those surfaces — they only need to call
`getNutritionBenefit(ingredient)`.

---

## Verification

### TypeScript build

`npx tsc --noEmit` — zero new errors.

### Manual test checklist

| Test | Expected |
|------|---------|
| Open planner meal with uplift suggestions | Nutrition Boost panel appears |
| Library ingredient (e.g. Pumpkin Seeds) | Nutrient tags + summary visible; no HelpCircle |
| Non-library ingredient | `why` text + HelpCircle shown (unchanged) |
| Add boost | Ingredient added to meal; shopping list refreshes |
| Reuse signal applies | "Already used this week: ..." appears below summary |
| Mobile layout | Nutrient line wraps naturally; no overflow |
| Provenance (already added) items | Unaffected — no library display on applied items |

---

## Definition of Done — Checklist

- [x] Nutrition boosts display concise benefit information
- [x] Information comes from a reusable library
- [x] Existing add-to-meal flow still works
- [x] Mobile layout remains clean (text-[10px] nutrient tags, text-xs summary)
- [x] No duplicate enhancement systems introduced
- [x] Nutrition Boost suggestions unchanged
- [x] Add-to-meal functionality unchanged
- [x] Weekly reuse logic unchanged
- [x] Meal fit protection unchanged

---

## Suggestions (not implemented)

Per scope lock, the following were identified but not implemented:

1. **NutritionBoostPanel enrichment** — System 1 could show the same nutrient tags
   and summary inline with each static boost suggestion.

2. **Category label** — The `benefit.category` field (Seeds, Legumes, etc.) could be
   displayed as a subtle chip alongside the nutrient tags.

3. **Plant diversity count context** — "This is plant #8 this week" could be appended
   to the summary for ingredients that count as new plants. Requires PlantDiversityCounter
   integration.

4. **Cookbook enrichment** — `getNutritionBenefit` is ready to be called from the
   cookbook meal detail view for any meal that contains a library ingredient.
