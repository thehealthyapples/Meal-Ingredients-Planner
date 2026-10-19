# Living Object — Visual State Architecture (Investigation)

**Classification:** 🟡 AMBER — investigation only. Changes no code/asset/dependency/route; does not redesign the layered renderer.
**Evidence standard:** claims tagged **[V]erified** (code/doc/asset confirmed), **[I]nferred**, **[A]ssumed**.
**Date:** 2026-08-05 · Worktree `tha-living-larder-authoritative` · HEAD `0f59b189`.
**Pass 2 (2026-08-05) — Experience refinement.** Introduces experience-led vocabulary (**Environmental Presence / Reveal** in place of "occlusion"), a fifth **Focused** state, a first-class **Lifted** state, a Working-Position **Hospitality/Character** facet, and one **canonical acceptance question**.
**Pass 3 (2026-08-05) — Final refinement before lock.** Adds a sixth **Settling** transition, names **Environmental Interaction** as the behavioural facet beside Environmental Presence, adds the second (**emotional-realism**) acceptance question, makes **Hospitality measurable**, and completes the experience-first language sweep. Architecture, ownership, renderer and technology are **unchanged**. Changed sections are marked *(Pass 3)*; the change log and the **lock-readiness verdict** are at the foot.
**Pass 4 (2026-08-05) — Canonical Presentation Contract (documentation refinement only, 🟢 GREEN).** Strengthens the long-term contracts before lock: promotes the two acceptance questions into a headline **North Star Acceptance Gate**; adds a **Canonical Presentation Contract** every Living Object inherits (visual continuity across all six states); adds a **Working Position Resting Visibility Contract** (expected resting visibility per Working Position); and adds a one-screen **Orientation Map** for long-term maintainability. **No ownership redesign, no renderer change, no new technology, no code/asset/generation** — every addition names or checks an invariant the architecture already holds. Changed sections are marked *(Pass 4)*; the Pass 4 change log and the updated lock scope are at the foot.

