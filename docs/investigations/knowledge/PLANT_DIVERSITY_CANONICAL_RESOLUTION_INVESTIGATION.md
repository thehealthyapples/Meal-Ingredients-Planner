# Plant Diversity Report — Canonical Resolution Investigation

**Date:** 2026-06-24  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Rollback tag:** `investigation/plant-diversity-canonical-resolution-20260624`  
**Status:** Investigation complete. No code changed.

---

## ROLLBACK PROTECTION

Tag created before investigation began:

```
investigation/plant-diversity-canonical-resolution-20260624 → f531216
```

No files modified during this investigation.

---

## EXECUTIVE SUMMARY

Chicken Breasts, Chicken Legs, and all poultry cuts display `Supports: —` and `Key Nutrients: —` in the Plant Diversity Report for **two independent reasons**:

1. **The WS0.8 seed was never run.** The `knowledge_foods` table only contains 69 foods (pre-WS0.8). Chicken was added to the code in commit `bad86ca` but `npm run seed:knowledge` was not run after that commit. The live database has no chicken entry. The server's alias lookup therefore finds no match.

2. **Even if the seed were run, the display would still show "Chicken Breasts" (not "Chicken").** The client-side display key pipeline (`normaliseForReuse`) does not map chicken cuts to the canonical "chicken" identity. The WS0 server-side lookup resolves cuts to the chicken food for nutrient data, but the display key is computed client-side before the API call, and that key is what the response is indexed against — and what the row label shows.

These are two distinct problems. Fixing the first (running the seed) would populate the nutrients and benefits. Fixing the second (canonical display) is a separate UI design decision that requires deliberate implementation.

---

## PHASE 1 — CHICKEN END-TO-END TRACE

### Input: "Chicken Breasts" (as it appears in a meal's ingredient list)

**Step 1 — Client: Display key computation**

```
raw = "Chicken Breasts"
↓
getDisplayKey(raw):
  EXTRA_UNIT_RE strips nothing (no unit words match)
  preStripped = "Chicken Breasts"
  normaliseForReuse("Chicken Breasts"):
    stripForMatch("Chicken Breasts"):
      .toLowerCase() → "chicken breasts"
      No fractions, numbers, or unit words present
      split → ["chicken", "breasts"]
      STRIP_WORDS filter: neither word is in STRIP_WORDS
      join → "chicken breasts"
    resolveIngredientAlias("chicken breasts"):
      normalizeIngredientKey("chicken breasts") → "chicken breasts"
      ALIASES["chicken breasts"] → undefined  ← NOT IN ALIAS MAP
      returns "chicken breasts" unchanged
  
displayKey = "chicken breasts"
```

**Step 2 — Client: API request**

```
allLookupKeys includes "chicken breasts"
POST /api/knowledge/ingredient-lookup
body: { ingredients: ["chicken breasts", ...] }
```

**Step 3 — Server: resolveIngredientsToKnowledgeSummary(["chicken breasts", ...])**

```
foods = await listFoods()
  → queries knowledge_foods WHERE is_active = true
  → returns 69 rows (DB state: pre-WS0.8)
  → "chicken" IS NOT in the 69 rows

Building termToSlug:
  Only 69 foods are iterated. Chicken is absent.
  "chicken breasts" is NOT added to termToSlug.

For ingredient "chicken breasts":
  key = normalizeIngredientKey("chicken breasts") = "chicken breasts"
  slug = termToSlug.get("chicken breasts") → undefined
  Fallback: "chicken breasts".endsWith("s") → true
             termToSlug.get("chicken breast") → undefined (chicken not in DB)
  No match found.

ingredientToSlug → empty (no matches)
slugsNeeded → empty set
Returns {}
```

**Step 4 — Client: display**

```
knowledgeMap = {}  (empty response from API)
knowledgeMap["chicken breasts"] → undefined

knowledge?.nutrients → undefined → keyNutrients = []
knowledge?.benefits  → undefined → benefitSummary = null

Result:
  Key Nutrients: —   (keyNutrients.length === 0)
  Supports: —        (benefitSummary === null)
```

