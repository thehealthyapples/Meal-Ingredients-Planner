# KNOW3 prepared-mustard polyphenol evidence attachment — 2026-11-17

## Scope and risk
Owner-authorized citation-only work against Integrated Dev development-local for pending composition claim #4512 (`mustard → polyphenols`). Risk: Red because this writes a persistent knowledge citation. No code, source policy, claim status, amount, review timestamp, or approval decision changed.

## Governance and architecture
Owning repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.

The task’s governing chain was recorded in the continuation preflight and prior report: workspace/repository instructions and governance; architecture README/workflow; operating-model evidence/rollback requirements; KNOW3 knowledge architecture; and `shared/knowledge/evidence.ts`. Existing single owner remains `knowledge_food_nutrients.source_refs`; its guarded `recordClaimSourceChange` path was reused. No duplicate state or workflow was introduced. Dev branch and database only; no promotion or deployment.

Rollback anchor already in place: `rollback/KNOW3-doae-composition-20261117` → `fdfaef0ef261c95a94bf6022ccb7d6db903540de`. This citation is individually reversible through the audited source-removal path while pending.

## Evidence and outcome
Peer-reviewed article indexed in PubMed / full text in PMC: “Yellow Mustard Protein a Immunoreactivity Reduction Through Seed Germination, Lactic Acid Fermentation, and Cooking,” PMCID PMC11545414, <https://pmc.ncbi.nlm.nih.gov/articles/PMC11545414/>. Its Table 3 measures total phenolic content in methanolic extracts of prepared mustard samples; untreated control: 3.49 ± 0.01 mg gallic-acid equivalents/g. Citation text limits the result to the study’s prepared yellow-mustard sample and assay; it does not claim a health benefit or a universal commercial-mustard value.

Guarded writer preview → apply → verify passed. Fresh read-back: claim #4512 active, pending, amount null, exactly one source, and no reviewed/rejected fields set. Pending uncited queue: 82 total (19 composition, 63 food-benefit, 0 nutrient-benefit).

## Definition of done and data impact
One directly relevant, clearly qualified peer-reviewed citation is attached to the matching generic prepared-mustard composition claim; no decision/status changed. Data impact: one `source_refs` array addition in development-local only.

## Checks and limitations
No tests run (not requested); no raw SQL write, code/config change, migration, restart, commit, deployment, or production/staging access. English mustard remains uncited because the peer-reviewed sources reviewed did not identify the English style. Task remains incomplete; 82 pending uncited claims remain.

Agent report: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-mustard-generic-4512.md`.
