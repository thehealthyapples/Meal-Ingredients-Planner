# Living Home — Production Assets, Phase 1

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — production-asset implementation (approved scope only).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-production-assets-01-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model. Unchanged.
**Scope:** ONLY the two audit-approved gaps — the canonical **American Fridge** and **Tea & Coffee** Working Positions. No other Working Position was regenerated or touched.

## OpenAI assets created & cost

Two purpose-built plates, **fresh text-to-image** (not edits/crops of the Arrival), gpt-image-2 1536×1024 high:
- `work-fridge.png` (front-on American fridge, both doors open) — **replaces** the rejected side-view.
- `work-tea-coffee.png` (drinks station) — new.

**Cost: 2 images × 5,488 output tokens ≈ $0.44 ≈ £0.35** (session total well under £5). No iterations required — both were accepted on the first candidate.

## Asset reuse evidence (Extend before Creating)

- **Nothing else regenerated.** The six approved Working Positions (Pantry Shelves, Freezer, Store Cupboard, Root-veg rack, Bread store, Fruit basket) and the 29 Living Object PNGs are byte-unchanged.
- **Reuse for these two was genuinely impossible:** the audit confirmed no front-on fridge interior and no tea/coffee environment exist anywhere; a side-view cannot be rotated into a front view, and the empty shelf plate is not a drinks station.
- The retired side-view fridge master is retained at `artifacts/…/work-fridge/` for rollback; `work-fridge.png` now points to the front-on canonical (one owner, not two).

## Working Position specifications

### American Fridge Working Position (canonical)
- **Canonical camera:** front-on, standing eye height, straight on; **both doors fully open**; the fridge fills the frame. Locked.
- **Purpose:** the household's cold store — walk to the fridge, stand in front, open both doors; the interior *is* the Working Position.
- **Permanent furniture (Environment Assets — never change):** American double-door refrigerator built into warm oak farmhouse cabinetry; warm-LED interior; tempered glass shelves; bottle shelf; dairy shelf; clear salad crisper drawers; door shelving on both doors.
- **Permanent environmental dressing (representative):** organised by storage location — leftovers & bakes (top), a salad bowl & dishes, dairy (yoghurt/cheese/butter), milk & juice bottles, a berry area & eggs, salad-drawer veg (lettuce/spinach/cucumber/peppers), condiment jars in the doors.
- **Living Object zones:** Milk · Yoghurt · Cheese · Butter · Eggs · Berries · Salad · Condiments · Leftovers.
- **Companion context:** selecting object(s) → "Ask Apple" (nutrition, recipes, comparisons) — unchanged ownership.
- **Runtime consumers:** the `fridge` zone (`living-home-room.tsx`), plate `work-fridge.png`.
- **Reuse strategy:** one plate, one owner; the shared selection / multi-select tray / Companion runtime is reused unchanged.

### Tea & Coffee Working Position (canonical)
- **Canonical camera:** close, front-on, eye height — the station on an aged-oak shelf above the worktop.
- **Purpose:** the household's calm, warm drinks station.
- **Permanent furniture:** aged-oak shelf, a brass mug rail, stone worktop, lime-plaster surround.
- **Permanent environmental dressing (representative):** ceramic tea caddies, a jar of coffee beans, a hand-crank wooden grinder, a glass French press, a stovetop moka pot, mugs on the rail, honey with a dipper, a cinnamon jar, a hot-chocolate tin, wooden spoons.
- **Living Object zones:** Black tea · Herbal teas · Coffee · Hot chocolate.
- **Companion context:** "Ask Apple" — unchanged.
- **Runtime consumers:** the `tea-coffee` zone, plate `work-tea-coffee.png`.
- **Reuse strategy:** new plate; reuses the shared runtime and interaction model.

## Files changed

| File | Change |
|---|---|
| `client/public/images/living-home/room/work-fridge.png` | **replaced** with the front-on canonical American fridge |
| `client/public/images/living-home/room/work-tea-coffee.png` | **new** canonical tea & coffee plate |
| `client/src/pages/living-home-room.tsx` | fridge Living Objects aligned to the storage layout; `tea-coffee` zone repointed to its own plate; `ROOM_PLATES` += `tea-coffee` |
| `client/src/pages/living-home-room.css` | `.lh-plate--tea-coffee` layer |
| `docs/asset-specs/WORK_FRIDGE_FRONTON_SPEC.md`, `WORK_TEA_COFFEE_SPEC.md`, `scripts/capture-living-home-prod1.ts` | new — specs + capture |

## Before / after screenshots

- **Fridge:** *before* — side view, partly-open door (`refine02-evidence/3-shelves-to-fridge.png`); *after* — front-on, both doors open (`prod1-evidence/fridge.png`).
- **Tea & Coffee:** *before* — shared empty shelf plate; *after* — dedicated drinks station (`prod1-evidence/tea-coffee.png`).

## Regression checks

- **Only the two approved plates changed.** The other six Working Positions and all Living Object PNGs are untouched (verified — no other file modified).
- Continuous navigation and cupboard hierarchy still work; both new positions reached via their hotspots and captured in-app with **no console errors**.
- No architecture, navigation, ownership or Companion-ownership change.
- **OpenAI:** 2 fresh generations ≈ **£0.35** (within the £5 gate).

## Definition of done — status

The Living Home Asset Library now contains the three canonical Working Positions required: ✓ Pantry Shelf · ✓ American Fridge (front-on) · ✓ Tea & Coffee. All other approved Working Positions remain unchanged. **Returning to the Home Owner for review — no further asset generation will begin without approval.**
