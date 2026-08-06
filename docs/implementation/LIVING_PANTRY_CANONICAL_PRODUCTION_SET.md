# Living Pantry — Canonical Production Architecture

**Date:** 2026-08-06 · **Risk:** 🟢 GREEN — production imagery & architecture. **No runtime, schema, ownership, or behavioural change.**
**Status:** Governing production architecture — the **Three-Asset Model**. Visual language approved; pipeline approved in principle. Image generation is **paused** pending the outstanding Canonical-Home decisions (see Open Architectural Decisions).
**Rollback identifier:** `rollback/canonical-production-set-20260806` → `9b3e59c7`.
**Evidence:** [V]erified · [I]nferred · [A]ssumed.

---

## Architectural Principle — Deterministic Runtime

**Nothing is ever removed from the Environment Plate. Living Objects are simply composed over it.**

- Removing an object at runtime reveals the **original Environment Plate** — the real pixels that were always there.
- **No AI reconstruction. No AI inpainting. No invented pixels.**
- The runtime is **deterministic**: the same Environment Plate + the same Living Objects always produce the same scene.

This principle is the reason the production pipeline has three assets rather than one.

---

## The Three Production Assets

Every Working Position produces exactly three assets:

**Master A — Environment Plate.**
The empty room from this camera: architecture · furniture · lighting · shadows · permanent props. **Contains no Living Objects. Never modified.** This is the runtime background.

**Master B — Canonical Master.**
The **identical** camera, room, lighting, and furniture as Master A — now containing **every Living Object in its Canonical Home**. Master B exists **only** for approval, extraction, and lighting reference. **It is a production asset only and is never used directly by runtime.**

**Living Object Library.**
Each Living Object **extracted individually** from Master B (the Canonical Master) as its own transparent PNG — jar, bottle, tin, fruit, vegetable, bread, tea/coffee canister, and so on. This library is the **single source of interactive assets**.

### Production flow
```
   Master A                Master B                 Living Object            Runtime
  (Environment    ──▶     (Canonical      ──▶       Library         ──▶     Environment Plate
   Plate)                  Master)                  (extractions)            + Living Objects
   empty, real            populated,               each object as a         (compose over the
   runtime bg             production only          transparent PNG          plate; never modify it)
```

### Why three assets (pixel-compatibility without inpainting)
The empty is a **real generated asset**, not a reconstruction. The order is **empty first, then add objects**:
1. Generate **Master A** (the empty Environment Plate) at the approved camera.
2. Generate **Master B** as a **masked edit of Master A** — the mask covers only the object zones, so the model *places* Living Objects there while **Master A's environment pixels are preserved unchanged**. Master B is therefore pixel-compatible with Master A by construction.
3. Build the **Living Object Library** by extracting each object from Master B; every object's surroundings in Master A are the real empty.
4. Runtime composes **Master A + Living Objects** — removing an object reveals Master A, believable and artefact-free.

Because the pixels behind every object genuinely exist in Master A, **no occluded region is ever reconstructed.** *(This replaced an earlier single-master approach that derived the empty by removing objects; that forced AI to invent occluded pixels — visible streaking — and was rejected. See `LIVING_PANTRY_PIPELINE_PROOF.md`.)*

---

## Production Rule — Canonical Homes

**Every Living Object must have a Canonical Home before it may exist in runtime.**

If an object has no Canonical Home, it **cannot be**:
- generated
- extracted
- displayed
- interacted with

A Canonical Home means a specific, permanent place in the one pantry — owned by a specific fixture, reachable by a specific camera, and locatable within Arrival.

This rule applies to **every** Living Pantry object — for example: **Bread · Tea · Coffee · Milk · Ketchup · Bananas · Oats.** An object without an established home is an **open architectural decision**, not a production task.

---

## Canonical Jar Label Specification (Living Pantry Design System)

The pantry jar chalkboard label is the **primary interaction surface** — not decoration. It is now a canonical component of the Living Pantry Design System, standardised across **every** pantry jar.

| Property | Specification |
|---|---|
| **Width** | approximately **one-third** of the jar's visible width |
| **Height** | approximately **one-fifth** of the jar's visible height |
| **Finish** | **matte chalkboard** (never glossy plastic) |
| **Corners** | elegant **rounded corners** |
| **Standardisation** | the **same physical size** on every pantry jar |
| **Text — one line** | **"Wholemeal Flour"** fits comfortably on **one line** |
| **Text — long names** | wrap **intelligently to two balanced lines** |
| **Ingredient visibility** | the ingredient must remain **clearly visible through the glass** |
| **Runtime** | runtime edits the **text only**; the **label artwork is permanent** |

---

## Store Cupboard Specification

The Store Cupboard is a **real family tinned-food cupboard**, not decorative storage.

- The **under-counter cupboard** shown in Arrival (the lower cabinets beneath the worktop).
- **Both doors open.**
- **Real supermarket tins** — baked beans, chopped tomatoes, tuna, sardines, soups, chickpeas, lentils, coconut milk, sweetcorn, tomatoes.
- **Varying heights** and **varying diameters.**
- **Realistic printed tin labels.**
- **Natural household organisation** (as a family actually stacks tins).
- **Absolutely no pantry jars. Absolutely no glass storage.**

---

## Camera & Staging Refinements

