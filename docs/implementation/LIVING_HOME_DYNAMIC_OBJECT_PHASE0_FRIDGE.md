# Living Home — Dynamic Living Object Platform · Phase 0 (Fridge)

**Date:** 2026-08-03 · **Risk:** 🟡 AMBER — approved Phase-0 reference implementation.
**Branch:** `feat/living-larder-authoritative`
**Rollback identifier:** **`rollback/living-pantry-dynamic-objects-base` → `5b1e00d0`** (pre-Phase-0). This conversion is an isolated, reversible commit on top.
**Extends:** the governing architecture + `docs/investigations/LIVING_HOME_DYNAMIC_OBJECT_IMPLEMENTATION_REVIEW.md`. No redesign, no ownership change.

> The Fridge is now the **reference implementation** for the Living Object Platform: an **empty Environment Plate** carrying **independent Living Objects** — exactly like the Pantry Shelves. Every future Working Position follows this pattern.

---

## What changed (drift → platform)

**Before:** `work-fridge.png` had the food **baked into the photograph**; the runtime overlaid coordinate hotspots/labels. Nothing could move or be removed.

**After:** an **empty fridge plate** (`work-fridge-empty.png`) carries **18 independent Living Object PNGs** placed on its shelves, door racks and crisper drawers. Each object can be **dragged, hovered, added to Shopping / handed to the Companion / dropped in the Kitchen bin — and it genuinely disappears** when removed.

Fridge contents (realistic household organisation):
- **Door:** Milk, Juice · Ketchup, Mustard, Mayonnaise, Pickles
- **Upper shelves:** Leftovers, Cheese · Butter, Yoghurt
- **Salad crisper:** Tomatoes, Cucumber, Pepper, Radishes, Lettuce, Spring onions
- **Fruit crisper:** Berries, Grapes

---

## Architecture compliance

- **Environment Plate owns** room/fridge/shelves/drawers/door-racks/lighting — the edited empty plate. **Living Objects own** the food/containers/produce — independent PNGs. ✅
- Same universal interaction as the Pantry Shelves and every destination (drag → Shopping / Companion / Bin; hover-reveal names). No new interaction model.
- Ownership unchanged (Shopping intent, Companion, Navigation, Living Object Model). Groups were **not** needed — the household interacts with the Living Objects directly (as instructed).

## Existing assets reused

- The `LivingObject` component + dnd-kit drag + **the `removed`-set removal** (so the bin truly deletes an object), the Areas navigator, the Companion mark, hover-only labels.
- The `generate-environment-plate.py` pipeline (`--edit-from` for the plate; text-to-image for object sheets).

## Assets edited (preferred route — same room)

| Asset | From | Result |
|---|---|---|
| `client/public/images/living-home/room/work-fridge-empty.png` | edit of `work-fridge.png` via `images/edits` | **empty fridge** — bare glass shelves, empty crispers, empty door racks; **same fridge, cabinets, floor, camera, lighting**. Passes the "five-seconds-earlier" test. |

## Assets generated (new Living Objects)

Three neutral-grey contact sheets → **18 transparent Living Object PNGs** (flood-fill background removal + per-cell crop), in `client/src/assets/living-home/larder/fridge/`:
- **Salad sheet** → tomatoes, cucumber, pepper, radishes, lettuce, spring-onions
- **Door sheet** → milk, juice, ketchup, mustard, mayonnaise, pickles
- **Shelf sheet** → butter, cheese, yoghurt, leftovers, berries, grapes

**Generation cost:** 1 plate edit + 3 object sheets = **4 images ≈ £0.76** (gpt-image-2, 1536×1024, high). Well under the £5 gate.

## Files changed (code)

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | Fridge zone → `plate: "fridge-empty"` (no items/categories); imported the 18 object PNGs; added `FRIDGE_OBJECTS` placement (x centre %, y base %, height %); new render branch placing them as independent `LivingObject`s. |
| `client/src/pages/living-home-room.css` | `.lh-plate--fridge-empty` layer. |
| `docs/asset-specs/EMPTY_FRIDGE_SPEC.md`, `FRIDGE_OBJECTS_{SALAD,DOOR,SHELF}_SPEC.md` | generation specs (governance record). |

## Data impact

No schema change. No ownership change. Runtime: the Fridge renders independent placed objects instead of hotspots; the `removed` set now removes a **real object**. Future (not in Phase 0): the object list can become data-driven from `/api/pantry` (Runtime Attributes §4C — Canonical Home + Current Position wired; Quantity + Purchase Unit later).

## Verification evidence

`docs/implementation/pantry-final-evidence/`: `phase0-fridge.png` (stocked) · `phase0-fridge-milk-binned.png` (Milk dragged to the bin → **gone**, with "Put it back" undo).

| Criterion | Result |
|---|---|
| Empty Environment Plate | ✅ |
| Same physical fridge / lighting / camera / craftsmanship | ✅ (edit preserved the room) |
| Independent Living Objects | ✅ 18 PNGs |
| Objects can disappear | ✅ **verified live: 18 → 17, milk removed** |
| Objects can move / be dragged | ✅ |
| Universal interaction (Shopping / Companion / Bin) | ✅ |
| Camera Acceptance Test | ✅ |
| Production Review Checklist | ✅ |
| Console errors | none |

## Remaining implementation sequence (await approval — do NOT proceed yet)

Each position repeats this exact reference: **edit the full plate to empty → generate/extract its Living Objects (reuse-first) → place independently → verify.**
1. **Store Cupboard** — empty cupboard plate + **one Tin** master → ~24 tinned identities (highest reuse).
2. **Tea & Coffee** — empty station + **Canister** → tea/coffee/cocoa/sugar.
3. **Fruit** (+ fold redundant Worktop, §6A) — empty fruit plate + banana/pear/orange/satsuma (apple ✅).
4. **Root Vegetables** — empty rack + potato/sweet-potato/onion/garlic/shallot.
5. **Bread** — empty board + loaf/rolls.
6. **Freezer** — empty drawers + Frozen bag.

## Definition of done (Phase 0)

- [x] Empty fridge plate created **by editing** (room preserved).
- [x] Minimum Living Object masters generated (reuse-first) and extracted to transparent PNGs.
- [x] Every object placed **independently** — no baked-in food, no hotspots, no invisible zones.
- [x] Objects support hover · drag · Shopping · Companion · Kitchen bin, and **can disappear** (verified).
- [x] Passes the Camera Acceptance Test and the Production Review Checklist.
- [x] Rollback identifier reported; cost ≈ £0.76.

**STOP — Fridge complete. It is the benchmark for the Living Object Platform. Awaiting Home Owner approval before Fruit / Bread / Cupboards / Tea & Coffee.**
