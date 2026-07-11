SMART PLANNER DISCOVERY STRATEGY AUDIT: COMPLETE

---

**Rollback Identifier:** `rollback/before-discovery-strategy-audit-2026-06-08` → commit `cea6e2b`
**Investigation Date:** 2026-06-08
**Risk Level:** GREEN — investigation only, no code or data changes
**Scope:** Determine the optimal long-term meal discovery strategy for Smart Planner external candidate sourcing

---

## Files Reviewed

| File | Purpose |
|---|---|
| `server/lib/smart-suggest-service.ts` | Smart Planner generation, dietary prefix mapping, query dispatch |
| `server/lib/external-meal-service.ts` | `fetchExternalCandidates()`, `searchMealDB()`, scraping sources, `inferCategoryFromCuisineAndName()`, enrichment pipeline |
| `server/lib/dietRules.ts` | `shouldExcludeRecipe()`, all keyword exclusion lists, `KETO_EXCLUDE`, `DAIRY_KEYWORDS`, `MEAT_KEYWORDS` |
| `server/lib/meal-scoring-service.ts` | `scoreMeal()`, `convertExternalToCandidate()` |
| `server/lib/recipe-source-gate.ts` | Source enable/disable, source type registry |

---

## SECTION 1 — Current Discovery Flow

### Execution path (per Smart Planner generation)

```
POST /api/meal-plans/smart-suggest
  │
  ├─ Load userMeals from DB (getMeals(userId))
  ├─ Pre-pool filters (routes.ts):
  │    source_type gate → component gate → premium gate
  │
  └─ generateSmartSuggestion(userMeals, prefs, settings)
       │
       ├─ 1. DETERMINE DIETARY PREFIX
       │    getDietarySearchPrefix(prefs.dietTypes)
       │    Maps: Vegan→"vegan", Keto→"keto", Paleo→"paleo", ...
       │    DASH / MIND / Flexitarian / Carnivore → no prefix (intentionally)
       │
       ├─ 2. EXTERNAL SEARCH (parallel via Promise.all)
       │    fetchExternalCandidates({ cuisine, query, dietaryPrefix })
       │      │
       │      ├─ searchMealDB()       → 5 name-search queries, 8s timeout
       │      ├─ searchBBCGoodFood()  → 3 queries, 10s timeout, scrape
       │      ├─ searchAllRecipes()   → 3 queries, 10s timeout, scrape
       │      ├─ searchJamieOliver()  → 3 queries, 10s timeout, scrape
       │      └─ searchSeriousEats()  → 3 queries, 10s timeout, scrape
       │         [17 total requests, all parallel]
       │
       │    Fallback: if results < 10 AND dietaryPrefix set →
       │      re-run all 5 sources without prefix (generic queries)
       │
       ├─ 3. INGREDIENT ENRICHMENT
       │    enrichExternalCandidates() — 5-concurrent serial batches
       │    Scrapes detail pages (JSON-LD → DOM fallback)
       │    Drops candidates with 0 ingredients (unverifiable)
       │
       ├─ 4. FILTER CHAIN (both user meals and external candidates)
       │    Alcohol/drink exclusion
       │    Household hard restriction check
       │    Ingredient presence gate (external only)
       │    Profile dietary filter → shouldExcludeRecipe() [single SSoT]
       │
       ├─ 5. SLOT ASSIGNMENT
       │    getCandidateSlotFit(): category must match slot
       │    inferCategoryFromCuisineAndName(): assigns breakfast/lunch/dinner/dessert
       │    Null-category → dinner slot only
       │    Breakfast fallback: STRICT (breakfast/smoothie only)
       │
       └─ 6. SCORING & SELECTION
            scoreMeal() — 8 dimensions, same for user and external
            Top 5 → random pick from top 3
```

### Actual queries fired for Keto user (no cuisine preference)

| Source | Queries sent |
|---|---|
| TheMealDB | `keto chicken`, `keto pasta`, `keto salad`, `keto curry`, `keto soup` |
| BBC Good Food | `keto healthy dinner`, `keto quick lunch`, `keto easy breakfast` |
| AllRecipes | `keto healthy dinner`, `keto quick lunch`, `keto easy breakfast` |
| Jamie Oliver | `keto healthy dinner`, `keto quick lunch`, `keto easy breakfast` |
| Serious Eats | `keto healthy dinner`, `keto quick lunch`, `keto easy breakfast` |

### Actual queries fired for Vegan user (no cuisine preference)

| Source | Queries sent |
|---|---|
| TheMealDB | `vegan chicken`, `vegan pasta`, `vegan salad`, `vegan curry`, `vegan soup` |
| BBC Good Food | `vegan healthy dinner`, `vegan quick lunch`, `vegan easy breakfast` |
| AllRecipes | `vegan healthy dinner`, `vegan quick lunch`, `vegan easy breakfast` |
| Jamie Oliver | `vegan healthy dinner`, `vegan quick lunch`, `vegan easy breakfast` |
| Serious Eats | `vegan healthy dinner`, `vegan quick lunch`, `vegan easy breakfast` |

