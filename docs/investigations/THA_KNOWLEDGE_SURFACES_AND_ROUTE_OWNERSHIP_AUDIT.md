# THA Knowledge Surfaces and Route Ownership Audit

**Date:** 2026-06-24  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Rollback tag:** `audit/knowledge-surfaces-pre-investigation` → commit `f531216`  
**Scope:** Investigation only. No code changed.

---

## ROLLBACK PROTECTION

**Status:** CONFIRMED  
**Tag created:** `audit/knowledge-surfaces-pre-investigation`  
**Points to commit:** `f531216` — feat(ws11): Seasonal Stories Engine  

To restore:
```
git checkout audit/knowledge-surfaces-pre-investigation
# or
git reset --hard audit/knowledge-surfaces-pre-investigation
```

Note: At time of audit, working tree has 6 unstaged modifications and 7 untracked docs. These are preserved — the rollback tag targets HEAD (last committed state), not working tree.

---

## PHASE 1 — ROUTE INVENTORY

Every route that can display food knowledge, nutrients, benefits, or health information.

| Route | Component | Purpose | Navigation path | Current / Legacy |
|---|---|---|---|---|
| `/pantry` (default) | `PantryPage` → `FoodPantrySection` | Pantry inventory list with inline ingredient expand showing Supports / Key Nutrients | Nav: Pantry | MIXED |
| `/pantry?mode=explore` | `PantryPage` → `PantryKnowledgeHub` | Full food knowledge hub: Search, Discover, Browse, Food detail, Nutrient detail, Benefit detail | Pantry → Explore tab | CURRENT (WS0) |
| `/plant-diversity` | `PlantDiversityPage` → `PlantDiversityReport` | Nutrition Report: weekly ingredient breakdown, plant count, Supports / Key Nutrients per ingredient | Planner → Plant Diversity link | CURRENT (WS0) |
| `/planner` or `/weekly-planner` | `WeeklyPlannerPage` → `MealUpliftPanel` | Nutrition Boost suggestions in meal detail modal; shows nutrients + benefits from WS0 | Nav: Planner | CURRENT (WS0) |
| `/basket` / `/analyse-basket` / `/shopping-list` | `ShoppingListPage` → `FoodKnowledgeModal` | Additive type info popup (triggered by additive chip click) | Nav: Basket / Shopping List | SEPARATE DB (not WS0) |
| `/meals/:id` | `MealDetailPage` | Meal detail page | Nav: Cookbook → meal | NO KNOWLEDGE SURFACE |

### Navigation landing (authenticated user)

On login, `HomeRoute` queries `/api/routing`. The result routes to one of:
- `planner` → `/planner`
- `cookbook` → `/cookbook`
- `analyser` → `/analyser`
- default → `/shopping-list`

Colin's likely landing: `/planner` or `/shopping-list`.

---

## PHASE 2 — KNOWLEDGE COMPONENT INVENTORY

Every component that renders food knowledge content.

| Component | File | Route(s) | Data source | Current / Legacy |
|---|---|---|---|---|
| `PantryKnowledgeHub` | `components/PantryKnowledgeHub.tsx` | `/pantry?mode=explore` | WS0 registry via `/api/knowledge/*` + WS8–WS11 engines | CURRENT |
| `PlantDiversityReport` | `components/PlantDiversityReport.tsx` | `/plant-diversity` | WS0 via `/api/knowledge/ingredient-lookup` POST | CURRENT |
| `FoodReport` | `components/FoodReport.tsx` | `/plant-diversity` (expanded rows) | WS2A canonical via `shared/canonical/food-report-adapter` | CURRENT |
| `MealUpliftPanel` | `components/MealUpliftPanel.tsx` | `/planner` (meal modal) | WS0 via `/api/knowledge/ingredient-lookup` POST | CURRENT |
| `FoodKnowledgeModal` | `components/food-knowledge-modal.tsx` | `/shopping-list` (additive popups) | Separate DB encyclopedia via `/api/food-knowledge/:slug` | SEPARATE — not WS0 |
| `PantryExplore` | `components/PantryExplore.tsx` | **NONE — orphaned** | `health-benefits-model.ts` → `nutrition-benefit-library.ts` | LEGACY — ORPHANED |
| `NutritionBoostPanel` | `components/NutritionBoostPanel.tsx` | **NONE — not rendered directly** | `nutrition-boosts.ts` (static client-side) | LEGACY — ORPHANED |
| Pantry item expand | `pages/pantry-page.tsx` (inline, inside `FoodPantrySection`) | `/pantry` (inventory mode) | Static `pantry-knowledge.ts` (primary) + `/api/pantry/knowledge/:key` (DB + AI fallback) | MIXED — not WS0 |

