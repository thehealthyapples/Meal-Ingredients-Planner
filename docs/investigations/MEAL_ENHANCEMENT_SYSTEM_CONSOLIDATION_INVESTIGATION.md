# Meal Enhancement System Consolidation Investigation

**Date:** 2026-06-10
**Rollback tag:** `rollback/before-enhancement-consolidation-investigation`
**Type:** Investigation only. No code changes made.

---

## Summary

The meal dialog currently renders three independent nutrition enhancement systems. They are partially overlapping in purpose, use different recommendation engines, and differ significantly in actionability. The user's confusion about "rocket vs. oats vs. spinach" is well-founded — the systems speak different languages.

---

## Systems Inventory

### System 1 — MealVarietyNudge

**File:** `client/src/components/nutrition-variety-chips.tsx` (lines 131–190)
**Supporting engine:** `client/src/lib/nutrition-variety.ts`

**Purpose:** A single plain-text line that identifies which variety category (fruits, vegetables, whole grains, herbs/spices, olive oil) is absent from the current meal's ingredient list. If the pantry contains a relevant item it names it.

**Data source:** `computeMealVariety(meal.ingredients)` — runs entirely client-side against the meal's stored ingredient list. Uses the user's pantry via `pantryNames`.

**Recommendation engine:** Word-list keyword matching (`nutrition-variety.ts`). Five category word lists (FRUITS, VEGETABLES, WHOLE_GRAINS, HERBS_SPICES, olive oil). Each ingredient is matched against one category by priority order. No meal-type awareness whatsoever.

**Trigger conditions:** Always rendered when the dialog is open. Returns null only if `score.total >= 4` (shows positive "Nice mix" message instead).

**Can modify the meal:** NO. Text only. No action button.

**Informational:** YES. Single sentence of text.

**Example output for Matambre a la Pizza with oats in pantry:**
> "Oats would add a whole grain element."

---

### System 2 — NutritionBoostPanel

**File:** `client/src/components/NutritionBoostPanel.tsx`
**Supporting library:** `client/src/lib/nutrition-boosts.ts`

**Purpose:** Shows up to 3 ingredient suggestions drawn from a curated, meal-type-specific static list. Suggestions are presented as optional additions ("stir in, serve alongside, or sprinkle over").

**Data source:** `BOOST_LIBRARY` (8 categories, ~20 items) + `MEAL_TYPE_BOOSTS` (15 meal-type keyword → boost-list mappings). Entirely client-side. No server call.

**Recommendation engine:** Keyword matching on the meal name finds the first matching `MealTypeBoosts` entry. Returns the first 3 items from that entry's ordered boost list that are not already in the meal's ingredients. Falls back to `FALLBACK_BOOSTS` (Spinach, Extra Virgin Olive Oil, Pumpkin Seeds) for unrecognised meal types.

**Trigger conditions:** Rendered always. Returns null if `boosts.length === 0` after household safety filtering.

**Household-aware:** YES. Filters against hard dietary restrictions (`computeRestrictionSafety`) and soft diet patterns (`shouldExcludeRecipe`).

**Can modify the meal:** NO. List only. No add-to-meal action. No persistence.

**Informational:** YES. Bulleted list with category labels.

**Example output for Matambre a la Pizza:**
> + Spinach (extra veg)
> + Roasted Peppers (extra veg)
> + Mixed Mushrooms (mushroom)

This comes from `MEAL_TYPE_BOOSTS` entry `keywords: ["pizza"], boosts: ["Spinach", "Roasted Peppers", "Mixed Mushrooms", "Basil"]`.

---

### System 3 — MealUpliftPanel

**File:** `client/src/components/MealUpliftPanel.tsx`
**Supporting engine:** `server/lib/uplift-engine.ts` + `server/lib/uplift-rules.ts`
**Types:** `server/lib/uplift-types.ts`
**Persistence:** `server/lib/uplift-persistence.ts`

**Purpose:** Actionable ingredient suggestions with full provenance tracking. The user can add a suggestion to the meal (and remove it later). Suggestions fire server API mutations that modify the meal's ingredient list and write to the database. Supports system meal forking (system recipes are copied to a user-owned fork before modification).

**Data source:** Server API call — `POST /api/uplift/batch` — batched across all meals in the active week, fired asynchronously after the planner renders (non-blocking). Results cached via React Query (`staleTime: 5 min`).

**Recommendation engine:** Server-side indexed rule engine. Rules in `uplift-rules.ts` each have:
- Structured triggers: `mealNamePattern`, `ingredientPattern`, `categoryPattern`, `mealSlotPattern`
- Typed suggestions: ingredient, action (`add`/`swap`/`boost`), quantity, plain-English `why`
- Nutrition tags, confidence tier (`high`/`medium`/`low`), priority score
- Diet exclusions per rule
- Approval gate: rules without `reviewedAt` are silently excluded from matching

