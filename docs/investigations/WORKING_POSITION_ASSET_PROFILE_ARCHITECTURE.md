# Working Position Asset Profile — Architecture Investigation

**Classification:** 🟡 AMBER — investigation only. Implements nothing; changes no code, asset, dependency, schema, or route. Does **not** redesign the layered rendering model.
**Evidence standard:** claims tagged **[V]erified** (code/doc/asset confirmed), **[I]nferred**, **[A]ssumed**.
**Date:** 2026-08-05 · Worktree `tha-living-larder-authoritative` · HEAD `0f59b189`.

---

## 0. Headline

**Yes — the Working Position Asset Profile is the missing architectural owner.** The evidence is not merely suggestive; it is a **root-cause match**:

- The Living Home already asserts, in the LOCKED constitution, that **each Working Position owns `Camera · Environment Plate · Lighting · Interaction Regions · Living Object Layout …`** (§140) and that the **object-lighting spec + Camera Acceptance Test** are per-Set law: *"if it could not be a photograph taken from a different spot in the one room, it is rejected."* (§283). **[V]**
- **But that ownership is never bound to object generation.** Plate generation is spec-driven (`generate-environment-plate.py --spec …`), whereas the **object generators hardcode their own authoring style and read no Working-Position profile** (`generate-fridge-product.py` STYLE = *"STRAIGHT FROM THE FRONT"*; `generate-larder-jar-masters.ts` = *"front-on 90°"*). **[V]**
- Worse, the **object spec itself drifted from the room**: `FRIDGE_OBJECTS_SHELF_SPEC.md` asks for *"contact sheet… lit from the front… floating… like cut-out product shots. No shelf or surface. No cast shadows."* — the exact opposite of the fridge's top-down, on-shelf, contact-grounded reality. **[V]**

The jars succeed only **by coincidence** (their hardcoded "front-on 90°" happens to match the front-on pantry camera); the fridge fails because its hardcoded "front-on" **contradicts** the top-down fridge camera, and **nothing in the pipeline catches it.** A Working Position Asset Profile — a single, versioned, machine-consumed contract that **binds every object's generation and acceptance to its room's camera/light/contact** — is precisely the owner that would make "front-on fridge object" impossible to author and would make the North Star reachable **uniformly**, not accidentally. **[I, strongly supported]**

It is **not** a new layer in the renderer. It sits in the **authoring pipeline**, upstream of the (locked) Layer-2 asset.

---

## 1. Current Architecture

`Working Position (camera/plate/light/layout) → [gap] → hardcoded object generator → Living Object PNG → runtime Living Object`. **[V]**

The **[gap]** is the problem: object generation does not inherit from the Working Position. Today's real chain is three **disconnected** expressions of the same intent, free to drift:
1. **Prose specs** (`docs/asset-specs/FRIDGE_OBJECTS_*_SPEC.md`) — human-readable, not pipeline-read, and themselves drifted (front-lit floating cut-outs). **[V]**
2. **Hardcoded generator style** (`generate-fridge-product.py`, `generate-larder-jar-masters.ts`) — the *actual* authoring contract, independent of any Working Position. **[V]**
3. **Runtime hand-tuning** (`living-home-room.tsx`/`.css` positions, `.lh-obj__seat`, occlusion bands) — compensating at runtime for assets that arrived wrong. **[V]**

## 2. Current Owners

| Concern | Current owner | Evidence |
|---|---|---|
| Camera / plate / lighting / layout / interaction (per WP) | **Working Position** (constitution §140/§283) | **[V]** |
| Object *authoring* contract | **each generator, hardcoded** (no WP binding) | **[V]** |
| Object acceptance | Camera Acceptance Test (prose, §283) — not machine-enforced for objects | **[V]** |
| Placement/grounding | runtime `living-home-room.tsx`/`.css` (hand-tuned) | **[V]** |
| Inventory/product facts | inventory domain (unchanged) | **[V]** |
| Runtime info | Information layer (`.lh-obj__cap` etc.) | **[V]** |

**Duplicate/disconnected ownership today:** the object-authoring intent lives in *three* places (prose spec, generator, runtime) with no single owner — the defect this investigation addresses. **[V]**

## 3. The Working Position Asset Profile (proposed owner)

A **Working Position Asset Profile (WPAP)** is a **single, versioned, machine-consumed contract per Working Position**, **derived from** (bound to, never duplicating) that Working Position's scene truth, that **owns the object-authoring & acceptance contract** and is **read by the generation pipeline and the QA gate**.