- **Camera distance.** For **Pantry Shelves** and **Fridge**, the camera moves **physically closer** — the household should feel they have stepped forward into the room. **Do not zoom.** The room is unchanged.
- **Lived-in household.** Vary the staging so the pantry feels used: one jar half full, another completely full, natural differences in ingredient levels, believable household usage. **Authenticity, not clutter** — do not stage every shelf perfectly, and do not create mess.

---

## Working Position List (8 positions + Arrival)

The separate **Worktop** Working Position is **removed** — it duplicated information already in Fruit, Root Vegetables, Store Cupboard, and Pantry Shelves.

| # | Working Position | Location in Arrival | Camera |
|---|---|---|---|
| 01 | **Arrival** | the whole room (anchor) | wide, room entrance — establishes every Canonical Home |
| 02 | **Pantry Shelves** | centre floating shelves | front-on, **closer**; larger standardised labels; lived-in |
| 03 | **Fridge** | left oak integrated appliance | front-on, **closer**, refrigerator open |
| 04 | **Freezer** | same appliance, lower section | front-on, lower drawer open (same appliance as 03) |
| 05 | **Fruit** | worktop by the window (right) | front-on / slightly down; root veg rack beneath |
| 06 | **Root Vegetables** | **beneath the Fruit worktop** | tilt down to the rack — same location as Fruit + Arrival |
| 07 | **Store Cupboard** | **under-counter cupboard** (lower cabinets) | front-on, both doors open — tins (see spec) |
| 08 | **Tea & Coffee** | **home not yet established** | TBD — see Open Architectural Decisions |
| 09 | **Bread** | **home not yet established** | TBD — see Open Architectural Decisions |

### Camera map (one room; the camera moves, the pantry does not)
```
   LEFT                         CENTRE                                   RIGHT
   ┌──────────────┐      ┌────────────────────────┐          ┌────────────────────┐
   │ OAK          │      │  Floating pantry        │          │  Window +          │
   │ INTEGRATED   │      │  shelves (3 tiers) ▲02  │          │  Fruit worktop ▲05 │
   │ FRIDGE  ▲03  │      │  Worktop / scale        │          │  Root veg rack     │
   │ ───────────  │      │  Under-counter cupboard │          │  BENEATH  ▲06      │
   │ FREEZER ▲04  │      │        ▲07 (tins)        │          │  (tilt down)       │
   └──────────────┘      └────────────────────────┘          └────────────────────┘
   ▲01 Arrival = wide view spanning LEFT → CENTRE → RIGHT (establishes every home)
   ▲08 Tea & Coffee, ▲09 Bread = homes not yet established (cameras cannot be placed yet)
```
- **02 / 03:** step *forward* to the fixture (closer, front-on) — same room, nearer camera, no zoom.
- **05 / 06:** the **same right-hand worktop**; Fruit views the baskets, Root Vegetables tilts **down** to the rack beneath — provably one place, matching Arrival.
- **07:** the **lower under-counter cabinets** (beneath the worktop in Arrival), both doors open — a tinned-food cupboard.

---

## Open Architectural Decisions

Per the Canonical Homes rule, these must be resolved **before** the relevant assets can be generated:
1. **Bread — Canonical Home.** Where does bread permanently live, which furniture owns it, and how does the camera reach it? Establish from Arrival (extend Arrival if needed).
2. **Tea & Coffee — Canonical Home.** Not clearly present in Arrival; the same determination is required as for Bread.

Until these are settled, positions 08 and 09 have no camera and cannot enter production.

---

## Production Status (record)

- **Four-Image Proof (2026-08-06):** four **Master B (Canonical Master)** images produced as a visual-language proof — Pantry Shelves, Fridge, Fruit, Store Cupboard (Arrival reused as anchor). Actual cost **≈ £0.75** (21,952 output tokens; gpt-image-2, 1536×1024, via the governed `scripts/generate-environment-plate.py`). The visual language was approved; the **Store Cupboard proof was rejected** (wrong furniture — see the strengthened spec above). Deliverable: `artifacts/canonical-pantry-production-set/00_FOUR_IMAGE_PROOF/`. [V]
- **Pipeline Proof (2026-08-06):** extraction, recomposition (pixel-identical), and runtime label text were proven; deriving the empty by *removal* was rejected — which established the Three-Asset Model above. `artifacts/canonical-pantry-production-set/00_PIPELINE_PROOF/`. [V]
- **Master A (Environment Plates)** at the approved *closer* camera are **not yet generated**; nor is any Living Object Library. **No runtime asset has been touched.** [V]

## Cost & Gate (for the eventual generation request)
Each Working Position needs **2 generations** (Master A + Master B) plus **local extraction** (masking). At ~£0.20/image, the eight positions ≈ **£3–7** with iteration. A fresh per-position estimate and a **£5 approval gate** will accompany the actual generation request — **after** this architecture is approved and the Bread / Tea & Coffee homes are established.

## Success Criteria (for the completed production set)
One physical room · same fixture in every camera · same permanent props, material palette, lighting, scale, craftsmanship · **Master A is never modified** · **Master B is never used by runtime** · every Living Object extracted from Master B · the **Living Object Library is the single source of interactive assets** · every Living Object has a Canonical Home · Home Owner approval of the whole set.
