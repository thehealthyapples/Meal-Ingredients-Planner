# Living Object — North Star Quality Investigation

**Classification:** 🟡 AMBER — investigation only. Implements nothing. No code/asset/dep/commit changes because this document exists.
**Evidence standard:** every material claim tagged **[V]erified** (code/doc/asset confirmed), **[I]nferred**, **[A]ssumed**.

```
STATUS:                     COMPLETE — with one gated dependency (live inspection blocked)
PROJECT ROOT:               C:/Users/Colin/The Healthy Apples/GitHub/tha-living-larder-authoritative   [V]
BRANCH:                     feat/living-larder-authoritative                                            [V]
HEAD:                       0f59b189bc6e548c2fc956e6a5cc23a850ec36a0                                    [V]
APP BUILD STATUS:           🔴 BROKEN — client/src/App.tsx:305 references PocMilk3d with NO import;     [V]
                            dev server is DOWN (curl root=000).
LIVE ROUTE VERIFIED:        NO — a *fresh* live inspection is impossible without the pending one-line   [V]
                            App.tsx recovery fix (which I am forbidden to make here). Evidence base:
                            the most recent REAL browser render captured before the break
                            (docs/implementation/pantry-final-evidence/fridge-step-closer.png, a
                            Playwright render of /pantry fridge) + the user's live screenshots + code + assets.
CURRENT LAYER MODEL VERIFIED: YES — Environment plate (.lh-plate) · independent Living Objects          [V]
                            (.lh-layer > LivingObject/.lh-obj, dnd-kit) · runtime Information
                            (.lh-obj__cap / .lh-jar-name). React DOM + CSS only.
```

> **Live-inspection caveat (honest):** Part 1 and the "E. live render" column of Part 2 cannot be freshly verified in-browser right now. Everything marked **[V]** there is confirmed from **code** or the **pre-break live capture**; anything needing a *fresh* render is marked **[I]** or flagged BLOCKED. The single unblock is the App.tsx recovery fix already tabled for your approval.

---

## 1. HEADLINE FINDING

The jars **mostly** achieve the North Star; the fridge objects **do not** — and the reason is **not "because they are PNGs."** Transparent PNGs are the approved Living Object representation and the jars prove they work. The failure is a small set of **precise, fixable authoring & craftsmanship deficiencies**, all *inside* the locked layered model:

1. **Wrong object camera (fridge).** Fridge objects were authored **front-on / eye-level catalogue**, but the fridge Working Position looks **down onto receding shelves**. A front-on cut-out cannot show the top surface and contact geometry a top-down shelf requires → it reads as pasted/floating. **[V]** (jars are authored front-on **and** viewed front-on in the pantry → they match.)
2. **No baked or correctly-placed contact shadow (fridge).** The fridge milk asset has **0 px of shadow below its base** — a bare cut-out — relying entirely on a runtime seat shadow that was mis-positioned (detached below the base). Jars carry a baked "minimal contact shadow." **[V]**
3. **Fragmented grounding primitives.** Three different treatments exist; the richest (`.lh-jar-shadow`, with lift transitions) is **dead code**; jars use one model, fridge another. **[V]**
4. **Object lighting not matched to the room's fixed camera-right light** for the fridge set. **[I]** (jars are generated to that light spec; fridge AI products were not.)
5. **No per-object slot calibration** (base anchor, scale, occlusion, valid position) for the fridge. **[V]**

**In one sentence:** *the fridge objects look like generic catalogue photos dropped on a shelf, because that is how they were authored; the jars look extracted from the room because they were authored to the room's camera and light — the fix is to author every object the way the jars are, plus one shared grounding primitive.*

---

## 2. CURRENT LAYER MODEL — VERIFIED

- **L1 Environment** — `.lh-plate--<name>` CSS background stills; crossfade; never move; removing an object reveals the plate. **[V]**
- **L2 Living Objects** — `.lh-layer` of independent transparent elements. Two *active* render paths: `.lh-groupjar` (shelves overview = one jar per food-group) and `LivingObject`/`.lh-obj` (category items, fridge items, zones), each dnd-kit-draggable. **[V]**
- **Occlusion** — `.lh-front--fridge-*` re-draw foreground furniture above objects. **[V]**
- **L3 Information** — `.lh-obj__cap` / `.lh-jar-name` / `.lh-groupjar__name` = runtime DOM text; "crisp text, never baked." **[V]**
- **Interaction sinks** — `DropSpot` shopping / companion / bin (`useDroppable`). **[V]**
- **Routes/files** — `/pantry` → `LivingHomeRoom` (`client/src/pages/living-home-room.tsx` + `.css`); `/pantry/:group` → `larder-category-view.tsx`. **[V]**

