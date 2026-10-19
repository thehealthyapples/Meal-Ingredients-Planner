# Living Object — Vertical Slice Proof (Implementation Planning Investigation)

**Classification:** 🟡 AMBER — implementation *planning* only. **Implements nothing.** No code, asset, dependency, schema, route, commit, or push because this document exists. It does **not** redesign the (locked) Living Home architecture; it defines the smallest implementation that would *prove* it.
**Evidence standard:** every material claim tagged **[V]erified** (confirmed in code/asset/doc), **[I]nferred** (reasoned from evidence), or **[A]ssumed** (not confirmed).
**Date:** 2026-08-05 · Worktree `tha-living-larder-authoritative` · HEAD `0f59b189` (with uncommitted changes — see §Precondition).
**Scope of proof:** **one** Working Position (Pantry Shelf) · **one** Living Object (a single glass storage jar) · **one** complete interaction (Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting). Nothing else.

> **Governing canon (locked, not redesigned here):** Living Home · Working Position · Working Position Asset Profile (WPAP) · Living Object · Living Object Visual State · Environmental Presence · Environmental Interaction · Hospitality Profile · North Star Acceptance Gate · Presentation Contract. See `LIVING_OBJECT_VISUAL_STATE_ARCHITECTURE.md`, `WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md`, `LIVING_HOME_LAYERED_RENDERING_ARCHITECTURE.md`, `LIVING_OBJECT_NORTH_STAR_QUALITY_INVESTIGATION.md`, `LIVING_LARDER_CANONICAL_ASSET_DISCOVERY_AND_RUNTIME_AUDIT.md`.

---

## 0. Headline

**The smallest sufficient proof is one glass jar seated on one Pantry Shelf, carried once through all six visual states, judged by the two North Star questions. Almost all of the runtime already exists; the proof mainly *generalises the fridge's proven pattern to the pantry* and *authors one conforming jar to a Pantry-Shelf WPAP*.** **[I, strongly grounded]**

Three verified facts make the pantry the correct — and cheapest — proof surface:

- **The pantry is where the architecture already succeeds.** The WPAP investigation records that the larder jars hit the North Star *because* their hardcoded "front-on 90°" authoring matches the front-on pantry camera; the fridge is where the same architecture *broke* (front-on object in a top-down room). Proving on the pantry validates the whole chain on the surface most predisposed to pass — so a failure here is an architecture failure, not a hard-case artefact failure. **[V for cause, per `WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md` §0/§7]**
- **The interaction machinery already exists and is generic.** `@dnd-kit` `DndContext`, a draggable `LivingObject`, a `DragOverlay` carry-ghost, and three drop destinations (Shopping / Companion / Bin) are already wired in `client/src/pages/living-home-room.tsx`. The slice reuses them; it does not build them. **[V — tsx:238, 264, 351-359, 487-508, 528-534]**
- **The reference occlusion pattern already exists — for the fridge.** The fridge draws its *complete* object PNGs at `z-5` and redraws the empty fridge plate *above* them at `z-8`, clipped to the foreground furniture (`.lh-front--fridge-*`), so an object sits *inside* the furniture while its asset stays whole. This is exactly Environmental Presence + Environmental Reveal, verified working. The pantry has **no** such front layer yet. Generalising this one pattern to the shelf is the core new work. **[V — css:429-463; MISSING for pantry]**

The genuine new work is therefore narrow: **(a)** one empty-shelf environment plate with a liftable foreground lip; **(b)** one glass storage jar authored to a Pantry-Shelf WPAP (a suitable jar PNG may already qualify); **(c)** a `.lh-front--shelf*` Presence layer + a pantry Slot; **(d)** realise the three not-yet-distinct states (Focused, Lifted, Settling) for the jar. Everything else is reuse. **[I]**

---

## Precondition (must be cleared before the slice can run or be validated)

**The build is currently broken by an uncommitted edit.** `client/src/App.tsx:305` adds `<Route path="/poc-milk3d" component={PocMilk3d} />`, but `PocMilk3d` is **never imported** anywhere in `App.tsx` → undefined identifier / build failure. The `react-three-fiber` POC page (`client/src/pages/poc-milk3d.tsx`) and its dependencies are installed; only the missing import is at fault. **Fix = add the lazy import** (e.g. `const PocMilk3d = lazy(() => import("@/pages/poc-milk3d"));` beside the other lazy imports near `App.tsx:63`), *or* remove the route. This is a **precondition, not slice scope**, but nothing below can be manually reviewed until it is cleared. **[V — git diff of App.tsx; whole-file grep finds no import]**

