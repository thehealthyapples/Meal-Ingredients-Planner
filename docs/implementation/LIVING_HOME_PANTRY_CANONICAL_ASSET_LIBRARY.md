# Living Home — Canonical Pantry Asset Library

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — audit & plan only. **No functionality, no generation.**
**Branch:** `feat/living-larder-authoritative`
**Rollback identifier:** `rollback/living-home-asset-audit-base` → `e1b38dc8` *(doc-only pass — nothing to roll back; no code or assets changed)*.
**Locked & unchanged:** Living Home Concept, Architecture, Working Position Architecture, Navigation Model, Living Object Model.

> **Success is not more images.** Success is knowing exactly what a production-quality Living Pantry needs, expressed as **one reusable asset library** and a **controlled generation plan** held behind approval. Nothing below has been generated.

---

## 1. Method & ground truth

Inventoried from the repository as it stands:

- **Environment Plates (in use):** `client/public/images/living-home/room/` → **10 PNG plates**.
- **Glass jar vessels:** `client/src/assets/living-home/larder/jars/` → **27 PNGs on disk**; **7 approved + wired** (larder-room, with render metrics); **5 wired into the `/pantry` runtime**; the rest are governed **candidates** (not in runtime).
- **Produce objects:** `.../produce/` → **2** (`apple-red`, `broccoli`).
- **Joinery (furniture):** `.../joinery/` → **10** (used by the front-on elevation; the `/pantry` plates carry their furniture baked in).
- **Dressing:** `.../dressing/` → **6 seasonal SVGs** (dormant).
- **Runtime demand:** `client/src/pages/living-home-room.tsx` declares **~90 distinct leaf Living Objects** across 14 Working Positions/areas.

**Headline finding:** Environment Plates are essentially **complete** for the locked model. The real gap is the **Living Object library** — today ~90 runtime items resolve to only **7 photoreal masters (5 jars + 2 produce)**; everything else renders as an honest chalk **token**. The fix is **not 90 assets** — it is a **small set of reusable vessel masters + hero produce**, because one vessel serves dozens of items by label/content.

---

## 2. Working Position audit

Legend — 🟢 complete · 🟡 partial (plate done, objects missing) · 🔴 missing · ⚪ optional/decision.

| Working Position | Environment Plate | Living Objects present | Missing Living Objects | Notes / reuse |
|---|---|---|---|---|
| **Arrival** | 🟢 `arrival.png` (v6: veg rack, hanging microgreens, tapped kombucha) | Scene dressing only (correct — Orientation Environment) | — | No interactive objects by design. |
| **Pantry Shelves** | 🟢 `shelf.png` | 🟢 5 jars wired (+ 7 approved, 27 on disk) | Long-tail dry-goods **content variants** only | **One jar master → all dry goods.** Strongest coverage. |
| **Store Cupboard** | 🟢 `work-cupboard.png` (doors open) | 🔴 none (all 24 items are tokens) | **Tin master** (unlocks all 24) | **One tin → tuna/beans/tomatoes/soup/corn/coconut…** highest-leverage asset. |
| **Fridge** | 🟢 `work-fridge.png` (front-on, open) | 🔴 none | milk bottle, yoghurt pot, butter, cheese, egg box, berries, salad | Vessels reused; dairy = hero objects. |
| **Freezer** | 🟢 `work-freezer.png` | 🔴 none | **frozen-bag master** (→ veg/fruit/meat/fish/meals) | One bag → all 5. |
| **Fruit (bowl)** | 🟢 `work-fruit.png` | 🟡 apple only | banana, pear, orange, satsuma, mango, avocado | Hero produce batch. |
| **Kitchen Worktop** | 🟢 `work-baskets.png` | 🟡 broccoli only | watermelon, pineapple, pumpkin, squash | Large produce. |
| **Root Vegetables** | 🟢 `work-rootveg.png` | 🔴 none | potato, sweet potato, onion, garlic, shallot | Hero produce batch. |
| **Bread** | 🟢 `work-bread.png` | 🔴 none | loaf, rolls (bagel/wrap by reuse); bread-bin object | Bin currently baked into plate. |
| **Tea & Coffee** | 🟢 `work-tea-coffee.png` | 🔴 none | **canister master** (→ tea/coffee/cocoa/herbal) | One canister → all 4. |
| **Oils & Vinegars** | 🟢 (a Shelves group) | 🔴 none | **bottle master** (→ olive/sunflower/balsamic/wine vinegar) | Currently a shelf group, not its own plate. |
| **Herbs** | ⚪ none (microgreens live in Arrival) | — | ⚪ (spice-rack joinery exists) | **Not a current Working Position.** Adding one touches the **locked Navigation Model** → out of scope; decision-gated. |
| **Spices** | ⚪ none (small spice jar exists — `chia`, sizeClass small) | small spice jar | ⚪ dedicated plate | Reuse the small jar; dedicated position optional. |
| **Frozen/Prepared** | (within Freezer) | — | frozen-bag, meal tray | Covered by Freezer batch. |

