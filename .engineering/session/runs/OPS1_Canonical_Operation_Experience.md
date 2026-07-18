# OPS1 — Canonical Operation Experience

**Session ID:** `OPS1_Canonical_Operation_Experience`
**Objective:** Implement ONE reusable Operation experience for all privileged admin actions
(the ADMIN2 "Operation Card"). Do NOT redesign tools. Create one shared Operation component
and migrate existing operations to use it — Publish Knowledge · Verify Publication · Run
Benchmark · Learning Snapshot · Rollback. Every operation follows the same flow: Purpose ·
Readiness · Confirm · Progress (meaningful stages where available, honest indeterminate
otherwise) · Completion summary · Recommended next step. Reuse existing APIs/logic; no
duplicated behaviour; honest unknowns over fabricated progress; calm, reassuring THA.
**Rollback ID:** `rollback/OPS1-canonical-operation-experience-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`
**Report:** `docs/implementation/OPS1_CANONICAL_OPERATION_EXPERIENCE.md`

---

## Stage
**COMPLETE.** Shared `client/src/components/admin/operation.tsx` (407 lines) built; all FIVE
operations migrated (Publish, Rollback, Verify Publication, Run Benchmark, Learning Snapshot);
typecheck clean for OPS1 (0 regressions in OPS1 files); build clean (3287 modules); six lifecycle
screenshots captured against the live app with a disposable admin (created + deleted); report
authored.

## Next action
None — session complete. See report `docs/implementation/OPS1_CANONICAL_OPERATION_EXPERIENCE.md`.

## Design decision (the shared component)
- ONE component (`OperationDialog`) driven by an `OperationSpec` — reuses each page's EXISTING
  mutationFn/endpoint (no new API, no duplicated behaviour). The component owns the LIFECYCLE +
  presentation only: confirm → running → done | error.
- Confirmation weight tracks `impact.level` (`read-only` | `reversible` | `canonical`) — canonical
  gets the destructive confirm; read-only re-verify gets a calm one; any `blocked` readiness
  disables the action.
- Progress: honest indeterminate pulse + expected-duration text; named phases advance ONLY on a
  real client-observable step (`ctx.setPhase`). NEVER a fabricated bar.
- UNKNOWN≠green: completion summary rendered from the REAL result only; failure reads the calm
  three-tier error, never the last green.

## Rollback
Annotated tag at `7bfad50c` (HEAD at session start; still HEAD — nothing committed). Client-only
changes; no server/schema/migration/endpoint touched. To roll back: discard working-tree changes to
the four pages and delete `client/src/components/admin/`. Verification wrote one advisory
`companion_health_snapshots` row (#3) and seeded the benchmark world — isolated dev-world data,
nothing canonical; the disposable admin + its audit-log rows were deleted.

## Checkpoints
- [x] Rollback protection created and recorded
- [x] Map 5 operation sites (endpoints, mutations, result shapes, current feedback)
- [x] Design + build shared Operation component (`operation.tsx`, 407 lines)
- [x] Migrate Publish + Rollback (highest-priority silent mutations)
- [x] Migrate Verify Publication + Run Benchmark + Learning Snapshot
- [x] Typecheck (0 OPS1 regressions) + build (clean, 3287 modules)
- [x] Screenshots (6 lifecycle shots), disposable admin created + deleted
- [x] Author OPS1 report
- [x] Reconcile run file + CURRENT.md before final response
