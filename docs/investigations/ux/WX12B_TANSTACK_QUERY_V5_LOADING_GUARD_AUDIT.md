# WX12B — TanStack Query v5 Loading Guard Audit

**Rollback tag:** `wx12b-rollback-20260627-221154`

---

## Root Cause

In TanStack Query v5:

```
isLoading = isPending && isFetching
```

On initial mount with no cached data a query passes through a brief window where:
- `status: 'pending'` → `isPending: true`
- `fetchStatus: 'idle'` → `isFetching: false`
- Therefore: `isLoading: false`

This means a guard like `if (isLoading) return <Skeleton />` can be bypassed before the
first network response arrives, causing the component to fall through to its error/empty
branch with `data === undefined`.

WX12A fixed the Profile page (`isPending` for the user profile query). This audit extends
the fix to every page-level `useQuery` loading guard in the codebase.

---

## Classification Rules

| Class | Description | Fix |
|-------|-------------|-----|
| A | Page-level initial load guard — component cannot render without data; `!data` would show error/empty | `isPending` |
| B | Background refresh indicator — cached data already visible; subtle activity indicator | `isFetching` (keep or convert) |
| C | Mutation loading state | Do not change |
| D | Non-query local loading state | Do not change |

---

## Audit Table

| File | Query purpose | Current guard | Class | Decision | Changed? | Reason |
|------|--------------|---------------|-------|----------|----------|--------|
| `hooks/use-meals.ts` | All user meals list | `isLoading` | A | `isPending` | ✅ | Without fix, meals page renders empty cookbook briefly |
| `hooks/use-week-meal-entries.ts` (×2) | Planner weeks + meals (plant diversity) | `isLoading` | A | `isPending` | ✅ | Without fix, plant diversity report renders before data |
| `pages/profile-page.tsx` (HouseholdManagement) | Household data | `isLoading` | A | `isPending` | ✅ | Without fix, `!household` returns null instead of skeleton |
| `pages/profile-page.tsx` (HouseholdEatersPanel) | Eaters list | `isLoading` | A | `isPending` | ✅ | Without fix, renders empty eaters list prematurely |
| `pages/pantry-page.tsx` | Pantry items list | `isLoading` | A | `isPending` | ✅ | Without fix, passes `false` to child skeletons; empty list shown |
| `pages/weekly-planner-page.tsx` | Full planner weeks | `isLoading` | A | `isPending` | ✅ | Without fix, full page renders with empty `fullPlanner=[]` |
| `pages/shopping-workspace-page.tsx` | Workspace items | `isLoading` | A | `isPending` | ✅ | Without fix, shows "Your shopping list is empty" prematurely |
| `pages/shopping-list-page.tsx` | Saved shopping list | `isLoading: loadingSaved` | A | `isPending` | ✅ | Without fix, shows empty basket; effects run too early |
| `pages/food-diary-page.tsx` | Daily diary | `isLoading` | A | `isPending` | ✅ | Without fix, renders diary tab content with undefined diary |
| `pages/meal-detail-page.tsx` | Single meal | `isLoading: mealLoading` | A | `isPending` | ✅ | Without fix, shows "Meal not found." error — critical |
| `pages/quick-meal-page.tsx` | Meal being edited | `isLoading: isLoadingMeal` | A | `isPending` | ✅ | Without fix, edit form renders before meal data populates |
| `pages/supermarkets-page.tsx` | Supermarket list | `isLoading` | A | `isPending` | ✅ | Without fix, shows empty store list before data arrives |
| `pages/food-detail-page.tsx` | Food intelligence | `isLoading` | A | `isPending` | ✅ | Without fix, shows "We don't know this food yet" — critical |
| `pages/shared-plan-page.tsx` | Shared plan | `isLoading` | A | `isPending` | ✅ | Without fix, shows "no longer shared" error — critical |
| `pages/admin-recipe-sources-page.tsx` (sources) | Recipe sources | `isLoading` | A | `isPending` | ✅ | Without fix, admin page shows empty source table |
| `pages/admin-recipe-sources-page.tsx` (audit) | Audit log | `isLoading: auditLoading` | A | `isPending` | ✅ | Without fix, shows "No blocked requests" before load |
| `pages/admin-users-page.tsx` | Users list | `isLoading` | A | `isPending` | ✅ | Without fix, empty user table renders |
| `pages/admin-ingredient-products-page.tsx` | Ingredient products | `isLoading` | A | `isPending` | ✅ | Without fix, skeleton rows skipped; empty table shown |
| `components/share-plan-dialog.tsx` | Plan template library | `isLoading` | A | `isPending` | ✅ | Without fix, dialog shows empty library briefly |
| `components/PantryKnowledgeHub.tsx` (FoodDetailView) | Food detail | `isLoading` | A | `isPending` | ✅ | Without fix, shows "not found" — critical |
| `components/PantryKnowledgeHub.tsx` (NutrientDetailView) | Nutrient detail | `isLoading` | A | `isPending` | ✅ | Without fix, shows "not found" — critical |
| `components/PantryKnowledgeHub.tsx` (BenefitDetailView) | Benefit detail | `isLoading` | A | `isPending` | ✅ | Without fix, shows "not found" — critical |
| `components/PantryKnowledgeHub.tsx` (BrowseView foods) | Foods list | `isLoading: foodsLoading` | A | `isPending` | ✅ | Without fix, shows "No foods here yet" before data |
| `components/PantryKnowledgeHub.tsx` (BrowseView search) | Search results | `isLoading: searchLoading` | A | `isPending` | ✅ | Without fix, passes loading=false to search results early |
| `components/PantryKnowledgeHub.tsx` (HomeView search) | Search results | `isLoading: searchLoading` | A | `isPending` | ✅ | Without fix, passes loading=false to home search early |
| `components/food-knowledge-modal.tsx` | Food knowledge | `isLoading` | A | `isPending` | ✅ | Without fix, title shows slug and body skips spinner |
| `components/HomeIntelligenceCompanion.tsx` | Home intelligence | `isLoading` | A | `isPending` | ✅ | Without fix, `!hasAnyModule` prematurely hides companion |
| `components/HealthTrendChart.tsx` | Health trends | `isLoading` | A | `isPending` | ✅ | Without fix, empty chart renders before data |
| `components/templates-panel.tsx` (TemplatePreview) | Template detail | `isLoading` | A | `isPending` | ✅ | Without fix, skeleton skipped; renders with undefined template |
| `components/templates-panel.tsx` (library) | Templates library | `isLoading: libraryLoading` | A | `isPending` | ✅ | Without fix, shows empty library briefly |
| `components/templates-panel.tsx` (admin) | Admin templates | `isLoading: adminLoading` | A | `isPending` | ✅ | Without fix, skeleton skipped in admin section |
| `components/CookbookMealIntelligenceStrip.tsx` | Meal intelligence | `isLoading` (from hook) | A | `isPending` | ✅ | Without fix, intelligence strip skips skeleton |
| `hooks/use-user.ts` | Auth user | `isLoading` | A | `isPending` | ✅ | **Critical** — App.tsx guards `!isLoading && !user → /auth`; premature redirect in v5 window. Comment in App.tsx already noted the same issue for routing query |
| `pages/meals-page.tsx` (`dietsLoading`) | Diets for meal | `isLoading: dietsLoading` | D | Keep | — | `allDiets.length === 0` guard already catches v5 window |
| `pages/meals-page.tsx` (`importStatusLoading`) | Import status (admin) | `isLoading: importStatusLoading` | D | Keep | — | Admin button; benign false positive; no error state shown |
| `hooks/use-basket.ts` | Basket items | `isLoading` | D | Keep | — | No caller uses `isLoading` from this hook |
| `hooks/use-meals-summary.ts` | Meals summary | `isLoading` | D | Keep | — | No caller uses `isLoading` from this hook |

