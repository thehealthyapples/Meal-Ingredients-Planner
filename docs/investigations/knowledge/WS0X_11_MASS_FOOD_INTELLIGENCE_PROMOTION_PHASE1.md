# WS0X.11 — Mass Food Intelligence Promotion, Phase 1

**Classification:** 🔴 RED — Large-scale canonical food promotion / core Food Intelligence platform
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Completed — **validation + queue only. ZERO foods promoted** (trust-first outcome, see below).
**Governing documents:** WS0X_10_PROGRESSIVE_FOOD_INTELLIGENCE_PROMOTION_MODEL.md · WS0X_10A_PROGRESSIVE_FOOD_INTELLIGENCE_IMPLEMENTATION.md · WS0X_9_FOOD_INTELLIGENCE_MASS_PROMOTION_STRATEGY.md · THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md

---

## HEADLINE OUTCOME

Phase 1 was scoped as a controlled Level-1 mass promotion. On execution, **every candidate in the "ready" set failed a real trust gate** (duplicate, non-H1, or species-level fork with an existing identity). Per the project's own Trust Check rule — *"If a promoted food could mislead users, create duplicate identities, or reduce resolver accuracy: do not promote it. Report it instead."* — the correct, trust-preserving outcome is to **promote nothing this pass** and hand THA a validated decision queue.

This is not a failure of the pipeline; it is the safety machinery working exactly as designed. The optimistic "8 ready_for_canonical" headline from WS0X.9 collapses to **0 trust-safe promotions** once the candidates are checked against the *actual current contents* of both food stores rather than against the readiness score alone.

| Metric | Value |
|---|---|
| Foods promoted | **0** |
| Candidates evaluated (ready set) | 5 (live computation; WS0X.9 report said 8 — see *Discrepancy* below) |
| Candidates blocked / deferred | 5 (1 duplicate, 1 non-H1, 2 species-fork, 1 naming-collision) |
| Schema changes | 0 |
| UI changes | 0 |
| Source-of-truth files written | 0 (`shared/canonical/foods.ts`, `shared/knowledge/foods.ts` untouched) |
| Data rows written | 0 |

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Committed baseline tag | `rollback/ws0x11-mass-promotion-20260625` → `a8a912a` (*feat(ws0x7): Ingredient Resolution Engine Completeness Program*) |
| Full dirty-tree snapshot | `rollback/ws0x11-worktree-snapshot-20260625` → `aae7f35` (stash-style commit capturing the entire pre-promotion working tree, incl. all in-progress WS0X.5–9 work) |
| File backups | `…/scratchpad/ws0x11-backup/{foods.ts,index.ts,promotion-validator.ts}.orig` (sha1 `05efd7f7…`, `c68e1570…`, `8289c753…`) |
| Working tree at start | **NOT clean** — 17 modified tracked files + untracked docs/modules from in-progress workspaces WS0X.5–9. |

**Why protection is sound despite a dirty tree.** The committed tag fixes the last-commit baseline; the worktree-snapshot tag captures the *exact* uncommitted state of every file (so nothing in-progress can be lost); the three file backups give a precise file-level revert path for the files this task was most likely to touch. All three were confirmed present **before** any evaluation began. **No implementation began until rollback protection was confirmed.**

**Rollback is trivial for this workspace** because it wrote nothing — there is no data, schema, or source change to revert. The protections exist as a precondition of the RED process and as cover for the (declined) promotion path.

---

## DECISION RECORD — Level-1 catalogue visibility (resolves a doc contradiction)

WS0X.10A Suggestion #6 flagged an unresolved contradiction between the two governing documents and deferred it to this workspace. It is resolved here:

> **DECISION: Level-1 foods (`tier='catalogue'` / `status='draft'`) ARE user-visible** — resolvable, counted toward Plant Diversity, and nutrition-bearing where a nutrient link exists. Context, benefits, and editorial prose remain *suppressed* (never blank) until enriched to Level 2/3.
>
> This **supersedes WS0X.9 Safeguard 4** ("Dual-Mode Promotion — `tier='catalogue'` is not user-visible"). The earlier safeguard predates the Progressive Food Intelligence model (WS0X.10) and is retired. The visibility gate is no longer the tier flag; it is the per-field suppression already proven in WS0X.10A Part 5 (the UI shows only trusted, present information and hides everything absent).

No read path was changed to enact this in Phase 1 (no foods were promoted), but the decision governs the future importer.

---

## ARCHITECTURAL FINDING — the runtime does not read the canonical spine

A material discovery that reframes what "promotion" must touch:

- **The runtime Food Intelligence surfaces read the WS0 Knowledge Registry, not the canonical spine.** Meal Detail Food Intelligence (`server/services/meal-food-intelligence.ts`), Nutrition Report, and Plant Diversity resolve through `nutrition-knowledge-registry` → the `food_knowledge` table (seeded from `shared/knowledge/foods.ts`).
- **Nothing in `server/` reads `canonical_food` or the canonical resolver at runtime** — only the seed runner and tests do (verified by grep across `server/`).
- Therefore the `canonical_food` spine governs **identity / aliases / diversity-grouping / anti-fork**, while **nutrient & benefit intelligence lives in the WS0 knowledge registry**. "Level 1 = identity + nutrients" spans **two stores**: a food is only *useful on the surfaces* once it exists as a **knowledge food** (with controlled-vocabulary nutrients + benefit links), not merely as a canonical identity.
- Consequence: a true Phase-1 promotion that improves user-facing surfaces requires **editorial authoring into the knowledge registry** (controlled-vocab nutrients from `FOOD_NUTRIENTS`, benefits from the existing 15-benefit taxonomy). It is *not* a mechanical USDA-macro import. This is exactly the "ready_for_claude_authoring / needs_tha_review" step WS0X.9 identified as the real bottleneck.

---

## PART 1–4 — CANDIDATE DISCOVERY & VALIDATION

**Source pool:** `data/usda-snapshot/ws011-usda-500.json` (500 USDA FoodData Central ingredient-level foods, Foundation + SR Legacy), run live through the WS0.10 catalogue pipeline (`ingestFood`) → WS0.12 readiness scorer (`scorePromotionReadiness`).

**Candidate set:** foods scoring `ready_for_canonical` (score ≥ 90, name ≠ manual, category mapped, ≥ 4/5 key macros). Each was then put through the full validation stack: `validatePromotion()` (prepared/composite, brand, name-quality, bean-duplicate, slug-duplicate, blocked-category, H1 allow / non-H1 block, anti-fork alias_key), **plus a cross-check against the actual current contents of both `CANONICAL_SEED` and the WS0 `FOOD_SEED` knowledge registry**, plus a UK-household-relevance and naming-collision judgment.

### Discrepancy: "8 ready" (WS0X.9 report) vs 5 (live)

The committed `ws012-normalisation-report.json` records `ready_for_canonical: 8`. Live computation against the current (in-progress) pipeline returns **5**. The report is a frozen artefact generated before subsequent in-progress changes to the pipeline/scoring/dedup modules. The live figure is authoritative for this workspace. Either way the *trust* conclusion is identical: the ready set does not survive validation.

### Validation results — full disposition table

| Candidate | Slug | Sci. name | `validatePromotion` | In canonical? | In knowledge? | Disposition | Trust reason |
|---|---|---|---|:--:|:--:|---|---|
| Chickpea Flour | `chickpea-flour` | — | **blocked** | ✅ | ✅ | **Duplicate — do not promote** | Already a full-quality food in **both** stores (`foods.ts:1434`, nutrients + 3 benefits). Re-creating it is a fork. |
| Dove | `dove` | — | needs_review | ❌ | ❌ | **Reject — do not promote** | In `NON_H1_EXPLICIT_BLOCK`; "Dove, cooked (includes squab)" is a *cooked game* item, not a UK-supermarket family food. Promoting it would look absurd and erode trust. |
| Chicory Greens | `chicory-greens` | *Cichorium intybus* | needs_review | ❌ | ❌ | **Defer — fork risk** | **Same species** as the existing `chicory` food (`foods.ts:340`, also canonical `foods.ts:758`). A separate identity forks chicory. Resolve via editorial merge, not a new food. |
| Chicory Roots | `chicory-roots` | *Cichorium intybus* | needs_review | ❌ | ❌ | **Defer (H2/H3)** | Same species as `chicory`; raw chicory **root** is not a UK retail staple (it is an inulin/coffee feedstock). Low household relevance; not H1. |
| Endive | `endive` | *Cichorium endivia* | needs_review | ❌ | ❌ | **Defer — needs THA H1 sign-off** | Genuinely distinct species (frisée/escarole). The only defensible candidate — but "endive" collides in UK usage with **"Belgian endive," already an alias of `chicory`** (`foods.ts:341` knowledge, `foods.ts:762` canonical). Promoting needs (a) an editorial naming decision and (b) THA H1 confirmation. |

**Why none auto-qualified:** `validatePromotion` only returns `level_1`/`h1_qualify` for slugs on the curated `H1_UK_EXPLICIT_ALLOW` trust gate. None of the 5 are on it, so all land at `needs_review`. WS0X.9 (Automation Review, line 261) states H1 tier determination is *"Per-batch: THA confirms availability tier"* — i.e. adding to the allow-list is an explicit human decision, **not** something this automated pass may self-authorise.

---

## PART 5 — PLATFORM GROWTH MEASUREMENT (before / after)

