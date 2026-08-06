# Living Pantry — Canonical Production Architecture

**Date:** 2026-08-06 · **Risk:** 🟢 GREEN — production imagery & architecture. **No runtime, schema, ownership, or behavioural change.**
**Status:** Governing production architecture — the **Three-Asset Model**, built as **Production Master Pairs** (Environment Plate + Canonical Master, generated together and locked). The **camera/composition of the approved proof is now LOCKED** — no closer views, no zoom; **continuity over proximity**. Image generation is **paused** until this Proof-vs-Production distinction is approved (and the Bread / Tea & Coffee homes are established).
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

## Production Principle — Fixed World

**The Living Home is a fixed world. The physical environment is the canonical truth.**

- Furniture does not move.
- Walls do not move.
- Windows do not move.
- Architectural features do not move.
- The structure of the room does not move.
- Lighting for a Working Position remains consistent.
- **The room is never reinvented.**

**Only the following may change:**
- the **camera**
- **Living Objects**
- **seasonal dressing**
- **hospitality dressing**

Every Working Position is simply another view of the same physical space. **The camera moves. The Living Home does not.**

**This principle governs every future Living Home environment** — Pantry · Fridge · Freezer · Kitchen · Living Room · Utility · Garage · Garden. **Every future room inherits this principle automatically.**

---

## The Three Production Assets

Every Working Position produces exactly three assets:

**Master A — Environment Plate.**
The empty room from this camera: architecture · furniture · lighting · shadows · permanent props. **Contains no Living Objects. Never modified.** This is the runtime background.

**Master B — Canonical Master.**
Produced **from** the approved Master A (by any mechanism that meets the Production Pair Principle below) and **locked together with it as a production pair** — the identical room, camera, composition, furniture, permanent props, lighting, shadows, and perspective, now containing **every Living Object in its Canonical Home**. Master B exists **only** for approval, extraction, and lighting reference. **It is a production asset only and is never used directly by runtime.** *(This is a Production Master Pair — distinct from the Proof Canonical Masters; see below.)*

**Living Object Library.**
Each Living Object **extracted individually** from Master B (the Canonical Master) as its own transparent PNG — jar, bottle, tin, fruit, vegetable, bread, tea/coffee canister, and so on. This library is the **single source of interactive assets**. Each Living Object record carries a **Parent Production Asset** (the Canonical Master it was extracted from, e.g. `LP-PS-CM-001`), preserving full lineage **Environment Plate → Canonical Master → Living Object → Runtime** — a provenance field prepared in `LIVING_PANTRY_GENERATION_LOG.md`, optional to runtime and adding no implementation complexity.

### Production flow
```
   Master A                Master B                 Living Object            Runtime
  (Environment    ──▶     (Canonical      ──▶       Library         ──▶     Environment Plate
   Plate)                  Master)                  (extractions)            + Living Objects
   empty, real            populated,               each object as a         (compose over the
   runtime bg             production only          transparent PNG          plate; never modify it)
```

### The Production Pair Principle (required outcome — governs, not the mechanism)

**Master B (Canonical Master) is produced from the approved Master A (Environment Plate) while preserving the identical room, camera, composition, furniture, permanent props, lighting, shadows, and perspective. Only the Living Objects may differ.**

The architecture specifies this **outcome, not the implementation mechanism.** Whether the pair is achieved through **masked editing**, **future image-generation capabilities**, **photography**, or another production technique is an **implementation decision** — valid so long as the resulting Production Master Pair satisfies this principle.

**Invariants any mechanism must satisfy:**
- Master A and Master B share **every non-object pixel** — removing a Living Object reveals the real Master A, believable and artefact-free.
- The pair is **produced together and locked**; Master B is produced *from* Master A. **Neither image is derived from the other afterwards.**
- Objects are only ever **present on a real empty plate** — the environment is never removed, reconstructed, or inpainted, so **no environment pixel is invented.**

**Current candidate mechanism (implementation detail, may change):** generate Master A (empty plate) at the locked framing, then produce Master B as a **masked add** of the Living Objects onto Master A (object zones only; the environment carried through unchanged). A future capability, or photographing the same set empty then dressed, is equally valid if it meets the invariants above.

Then: extract the **Living Object Library** from Master B; runtime composes **Master A + Living Objects** — removing an object reveals the real Master A. *(The rejected earlier approach did the reverse — deriving an empty by removing objects from a populated master, forcing AI to invent occluded pixels; see `LIVING_PANTRY_PIPELINE_PROOF.md`.)*

---

## Proof Canonical Masters vs Production Master Pairs

Two different kinds of asset — they must not be confused:

**Proof Canonical Masters — *visual approval evidence, not runtime assets.***
The four-image proof (Pantry Shelves, Fridge, Fruit) under `artifacts/canonical-pantry-production-set/00_FOUR_IMAGE_PROOF/`. They **approve the room, camera, composition, furniture, and visual language** — the *look* of the one pantry. **Their pixels are not sacred, and they are never used by runtime.** They remain valuable only as references and approval evidence.

**Production Master Pairs — *the true runtime source assets.***
For every Working Position, a **locked pair — Environment Plate (Master A) + Canonical Master (Master B)** — generated **together** (plate first, master as an edit of the plate, locked as a pair). Master A is the runtime background; Master B is for extraction and lighting reference. These pairs, and the Living Object Library extracted from them, are what runtime actually uses.

| | Proof Canonical Master | Production Master Pair |
|---|---|---|
| **Purpose** | approve room / camera / composition / visual language | runtime source of truth |
| **Pixels** | not sacred — reference only | the locked production pixels |
| **Runtime use** | never | Master A = background · Library = objects |
| **How made** | a single proof generation | Plate first, then Master as an edit of it, **locked together** |
| **Status** | ✅ approved (visual language) | ⏳ not yet generated |

The Proof Canonical Masters guide each Production Master Pair (same room, camera, composition, furniture, visual language), but every runtime pixel comes from the **Production Master Pair**, not the proof.

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

- **Camera — LOCKED.** The camera/composition of the approved proof is **locked**. **Do not move the camera closer, and do not zoom.** Every Production Master Pair is generated at the approved framing. **Continuity is more important than proximity.** *(An earlier "step closer" refinement was withdrawn — a closer view broke continuity and produced a different pantry.)*
- **Lived-in household.** Vary the staging so the pantry feels used: one jar half full, another completely full, natural differences in ingredient levels, believable household usage. **Authenticity, not clutter** — do not stage every shelf perfectly, and do not create mess.

---

## Working Position List (8 positions + Arrival)

The separate **Worktop** Working Position is **removed** — it duplicated information already in Fruit, Root Vegetables, Store Cupboard, and Pantry Shelves.

| # | Working Position | Location in Arrival | Camera |
|---|---|---|---|
| 01 | **Arrival** | the whole room (anchor) | wide, room entrance — establishes every Canonical Home |
| 02 | **Pantry Shelves** | centre floating shelves | front-on, **approved framing (locked)**; larger standardised labels; lived-in |
| 03 | **Fridge** | left oak integrated appliance | front-on, **approved framing (locked)**, refrigerator open |
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
- **02 / 03:** the approved (locked) front-on framing of the fixture — no closer view, no zoom.
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

- **Proof Canonical Masters (2026-08-06):** the four-image proof — Pantry Shelves, Fridge, Fruit, Store Cupboard (Arrival reused). **Visual approval evidence only — NOT production assets** (their pixels are not sacred and never enter runtime). The **room, camera, composition, furniture, and visual language are approved**; the **Store Cupboard proof was rejected** (wrong furniture — see the strengthened spec above). Cost ≈ £0.75. `artifacts/canonical-pantry-production-set/00_FOUR_IMAGE_PROOF/`. [V]
- **Pipeline Proof (2026-08-06):** extraction, recomposition, and runtime label text were proven; deriving an empty by *removal* was rejected — establishing that production must generate a real Environment Plate first. `artifacts/canonical-pantry-production-set/00_PIPELINE_PROOF/`. [V]
- **Rejected off-canon attempt (2026-08-06):** six Environment Plates generated by fresh text-to-image produced a *different* pantry and were **deleted**. Lesson recorded: every production asset is anchored to the approved room/camera/composition — never fresh text-to-image. See `LIVING_PANTRY_IMPLEMENTATION_PHASE.md`. [V]
- **Production Master Pairs (Master A + Master B) — NOT yet generated;** no Living Object Library; **no runtime asset touched.** Awaiting approval of this documented Proof-vs-Production distinction before any generation. [V]

## Cost & Gate (for the eventual generation request)
Each Working Position needs **2 generations** (Master A + Master B) plus **local extraction** (masking). At ~£0.20/image, the eight positions ≈ **£3–7** with iteration. A fresh per-position estimate and a **£5 approval gate** will accompany the actual generation request — **after** this architecture is approved and the Bread / Tea & Coffee homes are established.

## Success Criteria (for the completed production set)
One physical room · same fixture in every camera · same permanent props, material palette, lighting, scale, craftsmanship · **Master A is never modified** · **Master B is never used by runtime** · every Living Object extracted from Master B · the **Living Object Library is the single source of interactive assets** · every Living Object has a Canonical Home · Home Owner approval of the whole set.
