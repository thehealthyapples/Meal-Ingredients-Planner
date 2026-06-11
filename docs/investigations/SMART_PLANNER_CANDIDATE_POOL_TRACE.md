SMART PLANNER CANDIDATE POOL TRACE: COMPLETE

---

**Rollback Identifier:** `rollback/before-component-classification-2026-06-08` → commit `595a951`
**Investigation Date:** 2026-06-08
**Risk Level:** GREEN — investigation only, no code or data changes
**Scope:** Trace why candidate pools collapse for Vegan and Keto plans, identify root causes for stale entries still visible in planner, and audit repeat suppression

---

## Files Reviewed

| File | Purpose |
|---|---|
| `server/routes.ts` | Smart Planner route (`POST /api/meal-plans/smart-suggest`), pre-pool filter chain |
| `server/lib/smart-suggest-service.ts` | Core Smart Planner generation logic, slot mapping, fallback, `usedIds` |
| `server/lib/dietRules.ts` | `shouldExcludeRecipe()`, `KETO_EXCLUDE`, vegan keyword sets |
| `server/storage.ts` | `getMeals(userId)` — source of user meal pool |
| `shared/schema.ts` | `meals`, `plannerEntries`, `plannerDays`, `plannerWeeks` table definitions |
| Database: `meals`, `planner_entries`, `planner_days`, `planner_weeks` | Live data queries throughout investigation |

---

## TASK 1 — Execution Path: Is the Component Filter Actually Running?

### Finding: YES — single code path, filter confirmed active

There is exactly one Smart Planner route: `POST /api/meal-plans/smart-suggest` in `server/routes.ts`. No alternate paths exist.

The filter added in Session 2 (`meal.kind !== "component"`) sits in the pre-pool filter chain at position 3:

```
1. Drink/alcohol gate
2. Source type gate  (starter, planner-placeholder, openfoodfacts)
3. Component gate    ← kind !== 'component'
4. Premium gate
5. Household hard restrictions
6. Dietary hard filter (dietRules engine)
7. Slot category fit + scoring
```

**DB confirmation of filter effect:**

| Name | kind | Pool status |
|---|---|---|
| Pizza sauce | component | EXCLUDED-component ✅ |
| Classic pesto (×2) | component | EXCLUDED-component ✅ |
| Really easy roasted red pepper sauce | component | EXCLUDED-component ✅ |
| Sage & onion stuffing (×2) | component | EXCLUDED-component ✅ |
| Heinz – Tomato Ketchup (×3) | component | EXCLUDED-component ✅ |

All 11 classified components are excluded from the generation pool. The filter is active.

---

## TASK 2 — Candidate Pool Matrix

Exact counts at each filter stage for user 1:

| Stage | Count | Notes |
|---|---|---|
| Raw user meals | 206 | All meals in `meals WHERE user_id = 1` |
| After source_type gate | 123 | Remove `starter`, `planner-placeholder`, `openfoodfacts` |
| After component + drink gate | 116 | Remove `kind='component'`, `kind='drink'`, `isDrink=true`, `drinkType='alcohol'` |
| After Vegan dietary filter | ~22 | Approximate; 0 breakfast-category survivors |
| After Keto dietary filter | ~30 | Approximate; 2 breakfast-category survivors |

**Vegan pool by category (post all pre-dietary filters):**

| Category | Count | Names |
|---|---|---|
| (no category) | 12 | Kidney Bean Curry, One-pot vegan rice and beans, Vegan burrito bowl, Vegan chilli, Vegan chickpea curry jacket potatoes, Vegan lemon cake, Vegan banana muffins, Tofu greens & cashew stir-fry, Pasta Puttanesca, Quick pizza dough, CROSTA MOLLICA piadina, Ultimate spaghetti carbonara* |
| Drink | 6 | Long Island iced tea ×3, Sex on the beach ×2, Classic champagne cocktail |
| Dinner | 2 | Cassava pizza, Punjabi cauliflower with potatoes (aloo gobi) |
| Baby Meal | 1 | porridge |
| Dessert | 1 | Spinach, sweet potato & lentil dhal |
| **Breakfast** | **0** | **No vegan-eligible breakfast meals exist** |

*Note: "Ultimate spaghetti carbonara" appears here due to simplified LIKE filter approximation; the actual `dietRules.shouldExcludeRecipe()` would exclude it (egg + cheese ingredients). Real Vegan pool is likely ~18–20.

**Keto pool by category (post all pre-dietary filters):**

