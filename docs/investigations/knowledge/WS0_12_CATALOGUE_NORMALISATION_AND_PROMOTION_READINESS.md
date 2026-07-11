# WS0.12 — Catalogue Normalisation & Promotion Readiness

**Date:** 2026-06-21
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Rollback tag:** `ws0.12-rollback-point` at `2c5753a`
**Scope:** Internal catalogue only. No user-facing changes. No Discovery, Alternatives, Stories, Food Reports, or production UX.
**Question answered:** *Can the internal catalogue be made beautiful, trustworthy, and promotion-ready before scaling to thousands of foods?*

WS0.11 proved real USDA ingestion works, prevents duplicates, filters branded products, and leaves canonical foods untouched. It also exposed three real-world gaps that the 50-synthetic-food test could not: **messy names**, **prepared-dish leakage**, and **USDA macro heterogeneity** (Foundation oils with no macros). WS0.12 closes all three and adds a **promotion-readiness score** and **promotion queue** so the catalogue can graduate toward canonical with confidence.

---

## Rollback Protection (mandatory first step — completed before any implementation)

| Check | Status |
|---|---|
| Git status before WS0.12 | WS0.11 artifacts were **untracked** → committed at `2c5753a` so the pilot is preserved; tree then clean |
| WS0.11 protected | ✅ existing tag `ws0.11-rollback-point` **and** new commit `2c5753a` (acquisition script, 500-food snapshot, run report, runner, investigation doc) |
| **WS0.12 rollback tag** | ✅ **`ws0.12-rollback-point` at `2c5753a`** |
| Canonical foods (53 live rows) | Untouched — WS0.12 changes the pipeline, not the canonical tier |
| Knowledge foods / relationships / production | Untouched |

```
# Code rollback
git checkout ws0.12-rollback-point

# Data rollback (if a refreshed catalogue is written; preserves canonical/knowledge/relationships)
npx tsx server/scripts/ws011-usda-ingestion.ts --rollback
```

WS0.12 as delivered is **analysis-only** (no DB write); the runner re-scores the committed snapshot in memory. The rollback tag protects the code; the WS0.11 `--rollback` remains the data lever if a refresh is ever written.

---

## Executive Summary — Before → After (500-food snapshot, re-run)

| Metric | WS0.11 (before) | WS0.12 (after) |
|---|---|---|
| New entries staged | 316 | **295** (21 composites removed) |
| Prepared dishes leaking into catalogue | **21** | **0** (24 blocked at pipeline) |
| Inverted / machine-format names | **278 / 316 (88%)** | **0 manual**; 238 auto (81%) + 57 review (19%) |
| Foods with a missing key macro completed | 0 (8 oils flagged low) | **9** (8 oils + coconut fibre) |
| Confidence: high / medium / **low** | 64 / 238 / **14** | 59 / 230 / **6** |
| Within-batch slug collisions | 7 | 12 *(all same-food dups, absorbed)* |
| Genuinely-distinct foods wrongly merged | — | **0** |
| Legitimate foods wrongly blocked | — | **0** |
| Foundation macros overwritten by fallback | — | **0** |
| Mean promotion-readiness score | — | **60.7 / 100** |
| Promotion stages (canonical / Claude-author / THA-review) | — | 8 / 257 / 30 |

**Verdict:** every WS0.11 gap is resolved, with the trust guarantees intact: nothing useful is hidden, no Foundation data is overwritten, and no distinct foods are merged. The catalogue is now **promotion-ready**.

---

## Part A — Name Normalisation

USDA names are inverted, comma-qualified, and carry program boilerplate. WS0.12 adds `shared/catalogue/name-normaliser.ts`, a **conservative** transform that produces a human THA display name and a quality band.

### The four worked targets (all correct)

| USDA | THA (WS0.12) | Band |
|---|---|---|
| `Oil, canola` | **Canola oil** | auto |
| `Fish, haddock` | **Haddock** | auto |
| `Cheese, feta, low moisture` | **Feta cheese** | auto |
| `Oca (New Zealand yam), raw` | **Oca** (+ alias `New Zealand yam`) | auto |

### Rules implemented