**Trigger conditions:** Only rendered if `matches.length > 0` for the current meal. Collapsed by default. Shows max 2 suggestions ("anti-clutter" spec).

**Household-aware:** YES, via `dietTypes` passed in the batch request.

**Can modify the meal:** YES. "Add to meal" → `POST /api/uplift/accept`. Removes suggestion from pending list, writes to DB, invalidates shopping list. "Remove" → `DELETE /api/uplift/applications/{id}`.

**Informational:** NO. Fully actionable with persistence.

**Example output for Matambre a la Pizza:**

Rule `pizza-rocket-addition` fires (from `mealNamePattern: ['pizza']`, priority 15, confidence `high`):
> **Add Rocket** — a handful
> "Add fresh rocket after baking to boost micronutrient variety and add a peppery flavour."
> [Add to meal]

---

## Component Matrix

| Component | File | Source | Actionable | Household-aware | User Visible Purpose | Recommendation Type |
|---|---|---|---|---|---|---|
| `MealVarietyNudge` | `nutrition-variety-chips.tsx` | Client-side word-list scan | NO | NO | Identifies missing variety category | Gap analysis — meal-type blind |
| `NutritionBoostPanel` | `NutritionBoostPanel.tsx` | Client-side curated static list | NO | YES | Suggests optional additions | Curated per meal type, informational |
| `MealUpliftPanel` | `MealUpliftPanel.tsx` | Server API + rules engine | YES | YES | Actionable ingredient additions with provenance | Rule-based, structured, approved |

---

## Data Flow Trace: Matambre a la Pizza

### "Oats would add a whole grain element."

**Source:** `MealVarietyNudge`

**Path:**
1. Dialog renders → `MealVarietyNudge` receives `score = computeMealVariety(meal.ingredients)` + `pantryNames`
2. `computeMealVariety` scans each ingredient against WHOLE_GRAINS word list
3. Pizza ingredients (cheese, tomato sauce, dough, mozzarella) → `wholeGrains === 0`
4. `MealVarietyNudge` enters the `wholeGrains === 0` branch
5. `findPantryItemForCategory(pantryItems, "wholeGrains")` scans pantry items for any that score > 0 in the wholeGrains dimension
6. "oats" is in the user's pantry → `computeMealVariety(["oats"])` returns `wholeGrains: 1`
7. Template: `"${oats.charAt(0).toUpperCase() + oats.slice(1)} would add a whole grain element."` → "Oats would add a whole grain element."

**Why this is the source of user confusion:** The engine is variety-gap-aware but meal-context-blind. It correctly identifies that pizza has no whole grains, but oats is an inappropriate suggestion for a pizza. The system found the first pantry item that scores as a whole grain — it has no concept of culinary compatibility. A wholemeal pizza base (appropriate) would not trigger this because it is not in the pantry.

### "Rocket" (with "Add to meal" button)

**Source:** `MealUpliftPanel`

**Path:**
1. Planner renders → `upliftBatchMeals` memo collects all planned meals
2. `POST /api/uplift/batch` fired with all meals
3. Server `uplift-engine.ts` → `matchUpliftRules` runs against rule index
4. Rule `pizza-rocket-addition` (priority 15) has `mealNamePattern: ['pizza']`
5. "matambre a la pizza" contains "pizza" → trigger fires
6. Also rule `pizza-wholemeal-base` (priority 25) may fire for the wholemeal swap suggestion
7. Results returned, React Query caches them
8. Dialog opens → `upliftByMealId.get(meal.id)` returns matches
9. `MealUpliftPanel` renders with `pendingSuggestions = allSuggestions.slice(0, 2)`
10. Rocket is suggestion 1 from the highest-priority matched rule

**Why rocket appears differently:** It comes from the only system with an "Add to meal" action. This makes it stand out visually as actionable while the other suggestions are passive. The distinction is architectural, not philosophical.

### "Spinach", "Roasted Peppers", "Mixed Mushrooms"

**Source:** `NutritionBoostPanel` via `getMealBoosts("Matambre a la Pizza", ingredients)`

**Path:**
1. `getMealBoosts` called client-side in `NutritionBoostPanel`
2. `nameLower = "matambre a la pizza"`
3. `MEAL_TYPE_BOOSTS` scanned → first entry with `keywords: ["pizza"]` matches
4. `candidates = ["Spinach", "Roasted Peppers", "Mixed Mushrooms", "Basil"]`
5. Each candidate filtered: not already in meal ingredients
6. Household safety check applied (hard restrictions + diet patterns)
7. First 3 survivors returned: Spinach, Roasted Peppers, Mixed Mushrooms

