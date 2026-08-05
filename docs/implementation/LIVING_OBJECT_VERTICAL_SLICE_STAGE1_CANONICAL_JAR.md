# Living Object Vertical Slice — Stage 1 (RESET): Canonical Object via Two‑Master Extraction

**Date:** 2026-08-05 · **Risk:** 🟡 AMBER · **Status: RESET — production workflow defined; awaiting the one missing master. No generation, no code, no commit.**
**Supersedes** the earlier group‑model Stage 1 approach (withdrawn at Home Owner direction).
**Evidence standard:** **[V]erified** (viewed asset / observed running app), **[I]nferred**, **[A]ssumed**.

> **The objective is not to build better jars. It is to extract the original jars from the canonical photograph.** A Living Object is not authored, relit, or composited — it is **cut out of a photograph of the room it already lives in**, so it belongs by origin.

---

## 1. The Canonical Production Workflow (every Living Object)

**Each Working Position has exactly TWO master images.**

**MASTER IMAGE A — the Environment Plate.**
The complete room surface: permanent architecture and fixed dressing only. **No movable Living Objects.** This is the static background layer.

**MASTER IMAGE B — the identical photograph, populated.**
The **same** camera, lighting, perspective, and room as A — this time containing **every Living Object in its Canonical Home**.

**Extraction (the only asset step).**
From Master B, **extract only the Living Objects** as transparent cut‑outs. The difference between B and A *is* the set of Living Objects, so extraction is masking, not creation.
- Do **not** recreate, regenerate, redraw, relight, or repaint.
- Each extracted object **inherits, by origin**: lighting · reflections · perspective · camera · scale · shadow · craftsmanship.
- The physical **chalkboard label stays part of the jar artwork**. Runtime supplies **only the editable text** over it — no floating labels, no software plaques, no replacement artwork.

**Runtime composition (three layers — unchanged from the locked model).**
1. **Environment Plate** = Master A, static, never moves, never redraws.
2. **Living Object** = the extracted cut‑out, positioned at the exact pixel location it occupied in Master B (its **Canonical Home**).
3. **Information Layer** = the object's editable name/quantity/status, bound to and moving with the object; quiet; never detached.
When an object is lifted or removed, **Master A is already behind it** — the shelf/wall is simply revealed. No repaint, no regenerated background, no masking scar.

**Why this is architecture‑compliant (not new architecture).** [I]
It realizes the **locked** contracts literally: the North Star ("extracted from the room's own photograph, not composited"), the Layered Rendering model (plate · object · front), the Presentation Contract (one complete asset, never re‑authored), and the WPAP (the object inherits the room's camera/light — here by *origin* rather than by prompt). It is a **production method**, owned as craftsmanship under the locked Design Constitution's admission standard. No owner, concept, or renderer changes.

---

## 2. What already exists (verified)

- **Fridge — BOTH masters exist.** `work-fridge-empty.png` (Master A) and `work-fridge.png` (Master B — the fully‑stocked fridge: milk, juice, jars, cheese, eggs, berries, produce, door jars), same camera and light. **[V — both viewed.]** The fridge is therefore the case where this extraction workflow is **provable today**, with no new imagery.
- **Pantry Shelf — Master A exists.** `client/public/images/living-home/room/shelf.png` is the empty shelf: warm timber, plaster wall, only permanent dressing (bowl, linen, scoop, rolling pin, basket), **no jars**. **[V — viewed.]** (`artifacts/living-home-environment-plates/shelf/shelf-empty-backup.png` is a spare.)
- **Runtime layer model is live.** The running app already renders per‑Working‑Position `.lh-plate` layers and composites objects above them; the fridge already draws its empty plate as a front‑occlusion layer. **[V — observed in the running app.]**

## 3. What is missing (the one prerequisite)

- **Pantry Shelf Master B does NOT exist** — there is no photograph of *this exact shelf* (same camera/light as `shelf.png`) with the jars standing in their canonical homes. The current `tha-larder-jar-*.png` jars are **separately authored** standalone jars (front‑on, white background), **not** extracted from a photograph of this shelf — so they only *approximately* belong. **[V]**
- Producing Master B is an **asset‑generation/photography act**. Per standing rules I **do not generate assets**; this is the **Home Owner's production step** (or an approved generation pass). **[V rule]**

---

## 4. Reset Stage 1 — scope

Prove the canonical workflow with **one** Living Object: extract a single jar from a **Pantry Shelf Master B** and run it through the complete lifecycle (Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting), draggable to Shopping / Companion / Kitchen bin, returning to its Canonical Home, with runtime supplying only the editable label. Success = the North Star (both questions YES) — judged by eye in the running room.

**Two ways to proceed (Home Owner's choice):**
- **(A) Prove on the Fridge first (fastest — zero new imagery).** Both masters already exist; extract one fridge object (e.g. the milk) from `work-fridge.png` and prove the full lifecycle. This validates the workflow immediately, then the pantry follows the same recipe once its Master B exists.
- **(B) Produce Pantry Master B, then extract.** You supply a photograph/render of the `shelf.png` shelf — same camera/light — with the canonical jars placed. I then extract one jar and wire the lifecycle.

## 5. Verification (unchanged standard)
- **North Star (visual):** the extracted object must read as *originally in the photograph* and *liftable* — the Home Owner's craft judgment in the running room (`http://localhost:5000/pantry`). The app is runnable now (see §6).
- **Functional (interaction):** Master A static; object at its Canonical Home; lift reveals A cleanly; drag to the three destinations; natural settle back. Verified by interacting with the running app.

## 6. Runtime status (from this session)
The Living Home **runs locally** against the provided DB: `NODE_ENV=development node --env-file=.env --import tsx server/index.ts` → "serving on port 5000"; Pantry reachable via the app's no‑signup trial. (This session's Browser pane cannot composite frames, so screenshots/North‑Star‑by‑eye must be done with the pane displayed or by the Home Owner viewing the app.) **[V]**

## 7. Not done (correctly)
No asset generated. No extraction performed blind. No jar artwork changed. No code changed. No commit, no push. This document only **resets Stage 1 around the extraction workflow** and records the one missing prerequisite.
