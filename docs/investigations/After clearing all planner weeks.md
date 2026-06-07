FRESH VEGAN SMART PLAN FILTER FAILURE INVESTIGATION: COMPLETE

---

## Rollback Identifier

Tag: `investigation/fresh-vegan-filter-failure-20260607-075236`
Commit: `af620b9` (feat(planner): single Profile compliance gate for system-generated writes)
Branch: `main`
Git status at investigation start: no staged or modified tracked files (only untracked .md and .ts files). **Working tree is clean.**

---

## Were weeks empty before generation?

Yes. The investigation scope states all planner weeks were cleared before generation. The fresh generation therefore drew entirely from the external candidate pool plus any user meals present in the library — no legacy `planner_entries` were involved.

---

## Runtime Profile Values

| Field | Source | Value (Vegan profile) |
|---|---|---|
| `req.user.dietPattern` | `users` table | `"Vegan"` |
| `req.user.dietRestrictions` | `users` table | `[]` (none set) |
| `settings.dietPattern` | Route line 4826 | `"Vegan"` |
| `settings.dietRestrictions` | Route line 4827 | `[]` |
| `prefs.dietTypes` | `user_preferences` table | `["vegan"]` (synced by bridge at profile save, routes.ts:958–994) |
| `dietaryPrefix` (external search) | `getDietarySearchPrefix(prefs.dietTypes)` | `"vegan"` |

The hard filter (`candidateDietExcluded`) is driven by `req.user.dietPattern = "Vegan"`.
The external search prefix is driven by `prefs.dietTypes = ["vegan"]`.
Both fields are set correctly for a Vegan profile (the bridge sync runs non-fatally on profile save).

---

## Source of Each Bad Meal

All three bad meals are **external candidates** with **no user-authored ingredient data**.

| Meal | Source | isExternal | mealSourceType | Ingredient count | How sourced |
|---|---|---|---|---|---|
| Healthy Ragu Pasta | BBC Good Food (scraper) | `true` | `"external"` | 0 (empty `[]`) | Generic BBC scrape — dietary prefix ignored (see Root Cause 3) |
| Carbonara | BBC Good Food / AllRecipes / Jamie Oliver / Serious Eats (scraper) | `true` | `"external"` | 0 (empty `[]`) | Same as above, or fallback generic search |
| Healthy Seafood Pasta | BBC Good Food / AllRecipes / Jamie Oliver / Serious Eats (scraper) | `true` | `"external"` | 0 (empty `[]`) | Same as above, or fallback generic search |

**All four web scrapers** (BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats) return `ingredients: []`. Only TheMealDB returns full ingredient data from its API.

---

## Filter Result for Each Bad Meal

### candidateDietExcluded called?
**Yes.** It is called for every external candidate at `smart-suggest-service.ts:398–403`.

### planner-compliance called?
**No** — `planner-compliance.ts` gates system-controlled _write_ paths only (template apply, week-template apply, template import, demo seed, smart-apply persistence). The in-memory `generateSmartSuggestion` selection loop is not a write path — it produces a JSON result that the UI then writes selectively. The compliance gate does not intercept it.

### dietRules.shouldExcludeRecipe called?
**Yes**, via `candidateDietExcluded → shouldExcludeRecipe` (`dietRules.ts:161`).

---

## Text Blob Checked by dietRules

`candidateDietExcluded` builds the text blob as:
```
[name, category || "", cuisine || "", ...ingredients].join(" ").toLowerCase()
```

For these three meals (all from scrapers with empty ingredients, category inferred from name):

| Meal | Text blob sent to shouldExcludeRecipe |
|---|---|
| Healthy Ragu Pasta | `"healthy ragu pasta dinner british"` |
| Carbonara | `"carbonara dinner british"` |
| Healthy Seafood Pasta | `"healthy seafood pasta dinner british"` |

(cuisine = "British" for BBC Good Food scraper; category = "dinner" inferred by `inferCategoryFromCuisineAndName`)

---

## Filter Return Value

`shouldExcludeRecipe(text, { dietPattern: "Vegan", dietRestrictions: [] })` for each:

### Vegan path in dietRules.ts (lines 180–187):
```typescript
case "Vegan":
  return (
    containsAny(lower, MEAT_KEYWORDS) ||
    containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
    containsAny(lower, DAIRY_KEYWORDS) ||
    containsAny(lower, ["egg", "eggs", "honey", "gelatin", "gelatine"])
  );
```

