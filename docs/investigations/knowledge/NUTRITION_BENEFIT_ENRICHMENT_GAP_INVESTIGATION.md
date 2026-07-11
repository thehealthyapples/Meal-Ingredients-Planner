# Nutrition Benefit Enrichment Gap Investigation

**Date:** 2026-06-11  
**Rollback tag:** `rollback/nutrition-enrichment-gap-investigation` → commit `1e83f32`  
**Status:** Investigation complete. No code changes made.

---

## Executive Summary

Some Nutrition Boost suggestions in `MealUpliftPanel` display **rich enrichment** (nutrient chips + benefit summary). Others display only **fallback text** (`suggestion.why`). The difference is determined by a single data lookup: whether the suggested ingredient has an entry in the **Nutrition Benefit Library** (`client/src/lib/nutrition-benefit-library.ts`).

The matching logic is functioning correctly. The gap is **missing data** — specifically, `Mixed Seeds` and `Apple Cider Vinegar` are absent from the Benefit Library entirely.

---

## Architecture: Unified Render Path

### FACT

`NutritionBoostPanel` (`client/src/components/NutritionBoostPanel.tsx`) exists as a file but is **not rendered anywhere** in the current UI. It is not imported into `weekly-planner-page.tsx`.

All visible boost suggestions — whether sourced from the server-side uplift engine or the deterministic BOOST_LIBRARY — flow through a single component: **`MealUpliftPanel`**.

### Render pipeline

```
Server-side uplift engine (uplift-rules.ts)
      ↓ API response → upliftByMealId (weekly-planner-page.tsx)
      
BOOST_LIBRARY (nutrition-boosts.ts)
      ↓ buildFallbackUpliftMatch() (weekly-planner-page.tsx)
      ↓ wraps as UpliftMatchResult with generic why text:
        "A nutritious {category} suggestion for this meal."
      
Both merged → mergedMatches → <MealUpliftPanel upliftMatches={mergedMatches} />

MealUpliftPanel renders each suggestion:
      ↓ const benefit = getNutritionBenefit(suggestion.ingredient)
      
      if benefit !== null  → RICH VIEW
        · benefit.keyNutrients (e.g. "Magnesium · Zinc · Plant Protein")
        · benefit.summary (e.g. "Rich in magnesium and zinc.")
        · HelpCircle button hidden
        
      if benefit === null  → FALLBACK VIEW
        · suggestion.why text
        · HelpCircle button shown (expands a generic message)
```

**Files:**
- `MealUpliftPanel.tsx:270` — `const benefit = getNutritionBenefit(suggestion.ingredient);`
- `MealUpliftPanel.tsx:291–315` — conditional render branch
- `weekly-planner-page.tsx:299–343` — `buildFallbackUpliftMatch()`
- `weekly-planner-page.tsx:3525–3559` — merge logic and `<MealUpliftPanel>` render

---

## How Enrichment Lookup Works

### FACT

`getNutritionBenefit(ingredient)` (`nutrition-benefit-library.ts:218`) does:

```
normaliseForReuse(ingredient)
  └─ stripForMatch()        — strips quantities, units, prep words ("fresh", "dried", "extra"…)
  └─ resolveIngredientAlias() — normalises via ALIASES map and normalizeIngredientKey()
      └─ normalizeIngredientKey() — lowercase, remove diacritics, remove punctuation, collapse spaces
```

The resulting key is looked up in `BENEFIT_MAP`, which is built once at module load from the 24-entry `LIBRARY` array using the same normalisation pipeline on each `b.name`.

### FACT: Known alias effects

| Library entry name       | Normalised key in BENEFIT_MAP |
|--------------------------|-------------------------------|
| `Flax Seeds`             | `flaxseed` (via alias)        |
| `Extra Virgin Olive Oil` | `olive oil` (via strip "extra" + alias "virgin olive oil") |
| All others               | lowercase of name             |

These aliases ensure suggestions like `"extra virgin olive oil"` or `"linseed"` still match their Benefit Library entries.

---

## Comparison: Four Example Ingredients

### Pumpkin Seeds

| Field | Value |
|---|---|
| Suggestion source | BOOST_LIBRARY fallback (`seeds` category) |
| Benefit Library entry | EXISTS (`name: "Pumpkin Seeds"`) |
| BENEFIT_MAP key | `"pumpkin seeds"` |
| Lookup input | `"Pumpkin Seeds"` → normalises to `"pumpkin seeds"` |
| Match result | **MATCH** |
| Enrichment shown | keyNutrients: `Magnesium · Zinc · Plant Protein`; summary: `"Rich in magnesium and zinc. Supports plant diversity."` |
| Fallback used | NO |
| Root cause of rich view | Entry exists in Benefit Library; name normalises identically |

### Chickpeas

