# DEVWORLD1 — Development World Schema Discovery

**Status:** INVESTIGATION — discovery only. No importer. No seed data. No production code, schema, or migration changed. The single artefact is this document.
**Classification:** Platform Governance × Benchmark Platform — development-world representation
**Workstream:** `DEVWORLD` (Development World Authoring). Successor context: `INTQ6` (the world that exists), `BENCHINT2` (its convergence onto production write paths), `BENCHINT4` (its measurement integrity).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Governing documents read before writing:** `docs/architecture/README.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, `ARCHITECTURE_PRINCIPLES.md`, `docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` (unchanged — nothing committed) |
| Rollback tag | `rollback/before-devworld1-development-world-schema-discovery-20260710` |
| Dirty-tree snapshot | `git stash` entry `DEVWORLD1_ROLLBACK: pre-investigation dirty-tree snapshot 2026-07-10` (`59198ba44490052933e1ca06df709e45e9f5e262`) |
| Index state | Captured and restored byte-exact from `stash@{0}^2` after snapshot (338 status entries, unchanged) |
| Code modified | None |
| Schema modified | None |
| Migrations added | None |

This is an investigation. Per `REPOSITORY_CONVENTIONS.md` §3 it analyses and recommends; it changes nothing. It carries no *Changes Made* section, because nothing was made.

**Rollback:** `git checkout rollback/before-devworld1-development-world-schema-discovery-20260710 -- .`; then `rm -f docs/investigations/development_world/DEVWORLD1_DEVELOPMENT_WORLD_SCHEMA_DISCOVERY.md` (untracked; neither the tag nor the stash removes it).

---

## 1. EXECUTIVE SUMMARY — THE DECISIVE FINDING

**The development world already exists.** It was built by workstream `INTQ6` on 2026-07-05 and it is not a prototype: ten permanent households (`BW01`–`BW10`), authored as declarative fixtures in `server/benchmark/world-fixtures.ts`, imported into the DEV database by `server/benchmark/world-seeder.ts` **exclusively through production write paths**, DEV-guarded with no override, and reset deterministically on demand from an admin surface.

DEVWORLD1's mission — *"discover how complete fictitious development households should be represented"* — therefore does not begin at a blank page. It begins at a working system, and its honest output is **not a new design but a delta**: what the existing fixture shape already gets right, what it silently gets wrong, and what the mission's entity list asks for that the platform has nowhere to put.

Six findings govern everything below.

**F1 — The importer exists and is already compliant with the constraint it appears to violate.** `world-seeder.ts` seeds accounts via `storage.createUser`, households via `storage.createHouseholdForUser`, the second adult via the *real invite/accept path* `storage.joinHousehold`, preferences via `storage.upsertUserPreferences`, meals via `storage.createMeal` **followed by production's own `autoAnalyzeMeal` derivation**, and evidence via the canonical EL1 orchestrator `recordOutcomeAndDetect` (`world-seeder.ts:9-38`, `:289-480`). It contains **no scoring, no questions, no routing, and no second schema**. It is a generic household fixture importer that happens to live in a directory called `benchmark/` and to prefix its symbols `BENCHMARK_`. **The constraint "do not create benchmark-specific data pathways" is satisfied in substance and violated only in name and location.** DEVWORLD2's first act is a rename and a relocation, not a rebuild.

**F2 — Determinism is claimed but not achieved.** `BENCHMARK_HOUSEHOLD_WORLD.md` §3 and `world-fixtures.ts:19-30` both assert "same fixture in, same rows out, every reset." That is false for one table. `autoAnalyzeMeal` derives a meal's `nutrition` row by issuing one live HTTP request **per ingredient** to `world.openfoodfacts.net` (`meal-analysis.ts:285-288`) and averaging the first three products returned. Third-party data drifts; the network fails; the numbers change. A reset run offline produces meals with **no nutrition at all** — honestly gapped, never fabricated, which is correct behaviour, but it is not determinism. The determinism contract must be narrowed to what is actually true, or nutrition derivation must be pinned.

**F3 — "Import through production services" does not buy validation.** THA's vocabulary enums live in the **route** layer (Zod), not the storage layer. `storage.addPlannerEntry(dayId, mealType: string, …)` (`storage.ts:1219`) and `storage.upsertUserPreferences(userId, prefs)` (`storage.ts:876`) validate nothing. The seeder calls storage directly and skips the routes, so the live world already contains two values production can never produce:
- `BW06` authors `goalType: "gain"` (`world-fixtures.ts:797`); the route enum is `["lose","maintain","build","health"]` (`routes.ts:588`). There is no `gain`.
- `BW06` authors a planner `mealType: "snack"` (`world-fixtures.ts:851`); every production planner route writes `"snacks"` (`routes.ts:6108`, `:6235`).

Neither is caught by anything. **The YAML validator, not the service layer, must own vocabulary conformance** — because the service layer demonstrably does not.

**F4 — The meal-allergen derivation cannot express the allergen the safety household is built around.** `BW08` is *"HARD tree-nut and sesame allergy"* (`world-fixtures.ts:1061`, `:1069`), and the world authors `tahini` as a pantry item and preferred ingredient (`:577`, `:597`). But `autoAnalyzeMeal`'s `COMMON_ALLERGENS_LIST` (`meal-analysis.ts:353-363`) contains exactly nine names — `milk, eggs, fish, shellfish, nuts, peanuts, soy, wheat, gluten` — and **no sesame, no mustard, no coconut**. A seeded meal containing tahini receives no sesame allergen row. The `restriction-library.ts` canon has ten restriction ids including `sesame`; `meal_allergens` cannot represent three of them. Household safety gating reads `household_eaters.hardRestrictions`, so the G2 gate is not currently breached by this — but any consumer that reads `meal_allergens` gets a **false negative on a major allergen**, and the world is the place that would prove it.

**F5 — Three entities on the mission's list do not exist, and must not be made to.** *Planner history*, *skipped meal events*, and *favourites* have no table, no column, and no service. Planner state is a **six-slot rolling canvas** keyed `(user_id, week_number)` with no `created_at`, no archive, no soft delete (`schema.ts:428-462`). Cooked is recorded — as a `food_diary_entries` row carrying `source_planner_entry_id`. **Skipped is recorded nowhere**: an uncooked planned meal simply never produces a diary entry. Favourites has no table at all; a household's cookbook *is* the set of `meals` rows with its owner's `user_id`. Authoring any of the three requires new schema, which "use existing production architecture" forbids. They belong in the fixture's **persona narrative**, deliberately unwritten — which is precisely the doctrine `BenchmarkPersona` already implements (`world-fixtures.ts:131-148`).

**F6 — The shopping list is derived in production and hand-written in the world.** Production builds `shopping_list` from planner meals through `POST /api/shopping-list/generate-from-meals` (`routes.ts:4011`), which expands ingredients, deducts freezer portions, runs the item-resolver, and — critically — writes `ingredient_sources` rows linking every list line back to the meal that put it there. The seeder instead calls `storage.addShoppingListItem` directly and **never writes `ingredient_sources`** (it appears in `world-seeder.ts` only in the wipe, at `:204`). Every benchmark household's shopping list is therefore an **orphan**: no provenance, no per-eater context, no freezer interaction, and `matchedStore`/`matchedPrice`/`thaRating` hand-invented rather than resolved. This is the last un-converged path of the class BENCHINT2 closed for meals, evidence, and household membership.

Everything else in the mission's entity list either already has a correct home in the fixture shape, or is a derived output that must never be authored.

---

## 2. GROUNDING — WHAT THA ACTUALLY HAS TODAY

Two "household worlds" are **documented**. One is **implemented**.

| | Six certification fixtures | Ten-household Benchmark World |
|---|---|---|
| Spec | `docs/intelligence/benchmark/BENCHMARK_HOUSEHOLDS.md` | `docs/intelligence/benchmark/BENCHMARK_HOUSEHOLD_WORLD.md` |
| Fixed row ids | `9001`–`9006` / users `8001`–`8006` | none — serial, explicitly *not* in the contract |
| Machine-readable fixture | `benchmark/fixtures/households.v1.json` | `server/benchmark/world-fixtures.ts` |
| **Exists in the repository?** | **NO** | **YES** |
| Seeder | none | `server/benchmark/world-seeder.ts` |
| `worldMode` stamp | `"deterministic-households"` | `"benchmark-world"` |

`BENCHMARK_HOUSEHOLDS.md` §5 states the JSON fixture "live[s] beside this doc" and is "checksum-locked". It does not exist. `households.v1.json` is absent from the tree; the only benchmark fixture file is `companion-benchmark-100.v1.json`, which is the **question bank**. `deterministic-households` appears in exactly two source files — `server/tests/benchmark/runner.ts:44,77` and `types.ts:504-506` — as an enum member and an abort path. The six-household certification world is **prose and an enum value**.

This matters for DEVWORLD directly: **a third world must not be created.** The correct move is to generalise the one that exists and let the certification spec either bind to it or be retired.

### 2.1 The world's guarantees, as actually implemented

- **DEV-only, no override.** `assertBenchmarkWorldAllowed()` throws when `NODE_ENV === "production"` and is called by every public entry point (`world-seeder.ts:77-88`, and `:488`, `:512`, `:522`, `:570`, `:620`). There is one database (`server/db.ts` has no environment branching); the guard plus username-scoped wipe is the entire isolation mechanism.
- **Scoped wipe.** `wipeUserData(userId)` (`:199-250`) and `wipeHouseholdData(householdId)` (`:252-271`) delete only rows belonging to accounts resolved from the deterministic benchmark usernames. Production data cannot be reached.
- **Identity is the username, not the row id.** `ensureAccount` resolves by `storage.getUserByUsername` (`:130`). Every primary key in the domain is `serial`; no production service accepts an explicit id. `world-fixtures.ts:20-23` states this plainly.
- **Recency is relative.** Diary, metric and evidence timestamps are `dayOffset` integers from the reset instant (`offsetDateIso`, `offsetDate` at `:277-287`).
- **Known gaps are canonical facts.** Deliberate absences are fixture data (`knownGaps`), and persona facts the schema cannot hold — kitchen equipment, cooking confidence, disliked foods, favourite meals — are **never written anywhere**, so a question about them yields an honest gap rather than a fabrication (`world-fixtures.ts:131-148`).

### 2.2 One correction to the governing register

`ARCHITECTURE_PRINCIPLES.md` §"Contested domains" and the SoT Register's Appendix B name four files as live debt. Three are **already retired** and the documents are stale:

| File the register says exists | Actual state |
|---|---|
| `client/src/lib/nutrition-variety.ts` | **ABSENT** — superseded by `shared/canonical/plant-classifier.ts` (M4 done) |
| `client/src/lib/dietRules.ts` + `server/lib/dietRules.ts` | **ABSENT** — converged to `shared/dietRules.ts` (M3 done) |
| `client/src/lib/nutrition-benefit-library.ts` | **ABSENT** (M1 done) |
| `client/src/lib/pantry-knowledge.ts` | **ABSENT** (M2 done) |

Only the fourth contested domain survives, and it is the one that bears directly on this investigation: **`users.dietPattern` / `users.dietRestrictions` still shadow `household_eaters`** (§4, Restrictions). Flagged, not fixed here — Rule 7 requires the register be updated by the workstream that resolves it.

---

## 3. DEVELOPMENT WORLD ENTITY MAP

Every entity the mission names, resolved against the live schema. `A` = authored by ChatGPT · `S` = deterministic seed value · `D` = derived by THA · `F` = forbidden to author.

| # | Mission entity | Reality | Canonical owner (table) | Source-of-truth service (file:line) | Disposition |
|---|---|---|---|---|---|
| 1 | users | exists | `users` (`schema.ts:9`) | `storage.createUser` (`storage.ts:408`) — **atomically also creates `households` + owner `household_members`** | `A` + `S` |
| 2 | households | exists | `households` (`:1153`) | `storage.createHouseholdForUser` (`storage.ts:2441`) | `A` (name) · `D` (inviteCode) |
| 3 | household members | exists | `household_members` (`:1162`) | `createUser` / `createHouseholdForUser` / `storage.joinHousehold` (`storage.ts:2503`) | `D` from accounts |
| 4 | profiles | **no table** | composite: `users` columns + `user_preferences` | `storage.updateUserProfile` (`storage.ts:886`) + `upsertUserPreferences` | `A` (split across 1 & 8) |
| 5 | goals | **no table** | `user_preferences.healthGoals` / `.goalType` / `.calorieTarget` | `storage.upsertUserPreferences` (`storage.ts:876`) | `A` |
| 6 | dietary patterns | exists | `users.dietPattern` (`:24`) | `updateUserProfile`; enum `ALLOWED_DIET_PATTERNS` (`routes.ts:569`) | `A` (closed vocab) |
| 7 | restrictions | exists, **contested** | `household_eaters.hardRestrictions` (`:1188`) **and** `users.dietRestrictions` (`:25`) | `storage.createHouseholdEater` (`storage.ts:2802`) / `updateHouseholdEater` (`:2816`) | `A` — author **both**, see §4 |
| 8 | preferences | exists | `user_preferences` (`:659`) | `storage.upsertUserPreferences` (`storage.ts:876`) | `A` |
| 9 | pantry | exists | `user_pantry_items` (`:1031`) | `storage.addPantryItem` (`storage.ts:2025`) | `A` |
| 10 | cookbook | **not a table** | the set of `meals` rows where `user_id` = owner | `storage.getMeals(userId)` (`storage.ts:436`) | `D` (a projection of 11) |
| 11 | meals | exists | `meals` (`:96`) | `storage.createMeal` (`storage.ts:445`) **then** `autoAnalyzeMeal` (`meal-analysis.ts:255`) | `A` (name, ingredients, servings, dietTypes) · `D` (nutrition, allergens, acquisition lane) |
| 12 | planner history | **does not exist** | — | — | `F` — see F5 |
| 13 | shopping lists | exists | `shopping_list` (`:181`) + `ingredient_sources` (`:592`) | production: `POST /api/shopping-list/generate-from-meals` (`routes.ts:4011`). world: `storage.addShoppingListItem` (`storage.ts:557`) | **contested** — see F6 |
| 14 | diary entries | exists | `food_diary_days` (`:1276`), `food_diary_entries` (`:1287`) | `storage.createFoodDiaryEntry` (`storage.ts:2930`) | `A` |
| 15 | cooked meal events | exists, indirectly | `food_diary_entries.source_planner_entry_id` (`:1295`) | `storage.copyPlannerToFoodDiary` (`storage.ts:2949`) / `logMealToDiary` (`:3486`) | `A` (as a diary entry) |
| 15b | skipped meal events | **does not exist** | — | — | `F` — absence *is* the record |
| 16 | nutrition history | **no household table** | derived on read | `assembleNutritionCentre` (`nutrition-centre-assembler.ts:126`) — "owns NOTHING" | `D` |
| 16b | per-meal nutrition | exists | `nutrition` (`:147`) | `autoAnalyzeMeal` → `storage.upsertNutrition` | `D` (network-bound — F2) |
| 17 | plant diversity inputs | **no per-household store** | inputs are the meal ingredient **strings**; reference data is `diversity_group` + `canonical_food` | `resolveCanonicalFood` (`shared/canonical/resolver.ts:157`) → `plant-classifier.ts:214` | `A` (strings only) · `D` (the count) |
| 18 | behaviour evidence | exists | `household_evidence_events` (`:2447`) | `recordOutcomeAndDetect` (`evidence-learning/framework.ts:243`) — **the only legitimate write path** | `A` via orchestrator |
| 18b | learning signals | exists | `household_learning_signals` (`:2496`) | derived by `detectPatterns` (`framework.ts:143`), ≥3 events, consistency ≥0.7 | `F` |
| 19 | observation inputs | exists — **but is an output** | `platform_observations` (`:2552`) | `observation-store.ts:47` | `F` — "telemetry is a side effect of behaviour, never an input to it" |
| 20 | companion history | exists | `conversations` / `conversation_threads` / `conversation_turns` (`:2197`/`:2204`/`:2214`) | `DatabaseConversationStore` via the Conversation Gateway | `F` — produce by running turns; see §12 R4 |
| 21 | accepted swaps | **not a table** | `household_evidence_events` with `outcomeType:"accepted"`, `direction:"positive"` | `recordOutcomeAndDetect` | `A` as evidence |
| 22 | rejected swaps | **not a table** | `household_evidence_events` with `outcomeType:"rejected"`, `direction:"negative"` | `recordOutcomeAndDetect` | `A` as evidence |
| 23 | favourites | **does not exist** | — (`ingredient_swaps` is a 3-column global rules table with **no writer**, `:323`) | — | `F` — persona narrative only |
| 24 | membership / tier | exists | `users.subscriptionTier` (`:30`) | `storage.setUserSubscriptionTier` (`storage.ts:1980`) | `A` (`free`\|`premium`\|`friends_family`) |

### 3.1 The forbidden set, in full

These tables exist, are writable, and **must never appear in a world file**. Each has exactly one owner that produces it, and seeding it forges a fact the platform never inferred.

| Table | Why forbidden | Single writer |
|---|---|---|
| `household_learning_signals` | Derived from ≥3 polarised evidence events. A seeded signal is a preference THA never detected; `status:"confirmed"` is reachable only by a human `approve` verb. | `evidence-learning-store.ts:191` |
| `platform_observations` | Operator telemetry. Nothing reads it back, by architectural rule. | `observation-store.ts:47` |
| `opportunity_deliveries` | The Decision Engine's own output — the delivery lifecycle. Producer output is recomputed fresh every `report`. | `delivery-store.ts:120` |
| `conversations` / `_threads` / `_turns` | A record of runtime conversation. Pre-seeding a long shared thread is exactly the contamination BENCHINT4 §4.1 traced. | `conversation-store.ts:197/213/262` |
| `companion_response_feedback`, `_guidance_events`, `_action_proposals` | Lifecycle records of a live turn. | `companion-feedback-store.ts`, `companion-action-store.ts:112` |
| `companion_health_snapshots`, `_learning_recommendations` | Aggregate advisory queues. | `companion-learning-store.ts:109/136` |
| `nutrition`, `meal_allergens` | Derived by `autoAnalyzeMeal` from the authored ingredient strings. | `meal-analysis.ts:350`, `:375` |
| `activity_summary`, `user_streaks`, `user_health_trends`, `user_item_usage`, `savings_events`, `product_events` | Event accumulators / re-derived counters. `savings_events.amount` must match `SAVINGS_RATES`, not be chosen. | `product-event-logger.ts:98`, `storage.ts:1277/1303/3516/3545` |
| `pantry_ingredient_knowledge` | Shared AI-enrichment cache keyed by `ingredient_key` — global, not per-household. | `storage.upsertPantryIngredientKnowledge` (`storage.ts:3377`) |
| `meal_uplift_applications` | Provenance of accepted engine suggestions. | `storage.ts:3631` |
| `ingredient_sources` | Planner→list provenance, written only by the derivation (`routes.ts:4162`). | `storage.addIngredientSource` (`storage.ts:793`) |
| `meal_diets` / `diets` | Legacy join, populated only by copy/variant flows. The live mechanism is `meals.diet_types`. | `storage.setMealDiets` (`storage.ts:700`) |
| `meal_plans` / `meal_plan_entries` | Vestigial. Zero route callers. | `storage.ts:664/678` |

---

## 4. OWNERSHIP MAP

Read: *who owns this fact, and therefore who may write it.*

```
                    ┌──────────────────────────────────────────────┐
   AUTHORED         │  world file (YAML)  —  ChatGPT authors this   │
   INPUTS           │  identity · people · constraints · content    │
                    │  · behaviour outcomes · declared gaps         │
                    └────────────────────┬─────────────────────────┘
                                         │  parsed + validated (DEVWORLD2)
                    ┌────────────────────▼─────────────────────────┐
   IMPORT SEAM      │  world importer — owns NO facts               │
   (one writer)     │  resolves natural keys → calls the services   │
                    └────────────────────┬─────────────────────────┘
                                         │  invokes, never bypasses
   ┌─────────────────────────────────────▼──────────────────────────────────┐
   │  EXISTING PRODUCTION SERVICES (the owners — unchanged)                  │
   │                                                                         │
   │  storage.createUser ─────────────┐                                      │
   │  storage.createHouseholdForUser  ├─ identity & membership               │
   │  storage.joinHousehold ──────────┘                                      │
   │  storage.upsertUserPreferences ── preferences, goals, body metrics      │
   │  storage.syncMembersAsEaters / createHouseholdEater ── eaters           │
   │  storage.addPantryItem ── pantry                                        │
   │  storage.createMeal ── meal identity                                    │
   │  storage.addPlannerEntry ── planner state                               │
   │  storage.createFoodDiaryEntry / upsertFoodDiaryMetrics ── diary         │
   │  recordOutcomeAndDetect ── evidence  (EL1 orchestrator)                 │
   └───────────────────┬────────────────────────────────────────────────────┘
                       │  each service triggers its own derivation
   ┌───────────────────▼────────────────────────────────────────────────────┐
   │  DERIVED BY THA — never authored, never in the world file               │
   │                                                                         │
   │  autoAnalyzeMeal        →  nutrition, meal_allergens                    │
   │  detectPatterns         →  household_learning_signals                   │
   │  resolveCanonicalFood   →  canonical identity, plant diversity (read)   │
   │  assembleNutritionCentre→  household nutrition history (read)           │
   │  Decision Engine        →  opportunity_deliveries                       │
   │  Observation Engine     →  platform_observations                        │
   │  Conversation Gateway   →  conversations / threads / turns              │
   └────────────────────────────────────────────────────────────────────────┘
