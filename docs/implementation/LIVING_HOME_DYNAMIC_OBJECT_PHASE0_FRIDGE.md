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

---

## Phase 0B — Believability Integration Pass (2026-08-04)

**Rollback:** `rollback/living-fridge-believability-base` → `9af4b723`. **Same fridge, same platform, same interaction — only visual integration changed.**
The Phase-0 objects read as *PNGs placed over a photograph*. This pass makes them read as *photographed inside the fridge*.

### Improvements made
1. **Same fridge** — the empty plate is unchanged (the edit was already faithful); no appliance/cabinetry/proportions were regenerated.
2. **Environment Plate layering (BACK → OBJECTS → FRONT).** A **front occlusion layer** was introduced: the *same* empty-fridge plate, clipped to the **crisper drawer fronts** and drawn **above** the Living Objects. The salad and fruit now sit **inside** the frosted drawers (behind the fronts) instead of on top of them. *(The door-rack overlay was tried and removed — a full clear-rack overlay washes out light objects like milk; door racks are shallow and read fine without it.)*
3. **Relight.** Every object was regraded to the fridge's **warm top-light** with base darkening (ambient occlusion), so they no longer look like neutral studio product shots.
4. **Grounding.** Each object now carries a soft **contact-shadow seat** + a downward cast shadow — it rests on the shelf instead of floating.
5. **Milk re-extraction.** The clear glass milk bottle had been mis-cut (the background flood-fill leaked through the glass, leaving holes → ghostly). Re-extracted with a low threshold → a solid, clean bottle.
6. **Navigation recedes.** Inside a Working Position the Areas navigator **collapses to a small "Areas" tab** (reopens on tap/hover), so it never obscures the fridge.
7. **Canonical homes hold.** Objects live at fixed homes; when one is binned its **spot remains** (verified — milk and cheese removed cleanly, 18 → 17).

### Believability verification
- Interaction unchanged and intact: drag → Shopping / Companion / Bin; hover names; **objects still truly disappear** (re-verified live).
- Camera / lighting / craftsmanship / proportions: the plate is the original fridge.
- Evidence: `phase0b-fridge.png` (integrated) and `phase0b-before-after.png` (Phase 0 vs 0B side by side).

### Homeowner review (honest)
Far closer to *"my milk is in my fridge."* The **crisper drawers are convincing** — the veg and fruit genuinely sit inside them; the milk, juice and door condiments are solid and grounded; the shelf items rest with contact shadows; and nothing obscures the room. **Remaining honest imperfections** (candidates for a light polish, not blockers): the door condiments sit *in front of* their shallow racks (no front lip occlusion there); a couple of salad tops poke a little high; the middle-shelf items could cluster a touch more. Overall the "placed PNG" read is largely gone.

### Files changed (Phase 0B)
| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | `fridge` object variant; FRONT drawer-occlusion layer; Areas-navigator collapse (tab) inside Working Positions; minor placement tuning. |
| `client/src/pages/living-home-room.css` | `.lh-obj--fridge` grounding + seat shadow; `.lh-front*` clipped occlusion layers; `.lh-areas-tab` collapsed navigator. |
| `client/src/assets/.../fridge/*.png` | 18 objects relit (warm top-light + AO); milk re-extracted solid. Raw pre-relight copies kept in `artifacts/fridge-objects-raw/`. |

---

## Phase 0B (Final) — Door occlusion, clustering & Canonical Asset Capture (2026-08-04)

**Rollback:** `rollback/living-fridge-believability-base` → `9af4b723`. **Same fridge, same platform, same interaction — integration only.**

### Production improvements (this pass)
1. **Environment Plate layering completed (BACK → OBJECTS → FRONT).** The FRONT layer now includes **both the crisper drawer fronts *and* the four door-rack front walls** (masked to just the bin bands, so a bottle's base tucks into its rack while its body pokes above). Milk & juice now sit **inside** the left door bins; ketchup, mustard, mayonnaise and **pickles (lowest rack)** each sit **inside** a right-door bin. The "on the door" read is gone.
2. **Natural arrangement.** Objects are clustered — **butter beside cheese**, leftovers beside yoghurt, one condiment per door bin, drawers filled — instead of isolated product spacing. The fridge reads *lived-in*.
3. **Canonical homes respected.** Milk always in its door bin, butter beside cheese, pickles in the lower rack; when an object is binned its **home remains** (verified).
4. **Relit masters (not runtime rescue).** The 18 object masters were regraded to the fridge's **warm top-light with base ambient occlusion at the master level**; runtime does only contact-shadow + drawer/rack occlusion.
5. **Navigation recedes** to a small "Areas" tab inside the Working Position.

### Environment Plate layering (summary)
`.lh-plate--fridge-empty` (BACK) · independent `LivingObject`s (MIDDLE) · `.lh-front--fridge-drawers` + `.lh-front--fridge-doorL/R` (FRONT, the same plate clipped/masked to the foreground furniture). Objects are always sandwiched between.

### Canonical Asset Capture (applied + adopted)
Phase-0 objects were studio product shots **relit at the master level** to the fridge's light — a retroactive application of the new **Canonical Asset Capture** principle (`LIVING_HOME_PHASE0_BELIEVABILITY_REVIEW.md`). Every **future** Living Object is authored under its plate's canonical camera & lighting so runtime is *refinement, not rescue*.

### Living Object Acceptance Test (applied)
Each object was judged against: *mistaken for the original photo? · occupies its canonical home? · shares the plate's camera/lighting/perspective? · needs only subtle grounding?* The door bottles, drawer produce and shelf dairy pass; the two areas still improvable are noted below (not blockers).

### Homeowner review (honest)
Standing at the fridge: milk & juice are **in the door**, the condiments are **in their racks**, the salad & fruit are **in the frosted drawers**, dairy rests on the shelves with contact shadows, and nothing obscures the room. The answer to *"would I believe these were photographed in this fridge?"* is now **close to an immediate yes** for the doors and drawers. **Remaining light-polish** (candidates, not blockers): the mid-shelf dairy is the least "seated" (open shelf, no front lip to tuck behind); a couple of salad tops sit near the drawer front edge. Recommend a small follow-up only if desired.

### Before / after
`docs/implementation/pantry-final-evidence/phase0b-before-after.png` — Phase 0 (objects over the photo) vs Phase 0B (objects inside the fridge). Latest: `phase0b-fridge.png`.

**STOP — believability pass complete; the Fridge is the production benchmark for every future Working Position. Commit/push done. Awaiting Home Owner approval before Phase 1 (Fruit / Bread / Cupboards / Tea & Coffee).**
