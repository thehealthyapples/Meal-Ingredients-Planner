# CMP evidence-status distinction — session record

**Session:** `CMP_EVIDENCE_STATUS_DISTINCTION_20261119`
**Stage:** Evidence status distinction implemented; source audit in progress.
**Repository / branch:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Base HEAD:** `047fc302991bf42d8b327064ecf0770bc8ebdb84`
**Rollback:** `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`

## Objective and scope

Distinguish an explicitly reviewed cell whose developer sources do not report a capability from a matrix cell not assessed yet. Both retain the grey Not verified dot; neither is reported as No. Restore the public comparison routes and Home header link because the page component was not routed or included in the build.

## Current work

- `client/src/pages/features-compare-page.tsx`: separate unknown reasons and expose them in evidence details.
- `client/src/App.tsx`: register canonical and alias public routes.
- `client/src/pages/home-page.tsx`: add the top-level Compare apps link.
- `docs/product/structure/pages/page-features-compare.md`: record the evidence detail behavior.
- `docs/investigations/ux/CMP_EVIDENCE_STATUS_DISTINCTION_2026-11-19.md`: evidence baseline and status rules.

## Samsung Food audit

Reviewed Samsung Food official support pages for its row of 30 tasks. Added claim-specific sources, tier notes, and three “Not reported” reasons; corrected Weekly intake from Yes to Some limits. No No ratings were added. Full record: `docs/investigations/ux/CMP_SAMSUNG_FOOD_EVIDENCE_AUDIT_2026-11-19.md`.

## Next action

Continue with other high-overlap apps: re-review “not reported” and high-priority missing cells against claim-specific official sources. Record source URL, title, checked date, and region/tier when known. Keep cells grey where sources do not support a conclusion; do not mark a feature No from silence.

## Preservation

53 unrelated dirty worktree entries existed before this task and remain untouched. No database, live service, configuration, push or deployment touched.

## MyFitnessPal source-audit tranche — 19 November 2026

**Governance preflight for this tranche:** Verified repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `9b93b18b426f533e8043e888850c020c9c333303`; confirmed and preserved pre-existing unrelated dirty paths. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX architecture `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, and operating-model `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`. Standing dev authority and direct user instruction: **Implementation permitted: YES**, scoped to the MyFitnessPal competitor row and its research/session records. Risk 🟡 Amber. Rollback tag created before edits: `rollback/CMP-MFP-evidence-20261119` → `9b93b18b426f533e8043e888850c020c9c333303`.

Reviewed 30 matrix tasks against official MyFitnessPal help articles. Planner offers Premium+ household-sized plans, allergy/restriction settings, and meal sharing; retailer delivery links are limited to US/Canada. Premium supports barcode and meal-photo logging, and weekly reporting is documented. Individual eater profiles, external plan import, paper-plan scan, mood/energy logging, offline barcode lookup and AI tailoring remain unreported rather than marked No. Full task mapping and source links: `docs/investigations/ux/CMP_MYFITNESSPAL_EVIDENCE_AUDIT_2026-11-19.md`. Scoped source update: `client/src/pages/features-compare-page.tsx`.

`npm run build` completed successfully (existing Browserslist/PostCSS/chunk/server-bundling warnings). No tests were run. No live service, database, scheduled task, or configuration touched. Next: audit the next high-overlap competitor, preserving source-specific unknowns and tier/region limits.

Typecheck note for the MyFitnessPal tranche: repository-wide `npm run typecheck` exits 1 with TypeScript diagnostics in unrelated files (including server scripts/tests and other UI components). A filtered rerun showed no diagnostics in `client/src/pages/features-compare-page.tsx`. The successful production build remains recorded above.
