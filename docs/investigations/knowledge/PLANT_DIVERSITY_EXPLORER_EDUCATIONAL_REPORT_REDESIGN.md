# Plant Diversity Explorer — Educational Report Redesign

## Rollback Identifier

**Tag:** `rollback/plant-explorer-educational-report-pre`
**Commit at tag:** `1e83f32` (fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools)

To roll back:
```
git checkout rollback/plant-explorer-educational-report-pre -- client/src/components/PlantDiversityExplorer.tsx
```

---

## Files Changed

| File | Change type |
|------|-------------|
| `client/src/components/PlantDiversityExplorer.tsx` | UI rendering only — data logic untouched |

---

## Implementation Summary

### Objective

Transform the Plant Diversity Explorer from an ingredient list into an educational nutrition report. Users should be able to answer "why does this plant matter?" not just "where was it used?"

### What was preserved (unchanged)

- `computePlantData()` — all plant counting, canonical grouping, variant detection
- `WEEKLY_PLANT_TARGET`, `CATEGORY_ORDER`, `CATEGORY_SUGGESTIONS`
- `toDisplayName()`, `stripLeadingQuantity()` helpers
- `CategoryGrid` component (Categories Covered)
- `CategoryCompletionSuggestions` component (Easy additions to broaden your week)
- `PlantTableHeader` component (Plant | Meals | Days | Key Nutrients columns)
- Progress bar, count display, status messages
- `getCategoryEmoji` imagery extension point
- Modal structure, backdrop, scroll behaviour

### What changed

#### 1. `DialogDescription` — now visible

Before: `className="sr-only"` (screen-reader only, invisible)

After: Visible subtitle rendered below the title:
> "See what your meals contribute to this week's plant nutrition."

This gives the modal an immediate report framing before the user scrolls.

#### 2. New `ReportSectionHeader` component

Added between `CategoryCompletionSuggestions` and the plant table. Renders:
- Label: **"PLANT NUTRITION REPORT"** (small-caps style)
- Subtitle: "What each plant contributes to your week's nutrition"
- Right-aligned plant count (e.g. "14 plants")

This makes the table section feel like a named report section rather than an anonymous list.

#### 3. `PlantTableRow` expanded section restructured

**Before:**
```
VARIETIES USED       [chips]
IN THIS WEEK'S MEALS [meal · day pairs]
KEY NUTRIENTS        [nutrient chips]
[italic benefit summary at bottom]
```

**After:**
```
VARIETIES USED       [chips]
MEALS CONTRIBUTED    [meal · day pairs]
BENEFITS             [benefit summary text]
                     [nutrient chips]
```

Changes:
- "In This Week's Meals" → **"Meals Contributed"** (matches spec language)
- "Key Nutrients" section removed as standalone
- New **"Benefits"** section combines:
  - `benefitSummary` as the primary educational text (no longer italic/de-emphasised)
  - `keyNutrients` chips as secondary detail below the summary
- Only rendered when at least one of benefitSummary or keyNutrients is present

The benefit summary is now the focal point of the expansion, answering "why does this plant matter?"

#### 4. Empty state copy update

Before: "No plant foods found in this week's meals yet."
After: "Your plant nutrition report will appear here once meals are added to your week."

Report framing maintained even in the empty state.

#### 5. Unused import removed

`ChevronDown` was imported but never referenced. Removed.

---

## Before / After Comparison

| Element | Before | After |
|---------|--------|-------|
| Modal subtitle | Hidden (sr-only) | "See what your meals contribute to this week's plant nutrition." |
| Table section heading | None — table started immediately | "PLANT NUTRITION REPORT" section header with count |
| Expanded: meals label | "In This Week's Meals" | "Meals Contributed" |
| Expanded: educational content | Italic de-emphasised paragraph at bottom | "Benefits" section at top of educational block, plain readable text |
| Expanded: nutrients label | "Key Nutrients" (standalone section) | Combined under "Benefits" as secondary detail |
| Empty state | "No plant foods found..." | "Your plant nutrition report will appear here..." |

---

## Trust Check

| Check | Result |
|-------|--------|
| Plant count unchanged | `computePlantData()` not modified — count is identical |
| Canonical grouping unchanged | `normaliseForReuse()` pipeline untouched |
| Benefits from Nutrition Benefit Library | `getNutritionBenefit()` still the sole data source |
| No medical claims introduced | All benefit text comes from existing library summaries |
| No new calculations | Zero new logic — display only |
| Imagery extension point preserved | `getCategoryEmoji()` call and comment retained |

---

## Manual Tests

### 1. Open Plant Diversity Explorer
- Report layout displayed ✓
- Modal subtitle visible below title ✓
- "PLANT NUTRITION REPORT" section header appears above table ✓

### 2. Locate any plant (e.g. Spinach)
- Meals visible in row (desktop) ✓
- Days visible in row (desktop) ✓
- Nutrients visible in row (both mobile and desktop) ✓

### 3. Expand a plant row
- "Varieties Used" section present if variants exist ✓
- "Meals Contributed" section present (renamed from "In This Week's Meals") ✓
- "Benefits" section present: benefit summary text + nutrient chips ✓

### 4. Mobile
- Layout readable — only Plant + Key Nutrients visible in collapsed row ✓
- Expand to see meals, days, benefits ✓
- No horizontal scroll ✓
- Scrollable body functions normally ✓

### 5. Compare count
- Explorer count matches planner counter — `computePlantData()` is unchanged ✓

---

## Suggestions (Not Implemented)

Future ideas identified during this work. Not in scope.

- **Real imagery**: Replace emoji fallbacks with actual ingredient photography. Extension point already exists via `getCategoryEmoji` / `ingredient-imagery.ts`.
- **Personalised benefit context**: Surface benefits that are most relevant to the household's dietary patterns (e.g. highlight Iron for plant-based households).
- **Category completion celebration**: When all 9 categories are covered, show a positive confirmation state in the CategoryGrid.
- **Sort/filter controls**: Allow users to sort the report by category, meals count, or days, or filter to a specific category.
- **Planner history comparison**: Show how this week's plant count compares to recent weeks.
