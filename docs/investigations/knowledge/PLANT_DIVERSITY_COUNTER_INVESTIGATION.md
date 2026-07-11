# Plant Diversity Counter Investigation

**Date:** 2026-06-10
**Status:** Complete — investigation only
**Rollback tag:** `rollback/plant-diversity-counter-investigation-20260610-191706`

---

## Summary

A `WeeklyPlantDiversityCounter` component already exists and is live in the planner.
It displays "30 Plants This Week" with a progress bar and the correct aspiration.

However, the current implementation has two significant accuracy problems:

1. **Deduplication is naive.** The counter uses `raw.toLowerCase().trim()` as the
   unique key. "400g tinned tomatoes" and "cherry tomatoes" from different meals both
   pass the plant filter and count as two separate plants.

2. **Whole food groups are missing.** `computeMealVariety` — the plant classifier
   the counter depends on — scores only 5 categories: fruits, vegetables, whole grains,
   herbs/spices, and olive oil. Legumes, seeds, nuts, and fermented foods score zero.
   Chickpeas, pumpkin seeds, walnuts, and kimchi currently count as 0 plants each.

Both problems are fixable using existing architecture. No new tables or APIs are needed.
The fix is contained to two files.

---

## 1. Existing Ingredient Architecture

### Normalisation pipeline (3 layers)

| Layer | Function | Location | What it does |
|-------|----------|----------|-------------|
| 1 | `normalizeIngredientKey` | `shared/normalize.ts` | Lowercase, strip diacritics, strip punctuation, collapse spaces |
| 2 | `resolveIngredientAlias` | `shared/ingredient-aliases.ts` | Maps ~80 known variants to canonical keys (cherry tomatoes → tomatoes, arugula → rocket, extra virgin olive oil → olive oil) |
| 3 | `normaliseForReuse` | `client/src/lib/ingredient-reuse.ts` | `stripForMatch` (strips quantities, units, 27 prep words) + `resolveIngredientAlias` |

The `normaliseForReuse` pipeline is the most capable. It handles:
- `"400g tinned tomatoes"` → `"tomatoes"`
- `"fresh basil"` → `"basil"`
- `"a handful of pumpkin seeds"` → `"pumpkin seeds"`
- `"extra virgin olive oil"` → `"olive oil"`
- `"baby spinach"` → `"spinach"`

### Ingredient classification (DB layer)

`ingredient_classifications` table (`shared/schema.ts:1311`) stores:
- `normalizedKey`, `canonicalName`, `canonicalKey`, `category`, `subcategory`
- Populated by AI classifier (`server/lib/classification-store.ts`) triggered on shopping list item adds
- Review status: `pending` → admin-reviewed → `approved`

This is a shopping-list-side classification system, not a planner-side one. It is
**not currently used by the plant counter** and is not reliably populated for all
ingredients in all planner meals. Cannot be used as the source of truth for a plant
diversity count without guaranteed coverage.

### `normalizedIngredients` table

`shared/schema.ts:135` — stores `name`, `normalizedName`, `category`. Used for
product matching. **Not structured for plant/non-plant classification.**

---

## 2. The Existing WeeklyPlantDiversityCounter

**Location:** `client/src/components/nutrition-variety-chips.tsx:279–364`

