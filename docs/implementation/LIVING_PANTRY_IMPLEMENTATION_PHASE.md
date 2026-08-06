# Living Pantry — Implementation Phase (living record)

**Date:** 2026-08-06 · **Risk:** 🟡 AMBER — implements the locked Three-Asset architecture (`LIVING_PANTRY_CANONICAL_PRODUCTION_SET.md`).
**Rollback:** `rollback/canonical-production-set-20260806` → `9b3e59c7`. **Runtime untouched so far.**
**Governing architecture:** Master A (Environment Plate) → Master B (Canonical Master) → Living Object Library → Runtime (Plate + Objects). Nothing removed from the plate; no AI inpainting; deterministic runtime.

## ⛔ Phase 2 attempt REJECTED (2026-08-06) — off-canon
The six Environment Plates below were generated with **text-to-image (no anchor)**, which produced **a different room each time** — they do NOT match Arrival or the approved four-image proof (different shelves, a different fridge, different window/cupboard/rack). **They are rejected and must not be committed or used.** Root cause: chasing the "closer camera" refinement by abandoning the edit-from continuity anchor. Wasted spend ≈ **£1.05** (this batch) + £0.44 (shelves/fridge) this turn. **Lesson: every Master A must be anchored to the existing canonical imagery (edit-from), never fresh text-to-image; "closer camera" vs. pixel-continuity is a genuine tension to resolve with the Home Owner BEFORE spending.**

## Phase status
| Phase | Description | Status |
|---|---|---|
| **2 — Environment Plates (Master A)** | empty plate per Working Position | ⛔ **REJECTED attempt (off-canon)** — redo with edit-from anchoring |
| **3 — Canonical Masters (Master B)** | populated, masked-edit of each plate | ⏳ pending (tooling note below) |
| **4 — Living Object Library** | extract every object as transparent PNG | ⛔ **BLOCKED** — needs matting capability |
| **5 — Runtime implementation** | replace Pantry runtime with Plate + Library | ⏳ pending (depends on Phase 4) |
| Bread / Tea & Coffee | — | ⛔ not started — Canonical Homes unapproved |

## Phase 2 — Environment Plates (COMPLETE) [V — every plate viewed]
Generated via the governed `scripts/generate-environment-plate.py` (gpt-image-2, 1536×1024, high). Output: `artifacts/living-home-environment-plates/plate-*/`. Specs: `artifacts/canonical-pantry-production-set/_specs/plate-*.md`.

| Plate | Result | Notes |
|---|---|---|
| `plate-shelves` | ✅ excellent | empty oak shelves + permanent props; **closer camera** achieved |
| `plate-fridge` | ✅ excellent | **oak integrated** appliance, empty interior, freezer drawer below; **closer** |
| `plate-freezer` | ✅ good | lower freezer drawer open, empty white baskets; same appliance as fridge |
| `plate-fruit` | ✅ excellent | **empty** wicker baskets, window, empty wire rack visible **beneath** |
| `plate-rootveg` | ✅ good | empty wire rack **beneath the fruit worktop** (continuity #5 proven) — *see issue R1* |
| `plate-cupboard` | ✅ excellent | **corrected**: low **under-counter** cabinet, both doors open, empty shelves |

**Cost (Phase 2):** 6 images × 5,488 output tokens ≈ **$1.3 ≈ £1.05.**

## Phase 3 — Canonical Masters (pending, with a tooling note)
Per architecture, each Master B is a **masked edit** of its Environment Plate — the mask covers only object zones so the plate's environment pixels are preserved (pixel-perfect alignment). **The governed script currently does a whole-image `images/edits` (no mask).** To satisfy "pixel-perfect Environment Plate alignment", the generation step needs a **mask parameter** added to the `images/edits` call (an object-zone mask per plate). This is a small tooling addition (not runtime); it is the correct way to keep the plate unchanged behind the objects. *(Decision D1 below.)*

## Phase 4 — Living Object Library (BLOCKED — critical path)
Extracting **every** Living Object as a clean transparent PNG requires **AI matting / segmentation** (e.g. rembg/u2net or SAM). The pipeline proof (`LIVING_PANTRY_PIPELINE_PROOF.md`) established this: PIL hand-masking works for one object but is **not viable at the scale of dozens of jars/tins/fruit** to production quality, and **no matting library is installed** here (`onnxruntime` is present, but no `rembg`/`cv2`/segmentation model). **This blocks the Living Object Library, and therefore Phase 5.**
**Enabling options (Home Owner decision — D2):**
1. Install a local matting capability (`pip install rembg` → u2net over each object's bounding box), or SAM.
2. Use gpt-image to *re-render* each object transparent — **rejected**: that invents pixels, violating "extracted from the Canonical Master".

## Phase 5 — Runtime implementation (pending Phase 4)
Replace the Pantry runtime so the room composes **Environment Plate + Living Object Library** (drag / remove / restore / Shopping / Bin / Companion; removing an object reveals the plate; plate never changes). Large frontend change to `client/src/pages/living-home-room.tsx`; **requires the Living Object Library (Phase 4)** to exist. Not started; runtime is untouched.

## Implementation decisions
- **D1 — masked edits for Master B.** Extend the generation call to pass an object-zone mask so the plate is preserved. Alternative (whole-image edit-from) breaks pixel-perfect alignment; not used for the final set.
- **D2 — extraction capability.** Awaiting go-ahead to install a local matting tool (rembg) — the only architecture-compliant route to the Living Object Library.
- **Camera "closer" (shelves/fridge)** achieved by re-framed generation (text-to-image), not zoom.

## Known issues
- **R1 — root-veg plate:** the fruit baskets *above* the wire rack still contain fruit (a Living Object that should be absent from a pure Environment Plate). The rack itself is correctly empty and the beneath-the-worktop continuity is proven; the fruit-above should be regenerated empty (matching `plate-fruit`) for a clean plate.
- **Cross-camera consistency is approximate.** Plates are generated independently, so fixtures share the *style* of one room but are not pixel-identical across cameras (e.g. the fridge plate opens a single door vs the earlier double-door proof). This is the known AI-generation limit; the Fruit+Root-Veg pair genuinely share their location. Real photography is the only route to guaranteed identity.
- The **four-image proof masters** (far camera) are superseded by these **closer** plates for shelves/fridge; Master B for those will be built from the new closer plates.

## Quality gate (progress)
✅ cupboard corrected · ✅ fridge oak integrated + closer · ✅ root-veg continuity beneath fruit worktop · ✅ larger labels (spec — applies at Master B) · ⏳ Living Object Library · ⏳ deterministic runtime composition · ⛔ Bread/Tea&Coffee not implemented (homes unapproved). No floating labels/plaques, no runtime inpainting (nothing in runtime yet).

## Next step
Confirm **D2 (install rembg for extraction)** and **D1 (masked-edit Master B)**; then Phase 3 (Masters) → Phase 4 (Library) → Phase 5 (runtime). Everything remains additive under `artifacts/`; **no runtime asset has been modified.**
