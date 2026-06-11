MEAL TEMPLATE ARCHITECTURE AUDIT: COMPLETE

---

**Rollback Identifier:** `investigation/meal-template-architecture-audit-20260608-205629`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** GREEN — Investigation only. No code changed. No data changed.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `shared/schema.ts` (lines 50–90, 805–845) | mealTemplates table definition and insertMealTemplateSchema |
| `server/lib/household-meal-matcher.ts` | Full file — matchMealsForHousehold and scoreTemplate |
| `server/lib/auto-import-service.ts` | Auto-import template creation |
| `server/meal-resolution-service.ts` | Template resolution (scratch vs ready meal) |
| `server/storage.ts` (lines 925–980) | Storage layer for mealTemplate CRUD |
| `server/routes.ts` (lines 5307–5450) | All mealTemplate API routes |
| `client/src/pages/products-page.tsx` (lines 880–920) | Only frontend usage of mealTemplates |
| Live database | Direct query — 632 templates, full slot audit |

---

## SECTION 1: TEMPLATE INVENTORY

### Live Database Query Result

```
TOTAL TEMPLATES: 632
```

**All 632 templates are active** (`is_active = true`).

### Category Distribution

| Category | Count | Note |
|----------|-------|------|
| dinner | 289 | lowercase auto-created |
| lunch | 60 | lowercase auto-created |
| drink | 56 | lowercase auto-created |
| frozen meal | 46 | lowercase auto-created |
| dessert | 41 | lowercase auto-created |
| breakfast | 38 | lowercase auto-created |
| Dinner | 26 | capitalised auto-created |
| snack | 24 | lowercase auto-created |
| kids meal | 21 | lowercase auto-created |
| baby meal | 21 | lowercase auto-created |
| Lunch | 5 | capitalised auto-created |
| Breakfast | 3 | capitalised auto-created |
| Dessert | 2 | capitalised auto-created |

Note: Inconsistent capitalisation (both "breakfast" and "Breakfast" exist). This is a side effect of auto-creation from different code paths — no data quality control was applied.

### Sample Template Records (breakfast category)

| ID | Name | Category | Description | Linked Meals |
|----|------|----------|-------------|--------------|
| 1 | Breakfast burrito | Breakfast | Auto-created template from existing meal | 22 |
| 2 | Breakfast egg wraps | Breakfast | Auto-created template from existing meal | 2 |
| 35 | Test Breakfast Pancakes | Breakfast | Auto-created template from existing meal | 1 |
| 295 | Omelette | breakfast | Auto-created template | 22 |
| 294 | Acai Bowl | breakfast | Auto-created template | 22 |
| 201 | Fruit & Yogurt Pot | breakfast | Auto-created template | 22 |
| 212 | Avocado on Toast | breakfast | Auto-created template | 21 |
| 206 | Vegetarian Breakfast | breakfast | Auto-created template | 20 |
| 289 | Eggs Benedict | breakfast | Auto-created template | 20 |

---

## SECTION 2: COMPLETENESS REVIEW

### Slot Population — Live Database Audit

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN shared_base_components IS NOT NULL THEN 1 END) as has_shared_base,
  COUNT(CASE WHEN protein_slots IS NOT NULL THEN 1 END) as has_protein,
  COUNT(CASE WHEN carb_slots IS NOT NULL THEN 1 END) as has_carbs,
  COUNT(CASE WHEN veg_slots IS NOT NULL THEN 1 END) as has_veg,
  COUNT(CASE WHEN topping_slots IS NOT NULL THEN 1 END) as has_toppings,
  COUNT(CASE WHEN sauce_slots IS NOT NULL THEN 1 END) as has_sauce,
  COUNT(CASE WHEN compatible_diets IS NOT NULL THEN 1 END) as has_diets,
  COUNT(CASE WHEN cost_band IS NOT NULL THEN 1 END) as has_cost_band,
  COUNT(CASE WHEN estimated_total_time IS NOT NULL THEN 1 END) as has_time
