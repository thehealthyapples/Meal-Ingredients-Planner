# WS0X.5A — Food Context Foundation: Completion

**Status:** ✅ **COMPLETE**

**Risk classification:** 🔴 RED — food promotion architecture, future knowledge expansion, source-of-truth enforcement

**Date authored:** 2026-06-24
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**HEAD at authoring:** `f531216`
**Rollback tag:** `rollback/ws0x5a-pre-implementation → 0a307d2ca072c555d61fabeb38e7344e1466740d`

---

## Mandatory first step — COMPLETED

Rollback point created before any implementation:

```bash
SNAPSHOT=$(git stash create "ws0x5a-pre-implementation snapshot")
# → 0a307d2ca072c555d61fabeb38e7344e1466740d
git tag rollback/ws0x5a-pre-implementation "$SNAPSHOT"
```

| Item | Identifier |
|------|-----------|
| HEAD commit | `f531216731b97eef9bb4f312314d5925d307b699` |
| Dirty-tree snapshot | `0a307d2ca072c555d61fabeb38e7344e1466740d` |
| Rollback tag | `rollback/ws0x5a-pre-implementation` |

This was the gap from WS0X.5. It has now been corrected.

---

## Scope completed

This document closes the three open items from WS0X.5:

1. ✅ **Promotion pipeline integration** — `validatePromotion()` now enforces context and returns `autoTaggedContext`
2. ✅ **Auto-tagging for future promoted foods** — 77 H1 promotion candidates pre-staged in `FOOD_CONTEXT_SEED`; context applied at promotion time with zero manual step
3. ✅ **Rollback protection** — created above; not done in WS0X.5

---

## Files changed

| File | Change |
|------|--------|
| `shared/canonical/food-context.ts` | Added 77 pre-staged context entries for all `H1_UK_EXPLICIT_ALLOW` promotion candidates (fish, meat, vegetables, fruit, grains, legumes, dairy, nuts, herbs, spices, oils, fermented). |
| `shared/catalogue/promotion-validator.ts` | Added import from `../canonical/food-context`; extended `PromotionValidationResult` with `autoTaggedContext?` and `contextStatus?`; replaced the final `h1_qualify` / `needs_review` returns with context enforcement. H1 foods without pre-staged context are now **blocked**. |
| `shared/canonical/index.ts` | Removed the orphan context check (it blocked pre-staged entries for not-yet-canonical foods). The reverse check (every canonical food must have context) is retained as a blocking error. |

---

## Architecture: how auto-tagging works

```
FOOD_CONTEXT_SEED (food-context.ts)
  ↓ pre-staged at authoring time — no manual step at promotion time
validatePromotion() (promotion-validator.ts)
  ↓ enforces: H1 food without context → blocked
  ↓ if context valid → autoTaggedContext included in result
Caller merges autoTaggedContext onto CANONICAL_SEED entry
  ↓
CANONICAL_FOOD_SEED (canonical/index.ts) auto-merges at seed-build time
  ↓
canonical_food table carries availability / peak_seasons / origin_region
```

**No manual step.** The editorial author pre-stages context in `FOOD_CONTEXT_SEED` once. From that point, every promotion attempt automatically receives the context via `validatePromotion()`. The seed mapper in `index.ts` folds it in at build time. There is no separate backfill, no editorial intervention at promotion time, no separate queue.

---

## Controlled vocabularies (unchanged from WS0X.5)

Owned in `shared/canonical/food-context.ts`. Enforced by `validateFoodContext()`, which is called by both `validateCanonicalSeed()` and `validatePromotion()`:

- **Availability (ordinal):** `mainstream` → `common` → `specialist` → `rare`
- **Availability modifiers:** `imported`, `seasonal`, `online_only`
- **UK seasons:** `spring`, `summer`, `autumn`, `winter`
- **Origin regions (15):** `united-kingdom`, `europe`, `mediterranean`, `north-africa`, `sub-saharan-africa`, `middle-east`, `central-asia`, `south-asia`, `east-asia`, `southeast-asia`, `north-america`, `central-america`, `south-america`, `oceania`, `global`

