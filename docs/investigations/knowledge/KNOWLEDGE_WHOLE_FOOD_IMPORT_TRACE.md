# Whole Food Knowledge Import — End-to-End Trace

**Status:** Investigation only. Read-only. No code, schema, data, or runtime behaviour changed.
**Date:** 2026-07-13
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN (documentation only; read-only `SELECT`s against the database this workspace is configured against)
**Rollback protection:** `rollback/KNOW-wholefood-import-trace-20260713` → `10b418a0c8503b877de8be00ee8dfb6b801eb30e`
**Governing documents read:** `docs/architecture/README.md` (bootstrap), `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`
**Predecessors:** NK6J → NK6N → NK6O → NK6P → NK6Q → KNOW1 → KNOW2 → KNOW3 → KNOW4 → KNOW5

---

## ROOT FINDING

**The 300+ Whole Food import is not missing. It was imported, it is live, and it is already being served to users.**

346 foods sourced `NK6 canonical food draft` sit in `knowledge_foods` today, every one of them `is_active = true`, carrying 1,031 nutrient rows and 346 foods' worth of benefit rows. They are returned right now by every `/api/knowledge/*` surface — the Pantry Explore grid, search, category chips, food detail modal, Plant Diversity Explorer and Meal Uplift panel. Nothing about this data is lost, quarantined, or awaiting an importer.

What is missing is **not the data but its two promotions**, and they fail in two different places for two different reasons:

1. **Every health claim in the platform is dark** — for all 610 foods, not just the 346. `KNOW5` (2026-07-09) switched on an evidence gate requiring a cited *and* human-signed-off composition premise before a benefit chip renders. **0 of 1,988 `knowledge_food_nutrients` rows have `reviewed_at` set.** The chain therefore fails at its first edge for every food in the database.
2. **338 of the 346 foods are invisible on the canonical surfaces** — the food detail page, Connected Food, and all pantry-intelligence surfaces. Not because of a database gate: **no runtime read path queries the `canonical_food` table at all.** Those surfaces resolve against `CANONICAL_SEED`, a hand-authored TypeScript array in `shared/canonical/foods.ts`, which was never extended to cover the imported foods.

**None of this data is in Knowledge Review, and none of it ever can be.** The Knowledge Review Workbench holds 24 rows — all vocabulary terms (12 nutrient, 12 benefit). It has no food review path: its only canonical write is an alias row in `knowledge_vocabulary_aliases`. It cannot review, sign off, or publish a food, a claim, or an entity. The workstream that would carry this import through review — KNOW6 — has never been opened.

## PRIMARY BOTTLENECK

**Composition-edge sign-off. `knowledge_food_nutrients.reviewed_at` is set on 0 of 1,988 rows.**

`isEvidenceBackedClaim` (`shared/knowledge/evidence.ts:92`) admits a claim only if `reviewedAt IS NOT NULL` **and** `sourceRefs` holds at least one structurally valid, Layer-1-trusted-domain reference. `deriveEvidenceConfidence` (`evidence.ts:211`) requires the food→nutrient **and** nutrient→benefit edges to pass independently, weakest link governing; anything short of that is `under-review`, and `under-review` is the one non-renderable state (`isRenderableConfidence`, `evidence.ts:140`).

| Edge | Rows | Cited | **Signed off** | Passes gate |
|---|---:|---:|---:|---:|
| `knowledge_food_nutrients` (composition) | 1,988 | 49 | **0** | **0** |
| `knowledge_food_benefits` | 1,366 | 0 | **0** | **0** |
| `knowledge_nutrient_benefits` (Layer 2) | 70 | 70 | 21 | 21 |
| `knowledge_preparation_effects` | 0 | 0 | 0 | 0 |

The composition edge is the load-bearing one and it is entirely unsigned. **Foods with ≥1 renderable benefit chip today: 0.** The Layer-2 work (21 signed-off nutrient→benefit claims) is stranded behind an edge that nothing has ever signed.

