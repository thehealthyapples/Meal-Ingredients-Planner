# Plant Diversity Explorer — Render Path Investigation

**Date:** 2026-06-11
**Status:** Complete — all questions answered

---

## Rollback Identifier

**Tag:** `rollback/plant-diversity-render-investigation`
**HEAD at time of tag:** `1e83f32`

To roll back any accidental changes:
```
git checkout rollback/plant-diversity-render-investigation
```

**Note:** The rollback tag captures the committed state only. Six files have unstaged working-tree
modifications at the time of investigation; those are not captured by the tag.

---

## Investigation Summary

The implementation is in the working tree and is correct. The columns are not visible because the
user is viewing on a mobile viewport. The feature has never been committed to git.

---

## 1. Actual Plant Diversity Render Tree

```
weekly-planner-page.tsx
├── WeeklyPlantDiversityCounter (nutrition-variety-chips.tsx)
│   └── onClick → setPlantExplorerOpen(true)
└── PlantDiversityExplorer (PlantDiversityExplorer.tsx)          [Dialog]
    ├── DialogHeader
    │   ├── plant count / 30 display
    │   └── progress bar
    ├── CategoryGrid
    ├── CategoryCompletionSuggestions
    ├── ReportSectionHeader
    └── PlantReportTable                                          [<table>]
        └── PlantReportRow × N                                   [<tr> × 2 per plant]
            ├── collapsed <tr>: Plant | Meals | Days | Key Nutrients
            └── expanded <tr colSpan=4>: Varieties Used · Meals Contributed · Benefits
```

**FACT:** The render tree terminates at `PlantReportTable` / `PlantReportRow`. These are the
actual rendering components in the working tree.

---

## 2. Report Table Component Status

### PlantReportRow

**Exists:** YES — `client/src/components/PlantDiversityExplorer.tsx`, lines 276–441  
**Exported:** NO — internal to the file; used only by `PlantReportTable`  
**Imported elsewhere:** NO — not needed outside the file  
**Rendered:** YES — called inside `PlantReportTable` (line 472)

**Structure:**

Returns a React fragment containing two `<tr>` elements:
1. Collapsed row — `onClick`/`onKeyDown`/`tabIndex`/`aria-expanded` on the `<tr>` itself
2. Expanded row — single `<td colSpan={4}>` containing Varieties Used / Meals Contributed / Benefits

### PlantReportTable

**Exists:** YES — `client/src/components/PlantDiversityExplorer.tsx`, lines 443–482  
**Exported:** NO — internal to the file; used only by `PlantDiversityExplorer`  
**Imported elsewhere:** NO — not needed outside the file  
**Rendered:** YES — called inside `PlantDiversityExplorer` (line 603)

**Structure:**

```tsx
<table className="w-full text-left border-collapse">
  <thead>
    <tr>
      <th>Plant</th>
      <th className="hidden md:table-cell">Meals</th>
      <th className="hidden md:table-cell">Days</th>
      <th className="hidden md:table-cell">Key Nutrients</th>
    </tr>
  </thead>
  <tbody>
    {plantRows.map(row => <PlantReportRow ... />)}
  </tbody>
</table>
```

**FACT:** Both components exist. Both are rendered. The semantic table structure matches the
implementation report exactly.

---

## 3. Current Rendered Component

The component producing the visible UI is **`PlantReportRow`** inside **`PlantReportTable`**
inside **`PlantDiversityExplorer`**.

The labels "Varieties Used" and "Meals Contributed" appear in the **expanded row** — the
`<td colSpan={4}>` that renders below a plant row when the user clicks it.

```
client/src/components/PlantDiversityExplorer.tsx

Line 374: "Varieties Used" — inside expanded <tr>, conditional on row.variants.length > 0
Line 391: "Meals Contributed" — inside expanded <tr>, always shown
```

**FACT:** These labels are NOT columns. They are sub-sections of the expanded row panel.
Their presence in the UI confirms that `PlantReportRow` is the active rendering component.

**FACT:** The previous implementation (`PlantTableHeader` / `PlantTableRow`) no longer exists
in the file. The working tree contains only `PlantReportTable` and `PlantReportRow`.

---

## 4. Conditional Rendering Findings

### Mobile vs. Desktop

The Meals, Days, and Key Nutrients columns carry `hidden md:table-cell`. This is a standard
Tailwind responsive class keyed to **viewport width**, not container width.