Pipeline becomes:
```
Working Position  (owns camera, plate, lighting, layout, interaction)      [scene truth]
      │  binds ↓
Working Position Asset Profile  (derives + owns the authoring/acceptance contract)   [NEW OWNER]
      │  consumed by ↓
Object generation  ("generate a Living Object for WP=Fridge using Fridge WPAP")
      │  produces ↓
Living Object Asset  (conforms to the WPAP by construction)
      │  placed by ↓
Working Position Slot  (per-instance anchor/scale/occlusion, from the WP layout)
      │  instantiated as ↓
Runtime Living Object  (identity + state) + Information layer  (title/qty/status)
```
**[I — design; the plate pipeline already works exactly this way via `--spec`, so it is proven for plates and directly transferable to objects. [V] for plates.]**

## 4. Recommended Ownership (exactly one owner per property)

- **Working Position** — the *scene truth*: camera (angle/height/focal/perspective), environment plate, lighting direction & temperature, environmental shadow/ambient/reflection character, wall & timber colour, interaction regions, **Living Object Layout (slots)**. **[V — already so.]**
- **Working Position Asset Profile** — the *authoring & acceptance contract*, **referencing** (not re-owning) the scene truth: generation-prompt guidance, AI constraints, alpha-edge & background-separation standard, export resolution, realism standard, glass/material appearance standard, **contact-shadow SPEC**, **body-shadow SPEC**, expected scale & depth **range**, occlusion **rules**, and **asset acceptance criteria** (the operationalised Camera Acceptance Test). **[NEW]**
- **Living Object Asset (PNG)** — the *conforming output*; owns nothing conceptual (its look is *determined by* the WPAP; may carry a baked **body** shadow per spec, **never** a baked contact shadow). **[I]**
- **Working Position Slot** (a WP-layout sub-property) — per-instance *placement calibration*: base anchor (x/y at the physical base), instance scale, occlusion band values, drag hitbox. **[I]**
- **Inventory** — product & quantity facts. **[V, unchanged.]**
- **Runtime Living Object record** — identity `{name, product}`, `src`, `variant`, removed/selection/drag state. **[V]**
- **Information Layer** — rendered title/quantity/status/badges/selection/drag (reads Inventory + runtime). **[V]**

**Single-owner discipline:** the camera is owned **once** by the Working Position; the WPAP **binds** to it (a derivation), it does not copy it. This preserves "exactly one owner per property." **[I]**

## 5. Property Matrix

| Property | **Owner** | Consumers | Reason |
|---|---|---|---|
| camera angle / height / focal length / perspective | Working Position | WPAP, generator, slot | scene truth of the fixed camera (§140) **[V]** |
| lighting direction / temperature | Working Position | WPAP, generator | fixed room light, "camera-right" (§283) **[V]** |
| shadow softness (scene) · ambient bounce · reflection character · wall/timber colour influence | Working Position | WPAP, generator | environmental facts of the plate **[V/I]** |
| glass / material appearance standard | WPAP | generator, QA | how material must read under *this* WP's light **[I]** |
| acceptable alpha edge · background separation · export resolution | WPAP | generator, QA | clean-extraction authoring standard **[I]** |
| generation-prompt guidance · AI generation constraints | WPAP | generator | the single prompt contract per WP **[I]** |
| acceptable realism standard · asset acceptance criteria | WPAP | QA gate | operationalises the Camera Acceptance Test **[I]** |
| contact-shadow **spec** · body-shadow **spec** | WPAP | generator (body), runtime grounding (contact) | one spec, two renderers **[I]** |
| expected object scale (range) · acceptable object depth | WPAP | generator, slot | authoring range; slot sets the instance **[I]** |
| occlusion **rules** | WPAP | slot | rule ("tuck base behind lip") vs band values **[I]** |
| contact plane · object anchor point · drag anchor · slot calibration · occlusion **band values** · instance scale | Working Position **Slot** | runtime | per-instance placement on this plate **[I]** |
| contact-shadow **render** | Runtime grounding primitive | — | one runtime shadow, per the prior grounding rule **[V prior doc]** |
| title / quantity / status / selection / drag display | Information Layer | — | runtime info, never baked **[V]** |
| product / quantity facts | Inventory | Information Layer | single source for inventory **[V]** |

No property has two owners. **[I]**

## 6. Asset Generation Pipeline

Replace *"generate a jar"* with *"generate a Living Object for Working Position = Pantry Shelf, using the Pantry-Shelf WPAP."* The generator reads the WPAP (as the plate generator already reads `--spec`) and is thereby **bound to the WP camera + light + contact + acceptance**. **[V mechanism for plates; I for objects.]**

Would this yield, **without runtime correction**:
- consistent **perspective** — **Yes** (bound to WP camera). **[I]**
- consistent **lighting / reflections** — **Yes** (bound to WP light). **[I]**
- consistent **realism** — **Yes** to the standard (the WPAP realism bar). **[I]**
- consistent **grounding** — **Largely**: WPAP fixes camera/contact-spec/scale; the WP **slot** anchor + the single runtime contact primitive complete it. Runtime stops *hand-tuning per object*. **[I]**
- **Caveat [V-reasoning]:** the WPAP fixes the **target**; AI generation is **stochastic**, so a given run may still miss it → the WPAP's **acceptance criteria + a QA gate** remain mandatory. The Profile guarantees *consistency of intent*, not *hit-rate*.

