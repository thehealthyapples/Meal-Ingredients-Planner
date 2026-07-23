# Rejected Living Larder Predecessor Assets — Rejection Record

**Recorded under:** `LARDER_ASSET_GOVERNANCE_FOUNDATION` (2026-07-23)
**Rejecting authority:** Home Owner direction in the approved
`LARDER_ASSET_GOVERNANCE_FOUNDATION` work order (rejected predecessors named
explicitly). Evidence is preserved here, never deleted
(`HOME_OWNER_ARCHITECTURE.md` — an unrecorded decision is not a decision).

These files are **excluded forever** from runtime imports, active manifests,
builds and production ZIP exports — enforced mechanically by check **J12** of
`scripts/ci/verify-living-home-assets.ts` (archive present + client tree clear
+ no source reference).

## 1. `larder-jars.webp`

| Field | Value |
|---|---|
| Original path | `client/src/assets/larder/larder-jars.webp` |
| sha256 | `df3552ff217669fdf4c9469bc37658225aa8829da445412765df9b62b90ba0ed` |
| Rejection reason | Pre-governance composite jar strip: multiple jars baked into one raster, no per-ingredient identity, no transparency masters, no shared jar-form specification, no checksum-bound approval — irreconcilable with the one-jar-per-file, 512×768 RGBA, lifecycle-governed asset foundation. |
| Retirement date | 2026-07-23 |
| Replacement asset family | The 27 governed jar records of the Life Register's Larder jar section (`living-details-manifest.ts` § J), rendered one per file under `client/src/assets/living-home/larder/jars/`. |

## 2. `larder-counter.webp`

| Field | Value |
|---|---|
| Original path | `client/src/assets/larder/larder-counter.webp` |
| sha256 | `7867106a6fe3e858e3b7feec852e7274d118d619599a34086478bdb1323c9fdf` |
| Rejection reason | Pre-governance room-furniture raster (counter), superseded by the composed Living Larder interior (LARDER Pass 1/2) and outside the governed asset lifecycle; kept as evidence of the rejected direction. |
| Retirement date | 2026-07-23 |
| Replacement asset family | Living Larder room joinery/furniture per `LIVING_LARDER_ASSET_LIBRARY.md` (ASSET1) — not a jar asset; no record in the jar section claims it. |

Both files were **untracked** at archival (never committed to the client tree)
and had **zero** source references; the move preserved their exact bytes
(checksums above match the pre-move values recorded in the implementation
report).
