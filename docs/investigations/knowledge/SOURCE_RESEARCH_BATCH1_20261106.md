---
title: Uncited Claim Source Research — Batch 1
date: 2026-11-06
author: Claude (Sonnet 5), at the direction of Colin Clapson
audience: Codex (nutrition-source review task) and human reviewer
status: research only — nothing attached to the app or database
---

# Uncited Claim Source Research — Batch 1 (composition, 10 foods)

This is genuine source research for the uncited-claims queue the original
brief assigned to Codex. Per that brief's own terms, this is **read-only
research** — nothing here has been attached to any claim, approved, or
written to the database. It's a candidate list for human (or Codex) review.

## Method note — a correction to the brief's assumed approach

The brief implied live API lookups. USDA's public `DEMO_KEY` API is
rate-limited and got exhausted (shared across all unauthenticated callers;
hit a 7.6-hour `Retry-After` block after ~10 calls). **The working method —
and the one this repo's own `data/usda-snapshot/build-snapshot.py` already
uses — is the bulk JSON download**, which has no rate limit:

- Foundation Foods: `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-10-29.zip` (697 KB, 424 foods)
- SR Legacy: `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip` (13.4 MB, 7,793 foods)

Both downloaded, unzipped, and queried offline via a small lookup script.
**Recommend Codex switch to this method too** rather than the live API —
it's faster, has no rate limit, and is already precedented in this repo.

## Structural finding: "Polyphenols" has no primary-source coverage here

Checked the full nutrient panel of a food with ~50 tracked nutrients
(allspice, FDC 171315) — no "Polyphenols" entry exists anywhere in either
USDA dataset. This isn't a per-food gap; **neither USDA SR Legacy/Foundation
nor (so far as checked) UK CoFID track polyphenol content as a standard
composition value**. Every `→ polyphenols` claim in the queue will need a
different source class entirely (e.g. USDA's separate Flavonoid/Isoflavone
database, or Phenol-Explorer) or should be left uncited. Recommend Codex
treat every `polyphenols` claim as this same structural case rather than
re-researching it food by food.

## Findings

