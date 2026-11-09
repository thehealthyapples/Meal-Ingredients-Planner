# KNOW3 — food-to-nutrient composition dataset crosswalk

**Date:** 2026-11-05  
**Repository/area:** Integrated Dev, Nutrition Knowledge / Admin claim review.  
**Branch/HEAD:** feat/integrated-dev, 3467abad4eca8d82ffc52756fee13874e389597f.  
**Risk:** 🔴 evidence domain due to downstream publication potential. Investigation only; no persisted claim/source or approval decisions made.

## THA Governance Preflight Receipt

- **Governing workspace instruction:** G:\The Healthy Apples\AGENTS.md, supplied by the owner in the current request.
- **Repository and task-specific governing files read:** AGENTS.md; PROJECT_GOVERNANCE.md; docs\architecture\README.md; docs\ai-operating-model\README.md; docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md; docs\architecture\NK2_THA_NUTRITION_METHODOLOGY.md; docs\architecture\THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md; docs\investigations\knowledge\WS4B_NUTRITION_KNOWLEDGE_PIPELINE.md; shared\knowledge\evidence.ts.
- **Repository state:** branch feat/integrated-dev; HEAD 3467abad4eca8d82ffc52756fee13874e389597f; 324 pre-existing dirty entries retained.
- **Rollback:** rollback/KNOW3-uncited-claim-filter-20261105 verified at the current HEAD. Existing dirty changes were not altered.
- **Authority/conflicts:** no applicable authority conflict found for this read-only evidence crosswalk. Existing canonical claim rows and source_refs remain the single owner; no duplicate app store or workflow was introduced.
- **Approval/scope:** continued owner-requested full food-to-nutrient evidence review. Scope is public-source comparison and local report artifacts only; no app code, DB, queue rows, approvals, or configuration changes.
- **Implementation permitted:** YES under the repository’s standing feat/integrated-dev development-branch authority. This receipt permits only the report artifacts within this scoped investigation; it does not permit promotion or data edits.

## Purpose and sources

Compared all 1,901 active pending food → nutrient claims in the previously captured development queue against:

1. **Health Canada, Canadian Nutrient File 2026 (CNF).** The public relational CSVs for food names, nutrient names, amounts, and source codes were downloaded into Windows temp storage and parsed locally. Health Canada describes CNF as food composition data for 5,993 foods and up to 173 nutrients.
2. **Public Health England, CoFID 2021.** The official workbook and guide were downloaded into Windows temp storage. Composition sheets were joined by food code. The official guide says values are generally per 100 g; “Tr” denotes trace and “N” denotes a nutrient present in significant quantity without a reliable amount.

Official references:
- Health Canada CNF: https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html
- CNF open-data record: https://open.canada.ca/data/en/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109
- UK CoFID 2021 page: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
- CoFID user guide: https://assets.publishing.service.gov.uk/media/60538e66d3bf7f03249bac58/McCance_and_Widdowsons_Composition_of_Foods_integrated_dataset_2021.pdf
- NHS Eatwell Guide: https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/

## Method

The crosswalk associates each existing claim ID with source food names and numeric nutrient fields. Exact normalized canonical food-name matches are separated from lexical candidates; broad foods with multiple source forms remain multiple-form candidates. Nutrient mappings use source field codes (for example protein, fibre, minerals, vitamins, and fatty-acid totals). CNF source codes and observation counts are retained in the CSV. CoFID “Tr” and “N” remain visible as those source values.

This is a triage crosswalk, not a human verification or an automatic approval. A candidate name may still be the wrong species, variety, edible portion, or preparation. Missing nutrient fields do not mean zero. This work did not apply a “source of nutrient” regulatory threshold or establish product-specific amounts.

## Results

| Dataset result | CNF 2026 | CoFID 2021 |
|---|---:|---:|
| Exact normalized canonical food-name match with a value | 2 | 52 |
| One non-exact food-name candidate with a value | 148 | 249 |
| Multiple food/form candidates with values | 603 | 608 |
| No food-name candidate | 823 | 729 |
| Food candidate(s) but no positive value found for mapped field | 8 | 43 |
| Nutrient not represented in that dataset | 317 | 220 |
| **Total claims** | **1,901** | **1,901** |

Across the two datasets, 1,145 rows have at least one candidate value, 517 have candidate values in both datasets, 54 have an exact normalized food-name match in at least one dataset, and 756 have no candidate value from either dataset. These candidate counts are not verified claim counts.

CoFID does not directly represent 220 claim rows’ nutrient slug. The largest uncovered groups are polyphenols (167), anthocyanins (19), flavonoids (15), live cultures (8), sulforaphane (4), choline (4), allicin (2), and nitrates (1). Some of these, such as choline, have CNF fields; the CSV indicates source availability per row. For rows with no field in either dataset, a distinct food-specific source is required. CoFID includes iodine values; CNF 2026 does not provide a direct iodine field.

### Sample: extra-virgin olive oil

- **Claim id 1, unsaturated fats:** The NHS Eatwell Guide directly supports olive oil as an unsaturated fat. CNF’s generic olive-oil record (food code 422) lists 72.961 g monounsaturated and 10.523 g polyunsaturated fatty acids per 100 g. CoFID’s “Oil, olive” (17-038) lists 73.00 g monounsaturated and 8.20 g polyunsaturated fatty acids per 100 g. The NHS page is the direct support for the qualitative association; database records are generic olive-oil composition and do not establish an extra-virgin-specific amount.
- **Claim id 3, vitamin E:** CNF gives 14.35 mg/100 g and CoFID 5.10 mg/100 g for generic olive oil. This is candidate support for presence, not a stable amount for the specific EVOO item.
- **Claim id 2, polyphenols:** Neither database has a direct polyphenol field. The conditional authorized olive-polyphenol health claim does not verify the queued composition row as written.

## Architecture and data impact

Verified from the governing documents and current code: the claim and its SourceRefs remain on the existing knowledge claim record; review and source audit remain in the existing Admin workflow. This investigation did not create a second knowledge store, change status, or bypass the human approval gate.

- **Read:** previously captured 1,901 pending composition claims and public official CNF/CoFID datasets.
- **Wrote:** this report in docs/investigations and the row-keyed CSV in Incoming Agent Reports.
- **Not changed:** application code, runtime service, database, source_refs, claim status, review audit, secrets, or configuration.
- **Verification:** report counts reconcile to 1,901 claims per dataset; Incoming CSV has 1,901 data rows. No automated tests were requested or run.
- **Rollback:** delete this new investigation report and restore/remove its Incoming artifacts if required; committed history remains protected by the verified tag. No user data needs restoration.

## Remaining uncertainty and next review step

The highest-risk inference is food-identity matching from a broad canonical name to one of several source food forms. Before attaching citations, review the exact food code, source nutrient field, unit, value/source quality, and whether that source row represents the queued food. If multiple forms remain, prefer a more specific canonical food identity or keep the claim uncited pending a precise source. The app queue was not changed.

## Artifacts

- Full row-keyed crosswalk: G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__codex__KNOW3-food-nutrient-CNF-CoFID-crosswalk.csv.
- Required Incoming report: G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__codex__KNOW3-food-nutrient-CNF-CoFID-review.md.
