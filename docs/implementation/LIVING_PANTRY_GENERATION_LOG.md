# Living Pantry — Generation Log (permanent audit trail)

**Purpose:** the **permanent audit log for every paid image generation** for the Living Pantry — the complete financial *and* production‑lifecycle record. Every generated asset can be traced to the governing repository state, its prompt, its cost, its Production Library identity, and its full approval lifecycle.

## Protocol (binding)
1. **No generation may occur without first creating its entry here** (Asset Status `Planned`, estimated cost, **Rollback Commit**).
2. **Every generation must be recorded** — **actual cost**, **Generation Result**, and **Rollback Commit** — **before the next generation begins.**
3. **One generation = exactly one appended entry.** Append‑only; corrections are new rows referencing the original ID, never in‑place deletions.
4. **Rollback Commit is mandatory** — the exact commit (or rollback tag) that governed the repository when the generation occurred, so any asset is traceable to the repo state that produced it.
5. Costs in **GBP** (≈ £0.17–0.20/image from observed token usage; actuals derived from generation metadata token counts — gpt‑image‑2 exact pricing unconfirmed, so actuals are best‑estimates).

## Two independent concepts (do not conflate)
- **Generation Result** — did the image *successfully produce*? Values: **`Generated`** · **`Failed`**.
- **Asset Status** — did that image *become part of the canonical production library*, and where is it in its lifecycle? Values: **`Planned`** · **`Pending Review`** · **`Approved`** · **`Rejected`** · **`Superseded`** · **`Archived`** (plus **`Approved as Proof Asset (Visual Language Only)`** for pre‑architecture proof assets).
A generation can be `Generated` yet `Rejected`; both must be recorded independently.

## Field definitions
Generation ID (`GEN-NNNN`, monotonic) · Date · **Rollback Commit** · Working Position · Asset Type (`Environment Plate` · `Canonical Master` · `Living Object`; `Proof` for proof assets) · **Production Library ID** · Prompt Version · Estimated Cost · Actual Cost · **Generation Result** · **Asset Status** · Home Owner Approval · Notes.

## Production Library ID scheme
Every **approved production asset** receives a **permanent** Production Library ID: `LP-<POSITION>-<TYPE>-<NNN>`.
- **Position:** PS Pantry Shelves · FR Fridge · FZ Freezer · FT Fruit · RV Root Vegetables · SC Store Cupboard · TC Tea & Coffee · BR Bread.
- **Type:** EP Environment Plate · CM Canonical Master · LO Living Object.
- **Sequence:** `001`, `002`, … per (position, type).
- Examples: `LP-PS-EP-001` · `LP-PS-CM-001` · `LP-FR-EP-001` · `LP-FR-CM-001` · `LP-RV-EP-001` · `LP-SC-CM-001`.
- **A Production Library ID is never reassigned.** If its asset is rejected or superseded, the ID is retired with that asset, never reused. Proof assets and rejected images receive **no** Production Library ID.

