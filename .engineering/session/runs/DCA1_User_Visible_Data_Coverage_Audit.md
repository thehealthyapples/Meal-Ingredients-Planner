# Session: DCA1_User_Visible_Data_Coverage_Audit

| Field | Value |
|---|---|
| **Session ID** | `DCA1_User_Visible_Data_Coverage_Audit` |
| **Rollback ID** | `rollback/DCA1-user-visible-data-coverage-audit-20260714` → `f9c23c97` |
| **Start time** | 2026-07-14T00:00:00Z |
| **Current stage** | Documentation |

## Objective
Following PUB1, measure what THA users can **actually see today** across 12 domains —
separating *data completion* (is the fact published?) from *user-visible completion*
(does a surface render it?). Investigation only; **no implementation**.

## Files being modified
- `docs/investigations/platform/DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md` — the audit (new)
- `.engineering/session/runs/DCA1_User_Visible_Data_Coverage_Audit.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

No source file is modified. No implementation performed.

## Checkpoints
- [x] Rollback tag created and reported (before any work)
- [x] Architecture bootstrap — `docs/architecture/README.md` read
- [x] `npm run verify:publication` run against the live database (59 checks, 22 domains)
- [x] Live DB row counts measured directly via `psql` (not inferred)
- [x] Client render-layer traced (router, nav, components) per domain
- [x] Audit written to canonical location

**Last checkpoint:** Audit written.

## Next action
Report findings to the user. Await direction on the recommended next workstream.
No implementation is authorised by this session.

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