### Chain failure point

The chain breaks at Step 3 because `knowledge_foods` does not contain chicken. The alias lookup cannot fire because the food it would resolve to does not exist in the database.

---

### Repeat trace for remaining foods

| Ingredient | Display Key (client) | In DB? | Alias defined? | Result |
|---|---|---|---|---|
| Chicken Breasts | chicken breasts | NO | YES (in code, not in DB) | — / — |
| Chicken Legs | chicken legs | NO | YES (in code, not in DB) | — / — |
| Chicken Thighs | chicken thighs | NO | YES (in code, not in DB) | — / — |
| Chicken Stock | chicken stock | NO | NO (not in seed at all) | — / — |
| Chicken Stock Cube | chicken stock cube | NO | NO (not in seed at all) | — / — |

Chicken Stock and Chicken Stock Cube have a **double absence**: the database doesn't have them AND the WS0 seed data doesn't include them either (not in `foods.ts`, not in `relationships.ts`, not as an alias of chicken). Even after running the seed, these would remain unresolved.

---

## PHASE 2 — WS0 CONTENT VERIFICATION

### Does WS0 contain Chicken?

**In editorial code (shared/knowledge/foods.ts): YES**

```typescript
// Line 838
{ slug: "chicken", name: "Chicken", category: "Proteins",
  subcategory: "Poultry",
  aliases: [
    "chicken breast", "chicken breasts",
    "chicken thigh", "chicken thighs",
    "chicken leg", "chicken legs",
    "chicken drumstick", "chicken drumsticks",
    "chicken wing", "chicken wings",
    "whole chicken", "roast chicken"
  ],
  description: "A widely eaten white meat supplying selenium, vitamin B6, zinc and vitamin B12.",
  ...
}
```

**In editorial code (shared/knowledge/relationships.ts): YES**

```
// Line 189
"chicken": ["selenium", "vitamin-b6", "zinc", "vitamin-b12"],

// Line 394
"chicken": ["muscle-recovery", "energy-support"],
```

**In the live database (knowledge_foods table): NO**

```sql
SELECT slug FROM knowledge_foods WHERE slug = 'chicken';
-- 0 rows
```

**Database food count vs seed code food count:**

| Source | Count |
|---|---|
| knowledge_foods in DB | 69 |
| FOOD_SEED in code | 188 |
| Difference (unseeded) | 119 |

The database was seeded before commit `bad86ca` (WS0.8, 2026-06-21). After that commit, `npm run seed:knowledge` was not run. The 119 additional foods — including all Wave 8 proteins (chicken, eggs, beef, lamb, pork, turkey, duck, tuna, mackerel, cod, haddock, anchovies, prawns) plus dairy, grains, and other pantry staples — are defined in code but absent from the DB.

**Nutrient and benefit entities ARE seeded:**

| Entity | DB count | Seed count | Status |
|---|---|---|---|
| knowledge_nutrients | 30 | 30 | In sync |
| knowledge_health_benefits | 15 | 15 | In sync |
| knowledge_foods | 69 | 188 | **119 missing** |
| knowledge_food_nutrients | 232 | ~520 (est.) | Incomplete |
| knowledge_food_benefits | 192 | ~400 (est.) | Incomplete |

The nutrients themselves exist (selenium, vitamin-b6, zinc, vitamin-b12, muscle-recovery, energy-support). Only the food→nutrient and food→benefit links for the missing 119 foods are absent.

**What chicken WOULD show if seeded:**

- **Canonical ID:** chicken
- **Key Nutrients:** Selenium · Vitamin B6 · Zinc · Vitamin B12
- **Supports:** Muscle Recovery · Energy Support
- **Aliases resolved:** chicken breast(s), chicken thigh(s), chicken leg(s), chicken drumstick(s), chicken wing(s), whole chicken, roast chicken
- **Varieties NOT covered:** chicken stock, chicken stock cube (separate identities, not in WS0)

