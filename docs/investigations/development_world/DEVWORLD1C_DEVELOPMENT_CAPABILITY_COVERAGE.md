# DEVWORLD1C — Development Capability Coverage Discovery

**Status:** INVESTIGATION — discovery only. No importer, no seed data, no household created, no production code / schema / migration changed. The single artefact is this document.
**Classification:** Platform Governance × Development World — capability coverage design
**Workstream:** `DEVWORLD` (Development World Authoring). Predecessor: `DEVWORLD1` (the world already exists). Successor: `DEVWORLD2` (importer generalisation).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Governing / prerequisite documents read before writing:** `docs/architecture/README.md`, `docs/investigations/development_world/DEVWORLD1_DEVELOPMENT_WORLD_SCHEMA_DISCOVERY.md`, and the live production surfaces (`client/src/App.tsx`, `server/intelligence/*`) surveyed directly.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` (unchanged — nothing committed) |
| Rollback tag | `rollback/before-devworld1c-development-capability-coverage-20260710` |
| Dirty-tree snapshot | `git stash` entry `DEVWORLD1C_ROLLBACK: pre-investigation dirty-tree snapshot 2026-07-10` (`3dd5908f51f40612b968aba9c89fce3ff89b1dba`) — created with `git stash create` + `git stash store`, so the working tree was **not** touched (339 status entries, unchanged) |
| Code modified | None |
| Schema modified | None |
| Migrations added | None |

This is an investigation. Per `REPOSITORY_CONVENTIONS.md` §3 it analyses and recommends; it changes nothing. It carries no *Changes Made* section, because nothing was made.

**Rollback:** the tag and stash restore tracked/dirty state if anything is later committed by mistake; this untracked document must be removed explicitly: `rm -f docs/investigations/development_world/DEVWORLD1C_DEVELOPMENT_CAPABILITY_COVERAGE.md`.

---

## 0. PREREQUISITE NOTE — A REQUIRED READING DOES NOT EXIST

The mission instructs: *"Read docs/investigations/DEVWORLD1B_ADMIN_VIEW_AS_AND_MEAL_CATALOGUE.md."* **That file does not exist** — not in the working tree, not in any commit reachable from any branch, not in any stash (searched by filename, by content grep for `DEVWORLD1B`, and across `git log --all`). There is no `DEVWORLD1B` workstream artefact anywhere in the repository.

Rather than stop, this investigation covered its two named subjects directly from the code, because both are load-bearing for capability coverage:

- **Admin "view-as" / impersonation.** There is **no general user impersonation**. The only "view-as" mechanism is **benchmark-household impersonation**, admin-only, session-scoped: `POST /api/admin/benchmark-households/:id/impersonate`, driven from `/admin/benchmark-households` (`client/src/pages/admin-benchmark-households-page.tsx`), with `/api/benchmark-impersonation[/stop]` to enter/leave. This is the surface through which a developer *observes* a development household from the inside — it is the primary consumption path for everything below, and DEVWORLD2's importer feeds it.
- **Meal catalogue (admin).** There is **no dedicated meal-catalogue admin page**. Global-meal seeding is an admin-only action *inside the Cookbook* (`meals-page.tsx` → `POST /api/admin/import-global-meals`), and the ingredient "Picks" catalogue lives at `/admin/ingredient-products`. The per-household cookbook is not a catalogue at all — it is the projection of `meals` rows owned by the household (DEVWORLD1 §3 #10).

**This gap is flagged for the mission owner** (§10, R-DOC). The absence changes nothing structural below, but a required input to the mission was missing and the reader should know it was reconstructed, not read.

---

## 1. EXECUTIVE SUMMARY

DEVWORLD1 established the decisive fact: **the development world already exists** — ten permanent households `BW01`–`BW10` in `server/benchmark/world-fixtures.ts`, imported through production write paths. DEVWORLD1C asks a different question: *do those households, collectively, exercise the entire production platform — and if not, what is the smallest portfolio that does?*

Five findings govern the answer.

**C1 — The production platform exposes 24 distinct capability areas; the existing ten households exercise roughly 18 of them well, 3 partially, and 3 not at all.** The strong coverage is real: planner, cookbook, pantry, shopping, diary, nutrition centre, plant diversity, household reasoning, goals, the three ambient opportunity types, comparison, and honest gaps are all exercised by at least one household. The matrix in §4 is the evidence.

**C2 — Two whole characteristic axes are unexercised because no fixture sets them.** No household in `world-fixtures.ts` assigns `companionPersonality` or `subscriptionTier`. Verified by grep: both fields are absent from all ten. Consequently **five of six companion personalities** (`friend`, `coach`, `chef`, `teacher`, `sergeant` — only the default `companion` is reached) and **both paid tiers** (`premium`, `friends_family` — everyone is `free`) are never demonstrated. These are *layered* characteristics: closing them requires no new household, only assignment across the ones that exist.

**C3 — Three capabilities cannot be exercised by a seeded household at all, by architecture.** *Confirmed Understanding* (a learning signal at `status: "confirmed"`) is reachable only through an explicit human `approve` verb at runtime — a fixture can seed the ≥3 polarised evidence events that make detection fire, producing a `pending_confirmation` signal, but never the confirmation. *Grounded companion turns* exist only by running the companion live; `conversations` is forbidden to seed (DEVWORLD1 §3.1). *Opportunity deliveries* are recomputed every `report`; households supply the *preconditions*, never the delivery lifecycle. **These are coverage of the runtime, not of the fixture** — the household's job is to make them reachable, not to contain them (§5).

**C4 — The smallest complete portfolio is eight households, not ten — but the two it drops cost real diet-engine coverage, and the honest recommendation is to keep them and reassign the layered axes instead.** Eight households cover every *mutually-exclusive* axis (data maturity, composition, goal direction, the safety gate, shopping style, plant-diversity extremes). The two the minimal set folds away — a *vegetarian* household (partial category exclusion: no meat/fish, but dairy/eggs allowed) and a *non-excluding pattern* household (Mediterranean/DASH: a diet tag with no hard filter) — each exercise a distinct diet-filtering behaviour that neither vegan (total animal exclusion) nor omnivore covers. §6 recommends the ten be **retained**, with personalities and tiers distributed across them (C2) and one household converted to *mixed-diet* to exercise per-eater overrides — a higher-value coverage move than any addition.

**C5 — The real coverage gaps are in derivations and product surfaces, not in the household portfolio.** `meal_allergens` cannot represent sesame/mustard/coconut (DEVWORLD1 F4), so the allergy household's sesame trap is observable only via `household_eaters.hardRestrictions`, not via any consumer that reads `meal_allergens`. Premium gating is largely `TODO [PREMIUM]` in the routes, so a premium household exercises little today beyond tier display. Nutrition is network-derived (DEVWORLD1 F2), so every nutrition-dependent capability is non-deterministic and may gap offline. A household portfolio cannot fix any of these; it can only be the place that *proves* them (§7).

---

## 2. METHOD

Coverage was derived in three passes:

1. **Capability inventory.** Every user-facing surface (`client/src/App.tsx` router → page → API/hooks → gating) and every intelligence capability (`server/intelligence/capability-registry.ts` → bindings → preconditions) was enumerated from source. The full route and engine surveys are the evidence base for §3.
2. **Precondition extraction.** For each capability, the exact household state that makes it emit output rather than an honest gap was extracted from the code — thresholds, required rows, required characteristics. The Decision Engine's per-opportunity preconditions (`opportunity-engine.ts`) and the Behaviour Engine's detection thresholds (`evidence-learning/framework.ts`) are the sharpest and are quoted in §4.
3. **Covering-set reduction.** Capabilities were sorted into *mutually-exclusive* axes (a household is cold-start **or** mature; vegan **or** omnivore) and *layerable* axes (tier, personality, a single empty planner day). The minimal portfolio is one point per exclusive combination, with layerable axes distributed across them.

---

## 3. THE CAPABILITY INVENTORY — WHAT MUST BE COVERED

Twenty-four capability areas, grouped. Each is something a development household should make observable. `Owner` is the surface or engine that produces it.

### 3.1 Business-domain surfaces (the product)

| # | Capability | Owner (surface) | What user behaviour exercises it |
|---|---|---|---|
| 1 | **Dashboard / Home Intelligence** | `dashboard.tsx` + `GET /api/home/intelligence` | Opening the app; celebration / seasonal / opportunity / household-insight cards render only when their data exists |
| 2 | **Planner** | `weekly-planner-page.tsx`, `planner:read/explain/add` | Planning meals into week slots; moving, locking, generating from templates |
| 3 | **Planner explanations** | `PlannerIntelligenceStrip`, `planner:explain` | Asking "why this plan"; per-week intelligence over a populated week |
| 4 | **Cookbook / Meals** | `meals-page.tsx`, `meals:read/search` | Browsing, searching, creating meals |
| 5 | **Recipe imports** | Cookbook import (URL / text / photo scan), `api.import.*` | Importing a recipe from a link, pasted text, or a photo |
| 6 | **Meal detail / adaptations / swaps** | `meal-detail-page.tsx`, `SimplyBetterChoicesPanel`, `HouseholdAdaptationsSummary` | Opening a meal; seeing household adaptations and "simply better choices" |
| 7 | **Pantry** | `pantry-page.tsx`, `pantry:read/explain` | Adding/consuming pantry items; restock → shopping |
| 8 | **Shopping (workspace + basket)** | `shopping-workspace-page.tsx`, `shopping-list-page.tsx`, `shopping:read/explain/add` | Building a list from the plan; price tiers, SMP resolution, supermarket choice, freezer deduction, provenance (`ingredient_sources`) |
| 9 | **Shopping attention** | `ShoppingIntelligencePanel` | An at-risk / conflicting shopping item surfacing (see #20 critical opportunity) |
| 10 | **Nutrition Centre** | `plant-diversity-page.tsx` Nutrients tab, `HouseholdNutritionCentre` | Reviewing household nutrients over the current week |
| 11 | **Plant Diversity / Food Report** | Foods tab, `FoodReport`, `plant-classifier.ts` | The weekly plant-diversity count and category completion |
| 12 | **Food Intelligence** | `food-detail-page.tsx`, `food-intelligence:recommend/explain/report/compare` | Opening a food page; connected foods; comparing two foods |
| 13 | **Analyser / Products** | `products-page.tsx` | Scanning a barcode / searching a product; product history, health trends |
| 14 | **Streaks & savings** | `products-page.tsx`, `food-diary-page.tsx`, `savings:aggregates` | Recording scans over days (streak), realised savings |
| 15 | **Diary** | `food-diary-page.tsx`, `diary:read/explain` | Logging cooked meals and daily metrics; multi-day trends |
| 16 | **Goals** | `user_preferences.healthGoals/goalType/calorieTarget` | Setting a health goal; a numeric target enabling progress |
| 17 | **Household reasoning** | eaters, per-eater overrides, restrictions | Multiple eaters, child meals, per-week diet overrides, hard restrictions |
| 18 | **Companion** | `FloatingAssistant`, conversation gateway, 6 personalities | Chatting; personality-flavoured turns; action proposals; feedback |
| 19 | **Partners / Supermarkets / Seasonal** | `partners-page.tsx`, `supermarkets-page.tsx`, `SeasonalCard` | Browsing partners; choosing supermarkets; seasonal highlights |

### 3.2 Intelligence engines (the platform)

| # | Capability | Owner (engine) | Precondition to emit |
|---|---|---|---|
| 20 | **Decision Engine / Opportunities** | `opportunity-delivery/framework.ts`, `opportunity-engine.ts` | One of exactly three ambient types fires — see §4.2 |
| 21 | **Behaviour / Evidence Learning** | `evidence-learning/framework.ts` | ≥3 polarised same-dimension events, ≥0.7 consistency, ≤90 days → a `pending_confirmation` signal |
| 22 | **Context Composition** | `context/context-view.ts` | Seven native views (`profile`, `food-intelligence:report`, `meals:read/search`, `planner:read`, `shopping:read`, `household:read`) + derived; pinned fields prove "recorded none" vs "absent" |
| 23 | **Observation Engine** | `observation/observation-engine.ts` | Operator telemetry only — a side effect of every routed turn; never seeded, never read back |
| 24 | **Notice Engine** | `conversation/notice-engine.ts` | Seven categories: nutrition-trend, streak-milestone (%7), diversity-milestone (%10), planner-gap, pantry-opportunity, shopping-opportunity, seasonal-highlight |

---

## 4. DEVELOPMENT CAPABILITY COVERAGE MATRIX

The core deliverable. For each capability: the **realistic behaviour** that exercises it, the **data that must exist**, the **household characteristic** that makes it observable, and **who needs it** — *Every* household (baseline coverage), or *Selected* households (a characteristic only some carry). The final column maps to the recommended portfolio in §6 (`H1`–`H8`) and, in brackets, the nearest existing fixture (`BW0x`).

| # | Capability | Realistic behaviour | Data that must exist | Characteristic that makes it observable | Who needs it | Exercised by |
|---|---|---|---|---|---|---|
| 1 | Dashboard / Home Intelligence | Open the app | Meals + a plan + diary rows | Any mature household | Every mature | all mature |
| 2 | Planner | Plan meals into slots | ≥1 planner week with entries | Any household that plans | Every mature | all mature |
| 3 | Planner explanations | "Why this plan?" | A populated week + diet types | A household with diet constraints to explain | Selected | H3, H4 (BW03/04/08) |
| 4 | Cookbook / Meals | Browse & create meals | ≥1 owned `meals` row | Any household with a cookbook | Every mature | all mature |
| 5 | Recipe imports | Import URL / text / photo | — (behaviour, not seed data) | Persona: "imports recipes from blogs" | Selected (persona narrative) | H1, H2 |
| 6 | Meal detail / adaptations / swaps | Open a meal; see better choices | Meals + household restrictions/diet | Restrictions or diet that force an adaptation | Selected | H4, H3 (BW08/03) |
| 7 | Pantry | Add/consume; restock | ≥1 `user_pantry_items` row | A household that keeps a pantry | Every mature | all mature |
| 8 | Shopping (workspace + basket) | List from plan; price; pick store | Planner meals → derived list + `ingredient_sources`; freezer for deduction | In-app shopper; freezer for the deduction path | Selected | H1, H2 (BW01/02); **absent by choice** H3 |
| 9 | Shopping attention (critical) | A conflicting item surfaces | Unchecked list item matching an active hard restriction | Hard restriction + in-app list | **Selected — one household** | H4 (BW08) |
| 10 | Nutrition Centre | Review weekly nutrients | Current-week meals with derived `nutrition` | Any mature household (network-dependent, F2) | Every mature | all mature* |
| 11 | Plant Diversity / Food Report | See the diversity count | Meals whose ingredients resolve to canonical foods | Diet drives the count: high (vegan) vs narrow (elderly) | Selected — both extremes | H3 high, H7 low (BW04/09) |
| 12 | Food Intelligence recommend/compare | Open a food; compare two | Resolvable benefit/nutrient slug; ≥2 resolvable foods | Works anonymously; household context needs a resolved household | Every mature | all mature |
| 13 | Analyser / Products | Scan / search a product | `product_history`, `health_trends` rows | Persona: an active product scanner | Selected | H5 (BW06) |
| 14 | Streaks & savings | Scan over consecutive days | `user_streaks` at an elite streak; `savings_events` | Streak that is a multiple of 7 (notice); dense activity | Selected | H5 (BW06) |
| 15 | Diary | Log meals + daily metrics | `food_diary_entries` + `food_diary_metrics` over days | Dense multi-day diary; weight trend | Selected — dense in ≥2 | H5, H6 (BW06/07) |
| 16 | Goals | Set a goal + numeric target | `healthGoals`, `goalType`, `calorieTarget` | A goal *with a numeric target* (progress) vs none (gap) | Selected — both cases | H5/H6 numeric; H1 none |
| 17 | Household reasoning | Multi-eater, child meals, overrides | ≥2 eaters, child eaters, `weekEaterOverrides`, `hardRestrictions` | Family with children; **mixed-diet** household for per-eater overrides | Selected | H1 (mixed), H2, H4 |
| 18 | Companion — personalities | Chat; personality-flavoured turn | `user_preferences.companionPersonality` set | The personality assigned | **Selected — all 6 distributed** | **GAP today — none set (C2)** |
| 19 | Partners / Supermarkets / Seasonal | Browse partners; seasonal card | `preferredStores`; canonical foods in season | Any household; seasonal is date-driven | Every | all |
| 20 | Decision Engine — `planner-empty-day` | Leave a day unplanned | Latest planner week with ≥1 empty day | A household whose newest week has a gap | **Selected — one household** | H1 (BW01) |
| 20 | Decision Engine — `pantry-item-unused-in-plan` | Pantry item never planned | Pantry item resolving to a canonical slug not in any plan | Pantry breadth > plan breadth | **Selected — one household** | H7 (BW09) |
| 20 | Decision Engine — `shopping-restriction-conflict` (critical) | Conflicting item on the list | Unchecked list item matching an active hard restriction | Hard restriction + in-app list (= #9) | **Selected — one household** | H4 (BW08) |
| 21 | Behaviour / Evidence Learning (detected signal) | ≥3 like-signed outcomes | ≥3 polarised same-dimension `household_evidence_events`, ≤90 days, ≥0.7 consistency | A household with a *dense, consistent* evidence history | **Selected — one household** | H6 (BW07) |
| 21b | **Confirmed** Understanding | Operator approves the signal | — | **Runtime-only — un-seedable (C3)** | none | **GAP — see §5** |
| 22 | Context Composition — 7 native views | Any grounded turn | The view's owning store populated; pinned empties present | Households that populate profile/planner/shopping/household/meals | Every mature | all mature |
| 23 | Observation Engine | Any routed turn | — (telemetry is output) | **Not seeded** — produced by running turns | Runtime | §5 |
| 24 | Notice — nutrition-trend | Trend emerges | Multi-day nutrition history with a growth signal | Dense diary + goal direction | Selected | H5 up, H6 down |
| 24 | Notice — streak-milestone (%7) | Streak hits 7/14/21… | `user_streaks` elite streak ≡ 0 (mod 7) | The scanner household at the right count | Selected | H5 (BW06) |
| 24 | Notice — diversity-milestone (%10) | Diversity hits 10/20/30… | Plant-diversity count ≡ 0 (mod 10) | High-diversity household at the right count | Selected | H3 (BW04) |
| 24 | Notice — planner/pantry/shopping | An opportunity cites evidence | The matching §20 opportunity | Same as #20 | Selected | H1/H7/H4 |
| 24 | Notice — seasonal-highlight | A seasonal headline | A non-null seasonal headline for the date | Any household | Every | all |

\* Nutrition (#10) is network-derived (DEVWORLD1 F2); "all mature" holds only when the OpenFoodFacts derivation succeeds. Offline it degrades to an honest gap.

### 4.1 The Behaviour Engine thresholds, exactly (capability #21)

For a household to make a *detected* learning signal observable, the authored evidence must clear all three gates in `evidence-learning/framework.ts`:

- `MIN_EVIDENCE_COUNT = 3` — at least three **polarised** (positive/negative) events in one dimension `(domain, subjectType, subjectKey)`. Neutral events never count toward direction.
- `MIN_CONSISTENCY = 0.7` — the majority direction must be ≥70% of the polarised events.
- `EVIDENCE_WINDOW_DAYS = 90` — only events backdated within the trailing 90 days are read.

Detection re-runs on every new event but **only over that event's own dimension**, so the three (or more) events must share a `subjectKey`. This is why *one* household (`H6`) must be deliberately built with a dense, consistent, same-dimension evidence history — a scatter of one-off events across many dimensions produces **no** signal, and would silently under-cover the entire Behaviour Engine.

### 4.2 The Decision Engine's three ambient opportunity types, exactly (capability #20)

The producer registry has exactly one producer (`food-intelligence` via `report`) emitting exactly three ambient types (`opportunity-engine.ts`). Coverage of the Decision Engine therefore means *all three must fire somewhere in the portfolio*:

1. **`planner-empty-day`** — the household's most-recent planner week has ≥1 day with zero entries. `high` attention if ≥50% of the week's days are empty, else `medium`.
2. **`pantry-item-unused-in-plan`** — a non-deleted pantry item whose canonical slug is not among the slugs ever planned. `low` attention.
3. **`shopping-restriction-conflict`** — an unchecked shopping-list item whose product name matches an active household hard restriction. **`critical`** — the sole critical type, exempt from muting and from the delivery budget.

The design consequence: these are best placed in **different** households so all three fire in one reset, and so the critical type (which needs a hard restriction *and* an in-app list *and* a conflicting item) is concentrated in the safety household where that combination is coherent.

---

## 5. WHAT A HOUSEHOLD CANNOT COVER — THE RUNTIME BOUNDARY

Three capabilities are structurally un-seedable. A portfolio's obligation to them is to make them **reachable**, then a runtime step demonstrates them. Confusing "the household contains it" with "the household enables it" would drive a fixture author to forge exactly the intelligence DEVWORLD1 §3.1 forbids.

| Capability | Why un-seedable | What the household must instead provide | How it is then demonstrated |
|---|---|---|---|
| **Confirmed Understanding** (`household_learning_signals.status = "confirmed"`) | `confirmed` is reachable only by an explicit human `approve` verb; re-detection never confirms (DEVWORLD1 §3.1). Seeding it forges a preference THA never approved. | ≥3 polarised same-dimension evidence events (H6) → detection yields a `pending_confirmation` signal | An operator approves the signal via the evidence-learning capability at runtime |
| **Grounded companion turns / conversation history** | `conversations`/`_threads`/`_turns` are forbidden to seed; a pre-seeded thread contaminates every downstream turn (DEVWORLD1 R7) | Grounding data — meals, plan, pantry, restrictions, goals — an utterance can route to | A developer chats through `FloatingAssistant` while impersonating the household |
| **Opportunity deliveries / delivery lifecycle** | `opportunity_deliveries` is the Decision Engine's own output, recomputed every `report` | The *precondition* for one of the three ambient types (§4.2) | Viewing the household surfaces the opportunity; acting on it drives the lifecycle |

The Observation Engine (#23) is the same shape at a lower level: it is *output telemetry*, a side effect of running turns, never an input. The portfolio makes it non-empty by being *used*, not by being *seeded*.

---

## 6. RECOMMENDED HOUSEHOLD PORTFOLIO

The smallest set that covers every **mutually-exclusive** axis is **eight households** (`H1`–`H8`). Each is defined by *purpose*, *key characteristics*, and *primary capabilities exercised* only — per the mission, no household is created and no field values are authored here.

### 6.1 The eight

**H1 — Standard Mixed-Diet Family (anchor, mature)**
- *Purpose:* the baseline household and the per-eater-reasoning household in one.
- *Key characteristics:* two adults + two children; **mixed diet** (one adult vegetarian, the rest omnivore) exercised through `weekEaterOverrides`; `maintain` goal with **no numeric target** (the honest-gap-on-progress case); in-app shopping; **one empty planner day** in the latest week.
- *Primary capabilities:* Dashboard, Planner, Cookbook, Pantry, Shopping (derived list + provenance), Diary, Household reasoning (multi-eater **and** per-eater overrides), Recipe imports (persona), Context Composition (all seven views), **Decision Engine `planner-empty-day`**, goals-without-target gap.

**H2 — Busy Batch-Cooking Family (mature)**
- *Purpose:* the freezer / scale / short-time-budget household.
- *Key characteristics:* two shift-working adults + three children; short `maxTotalCookTime`; heavy freezer use; `plannerEnableChildMeals`.
- *Primary capabilities:* Freezer → shopping deduction, provenance under scale, large-household planner, child meals, time-constrained meal selection.

**H3 — Vegan High-Diversity Couple (mature)**
- *Purpose:* the total-category-exclusion + high-plant-diversity + no-in-app-shopping household.
- *Key characteristics:* two strict-vegan adults; high plant diversity tuned to a **multiple of 10**; **no in-app shopping list** (market shopper — shopping is an honest gap by choice); `plant_diversity` health goal.
- *Primary capabilities:* Diet filtering (whole animal-category exclusion), Plant Diversity (high extreme), **Notice `diversity-milestone`**, Planner explanations, Food Intelligence recommend, Seasonal, empty-shopping honest gap.

**H4 — Allergy-Safety Family (mature)**
- *Purpose:* the hard-restriction safety gate and the critical-opportunity household.
- *Key characteristics:* two adults + one child with a **HARD tree-nut + sesame allergy**; in-app shopping list carrying **one unchecked conflicting item**.
- *Primary capabilities:* **Decision Engine `shopping-restriction-conflict` (critical)** = Shopping attention (#9), safety gate G2, household-suitability comparison dimension, Food-Intelligence T0 exclusion, restriction-vocabulary mapping. **Note (C5):** the sesame trap is observable via `hardRestrictions` only — `meal_allergens` cannot spell sesame (DEVWORLD1 F4).

**H5 — Muscle-Building Solo Scanner (mature)**
- *Purpose:* the gain-goal, dense-analyser, upward-trend, streak household.
- *Key characteristics:* solo adult; `build` goal (**not** `gain` — DEVWORLD1 F3) with a numeric `calorieTarget`; high activity; dense diary; active product scanning with an **elite streak that is a multiple of 7**; a `premium` tier.
- *Primary capabilities:* Analyser / product history / health trends, Streaks + savings, **Notice `streak-milestone`**, **Notice `nutrition-trend` (upward)**, Goals with numeric target, premium tier display.

**H6 — Weight-Loss Solo Learner (mature)**
- *Purpose:* the lose-goal, downward-trend, and Behaviour-Engine household.
- *Key characteristics:* solo adult; `lose` goal with a genuine **downward weight trend**; a **dense, consistent, same-dimension evidence history** (≥3 polarised events, ≥0.7 consistency, ≤90 days) that makes detection fire; a `friends_family` tier.
- *Primary capabilities:* **Behaviour / Evidence Learning (detected signal)**, **Notice `nutrition-trend` (downward)**, Swaps as accepted/rejected evidence, Diary trends, opposite goal direction to H5.

**H7 — Elderly Traditional Couple (mature)**
- *Purpose:* the low-diversity contrast and the pantry-opportunity household.
- *Key characteristics:* retired couple, small appetites, traditional narrow cookbook (**low** plant diversity — the contrast to H3); fibre / low-salt `health` goal; a pantry item that is **never planned**.
- *Primary capabilities:* Plant Diversity (low extreme), **Decision Engine `pantry-item-unused-in-plan`**, nutrition guidance emphasis, narrow-cookbook planner.

**H8 — Cold-Start New User (empty)**
- *Purpose:* the honest-gap and onboarding household.
- *Key characteristics:* brand-new account, `onboardingCompleted: false`, **every collection empty**; `free` tier.
- *Primary capabilities:* Honest gaps across every surface, onboarding guidance, empty states, "no plan next week" gaps, Companion `no-route` / `no-results` / `no-knowledge` turn classifications.

### 6.2 Layered characteristics distributed across the eight

Two axes attach to households that already exist, closing the C2 gaps without adding any household:

- **Companion personality (all six).** `H1` companion (default) · `H2` sergeant · `H3` chef · `H4` teacher · `H5` coach · `H6` friend. (`H7`, `H8` reuse companion.) Today **none** is set — all six are a pure gap.
- **Subscription tier (all three).** `free` on `H1`/`H7`/`H8`, `premium` on `H5` (and `H2` if premium surfaces warrant), `friends_family` on `H6`. Today **all** are `free`.

### 6.3 Why ten, not eight — the honest caveat

The eight cover every exclusive axis. They **under-cover two diet-filtering behaviours**:

- **Partial category exclusion** — a *vegetarian* household excludes meat and fish but keeps dairy and eggs. This is a different filter path from H3's total animal exclusion and from H1's per-eater vegetarian override (which mixes it against omnivores in one household).
- **Non-excluding diet pattern** — a *Mediterranean* / DASH household carries a diet *tag* with **no** hard filter, exercising pattern-based scoring rather than exclusion.

The existing fixtures already carry both (`BW03` vegetarian, `BW05` Mediterranean). **Recommendation: retain the ten**, treating H1–H8 as the coverage spine and `BW03`/`BW05` as the two diet-completeness households — cheaper and more honest than folding them into H1's overrides and losing the distinct filter paths. The material change requested of the existing ten is therefore **not additions or deletions** but: (a) distribute personalities and tiers (§6.2); (b) make the standard family **mixed-diet** to exercise per-eater overrides; (c) ensure each of the three ambient opportunity types has exactly one clean host; (d) build one household (`H6`/`BW07`) with a *consistent same-dimension* evidence history rather than scattered events.

---

## 7. CAPABILITY-TO-HOUSEHOLD MAPPING (CONDENSED)

| Capability area | Primary host(s) | Baseline (every mature) |
|---|---|---|
| Dashboard, Planner, Cookbook, Pantry, Diary, Nutrition Centre, Context Composition | — | ✅ all mature |
| Recipe imports (persona) | H1, H2 | |
| Shopping (derived list + provenance + freezer) | H1, H2 | |
| Shopping attention / restriction-conflict (critical) | **H4** | |
| Planner explanations | H3, H4 | |
| Meal adaptations / swaps | H4, H3, H6 | |
| Plant diversity — high / low | H3 / H7 | |
| Food Intelligence recommend/compare | — | ✅ all mature |
| Analyser / streaks / savings | H5 | |
| Diary trends | H5, H6 | |
| Goals — numeric target / none | H5, H6 / H1 | |
| Household reasoning — children / per-eater overrides | H2, H4 / **H1 mixed** | |
| Decision Engine — empty-day / pantry-unused / restriction-conflict | H1 / H7 / H4 | |
| Behaviour / Evidence Learning (detected) | **H6** | |
| Confirmed Understanding | *none — runtime (§5)* | |
| Companion personalities (6) | H1·H2·H3·H4·H5·H6 | |
| Subscription tiers (3) | H1/H7/H8 · H5 · H6 | |
| Notices — trend / streak / diversity | H5·H6 / H5 / H3 | |
| Seasonal / Partners / Supermarkets | — | ✅ all |
| Diet filtering — total / partial / pattern | H3 / BW03 / BW05 | |
| Honest gaps / onboarding | **H8** | |

---

## 8. IDENTIFIED COVERAGE GAPS

| ID | Gap | Class | Closed by | Evidence |
|---|---|---|---|---|
| **G-PERS** | 5 of 6 companion personalities never exercised (only default `companion` reached). | Portfolio — layered axis unset | Assign `companionPersonality` across H1–H6 (§6.2). No new household. | grep: `companionPersonality` absent from all fixtures |
| **G-TIER** | Both paid tiers never exercised — all households are `free`. | Portfolio — layered axis unset | Assign `subscriptionTier` (§6.2). **But** see G-PREM. | grep: `subscriptionTier` absent from all fixtures |
| **G-OVERRIDE** | Per-eater / per-week diet overrides thinly exercised — single-diet households don't reach `weekEaterOverrides`. | Portfolio — design | Make H1 a **mixed-diet** household (§6.1). | §4 #17 |
| **G-EVIDENCE** | A learning signal fires only from ≥3 *same-dimension* consistent events; scattered evidence covers nothing. | Portfolio — design | Build H6 with a deliberate consistent history (§4.1). | `framework.ts` thresholds |
| **G-CONFIRM** | *Confirmed* Understanding is un-seedable; no household can demonstrate it. | Runtime boundary | An operator `approve` step, not a household (§5). | DEVWORLD1 §3.1 |
| **G-COMPANION** | Grounded turns / conversation history are un-seedable. | Runtime boundary | Drive the companion live while impersonating (§5). | DEVWORLD1 R7 |
| **G-ALLERGEN** | `meal_allergens` cannot represent sesame/mustard/coconut; the sesame trap is observable via `hardRestrictions` only. | Derivation defect (not the portfolio) | Out of scope — owned by `meal-analysis.ts` (DEVWORLD1 R4). Name it; H4 is the household that would prove it. | DEVWORLD1 F4 |
| **G-PREM** | Premium gating is largely `TODO [PREMIUM]` in routes; a premium household exercises little today beyond tier display. | Product surface (not the portfolio) | Aspirational until the premium TODOs land. Assign the tier now; coverage grows as the code does. | route survey (`routes.ts` TODO markers) |
| **G-NUTRITION** | Nutrition is network-derived; every nutrition-dependent capability is non-deterministic and may gap offline. | Derivation (not the portfolio) | Narrow the determinism contract (DEVWORLD1 R2). | DEVWORLD1 F2 |
| **R-DOC** | The mission's required reading `DEVWORLD1B_ADMIN_VIEW_AS_AND_MEAL_CATALOGUE.md` does not exist. | Process | Reconstructed from code (§0); flagged to the mission owner. | filename/content/`git log --all` search |

The load-bearing observation: **only the first four gaps are the portfolio's to close, and none of them needs a new household** — they are unset fields and one design choice. Everything below G-CONFIRM is a runtime boundary or a defect the household can only *prove*, never *fix*.

---

## 9. ARCHITECTURE COMPLIANCE

- **No new store, no schema, no benchmark-specific behaviour.** This document recommends *characteristics*, not tables. It introduces no capability, intent, prompt, or context view.
- **Uses existing production architecture.** Every capability in §3 is an existing surface or engine; every characteristic in §6 maps to a field DEVWORLD1 §6 already classified as authored (`A`/`S`).
- **No duplicated production ownership.** The portfolio owns *statements of intent* (household characteristics); the services own the facts; the derivations own the inferences (DEVWORLD1 §4). The recommendation to distribute personalities/tiers sets existing authored fields — it creates no second owner.
- **No fabricated knowledge.** The three un-seedable capabilities (§5) are explicitly *not* to be seeded; the portfolio makes them reachable, and forbidden derived outputs (`learning_signals` confirmed, `conversations`, `opportunity_deliveries`) remain forbidden.
- **Optimised for long-term development and demonstration, not benchmarking.** The portfolio is the *superset* a development library needs; benchmark scoring is a separate consumer of the same world and introduces no behaviour here (per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`).