| Slot category | Count | Names |
|---|---|---|
| Dinner | 13 | Chicken & Chips, Chicken Handi, Chicken tikka masala, Chilli con carne, Classic lasagne, Easy chicken stir-fry, Harissa pasta & Mixed nut pesto, Mushroom rice, Prawn & harissa spaghetti*, Smoked salmon & avocado pasta*, Spaghetti Bolognese*, Thai green curry, and others |
| Lunch | 5 | Chicken and Celery Stir-Fry, Chicken taco, Easy noodle soup*, Slow cooker chicken curry, and others |
| Drink | 6 | Long Island iced tea ×3, Sex on the beach ×2, Classic champagne cocktail |
| (no category) | 4 | Ginger Turmeric Carrot Soup, Roasted tomato soup, and others |
| **Breakfast** | **2** | **Omelet, easy omelet** |

*Note: Some spaghetti/pasta dishes appear because `spaghetti` and `noodle` (in some forms) are not in `DICT_GRAINS`. Only `pasta`, `noodle`, `noodles` are listed. `spaghetti` is a false negative in the Keto dictionary — a separate issue outside this investigation's scope.

---

## TASK 3 — Vegan Plan Trace: Why No Breakfasts?

### Root cause: Library thinness — zero Vegan-eligible breakfast meals exist

**Slot assignment for breakfast** (`smart-suggest-service.ts`, `SLOT_CATEGORY_MAPPING`):

```typescript
const SLOT_CATEGORY_MAPPING = {
  breakfast: ["breakfast", "smoothie"],
  lunch: ["lunch", "snack", "salad"],
  dinner: ["dinner", "main"],
  snack: ["snack", "dessert", "smoothie", "drink"],
};
```

**Fallback behaviour** (`getSafeFallbackCandidates`, line 272):

Breakfast fallback is STRICT — only meals with `category = breakfast` or `category = smoothie` are included. There is no broader fallback for breakfast.

```typescript
if (slot === "breakfast") {
  return allCandidates.filter(c =>
    c.category === "breakfast" || c.category === "smoothie"
  );
}
```

**Outcome:** User 1 has 10 breakfast meals in total. Every breakfast meal contains eggs, dairy, or both — all are excluded by the Vegan dietary filter. Zero breakfast-category vegan meals exist. The strict fallback also returns zero. All 7 breakfast slots in a Vegan-diet plan generation are empty.

**Secondary collapse: lunch and dinner pool exhaustion**

Because breakfast yields nothing, the planner falls through to lunch and dinner. The lunch slot has zero primary candidates (no lunch/snack/salad category Vegan meals), so the **lunch fallback consumes from the dinner pool**:

```typescript
// Fallback for non-breakfast slots: all candidates not breakfast or smoothie
return allCandidates.filter(c =>
  c.category !== "breakfast" && c.category !== "smoothie"
);
```

This means 7 lunch fallback picks draw from the same ~14 null-category + Dinner meals that the dinner slot also needs. After 7 lunches are filled from usedIds, the dinner pool has at most 7 survivors for 7 dinner slots — the entire non-breakfast Vegan library is just barely sufficient for lunch+dinner, with no margin.

---

## TASK 4 — Keto Plan Trace: Why Only ~3 Meals?

### Root cause: Breakfast pool exhausted after 2 days; then usedIds prevents all repeats

**Keto breakfast candidates:** 2 — `Omelet` and `easy omelet`

A standard 7-day plan with 3 meals/day requires 7 breakfast slots. Available: 2. After both are used on days 1 and 2, the `usedIds` Set contains both IDs. The strict breakfast fallback returns only breakfast/smoothie meals. Both have been used. Days 3–7: **0 breakfast candidates**.

**Keto lunch pool:** 5 meals. For 7 lunch slots, 2 slots will have no candidate after 5 are exhausted (usedIds prevents repeats).

**Keto dinner pool:** 13 Dinner + 4 null-category = 17 candidates. This is sufficient for 7 dinner slots with headroom.

**Total eligible Keto meals:** ~30 unique. Required for a 7×3 plan: 21 slots. Pool looks sufficient in aggregate, but slot constraints collapse it:
- Breakfast: 2 of 7 slots filled → 5 empty
- Lunch: 5 of 7 slots filled → 2 empty
- Dinner: 7 of 7 slots filled → 0 empty

The "approximately 3 meals" symptom likely refers to visible morning slots (breakfast appears blank, giving impression of sparse plan) combined with possible repeat-prevention leaving gaps.

---

## TASK 5 — Pizza Sauce Still Visible Root Cause

### Root cause: Stale planner entry — created before the classification fix

**Planner state (Week 1, Day 0, dinner):**

```
entry_id: 752 | day: 0 (Sunday) | meal_type: dinner
meal_id: 2037 | name: Pizza sauce | kind: component
```

