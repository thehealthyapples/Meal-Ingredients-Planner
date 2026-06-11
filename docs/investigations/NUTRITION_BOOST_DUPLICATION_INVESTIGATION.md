# Nutrition Boost Duplication Investigation

**Date:** 2026-06-11
**Status:** Complete
**Rollback tag:** `investigation/nutrition-boost-duplication-pre` (commit `1e83f32`)

---

## Rollback Point

```
Tag:    investigation/nutrition-boost-duplication-pre
Commit: 1e83f326f319127d25bc70cf0482d25686f6f02c
Branch: main
```

Git status at investigation start: **working tree has modifications** (no investigation changes were made).

---

## 1. Nutrition Component Inventory

### Component 1 — `NutritionBoostPanel`

| Field | Value |
|---|---|
| File | `client/src/components/NutritionBoostPanel.tsx` |
| Status | **Untracked (new file, not yet committed)** |
| Data source | `client/src/lib/nutrition-boosts.ts` → `getMealBoosts()` |
| Architecture | Purely client-side, deterministic, no server call |
| Header label | "Nutrition Boosts" (plural, small caps, 11px) |
| Icon | `<Leaf>` emerald |
| `data-testid` | `nutrition-boost-panel` |
| Supports Add To Meal | **NO** — passive display only |
| Supports undo/remove | **NO** |
| Collapsible | **NO** — always expanded |
| Household-aware | YES — filters hard restrictions and diet patterns |

**Purpose:** Shows up to 3 curated, deterministic additions that suit the meal type (e.g. pizza → Spinach, Roasted Peppers, Mixed Mushrooms). Meal-name keyword matching selects the relevant boost list from `MEAL_TYPE_BOOSTS`. Fallback boosts used when no keyword matches.

---

### Component 2 — `MealUpliftPanel`

| Field | Value |
|---|---|
| File | `client/src/components/MealUpliftPanel.tsx` |
| Status | **Modified (tracked, working-tree changes)** |
| Data source | `/api/uplift/batch` (server) + `/api/meals/{id}/uplift-applications` (provenance) |
| Architecture | Server-backed, async, rule-based uplift engine |
| Header label | "Nutrition Boost" (singular, `text-sm font-medium`) |
| Icon | `<Leaf>` emerald |
| `data-testid` | `uplift-panel` |
| Supports Add To Meal | **YES** — "Add to meal" button triggers `POST /api/uplift/accept` |
| Supports undo/remove | **YES** — `DELETE /api/uplift/applications/{id}` |
| Collapsible | **YES** — collapsed by default, chevron toggle |
| Household-aware | Indirectly (upstream uplift engine is household-aware) |

**Purpose:** Surfaces rule-based, evidence-backed suggestions from the server uplift engine. Tracks which suggestions have been accepted (provenance). Supports weekly reuse ranking (already-used-this-week prioritisation). Handles system meal forking when a system recipe is modified.

---

### Supporting Libraries

| File | Purpose |
|---|---|
| `client/src/lib/nutrition-boosts.ts` | BOOST_LIBRARY + MEAL_TYPE_BOOSTS + `getMealBoosts()` — powers `NutritionBoostPanel` |
| `client/src/lib/nutrition-benefit-library.ts` | `getNutritionBenefit()` — enriches suggestion rows in `MealUpliftPanel` with nutrient tags and summaries. Also used by `PlantDiversityExplorer`. |
| `client/src/lib/ingredient-reuse.ts` | `normaliseForReuse()`, `getReuseLabel()` — used by `MealUpliftPanel` for reuse ranking |

---

## 2. Meal Card Render Tree

### Planner Meal Detail Dialog (the source of duplication)

**File:** `client/src/pages/weekly-planner-page.tsx`

```
weekly-planner-page.tsx (MealDetail dialog section)
│
├── NutritionBoostPanel (line 3470)
│     props: mealName, ingredients, householdEaters
│     source: nutrition-boosts.ts (getMealBoosts)
│     renders if: getMealBoosts() returns ≥1 result
│     → "Nutrition Boosts" section (always visible, no collapse)
│
└── MealUpliftPanel (line 3481)
      props: mealId, plannerEntryId, upliftMatches, currentMealName, weeklyReuseMap, callbacks
      source: /api/uplift/batch → upliftByMealId map
      renders if: upliftByMealId.get(meal.id)?.length > 0
      → "Nutrition Boost" section (collapsed by default)
```

Both are rendered sequentially within the same JSX block.
There is **no mutual exclusion** between them.

---

### Matrix Card Indicator (not the duplication source)

