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

## Next action

Re-review explicit “not reported” and high-priority missing cells against claim-specific official sources. Record source URL, title, checked date, and region/tier when known. Keep cells grey where sources do not support a conclusion; do not mark a feature No from silence.

## Preservation

53 unrelated dirty worktree entries existed before this task and remain untouched. No database, live service, configuration, push or deployment touched.
