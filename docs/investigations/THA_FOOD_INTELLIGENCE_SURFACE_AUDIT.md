# THA Food Intelligence Surface Audit

**Date:** 2026-06-24
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `audit/food-intelligence-surface-20260624`
**Scope:** Investigation only — no implementation, no UI changes, no schema changes

---

## Rollback Protection

Confirmed.

- **Tag:** `audit/food-intelligence-surface-20260624` (created at HEAD before audit began)
- **Working changes:** preserved (stash + pop cycle completed, all modifications restored)
- **Safe to revert to:** `git checkout audit/food-intelligence-surface-20260624`

---

## The Question This Audit Answers

THA has a fully operational Food Intelligence Platform:

- WS0 Knowledge Registry (188 foods, ~24 nutrients, ~15 health benefits, relationships)
- WS8 Discovery Engine (6 discovery types)
- WS9 Alternatives Engine (5 alternative types)
- WS10 Household Stories Engine (5 story types)
- WS11 Seasonal Stories Engine

The question is: where does the user actually feel this?

---

## Phase 1 — Current Consumer Audit

### Every surface currently consuming WS0

| Surface | Component | Route | WS0 Data Used | User-Visible | Value Provided |
|---------|-----------|-------|---------------|-------------|----------------|
| Pantry › Explore | `PantryKnowledgeHub` | `/pantry?mode=explore` | Full registry: search, categories, foods, nutrients, benefits + WS8, WS9, WS10, WS11 | YES — mode switch required | HIGH but buried |
| Pantry › Inventory expand | `FoodPantrySection` (chevron) | `/pantry` | `/api/pantry/knowledge/:key` (legacy static knowledge, not WS0 tables) | On-demand — hidden behind chevron | LOW |
| Planner › Meal card | `NutritionVarietyDots`, `UpliftCardIndicator` | `/planner` | `computeMealVariety` (client-side), `getMealBoosts` (client-side static), `/api/uplift/batch` | YES — dots on every card | MODERATE |
| Planner › Meal dialog | `MealUpliftPanel` | `/planner` (dialog) | WS0 batch lookup `/api/knowledge/ingredient-lookup` + `/api/uplift/batch` | YES — in dialog | HIGH |
| Nutrition Report | `PlantDiversityReport` | `/plant-diversity` | WS0 batch ingredient lookup `/api/knowledge/ingredient-lookup` | YES — full page | HIGH |
| Shopping list › item expand | `FoodKnowledgeModal` | `/list`, `/shopping-list` | `/api/food-knowledge/:slug` (legacy FoodKnowledge table, **not WS0**) | On-demand — hidden | LOW–MODERATE |
| Food Diary › day summary | `DayVarietySummary`, `DayNutrientSummary` | `/diary` | `computeMealVariety`, `getMealNutrients` (both client-side — **no WS0 API calls**) | YES — below each day | PARTIAL |
| Meal Detail | `SimplyBetterChoicesPanel` | `/meals/:id` | `upliftMatches=[]` — hardcoded empty. No WS0 call. | YES — but always empty | NONE |
| Meal Detail | `NutritionBoostPanel` | `/meals/:id` | `getMealBoosts` (static client-side library) — **not WS0** | YES — shows boost suggestions | PARTIAL (not WS0) |

### WS8–11 Consumer Summary

| Engine | Route | Only Consumer |
|--------|-------|---------------|
| WS8 Discovery | `/api/pantry/discover` | `PantryKnowledgeHub` only |
| WS9 Alternatives | `/api/pantry/alternatives` | `PantryKnowledgeHub` only |
| WS10 Stories | `/api/pantry/stories` | `PantryKnowledgeHub` only |
| WS11 Seasonal | `/api/pantry/seasonal` | `PantryKnowledgeHub` only |

**All four narrative engines (WS8–11) are exclusively consumed by one component behind a mode switch.**

---

## Phase 2 — Whole App Inventory

### Every user-facing page

