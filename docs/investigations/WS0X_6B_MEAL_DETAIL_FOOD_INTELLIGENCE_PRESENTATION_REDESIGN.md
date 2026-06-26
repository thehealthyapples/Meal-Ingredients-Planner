# WS0X.6B — Meal Detail Food Intelligence Presentation Redesign

**Date:** 2026-06-24  
**Risk:** 🟡 AMBER — UI and presentation only  
**Branch:** safety/preserve-since-last-prod-20260617-1613

---

## Rollback Details

**Tag:** `rollback/ws0x-6b-before-presentation-redesign`  
**Points to:** `f531216` (feat(ws11): Seasonal Stories Engine)

To rollback:
```bash
git checkout rollback/ws0x-6b-before-presentation-redesign
```

---

## Problem Statement

WS0X.6 placed food intelligence in a standalone card ("Why This Meal Is Great") near the top of Meal Detail. Review found:

- Breaks page hierarchy — intelligence appeared before the actual recipe
- Pushed ingredients and instructions further down
- Felt bolted on and generic
- Intelligence disconnected from the foods it described

The backend architecture (service, API, WS0 integration) was sound. The presentation was not aligned with THA.

---

## Part 1 — Removed Presentation

Removed:
- `MealFoodIntelligenceSection` card from top of `meal-detail-page.tsx`
- "Why This Meal Is Great" heading + highlight chips card
- "More Food Intelligence" collapsible expand section

Retained:
- `server/services/meal-food-intelligence.ts` — unchanged (logic only)
- `server/routes.ts` — unchanged (`/api/meals/:id/food-intelligence` endpoint intact)
- All WS0 / Food Context / Discovery integrations

---

## Part 2 — Meal Detail Structure Audit

Page order before redesign:
1. PageHeader
2. Adapt results (conditional)
3. **MealFoodIntelligenceSection card** ← removed
4. Trust sections (MealTrustSummary, MealFamilyConfidence, HouseholdAdaptations, SimplyBetterChoices)
5. Grid: Image+Nutrition sidebar | Ingredients card | Instructions card

Intelligence logically belongs with ingredients — it describes what each food contributes, not what the meal is as a whole. Placing it at the top detached the information from the food it described.

---

## Part 3 — Food-Level Intelligence Design

### New design: inline ingredient annotations

Each ingredient in view mode (non-edit, non-grouped) now shows a subtle annotation row:

```
Ingredients
───────────────────────────────────────
● Salmon                    
  Omega-3 · Vitamin D · Vitamin B12

● Pumpkin Seeds             
  Magnesium · Zinc · Plant Protein

● Chickpeas                 
  Fibre · Plant Protein · Folate

● Spinach                   
  Folate · Iron · Vitamin K  · in season   ← amber text

● Extra Virgin Olive Oil
  Unsaturated Fats · Polyphenols · Vitamin E
```

**Design decisions:**
- Max 3 nutrients per ingredient (keeps it scannable)
- Seasonal note rendered in `text-amber-600/70` — warm, not alarming
- No benefits shown inline (avoids health claim adjacency)
- Annotations are `text-muted-foreground/70` — quiet, not competing with ingredients
- Intelligence hides entirely for ingredients with no WS0 coverage (graceful degradation)
- Hidden in edit mode (functional context, not informational)
- Hidden for grouped meals (too complex; ingredients belong to sub-components)

---

## Part 4 — Backend Enhancement

Added `perIngredient: IngredientIntelligence[]` to the API response.

### New type
```typescript
export interface IngredientIntelligence {
  raw: string;          // original ingredient string (for lookup)
  nutrients: string[];  // up to 3, from WS0
  isSeasonal: boolean;
  seasonLabel?: string; // e.g. "Summer"
  origin?: string;      // display origin if interesting
  availabilityNote?: string;
}
```

All existing response fields retained (backwards compatible). No schema changes. No new data sources — `perIngredient` is derived from the same WS0 data that previously built the aggregated fields.

### Live test output (exact food names):
```
• Pumpkin Seeds → Magnesium · Zinc · Plant Protein
• Chickpeas → Fibre · Plant Protein · Folate
• Salmon → Omega-3 · Vitamin D · Vitamin B12
• Spinach → Folate · Iron · Vitamin K
• Walnuts → Omega-3 · Unsaturated Fats · Plant Protein
• Extra Virgin Olive Oil → Unsaturated Fats · Polyphenols · Vitamin E
```

No fabricated nutrients. All from WS0 knowledge base.

---

## Part 5 — Discovery Placement

"You May Also Enjoy" moved from inside the collapsed "More Food Intelligence" section to a compact row at the **bottom of the ingredients card**.

```
[ingredient list...]

You may also enjoy
[Sesame Seeds] [Chia Seeds] [Flaxseed]
```

Rationale: discovery is ingredient-adjacent — it says "if you like this food, explore these." Placing it under ingredients is natural. It shows only if discovery items exist, capped at 4 badges. Does not dominate.

Hidden for:
- Grouped meals (`!isGrouped`)
- Edit mode (`!isEditing`)

---

## Part 6 — Density Review

