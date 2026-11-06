---
title: Uncited Claim Source Research — Batch 3 + Queue Composition Analysis
date: 2026-11-06
author: Claude (Sonnet 5), at the direction of Colin Clapson
audience: Codex (nutrition-source review task) and human reviewer
status: research only — nothing attached to the app or database
---

# Batch 3 + a structural analysis of the whole composition queue

Continues [Batch 1](./SOURCE_RESEARCH_BATCH1_20261106.md) and
[Batch 2](./SOURCE_RESEARCH_BATCH2_20261106.md). Read-only research; nothing
attached to the app or database.

## The headline finding: ~23% of the composition queue cannot be sourced from USDA or CoFID at all

Queried every nutrient slug across the full 936-claim uncited **composition**
edge (not just this batch) to see which nutrients recur most:

| Nutrient | Uncited claims | USDA/CoFID coverage |
|---|---:|---|
| polyphenols | 167 | **None** — not a tracked value in SR Legacy, Foundation, or (checked) CoFID |
| anthocyanins | 19 | **Specialist DB only** — USDA Flavonoid Database Rel. 3.3 (Access file, not JSON) |
| flavonoids | 15 | **Specialist DB only** — same database |
| sulforaphane | 4 | **None** — forms during preparation (chopping/cooking), not a stored composition value |
| live-cultures | 8 | **None** — a microbiology/manufacturing fact, not a nutrient; no composition database tracks it |
| allicin | 2 | **None** — unstable compound, forms on crushing, not meaningfully a stored "per 100g" value |
| nitrates | 1 | **None** in USDA/CoFID — would need a specialised source (e.g. EFSA nitrate opinion data) |
| **Subtotal — effectively unsourceable this way** | **216 (23.1%)** | |
| beta-carotene | 4 | **Yes** — "Carotene, beta" is a standard tracked value (verified: carrots show 8,280 µg/100g) |
| choline | 4 | **Yes** — "Choline, total" is standard (verified: carrots show 8.8 mg/100g) |
| protein / fibre / iron / calcium / zinc / vitamin-b12 / vitamin-c / vitamin-k / folate / magnesium / selenium / iodine / plant-protein / unsaturated-fats / vitamin-d / vitamin-e / potassium / copper / omega-3 / vitamin-b6 / vitamin-a / manganese | 712 (76%) | **Yes** — standard USDA/CoFID values, as demonstrated across all three batches |

**Practical implication for Codex and any future reviewer**: don't spend
research time per-claim rediscovering that `→ polyphenols` has no source —
it won't, for any food, because the database family doesn't carry the
value. The ~216 phytochemical claims need one of: (a) building a separate
ingestion path for the USDA Flavonoid Database (covers anthocyanins and
flavonoids, Access-format, needs conversion tooling), (b) a different
specialised source per compound (sulforaphane/allicin/nitrates — likely
nothing citable at the "per 100g, stored value" level the app's claim model
expects, since these compounds are prep-dependent rather than fixed food
properties), or (c) accepting these ~216 claims stay uncited indefinitely as
an honest gap. That's a product/scope decision, not a research task.

## Batch 3 findings (the other ~77%)