1. **Strip program boilerplate** — `", includes foods for USDA's Food Distribution Program"`, `NDB no.`, `NFS`, `(USDA commodity)`.
2. **Harvest + strip parentheticals** — the content becomes an **alias candidate**, not noise.
3. **Reorder by class**:
   - *Suffix classes* (`oil, cheese, juice, yogurt, vinegar, flour, butter, milk, cream, nectar`): `"Oil, canola"` → `"Canola oil"`.
   - *Drop classes* (`fish, nuts, seeds, beans, peas, berries, greens`): `"Fish, haddock"` → `"Haddock"`.
   - *Generic* (head is the food): qualifiers prefix it.
4. **Drop only known-NOISE segments** (raw, fresh, cooked, low moisture, nonfat, with salt added, grade A, large, refrigerated, shelf stable, …). **Any unknown segment is KEPT** as a distinguishing qualifier and the result is flagged `review`.
5. **Title-case** with small-word handling.

### The parenthetical rule — chosen, with reason

> **Rule: STRIP the parenthetical from the display name and HARVEST its contents as an alias.**
> `"Oca (New Zealand yam), raw"` → display **"Oca"**, alias **"New Zealand yam"**.

**Why this one:** it gives a beautiful, unambiguous display name *and* preserves the regional/common name as a searchable alias rather than discarding it. It is a single deterministic rule (always strip), and it directly answers the trust risk *"remove legitimate regional foods"* — the regional name is retained, just relocated to the alias field.

### The collision-safety rule (the most important design choice)

A naïve normaliser would collapse `"Oil, olive, extra virgin"` and `"Oil, olive, extra light"` both to `"Olive oil"` — **merging two different products into one colliding slug**. WS0.12 keeps any non-noise qualifier:

| USDA | THA | Slug | Band |
|---|---|---|---|
| `Oil, olive, extra virgin` | Extra virgin olive oil | `extra-virgin-olive-oil` | review |
| `Oil, olive, extra light` | Extra light olive oil | `extra-light-olive-oil` | review |

They stay **distinct**. Nothing meaningful is ever silently dropped: noise is recorded in `droppedQualifiers`, distinguishing qualifiers in `keptQualifiers`.

### Questions answered

1. **How many naming patterns exist?** Six transform patterns fired across the snapshot: `suffix-class-reorder`, `suffix-class-bare`, `drop-class`, `drop-class-bare`, `qualifier-prefix`, `head-only`. Plus boilerplate-strip and parenthetical-harvest as pre-passes.
2. **Which can be automated?** 238/295 (**81%**) resolve to band `auto` — safe reorder, only noise dropped. These are promotable on the name axis without human edits.
3. **Which require review?** 57/295 (**19%**) are band `review` — an unknown qualifier was retained (e.g. `extra virgin`, `Greek`, `90% lean / 10% fat`, `dry medium red`) or a `%`/`/`/`or` survived. Zero are `manual` in this batch.
4. **Can Claude assist?** Yes — `review`-band foods carry the raw name, the proposed name, the kept qualifiers, and the harvested aliases. That is exactly the structured context Claude authoring needs to finalise phrasing (e.g. `"Beans, Dry, Medium Red"` → `"Dried medium red beans"`), and `needs_tha_review` foods are routed to a human first.

---

## Part B — Prepared-Food Filter (moved into the pipeline)

WS0.11's prepared-dish protection lived in the **acquisition script** (`build-snapshot.py`), so any future source would re-leak composites. WS0.12 adds `shared/catalogue/prepared-food-filter.ts` and wires it into `ingestFood` as a `skip` action **before** alias resolution — so **any** source self-protects.

### Principle — preparation STATE vs composite DISH

- A single ingredient in a preparation state is a **food**: *rolled oats, dried apricots, roasted almonds, ground beef, frozen peas*. These contain words that look prepared but describe ONE ingredient — they **pass**.
- A composite **dish** combines ingredients or is a recipe: *souffle, pancake, casserole, soup, sauce, salad, meatloaf* — these do **not** belong in an ingredient catalogue and are **blocked**.

Matching is **whole-word** (`\bword\b`) so `rolled`, `applesauce`, and `breadfruit` never false-trigger.

### ALLOW LIST (precedence — overrides any block token)