> **Vocabulary rule:** the architecture describes **what the household experiences** first; implementation terms ("occlusion", "front layer", "z-index", "DragOverlay") are **secondary** and appear only as parenthetical notes so engineering stays unambiguous. Prefer *"the home reveals itself behind the jar"* over *"remove the occlusion mask."* The canonical concepts are **Environmental Presence** (the home's own surfaces *remain present in front of* the things kept in them) and **Environmental Reveal** (the home *shows through* when an object is lifted or taken). **[I]**

---

## 0. Headline

**Yes — environmental occlusion should belong entirely to the Working Position, and every Living Object should always be a complete visual asset. This is not a new proposal; it is already how the fridge works, and it should be ratified as canonical for the whole Living Home.** **[V]**

Verified in `living-home-room.tsx` / `.css`:
- Occlusion is a **front layer** (`.lh-front--fridge-*`) — *"the SAME fridge plate, clipped to the foreground furniture, and drawn ABOVE the objects, so each Living Object sits INSIDE the fridge."* — **not** a crop of the object. **[V]**
- Objects render at `z-index:5`; the front-occlusion at `z-index:8`; a resting object is therefore partially covered by the environment while its **asset remains whole**. **[V]**
- The fridge milk asset is a **complete bottle** (no baked crop, no baked foreground). **[V]**
- Dragging lifts the object into a `<DragOverlay>` portal **above everything**, so the **entire** object is visible mid-drag. **[V]**

Two gaps to close (below): the pattern exists **only for the fridge** (hand-tuned masks), and the **"Lifted" state** (fully visible *before* dragging) is not distinctly realised — the full reveal currently happens only at drag-start.

---

## North Star Acceptance Gate *(Pass 4 — Refinement 3)*

**This is the canonical quality gate for every Living Object.** Before any Living Object is accepted, it must pass **both** questions below. **Failure of either question rejects the asset — there is no partial pass.** **[I]**

> **Question 1 — Technical integration:** *"If this object had originally existed in the room photograph, would replacing it with this Living Object be visually indistinguishable?"*
>
> **Question 2 — Emotional realism:** *"Would a household instinctively believe they could reach into the room and pick up this exact object?"*

**Q1 asks *is it really in the photograph?*** — camera, light, contact, scale, edge and material: the object *belongs to the room*. **Q2 asks *would you reach for it?*** — it reads as a real, liftable thing, not a picture of one. An asset can pass one and fail the other: a technically-perfect composite that still feels like a sticker fails **Q2**; a characterful object shot from the wrong camera fails **Q1**. **Both must be "yes."** **[I]**

**Owner — no new owner.** The gate is owned by the **Working Position Asset Profile**'s acceptance clause (detailed in §11b); this section only *promotes* it to the front of the architecture as the canonical quality bar. Every other contract here — the **Presentation Contract** (§4a), the **Resting Visibility Contract** (§5.1) and **Hospitality** (§6) — ultimately serves these two questions. **[I]**

---

## Orientation Map (one screen) *(Pass 4 — Refinement 4)*

For a reader arriving cold, every canonical concept and its **single owner**:

| Concept | Single owner | Read |
|---|---|---|
| The six visual states (Resting · Focused · Lifted · Dragging · Dropped · Settling) | **Runtime** (state machine + z-order) | §2, §3, §8 |
| Environmental **Presence** (home surfaces kept in front of resting objects) | **Working Position** | §5 |
| Environmental **Interaction** (where objects rest, ground, reveal, neighbour, settle) | **Working Position** | §5 |
| Resting visibility (how much of a resting object the home shows) | **Working Position** — Presence, at the **Slot** | §5.1 |
| The complete object silhouette / alpha / body-shadow | **Living Object asset** | §7 |
| Camera · light · material · colour · Hospitality (authoring + acceptance) | **Working Position Asset Profile** | §6, §11a |
| Presentation Contract (visual continuity across all states) | **Working Position Asset Profile** — upheld by Runtime + Information Layer | §4a |
| North Star Acceptance Gate (the two questions) | **Working Position Asset Profile** acceptance clause | Gate, §11b |
| Runtime title / quantity / status / label-follows-object | **Information Layer** | §9 |
| Product facts | **Inventory** | §11a |

**Where the rest lives (this document does *not* redefine these):** the **generation pipeline** and the authoring/acceptance profile are in `WORKING_POSITION_ASSET_PROFILE_ARCHITECTURE.md`; the **renderer / layer stack** is the LOCKED `LIVING_HOME_LAYERED_RENDERING_ARCHITECTURE.md`; the quality North Star is `LIVING_OBJECT_NORTH_STAR_QUALITY_INVESTIGATION.md`. This document owns **visual states, ownership, and the presentation / visibility / acceptance contracts** — nothing else. **[I]**

---

## 1. Current Architecture

`Environment plate → Living Object (complete PNG, z5) → Front occlusion (same plate, clipped to foreground, z8) → [drag] DragOverlay portal (top)`. **[V]**

- Complete object assets: **[V]** (milk = whole bottle).
- Working-Position-owned occlusion via front layers: **[V]** (fridge only).
- Fully-visible dragged object via DragOverlay: **[V]**.
- Runtime state: `drag` state + `is-dragging`; hover/focus lift `translateY(-3px)`, drag lift `translateY(-4px)`. **[V]**

## 2. Visual State Model *(Pass 2 — five states)*

| State | The household experience | As-built | Basis |
|---|---|---|---|
| **1 Resting** | the object simply *is* there, kept in its place; the home's surfaces remain **present in front of** it (a shelf lip, a door guard) | ✅ object z5 under front layer z8 | **[V]** |
| **2 Focused** *(NEW)* | the home *notices you looking*: the object gently **acknowledges attention** — a touch more light/reflection, a hair of scale, its label appears, a soft glow. **No movement, no reveal, no z-order change.** | ⚠️ today a hover *nudges* the object (`translateY(-3px)`) — that is movement, so Focused must be **re-specified as still** | **[V/I]** |
| **3 Lifted** *(now first-class)* | the precise moment the object **leaves its place**: it becomes **completely visible**, the home behind it is **revealed** (Environmental Reveal), its label stays attached — **but it has not begun travelling** | ⚠️ **not distinct today** — the full reveal only starts at drag | **[V gap]** |
| **4 Dragging** | the object **travels** with the hand; label follows; Shopping / Companion / Bin become active | ✅ DragOverlay portal + `DropSpot`s | **[V]** |
| **5 Dropped** | the object is **set down** — released toward a Working Position, or onto Shopping / Companion / Bin | ✅ `onDragEnd` routes to droppable; Bin removes | **[V]** |
| **6 Settling** *(NEW)* | returning to a Working Position, the object **finds its place and quietly rejoins the home** — aligns to its canonical slot, settles onto the surface, slips back behind the home's Presence, and becomes part of the room again → **Resting**. A brief confirmation, not an animation. *(Only when returning to a Working Position; going to Shopping/Companion/Bin the object simply leaves.)* | ⚠️ today a return snaps instantly | **[I]** |

## 3. Canonical Visual States *(Pass 3 — recommended)*

**Ratify exactly six, as one calm loop:** **Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting.** **[I]**

- **Focused** — a calm acknowledgment of attention with **no movement, no Environmental Reveal, no z-order change** (only light/reflection/scale-whisper/label/glow). The home feels *attentive*, not *twitchy*, and *noticing* is separated from *committing to pick up*. **[I]** *(Owner: Runtime state + Information Layer for the label; the object never moves.)*
- **Lifted** — the object **leaves its place**: shown **whole**, above all Environmental Presence; the home **behind it is revealed**; the label **stays attached**; it is **not yet travelling** — the moment the user feels they are *holding the exact object*. **[I]**
- **Settling** *(Refinement 1)* — the closing beat: on returning to a Working Position the object **aligns to its canonical slot and quietly becomes part of the home again**, slipping back behind the home's Presence before **Resting**. It is *a subtle confirmation that the object belongs here once more*, not a long motion; instant snapping feels like a graphics engine, a brief settle feels like setting something down on a real shelf. **Recommended canonical.** **[I]** *(Owner: Runtime state, aligning to the **Working Position Slot** as the canonical target.)*
- The invariant holds **from Lifted through Dragging**: the object renders above all Environmental Presence and is shown in full; **Settling** returns it beneath Presence as it rejoins the room.

## 4. Ownership Matrix (exactly one owner each)

| Concern | **Owner** | Consumers | Reason / evidence |
|---|---|---|---|
| Resting occlusion (guard rails, shelf lips, basket edges, cupboard/drawer frames) | **Working Position** (its foreground furniture = front layers) | runtime z-stack | `.lh-front--*` are the plate's foreground, drawn above objects **[V]** |
| Masking / occlusion geometry (where the lip/rail sits) | **Working Position Slot** (calibration on this plate) | front-layer clip/mask | today hand-tuned bands in CSS → should be slot-owned **[V/I]** |
| Neighbour overlap | **Working Position Slot layout** (DOM order / positions) | runtime | overlap is a placement fact, not an object fact **[I]** |
| Lifted appearance (elevation, full reveal) | **Runtime** (state → z-order transition) | render | a runtime interaction state **[I]** |
| Drag appearance (follow cursor, above env) | **Runtime** (DragOverlay) + Living Object asset (the whole image) | render | `<DragOverlay>` **[V]** |
| Drop appearance / routing | **Runtime** (`onDragEnd`) → destination (WP slot / Shopping / Companion / Bin) | those owners | droppables **[V]** |
| Hit testing | **Runtime** (dnd-kit) on the object element; bounds from the **Slot/asset** | drag | pointer/keyboard sensors **[V]** |
| Z-order | **Runtime** (one canonical stack) | render | fixed layer stack **[V/I]** |
| Foreground guard rails / shelf lips (the artwork) | **Working Position** (never the object) | front layer | they are environment, not object **[V]** |
| The complete object silhouette / alpha | **Living Object asset** (per its Working Position Asset Profile) | all states | asset owns its own pixels only **[V/I]** |

**No property is owned twice.** Environmental occlusion is **wholly** the Working Position's; the Living Object never owns or contains any foreground furniture. **[I]**

## 4a. Canonical Presentation Contract *(Pass 4 — Refinement 1)*

**Every Living Object inherits a Presentation Contract: across every visual state, the household is always interacting with *exactly the same physical object*.** The states change what the home *does* with the object — notices it, lifts it, reveals the room behind it, sets it down — but never *what the object is*. **[I]**

In every state (Resting · Focused · Lifted · Dragging · Dropped · Settling) the contract guarantees:

- **object identity never changes** — it is the same jar throughout;
- **proportions never change** — a state may *elevate* the object, but never rescale or reshape its own geometry;
- **camera perspective never changes** — always seen from the room's one camera;
- **lighting direction never changes** — lit by the room's one light, in every state;
- **material behaviour remains consistent** — glass stays glass, matte stays matte;
- **reflections remain consistent** — highlights read from the same light, not re-invented per state;
- **colour remains consistent** — no state re-tints the object;
- **the object never swaps artwork** — there is exactly one complete asset; a state is never a different image;
- **the Information Layer never detaches** — title / quantity / status stay bound to and travel with the object;
- **the object never appears to become a different object.**

**Why this holds by construction.** A Living Object is **one complete asset** (§7) rendered across all states; the **Runtime** only changes its **elevation, position and z-order** (§8), never substituting or reshaping it; the **WPAP** fixes **camera, light, material and colour** at authoring (§6, §11a); the **Information Layer** stays **bound** in every state (§9). The Presentation Contract simply *names* the continuity these existing invariants already produce, and makes it a **testable acceptance clause** rather than an implicit hope. **[V for single-asset + bound-label as-built; I for the named contract.]**

**Owner — no duplication.** The **Working Position Asset Profile owns the Presentation Contract**, as the *continuity* companion of the acceptance contract it already owns (it already inherits camera / light / Hospitality). The contract is **upheld — not co-owned —** by the parties that already own those surfaces at runtime: the **Runtime** never swaps or reshapes the asset (identity, proportions, no-artwork-swap), and the **Information Layer** never detaches the label. No new owner is introduced, and no clause is owned twice. **[I]**

**Relationship to the gate.** The Presentation Contract is the *continuity* guarantee **across** states; the North Star Acceptance Gate is the *realism* guarantee **of** the asset. An object that changed identity between states would fail the Presentation Contract even if any single frame passed the gate. **[I]**

## 5. The Environment: Presence & Interaction *(Pass 3 — was "Occlusion")*

The Working Position's hold over its objects has **two named facets — one you see, one you feel** — both owned wholly by the Working Position, so this is **naming, not new ownership** *(Refinement 2)*:

**Environmental Presence — what the home shows.** The home's own surfaces (shelf lips, door guards, basket edges, cupboard/drawer frames) **remain present in front of** the things resting in them. *(Implementation note: front layers of the plate drawn above objects — "occlusion".)* **[V]**

**Environmental Interaction — how the home behaves.** The room's quiet rules for the things it keeps: **where an object may rest** (its valid slots), **grounding** (how it meets the surface), **Environmental Reveal** (the home showing through when an object is lifted or taken), **neighbour relationships** (who sits beside whom), and **physical constraints** (what the place will and won't allow). **[I]**