The bottleneck is not capacity and not an importer. It is that **the only tool that writes `reviewed_at` — `server/seeds/signoff-knowledge-claims.ts` — has only ever been run against `knowledge_nutrient_benefits`**, and the citations that would let it run against composition **do not exist**: not one of the 700 draft YAMLs contains a single `source_ref` (`grep -rl "source_refs\|source_url" docs/knowledge/canonical-foods/drafts/` → 0 files).

---

## 1. Source files, import batches, scripts and reports

### 1.1 The authored corpus

**Root:** `docs/knowledge/canonical-foods/drafts/`. YAML, one food per file, `record.schema: tha_canonical_food_draft`, `schema_version: 2.0-draft`, `authored_by: ChatGPT for The Healthy Apples`.

| Measure | Count |
|---|---:|
| Batch directories | 23 (`batch-001` … `batch-023`), **30 food YAMLs each** |
| Batch food records | 690 |
| Loose pilot drafts at `drafts/` root | 10 (`blueberries`, `broccoli`, `chickpeas`, `eggs`, `extra-virgin-olive-oil`, `greek-yoghurt`, `lentils`, `oats`, `salmon`, `spinach`) |
| Food-record YAML files | **700** |
| **Distinct `canonical_slug` values** | **690** |
| Duplicated slugs | 10 (7 cross-batch, documented in NK6P §9.2; 3 pilot-vs-batch — `chickpeas`, `greek-yoghurt`, `lentils` — documented nowhere) |

Two properties of this corpus decide everything downstream:

- **No evidence.** Zero source refs, zero source URLs, in any of the 700 files. The v2.0-draft schema has no evidence fields at all. This directly contradicts `NK5_CANONICAL_FOOD_AUTHORING_FORMAT.md:683`, which makes `source_refs`, `reviewed_at` and `reviewer_role` **required**.
- **No numbers.** All 690 batch drafts carry `quantitative_values_status: do_not_import_numeric_values_until_validated`. The drafts assert *which nutrients a food is known for*, never *how much*.

### 1.2 The import reports

| Report | Batches | Imported | Held / blocked |
|---|---|---:|---|
| `NK6J_CANONICAL_FOOD_BATCH_001_002_IMPORT_PLAN.md` | 001–002 | **0** — *"No import performed. No `--force-upsert`."* (`:6`) | 8 safe-new held at a guardrail STOP (`:91`); all 60 drafts never imported |
| `NK6N_BATCHS_003_TO_006_IMPORT_REPORT.md` | 003–006 | **46** (`:108`) | 42 existing, 24 merge, 8 editorial |
| `NK6O_BATCH_006_NUTRIENT_REPAIR.md` | — | repair only (+1 editorial reconcile) | — |
| `NK6P_BATCHES_007_TO_023_IMPORT_REPORT.md` | 007–023 | **299** (`:15`) | 117 existing, 90 merge, 2 editorial, 2 blocked |
| **Cumulative** | | **345** | |

NK6P's own DB deltas (`:44-48`): `knowledge_foods` 312 → 611 (+299); `knowledge_food_nutrients` 1084 → 1988 (+904); `knowledge_food_benefits` 798 → 1366 (+568).

**"300+" is the 299 of NK6P**, or a rounding of the 345/346 cumulative. No document in the repo uses the phrase "300+ Whole Food"; it is not the size of the authored corpus (690).

NK6N admits a silent failure (`:123`): 11 Batch-006 legumes *"imported identity + benefits, but with ZERO nutrient relationships"* — an all-or-nothing INSERT hit a missing-FK error and dropped every nutrient binding, *"The importer swallows this as a warning and still reports the food as 'successful'."*

### 1.3 The scripts — and the fact that the importer no longer exists

The importer that performed NK6N and NK6P (`server/lib/canonical-foods-importer.ts`, `server/cli/import-canonical-foods.ts`, npm script `import:canonical-foods`) was **deleted from the tree** by commit `17f1afd3` *"KNOW2 — Unify canonical food knowledge ownership"*. It had been a second writer of `knowledge_foods`, a table the Source of Truth Register assigns to `shared/knowledge/foods.ts`. **The NK6N/NK6P import path is not reproducible on the current tree.**

