# PANTRY KNOWLEDGE POPULATION INVESTIGATION

**Date:** 2026-06-23  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Rollback tag:** `investigation/pantry-knowledge-population-20260623` (HEAD = f531216)

---

## ROLLBACK PROTECTION

Tag created before investigation began:

```
investigation/pantry-knowledge-population-20260623 → f531216
```

To restore: `git checkout investigation/pantry-knowledge-population-20260623`

**Note:** git status at time of tag was NOT clean. Modified files:
- `client/src/components/PantryKnowledgeHub.tsx` (unstaged)
- `server/routes.ts` (unstaged)

Those modifications are preserved by their existence in the working tree. The tag points to the last committed state (f531216).

---

## SYMPTOM

The Plant Diversity Report (at `/plant-diversity`) shows the following for Chicken-based ingredients found in week meals:

| Ingredient          | Supports | Key Nutrients |
|---------------------|----------|---------------|
| Chicken Breasts     | —        | —             |
| Chicken Legs        | —        | —             |
| Chicken Stock       | —        | —             |
| Chicken Stock Cube  | —        | —             |

The same pattern affects ALL meat, dairy, egg, and most other non-plant ingredients in the report.

---

## SYSTEM ARCHITECTURE — THREE PARALLEL KNOWLEDGE SOURCES

This is the most important finding. The codebase contains **three separate, disconnected knowledge systems**, each powering different UI surfaces.

### Source 1 — `nutrition-benefit-library.ts` (frontend static)

**File:** `client/src/lib/nutrition-benefit-library.ts`  
**Used by:** `PlantDiversityReport.tsx` — the "Supports" and "Key Nutrients" table columns  
**Coverage:** 24 unique plant-focused foods (boost ingredients only)  
**Format:** `{ name, category, keyNutrients: string[], summary: string }`  
**Chicken entries:** ZERO

Foods covered:
- Seeds: Pumpkin Seeds, Chia Seeds, Flax Seeds
- Nuts: Walnuts, Almonds
- Legumes: Chickpeas, Lentils, Black Beans, Mixed Beans
- Herbs: Basil, Coriander, Parsley, Mint
- Mushrooms: Chestnut Mushrooms, Mixed Mushrooms
- Fermented: Sauerkraut, Kimchi
- Healthy Fats: Avocado, Extra Virgin Olive Oil
- Leafy Greens/Veg: Spinach, Kale, Rocket, Grilled Tomatoes, Roasted Peppers

### Source 2 — `pantry-knowledge.ts` (frontend static)

**File:** `client/src/lib/pantry-knowledge.ts`  
**Used by:** `pantry-page.tsx` FoodPantrySection — the expandable inline details on pantry inventory items  
**Coverage:** ~40 foods (olive oil, spices, legumes, salmon, eggs, etc.)  
**Format:** `{ supports: string[], highlights?, whyItMatters, goodToKnow?, howToChoose?, tags }`  
**Chicken entries:** ZERO

Labels used in UI: "Supports", "Highlights", "Why it matters", "Good to know", "How to choose"  
Note: NO "Key Nutrients" label in this surface. If knowledge is missing, shows "No additional info available yet." — not "—".

### Source 3 — WS0 Knowledge Registry (database-backed)

**Files:** `shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`  
**Used by:** `PantryKnowledgeHub.tsx` (Explore mode) via `/api/knowledge/foods/:slug`  
**Coverage:** 188 foods with 188 benefit entries and 188 nutrient entries  
**Format:** DB tables `knowledge_foods`, `knowledge_food_benefits`, `knowledge_food_nutrients`

Chicken in WS0:
- Slug: `chicken`
- Name: `Chicken`
- Aliases: `["chicken breast", "chicken thigh", "chicken leg", "whole chicken", "roast chicken"]`
- Nutrients: `["selenium", "vitamin-b6", "zinc", "vitamin-b12"]`
- Benefits: `["muscle-recovery", "energy-support"]`
- **No slug** for: `chicken-breasts`, `chicken-legs`, `chicken-stock`, `chicken-stock-cube`

---

## QUESTION 1 — DOES KNOWLEDGE EXIST?

### Chicken Breasts

| System | Entry | Data |
|--------|-------|------|
| Source 1 — nutrition-benefit-library.ts | ❌ NONE | — |
| Source 2 — pantry-knowledge.ts | ❌ NONE | — |
| Source 3 — WS0 Registry | ✅ PARTIAL | Exists as alias "chicken breast" of slug "chicken". Nutrients: Selenium, Vitamin B6, Zinc, Vitamin B12. Benefits: Muscle Recovery, Energy Support. NOT accessible as slug "chicken-breasts". |