---

## 1. Vertical Slice Scope

**In scope (the proof):** **[I]**
- **One Working Position — Pantry Shelf** — the canonical proof Working Position, in `living-home-room.tsx` (route `/pantry`, the component that already holds the reference fridge pattern). **[V — App.tsx:63, 411]**
- **One Living Object — a single glass storage jar** — the canonical proof object, a complete transparent PNG authored to the Pantry-Shelf WPAP.
- **One environment plate** — an empty pantry shelf with a foreground lip, so the shelf *already exists behind the jar* and removing the jar simply reveals it (Environmental Reveal by construction, never a baked-out crop).
- **One complete interaction** — the six-state loop, calm, non-game-like.
- **One WPAP** — the Pantry-Shelf authoring & acceptance contract (a spec, not an image), carrying the Hospitality Profile (warm · abundant · calm · handcrafted · organised) and the two-question gate.

**Explicitly out of scope (proof, not features):** **[I]**
- No second jar, no shelf of jars, no other Working Position (fridge, basket, bread bin, drawer), no food groups, no cupboard categories.
- No redesign of the renderer, ownership, drag technology, schema, or navigation.
- No promotion of the full photoreal room, no asset re-master programme — those follow *after* the proof (§ Final answer).
- The parallel `larder-room.tsx` constructed-elevation implementation is **not** the target; the slice lives in `living-home-room.tsx`, which owns the reference fridge pattern. **[V — two distinct components exist; `LIVING_LARDER_CANONICAL_ASSET_DISCOVERY_AND_RUNTIME_AUDIT.md` §7]**

**Success = one perfect Living Object, one perfect Working Position, one perfect interaction — both North Star answers YES.** Not coverage. **[V — restates the brief]**

---

## 2. Files Required

*Every path is repo-relative and verified to exist unless marked NEW.*

### 2a. Runtime code (edit only — no new components)
| File | Change | Basis |
|---|---|---|
| `client/src/App.tsx` | **Precondition:** restore the `PocMilk3d` import (or drop the route) so the build compiles. No slice logic here. | **[V — :305 broken]** |
| `client/src/pages/living-home-room.tsx` | Add **one** Pantry-Shelf Slot for the proof jar (a single `PlacedObject`-shaped entry: `{name, src, x, y-base, h}` or a single `POINTS` slot); render it as `<LivingObject variant="jar">`; enable the per-object contact seat for the jar variant; wire the Focused/Lifted/Settling state transitions for it. Reuse existing `DndContext`, `DragOverlay`, `DropSpot`. | **[V — data at tsx:62-108; render at tsx:412-434; seat fridge-only at tsx:250]** |
| `client/src/pages/living-home-room.css` | Add a `.lh-front--shelf*` front-occlusion layer (mirror of `.lh-front--fridge-*`: same plate redrawn at `z-8`, clipped to the shelf lip); enable `.lh-obj__seat` styling for the jar; add the calm Focused/Lifted/Settling transitions. | **[V — fridge front layers css:429-463; seat css:417-422]** |