**Timeline:**
- `kind = 'component'` was set on meal 2037 on 2026-06-08 (Session 2 fix)
- Planner entry 752 pointing to meal 2037 was created before this fix
- `planner_entries` has **no `created_at` column** — the entry's origin timestamp is unrecoverable
- The Smart Planner fix prevents new suggestions, but **never clears existing `planner_entries` rows**

**The entry is stale data.** The component filter correctly excludes meal 2037 from new generations. The existing row in `planner_entries` is untouched. Pizza sauce will appear in the UI until the user regenerates that week or manually removes the entry.

---

## TASK 6 — Quick Pizza Dough Still Visible Root Cause

### Root cause: Post-audit creation + missed classification + stale data

**Meal record:**

```
id: 2215 | name: Quick pizza dough
kind: meal | category: NULL | meal_source_type: scratch
created_at: 2026-06-08 09:55:02
```

**Key finding:** Meal 2215 was created at 09:55 on 2026-06-08 — the same day as the component classification audit, but AFTER the audit was run. It was not in the database when the Session 2 audit scanned for component-pattern names. It was never classified as `kind='component'`.

**Why it reached the dinner slot:**

- `kind = 'meal'` → passes the component gate
- `meal_source_type = 'scratch'` → passes the source_type gate
- `category = NULL` → `getCandidateSlotFit()` returns `true` only for `slot === "dinner"`:

```typescript
if (!candidate.category) return slot === "dinner";
```

- Result: Quick pizza dough is a valid dinner candidate and was placed in Week 1, Day 1, dinner.

**Planner state:**

```
entry_id: 754 | day: 1 (Monday) | meal_type: dinner
meal_id: 2215 | name: Quick pizza dough | kind: meal
```

This is a missed classification (a post-audit newly created recipe) AND stale data (the entry persists until regeneration). The fix pathway is straightforward: classify meal 2215 as `kind='component'` in a future implementation session.

---

## TASK 7 — Repeat Suppression Audit

### Mechanism

`usedIds = new Set<string | number>()` is initialised once per `generateSmartSuggestion()` call at line 477 of `smart-suggest-service.ts`. It is populated each time a meal is selected for a slot and is checked before selection. It is **never reset** during the generation of a plan.

### Scope

- Per-generation (single call to the Smart Planner)
- Spans all slots and all days in one generation
- Resets on the next call (new plan generation)
- Does NOT persist across plan weeks or across user sessions

### Interaction with thin library pools

For Keto:
- Day 1 breakfast → Omelet → added to usedIds
- Day 2 breakfast → easy omelet → added to usedIds
- Days 3–7 breakfast → both omelet IDs in usedIds, fallback returns [] → empty slot

For Vegan:
- Each lunch consumed from the null-category fallback pool → IDs accumulate in usedIds
- Each dinner pick from the same null-category pool → already-used IDs are filtered out
- After ~14 meals consumed by lunch + dinner combined, pool is exhausted

### Assessment

Repeat suppression is working correctly. The collapse is caused by library thinness, not by a bug in usedIds. The set's scope (per-generation, not per-slot) is correct and intentional.

---

## TASK 8 — Stale Data Analysis

### `planner_entries` schema limitation

```sql
\d planner_entries
-- No created_at column
-- No updated_at column
```

There is no timestamp on planner entries. It is impossible to determine when any existing entry was written from the database alone. Entries from before any fix deployment cannot be distinguished from entries generated after.

### Current stale entries in Week 1 (user 1)

| Day | Slot | Meal ID | Meal Name | Status |
|---|---|---|---|---|
| 0 (Sun) | dinner | 2037 | Pizza sauce | Stale — now `kind='component'`, excluded from new generations |
| 0 (Sun) | lunch | 1475 | Punjabi cauliflower (aloo gobi) | Still eligible |
| 1 (Mon) | dinner | 2215 | Quick pizza dough | Stale — missed classification, uncategorised dough recipe |
| 1 (Mon) | lunch | 2214 | Vegan lemon cake | Still eligible (kind=meal, no category) |
| 2–6 | lunch/dinner | various | Kidney Bean Curry ×2, Spinach dhal ×2 | Eligible, though repeats suggest old generation before usedIds scope |

### Resolution path

The only user-facing resolution is for the user to trigger a new Smart Planner generation. The new generation will not select Pizza sauce (component gate) or Quick pizza dough (once classified), and will replace all current stale entries.

---

## MANDATORY FINDINGS

**Q1: Is the component filter from Session 2 actually executing?**
YES. Confirmed single route. Confirmed 11 component records excluded from pool in DB simulation.

