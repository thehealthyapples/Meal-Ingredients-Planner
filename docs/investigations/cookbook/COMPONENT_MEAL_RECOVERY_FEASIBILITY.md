COMPONENT MEAL RECOVERY FEASIBILITY: COMPLETE

---

**Rollback Identifier:** `investigation/component-meal-recovery-feasibility-20260608-202921`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** AMBER — Investigation only. No code changed.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Full database schema — meals, mealTemplates, pantry, shopping, swaps |
| `server/lib/smart-suggest-service.ts` | Smart Planner engine — candidate pool, tier fallbacks |
| `server/lib/household-meal-matcher.ts` | Household template scoring — slot-based member adaptation |
| `server/lib/dietRules.ts` | Dietary restriction hard filter engine |
| `server/lib/recipe-swap-engine.ts` | Ingredient swap logic |
| `server/routes.ts` (lines 4359–4386) | Grouped meal format + component ingredient aggregation |
| `server/routes.ts` (lines 4860–4890) | Candidate pool gate — active component exclusion filter |
| `server/routes.ts` (lines 8885–9044) | Household-safe variant creation (AI-adapted recipes) |
| `docs/investigations/cookbook/COMPONENT_CLASSIFICATION_SMART_PLANNER_FIX.md` | 11 classified component meals |
| `docs/investigations/planner/SMART_PLANNER_SLOT_FILLING_RECOVERY.md` | Tier-3 repeat fallback design |

---

## SECTION 1: EXISTING COMPONENT INFRASTRUCTURE

### What Was Found

THA has a **partial component architecture** — classification exists, assembly does not.

#### Database Layer (schema.ts)

**`meals` table** — contains the classification field:

```typescript
kind: text("kind").notNull().default("meal"),
// Values: 'meal' (default) | 'component' (sauces, condiments, sub-recipes)

mealFormat: text("meal_format").notNull().default("recipe"),
// Values: 'recipe' (default) | 'grouped' (aggregates sub-components via instructions JSON)
```

**`mealTemplates` table** — contains a full slot-based component structure:

```typescript
sharedBaseComponents: text("shared_base_components").array(),
proteinSlots:         text("protein_slots").array(),
carbSlots:            text("carb_slots").array(),
vegSlots:             text("veg_slots").array(),
toppingSlots:         text("topping_slots").array(),
sauceSlots:           text("sauce_slots").array(),
compatibleDiets:      text("compatible_diets").array(),
```

This is a complete component-slot architecture. It describes a meal as a shared base plus swappable slots per meal dimension.

**`ingredientSwaps` table** — ingredient-level substitution map:

```typescript
export const ingredientSwaps = pgTable("ingredient_swaps", {
  id: serial("id").primaryKey(),
  original: text("original").notNull(),
  healthier: text("healthier").notNull(),
});
```

**`ingredientClassifications` table** — canonical classification per ingredient:

```typescript
normalizedKey, canonicalName, canonicalKey, category, subcategory, aliases, source, reviewStatus
```

**`pantryIngredientKnowledge` table** — dietary knowledge per ingredient key (supports, highlights, tags).

#### The Classified Components (11 Meals)

From `COMPONENT_CLASSIFICATION_SMART_PLANNER_FIX.md`, 11 meals currently carry `kind='component'`:

| ID | Name | Reason |
|----|------|--------|
| 2037 | Pizza sauce | Sauce only; not standalone |
| 1557 | Classic pesto | Pure condiment |
| 1773 | Classic pesto (duplicate) | Pure condiment |
| 1763 | Roasted red pepper sauce | Sauce for other dishes |
| 1920 | Sage & onion stuffing | Roast accompaniment |
| 1921 | Sage & onion stuffing (Edited) | Edit copy of 1920 |
| 2166–2171 | Heinz Tomato Ketchup (variants) | Branded condiment, no recipe |

**Verdict:** Component classification exists as a first-class field. 11 meals are correctly classified. The infrastructure to identify components is live.

