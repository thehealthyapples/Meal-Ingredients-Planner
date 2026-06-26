# WS0X.6 — Meal Detail Food Intelligence Rollout

**Status:** ✅ IMPLEMENTED
**Date:** 2026-06-24
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**HEAD at implementation:** `f531216`
**Risk classification:** 🟡 AMBER — UI changes, new user-facing behaviour, no schema changes, no new data model

---

## Rollback Protection (Mandatory First Step — CONFIRMED)

| Item | Identifier |
|------|-----------|
| Rollback tag | `ws0x6-rollback-20260624` |
| Commit protected | `f531216` feat(ws11): Seasonal Stories Engine |
| Rollback command | `git checkout ws0x6-rollback-20260624` |

**To undo all WS0X.6 changes:**
```bash
git checkout ws0x6-rollback-20260624 -- \
  client/src/pages/meal-detail-page.tsx \
  server/services/nutrition-knowledge-registry.ts

# Remove new files:
git rm server/services/meal-food-intelligence.ts
git rm client/src/components/meal-detail/MealFoodIntelligenceSection.tsx
git rm docs/investigations/WS0X_6_MEAL_DETAIL_FOOD_INTELLIGENCE_ROLLOUT.md
```

---

## Files Changed

| File | Change | Type |
|------|--------|------|
| `server/services/nutrition-knowledge-registry.ts` | Added `resolveIngredientSlugs()` helper export | Modified |
| `server/services/meal-food-intelligence.ts` | **NEW** — `buildMealFoodIntelligence()` service | Created |
| `server/routes.ts` | Added `GET /api/meals/:id/food-intelligence` | Modified |
| `client/src/components/meal-detail/MealFoodIntelligenceSection.tsx` | **NEW** — React component | Created |
| `client/src/pages/meal-detail-page.tsx` | Imported + rendered `MealFoodIntelligenceSection` | Modified |

---

## Design Decisions

### Source of truth verification

All intelligence consumed from existing WS0 sources only:

| Data | Source | Consumed via |
|------|--------|-------------|
| Nutrients | `knowledge_food_nutrients` table | `resolveIngredientsToKnowledgeSummary()` |
| Health benefits | `knowledge_food_benefits` table | `resolveIngredientsToKnowledgeSummary()` |
| Seasonal highlights | `SEASON_SEED` + `seasonForDate()` | Direct import in service |
| Food origins | `FOOD_CONTEXT_SEED.originRegion` | `getFoodContext()` in service |
| Availability | `FOOD_CONTEXT_SEED.availability` | `getFoodContext()` in service |
| Plant count | `knowledge_foods.category` | `listFoods()` in service |
| Discovery hooks | WS8 `discover()` engine | Direct import in service |

**No hardcoded meal intelligence. No duplicated benefit lists. No local mappings.**

### API endpoint

`GET /api/meals/:id/food-intelligence`
- Auth-protected (same pattern as other meal routes)
- Returns `MealFoodIntelligence` object or `EMPTY` when WS0 coverage is absent
- Dynamic import of service (consistent with adapt route pattern)

### Component placement

`MealFoodIntelligenceSection` is rendered BEFORE the trust sections in Meal Detail page:
```
[Adapt results if any]
[WS0X.6] MealFoodIntelligenceSection  ← near top, first piece of intelligence
[Trust sections: TrustSummary, FamilyConfidence, Adaptations, SimplyBetterChoices]
[Main grid: Image + Nutrition | Ingredients + Instructions]
```

### Progressive disclosure

- "Why This Meal Is Great" chips: always visible (if data present)
- "More Food Intelligence ▼": collapsed by default
- Entire section hidden when WS0 has no coverage for the meal's ingredients

### Empty state handling

- Component returns `null` (renders nothing) when:
  - `isLoading` (loading state — not a flash of empty)
  - `!data` (API call pending)
  - `data.highlights.length === 0 && data.nutrients.length === 0 && data.benefits.length === 0`
- No placeholder dashes. No "No data" messages. Clean silence.

### Trust guards

| Risk | Safeguard |
|------|-----------|
| Overstating nutrition | Only surfaces nutrients with WS0 editorial backing; no quantities, no percentages |
| Medical claims | All benefit language comes from editorial `knowledge_health_benefits` table; no inferred claims |
| Fabricating certainty | Seasonal info only shown when `SEASON_SEED[currentSeason]` contains the food slug |
| Discovery invention | `discover()` uses WS8/WS7 editorial relationship graph only; best-effort, silently suppressed if empty |
| Wrong availability | `FOOD_CONTEXT_SEED` is editorially authored with controlled vocabulary |

---

## Implementation: Part A — Why This Meal Is Great

Chips generated from actual WS0 data:
- `"Contains N plant foods"` — counts matched ingredients in plant WS0 categories
- `"Rich in [nutrient]"` — highest-priority nutrient from `HIGHLIGHT_NUTRIENT_PRIORITY` list
- `[benefit name]` — first health benefit from WS0
- `"[Food] in season now"` — only when current UK season matches SEASON_SEED

Maximum 5 chips. Never fabricated.

---

## Implementation: Part B — Progressive Food Intelligence Expander

Section title: **More Food Intelligence ▼** (collapsed by default)

Subsections (only shown when data present):
1. **Key Nutrients** — all WS0 nutrients for matched ingredients, deduplicated
2. **Health Benefits** — all WS0 health benefits, deduplicated  
3. **Seasonal Highlights** — ingredients in current UK season (SEASON_SEED only)
4. **Food Origins** — ingredient → origin region (FOOD_CONTEXT_SEED), generic origins suppressed
5. **Availability** — specialist/rare items only (not surfaced for mainstream foods)
6. **You May Also Enjoy** — WS8 discovery on first resolved ingredient, type "similar", max 3

