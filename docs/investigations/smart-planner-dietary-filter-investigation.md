# SMART PLANNER EXTERNAL DIETARY FILTERING INVESTIGATION: COMPLETE

**Rollback identifier:** `investigation/smart-planner-dietary-filter-2026-06-06` → commit `c0ea8d5`

**Date:** 2026-06-06

---

## Executive Summary

Profile dietary requirements are **fully available** at the point of external search but are **never used** to form search queries. Dietary data flows only into post-retrieval scoring and hard-exclusion filtering. All 5 active sources can benefit from dietary keyword prefixing immediately. One inactive source (Edamam) offers genuine API-level dietary guarantees when activated.

**CODE CHANGES MADE: NONE**

---

## Active vs. Inactive Sources

### ACTIVE — called in `fetchExternalCandidates()` (external-meal-service.ts:704–710)

| Source | Type |
|--------|------|
| TheMealDB | Free REST API |
| BBC Good Food | HTML scraper |
| AllRecipes | HTML scraper |
| Jamie Oliver | HTML scraper |
| Serious Eats | HTML scraper |

### INACTIVE — functions exist, not wired into `fetchExternalCandidates()`

| Source | Type | API Key Status |
|--------|------|---------------|
| Edamam | REST API | Not configured |
| API-Ninjas | REST API | **Configured** (`API_NINJAS_API_KEY` is set) |
| BigOven | REST API | Not configured |
| FatSecret | OAuth REST API | Not configured |

---

## Current Query Format

`smart-suggest-service.ts:238–241`:
```ts
const externalCandidates = await fetchExternalCandidates({
  cuisine: settings.preferredCuisine,
  query: settings.preferredCuisine || undefined,
});
```

- If `preferredCuisine` is unset (most users), both parameters are `undefined`
- `buildSearchQueries()` defaults to: `["healthy dinner", "quick lunch", "easy breakfast"]`
- **Zero dietary terms are ever included in any search query**
- `mergedPrefs.dietTypes` is assembled at `routes.ts:4870–4904` but is passed only to `scoreMeal()`, never to `fetchExternalCandidates()`

---

## Is THA Currently Applying Dietary Terms to Queries?

**No.** Confirmed at `smart-suggest-service.ts:238–241`. The merged diet types (`mergedPrefs.dietTypes`) exist and are populated before the external search call, but the call passes only `cuisine` and a cuisine-derived `query`. No diet type, no dietary term, no filter of any kind is applied at retrieval time.

---

## Source-by-Source Analysis

---

### 1. TheMealDB

**Current query format:**
```
https://www.themealdb.com/api/json/v1/1/search.php?s=pasta
```

**Supported dietary filters:**
- Category filter endpoint exists (free tier): `filter.php?c=Vegetarian`
- Free-tier categories include: Vegetarian, Chicken, Beef, Seafood, Pasta, etc. — no confirmed Vegan or Keto category
- Keyword search works: `search.php?s=vegan+pasta`

**Filter mechanism:**
- Query parameter (`s=`) — reliable keyword matching
- Category filter (`c=Vegetarian`) — API filter, but detail calls required (filter endpoint returns ID + thumbnail only, no ingredients)

**Reliability:** MEDIUM
- Search endpoint: returns recipes matching keyword, not guaranteed dietary compliance
- Category filter (Vegetarian): source-declared, more reliable but only "Vegetarian" confirmed

**Ingredient availability:**
- Search response (`search.php`): **FULL** — all `strIngredient1`–`strIngredient20` + `strMeasure1`–`strMeasure20` fields present in the search response (external-meal-service.ts:122–132)
- Category filter response: thumbnail + ID only — detail call required for ingredients

**Verdict:** Best active source for dietary verification. Ingredients are available at search time. Keyword approach (`vegan pasta`) immediately usable without API changes.

---

### 2. BBC Good Food

**Current query format:**
```
https://www.bbcgoodfood.com/search?q=healthy+dinner
```

**Supported dietary filters:**
- URL diet parameter exists: `?diet=vegan`, `?diet=vegetarian` — unreliable when scraped (parameter may be ignored by server without JS rendering)
- Collection URLs exist: `/recipes/collection/vegan-recipes` — viable scraping target
- Keyword approach: `?q=vegan+pasta` — works, results are editorially tagged

**Filter mechanism:**
- Query parameter (keyword prefix) — reliable
- URL diet parameter — unreliable (requires JS execution)

**Reliability:** LOW
- HTML scraper; subject to layout changes
- No guarantee returned recipes are compliant with dietary term — they surface editorially tagged content

