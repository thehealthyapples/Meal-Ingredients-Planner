# WS0X.12 — Food Intelligence Pipeline Discrepancy Investigation

**Classification:** 🟡 AMBER — Architecture investigation only. No code, schema, data, or validation changes.
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Investigation complete. No implementation.
**Governing question:** Why did a programme expected to unlock *thousands* of foods produce **zero** trust-safe promotions and only 5 review candidates?

---

## ROLLBACK PROTECTION (mandatory first step — confirmed before any investigation)

| Item | Value |
|------|-------|
| Committed baseline tag | `rollback/ws0x12-investigation-20260625` → `a8a912a` (*feat(ws0x7): Ingredient Resolution Engine Completeness Program*) |
| Rollback command (committed state) | `git checkout rollback/ws0x12-investigation-20260625` |
| Working tree at start | **Intentionally dirty** — 17 modified tracked files + ~32 untracked docs/modules from in-progress workspaces WS0X.5–11. Pre-existing; **not** created by this task. |
| This task's writes | **One file only** — this document. No code, schema, data, or validation touched. Revert = delete this file. |
| Pre-existing snapshot cover | The WS0X.11 full dirty-tree tag `rollback/ws0x11-worktree-snapshot-20260625` → `aae7f35` still captures the entire uncommitted tree from earlier today; it remains valid as a belt-and-braces snapshot. |

**Why protection is sound despite a dirty tree:** the committed tag fixes the last-commit baseline; the inherited WS0X.11 worktree-snapshot tag captures the exact uncommitted state; and this investigation writes nothing but prose. There is no data, schema, or source change to undo.

---

## HEADLINE FINDING (read this first)

The "thousands of foods" expectation was **never structurally achievable by the pipeline as built** — not because of a single bottleneck, but because of a **store-topology mismatch** that every prior investigation looked past.

> **The promotion pipeline feeds a store the runtime does not read.**
>
> - The USDA ingestion/readiness/validation pipeline promotes foods into the **canonical spine** (`canonical_food`, `tier='catalogue'`).
> - The user-facing Food Intelligence surfaces (Meal Detail, Nutrition Report, Plant Diversity, Pantry) read the **WS0 Knowledge Registry** (`knowledge_foods` + nutrient/benefit link tables), seeded from `shared/knowledge/*`.
> - **No automated path connects the two.** The only seam is a hand-set foreign key, `canonical_food.knowledge_food_slug`, which a pipeline-promoted food does not populate.

Consequently, "promote 2,000 USDA foods" through the existing pipeline would create 2,000 canonical identities that are **invisible on every intelligence surface**, because none would carry the hand-authored knowledge (nutrients, benefits, description) the runtime actually renders.

The WS0X.11 "0 promoted / knowledge authoring is the bottleneck" outcome is **directionally correct but under-diagnosed**: knowledge authoring is *a* bottleneck, but the deeper issue is that the pipeline was pointed at the wrong store, and "readiness" was measured as *data cleanliness* rather than *runtime promotability*.

There are, precisely, **three compounding gates** — see Part 3.

---

## PART 1 — THE COMPLETE PIPELINE, AS IT ACTUALLY EXISTS

Traced from source files, not from prior reports.

