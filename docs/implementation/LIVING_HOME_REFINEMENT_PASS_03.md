# Living Home — Refinement Pass 03

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — runtime refinement (no new features, no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-refinement-03-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model, Companion ownership. Unchanged.

> **Generation gate honoured (#12): no new imagery was generated this pass.** This report first inventories existing assets and lists what is genuinely missing, with an estimated count and cost, for your review before any OpenAI generation. **OpenAI spend this pass: £0.00.**

## Done this pass (non-generation refinements)

- **Tidy label layout.** Name-plates now wrap into two clean rows when a destination has many items (the fridge, the cupboard categories), instead of one crowded line — and the rows are kept **clear of the destination approach hotspots** (a label/hotspot collision found and fixed in testing). *Evidence:* `refine02-evidence/3-shelves-to-fridge.png` (after) vs `rooms-evidence/fridge.png` (before, single crowded row).
- **Continuous navigation (#2) & cupboard hierarchy (#7) verified still working** end-to-end (Shelves → Fridge → Store cupboard → Beans, no return to Arrival).
- **Already in place from Pass 02** and confirmed: root-veg rack in the Arrival (#6), hanging-planter microgreens & tapped kombucha in the Arrival (#8/#9), refined jar glass (#10).
- **Companion (#11):** reviewed. Recommendation recorded (below); **not changed** — the trigger lives in the shared 1,911-line `FloatingAssistant`, and altering it in a refinement pass risks the whole app. Ownership/interaction stay correct.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | `labelPos` — wrap name-plates into two rows when many; kept clear of nav hotspots |

## Image-reuse audit (#12)

**Existing assets found and REUSED (nothing regenerated):**
- Environment plates in runtime: `arrival` (v6), `shelf`, `work-fridge`, `work-freezer`, `work-cupboard`, `work-baskets`, `work-rootveg`, `work-bread`.
- Living Object assets: **29** jar + produce PNGs (`client/src/assets/living-home/larder/…`).
- Retained masters for reuse/rollback: arrival v2–v6, shelf v1–v2, all `work-*` candidates.
- *One asset, one owner, many consumers* — e.g. the flour jar PNG is reused across every flour variant; `arrival-v6` is the single base for future working-plate regeneration.

**Genuinely MISSING assets (require generation — GATED, awaiting approval):**

| # | Missing asset | Why | Images |
|---|---|---|---|
| 1 | **Front-on Fridge Working Position** plate | current `work-fridge` is a *side view, partly-open door* — #3 says this is not acceptable; need a dedicated front-on American fridge, **both doors fully open**, LED interior, glass shelves, crisp drawers, bottle/door racks, dairy shelf, ~40 representative foods baked in (#4/#5) | 1 + up to 2 iterations = **1–3** |
| 2 | **Working-plate dressing consistency** | `work-{freezer,cupboard,rootveg,bread,baskets}` are edits of the *earlier* arrival, so they still show the old perched microgreens & untapped kombucha; regenerate each from **arrival-v6** for one consistent room | **5** |
| 3 | **Own Working-Position plates** for shared zones (#1) | Tea & coffee (shares `shelf`), Kitchen worktop (shares `baskets`); Fruit bowl acceptably reuses `baskets` (it shows fruit) | **2** |

**Estimated total: ~8–10 images · estimated cost ≈ £1.5–1.9** (gpt-image-2 edits ≈ £0.19 each) — within the £5 gate. **No generation will begin until you approve this plan.**

## Evidence

- **Continuous room navigation:** `docs/implementation/refine02-evidence/` — arrival → shelves → **fridge (direct)** → **cupboard (direct)** → Beans category. No return to Arrival.
- **Every destination has a Working Position:** Shelves, Fridge, Freezer, Store cupboard (with category depth), Root-veg rack and Bread store each have a dedicated plate; Fruit bowl / Kitchen worktop / Tea & coffee currently reuse a plate (own plates listed as missing #3 above).
- **Reuse:** the audit above — every plate and Living Object in use is an existing asset; nothing was regenerated.

## Remaining Home Owner observations

- **The fridge is the biggest outstanding item:** it stays a side-view door until the front-on Working Position (missing asset #1) is approved and generated.
- **Room consistency:** the older microgreens/kombucha persist on the zone working plates until they are regenerated from arrival-v6 (missing asset #2).
- **#1 completion:** Tea & coffee and Kitchen worktop need their own plates (missing asset #3).
- **Companion presence (#11):** recommend a small, isolated softening of the `FloatingAssistant` trigger — quieter idle, a gentle delayed fade-in rather than an ever-present button, slightly reduced chrome — so it reads as a quiet household companion. Deferred to a focused change to avoid risk to the shared component.
- **Glass (#10):** the CSS mask/warmth/contact is good; true reflections/refraction would need proper per-jar glass renders (an optional future Living Object asset task).

## Regression checks

- Continuous navigation and cupboard hierarchy work end-to-end (captured); pantry Shelves → Category path intact.
- App compiles; walk-through captured with **no console errors**.
- No architecture, navigation-philosophy, ownership or Companion-ownership change; **no imagery generated** (£0.00).

## Definition of done — status

The room already behaves as one continuous, spatial kitchen (Pass 02) and the labels are now tidy. The remaining authenticity gains — the **front-on fridge environment**, **working-plate consistency**, **own plates for Tea & coffee / Worktop**, and the **Companion softening** — are specified and costed above and are **held for your approval** per the generation gate.
