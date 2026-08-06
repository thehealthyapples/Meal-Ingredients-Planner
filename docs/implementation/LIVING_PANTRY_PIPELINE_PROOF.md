# Canonical Master Pipeline — Proof of Architecture (Pantry Shelves)

**Date:** 2026-08-06 · **Risk:** 🟢 GREEN — production verification only. **No new masters generated, no runtime change.**
**Method:** local image processing (PIL + numpy) on the approved Pantry Shelves Canonical Master. **No gpt-image generation was used** for this proof. Object: jar 4 (central white-flour jar).
**Deliverable:** `artifacts/canonical-pantry-production-set/00_PIPELINE_PROOF/` — `PIPELINE_PROOF_SHEET.png` + the six step outputs. Data impact: **none.** Runtime impact: **none.**

## Result: pipeline PARTLY proven — one step fails and stops the go-ahead

| # | Step | Result |
|---|---|---|
| 1 | Show Canonical Master | ✓ |
| 2 | **Derive Empty Environment** (remove objects) | ✗ **FAILS** — see below |
| 3 | Extract one Living Object (transparent PNG) | ✓ **PASS** — clean cutout with alpha (glass, lid, contents, chalk label) |
| 4 | Rebuild the scene (recompose) | ✓ **PASS** — mean abs pixel diff vs master = **0.003** (indistinguishable) |
| 5 | Runtime label text on the physical chalk label | ✓ **PASS** — "Wholemeal Flour" / "Pearl Barley" / "Red Lentils" sit naturally; artwork unchanged |
| 6 | Remove the object again → believable empty | ✗ **FAILS** — same gap as step 2 |

**Against the five success criteria:** extraction ✓, recompose-indistinguishable ✓, runtime label ✓ — **three pass.** "Empty derived from the master" and "removing the object reveals a believable empty shelf" — **two fail.**

## Precisely why Steps 2 & 6 fail
A single populated photograph **does not contain the pixels hidden behind its objects** — the plaster wall and shelf surface *behind* each jar were never captured. Removing the jar leaves a hole; making that hole believable is **inpainting** (reconstructing plausible wall + shelf), not simple removal.

The local tooling available here is **PIL + numpy only** — there is **no `cv2`, no `rembg`, no segmentation/matting model, and no inpainting model** (`onnxruntime` exists but no model), and this proof is **not permitted to call the gpt-image generation endpoint**. The best classical fill available (per-column vertical interpolation) produces **vertical wood-toned streaks** where the jar stood — visibly wrong (see panel 2). So the derive-empty step cannot meet the "believable / artefact-free" bar with what's on this machine.

Note: Step 4 is pixel-perfect (0.003) **because the extracted jar is pasted back over the flawed empty** — the object hides the bad fill. The reconstruction proves *extraction + recomposition* are exact; it does **not** rescue the empty.

## What this means for the architecture (honest)
The **object side of the pipeline is proven**: Living Objects extract cleanly from the master, recompose exactly, and carry runtime label text on their physical chalk label with the artwork untouched. The runtime model (Empty + Extracted Object + Information Layer) works.

The **empty side needs one added capability.** "Derive the empty by removing objects" is **not a pure local operation** — it necessarily includes an **AI inpaint sub-step** to reconstruct the occluded wall/shelf. The "Canonical Master is the only source" philosophy holds *with this rider*: the derived empty = **remove objects + inpaint the revealed regions**.

## To complete the proof (Home Owner decision)
One of:
1. **Permit a masked inpaint for the derive-empty step** — a gpt-image `images/edits` call over the object mask ("remove the jars, continue the shelf and plaster wall"). This is the production-realistic derivation and would yield a believable empty. *(It is guided editing confined to the object regions, not a new scene — but it does use the generation endpoint, which this proof forbade, hence the stop.)*
2. **Install a local matting + inpainting capability** (e.g. rembg/SAM for masks + LaMa for inpaint) and re-run this proof fully offline.

## STOP
Per the brief — a step failed, so I stop and explain rather than proceed. **The remaining Working Positions must NOT be generated until the derive-empty step is resolved** and the pipeline verified end-to-end. Extraction, recomposition, and runtime labelling are proven; the empty-derivation capability is the single outstanding item, and it is the Home Owner's call which route to authorise.
