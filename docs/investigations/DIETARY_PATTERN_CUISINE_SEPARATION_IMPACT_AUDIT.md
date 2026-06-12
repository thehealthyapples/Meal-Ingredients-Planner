# DIETARY PATTERN / CUISINE PREFERENCE / ALLERGY SEPARATION — IMPACT AUDIT

**Date:** 2026-06-12  
**Rollback tag:** `rollback/pre-dietary-separation-audit-2`  
**Status:** Investigation only. No code changes.

---

## BACKGROUND

THA's profile currently stores one value (`users.diet_pattern`) that simultaneously:

1. Acts as a **dietary lifestyle pattern** (Keto, Vegan, Paleo…)
2. Is labelled **"Cuisine"** in the profile UI

This created no problems early in development. Now that Smart Planner, Household Eaters, Restriction Resolver, Meal Shell Recovery, Nutrition Enhancement, and Diet Dictionaries all consume this value in distinct ways, the conceptual blur creates technical debt and limits future precision.

The proposed future model separates:

- **Dietary Patterns** — Vegetarian, Vegan, Keto, Low-Carb, Paleo, Carnivore, Flexitarian, DASH, MIND
- **Cuisine Preferences** — Italian, French, British, Indian, Thai, Mexican, Chinese, Japanese, Middle Eastern, Mediterranean
- **Allergies & Intolerances** — Gluten-Free, Dairy-Free, Eggs, Nuts, Soy, Shellfish, Sesame

---

## QUESTION 1 — Where are the diet pattern values currently referenced?

### `Vegetarian`

| File | Purpose | Behaviour |
|------|---------|-----------|
| `client/src/lib/diets.ts` | Source of truth for UI chips | Listed in `DIET_PATTERNS` and `DIET_PATTERN_OPTIONS`; value stored to `users.diet_pattern` |
| `server/lib/dietRules.ts` | Hard exclusion engine | Excludes any recipe containing meat or fish keywords, dish-name patterns (carbonara, bolognese, etc.) |
| `server/lib/meal-scoring-service.ts` | Scoring | `DIET_EXCLUDED_KEYWORDS.vegetarian` reduces `dietMatch` score when keywords found |
| `server/lib/recommendation-service.ts` | Meal recommendation | Category exclusions for meat/fish applied |
| `server/lib/smart-suggest-service.ts` | Smart Planner | Listed in `DIETARY_SEARCH_PREFIXES` — prefixes external recipe searches with "vegetarian" |
| `server/lib/household-meal-matcher.ts` | Household compatibility | Mapped `Vegetarian → vegetarian` via `DIET_PATTERN_TO_DIET_TYPE`; becomes eater `dietTypes` |
| `server/lib/uplift-engine.ts` | Nutrition boost | `isDietExcluded` checks against eater `dietTypes` |
| `client/src/components/NutritionBoostPanel.tsx` | Boost safety | `shouldExcludeRecipe(boost.name, { dietPattern: diet })` called per household eater |
| `server/lib/planner-compliance.ts` | Planner gate | `candidateDietExcluded()` hard-filters meals before scheduling |
| `client/src/components/AdaptationReviewSheet.tsx` | Adaptation review UI | Detects `vegetarian` in household restrictions to label household-safe variants |
| `server/routes.ts` (`ALLOWED_DIET_PATTERNS`) | API validation | Accepted by profile save endpoint as a valid pattern value |
| `client/src/pages/meals-page.tsx` (×3 hardcoded arrays) | Meal filter chips | Inline array `["Vegetarian", ...]` used to render diet filter UI |

### `Vegan`

Same systems as Vegetarian, plus:

| File | Additional behaviour |
|------|---------------------|
| `server/lib/dietRules.ts` | Also excludes dairy, egg, honey, gelatin |
| `client/src/components/analyser/AnalyserDetailV2.tsx` | `relevantFor` checks `dietPattern === "Vegan"` to show calcium/B12/iron nutrient alerts |
| `server/lib/uplift-rules.ts` (×3 entries) | `excludedDietTypes: ['vegan', 'dairy-free']` suppresses dairy-containing boost suggestions |