| Page | Route | Purpose | Intelligence Present |
|------|-------|---------|---------------------|
| Dashboard | `/dashboard` | Overview: meal counts, basket stats, planner week chart | None |
| Cookbook | `/cookbook`, `/meals` | Browse and manage meals | None |
| Meal Detail | `/meals/:id` | View/edit a meal, ingredients, instructions, nutrition | Partial (NutritionBoostPanel: static. SimplyBetterChoicesPanel: empty.) |
| Planner | `/planner` | Build week, place meals, review household fit | Variety dots (client). Uplift (WS0). |
| Smart Planner | `/planner` (assistant) | AI-suggested meal assignment | None (suggestion uses meal scoring, not WS0) |
| Shopping List | `/list`, `/shopping-list` | Check off, add items, send to supermarket | FoodKnowledgeModal (legacy, not WS0) |
| Shopping Workspace | `/shopping-workspace` | Full workspace view of basket | None |
| Analyser | `/analyser`, `/products` | Scan/search products, NOVA score, UPF detection | UPF analysis + restriction safety. No WS0. |
| Diary | `/diary` | Log meals by day/slot, track health signals | Client-side variety + nutrient tags |
| Profile | `/profile` | Diet preferences, household setup, health goals | None |
| Pantry › Inventory | `/pantry` | Track staples; fridge, larder, freezer | Static ingredient knowledge on expand |
| Pantry › Explore | `/pantry?mode=explore` | Browse knowledge, discover foods, read stories | Full WS0 + WS8–11 |
| Nutrition Report | `/plant-diversity` | Week's plant/food variety with WS0 data | WS0 batch lookup |
| Home | `/` (pre-login) | Landing / marketing | None |
| Onboarding | `/onboarding` | Household setup wizard | None |
| Shared Plan | `/shared/:token` | Guest-view of a plan | None |

---

## Phase 3 — Intelligence Opportunity Review

For every page: does food intelligence improve it?

| Page | Would Intelligence Help? | What Intelligence |
|------|-------------------------|-------------------|
| Dashboard | **YES** | Seasonal opportunities, household food stories, variety snapshot, discovery prompt |
| Cookbook | **YES** | Per-meal: key nutrients preview, health benefit chips, seasonality indicator |
| Meal Detail | **YES** | Full WS0 batch lookup for ingredient nutrients + benefits; seasonal callout; discovery link |
| Planner | **YES (partially exists)** | Seasonal callout per meal; deepen variety dots with WS0 nutrient names; "Explore alternatives" link |
| Smart Planner | **OPTIONAL** | Could filter/bias toward seasonal foods but risk: changes suggestion logic |
| Shopping List | **YES (cautious)** | Healthier alternative prompt for known ingredients; no disruption to task flow |
| Shopping Workspace | **NO** | Pure task execution; intelligence = distraction |
| Analyser | **YES** | WS0 benefit/nutrient callout when a known whole food is scanned |
| Diary | **YES** | WS0 batch lookup so "Supports" section uses live knowledge, not static library |
| Profile | **NO** | Setup page; intelligence here would feel preachy |
| Pantry › Inventory | **YES** | Replace legacy static knowledge with live WS0 knowledge on item expand |
| Pantry › Explore | **ALREADY EXISTS** | Full implementation |
| Nutrition Report | **ALREADY EXISTS** | Full WS0 batch lookup |
| Home / Onboarding / Shared Plan | **NO** | Wrong context |

---

## Phase 4 — User Value Analysis

Score: 0–100 based on user value, not engineering ease.

| Surface | Current Score | Potential Score | Value Gap | Notes |
|---------|--------------|----------------|-----------|-------|
| Planner › Meal dialog | 72 | 85 | +13 | Uplift panel works well. Missing: seasonal callout, discovery link |
| Nutrition Report | 68 | 80 | +12 | Deep-linked from planner, good WS0 usage. Hidden path reduces reach |
| Pantry › Explore | 65 | 75 | +10 | Comprehensive but needs a mode switch — low discovery |
| Meal Detail | 35 | 82 | **+47** | Large gap: SimplyBetterChoicesPanel empty, NutritionBoostPanel static |
| Food Diary | 38 | 70 | **+32** | Client-side variety/nutrients only; no WS0 benefits or named nutrients |
| Cookbook | 25 | 65 | **+40** | Zero intelligence; high browse time makes it a strong candidate |
| Dashboard | 20 | 72 | **+52** | Central entry point; currently pure metrics, zero food intelligence |
| Shopping List | 30 | 55 | +25 | Task-focused; intelligence has high distraction risk |
| Analyser | 55 | 72 | +17 | UPF detection is good; WS0 enrichment for whole foods has clear value |
| Pantry › Inventory expand | 40 | 65 | +25 | WS0 would replace legacy static; immediate quality win |

