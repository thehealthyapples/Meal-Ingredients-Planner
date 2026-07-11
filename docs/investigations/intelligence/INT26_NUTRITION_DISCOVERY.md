# INT26 — Nutrition Discovery Capability: Investigation

**Date:** 2026-07-01  
**Status:** Investigation complete. No implementation performed.  
**Scope:** Ownership analysis, data reliability audit, capability boundary definition, Phase 1 design, risks.

---

## 1. Problem Statement

The platform can currently:

- Discover meals by **name or theme** (`meal-discovery`, INT26 Phase 1)
- Explain **food/nutrient/benefit knowledge** (`nutrition-knowledge`, INT4)

It cannot answer:

> *"Find me a high-protein meal."*  
> *"Show me meals under 400 calories."*  
> *"What low-carb options do I have?"*  
> *"Suggest something with less than 10g of fat."*

These queries use **nutritional properties as the discovery filter**, not as an explanation subject. No existing capability handles this. The `meal-discovery` engine searches by name/ingredient text only. The `nutrition-knowledge` handler explains food-knowledge facts but has no concept of a meal's macro values. The `nutrition` table — which stores per-meal macronutrient data — is read via point-lookup only (`getNutrition(mealId)`, `getNutritionBulk(mealIds[])`) and is never queried as a filter surface.

---

## 2. Capability Boundary — What This Is and Is Not

### It is NOT an extension of `meal-discovery`

`meal-discovery` finds meals by free-text match against name, ingredients, cuisine, and template tags. Adding nutritional filtering to that engine would couple two unrelated query dimensions inside a single capability — violating the single-responsibility principle established across INT2–INT26. A user asking "find me a chicken curry" and a user asking "find me a high-protein meal under 400 calories" are categorically different intent patterns.

### It is NOT a duplicate of `nutrition-knowledge`

`nutrition-knowledge` (INT4) exposes the WS0 food knowledge graph: foods, nutrients, health benefits, and their relationships (e.g. "broccoli is high in vitamin C", "foods linked to the benefit 'bone health'"). It reads from `knowledge_*` tables and is entirely general (not user-scoped). It has no concept of meal macro values or per-meal calorie counts.

### It IS a new, distinct capability

**Nutrition Discovery** = *use per-meal macronutrient data as a discovery filter to surface matching meals.* The query surface is: given a nutritional constraint (calorie ceiling, protein floor, macro balance), return the meals that satisfy it.

| Capability | Query dimension | Data source |
|---|---|---|
| `meal-discovery` | Name, ingredient, cuisine, theme | `meals` + `meal_templates` |
| `nutrition-knowledge` | Food benefits, nutrients, health claims | `knowledge_*` tables |
| `nutrition-discovery` (proposed) | Calories, protein, carbs, fat, sugar, salt | `nutrition` table (joined to `meals`) |

---

## 3. Canonical Ownership

### Source of truth: the `nutrition` table

`shared/schema.ts` defines:

```ts
export const nutrition = pgTable("nutrition", {
  id:       serial("id").primaryKey(),
  mealId:   integer("meal_id").notNull(),
  calories: text("calories"),
  protein:  text("protein"),
  carbs:    text("carbs"),
  fat:      text("fat"),
  sugar:    text("sugar"),
  salt:     text("salt"),
  source:   text("source"),
});
```

This table is the authoritative per-meal macronutrient record. It is owned by the storage layer — the only existing read methods are:

| Method | What it does |
|---|---|
| `getNutrition(mealId)` | Point lookup — returns one row or undefined |
| `getNutritionBulk(mealIds[])` | Batch point lookup — returns rows for a list of ids |

**Neither method is a filter query.** There is no `getMealsByNutritionFilter(filter)` method on `storage`. This is the primary storage gap.

### Who would own the discovery operation?

By the same pattern as `meal-discovery`, a new **`NutritionDiscoveryEngine`** (`server/intelligence/services/nutrition-discovery-engine.ts`) would own the discovery coordination. It does not own the data — the `nutrition` table and the `meals` table retain their existing ownership. The engine owns:

1. The **query parsing** — interpreting "high protein" / "under 400 calories" / "low carb" into threshold predicates.
2. The **storage delegation** — calling a new `getMealsByNutritionFilter` storage method (to be added).
3. **Result assembly** — joining nutrition rows to their parent meals, projecting a `NutritionDiscoveryItem` shape.
4. **Honest gaps** — when no data is found, when nutrition coverage is too sparse to answer reliably, or when the query cannot be parsed into a predicate.

---

## 4. Data Reliability Audit — CRITICAL FINDINGS

### Finding 1: All macro values are stored as `text`, not numeric

Every column in the `nutrition` table (`calories`, `protein`, `carbs`, `fat`, `sugar`, `salt`) is `text`. This means:

- A meal's calories might be stored as `"320"`, `"320 kcal"`, `"approx 320"`, `"~300-400"`, `"N/A"`, or `null`.
- Numeric comparison (`< 400`, `> 30g protein`) requires parsing on retrieval — it cannot be done in a SQL `WHERE` clause without a cast.
- Free-text values with units, ranges, or annotations will parse either inconsistently or fail silently.

**Implication:** The engine must include a text-to-number parser with tolerance for common unit suffixes (`kcal`, `g`, `mg`), range averaging (`300-400` → `350`), and a NaN-on-failure fallback. Results where parsing fails must be silently excluded (not returned as if they matched and not returned as if they failed — simply not included in the result set with no false certainty).

### Finding 2: Nutrition coverage is partial and uneven

The `nutrition` table is populated when:
- A meal is imported with attached nutritional data (e.g. from TheMealDB, Spoonacular, or a scanned recipe).
- A user or admin manually provides nutritional values.
- OpenFoodFacts data is attached to a barcode-linked ready meal.

Many meals — especially those manually created, imported from BBC Good Food without nutrition fields, or created from scratch — will have no `nutrition` row at all. The join between `meals` and `nutrition` will produce a high proportion of `NULL` rows.

**Implication:** A search for "meals under 400 calories" will exclude all meals with no nutrition data. The response must clearly communicate coverage limits: *"X meals matched, but Y of your meals have no recorded nutrition data."* The engine must not silently appear to give an exhaustive answer.

### Finding 3: No personal scoping on the `nutrition` table

The `nutrition` table has `mealId` but no `userId`. A meal's nutrition row belongs to the meal, not to a user. The engine must scope its meal results to the requesting user's personal library (via `getMeals(userId)`) and then join nutrition to those meals — it cannot query the `nutrition` table directly without first establishing which meals the user is entitled to see.

### Finding 4: System meals have nutrition coverage too

System meals (`isSystemMeal = true`) in the `meals` table are globally readable and many carry nutrition data. A nutrition-filtered search should optionally span both personal and system meals — giving the user the full picture rather than only their personal library (which for most users will be sparse or empty).

---

## 5. Proposed Capability Design

### Capability registration

```
Capability ID:      nutrition-discovery
Display name:       Nutrition Discovery
Description:        Discover meals matching a nutritional criterion — calorie ceiling, protein floor, macro balance.
Owner:              NutritionDiscoveryEngine (delegates to storage.getMealsByNutritionFilter — new method)
Data:               nutrition table (joined to meals)
ownershipScoped:    true (personal meals scoped by userId; system meals globally readable)
Supported intents:  search, recommend
Executable intents (Phase 1): search
```

### Port interface (`NutritionDiscoveryPort`)

```ts
interface NutritionFilter {
  caloriesMax?: number;      // kcal ceiling
  caloriesMin?: number;      // kcal floor
  proteinMin?: number;       // grams
  carbsMax?: number;         // grams
  fatMax?: number;           // grams
  sugarMax?: number;         // grams
}

interface NutritionDiscoveryItem {
  id: string;                // composite "sourceType:mealId"
  name: string;
  sourceType: "personal" | "system";
  sourceLabel: string;
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    sugar: number | null;
    salt: number | null;
  };
  parsedFromText: boolean;   // true if values were text-parsed (signal to caller: lower confidence)
  isAlreadySaved: boolean;
  internalId: number;
}

interface NutritionDiscoverySearchResult {
  scope: "nutrition-filter";
  filter: NutritionFilter;
  rawQuery: string;
  totalCount: number;
  mealsWithNutritionCount: number;   // how many meals were checked that had nutrition data
  mealsWithoutNutritionCount: number; // honest coverage gap
  results: NutritionDiscoveryItem[];
  source: "nutrition-discovery";
}
```

### Handler responsibilities

1. `readOnlyVerbGuard(intent, ["search"], "Nutrition Discovery")` — write verbs → gap.
2. `requireUserId(context, "Nutrition Discovery")` — anonymous → denied.
3. Parse `{ query }` string into a `NutritionFilter` (threshold extractor — see §6).
4. Gap if the query string cannot be parsed into at least one threshold (honest: "I couldn't understand that nutritional filter").
5. Delegate to `port.discoverByNutrition(filter, userId)`.
6. Return `NutritionDiscoverySearchResult`.

### New storage method required

```ts
getMealsByNutritionFilter(userId: number): Promise<Array<{
  meal: Meal;
  nutrition: Nutrition | null;
  isSystem: boolean;
}>>
```

This method fetches all personal meals (`getMeals(userId)`) and all system meals (`getSystemMeals()`), then performs a left-join against the `nutrition` table. It returns the raw joined rows. The engine then applies the text-parsed numeric filter predicates in application code rather than SQL — because the text values cannot be safely cast in the DB layer.

---

## 6. Query Parsing Design