### `Keto`

| File | Purpose | Behaviour |
|------|---------|-----------|
| `server/lib/dietRules.ts` | Hard exclusion | Large `KETO_EXCLUDE` dictionary — grains, sugars, starchy veg, legumes, sweetened sauces |
| `server/lib/meal-scoring-service.ts` | Scoring | Boosts avocado, cheese, bacon, egg, cream, nuts, salmon, beef, chicken |
| `server/lib/smart-suggest-service.ts` | External search | Prefixes external queries with "keto" |
| `server/lib/household-meal-matcher.ts` | Household | Mapped `Keto → keto` |
| `client/src/pages/meals-page.tsx` | Filter UI | Appears in three hardcoded filter arrays |
| `server/seeds/seed-meal-shell-templates.ts` | Meal shell | Listed in `compatibleDiets` for the Cooked Breakfast shell |

### `Low-Carb`

Same as Keto (shares `LOW_CARB_EXCLUDE = [...KETO_EXCLUDE]`). Mapped to `low-carb` in diet-type bridge. Listed in `DIETARY_SEARCH_PREFIXES`.

### `Paleo`

| File | Behaviour |
|------|-----------|
| `server/lib/dietRules.ts` | Hard exclusion via `PALEO_EXCLUDE` (grains, dairy, legumes, soy) |
| `server/lib/meal-scoring-service.ts` | Scoring boosts for meat, fish, egg, vegetables, sweet potato |
| `server/lib/smart-suggest-service.ts` | External search prefix "paleo" |
| `server/lib/household-meal-matcher.ts` | Mapped `Paleo → paleo` |

### `Carnivore`

| File | Behaviour |
|------|-----------|
| `server/lib/dietRules.ts` | Hard exclusion via `CARNIVORE_PLANT_KEYWORDS` — excludes vegetables, fruit, grains, legumes, tofu |
| `server/lib/meal-scoring-service.ts` | Scoring boost for beef, steak, lamb, eggs, butter |
| `server/lib/household-meal-matcher.ts` | Mapped `Carnivore → carnivore` |

### `DASH`

| File | Behaviour |
|------|-----------|
| `server/lib/dietRules.ts` | No hard exclusion; scoring boosts `DASH_BOOST` (vegetables, whole grain, lean protein, beans) and penalises `DASH_PENALTY` (salt, sodium, processed) |
| `server/lib/meal-scoring-service.ts` | `DIET_EXCLUDED_KEYWORDS.dash` reduces score for bacon, ham, soy sauce, processed |
| `server/lib/household-meal-matcher.ts` | Mapped `DASH → dash` |
| `server/lib/external-meal-service.ts` | Deliberately **omitted** from `CUISINE_QUERIES` — no cuisine search term exists for DASH |

### `MIND`

Same structure as DASH. Scoring boosts for leafy greens, berries, nuts, fish. Penalties for butter, red meat, sweets, fried food. No hard exclusion.

### `Flexitarian`

Same structure as DASH/MIND. Scoring boosts for plant-forward signals. Small penalty for red meat (beef, lamb, pork). No hard exclusion.

### `Mediterranean`

| File | Behaviour |
|------|-----------|
| `server/lib/dietRules.ts` | No hard exclusion; scoring boosts olive oil, fish, vegetables, legumes, herbs |
| `server/lib/meal-scoring-service.ts` | `DIET_EXCLUDED_KEYWORDS.mediterranean` penalises bacon, salami, pepperoni, processed |
| `server/lib/external-meal-service.ts` | **Also appears as a cuisine** in `CUISINE_QUERIES.mediterranean` with search terms ["greek salad", "hummus", "falafel"] |
| `client/src/components/PlannerAssistantPanel.tsx` | **Also appears as a cuisine option** in the Smart Planner cuisine dropdown |
| `server/seeds/seed-meal-shell-templates.ts` | Listed in `compatibleDiets` for the Cooked Breakfast shell |