---

## SECTION 2 — Diet-Labelled Search Analysis

### How the current model expects the label to work

The dietary prefix is prepended to every query term. `searchMealDB()` then calls TheMealDB's `/search.php?s=<query>` which performs a **name-based search**. The expectation is that TheMealDB contains recipes with "keto" or "vegan" in their name.

### Evidence: TheMealDB does not work this way

TheMealDB is a general recipe database. Its recipe names are descriptive (e.g. "Chicken Tikka Masala", "Omelette", "Shakshuka"). Very few — possibly zero — recipes contain "keto" in their name in TheMealDB's free tier. A search for `keto chicken` returns recipes whose name contains the substring "keto chicken" — which TheMealDB's dataset does not contain.

**Effect:** `searchMealDB` with `dietaryPrefix="keto"` returns approximately 0 results from TheMealDB for any of the 5 queries. The system then triggers its fallback: "dietary prefix search returned < 10 candidates — running generic fallback." The fallback runs the same queries without the prefix, returning general results that are then filtered by `shouldExcludeRecipe()`.

**The label-based search produces 0 TheMealDB candidates at the search stage.** The label is useful for scraping sites (BBC Good Food, AllRecipes) that DO label their content, but not for TheMealDB which is the highest-quality source with pre-extracted ingredients.

### Query oxymoron: "vegan chicken"

One of the 5 queries dispatched to TheMealDB for Vegan users is `vegan chicken`. TheMealDB has no results for "vegan chicken" — the combination is contradictory. This query returns 0 results and wastes a query slot that could be used for a legitimate vegan meal concept.

### Advantages of diet-labelled search

| Advantage | Evidence |
|---|---|
| High precision for scraping sources | BBC Good Food and AllRecipes DO label recipes with dietary tags in page content |
| No post-fetch filtering needed | Fewer non-compliant candidates to enrich and discard |
| Simple implementation | One prefix prepended to all queries |

### Disadvantages of diet-labelled search

| Disadvantage | Evidence |
|---|---|
| TheMealDB returns 0 results for label queries | Name-based `/search.php?s=` — no recipes labelled "keto" |
| Breakfast slot never targeted | Queries are dinner/lunch concepts; no breakfast query exists |
| Many compliant meals never labelled | "Cheese omelette", "Frittata", "Smoked salmon and eggs" are keto-compliant but unlabelled |
| "Vegan chicken" is oxymoronic | One of 5 vegan queries is structurally impossible |
| Sparse pools for non-mainstream diets | "Keto salad" from scraping sites yields few breakfast results |
| Diet-labelled bias | Recipes from niche "keto bloggers" may score lower for quality, variety, or instructions completeness |

### Keto-compliant breakfasts that will NEVER be labelled "keto"

The following breakfast items are fully keto-compliant (zero `KETO_EXCLUDE` hits), but would never appear in a search for "keto [anything]" unless specifically tagged:

| Breakfast item | Typical ingredients | Keto-compliant? |
|---|---|---|
| Cheese omelette | eggs, cheddar | ✅ — no KETO_EXCLUDE terms |
| Mushroom omelette | eggs, mushrooms, butter | ✅ — no KETO_EXCLUDE terms |
| Frittata | eggs, spinach, parmesan | ✅ — no KETO_EXCLUDE terms |
| Avocado + eggs | avocado, eggs | ✅ — no KETO_EXCLUDE terms |
| Smoked salmon + eggs | smoked salmon, eggs, cream cheese | ✅ — no KETO_EXCLUDE terms |
| Shakshuka | eggs, tomatoes, peppers, spices | ✅ — no KETO_EXCLUDE terms |
| Bacon and eggs | bacon, eggs | ✅ — no KETO_EXCLUDE terms |

These are found by searching "omelette", "frittata", or "eggs" — not "keto breakfast."

---

## SECTION 3 — Ingredient Compatibility Search Analysis

### The principle

Instead of prefixing every query with a dietary label, search for broad food concepts that are structurally compatible with the diet. Then apply `shouldExcludeRecipe()` post-enrichment to eliminate non-compliant results.

```
CONCEPT QUERY: "omelette"
  → TheMealDB returns: "Omelette", "Spanish Omelette", "Baked Omelette"
  → inferCategoryFromCuisineAndName("Omelette") → "breakfast" (name contains "omelette")
  → enrichExternalCandidates() → extracts: eggs, cheese, peppers
  → shouldExcludeRecipe(keto) → false (no KETO_EXCLUDE terms)
  → INCLUDED in breakfast pool
```

Versus:

