# Living Object — Vertical Slice Implementation Plan

**Classification:** 🟡 AMBER — implementation *planning* only. **Implements nothing.** No code, asset, dependency, schema, route, commit, or push because this document exists. Architecture is **LOCKED** and is not discussed or redesigned here.
**Read first (canonical):** `LIVING_OBJECT_VERTICAL_SLICE_PROOF.md` — this plan executes that proof and nothing beyond it.
**Date:** 2026-08-05 · Worktree `tha-living-larder-authoritative` · HEAD `0f59b189` (uncommitted changes present — see Stage 0).
**Evidence tags** (on factual code/asset claims only): **[V]erified** in code/asset, **[I]nferred**, **[A]ssumed**.
**Pass 2 (2026-08-05) — Governance Refinement (🟢 GREEN).** Adds execution-discipline only: **Implementation Principles**, a mandatory **Stop Gate** after every stage, **Failure Ownership** per stage (exactly one canonical owner), a formal **Living Object Approval Pipeline**, and an **Implementation Status** marker per stage. **Scope, architecture, and the implementation stages are unchanged.**

**Target of the slice:** one glass storage jar, seated on one Pantry Shelf, in `client/src/pages/living-home-room.tsx` (route `/pantry`), carried once through Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting, judged by the North Star Acceptance Gate. No second object, no other Working Position.

---

## Implementation Principles

Execution discipline, in seven lines. These govern *how* the stages below are run; they add no scope. **[I]**

1. **One implementation stage at a time.**
2. **One review at a time.**
3. **One approval at a time.**
4. **Never continue after a failed stage** — a failed stage returns to its owner (see Failure Ownership) before anything else proceeds.
5. **Never bypass a Stop Gate** — every stage ends by halting for explicit approval.
6. **Never approve a Living Object that fails either North Star question.**
7. **Never introduce additional scope during implementation** — the target is one jar, one Pantry Shelf, one interaction.

**The Stop Gate (canonical — applies at the end of every stage).** Before the next stage may begin, all six must be confirmed and explicit approval given: **[I]**
- [ ] acceptance criteria satisfied
- [ ] regression checks passed
- [ ] application still builds
- [ ] architecture compliance maintained
- [ ] Presentation Contract still satisfied
- [ ] North Star Gate not weakened

Implementation **stops** at each Stop Gate. There is **no automatic continuation**.

---

## How to use this plan

**Staging principles (optimised for confidence, not speed):** **[I]**
1. **Every stage is one commit** and leaves `main`/the branch **building and runnable**.
2. **Every stage is independently reviewable** — small, single-purpose, with its own acceptance and rollback.
3. **The proof is isolated behind a flag** until it passes. The existing `/pantry` behaviour is **not altered** by Stages 3–6; the slice renders only when the flag is on. This guarantees "app always working" and makes each stage a safe, revertible increment. The default is flipped (or a promotion decision taken) only at the final stage, after acceptance. **[I]**
4. **Assets are selected/promoted, never generated** (per the locked constitution and the proof). A missing-asset finding **stops** the build stages and is escalated as a decision, not worked around.
5. **No stage touches** inventory, the layered renderer, drag technology, schema, or navigation.

**Proposed isolation flag (implementation detail, not architecture):** a single gate read in `living-home-room.tsx`, e.g. a `SLICE_PROOF` boolean driven by a `?slice=jar` query param (dev/review only). Off by default. All slice rendering is wrapped in it. **[I]**

**Each task below is specified with 8 fields:** Owner · Purpose · Files · Dependencies · Acceptance criteria · Regression risks · Verification method · Rollback method.

---

## Stage dependency summary

```
S0 Build restore ─┬─> S3 Slice scaffold (flagged, Resting) ─> S4 Presence+seat ─> S5 States ─> S7 Acceptance ─> (S8 promotion decision)
S1 WPAP spec ─────┤
S2 Asset confirm ─┘   (S1, S2 have no runtime dependency on S0, but S3 depends on S0+S2; S4 depends on S1+S2 for correctness criteria)
```
S0, S1, S2 can proceed in parallel. S3 requires S0 (build) + S2 (a confirmed jar). S4–S5 are sequential. S7 requires S3–S5 complete. **[I]**

---

## Stage 0 — Restore the build (precondition)