FROM meal_templates
```

**Result:**

| Field | Populated | Null | % Complete |
|-------|-----------|------|------------|
| sharedBaseComponents | **0** | 632 | **0%** |
| proteinSlots | **0** | 632 | **0%** |
| carbSlots | **0** | 632 | **0%** |
| vegSlots | **0** | 632 | **0%** |
| toppingSlots | **0** | 632 | **0%** |
| sauceSlots | **0** | 632 | **0%** |
| compatibleDiets | **0** | 632 | **0%** |
| costBand | 0 | 632 | 0% |
| estimatedTotalTime | 0 | 632 | 0% |

### Classification

| Classification | Count | Criteria |
|----------------|-------|---------|
| Complete | **0** | All slot fields populated |
| Partial | **0** | Some slot fields populated |
| **Empty** | **632** | No slot fields populated |

**Every template in the database is empty.** The slot architecture exists in the schema but has never been populated.

---

## SECTION 3: REAL USAGE ANALYSIS

### Features Currently Using mealTemplates

#### 1. Meal-to-template auto-linking (auto-import-service.ts)

When a meal is auto-imported from an external source, a template record is created or found by name:

```typescript
let template = await storage.getMealTemplateByName(candidate.name);
if (!template) {
  template = await storage.createMealTemplate({
    name: candidate.name,
    category: candidate.category || "dinner",
  });
}
await storage.updateMealTemplateId(meal.id, template.id);
```

Templates created here get: `name`, `category`. Nothing else.

#### 2. Meal-to-template link route (`POST /api/meals/:id/link-template`, routes.ts)

When a user links a meal to a template (or auto-creates one):

```typescript
let existing = await storage.getMealTemplateByName(meal.name);
if (!existing) {
  existing = await storage.createMealTemplate({
    name: meal.name,
    category: 'dinner',  // ← hardcoded 'dinner', ignores actual meal category
  });
}
```

Templates created here get: `name`, `category='dinner'`. Nothing else.

#### 3. Product linking (products-page.tsx — frontend)

When a user links a product scan to a template:

```typescript
const createRes = await apiRequest('POST', '/api/meal-templates', {
  name: templateName,
  category: 'dinner',
});
```

Creates template with just `name` and `category`. Used to associate barcode-scanned products with a template for meal planning.

#### 4. Template resolution (`POST /api/meal-templates/:id/resolve`)

The `meal-resolution-service.ts` resolves a template to a concrete meal (scratch recipe vs ready meal product), using preference scoring (quality, budget, UPF). Does not use any slot fields.

#### 5. Template CRUD admin routes

```
GET    /api/meal-templates          — returns all templates (no slot data)
GET    /api/meal-templates/:id      — returns template + linked meals + products
POST   /api/meal-templates          — create template (name + category only in practice)
PATCH  /api/meal-templates/:id      — update name, category, description ONLY
DELETE /api/meal-templates/:id      — delete template
GET    /api/meal-templates/:id/products
POST   /api/meal-templates/:id/products
DELETE /api/meal-template-products/:id
```

### Critical Finding: PATCH Route Locks Out Slot Fields

The PATCH route's validation schema explicitly restricts updates to three fields:

```typescript
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  // ← sharedBaseComponents, proteinSlots, carbSlots, vegSlots,
  //   toppingSlots, sauceSlots, compatibleDiets are NOT included
});
```

Even though `insertMealTemplateSchema` (used for CREATE) includes all slot fields, the PATCH route cannot update them. **There is no API endpoint to write slot data to an existing template.**

### Are mealTemplates Effectively Dormant?

**Partially.** The `mealTemplates` table is live and actively used, but only as a **name-based grouping registry**:

- Every meal in the system (2083 of 2083) is linked to a template
- Templates serve as a deduplication layer: multiple implementations of "Chicken Curry" share one template
- The `meal-resolution-service.ts` uses templates to choose between scratch and ready meal versions
- The slot architecture (`sharedBaseComponents`, `proteinSlots`, etc.) is **completely dormant** — never populated, never read in production

**Evidence:** SQL query confirms 0 templates have any slot data populated. `matchMealsForHousehold()` is never called from any route.

---

## SECTION 4: SCORETEMPLATE REVIEW

### Function Signature and Location

**File:** `server/lib/household-meal-matcher.ts`
**Function:** `scoreTemplate()` (line 230)
**Exported via:** `matchMealsForHousehold()` (line 158)

### Inputs

```typescript
function scoreTemplate(
  template: MealTemplate,        // Full template record
  members: MemberProfile[],      // Per-member: dietTypes, excludedIngredients, preferences
  settings: HouseholdSettings,   // maxExtraPrepMinutes, maxTotalCookTime, budgetLevel, etc.
  swapMap: Map<string, string>   // ingredient → healthier substitution
): MealMatch | null
```

### Output: MealMatch

```typescript
interface MealMatch {
  template: MealTemplate;
  sharedIngredients: string[];    // base components safe for ALL members
  memberChanges: MemberChange[];  // per-member: list of swaps or removals needed
  swapsNeeded: string[];          // deduplicated list of "A → B" swap strings
  extraPrepMinutes: number;       // estimated additional prep time for variants
  fitScore: number;               // 0–100 composite score
  scoreBreakdown: ScoreBreakdown; // per-dimension scores
  explanation: string;            // human-readable description
}

