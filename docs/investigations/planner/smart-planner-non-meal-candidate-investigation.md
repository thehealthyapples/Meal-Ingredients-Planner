# SMART PLANNER NON-MEAL CANDIDATE INVESTIGATION: COMPLETE

**Rollback identifier:** `rollback/before-non-meal-candidate-investigation` (HEAD `c0ea8d5`)

---

## KETCHUP ORIGIN

"Heinz – Tomato Ketchup" enters the user's meals table via **three planner-side creation flows**, all of which call `POST /api/meals` (the generic create endpoint) without setting `mealSourceType`:

| File | Function | Line |
|---|---|---|
| `client/src/pages/weekly-planner-page.tsx` | `addProductToPlanner()` | 1356 |
| `client/src/components/AddToWeekModal.tsx` | `handleConfirm()` | 122 |
| `client/src/components/PlannerAnalyserContent.tsx` | `handleSaveProduct()` | 111 |

All three construct the name as:
```ts
name: product.brand ? `${product.brand} – ${product.product_name}` : product.product_name
```

...with `ingredients: []`, `isReadyMeal: true`, and no `mealSourceType`, so the schema default of `"scratch"` applies.

The **correct** save path — `meals-page.tsx:handleSaveProduct()` → `POST /api/meals/save-product` — sets `mealSourceType: "openfoodfacts"` and is correctly blocked by both the route filter and the service gate. The three planner paths bypass this entirely.

---

## CANDIDATE CLASSIFICATION

| Property | Value |
|---|---|
| **Source** | User meals table (`getMeals(userId)`) |
| **Source label** | `"My Meals"` (set by `convertMealToCandidate` line 253) |
| **`mealSourceType`** | `"scratch"` (default — not excluded by any filter) |
| **`isReadyMeal`** | `true` (not checked by Smart Planner) |
| **`ingredients`** | `[]` (empty — product records carry no ingredient list) |
| **`barcode`** | Set (e.g. Heinz EAN) |
| **`category`** | `null` (no `categoryId` set at creation) |
| **`primaryProtein`** | `null` (inferred from ingredients — empty list → no protein) |
| **Candidate type** | Treated as an internal user meal; effectively a scanned grocery product |

---

## CANDIDATE SCORE

With `ingredients: []` and `category: null`, "Heinz – Tomato Ketchup" scores approximately **87 / 100**:

| Dimension | Weight | Value | Reason |
|---|---|---|---|
| `dietMatch` | 22 | **22** | No excluded keywords in `"heinz – tomato ketchup"` or empty ingredients |
| `goalAlignment` | 13 | **13** (possibly 18) | No problematic keywords; `"tomato"` is a `LOW_CALORIE_KEYWORD` → +5 on lose-weight goal |
| `budgetAlignment` | 13 | **13** | No `prefs.budgetLevel` → defaults to full score |
| `upfScore` | 13 | **13** | No `prefs.upfSensitivity` → defaults to full score |
| `varietyScore` | 13 | **13** | `primaryProtein: null` → variety check skipped entirely — never penalised |
| `overlapScore` | 8 | **0** | Only receives bonuses from overlap; empty ingredients → no overlap, no penalty |
| `cuisineBonus` | 5 | **0** | No cuisine |
| `simplicityBonus` | 13 | **13** | `ingredientCount === 0` → `≤ 6` → **maximum simplicity bonus** |
| **Total** | | **~87** | |

Real meals with 8–15 ingredients typically score 50–70. Ketchup **out-scores genuine meals** because it exploits three scoring dimensions simultaneously: variety is never penalised (null protein), overlap never fires (no ingredients), and simplicity is maximised (0 ingredients ≤ 6 threshold).

---

## SELECTION PATH

1. User opens the planner meal picker panel or Add to Week modal and searches for "Heinz Tomato Ketchup"
2. `addProductToPlanner()` / `handleConfirm()` / `handleSaveProduct()` calls `POST /api/meals` with no `mealSourceType` → stored as `"scratch"`
3. Smart Planner runs → route-level filter at `routes.ts:4857` excludes `"starter"`, `"planner-placeholder"`, `"openfoodfacts"` — `"scratch"` passes
4. Service-level gate at `smart-suggest-service.ts:259` checks `candidateIsProduct(meal.mealSourceType)` → only blocks `"openfoodfacts"` → `"scratch"` passes
5. `convertMealToCandidate` is called → sets `source: "My Meals"`, `category: null`
6. Route then sets `base.category = mealCategories.get(meal.categoryId) || null` → `categoryId` is null → `category` stays null
7. `getCandidateSlotFit(candidate, "dinner")` → `!candidate.category` → returns `slot === "dinner"` → **Dinner only**
8. `scoreMeal` returns ~87 — ketchup wins a dinner slot

---