These are two responsibilities of **one owner** (the Working Position) — Presence is the *visible* side, Interaction is the *behavioural* side — so ownership is **clearer, not duplicated**: an engineer asks the Working Position "what shows in front?" (Presence) and "where may this rest and how does it settle/reveal?" (Interaction). The Living Object still owns none of this. **[I]**

**Neither facet is ever baked into the object.** Verified correct and already in use for the fridge (`.lh-front--fridge-{drawers,shelves,doorL,doorR}` — *"the SAME fridge plate, drawn ABOVE the objects"*). **[V]** Recommendations: (a) **generalise** Environmental Presence to every Working Position with foreground surfaces (basket edge, bread-bin lip, cupboard frame, drawer edge) — today only the fridge has it; **[V]** (b) **derive** each Presence layer's geometry from the **Working Position Slot** (tie to the WPAP), replacing the hand-tuned CSS bands; **[I]** (c) keep the **presence stack canonical**: environment(0) → objects(5) → Environmental Presence(8) → UI(40+) → Lifted/Dragging(portal/top). **[V]**

### 5.1 Working Position Resting Visibility Contract *(Pass 4 — Refinement 2)*

**Every Working Position declares the *expected resting visibility* of the objects it keeps** — how much of a resting object the home naturally shows, and how much its own surfaces keep in front. This is **expected visual behaviour, not an exact percentage**: it states *how the place holds its objects*, and a resting object's acceptance is judged against it — a fridge-door object that is *fully* visible at rest is **wrong**, because the door guard should sit in front of its lower part. **[I]**