`applesauce`, `custard apple`, `breadfruit`, `sweetbread`, `butterhead lettuce`, `marrow`, `cornbread`, `soup celery`.

> These guard against the trust risk *"hide useful foods"*: **custard apple** (a fruit) must not be blocked by `custard`; **breadfruit** must not be blocked by `bread`; **applesauce** (one word) must not be blocked by ` sauce`. Verified: **0 legitimate foods wrongly blocked**.

### BLOCK LIST (composite-dish / non-ingredient words)

Composite/baked (`souffle, pancake, waffle, casserole, gratin, quiche, pie, cobbler, crumble, pizza, lasagna, ravioli, dumpling, fritter, croquette, samosa, pakora, strudel`), liquids/composites (`soup, stew, chowder, bisque, broth, gravy, sauce, ketchup, salsa, dip, spread`), protein composites (`meatloaf, meatball, patty, nugget, sausage, burger, kebab, falafel, terrine, pate, loaf`), assembled dishes (`salad, sandwich, wrap, taco, burrito, risotto, paella, pilaf, pudding, custard, mousse, trifle, omelette, frittata`), preserved (`pickle, pickled, relish, chutney, marmalade`), stuffed/breaded (`stuffed, breaded, battered, tempura`), and supplement/infant (`infant, baby food, formula, supplement, meal replacement, protein powder`).

**Tuned for precision:** `tart` and `curry` were **removed** from the blocklist after they wrongly caught *"tart cherry juice"* (a fruit) and would catch *"curry powder / curry leaves"* (spices). This is a deliberate false-positive guard.

### Examples (from the live re-run — 24 blocked)

`Spinach souffle` [souffle] · `Potato pancakes` [pancakes] · `Cheese sauce, prepared from recipe` [sauce] · `Tomato, sauce, canned` [sauce] · `Pickles, cucumber, dill` [pickles] · `Eggplant, pickled` [pickled] · `Olives, …, stuffed with pimiento` [stuffed] · `Fish, tuna salad` [salad] · `Ice cream sandwich` [sandwich] · `Vegetarian meatloaf or patties` [meatloaf] · `Corn pudding, home prepared` [pudding] · `Cranberry-orange relish` [relish] · `Yeast extract spread` [spread] · `Margarine-like spread …` [spread].

### Could "Tomato soup" ever become canonical?

**No — not as a canonical *food*.** The canonical tier is an **ingredient** catalogue: single, recognisable edible foods (tomato, milk, basil, stock). "Tomato soup" is a **composite recipe** of several ingredients — it belongs to the *meal / recipe* layer, not the ingredient catalogue. The filter blocks it on the `soup` token.

**How it *would* be represented:** its constituent ingredients (`tomato`, `onion`, `vegetable stock`, `cream`) are each canonical; "Tomato soup" is then a *meal* assembled from them — exactly the WS7 relationship-graph / meal model, never an entry in `canonical_food`. So the answer is *no* at the ingredient tier, with a clean home elsewhere.

---

## Part C — Macro Fallback

### The WS0.11 finding

The **Foundation** entry for `Oil, canola` (fdc 748278) stores 38 fatty-acid rows but **none** of the 5 key macros (energy 1008, protein 1003, fat 1004, carbs 1005, fibre 1079). The **SR Legacy** entry for the same oil (fdc 172336) has all 5. Because the selector prefers Foundation, **8 well-known oils** scored "no nutrient data" → low → review. In the snapshot, all 8 Foundation oils (canola, corn, soybean, olive ×2, peanut, sunflower, safflower) carry **zero** macros.

### Decision — *Foundation remains authoritative, but PER-NUTRIENT*

> **Foundation stays authoritative for every macro it actually provides. Only MISSING key macros are completed from a fallback. This is "macro completion", never "wholesale replacement".**

This answers the design question directly: a blanket *"Foundation → SR Legacy"* swap would **discard** Foundation's superior analytical detail; keeping Foundation authoritative *but only filling its gaps* means the worst case of the fallback is "no change" — which makes it **safe to run automatically**. Implemented in `shared/catalogue/macro-fallback.ts`.