### Chicken Legs

| System | Entry | Data |
|--------|-------|------|
| Source 1 — nutrition-benefit-library.ts | ❌ NONE | — |
| Source 2 — pantry-knowledge.ts | ❌ NONE | — |
| Source 3 — WS0 Registry | ✅ PARTIAL | Exists as alias "chicken leg" of slug "chicken". Same nutrients/benefits as above. NOT accessible as slug "chicken-legs". |

### Chicken Stock

| System | Entry | Data |
|--------|-------|------|
| Source 1 — nutrition-benefit-library.ts | ❌ NONE | — |
| Source 2 — pantry-knowledge.ts | ❌ NONE | — |
| Source 3 — WS0 Registry | ❌ NONE | No slug, no alias. Completely absent. |

### Chicken Stock Cube

| System | Entry | Data |
|--------|-------|------|
| Source 1 — nutrition-benefit-library.ts | ❌ NONE | — |
| Source 2 — pantry-knowledge.ts | ❌ NONE | — |
| Source 3 — WS0 Registry | ❌ NONE | No slug, no alias. Completely absent. |

---

## QUESTION 2 — IS RENDERING FAILING?

**No.** Rendering is working correctly.

The Plant Diversity Report renders "—" when `row.benefitSummary` is null and `row.keyNutrients` is empty. Both conditions are correct given the lookup result.

**Trace** (`PlantDiversityReport.tsx` → `computeAllRows()`):

```
Raw ingredient: "Chicken Breasts"
         ↓
getDisplayKey() → strips EXTRA_UNIT_RE units → "Chicken Breasts"
         ↓
normaliseForReuse("Chicken Breasts") → "chicken breasts"
         ↓
getNutritionBenefit("chicken breasts") → normaliseForReuse lookup in BENEFIT_MAP
         ↓
BENEFIT_MAP has 24 keys, none matching "chicken breasts"
         ↓
return null
         ↓
keyNutrients = benefit?.keyNutrients ?? [] → []
benefitSummary = benefit?.summary ?? null → null
         ↓
ReportRow renders:
  Supports column: hasBenefitSummary=false → "—"  ✓ correct rendering
  Key Nutrients column: hasNutrients=false → "—"  ✓ correct rendering
```

The UI renders exactly what the data layer provides. Rendering is not the problem.

---

## QUESTION 3 — IS CANONICAL MAPPING FAILING?

**Yes, partially — but not a bug in the mapping logic. It is a missing bridge between systems.**

For the Plant Diversity Report:

```
Meal ingredient: "Chicken Breasts"
         ↓
getDisplayKey() → "chicken breasts"
         ↓
getNutritionBenefit("chicken breasts")
         ↓
BENEFIT_MAP lookup (Source 1 — nutrition-benefit-library.ts)
         ↓
No entry → null
         ↓
NEVER reaches WS0 Knowledge Registry (Source 3)
```

There is NO mapping in the Plant Diversity Report from ingredient strings → WS0 knowledge food slugs.

For the WS0 Knowledge Registry Explore hub, the mapping path exists but only for the "chicken" slug directly:

```
User searches "Chicken" in Explore mode
         ↓
/api/knowledge/foods → listFoods() → returns slug "chicken"
         ↓
/api/knowledge/foods/chicken → getFoodDetailView("chicken")
         ↓
Benefits: Muscle Recovery, Energy Support ✓
Nutrients: Selenium, Vitamin B6, Zinc, Vitamin B12 ✓
```

But this Explore path is:
1. A separate view (`/pantry?mode=explore`)
2. Not wired into the Plant Diversity Report
3. Requires the user to navigate to the WS0 food slug "chicken", not "chicken breasts"

For Chicken Stock / Chicken Stock Cube:
```
Meal ingredient: "Chicken Stock"
         ↓
getDisplayKey() → "chicken stock"
         ↓
getSectionForIngredient() → containsKeyword("chicken stock", "chicken") → TRUE → section = "meat"
         ↓
getNutritionBenefit("chicken stock") → null (not in any library)
         ↓
"chicken-stock" slug doesn't exist in WS0 Registry either
         ↓
No knowledge anywhere → "—" on all surfaces
```

---

## QUESTION 4 — HOW MANY FOODS ARE AFFECTED?

The Plant Diversity Report's "Supports" and "Key Nutrients" columns draw from `nutrition-benefit-library.ts` (Source 1). This library has exactly **24 unique foods**.