---

## PHASE 3 — CANONICAL DISPLAY AUDIT

### What is the report currently showing?

The report shows raw ingredient names after stripping quantities and prep words:

```
"Chicken Breasts"  → displayKey: "chicken breasts" → displayed as "Chicken Breasts"
"Chicken Legs"     → displayKey: "chicken legs"     → displayed as "Chicken Legs"
"Chicken Thighs"   → displayKey: "chicken thighs"   → displayed as "Chicken Thighs"
```

Each cut appears as a **separate row** in the Meat & Fish section.

### What SHOULD the report show?

**Option A — Raw ingredients (current behavior)**

| Row | Supports | Key Nutrients |
|---|---|---|
| Chicken Breasts | — | — |
| Chicken Legs | — | — |
| Chicken Thighs | — | — |

Problems: Three rows for one food. Nutrients blocked unless seed runs. Even after seeding, nutrients appear three times, once per row. Users learn nothing new from the repetition.

**Option B — Canonical foods**

| Row | Supports | Key Nutrients |
|---|---|---|
| Chicken | Muscle Recovery · Energy Support | Selenium · Vitamin B6 |
| *Types used: Breast, Legs, Thighs* | | |

Advantages: One row per food. Nutrients shown once. Forms used this week listed in the expanded row. Consistent with how the plant section handles variety (e.g., Tomatoes showing "cherry tomatoes, vine tomatoes" as forms). Cleaner for stories and reporting.

**Option C — Hybrid (nutritionally-driven merge)**

Merge when cuts are nutritionally equivalent; separate when nutrition differs materially.

| Food | Merge? | Reason |
|---|---|---|
| Chicken Breast → Chicken | YES | Same protein, selenium, B vitamins; minor fat variation |
| Chicken Leg → Chicken | YES | Slightly fattier than breast but same micronutrients |
| Chicken Thigh → Chicken | YES | Same as leg |
| Red Pepper (separate) | YES (keep separate) | Vastly different beta-carotene and vitamin C than other peppers |
| Yellow Pepper (separate) | YES (keep separate) | High vitamin C, lower beta-carotene than red |
| Green Pepper (separate) | YES (keep separate) | Lower in vitamin C than red/yellow; unripe variety |

In practice for chicken, Option C produces the same result as Option B: all cuts merge to "Chicken".

**Recommendation: Option B for chicken, with Option C principles applied to other foods.**

---

## PHASE 4 — VARIETY VS NUTRITION ANALYSIS

### Chicken cuts: merge or separate?

| Cut | Protein | Fat | Selenium | B Vitamins | Verdict |
|---|---|---|---|---|---|
| Chicken Breast | High | Low | High | High | |
| Chicken Leg | High | Medium | High | High | **MERGE** |
| Chicken Thigh | High | Medium | High | High | |
| Chicken Wing | High | Medium | High | High | |
| Chicken Drumstick | High | Medium | High | High | |

**Verdict: MERGE all to "Chicken".** The nutritional profile is functionally identical for the purpose of this report. Fat content varies slightly but all cuts contribute the same key micronutrients (selenium, vitamin B6, zinc, vitamin B12). No health story is meaningfully different across cuts.

### Peppers: merge or separate?

| Pepper | Vitamin C | Beta-carotene | Flavour | Verdict |
|---|---|---|---|---|
| Red Pepper | Very high | High | Sweet | |
| Yellow Pepper | Very high | Medium | Mild sweet | **KEEP SEPARATE** |
| Green Pepper | High | Low | Bitter/grassy | |

**Verdict: KEEP SEPARATE.** Red and yellow peppers have materially different beta-carotene levels. Green pepper is nutritionally distinct (it is an unripe fruit). These three should remain individual entries.

### Mushroom varieties: merge or separate?