**Mediterranean is the only value that currently appears as BOTH a diet pattern AND a cuisine selection.**

---

## QUESTION 2 — Which database fields currently store these values?

### `users` table

| Column | Type | Contains |
|--------|------|---------|
| `diet_pattern` | `TEXT` | One of: Mediterranean, DASH, MIND, Flexitarian, Vegetarian, Vegan, Keto, Low-Carb, Paleo, Carnivore — or NULL |
| `diet_restrictions` | `TEXT[]` | Zero or more of: Gluten-Free, Dairy-Free, Nuts, Eggs, Shellfish, Soy, Sesame |

Both columns were added by `server/migrations/ensureUserDietColumns.ts` (ALTER TABLE IF NOT EXISTS). No `cuisine_preference` column exists.

### `user_preferences` table

| Column | Type | Contains |
|--------|------|---------|
| `diet_types` | `TEXT[]` | Derived from `users.diet_pattern` via the bridge in `routes.ts` (e.g. `Keto → keto`). Also stores onboarding values: Pescatarian, Halal, Kosher, `style:simple-meals`, `style:family-friendly`, etc. |

The bridge logic (`routes.ts:973–993`) runs on every profile save and syncs `users.diet_pattern → user_preferences.diet_types`, preserving non-canonical values (Halal, Kosher, Pescatarian, style:*).

### `household_eaters` table

| Column | Type | Contains |
|--------|------|---------|
| `default_diet_types` | `TEXT[]` | Eater's soft dietary preferences (Vegetarian, Vegan, Keto, etc.) — shown as chips in profile |
| `hard_restrictions` | `TEXT[]` | Allergy/intolerance hard constraints (Gluten-Free, Dairy-Free, Nuts, etc.) |

### `planner_week_eater_overrides` table

| Column | Type | Contains |
|--------|------|---------|
| `diet_types` | `TEXT[]` | Per-week override of `household_eaters.default_diet_types` |

### `meal_templates` table

| Column | Type | Contains |
|--------|------|---------|
| `compatible_diets` | `TEXT[]` | Diet values a meal shell is compatible with (e.g. `["Vegetarian", "Gluten-Free", "Mediterranean", "Low-Carb", "Keto"]`) |
| `cuisine` | `TEXT` | Cuisine string from external APIs (e.g. "British", "Italian") |

### `meals` table

| Column | Type | Contains |
|--------|------|---------|
| `diet_types` | `TEXT[]` | Auto-detected diet tags (vegetarian, vegan, etc.) — used for filtering in meal library |

### No `cuisine_preference` column exists anywhere in the schema.

The Smart Planner's cuisine preference (`smartCuisine`) is a **session-only UI state** in `use-smart-suggest.ts` — it is passed as `preferredCuisine` in the API request body but is never persisted to the database.

---

## QUESTION 3 — Which systems assume these values are all part of the same category?

### Systems with the tightest coupling (single-category assumption)

#### 1. Profile UI (`client/src/pages/profile-page.tsx`)
The entire diet section is rendered under a label called **"Cuisine"** (line 1332, 1344). `DIET_PATTERNS` — which includes Vegetarian, Vegan, Keto, Paleo, DASH, MIND, Carnivore — are presented as cuisine chips. Allergies & Intolerances are correctly separated, but Dietary Patterns and Cuisine share the same label and conceptual bucket.

#### 2. `dietRules.ts` (server + client identical copies)
`shouldExcludeRecipe()` and `scoreRecipeForDiet()` both accept a single `dietPattern: string | null` parameter. The function handles all ten diet pattern values (Vegetarian through Carnivore) in one switch statement. Mediterranean, DASH, MIND, and Flexitarian are grouped with Vegetarian, Keto, Paleo as diet patterns — despite having fundamentally different enforcement semantics (scoring-only vs. hard exclusion).