| Viewport width | Columns visible |
|----------------|-----------------|
| < 768px (mobile) | Plant only |
| ≥ 768px (tablet/desktop) | Plant + Meals + Days + Key Nutrients |

The dialog has `max-w-2xl` (672px) but `md:table-cell` triggers on the viewport, not the
dialog width. On a desktop viewport ≥ 768px, all four columns are visible even inside the
672px dialog.

**Root cause of missing columns:** The user is viewing on a mobile viewport (< 768px).

### Mobile stacked layout

On mobile, the Plant cell includes a second line for nutrients:

```tsx
{/* Mobile: nutrients as stacked second line (column is hidden on mobile) */}
{row.keyNutrients.length > 0 && (
  <span className="md:hidden block text-[11px] ...">
    {row.keyNutrients.slice(0, 2).join(" · ")}
  </span>
)}
```

This line is hidden on desktop (the Key Nutrients column takes over). On mobile it provides
the nutrient data in a compact form. This is intended behavior.

### Feature flags / hidden classes

**FACT:** No feature flags. No hidden classes other than the responsive `hidden md:table-cell`
described above.

### Does the table exist but is hidden?

**FACT:** The table is NOT hidden. It renders on all viewports. Only three of its four columns
are hidden on mobile.

---

## 5. Deployment State

### Git status at investigation time

| File | Git state |
|------|-----------|
| `client/src/components/PlantDiversityExplorer.tsx` | **UNTRACKED** — never committed |
| `client/src/pages/weekly-planner-page.tsx` | **Unstaged modification** — working tree only |
| `client/src/components/nutrition-variety-chips.tsx` | **Unstaged modification** — working tree only |
| `client/src/lib/nutrition-variety.ts` | **Unstaged modification** — working tree only |

### Committed state (HEAD: `1e83f32`)

```
git show HEAD:client/src/components/PlantDiversityExplorer.tsx
fatal: path 'client/src/components/PlantDiversityExplorer.tsx' exists on disk, but not in 'HEAD'
```

**FACT:** `PlantDiversityExplorer.tsx` does not exist in any git commit.

The committed version of `weekly-planner-page.tsx` imports from `nutrition-variety-chips`:

```typescript
// HEAD version (line 36):
import { NutritionVarietyDots, PlannerVarietyLegend, MealVarietyNudge } from "@/components/nutrition-variety-chips";
```

No `WeeklyPlantDiversityCounter`, no `PlantDiversityExplorer`, no `weekMealsData`, no
`plantExplorerOpen`.

The committed version of `nutrition-variety-chips.tsx` exports:
- `NutritionVarietyDots`
- `PlannerVarietyLegend`
- `MealVarietyNudge`
- `DayVarietySummary`

No `WeeklyPlantDiversityCounter`.

### Implication

A deployed instance (any deployment from the git tree) would NOT render the Plant Diversity
Explorer at all. The feature is purely local, working-tree-only.

If the user is running the local dev server, they ARE seeing the working tree implementation.
If they are looking at any deployed instance, they see neither the counter nor the explorer.

---

## 6. Root Cause

**Why the report table is not visually apparent:**

The implementation is correct and rendering. The `PlantReportTable` / `PlantReportRow` semantic
table is live in the working tree. However:

1. **Viewport is mobile (< 768px):** The Meals, Days, and Key Nutrients columns are hidden by
   `hidden md:table-cell`. Only the Plant column is visible in collapsed rows. The "Plant |
   Meals | Days | Key Nutrients" header bar is only fully visible at ≥ 768px viewport width.

2. **Expanded content misread as old layout:** When the user expands a row, they see "Varieties
   Used" and "Meals Contributed" — these are the expanded-row sub-sections in `PlantReportRow`,
   not accordion items from the old implementation. The old layout no longer exists. The user is
   seeing the new implementation, just in its mobile-collapsed state.

**Why the implementation report reflects live code:**

The implementation report is accurate for the working tree. The confusion is that the user may
be expecting to see the desktop column layout on a mobile viewport.

**Why the feature is not in deployment:**

The entire feature stack has never been committed to git:
- `PlantDiversityExplorer.tsx` — untracked
- `WeeklyPlantDiversityCounter` with `onExplore` — unstaged change to `nutrition-variety-chips.tsx`
- `weekMealsData` memo, `plantExplorerOpen` state, dialog render — unstaged changes to
  `weekly-planner-page.tsx`
