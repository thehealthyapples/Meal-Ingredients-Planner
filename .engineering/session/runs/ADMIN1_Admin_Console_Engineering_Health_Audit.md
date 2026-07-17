# ADMIN1 — Admin Console & Engineering Health Audit

**Session ID:** `ADMIN1_Admin_Console_Engineering_Health_Audit`
**Objective:** Investigate the Admin Console, define its canonical architecture, and
recommend an Engineering Health Dashboard and Alert Framework. **Investigation only —
implement nothing.**
**Rollback ID:** `rollback/ADMIN1-admin-console-engineering-health-audit-20260717` → `10573dd20baa9497975c4ed05837b75162305410`
**Report:** `docs/investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`
(filed under the `admin` workstream per REPOSITORY_CONVENTIONS §4 — the brief's
root path `docs/investigations/…` would fail `repo-structure-verify.sh`).

---

## Stage
Waiting for User — report authored, committed. Investigation complete; **nothing implemented**.

## Rollback
Tag created at HEAD `10573dd2`. Working tree **intentionally dirty** at session start
(sibling sessions NORTH3/4/5, FI18, P0, CONV1 P10 modifications present) — the tag
covers committed state only; ADMIN1 authors documents only and touches no product source.

## Checkpoints
- [x] Rollback protection created and recorded
- [x] Architecture bootstrap read (README, workflow, rollback protocol, conventions, SoT §32/33, Observation Engine, Platform Quality Architecture)
- [x] Admin Console CLIENT inventory (13 pages, 13 routes — via agent)
- [~] Admin Console SERVER surface (agent running)
- [~] Platform process & health-signal enumeration (agent running)
- [x] Admin Console SERVER surface (76 assertAdmin routes, ~85 endpoints — via agent)
- [x] Platform process & health-signal enumeration (via agent)
- [x] Duplicate / obsolete / ownership analysis (2 duplicated-monitoring signals; 0 duplicate pages)
- [x] Report authored, staged, committed

## Key findings so far (evidence-locked)
- **HEADLINE:** `buildOperationsStatus()` (`server/lib/platform-status.ts:180`) has **ZERO callers** repo-wide; no `/api/admin/platform/operations` or `/turn-outcomes` route exists. Platform Quality Architecture §2/§11 records the observability gap as *"substantially closed (EWO-PRO1) … surfaced at /api/admin/platform/operations"* — it is not. THA observes its **Intelligence runtime** in fine detail (2 workbenches) but has **no operator surface for production health** (uptime, memory, DB reachability, dependency circuit state, env config) though the code to compute all of it is written and called by nothing. Same "authored-but-never-adopted" class as P0's dead test chain.
- Two rival admin-IA declarations: hub cards (`admin-page.tsx`, 12) vs `admin-banner.tsx` ADMIN_NAV (9) — banner omits Dev World, Knowledge Review, Canonical Publication Integrity.
- `ProtectedRoute` never checks admin role; per-page guards inconsistent (NotFound vs bare null vs server-403); `admin-recipe-sources-page.tsx` has **no client admin guard** (server `assertAdmin` is the real gate — 102 usages).
- 4 intelligence admin pages: no true dup, but naming collisions ("Companion Intelligence"=learning · "Intelligence Dashboard"=benchmark · "Observations"=aggregate telemetry · "Behaviour"=per-session). "benchmark" names two subsystems (`/api/intelligence/benchmark/*` vs `/api/admin/benchmark-households/*`).
- Hub "Overview" card is a permanent `coming-soon` stub (`admin-page.tsx:14-21`) — the natural home for an Engineering Health / Operations dashboard.
- Governance anchor: **Platform Quality Architecture** owns engineering health (6 quality domains; Quality Spine → Operations §8). Dashboard+Alerts = the missing Operations surface + §2 Observability's open "alerting". Observation Engine §6/§7: one telemetry store, "no other operator surface may exist" → intelligence signals must be projections, not a new store.

## Next action
On the two remaining agents completing: synthesise into the report at
`docs/investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`; stage + commit.

## Blockers
None.