**Total structural knowledge:**

| System | Foods with Supports/Benefits | Foods with Key Nutrients |
|--------|------------------------------|--------------------------|
| Source 1 (PDR — nutrition-benefit-library) | 24 | 24 |
| Source 2 (Pantry inventory — pantry-knowledge) | ~40 | N/A (no Key Nutrients label) |
| Source 3 (Explore — WS0 Registry) | 188 | 188 |

**Coverage in the Plant Diversity Report for a typical week's meals:**

A typical week's meal plan may include 30–60 unique ingredients. Of those:
- Plant-based foods in the 24-item Source 1 library → Supports + Key Nutrients populated
- ALL meat (chicken, beef, lamb, pork, fish, etc.) → both "—"
- ALL dairy (milk, cheese, yogurt, cream, etc.) → both "—"
- ALL eggs → both "—"
- Most plant foods NOT in the 24-item library → both "—"
- Chicken Stock, Chicken Stock Cube → both "—" (no data anywhere)
- Chicken Breasts, Chicken Legs → both "—" in PDR (knowledge exists in WS0 but not connected)

**Rough structural estimate** (cannot be exact without runtime data):

The 24-item library covers roughly 10–15% of a typical week's diverse ingredient list. Approximately 85–90% of ingredients will show "—" for both columns in the Plant Diversity Report. This includes all meat, fish, dairy, and eggs, plus many vegetables, grains, condiments, and stock-type ingredients.

The Pantry Explore mode (WS0 registry, 188 foods) would populate knowledge for a much higher share of foods — but this data is not accessible from the Plant Diversity Report.

---

## QUESTION 5 — CONTENT PROBLEM OR CODE PROBLEM?

**D. Combination — content gap AND architectural disconnection.**

Evidence:

**Part A (Content gap):**
- `nutrition-benefit-library.ts` (Source 1, used by PDR) has 24 entries — all plant-based
- Chicken Stock and Chicken Stock Cube have NO entries in ANY knowledge source
- The small library was designed for "boost ingredients" in the Planner/Analyser, not for full food coverage

**Part B (Architectural disconnection):**
- WS0 Knowledge Registry (Source 3) was built in WS0–WS8 with 188 foods including chicken
- The Plant Diversity Report was built earlier and still uses the old Source 1 library
- No bridge exists between the PDR and the WS0 registry
- The PDR's `computeAllRows()` calls `getNutritionBenefit()` which only reads Source 1
- Even the WS0's FoodReport component (used in PDR expanded rows) is restricted to plant-based rows only (line ~681 in PlantDiversityReport.tsx: `{row.section === "plant-based" && <FoodReport ... />}`)

---

## MANDATORY TRACE

### Chicken Breasts — Full Stack Trace

```
DATABASE (WS0 Registry)
  knowledge_foods: slug="chicken", name="Chicken"
  knowledge_food_nutrients: chicken → [selenium, vitamin-b6, zinc, vitamin-b12]
  knowledge_food_benefits: chicken → [muscle-recovery, energy-support]
  Note: "chicken breast" IS an alias, but "chicken-breasts" is NOT a slug
         ↓ (NOT USED BY PLANT DIVERSITY REPORT)
         
CANONICAL MAPPING (Plant Diversity Report path)
  Raw: "Chicken Breasts"
  getDisplayKey() → normaliseForReuse() → "chicken breasts"
  getSectionForIngredient("chicken breasts") → "meat" (via MEAT_KEYWORDS.includes("chicken"))
  getNutritionBenefit("chicken breasts") → BENEFIT_MAP lookup → NOT FOUND → null
  BREAK POINT: The PDR never queries /api/knowledge/foods/:slug
         ↓
KNOWLEDGE LOOKUP
  nutrition-benefit-library.ts BENEFIT_MAP:
    Has 24 keys (pumpkin seeds, chia seeds, walnuts, etc.)
    "chicken breasts" → NOT PRESENT
    result: null
         ↓
API RESPONSE
  Plant Diversity Report is a pure-frontend computation — no API call for Supports/Key Nutrients
  computeAllRows() runs entirely client-side using static BENEFIT_MAP
  keyNutrients = [] (from null benefit)
  benefitSummary = null (from null benefit)
         ↓
UI DISPLAY
  ReportRow → hasBenefitSummary = false → Supports column: "—"
  ReportRow → hasNutrients = false → Key Nutrients column: "—"
  
WHERE THE CHAIN BREAKS: At the knowledge lookup step.
  getNutritionBenefit("chicken breasts") returns null because
  nutrition-benefit-library.ts does not contain any chicken entry.
  The WS0 knowledge (which does have chicken data) is never consulted.
```

