# WS0X.5 — Food Context Foundation: Implementation Record

**Status:** 🟡 **PARTIAL** — data foundation built and verified; promotion integration, rollback point, and this document were the outstanding gaps. This record documents the *actual* state as of authoring, not an idealised one.

**Risk classification:** 🔴 RED (food metadata; recommendation / discovery / future-planner foundations).

**Date authored:** 2026-06-24
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**HEAD at authoring:** `f531216`

---

## ⚠️ Honest status summary

This file was created *after* the implementation code was written and is a faithful audit of what exists in the working tree, gathered by reading the code and running the seed validator. It is **not** a sign-off. Three spec requirements remain open and are called out explicitly below:

1. **Part 5 — Promotion pipeline integration: NOT DONE.** `promotion-validator.ts` / `brand-guard.ts` have no food-context awareness; promoted foods will not auto-receive `availability` / `peak_seasons` / `origin_region`. `validateFoodContext()` advertises (in its doc comment) that it is "shared by the promotion auto-tagging path", but no such path exists yet — only the seed validator calls it.
2. **Mandatory rollback point: NOT CREATED.** The change sits uncommitted in a large dirty working tree mixed with unrelated work; no rollback tag/commit/identifier exists. See [Rollback plan](#rollback-plan).
3. **This project file** previously did not exist (the code comments referenced it). Now created.

Parts 1–4, 6, 7 are implemented and verified (see below).

---

## Rollback point

**Not created at implementation time** (spec violation — the mandatory first step was skipped).

Recommended rollback point to establish *now*, before any further work:

```bash
git stash list            # ensure nothing relevant is stashed
git tag ws0x5-pre-rollback f531216   # last commit before the WS0X.5 working-tree changes
```

Because the WS0X.5 changes are uncommitted and interleaved with other modifications in the working tree, there is **no clean per-change rollback** today. The honest options are:

- **Schema rollback:** drop columns `availability`, `availability_modifiers`, `peak_seasons`, `origin_region` from `canonical_food` (they are additive + nullable/defaulted, so dropping is safe).
- **Data rollback:** re-seed without the `food-context.ts` merge (revert `shared/canonical/index.ts` `CANONICAL_FOOD_SEED` to return `e.food` unchanged).
- **Code rollback:** `git checkout f531216 -- shared/schema.ts shared/canonical/index.ts` and delete `shared/canonical/food-context.ts`.
- **Promotion rollback:** none required — promotion integration was never wired in.
- **Seasonality rollback:** `SEASON_SEED` was preserved (not deleted), so reverting the canonical merge leaves seasonality exactly as it was pre-WS0X.5.

---

## Files changed

| File | Change |
|------|--------|
| `shared/schema.ts` | Added 4 columns to `canonical_food`: `availability`, `availability_modifiers`, `peak_seasons`, `origin_region` (lines ~1635–1652). |
| `shared/canonical/food-context.ts` | **New.** Controlled vocabularies + per-food seed (`FOOD_CONTEXT_SEED`) + `validateFoodContext()` + `getFoodContext()`. The authoring input. |
| `shared/canonical/index.ts` | `CANONICAL_FOOD_SEED` merges `FOOD_CONTEXT_SEED` onto each canonical insert; `validateCanonicalSeed()` enforces vocab/coverage; `FOOD_CONTEXT_COVERAGE` + `CANONICAL_SEED_COUNTS` reporting. |

**Not changed (correctly, per scope lock):** planner / cookbook / dashboard / discovery / stories / meal-detail UX.

---

## Schema changes

On `canonical_food` (additive, nullable or defaulted — no breaking change to existing reads):

```ts
availability:          text("availability"),                                  // ordinal, nullable
availabilityModifiers: text("availability_modifiers").array().notNull().default('{}'),
peakSeasons:           text("peak_seasons").array().notNull().default('{}'),
originRegion:          text("origin_region"),                                 // controlled slug, nullable
```

`createdAt` / `updatedAt` unchanged.

---

## Controlled vocabularies (the single owner of valid values)

Defined in `shared/canonical/food-context.ts`, enforced by `validateFoodContext()`:

- **Availability (ordinal):** `mainstream` → `common` → `specialist` → `rare`
- **Availability modifiers (orthogonal):** `imported`, `seasonal`, `online_only` — deliberately kept *out* of the ordinal scale (a food can be `mainstream` AND `imported`).
- **UK seasons:** `spring`, `summer`, `autumn`, `winter` (empty = no distinct UK peak / year-round / imported).
- **Origin regions (15, extensible):** `united-kingdom`, `europe`, `mediterranean`, `north-africa`, `sub-saharan-africa`, `middle-east`, `central-asia`, `south-asia`, `east-asia`, `southeast-asia`, `north-america`, `central-america`, `south-america`, `oceania`, `global`. `null` = origin not confidently known (honest gap, not fabricated).

---

## Migration details

No bespoke migration script. The columns are additive/nullable/defaulted, so the Drizzle schema push creates them with safe defaults; population happens at **seed-build time** via the `CANONICAL_FOOD_SEED` merge — there is no separate backfill step and none is required.

---

## Population strategy

- **One owner.** `canonical_food` is the single runtime source of truth. `food-context.ts` is *seed input only* (analogous to nested varieties/aliases in `CANONICAL_SEED`), folded in at build time by `index.ts` — never read at runtime in parallel.
- **Authored, not fabricated.** Values derive from established food geography + UK retail knowledge. Where origin is genuinely uncertain, `originRegion` is `null`.
- **Seasonality consolidation (Part 1).** `peakSeasons` absorbs `SEASON_SEED`. `SEASON_SEED` is preserved as a derived/curated view; `validateCanonicalSeed()` enforces `SEASON_SEED ⊆ canonical peakSeasons` so the two cannot drift. No "seasonality system #4" was created. `seasonal_with` relationships, seasonal stories, and discovery behaviour are untouched.

---

## Source of truth enforcement (Part 6)

| Dimension | Owner | Consumers | Derived views |
|-----------|-------|-----------|---------------|
| `availability` | `canonical_food.availability` | (future) recommendation tier, discovery | recommendation tier is **derived at query time**, never stored; must not reuse `tier` (provenance) |
| `peak_seasons` | `canonical_food.peak_seasons` | seasonal stories, discovery | `SEASON_SEED` is now a derived curated view |
| `origin_region` | `canonical_food.origin_region` | (future) discovery, Food Wrapped | distinct from cuisine association (`CUISINE_SEED`, many-to-many) |

`validateCanonicalSeed()` guards against duplication: it flags orphan context entries (context for a non-existent food) and missing context (a food with no context record), and runs every value through `validateFoodContext()`.

---

## Performance review (Part 7)

The merge is build-time only (no runtime join added). The columns are plain text/array on an existing table read by slug/PK. No new hot-path queries were introduced (no UI rollout). Net runtime impact: negligible. *(Note: no formal benchmark was run — claim is based on the absence of any new query path.)*

---

## Verification evidence

Ran the seed validator directly (`npx tsx` against `shared/canonical/index.ts`):

```
counts   { diversityGroups: 139, canonicalFoods: 181, varieties: 57, aliases: 539 }
coverage { total: 181, hasContext: 181,
           availability:        { count: 181, pct: 100 },
           originRegion:        { count: 181, pct: 100 },
           peakSeasonsNonEmpty: { count: 46,  pct: 25.4 } }
problems 1  → "Duplicate alias_key \"cows milk\" within \"milk\""  (UNRELATED to food context)
```

### Part 8 metrics

| Metric | Value |
|--------|-------|
| `canonical_food` count — before | 181 (no schema change to row count) |
| `canonical_food` count — after | 181 |
| **availability coverage** | **100%** (181/181) |
| **origin_region coverage** | **100%** (181/181) |
| **peak_seasons coverage** | 100% have a context record; **25.4%** carry a non-empty season (the rest are legitimately year-round/imported) |
| **promotion pipeline coverage** | **0% — NOT IMPLEMENTED** (Part 5 open) |

> Note: the spec referenced "265 foods" as the target; the current editorial canon is **181** foods. The 265→2,000→10,000 figures are the *future* expansion targets, not the current state.

Food-context validation contributes **zero** problems. The single reported problem is a pre-existing duplicate alias unrelated to this work.

---

## Manual eyeball tests

Run the validator/coverage snippet above, then spot-check individual foods via `getFoodContext(slug)` or by reading `FOOD_CONTEXT_SEED` in `shared/canonical/food-context.ts`:

- **TEST 1 — Chicken:** ✅ PASS. `chicken` is a canonical food (`foods.ts:1944`) and carries context: `availability: mainstream`, `peakSeasons: []` (year-round), `originRegion: southeast-asia`, no modifiers (`food-context.ts:275`).
- **TEST 2 — Jackfruit:** ➖ N/A. `jackfruit` is **not in the current 181-food canon** (no entry in `foods.ts` or `food-context.ts`). It is a future-expansion food; it will need context when promoted — which is exactly the Part 5 gap.
- **TEST 3 — Natto:** ➖ N/A. `natto` is **not in the current 181-food canon** either. Same as jackfruit: a future food that exposes the missing promotion auto-tagging.
- **TEST 4 — Seasonal stories:** PASS by construction — `SEASON_SEED` preserved; `validateCanonicalSeed` enforces `SEASON_SEED ⊆ peakSeasons`.
- **TEST 5 — Discovery:** PASS by construction — discovery layer untouched; canonical carries no discovery dependency.
- **TEST 6 — Food promotion:** ⚠️ promotion still runs, but does **not** auto-tag context (Part 5 open). New promoted foods would be flagged by `validateCanonicalSeed` as "missing food context" until manually added — i.e. the no-manual-backfill requirement is **unmet**.

> Resolved: of the three named test foods, only **chicken** is in the current canon (and passes). **Jackfruit** and **natto** are not yet canonical foods — they are future-expansion items, and the fact that they'd arrive untagged is precisely the Part 5 promotion gap.

---

## Trust check (Part 10)

Could availability / origin / seasonality mislead?

- **Availability** is UK-scoped and ordinal — it can drift from reality (a "specialist" food going mainstream). Safeguard: single owner + controlled vocabulary; reviewable as a flat table; recommendation tier is *derived*, so a copy edit doesn't silently change provenance.
- **Origin** is coarse (region, not country) and can oversimplify a food with a contested origin. Safeguard: `null` is allowed and used rather than guessing; origin is explicitly *distinct from cuisine association* to avoid conflating "comes from" with "eaten in".
- **Seasonality** ("in season" ≠ "on the shelf"). Safeguard: empty `peakSeasons` is a valid, common value; `imported`/`seasonal` modifiers carry the nuance; consolidation with `SEASON_SEED` is enforced so copy cannot contradict the fact.

---

## Definition of Done — checklist

- [x] seasonality consolidated (Part 1)
- [x] no duplicate systems created
- [x] availability implemented (Part 2)
- [x] origin_region implemented (Part 3)
- [x] existing foods populated (Part 4 — 100% availability/origin)
- [ ] **promotion pipeline updated (Part 5) — OPEN**
- [ ] **future foods auto-tagged — OPEN** (depends on Part 5)
- [x] discovery preserved
- [x] seasonal stories preserved
- [x] source of truth documented (Part 6)
- [x] verification completed (Part 8)
- [ ] **rollback point created — OPEN** (only a plan exists; no tag/commit made)
- [x] project file created (this document)

**Overall: NOT complete.** Three items open: Part 5 promotion integration, future auto-tagging, and the rollback point.

---

## SUGGESTION (future opportunities — out of scope here)

- Wire `validateFoodContext()` into the promotion path so promoted foods are auto-tagged at promotion time (closes Part 5).
- Promote `originRegion` from single-value to optional secondary region for contested-origin foods.
- Per-retailer availability (currently a single UK-wide ordinal).
- Country-level origin precision (WS0X.3 §Phase 2 deferral).
- Surface availability/origin/seasonality in discovery & Food Wrapped UI (explicitly deferred — no UI rollout in WS0X.5).
- Backfill context for any foods added to the canon after this seed, and add a CI check that fails the build on missing context.
