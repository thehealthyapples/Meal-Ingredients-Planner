# Ingredient Fetch Before Recommendation — Implementation Summary

**Date:** 2026-06-07
**Commit:** 0644578
**Branch:** main

---

## What Was Changed

External recipe candidates (BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats) previously entered the Smart Planner recommendation pool with `ingredients: []`. Dietary suitability was guessed from the recipe title alone, which was unreliable.

This change makes the Smart Planner fetch each candidate's detail page and extract real ingredients before deciding whether to recommend the meal. If ingredients cannot be obtained, the candidate is excluded.

---

## Rollback Points

| | Tag |
|---|---|
| Before | `rollback/before-ingredient-verification` → `ce755a7` |
| After | `rollback/after-ingredient-verification` → `0644578` |

---

## Pipeline — Before vs After

**Before:**
```
Search result → Recommended
```

**After:**
```
Search result
    ↓
Fetch detail page  (8 s timeout, concurrency 5)
    ↓
Extract ingredients  (JSON-LD schema.org/Recipe → DOM fallback)
    ↓
ingredients.length === 0?  → excluded (not recommended)
    ↓
dietRules.shouldExcludeRecipe()  on real ingredients
    ↓
Recommended
```

---

## Sources

| Source | Ingredients at Search Time | Detail Fetch Required |
|---|---|---|
| TheMealDB | Yes — API returns full ingredient list | No — passthrough |
| BBC Good Food | No — search page returns title only | Yes |
| AllRecipes | No — search page returns title only | Yes |
| Jamie Oliver | No — search page returns title only | Yes |
| Serious Eats | No — search page returns title only | Yes |

---

## Extraction Strategy

1. **JSON-LD first** — looks for `<script type="application/ld+json">` blocks containing a `schema.org/Recipe` node and reads `recipeIngredient[]`. This is the high-confidence path used by all major recipe sites.
2. **DOM fallback** — scans `<li>` elements for measurement-pattern text and `ingredient`-named CSS classes. Lower confidence; catches pages that do not publish structured data.
3. **Failure** — if the page is unreachable, times out, returns a non-200 status, or yields 0 ingredients after both strategies: candidate returns `null` and is excluded from the pool.

---

## Files Changed

| File | Purpose |
|---|---|
| `server/lib/recipe-scraper.ts` | New shared scraper module — `scrapeRecipeFromUrl(url, timeoutMs)` with JSON-LD + DOM fallback. Extracted from auto-import-service to avoid a circular import. |
| `server/lib/auto-import-service.ts` | Now imports `scrapeRecipeFromUrl` from `recipe-scraper` instead of defining it inline. No behaviour change. |
| `server/lib/external-meal-service.ts` | Added `enrichCandidateIngredients(candidate)` and `enrichExternalCandidates(candidates, concurrency)`. |
| `server/lib/smart-suggest-service.ts` | Calls `enrichExternalCandidates()` after `fetchExternalCandidates()`. Adds ingredient-presence gate before the dietary filter. |
| `server/tests/test-ingredient-verification.ts` | 21-test suite — see Tests section below. |
| `package.json` | Added `test:ingredient-verification` script. |

---

## Key Functions

### `enrichCandidateIngredients(candidate)`
`server/lib/external-meal-service.ts`

- If `candidate.ingredients.length > 0` → returns candidate unchanged (TheMealDB passthrough).
- If `candidate.sourceUrl` is null → returns `null` (cannot fetch, excluded).
- Fetches `candidate.sourceUrl` with an 8 s timeout.
- Extracts ingredients via `scrapeRecipeFromUrl`.
- Returns enriched candidate with real `ingredients[]`, or `null` on failure.

### `enrichExternalCandidates(candidates, concurrency = 5)`
`server/lib/external-meal-service.ts`

- Processes all candidates in batches of 5 (parallel within batch, sequential between batches).
- Drops `null` results (failed extractions) from the returned array.
- Logs: `[ExternalSearch] Ingredient enrichment: X/Y candidates retained`.

### `scrapeRecipeFromUrl(url, timeoutMs = 15000)`
`server/lib/recipe-scraper.ts`

- Accepts a configurable timeout (Smart Planner uses 8 s; auto-import uses default 15 s).
- Tries native `fetch` first, falls back to `axios` if the first attempt fails.
- Returns `{ ingredients, instructions, name?, image? }` or `null`.

---

## Ingredient Gate in generateSmartSuggestion