The current, post-KNOW2 pipeline (`canonical-foods-gate.ts:20-23`):

```
1 CANDIDATE   docs/knowledge/canonical-foods/drafts/*.yaml     (AI-authored)
2 GATED       server/lib/canonical-foods-gate.ts               (writes nothing)
3 PROMOTED    a human commits the emitted record into shared/knowledge/
4 PUBLISHED   server/seeds/seed-knowledge-registry.ts          (the one writer)
```

| File | npm script | Writes |
|---|---|---|
| `server/lib/canonical-foods-gate.ts` | — | **nothing.** Identity reconciliation, vocab resolution, MVF check, anti-fork. Outcomes: `promote \| existing \| blocked \| invalid` |
| `server/cli/graduate-canonical-foods.ts` | `knowledge:graduate` | **nothing to DB.** Emits TypeScript for a human to paste |
| `scripts/know2-graduate-imported-foods.ts` | — | one-time; generated `shared/knowledge/graduated-foods.ts` (346 records) + `graduated-relationships.ts` |
| `server/seeds/seed-knowledge-registry.ts` | `seed:knowledge` | **sole DB writer** of `knowledge_*`. Upsert-only; writes `sourceRefs`, **never `reviewedAt`** |
| `server/seeds/signoff-knowledge-claims.ts` | `knowledge:signoff` | **the only thing that ever sets `reviewed_at`.** Run to date against `knowledge_nutrient_benefits` only |
| `server/seeds/seed-canonical-food.ts` | — | `canonical_food` table — **which nothing reads** |

---

## 2. How many foods were imported, and where they are now

**Live database, verified:**

```
knowledge_foods                610      ← the food knowledge store
  ├─ NK6 canonical food draft  346      ← THE WHOLE FOOD IMPORT. all is_active = true
  ├─ THA editorial             187
  └─ USDA FDC / WS0X.2 H1       77
knowledge_food_nutrients     1,988      (NK6 share: 1,031)
knowledge_food_benefits      1,366
knowledge_food_preparations    420      (214 foods)

canonical_food                 362      ← READ BY NO RUNTIME CODE PATH
  ├─ active / canonical         53      (THA editorial)
  └─ draft  / catalogue        309      (USDA FDC WS0.11 pilot — a separate, unrelated import)

knowledge_review_queue          24      ← vocabulary only (12 nutrient, 12 benefit). ZERO foods
knowledge_review_batches         1      ← source_filename = "test-alice.json". a test artefact
knowledge_review_decisions       0
knowledge_releases               0      ← nothing has EVER been published through the release path
```

`FOOD_SEED` = `EDITORIAL_FOOD_SEED` (264) + `GRADUATED_FOOD_SEED` (346) = **610**, matching `knowledge_foods` exactly. The knowledge half of the pipeline is coherent and complete: KNOW2 *did* run, the 346 foods *are* owned by the declared source of truth, and `npm run seed:knowledge` reproduces the whole table.

### 2.1 The two gates, and which one the foods fail

There are two gates and neither is the `canonical_food` table.

| Gate | Implemented by | Effect on the 346 |
|---|---|---|
| **Knowledge visibility** — `is_active = true` | `nutrition-knowledge-registry.ts:62-70` (`listFoods`). No `source`, no `status`, no `tier`, no join to `canonical_food` | **PASS.** All 346 are served |
| **Evidence** — `reviewedAt` + valid `sourceRef` | `evidence.ts:92`, enforced in `getFoodBenefitsForDisplay` (`registry:255-280`) | **FAIL — as do all 610.** Zero benefit chips render |
| **Canonical identity** — slug ∈ `CANONICAL_SEED` (a *code array*, not a table) | `shared/canonical/foods.ts:49`; `resolver.ts:157`; `food-report-adapter.ts:141` returns `null` off-seed | **FAIL for 338 of 346** (8 are in the seed) |

### 2.2 Per-surface: what a user sees today

