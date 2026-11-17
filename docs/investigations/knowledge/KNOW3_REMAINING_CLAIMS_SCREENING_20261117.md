# KNOW3 remaining uncited claims — evidence-screening pass — 2026-11-17

## Scope and state

Continued the owner-authorized review of active, pending, uncited food-to-nutrient and food-benefit claims. This pass refreshed the development-local queue and screened targeted peer-reviewed/official sources for exact food, preparation, and benefit match. It made no citation, decision, amount, trust-policy, schema, or application-code changes.

Owning repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
Branch / HEAD: feat/integrated-dev / fdfaef0ef261c95a94bf6022ccb7d6db903540de
Risk: Red overall because the continuing task includes citations and source trust policy; this segment was read-only apart from research-report and caution-note files.
Database: development-local Neon branch br-gentle-sun-a2yw79ge, read-only access through the existing claim review store.

## Governance

Task preflight follows G:\The Healthy Apples\AGENTS.md; repository AGENTS.md; PROJECT_GOVERNANCE.md; docs\architecture\README.md; docs\architecture\ENGINEERING_WORKFLOW.md; .engineering\protocols\ROLLBACK_PROTECTION_PROTOCOL.md; docs\ai-operating-model\README.md; docs\ai-operating-model\evidence-and-architecture.md; docs\ai-operating-model\rollback-and-output.md; docs\implementation\knowledge\KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md; and shared\knowledge\evidence.ts. The existing claim registry and guarded source writer remain the sole owners. No authority conflict or missing governing file identified.

## Fresh queue

Fresh read via listClaims and claimReviewSummary found:
- Composition: 173 pending, 157 cited; **16 uncited**.
- Food-benefit: 369 pending, 306 cited; **63 uncited**.
- Nutrient-benefit: 10 pending, all cited; **0 uncited**.
- Total active, pending, uncited: **79**.

The 16 composition claims are #985, #4355, #4356, #4358, #4361, #4364, #4367, #4373, #4376, #4385, #4457, #4465, #4473, #4492, #4493, #4496. Fresh list confirms #4458 is now cited; its scoped attachment is documented separately.

The 63 food-benefit claims remain as listed by the live queue. This screening did not change their status or citation count.

## Source screening — no citations attached

