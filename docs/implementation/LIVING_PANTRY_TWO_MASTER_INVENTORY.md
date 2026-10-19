# Living Pantry — Two‑Master Inventory (Corrected, Evidence‑Only)

**Date:** 2026-08-06 · **Risk:** 🟡 AMBER · **Status: inventory only — no code, no wiring, no generation.**
**Method:** every plate **visually inspected** (rendered pixels), classified against the canonical fixtures in `arrival.png`. Nothing marked Verified by inference.
**Evidence:** [V]erified (viewed) · [I]nferred · [A]ssumed.

## Canonical fixtures visible in Arrival (`arrival.png`) [V]
- **Fridge/Freezer:** LEFT — an **integrated wood‑panelled** unit, brass handles, **fridge above / freezer below** (matches the cabinetry).
- **Pantry Shelves:** CENTRE — three open timber shelves of clip‑top glass jars.
- **Kitchen Worktop:** CENTRE‑LOW — stone‑topped timber cabinet (scale, bowl, board, kombucha dispenser).
- **Fruit:** RIGHT — wicker fruit baskets by the window.
- **Root Veg Rack:** RIGHT‑FLOOR — 3‑tier black wire rack.
- **NOT in Arrival:** a standalone larder **cupboard**, a **tea/coffee** nook, a **bread** counter — these fixtures do not appear in the canonical view (canonical status Unverified).

> **Correction confirmed (by eye):** most `work-*` plates are **populated** (food/objects baked in), not empty; several are wide **Arrival‑variants** with food baked into the wall‑shelf jars; and the stocked fridge is a **different appliance** from the canonical wood‑panelled unit.

---

## Per‑Working‑Position inventory

### 1. Pantry Shelves
1. **Canonical fixture (Arrival):** centre timber shelves of clip‑top jars. **[V]**
2. **Master A path:** `client/public/images/living-home/room/shelf.png`
3. **Master A status:** **Verified canonical and empty** — same shelves, no jars (only permanent dressing). Caveat: closer/​more frontal crop than the Arrival wide shot. **[V]**
4. **Master B path:** — none
5. **Master B status:** **Missing** — the jars‑full shelves exist only in the wider arrival/baskets/freezer crops (different camera); no populated version at the `shelf.png` crop. **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** No — no B to test. **[V]**
8. **Existing extracted objects:** none from a canonical shelf B; runtime jars are separately‑authored `tha-larder-jar-*.png`. **[V]**
9. **From approved Master B:** No. **[V]**
10. **Missing production asset:** **Master B** — the `shelf.png` shelves photographed populated with jars in their canonical homes, identical crop/lighting.

