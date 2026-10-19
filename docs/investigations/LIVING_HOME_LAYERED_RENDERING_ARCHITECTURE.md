# Living Home — Layered Rendering Architecture (Investigation)

**Classification:** 🟡 AMBER — architecture investigation only. **Implements nothing.** No code, asset, schema, route, or dependency changes because this document exists.
**Date:** 2026-08-05 · **Worktree:** `tha-living-larder-authoritative` · **HEAD:** `0f59b189`
**Evidence standard:** every material claim tagged **[V]erified** (confirmed in code/governing docs), **[I]nferred** (reasoned from evidence), or **[A]ssumed** (not confirmed).

---

## 0. Headline finding (read first)

**The layered Living Object architecture this brief proposes is, in its essentials, already the implemented and LOCKED model — not a future direction.** The premise that "our current approach treats the Living Pantry as a single rendered image" is **inaccurate for the current build**. **[V]**

Verified in `client/src/pages/living-home-room.tsx` / `living-home-room.css`:
- **Layer 1 — Environment:** `.lh-plate--<name>` are CSS `background-image` plates that crossfade; they never move; removing an object simply reveals the plate. **[V]**
- **Layer 2 — Living Objects:** `.lh-layer` holds independent `<LivingObject>` elements — each an absolutely-positioned transparent PNG, `useDraggable` via **dnd-kit**, independently positioned/animated/selectable; dragging one moves only that element. **[V]**
- **Occlusion:** `.lh-front--*` re-draws foreground furniture *above* objects so a jar tucks behind a shelf lip. **[V]**
- **Layer 3 — Information:** `.lh-obj__cap` / `.lh-jar-name` are **runtime DOM text**, never baked into artwork. **[V]**
- **Interaction sinks:** `DropSpot` (`useDroppable`) for Shopping / Companion / Bin. **[V]**
- **Rendering technology:** pure **React DOM + CSS transforms**. No canvas/WebGL/Pixi/Konva/Three in the room. **[V]**

Therefore the real question is **not** "should we adopt this?" but **"should we FORMALISE this as the canonical model for the entire Living Home, and where should it be refined (container/contents, grounding, shadow ownership)?"** The honest answer is **yes, formalise and extend — do not re-platform.** Full reasoning below.

The locked constitution already names this model: *empty Environment Plate + independent transparent-PNG Living Objects*, explicitly chosen over the earlier "baked-in food + coordinate hotspots" approach (`LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md`, LOCKED). **[V]**

---

## 1. The three canonical layers

### Layer 1 — Environment  *(never moves)*
Walls, shelves, cupboards, worktops, windows, floor, fixed lighting, **environmental** shadows. Owned by the **Living Home Production Asset Architecture** (Environment Plates · Cameras · Lighting). One fixed camera per Working Position; removing an object reveals this layer unchanged. **[V]** Current form: a CSS `background-image` still photograph per plate. **[V]**

### Layer 2 — Living Objects  *(independent, movable)*
Jars, tins, bottles, bowls, baskets, boards, scales, fruit, veg, milk, yoghurt. Each **independently rendered / positioned / draggable / animated / selectable**. Owned by the **Living Object Model (LOCKED)**. Current form: one transparent PNG per object, absolutely positioned (`left/top %`, `height %`), `transform: translate(-50%,0)`, dnd-kit draggable. **[V]**

### Layer 2A / 2B — Container vs Contents  *(proposed split — evaluated)*
- **2A Container:** glass jar / tin / basket / bottle. **2B Contents:** rice / flour / oats / lentils / fill-level.
- **Current state [V]:** container **and** contents are a **single authored asset**. The jar pipeline (`scripts/generate-larder-jar-masters.ts`) draws one parametric glass jar and fills it with **procedurally-generated per-family contents at build time** (a seeded renderer per ingredient), with the glass, a content-shade gradient, reflections and a blank runtime label composited into one PNG. Fridge vessels (milk, juice) similarly bake contents in. There is **no runtime 2-layer composite** today.

**Advantages of splitting 2A/2B (as *runtime* layers):**
- Reuse: one glass asset × N contents → fewer masters. **[I]**
- Live variation without re-authoring: same jar, different contents / fill level, driven by data. **[I]**

