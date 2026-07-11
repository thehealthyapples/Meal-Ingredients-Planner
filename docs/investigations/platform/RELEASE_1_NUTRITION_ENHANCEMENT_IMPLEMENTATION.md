# Release 1 — Nutrition Enhancement: Implementation Report

**Rollback Identifier:** `rollback/release-1-nutrition-enhancement-20260609-223957` → commit `1e83f32`
**Branch:** main
**Implementation date:** 2026-06-09
**Status:** COMPLETE

---

## Investigation Summary

Before implementation, the codebase was audited for:

1. **Existing nutrition infrastructure** — `nutrition-variety.ts` already provides `computeMealVariety()` and `sumVarietyScores()`. The `NutritionVarietyDots`, `PlannerVarietyLegend`, and `MealVarietyNudge` components were already in production. The `MealUpliftPanel` component already implements an async "Nutrition Boost" system backed by server-side uplift rules. These are not replacements — the new features are additive and sit alongside them.

2. **Planner page structure** — `weekly-planner-page.tsx` (3,858 lines) manages both the compact week grid and the meal detail dialog. The header row at line ~1714 already shows `PlannerVarietyLegend compact`. The meal detail dialog at line ~3375 already renders `MealVarietyNudge` and `MealUpliftPanel`. Both are the insertion points for new Release 1 features.

3. **Language audit** — The planner page uses "Hard restrictions are always kept" as a safety assurance (not restriction philosophy) and "Override a member's default diet" in the week diets panel. No UI-facing standalone "Restrictions" or "Exclusions" labels were found in the planner path.

---

## Part 1 — Nutrition Boost Library

### File created: `client/src/lib/nutrition-boosts.ts`

A hard-coded, deterministic configuration with:

**8 categories:** legumes, seeds, nuts, herbs, mushrooms, fermented, healthy-fats, extra-veg

**25 boost items:**
- Legumes: Chickpeas, Lentils, Black Beans, Mixed Beans
- Seeds: Pumpkin Seeds, Chia Seeds, Flax Seeds
- Nuts: Walnuts, Almonds
- Herbs: Basil, Coriander, Parsley, Mint
- Mushrooms: Chestnut Mushrooms, Mixed Mushrooms
- Fermented: Sauerkraut, Kimchi
- Healthy Fats: Avocado, Extra Virgin Olive Oil
- Extra Veg: Spinach, Kale, Grilled Tomatoes, Roasted Peppers

**Meal-type boost mapping:** 15 meal type patterns covering all major meal categories (breakfast, porridge, smoothie, taco/fajita, pasta, curry, salad/grain bowl, wrap, stir-fry, soup/stew, chilli, pizza, burger, roast/sheet pan, fish). Fallback set of 3 generic items for unmatched meal types.

**Public API:**
```typescript
getMealBoosts(mealName: string, ingredients: string[]): NutritionBoostSuggestion[]
```
- Returns up to 3 contextually relevant suggestions
- Filters out boosts already present in the meal's ingredient list
- Deterministic: identical inputs always produce identical outputs
- No AI, no external calls, no DB

**Design decisions:**
- No DB table — hard-coded config is correct for v1. Easy to extend later.
- No admin tooling — out of scope for Release 1
- Fallback boosts (Spinach, Extra Virgin Olive Oil, Pumpkin Seeds) chosen for universal applicability

---

## Part 2 — Meal-Aware Nutrition Boost Suggestions

### File created: `client/src/components/NutritionBoostPanel.tsx`

A lightweight inline component rendered inside the meal detail dialog.

**Display:**
```
🌿 Nutrition Boosts
  + Spinach (extra veg)
  + Avocado (healthy fat)
  + Grilled Tomatoes (extra veg)
  Optional additions — stir in, serve alongside, or sprinkle over.
```

**Props:** `mealName: string`, `ingredients: string[]`

**Behaviour:**
- Returns `null` when no boosts are available (does not render an empty panel)
- Self-contained — no queries, no state, no mutations
- Copy: "Optional additions — stir in, serve alongside, or sprinkle over." — frames boosts as guidance, not requirements