- **Owner:** Runtime.
- **Purpose:** The branch does not compile; nothing can be run or reviewed until it does. Not slice logic — a prerequisite.
- **Files:** `client/src/App.tsx` (the broken `/poc-milk3d` route at `:305`). Optionally `client/src/pages/poc-milk3d.tsx` (leave as-is).
- **Dependencies:** None. `@react-three/*` and `three` are already installed and declared. **[V — package.json:249-250,287; node_modules present]**
- **Acceptance criteria:** `PocMilk3d` is a defined identifier (add `const PocMilk3d = lazy(() => import("@/pages/poc-milk3d"));` beside the other lazy imports near `App.tsx:63`) **or** the `/poc-milk3d` route is removed; project type-checks and builds; the app boots. **[V — App.tsx:305 undefined, :63 lazy pattern]**
- **Regression risks:** Minimal. If the lazy import path is wrong, `/poc-milk3d` errors on navigation only; the rest of the app is unaffected. Removing the route instead has zero runtime effect elsewhere.
- **Verification method:** `npm run build` (or the project's typecheck/dev script) succeeds with no "Cannot find name 'PocMilk3d'"; app loads; `/pantry` renders as it does today.
- **Rollback method:** `git revert` this commit. (Independent of all slice stages.)
- **Failure Ownership:** **Runtime** — build wiring and route registration are the Runtime's; a non-compiling branch returns to Runtime.
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☑ Completed — **current: Completed — Awaiting Home Owner Approval** *(2026-08-05; abandoned 3D POC removed, build restored — see `docs/implementation/LIVING_OBJECT_VERTICAL_SLICE_STAGE0_BUILD_RECOVERY.md`; live-browser verification deferred to Home Owner, environment-blocked).*

---

## Stage 1 — Author the Pantry-Shelf WPAP (spec only)

- **Owner:** Working Position Asset Profile.
- **Purpose:** Provide the single authoring & acceptance contract the proof jar and plate are judged against (camera/light/contact derived from the pantry plate; glass/material standard; alpha-edge; expected scale/depth range; occlusion rule "tuck base behind the shelf lip"; Hospitality dimensions warm · abundant · calm · handcrafted · organised; the two-question gate). Purely a document.
- **Files:** `docs/asset-specs/PANTRY_SHELF_WPAP.md` (NEW), or the project's chosen WPAP location. No runtime files.
- **Dependencies:** The locked WPAP architecture (`WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md`) and the pantry plate's scene truth. **[V — doc exists]**
- **Acceptance criteria:** The WPAP states, for the Pantry Shelf: camera (front-on), light direction/temperature (warm), contact/grounding spec, material/reflection standard, alpha/export standard, scale/depth range, occlusion rule, Hospitality dimensions, and the two North Star questions as the acceptance clause. It **references** (does not restate) scene truth (single-owner discipline). **[I]**
- **Regression risks:** None (document). Risk is *omission* — a missing dimension weakens acceptance downstream.
- **Verification method:** Peer read against the WPAP architecture's property matrix (§5 of that doc); confirm no scene-truth is duplicated and no dimension is missing.
- **Rollback method:** `git revert` / delete the file. No runtime impact.
- **Failure Ownership:** **Working Position Asset Profile** — the object authoring & acceptance contract is the WPAP's; a missing or malformed profile returns to the WPAP.
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 2 — Confirm & promote the two assets (no generation)

- **Owner:** WPAP / asset governance (Home-Owner authority for acceptance).
- **Purpose:** Decide the exact jar and plate the slice will use, confirming each against the Stage-1 WPAP. This is a **decision + promotion** stage, not generation.
- **Files:** `client/src/assets/living-home/larder/jars/` (select one jar, e.g. `tha-larder-jar-empty.png`) **[V — folder + file exist]**; `client/public/images/living-home/room/shelf.png` (confirm suitability) **[V — exists, wired css:57]**. Register the chosen assets in the House/Life Register with checksums (promotion discipline). **[V basis — asset-discovery audit §8]**
- **Dependencies:** Stage 1 (the acceptance criteria to judge against).
- **Acceptance criteria:**
  - **Jar:** one complete transparent glass storage jar PNG that passes the WPAP gate for the Pantry Shelf (front-on, pantry-lit, body-shadow only, no baked contact shadow, clean alpha edge).
  - **Plate:** the shelf plate is **empty at the jar's slot** and presents a **foreground lip** that can be clipped as a front layer (mirroring how the fridge reuses `work-fridge-empty.png`). **[V — fridge pattern css:61,431]**
  - **Decision gate:** if either fails, **stop the build stages** and record precisely the single asset to be produced (one plate and/or one jar) as an escalation — *do not proceed and do not generate here*. **[A — `shelf.png` suitability + jar gate pass unverified]**
- **Regression risks:** None if selection only. If an existing asset is *moved/renamed* rather than added, existing references could break — prefer additive registration.
- **Verification method:** Visual check of the jar against the WPAP; visual check that the shelf plate is empty at the slot and has a liftable lip; checksum recorded.
- **Rollback method:** De-register in the Register; no bytes changed if selection-only. `git revert` any registration commit.
- **Failure Ownership:** routed by failure mode, each to **exactly one** owner — **jar** non-conformance to the profile → **Working Position Asset Profile** (the acceptance authority); **plate** lacking an empty slot or a liftable lip → **Working Position (Environmental Presence)**. These are two distinct concerns with two distinct single owners; neither concern is owned twice.
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation. *(This is also the asset **decision gate**: an unmet criterion stops the build stages and escalates the single asset needed — no generation here.)*
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 3 — Slice scaffold behind the flag (Resting, no Presence yet)

- **Owner:** Runtime (+ Working Position Slot).
- **Purpose:** Render the one confirmed jar seated on a single Pantry-Shelf Slot, gated off by default. Establishes the Resting object on the plate (Presence added next stage).
- **Files:** `client/src/pages/living-home-room.tsx` — add the `SLICE_PROOF` flag read; add **one** slot datum (a single `PlacedObject`-shaped `{name, src, x, y-base, h}` or a single `POINTS` entry); render one `<LivingObject variant="jar">` on it, wrapped in the flag. Reuse existing `LivingObject` (tsx:234-257) and `seat()` (tsx:150). No new component. **[V — data shapes tsx:62-108; render tsx:412-434]**
- **Dependencies:** Stage 0 (build), Stage 2 (confirmed jar + plate).
- **Acceptance criteria:** With `?slice=jar`, `/pantry` shows the jar resting on the shelf at its slot; **without** the flag, `/pantry` is byte-for-byte unchanged from today; no console errors; the jar carries its `name` for the label; `@dnd-kit` already makes it draggable (no wiring needed). **[V — useDraggable in LivingObject tsx:238; droppables tsx:487-508]**
- **Regression risks:** The existing pantry `shelves`/`category` levels (tsx:398-423) must be untouched when the flag is off — risk of accidental shared-state edits. Keep all slice code inside the flag branch.
- **Verification method:** Toggle the flag on/off; diff the flag-off render against current `/pantry`; confirm the jar appears only when on; drag begins (ghost appears).
- **Rollback method:** `git revert` this commit; or ship with the flag off (inert in production).
- **Failure Ownership:** **Runtime** — the flag-gated render and Slot instantiation are the Runtime's. (If the failure is specifically the Slot's *calibrated geometry* — anchor/scale — that is a distinct concern owned by the **Working Position Slot**; the rendered result remains Runtime-owned.)
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 4 — Environmental Presence for the shelf + contact seat

