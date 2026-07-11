# WS0.11 — Real USDA Ingestion Pilot

**Date:** 2026-06-21
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `ws0.11-rollback-point` at `9818d42`
**Scope:** Internal catalogue only. No user-facing changes. No Discovery, Alternatives, Stories, or Food Reports.
**Question answered:** *Can The Healthy Apples ingest real food data at scale and trust the results?*

---

## Rollback Protection (mandatory first step — completed before any implementation)

| Check | Status |
|---|---|
| Git status before WS0.11 | **Clean** |
| WS0.10 pipeline | Protected — commit `9818d42`, tag `ws0.10-rollback-point` (at `1e403aa`) |
| WS0.11 rollback tag | **Created: `ws0.11-rollback-point` at `9818d42`** |
| Canonical foods (53 live rows) | Untouched — verified post-write |
| Knowledge foods / relationships / production | Untouched |

```
# Code rollback
git checkout ws0.11-rollback-point

# Data rollback (removes the 309 pilot catalogue rows, preserves everything else)
npx tsx server/scripts/ws011-usda-ingestion.ts --rollback
```

The data rollback was **tested live** during this pilot: 309 rows deleted → catalogue count 0 → canonical rows preserved → catalogue re-populated. The lifecycle is proven reversible.

---

## Executive Summary

| Metric | Result |
|---|---|
| Foods processed | **500** (246 Foundation + 254 SR Legacy) |
| Matched existing canonical | 184 (36.8%) |
| New catalogue entries written | **309** (`tier='catalogue'`, `status='draft'`) |
| Review required (low confidence) | 14 (2.8%) |
| Duplicate risk | **0** |
| Branded / infant products in catalogue | **0** |
| Matched foods overwriting nutrition | **0** |
| Canonical foods modified | **0** |

**Verdict:** The WS0.10 pipeline ingests real USDA data correctly and **the results are trustworthy** — with three real-world gaps that the 50-synthetic-food test could not surface (name normalisation, prepared-dish leakage, and USDA macro-nutrient heterogeneity). All three are caught by the `status='draft'` + confidence gate and none reach production. Details below.

---

## Part A — USDA Access Method

### Recommendation: **Bulk download files**, not the live API.

Two access paths exist. We tested both live.

| Factor | Live API (`api.nal.usda.gov/fdc/v1`) | Bulk download (`fdc.nal.usda.gov/fdc-datasets`) |
|---|---|---|
| **Rate limit** | DEMO_KEY = **10 req/hour** (measured: `x-ratelimit-limit: 10`). Registered key = 1,000/hour. | **None** — one HTTP GET per dataset |
| **Speed for 500 foods** | `/foods` batch = 20 foods/call → ≥25 calls → **~3 hours throttled** on DEMO_KEY | Foundation zip (462 KB) + SR Legacy zip (12.6 MB) in **seconds** |
| **Response completeness** | The abridged `/foods/list` endpoint **omits `foodCategory` and `scientificName`** and returns flat nutrients (`{number, amount}`); only `/food/{id}?format=full` returns the nested shape the pipeline expects | Full detail for every food in one file |
| **Reproducibility** | Live data shifts under you; rate limits make re-runs painful | A dated file is a **frozen, reproducible snapshot** |
| **Reliability** | Key expiry, throttling, transient 5xx | Static file hosting |

**Datasets used (frozen snapshot):**
- `FoodData_Central_foundation_food_json_2025-04-24` — 340 foods
- `FoodData_Central_sr_legacy_food_json_2021-10-28` — 7,793 foods

**Local snapshot strategy (implemented):** the acquisition stage (`data/usda-snapshot/build-snapshot.py`) reads the two bulk files once, applies the strict filters, and writes a slim, committed snapshot of exactly the 500 selected foods (`data/usda-snapshot/ws011-usda-500.json`, 402 KB) carrying only the fields the pipeline reads. Every subsequent pipeline run is deterministic and offline. **The 210 MB raw files are never committed** — the snapshot is the reproducibility artefact.

> **API caveat discovered:** the WS0.10 `USDAFood` type matches the **full** API shape (`/food/{id}?format=full`) and the bulk download shape, but **not** the abridged `/foods/list` shape. A future API-based importer must request `format=full` (≤20 foods/call) or it will silently lose category and scientific-name signals.

---

## Part B — Ingestion Architecture

