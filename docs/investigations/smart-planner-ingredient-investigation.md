SMART PLAN PREVIEW INGREDIENT DATA INVESTIGATION: COMPLETE

---

## Rollback Identifier

`rollback/before-ingredient-investigation` — tag on commit `c0ea8d5`

---

## CODE CHANGES MADE: NONE

---

## Summary

The root cause is in the **server-side external candidate collection**. Web-scraped sources (BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats, BigOven) collect only listing-level data — name, image, URL — without visiting individual recipe pages. They hardcode `ingredients: []`. TheMealDB is the exception because its search API returns full recipe objects (including all 20 ingredient slots) in a single response with no extra fetch required.

The preview mapping and client code are not at fault. They faithfully pass whatever the server sends. When a candidate arrives with `ingredients: []`, the preview card correctly renders nothing.

---

## Source Comparison

| Source | Has ingredients? | How fetched |
|---|---|---|
| TheMealDB | ✅ Yes — always | `/api/json/v1/1/search.php?s=<term>` returns complete meal objects with `strIngredient1–20` fields; parsed by `extractMealDbIngredients` |
| BBC Good Food | ❌ No — always empty | Scrapes search results listing page (`/search?q=`) only; individual recipe pages never visited; `ingredients: []` hardcoded |
| AllRecipes | ❌ No — always empty | Scrapes search results listing; individual pages never visited; `ingredients: []` hardcoded |
| Jamie Oliver | ❌ No — always empty | Same pattern; `ingredients: []` hardcoded |
| Serious Eats | ❌ No — always empty | Same pattern; `ingredients: []` hardcoded |
| BigOven | ❌ No — always empty | Search API returns only title/image; `ingredients: []` hardcoded |
| Edamam | ✅ Yes | API returns `ingredientLines[]` in search response |
| API-Ninjas | ✅ Yes (if available) | API returns `ingredients` string, split on `\|` |
| FatSecret | ⚠️ Partial | Returns `recipe_description` as a single string, not a structured list |
| My Meals (internal) | ✅ Yes (if stored) | Full DB `Meal` record — `meal.ingredients` from the database |
| Cookbook (internal) | ✅ Yes (if stored) | Same as My Meals |

---

## Moroccan Carrot Soup — Data Path

**Source:** TheMealDB (external, `isExternal: true`)

**Server — candidate collection:**
1. `fetchExternalCandidates` calls `searchMealDB({ query: "soup" })`
2. Fetches `https://www.themealdb.com/api/json/v1/1/search.php?s=soup`
3. API returns complete meal objects; `extractMealDbIngredients` parses `strIngredient1`–`strIngredient20` and `strMeasure1`–`strMeasure20`
4. `convertExternalToCandidate` sets `ingredients: ["2 tbsp olive oil", "1 onion", ...]`
5. Response includes `candidate.ingredients = [full list]`

**Client — preview mapping:**
1. `entry.candidate.isExternal === true` → `meal = undefined`
2. `previewItem` built as `{ kind: "web", recipe: { ingredients: entry.candidate.ingredients } }`
3. `PreviewCardContent` receives `ingredients.length > 0` → renders full ingredient list ✓

---

## Ultimate Spaghetti Carbonara Recipe — Data Path

**Source:** BBC Good Food (external, `isExternal: true`)

**Server — candidate collection:**
1. `fetchExternalCandidates` calls `searchBBCGoodFoodEnhanced({ query: "pasta" })`
2. Fetches `https://www.bbcgoodfood.com/search?q=pasta`
3. Parses `article.card` elements from search results listing page — name, image URL, recipe URL only
4. `ingredients: []` explicitly hardcoded at `external-meal-service.ts:303` — individual recipe page **never visited**
5. `convertExternalToCandidate` sets `ingredients: []`
6. Response includes `candidate.ingredients = []`

**Client — preview mapping:**
1. `entry.candidate.isExternal === true` → `meal = undefined`
2. `previewItem` built as `{ kind: "web", recipe: { ingredients: [] } }`
3. `PreviewCardContent` receives `ingredients.length === 0` → renders nothing
4. Preview card shows title, image, source badge — but no ingredient section

**Exact code location:** `server/lib/external-meal-service.ts` line 299–313

```ts
results.push({
  externalId: `bbcgf-${slug}`,
  name,
  image: imageUrl || null,
  ingredients: [],        // ← hardcoded empty — no recipe page fetch
  instructions: [],
  dietTypes: detectDietTypes(name, []),
  ...
});
```

---

## Pasta Puttanesca (Tart's Spaghetti) — Data Path

**Source:** My Meals / Cookbook (internal, `isExternal: false`)

**Server — candidate collection:**
1. `storage.getMeals(userId)` returns full DB `Meal` records
2. `convertMealToCandidate(meal, nutrition)` sets `ingredients: meal.ingredients` (DB value), `isExternal: false`, `id: meal.id` (number)
3. Response includes `candidate.isExternal = false`, `candidate.id = <meal_id>`, `candidate.ingredients = meal.ingredients`

