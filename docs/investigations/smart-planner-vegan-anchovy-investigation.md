# VEGAN CLASSIFICATION FAILURE INVESTIGATION: COMPLETE

**Date:** 2026-06-06
**Investigator:** Claude (investigation only — no code changes)
**Subject:** Recipe containing anchovies selected for a Vegan Smart Plan

---

## Rollback identifier
- **Tag:** `rollback-vegan-anchovy-investigation-2026-06-06`
- **Commit:** `6503356` (`feat(smart-planner): dietary-aware external recipe search`)
- Working tree had only untracked files at start; no tracked files were modified. **Code changes made: NONE.** Temporary DB query scripts were created in-workspace to read data, then deleted.

---

## PART 1 — Recipe record

Queried live DB (`meals` table). The meal exists once as a real recipe (id 1484); a second `planner-placeholder` stub (id 2119, different user, no ingredients) is irrelevant.

| Field | Value |
|---|---|
| meal id | **1484** |
| user_id | 1 |
| name | Pasta Puttanesca (Tart's Spaghetti) |
| source / source_url | deliaonline.com |
| **meal_source_type** | **`scratch`** |
| meal_format | recipe |
| is_ready_meal / barcode | false / null |
| **diet_types** | **`[]` (empty)** |
| cuisine | (none — no cuisine column populated) |
| tags | *no `tags` column exists on `meals`* |

Ingredient list (verbatim): spaghetti; olive oil; garlic; fresh basil; **"2 oz (50 g) anchovies, drained"**; black olives; tomatoes.

**Does the stored record classify the meal?** No. `diet_types = []`. The record carries **no dietary classification at all** → effectively **Unknown**. It is not marked Vegan, not marked Fish/Seafood, not marked anything. There is no stored classifier that ever inspected the anchovy ingredient.

---

## PART 2 — Ingredient analysis (anchovy)

There are **three independent keyword lists** in the planner path, and anchovy's treatment differs in each:

| List | Location | Contains "anchovy"/"anchovies"? |
|---|---|---|
| `FISH_SEAFOOD_KEYWORDS` (correct, **unused by planner**) | `server/lib/dietRules.ts:42` | ✅ Yes |
| `FISH_KEYWORDS` (planner **scoring**) | `server/lib/meal-scoring-service.ts:34` | ❌ **No** |
| `proteinMap.fish/seafood` (planner **fish-cap** classifier) | `server/lib/meal-scoring-service.ts:236` | ❌ **No** |
| `vegetarianDays` inline filter | `server/lib/smart-suggest-service.ts:434` | ❌ **No** |

1. **Are anchovies recognised as fish?** Only in `dietRules.ts` — which the Smart Planner never calls. In every list the planner actually uses, **anchovy is absent**.
2. **Which keyword lists are used?** The planner uses `meal-scoring-service.ts` lists (scoring + protein) and the inline veg-day list. None contain anchovy.
3. **Which detection rules fire?** None. The anchovy text matches nothing.
4. **Which fail?** All of them, silently. `primaryProtein` resolves to **`null`** (not "fish"), and the vegan scoring penalty does not trigger.

**Exact detection path:** anchovy → not in `FISH_KEYWORDS` → vegan `DIET_EXCLUDED_KEYWORDS` check returns `hasExcluded = false` → no scoring penalty; and → not in `proteinMap` → `primaryProtein = null` → fish-cap cannot see it.

---

## PART 3 — Profile suitability (Vegan)

Live profile, user 1:
- `users.diet_pattern = "Vegan"`, `diet_restrictions = []`
- `user_preferences.diet_types = ["style:family-friendly","style:whole-foods","vegan"]`
- **`user_preferences.excluded_ingredients = []`**

Pipeline (`server/routes.ts:4796` → `generateSmartSuggestion`):
- **dietTypes evaluated:** the three above; only `"vegan"` has a `DIET_EXCLUDED_KEYWORDS` entry.
- **Hard exclusions applied (`hardExcludedIngredients`):** built **only** from `prefs.excludedIngredients` + household-eater `hardRestrictions` (`routes.ts:4866-4907`). For this user that set is **empty**. **The Vegan diet pattern is never converted into hard-excluded ingredients.**
- **Penalties applied:** in `scoreMeal`, vegan excluded-keyword scan over recipe text → **no match** (anchovy not listed) → `dietMatch` stays at full **+22** (a –10 penalty would have applied only if a listed keyword were present).
- **dietMatch score:** **+22 (maximum / "perfectly vegan")**.
- **suitability / hard-restriction result:** `isHardExcluded(...) = false` → **passes** the only hard gate.

---

## PART 4 — Scoring

`scoreMeal` (`meal-scoring-service.ts`) for meal 1484, profile vegan:

| Component | Value |
|---|---|
| dietMatch | **+22** (no vegan keyword detected) |
| goalAlignment | base 13 (no goal keywords decisive) |
| budgetAlignment | base 13 |
| upfScore | base 13 |
| varietyScore | base 13 |
| overlapScore | 0 |
| cuisineBonus | 0 |
| simplicityBonus | 7 ingredients (+ name contains "pasta") → **~13 (capped)** |
| **final score** | **high (~80+/100)** — top-tier candidate |

**Classification of outcome:** **B + (a flavour of D).** The meal is treated as **non-Vegan but allowed anyway** — and worse, it is scored as a **full-marks Vegan match** because the detector never saw the anchovy. It was **not penalised** (not option C); it was **not analysed correctly** (D applies to the missed ingredient).

---

## PART 5 — Planner selection

The full candidate gate sequence in `generateSmartSuggestion` is: grocery/product exclusion → alcohol → drinks → **`isHardExcluded` (household ingredients only)** → slot fit → optional veg-days → fish cap → red-meat cap → UPF/budget → score & pick.

1. **Why still eligible?** No gate in the planner enforces the user's `dietPattern`. The only hard gate (`isHardExcluded`) checks an empty ingredient list.
2. **Which gate should have stopped it?** A diet-pattern hard filter — exactly what `dietRules.shouldExcludeRecipe` does (its Vegan case includes `FISH_SEAFOOD_KEYWORDS` ⊇ anchovy). **That function is wired only into the recipe-search route (`routes.ts:2559`), never into the planner.**
3. **Which gate actually allowed it?** `isHardExcluded` returned false (empty `hardExcludedIngredients`), so the meal entered the scored pool and ranked near the top.
4. **Only anchovies, or all fish-based meals?** **Broader than anchovies.** Two distinct scopes:
   - *Missing-gate scope (severe):* **every** animal product passes the planner for Vegan/Vegetarian users, because diet pattern is never a hard filter.
   - *Keyword-gap scope:* anchovy/squid/octopus/oyster/clam/scallop are additionally invisible to the **scoring** penalty and the **fish-cap** classifier.
5. **Could it affect tuna / salmon / sardines / prawns / shellfish / meat / dairy / eggs?**

| Ingredient | Hard-excluded by planner for Vegan? | Gets vegan scoring penalty? | Counted by fish-cap? |
|---|---|---|---|
| tuna, salmon, prawn, shrimp, crab, lobster, mussel | ❌ No (no diet gate) | ✅ Yes (in `FISH_KEYWORDS`) | ✅ fish/seafood |
| sardine | ❌ No | ✅ Yes | ❌ not in proteinMap |
| **anchovy, squid, octopus, oyster, clam, scallop** | ❌ No | ❌ **No (gap)** | ❌ No |
| meat (chicken/beef/pork/lamb…) | ❌ No | ✅ Yes | ✅ |
| dairy (milk/cheese/cream/butter/yogurt) | ❌ No | ✅ Yes | n/a |
| eggs | ❌ No | ✅ Yes ("egg") | n/a |

So **all** of them can be selected for a Vegan user; salmon/tuna/etc. merely score lower, while anchovy and the other gap items score as fully compliant.

---

## PART 6 — Root cause classification

**F — Multiple issues**, in priority order:

- **(C) Vegan exclusion bug — primary/architectural.** The Smart Planner never enforces `dietPattern` as a hard filter. The correct, tested enforcement (`dietRules.shouldExcludeRecipe`) exists but is not wired into the planner; the planner's only hard gate is the (empty) household `hardExcludedIngredients`.
- **(A) Ingredient detection bug — secondary.** `FISH_KEYWORDS` (`meal-scoring-service.ts:34`), `proteinMap` (`:236`), and the veg-day list (`smart-suggest-service.ts:434`) all omit anchovy (and squid/octopus/oyster/clam/scallop), so even the soft penalty and fish-cap miss it.

---

## KEY QUESTIONS

1. **Why did anchovy puttanesca pass Vegan filtering?** Because the planner has no Vegan hard filter at all, and the user's hard-exclusion list is empty. The diet pattern only ever influences a score, and even that score-penalty missed anchovy due to a keyword gap — so it scored as a perfect vegan match and was picked.
2. **Exact code path:** `routes.ts:4796` builds `hardExcludedIngredients` from `excludedIngredients` only (`:4907`, empty) → `generateSmartSuggestion` → `isHardExcluded` false → `scoreMeal` (`meal-scoring-service.ts:103-112`) vegan scan misses anchovy → `dietMatch=+22` → ranked & selected. The correct gate (`dietRules.shouldExcludeRecipe`, `dietRules.ts:180`) is never invoked here.
3. **What should have happened:** the recipe text should have been run through a diet-pattern hard filter; the Vegan branch of `shouldExcludeRecipe` already catches `anchovy`/`anchovies` and would exclude meal 1484.
4. **Does it affect other meals?** Yes — broadly. All animal-product recipes are eligible for Vegan/Vegetarian users; anchovy/squid/octopus/oyster/clam/scallop are additionally undetected even by scoring/fish-cap.
5. **Smallest safe fix:** thread the user's `dietPattern` (+ `dietRestrictions`) into `SmartSuggestSettings` and add **one** hard-filter call in the planner's candidate loop reusing the existing, already-tested `shouldExcludeRecipe(text, ctx)` from `dietRules.ts` (the same function the recipe-search route already trusts). This single gate fixes the whole class (all animals, all diet patterns) without touching scoring or keyword lists. A smaller-but-incomplete alternative (add anchovy etc. to `FISH_KEYWORDS`/`proteinMap`) only lowers the score and would **not** guarantee exclusion — not recommended as the real fix.
6. **Risk level of that fix:** 🟡 **LOW–MEDIUM.** It reuses a battle-tested pure function and adds a filter rather than changing existing scoring/ranking. Main risk is candidate-pool thinning for strict patterns (Vegan/Carnivore) on thin libraries — already mitigated by the planner's existing safe-fallback/skip logic. Needs a regression check that non-restricted users see no pool change.

---

## DELIVERABLE SUMMARY

- **rollback identifier:** tag `rollback-vegan-anchovy-investigation-2026-06-06` @ `6503356`
- **recipe classification:** meal 1484, `meal_source_type=scratch`, `diet_types=[]` → **Unknown** (no stored dietary classification; contains anchovies = fish)
- **ingredient analysis result:** anchovy recognised as fish **only** in the unused `dietRules.ts`; **missing** from the planner's scoring `FISH_KEYWORDS`, the `proteinMap` fish classifier, and the veg-day list
- **suitability result:** Vegan profile, `excluded_ingredients=[]` → `hardExcludedIngredients` empty → `isHardExcluded=false`; **diet pattern never enforced as a hard gate**
- **scoring result:** `dietMatch=+22` (full vegan match — anchovy undetected); high final score; top candidate. Outcome type **B** (non-vegan allowed) compounded by **D** (mis-analysed)
- **planner selection result:** passed every gate; no gate enforces dietPattern; selected
- **root cause:** **F (multiple)** — primary **C** (no Vegan hard filter in planner; correct `shouldExcludeRecipe` not wired in) + secondary **A** (anchovy keyword gap in planner's fish lists)
- **smallest safe fix:** add one diet-pattern hard-filter call in the planner reusing existing `dietRules.shouldExcludeRecipe`, threading `dietPattern` through `SmartSuggestSettings`
- **risk assessment:** 🟡 LOW–MEDIUM (additive filter, reuses tested code; verify pool-thinning on strict diets)

---

## CODE CHANGES MADE: NONE

## DATA IMPACT DECLARATION
- Reads existing data: **Yes**
- Writes new data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No**
