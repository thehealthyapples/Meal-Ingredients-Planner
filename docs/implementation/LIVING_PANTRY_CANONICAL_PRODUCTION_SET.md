# Living Pantry — Canonical Production Set (Generation Plan · AWAITING APPROVAL)

**Date:** 2026-08-06 · **Risk:** 🟢 GREEN (production imagery/architecture). **Status: ARCHITECTURE REFINED — Three-Asset Model adopted (see ▶ PRODUCTION ARCHITECTURE v2 below). Awaiting review of the refined architecture; no further images to be generated until approved.**
**Gate:** further image generation is **paused** pending review of the refined architecture below (Refinement Pass, 2026-08-06). Visual language approved; pipeline approved in principle.
**Evidence:** [V]erified · [I]nferred · [A]ssumed.

---

# ▶ PRODUCTION ARCHITECTURE v2 — Three-Asset Model (Refinement Pass, 2026-08-06)

**Why the change.** The pipeline proof (`LIVING_PANTRY_PIPELINE_PROOF.md`) showed that deriving an Empty Environment by *removing* objects from a populated master forces AI to **invent pixels** (streaked timber behind the jar) — **rejected.** The empty must be a **real asset**, never inpainted.

## The three production assets (per Working Position)
- **Asset 1 — Environment Plate (empty):** room · furniture · lighting · shadows · permanent props. **No Living Objects. Never modified.** The runtime background.
- **Asset 2 — Canonical Master (populated):** the **identical** camera/room/lighting/furniture, now with **every Living Object in its Canonical Home.** For **approval, extraction, and lighting reference only — NOT a runtime asset.**
- **Asset 3 — Living Object Library:** each object **extracted individually** from Asset 2 as a transparent PNG (jar, bottle, tin, fruit, vegetable, bread, tea/coffee canister…).

**Runtime = Asset 1 (Environment Plate) + Asset 3 (Living Objects).** Nothing is ever removed from the plate; nothing is ever AI-inpainted. Removing an object at runtime reveals the plate's **real** pixels.