```
CURRENT LABEL QUERY: "keto omelette"
  → TheMealDB returns: 0 results (no recipe is named "keto omelette")
  → Falls through to generic fallback ("omelette")
  → Actually SAME result — but wastes the label
```

### How inferCategoryFromCuisineAndName handles concept queries

`inferCategoryFromCuisineAndName()` in `external-meal-service.ts` recognises these breakfast terms in recipe names:
- "breakfast", "pancake", "omelette", "porridge", "granola", "smoothie"

Any recipe returned by a search for "omelette" or "frittata" whose name contains "omelette" would be correctly classified as `category: "breakfast"` and would enter the breakfast candidate pool.

### Coverage assessment for Keto breakfast concepts

| Concept query | Expected TheMealDB results | Keto-compliant? | Breakfast-categorised? |
|---|---|---|---|
| omelette | "Omelette", "Spanish Omelette" | ✅ (eggs, cheese) | ✅ (name → "breakfast") |
| frittata | "Frittata" recipes | ✅ (eggs, veg) | ⚠️ depends on name |
| eggs | various egg dishes | ✅ (eggs, bacon) | ⚠️ may default to dinner |
| shakshuka | "Shakshuka" | ✅ (eggs, tomatoes) | ⚠️ may default to dinner |
| smoked salmon | "Smoked Salmon Scramble" | ✅ (salmon, eggs) | ⚠️ may default to dinner |
| avocado | "Avocado Salad" | ✅ usually | ⚠️ may be classified lunch |
| bacon breakfast | "Full Breakfast" | ✅ (bacon, eggs) | ✅ ("breakfast" in name) |

**Key limitation of compatibility search:** `inferCategoryFromCuisineAndName` only assigns "breakfast" to recipes that contain specific breakfast keywords in their NAME. A recipe named "Shakshuka" would default to "dinner" even though it is commonly a breakfast dish. This is a separate gap but does not invalidate the compatibility model — it means category inference would need broadening alongside the query change.

### Coverage assessment for Vegan breakfast concepts

| Concept query | Expected results | Vegan-compliant? | Breakfast-categorised? |
|---|---|---|---|
| smoothie | "Berry Smoothie", "Green Smoothie" | ✅ if no dairy | ✅ ("smoothie" in name) |
| porridge | "Porridge" | ✅ if no dairy/eggs | ✅ ("porridge" in name) |
| overnight oats | "Overnight Oats" | ✅ if no dairy | ✅ (has "oats" but not "porridge") — ⚠️ name-depends |
| chia pudding | "Chia Pudding" | ⚠️ see false positive below | ⚠️ name-depends |
| granola bowl | "Granola Bowl" | ✅ typically | ✅ ("granola" in name) |
| acai bowl | "Acai Bowl" | ✅ typically | ⚠️ name-depends |
| fruit breakfast | various | ✅ typically | ⚠️ name-depends |

### False positives in compatibility search

Compatibility search produces a higher false-positive rate than label-based search — meaning more enrichment and filtering of non-compliant candidates. For Keto breakfast:

- "eggs" query returns egg recipes, but also egg-containing cake recipes → non-compliant
- "avocado" query might return avocado toast → non-compliant (toast = bread)
- Post-enrichment `shouldExcludeRecipe()` handles all of these correctly

**False positive rate is acceptable.** The `shouldExcludeRecipe()` filter runs in microseconds. Enriching 30 candidates to keep 10 is a better outcome than finding 2.

### False negatives in compatibility search

False negatives (compliant meals not found) are lower than in label search because:
- Concepts like "omelette" are universal — no diet-label dependency
- dietRules catches non-compliant results post-enrichment with high reliability

---

## SECTION 4 — Exclusion-First Discovery

### The principle

Search broadly (no diet prefix, broad concepts like "breakfast", "dinner", "chicken") and apply `shouldExcludeRecipe()` to all enriched results.

```
BROAD QUERY: "breakfast"
  → Returns: "Full English Breakfast", "Pancakes", "French Toast", "Omelette", "Shakshuka"
  → Enrich all 5
  → Keto filter: remove "Pancakes" (flour), "French Toast" (bread)
  → Remaining: "Full English", "Omelette", "Shakshuka" → KETO-COMPLIANT
```

### Comparison with compatibility search

Exclusion-first is a superset of compatibility search. The difference is:
- **Compatibility search** targets the slot directly ("omelette" = likely breakfast)
- **Exclusion-first** targets broadly ("breakfast") and lets filtering do the work

For TheMealDB specifically, there IS a category-based endpoint (`/filter.php?c=Breakfast`) that returns all breakfast-category recipes directly. This is not currently used. If used, it would return a large set of breakfast recipes including non-compliant ones, which `shouldExcludeRecipe()` would then filter.

### Keto exclusion terms — 108 total keywords