```
                       ┌────────────────────────── BUILD-TIME / OFFLINE ──────────────────────────┐

  USDA FoodData Central                  data/usda-snapshot/ws011-usda-500.json
  (Foundation 340 + SR Legacy 7793)  →   (build-snapshot.py; 500 selected, 295 net-new)
            │
            ▼
  shared/catalogue/pipeline.ts  ingestFood()
   • alias-resolver (US→UK)              shared/catalogue/alias-resolver.ts
   • category-mapper                     shared/catalogue/category-mapper.ts
   • name-normaliser (auto/review/man.)  shared/catalogue/name-normaliser.ts
   • confidence-scorer                   shared/catalogue/confidence-scorer.ts
   • dedup vs existing canonical
            │  → action: matched_existing | create_catalogue | review_required
            ▼
  shared/catalogue/promotion-readiness.ts  scorePromotionReadiness()   ← GATE 1 (quality score 0–100)
   • bands: ready_for_canonical (≥90) | ready_for_claude_authoring (≥50) | needs_tha_review (<50)
            │
            ▼
  shared/catalogue/promotion-validator.ts  validatePromotion()         ← GATE 2 (trust + AUTHORISATION)
   • prepared/composite, brand, name-quality, bean-dup, slug-dup, blocked-category, anti-fork
   • returns level_1 / h1_qualify  ONLY IF slug ∈ H1_UK_EXPLICIT_ALLOW (~70 hand-curated slugs)
   • everything else → needs_review
            │
            ▼  (--write)  ← NEVER RUN TO PRODUCTION; WS0X.11 promoted 0
  canonical_food  (tier='catalogue', status='draft')
            │
            ╳  ← NO AUTOMATED BRIDGE.  Only seam = canonical_food.knowledge_food_slug (hand-set FK)
            │
                       └──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────── EDITORIAL / HAND-AUTHORED (separate lineage) ──────────────────────┐
  shared/knowledge/foods.ts        FOOD_SEED (265 knowledge foods)                                  │
  shared/knowledge/relationships.ts FOOD_NUTRIENTS (265) · FOOD_BENEFITS (265) · NUTRIENT_BENEFITS  │
  shared/knowledge/nutrients.ts    NUTRIENT_SEED (30-term controlled vocab)                         │
  shared/knowledge/health-benefits.ts HEALTH_BENEFIT_SEED (15-term taxonomy)                        │
            │  server/seeds/seed-knowledge-registry.ts                                              │
            ▼                                                                                       │
  knowledge_foods + knowledge_food_nutrients + knowledge_food_benefits                              │
            │                                                                                       │
            ▼                                                                                       │
  server/services/nutrition-knowledge-registry.ts  ← THE store the runtime reads                    │
            │                                                                                       │
            ├─ server/services/meal-food-intelligence.ts  →  Meal Detail Food Intelligence          │
            ├─ Nutrition Report                                                                      │
            ├─ Plant Diversity Report                                                                │
            └─ Pantry Knowledge Hub / Explore                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────── INGREDIENT RESOLVER (a THIRD, independent store) ───────────┐
  server/lib/item-resolver.ts  ←  server/data/canonical-map.json (112 entries)
   • name → canonical category/identity for cupboard, basket, recipe import
   • This is the "resolver architecture is sound" component. It is NOT the
     Food Intelligence content store and does not gate promotion.
  └────────────────────────────────────────────────────────────────────────┘
```

**Stage inventory:** External dataset → snapshot build → catalogue ingest (alias/category/name/confidence/dedup) → readiness score (Gate 1) → promotion validation (Gate 2) → *(canonical write)* → **[BROKEN SEAM]** → knowledge registry (hand-authored) → runtime registry service → four UI surfaces. The break is between "canonical write" and "knowledge registry."

---

## PART 2 — ALL FOOD DATA LOCATIONS (audited, with live counts)

| # | Dataset | Location | Count (live) | Purpose | Read at runtime? | Promotion-ready? |
|---|---|---|---:|---|---|---|
| 1 | **Knowledge foods (WS0)** | `shared/knowledge/foods.ts` `FOOD_SEED` → `knowledge_foods` | **265** | Nutrients, benefits, description, storage, subcategory — **the content the UI renders** | ✅ YES (via `nutrition-knowledge-registry`) | N/A — already live |
| 2 | **Food→nutrient links** | `shared/knowledge/relationships.ts` `FOOD_NUTRIENTS` | **265** | Maps each food → ≤4 controlled-vocab nutrients | ✅ YES | Hand-authored |
| 3 | **Food→benefit links** | `shared/knowledge/relationships.ts` `FOOD_BENEFITS` | **265** | Maps each food → benefit slugs | ✅ YES | Hand-authored |
| 4 | **Nutrient→benefit map** | `shared/knowledge/relationships.ts` `NUTRIENT_BENEFITS` | **30** | Derivation table nutrient → benefits | ✅ YES (indirect) | Complete |
| 5 | **Nutrient vocabulary** | `shared/knowledge/nutrients.ts` `NUTRIENT_SEED` | **30** | Controlled vocab | ✅ YES | Complete |
| 6 | **Benefit taxonomy** | `shared/knowledge/health-benefits.ts` `HEALTH_BENEFIT_SEED` | **15** | Controlled vocab | ✅ YES | Complete |
| 7 | **Canonical spine** | `shared/canonical/foods.ts` `CANONICAL_SEED` → `canonical_food` | **~249 foods + 57 varieties** (307 `slug:` lines) | Identity, aliases, anti-fork, diversity grouping | ❌ **NO** (seed/tests/scripts only) | N/A — already seeded |
| 8 | **Canonical→knowledge FK** | `canonical_food.knowledge_food_slug` | **206 non-null** of ~249 | The *only* seam joining identity↔content | ✅ via adapter | **43+ canonical foods have no knowledge link** |
| 9 | **Ingredient resolver map** | `server/data/canonical-map.json` | **112** | Name→category resolution for imports | ✅ YES (resolver) | N/A — separate concern |
| 10 | **USDA pilot snapshot** | `data/usda-snapshot/ws011-usda-500.json` | **500** (295 net-new) | Pilot ingestion source | ❌ NO | 8 ready / 257 author / 30 review |
| 11 | **USDA Foundation (full)** | External (FDC) | **340** | Future ingestion | ❌ NO | Not ingested |
| 12 | **USDA SR Legacy (full)** | External (FDC) | **7,793** (~1,735 post-filter) | Future ingestion | ❌ NO | Not ingested |
| 13 | **Reports / artefacts** | `data/usda-snapshot/ws01{1,2}-*.json` | — | Frozen pilot statistics | ❌ NO | N/A |