#### 3. `SmartSuggestSettings.dietPattern` / `routes.ts`
The smart planner API passes a single `dietPattern` field to the suggestion engine. There is no separate field for cuisine preference. The planner then uses this for both:
- External recipe search prefix (via `DIETARY_SEARCH_PREFIXES`)
- Hard meal exclusion (via `candidateDietExcluded()`)

Mediterranean appears in both `DIETARY_SEARCH_PREFIXES` (treated as a diet for search) and the cuisine dropdown (treated as a cuisine for filtering).

#### 4. `household_eaters.default_diet_types`
This array mixes all diet pattern values (including DASH, MIND, Flexitarian which are preference-only) with allergen values (Gluten-Free). The `household-meal-matcher.ts` then uses all values from this array to check `compatibleDiets` on meal shells — meaning "Mediterranean" as a diet pattern can block a shell from being considered compatible, even though Mediterranean is only a scoring hint, not a hard constraint.

#### 5. `meals.diet_types` and `meal_templates.compatible_diets`
Both arrays mix true dietary restrictions (Vegetarian, Vegan) with dietary preference styles (Mediterranean) and allergy restrictions (Gluten-Free). The shell compatibility check in `household-meal-matcher.ts` (line 350) uses `compatibleDiets.includes(diet)` — treating Mediterranean and Vegetarian identically.

#### 6. Onboarding flow (`ONBOARDING_DIET_OPTIONS` in `diets.ts`)
Lists Gluten-free and Dairy-free alongside Vegetarian, Vegan, Mediterranean, DASH, MIND as a flat undifferentiated list. These values are stored to `user_preferences.diet_types` via onboarding completion, mixing all three categories.

#### 7. `meals-page.tsx` (×3 hardcoded arrays)
Three places in the meals page render filter chips using inline hardcoded arrays: `["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"]`. These are not imported from `diets.ts` — they are duplication points that would need updating independently.

---

## QUESTION 4 — What level of change would separation require?

### Assessment: **STATUS C — UI + logic + schema + migration**

Evidence:

#### Schema changes required
- `users` table: `diet_pattern` currently stores all ten values. After separation, it should store only the nine Dietary Patterns. A new `cuisine_preference` column (or a separate table) would be needed to store the user's preferred cuisine.
- No existing column for cuisine preference exists anywhere.
- `household_eaters.default_diet_types` mixes dietary patterns and allergies in one array. Separating these requires either splitting the column or adopting a convention where allergy values are distinguished.
- `meal_templates.compatible_diets` mixes dietary restrictions with cuisine compatibility — a schema split would clarify the boundary.

#### Migration required
- Mediterranean is currently stored in `users.diet_pattern` for users who selected it. After separation, those rows must be migrated: `diet_pattern = 'Mediterranean'` → `cuisine_preference = 'Mediterranean'`, `diet_pattern = NULL`.
- `user_preferences.diet_types` rows containing `mediterranean` (from the bridge) must also be cleaned.
- `household_eaters.default_diet_types` rows containing Mediterranean must be reclassified.
- Any `meals.diet_types` or `meal_templates.compatible_diets` entries using Mediterranean as a diet must be reviewed.