**Ingredient availability:**
- Search card: **NONE** — only name + image scraped (`ingredients: []`, external-meal-service.ts:300–303)
- Detail page: available but detail scraping is not implemented

**Verdict:** Keyword prefix approach works. Cannot verify dietary suitability from search alone — ingredients never populated for this source.

---

### 3. AllRecipes

**Current query format:**
```
https://www.allrecipes.com/search?q=healthy+dinner
```

**Supported dietary filters:**
- URL parameter exists: `?diet=vegan` — may work with server-side rendering
- Keyword approach: `?q=vegan+pasta` — widely used and effective

**Filter mechanism:**
- Query parameter (keyword prefix) — most reliable approach for scraping
- URL diet filter — uncertain without JS rendering

**Reliability:** LOW
- HTML scraper; layout changes frequently
- User-submitted recipes may self-label incorrectly

**Ingredient availability:**
- Search: **NONE** — only name + URL extracted (`ingredients: []`, external-meal-service.ts:399–407)
- Detail page: available but not scraped

**Verdict:** Keyword prefix viable. Cannot verify compliance without detail-page scraping.

---

### 4. Jamie Oliver

**Current query format:**
```
https://www.jamieoliver.com/search/?s=healthy+dinner
```

**Supported dietary filters:**
- No reliable URL dietary filter parameter documented for scraping
- Keyword approach: `?s=vegan+pasta` — works, site has dietary tags

**Filter mechanism:**
- Query term only — keyword prefix is the only viable approach

**Reliability:** LOW
- HTML scraper; Jamie Oliver's site is heavily JS-rendered
- Dietary tagging is editorial, not ingredient-verified

**Ingredient availability:**
- Search: **NONE** — only name + URL extracted (`ingredients: []`, external-meal-service.ts:451–459)

**Verdict:** Keyword prefix only. No dietary guarantee possible from this source.

---

### 5. Serious Eats

**Current query format:**
```
https://www.seriouseats.com/search?q=healthy+dinner
```

**Supported dietary filters:**
- No reliable URL dietary filter parameter for scraping
- Keyword approach: `?q=vegan+pasta` — works

**Filter mechanism:**
- Query term only

**Reliability:** LOW
- HTML scraper; editorial tagging
- Serious Eats is a high-quality editorial source — dietary labelling is generally accurate but not verified by ingredient analysis

**Ingredient availability:**
- Search: **NONE** — only name + URL extracted (`ingredients: []`, external-meal-service.ts:503–511)

**Verdict:** Keyword prefix viable. Higher editorial quality than AllRecipes/Jamie Oliver.

---

### 6. Edamam (INACTIVE — not called)

**Current query format:**
```
https://api.edamam.com/api/recipes/v2?type=public&q=pasta&app_id=...&app_key=...
```

**Supported dietary filters — NATIVE API SUPPORT:**
- `&health=vegan` — source guarantees vegan
- `&health=vegetarian` — source guarantees vegetarian
- `&health=keto-friendly` — source guarantees keto
- `&health=paleo` — source guarantees paleo
- `&health=dairy-free` — source guarantees dairy-free
- `&health=gluten-free` — source guarantees gluten-free
- `&health=low-sugar`
- `&diet=low-carb` — diet label filter
- `&diet=high-protein`
- Multiple filters can be combined

**Filter mechanism:** API filter — source-guaranteed

**Reliability:** HIGH
- Source guarantees dietary filtering — Edamam performs ingredient-level analysis before labelling

**Ingredient availability:**
- **FULL** — `ingredientLines` array in every API response (external-meal-service.ts:548)
- Instructions not returned by API (must come from source URL)

**Key issue:** API key not configured (`process.env.EDAMAM_APP_ID` / `EDAMAM_APP_KEY` absent). Function exists but is excluded from `fetchExternalCandidates()`.

**Verdict:** The highest-value addition. Native API filtering with full ingredients. Would require API key setup and wiring into `fetchExternalCandidates()`.

---

### 7. API-Ninjas (INACTIVE — not called, key IS configured)

**Current query format:**
```
https://api.api-ninjas.com/v1/recipe?query=pasta
```

**Supported dietary filters:**
- No dietary filter parameters documented in API
- Keyword approach: `query=vegan+pasta` — works as keyword match

**Filter mechanism:** Keyword in query term only

**Reliability:** LOW
- Keyword match; no dietary analysis performed by source
- Small database — limited recipe variety

**Ingredient availability:**
- **FULL** — `ingredients` field is pipe-separated ingredient string, parsed into array (external-meal-service.ts:575–578)

**Key finding:** `API_NINJAS_API_KEY` is set but `searchApiNinjas()` is NOT wired into `fetchExternalCandidates()`. This is a low-effort activation — the function is complete, the key exists.

