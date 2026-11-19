# Mealime comparison evidence update

- **Date:** 19 November 2026
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / starting HEAD:** `feat/integrated-dev` / `14acbc557a9b9f5a1db17b9d650ec70ec3a75199`
- **Governance preflight:** Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX authority `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, and `implementation-and-compliance.md`. Standing authority for the verified dev branch and user's continuation authorize this scope. Risk: **Amber** because public competitor capability claims are being refined.
- **Rollback:** `rollback/CMP-Mealime-evidence-20261119` → `14acbc557a9b9f5a1db17b9d650ec70ec3a75199`.
- **Architecture:** Existing comparison component remains the single public owner of competitor evidence. No duplicate state, workflow, store, service or API. **AI compliance:** Not applicable; THA AI behavior is unchanged.
- **Scope lock:** Mealime row and supporting audit/session docs only; no competitor account, market ranking, product commitment or deployment.

## Changes and impact

Reviewed all 30 comparison tasks against official Mealime help and product documentation. Updated the row with evidence for restrictions, recipe URL import, planning, grocery lists, Pro nutrition, pantry-item planning and guided cooking. Corrected multi-user collaboration to explain that use relies on one shared account rather than separate collaborators. Preserved neutral unknowns where sources did not establish a capability. No confirmed No ratings were added.

**Data impact:** Static comparison copy/data and Markdown reports only; no user/persistent data reads or writes, schema changes or backfill.

**Trust check:** Support claims link to official sources. Highest residual uncertainty: sources do not document every feature and no hands-on account test was performed; subscription/provider availability can differ by region/platform.

**Definition of done:** All 30 tasks reviewed; source links and tier/region limits recorded; unknowns remain distinct from absence; production build passes; scoped changes committed locally; no push/deploy.

**Acceptance evidence:** Open `/features&compare`, select Mealime at the top, and review its sorted features/evidence details. Expected: planner, import, grocery, nutrition and cooking evidence appears with limits; unreported functions stay grey. Build and scoped source review are the verification; no browser acceptance was run.

**Rollback:** Revert the scoped commit; rollback tag above anchors the pre-change commit. Preserve unrelated worktree changes.

## Verification

- `git diff --check` — passed after staged review.
- `npm run build` — completed successfully; output includes existing Browserslist, PostCSS, large-chunk and server bundling warnings.
- Tests not run; user asked to continue the evidence audit, not to add or run tests.
- Live services, databases, scheduled tasks and configuration: not touched.

## SUGGESTIONS

Continue with the next high-overlap competitor after this tranche. Market popularity ranking remains separate and requires dated market/app-store evidence.