| Field | Value |
|---|---|
| Suggestion source | BOOST_LIBRARY fallback (`legumes` category) |
| Benefit Library entry | EXISTS (`name: "Chickpeas"`) |
| BENEFIT_MAP key | `"chickpeas"` |
| Lookup input | `"Chickpeas"` → normalises to `"chickpeas"` |
| Match result | **MATCH** |
| Enrichment shown | keyNutrients: `Plant Protein · Fibre · Folate`; summary: `"High in plant protein and fibre."` |
| Fallback used | NO |
| Root cause of rich view | Entry exists in Benefit Library |

### Mixed Seeds

| Field | Value |
|---|---|
| Suggestion source | Server uplift rules (4 rules: `salad-seeds-evoo-acv`, `salmon-seeds-leafy`, `buddha-bowl-seeds`, and omelette rule) |
| Benefit Library entry | **DOES NOT EXIST** |
| BENEFIT_MAP key | N/A |
| Lookup input | `"mixed seeds"` → normalises to `"mixed seeds"` |
| Match result | **NO MATCH** — `getNutritionBenefit` returns `null` |
| Fallback used | YES — shows `suggestion.why` from uplift rule |
| Example why texts | `"Adds healthy fats, plant protein, and a satisfying texture."` (salad rule), `"Adds healthy fats, minerals, and plant variety."` (buddha bowl rule) |
| Root cause of fallback | No entry for "mixed seeds" in Benefit Library |

### Apple Cider Vinegar

| Field | Value |
|---|---|
| Suggestion source | Server uplift rules (1 rule: `salad-seeds-evoo-acv`) |
| Benefit Library entry | **DOES NOT EXIST** |
| BENEFIT_MAP key | N/A |
| Lookup input | `"apple cider vinegar"` → normalises to `"apple cider vinegar"` |
| Match result | **NO MATCH** — `getNutritionBenefit` returns `null` |
| Fallback used | YES — shows `suggestion.why` from uplift rule |
| Why text | `"A tangy dressing base associated with supporting blood sugar balance after meals."` |
| Root cause of fallback | No entry for "apple cider vinegar" in Benefit Library |

---

## Output Matrix

| Suggestion | Benefit Library Entry Exists | Matched Correctly | Fallback Used | Root Cause |
|---|---|---|---|---|
| Pumpkin Seeds | YES | YES | NO | Data present; match succeeds |
| Chickpeas | YES | YES | NO | Data present; match succeeds |
| Mixed Seeds | **NO** | N/A | **YES** | Missing Benefit Library entry |
| Apple Cider Vinegar | **NO** | N/A | **YES** | Missing Benefit Library entry |

---

## Benefit Library Audit

### FACT: Full LIBRARY contents (24 entries)

| Entry name | Normalised BENEFIT_MAP key | Category |
|---|---|---|
| Pumpkin Seeds | `pumpkin seeds` | Seeds |
| Chia Seeds | `chia seeds` | Seeds |
| Flax Seeds | `flaxseed` | Seeds |
| Walnuts | `walnuts` | Nuts |
| Almonds | `almonds` | Nuts |
| Chickpeas | `chickpeas` | Legumes |
| Lentils | `lentils` | Legumes |
| Black Beans | `black beans` | Legumes |
| Mixed Beans | `mixed beans` | Legumes |
| Basil | `basil` | Herbs |
| Coriander | `coriander` | Herbs |
| Parsley | `parsley` | Herbs |
| Mint | `mint` | Herbs |
| Chestnut Mushrooms | `chestnut mushrooms` | Mushrooms |
| Mixed Mushrooms | `mixed mushrooms` | Mushrooms |
| Sauerkraut | `sauerkraut` | Fermented |
| Kimchi | `kimchi` | Fermented |
| Avocado | `avocado` | Healthy Fats |
| Extra Virgin Olive Oil | `olive oil` | Healthy Fats |
| Spinach | `spinach` | Leafy Greens |
| Kale | `kale` | Leafy Greens |
| Rocket | `rocket` | Leafy Greens |
| Grilled Tomatoes | `grilled tomatoes` | Extra Veg |
| Roasted Peppers | `roasted peppers` | Extra Veg |

`Mixed Seeds` — **ABSENT**.  
`Apple Cider Vinegar` — **ABSENT**.

### ASSUMPTION

The library was authored to match the BOOST_LIBRARY items in `nutrition-boosts.ts` (all 19 BOOST_LIBRARY items have Benefit Library counterparts). Items that only appear in server-side uplift rules were not systematically added at the same time.

---

## Matching Audit

### FACT: The matching code is not at fault

The `normaliseForReuse` → BENEFIT_MAP lookup path is consistent between:
- How BENEFIT_MAP keys are built (same function applied to `b.name`)
- How lookups are performed (same function applied to `suggestion.ingredient`)

