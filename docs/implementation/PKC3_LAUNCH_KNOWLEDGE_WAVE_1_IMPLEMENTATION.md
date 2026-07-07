# PKC3 — Launch Knowledge Wave 1 — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** No schema, route, or API contract change, and no change to any consuming component's interface. Rated AMBER rather than GREEN because it changes the *content* of a live knowledge store (which rows exist, which aliases resolve to which food) that many read paths depend on (Pantry, Boost, Food Report, the public knowledge catalog, meal-ingredient context) — an error here is a silent data-correctness bug, not a crash, so it is held to the same verify-before-trust bar as PKC1/PKC2 rather than treated as a routine content edit.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1), specifically:

- **Rule KC4 ("one owner, one mouth")** — every knowledge entity type has exactly one owning store and exactly one adapter permitted to render facts about it; no surface re-derives or independently represents the same fact.
- **Rule KC5 ("Minimum Viable Fact")** and the **Domain Completeness Model (§3)** — a knowledge entity is visible once identity + ≥1 real fact clears the bar; nothing beyond that gates visibility. A corollary this phase acts on: identity itself must be singular — two rows claiming to *be* the same real-world food is not "enrichment", it is the exact duplication Rule KC4 forbids, just one layer further down than the file-level duplications PKC1 closed.
- **§6.1 completion criterion, Canonical Food Identity cluster** — *"One key-space, one runtime read model, one owner per property (WS0X.13) — no `knowledgeFoodSlug` orphans, no `canonical-map.json` second identity store."* This phase is the first to actually run that check against current HEAD rather than cite it.
- **§7 Phase 1's own closing note** (carried from PKC1/PKC2): Rule KC4 is satisfied for Food Knowledge at the *file* level (no shadow stores) and now, per PKC2, at the *adapter* level (benefit claims converge on one evidence gate). This phase checks the one level PKC1/PKC2 did not: whether the **rows inside** the one surviving store (`shared/knowledge/foods.ts`, WS0) are themselves free of internal duplication.

Also read as background/precedent: `docs/implementation/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md`, `docs/implementation/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`, `docs/implementation/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md` (the three prior phases of this roadmap), `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 1/Domain 2 declarations), `docs/investigations/EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` (Category E — Domain Data — used to survey candidate Wave 1 items before selecting this one).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc3-launch-knowledge-wave1-20260704` → `ff3b2cf` |
| Working tree | Intentionally dirty — carries prior uncommitted, unrelated workstreams (EWO2 Companion Personality, EWX1 Living Companion Experience, FI5 Food Intelligence UI Activation, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture, PKC0–2) untouched by this work |
| This task's writes | See "Files changed" in the Rollback Plan below |
| Rollback command | `git checkout rollback/before-pkc3-launch-knowledge-wave1-20260704 -- <file>` per file, or full reset to the tag |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (the governing architecture for this workstream)
- [x] `docs/implementation/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md`
- [x] `docs/implementation/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/implementation/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` (Category E / Part 4 — surveyed for candidate Wave 1 items)
- [x] `docs/investigations/EWO_DOMAIN_FUTURE_STATE_AUDIT.md` (cited by the above, not re-derived)

---

## HOW THE WAVE 1 SCOPE WAS CHOSEN