**Verdict:** Full ingredients available. Low dietary reliability. Could supplement TheMealDB as a second ingredient-verified source, though database is small.

---

### 8. BigOven (INACTIVE — not called)

**Current query format:**
```
https://api.bigoven.com/recipes?any_kw=pasta&api_key=...
```

**Supported dietary filters:**
- `?diet=vegan` parameter exists in BigOven API
- `?exclude_cat=` / `?include_ing=` / `?exclude_ing=` for ingredient control

**Filter mechanism:** API filter — medium reliability (user-submitted recipes, self-labelled)

**Reliability:** MEDIUM
- Source attempts filtering but relies on user-submitted dietary labels
- Ingredient-level exclusion parameters are available

**Ingredient availability:**
- Search: **NONE** — `ingredients: []` in current implementation (external-meal-service.ts:614–620)
- Detail page: available but not fetched

**Key issue:** API key not configured.

**Verdict:** Medium reliability with API filter. Lower priority — no ingredients at search time despite API filter support.

---

### 9. FatSecret (INACTIVE — not called)

**Current query format:**
```
https://platform.fatsecret.com/rest/server.api?method=recipes.search&search_expression=pasta
```

**Supported dietary filters:**
- No dietary filter parameters in `recipes.search` method
- Some filtering via `recipe_type` parameter (Breakfast, Lunch, etc.) but not dietary

**Filter mechanism:** Keyword only

**Reliability:** LOW
- No dietary filtering
- `recipe_description` blob only — not a structured ingredient list

**Ingredient availability:**
- **NONE** — `ingredients: [item.recipe_description]` (a single description string, external-meal-service.ts:683)

**Key issue:** API keys not configured (OAuth client_credentials required).

**Verdict:** Lowest value for dietary filtering. Recipe descriptions are not actionable for compliance checking.

---

## Dietary Filter Capability Summary

| Source | Status | Dietary Filter Method | Reliability | Ingredients at Search |
|--------|--------|----------------------|-------------|----------------------|
| TheMealDB | ACTIVE | Keyword prefix + category filter | MEDIUM | FULL |
| BBC Good Food | ACTIVE | Keyword prefix only | LOW | NONE |
| AllRecipes | ACTIVE | Keyword prefix only | LOW | NONE |
| Jamie Oliver | ACTIVE | Keyword prefix only | LOW | NONE |
| Serious Eats | ACTIVE | Keyword prefix only | LOW | NONE |
| Edamam | INACTIVE | Native API filter | HIGH | FULL |
| API-Ninjas | INACTIVE (key configured) | Keyword prefix only | LOW | FULL |
| BigOven | INACTIVE | API filter (medium) | MEDIUM | NONE |
| FatSecret | INACTIVE | None | LOW | NONE |

---

## Profile Dietary Compatibility

| Diet (Profile value) | Search Term Safe | Search Term | Notes |
|----------------------|-----------------|-------------|-------|
| Vegan | YES | `vegan` | Universally understood; widely used in recipe titles |
| Vegetarian | YES | `vegetarian` | Universally understood |
| Keto | YES | `keto` | Common recipe tag |
| Paleo | YES | `paleo` | Common recipe tag |
| Mediterranean | YES | `mediterranean` | Works well as cuisine/style term |
| Low-Carb | YES | `low-carb` | Common recipe tag |
| Gluten-Free | YES | `gluten-free` | Very common recipe tag |
| Dairy-Free | YES | `dairy-free` | Common recipe tag |
| Flexitarian | PARTIAL | `flexitarian` | Less common in recipe titles; limited results |
| DASH | PARTIAL | `DASH diet` | Niche term; sparse results |
| MIND | PARTIAL | `MIND diet` | Very niche; extremely sparse results |
| Carnivore | PARTIAL | `carnivore` | Growing but still niche |

---

## Candidate Volume Impact

**Current (no dietary filter):**
- `search("healthy dinner")` → 8–15 generic recipes per source
- Mix of vegan, vegetarian, meat, fish — unfiltered
- Post-scoring penalises non-matching meals but they remain in candidate pool

**With dietary prefix:**
- `search("vegan pasta")` vs `search("pasta")`:
  - Pool shrinks by approximately 30–60% for strict diets
  - Quality improves significantly — fewer penalised candidates
  - Vegan/vegetarian searches: candidate quality HIGH improvement
  - Keto/paleo: candidate quality MEDIUM improvement
  - DASH/MIND: pool may become very sparse (fewer than 5 results per source)