### 2. Fridge
1. **Canonical fixture:** wood‑panelled integrated fridge/freezer, brass handles, fridge above/freezer below. **[V]**
2. **Master A path:** `work-fridge-empty.png`
3. **Master A status:** **Verified canonical and empty** — wood‑panelled integrated appliance, open, empty interior, wood freezer drawer below. Minor caveat: handle rendering differs slightly from Arrival. **[V]**
4. **Master B path:** `work-fridge.png`
5. **Master B status:** **Verified but NOT canonical** — a **stainless American French‑door** fridge; a different appliance. Fails "could the doors close and return to the Arrival unit." Canonical B is therefore **Missing**. **[V]**
6. **Pixel‑compatible pair:** **No** — A (wood integrated) and B (stainless American) are different appliances and crops. **[V]**
7. **Passes Camera Truth:** **No.** **[V]**
8. **Existing extracted objects:** 10 masters in `artifacts/living-home-fridge-products/` (milk, juice, apple juice, cheddar, cream, eggs, jalapeños, olives, BBQ sauce, yoghurt). **[V]**
9. **From approved Master B:** **No** — extracted from the non‑canonical `work-fridge.png` → **candidates only; do not wire.** **[V]**
10. **Missing production asset:** **Canonical Master B** — the wood‑panelled integrated fridge (A's appliance/crop) photographed stocked.

### 3. Freezer
1. **Canonical fixture:** lower drawers of the integrated unit. **[V]**
2. **Master A path:** — (freezer shown only as a closed wood drawer in `work-fridge-empty.png`)
3. **Master A status:** **Missing** — no empty open‑freezer interior view. **[V]**
4. **Master B path:** `work-freezer.png`
5. **Master B status:** **Verified canonical fixture but populated + wrong crop** — the wide Arrival room with the freezer drawers open and full of frozen food; not a dedicated close freezer view. **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** No — no clean pair. **[V]**
8. **Existing extracted objects:** none. **[V]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** **Both** a canonical close empty Master A (open empty freezer) and a matching Master B.

### 4. Fruit
1. **Canonical fixture:** wicker fruit baskets by the window. **[V]**
2. **Master A path:** — none
3. **Master A status:** **Missing** — the only fruit view (`work-fruit.png`) is populated; no empty baskets/sill. **[V]**
4. **Master B path:** `work-fruit.png`
5. **Master B status:** **Verified canonical and populated.** **[V]**
6. **Pixel‑compatible pair:** **No** (no empty A). **[V]**
7. **Passes Camera Truth:** No. **[V]**
8. **Existing extracted objects:** none; loose organic fruit is also hard to extract discretely. **[V/I]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** **Master A** — the same baskets/sill photographed empty, identical crop.

### 5. Root Vegetables
1. **Canonical fixture:** 3‑tier black wire rack. **[V]**
2. **Master A path:** — none
3. **Master A status:** **Missing** — `work-rootveg.png` is populated; no empty rack. **[V]**
4. **Master B path:** `work-rootveg.png`
5. **Master B status:** **Verified canonical and populated.** **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** No. **[V]**
8. **Existing extracted objects:** none; loose produce hard to extract. **[V/I]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** **Master A** — empty wire rack, identical crop.

### 6. Store Cupboard
1. **Canonical fixture:** a tall standalone larder cupboard — **not visible in Arrival** (canonical Unverified). **[V absent]**
2. **Master A path:** — none
3. **Master A status:** **Missing** — `work-cupboard.png` is populated (tins/jars). **[V]**
4. **Master B path:** `work-cupboard.png`
5. **Master B status:** **Verified populated; canonical Unverified.** **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** Cannot assess. **[V]**
8. **Existing extracted objects:** none. **[V]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** canonical confirmation of the fixture **+** an empty Master A at the matching crop.

### 7. Tea & Coffee
1. **Canonical fixture:** a tea/coffee nook — **not visible in Arrival** (canonical Unverified). **[V absent]**
2. **Master A path:** — none
3. **Master A status:** **Missing** — `work-tea-coffee.png` is a populated still‑life. **[V]**
4. **Master B path:** `work-tea-coffee.png`
5. **Master B status:** **Verified populated; canonical Unverified.** **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** Cannot assess. **[V]**
8. **Existing extracted objects:** none. **[V]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** canonical confirmation **+** empty Master A.

### 8. Bread
1. **Canonical fixture:** a bread counter — **not visible in Arrival** (canonical Unverified). **[V absent]**
2. **Master A path:** — none
3. **Master A status:** **Missing** — `work-bread.png` is a populated still‑life. **[V]**
4. **Master B path:** `work-bread.png`
5. **Master B status:** **Verified populated; canonical Unverified.** **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** Cannot assess. **[V]**
8. **Existing extracted objects:** none. **[V]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** canonical confirmation **+** empty Master A.

### 9. Kitchen Worktop
1. **Canonical fixture:** stone‑topped timber worktop cabinet (scale, bowl, board, kombucha). **[V]**
2. **Master A path:** — none dedicated
3. **Master A status:** **Missing** — `work-baskets.png` is the wide Arrival‑variant, populated (jars/baskets/kombucha). **[V]**
4. **Master B path:** `work-baskets.png`
5. **Master B status:** **Verified canonical fixture but wide‑room crop, populated.** **[V]**
6. **Pixel‑compatible pair:** **No.** **[V]**
7. **Passes Camera Truth:** Cannot assess. **[V]**
8. **Existing extracted objects:** none. **[V]**
9. **From approved Master B:** n/a.
10. **Missing production asset:** a dedicated canonical worktop **empty Master A** + matching **Master B**.

---

## First implementation candidate — honest statement
**No Working Position satisfies all four conditions** (approved canonical Master A · approved canonical Master B · pixel‑compatible pair · extractable Living Objects). **[V]**

- **There is not a single pixel‑compatible A/B pair anywhere in the repository.** Every candidate pair is mismatched: either empty and populated are different crops/appliances, or one half is missing.
- **Closest (empty A verified, canonical B missing):** **Pantry Shelves** (`shelf.png`) and **Fridge** (`work-fridge-empty.png`). Each needs only its **Master B** produced at the exact crop/lighting of its empty A.
- **All other positions lack an empty Master A** (only populated plates exist); **Store Cupboard, Tea & Coffee, Bread** additionally lack canonical confirmation from Arrival.
- **Fridge extractions** exist but came from a **non‑canonical** photograph → **candidates only; not to be wired.**

**Every missing asset is a photograph (Master A and/or canonical Master B) — asset production, i.e. the Home Owner's step. No implementation can begin until at least one position has a genuine pixel‑compatible canonical pair.**

**STOP — awaiting Home Owner approval of this corrected inventory.**
