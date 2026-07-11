# WX4 — Food Intelligence Pages — Implementation Report

**Status:** Complete
**Date:** 2026-06-26
**Author:** Engineering (Claude Code)
**Rollback tag:** `rollback/wx4-food-intelligence-pages-20260626`
**Rollback snapshot commit:** `c510272d63b0d899972fada39a948cb12fe7d6a3` (full working tree + index)
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Pre-task HEAD:** `a8a912a4ba923e756992ed7b51e92d89ff4a7171`

---

## Objective

Create canonical **Food Intelligence Pages** so a user can click any food (Tomato,
Mushrooms, Greek yoghurt, Kimchi, Spinach, Black beans…) and see everything The
Healthy Apples *safely knows* about it — assembled from existing canonical owners,
introducing **no** duplicate ownership, persistence, schema or sync bridge.

The page answers: What is this food? Why is it good? What nutrients/benefits does it
provide? Is it seasonal? Which meals use it? Has my household eaten it? What could I
cook with it? What similar foods could I try? What Simply Better Choices relate to it?

---

## Architecture compliance (confirmed before implementation)

| Principle | Status |
|---|---|
| One canonical food identity | ✅ WS2A `CANONICAL_SEED` remains sole identity owner |
| Food page owns no food facts | ✅ Page + assembler are read-only composers |
| Canonical Food remains identity owner | ✅ via `resolveCanonicalFood` / `CANONICAL_SEED` |
| Nutrition Knowledge remains nutrient/benefit owner | ✅ via `buildFoodReport` (WS0 bridge) |
| Seasonality remains seasonality owner | ✅ via `SEASON_SEED` / `seasonForDate` |
| Household/planner history remains owner | ✅ read from `planner_*` tables only |
| Meal Intelligence remains meal owner/assembler | ✅ unchanged; food assembler is separate |
| No duplicate entities / ownership / state | ✅ assembler caches nothing, writes nothing |
| No schema / persistence / sync changes | ✅ pure reads |
| Missing knowledge hidden, never invented | ✅ every section independently nullable |

---

## What was built

### 1. Food Intelligence Assembler — `server/lib/food-intelligence-assembler.ts`

Read-only assembler mirroring the WX1 `MealIntelligenceAssembler` pattern. Owns
nothing; composes from existing canonical owners:

- **Identity / overview / nutrients / benefits / context** ← `buildFoodReport(slug)`
  (WS2F adapter over WS2A identity + WS0 knowledge). Returns `null` for any slug not
  in `CANONICAL_SEED` (preparations / containers / unknown → safe 404).
- **Seasonality** ← `seasonForDate` + `SEASON_SEED` (in-season-now check only).
- **Meals using this food** ← system Cookbook meals whose ingredients
  `resolveCanonicalFood` → this slug. Capped; links to meal detail.
- **Household history** ← `planner_entries → planner_days → planner_weeks`
  (scoped by `householdId`): cooked count, last planner week, most common meal,
  first-seen (discovered) week. Careful language — "featured in your plans".
- **Discovery** ← `discover({ food: slug, household: { enjoys } })` (WS8), where
  `enjoys` is derived from the household's planner history.
- **Simply Better Choices** ← `matchUpliftRules` (existing Nutrition Enhancement
  owner) using the food as the ingredient context. No new uplift rules.

Public API: `getFoodIntelligence(foodSlug: string, householdId?: number)`.
Always returns a complete object; never throws. `food === null` ⇒ unknown slug.

### 2. Route — `GET /api/foods/:slug/intelligence`

Thin wrapper in `server/routes.ts`. Validates slug, resolves household, calls the
assembler, returns the runtime model. Returns 404 when the slug is not a canonical
food. Computes nothing itself.

### 3. Food Page — `/foods/:slug`

New `client/src/pages/food-detail-page.tsx` registered in `client/src/App.tsx`.
Renders only validated sections using the WX2.5 Intelligence Experience System
(`IntelligenceCard`, `IntelligenceChip(Group)`, `SeasonalCard`,
`HouseholdInsightCard`, `SimplyBetterChoiceCard`). Sections: Hero · Why it matters ·
Key nutrients · Seasonality · Meals using this food · Household history · Discovery ·
Simply Better Choices. Missing sections are hidden. Unknown slug shows a calm
not-found state.

### 4. Food-chip links (low-risk wiring)

Canonical food chips on the Cookbook meal intelligence strip and the meal-detail
food intelligence surface link to `/foods/:slug` only when the slug is a validated
canonical food. Existing behaviour is otherwise unchanged. Shopping untouched.

---

## Trust & experience rules applied

- Never fabricate nutrients, benefits, history, seasonality, or confidence.
- Empty/partial knowledge ⇒ section hidden (no placeholders).
- Household language is careful: "featured in your plans", not "you ate".
- Calm, warm, food-loving, educational; progressive disclosure for long sections.

---

## Data impact

- Reads existing data: **YES**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Schema changes: **NO**
- Persistence changes: **NO**

---

## Manual verification

Verified by running the assembler against the live DB (`getFoodIntelligence`) and
the canonical owners directly:

| # | Check | Result |
|---|---|---|
| 1 | Rollback protection created | ✅ tag `rollback/wx4-food-intelligence-pages-20260626` → `c510272` |
| 2 | Report created | ✅ this file |
| 3 | `/foods/tomato` loads | ✅ Tomato: 3 benefits, 3 nutrients, context, seasonality, 2 cookbook meals, discovery |
| 4 | Rich food shows benefits/nutrients/seasonality | ✅ tomato/spinach/black-beans/kimchi all rich |
| 5 | Partial-knowledge food hides sections | ✅ mushroom: no nutrients/benefits → those sections hidden (context + discovery only) |
| 6 | Unknown slug fails safe | ✅ `not-a-food` → `food: null` → route returns 404 |
| 7 | Cookbook food chips link only when validated | ✅ chips use resolver `canonicalSlug` (always canonical) |
| 8 | Planner food chips link only when validated | ✅ same shared `CookbookMealIntelligenceStrip` (used by planner) |
| 9 | No fabricated text | ✅ every value traces to a canonical owner; empties hidden |
| 10 | Existing planner/cookbook/home unchanged | ✅ only added link wrapping + new files; build passes |
| 11 | Build passes | ✅ `npm run build` (client + server) + `tsc` clean on all changed files |

Notes:
- Discovery suggestions are linked **only** when the slug is itself a canonical
  food (`linkable` flag set server-side via `isCanonicalFood`). Variety/cuisine
  slugs with no page are shown as muted, non-clickable chips — no dead ends.
- Simply Better Choices confirmed firing (e.g. `oats` → "add chia seeds").
- Pre-existing `tsc` errors (25) live only in untouched scripts/tests.

---

## Future ideas (documented, NOT implemented)

- Food memories
- Food timeline
- Seasonal food journeys
- Food comparison pages
- Benefit pages
- Nutrient pages
- Household favourite foods
- Food discovery collections
- Food-to-shopping intelligence

---

## Rollback plan

Reset to `rollback/wx4-food-intelligence-pages-20260626`. Remove only: Food
Intelligence Assembler, the `/api/foods/:slug/intelligence` route, the food page UI
+ App route, and the food-link wiring. Do **not** remove Meal/Home/Planner
Intelligence, the Intelligence Experience System, or canonical food systems.