## Living Object provenance & lineage (prepared now, applied at extraction)
Every Living Object, when extracted, carries a record that preserves **complete asset lineage** — defined now so it is ready at extraction, **without blocking or complicating production** (the field is optional to the runtime):
- **Production Library ID** — `LP-<POS>-LO-<NNN>` (the object's permanent identity).
- **Parent Production Asset** — the **Canonical Master** the object was extracted from, e.g. `LP-PS-CM-001`.
- **Working Position / Canonical Home** — its one home.

This links the full chain, each hop by Production Library ID:

```
Environment Plate  →  Canonical Master  →  Living Object                →  Runtime
LP-PS-EP-001          LP-PS-CM-001          LP-PS-LO-001                    (Environment Plate
(pair partner)        (Parent of the LO)    Parent Production Asset =        + Living Objects)
                                            LP-PS-CM-001
```

Because a Canonical Master's pair partner is its Environment Plate (same position, locked pair), any Living Object is traceable back through its Master to the exact empty plate and the governing **Rollback Commit**. **If an extraction record cannot carry `Parent Production Asset` inline, it is recorded here in the log against the object's row** — a planned extension, never a blocker.

## Governance principle — immutability
- **Production assets are immutable once approved.**
- If an approved asset is replaced, the original is marked **`Superseded`** or **`Archived`** — **it is never deleted.**
- **Production Library IDs are permanent.**
- **The audit trail must remain complete:** no production asset exists without an audit record, and no audit record exists without traceability (rollback + prompt + cost + Library identity + lifecycle). *(Images may be removed from disk only if they were never approved as production assets; their audit record always persists.)*

## Cumulative spend
- **Actual spent to date:** **≈ £1.75** (GEN‑0001…GEN‑0010).
- **Approved but not yet generated:** £0.00 — generation is paused pending Home Owner approval of the one‑position Production Pair Proof (Execution Plan §4 Step 2).

---

## Log

> **GEN‑0001…GEN‑0010 are back‑filled historical records** (paid generations that occurred *before* this log existed). Their **Rollback Commit values are approximate** — the exact per‑generation HEAD was not captured at the time, which is precisely why the field now exists; the governing rollback reference then was tag `rollback/canonical-production-set-20260806 → 9b3e59c7`. From **GEN‑0011** onward, exact values are recorded *before* generation.

| Gen ID | Date | Rollback Commit | Working Position | Asset Type | Production Library ID | Prompt Version | Est £ | Actual £ | Generation Result | Asset Status | HO Approval | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GEN-0001 | 2026-08-06 | `9b3e59c7`* | Pantry Shelves | Proof (Canonical Master) | — (proof, not production) | `00_FOUR_IMAGE_PROOF/_specs/shelves.md` v1 | 0.18 | 0.17 | Generated | **Approved as Proof Asset (Visual Language Only)** | Yes (visual language) | Reference only; not a Production Master Pair; not runtime. |
| GEN-0002 | 2026-08-06 | `9b3e59c7`* | Fridge | Proof (Canonical Master) | — (proof, not production) | `…/_specs/fridge.md` v1 | 0.18 | 0.17 | Generated | **Approved as Proof Asset (Visual Language Only)** | Yes (visual language) | Oak integrated appliance confirmed. Reference only. |
| GEN-0003 | 2026-08-06 | `9b3e59c7`* | Fruit | Proof (Canonical Master) | — (proof, not production) | `…/_specs/fruit.md` v1 | 0.18 | 0.17 | Generated | **Approved as Proof Asset (Visual Language Only)** | Yes (visual language) | Reference only. |
| GEN-0004 | 2026-08-06 | `9b3e59c7`* | Store Cupboard | Proof (Canonical Master) | — | `…/_specs/cupboard.md` v1 | 0.18 | 0.17 | Generated | Rejected | No | Wrong furniture (standalone larder, not under‑counter tins). Superseded by corrected spec. |
| GEN-0005 | 2026-08-06 | `~30bf95fd`* | Pantry Shelves | Environment Plate | — | `plate-shelves.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon (text‑to‑image = different pantry). Image deleted; record retained. |
| GEN-0006 | 2026-08-06 | `~30bf95fd`* | Fridge | Environment Plate | — | `plate-fridge.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon. Image deleted; record retained. |
| GEN-0007 | 2026-08-06 | `~30bf95fd`* | Freezer | Environment Plate | — | `plate-freezer.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon. Image deleted; record retained. |
| GEN-0008 | 2026-08-06 | `~30bf95fd`* | Fruit | Environment Plate | — | `plate-fruit.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon. Image deleted; record retained. |
| GEN-0009 | 2026-08-06 | `~30bf95fd`* | Root Vegetables | Environment Plate | — | `plate-rootveg.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon. Image deleted; record retained. |
| GEN-0010 | 2026-08-06 | `~30bf95fd`* | Store Cupboard | Environment Plate | — | `plate-cupboard.md` v1 (deleted) | 0.18 | 0.17 | Generated | Rejected | No | Off‑canon. Image deleted; record retained. |

`*` = back‑filled/approximate rollback reference (see note above).

**Historical subtotal:** 10 generations · all `Generated` · **actual ≈ £1.75** · **0 production assets** (3 approved as *proof* visual‑language references, 7 rejected). No Production Library IDs assigned yet.

---

## Next entries (to be created BEFORE any generation)
The next paid generation is the **Production Pair Proof — Pantry Shelves** (Execution Plan §4 Step 2):
- `GEN-0011` — Environment Plate → on approval becomes **`LP-PS-EP-001`**.
- `GEN-0012` — Canonical Master → on approval becomes **`LP-PS-CM-001`**.

Both rows must be appended here with **Rollback Commit (exact HEAD), estimated cost, and Asset Status `Planned`** *before* generation, then updated with **Actual Cost, Generation Result, and Asset Status** immediately after. **No generation is approved yet.**