| Surface | Endpoint | Reads | Shows the 346? |
|---|---|---|---|
| Pantry Explore grid | `/api/knowledge/foods` | `knowledge_foods`, `is_active` | **YES** |
| Pantry Explore search / categories | `/api/knowledge/search`, `/categories` | `knowledge_foods`, `is_active` | **YES** |
| Pantry Explore food detail modal | `/api/knowledge/foods/:slug` | `knowledge_foods` + nutrients | **YES** — name, category, nutrients. **Zero benefit chips** |
| Plant Diversity Explorer | `POST /api/knowledge/ingredient-lookup` | `knowledge_foods` name/slug/alias | **YES** |
| Meal Uplift panel | `POST /api/knowledge/ingredient-lookup` | `knowledge_foods` | **YES** |
| Nutrient / Benefit detail pages | `/api/knowledge/nutrients\|benefits/:slug` | `knowledge_foods` via link tables | **YES** |
| **Food detail page** `/foods/:slug` | `/api/foods/:slug/intelligence` | **`CANONICAL_SEED` (code)** | **NO** — 404 for 338 of them |
| **Connected Food panel** | `/api/foods/:slug/connected` | **`CANONICAL_SEED` (code)** | **NO** |
| **Pantry Intelligence / search-index** | `/api/pantry/intelligence`, `/search-index` | `resolveCanonicalFood` → `CANONICAL_SEED` | **NO** |
| Pantry discover / alternatives / seasonal | `/api/pantry/*` | code seeds | **NO** |

This is the shape of the reported symptom. A household browsing Pantry Explore sees the imported foods — stripped of every health claim. A household opening a food's page gets a 404 for 338 of them. Both are true at once, which is why the import reads as "missing" from some surfaces and "there but empty" on others.

---

## 3. Knowledge Review queue audit

**The 300+ food import is not sitting in the Knowledge Review queue, and it structurally cannot be.**

| State | Count |
|---|---:|
| Pending (`unresolved`) | **24** — 12 `nutrient`, 12 `benefit`. All `review_type = 'vocabulary'` |
| In review / proposed | 0 |
| Approved | 0 |
| Rejected | 0 |
| Awaiting citation | **n/a — no such state exists** |
| Awaiting sign-off | **n/a — no such state exists** |
| Awaiting publication | 0 |
| Published | **0** (`knowledge_releases` is empty) |
| **Foods in the queue** | **0** |

The Workbench (`knowledge_review_queue` → `knowledge_review_decisions` → `knowledge_releases` / `knowledge_rollback_points`) is a **vocabulary-alias pipeline**. Its state machine is complete and correct — `unresolved → in_review → proposed → approved → published | handed_off | rejected | deferred`, with soft-delete rollback and an append-only audit — but `publishApprovedDecisions()` (`knowledge-review-store.ts:1529`) has exactly one canonical write: an `INSERT` into `knowledge_vocabulary_aliases`. A `new_identity` decision **never mints an entity**; it emits a hand-off artefact and sets the term to `handed_off` (`:1651`), to be resolved by a human editing TypeScript.

The single `knowledge_review_batches` row is `source_filename = 'test-alice.json'` — a test artefact from 2026-07-07. The workbench has never processed real content.

**The consequence, stated plainly:** the review → citation → sign-off → publication path a reader would assume exists — where the queue approves a claim and publishing makes it live — **does not exist for foods or claims.** The two halves of the platform are joined only by a human hand: the workbench hands off an artefact, a person edits TypeScript, `seed:knowledge` writes the row with `reviewed_at = NULL`, and only `signoff-knowledge-claims.ts` — a separate CLI with no queue, no audit row, no per-claim reject, and an approve-all-valid sweep — flips the bit that makes it visible. `signoff-knowledge-claims.ts:29-33` says this out loud and names the required fix: sign-off *"must be routed through the existing `knowledge_review_decisions` state machine before any large import."*

---

## 4. Three foods traced end-to-end

### 4.1 `rhubarb` — imported, live, claim-dark, page-invisible