**Compliance verdict: PASS** (discovery only; no code, schema, or data changed).

---

## 10. RECOMMENDATIONS FOR DEVWORLD2

Ordered so each is verifiable before the next.

| # | Recommendation | Rationale | Gap closed |
|---|---|---|---|
| 1 | **Do not add households — retain ten, reassign layered axes.** Adopt H1–H8 as the coverage spine, keep `BW03`/`BW05` as the diet-completeness pair (§6.3). | The exclusive axes are already covered; the real gaps are unset fields. | — |
| 2 | **Assign `companionPersonality` across H1–H6** so all six are reached; **assign `subscriptionTier`** so all three are reached. | Two whole axes are dark today (verified by grep). | G-PERS, G-TIER |
| 3 | **Convert the standard family (H1/BW01) to mixed-diet** with a per-week eater override. | Per-eater reasoning is otherwise thinly exercised. | G-OVERRIDE |
| 4 | **Concentrate each ambient opportunity type in exactly one host** — empty-day in H1, pantry-unused in H7, restriction-conflict in H4 — so all three fire in one reset without collision. | Decision-Engine coverage requires all three; scattering them risks none firing cleanly. | §4.2 |
| 5 | **Build H6's evidence as a single consistent dimension** (≥3 polarised, ≥0.7, ≤90 days), not a scatter. | A learning signal will not detect otherwise. | G-EVIDENCE |
| 6 | **Document the runtime-only trio** (§5) in the DEVWORLD2 authoring guide: confirmed understanding, companion turns, opportunity lifecycle are *demonstrated live*, never seeded. | Prevents a fixture author forging derived intelligence. | G-CONFIRM, G-COMPANION |
| 7 | **Record — do not fix here — the three product/derivation gaps** (G-ALLERGEN, G-PREM, G-NUTRITION) with the household that would prove each. | They are owned by other components; mixing causes into a fixture workstream is the anti-pattern DEVWORLD1 R4/R2 warned against. | naming only |
| 8 | **Escalate R-DOC** to the mission owner: the required `DEVWORLD1B` document does not exist. | A required input to this mission was missing. | R-DOC |