Before redesign: page had a full intelligence card (~80-120px) above the trust sections which are themselves above the recipe grid. Significant pre-content scrolling.

After redesign:
- One full card removed from the top
- Intelligence added inline within the existing ingredients card (no new height when no WS0 coverage; ~12px per annotated ingredient otherwise)
- Discovery row adds ~48px inside ingredients card only if discovery exists

Net result: meaningfully less scrolling to reach the recipe. Intelligence now adds density to the ingredients card rather than creating a new stacked block.

---

## Part 7 — THA Brand Review

**Old design:** Separate card with "Why This Meal Is Great", Sparkles icon, stacked chip badges. This reads as a generic AI nutrition widget. It summarises the meal rather than describing the food.

**New design:** Nutrients quietly listed below each ingredient in muted text. No heading. No icon. No card. The intelligence whispers rather than presenting.

This feels like THA because:
- It doesn't announce itself
- It treats the user as capable of connecting "Salmon → Omega-3" to their own goals
- It's attached to the food, not appended to the page
- The seasonal note uses the amber tint consistently with THA's seasonal language elsewhere
- Discovery badges use the same `Badge variant="outline"` as the rest of the app

---

## Files Changed

| File | Change |
|------|--------|
| `server/services/meal-food-intelligence.ts` | Added `IngredientIntelligence` type + `perIngredient` field to response |
| `client/src/components/meal-detail/MealFoodIntelligenceSection.tsx` | Complete redesign: exports `useMealFoodIntelligence` hook + `MealDiscoveryRow` component |
| `client/src/pages/meal-detail-page.tsx` | Removed top card; added hook call; added inline ingredient annotations; added discovery row |

**Not changed:**
- `server/routes.ts` — API endpoint unchanged
- `server/seeds/` — no seed changes
- `shared/` — no shared changes
- Trust sections, SimplyBetterChoices, HouseholdAdaptations — unchanged

---

## Part 8 — Manual Eyeball Tests

Test instructions for user verification:

### Test 1: Chicken Marengo

1. Navigate to Cookbook
2. Open "Chicken Marengo"
3. **Verify:** No "Why This Meal Is Great" card at the top
4. **Verify:** Ingredients show with small nutrient annotations where WS0 has coverage
5. **Verify:** "in season" appears in amber if any ingredient is currently seasonal
6. **Verify:** "You may also enjoy" row at the bottom of the ingredients card (if discovery items found)
7. **Verify:** Instructions section is unchanged and still prominent

### Test 2: Any meal with WS0-covered ingredients (Salmon, Chickpeas, Spinach, etc.)

1. Open the meal
2. In the Ingredients card, look below each ingredient name
3. **Expect:** Small muted text showing nutrients (e.g. "Omega-3 · Vitamin D · Vitamin B12")
4. **Expect:** Ingredients without WS0 coverage render cleanly with no annotation

### Test 3: Edit mode

1. Open any editable copy (or click Edit)
2. Enter edit mode
3. **Verify:** Ingredient annotations hidden in edit mode
4. **Verify:** Discovery row hidden in edit mode
5. **Verify:** Editing works exactly as before

### Test 4: Grouped meal

1. Open a grouped meal
2. **Verify:** Annotations not shown (grouped meals have component-level ingredients)
3. **Verify:** No discovery row in grouped meal view

---

## Trust Check

- No fabricated claims: all nutrients from WS0 knowledge base
- No medical claims: nutrients are factual (Iron, Folate, etc.); benefits NOT shown inline
- No hidden confidence scores
- No duplicated intelligence: each nutrient appears under its source ingredient
- Seasonal info only shown when SEASON_SEED confirms current season (existing logic unchanged)

---

## Definition of Done

| Item | Status |
|------|--------|
| Current top intelligence cards removed | ✅ |
| Intelligence service retained | ✅ |
| API retained | ✅ |
| Better presentation implemented | ✅ per-ingredient annotations |
| Food-level intelligence explored | ✅ implemented |
| Discovery placement reviewed | ✅ moved to bottom of ingredients card |
| Density improved | ✅ one card removed from top |
| Project file created | ✅ this file |

**Note on before/after screenshots:** Browser headless mode is unavailable in this environment (missing system libraries for Chromium). Screenshots must be taken by the user via the manual eyeball tests above.

---

## SUGGESTIONS (future opportunities)

These are **not part of this work** — they are captured for future consideration.

1. **Ingredient-level detail popover**: Tap an ingredient to see a popover with the full WS0 profile (all nutrients, benefits, origin, availability). Would require a new UI pattern but data is already available via the hook.

2. **"Contains X plant foods" bar**: A small plant diversity indicator on the ingredients card (e.g. "3 plant foods · 2 in season") — a single-line summary that doesn't require expanding.

3. **Nutrition-to-ingredient attribution**: Show which nutrient bar in the Nutrition card is "powered by" which ingredient — a dotted line connecting the macro to the source food.

4. **Discovery navigation**: Make the "You may also enjoy" badges navigable — tapping one opens that food's knowledge hub or a filtered cookbook search.

5. **Grouped meal intelligence**: Per-component intelligence in grouped meals (each component has its own ingredient list; annotations could attach there).
