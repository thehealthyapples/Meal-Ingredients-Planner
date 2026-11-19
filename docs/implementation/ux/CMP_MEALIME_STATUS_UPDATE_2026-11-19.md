# Mealime comparison status clarification

**Date:** 19 November 2026
**Repository/branch:** `tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Risk:** Amber — current-service status context on the public comparison.
**Rollback:** `rollback/CMP-Mealime-status-20261119` → `c3cbba878bc47b5f343366dc5db1437b09b89f19`.

## Change and definition of done

Added a visible historical-entry notice above the comparison matrix and updated Mealime's hover description. Existing feature evidence stays available as historical evidence. The notice reflects Mealime's official 21 October 2026 shutdown announcement and avoids claiming independently verified technical unavailability.

Done when the warning is visible in source, official citations are recorded, build passes and only scoped files are committed.

## Architecture, data and trust

- **Verified:** existing comparison page owns the static competitor record; no duplicate state/store/workflow.
- **Verified:** no user data, service, API, persistence, schema, configuration or AI behavior touched.
- **Data impact:** public-source status copy only; no migration/backfill.
- **Trust check:** official homepage and Apple release history support the announced shutdown date. Direct live service availability is unverified and explicitly not overclaimed.
- **Rollback:** revert scoped commit or restore from annotated rollback tag; unrelated dirty work excluded.
- **Scope lock:** status label and internal research/implementation record only.
- **User acceptance evidence:** open `/features-and-compare`; the visible historical notice must state that Mealime announced shutdown for 21 October 2026 and its row is not an active service comparison.
- **Verification:** production build and staged diff check; no tests/browser acceptance run.

## Compliance evidence

Fresh governance/architecture/operating-model read found no conflict. Existing static evidence owner and consumer remain unchanged. The historical row is retained for continuity, but no current-service claim is made.
