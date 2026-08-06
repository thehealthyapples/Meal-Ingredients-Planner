# Living Pantry — Generation Log (permanent audit trail)

**Purpose:** the **permanent audit log for every paid image generation** for the Living Pantry. It is the complete financial and production record.

## Protocol (binding)
1. **No generation may occur without first creating its entry here** (status `Planned/Approved`, estimated cost).
2. **Every approved generation must be recorded** — including its **actual cost** and **result** — **before the next generation begins.**
3. **One generation = exactly one appended entry.** Entries are append-only; corrections are added as new rows referencing the original ID, never deleted.
4. Costs are recorded in **GBP** (estimated at ~£0.17–0.20/image from observed token usage; actual derived from the generation metadata's token counts — gpt-image-2 exact pricing unconfirmed, so actuals are best-estimate from tokens).

## Field definitions
- **Generation ID** — `GEN-NNNN`, monotonic.
- **Date** — date of generation (or of entry for pre-generation planning rows).
- **Working Position** — the Living Pantry position.
- **Asset Type** — `Environment Plate` · `Canonical Master` · `Living Object` (or `Proof` for pre-architecture proof assets).
- **Prompt Version** — the spec/prompt used (file + version).
- **Estimated Cost** / **Actual Cost** — GBP.
- **Result** — `Accepted` · `Rejected` · `Superseded`.
- **Home Owner Approval** — `Yes` · `No` · `Pending`.
- **Notes**.

## Cumulative spend
- **Actual spent to date:** **≈ £1.75** (historical rows GEN‑0001…GEN‑0010 below).
- **Committed/approved but not yet generated:** £0.00 (generation is paused pending Home Owner approval of the one-position Production Pair Proof — see the Execution Plan §4 Step 2).

---

## Log

> **Rows GEN‑0001…GEN‑0010 are back‑filled historical records** — these paid generations occurred *before* this log existed and are recorded here for a complete audit trail. From GEN‑0011 onward, the protocol above applies (entry created *before* generation).

| Generation ID | Date | Working Position | Asset Type | Prompt Version | Est. Cost | Actual Cost | Result | HO Approval | Notes |
|---|---|---|---|---|---|---|---|---|---|
| GEN-0001 | 2026-08-06 | Pantry Shelves | Proof (Canonical Master) | `00_FOUR_IMAGE_PROOF/_specs/shelves.md` v1 | £0.18 | £0.17 | Accepted | Yes (visual language) | Four-image proof; edit-from `shelf.png`. Approves look, not production pixels. |
| GEN-0002 | 2026-08-06 | Fridge | Proof (Canonical Master) | `…/_specs/fridge.md` v1 | £0.18 | £0.17 | Accepted | Yes (visual language) | Oak integrated appliance confirmed; edit-from `work-fridge-empty.png`. |
| GEN-0003 | 2026-08-06 | Fruit | Proof (Canonical Master) | `…/_specs/fruit.md` v1 | £0.18 | £0.17 | Accepted | Yes (visual language) | Edit-from `work-fruit.png`. |
| GEN-0004 | 2026-08-06 | Store Cupboard | Proof (Canonical Master) | `…/_specs/cupboard.md` v1 | £0.18 | £0.17 | Rejected | No | Wrong furniture (standalone larder, not under-counter tins). Superseded by corrected spec. |
| GEN-0005 | 2026-08-06 | Pantry Shelves | Environment Plate | `plate-shelves.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon: text-to-image produced a different pantry. **Deleted.** |
| GEN-0006 | 2026-08-06 | Fridge | Environment Plate | `plate-fridge.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon (different room). **Deleted.** |
| GEN-0007 | 2026-08-06 | Freezer | Environment Plate | `plate-freezer.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon. **Deleted.** |
| GEN-0008 | 2026-08-06 | Fruit | Environment Plate | `plate-fruit.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon. **Deleted.** |
| GEN-0009 | 2026-08-06 | Root Vegetables | Environment Plate | `plate-rootveg.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon. **Deleted.** |
| GEN-0010 | 2026-08-06 | Store Cupboard | Environment Plate | `plate-cupboard.md` v1 (deleted) | £0.18 | £0.17 | Rejected | No | Off-canon. **Deleted.** |

**Historical subtotal:** 10 paid generations · **actual ≈ £1.75** · 3 accepted (proof visual language), 7 rejected (1 wrong-furniture proof + 6 off-canon plates, all superseded/deleted).

---

## Next entry (to be created BEFORE any generation)
The next paid generation is the **Production Pair Proof — Pantry Shelves** (Execution Plan §4 Step 2): `GEN-0011` (Environment Plate) and `GEN-0012` (Canonical Master). **They must be appended here with estimated cost and Home-Owner approval *before* generation, and updated with actual cost and result immediately after.** No generation has been approved yet.