### 2b. Contract / spec (NEW — documents, not images)
| File (NEW) | Purpose | Basis |
|---|---|---|
| `docs/asset-specs/PANTRY_SHELF_WPAP.md` (or the project's chosen WPAP location) | The **Pantry-Shelf Working Position Asset Profile**: derives camera/light/contact from the pantry plate; owns the jar's generation-prompt guidance, glass/material standard, alpha-edge standard, expected scale/depth range, occlusion rule ("tuck base behind the shelf lip"), the Hospitality Profile dimensions, and the two-question acceptance criteria. | **[I — the WPAP is the locked owner of object authoring/acceptance; `WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md` §3-§5]** |

**No new component files, no route additions, no schema, no dependency changes.** The slice is additive edits to two runtime files plus one spec. **[I]**

---

## 3. Assets Required

*Minimum set. The load-bearing question is whether each already exists at acceptance quality.*

| Asset | Status | Detail | Basis |
|---|---|---|---|
| **One glass storage jar PNG** (complete, transparent, front-on, pantry-lit, body-shadow only, no baked contact shadow) | **Likely EXISTS — verify against gate** | The approved jar library `client/src/assets/living-home/larder/jars/` holds 27 jars incl. a generic `tha-larder-jar-empty.png`. A generic empty glass storage jar is the ideal proof object. **Acceptance, not generation, is the open question** — it must pass both North Star questions *for the Pantry Shelf*. | **[V — folder + files; A for gate pass]** |
| **One empty pantry-shelf environment plate with a foreground lip** | **PARTIAL — the critical asset gap** | `client/public/images/living-home/room/shelf.png` exists and is already wired (`.lh-plate--shelf`, css:57). But Environmental Presence/Reveal needs the plate **empty at the jar's slot** and with a **foreground lip that can be clipped as a front layer** — exactly as the fridge reuses `work-fridge-empty.png` as its `.lh-front` source. Whether `shelf.png` satisfies both (empty slot + liftable lip) must be verified; if not, an empty-shelf companion plate is required. **No generation is authorised by this document** — this is a scoping finding. | **[V — shelf.png exists; fridge pattern css:61,431; A for suitability]** |
| **WPAP contract** | **NEW (a document, §2b)** | Not an image. | **[I]** |

**Net:** the slice may need **zero new imagery** if `shelf.png` already presents an empty slot + liftable lip and an approved jar passes the gate; otherwise it needs **one** empty-shelf plate (and/or one re-mastered jar). The proof deliberately keeps this to *at most one plate + one jar*. **[I]** Per the asset-discovery audit, high-quality photoreal pantry masters already exist unpromoted, so any plate need is **promotion + possible crop**, not a new generation batch. **[V — `LIVING_LARDER_CANONICAL_ASSET_DISCOVERY_AND_RUNTIME_AUDIT.md`]**

---

## 4. Interaction Flow

The proof carries the one jar through the canonical loop. Each state names its **owner**, the **experience**, and the **as-built vs to-build** status. Calm throughout: no bounce, no game feel. **[I unless tagged V]**

1. **Resting** — *owner: Working Position (Environmental Presence) + Living Object asset.* The jar simply *is* on the shelf; the shelf lip stays **present in front of** its base (jar `z-5` under `.lh-front--shelf` `z-8`); a single contact seat grounds it. **As-built:** object `z-5` exists (css:392); **to-build:** the `.lh-front--shelf*` lip and the jar-variant seat. **[V object layer / V gap on front layer]**
2. **Focused** — *owner: Runtime state + Information Layer (label).* Attention lands: the jar gently acknowledges — a hair more light/reflection, its title fades in — **no movement, no reveal, no z-change.** **As-built:** hover reveals `.lh-obj__cap` (css:536-542) **but current hover also nudges the object** — the slice must re-specify Focused as *still*. **[V label / V gap: movement must be removed]**
3. **Lifted** — *owner: Runtime (z-order transition).* The jar **leaves its place**: shown **whole** above all Presence, the shelf **behind it revealed**, label still attached, **not yet travelling**. **As-built:** full reveal currently only begins at drag; **to-build:** a distinct pre-drag Lifted beat (elevate above `.lh-front--shelf`). **[V gap — the Visual State doc's named gap]**
4. **Dragging** — *owner: Runtime (`DragOverlay`).* The jar travels with the hand in the portal ghost above everything; label follows; Shopping / Companion / Bin become active. **As-built and reused as-is.** **[V — tsx:487-508, 528-534]**
5. **Dropped** — *owner: Runtime (`onDragEnd`) → destination.* Released onto a destination: **Shopping** (`POST /api/shopping-list`), **Companion** (`askCompanion` + open), or **Bin** (remove + undo toast). Where the jar leaves the shelf, the plate behind is **cleanly revealed** (no crop scar — nothing was baked out). **As-built and reused.** **[V — tsx:316-338, 351-359]**
6. **Settling → Resting** — *owner: Runtime (align to Slot).* Returned to the shelf, the jar **aligns to its Slot, settles onto the surface, slips back behind the lip, and rejoins the room** — a brief confirmation, then Resting. **To-build:** today a return snaps instantly; the slice adds the calm settle. **[V gap]**

**Interaction proof also covers the three destinations explicitly** (Shopping, Companion, Bin), each exercised once with the single jar — satisfying "correct Shopping / Companion / Bin interaction" without a second object. **[V — droppables exist]**

---

## 5. Acceptance Testing

The proof is judged by the **North Star Acceptance Gate** (both questions YES) plus the **Presentation Contract** (continuity across all six states). Testing is deliberately mostly *manual visual judgement* — the North Star is a perceptual bar — backed by a thin automated floor. **[I]**

**5a. Automated floor (cheap, objective):** **[I]**
- Build compiles (precondition cleared) and `/pantry` renders without console errors.
- The jar asset loads; the environment plate loads; the `.lh-front--shelf` layer is present at `z-8` above the object at `z-5`.
- dnd-kit: the jar is draggable; each of the three destinations receives an `onDragEnd` with the correct `kind` (`shopping|companion|bin`) and fires its handler once.
- The label element is a child of the object node (moves with it) in every state.

**5b. Presentation Contract check (continuity — §4a of the Visual State doc):** across Resting→Focused→Lifted→Dragging→Dropped→Settling, confirm the jar keeps identity, proportions, one camera, one light direction, consistent material/reflections/colour, never swaps artwork, and the label never detaches. Verified by stepping each state and comparing. **[I]**

**5c. North Star Gate (the pass/fail):** applied to the resting jar-on-shelf and to the lifted jar — **both questions must be YES; either NO fails the proof.** **[V — gate is canonical]**

---

## 6. Manual Review Process

A short, repeatable human review — the proof's real gate. **[I]**

1. **Clear the precondition** (build compiles); open `/pantry` in the app.
2. **Resting review** — does the jar look photographed *into* this shelf: correct perspective, camera, warm pantry light, believable reflections, grounded contact, base tucked behind the lip, correct resting visibility (approximately fully visible, an open shelf — per the Working Position Resting Visibility Contract)? **[V — Resting Visibility Contract, Visual State doc §5.1]**
3. **State walk** — trigger Focused (still, label only), Lifted (whole, shelf revealed behind, not travelling), Dragging (carries cleanly, label follows), Dropped to each of Shopping/Companion/Bin, and Settling back to the slot. Confirm each feels **calm, not game-like**, and the Presentation Contract holds.
4. **Reveal check** — with the jar lifted/removed, confirm the shelf behind is clean and complete (no scar), proving Environmental Reveal.
5. **Two-question verdict** — a reviewer (Home Owner authority) answers Q1 and Q2 aloud. Record YES/NO + one sentence each.
6. **Log** the verdict in the House/Life Register against the checksum of the jar + plate (promotion discipline), as the asset-discovery audit prescribes. **[V basis — audit §8]**

---

## 7. North Star Review

**Question 1 — Technical integration:** *"If this object had originally existed in the room photograph, would replacing it with this Living Object be visually indistinguishable?"* — tests camera, light, contact, scale, edge, material. The pantry front-on camera is the case the jars already satisfy, so Q1 is **expected reachable** here. **[I, grounded in WPAP §0]**

**Question 2 — Emotional realism:** *"Would a household instinctively believe they could reach into the room and pick up this exact object?"* — tests liftability and presence. The whole-asset + Lifted-reveal + calm settle exist to make Q2 a felt YES.

**Both must be YES. Either NO rejects the proof** and sends the failing dimension back (jar → WPAP/authoring; plate → Presence layer/plate; interaction → state craftsmanship). The gate is the same one every future Living Object will face, so passing it once *on the pantry* establishes the reusable bar. **[V — gate canonical; I for slice application]**

---

## 8. Risks

- **Asset-suitability risk (highest).** `shelf.png` may not present an empty slot + a liftable foreground lip, and/or no existing jar passes the gate — forcing (at most) one plate + one jar to be produced later. The proof stays valid; the cost is one asset, not a batch. **[A — suitability unverified]**
- **AI hit-rate risk (inherited ceiling).** The WPAP fixes *intent*, not *hit-rate*; the jar may need iterations to pass. This is the architecture's own highest assumption, not a slice defect. **[V-reasoning — WPAP §6/§Highest-risk]**
- **Presence-generalisation risk.** The fridge front layers are hand-tuned `clip-path`/`mask` bands; deriving the shelf lip cleanly (ideally Slot-derived) may need care. Proven for the fridge, **assumed** transferable to the shelf. **[V fridge / A shelf]**
- **Calm-craft risk.** Focused/Lifted/Settling must be *whisper-quiet* — over-animating any of them reintroduces the game feel the architecture forbids. **[I]**
- **Precondition drift.** Leaving the `PocMilk3d` break unfixed blocks all manual review; it must be cleared first and not re-broken. **[V]**
- **Scope-creep risk.** The pull to "just add the other jars/shelves" would convert a proof into a feature and dilute the verdict. Hold to one jar. **[I]**

---

## 9. Implementation Order

Smallest-risk-first; each step independently reviewable. **[I]**

1. **Clear the build precondition** (`App.tsx` import). Confirm `/pantry` renders. **[V-scoped]**
2. **Author the Pantry-Shelf WPAP** (spec) — camera/light/contact/Hospitality/acceptance. No pixels yet.
3. **Confirm assets against the WPAP** — pick the one jar; confirm the shelf plate presents empty slot + liftable lip (else record the single plate/jar to be produced — *decision, not generation, here*).
4. **Generalise Environmental Presence to the shelf** — add `.lh-front--shelf*` (mirror the fridge front layer) + the jar-variant contact seat; verify Resting + Reveal.
5. **Seat the one jar on its Slot** — a single `PlacedObject`/`POINTS` entry rendered as `<LivingObject variant="jar">`.
6. **Realise the states** — re-specify Focused as still; add the distinct pre-drag Lifted beat; add the calm Settling return. Reuse existing Dragging/Dropped.
7. **Run acceptance** — automated floor, Presentation Contract walk, then the two-question manual verdict; log against checksums.

---

## 10. Definition of Done

The slice is **done** when **all** hold: **[I]**
- Build compiles; `/pantry` renders the one jar on the shelf with no console errors. **[V-scoped]**
- Environmental Presence is real for the shelf (`.lh-front--shelf` at `z-8` over the object at `z-5`); the jar's base tucks behind the lip at rest.
- Environmental Reveal is clean: lifting/removing the jar shows a complete shelf behind, no scar.
- All six states are distinct and calm: Focused is *still*; Lifted shows the whole jar with the shelf revealed and is *not yet travelling*; Dragging carries with the label; Dropped reaches Shopping, Companion and Bin correctly; Settling returns the jar to its Slot with a brief confirmation.
- The Presentation Contract holds across every state (same object throughout; label never detaches).
- **North Star Gate: Q1 = YES and Q2 = YES**, recorded by the reviewer against the asset checksums.
- No renderer/ownership/schema redesign occurred; changes are confined to the two runtime files + one WPAP spec (+ at most one plate/jar asset).

---

## Final Answer

> **If this vertical slice succeeds, can the remainder of the Living Home be built by repetition rather than further architectural invention?**
>
> **Yes — with one honest qualifier. [I, strongly grounded]** A passing slice demonstrates that a **complete Living Object + Working-Position Environmental Presence + WPAP-bound authoring + the six-state runtime + the two-question gate** compose into a household-believable object *end to end*. Every other Working Position is then the **same recipe with different scene truth**: author its WPAP (its camera/light/contact/Hospitality), generalise the already-proven front-layer Presence to its foreground furniture, seat its complete objects on its Slots, and run the same gate. No new ownership, renderer, state, or technology is required — the fridge already proves the pattern transfers between rooms, and the pantry slice proves it end-to-end including authoring and acceptance. **The qualifier is craftsmanship, not architecture:** each room still needs its own art-direction pass and must clear the same AI hit-rate ceiling (the architecture's standing highest assumption), and the hard case — top-down fridge and loose organic produce — should be the **second** slice (one fridge shelf) to prove the recipe survives the camera that originally broke it. Pass the pantry jar, then the fridge shelf, and the rest of the Living Home is **repetition and art-direction, not invention.** **[V for fridge-transfers-rooms; I for full generalisation; A for the AI hit-rate ceiling]**

---

### Evidence tag legend
**[V]erified** — confirmed in code/asset/doc (file:line cited where practical). **[I]nferred** — reasoned from verified evidence. **[A]ssumed** — not yet confirmed; flagged for verification during implementation.

**This document defines the proof only. It implements nothing.**