Because zero foods were promoted, **after == before**. The numbers are the true current platform state (current working tree), recorded as the baseline for the future importer.

| Metric | Before | After | Δ | % |
|---|---:|---:|---:|---:|
| Canonical foods | 249 | 249 | 0 | 0% |
| Canonical aliases | 714 | 714 | 0 | 0% |
| Canonical varieties | 57 | 57 | 0 | 0% |
| Diversity groups | 173 | 173 | 0 | 0% |
| Knowledge foods (WS0) | 265 | 265 | 0 | 0% |
| Foods with nutrient intelligence | 265 | 265 | 0 | 0% |
| Canonical→knowledge nutrient links | 245 | 245 | 0 | 0% |
| Ingredient Resolution / Meal Detail / Nutrition Report / Pantry / Discovery / Planner / Shopping coverage | unchanged | unchanged | 0 | 0% |

No surface coverage changed because no food entered either store. This is the intended, honest result of a trust-first pass.

---

## PART 6 — MULTI-FEATURE VALIDATION

No source file, schema, or read path was modified, so there is **no blast radius** and nothing to regress.

| Feature | Status | Reason |
|---|---|---|
| Meal Detail · Nutrition Report · Pantry Explore · Planner · Shopping · Discovery · Simply Better Choices · Ingredient Resolution Engine · Canonical Resolver | No change | No food added to either store; no code touched. |

---

## PART 7 — QUALITY AUDIT (candidate sample)

The five candidates *are* the sample. Each was individually inspected: identity, scientific name, proposed aliases, USDA-derived macros, category mapping, resolver/duplicate behaviour, and cross-store presence. The audit found **2 hard duplicates/blocks** (`chickpea-flour`, `dove`) and **3 species/naming hazards** (`chicory-greens`, `chicory-roots`, `endive`) — every one a reason **not** to promote. No fabricated information was introduced because nothing was authored.

---

## PART 8 — MANUAL USER TESTS

Because the platform is unchanged, the manual test is a **negative confirmation**:

1. Open several meals (containing tomato, chickpeas, salmon, spinach) → Food Intelligence renders exactly as before; no new foods appear.
2. Open Nutrition Report / Pantry Explore / Discovery → counts and coverage identical to pre-WS0X.11.
3. Search "endive", "chicory", "chickpea flour" → resolve to the **existing** identities (chicory keeps "Belgian endive"; chickpea-flour resolves to the single existing food) — confirming no duplicate/fork was introduced.
4. Programmatic confirmation: `npx tsx server/tests/test-canonical-food.ts` → resolver + counts green and unchanged.

---

## PART 9 — FINAL PLATFORM REPORT & READINESS

**Current platform:** 249 canonical foods · 714 aliases · 57 varieties · 173 diversity groups · 265 knowledge foods (all with nutrient intelligence) · 245 canonical→knowledge nutrient links.

**Readiness for milestones (per WS0X.9, re-confirmed):**

| Target | Readiness | Gating reality exposed by Phase 1 |
|---|---|---|
| **500 foods** | Mechanically reachable; **gated by editorial authoring**, not the pipeline | The bottleneck is knowledge-registry authoring (controlled-vocab nutrients + benefit links) + per-batch THA H1 confirmation — *not* canonical-identity creation. Auto-promotion from the readiness score alone is unsafe (this pass proved 5/5 ready foods tripped trust gates). |
| **1,000 foods** | 1–2 weeks of authoring throughput once an H1 allow-list expansion + authoring queue exist | Requires the H1 allow-list to be systematically extended (THA, per-batch) and a knowledge-authoring workflow. |
| **2,000 foods** | 3–5 weeks | Approx. the full validated USDA ingredient set at Level 1, contingent on the above. |

**The single most important readiness insight:** mass promotion is **authoring-bound and THA-decision-bound**, not pipeline-bound, and the readiness score is a *triage signal, not a promotion authorisation*. It must always be composed with (a) cross-store duplicate/fork detection and (b) THA H1 confirmation.

---

## THA DECISION QUEUE (the deliverable)

Hand these five to THA for per-item sign-off. Recommended actions:

1. **`endive` (Cichorium endivia)** — *Recommend: PROMOTE after naming sign-off.* Distinct species, UK-available (frisée/escarole). Author with aliases `frisée`, `curly endive`, `escarole`; **must not** claim `Belgian endive`/`witloof`/`chicory` (those belong to the existing `chicory` identity). Add to `H1_UK_EXPLICIT_ALLOW`. Author nutrients `["fibre","folate","vitamin-k","vitamin-a"]` (grounded in USDA) + benefits from the 15-taxonomy (e.g. `gut-health`, `bone-health`). One genuinely useful, trust-safe addition.
2. **`chicory-greens` (Cichorium intybus)** — *Recommend: MERGE, do not create.* Same species as existing `chicory`. Fold relevant forms in as aliases/variety of `chicory` in a future enrichment pass; do not mint a new identity.
3. **`chicory-roots` (Cichorium intybus)** — *Recommend: DEFER (H2/H3).* Same species; raw root not a UK retail staple. Revisit only on demand signal.
4. **`chickpea-flour`** — *Recommend: CLOSE.* Already a full-quality food in both stores. No action; this is a dedup false-negative in the pilot snapshot worth noting for the importer's pre-flight check.
5. **`dove`** — *Recommend: REJECT permanently.* Keep in `NON_H1_EXPLICIT_BLOCK`. Cooked game; not appropriate for the THA audience.

---

## TRUST CHECK

> Could any promoted food mislead users, weaken trust, create duplicate identities, reduce resolver accuracy, or expose fabricated information?

| Risk | Answer | Why |
|---|---|---|
| Mislead users? | **No** | Nothing was promoted; nothing changed on any surface. |
| Weaken trust? | **No** | Every correctness/anti-fork/duplicate/exclusion gate was honoured; the pass *declined* to promote rather than weaken any gate. |
| Create duplicate identities? | **No** | The two duplicate/fork candidates (`chickpea-flour`, `chicory-*`) were caught and rejected precisely to prevent this. |
| Reduce resolver accuracy? | **No** | Resolver, aliases, and `alias_key` anti-fork lock are untouched. |
| Expose fabricated information? | **No** | No nutrients, benefits, context, or prose were authored. |

**The "stop and report" condition was triggered for all five candidates, and was honoured.**

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | YES |
| Writes new data | **NO** (despite the spec's default expectation — the trust gates blocked every candidate) |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Foods promoted | **0** |
| Schema changed | NO · UI changed | NO · Architecture changed | NO |

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tags | `rollback/ws0x11-mass-promotion-20260625` → `a8a912a`; `rollback/ws0x11-worktree-snapshot-20260625` → `aae7f35` (full dirty-tree) |
| File backups | `…/scratchpad/ws0x11-backup/{foods,index,promotion-validator}.ts.orig` |
| Records affected by this task | **None** — no DB rows, no source files written |
| Cleanup requirements | None. (Temporary scripts in `.ws0x11-tmp/` were removed; not committed.) |
| Verification after rollback | Trivial — there is nothing to undo. `git status` shows the same in-progress tree as at task start; `npx tsx server/tests/test-canonical-food.ts` stays green. |

---

## DEFINITION OF DONE

| Criterion | Status |
|---|:--:|
| Large-scale Level-1 promotion attempted under approved rules | ✓ |
| Canonical architecture preserved (no fork, no parallel store) | ✓ |
| No duplicate systems / schema / UI changes | ✓ |
| No fabricated information | ✓ |
| Resolver accuracy maintained | ✓ |
| Trust preserved (declined every unsafe promotion) | ✓ |
| Before/after metrics produced | ✓ |
| Visibility-policy contradiction resolved & documented | ✓ |
| Project file created | ✓ (this file) |

---

## SCOPE LOCK — confirmed

Implemented **only** the approved Phase-1 evaluation. **Did not:** promote any food · write any data · change the schema · redesign or modify any UI/Meal Detail/Planner/Pantry · create any new Food Intelligence system or parallel workflow · weaken any validation gate.

---

## SUGGESTION — future work (NOT executed here)

1. **Add a pre-flight cross-store duplicate/fork check to the future importer.** The readiness score alone is insufficient; the importer must reject any candidate whose slug **or scientific name** matches an existing canonical *or* knowledge food (`chickpea-flour`, `chicory-*` would all have been caught earlier). Anti-fork must run on `scientific_name`, not just `alias_key`.
2. **Build a THA H1-confirmation queue UI.** Promotion is THA-decision-bound; surface `needs_review` candidates with their evidence for one-click allow-list addition.
3. **Build the knowledge-authoring workflow** (controlled-vocab nutrients + 15-taxonomy benefits) — the actual bottleneck — rather than treating promotion as a canonical-identity insert.
4. **Promote `endive` as the first food** once THA signs off the naming/H1 decision recorded above. It is the single trust-safe candidate from this batch.
5. **Decide chicory-family modelling** (chicory / radicchio / chicory-greens / chicory-roots / Belgian endive) as one editorial unit to prevent piecemeal forking by future batches.

---

*Phase 1 honoured the Trust Check over the coverage target: 0 foods promoted, 5 candidates triaged, the Level-1 visibility contradiction resolved, and a THA decision queue delivered. No schema, UI, architecture, or food data changed.*
*Report location: `docs/investigations/knowledge/WS0X_11_MASS_FOOD_INTELLIGENCE_PROMOTION_PHASE1.md`*
