# WS0X.10A — Progressive Food Intelligence Implementation

**Classification:** 🔴 RED — Core promotion workflow / canonical platform
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Implemented — two validation rules relaxed; no schema, no UI, no architecture, no food promotions
**Governing documents:** WS0X_10_PROGRESSIVE_FOOD_INTELLIGENCE_PROMOTION_MODEL.md · WS0X_9_FOOD_INTELLIGENCE_MASS_PROMOTION_STRATEGY.md · THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
**Implements:** Option C — Hybrid model (mandatory Level 1, optional progressive enrichment), as recommended in WS0X.10 Part 9.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/ws0x10a-progressive-fi-impl-20260625` |
| Points to | HEAD commit `a8a912a` — *feat(ws0x7): Ingredient Resolution Engine Completeness Program* |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| File backups | `…/scratchpad/ws0x10a-backup/index.ts.orig` (sha1 `f53f4964…`), `…/promotion-validator.ts.orig` (sha1 `3bf4aa43…`) |
| Working tree at start | **NOT clean** — 47 entries (17 modified tracked files + untracked docs/modules from in-progress workspaces WS0X.5–WS0X.9). |

**Why the tree was not clean, and why protection is still sound.** The two files edited by this task are themselves part of the uncommitted in-progress work — `shared/catalogue/promotion-validator.ts` and `shared/canonical/food-context.ts` do not exist at HEAD, and `shared/canonical/index.ts` is modified vs HEAD. A clean tree could not be achieved without committing or discarding other workspaces' in-progress work, which is outside this task's authority. Therefore, in addition to the HEAD tag (committed baseline), an **exact working-tree backup of each file edited** was taken into the scratchpad with sha1 checksums *before* any edit. This gives a precise, file-level revert path for this task's changes that does not disturb the surrounding in-progress work. No implementation began before both protections were confirmed present.

---

## IMPLEMENTATION SUMMARY

THA ran a **complete-before-visible** promotion model: a food could not enter the canonical platform until it carried fully-authored food context (`availability`, `peakSeasons`, `originRegion`). Two validation rules enforced this:

- **Gate B — seed integrity** (`validateCanonicalSeed`): every canonical food missing a `FOOD_CONTEXT_SEED` entry produced a *fatal* problem and the seed runner aborted.
- **Gate A — promotion validation** (`validatePromotion`): an H1-allowed candidate missing context was returned as `blocked`.

WS0X.10 established that this gate — not the canonical machinery, schema, or UI — is the growth bottleneck, and that food context is already *optional at the presentation layer* (absent context is suppressed, never blank). The architecture was designed for partial population: every Level-2/3 field is nullable, and the `status`/`tier` staging columns already exist.

This implementation switches the model to **Progressive Enrichment** (Option C):

> A food becomes available the moment it has the trusted **Level 1** minimum — canonical identity (`slug`/`name`/`category`), aliases (anti-fork), classification, and nutrient linkage where available. Food context, benefits, seasonality, origin, storage, stories and pairings are **optional enrichment** that accretes over time on the *same* canonical record. They no longer block promotion.

Exactly **two validation rules** changed. No schema change, no UI change, no new store, no parallel workflow, no food promoted, no food imported.

---

## FILES CHANGED

| File | Change | Lines |
|------|--------|-------|
| `shared/canonical/index.ts` | Added `isContextRequired(food)` + `canonicalSeedContextWarnings()`; gated the "missing food context" fatal error in `validateCanonicalSeed()` on `isContextRequired()`. | +~45 |
| `shared/catalogue/promotion-validator.ts` | Added `"level_1"` to `PromotionValidationStatus`; changed the H1-allow context-missing outcome from `blocked` → `level_1` (context pending); aligned the default-path message; updated module header. | ~+15 / -7 |

No other files were touched. `shared/canonical/food-context.ts`, the resolver, the schema, the seed runner, and every UI surface are unchanged.

---

## VALIDATION CHANGES (the only two rule changes)

### Gate B — `validateCanonicalSeed()` (`shared/canonical/index.ts`)

```
Before: for every canonical food, missing FOOD_CONTEXT_SEED entry  → FATAL (seed aborts)
After:  missing context is FATAL only when isContextRequired(food) is true
        isContextRequired = NOT (tier === "catalogue" OR status === "draft")
        → curated editorial foods (tier="canonical", status="active") STILL require context
        → Level-1 staged foods (catalogue tier / draft status) may seed without context;
          recorded as a TRACKED, non-fatal coverage gap via canonicalSeedContextWarnings()