- **Owner:** Working Position (Environmental Presence) + Runtime grounding primitive.
- **Purpose:** Give the shelf the same front-occlusion pattern the fridge already has, so the jar's base tucks behind the shelf lip at rest and the shelf reveals cleanly when the jar lifts. Add the per-jar contact seat.
- **Files:** `client/src/pages/living-home-room.css` — add `.lh-front--shelf*` mirroring `.lh-front--fridge-*` (same shelf plate redrawn at `z-8`, clipped via `clip-path`/`mask-image` to the lip) **[V — fridge front layers css:429-463]**; enable `.lh-obj__seat` for the jar variant (today fridge-only) **[V — css:417-422; render gate tsx:250]**. `living-home-room.tsx` — render the `.lh-front--shelf` div(s) and the jar seat, inside the flag.
- **Dependencies:** Stage 3 (a seated jar to occlude); Stage 1/2 (the occlusion rule + a lip-bearing plate).
- **Acceptance criteria:** Jar renders at `z-5` **under** `.lh-front--shelf` at `z-8`; the jar's base is visibly tucked behind the lip at rest; the jar asset is still whole (no baked foreground); a single contact seat grounds the jar to the shelf; resting visibility matches the Working Position Resting Visibility Contract (open shelf ≈ fully visible with the lip in front of the base). **[V layer values; I for the calibrated lip geometry]**
- **Regression risks:** A front layer at `z-8` could occlude existing pantry group jars if it renders outside the flag — must stay flag-gated. `clip-path`/`mask` mis-calibration could over- or under-cover the jar (cosmetic, self-contained).
- **Verification method:** With the flag on, confirm the lip sits in front of the base; temporarily hide the object to confirm the plate behind the slot is clean (pre-check for Reveal); confirm flag-off render is unchanged.
- **Rollback method:** `git revert` this commit — the jar returns to flat-on-plate (Stage 3 state), app still working.
- **Failure Ownership:** **Working Position (Environmental Presence)** — the shelf lip / front-occlusion layer is the Working Position's. (If the failing element is specifically the single contact seat, that is the **Runtime grounding primitive** — a distinct concern, distinct owner.)
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 5 — Realise the visual states (Focused · Lifted · Settling) and exercise destinations

