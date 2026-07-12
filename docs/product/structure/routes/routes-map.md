---
entry: routes-map
name: Route Map
section: routes
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Route Map

> Every address THA answers, and the page each one resolves to —
> including the five aliases and two redirects.

## What it is

THA's client routing is a single `wouter` `<Switch>` in `client/src/App.tsx`
(lines 199–244). This entry is the complete, exact map of every path it
answers and the page each resolves to. Most household paths render inside
`ProtectedRoute`, which redirects to `/auth` when signed out and to
`/onboarding` when onboarding is incomplete; a few paths are public, and two are
pure redirects. The first matching route wins, so the order below is the order
in `App.tsx`.

## Public routes (no protection)

| Path | Resolves to | Source |
|---|---|---|
| `/auth` | AuthPage (in OrchardShell) | `client/src/pages/auth-page.tsx` |
| `/onboarding` | OnboardingPage (in OrchardShell) | `client/src/pages/onboarding-page.tsx` |
| `/shared/:token` | SharedPlanPage — rendered directly, not protected | `client/src/pages/shared-plan-page.tsx` |

## The root

| Path | Resolves to | Source |
|---|---|---|
| `/` | HomeRoute — signed out shows HomePage; signed in redirects to `/home` (or `/onboarding` if onboarding is incomplete) | `client/src/App.tsx` (HomeRoute), `client/src/pages/home-page.tsx` |

## Household routes (protected)

| Path | Resolves to | Source |
|---|---|---|
| `/home` | HomeExperiencePage | `client/src/pages/home-experience-page.tsx` |
| `/dashboard` | DashboardPage | `client/src/pages/dashboard.tsx` |
| `/meals/:id` | MealDetailPage | `client/src/pages/meal-detail-page.tsx` |
| `/foods/:slug` | FoodDetailPage | `client/src/pages/food-detail-page.tsx` |
| `/meals` | MealsPage | `client/src/pages/meals-page.tsx` |
| `/cookbook` | MealsPage *(alias of `/meals`)* | `client/src/pages/meals-page.tsx` |
| `/import-recipe` | ImportRecipePage | `client/src/pages/import-recipe-page.tsx` |
| `/analyse-basket` | ShoppingListPage | `client/src/pages/shopping-list-page.tsx` |
| `/basket` | ShoppingListPage *(alias of `/analyse-basket`)* | `client/src/pages/shopping-list-page.tsx` |
| `/products` | ProductsPage | `client/src/pages/products-page.tsx` |
| `/analyser` | ProductsPage *(alias of `/products`)* | `client/src/pages/products-page.tsx` |
| `/weekly-planner` | WeeklyPlannerPage (via PlannerPageWrapper) | `client/src/pages/weekly-planner-page.tsx` |
| `/planner` | WeeklyPlannerPage *(alias of `/weekly-planner`)* | `client/src/pages/weekly-planner-page.tsx` |
| `/supermarkets` | SupermarketsPage | `client/src/pages/supermarkets-page.tsx` |
| `/profile` | ProfilePage | `client/src/pages/profile-page.tsx` |
| `/pantry` | PantryPage | `client/src/pages/pantry-page.tsx` |
| `/plant-diversity` | PlantDiversityPage | `client/src/pages/plant-diversity-page.tsx` |
| `/diary` | FoodDiaryPage | `client/src/pages/food-diary-page.tsx` |
| `/my-diary` | FoodDiaryPage *(alias of `/diary`)* | `client/src/pages/food-diary-page.tsx` |
| `/partners` | PartnersPage | `client/src/pages/partners-page.tsx` |
| `/quick-meal` | QuickMealPage | `client/src/pages/quick-meal-page.tsx` |
| `/shopping-workspace` | ShoppingWorkspacePage | `client/src/pages/shopping-workspace-page.tsx` |

## Admin routes (protected)

Each admin page except `/admin/knowledge-review` renders wrapped in the shared
Admin banner (`withAdminBanner`); `/admin/knowledge-review` renders the page
directly.

| Path | Resolves to | Source |
|---|---|---|
| `/admin` | AdminPage (+ Admin banner) | `client/src/pages/admin-page.tsx` |
| `/admin/users` | AdminUsersPage (+ banner) | `client/src/pages/admin-users-page.tsx` |
| `/admin/ingredient-products` | AdminIngredientProductsPage (+ banner) | `client/src/pages/admin-ingredient-products-page.tsx` |
| `/admin/recipe-sources` | AdminRecipeSourcesPage (+ banner) | `client/src/pages/admin-recipe-sources-page.tsx` |
| `/admin/companion-intelligence` | AdminCompanionIntelligencePage (+ banner) | `client/src/pages/admin-companion-intelligence-page.tsx` |
| `/admin/intelligence` | AdminIntelligencePage (+ banner) | `client/src/pages/admin-intelligence-page.tsx` |
| `/admin/benchmark-households` | AdminBenchmarkHouseholdsPage (+ banner) | `client/src/pages/admin-benchmark-households-page.tsx` |
| `/admin/development-world/:id` | AdminDevelopmentWorldHouseholdPage (+ banner) | `client/src/pages/admin-development-world-household-page.tsx` |
| `/admin/development-world` | AdminDevelopmentWorldPage (+ banner) | `client/src/pages/admin-development-world-page.tsx` |
| `/admin/observations` | AdminObservationWorkbenchPage (+ banner) | `client/src/pages/admin-observation-workbench-page.tsx` |
| `/admin/behaviour` | AdminBehaviourWorkbenchPage (+ banner) | `client/src/pages/admin-behaviour-workbench-page.tsx` |
| `/admin/knowledge-review` | AdminKnowledgeReviewPage *(no banner wrapper)* | `client/src/pages/admin-knowledge-review-page.tsx` |

## Redirects

| Path | Redirects to |
|---|---|
| `/list` | `/shopping-workspace` |
| `/shopping-list` | `/shopping-workspace` |

## Fallback

| Path | Resolves to | Source |
|---|---|---|
| *(no match)* | NotFound | `client/src/pages/not-found.tsx` |

## Aliases and redirects — the actual count

The registered routes include **two pure redirects** (`/list` and
`/shopping-list`, both to `/shopping-workspace`) and **five aliased paths** —
five pages each reachable by a second path: `/cookbook` (→ MealsPage),
`/basket` (→ ShoppingListPage), `/analyser` (→ ProductsPage), `/planner`
(→ WeeklyPlannerPage) and `/my-diary` (→ FoodDiaryPage). The record's stated
"eight aliases" does not match the five aliased paths present in `App.tsx`
today; the "two redirects" is correct.

## Related

- [[page-cookbook]] — reachable at `/cookbook` and `/meals`
- [[page-analyser]] — reachable at `/analyser` and `/products`
- [[page-planner]] — reachable at `/planner` and `/weekly-planner`
- [[page-diary]] — reachable at `/diary` and `/my-diary`
- [[page-basket]] — reachable at `/basket` and `/analyse-basket`

## Known defects

- `fnd-alias-sprawl` — several pages answer to more than one path and two more
  paths exist only to redirect, spreading a single destination across multiple
  addresses (`/meals` and `/cookbook`; `/basket` and `/analyse-basket`;
  `/products` and `/analyser`; `/planner` and `/weekly-planner`; `/diary` and
  `/my-diary`; plus `/list` and `/shopping-list` redirecting to
  `/shopping-workspace`). See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