**Disadvantages of splitting 2A/2B (as *runtime* layers):**
- **Glass refraction is lost.** A real glass jar refracts and tints what's behind it; "contents PNG behind a translucent glass PNG" reads as a decal unless the glass carries baked refraction/masking — which is exactly the delicate part the procedural pipeline already solves. **[I]**
- **Interior masking + lighting must be reproduced at runtime** (clip contents to the vessel interior, match the fixed room light) — fiddly in DOM, easy to get subtly wrong. **[I]**
- **Low payoff for the fridge**, where contents are integral (milk in a bottle). **[I]**

**Recommendation on 2A/2B [I]:** express the split as a **parametric asset (container geometry + contents renderer) resolved at BUILD time** — i.e. keep doing what the jar generator already does, extended to more vessels — **not** as two runtime DOM layers. This yields the reuse/variation benefits (per-content, per-fill outputs) while keeping correct glass and one clean runtime object. Only adopt a *runtime* contents layer if a concrete need appears (e.g. animated draining of a jar), and even then via a masked element bound to the container, not a free-floating second sprite.

### Layer 3 — Information  *(runtime only, belongs to the object)*
Title, quantity, status, nutrition badge, "running low", selection, drag state. **Never baked into artwork.** Current form: DOM overlays (`.lh-obj__cap`, `.lh-jar-name`) positioned relative to the object; state toggled by class. **[V]** Data ownership stays where the locked canon puts it (inventory/selection with the Living Object; purchase quantity with the Shopping domain; knowledge with the Companion) — this layer only *renders* that state. **[V]**

---

## 2. The 18 investigation questions

**Q1 — Works efficiently in React?** **Yes [V].** It already does: ~20–60 absolutely-positioned image elements per Working Position, React reconciles a small tree, dnd-kit handles pointer state. This is well within DOM's comfort zone.

**Q2 — Are CSS transforms sufficient?** **Yes [I].** `transform`/`opacity` are GPU-composited and cover positioning, hover-lift, drag-lift, entry-settle and removal. Recommendation: animate with `transform`/`opacity` (not `top/left`) to avoid layout; static placement by `%` is fine. **[I]**

**Q3 — Canvas advantages?** Only at **scale** (hundreds–thousands of sprites) or for per-pixel effects. Costs: forfeits DOM accessibility, re-implements hit-testing/focus/drag, harder crisp text. **Not warranted** at this object count. **[I]**

**Q4 — PixiJS?** WebGL 2D sprite/particle engine — excellent for thousands of animated sprites/particles; **overkill** here, adds bundle + GPU + the same a11y loss as canvas. **No. [I]**

**Q5 — React Konva?** Canvas via a pleasant declarative API; same canvas trade-offs (a11y/text/DOM loss) for no benefit at this scale. **No. [I]**

**Q6 — React Three Fiber?** 3D scene graph. The brief itself says this is **not a game, not a 3D simulation, not physics**; prior RED investigations found it out-of-model, mobile-risky, produce-blocked, and accessibility-hostile. **No genuine benefit. [V]** (governing findings on file: `living-larder-3d-milk-poc-decision.md`, `living-larder-scope-drift-and-fridge-direction.md`.)

**Q7 — Mobile friendly?** **Yes [V].** DOM+CSS scales via the stage `aspect-ratio` + `min(88dvh,…)`; touch drag via dnd-kit `TouchSensor` (in use). WebGL would introduce battery/thermal/frame-rate risk — a reason to *stay* DOM. **[I]**

**Q8 — Drag-and-drop stay simple?** **Yes [V].** dnd-kit already provides Pointer/Touch/Keyboard sensors, a drag overlay, and collision detection against droppable rects (Shopping/Companion/Bin). No physics.

**Q9 — Collision detection simple?** **Yes [V].** dnd-kit rectangle-intersection / closest-centre against the three DropSpots is sufficient; there is no object-to-object collision requirement (objects occupy authored positions, not a simulated space). **[I]**