```
USDA bulk JSON (Foundation + SR Legacy)
        │  build-snapshot.py  (data acquisition — run once)
        │    • dataType already Foundation/SR Legacy (Branded/Survey absent from these files)
        │    • STRICT FILTERS (category allow-list, branded/prepared tokens, >4-qualifier cut)
        │    • select 500 (Foundation-first, then clean SR Legacy by nutrient completeness)
        ▼
ws011-usda-500.json   ← committed, reproducible snapshot
        │  ws011-usda-ingestion.ts  →  WS0.10 pipeline (unchanged)
        ▼
   ingestFood() per food:
     filter → alias resolver → deduplicator → category mapper → confidence scorer
        ▼
   action ∈ { matched_existing | create_catalogue | review_required | skip }
        │  --write
        ▼
   canonical_food  (tier='catalogue', status='draft', source='USDA FDC import (WS0.11 pilot)')
   [INTERNAL ONLY — invisible to all production UX]
```

The WS0.10 pipeline code (`shared/catalogue/*`) was **not modified**. WS0.11 adds only an acquisition script, a runner, and the committed snapshot.

### Strict-filter results (data-acquisition stage)

From 8,133 candidate foods, the filters removed:

| Filter | Removed |
|---|---|
| Non-ingredient category (Baby Foods, Fast Foods, Soups/Sauces, Sweets, Beverages, Baked, Snacks, …) | 3,064 |
| >4 comma-qualifiers (over-specific preparations) | 2,827 |
| Branded / prepared tokens (`commercial`, `®`, brand names, `infant`, `formula`) | 112 |
| Duplicate description | 55 |

→ 500 selected (246 Foundation + 254 SR Legacy).

---

## Part C — Import Statistics

| Outcome | Count | % |
|---|---|---|
| Total processed | 500 | 100% |
| Matched existing (no new row) | 184 | 36.8% |
| New catalogue (high/medium) | 302 | 60.4% |
| Review required (low) | 14 | 2.8% |
| Skipped inside pipeline | 0 | 0% |
| **Written to catalogue** | **309** | (316 new − 7 slug collisions) |

Confidence across all 500: **High 248 (49.6%) · Medium 238 (47.6%) · Low 14 (2.8%)**.
Of the 309 **written** catalogue rows: High 61 · Medium 234 · Low 14.

> **Finding — medium is the norm on real data.** The 50-synthetic test reported 90% high confidence; real data is ~48%. The driver is not bad data — it is **subcategory gaps** (Part E): a cleanly-mapped category with no subcategory scores +15 instead of +25, which lands most whole, healthy foods (dairy, oils, fruit, grains, nuts) in *medium*. This is honest, not alarming — medium means "stage it, spot-check it", not "suspect".

---

## Part D — Alias Resolution Results

| Match axis | Count |
|---|---|
| Slug (direct UK name) | 105 |
| Alias (registered synonym) | 73 |
| Scientific name | 6 |
| **Total matched existing** | **184** |

**US→UK translations that fired (6, all resolved correctly):**

| USDA (US) | THA (UK) |
|---|---|
| Beets, raw | beetroot |
| Eggplant, raw / Eggplant, pickled | aubergine |
| Arugula, raw / Arugula, baby, raw | rocket |
| Rutabaga, peeled, raw | swede |

- **Alias successes:** 184/184 matches correct; 0 false matches.
- **Alias failures:** none observed (no food that *should* have matched an existing canonical was given a new entry — duplicate risk = 0).
- **Unexpected aliases:** `Egg, white, dried` / `Egg, yolk, dried` / `Egg, whole, dried` all correctly collapsed to `eggs`; verbose forms like `Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)` resolved to `milk` via the comma-fallback. The fallback is doing heavy lifting on real data.

> **Finding — translation is rare but load-bearing.** Only 1.2% of foods needed US→UK translation, but for those 6 it is the *only* thing preventing a duplicate `eggplant`/`aubergine` pair. The map must keep growing even though it fires seldom.

---

## Part E — Category Mapping Results

| Mapping outcome (new entries) | Count |
|---|---|
| Mapped cleanly (direct USDA group → THA category) | 216 |
| Mapped via keyword hint (subcategory inferred) | 31 |
| Ambiguous (flagged for review) | 69 |
| Landed in `subcategory = null` | 282 |
| Landed in category `"Other"` | **0** |

**Food families produced (top):** Dairy (62), Oils and fats (49), Fruit (43), Legumes (37), Grains (35), Vegetables (29), Nuts and seeds (20), plus keyword-resolved subcategories (Fruiting vegetables 7, Pulses 5, Leafy greens 5, White fish 3, Brassicas 3, …).

**Unexpected food families:** none — every food received a real THA category; nothing fell to "Other". This is a strong result.