```

**No fact has two owners in this picture.** The world file owns the *statement of intent*; the service owns the *fact*; the derivation owns the *inference*. The importer owns nothing — it is a translator of many authored strings into one canonical identity, which Principle 7 names as **permitted input-funnelling infrastructure**, not a synchronisation bridge.

### 4.1 The restriction duplication — the one genuinely contested ownership

Restrictions live in two places at the same scope:

| Store | Column | Vocabulary | Enforced by |
|---|---|---|---|
| `users` | `dietPattern`, `dietRestrictions` | `ALLOWED_DIET_PATTERNS` (10), `ALLOWED_DIET_RESTRICTIONS` (7) — `routes.ts:569-570` | `shared/dietRules.ts` hard filters |
| `household_eaters` | `defaultDietTypes`, `hardRestrictions` | **free-text `text[]`**, no DB or Zod enum (`routes.ts:8835-8836`) | planner compliance gate, meal scoring |

Principle 2's scope test: *can these legitimately disagree?* For an **adult account holder** the answer is no — they are the same person's same restriction, and the register already calls this "same scope → redundant". For a **child eater** there is no `users` row at all, so `household_eaters` is the only owner.

Consequences for a world file, both of which the existing fixtures already do (`world-fixtures.ts:41-65`):
1. The account block authors `dietPattern` / `dietRestrictions` (closed vocabularies).
2. The eater block authors `defaultDietTypes` / `hardRestrictions` (open vocabularies).
3. For adult eaters these **must be authored consistently**, because nothing enforces it. A validator must assert it.

`hardRestrictions` being free text is the sharp edge. `BW08` writes `"tree nuts"` and `"sesame"` (`world-fixtures.ts:1069`); the canonical restriction ids in `shared/restrictions/restriction-library.ts` are `tree_nut` and `sesame`. **The world file's own vocabulary does not match the canon it is meant to exercise.** A validator that maps authored restriction strings onto restriction-library ids — and rejects unmapped ones — is a DEVWORLD2 requirement, not a nicety.

---

## 5. DEPENDENCY / IMPORT ORDER

Derived from `world-seeder.ts:487-508` (`resetBenchmarkHousehold`) and `:289-480` (`reseedHousehold`), with the two corrections F6 and F3 folded in. **Order is forced by foreign keys and by derivation, not by taste.**

### Phase 0 — global reference data (once per database, never per household)

Not part of a world file. These are editorial seeds shared by every world.

| Step | Command / entry point | Produces |
|---|---|---|
| 0.1 | `npm run seed:canonical` | `diversity_group` → `canonical_food` → `food_variety` + `canonical_food_alias` (order is internal to the script) |
| 0.2 | `npm run seed:knowledge` | `knowledge_*` registry |
| 0.3 | `npm run seed:additives` | `additives` |
| 0.4 | boot (`server/index.ts:128-130`) | `meal_categories`, system ready-meals (`user_id = 0`), `food_knowledge`, `pantry_ingredient_knowledge` |

Without 0.1 the ingredient strings authored in a world file resolve to nothing: no canonical identity, no plant diversity, no food report. **A world file is meaningless against an unseeded reference layer.**

### Phase 1 — per household, in this exact order

| # | Step | Service | Why it must come here |
|---|---|---|---|
| 1 | Owner account | `storage.createUser` (`storage.ts:408`) | Atomically creates `households` + owner `household_members` in one transaction. A user never exists without a household. |
| 2 | Household naming + partner | `storage.createHouseholdForUser` (fallback) → `db.update(households).name` → `storage.joinHousehold(partnerId, inviteCode)` | The partner must join through the real invite path, or their auto-created solo household is orphaned with zero members (BENCHINT2 D11). Requires the household's generated `inviteCode`. |
| 3 | **Scoped wipe** | `wipeHouseholdData` then `wipeUserData` | Household-scoped first (planner cascades from weeks), then user-scoped. Reset is wipe-then-reseed, total. |
| 4 | Preferences | `storage.upsertUserPreferences` | Row is created lazily; it is *not* auto-created with the user. Must precede anything that reads household size or diet types. |
| 5 | Eaters | `storage.syncMembersAsEaters` → `updateHouseholdEater` (adults) / `createHouseholdEater` (children) | Sync first: adults already have an auto-synced eater row keyed to their `userId`; creating a second would fork the eater identity (Principle 1). Children have no account and are created outright. |
| 6 | Pantry | `storage.addPantryItem` | Independent of meals. Owner-scoped. |
| 7 | Meals | `storage.createMeal` **then `await autoAnalyzeMeal(id)`** | Two calls, always. `createMeal` writes the row and nothing else; production's route runs the derivation afterwards, and so must the importer. **Await sequentially** — `autoAnalyzeMeal` returns silently without deriving anything when `activeAnalysisCount >= 3` (`meal-analysis.ts:257`), so a parallel import loses nutrition *and allergens* with no error. Build `mealIdByName` here; every later phase needs it. |
| 8 | Planner | `storage.createPlannerWeeks(userId)` → `storage.getPlannerDays(weekId)` → `storage.addPlannerEntry(dayId, …)` | `createPlannerWeeks` creates the fixed 6×7 canvas. Entries need a `dayId` and a `mealId` — hence after 7. |
| 9 | Freezer (optional) | `storage.addFreezerMeal` | Must precede 10: list generation deducts frozen portions. |
| 10 | **Shopping list** | **`POST /api/shopping-list/generate-from-meals` derivation (`routes.ts:4011`)** — *not* `addShoppingListItem` | Derives from planner + freezer, runs the item-resolver, writes `ingredient_sources`. **This is the F6 correction.** Extras (`shopping_list_extras`) remain authored. |
| 11 | Diary | `storage.createFoodDiaryEntry` / `storage.upsertFoodDiaryMetrics` | Entries reference meal *names*, not ids — the diary stores free text. A "cooked" entry additionally carries `source_planner_entry_id`, so it must follow 8. |
| 12 | Evidence | `recordOutcomeAndDetect(request, evidenceLearningStore)` (`framework.ts:243`) | Last. `subjectId` for a meal-subject event is `meal:<id>`, resolved from `mealIdByName`. Each call appends the event **and re-detects patterns over that event's dimension**, so learning signals emerge here — never seeded. |
| 13 | Stamp | `storage.setSiteSetting` | `benchmark_world:<id>:last_reset_at` and world version. |

### 5.1 The evidence seam is *not* the EL2 one door

Production records evidence through `recordHouseholdObservation()` (`household-observation.ts:85`), the EL2 "one door", which travels the Intent Engine's `report` verb. **The importer cannot use it.** `HouseholdObservationInput` (`household-observation.ts:57-70`) has no `occurredAt` field — a live outcome happens *now*. A world file must backdate evidence to `dayOffset`, and only `RecordOutcomeRequest.occurredAt` (`framework.ts:201-213`) accepts it.

So the importer calls the **orchestrator one layer beneath the one door**. That is the correct seam: the orchestrator still owns append-plus-detect, still applies `EVIDENCE_WINDOW_DAYS`, and still refuses to let a signal be written except by detection. It is the narrowest legitimate opening, and BENCHINT2 D7 already chose it deliberately (`world-seeder.ts:442-455`). DEVWORLD2 must not widen it to `store.recordEvent`, which would bypass detection entirely.

---

## 6. AUTHORED vs DERIVED — FIELD CLASSIFICATION

Legend: **`A`** authored by ChatGPT · **`S`** deterministic seed value (fixed by the world, not creative) · **`D`** derived by THA (never appears in the file) · **`F`** forbidden to author.

### 6.1 World

| Field | Class | Note |
|---|---|---|
| `world.version` | `S` | Bump on **any** change to a present-or-absent fact. Frozen content. |
| `world.accountDomain` | `S` | `…@<domain>` — the username namespace. |
| `world.password` | `S` | One shared DEV password, env-overridable. Never in the file if a real secret. |

### 6.2 Household

| Field | Class | Note |
|---|---|---|
| `id` | `S` | `DW01`… — the permanent handle. Not a row id. |
| `slug`, `archetype`, `householdName`, `summary` | `A` | `householdName` is the only one written to a table. |
| `coldStart` | `A` | `true` ⇒ every content collection must be empty. |
| `knownGaps[]` | `A` | Prose. Canonical facts about absence. Never written to any store. |
| `persona.*` | `A` | **Never written anywhere.** Lifestyle, shopping habits, cooking confidence, budget, kitchen equipment, favourite meals, disliked foods. This is where `favourites` lives (F5). |

### 6.3 Accounts → `users`

| Field | Class | Vocabulary |
|---|---|---|
| `key` | `S` | `owner` \| `partner`. Exactly one owner. |
| `username` | `S` | Deterministic; the identity handle across resets. |
| `displayName`, `firstName` | `A` | |
| `dietPattern` | `A` | closed: `Mediterranean, DASH, MIND, Flexitarian, Vegetarian, Vegan, Keto, Low-Carb, Paleo, Carnivore` (`routes.ts:569`) |
| `dietRestrictions[]` | `A` | closed: `Gluten-Free, Dairy-Free, Nuts, Eggs, Shellfish, Soy, Sesame` (`routes.ts:570`) |
| `eatingSchedule` | `A` | closed: `None, Intermittent Fasting` (`routes.ts:571`) |
| `subscriptionTier` | `A` | closed: `free, premium, friends_family` |
| `id`, `password` hash, `inviteCode`, `createdAt`, `updatedAt`, `lastLoginAt`, `emailVerificationToken`, `passwordResetToken` | `D` | |
| `role`, `isDemo`, `isBetaUser`, `emailVerified`, `onboardingCompleted`, `starterMealsLoaded` | `F` | Set by the importer, not the author. `onboardingCompleted` is `!coldStart`. |

### 6.4 Eaters → `household_eaters`

| Field | Class | Note |
|---|---|---|
| `displayName` | `A` | required |
| `accountKey` | `S` | present ⇒ adult with a login; absent ⇒ child (`kind` is **derived**: `userId != null ? "user" : "child"`) |
| `defaultDietTypes[]` | `A` | open `text[]`; **should** conform to `ONBOARDING_DIET_OPTIONS` |
| `hardRestrictions[]` | `A` | open `text[]`; **must** map onto `restriction-library.ts` ids (§4.1) |
| `ageYears` | `A` | **narrative only — no schema column.** Displayed on the admin view, written nowhere. |
| `id`, `householdId`, `userId`, `kind` | `D` | |

### 6.5 Preferences → `user_preferences`

All `A`, all optional, all defaulted. `dietTypes`, `excludedIngredients`, `healthGoals` (**this is "goals"**), `budgetLevel` (`budget|standard|premium`), `preferredStores`, `calorieTarget`, `goalType` (**closed: `lose|maintain|build|health`** — *not* `gain`, F3), `activityLevel` (`low|moderate|high`), `heightCm`, `weightKg`, `adultsCount`, `childrenCount`, `maxTotalCookTime`, `preferredIngredients`, `plannerEnableChildMeals`, `companionPersonality` (`companion|friend|coach|chef|teacher|sergeant`).

`mutedOpportunityTypes` is `F` — it is the Decision Engine's muting state.

### 6.6 Meals → `meals`

| Field | Class | Note |
|---|---|---|
| `name` | `A` | required; the join key for planner, diary and evidence |
| `ingredients[]` | `A` | required; **free-text strings**. Their quality determines everything downstream: canonical resolution, plant diversity, allergens, nutrition. Author clean UK product names. |
| `instructions[]`, `servings`, `dietTypes[]`, `audience`, `kind` | `A` | `dietTypes` is the **live** diet mechanism (`meals.diet_types`), not `meal_diets` |
| `mealSourceType`, `mealFormat`, `isReadyMeal`, `isSystemMeal` | `S` | fixed at `scratch` / `recipe` / `false` / `false` for authored household meals |
| `nutrition`, `meal_allergens` | `D` | by `autoAnalyzeMeal` |
| `acquisitionLane`, `acquisitionType` | `D` | back-filled by `createMeal` from `mealSourceType` |
| `categoryId`, `mealTemplateId`, `sourceUrl` | `F` | resolving these needs reference ids the author cannot know; `sourceUrl` additionally changes the nutrition derivation path |

### 6.7 Pantry, planner, shopping, diary, evidence

| Block | Authored fields | Derived / forbidden |
|---|---|---|
| `pantry[]` | `ingredient` (→ `ingredientKey`), `category`, `displayName?` | `id`, `householdId`, `createdAt`, `sortOrder` |
| `planner[]` | `week` (1–6), `dayOfWeek` (0=Mon…6=Sun), `mealType` (**`breakfast\|lunch\|dinner\|snacks`** — production's spelling, F3), `mealName` (→ resolved to `mealId`) | week/day rows are `D` (`createPlannerWeeks` builds the fixed 6×7 canvas); `adaptationResult`, `originalMealIdBeforeVariant` are `D` |
| `plannerEntryEaters[]` | eater `displayName` per entry | `D` ids |
| `weekEaterOverrides[]` | `week`, eater `displayName`, `dietTypes[]` | — |
| `freezer[]` | `mealName`, `totalPortions`, `remainingPortions`, `frozenDayOffset` | `householdId` |
| `shoppingExtras[]` | `name`, `category`, `alwaysAdd` | — |
| **`shopping[]`** | **nothing — the list is `D`** (F6). Today's fixtures author `productName`/`normalizedName`/`category`/`matchedStore`/`matchedPrice`/`thaRating`; all six are outputs of the item-resolver and price lookup. | `ingredient_sources` is `F` |
| `diaryEntries[]` | `dayOffset` (≤0), `mealSlot` (**`breakfast\|lunch\|dinner\|snack`** — the diary's spelling differs from the planner's), `name`, `fromPlannerMeal?` | `dayId`, `sourceType` |
| `diaryMetrics[]` | `dayOffset`, `weightKg`, `moodApples` (1–5), `energyApples` (1–5), `sleepHours` (0–24), `stuckToPlan` | `bmi` is `D` (from `weightKg` + `heightCm`) |
| `evidence[]` | `subjectType`, `subjectKey`, `mealName?` \| `subjectId?`, `outcomeType`, `direction` (`positive\|negative\|neutral`), `dayOffset`, `sourceCapabilityId` | `id`, `recordedAt`; **`household_learning_signals` is `F`** |
| `savings`, `streaks`, `trends`, `usage`, `activity`, `observations`, `conversations`, `deliveries` | — | **`F`** in full (§3.1) |

---

## 7. PROPOSED DEVELOPMENT-WORLD YAML SCHEMA

Inputs only. Derived outputs are absent by construction, and their keys are **rejected**, not ignored — a silently-ignored `nutrition:` block is an author who believes they seeded nutrition.

```yaml
# ===========================================================================
#  THA Development World  —  world file
#  Class markers:  [A] authored   [S] deterministic seed   (D/F never appear)
# ===========================================================================
world:
  version: "1.0.0"                              # [S] bump on ANY present-or-absent fact change
  accountDomain: "dev.thehealthyapples.dev"     # [S] username namespace
  clock: reset-relative                         # [S] the ONLY permitted value; no absolute dates