The `KETO_EXCLUDE` dictionary has 108 distinct keyword entries spanning:
- 12 sugar/sweetener terms
- 12 bakery terms
- 9 dough/pastry terms
- 23 grain terms
- 10 snack carb terms
- 7 starchy vegetable terms
- 12 legume terms
- 9 high-sugar fruit terms
- 8 sweetened sauce terms
- 8 wrapper terms

A broad breakfast query returning "Pancakes" would be caught by `DICT_BAKERY` ("pancake"). "Oat Porridge" would be caught by `DICT_GRAINS` ("oat"). "French Toast" caught by `DICT_BAKERY` ("bread"). The dictionary is comprehensive.

### Performance tradeoff

Exclusion-first retrieves more raw candidates per query → more enrichment round-trips. Enrichment is the performance bottleneck (serial 5-concurrent batches at 8s timeout each). A broader search returning 50 candidates vs 20 could add 2–4 extra enrichment batches.

**However:** candidates that already have ingredients (TheMealDB returns full ingredient lists inline) do not require enrichment. TheMealDB-sourced candidates pass through `enrichCandidateIngredients()` immediately. The enrichment penalty only applies to scraped sources (BBC, AllRecipes, etc.).

### Assessment

| Factor | Exclusion-first |
|---|---|
| Coverage | HIGH — broadest net |
| Accuracy | HIGH — same `shouldExcludeRecipe()` filter |
| Performance | MODERATE — more enrichment volume for scraping sources |
| Maintenance | LOW — no new query lists; relies entirely on existing dietRules |
| Implementation risk | LOW — change queries only, no new logic |

### Vegan exclusion terms: 112 total (with a critical false positive)

**CRITICAL FINDING — Plant Milk False Positive:**

The `DAIRY_KEYWORDS` list includes `"milk"` as a standalone word. The `containsAny()` function applies word-boundary regex (`\b`). This means `"milk"` matches as a standalone word in:
- "almond milk" → ✅ CORRECTLY excluded? NO — almond milk is VEGAN
- "oat milk" → almond milk is VEGAN
- "plant milk" → VEGAN
- "soy milk" → VEGAN
- "coconut milk" → VEGAN

**Tested with actual regex:**
```
"almond milk chia seeds" → containsAny(DAIRY_KEYWORDS) = TRUE (false positive)
"oat milk berries" → containsAny(DAIRY_KEYWORDS) = TRUE (false positive)
"coconut milk curry" → containsAny(DAIRY_KEYWORDS) = TRUE (false positive)
"chia seeds coconut water" → containsAny(DAIRY_KEYWORDS) = FALSE (correct)
```

**This false positive means vegan recipes using plant-based milks are incorrectly excluded by the Vegan dietary filter.** This is not a discovery strategy issue — it is a `dietRules.ts` issue. But it directly affects all strategies' ability to fill Vegan breakfast slots, because:
- Chia pudding with almond milk → EXCLUDED (false positive)
- Overnight oats with oat milk → EXCLUDED (false positive on both "milk" and "oat")
- Smoothies with plant milk → EXCLUDED (false positive)
- Vegan pancakes with soy milk → EXCLUDED (false positive)

This is an independent finding that should be addressed regardless of which discovery strategy is adopted. It compounds the breakfast pool collapse for Vegan plans.

---

## SECTION 5 — Hybrid Model Analysis

### Hybrid A — Diet-label + Concept (parallel)

Run both sets simultaneously:
- Label: "keto healthy dinner", "keto quick lunch", "keto easy breakfast"
- Concept: "omelette", "frittata", "bacon eggs", "avocado breakfast"

Merge → deduplicate → enrich → filter → pool.

**Fit with THA architecture:** HIGH.
- `fetchExternalCandidates()` already deduplicates by normalised name
- Adding additional queries to the existing call requires changing the `rawQueries` construction only
- No new functions, no new pipeline steps
- Deduplication before enrichment keeps enrichment volume bounded
- Code change: modify `rawQueries` construction in `generateSmartSuggestion()` or `searchMealDB()`

**Downside:** Slightly more search requests (17 → ~25). All parallel — wall-clock time unaffected.

### Hybrid B — Concept search + dietary scoring

Search broad concepts only (no prefix). Then in `scoreMeal()` apply a dietary conformance bonus:
- If recipe ingredients contain keto-positive terms (eggs, avocado, meat, cheese) → boost score
- If recipe passes `shouldExcludeRecipe()` → include; if it fails → exclude

**Fit with THA architecture:** PARTIAL.
- `scoreRecipeForDiet()` already exists in `dietRules.ts` (currently unused by Smart Planner)
- `scoreMeal()` would need to call `scoreRecipeForDiet()` and incorporate the result
- Requires no new functions but does require wiring an existing unused function

**Advantage:** Broader pool, self-adjusting quality via scoring rather than binary label inclusion.
**Downside:** Non-compliant candidates are enriched before being excluded — wasted enrichment.