For items that ARE in the library, the lookup succeeds reliably, including edge cases via aliases (Extra Virgin Olive Oil → olive oil, Flax Seeds → flaxseed).

### FACT: Uplift rule ingredients vs Benefit Library coverage

All unique ingredient names from `uplift-rules.ts` were checked against BENEFIT_MAP. Only 4 match:

| Uplift rule ingredient | Normalised key | Match |
|---|---|---|
| `chia seeds` | `chia seeds` | YES |
| `extra virgin olive oil` | `olive oil` (via alias) | YES |
| `rocket` | `rocket` | YES |
| `spinach` | `spinach` | YES |

All other uplift rule ingredients (including `mixed seeds`, `apple cider vinegar`, `red lentils`, `sauerkraut or kimchi`, `baked beans`, `wholemeal pasta`, etc.) do not match any Benefit Library entry and fall back to `suggestion.why` text.

### FACT: Compound ingredient names in uplift rules cause no-match by design

Several uplift rule ingredients use "or" constructs (e.g., `"sauerkraut or kimchi"`, `"spinach or rocket"`). These normalise to compound strings that don't match any single library entry, even when each part individually would match. This is a separate, broader issue not scoped to this investigation.

### FACT: `red lentils` edge case

The Benefit Library has `"Lentils"` (BENEFIT_MAP key: `"lentils"`). The uplift rules suggest `"red lentils"`. There is no alias `"red lentils"` → `"lentils"` in `shared/ingredient-aliases.ts`. Result: `"red lentils"` normalises to `"red lentils"` → no match → fallback. This is a separate gap but follows the same pattern.

---

## Why Some Boosts Are Rich, Others Are Not

**FACT:** The Benefit Library (`nutrition-benefit-library.ts`) was built to match the BOOST_LIBRARY items in `nutrition-boosts.ts`. Every item in the BOOST_LIBRARY has a corresponding Benefit Library entry (either directly or via alias). These suggestions all reach `MealUpliftPanel` via `buildFallbackUpliftMatch()` and receive rich enrichment.

The server-side uplift engine (`uplift-rules.ts`) independently suggests ingredients not present in the BOOST_LIBRARY — including `mixed seeds` and `apple cider vinegar`. No corresponding Benefit Library entries were created for these. When they appear in `MealUpliftPanel`, the lookup returns null and the `suggestion.why` text is rendered instead.

---

## Answers to Investigation Questions

**1. Why do some boosts have rich enrichment?**  
FACT: They are in the Benefit Library. When `getNutritionBenefit(ingredient)` returns non-null, `MealUpliftPanel` renders keyNutrients + summary.

**2. Why do some boosts not have rich enrichment?**  
FACT: They are absent from the Benefit Library. `getNutritionBenefit` returns null and the component falls back to `suggestion.why` text.

**3. Is this missing data or a matching failure?**  
FACT: Missing data. The matching pipeline is correct. No entry → no match → fallback. Adding entries would immediately enable rich view without any code change.

**4. Exact remediation options**

| Option | Scope | What it fixes |
|---|---|---|
| Add `Mixed Seeds` entry to `nutrition-benefit-library.ts` | Data only | Mixed Seeds shows rich view everywhere it is suggested |
| Add `Apple Cider Vinegar` entry to `nutrition-benefit-library.ts` | Data only | Apple Cider Vinegar shows rich view |
| Add `red lentils` → `lentils` alias in `shared/ingredient-aliases.ts` | Alias only | Red Lentils suggestions match the existing Lentils entry |
| Systematically audit all uplift rule ingredients and add Benefit Library entries for high-value ones | Data only | Broader coverage across the uplift engine |
| Split compound `"sauerkraut or kimchi"` suggestions into separate suggestions in uplift-rules.ts | Uplift rules | Enables Sauerkraut and Kimchi entries to match |

None of these options require changes to the matching logic.

---

## Trust Classification

| Statement | Type |
|---|---|
| NutritionBoostPanel is not rendered in weekly-planner-page.tsx | FACT |
| buildFallbackUpliftMatch() converts BOOST_LIBRARY items to UpliftMatchResult | FACT |
| All suggestions flow through MealUpliftPanel | FACT |
| MealUpliftPanel calls getNutritionBenefit(suggestion.ingredient) | FACT |
| Rich view is shown when benefit !== null, fallback when null | FACT |
| Mixed Seeds has no Benefit Library entry | FACT |
| Apple Cider Vinegar has no Benefit Library entry | FACT |
| The normalisation pipeline works correctly for existing entries | FACT |
| Only 4 of ~50 unique uplift rule ingredients match the Benefit Library | FACT |
| The Benefit Library was originally authored to match BOOST_LIBRARY | ASSUMPTION (inferred from 100% alignment between the two) |
| Adding entries would immediately enable rich view without code changes | FACT (the lookup is already in place; the data gap is all that prevents it) |
