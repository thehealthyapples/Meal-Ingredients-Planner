# Living Home — Interaction Refinement · Pass 1

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — refinement of the approved interaction layer (no redesign).
**Branch:** `feat/living-larder-authoritative`
**Rollback:** snapshot at `artifacts/rollback/living-home-interaction-p1-base/` (the pre-Pass-1 working tree of `living-home-room.tsx` + `.css`); base commit `e1b38dc8`.
**Locked & unchanged:** Living Home Architecture, Working Position Architecture, Spatial Blueprint, Ownership, Navigation Model, Shopping Architecture, Companion Architecture, Living Object Model.

## Mission

Make the Living Home disappear as software and feel like one's own home. Every change here **removes visible software and strengthens physical interaction**. Technology gets quieter; hospitality gets stronger.

## What this pass refined

| # | Directive | Done |
|---|---|---|
| 1 | Remove the Workspace overlay; replace with a lightweight **Areas** navigator | The prototype's `lh-context` panel and `lh-tray` batch bar are **deleted** (markup + CSS). The Areas list is restyled to read as **quiet navigation UI, deliberately not part of the room** — a light frosted rail, not kitchen furniture. |
| 2 | Restore Living Object interaction — drag the **object**, not a label | The object *is* the interaction. Where a photoreal master exists it is that object (the **apple is the apple**); otherwise a quiet, italic **object token** in the household's own word (honest gap). No text-label selection anywhere. |
| 3 | Universal drag model; **no action buttons around objects** | Every object has exactly three destinations (Shopping / Companion / Bin) reached by **drag only**. The tap/keyboard action bar from the prior pass is **removed**. Keyboard/switch users pick up with **Space** and carry with the **arrow keys** (dnd-kit `KeyboardSensor`) — accessible with zero buttons. |
| 4 | Permanent **Shopping** destination, naturally present, intent only | The handwritten **Shopping pad** stays on the counter at all times. Dropping there sends purchase **intent** (`purchaseIntent: true`, no quantity); Shopping still owns quantity inference. |
| 5 | Permanent **Kitchen bin**, physically part of the kitchen | A pedal **bin** stands in the room (lid lifts to receive). Dropping removes the object from the household's view, reversibly (**"Put it back"**). |
| 6 | **Spatial continuity** for *every* Working Position | The persistent Areas navigator now governs **all** positions identically: from any position you step **directly** to any other (or back to the whole room) — no return to Arrival. Verified Fridge → Tea & Coffee. The Shelves-only asymmetry is gone. |
| 7 | **Living Object highlighting** — subtle physical cues, no software affordances | A soft warm **light-catch** pools under each object and strengthens as the hand nears; one object per view is **quietly highlighted** and breathes very slightly (a room hinting, not a button pulsing). No rings, no outlines. |

Extra quieting, in the spirit of the mission: each destination's instruction (*"drop to buy / learn / take out"*) is **silent at rest** and appears only while something is in hand — at rest the destinations are simply a pad, an apple, and a bin.

## How it works (ownership unchanged)

- **Drag → Shopping pad** → `POST /api/shopping-list` `{ productName, source, purchaseIntent: true }`. Shopping infers quantity (history → pack size → default). Verified live: *Apples → 6 pack*.
- **Drag → Companion** → `useAskCompanion()` + `openCompanion()` (Companion owns knowledge). The destination carries the **canonical Companion mark** — the THA apple carved into sage ceramic (`.companion-emblem`, reused from the Companion's one door), not a generic apple — and is labelled **"Companion"**.
- **Drag → Kitchen bin** → removes from the household's view with undo. *(The curated Living Home is not yet bound to `/api/pantry`; when bound this gesture maps 1:1 to the existing Domain-30 reversible soft-delete — see Suggestions.)*

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | `LivingObject` is now a pure dnd-kit draggable (no click menu, no buttons); added `KeyboardSensor`; added the subtle `is-hint` highlight + `lh-obj__catch` light-catch; **removed** the held-object action bar and its state. Data model & Working-Position cameras unchanged. |
| `client/src/pages/living-home-room.css` | Areas navigator restyled as lightweight, off-scene UI; object light-catch + gentle `is-hint` glow/breathe; tokens & captions softened to whispers; drop instructions revealed only while dragging; **deleted** dead prototype CSS (`lh-context*`, `lh-tray*`, `lh-hotspot*`, held-bar). |
| `scripts/capture-living-home-interaction.ts` | Capture steps updated for the refined states + a spatial-continuity step. |

No server, schema, ownership, or endpoint change. **No OpenAI generation.**

## Verified live (demo session, real routes, no console errors)

- **Arrival** (`1-arrival-areas-and-destinations.png`) — light Areas navigator; pad / Apple / bin present and **quiet** (no instructions at rest); room fully present.
- **Fruit bowl** (`2-fruit-objects.png`) — **Apples = the photoreal apple**, gently **light-caught and highlighted**; the rest quiet tokens; no buttons.
- **Pantry shelves → Flours** (`4-flours-jars.png`) — six draggable jar objects seated on the shelf.
- **Fridge** (`5-fridge-objects.png`) then **→ Tea & Coffee** (`6-fridge-to-tea-coffee.png`) — **direct** movement between Working Positions, no Arrival round-trip.
- Shopping path (drag/keyboard) reaches the list as **6 pack** (Shopping inference intact); Bin removes with undo.
- App compiles (no `living-home-room` TS errors); no browser console errors.

Evidence: `docs/implementation/interaction-evidence/`.

## Architecture compliance

- Living Home / Working Position / Living Object / Shopping Intent / Companion — all **reused, unchanged**.
- No duplicate interaction model. No new UI concept — the interaction got *quieter*, not different.
- Data: reads existing runtime; no schema, no ownership change, no backfill.

## Definition of done — status

The Living Home reads less as software: navigation is a quiet rail off to one side; the room holds only physical things you pick up; the destinations are a pad, an apple and a bin that stay silent until your hand is full; and you walk directly between every Working Position as though moving around one kitchen. Technology is quieter; hospitality is stronger.

## Suggestions (NOT implemented — require separate approval)

- **Bind the curated Living Home to `/api/pantry`** so the Bin performs the real Domain-30 reversible soft-delete (and the room reflects true household inventory), rather than a session-level view removal.
- **Capture per-item produce / fridge / bread masters** so today's honest tokens upgrade to photographs automatically (resolver already prefers a master; only apple + broccoli exist now).
- **Per-plate object seating** tuned to each camera (the token band is currently one shared layout).
- Prune the remaining unused legacy name-plate/jar CSS in a dedicated cleanup pass.