The handler receives a free-text query (e.g. `"high protein under 400 calories"`). The engine must extract threshold predicates. A threshold extractor operates as follows:

| Pattern | Captured predicate |
|---|---|
| `under N cal(ories)? / kcal` | `caloriesMax = N` |
| `less than N cal / kcal` | `caloriesMax = N` |
| `over N cal / kcal` | `caloriesMin = N` |
| `high protein` | `proteinMin = 20` (configurable floor) |
| `at least Ng protein` | `proteinMin = N` |
| `low carb` | `carbsMax = 20` (configurable ceiling) |
| `under Ng carbs` | `carbsMax = N` |
| `low fat` | `fatMax = 10` (configurable ceiling) |
| `under Ng fat` | `fatMax = N` |
| `low sugar` | `sugarMax = 5` (configurable ceiling) |

If no recognised pattern matches → honest gap: *"I didn't recognise a nutritional filter in that query. Try something like 'meals under 400 calories' or 'high protein meals'."*

The configurable floors/ceilings for qualitative terms (`high protein`, `low carb`) must be documented constants (not magic numbers) and should reflect reasonable dietary conventions (e.g. "high protein" ≥ 20g per serving is standard for single-meal context).

---

## 7. Pattern Intent Routing

New `NUTRITION_DISCOVERY_MATCHERS` would be added to `pattern-intent-resolver.ts`, routing to `nutrition-discovery/search`. Patterns to cover:

| Natural language | Routes to |
|---|---|
| "high protein meal / recipe" | `nutrition-discovery/search` |
| "low carb meal / recipe" | `nutrition-discovery/search` |
| "meals under N calories" | `nutrition-discovery/search` |
| "something under / with less than N cal" | `nutrition-discovery/search` |
| "low fat / low sugar recipe" | `nutrition-discovery/search` |
| "what can I have under N kcal" | `nutrition-discovery/search` |

**Key routing separation concern:**

- `"find me a high-protein chicken meal"` — contains both a theme ("chicken") and a nutrient constraint ("high-protein"). This overlaps `meal-discovery` and `nutrition-discovery`. The two capabilities are distinct and cannot be composed in Phase 1. The resolver should prefer the **more specific nutritional constraint pattern** and route to `nutrition-discovery`. The caller (conversation gateway / assistant) would need multi-capability fan-out in a future phase to handle both constraints simultaneously.
- `"what foods are high in protein?"` — this is a knowledge question → `nutrition-knowledge` (not `nutrition-discovery`). Must not match nutrition-discovery patterns. The distinction is: **food facts = `nutrition-knowledge`**, **meal filtering = `nutrition-discovery`**.

---

## 8. Capability Registry Entry

A new seed entry should be added to `capability-registry.ts`:

```ts
{
  id: "nutrition-discovery",
  displayName: "Nutrition Discovery",
  description: "Discover meals matching a nutritional criterion — calorie ceiling, protein floor, macro balance.",
  owner: "nutrition table (joined to meals)",
  owningService: "server/intelligence/services/nutrition-discovery-engine.ts",
  apiSurface: "/api/nutrition* (bulk lookup only — no filter route exists yet)",
  supportedIntents: ["search", "recommend"],
  permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
}
```

This becomes the **15th registered capability** (14 currently registered after INT26 Phase 1).

---

## 9. Honest Gaps Required

| Situation | Required response |
|---|---|
| Query cannot be parsed into any threshold | Gap — with a helpful restate example |
| User's personal library is empty | Honest result: `totalCount: 0`; also surface system meals if available |
| All matched meals have no nutrition data | Gap — *"I found meals but none have recorded nutrition data"* |
| `mealsWithoutNutritionCount` > 0 | Non-gap result, but `mealsWithoutNutritionCount` exposed in result shape so the caller can surface it |
| `recommend` verb | Gap — Phase 1; no ranking/personalisation owner yet |
| Anonymous caller | Denied — `requireUserId` fires before port |

---

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Text-stored macro values: inconsistent format | HIGH | Parser must handle `"320 kcal"`, `"~300"`, `"300-400"` (range average), and fail silently to exclusion — never fabricate a parsed value |
| Sparse nutrition coverage: most meals return NULL | HIGH | Expose `mealsWithoutNutritionCount` in result; never present a filtered result as exhaustive |
| Pattern overlap with `meal-discovery` (theme + nutrient queries) | MEDIUM | Prefer nutritional-constraint matchers; document that multi-constraint queries require gateway fan-out (Phase 2) |
| System meal nutrition data quality | MEDIUM | Same text-parse risk applies; system meals with no nutrition row are excluded from nutrition-filtered results |
| `recommend` without a ranking owner | LOW | Phase 1 gaps it honestly; Phase 2 would need a delegate-only ranking method over the engine |
| No `getMealsByNutritionFilter` storage method | MEDIUM | This is a new method to be added to `IStorage` — not a large implementation but it is a pre-requisite for the port |