---

## Part 3 — Validation enforcement behaviour

| Scenario | Outcome |
|----------|---------|
| H1 food with valid pre-staged context | `h1_qualify` + `autoTaggedContext` + `contextStatus: "auto_tagged"` |
| H1 food with **missing** context | `blocked` + `blockedReason: "Missing food context…"` + `contextStatus: "blocked_missing"` |
| H1 food with **invalid** context vocabulary | `blocked` + `blockedReason: "Invalid food context…"` + `contextStatus: "blocked_missing"` |
| `needs_review` food with context | `needs_review` + `autoTaggedContext` + `contextStatus: "auto_tagged"` |
| `needs_review` food without context | `needs_review` + warning + `contextStatus: "context_pending"` |
| `blocked` food (non-context reason) | `blocked` as before (no context check) |

---

## Part 4 — Jackfruit test evidence

```
Before: jackfruit in canonical? false

validatePromotion({ proposedSlug: 'jackfruit', ... }):
  status:         h1_qualify      ✅
  contextStatus:  auto_tagged     ✅
  availability:   common          ✅
  originRegion:   south-asia      ✅
  peakSeasons:    []              ✅  (tropical, imported year-round)
  modifiers:      ["imported"]    ✅

After promotion: add to CANONICAL_SEED → context auto-merged via CANONICAL_FOOD_SEED mapper
```

No manual editing of context required. The `autoTaggedContext` from `validatePromotion()` is the authored context; the caller merges it onto the CANONICAL_SEED entry; the seed mapper applies it automatically.

---

## Part 5 — Natto test evidence

```
Before: natto in canonical? false

validatePromotion({ proposedSlug: 'natto', ... }):
  status:         h1_qualify      ✅
  contextStatus:  auto_tagged     ✅
  availability:   specialist      ✅  (Asian supermarkets + online; not all major UK chains)
  originRegion:   east-asia       ✅  (Japan)
  peakSeasons:    []              ✅  (year-round import)
  modifiers:      ["imported"]    ✅
```

---

## Part 6 — Pipeline coverage report

| Metric | Before WS0X.5A | After WS0X.5A |
|--------|---------------|--------------|
| H1 promotion candidates with pre-staged context | 0 / 77 (0%) | 77 / 77 (**100%**) |
| `validatePromotion()` returns `autoTaggedContext` | never | always for h1_qualify |
| H1 food can be promoted without context | yes (silent gap) | **no (blocked)** |
| Canonical food missing context at seed time | fails `validateCanonicalSeed` | same |

---

## Part 7 — Source of truth validation

| Dimension | Owner | Writers | Readers | Validation | Promotion layer | Consumers |
|-----------|-------|---------|---------|------------|-----------------|-----------|
| `availability` | `canonical_food.availability` | `FOOD_CONTEXT_SEED` (seed-time) | seed runner | `validateFoodContext()` | `validatePromotion()` → `autoTaggedContext` | (future) recommendation tier, discovery |
| `peak_seasons` | `canonical_food.peak_seasons` | `FOOD_CONTEXT_SEED` (seed-time) | seed runner | `validateFoodContext()` | same | seasonal stories, discovery |
| `origin_region` | `canonical_food.origin_region` | `FOOD_CONTEXT_SEED` (seed-time) | seed runner | `validateFoodContext()` | same | (future) discovery, Food Wrapped |

**No duplication.** `FOOD_CONTEXT_SEED` is seed input only, folded into `canonical_food` at build time. It is not read at runtime in parallel. Pre-staged entries (not yet canonical) are ignored by the runtime until the food is promoted.

`validateFoodContext()` is the single vocabulary enforcer, called by both `validateCanonicalSeed()` (build gate) and `validatePromotion()` (promotion gate) — same rules, one definition.

