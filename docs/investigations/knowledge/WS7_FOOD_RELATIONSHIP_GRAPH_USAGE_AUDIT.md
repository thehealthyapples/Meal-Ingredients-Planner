# WS7 Food Relationship Graph — Usage Audit

**Date:** 2026-06-29
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Commit under review:** `a7eaef5` — feat(ws7): Food Relationship Graph POC

## Rollback Protection

**Rollback tag:** `rollback/pre-ws7-usage-audit-20260629`
**Pinned to:** `556747e` (safety branch HEAD)

---

## WS7 PURPOSE

WS7 introduced a shared, in-memory food-to-food relationship graph. Its core
function `getFoodRelationships(slug)` accepts a canonical food slug and returns
a typed `FoodGraph` object describing up to 7 kinds of relationship between that
food and its neighbours — varieties, family members, similar foods, cooking
pairings, seasonal partners, shared-benefit foods, and goal-labelled
alternatives.

The module is not a database, not an API surface, and not a UI component. It is
a **shared library** that other workstreams import and use as their data source.

---

## FILES CREATED BY COMMIT a7eaef5

| File | Role |
|------|------|
| `shared/relationships/food-graph.ts` | Core module. Defines types, editorial data (5 food nodes, ~100 edges), derived-data indices, and public API. 633 lines. |
| `shared/relationships/index.ts` | Re-export barrel: `getFoodRelationships`, `formatFoodGraph`, and the three types. 3 lines. |
| `server/tests/test-food-graph.ts` | POC script runner. Prints worked examples to stdout. Not a Jest/Vitest test. Run manually with `npx ts-node`. |
| `docs/investigations/knowledge/WS7_RELATIONSHIP_GRAPH_POC.md` | Investigation documentation. 442 lines. No runtime impact. |

---

## FILES USING WS7

### Server — runtime

**`server/lib/connected-food-intelligence-assembler.ts`** (WX5)
- Import (line 32): `import { getFoodRelationships } from "@shared/relationships/food-graph";`
- Import (line 33): `import type { FoodRelationship } from "@shared/relationships/food-graph";`
- Line 320: `const graph = getFoodRelationships(canonicalFoodSlug);`
- Line 331: `// ── Lateral relationships (food-graph).`
- Purpose: Assembles the "Connected foods" payload (often-enjoyed-with, similar foods, seasonal connections, household connections) for every Food page. Called on every request to `/api/foods/:slug/connected` and to the Food Detail API.

**`shared/discovery/engine.ts`** (WS8)
- Import (line 16): `import { getFoodRelationships } from "../relationships/food-graph";`
- Import (line 17): `import type { FoodRelationship } from "../relationships/food-graph";`
- Line 77: `const graph = getFoodRelationships(slug);` — in `lateralNeighbours()`
- Line 94: `const graph = getFoodRelationships(slug);` — for broaden_horizons
- Line 150: `const graph = getFoodRelationships(anchor);` — for cook_with discovery type
- Line 302: `const anchorGraph = food ? getFoodRelationships(food) : null;` — anchor-food context
- Purpose: WS8 discovery engine is explicitly built on top of WS7. Comment at line 6: "Built ON TOP of the WS7 relationship graph." WS8 uses WS7 edges to drive `similar`, `cook_with`, `broaden_horizons`, and `explore_varieties` discovery types.

### Server — routes

**`server/routes.ts`**
- Line 38: `import { discover } from "../shared/discovery/engine";` — WS8 (which depends on WS7)
- Line 5623: `app.get("/api/foods/:slug/connected", ...)` — calls `getConnectedFoodIntelligence`, which calls `getFoodRelationships`
- Line 5673: Food Detail API handler — calls both `getFoodIntelligence` and `getConnectedFoodIntelligence` in parallel
- Line 10869: `app.get("/api/pantry/discover", ...)` — calls `discover()` directly
- Line 11049: Dashboard/Nutrition opportunity section — calls `discover()` for `broaden_horizons` and `seasonal` types
- Line 11175: Second discover call in another aggregated view

### Client — UI

**`client/src/components/intelligence/ConnectedFoodPanel.tsx`** (WX5)
- Line 98: `export function ConnectedFoodPanel({ slug })`
- Fetches from `GET /api/foods/:slug/connected` on every Food page load
- Renders four relationship sections: "Often enjoyed with", "Similar foods", "Seasonal connections", "Household connections"
- Does not import WS7 directly — it consumes the API response shaped by the server assembler

**`client/src/pages/food-detail-page.tsx`**
- Line 29: imports `ConnectedFoodPanel`
- Line 263: `<ConnectedFoodPanel slug={data.slug} />` — rendered on every Food Detail page
- Lines 145/266–287: renders `discoverySections` from the Food Detail API response (also WS7-derived via WS8)

**`client/src/components/intelligence/index.ts`**
- Line 36: `export { ConnectedFoodPanel }` — re-exports for consumer convenience

---

## RUNTIME USAGE

**WS7 is called on every request to three live API routes:**

| Route | Caller | When triggered |
|-------|--------|----------------|
| `GET /api/foods/:slug/connected` | `getConnectedFoodIntelligence` → `getFoodRelationships` | Every Food page load (ConnectedFoodPanel) |
| `GET /api/foods/:slug` (Food Detail) | `getConnectedFoodIntelligence` → `getFoodRelationships` (parallel) | Every Food page initial data load |
| `GET /api/pantry/discover` | `discover()` → `getFoodRelationships` | Pantry Knowledge Hub discovery section |
| Dashboard aggregated views | `discover()` → `getFoodRelationships` | Nutrition and Dashboard story/opportunity sections |