---

## Phase 5 — Meal Detail Review

### Current state

The Meal Detail page (`/meals/:id`) has:

1. `SimplyBetterChoicesPanel` — rendered with `upliftMatches=[]`. Always empty. No WS0 call.
2. `NutritionBoostPanel` — uses static `getMealBoosts()`, which is a client-side hardcoded library, not WS0.
3. No ingredient-level WS0 batch lookup.
4. Macro nutrition (calories, protein, carbs, fat) from OpenAI enrichment.

### What belongs here

**YES — WS0 ingredient batch lookup (nutrients + benefits)**
- The Planner already does this inside `MealUpliftPanel` via `/api/knowledge/ingredient-lookup`
- Meal Detail has all the same ingredients available
- Showing "Key Nutrients" and "Health Benefits" per ingredient would be genuine, data-backed intelligence
- Trust rule: only show rows that WS0 matched — silence on unmatched ingredients, no fabrication

**YES — Seasonal callout**
- If the meal contains seasonal ingredients, a single-line callout ("Salmon is in good supply this season") adds value without clutter
- Powered by WS0 food.seasonality field and WS11-style awareness

**YES — Discovery link (one, contextual)**
- "Curious about salmon? Explore it →" pointing to Pantry › Explore
- One link, not a section — does not clutter the page

**NO — Alternatives**
- Meal Detail is about a specific meal. Alternatives belong in the Planner dialog when a user is deciding what to cook, not after they've selected it.

**NO — Stories**
- Household stories belong in broader narrative surfaces (Dashboard, Pantry Explore). A meal detail page is too narrow.

### Recommendation

Add a WS0 batch lookup panel to Meal Detail showing: key nutrients (chip row, max 4) and health benefits (chip row, max 3). Reuse the exact pattern already working in `PlantDiversityReport` and `MealUpliftPanel`. Fix SimplyBetterChoicesPanel to not render when uplift data is absent.

---

## Phase 6 — Cookbook Review

### Current state

The Cookbook (`/cookbook`) shows meal cards. Each card displays: meal name, image, category chips, diet labels, Apple Score (where available), and a "Use by" date for freezer meals. Zero WS0 intelligence.

### What belongs here

**YES — Nutrient preview chips (subtle)**
- A small set of key nutrient chips below the meal name (e.g., "Fibre · Omega-3") would let users scan their collection for health value at a glance
- Maximum 2 chips — beyond that it becomes noise
- Source: WS0 batch lookup is the right backend; client-side `getMealNutrients` is a valid interim

**YES — Seasonal badge (single)**
- If a meal's primary ingredient is in season, a "✦ In season" chip would surface immediately useful information
- One chip only; restrained

**NO — Full benefits/nutrients expansion on card**
- Cards are browse surfaces; expansion belongs in Meal Detail
- More than 2 chips per card creates a dense, exhausting page

**NO — Discovery or Stories**
- Cookbook is a personal library, not an editorial discovery surface
- Inserting suggestions here would feel like the app trying to upsell, not help

### Recommendation

Add up to 2 subtle nutrient chips to Cookbook cards (already available via `getMealNutrients` — no new API needed). Add one "In season" chip if primary ingredient seasonality is known.

---

## Phase 7 — Planner Review

### Current state

The Planner (`/planner`) currently shows:

- Variety dots per meal card (client-side `computeMealVariety`)
- Weekly plant diversity counter (client-side)
- Uplift indicator badge on cards ("N boost ideas")
- Full `MealUpliftPanel` in the meal dialog (WS0 batch lookup + uplift engine)
- `NutritionVarietyDots` with short category labels (Fruit, Veg, Grains, Herbs, Fats)
- `MealNutrientTags` — tiny text below the card (max 3 nutrient names, client-side)

