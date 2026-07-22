# Session: LH2_First_Seasonal_Collection

| Field | Value |
|---|---|
| **Session ID** | `LH2_First_Seasonal_Collection` |
| **Programme** | Living Home First Experience (LH1 → LH2 → LH3) — Stage 2 |
| **Rollback ID (programme)** | `rollback/LH-living-home-first-experience-20260722` → `03a51d25` (annotated tag; created before any work) |
| **Start time** | 2026-07-22 |
| **Current stage** | Documentation → Waiting for User (committed; awaiting Home Owner walk-through) |

## Objective
Admit the **First Seasonal Collection** — five season-keyed Environmental Dressing objects — so the home turns quietly with the year: **spring flowers · subtle summer fruit · autumn small pumpkins + folded blanket · winter evergreens**. One morning, one house, zero animation, zero interaction, claim-free, no household inference. Each object already governed by architecture (LIVINGHOME2 § 5), admitted one at a time against LHDC1.

## Architecture Bootstrap conflict — the wreath (surfaced & resolved)
The brief's winter *"evergreen wreath"* collides with the canon: a **wreath is celebration dressing** (LIVINGHOME2 §5/§8/§7.2/ED9 — declared-and-permitted only, **Phase 5**), and Phase 5's mechanism (traditions domain + §7.2 permission) does not exist; §6 refuses any occasion marker shown without declaration. A wreath now would be an exception-by-instruction (HOMEOWNER1 forbids). **Resolved:** admitted the winter object as claim-free **winter evergreen foliage (not a wreath)**; the wreath is **deferred to Phase 5**. Recorded in `winter-evergreens.admission.md` §0.

## Design — one object per room per season
Added `onlyRooms` (per-object room allow-list) + `resolveRoomDressing` (at most ONE object per sill: season-specific wins over the year-round bowl of apples). Placements authored so no two objects contend for one room in one season:
- Spring/Summer/Winter: flowers / summer fruit / evergreens on all three browsing sills (Cookbook, Diary, Orchard).
- Autumn: apples (Cookbook), folded blanket (Diary), small pumpkins (Orchard) — real variety.
- Produce (apples, summer fruit, pumpkins) refused in Pantry/Larder (§5.1) + Nutrition (§17). No-view rooms + Home render nothing.

## Checkpoints
- [x] Runtime: `PlacementSpec.onlyRooms` + `resolveRoomDressing` (one-per-room, seasonal wins).
- [x] Authored 5 still SVG assets (matte, warm, Calm Orchard palette, one-morning light, wordless) — coherent one hand with the bowl.
- [x] Registered 5 items (season-keyed; onlyRooms/refusedRooms); recomputed all item checksums + register checksum (`359ea780…`) in the same commit.
- [x] Mouth: imported the 5 assets; renders one object per sill via `resolveRoomDressing`.
- [x] Verifier: D6 respects `onlyRooms`, verifies each item WINS a sill (no shadowed item) and no sill holds two season-specific objects. `verify:living-home-assets` 13/13 PASS.
- [x] Wrote 5 admission docs (LHDC1 §21 · §18 · §19 · §20 approval; winter §0 records the wreath resolution).
- [x] Updated the adoption `environmental-dressing` concern (LH1 → LH1/LH2); regenerated `.md`. `adoption:check` 103·0·9.
- [x] Wrote `docs/implementation/LH2_FIRST_SEASONAL_COLLECTION.md` (9 sections).
- [x] Verified: verify 13/13 · typecheck 88 pre-existing / 0 in touched files · build exit 0 (all 6 assets ship; 5 inlined as data URIs) · adoption 103·0·9.
- [x] Commit; record hash here + dashboard.

## Result
_Work commit: `__LH2_COMMIT__`._
Committed on `int1-intelligence-platform`. Five season-keyed objects render one-per-sill in the browsing rooms across the year; the wreath deferred to Phase 5; Stage 1's bowl of apples remains the year-round base. Claim-free, still, wordless, beneath words. No household data; no schema; no governing rule changed.

## Next action
**Home Owner walk-through** across the seasons, then **Stage 3 — LH3 (Living Home Review & Refinement)**: audit every room; improve composition, positioning, spacing, balance, restraint, craftsmanship, consistency, seasonal transitions, object hierarchy; prefer subtraction; verify the Living Home Constitution / Experience Constitution / Home Owner Architecture / LIVINGHOME2; verifier/build/typecheck; commit.

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
