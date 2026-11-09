# KNOW3 — full uncited claim queue source triage — 2026-11-05

## Scope and evidence capture
Read-only review of every active pending claim whose `source_refs` array was empty on the Integrated Dev development-local Neon branch. Data was queried in pages from the configured development project using SELECT-only Neon SQL. No claim/source rows were updated, no approvals were made, and no database transaction wrote data.

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch: `feat/integrated-dev`; working HEAD `3467abad4eca8d82ffc52756fee13874e389597f`
- Database: Neon project `thehealthyapples-staging` (`raspy-lake-14694943`), branch `development-local` (`br-gentle-sun-a2yw79ge`), database `neondb`.
- Queue read: 3,299 active pending uncited rows; triage CSV contains every exact edge/id/subject/claim and a recommendation code.
- Source attachment implementation is in the code worktree but not loaded by the backend because it cannot start without `SESSION_SECRET`.

## What the 3,299 rows contain

| Edge | Rows | Distinct subjects | Triage |
|---|---:|---:|---|
| Food → nutrient (composition) | 1,901 | 609 | Match the exact food form and nutrient in USDA FoodData Central or Health Canada CNF; quantify the claim and define the “notable source” threshold. |
| Food → benefit (direct) | 1,366 | 610 | This direct edge is optional corroboration in the product architecture. Do not source 1,366 generic associations by default; keep only if an official source supports the exact food+benefit wording. Otherwise remove/retire the broad edge. |
| Nutrient → benefit | 32 | 18 | Screen each exact nutrient/benefit wording against the GB Nutrition and Health Claims Register; rewrite to a permitted, conditional claim or retire it if no exact fit exists. |
| **Total** | **3,299** |  |  |

There are 15 direct-benefit labels: heart health (309), anti-inflammatory support (64), brain health (18), skin health (29), digestive comfort (48), mood support (6), bone health (123), sleep quality (1), immune support (89), gut health (310), blood-sugar balance (29), muscle recovery (170), energy support (130), eye health (19), and healthy ageing (21). The vague labels are not evidence: a citation must match the food and the claimed effect.

Food catalog provenance does not constitute claim evidence. Among the 1,901 missing composition refs, source labels were: 1,027 claims for 346 “NK6 canonical food draft” foods; 631 for 186 “THA editorial” foods; 243 for 77 foods labeled “USDA FDC / WS0X.2 H1 batch 2026-06-24”. Even the USDA batch label is not a per-claim citation or proof that the specific nutrient association/amount was checked.

## Confirmed and rejected source matches

