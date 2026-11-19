# Yuka comparison evidence update

- **Date:** 19 November 2026
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / starting HEAD:** `feat/integrated-dev` / `900a75daba03d36c3ee17a16b666323e9b0aefc7`
- **Governance preflight:** Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX authority `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, and `implementation-and-compliance.md`. Standing authority for the verified dev branch and user's continuation authorize the scoped update. Risk: **Amber**, because this changes public competitor capability claims.
- **Rollback:** `rollback/CMP-Yuka-evidence-20261119` → `900a75daba03d36c3ee17a16b666323e9b0aefc7`.
- **Architecture:** Existing comparison component remains the single public owner of competitor evidence. No duplicate store, state, workflow, service or API. **AI compliance:** Not applicable; no THA AI behavior changed.
- **Scope lock:** Yuka row and support/research records only. No competitor login, market ranking, product commitment or deployment.

## Changes and impact

Reviewed all 30 tasks against Yuka's official app/help pages and UK App Store listing. Updated the row to distinguish barcode scanning, product-level nutrient/additive scoring, alternative-product recommendations, limited Premium preference alerts, scan history and offline database limits from meal planning or diary features. Unreported capabilities remain grey; no No ratings were added.

**Data impact:** Static public comparison content and Markdown reports only; no personal/persistent data reads or writes, schema change or backfill.

**Trust check:** Support claims link to official sources. The highest residual uncertainty is that source coverage cannot establish whether Yuka has undocumented capabilities. Yuka itself warns that product data can be incomplete or stale and that dietary alerts do not replace package-label checks.

**Definition of done:** All 30 tasks reviewed; product scanning distinguished from meal scanning; offline and restriction limits recorded; unknown remains distinct from absence; production build passes; scoped changes committed locally; no push/deploy.

**Acceptance evidence:** Open `/features&compare`, select Yuka and review its sorted features/evidence notes. Expected: barcode/product scan strengths appear, with nutrition and offline limits; meal-planning and diary categories not documented remain grey. Build and source review are verification; browser acceptance was not run.

**Rollback:** Revert the scoped commit; rollback tag above anchors the pre-change commit. Preserve unrelated worktree changes.

## Verification

- `git diff --check` — passed after staged review.
- `npm run build` — completed successfully; output includes existing Browserslist, PostCSS, large-chunk and server bundling warnings.
- Tests not run; the user asked to continue the competitor audit, not add or run tests.
- Live services, databases, scheduled tasks and configuration: not touched.

## SUGGESTIONS

Internally assess whether THA's product-analysis journey can make scan results, reasons and useful alternatives faster to act on, then carry the result into the existing meal plan and shopping flow. This is not approved roadmap work and does not belong on the public page.