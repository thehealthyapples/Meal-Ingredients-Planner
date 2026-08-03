# Living Home — Interaction Refinement

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — restores the approved interaction model inside the successful Working Positions (no architectural redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-interaction-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position model, Shopping Architecture, Companion ownership — all unchanged.

## The regression, and the correction

The Working Position **cameras** are visually successful — but the interaction had regressed to *click a text label → a software panel of buttons appears* (the `lh-context` / `lh-tray` overlays). That reads like operating an application, not keeping a home.

This pass restores the **handle-real-objects** model the Living Home had before — **you pick up the object itself and drag it** — and marries it to the successful cameras. Nothing about the rooms, navigation philosophy or ownership changed.

## What changed, against the brief

| # | Required | Done |
|---|---|---|
| 1 | Remove the large Workspace overlay; replace with a simple **Areas** list | The `lh-context` single-item panel and `lh-tray` batch bar are gone. A quiet **"Around the kitchen"** list is pinned to the room and moves you between Working Positions. |
| 2 | Restore Living Object interaction — **drag the object**, not click a label | Every leaf is a draggable object (dnd-kit). Where we hold a photoreal master it **is** that object (the apple is the apple); otherwise an honest chalk **object token** carrying the household's own word. |
| 3 | Universal drag-and-drop: Shopping / Companion / Bin | One object → **drag to any of the three**. Same handlers back the tap/keyboard path, so every drag outcome also exists as a button (drag is an enhancement, never the only way). |
| 4 | Permanent **Shopping list** in the room, a handwritten pad | A ruled paper **Shopping pad** (torn top, "Shopping" scribble) sits on the counter at all times — not a panel. |
| 5 | Permanent **Kitchen bin**, part of the kitchen | A pedal **bin** stands in the room; its lid lifts when you hold something over it. |
| 6 | Keep the room visible while interacting | The Environment Plate is never covered. Objects, the Areas list and the three destinations are overlaid *on* the room; switching areas crossfades the camera — you move around one kitchen. |

The Companion is the third destination — **Apple**, rendered as a warm apple to hand ("Ask Apple · drop to learn").

## How it works (ownership unchanged)

- **Drag to Shopping pad** → `POST /api/shopping-list` with `purchaseIntent: true` and **no quantity**. The Shopping domain still decides how much (history → pack size → default) — verified live: dragging *Apples* produced **6 pack**.
- **Drag to Apple** → `useAskCompanion()` + `openCompanion()` — the Companion owns knowledge, exactly as before.
- **Drag to the Kitchen bin** → the object leaves the room (a `removed` set), with a **"Put it back"** undo. (On the curated Living Home these are representative staples, so the bin is an honest in-room gesture; the same gesture maps to Domain-30 soft-delete on the data-backed larder.)
- **Non-drag path:** tapping or pressing Enter on an object opens a small in-place **held-object bar** — *Add to shopping · Ask Apple · Kitchen bin* — the keyboard/switch equivalent.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | Rewritten interaction layer: `DndContext` + `DragOverlay`; `LivingObject` (draggable, photoreal or token); permanent `DropSpot`s (shopping / companion / bin); the **Areas** list; held-object bar; **removed** the `lh-context`/`lh-tray` overlays, name-plate select model and the invisible nav hotspots. Data model (GROUPS/ZONES) and Working-Position cameras unchanged. |
| `client/src/pages/living-home-room.css` | New interaction styles (Areas list, Living Objects & tokens, the handwritten pad, the Apple, the pedal bin, held-object bar, drag ghost); `.lh-layer` now re-enables pointer events for the new interactive children. Legacy overlay/name-plate rules are now unused (safe to prune later). |
| `client/src/assets/.../produce/*` | Now imported by the room: `tha-larder-produce-apple-red.png`, `tha-larder-produce-broccoli.png` (the only two produce masters we hold). |
| `scripts/capture-living-home-interaction.ts` | **new** — Playwright evidence capture for this pass. |

No server change, no schema change, no new endpoint. **No OpenAI generation** (this is an interaction pass; no new imagery).

## The honest asset gap

True per-item photoreal objects exist today only for the **~27 larder jars** (pantry staples) and **two produce masters** (apple, broccoli). Fruit/fridge/root-veg items therefore render as **chalk object tokens** — a real thing you pick up and drag, never a guessed or redrawn food. As produce/fridge masters are captured in a future asset pass, each token upgrades to its photograph automatically (the resolver already prefers a master). This is the same "honest gap" law the production larder follows.

## Verified live (demo session, real routes, no console errors)

- **Arrival** — room fully present; Areas list + Shopping pad + Apple + Kitchen bin all visible (`1-arrival-areas-and-destinations.png`).
- **Fruit bowl** — 7 draggable objects; **Apples = the photoreal apple master**, the rest honest tokens (`2-fruit-objects.png`). DOM: `count:7, apples→tha-larder-produce-apple-red.png`.
- **Held-object bar** — tapping the apple offers *Add to shopping · Ask Apple · Kitchen bin* (`3-apple-held-bar.png`).
- **Shopping path** — through the UI, *Apples* reached the Shopping list as **6 pack, source `pantry`** (Shopping-domain inference intact).
- **Bin gesture** — binning *Bananas* removed it from the room; the others remained; undo offered.
- **Pantry shelves → Flours** — six draggable jar objects seated on the shelf (`4-flours-jars.png`).
- **Fridge** — the household zone renders its draggable objects (`5-fridge-objects.png`).
- App compiles (no `living-home-room` TypeScript errors); no browser console errors.

Evidence: `docs/implementation/interaction-evidence/`.

## Regression checks

- **Architecture / navigation philosophy / ownership** — unchanged. Only the interaction layer changed.
- **Shopping intent** — the previous pass's Domain-15 inference still fires on every add (drag or tap).
- **Accessibility** — every drag outcome has a non-drag equivalent (tap/keyboard held-bar); objects are focusable buttons with descriptive labels; dnd-kit's keyboard sensor is present.
- **Room never recedes** — the plate stays at full warmth; destinations and objects are overlays, not panels that cover it.

## Definition of done — status

The Living Home is once again a place where you **handle household objects**: pick up the apple, drop it on the shopping pad, hand it to Apple, or drop it in the bin — inside the same warm kitchen, which never disappears. The Workspace overlay is gone; navigation is a quiet Areas list; the Shopping pad and Kitchen bin live permanently in the room. It feels like a kitchen, not an application.