- **Confirmed exact match:** claim `composition / id 1`, extra-virgin-olive-oil → unsaturated-fats. The NHS Eatwell Guide explicitly identifies olive oil as an unsaturated fat. It supports this composition association, not a heart-health claim. [NHS Eatwell Guide](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/).
- **Not a match as currently worded:** `composition / id 2`, extra-virgin-olive-oil → polyphenols. UK/EU authorised wording is specifically that olive-oil polyphenols protect blood lipids from oxidative stress, and the olive oil must provide at least 5 mg hydroxytyrosol and derivatives per 20 g. The queue row has no measured amount and is a composition claim, so this source does not verify the row as-is. [Commission Regulation 432/2012, Annex](https://www.legislation.gov.uk/eur/2012/432/annex/2012-05-16).
- Composition reference sources: Health Canada describes CNF as a food-composition database with average nutrient values and provides current search pages; USDA FDC has official composition datasets. These are candidate data sources, not universal citations. A reviewer must match food form, preparation, serving basis and nutrient value. [Health Canada CNF](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html), [CNF search by food](https://food-nutrition.canada.ca/cnf-fce/newSearch), [USDA FoodData Central](https://fdc.nal.usda.gov/).
- Health claims require exact authorized wording and conditions. UK guidance says claims must not be false, ambiguous or misleading; the GB register identifies authorised and non-authorised claims. [GOV.UK compliance guidance](https://www.gov.uk/government/publications/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-1924-2006-on-nutrition-and-health-claims-made-on-foods/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-19242006), [GB Nutrition and Health Claims Register](https://www.gov.uk/government/publications/great-britain-nutrition-and-health-claims-nhc-register), [EU Register](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en).

## Findings in the 32 nutrient-benefit rows

The rows mostly use broad consumer-friendly concepts rather than claim wording that can be directly matched to a permitted nutrient function. Do not source them by finding a page that mentions both words. The claims/conditions need repair first.

- Fibre → blood-sugar balance: general fibre wording is not equivalent to the specific authorised claims for oat/barley beta-glucans or wheat arabinoxylan, each with quantitative conditions.
- Polyphenols → heart health: not equivalent to the conditional olive-oil-polyphenol wording above.
- Live cultures → gut health, digestive comfort, immune support: the narrow authorised live-yoghurt-cultures claim concerns lactose digestion by people who have difficulty digesting lactose and requires named starter cultures at ≥10^8 CFU/g; it does not substantiate generic microbiome or immune benefits.
- Protein → energy support: misaligned with the linked benefit description (iron, B vitamins and carbohydrate). Review as a wrong relationship; map to a precise allowed protein function or retire.
- The other generic concepts (mood, anti-inflammatory support, sleep, skin, healthy ageing, etc.) need an exact GB register entry plus matching conditions, or should be rewritten/retired. An NHS/EFSA article mentioning a nutrient does not make a different health claim true.

## Triage CSV code legend
The companion CSV has one row per uncited claim. Its `triage_code` means:

- `C1`: Standard composition — candidate FDC/CNF exact-entry lookup; no source match asserted.
- `C2`: Bioactive/strain-specific composition — exact analyte or strain data required; broad FDC/CNF landing pages are insufficient.
- `C3`: Confirmed NHS match for olive oil → unsaturated fats.
- `C4`: Olive-oil polyphenol amount/wording condition; not verified as the queue row is written.
- `F1`: Optional direct food-benefit corroboration; exact relationship only, otherwise remove/retire rather than create a mass sourcing task.
- `N1`: Exact claim/conditions need screening in the GB register; not currently verified.
- `N2`: Fibre/blood-sugar mismatch; specific fibre and quantity required.
- `N3`: Live-yoghurt-culture claim is narrower and product/CFU-specific.
- `N4`: Protein-to-energy-support relationship mismatch.
- `N5`: Generic polyphenol/heart claim differs from conditional olive-oil claim.

CSV: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__codex__KNOW3-3299-claim-source-triage.csv`.

## Server restart status and next action
The owner ended the previous backend. Port 5001 frontend still responds, but port 5000 had no listener. I attempted to launch the backend using the repo `.env` and its configured development database. The process exited because `SESSION_SECRET` is missing; I did not generate or change a secret. The source-attachment route therefore is not active in the app yet. The correct next step is to restore the intended development `SESSION_SECRET` from the owner's secure local configuration, then start the backend and verify the read-only queue endpoint and source-entry UI. Do not invent a secret or change claim data.

## Governance, risk and rollback
Risk is 🔴 Red because citations are persistent evidence that may support later publication. Canonical `source_refs` remains the sole evidence owner; existing audit history remains its audit owner; approval stays a separate named-human action. No schema, claim data, user data, or production branch was changed. Existing rollback tag is `rollback/KNOW3-uncited-claim-filter-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`; task files were snapshotted at `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3_SOURCE_ATTACHMENT_20261105\manifest.json`.

## Scope limit
This is a complete queue inventory and source triage for all 3,299 rows, not a claim that every row has a verified citation. Only the EVOO → unsaturated-fats row was confirmed against a directly relevant NHS page in this pass. The composition dataset matches and each health claim still need the row-specific verification described above. No source was attached and no claim approved.
