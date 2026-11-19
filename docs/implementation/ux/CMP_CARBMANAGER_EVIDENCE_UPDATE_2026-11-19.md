# Carb Manager evidence row update

**Date:** 19 November 2026
**Repository/branch:** `tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Risk:** Amber — evidence status and notes in the existing public competitor matrix.
**Rollback:** `rollback/CMP-CarbManager-evidence-20261119` → `0c59032b135b14c4ef59a42e4d2900cc071f9230`.

## Change

Expanded Carb Manager's existing row across all 30 tasks with claim-specific source links and review dates. Captured multi-day meal plans, custom/curated plans, Premium URL imports, recipe QR scanning, per-person shopping list scale, weekly nutrition totals, photo logging, weight and health tracking, and macro-driven add-on suggestions. Distinguished these from family eater profiles, pantry sync and interactive cook mode, which are not established. Full matrix: [evidence audit](../../investigations/ux/CMP_CARBMANAGER_EVIDENCE_AUDIT_2026-11-19.md).

## Architecture and trust

- **Verified:** the existing comparison component is the sole public static evidence owner; no duplicate data store or workflow was added.
- **Verified:** no personal data, schema, persistence, service, configuration or AI behavior changed.
- **Trust check:** cells link to official Carb Manager sources; unknowns remain grey. Highest uncertainty is current in-app feature availability across plan tiers and platforms, since this was a documentation review rather than account testing.
- **Rollback:** restore the row from the annotated tag or revert the scoped commit. Unrelated dirty work is excluded and preserved.

## Completion and verification

Definition of done: all 30 cells have bounded evidence/status; silence is not scored No; internal-only development ideas remain out of the public page; build passes; only this row and task records are committed. No tests were added or run. Browser acceptance was not repeated. No deploy or push.

Data impact: reads public vendor documentation, writes static comparison evidence and audit records, changes no existing personal data, requires no backfill. Scope lock: Carb Manager's row and task records only. Standing dev-branch authority and user instruction permit this Amber update.

## SUGGESTIONS

Review selected-date shopping, explicit serving-count scaling, and printable outputs in THA's existing shopping workflow. This report does not authorize those app changes.