#### Grouped Meal Format (Partial Assembly — Shopping Only)

`routes.ts` lines 4359–4386 decode `mealFormat='grouped'` meals to aggregate component ingredients for the shopping list:

```typescript
if (meal.mealFormat === "grouped") {
  // instructions[0] contains a JSON blob: { sources: { label: { type, mealId } } }
  for (const [label, src] of Object.entries(gs.sources)) {
    if ((src.type === "web" || src.type === "my-meal") && src.mealId) {
      const compMeal = await storage.getMeal(src.mealId);
      if (compMeal?.ingredients?.length > 0) {
        componentIngredients.push(...compMeal.ingredients);
      }
    }
  }
}
```

**This proves THA can already read and aggregate multiple component recipes into a single ingredient list.** This mechanism exists only in shopping list generation — not in the planner.

---

## SECTION 2: PLANNER SUPPORT FOR COMPONENTS

### How the Planner Currently Works

The Smart Planner in `smart-suggest-service.ts` operates exclusively on complete meal records. It does not understand the concept of assembling meals from components.

**Candidate pool construction** (`routes.ts` lines 4860–4890):

```
Drink/alcohol filter
↓
Source type gate (starter, planner-placeholder, openfoodfacts excluded)
↓
Component filter ← ACTIVE: kind='component' excluded (line 4871)
↓
Premium/subscriber content gate
↓
Household hard restrictions
↓
Profile dietary hard filter (dietRules engine)
↓
Slot category fit
↓
Scoring and selection
```

**The active exclusion** (`routes.ts` line 4871):
```typescript
// Exclude component recipes (sauces, bases, condiments, stuffings) — these are
// cooking sub-components, not standalone meals. kind='component' is the shared
// classification used by the UI's meal search filter and this pool gate.
userMeals = userMeals.filter(meal => meal.kind !== "component");
```

**Tier fallback system** (`smart-suggest-service.ts` lines 544–568):

```
Tier 1 — unused slot-fit candidates (distinct pool)
↓
Tier 2 — safe fallback (unused category-adjacent meals)
↓
Tier 3 — controlled repeat (any compliant slot-fit, allows reuse)
↓
Zero → slot left empty (line 568)
```

Tier-3 does **not** relax dietary or hard-exclusion filters. It only relaxes the `usedIds` deduplication constraint. When all breakfast meals are excluded by dietary hard filters, all three tiers return zero candidates and the slot remains empty.

**Verdict:** The planner selects only complete meals. It has no mechanism to:
- Select multiple components and assemble them into a meal
- Use `mealTemplates` slots to build a meal dynamically
- Recover from zero candidates by switching to a component-assembly strategy

---

## SECTION 3: HOUSEHOLD VARIANTS

### Existing Household Adaptation — Two Systems

#### System A: Household-Safe Variant Creation (AI Route)

**Location:** `routes.ts` lines 8885–9044

Triggered when a user clicks "Tailor for household" on a planner entry.

Process:
1. Fetch the original recipe and all household member restrictions
2. Call AI to adapt the recipe (remove restricted ingredients, suggest swaps)
3. Create a **new meal record** with:
   ```typescript
   isHouseholdSafeVariant: true,
   variantKind: "household_safe",
   householdSafeFor: { restrictions, householdId, createdAt },
   mealSourceType: "household-safe-variant"
   ```

**Key limitation:** This produces a single unified adapted recipe. It does not produce per-member variants of the same meal. One household member cannot have eggs while another doesn't — the entire recipe is modified for the most restrictive member.

#### System B: Meal Template Slot Scoring (Component-Aware)

**Location:** `household-meal-matcher.ts` — `scoreTemplate` function (lines 232–326)

This system scores `mealTemplates` for household compatibility. It understands the component slot structure:

```typescript
const allSlotIngredients = [
  ...(template.sharedBaseComponents ?? []),
  ...(template.proteinSlots        ?? []),
  ...(template.carbSlots           ?? []),
  ...(template.vegSlots            ?? []),
  ...(template.toppingSlots        ?? []),
  ...(template.sauceSlots          ?? []),
];
```

For each household member, it identifies:
- Which slot ingredients they cannot eat
- Whether a swap exists for that ingredient
- Generates `memberChanges: [{ userId, displayName, swaps: ["remove eggs", "chicken → tofu"] }]`
- Calculates `sharedIngredients` — the base components safe for all members

This is **exactly the component-meal-recovery concept** — a shared base plus per-member swaps. The architecture fully supports it. However, this system currently operates on `mealTemplates` only, not on the planner.

**Verdict:** A household-aware component assembly mechanism already exists in `household-meal-matcher.ts`. It is not wired to the planner's recovery flow.

---

## SECTION 4: PANTRY + SHOPPING REUSE

### Pantry Architecture

`userPantryItems` table — ingredient-level user pantry:
```typescript
ingredientKey, displayName, category, defaultHave, isDefault
```

Contains individual ingredients (e.g., "mushrooms", "tomatoes", "olive oil"). Categorised by larder type. **The pantry knows what ingredients a household has on hand.**

### Shopping List Architecture

`shoppingList` table — per-user shopping items linked to meals.

The grouped meal format (Section 1) already aggregates ingredient lists from multiple component meals into a single shopping list. **This means shopping integration for component-based meals is architecturally solved.**

### Ingredient Classification Architecture

`ingredientClassifications` — canonical classification per ingredient key with category, subcategory, and dietary tags. This could be used to validate whether a given component ingredient violates a household restriction **without requiring a full recipe record**.

`pantryIngredientKnowledge` — dietary knowledge per ingredient (supports, highlights, tags). Could supply per-ingredient dietary compatibility data to a component assembly validator.

### Restriction Resolver

`shared/restrictions/restriction-resolver.ts` — canonical matching with derived ingredients and aliases. A gluten restriction will catch "wheat flour" via alias resolution. **This resolver is the correct tool to validate assembled component ingredient lists.**

**Verdict:** Pantry, shopping, ingredient classification, and restriction resolution can all be reused for component meal recovery. No new infrastructure is needed for dietary validation of assembled components — the restriction resolver already handles it.

---

## SECTION 5: BREAKFAST CASE STUDY

### Household Profiles

**Lilly:** Vegetarian, Gluten-Free, Dairy-Free, Egg-Free, Nut-Free, Soy-Free

**Daisy:** Mediterranean, Dairy-Free, Egg-Free

### Current Outcome

Standard planner breakfast query returns zero candidates for Lilly:
- Any recipe containing eggs → hard excluded (Egg-Free)
- Any recipe containing dairy → hard excluded (Dairy-Free)
- Any recipe containing gluten (bread, oats, flour) → hard excluded (Gluten-Free)
- Any recipe containing soy → hard excluded (Soy-Free)
- Any recipe containing nuts → hard excluded (Nut-Free)
- Any recipe containing meat/fish → hard excluded (Vegetarian)

Result: Empty breakfast slot.

### Component Recovery — Theoretical Assembly

A "Cooked Breakfast" meal shell could be assembled from unrestricted components:

**Shared base components (safe for all members):**
- Mushrooms (all profiles safe)
- Cherry tomatoes (all profiles safe)
- Fried onions (all profiles safe)
- Avocado (all profiles safe)
- Asparagus (all profiles safe)
- Olive oil (all profiles safe)

**Member-specific additions:**
- Adult: eggs, sausages (no applicable restriction)
- Daisy: additional Mediterranean elements (olives, roasted peppers)
- Lilly: GF keto roll (Gluten-Free bread), chicken breast (Vegetarian — excluded; substitute: extra avocado or GF chickpea patty)