| Claim ID | Food | Nutrient | Source | Value (per 100g) | Match | Limitations | Recommendation |
|---|---|---|---|---|---|---|---|
| 2069 | black-eyed-peas | folate | USDA FDC 173759 "Cowpeas, common (blackeyes, crowder, southern), mature seeds, cooked, boiled, without salt" (SR Legacy) | 208 µg DFE | Direct — USDA's name for black-eyed peas is "cowpeas (blackeyes)" | None | **Candidate** |
| 3205 | black-eyed-peas | protein | same record | 7.73 g | Direct | None | **Candidate** |
| 2067 | black-eyed-peas | fibre | same record | 6.5 g | Direct | None | **Candidate** |
| 2070 | black-eyed-peas | iron | same record | 2.51 mg | Direct | None | **Candidate** |
| 551 | broad-beans | plant-protein | USDA FDC 173753 "Broadbeans (fava beans), mature seeds, cooked, boiled, without salt" (SR Legacy) | 7.6 g | Direct — broad beans = fava beans | None | **Candidate** |
| 2082 | buttermilk | calcium | USDA FDC 170874 "Milk, buttermilk, fluid, cultured, lowfat" (SR Legacy) | 116 mg | Reasonable | Low-fat specifically; whole buttermilk would differ slightly | **Candidate** |
| 2083 | buttermilk | vitamin-b12 | same record | 0.22 µg | Reasonable | Same as above | **Candidate** |
| 4534 | cacao-powder | fibre | USDA FDC 169593 "Cocoa, dry powder, unsweetened" (SR Legacy) | 37 g | Reasonable — "cacao powder" and "cocoa powder" are the same product under different marketing names; USDA only tracks "cocoa" | Should state the cacao/cocoa naming equivalence for the reviewer | **Candidate, flag naming note** |
| 4533 | cacao-powder | magnesium | same record | 499 mg | Same as above | Same as above | **Candidate, flag naming note** |
| 4845 | calves-liver | iron | USDA FDC 172534 "Veal, variety meats and by-products, liver, raw" (SR Legacy) | 6.4 mg | Direct | Raw form; cooked would differ | **Candidate** |
| 4844 | calves-liver | protein | same record | 19.9 g | Direct | Same as above | **Candidate** |
| 4847 | calves-liver | vitamin-b12 | same record | 59.8 µg | Direct — exceptionally high, as expected for liver | Same as above | **Candidate** |
| 4846 | calves-liver | zinc | same record | 12.0 mg | Direct | Same as above | **Candidate** |
| 2042 | black-rice | iron | USDA FDC 2710825 "Rice, black, unenriched, raw" (Foundation) | 1.12 mg | Direct | Raw/uncooked form | **Candidate** |
| 2258 | blood-orange | vitamin-c | USDA FDC 169097 "Oranges, raw, all commercial varieties" (SR Legacy) | 53.2 mg | **Not variety-specific** — this is generic orange, not blood orange | Blood oranges are nutritionally notable specifically for anthocyanins (which this claim isn't about); vitamin C is broadly similar across orange varieties, but this is a proxy, not a direct match | **Flag for human review — proxy source, not variety-matched** |
| — | cacao-nibs | fibre / magnesium | — | — | — | No USDA record distinct from cocoa powder (nibs are a different processing stage) | **Leave uncited, or treat as equivalent to cacao-powder with a stronger caveat** |
| — | borlotti-beans | fibre / folate / iron / plant-protein / protein | — | — | — | Not yet searched under USDA's likely name ("cranberry beans") | **Needs retry next pass** |
| — | butter-beans (plant-protein only — other nutrients already approved via CoFID) | plant-protein | — | — | — | USDA has no "butter beans" entry (lima beans is the likely US equivalent, not yet confirmed); the already-approved butter-beans claims used CoFID, not USDA — for consistency this one claim should probably also go to CoFID rather than switching database | **Needs CoFID lookup, not USDA — retry next pass** |
| — | bocconcini / burrata / cambozola | calcium / iodine / protein | — | — | — | No USDA records for these specific cheese varieties (same pattern as asiago in Batch 1 — USDA's cheese coverage is limited to common varieties) | **Leave uncited** |
| — | bone-marrow | calcium / protein | — | — | — | Not searched this batch | **Needs retry next pass** |

## Running totals (Batches 1–3)

- **41 candidates** found and verified against primary USDA records.
- **216 claims identified as a structural category** that this research
  method cannot address (see headline finding) — this is the single most
  important number for scoping the remaining work.
- **~15 "leave uncited" or "needs retry"** for specific foods with no clean
  USDA match (niche cheeses, processed products, UK-specific bean names).
- **~8 flagged for human judgment** (fortification, record-choice
  ambiguity, variety mismatches, serving-size realism for spices).