**Environment Plates: no core plate is missing.** Optional new plates (⚪, all decision-gated because they’d extend the locked navigation): *Herb position, dedicated Spice position, dedicated Oils position, true Fridge/Freezer interiors* (current fridge/freezer are front-on-open, which is acceptable).

---

## 3. Canonical Living Object library (the reusable register)

The library is **vessels + heroes + content**, not one-asset-per-ingredient.

### 3A. GLASS — vessel masters
| Master | Status | Reuse (one master → many) |
|---|---|---|
| Clip-top storage jar — **large** | 🟢 exists (27 content fills) | all large dry goods |
| Clip-top storage jar — **small / spice** | 🟢 exists (`chia`, small) | spices, seeds, small goods |
| Storage jar — **medium** | 🟡 derivable from large | mid dry goods |
| **Glass bottle** (oil/vinegar) | 🔴 missing | olive/sunflower/veg oil · balsamic/white-wine/malt vinegar |
| **Milk bottle** | 🔴 missing | whole/semi/skimmed/oat/soy (cap-colour label) |
| **Yoghurt pot** | 🔴 missing | all yoghurts |
| Kombucha vessel w/ tap | 🟢 in Arrival plate (baked) | — (scene, not an object) |
| Jam jar | 🟡 = small jar reuse | jams/preserves |

### 3B. PRESERVATION / CONTAINERS
| Master | Status | Reuse |
|---|---|---|
| **Tin / can** | 🔴 missing | **entire Store Cupboard — 24 items** (fish, soup, beans, tomatoes, veg, coconut) |
| **Canister** (tea/coffee) | 🔴 missing | black tea, herbal, coffee, cocoa |
| **Ceramic storage pot** | 🔴 missing (in plates) | sugar/flour alt, dry staples |
| **Bread bin** | 🟡 baked into bread plate | bread store |
| **Egg box** | 🔴 missing | eggs |
| **Frozen bag** | 🔴 missing | frozen veg/fruit/meat/fish/meals |
| **Wire veg basket / fruit basket / crate** | 🟡 baked into plates | ⚪ only needed if baskets become movable objects |

### 3C. FOOD — hero produce & dairy (photoreal objects)
| Group | Present | Missing heroes |
|---|---|---|
| Fruit | apple 🟢 | banana, pear, orange, satsuma, mango, avocado |
| Worktop veg | broccoli 🟢 | watermelon, pineapple, pumpkin, squash |
| Root veg | — | potato, sweet potato, onion, garlic, shallot |
| Fresh/greens | — | berries, salad leaves |
| Dairy | — | butter, cheese |
| Bread | — | loaf, rolls |

### 3D. DRY CONTENT (already covered by jar reuse)
Flour, oats, rice (white/brown/mixed), penne & fusilli (white/wholemeal), couscous, barley, quinoa, granola, chia, pumpkin/sunflower seeds, ground almonds, mixed nuts, dried chickpeas, kidney/black/cannellini beans, green/red lentils, sugar → **27 content fills exist**; long-tail via label on the same jar. **No new glass needed for dry goods.**

### 3E. CRAFTSMANSHIP (stay baked into plates — NOT Living Objects)
Cookbook, scales, mixing bowls, chopping boards, tea towel, microgreens, plants, wooden-spoon pot, knife block → these are **Environment-Plate dressing**, already present in Arrival/work plates. Generating them as separate objects is **explicitly not required** (reuse insight).

---

## 4. Object-reuse matrix (the core economy)

| One master | Serves | Items covered | Ratio |
|---|---|---|---|
| **Tin** | Store Cupboard | 24 | 1 → 24 |
| **Jar (existing)** | Shelves dry goods | ~27 | 1 → 27 |
| **Bottle** | Oils & vinegars + condiments | 4–6 | 1 → 6 |
| **Frozen bag** | Freezer | 5 | 1 → 5 |
| **Canister** | Tea & Coffee | 4 | 1 → 4 |
| **Milk bottle** | Milk variants | 5+ | 1 → 5 |
| **Yoghurt pot / egg box** | Fridge staples | 2+ | 1 → n |

**~11 vessel masters replace ~70 tokens.** Hero produce (~19) is the only genuinely per-item set.

---

## 5. Quality review of existing assets

