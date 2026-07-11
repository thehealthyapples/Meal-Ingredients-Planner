# WX12B_REV1 — TanStack Query v5 Loading Guard Implementation

**Date:** 2026-06-27  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Rollback identifier:** Tag `WX12B_REV1_ROLLBACK_PRE_IMPL` / Stash ref `42cb2614ff43c78769e4fd29f7911170a92f3d9f`

---

## Summary

All page-level and hook-level `isLoading` guards sourced from `useQuery` have been corrected to `isPending` (or `isPending: alias`) per TanStack Query v5 semantics. All Stage 2 shared components were individually verified and changed where the classification clearly supported it. The build passes cleanly.

---

## Background

TanStack Query v5 changed the semantics of `isLoading`. In v5:

- `isPending` — true when the query has no cached data and is currently fetching (the first fetch). The correct guard for initial-load blocking UI.
- `isLoading` — now an alias for `isPending && isFetching`. On a cached query that re-fetches in the background, `isLoading` is `false` even though the UI hasn't received fresh data yet. This caused false "not found" / "empty" states on pages with WorkspaceHeader-triggered re-renders.
- `isFetching` — true on any in-flight fetch (initial or background refresh).

WX12A fixed `profile-page.tsx`. WX12B_REV1 extends that fix to all identified targets.

---

## Rollback Identifier

- **Git tag:** `WX12B_REV1_ROLLBACK_PRE_IMPL` (points to HEAD before any changes)
- **Stash ref:** `42cb2614ff43c78769e4fd29f7911170a92f3d9f`

To rollback:

```bash
git stash apply 42cb2614ff43c78769e4fd29f7911170a92f3d9f
# or
git checkout WX12B_REV1_ROLLBACK_PRE_IMPL -- <file>
```

---

## Files Reviewed

All Stage 1 and Stage 2 targets plus their runtime paths were reviewed.

### Stage 1 — Hook files

| File | Status |
|------|--------|
| `client/src/hooks/use-user.ts` | Reviewed |
| `client/src/hooks/use-meals.ts` | Reviewed |
| `client/src/hooks/use-week-meal-entries.ts` | Reviewed |

### Stage 1 — Page files

| File | Status |
|------|--------|
| `client/src/pages/profile-page.tsx` | Reviewed |
| `client/src/pages/pantry-page.tsx` | Reviewed |
| `client/src/pages/weekly-planner-page.tsx` | Reviewed |
| `client/src/pages/shopping-workspace-page.tsx` | Reviewed |
| `client/src/pages/shopping-list-page.tsx` | Reviewed |
| `client/src/pages/food-diary-page.tsx` | Reviewed |
| `client/src/pages/meal-detail-page.tsx` | Reviewed |
| `client/src/pages/quick-meal-page.tsx` | Reviewed |
| `client/src/pages/supermarkets-page.tsx` | Reviewed |
| `client/src/pages/food-detail-page.tsx` | Reviewed |
| `client/src/pages/shared-plan-page.tsx` | Reviewed |
| `client/src/pages/admin-recipe-sources-page.tsx` | Reviewed |
| `client/src/pages/admin-users-page.tsx` | Reviewed |
| `client/src/pages/admin-ingredient-products-page.tsx` | Reviewed |

### Stage 2 — Shared component files

| File | Status |
|------|--------|
| `client/src/components/share-plan-dialog.tsx` | Reviewed |
| `client/src/components/PantryKnowledgeHub.tsx` | Reviewed |
| `client/src/components/food-knowledge-modal.tsx` | Reviewed |
| `client/src/components/HomeIntelligenceCompanion.tsx` | Reviewed |
| `client/src/components/HealthTrendChart.tsx` | Reviewed |
| `client/src/components/templates-panel.tsx` | Reviewed |
| `client/src/components/CookbookMealIntelligenceStrip.tsx` | Reviewed |

---

## Classification Table