## Generation method — pixel-compatibility WITHOUT inpainting
Order inverted from the failed approach — **empty first, then add objects** (not populated then remove):
1. Generate **Asset 1** (empty Environment Plate) at the approved camera.
2. Generate **Asset 2** as a **masked edit of Asset 1** — mask only the object zones so the model *places* Living Objects there while **Asset 1's environment pixels are preserved unchanged**. Asset 2 is pixel-compatible with Asset 1 by construction.
3. Extract **Asset 3** from Asset 2 (each object's surroundings in Asset 1 are the real empty).
4. Runtime composes **Asset 1 + Asset 3** — an object removed reveals Asset 1, believable and artefact-free.
*(The pixels behind every object genuinely exist in Asset 1 — so no reconstruction is ever needed.)*

## Refinements incorporated
2. **Camera distance** — for **Pantry Shelves** and **Fridge**, move the camera **physically closer** (step forward into the room; **do not zoom**). Room unchanged.
3. **Jar labels** — the physical chalkboard label is the **primary interaction surface**, currently too small. Enlarge **~50% wider, ~15% taller**; **standardise** across **all** pantry jars; fit **"Wholemeal Flour" on one line** where possible, longer names wrap to **two balanced lines**; **matte chalkboard texture** (never glossy plastic); ingredient must stay **visible through the glass**. Runtime edits **text only**.
4. **Store Cupboard — current proof REJECTED** (wrong furniture). Generate the **under-counter cupboard shown in Arrival**, **both doors open**, shelves of **realistic TINS** — baked beans, chopped tomatoes, tuna, sardines, soups, chickpeas, lentils, coconut milk, sweetcorn, tomatoes — **varied diameters/heights, real printed tin labels. No pantry jars, no glass.** A household tinned-food cupboard.
5. **Root Vegetables** — the rack **permanently lives beneath the Fruit worktop**; **Fruit, Root Vegetables, and Arrival must all depict the same physical location.**
6. **Bread** — **no Canonical Home yet.** Before generating, determine from **Arrival**: where bread lives · what furniture owns it · how the camera reaches it. Generate only then.
7. **Worktop — REMOVED** as a separate Working Position (duplicates Fruit / Root Vegetables / Store Cupboard / Pantry Shelves).
8. **Lived-in household** — vary staging: one jar half full, another full, natural ingredient-level variation, believable usage. **Authenticity, not clutter.**

## Revised Working Position list (Worktop removed → 8 + Arrival)
| # | Working Position | Location in Arrival | Camera | Status |
|---|---|---|---|---|
| 01 | **Arrival** | the whole room (anchor) | wide, room entrance | exists (reused) |
| 02 | **Pantry Shelves** | centre floating shelves | front-on, **CLOSER** | re-shoot: closer + bigger labels + lived-in |
| 03 | **Fridge** | left oak integrated appliance | front-on, **CLOSER**, upper open | re-shoot closer |
| 04 | **Freezer** | same appliance, lower drawer | front-on, lower open | same appliance as 03 |
| 05 | **Fruit** | worktop by the window (right) | front-on / slightly down | root veg rack beneath (same place) |
| 06 | **Root Vegetables** | **beneath the Fruit worktop** | tilt down to the rack | must match Fruit + Arrival location |
| 07 | **Store Cupboard** | **under-counter cupboard** (lower cabinets) | front-on, both doors open | CORRECTED — tins, not jars |
| 08 | **Tea & Coffee** | **not clearly in Arrival** | TBD | **open item** — determine home from Arrival |
| 09 | **Bread** | **not established** | TBD | **determine home from Arrival first** |

**Open architectural items before generation:** (a) Bread's Canonical Home; (b) Tea & Coffee's Canonical Home — both must be locatable within Arrival, or Arrival must be extended to establish them.

## Revised camera map (one room; the camera moves, the pantry does not)
```
   LEFT                         CENTRE                                   RIGHT
   ┌──────────────┐      ┌────────────────────────┐          ┌────────────────────┐
   │ OAK          │      │  Floating pantry        │          │  Window +          │
   │ INTEGRATED   │      │  shelves (3 tiers) ▲02  │          │  Fruit worktop ▲05 │
   │ FRIDGE  ▲03  │      │  Worktop / scale        │          │  Root veg rack     │
   │ ───────────  │      │  Under-counter cupboard │          │  BENEATH  ▲06      │
   │ FREEZER ▲04  │      │        ▲07 (tins)        │          │  (tilt down)       │
   └──────────────┘      └────────────────────────┘          └────────────────────┘
   ▲01 Arrival = wide view spanning LEFT → CENTRE → RIGHT (establishes every home)
   ▲08 Tea & Coffee, ▲09 Bread = homes TBD from Arrival (cameras cannot be placed yet)
```
- **02 / 03:** step *forward* to the fixture (closer, front-on) — same room, nearer camera, no zoom.
- **05 / 06:** the **same right-hand worktop**; Fruit looks at the baskets, Root Veg tilts **down** to the rack beneath — provably one place, matching Arrival.
- **07:** the **lower under-counter cabinets** (beneath the worktop in Arrival), doors open — not a standalone larder cupboard.
- **08 / 09:** cannot be placed until their homes are established in Arrival.

## Cost note (three assets now)
Per position ≈ 2 generations (Empty Plate + Master) + local extraction. At ~£0.20/image, 8 positions ≈ **£3–7** with iteration. A fresh per-position estimate and the £5 gate will accompany the actual generation request — **after** this architecture is approved.

---

## Architecture compliance
- Realizes the LOCKED two‑master workflow (Master Empty + Master Populated per object‑bearing camera; extraction later). **No runtime, schema, ownership, or behavioural change.** [V]
- Data impact: **none.** Runtime impact: **none.** Nothing promoted to runtime; output lands only under `artifacts/canonical-pantry-production-set/`. [V]
- Rollback identifier: **`rollback/canonical-production-set-20260806` → `9b3e59c7`.** [V]

## Canonical Master model — SUPERSEDED (historical, kept for traceability)
> **Superseded by the Three-Asset Model above.** The single-master "derive the empty by removing objects" approach was rejected because removal forces AI to invent occluded pixels (`LIVING_PANTRY_PIPELINE_PROOF.md`). The empty is now its own real asset (Asset 1); the section below is retained only for traceability.

**One source per Working Position: the Canonical Master** — the finished, fully‑populated photograph (permanent room + props + every Living Object in its Canonical Home). From it, and *only* it:
- the **Empty Environment** is **derived** by removing the movable objects (masked edit), and
- the **Living Objects** are **extracted** (cut‑outs).
Pixel compatibility and correct pixel ownership are guaranteed because everything shares one origin. **No independent Empty plate and no independent object artwork are ever generated.** [V — matches the locked extraction workflow]

## Exact image count (generation = Canonical Masters only)
Only the Canonical Masters are *generated*; empties and objects are *derived* afterward (post‑approval).

| # | Working Position | Canonical Masters to generate |
|---|---|---|
| 01 | Arrival | 0 — reuse existing verified `arrival.png` as the anchor/reference (regenerate only if you reject it) |
| 02 | Pantry Shelves | 1 |
| 03 | Fridge (upper open, oak integrated) | 1 |
| 04 | Freezer (lower open, same appliance) | 1 |
| 05 | Store Cupboard | 1 |
| 06 | Fruit | 1 |
| 07 | Root Vegetables | 1 |
| 08 | Tea & Coffee | 1 |
| 09 | Bread | 1 |
| 10 | Worktop | 1 |
| | **Masters to generate** | **9** (Arrival reused) |

**Generated images (Step 1): 9 Canonical Masters.** Derived empties (Step 3: ~9 masked edits) and extracted objects (Step 4: masking) come *after* Home Owner approval of the masters.

## Method (now confirmed by the Canonical Master philosophy)
For each of the 9 positions: **generate one Canonical Master**, anchored to `arrival.png` for room/style continuity, forcing the **oak integrated** fridge (not stainless). Then — only after your approval — derive the empty (remove objects) and extract the objects. This is the sole AI route that yields pixel‑compatible results.
**Residual risk (honest):** cross‑camera "provably the same room / same dimensions" remains **approximate** with AI generation — anchoring to Arrival helps but cannot guarantee it. Real photography of one built room is the only method that fully guarantees the "same fixture in every camera" and "locatable within Arrival" gates. The pixel‑ownership and empty/populated‑compatibility gates ARE satisfied by the derive‑from‑master method.

## Cost estimate (gpt-image-1, assumption stated)
Assumes gpt‑image‑1, landscape ~1536×1024. High quality ≈ $0.25/generation + small reference‑input cost.

| Step (paid) | Ops (with iteration) | Est. USD | Est. GBP |
|---|---|---|---|
| **Step 1 — 9 Canonical Masters (×2–3 iter, high)** | ~18–27 | ~$5–7 | **~£4–5.5** |
| Step 3 — derive 9 empties (masked edits, later) | ~9–18 | ~$3–5 | ~£2.5–4 |
| Step 4 — extract objects (masking; tooling where possible) | variable | low | low |
| **End‑to‑end (Steps 1+3+4)** | | ~$8–12 | **~£6.5–10** |

**Step 1 alone ≈ £4–5.5 (at/near the £5 gate); end‑to‑end ≈ £6.5–10 (over it) → STOP for approval.**

## Deliverable structure (to be created on approval)
`artifacts/canonical-pantry-production-set/` → `00_CONTACT_SHEETS/`, `01_ARRIVAL/` … `10_WORKTOP/`, each object‑bearing folder with `EMPTY/ POPULATED/ PAIR_COMPARISON/`; plus full/empty/populated contact sheets, per‑camera pair sheets, and an Arrival‑to‑camera continuity sheet.

## Acceptance gates (to be assessed against the whole set, post‑generation)
One physical room · same fixture every camera · same permanent props · same material palette · same lighting · same scale · same craftsmanship · empty/populated pixel compatibility · correct pixel ownership · all objects have homes · fridge/freezer physically possible · every camera locatable within Arrival · Home Owner approval.

## Results (pending)
- Exact images generated: **0 — not started.**
- Generation cost: **£0 — not spent.**
- Camera continuity / empty‑populated compatibility / known defects: **pending generation.**
- **Home Owner approval status: PENDING.**

## Generation order (per Home Owner philosophy)
1. **Produce the Canonical Master** (9 positions; the only generated images).
2. **Home Owner approval** of the masters.
3. **Derive the Empty Environment** (remove objects from each master).
4. **Extract Living Objects** (cut‑outs from each master).
5. **Runtime implementation** (separate, later approval).
*Empty and Populated are never generated independently — both are derived from the one master.*

## What I still need before Step 1 (method is now settled)
The Canonical Master philosophy **settles the method** — one master, derive both. Two things remain before I can spend:
1. **A spend cap for Step 1** — generating the 9 Canonical Masters is ~£4–5.5 with iteration. I suggest authorizing **up to £8** for Step 1 (headroom for the fridge/oak‑appliance retries). Steps 3–4 would be a later, separately‑capped go‑ahead.
2. **A generation credential** — there is **no `OPENAI_API_KEY` in `.env``. The running app has one, but I will not borrow/assume a paid credential. Either add `OPENAI_API_KEY=` to `.env` (gitignored) yourself, or tell me the sanctioned way to invoke the governed pipeline (`scripts/generate-environment-plate.py`).

## FOUR-IMAGE PROOF — RESULTS (2026-08-06)
**Scope executed:** the approved **four-image proof only** — Pantry Shelves, Fridge, Fruit, Store Cupboard. Arrival reused as anchor (not generated). **The remaining five Working Positions were NOT generated.**

- **Architecture compliance:** Canonical Master method — one populated master per position; empties/objects to be *derived later*. No runtime, schema, ownership, or behavioural change. [V]
- **Rollback identifier:** `rollback/canonical-production-set-20260806` → `9b3e59c7`. [V]
- **Exact images generated:** **4 Canonical Masters** (each 1536×1024, gpt-image-2, high, via governed `generate-environment-plate.py` images/edits, edit-from the correct per-camera empty/base). Deliverable: `artifacts/canonical-pantry-production-set/00_FOUR_IMAGE_PROOF/`. [V]
- **Generation cost (actual):** 21,952 output tokens / 29,155 total across 4 images ≈ **$0.95 ≈ £0.75** (estimate from gpt-image-1 rates; token counts are authoritative). **Under the £5 gate.** [V]
- **Camera continuity result:** Strong. Shelves, Fridge, and Fruit each reproduce Arrival's fixtures/props/lighting and carry cross-camera landmarks (fridge shows the pantry shelves + stool at right; fruit shows the same leaded window; shelves show the same permanent props). **Fridge is the correct OAK integrated appliance** (fridge above / freezer below) — passes "could it close back into Arrival?". **Caveat:** the Store Cupboard is a standalone larder cupboard **not clearly visible in Arrival**, so "same cupboard" is a Home-Owner judgment. See `CONTINUITY_REVIEW.html`. [V]
- **Empty/populated compatibility result:** **N/A this pass** — only Canonical Masters were produced. Because each master was edited *from* the correct empty/base, the later derived empty is expected to be pixel-compatible, but **no empty derivation was performed** (Step 3, pending approval). [V]
- **Known defects:** labels correctly blank/physical (no floating text) ✓; cupboard continuity caveat (above); minor: fruit/cupboard anchored on existing (not-Arrival-verified) compositions — acceptable for proof, to reconfirm against Arrival before the full set.
- **Empty derivation performed:** **No.** **Extraction performed:** **No.** **Runtime modification:** **No.** [V]
- **Home Owner approval status: PENDING** — of the four-image proof set. The remaining Working Positions are **not** approved.

**STOP — four-image proof produced; nothing derived, extracted, or promoted. Awaiting Home Owner approval of the complete proof set before generating the remaining Working Positions.**