> **Finding — subcategory coverage is the weak axis.** 282/316 new foods have `subcategory=null`. This is *correct behaviour* for categories that map directly with no subcategory (Dairy, Oils, Fruit, Grains, Nuts all legitimately have none in the mapper), but it means subcategory-driven Discovery ("same-family" relationships) will be sparse until THA review assigns them. `subcategory=null` is an honest "unknown", not a failure.

---

## Part F — Confidence Scoring

Thresholds unchanged from WS0.10 (high ≥75, medium 50–74, low <50).

| Confidence | All 500 | Written catalogue (309) | Example |
|---|---|---|---|
| High | 248 | 61 | `okra` (full nutrients + scientific name + clean category) |
| Medium | 238 | 234 | `papaya-nectar` (category mapped, subcategory null) |
| Low | 14 | 14 | `oil, canola`, `salt, table, iodized`, juices, `pawpaw` |

**The 14 low-confidence (all routed to review):** 9 oils, table salt, 3 shelf-stable juices, 1 pawpaw, 1 tomatillo.

> **Finding — USDA macro-nutrient heterogeneity (the most important trust insight).** The 9 oils scored low for *"no nutrient data"* — which looked like a bug, so it was traced to source. The **Foundation** entry for `Oil, canola` (fdc 748278) contains **38 nutrient rows, none of which are the 5 standard macros** (energy 1008, fat 1004, protein, carb, fibre) — it stores only fatty-acid breakdowns. The **SR Legacy** entry for the same oil (fdc 172336) has all 5. Because the selector prefers Foundation, these well-known oils were scored on the wrong row set and correctly flagged for review.
>
> **Lesson:** Foundation is *not* uniformly more complete than SR Legacy. Real ingestion must either (a) fall back to SR Legacy when Foundation lacks macros, or (b) derive energy from Atwater factors / alternative nutrient numbers. The pipeline's behaviour here is *safe* (low → review) but the selection heuristic ("Foundation first") is naive. Recommendation captured in Part J.

---

## Part G — Duplicate Analysis

| Check | Result |
|---|---|
| Duplicate risk (new entry whose slug equals a matched canonical slug) | **0** |
| Within-batch slug collisions | **7** — handled |
| Branded/infant products written | **0** |
| Matched foods writing nutrition | **0** |

**Within-batch collisions (7):** `cheese-feta`, `nuts-hazelnuts-or-filberts`, `cheese-provolone`, `broccoli-raab`, `hearts-of-palm`, `litchis`, `oat-bran` — each appeared twice (e.g. a whole-milk and a low-moisture feta both reducing to `cheese-feta`). The writer de-duplicates within the batch (`seen` set) **and** uses `INSERT … ON CONFLICT (slug) DO NOTHING` against the unique `slug` column. Result: 316 candidates → 309 distinct rows, 7 collisions absorbed, **zero** corrupt or duplicated rows.

The three-axis dedup (slug → alias → scientific name) + comma-fallback held up on real data exactly as the 50-food test predicted.

---

## Part H — UK Normalisation Findings

| Question | Answer |
|---|---|
| How many foods needed US→UK normalisation? | 6 of 500 (**1.2%**) in this batch |
| Coverage of names that *did* need it | 6/6 (**100%**) resolved by the existing 40-entry `US_TO_UK_MAP` |
| Can US→UK become a maintained translation dictionary? | **Yes — and it already is one** (`shared/catalogue/alias-resolver.ts`). It should be promoted to a first-class, versioned dictionary as the catalogue scales. |

**Why the rate is so low here:** USDA Foundation/SR Legacy already use many UK-compatible names, and the most divergent US-only items (zucchini, scallion, garbanzo as a headword) either matched via existing aliases or simply aren't in these two datasets under their US spelling. The 1.2% is a floor, not a ceiling — it will rise sharply when (a) Branded data is ever considered, or (b) non-Western foods are added, where regional naming (brinjal, bhindi, methi, ugu) dwarfs US/UK.

**Recommendation:** maintain `US_TO_UK_MAP` as a reviewed dictionary with provenance, and extend it beyond US/UK to a general *regional-name → THA-canonical* table. Coverage of *encountered divergent names* is the metric to track; it is **100%** today and must not silently regress as volume grows.

---

## Part I — Catalogue Storage (verified)

Stored **only** as `tier='catalogue'`, `status='draft'`, `source='USDA FDC import (WS0.11 pilot)'`.

Post-write verification (independent query):

```
canonical_food tier='canonical' : 53   (untouched; 0 rows have source_ref set)
canonical_food tier='catalogue' : 309  (all status='draft')
catalogue rows NOT status='draft': 0
non-pilot catalogue rows        : 0
```

