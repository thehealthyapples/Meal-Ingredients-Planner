# Living Home — Canonical Production Asset Architecture

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — architectural refinement only. **No runtime, no schema, no generation.**
**Branch:** `feat/living-larder-authoritative`
**Rollback identifier:** `rollback/living-home-prod-arch-base` → `e1b38dc8` *(doc-only — nothing to roll back).*
**Extends:** [`docs/implementation/LIVING_HOME_PANTRY_CANONICAL_ASSET_LIBRARY.md`](../implementation/LIVING_HOME_PANTRY_CANONICAL_ASSET_LIBRARY.md) (the asset inventory). This document is the **governing production architecture** for every future Living Home room; the library is its first populated instance.
**Locked & unchanged:** Living Home Concept · Architecture · Working Position Architecture · Navigation Model · Living Object Model · Shopping Intent · Companion.
**Status:** **COMPLETE (governing constitution).** Incorporates the earlier refinements (R1 canonical-home ownership · R2 Canonical Spatial Continuity · R3 Arrival Visibility · R4 Canonical Homes) and this Final Completion pass (Canonical Room Inventory · Camera Acceptance Test · Spatial Recognition · Camera Continuity records · Arrival Completeness · Permanent Room Identity · Implementation Gate). See §11 — architecture declared complete; effort now moves to implementation. Governance: **§13 Production Review Checklist** · **§14 Final Architectural Declaration**.

> This is the ownership and reuse **framework** the next generation programme proceeds from — not a request for images. Nothing here is generated.

---

## 0. The ownership spine (one canonical owner per asset)

```
Living Home SET  (one physical room)  ─── owns ──▶ Architecture · Joinery · Furniture ·
   │                                               Environment Plates · Cameras · Lighting ·
   │                                               Environmental Dressing · Permanent Objects ·
   │                                               Interaction Regions
   ├── Camera Library         (the room's fixed viewpoints)
   ├── Working Position SETS  (one per camera — the reusable production entity)
   └── Living Objects         (own their IDENTITY — what they are)
         ├── Families         (taxonomy)
         ├── Hero | Reusable  (production class)
         └── Canonical Home   (the position they belong in — §4A)
   Animation Assets           (reusable motion, owned by the Set / interaction layer)
```

Every production asset resolves to **exactly one owner** — and two ownerships meet, cleanly, at every position:

- the **Living Home Set owns the physical position** — *where* things live (shelf, fridge door, bread bin, root rack);
- the **Living Object owns its identity** — *what* it is.

A Living Object is **not a guest passing through**. It has a **canonical home** in the room and naturally belongs there. The room owns the locations; the object owns what it is; the two never overlap.

---

## 1. Canonical Living Home Sets

A **Living Home Set** is one complete physical room. The Pantry is the first Set.

| A Living Home Set OWNS (the *positions*) | A Living Object OWNS (its *identity*) |
|---|---|
| Architecture, room proportions | What it is (name, food identity) |
| Joinery & furniture | Its **canonical home** — the position it belongs in (§4A) |
| Environment Plates | Its Family & production class (Hero / Reusable) |
| Camera positions & lighting | Its runtime label / variant (for Reusable masters) |
| Environmental dressing (seasonal) | *(Shopping intent & quantity → Shopping domain; knowledge → Companion)* |
| Permanent objects (baked craft: scales, bowls, kombucha, microgreens) | — |
| Interaction regions (hotspots / drop zones) | — |

**Rule — two ownerships, one position.** The Set owns the **position**; the object owns its **identity**. A Living Object is **not a guest** — it has a **canonical home** (§4A) and belongs there. It may be picked up, moved, added to shopping, handed to the Companion, or binned, but it never redefines the room, and it always has a place it returns to. This is what lets one object appear — *correctly placed* — in many Sets.

**Registered Sets:** `SET-PANTRY` (active). Future: `SET-KITCHEN`, `SET-GARDEN`, … each inherits this whole architecture.

---

## 1A. Canonical Room Inventory (`SET-PANTRY`)

Every Living Home Set **declares its complete permanent inventory** — the architecture and furnishings that *define* the room. **Every camera must faithfully represent this same inventory. No camera may introduce, omit or alter a permanent item.** This is the object list against which the Camera Acceptance Test (§8.3) is judged.

