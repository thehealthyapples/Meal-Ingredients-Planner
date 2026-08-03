# Living Home — Orientation Environment Implementation

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — clarification of the Arrival Position (not a redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-orientation-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model. Runtime Architecture unchanged.

## The clarification, implemented

The **Arrival Position** is the **Orientation Environment**: its open shelves now read as a *naturally-stocked* pantry so, on entering, the household immediately understands **where each kind of food lives** — without interacting. These shelf items are **representative dressing baked into the Environment Plate** — *not* Living Objects, *not* household inventory, *not* interactive. The actual inventory (truth) still appears only when the household walks closer to a category.

### What changed — the Arrival plate is stocked

Refined by `images/edits` on the approved plate (canonical composition, fridge/freezer, window, cabinetry, camera, light and worktop dressing all untouched):

- **Upper shelf** — clip-top glass jars of flours, grains, rice and pasta (*grains & flours live here*).
- **Middle shelf** — clip-top jars of pulses & beans, with a potted herb at one end (*pulses & herbs here*).
- **Lower shelf** — tea caddies, dark-glass oil bottles, and jars of dried fruit & nuts (*teas, oils, dried fruit here*).
- **Willow baskets** — now hold fresh **apples and pears** (*fruit lives here*).
- Cupboards and the American-style fridge/freezer remain **closed**.

Stocked **comfortably, with natural gaps** — a real working family's pantry, quietly used; not packed, not styled, not cluttered. Jars carry **no printed labels or branding** (representative, never inventory).

## Evidence: Orientation Dressing and Living Objects remain separate

| | Orientation dressing (Arrival) | Living Objects (Working Positions) |
|---|---|---|
| **What** | jars/tins/bottles/caddies **painted into the Environment Plate** | React components (`SelectStation` / `NavStation`) |
| **Source** | the plate image (`arrival.png`) | the category data (Domain 30 in production) |
| **Interactive?** | **No** — pixels; the arrival level renders **no** Living Object and no name-plate, only the plate + one "walk to the shelves" approach region | **Yes** — selectable, multi-select, add-to-shopping, remove |
| **Owns inventory?** | **No** (representative identity only) | **Yes** (the sole owner of inventory/quantities/actions) |

Verified in code: at `level === "arrival"` the component renders only `<div className="lh-plate…">` + the approach hotspot + a caption — **zero** `SelectStation`/`NavStation`/`lh-jar` nodes. Interactive Living Objects appear only at `shelves`/`category`. The two never overlap.

- **Before → after (Arrival plate = the arrival level):** `orientation-evidence/arrival-BEFORE-empty-shelves.png` (empty shelves) → `…/arrival-AFTER-orientation-stocked.png` (naturally stocked; fruit in baskets).
- **Separation:** `orientation-evidence/working-position-living-objects.png` — the same shelving at a Working Position, now bare of representative dressing and carrying **interactive** Living Object jars + readable runtime name-plates.

## Files changed

| File | Change |
|---|---|
| `client/public/images/living-home/room/arrival.png` | promoted **arrival-v5** (shelves stocked, baskets filled) |
| `docs/asset-specs/ARRIVAL_PLATE_V5_ORIENTATION_SPEC.md` | new — orientation stocking edit spec |

**No runtime code changed** — the Orientation/Living-Object separation was already structural (arrival renders no interactive objects). This pass is dressing only.

## Regression checks

- No architecture, navigation, ownership, Working-Position or interaction change. The Working Positions still own interaction; Living Objects still own inventory; the Companion still owns knowledge.
- `/pantry` renders with no console errors (only a static asset changed).
- The **working shelf plate stays empty**, so Living Objects still seat on bare timber (continuity preserved on approach).
- **OpenAI:** 1 plate edit ≈ **£0.19** (session total well under £5). No room re-composed; no jar regenerated.
- Plate (arrival-v5) remains a **candidate** pending Home-Owner visual acceptance.

## Success criteria

- On entering, the room reads as a **real, naturally-stocked pantry** — "I know where everything is" — before any interaction.
- Interaction with actual household items begins only after choosing a destination (a Working Position).
- The room feels like a pantry first, software second.

*Capture note:* the fresh **in-app** arrival shot was not re-taken (the no-password trial endpoint is still inside its sliding-window rate limit from earlier capture runs). The Arrival plate is verified directly and **is** what the arrival level displays (plate + approach region, no objects).

## Remaining opportunities

- Approaching the **fridge/freezer/cupboards/fruit** from Arrival (their locations now read clearly) awaits their own Working-Position plates — future, not this pass.
- Fresh **in-app** captures once the trial rate-limit clears.

## Definition of done — status

The Arrival Position now feels naturally stocked and welcoming and communicates location and identity; Working Positions continue to own interaction; Living Objects continue to own inventory; the Companion continues to own knowledge; the approved architecture is unchanged.