Expected resting visibility, by Working Position *(examples — behaviour, not measurements)*:

| Working Position | Expected resting visibility |
|---|---|
| **Pantry Shelf** | approximately **fully visible** — an open shelf shows its jars |
| **Fridge Shelf** | **partially hidden** by the shelf lip along the lower edge |
| **Fridge Door** | **lower portion naturally hidden** behind the door guard |
| **Fruit Basket** | objects **overlap naturally** — neighbours sit in front of neighbours |
| **Drawer** | objects **recessed** — the drawer frame sits in front |

**Owner — no new owner.** Resting visibility is a facet of **Environmental Presence**, owned wholly by the **Working Position** and calibrated at the **Working Position Slot** (where the Presence bands / foreground surfaces meet this object). It is **inherited by the WPAP** so acceptance **Question 1** expects the *correct partial visibility for this place* rather than demanding a fully-visible object. It is **never baked into the object** — the object stays a complete asset (§7); the home decides how much of it shows. It is the **resting-state complement to Environmental Reveal**, which governs how much shows once the object is Lifted or taken. **[I]**

## 6. Working Position responsibilities *(Pass 2)*
Owns: camera, plate, lighting, **Environmental Presence artwork (front layers)**, slot geometry (contact plane, anchor, scale, Presence bands), the object layout, and — *new (Refinement 5)* — a **Hospitality / Character** facet. It **decides how much of a resting object is visible** and **what the place feels like**. It never owns the object's own pixels. **[V/I]**