---

## Implementation: Part C — Discovery Hooks

```
discover({ food: firstResolvedSlug, household: { enjoys: [] }, types: ["similar"], limitPerType: 3 })
```

- Tries up to 3 ingredient slugs; returns first with results
- Maximum 3 suggestions
- Silently omitted if no WS8 relationships found (graceful empty state)

---

## Implementation: Part D — Empty States

All empty states handled:
- Section hidden when no WS0 coverage (returns `null`)
- Subsections hidden individually when empty
- No placeholder text, no dashes, no "No data" messages
- Loading state hidden (not shown as flash)

---

## Manual Test Steps

### TEST 1: Why This Meal Is Great appears
1. Navigate to a meal with common ingredients (e.g., Chicken Marengo — has tomatoes, garlic, olives)
2. Verify "Why This Meal Is Great" section appears near top of page
3. Verify chips are shown (e.g., "Contains N plant foods", "Rich in [nutrient]")

### TEST 2: Expand food intelligence
1. Click "More Food Intelligence ▼"
2. Verify section expands
3. Verify nutrients are displayed in "Key Nutrients" subsection

### TEST 3: Benefits displayed
1. With expanded section open
2. Verify "Health Benefits" subsection shows benefit claims

### TEST 4: Discovery suggestions displayed
1. With expanded section open
2. Verify "You May Also Enjoy" shows 1–3 ingredient names
3. Verify they are related (similar type of food) to a meal ingredient

### TEST 5: Limited WS0 coverage (no broken UI)
1. Open a meal with unusual/niche ingredients not in WS0
2. Verify either: section is completely hidden, OR chips shown for what IS covered
3. Verify no broken sections with empty boxes

### TEST 6: No placeholder dashes
1. Check all subsections — verify none show "—" or "No data" text
2. Subsections should be absent, not empty

### TEST 7: Seasonal only when applicable
1. Current season: Summer (June 2026)
2. Open a meal with tomatoes or courgette
3. Verify "Seasonal Highlights" subsection appears with correct season label
4. Open a meal without any summer seasonal foods
5. Verify "Seasonal Highlights" subsection is absent

---

## Trust Check

**Could this overstate nutrition?**
No. Nutrients come from `knowledge_food_nutrients` (editorial, reviewed). No quantities or percentages shown — only nutrient names. No "high in" claims based on percentages.

**Could this imply medical outcomes?**
No. Benefit language is `"Supports heart health"`, `"Supports digestion"` — supportive framing from `knowledge_health_benefits` editorial table. No "prevents", "cures", "treats" language.

**Could this fabricate certainty?**
No. Seasonal info requires the food to be in `SEASON_SEED[currentSeason]`. Origins require `FOOD_CONTEXT_SEED[slug]` entry. Discovery requires WS8 relationship graph edges. When absent: silent omission.

---

## Performance Review

- `GET /api/meals/:id/food-intelligence` calls:
  - 1× `listFoods()` (knowledge_foods table, ~265 rows)
  - 1× `resolveIngredientsToKnowledgeSummary()` (also calls `listFoods()` internally — acceptable double call for isolation)
  - N× `getNutrientsForFood()` + `getFoodBenefitsForDisplay()` per matched food slug (parallel via `Promise.all`)
  - `discover()` — pure in-memory function, no DB call
  - `getFoodContext()` — pure in-memory lookup in `FOOD_CONTEXT_SEED`, no DB call
- Client: 1 additional query per Meal Detail page load (staleTime: 5min, cached after first load)
- Render: adds 1 Card component with lazy expansion (no layout shift)
- **No impact on existing query count for other pages**

---

## Scope Lock — Surfaces NOT modified

Per specification, only Meal Detail was changed. The following were NOT touched:

- ✅ Planner — not modified
- ✅ Cookbook — not modified  
- ✅ Dashboard — not modified
- ✅ Discovery UI — not modified
- ✅ Pantry Explore — not modified
- ✅ Nutrition Report — not modified
- ✅ Shopping List — not modified

---

## SUGGESTION — Future Rollout Opportunities

Intelligence from this foundation could be extended to:

1. **Cookbook browse** — per-meal nutrient/benefit preview chips on meal cards
2. **Planner meal card** — seasonal callout badge ("In season") 
3. **Dashboard** — weekly food intelligence summary card
4. **Shopping List** — benefit chip on ingredient row expansion
5. **Diary** — daily food intelligence summary below diary entries

These are SUGGESTIONS only. Not in scope for WS0X.6.

---

## Definition of Done — Checklist

- ✅ Why This Meal Is Great implemented
- ✅ Progressive disclosure implemented (collapsed by default)
- ✅ Nutrients displayed (in expanded section)
- ✅ Benefits displayed (in expanded section)
- ✅ Discovery hooks displayed (in expanded section)
- ✅ Seasonal highlights supported (current UK season only)
- ✅ Origin supported (non-generic origins only)
- ✅ Availability supported (specialist/rare only)
- ✅ Empty states handled (section hidden, not placeholder text)
- ✅ Source of truth verified (all from WS0 / food-context / SEASON_SEED / WS8)
- ✅ Trust check completed (no fabrication, no medical claims)
- ✅ TypeScript clean on new files
- ✅ Project file created

---

## Data Impact

| Category | Impact |
|----------|--------|
| Reads existing data | YES |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |
