# WS1–WS6 Foundation Completion Audit

> **Are the foundations ready to carry WS7–WS11?**
>
> Investigation only. No implementation. No schema changes. No UI changes. No DB changes.
> Reads existing data: **YES**. Writes new data: **NO**. Changes meaning of existing data: **NO**. Requires backfill: **NO**.

| | |
|---|---|
| **Document type** | Foundation completion audit (no implementation) |
| **Date** | 2026-06-20 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Rollback tag** | `rollback/pre-ws1-ws6-audit-20260620` → commit `fdeb3a5` |
| **Restore command** | `git reset --hard rollback/pre-ws1-ws6-audit-20260620` |
| **Predecessor investigations (read for dependency mapping)** | WS7 · WS8 · WS9 · WS10 · WS11 (all architecturally complete, none implemented) |

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed clean** before work began. The working tree carried exactly one untracked
   file: the completed **WS11 investigation** (`WS11_SEASONAL_STORIES.md`) — present on disk but **not yet
   in git history (unprotected)**.
2. ✅ **WS7–WS11 investigations protected.** WS7, WS8, WS9, WS10 were already committed
   (`ea90557`, `cd4ef75`, `17dee8e`, `5e4cb83`). The unprotected **WS11** was committed →
   `fdeb3a5` (`docs(ws11): preserve Seasonal Stories investigation`) before any audit work began. All five
   are now `git ls-files`-tracked.
3. ✅ **Rollback tag created:** `rollback/pre-ws1-ws6-audit-20260620` → commit `fdeb3a5`.
4. ✅ **Rollback identifier reported:** `rollback/pre-ws1-ws6-audit-20260620`
   (restore: `git reset --hard rollback/pre-ws1-ws6-audit-20260620`).

No audit work began until the above was confirmed and reported. **This audit makes no code, schema, route,
UI, migration, or data change.** It produces exactly two artefacts: this markdown file and one git tag.

---

## AUDIT METHODOLOGY

This audit triangulates **three independent evidence sources** rather than trusting any single one:

1. **Live database** (`psql $DATABASE_URL`) — actual row counts and fill rates of the foundation tables.
   This is the only source that cannot be flattered by a design doc. It catches the gap between "a table
   exists" and "a table is populated enough to launch on".
2. **Source code** (`shared/`, `server/`, `client/`) — what is actually wired and consumed in production
   vs. what merely exists as a definition. Verified by `grep` for real import/consumer paths, not by
   reading status claims.
3. **The WS implementation/investigation docs** (`docs/investigations/WS*.md`) — the recorded intent and
   the self-declared status, treated as *claims to verify*, not facts.

**Decisive distinction applied throughout:** a workstream is only credited as *built* where code reads it
in a production path. "Table exists + seed script exists" ≠ built; "investigation doc says architecture is
80% in place" ≠ built. Where the three sources disagree, the database and the consumer-grep win.

**Key cross-cutting facts established (cited inline below):**

| Foundation table | Live row count | Read in production? |
|---|---|---|
| `canonical_food` | **28** | ✅ via `food-report-adapter.ts`, `variety.ts` |
| `canonical_food_alias` | 69 | ✅ (resolver) |
| `food_variety` | 16 | ✅ (PlantDiversityReport) |
| `diversity_group` | 27 | ✅ |
| `knowledge_foods` | **51** | ✅ via `nutrition-knowledge-registry.ts` |
| `knowledge_nutrients` | 30 | ✅ |
| `knowledge_health_benefits` | 15 | ✅ |
| `knowledge_food_nutrients` | 165 | ✅ |
| `knowledge_food_benefits` | 137 (all carry `evidence_strength`, **never surfaced**) | ✅ (stripped) |
| `knowledge_nutrient_benefits` | 68 | ✅ |
| `food_qualifier` (WS3B) | **table does not exist** | ❌ design only |
| `food_preparation` (WS5A) | **table does not exist** | ❌ design only |
| `normalized_ingredients` (universe for scale) | **754** | n/a |

The single most important number: **28 canonical foods / 51 knowledge foods against a ~754-ingredient
universe.** The foundations are *real and architecturally sound* but *pilot-scale in coverage*.

---

## WS1 — Pantry Explore

### Status
**Mostly Complete** (read-only Explore mode shipped; the user-data bridge is deliberately deferred).