- **Owner:** Runtime (+ Information Layer for the label).
- **Purpose:** Make the three not-yet-distinct states explicit for the proof jar, and exercise the three destinations. Dragging and Dropped are reused unchanged.
- **Files:** `client/src/pages/living-home-room.tsx` and `.css` — (a) re-specify **Focused** as *still* (light/reflection/label only; remove the hover nudge for the jar in the slice) **[V — hover reveals `.lh-obj__cap` css:536-542; current hover also moves the object]**; (b) add a distinct **Lifted** beat (elevate the jar above `.lh-front--shelf` on pick-up/selection, before travel) **[V gap — reveal today starts at drag]**; (c) add a calm **Settling** return (align to Slot, settle, slip behind the lip → Resting) **[V gap — return snaps today]**. Dragging (`DragOverlay` tsx:528-534) and Dropped routing (`onDragEnd` tsx:351-359 → Shopping `POST /api/shopping-list`, Companion open/ask, Bin remove+undo) are reused. All inside the flag.
- **Dependencies:** Stage 4 (Presence must exist for Lifted's reveal and Settling's re-tuck to be meaningful).
- **Acceptance criteria:** All six states are reachable and **calm** (no bounce/game feel): Focused moves nothing; Lifted shows the whole jar with the shelf revealed and is *not yet travelling*; Dragging carries the ghost with the label; Dropped reaches Shopping, Companion and Bin correctly (each fires its handler once); Settling returns the jar to its Slot with a brief confirmation, then Resting. Label follows the object in every state. **[V destinations exist; I for the state craft]**
- **Regression risks:** Changing hover/drag behaviour could affect other `LivingObject` instances (fridge/pantry) if not scoped to the slice — scope changes to `variant==="jar"` under the flag, or to the proof instance only. Over-animation risks the game feel the gate forbids.
- **Verification method:** Manual state walk (proof §6) with the flag on; confirm each destination's side effect (shopping list entry, companion opens, bin undo toast); confirm no change to non-slice objects.
- **Rollback method:** `git revert` this commit — states collapse to Stage 4 (Resting + Presence), app still working.
- **Failure Ownership:** **Runtime** — the visual state machine (Focused / Lifted / Settling and their z-order transitions) is the Runtime's. (If the failing element is specifically the label detaching from the object, that is the **Information Layer's** — a distinct concern, distinct owner.)
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 6 — Acceptance run (gated)

