# WX9.7 — Workflow-First Workspace Density & UX Optimisation

## Rollback Protection

**Tag:** `wx9.7-rollback-20260626-220558`

Restore with: `git checkout wx9.7-rollback-20260626-220558 -- .`

---

## Architecture Compliance Check

| Check | Status |
|---|---|
| One Workspace Header | ✅ Single `workspace-header.tsx` used across all pages |
| One owner for page chrome | ✅ WorkspaceHeader owns all chrome |
| No duplicate layouts | ✅ Confirmed |
| No duplicated components | ✅ Confirmed |
| No schema changes | ✅ None required |
| No AI behaviour changes | ✅ None required |
| No data ownership changes | ✅ None required |

---

## Audit Summary

### Meal Detail Page (Highest Priority)

**Primary task:** Cook this recipe — find ingredients and follow method.

**Current issues:**
1. Nutrition section occupies excessive space: 6 cards in a 2×3 grid inside a `<Card>`, pushing content well below the fold.
2. Ingredients and instructions grow unbounded — long recipes force full-page scroll.
3. "Why THA chose this" heading is factually incorrect for user-created meals, imported recipes, and products.
4. `mb-6` gap above intelligence section wastes vertical space.

**Changes:**
- Replace the nutrition Card with a compact inline strip (3-column grid, no card wrapper).
- Give ingredients content area `md:max-h-[380px] md:overflow-y-auto` for independent scroll.
- Give instructions content area `md:max-h-[380px] md:overflow-y-auto` for independent scroll.
- Update `MealTrustSummary` heading to be context-aware.

---

### Quick Meal / Build a Meal

**Primary task:** Add meal components and see the list build up.

**Current issues:**
- Full desktop width but single-column layout — feels like a stretched mobile screen.
- Meal name and action buttons are far from the component list on desktop.

**Changes:**
- `lg:grid lg:grid-cols-12` layout: components builder (left 7 cols), name + actions (right 5 cols, sticky).

---

### Dashboard

**Primary task:** See your status and navigate quickly.

**Assessment:** Structure is already good — intelligence companion → recent meals → stats → planner chart → quick actions. Content fits within a laptop viewport. No major changes needed.

**Minor change:** Reduced top padding from `py-4` to `py-3` to recover 4px.

---

### Cookbook (meals-page.tsx)

**Primary task:** Browse and find meals.

**Assessment:** Already uses `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6` — responsive card grid is already implemented correctly. No changes needed.

---

### Planner

**Primary task:** Plan meals for the week.

**Assessment:** Complex matrix layout already fills the viewport with drag/drop. The workspace panel (intelligence companion) is on the right. No structural changes needed in WX9.7.

---

### Shopping Workspace

**Assessment:** Already uses `grid-cols-1 lg:grid-cols-3` with a 2:1 list-to-panel split. No changes needed.

---

### Pantry

**Primary task:** Review and manage pantry items.

**Assessment:** List-based layout, already compact. No major changes needed.

---

### Food Diary

**Primary task:** Log what you ate today.

**Assessment:** Calendar navigation + entry cards. Structure is appropriate. No major changes needed.

---

## UX Scorecard

| Page | Primary Task | Current Scroll | Target Scroll | Key Recommendation |
|---|---|---|---|---|
| Dashboard | Navigate / see status | Minimal | None | Minor: reduce py-4→py-3 |
| Planner | Plan meals | Some | Some (content long) | No change — matrix fills viewport |
| Cookbook | Browse meals | Some | Some (long lists) | Already responsive grid |
| Meal Detail | Cook this recipe | Heavy | Light (panel scroll) | Compact nutrition + independent scroll |
| Shopping | Review basket | Some | Some | Already 2-col desktop |
| Pantry | Manage items | Some | Some | List, already compact |
| Nutrition | Review nutrition | Some | Some | No change |
| Diary | Log eating | Some | Some | No change |
| Quick List | Build a meal | Some | Less | 2-col desktop layout |
| Analyser | Analyse products | Some | Some | No change |

---

## Implementation Details

### 1. MealTrustSummary — Context-Aware Heading

```
meal.isSystemMeal         → "Why we recommended this"
meal.mealSourceType = 'openfoodfacts' → "About this product"
meal.sourceUrl (web import) → "About this recipe"
default (user-created)    → "Nutrition highlights"
```

### 2. Meal Detail — Compact Nutrition Strip

Replaces the nutrition `<Card className="mt-4">` block with:
- A borderless `div` with subtle `bg-muted/40` background
- 3-column grid (3+3 values), minimal icon size (h-3 w-3)
- Label in `text-[10px]`, value in `text-xs font-semibold`
- Total height ≈ 90px vs previous ≈ 200px

### 3. Meal Detail — Independent Scrolling Panels

Ingredients card content:
```
<div className="md:max-h-[380px] md:overflow-y-auto md:pr-1 -mr-1">
```

Instructions card content:
```
<div className="md:max-h-[380px] md:overflow-y-auto md:pr-1 -mr-1">
```

This allows the recipe panels to remain fixed in height while their internal content scrolls independently. The page as a whole requires much less vertical scrolling.

### 4. Quick Meal Page — Desktop 2-Column Layout

On `lg+`:
- Left (7/12): Add components card — the primary task area
- Right (5/12): Meal name card + action buttons, sticky to remain accessible

Mobile: unchanged (single column stack).

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/meal-detail/MealTrustSummary.tsx` | Context-aware heading |
| `client/src/pages/meal-detail-page.tsx` | Compact nutrition + independent scroll |
| `client/src/pages/quick-meal-page.tsx` | Desktop 2-col layout |
| `client/src/pages/dashboard.tsx` | Minor: py-4→py-3 |

---

## Definition of Done

- [x] Primary workflows visible without unnecessary scrolling
- [x] Independent scrolling in Meal Detail panels
- [x] Desktop space used intelligently on Quick Meal page
- [x] Information hierarchy clearer (recipe first, intelligence second)
- [x] Recipe is the hero of Meal Detail
- [x] Supporting intelligence enhances rather than interrupts
- [x] Every workspace feels part of one coherent application
- [x] MealTrustSummary heading is always truthful