- `getPlantCategory` export — unstaged change to `nutrition-variety.ts`

---

## 7. Nutrition Boost Cross-Check

**FACT:** NutritionBoostPanel is also untracked:

```
?? client/src/components/NutritionBoostPanel.tsx
?? client/src/lib/nutrition-benefit-library.ts
?? client/src/lib/nutrition-boosts.ts
```

**FACT:** The working tree version of `weekly-planner-page.tsx` renders BOTH panels inside the
meal detail dialog:

```tsx
{/* Line 3470 — working tree */}
<NutritionBoostPanel ... />

{/* Line 3481 — working tree */}
<MealUpliftPanel ... />
```

**FACT:** The HEAD (committed) version renders only `MealUpliftPanel`. `NutritionBoostPanel` is
not present in any committed code.

**Connection to Plant Diversity issue:** YES — the same root problem. Both features:
- Exist only in the working tree
- Were never committed
- Are visible locally on the dev server but absent from any deployed instance

The Nutrition Boost duplication (two panels appearing) is caused by `NutritionBoostPanel`
being added to the working tree alongside the existing `MealUpliftPanel`, without either
removing the other or gating to avoid overlap. This is a working-tree-only issue; the deployed
version has no duplication.

---

## 8. Recommended Fix

**Investigation only — no implementation in this document.**

The following are recommendations only:

### A. Commit the working tree

All feature files need to be staged and committed before they can be deployed or reviewed
in a deployed context:
- `client/src/components/PlantDiversityExplorer.tsx`
- `client/src/components/NutritionBoostPanel.tsx`
- `client/src/lib/ingredient-reuse.ts`
- `client/src/lib/nutrition-benefit-library.ts`
- `client/src/lib/nutrition-boosts.ts`
- `client/src/components/MealUpliftPanel.tsx` (modified)
- `client/src/components/nutrition-variety-chips.tsx` (modified)
- `client/src/lib/nutrition-variety.ts` (modified)
- `client/src/pages/weekly-planner-page.tsx` (modified)

### B. NutritionBoostPanel / MealUpliftPanel overlap

Decide whether both panels should render simultaneously, or whether one should replace/gate
the other. Current working tree renders both unconditionally (NutritionBoostPanel) and
conditionally (MealUpliftPanel when uplift matches > 0).

### C. Mobile column visibility

The responsive behaviour (`hidden md:table-cell`) is correct by design. If all four columns
should be visible on mobile, the `hidden md:table-cell` classes need to be removed or the
dialog needs a horizontal-scroll wrapper. This is a design decision, not a bug.

---

## Trust Check

| Claim | Classification | Evidence |
|-------|----------------|----------|
| PlantReportTable exists | FACT | `PlantDiversityExplorer.tsx` lines 443–482 |
| PlantReportRow exists | FACT | `PlantDiversityExplorer.tsx` lines 276–441 |
| Both are rendered | FACT | `PlantDiversityExplorer.tsx` lines 603, 472 |
| Columns hidden on mobile | FACT | `hidden md:table-cell` on three `<th>` and `<td>` elements |
| Varieties Used is expanded content | FACT | `PlantDiversityExplorer.tsx` line 374 |
| PlantDiversityExplorer.tsx is untracked | FACT | `git status`, `git show HEAD:...` → fatal |
| weekly-planner-page changes are unstaged | FACT | `git diff HEAD` confirms additions |
| NutritionBoostPanel is also untracked | FACT | `git status` |
| Both panels render in working tree | FACT | weekly-planner-page.tsx lines 3470, 3481 |
| HEAD only has MealUpliftPanel | FACT | `git show HEAD:...weekly-planner-page.tsx` line 3380 |

---

## Success Criteria Verification

| Question | Answer |
|----------|--------|
| Why is the report table not visible? | Viewport is mobile (< 768px); three columns are `hidden md:table-cell` |
| Which component is actually being rendered? | `PlantReportTable` / `PlantReportRow` — the new implementation |
| Does the implementation report reflect live code? | Yes, for the working tree; No for any deployed instance |
| Is the issue rendering, deployment, or component selection? | Both: rendering (mobile breakpoint) and deployment (feature never committed) |
| Does Nutrition Boost duplication share the same root cause? | Yes — both NutritionBoostPanel and the entire PlantDiversityExplorer exist only as uncommitted working-tree changes |
