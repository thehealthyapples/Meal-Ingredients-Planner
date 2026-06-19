# WS3A — Nutrition Report Page Redesign and Table UX Implementation

## Approved Scope

Redesign the current "30 Plants" page into a full Nutrition Report page, preserving
all existing counting logic while improving layout, grouping, sorting, meal/day
visibility and report structure.

## Rollback Identifiers

| Checkpoint | Tag / Commit |
|------------|--------------|
| Pre-WS3A baseline (WS2G complete) | `rollback/ws3a-pre-impl-20260619` |
| WS2F protected | `rollback/ws2f-pre-amendment-20260619` |
| WS2G commit | `9a436f8 feat(ws2g): FoodReport UI Foundation` |

To restore: `git checkout rollback/ws3a-pre-impl-20260619`

## Implementation Notes

### Architecture

Two files changed — no schema changes, no DB writes, no route changes.

**`client/src/pages/plant-diversity-page.tsx`**
- Route `/plant-diversity` unchanged
- Page title changed from "Plant Diversity Report" to "Nutrition Report"
- Page hero added with `BarChart3` icon + THA subtitle copy
- Component prop interface unchanged

**`client/src/components/PlantDiversityReport.tsx`**
- Full restructure; `WeekMealEntry`, `PlantDiversityReportProps`, `SortKey` exports preserved
- Two-pass data model: plant count (unchanged) + display row grouping (new)
- Five report sections: Plant Based, Meat & Fish, Dairy, Eggs, Other Ingredients
- New six-column table: Ingredient | Category | Supports | Key Nutrients | Days | Meals
- Expanded rows: FoodReport (plant rows) + Day → Meal list (all rows)
- Broaden Your Week moved to end of report

### Stage-by-Stage Summary

**Stage 1 — Page Identity and Header**
- `plant-diversity-page.tsx`: `<h1>Nutrition Report</h1>` + BarChart3 icon
- Subtitle: "Understand what your household eats, how it supports your health…"
- `ReportSummary` compact card: 30 Plants progress · Total ingredients · Plant categories covered
- `data-testid="text-nutrition-report-title"` added

**Stage 2 — Report Structure**
- Plant Based section: Vegetables / Fruits / Legumes / Whole Grains / Seeds / Nuts / Herbs & Spices / Olive Oil / Fermented Foods
- 30 Plants tracker lives inside Plant Based (not the whole page)
- Non-plant sections: Meat & Fish / Dairy / Eggs / Other Ingredients
- Healthy fats: NOT a section — applies as attribute (benefitSummary field) on relevant foods
- Sections only render when they have ingredients

**Stage 3 — Table Layout Cleanup**
- 6 columns: Ingredient | Category | Supports | Key Nutrients | Days | Meals
- Mobile (<md): Ingredient only with stacked category + meal count
- Desktop (md+): all 6 columns
- Meals column shows count or meal name (1 meal) — never displayed underneath rows

**Stage 4 — Canonical Ingredient Grouping Fix**
- `getDisplayKey(raw)` pre-strips full-word unit labels before `normaliseForReuse`
- Strips: tablespoon/tablespoons, teaspoon/teaspoons, can/cans, tin/tins, jar/jars, bunch/bunches, sprig/sprigs, stalk/stalks, slice/slices, piece/pieces, head/heads, small/medium/large/big
- `normaliseForReuse` already strips abbreviations (tbsp, tsp, g, kg, cup…)
- "tablespoon olive oil" → getDisplayKey → "olive oil"
- "tbsp olive oil" → getDisplayKey (via normaliseForReuse) → "olive oil"
- These group into one display row
- **Plant count untouched**: Pass 1 uses `normaliseForReuse(raw)` directly, same as before WS3A

**Stage 5 — Sorting and Column Controls**
- 6 sort options: Category (default) | Ingredient | Benefits | Key Nutrients | Days | Meals
- Category sort: plant sub-category order (Vegetables → Fermented Foods), then ingredient name
- Days sort: single-day first sorted Mon→Sun, multi-day last
- Meals sort: meal count descending, then ingredient name
- Sort applies within each section independently; section order is fixed

**Stage 6 — Expanded Row Behaviour**
- Plant rows: FoodReport component (WS2G) + Day → Meal list
- Non-plant rows: Day → Meal list only (FoodReport returns null for non-canonicals)
- `dayMealMap: Map<dayName, string[]>` stores deduped, sorted meal names per day
- Days rendered in week order (Monday first)
- Meals under each day rendered alphabetically
- No duplicate meal names within a day

**Stage 7 — Broaden Your Week Placement**
- `BroadenYourWeek` component placed at the END of the report
- Title: "Ideas to Broaden Your Week"
- Subtitle: "Small additions that bring new plant categories into your week"
- Positive THA wording; no guilt or food shaming
- Only renders when there are missing plant categories

**Stage 8 — Validation**
- `npm run test:food-report`: 94 passed, 0 failed
- `npm run test:variety-surfacing`: 36 passed, 0 failed
- `npm run test:canonical-food`: 46 passed, 0 failed
- TypeScript: no new errors in changed files

