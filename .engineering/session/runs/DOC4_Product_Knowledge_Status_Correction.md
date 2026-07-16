# DOC4 — Product Knowledge Status Correction

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/DOC4-product-knowledge-status-correction-20260716` → `7d1dd2ce`
**Snapshot:** `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` → scratchpad (`PKR.md.DOC4-pre`)
**Scope:** Governing documentation only. **No code, no schema, no runtime, no registry content.**
**Authority:** `CONV1` § Tier 1 item `DOC-4`; § 7 phase P1.
**Report:** [`docs/implementation/governance/DOC4_PRODUCT_KNOWLEDGE_STATUS_CORRECTION.md`](../../../docs/implementation/governance/DOC4_PRODUCT_KNOWLEDGE_STATUS_CORRECTION.md)

---

## Mission

Implement CONV1 item `DOC-4` only. Correct the stale Product Knowledge architecture status so it
reflects the current `docs/product/` registry and live capability. Verify all cited claims against
the current repository before editing. No code, no schema, no runtime change.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + snapshot)
- [x] `git status` confirmed (84 entries, dirty tree from concurrent sessions — preserved)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1` read — item `DOC-4`
- [x] **All cited claims verified against the repository (V1–V12)** — including the citation itself
- [x] Provenance established: **PDA1** (2026-07-11) populated; **PHASE5A** (2026-07-12) built the read path

## What changed — 2 governing documents

| Document | Passages |
|---|---|
| `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | 4 — mandate (dated note), §20 checks (scoped to authoring + callout), §22 Trust Check ×2, §23 status block (rewritten; original preserved in `<details>`) |
| `docs/architecture/README.md` | 1 sentence — the Product Knowledge paragraph's stale closing claim |

**Preserved byte-untouched (still TRUE):** `:42`, `:718`, §24 Scope Lock, and the closing footer —
all record what **PKR1/PKR2 themselves did**, which was to define the registry and build none of it.
**PDA1/PHASE5A did the building, later.** "Correcting" these would have falsely credited PKR1 with
work it deliberately refused.

## Findings

1. **CONV1's three claims are all true, and its citation `:896-942` resolves** — the first of three
   items where the citation had **not** drifted (`DOC-2`: `NK1:418` mis-cited; `DOC-3`: off by 19 lines).
   Verified: **151 files**, **154 entries**, capability registered (`capability-registry.ts:430`) with
   bindings/handler/port exported from `intelligence/index.ts`.
2. **Convergence stated as coverage, NOT a percentage.** 22 of 28 sections populated; four hold zero
   entries (**Features, Capabilities, Drawers, Product Assets**). A "79%" figure would assert a
   completeness THA cannot verify — Target Convergence requires "correctly classified for
   visibility", which nothing mechanically checks (Rule KC8 gap). **Inventing it would reproduce
   DOC-4's own defect in the act of fixing it.**
3. **The Bootstrap carried the same false claim** — `README.md:33` said `docs/product/` does not
   exist, in the document every engineer reads first. Corrected: it indexes the document DOC-4 owns,
   so leaving it would have **manufactured** a document-vs-document conflict.
4. **Risk 3 was retired in the honest direction:** the architecture demanded content precede the
   Companion path. PDA1 (07-11) preceded PHASE5A (07-12) **by one day**. The rule held; nobody recorded it.
5. **Retiring Risk 1 arms Risk 2** — "never populated" is dead; "populated and never maintained" is
   now principal, and **DOC-4 is its first instance**.
6. **A third document still carries the false claim, deliberately not fixed** —
   `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md:414`: *"the registry contains zero entries,
   `docs/product/` does not exist"*. PKCA is a **different governing document with a different
   owner** (same line `DOC-2` drew for `NK2`). **Recommended as the next `DOC`-class item** — it is a
   live governing-doc-vs-governing-doc conflict: PKCA says zero, everything else says 154.

## Verification

- `scripts/verify-product-inventory.ts` (the validator Domain 29 names): **154 prose entries,
  bijection TOTAL, 0 failures** — *"The registry is internally true"*. 38 PKR23 warnings pre-existing.
- 154/154 entries carry `owner`, `visibility`, `last_verified` — inside §15.3's 90-day window.
- SoT Register Domain 29 confirmed **fully current** — CONV1's "the Register is right" holds.
- Diff: **2 files, docs only.** No code, schema, or runtime touched.

## Next action

Complete. **Next CONV1 item: `OWN-5`** — Pantry (+ Benchmarks, Learning, Observations) have no
Source of Truth Register domain. Documentation-only, no dependencies, **closes P1** and unblocks
Tier 2 / `OWN-1`. Verify by content, and check whether `evidence-learning-store.ts:6` /
`capability-registry.ts:725` still assert "SoT-registered under EL1" before repeating it.