### Chicken Stock — Full Stack Trace

```
DATABASE (WS0 Registry)
  knowledge_foods: No "chicken-stock" slug. Not an alias of any slug.
  → Does not exist.
         ↓
CANONICAL MAPPING (Plant Diversity Report path)
  Raw: "Chicken Stock" (or "chicken stock cube")
  getDisplayKey() → "chicken stock"
  getSectionForIngredient() → containsKeyword("chicken stock", "chicken") → "meat"
  getNutritionBenefit("chicken stock") → NOT FOUND → null
         ↓
KNOWLEDGE LOOKUP
  nutrition-benefit-library.ts → no chicken stock entry → null
  WS0 Registry → no chicken-stock slug → no data
  pantry-knowledge.ts → no chicken stock entry → null
         ↓
API RESPONSE
  No API call. Pure client-side. Returns null.
         ↓
UI DISPLAY
  Supports: "—"  
  Key Nutrients: "—"
  
WHERE THE CHAIN BREAKS: At the knowledge lookup step.
  "chicken stock" has no entry in ANY knowledge source.
  This is a total content gap.
```

### Chicken Stock Cube — Full Stack Trace

```
Identical path to Chicken Stock.
  getDisplayKey("Chicken Stock Cube") → "chicken stock cube"
  "cube" is NOT in EXTRA_UNIT_RE, so it is NOT stripped.
  normaliseForReuse("chicken stock cube") → "chicken stock cube"
  getNutritionBenefit("chicken stock cube") → null
  WS0 Registry → no "chicken-stock-cube" slug → no data
  
  Supports: "—" / Key Nutrients: "—"
  Total content gap.
```

---

## CONTENT COMPLETENESS AUDIT

### WS0 Knowledge Registry (Source 3 — the authoritative store)

| Metric | Count |
|--------|-------|
| Total knowledge foods | 188 |
| Foods with benefits (FOOD_BENEFITS entries) | 188 |
| Foods with nutrients (FOOD_NUTRIENTS entries) | 188 |
| Foods with both | 188 |
| Foods with neither | 0 |
| Coverage | 100% of seeded foods |

### nutrition-benefit-library.ts (Source 1 — used by Plant Diversity Report)

| Metric | Count |
|--------|-------|
| Total library foods | 24 |
| Foods with keyNutrients | 24 |
| Foods with summary (Supports) | 24 |
| Foods with both | 24 |
| Non-plant foods (meat, dairy, eggs) | 0 |
| Coverage of chicken products | 0% |
| Coverage of stock/stock cubes | 0% |

### pantry-knowledge.ts (Source 2 — used by Pantry inventory expand)

| Metric | Count |
|--------|-------|
| Total entries | ~40 |
| Entries with "supports" field | ~40 |
| Entries with "highlights" field | ~12 |
| Chicken entries | 0 |
| Stock/stock cube entries | 0 |

---

## LAUNCH IMPACT

**🟡 Important**

**Reasoning:**
- The Plant Diversity Report is a launched, promoted feature (accessible from the Pantry page and via `/plant-diversity`)
- Users see the Meat & Fish section with "Supports: —" and "Key Nutrients: —" for all chicken, beef, lamb, pork, fish items
- This is consistently blank for all non-plant foods — not just chicken
- It is visible, not hidden
- It does NOT crash, corrupt data, or block user journeys
- It does NOT affect the plant count (the primary metric of the PDR)
- The Explore mode (WS0 registry) DOES show correct data for chicken — the gap is specifically in the PDR table columns

It is not a launch blocker because:
- The plant count (the core feature) is correct
- The "—" is a neutral display (not misleading)
- The feature still works and delivers its core value

It IS important because:
- Meat & Fish is a prominent section of the PDR
- Users see "—" for the majority of their meat/fish ingredients (chicken, beef, etc.)
- It makes the system appear incomplete or not fully built
- The WS0 Knowledge Registry has already done the work to populate this data — it's simply not connected

---

## PATH TO GREEN

### If the issue is rendering

Not a rendering issue. No fix needed here.

### If the issue is knowledge population

For Chicken Stock, Chicken Stock Cube: they have NO entry in ANY knowledge source. They would need to be added to the WS0 Knowledge Registry.

Estimate:
- 2 new food entries required (chicken-stock, chicken-stock-cube)
- ~1 prompt to author and add them to `shared/knowledge/foods.ts` and `shared/knowledge/relationships.ts`
- Then re-seed the knowledge database
- Effort: Small (~30 minutes)