#### Logic changes required
- `dietRules.ts` (both copies): The switch statement handles Mediterranean/DASH/MIND/Flexitarian as diet patterns. Post-separation, DASH/MIND/Flexitarian remain as Dietary Patterns (lifestyle-oriented). Mediterranean moves to Cuisine. The switch statement and `DietContext` type both change.
- `external-meal-service.ts`: `CUISINE_QUERIES.mediterranean` is already treated as a cuisine. The Smart Planner's `preferredCuisine` path also handles Mediterranean. Post-separation, Mediterranean is only a cuisine search term, not a diet pattern.
- `meal-scoring-service.ts`: `DIET_EXCLUDED_KEYWORDS.mediterranean` would move to cuisine-based scoring rather than diet-based scoring.
- `smart-suggest-service.ts`: `DIETARY_SEARCH_PREFIXES` currently includes Mediterranean. After separation, Mediterranean is removed from this list and only reaches `preferredCuisine`.
- `household-meal-matcher.ts`: The `DIET_PATTERN_TO_DIET_TYPE` bridge would no longer map Mediterranean (since it becomes a cuisine, not a dietary lifestyle).
- `planner-compliance.ts`: Only true dietary patterns (not cuisine preferences) should feed `candidateDietExcluded()`.

#### UI changes required
- Profile page: Rename the "Cuisine" label to "Dietary Pattern". Add a new "Cuisine Preferences" section with Italian/French/British/Indian/Thai/Mexican/Chinese/Japanese/Middle Eastern/Mediterranean.
- Remove Mediterranean from `DIET_PATTERNS` in `diets.ts`. Add it to a new `CUISINE_PREFERENCE_OPTIONS` list.
- Planner Assistant Panel: Cuisine dropdown already has the right concept. Mediterranean is already in it. No structural change needed there — just ensure the profile cuisine preference can pre-populate it.
- `meals-page.tsx`: Three hardcoded arrays need updating (remove Mediterranean from diet filters, or move it to a separate cuisine filter).

---

## QUESTION 5 — How should existing users migrate?

### The core migration case

Any user who currently has `users.diet_pattern = 'Mediterranean'` has conceptually selected a cuisine preference, not a hard dietary lifestyle. The correct migration is:

```
BEFORE:
  users.diet_pattern = 'Mediterranean'
  users.diet_restrictions = []

AFTER:
  users.diet_pattern = NULL
  users.cuisine_preference = 'Mediterranean'
  users.diet_restrictions = []
```

### Migration strategy options

#### Option A — Automatic server-side migration (recommended)

Write a single migration script that:
1. Adds `cuisine_preference TEXT` column to `users`
2. `UPDATE users SET cuisine_preference = 'Mediterranean', diet_pattern = NULL WHERE diet_pattern = 'Mediterranean'`
3. Cleans `user_preferences.diet_types` of `mediterranean` values for those users
4. Cleans `household_eaters.default_diet_types` of `mediterranean` values, moving them to a new `cuisine_preferences` column if one is added to that table

**Impact:** Fully automatic. Zero user action required. No data loss. Reversible.

#### Option B — Next-login prompt

On first login after deployment, if `diet_pattern = 'Mediterranean'`, show a brief one-screen prompt:
> "We've updated how cuisine preferences work. Mediterranean has moved from your Dietary Pattern to Cuisine Preference. Does that look right?"

**Impact:** More transparent but introduces friction. Only needed if the product team wants users to acknowledge the change.

#### Option C — Leave diet_pattern populated until UI is updated

Until the profile UI ships the new separation, keep Mediterranean in `DIET_PATTERNS` but mark it specially. Post-UI-launch, run the migration.

**Impact:** Safest from a data-integrity standpoint but delays the correct model.

#### Recommendation
**Option A is the correct path.** Mediterranean stored as `diet_pattern` is already conceptually wrong — it produces scoring-only behaviour (no hard exclusions) while sitting in the same field as Keto and Vegan which have hard exclusions. The user intent was always "I like Mediterranean food" not "I follow a Mediterranean diet lifestyle". Automatic migration with the column addition is low-risk and reversible.

---

## QUESTION 6 — How many existing features would benefit from separation?

### Feature 1: Smart Planner