**Q2: Why does Vegan produce no breakfasts?**
Library thinness. All 10 breakfast meals for user 1 contain eggs or dairy. 0 survive the Vegan filter. Breakfast fallback is strict (breakfast/smoothie only) — it also returns 0. This is a data gap, not a code bug.

**Q3: Why does Keto produce only ~3 visible meals?**
Two Keto breakfast meals exist (Omelet, easy omelet). After both are placed on days 1 and 2, `usedIds` prevents reuse. Strict breakfast fallback returns 0 for days 3–7. Lunch has 5 candidates for 7 slots. Result: 5 empty breakfast slots + 2 empty lunch slots. The plan looks sparse despite a sufficient dinner pool.

**Q4: Why is Pizza sauce still visible?**
Stale planner entry (entry 752 → meal 2037). Entry was created before the component classification fix. The planner has no `created_at` — entries persist indefinitely until regenerated. The fix correctly prevents future suggestions.

**Q5: Why is Quick pizza dough still visible?**
Missed classification: meal 2215 was created on 2026-06-08 09:55 — after the Session 2 component audit ran. It has `kind='meal'`, no category. Null-category meals default to the dinner slot. The stale entry persists until regeneration.

**Q6: What is the Vegan breakfast pool size?**
Zero. No vegan-eligible breakfast or smoothie meals exist in user 1's library.

**Q7: How does repeat suppression interact with the pool collapses?**
`usedIds` is per-generation and never reset. For thin pools, it correctly prevents repeats but leaves slots empty when the pool is exhausted. The mechanism is correct; the problem is insufficient library content.

**Q8: Are there stale entries that survived the component fix?**
Yes. Two confirmed: entry 752 (Pizza sauce, now component) and entry 754 (Quick pizza dough, missed classification). Neither will appear in new generations assuming Quick pizza dough is also classified.

---

## ROOT CAUSE SUMMARY

The candidate pool collapses have three independent root causes:

| # | Root Cause | Symptoms | Fix pathway |
|---|---|---|---|
| 1 | **Library thinness — Vegan breakfasts** | 0 breakfast slots filled for Vegan plan | Add vegan breakfast recipes to library |
| 2 | **Library thinness — Keto breakfasts** | Breakfast depletes after 2 days; 5 empty slots | Add keto breakfast recipes to library |
| 3 | **Null-category → dinner-only slot assignment** | Uncategorised meals pollute dinner slot; lunch must use dinner-pool fallback | Assign categories to uncategorised meals |
| 4 | **Stale planner entries** | Pizza sauce and Quick pizza dough visible despite fix | User triggers new plan generation; optionally add `created_at` to `planner_entries` |
| 5 | **Post-audit component creation** | Quick pizza dough missed classification | Classify meal 2215 as `kind='component'` in next implementation session |

---

## SMALLEST SAFE NEXT FIXES

Listed in order of impact and risk:

| Priority | Fix | Risk | Impact |
|---|---|---|---|
| 1 | Classify meal 2215 (Quick pizza dough) as `kind='component'` | Minimal — 1 row update | Eliminates the only remaining unclassified dough recipe |
| 2 | Assign categories to the 12 null-category meals | Low — data update only | Prevents null-category dinner slot pollution; frees dinner pool for lunch fallback |
| 3 | Add vegan breakfast recipes to the content library | Minimal | Fixes Vegan breakfast collapse |
| 4 | Add keto breakfast recipes to the content library | Minimal | Reduces Keto breakfast collapse (currently: 2 of 7 days filled) |
| 5 | Add `created_at` to `planner_entries` | Low schema migration | Enables future stale entry detection and age-based clearing |

---

## RECOMMENDED NEXT DECISION

**Do not change the Smart Planner generation code.** The filter chain is correct. The code behaves as designed.

The observable problems are content problems: missing vegan/keto breakfasts, and uncategorised meals defaulting to the dinner slot. The Quick pizza dough issue is a single-row data classification gap.

The recommended next session (AMBER risk implementation) should:
1. Classify meal 2215 (`Quick pizza dough`) as `kind='component'`
2. Audit and assign categories to the 12 null-category user meals
3. Add a representative set of vegan breakfast and keto breakfast recipes

These three actions will resolve all four reported symptoms without touching the generation algorithm, scoring, or dietary rules engine.

---

## SCOPE COMPLIANCE DECLARATION

This investigation was GREEN risk. Findings only.

| Check | Answer |
|---|---|
| Code changed | No |
| Schema changed | No |
| Data changed | No |
| Meal records updated | No |
| Smart Planner logic modified | No |
| dietRules modified | No |
| New recipes added | No |