| Mushroom | B Vitamins | Fibre | Bioactive Compounds | Verdict |
|---|---|---|---|---|
| White (Button) | Moderate | Moderate | Minimal | |
| Chestnut | Moderate | Moderate | Some polyphenols | **COULD MERGE** |
| Shiitake | Moderate | High | Beta-glucans, lentinan | |
| Portobello | Moderate | High | Some polyphenols | |
| Oyster | High | High | Beta-glucans | |

**Verdict: BORDERLINE.** Shiitake and oyster mushrooms have meaningfully higher bioactive compound content (beta-glucans) compared to white button mushrooms. However, for the purpose of this report, all mushrooms are in the same plant category, counted once each toward the 30 plants goal, and grouped under "Mushrooms" in the WS0 knowledge system. The current WS0 has separate slugs for each variety (white-mushrooms, chestnut-mushrooms, shiitake-mushrooms, oyster-mushrooms), which is architecturally sound. Leave separate for now; a diversityGroupSlug grouping approach (similar to how the canonical food catalogue uses diversity groups) could enable smart merging later.

### Apple varieties: merge or separate?

| Apple | Fibre | Flavonoids | Polyphenols | Glycaemic | Verdict |
|---|---|---|---|---|---|
| Braeburn | Moderate | Moderate | Moderate | Low | |
| Pink Lady | Moderate | Moderate | Moderate | Low | **MERGE** |
| Granny Smith | Moderate | High | High | Very low | |

**Verdict: MERGE to "Apple".** While Granny Smith has marginally higher polyphenols and a lower glycaemic index, the differences are not materially significant for a weekly food diversity report. The current WS0 has a single "apples" slug with generic variety aliases. The canonical food catalogue has a single "apple" entry. This is the right call.

### Potato varieties: merge or separate?

| Potato | Fibre | Potassium | Beta-carotene | GI | Verdict |
|---|---|---|---|---|---|
| White Potato | Moderate | High | None | High | |
| Sweet Potato | High | High | Very high | Medium | **KEEP SEPARATE** |
| New Potato | Moderate | Moderate | None | Lower than white | |

**Verdict: KEEP SEPARATE for white/sweet.** Sweet potato and white potato are nutritionally distinct. Sweet potato has significant beta-carotene (a different nutrient profile), higher fibre, and a lower glycaemic response. These must not be merged. New potato vs white potato could be considered a form, but both resolve to the single "potato" slug in WS0 which is acceptable.

---

## PHASE 5 — REPORT PURPOSE REVIEW

The route `/plant-diversity` renders `PlantDiversityReport.tsx`. Despite the name, the report displays ALL ingredients eaten in the week across five sections:

1. Plant Based (with 30 Plants tracker, category coverage grid)
2. Meat & Fish
3. Dairy
4. Eggs
5. Other Ingredients

**This is a combination report answering three questions simultaneously:**

**C. Food Diversity Report** — *How varied was my household diet?*  
The 30 Plants tracker and category coverage grid serve this purpose for plant foods. The non-plant sections show what else was eaten.

**B. Nutrition Report** — *What nutrients did my household receive?*  
The "Supports" and "Key Nutrients" columns serve this purpose, but only when WS0 data is present. Currently blocked for all non-plant and most protein foods.

**A. Weekly Food Report** — *What foods did my household eat?*  
The day/meal mapping (DaysCell, MealsCell, ExpandedDayMealList) serves this purpose for all rows.

**The report is strongest at C, partially delivers A, and currently fails at B for proteins.**

The ambition is appropriate. The execution is blocked by the unseeded WS0 data.

---

## PHASE 6 — USER EXPERIENCE REVIEW

### Current experience for chicken:

```
Meat & Fish   (3 rows)

Ingredient         Category     Supports   Key Nutrients   Days        Meals
Chicken Breasts    Meat & Fish  —          —               Monday      Chicken Marengo
Chicken Legs       Meat & Fish  —          —               Wednesday   Nutty Chicken Curry
Chicken Thighs     Meat & Fish  —          —               Wednesday   Nutty Chicken Curry
```

What the user learns: They ate chicken three times. Nothing else. The columns that should inform them about nutrients and health benefits are empty.