## Files Changed

| File | Type |
|------|------|
| `client/src/pages/plant-diversity-page.tsx` | Modified |
| `client/src/components/PlantDiversityReport.tsx` | Modified (major restructure) |
| `docs/investigations/WS3A_NUTRITION_REPORT_PAGE_REDESIGN.md` | New (this file) |

## Validation Results

### Automated tests
- `npm run test:food-report` — 94/94 ✓
- `npm run test:variety-surfacing` — 36/36 ✓
- `npm run test:canonical-food` — 46/46 ✓
- TypeScript: no new client errors

### Manual Test Expectations

**Olive oil**
- One row (not split by "tbsp olive oil", "tablespoon olive oil", "olive oil")
- Category: "Plant based → Olive Oil"
- Healthy fats appears only in benefitSummary / Supports column, not as a section

**Tomatoes**
- One canonical row
- Days shows "Multi" if used across multiple days
- Expanded row shows day → meal list
- FoodReport shows varieties (cherry, plum, heirloom)
- Plant count unchanged

**Spinach**
- Baby spinach treated as variety via WS2B
- Mature spinach may appear in Broaden variety section
- Plant count unchanged

**Lentils**
- Canonical row with FoodReport showing varieties (Red, Green, Puy, Beluga)

**Mixed beans / Grilled tomatoes**
- FoodReport returns null → no canonical knowledge shown
- Day → meal evidence still displayed in expanded row

## Data Impact Declaration

| Concern | Answer |
|---------|--------|
| Reads existing data | Yes (weekMeals, canonical food DB, benefit library) |
| Writes new data | No |
| Changes meaning of existing data | No |
| Requires backfill | No |
| Schema changes | No |
| Route changes | No |
| DB writes | None |

## Trust Check

**Could this mislead users?**
No. All nutrition data comes from existing curated libraries. The Supports column
shows `benefitSummary` (one-line editorial summary) and explicitly shows "—" when
nothing is known. No fabrication.

**Could this make nutritional certainty look stronger than it is?**
No. The HEALTH_DISCLAIMER footer remains. Columns with no data show "—".

**Could sorting or grouping hide meal evidence?**
No. Sorting changes row ORDER, not visibility. All ingredients remain visible.
Expanded rows always show the full day → meal evidence map.

**Could canonical grouping accidentally merge different foods?**
Low risk. `getDisplayKey` strips unit words (tablespoon, teaspoon) then applies
the same `normaliseForReuse` as before. Foods that are genuinely different will
have different canonical forms. E.g., "basil" and "dried basil" both resolve to
"basil" (via normaliseForReuse) — this is the same behaviour as before WS3A.

**Could plant count change?**
No. Pass 1 uses `normaliseForReuse(raw)` directly on each raw ingredient string,
exactly as before. `getDisplayKey` is only used in Pass 2 (display grouping).
The plant count shown in the 30 Plants tracker is `plantCountKeys.size` from Pass 1.

**What happens if canonical resolution fails?**
`getDisplayKey` falls back to `normaliseForReuse` if no unit words to strip.
If `normaliseForReuse` returns empty string, the ingredient is skipped (same
behaviour as before WS3A). FoodReport returns null → no canonical knowledge shown,
but day/meal evidence still displayed.

## Known Limitations / Deviations from Spec

1. **Fermented foods stay in Plant Based** — The spec's Other Ingredients section
   lists fermented foods. However, `isPlantIngredient` classifies kimchi/sauerkraut
   as plant-based, and removing them from the plant section would create a visible
   mismatch (30 Plants count includes fermented foods but they wouldn't appear in
   the Plant Based section). They remain in Plant Based pending a future alignment
   decision.

2. **coconut milk edge case** — If "coconut milk" is not in the plant word lists,
   it will appear in the Dairy section. This is a pre-existing limitation of the
   plant detection, not introduced by WS3A.

3. **Benefits column is mostly empty** — The structured HealthBenefit registry
   does not exist yet (as documented in WS0/health-benefits-model.ts). The Supports
   column shows `benefitSummary` from the nutrition benefit library when available,
   showing "—" otherwise.

## Suggestions (Future Work)

- **SUGGESTION**: Align fermented foods section placement with a product decision:
  either move them to Other Ingredients (and adjust the plant count display
  accordingly) or keep them in Plant Based and update the spec.

- **SUGGESTION**: Add `healthy-fats` as an explicit attribute in the canonical
  food adapter (WS2F) so it can surface consistently in the Supports column.

- **SUGGESTION**: The reportCategory string "Plant based → Vegetables" is long
  for a table cell on smaller viewports. Consider a shorter form ("Vegetables")
  within the plant section where the section header already says "Plant Based".

- **SUGGESTION**: Once the Health Benefit registry is populated (separate task),
  the Benefits sort and Supports column will show real data without any code change.

- **SUGGESTION**: Consider a mobile-first layout toggle (list view / table view)
  to improve the 6-column table experience on narrow screens.