| Stage | State |
|---|---|
| Source | `docs/knowledge/canonical-foods/drafts/batch-003-core-everyday-fruit/rhubarb.yaml` |
| Gate | `promote` — cleared NK6P |
| Knowledge | ✅ `knowledge_foods`: `rhubarb`, category `fruit`, `source = NK6 canonical food draft`, `is_active = true`. 2 nutrients, 2 benefits |
| Citations | ❌ 0 source refs |
| Sign-off | ❌ `reviewed_at` NULL on every edge |
| Knowledge Review | ⬜ not present — no food ever enters the queue |
| Canonical identity | ❌ **no `canonical_food` row, and not in `CANONICAL_SEED`** |
| Renders | Pantry Explore: **name + category + 2 nutrients**. Benefit chips: **0**. `/foods/rhubarb`: **404** |

### 4.2 `lentils` — the smoking gun: both halves exist, the link is NULL

| Stage | State |
|---|---|
| Source | `drafts/lentils.yaml` (pilot) **and** `batch-006-legumes...` — one of the 3 undocumented duplicate slugs |
| Knowledge | ✅ `knowledge_foods`: `lentils`, `source = NK6 canonical food draft`, `is_active = true`. 4 nutrients, 2 benefits |
| Canonical identity | ✅ **`canonical_food` id 72 — `active` / `canonical` / `THA editorial` / `diversity_group = lentils`** |
| **The link** | ❌ **`canonical_food.knowledge_food_slug` IS NULL** |
| Citations / sign-off | ❌ none |
| Renders | Pantry Explore: yes, nutrients, **0 benefit chips**. Canonical surfaces resolve `lentils` — and find no knowledge behind it |

`lentils` is the clearest possible statement of the defect. The canonical identity exists. The knowledge exists. They share a slug. **The foreign key between them was never written** — and even if it were, no runtime code would read it, because the canonical surfaces resolve against the code array, not the table. It is one of the 9 `active`/`canonical` rows carrying no knowledge link (44 of 362 do; 12%).

### 4.3 `grapefruit` — imported, live, claim-dark, page-invisible

| Stage | State |
|---|---|
| Source | `batch-004-citrus-berries-stone-fruit/grapefruit.yaml` |
| Knowledge | ✅ `knowledge_foods`: `grapefruit`, category `citrus_fruit`, NK6, `is_active = true`. 3 nutrients, 2 benefits |
| Citations / sign-off | ❌ none |
| Knowledge Review | ⬜ not present |
| Canonical identity | ❌ no `canonical_food` row, not in `CANONICAL_SEED` |
| Renders | Pantry Explore: name + category + 3 nutrients. Benefit chips: **0**. `/foods/grapefruit`: **404** |

All three foods tell the same story: **the knowledge arrived; the evidence and the identity never followed.**

---

## 5. Expected vs actual, reconciled at every stage

| Stage | Expected | Actual | Δ | Where the loss occurs |
|---|---:|---:|---:|---|
| Authored drafts (distinct slugs) | 690 | 690 | 0 | — |
| Drafts carrying a citation | 690 | **0** | **−690** | v2.0-draft schema has no evidence fields (contradicts `NK5:683`) |
| Drafts carrying numeric nutrition | 690 | **0** | **−690** | `do_not_import_numeric_values_until_validated` |
| Reached a store (per import reports) | 690 | 345 | −345 | Batches 001–002 never imported (60); 233 held as existing/merge/editorial; 2 blocked |
| **In `knowledge_foods` as NK6** | 345 | **346** | **+1** | 345 vs 346 unexplained by any report (KNOW5 measured the same gap) |
| Drafts never reaching any store | — | **139** | | of which **83** correctly resolve to an existing food via alias/plural, and **56 are genuinely absent** |
| Promoted to `GRADUATED_FOOD_SEED` | 346 | 346 | 0 | KNOW2 complete — the seed reproduces the table |
| In Knowledge Review | — | **0** | | the workbench has no food path |
| Composition edges cited | 1,988 | **49** | **−1,939** | 3 of the 49 are on NK6 foods |
| **Composition edges signed off** | 1,988 | **0** | **−1,988** | ⛔ **THE BOTTLENECK** |
| Published (seeded + active) | 610 | **610** | 0 | knowledge entities are live |
| **Foods rendering ≥1 benefit chip** | 610 | **0** | **−610** | evidence chain fails at edge 1 for every food |
| NK6 foods in `CANONICAL_SEED` | 346 | **8** | **−338** | canonical bridge never authored |
| `canonical_food` ↔ knowledge links | 362 | **44 (12%)** | −318 | and the table is read by nothing anyway |

