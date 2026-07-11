# DEVWORLD2 — Import Verification Findings (read-only)

**Status:** VERIFICATION — read-only checks only. No code, schema, migration, or data changed.
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Scope:** Confirm the DEVWORLD2 import (`scripts/import-development-world.ts`) landed correctly in the DEV database, and identify existing operator surfaces for manual inspection.
**Method:** A throwaway read-only probe resolved the `data/development_world/development_world_foundation_50.v1.json` accounts/references against the live DEV database; the probe was deleted after running. No rows were written.

---

## Confirmations (all PASS, verified against the live DEV database)

| Check | Result |
|---|---|
| Development World households | **50** ✓ |
| Dev users under `@dev.thehealthyapples.dev` | **96** ✓ (all 96 file accounts present) |
| Eaters in dev households | **139** ✓ |
| Planner entries | **1352** ✓ |
| Diary entries | **392** ✓ |
| Evidence events | **343** ✓ |
| Dev-user-owned meals | **0** ✓ (references only — no recipe body duplicated) |
| Meal references resolve to system meals | **328/328 unique resolve, 0 unresolved** ✓ |
| Planner entries point at system meals | **265 distinct meals, all `is_system_meal=true, user_id=0`** ✓ |

**Production isolation — untouched:** Every active member of the 50 dev households is a `@dev` account (**0 non-dev members** inside dev households). The 500 `tha_original` system meals are unchanged and all `user_id=0`. Total users in DB = 220; the **124 non-dev users** were never members, never authored a dev meal, and sit entirely outside the scoped write/wipe path (which keys only off `@dev.thehealthyapples.dev` usernames). The 139-vs-140 eater count is the expected cold-start gap (DW050 is account + empty household).

---

## 5 sample Development World users to inspect manually

| Household | User ID | Household ID | Username |
|---|---|---|---|
| DW001 Foster Family (Dev) | 205 | 200 | `foster.busy.family.owner@dev.thehealthyapples.dev` |
| DW002 Patel Family (Dev) | 207 | 202 | `patel.vegetarian.teen.owner@dev.thehealthyapples.dev` |
| DW003 Evans Household (Dev) | 209 | 204 | `evans.vegan.couple.owner@dev.thehealthyapples.dev` |
| DW004 Morgan Family (Dev) | 211 | 206 | `morgan.coeliac.child.owner@dev.thehealthyapples.dev` |
| DW005 Kelly Family (Dev) | 213 | 208 | `kelly.dairy.free.toddler.owner@dev.thehealthyapples.dev` |

(Shared DEV password `devworld-dev-only` unless `DEV_WORLD_PASSWORD` was overridden at import.)

---

## Can any existing Admin page show their household/planner data?

**No page shows DW planner/household content.**

- **`admin-users-page`** (`/api/admin/users`) lists every user, searchable by `@dev` email, but exposes only account-level fields: email, display name, role, tier, onboarding, created, last login. Its per-user `diagnostics` endpoint (`/api/admin/users/:id/diagnostics`) adds only `hasActiveHousehold` + `householdId` — no planner, diary, eater, or evidence detail.
- **`admin-benchmark-households-page`** (`/api/admin/benchmark-households`) is a rich household inspector (canonical detail, live counts, reset, impersonate) — but it is sourced from the **Benchmark World fixtures (`BENCHMARK_WORLD`, BW01–BW10)**, not the Development World data file. The 50 DW households do **not** appear in it.

---

## Does impersonation / view-as exist?

**Yes, but only for the Benchmark World — it cannot reach Development World households.**

The route `POST /api/admin/benchmark-households/:id/impersonate` (`server/routes.ts:8439`) resolves the target via `resolveBenchmarkOwner(id)`, which reads the `BENCHMARK_WORLD` fixtures. A `DW###` id returns `null` → **404 "Benchmark household not seeded"**. There is a full session-swap mechanism (`req.login` + `benchmarkImpersonation` session flag, a return-to-admin stop endpoint at `/api/benchmark-impersonation/stop`, and `client/src/components/benchmark-impersonation-banner.tsx`), but it is keyed to BW fixtures only. **No generic "view as any user" / DW impersonation exists today.**

---

## Summary

Every requested data assertion passes and production is isolated. The gap for manual inspection is purely surface-level: the DEVWORLD2 data is present and correct in the DB, but the existing operator tooling (household inspector + impersonation) is bound to the Benchmark World fixtures, so it does not currently surface or impersonate the 50 Development World households. No code was changed; findings only.
