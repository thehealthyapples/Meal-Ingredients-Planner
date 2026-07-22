# Session: ED2_Environmental_Dressing_Runtime

| Field | Value |
|---|---|
| **Session ID** | `ED2_Environmental_Dressing_Runtime` |
| **Rollback ID** | `rollback/ED2-environmental-dressing-runtime-20260722` → `88cf6277` (annotated tag; created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Start time** | 2026-07-22 |
| **Current stage** | Documentation → Waiting for User (committed; awaiting Home Owner acceptance) |

## Objective
Build the canonical **Environmental Dressing Runtime** (`LIVINGHOME2` Phase 2) as code: one register (empty), one loader, one placement resolver, one runtime resolver, one renderer interface + shell, placement validation, admission hooks, and the verifier's third-register `dressingChecks()`. **The register stays EMPTY; the renderer produces no visible output; no dressing appears anywhere.**

## Gate status — both prerequisites cleared
`LIVINGHOME2` § 10.4 Phase 2 is gated behind (a) the four § 10.2 owner amendments **and** (b) `EXP3` Phase 2 (base registers + `verify:living-home-assets`). Both are landed: `ED1` (`a9440761`) landed the amendments; `EXP3 Phase 2` (`be7b8301`) shipped the base register/verifier and its own recommendation names ED2 (empty register) as now lawful. This session builds that empty register only.

## Recorded decision — the visible mouth is NOT built here
`EXP3` § 7.1 / UIA § 17: an authored-but-unadopted mount is a defect; the composition mouth lands with its first consumer. So ED2 ships the **runtime as pure `lib/` code** (register + resolvers + a pure renderer interface & shell that yields an empty plan) — **not** a mounted React component. The DOM-painting mouth `client/src/components/layout/dressing-layer.tsx` lands with the first admitted item (ED3 — Standing Welcome). The pure module is recorded as a known, owned, pending-adoption orphan (the `living-details-manifest.ts` precedent).

## Checkpoints
- [x] Read required docs (README; LIVINGHOME2; EXP3; ED1; EXP3 Phase 2; HOME_OWNER). Inspected live code (verifier, Life manifest, house register, orchard-backdrop, adoption gate).
- [x] git status confirmed; annotated rollback tag created (`88cf6277`) & reported before any modification.
- [x] Built `client/src/lib/living-home/dressing-register.ts` — register (empty) + loader + placement resolver + runtime resolver + renderer interface/shell + placement validation + admission hooks + checksum (ED1 § 5–§ 7 contract; forbidden fields inexpressible + refused at read time).
- [x] Filled the verifier's `dressingChecks()` seam — 6 checks (checksum · no forbidden field · admissible & § 7.2-gated · § 5.1 placement exclusions · admission-doc existence · empty resolves/renders to nothing). Tightened the Life "one mouth" check to match quoted imports (removes prose false-positive). `verify:living-home-assets` 12/12 PASS.
- [x] Recorded the pure module as a passing known-orphan in the adoption register; regenerated `ADOPTION_REGISTER.md`.
- [x] Wrote `docs/implementation/ED2_ENVIRONMENTAL_DRESSING_RUNTIME.md` (all 9 sections).
- [x] Verified: typecheck 88/0-in-new · build exit 0 · verify 12/12 · adoption 102 pass/9 baseline fails · runtime demo (0 resolved, 0 rendered, binding & text refused).
- [x] Commit; record hash here + dashboard.

## Result
Committed `<HASH>` on `int1-intelligence-platform`. Register EMPTY; renderer yields no output; no visible dressing; no UI regression possible (0 client importers). Runtime has one owner, one register, one renderer, one resolver, one verification path.

## Next action
Home Owner acceptance of the runtime + the § 0.2 decision (DOM mouth deferred to ED3). Then **ED3 — Standing Welcome**: the DOM mouth `dressing-layer.tsx` + one still asset + full ED10 admission + § 5.1 placement + checksum-recompute-in-same-commit + Home Owner approval — the first visible item (the bowl of apples).

## Blockers
None — both Phase-2 gates cleared. The first *visible* item is hard-gated behind ED3's own admission + Home Owner approval (by design, not a blocker).

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
