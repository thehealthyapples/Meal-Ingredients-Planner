# Session: LARDER_PRODUCTION_ASSET_GENERATION

| Field | Value |
|---|---|
| **Session ID** | `LARDER_PRODUCTION_ASSET_GENERATION` |
| **Rollback ID** | `rollback/larder-production-asset-generation-20260723` → `03578305` |
| **Start time** | 2026-07-23T08:20:00Z |
| **Current stage** | Waiting for User |

## Objective
Generate the 27 transparent PNG jar masters (25 ingredients + empty +
fallback-green) per the governance foundation's shared spec; validate with the
existing verifier (no bypasses); register as candidates with checksums;
produce an equal-scale contact sheet for Home Owner review. NO approval, NO
runtime derivatives, NO WebP.

## Files being modified
- `scripts/assets/generate-larder-jar-masters.ts` — deterministic generator (SVG → Chromium RGBA screenshot)
- `client/src/assets/living-home/larder/jars/*.png` — the 27 masters
- `client/src/components/layout/living-details-manifest.ts` — 27 records promoted planned → candidate (checksums recorded, via the register's own lifecycle law)
- `scripts/ci/verify-living-home-assets.ts` — J6 strengthened: candidate bytes must hash to the record checksum
- `docs/reference-assets/living-larder-review/` — contact sheet + README
- `docs/implementation/LARDER_PRODUCTION_ASSET_GENERATION.md` — report
- Session tracking files

## Checkpoints
- [x] Foundation confirmed present + verifier 26/26 PASS before changes
- [x] `git status` reviewed; rollback tag created and recorded
- [x] Rendering capability verified (Playwright Chromium: 512×768 8-bit RGBA, non-interlaced, no text chunks)
- [x] Generator written; 27 masters generated (regenerated once after clasp/lid craft fix found in visual review)
- [x] Verifier 26/26 PASS with candidates registered — two mid-task failures fixed at cause (stale checksums re-recorded; J9 self-test made state-independent); J6 strengthened to byte-check candidates
- [x] Contact sheet + review README + checksum projection under docs/reference-assets/living-larder-review/
- [x] Report completed; work committed

**Last checkpoint:** Delivered; all 27 candidates unavailable, awaiting Home Owner review.

## Next action
COMPLETE — Home Owner reviews the contact sheet; approvals (checksum-bound) or
rejections are recorded in the Life Register per record. ASSET1 amendment for
empty/fallback jars before their approval.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