`containsAny` uses `\bkeyword\b` word-boundary regex.

| Meal | MEAT_KEYWORDS hit? | FISH_SEAFOOD_KEYWORDS hit? | DAIRY_KEYWORDS hit? | egg/honey/gelatin hit? | **shouldExcludeRecipe** |
|---|---|---|---|---|---|
| `"healthy ragu pasta dinner british"` | **No** — "ragu" is not in the list | No | No | No | **`false` → NOT excluded** |
| `"carbonara dinner british"` | **No** — "carbonara" is not in the list | No | No | No | **`false` → NOT excluded** |
| `"healthy seafood pasta dinner british"` | No | **No** — "seafood" is not in the list | No | No | **`false` → NOT excluded** |

All three pass the filter and enter the candidate pool.

---

## Root Cause

There are four distinct failure modes. All three bad meals pass because of **Root Cause 1**. Root Causes 2–4 amplify the problem.

---

### Root Cause 1 — KEYWORD GAP (primary, sufficient on its own)

**`FISH_SEAFOOD_KEYWORDS` in `dietRules.ts` does not contain the word `"seafood"`.**

The list (lines 42–49) contains specific species: salmon, tuna, cod, prawn, shrimp, lobster, crab, etc. The generic term "seafood" is absent. `\bfish\b` does not match inside the compound word "seafood" (confirmed: word-boundary regex `\bfish\b` returns `false` for "seafood").

**`MEAT_KEYWORDS` in `dietRules.ts` does not contain dish-name aliases `"ragu"` or `"carbonara"`.**

The list (lines 35–40) contains specific meats: chicken, beef, pork, bacon, ham, etc. Dish names that _imply_ meat or animal products but are not themselves ingredient names are absent:
- "ragu" = Italian meat sauce (implies ground beef/pork mince)
- "carbonara" = pasta dish (implies bacon/pancetta + eggs + parmesan)
- "bolognese" = also absent (implies beef mince)

When the text blob is only the recipe title (no ingredients), keyword filtering depends entirely on whether animal ingredient words appear verbatim in the title. They do not for these dishes.

---

### Root Cause 2 — NO INGREDIENT DATA from scraper sources (amplifier)

BBC Good Food, AllRecipes, Jamie Oliver, and Serious Eats all return `ingredients: []` (hard-coded empty arrays). See:
- `external-meal-service.ts:309` (BBC Good Food)
- `external-meal-service.ts:414` (AllRecipes)
- `external-meal-service.ts:467` (Jamie Oliver)
- `external-meal-service.ts:520` (Serious Eats)

Without ingredient data, `candidateDietExcluded` constructs a text blob of only `name + category + cuisine`. No ingredient-level keyword ("bacon", "parmesan", "eggs") is present. The filter becomes entirely dependent on ingredient keywords appearing in the recipe title.

If TheMealDB were the sole source, carbonara would be caught because TheMealDB returns full ingredient data (extractMealDbIngredients at line 216). The four scraper sources have no such protection.

---

### Root Cause 3 — BBC Good Food ignores `dietaryPrefix` (contributing)

`searchBBCGoodFoodEnhanced` (line 249) accepts `dietaryPrefix` in its parameter signature but never uses it in its query construction. Compare:

- **All other scrapers** use `buildSearchQueries(filters)` which prefixes queries with the dietary term (e.g. "vegan healthy dinner"). `buildSearchQueries:346`.
- **BBC Good Food** builds its own query list and iterates without ever reading `filters.dietaryPrefix`. Its queries are always `["healthy dinner", "quick lunch", "easy breakfast"]` regardless of dietary profile.

BBC Good Food therefore always runs a fully generic search. For a Vegan profile it will return whatever BBC ranks for "healthy dinner" — which can include ragu pasta, carbonara, etc.

---

### Root Cause 4 — Generic fallback search reintroduces non-vegan candidates (amplifier)

`fetchExternalCandidates` (line 737) triggers a second full generic search (no dietary prefix) when the dietary-prefixed round returns fewer than 10 candidates:

```typescript
if (filters.dietaryPrefix && combined.length < 10) {
  const genericFilters = { ...filters, dietaryPrefix: undefined };
  // runs all 5 scrapers again with no dietary context
}
```