## ROOT CAUSE

**Data issue + planner issue — both.**

The data issue: three planner-side product creation paths use `POST /api/meals` without `mealSourceType`, defaulting to `"scratch"` instead of the correct `"openfoodfacts"`. This is inconsistent with the `saveProduct` endpoint which correctly sets the source type.

The planner issue: the Smart Planner filter only blocks `"openfoodfacts"`, `"starter"`, and `"planner-placeholder"`. Any product created via the three planner paths evades all source-type gates because it carries `"scratch"` — a value that is indistinguishable from a legitimate user-created recipe.

Additionally, the scoring function rewards empty ingredient lists (maximum simplicity bonus, no variety penalty, no overlap penalty), making product records the highest-scoring candidates despite being unsuitable meals.

---

## CANDIDATE POOL COMPOSITION

From the code: `getMeals(userId)` returns all user meals regardless of `isReadyMeal`, `ingredients` count, or `barcode`. After the three source-type exclusions, the pool includes:

- All user-created recipes (`mealSourceType: "scratch"`)
- All URL-imported recipes (`mealSourceType: "web"`, `"imported_website"`, `"url-import"`)
- **All product records created via planner paths** (`mealSourceType: "scratch"`, `isReadyMeal: true`, `ingredients: []`)
- External TheMealDB / BBC Good Food candidates (separate loop)

Products and meals share a **single candidate pipeline** with no meal-worthiness gate beyond the source-type check.

---

## EXISTING FILTERS AND WHY KETCHUP PASSED

| Filter | Location | Blocks | Ketchup result |
|---|---|---|---|
| `mealSourceType !== "openfoodfacts"` | `routes.ts:4860` | Barcode scans via `saveProduct` endpoint | **PASS** — source is `"scratch"` |
| `mealSourceType !== "starter"` | `routes.ts:4858` | System template meals | **PASS** |
| `mealSourceType !== "planner-placeholder"` | `routes.ts:4859` | Quick-add name placeholders | **PASS** |
| `candidateIsProduct()` | `smart-suggest-service.ts:259` | `openfoodfacts` only | **PASS** |
| Drink / alcohol filter | `smart-suggest-service.ts:265-288` | `isDrink`, `drinkType=alcohol`, drink category | **PASS** — not a drink |
| Hard ingredient exclusions | `smart-suggest-service.ts:290` | User-specified exclusions | **PASS** — no matching ingredients |
| Slot fit gate | `smart-suggest-service.ts:381` | Wrong-slot category meals | **PASS** — `category: null` → always fits Dinner |

No meal-worthiness filter exists. There is no check for `isReadyMeal`, `ingredients.length === 0`, `barcode !== null`, or any combination thereof.

---

## ANSWERS TO KEY QUESTIONS

1. **Why is ketchup being considered a meal?** Created via planner product picker without `mealSourceType: "openfoodfacts"`. Stored as `"scratch"` — same source type as a genuine user recipe. No filter distinguishes them.

2. **Data-quality issue or planner issue?** Both. Three client-side creation paths fail to set the correct source type. The planner filter relies entirely on source type and has no fallback check on `isReadyMeal` or ingredient count.

3. **Are products and meals sharing the same candidate pipeline?** Yes. All user meals enter the same loop. The only separation is the source-type gate, which is bypassed by the `"scratch"` default.

4. **Are scanned products entering the meal candidate pool?** Yes — specifically products added via the planner UI (meal picker, Add to Week modal, analyser panel). Products added via the meals page (`saveProduct` endpoint) are correctly blocked.

5. **Should Smart Planner only use recipes/saved meals/planner-safe templates?** Yes. The intent is to recommend meals the user would cook. Products with no ingredients and `isReadyMeal: true` (barcode items) are not appropriate recommendations.

6. **Smallest safe fix?** Add `mealSourceType: "openfoodfacts"` to the three creation calls, mirroring the existing `saveProduct` endpoint:
   - `weekly-planner-page.tsx:1359`
   - `AddToWeekModal.tsx:126`
   - `PlannerAnalyserContent.tsx:116`

   This is **3 one-line additions** across 3 files. No server changes, no schema changes, no migrations. Existing product records already in the database with `"scratch"` would need either a targeted backfill or a secondary composite guard (`isReadyMeal && ingredients.length === 0 && barcode !== null`).

---

## RISK ASSESSMENT

🟢 **Fix is GREEN** — client-only, copy of a pattern already in use, no logic changes.

The only risk is **existing product records** already stored with `mealSourceType: "scratch"`. These remain in the candidate pool until either:
- A secondary service-level guard is added for `isReadyMeal + empty ingredients + has barcode`
- Or a targeted DB update is run for affected users

A secondary guard without backfill would be sufficient for new sessions.

---

**CODE CHANGES MADE: NONE**