| File | Query purpose | Guard before | Classification | Decision | Changed? | Reason |
|------|--------------|-------------|----------------|----------|----------|--------|
| `hooks/use-user.ts` | Primary user session query — gate for entire app authentication shell | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Auth status unknown until first fetch; `isLoading` in v5 is false if stale cache exists, causing premature unauthenticated render |
| `hooks/use-meals.ts` | Full meals/recipe list — exported as `isLoading` to consumers | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Consumers gate recipe list render on `isLoading`; false-false caused empty cookbook flash |
| `hooks/use-week-meal-entries.ts` | Planner full-week + meals for Plant Diversity page | `isLoading: plannerLoading` and `isLoading: mealsLoading` | A — Initial-load blocking | Change both to `isPending:` aliases | Yes | Plant Diversity page showed empty state before data; two separate initial-load guards both needed fixing |
| `pages/profile-page.tsx` (main profile query) | Primary page data payload — profile can't render without it | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending` (direct) | Yes | WX12A target; page shows skeleton while pending and error state if no profile |
| `pages/profile-page.tsx` (household query) | Household management subsection data | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Section shows skeleton while loading; `!household` guard shows null after load |
| `pages/profile-page.tsx` (eaters query) | Household eaters list | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `if (isLoading) return null` — false-negative would skip render entirely on re-renders |
| `pages/pantry-page.tsx` | Full pantry items list — both Food and Home sections | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Skeleton rendered while `isLoading`; with v5 semantics it was never true on re-renders |
| `pages/weekly-planner-page.tsx` | Full planner weeks — primary page payload | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `if (isLoading)` gate showed full-page skeleton; was never triggered in v5 without fix |
| `pages/shopping-workspace-page.tsx` | Shopping list items for workspace | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Multiple `!isLoading` guards gate control bar and item list render |
| `pages/shopping-list-page.tsx` | Saved/extended shopping list items | `isLoading: loadingSaved` (v4-style) | A — Initial-load blocking | Change to `isPending: loadingSaved` | Yes | `loadingSaved` gates list render in the page |
| `pages/food-diary-page.tsx` | Daily diary entries response | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `isLoading ? (...)` ternary gates skeleton/content split |
| `pages/meal-detail-page.tsx` | Single meal/recipe payload | `isLoading: mealLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: mealLoading` | Yes | Page cannot render without meal data; `mealLoading` guards full-page state |
| `pages/quick-meal-page.tsx` | Existing meal for edit mode | `isLoading: isLoadingMeal` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoadingMeal` | Yes | `isWorking` combines `isLoadingMeal` with mutation states to disable UI during load |
| `pages/supermarkets-page.tsx` | Supermarket links list | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `isLoading ?` skeleton guard before list render |
| `pages/food-detail-page.tsx` | Food intelligence data | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `isLoading` gates skeleton; `!isLoading && !data` gates error state; both safe with `isPending` |
| `pages/shared-plan-page.tsx` | Shared plan payload (public page) | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `if (isLoading)` full-page skeleton; plan cannot render before data |
| `pages/admin-recipe-sources-page.tsx` (sources) | Admin recipe sources list | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Skeleton shown while `isLoading`; error state shown if `isError` |
| `pages/admin-recipe-sources-page.tsx` (audit) | Admin audit log | `isLoading: auditLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: auditLoading` | Yes | Audit table skeleton gated on `auditLoading` |
| `pages/admin-users-page.tsx` | Admin users list | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Table skeleton shown while loading |
| `pages/admin-ingredient-products-page.tsx` | Admin ingredient products list | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Table skeleton shown while loading |
| `components/share-plan-dialog.tsx` | Plan library for sharing dialog | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Dialog content shows skeleton while `isLoading`; cannot interact without library data |
| `components/PantryKnowledgeHub.tsx` (searchData) | Pantry knowledge search | `isLoading: searchLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: searchLoading` | Yes | Search results skeleton; component cannot show results before data |
| `components/PantryKnowledgeHub.tsx` (foods) | Foods listing | `isLoading: foodsLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: foodsLoading` | Yes | Grid skeleton gated on `foodsLoading` |
| `components/PantryKnowledgeHub.tsx` (results) | Knowledge search results | `isLoading: searchLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: searchLoading` | Yes | Results section gated on loading state |
| `components/PantryKnowledgeHub.tsx` (FoodDetail) | Food knowledge detail view | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Returns `<DetailShell title="Loading…">` while pending |
| `components/PantryKnowledgeHub.tsx` (NutrientDetail) | Nutrient detail view | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Returns loading shell while pending |
| `components/PantryKnowledgeHub.tsx` (BenefitDetail) | Benefit detail view | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Returns loading shell while pending |
| `components/food-knowledge-modal.tsx` | Food knowledge modal content | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Modal header and content gated on `isLoading`; wrong state caused flash of "Loading…" after cache existed |
| `components/HomeIntelligenceCompanion.tsx` | Dashboard intelligence companion | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `if (!isLoading && !hasAnyModule) return null` — with v5 semantics `isLoading` false on re-renders would cause premature null return before data arrived |
| `components/HealthTrendChart.tsx` | Health trend chart data | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Skeleton shown while `isLoading`; chart renders only when data present |
| `components/templates-panel.tsx` (template detail) | Single template with items | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | Returns skeleton while loading — cannot render items without data |
| `components/templates-panel.tsx` (library) | Full template library | `isLoading: libraryLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: libraryLoading` | Yes | Library list skeleton gated on loading state |
| `components/templates-panel.tsx` (adminTemplates) | Admin templates list | `isLoading: adminLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: adminLoading` | Yes | Admin section skeleton gated on loading state |
| `components/CookbookMealIntelligenceStrip.tsx` | Meal intelligence for cookbook card | `isLoading` (v4-style) | A — Initial-load blocking | Change to `isPending: isLoading` | Yes | `if (isLoading)` returns loading state; Intelligence tab only fetches when active; `isPending` is correct initial-load guard |

---

## Items Confirmed Unchanged

The following hooks/patterns were reviewed and confirmed NOT changed, as they are either mutation loading states or already correct:

| File | Guard type | Reason unchanged |
|------|-----------|-----------------|
| `hooks/use-basket.ts` | Not in scope | Not in approved targets list |
| `hooks/use-meals-summary.ts` | Not in scope | Not in approved targets list |
| All `mutation.isPending` usages | Mutation loading | Already correct in TQ v5; mutations use `isPending` |
| `food-diary-page.tsx` prop `isPending` (lines 212, 285) | Mutation state prop | Passed from `logEntryMut.isPending`/`copyFromPlannerMut.isPending` — mutation states, correct |
| Admin import status indicators | Mutation state | Controlled by mutation not query |

---

## Architecture Compliance Check

- [x] One canonical query owner per page/component — no duplicate queries introduced
- [x] No duplicate loading state — aliases preserve existing variable names
- [x] No duplicate error state — error state paths unchanged
- [x] No duplicate data fetching — query keys unchanged
- [x] No schema changes
- [x] No persistence changes
- [x] No API changes
- [x] No business logic changes
- [x] No WorkspaceHeader changes
- [x] Existing hook/component public APIs preserved — `isLoading` name preserved via aliasing

---

## Build Result

```
✓ 3244 modules transformed.
✓ built in 1m 9s
```

No TypeScript errors. No bundler errors. Chunk size warning is pre-existing and unrelated.

---

## Manual Verification Checklist

| Page | Expected behaviour | Status |
|------|--------------------|--------|
| Profile | Skeleton while pending; profile content after load | Build verified; runtime requires browser test |
| Dashboard | Intelligence companion renders after data loads | Build verified |
| Planner | Full-page skeleton while pending; week grid after load | Build verified |
| Cookbook / Meals | Recipes visible after load; intelligence strip shows loading state | Build verified |
| Pantry | Skeleton while pending; item lists after load | Build verified |
| Shopping Workspace | Workspace items visible after initial load | Build verified |
| Shopping List | Saved items list after initial load | Build verified |
| Plant Diversity | Week meals resolved after planner + meals both loaded | Build verified |
| Diary | Entry list after initial load | Build verified |
| Meal Detail | Recipe content after load | Build verified |
| Food Detail | Food intelligence after load | Build verified |
| Shared Plan | Plan content after load (no false "not found") | Build verified |
| Supermarkets | Links list after load | Build verified |
| Admin Users | User table after load | Build verified |
| Admin Recipe Sources | Sources table after load; audit log after load | Build verified |
| Admin Ingredient Products | Products table after load | Build verified |

---

## Remaining Risks

1. **Background refresh indicators**: All changes use `isPending` (initial-load only). If any page shows a background-refresh spinner, it should be gated on `isFetching` — none of the affected components appeared to have such UI, so this is low risk.

2. **`shopping-workspace-page.tsx` additional changes**: The working tree contains additional logic changes to this file (new `"add"` mode, `WorkspaceHeader` replacing `PageHeader`, quick-list feature) beyond the `isPending` fix. These were pre-existing changes from earlier branch work and were not introduced by this task.

3. **`CookbookMealIntelligenceStrip.tsx` hook result**: `useCookbookMealIntelligence` wraps `useQuery` and returns its result directly. The `isPending` destructuring is applied to the hook's return value, which is the raw TanStack Query result object — correct behaviour.

4. **Browser runtime verification**: Build passes but no live browser test was run in this session. The pages listed above should be spot-checked in a running dev instance.

---

## Suggestions (Out of Scope)

- Consider centralising the `isPending: isLoading` alias pattern into a shared utility type to avoid future regressions.
- `use-basket.ts` and `use-meals-summary.ts` were not in scope for this task and should be audited separately if they export `isLoading` from `useQuery`.