**Two observations that matter:**
- **The runtime-relevant store (#1–6) is entirely hand-authored and capped at 265 foods.** Everything the user sees comes from here.
- **The pipeline's output store (#7) is not read at runtime, and is itself only 83% bridged to knowledge (#8: 206/249).** Even today, before any mass promotion, the two stores have drifted.

---

## PART 3 — THE BOTTLENECK, MEASURED (foods at every stage)

```
USDA available (post-filter, full)      ~2,075   ████████████████████████  (external, not in repo)
   │
   ▼ ingested in pilot snapshot
Snapshot selected                          500   ██████
   │
   ▼ net-new after dedup
Catalogue-eligible (create_catalogue)      295   ███▌
   │
   ▼ GATE 1: readiness ≥ 90 (data quality)
ready_for_canonical (report 8 / live 5)    5–8   ▏           ← Gate 1 collapses 295 → ~8
   │
   ▼ GATE 2: validatePromotion AUTHORISES (slug ∈ H1 allow-list, ~70 slugs)
auto-promotable                              0   ·           ← Gate 2 collapses ~8 → 0
   │                                                            (only chickpea-flour is on the list,
   │                                                             and it is already a duplicate)
   ▼ GATE 3: knowledge authoring exists (FOOD_SEED + nutrients + benefits)
runtime-visible new foods                    0   ·           ← Gate 3: no path writes knowledge anyway
```

**Three independent gates, each fatal on its own:**

| Gate | Where | What it measures | Pilot effect | Is it the "expected" bottleneck? |
|---|---|---|---|---|
| **1. Readiness ≥ 90** | `promotion-readiness.ts` | *Data cleanliness*: auto name (20) + category (20) + **subcategory (20)** + ≥4/5 macros (≤20) + aliases (10) + **scientific name (10)**. Needs ~90/100. | 295 → ~8. Subcategory + scientific-name requirements alone disqualify most USDA rows. | Partly — this is the quality wall, but it is a **triage signal, not an authorisation**. |
| **2. H1 allow-list** | `promotion-validator.ts` `H1_UK_EXPLICIT_ALLOW` | *Authorisation*: a hand-curated set of **~70 slugs**. Only these return `level_1`/`h1_qualify`. All others → `needs_review`. | ~8 → 0. None of the ready set is on the list (except a duplicate). | **The actual zero-maker.** Promotion is allow-list-bound, not score-bound. |
| **3. Knowledge authoring** | `shared/knowledge/*` + missing bridge | *Runtime visibility*: a food only renders if it has a `knowledge_foods` row + `FOOD_NUTRIENTS` + `FOOD_BENEFITS`. The pipeline writes none of these and there is no canonical→knowledge automation. | Even a promoted canonical food → 0 visible. | **The deepest bottleneck.** Identified by WS0X.11, but its *cause* (wrong target store) was not named. |

**Real counts at each store today:** 2,075 importable → 295 catalogue-eligible (pilot) → ~8 data-clean → 0 authorised → **265 actually visible** (the hand-authored registry, untouched by any of this).

---

## PART 4 — KNOWLEDGE REGISTRY DEPENDENCY REVIEW

**Verified by grep across `server/`:**

| Consumer | Reads | Evidence |
|---|---|---|
| Meal Detail Food Intelligence | Knowledge registry | `meal-food-intelligence.ts` imports `./nutrition-knowledge-registry` (l.13–17); pulls `knowledgeSummary` (nutrients + benefits) per food |
| Nutrition Report | Knowledge registry | via `nutrition-knowledge-registry` (`routes.ts`) |
| Plant Diversity Report | Knowledge registry | `meal-food-intelligence.ts` plant-food categories keyed off knowledge food categories |
| Pantry Knowledge Hub / Explore | Knowledge registry | `routes.ts` + registry service |
| **`canonical_food` table** | **Nothing at runtime** | Referenced only in `server/seeds/seed-canonical-food.ts`, `server/tests/*`, `server/scripts/ws011-usda-ingestion.ts` |

**Mandatory vs optional knowledge data (per WS0X.10A Progressive model, confirmed in `promotion-validator.ts` comments):**

| Field | Tier | Mandatory for runtime usefulness? |
|---|---|---|
| Knowledge food row (slug/name/category) | Level 1 | **Yes** — without it the food is not in the registry the UI reads |
| Nutrient links (`FOOD_NUTRIENTS`) | Level 1 | **Effectively yes** — Food Intelligence is nutrient/benefit-led; a food with none renders empty |
| Benefit links (`FOOD_BENEFITS`) | Level 1–2 | High value; **derivable** from nutrients via `NUTRIENT_BENEFITS` (see Part 8) |
| Description prose | Level 2 | Optional; suppressed if absent |
| Food context (availability/season/origin) | Level 2 | Optional since WS0X.10A; suppressed if absent |
| Storage, stories, pairings, seasonality copy | Level 3 | Optional |

**Verdict:** the Knowledge Registry **is** the primary runtime bottleneck — but the binding constraint within it is **nutrient linkage**, not prose or context. WS0X.10A correctly made context optional, which is why WS0X.9's stated bottleneck ("food context authoring gates every promotion") evaporated — yet promotion still produced 0, because the *real* gate (knowledge nutrient authoring + the missing bridge + the H1 allow-list) was never the one being removed.

---

## PART 5 — CANONICAL vs KNOWLEDGE

```
        ┌───────────────────────────┐         knowledge_food_slug FK          ┌───────────────────────────┐
        │      CANONICAL SPINE       │  (set null on delete; hand-set only)    │   WS0 KNOWLEDGE REGISTRY   │
        │      canonical_food        │ ──────────────────────────────────────▶ │   knowledge_foods (+links) │
        │                            │         206 / ~249 populated             │                            │
        │  • identity (slug/name)    │                                          │  • nutrients (≤4 vocab)    │
        │  • aliases (anti-fork)     │         ◀── the ONLY seam ──▶            │  • benefits (15 taxonomy)  │
        │  • diversity grouping      │                                          │  • description / storage   │
        │  • varieties               │                                          │                            │
        │  ✗ NOT read at runtime     │                                          │  ✓ READ AT RUNTIME         │
        └───────────────────────────┘                                          └───────────────────────────┘
              governs WHAT IT IS                                                    governs WHAT WE SAY
```

| Question | Answer |
|---|---|
| Can a canonical food exist **without** knowledge? | **Yes** — and 43+ do today (`knowledge_food_slug` null). It resolves and counts toward diversity, but shows **no nutrients/benefits** on intelligence surfaces. |
| Can knowledge exist **without** canonical identity? | **Yes** — the registry seeds independently; the runtime reads it directly without consulting `canonical_food`. The 265 knowledge foods do not require a canonical row to render. |
| Minimum to be **useful at runtime**? | A **knowledge_foods row + ≥1 nutrient link**. Canonical identity is *not* required for the intelligence surfaces (it is required for anti-fork resolution and diversity grouping). |
| Minimum to be **trust-safe AND useful**? | Knowledge row + curated nutrients + (derived) benefits + an anti-fork-checked canonical identity bridged via `knowledge_food_slug`. **The pipeline produces the canonical half; nothing produces the knowledge half.** |

---

## PART 6 — EXPECTED vs ACTUAL (prior investigations vs evidence)

| Report | Expectation it set | Evidence now | Reality |
|---|---|---|---|
| **WS0X.8** (Data Expansion) | Canonical system is scale-ready; large import feasible | Canonical *identity* machinery is indeed sound | True **for identity** — but identity ≠ runtime visibility. The claim quietly conflated the two stores. |
| **WS0X.9** (Mass Promotion Strategy) | "500 in 2–3 weeks, 2,000 in 3–4 months… core bottleneck is **food context authoring** that gates every canonical promotion"; "8 READY" | `validatePromotion` does **not** gate on context (WS0X.10A made it optional). Live ready set = 5, all fail Gate 2. | **Wrong bottleneck named.** Context was not the gate; the H1 allow-list + missing knowledge bridge were. The "8 ready" headline measured *data cleanliness*, not promotability. |
| **WS0X.10 / 10A** (Progressive model) | Removing the context gate unblocks Level-1 mass promotion | Context gate removed in validator — confirmed. Promotion still 0. | **Removed a non-binding gate.** The change was sound in itself but addressed a constraint that was not actually stopping promotions. |
| **WS0X.11** (Phase 1) | Execute Level-1 mass promotion | 0 promoted; 5 triaged; "knowledge authoring is the bottleneck" | **Directionally right, under-diagnosed.** Correctly stopped on trust gates and correctly spotted that the runtime reads knowledge, not canonical — but framed it as an authoring-throughput problem, not a **pipeline-targets-the-wrong-store** problem. |

**Why the assumptions were wrong:** every report measured the **canonical pipeline** and implicitly assumed *canonical promotion ⇒ user-visible food*. The runtime does not read canonical. So the readiness score (a canonical-quality metric) was treated as a promotion-readiness metric for a surface it never feeds. Each report then nominated whichever canonical-side gate was most visible (context, then H1 review) without measuring foods at the **knowledge** store where visibility is actually decided.

---

## PART 7 — MASS PROMOTION FEASIBILITY (honest answer)

**Could THA safely activate 500 / 1,000 / 2,000 foods *today*? No — at any tier.**

| Target | Blocker | Quantified remaining work |
|---|---|---|
| **500** | No automated path writes the knowledge store the UI reads; only ~70 slugs are authorised by Gate 2. | ~235 net-new knowledge foods to author (500 − 265 existing), each needing a knowledge row + nutrient links + (derivable) benefits, **plus** ~70→500 expansion of the H1 allow-list (THA per-batch sign-off), **plus** a canonical↔knowledge bridge that does not exist. |
| **1,000** | Same, larger. | ~735 net-new knowledge foods authored + bridged + allow-listed. |
| **2,000** | Same, plus data-cleanliness wall (Gate 1) on the long tail of USDA rows lacking subcategory/scientific name. | ~1,735 net-new; the long tail increasingly fails Gate 1 (subcategory + scientific name) and needs manual identity work. |

**Exactly what prevents it today:**
1. **No canonical→knowledge bridge** — promotion writes identities the UI cannot see.
2. **Gate 2 authorisation is a ~70-slug manual list**, not a function of readiness; it cannot scale by running the pipeline harder.
3. **Knowledge content (nutrients/benefits/description) is hand-authored** and not derivable from raw USDA macros by the current pipeline.
4. **Gate 1 quality wall** (subcategory + scientific name) caps the data-clean set far below the importable set.

What is *not* blocking (contrary to WS0X.9): canonical schema, resolver accuracy, food-context authoring, or UI capacity. Those are ready.

---

## PART 8 — KNOWLEDGE AUTHORING ANALYSIS (can it be automated?)

To make one food runtime-visible and trust-safe, authoring must produce:

| Artefact | Per food | Source today | Automatable? | Evidence |
|---|---|---|---|---|
| Knowledge food row (slug/name/category/subcategory) | 1 | Hand-authored | **Mostly** — pipeline already emits normalised name, category, aliases, scientific name | `pipeline.ts` produces all of these for `create_catalogue` foods |
| Nutrient links (≤4 from 30-term vocab) | ~3–4 | Hand-authored | **Partly** — USDA gives per-100g amounts; selecting the *dominant* nutrients and snapping to the 30-term vocab is mechanisable; the editorial "top-4 + confidence" needs review | `relationships.ts FOOD_NUTRIENTS`; USDA `foodNutrients` present in snapshot |
| Benefit links (from 15-term taxonomy) | ~2–3 | Hand-authored | **Largely DERIVABLE** — `NUTRIENT_BENEFITS` already maps all 30 nutrients → benefits. Given nutrients, benefits can be auto-proposed, then trimmed | `relationships.ts NUTRIENT_BENEFITS` (30 complete entries) |
| Description prose | 1 | Hand-authored | **Generatable + must be reviewed** (trust/no-fabrication) | — |
| Taxonomy links (category/subcategory) | — | Pipeline | **Yes** | `category-mapper.ts` |
| Alias review (anti-fork) | — | Pipeline + check | **Pipeline proposes; THA confirms** | `alias-resolver.ts`, `alias_key` anti-fork |
| H1 approval | 1 | THA decision | **No — human, per batch** | `H1_UK_EXPLICIT_ALLOW` is an explicit allow-list |

**How many foods need this work?** To reach 2,000: ~1,735 net-new knowledge foods. The pilot already shows the shape: of 500 USDA rows, **257 are `ready_for_claude_authoring`** (clean enough to draft) and only 30 need THA name/identity work first.

**Key automation lever (the most important finding in this part):** the chain **USDA amounts → nutrient candidates → `NUTRIENT_BENEFITS` → benefit candidates** means that *once nutrients are mapped, benefits are ~80% free*. The expensive, irreducible human steps are: (a) **top-N nutrient selection + confidence**, (b) **H1 allow-list sign-off**, (c) **description trust-review / anti-fabrication**, (d) **anti-fork alias confirmation**. Everything else is mechanisable into a *draft queue*.

**Conclusion:** knowledge authoring is **not** a fully manual 1,735-food slog. It is a *draft-then-review* problem where the draft can be machine-generated and the review is bounded to four small human decisions per food (and one of those, H1, is per-batch not per-food).

---

## PART 9 — RECOMMENDED NEXT WORKSTREAM (one only)

### Recommendation: **A — Build the Knowledge Authoring Pipeline (the canonical→knowledge bridge + draft queue).**

**Not** importer redesign (B), promotion redesign (C), or canonical simplification (D). The importer, promotion validator, and canonical spine are each individually fine; the defect is the **missing stage between them and the store the runtime reads.**

**What it is:** a build-time stage that takes a Gate-1-clean, Gate-2-trust-checked candidate (plus its USDA nutrient amounts) and emits a **draft knowledge entry** — `knowledge_foods` row + machine-proposed `FOOD_NUTRIENTS` (dominant amounts snapped to the 30-term vocab) + `NUTRIENT_BENEFITS`-derived `FOOD_BENEFITS` + a set `knowledge_food_slug` bridge — into a **review queue**, never directly to production. THA/editorial approve the four bounded decisions; approval writes the seed.

**Why this and nothing else:**
- It attacks the **deepest** of the three gates (Part 3 Gate 3 / the broken seam in Part 1) — the one that makes the other two moot. Fixing Gate 2 (allow-list) or Gate 1 (quality) without this still yields **0 visible foods**.
- It **reuses** every sound component (resolver, pipeline, validator, canonical spine, controlled vocabularies, `NUTRIENT_BENEFITS`) — no duplication, no schema change, no architecture rewrite.
- It converts mass promotion from an impossible "author 1,735 foods by hand" task into a **bounded review-throughput** task with machine-drafted content (Part 8).
- It preserves trust: nothing is auto-published; the no-fabrication rule holds because every drafted field is either USDA-grounded (nutrients), derivation-grounded (benefits), or explicitly human-reviewed (description, H1).

**Sequence within it (do not implement now):** (1) bridge + draft-emitter; (2) THA H1-confirmation queue UI to scale the allow-list per batch; (3) editorial review surface for nutrient/description sign-off; (4) only then run the full ~2,075-food ingest into the draft queue.

---

## TRUST CHECK

> **Did previous investigations overestimate promotion readiness?**

**Yes — materially.** WS0X.9 forecast "500 in 2–3 weeks, 2,000 in 3–4 months" and named "food context authoring" as the core bottleneck. Both were wrong: the forecast measured a canonical-quality score as if it authorised runtime-visible promotion, and the named bottleneck was a non-binding gate that WS0X.10A then removed — after which promotion was still 0.

**Why the overestimate happened:**
1. **Store conflation** — canonical promotion was treated as equivalent to user-visible food; the runtime reads a different (hand-authored) store.
2. **Metric substitution** — `scorePromotionReadiness` (data cleanliness) was read as promotion-readiness for a surface it does not feed.
3. **Gate mis-attribution** — each report nominated the most visible canonical-side gate (context, then H1 review) without measuring foods at the knowledge store where visibility is actually decided.
4. **Artefact drift** — the "8 ready" figure was a frozen report number; live recomputation gives 5. Frozen artefacts were cited as current truth.

**How future estimates stay evidence-based:**
- **Count foods at every store**, not one: importable → catalogue → data-clean → authorised → **knowledge-bridged** → runtime-visible. Report all six.
- **Define "promotable" as "produces a trust-safe, runtime-visible knowledge entry,"** never "scores ≥ N."
- **Recompute live**; never cite a frozen report figure as current state.
- **Name the binding gate by measurement**, not by which one is most familiar from the last report.

---

## DEFINITION OF DONE

| Criterion | Status |
|---|:--:|
| Complete pipeline traced (source → runtime → surfaces) | ✓ Part 1 |
| All food datasets identified with live counts | ✓ Part 2 |
| Bottleneck measured (real counts at every stage) | ✓ Part 3 |
| Canonical vs knowledge clarified (+ diagram) | ✓ Part 5 |
| Runtime dependencies documented | ✓ Part 4 |
| Previous assumptions validated/corrected | ✓ Part 6 + Trust Check |
| Single next workstream recommended | ✓ Part 9 (A) |
| Project file created | ✓ this file |

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | YES |
| Writes new data | **NO** |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Code / schema / validation / architecture changed | **NO** |

---

## SCOPE LOCK — confirmed

Investigation only. Did **not**: modify code · promote foods · change validation · change architecture · write data · alter any UI. Implementation ideas are isolated below under SUGGESTION.

---

## SUGGESTION — implementation ideas (NOT executed; for a future workstream)

1. **Knowledge Authoring Pipeline (the recommendation).** Build-time stage: validated candidate + USDA amounts → draft `knowledge_foods` row + machine-proposed nutrient links (dominant amounts → 30-term vocab) + `NUTRIENT_BENEFITS`-derived benefit links + set `knowledge_food_slug` → **review queue**, never auto-publish.
2. **THA H1-confirmation queue UI.** Surface `needs_review` candidates with evidence for one-click `H1_UK_EXPLICIT_ALLOW` addition, so Gate 2 scales per batch instead of per hand-edit.
3. **Bridge backfill audit.** 43+ existing canonical foods have a null `knowledge_food_slug`; reconcile the 265 knowledge ↔ ~249 canonical drift before adding more.
4. **Pre-flight cross-store dedup** (carried from WS0X.11 #1): reject candidates whose slug **or scientific name** matches an existing canonical *or* knowledge food (would have caught `chickpea-flour`, `chicory-*`).
5. **Benefit auto-derivation utility.** Given `FOOD_NUTRIENTS[slug]`, propose `FOOD_BENEFITS[slug]` via `NUTRIENT_BENEFITS`; editorial trims. Cheap, high-leverage, trust-safe.
6. **Reporting discipline.** Replace frozen-artefact citations with a live six-store counter (importable → catalogue → data-clean → authorised → bridged → visible).
7. **Promote `endive` first** once THA signs off naming/H1 (the single trust-safe candidate from WS0X.11) — but only *through* the new authoring pipeline, to prove the bridge end-to-end.

---

*Report location: `docs/investigations/WS0X_12_FOOD_INTELLIGENCE_PIPELINE_DISCREPANCY_INVESTIGATION.md`*
*Rollback: `git checkout rollback/ws0x12-investigation-20260625` (committed state) · delete this file to revert this task's only write.*