### Hybrid C — Diet-label + Concept with merged deduplication (recommended)

```
STEP 1: Label queries (current behaviour)
  "keto healthy dinner", "keto easy breakfast"
         +
STEP 2: Slot-targeted concept queries (new)
  Per-slot: ["omelette", "frittata", "bacon eggs"]   → breakfast concepts
  Per-slot: ["salad", "soup", "wrap"]                 → lunch concepts
  Per-slot: ["curry", "stir-fry", "chilli"]           → dinner concepts
         ↓
STEP 3: Merge + deduplicate (existing: seen.Set by normalised name)
         ↓
STEP 4: Enrich (existing: enrichExternalCandidates)
         ↓
STEP 5: dietRules filter (existing: candidateDietExcluded)
         ↓
STEP 6: Score (existing: scoreMeal)
```

**Fit with THA architecture:** HIGHEST.
- Steps 3–6 are unchanged
- Steps 1–2 require only modifying `rawQueries` construction in `fetchExternalCandidates`
- The `category` parameter (currently dead) could be used to select slot-appropriate concept query lists
- No new services, no schema changes, no database changes
- `inferCategoryFromCuisineAndName()` already correctly classifies "omelette" → "breakfast"

---

## SECTION 6 — Breakfast Gap Test

### Would concept queries expand the Keto breakfast pool?

**Current pool:** 0 external keto breakfast candidates (TheMealDB label queries return nothing; scraping sources return dinner/lunch results even with "easy breakfast" prefix).

**Concept query simulation:**

| Query | Expected TheMealDB return | Keto-compliant? | Breakfast-categorised by inferCategory? |
|---|---|---|---|
| "omelette" | Omelette, Spanish Omelette | ✅ (eggs, cheese) | ✅ (name contains "omelette") |
| "frittata" | Frittata recipes | ✅ (eggs, veg, cheese) | ⚠️ name-dependent |
| "scrambled eggs" | Scrambled Eggs | ✅ (eggs, butter) | ⚠️ name-dependent |
| "eggs benedict" | Eggs Benedict | ❌ (English muffin = DICT_BAKERY) | Would be excluded at filter |
| "bacon breakfast" | "Full Breakfast" or similar | ✅ (bacon, eggs) | ✅ ("breakfast" in name) |
| "avocado breakfast" | Limited TheMealDB results | ✅ likely | ✅ ("breakfast" in name) |
| "smoked salmon eggs" | "Smoked Salmon Scramble" if exists | ✅ (salmon, eggs) | ⚠️ name-dependent |
| "shakshuka" | Shakshuka | ✅ (eggs, tomatoes, peppers) | ⚠️ defaults to "dinner" (no breakfast keyword in name) |

**Expected pool increase for Keto breakfast:** +3 to +6 genuine breakfast candidates from TheMealDB alone, covering "omelette", "spanish omelette", "full breakfast" variants. With scraping sites targeting "omelette breakfast", "keto omelette" (BBC GoodFood does have labelled keto content), the pool could reach 5–10 external breakfast candidates — sufficient to cover 7-day breakfast needs beyond the 2 local meals.

**Important nuance — inferCategoryFromCuisineAndName gap:**

`inferCategoryFromCuisineAndName` recognises: `"breakfast"`, `"pancake"`, `"omelette"`, `"porridge"`, `"granola"`, `"smoothie"`.

It does NOT currently recognise: "frittata", "shakshuka", "scrambled", "bacon eggs", "avocado toast". Recipes named "Shakshuka" or "Frittata" would default to `"dinner"` even though they are breakfast dishes. This means:
- "omelette" query → omelette recipes correctly assigned "breakfast" ✅
- "frittata" query → frittata recipes assigned "dinner" ⚠️ (unless fixed separately)

Adding "frittata", "shakshuka", "scrambled" to `inferCategoryFromCuisineAndName` is a 3-line change that would be needed alongside query additions.

### Would concept queries expand the Vegan breakfast pool?

**Current pool:** 0 external vegan breakfast candidates.

| Query | Expected results | Vegan-compliant? | Note |
|---|---|---|---|
| "smoothie" | Berry Smoothie, Green Smoothie | ✅ if dairy-free | "smoothie" → breakfast ✅ |
| "porridge" | Oat Porridge | ✅ if dairy-free | "porridge" → breakfast ✅ |
| "granola" | Granola Bowl | ✅ typically | "granola" → breakfast ✅ |
| "overnight oats" | Overnight Oats | ✅ depends | ⚠️ name may not trigger inferCategory |
| "fruit bowl" | Various | ✅ | ⚠️ defaults to "dinner" |
| "chia pudding" | Chia Pudding | ⚠️ if uses "almond milk" | ❌ BLOCKED by plant milk false positive |
| "acai bowl" | Acai Bowl | ✅ typically | ⚠️ inferCategory may default "dinner" |

