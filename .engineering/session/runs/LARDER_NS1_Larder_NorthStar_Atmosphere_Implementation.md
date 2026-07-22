# Session: LARDER_NS1_Larder_NorthStar_Atmosphere_Implementation

| Field | Value |
|---|---|
| **Session ID** | `LARDER_NS1_Larder_NorthStar_Atmosphere_Implementation` |
| **Rollback ID** | `rollback/LARDER-northstar-impl-20260722` → `dedb5396` (annotated tag) |
| **Start time** | 2026-07-22T00:00:00Z UTC |
| **Current stage** | Implementation |

## Objective
Implement the THA Larder using the approved North Star atmosphere image, preserving the
existing THA architecture. Capture the *feeling* (warmth, hospitality, orchard-through-window)
through owned mechanisms; do NOT copy the image literally (no side nav, no Companion pill, no
environmental dressing, no stock-state).

## Governing constraint found (Architecture Bootstrap)
The image is a per-room DRESSED ENVIRONMENT. `LIVINGHOME1` § 4 refuses per-room environments
(governed Blueprint amendment + canonical assets only, never by taste); § 5.2 refuses anything
visible with empty data (dressing the house). `LIVINGHOME2` makes Environmental Dressing
DECLARED-NOT-BUILT and bans produce dressing in the Pantry room. → The literal image cannot ship
without an owner Blueprint amendment. The brief pre-authorises the lawful path ("preserve
architecture, capture atmosphere"). Atmosphere captured via OWNED mechanisms only.

## Files being modified
- `client/src/components/nav-bar.tsx` — NAV_ITEMS label "Pantry" → "Larder" (single owner).
- `client/src/components/layout/app-shell.tsx` — ROOM_PURPOSE "/pantry" → North Star voice.
- `client/src/pages/pantry-page.tsx` — resolve room/tab collision (Larder tab → "Cupboard"),
  in-body labels "In Pantry" → "In Larder".
- `docs/implementation/LARDER_NORTHSTAR_IMPLEMENTATION.md` — report.

## Checkpoints
- [x] git status; rollback tag; read README + LARDER1 + LIVINGHOME1 + HOMEOWNER1.
- [x] View reference image; map current Larder code + owned atmosphere mechanisms.
- [x] Make lawful edits (rename + purpose + collision fix + household-facing consistency). 9 files.
- [x] Verify: client typecheck 0 errors (88 server pre-existing); build exit 0; adoption 100·0·9 (baseline).
- [ ] Write report `docs/implementation/LARDER_NORTHSTAR_IMPLEMENTATION.md`.
- [ ] Commit + push.

**Last checkpoint:** All edits applied and verified (typecheck/build/adoption). Room renamed
Pantry→Larder at NAV_ITEMS (one owner), threshold voice warmed, Larder tab→Cupboard collision
resolved, household-facing labels consistent. Dressing/side-nav/Companion-pill/stock deliberately
NOT built (governance + brief).

## Next action
Write the report, commit all work, push to origin.

## Blockers
none — literal-image conflict surfaced and handled via the brief's pre-authorised lawful path.