---

## Implementation Note

All changes use the aliased destructuring pattern:

```ts
// Before
const { data: foo, isLoading } = useQuery<Foo>({...})

// After
const { data: foo, isPending: isLoading } = useQuery<Foo>({...})
```

This renames the source property while preserving the local variable name throughout the
file — a single-line change per query with zero risk of rename cascades.

For hooks that re-export `isLoading`, the same aliasing is applied inside the hook so the
public API is unchanged.

---

## Files Changed

- `client/src/hooks/use-meals.ts`
- `client/src/hooks/use-week-meal-entries.ts`
- `client/src/pages/profile-page.tsx`
- `client/src/pages/pantry-page.tsx`
- `client/src/pages/weekly-planner-page.tsx`
- `client/src/pages/shopping-workspace-page.tsx`
- `client/src/pages/shopping-list-page.tsx`
- `client/src/pages/food-diary-page.tsx`
- `client/src/pages/meal-detail-page.tsx`
- `client/src/pages/quick-meal-page.tsx`
- `client/src/pages/supermarkets-page.tsx`
- `client/src/pages/food-detail-page.tsx`
- `client/src/pages/shared-plan-page.tsx`
- `client/src/pages/admin-recipe-sources-page.tsx`
- `client/src/pages/admin-users-page.tsx`
- `client/src/pages/admin-ingredient-products-page.tsx`
- `client/src/components/share-plan-dialog.tsx`
- `client/src/components/PantryKnowledgeHub.tsx`
- `client/src/components/food-knowledge-modal.tsx`
- `client/src/components/HomeIntelligenceCompanion.tsx`
- `client/src/components/HealthTrendChart.tsx`
- `client/src/components/templates-panel.tsx`
- `client/src/components/CookbookMealIntelligenceStrip.tsx`
- `client/src/hooks/use-user.ts`

---

## Build Result

`npm run build` — ✅ PASSED (3244 modules, no TypeScript errors)

---

## Manual Verification Checklist

| Page | Expected | Verified? |
|------|----------|-----------|
| Profile | Loads correctly with household/eaters | Post-deploy |
| Dashboard | Loads without false empty state | Post-deploy |
| Planner | Loading spinner shows; planner renders | Post-deploy |
| Cookbook | Meal grid skeleton shows; meals load | Post-deploy |
| Pantry | Pantry skeleton shows; items load | Post-deploy |
| Shopping (workspace) | Skeleton shows; items or empty state | Post-deploy |
| Shopping (list) | Basket spinner shows; items load | Post-deploy |
| Nutrition/Plant diversity | Spinner shows; report renders | Post-deploy |
| Diary | Spinner shows; diary slots render | Post-deploy |
| Supermarkets | Spinner shows; store list renders | Post-deploy |
| Meal Detail | Spinner shows; meal content renders | Post-deploy |
| Shared Plan | Spinner shows; plan loads | Post-deploy |
| Food Detail | Spinner shows; food intelligence loads | Post-deploy |
| Pantry Knowledge Hub | Loading shown; no false "not found" | Post-deploy |

---

## Remaining Risks

- No regression expected. Changes are pure semantic fixes: `isPending` is a superset of `isLoading` for the initial-load guard use case (it stays `true` throughout the fetch, whereas `isLoading` can briefly be `false` before the fetch starts).
- Background refresh indicators (e.g. `isFetching` used by `PlannerAnalyserContent`, `HouseholdNutritionCentre`) were not changed — these are correctly classified as Class B and left alone.
- `use-basket.ts` and `use-meals-summary.ts` export `isLoading` but no caller uses it, so these carry no user-visible risk.
