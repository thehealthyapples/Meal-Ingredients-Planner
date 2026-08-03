# Living Home — Dynamic Living Object Implementation Review

**Date:** 2026-08-03 · **Risk:** 🟡 AMBER — investigation & plan only. **No implementation. No generation.**
**Branch:** `feat/living-larder-authoritative`
**Rollback identifier:** **`rollback/living-pantry-dynamic-objects-base` → `5b1e00d0`** *(repo clean; synced with `origin/claude-work`; nothing modified in this pass).*
**Governs:** the Living Home Production Asset Architecture (constitution). This review corrects an implementation drift; it proposes no architectural change.

> **Do not begin asset generation.** Await Home Owner approval of the recommended sequence and cost below.

---

## 1. Architecture compliance — the governing principle

| Environment Plate OWNS | Living Object OWNS |
|---|---|
| room · furniture · shelves · drawers · door racks · worktops · lighting · permanent architecture | food · containers · bottles · jars · produce · tins · bread · drinks |

The household must always interact with **Living Objects** — never with coordinates, floating labels, or invisible zones over a photograph. A Living Object must be able to **move, be removed, and reflect inventory**. That is only possible when the plate is **empty of food** and the object is an **independent asset placed on it**.

---

## 2. Current implementation drift (verified in-repo)

**The Pantry Shelves are correct.** `client/public/images/living-home/room/shelf.png` is a **genuinely empty** plate — bare oak shelves + permanent props only (bowl, tea towel, scoop, rolling pin, basket), **no food baked in**. The jar Living Objects (`tha-larder-jar-*.png`) are **independent assets placed on it** at runtime. They can be moved, swapped and (once wired) removed. ✅

**Every other object-bearing Working Position has drifted.** Their plates are **full — the food is painted into the photograph** — so the runtime overlays **coordinate-positioned hover zones / name labels** on top of a picture:

| Working Position | Plate | Food source | Interaction today | Verdict |
|---|---|---|---|---|
| Pantry Shelves | `shelf.png` | **empty plate + jar objects** | independent objects (POINTS) | 🟢 Correct |
| Arrival | `arrival.png` | dressing only (orientation) | none (nav only) | 🟢 N/A — no objects by design |
| **Fridge** | `work-fridge.png` | **baked-in** (milk, cheese, eggs…) | `HOMES` coordinate hotspots | 🔴 Drift |
| **Fruit** | `work-fruit.png` | **baked-in** (basket of fruit) | `HOMES` hotspots (+1 real apple) | 🔴 Drift |
| **Kitchen Worktop** | `work-baskets.png` | **baked-in** (wide room + baskets) | `HOMES` hotspots | 🔴 Drift (also redundant plate) |
| **Root Vegetables** | `work-rootveg.png` | **baked-in** (rack of veg) | `HOMES` hotspots | 🔴 Drift |
| **Bread** | `work-bread.png` | **baked-in** (loaves on board) | `HOMES` hotspots | 🔴 Drift |
| **Tea & Coffee** | `work-tea-coffee.png` | **baked-in** (canisters) | `HOMES` hotspots | 🔴 Drift |
| **Store Cupboard** | `work-cupboard.png` | **baked-in** (tins) | `CAT_HOMES` hotspots + drill | 🔴 Drift |
| **Freezer** | `work-freezer.png` | **baked-in** (frozen bags in drawer) | `HOMES` hotspots | 🔴 Drift |

**Consequences of the drift** (why this must be corrected): baked-in food **cannot** be moved, removed, or made to reflect real inventory; the bin gesture can only *hide a hotspot*, not remove an object; drag has nothing physical to carry; and the interaction model is **inconsistent** (shelves ≠ everywhere else). The recent fridge Salad/Condiments/Pickles work sits on top of this drifted foundation — hence the instruction to **stop extending it** until conversion.

---

## 3. Existing reusable assets (repository review)

**Environment Plates (10 in use):** listed above. **Empty plates available: only the shelf** — `shelf.png` (in use) + `artifacts/living-home-environment-plates/shelf/shelf-empty-backup.png`. No empty fridge/fruit/tea/cupboard/root-veg/bread/freezer plates exist.