However, content-only is insufficient — see architectural fix below.

### If the issue is the architectural disconnection

The Plant Diversity Report uses `nutrition-benefit-library.ts` (24 foods, Source 1) instead of the WS0 Knowledge Registry (188 foods, Source 3). The fix is to bridge these systems.

**Option A — Wire PDR to WS0 Knowledge Registry directly**

Replace the `getNutritionBenefit(displayKey)` call in `computeAllRows()` with a WS0 registry lookup. This requires:
1. Converting the PDR's client-side computation to use the WS0 data (via API or pre-fetch)
2. Implementing a display-key → WS0 slug resolution (ingredient normalisation)
3. Estimate: 2–3 prompts, medium effort (~2–4 hours)
4. This would immediately populate Supports/Key Nutrients for all 188 WS0 foods including chicken, beef, lamb, etc.

**Option B — Expand nutrition-benefit-library.ts to cover meat/dairy/eggs**

Add chicken, beef, lamb, dairy entries etc. to `nutrition-benefit-library.ts`. This is a pure content expansion.
1. ~50–100 new library entries to cover common meal ingredients
2. ~3–5 prompts to author, review, and add
3. Effort: Medium (~4–8 hours for full coverage)
4. Disadvantage: Maintains duplicate of the WS0 Registry

**Option C — Use WS0 registry as the canonical source for PDR, fall back to Source 1**

Hybrid approach: query WS0 for Supports/Key Nutrients first; fall back to Source 1 for unmatched items.
- Cleanest long-term architecture
- Estimate: 2–4 prompts, medium effort (~3–5 hours)

**Recommendation (SUGGESTION):** Option A or C. The WS0 Registry is the authoritative knowledge store and already has 188 foods. Connecting the PDR to WS0 is the correct architectural path. The current Source 1 library was a prototype/bootstrap that was never intended to be the final PDR data source.

For Chicken Stock/Cube specifically: add them to the WS0 Registry regardless of which path is chosen (1 prompt).

---

## FINAL QUESTION — ROOT CAUSE FOR CHICKEN BREASTS / SUPPORTS: — / KEY NUTRIENTS: —

**D. Combination.**

Specifically:

**1. Architectural disconnection (applies to all four foods)**  
The Plant Diversity Report's "Supports" and "Key Nutrients" columns exclusively use `nutrition-benefit-library.ts` (Source 1). This library has 24 plant-focused entries. It is not connected to the WS0 Knowledge Registry (Source 3), which has 188 foods including chicken. There is no bridge or fallback.

**2. Missing content in Source 1 (applies to all four foods)**  
`nutrition-benefit-library.ts` has zero entries for any chicken product, any meat product, any dairy product, or any egg product. The PDR will therefore always show "—" for Supports and Key Nutrients for the entire Meat & Fish section.

**3. Missing content in all sources (applies to Chicken Stock and Chicken Stock Cube)**  
Chicken Stock and Chicken Stock Cube have no entry in any of the three knowledge systems (Source 1, Source 2, Source 3). They are completely absent from the knowledge base.

**4. WS0 data unreachable via PDR (applies to Chicken Breasts and Chicken Legs)**  
The WS0 Knowledge Registry DOES have data for "chicken" (slug: `chicken`, nutrients: Selenium, Vitamin B6, Zinc, Vitamin B12; benefits: Muscle Recovery, Energy Support). "chicken breast" and "chicken leg" are registered as aliases. However, this data cannot be accessed from the Plant Diversity Report because the PDR never queries the WS0 API — it computes everything client-side from Source 1.

**Evidence summary:**
- `nutrition-benefit-library.ts` → `BENEFIT_MAP.get("chicken breasts")` → undefined → null
- WS0 `FOOD_BENEFITS["chicken"]` → `["muscle-recovery", "energy-support"]` → exists but inaccessible from PDR
- WS0 `FOOD_NUTRIENTS["chicken"]` → `["selenium", "vitamin-b6", "zinc", "vitamin-b12"]` → exists but inaccessible
- `FOOD_BENEFITS["chicken-stock"]` → undefined (not in WS0)
- `FOOD_BENEFITS["chicken-stock-cube"]` → undefined (not in WS0)

---

## SCOPE LOCK CONFIRMATION

- ✅ Investigation only
- ✅ No fixes applied
- ✅ No data populated
- ✅ No UI changes
- ✅ No schema changes
- ✅ No code changes

All recommendations are listed as SUGGESTION above.