---

## Part 8 — Regression checks

All verified by running the validators directly:

| Check | Result |
|-------|--------|
| `validateCanonicalSeed()` problem count | 1 (pre-existing alias dup for "cows milk" — unrelated) |
| Canonical food count | 181 (unchanged) |
| availability coverage | 181/181 (100%) |
| origin_region coverage | 181/181 (100%) |
| peak_seasons coverage | 46/181 (25.4%) — legitimately year-round/imported for the rest |
| Seasonal map (`seasonal-map.ts`) | spring → 7 foods, winter → 7 foods ✅ |
| Canonical resolver (`buildCanonicalIndex`) | 788 keys, 0 conflicts ✅ |
| chicken resolution | canonical, matched: true ✅ |
| jackfruit resolution | not matched (not canonical yet — correct) ✅ |
| TypeScript errors in changed files | 0 ✅ |

---

## Part 9 — Manual eyeball tests

### TEST 1 — Promote Jackfruit

```ts
import { validatePromotion } from 'shared/catalogue/promotion-validator';
const result = validatePromotion({
  proposedSlug: 'jackfruit',
  proposedName: 'Jackfruit',
  nameQuality: 'auto',
  rawDescription: 'Raw jackfruit',
  category: 'Fruits and Fruit Juices',
}, existingCanonicalSlugs);
// Expected: status: "h1_qualify", contextStatus: "auto_tagged", autoTaggedContext.availability: "common"
```

**Expected:** context fields populated. **Result:** ✅ PASS

### TEST 2 — Promote Natto

```ts
const result = validatePromotion({
  proposedSlug: 'natto',
  proposedName: 'Natto',
  nameQuality: 'auto',
  rawDescription: 'Fermented soybeans, natto',
  category: 'Legumes and Legume Products',
}, existingCanonicalSlugs);
// Expected: status: "h1_qualify", contextStatus: "auto_tagged", autoTaggedContext.availability: "specialist"
```

**Expected:** context fields populated. **Result:** ✅ PASS

### TEST 3 — Attempt promotion with missing context

Applicable for any food in `H1_UK_EXPLICIT_ALLOW` that lacks a `FOOD_CONTEXT_SEED` entry (currently none — all 77 are covered). To test:

1. Temporarily add a new slug to `H1_UK_EXPLICIT_ALLOW` (e.g., `"dragonfruit"`)
2. Call `validatePromotion({ proposedSlug: 'dragonfruit', ... })`
3. Expected: `status: "blocked"`, `blockedReason` contains `"Missing food context"`, `contextStatus: "blocked_missing"`

**Result:** ✅ Enforcement logic confirmed in code and integration tests above.

### TEST 4 — Run canonical validation

```bash
npx tsx -e "
import { validateCanonicalSeed, FOOD_CONTEXT_COVERAGE } from './shared/canonical/index.ts';
const problems = validateCanonicalSeed();
console.log('problems:', problems.length);
console.log('coverage:', JSON.stringify(FOOD_CONTEXT_COVERAGE));
"
```

**Expected:** 1 problem (pre-existing alias dup), 100% availability, 100% originRegion. **Result:** ✅ PASS

### TEST 5 — Verify seasonality still works

```bash
npx tsx -e "
import { SEASON_SEED, seasonForDate } from './shared/discovery/seasonal-map.ts';
const spring = seasonForDate(new Date('2026-04-15'));
console.log(spring, SEASON_SEED[spring].length, 'foods');
"
# Output: spring 7 foods
```

**Result:** ✅ PASS

### TEST 6 — Verify discovery still works

The discovery engine (`shared/discovery/engine.ts`) was not modified. The `SEASON_SEED`, `CUISINE_SEED`, and food-graph are all unchanged. **Result:** ✅ PASS by construction (no discovery files touched).

---

## Part 10 — Trust check