**What it does correctly:**
- Displays "30 Plants This Week" label + `uniqueCount / 30` + progress bar
- Deduplicates within the current iteration (same raw string won't be double-counted)
- Filters non-plants: only ingredients that score `total > 0` from `computeMealVariety`
- Is live and wired up in the planner page (line 1763)

**Data flow:**
```
weekly-planner-page.tsx
  weekIngredients (useMemo, line 469)
    → activeWeekData.days[].entries[].mealId
    → mealById.get(mealId).ingredients  ← raw string[] from meals table
  → WeeklyPlantDiversityCounter(weekIngredients)
    → for each ingredient string: computeMealVariety([raw]).total > 0 → add norm to Set
```

**Problem 1 — Naive deduplication key:**
```typescript
// current (line 301)
const norm = raw.toLowerCase().trim();
```

This means the following all count as separate plants:
- `"Tomatoes"` from Monday pasta
- `"Cherry Tomatoes"` from Tuesday salad
- `"400g tinned tomatoes"` from Thursday soup
- `"Vine Tomatoes"` from Friday tray bake

= 4 plant counts where the correct answer is 1.

The `resolveIngredientAlias` pipeline already maps cherry/plum/vine/roma tomatoes →
`"tomatoes"`, and `normaliseForReuse` strips the `"400g tinned"` prefix. Using
`normaliseForReuse` as the dedup key would reduce this to 1 count.

**Problem 2 — computeMealVariety misses major plant groups:**

`computeMealVariety` (`client/src/lib/nutrition-variety.ts`) scores 5 categories:
`fruits`, `vegetables`, `wholeGrains`, `herbsSpices`, `oliveOil`. Maximum score per
ingredient: 1. It was designed for a meal-level "variety at a glance" feature, not
for cross-meal plant diversity counting.

Current blind spots:

| Food group | Example ingredients | Current score |
|------------|---------------------|---------------|
| Legumes | Chickpeas, Lentils, Black Beans, Mixed Beans | 0 |
| Seeds | Pumpkin Seeds, Chia Seeds, Flax Seeds, Sesame Seeds | 0 |
| Nuts | Walnuts, Almonds, Cashews, Pine Nuts | 0 |
| Fermented | Sauerkraut, Kimchi, Miso | 0 |
| Mushrooms | Chestnut Mushrooms, Mixed Mushrooms | 1 (via VEGETABLES) ✓ |

Note: mushrooms are already in VEGETABLES (`"mushroom"`, `"mushrooms"`) so they DO
count today. But all of legumes, seeds, nuts, and fermented score zero.

This means a household eating a plant-rich diet with:
- Lentil soup
- Chickpea curry
- Walnut salad
- Pumpkin seed porridge
- Kimchi rice

…would currently show 0 plants from all of those meals.

---

## 3. Plant Counting Feasibility

### Can THA deduplicate tomatoes across days?

**Today:** No. "Tomatoes", "cherry tomatoes", "400g tinned tomatoes" = 3 plants.

**With fix:** Yes. `normaliseForReuse("cherry tomatoes")` → `"tomatoes"` via
`resolveIngredientAlias`. All tomato forms would collapse to one key.

### Tomatoes appearing Monday / Tuesday / Thursday

With the `normaliseForReuse` dedup fix, all three entries produce key `"tomatoes"`,
which would be added to a `Set` once. **Result: 1 plant. Correct.**

### Can THA count cross-week unique plants?

The `weekIngredients` useMemo currently covers the **active week only** (one of the
six planner weeks). To count across all 6 weeks, `weekIngredients` would need to be
built from all weeks, or a separate multi-week memo created. The data is already
available via `fullPlanner` and `mealById` — it is a matter of scope, not architecture.

---

## 4. Category Mapping Feasibility

### Existing categories (in `computeMealVariety`)

| Category | Coverage quality |
|----------|-----------------|
| Fruits | Good — 35 entries, includes avocado |
| Vegetables | Good — 55 entries, mushrooms included |
| Whole grains | Good — 20+ entries, oats/quinoa/brown rice/bulgur |
| Herbs & spices | Excellent — 60+ entries, includes curry powder, garam masala, za'atar |
| Olive oil | Good — substring match handles quantities |

### Missing categories for plant diversity

| Category | Needed | Existing data? | Source |
|----------|--------|----------------|--------|
| Legumes | Yes | Partial — some in VEGETABLES (edamame, green beans) | `ingredient-utils.ts:294` has legumes list |
| Seeds | Yes | None in nutrition-variety.ts | `ingredient-utils.ts:293` includes seeds |
| Nuts | Yes | None in nutrition-variety.ts | `ingredient-utils.ts:293` includes nuts |
| Fermented | Yes | None | Manual list needed |

`server/lib/ingredient-utils.ts` already has a `nuts` and `legumes` classification list:
```typescript
nuts: ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'peanut', 'hazelnut',
       'macadamia', 'pine nut', 'brazil nut', 'chestnut', 'sesame seed',
       'sunflower seed', 'pumpkin seed', 'flaxseed', 'chia seed'],
legumes: ['lentil', 'chickpea', 'kidney bean', 'black bean', 'cannellini',
          'butter bean', 'haricot', 'edamame', 'tofu', 'tempeh'],
```

These exist on the server side and would need to be **mirrored into
`nutrition-variety.ts`** (client-side) for the plant counter to use them. This is
the same pattern already used for FRUITS, VEGETABLES, HERBS_SPICES.

### Category mapping for the 30 plants guideline

The 30 plants/week concept (as popularised by the TwinsUK / Zoe research) explicitly
includes all of: vegetables, fruits, whole grains, legumes/pulses, nuts, seeds,
herbs, spices, and olive oil as separate plant sources.

THA's current 5-category model covers 3 of these groups adequately.
Missing: legumes, seeds, nuts, fermented foods.

---

## 5. Edge Cases

### Mixed Beans

**Current behaviour:** `computeMealVariety(["Mixed Beans"])` — normaliseIngredientKey
gives `"mixed beans"`. The VEGETABLES list contains `"broad beans"`, `"green beans"`,
`"runner beans"` but NOT `"mixed beans"` as a phrase. `hasWord("mixed beans", "beans")`
is not explicitly tested either. **Result: likely 0 today.**

**Correct approach:** Count as 1 plant (same as a specific bean variety). Mixed beans
is a single plant-food ingredient regardless of the mix.

**Fix path:** Add `"beans"` (as substring or word match) and `"mixed beans"` explicitly
to a new legumes word list. Or add `"mixed beans"` to `ingredient-aliases.ts` resolving
to `"beans"`.

---

### Five Bean Mix

**Current behaviour:** `"five bean mix"` — no match in any category. **Result: 0.**

**Correct approach:** 1 plant (equivalent to Mixed Beans).

**Fix path:** Alias `"five bean mix"` → `"mixed beans"` → count as 1 plant.

---

### Mixed Seeds

**Current behaviour:** `"mixed seeds"` — not in any category. **Result: 0.**

**Correct approach:** 1 plant. Mixed seeds is a single addition even if it contains
multiple seed varieties. The 30 plants research counts food items, not their components.

**Fix path:** Add `"seeds"` word match to a new seeds word list.

---

### Italian Herbs

**Current behaviour:** `"italian herbs"` — not explicitly in HERBS_SPICES. The list
has `"mixed herbs"` but not `"italian herbs"`. **Result: likely 0.**

Actually, checking carefully: `hasWord("italian herbs", "herbs")` — HERBS_SPICES
contains `"dried herbs"`, `"fresh herbs"`, `"mixed herbs"` but NOT just `"herbs"`.
So `matchesAny("italian herbs", HERBS_SPICES)` → `false`. **Result: 0.**

**Correct approach:** 1 plant (same as mixed herbs). A herb blend counts as a plant.

**Fix path:** Add `"herbs"` as a standalone word entry to the HERBS_SPICES list.

---

### Curry Powder

**Current behaviour:** `"curry powder"` IS in HERBS_SPICES. `hasWord("curry powder",
"curry powder")` → `true`. **Result: 1 plant. Correct.**

---

### Passata

**Current behaviour:** `"passata"` — not in VEGETABLES, not in any category. It IS
classified as a condiment in `ingredient-utils.ts:292`. `computeMealVariety`
would score 0. **Result: 0.**

**Correct approach:** This is debatable. Passata is cooked/pureed tomato. Most plant
diversity frameworks count it the same as tomatoes. However, THA's ingredient-alias
system does NOT map `passata → tomatoes`. If counting passata as a plant is desired,
it requires either:
a) An alias: `passata → tomatoes`
b) A direct entry in the vegetables word list