All calls are synchronous, in-memory operations. No I/O. No database queries within WS7 itself.

---

## API USAGE

- **GET `/api/foods/:slug/connected`** — Returns `ConnectedFoodIntelligence` payload including `oftenEnjoyedWith`, `similarFoods`, `seasonalConnections`, `householdConnections`. Fully powered by `getFoodRelationships`.
- **GET `/api/foods/:slug`** (Food Detail) — Includes discovery sections. Powered by WS8 which depends on WS7.
- **GET `/api/pantry/discover`** — Returns discovery sections. Powered by WS8 which depends on WS7.

---

## UI USAGE

- **Food Detail page** — `ConnectedFoodPanel` renders the food relationship web under every canonical food page. Renders only when data is non-empty (progressive enrichment — empty graph ⇒ component returns null).
- **Food Detail page** — Discovery sections ("You might also enjoy" style) rendered from the main food API response.
- **Pantry Knowledge Hub** — Discovery section via `/api/pantry/discover`.
- **Dashboard / Nutrition views** — Opportunity and seasonal sections via the aggregated story route.

---

## DATABASE IMPACT

**None.** The entire WS7 graph is in-memory. No tables, no migrations, no schema additions from this commit. The graph is derived from:
- `CANONICAL_SEED` (shared/canonical/foods.ts) — already in the codebase
- `FOOD_BENEFITS` (shared/knowledge/relationships.ts) — already in the codebase
- `EDITORIAL_GRAPH` — a literal object in food-graph.ts

---

## CLASSIFICATION

**D — Actively used in production runtime.**

The "POC" label in the commit message describes the _origin_ of the module — it was built as a proof of concept to answer whether THA could provide food relationship data without a graph database. That question was answered YES, and the module was subsequently adopted as the canonical owner of food-to-food relationships by:

- WX5 (Connected Food Intelligence Assembler) — committed in `58c8b73` checkpoint
- WS8 (Food Discovery Engine) — committed in `0a996f8`
- Live routes (`/api/foods/:slug/connected`, `/api/pantry/discover`)
- Live UI (`ConnectedFoodPanel` on every Food page)

The module is no longer a POC. It is the live data layer for food relationships.

---

## DOES IT AFFECT BUILD SIZE?

**Yes — minimally.** `shared/relationships/food-graph.ts` (633 lines) is compiled into the server bundle. The editorial graph literal (5 food nodes, ~100 edges) is a small constant embedded at compile time. No external dependencies introduced. Impact is negligible.

## DOES IT AFFECT RUNTIME?

**Yes, directly.** `getFoodRelationships()` executes synchronously on every request to the three routes listed above. It performs in-memory Map lookups and array filtering — no I/O, no blocking, microsecond cost. The lazy canonical index (`getCanonicalIndex()`) is built once per process.

## DOES IT AFFECT DATABASE SCHEMA?

**No.** Zero database changes in this commit. No new tables, no migrations.

## DOES IT AFFECT API RESPONSES?

**Yes.** Removing WS7 would break:
- `GET /api/foods/:slug/connected` — response would be empty or 500
- `GET /api/foods/:slug` — discovery sections would be empty
- `GET /api/pantry/discover` — entire response would be empty
- Dashboard opportunity / seasonal sections — would be silent voids

## DOES IT AFFECT PLANNER?

**No direct dependency.** No planner routes, planner components, or planner assemblers import from `shared/relationships`.

## DOES IT AFFECT PANTRY?

**Yes.** `GET /api/pantry/discover` calls `discover()` (WS8) which calls `getFoodRelationships()` (WS7). The Pantry Knowledge Hub's discovery section depends on WS7.

## DOES IT AFFECT NUTRITION REPORT?

**No direct dependency.** No nutrition report components or assemblers import from `shared/relationships`. The Nutrition Report owns its own data pipeline.

## DOES IT AFFECT FOOD INTELLIGENCE?

**Yes — it is a core dependency of Food Intelligence.** WX5 (Connected Food Intelligence) is built on WS7. WS8 (Food Discovery Engine) is built on WS7. Both are live features on the Food Detail page.

---

## SAFE TO SHIP

**YES**

The module is already live. It has no schema changes, no database writes, no side effects, and no hardcoded user data. It is a read-only, in-memory library. Every consumer handles the null-return case gracefully (progressive enrichment — absent data renders nothing). The editorial graph covers 5 food nodes; remaining nodes resolve via derived same_family and shares_benefits logic.

Excluding WS7 from the release would break the Connected Foods panel and discovery sections on every Food page, the Pantry discover endpoint, and dashboard opportunity sections. It cannot be safely excluded without also reverting WX5 (WS8, WX5 route handlers, ConnectedFoodPanel, food-detail-page integration) — a significantly larger revert.

---

## RECOMMENDATION

**KEEP**

**Reason:** WS7 is not a dormant POC. It is the live canonical owner of food-to-food relationships. Its `getFoodRelationships()` function is called in production on every Food page load and every Pantry discover request. Removing it would require reverting WX5, WS8, and all downstream consumers — a destructive change that is well outside the scope of the clean release. The commit is safe: no schema changes, no database writes, no hardcoded credentials, no operational tooling. The "POC" label in the commit message is historical — it reflects how the module was designed, not how it is used today.
