# Mealia comparison evidence update

- **Date:** 19 November 2026
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / starting HEAD:** `feat/integrated-dev` / `a4af11122c592787fe8a1e92d9cd012d65b29712`
- **Governance preflight:** Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX authority `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, and `implementation-and-compliance.md`. Standing authority on the verified dev branch and user's continuation authorize this scope. Risk: **Amber**, because competitor capability claims on the public page are refined.
- **Rollback:** `rollback/CMP-Mealime-evidence-20261119` → `a4af11122c592787fe8a1e92d9cd012d65b29712`.
- **Architecture:** Existing comparison component remains the single public owner of competitor evidence. No duplicate state, workflow, store, service or API. **AI compliance:** Not applicable; no THA AI behavior changed.
- **Scope lock:** Mealia row and research/session records only; no competitor account, market ranking, product commitment or deployment.

## Changes and impact

Reviewed all 30 comparison tasks against Mealia's official UK product/help pages and UK App Store listing. The row now represents its household-sized meal planning, budget-first supermarket basket, website recipe import and limited evidence for AI personalization. Individual eater profiles, social import, meal scanning, diary functions, nutrition analysis and other unsupported capabilities stay grey. No confirmed No ratings were added. The store listing and website currently vary in supermarket coverage; this uncertainty is recorded.

**Data impact:** Static comparison content and Markdown reports only; no personal/persistent data reads or writes, schema changes or backfill.

**Trust check:** Feature claims cite first-party sources; all remaining gaps stay neutral. Highest residual uncertainty: these are vendor descriptions rather than hands-on verification, and regional/platform feature availability may differ.

**Definition of done:** 30 tasks reviewed; claim limits and source uncertainty recorded; unknown remains distinct from absence; production build passes; scoped changes committed locally; no push/deploy.

**Acceptance evidence:** Open `/features&compare`, select Mealia, review its sorted features and evidence details. Expected: budget/basket and meal-planning support is clear; unsupported health/diary features remain grey. Build and scoped evidence review are verification; no browser acceptance run.

**Rollback:** Revert the scoped commit; rollback tag above anchors the pre-change commit. Preserve unrelated dirty files.

## Verification

- `git diff --check` — passed after staged review.
- `npm run build` — completed successfully; output includes existing Browserslist, PostCSS, large-chunk and server bundling warnings.
- Tests not run; user asked to continue the evidence audit, not add or run tests.
- Live services, databases, scheduled tasks and configuration: not touched.

## SUGGESTIONS

Continue source audits for other high-overlap competitors. Market popularity ranking remains a separate research task requiring dated market/app-store evidence.