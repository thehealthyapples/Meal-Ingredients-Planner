# Yazio evidence row update

**Date:** 19 November 2026
**Repository/branch:** `tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Risk:** Amber — source-backed status/notes in an existing public comparison matrix.
**Rollback:** `rollback/CMP-Yazio-evidence-20261119` → `0a55d468d1a291a29d9e14487da0d02fec654961`.

## Change

Expanded Yazio's existing row across all 30 matrix tasks. Added official evidence for Pro future planning, grocery lists, advanced nutrition and weekly analysis, photo meal estimates, diary/body/mood tracking, barcode comparison, and post-meal Meal Tips. Marked undocumented functionality neutral, not No. Full claim map: [Yazio evidence audit](../../investigations/ux/CMP_YAZIO_EVIDENCE_AUDIT_2026-11-19.md).

## Architecture, data and trust

- **Verified:** the existing comparison component remains the single owner of public static competitor evidence; no second store, workflow or owner was introduced.
- **Verified:** static source/notes and Markdown records only; no personal data, schema, database, service, configuration or AI reasoning changed.
- **Trust check:** reviewed claims link to Yazio's official help material. Highest remaining uncertainty is live availability by tier/device and Yazio's own notice that its recipe feature is currently having an issue.
- **Rollback:** revert the scoped commit or restore the row from the annotated rollback tag. Pre-existing dirty work remains outside this change.

## Completion and verification

Definition of done: all 30 tasks have bounded evidence/uncertainty, no undocumented capability is marked No, internal suggestions remain off the public page, build passes, and only the scoped row/records are committed. `npm run build` passed with existing toolchain/bundle warnings. No tests were added or run. Browser acceptance was not repeated. No deployment or push.

Data impact: reads official public help pages, writes static comparison evidence and reports, changes no data meaning, and needs no backfill. Scope lock: Yazio row and task records only. User continuation and standing dev-branch authority permit this Amber work.

## SUGGESTIONS

Consider an optional, reviewed nutrition nudge after a diary entry and product-to-product comparison in THA's existing Analyser. Reuse existing capability owners and restriction checks; this report does not authorize implementation.
