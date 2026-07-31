# Living Larder — Branch Reconciliation

**Date:** 2026-07-31
**Branch produced:** `feat/living-larder-authoritative` (baseline `origin/claude-work` `3cfc1f1b`)
**Rollback:** `rollback/living-larder-reconcile-base` → `3cfc1f1b`
**Purpose:** Produce one authoritative Living Larder branch by reconciling the durable committed baseline (`origin/claude-work`) with the valid newer work from the uncommitted `tha-living-larder-v2` working tree.

## Canonical ownership (confirmed)

- **North Star:** `LARDER1` — `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`.
- **Asset specification:** `ASSET1` — `LIVING_LARDER_ASSET_LIBRARY.md` (Home Owner = aesthetic approval; Designer = spec custody).
- **Asset admission standard:** `LHDC1` — `LIVING_HOME_DESIGN_CONSTITUTION.md`.
- **Asset byte owner / register:** the **Life Register** `client/src/components/layout/living-details-manifest.ts` § J (planned → candidate → approved, checksum-bound), plus the EXP3 House Register `docs/implementation/assets/house-asset-register.json`; verified by `scripts/ci/verify-living-home-assets.ts` (`npm run verify:living-home-assets`).
- **Capability boundary:** `CAPBOUND1` — externally-produced artefacts enter through the existing asset governance unchanged (CB9); a tool limitation is never reported as a THA limitation (CB3).
- **Room mouth:** `client/src/pages/larder-room.tsx` (the single declared consumer of jar assets).

No governing-architecture vs implementation conflict was found (see below), so the reconciliation proceeded.

## Branch comparison

The two lines diverged at `main` `3ef7e8ef` and never merged:

| | `origin/claude-work` (baseline) | `tha-living-larder-v2` (working tree) |
|---|---|---|
| State | committed + pushed (2026-07-25) | uncommitted (2026-07-29/30) |
| Base | `3ef7e8ef` (main) | `1666f542` (staging-fix line) |
| Room | `larder-room.tsx` **committed, 954 lines** | Candidate-07 `larder-room.tsx` 438 lines |
| Jars | **27 masters** + generator + Life Register + verifier | (uses claude-work-style assets under a different path) |
| Governing docs | ASSET1 + all LIVING_LARDER_* + LARDER1 + LHDC1 + CAPBOUND1 + VISREG1 | same docs |
| Visual-acceptance | — | **D-017 / D-018** decisions |

### Conflict analysis

- **Governing docs (ASSET1, ARCHITECTURE, INTERIOR, INTERACTION, IMPLEMENTATION, NORTH_STAR, VISUAL_REGISTRY, CAPABILITY_BOUNDARY):** compared byte-for-byte. Every one is **content-identical** to the baseline; the only difference is CRLF (v2) vs LF (claude-work) line endings. **No governance conflict.** The baseline's LF versions are kept; the CRLF duplicates are not imported (avoids whitespace churn).
- **Room implementation:** the baseline's committed 954-line room is preserved. The v2 Candidate-07 438-line room and its `/pantry` composition were **rejected under D-018** and are not imported (a rejected visual concept, and newer ≠ verified).
- **Asset library:** the baseline's 27 masters + generator + Life Register + verifier are the canonical system and are preserved. v2's `joinery-normalized/`, `scene/` and `prepare-larder-joinery-assets.py` belong to the rejected composition's parallel approach and are not imported (duplicate workflow / rejected-composition assets).
- **Visual-acceptance decisions D-017 / D-018:** documented on **neither** baseline nor elsewhere on claude-work; they exist only in v2's orchestration status doc. These are **valid governing decisions** and are the one thing genuinely brought forward — extracted clean into `docs/architecture/LIVING_LARDER_VISUAL_ACCEPTANCE_DECISIONS.md` (orchestration status stripped).

## Preserved (from baseline)

- The committed room implementation (`larder-room.tsx` + `.css` + `-metrics.ts`).
- The 27-jar production library (`client/src/assets/living-home/larder/jars/`) with its generator, Life Register records, verifier and review sheet.
- All valid governing ASSET1 / LARDER1 / LHDC1 / CAPBOUND1 / visual-registry architecture and the candidate→approval lifecycle.
- The recovered masters under `attached_assets/THA_Living_Larder_Assets/`.

## Brought forward (from v2, cleaned)

- The **D-017 / D-018 visual-acceptance decisions** and the room-first contract, as a governing decision record.

## Deliberately NOT preserved

- **Rejected visual concept:** the Candidate-07 `/pantry` composition (rejected under D-018) and its room/server wiring.
- **Stale orchestration:** `CLAUDE_WORKSTREAM_REGISTRY.json`, `CHATGPT_WORKSTREAM_STATE.json`, the `larder-assets` / `larder-scene` / `larder-qa` nested worktrees, the monitor cron, workstream ledgers and `CLAUDE_*_TASK.md` briefs.
- **Duplicate workflows:** `prepare-larder-joinery-assets.py` and the deprecated flat ingredient-imagery pipeline (superseded by the jar-master generator + Life Register; and by IMGDIR1).
- **Line-ending duplicates:** CRLF copies of governing docs already present (identical) in the baseline.
- **Unverified-because-newer work:** the v2 scene projection module and scene shell, which serve only the rejected composition.

## Result

One authoritative branch `feat/living-larder-authoritative` = durable baseline + the D-017/D-018 decisions + these two records. Committed once. Not pushed/merged/deployed.
