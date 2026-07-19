# Session: BUS2A_Commercial_Platform_Foundation

| Field | Value |
|---|---|
| **Session ID** | `BUS2A_Commercial_Platform_Foundation` |
| **Rollback ID** | `rollback/BUS2A-commercial-platform-foundation-20260718` → `fc9423ff20f61267f5de59c9b630daabd80d030a` |
| **Start time** | 2026-07-18 |
| **Resumed** | 2026-07-19 |
| **Current stage** | Complete |

## Objective
Create the governed commercial architecture for The Healthy Apples (products, plans,
billing periods, subscription lifecycle, trials, household entitlements, feature gates,
plan limits, lifecycle states) with a canonical entitlement projection THA owns, behind a
clean payment-provider boundary. No Stripe integration, no payments, no live subscriptions.

## Resume note (2026-07-19)
This run file was **stale**. It recorded stage "Rollback Complete" with reconnaissance
unfinished, but the 2026-07-18 session had in fact built the entire domain and never
updated the file. Everything under `shared/commerce/`, `server/commerce/`,
`server/commerce-routes.ts` and the BUS2A test suite already existed, **untracked**.

Resuming therefore meant **verifying and completing**, not rebuilding. Nothing was
restarted and nothing was duplicated.

**What the 2026-07-18 session left genuinely unfinished** — found by verifying its own
claims against source rather than trusting them:

1. `share-plan-dialog.tsx:47` still compared tier strings by hand and compared a shared
   plan count to a typed `1`. Both `THA_COMMERCIAL_ARCHITECTURE.md` § 4 and the Source of
   Truth Register recorded this site as **converged**. It was not.
2. `server/auth.ts` still served the template ceiling to the client from
   `MAX_PRIVATE_TEMPLATES_FREE`/`_PREMIUM` while `routes.ts` enforced it from the
   catalogue — so a deployment setting the variable would have **shown** households a
   limit the server did not **enforce**.
3. **No client code consumed `/api/commerce/entitlements` at all.** The projection had no
   reader.
4. Register Domain 26 declared no unsuffixed `Authoritative Source` row, failing
   `verify:coherence` (Register Rule 1).

## Files created (this resume)
- `client/src/hooks/use-entitlements.ts` — the client's one reader of the projection; fails
  closed to the free plan; presentation only, never a security boundary.

## Files modified (this resume)
- `client/src/components/share-plan-dialog.tsx` — converged onto the projection; ceiling computed.
- `server/auth.ts` — `/api/config` limits served from the plan catalogue; env vars unread.
- `server/tests/test-bus2a-commercial-foundation.ts` — new § 8, 7 checks (86 → 93).
- `docs/architecture/THA_COMMERCIAL_ARCHITECTURE.md` — § 4 correction recorded in place.
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 26 corrected.
- `docs/product/inventory/product.yaml` (+ generated `product.json`), `docs/product/structure/domains/dom-commerce.md`.

## Checkpoints
- [x] Architecture bootstrap read
- [x] BUS1 completion report read
- [x] Rollback tag created and dirty tracked files snapshotted
- [x] Reconnaissance of existing subscription / trial / entitlement / feature-gate code
- [x] Canonical commercial domain, lifecycle, plans, entitlements, gates, projection, API
- [x] Convergence claims **verified against source**, not trusted — two found false and closed
- [x] Client read path built and failing closed
- [x] Tests 93/93; regression guards mutation-tested (not vacuous)
- [x] Build passes; endpoints driven live
- [x] Architecture + product registries updated and verified

**Last checkpoint:** BUS2A complete and validated.

## Next action
None for BUS2A. Successor is **BUS2B — Stripe Integration**; its backlog is
`THA_COMMERCIAL_ARCHITECTURE.md` § 6.

## Blockers
None for BUS2A.

**Carried, not caused by BUS2A:**
- `verify:coherence` still fails on **Domain 34 (Legal Agreement & Consent)** — the same
  missing-`Authoritative Source`-row defect, owned by **BUS1**. Deliberately not amended:
  it is another workstream's governing record.
- `verify:publication` fails on 4 domains (Meals, Meal Templates, Pantry, Nutrition
  Boost/Uplift) — pre-existing, recorded by PROD5, none commercial.
- Repo-wide `tsc` reports 94 errors, all pre-existing; **none** in any file touched here.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