---

## PHASE 3 — DATA SOURCE TRACE

### Trace A: Pantry Knowledge Hub (`/pantry?mode=explore`)

```
PantryKnowledgeHub (PantryKnowledgeHub.tsx)
  ↓
  HomeView / BrowseView / FoodDetailView / NutrientDetailView / BenefitDetailView
  ↓
  useQuery [/api/knowledge/search]         → searchKnowledgeRegistry()
  useQuery [/api/knowledge/foods]          → listFoodCards()
  useQuery [/api/knowledge/foods/:slug]    → getFoodDetailView()
  useQuery [/api/knowledge/nutrients/:slug]→ getNutrientDetailView()
  useQuery [/api/knowledge/benefits/:slug] → getBenefitDetailView()
  useQuery [/api/pantry/discover]          → discover() engine (WS8)
  useQuery [/api/pantry/alternatives]      → alternatives() engine (WS9)
  useQuery [/api/pantry/stories]           → stories() engine (WS10)
  useQuery [/api/pantry/seasonal]          → seasonalStories() engine (WS11)
  ↓
  server/services/nutrition-knowledge-registry.ts
  ↓
  knowledgeFoods / knowledgeNutrients / knowledgeHealthBenefits tables (DB)
  ↓
  WS0 Knowledge Registry

Status: COMPLIANT
```

### Trace B: Plant Diversity Report (`/plant-diversity`)

```
PlantDiversityPage (pages/plant-diversity-page.tsx)
  ↓
  PlantDiversityReport (components/PlantDiversityReport.tsx)
  ↓
  POST /api/knowledge/ingredient-lookup
  ↓
  resolveIngredientsToKnowledgeSummary()
  ↓
  server/services/nutrition-knowledge-registry.ts
  ↓
  knowledgeFoods / knowledgeNutrients / knowledgeFoodNutrients / knowledgeFoodBenefits tables (DB)
  ↓
  WS0 Knowledge Registry

  Also (for plant-based expanded rows):
  ReportRow → FoodReport (components/FoodReport.tsx)
  ↓
  buildFoodReport() from shared/canonical/food-report-adapter.ts
  ↓
  shared/canonical/foods.ts (WS2A canonical foods seed data)

Status: COMPLIANT (WS0 for Supports + Key Nutrients columns; WS2A canonical for expanded FoodReport)
```

### Trace C: Nutrition Boost in Planner (`/planner` meal modal)

```
WeeklyPlannerPage (pages/weekly-planner-page.tsx)
  ↓
  MealUpliftPanel (components/MealUpliftPanel.tsx)
  ↓
  POST /api/knowledge/ingredient-lookup   ← WS0 nutrients + benefits (expanded view)
  GET  /api/meals/:id/uplift-applications ← provenance
  POST /api/uplift/accept                 ← accept action
  ↓
  server/services/nutrition-knowledge-registry.ts
  ↓
  WS0 Knowledge Registry

  Also: fallback suggestions
  buildFallbackUpliftMatch() in weekly-planner-page.tsx
  ↓
  getMealBoosts() from client/src/lib/nutrition-boosts.ts (static client-side)
  ↓
  Static boost rules (NOT WS0)

Status: COMPLIANT for knowledge display; fallback suggestions are static/deterministic, not WS0
```

### Trace D: Pantry Item Expand (`/pantry` inventory mode)

```
PantryPage → FoodPantrySection (pages/pantry-page.tsx)
  ↓
  toggleExpanded(id, ingredientKey)
  ↓
  PRIMARY: getPantryKnowledge(ingredientKey)
    ↓ static PANTRY_KNOWLEDGE map in client/src/lib/pantry-knowledge.ts
    ↓ ~35 curated ingredients only (olive oil, turmeric, chickpeas, spinach, etc.)

  FALLBACK (if static returns null):
    GET /api/pantry/knowledge/:key
    ↓ storage.getPantryIngredientKnowledge(canonicalKey)  ← DB table
    ↓ If null: async AI enrichment via openai-enrichment.ts → stored back to DB

Displayed fields: Supports · Highlights · Why it matters · Good to know · How to choose

Status: NON-COMPLIANT — uses pantry-knowledge.ts static data + DB/AI enrichment. 
        Does NOT use WS0 registry.
```

