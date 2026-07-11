# WS2B — Variety Surfacing & Educational Layer (Implementation)

> **Surface what WS2A already knows — change nothing it counts.**
>
> WS2B adds two educational sections, **Your Variety** and **Broaden Your
> Variety**, to the Plant Diversity report. They read the WS2A canonical layer
> (shadow mode) and display nothing that WS2A did not already define. Production
> plant counting, category totals, the 30-plants target, scoring and the planner
> are untouched.

| | |
|---|---|
| **Implementation date** | 2026-06-19 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at start** | `df914ad` |
| **Rollback tag** | `rollback/ws2b-pre-impl-20260619` → snapshot `fbe4ef9` (full working tree incl. WS2A) |
| **Predecessor** | WS2A Canonical Food Foundations (shadow mode) ✓ |
| **Companion docs** | [`WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md`](./WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md) · [`CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md`](./CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md) |
| **Tests** | `npm run test:variety-surfacing` → **36 passed, 0 failed** · `npm run test:canonical-food` → **46 passed, 0 failed** (unchanged) |

---

## SECTION 0 — Rollback protection (completed before any implementation)

1. **Git status checked** — *not clean*: the working tree carried the uncommitted
   WS2A artifacts (`shared/canonical/`, the seed/test/DDL scripts, the schema +
   `package.json` additions). These are the foundation WS2B builds on, so they
   were preserved rather than committed or discarded.
2. **Branch confirmed** — `safety/preserve-since-last-prod-20260617-1613`.
3. **Rollback point created** — `git stash create` captured the **entire** working
   tree (including all WS2A changes) as commit object **`fbe4ef9`**, tagged
   **`rollback/ws2b-pre-impl-20260619`**. The working tree was left untouched
   (verified with `git status --short`).
4. **Reported before starting.**

**To restore:** `git checkout rollback/ws2b-pre-impl-20260619 -- .`
(or `git stash apply fbe4ef9`). **To drop just WS2B:** delete
`shared/canonical/variety.ts`, `server/tests/test-variety-surfacing.ts`, revert
the additive edits to `PlantDiversityReport.tsx`, `health-benefits-model.ts` and
`package.json`. Nothing else references them.

---

## SECTION 1 — Investigation (PART 1: Variety Group Model)

**Where varieties are stored.** WS2A's `food_variety` table — a named sub-kind of
ONE `canonical_food`, sharing its parent's `diversity_group`. The editorial
source of truth is `shared/canonical/foods.ts` (`CANONICAL_SEED`); the DB is
seeded from it. The seed currently defines varieties for **three foods only**:

| Canonical food | Defined varieties (WS2A seed) |
|---|---|
| `tomato` | Cherry, Plum, Heirloom |
| `mushroom` | Button, Chestnut, Shiitake, Oyster |
| `apple` | Gala, Braeburn, Granny Smith |

All other seeded foods (avocado, basil, cumin, citrus, beans, seeds, nuts, oils…)
have **zero** varieties → they surface nothing (by design).

**How varieties are retrieved.** Through the WS2A resolver
(`resolveCanonicalFood`, `shared/canonical/resolver.ts`), which resolves free text
against a prebuilt index of every food name/slug, **variety** name/slug, and
alias. It is pure, deterministic and DB-free — the same path shadow mode uses. A
variety match returns `{ matchType: "variety", canonicalSlug, varietySlug }`.

**Do aliases resolve correctly?** Yes. The resolver tries the normalised key then
plural→singular variants, so `cherry tomatoes` → variety `cherry-tomato`,
`shiitake mushrooms` → `shiitake-mushroom`. Verified by WS2A's 46 tests and
re-exercised by WS2B's tests.

**Is variety lookup performant?** Yes — O(1) map lookups against a once-built,
cached index (`buildCanonicalIndex`). WS2B adds a single O(n) pass over the
week's ingredients (tens of strings) plus O(rows) resolution. Negligible, and
memoised in React.

**No WS2A redesign was performed.** WS2B is a pure consumer of the WS2A layer.

