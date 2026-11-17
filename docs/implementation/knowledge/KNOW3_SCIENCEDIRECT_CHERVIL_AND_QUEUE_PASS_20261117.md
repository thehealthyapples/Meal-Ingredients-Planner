# KNOW3 ScienceDirect composition citation and queue pass — 2026-11-17

## Task and scope
Continue review of pending uncited food-composition and food-benefit claims. Add citations only through the existing guarded writer, preserve pending status and nutrient amounts, and record negative-effect evidence found. No claim decisions or amount edits are permitted.

## Repository, governance, and risk
- Owning repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, WS0 Knowledge Registry / KNOW3 evidence review.
- Branch / HEAD: `feat/integrated-dev` / `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- Risk: 🔴 Red — trusted-source policy and development-local claim citation metadata.
- Governing files read in this session (with prior task preflight carried forward): workspace `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs\architecture\README.md`; `docs\architecture\ENGINEERING_WORKFLOW.md`; `.engineering\protocols\ROLLBACK_PROTECTION_PROTOCOL.md`; `docs\ai-operating-model\README.md`; `docs\ai-operating-model\evidence-and-architecture.md`; `docs\ai-operating-model\rollback-and-output.md`; `docs\architecture\PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs\architecture\NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs\implementation\knowledge\KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md`; and `shared\knowledge\evidence.ts`.
- Verified canonical owner: existing Food Knowledge claim tables, evidence gate, and audited claim-review workflow. No duplicate state or writer was introduced.
- Rollback protection: `rollback/KNOW3-sciencedirect-composition-20261117` at the current committed HEAD. Pre-existing worktree changes were preserved. No commit or deployment.
- The prior scoped DOAE trust change was already present in the dirty trust-policy file and was not edited in this pass.

## Work completed
- Added `sciencedirect.com` to the existing trusted source list and composition-only gate in `shared\knowledge\evidence.ts`, under the user's explicit composition-only approval.
- Manually checked the source gate: the new domain evaluates allowed for a food-to-nutrient composition row and denied for a food-benefit row.
- Claim #2123 (`chervil → vitamin-k`) was freshly rechecked active, pending, with no references and no amount/review decision to change. A peer-reviewed HPLC study of herb phylloquinone was attached using `scripts\attach-reviewed-composition-evidence.ts` (`preview` → `apply` → `verify`). The paper's publisher table was inaccessible during review; the exact fresh-chervil extraction was cross-checked in an EFSA compendium data record that cites the same paper. The excerpt states this limitation and no amount was entered.
- Guarded receipt `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-sciencedirect-chervil-2123-receipt.json`; audit ID 5717. Claim remained pending, uncited amount remained unset, and source count became exactly one.
- No raw SQL writes. No approval, rejection, amount edit, review timestamp update, migration, restart, production access, or deployment.

## Evidence screening and current blockers
- A peer-reviewed open-access study directly measures L-ascorbic acid in fresh winter savory (*Satureja montana*) and reports 25.89 mg/100 g fresh weight as the overall mean across harvest/plant-age samples. It is a potential direct match for pending #4386, but the publisher domain `czasopisma.up.lublin.pl` is not currently trusted. The user has been asked whether to admit it as composition-only; no policy change or citation has been made for #4386 pending that approval.
- Searches of trusted official sources did not find exact vitamin-K data for tarragon, fresh lime leaves, hyssop, kaffir lime leaves, lemon balm, lovage, salad burnet, sorrel, or winter savory. Unreported fields and different plant forms/species are not treated as positive evidence or zero.
- ScienceDirect herb study evidence is not being generalized across species, plant parts, or nutrients. Composition studies do not establish benefits.
- Benefit screening confirmed that evidence for sesame-oil skin effects involved topical application, not dietary use; rapeseed-oil trials/reviews concern cardiovascular biomarkers rather than a broad “healthy ageing” effect; coconut-fat intervention literature reports mixed glycemic outcomes, not a general energy-support claim. No benefit citations were attached from these mismatches.

## Negative-effect notes recorded
Appended bounded, preparation-specific notes to `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__food-caution-research-notes.md`:
- Lovage root medicinal preparations: EMA reports possible photosensitivity from furocoumarins; the note explicitly excludes ordinary culinary leaf use.
- Coconut fat/oil repeated intake: a systematic review/meta-analysis reports modest glycemic signals; the note limits interpretation to study-level coconut-fat exposures.
These are flat-file research notes only, not app caution claims.

## Queue and checks
Post-write guarded summary on the development-local Neon branch `br-gentle-sun-a2yw79ge`:
- Composition: 173 pending / 155 cited = 18 uncited.
- Food-benefit: 369 pending / 306 cited = 63 uncited.
- Nutrient-benefit: 10 pending / 10 cited = 0 uncited.
- Total pending uncited: 81 (down from 82 due only to #2123).
- Guarded preview/apply/verify: passed for #2123. No automated tests run.

## Files and environment
- Changed by this pass: `shared\knowledge\evidence.ts`; source manifest and receipt in Incoming/Agent Reports; this report; the food-caution research notes file.
- Pre-existing unrelated modified/untracked benchmark, intelligence, and startup-log files were left untouched.
- No service restart, database migration, deployment, commit, or cross-provider handoff.

## Completion
Incomplete. 81 pending uncited claims remain. Continue exact-match research and guarded citation-only writes as sources are authorized and directly support each specific food/nutrient or benefit pair. Keep claims pending.