### Trace E: FoodKnowledgeModal (Shopping List additive popups)

```
ShoppingListPage (pages/shopping-list-page.tsx)
  ↓
  additive chip onClick → setKnowledgeSlug(additive.type.toLowerCase()...)
  ↓
  FoodKnowledgeModal (components/food-knowledge-modal.tsx)
  ↓
  GET /api/food-knowledge/:slug
  ↓
  storage.getFoodKnowledgeBySlug()
  ↓
  foodKnowledge DB table (separate from WS0 tables)

Status: NON-COMPLIANT — uses a separate food knowledge encyclopedia DB table,
        not the WS0 Knowledge Registry.
```

### Trace F: PantryExplore (ORPHANED — not rendered)

```
PantryExplore (components/PantryExplore.tsx)
  ↓
  listLibraryFoods()       ← health-benefits-model.ts
  buildNutrientIndex()     ← health-benefits-model.ts
  listHealthBenefitTopics() ← health-benefits-model.ts (returns [] always)
  ↓
  getNutritionBenefit() / getAllNutritionBenefits()
  ↓
  client/src/lib/nutrition-benefit-library.ts (static client-side array)

Status: NON-COMPLIANT — uses legacy static nutrition-benefit-library.ts.
        MOOT: component is not imported or rendered anywhere in the app.
```

### Trace G: NutritionBoostPanel (ORPHANED — not rendered)

```
NutritionBoostPanel (components/NutritionBoostPanel.tsx)
  ↓
  getMealBoosts()
  ↓
  client/src/lib/nutrition-boosts.ts (static client-side boost rules)

Status: NON-COMPLIANT — uses static client-side data, not WS0.
        MOOT: component is not imported or rendered anywhere in the app.
        NOTE: getMealBoosts() IS still used in weekly-planner-page.tsx as fallback.
```

---

## PHASE 4 — USER JOURNEY TRACE

### If Colin clicks through the app naturally

```
Dashboard → /planner (likely routing destination)
  ↓
  Sees meal plan grid
  MealUpliftPanel (within meal detail modal)
    Data: WS0 via /api/knowledge/ingredient-lookup
    Surfaces: Nutrients · Benefits (in expanded suggestion row)
  ↓

→ /plant-diversity (via "Plant Diversity" or "Nutrition Report" link in planner)
  ↓
  PlantDiversityReport
    Data: WS0 via /api/knowledge/ingredient-lookup POST
    Surfaces: Supports column · Key Nutrients column
    Also: FoodReport in expanded rows (WS2A canonical)
  ↓

→ /pantry (via nav)
  ↓
  Mode=inventory (default):
    FoodPantrySection — expand a pantry item
      Data: pantry-knowledge.ts (static) → /api/pantry/knowledge/:key (DB+AI)
      Surfaces: Supports · Highlights · Why it matters (NOT WS0)
  ↓
  Switch to Explore tab → /pantry?mode=explore
    PantryKnowledgeHub
      Data: WS0 via /api/knowledge/* + WS8–WS11
      Surfaces: Full food knowledge hub (Benefits · Nutrients · Discover · Alternatives · Stories · Seasonal)
  ↓

→ /shopping-list (via nav or routing)
  ↓
  Click additive chip → FoodKnowledgeModal
    Data: /api/food-knowledge/:slug (separate DB encyclopedia)
    Surfaces: What is it · Why THA highlights this · What to know · Simpler alternatives
```

**Key finding:** Colin can see three different knowledge experiences in one session — WS0 (PantryKnowledgeHub, PlantDiversityReport, MealUpliftPanel), static legacy (pantry item expand), and a separate DB encyclopedia (FoodKnowledgeModal in shopping list). They look visually similar but are powered by different systems.

---

## PHASE 5 — CURRENT VS LEGACY MATRIX