### What Exists
- **Service:** `server/services/nutrition-knowledge-registry.ts` — a WS1 display layer
  (`searchKnowledgeRegistry`, `listFoodCategories`, `listFoodCards`, `getFoodDetailView`,
  `getNutrientDetailView`, `getBenefitDetailView`) that strips internal signals (`source`,
  `evidenceStrength`, `confidence`) server-side.
- **APIs:** six read-only `GET /api/knowledge/*` endpoints (search, categories, foods, foods/:slug,
  nutrients/:slug, benefits/:slug).
- **Component:** `client/src/components/PantryKnowledgeHub.tsx` — search, category browse, food/nutrient/
  benefit detail cards with an in-component navigation stack. Wired into `pantry-page.tsx` Explore mode.
- **Business logic:** categories derived dynamically from live `knowledge_foods` rows (8 categories), not
  hardcoded; food↔nutrient↔benefit drill-through.
- **Browsing / Search / Variety:** search across foods/nutrients/benefits works; Nutrition Context
  (seasonality/forms/storage) renders from real data.

### Missing Pieces
- **Data gap:** Explore browses only the **51** seeded knowledge foods, not the food universe (~754
  normalized ingredients). Many real categories (Whole Grains, etc.) are simply absent.
- **Trust gap → bridge gap:** the Hub **cannot truthfully say "this is in your pantry", "in N of your
  meals", or show "Your Variety"** because `knowledge_foods.slug` is an *editorial* key not unified with
  pantry/planner/diversity keys. These are rendered as honest "coming soon" placeholders, not fabricated.
- **UI gap:** Best Time, Best Pairings, Things To Be Aware Of are all "coming soon" (no WS0 data); search
  is unranked membership.

