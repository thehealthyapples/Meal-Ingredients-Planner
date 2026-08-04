# Living Home — Phase 0 Fridge Believability Review

**Date:** 2026-08-04 · **Risk:** 🟡 AMBER — review only. **No implementation.**
**Rollback (unchanged):** `rollback/living-pantry-dynamic-objects-base` → `5b1e00d0`.
**Verdict as a homeowner:** *Would I believe this milk was photographed inside my fridge?* **Not yet.** The architecture is right; the **belief** isn't. Below: why, and how to fix it while keeping the Living Object Platform.

---

## What is actually right (keep it)

- **The platform works** — independent objects that move, drag and truly disappear (verified). This is the correct architecture and must be preserved.
- **The empty plate edit is faithful** — side by side, the empty fridge is the *same* fridge: same body, same oak cabinets, same stone floor, same door racks, same three glass shelves, same two crispers, same interior light and camera. The "different fridge / different cabinetry / different proportions" concern is **minor** (a slightly brighter, cooler interior). *We do not need to regenerate the fridge.*

The believability gap is **not the plate and not the architecture — it is object integration.**

---

## 1. Why the current implementation feels artificial

Compared honestly with the original photograph, the objects read as *placed on* the fridge, not *living in* it, for six reasons:

1. **Lighting mismatch.** The objects were shot on a neutral studio field (flat, front-lit, daylight-balanced). The fridge interior is lit from its own **warm top light**. So the objects are brighter, cooler and flatter than everything around them — the eye reads "different photo."
2. **No grounding.** Nothing touches. Objects have **no contact shadow** on the shelf and **no ambient occlusion** where they meet a surface or each other. Real fridge items darken at their base and cast soft shadows onto the shelf below and the back wall. Without this they **float**.
3. **In front of, not inside.** In the original the door jars sit **inside** the clear racks (the rack lip is in front of them) and the salad sits **inside** the crisper (seen through the drawer front). My objects render **on top of** the racks and drawers — so they hover in front of the furniture instead of nestling into it. This is the single strongest "composited" tell.
4. **Sparse, isolated arrangement.** The original fridge is **full and clustered** — items touch, overlap, and fill the drawers. My objects are evenly spaced and separated (a legacy of the extraction grid), so the fridge looks *staged*, not *stocked*.
5. **Perspective plane.** Product shots are straight-on; the fridge shelves recede slightly. Objects don't sit in the shelf's perspective, so they tilt against the scene.
6. **Scale + edges.** Relative scale drifts between objects (a too-tall milk, a large cheese), and cut-out edges can carry a faint halo — both small, both add up.

*(Also: the Areas navigator overlaps the left door — the navigation obscures the Working Position and should recede inside a room.)*

---

## 2. How to correct it while preserving the Living Object Platform

The fix is **integration, not architecture**. Objects stay independent, movable and removable — we change how they are *lit, grounded, layered and arranged*:

- **Relight objects to the scene** — regenerate (or post-grade) the object masters under the fridge's **warm top-light**, not neutral studio light; add a gentle top key and cooler base so they belong.
- **Layer the plate BACK / OBJECTS / FRONT** — split the fridge plate into a **back layer** (interior, shelves, back wall) and a thin **front layer** (the clear rack fronts, drawer fronts, glass shelf lips). Render Living Objects **between** them, so each object tucks **behind** its rack/drawer front — genuinely *inside* the fridge. This alone removes most of the artificial feel, and objects remain fully independent.
- **Ground every object** — a soft contact shadow + subtle ambient occlusion under and behind each one (see §4).
- **Arrange like a real fridge** — cluster and slightly overlap items, fill the crisper drawers, let the door racks look packed. Density reads as "lived in."
- **Match perspective + lock scale** — place objects on the shelf's plane and size them against a shared reference so relative scale is consistent.
- **Clean edges** — tighter alpha mattes, a 1px feather, no halo.
- **Let navigation recede** — the Areas navigator should dim/collapse while inside a Working Position so it never overlaps the fridge.

---