### What should be added

**YES — Seasonal callout on cards (one chip, occasional)**
- A "✦ Seasonal" chip when the meal's primary ingredient is in season
- Seasonal ingredients reward planning; a planner card is exactly the right moment
- Must be restrained: one chip only; shown only when the ingredient has confirmed UK seasonality

**YES — "Explore Nutrition Report" link when week has varied meals**
- Already exists via `WeeklyPlantDiversityCounter` — a link to `/plant-diversity`
- This is working well; reinforce rather than duplicate

**MAYBE — Named variety labels on hover/press (not always visible)**
- Currently "Veg · Herbs" shows as plain text; WS0 could enrich to the actual food name ("Spinach · Thyme")
- Risk: may produce too many long names on small cards
- Suggestion: tooltip on hover rather than always-visible label

**NO — Health benefits on cards**
- Benefit chips on every planner card would create visual noise
- Benefits belong in the Meal Detail dialog, not the card surface

**NO — Alternatives on cards**
- Alternatives are for deciding "what else could work" — that decision happens in the Planner Assistant, not on the card

### Verdict

Planner is the strongest existing intelligence surface. The risk is adding too much. The single highest-value addition is a seasonal chip on cards. Everything else risks cluttering a surface that already works.

---

## Phase 8 — Shopping Review

### Current state

The Shopping List (`/list`, `/shopping-list`) is task-focused: check items off, add items, view prices, send to supermarket. It has `FoodKnowledgeModal` (legacy, not WS0) accessible from item expansion.

### Should intelligence appear?

**YES (cautious) — Healthier alternative for specific items**
- When a user adds a packaged/processed item that has a known whole-food alternative (e.g., "vegetable oil" → "extra virgin olive oil"), a single quiet suggestion is appropriate
- This already exists via `getWholeFoodAlternative` (static library)
- WS0 could power a more accurate version via WS9 (Alternatives engine)
- Risk: users in shopping mode are in "execute" mindset; suggestions must be dismissible and infrequent

**YES — Replace legacy FoodKnowledgeModal with WS0**
- The `/api/food-knowledge/:slug` endpoint uses the legacy `food_knowledge` table
- This could be replaced by WS0 `getFoodDetailView` which has richer, more accurate data
- Zero user-experience change; backend quality improvement

**NO — Nutrient callouts on list items**
- A shopping list is not a learning surface
- Users do not want to read nutritional information while checking off butter
- This is the clearest case of intelligence-as-noise in the app

**NO — Discovery prompts**
- Discovery belongs in browsing contexts (Pantry Explore, Dashboard)
- A shopping list is the wrong moment

### Verdict

Shopping List should stay task-focused. The two improvements that belong here are: (1) replace legacy knowledge modal with WS0, (2) optionally wire WS9 to the existing whole-food alternative feature. No new intelligence surfaces.

---

## Phase 9 — Analyser Review

### Current state

The Analyser (`/analyser`) does: NOVA group scoring, UPF ingredient detection, Apple Score calculation, restriction safety checks, whole-food recognition via `WholeFoodAnalysisCard`. No WS0 usage.

### Is WS0 underused?

**YES — One clear gap**

When a recognised whole food is scanned/searched (e.g., "salmon", "spinach"), `WholeFoodAnalysisCard` shows an Apple Score of 5 and a "whole food" label. This is the right moment to add 2–3 WS0 benefit chips and 2 nutrient chips. The user has already asked about the food; the context is perfect.

**NO — On packaged products**

UPF analysis is the Analyser's core job. WS0 is about whole foods and their nutrients. A packaged biscuit has no WS0 identity; showing intelligence here would mean fabricating it. The integrity rule (only show matched foods, never guess) means most Analyser use cases would see empty state.

**NO — Per-ingredient callouts inside NOVA breakdown**

