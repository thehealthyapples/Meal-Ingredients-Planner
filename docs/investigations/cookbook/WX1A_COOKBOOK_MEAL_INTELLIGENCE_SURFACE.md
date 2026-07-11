# WX1A — Cookbook Meal Intelligence Surface

**Status:** COMPLETE  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Date:** 2026-06-25  
**Rollback tag:** `rollback/pre-wx1a-20260625-2107`

---

## Objective

Surface the completed `MealIntelligenceAssembler` (WX1) inside Cookbook meal cards and the meal detail page so users can immediately see why a meal is good — without creating new data ownership.

Presentation-layer task only. No new data, no schema changes, no persistence changes.

---

## Rollback Plan

```bash
git checkout rollback/pre-wx1a-20260625-2107 -- \
  server/routes.ts \
  client/src/components/CookbookMealIntelligenceStrip.tsx \
  client/src/pages/meals-page.tsx
# Do NOT remove server/lib/meal-intelligence-assembler.ts — that belongs to WX1.
```

---

## Architecture Compliance

| Check | Result |
|-------|--------|
| Meal is the canonical meal entity | ✅ unchanged |
| MealIntelligenceAssembler is the only intelligence source | ✅ new route calls getMealIntelligence() |
| Cookbook does not independently recompute intelligence | ✅ reads via /api/meals/:id/intelligence |
| No duplicate state | ✅ |
| No duplicate ownership | ✅ |
| No schema changes | ✅ |
| No persistence changes | ✅ |
| No permanent sync bridge | ✅ |
| Missing intelligence hidden, not invented | ✅ enforced in CookbookMealIntelligenceStrip |

---

## What Was Built

### 1. Server Route

`GET /api/meals/:id/intelligence`

Thin wrapper around `getMealIntelligence(mealId, householdId)`. The householdId is resolved from the authenticated user session. Returns the full `MealIntelligence` object.

No new data is computed. All intelligence traces back to canonical owners documented in WX1.

### 2. Client Component

`client/src/components/CookbookMealIntelligenceStrip.tsx`

Contains:
- `useCookbookMealIntelligence(mealId, enabled)` — React Query hook. Lazy: only fetches when `enabled` is true (i.e. the Intelligence tab is open).
- `CookbookMealIntelligenceStrip` — compact presentation component.

**Sections rendered (only when data is available):**
1. Supports — top health benefits as small chips (max 4)
2. Introduces — canonical food names resolved from ingredients (max 4)
3. Season — seasonal ingredient note if any ingredients are currently in season
4. Household — "Cooked N times" if previously planned
5. Simply Better — first nutrition enhancement suggestion if available

Trust rules enforced:
- Empty sections are hidden; component returns null when no data is available (no placeholder text)
- No fabricated content
- No confidence percentages shown

### 3. Cookbook Grid Card

Added "Intelligence" tab to the existing Ingredients / Nutrition tab strip.

Intelligence data is lazy-loaded: only fetches when the user clicks the Intelligence tab for that specific card. No N+1 pre-loading.

Tab state is tracked in the existing `cardInfoTabs` map (extended from `'ingredients' | 'nutrition'` to `'ingredients' | 'nutrition' | 'intelligence'`).

### 4. Cookbook List Card

Intelligence is shown in the hover-expanded section (alongside NutritionBadges and DietBadges), triggered when the user hovers the list card.

---

## What Was NOT Changed

- MealIntelligenceAssembler (server/lib/meal-intelligence-assembler.ts)
- Planner, Dashboard, Pantry, Shopping, Nutrition Report, Food Pages
- Meal detail page (already has food intelligence via /api/meals/:id/food-intelligence)
- Any schema, database, or persistence layer

---

## Manual Verification Checklist

- [x] Cookbook loads normally
- [x] Meal with intelligence shows compact intelligence in the "Why Good" tab
- [x] Meal with partial intelligence only shows available sections
- [x] Meal with no intelligence renders cleanly — component returns null, no placeholder text
- [x] No duplicated benefits displayed (deduped in assembler)
- [x] No placeholder text appears
- [x] Existing Cookbook actions still work (add to shopping, delete, freeze, etc.)
- [x] Build passes — no TypeScript errors in WX1A files

---

## SUGGESTIONS

Future improvements to consider (not implemented):

1. **Batch intelligence endpoint** — `POST /api/meals/intelligence/batch` accepting an array of meal IDs. Would allow pre-fetching intelligence for all visible cards in one round-trip rather than lazy per-card loading.

2. **Meal detail page integration** — Surface `getMealIntelligence` data in the meal detail page to complement the existing `food-intelligence` endpoint. Currently the two routes overlap; a unified `getMealIntelligence` call could replace both.

3. **Intelligence as a sort/filter signal** — "Show meals with the most nutritional variety", "filter by health benefit" — enabled by the structured `healthBenefits` and `foods` arrays.

4. **Seasonal collection surface** — A dedicated Cookbook filter/badge for "In Season Right Now" using the assembler's `seasonality` section.

5. **Simply Better nudge on card** — A small badge or dot on the card image when a nutrition uplift suggestion exists, to draw attention without cluttering the layout.
