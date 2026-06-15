# Planner Meal Card V2 — Investigation & Implementation

**Date**: 2026-06-15  
**Rollback identifier**: `rollback/pre-planner-meal-card-v2` → commit `5e1eb99`  
**Status**: Implemented

---

## Rollback

```
git checkout rollback/pre-planner-meal-card-v2
```

Working tree state at rollback point:
- `server/lib/smart-suggest-service.ts` had uncommitted modifications (unrelated)
- `docs/investigations/TIER4_SHELL_RECOVERY_ACTIVATION.md` — untracked (unrelated)
- `server/tests/test-tier4-shell-recovery-activation.ts` — untracked (unrelated)

---

## Investigation Findings

### Data available on `Meal` objects in the planner

The planner loads meals via `GET /api/meals` → `storage.getMeals()` → full `meals` table rows.

| Field | Available | Notes |
|-------|-----------|-------|
| `meal.styleTags` | YES (column exists) | Was always `[]` before this migration backfill |
| `meal.suitableSlots` | YES | Partially populated via category backfill migration (2026-06-14) |
| `meal.ingredients` | YES | Full arrays for recipe meals; compliant slot ingredients for shells |
| `meal.mealTemplateId` | YES | Non-null links to `mealTemplates` row |
| `meal.mealSourceType` | YES | `"planner-placeholder"` for name-only entries |

### Template-only fields (NOT on `Meal`)

The `mealTemplates` table has `proteinSlots`, `carbSlots`, `vegSlots`, `sauceSlots`, `toppingSlots`, and `nutritionOpportunities`. These are NOT included in the `Meal` type and are not returned by `/api/meals`.

### Why `styleTags` was always empty

The `meals.style_tags` column was added by migration `2026-06-14_add_hybrid_meal_occasion`, but no backfill was run against existing meal rows. The seed and enrichment migrations only populated `meal_templates.style_tags`. The `auto-import-service.ts` path (`autoImportExternalMeal`) creates meal records without copying the template's style tags. 

**Fix**: Migration `2026-06-15_backfill_meals_from_templates` copies `style_tags` and `suitable_slots` from linked `meal_templates` to their `meals` rows.

### Which chips are directly available (after migration)

All style tag slugs stored in `meal.styleTags`:
- `shared-meal` → "Family Table"
- `adaptable` → "Adaptable"
- `family-pleaser` → "Family Pleaser"
- `comfort` → "Comfort"
- `quick` → "Quick & Easy"
- `fresh` → "Fresh"
- `indulgent` → "Indulgent"
- `buffet` → "Buffet"
- `bar` → "Bar"
- `one-pot` → "One Pot"

### Which chips require derivation

**"Fully Balanced"** requires `proteinSlots`, `carbSlots`, `vegSlots` from `mealTemplates`.
These are not on the `Meal` record. Reliable derivation requires either:
- A new API join (future work)
- Or ingredient-keyword heuristics (too imprecise for the cooked breakfast case)

**Decision**: "Fully Balanced" is omitted from V2. The styleTags already carry the most meaningful signals (Family Table, Comfort, etc.). Flag for future work when template slot data is surfaced to the client.

### Shell meal identification

A meal is a "shell" (adaptable component-based meal) when:
- `meal.mealTemplateId !== null` — links to a template
- `meal.styleTags.includes("shared-meal")` — indicates component slots exist (after backfill)

### Nutrition contribution source

Use `getPlantCategory(ingredient)` from `@/lib/nutrition-variety` on `meal.ingredients`.
This already covers all 9 plant categories used in the 30 Plants counter.

Short labels for display:
```
Vegetables → "Veg"
Fruits → "Fruit"  
Legumes → "Protein"
Whole Grains → "Whole grains"
Herbs & Spices → "Herbs"
Seeds → "Seeds"
Nuts → "Nuts"
Olive Oil → "Healthy fats"
Fermented Foods → "Fermented"
```

### Breakpoints in use

