# SUP2 — Steward Dashboard

**Session ID:** `SUP2_Steward_Dashboard`
**Objective:** Replace the Support Hub Overview with a true Steward Dashboard that answers
four operator questions (How is THA today? · What needs my attention? · Can I safely release? ·
What has changed?) by surfacing EXISTING information only. No new health calculations, no
backend changes, no new APIs. Calm, confident, supportive; clear answers over metrics.
Each section: a simple status + one recommended action when appropriate.
**Rollback ID:** `rollback/SUP2-steward-dashboard-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`
**Report:** `docs/implementation/SUP2_STEWARD_DASHBOARD.md`

---

## Stage
Complete — awaiting review. Steward Dashboard implemented (1 client file), typecheck clean,
build exit 0, screenshots captured end-to-end with real data, report authored.

## Endpoint map (all existing, read-only, assertAdmin, auto-load on mount — NO new API)
- Q1 How is THA today? → `GET /api/admin/canonical-publication-integrity` → `summary.{healthy,domains,needsAttention,publicationFailure}` + `generatedAt` (server already classifies each domain status).
- Q2 What needs attention? → `GET /api/admin/knowledge-review/health` (`backlog.outstandingReviews`, `trend`) + `GET /api/intelligence/learning/dashboard` (`recommendationCounts.pending`) + reuse pub `summary.needsAttention+publicationFailure`.
- Q3 Can I safely release? → `GET /api/intelligence/benchmark/runs` → latest `runs[].{verdict PASS/PARTIAL/FAIL, headlineScore, gatesFired, executedAt}` (reads saved runs — does NOT run a benchmark).
- Q4 What has changed? → `GET /api/admin/knowledge-review/releases` (`publishedAt`, `publishedByUsername`) + latest benchmark run.
- ⛔ NEVER trigger: POST benchmark/run, POST benchmark-households/run-benchmark, POST learning/snapshot.
- Honesty rule carried: UNKNOWN≠green; release card says "last run … {time}" so it never poses as current.

## Rollback
Annotated tag created at HEAD `7bfad50c`. Working tree intentionally dirty at session start
(sibling sessions hold uncommitted changes); the tag covers committed state only. SUP2 builds
on SUP1's `admin-page.tsx` re-dress.

## Checkpoints
- [x] Rollback protection created and recorded
- [x] Read SUP1 report + current admin-page.tsx (the surface SUP2 rebuilds)
- [x] Map existing admin GET endpoints available to the client (no new APIs)
- [x] Design the Steward Dashboard (4 questions → status + one action)
- [x] Implement in admin-page.tsx (Overview → Steward Dashboard)
- [x] Typecheck (0 in admin-page.tsx; 275 baseline = server sibling debt) + build (exit 0)
- [x] Screenshots — desktop + mobile + cards crop, real data, disposable admin created+deleted (0 leftover)
- [x] Author SUP2 report (docs/implementation/SUP2_STEWARD_DASHBOARD.md)
- [x] Reconcile run file + CURRENT.md before final response

## Result
1 product file: `client/src/pages/admin-page.tsx` — StewardDashboard replaces the SUP1 static
Engineering-health link strip. 5 existing read-only assertAdmin GETs surfaced (publication
integrity, knowledge-review health, learning dashboard, benchmark runs, releases). UNKNOWN≠green
tone system; release card framed as "last run … {time}"; healthy card carries no action.
NO backend, NO new API/endpoint/calc, NO benchmark/publish ever triggered, NO nav change.
Verified end-to-end: dashboard renders 4 cards with real data, 0 console errors.

## Next action
None — complete; awaiting review. Follow-ons (not implemented): cached /api/health readout for
"How is THA today?" (avoids running a full publication pass per visit); rename banner "Overview"
nav link to match the room (ADMIN1 QW-4); calm operator activity log; Operation Card pattern.

## Blockers
None yet. Watch the scope line: surface existing status fields only; fabricate no status
(UNKNOWN≠green, UI Arch §14); add no query the platform doesn't already own.