```
weekly-planner-page.tsx (meal grid card, line 2265)
│
└── UpliftCardIndicator
      props: suggestionCount, onClick
      renders if: upliftByMealId.get(meal.id)?.length > 0
      → tiny "N boost ideas" link in the card footer (not a full panel)
```

This is the card-level entry point that opens the meal detail dialog. It does not contribute to the duplication.

---

### Cookbook / Analyser

FACT: Neither `NutritionBoostPanel` nor `MealUpliftPanel` is imported or rendered in:
- `CookbookWorkspacePanel.tsx`
- `analyser/AnalyserDetailV2.tsx`
- `SmartReviewPanelContent.tsx`

Duplication is **planner-only**.

---

## 3. Duplication Root Cause

**FACT:** Two separate components render in sequence in the same meal detail section.

Evidence — `weekly-planner-page.tsx` lines 3469–3497:

```tsx
{/* Nutrition Boosts — deterministic, meal-aware, no AI */}
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
  householdEaters={householdEaters}
/>

{/* Nutrition Boost — async uplift panel, shown only when matches exist */}
{(() => {
  const matches = upliftByMealId.get(meal.id) ?? [];
  if (matches.length === 0) return null;
  return (
    <MealUpliftPanel
      mealId={meal.id}
      plannerEntryId={entry.id}
      ...
    />
  );
})()}
```

**Both components use:**
- The same Leaf icon
- The same emerald colour scheme
- Nearly identical header copy: "Nutrition Boosts" vs "Nutrition Boost"

When `NutritionBoostPanel` finds ≥1 boost AND the server uplift engine finds ≥1 match for the same meal, **both panels render**. Since most meals have keyword matches in `MEAL_TYPE_BOOSTS` and the uplift engine covers the same ingredient territory, this condition is commonly satisfied.

**Root cause:** Two separate implementations of the same user-facing concept — nutrition enhancement suggestions — were both added to the meal detail dialog without a mutual exclusion guard or a decision to retire one.

---

## 4. Old vs New Comparison Matrix

| Dimension | `NutritionBoostPanel` | `MealUpliftPanel` |
|---|---|---|
| **Purpose** | Passive inspiration: "works well with this meal type" | Actionable enhancement: "add this specific ingredient" |
| **Data Source** | `nutrition-boosts.ts` (client-only, hard-coded) | `/api/uplift/batch` (server, rule engine) |
| **Mechanism** | Keyword matching on meal name | Rule-based uplift engine with household context |
| **Supports Add To Meal** | **No** | **Yes** |
| **Supports Remove/Undo** | **No** | **Yes** |
| **Collapsible** | **No** | **Yes** |
| **Persists to DB** | **No** | **Yes** (uplift applications table) |
| **Household-aware filtering** | Yes (hard restrictions + diet types) | Yes (upstream engine) |
| **Weekly reuse ranking** | No | Yes |
| **System meal fork handling** | No | Yes |
| **Shopping list integration** | No | Yes (invalidates shopping list queries on accept/remove) |
| **Used in Planner** | Yes | Yes |
| **Used in Cookbook** | No | No |
| **Used in Analyser** | No | No |
| **Git status** | Untracked (newer, not committed) | Modified (tracked) |
| **Still Needed** | RECOMMENDATION: retire | RECOMMENDATION: keep |

**RECOMMENDATION (opinion only):** `NutritionBoostPanel` is a simpler predecessor that lacks persistence, Add-to-Meal, and undo. `MealUpliftPanel` is the richer, actionable successor. The only capability `NutritionBoostPanel` adds over `MealUpliftPanel` is rendering when the server uplift engine returns no matches — i.e. it is a fallback for zero-result uplift slots. If the uplift engine's coverage is sufficient, `NutritionBoostPanel` can be retired. If coverage gaps are real, the fallback value should be built into `MealUpliftPanel` rather than keeping a separate panel.

---

## 5. Deployment / Cache Assessment

**FACT:** The duplication is **definitely in code**, not a deployment or cache issue.

Evidence:
1. `weekly-planner-page.tsx` (line 3470 and 3481) contains both component render calls in the same JSX.
2. Both components are statically imported at lines 39 and 44.
3. There is no feature flag, A/B test, or conditional guard preventing both from rendering simultaneously.
4. The file is tracked in git (`M client/src/pages/weekly-planner-page.tsx`), confirming the duplication is an intentional or unnoticed code addition.

**Ruling out deployment/cache causes:**
- A stale client build would render the old version of the component, not add a second one.
- Stale server process does not affect client-side component rendering.
- A cached UI state could not cause two distinct components with different `data-testid` attributes (`nutrition-boost-panel` and `uplift-panel`) to appear.