```

Defaults match the DB column defaults (`tier="canonical"`, `status="active"`), so a seed food that sets neither is treated as curated. **Behaviour on today's seed is unchanged** — all 249 canonical foods are curated tier with full context; `validateCanonicalSeed()` still returns 0 problems.

**Unchanged and still fatal:** referential integrity (FK validity), duplicate slug/variety/group detection, alias parent FK, valid alias type, **unique `alias_key` anti-fork lock**, resolver key-collision detection, and — critically — **controlled-vocabulary validation of any context that IS present** (`validateFoodContext`). A malformed context value still blocks the seed.

### Gate A — `validatePromotion()` (`shared/catalogue/promotion-validator.ts`)

```
Before: H1-allow candidate, getFoodContext() === undefined  → status: "blocked"
After:  H1-allow candidate, getFoodContext() === undefined  → status: "level_1",
                                                               contextStatus: "context_pending"
        (promote at Level 1 = identity + nutrients; context flagged pending; never fabricated)
```

**Unchanged and still blocking/deferring:** prepared/composite filter, brand guard, `nameQuality="review"` → `needs_review`, bean-duplicate block, general slug-duplicate block, blocked USDA categories, non-H1 explicit block, and **invalid-but-present context still → `blocked`**. The H1-allow + valid context path still returns `h1_qualify` with `auto_tagged` context. The default (non-H1) missing-context path already returned `needs_review`/`context_pending` (never blocked) — its message was aligned to the progressive model.

---

## PROMOTION FLOW (after this change)

```
 SOURCE (USDA / future UK NDB)
        │  automated, facts only
        ▼
 L1 PROMOTION  ── identity, category map, aliases, nutrient import
        │        exclusion + anti-fork gates enforced; context left NULL (never guessed)
        ▼
 LIVE @ Level 1  ── resolvable, counted, nutrition-bearing, useful, facts-only
        │  parallel, non-blocking
        ▼
 L2 ENRICHMENT  ── availability / peak_seasons / origin_region / benefits  (THA-reviewed)
        ▼
 L3 ENRICHMENT  ── description / forms / storage / varieties / stories / pairings  (THA-authored)