This is a **policy decision**. The investigation recommends treating processed tomato
products (passata, tomato puree, tomato paste) as equivalent to tomatoes for plant
counting purposes.

---

### Tomato Puree

**Current behaviour:** `computeMealVariety(["Tomato Puree"])` — normaliseIngredientKey
→ `"tomato puree"`. `hasWord("tomato puree", "tomatoes")` → no. `hasWord("tomato puree",
"tomato")` → yes: `"tomato puree".endsWith(" tomato")` = no, `"tomato puree".startsWith("tomato ")` = yes. **Result: 1 plant (vegetables). Correct by luck.**

Note: this is a coincidence of string matching. `"passata"` contains no tomato-related
word so gets 0 while `"tomato puree"` gets 1. The inconsistency is a trust risk.

---

## 6. Trust Assessment

### Would a displayed score be trustworthy today?

**No.** The current implementation would produce both inflated and deflated counts:

**Inflated (overcounting):**
- Recipe imports from recipe parsers produce ingredient strings with quantities:
  `"2 cans of chopped tomatoes"`, `"1 tbsp tomato puree"`, `"200g cherry tomatoes"`
  — all three count as separate plants today (different raw strings, all pass the
  tomato → vegetables filter)
- A single recipe with `"spinach"`, `"baby spinach"`, `"frozen spinach"` would count
  as 3 plants. With the alias fix: 1.