### Canonical experience for chicken (Option B):

```
Meat & Fish   (1 row)

Ingredient   Category     Supports                       Key Nutrients              Days   Meals
Chicken      Meat & Fish  Muscle Recovery · Energy       Selenium · Vitamin B6      Multi  2 meals

  ▼ Expanded:
  Forms eaten this week: Breasts, Legs, Thighs
  
  Meals:
    Monday:     Chicken Marengo
    Wednesday:  Nutty Chicken Curry
```

What the user learns: They ate chicken (one food, not three). They received selenium, vitamin B6, zinc, and vitamin B12 from it. It supports muscle recovery and energy. They ate it in two meals across two days, in three different cuts.

### Comparison on criteria:

| Criterion | Current | Canonical |
|---|---|---|
| Readability | Poor — three rows look like three foods | Better — one food, one row |
| User understanding | Misleading — implies diversity that doesn't exist | Accurate — chicken is one food eaten multiple ways |
| Future discovery | Weak — user doesn't learn about chicken's nutrition | Strong — nutrients visible, links to Pantry possible |
| Future stories | Very weak — "you ate chicken 3 times" is fragmented | Strong — "Chicken appeared in 2 meals this week" |
| Future seasonal reports | Not applicable (chicken is year-round) | Consistent canonical identity for cross-week comparison |
| Future wrapped-style reporting | Fragmented — chicken counts as 3 items | Clean — chicken counts as 1 item |

The canonical approach is significantly better on every criterion.

---

## PHASE 7 — FINAL RECOMMENDATION

### Q: Should the report display "Chicken Breasts" or "Chicken"?

**Answer: Chicken.**

Chicken Breasts, Chicken Legs, and Chicken Thighs are the same food prepared differently. They have the same key nutrients and the same health benefit profile. Showing them as three rows is misleading — it implies three distinct food identities when the user has eaten one food, one protein. It inflates the appearance of dietary variety. It fragments meal stories. It blocks nutrition insight.

The correct display is "Chicken" with the cuts eaten listed as forms in the expanded row.

---

### Q: If Chicken exists in WS0, why does Chicken Breasts display "Supports: —" and "Key Nutrients: —" today?

**Answer: Two independent failures.**

**Failure 1 — Database not seeded (immediate blocker)**

The WS0.8 expansion commit (`bad86ca`, 2026-06-21) added chicken to the editorial seed files:
- `shared/knowledge/foods.ts` — chicken food entity with 12 aliases
- `shared/knowledge/relationships.ts` — 4 nutrients, 2 benefits

After that commit, `npm run seed:knowledge` was **not run**. The live database remains at the pre-WS0.8 state of 69 foods. The `knowledge_foods` table has no row for slug "chicken".

Evidence:
```sql
SELECT COUNT(*) FROM knowledge_foods;  -- returns 69
SELECT slug FROM knowledge_foods WHERE slug = 'chicken';  -- 0 rows
```

The seed code has 188 foods. The DB has 69. Gap: 119 foods (chicken and all Wave 8 entities are missing).

Because chicken is not in the DB, `listFoods()` never returns it, `termToSlug` never contains "chicken breasts" → "chicken", and the ingredient-lookup API returns `{}` for all chicken queries.

**Failure 2 — Display key does not canonicalise cuts (secondary architectural gap)**

Even if the seed were run today, the **display label** in the report would still read "Chicken Breasts" (not "Chicken"), and there would still be three separate rows.

This is because the display key is computed client-side in `getDisplayKey()`:

```
"Chicken Breasts"
→ normaliseForReuse("Chicken Breasts")
→ stripForMatch("Chicken Breasts") = "chicken breasts"
→ resolveIngredientAlias("chicken breasts") = "chicken breasts"  ← no alias in ALIASES map
→ displayKey = "chicken breasts"
```

The `ingredient-aliases.ts` ALIASES map does not contain:
```
"chicken breasts" → "chicken"
"chicken legs"    → "chicken"
"chicken thighs"  → "chicken"
```