**Q10 — Hit testing?** Native **DOM pointer hit-testing** on each object element. Today it is **bounding-box** (the PNG's box). **[V]** For tightly-packed irregular shapes this can over-capture; refine only if needed (e.g. `pointer-events` on a tighter inner element, or alpha-aware hit-testing as a last resort). **[I]**

**Q11 — Z-order?** DOM source order + `z-index`; the dragged object is elevated (`z-index:50`); the `.lh-front` occlusion layer sits *above* objects to create depth (jar behind a shelf lip). **[V]** Recommend formalising a fixed stack: environment(0) → objects(5) → front-occlusion(8) → info/labels(9) → drag-overlay(50). **[I]**

**Q12 / Q13 — Shadows; runtime vs baked?** **Hybrid, with a rule [V]/[I]:**
- **Contact (grounding) shadow → RUNTIME, on the environment, per object.** It must **stay on the shelf when the object lifts** (softening/spreading) — that "the shadow stays where the jar was" cue is the essence of *picking something up*. Already implemented (`.lh-jar-shadow` / `.lh-obj__seat` with transitions). **[V]** **Baking the contact shadow into the object PNG is wrong for a movable object** — it would travel with the object and destroy the illusion. **[I]** (This is the crux of the fridge floating problem: objects lacked a correct runtime contact shadow *and* were shot at the wrong camera.)
- **Form (body) shadow → cheap runtime CSS `drop-shadow`**, direction fixed to the room's camera-right light. **[V]**
- **Should objects cast runtime shadows?** A **soft CSS drop-shadow + a runtime contact ellipse: yes.** A dynamic, scene-accurate cast shadow (shadow mapping): **no** — that is 3D/game territory the brief excludes. **[I]**

**Q14 — Animation?** CSS transitions/keyframes for entry-settle, hover-lift, drag-lift + shadow-spread, removal; **Framer Motion** (already a dependency) for any orchestrated sequences. Respect `prefers-reduced-motion` (already handled). No animation engine. **[V]**

**Q15 — Companion interactions?** Drag object → `DropSpot kind="companion"` (or the in-place action bar) → Companion answers about that item. The object carries `{name, product}`; the Information layer can reflect a Companion notice. Stays in the DOM model. **[V]**

**Q16 — Shopping List interactions?** Drag object → `DropSpot kind="shopping"` → adds intent; the Shopping domain owns quantity (locked ownership). Information layer shows "on the list / running low". **[V]**

**Q17 — Bin interactions?** Drag object → `DropSpot kind="bin"` → true removal (object leaves Layer 2; Layer 1 shows through). Already implemented via a `removed` set. **[V]**

**Q18 — Accessibility?** DOM is the **decisive advantage [V]/[I]:** each Living Object is a focusable element with an `aria-label` (name + intended action); dnd-kit `KeyboardSensor` gives a non-pointer drag path; an in-place action bar (tap/keyboard) is the drag alternative; `prefers-reduced-motion` honoured. Canvas/WebGL would forfeit all of this and require a parallel hidden-DOM a11y tree. Recommend: object = `button`/role, `aria-label` includes status, keyboard-operable move/select, live-region announcements for add/remove.

---

## 3. Output

### 1. Recommended rendering architecture
**Three canonical layers composited in React DOM + CSS** — Environment Plate (fixed still) · independent Living Objects (transparent elements) · Information overlay (runtime DOM). **Formalise the existing locked model as canonical for the whole Living Home.** Handle container/contents **parametrically at build time**, not as runtime layers. **[V]** current; **[I]** recommendation.

### 2. Canonical ownership per layer
- **L1 Environment** → Living Home Production Asset Architecture (Plates/Cameras/Lighting). **[V]**
- **L2 Living Objects** → Living Object Model (LOCKED); runtime instance = the object lists in `living-home-room.tsx`. **[V]**
- **L2A/2B Container/Contents** → the **asset pipeline** (parametric generator), a *build-time* concern, not a runtime layer. **[I]**
- **L3 Information** → the domains that own the data (inventory/selection with the object; purchase quantity with Shopping; knowledge with Companion), *rendered* as a DOM overlay bound to the object; never baked. **[V]**

### 3. Recommended runtime model
One React component per Living Object (absolute position, transform for motion); **dnd-kit** for drag/drop/collision/keyboard; **CSS + Framer Motion** for animation; **DOM** for hit-testing/z-order/focus/a11y. No canvas/WebGL. **[V]/[I]**

### 4. Recommended asset pipeline
A **parametric vessel generator** (the jar-master approach, extended): container geometry + per-content renderer + fill level → transparent PNG masters, **rendered at each Working Position's camera** with the room's fixed lighting. Contact shadow **not** baked (runtime element instead); form-shadow via CSS. Fridge objects re-mastered **perspective-matched** to the fridge stage. **[V]** pipeline exists; **[I]** extension.

### 5. Recommended rendering technology
**React DOM + CSS transforms.** [V] It is the current stack and uniquely satisfies every stated goal (furniture/object realism via photoreal PNGs; simple interaction; fast; quiet; mobile; accessible). **Reject** Canvas, PixiJS, React Konva (a11y/text/DOM loss for no benefit at this scale) and React Three Fiber (3D, out-of-model). **[I]**

### 6. Performance considerations
Dozens of transform/opacity-animated images are cheap and GPU-composited. Main cost is **image weight** (photoreal PNGs) → compress, size to display, lazy-load per Working Position, and avoid animating layout properties. Keep per-view object counts in the tens, not thousands (the design intent). **[I]**

### 7. Mobile considerations
Stays DOM/CSS → responsive by construction; touch drag supported; no GPU scene loop; no battery/thermal risk. Ensure touch targets ≥ ~44px and labels remain legible at small stage sizes. **[V]/[I]**

### 8. Accessibility considerations
The reason to stay in the DOM. Focusable, labelled objects; keyboard move/select; in-place action bar as the drag alternative; reduced-motion; live-region announcements. Any move to canvas/WebGL would regress this materially. **[V]/[I]**

### 9. Future extensibility
Model extends to every Working Position and room: a new object = a PNG master + a list entry; a new badge = a DOM overlay; new content variety = more parametric generator output. No engine change ever required for more objects. **[I]**

### 10. Migration strategy from the current implementation
**Low — because there is little to migrate.** The layered model already ships. "Migration" = **formalisation + craftsmanship**, not re-platforming:
1. Ratify the 3-layer ownership + the "contact shadow is runtime, never baked" rule in the constitution. **[I]**
2. Fix fridge objects to **perspective-matched + runtime-grounded** (authored stages/slots — the Option C of the drift investigation). **[V] problem, [I] fix.**
3. Standardise a single runtime **contact-shadow** primitive across all objects. **[I]**
4. Parametrise container/contents at build time for vessel variety. **[I]**
No rendering-technology migration. **[I]**

### 11. Risks
- **Asset weight / perf** with many photoreal PNGs → compression/sizing/lazy discipline. **[I]**
- **Per-stage grounding & perspective** (the known fridge defect) must be authored correctly, or objects float regardless of layering. **[V]**
- **Runtime container/contents compositing** would be fragile (glass refraction, interior masking) → prefer build-time parametric. **[I]**
- **Scope-creep toward canvas/3D** — actively resist; it trades away a11y/mobile/quietness for capabilities the product explicitly does not want. **[V] intent.**
- **Hit-testing over-capture** for tightly-packed irregular objects → refine only if observed. **[I]**

### 12. Recommendation

> **Should The Healthy Apples adopt a layered Living Object rendering architecture as the canonical rendering model for the entire Living Home?**
>
> **Yes — and it already largely has.** Adopt/ratify the **three-layer model (Environment Plate · independent Living Objects · runtime Information)** rendered in **React DOM + CSS**, with **dnd-kit** interaction, **runtime (never baked) contact shadows**, and **build-time parametric container/contents**. This is the only model that delivers furniture/object realism, the genuine "pick up a jar" feel, simple fast interaction, mobility, accessibility and *quiet* technology at once. **Do not** move the Living Home to Canvas, PixiJS, Konva, or Three Fiber. The remaining work is **craftsmanship inside this model** (correct per-stage camera, grounding, and shadow ownership — the fridge fix), not a new rendering engine. **[V] the model exists & is locked; [I] the recommendation to formalise + extend.**

---

## 4. Highest-risk assumption
That the product genuinely wants to **remain 2D/DOM** (furniture-realistic, not spatially-simulated). Every recommendation here follows from the brief's own "NOT a game / NOT 3D / quiet technology" constraint. **[V from brief].** If that constraint were ever relaxed to *walk-around spatial realism*, this entire recommendation would need re-opening — but nothing in the current product vision or governing architecture asks for that.