| Surface | Current (WS0) | Legacy | Source | Notes |
|---|---|---|---|---|
| Pantry Knowledge Hub (`/pantry?mode=explore`) | ✅ | — | WS0 registry + WS8–WS11 | Full current implementation |
| Plant Diversity Report (`/plant-diversity`) — Supports + Key Nutrients columns | ✅ | — | WS0 via ingredient-lookup | Shows `—` when WS0 has no data |
| Plant Diversity Report — Expanded FoodReport | ✅ | — | WS2A canonical foods | Part of WS2 series |
| Nutrition Boost / MealUpliftPanel in planner | ✅ | — | WS0 via ingredient-lookup (for expanded detail) | Uplift rules from server engine; fallback from static `nutrition-boosts.ts` |
| Pantry item expand (inventory mode) | — | ✅ | `pantry-knowledge.ts` static (primary) + DB+AI (fallback) | NOT migrated to WS0 |
| Food Knowledge Modal (shopping list additives) | — | ⚠️ Separate | `/api/food-knowledge` encyclopedia DB | Not WS0; not legacy; distinct third system |
| PantryExplore component | — | ✅ ORPHANED | `nutrition-benefit-library.ts` static | Not rendered anywhere |
| NutritionBoostPanel component | — | ✅ ORPHANED | `nutrition-boosts.ts` static | Not rendered as standalone |
| Stories surface (household) | ✅ | — | WS10 stories engine via `/api/pantry/stories` | |
| Seasonal Stories | ✅ | — | WS11 seasonal engine via `/api/pantry/seasonal` | |
| Discovery | ✅ | — | WS8 discovery engine via `/api/pantry/discover` | |
| Alternatives | ✅ | — | WS9 alternatives engine via `/api/pantry/alternatives` | |
| Meal Detail Page (`/meals/:id`) | — | — | None | No food knowledge surface present |

---

## PHASE 6 — VISUAL OWNERSHIP AUDIT

| Surface | In nav? | Linked from app? | Reachable? | Hidden? | Orphaned? | Should retire? |
|---|---|---|---|---|---|---|
| PantryKnowledgeHub | Yes (Pantry → Explore tab) | Yes | Yes | No | No | No |
| PlantDiversityReport | Yes (planner link) | Yes | Yes | No | No | No |
| FoodReport (in PlantDiversityReport) | No (inline) | Implicit | Yes (via expand) | No | No | No |
| MealUpliftPanel | No (modal only) | Via planner meal click | Yes | No | No | No |
| FoodKnowledgeModal | No (modal only) | Via shopping list additive chips | Yes | No | No | No |
| `PantryExplore.tsx` | No | No | **NO** | **Yes** | **Yes** | **YES — retire file** |
| `NutritionBoostPanel.tsx` | No | No | **NO** | **Yes** | **Yes** | **YES — retire file** |
| Pantry item expand (inline) | No (inline) | Via expand chevron in pantry | Yes | No | No | SUGGESTION (migrate to WS0) |

---

## PHASE 7 — DUPLICATION AUDIT

### Duplication 1: `PantryExplore` vs `PantryKnowledgeHub`

Two components for the same conceptual role (Pantry Explore / Nutrition Knowledge Hub).

| | `PantryExplore.tsx` | `PantryKnowledgeHub.tsx` |
|---|---|---|
| Status | Orphaned (not imported anywhere) | Active (imported by pantry-page.tsx) |
| Source | `nutrition-benefit-library.ts` (static) | WS0 registry + WS8–WS11 |
| Used at | Nowhere | `/pantry?mode=explore` |

**Risk:** Low — `PantryExplore` is unreachable. No user will see it.  
**User impact:** None currently. Risk arises if a future developer imports it by mistake.  
**Recommendation:** SUGGESTION — delete `PantryExplore.tsx` to eliminate the confusion.

---

### Duplication 2: `NutritionBoostPanel` vs `MealUpliftPanel`

Two components for boost suggestions in the planner.

| | `NutritionBoostPanel.tsx` | `MealUpliftPanel.tsx` |
|---|---|---|
| Status | Orphaned (not imported anywhere) | Active (imported by weekly-planner-page.tsx) |
| Source | `nutrition-boosts.ts` (static) | WS0 + server uplift engine + `nutrition-boosts.ts` (as fallback) |
| Used at | Nowhere | `/planner` meal modal |

**Risk:** Low — `NutritionBoostPanel` is unreachable.  
**User impact:** None currently.  
**Recommendation:** SUGGESTION — delete `NutritionBoostPanel.tsx` to eliminate confusion.

---

### Duplication 3: Four knowledge systems co-exist

| System | Location | Consumer(s) | Status |
|---|---|---|---|
| WS0 Knowledge Registry | DB — `knowledge_*` tables | PantryKnowledgeHub, PlantDiversityReport, MealUpliftPanel | CURRENT (authoritative) |
| Food Knowledge Encyclopedia | DB — `food_knowledge` table | FoodKnowledgeModal (shopping list additives only) | SEPARATE — not WS0, not legacy |
| Pantry Ingredient Knowledge | DB — `pantry_ingredient_knowledge` table | Pantry item expand (fallback) | MIXED — AI-enriched, not WS0 |
| Static client-side libraries | `pantry-knowledge.ts` + `nutrition-benefit-library.ts` | Pantry item expand (primary) + PantryExplore (orphaned) | LEGACY |