And there is no equivalent path that resolves these at display time. The WS0 alias system (in `foods.ts`) maps cuts to the chicken slug server-side for knowledge lookup, but this resolution does not propagate back to the client's display key.

**Result after seeding only (partial fix):**

```
Chicken Breasts    Meat & Fish    Muscle Recovery · Energy    Selenium · Vitamin B6
Chicken Legs       Meat & Fish    Muscle Recovery · Energy    Selenium · Vitamin B6
Chicken Thighs     Meat & Fish    Muscle Recovery · Energy    Selenium · Vitamin B6
```

Still three rows. Nutrients now filled in. Still not canonical.

**Result after seeding + canonical display (full fix):**

```
Chicken    Meat & Fish    Muscle Recovery · Energy    Selenium · Vitamin B6
  ▼ Forms: Breasts, Legs, Thighs
```

One row. Nutrients shown. Canonical identity correct.

---

## PHASE 8 — ADDITIONAL FINDINGS

### Chicken Stock and Chicken Stock Cube

These are not currently in WS0 and have no path to resolution:

```
"Chicken Stock"      → displayKey: "chicken stock"
                     → server lookup: no alias, no food entry
                     → Result: Supports: —, Key Nutrients: —

"Chicken Stock Cube" → displayKey: "chicken stock cube"
                     → server lookup: no alias, no food entry
                     → Result: Supports: —, Key Nutrients: —
```

Even after running the WS0.8 seed, these would remain unresolved. They are not listed in chicken's aliases in `foods.ts`. This is architecturally deliberate: chicken stock is a cooking liquid/condiment, not a protein food. Its nutrition profile (mainly sodium, small amounts of amino acids, some selenium) is distinct from chicken as a protein.

Chicken Stock and Chicken Stock Cube require dedicated WS0 entries if nutrition data is ever warranted. For a family meal planner, these are pantry flavouring agents, not protein sources — they likely belong in an "Other" category with a note about sodium content.

### Eggs are also missing

The same seeding gap affects eggs. The DB has no "eggs" slug. Meals containing eggs will also show `Supports: —` and `Key Nutrients: —`. The WS0.8 seed includes eggs with: vitamin D, vitamin B12, selenium, iodine, and benefits brain-health, energy-support, bone-health.

### The canonical food catalogue has chicken, but it's only used for plants

`shared/canonical/foods.ts` line 1944 defines chicken with aliases for "chicken breast", "chicken thigh", "chicken leg", "whole chicken", "chicken mince", "roast chicken". However, `buildRowVarietyDisplays` (which uses the canonical catalogue) is only called for plant-based rows in the report. Meat rows use `emptyVarietyMap`. The canonical catalogue's chicken definition is therefore unused in the current report rendering.

---

## DEFINITION OF DONE — VERIFICATION

| Requirement | Status |
|---|---|
| Chicken traced end-to-end | ✓ Complete |
| WS0 chicken verified | ✓ In code: YES. In DB: NO |
| Canonical resolution verified | ✓ Server-side alias works; display-side does not canonicalise |
| Alias resolution verified | ✓ ALIASES map missing chicken cut → chicken mappings |
| Display model evaluated | ✓ Option B (canonical) recommended |
| Variety vs nutrition analysed | ✓ Chicken cuts: MERGE. Peppers: SEPARATE. Sweet/white potato: SEPARATE |
| Report purpose clarified | ✓ Combination: Diversity + Nutrition + Weekly Food |
| Recommendation provided | ✓ Show "Chicken" not "Chicken Breasts" |

---

## SUGGESTIONS (future work only — not in scope of this investigation)

**SUGGESTION 1 — Run the WS0.8 seed**  
`npm run seed:knowledge` will bring the DB to 188 foods. This will fill in nutrients and benefits for chicken, eggs, beef, lamb, pork, turkey, duck, and all other Wave 8 proteins, plus dairy, grains, and pantry staples. This is an operational step, not a code change.