- **Owner:** Reviewer (Home-Owner authority) + Runtime.
- **Purpose:** Run the full Proof Checklist and the North Star Gate against the flagged slice; record the verdict. No code change beyond fixes surfaced by review.
- **Files:** None (review). Any defects route back to the owning stage (jar → Stage 2/WPAP; plate/Presence → Stage 4; states → Stage 5).
- **Dependencies:** Stages 3–5 complete; Stage 0 build.
- **Acceptance criteria:** **All six Proof Checklists below pass**, and **North Star Q1 = YES and Q2 = YES**, recorded against the asset checksums. Either NO fails the proof.
- **Regression risks:** None (review). Risk is accepting on a subjective read — mitigated by the objective checklist + two-question record.
- **Verification method:** Execute the PROOF CHECKLIST; log results in the House/Life Register.
- **Rollback method:** N/A (no code). A failing verdict blocks promotion (Stage 7) and reopens the relevant build stage.
- **Failure Ownership:** **Working Position Asset Profile** — the acceptance authority owns the verdict and **routes** each failing dimension to its single owner: jar → Working Position Asset Profile; plate / Presence → Working Position; states / z-order → Runtime; label → Information Layer. The gate is never co-owned.
- **STOP GATE — halt; explicit approval required before the next stage.** This stage *is* the consolidated gate: all six canonical Stop-Gate checks **and** both North Star questions must pass. No automatic continuation to promotion.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Stage 7 — Promotion decision (optional, post-acceptance)

- **Owner:** Home-Owner authority.
- **Purpose:** Decide whether the proven slice becomes the default pantry-shelf experience (flip the flag / retire the interim path) or remains a signed reference. **A decision, not automatic.**
- **Files:** `client/src/pages/living-home-room.tsx` (flip `SLICE_PROOF` default) only if promotion is approved.
- **Dependencies:** Stage 6 (both North Star answers YES).
- **Acceptance criteria:** Explicit Home-Owner approval on record; flag-on render becomes default with the app still working and no non-slice regression.
- **Regression risks:** Flipping the default changes what users see at `/pantry` — gate behind approval; keep the existing pantry retrievable by reverting the flag flip.
- **Verification method:** Re-run the automated floor + a smoke test of `/pantry` after the flip.
- **Rollback method:** `git revert` the flag-flip commit — returns to the flagged-off state with the proof intact behind the flag.
- **Failure Ownership:** **Home Owner** — promotion is an approval decision; withheld approval keeps the slice behind the flag (no owner of a *visual* concern is implicated by a promotion hold).
- **STOP GATE — halt; explicit approval required before the next stage.** Confirm the six canonical Stop-Gate checks after the flag flip (the flip must not regress the build, non-slice objects, the Presentation Contract, or the North Star Gate). No automatic continuation.
- **Status:** ☐ Not Started · ☐ In Progress · ☐ Awaiting Review · ☐ Approved · ☐ Returned for Revision · ☐ Completed — **current: Not Started**

---

## Living Object Approval Pipeline

The formal progression every Living Object (here, the proof jar) passes through before it is served. This **formalises the existing process — it does not redesign it**. Each stage has exactly one owner; adjacent stages sharing an owner is not duplication (each stage is singly owned). **[I]**

```
AI Draft Asset → WPAP Validation → Technical Review → North Star Acceptance Gate → Home Owner Approval → Canonical Living Object → Production
```

*(For this slice, if an already-approved jar is selected in Stage 2, it enters the pipeline at **WPAP Validation**; the AI-Draft stage applies only if a new draft is produced — no generation is authorised by this document.)* **[I]**

| # | Stage | Purpose | Owner | Entry criteria | Exit criteria | Failure outcome |
|---|---|---|---|---|---|---|
| 1 | **AI Draft Asset** | Produce a candidate Living Object PNG authored to the profile | **Working Position Asset Profile** (drives the generator that consumes it) | A Pantry-Shelf WPAP exists (Stage 1) | A complete transparent candidate PNG exists | Return to draft with revised WPAP prompt guidance |
| 2 | **WPAP Validation** | Confirm the candidate conforms to the profile (camera, light, contact, material, alpha, scale) | **Working Position Asset Profile** | A candidate PNG | Conforms to every WPAP dimension | Return to **AI Draft Asset** |
| 3 | **Technical Review** | Verify runtime integration (clean alpha edge, resolution, transparent bg, renders at z-5 under Presence, seat grounds, no scar) | **Runtime** | A WPAP-valid asset | Integrates cleanly in the slice | Return to **AI Draft** / **WPAP Validation** per the defect's owner |
| 4 | **North Star Acceptance Gate** | Apply the two questions (technical integration + emotional realism) | **Working Position Asset Profile** (acceptance clause) | Technically integrated | **Q1 = YES and Q2 = YES** | Return to the failing dimension's single owner |
| 5 | **Home Owner Approval** | Signed human acceptance of the exact object | **Home Owner** | Gate passed | Approval recorded against the asset checksum | **Returned for Revision** to the relevant owner |
| 6 | **Canonical Living Object** | Register the approved asset as canonical (Life Register, checksum-bound) | **Home Owner** (asset governance / Register) | Recorded approval | Registered as canonical | Registration withheld; object stays non-canonical |
| 7 | **Production** | Serve the canonical object in the app | **Runtime** | Canonical + registered | Rendered in production (via the Stage-7 promotion decision) | Revert wiring; object returns to canonical-but-unserved |