---

## Consolidation Analysis

### 1. Are Meal Enhancements and Nutrition Boosts solving the same problem?

**Partially, but not identically.**

- `NutritionBoostPanel` and `MealUpliftPanel` are solving the same surface-level problem: "what could be added to enrich this meal?" Their pizza outputs actually overlap in spirit (both suggest vegetables that work well on pizza) but use completely different mechanisms.
- `MealVarietyNudge` is solving a different sub-problem: "which variety category is missing from this specific meal?" It is a gap detector, not a recommendation engine. Its output is useful context but not the same as a suggestion.

### 2. Are they using the same recommendation engine?

**No. Three distinct engines:**

| System | Engine | Location | Meal-aware | Action |
|---|---|---|---|---|
| MealVarietyNudge | Category word-list gap detector | Client | NO | None |
| NutritionBoostPanel | Static keyword→list mapping | Client | YES | None |
| MealUpliftPanel | Indexed rule engine | Server | YES | Add/Remove + persistence |

### 3. Can the "Add to meal" action be reused?

**Yes, technically.** The `MealUpliftPanel` already has a full add/remove pipeline via `/api/uplift/accept` and `/api/uplift/applications/{id}`. If `NutritionBoostPanel` suggestions were plumbed through the same API, they could gain identical actionability. However, the uplift API requires structured `ruleId` / `ruleName` provenance for the acceptance record. `NutritionBoostPanel` items are anonymous — they have no ruleId. Plumbing them in would require either:
- Assigning each boost library item a stable `ruleId` equivalent
- Creating a synthetic uplift rule per boost category

This is achievable but is a non-trivial migration.

### 4. Can all enhancement opportunities be presented equally?

**Currently they cannot, because they differ in actionability.** Presenting them equally would imply all can be added to the meal, which is not true today. To present them equally, the "Add to meal" action would need to be extended to boost-panel items (see above).

Alternatively: if the philosophy is "suggestions are aspirational, not necessarily actionable," then all three could be presented in a unified visual container without an add action — which would mean removing the add action from the uplift panel, which would be a significant regression.

### 5. What functionality would be lost if they were merged?

| Feature | Lost on merge? |
|---|---|
| Actionable "Add to meal" (uplift) | Only if merge flattens uplift actions |
| Provenance tracking / "Added via THA Boost" label | Only if merge removes uplift DB writes |
| Meal fork on system recipe modification | Only if uplift accept pathway removed |
| Shopping list auto-update on add | Only if uplift accept pathway removed |
| Household hard restriction filtering | No — both boost and uplift do this |
| Diet pattern filtering | No — both do this |
| Variety gap identification | Would need to be ported into merged component |
| Per-rule confidence tier | Only if rule provenance is discarded |
| Server-side approval gate for rules | Only if server engine is abandoned |

### 6. What functionality would be gained if they were merged?

- Single visual container — user sees all enhancement opportunities in one place
- Consistent presentation — no "why is rocket different?" confusion
- Single mental model for users: "here are ways to enrich this meal"
- Easier to make all suggestions actionable (unified add pathway)
- Reduced visual clutter (currently 3 components stacked)
- Easier to apply household filtering consistently in one place

---

## Implementation Options

### Option A — Keep separate systems unchanged

**Files affected:** None

**Complexity:** None

**Risks:**
- User confusion persists ("why is rocket different?")
- The oats/pizza problem (MealVarietyNudge context-blindness) remains unfixed
- Three visual containers continue to stack vertically in the dialog

**User impact:** Status quo. Appropriate if the priority is stability.

---

### Option B — Unify into one "Meal Enhancements" section

**Concept:** Replace all three components with a single `MealEnhancementsPanel` that shows all suggestions in a unified list. The uplift suggestions retain "Add to meal"; boost suggestions become informational rows within the same container.

**Files affected:**
- `client/src/pages/weekly-planner-page.tsx` — replace three component calls with one
- `client/src/components/MealUpliftPanel.tsx` — promote to unified panel or rename
- `client/src/components/NutritionBoostPanel.tsx` — either merged or deprecated
- `client/src/lib/nutrition-boosts.ts` — retained as data source
- `client/src/components/nutrition-variety-chips.tsx` — MealVarietyNudge retained or retired

**Complexity:** Medium. The visual merge is straightforward. The hard part is whether to give boost items an "Add to meal" action (requires uplift API extension) or whether uplift items lose their special status.

**Risks:**
- If actionability is levelled down: loss of "Add to meal" for uplift items, regression in delivered value
- If actionability is levelled up: boost items need stable IDs and server-side acceptance — non-trivial
- Risk of mixing a rule-approved, server-validated system with a simple keyword list

