# Living Home — Craftsmanship Phase 1

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — craftsmanship refinement (concept locked).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-craftsmanship-01-base` → `e1b38dc8`.
**Governing (frozen):** Model B, Spatial Blueprint, Working-Position + ownership model. No architecture change; refinement only.

## Craftsmanship improvements

### Priority 1 — Living Object believability (glass + placement)

- **Genuine glass, not a white object.** The jars' **empty upper glass** (the shoulders, above the contents) now fades so the **room shows through the glass** — timber and plaster read behind it — while the metal clip-top and the ingredient below stay solid. Achieved with a runtime alpha mask on the vessel; a whisper of warmth settles the glass into the room's palette. The four layers stay separated at runtime: **glass vessel** (masked image) · **ingredient** (below the mask) · **runtime label** (the shelf name-plate) · **contact shadow** (its own element).
  - *Honest limit:* the photoreal jar is one baked image, so glass and ingredient are not separable *assets*; the mask is the faithful approximation of "see-through vessel, solid contents." A fully layered vessel would need new assets — deferred, not faked, and **no jar was regenerated**.
- **Physically placed, not gridded.** Placement points re-tuned to **uneven spacing** with **slight per-jar size variety**, so six identical flour vessels read as an individual collection rather than a row; seated a touch deeper onto each board. Contact shadows retained.

### Priority 2 — Hospitality (permanent dressing corrected)

Arrival plate corrected by `images/edits` (everything else preserved — same room, camera, light):
- The **spindly / three-legged stool** is replaced with a **believable four-legged handcrafted oak stool** with a stretcher, sitting flat and stable on the stone floor.
- The **chopping board** now rests on the worktop leaning against the wall with its **top edge clearly below the lowest shelf** — no longer passing through it. No other clipping remains.

### Priorities 3–5 — preserved, not changed

Environmental continuity (room present at every Working Position; the immersive room from the prior turn), the Category multi-selection workspace, and the Living-Object/Companion ownership split are unchanged and intact.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.css` | glass: empty-shoulder alpha mask + warmth on `.lh-jar-static img` |
| `client/src/pages/living-home-room.tsx` | placement points re-tuned (uneven spacing, size variety, seated deeper) |
| `client/public/images/living-home/room/arrival.png` | promoted **arrival-v3** (stool + chopping-board correction) |
| `docs/asset-specs/ARRIVAL_PLATE_V3_CRAFT_SPEC.md` | new — correction edit spec |

## Before / after screenshots

- **Glass + placement (in-app):** `docs/implementation/craft-before/3-flours-workspace-desktop.png` (opaque white jars, even row) → `docs/implementation/craft-after/3-flours-workspace-desktop.png` (glass jars, room visible through the shoulders, hand-varied placement). Mobile pair alongside.
- **Stool + chopping board (plate):** `craft-after/arrival-plate-BEFORE.png` (spindly stool, board into the shelf) → `craft-after/arrival-plate-AFTER.png` (sturdy four-legged stool, board clear of the shelf).

*Capture caveat:* the fresh **in-app arrival** shot with the new plate was not re-captured — repeated capture runs re-tripped the no-password trial's rate limiter (sliding window). The arrival plate itself is verified directly (PNG above); the in-app arrival is that plate plus the "walk to the shelves" region.

## Regression checks

- App compiles; `/pantry` renders (glass jars, immersive room) with **no console errors**.
- Interaction unchanged: multi-selection workspace, single-object controls + Ask Apple, batch tray all still function (captured).
- **No data-model, navigation, ownership or architecture change.** Other rooms untouched.
- **OpenAI:** 1 plate edit ≈ **£0.19** (session total well under £5). No jar regenerated.
- Plates (arrival-v3) remain **candidates** pending Home-Owner visual acceptance.

## Remaining craftsmanship backlog

- Fully **layered glass vessel** (separate transparent-glass + contents assets) if the masked approximation is ever judged insufficient (would need new assets).
- Warmer, softer **engraved name-plates**; make the **selection tray** and **"Ask Apple"** feel less button-like (more in-room).
- Calm **motion easing** on "step closer".
- **Arrival → Shelves** continuity bridge.
- Fresh in-app **arrival capture** once the trial rate-limit clears.

## Validation

- More like somebody's home? **Yes** — glass jars in a warm, lived-in pantry; corrected honest furniture.
- Room still the focus? **Yes.** · Software quieter? **Yes** (glass reads as glass; no chrome). · Strengthens the concept? **Yes.**

## Definition of done — status

The concept is unchanged; every change made the room more handcrafted and believable (glass, placement, corrected dressing). Craftsmanship continues against the backlog above; Home-Owner acceptance of the refreshed plates remains the standing gate.