**Risk:** A user can see different data for the same food depending on which surface they use. E.g. olive oil in pantry expand (static data) vs olive oil in PantryKnowledgeHub (WS0).  
**User impact:** Inconsistent knowledge display for the same ingredient across surfaces.  
**Recommendation:** SUGGESTION — migrate pantry item expand to read from WS0 registry (M1 follow-up task).

---

### Duplication 4: Redundant "Supports" labels across surfaces

The label "Supports" appears in two contexts driven by different systems:
- **Pantry item expand** (`pantry-page.tsx` line 551) → from static `pantry-knowledge.ts`
- **PlantDiversityReport** (column header) → from WS0 `benefits` array

Both use the word "Supports" but the data behind it comes from different sources with different coverage.

**Risk:** User trust. If Colin sees "Supports: Iron, Fibre" for spinach in the pantry expand, then sees "Supports: —" for spinach in the Plant Diversity Report, the gap is confusing even though both are technically honest.

---

## PHASE 8 — LAUNCH RISK REVIEW

### Could a user land on an outdated screen?

🟢 **Safe** — The primary knowledge routes (`/pantry?mode=explore`, `/plant-diversity`, `/planner`) all use WS0 or current engines. No user is being routed to a legacy screen.

---

### Could a user see conflicting food knowledge?

🟡 **Important** — Pantry item expand (inventory mode) uses `pantry-knowledge.ts` (static, ~35 foods), while PantryKnowledgeHub uses WS0. For the same ingredient (e.g. spinach):
- Pantry expand: "Supports: Iron, Folate" (from static data — if in the 35)
- PantryKnowledgeHub food detail: benefits from WS0 (may differ if WS0 data diverges)

These surfaces are not in direct competition on the same screen, but a user could open both in the same session.

---

### Could a user see different nutrient data?

🟡 **Important** — PlantDiversityReport shows "Key Nutrients: —" (dashes) for any ingredient not in WS0. The pantry static data shows nutrients for ~35 curated items. A user could see different nutrient coverage per surface.

---

### Could a user see different benefit data?

🟡 **Important** — Same as above. WS0 benefit coverage may not match the static `pantry-knowledge.ts` coverage.

---

### Could a user see a retired experience?

🟢 **Safe** — `PantryExplore` is fully orphaned (not linked, not rendered). `NutritionBoostPanel` is fully orphaned. No user can navigate to them.

---

### Could a user see "—" dashes and think the system is broken?

🟡 **Important** — Yes. When WS0 does not have an entry for an ingredient, PlantDiversityReport shows `—` in both Supports and Key Nutrients columns. This is honest (the system has no data), but to a user it looks like the feature is not working. The dashes are a **data population gap in WS0**, not a legacy system failure.

---

### Launch risk summary

| Risk | Classification |
|---|---|
| User lands on legacy screen | 🟢 Safe — not possible |
| Orphaned PantryExplore in codebase | 🟡 Important — code debt, not user-facing |
| Orphaned NutritionBoostPanel in codebase | 🟡 Important — code debt, not user-facing |
| Pantry item expand uses non-WS0 data | 🟡 Important — inconsistency, not blocking |
| FoodKnowledgeModal uses separate encyclopedia | 🟡 Important — not WS0, but scoped to additive type popups only |
| WS0 data gaps → Supports/Key Nutrients show `—` | 🟡 Important — data gap, not system failure |
| Four co-existing knowledge systems | 🟡 Important — architectural complexity, not user-blocking |
| Conflicting data for same ingredient across surfaces | 🟡 Important — edge case, scoped to pantry expand vs hub |
| No launch-blocking user-facing broken experience | 🟢 Safe |

**Verdict: No 🔴 launch blockers identified in knowledge surfaces.**

---

## PHASE 9 — SCREENSHOT MAPPING

### When Colin sees `Supports: —` and `Key Nutrients: —`

**Which route?** `/plant-diversity`

**Which component?** `PlantDiversityReport` (`components/PlantDiversityReport.tsx`)

**Exact rendering location (column headers):**
- `PlantDiversityReport.tsx` line 738: `<th>Supports</th>`
- `PlantDiversityReport.tsx` line 742: `<th>Key Nutrients</th>`