| Claim ID | Food | Nutrient | Source | Value (per 100g) | Match | Limitations | Recommendation |
|---|---|---|---|---|---|---|---|
| 4200 | adzuki-beans | protein | USDA FDC 173728 "Beans, adzuki, mature seeds, cooked, boiled, without salt" (SR Legacy) | 7.52 g | Direct | None | **Candidate** |
| 4201 | adzuki-beans | fibre | same record | 7.30 g | Direct | None | **Candidate** |
| 4202 | adzuki-beans | folate | same record | 121 µg DFE | Direct | None | **Candidate** |
| 4203 | adzuki-beans | polyphenols | — | — | — | No primary-source coverage (see structural finding) | **Leave uncited** |
| 4565 | albacore-tuna | protein | USDA FDC 175158 "Fish, tuna, white, canned in water, drained solids" (SR Legacy) | 23.6 g | Direct — "white tuna" is USDA's term for albacore | Canned-in-water specifically; canned-in-oil (FDC 175157) differs | **Candidate** |
| 4566 | albacore-tuna | omega-3 | same record | 0.88 g (DHA 0.629 + EPA 0.233 + DPA 0.018) | Direct, but the app stores one "omega-3" figure — confirm whether DHA+EPA+DPA sum or DHA+EPA only is the app's convention before attaching | Form (canned in water); figure is a sum of 3 sub-fatty-acids, flag for reviewer | **Candidate, flag arithmetic for reviewer** |
| 4567 | albacore-tuna | vitamin-b12 | same record | 1.17 µg | Direct | None | **Candidate** |
| 4568 | albacore-tuna | selenium | same record | 65.7 µg | Direct | None | **Candidate** |
| 1154 | anchovies | omega-3 | USDA FDC 174183 "Fish, anchovy, european, canned in oil, drained solids" (SR Legacy) | 2.10 g (DHA 1.29 + EPA 0.763 + DPA 0.041) | Reasonable — canned-in-oil is the common consumed form | Raw (FDC 174182) would differ; oil-canning adds fat but not meaningfully different omega-3 | **Candidate** |
| 1155 | anchovies | calcium | same record | 232 mg | Reasonable, but **only true when bones are eaten** (standard for tinned anchovies, not fresh fillets) | Form-dependent; should state "with bones" | **Candidate, flag form note** |
| 1156 | anchovies | selenium | same record | 68.1 µg | Reasonable | Same as above | **Candidate** |
| 4297 | agar-agar | fibre | USDA FDC 170090 "Seaweed, agar, dried" (SR Legacy) | 7.7 g | Direct | Dried form — this is also how the already-approved agar-agar claims (protein, manganese) are sourced, consistent | **Candidate** |
| 4387 | allspice | polyphenols | — | — | — | No primary-source coverage (see structural finding) | **Leave uncited** |
| 2107 | almond-butter | vitamin-e | USDA FDC 168588 "Nuts, almond butter, plain, without salt added" (SR Legacy) | 24.2 mg alpha-tocopherol | Direct | "Plain, without salt added" — branded products vary | **Candidate** |
| 2108 | almond-butter | magnesium | same record | 279 mg | Direct | Same as above | **Candidate** |
| 2109 | almond-butter | plant-protein | same record | 21.0 g | Direct — app defines plant-protein as "protein, from a plant source," not a separate measured nutrient, so the standard protein figure applies | Same form caveat | **Candidate** |
| 2110 | almond-butter | unsaturated-fats | same record | 46.0 g (MUFA 32.4 + PUFA 13.6) | Direct, same sum-of-subcategories note as the tuna omega-3 row | Same form caveat; confirm MUFA+PUFA is the app's "unsaturated fats" definition | **Candidate, flag arithmetic for reviewer** |
| 2053 | almond-flour | plant-protein | USDA FDC 2261420 "Flour, almond" (Foundation) | 26.2 g | Direct | None | **Candidate** |
| 2051 | almond-flour | vitamin-e | — | — | — | **This Foundation record has no Vitamin E entry at all** — a sparser nutrient panel than SR Legacy records typically carry | **Leave uncited** (or source a different almond flour record if one with a fuller panel exists) |
| 1103 | almond-milk | vitamin-e | USDA FDC 174832 "Beverages, almond milk, unsweetened, shelf stable" (SR Legacy) | 6.33 mg | Matches numerically, **but the record itself labels this "Vitamin E, added" = 6.33 mg — i.e. 100% fortification, not an inherent property of almond milk** | Brand/product-dependent; unfortified almond milk has ~0 | **Flag for human review — composition claim describing a fortification practice, not the food itself** |
| 1104 | almond-milk | calcium | same record | 184 mg | Same fortification issue (almonds themselves are not calcium-notable; retail almond milk is near-universally fortified, but not guaranteed) | Same as above | **Flag for human review** |
| 1105 | almond-milk | vitamin-d | same record | 1 µg / 41 IU | Same fortification issue, more acute — almond milk naturally contains **zero** vitamin D | Same as above | **Flag for human review — recommend leave uncited unless the claim is explicitly scoped to "fortified almond milk"** |
| 2029 | amaranth | plant-protein | USDA FDC 170683 "Amaranth grain, cooked" (SR Legacy) | 3.8 g | Direct, but modest — per the brief's own rule, a positive value alone doesn't establish "notable source" | Cooked form chosen (water dilutes vs. raw); raw form would read higher | **Flag for human review — borderline notability** |
| 2030 | amaranth | iron | same record | 2.1 mg | Direct, plausibly notable (12–26% RDA depending on sex) | Same form note | **Candidate** |
| 2031 | amaranth | magnesium | same record | 65 mg | Direct, plausibly notable (~16% RDA) | Same form note | **Candidate** |
| 2032 | amaranth | calcium | same record | 47 mg | Direct, but modest (~4.7% RDA) | Same form note | **Flag for human review — borderline notability** |

## Summary

- **18 candidate sources** found and verified against primary USDA records.
- **2 structural "leave uncited"** (polyphenols — no source exists in this database family at all).
- **1 "leave uncited"** for a specific missing nutrient entry (almond-flour → vitamin-e).
- **5 flagged for human judgment**: 2 for arithmetic conventions the app needs to confirm (summed sub-fatty-acids), 3 for fortification (almond-milk calcium/vitamin-d/vitamin-e — these describe a processing choice, not the food), 2 for borderline "notable source" thresholds (amaranth calcium/plant-protein).
- **0 claims where I invented a citation, quotation, or value** — every number above was read directly from the downloaded primary dataset, not from search-engine summaries or secondary sites.

This covers 10 foods / 23 of the current 1,018 uncited composition claims.
Continuing in further batches depends on how the user wants to split this
with Codex — recommend checking in before either agent duplicates the
other's next batch.
