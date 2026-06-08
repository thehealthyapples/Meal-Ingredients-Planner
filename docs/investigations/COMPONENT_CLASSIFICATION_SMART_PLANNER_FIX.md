COMPONENT CLASSIFICATION SMART PLANNER FIX: COMPLETE

---

**Rollback Identifier (pre-implementation):** `rollback/before-component-classification-2026-06-08` → commit `595a951`
**Implementation Date:** 2026-06-08
**Risk Level:** AMBER — Smart Planner behaviour change

---

## Summary

Classified 11 component recipes as `kind='component'` and added a Smart Planner exclusion filter. Pizza sauce, Classic pesto, and similar sub-components can no longer appear as meal suggestions.

---

## Files Changed

| File | Change |
|---|---|
| `server/routes.ts` | Added `meal.kind !== "component"` filter in Smart Planner pre-pool gate |
| Database `meals` table | 11 rows updated: `kind='meal'` → `kind='component'` |

---

## STEP 1 — COMPONENT AUDIT

### Scope of Search

All meals where `meal_source_type NOT IN ('starter', 'openfoodfacts', 'planner-placeholder', 'ready_meal')` and `is_system_meal = false`. These are user-facing scratch/web/imported meals not already excluded by existing gates.

### Full Candidate List Reviewed

Every recipe from the user corpus was scanned for component-indicating name patterns:
- Names ending in: `sauce`, `dough`, `pesto`, `paste`, `dressing`, `vinaigrette`, `gravy`, `marinade`, `salsa`, `butter`, `aioli`, `mayonnaise`, `batter`, `relish`, `chutney`, `stuffing`, `glaze`, `topping`
- Zero-ingredient branded product entries

---

## STEP 2 — CLASSIFICATION RULES

### Rule 1 — Name Is the Thing

If the recipe name **IS** the component (e.g., "Pizza sauce", "Classic pesto"), it is a component.
If the recipe name is a **meal that contains** a component (e.g., "Pasta with pesto", "Chicken in sauce"), it is a meal.

### Rule 2 — Standalone Edibility Test

Can this item be served and eaten as a complete meal by itself, without it being spread on, poured over, or stuffed inside something else?

- Pizza sauce → No → component
- Chicken Curry → Yes → meal

### Rule 3 — Ingredient Composition Check

Do the ingredients produce only a sub-component that requires a host dish?

- Classic pesto: pine nuts + basil + parmesan + olive oil + garlic → produces only a sauce → component
- Chicken tikka masala: chicken + spices + cream + tomatoes → produces a complete main course → meal

### Worked Examples

| Name | Test | Decision | Reason |
|---|---|---|---|
| Pizza sauce | Name = sauce; ingredients make only sauce; cannot eat standalone | COMPONENT | Confirmed |
| Classic pesto | Name = the sauce; 5 ingredients are pure pesto | COMPONENT | Confirmed |
| Harissa pasta & Mixed nut pesto | "pasta" in name; tofu + spinach = complete dish | MEAL | Not classified |
| Pasta with pesto (hypothetical) | Meal containing pesto as ingredient | MEAL | Not classified |
| Meatballs in tomato sauce (hypothetical) | Complete dish with sauce as component | MEAL | Not classified |
| Sage & onion stuffing | British roast accompaniment; not standalone; breadcrumb/herb composition | COMPONENT | Confirmed |

---

## STEP 3 — RECORDS UPDATED

### Before

All 2,076 meals had `kind = 'meal'`.

### SQL Executed

```sql
UPDATE meals
SET kind = 'component'
WHERE id IN (2037, 1557, 1773, 1763, 1920, 1921, 2166, 2167, 2168, 2170, 2171)
RETURNING id, name, kind;
```

### Records Changed (11 total)

| ID | Name | Previous kind | New kind | Classification Reason |
|---|---|---|---|---|
| 1557 | Classic pesto | meal | component | Name = sauce; 5 ingredients: pine nuts, basil, parmesan, olive oil, garlic. Pure condiment. |
| 1763 | Really easy roasted red pepper sauce | meal | component | Name = sauce; 7 ingredients produce only a sauce for other dishes. |
| 1773 | Classic pesto | meal | component | Duplicate of ID 1557; same recipe. |
| 1920 | Sage & onion stuffing | meal | component | British roast side; ingredients: butter, onion, sage, breadcrumbs, egg. Not standalone. |
| 1921 | Sage & onion stuffing (Edited) | meal | component | Edited copy of ID 1920; same recipe. |
| 2037 | Pizza sauce | meal | component | Name = sauce; 9 ingredients produce tomato pizza sauce. Cannot be eaten as a meal. |
| 2166 | Heinz – Tomato Ketchup | meal | component | Branded condiment; zero ingredients; not a recipe. |
| 2167 | Heinz – Tomato Ketchup BIO | meal | component | Branded condiment; zero ingredients; not a recipe. |
| 2168 | Heinz – Tomato Ketchup BIO | meal | component | Branded condiment; zero ingredients; not a recipe. |
| 2170 | Heinz – Tomato Ketchup BIO | meal | component | Branded condiment; zero ingredients; not a recipe. |
| 2171 | Heinz – Tomato Ketchup | meal | component | Branded condiment; zero ingredients; not a recipe. |

### After

| kind | count |
|---|---|
| meal | 2,065 |
| component | 11 |

---

## STEP 4 — SMART PLANNER EXCLUSION

### Location

`server/routes.ts` — Smart Planner candidate pre-pool gate (line ~4868)

### Filter Added

```typescript
// Exclude component recipes (sauces, bases, condiments, stuffings) — these are
// cooking sub-components, not standalone meals. kind='component' is the shared
// classification used by the UI's meal search filter and this pool gate.
userMeals = userMeals.filter(meal => meal.kind !== "component");
```