The ingredient list in `AnalyserDetailV2` breaks down individual ingredients of a product. Adding WS0 knowledge per ingredient would require resolving each ingredient string against WS0 — most would not match (e.g., "E471", "modified starch"), and the empty-state majority would be confusing.

### Verdict

Add WS0 nutrients + benefits to `WholeFoodAnalysisCard` only. This is a targeted, high-value addition with zero noise risk because the component only renders for confirmed whole foods.

---

## Phase 10 — Dashboard Review

### Current state

The Dashboard (`/dashboard`) shows: greeting, meal collection count, meals planned this week, average THA basket score, meal mix pie chart, weekly meal distribution bar chart, planner week preview. Zero food intelligence.

### If THA is a Food Intelligence Platform, what should Dashboard surface?

**YES — Weekly food story (one card)**
- WS10 generates household stories: "Your kitchen has featured garlic in 12 meals" or "You discovered miso this season"
- A single story card on Dashboard would signal to users that THA knows and remembers them
- This is the "Spotify Wrapped" sensation — immediate, personal, memorable
- Key rule: one card only. If nothing is generated, show nothing (silence is better than padding)

**YES — Seasonal prompt (one line)**
- "It's peak time for asparagus — it's in 2 of your planned meals" or "Try adding in-season broad beans"
- Powered by WS11 + planner data
- Short, positive, actionable, dismissible

**YES — Variety snapshot (if planner has a week)**
- "Your week covers X plant families" — already powered by existing client-side variety counter
- This exists as a link to the Nutrition Report from the planner; bringing it to Dashboard makes it more visible

**NO — Discovery suggestions on Dashboard**
- Discovery (WS8) is best experienced in context: browsing Pantry, viewing a food page
- Discovery on Dashboard feels like the app selling you ideas before you've asked for any

**NO — Benefit/nutrient callouts on Dashboard**
- Dashboard is a summary surface, not an education surface
- Health benefit chips without context (no specific meal or ingredient anchor) feel generic

### Verdict

Dashboard should gain: one household story card (WS10, user-specific, personal) and one seasonal prompt line (WS11). These are the two highest-delight low-clutter additions in the whole app.

---

## Phase 11 — Delight vs Noise Analysis

For every proposed intelligence surface:

### Delight

| Surface | Intelligence | Why Delight |
|---------|-------------|-------------|
| Dashboard | WS10 story card | Personal, remembers the user, arrives as a gift |
| Dashboard | WS11 seasonal line | Timely, specific, actionable |
| Meal Detail | WS0 nutrients + benefits | Directly relevant to the food in front of the user |
| Cookbook | 2 nutrient chips per card | Adds scannable value to browse mode without changing layout |
| Analyser | WS0 on whole food result | Extends a page already about the food; zero context switch |

### Useful

| Surface | Intelligence | Why Useful |
|---------|-------------|------------|
| Planner card | Seasonal chip | Informs a planning decision in real time |
| Planner dialog | Expand WS0 from Uplift Panel | Already wired; just needs to not be trimmed |
| Pantry inventory expand | Replace legacy with WS0 | Accuracy improvement; zero experience change |
| Shopping list | Replace legacy FoodKnowledgeModal with WS0 | Quality improvement; invisible to user |
| Diary | WS0 batch lookup for "Supports" section | Makes daily insights more accurate |

### Optional

| Surface | Intelligence | Why Optional |
|---------|-------------|-------------|
| Cookbook | Seasonal chip per card | Useful but not essential |
| Meal Detail | Discovery link | Nice contextual nudge; user can already navigate |
| Planner card | Named nutrients on hover | Richer but requires tooltip; may not be missed |

### Noise / Risk

| Surface | Intelligence | Why Noise/Risk |
|---------|-------------|---------------|
| Shopping List | Nutrient callouts | Task context; user is executing, not learning |
| Shopping Workspace | Any intelligence | Pure task execution surface |
| Shopping List | Discovery prompts | Wrong moment; disrupts flow |
| Planner card | Benefit chips (always visible) | Too many chips on already-dense card |
| Dashboard | Discovery suggestions | Unsolicited recommendations before user has context |
| Profile | Any WS0 intelligence | Setup page; education feels preachy here |
| Smart Planner | WS0 filtering of suggestions | Changes suggestion logic; high regression risk |