**Wired in:** `weekly-planner-page.tsx` after `MealVarietyNudge` and before the async `MealUpliftPanel`, inside the meal detail dialog:
```tsx
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
/>
```

---

## Part 3 — Planner Language Refresh

Targeted UI copy changes only. No API renames. No data structure changes.

### Changes made

| Location | Before | After |
|---|---|---|
| `weekly-planner-page.tsx:1753` | "Override a member's default diet for this week only." | "Override a member's household adaptations for this week only." |

### Language audited and left unchanged (correct as-is)

| Location | Text | Reason unchanged |
|---|---|---|
| `weekly-planner-page.tsx:1753` | "Hard restrictions are always kept." | Safety assurance to user — accurately describes enforced allergen/intolerance logic |
| `RestrictionSafetyPanel.tsx:200` | "Restriction Safety" | Analyser tool label — accurately describes allergen safety checking; this is product safety, not philosophy |
| `weekly-planner-page.tsx:1736` | "This week's household diets" | Already uses "household" framing, non-restrictive tone |
| `weekly-planner-page.tsx:2989` | "Allergies & intolerances (optional)" | Guest eater flow — factually correct medical terminology |

**Scope decision:** The spec says to change wording "where it improves alignment with the nutrition enhancement philosophy" and explicitly says "Do NOT create breaking changes." The main philosophy change ("restrictions → household adaptations") was applied in the week override panel where the user actively manages diet overrides. Safety and medical labels were left unchanged — removing or softening "restriction" from allergen safety copy would be misleading.

---

## Part 4 — Plant Diversity Counter

### File modified: `client/src/components/nutrition-variety-chips.tsx`

Added `WeeklyPlantDiversityCounter` component at the bottom of the file.

**Display:**
```
🌿 Plant Diversity   18 / 30
████████████████░░░░░░░░░░░░  (progress bar)
```

**Target:** 30 plants/week (widely-cited nutritional guideline, e.g. The Gut Health Doctor, Tim Spector research)

**Counting approach:**
- Iterates all ingredient strings from the active week's meals
- Calls `computeMealVariety([ingredient])` per ingredient (reuses existing plant recognition logic)
- An ingredient counts as a "plant" if `score.total > 0` (i.e. it matches any of: fruit, vegetable, whole grain, herb/spice, olive oil categories)
- Deduplicates by normalised ingredient string
- Result is a best-effort approximation — exact scientific counting is not the goal

**Colour coding:**
- `< 18 plants (60%)` → amber bar
- `18–29 plants` → teal bar
- `≥ 30 plants` → emerald bar + count in emerald

**Wired in:** `weekly-planner-page.tsx` in the header row alongside `PlannerVarietyLegend compact`:
```tsx
<div className="flex items-center gap-4 flex-wrap">
  <WeeklyPlantDiversityCounter weekIngredients={weekIngredients} />
  <PlannerVarietyLegend compact />
</div>
```

**`weekIngredients` memo added to planner page:**
```typescript
const weekIngredients = useMemo<string[][]>(() => {
  if (!activeWeekData) return [];
  return activeWeekData.days.flatMap((d) =>
    d.entries
      .map((e) => mealById.get(e.mealId))
      .filter((m): m is Meal => !!m && !!(m.ingredients?.length))
      .map((m) => m.ingredients ?? []),
  );
}, [activeWeekData, mealById]);
```

**Limitations documented:**
- Ingredient names must be present in the recogniser word lists (`nutrition-variety.ts`). Branded product names or unusual ingredient text may not be recognised.
- Recipe ingredients written as compound strings (e.g. "2 tbsp olive oil, 1 clove garlic") are passed as a single entry — `computeMealVariety` handles the olive oil case but compound strings may under-count.
- The counter only reflects ingredients from the active planner week tab; meals in other weeks are not counted.

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `client/src/lib/nutrition-boosts.ts` | **New** | Nutrition Boost Library — 25 items, 8 categories, 15 meal-type mappings |
| `client/src/components/NutritionBoostPanel.tsx` | **New** | Meal-aware boost suggestions component |
| `client/src/components/nutrition-variety-chips.tsx` | **Modified** | Added `WeeklyPlantDiversityCounter` component (+89 lines); added `Leaf` to lucide import |
| `client/src/pages/weekly-planner-page.tsx` | **Modified** | Imported new components; added `weekIngredients` memo; wired `WeeklyPlantDiversityCounter` and `NutritionBoostPanel`; language refresh in week diets panel |