Because BBC Good Food already effectively runs generically (Root Cause 3), the first round often returns fewer than 10 candidates that pass the filter. The fallback then adds unrestricted results from all sources. These go through `candidateDietExcluded` — but the same keyword-gap problem means dish-named meals pass through.

---

## Unknown Ingredient Handling

When `ingredients` is `[]` (empty):

1. **Is the candidate allowed anyway?** Yes. There is no guard that rejects candidates with empty ingredient lists. The filter runs on whatever text is available.
2. **Is title/category checked?** Yes — `candidate.name`, `candidate.category`, and `candidate.cuisine` are always included in the text blob.
3. **Is source keyword checked?** No. There is no special handling for dish-name keywords like "carbonara", "ragu", or "seafood" in the title.
4. **Is unknown ingredient data treated as safe?** Effectively yes. Empty ingredients mean the text blob is minimal, and unless non-vegan words appear in the title, the candidate is allowed through.

---

## Key Questions — Answered

**1. Why did carbonara appear for a Vegan profile?**
"Carbonara" is not in MEAT_KEYWORDS, DAIRY_KEYWORDS, or the egg/gelatin list. With empty ingredients from the scraper source, the text blob is only "carbonara" (plus category/cuisine). No keyword matches → filter returns false → candidate enters the pool.

**2. Why did seafood pasta appear for a Vegan profile?**
"Seafood" is not in FISH_SEAFOOD_KEYWORDS. That list contains specific species names only. `\bfish\b` does not match "seafood" (word boundary prevents substring hits). Empty ingredients means no prawn/shrimp/lobster keyword appears either.

**3. Why did ragu pasta appear for a Vegan profile?**
"Ragu" is not in MEAT_KEYWORDS. Dish-name aliases for meat-based preparations are absent from the keyword list.

**4. Are these coming from external no-ingredient recipes?**
Yes, confirmed. All three are from scraper sources (BBC Good Food / AllRecipes / Jamie Oliver / Serious Eats) which return `ingredients: []`.

**5. Is the dietary hard filter only applied to internal meals?**
No — `candidateDietExcluded` is applied to BOTH internal user meals (line 370) and external candidates (line 399). The filter fires in both paths. The problem is the filter's keyword coverage, not its application scope.

**6. Is fallback search reintroducing generic non-vegan meals?**
Yes. The `combined.length < 10` fallback (line 737) re-runs all five scrapers with no dietary prefix. These results then enter the same keyword filter, but the same gaps allow dish-named non-vegan meals through.

**7. Is name-based exclusion insufficient?**
Yes — for dishes where the non-vegan character is encoded in a dish name rather than ingredient keywords. "Carbonara", "ragu", "seafood" are the three confirmed gaps. "Bolognese" would also pass for the same reason.

**8. What exact gate failed?**
`shouldExcludeRecipe` in `dietRules.ts` — specifically the `containsAny` checks for `FISH_SEAFOOD_KEYWORDS` and `MEAT_KEYWORDS` under the `"Vegan"` case. The keyword lists lack: "seafood", "ragu", "carbonara".

**9. What is the smallest safe fix?**
Three targeted keyword additions to `dietRules.ts`:

- Add `"seafood"` to `FISH_SEAFOOD_KEYWORDS` (line 43–49 area).
- Add dish-name aliases to `MEAT_KEYWORDS` or create a separate `DISH_NAME_MEAT_IMPLIES` set checked under the Vegan/Vegetarian cases: `"ragu"`, `"carbonara"`, `"bolognese"`, `"birria"`, `"ossobuco"`.
- Fix `searchBBCGoodFoodEnhanced` to apply `dietaryPrefix` to its query strings (same pattern as `buildSearchQueries`).

Optionally — reduce the `< 10` fallback threshold or require fallback results to pass a stricter title-only rejection list before entering the pool.

---

## Risk Rating

🔴 **RED** for user impact — a Vegan profile receives non-vegan meal recommendations from fresh Smart Plan generation. The filter is active and fires, but its keyword coverage has named gaps.

🟢 **GREEN** for data safety — no data corruption; these are in-memory recommendations, not persisted entries. No schema or migration risk. Fix scope is contained to `dietRules.ts` keyword lists and one search function.

---

## Code Changes Made

**NONE.**

---

## Data Impact Declaration

- Reads existing data: Yes (code inspection only, no DB reads performed during investigation)
- Writes data: No
- Changes meaning of existing data: No
- Requires backfill: No