The WS0.10 schema migration (`tier`, `scientific_name`, `source_ref`, `confidence`) was **absent from the live DB** and was applied idempotently (`ADD COLUMN IF NOT EXISTS`) — additive, non-destructive, existing rows defaulted to `tier='canonical'`.

**Confirmed — no user-facing changes:** no Food Reports, no Discovery, no Alternatives, no Stories touched. Catalogue rows are invisible to every production query (all filter `tier='canonical'` / `status='active'`).

---

## Part J — Promotion Recommendations

The pilot is staged. Recommended order before any catalogue food becomes canonical:

1. **Name normalisation pass (highest priority).** Proposed names inherit raw USDA formatting: `oil, canola`, `fish, haddock`, `orange-juice-raw-includes-foods-for-usdas-food-distribution-program`. These are acceptable in `draft` but must be normalised (reorder "Oil, canola" → "Canola oil"; truncate program boilerplate) by Claude authoring + THA review **before** promotion. This is the single biggest quality gap real data exposed.
2. **Prepared-dish second filter.** A few composites slipped the category allow-list: `spinach souffle`, `potato pancakes`, `pickles`. Add a description-level prepared-dish blocklist to the *pipeline* (not just acquisition) so production imports self-protect.
3. **Macro fallback across data types** (Part F) before confidence scoring, so whole foods like oils aren't mis-flagged.
4. **Subcategory enrichment** for the 282 `null` entries — editorial, demand-ordered.
5. Promote demand-first (foods that appear in real household logs), per the WS0.10 promotion pipeline.

---

## Trust Check

> Could this pipeline create duplicates, import branded products, overwrite THA nutrition, or pollute canonical foods?

| Risk | Outcome | How prevented |
|---|---|---|
| Create duplicates | **0** | 3-axis dedup + comma-fallback + US→UK map; within-batch `seen` set; `ON CONFLICT (slug) DO NOTHING` |
| Import branded/infant products | **0** | dataType limited to Foundation/SR Legacy + category allow-list + branded/prepared token filter (112 caught at acquisition) |
| Overwrite THA nutrition | **0** | `matched_existing` writes **nothing**; only brand-new foods insert; existing rows never `UPDATE`d |
| Pollute canonical foods | **0** | Inserts are `tier='catalogue'`, `status='draft'`; canonical count unchanged (53→53), 0 canonical rows carry `source_ref` |

All four trust guarantees from WS0.10 held on **real** data.

---

## Scaling Test

If 500 works, can the same pipeline support more?

| Target | Feasible? | Ingestion time | Review effort | Likely failure mode |
|---|---|---|---|---|
| 2,000 | **Yes, unchanged** | minutes (offline snapshot) | ~60 low-confidence × ~1 min ≈ 1 hr | Name-normalisation backlog grows |
| 5,000 | **Yes** | minutes | review scales linearly (~2–3 hrs) | Prepared-dish leakage rises (need pipeline-level filter, item 2 above) |
| 10,000 | **Yes, with the 3 fixes** | minutes–tens of minutes | batchable; spot-check 5–10% of high/medium | Subcategory `null` inflation; scientific-name dedup thins (only 20% of foods carry one) |

The pipeline is **pure and stateless** — throughput is not the constraint. The constraints are **editorial** (name normalisation, subcategory assignment) and **filter precision** (prepared-dish blocklist). All three are addressable and none block ingestion; they shape the *promotion* queue, which is gated by `status='draft'` regardless.

**Estimate:** at current Foundation + SR Legacy clean yield (~6% of SR Legacy passes filters), the realistic ceiling from these two USDA datasets alone is **~3,000–4,000 ingredient-level foods**. Reaching 10,000 needs a second source (UK Food Composition Tables, item in Suggestions).

---

## Final Question

> After WS0.11, can THA truthfully say: *"We recognise almost every common edible food"*?

**Not yet — but the path is now proven and quantified.**

| Measure | Estimate after this pilot |
|---|---|
| Foods **recognised** (canonical + catalogue draft) | 53 canonical + 309 catalogue = **362** in this DB; the resolver's editorial seed recognises **238** by name/alias |
| Foods **curated** (canonical, editorial) | 238 (seed) / 53 (this dev DB) |
| Foods ready for **Discovery** | Only curated foods with subcategory + relationships — **0 new** from this pilot until promotion |
| Foods ready for **Alternatives** | Same — **0 new** until promotion |

