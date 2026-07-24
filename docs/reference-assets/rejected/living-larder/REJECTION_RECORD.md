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

## 3–9. Procedural jar candidates superseded by production masters (2026-07-24)

**Recorded under:** `LIVING_LARDER_PRODUCTION_IMPLEMENTATION` (2026-07-24).
**Rejecting authority:** the Home Owner's written 2026-07-24 implementation
instruction — the uploaded pack `attached_assets/THA_Living_Larder_Assets/` is
named "the production source of truth"; the seven overlapping procedural
candidates are therefore superseded and archived (evidence kept, never deleted).
The twenty remaining procedural candidates are NOT rejected — they stay
registered candidates awaiting Home Owner review.

| Archived file | Superseded family | Procedural sha256 (was the registered candidate checksum) |
|---|---|---|
| `tha-larder-jar-rolled-oats-procedural-v1.png` | rolled-oats | `3fc47c3da129a49fc3dea80dca4b6483f10e4b972e2f428ea41e5b709bec60b9` |
| `tha-larder-jar-white-rice-procedural-v1.png` | white-rice | `27f76e996b070286f488de42f36503a64a3d94aa61bc5eb6e97577e16e117895` |
| `tha-larder-jar-brown-rice-procedural-v1.png` | brown-rice | `39ed3447f29f5aa9990874cc33dbc8249cb52a5b873fe4085552f10dd4727efd` |
| `tha-larder-jar-white-penne-procedural-v1.png` | white-penne | `5fa8b7061491e3116db7e3ee9a8056f21a7c4a774ffe7850439ff4a57dd97f4a` |
| `tha-larder-jar-plain-flour-procedural-v1.png` | plain-flour | `7de165059c5718ad973fc2a0df4402fabb3f1e779510ae5beba2e99866558e1f` |
| `tha-larder-jar-sugar-procedural-v1.png` | sugar | `12633858559afc0b9476480d2b57ed989e576ae4a4ffb556d1928698b350f419` |
| `tha-larder-jar-chia-seeds-procedural-v1.png` | chia-seeds | `8604fdf9c8fa394f5ecac3a6b51f18f4ae8a5c361702f8b3218e15f2dd71c243` |

Each register record carries the matching `rejectionHistory` entry
(`living-details-manifest.ts` § J), and the replacement production master is
approved with a checksum bound to its exact uploaded bytes.