**Risk of over-filtering:** For niche diets (DASH, MIND, Carnivore) the candidate pool could become so small the planner cannot fill 7 days × 3 slots. Fallback to unfiltered search is necessary.

---

## Verification Requirement

**Can search filtering alone be trusted?**

| Source | Verification Status |
|--------|-------------------|
| TheMealDB | Partial — ingredients available; local `detectDietTypes()` can verify but uses pattern-matching not analysis |
| Edamam | YES — source-guaranteed; ingredient list also available for secondary check |
| BBC/AllRecipes/Jamie/SeriousEats | NO — no ingredients at search time; name-keyword matching only |
| API-Ninjas | Partial — ingredients available but database is unvetted user content |

**Conclusion:** Ingredient verification must still occur. Search filtering improves candidate quality but cannot substitute for ingredient-level checking, particularly for:
- Vegan (dairy in "vegan" labelled recipes is a known issue)
- Gluten-free (cross-contamination risk not detectable by name)
- Keto (many "keto" recipes still contain borderline carb counts)

---

## Architecture Options

### OPTION A — Search filtering only (keyword prefix in query)

**What:** Prepend dietary term to `fetchExternalCandidates()` query. `"vegan pasta"` instead of `"pasta"`.

**Change point:** `smart-suggest-service.ts:238–241` — pass `dietaryQuery` derived from `mergedPrefs.dietTypes` into `fetchExternalCandidates()`.

**Pros:**
- Minimal change — 1 parameter addition to one call site
- Works for all 5 active sources immediately
- No new API dependencies
- Immediate improvement for Vegan, Vegetarian, Keto, Paleo, Mediterranean, Low-Carb

**Risks:**
- Scrapers (BBC/AllRecipes/Jamie/Serious Eats) return no ingredients — cannot verify suitability post-fetch
- Self-labelled dietary compliance (any site may mislabel)
- Pool thinning for DASH, MIND, Carnivore — needs fallback logic
- Reduces candidate variety (pool shrinks by 30–60%)

**Risk level:** LOW — purely additive, post-scoring still operates

---

### OPTION B — Search filtering + ingredient verification

**What:** Add dietary keyword prefix AND verify returned candidates against dietary requirements using available ingredient data.

**Change points:**
- `external-meal-service.ts` — pass dietary filters through
- `smart-suggest-service.ts` — verify ingredients of TheMealDB candidates before adding to pool
- No ingredient verification possible for 4 of 5 active scrapers (ingredients=[] for BBC/AllRecipes/Jamie/Serious Eats)

**Pros:**
- TheMealDB candidates are ingredient-verified (full ingredients at search time)
- Higher precision for ingredient-verified candidates
- Hard exclusion resolver already exists and can be reused

**Risks:**
- 4 of 5 active sources produce `ingredients: []` — verification impossible for most candidates
- TheMealDB is the only active source that benefits from ingredient verification
- Asymmetric trust across candidate pool creates hidden priority skew
- Significant benefit only if Edamam or API-Ninjas are also activated

**Risk level:** LOW-MEDIUM — adds complexity but fallback scoring still operates

---

### OPTION C — Search filtering + ingredient verification + verified/unverified classification

**What:** As Option B, but each `ExternalMealCandidate` is tagged `dietaryVerified: true/false`. Scoring gives bonus to verified candidates.

**Change points:**
- `ExternalMealCandidate` interface — add `dietaryVerified?: boolean` field
- `external-meal-service.ts` — set flag per source
- `meal-scoring-service.ts` — incorporate `dietaryVerified` into `dietMatch` scoring
- `smart-suggest-service.ts` — preference verified over unverified when scores are close

**Pros:**
- Transparent trust signal in candidate pool
- TheMealDB and Edamam (if activated) produce verified candidates
- Scrapers produce unverified candidates — still useful but ranked below verified
- Cleanest long-term architecture

**Risks:**
- More interface surface area (`ExternalMealCandidate`, `ScoredCandidate` both need new field)
- Scoring change affects all external candidates, not just dietary-filtered ones
- If verified pool is very small (DASH, MIND), system will select unverified anyway — verification flag provides false confidence signal

**Risk level:** MEDIUM — schema + scoring changes, wider blast radius

---

## Key Questions — Answered

**1. Which sources support genuine dietary filtering?**
Edamam only (inactive; API key not configured). TheMealDB supports "Vegetarian" category filter at API level (free tier); ingredient-level verification is possible from search results.

**2. Which sources only support keyword searching?**
BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats, API-Ninjas, FatSecret. All five active scrapers are keyword-only.