**When dashes appear:**
- `benefitSummary` is null: `knowledge?.benefits?.slice(0, 2).join(" · ") ?? null` → renders `—`
- `keyNutrients` is empty: `knowledge?.nutrients ?? []` → renders `—`

**Why dashes?** The `ingredientKnowledge` map is populated by a POST to `/api/knowledge/ingredient-lookup`. This hits `resolveIngredientsToKnowledgeSummary()` in `nutrition-knowledge-registry.ts`, which looks up the ingredient key against the WS0 `knowledge_foods` + `knowledge_food_nutrients` + `knowledge_food_benefits` tables. If the ingredient key is not in WS0, the response omits it, and the component renders `—`.

**Knowledge source powering it:** WS0 Knowledge Registry (via `/api/knowledge/ingredient-lookup`)

**Is this current or legacy?** CURRENT WS0 experience — but with a data population gap.

**Evidence:**
- `PlantDiversityReport.tsx` line 979–993: `useQuery` with `queryFn` POSTing to `/api/knowledge/ingredient-lookup`
- Server comment at line 9488: `"Used by PlantDiversityReport and MealUpliftPanel (replaces nutrition-benefit-library.ts)"`
- The `—` rendering at lines 658–659 and 662–665 in `PlantDiversityReport.tsx`

---

## FINAL QUESTION

**When Colin sees `Supports: —` / `Key Nutrients: —`, which exact route and component?**

- **Route:** `/plant-diversity`
- **Component:** `PlantDiversityReport` (`components/PlantDiversityReport.tsx`)

**Is he currently using:**

**A. Current WS0 experience** ✅

The dashes are not evidence of a legacy system. They are an honest empty state produced by the current WS0 pipeline when WS0 has no registered knowledge entry for that specific ingredient key. The ingredient lookup is hitting the right system (`resolveIngredientsToKnowledgeSummary` → WS0 tables). The gap is in the WS0 data, not in which system is being used.

---

## DEFINITION OF DONE — CHECKLIST

| Item | Status |
|---|---|
| Every knowledge route identified | ✅ |
| Every knowledge component identified | ✅ |
| Data source trace completed | ✅ |
| Current vs legacy matrix completed | ✅ |
| User journey mapped | ✅ |
| Screenshot question answered | ✅ |
| Duplications identified | ✅ |
| Launch risks identified | ✅ |
| Clear recommendation provided | ✅ |

---

## SUGGESTIONS (future work — not in scope of this investigation)

1. **SUGGESTION — Delete `PantryExplore.tsx`**  
   The component is orphaned and unused. Its legacy `nutrition-benefit-library.ts` data source has been superseded by `PantryKnowledgeHub`. Removing it reduces confusion and eliminates dead code.

2. **SUGGESTION — Delete `NutritionBoostPanel.tsx`**  
   The component is orphaned and unused as a standalone. Its logic (`getMealBoosts()`) is still used as a fallback inside `weekly-planner-page.tsx`, but the component file itself is not rendered anywhere. Consider either deleting the file or retaining it as an internal utility (renaming to make its status clear).

3. **SUGGESTION — Migrate pantry item expand to WS0**  
   The inline expand in inventory mode (`/pantry`) reads from `pantry-knowledge.ts` (static, ~35 foods) with a DB+AI fallback. This is the only remaining knowledge-displaying surface not powered by WS0. Migrating it would give one consistent knowledge system for all surfaces. This is a standalone data-layer task.

4. **SUGGESTION — Audit `FoodKnowledgeModal` / `/api/food-knowledge` relationship to WS0**  
   The `food_knowledge` encyclopedia DB table used for additive popups is a fourth knowledge system. Clarify whether this should eventually be unified with WS0 or remain a separate tool-specific store.

5. **SUGGESTION — WS0 coverage expansion for common pantry ingredients**  
   The dashes Colin sees in PlantDiversityReport are a WS0 data gap. Expanding WS0 seed data to cover common pantry staples (garlic, onion, chicken, pasta, etc.) would eliminate most dashes from the weekly report and make the table feel populated.

6. **SUGGESTION — Explicit WS0 coverage audit**  
   Compare ingredients appearing in real weekly plans against WS0 `knowledge_foods`. Identify the highest-frequency ingredients missing from WS0 and prioritise their addition.

---

## FILE LOCATION

`docs/investigations/THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md`
