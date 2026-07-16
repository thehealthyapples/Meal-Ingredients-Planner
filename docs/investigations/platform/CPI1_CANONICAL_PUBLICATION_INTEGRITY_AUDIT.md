# CPI1 — Canonical Publication Integrity Audit

**Status:** Investigation only. Read-only. No code, schema, data, seed, or runtime behaviour changed.
**Date:** 2026-07-13
**Branch:** `int1-intelligence-platform` @ `10b418a0`
**Type:** Platform-wide architecture integrity audit. This document discovers; it owns nothing and changes nothing.
**Risk:** 🟢 GREEN (documentation only)

**Rollback protection (created before any work):**

| Item | Value |
|---|---|
| Annotated tag | `rollback/CPI1-canonical-publication-integrity-20260713` → `10b418a0c8503b877de8be00ee8dfb6b801eb30e` |
| Restore committed state | `git reset --hard rollback/CPI1-canonical-publication-integrity-20260713` |
| Database rollback | **None required — zero DB writes.** All DB access was `SELECT` / `\d` only. |

> **The working tree was already dirty when this audit began** — 110 entries (73 modified, 37 untracked; ~3,865 lines across eight uncommitted workstreams: HHP2, HHP3, HNP1, PANTRY1, PLAN2, SHOP1, CBK2, NTC-P2, PDA1). **None of it was authored by this audit and none of it was touched.** Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, a tag protects **committed state only** — it does *not* cover those 110 entries. They were additionally snapshotted outside the repository (working-tree patch + untracked file list) before any investigation began. **The audit reports the working tree as found, because that is the true current state of the platform.**