---

## 3. LIVE BEHAVIOUR (Part 1)  *— from code + pre-break capture; fresh in-browser BLOCKED*

| Intended behaviour | Actual (basis) |
|---|---|
| L1 stays visible/unchanged | **Holds** — plate is a separate fixed background; objects are separate elements. **[V code]** |
| Jar independent of background | **Holds** — separate `<LivingObject>`/`.lh-groupjar` elements. **[V code]** |
| Label is independent runtime info | **Holds** — `.lh-obj__cap`/`.lh-jar-name` DOM, class-toggled. **[V code]** |
| Label follows the jar | **Holds** — label is a child of the object element. **[V code]** |
| Dragging moves only jar + label | **Holds** — dnd-kit moves the object element (+ its label child). **[V code]**; drag *feel* unverified live **[I]** |
| Removing reveals wall/shelf | **Holds** — `removed` set drops the object; plate shows through. **[V code]** |
| Shopping/Companion/Bin real drop targets | **Holds** — `DropSpot` droppables. **[V code]** |
| Foreground occlusion correct | **Partly** — fridge fronts exist, but bands were hand-tuned and the objects float, so occlusion cannot rescue a mis-cameraed object. **[V]** |
| **Difference intended vs actual** | The *mechanics* are correct; the *fidelity* fails (objects don't look seated). And **the app currently does not run at all** (build break). **[V]** |

---

## 4. NORTH STAR QUALITY GAP (Part 2)

Compared: **A** whole-room North Star reference · **B** close pantry-shelf view · **C** jar assets (`tha-larder-jar-*`, e.g. viewed rice jar) · **D** fridge assets (`tha-fridge-*`) · **E** live render (pre-break `fridge-step-closer.png`). Discriminating criteria (others adequate across the board):

| # Criterion | A ref | C jars | D fridge | Finding |
|---|---|---|---|---|
| 7 Camera angle | top-down-ish room | **front-on 90°** [V] | **front-on catalogue** [V] | **jars match their pantry camera; fridge objects DON'T match the top-down fridge camera** — the primary gap. |
| 9 Shelf contact point | true | present | **absent/ambiguous** | fridge cut-outs show no base-on-surface geometry. **[V]** |
| 10 Contact shadow | real | **baked "minimal"** [V] | **none baked**, runtime seat mis-placed [V] | inconsistent; fridge floats. |
| 11 Body shadow | real | CSS drop-shadow (down-left) [V] | CSS drop-shadow [V] | ok, but direction not re-checked per stage. |
| 12/13 Reflected room colour / light dir | room light | generated to camera-right spec [V] | **AI catalogue light, not room-matched** [I] | fridge objects "belong" to a different light. |
| 14 Ambient bounce (timber/wall) | present | faint | none | minor. **[I]** |
| 15 Occlusion by lips/neighbours | natural | ok | fronts exist but can't fix float [V] | |
| 16 Variation between repeats | natural | **procedural per-family** [V] | n/a | jars strong here. |
| 17 Label integration | n/a | **blank chalk plate → empty black rectangle until runtime text** [V] | paper-ish AI labels baked into image [V] | fridge labels are *baked into artwork* (wrong per L3); jars keep the label runtime but show an empty plate. |
| 20 "extracted from the same photograph?" | — | **largely YES** [V] | **NO** [V] | the decisive test. |

Criteria 1–6, 8, 18–19 (silhouette, alpha edge, glass/clamp/lid/ingredient realism, scale, drag-state, resolution) are **adequate** in both jars and fridge assets individually — i.e. the objects are *individually* photoreal; they fail *in context*. **[V/I]**

---

## 5. JAR ROOT CAUSE

Jars **largely succeed** (right camera, room-matched generation, procedural realism). Residual craftsmanship gaps:
1. **Grounding is under-served and fragmented.** The overview group-jars (`.lh-groupjar`) get only a CSS `drop-shadow` + the asset's baked "minimal" ellipse — **no dedicated runtime contact primitive**; the rich `.lh-jar-shadow` (which *would* soften/widen on lift) is **unused/dead**. **[V]**
2. **Baked "minimal contact shadow" in the asset** (`ellipse cy=708`, "floating presentation") is a **movable-object anti-pattern** — a contact shadow authored into the sprite travels with the sprite. It reads acceptably now only because the pantry camera is front-on and the shadow is faint. **[V]**
3. **Empty chalk label** reads as a black rectangle until runtime text lands. **[V]**
Net: jars are close; the gap is **grounding consistency + label state**, not the asset.

---

## 6. FRIDGE ROOT CAUSE

Trace: fridge **plate camera** looks down; **shelves recede**; **top surfaces are visible**; but the **product camera is front-on** with **flat contact geometry**, no **top-surface**, **no baked contact**, **AI catalogue lighting** (not fridge-internal), **no slot calibration**, and organic **produce** authored as generic photos. **[V]**

> **Single most important reason:** the fridge objects were **authored at the wrong camera** (front-on catalogue) for a **shelf viewed from above** — so they can never present the top-surface + contact a top-down shelf demands, and read as pasted/floating **no matter how the shadow is tuned.** **[V]**

**Can the existing layered architecture solve it?** **Yes — [V/I]:** re-master each fridge object at the **fridge stage camera** with **room-matched light** and **correct contact**, add **slot calibration** (base anchor, scale, occlusion, valid position), and use **one runtime grounding primitive**. This is asset-authoring + calibration, entirely within the locked Environment-Plate + Living-Object model. **No architectural deficiency is proven; no new renderer is warranted.** (A runtime-3D fridge remains rejected on mobile/accessibility/produce-pipeline/architecture grounds per the prior RED docs; and the one-object POC was not a valid test.)

---

## 7. CANONICAL LIVING OBJECT ASSET CONTRACT (Part 3)

One Living Object is **not** a generic catalogue cut-out. Its properties split cleanly across four owners — **no duplicate owner for inventory/product facts**:

**A. Visual asset (the PNG master)** — authored per **stage**: exact Working-Position camera; room light direction; correct visible **top + side** surfaces for that shelf angle; room-colour reflections; transparent background; clean alpha edge; **body/form shadow may be baked**, **contact shadow must NOT be baked**; native resolution ≥ 2× display. **[I]**

**B. Living Object runtime record** — identity `{name, product}`, `src`, `variant`, `removed` state, drag/selection state. Points *to* inventory/product facts; does not own them. **[V]**

**C. Stage / shelf slot (authored calibration)** — the **valid position** on a specific plate: `x/y` anchor at the **physical base**, `scale`/`height`, **occlusion band(s)**, and (recommended) a **drag hitbox** + snap target. This is where grounding is guaranteed. **[I]**

**D. Information layer** — runtime title/quantity/status/badges/selection/drag — DOM overlay bound to the object, reading domain data (inventory/Shopping/Companion). Never baked. **[V]**

---

## 8. CANONICAL GROUNDING & SHADOW RULE (Part 4)

Current state audited: contact shadow is **not** reliably at the base (fridge seat was detached); shelf plane match is **per-stage and currently wrong for the fridge**; the rich lift-aware shadow is **dead**; body shadow is a fixed CSS drop-shadow; **shadows are duplicated** (baked asset ellipse *and* CSS) for jars; **fridge and jars use different primitives** (`.lh-obj__seat` vs the dead `.lh-jar-shadow`, with group-jars using neither); objects (fridge) visibly hover / sit on the wrong plane. **[V]**

**One canonical rule for ALL Living Objects:**
> **Grounding = ONE runtime contact-shadow element, owned by the stage-slot, drawn on the environment plane at the object's calibrated base anchor; it stays on the shelf when the object lifts and softens+widens with lift. Object PNGs carry only the body/form shadow — never a baked contact shadow. Deduplicate: remove baked contact shadows from movable-object masters. Retire the fragmented primitives (`.lh-obj__seat`, `.lh-groupjar` drop-only, dead `.lh-jar-shadow`) in favour of this single primitive, used identically by jars and fridge.** **[I]**

---

## 9. CONTAINER / CONTENTS RECOMMENDATION (Part 5)

- One canonical jar geometry → **many filled assets**: **already true** (parametric generator, per-family procedural contents). **[V]**
- Fill level varied at **build time**: **yes**, trivially (surface Y parameter). **[V]**
- More realistic contents without runtime change: **yes**, improve the procedural renderers / per-family palettes. **[I]**
- Room-specific light & reflections at generation: **yes**, add per-stage light params to the generator. **[I]**
- Runtime contents worth the masking/refraction complexity? **No** — glass refraction + interior masking at runtime is fragile for little gain; keep the split **build-time**. **[I]**
- Label entirely runtime DOM? **Yes** — keep it in L3; never bake wording. **[V]**

**Recommendation:** keep container+contents as a **build-time parametric asset**; invest in the generator (fill, contents realism, per-stage light), not runtime layering.

---

## 10. ONE-JAR VERTICAL-SLICE TEST (Part 7) — *design only, not implemented*

**Scope:** exactly **one pantry jar**, on the **real live stage**, real shelf, real runtime label, real drag, real Shopping/Companion/Bin, wall revealed on removal.
**Prerequisite (BLOCKING):** the app must **build and run** — i.e. the App.tsx recovery fix must be approved first. The slice cannot be validated on a broken build. **[V]**
**Method:** author one jar master to the §7 contract (pantry camera + room light + no baked contact + clean alpha); add the §8 single runtime contact primitive at a calibrated base anchor; keep the runtime label. Compare against the current jar in the same slot.
**PASS (all required):** looks **extracted from the room's own photograph**; **visibly rests** on the shelf; **no halo/pasted edge**; **correct camera & scale**; label **crisp & editable**; dragging **feels like lifting the same physical object** (shadow stays, softens/widens); background **cleanly revealed** on removal; **materially better** than the current jar; **credible at desktop & mobile**.
**FAIL:** any floating, halo, wrong scale/camera, shadow travelling with the object, or "no better than current."
**Gate:** **do not touch the fridge until this jar passes.** **[per brief]**

---

## 11. FILES & OWNERS AFFECTED (Part 8)

| Gap | Owner | Consumers | Paths | Type | Risk | Smallest compliant correction |
|---|---|---|---|---|---|---|
| Fragmented / dead grounding primitives | Living Object Model | room render | `living-home-room.css` (`.lh-jar-shadow` dead, `.lh-obj__seat`, `.lh-groupjar`), `living-home-room.tsx` | code | Med | consolidate to one runtime contact primitive; delete dead CSS |
| Baked contact shadow in jar masters | asset pipeline | jar assets | `scripts/generate-larder-jar-masters.ts` (`ellipse cy=708`) | asset gen | Low | drop the baked contact ellipse; ground at runtime |
| Fridge objects wrong camera / no contact / unmatched light | asset pipeline | `FRIDGE_OBJECTS` | `client/src/assets/living-home/larder/fridge/tha-fridge-*.png`; `scripts/generate-fridge-product.py` | asset | **High** | re-master at fridge camera + room light + clean alpha (no baked contact) |
| No slot calibration (anchor/scale/occlusion) | stage/slot data | fridge render | `living-home-room.tsx` (`FRIDGE_OBJECTS` x/y/h + `.lh-front--fridge-*` masks) | authored data | High | add per-slot base-anchor + occlusion calibration |
| Baked labels in fridge assets | Information layer | fridge assets | `tha-fridge-*.png` | asset | Med | labels → runtime L3, not baked |
| **Build break (blocks everything)** | app | whole client | `client/src/App.tsx:305` + `package.json`/lock, `poc-milk3d.tsx` | code/dep | **Critical** | approve the recovery plan (restore App.tsx; remove 3D POC) |

---

## 12. RISKS
- **App is down**: no validation possible until recovery approved. **[V]**
- **Re-mastering the fridge set** is the real cost; must be done to the contract or it will float again. **[V]**
- **Grounding consolidation** touches shared CSS used by jars *and* fridge — regression risk to the pantry (currently acceptable) → test the jar slice first. **[I]**
- **Over-reach**: temptation to "fix" via 3D/canvas — repeatedly shown to be out-of-model, produce-blocked, mobile/accessibility-hostile. Resist. **[V]**

## 13. RECOMMENDED NEXT DECISION
1. **Approve the recovery** (restore `App.tsx`; remove the 3D POC + deps) so the app builds and can be inspected/tested. *(Pre-requisite for everything.)*
2. **Run the one-jar vertical slice** (§10) — a craftsmanship proof inside the existing model: one re-mastered jar + the single runtime grounding primitive + runtime label.
3. **Only after it passes**, re-master the **fridge objects** to the §7 contract with §8 grounding and slot calibration (this is the answer to the earlier "Option C"). No new renderer.

## 14. HIGHEST-RISK ASSUMPTION
That **re-authoring objects to the exact Working-Position camera + room light + a single runtime contact shadow will read as "extracted from the room's own photograph"** — i.e. the defect is authoring/calibration, not the 2D model. Evidence strongly supports it (**the jars already achieve it in the pantry**), but it is unproven **for the top-down fridge specifically** and must be validated first on **one jar**, then **one full fridge shelf section**, before committing the whole set. **[I]**

---

### The question this answers
> *"What precisely must improve so a user feels they are lifting the same jar they can see in the North Star room?"*

**Four things, all within the locked layered model:** (1) author each object at its **stage's exact camera + room light** with a clean alpha and **no baked contact shadow**; (2) ground it with **one runtime contact-shadow primitive** at a **calibrated base anchor** that stays on the shelf and reacts to lift; (3) calibrate its **slot** (anchor, scale, occlusion); (4) keep **label + status as runtime information**, never baked. The jars already prove this works; the fridge simply has not been authored to it yet.