**User impact:** Cleaner dialog. Fewer "why is this different?" moments. Meal Enhancements becomes a clearly understood section.

---

### Option C — Retain separate engines, improve presentation

**Concept:** Keep all three engines intact. Fix the one concrete UX problem (oats/pizza context-blindness). Visually unify the two passive systems (NutritionBoostPanel + MealVarietyNudge) under a single "Nutrition Ideas" header. Keep MealUpliftPanel separate and clearly action-labelled.

**Files affected:**
- `client/src/pages/weekly-planner-page.tsx` — minor wrapper changes
- `client/src/components/nutrition-variety-chips.tsx` — add meal-type guard to MealVarietyNudge
- `client/src/components/NutritionBoostPanel.tsx` — cosmetic header change

**Complexity:** Low. No API changes. No schema changes. No engine changes.

**Risks:** Low. Preserves all existing functionality.

**User impact:**
- Removes the "oats on pizza" problem
- Visually reduces from 3 stacked components to 2 (boost+nudge unified, uplift separate)
- Maintains "Add to meal" clarity

**How to fix the oats/pizza problem specifically:** In `MealVarietyNudge`, add a guard that suppresses the `wholeGrains` nudge when the meal name matches pizza (or any meal type where whole grains would be culinarily inappropriate). This is a small addition to the nudge's branching logic.

---

## Special Review: THA Philosophy

> "THA is not trying to find the one perfect enhancement. THA is presenting several ways a household could enrich a meal."

### Does the current implementation support this philosophy?

**Partially. Two of the three systems support it well; one undermines it.**

**NutritionBoostPanel** directly embodies the philosophy. It presents 3 valid, meal-appropriate options without hierarchy. The footer copy — "Optional additions — stir in, serve alongside, or sprinkle over" — is exactly the right tone: inviting, non-prescriptive.

**MealUpliftPanel** also supports it. Multiple rules can fire for one meal (pizza has two: rocket addition and wholemeal base swap). Showing "2 ideas" and letting the user choose which — if any — to apply is consistent with the philosophy.

**MealVarietyNudge does not support it.** It presents a single, algorithmically-derived, context-blind suggestion. For the pizza case it produces "Oats would add a whole grain element" — which actively undermines the philosophy by generating a suggestion that is neither practical nor appropriate to the meal type. This is the opposite of "household could enrich a meal" — it is "algorithm found a gap."

The nudge was designed as a gentle prompt, not a deep recommendation. Its limitation is not the concept but the context-blindness of the whole-grains branch when paired with pantry-sourced names (oats, quinoa, bulgur wheat are all valid whole grains but unsuitable for pizza).

### Conclusion

The philosophy is being met by NutritionBoostPanel and MealUpliftPanel. MealVarietyNudge's gap-detection logic needs a meal-type guard to avoid surfacing inappropriate suggestions. Merging the systems is not required to uphold the philosophy — but tidying the presentation would make the philosophy more visible to users.

---

## Data Impact Declaration

| Question | Answer |
|---|---|
| Reads existing data | YES — meal ingredients, household eaters, pantry items |
| Writes new data | NO (investigation only; MealUpliftPanel writes in production use) |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema change | NO |

---

## Trust Check

**Could consolidation mislead users?**
Not if done carefully. The key risk is conflating rule-approved server-validated uplift suggestions with simple keyword-matched boost items. If presented identically users may not perceive the difference in confidence level. This is acceptable for consumer UX (users do not need to see confidence tiers) but should not be a reason to discard the uplift engine's approval gate.

**Could it remove useful guidance?**
Option B levelled-down (removing "Add to meal") would remove a genuinely useful feature. Options A and C do not.

**Could it weaken household adaptation?**
No. All three systems already apply household dietary filtering. Consolidation could centralise that filtering and make it more consistent.

**Could it weaken the 30 Plants philosophy?**
No. The 30 Plants counter (`WeeklyPlantDiversityCounter`) is entirely separate from all three enhancement systems. It is unaffected by any of these consolidation options.

---

## Recommended Next Step (if approved)

**Option C** is the lowest-risk path to resolving the user's specific confusion:

1. Add meal-type guard to `MealVarietyNudge` to suppress contextually inappropriate whole-grain suggestions (oats for pizza, quinoa for pizza, etc.)
2. Visually group `MealVarietyNudge` + `NutritionBoostPanel` under a single "Nutrition Ideas" label in the dialog
3. Keep `MealUpliftPanel` separate with its "Meal Enhancements" header — its actionability is a distinct value

This addresses all user concerns without engine changes, API changes, or schema changes.

**Option B** (full unification with actionable add for all suggestions) is the right long-term architecture but requires the uplift API to be extended to handle boost-library items, which should be a separate scoped investigation.
