<!-- Copy to .engineering/session/runs/<SESSION_ID>.md at the start of a session. -->

# Session: LIVING_LARDER_PRODUCTION_IMPLEMENTATION

| Field | Value |
|---|---|
| **Session ID** | `LIVING_LARDER_PRODUCTION_IMPLEMENTATION` |
| **Rollback ID** | `rollback/living-larder-production-implementation-20260724` (branch @ `77e907d7`) + dirty-tree tag `rollback/living-larder-production-implementation-20260724-dirty` |
| **Start time** | 2026-07-24T11:20:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Implement the approved Living Larder (front-on realistic elevation) in the production app using the uploaded governed PNG assets at `attached_assets/THA_Living_Larder_Assets/`, wired to real household staple data, with add-to-Shopping and remove-from-staples interactions, mobile + accessibility support. No schema meaning change; no deploy.

## Files being modified
- `client/src/pages/larder-room.tsx` (+ `.css`, `larder-room-metrics.ts`) — the production room (the one J7 asset mouth)
- `client/src/pages/pantry-page.tsx` + `client/src/lib/larder-forms.ts` — RETIRED (interaction law ported verbatim)
- `client/src/App.tsx` — `/pantry` → LarderRoomPage; `/larder` → redirect
- `client/src/components/layout/living-details-manifest.ts` — 7 jar approvals (checksum-bound), §P produce register, mapping curation
- `docs/implementation/assets/house-asset-register.json` — 10 joinery rows
- `scripts/ci/verify-living-home-assets.ts` — P1–P3, K1–K2, J12 extension
- `docs/implementation/2026-07-24-living-larder-production-implementation.md` — implementation report + evidence dir

## Checkpoints
- [x] Rollback protection created (branch + dirty snapshot tag)
- [x] Uploaded asset pack inventoried (19 usable PNGs; 2 recorded rejects)
- [x] Governing docs read; owners confirmed (Domain 30 / 15 / 2 / Life+House Registers / Home Owner)
- [x] Assets registered through governed lifecycle; verifier 31/31 PASS
- [x] Asset calibration page verified (PASS) and deleted (J7)
- [x] Production room implemented; `/pantry` serves it; SVG room retired
- [x] Verification suite run (build PASS; targeted tests green; pre-existing failures verified pre-existing at rollback commit)
- [x] Report complete: `docs/implementation/2026-07-24-living-larder-production-implementation.md`
- [x] Committed to `claude-work` (pathspec-scoped; pre-staged housekeeping untouched)

**Last checkpoint:** committed + pushed to claude-work

## Next action
Home Owner review: accept the production room (report §11 acceptance steps) and rule on the 20 remaining procedural jar candidates (fail-closed until approved). Do not merge or deploy.

## Blockers
Pre-existing STAGED work (277-file attached_assets → archive/assets housekeeping + `REPOSITORY_HOUSEKEEPING_AND_ARCHIVE.md`) remains in the index, uncommitted, from a prior session — deliberately excluded from every commit here.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