| Check | Finding | Action |
|---|---|---|
| **Room / dressing continuity** | `arrival.png` is v6 (veg rack, microgreens, kombucha); some `work-*` plates were edited from **v5** dressing → subtle mismatch. | 🟡 Low-priority: optional regen of affected work plates from a v6 base. |
| **Camera continuity** | Each Working Position has its **own dedicated camera** (per the Camera-Consistency pass). | 🟢 Good. |
| **Glass realism** | Jar masters use a CSS mask that fades the empty upper glass so the room shows through; consistent. | 🟢 Keep; **new glass (bottle, milk bottle) MUST follow the same treatment.** |
| **Lighting / scale** | Existing jars share **light-from-right + grounded contact shadow** at a fixed baseline. | 🔴 **Lock this into the object spec** (below) — the #1 risk for new objects. |
| **Transparency** | Objects are transparent PNGs; tokens are placeholders (not a defect — the replacement target). | Replace tokens as masters land. |
| **Produce vs jar match** | apple/broccoli carry their own lighting. | Verify against the locked light direction; regenerate if off. |
| **Tin / wood realism** | No tin master yet; wood is plate-baked (consistent). | Tin spec must match jar studio setup. |

**Canonical object spec (must govern every new object master):** transparent PNG · **light from camera-right** · soft grounded contact shadow · single centred object · consistent baseline & scale reference · neutral/no background · same resolution family as jars. This single spec is what makes the library composite as one coherent room.

---

## 6. Generation strategy (batches · order · cost) — **awaiting approval**

Per-image reference: **gpt-image-2, 1536×1024, high ≈ £0.19/image** (the established pipeline in `scripts/generate-environment-plate.py`).

**Batches (smallest sensible, grouped so one spec governs each):**

| Batch | Contents | Objects | Approach |
|---|---|---|---|
| **B1 — Vessels & containers** | tin, glass bottle, milk bottle, yoghurt pot, canister, ceramic pot, egg box, frozen bag, bread bin | 9 | high-reuse → generate as **singles** for fidelity |
| **B2 — Fruit heroes** | banana, pear, orange, satsuma, mango, avocado | 6 | contact-sheet or singles |
| **B3 — Veg / root heroes** | potato, sweet potato, onion, garlic, shallot, pumpkin, squash, pineapple, watermelon | 9 | contact-sheet or singles |
| **B4 — Dairy & greens** | butter, cheese, berries, salad | 4 | singles |
| **B5 — Bread** | loaf, rolls | 2 | singles |
| **B6 — Baskets (optional ⚪)** | wire basket, fruit basket, crate | 3 | only if baskets become movable objects |

**Core masters (excl. optional):** **30**. With optional baskets: 33.

**Cost options:**
- **A — all singles (max fidelity):** 30 × £0.19 ≈ **£5.70** (just over the £5 gate → split across two approvals).
- **B — recommended hybrid:** vessels + dairy + bread as singles (**15** ≈ £2.85) + fruit/veg as **3 contact-sheets** (≈ £0.57, cut in post) → **~18 images ≈ £3.42**. **Under the £5 gate.**
- **C — max batching (contact-sheets throughout):** ~8 sheets ≈ **£1.52** (highest cutting/QA overhead).

**Recommended: Option B**, in this **generation order** (coverage-per-image, unlock most first):
1. **Tin** (unlocks 24) → 2. **Bottle** (oils/vinegars) → 3. **Canister** (tea/coffee) → 4. **Milk bottle, Yoghurt pot, Egg box, Frozen bag** (fridge/freezer staples) → 5. **Bread loaf + bin** → 6. **Fruit sheet** → 7. **Veg/root sheet** → 8. **Dairy + greens**.

**Reuse rules at runtime:** tin/bottle/canister/jar carry a **runtime label** (content name), never a redrawn food; milk-bottle cap colour encodes the variant; existing baked-content jars serve the common dry goods; frozen bag + label serves all frozen. This keeps the library at ~30 masters for ~90 items and prevents duplication.

---

## 7. Architecture compliance

- Living Home Concept / Architecture / Working Position / Navigation / Living Object Model — **all reused, none changed**.
- No new functionality. No schema, ownership, or route change. **No image generated.**
- New Working Positions (Herbs/Spices/Oils/interiors) are flagged **decision-gated** precisely because they would touch the **locked Navigation Model** — surfaced, not implemented.
- Generation remains behind the existing **£5 approval gate**; nothing proceeds without sign-off on §6.

---

## 8. Definition of Done — status

- [x] Every approved Working Position audited (plates, present objects, missing objects, quality, reuse).
- [x] One **canonical reusable object library** defined (vessels + heroes + content), with a **reuse matrix** proving ~30 masters cover ~90 runtime items.
- [x] Environment Plates confirmed **complete** for the locked model; optional positions flagged, not built.
- [x] **Quality review** complete, with the canonical object spec that guarantees continuity.
- [x] **Controlled generation plan** — batches, order, and cost (recommended **Option B ≈ £3.42**, under the gate) — **held for approval**.
- [x] **Nothing generated.**

**Next step (requires explicit approval):** authorise §6 Option B and generate **Batch B1** in the stated order, starting with the **Tin** (highest reuse). No generation until then.
