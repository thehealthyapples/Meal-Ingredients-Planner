# WX1 — Meal Intelligence Assembler Implementation

**Status:** COMPLETE  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Date:** 2026-06-25  
**Rollback tag:** `rollback/before-wx1-meal-intelligence-assembler-20260625`

---

## Objective

Create a canonical `MealIntelligenceAssembler` that composes existing meal, food, nutrition, household, planner, and discovery data into a single runtime model — without introducing new ownership, duplicate state, or persistence.

Every future experience surface (Cookbook, Planner, Meal Detail, Dashboard, Search, Recommendations, mobile) should be able to call `getMealIntelligence(mealId, householdId?, plannerWeekId?)` and render whichever sections are available.

---

## Rollback Plan

To undo this workstream completely:

```bash
git tag rollback/before-wx1-meal-intelligence-assembler-20260625
# Remove only:
#   server/lib/meal-intelligence-assembler.ts   (new file)
#   any associated tests in server/tests/
# No existing behaviour changes. No schema changes.
```

---

## Architecture Compliance Review

### Principle 1 — Canonical identity ✅

- `Meal` remains the single canonical meal entity (DB `meals` table, keyed by `mealId`).
- No duplicate meal entities introduced.

### Principle 2 — One owner per fact ✅

| Fact | Owner |
|------|-------|
| Meal title, ingredients, instructions, metadata | `meals` DB table |
| Meal nutrition | `nutrition` DB table |
| Food identity, description, category | `canonical_food` / `CANONICAL_SEED` |
| Food nutrients, health benefits | `knowledge_*` / WS0 Knowledge Registry |
| Food seasonality | `shared/discovery/seasonal-map.ts` |
| Food intelligence (report) | `shared/canonical/food-report-adapter.ts` |
| Household history, favourites, meal counts | DB `planner_entries`, `planner_weeks` |
| Planner state | DB `planner_weeks`, `planner_days`, `planner_entries` |
| Nutrition enhancement (uplift) | `server/lib/uplift-engine.ts` + `server/lib/uplift-rules.ts` |
| Food discovery | `shared/discovery/engine.ts` |
| **Assembled runtime model** | `MealIntelligenceAssembler` (READS ONLY — owns nothing) |

The Assembler owns nothing. It only composes.

### Principle 3 — Progressive enrichment ✅

- Missing knowledge returns `null`, empty arrays, or empty objects — never fabricated content.
- The assembler safely returns partial intelligence when any source is unavailable.

### Principle 4 — Runtime consumes one assembled model ✅

- `getMealIntelligence(mealId, householdId?, plannerWeekId?)` is the single entry point.
- Future surfaces import this function — they never re-resolve identity themselves.

### Principle 5 — Reference vocabularies beside the spine ✅

- Nutrient lists, benefit taxonomies, diet enums all consumed from existing canonical owners — not duplicated here.

### Principle 6 — No fabricated knowledge ✅

- Every field either has canonical evidence or is absent.
- No estimated confidence, no placeholder text.

### Principle 7 — No permanent synchronisation bridge ✅

- The assembler is a read-time composition layer, not a sync bridge between two owners.

### Principle 8 — Evolution over replacement ✅

- No existing store is superseded or retired by this workstream.
- No new store is created (the runtime model is ephemeral — never persisted).

**All 8 compliance checks PASS. Implementation may proceed.**

---

## Duplicate State Confirmation

| Check | Result |
|-------|--------|
| No duplicated facts | ✅ Reads only from existing owners |
| No duplicated ownership | ✅ Assembler owns nothing |
| No duplicated persistence | ✅ No DB writes, no cache |
| No synchronisation layer | ✅ Pure read-time composition |
| No caching of permanent intelligence | ✅ Ephemeral runtime only |

---

## Phase 1 Sources

| Section | Source |
|---------|--------|
| `meal` | DB `meals` table via `meal-service.ts` / direct DB query |
| `nutrition` | DB `nutrition` table |
| `foods[]` | `resolveCanonicalFood()` per ingredient → `buildFoodReport()` for each resolved slug |
| `healthBenefits` | Aggregated from per-food `FoodReportKnowledge.healthBenefits` |
| `seasonality` | `seasonForDate(now)` + `SEASON_SEED` cross-ref against resolved food slugs |
| `household` | DB `planner_entries` JOIN `planner_weeks` WHERE householdId — meal count + last cooked |
| `planner` | DB `planner_entries` WHERE mealId — current planner appearances (where plannerWeekId given) |
| `nutritionEnhancement` | `uplift-engine.ts` `matchUpliftRules()` against meal ingredients |
| `discovery` | `discover()` from `shared/discovery/engine.ts` for first resolved food |
| `trust` | Confidence based only on validated canonical evidence |
| `metadata` | Assembly timestamp, source enumeration |

---

## New Files

| File | Purpose |
|------|---------|
| `server/lib/meal-intelligence-assembler.ts` | The assembler and `getMealIntelligence()` |

---

## Files NOT Changed

All existing services, pages, components, routes, schema, and seeds remain unchanged.

---

## SUGGESTIONS (Do Not Implement)

Future services that could plug directly into the assembler:

- **S1 — Meal Story**: Call `stories()` from WS10 with this meal's ingredients/history as context. The assembler would add a `story` section — household memories around this meal.
- **S2 — Seasonal Intelligence**: Cross-reference the meal's resolved food slugs against the current UK season. Surface "which ingredients in this meal are at their seasonal best?" as a `seasonalPeak` sub-section.
- **S3 — Food Discovery per ingredient**: For each resolved food in the meal, call `discover()` with the household's `enjoys` list. Currently only the anchor food (first resolved ingredient) is used — future: per-ingredient sections.
- **S4 — Family Insights**: Pull `household_eaters` profiles and surface which eaters this meal is naturally suitable for. Uses the existing planner compatibility score from `household-meal-matcher.ts`.
- **S5 — Nutrition Timeline**: Show how this meal's nutrients fit into the household's weekly diary. Reads `food_diary_entries` — pure read, pure composition.
- **S6 — Simply Better Choices**: Surface the top uplift suggestion as a gentle one-line nudge. Derives from the existing `nutritionEnhancement` section — just picks the highest-priority suggestion.
- **S7 — Pantry Intelligence**: Cross-reference meal ingredients against the household's pantry knowledge. Pure read from `pantry_ingredient_knowledge`.
- **S8 — Shopping Intelligence**: Surface which ingredients in this meal are typically available at which supermarkets. Pure read from product match history.

All suggestions require zero architectural change — they are additional composition sources plugged into the existing assembler interface.

---

## Verification Checklist

- [x] Rollback tag created: `rollback/before-wx1-meal-intelligence-assembler-20260625`
- [x] Report created at `docs/investigations/WX1_MEAL_INTELLIGENCE_ASSEMBLER_IMPLEMENTATION.md`
- [x] Assembler compiles without TypeScript errors
- [x] Existing services remain unchanged
- [x] No duplicated ownership introduced
- [x] Runtime model safely returns partial information
- [x] Unknown knowledge omitted rather than fabricated
- [x] Existing application behaviour unchanged

---

## Status

**COMPLETE** — assembler created at `server/lib/meal-intelligence-assembler.ts`. No schema changes. No UI changes. No route changes. No existing files modified.