**Deflated (undercounting):**
- Chickpeas, lentils, beans, pumpkin seeds, walnuts, flaxseed, kimchi, sauerkraut
  all score 0 currently.
- A household eating a genuinely plant-diverse diet with lots of legumes and seeds
  would see a lower score than a household with the same number of different vegetables.

**Conclusion:** The counter shows the right aspiration but the number is not reliable
enough for users to trust literally. The tooltip currently says:
"This is an approximation based on ingredient names." — that disclaimer is honest but
the problems are systematic enough to produce results that feel wrong.

### What assumptions are safe?

| Assumption | Safe? |
|-----------|-------|
| Ingredients named in recipe lists are present in the meal | Safe |
| Herbs and spices in HERBS_SPICES count as 1 plant regardless of quantity | Safe |
| "Tomatoes" appearing twice in the same week = 1 plant | Safe with fix |
| Olive oil = 1 plant | Generally accepted in plant diversity frameworks |

### What assumptions are risky?

| Assumption | Risk |
|-----------|------|
| Raw ingredient string = canonical ingredient | HIGH — quantities, form words, brand names all affect string |
| Current 5 categories = all plants | HIGH — legumes, seeds, nuts, fermented are missed |
| computeMealVariety total > 0 = plant | MEDIUM — correct for included categories; wrong for missing ones |
| Passata / tomato paste = not a plant | MEDIUM — inconsistent with actual variety counting frameworks |

---

## 7. Smallest Implementation Path

### Prerequisite fix (should precede any Option)

Fix the deduplication key in `WeeklyPlantDiversityCounter`:
```typescript
// Replace (nutrition-variety-chips.tsx:301):
const norm = raw.toLowerCase().trim();

// With:
const norm = normaliseForReuse(raw);  // import from @/lib/ingredient-reuse
```

**Impact:** Eliminates the quantity-prefix and form-word duplication problem.
"400g tinned tomatoes", "cherry tomatoes", "vine tomatoes" → all become `"tomatoes"`.
Single file change, no risk to other functionality.

---

### Option A — Simple Plant Counter

**What:** Fix the dedup key + expand `computeMealVariety` (or add a parallel
`isPlantIngredient()` function) to include legumes, seeds, nuts, and fermented foods.
Display the existing `WeeklyPlantDiversityCounter` as-is (already live).

**Complexity:** Low.

**Files affected:**
- `client/src/lib/nutrition-variety.ts` — add LEGUMES, SEEDS, NUTS, FERMENTED word lists; adjust `computeMealVariety` or add a simpler `isPlantIngredient(ingredient)` function
- `client/src/components/nutrition-variety-chips.tsx` — fix dedup key from `raw.toLowerCase().trim()` to `normaliseForReuse(raw)`
- `shared/ingredient-aliases.ts` — optionally add `passata → tomatoes`, `tomato paste → tomatoes`

**Data required:** No new data. All processing is client-side from existing `meals.ingredients`.

**Risk:** Low. The counter is already rendered in the planner. Changing the count
may cause some users to see lower numbers (dedup fix eliminates overcounting) and
higher numbers (expanding plant categories adds legumes/seeds/nuts). Net effect
should be more accurate.

**Expected user value:** High. The score becomes trustworthy. Households eating
legumes and seeds get credit for their plant diversity.

**Estimated plant word list additions needed:**

| Category | Approximate entries needed |
|----------|--------------------------|
| Legumes | 20 (chickpeas, lentils, beans + variants) |
| Seeds | 15 (pumpkin, chia, flax, sesame, sunflower + variants) |
| Nuts | 15 (walnut, almond, cashew, pecan + variants) |
| Fermented | 8 (sauerkraut, kimchi, miso, tempeh, kefir) |

Most of this data already exists in `server/lib/ingredient-utils.ts` under `nuts` and
`legumes` keys — it needs mirroring to the client-side `nutrition-variety.ts`.

---

### Option B — Plant Counter + Category Progress

**What:** Option A + a visible category breakdown in the WeeklyPlantDiversityCounter:

```
30 Plants This Week          12 / 30

✓ Vegetables   ✓ Fruits   ✓ Herbs & Spices
✓ Legumes      ○ Seeds    ○ Nuts
○ Fermented    ✓ Whole Grains
```

**Complexity:** Medium. Requires extending VarietyScore to include the new categories
(legumes, seeds, nuts, fermented) and updating the rendering component.

**Files affected:**
- `client/src/lib/nutrition-variety.ts` — extend VarietyScore interface; update computeMealVariety
- `client/src/components/nutrition-variety-chips.tsx` — extend WeeklyPlantDiversityCounter with category chips; update NutritionVarietyDots and DayVarietySummary if needed
- `shared/ingredient-aliases.ts` — processed tomato aliases

**Data required:** No new data.

**Risk:** Medium. VarietyScore interface is used by multiple components (NutritionVarietyDots,
DayVarietySummary, MealVarietyNudge). Adding new fields is additive but needs care.

**Expected user value:** High. Users can see which plant categories they're covering
and which are missing. Directly actionable (e.g. "I haven't had any seeds this week").
Aligns with the planned Meal Enhancement category suggestions.

---

### Option C — Full Diversity Tracker

**What:** Option B + weekly trends, historical comparison, per-day breakdown,
plant count per meal.

**Complexity:** High. Requires historical data (not currently retained — see
`PLANNER_HISTORY_RETENTION_INVESTIGATION.md`). Options A and B use only the current
active week. A full tracker needs either Planner Archive (deferred) or a separate
event log.

**Files affected:**
- All Option B files
- Planner history retention (deferred — no architecture for this yet)
- New API endpoints (historical plant count queries)
- New display components (trend charts, weekly comparison)

**Data required:** Historical planner data. Does not exist. See
`PLANNER_HISTORY_RETENTION_INVESTIGATION.md`.

**Risk:** High. Depends on deferred architecture.

**Expected user value:** Highest — but requires months of accumulated data before
the trend signal is meaningful.

**Verdict:** Not appropriate yet. Implement Option A (fix accuracy), then Option B
(add categories), then revisit Option C once Planner Archive is decided.

---

## 8. Appendix: Key File Locations

| File | Role |
|------|------|
| `client/src/components/nutrition-variety-chips.tsx:279–364` | `WeeklyPlantDiversityCounter` — live component |
| `client/src/lib/nutrition-variety.ts` | `computeMealVariety`, word lists, `VarietyScore` interface |
| `shared/normalize.ts` | `normalizeIngredientKey` — layer 1 normalisation |
| `shared/ingredient-aliases.ts` | `resolveIngredientAlias` — ~80 alias mappings |
| `client/src/lib/ingredient-reuse.ts` | `normaliseForReuse` — the most capable normalisation pipeline |
| `server/lib/ingredient-utils.ts:283–295` | Server-side category lists (nuts, legumes, produce) |
| `client/src/pages/weekly-planner-page.tsx:469–478` | `weekIngredients` useMemo — data source for counter |
| `shared/schema.ts:1311` | `ingredientClassifications` table — DB-side, not currently used by counter |

---

## 9. Answers to Investigation Questions

**Can THA already identify all ingredients used across the active planner week?**
Yes. `weekIngredients` useMemo + `mealById` gives full ingredient arrays for all meals
in the active week. The data is already loaded and available.

**Does THA have enough information to count tomatoes appearing on Monday/Tuesday/Thursday as 1 plant?**
Not today. With the `normaliseForReuse` dedup fix: yes.

**Would a displayed score be trustworthy today?**
No. The score would be simultaneously inflated (duplicate ingredient strings) and
deflated (missing legumes, seeds, nuts, fermented). The fix is contained and low-risk.

**What is the smallest path to 30 Plants Per Week being accurate?**
Two-file fix:
1. `nutrition-variety-chips.tsx` — use `normaliseForReuse` for dedup
2. `nutrition-variety.ts` — add LEGUMES, SEEDS, NUTS, FERMENTED word lists to `computeMealVariety`

Both changes are self-contained, client-only, and have no schema or API dependencies.