**Hospitality / Character.** Each Working Position owns the room's felt qualities — e.g. Pantry Shelf: *warm · abundant · calm · handcrafted · organised*; Fridge: *fresh · clean · cool · crisp · bright*; Fruit Basket: *seasonal · colourful · inviting · natural*. **These belong in the visual generation contract, not in individual asset prompts.** **[I]** The Working Position owns the character (it is a property of the *place*); the **Working Position Asset Profile inherits it** into generation + acceptance — as the WPAP already inherits camera and light. No new competing owner. **[I]**

**Making it measurable *(Pass 3 — Refinement 4)*.** A felt quality is only enforceable if it names the **visual characteristics that express it**. The Hospitality Profile therefore owns these dimensions (as ranges, per Working Position), which the WPAP carries into generation and the acceptance questions check:

| Felt quality → | expressed through (Hospitality Profile dimensions) |
|---|---|
| **warm** (pantry) | **light temperature** toward gold; **colour balance** to earthy hues; soft **contrast** |
| **cool / fresh / crisp** (fridge) | **light temperature** toward daylight-cool; higher **contrast** & **brightness**; **crisp** edge/focus |
| **clean / bright** (fridge) | glossy/reflective **material finish**; low **surface wear**; even, bright lighting |
| **handcrafted** (pantry) | matte **material finish**; visible **surface wear / patina**; natural irregularity |
| **abundant** (pantry) | higher **fill density**; generous but **organised composition** |
| **calm / organised** (pantry) | measured **composition** & spacing; restrained **colour balance**; quiet **reflection behaviour** |
| **seasonal / colourful / inviting** (basket) | saturated, natural **colour balance**; soft **reflection**; loose, generous **composition** |

The canonical Hospitality dimensions: **light temperature · contrast · brightness · reflection behaviour · material finish · surface wear/patina · fill density · composition/tidiness · colour balance/saturation.** *(This defines what belongs in the Profile — not how it is implemented.)* **[I]**

## 7. Living Object responsibilities
Is **always a complete transparent asset** — the whole ketchup bottle, whole milk bottle — with **no baked clipping and no baked foreground objects**, authored to its Working Position Asset Profile. It owns only its own silhouette/alpha/body-shadow; it carries an **anchor point, hit box, drag point, selection bounds** (as metadata). It does **not** know about rails, lips, or neighbours. **[V for "complete asset today"; I for the metadata contract.]**

## 8. Runtime responsibilities
Owns the **visual state machine** (Resting → Lifted → Dragging → Dropped), the **z-order transitions** (elevate above occlusion from Lifted onward), **hit testing** (dnd-kit), the **DragOverlay**, drop routing, and the label-follows-object binding. It reveals the whole object on lift and returns it on drop. **[V/I]**

## 9. Information Layer responsibilities
Owns runtime title/quantity/status/badges/selection/drag display, bound to and moving with the object; reads Inventory + runtime state; **never baked** into artwork. In every state the label follows the object. **[V]**

## 10. Fridge Example Walkthrough (should this be canonical? — **Yes [I]**)

Ketchup bottle resting in the fridge door:
1. **Resting** — bottle asset is whole; the **door-guard front layer (Environmental Presence, Working Position, z8)** stays in front of its lower part → user sees a bottle *seated in the bin*. **[V mechanism]**
2. **Focused** *(new)* — the user's attention lands on it: it warms slightly, its label appears, a soft glow — **it does not move, and the door guard still sits in front of it.** The home has *noticed*, not *reacted*. **[I]**
3. **Lifted** — the user picks it up: the runtime elevates the bottle **above** the guard → the **entire** bottle is now visible and the fridge **behind it is revealed** (Environmental Reveal); the door guard **stays in Layer 1**; the label stays attached; it is **not yet travelling**. *(The behaviour to make explicit — today the reveal starts at drag.)* **[V gap]**
4. **Dragging** — bottle travels in the **DragOverlay** above everything; **label follows**; Shopping/Companion/Bin become active. **[V]**
5. **Dropped → Shopping** — bottle leaves the fridge slot; the fridge plate behind it is **cleanly revealed** (no crop scar, because nothing was ever baked out). **[V/I]**
6. **…or Settling → Resting** — had the user instead returned it to the door, the bottle would **align to its bin slot, settle onto the shelf, slip back behind the door guard, and become part of the fridge again** — a quiet confirmation, then Resting. **[I]**

This is the correct canonical Living Object interaction. **[I]**

---

