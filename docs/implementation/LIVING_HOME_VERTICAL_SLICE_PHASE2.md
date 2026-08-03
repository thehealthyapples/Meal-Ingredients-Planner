# Living Home — Vertical Slice, Phase 2 (Implementation & Refinement)

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — Environment Plate refinement and Living Home implementation.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-vertical-slice-phase2-base` → `e1b38dc8`.
**Governing:** `LIVING_HOME_SPATIAL_BLUEPRINT.md` (Model B), LARDER1/2/3, ASSET1, D-017/D-018.

## Summary

The Living Larder is now the running Living Home reference implementation. The **Arrival Environment Plate** was refined (integrated American-style fridge-freezer, permanent dressing, engraved timber shelf plaques) and the **Living Object interaction model** is proven on the **Shelf Plate** with five existing production jars — hover, lift, drag, return, and drop-target highlighting. Shopping/Bin are deliberately **not** implemented (Phase-1 scope proves the interaction model only). No new jar assets were generated.

## Environment Plate refinements

Refined by **`images/edits`** on the approved v1 Arrival plate (camera/composition/light preserved — no regeneration), gpt-image-2 1536×1024 high:

- **Integrated American-style fridge-freezer** on the left wall — wide French-door refrigerator over a lower freezer drawer section, **warm oak furniture panels + aged-brass bar handles**, built flush into the cabinetry. Reads as handcrafted joinery, never commercial stainless steel. (A permanent Living Home object; *click-to-open → interior plate* is a future interaction, not this phase.)
- **Preserved** exactly: camera, composition, light direction (right-hand daylight, shadows down-left), window, worktops, cupboards, baskets, shelf proportions.
- **Permanent dressing** (non-food, non-interactive): wooden chopping board, ceramic mixing bowl, vintage kitchen scales, wooden stool, folded linen towel.
- **Engraved timber shelf plaques** mounted on each shelf's front edge — permanent furniture. (Legible category wording is a future crisp **runtime** layer; image models cannot render reliable text, so the plate carries the handcrafted timber form only — consistent with Model B's "labels are runtime text.")

Specs: `docs/asset-specs/ARRIVAL_PLATE_GENERATION_SPEC.md`, `…/SHELF_PLATE_GENERATION_SPEC.md`, `…/ARRIVAL_PLATE_V2_REFINEMENT_SPEC.md`.
Candidates + checksummed metadata: `artifacts/living-home-environment-plates/{arrival,shelf,arrival-v2}/`.
Promoted to runtime: `client/public/images/living-home/room/{arrival,shelf}.png`.

**OpenAI cost (this phase):** 1 edit × 5,488 output tokens ≈ **$0.24 (~£0.19)**. Session total ≈ **£0.54** — within the £5 gate. Search-first confirmed no reusable fridge/plate asset existed.

## Runtime implementation

New route `/pantry → LivingHomeRoom` (`client/src/pages/living-home-room.tsx`). Two **working positions**, no page flip between them (crossfade):

- **Arrival** — the refined plate as a still stage; an **invisible interaction region** over the real shelving ("Walk to the shelves"). No products, no floating cards.
- **Shelves** — the Shelf plate; five **existing approved jars** (`rolled-oats, plain-flour, white-rice, sugar, chia-seeds`) as Living Objects:
  - **Seated on the timber** — each jar's *measured content-base* (84.4% for large jars, 72.5% for chia) is placed on the board surface, so jars rest on the wood rather than floating on transparent padding. No scaling tricks; jar sizes are their natural proportions.
  - **Contact shadows** — a grounded elliptical shadow per jar, plus the jar's own soft form shadow; the shadow stays down and softens as the jar lifts.
  - **Runtime names** — rendered crisply on each jar's own chalk plate (never baked into the image).
  - **Interactions (dnd-kit):** **hover/focus → lift**; **drag** (pointer + touch, with keyboard drag support from dnd-kit); **drop-target highlighting** — the shelf boards glow while a jar is in hand; **return** — a jar dropped off any board animates back to where it was.
  - **Not implemented (by design):** Shopping, Bin.

The room holds still; only the jars move. Reduced-motion disables the animations.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | **new** — the room, two working positions, Living Object proof |
| `client/src/pages/living-home-room.css` | **new** — stage, crossfade, jars, contact shadows, board highlight |
| `client/src/App.tsx` | `/pantry` now renders `LivingHomeRoom` (lazy) |
| `client/public/images/living-home/room/arrival.png` | **new** — promoted refined Arrival plate |
| `client/public/images/living-home/room/shelf.png` | **new** — promoted Shelf plate |
| `scripts/generate-environment-plate.py` | **new/updated** — governed plate generation + `--edit-from` refine mode |
| `scripts/capture-living-home-phase2.ts` | **new** — Playwright evidence capture (no-password trial) |
| `docs/asset-specs/*.md` | **new** — Arrival/Shelf/Arrival-v2 generation specs |
| `docs/implementation/phase2-evidence/*.png` | **new** — screenshot evidence |

(Prior uncommitted files from earlier phases — `larder-bundles.ts`, `larder-category-view.tsx`, brass-plaque room, server listen fix — remain untouched; the brass-plaque room is superseded per the Spatial Blueprint.)

## Evidence (desktop + mobile)

`docs/implementation/phase2-evidence/`:
- **Desktop** — `arrival-desktop.png` (fridge-freezer, plaques, dressing), `shelves-desktop.png` (5 jars seated), `shelves-hover-lift-desktop.png` (lift), `shelves-drag-desktop.png` (**mid-drag: lifted jar + board glow highlight**), `shelves-after-drop-desktop.png`.
- **Mobile (390×844)** — `arrival-mobile.png`, `shelves-mobile.png` (whole room + 5 jars).

Captured headlessly via the app's own instant-access trial (`POST /api/demo/start`) — no credentials handled.

## Regression checks

- **Build/runtime:** app compiles; **no console errors** on `/pantry` (verified in-browser).
- **Routing:** `/pantry` → Living Home room; `/pantry/:group` and all other routes unchanged; bottom-nav primary navigation intact (NAV1).
- **Auth:** `ProtectedRoute` still gates `/pantry` (reached only after sign-in/trial).
- **No data writes:** this phase performs **no** Domain-30/15 mutations (no Shopping/Bin), so pantry/shopping state is untouched.
- **Assets:** no jar asset created or modified; only two Stage plates added under `public/`.

## Remaining gaps before Home Owner review

1. **Plate visual acceptance** — the Arrival v2 and Shelf plates are **candidates**; they need Home-Owner sign-off to become checksum-locked House-Register assets (ASSET1/LHDC1).
2. **Legible shelf-plaque names** — the engraved plaque *forms* are baked; crisp category **names** (Grains & Flour, Tea & Coffee…) as a runtime engraved-text layer are a next step.
3. **Levels 3–4** — Category drill-down and the full Living Object action set (incl. Shopping/Bin, nutrition/recipes/usage) are later phases.
4. **Arrival interactions** — only the shelves region is wired; fridge/freezer/cupboards/baskets **click-to-open** (each → its own interior plate) are future.
5. **Immersion polish** — the room sits within the app shell (header banner + bottom nav); a more full-bleed room mode and a mobile-specific closer framing are candidate refinements.
6. **Anchor tuning** — jar %-anchors and board surfaces are eye-tuned to the current plate; worth a fine pass.

## Placement refinement (2026-08-02) — physical believability

Rollback: `rollback/living-object-placement-refine-base` → `e1b38dc8`. Environment Plate untouched; only Living Object placement changed.

- **Canonical placement points** — each shelf owns points fixing `x, y, scale, depth, shadowW`; jars are seated onto points, never arbitrary CSS offsets. The point is the **lift/hover origin** (`transform-origin: 50% 100%`), so a jar rises straight off the spot it touches and **returns to exactly the same point** (drop off any shelf → return; drop on a shelf → snap to the nearest point, swapping the occupant).
- **Shelf contact** — each jar's measured content-base sits on the timber line; a grounded elliptical **contact shadow** (offset slightly left, since the light is from the right) sits *beneath* the vessel and only spreads/softens as the jar lifts — it never floats or sinks.
- **Perspective** — per-point `scale` gives slight size falloff (further shelf and the receding right side render a touch smaller); scaling is never uniform.
- **Natural composition** — uneven point spacing and small scale variation read as hand-placed, not a grid.
- **Layer order** — Plate → Contact Shadow (z1) → Glass Vessel + baked Ingredient (z2) → Runtime Label → Hover, so the vessel always sits above its own shadow, inside the room.
- **Animation** — hover = **2–4px lift + softer shadow, no scale, no bounce**; drag lifts from the point; return settles onto the same point. Reduced-motion disables it.

Evidence re-captured (`phase2-evidence/`): jars now convince at rest; movement strengthens the illusion rather than creating it.

## Definition of done — status

- ✅ Arrival Plate visually complete (fridge-freezer, dressing, shelf plaques).
- ✅ Integrated American-style fridge-freezer implemented (oak-panel/brass, not steel).
- ✅ Permanent shelf plaques are part of the furniture.
- ✅ Five existing Living Objects behave naturally on the Shelf Plate (seated, shadows, hover/lift/drag/return/drop-highlight).
- ✅ No new jar assets generated.
- ✅ The Living Larder now reads as a real handcrafted room, not a web interface.