---

## Phase 12 — Launch Priority Matrix

### Tier 1 — Must have before launch

These surfaces either already exist and need fixing, or are the primary paths where users will encounter intelligence.

| Priority | Surface | Action | Rationale |
|----------|---------|--------|-----------|
| 1 | Meal Detail | Wire WS0 batch lookup (nutrients + benefits). Fix SimplyBetterChoicesPanel to not render empty. | Meal Detail is the deepest single-food context. Users click a meal to learn about it. Intelligence must be there. |
| 2 | Planner › Meal dialog | Ensure MealUpliftPanel WS0 enrichment path is stable (already exists; verify on launch). | Already implemented; must not regress. |
| 3 | Nutrition Report | Verify WS0 batch lookup is stable (already exists). | Already implemented; must not regress. |
| 4 | Pantry › Explore | Verify PantryKnowledgeHub WS8–11 integration is stable. | Already implemented; must not regress. |

### Tier 2 — High value after launch

These would meaningfully raise the "feels intelligent" score within the first two weeks post-launch.

| Priority | Surface | Action | Rationale |
|----------|---------|--------|-----------|
| 5 | Dashboard | Add WS10 story card + WS11 seasonal prompt. | Highest delight-per-line-of-code in the app. Personal, timely, unmissable. |
| 6 | Analyser › WholeFoodAnalysisCard | Add WS0 nutrients + benefits chips. | Targeted, zero noise, natural extension of existing component. |
| 7 | Pantry › Inventory expand | Replace legacy `/api/pantry/knowledge/:key` with WS0 `getFoodDetailView`. | Quality improvement. Makes pantry expand feel trustworthy. |
| 8 | Cookbook | Add 2 nutrient chips per meal card (client-side getMealNutrients is sufficient interim). | Turns passive browse into an intelligent one. |
| 9 | Shopping List | Replace FoodKnowledgeModal with WS0 getFoodDetailView. | Invisible quality win. |

### Tier 3 — Future evolution

These represent the platform's long-term potential but are not needed at launch or immediately after.

| Priority | Surface | Action |
|----------|---------|--------|
| 10 | Planner card | Seasonal chip per card |
| 11 | Food Diary | WS0 batch lookup for Supports section |
| 12 | Planner card | Named nutrients on hover/press |
| 13 | Smart Planner | Seasonal food weighting (requires careful restriction-safety review) |
| 14 | Cookbook | Seasonal chip per card |
| 15 | Meal Detail | Discovery link ("Curious about X?") |

---

## Phase 13 — The "THA Feels Intelligent" Test

### After 5 minutes

The user has opened the app, seen the Dashboard, and browsed the Planner.

**Where should they notice intelligence?**

1. **Dashboard** — A household story card greets them: "Your kitchen loves chickpeas — they've featured in 7 meals this month."
2. **Planner card** — Variety dots signal that Monday's dinner contributes vegetables and healthy fats.
3. **Planner dialog** — MealUpliftPanel shows "Add pumpkin seeds — great source of Magnesium" with a one-tap accept.

### After 30 minutes

The user has browsed their Cookbook, viewed a Meal Detail, checked the Pantry, and looked at the Nutrition Report.

**Where should they notice intelligence?**

4. **Cookbook** — Each meal shows 1–2 nutrient chips. "Salmon Pasta: Omega-3 · Vitamin D"
5. **Meal Detail** — Below the ingredients: "Key Nutrients: Fibre, Iron, Folate" with benefit chips "Gut Health · Energy"
6. **Pantry › Explore** — Full WS0 registry, WS8 discovery ("Similar to chickpeas: lentils, butter beans"), WS10 stories ("You've been adding more seeds recently")
7. **Nutrition Report** — "This week you covered 14 plant families. Broccoli contributed Vitamin C and Folate."

### After 6 weeks

The user is a regular. They know the app's rhythms.

**Where should they notice intelligence?**

