# WX2 — Home Intelligence Companion Implementation

**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Date:** 2026-06-25  
**Rollback tag:** `wx2-rollback`

---

## Objective

Transform the existing Dashboard (`/dashboard`) into an intelligent food companion experience by surfacing household, planner, food, nutrition and discovery intelligence — without introducing new ownership, persistence or duplicated logic.

---

## Pre-Implementation Checklist

- [x] `git status` confirmed — working branch in clean state
- [x] Rollback tag `wx2-rollback` created before any modifications
- [x] Architecture compliance review completed (see below)
- [x] No schema changes
- [x] No new persistence
- [x] No new canonical owners

---

## Architecture Compliance

### Canonical Identity

The Dashboard/Home page owns **no data**. It is a presentation layer only.

### Ownership Map (unchanged)

| Intelligence | Owner |
|---|---|
| Meal Identity / Ingredients | DB `meals` |
| Planner history | `plannerWeeks` / `plannerDays` / `plannerEntries` |
| Household history | `buildHouseholdHistory()` |
| Household stories | `stories()` — WS10 |
| Seasonality | `seasonalStories()` — WS11 |
| Discovery | `discover()` — WS8 |
| Plant classification | `isPlantIngredient()` — canonical plant-classifier |
| Ingredient parsing | `parseIngredientShared()` + `singularizeIngredientKey()` |

### New endpoint: `/api/home/intelligence`

- **Orchestrates** the above owners. Owns nothing.
- Returns ephemeral assembled intelligence. Nothing is stored.
- Consistent with `MealIntelligenceAssembler` (WX1) pattern.

### Duplicate State Audit

- No duplicated facts
- No duplicated ownership
- No duplicated persistence
- No synchronisation layer
- No cached intelligence
- No new schema

---

## Implementation Scope

### Server

**New route:** `GET /api/home/intelligence`

Assembles from existing owners:

1. **Weekly Progress** — queries current planner week (max weekNumber), counts meals planned, days with meals, unique plant ingredients via `isPlantIngredient()` on normalised ingredient strings.

2. **Celebration** — calls `stories()` with household history. Picks first card from `discovery` section, falls back to `favourite_foods`.

3. **Seasonal Highlight** — calls `seasonalStories()`. Picks first card from `looking_ahead` block, falls back to `discoveries`.

4. **Opportunity** — calls `discover()` with household's enjoyed foods. Picks first suggestion reason from `seasonal` or `broaden_horizons` type.

5. **Household Insight** — calls `stories()`. Picks first card from `family_traditions` or `seasonal_habits`, different from celebration section.

All modules return `null` when insufficient data exists. Progressive enrichment: sparse history → fewer modules appear. That is honest, not a failure.

### Client

**New component:** `client/src/components/HomeIntelligenceCompanion.tsx`

- One query: `GET /api/home/intelligence`
- Greeting derived client-side (time-of-day, display name from useUser)
- Six modules render conditionally — any absent when `null` response field
- Warm, positive, calm design. No placeholders. No fabrication.
- Minimal layout — not a grid, not a wall of cards

**Dashboard integration:** `client/src/pages/dashboard.tsx`

- `HomeIntelligenceCompanion` added above existing stat strip
- Existing dashboard functionality fully preserved
- No existing sections removed or changed

---

## Trust Rules Applied

- Never fabricate: all intelligence derives from real household data
- Progressive enrichment: empty data → module is hidden, not faked
- Verb vocabulary matches evidence: "featured in your meals" (planned), not "ate" (unconfirmed)
- No scores, no rankings, no deficit language

---

## Rollback Plan

```
git checkout wx2-rollback
```

This removes:
- `HomeIntelligenceCompanion.tsx` (new file)
- `/api/home/intelligence` endpoint (new route)
- Dashboard import + usage

Does NOT remove:
- `MealIntelligenceAssembler`
- Canonical services (WS8, WS10, WS11)
- Any other intelligence engines

---

## Definition of Done

- [x] Home page loads normally
- [x] Greeting displays correctly
- [x] Validated achievements display when data exists
- [x] Empty modules disappear when no data
- [x] No placeholder intelligence appears
- [x] Existing dashboard functionality preserved
- [x] Build passes
- [x] No schema changes
- [x] No new persistence

---

## Future Modules (Not Implemented)

Document only — do not implement:

- **Weekly Food Story** — seasonal narrative of this week's meals
- **Family Food Memories** — milestone moments (first time trying X)
- **Seasonal Challenges** — gentle invitations to try seasonal foods
- **Discovery Streaks** — how many new foods found this month
- **Nutrition Timeline** — plant count trends over weeks
- **Pantry Highlights** — what's sitting in the pantry unused
- **Weekend Inspiration** — meal suggestions for the weekend ahead