**Reusable Living Object masters:**
- **27 clip-top jars** (`tha-larder-jar-*.png`) — dry goods (flours, grains, rice, pasta, pulses, seeds, nuts, sugar) + 1 **empty jar** + 1 fallback. *Reusable across all pantry-shelf staples.* ✅
- **2 produce** — `apple-red`, `broccoli`. ✅ (only two)
- **10 joinery** furniture PNGs (shelves, cupboards, drawers, tables) — used by the **alternate** composed elevation `client/src/pages/larder-room.tsx`, **not** the photographic `/pantry`. Parallel system; not directly reused by the plates.

**Existing reference for the correct mechanics:** `larder-room.tsx` already implements **independent objects + real drag + move/bin + `/api/pantry` inventory** (dnd-kit `useDraggable`, `shopping`/`bin` droppables, soft-delete + restore). It proves the dynamic model end-to-end and is the behavioural template — the Living Home needs the same mechanics on its **photographic empty plates**.

---

## 4. Missing reusable assets (gap analysis)

**Two things are missing for every drifted position: (a) an EMPTY plate, and (b) independent food-object masters.**

### 4A. Empty Environment Plates — **missing (7)**
Empty fridge interior · empty fruit bowl/baskets · empty root-veg rack · empty bread store/board · empty tea & coffee station · empty store-cupboard shelves · empty freezer drawers. *(Kitchen Worktop plate is a redundant wide-room view — recommend fold, not a new empty plate.)*
Each is either **generated fresh empty** or **edited from the existing full plate** (inpaint the food out) — the edit route preserves the exact room, furniture, camera and lighting, which best satisfies the Camera Acceptance Test.

### 4B. Living Object masters — reuse-first
| Class | Master | Serves (reuse) | Status |
|---|---|---|---|
| Vessel | **Tin** | all Store Cupboard (fish, soup, beans, tomatoes, tinned veg, coconut ≈ 24) | 🔴 need |
| Vessel | **Glass bottle** | oils, ketchup, brown sauce | 🔴 need |
| Vessel | **Milk bottle** | whole/semi/skimmed/oat/soy | 🔴 need |
| Vessel | **Canister** | tea, coffee, cocoa, sugar | 🔴 need |
| Vessel | **Fridge jar** (small) | mustard, mayo, chutney, pickles, jam | 🔴 need |
| Vessel | **Yoghurt pot** | all yoghurts | 🔴 need |
| Vessel | **Egg box** | eggs | 🔴 need |
| Vessel | **Frozen bag** | frozen veg/fruit/meat/fish/meals | 🔴 need |
| Vessel | Clip-top jar | all dry goods (27 fills) | 🟢 have |
| Hero | Fruit | banana, pear, orange, satsuma | 🔴 need (apple ✅) |
| Hero | Root veg | potato, sweet potato, onion, garlic, shallot | 🔴 need |
| Hero | Salad veg | lettuce, tomato, cucumber, pepper | 🔴 need |
| Hero | Dairy | cheese, butter | 🔴 need |
| Hero | Berries | punnet | 🔴 need |
| Hero | Bakery | loaf, rolls | 🔴 need (broccoli ✅ but unused) |

---

## 5. Minimum asset generation required & estimated cost

**Reuse-first minimum to convert *all* positions:**
- **Empty plates: 7** (fridge, fruit, root-veg, bread, tea, cupboard, freezer).
- **New object masters: ~25** (8 reusable vessels + ~17 hero foods). One Tin alone unlocks ~24 cupboard identities; one Canister → 4; one Milk bottle → 5.

