# Living Home — Working Position Audit & Production Planning

**Date:** 2026-08-03 · **Type:** Audit & production planning ONLY. **No imagery generated. No OpenAI calls. £0.00 spent.**
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-wp-audit-base` → `e1b38dc8`.
**Principle:** One Entity · One Owner · One Source of Truth · **Extend before Creating.**

## Existing production assets (the current Living Home Asset Library)

**Environment plates (promoted, in runtime `client/public/images/living-home/room/`):**
`arrival.png` (= **arrival-v6**, canonical Orientation), `shelf.png` (= **shelf-v2**, canonical Pantry), `work-fridge.png`, `work-freezer.png`, `work-cupboard.png`, `work-baskets.png`, `work-rootveg.png`, `work-bread.png`.

**Living Objects:** **29** PNGs — 27 jars + 2 produce (`client/src/assets/living-home/larder/`), reused across every variant (*one asset, many consumers*).

**Provenance note (grounds the consistency finding):** `arrival.png` is arrival-v6 (veg rack + hanging microgreens + tapped kombucha), but **all six `work-*` plates were edited from arrival-v5** (perched microgreens, untapped kombucha, no rack). So the working plates lag the arrival by one dressing revision.

## Working Position Register

Legend: 🟢 Approved – Production Ready · 🟡 Requires Craftsmanship Refinement · 🟠 Missing Working Position · 🔴 Should Not Exist / Incorrect.

### 🟢 Pantry Shelves — **Approved (canonical)**
- **Purpose:** dry staples (flours, grains, pulses, rice & pasta, oils & vinegars, baking); groups → category → Living Objects.
- **Assets:** `shelf.png` (shelf-v2). **Runtime:** full — real jar Living Objects, multi-select, tray, Ask Apple.
- **Missing:** none. **Reuse:** the 6 jar PNGs across all variants. **Regeneration required? NO** (craftsmanship-only, e.g. glass, in future). **Recommendation:** lock as canonical; do not regenerate.

### 🟢 Store Cupboard — **Approved**
- **Purpose:** tins/long-life; **doors open → categories (Tinned fish, Soups, Beans, Tomatoes, Tinned veg, Coconut) → items** (mirrors the shelf hierarchy).
- **Assets:** `work-cupboard.png`. **Runtime:** full category hierarchy + selection.
- **Missing:** none for function. **Regeneration required? NO** (optional dressing-consistency refinement — see cross-cutting item). **Recommendation:** approve; optional refinement only.

### 🟢 Freezer — **Approved**
- **Purpose:** frozen goods; drawers open → items. **Assets:** `work-freezer.png`. **Runtime:** full.
- **Missing:** none. **Regeneration? NO** (optional consistency refinement). **Recommendation:** approve.

### 🟢 Root Vegetable Rack — **Approved**
- **Purpose:** cool/dry roots (potatoes, onions, garlic, shallots, sweet potatoes) on a handcrafted black-steel wire rack. **Assets:** `work-rootveg.png` (and the rack now also appears in the Arrival, arrival-v6). **Runtime:** full.
- **Missing:** none. **Regeneration? NO.** **Recommendation:** approve.

### 🟢 Bread Store — **Approved**
- **Purpose:** bread/rolls/wraps/bagels; a wooden bread crock. **Assets:** `work-bread.png`. **Runtime:** full.
- **Missing:** none. **Regeneration? NO.** **Recommendation:** approve.

### 🟢 Fruit Bowl — **Approved (via reuse)**
- **Purpose:** ready-to-eat fruit. **Assets:** **reuses `work-baskets.png`** (willow baskets of fruit — a valid fruit environment). **Runtime:** full (items + selection).
- **Missing:** none. **Reuse:** `work-baskets.png` (no new asset). **Regeneration? NO.** **Recommendation:** approve reuse; a bespoke bowl plate is *not* required.

### 🟠 Kitchen Worktop — **Missing (low priority) / reuse acceptable**
- **Purpose:** large fruit that stays out (watermelon, pineapple, pumpkin, squash). **Assets:** currently **shares `work-baskets.png`**, which shows *small* fruit, not large produce. **Runtime:** wired (items + selection).
- **Missing:** a dedicated large-fruit worktop environment (weak reuse). **Regeneration? OPTIONAL** — reuse of `work-baskets.png` is an acceptable stopgap. **Recommendation:** lowest priority; only generate if you want it distinct.

### 🔴 Fridge (current) — **Incorrect direction** → replace
- **Current asset `work-fridge.png`:** a *side view with a partly-open door* — nobody stands to the side of an American fridge. Flagged unacceptable in Pass 03 (#3).
- **Recommendation:** **retire** this side-view plate; replace with a front-on Fridge Working Position (below). *One owner — do not keep both.*

### 🟠 Fridge (front-on) — **Missing (required)**
- **Purpose:** stand in front; **both doors fully open**; interior becomes the Working Position (LED, glass shelves, crisp drawers, bottle/door racks, dairy shelf) with ~40 representative foods.
- **Assets:** **none exist.** **Regeneration required? YES.** **Recommendation:** generate (highest priority).

### 🟠 Tea & Coffee — **Missing (recommended)**
- **Purpose:** the drinks station (teas, herbal teas, coffee, hot chocolate). **Assets:** currently **shares `shelf.png`** (empty shelves — not a drinks station). **Runtime:** wired (items + selection).
- **Missing:** a dedicated tea & coffee environment. **Regeneration? YES (recommended).** **Recommendation:** generate after the fridge.

### 🟢 Arrival (Orientation Environment) — **Approved** (context, not a Working Position)
- `arrival.png` (arrival-v6): stocked shelves, fridge/freezer, cupboards, fruit baskets, root-veg rack, hanging microgreens, tapped kombucha. Representative dressing only; no inventory.

## Cross-cutting craftsmanship item (🟡)
All six `work-*` plates were edited from **arrival-v5**, so they show the old perched microgreens and untapped kombucha rather than arrival-v6's. Regenerating them from arrival-v6 would give one perfectly consistent room. **Optional** (they function correctly) — proposed as low-priority craftsmanship, not a blocker.

## Missing production assets (summary)
| Asset | Status | Regeneration |
|---|---|---|
| Front-on Fridge Working Position | 🟠 Missing (required) | **YES** |
| Tea & Coffee Working Position | 🟠 Missing (recommended) | **YES** |
| Kitchen Worktop (large-fruit) | 🟠 Missing (optional) | Optional (reuse baskets) |
| Dressing consistency (5 plates ← arrival-v6) | 🟡 Refinement (optional) | Optional |

## Reuse opportunities (default = REUSE)
- **Fruit Bowl** reuses `work-baskets.png` — no new asset.
- **Kitchen Worktop** can reuse `work-baskets.png` as a stopgap.
- **arrival-v6** is the single canonical base for any regeneration (extend, don't recreate).
- **29 Living Object PNGs** reused across every variant.
- Superseded masters (arrival v2–v5, shelf v1) retained for rollback but not consumed.

## Generation Proposal (GATED — nothing generated; awaiting approval)

**1. Front-on Fridge Working Position — REQUIRED**
- *Why required:* the correct "stand in front, both doors open" fridge does not exist; the current side-view plate is incorrect (#3).
- *Why reuse impossible:* no front-on fridge interior asset exists anywhere; the side-view cannot be cropped/rotated into a front view.
- *Runtime location:* `client/public/images/living-home/room/work-fridge.png` (**replaces** the side-view).
- *Owner:* House Register (environment plate). *Consumers:* the Fridge Working Position / `fridge` zone.
- *Prompt summary:* front-on American fridge, both doors fully open, warm handcrafted room framing, LED-lit interior, glass shelves, crisp drawers, bottle & door racks, dairy shelf, ~40 representative everyday foods (milk/dairy, eggs, berries, salad veg, condiments, prepared foods) — homely, not a supermarket, not symmetrical.
- *Images:* 1 + up to 2 iterations = **1–3**. *Cost:* **≈ £0.19–0.57.** *Permanence confidence:* **High** — a canonical Working Position.

**2. Tea & Coffee Working Position — RECOMMENDED**
- *Why:* it currently borrows the empty shelf plate; the drinks station deserves its own environment.
- *Why reuse impossible:* no tea/coffee environment exists; the shelf plate shows no caddies/coffee.
- *Runtime location:* new `work-tea-coffee.png` (repoint the `tea-coffee` zone).
- *Owner:* House Register. *Consumers:* `tea-coffee` zone.
- *Prompt summary:* a warm tea & coffee corner — tea caddies, a coffee grinder/pot, mugs, in the same room language.
- *Images:* 1 + 1 = **1–2**. *Cost:* **≈ £0.19–0.38.** *Confidence:* **Medium-high.**

**3. Working-plate dressing consistency — OPTIONAL (craftsmanship)**
- Regenerate `work-{freezer,cupboard,rootveg,bread,baskets}` from arrival-v6. *Images:* **5.** *Cost:* **≈ £0.95.** *Confidence:* Medium (nice-to-have; plates function).

**4. Kitchen Worktop dedicated env — OPTIONAL (low)**
- *Images:* **1.** *Cost:* **≈ £0.19.** *Confidence:* Low (reuse of baskets acceptable).

### Cost summary (all within the £5 gate)
- **Required only (fridge):** ≈ **£0.19–0.57** (1–3 images).
- **Required + Recommended (fridge + tea/coffee):** ≈ **£0.38–0.95** (2–5 images).
- **Everything (incl. optional consistency + worktop):** ≈ **£1.5–2.1** (~8–11 images).

## Proposed production order
1. **Front-on Fridge** (required, highest impact).
2. **Tea & Coffee** (recommended, completes "every destination has its own Working Position").
3. *(Optional)* **Dressing consistency** regen of the 5 plates from arrival-v6.
4. *(Optional, low)* **Kitchen Worktop** dedicated plate.

## Risks
- **Fridge realism:** gpt-image may render a cold modern-steel interior that clashes with the handcrafted room; expect 1–2 iterations and a careful spec.
- **Geometry drift on regen:** regenerating working plates can shift zone positions (as the shelf plate once did) → re-tune hotspots afterwards.
- **Over-generation:** treat consistency/worktop as optional to avoid unnecessary spend.
- **One-asset-one-owner:** the front-on fridge must **replace** the side-view (retire the old), not coexist.

## Regression checks
- **Audit only** — no code or asset changed; runtime untouched; app unaffected. **£0.00 spent.** No architecture/ownership change.

## Home Owner approval gate
**STOP.** No assets created, no prompts finalised, no OpenAI calls. Please review this register and the gated proposal and tell me which items to proceed with (e.g. *fridge only*, *fridge + tea/coffee*, or *all*), and I will implement within the £5 gate.