---

## 11. What Already Works (No Change Needed)

| Component | Status |
|---|---|
| `nutrition` table schema | Already exists — no schema changes needed |
| `getNutrition(mealId)` / `getNutritionBulk(mealIds[])` | Already exists — engine reads these indirectly via the new filter method |
| `getMeals(userId)` / `getSystemMeals()` | Already exists — used by engine to establish the eligible meal set |
| `nutrition-knowledge` handler | No change — knowledge queries remain on their own capability |
| `meal-discovery` engine | No change — text-based discovery remains on its own capability |
| Pattern intent resolver | New `NUTRITION_DISCOVERY_MATCHERS` block only — existing arrays untouched |

---

## 12. Files to Create / Modify (Phase 1)

| File | Action | Purpose |
|---|---|---|
| `server/intelligence/services/nutrition-discovery-engine.ts` | Create | `NutritionDiscoveryEngine` — text-parse + filter + assembly |
| `server/intelligence/handlers/nutrition-discovery-port.ts` | Create | `NutritionDiscoveryPort` interface, `NutritionDiscoveryItem`, `NutritionDiscoverySearchResult`, production factory |
| `server/intelligence/handlers/nutrition-discovery-handler.ts` | Create | Handler — verb guard, auth, query parse, delegation |
| `server/intelligence/bindings/nutrition-discovery.ts` | Create | `NUTRITION_DISCOVERY_CAPABILITY_ID`, `NUTRITION_DISCOVERY_EXECUTABLE_INTENTS`, `bindNutritionDiscoveryCapability` |
| `server/tests/test-intelligence-nutrition-discovery-binding.ts` | Create | Test suite (target: ~50–65 assertions) |
| `server/intelligence/capability-registry.ts` | Edit | Add `nutrition-discovery` seed entry (capability 15 of 15 registered) |
| `server/intelligence/intelligence-platform.ts` | Edit | Import + `bindNutritionDiscoveryCapability(intelligencePlatform)` call |
| `server/intelligence/pattern-intent-resolver.ts` | Edit | Add `NUTRITION_DISCOVERY_MATCHERS`; update `ALL_SPECIFIC_MATCHERS` |
| `server/intelligence/index.ts` | Edit | Export new public symbols |
| `server/storage.ts` | Edit | Add `getMealsByNutritionFilter(userId)` to `IStorage` interface and `DatabaseStorage` implementation |
| `server/tests/test-intelligence-*.ts` (12 files) | Edit | Scope-lock counts updated 12 → 13 live |
| `server/tests/test-intelligence-registry-executability.ts` | Edit | Import + includes assertion + count 12 → 13 |
| `docs/implementation/INT26_NUTRITION_DISCOVERY_CAPABILITY_IMPLEMENTATION.md` | Create | Implementation report (post-build) |

---

## 13. Recommended Scope for Phase 1

| In scope | Out of scope |
|---|---|
| `search` verb — filter meals by parsed threshold predicates | `recommend` — requires a ranking/personalisation owner |
| Personal meals + system meals | Meal templates (no nutrition data attached) |
| `NutritionFilter` predicates: `caloriesMax`, `caloriesMin`, `proteinMin`, `carbsMax`, `fatMax`, `sugarMax` | Multi-constraint + theme queries (e.g. "high-protein chicken") — Phase 2 |
| Text-to-number parser for common formats | Third-party nutrition enrichment (live external calls) |
| Honest coverage gap reporting | UI changes |
| New `getMealsByNutritionFilter` storage method | Schema changes (nutrition table is fine as-is) |

---

## 14. Definition of Investigation Done

- [x] Capability boundary established — distinct from `meal-discovery` and `nutrition-knowledge`
- [x] Data reliability audit complete — text columns, sparse coverage, no user scope on `nutrition` table
- [x] Canonical ownership identified — `NutritionDiscoveryEngine` as coordinator; `storage` as data owner
- [x] Port interface designed — `NutritionDiscoveryPort`, `NutritionFilter`, `NutritionDiscoveryItem`, `NutritionDiscoverySearchResult`
- [x] Query parsing design specified — threshold extractor patterns with configurable floors/ceilings
- [x] Pattern routing designed — `NUTRITION_DISCOVERY_MATCHERS`; routing separation from `meal-discovery` and `nutrition-knowledge`
- [x] Capability registry entry specified — `nutrition-discovery`, 15th registered capability
- [x] Honest gaps catalogued — unparseable query, empty coverage, NULL data, anonymous caller
- [x] Risks identified and rated — text parsing (HIGH), coverage sparsity (HIGH), pattern overlap (MEDIUM)
- [x] File manifest produced — 14 files (5 new, 9 edited)
- [x] No implementation performed