**Client — preview mapping:**
1. `internalMealId = !entry.candidate.isExternal ? Number(entry.candidate.id) : null` → non-null
2. `meal = mealById.get(internalMealId)` — full `Meal` object from the client-side meals cache (loaded from `/api/meals`)
3. `previewItem = { kind: "meal", meal }` — uses the full `Meal` object, not the candidate
4. `PreviewCardContent` uses `item.meal.ingredients` directly from the DB record

**Result:** If the user stored this meal with ingredients in the DB, the preview shows all of them. If the meal was imported or created without ingredients (empty `ingredients: []` in DB), the preview shows nothing — but this is a data quality issue, not a code bug.

---

## Where Ingredients Are Lost / Missing

There is no point in the code where ingredients are stripped or lost after collection. The problem is entirely **upstream** — data that was never collected cannot appear in the preview.

```
BBC GF search page      ←  only listing data scraped here
        ↓
ExternalMealCandidate { ingredients: [] }
        ↓
SmartCandidate          { ingredients: [] }
        ↓
SmartSuggestEntry       { candidate: { ingredients: [] } }
        ↓
JSON API response       { candidate: { ingredients: [] } }
        ↓
SmartMealEntryCard      previewItem.recipe.ingredients = []
        ↓
PreviewCardContent      ingredients.length === 0  →  renders nothing
```

The pipeline is correct at every step. It cannot invent data that was never fetched.

---

## Root Cause

**BBC Good Food (and AllRecipes, Jamie Oliver, Serious Eats, BigOven) only scrape search result listing pages. Ingredient lists require visiting each individual recipe page, which is not done.**

TheMealDB works because its search API happens to return complete recipe objects — ingredients included — in the initial search response. No second request is needed.

Internal meals work because they read directly from the database, which stores the full ingredient list when a meal is created or imported with that data.

---

## Smallest Safe Fix Options

### Option A — Surface the gap in the preview UI
**Risk: 🟢 Green**

When `ingredients.length === 0` for an external meal, show a message instead of a silent empty section:

> "Ingredient list not available for this source — [view full recipe ↗]"

- No data changes
- No server changes
- Only `PreviewCardContent` or `SmartMealEntryCard` needs a conditional render
- The `sourceUrl` is already available to link out
- Users can verify dietary suitability by following the link

### Option B — Lazy-fetch recipe detail when preview opens
**Risk: 🟡 Amber**

Add a server endpoint (`GET /api/external-recipe?url=<sourceUrl>`) that:
1. Fetches the individual recipe page
2. Parses structured data (JSON-LD `@type: Recipe` → `recipeIngredient[]`)
3. Returns the ingredient list

The preview card makes this request when `ingredients.length === 0` and `sourceUrl` is available, showing a loading state then the result.

- Adds network latency to preview opening (~1–3 seconds)
- Risk: some sites block scraping or change their HTML structure
- BBC Good Food recipes DO embed JSON-LD, making this reliable for that source
- Requires caching to avoid repeated fetches

### Option C — Deep-fetch recipe pages during candidate generation
**Risk: 🔴 Red**

For each scrape result, immediately follow the URL and parse the recipe detail page before adding to the candidate pool.

- Multiplies candidate generation time by N recipe fetches (10–30 seconds or more)
- High risk of timeouts hitting the Smart Plan generation route
- Rate limiting / bot detection on BBC GF is already a concern for the listing scrape
- Would break user-facing generation latency

### Option D — Filter out no-ingredient external candidates
**Risk: 🟢 Green, but poor UX**

Exclude external candidates where `ingredients.length === 0` from the pool.

- Easy to implement (one filter line)
- Severely limits the candidate pool — effectively removes all BBC GF, AllRecipes, Jamie Oliver, Serious Eats, BigOven suggestions
- TheMealDB and internal meals still work
- Not recommended unless candidate quality consistently degrades without this

---

## Recommendation

**Implement Option A immediately.** It is a trust and transparency fix that costs nothing in data or performance. Users who see an empty ingredient section may incorrectly assume the meal is ingredient-free. A visible "not available" message with a link to the source gives them a clear path to verify suitability.

**Evaluate Option B as a follow-on enhancement.** BBC Good Food reliably embeds JSON-LD structured data on individual recipe pages, making it a good candidate for lazy ingredient fetching. A small cache (in-memory or Redis) would prevent repeated fetches within a session.

Option C is too risky for production. Option D is a last resort if candidate quality becomes a complaint.

---

## Files Relevant to a Future Fix

| File | Role |
|---|---|
| `server/lib/external-meal-service.ts` | Where `ingredients: []` is hardcoded for scraped sources; where a lazy-fetch endpoint would live |
| `client/src/components/MealPreviewBubble.tsx` | `PreviewCardContent` — where Option A's "not available" message would render |
| `client/src/components/SmartReviewPanelContent.tsx` | Where `previewItem` is built; where a lazy-fetch trigger would initiate |
| `server/routes.ts` | Where a new `GET /api/external-recipe` endpoint would be registered |
