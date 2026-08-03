# The Living Pantry — Completion Report

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — faithful implementation of the governing architecture (no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-interaction-p1-base` snapshot + base `e1b38dc8`.
**Governs:** [`LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md`](../architecture/LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md) (the constitution). This report is the Pantry's quality benchmark for future rooms.

> Mission was to **complete the experience**, not every asset. The Living Pantry now feels like one handcrafted room you move around, handling the real food on its shelves.

---

## Headline outcome

The single biggest craft advance tonight: **Living Objects now rest in their Canonical Homes on the food the plate already depicts.** The plates are full of real food (milk bottles, cheese, potatoes, onions, canisters). We stopped floating labels in a band and **anchored each Living Object over its actual depicted place** — you drag the real potato, the real milk, the real cheese. This also proved that most "missing objects" from the asset library are **already rendered in-plate**, so the generation programme is now largely **optional**, not blocking.

---

## The six passes

| Pass | Priority | Status | Notes |
|---|---|---|---|
| **1 — Spatial Continuity** | ⭐⭐⭐⭐⭐ | 🟢 Done, minor polish | Every Working Position is a dedicated camera in one room; navigation is direct (Areas navigator). Two items flagged: worktop plate & arrival dressing (below). |
| **2 — Arrival Completeness** | ⭐⭐⭐⭐⭐ | 🟡 Mostly | Arrival shows shelves, fridge-freezer, fruit baskets, veg rack, window, kombucha, microgreens. Bread / cupboards / tea / freezer are implied but not all prominent — an **Arrival-plate completeness** polish item. |
| **3 — Living Objects** | ⭐⭐⭐⭐⭐ | 🟢 Done | Universal drag (Shopping · Companion · Bin) restored; **no software buttons on food**; objects anchored to **Canonical Homes** on their depicted food (root veg, fridge, tea & coffee, fruit). |
| **4 — Room Completion (generation)** | ⭐⭐⭐⭐ | ⏸ Held (by design) | Plates already depict the food ⇒ generation need **reduced to optional**. Ready batch documented; **nothing generated** (£5 gate — awaiting explicit go). |
| **5 — Craftsmanship** | ⭐⭐⭐⭐⭐ | 🟢 Done, per-plate polish | Canonical-home placement for 4 positions; existing directional shadows ground the objects; remaining positions on the honest band (below). |
| **6 — Hospitality** | ⭐⭐⭐⭐⭐ | 🟢 Done | Destinations quiet at rest, names sit on the real food, light Areas navigator, canonical Companion mark. Software recedes; the room comes forward. |

---

## Quality gate (§13 Production Review Checklist) — per position

| Working Position | Anchored to homes | Camera Acceptance | Verdict |
|---|---|---|---|
| Pantry Shelves | jars seated on shelf | ✅ | 🟢 Pass |
| Root Vegetables | ✅ potatoes/onions/shallots/garlic/sweet-potato on the veg | ✅ | 🟢 Pass |
| Fridge | ✅ milk/yoghurt/butter/cheese/berries/eggs/salad/condiments/leftovers | ✅ | 🟢 Pass |
| Tea & Coffee | ✅ over the canisters & coffee jar | ✅ | 🟢 Pass |
| Fruit | ✅ oranges/satsumas/bananas/pears/apples (mango/avocado float — not depicted) | ✅ | 🟢 Pass (2 float) |
| Store Cupboard | ➖ band (categories → tins) | ✅ | 🟡 Polish |
| Bread | ➖ band | ✅ | 🟡 Polish |
| Freezer | ➖ band | ✅ | 🟡 Polish |
| Kitchen Worktop | ✖ items not depicted in plate | ✖ plate mismatch | 🔴 Fix (below) |
| Arrival | n/a | ✅ (completeness polish) | 🟡 Polish |

---

## Remaining known issues

1. **Kitchen Worktop plate mismatch** — the worktop uses the wide `baskets` plate (apples/oranges/onions), but its items are *watermelon, pineapple, pumpkin, squash*, which the plate does **not** depict; the broccoli hero also floats. → Either **re-scope worktop items** to what the plate shows, or commission a **dedicated worktop camera** with those large produce.
2. **Arrival completeness** — not all eight destinations are prominent from Arrival (bread, cupboards, tea, freezer are oblique). → Arrival-plate polish so every destination is visible before selection (§8.2).
3. **Dressing continuity** — Arrival is v6 (veg rack, microgreens, kombucha); the older work plates (`freezer`, `baskets`) derive from v5 dressing. → Optional regen for perfect continuity (§7 "Needs Polish").
4. **Un-anchored positions** — Store Cupboard (tins), Bread, Freezer still use the honest band; Cupboard also has the categories→items depth. → Anchor to depicted homes (same technique as root veg).
5. **Fruit floats** — mango & avocado aren't in the fruit plate; they sit near-centre honestly. → hero produce or a plate that includes them.
6. **Micro-tuning** — fridge *Eggs*/*Berries* and root-veg *Garlic* labels are a few % off their food. → nudge coordinates.

## Outstanding polish items (in priority order)

1. Fix the Worktop (re-scope items **or** dedicated plate) — the only 🔴.
2. Anchor Cupboard / Bread / Freezer objects to their depicted homes (extend the `HOMES` map).
3. Arrival-plate completeness so all eight destinations read from Arrival.
4. Micro-tune the few off-by-a-little labels.
5. Optional: dressing-continuity regen of the two older work plates.
6. Optional: soft contact-shadow polish under produce/token objects.

## Assets still required (materially reduced)

Because the plates depict the food and objects are **anchored in-plate**, the earlier library batch is now **optional**, not required to ship the experience:
- **Genuinely useful next:** hero produce only where a plate lacks it and we keep the item (worktop melons; fruit mango/avocado). ~4–8 images.
- **Deferred / optional:** the reusable-vessel masters (tin, bottle, canister…) — only needed if we ever move from in-plate anchoring to per-object rendering. **Not needed for the current experience.**
- Companion mark: **done** (`companion-mark.png`).
- Cost if pursued: within the prior £3.42 estimate; still behind the £5 gate and **not generated** without explicit approval.

---

## Recommended first implementation steps — the Living Cookbook

Build it **from the governing architecture**, reusing everything the Pantry proved:

1. **Register `SET-COOKBOOK`** as a new Living Home Set — declare its Canonical Room Inventory (a warm recipe nook: the open cookbook, a reading stand/board, the same household props where they'd plausibly appear) and its cameras. It **inherits** the whole constitution.
2. **Reuse the interaction spine unchanged** — the drag model (object → destinations), the light Areas navigator, the canonical Companion mark, and the quiet permanent destinations. For the Cookbook the destinations are likely **Planner / Shopping / Companion** (recipes → plan a meal, add ingredients to shop, ask Apple).
3. **Reuse the Canonical-Home anchoring technique** — recipes/ingredients anchored to their depicted place on the open book / board, using the **same calibrated-capture placement harness** (`scripts/capture-pantry-positions.ts` pattern + the stage-coordinate calibration in this session).
4. **Vertical slice first** — Arrival (the nook, all areas visible) + **one** Working Position (the open cookbook) with real recipe Living Objects, drag working end-to-end. Then expand.
5. **Gate every plate** through the §13 Production Review Checklist and the Camera Acceptance Test (§8.3) — the Pantry is the quality bar.
6. **Do not generate** until a family-by-family plan is approved, exactly as here.

---

## Architecture compliance

- Extends the governing architecture; **no redesign**, no new architecture, no ownership change, no new interaction model.
- Living Objects now carry an explicit **Canonical Home** (§4A) — the architecture's `canonicalHome` made real in the runtime (`HOMES` map).
- Shopping intent, Companion ownership, Navigation Model, Living Object Model — all unchanged and verified (drag → Shopping still infers quantity; anchored *Onions → 1 bag*).

## Definition of Done — status

The Living Pantry **feels like one handcrafted room** a household instinctively understands: you walk between viewpoints of the same pantry and **handle the real food where it lives**. Technology recedes. Remaining work is **polish and optional assets**, itemised above — not architecture. **The Pantry is the benchmark for the Living Cookbook.**

**STOP — awaiting approval before beginning the Living Cookbook.**