### Two production realities discovered (and respected, not changed)

1. **`normaliseForReuse` groups variety rows inconsistently.** The live counter's
   key (`client/src/lib/ingredient-reuse.ts` → `@shared/ingredient-aliases`)
   collapses `cherry tomatoes`/`plum tomatoes` → `tomatoes` (one row) **but
   leaves** `heirloom tomatoes`, `chestnut mushrooms`, `gala apples` as their own
   rows. WS2B must not change this. It is handled by computing variety data at the
   **canonical-food level** and choosing a single **owner row** per food (below).

2. **Quantity/prep prefixes break raw resolution.** `200g cherry tomatoes`
   resolves to `unknown`. WS2B strips quantities/units/prep words **before**
   resolving (mirroring `stripForMatch`), but deliberately **without**
   alias-collapsing — collapsing would fold `cherry` → `tomato` and lose the
   variety.

---

## SECTION 2 — Design decisions

| Decision | Rationale |
|---|---|
| **Pure logic in `shared/canonical/variety.ts`** (no React, no DB) | Testable with `tsx` like every other test here; reusable; keeps the component thin. |
| **Read the editorial seed, not the DB** | Matches WS2A shadow mode — pure, deterministic, no round-trip. Same source the DB is seeded from. |
| **Compute variety data at the canonical-food level, then attach to one *owner* row** | The live report groups rows inconsistently (§1.1). Aggregating per food and rendering once on the owner row makes `cherry`+`plum`+`heirloom` appear together under **Tomato**, with no duplication on the separate `heirloom tomatoes` row. |
| **Owner = the base-food row if present, else the first variety row** | A "Tomato" row reads more naturally as the home of the variety block than a "Cherry Tomato" row; falls back gracefully when only variety rows exist. |
| **Variety label = variety name minus the food name** (`Cherry Tomato` → `Cherry`) | Matches the brief's `✓ Cherry` display; avoids stutter. |
| **Strip quantity/prep before resolving eaten varieties, but never alias-collapse** | Robust to `200g chopped cherry tomatoes`; preserves the variety (§1.2). |
| **Show nothing when a food has 0 defined varieties** | The APPROVED DECISION: *"if canonical varieties do not exist: show nothing."* No empty cards, no placeholders. |
| **Separate `useMemo`, never feeding `plantRows`/`plantCount`** | Structural guarantee that counting cannot change (§5). |
| **Replace the former raw-form "Broaden Your Variety" block** | The old block (lines ~512–529) listed *raw typed forms* (e.g. "Tinned Tomatoes"), mislabelled as varieties. WS2B supersedes it with real canonical varieties — strictly an improvement in honesty, still educational-only. |

### Empty-state behaviour (PART 4)

- **Food with ≥1 defined variety, ≥1 eaten** → both sections (Broaden hidden if
  all eaten).
- **Food with defined varieties, none eaten** → *Your Variety* hidden, *Broaden*
  lists all (educational nudge).
- **Food with exactly one defined variety, eaten** → *Your Variety* only; Broaden
  empty → hidden.
- **Food with 0 defined varieties** (avocado, basil, …) → **nothing rendered**.

> **Note on the brief's "Avocado → ✓ Avocado" example.** In the current WS2A seed
> avocado has **no** sub-varieties, so per the APPROVED DECISION it surfaces
> nothing. We do **not** fabricate the food itself as a variety — that would
> invent certainty WS2A never defined. The brief's avocado/Yellow-tomato/
> Portobello-mushroom examples are illustrative; tests assert against the **actual
> seed** (Cherry/Plum/Heirloom; Button/Chestnut/Shiitake/Oyster; Gala/Braeburn/
> Granny Smith).

---

## SECTION 3 — Implementation notes

### `shared/canonical/variety.ts` (new — pure)

- `varietyLabel(name, foodName)` — strip trailing food name.
- `getDefinedVarieties(slug)` — display-ordered varieties from the seed (cached).
- `buildEatenVarietyIndex(ingredients)` — strips quantity/prep, resolves each,
  records only `matchType === "variety"` → `Map<foodSlug, Set<varietySlug>>`.