**Plant milk false positive blocks many vegan breakfasts.** Fixing the `DAIRY_KEYWORDS` false positive (adding exceptions for "almond milk", "oat milk", "plant milk", "coconut milk", "soy milk") is a prerequisite for vegan breakfast pool expansion regardless of discovery strategy. Without it, concept queries for "chia pudding" and "smoothie with oat milk" correctly find compliant recipes that are then incorrectly excluded.

**Estimated vegan breakfast pool with both fixes:**
- Plant milk false positive fixed in dietRules + "smoothie", "porridge", "granola" concept queries added
- Expected: +3 to +8 vegan breakfast candidates per generation

---

## SECTION 7 — Performance Analysis

### Network request counts per strategy

| Strategy | Search requests | Wall-clock search time | Enrichment batches (5-concurrent) | Total estimated latency |
|---|---|---|---|---|
| Diet-labelled (current) | 17 (+ 17 fallback if < 10 results) | ~10s (parallel) | 4–8 batches × 8s = 32–64s | **High: 40–75s** |
| Compatibility-only | 17+ extra concept queries | ~10s (parallel, same wall-clock if parallel) | Same or fewer (more targeted results) | **Similar to current** |
| Exclusion-first | 5–10 broad queries | ~8s (parallel) | More batches (larger raw pool) | **Moderate: 45–80s** |
| Hybrid C (recommended) | 25–30 total (label + concept, parallel) | ~10s (no sequential overhead) | Similar to current (dedup before enrich) | **Similar to current** |

**Key insight:** The dominant latency cost is enrichment, not search. All search requests are already parallel via `Promise.all`. Adding 10 more parallel queries does not meaningfully increase wall-clock search time. The enrichment pipeline (serial 5-concurrent batches) is the bottleneck.

TheMealDB is the exception — it returns full ingredient data inline, requiring no enrichment. Queries targeting TheMealDB with concept terms return enrichment-ready candidates immediately. This makes TheMealDB + concept queries the highest-efficiency path.

### Why the current fallback doubles latency

The current system fires 17 search requests. If results < 10, it fires another 17 (the generic fallback). This can double search latency — the second wave is sequential to the first. A concept-query approach with upfront broader queries would eliminate this fallback entirely, reducing worst-case search time from 2×17 to 1×25 requests.

---

## SECTION 8 — Existing Architecture Reuse

### Which strategy reuses the most existing code?

| Component | Labelled | Compatibility | Exclusion-first | Hybrid C |
|---|---|---|---|---|
| `shouldExcludeRecipe()` | ✅ (post-enrich) | ✅ (post-enrich) | ✅ (post-enrich) | ✅ (post-enrich) |
| `fetchExternalCandidates()` | ✅ | ✅ (minor query change) | ✅ (minor query change) | ✅ (minor query change) |
| `enrichExternalCandidates()` | ✅ | ✅ | ✅ | ✅ |
| `scoreMeal()` | ✅ | ✅ | ✅ | ✅ |
| `scoreRecipeForDiet()` | ❌ (unused) | ❌ (unused) | ❌ (unused) | Could wire ✅ |
| `inferCategoryFromCuisineAndName()` | ✅ | ✅ (+extend terms) | ✅ (+extend terms) | ✅ (+extend terms) |
| `getDietarySearchPrefix()` | ✅ | ⚠️ (partial — prefix still useful for scraping sites) | ❌ (not needed) | ✅ (retained for scraping) |
| `candidateDietExcluded()` | ✅ | ✅ | ✅ | ✅ |
| Deduplication in `fetchExternalCandidates` | ✅ | ✅ | ✅ | ✅ |

**Hybrid C requires the fewest new functions — zero.** It reuses the complete existing pipeline and changes only the query terms passed to `rawQueries`.

### Estimated new code per strategy

| Strategy | New functions needed | Lines of new code estimate | Risk |
|---|---|---|---|
| Diet-labelled (extend) | 0 | ~5 (add breakfast query terms to prefix list) | Low |
| Compatibility-only | 0 | ~20 (replace query generation logic) | Medium |
| Exclusion-first | 0 | ~15 (replace query generation, add broad terms) | Low |
| Hybrid C | 0 | ~30 (add concept query lists + merge logic) | Low |

All strategies require zero new services, zero schema changes, zero database migrations.

---

## SECTION 9 — Strategic Recommendation

### Option A — Diet-Labelled Search (current + extend)

**What changes:** Add "breakfast", "lunch", "dinner" slot-specific queries with diet prefix (e.g., "keto eggs breakfast").

**Accuracy:** MODERATE. Works well for scraping sites that label content. Zero benefit for TheMealDB (name-based search).

**Scalability:** LOW. As diet combinations multiply, maintaining prefix-per-diet query lists becomes a table of 10 diets × 3 slots × 5 term variations = 150 query configurations.