**3. Which sources provide enough data to verify suitability?**
TheMealDB (ingredients at search time), Edamam (full ingredient lines in response), API-Ninjas (full pipe-separated ingredient list). Three sources — only one is currently active.

**4. Could THA query "vegan pasta" instead of "pasta"?**
Yes. Single change at `smart-suggest-service.ts:238–241`. The `filters.query` parameter flows through `buildSearchQueries()` into all 5 active search URLs. No other changes needed.

**5. Would this materially improve Smart Planner quality?**
Yes, for primary diets. For Vegan, Vegetarian, Keto, Paleo, Mediterranean, Low-Carb: meaningful quality improvement. The current system retrieves generic recipes and then penalises most of them in scoring. Dietary query terms pre-filter the retrieval pool, reducing wasted candidates and increasing the probability that top-scored candidates genuinely suit the user's diet.

**6. Which dietary approaches benefit most?**
- HIGH benefit: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Keto
- MEDIUM benefit: Paleo, Mediterranean, Low-Carb
- LOW benefit: DASH, MIND (sparse search results), Flexitarian, Carnivore

**7. What is the smallest safe implementation?**
Add a `dietaryTerms` parameter to `fetchExternalCandidates()`. When Profile has one or more primary verifiable diet types, prepend the most restrictive dietary term to the search query. Implement a fallback: if the dietary-filtered pool returns fewer than 10 candidates, re-run without the dietary term and merge results. Guard list (do not filter): DASH, MIND, Flexitarian, Carnivore.

**8. What is the recommended architecture?**
Option C long-term, Option A as immediate step. Start with Option A (keyword prefix, no schema changes) to validate quality improvement in practice. Then progress to Option C (verified/unverified classification) once Edamam is activated and provides a meaningful verified-candidate pool.

---

## Recommended Architecture Detail

```ts
fetchExternalCandidates({
  cuisine: settings.preferredCuisine,
  query: settings.preferredCuisine || undefined,
  dietaryTerms: deriveSearchTerms(mergedPrefs.dietTypes),   // NEW
})
```

`deriveSearchTerms()` maps Profile diet types to safe search terms:

| Profile Value | Search Term |
|---------------|-------------|
| Vegan | `vegan` |
| Vegetarian | `vegetarian` |
| Keto | `keto` |
| Paleo | `paleo` |
| Mediterranean | `mediterranean` |
| Low-Carb | `low-carb` |
| Gluten-Free | `gluten-free` |
| Dairy-Free | `dairy-free` |
| DASH | *(excluded — too niche)* |
| MIND | *(excluded — too niche)* |
| Flexitarian | *(excluded — too niche)* |
| Carnivore | *(excluded — too niche)* |

Priority rules:
1. If Vegan → prepend "vegan" (most restrictive, subsumes Vegetarian)
2. If Vegetarian (not Vegan) → prepend "vegetarian"
3. If Keto → prepend "keto"
4. Otherwise use first applicable term

Fallback: if candidate pool after dietary search < 10, retry without dietary term.

Activation sequence:
1. Option A (keyword prefix) — immediate, no interface changes
2. Activate API-Ninjas in `fetchExternalCandidates()` — key exists, function complete
3. Activate Edamam when API key configured — highest-value upgrade (native filter + full ingredients)
4. Option C (verified/unverified flag) — add after Edamam is active

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Pool thinning for niche diets (DASH, MIND) | MEDIUM | Guard list — don't add search term for niche diets |
| Dietary keyword produces irrelevant results | LOW | Post-scoring still penalises non-matching; only upside is pre-filtering |
| Scraper layout changes break dietary collection URLs | LOW | Keyword-in-query approach is more resilient than URL parameter approach |
| "Vegan" labelled recipes containing non-vegan ingredients | MEDIUM | Accept for Option A; resolve in Option B/C with ingredient verification |
| Candidate variety reduction | LOW | 30–60% pool reduction still leaves 8–20+ candidates across 5 sources |
| Edamam cost (paid API) | LOW | Edamam recipes v2 API has free tier (1,000 calls/month) |

---

## Summary

Smart Planner currently retrieves all external recipes with no dietary awareness. Profile dietary requirements are computed and available before the external search call but are discarded — they only influence post-retrieval scoring. The smallest safe improvement is a dietary keyword prefix at the `fetchExternalCandidates()` call site, delivering immediate quality gains for Vegan, Vegetarian, Keto, Paleo, Mediterranean and Low-Carb users across all 5 active sources. Edamam (when activated) is the only source offering source-guaranteed dietary compliance and full ingredients — it is the recommended long-term primary source for dietary-filtered retrieval. API-Ninjas is ready to activate now (key configured, function complete) as a second ingredient-available source.