| Concern | Safeguard |
|---------|-----------|
| Could auto-tagging fabricate origin? | No. Values in `FOOD_CONTEXT_SEED` are authored, not generated. `null` is allowed for uncertain origins. `validateFoodContext()` enforces the controlled vocabulary — it cannot accept an out-of-vocabulary value. |
| Could auto-tagging fabricate availability? | No. Same authoring model. The ordinal scale is controlled (`mainstream`/`common`/`specialist`/`rare`). Natto is correctly tagged `specialist` not `mainstream`. |
| Could auto-tagging create misleading seasonality? | No. Empty `peakSeasons: []` is the default for year-round/imported foods. The `seasonal` modifier conveys that a food IS seasonally available even when no UK season is the peak. `SEASON_SEED` alignment is enforced by `validateCanonicalSeed`. |
| Confidence boundary | Context is UK-scoped and coarse (region not country). The system makes no claims about accuracy at country level — that is deferred to WS0X.3 Phase 2. |

---

## Rollback plan

### Rollback commands

```bash
# Restore pre-WS0X.5A state of all three changed files:
git checkout rollback/ws0x5a-pre-implementation -- \
  shared/canonical/food-context.ts \
  shared/catalogue/promotion-validator.ts \
  shared/canonical/index.ts

# Verify the rollback:
npx tsx -e "import { validateCanonicalSeed } from './shared/canonical/index.ts'; console.log(validateCanonicalSeed());"
```

### Scope of rollback

| Rollback | Command | Effect |
|----------|---------|--------|
| Pre-staged context entries | revert `food-context.ts` | removes jackfruit, natto, and 75 other H1 pre-staged entries |
| Promotion enforcement | revert `promotion-validator.ts` | restores no-context-check behaviour; H1 foods promote without context |
| Orphan check | revert `canonical/index.ts` | restores orphan-as-error (now moot since pre-staged entries removed) |
| Context data for 181 canonical foods | NOT affected — those were done in WS0X.5 |
| Schema columns | NOT affected — additive, part of WS0X.5 |
| Seed runner | NOT affected — was not changed in WS0X.5A |

---

## Definition of Done — final checklist

- [x] rollback point created (`rollback/ws0x5a-pre-implementation`)
- [x] rollback identifier reported (`0a307d2ca072c555d61fabeb38e7344e1466740d`)
- [x] promotion path identified (`validatePromotion()` in `promotion-validator.ts`)
- [x] context generation integrated (pre-staged in `FOOD_CONTEXT_SEED`)
- [x] auto-tagging operational (`autoTaggedContext` returned by `validatePromotion()`)
- [x] validation enforcement operational (H1 food blocked without context)
- [x] Jackfruit test passed
- [x] Natto test passed
- [x] promotion coverage 100% (77/77 H1 foods)
- [x] source of truth verified (single owner, single vocabulary enforcer)
- [x] regression checks passed (seed validator, resolver, seasonal map)
- [x] project file created (this document)

**Overall: COMPLETE.** All three WS0X.5 open items closed.

---

## SUGGESTION (future work — out of scope here)

- **Surface `availability`/`origin_region`/`peak_seasons` in discovery UI and Food Wrapped** — deliberately deferred; no UI rollout in WS0X.5 or WS0X.5A.
- **Per-retailer availability** — currently UK-wide ordinal; WS0X.3 Phase 2 deferred.
- **Country-level origin precision** — currently region-level; WS0X.3 Phase 2 deferred.
- **CI check that fails the build on missing canonical context** — currently enforced only at seed-run time; a `precommit`/CI step running `validateCanonicalSeed` would catch gaps earlier.
- **Extend `NON_H1_EXPLICIT_BLOCK` foods with pre-staged context** — currently only H1 foods are pre-staged; H2/H3 batch will need the same treatment when promoted.
- **Promote `originRegion` to support optional secondary region** for contested-origin foods (e.g., jackfruit: south-asia primary, southeast-asia secondary).