## 3. Should the Environment Plate contain permanent shelf shadows and object-anchor lighting? — **YES**

This is the right instinct and the highest-leverage change. The empty plate should be authored as a **lit stage that expects objects**, not a bare box:

- **Baked shadow anchors** — soft shadow pools already present on each shelf and in each drawer where objects will sit, so a placed object lands *into* an existing shadow instead of onto a flat clean surface.
- **Consistent key + fill** — the plate defines the warm interior key light and soft fill; objects are then lit to match it (they read as sharing the fridge's light).
- **A foreground occlusion layer** (the §2 front layer) — rack fronts, drawer fronts and glass lips, so objects seat *behind* the furniture.

Net: the plate owns the **lighting environment and the anchor shadows**; the object only has to drop into a spot that is already lit and shadowed for it.

## 4. Should object rendering include grounding shadows and ambient occlusion? — **YES**

Every Living Object should carry its own grounding so it reads as resting, not pasted:

- **Contact shadow** — a soft, warm-dark elliptical shadow beneath the object where it meets the shelf (CSS layer and/or baked into the PNG).
- **Ambient occlusion** — a subtle darkening at the base and along contact edges (object-to-shelf and object-to-object), the cue the eye uses for "this is touching that."
- **Cast shadow** — a faint directional shadow onto the shelf below / back wall, matched to the plate's key light.
- **Scene relight** — the object's own top-light/tint nudged to the fridge's warm interior so highlights agree.

**§3 and §4 work together:** the plate provides the lit stage and anchor shadows; the object provides its contact shadow, AO and matched light. Between them, *the milk sits in the fridge* instead of *on* the photo.

---

## Recommendation (for approval — do not implement yet)

Do **not** regenerate the fridge (the plate is faithful). Re-do Phase 0 object integration as one believability pass:
1. Re-author the empty plate with **baked anchor shadows + a foreground rack/drawer/glass layer** (edit, same fridge).
2. **Relight + re-extract** the object masters to the fridge's warm light with clean mattes.
3. Render objects **between** back and front plate layers, **grounded** (contact shadow + AO), **clustered and drawer-filling**, on the shelf perspective plane.
4. Let the Areas navigator recede inside a Working Position.
5. Re-run the "five-seconds-earlier" test **and** the new bar: *"Would I believe these were photographed inside this fridge?"*

Only this integration layer changes — the Living Object Platform (independent, movable, removable objects) is untouched. It becomes **visually invisible**: the household simply believes *"my milk is in my fridge."*

**STOP — awaiting approval before implementing the believability pass.**

---

## Canonical Asset Capture — governing production principle (approved 2026-08-04)

**Reusable Living Objects should be authored under the *same* canonical camera, lighting, perspective and craftsmanship as their intended Environment Plate — wherever practical.** A Living Object should not begin life as generic product photography or an isolated studio asset that runtime must then *rescue*; it should already **belong to the Living Home before runtime**. Runtime then performs only **subtle integration**, never correction.

**Canonical production pipeline:**

```
Canonical Environment Plate
        ↓
Canonical Camera
        ↓
Canonical Lighting  (the room's own warm light)
        ↓
Living Object Master  (authored to belong)
        ↓
Minor Runtime Grounding  (contact shadow · ambient occlusion · foreground masking)
```

This is the canonical methodology for **every future Living Object**. (Phase 0 objects were captured as studio product shots and **relit to the fridge's warm light at the master level** — a retroactive application of this principle; future objects are captured canonically from the start, so relighting becomes refinement, not rescue.)

## Living Object Acceptance Test (production quality gate)

Every Living Object must pass **all** of the following before implementation:

- ☐ Could this object genuinely be mistaken for part of the original photograph?
- ☐ Does it naturally occupy its **Canonical Home**?
- ☐ Does it already share the Environment Plate's **camera, lighting and perspective**?
- ☐ Does it need only **subtle runtime grounding**, not significant visual correction?

**Any "No" → reject and refine the object before implementation.** This gate sits alongside the Environment Plate's Camera Acceptance Test and the Production Review Checklist.