**Current problem:** Mediterranean in `dietPattern` triggers the dietary external search prefix path in `DIETARY_SEARCH_PREFIXES`, biasing recipe queries toward "mediterranean" as a cooking style. But it also acts as a scoring-only hint rather than a hard filter — creating an inconsistency where Keto hard-excludes carbs but Mediterranean only soft-scores.

**Benefit of separation:** Mediterranean becomes a `preferredCuisine` input to the planner. The planner already has a `preferredCuisine` field (`SmartSuggestSettings.preferredCuisine`). Post-separation, a user's saved cuisine preference could auto-populate this field, giving a richer out-of-box Smart Planner experience without any API changes.

### Feature 2: Household Compatibility Engine

**Current problem:** `household_eaters.default_diet_types` can contain Mediterranean alongside Vegetarian and Gluten-Free. The compatibility check in `household-meal-matcher.ts` (line 350) does `!compatibleDiets.includes(diet)` — treating Mediterranean as an incompatibility signal when a meal shell lacks Mediterranean in its `compatibleDiets` list. This is architecturally wrong — Mediterranean is a preference, not a restriction.

**Benefit of separation:** Dietary Patterns (Vegan, Keto, Paleo…) remain as hard/soft compatibility signals. Cuisine preferences are filtered out of the compatibility check entirely, since cuisine is a "nice to have" not a "must accommodate" constraint.

### Feature 3: Shell Matching (Tier-4 Recovery)

**Current problem:** `meal_templates.compatible_diets` includes Mediterranean as a diet. If an eater has Mediterranean as their `dietType`, shells without Mediterranean in `compatibleDiets` are penalised. This is incorrect — cuisine compatibility should not block shell selection.

**Benefit of separation:** `compatibleDiets` becomes a pure dietary-lifestyle list. Cuisine is not a factor in shell compatibility.

### Feature 4: Nutrition Boost (MealUpliftPanel / uplift-engine)

**Current problem:** `isDietExcluded(rule, dietTypes)` checks all eater `dietTypes` values including any Mediterranean entries. `excludedDietTypes` on boost rules (currently only `['vegan', 'dairy-free']`) could theoretically need to filter on Mediterranean — but Mediterranean currently has no boost exclusions, just a misclassification risk.

**Benefit of separation:** Boost rules can be defined cleanly against true dietary patterns. Mediterranean as a cuisine does not affect which ingredients are boosted.

### Feature 5: Meal Scoring

**Current problem:** `meal-scoring-service.ts` has `DIET_EXCLUDED_KEYWORDS.mediterranean` which reduces score when bacon/salami/processed appear. This scoring penalty is reasonable for a Mediterranean preference, but it sits in the same dict as strict exclusions for Vegan and Keto — which can cause scoring surprises.

**Benefit of separation:** Mediterranean scoring moves to a `cuisineScoring` pathway. Diet-based scoring (`DIET_EXCLUDED_KEYWORDS`) only covers true dietary patterns.

### Feature 6: Recipe Search Filter

**Current problem:** `routes.ts` accepts `dietPattern` as a query parameter. If a user has Mediterranean as their diet pattern, the recipe search is filtered through `shouldExcludeRecipe()` which has no hard exclusion for Mediterranean (returns `false` in the default case) — making the filtering a no-op for Mediterranean but consuming the dietPattern slot.

**Benefit of separation:** Recipe search diet filter only applies true dietary patterns. Cuisine-based search is driven by `preferredCuisine`.

### Feature 7: Analyser / Health Insights

**Current problem:** `AnalyserDetailV2.tsx` checks `p.dietPattern === "Vegan"` and `p.dietPattern === "Vegetarian"` for nutrient alerts. Mediterranean is not checked here, but the shared `dietPattern` field creates a risk of false trigger if a future analyser rule accidentally matched Mediterranean.

**Benefit of separation:** Analyser rules can target `dietaryPattern` (true lifestyle patterns) cleanly without worrying about cuisine values polluting the field.

---

## QUESTION 7 — Final Recommendation

