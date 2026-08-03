# Living Home — Residency 01

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — residency refinement (concept & composition locked).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-residency-01-base` → `e1b38dc8`.
**Governing (frozen):** Model B, Spatial Blueprint, Working-Position + ownership model, canonical Environment-Plate composition. No composition or concept change.

## Residency improvements

The room already said *someone bakes and cooks here* (ceramic bowl, chopping board, vintage scales, folded linen, willow baskets, oak stool). This pass adds the two missing chapters of the household's story — **grows** and **ferments** — plus one quiet mark of everyday cooking, all as **permanent** dressing baked into the Arrival plate. Restraint over decoration: three purposeful objects, breathing room, nothing to fill space.

Added (via `images/edits` on the approved plate; canonical composition untouched):

1. **Growing microgreens** — a small wooden seed tray of fresh green shoots on the worktop **by the window**, in the daylight. Reads as alive and cared for: growth, freshness, care.
2. **A handcrafted kombucha ferment** — a large glass jar of amber tea with a visible SCOBY and a **cloth cover tied at the neck**, on the worktop. Homely and traditional — not a commercial bottle.
3. **One well-used favourite cookbook** — a worn cloth-bound book standing at the end of the worktop: *someone cooks here often.*

Preserved exactly (not moved, resized or restyled): fridge-freezer, the three shelves, worktop, cabinetry, drawers, the four-legged stool, window, willow baskets, ceramic bowl, chopping board, vintage scales, folded linen, stone floor, **camera and light**.

**Hospitality test — all YES:** each object naturally belongs, a real household would own it, it strengthens hospitality, it quietly supports healthy living (home-grown greens, live-culture ferment, real cooking), and it makes the room calmer and more lived-in.

## Living Objects (jars) — one small refinement

Per the brief's "physical weight," the jar **contact shadow** was tightened to a firmer, quicker-falloff core so each vessel reads as having weight where it meets the timber. Glass realism and hand-varied placement from Craftsmanship Phase 1 are retained; **no jar regenerated**, no interaction change.

## Files changed

| File | Change |
|---|---|
| `client/public/images/living-home/room/arrival.png` | promoted **arrival-v4** (microgreens + kombucha + cookbook) |
| `client/src/pages/living-home-room.css` | firmer jar contact shadow (physical weight) |
| `docs/asset-specs/ARRIVAL_PLATE_V4_RESIDENCY_SPEC.md` | new — residency dressing edit spec |

## Before / after screenshots

- **Residency (Arrival plate):** `docs/implementation/residency-after/arrival-BEFORE-residency.png` (baked/cooked evidence only) → `…/arrival-AFTER-residency.png` (now also grows + ferments + a favourite cookbook). The plate is the Arrival Working Position; in-app it is this plate plus the "walk to the shelves" region.
- Glass/placement (in-app) from Craftsmanship Phase 1 is unchanged and remains in `docs/implementation/craft-after/`.

*Capture caveat (again):* the no-password trial endpoint (`/api/demo/start`) is still inside its sliding-window rate limit from earlier capture runs, so a fresh in-app arrival shot was not taken. The Arrival plate is verified directly (above); the residency dressing is fully visible there.

## Regression checks

- Residency is a **plate swap** + one CSS shadow value — no logic, navigation, ownership or interaction change.
- App renders `/pantry` with no console errors (verified previously; only a static asset and one shadow value changed).
- **OpenAI:** 1 plate edit ≈ **£0.19** (session total well under £5). No jar or room regenerated.
- Plates (arrival-v4) remain **candidates** pending Home-Owner visual acceptance.

## Remaining residency opportunities

- Optional, restrained future touches only if a room ever feels bare: a wooden pepper mill, a ceramic flour crock, or a tea towel over a rail — added **only with a reason**, never to fill space.
- Environmental continuity: a small residency echo could later appear on the close **shelf** working surface, if desired (it currently keeps its own dressing).
- Fresh **in-app** captures once the trial rate-limit clears.

## Definition of done — status

The room now quietly tells the story of a family that **cooks, bakes, grows and ferments** real food — evidence of care, not decoration. The composition and concept are unchanged; the technology continues to recede. Home-Owner acceptance of the refreshed Arrival plate is the standing gate.