### Dependency Impact — does this block…
- **WS7 Relationships:** No (WS7's graph is editorial, not Pantry-hosted).
- **WS8 Discovery:** **Partially.** Pantry Explore is the natural *home surface* for Discovery; the
  read-only Explore shell is ready, but Discovery's "you've eaten / not eaten" needs the same canonical
  bridge WS1 deferred.
- **WS10 Stories / WS11 Seasonal Stories:** **Partially** — same bridge dependency to attach household
  history to a food card.

### Launch Critical?
**YES.** Pantry Explore is one of the five launch surfaces (per `THA_LAUNCH_ROADMAP.md` §1). It is
launch-ready *as a read-only knowledge hub*; the user-data bridge is **post-launch** by its own design.

### Audit answer — *Can Pantry become the future home of Discovery / Stories / Seasonal Stories without major redesign?*
**Yes, without major redesign.** The Explore shell, the navigation stack, the section-omission discipline,
and the dynamic-category model are exactly the substrate those features need. The card already has the
section slots ("Your Variety", "Meals") stubbed. What is required is **additive** (the canonical bridge +
new read joins), not a rebuild. The one structural risk is that the surface currently reads *only* through
the knowledge registry; Discovery/Stories will need it to also read the canonical adapter and the Layer-2
overlay — a second read seam, but not a redesign.

---

## WS2 — Canonical Food Identity

### Status
**Mostly Complete** (spine is real, resolver works, two production consumers exist) — **but coverage is
pilot-scale and one category vocabulary is fractured.**

### What Exists
- **Tables (4, additive):** `diversity_group` (27 rows), `canonical_food` (28), `food_variety` (16),
  `canonical_food_alias` (69 — `alias_key` UNIQUE = the anti-fork lock). `shared/schema.ts:1590–1660`.
- **Services / logic:** `shared/canonical/resolver.ts` (`resolveCanonicalFood`, anti-fork conflict
  detection), `variety.ts` (`buildEatenVarietyIndex`, `buildVarietyDisplay` — the eaten/not-eaten engine),
  `diversity-groups.ts`, `nutrition-context.ts`, `food-report-adapter.ts`, `shadow.ts`, `index.ts`.
- **Production consumers (graduated past shadow mode):** `client/src/components/PlantDiversityReport.tsx`
  (imports `canonical/variety`), `client/src/components/FoodReport.tsx` (imports
  `canonical/food-report-adapter`). Seed: `server/seeds/seed-canonical-food.ts` (idempotent). Tests:
  46 passing (`npm run test:canonical-food`).
- **Slugs / canonical resolution:** unique-slug spine; optional `knowledgeFoodSlug` FK out to WS0; optional
  `diversityGroupSlug` so varieties never inflate the 30-plants count.

### Missing Pieces
- **Coverage data gap (dominant):** **28 canonical foods** vs ~754 normalized ingredients and 51 knowledge
  foods. This is a seed, not the universe.
- **Linkage gap:** only **20 of 28** canonical foods link to a knowledge entry (`knowledge_food_slug`); 8
  (cinnamon, clementine, cumin, ginger, lentils, mushroom, paprika, turmeric) have no editorial home.
- **Category enum fracture (architectural debt):** `canonical_food` categories = {Fruit, Healthy fats,
  Herbs, Legumes, Mushrooms, **Nuts**, Seeds, **Spices**, Vegetables}; `knowledge_foods` categories =
  {**Fermented foods**, Fruit, Healthy fats, Herbs, Legumes, Mushrooms, Seeds, Vegetables}. The two spines
  use **divergent category vocabularies** — the "9-category enum" reconciliation flagged in the launch
  roadmap is still open.
- **Metadata gaps for graph use (WS7):** no typed edges between canonical foods; varieties carry no
  nutrition delta; `food_variety` has display fields only.

### Dependency Impact — does this block…
- **WS7 Relationships:** **YES — load-bearing.** Every edge endpoint is a canonical slug; the anti-fork
  lock is what makes counts/edges trustworthy. WS7 can model the graph on 28 foods but cannot ship
  trustworthy "87 tomatoes" breadth without coverage.
- **WS8 Discovery:** **YES.** Discovery traverses from canonical nodes; thin coverage = thin discovery.
- **WS9 Alternatives:** **YES** (alternatives resolve to canonical slugs).
- **WS10 / WS11 Stories:** **YES** — honest counts depend on the anti-fork lock; both lineage maps state
  counts "inherit the anti-fork guarantee or must not be shown."

### Launch Critical?
**YES.** The anti-fork lock protects the flagship 30-plants count from silent double-counting. Coverage
expansion is on the launch critical path (Plant Diversity Tier A→B).

### Audit answers
- ***Are canonical foods ready to become graph nodes?*** **Yes structurally, no at scale.** The slug spine,
  the uniqueness lock, and the diversity-group rollup are exactly graph-node primitives; WS7 itself states
  "every edge endpoint is a canonical slug." But 28 nodes is a pilot graph.
- ***What metadata is missing?*** Typed food↔food edges (WS7 invents these), per-variety nutrition deltas,
  qualifier attachment points (WS3B), preparation attachment points (WS5A), and a **reconciled** category
  enum shared with WS0.

---

## WS3 — Qualifiers and Editorial Rules

### Status
**Partially Complete.** WS3A (Nutrition Report page redesign) is **implemented**; WS3B (Qualifiers) is
**investigation only — not built**.

### What Exists
- **WS3A:** the Nutrition Report presentation is live — `PlantDiversityReport.tsx` consumes the canonical
  `FoodReport` component in the expanded plant row (this is the WS3A surface).
- **Editorial structures / trust language:** `HEALTH_DISCLAIMER` and empty-state discipline live in
  `shared/knowledge/index.ts`, `client/src/lib/health-benefits-model.ts`, and are consumed by `FoodReport`,
  `PantryKnowledgeHub`. Health-benefit wording is editorial, evidence-gated, never medical.
- **Health benefit wording:** `knowledge_health_benefits` (15), `knowledge_food_benefits` (137) supply the
  approved benefit copy that all surfaces reuse.

### Missing Pieces
- **No qualifier model at all:** `food_qualifier` table does **not** exist; no `qualifiers: jsonb` field;
  WS3B is a design recommendation only.
- **Editorial gap:** the qualifier vocabulary (grass-fed, wild/farmed, organic, …), its non-mandatory
  `qualifier-prefer` framing, and the `budgetNote` cost guard exist only as proposed contracts in WS3B.

### Dependency Impact — does this block…
- **WS7 Relationships:** **Soft block.** WS7 explicitly reuses WS3B's `qualifier-prefer` non-mandatory
  framing and `budgetNote` guard as "the template for Alternatives' 'option not verdict'." WS7 can adopt
  the *framing pattern* from the doc without the table; the data itself is needed for richer edges.
- **WS8 Discovery:** No (Discovery is food↔food, qualifiers are sourcing).
- **WS9 Alternatives:** **YES (framing-level).** WS9's "option not verdict" posture and cost guard are the
  WS3B contract. The *language rules* must exist before Alternatives ships; the qualifier *data* can follow.
- **WS10 / WS11 Stories:** No (Stories must not attach swaps/qualifiers).

### Launch Critical?
**Partly. WS3A: YES** (it is the Nutrition Report surface). **WS3B: NO** — qualifiers are an Analyser/
Shopping enrichment, post-launch.

### Audit answer — *Can WS8 and WS9 reuse this directly?*
**WS9 reuses the WS3B editorial framing directly (it was written for exactly that); WS8 does not need
qualifiers.** But "directly" means reusing the *rules and copy contract*, which today live in a doc, not in
code. The trust-language primitives (`HEALTH_DISCLAIMER`, evidence-gated wording) **are** reusable from code
today.

---

## WS4 — Evidence and Trust

### Status
**Partially Complete.** Trust *primitives* ship in code; the WS4B *ingestion/editorial pipeline* (four-plane
architecture, hard wall, trusted-source registry) is **investigation only — not built**.

### What Exists
- **Evidence levels (stored):** `knowledge_food_benefits.evidence_strength`, `knowledge_food_nutrients.
  confidence`, `knowledge_nutrient_benefits.evidence_strength` — all 137 benefit rows carry strength.
  **STORED ONLY — stripped server-side, never surfaced** (verified: no `evidence`/`confidence` in any
  `/api/knowledge` payload, per WS1 source-leak test).
- **Explainability:** `server/lib/explainability-service.ts` (`generateMealExplanation`).
- **AI/score trust rules:** `shared/apple-score-trust.ts` (`deriveAppleScoreTrustState`,
  `canShowAuthoritativeAppleScore`, `getUnresolvedScoreLabel`) — the Analyser's trust gate.
- **Unmatched / confidence handling:** `FoodReport` returns `null` for non-foods; empty sections omit;
  `getUnresolvedScoreLabel` handles unscored products. "Empty is silent, not broken."
- **Trust language:** `HEALTH_DISCLAIMER`, banned-vocabulary discipline, evidence-gated benefit wording.

### Missing Pieces
- **APIs / pipeline gap:** no ingestion plane, no review-state machine, no trusted-source registry table,
  no staleness detection — WS4B describes all of these; none are coded.
- **Trust gap:** `evidence_strength` is captured but there is **no surfacing policy** (when, if ever, to
  show "established" vs "emerging") wired anywhere.
- **Editorial gap:** the "composed, not invented" multi-path benefit rule (WS4B Amendment B) and automated
  canonical growth (Amendment A) are design only.

### Dependency Impact — does this block…
- **WS7 Relationships:** **Soft block.** "Every nutrition *reason* on an edge inherits WS4B gating." WS7
  can inherit the *existing* primitives (disclaimer, evidence-gated copy, null discipline); it does **not**
  need the full pipeline to ship a first version.
- **WS8 Discovery / WS9 Alternatives / WS10 Stories:** **Soft block (same shape).** Each inherits the trust
  *rules*; none requires the ingestion pipeline. Any nutritional aside must pass the gates that already
  exist in code.

### Launch Critical?
**The primitives: YES** (the disclaimer, the null discipline, the apple-score gate already protect every
launch surface). **The WS4B pipeline: NO** — it is an explicit post-launch graduation (KMS/automation).

### Audit answer — *Can Discovery / Alternatives / Stories inherit these rules? What is missing?*
**Yes — the inheritable rules exist in code today** (`HEALTH_DISCLAIMER`, evidence-gating of wording,
omit-when-empty, return-null-for-non-foods, the score trust gate). **Missing:** (1) a single shared
"approved-language" helper so all three consume one gate rather than re-implementing it; (2) an
evidence-surfacing *policy* (currently strength is hidden everywhere — fine for launch, a decision for
WS7+); (3) the ingestion/review pipeline, which is post-launch and not a WS7 blocker.

---

## WS5 — Preparation and Context

### Status
**Early Foundation.** Preparation exists *latently and untyped*; an uplift engine exists for meals; the
first-class preparation model (WS5A) is **investigation only — not built**.

### What Exists
- **Latent preparation:** `commonForms` in `shared/knowledge/foods.ts` (raw/toasted/smoked/soaked/cooked/
  roasted/tinned/frozen/dried); `STRIP_WORDS` in `shared/canonical/variety.ts` (fresh/dried/frozen) treats
  preparation as identity noise; `food-report-adapter.ts` enforces a **PREPARATION GUARD** (returns `null`
  for "grilled tomatoes").
- **Uplift engine (real, wired for meals):** `server/lib/uplift-engine.ts` (`buildRuleIndex`,
  `matchUpliftRules`, `batchMatchUplift`), `uplift-rules.ts`, `uplift-types.ts`, `uplift-persistence.ts`,
  plus `meal_uplift_applications` table (`schema.ts:1406`). This is the "nutrition uplift" machinery.
- **Nutrition context:** `shared/canonical/nutrition-context.ts` + `knowledge_foods` seasonality/forms/
  storage — **fully populated for all 51 seeded foods** (51/51 seasonality, 51/51 storage).
- **Preparation relationships / swaps:** `server/lib/recipe-swap-engine.ts`, `client/src/lib/
  whole-food-alternatives.ts` (the existing Healthier Alternatives path).

### Missing Pieces
- **Structural gap:** no `food_preparation` catalogue and no evidence-gated `preparation_effect` link —
  preparation is not a queryable, typed concept.
- **Data gap:** no per-preparation nutrition deltas (WS5A's honest default is "no preparation-specific
  note yet").
- **Graph gap:** preparation cannot yet be an edge type (`broaden-preparation` in WS7) because it is not
  first-class.

### Dependency Impact — does this block…
- **WS7 Relationships:** **Soft block.** WS7 wants `broaden-preparation` edges and inherits WS5A's "one
  swap not a ladder" + benefit-firewall posture. The *posture* is adoptable from the doc; the *edge type*
  needs the typed model.
- **WS8 Discovery:** No (Discovery is food↔food, not preparation states).
- **WS9 Alternatives:** **YES (posture-level).** WS9's trust posture (one swap, benefit firewall) is the
  WS5A contract; the uplift engine and whole-food-alternatives already provide a swap substrate.
- **WS10 / WS11 Stories:** No.

### Launch Critical?
**NO** for the typed preparation model (post-launch). The uplift engine and nutrition context that *do*
exist are already serving the planner and the launch surfaces.

### Audit answers — *Is preparation graph-ready / editorial-only / structured enough for Discovery?*
- **Graph-ready?** **No** — it is untyped latent metadata + an identity-stripping rule + a null guard
  (three half-formed positions WS5A exists to unify).
- **Editorial-only?** **Effectively yes today** (`commonForms` is display trivia; never surfaced as
  knowledge).
- **Structured enough for Discovery?** **No.** Discovery does not strictly need it, but WS7's
  `broaden-preparation` edges and WS9's preparation-aware swaps both require the first-class model first.

---

## WS6 — Food Reports

### Status
**Mostly Complete (as a component) / Architecturally specified (as the shared contract).** The Food Report
exists and ships on one surface; promoting it to THA's single food-explanation contract is the WS6
investigation (not yet implemented).

### What Exists
- **Adapter (single source of truth):** `shared/canonical/food-report-adapter.ts` —
  `buildFoodReport(slug) → FoodReportKnowledge | null`, assembling Overview, Key Nutrients, Health Benefits,
  Nutrition Context and Varieties from one seam (`canonical_food.knowledgeFoodSlug → WS0`).
- **Component:** `client/src/components/FoodReport.tsx` — renders the report; omits empty sections; never
  fabricates; honours `HEALTH_DISCLAIMER`.
- **Reporting covered:** Plant Diversity, Benefits, Nutrients, Context, Variety reporting, Health benefits —
  all flow through this one adapter+component.

### Missing Pieces
- **Integration gap (the core WS6 finding):** the Food Report is consumed by **exactly one caller**
  (`PlantDiversityReport.tsx`). Four other surfaces re-explain foods their own way: Pantry
  (`PantryKnowledgeHub`), Food modal (`food-knowledge-modal.tsx`), Analyser (`product-analysis.ts`),
  Healthier Alternatives (`whole-food-alternatives.ts` + `uplift-*`). This is the duplication WS6 exists to
  end.
- **Section gaps:** Qualifiers (WS3B), Preparations (WS5A), and a Healthier-Alternatives + Sources section
  are named in the target contract but not yet in the adapter output.
- **Coverage gap:** a report only exists where canonical + knowledge both cover the food (≈20 foods with a
  full chain).

### Dependency Impact — does this block…
- **WS7 Relationships:** **Soft block.** WS7 wants an edge's reason to be "the report's own nutrient fact,
  not a third assertion" — i.e. it reuses the report contract. Adoptable incrementally.
- **WS8 Discovery:** No hard block (Discovery surfaces results; can render via the report later).
- **WS9 Alternatives:** **YES (contract-level).** WS9 Part 12 expects Alternatives to be a *report section*
  so the swap reason is the report's nutrient fact. Needs the contract promoted + the Alternatives section
  added.
- **WS10 Stories:** **Contract-level.** A food's Story is designed as a Food Report section ("Your history
  with this food").
- **WS11 Seasonal Stories:** **Contract-level.** A Seasonal Story could surface as a seasonal report
  section reusing Key Nutrients (one seam).

### Launch Critical?
**YES (as the rendering contract for the launch surfaces).** Consolidating the four parallel "what is this
food" paths is the structural defence against nutrient-list drift and forgotten disclaimers across surfaces.

### Audit answer — *Could Food Reports become the presentation layer for Discovery / Alternatives / Stories / Seasonal Stories, or is redesign required?*
**Yes — this is precisely WS6's explicit design, and no redesign is required.** The adapter is already the
single source of truth, the component already omits empty sections and never fabricates, and the
preparation guard already protects against non-foods. WS6 estimates the architecture **80% in place**. The
remaining 20% is (a) naming the full section set (folding in WS3B/WS5A/Alternatives/Sources) and (b)
re-pointing the other surfaces at the one report — **additive integration, not a rebuild.**

---

## DEPENDENCIES ON WS7–WS11 (summary matrix)

Reading the lineage maps in the WS7/WS10/WS11 docs against the audited foundation state:

| Foundation | Built today | WS7 Relationships | WS8 Discovery | WS9 Alternatives | WS10 Stories | WS11 Seasonal |
|---|---|---|---|---|---|---|
| **WS1 Pantry Explore** | Read-only hub ✅ | — | Host surface ⚠️ | — | Host surface ⚠️ | Host surface ⚠️ |
| **WS2 Canonical Identity** | Spine + resolver ✅ (28 foods) | **Hard, load-bearing** | **Hard** | **Hard** | **Hard (honest counts)** | **Hard** |
| **WS3A Nutrition Report** | ✅ | — | — | — | surface | surface |
| **WS3B Qualifiers** | ❌ design only | framing reuse | — | **framing reuse** | excluded | excluded |
| **WS4 Trust primitives** | ✅ (pipeline ❌) | soft (gate reuse) | soft | soft | soft (language) | soft |
| **WS5A Preparation** | latent only ❌ typed | soft (`broaden-prep` edge) | — | **posture reuse** | — | — |
| **WS6 Food Report** | component ✅, 1 consumer | contract reuse | render later | **section needed** | section design | section design |

**The single connecting thread for WS7–WS11:** the **Layer-2 household consumption overlay** — resolving a
household's *eaten ingredient strings* to canonical slugs at query time. This already **exists and works**
in code: `variety.ts:buildEatenVarietyIndex(ingredients)` → `resolver.ts:resolveCanonicalFood`, proven live
in `PlantDiversityReport`. WS7/WS10/WS11 all generalise exactly this mechanism from "within one food" to
"across the graph." **This de-risks the hardest part of WS7–WS11: the overlay primitive is not greenfield.**

---

## FOUNDATION SCORECARD

| Workstream | Score | One-line basis |
|---|---:|---|
| **WS1 Pantry Explore** | **70%** | Read-only Explore shipped & launch-ready; user-data bridge deferred; coverage = 51 foods. |
| **WS2 Canonical Foods** | **80%** | Spine + resolver + anti-fork lock + 2 prod consumers; but 28-food seed, 8/28 unlinked, category enum fractured. |
| **WS3 Editorial** | **55%** | WS3A page live + trust language reusable; WS3B qualifiers entirely unbuilt. |
| **WS4 Trust** | **70%** | Primitives (disclaimer, evidence stored, score gate, null discipline) ship; full pipeline & surfacing policy unbuilt. |
| **WS5 Preparation** | **45%** | Uplift engine + context populated; preparation latent/untyped, no first-class model. |
| **WS6 Food Reports** | **75%** | Adapter + component ship and never fabricate; consumed by 1 of 5 surfaces; 3 sections unspecced in code. |

### Confidence, evidence, missing work per score

- **WS2 (80%) — High confidence.** Evidence: DB row counts, 46 passing tests, two verified production
  consumers, schema read. Missing: coverage expansion (28→universe), category reconciliation, 8 unlinked
  foods. *This is the most trustworthy score because three sources agree.*
- **WS4 (70%) — Medium-high confidence.** Evidence: code primitives verified by grep + WS1 leak-test;
  pipeline absence verified (no tables). Missing: shared language helper, surfacing policy, ingestion plane.
- **WS6 (75%) — High confidence.** Evidence: single-consumer fact verified by grep across `server/`+
  `client/`. Missing: contract promotion + 3 sections + re-pointing 4 surfaces.
- **WS1 (70%) — High confidence.** Evidence: doc + APIs + component all verified live. Missing: bridge,
  coverage.
- **WS3 (55%) — High confidence on the split.** WS3A verified live; WS3B verified absent (no table).
- **WS5 (45%) — Medium confidence.** Evidence: latent fields + uplift engine verified. The score is a
  judgement that "latent + adjacent engine" is roughly half a first-class model; reasonable people could
  say 35–50%.

---

## LAUNCH BLOCKERS

### What MUST be completed before **THA public launch**
*(launch = the five connected surfaces per `THA_LAUNCH_ROADMAP.md`: Plant Diversity, Pantry Explore, Weekly
Nutrition Report, Analyser, Simply Better Choices — WS7–WS11 are explicitly post-launch)*

1. **Editorial coverage of the knowledge registry (the long pole).** 51 foods is a pilot. The flagship
   30-plants experience and Pantry Explore need enough sourced, nutritionist-signed-off foods to not feel
   empty. *Editorial-capacity-bound, not engineering-bound.* **Hard blocker.**
2. **Category enum reconciliation (WS2 ↔ WS0).** Canonical and knowledge spines use divergent category
   vocabularies (Nuts/Spices vs Fermented foods). Until reconciled, cross-surface category browsing and
   counts can disagree. **Hard blocker (cheap to fix, must not ship fractured).**
3. **Food Report consolidation to one contract (WS6).** Four parallel "what is this food" paths is the
   structural risk of a fabricated/forgotten-disclaimer claim slipping onto one surface. At minimum, the
   launch surfaces must read one report. **Hard blocker for trust safety.**
4. **Canonical coverage + linkage for the launch surfaces** (the 8 unlinked canonical foods; enough
   canonical foods to back Plant Diversity Tier A honestly). **Blocker, scoped to launch foods.**
5. **Responsive/density polish** across the five surfaces (the launch roadmap's stated #1 readiness gap —
   Plant Diversity uses a different breakpoint and ignores adaptive density). **Blocker (craft).**

**NOT launch blockers:** WS3B qualifiers, WS5A typed preparation, WS4B ingestion pipeline, the user-data
bridge, WS7–WS11 in their entirety. All are post-launch graduations by their own authors' design.

### What MUST be completed before **WS7 implementation** (distinct from launch)
1. **Expand canonical coverage** — WS7 edges and counts are only as trustworthy as the node set; a pilot
   graph of 28 produces a pilot Discovery.
2. **Promote the Food Report to the shared contract (WS6)** — WS7 reasons reuse report facts; without one
   contract, WS7 would add a *fifth* food-explanation path.
3. **Build WS3B qualifier framing + WS5A preparation posture into a shared editorial/language module** —
   WS7/WS9 inherit `qualifier-prefer`, `budgetNote`, "one swap not a ladder", benefit firewall. These can
   start as the *rules layer* (code helpers) before the full data tables.
4. **Formalise the Layer-2 overlay primitive** — extract `buildEatenVarietyIndex`/`resolveCanonicalFood`
   into a reusable household-consumption-overlay service (it works; it is currently embedded in the variety
   path). WS7/WS10/WS11 all depend on it.
5. **A shared trust-language gate (WS4 primitive consolidation)** — one helper all of WS7–WS11 call, rather
   than re-implementing evidence-gating per feature.

---

## RECOMMENDED BUILD ORDER

1. **Canonical coverage expansion + category enum reconciliation (WS2 hardening).**
   *Justification:* every other workstream (and the launch flagship) is downstream of the node set and a
   single category vocabulary. Highest leverage, unblocks the most. Pure data/editorial + one enum fix.

2. **Knowledge registry editorial fill (WS0/WS4 content).**
   *Justification:* the launch's defining long pole; editorial-capacity-bound so it must start earliest and
   run in parallel with everything. Plant Diversity Tier A ships before this completes; Tier B upgrades in
   place with zero UI rework.

3. **Food Report consolidation to one contract (WS6).**
   *Justification:* collapses four food-explanation paths into one *before* WS7–WS11 would add more. It is
   the trust-safety keystone and the presentation layer all later features render through. Additive, no
   rebuild.

4. **Shared rules/overlay layer: WS4 trust-language gate + WS3B/WS5A *framing* helpers + the Layer-2
   consumption-overlay service.**
   *Justification:* this is the thin reusable substrate WS7–WS11 explicitly inherit. Building it once, as a
   rules/overlay layer (not full data tables), lets WS7 start without re-deriving framing, cost guards, the
   benefit firewall, or the eaten/not-eaten resolution.

*(WS3B qualifier data, WS5A typed preparation tables, and the WS4B ingestion pipeline follow after WS7,
when their richer data actually pays for itself.)*

---

## TRUST CHECK

**Could this audit underestimate hidden complexity? — YES, in three places.**
- **The category enum reconciliation looks cheap but may not be.** "Fractured vocabularies" can have
  downstream consumers (filters, counts, display order) that a one-line enum change breaks. Treated as
  cheap above; verify consumers before touching it.
- **Coverage expansion is editorial, and editorial does not parallelise like code.** "Expand to N foods"
  hides nutritionist review, sourcing, and sign-off per food — the launch roadmap's own *Medium* confidence
  on timeline. The audit can count rows; it cannot estimate the editorial calendar.
- **The Layer-2 overlay "already works" — but only for varieties of plants.** Generalising
  `resolveCanonicalFood` across the whole graph (non-plants, qualifiers, preparations) may surface resolver
  edge cases the 28-food pilot never exercised.

**Could this audit overestimate readiness? — YES, mildly.**
- Crediting WS2 at 80% weights *architecture* over *coverage*. By coverage alone (28/754) it is far lower.
  The 80% is "ready to build on", not "ready to ship breadth". The same caveat applies to WS6's "80% in
  place" (true for the contract, not for the 4 un-migrated surfaces).
- "Two production consumers" for canonical is real but narrow; most of the 71 `canonical` references in
  `routes.ts` are the *older* product/diet canonicaliser, not the WS2 spine — readiness of the *spine* in
  the server layer is thinner than a naive grep suggests (explicitly checked).

**Could this audit miss architectural debt? — YES, two known unknowns.**
- **Identity-key sprawl.** WS1 lists ≥4 incompatible food-identity key spaces (knowledge slug, pantry
  `ingredientKey`, parsed ingredient keys, plant-diversity keys). The canonical spine is meant to unify
  these but currently bridges only eaten-strings→canonical for varieties. The full reconciliation is
  larger than any single WS doc scopes.
- **Legacy parallel tables.** `food_knowledge` (12 rows) and `pantry_ingredient_knowledge` (4) still exist
  beside the WS0 `knowledge_*` tables. Whether they are dead or load-bearing was not traced — a debt flag.

---

## DEFINITION OF DONE — checklist

- [x] WS1–WS6 objectively audited (DB + code + docs triangulated)
- [x] Launch blockers identified (5 launch + 5 WS7-prerequisite, kept distinct)
- [x] Dependencies on WS7–WS11 identified (lineage-map matrix + the Layer-2 overlay thread)
- [x] Foundation scorecard produced (with confidence/evidence/missing-work per score)
- [x] Recommended build order produced (4 steps, justified)
- [x] No implementation · No schema changes · No UI changes · No DB changes

---

## SUGGESTION (future ideas — out of scope, recorded not actioned)

- **Extract a `householdConsumptionOverlay` service** from `variety.ts` so the eaten→canonical resolution
  is a named, tested primitive WS7–WS11 import, rather than logic embedded in the variety path.
- **A coverage dashboard** (canonical foods vs normalized_ingredients vs knowledge foods) so the editorial
  long pole is visible and tracked, not rediscovered each audit.
- **Retire or document the legacy `food_knowledge` / `pantry_ingredient_knowledge` tables** to remove the
  parallel-identity debt.
- **A single `approvedLanguage`/evidence-gate helper** in `shared/` that every food-explaining surface
  calls, making the WS4 trust rules impossible to bypass by omission.
- **Evidence-surfacing policy decision** — `evidence_strength` is captured on 137 rows and shown nowhere;
  decide if/when "established vs emerging" ever surfaces (a product + editorial call, not a code task).

---

*End of WS1–WS6 Foundation Completion Audit. Investigation only — no code, schema, UI, or data changed.*