```

Enrichment is always a forward UPDATE by slug into the **same** canonical row / join tables (the seed runner is an idempotent upsert-by-slug). No food is ever re-created, replaced, or moved between stores. Identities are retired via `status`, never deleted.

---

## VERIFICATION

**Gate behaviour** (`scratchpad/verify-ws0x10a.ts`, 13/13 passed):

| Check | Result |
|-------|--------|
| H1-allow **with** context → `h1_qualify` (unchanged) | ✓ |
| H1-allow **without** context → `level_1` (was `blocked`) | ✓ |
| `level_1` carries no `blockedReason` and warns "never fabricate" | ✓ |
| Prepared/composite → still `blocked` | ✓ |
| Duplicate slug → still `blocked` | ✓ |
| Existing WS0 bean slug → still `blocked` | ✓ |
| `isContextRequired(canonical/active)` / `({})` === true | ✓ |
| `isContextRequired(catalogue)` / `(draft)` === false | ✓ |
| `validateCanonicalSeed()` === 0 problems (spine preserved) | ✓ |
| `canonicalSeedContextWarnings()` === [] (no Level-1 foods today) | ✓ |

**Existing suites:**
- `server/tests/test-canonical-food.ts` — all pass; seed integrity green; resolver worked-examples green; counts unchanged (173 groups / 249 foods / 57 varieties / 714 aliases).
- `server/tests/test-food-report-adapter.ts` — 102 passed, 1 failed. The single failure (`lentils: Green has no additionalNutrients (not yet in WS0)`) is a **pre-existing WS0 nutrient-coverage assertion**, confirmed identical on the pre-change baseline (restored backups and re-ran). It is unrelated to this change.
- `tsc --noEmit` — the edited files introduce **zero** new type errors. The errors reported by `tsc` are all pre-existing and in unrelated files (`server/scripts/*`, `server/tests/*` top-level-await/config issues, a missing `schema.categories`), present on the committed baseline.

---

## MEASUREMENT — promotion blockers, before / after

### Promotion blockers

| | Before (complete-before-visible) | After (progressive) |
|---|---|---|
| **Gate B** missing context | **Fatal** for *every* canonical food | Fatal only for **curated** foods; non-fatal tracked gap for **Level-1** (catalogue/draft) foods |
| **Gate A** missing context (H1-allow) | `blocked` | `level_1` (promote facts, context pending) |
| Anti-fork unique alias_key | Fatal (unchanged) | Fatal (unchanged) |
| Prepared / composite filter | Block (unchanged) | Block (unchanged) |
| Brand guard | Block (unchanged) | Block (unchanged) |
| Duplicate slug / bean duplicate | Block (unchanged) | Block (unchanged) |
| Malformed context (present, bad value) | Block (unchanged) | Block (unchanged) |
| Resolver key collision | Fatal (unchanged) | Fatal (unchanged) |

**Net:** the *only* blocker removed is "optional enrichment (food context) missing." Every correctness, anti-fork, exclusion, and trust gate is retained.

### Foods eligible for immediate promotion

This task is **validation-only and promotes zero foods** (scope-locked — see below). On the *current* seed the change is a no-op: 249/249 canonical foods are curated tier with full context, so before/after problem counts are identical (0). The change unblocks the *pathway* for future Level-1 promotion. The eligibility figures below are drawn from WS0X.9's pipeline analysis of the already-validated USDA set and apply once the (separate, future) importer runs.

| Workflow | Foods promotable as Level-1 facts-only | Gate that previously blocked them |
|----------|----------------------------------------|-----------------------------------|
| Old (complete-before-visible) | 0 without per-food context authoring | Context authoring (~10–20 foods/hr human task) |
| New (progressive) | The full validated USDA ingredient set passing exclusion + anti-fork gates (~1,300–1,600 net-new per WS0X.9), context-pending | — context no longer gates visibility |

### Expected increase using the new workflow (per WS0X.9/.10 estimates — *not* executed here)

| Milestone | Old model (context on critical path) | New model (Level-1 visible, context back-filled) |
|-----------|--------------------------------------|---------------------------------------------------|
| **500 foods** | 2–3 weeks (per-food context authoring) | **Days** — identity + category map + nutrient import is automatable; no per-food context on the critical path |
| **1,000 foods** | ~6–8 weeks | **1–2 weeks** — bounded by category-map review + nutrient QA |
| **2,000 foods** | 3–4 months | **3–5 weeks** — ≈ full validated USDA ingredient set at Level 1 |

The speed-up is real because context authoring is a serial human task; removing it from the visibility critical path converts bulk promotion from human-rate to import-rate, with context enriched in parallel on already-live foods.

---

## UI VALIDATION (Part 5 — confirmed, not changed)

Existing surfaces already suppress absent information; verified by reading the source. No placeholder text, empty cards, or blank labels are produced for a Level-1 food.

| Surface | Suppression evidence (read-only confirmation) |
|---------|-----------------------------------------------|
| **Meal Detail — Food Intelligence** | `server/services/meal-food-intelligence.ts` returns `EMPTY` when no ingredients / no WS0 coverage (lines 110, 118). The whole context block is guarded by `if (ctx)` (line 156); per-ingredient context uses optional chaining `ctx?.originRegion` / `ctx?.availability` (lines 228, 231). A Level-1 food (no context) yields no origin/availability/seasonal output. |
| Origin chips | Pushed only when `ctx.originRegion` present and not in `SUPPRESS_ORIGINS` (`global`/`united-kingdom`/`europe`) (lines 158–166, 228). |
| Rarity / availability note | `AVAILABILITY_LABELS[ctx.availability]` only resolves for specialist/rare; pushed only when truthy (lines 170–172). |
| Seasonal highlight | Emitted only when the food is in the current season set; per-ingredient entry pushed only when `nutrients.length > 0 || isSeasonal` (line 236). |
| Nutrition Report / Plant Diversity / Planner / Pantry Explore / Discovery | Read identity / nutrient links / diversity group — all Level-1 fields. A food with zero nutrients simply contributes nothing; a food with no context simply shows fewer chips. No surface renders an empty context label. |

---

## MULTI-FEATURE REGRESSION REVIEW (Part 8)

No read path was modified. The change touches only two pure validation functions; `validatePromotion` has **no live caller** yet (its importer is future promotion tooling), so its behavioural change has zero current blast radius. `validateCanonicalSeed`'s only callers are the seed runner and two test files — all green (modulo the pre-existing lentil assertion).

| Feature | Status | Reason |
|---------|--------|--------|
| Meal Detail | No regression | Read path untouched; suppression confirmed |
| Nutrition Report | No regression | Reads nutrient links (Level 1); untouched |
| Planner | No regression | References foods by identity; untouched |
| Pantry Explore | No regression | Reads canonical + knowledge; untouched |
| Shopping | No regression | No canonical-count dependency |
| Discovery | No regression | Keys off identity + grouping; untouched |
| Food Wrapped foundations | No regression | Counts/nutrients (Level 1); untouched |
| Ingredient Resolution Engine | No regression | Resolves on identity + `alias_key`; anti-fork lock intact |
| Canonical Resolver | No regression | `buildCanonicalIndex` / resolution unchanged; collision check still fatal; worked examples green |

---

## MANUAL EYEBALL TESTS (Part 9 — exact user instructions)

These confirm the change is safe **today** (no Level-1 foods exist yet, so the app must look exactly as before) and define what to look for **once** a Level-1 food is later promoted by the future importer.

1. **Existing foods still work.** Open a meal containing tomato, spinach, chickpeas, or salmon → the Food Intelligence panel renders with nutrients, origin, and seasonal chips exactly as before.
2. **Recently promoted foods appear correctly.** (Applies after the future importer runs.) Open a meal containing a newly Level-1 food → it resolves, contributes its nutrients, and counts toward Plant Diversity. No error, no missing-data warning.
3. **Incomplete enrichment shows only trusted info.** For a Level-1 food with nutrients but no context → the panel shows nutrient highlights but **no** origin chip, **no** rarity note, **no** seasonal highlight. Nothing blank, nothing "—", nothing "unknown".
4. **No empty UI sections.** Scan Meal Detail, Nutrition Report, Pantry Explore, Discovery → confirm no empty card, placeholder label, or "Origin: —" appears anywhere.
5. **Resolver behaviour unchanged.** In Meal Detail, the same ingredient strings resolve to the same canonical foods as before; no duplicate or forked match appears.
6. **Plant Diversity remains correct.** The 30-plants counter for an existing week is identical to before this change. (Run `npx tsx server/tests/test-canonical-food.ts` to confirm resolver + counts programmatically.)

---

## TRUST CHECK

> Could this implementation fabricate knowledge, weaken trust, create duplicate foods, create parallel workflows, or reduce resolver accuracy?

| Risk | Answer | Why |
|------|--------|-----|
| Fabricate knowledge? | **No** | Nothing infers context. Missing context is left absent (and suppressed in the UI). The `level_1` path's warning explicitly states "Never fabricate it." `originRegion: null` remains a sanctioned honest gap. |
| Weaken trust? | **No** | Every exclusion/anti-fork/duplicate/vocabulary gate is retained. Malformed context still blocks. Facts-only at Level 1; editorial prose stays behind L2/L3 review. Absence is uniform across all surfaces (one source). |
| Create duplicate foods? | **No** | Unique `alias_key` anti-fork lock, slug/bean duplicate checks, and resolver collision detection are all unchanged and still fatal. |
| Create parallel workflows / stores? | **No** | Same seed → same validator → same tables. No new store. The `status`/`tier` columns (already live) carry the stage signal. Enrichment fills the *same* rows. |
| Reduce resolver accuracy? | **No** | Resolver and `buildCanonicalIndex` are untouched; more foods can only add matches, never remove them. Worked-example resolver tests green. |

**No "stop and report" condition was triggered.**

---

## DATA IMPACT

| Question | Answer |
|----------|--------|
| Reads existing data | YES |
| Writes new data | YES — *enables* future Level-1 writes; this task itself writes **no** food data |
| Changes meaning of existing data | YES — "canonical food" may now legitimately exist at Level 1 (context-pending) for catalogue/draft foods; curated foods are unchanged |
| Requires backfill | NO |
| Foods promoted by this task | NONE |
| Schema changed | NO |
| UI changed | NO |
| Architecture changed | NO (validation rules only) |

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ws0x10a-progressive-fi-impl-20260625` → `a8a912a` |
| Files to revert | `shared/canonical/index.ts`, `shared/catalogue/promotion-validator.ts` |
| Precise revert command | `cp <scratchpad>/ws0x10a-backup/index.ts.orig shared/canonical/index.ts && cp <scratchpad>/ws0x10a-backup/promotion-validator.ts.orig shared/catalogue/promotion-validator.ts` |
| Validation rules changed | (1) `validateCanonicalSeed()` context requirement now gated on `isContextRequired()`; (2) `validatePromotion()` H1 context-missing outcome `blocked` → `level_1`. |
| Expected rollback behaviour | Restores complete-before-visible: missing context fatal for *all* canonical foods; H1-allow missing context → `blocked`. Because no Level-1 food has been promoted, rollback has **no data consequence** — it only re-tightens the two gates. |

> **Note:** a plain `git checkout <tag>` is *not* the recommended revert here, because the edited files are part of uncommitted in-progress work (one does not exist at the tagged commit). Use the file-level `cp` from the verified backups above to revert *only* this task's changes without disturbing the surrounding workspaces.

---

## DEFINITION OF DONE

| Criterion | Status |
|-----------|:--:|
| Canonical architecture preserved | ✓ |
| Progressive enrichment implemented | ✓ |
| Promotion no longer blocked by optional enrichment | ✓ |
| Trust maintained (no fabrication; all correctness gates intact) | ✓ |
| Source of truth preserved (same tables, no new store) | ✓ |
| No duplicate architecture / parallel workflow | ✓ |
| Existing resolver unchanged | ✓ |
| Existing UI continues working (suppression confirmed) | ✓ |
| Before/after promotion statistics produced | ✓ |
| Project file created | ✓ (this file) |

---

## SCOPE LOCK — confirmed

Implemented **only** the approved Progressive Food Intelligence model (two validation rules). **Did not:** begin mass food promotion · import any food · redesign UI · alter Planner, Cookbook or Meal Detail layouts · change the schema · create any store or workflow.

---

## SUGGESTION — future work (NOT executed here)

Listed for separately-classified future workspaces:

1. **Build the L1 automated importer** against the WS0X.9 validated USDA ingredient set (identity + category map + alias derivation + nutrient import; context left empty). This is the step that actually promotes foods under the new model — it is mass promotion and must be its own RED workspace.
2. **L1 nutrient-coverage guard** so Level-1 foods ship with ≥1 nutrient where source data allows ("useful", not merely "visible").
3. **Record enrichment stage explicitly** — a derived/stored `enrichmentLevel` (1/2/3) or reuse `status`/a `contextStatus` marker so dashboards can report L1/L2/L3 coverage.
4. **Coverage dashboard** over `FOOD_CONTEXT_COVERAGE` + `canonicalSeedContextWarnings()` (now available) to prioritise context back-fill on already-live foods.
5. **Editorial queue** surfacing live Level-1 foods lacking context/benefits/prose for THA review — turning back-fill into a steady parallel workflow.
6. **Decide Level-1 visibility policy vs `tier='catalogue'`.** WS0X.9 Safeguard 4 treats `tier='catalogue'` as not-user-visible; WS0X.10 treats Level 1 as visible. This task changed only the *validation* gates, not any read-path visibility. The future importer workspace must explicitly decide and document whether Level-1 catalogue foods are user-visible, and wire the read path accordingly (out of scope here).

---

*Implemented per WS0X.10 Option C. Two validation rules relaxed. No schema, UI, architecture, or food data changed. No foods promoted.*
*Rollback: file-level restore from `…/scratchpad/ws0x10a-backup/` (tag `rollback/ws0x10a-progressive-fi-impl-20260625` → `a8a912a`).*
*Report location: `docs/investigations/knowledge/WS0X_10A_PROGRESSIVE_FOOD_INTELLIGENCE_IMPLEMENTATION.md`*
