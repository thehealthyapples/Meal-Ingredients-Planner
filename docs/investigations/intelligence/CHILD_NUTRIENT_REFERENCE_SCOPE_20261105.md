# Child nutrient reference figures — scope assessment — 2026-11-05

## THA Governance Preflight Receipt
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Worktree / branch: `feat/integrated-dev`
- HEAD: `3467abad4eca8d82ffc52756fee13874e389597f`
- Git status: approximately 1,509 pre-existing modified/untracked entries; none changed for this assessment.
- User request: include child figures in the nutrient reference review screen.
- Governance read: root `AGENTS.md`; `PROJECT_GOVERNANCE.md` bootstrap requirements and `feat/integrated-dev` authority.
- Task architecture/method documents read: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §5 and §5.1; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`; `shared/knowledge/nutrient-reference-methods.ts`; `client/src/pages/admin-nutrient-reference-review-page.tsx`.
- Existing implementation/assets: adult candidate methods and preview UI; screenshot shows age 15, which is rejected by the adult candidate age scope.
- Authorized scope: read-only scope/evidence assessment and recommendation.
- Non-goals: no code or architecture changes, no child values added to runtime or preview, no database or personal child data access.
- Conflict: current architecture explicitly admits only adult personal reference ranges. Extending the feature to children requires an owner-approved architecture amendment; a UI-only dev-branch permission cannot override the current policy.
- Risk: RED, nutrition reference logic involving minors.
- Implementation permitted: NO pending explicit owner resolution of the architecture scope.

## Findings
- **Verified:** Food Intelligence Rule T1 confines personal references to the adult exception. ANR1 §5.1 was approved for adults on 2026-11-04 and explicitly says its amendment admits no numbers/formulas by itself. It requires exact population, source, method, exclusions, and named editorial review.
- **Verified:** current adult source/method notes explicitly define the UK RNI formula as adults 19+ at 0.75 g/kg/day; the exercise method is 19–64. Extending either formula to a 15-year-old would be an unsupported extrapolation.
- **Verified:** official UK Department of Health 1991 DRV Table 7.1 has a separate child/adolescent protein table. It gives fixed age-band RNI values rather than an adult mass multiplier for younger children: 1–3 years 14.5 g/day; 4–6 years 19.7; 7–10 years 28.3; ages 11–14: 42.1 for males / 41.2 for females; ages 15–18: 55.2 / 45.4. The document states assumptions around growth, sufficient energy and other nutrients, and protein quality; it also notes limited childhood/adolescent evidence. Source: `https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743786/Dietary_Reference_Values_for_Food_Energy_and_Nutrients_for_the_United_Kingdom__1991_.pdf#page=79`.
- **Verified:** GOV.UK's 2025 population analysis uses age/sex-specific requirements and gives a 15–19 population average of 50.13 g/day, but explicitly says this is averaged for population representation and that actual personal need differs. It should not be presented as a personal recommendation: `https://www.gov.uk/government/statistics/nutritional-supply-of-agriculture-in-the-uk-2025/nutritional-supply-of-agriculture-in-the-uk-2025`.
- **Verified:** EFSA distinguishes DRVs from personal nutrient goals/recommendations; its protein PRI spans 0.83–1.31 g/kg/day by child age, but that is a separate EU standard and must not be merged with UK COMA values. Sources: `https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values` and `https://www.efsa.europa.eu/en/press/news/120209`.
- **Inference/recommendation:** a bounded first child addition could be a source-labelled UK child/adolescent protein RNI lookup for ages 1–18, using exact published age bands and a source-category selection only for ages 11–18; no adult 0.75 multiplier, no exercise/muscle range, and no infant formula/feeding guidance in the first scope. A 15-year-old's example would require selecting the source's male/female category and would return the matching 15–18 fixed RNI. Any shown result must clearly say population reference, not measured need or deficiency threshold. The 1991 source's age and its current endorsement/supersession should be verified by a qualified nutrition reviewer before approval.
- Input ownership must be decided: avoid collecting or storing a child's exact DOB/weight for this preview; age-band-only input is sufficient for this source. A source category should be requested only when required by the selected row, with an explicit unknown/decline path. Real child personalization and profile storage are out of this bounded proposal.

## Decision needed
An explicit architecture decision is required before implementation. Recommended scope: allow the Admin review preview to include source-labelled UK protein RNI age-band candidates for ages 1–18 only, while keeping these candidates unpublished until named nutrition review. Exclude ages under 1, exercise/muscle targets, and all live Companion child personalization from this decision.
