# WX9 — Experience Integration & Launch Readiness

**Date:** 2026-06-26
**Rollback tag:** `chore/wx9-rollback-before-experience-integration`
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Type:** Presentation-only polish pass
**Risk:** Low — no schema, data, route, or intelligence changes

---

## Pre-implementation confirmation

- Git status: clean before work began
- Rollback tag created: `chore/wx9-rollback-before-experience-integration`
- Architecture compliance: no new pages, no new routes, no new intelligence, no schema changes

---

## Evidence base

All changes are grounded in `THA_COMPREHENSIVE_UI_DENSITY_AND_BREATHING_SPACE_AUDIT.md` (generated 2026-06-16). No speculative improvements.

---

## Changes applied

### 1. Card component defaults (`card.tsx`)

**Before:** `CardHeader p-6`, `CardContent p-6 pt-0`
**After:** `CardHeader p-4`, `CardContent p-4 pt-0`

Reduces default card padding from 24px to 16px for data-density cards. All existing sites that already pass explicit `className` padding are unaffected (all existing CardHeader usages pass explicit className). The five unoverridden `CardContent` usages are all information-dense data cards that benefit from tighter padding.

---

### 2. Mobile bottom nav labels (`nav-bar.tsx`)

**Before:** `text-[9px]`
**After:** `text-[10px]`

9px labels are below the practical typographic floor for UI labels on mobile. 10px is the minimum comfortable reading size for short navigation labels. Audit finding #8.

---

### 3. Planner main content top padding (`weekly-planner-page.tsx`)

**Before:** `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8` (no vertical padding)
**After:** adds `pt-3 sm:pt-4`

Standardises the breathing gap between the sticky PageHeader and the first planner content. The planner has less vertical space than information pages so `pt-3 sm:pt-4` (not `pt-4 sm:pt-6`) is appropriate.

---

### 4. Planner stats row spacing (`weekly-planner-page.tsx`)

**Before:** `flex items-center justify-between flex-wrap gap-x-4 gap-y-1 mb-2`
**After:** `flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mb-3`

The stats row (variety legend, plant count, household diets toggle) is the second most important planner element but had the least breathing room. Increasing wrap gap from 4px → 8px and bottom margin from 8px → 12px gives the row appropriate weight. Audit finding #4.

---

### 5. Planner row label icon (`weekly-planner-page.tsx`)

**Before:** `h-3 w-3` (12px) row type icon
**After:** `h-3.5 w-3.5` (14px)

Raises the row label icon to the body/row-label standard (14–16px) per audit icon standards.

---

### 6. Planner row basket icon (`weekly-planner-page.tsx`)

**Before:** `h-5 w-5` (20px) ShoppingBasket icon alongside a 12px row icon
**After:** `h-4 w-4` (16px)

Reduces the visual jump between the 12px row icon and the 20px basket icon in the same div. Aligns to the body icon standard.

---

### 7. Planner desktop cell padding and height (`weekly-planner-page.tsx`)

**Before:** `p-1.5 min-h-[56px]` (6px padding, 56px min-height)
**After:** `p-2 min-h-[68px]` (8px padding, 68px min-height)

The primary planner grid was the most cramped surface. More padding and height allows chip + variety dot content to breathe. Audit finding #1.

---

### 8. Planner desktop cell meal name size (`weekly-planner-page.tsx`)

**Before:** `text-xs` (12px) for meal name buttons in desktop cells
**After:** `text-sm` (14px)

12px is at the readability threshold on 13" laptops. 14px is standard body text and appropriate for the most information-rich element in a cell. Audit finding #7.

---

### 9. Planner cell status icons (`weekly-planner-page.tsx`)

**Before:** `h-2.5 w-2.5` (10px) for frozen/basket/cooked status icons
**After:** `h-3 w-3` (12px)

10px icons are functionally near-invisible on high-density displays. 12px is the minimum for functional status affordances. Audit finding: "Never use 10px icons for functional affordances."

---

### 10. Planner meal card chips (`PlannerMealCard.tsx`)

**Before:** `h-[18px]` chips
**After:** `h-[20px]` chips

Moves chip height toward the 20px target standard. Audit finding #2 (chip anarchy).

---

## Architecture compliance

- One canonical owner per fact: unchanged
- No duplicate entities: unchanged
- No duplicate ownership: unchanged
- No duplicate persistence: unchanged
- No schema changes: confirmed
- No new intelligence: confirmed
- No new navigation: confirmed
- No new pages: confirmed

---

## Reads existing data: YES
## Writes new data: NO
## Changes meaning of existing data: NO
## Requires backfill: NO

---

## Rollback

```
git checkout chore/wx9-rollback-before-experience-integration
```

Or revert the five files touched: `card.tsx`, `nav-bar.tsx`, `weekly-planner-page.tsx`, `PlannerMealCard.tsx`.