Note: Lilly's Vegetarian restriction means chicken breast is not available. A plant-based protein is required: e.g., chickpea patty, tofu scramble (if soy-free compliant), tempeh (soy-based — excluded). A realistic Lilly variant would be: mushrooms, tomatoes, onions, avocado, asparagus, GF roll, extra avocado or halloumi (dairy-free requirement means halloumi is also excluded). Realistically: mushrooms, tomatoes, onions, avocado, asparagus, GF sourdough (gluten-free certified) or sweet potato hash.

### Required Building Blocks

To assemble the Cooked Breakfast from components, the system would require:

1. A `mealTemplate` record for "Cooked Breakfast" with:
   - `sharedBaseComponents`: ["mushrooms", "cherry tomatoes", "fried onions", "avocado", "asparagus"]
   - `proteinSlots`: ["eggs", "sausages", "chicken breast", "chickpea patty"]
   - `carbSlots`: ["GF sourdough", "sweet potato hash"]
   - `compatibleDiets`: ["Mediterranean", "Vegetarian", "Gluten-Free", "Dairy-Free"]

2. The existing `scoreTemplate` function in `household-meal-matcher.ts` would then correctly:
   - Identify shared base components safe for all members
   - Identify per-member swaps (no eggs for Lilly/Daisy, no gluten carbs for Lilly)
   - Return `memberChanges` with explicit substitutions per profile

3. The restriction resolver would validate the assembled ingredient list per member.

4. The shopping list aggregation (grouped meal format) would compile a single shopping list from all components.

**All four building blocks partially exist today.** The missing element is a planner trigger that activates this pathway when recipe search returns zero candidates.

---

## SECTION 6: MEAL SHELL CONCEPT

### Does the Meal Shell Concept Fit THA Architecture?

**Yes.** The `mealTemplates` table is already a meal shell:

```
mealTemplate
  ├── name: "Cooked Breakfast"
  ├── category: "breakfast"
  ├── sharedBaseComponents: ["mushrooms", "tomatoes", "avocado", "onions", "asparagus"]
  ├── proteinSlots: ["eggs", "sausages", "chicken breast", "GF chickpea patty"]
  ├── carbSlots: ["GF sourdough", "sweet potato hash", "GF roll"]
  ├── sauceSlots: ["tomato ketchup", "brown sauce", "avocado spread"]
  └── compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Mediterranean"]
```

The `scoreTemplate` function in `household-meal-matcher.ts` already:
- Evaluates which slots each household member can use
- Identifies member-specific exclusions and swaps
- Calculates a `sharedIngredients` list (safe for all)
- Generates `memberChanges` (per-member swap list)
- Returns an `explanation` of what each member would eat

**The meal shell concept is already implemented for `mealTemplates`.** It is not connected to the planner.

### Gap

The `mealTemplates` system is used for the "Shared Meal" / "Personal Plate" UI feature. The Smart Planner uses `meals` (individual recipes), not `mealTemplates`. There is no pathway from:

```
planner slot → zero recipe candidates → activate mealTemplate shell → select components → fill slot
```

---

## SECTION 7: RECIPE FAILURE RECOVERY

### Current Flow

```
Recipe search (all userMeals)
↓
Component filter (kind='component' removed, routes.ts:4871)
↓
Premium filter
↓
Household hard restriction filter
↓
Dietary profile hard filter (dietRules.ts)
↓
Slot category fit
↓
Tier 1: unused slot-fit candidates
↓ (if empty)
Tier 2: safe fallback (category-adjacent)
↓ (if empty)
Tier 3: controlled repeat (allows reuse)
↓ (if still empty)
Slot left empty — no entry added to result
```

### Potential Recovery Flow (Component Path)

```
Recipe search (all userMeals)
↓
[Existing filters...]
↓
Tier 3: controlled repeat → 0 candidates
↓ NEW
Tier 4: component meal recovery
  ├── Query active mealTemplates matching slot category
  ├── Run scoreTemplate() for household (already exists in household-meal-matcher.ts)
  ├── Select highest-fit template
  ├── For each member: apply member-specific slot selections
  ├── Validate assembled ingredients via restriction resolver (already exists)
  └── Return synthetic meal entry: mealShell + memberVariants
↓
Slot filled with assembled meal
↓
Shopping list: use grouped meal format aggregation (already exists)
```