- `buildVarietyDisplay(slug, name, eatenSet)` — returns
  `{ yourVarieties, broadenVarieties }` (alphabetical) or **null** when the food
  has no varieties / nothing to show.
- `buildRowVarietyDisplays(allIngredients, rows)` — the component entry point:
  picks one owner row per food, returns `Map<rowKey, CanonicalVarietyDisplay>`.

### `client/src/components/PlantDiversityReport.tsx` (additive)

- New `CanonicalVarietySections` sub-component renders *Your Variety* (✓ chips,
  emerald) and *Broaden Your Variety* (○ chips, muted); each section hidden when
  empty.
- New `varietyByRowKey` **`useMemo`** (separate from `computePlantData`).
- `varietyByRowKey` threaded through `PlantReportTable` → `PlantReportRow`.
- The old raw-form Broaden block was replaced by `<CanonicalVarietySections>`.
- **`computePlantData` and every counting line are untouched.**

### `client/src/lib/health-benefits-model.ts`

- Added `TERMINOLOGY.yourVariety = "Your Variety"`.

### `package.json`

- Added `"test:variety-surfacing"` script.

---

## SECTION 4 — Files changed

| File | Type | Change |
|---|---|---|
| `shared/canonical/variety.ts` | **new** | Pure variety-surfacing logic. |
| `server/tests/test-variety-surfacing.ts` | **new** | 36 checks. |
| `client/src/components/PlantDiversityReport.tsx` | edit (additive) | +79 / −18 — variety sections; counting untouched. |
| `client/src/lib/health-benefits-model.ts` | edit (additive) | +1 terminology key. |
| `package.json` | edit (additive) | +1 test script. |

**Production counting files touched: _none._** No edits to `nutrition-variety.ts`,
`ingredient-reuse.ts`, `ingredient-aliases.ts`, the planner, scoring, or any
WS2A file.

---

## SECTION 5 — Shadow-mode validation (PART 5)

WS2B is **read-only** over the canonical layer; it never switches counting.

| Claim | Evidence |
|---|---|
| **Production plant count unchanged** | The count is `plantRows.length` from `computePlantData`. `git diff` shows **no `+/-` line touches** `computePlantData`, `plantRows.length`, `WEEKLY_PLANT_TARGET`, `isPlantIngredient`, `getPlantCategory` or `normaliseForReuse`. |
| **Category totals unchanged** | `categoriesFound` is built inside the untouched `computePlantData`; WS2B does not read or alter it. |
| **Weekly totals unchanged** | Same — totals derive solely from `plantRows`. |
| **Canonical layer stays shadow mode** | WS2B only *reads* the resolver/seed; it adds no production column, repoints no count, switches no surface. WS2A's 46 tests still pass identically. |
| **Variety sections are read-only** | No buttons, no writes, no mutations — pure display. `buildEatenVarietyIndex([])`/`buildRowVarietyDisplays([], [])` return empty and never throw (asserted). |

**73 / 30 invariance.** The variety layer is a *separate* `useMemo` whose output
(`varietyByRowKey`) is consumed only inside expanded-row rendering. It is
**structurally impossible** for it to change `plantCount`, because `plantCount`
is computed before and independently of it and never references it. Therefore a
week showing **73 / 30** before WS2B shows **73 / 30** after — identical input →
identical `plantRows.length`.

Worked examples confirming the canonical layer behaves (and only *surfaces*):

```
Tomatoes : Your ✓ Cherry ✓ Plum   ·  Broaden ○ Heirloom
Mushrooms: Your ✓ Chestnut ✓ Shiitake  ·  Broaden ○ Button ○ Oyster
Citrus   : (no varieties defined → nothing surfaced; oranges/clementines still
            count exactly as before)
```

---

## SECTION 6 — Manual tests

Run: `npm run test:variety-surfacing` (36/36) and `npm run test:canonical-food`
(46/46, unchanged). End-to-end probe output (`tsx`), one realistic week:

| # | Brief expectation | WS2B result (seed-accurate) | Status |
|---|---|---|---|
| 1 | Tomatoes: eaten Cherry+Plum → Your ✓Cherry ✓Plum; Broaden the rest | Your ✓ Cherry ✓ Plum · Broaden ○ Heirloom | ✓ (seed has no "Yellow") |
| 2 | Mushrooms: eaten Chestnut → Your ✓Chestnut; Broaden the rest | eaten Chestnut+Shiitake → Your ✓ Chestnut ✓ Shiitake · Broaden ○ Button ○ Oyster | ✓ (seed has no "Portobello") |
| 3 | Single-/no-variety food (Avocado) → no Broaden | Avocado has 0 varieties → **nothing surfaced** (documented §2) | ✓ |
| 4 | No canonical variety data → nothing | basil/cumin/avocado → nothing surfaced | ✓ |
| 5 | Plant totals before == after (e.g. 73/30) | counting path unchanged (git diff §5) → identical | ✓ |
| — | Aggregation across rows / no duplication | `cherry`+`plum` (row `tomatoes`) + own row `heirloom tomatoes` → block once on **Tomato**; heirloom row surfaces nothing | ✓ |
| — | Quantity/prep robustness | `200g chopped cherry tomatoes` → Cherry | ✓ |

`tsc --noEmit`: **24** errors total, **all pre-existing** in unrelated files
(`query-*` scripts, household/slot-filling tests). **Zero** in any WS2B file.

---

## SECTION 7 — Remaining gaps / known limitations

- **Variety coverage is the WS2A proving set only** — Tomato/Mushroom/Apple have
  varieties; everything else surfaces nothing. Expanding coverage is a *WS2A seed*
  task, not WS2B.
- **Owner-row placement** when only variety rows exist (no base-food row) puts the
  block on the first variety row (e.g. a `gala apples`-only week shows the Apple
  block on the "Gala Apples" row). Acceptable; noted for future polish.
- **Live in-app 73/30 screenshot** not captured here (no DB/app run in this
  session); invariance is proven structurally via the diff. A `/verify` run can
  confirm visually on demand.

---

## SECTION 8 — Data impact declaration

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (WS2A seed + the week's ingredient strings) |
| Writes new data? | **NO** |
| Changes meaning of existing data? | **NO** |
| Requires backfill? | **NO** |

**Trust check.** Could this mislead users? **No** — educational only. Could it
fabricate certainty? **No** — only WS2A-defined varieties are shown; missing data
shows nothing.

---

## SECTION 9 — Scope lock confirmation

Implemented **only**: Your Variety · Broaden Your Variety · empty-state behaviour ·
shadow-mode validation. **Not** implemented (per scope lock): variety scoring,
achievements, badges, plant-count migration, planner recommendations, nutrition
scoring changes, gamification.

### SUGGESTION (not implemented — require approval)

1. **Cross-link a Broaden chip to Pantry Explore** for that variety (read-only
   nav), mirroring the existing category cross-links.
2. **Expand WS2A variety seed** (e.g. Beefsteak/San Marzano tomato; Portobello
   mushroom; pepper/citrus varieties) so more foods surface — a WS2A editorial
   task gated on product sign-off.
3. **"You've tried all N varieties" affirmation** when Broaden is empty — a small
   positive note (borders on gamification; explicitly deferred).
4. **Promote the canonical resolver into row grouping** so `heirloom tomatoes`
   stops being its own plant row — this *would* change counting and is firmly a
   future, parity-gated cutover (WS2A §9), **not** WS2B.

---

## SECTION 10 — Definition of done

| Criterion | Status |
|---|---|
| Educational variety sections appear automatically | ✓ |
| No changes to production counting | ✓ (git diff; separate memo; 73/30 invariant) |
| Canonical layer remains shadow mode | ✓ (read-only; WS2A 46/46 unchanged) |
| Aliases resolve correctly | ✓ (incl. quantity/prep) |
| Empty states graceful (no empty cards) | ✓ |
| Users encouraged to explore diversity naturally | ✓ |