**Fallback order for a missing macro:**
1. **SR Legacy reviewed table** — real per-100 g values carried with their source `fdcId` for provenance.
2. **Pure-fat derivation** (Atwater identity) — a pure culinary oil is ~100 g fat / 884 kcal / 0 protein / carb / fibre per 100 g. A *physical identity*, not an estimate. Gated to true oils / named rendered fats only (`\boil\b`, `lard|tallow|dripping|ghee|suet`); explicitly **excludes** anything naming `cheese, cream, milk, flour, spread, "full fat"` so dairy/flour foods are never mis-derived.

Every nutrient records its provenance (`foundation | sr_legacy | derived_pure_fat | missing`).

### Before → After (the three requested oils + the batch)

| Food | Source | Before (Foundation) | After | Confidence |
|---|---|---|---|---|
| **Canola oil** | SR Legacy fdc 172336 | 0/5 macros → **low/review** | 884 kcal · 100 g fat · 0 · 0 · 0 | **medium** |
| **Olive oil** (extra virgin) | derived pure-fat | 0/5 macros → **low/review** | 884 kcal · 100 g fat · 0 · 0 · 0 | **medium** |
| **Coconut oil** | Foundation kept; fibre derived | 4/5 (no fibre) | 833 kcal · 99.1 g fat · 0 · 0.84 · **0 (derived)** | medium |