8. **Dashboard** — Seasonal story changes: "Autumn is here — your meals haven't included root vegetables yet this season. Try a roasted beetroot salad."
9. **Planner** — "You've had salmon twice this week — swap to sardines for more variety?" (WS9 alternatives, household-aware)
10. **Pantry › Explore** — WS10 "Food Journey": "You've been building a better Mediterranean table — over the last 6 weeks, extra virgin olive oil, chickpeas, and tomatoes have become your regulars."

---

## Phase 14 — The "Spotify of Food" Test

### Which surfaces should become foundations for future platform features?

| Future Feature | Foundation Surface | Why |
|---------------|-------------------|-----|
| Food Wrapped (annual summary) | Pantry › Explore (WS10 Stories) | WS10 already generates narrative. Annual aggregation is a configuration change, not an architecture change. |
| Season Reports | Dashboard (WS11 Seasonal prompt) | The seasonal callout on Dashboard is already a seed. Seasonal Reports would expand it into a dedicated page. |
| Household Trends | Food Diary + Dashboard | Diary tracks daily behaviour. Dashboard already aggregates weekly data. Both are foundation stones. |
| Food Discovery (deep) | Pantry › Explore (WS8) | WS8 Discovery is fully operational here. Future: personal discovery feed based on eating history. |
| Relationship Graphs | Meal Detail (WS7 relationships via WS8) | Meal Detail is where users examine specific foods. A "food relationship web" visualisation would extend that. |
| Nutrient Stories | Nutrition Report (PlantDiversityReport) | Already shows nutrients per ingredient. Longer narrative ("You're consistently getting Fibre but rarely see Vitamin D") extends this. |

### Which current surfaces should NOT become foundation for "Spotify of Food"?

| Surface | Why Not |
|---------|---------|
| Shopping List | Task surface. Intelligence there is noise. |
| Shopping Workspace | Pure execution. No intelligence belongs here. |
| Profile | Configuration surface. Should not become editorial. |
| Onboarding | One-time setup. Cannot be a recurring intelligence surface. |

---

## Phase 15 — Final Question: Top 5 Surfaces Before Launch

If only five surfaces can have WS0 intelligence before launch, in order:

### 1. Meal Detail (`/meals/:id`)

**Why first:** This is the single place in the app where a user has explicitly chosen to know more about a specific meal. They are in "curious" mode. The intelligence — key nutrients, health benefits per ingredient — is directly relevant, immediately useful, and backed by WS0 with no guessing. The infrastructure already exists (`PlantDiversityReport` and `MealUpliftPanel` prove the `/api/knowledge/ingredient-lookup` path). The `SimplyBetterChoicesPanel` is visually present but always empty — fixing that and wiring WS0 here turns a ghost feature into a live one.

**Intelligence to add:** WS0 batch lookup → nutrient chips + benefit chips per meal.

### 2. Dashboard (`/dashboard`)

**Why second:** The Dashboard is the first thing most users see. It is currently a metrics page with no personality. One WS10 household story card costs very little screen space and delivers maximum delight — it tells the user "this app knows you." A WS11 seasonal line adds timely relevance. Together they transform the Dashboard from a stats panel into a food intelligence entry point.

**Intelligence to add:** WS10 story card (1) + WS11 seasonal line (1).

### 3. Planner › Meal Dialog (verify + stabilise)

**Why third:** The `MealUpliftPanel` with WS0 enrichment already works. But it must be verified as stable and not degraded before launch. The Planner is the highest-frequency interaction surface — users return to it weekly. WS0 intelligence here has the broadest reach because every planned meal is an opportunity.

**Intelligence to add:** Verify and harden existing WS0 path. Do not add new intelligence; protect what exists.

### 4. Pantry › Explore (verify + stabilise)

**Why fourth:** `PantryKnowledgeHub` is the most complete intelligence surface in the app, consuming WS0 + WS8 + WS9 + WS10 + WS11. Before launch, the priority is ensuring it is stable, not adding to it. The risk here is that because it requires a mode switch, discovery is low — but that is a navigation problem, not an intelligence problem. Fix the navigation visibility if needed; the intelligence underneath is solid.