- **#985 tarragon → vitamin K.** Rechecked Norway's official food-composition entry for dried tarragon. Its page identifies dried tarragon and shows multiple nutrients, but does not list vitamin K. This is an absent table entry, not a zero and not evidence of vitamin-K presence. The previously identified peer-reviewed Presse et al. herb-HPLC article remains inaccessible at its species table in the fetched full text; its abstract does not identify which herbs were measured. No citation attached.
- **#684 celeriac → immune support.** A 2025 peer-reviewed celeriac study measured ethanolic root/aerial-part extracts in LPS-stimulated RAW264.7 macrophage cells and observed changes in inflammatory mediators. This is a cell assay, not a dietary or clinical immune-support outcome; anti-inflammatory activity is not interchangeable with general immune support. [PMC study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12491856/). Not attached.
- **#793 chives → bone health.** Search found onion (*Allium cepa*) bone research, but that is a different species; no chive-specific food or intervention evidence establishing a bone-health effect was located. No proxy from onion was used.
- **#794 chives → immune support.** A peer-reviewed review of chives describes antioxidant and anti-inflammatory pharmacological activity and says more systematic research is needed. These findings do not establish an immune benefit in people consuming culinary chives. [PubMed review](https://pubmed.ncbi.nlm.nih.gov/28826254/). No citation attached.
- **#818 vanilla → digestive comfort.** A 2020 narrative review says gastrointestinal irritation is among vanilla's traditional medicinal uses, while human health evidence is limited and preliminary. The publisher is journals.lww.com, which is not currently trusted; the evidence is also not proof that normal culinary use improves digestion. No attachment pending the domain decision.
- **#3274 juniper berries → gut health.** EMA's official herbal monograph lists traditional use of juniper berries for symptomatic relief of dyspepsia and flatulence, based on long-standing use; this is narrower than “gut health,” medicinal-use context, and not a clinical demonstration for culinary servings. Domain ema.europa.eu is not currently trusted; no attachment pending the domain decision.
- **Vinegar → gut health claims (#3306, #3310, #3312, #3328, #3332, #3334, #3336, #3340, #3342).** A peer-reviewed study of Shanxi aged vinegar reported gut-microbiome changes in mice, but the source product/species and model do not match the queued vinegar varieties or human food-use claims. [PubMed/PMC study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10792460/). No cross-vinegar proxy citation attached.
- **Rapeseed oil → healthy ageing (#1652).** A clinical trial found biomarkers related to cardiometabolic risk after a short intervention with a specially micronutrient-enriched rapeseed oil; that outcome/product does not establish a broad healthy-ageing effect for ordinary rapeseed oil. [PubMed trial](https://pubmed.ncbi.nlm.nih.gov/22784432/). No citation attached.
- **Sesame oil → skin health (#1655).** The located skin evidence involved topical/oil-pulling application, not ingestion; it does not support a dietary skin-health claim. No citation attached.
- **Truffle → gut health (#3299).** Search found microbiome studies of microbes living in truffle tissues/soil, not human gut outcomes after eating truffles. A 2026 critical review notes sparse truffle-specific nutritional/consumption evidence and warns that the presence of potentially beneficial constituents does not establish health contributions at normal consumption levels. [Critical review](https://link.springer.com/article/10.1007/s00217-026-05226-1). No citation attached.
- **Juniper, citrus-leaf, herb, oil, condiment, and refined-starch gut-health claims.** Searches did not establish exact human food-use outcomes. Traditional medicinal use, extraction studies, other species, and compositional evidence were not substituted for direct food-benefit support.

## Caution noted

Added a celeriac allergy signal to the requested flat-file notes. A double-blind, placebo-controlled challenge study found positive reactions in 22 of 32 patients already reporting celery-root reactions; this is a risk for people with celery allergy, not evidence of general harm. [PubMed clinical study](https://pubmed.ncbi.nlm.nih.gov/10932083/). Exact note is in G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__food-caution-research-notes.md.

## Checks and impact

- The queue query used existing listClaims/claimReviewSummary read paths only; no raw SQL was used.
- No claim sourceRefs or audit records were written. No approvals, rejections, amounts, review timestamps, or policy changed.
- No production/staging data, schema, migrations, service restarts, deployment, commit, or Claude handoff.
- No tests run.
- The live count remains **79 uncited**. Source-domain approval requests for EMA and LWW are pending in the chat; until decided, those leads remain unattached. Continue with claims supportable by existing trusted domains, then recheck live state.

## Next work

Continue matching the remaining rows to exact official composition tables or peer-reviewed food-specific evidence. Keep unsupported or form-mismatched claims uncited and pending. Attach only through the existing guarded writer after a fresh per-claim check; verify each write and refresh all three counts.

## Follow-up — additional sources and guarded attachments (2026-11-17)

The 79-row count above is historical for this investigation snapshot. A later live refresh reflected the DOAE attachment to #4356 and found 78 uncited rows; the subsequent EMA/LWW/celeriac pass attached 3 citations, leaving **75 active pending uncited claims** (15 composition, 60 food-benefit, 0 nutrient-benefit).

- #3274 juniper berries → gut health now carries the current EMA/HMPC 2023 monograph. Its evidence is traditional medicinal use for dyspepsia/flatulence with specified herbal preparations; it does not prove benefits from ordinary culinary portions or broad gut health.
- #818 vanilla → digestive comfort now carries the 2020 peer-reviewed *Nutrition Today* narrative review. It calls human health evidence limited/preliminary and discloses funding from McCormick and Co.; it does not prove benefits from ordinary culinary amounts.
- #684 celeriac → immune support now carries the 2025 peer-reviewed celeriac extract/macrophage study indexed by PubMed. This is preclinical cell evidence, not human dietary immune-support evidence.
- The citations are all marked emerging with limitations in `evidenceExcerpt`; all claims remain pending. No decisions, quantities, or review timestamps were changed.
- Rechecked #985 against the official USDA SR28 tarragon record: no Vitamin K value is reported, so it cannot substantiate the positive claim. No citation attached.
- Further exact-match holds: the Allium review includes chives but reports no in-vivo replication for *A. schoenoprasum*; the amaranth RCT measures aerobic capacity rather than muscle recovery; sesame-oil skin sources concern topical use or oral care; peppermint tea is not spearmint and has no human tea trials identified. No food/species/route proxy was attached.

Guarded writer receipts, source manifests, and detailed source links are in `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-source-review-citations-progress-report.md`. Implementation details are in `docs\implementation\knowledge\KNOW3_EMA_LWW_CELERIAC_CITATIONS_20261117.md`. The overall task remains open with 75 rows to review.


## Follow-up — CoFID source-table verification (2026-11-17)

The most recent live worklist read on Neon branch `development-local` confirms 74 uncited claims: 15 food-composition claims and 59 food-benefit claims, all active and pending. The itemized list is preserved in the accompanying Agent Report. No new citation was written in this segment.

For #985 (`tarragon → vitamin-k`), I downloaded the public GOV.UK CoFID 2021 workbook to `%TEMP%` and inspected its Vitamins worksheet. The exact row is food code 13-857, “Tarragon, fresh,” worksheet row 2688. Its Vitamin K1 / Phylloquinone cell is blank. CoFID defines `N` separately as a significant nutrient with no reliable amount; the blank cell is not `N` and does not support a positive vitamin K claim. Thus #985 stays pending and uncited. The workbook and its user guide are published from the official [GOV.UK CoFID page](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid).

The development-local database was reachable through Neon for a read-only queue check; direct repository shell access returned EACCES. No raw SQL write or alternative writer was used. Any later attachment must go through the existing guarded importer.

The source-screening task remains open; the 74 remaining exact food/form or food/outcome gaps are not safely reducible by attaching sources that do not support the claims.

The full CoFID 2021 Vitamins worksheet was checked by exact food-name search for tarragon, lime, hyssop, lemon balm, lovage, salad burnet, sorrel, and savory. Only tarragon and lime fruit/juice records were present; both had blank K1 cells. No corresponding rows for the other exact herbs/plant parts were present. This is an official-data coverage gap, not evidence of zero vitamin K. The whole worksheet does not support the remaining positive Vitamin K claims, so no attachment was prepared.