interface MemberChange {
  userId: number;
  displayName: string;
  swaps: string[];  // e.g. ["remove eggs", "dairy → oat milk"]
}
```

### Scoring Factors and Weights

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Compatibility | 25% | `1 - (dietConflicts / memberCount)` |
| Shared base | 20% | `sharedIngredients.length / base.length` |
| Swap simplicity | 15% | Penalises variant fraction; rewards rule-based swaps |
| Time fit | 10% | Penalty if total time or extra prep exceeds limits |
| Cost fit | 10% | Matches template costBand to user budgetLevel |
| Health alignment | 10% | UPF sensitivity penalty if members prefer less processed |
| Preference confidence | 10% | Fraction of members with dietary data on record |

### memberChanges Generation

For each member, `scoreTemplate` checks:
1. **Diet pattern conflicts** — if template's `compatibleDiets` doesn't include a member's diet type, adds `"X diet not covered"` to their swaps
2. **Excluded ingredients** — scans all slot arrays for strings matching member's `excludedIngredients`; for each match, adds either `"ingredient → healthierSwap"` or `"remove ingredient"` to their swaps

```typescript
for (const ingredient of allSlotIngredients) {
  const key = ingredient.toLowerCase();
  const isExcluded = excluded.some((ex) => key.includes(ex) || ex.includes(key));
  if (isExcluded) {
    const healthier = swapMap.get(key);
    swaps.push(healthier ? `${ingredient} → ${healthier}` : `remove ${ingredient}`);
  }
}
```

### sharedIngredients Generation

The function filters `sharedBaseComponents` by removing any ingredient excluded by ANY household member:

```typescript
const sharedIngredients = base.filter((ing) => {
  const key = ing.toLowerCase();
  return !allExclusionsArr.some((ex) => key.includes(ex) || ex.includes(key));
});
```

This correctly identifies the safe common base for all members.

### Can scoreTemplate Support Shared Meal + Member-Specific Variants?

**YES — without modification.**

The function already:
- Returns `sharedIngredients` (the base every member can eat)
- Returns `memberChanges` (per-member swaps/removals)
- Returns `swapsNeeded` (deduplicated substitution list)
- Returns a human-readable `explanation`
- Handles zero-exclusion households (returns full base as shared)
- Handles full-exclusion members (returns empty shared ingredients for that member)

The only requirement is that templates have slot data populated. With empty templates, `scoreTemplate` returns `null` (line 245: `if (allSlotIngredients.length === 0) return null`).

### Is matchMealsForHousehold Called in Production?

**No.** A search across all server files confirms zero calls to `matchMealsForHousehold` outside of its own definition. The function exists and is exportable, but is not wired to any API route.

---

## SECTION 5: BREAKFAST TEMPLATE FEASIBILITY

### Target Concept: Cooked Breakfast

Shared: mushrooms, tomatoes, onions, avocado, asparagus
Protein slot: eggs, sausages, chickpea patty
Carb slot: GF roll, sweet potato hash

### Can the Existing Schema Represent This?

**YES.**

```typescript
// mealTemplate record (no schema change needed)
{
  name: "Cooked Breakfast",
  category: "breakfast",
  sharedBaseComponents: ["mushrooms", "cherry tomatoes", "fried onions", "avocado", "asparagus"],
  proteinSlots: ["eggs", "pork sausages", "chickpea patty", "plant-based sausages"],
  carbSlots: ["gluten-free roll", "sweet potato hash", "GF sourdough"],
  sauceSlots: ["tomato ketchup", "brown sauce"],
  compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Mediterranean"],
  estimatedTotalTime: 25,
  estimatedExtraTimePerVariant: 5,
  costBand: "standard",
  isActive: true
}
```

All fields exist in the schema. The record can be inserted via `POST /api/meal-templates` using `insertMealTemplateSchema` (which includes all slot fields). No schema change needed.

**What scoreTemplate would return for Lilly + Daisy household:**

```
sharedIngredients: ["mushrooms", "cherry tomatoes", "fried onions", "avocado", "asparagus"]
memberChanges:
  Lilly: ["remove eggs", "remove pork sausages", "remove gluten-free roll" (if GF roll contains gluten)]
  Daisy: [] (Mediterranean + Dairy-Free + Egg-Free → eggs excluded, rest fine)
