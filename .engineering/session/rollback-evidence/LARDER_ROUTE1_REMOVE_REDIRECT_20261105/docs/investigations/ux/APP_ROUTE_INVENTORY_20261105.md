# Application page route inventory — 2026-11-05

## Governance preflight receipt
- Owning repo for the active application: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`.
- Worktree / branch / HEAD: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- Worktree status: 1,589 modified/untracked entries at inspection; all preserved.
- Risk: GREEN, read-only route inventory and user explanation. No app code, route, service, configuration, data, database, provider, or runtime was changed.
- Governing files actually read: workspace `G:\The Healthy Apples\AGENTS.md` (provided in current task); repository `AGENTS.md`; `PROJECT_GOVERNANCE.md` § Mandatory Governance Bootstrap; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; route source `client/src/App.tsx`.
- Authority gaps: `README.md` is absent at the integrated-dev repo root. Other checkout route tables were inspected as historical/current snapshots, not adopted as architecture authority. No governing source was identified for the standalone Meal-Ingredients-Planner snapshot in this route-only review.
- Scope: five repositories directly under `Applications\GitHub`; page routes sourced from each `client/src/App.tsx`. This is a source inventory, not a live crawl of every authenticated page, dynamic record, API, or route state.

## Active integrated-dev routes
Source: `client/src/App.tsx` at this repository/HEAD. At the inventory baseline (HEAD `3467abad`), the router declared 68 route patterns. After DEVROUTE1 on 2026-11-05, the active router declares 60 route patterns; the eight development preview routes listed below have been removed.

### Home, account, and legal
`/`, `/home`, `/dashboard`, `/auth`, `/onboarding`, `/legal`, `/legal/:slug`, `/invitation`, `/shared/:token`, `/privacy-settings`, `/help`, `/contact`, `/profile`.

### Food, recipes, and meals
`/food`, `/nutrition` (redirects to `/food`), `/plant-diversity` (redirects to `/food`), `/foods/:slug`, `/compare`, `/products`, `/analyser` (same ProductsPage), `/meals/:id`, `/cookbook`, `/cookbook/grid`, `/import-recipe`, `/quick-meal`.

### Household spaces and planning
`/pantry`, `/pantry/:group`, `/pantry/fridge-preview`, `/pantry/shelves-preview`, `/pantry/cupboard-preview`, `/larder` (redirects to `/pantry`), `/orchard`, `/planner`, `/weekly-planner`, `/supermarkets`.

### Shopping and diary
`/shopping-workspace`, `/list` (redirects to `/shopping-workspace`), `/shopping-list` (redirects to `/shopping-workspace`), `/basket` and `/analyse-basket` (redirect to `/shopping-workspace`), `/diary`, `/my-diary`.

### Admin
`/admin`, `/admin/users`, `/admin/ingredient-products`, `/admin/recipe-sources`, `/admin/companion-intelligence`, `/admin/intelligence`, `/admin/benchmark-households`, `/admin/development-world`, `/admin/development-world/:id`, `/admin/observations`, `/admin/behaviour`, `/admin/activity`, `/admin/knowledge-review`, `/admin/knowledge-claims`, `/admin/nutrient-reference-review`, `/admin/canonical-publication-integrity`.

### Development-only experience prototypes (removed 2026-11-05)
`/dev/arrival`, `/dev/arrival-a-welcome`, `/dev/arrival-b-orchard`, `/dev/arrival-c-workspace`, `/dev/arrival-d-quiet`, `/dev/arrival-e-restraint`, `/dev/arrival-s1-quiet`, `/dev/arrival-s2-walking-home`. Historical baseline only: these eight routes were removed from `client/src/App.tsx` by DEVROUTE1. Their source modules and capture scripts remain on disk pending explicit authorization for source cleanup.

### Cookbook destinations
The real-book view is `/cookbook`; the grid view is `/cookbook/grid`, rendered by `MealsPage`. Companion and other internal links use these canonical destinations. The former collection alias `/meals` and concept alias `/cookbook/concept-real-book` are no longer registered; `/meals/:id` remains the meal detail route.

## Other application checkouts
These are separate Git repositories, not additive sections of the active running app. Exact route counts below count distinct static route patterns in each `App.tsx`; `:param` denotes a dynamic URL segment.

| Repository | Branch / HEAD | Dirty entries | Declared route patterns | Difference from active integrated-dev |
|---|---|---:|---:|---|
| `tha-integrated-dev-g-native-20261003` | `feat/integrated-dev` / `3467abad` baseline; DEVROUTE1 working tree | 1,589 at inventory baseline | 68 baseline / 60 current | Active repo; eight `/dev/arrival*` routes removed in DEVROUTE1; includes admin nutrient-reference review route |
| `tha-integrated-dev` | `feat/integrated-dev` / `8ce746c5` | 191 | 58 | Older linked worktree snapshot; no eight `/dev/arrival*` prototype routes or `/admin/nutrient-reference-review` |
| `tha-integrated-dev-staging-20260927` | `feat/integrated-dev` / `8ce746c5` | 187 | 58 | Snapshot at same HEAD and route shape as `tha-integrated-dev`; folder name alone does not prove it is deployed staging |
| `tha-living-larder-authoritative` | `feat/living-larder-authoritative` / `19d2ac01` | 1,919 | 56 | Older/alternate app snapshot; no `/compare`, `/admin/activity`, `/admin/nutrient-reference-review`, or `/dev/arrival*` routes |
| `Meal-Ingredients-Planner` | `main` / `3ef7e8ef` | 58 | 30 | Separate older focused app; its router has `/partners`, while active integrated-dev does not expose `/partners` |

## Limits and evidence
- Verified from source route tables, not from a full browser crawl. Authenticated screens, redirects, dynamic values such as `/meals/:id`, not-found handling, and feature flags may affect what a person sees.
- Current repo `/admin/nutrient-reference-review` and household health-focus work have separate implementation/runtime gates; this inventory does not claim those surfaces are live.
- No tests were run; route inventory did not require code verification. No live service, database, migration, configuration, account, provider, or scheduled task was touched.