- `sm:` (640px) — desktop grid vs mobile list boundary
- Desktop (`.hidden.sm:block`) — shows full chip row, nutrition line, suitable line
- Mobile (`.sm:hidden`) — shows single chip, hides nutrition and suitable lines

---

## Wireframe

```
DESKTOP CARD
──────────────────────────────────────────────
Thai Feast                            [icons]
[Family Table] [Comfort]
Veg • Herbs • Healthy fats
↳ 2 boost ideas
Suitable for: Lunch • Dinner
──────────────────────────────────────────────

DESKTOP — no chips, no veg
──────────────────────────────────────────────
Steak Night                           [icons]
──────────────────────────────────────────────

MOBILE CARD
──────────────────────────────────────────────
Thai Feast            [icons] [drag]
[Family Table]
↳ 2 boost ideas
──────────────────────────────────────────────
```

---

## Files Changed

| File | Change |
|------|--------|
| `server/migrations/runner.ts` | Migration to backfill `meals.style_tags` and `meals.suitable_slots` from linked templates |
| `client/src/components/PlannerMealCard.tsx` | **NEW** — V2 card content component |
| `client/src/pages/weekly-planner-page.tsx` | Integrate `PlannerMealCardContent` in desktop and mobile card slots; add boost indicator to mobile |

---

## Responsive Rules

| Breakpoint | Chips | Nutrition line | Suitable line | Boost |
|------------|-------|----------------|---------------|-------|
| Desktop (≥640px) | 2 shown, +N overflow | ✓ (max 3 categories, +N) | ✓ (shell meals, >1 slot) | ✓ (existing, unchanged) |
| Mobile (<640px) | 1 shown | ✗ hidden | ✗ hidden | ✓ (added to mobile) |

---

## Chip Priority Rules

Chips are ranked by this priority order — only the first 2 are shown:

1. Family Table (`shared-meal`)
2. Adaptable (`adaptable`)
3. Family Pleaser (`family-pleaser`)
4. Comfort (`comfort`)
5. Quick & Easy (`quick`)
6. Fresh (`fresh`)
7. Indulgent (`indulgent`)
8. Buffet (`buffet`)
9. Bar (`bar`)
10. One Pot (`one-pot`)

Overflow shown as `+N`.

---

## Nutrition Summary Rules

1. Call `getPlantCategory(ingredient)` on each ingredient in `meal.ingredients`
2. Collect unique categories in priority order: Vegetables → Fruits → Legumes → Whole Grains → Herbs & Spices → Seeds → Nuts → Olive Oil → Fermented Foods
3. Map each to its short label
4. Show max 3, then `+N` if more
5. If no plant categories detected (e.g. pure meat meal with no tagged ingredients): hide this line
6. Hidden on mobile

---

## Tests Executed

```
# Server migration is additive only — run manually if DB access available
# No planner logic changed — no scoring/ranking test impact
# Build: npm run build (TypeScript only — no UI framework tests exist)
```

---

## What Was NOT Changed

- Planner ranking / scoring
- Slot eligibility / recovery
- Nutrition boost behaviour
- Shopping
- Schema (no new columns)
- `PlannerVarietyLegend` / `WeeklyPlantDiversityCounter` (30 Plants legend)
- Any non-planner screen

---

## Future Work

1. **"Fully Balanced" chip**: Requires template `proteinSlots/carbSlots/vegSlots` to be surfaced on the Meal object (e.g. via a join in `getMealsSummary`). Low-risk additive change.
2. **Mobile suitable-for line**: Currently omitted per spec. Can be added if UX feedback warrants it.
3. **Fix auto-import to copy styleTags**: `autoImportExternalMeal` should copy `styleTags` and `suitableSlots` from the shell template when a matching template is found by name. The backfill migration covers existing data; new shell imports will have empty tags until this is fixed.

---

## Confirmation

Only approved scope was implemented:
- **YES**: Planner Meal Card V2 display redesign
- **NO**: Planner logic / ranking / scoring / restrictions / shell recovery / shopping / nutrition boost behaviour / schema