### Position in Filter Chain

The filter was inserted after the source-type gate and before the premium content gate. Position in the ordered filter sequence:

1. Drink/alcohol filter (meals with drinkType=alcohol or isDrink=true)
2. Source type gate (starter, planner-placeholder, openfoodfacts)
3. **← Component filter inserted here (`kind !== 'component'`)**
4. Premium/subscriber content gate
5. Household eater hard restrictions
6. Profile dietary hard filter (dietRules engine)
7. Slot category fit
8. Scoring and selection

### What Was NOT Changed

- Dietary rules engine — unchanged
- Scoring logic — unchanged
- Variety logic — unchanged
- Cuisine logic — unchanged
- Budget logic — unchanged
- Household restriction logic — unchanged
- External candidate pipeline — unchanged

---

## STEP 5 — TEST RESULTS

### Automated Test Suite

```
test:additives        13/13 passed
test:extracts         12/12 passed
test:scoring          18/18 passed
test:ingredient-language  76/76 passed
test:planner-compliance   25/25 passed
```

All tests pass. No regressions.

### TypeScript

```
npx tsc --noEmit → 0 errors
```

### Build

```
npm run build → ✓ built in 10.64s (0 errors, 0 warnings except pre-existing chunk size)
```

### Smart Planner Eligibility Simulation (DB Query)

**Components — now EXCLUDED:**

| Name | kind | Status |
|---|---|---|
| Pizza sauce | component | EXCLUDED-component ✅ |
| Classic pesto | component | EXCLUDED-component ✅ |
| Classic pesto (duplicate) | component | EXCLUDED-component ✅ |
| Really easy roasted red pepper sauce | component | EXCLUDED-component ✅ |
| Sage & onion stuffing | component | EXCLUDED-component ✅ |
| Sage & onion stuffing (Edited) | component | EXCLUDED-component ✅ |
| Heinz – Tomato Ketchup | component | EXCLUDED-component ✅ |
| Heinz – Tomato Ketchup BIO ×3 | component | EXCLUDED-component ✅ |

**Complete meals — still ELIGIBLE:**

| Name | kind | Status |
|---|---|---|
| Chicken Curry | meal | ELIGIBLE ✅ |
| Chicken tikka masala | meal | ELIGIBLE ✅ |
| Chilli con carne recipe | meal | ELIGIBLE ✅ |
| Classic lasagne | meal | ELIGIBLE ✅ |
| Harissa pasta & Mixed nut pesto | meal | ELIGIBLE ✅ |

---

## STEP 6 — BEFORE/AFTER

### Before Implementation

- Component recipes in Smart Planner eligible pool: **11**
- All 2,076 meals had `kind = 'meal'`
- No Smart Planner filter existed for `kind`

### After Implementation

- Component recipes in Smart Planner eligible pool: **0**
- 2,065 meals have `kind = 'meal'`
- 11 meals have `kind = 'component'`
- Smart Planner route filters `meal.kind !== "component"` before scoring

### Net change to Smart Planner dinner pool

Pizza sauce no longer eligible as a dinner candidate. Classic pesto no longer eligible as a dinner candidate. Confirmed by DB simulation query.

---

## DATA IMPACT DECLARATION

| Check | Answer |
|---|---|
| Reads existing data | Yes |
| Writes new data | No |
| Changes meaning of existing data | Yes — 11 recipes reclassified from meal to component |
| Requires backfill | One-time — completed |

---

## EVERY MEAL CHANGED (full provenance)

| ID | Name | Old kind | New kind | Reasoning |
|---|---|---|---|---|
| 1557 | Classic pesto | meal | component | Rule 1 (name = sauce) + Rule 3 (pure condiment ingredients) |
| 1763 | Really easy roasted red pepper sauce | meal | component | Rule 1 (name = sauce) + Rule 3 (pepper/tomato sauce ingredients) |
| 1773 | Classic pesto | meal | component | Rule 1 + Rule 3 (duplicate of 1557) |
| 1920 | Sage & onion stuffing | meal | component | Rule 2 (cannot standalone) + Rule 3 (breadcrumb/herb composition) |
| 1921 | Sage & onion stuffing (Edited) | meal | component | Edited fork of 1920; same content |
| 2037 | Pizza sauce | meal | component | Rule 1 + Rule 2 + Rule 3 (confirmed root cause item) |
| 2166 | Heinz – Tomato Ketchup | meal | component | Product/condiment; zero ingredients; Rule 2 |
| 2167 | Heinz – Tomato Ketchup BIO | meal | component | Product/condiment; zero ingredients; Rule 2 |
| 2168 | Heinz – Tomato Ketchup BIO | meal | component | Product/condiment; zero ingredients; Rule 2 |
| 2170 | Heinz – Tomato Ketchup BIO | meal | component | Product/condiment; zero ingredients; Rule 2 |
| 2171 | Heinz – Tomato Ketchup | meal | component | Product/condiment; zero ingredients; Rule 2 |

---

## DEFINITION OF DONE — CHECKLIST

- [x] Obvious components are classified (`kind = 'component'` on 11 records)
- [x] Smart Planner excludes components (`meal.kind !== "component"` filter added)
- [x] No complete meals were misclassified (Harissa pasta & Mixed nut pesto kept as meal)
- [x] Build passes (`npm run build` — 0 errors)
- [x] TypeScript passes (`npx tsc --noEmit` — 0 errors)
- [x] Tests pass (144/144 across all suites)
- [x] Pizza sauce absent from Smart Planner pool (confirmed by DB query)
- [x] Classic pesto absent from Smart Planner pool (confirmed by DB query)
- [x] Complete meals (Chicken Curry, Lasagne, Chilli) still eligible (confirmed by DB query)