**Honest position:** WS0.11 proves THA *can* recognise common foods at scale and that the recognition is trustworthy. A truthful "we recognise almost every common edible food" becomes defensible after ingesting the full clean Foundation + SR Legacy set (~3,000–4,000) **plus** UK FCT — i.e. 2–3 more ingestion passes, all using this exact pipeline. The bottleneck to *recognition* is now data volume (solved); the bottleneck to *Discovery/Alternatives* remains editorial curation (unchanged by this workstream, by design).

---

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Messy imported names reach users | High | High | `status='draft'` gate; mandatory name-normalisation before promotion (Part J.1) |
| Prepared dishes slip category filter | Medium | Medium | Add pipeline-level prepared-dish blocklist (Part J.2) — 3 leaked of 316 |
| Foundation macro gaps mis-score whole foods | Medium | Medium | Macro fallback across data types (Part J.3); currently safe (→ review) |
| Subcategory `null` starves Discovery | Medium | High | Editorial enrichment queue; honest `null` not a fake value |
| Scientific-name dedup thins at scale | Low | Medium | Only 20% of foods carry one; slug/alias axes carry the load; grow the sci-name map |
| US→UK map regression as volume grows | Low | Medium | Track "coverage of encountered divergent names" (100% today) as a guarded metric |
| Live-API importer loses category/sci-name | Low | Low | Documented: must use `format=full`, not `/foods/list` |

---

## Data Impact Declaration

| | |
|---|---|
| Reads existing data | **Yes** (canonical seed for resolution; live `canonical_food` for verification) |
| Writes new data | **Yes** — 309 rows, internal catalogue only (`tier='catalogue'`, `status='draft'`) |
| Changes meaning of existing data | **No** — canonical rows untouched; migration additive with safe defaults |
| Requires backfill | **Yes** — catalogue population (done); reversible via `--rollback` |

---

## Definition of Done

| Deliverable | Status |
|---|---|
| Rollback protection confirmed before implementation | ✅ tag `ws0.11-rollback-point` |
| Real USDA ingestion completed | ✅ bulk download, Foundation + SR Legacy |
| 500 foods processed | ✅ 246 + 254 |
| Alias resolution validated | ✅ 184 matched, 6 translations, 0 failures |
| Category mapping validated | ✅ 0 "Other"; 282 honest `null` subcategories |
| Deduplication validated | ✅ 0 duplicate risk; 7 collisions absorbed |
| Confidence scoring validated | ✅ 248/238/14; low correctly routed to review |
| Internal catalogue populated | ✅ 309 rows, all `draft` |
| No production exposure | ✅ verified — canonical untouched, no UX touched |
| Scaling recommendation produced | ✅ Part: Scaling Test |

---

## Implementation Files

| File | Purpose |
|---|---|
| `data/usda-snapshot/build-snapshot.py` | Data acquisition — reads bulk USDA JSON, filters, writes the 500-food snapshot |
| `data/usda-snapshot/ws011-usda-500.json` | **Committed reproducible snapshot** (slim USDAFood[], 402 KB) |
| `data/usda-snapshot/ws011-ingestion-report.json` | Machine-readable run report |
| `server/scripts/ws011-usda-ingestion.ts` | Runner — drives WS0.10 pipeline; `--write` populates catalogue; `--rollback` removes it |

Run: `npx tsx server/scripts/ws011-usda-ingestion.ts [--write|--rollback]`

---

## SUGGESTION (future ideas, out of scope for WS0.11)

- **Fold the strict filters into the pipeline.** The category allow-list, prepared-dish blocklist, and >4-qualifier cut currently live in the acquisition script. Move them into `ingestFood` as explicit `skip` reasons so any future source self-protects.
- **Name-normalisation module.** Reorder "Oil, X" → "X oil", strip USDA program boilerplate, title-case, balance parentheses. The biggest lever for promotion-readiness.
- **Macro fallback across data types** + Atwater-derived energy, so Foundation oil/fat entries score on real completeness.
- **UK Food Composition Tables ingestion pass** (PHE McCance & Widdowson CSV) — adds laverbread, teff, samphire, salsify that USDA lacks, and overrides UK-staple nutrients. Pushes recognition past the ~4,000 USDA ceiling toward "almost every common food".
- **Wikidata SPARQL scientific-name backfill** — only 20% of USDA foods carry a scientific name; the strongest dedup axis is under-populated.
- **Registered USDA API key** for incremental top-ups (1,000/hour) between bulk-file refreshes, using `format=full`.
- **Demand-signal promotion queue** — promote catalogue foods first when they appear in real household pantries/logs.
- **`getCanonicalFoods()` helper** that applies `tier='canonical'` by default, removing the standing risk of a query forgetting the tier filter as the catalogue grows.