**CONCLUSION:** This is a code-level issue. Both components were added intentionally but the visual impact of having two "Nutrition Boost" headers in sequence was not caught.

---

## 6. Plant Diversity Explorer Render Verification

**Component:** `PlantDiversityExplorer`
**File:** `client/src/components/PlantDiversityExplorer.tsx`
**Route/trigger:** Rendered as a `<Dialog>` in `weekly-planner-page.tsx` at line 3724, controlled by `plantExplorerOpen` state.

**Report table implementation — IS ACTIVE.**

Evidence — `PlantDiversityExplorer.tsx` lines 595–608:

```tsx
{/* Report section header + plant report table */}
{plantRows.length === 0 ? (
  <div className="px-5 py-10 text-center text-sm text-muted-foreground/50">
    Your plant nutrition report will appear here once meals are added...
  </div>
) : (
  <div>
    <ReportSectionHeader count={plantCount} />
    <PlantReportTable
      plantRows={plantRows}
      expandedKeys={expandedKeys}
      onToggle={toggleRow}
    />
  </div>
)}
```

The `PlantReportTable` component (defined at line 443) uses a semantic `<table>` element with thead/tbody structure. Columns include Plant, Category (hidden on mobile), Day (hidden on mobile), Benefit Summary (hidden on mobile). Rows are implemented by `PlantReportRow` (line 276).

**FACT:** The report-table implementation is the sole active render path for plant data in the explorer. There is no card-based or legacy list-based render path remaining in the component. The table IS live.

---

## 7. Recommended Fix

**RECOMMENDATION (opinion only — no code changes made):**

### Option A — Retire `NutritionBoostPanel` (preferred)

Remove `NutritionBoostPanel` from the meal detail render block. The `MealUpliftPanel` provides a superset of its functionality with Add-to-Meal, undo, persistence, and reuse awareness. The visual duplication is resolved and users see a single, actionable section.

**Consideration:** If the uplift engine returns 0 matches for some meals, those meals would show no nutrition section at all. This may be acceptable or may require the uplift engine's coverage to be reviewed first.

### Option B — Make panels mutually exclusive

Show `MealUpliftPanel` when the server returns matches; fall back to `NutritionBoostPanel` when it returns 0 matches.

```tsx
{upliftByMealId.get(meal.id)?.length > 0 ? (
  <MealUpliftPanel ... />
) : (
  <NutritionBoostPanel ... />
)}
```

This eliminates duplication while preserving `NutritionBoostPanel` as a zero-result fallback.

### Option C — Merge fallback into `MealUpliftPanel`

Add an empty-state fallback inside `MealUpliftPanel` that renders deterministic boost suggestions (from `getMealBoosts`) when `upliftMatches.length === 0`. This consolidates both concepts into one component and allows `NutritionBoostPanel` and `nutrition-boosts.ts` to be deleted entirely.

---

## Trust Declarations

| Claim | Type |
|---|---|
| Both components are rendered at lines 3470 and 3481 of `weekly-planner-page.tsx` | FACT — verified by reading the file |
| `NutritionBoostPanel` uses only client-side data (no server call) | FACT — source reads `nutrition-boosts.ts` only |
| `MealUpliftPanel` calls `/api/uplift/batch` | FACT — confirmed in `useQuery` at line 658–666 |
| `MealUpliftPanel` supports Add To Meal | FACT — `acceptMutation` calls `POST /api/uplift/accept` |
| `NutritionBoostPanel` does not support Add To Meal | FACT — no button, no mutation, no API call |
| Duplication is in code, not a build/cache issue | FACT — both imports and render calls are in the same file |
| `PlantReportTable` is the active render path in `PlantDiversityExplorer` | FACT — confirmed by reading lines 595–608 |
| `NutritionBoostPanel` is the "older" system | ASSUMPTION — it lacks persistence and Add-to-Meal, suggesting it predates `MealUpliftPanel`. Git history would confirm. |
| Retiring `NutritionBoostPanel` is safe | RECOMMENDATION — depends on uplift engine coverage |

---

## Summary

1. **Why two sections appear:** Both `NutritionBoostPanel` and `MealUpliftPanel` are rendered in sequence in `weekly-planner-page.tsx` (lines 3470 and 3481) with no mutual exclusion. Both use the same header label, icon, and colour scheme, making them visually indistinguishable to users.

2. **Which component should survive:** `MealUpliftPanel` — it is the richer system with Add-to-Meal, undo, persistence, shopping list integration, and reuse awareness.

3. **Issue type:** Code — not deployment, not cache.

4. **Plant Diversity report-table:** Confirmed live. `PlantReportTable` is the active and only render path in `PlantDiversityExplorer`.