**Intelligence to add:** None. Stabilise and ensure the mode switch is obvious to users.

### 5. Analyser › WholeFoodAnalysisCard

**Why fifth:** When a user scans a whole food (salmon, spinach, avocado), they receive a THA Apple Score of 5 and a "whole food" label. This is exactly the moment to show 2–3 WS0 benefit chips. The user is already asking "what is this?". The component is clean and bounded. The risk of noise is zero because `WholeFoodAnalysisCard` only renders for confirmed whole foods that will have WS0 matches. This is the highest-signal, lowest-noise addition in the entire audit.

**Intelligence to add:** WS0 `getFoodDetailView` → benefits chips (max 3) + nutrient chips (max 2).

---

## Definition of Done — Achieved

- [x] Every surface audited
- [x] Current WS0 usage mapped
- [x] Opportunities identified
- [x] Noise risks identified
- [x] Launch priorities ranked (Tier 1 / 2 / 3)
- [x] Top 5 surfaces selected and explained
- [x] Future evolution documented

---

## Suggestion Log

All future work identified during this audit. No implementation scope.

### SUGGESTION-01
**Surface:** Meal Detail
**Type:** WS0 wire-up
**Description:** Call `/api/knowledge/ingredient-lookup` with the meal's ingredients. Show nutrient chips (max 4) and benefit chips (max 3) in a new panel below the ingredients list. Reuse the pattern from `PlantDiversityReport` and `MealUpliftPanel`. Fix `SimplyBetterChoicesPanel` to not render when `upliftMatches=[]`.

### SUGGESTION-02
**Surface:** Dashboard
**Type:** WS10 + WS11 integration
**Description:** Add a household story card (one, from WS10 `/api/pantry/stories`) and a seasonal prompt line (WS11 `/api/pantry/seasonal`). Both should be silent when the engines return no data.

### SUGGESTION-03
**Surface:** Analyser › WholeFoodAnalysisCard
**Type:** WS0 wire-up
**Description:** When `WholeFoodAnalysisCard` renders, call WS0 `getFoodDetailView(slug)` (where slug is derived from the food name). Show benefit chips (max 3) and nutrient chips (max 2).

### SUGGESTION-04
**Surface:** Pantry › Inventory item expand
**Type:** Replace legacy knowledge
**Description:** Replace `/api/pantry/knowledge/:key` (legacy `food_knowledge` table) with WS0 `getFoodDetailView`. The UI panel already exists; only the API call changes.

### SUGGESTION-05
**Surface:** Shopping List › FoodKnowledgeModal
**Type:** Replace legacy knowledge
**Description:** Replace `/api/food-knowledge/:slug` (legacy) with WS0 `getFoodDetailView`. Zero UI change.

### SUGGESTION-06
**Surface:** Cookbook meal cards
**Type:** Nutrient chip preview
**Description:** Add 2 subtle nutrient chips below meal name using `getMealNutrients` (client-side, no new API). Show only when at least one match exists.

### SUGGESTION-07
**Surface:** Planner cards
**Type:** Seasonal chip
**Description:** When a meal's primary ingredient has a confirmed UK seasonality match (WS0 `food.seasonality` field), show a small "✦ In season" chip on the card.

### SUGGESTION-08
**Surface:** Food Diary
**Type:** WS0 batch lookup
**Description:** Upgrade the "Supports" section in `DayNutrientSummary` by running a WS0 batch lookup over the day's ingredients. Currently uses static `getMealNutrients`; WS0 would provide more accurate nutrient + benefit names.

### SUGGESTION-09
**Surface:** Pantry › Explore navigation
**Type:** UX visibility
**Description:** The Explore mode requires knowing about the mode switch. Consider a persistent "Explore nutrition" link in the Pantry header (not just a tab) so users discover it without being told.

### SUGGESTION-10
**Surface:** Dashboard / Pantry Explore
**Type:** Future platform
**Description:** Annual "Food Wrapped" report powered by WS10 story aggregation. Would require 3–6 months of household history. Design foundation is WS10 + Diary; no schema changes needed.

---

*Investigation only. No implementation. No UI changes. No schema changes.*