## Pass 2 — Summary of Changes
1. **Vocabulary → experience-led.** "Occlusion" reframed as **Environmental Presence** (home surfaces in front of resting objects) + **Environmental Reveal** (home shown behind a lifted object). "Occlusion" kept only as an implementation note. *(§ banner, §5, §6, §10, §12)*
2. **Fifth state added — Focused.** A still, calm acknowledgment of attention (light/reflection/scale-whisper/label/glow) with **no movement, no Reveal, no z-order change**, between Resting and Lifted. *(§2, §3, §10)*
3. **Lifted promoted to a first-class state** — the moment the object *leaves its place*: whole, home revealed, label attached, **not yet travelling** (distinct from Dragging). *(§2, §3, §10)*
4. **Owners confirmed (Refinement 4)** — three visual owners (WP / WPAP / Living Object) sufficient and non-duplicating; Runtime/Information/Inventory own interaction & data; Slot is a WP sub-property. *(§11a)*
5. **Hospitality / Character added** — owned by the **Working Position**, **inherited by the WPAP** into the generation contract (no new competing owner). *(§6)*
6. **Canonical acceptance test adopted** — one binary question: *"If this object had originally existed in the room photograph, would replacing it be visually indistinguishable?"* *(§11b)*

**Reasons.** Each change moves the description from *how the renderer works* to *what the household experiences* (a home, not a graphics engine): Presence/Reveal read as a real kitchen; Focused makes the home feel attentive rather than twitchy; a true Lifted beat gives the honest "I'm holding this" moment; Hospitality guarantees each room *feels* right by construction; the one acceptance question makes quality binary and testable.

**Architectural risks.** (a) **Focused overuse** — glows/scale must stay whisper-quiet or the home feels gamified (the very failure mode to avoid); keep Focused *barely perceptible*. **[I]** (b) **Hospitality vs measurable acceptance** — subjective character words must be pinned to concrete generation params in the WPAP or they drift; the acceptance question is the guard. **[I]** (c) **Terminology churn** — "Presence/Reveal" is new vocabulary; the implementation-note mapping to "occlusion/front layers" must be kept so engineering stays unambiguous. **[I]**

**Duplicated ownership discovered.** **None.** Hospitality is placed on the Working Position (the *place*) and merely *inherited* by the WPAP — deliberately avoiding a second owner; the Slot remains a WP sub-property, not a peer owner. **[V/I]**

**Highest remaining assumption.** That the felt **Hospitality/Character** qualities can be reduced to **concrete, inheritable generation parameters** (light temperature, saturation, contrast, prop density, tidiness) that reliably pass the acceptance questions — i.e. that "warm/abundant" or "fresh/crisp" translate to a repeatable authoring recipe, not a mood the AI interprets differently each run. Unproven; validate on the pantry (warm) and fridge (cool) as the first two Hospitality profiles. **[A]**

---

## Pass 3 — Summary of Refinements
1. **Settling — sixth transition** *(Refinement 1)*. Returning to a Working Position, an object aligns to its slot and **quietly rejoins the home** before Resting. Loop is now **Resting → Focused → Lifted → Dragging → Dropped → Settling → Resting**. *(§2, §3, §10, §12)*
2. **Environmental Interaction** *(Refinement 2)*. Named as the **behavioural** facet of the Working Position (valid slots, grounding, reveal, neighbours, constraints) beside **Environmental Presence** (the *visible* facet). Same owner, two responsibilities. *(§5)*
3. **Second acceptance question** *(Refinement 3)*. Added *"Would a household instinctively believe they could reach in and pick up this exact object?"* — **Q1 = technical integration, Q2 = emotional realism**; both must pass. *(§11b)*
4. **Measurable Hospitality** *(Refinement 4)*. Felt qualities mapped to concrete Profile dimensions — light temperature, contrast, brightness, reflection, material finish, surface wear, fill density, composition, colour balance. *(§6)*
5. **Experience-first language** *(Refinement 5)*. Sweep completed; "occlusion/front layer/z-index" now appear only as parenthetical implementation notes; the household experience leads. *(throughout)*

**Reasons.** Each refinement makes the document read as *living inside a home*: Settling gives a return the calm of setting something down; Presence/Interaction separates *what you see* from *how the room behaves* without a new owner; the two questions test both that the object *is in the photograph* and that it *invites the hand*; measurable Hospitality turns mood into a repeatable contract; the language sweep keeps engineering honest while speaking the household's language.

**Architectural risks introduced.** (a) **Settling over-timing** — must be a *breath*, not an animation, or it feels like a graphics engine (the very thing to avoid). **[I]** (b) **Two-facet confusion** — Presence vs Interaction must be documented as **one owner, two responsibilities**, or a reader may infer two owners. **[I]** (c) **Measurable Hospitality rigidity** — the dimensions are *ranges/intent*, not fixed numbers; over-tightening could sterilise the handcrafted feel. **[I]** No ownership was redesigned; no technology introduced; the renderer is untouched.

