# Session: LARDER5_Living_Larder_Architecture

| Field | Value |
|---|---|
| **Session ID** | `LARDER5_Living_Larder_Architecture` |
| **Rollback ID** | `rollback/larder-architecture-20260724` → annotated tag object `d40190f0`, points at committed `1e0ac8ff` (created before any file change) |
| **Start time** | 2026-07-24 |
| **Current stage** | Documentation |

## Objective
Design the canonical Living Larder from first principles and record it as
`docs/architecture/LIVING_LARDER_ARCHITECTURE.md` (`LARDER5`) — the governing
**spatial composition** of the room (station point, viewing angle, shell,
aperture, wing plan, furniture-as-navigation, desktop and mobile compositions,
personalisation envelope, and the Room Composition Principles future Living
Home rooms inherit). Architecture only. No UI implementation, no deployment.

## Files being modified
- `docs/architecture/LIVING_LARDER_ARCHITECTURE.md` — new governing document (`LARDER5`)
- `docs/architecture/README.md` — architecture index entry (Experience Governance)
- `.engineering/session/CURRENT.md` — active-session dashboard row
- `.engineering/session/runs/LARDER5_Living_Larder_Architecture.md` — this run file

## Checkpoints
- [x] Git status confirmed; branch `claude-work`
- [x] Rollback protection created and identifier reported
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md` bootstrap, `CRAFT1`, `LARDER1`–`LARDER4`, Blueprint §§ 5.1/6.2/7/8, `LIVINGHOME1`/`LIVINGHOME2`, `HOMEOWNER1`)
- [x] Existing Larder canon surveyed — `LARDER1` (North Star), `LARDER2` (interior), `LARDER3` (interaction), `LARDER4` (implementation), `ASSET1` (assets)
- [x] Gap confirmed: **no document owns the room's spatial composition** — station point, viewing angle, shell, aperture placement, wing plan, furniture-as-navigation, desktop/mobile composition
- [x] Room designed from first principles (architecture-first, `CRAFT1` § 7.2 — existing code consulted only afterwards, as reference)
- [x] `LIVING_LARDER_ARCHITECTURE.md` authored
- [x] Architecture index updated — `LARDER2`/`LARDER3`/`LARDER4`/`ASSET1` had been GOVERNING since 2026-07-22/23 while **absent from the index**; indexed alongside `LARDER5` in the same change
- [x] `repo-structure-verify.sh`: **"every architecture document indexed in README.md" FAIL → PASS** (verified by stashing the README change and re-running). Two structure FAILs remain and are **pre-existing, untouched by this session**: loose files under `docs/implementation/` and `docs/investigations/`
- [x] Committed and pushed to `claude-work`

**Last checkpoint:** committed and pushed to `claude-work`

## Next action
Home Owner review of `LARDER5`, in particular the two Discovered Items in § 15:
(1) the single aperture placed on the **left return** (the one-morning law) where
the North Star imagery composes the orchard on the right; (2) the inherited
`/pantry` naming divergence. **Do not begin implementation** on the strength of
this document — `LARDER4` § 14 governs when a build may start.

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