---

## 11. DATA IMPACT

| Question | Answer |
|---|---|
| Production data affected? | **No.** Nothing was executed. |
| Household created? | **No** — the mission forbids it; none was. |
| Schema changed? | No. |
| Migration added? | No. |
| Rows written? | Zero. Read-only greps and reads only. |
| New store proposed? | No. A portfolio of *characteristics* over the existing world. |

---

## 12. DEFINITION OF DONE — CHECK

| Requirement (from the mission) | Where |
|---|---|
| Read the three prerequisite documents | §0 (README ✓, DEVWORLD1 ✓, DEVWORLD1B **does not exist** — reconstructed) |
| Rollback protection created | Top of document |
| Development Capability Coverage Matrix | §4 (+ §3 inventory, §4.1/§4.2 thresholds) |
| Recommended household portfolio | §6 (eight core + the ten-retention caveat) |
| Capability-to-household mapping | §7 |
| Identified coverage gaps | §8 |
| Recommendations for DEVWORLD2 | §10 |
| Discovery only — no implementation, no households | §11 |

---

*DEVWORLD1C is discovery. It creates no household, authors no fixture, and modifies no production code, schema, or migration.*

*Its most consequential finding is that the ten-household world already covers most of the platform, and that its true coverage gaps are neither missing households nor missing tables but two unset fields — `companionPersonality` and `subscriptionTier`, dark across every fixture — one design choice (a mixed-diet family for per-eater reasoning), and three capabilities that no fixture may ever contain because they are properties of the running system, not of the seed.*

*Rollback: `git checkout rollback/before-devworld1c-development-capability-coverage-20260710 -- .`; dirty-tree snapshot `git stash apply 3dd5908`. This document is untracked — delete it explicitly.*