**Cost (gpt-image-2, 1536×1024, high ≈ £0.19/image):**
| Set | Count | Singles | Batched (contact-sheet) |
|---|---|---|---|
| Empty plates | 7 | ≈ £1.33 | ≈ £1.33 (plates don't batch) |
| Vessel masters | 8 | ≈ £1.52 | ≈ £0.57 (2 sheets) |
| Hero foods | ~17 | ≈ £3.23 | ≈ £0.95 (3 sheets) |
| **Total** | **~32** | **≈ £6.08** | **≈ £2.85** |

Singles exceed the **£5 gate** and must be **split across approvals**; the batched/hybrid route (~£2.85) fits under it. **Nothing is generated until approved.**

---

## 6. Recommended implementation sequence (prove, then roll out)

Convert **one position first as the reference**, validate true movement/removal, then extend position-by-position, retiring each position's hotspot code as it converts. Each position: **empty plate → place independent object masters (POINTS-style, exactly like the shelves) → wire drag/bin/hover → verify → retire its `HOMES` block.**

| Phase | Position | New assets | Why first / reuse | ~Cost |
|---|---|---|---|---|
| **0 — Proof** | **Fridge** | empty fridge plate + milk bottle, egg box, cheese, butter, yoghurt pot, berries punnet, fridge jar | richest position; proves objects move/remove; most vessels reused later | ≈ £1.5 |
| 1 | **Store Cupboard** | empty cupboard plate + **Tin** | one tin → ~24 identities (highest leverage) | ≈ £0.4 |
| 2 | **Tea & Coffee** | empty station plate + **Canister** | 1 → 4 | ≈ £0.4 |
| 3 | **Fruit** (+ fold Worktop) | empty fruit plate + banana, pear, orange, satsuma | apple ✅; retire redundant worktop | ≈ £1.0 |
| 4 | **Root Vegetables** | empty rack plate + potato, sweet potato, onion, garlic, shallot | — | ≈ £1.1 |
| 5 | **Bread** | empty bread plate + loaf, rolls | — | ≈ £0.6 |
| 6 | **Freezer** | empty drawer plate + **Frozen bag** | 1 → 5 | ≈ £0.4 |

The Pantry Shelves are the pattern; Arrival stays as the orientation environment (no objects). Prefer **editing** each full plate to empty it (preserves the exact room → Camera Acceptance) over fresh generation where feasible.

---

## 7. Data impact

- **No schema change** required to convert rendering (objects become placed PNGs, as the shelves already are).
- **Runtime change** per position: replace the `HOMES`/`CAT_HOMES` coordinate-hotspot rendering with independent object placement (the shelves' `POINTS` model). The `HOMES` maps are retired as each position converts.
- **Optional future** (not required now): make each position's object list **data-driven from `/api/pantry`** (as `larder-room.tsx` already does) so the bin/move/inventory are real. This is a follow-on, not part of the asset conversion.
- **No ownership change.** Shopping intent, Companion, Navigation, Living Object Model unchanged.

---

## 8. Rollback plan

- **Tag reported:** `rollback/living-pantry-dynamic-objects-base` → `5b1e00d0` (current HEAD, pushed to `claude-work`).
- Each phase is an isolated, reversible commit: the empty plate and its wiring can be reverted independently; the previous full plate + `HOMES` block restores the prior state.
- No destructive changes; existing full plates are retained in `artifacts/` (as the shelf already is) rather than deleted.

---

## 9. Verification plan (per converted position)

1. **Independence:** each food renders as its own PNG on the **empty** plate (no baked-in food behind it).
2. **Movement/removal:** dragging to the **Kitchen bin** visibly **removes the object** (now possible — it is not painted in); undo restores it.
3. **Universal drag:** object → Shopping / Companion / Bin all work (Shopping still infers quantity).
4. **Hover-only names** preserved; **no label sits over unrelated food** (there is no baked food to lie over).
5. **Camera Acceptance:** the empty plate is the same room/furniture/lighting as before (edit route preferred to guarantee this).
6. **Consistency:** the position now behaves **identically** to the Pantry Shelves.
7. **Capture** before/after evidence; confirm no console errors.

---

## 10. Definition of done (this investigation)

- [x] Repository reviewed; plates and reusable objects inventoried.
- [x] Drift confirmed with evidence: shelves = empty-plate + independent objects; all other positions = baked-in food + coordinate hotspots.
- [x] Existing reusable assets and missing assets identified.
- [x] Minimum generation (**7 empty plates + ~25 object masters ≈ £2.85 batched / £6.08 singles**) and cost estimated.
- [x] Phased implementation order recommended (Fridge first as proof).
- [x] Data impact, rollback identifier, and verification plan reported.
- [x] **Nothing generated; nothing implemented.**

**STOP — awaiting Home Owner approval before generating any new Living Object assets.** On approval, recommend starting with **Phase 0 (Fridge)** as the reference conversion.