**Highest remaining assumption (final).** Same as Pass 2, now sharper: that **Hospitality reduces to inheritable parameters that satisfy both acceptance questions at an acceptable AI hit-rate** — proven on pantry (warm) and fridge (cool) before scaling.

---

## Pass 4 — Summary of Refinements
1. **North Star Acceptance Gate** *(Refinement 3)* — the two acceptance questions are **promoted to a headline gate** near the top; **failure of either rejects the asset**. Ownership is unchanged (the WPAP acceptance clause, §11b); the gate only raises their prominence to the canonical quality bar. *(new "North Star Acceptance Gate" section, §11b)*
2. **Canonical Presentation Contract** *(Refinement 1)* — every Living Object inherits a named contract guaranteeing **visual continuity across all six states** (identity, proportions, camera, light, material, reflections, colour, no artwork swap, bound Information Layer, never a different object). **Owner: Working Position Asset Profile**, *upheld* by Runtime + Information Layer — **no new owner, no clause owned twice**. It names continuity the single-asset architecture already produces. *(§4a)*
3. **Working Position Resting Visibility Contract** *(Refinement 2)* — each Working Position declares the **expected resting visibility** of its objects (behaviour, not percentages). **Owner: Working Position**, as a facet of **Environmental Presence** calibrated at the **Slot** and inherited by the WPAP for acceptance Q1. *(§5.1)*
4. **Orientation Map + maintainability sweep** *(Refinement 4)* — a one-screen concept→owner→section table plus pointers to the generation-pipeline, renderer and North Star documents, so a reader joining in three years finds **ownership, states, generation and acceptance** immediately. Wording clarified where ambiguous; **nothing redesigned**. *(new "Orientation Map" section)*

**Reasons.** The gate makes quality the *first* thing a reader meets and binary to apply. The Presentation Contract closes the one continuity guarantee the states model implied but never stated — that it is *the same object* throughout — purely by naming existing invariants. The Resting Visibility Contract turns "the home decides how much shows" into a per-place expectation acceptance can check. The Orientation Map protects the architecture against knowledge loss.

**Ownership changes.** **None.** Two new contracts, both assigned to **existing owners** (WPAP; Working Position) with existing parties as *upholders / consumers*. No property is owned twice. **[I]**

**Architectural risks introduced.** (a) **Contract-as-checklist drift** — the Presentation Contract must stay a *consequence of the single-asset invariant*, not a hand-maintained list; if the single-asset rule ever bent, the contract would silently over-promise. **[I]** (b) **Visibility-as-percentage creep** — the Resting Visibility Contract is *expected behaviour*; hardening it into fixed percentages would re-introduce the per-plate special-casing the architecture is trying to avoid. **[I]** No renderer, technology, or ownership was changed.

**Highest remaining assumption (unchanged, still the ceiling).** That **Hospitality/Character reduces to inheritable generation parameters that satisfy both North Star questions at an acceptable AI hit-rate** — to be proven on pantry (warm) and fridge (cool). The Pass 4 contracts add *no* new assumption of their own: each names or checks an invariant the architecture already holds. **[A for Hospitality; I for the contracts.]**

---

## Lock-Readiness Verdict

> **Is the Living Object Visual State Architecture now ready to become a LOCKED canonical architecture for the Living Home?**
>
> **Yes — ready to lock, as an *experience & ownership* architecture.** It is internally consistent, has **exactly one owner per property with no duplication**, aligns with the LOCKED layered-rendering model and the Working Position Asset Profile, **introduces no new technology and no renderer change**, and its core (complete assets + Working-Position Environmental Presence + DragOverlay reveal) is **verified as already implemented and correct in the fridge**. **[V/I]**
>
> **Lock scope — precise:** lock the **canonical concepts, states, and ownership** — the six states (Resting · Focused · Lifted · Dragging · Dropped · Settling); Environmental **Presence** & **Interaction** owned wholly by the Working Position; the Living Object as an **always-complete** asset; **Hospitality/Character** owned by the Working Position and inherited by the WPAP; the **two-question acceptance test**, promoted to the canonical **North Star Acceptance Gate**; the **Canonical Presentation Contract** (WPAP-owned, upheld by Runtime + Information Layer); and the **Working Position Resting Visibility Contract** (Working Position, via Environmental Presence at the Slot). *(The Pass 4 contracts add no new owner and no new technology; they name or check invariants the architecture already holds, so they lock cleanly with the rest.)*
>
> **Explicitly *not* locked (craftsmanship, follows the lock):** the *implementation* of Focused/Lifted/Settling as distinct states, the *generalisation* of Environmental Presence beyond the fridge, slot-derived geometry, and the concrete Hospitality parameter values — each to be proven on the **one-jar → one-fridge-shelf** slices before rollout. This mirrors the constitution's own principle: *architecture gives way to craftsmanship.* **[I]**
>
> **One honest precondition:** the app is currently **build-broken** (the interrupted 3D-POC route) and cannot be run; locking the *document* is safe now, but *validating* any of the craftsmanship items requires the pending recovery fix. **[V]**