Across the batch: **9 foods** completed (8 zero-macro oils + coconut's missing fibre). Of those 9, **8 were confidence=low in WS0.11 → 0 remain low**. **0 Foundation values were overwritten.** The dairy/flour false-positives that an earlier draft produced (sour cream, cream cheese, soy flour wrongly stamped 884 kcal) were caught in validation and eliminated by the gating rule above.

---

## Part D — Promotion Readiness Score

`shared/catalogue/promotion-readiness.ts` scores each catalogue food on a transparent 100-point rubric:

| Axis | Points |
|---|---|
| Name quality (auto 20 / review 12 / manual 0) | 20 |
| Category mapped | 20 |
| Subcategory mapped | 20 |
| Macros present (scaled by 0–5 of the key macros, post-fallback) | 20 |
| Aliases resolved | 10 |
| Scientific name | 10 |
| **Total** | **100** |

### Thresholds (the routed stages)

| Stage | Rule | Meaning |
|---|---|---|
| **Ready for Canonical** | score ≥ 90 **and** name ≠ manual **and** category mapped **and** ≥ 4/5 macros | A THA reviewer signs off; nothing left to author |
| **Ready for Claude authoring** | score ≥ 50 **and** name ≠ manual | Enough signal for Claude to draft name / aliases / subcategory |
| **Needs THA review first** | score < 50 **or** name = manual | A human must resolve identity before automation helps |

### Result on the snapshot

Mean score **60.7 / 100**. Stage split: **8 ready_for_canonical** (e.g. *Okra, Endive, Mustard greens, Broccoli raab, Chickpea flour*), **257 ready_for_claude_authoring** (87%), **30 needs_tha_review**. The ceiling on most whole foods is the WS0.11 **subcategory gap** (−20) and `review`-band names (−8), both editorial — not data problems.

---

## Part E — Promotion Queue

The promotion pipeline:

```
Catalogue (draft) → Normalised → Promotion-ready → Claude authors → THA review
                  → Canonical → Knowledge → Relationships → Production
```

Readiness answers *"is this food clean?"*; the queue answers *"which clean food do we promote first?"*. `rankPromotionQueue()` ranks **demand-first**:

```
priority = demandSignal · 100 · 0.7  +  readiness · 0.3
```

Demonstrated: with demand weighting, a frequently-eaten food at readiness 80 (`oats`, demand 0.9 → priority 87.0) is promoted **ahead of** an obscure food at readiness 95 (`oca`, demand 0.0 → priority 28.5).

### Questions answered

- **Should frequently-encountered foods be promoted first?** **Yes.** Curation is the scarce resource; a food that appears in real household pantries/logs earns it before an obscure one. Demand dominates the ranking, with readiness as the quality floor and tie-breaker.
- **Should household demand influence priority?** **Yes** — via an opaque `demandSignal` (0–1) supplied by the caller (e.g. normalised household-log frequency). **Catalogue scope does not itself read household data** — it accepts the signal as a parameter, keeping the layer boundary clean. (Wiring the real signal is a future workstream; the ranking is ready for it.)

---

## Validation Results (re-run of the WS0.11 500-food snapshot)

`npx tsx server/scripts/ws012-normalisation.ts` (analysis-only, no DB write):

| Axis | Before | After |
|---|---|---|
| **Names** | 278/316 (88%) inverted/machine | 238 auto + 57 review + **0 manual** |
| **Confidence (low)** | 14 | **6** |
| **Prepared foods** | 21 leaked into staging | **0** (24 blocked) |
| **Duplicates** | 7 collisions | 12 collisions — **all same-food dups, 0 distinct merges** |
| **Review count** | 14 | 6 |
| **Macro gaps** | 8 oils with 0 macros | **0** (completed, provenance-tracked) |

Machine-readable report: `data/usda-snapshot/ws012-normalisation-report.json`.

### Before / After name examples

| Raw USDA | Normalised | Band |
|---|---|---|
| `Nuts, almonds, dry roasted, with salt added` | Almonds | auto |
| `Cheese, cottage, lowfat, 2% milkfat` | Cottage cheese | auto |
| `Grapefruit juice, white, canned or bottled, unsweetened` | White grapefruit juice | auto |
| `Oil, olive, extra virgin` / `Oil, olive, extra light` | Extra virgin / Extra light olive oil | review (kept distinct) |
| `Milk, nonfat, fluid, …(fat free or skim)` | Milk (+ alias "fat free or skim") | auto |
| `Beans, Dry, Medium Red (0% moisture)` | Dry medium red *(beans)* | review → Claude |

---

## Migration Implications

| | |
|---|---|
| Reads existing data | **Yes** — canonical seed for resolution; the committed WS0.11 snapshot |
| Writes new data | **Yes (when a refresh is run)** — catalogue rows only (`tier='catalogue'`, `status='draft'`). WS0.12 as delivered is analysis-only. |
| Changes meaning of existing data | **No** — canonical rows untouched; the new pipeline fields are additive |
| Requires backfill | **Yes — catalogue refresh only.** A future `--write` run re-stages the 295 normalised rows (cleaner names, completed macros, promotion scores) replacing the 309 WS0.11 draft rows. Reversible via the WS0.11 `--rollback`. |

The new result fields (`rawName`, `nameQuality`, `aliasCandidates`, `macroFallbackUsed`, `macroSource`, `promotionScore`, `promotionStage`, `preparedToken`) are optional additions to `CatalogueIngestionResult`; no existing consumer breaks.

---

## Trust Check

> Could this rename foods incorrectly, hide useful foods, remove legitimate regional foods, or accidentally promote prepared dishes?

| Risk | Outcome | How prevented |
|---|---|---|
| **Rename foods incorrectly / merge distinct foods** | **0 distinct merges** | Only known-NOISE segments are dropped; unknown qualifiers are kept → `extra virgin` vs `extra light` olive oils stay distinct. `review` band flags every retained qualifier for human confirmation. |
| **Hide useful foods** | **0 wrongly blocked** | ALLOW_LIST overrides block tokens (custard apple, breadfruit, applesauce, marrow); whole-word matching keeps `rolled`/`applesauce` safe; `tart`/`curry` removed after false-positive review. |
| **Remove legitimate regional foods** | Preserved | Parenthetical regional names are **harvested as aliases**, not discarded ("Oca" keeps "New Zealand yam"); US→UK map unchanged. |
| **Accidentally promote prepared dishes** | **0 leak** | Prepared filter runs in the **core pipeline** before staging; 24 composites skipped; promotion score gates the rest. |
| **Invent / overwrite nutrition** | **0 overwrites** | Macro fallback only fills MISSING macros; Foundation values are authoritative; pure-fat derivation gated away from dairy/flour; every value provenance-tracked. |

All four WS0.11 trust guarantees (no duplicates, no branded imports, no nutrition overwrite, no canonical pollution) **still hold** — WS0.12 only touches the draft catalogue.

---

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| `review`-band names ship unedited | Medium | Medium | Promotion stage gates them to Claude authoring / THA review; never auto-promoted |
| Blocklist over-blocks a real food at scale | Medium | Medium | ALLOW_LIST + whole-word matching + documented false-positive tuning (`tart`, `curry`); audit blocked list each ingestion |
| SR Legacy fallback table is small | Low | Medium | Pure-fat derivation backstops oils generically; table grows with each source; provenance makes gaps visible |
| Pure-fat derivation mis-fires on a fatty non-oil | Low | Low | Gated to `\boil\b`/named rendered fats and explicitly excludes cheese/cream/milk/flour/"full fat" — verified 0 mis-fires |
| Subcategory `null` caps promotion scores | Medium | High | Editorial enrichment queue (carried from WS0.11); honest `null`, not a fake value |
| Demand signal not yet wired | Low | High | Queue accepts the signal as a parameter today; wiring household-log frequency is a future workstream |

---

## Success Criteria

| Criterion | Status |
|---|---|
| Catalogue names look human | ✅ 81% auto, 0 manual, 0 machine-inverted |
| Prepared foods filtered | ✅ 24 blocked in-pipeline, 0 leak, 0 false block |
| Macro fallback resolved | ✅ 9 completed, 8 low→resolved, 0 overwrites |
| Promotion score defined | ✅ 100-pt rubric + 3 routed stages |
| Promotion queue designed | ✅ demand-first ranking, demonstrated |
| Existing canonical foods untouched | ✅ pipeline-only change, analysis run |
| Internal catalogue becomes promotion-ready | ✅ mean 60.7/100; 8 ready-for-canonical, 257 ready-for-Claude |

---

## Implementation Files

| File | Purpose |
|---|---|
| `shared/catalogue/name-normaliser.ts` | Part A — USDA → THA display name + alias harvest + quality band |
| `shared/catalogue/prepared-food-filter.ts` | Part B — pipeline-level prepared-dish ALLOW/BLOCK filter |
| `shared/catalogue/macro-fallback.ts` | Part C — per-nutrient macro completion (SR Legacy + pure-fat) |
| `shared/catalogue/promotion-readiness.ts` | Parts D+E — readiness score + demand-first queue |
| `shared/catalogue/pipeline.ts` | Wires the four stages into `ingestFood` (skip / normalise / fallback / score) |
| `shared/catalogue/types.ts`, `index.ts` | Additive result fields + exports |
| `server/scripts/ws012-normalisation.ts` | Validation runner — before/after over the 500-food snapshot |
| `data/usda-snapshot/ws012-normalisation-report.json` | Machine-readable before/after report |

Run: `npx tsx server/scripts/ws012-normalisation.ts`

---

## Scope Lock

Implemented **only** catalogue normalisation and promotion readiness. **Not** implemented (by design): catalogue foods are **not** exposed; no Discovery; no Alternatives; no Stories; no Food Reports; no production UX change. The pipeline change affects only `tier='catalogue'`, `status='draft'` staging — invisible to every production query.

---

## SUGGESTION (future ideas, out of scope for WS0.12)

- **Wire the real demand signal** — feed normalised household-log / pantry frequency into `rankPromotionQueue` so curation truly follows demand.
- **Write-mode refresh** — a `ws012 --write` that re-stages the 295 normalised rows over the WS0.11 drafts (with `--rollback`), once names/macros are reviewed.
- **Fold the remaining acquisition filters into the pipeline** — the category allow-list and >4-qualifier cut still live in `build-snapshot.py`; move them beside the prepared filter so any source self-protects fully.
- **Subcategory enrichment pass** — the single biggest lever on promotion scores (most whole foods cap at medium because subcategory is `null`).
- **Grow the SR Legacy macro table + Atwater energy derivation** — extend beyond oils to any Foundation food missing energy, deriving kcal from protein/fat/carb where macros exist.
- **Claude name-authoring trial on the 57 `review`-band names** — measure how many Claude can finalise without THA touch (a WS0.6-style trial for names).
- **Singular/plural canonical convention** — decide and enforce (USDA is plural-heavy: "Almonds", "Peppers"); currently left to review.
- **UK Food Composition Tables ingestion** — adds laverbread, samphire, salsify USDA lacks and overrides UK-staple nutrients; pushes recognition past the ~4,000 USDA ceiling.