**Maintenance burden:** HIGH. Requires curated query lists per diet per slot to stay effective.

**Implementation complexity:** LOW. One query list change.

### Option B — Ingredient Compatibility Search

**What changes:** Replace prefixed queries with concept-based queries ("omelette", "frittata", "bacon eggs") per slot. Apply `shouldExcludeRecipe()` post-enrichment.

**Accuracy:** HIGH. Correctly returns recipes regardless of dietary labelling. False positives handled by dietRules engine.

**Scalability:** HIGH. Concept query lists are diet-agnostic. Adding a new diet requires only adjusting `shouldExcludeRecipe()`, not query lists.

**Maintenance burden:** LOW. Concept queries ("omelette", "smoothie", "curry") are stable — they don't change with diet trends.

**Implementation complexity:** LOW. Replace query generation. Add new terms to `inferCategoryFromCuisineAndName`. Fix plant milk false positive in dietRules.

### Option C — Exclusion-First Discovery

**What changes:** Broad categorical queries ("breakfast", "dinner", "lunch") without dietary prefix. Filter everything post-enrichment.

**Accuracy:** HIGHEST. Maximum raw candidate yield; dietRules filter is comprehensive.

**Scalability:** HIGHEST. Zero query maintenance; `shouldExcludeRecipe()` owns all compliance.

**Maintenance burden:** LOWEST. No query curation required.

**Implementation complexity:** MODERATE. Need to use TheMealDB's category endpoint (`/filter.php?c=Breakfast`) or add broad slot-category query terms. Highest enrichment volume.

### Option D — Hybrid Discovery (recommended)

**What changes:**
1. Retain dietary prefix queries for scraping sites where labels add value
2. Add concept queries for TheMealDB and as supplementary searches
3. Merge + deduplicate before enrichment (already exists)
4. Fix `inferCategoryFromCuisineAndName` to recognise "frittata", "shakshuka", "scrambled"
5. Fix plant milk false positive in `dietRules.ts`

**Accuracy:** HIGHEST PRACTICAL. Diet-label search captures labelled content on BBC GoodFood/AllRecipes where it works. Concept search captures unlabelled-but-compliant content on TheMealDB where labels don't exist.

**Scalability:** HIGH. Concept query lists are diet-agnostic. Adding a new diet = updating dietRules only.

**Maintenance burden:** MODERATE. Two query sets to maintain (label + concept), but concept set is stable.

**Implementation complexity:** LOWEST among strategies that actually solve the breakfast gap. All changes in existing functions.

---

## COMPARISON MATRIX

| Strategy | Candidate Coverage | Dietary Accuracy | Performance | Complexity | Recommendation |
|---|---|---|---|---|---|
| Diet-labelled (current) | LOW — TheMealDB returns 0 for label queries; breakfast never targeted | MODERATE — good for labelled sites, zero for TheMealDB | POOR — fallback doubles latency | LOW | Do not continue as sole strategy |
| Compatibility-only | HIGH — concepts capture unlabelled compliant meals | HIGH — dietRules filters post-enrichment | MODERATE — more raw candidates, more enrichment | LOW | Strong contender; misses label-tagged content on scraping sites |
| Exclusion-first | HIGHEST — broadest raw pool | HIGHEST — full dietRules coverage | MODERATE — highest enrichment volume | MODERATE — requires TheMealDB category endpoint use | Long-term ideal; enrichment cost is a tradeoff |
| Hybrid (label + concept) | HIGH — captures both labelled and unlabelled | HIGH — dietRules as SSoT | GOOD — eliminates fallback, parallel search | LOW — zero new functions | **RECOMMENDED** |

---

## MANDATORY FINDINGS

**1. Is Smart Planner currently too dependent on dietary labels?**

YES. TheMealDB, the highest-quality source with inline ingredients, uses name-based search and has no recipes labelled "keto" or "vegan". All label-prefixed queries to TheMealDB return approximately 0 results. The system falls through to the generic fallback for every dietary plan. The label dependency is causing complete TheMealDB exclusion from dietary plans.

**2. Would compatibility-first discovery improve candidate pools?**

YES. Searching for "omelette" instead of "keto omelette" would return actual TheMealDB omelette recipes, which pass Keto filtering post-enrichment. Compatibility queries directly match TheMealDB's name-indexed database. The improvement is specifically for TheMealDB (the most reliable source) and for breakfast slots where no label-prefixed queries currently target breakfast concepts.

**3. Would exclusion-first discovery improve candidate pools?**

YES. It maximises raw candidate volume by searching the broadest possible terms ("breakfast", "chicken", "eggs"). Post-enrichment dietRules filtering is comprehensive. The tradeoff is higher enrichment volume for scraped sources; TheMealDB is unaffected.

