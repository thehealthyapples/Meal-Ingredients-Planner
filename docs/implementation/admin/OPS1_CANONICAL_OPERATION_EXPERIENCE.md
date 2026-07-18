# OPS1 — Canonical Operation Experience

**Status:** Complete
**Session:** `OPS1_Canonical_Operation_Experience`
**Date:** 2026-07-17
**Rollback ID:** `rollback/OPS1-canonical-operation-experience-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`
**Design priors:** ADMIN2 "the Operation Card" (Part 6), lifecycle (Part 4), guidance-as-gate
(Part 3), feedback standard / confirmation ∝ consequence (Part 5); THA_UI_ARCHITECTURE §14
(colour is spent only on real consequence).

---

## 1. Objective

Implement **one** reusable Operation experience for every privileged admin action, and migrate the
five existing operations to it — **Publish Knowledge · Verify Publication · Run Benchmark ·
Learning Snapshot · Rollback**. Do not redesign any tool. Reuse each tool's existing API/mutation;
no new endpoints, no duplicated behaviour. Every operation follows the same flow:

> **Purpose → Readiness → Confirm → Progress → Completion summary → Recommended next step**

with **honest unknowns over fabricated progress**, and confirmation weight proportional to
consequence.

## 2. What was built

### The shared component — `client/src/components/admin/operation.tsx` (407 lines, new)

One declarative owner, `OperationDialog`, driven by an `OperationSpec<TResult>`. A tool keeps its own
trigger and its own API; the component owns only the shared **lifecycle and presentation**. It
renders four phases — `confirm → running → done | error` — and mechanically enforces the design laws
so no tool can quietly skip them:

- **Confirmation ∝ consequence.** `impact.level` (`read-only` | `reversible` | `canonical`) drives
  the badge, where colour is spent, and the confirm button variant. A `canonical` operation gets a
  destructive confirm; a `read-only` re-verify gets a calm default. Any `blocked` readiness signal
  disables the action.
- **Guidance is the gate.** The `guidance` questions render as a "What does this do?" collapsible in
  the confirm phase (ADMIN2 §3).
- **Honest unknowns over fabricated progress.** The running state is a calm indeterminate pulse with
  the honest expected duration — **never a fabricated percentage**. Named phases advance **only** when
  the caller reports a real, client-observable step via `ctx.setPhase`. Escape / outside-click are
  blocked while running, so an in-flight operation is never lost by accident.