## 7. Room Consistency — does it "naturally solve" milk/jar/fruit/bread/tea?

**Yes, structurally [I]:** each object is generated *for its Working Position*, inheriting that room's camera + light + contact — so milk-in-fridge is authored top-down/fridge-lit, jar-on-pantry-shelf front-on/pantry-lit, fruit-in-basket at the basket camera, bread-in-bread-bin at the bread camera, tea-on-tea-shelf at the tea camera. The **exact defect that broke the fridge** (front-on object in a top-down room) becomes **unauthorable**, because "front-on" is no longer a per-generator choice — it is derived from the Working Position. **[I, root-cause matched to §0 evidence.]**

## 8. North Star Test

Does the WPAP move THA materially closer to *"lifting the exact object, extracted from the room's own photograph, not composited afterwards"*? **Yes, materially [I]:** the #1 verified cause of "composited/pasted" (object authored to the wrong camera/light for its Working Position) is exactly what the WPAP prevents **by construction and at scale**. It is **necessary but not alone sufficient** — it must be paired with (a) the single **runtime contact-shadow** primitive, (b) **slot calibration**, and (c) an **acceptance gate** for AI variance (all identified in the prior quality investigation). Together these make the North Star a *reproducible standard per room*, rather than a one-off the pantry happened to hit. **[I]**

## 9. Benefits

- **One source of truth** for object authoring per Working Position → no spec/generator/runtime drift. **[I]**
- **Correct-by-construction** camera/light/realism; ends per-object runtime hand-tuning. **[I]**
- **Operationalises the (locked) Camera Acceptance Test** into a machine-readable contract + gate. **[V basis]**
- **Uniform scaling** to every Working Position/room (fridge, basket, bread bin, tea, veg rack…). **[I]**
- **Prevents the exact drift** that produced the floating fridge. **[V root cause]**
- **No renderer / schema / runtime-architecture change** — additive, upstream of the locked Layer-2 asset. **[I]**

## 10. Risks

- **AI variance vs the target** — WPAP sets intent, not hit-rate → QA gate + iteration cost. **[V-reasoning]**
- **Over-formalisation** — a bloated profile could slow authoring; keep each WPAP lean and derived. **[I]**
- **Duplication regression** — if a WPAP *restates* scene truth instead of *referencing* it, single-owner breaks; discipline required. **[I]**
- **Migration cost** — reconcile the scattered prose specs + hardcoded generators into WPAPs; **re-master objects** (the fridge set already needs this). **[V]**
- **Organic produce** — WPAP fixes camera/light but not the intrinsic difficulty of photoreal loose produce; may still need special handling. **[I]**
- **Complementary, not a silver bullet** — needs the runtime grounding primitive + slot calibration to fully land the North Star. **[I]**

## Migration Impact

**Moderate, additive, no architectural change [I]:** (1) author one WPAP per Working Position, deriving camera/light from the existing plate specs; (2) refactor the object generators to **consume the WPAP** (mirroring `generate-environment-plate.py --spec`); (3) fold the scattered `docs/asset-specs/FRIDGE_OBJECTS_*` prose into the WPAP; (4) add slot calibration to the WP layout; (5) re-master objects to the WPAP (the real cost — already required for the fridge). Renderer, schema, inventory, and runtime interaction are untouched.

---

## Recommendation

> **Should Working Position Asset Profiles become the canonical architectural owner for the visual generation contract of all Living Objects?**
>
> **Yes.** Adopt the **Working Position Asset Profile as the single, versioned owner of the object *authoring & acceptance contract*** — a derivation **bound to** each Working Position's already-locked scene truth (camera/light/plate/layout), **consumed by** the generation pipeline and a QA gate. It is the **missing owner between the room and the Living Object**, it **operationalises the already-locked Camera Acceptance Test**, and repository evidence shows its **absence is the direct cause of the fridge failure** (a front-on object authored for a top-down room, with nothing to prevent it). It requires **no renderer redesign** and creates **no duplicate ownership**. It should be validated exactly as the prior doc prescribes — **one jar, then one fridge shelf** — before scaling to every Working Position.

## Highest-risk assumption

That a per-Working-Position authoring contract + acceptance gate will, in practice, yield objects that pass the Camera Acceptance Test at an **acceptable AI hit-rate and cost** — i.e. that fixing the *target ownership* is enough given generator variance. Strongly supported (the pantry already hits the bar when the target aligns), but **unproven for the top-down fridge**; prove on the one-jar and one-fridge-shelf vertical slices before committing the full asset re-master. **[I]**