households:
  - id: DW01                                    # [S] permanent handle; never a database row id
    slug: standard-family                       # [S] unique within the world
    archetype: Standard Family                  # [A]
    householdName: Harris Family (Dev)          # [A] → households.name
    summary: Two adults, two children, omnivore # [A] admin list line
    coldStart: false                            # [A] true ⇒ every collection below MUST be empty

    # -- identity ---------------------------------------------------------
    accounts:
      - key: owner                              # [S] exactly one `owner`, at most one `partner`
        username: john.harris.dev               # [S] local part; domain appended from world.accountDomain
        displayName: John Harris (Dev)          # [A]
        firstName: John                         # [A]
        dietPattern: null                       # [A] closed vocab (10) or null
        dietRestrictions: []                    # [A] closed vocab (7)
        eatingSchedule: None                    # [A] closed vocab (2)
        subscriptionTier: free                  # [A] free | premium | friends_family
      - key: partner
        username: claire.harris.dev
        displayName: Claire Harris (Dev)
        firstName: Claire

    # -- people -----------------------------------------------------------
    eaters:
      - displayName: John                       # [A]
        accountKey: owner                       # [S] adult (has a login); omit ⇒ child
      - displayName: Claire
        accountKey: partner
      - displayName: Oliver                     # child: no account
        ageYears: 10                            # [A] NARRATIVE ONLY — no schema column
        defaultDietTypes: []                    # [A] open vocab (soft)
        hardRestrictions: []                    # [A] MUST map to restriction-library ids

    # -- profile, goals, preferences (all → user_preferences, owner-scoped)
    preferences:                                # [A] every field optional
      dietTypes: []
      excludedIngredients: []
      healthGoals: [eat_healthier]              #     ← this IS "goals"
      goalType: maintain                        #     lose | maintain | build | health   (NOT "gain")
      budgetLevel: standard                     #     budget | standard | premium
      activityLevel: moderate                   #     low | moderate | high
      preferredStores: [Tesco, Sainsbury's]
      preferredIngredients: []
      calorieTarget: null
      heightCm: null
      weightKg: null
      adultsCount: 2
      childrenCount: 2
      maxTotalCookTime: 45
      plannerEnableChildMeals: true
      companionPersonality: companion           #     companion|friend|coach|chef|teacher|sergeant

    # -- narrative: canonical, and deliberately written to NO store --------
    persona:                                    # [A] a question about any of this MUST yield an honest gap
      lifestyle: Both parents work full time; regular weekday routine.
      shoppingHabits: One big weekly shop on Saturdays.
      cookingConfidence: moderate               #     low | moderate | high
      weeknightCookingTime: 30–45 minutes
      budget: standard
      kitchenEquipment: [oven, hob, microwave, slow cooker]
      favouriteMeals: [Spaghetti Bolognese]     #     ← "favourites" lives HERE. There is no table.
      dislikedFoods: [olives (Oliver), blue cheese]

    # -- content ----------------------------------------------------------
    pantry:
      - ingredient: spaghetti                   # [A] → ingredientKey
        category: larder                        # [A] larder | fridge | freezer | household
        displayName: null                       # [A] optional

    meals:                                      # the cookbook == meals owned by the owner account
      - name: Spaghetti Bolognese               # [A] unique within the household; the join key
        servings: 4                             # [A]
        dietTypes: []                           # [A] the LIVE diet mechanism (meals.diet_types)
        instructions: []                        # [A]
        ingredients:                            # [A] free text. Quality drives EVERY derivation:
          - Beef mince                          #     canonical identity, plant diversity,
          - Spaghetti                           #     allergens, nutrition. Use clean UK names.
          - Tinned chopped tomatoes
          - Onion
          - Garlic
          - Carrot
          - Dried oregano
          - Olive oil
        # nutrition:  FORBIDDEN — derived by autoAnalyzeMeal
        # allergens:  FORBIDDEN — derived by autoAnalyzeMeal

    planner:                                    # weeks/days are DERIVED (fixed 6×7 canvas)
      - week: 1                                 # [A] 1–6
        dayOfWeek: 0                            # [A] 0 = Monday … 6 = Sunday
        mealType: dinner                        # [A] breakfast | lunch | dinner | snacks  ← "snacks"
        mealName: Spaghetti Bolognese           # [A] MUST exist in meals[]
        eaters: [John, Claire, Oliver]          # [A] optional; → planner_entry_eaters

    weekEaterOverrides:                         # [A] optional per-week soft-diet override
      - week: 1
        eater: Oliver
        dietTypes: []

    freezer:                                    # [A] optional; deducted by list generation
      - mealName: Spaghetti Bolognese
        totalPortions: 4
        remainingPortions: 2
        frozenDayOffset: -14

    shoppingExtras:                             # [A] non-recipe staples
      - name: Kitchen roll
        category: household
        alwaysAdd: true

    # shopping:  FORBIDDEN — the list is DERIVED from planner + freezer by
    #            generate-from-meals, which also writes ingredient_sources.
    #            Declare `generateShoppingList: true` to run the derivation.
    generateShoppingList: true                  # [A] boolean, not content

    diaryEntries:                               # "cooked" is recorded HERE, not on the planner
      - dayOffset: -1                           # [A] ≤ 0, relative to the reset instant
        mealSlot: dinner                        # [A] breakfast | lunch | dinner | snack  ← "snack"
        name: Spaghetti Bolognese               # [A] free text
        fromPlannerMeal: Spaghetti Bolognese    # [A] optional → source_planner_entry_id
    # skipped:  FORBIDDEN — there is no such record. An uncooked planned meal
    #           simply has no diary entry. Absence IS the representation.

    diaryMetrics:                               # [A] user self-report, NOT derived from entries
      - dayOffset: -1
        weightKg: 78.4
        moodApples: 4                           #     1–5
        energyApples: 3                         #     1–5
        sleepHours: 7.5                         #     0–24
        stuckToPlan: true
      # bmi: FORBIDDEN — derived from weightKg + preferences.heightCm

    evidence:                                   # behaviour evidence + accepted/rejected swaps
      - subjectType: meal                       # [A]
        subjectKey: cuisine:italian             # [A] the GROUPING dimension a pattern detects over
        mealName: Spaghetti Bolognese           # [A] → subjectId "meal:<id>"; or use subjectId
        outcomeType: completed                  # [A] domain-owned vocab: completed|accepted|rejected|skipped
        direction: positive                     # [A] positive | negative | neutral
        dayOffset: -3                           # [A] backdated via RecordOutcomeRequest.occurredAt
        sourceCapabilityId: planner             # [A] a registered capability id
      - subjectType: swap                       # an ACCEPTED swap is an evidence event
        subjectKey: ingredient:mushroom
        subjectId: swap:mushroom-to-courgette
        outcomeType: rejected                   # a REJECTED swap: outcomeType + negative direction
        direction: negative
        dayOffset: -5
        sourceCapabilityId: meals
    # learningSignals: FORBIDDEN — derived by detectPatterns from ≥3 events
    #                  at consistency ≥ 0.7. Seeding one forges a preference.

    # -- honesty ----------------------------------------------------------
    knownGaps:                                  # [A] as canonical as the present facts
      - No plan exists for week 2 — "what's my plan next week" MUST be an honest gap.
      - No health goal with a numeric target — questions about progress MUST gap.
      - Kitchen equipment and disliked foods are persona-only; questions MUST gap.

# ===========================================================================
#  KEYS REJECTED AT PARSE TIME (present ⇒ the file is invalid, not ignored)
#  nutrition · allergens · mealDiets · plantDiversity · nutritionHistory
#  learningSignals · observations · conversations · threads · turns
#  opportunityDeliveries · companionFeedback · actionProposals
#  activitySummary · streaks · healthTrends · itemUsage · savings
#  productEvents · pantryIngredientKnowledge · upliftApplications
#  ingredientSources · shopping · plannerHistory · skipped · favourites
#  role · isDemo · isBetaUser · subscriptionStatus · any `id:` row id
# ===========================================================================
```

---

## 8. VALIDATION REQUIREMENTS

A world file is invalid — and the import **aborts before writing anything** — unless all of the following hold. This is the layer that must exist, because §F3 proves the service layer will not do it.

### 8.1 Structural
1. Exactly one account with `key: owner`; at most one with `key: partner`.
2. Every `eaters[].accountKey`, when present, names an account in this household.
3. Every adult account has exactly one eater; no eater names an absent account.
4. `coldStart: true` ⇒ `pantry`, `meals`, `planner`, `diaryEntries`, `diaryMetrics`, `evidence`, `freezer`, `shoppingExtras` are all empty, and `preferences` is `{}`.
5. `world.clock == "reset-relative"`. Any absolute date anywhere ⇒ reject.

### 8.2 Referential
6. Every `planner[].mealName`, `freezer[].mealName`, `evidence[].mealName` and `diaryEntries[].fromPlannerMeal` names a meal in this household's `meals[]`.
7. `meals[].name` is unique within the household (it is the join key; duplicates make `mealIdByName` lossy).
8. Every `planner[].eaters[]` and `weekEaterOverrides[].eater` names an eater in this household.
9. `planner[].week` ∈ 1..6; `planner[].dayOfWeek` ∈ 0..6; at most one entry per `(week, dayOfWeek, mealType, audience)`.
10. `usernames` are globally unique **across all worlds** — they are the identity registry and the wipe scope.

### 8.3 Vocabulary (the F3 gate)
11. `dietPattern` ∈ `ALLOWED_DIET_PATTERNS` (`routes.ts:569`) or null.
12. `dietRestrictions[]` ⊆ `ALLOWED_DIET_RESTRICTIONS` (`routes.ts:570`).
13. `preferences.goalType` ∈ `{lose, maintain, build, health}` — **`gain` is invalid** and today's `BW06` would fail this check.
14. `preferences.activityLevel` ∈ `{low, moderate, high}`; `budgetLevel` ∈ `{budget, standard, premium}`; `companionPersonality` ∈ `PERSONALITY_IDS`.
15. `planner[].mealType` ∈ `{breakfast, lunch, dinner, snacks}` — **`snack` is invalid here** and today's `BW06` would fail.
16. `diaryEntries[].mealSlot` ∈ `{breakfast, lunch, dinner, snack}` — note the deliberate, real difference from 15.
17. `evidence[].direction` ∈ `{positive, negative, neutral}`; `sourceCapabilityId` resolves in the live Capability Registry.
18. `eaters[].hardRestrictions[]` each map onto a canonical id in `shared/restrictions/restriction-library.ts` **after normalisation** (`"tree nuts"` → `tree_nut`). An unmapped restriction is a reject, not a warning: it is a silent safety hole.
19. `pantry[].category` ∈ the observed set `{larder, fridge, freezer, household}`.

### 8.4 Consistency
20. For every **adult** eater, `hardRestrictions` and the linked account's `dietRestrictions` must be mutually consistent after normalisation (§4.1). They are two stores of one fact; the file must not let them disagree.
21. `preferences.adultsCount` equals the number of accounts; `childrenCount` equals the number of account-less eaters.
22. Every `knownGaps[]` claim must be **true of the file**: a gap that names an entity the file authors is a contradiction and must reject. (`"no plan for next week"` while `planner` contains `week: 2` ⇒ reject.)

### 8.5 Forbidden-key rejection
23. Any key in the §7 rejection list, at any depth ⇒ reject with the owning derivation named in the error. Never ignore silently.
24. No `id:` naming a database row id anywhere. Row ids are not part of the contract.

### 8.6 Environment and integrity
25. `assertDevelopmentWorldAllowed()` — `NODE_ENV !== "production"`, no override, asserted at every entry point.
26. The wipe scope resolves **only** from the file's usernames. A username that resolves to an account outside the world's domain ⇒ abort.
27. Content checksum over the parsed file; a change without a `world.version` bump ⇒ warn loudly (this is the discipline `BENCHMARK_HOUSEHOLDS.md` §5 asserts and no code enforces).

---

## 9. ARCHITECTURE COMPLIANCE

### Governance gate (SoT Register, Appendix C)

```
Domain affected:   Development world household representation
Declared SoT:      server/benchmark/world-fixtures.ts (fixtures)
                   server/benchmark/world-seeder.ts   (import)
New store created?      NO — a YAML file is an authoring format, not a store.
                        It is parsed, validated, and discarded into existing services.
Existing store extended? NO
Consumer created?       YES (the importer, DEVWORLD2)
  Reads from declared SoT? YES — it writes exclusively through the production
                          services named in §5, and reads reference data from
                          the canonical seeds.
```

### The eight principles

| Principle | DEVWORLD compliance | Verdict |
|---|---|---|
| 1 — One canonical identity per entity | The world introduces **no key space**. Row ids are serial and excluded from the contract; identity is the deterministic username and the household handle `DWxx`. Meals are joined by name *within the file* and by id *after creation*. | ✅ |
| 2 — One owner per fact | The world file owns no fact. It states intent; the service writes the fact. The single genuine duplication — `users.dietRestrictions` vs `household_eaters.hardRestrictions` — **pre-exists** and is inherited, not created (§4.1); validation rule 20 prevents the file from making it worse. | ✅ (inherited debt named) |
| 3 — Progressive enrichment / single-owner transactional state | Planner, shopping, diary and membership are transactional: the world authors them once and bolts no enrichment on. Meals and Households are knowledge entities and enrich through `autoAnalyzeMeal`. | ✅ |
| 4 — Runtime consumes one assembled model | The importer re-resolves nothing. It calls `resolveCanonicalFood` never; it hands ingredient **strings** to `createMeal` and lets the platform's own resolvers do their job. | ✅ |
| 5 — Reference vocabularies beside the spine | Diet patterns, restrictions, allergen library, diversity groups are reference data seeded globally (Phase 0), never per household. The world file references them; it never restates them. | ✅ |
| 6 — No fabricated knowledge | **The load-bearing one.** `knownGaps` makes absence canonical. Persona facts with no schema column are written nowhere. Offline nutrition derivation yields an honest gap, never a number. And the file may not author `nutrition`, `learning_signals`, `observations`, or `opportunity_deliveries` — the four places where a fixture could fabricate intelligence the platform never inferred. | ✅ |
| 7 — No permanent synchronisation bridge | The importer is an **input-funnelling bridge** (many authored strings → one canonical identity via existing services), which Principle 7 explicitly permits. It is not a second owner kept in sync: the YAML is not read back, and nothing writes to it. | ✅ |
| 8 — Evolution over replacement | DEVWORLD **extends** `server/benchmark/world-*.ts` in place. It creates no second world, no second seeder, no second fixture format. The six-household certification spec is named for retirement-or-binding (§12 Q1) rather than left as a silent third world. | ✅ |

**Gate result: PASS**, conditional on three constraints carried into DEVWORLD2: (a) the shopping list is derived, not authored (F6); (b) vocabulary validation lives in the validator, because the services do not perform it (F3); (c) no schema is added for planner history, skipped events, or favourites (F5).

### AI architecture compliance

Not an AI implementation. It creates no capability, no intent, no prompt, and no context view. It touches the Intelligence Platform only by **producing the household state that capabilities read**, and by **refusing to seed** anything the Observation, Behaviour or Decision Engines own.

---

## 10. DATA IMPACT

| Question | Answer |
|---|---|
| Production data affected? | **No.** Nothing was executed. The world is DEV-only by an assert with no override, and its wipe is scoped to usernames in a dedicated domain. |
| Schema changed? | No. |
| Migration added? | No. |
| Rows written? | Zero. This investigation ran read-only greps and reads. |
| New store proposed? | No. A YAML file is an authoring format; it is parsed into existing services and never read back. |

---

## 11. TRUST CHECK

| Hard stop (`ENGINEERING_WORKFLOW` STEP 7) | Status |
|---|---|
| Knowledge claim without a `SourceRef` | Not applicable — a world file carries **no knowledge claims**. It carries a household's own data. Nutrition and health facts are derived from the canonical registries, which retain their source gating. |
| AI-generated health claim | None. ChatGPT authors *household content* (names, ingredients, routines), never nutrition facts, benefits, or health guidance. **This boundary is the reason the `nutrition` key is forbidden rather than optional.** |
| `emerging` benefit shown as `established` | Not applicable. |
| Bridge keeping two stores of one fact in sync | None created. §4.1 names the one that pre-exists. |
| New static file storing knowledge that overlaps a DB store | None. The world file stores *household state*, which has no knowledge-store counterpart. |

One trust risk is real and is recorded as R2 below: a fictitious household's ingredient strings feed `autoAnalyzeMeal`, which fetches **live third-party nutrition data** from OpenFoodFacts and stores the result as fact. That is production behaviour, not a world-file behaviour — but the world is where it becomes non-deterministic.

---

## 12. RISKS AND OPEN QUESTIONS

| ID | Risk | Severity | Evidence | Mitigation |
|---|---|---|---|---|
| R1 | **A third world is created.** Two are documented, one exists. A DEVWORLD that builds its own fixtures + seeder makes three. | 🔴 Critical | §2 | Extend `server/benchmark/world-*.ts` in place; rename, do not fork. Bind or retire the six-household spec (Q1). |
| R2 | **Determinism is claimed and false.** `autoAnalyzeMeal` fetches live OpenFoodFacts per ingredient (`meal-analysis.ts:285-288`). Same fixture ⇒ different `nutrition` rows. Offline ⇒ no nutrition at all. | 🔴 Critical | F2 | Either narrow the determinism contract in writing to exclude `nutrition`, or pin derivation behind a recorded fixture cache. Do **not** hand-author nutrition — that trades non-determinism for fabrication. |
| R3 | **Silent allergen loss.** `autoAnalyzeMeal` returns without deriving *anything* when `activeAnalysisCount >= 3` (`meal-analysis.ts:257`), when the meal already has valid nutrition (`:275`), or when `sourceUrl` scrapes successfully (`:264-267`). Allergen derivation sits after all three early returns (`:353-375`). A parallel import loses allergens with no error. | 🔴 Critical | §5 step 7 | Import meals **sequentially and awaited**, as the seeder already does (`world-seeder.ts:385`). Better: assert `meal_allergens` non-empty for any meal whose ingredients contain a known allergen keyword, and fail the import if not. |
| R4 | **`meal_allergens` cannot express sesame, mustard or coconut** — three of the ten canonical restriction ids. The sesame-allergy household authors tahini. | 🔴 Critical | F4 | Out of DEVWORLD's ownership: this is a defect in `COMMON_ALLERGENS_LIST`. Name it, do not patch it here. Until fixed, a world file must not rely on `meal_allergens` for a sesame safety trap; the trap must live in `household_eaters.hardRestrictions`. |
| R5 | **Orphan shopping lists.** The world hand-writes `shopping_list` and never writes `ingredient_sources` (`world-seeder.ts:204` is the only reference, in the wipe). Provenance, per-eater context and freezer deduction are all absent. | 🟠 High | F6 | Derive the list (§5 step 10). This is a BENCHINT2-class convergence, and the last one. |
| R6 | **The service layer validates nothing.** `BW06` carries `goalType: "gain"` and planner `mealType: "snack"`, neither producible by any route. | 🟠 High | F3 | The validator (§8.3) is not optional. It must be the gate, and it must run before the first write. |
| R7 | **Pre-seeded conversation history contaminates every downstream turn.** BENCHINT4 §4.1 traced an "ungrounded" answer to a thread that had accumulated 13,044 turns since 2026-07-01. | 🟠 High | `BENCHINT4` §4.1 | `conversations` is `F`. The wipe already deletes them (`world-seeder.ts:248`). Never author them; never leave a thread open across a reset. |
| R8 | **Free-text `hardRestrictions`.** The column has no enum, and the world's own values (`"tree nuts"`) do not match the canon (`tree_nut`). | 🟠 High | §4.1 | Validation rule 18: normalise-and-reject. A restriction that does not map is a safety hole with a friendly name. |
| R9 | **ChatGPT authors a meal whose ingredient strings do not resolve.** Canonical resolution, plant diversity, and allergens all key off free text. `resolveCanonicalFood` returns `UNRESOLVED` rather than throwing. | 🟡 Medium | §3 #17 | Add a *report*, not a gate: after import, emit the percentage of authored ingredients that resolved. A low rate is an authoring defect, not a platform one. |
| R10 | **`meal_categories` ids are insert-order dependent** (`meal-service.ts` hard-codes `BREAKFAST=1, LUNCH=2, DINNER=3`). A world imported into a database seeded in a different order binds to the wrong category. | 🟡 Medium | agent finding, `seed-ready-meals.ts:9-13` | `categoryId` is `F` in §6.6. Do not author it. |
| R11 | **YAML is a new dependency.** `package.json` has none. | 🟢 Low | §2 | Accept — a parser is not a store. Alternatively keep TypeScript fixtures and give ChatGPT the type. See Q3. |

### Open questions (decisions DEVWORLD2 needs, and cannot take alone)

- **Q1 — What happens to the six certification households?** `BENCHMARK_HOUSEHOLDS.md` specifies fixed row ids `9001`–`9006` in a disposable database, a `households.v1.json` that does not exist, and a checksum lock nothing performs. Either (a) implement it as a second `worldMode` over the same importer, (b) bind `deterministic-households` to the ten-household world and retire the fixed-id contract, or (c) delete the spec. **Doing nothing leaves a documented world that does not exist**, which is exactly the condition that made `BENCHINT3`'s artefact untrustworthy.
- **Q2 — Where does the generalised world live?** `server/benchmark/` is a benchmark-specific *location* for a non-benchmark-specific *thing*. `REPOSITORY_CONVENTIONS.md` §2 gives no home for "operational fixture infrastructure". Proposal: `server/world/`, with `server/benchmark/index.ts` re-exporting for one release. This is a rename, and it must be governed.
- **Q3 — YAML or TypeScript?** The existing fixtures are a fully-typed TS literal, which gives ChatGPT the schema for free and gives the compiler the validation for free. YAML gives a non-developer an authoring surface and a diffable artefact, at the cost of a parser and a hand-written validator. **The validator is needed either way** (F3: `tsc` does not check `goalType: "gain"` against a Zod enum in a route). Recommendation: YAML, because the point of the exercise is that a non-repository actor authors worlds — but the decision is the user's.
- **Q4 — Should the world file be able to declare a *cooked* meal without a planner entry?** Today `food_diary_entries.source_planner_entry_id` is nullable, so yes. Confirm that a diary entry with no planner ancestor is a legitimate authored fact (it models "we ate something we never planned"), and that a `fromPlannerMeal` that names an unplanned meal is a reject.
- **Q5 — Does a development world need `dayOffset > 0`?** All present fixtures use `≤ 0`. A future-dated planner is expressed as `week: 2`, not as a positive offset. Confirm that the validator may forbid positive offsets outright.

---

## 13. RECOMMENDED DEVWORLD2 IMPLEMENTATION TASKS

Ordered so that each task's verification is possible before the next begins, and so the riskiest property — that the world is what it says it is — is proven before anything is authored against it.

### Tier 0 — settle ownership before writing code (governance, no code)

| # | Task | Output |
|---|---|---|
| 1 | Decide **Q1** (certification households) and **Q2** (location). | A recorded decision. Without Q1, DEVWORLD2 risks becoming the third world. |
| 2 | Decide **Q3** (YAML vs TS), **Q4**, **Q5**. | Recorded. |
| 3 | Update `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`: three of four contested domains are retired (§2.2); add a Development World row naming `world-fixtures.ts` as SoT. | Register no longer stale. Rule 7. |

### Tier 1 — make the existing world honest (defects, before generalisation)

| # | Task | Why first |
|---|---|---|
| 4 | **Fix the two vocabulary defects in `world-fixtures.ts`**: `BW06.goalType: "gain"` → `build`; `BW06` planner `mealType: "snack"` → `"snacks"`. Bump `BENCHMARK_WORLD_VERSION`. | These are live wrong values in the world every benchmark runs against. R6. |
| 5 | **Narrow the determinism contract** in `BENCHMARK_HOUSEHOLD_WORLD.md` §3 and `world-fixtures.ts`'s header: state that `nutrition` is network-derived and therefore *not* frozen; everything else is. | Stop asserting something false. R2. |
| 6 | **Assert allergen derivation ran.** After `autoAnalyzeMeal`, fail the import if a meal whose ingredients match a `COMMON_ALLERGENS_LIST` keyword has zero `meal_allergens` rows. | Turns R3's silent loss into a loud abort. Cheap; no new concept. |
| 7 | **Record the `meal_allergens` sesame/mustard/coconut gap** as a defect owned by `meal-analysis.ts`, with `BW08` named as the household that would prove it. Do not patch it inside DEVWORLD. | R4. Fixing an allergen keyword list inside a fixture workstream mixes two causes in one change. |

### Tier 2 — converge the last un-converged write path

| # | Task |
|---|---|
| 8 | **Derive the shopping list.** Replace the seeder's `storage.addShoppingListItem` loop with an invocation of the `generate-from-meals` derivation (extract it from `routes.ts:4011` into a service first — it is currently inline route code, which is why the seeder could not call it). Author `shoppingExtras` and `freezer` instead; delete `shopping[]` from the fixture type. Verify `ingredient_sources` rows exist for every list line. |
| 9 | Verify no benchmark score movement is attributable to (8) alone by running once before and once after. Per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`, only on explicit instruction. |

### Tier 3 — the authoring surface

| # | Task |
|---|---|
| 10 | Add the YAML parser dependency (Q3). Define `DevelopmentWorldFile` as the parsed shape — **the same type as today's `BenchmarkHouseholdFixture`, minus `shopping[]`, plus `freezer`, `shoppingExtras`, `weekEaterOverrides`, `plannerEntryEaters`, `generateShoppingList`, and `diaryEntries[].fromPlannerMeal`**. |
| 11 | Implement the **validator** (§8) as a pure module with no database access, returning all violations at once. It reads its vocabularies from the same constants production reads (`ALLOWED_DIET_PATTERNS`, `restriction-library.ts`, the live Capability Registry) — **it must never restate them** (Principle 5). |
| 12 | Write the validator's tests **against the ten existing fixtures**. `BW06` must fail rules 13 and 15 before task 4 lands, and pass after. That is the proof the validator works. |
| 13 | Rename/relocate per Q2: `BenchmarkHouseholdFixture` → `DevelopmentWorldHousehold`, `BENCHMARK_WORLD` → `DEVELOPMENT_WORLD`, `assertBenchmarkWorldAllowed` → `assertDevelopmentWorldAllowed`. Keep `server/benchmark/index.ts` re-exporting the old names for one release (Principle 8: retire on introduction, with a named condition). |
| 14 | Point the importer at a YAML file rather than the TS literal. The seeder's body does not change — this is a change of *input*, not of *import*. |

### Tier 4 — deferred, named so it is not lost

| # | Task | Why deferred |
|---|---|---|
| 15 | Ingredient resolution report (R9). | Diagnostic, not a gate. |
| 16 | Content checksum + version-bump enforcement (validation rule 27). | The discipline is documented and unenforced today; enforcing it is additive. |
| 17 | Planner history, skipped events, favourites. | **Requires schema.** Explicitly out of scope: "use existing production architecture". If the product ever needs them, they are three separate governed workstreams, and `PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md` already marks planner archive **"Deferred Future Capability / 🔴 RED — Do not implement."** |

---

## 14. DEFINITION OF DONE — CHECK

| Requirement (from the mission) | Where |
|---|---|
| Development world entity map | §3 — all 24 mission entities, plus the forbidden set |
| Ownership map | §4, and §4.1 for the one contested ownership |
| Dependency / import order | §5 (Phase 0 global, Phase 1 per household, 13 steps) |
| Authored vs derived field classification | §6 (`A` / `S` / `D` / `F` across nine blocks) |
| Proposed YAML schema | §7 — inputs only; derived keys rejected, not ignored |
| Validation requirements | §8 — 27 rules in six groups |
| Risks and open questions | §12 — 11 risks, 5 open questions |
| Recommended DEVWORLD2 tasks | §13 — 17 tasks in five tiers |
| Rollback protection created and reported | Top of document |
| Discovery only — no importer, no seed data, no production code | §10 |

---

*DEVWORLD1 is discovery. It creates no importer, authors no seed data, and modifies no production code, schema, or migration.*

*Its most consequential finding is that the thing it was asked to design already exists — `server/benchmark/world-fixtures.ts` and `world-seeder.ts`, ten households, imported through production write paths, DEV-guarded and resettable — and that the honest work is not to design it again but to name what it silently gets wrong: a determinism contract that a live network call cannot keep, a vocabulary the service layer never validates, an allergen derivation that cannot spell the allergen its own safety household is built around, and a shopping list that no planner ever produced.*

*Rollback: `git checkout rollback/before-devworld1-development-world-schema-discovery-20260710 -- .`; dirty-tree snapshot `git stash apply 59198ba`. This document is untracked — delete it explicitly.*