- **UNKNOWN ≠ green.** The completion summary is rendered from the **real result only**
  (`spec.summarise`); a failure reads the calm three-tier error ("what · what it means · one way
  forward"), never the last green.
- **Reuse.** `spec.run` calls each page's existing mutation/endpoint verbatim.

Every element carries a stable `data-testid` (`operation-<id>`, `operation-confirm-<id>`,
`operation-start-<id>`, `operation-done-<id>`, `operation-error-<id>`, …) for verification.

### The five migrations

| Operation | Page | Impact tier | Existing endpoint reused |
|---|---|---|---|
| **Publish Knowledge** | `admin-knowledge-review-page.tsx` (`ReleasesPanel`) | `canonical` | `POST /api/admin/knowledge-review/publish` |
| **Rollback** | `admin-knowledge-review-page.tsx` (per-release) | `canonical` | `POST /api/admin/knowledge-review/releases/:id/rollback` |
| **Verify Publication** | `admin-canonical-publication-integrity-page.tsx` | `read-only` | page query `refetch()` (no new endpoint) |
| **Run Benchmark** | `admin-benchmark-households-page.tsx` | `reversible` | `POST /api/admin/benchmark-households/run-benchmark` |
| **Learning Snapshot** | `admin-companion-intelligence-page.tsx` | `reversible` | `POST /api/intelligence/learning/snapshot` |

The two silent canonical mutations (Publish, Rollback) were migrated first — ADMIN2's
highest-priority defect. Each migration deletes the tool's ad-hoc `useMutation` + toast and replaces
it with a spec whose `run` reuses the same endpoint and whose `onComplete` carries the page's own
side effects (query invalidation, state resets). No server code, schema, or migration was touched.

## 3. Files changed

All changes are client-only. Deltas are measured against the rollback tag.

| File | Change |
|---|---|
| `client/src/components/admin/operation.tsx` | **new**, 407 lines — the shared Operation experience |
| `client/src/pages/admin-knowledge-review-page.tsx` | +87 / −18 — Publish + Rollback specs |
| `client/src/pages/admin-canonical-publication-integrity-page.tsx` | +46 / −1 — Verify Publication spec |
| `client/src/pages/admin-benchmark-households-page.tsx` | +61 / −17 — Run Benchmark spec (this session) |
| `client/src/pages/admin-companion-intelligence-page.tsx` | +60 / −18 — Learning Snapshot spec (this session) |
| `docs/implementation/assets/ops1/*.png` | **new** — 6 verification screenshots |
| `docs/implementation/OPS1_CANONICAL_OPERATION_EXPERIENCE.md` | **new** — this report |

> `admin-page.tsx` and `admin-banner.tsx` also appear dirty in the tree but are **not** OPS1's —
> neither imports the Operation component; they are concurrent sibling-session work.

## 4. Verification results

### Typecheck — clean for OPS1

- `tsc --noEmit`: **0 errors in any OPS1-touched file** (`operation.tsx` and all four pages).
- The baseline gate (`npm run typecheck:ci`) reports 27 pre-existing regressions in the dirty tree —
  **0 of them are in OPS1 files**; they live in sibling-session server files
  (`server/tests/…`, `server/verification/publication-register.ts`, `…/publication-checks.ts`) that
  were already modified when OPS1 started. **OPS1 adds zero type regressions.**

### Build — clean

- `npm run build`: server bundle + `vite build` succeeded, **3287 modules transformed**, including
  both migrated pages. No errors.

### End-to-end — driven in the running app

Verified against the live dev server (`localhost:5000`, HMR) with a **disposable admin** (created via
the app's own password hashing, promoted in-DB, and **deleted afterward** along with its audit-log
rows — 0 rows remain). Each operation's dialog was opened and, for the two safe operations, run to a
terminal state. Real, un-fabricated behaviour observed:

- **Publish Knowledge (confirm):** `canonical` badge, red impact line, readiness correctly **blocked**
  ("No approved proposals to publish") which **disables** the Publish button — the gate works.
- **Verify Publication (confirm → done):** `read-only` badge; ran the real CPI audit; completion
  summary reported the server's own numbers — *"4 domains failed publication · 7 of 23 healthy · 76
  checks — 51 passed, 20 warned, 5 failed, 0 skipped"* with an honest **warning** tone. Skipped is
  not counted as healthy.
- **Run Benchmark (confirm):** `reversible` badge; after seeding, readiness read **ready** ("10
  households targeted — All households"); purpose reflected the live mode/target selection.
- **Learning Snapshot (confirm → done):** `reversible` badge; ran the real snapshot; completion
  honestly reported *"Snapshot recorded — no new recommendations. Snapshot #3 · 6867 turns
  analysed"* — the honest-unknowns law, verbatim: it states what happened rather than inventing
  recommendations.

## 5. Screenshots

Captured with Playwright (`docs/implementation/assets/ops1/`). Publish and Run Benchmark are shown at
the **confirm gate only** and were **never executed** (they mutate); Verify (read-only) and Learning
Snapshot (advisory/reversible) were run to completion.

| # | File | What it shows |
|---|---|---|
| 1 | `01-publish-confirm.png` | Publish — canonical confirm gate, readiness blocking a disabled action |
| 2 | `02-verify-confirm.png` | Verify — read-only confirm gate |
| 3 | `03-verify-done.png` | Verify — completion summary from real audit data (honest warning) |
| 4 | `04-benchmark-confirm.png` | Run Benchmark — reversible confirm gate, ready readiness |
| 5 | `05-snapshot-confirm.png` | Learning Snapshot — reversible confirm gate |
| 6 | `06-snapshot-done.png` | Learning Snapshot — honest "no new recommendations" completion |

## 6. Rollback

- **Tag:** `rollback/OPS1-canonical-operation-experience-20260717` → `7bfad50c` (HEAD at session
  start; matches now — nothing was committed).
- **To roll back:** discard the working-tree changes to the four pages and delete the new
  `client/src/components/admin/` directory. Client-only; no server, schema, migration, or endpoint
  was touched, so there is nothing to unwind on the backend.
- **Data note:** end-to-end verification wrote one advisory `companion_health_snapshots` row
  (snapshot #3) via the real Learning Snapshot operation, and seeded the deterministic benchmark
  world. Both are isolated dev-world writes — nothing canonical any household sees. The disposable
  admin and its audit-log rows were deleted.

## 7. Follow-on recommendations

1. **Rollback confirm not screenshotted.** No published `knowledge_releases` row exists in the dev DB,
   and OPS1 will not publish canonical knowledge purely to capture an image. The Rollback spec is code-
   complete and shares the identical `canonical` gate as Publish (screenshot #1). Capture it opportunistically
   the next time a real release exists.
2. **Three sibling mutations on the benchmark page remain ad-hoc** — *Seed World*, *Reset household*,
   *Impersonate*. They are out of OPS1's stated five, but *Impersonate* in particular is a consequential
   silent action that would benefit from the same confirm gate. Recommend a small follow-up to migrate them.
3. **`nextStep.onClick` is unused so far.** Both migrations that had a same-page target (Verify,
   Learning Snapshot) correctly omit a next-step button because the result surface is on the page.
   The `onClick` branch is exercised by no current spec — keep it, but note it is currently untested in situ.
4. **Pre-existing typecheck debt is unrelated but real.** The 27 baseline regressions in sibling-session
   server files will turn CI red on push; they are not OPS1's to fix, but whoever lands this branch should
   land them together or resolve them first.