### STATUS C — Major profile and planner redesign

**Justification:**

The separation is not cosmetic. The data model has a genuine structural flaw:

1. **One column doing three jobs.** `users.diet_pattern` currently stores: hard-exclusion dietary lifestyles (Vegan, Keto), soft-scoring lifestyle preferences (Mediterranean, DASH, MIND, Flexitarian), and a cuisine preference (Mediterranean). These three semantic categories require different handling in every consuming system.

2. **Mediterranean is the acute case.** It is simultaneously stored in `users.diet_pattern` (treated as a dietary pattern), appears in the Planner cuisine dropdown (treated as a cuisine), and is in `CUISINE_QUERIES` in `external-meal-service.ts` (treated as a cuisine search term). It exists in two incompatible models at once.

3. **Allergies are already separated at the DB level** (`users.diet_restrictions`, `household_eaters.hard_restrictions`). The remaining gap is separating Dietary Patterns from Cuisine Preferences.

4. **Schema migration is required.** A new `cuisine_preference` column is needed on `users`. The existing `diet_pattern` column stays but is narrowed to the nine true dietary patterns. This requires a migration script to reclassify existing Mediterranean rows.

5. **Logic changes span 7+ files.** `dietRules.ts` (×2 copies), `meal-scoring-service.ts`, `smart-suggest-service.ts`, `household-meal-matcher.ts`, `external-meal-service.ts`, `routes.ts`, `planner-compliance.ts`, `NutritionBoostPanel.tsx`, `AnalyserDetailV2.tsx`, and the three hardcoded arrays in `meals-page.tsx` all need updating.

6. **However, it is well-bounded.** The changes follow a clear seam. The dietary pattern engine (`dietRules.ts`) is already well-isolated. The cuisine preference concept already exists in the Smart Planner (`preferredCuisine`). The Allergies & Intolerances separation is already done in the DB. The work is completing the model that is already partially correct.

**The recommendation is to proceed, but in phases:**

- **Phase 1** — Schema: Add `cuisine_preference` column to `users`. Migrate Mediterranean rows. No UI changes yet.
- **Phase 2** — Logic: Remove Mediterranean from `DIET_PATTERNS`, `dietRules.ts` switch, `DIETARY_SEARCH_PREFIXES`, `DIET_PATTERN_TO_DIET_TYPE`. Update `meal-scoring-service.ts` to route Mediterranean to cuisine scoring.
- **Phase 3** — UI: Rename "Cuisine" label in profile to "Dietary Pattern". Add new "Cuisine Preferences" section. Update `meals-page.tsx` filter arrays.
- **Phase 4** — Household: Separate `household_eaters.default_diet_types` diet patterns from cuisine preferences. Update household compatibility check to ignore cuisine values.

---

## SUMMARY TABLE

| Concept | Current storage | Correct storage | Migration needed? |
|---------|----------------|-----------------|-------------------|
| Vegan, Vegetarian, Keto, Low-Carb, Paleo, Carnivore, Flexitarian, DASH, MIND | `users.diet_pattern` (TEXT) | `users.diet_pattern` — unchanged | No |
| Mediterranean | `users.diet_pattern` | New `users.cuisine_preference` (TEXT) | **Yes** |
| Italian, French, British, Indian, Thai, Mexican, Chinese, Japanese, Middle Eastern | Nowhere (session-only) | New `users.cuisine_preference` | No (new feature) |
| Gluten-Free, Dairy-Free | `users.diet_restrictions` (TEXT[]) | `users.diet_restrictions` — unchanged | No |
| Nuts, Eggs, Shellfish, Soy, Sesame | `users.diet_restrictions` (TEXT[]) | `users.diet_restrictions` — unchanged | No |

**Profile UI label mismatch:** The "Cuisine" label currently applied to dietary patterns is the most immediately confusing UX issue and can be corrected as a Phase 3 label change without any schema work.
