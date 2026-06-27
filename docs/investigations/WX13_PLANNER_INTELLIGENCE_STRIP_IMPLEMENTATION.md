# WX13 — Planner Intelligence Strip Implementation

## Objective

Replace the four-card intelligence section at the top of the Weekly Planner with a compact horizontal strip (~60px), allowing the planner grid to become the dominant visible content while keeping all existing intelligence accessible via expand.

---

## Rollback Identifier

```
git checkout WX13_ROLLBACK_PRE_PLANNER_STRIP
```

Tag: `WX13_ROLLBACK_PRE_PLANNER_STRIP`  
Commit: `265cadd548246b8c1eea820c8793940bd79dc74e`

---

## Architecture Compliance

| Check | Status |
|---|---|
| No duplicate planner intelligence | ✅ Strip reads same cache key as old companion |
| Existing intelligence remains authoritative | ✅ `/api/planner/weeks/:weekId/intelligence` unchanged |
| No duplicate state | ✅ TanStack Query deduplicates via shared cache key |
| No schema changes | ✅ |
| No API changes | ✅ |
| No new persistence | ✅ sessionStorage only for UI expand state |
| Extends existing planner components only | ✅ Re-uses WeeklyPlantDiversityCounter, PlannerVarietyLegend, CelebrationCard, OpportunityCard, IntelligenceCard, HouseholdInsightCard |

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/PlannerIntelligenceStrip.tsx` | **New** — compact strip component |
| `client/src/pages/weekly-planner-page.tsx` | Replace `PlannerIntelligenceCompanion` + `WeeklyPlantDiversityCounter` row with `PlannerIntelligenceStrip`; replace `PageHeader` with `WorkspaceHeader` |

---

## Rollout Summary

### What was replaced

The planner page previously rendered two separate sections above the planner grid:

1. A `WeeklyPlantDiversityCounter` row
2. A `PlannerIntelligenceCompanion` four-card grid (celebration, opportunity, seasonal, household)

Together these consumed roughly one third of the viewport before the planner grid appeared.

### What replaced them

A single `PlannerIntelligenceStrip` component that occupies ~40–60px in compact mode:

- **Left**: 🍎 This Week label
- **Centre-left**: plant count pill (clickable → `/plant-diversity`)
- **Centre**: scrollable intelligence pills (truncated summaries of celebration, seasonal, household, opportunity)
- **Right**: Insights / Collapse toggle

When expanded, the strip reveals:
- Full `WeeklyPlantDiversityCounter` + `PlannerVarietyLegend` (compact)
- 2-column card grid reusing `CelebrationCard`, `OpportunityCard`, `IntelligenceCard`, `HouseholdInsightCard`

Expansion state is persisted in `sessionStorage` under key `planner:intelligence-strip-expanded`.

### Cache strategy

`PlannerIntelligenceStrip` uses the identical TanStack Query key as the removed `PlannerIntelligenceCompanion`:

```ts
queryKey: ["/api/planner/weeks", weekId, "intelligence"]
```

No additional API calls are introduced. If the companion were ever mounted alongside the strip (it is not), zero extra requests would be made.

### Animation

`framer-motion` `AnimatePresence` + `motion.div` with `height: 0 → auto` and 180ms `easeOut`. Consistent with the existing motion language used in CookbookMealIntelligenceStrip and HomeIntelligenceCompanion.

---

## Verification Steps

1. Open `/planner` — planner grid should be visible without scrolling on a standard laptop viewport
2. Compact strip is visible at the top of the planner area (~40–60px)
3. Plant count shows correctly (matches the `/plant-diversity` page count)
4. Intelligence pills appear when the week has data (celebration, seasonal, household, opportunity headlines)
5. Clicking the plant count navigates to `/plant-diversity`
6. Clicking "Insights ▼" expands the strip smoothly; full cards appear
7. Clicking "Collapse ▲" restores compact view with animation
8. Reload the page while expanded — strip reopens expanded (sessionStorage persisted)
9. Open in mobile viewport (390px) — strip remains usable; pills scroll horizontally
10. No layout regressions on other pages

### Manual checklist

- [ ] Planner loads normally
- [ ] Compact strip visible
- [ ] Planner begins significantly higher on the page
- [ ] Expand reveals existing intelligence
- [ ] Collapse restores compact view
- [ ] No information removed
- [ ] Mobile behaviour remains usable
- [ ] No layout regressions

---

## Intelligence Content Mapping

| Strip pill source | Data field | Card shown when expanded |
|---|---|---|
| Plant count | Computed locally from `weekIngredients` via `isPlantIngredient` | `WeeklyPlantDiversityCounter` |
| Celebration headline | `data.celebration.headline` | `CelebrationCard` |
| Seasonal headline | `data.seasonalHighlight.headline` | `IntelligenceCard` (Sun icon) |
| Household insight | `data.householdInsight.headline` | `HouseholdInsightCard` |
| Opportunity | `data.opportunity.text` | `OpportunityCard` |

Pills only render when the data field is non-null. No fabricated content.