## 11. Migration Impact

**Low, additive, no renderer/schema change [I]:**
1. **Ratify** two rules in the constitution: *(a) environmental occlusion belongs entirely to the Working Position (front layers); (b) every Living Object asset is complete — no baked clipping, no baked foreground.* (Already true for the fridge.) **[V]**
2. **Generalise** the `.lh-front--*` front-layer pattern to all Working Positions with foreground furniture (currently fridge-only). **[V]**
3. **Make "Lifted" a real state** — elevate the object above the front-occlusion the moment it is picked up/selected, not only at drag-start. **[V gap]**
4. **Move occlusion geometry to the Working Position Slot** (derived, not hand-tuned CSS bands) — ties to the WPAP investigation. **[I]**
5. Formalise the object **metadata contract** (anchor / hitbox / drag point / selection bounds). **[I]**
No changes to inventory, the layered renderer, or drag technology. **[V]**

## 11a. Owner confirmation *(Pass 2 — Refinement 4)*
The three **visual/asset** owners — **Working Position** (scene truth + Environmental Presence + Hospitality), **Working Position Asset Profile** (authoring/acceptance contract, inheriting the former), **Living Object** (the complete asset) — are **sufficient and non-duplicating** for every *visual* property. The **interaction & data** side is owned separately and orthogonally by **Runtime** (the five-state machine, z-order, hit-testing, Reveal), the **Information Layer** (runtime title/qty/status), and **Inventory** (product facts); the **Working Position Slot** is a *sub-property of the Working Position*, not a fourth owner. **Every visual property maps to exactly one owner; no duplication found.** **[V/I]**

## 11b. Canonical Living Object acceptance test *(Pass 3 — two questions)*
Every Living Object must pass **two** binary, household-framed questions, owned by the Working Position Asset Profile's acceptance clause. **Both must be "yes"; either "no" rejects the asset.** **[I]**

> **1 — Technical integration:** *"If this object had originally existed in the room photograph, would replacing it with this Living Object be visually indistinguishable?"*
>
> **2 — Emotional realism *(Refinement 3)*:** *"Would a household instinctively believe they could reach into the room and pick up this exact object?"*

**Question 1 validates technical integration** (camera, light, contact, scale, edge — the object *belongs to the photograph*). **Question 2 validates emotional realism** (the object *invites the hand* — it reads as a real, liftable thing, not a picture of one). Together they make the North Star testable from both sides: *is it really in the room?* and *would you reach for it?* **[I]**

## 12. Recommendation *(Pass 3)*

> **Should the home's own surfaces belong entirely to the Working Position while every Living Object always remains a complete visual asset?**
>
> **Yes — ratify as canonical.** The **Environment (Presence + Interaction)** — the surfaces the home keeps in front of things, and the rules for where they may rest, how they ground, reveal, neighbour and settle — is **wholly** the Working Position's; the Living Object asset is **always complete** — no baked clipping, no baked foreground. The **six visual states — Resting · Focused · Lifted · Dragging · Dropped · Settling** — are owned by the **runtime**: the home **notices** at Focused (no movement), **reveals itself** as the object is **Lifted** whole above all Presence, lets it **travel** while Dragging, is **set down** at Dropped, and — returning home — lets it **Settle** back into its slot. Every object is judged by **two questions** (§11b): *is it really in the photograph?* and *would you reach for it?* Each Working Position also owns a measurable **Hospitality/Character**, inherited by the WPAP so the room *feels* right by construction. Repository evidence shows the core model **already governs the fridge and is correct**; the remaining work is craftsmanship and formalisation — generalise Presence, make Focused/Lifted/Settling explicit, source geometry from the Slot. **No renderer redesign; no duplicate ownership.** **[V for as-built fridge; I for the refinements.]**

## Highest-risk assumption
That the **front-layer occlusion pattern generalises cleanly** to every Working Position (baskets, bread bin, cupboard, drawers) without per-stage special-casing — i.e. that occlusion geometry can be **slot-derived** rather than hand-authored per plate. Verified only for the fridge (hand-tuned); **assumed** transferable and should be proven on a second Working Position (e.g. the fruit basket) before being declared universal. **[V fridge / A generalisation]**