**Single-owner discipline (pipeline):** authoring & acceptance → Working Position Asset Profile; integration & production → Runtime; approval & canonicalisation → Home Owner. No stage has two owners; no concern is owned twice. **[I]**

---

## PROOF CHECKLIST

The proof is complete only when **every** box below is objectively satisfied. Each is checked with the slice flag on, on `/pantry`, after Stage 0 has restored the build.

### A. Visual Quality
- [ ] Jar reads as **photoreal**, not illustrated or cut-out.
- [ ] **Perspective** and **camera** match the pantry front-on plate.
- [ ] **Lighting** is warm and directionally consistent with the shelf; **reflections** read from that one light.
- [ ] **Grounding / shelf contact** is believable (single contact seat, no float, no double shadow).
- [ ] **Depth** and **scale** sit the jar correctly on the shelf (WPAP range).
- [ ] **Hospitality** reads: warm · abundant · calm · handcrafted · organised; natural materials.
- [ ] **Resting visibility** matches the open-shelf expectation (≈ fully visible, base behind the lip).
- [ ] No edge halo, alpha fringe, or crop scar on the jar.

### B. Interaction
- [ ] All six states reachable: Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting.
- [ ] The whole loop feels **calm**; nothing bounces or feels game-like.
- [ ] Drag carries the jar via the overlay ghost; the **label follows** in every state.
- [ ] **Shopping** drop creates a shopping-list entry (`POST /api/shopping-list`).
- [ ] **Companion** drop opens/asks the companion.
- [ ] **Bin** drop removes the jar with an undo affordance.
- [ ] Pointer, touch, and keyboard drag sensors all work.
- [ ] Non-slice objects are unaffected (flag-off render unchanged).

### C. Environmental Presence
- [ ] `.lh-front--shelf*` renders at `z-8`, above the jar at `z-5`.
- [ ] The shelf **lip sits in front of** the jar's base at rest.
- [ ] The lip is **Working-Position-owned** (a front layer of the plate), never baked into the jar.
- [ ] The jar asset is **complete** (no baked foreground, no baked clipping).

### D. Environmental Reveal
- [ ] Lifting the jar reveals the shelf **behind** it (Environmental Reveal), whole and clean.
- [ ] Removing the jar (to a destination) leaves **no crop scar** — the plate is empty at the slot.
- [ ] The revealed shelf needs no repair — nothing was ever baked out.

### E. Presentation Contract
- [ ] Object **identity** is constant across all six states (same jar throughout).
- [ ] **Proportions** never change (elevation moves it; it is never reshaped).
- [ ] **Camera**, **lighting direction**, **material**, **reflections**, and **colour** are constant across states.
- [ ] The object **never swaps artwork** (one asset; a state is never a different image).
- [ ] The **Information Layer never detaches** (label stays bound and moving).
- [ ] The object **never appears to become a different object**.

### F. North Star Acceptance Gate
- [ ] **Q1 (technical integration):** "If this object had originally existed in the room photograph, would replacing it with this Living Object be visually indistinguishable?" → **YES**.
- [ ] **Q2 (emotional realism):** "Would a household instinctively believe they could reach into the room and pick up this exact object?" → **YES**.
- [ ] Both answers **recorded against the jar + plate checksums**. Either **NO ⇒ proof fails** and the failing dimension reopens its stage.

---

## Definition of Done (overall)

The vertical slice is **done** when: Stage 0 has the build green; Stages 1–5 are each committed and leave the app working with the slice isolated behind the flag; **every box in the PROOF CHECKLIST is checked**; **North Star Q1 = YES and Q2 = YES** are recorded against checksums; and no inventory/renderer/schema/drag-technology/navigation change occurred (changes confined to `App.tsx`, `living-home-room.tsx`, `living-home-room.css`, one WPAP spec, and at most one confirmed jar + one confirmed plate). Promotion (Stage 7) is a separate, approval-gated decision. **[I]**