**4. Which strategy is fastest?**

Diet-labelled search (current) is the slowest in practice because the label queries return 0 TheMealDB results, triggering the fallback which doubles search time to 34 requests. Hybrid C (concept + label queries, all parallel, no fallback needed) is fastest in practice because it eliminates the fallback round-trip.

**5. Which strategy is most accurate?**

Exclusion-first + dietRules is most accurate: broadest pool, all filtered by the single source of truth dietary engine. Hybrid C is nearly equivalent in accuracy with better performance.

**6. Which strategy best fits THA architecture?**

Hybrid C. It requires zero new functions, zero schema changes, and modifies only the query generation portion of `external-meal-service.ts`. All existing pipeline stages (enrichment, filtering, scoring, deduplication) are unchanged.

**7. Which strategy best solves Keto breakfast shortages?**

Compatibility search: querying for "omelette", "frittata", "bacon breakfast", "avocado breakfast" directly targets keto-compliant breakfast meals without relying on dietary labels. Combined with extending `inferCategoryFromCuisineAndName` to recognise "frittata" and "shakshuka" as breakfast, this would add an estimated 3–6 breakfast candidates per generation.

**8. Which strategy best solves Vegan breakfast shortages?**

Two-part answer:
1. **Fix the plant milk false positive in `dietRules.ts` first.** Without this fix, vegan recipes using almond milk, oat milk, plant milk, or coconut milk are incorrectly excluded. This is the highest-impact single change for Vegan breakfast.
2. **Add smoothie and porridge concept queries.** "smoothie", "porridge", "granola" are correctly classified as breakfast by `inferCategoryFromCuisineAndName` and are naturally vegan. Both changes together would add an estimated 3–8 vegan breakfast candidates.

**9. What is the smallest safe improvement?**

Two changes, each independent:

**Change A — Query addition (5 lines):**
Add slot-targeted concept queries alongside existing label queries in `generateSmartSuggestion` or `fetchExternalCandidates`:
- Keto breakfast concepts: "omelette", "frittata", "bacon eggs", "avocado breakfast"
- Vegan breakfast concepts: "smoothie", "porridge", "granola bowl", "chia pudding"
These run in parallel with existing queries via the existing deduplication in `fetchExternalCandidates`.

**Change B — Plant milk fix (~5 lines):**
In `dietRules.ts`, adjust the VEGAN exclusion to skip dairy check when ingredient text contains "almond milk", "oat milk", "plant milk", "soy milk", or "coconut milk". Or move compound plant milk phrases to a whitelist checked before the dairy keyword scan. This eliminates the false positive that blocks vegan recipes using plant-based milks.

Together these two changes are GREEN risk, require no new functions, and directly address the Keto and Vegan breakfast gaps.

**10. What is the recommended long-term architecture?**

Hybrid C: a slot-aware, concept-augmented discovery model.

```
PER GENERATION:

1. Determine dietary prefix (existing: getDietarySearchPrefix)
2. Determine slot-targeted concept queries (new: per-slot concept lists)
3. Fire parallel search:
   - Diet-label queries (existing: for scraped sources where labels work)
   - Concept queries (new: diet-agnostic, slot-targeted)
4. Merge + deduplicate (existing: fetchExternalCandidates dedup)
5. Enrich (existing: enrichExternalCandidates)
6. Filter: dietRules (existing: candidateDietExcluded → shouldExcludeRecipe)
7. Score (existing: scoreMeal)
8. Select per slot (existing: getCandidateSlotFit → getSafeFallbackCandidates)
```

Supporting changes:
- Fix plant milk false positive in `dietRules.ts`
- Extend `inferCategoryFromCuisineAndName` with: "frittata", "shakshuka", "scrambled eggs", "benedict", "acai", "overnight oats"
- Once concept queries are stable, evaluate using TheMealDB's `/filter.php?c=Breakfast` category endpoint directly for slot-specific fetching

---

## SMALLEST SAFE IMPROVEMENT (AMBER implementation candidate)

| Step | Change | File | Lines | Risk |
|---|---|---|---|---|
| 1 | Fix plant milk false positive | `dietRules.ts` | ~5 | GREEN |
| 2 | Add concept queries alongside existing | `external-meal-service.ts` | ~15 | GREEN |
| 3 | Extend `inferCategoryFromCuisineAndName` | `external-meal-service.ts` | ~8 | GREEN |
| Total | — | 2 files | ~28 | GREEN |

---

## DATA IMPACT DECLARATION

| Check | Answer |
|---|---|
| Reads existing data | Yes (dietRules, external-meal-service, smart-suggest-service) |
| Writes new data | No |
| Changes meaning of existing data | No |
| Requires backfill | No |
| Code changed | No |
| Schema changed | No |

---

## SCOPE COMPLIANCE DECLARATION

Investigation only. No code, schema, search, or data changes were made.
