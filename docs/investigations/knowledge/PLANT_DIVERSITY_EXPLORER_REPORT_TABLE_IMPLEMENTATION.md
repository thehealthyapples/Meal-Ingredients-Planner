# Plant Diversity Explorer — Report Table Implementation

## Rollback Identifier

**Tag:** `rollback/plant-explorer-report-table-pre`
**Commit at tag:** `1e83f32` (fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools)

To roll back:
```
git checkout rollback/plant-explorer-report-table-pre -- client/src/components/PlantDiversityExplorer.tsx
```

---

## Files Changed

| File | Change type |
|------|-------------|
| `client/src/components/PlantDiversityExplorer.tsx` | UI presentation only — data logic untouched |

---

## Problem Statement

The previous implementation used individual `<button>` elements styled with `grid-cols-[1fr_auto]` / `md:grid-cols-[1fr_auto_auto_auto]`. Because each row defined its own grid, column widths were determined per-row by their individual content — not shared across rows. This produced a card-list feel rather than a report-table feel.

The root issue: independent grids cannot enforce consistent column widths across multiple rows.

---

## Solution

Replaced the div/button grid layout with a semantic `<table>` element. The browser's table layout algorithm inherently aligns all cells in the same column to a common width, regardless of individual row content. This is the defining property of a report table.

---

## Implementation Summary

### Removed

- `PlantTableHeader` component (div-based grid header)
- `PlantTableRow` component (button-based grid row)

### Added

**`PlantReportRow`** — returns a React fragment of two `<tr>` elements:
1. Collapsed row: `<tr>` with `onClick`/`onKeyDown`/`tabIndex`/`aria-expanded` for full keyboard and accessibility support
2. Expanded row: `<tr><td colSpan={4}>…</td></tr>` — spans all columns

**`PlantReportTable`** — wraps all rows in a `<table>` with a `<thead>` header row

### Column layout

| Column | Desktop | Mobile |
|--------|---------|--------|
| Plant | Always visible | Always visible |
| Meals | `md:table-cell` | Hidden |
| Days | `md:table-cell` | Hidden |
| Key Nutrients | `md:table-cell` | Hidden |

### Mobile stacked layout

On mobile, Meals / Days / Key Nutrients columns are hidden (`hidden md:table-cell`). The Plant cell carries a stacked second line showing the top two nutrients, matching the spec exactly:

```
Tomatoes
Lycopene · Vitamin C
```

The nutrient line inside the Plant cell is hidden on desktop (`md:hidden`) since the Key Nutrients column takes over there.

### Expanded content (unchanged from previous implementation)

The expanded `<td colSpan={4}>` contains the same three sections as before:
1. **Varieties Used** — chip list (conditional on variants existing)
2. **Meals Contributed** — meal name · day pairs (always shown)
3. **Benefits** — benefit summary text + nutrient chips (conditional on data existing)

All content sourced from existing `PlantRow` data. No new calculations.

### Accessibility

- `<tr>` has `tabIndex={0}`, `onClick`, `onKeyDown` (Enter/Space), `aria-expanded`
- Chevron icon has `aria-hidden="true"`
- Emoji span has `aria-hidden="true"`
- `<th>` elements in thead (semantic column headers)

---

## What Was Preserved Unchanged

| Element | Status |
|---------|--------|
| `computePlantData()` | Byte-for-byte identical |
| `WEEKLY_PLANT_TARGET`, `CATEGORY_ORDER`, `CATEGORY_SUGGESTIONS` | Unchanged |
| `toDisplayName()`, `stripLeadingQuantity()` | Unchanged |
| `CategoryGrid` | Unchanged |
| `CategoryCompletionSuggestions` | Unchanged |
| `ReportSectionHeader` | Unchanged |
| Progress bar, count display, status messages | Unchanged |
| `getCategoryEmoji` call + imagery comment | Unchanged |
| `getNutritionBenefit` usage | Unchanged |
| Modal structure, opaque background, scroll | Unchanged |
| Expanded content sections and labels | Unchanged |

---

## Before / After

### Before (div/grid per-row)

```html
<!-- Each row independently sized its own columns -->
<div class="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto]">
  <button class="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto]">
    ...
  </button>
</div>
```

Problem: `auto` columns sized by each row's own content → columns never aligned across rows.

### After (semantic table)

```html
<table class="w-full text-left border-collapse">
  <thead>
    <tr>
      <th>Plant</th>
      <th class="hidden md:table-cell">Meals</th>
      <th class="hidden md:table-cell">Days</th>
      <th class="hidden md:table-cell">Key Nutrients</th>
    </tr>
  </thead>
  <tbody>
    <tr> <!-- data row --> </tr>
    <tr> <!-- expanded row (colSpan=4) --> </tr>
  </tbody>
</table>
```

Browser table layout enforces column alignment. Meals / Days / Key Nutrients are hidden on mobile; nutrients shown as stacked line in the Plant cell instead.

---

## Trust Check

| Check | Result |
|-------|--------|
| Plant count unchanged | `computePlantData()` not modified |
| Nutrient data unchanged | `getNutritionBenefit()` still sole source, no new lookups |
| Benefit text unchanged | All benefit text comes from existing library summaries |
| Category completion unchanged | `CategoryGrid` + `CategoryCompletionSuggestions` not modified |
| No new calculations | Display/rendering only |

---

## Manual Tests

### 1. Open Plant Diversity Explorer
- Report table visible with Plant / Meals / Days / Key Nutrients columns ✓
- ReportSectionHeader label visible above table ✓

### 2. Locate any plant (e.g. Spinach)
- Meals visible in Meals column (desktop) ✓
- Days visible in Days column (desktop) ✓
- Nutrients visible in Key Nutrients column (desktop) ✓
- Mobile: plant name + stacked nutrient line ✓

### 3. Expand a plant row
- Varieties Used section present (if variants exist) ✓
- Meals Contributed section present (meal · day pairs) ✓
- Benefits section present (summary text + nutrient chips) ✓

### 4. Mobile
- Compact collapsed rows: Plant name + nutrient line ✓
- No horizontal scroll ✓
- Expanded content shows Meals Contributed + Benefits ✓

### 5. Count validation
- `computePlantData()` is unchanged — Explorer count identical to planner counter ✓

---

## Suggestions (Not Implemented)

- **Sticky column header**: Make the `<thead>` sticky within the scrollable container so column labels stay visible while scrolling a long plant list.
- **Real imagery**: Replace emoji fallbacks with ingredient photography. Extension point exists in `ingredient-imagery.ts`.
- **Sort controls**: Allow sorting the report by Meals count, Days count, or category.
- **Planner history comparison**: Show plant count trend vs previous weeks.
- **Category grouping in table**: Add optional visual dividers between category groups (Vegetables / Fruits / Legumes etc.) in the report table.
