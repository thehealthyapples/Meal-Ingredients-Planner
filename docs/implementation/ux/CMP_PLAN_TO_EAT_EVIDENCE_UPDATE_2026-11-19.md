# Plan to Eat evidence row update

**Date:** 19 November 2026
**Repository/branch:** `tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Risk:** Amber — public competitor evidence and status notes.
**Rollback:** `rollback/CMP-PlanToEat-evidence-20261119` → `2087dc835b2916c3116f4632a425d1abeb82c55d`.

## Change and definition of done

Expanded the Plan to Eat row from five coarse entries to 30 reviewed tasks with official-source URLs and review dates. Recorded family-oriented serving scale, recipe/social/paper import, calendars and Menus, generated shopping and store handoff, nutrition and Food Logger, Freezer batch cooking, AI ingredient substitutions and guided cooking. Kept unreported distinctions neutral. See [full audit](../../investigations/ux/CMP_PLAN_TO_EAT_EVIDENCE_AUDIT_2026-11-19.md).

Done when all 30 cells have evidence or an explicit unknown rationale, the production build passes, only scoped files are committed, and checks/results are recorded.

## Architecture, data, trust and rollback

- **Verified:** the current comparison component remains the sole static public evidence owner; no second data store, persistence or workflow was added.
- **Verified:** no identity, schema, service, API, configuration or THA AI behavior changed. Comparator claims about Plan to Eat's AI substitutions do not alter THA AI.
- **Data impact:** reads official help/release-note pages; updates static evidence content only. No personal data, migration or backfill.
- **Trust check:** each cell has a claim-relevant official link and review date; unknowns remain grey and no absence is inferred from silence. Highest uncertainty is feature availability and status across account/platform/region; the Food Logger is documented as Beta.
- **Rollback:** revert the scoped commit or restore the changed source/docs from the annotated tag. Pre-existing dirty files stay excluded.
- **Scope lock:** public evidence row, research audit and internal-only suggestions. Optional work is recorded as SUGGESTIONS, not public commitments.
- **User acceptance evidence:** open `/features-and-compare`, select Plan to Eat in the header and inspect the feature order/detail. Verify social recipe capture, recipe image scanning, freezer, week nutrition, and unknown diary fields show the relevant source and limits.
- **Verification:** production build and staged diff check; tests/browser acceptance not run.

## Compliance evidence

G workspace instructions and THA operating-model skill plus the repository governance/architecture/operating-model chain were freshly read at preflight. **Verified:** no owner/architecture conflict was found; the existing page remains the consumer and static evidence owner. Canonical ownership remains singular, no duplicate state/workflow was introduced, and existing comparison architecture was extended.