**Feasibility verdict:** All sub-functions needed for Tier-4 already exist in the codebase. The missing element is the orchestration layer — a function that calls them in sequence when Tier-3 returns zero candidates.

---

## SECTION 8: ARCHITECTURE IMPACT

### Option A — Recipe-Only Planner (Current)

```
Strengths:
- Simple
- Dietary safety proven in production
- No assembly complexity

Weaknesses:
- Fails completely on difficult household restriction combinations
- Empty slots are operationally poor
- Does not reflect how real households cook
- Cannot serve multi-restriction households
```

### Option B — Recipe + Component Recovery (Proposed)

**Planner impact:**
- One new tier (Tier-4) in `smart-suggest-service.ts`
- Triggers only when Tier-3 returns zero — isolated, no regression risk to existing flows
- Estimated: 80–120 lines in smart-suggest-service.ts

**mealTemplates impact:**
- Requires populated templates for common meal categories (breakfast, lunch, dinner)
- Templates must have `sharedBaseComponents`, `proteinSlots`, `compatibleDiets` populated
- Data work, not code work

**Shopping impact:**
- `mealFormat='grouped'` mechanism already handles component ingredient aggregation
- Extend existing handler to emit grouped meals from assembled components
- Estimated: 30–50 lines in the shopping list route

**Pantry impact:**
- None. Pantry integration is already ingredient-level — assembled components reuse it automatically.

**Dietary safety impact:**
- Restriction resolver already validates ingredient lists
- Component assembly output must be passed through the restriction resolver before being accepted
- This is the same validation used in household-safe variant creation

**Complexity:**
- Medium. The orchestration layer is new code.
- The building blocks are proven.
- Risk is contained to Tier-4 — only activated on zero-candidate slots.

---

## SECTION 9: STRATEGIC RECOMMENDATION

### 1. Can THA support component meal recovery today?

**Partially.** The classification, slot architecture, household scoring, ingredient validation, and shopping aggregation all exist. The planner recovery pathway does not.

### 2. What existing architecture already exists?

| System | File | Status |
|--------|------|--------|
| Component classification (`kind='component'`) | `shared/schema.ts` | Live |
| Grouped meal format (multi-component shopping aggregation) | `server/routes.ts:4359` | Live |
| Slot-based template structure (`sharedBaseComponents`, `proteinSlots`, etc.) | `shared/schema.ts` | Live |
| Household slot scoring (`scoreTemplate`) | `server/lib/household-meal-matcher.ts` | Live |
| Ingredient restriction resolver | `shared/restrictions/restriction-resolver.ts` | Live |
| Ingredient swap map | `ingredientSwaps` table | Live |
| Household-safe variant AI creation | `server/routes.ts:8885` | Live |
| Tier-3 repeat fallback (pool exhaustion) | `server/lib/smart-suggest-service.ts:562` | Live |

### 3. What is missing?

| Missing Piece | Description |
|---------------|-------------|
| Tier-4 recovery trigger | Orchestration in `smart-suggest-service.ts` that activates component path on zero candidates |
| Populated `mealTemplates` data | Breakfast, lunch, dinner shells with populated slot arrays |
| Planner → mealTemplate query | Smart Planner does not currently query `mealTemplates` |
| Member-variant planner output format | API response format for a slot that has per-member component variants |
| UI rendering for assembled meals | Frontend needs to show "shared base + member-specific additions" |

### 4. Is component recovery realistic?

**Yes.** The backend infrastructure is 70–80% present. The gaps are:
- ~150–200 lines of orchestration code
- Template data population (data work, not engineering)
- UI representation (medium frontend effort)

This is substantially smaller than building external backfill (which was assessed separately as high complexity).

### 5. Would it solve the breakfast problem?

**Yes, if template data is populated.** For the Lilly + Daisy household, a "Cooked Breakfast" template with appropriate slot data would:
- Identify shared base (mushrooms, tomatoes, avocado, onions, asparagus)
- Assign Lilly: GF roll + plant protein
- Assign Daisy: Mediterranean additions
- Fill the breakfast slot that currently returns zero

### 6. Would it improve household planning generally?

**Yes.** The Lilly + Daisy scenario is not an edge case — any household with 2+ members across different dietary patterns will hit zero-candidate slots. Component recovery would address the structural failure mode of multi-restriction households without compromising dietary safety.

### 7. Smallest safe path forward?

**Phase 1 — Data (no code risk):**
- Create 5–10 `mealTemplate` records for common breakfast/lunch/dinner shells
- Populate `sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `compatibleDiets`
- No planner changes; no user impact

**Phase 2 — Tier-4 backend (isolated):**
- Add Tier-4 fallback in `smart-suggest-service.ts` after Tier-3 zero check
- Query active `mealTemplates` by slot category
- Call existing `scoreTemplate()` to evaluate household fit
- Validate assembled ingredients via restriction resolver
- Return synthetic `MealEntry` with component breakdown

**Phase 3 — Shopping integration:**
- Extend grouped meal format handler to accept Tier-4 synthetic entries
- Shopping list compiles component ingredients automatically

**Phase 4 — UI (deferred):**
- Show assembled meal differently from a standard recipe
- Display per-member component selections
- This is the highest effort and lowest urgency

Phases 1–3 can be completed without Phase 4 (backend-only, planner fills the slot with the best-fit component names).

---

## Capability Matrix

| Capability | Exists Today | Reusable | Gap |
|---|---|---|---|
| Component classification (`kind='component'`) | Yes | Yes — filter can be inverted to select, not exclude | No data gap; 11 meals classified |
| Meal shell / slot architecture (`mealTemplates`) | Yes — schema exists | Yes — `scoreTemplate()` already evaluates slots per member | No breakfast templates populated |
| Household variants (per-member swaps) | Yes — `scoreTemplate()` in household-meal-matcher.ts | Yes — directly applicable | Not wired to planner |
| Planner recovery trigger (Tier-4) | No | N/A | New orchestration code needed |
| Restriction validation for assembled meals | Yes — restriction resolver | Yes — already validates ingredient lists | Not called from component path |
| Shopping support for assembled meals | Yes — grouped meal format | Yes — already aggregates multi-component ingredients | Not triggered from planner |
| Pantry support | Yes — ingredient-level pantry | Yes — component ingredients match pantry keys automatically | None |
| Meal shells (breakfast/lunch/dinner templates) | Schema: Yes. Data: No | Schema reuse is direct | Template data must be authored |
| Recovery flow (Tier-4 end-to-end) | No | All sub-functions exist | Orchestration layer missing |

---

## Recommended Next Decision

The investigation confirms that component meal recovery is architecturally realistic and substantially pre-built.

The recommended decision point is:

**Option 1 — Accept empty slots as valid output**
Keep current behaviour. Communicate to users that restricted households should add more compliant meals or relax profile restrictions. No engineering investment required.

**Option 2 — Implement component meal recovery (phased)**
Invest in Phase 1 (template data) and Phase 2 (Tier-4 backend). Low code risk, high value for multi-restriction households. Estimated backend effort: 1–2 days. Data effort: 1 day. UI effort: deferred.

**Option 3 — Hybrid: expand external backfill first, then component recovery**
External backfill (assessed separately) adds more compliant complete recipes to the pool. This reduces how often Tier-4 is needed. Component recovery then becomes a true last-resort rather than a primary path. Lower risk, higher latency to solution.

The investigation does not recommend an option — this is a product decision. The data above provides the factual basis.

---

## Data Impact Declaration

- Reads existing data: Yes
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No

---

*Investigation complete. No code was changed. No data was modified.*