`server/lib/smart-suggest-service.ts`

```typescript
// After enrichment, before dietary filter:
if (ext.ingredients.length === 0) {
  console.debug(`[SmartSuggest] Excluded external meal (no ingredients after detail fetch): "${ext.name}"`);
  continue;
}
// dietRules now operates on real ingredients, not title alone:
if (isDietExcluded(candidate)) { ... continue; }
```

This is a defense-in-depth check. `enrichExternalCandidates` already excludes failed candidates; the gate ensures the dietary filter always runs on verified ingredient data.

---

## Tests

Run: `npm run test:ingredient-verification`

| # | Test |
|---|---|
| 1 | Candidate with ingredients is NOT excluded by the ingredient gate |
| 2 | Vegan: Carbonara (pancetta + eggs + parmesan) excluded by dietRules |
| 2 | Vegan: Seafood Pasta (prawns) excluded by dietRules |
| 2 | Vegan: Ragu Pasta (beef mince) excluded by dietRules |
| 2 | Vegan: Tomato Pasta (no animal products) passes dietRules |
| 3 | Vegetarian: Chicken Tikka Masala excluded by dietRules |
| 3 | Vegetarian: Fish and Chips excluded by dietRules |
| 3 | Vegetarian: Mushroom Risotto passes dietRules |
| 4 | Dairy-Free: Mac and Cheese (cheddar + butter + milk) excluded |
| 4 | Dairy-Free: Creamy Pasta (cream + parmesan) excluded |
| 4 | Dairy-Free: Tomato Soup passes dietRules |
| 5 | BBC Good Food candidate with `ingredients=[]` excluded by ingredient gate |
| 5 | AllRecipes candidate with `ingredients=[]` excluded by ingredient gate |
| 5 | Jamie Oliver candidate with `ingredients=[]` excluded by ingredient gate |
| 5 | Serious Eats candidate with `ingredients=[]` excluded by ingredient gate |
| 5 | Candidate with ingredients NOT excluded by ingredient gate |
| 6 | BBC Good Food candidate with no sourceUrl → `enrichCandidateIngredients` returns null |
| 7 | AllRecipes candidate with no sourceUrl → returns null |
| 8 | Jamie Oliver candidate with no sourceUrl → returns null |
| 9 | Serious Eats candidate with no sourceUrl → returns null |
| — | TheMealDB candidate with existing ingredients passes through enrichment unchanged |

**Result: 21/21 passed**

---

## Build / TypeScript / Test Results

| Check | Result |
|---|---|
| `npm run build` | ✅ Pass |
| `npx tsc --noEmit` | ✅ Pass (0 errors) |
| `npm test` | ✅ Pass (all suites) |
| `npm run test:ingredient-verification` | ✅ 21/21 |

---

## Unknown Ingredient Policy

If `ingredients.length === 0` after enrichment:

- Candidate is **not recommended**.
- Candidate is **not counted as suitable**.
- Candidate is **not displayed** as a Smart Planner recommendation.
- No title-guessing. No dietary assumptions.

---

## Scope Delivered

| Item | Status |
|---|---|
| Ingredient retrieval before recommendation | ✅ Done |
| Ingredient-required recommendation eligibility | ✅ Done |
| BBC Good Food detail fetch | ✅ Done |
| AllRecipes detail fetch | ✅ Done |
| Jamie Oliver detail fetch | ✅ Done |
| Serious Eats detail fetch | ✅ Done |
| TheMealDB passthrough (already has ingredients) | ✅ Done |
| Review pills | Not in scope |
| Adaptable pills | Not in scope |
| Recipe adaptation | Not in scope |
| Planner UI changes | Not in scope |
| Schema changes / migrations | Not in scope |

---

## Remaining Limitations

- **Latency:** Each Smart Plan generation fetches detail pages for ingredient-less candidates (up to 5 parallel, 8 s each). For 30 candidates needing enrichment this adds ~6 rounds of network I/O on top of existing search latency.
- **Site blocking:** Recipe sites may return 403/429 for automated requests. Blocked candidates are excluded (correct by policy — unknown ingredients = not recommended).
- **JavaScript-rendered pages:** The DOM fallback cannot execute JavaScript. Sites that render ingredients client-side will fall back to JSON-LD only; if that is also absent, the candidate is excluded.
- **Manual recipe search:** Not changed. This pipeline applies only to Smart Planner / Smart Suggest system-generated recommendations.