**SUGGESTION 2 — Canonical display for Meat section**  
Implement a client-side canonical collapse for the Meat & Fish section. The simplest approach: add `"chicken breasts" → "chicken"`, `"chicken legs" → "chicken"`, `"chicken thighs" → "chicken"`, etc. to `ingredient-aliases.ts`. This would cause `getDisplayKey()` to return "chicken" for all cuts, which would group them as one row and look up nutrients under the "chicken" key. Requires careful evaluation of what other cuts and variants need coverage.

**SUGGESTION 3 — WS0 as canonical display authority**  
A more principled alternative to Suggestion 2: the report's display key could be the WS0 canonical slug rather than the normalised ingredient string. This would require a two-pass approach: first look up the WS0 slug for each ingredient, then use that slug as the row identity. This aligns the display layer with the knowledge layer by design, but is a larger architectural change.

**SUGGESTION 4 — Add Chicken Stock and Chicken Stock Cube to WS0**  
These cooking liquids/condiments are common meal plan ingredients but have no knowledge entry. If nutrition guidance is wanted for them, they need dedicated entries. Given their primary function (flavouring rather than nutrition), a brief entry noting sodium content and trace protein would suffice.

**SUGGESTION 5 — Canonical food catalogue coverage for meat**  
Extend `buildRowVarietyDisplays` to cover meat rows, using the canonical food catalogue's chicken entry. This would allow the expanded row to list the cuts eaten ("breast", "leg", "thigh") as "forms used this week" — consistent with how plant varieties are shown.

**SUGGESTION 6 — Diversity group for chicken cuts**  
Add a `diversityGroupSlug` to the canonical chicken entry to allow future wrapped-style reporting to count chicken once regardless of cut, rather than separately.

---

## FILES READ DURING INVESTIGATION

| File | Purpose |
|---|---|
| `client/src/components/PlantDiversityReport.tsx` | Report component, display key computation, knowledge map lookup |
| `server/services/nutrition-knowledge-registry.ts` | `resolveIngredientsToKnowledgeSummary()` — server-side alias lookup |
| `shared/knowledge/foods.ts` | WS0 editorial food seed — chicken entry, aliases |
| `shared/knowledge/relationships.ts` | WS0 nutrient/benefit seed for chicken |
| `shared/knowledge/index.ts` | Seed expansion logic |
| `shared/knowledge/health-benefits.ts` | Confirmed muscle-recovery, energy-support exist |
| `shared/normalize.ts` | `normalizeIngredientKey()` — lowercase, strip punctuation |
| `client/src/lib/ingredient-reuse.ts` | `normaliseForReuse()` — strip units + resolve aliases |
| `shared/ingredient-aliases.ts` | ALIASES map — chicken cuts are NOT present |
| `server/routes.ts` lines 9486–9505 | `/api/knowledge/ingredient-lookup` endpoint |
| `shared/canonical/foods.ts` lines 1942–1956 | Canonical chicken entry — used only for plant rows |
| `server/seeds/seed-knowledge-registry.ts` | Seed runner — manual, not auto-run at startup |
| `server/index.ts` | App startup — does NOT run knowledge seed |
| `server/migrations/runner.ts` line 1368 | Migration note: "Seeded separately via npm run seed:knowledge" |

## DATABASE EVIDENCE

```sql
-- Foods in DB
SELECT COUNT(*) FROM knowledge_foods;            -- 69
SELECT COUNT(*) FROM knowledge_nutrients;        -- 30
SELECT COUNT(*) FROM knowledge_health_benefits;  -- 15
SELECT COUNT(*) FROM knowledge_food_nutrients;   -- 232
SELECT COUNT(*) FROM knowledge_food_benefits;    -- 192

-- Chicken specifically
SELECT slug FROM knowledge_foods WHERE slug = 'chicken';  -- 0 rows

-- Seed code counts (from shared/knowledge/foods.ts)
-- FOOD_SEED.length = 188  (119 foods missing from DB)
```