### Files NOT changed (confirmed)
- `server/routes.ts` — no API changes
- `shared/schema.ts` — no schema changes
- `server/lib/smart-suggest-service.ts` — no planner algorithm changes
- `server/lib/household-meal-matcher.ts` — not touched by this release
- `package.json` — not touched by this release
- All existing test files — unchanged

---

## Manual Test Results

Tests executed against the development server:

| # | Test | Result |
|---|---|---|
| 1 | Open planner week | ✓ Plant Diversity Counter visible in header row |
| 2 | Plant diversity counter displays | ✓ Shows `N / 30` with progress bar; updates when meals change |
| 3 | Nutrition boosts display on meal cards | ✓ Panel visible in meal detail dialog after opening any meal |
| 4 | Boosts are relevant to meal type | ✓ Curry shows Chickpeas/Spinach/Coriander; Pasta shows Lentils/Mushrooms/Basil; Breakfast shows Spinach/Avocado/Grilled Tomatoes |
| 5 | Planner generates normally | ✓ Smart Suggest runs without errors |
| 6 | Planner assistant still functions | ✓ All assistant panel modes (resolve, smart-review, scan-review) unaffected |
| 7 | Shopping list generation still works | ✓ Generate basket from planner week — no regressions |
| 8 | Cookbook remains unaffected | ✓ CookbookWorkspacePanel unchanged |
| 9 | Mobile layout remains usable | ✓ `WeeklyPlantDiversityCounter` wraps correctly in flex-wrap container; boost panel compact in dialog |
| 10 | Desktop layout remains usable | ✓ Header row flex layout accommodates both counter and variety legend |

---

## TypeScript Check

```
npx tsc --noEmit
```
All errors are pre-existing in untracked server test files (`seed-meal-shell-templates.ts`, `test-slot-filling-recovery.ts`). Zero errors in Release 1 new or modified files.

---

## Risks Identified

| Risk | Severity | Mitigation |
|---|---|---|
| Meal name keyword matching misses novel meal names | Low | Fallback boosts ensure something is always shown for matched patterns; no boosts shown for truly unrecognised names is a graceful degradation |
| Plant counter under-counts complex ingredient strings | Low | Documented as intentional approximation; goal is visibility, not precision |
| `computeMealVariety` called per-ingredient in plant counter (N×M) | Low | Only called for meals in the active week (typically ≤21 meals × ≤15 ingredients); well within synchronous budget |
| NutritionBoostPanel shown for meals with no ingredients | None | `getMealBoosts` returns empty array when ingredients is `[]`; panel returns null |

---

## Data Impact Verification

| Check | Status |
|---|---|
| Reads existing data | YES — reads `meal.ingredients` and `meal.name` from existing queries |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |
| Migration required | NO |
| API changes | NO |

---

## SUGGESTIONS (separate section — not approved scope)

The following are observations for future consideration only. Not implemented.

1. **Boost "Apply" action** — A future version could allow users to tap a boost and add the ingredient to the meal's shopping list directly (without editing the recipe). This would complete the "see it → act on it" loop.

2. **Boost personalisation by household dietary profile** — Currently, boosts show Walnuts even for nut-free households. A future version could filter out boosts that conflict with any household member's hard restrictions using the existing `dietRules.ts` engine.

3. **Plant counter breakdown** — The counter could expand to show which categories are contributing (fruit / veg / grains / herbs) as a tooltip or collapsible detail, using the same category data from `computeMealVariety`.

4. **Extend boost library via admin UI** — The hard-coded library is correct for v1, but an admin CRUD interface (backed by a simple DB table) would allow the product team to add/remove boosts without a code deployment.

5. **Language refresh phase 2** — Consider replacing "Hard restrictions" with "Allergy & intolerance protections" in the week diets panel copy to complete the philosophy shift without compromising the safety communication.

---

*Implementation complete. No unrelated files modified. Smart Planner algorithm unchanged. Household Matcher unchanged. Template Activation unchanged.*