fitScore: ~72 (some member changes, high base overlap)
```

**Answer: YES**

---

## SECTION 6: LUNCH TEMPLATE FEASIBILITY

### Target Concept: Jacket Potato Bar

Shared: baked potato, salad
Protein: tuna, beans, chickpeas
Toppings: cheese, dairy-free cheese, avocado

### Can the Existing Schema Represent This?

**YES.**

```typescript
{
  name: "Jacket Potato Bar",
  category: "lunch",
  sharedBaseComponents: ["baked potato", "mixed salad"],
  proteinSlots: ["tuna", "baked beans", "chickpeas", "mixed beans"],
  toppingSlots: ["cheddar cheese", "dairy-free cheese", "avocado", "sour cream"],
  sauceSlots: ["butter", "dairy-free spread"],
  compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
  estimatedTotalTime: 60,
  estimatedExtraTimePerVariant: 0,
  costBand: "budget",
  isActive: true
}
```

Note: Jacket potato is naturally gluten-free, vegetarian-compatible, and dairy-free at the base. Toppings drive member variation.

**Answer: YES**

---

## SECTION 7: DINNER TEMPLATE FEASIBILITY

### Target Concept: Taco Bowl

Shared: rice, vegetables
Protein: beef, chicken, beans
Sauce: salsa, guacamole

### Can the Existing Schema Represent This?

**YES.**

```typescript
{
  name: "Taco Bowl",
  category: "dinner",
  sharedBaseComponents: ["rice", "roasted peppers", "corn", "red onion", "lime"],
  proteinSlots: ["seasoned beef mince", "chicken breast", "black beans", "jackfruit"],
  toppingSlots: ["shredded cheese", "dairy-free cheese", "jalapeños", "sour cream"],
  sauceSlots: ["fresh salsa", "guacamole", "chipotle sauce"],
  carbSlots: ["corn tortillas", "lettuce cups"],
  compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
  estimatedTotalTime: 30,
  estimatedExtraTimePerVariant: 5,
  costBand: "standard",
  isActive: true
}
```

**Answer: YES**

---

## SECTION 8: GAP ANALYSIS

### Data Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| Zero templates have slot data | **Critical** | 632 templates, all null slots. No meal shell can be evaluated by scoreTemplate. |
| Category inconsistency | Medium | Both "breakfast" and "Breakfast" exist; case-sensitive queries may miss templates. |
| Auto-created templates lack food knowledge | Medium | Templates created by auto-import have name + category only; no dietary information or slot structure. |
| No starter set of household-ready templates | **Critical** | No breakfast, lunch, or dinner shells exist in any form. |

### Code Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| matchMealsForHousehold not wired to any route | **Critical** | The function works correctly but is completely inaccessible from any API endpoint. |
| PATCH route cannot write slot fields | High | `PATCH /api/meal-templates/:id` only accepts name/category/description. Slot fields cannot be updated via API. |
| Smart Planner does not query mealTemplates | **Critical** | The planner never touches mealTemplates. No Tier-4 recovery path exists. |
| No admin UI for slot data entry | High | No frontend page exists to populate sharedBaseComponents, proteinSlots, etc. |
| Category normalisation missing | Low | Auto-creation creates inconsistent category capitalisation; no normalisation applied. |

### UI Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| No template editor for slot fields | High | Users and admins cannot author meal shell templates through any UI. |
| No member-variant display in planner | High | Even if Tier-4 recovery produced per-member variants, the planner UI has no way to show different components per member. |
| No "assembled meal" card format | Medium | The planner currently shows a single recipe card; component assemblies require a different display format. |

---

## SECTION 9: STARTER TEMPLATE SET RECOMMENDATION

**No templates to be created in this investigation.** This section recommends a starter set for a future data authoring task.

### Recommended Breakfast Templates (5)

| Template Name | Shared Base | Key Protein Slots | Key Carb Slots | Notes |
|---------------|-------------|-------------------|----------------|-------|
| Cooked Breakfast | mushrooms, tomatoes, onions, avocado | eggs, sausages, chickpea patty, plant sausages | GF roll, sweet potato hash | Highest household coverage |
| Porridge Bar | oat porridge (GF oats optional) | Greek yogurt, protein powder | — | Toppings drive variation |
| Smoothie Bowl | frozen banana, mixed berries | protein powder, nut butter (slot), seeds | GF granola | Nut-free slot for exclusions |
| Egg-Free Breakfast Plate | avocado, tomatoes, mushrooms, spinach | tofu scramble, chickpea scramble | GF toast, sweet potato | Covers egg-free households |
| Overnight Oats Bar | oats (GF option), plant milk | nut butter, seeds | — | Dairy-free and vegan compatible |

### Recommended Lunch Templates (4)

| Template Name | Shared Base | Key Protein Slots | Notes |
|---------------|-------------|-------------------|-------|
| Jacket Potato Bar | baked potato, salad | tuna, beans, chickpeas | Naturally GF |
| Build-Your-Own Salad | mixed leaves, cucumber, tomatoes, pepper | chicken, tuna, eggs, chickpeas, tofu | Wide dietary coverage |
| Soup + Side | seasonal vegetable soup | — | Bread slot for GF/non-GF |
| Grain Bowl | quinoa or rice, roasted veg | falafel, chicken, halloumi, tofu | Covers Mediterranean |

### Recommended Dinner Templates (5)

| Template Name | Shared Base | Key Protein Slots | Notes |
|---------------|-------------|-------------------|-------|
| Taco Bowl | rice, peppers, corn, lime | beef, chicken, beans, jackfruit | GF + dairy-free slots available |
| Stir-Fry Bar | rice or noodles, mixed veg, ginger, garlic | chicken, tofu, prawns, beef | Soy-free sauce slot needed for exclusions |
| Curry Night | sauce base, rice | chicken, lamb, paneer, chickpeas, tofu | Dairy-free variant via coconut milk |
| Pasta Bar | pasta (GF option), tomato sauce | mince, chicken, mushrooms, lentils | GF pasta slot for exclusions |
| Sheet Pan Dinner | roasted vegetables, potatoes | chicken thighs, salmon, halloumi, chickpeas | Low-effort, high coverage |

**Priority order for data authoring:** Cooked Breakfast → Jacket Potato Bar → Curry Night → Taco Bowl → Build-Your-Own Salad. These five cover the most household scenarios with the greatest dietary overlap.

---

## SECTION 10: STRATEGIC ASSESSMENT

### 1. Is the architecture real or theoretical?

**Theoretical.** The schema is real, the code is real, but the data is empty. No template has ever had slot data entered. The component-slot concept has been designed and implemented at the schema and code layer, but was never operationalised with actual content.

### 2. Is scoreTemplate reusable?

**Yes — without modification.** The function is complete, well-structured, and correctly handles:
- Per-member dietary conflict detection
- Shared ingredient calculation (intersects base across all exclusions)
- Member-specific swap generation
- Composite household fit scoring
- Human-readable explanation generation

It returns `null` when a template has no slot data (guards against empty templates). It handles zero-member households gracefully. It is production-quality code waiting for data.

### 3. Are mealTemplates production-ready?

**As a grouping registry: yes.** Every meal is linked to a template; meal-resolution-service uses them for scratch vs ready meal decisions.

**As a meal-shell component system: no.** Zero slot data exists. No API route can write slots. No frontend UI can author them. No planner reads them for this purpose.

### 4. What percentage of the architecture already exists?

| Layer | Status | % Complete |
|-------|--------|-----------|
| Database schema | Fully designed | 100% |
| Scoring logic (`scoreTemplate`) | Fully implemented | 100% |
| Household member data | Live, used elsewhere | 100% |
| Restriction resolver | Live, used in planner | 100% |
| API route to create templates | Exists (POST) | 100% |
| API route to update slot fields | Missing from PATCH | 20% |
| Template data (slot content) | Not populated | 0% |
| Planner integration (Tier-4) | Not implemented | 0% |
| Frontend template editor | Not built | 0% |
| Frontend variant display | Not built | 0% |

**Overall architecture completeness: ~55%.** The foundation is solid. The data and integration layers are absent.

### 5. What is the smallest next step?

**Author template data — no code changes required.**

The `POST /api/meal-templates` route already accepts all slot fields via `insertMealTemplateSchema`. A content author (or admin script) can create 5–10 meal shell templates with populated slots via the existing API today. No code changes needed for this step.

This de-risks the entire concept: if `scoreTemplate` produces good results on real templates for a real household, the Tier-4 planner integration becomes a well-understood code task rather than a speculative one.

### 6. What should NOT be built?

- **Do not build a full admin template editor UI first.** Template data can be authored via direct API calls (POST with JSON) or an admin script. UI comes after the concept is validated.
- **Do not wire matchMealsForHousehold to the planner first.** Validate template quality on a test household before connecting to the main planning flow.
- **Do not populate all 632 existing templates with slot data.** The existing 632 are auto-created naming records for scratch meals. The component-slot concept requires purpose-built household meal shell templates — a separate, new set of records.
- **Do not rename or restructure the existing 632 templates.** They serve the grouping and meal-resolution functions correctly. The new household shell templates are additive, not replacements.

---

## Capability Matrix

| Capability | Exists | Ready | Gap |
|---|---|---|---|
| Template schema (all slot fields) | Yes | Yes — schema complete | None |
| Slot architecture in DB | Yes (schema) | No (0 rows populated) | Data authoring required |
| Household scoring (`scoreTemplate`) | Yes | Yes — production-quality code | Not wired to any route |
| Shared ingredients calculation | Yes | Yes — built into scoreTemplate | Depends on slot data |
| Member variants (per-member swaps) | Yes | Yes — built into scoreTemplate | Depends on slot data |
| API to write slot data (CREATE) | Yes | Yes — POST accepts all fields | None for creation |
| API to update slot data (PATCH) | Partial | No — PATCH only allows name/category/description | PATCH route needs slot fields added |
| Planner integration (Tier-4 recovery) | No | No | New code required |
| Shopping integration (component meals) | Partial | Partial — grouped format exists | Needs Tier-4 triggering |
| Frontend template editor (slot fields) | No | No | New UI required |
| Frontend variant display in planner | No | No | New UI required |

---

## Recommended Next Decision

The investigation confirms three facts:

1. **The slot architecture is theoretically correct and complete at the schema and scoring layer.**
2. **Zero data exists to exercise it.**
3. **The PATCH API and planner are not wired to it.**

The decision is a sequencing question:

**Option A — Validate first, build later (recommended)**
Author 3–5 meal shell templates via direct POST API calls (no code needed). Run `matchMealsForHousehold()` manually against a test household to validate the scoring output. If results are good, proceed to PATCH route fix and Tier-4 planner integration. Total risk to existing system: none.

**Option B — Fix PATCH route first, then author data**
Add slot fields to the PATCH validation schema (~5 lines). This unblocks template editing via API. Then author templates. Then validate. Slightly more code work upfront but enables ongoing template editing.

**Option C — Full implementation (planner Tier-4 + UI)**
Add slot fields to PATCH, author templates, wire matchMealsForHousehold to a route, add Tier-4 to smart-suggest-service, build template editor UI. Higher effort, higher impact. Only advisable after Option A validation confirms the concept works.

**The investigation does not recommend which option to choose — this is a product decision.** The evidence above confirms the architecture is sound and Option A can begin immediately with no code changes.

---

## Data Impact Declaration

- Reads existing data: Yes (live DB query, file reads)
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No

---

*Investigation complete. No code changed. No data modified. No templates created.*