---

## Pass 2 — Governance Refinement Summary

**Summary of governance refinements.** **[I]**
1. **Implementation Principles** — seven concise discipline rules added at the front (one stage / one review / one approval at a time; never continue after a failed stage; never bypass a Stop Gate; never approve a Living Object that fails either North Star question; never add scope).
2. **Stop Gate** — a mandatory halt at the end of **every** stage (S0–S7), with a canonical six-check confirmation (acceptance · regression · builds · architecture compliance · Presentation Contract · North Star Gate) and **no automatic continuation**; the next stage begins only after explicit approval.
3. **Failure Ownership** — every stage names the single canonical owner that becomes responsible if its acceptance criteria are not met, with multi-artefact stages routed **per failure mode** so each failure still has **exactly one** owner.
4. **Living Object Approval Pipeline** — the existing approval process formalised into seven stages (AI Draft → WPAP Validation → Technical Review → North Star Gate → Home Owner Approval → Canonical Living Object → Production), each with Purpose, Owner, Entry, Exit, and Failure outcome.
5. **Implementation Status** — a six-value status marker (Not Started · In Progress · Awaiting Review · Approved · Returned for Revision · Completed) at the end of every stage, all currently **Not Started**.

**Reasons.** The plan already minimised *technical* risk (flag isolation, one commit per stage, per-stage rollback); Pass 2 minimises *process* risk — the ways a correct plan is executed badly: silent continuation past a failure, ambiguous responsibility when a stage fails, an object slipping to production without the gate, and untracked stage state. The Stop Gate and Status make progress explicit and interruptible; Failure Ownership makes every failure actionable by exactly one owner; the Approval Pipeline makes "approved" a defined state rather than a judgement call. **[I]**

**Duplicated ownership discovered.** **None.** Each stage's failure and each pipeline step maps to exactly one canonical owner. Where a stage carries two artefacts (Stage 2: jar + plate) or two elements (Stage 4: lip + seat; Stage 5: state machine + label), the concerns are **separated** and each routed to its own single owner — no concern is owned twice. The pipeline concentrates authoring/acceptance in the Working Position Asset Profile, integration/production in the Runtime, and approval/canonicalisation in the Home Owner, with no overlap. **[I]**

**Implementation risks reduced.** **[I]**
- *Runaway execution* — the Stop Gate forbids automatic continuation, so a latent defect cannot propagate across stages.
- *Diffuse accountability* — Failure Ownership assigns every possible stage failure to one owner, removing "who fixes this?" ambiguity.
- *Ungoverned promotion* — the Approval Pipeline + Home Owner Approval prevent an object reaching Production without a recorded, checksum-bound approval and both North Star answers.
- *Invisible state* — the Status marker makes each stage's position auditable at a glance.
- *Scope creep* — Principle 7 and the unchanged scope statement hold the plan to one jar / one shelf / one interaction.

**Highest remaining assumption.** Unchanged from the plan itself and upstream of governance: that an acceptable jar and a lip-bearing empty-shelf plate are obtainable at North-Star quality (the Stage-2 decision gate). Governance sequences and assigns the work; it cannot itself guarantee the asset hit-rate. **[A]**

> **Is the Living Object Vertical Slice Implementation Plan now suitable to become the canonical implementation plan for the Living Object proof?**
>
> **Yes. [I]** The plan already carried the technical discipline (locked scope, verified file/asset facts, flag-isolated stages that each keep the app working, per-stage rollback); Pass 2 adds the governance discipline that makes execution safe and predictable — a mandatory Stop Gate after every stage, exactly-one-owner Failure Ownership, a formalised Living Object Approval Pipeline, and per-stage Status. No scope, architecture, or stage was changed, and no duplicate ownership exists. The one thing the document cannot itself guarantee — that a North-Star-quality jar and shelf plate are obtainable — is correctly held as the explicit Stage-2 decision gate rather than assumed away. On that basis the plan is suitable to be adopted as the **canonical implementation plan for the Living Object proof**, pending only the Home-Owner go-ahead to begin at Stage 0.

---

**This document plans the build only. It implements nothing, generates nothing, and redesigns nothing.**