PKCA1 §7's roadmap has Phase 0 (PKC0) and Phase 1 (PKC1, verified) complete, and PKC2 closed the one live Rule KC4 gap Phase 1's own verification pass surfaced (Food Report's benefit-claim bypass). Before writing any code for this phase, three candidate directions named across the governing docs and the launch audit were checked against current HEAD — not assumed from any document's claim:

1. **§7 Phase 2 ("name the one-mouth adapter for every entity type still missing one — Food Relationships, Preparation Knowledge, recipe licence/attribution").** Preparation Knowledge is unbuilt (Phase 4, out of order to start early per Rule KC1/LT1 phase-gating). Food Relationships was already checked by PKC2 ("What This Phase Found" #3) and confirmed to have no live second narrator. Recipe licence/attribution (`server/lib/recipe-source-gate.ts`, `shared/recipe-acquisition.ts`) was traced this phase: a small, internally consistent set of files with one gate function as the apparent single entry point, and `server/lib/external-meal-service.ts` — one of its consumers — is currently being modified by a separate, in-flight, uncommitted workstream in this same working tree (evidenced by `docs/implementation/EWO_MEALDB_API_ACTIVATION.md` sitting untracked alongside it). Investigating this domain deeply enough to safely change it would risk colliding with that other work; **deferred, not fixed, named here so a future phase does not restart from zero.**
2. **Launch audit Category E items (E1 allergen coverage, E11 WS0/WS2A reconciliation).** E1 was ruled out immediately: `shared/restrictions/restriction-library.ts`'s own header states, as a hard authoring rule, *"All definitions must be human-authored and reviewed before merging. Never generated by AI or the database."* Authoring five new UK-regulated allergen definitions (fish, celery, lupin, molluscs, sulphites) is explicitly excluded from AI implementation by the file's own governance — this is Rule KC9 ("automation authors candidates, never publishes") applied at its strictest: safety-relevant regulatory content is not this phase's to author. **Confirmed out of scope, not silently skipped.**
3. **E11 (WS0 188-food vs WS2A 239-entry reconciliation) — chosen.** This was checked programmatically against current HEAD (not the audit's 2026-07-03 snapshot, which predates PKC0–2) and found to be **the one candidate with a live, verifiable, safely-fixable defect** — detailed below.

---

## WHAT THIS PHASE FOUND

Every `knowledgeFoodSlug` reference in `shared/canonical/foods.ts` (WS2A) was cross-checked against every slug in `shared/knowledge/foods.ts` (WS0), and every WS0 slug was checked for at least one inbound canonical link, using a script run directly against the files at HEAD (not against any document's claim):

```
WS0 knowledge slugs:                        265
WS2A canonical food-level slugs:             254
knowledgeFoodSlug link references (non-null): 264
BROKEN knowledgeFoodSlug references:           0
WS0 slugs with NO inbound canonical link:      1  →  "yoghurt"
```

Tracing the one orphan (`yoghurt`) surfaced the actual defect, which is not a missing link — it is a **duplicate WS0 row**:

- `shared/knowledge/foods.ts` had **two** entries for the same real-world food: `live-yogurt` (category "Fermented foods") and `yoghurt` (category "Dairy"). `yoghurt`'s own `aliases` array already listed `"live yoghurt"` as one of its own aliases — i.e. WS0's own editorial data already asserted these are the same food, while carrying them as two separate catalog rows with overlapping nutrient (`calcium`, `vitamin-b12` in both) and identical benefit sets (`gut-health`/`bone-health`/`digestive-comfort` in both, just reordered).
- The canonical WS2A "Yoghurt" food (category "Dairy" — matching `yoghurt`, not `live-yogurt`) linked `knowledgeFoodSlug: "live-yogurt"` — pointing past its own better-categorised match to the older, narrower entry, which is why `yoghurt` showed as the orphan rather than `live-yogurt`.
- This is not cosmetic. `server/services/nutrition-knowledge-registry.ts`'s `resolveIngredientSlugs()` / `resolveIngredientsToKnowledgeSummary()` (the functions behind Pantry/Boost ingredient-context lookups and meal food-intelligence context) build a `Map<normalisedAlias, foodSlug>` with **first-registration-wins** semantics (`if (key && !termToSlug.has(key))`, line ~724/750). Two rows both trying to own overlapping alias terms for the same real food is exactly the shape that produces silent, DB-order-dependent misrouting. `searchKnowledgeRegistry()` (Pantry Explore's search box) additionally would surface **both** "Live Yogurt" and "Yoghurt" as separate results for the same query — a visible duplicate in the one live, browsable catalog endpoint (`GET /api/knowledge/foods`, confirmed via `listFoods()`/`toFoodCard`).

Having found one real instance of this shape (a generic entry's own alias list quietly overlapping a separate, more specific entry that already exists), every WS0 entry's aliases were checked against every other entry's exact `name`, across all 265 rows (not just the one already found):

```
sesame-seeds  has alias "tahini"         == exact NAME of "tahini"
cabbage       has alias "savoy cabbage"  == exact NAME of "savoy-cabbage"
cabbage       has alias "white cabbage"  == exact NAME of "white-cabbage"
spelt         has alias "spelt flour"    == exact NAME of "spelt-flour"
```

Reading each pair confirmed the same pattern: an older, generic entry (`cabbage`, `spelt`, `sesame-seeds`) carries an alias equal to the exact name of a **later-added, dedicated, more specific entry** (`savoy-cabbage`/`white-cabbage` — both carry `source: "USDA FDC / WS0X.2 H1 batch 2026-06-24"`; `spelt-flour`, `tahini` — both have their own richer descriptions and a different `category`/`subcategory` from their generic counterpart). In every one of these four cases the specific entry already exists and is strictly more accurate for that alias term — the generic entry's alias is simply stale, left over from before the dedicated entry was added, and shadows it under first-match-wins resolution exactly as the yoghurt case does.

One further pair was found and deliberately **not** changed: `green-beans` and `runner-beans` both list `"string beans"` as an alias. Unlike the four above, these are two genuinely different vegetables that happen to share a colloquial English name (regional usage, not a THA authoring artefact) — neither entry's name matches the shared alias, and there is no dedicated dictionary entry being shadowed. Fixing this would mean arbitrarily picking a winner for a real-world naming ambiguity, not resolving a duplicate-knowledge defect. Left as-is, named here so a future pass does not need to re-discover and re-litigate it.

`shared/canonical/diversityGroupSlug` references (Domain 4, Plant Diversity) were checked with the same method as a second integrity pass: **173 defined groups, 173 non-null references, 0 broken** — fully converged, no action needed.

`server/data/canonical-map.json` (flagged by name in PKCA1 §6.1 as a "second identity store" risk) was read in full and its two consumers (`server/lib/item-resolver.ts`, `server/lib/normalise-categories.ts`) traced. It is **not** a duplicate of WS2A Canonical Food Identity: the majority of its ~90 entries are non-food household/cleaning items WS2A has no concept of at all (toilet roll, dishwasher tablets), and where it does cover a food, its category taxonomy is a shopping-aisle grouping (`produce`/`dairy`/`frozen`/`tinned`/`pantry`) for `resolveItem()`'s shopping-list categorisation, not WS2A's editorial nutrition taxonomy (`Fruit`/`Vegetables`/`Legumes`) — two different facts about the same food, for two different consumers (Shopping State vs Food Knowledge), not one fact duplicated. **Confirmed not a live violation** rather than silently left unexamined; the partial category overlap for foods present in both is a minor, pre-existing, low-risk naming coincidence, not addressed by this phase since unifying two purpose-built taxonomies for a cosmetic consistency gain would be exactly the kind of un-requested scope PKC0–2's own discipline avoids.

---

## WHAT THIS PHASE DID

Five edits across three editorial seed files, plus one migration to retire the one orphaned row from any environment where it was already seeded. No schema, route, or consumer-facing contract changed.

### 1. Merged `live-yogurt` into `yoghurt` (`shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`, `shared/canonical/foods.ts`)

- Deleted the `live-yogurt` entry from `FOOD_SEED` (`shared/knowledge/foods.ts`) — it was a duplicate of `yoghurt`, by `yoghurt`'s own alias declaration.
- Enriched `yoghurt`'s aliases with the US-spelling forms `live-yogurt` carried (`"live yogurt"`, `"natural yogurt"`, `"plain yogurt"`) so no previously-reachable alias term becomes unreachable — this is content preservation, not new content.
- Removed `live-yogurt`'s rows from `FOOD_NUTRIENTS`/`FOOD_BENEFITS` (`shared/knowledge/relationships.ts`); merged its one nutrient not already on `yoghurt`'s list (`live-cultures`) onto `yoghurt`'s row, appended last (lowest ranking) since not all yoghurt is cultured, unlike the merged entity's constituent `live-yogurt` row. `yoghurt`'s benefit list already covered the identical three benefits `live-yogurt` had (same set, different order) — no benefit content was lost or needed merging.
- Repointed the canonical "Yoghurt" food's `knowledgeFoodSlug` (`shared/canonical/foods.ts`) from `"live-yogurt"` to `"yoghurt"` — the correctly-categorised match (`category: "Dairy"` on both sides) that should have been the link all along.

### 2. Removed four stale, shadowing aliases (`shared/knowledge/foods.ts`)

| Generic entry | Stale alias removed | Dedicated entry it shadowed |
|---|---|---|
| `cabbage` | `"savoy cabbage"` | `savoy-cabbage` |
| `cabbage` | `"white cabbage"` | `white-cabbage` |
| `spelt` | `"spelt flour"` | `spelt-flour` |
| `sesame-seeds` | `"tahini"` | `tahini` |

No other field on the generic entries changed — `commonForms: ["...", "tahini"]` on `sesame-seeds`, for instance, is display-only prose (never registered into the alias-resolution index — confirmed by reading every call site of `food.aliases` in `nutrition-knowledge-registry.ts`) and was deliberately left alone; only the `aliases` array (the one field actually indexed for resolution and search) was changed.

### 3. Migration to retire any already-seeded duplicate (`server/migrations/runner.ts`)

`seed-knowledge-registry.ts`'s own header states it is "idempotent UPSERT... additive only" — it has no delete path, so removing `live-yogurt` from the seed file alone would not remove an already-seeded copy of that row from any environment where `npm run seed:knowledge` had already run against the old data. Migration `2026-07-04_pkc3_retire_live_yogurt_duplicate` adds one idempotent `DELETE FROM knowledge_foods WHERE slug = 'live-yogurt'`, which cascades to its `knowledge_food_nutrients`/`knowledge_food_benefits` rows via the existing `ON DELETE CASCADE` foreign keys (confirmed in `shared/schema.ts`) — a no-op in any environment where the row never existed, and a real cleanup in any environment where it had been seeded.

### 4. Verification performed this session

- `validateKnowledgeSeed()` (the seed's own referential-integrity gate) — **0 problems**, `KNOWLEDGE_SEED_COUNTS.foods` 265→264.
- Re-ran the orphan/broken-link scan against the edited files — **0 broken `knowledgeFoodSlug` links, 0 unlinked WS0 foods** (was 1 before this phase).
- Re-ran the exact-name alias-shadow scan against the edited files — **0 remaining collisions** (was 4 before this phase, plus the yoghurt case which the exact-name method itself misses due to the yoghurt/yogurt spelling variant — found instead by reading the entries directly).
- `npx tsx server/tests/test-knowledge-registry.ts` — **23/23 passed**, including the live-DB retrieval helpers (confirms the dev DB is reachable, so the new migration will actually execute on next server start, not merely typecheck).
- `npx tsx server/tests/test-knowledge-evidence-gate.ts` — **100/100 passed** (PKC0's gate, unaffected — this phase touches no `sourceRefs`/`reviewedAt` data).
- `npx tsx server/tests/test-food-report-evidence.ts` — **31/31 passed** (PKC2's parity test, unaffected).
- `npx tsx server/tests/test-food-report-adapter.ts` — **102 passed, 1 pre-existing failure** ("lentils: Green has no additionalNutrients (not yet in WS0)") — the same failure PKC2 named as pre-existing and unrelated (dated 2026-06-21, WS0.8 test-data staleness); re-confirmed unrelated to this phase's changes by filename/content, not newly introduced.
- `npx tsx server/tests/test-canonical-food.ts` — 3 pre-existing DB-staleness failures (`db=52 seed=173` for `diversity_group`, similar gaps for `food_variety`/`canonical_food_alias`) — confirmed unrelated: this phase touched zero `diversityGroupSlug` references, zero `food_variety` rows, and zero WS2A `canonical_food_alias` entries (only one WS2A `knowledgeFoodSlug` scalar value, on an already-passing row). These reflect the dev DB not having been reseeded against the current (larger) canonical seed file — a pre-existing environment-freshness gap, not caused by this phase.
- `npx tsc --noEmit` — no new errors in any file this phase touched (`shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`, `shared/canonical/foods.ts`, `server/migrations/runner.ts`).

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new key space introduced. One duplicate WS0 identity ("live-yogurt")
  retired into its correct existing identity ("yoghurt"); the canonical
  food's knowledgeFoodSlug now points at the correctly-categorised match.

☑ One owner per fact
  Food Knowledge remains solely owned by shared/knowledge/ → DB knowledge_*
  tables (unchanged owner). This phase removes a second, unauthorised
  narrator of the same "what is this food" fact that had crept in at the
  row level, not the file level PKC1 already checked.

☑ No duplicate source of truth
  Five aliases across four entries no longer claim identity with a
  separate, dedicated entry that already exists for that exact term.
  0 remaining exact-name alias/entry collisions across all 265 (now 264)
  WS0 entries, verified by script, not sampled.

☑ Honest gaps, never fabrication
  No new claim authored. Every nutrient/benefit fact merged onto "yoghurt"
  already existed, reviewed, on "live-yogurt" — this phase relocates
  existing editorial content, it does not add new facts. The one
  genuinely out-of-scope item found (allergen coverage, E1) is named and
  left exactly as unauthored as it is, per the file's own explicit
  human-only authoring rule.

☑ Extends existing architecture, does not invent new architecture
  Uses the seed file, the existing migration runner pattern, and the
  existing FK cascade — no new table, adapter, endpoint, or lifecycle.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no route, auth, or capability surface touched.
☑ Privacy — no user/household data touched; editorial seed content only.
☑ Performance — negligible: one fewer row in a 264-row in-memory-cached
  registry; no new query pattern.
☑ Observability — the migration is logged by the existing runner's
  per-migration console output (unchanged mechanism); no new failure mode.
☑ Accessibility — n/a, no UI touched.
☑ Trust — this is a Trust action: before this phase, a user could see
  "Live Yogurt" and "Yoghurt" as two separate, overlapping catalog entries
  in the same knowledge search, and a pantry ingredient named "savoy
  cabbage"/"spelt flour"/"tahini" could silently resolve to a generic
  entry's context instead of the dedicated, more specific one that already
  existed for it — an invisible data-accuracy bug, not a crash. This phase
  removes that risk at its root (the shadowing alias), not merely papers
  over one instance of it.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge (Nutrition) — WS0 Knowledge Registry row-
  level identity; Canonical Food Identity (WS2A) — one knowledgeFoodSlug
  link corrected to its already-correct-categorisation match.
Declared SoT: unchanged — shared/knowledge/ → DB knowledge_* tables
  (Food Knowledge); shared/canonical/foods.ts → DB canonical_food /
  food_variety (Canonical Food Identity). This phase corrects content
  *within* the declared owner; it does not change who the owner is.
New store created? NO.
Existing store extended? NO — no schema change (the one migration is a
  DELETE against an existing table/row shape, not a new column/table).
Consumer created? NO.
Consumer retired? NO — no consumer file changed; every consumer of WS0
  (nutrition-knowledge-registry.ts, FoodReport.tsx via the evidence
  composer, meal/food intelligence assemblers, Pantry/Boost) continues to
  read the same functions, now returning content with the duplicate/
  shadowing removed.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Knowledge (Nutrition) row-level identity; Canonical Food Identity
  knowledgeFoodSlug integrity (PKCA1 §6.1 completion criterion for the
  Canonical Food Identity cluster).

Current Canonical Owner:
  Unchanged — shared/knowledge/ → DB knowledge_* tables (Food Knowledge),
  shared/canonical/foods.ts → DB canonical_food (Canonical Food Identity).

Current Runtime Consumer(s):
  Unchanged set of consumers (nutrition-knowledge-registry.ts and every
  surface built on it) — this phase changes the data they read, not who
  reads it.

Duplicate Owners Remaining:
  NONE newly found. The one duplicate found and closed this phase
  (live-yogurt/yoghurt) was a row-level duplication inside the single
  declared WS0 owner — not a second store, and now resolved.

Duplicate State Remaining:
  NONE for the checks this phase ran: knowledgeFoodSlug links (264/264
  resolve, 0/265→264 WS0 foods unlinked), diversityGroupSlug links
  (173/173 resolve), exact-name alias/entry collisions (0/264 remaining).
  canonical-map.json investigated and confirmed NOT a duplicate of
  Canonical Food Identity (different domain — Shopping State
  categorisation — see "What This Phase Found" above); left unchanged.

Duplicate Workflows Remaining:
  green-beans/runner-beans' shared "string beans" alias — confirmed a
  genuine real-world naming ambiguity between two distinct vegetables,
  not a duplicate-knowledge defect; deliberately left unchanged (see
  "What This Phase Found").
  Recipe licence/attribution "one mouth" adapter (PKCA1 §7 Phase 2) —
  investigated, found already-converged on inspection, but not verified
  to the same depth as Food Knowledge in this phase given a concurrent,
  unrelated in-flight workstream touching one of its consumer files;
  named as the natural next candidate for a future phase to verify
  properly, not assumed safe.

Current Convergence (%):
  Row-level identity convergence for Food Knowledge (the specific check
  this phase ran, not previously checked by PKC1/PKC2): 100% — 0 broken
  links, 0 orphans, 0 exact-name alias/entry collisions, verified by
  script across all 264 remaining WS0 entries and all 254 WS2A canonical
  foods, not sampled.

Target Convergence (%):
  100% — met by this phase for the specific integrity checks it ran.
  This does not claim 100% convergence for every possible duplication
  shape (e.g. two entries describing the same food via completely
  different, non-overlapping alias words would not be caught by this
  phase's automated scan) — a residual risk named honestly, not claimed
  closed beyond what was actually checked.

Next Planned Milestone:
  A future phase that verifies (not assumes) recipe licence/attribution's
  "one mouth" status once the concurrent MealDB-activation workstream in
  this working tree lands, per PKCA1 §7 Phase 2.
```

---

## DEFINITION OF DONE

**What success looks like:**
- Every `knowledgeFoodSlug` reference in WS2A resolves to a real WS0 entry, and every WS0 entry has at least one inbound canonical link (verified by script, not sampled: 264/264 links resolve, 0 orphans — was 1 orphan before this phase).
- No WS0 entry's alias list claims exact-name identity with a separate, dedicated entry that already exists for that term (verified by script: 0 remaining, was 4 before this phase, plus the yoghurt case fixed by direct reading).
- No editorial content was lost — every nutrient/benefit fact and every alias term reachable before this phase remains reachable after it (either on the surviving merged entry, or — for `green-beans`/`runner-beans` — deliberately left alone because it was never a duplicate to begin with).
- One item (allergen coverage) was correctly identified as *out of scope for AI implementation* by the target file's own explicit authoring rule, and named rather than silently skipped or worked around.

**What must not break:**
- `validateKnowledgeSeed()` continues to report 0 problems.
- Every existing knowledge/food-report/evidence-gate test continues to pass (pre-existing, named, unrelated failures excepted — see Verification above).
- `npm run seed:knowledge` remains a pure idempotent upsert; the new migration is the only mechanism that removes the retired row, and only that one specific row.

**Manual verification (performed this session):** see the "Verification performed this session" list above — every command and its result is reproducible against current HEAD.

---

## DATA IMPACT

- Reads existing data: YES — `shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`, `shared/canonical/foods.ts`, `shared/canonical/diversity-groups.ts`, `server/data/canonical-map.json`, and their live-DB-backed test suites.
- Writes new data: NO new facts. The migration performs one `DELETE` against an already-existing row shape.
- Changes meaning of existing data: Narrowly, yes — the specific alias terms `"savoy cabbage"`, `"white cabbage"`, `"spelt flour"`, `"tahini"` now resolve (via `nutrition-knowledge-registry.ts`'s alias index) to their dedicated entries rather than being contested between two entries; the canonical "Yoghurt" food's knowledge link now points at `yoghurt` rather than `live-yogurt` (same underlying facts, now composed from the correctly-categorised source row). No fact's *content* changed meaning — which row a term resolves to changed, in the direction of more specific, more accurate data.
- Requires backfill: NO — the accompanying migration handles the one already-seeded row that needed retiring; everything else is seed-file-only and propagates on the next `npm run seed:knowledge`.

---

## TRUST CHECK

- **Could this mislead the user?** No — the opposite. Before this phase, a Pantry Explore search for "yoghurt" could surface two overlapping catalog entries, and an ingredient literally named "savoy cabbage", "spelt flour", or "tahini" could silently resolve to a less specific entry's nutrient/benefit context depending on DB row order. This phase makes the resolution deterministic and points every one of those terms at the entry that was actually written for it.
- **Could this fabricate certainty?** No. No new claim, source, or nutrient fact was authored — content was relocated (yoghurt/live-yogurt merge) or a stale, shadowing alias was removed (the other four).
- **Is anything guessed but shown as real?** No. Every change traces to a specific, reproducible script output or direct file read, shown in "What This Phase Found" above.
- **What happens if the system is wrong?** If a future audit finds another shadowing pair this phase's exact-name scan missed (e.g. a synonym pair with no shared substring), the correction is the same shape this phase itself performed — read both entries, confirm which is the dedicated one, merge or trim, verify with the same script.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered beyond the declared scope: **YES** — every change is confined to which row five specific alias terms resolve to, and which one row a canonical food's knowledge link points at.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-pkc3-launch-knowledge-wave1-20260704` → `ff3b2cf`.
- Files changed by this phase:
  - `shared/knowledge/foods.ts` — deleted the `live-yogurt` entry; enriched `yoghurt`'s aliases; removed 4 stale aliases from `cabbage` (×2), `spelt`, `sesame-seeds`.
  - `shared/knowledge/relationships.ts` — removed `live-yogurt`'s `FOOD_NUTRIENTS`/`FOOD_BENEFITS` rows; merged `live-cultures` onto `yoghurt`'s nutrient row.
  - `shared/canonical/foods.ts` — one `knowledgeFoodSlug` value changed, `"live-yogurt"` → `"yoghurt"`.
  - `server/migrations/runner.ts` — one new migration entry appended (`2026-07-04_pkc3_retire_live_yogurt_duplicate`).
  - `docs/implementation/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md` — this file, new.
- Rollback commands: `git checkout rollback/before-pkc3-launch-knowledge-wave1-20260704 -- shared/knowledge/foods.ts shared/knowledge/relationships.ts shared/canonical/foods.ts server/migrations/runner.ts` reverts the four edited files; `rm docs/implementation/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md` removes the new one. Note: if the migration has already run in an environment, rolling back the seed files without also re-seeding will leave that environment temporarily without a `live-yogurt` row and without a merged `yoghurt`/`live-yogurt` distinction — re-run `npm run seed:knowledge` against the rolled-back files to restore the pre-phase state exactly.
- Verification after rollback: `git diff rollback/before-pkc3-launch-knowledge-wave1-20260704 -- shared/knowledge/ shared/canonical/foods.ts server/migrations/runner.ts` shows no differences; `npx tsx server/tests/test-knowledge-registry.ts` shows `KNOWLEDGE_SEED_COUNTS.foods: 265` (pre-phase count) once re-seeded.

---

## SCOPE LOCK

**Implemented scope (this phase):** exactly PKC3 Wave 1 as scoped by this session's own candidate survey — verify (against actual repository state, not any document's claim) the WS0-knowledge ↔ WS2A-canonical identity integrity named as an open completion criterion in PKCA1 §6.1; find and fix the one real duplicate-knowledge defect that verification surfaced (`live-yogurt`/`yoghurt`) plus four further instances of the same shape found by extending the check platform-wide (`cabbage`, `spelt`, `sesame-seeds`); add one migration so an already-seeded duplicate is actually retired, not merely absent from a future re-seed; verify `diversityGroupSlug` integrity as a second, related check (found already fully converged); investigate and explicitly rule in/out three other Wave 1 candidates (allergen coverage — blocked by the target file's own human-only authoring rule; `canonical-map.json` — confirmed a different domain, not a duplicate; recipe licence/attribution — investigated, provisionally converged, deferred given a concurrent unrelated workstream in the same files).

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any authoring of new allergen definitions (fish, celery, lupin, molluscs, sulphites) — `restriction-library.ts`'s own header forbids AI/DB-generated content for this file; this is an editorial task for a human author, not an engineering one.
- Any change to `server/data/canonical-map.json`, `item-resolver.ts`, or `normalise-categories.ts` — investigated and confirmed to serve a genuinely different domain (Shopping State categorisation), not a Canonical Food Identity duplicate; left untouched.
- Any change to `green-beans`/`runner-beans`'s shared `"string beans"` alias — confirmed a genuine real-world naming ambiguity between two distinct foods, not a duplicate-knowledge defect.
- Any change to recipe licence/attribution (`recipe-source-gate.ts`, `shared/recipe-acquisition.ts`, `external-meal-service.ts`) — investigated, provisionally found already converged, but deliberately not touched given a concurrent, unrelated, uncommitted workstream already modifying one of its consumer files in this working tree; named as the natural PKCA1 §7 Phase 2 candidate for a future phase once that other work lands.
- PKCA1 §7 Phases 3–6 (Evidence & Learning's first reporter/consumer, Preparation Knowledge build-out, demand-driven prioritisation, Retailer/Partner scope decisions) — unrelated to this phase's Food Knowledge/Canonical Identity scope.
- Any change to the other workstreams sitting uncommitted in the same working tree (EWO2, EWX1, FI5, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture, the MealDB activation work) — untouched, left exactly as found.

**Suggestions (not implemented without approval):**
- Extend this phase's automated exact-name alias/entry collision scan into a standing check inside `validateKnowledgeSeed()` itself, so a future editorial addition that introduces the same shadowing shape (a new dedicated entry whose name is already an alias on an existing generic entry) fails seed validation immediately, rather than requiring another manual audit pass to catch it. Not implemented here because it changes the seed's own validation contract — a decision worth its own explicit sign-off rather than folding into a content-fix phase.
- Once the MealDB activation workstream lands, run this same "verify against HEAD, not against the architecture doc's claim" method against recipe licence/attribution (PKCA1 §7 Phase 2's actual remaining candidate) to confirm or correct the "provisionally converged" finding above.