**Governing documents read (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → `REPOSITORY_CONVENTIONS.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `NK1` / `NK2` → `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` → `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` → `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` → `THA_DECISION_ENGINE_ARCHITECTURE.md` → `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` → `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` → `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` → `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` → `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`.

**Predecessors:** `docs/investigations/knowledge/KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md` and `docs/investigations/knowledge/CANONICAL_FOOD_OWNERSHIP_VERIFICATION.md` (both 2026-07-13), which established the canonical publication pattern for one domain. This audit generalises that verification to the whole platform.

---

## HEADLINE

**THA's canonical *owners* are almost all correct. Its *publication* is almost all unenforced.**

Across 22 domains, the pattern is strikingly consistent: someone chose the right source of truth, wrote a clean seed, and built a single read layer — and then nothing was put in place to guarantee that what runs is what the owner published. **Not one projection in this platform is verified against its owner by any automated gate.** Where a human remembered to re-publish, the projection is perfect. Where a human forgot, it is silently, invisibly wrong — and in six cases the platform is now serving a household something its declared owner never authored.

The audit found **three violations that reach the household**, and they are not abstract:

1. **Every allergen and dietary restriction is dropped from the Companion's household context.** `server/storage.ts:2751` hardcodes `dietRestrictions: []`, and `:2760` derives `unionRestrictions` from that same empty array. 21 users carry live restrictions — `Nuts`, `Dairy`, `Gluten-Free`, `Eggs`, `Soy`, `fish`. The AI never sees one of them. This is the direct product of a dual-ownership split-brain the Source of Truth Register has carried as *"GREEN — low immediate risk"* since June.
2. **The 30-plants counter over-counts.** `routes.ts:11376` dedupes by ingredient slug, not diversity group, so kale and cavolo nero count as two plants when the canonical owner says they are one.
3. **8 of 11 rows in `meal_uplift_applications` cite a rule that does not exist on the server.** `fallback-deterministic-boosts` is minted in `client/src/pages/weekly-planner-page.tsx:337` and appears nowhere in `server/`. Every row is stamped `added_by: 'tha_uplift'`, making a client-invented, never-reviewed suggestion indistinguishable from a human-reviewed engine rule.

And the substrate under all of it cannot rebuild itself: **46 of 92 declared tables (50%) have no reviewed migration** — including `meals`, `users`, `planner_*`, `shopping_list` and `canonical_food`.

The single most useful sentence in this report is not a defect. It is this: **THA's architecture is right and its enforcement is absent.** Nearly every finding below is a gate that was designed, described in prose, and never wired to anything that runs.

---

## 1. What "Canonical Publication" means in THA

Established by the two predecessor investigations, and confirmed as the platform-wide shape:

```
OWNER              PUBLICATION           PROJECTION          RUNTIME
editorial code  →  a single seed     →   DB tables       →   a single read layer
seed in shared/    runner                                     ("the one mouth")
```

Two variants are legitimate and both are in use:

- **Knowledge domains** (Food Knowledge, Preparation, Additives, Product Knowledge) — runtime reads the **projection** through one read layer.
- **Identity domains** (Food Identity, Plant Diversity) — runtime reads the **owner (seed) directly**; the DB table is a published projection that nothing reads.
- **Transactional domains** (Planner, Shopping, Pantry, Household) — the owner *is* a DB table written by the household at runtime. There is no seed. The risks invert: the danger is multiple writers, derived caches that drift, and multiple read paths.

The seven laws under test, per `ARCHITECTURE_PRINCIPLES.md`:
**One entity · One owner · One source of truth · No duplicate ownership · No duplicate runtime identity · No duplicate publication paths · No permanent synchronisation bridges.**

---

## 2. Summary table

| Domain | Canonical Owner | Runtime Reads | Writers | Projection Healthy | Risk |
|---|---|---|---|---|---|
| **Food Identity** | `shared/canonical/foods.ts` (`CANONICAL_SEED`) | the **seed** (0 table reads) | **2** — `seed-canonical-food.ts` + unauthorised `ws011-usda-ingestion.ts:211` | ❌ 53/312 published (17%) | 🟡 |
| **Food Knowledge** | `shared/knowledge/` (`FOOD_SEED`, 610) | `nutrition-knowledge-registry.ts` (one mouth) | 2 (+CI residue fixture) | ⚠️ entities exact; **41 orphan rows live** | 🔴 |
| **Plant Diversity** | `shared/canonical/diversity-groups.ts` (173) | the **seed** (0 table reads) | 1 | ❌ 52/173 published (30%) | 🔴 |
| **Meals** | DB `meals` (via `storage.createMeal()`) | `storage.ts` + 6 direct readers | **4+** — 3 bypass the funnel | ⚠️ provenance NULL on new rows | 🔴 |
| **Cookbook (500)** | `data/cookbook/…500.json` (committed) | `storage.ts` | 1 ✅ | ✅ **verified 8/8** | 🟡 |
| **Meal Templates** | *declared* `seed-meal-shell-templates.ts` | `storage.ts` | **3** — 2 unregistered | ❌ 1,261/1,316 are boot-job stubs | 🔴 |
| **Recipe Sources** | `shared/recipe-acquisition.ts` | `recipe-source-gate.ts` | 1 ✅ | ⚠️ 163 rows under `forbidden` keys | 🟡 |
| **Planner** | DB `planner_weeks/days/entries` | `storage.ts` + **4 assemblers** | 1 ✅ | ⚠️ `meal_plans` dead + boot writer | 🟡 |
| **Household** | **CONTESTED** — `users` vs `user_preferences` vs `household_eaters` | **3 competing strategies** | 1 (+ a self-declared *"Bridge"*) | ❌ **43/94 users unprojected** | 🔴 |
| **Shopping** | DB `shopping_list` | `storage.ts` + 5 others | **2** — `classification-store.ts` bypasses | ✅ | 🟡 |
| **Pantry** | DB `user_pantry_items` | `storage.ts` (one path) ✅ | 1 ✅ | ❌ `activity_summary` **drifted 2/9** | 🔴 |
| **Nutrition — Boost/Uplift** | `server/lib/uplift-rules.ts` (43) | `uplift-engine.ts` | **2** — **client publishes into the DB** | ❌ **8/11 rows cite a phantom rule** | 🔴 |
| **Nutrition — Preparation** | `shared/knowledge/preparations.ts` | `nutrition-knowledge-registry.ts` | 1 ✅ | ✅ exact (39/420/0) — **but unrendered** | 🟡 |
| **Nutrition — Product/UPF/Additives** | `product-analysis.ts` + `upf-analysis-service.ts` | `routing.ts`, `storage.ts` | 1 each ✅ | ⚠️ 2 dead stores; **4 rival vocabularies** | 🟡 |
| **Companion / Notice** | `conversation-gateway.ts` + `notice-gateway.ts` | **one assistant, one state** ✅ | 1 ✅ | ✅ NTC-P2 convergence real | 🟡 |
| **Intelligence Platform** | `intelligence-platform.ts` (singleton) | one `handle()` choke point ✅ | 1 ✅ | ✅ | 🟢 |
| **Capability Registry** | `capability-registry.ts` (25 caps) | the registry ✅ | 1 ✅ | ❌ **`CAPABILITY_DOMAIN` bridge failed**; docs drifted 13/25 | 🔴 |
| **Decision Engine** | `opportunity-delivery/framework.ts` | one enrolment door ✅ | 1 ✅ | ✅ decision never read back | 🟢 |
| **Product Knowledge** | `docs/product/inventory/product.yaml` (154) | `product.json` **only** ✅ (PKR21) | 1 ✅ | ⚠️ `product.json` **current**; prose drifted 7 fields | 🟡 |
| **Benchmarks** | `server/tests/benchmark/history.ts` | admin API | 1 ✅ | ⚠️ stale (2026-07-10); **runtime writes `docs/`** | 🟡 |
| **Community** | — | — | — | — | 🟢 ⬜ |
| **Learning (EL1)** | `evidence-learning-store.ts` | Decision Engine ✅ | 1 ✅ (cleanest in platform) | ❌ 0 confirmed signals; **no replay path** | 🟡 |

---

## 3. Platform Summary

| Measure | Count |
|---|---|
| **Total domains audited** | **22** |
| 🟢 **Healthy** | **3** — Intelligence Platform, Decision Engine, Community |
| 🟡 **Needs Attention** | **11** |
| 🔴 **Architecture Risk** | **8** — Food Knowledge, Plant Diversity, Meals, Meal Templates, Household, Pantry, Nutrition-Uplift, Capability Registry |

**Community is 🟢 by absence, and correctly so.** It has no schema, no routes, no pages — but a *reserved* vocabulary (`shared/recipe-acquisition.ts:34`, `"community_cookbook"  // Defined lane; no runtime feature yet`) with a documented dormancy note. That is exactly how a future domain is pre-empted without creating a phantom owner. It is the cleanest thing in this audit.

---

## 4. Cross-cutting findings

These belong to no single domain, and no single-domain audit would have found them.

### 4.1 🔴 The schema cannot rebuild itself — 50% coverage

Executed, not estimated (`npx tsx scripts/ci/verify-schema-migration-coverage.ts`):

```
Declared in shared/schema.ts .................. 92 tables
Created by a reviewed migration ............... 46 tables
NOT created by any reviewed migration ......... 46 tables
Table-level coverage (UPPER BOUND) ............ 50%
```

The 46 uncovered tables include **`meals`, `users`, `planner_days`, `planner_entries`, `planner_weeks`, `shopping_list`, `meal_templates`, `canonical_food`, `user_preferences`**. They exist only because someone once ran `drizzle-kit push`. Every domain in the table above publishes into a projection whose *table* has no reproducible provenance. `TRUST1-O8` closed the dangerous `push` path and built this verifier — but the gap it measures was never closed, and the tool's own closing line is the warning: *"Columns added declaratively without a migration are NOT detected, so true coverage is no better than the figure above."*

Compounding it: **10 ad-hoc DDL scripts** mutate schema outside `migrations/` — `scripts/apply-*.ts` (×8), `scripts/nk6o-add-family-column.ts`, and `server/scripts/ws011-usda-ingestion.ts:196-199`, which issues `ALTER TABLE canonical_food ADD COLUMN` **at run time**. Its four columns (`tier`, `scientific_name`, `source_ref`, `confidence`) are live in the table and appear in no migration.

### 4.2 🔴 There are two publication mechanisms, and one of them is invisible

The declared mechanism is `npm run seed:*` — explicit, reviewable, operator-invoked. The **undeclared** one is `server/index.ts:117-120`, which runs four writers **on every server boot**:

```ts
await runTemplateMigration()   // :117  — writes meals + meal_templates + meal_plan_entries
await seedReadyMeals()         // :118  — writes meals + meal_categories
await seedFoodKnowledge()      // :119  — writes food_knowledge
await seedPantryKnowledge()    // :120  — writes pantry_ingredient_knowledge
```

None is in the Source of Truth Register as a writer. Two of them write rows they do not own:

- `runTemplateMigration()` is described by the platform's own read-port as *"a ONE-TIME BACKFILL SCRIPT … not a live owner"* (`templates-read-port.ts:14-15`). It is wired into the boot path and has produced **1,162 of 1,316** `meal_templates` rows. It is a permanent `meals → meal_templates` synchronisation bridge.
- `seedReadyMeals()` nulls `image_url` on **all** system meals at boot (`seed-ready-meals.ts:28`) — including the 500 Founding Cookbook rows it does not own. Harmless only because the cookbook has no images yet; the day it gains them, boot wipes them.

### 4.3 🔴 Not one projection is verified against its owner

There is no gate anywhere that asserts *"the published state equals what the owner declares."* The consequences, measured:

| Owner | Declares | DB holds | Delta |
|---|---:|---:|---:|
| `CANONICAL_SEED` | 312 | 53 | **−259** |
| `DIVERSITY_GROUP_SEED` | 173 | 52 | **−121** |
| `canonical_food_alias` | 801 | 143 | **−658** |
| `food_variety` | 68 | 24 | **−44** |

`npm run seed:canonical` has **never been re-run** against this database. Harmless *today* only because runtime reads the seed, not the table — but the Register declares the table part of the source of truth, and it is 17% published.

Worse, two seed runners **cannot** re-publish a correction even if run:
- `run-additives-seed.ts:33` — `ON CONFLICT (name) DO NOTHING`. Fix E924's risk level in the seed and the DB will never learn.
- `seed-food-knowledge.ts:154` — `if (existing.length >= ENTRIES.length) return;` — once 12 rows exist, **every future edit is permanently unpublishable**.

Only `seed-knowledge-registry.ts` has a proper reconcile sweep (`deactivateAbsentRows`, `:304`). It is the sole seed runner whose owner can retire a published row — and it has never been run here either, which is why the **KNOW1 `plant-protein` residue is live in this database right now**: 38 composition rows + 1 nutrient + 2 nutrient-benefit rows that no owner authors and `validateCanonicalSeed()` structurally cannot see.

### 4.4 🟡 The Source of Truth Register — the document that owns ownership — is itself stale

This is the audit's most uncomfortable finding, because the Register is the senior governing rule and its own **Rule 7** requires it be updated at the end of every workspace that changes it.

**What it still says that is no longer true:**
- Phase 3 / Phase 4 / Phase 7 / Appendix B describe four prototype stores as live non-compliance. **All four are deleted**: `nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`, `client/src/lib/dietRules.ts` — zero importers each. Migrations M1–M4 were executed under PKC1/PKC2; `dietRules` now correctly lives in `shared/`. The Register's Phase 5 non-compliance table (`:554-586`) lists nine consumers as **NO**; every one has been fixed.
- Domain 1 says *"188 foods"* (true: 610). Domain 2 says *"239 entries"* (true: 312).
- Domains 4 and 22 say Plant Diversity is *"Contested"*. It is not — M4 resolved it onto canonical.
- Domain 13's seed list is wrong **in both directions**: it names `seed-ready-meals.ts` (which writes **zero** `meal_templates` rows) and omits `template-migration.ts` (which writes **96%** of them).
- Domain 18 says Nutrition Boost Display is contested against `nutrition-benefit-library.ts` — a file that no longer exists. It is silent on the contest that *is* live (`client/src/lib/nutrition-boosts.ts`).
- Domain 19 declares `grocery_products` and `product_additives` authoritative. Both hold **0 rows** and have **zero call sites**. They are dead.
- Phase 4 justifies retaining `food_knowledge` as *"Different domain … not ingredient-level nutrition. Not a duplicate."* **That justification is now false** — 5 of its 12 rows (`lentils`, `oats`, `salmon`, `yoghurt`, `tofu`) collide with `knowledge_foods` on the same slug key space, with a second editorial narrative.
- **Three live, table-owning, runtime-read domains have no row at all**: Benchmarks, Learning (EL1), and Observations (OBS1) — while `evidence-learning-store.ts:6` and `capability-registry.ts:725` both *assert in shipped code* that the tables are "SoT-registered under EL1". They are not.

The Register was last touched 2026-07-12 (PHASE5A), which **appended** Domains 28 and 29 correctly but corrected none of the above. The pattern is exactly the one `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Risk R7 names: *discovery without transfer of ownership.*

**Also stale:** `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md:896-942` still declares *"`docs/product/` does not exist"*, *"no capability registered, no query path built"*, and *"Current Convergence 0%"*. All three are false — 151 files, 154 entries, capability live. The domain's own architecture document is the stale one while the Register is right: a clean inversion of its own Rule PKR15.

### 4.5 🟡 A test fixture that preserves a bug so tests stay green

`scripts/ci/seed-know1-residue.ts` raw-inserts the `plant-protein` defect into the CI database so that `test:know5-evidence-contract` and `test:knowledge-food-ownership` keep passing. Its own header (`:25-29`) admits it: *"THIS SHOULD NOT EXIST FOREVER… the tests assert that a bug is still there."* **The two suites will go red the day anyone actually fixes the defect.** This is a permanent synchronisation bridge whose synchronised artefact is a known bug.

---

## 5. Every discovered issue, grouped by severity

### 🔴 SEVERITY 1 — reaches the household

| # | Issue | Evidence |
|---|---|---|
| S1-1 | **Every dietary restriction is dropped from the AI-facing household context.** `dietRestrictions: []` is hardcoded; `unionRestrictions` derives from it. 21 users carry `Nuts`/`Dairy`/`Gluten-Free`/`Eggs`/`Soy`/`fish`. Consumed by the Companion via `household-read-handler.ts:217`. | `server/storage.ts:2751`, `:2760` |
| S1-2 | **30-plants counter over-counts.** Dedupes by ingredient slug, not diversity group. Kale + cavolo nero = 2 plants; the canonical owner says 1. The comment at `planner-explanation-context.ts:265` asserts the exact opposite of what the counter does. | `server/routes.ts:11376` |
| S1-3 | **A client file publishes into a server-owned projection under a false provenance stamp.** `fallback-deterministic-boosts` exists only in the client; 8/11 `meal_uplift_applications` rows cite it; all stamped `added_by:'tha_uplift'`. The route never validates `ruleId`. The `reviewedAt` review gate is bypassed entirely. | `client/…/weekly-planner-page.tsx:337`, `server/routes.ts:11029-11037` |
| S1-4 | **Every benefit chip renders empty, platform-wide.** 0 of 1,988 composition rows and 0 of 1,366 benefit rows are signed off. Gate executed against the live DB: 39 authored benefits → **0 renderable chips** across 10 sample foods. *(The gate is behaving correctly — this is honest silence, not fabrication. 49 rows already carry citations and are one command from rendering.)* | `shared/knowledge/evidence.ts:92-96` |
| S1-5 | **`activity_summary` is a derived cache with live drift.** Counts pantry **user-scoped**; canonical read is **household-scoped**. 2 of 9 rows wrong — one says the pantry is empty (0) when it holds 128 items. `lifetime_*` are blind increments and can never be re-derived. Feeds live routing. | `server/lib/product-event-logger.ts:112-115` vs `server/storage.ts:2016-2022` |
| S1-6 | **5 registered capabilities are silently unreachable by the Companion.** `CAPABILITY_DOMAIN` (18 ids) is used as a hard gate against a registry of 25. Executed live: `product-knowledge`, `food-intelligence`, `household-health`, `opportunity-delivery`, `evidence-learning` are gated out — killing 6 registry-declared enrichment items and 1 guidance block. | `companion-guidance.ts:75,145`; `companion-enrichment.ts:96` |

### 🔴 SEVERITY 2 — ownership violations, contained today

| # | Issue | Evidence |
|---|---|---|
| S2-1 | **`meals` has three writers that bypass `storage.createMeal()`**, all writing NULL acquisition provenance (columns are nullable, no default). `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §5's "single write funnel" claim is false. | `meal-service.ts:138`, `seed-ready-meals.ts:50`, `openfoodfacts-importer.ts:299` |
| S2-2 | **`preloadStarterMeals` duplicates canonical cookbook recipes into unkeyed user rows.** Its pool (`is_system_meal AND category_id IN (1,2,3)`) now captures **480 of the 500** Founding Cookbook meals. Copies carry no `acquisition_source_key`, so the cookbook's owner cannot reproduce or repair them. | `server/lib/meal-service.ts:60-73,138` |
| S2-3 | **`meal_templates` is 96% shadow projection of `meals`.** A boot job creates one stub template per meal. 1,261 of 1,316 rows carry no shell structure; 3 duplicate template identities already exist. | `server/template-migration.ts:30`, `server/index.ts:117` |
| S2-4 | **Household dietary preference has three owners and three read strategies.** `users` columns vs `user_preferences` vs `household_eaters`, joined by a **self-declared one-way, best-effort "Bridge"**. 43 of 94 users with a diet pattern have no projection of it. | `server/routes.ts:675-696` |
| S2-5 | **`canonical_food` has an unauthorised second writer** doing raw `INSERT` + runtime `ALTER TABLE`. 309 rows the declared owner cannot see; `validateCanonicalSeed()` is DB-blind. `seed-canonical-food.ts` has no reconcile sweep. | `server/scripts/ws011-usda-ingestion.ts:196-199,211` |
| S2-6 | **`docs/product/` is a second, disagreeing publication of the capability list.** Hand-authored, never generated from the runtime registry, no drift guard. Publishes `cap-companion` (not a capability) and omits 13 registered ones. The Companion answers "what can THA do?" from the *stale* list. | `product.yaml` vs `capability-registry.ts` |
| S2-7 | **`shopping_list` has a second writer** — 4 direct `db.update` calls setting 7 canonical review-lifecycle columns, all cast `as any`, fire-and-forget, unserialised against `storage`. | `server/lib/classification-store.ts:67,79,111,121` |
| S2-8 | **`food_knowledge` duplicates `knowledge_foods` on 5 slugs** with a rival editorial narrative — invalidating the Register's stated reason for keeping it. | `server/lib/seed-food-knowledge.ts:102-149` |
| S2-9 | **A rival "is this a plant" owner** using hardcoded `knowledge_foods.category` strings instead of `diversity_group`, rendering *"Contains N plant foods"* on meal detail. | `server/services/meal-food-intelligence.ts:52,152` |

### 🟡 SEVERITY 3 — correctness and reproducibility

| # | Issue | Evidence |
|---|---|---|
| S3-1 | **Live UPF scoring defect.** `ADDITIVE_TYPE_RISK` has 14 keys; the `additives` table has 15 types. `flour treatment agent` (7 additives, incl. **E924 Potassium Bromate**, *"banned in EU"*) falls through to the **lowest** type risk. | `upf-analysis-service.ts:7-22,314,532` |
| S3-2 | **Four rival processing vocabularies** own "what is a processing signal"; `maltodextrin`, `palm oil`, `hydrogenated` appear in two or three independently. A correction to one does not propagate. | `product-analysis.ts:1-33`; `upf-analysis-service.ts:76-128,282-294`; DB `additives` |
| S3-3 | **The client widens the canonical Apple Score gate**, instructing surfaces to use its permissive wrapper *"instead of"* the shared owner's universal invariant. | `client/src/lib/basket-item-classifier.ts:47-56` |
| S3-4 | **Learning has no replay path and 0 confirmed signals.** State is incrementally mutated, accumulated-only; a naive replay would destroy human confirmations (`status`, `confirmedBy`) that have no event log. Signals go stale and never self-correct. Decision Engine reads only `confirmed` → learning currently contributes an empty set. | `evidence-learning/framework.ts:243`; live DB: 384 events, 4 signals, **0 confirmed** |
| S3-5 | **`cookbook-opportunity` is a notice category with no declared scope** (uncommitted CBK2). It reaches households through a category no surface declared itself the mouth for. The guard is a `length === 12` assertion and passes. | `notice-engine.ts:163,374` vs `notice-gateway.ts:122-157` |
| S3-6 | **The runtime writes into `docs/`.** `POST /api/intelligence/benchmark/run` `writeFileSync`s into `docs/intelligence/benchmark/history/` — collapsing the owner→publication boundary, and silently losing writes on an ephemeral filesystem. | `server/routes.ts:8620` → `benchmark/history.ts:71` |
| S3-7 | **Product Knowledge prose front matter is a second act of authorship** (Rule PKR17) and has drifted: 7 field drifts across 3 entries. `cap-meals`/`cap-pantry` prose is v2; `product.json` — the only artefact the Companion reads — still serves v1. `VISIBILITY.md` understates one entry's exposure (says `developer`, owner says `household`). | `docs/product/`, live working tree |
| S3-8 | **163 meal rows persist under source keys the register marks `forbidden` / `unlicensed`** (`bbcgoodfood`, `allrecipes`), laned retroactively by a backfill rather than by an observed user act. | `shared/recipe-acquisition.ts`; live DB |
| S3-9 | **Every registry generator is unenforced.** `build-product-inventory.ts`, `verify-product-inventory.ts`, `build-registry-nav.ts`, `test:companion-benchmark` are in **no** npm script and **no** CI job. Correctness rests on human discipline alone. | `package.json`, `.github/workflows/ci.yml` |
| S3-10 | **Dead projections declared authoritative**: `grocery_products` (0 rows, 0 callers), `product_additives` (0 rows, 0 callers), `meal_plans`/`meal_plan_entries` (dead, but still written by a boot job). | Register `:296`; `template-migration.ts:40` |
| S3-11 | **Preparation Knowledge is architecturally exemplary (7/7 laws) and rendered nowhere.** 420 published links; zero client surfaces consume it. | `grep preparation client/src/**/*.tsx` → 0 |
| S3-12 | **`seedStaticPantryKnowledge` uses `onConflictDoNothing`** — an AI-created row permanently blocks the editorial owner from ever publishing that key. | `server/storage.ts:3443` |

---

## 6. Architecture compliance — platform verdict

| Law | Verdict | Where it breaks |
|---|---|---|
| **One entity** | ⚠️ | Dual food key space (`knowledgeFoodSlug`, now **328 crossings**, up from ~312) — governing-acknowledged debt, enforced not silent. Dietary preference exists as three entities. |
| **One owner** | ❌ | `meals` (4 writers), `canonical_food` (2), `shopping_list` (2), `meal_templates` (3), household diet (3), boost rules (2). |
| **One source of truth** | ⚠️ | Correct at runtime for most domains. Broken for household diet, plant count, and the capability list. |
| **No duplicate ownership** | ❌ | `food_knowledge` ↔ `knowledge_foods` (5 slugs); `meal-food-intelligence.ts` ↔ `plant-classifier`; `nutrition-boosts.ts` ↔ `uplift-rules.ts`. |
| **No duplicate runtime identity** | ❌ | `fallback-deterministic-boosts` (a runtime identity with no owner); starter-copies of cookbook meals; 5 plant counters with 3 dedup keys. |
| **No duplicate publication paths** | ❌ | Boot-time seeders alongside `npm run seed:*`; `docs/product/` alongside the runtime registry; the client publishing into `meal_uplift_applications`. |
| **No permanent synchronisation bridges** | ❌ | `routes.ts:675` (self-declared *"Bridge"*); `template-migration` (`meals`→`meal_templates`, every boot); `CAPABILITY_DOMAIN` (**already failed**); `activity_summary` (**already drifted**); `seed-know1-residue.ts` (**synchronises a bug**). |

**Can THA truthfully state: "Every major domain has a single source of truth, correctly published"?**

## NO.

But the shape of the "no" has changed since the Register asked this question in June. Then, the answer was *"we have parallel stores."* Now the parallel stores are **gone** — M1–M4 were executed, and that is a real and substantial achievement. Today the answer is: **"we have single owners and no way to prove that what runs is what they published."** That is a materially better problem, and a more tractable one.

---

## 7. Recommended next architectural repair

Per the brief, exactly one is recommended. No implementation is authorised by this document.

# → Establish a single canonical owner for Household Dietary Preference, and delete the bridge.

**Why this one, ahead of everything else:**

It is the **only 🔴 where a violated architectural law is currently producing a safety consequence.** Every other finding costs correctness, reproducibility, or trust. This one causes THA's Companion to reason about food for 21 households whose nut, dairy, gluten, egg, soy and fish restrictions it cannot see. `storage.ts:2751` returns `[]` not because the data is missing, but because the read is pointed at the wrong owner — the direct, mechanical consequence of a fact having three owners.

It is also the repair that **discharges the most architectural debt per unit of work.** It is the platform's only *self-declared* permanent synchronisation bridge (`routes.ts:675` — the code calls itself *"Bridge"*), it closes the Register's two longest-standing `Contested` domains (7 and 27), and it retires a violation that `ARCHITECTURE_PRINCIPLES.md` Principle 2 already names by name. The Register's own risk assessment for it — *"Launch Risk: GREEN — low immediate risk, medium future risk"* — has been overtaken by events. **The future risk it anticipated has materialised**, and the Register does not know.

The repair is bounded and does not require choosing a new architecture: the Register's Phase 4 already ruled *"Retain `users.dietPattern`/`users.dietRestrictions` — mark them as the SoT until `user_preferences` is promoted."* If that ruling still stands, the work is to make the code obey a decision that has already been taken.

**Explicitly deferred, and why:**
- *The 50% schema-migration gap* (§4.1) is arguably the deeper structural defect and is the strongest candidate for the repair *after* this one. It is deferred here only because it currently harms no household — it is a disaster-recovery and reproducibility risk, not a live one.
- *The 30-plants over-count and the phantom uplift rule* are Severity-1 but are **defects within a correct ownership model**, not repairs *to* the model. They should be fixed, but they are not architectural repairs.
- *Correcting the Source of Truth Register* (§4.4) is **not** proposed as the next repair, despite being pervasive. A stale register misleads a reader; a broken ownership model misleads the Companion. But it must be corrected **as part of** the repair above — Register Rule 7 requires exactly that, and the correction of Domains 7 and 27 is the natural close of this work.

---

## 8. Method

- Architecture Bootstrap first (`docs/architecture/README.md`), per `ENGINEERING_WORKFLOW.md` STEP 2.
- Rollback protection created before any investigation; pre-existing dirty tree snapshotted outside the repository and left untouched.
- Six parallel domain traces across `server/`, `client/`, `shared/`, `scripts/`, `migrations/`, each enumerating: canonical owner, every writer, every publication path, every runtime read path, projection integrity, and compliance against the seven laws.
- **Live database interrogated with `SELECT` only** — every count in this document was executed, not estimated. No `INSERT`/`UPDATE`/`DELETE`/`ALTER`/`DROP`, and no seed runner was invoked.
- Two read-only verifiers executed after confirming they perform no writes: `scripts/ci/verify-schema-migration-coverage.ts` and `scripts/ci/verify-cookbook-seed.ts` (8/8 pass).
- The live evidence gate (`isEvidenceBackedClaim`) and the live capability registry (`intelligencePlatform.listCapabilities()`) were **executed against the running system** to confirm the benefit-chip and `CAPABILITY_DOMAIN` findings rather than infer them.
- Every 🔴 finding was independently re-verified at source by the audit lead before being recorded.

**No code, schema, data, seed, or document outside this file was modified.**

---

## 9. Definition of Done

| Requirement | Status |
|---|---|
| Rollback identifier reported | ✅ `rollback/CPI1-canonical-publication-integrity-20260713` → `10b418a0` |
| Every major domain verified for canonical ownership | ✅ 22 domains |
| …for publication | ✅ |
| …for runtime consumption | ✅ |
| …for projection integrity | ✅ (live DB counts) |
| …for writer integrity | ✅ (full writer census per domain) |
| Summary table produced | ✅ §2 |
| Every domain classified | ✅ 3 🟢 · 11 🟡 · 8 🔴 |
| All issues listed by severity | ✅ §5 — 6 Severity-1, 9 Severity-2, 12 Severity-3 |
| Next architectural repair recommended (one only) | ✅ §7 |
| No implementation recommended | ✅ |

---

**CANONICAL PUBLICATION VERDICT — THA's owners are sound; its publication is unverified. 22 domains audited: 3 healthy, 11 need attention, 8 carry architecture risk. Not one projection in the platform is checked against its owner by any automated gate, and in six places the platform now serves the household something its declared owner never authored.**

**RECOMMENDED NEXT ARCHITECTURAL REPAIR — Establish a single canonical owner for Household Dietary Preference and delete the `routes.ts:675` bridge; it is the only violated law currently producing a safety consequence, and it closes the Source of Truth Register's two longest-standing Contested domains.**