**Architecture (fixed structure):**
- American-style fridge-freezer
- Pantry shelving
- Cupboards (oak)
- Bread storage
- Root vegetable rack (black-steel wire)
- Fruit baskets (willow, on the worktop by the window)
- Tea & Coffee station
- Worktop (stone)
- Window
- Doorway
- Stone floor · plaster wall finish

**Permanent props (the household's own things — same object every camera):**
- Cookbook
- Kitchen scales
- Kombucha vessel (tapped)
- Microgreens (hanging)
- Chopping board(s)
- Mixing bowl(s)
- Tea towel
- Knife block
- Wooden-spoon pot

### Permanent Room Identity

A permanent prop is **one specific object**, not a category. *The* cookbook is always the same cookbook; *the* fruit basket is always the same willow basket; *the* kombucha jar is always the same vessel; *the* scales are always the same scales; *the* chopping board is always the same board — in the same place, at the same wear, from every camera. These recurring objects are **not decoration; they are the household's personality** and the household's proof that this is one home. Any new plate that shows a *different* cookbook (or basket, or board) fails §8.3, even if beautifully rendered.

---

## 2. Canonical Camera Library (`SET-PANTRY`)

Each Working Position is a **fixed camera inside the one room**. Cameras are reusable production assets in their own right. Numeric field-of-view / height were not recorded at generation time; they are captured here as **spec fields to be measured & locked** on the next polish pass — orientation and relationships are known and authoritative.

| Camera | Plate | Purpose | Orientation | Neighbours visible | Lighting | Transition |
|---|---|---|---|---|---|---|
| `CAM-ARRIVAL` | `arrival.png` | Orientation Environment — the whole room | Wide, eye-level, front-to-corner | shelves, fridge, baskets, rootveg, window | morning, **light from right** | hub → any position |
| `CAM-SHELF` | `shelf.png` | Pantry Shelves | Close, front-on to timber | (shelf face) | right | ⇄ any |
| `CAM-CUPBOARD` | `work-cupboard.png` | Store Cupboard (doors open) | Front-on to open oak cupboard | — | right | ⇄ any |
| `CAM-FRIDGE` | `work-fridge.png` | Fridge (front-on, open) | Front-on, eye-level | — | right | ⇄ any |
| `CAM-FREEZER` | `work-freezer.png` | Freezer | Front-on | — | right | ⇄ any |
| `CAM-FRUIT` | `work-fruit.png` | Fruit bowl | At the baskets by the window | window | right (window-lit) | ⇄ any |
| `CAM-WORKTOP` | `work-baskets.png` | Kitchen Worktop | At the worktop | — | right | ⇄ any |
| `CAM-ROOTVEG` | `work-rootveg.png` | Root Vegetables | At the wire rack | — | right | ⇄ any |
| `CAM-BREAD` | `work-bread.png` | Bread store | At the bread crock | — | right | ⇄ any |
| `CAM-TEACOFFEE` | `work-tea-coffee.png` | Tea & Coffee | At the drinks station | — | right | ⇄ any |

**Camera-record schema (to complete on polish):** `purpose · orientation · field-of-view · camera-height · interaction-distance · viewing-direction · neighbouring-cameras · expected-visible-landmarks · expected-permanent-furniture · lighting-continuity · transition-relationships`. Lighting-continuity is **fixed for the whole Set**: one morning, light from camera-right (§8).

### Camera continuity record

Each camera must document its **interaction distance**, **viewing direction**, **neighbouring cameras**, and the **landmarks & permanent furniture it is expected to show** — so future cameras stay spatially consistent and every viewpoint is checkable against §1A. (Landmarks are the orientation cues of §8.4.)

| Camera | Interaction distance | Viewing direction | Neighbouring cameras | Expected landmarks | Expected permanent furniture |
|---|---|---|---|---|---|
| `CAM-ARRIVAL` | far (whole room) | into the room, toward the corner | → all | window, shelving, fruit baskets, veg rack, floor, wall | fridge-freezer, shelving, cupboards, rack, baskets, tea/coffee, worktop |
| `CAM-SHELF` | close | front-on to the shelving | ⇄ all | shelving, wall finish | pantry shelving |
| `CAM-CUPBOARD` | close | front-on to the open cupboard | ⇄ all | cupboard, wall, floor | oak cupboards |
| `CAM-FRIDGE` | close | front-on to the open fridge | ⇄ all | fridge-freezer body, floor | American fridge-freezer |
| `CAM-FREEZER` | close | front-on to the freezer drawer | ⇄ all | fridge-freezer body, floor | American fridge-freezer |
| `CAM-FRUIT` | mid | to the baskets by the window | ⇄ all | **window**, willow baskets, worktop | fruit baskets, worktop |
| `CAM-WORKTOP` | mid | to the worktop | ⇄ all | worktop, window | worktop |
| `CAM-ROOTVEG` | mid | to the wire rack | ⇄ all | wire rack, floor | root vegetable rack |
| `CAM-BREAD` | close | to the bread store | ⇄ all | bread storage, worktop | bread storage |
| `CAM-TEACOFFEE` | close | to the drinks station | ⇄ all | tea/coffee station, wall | tea & coffee station |

*(Interaction distance and exact FOV/height are recorded qualitatively today; a polish pass measures and locks the numbers. Landmarks/furniture columns are the acceptance checklist for each camera.)*

**Transition model (implemented):** cameras crossfade — plate `opacity 0.6s` + `transform scale(1.02→1) 0.9s` ("stepping closer, never a page flip"); reduced-motion collapses to `opacity 0.2s`, no transform. Every camera reaches **every other camera directly** via the Areas navigator (Navigation Model, locked) — no return to Arrival required.

---

## 3. Working Position Sets

A Working Position is **no longer an image** — it is a reusable production entity binding a camera to its interaction.

**Working Position Set schema:**
`Camera · Environment Plate · Lighting · Interaction Regions · Living Object Layout · Navigation Links · Animation Entry · Animation Exit`

| WP Set | Camera / Plate | Object layout | Nav links | Entry / Exit anim |
|---|---|---|---|---|
| `WP-SHELVES` | CAM-SHELF | 6 jar seats on shelf points (groups → items) | all + Arrival | `lh-approach 0.5s` / crossfade-out |
| `WP-CUPBOARD` | CAM-CUPBOARD | categories → tinned items (band) | all | `lh-approach` / crossfade |
| `WP-FRIDGE` | CAM-FRIDGE | dairy band | all | `lh-approach` / crossfade |
| `WP-FREEZER` | CAM-FREEZER | frozen band | all | `lh-approach` / crossfade |
| `WP-FRUIT` | CAM-FRUIT | produce row | all | `lh-approach` / crossfade |
| `WP-WORKTOP` | CAM-WORKTOP | large produce row | all | `lh-approach` / crossfade |
| `WP-ROOTVEG` | CAM-ROOTVEG | root produce row | all | `lh-approach` / crossfade |
| `WP-BREAD` | CAM-BREAD | bakery row | all | `lh-approach` / crossfade |
| `WP-TEACOFFEE` | CAM-TEACOFFEE | canister row | all | `lh-approach` / crossfade |

Entry animation `lh-approach` = `0.5s cubic-bezier(0.22,0.61,0.36,1)` (the object layer settles in). Exit today is the plate crossfade; an explicit exit hook is registered under §6.

---

## 4. Living Object Families

The flat list is replaced by **canonical families**. Every future object declares one family; a family shares **one material/lighting spec** (which is exactly what makes a generation batch coherent — §9).

| Family | Members (masters) | Class |
|---|---|---|
| **Storage — Glass** | clip-top jar (S/M/L), spice jar, glass bottle, jam jar | Reusable |
| **Storage — Vessel** | tin, canister, ceramic pot, milk bottle, yoghurt pot, egg box, frozen bag | Reusable |
| **Storage — Basket** | wire veg basket, fruit basket, wooden crate | Reusable (currently plate-baked) |
| **Fresh Produce — Fruit** | apple ✓, banana, pear, orange, satsuma, mango, avocado, pineapple, watermelon | Hero |
| **Fresh Produce — Root/Veg** | broccoli ✓, potato, sweet potato, onion, garlic, shallot, pumpkin, squash | Hero |
| **Fresh Produce — Leaf** | salad leaves, berries | Hero |
| **Dairy** | milk (bottle), butter, cheese, yoghurt (pot) | Milk/Yoghurt = Reusable vessel; Butter/Cheese = Hero |
| **Frozen** | frozen bag, frozen tray | Reusable |
| **Bakery** | loaf, rolls (bagel/wrap by reuse) | Hero |
| **Kitchen Craft** | cookbook, boards, bowls, scales, tea towels | **Plate-baked** (not standalone objects) |
| **Living Dressing** | plants, microgreens, kombucha | **Plate-baked** (Set-owned residency) |

Kitchen Craft & Living Dressing are **owned by the Living Home Set** (permanent objects / dressing), not generated as Living Objects — a deliberate anti-duplication rule.

---

## 4A. Canonical Homes — every object's resting place

Every Living Object carries a **canonical home**: the position it belongs in and the vessel it rests in. This is **part of its runtime identity** (a `canonicalHome` field: `{ position, restsIn }`) — the runtime already encodes it as the object's placement in `ZONES` / `GROUPS`; here it is formalised so consistency is maintained across every present and future Living Home Set. When an object is put back, this is where it returns.

| Living Object(s) | Canonical position | Rests in / on |
|---|---|---|
| **Flour**, sugar, baking staples | Pantry Shelves | **clip-top jar on the shelf** |
| Grains, oats, barley, couscous | Pantry Shelves | clip-top jar |
| Rice & pasta | Pantry Shelves | clip-top jar |
| Pulses (dry) | Pantry Shelves | clip-top jar |
| Oils & vinegars | Pantry Shelves | **glass bottle** on the shelf |
| **Tea**, coffee, cocoa, herbal | Tea & Coffee | **tea/coffee canister** |
| **Apple**, banana, pear, orange, satsuma, mango, avocado | Fruit | **fruit basket** |
| Watermelon, pineapple, pumpkin, squash | Kitchen Worktop | on the worktop |
| Broccoli, leaf veg | Kitchen Worktop / Fridge | worktop / fridge shelf |
| **Potatoes**, sweet potatoes, onions, garlic, shallots | Root Vegetable Rack | **wire rack** |
| **Milk** | Fridge | **fridge door** |
| Butter, cheese, eggs, yoghurt, berries, salad, condiments, leftovers | Fridge | fridge shelf / door |
| Tinned fish, soups, beans, tomatoes, tinned veg, coconut | Store Cupboard | **tin on the cupboard shelf** |
| Frozen veg, fruit, meat, fish, prepared meals | Freezer | freezer drawer (frozen bag) |
| **Bread**, rolls, wraps, bagels | Bread store | **bread bin** |

**Law of the canonical home:** an object's home is stable across Sets and cameras. The room owns the *location*; the object knows *which* location is its home. Placement is never re-invented per camera — it is read from the object's identity.

---

## 5. Hero Objects vs Reusable Objects

Two formal production classes:

- **Hero Object** — unique artwork; its identity *is* the picture. One asset = one identity.
  *Apple, banana, potato, butter, cheese, loaf.* (~19 masters.)
- **Reusable Object** — one master serving **many runtime identities** via a runtime label/variant; the artwork is a container, the identity is data.
  *Tin → 24 tinned goods · Jar → 27 dry goods · Bottle → oils/vinegars · Canister → tea/coffee · Milk bottle → whole/semi/oat (cap colour) · Frozen bag → 5.* (~11 masters.)

**Governing ratio:** ~30 masters serve ~90 runtime items. **Reusable-first**: a new item joins by reusing a master + label before any Hero is commissioned. Heroes are reserved for objects whose recognisable form carries meaning.

---

## 6. Animation Asset register

Animation was absent from the inventory; it is registered here as reusable production assets. **Implemented** ones cite their real values; **needed** ones are specced, not built.

| Animation | Status | Definition (implemented) / intent (needed) |
|---|---|---|
| Camera Transition | 🟢 Implemented | plate crossfade `opacity 0.6s` + `scale 0.9s` |
| Working Position Entry | 🟢 Implemented | `lh-approach 0.5s cubic-bezier(.22,.61,.36,1)` |
| Working Position Exit | 🟡 Partial | currently the crossfade; explicit exit hook to add |
| Object Hover | 🟢 Implemented | lift `translateY(-3px)` + light-catch `opacity 0.22s` |
| Object Quiet-Discover (hint) | 🟢 Implemented | `lh-glow` + `lh-liftbreathe` 3.4s |
| Object Pick Up | 🟢 Implemented | DragOverlay ghost follows hand; source dims `opacity .26` |
| Object Drop | 🟢 Implemented | destination `lh-breathe 1.6s` (armed); bin lid lifts `-8px rotate -9°` on over |
| Companion Attention | 🟢 Implemented | `companion-breathe/speak/listen` states via `.companion-light` |
| Fridge Opening | 🔴 Needed | door swing (today the plate is a static open state) |
| Freezer Opening | 🔴 Needed | drawer pull |
| Cupboard Opening | 🔴 Needed | door swing |
| Drawer Opening | 🔴 Needed | drawer pull |

All motion honours `prefers-reduced-motion` (8 guards present). The four "Opening" animations are the only genuine animation **gaps**; they are enhancements, not blockers, and do **not** require image generation (they animate existing plates/joinery).

---

## 7. Asset Status dashboard

Canonical statuses: **Approved · In Review · Needs Polish · Needs Regeneration · Needs Generation · Deprecated.**

| Asset | Type | Status |
|---|---|---|
| `arrival.png` (v6) | Plate | 🟢 Approved |
| `shelf.png`, `work-fridge`, `work-tea-coffee`, `work-fruit`, `work-bread`, `work-cupboard`, `work-rootveg` | Plate | 🟢 Approved (dedicated cameras) |
| `work-freezer`, `work-baskets` | Plate | 🟡 Needs Polish — v5/v6 dressing-continuity check (low priority) |
| 5 wired jars + 7 approved jar masters | Object (Reusable/Glass) | 🟢 Approved |
| 20 candidate jars (on disk, not wired) | Object | 🟠 In Review (governed candidates) |
| `apple-red`, `broccoli` | Object (Hero) | 🟢 Approved |
| `companion-mark.png` | Brand | 🟢 Approved |
| 10 joinery masters | Furniture | 🟢 Approved (Set-owned) |
| 6 seasonal dressing SVGs | Dressing | 🟠 In Review (dormant) |
| tin · bottle · milk bottle · yoghurt pot · canister · ceramic pot · egg box · frozen bag · bread bin | Object (Reusable) | 🔴 Needs Generation |
| ~19 produce/dairy/bakery heroes | Object (Hero) | 🔴 Needs Generation |
| Fridge/Freezer/Cupboard/Drawer opening | Animation | 🔴 Needs Generation (motion, not image) |

This table **is** the production dashboard; every future asset enters it with a status.

---

## 8. Governing principles

### 8.1 Canonical Spatial Continuity

> **Every camera inside the Living Pantry is another viewpoint within the SAME physical pantry. Only the camera moves; the room remains constant.**

Moving the camera must **never** introduce:

- different furniture
- different cupboards
- different baskets
- different shelving
- different bread storage
- different worktops
- different lighting
- different room proportions
- different craftsmanship

Lighting is fixed for the whole Set (one morning, **light from camera-right**) — this is also the mandatory object-lighting spec, so every object composites into the same room. This principle governs **every** Living Home Set and is the acceptance test for any new plate, camera or object: *if it could not be a photograph taken from a different spot in the one room, it is rejected.*

### 8.2 Arrival Visibility & Completeness

> **Every navigable area is already visible when you enter the pantry. Selecting an area only moves the household closer — nothing appears because it was selected.**

On arrival (`CAM-ARRIVAL`, the Orientation Environment) the household can already see the real destinations. Choosing one is a *walk toward something already there*, resolved as a camera move (crossfade), never a reveal.

**Arrival completeness checklist** — before any Arrival plate is approved, verify that **all** of these are already visible (or unambiguously implied) *before moving*:

| Destination | Visible from Arrival? |
|---|---|
| Pantry Shelves · Fruit · Bread · Cupboards | ☐ |
| Fridge · Freezer · Worktop | ☐ |
| Tea & Coffee · Root Vegetables | ☐ |

Governing consequences:
- No area may pop into existence on selection; if it can be entered, it is visible from Arrival.
- The Arrival camera must let the household **understand the complete room** at a glance.
- Navigation is spatial, not modal: moving between areas moves the camera in a room you can already see, never opens a page.

*(Where a destination is small or oblique in the current Arrival plate, that is an Arrival-plate completeness item for a polish pass — logged under §7 status, not a new mechanic.)*

### 8.3 Camera Acceptance Test *(mandatory gate for every future camera)*

Before approving **any** Working Position / plate, ask one question:

> **"Could this image genuinely have been photographed by somebody standing somewhere else inside the *same* room?"**

- **YES → approve.**
- **NO → reject.**

Automatic rejections: different cupboards · different bread bin · different fruit baskets · different shelving · different worktop · different architecture · different room proportions · a different or missing permanent prop (§1A). **Only the camera position may change.**

**A camera is not approved because it is beautiful — it is approved because it truthfully represents the same physical room.** This test is therefore the **production-quality gate for every future Living Home image**, and every approval must verify all five:

- ✅ **Canonical Room Inventory** (§1A) — the same architecture and furnishings.
- ✅ **Camera Continuity Record** (§2) — distance, direction, neighbours, expected landmarks & furniture match.
- ✅ **Spatial Recognition** (§8.4) — the household instantly knows where they are.
- ✅ **Permanent Room Identity** (§1A / §8.5) — every permanent prop is the *same* object.
- ✅ **Canonical Homes** (§4A) — Living Objects rest in their documented places.

Any single failure rejects the image, however beautiful.

### 8.4 Spatial Recognition

> **Every Working Position must preserve enough visual landmarks that the household instinctively knows where they are.**

Recurring landmarks — the same window, the same fruit baskets, the same shelving, the same worktop, the same cupboards, the same flooring, the same wall finish — are **orientation cues, not decoration.** At least one shared landmark should anchor every close camera to the wider room, so the household **never feels it has entered another kitchen.** Each camera's expected landmarks are recorded in §2.

### 8.5 Permanent Room Identity

The permanent props keep their **specific identity** across every camera (the same cookbook, basket, kombucha vessel, scales, board). Defined in **§1A → Permanent Room Identity**; restated here as a governing principle because it is an acceptance criterion, not merely inventory: a plate that shows a *different* permanent object fails §8.3.

---

## 9. Generation readiness (re-confirmed under this architecture)

The refined architecture makes the **generation batch = a Living Object Family** (shared material/lighting spec). Reviewing the library's proposed batches against this:

- **Confirmed optimal** — the prior Option B batches already align to families (Vessels, Fruit, Veg, Dairy, Bread). No restructuring needed.
- **Refined order** (unchanged principle: highest reuse first, now expressed by class):
  1. **Reusable vessels** — Tin (→24), Bottle, Canister, Milk bottle, Yoghurt pot, Egg box, Frozen bag, Bread bin *(one Family spec governs all)*
  2. **Hero produce — Fruit**
  3. **Hero produce — Root/Veg**
  4. **Hero — Dairy (butter, cheese) & Leaf (berries, salad)**
  5. **Hero — Bakery (loaf, rolls)**
- **Cost unchanged:** recommended hybrid ≈ **£3.42** (~18 images), under the £5 gate. Full detail in the library doc §6.
- **Animation** ("Opening" set) is a **separate, later** track (motion over existing plates) — no image cost.

**No batches were generated. No order was executed.**

---

## 10. Architecture compliance

**Verified:**
- **Existing Living Home Architecture extended** — Sets/Cameras/WP-Sets formalise, they do not replace, the locked model.
- **Existing Asset Library reused** — this document indexes the library's assets; it re-inventories nothing.
- **Existing Working Position Architecture reused** — WP Sets wrap the same cameras/plates already shipped.
- **No duplicate ownership** — the §0 spine assigns **exactly one owner** to every asset: the Set owns the **positions** (camera/plate/lighting/furniture/dressing/permanent-objects/regions); the object owns its **identity** and knows its **canonical home** (§4A); animations are owned by the Set / interaction layer. Position-ownership and identity-ownership meet at a home and never overlap.
- **One canonical owner for every production asset** — confirmed by the ownership table (§1) and the status dashboard (§7).

**Verified — one of each, no duplication:**
- ✅ **One canonical owner** (per asset — the §0 spine).
- ✅ **One canonical room** (`SET-PANTRY`).
- ✅ **One canonical inventory** (§1A — every camera represents it).
- ✅ **One canonical camera library** (§2, with continuity records).
- ✅ **One canonical Working Position model** (§3).
- ✅ **One canonical Living Object model** (§4 families · §4A homes · §5 Hero/Reusable).
- ✅ **One canonical interaction model** (drag → Shopping / Companion / Bin; §6 animations).
- ✅ **One canonical production asset architecture** (this document — the single governing constitution).

**Data impact:** none. No schema, no runtime, no image generation, no ownership change. Documentation only.

---

## 11. Implementation Gate — architecture COMPLETE

The complete Living Home Production Architecture has been reviewed against the mission. **No remaining architectural gaps exist:** ownership, room, inventory, cameras (with continuity records), Working Positions, object families, canonical homes, Hero/Reusable classes, animation register, asset-status dashboard, and the governing principles (Canonical Spatial Continuity · Arrival Visibility & Completeness · Camera Acceptance Test · Spatial Recognition · Permanent Room Identity) are all defined and internally consistent.

> **The Living Home Production Architecture is hereby declared COMPLETE.**

All remaining effort now moves **from architectural invention into faithful implementation**:
1. **Asset generation** — family by family, per §9, behind the £5 gate.
2. **Working Position completion** — objects seated at their canonical homes in each camera.
3. **Living Object completion** — the ~30 masters replacing the ~70 tokens.
4. **Craftsmanship** — the four "Opening" animations; permanent-prop identity across cameras.
5. **Continuity** — apply the Camera Acceptance Test & Spatial Recognition to every plate; resolve the §7 "Needs Polish" items.
6. **Interaction polish** — the approved drag model, refined.

**This architecture is now considered governing. Future implementation should *extend* this architecture rather than replace it. Any proposed architectural change must demonstrate a genuine deficiency that cannot reasonably be resolved through implementation, craftsmanship or production quality alone.** The Living Home now evolves through **craftsmanship, production quality, visual continuity and hospitality — not more architecture.**

---

## 12. Definition of Done

The Living Home now has a complete production architecture (the governing constitution) covering:
- [x] **Living Home Sets** (Set owns positions; object owns identity + **canonical home** — objects belong, not guests)
- [x] **Canonical Room Inventory** + **Permanent Room Identity** (§1A)
- [x] **Camera Library** (10 cameras) + **Camera Continuity records** (distance · direction · neighbours · landmarks · furniture)
- [x] **Working Position Sets** (camera + plate + regions + layout + nav + entry/exit)
- [x] **Living Object Families** (every object declares one; craft/dressing are Set-owned)
- [x] **Canonical Homes** (every object's documented resting place — part of runtime identity)
- [x] **Hero vs Reusable** classes (~30 masters → ~90 identities)
- [x] **Animation Assets** register (implemented values + the 4 "Opening" gaps)
- [x] **Asset Status** dashboard (6 statuses across the full inventory)
- [x] Governing principles: **Canonical Spatial Continuity · Arrival Visibility & Completeness · Camera Acceptance Test · Spatial Recognition · Permanent Room Identity**
- [x] **Generation Readiness** re-confirmation
- [x] **Implementation Gate** — architecture declared COMPLETE; effort moves to implementation

Future work should focus on **faithfully implementing** this architecture rather than extending it. The next image-generation programme proceeds **from this architecture**, family by family, behind the £5 approval gate — never from individual requests.

**Scope lock:** no image generation until explicitly approved.

---

## 13. Living Home Production Review Checklist

Every new **Working Position, Camera and Environment Plate** must pass this review before approval. It operationalises the Camera Acceptance Test (§8.3) and the governing principles (§8) into one gate — a single failed box rejects the asset.

**Truth of the room**
- ☐ Could this image genuinely have been photographed from another position inside the **same** room?
- ☐ Can the household **immediately recognise where they are**?
- ☐ Does the camera **faithfully represent the Canonical Room Inventory** (§1A)?
- ☐ Are **all permanent objects still the same objects** (§8.5)?
- ☐ Are all **Living Objects resting in their Canonical Homes** (§4A)?

**Continuity of the room**
- ☐ Has **no permanent furniture appeared**?
- ☐ Has **no permanent furniture disappeared**?
- ☐ Is the **lighting consistent** with the Living Home Set (one morning, light from camera-right)?
- ☐ Are the **expected landmarks visible** (§2 continuity record · §8.4)?

**Craft & hospitality**
- ☐ Does the room still **feel handcrafted**?
- ☐ Does this refinement **reduce effort**?
- ☐ Does this refinement **increase hospitality**?
- ☐ Would the **homeowner proudly keep this room exactly as presented**?

---

## 14. Final architectural declaration

> **The Living Home Production Architecture is now the governing constitution for all Living Home environments.**
>
> Future work should improve **craftsmanship, hospitality, continuity and production quality**.
>
> Future work should **not redesign the architecture** unless a **genuine architectural deficiency** has been demonstrated — one that cannot reasonably be resolved through implementation, craftsmanship or production quality alone.
>
> This document is permanent. Implementation is measured against it.