---

## 6. Status verdicts

### DATA IMPORTED — ✅ **YES, and more completely than assumed**

346 foods live in `knowledge_foods`, `source = 'NK6 canonical food draft'`, all `is_active`, all owned by the declared source of truth (`GRADUATED_FOOD_SEED`), carrying 1,031 composition rows and benefits on every one. 139 draft slugs never reached a store — but **83 of those were correctly refused by the gate as aliases of foods THA already has**, leaving **56 genuine absences**. The import is ~95% of the reachable corpus, not a failure.

### DATA IN KNOWLEDGE REVIEW — ❌ **NO. Zero. And it cannot be.**

The queue holds 24 vocabulary terms. Not one food, claim, or entity has ever entered it, and the workbench has no code path that would let one. `knowledge_review_decisions` = 0. The single batch row is a test file. **The import is not stuck in review — review was never a stage it could reach.**

### DATA PUBLISHED — ⚠️ **AS ENTITIES, YES. AS CLAIMS, NO.**

The 610 food entities are seeded, active, and served. But `knowledge_releases` = 0: nothing has ever been published through the release/rollback mechanism. And **0 of 1,988 composition claims pass the evidence gate**, so no health claim in the platform is published in the sense the architecture means.

### DATA RENDERABLE — ⚠️ **PARTIALLY, AND THE VALUABLE HALF IS DARK**

- **Renders now:** all 346 foods, with name, category and nutrients, on every `/api/knowledge/*` surface — Pantry Explore grid, search, categories, detail modal, Plant Diversity Explorer, Meal Uplift.
- **Does not render:** **every benefit chip on every food in the platform (0 of 610).** The composition edge is unsigned, so `deriveEvidenceConfidence` returns `under-review` universally.
- **Does not render:** 338 of the 346 on the food detail page, Connected Food, and all pantry-intelligence surfaces — `CANONICAL_SEED` (a hand-authored code array) does not contain them.

---

## 7. Recommended recovery approach

# → **A. PROMOTE EXISTING KNOWLEDGE**

**Not B, and emphatically not C.**

**Why not C (re-import).** There is nothing meaningful to re-import. 346 of the 690 drafts are already live; 83 of the 139 that never landed were *correctly rejected* by the gate's anti-fork rule as aliases of foods THA already holds. Only 56 foods are genuinely absent — a tail, not the missing 300. Re-importing would also mean rebuilding an importer that KNOW2 deliberately deleted for being an unauthorised second writer, and re-running it would add ~900 more uncited AI-drafted composition premises to a corpus that already cannot cite the ones it has. **C solves a problem that does not exist and worsens one that does.**

**Why not B (repair the pipeline).** The pipeline is not broken. It is *working*, and what looks like breakage is the gate doing its job: KNOW5 closed the evidence hole deliberately, and the chips went dark exactly as designed and as approved. `canonical-foods-gate.ts` correctly refuses to fork identities. `seed-knowledge-registry.ts` correctly refuses to sign off what it seeds. The one component that is genuinely inadequate — `signoff-knowledge-claims.ts`, an approve-all-valid sweep with no reviewer identity and no per-claim reject — is inadequate *for scale*, and its own header says so. Repairing it is a precondition of promotion, not an alternative to it.

**Why A.** The data is imported, gated, owned and live. What is missing is its promotion, and promotion splits cleanly into two moves of very different risk:

**A1 — Promote the identities (safe, unblocked, high leverage).**
Author the 338 missing NK6 foods into `CANONICAL_SEED` (`shared/canonical/foods.ts`) with `knowledgeFoodSlug` pointing at the existing NK6 slug. This is the single highest-value action available: it turns 338 foods from 404s into working food pages, and makes them reachable by pantry intelligence, meal intelligence, seasonality and explainability. **It asserts no health claim, requires no citation, and is not blocked by KNOW5's hard stop** — an identity is not a claim. `resolveKnowledgeBinding()` and `validateCanonicalSeed()` (built by KNOW3) already enforce correctness on exactly this edge. Note that writing rows into the `canonical_food` *table* would achieve nothing — nothing reads it; the code seed is the real gate, and the table's 12%-connected `knowledge_food_slug` column should be recognised as the dead metric it is.

**A2 — Promote the claims (blocked, and must stay blocked until sourced).**
Do **not** unblock benefit chips by signing off what exists. The composition premises are AI-drafted and uncited; signing them would put NHS and EFSA badges on 1,988 unreviewed assertions, and KNOW5 already identified 32 rendering chips that were demonstrably false on exactly this mechanism (`plain-wheat-flour → fibre → gut-health`, cited to the NHS). The correct route is the one KNOW5 named and never got: **ingest composition from USDA FDC / gov.uk CoFID (KNOW5E)** so a composition claim cites a table rather than a language model, then route sign-off through `knowledge_review_decisions` rather than the CLI rubber stamp. Until then, the darkness is the honest state and is the correct behaviour.

**Sequence:** A1 immediately — it is reversible, claim-free, and recovers the visible bulk of the import. A2 as the KNOW5E/KNOW6 workstream, under the TRUST AND CLAIMS approval KNOW5 already flagged (`KNOW5:342`).

---

## 8. Corrections to prior investigations

Two claims in the record are wrong and should not be built on:

1. **`KNOW5:228` — *"THA's knowledge base contains 346 AI-drafted foods and does not contain `apple`, `banana` or `carrot`."*** This is **false**. `knowledge_foods` holds `apples`, `bananas`, `carrots`, `tomatoes` and `chicken`, all `THA editorial`. The draft slugs `apple`/`banana`/`carrot` were **correctly blocked by the gate's anti-fork rule (GOV2 Rule 7)** as singular aliases of existing plural identities. The gate was right; the investigation misread a success as a failure. Of the 139 un-imported slugs, **83 resolve to a food THA already has; 56 are genuine absences.** The headline should have been 56, not 139.

2. **The `canonical_food` table is widely treated as the canonical gate.** It is not read by any runtime path. `shared/canonical/foods.ts:49` (`CANONICAL_SEED`) is the real gate. The table's 53-active/309-draft split and its 12% `knowledge_food_slug` connectivity are inert, and any remediation aimed at the table would have no user-visible effect. `server/seeds/seed-canonical-food.ts` has also not been re-run against this database: the code declares ~312 canonical foods, the table holds 53.

Also worth carrying forward: `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 1 still states *"Foods covered: 188 foods"*. The true figure is **610**.

---

## 9. Method

- Architecture bootstrap per `ENGINEERING_WORKFLOW.md` STEP 2 (`docs/architecture/README.md` first).
- Rollback protection created before any work: `rollback/KNOW-wholefood-import-trace-20260713` → `10b418a0`.
- Static analysis of `docs/knowledge/canonical-foods/drafts/`, `shared/knowledge/`, `shared/canonical/`, `server/seeds/`, `server/services/nutrition-knowledge-registry.ts`, `server/lib/canonical-foods-gate.ts`, `server/lib/knowledge-review-store.ts`, `server/routes.ts`, `scripts/`, and the client surfaces.
- **Read-only `SELECT`s only** against the database this workspace is configured against (`DATABASE_URL`). No writes, no DDL. Whether that database is production or a development instance was **not established** — row counts are true of *that* database; the structural findings hold for any database seeded by this repo.
- Slug-level reconciliation of the 690 draft `canonical_slug` values against `knowledge_foods.slug`, `knowledge_foods.aliases[]`, `canonical_food_alias.alias_key`, and `CANONICAL_SEED`.
- Evidence gate reproduced in SQL from `isEvidenceBackedClaim` / `deriveEvidenceConfidence` (`shared/knowledge/evidence.ts:92,140,211`).

**No code, schema, data, seed, draft, or database row was modified by this investigation.**
