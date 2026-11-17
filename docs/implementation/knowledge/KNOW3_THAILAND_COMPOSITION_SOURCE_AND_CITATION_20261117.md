# KNOW3 ThaiScience composition source and citation — 2026-11-17

## Task and scope

Add the owner-approved composition-only source domain thaiscience.info and attach its exact champagne-vinegar polyphenol study to active, pending claim #4458 through the existing guarded writer. Approval was limited to claim #4458. The claim must remain pending; no nutrient amount, review attribution, or decision may change.

Owning repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
Branch / HEAD: feat/integrated-dev / fdfaef0ef261c95a94bf6022ccb7d6db903540de
Risk: Red (source trust policy and development-local persisted evidence).

## Governing authority read

Task preflight read and followed:
- G:\The Healthy Apples\AGENTS.md
- Repository AGENTS.md and PROJECT_GOVERNANCE.md
- docs\architecture\README.md and docs\architecture\ENGINEERING_WORKFLOW.md
- .engineering\protocols\ROLLBACK_PROTECTION_PROTOCOL.md
- docs\ai-operating-model\README.md, evidence-and-architecture.md, and rollback-and-output.md
- docs\implementation\knowledge\KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md
- shared\knowledge\evidence.ts

The claim registry and recordClaimSourceChange guarded source writer remain the single canonical owner/workflow. Existing evidence consumers continue to use the shared trust gate. No duplicate store or workflow was introduced. No authority conflict was found.

## Change and evidence

Added thaiscience.info to the trusted-source domain set and composition-only domain set in shared\knowledge\evidence.ts. This does not admit the domain for benefit claims.

Source: Pinsirodom, P.; Rungcharoen, J.; Liumminful, A. (2008), “Quality of commercial wine vinegars evaluated on the basis of total polyphenol content and antioxidant properties,” Asian Journal of Food and Agro-Industry 1(04), 232–241. [Primary study PDF](https://www.thaiscience.info/Article%20for%20ThaiScience/Article/61/10016497.pdf)

The study examined commercial wine-vinegar samples, including one derived from champagne. It measured total polyphenol content by Folin–Ciocalteu assay and reports 81.5 μg gallic-acid-equivalent/mL for that sample. This supports presence in the tested sample only; it does not establish a universal champagne-vinegar value or health effect. No claim amount was added; evidence level is emerging.

## Rollback and preservation

- Verified repository status and HEAD before editing; pre-existing unrelated work was preserved.
- Created tag rollback/KNOW3-thaiscience-composition-20261117 at fdfaef0ef261c95a94bf6022ccb7d6db903540de.
- Because shared\knowledge\evidence.ts already contained unrelated uncommitted source-policy work, saved its exact pre-change contents at G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3-ThaiScience-20261117\evidence.ts.pre-change.
- Snapshot SHA-256: 62E04B76C1179D2FA66D017BA723653CE34CD83472328246AA6A34C07E5C76CF.
- Scoped rollback: restore only the saved pre-change evidence.ts contents if no later edits depend on them, and remove the #4458 citation through the guarded source-change workflow. Do not reset the repository or disturb unrelated work.

## Guarded write and verification

- Manifest: G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-thaiscience-champagne-vinegar-4458.json
- Guarded writer receipt: G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-thaiscience-champagne-vinegar-4458-receipt.json
- Fresh pre-write recheck confirmed #4458 active, pending, subject matched, and uncited. Existing scripts\attach-reviewed-composition-evidence.ts performed preview, apply, and verify. No raw SQL write was used.
- Development-local Neon branch only: br-gentle-sun-a2yw79ge.
- Post-write read confirmed food_slug=champagne-vinegar, nutrient_slug=polyphenols, amount=null, is_active=true, reviewed_at=null, reviewed_by=null, rejected_at=null, one citation, expected URL, and evidence level emerging. Guarded audit ID: 5719.
- Queue after write: 16 composition + 63 food-benefit + 0 nutrient-benefit = 79 active pending uncited claims. Before: 17 + 63 + 0 = 80.
- Definition of done met for this single-claim scope: composition-only trust gate updated, exact-source citation attached through the guarded writer, claim remains pending, and post-write state verified.

## Data impact, checks, and limitations

One citation row and its guarded audit record were added on development-local. No amount, decision, review timestamp/by, or rejection field changed. No production access, schema change, migration, service restart, deployment, commit, or Claude handoff occurred. No tests were run. The evidence is a single sampled commercial product and cannot support a universal nutrient amount or health-benefit inference.

No deployment was authorized or performed. If released later, use the repository's normal review/deployment path, then verify the shared composition trust gate accepts the domain while benefit edges continue to reject it. Confirm the source renders with its sample-specific caveat and #4458 remains pending.

