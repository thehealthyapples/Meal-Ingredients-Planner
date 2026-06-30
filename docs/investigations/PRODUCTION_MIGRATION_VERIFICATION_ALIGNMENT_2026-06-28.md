# Production Migration Verification Chain — Alignment Investigation

**Date:** 2026-06-28
**Investigator:** Claude (Opus 4.8) — read-only investigation
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**HEAD at investigation:** `556747e4d30bc1589eb52f4451e0d1ee350fa218`
**Mode:** Read-only. No push. No deploy. No production modification. No code changes.

---

## Purpose

Determine whether the production verification chain
(Replit → GitHub → Render → Neon) is **internally consistent** with respect to
the expected migration head, before approving a production release.

Components inspected:

1. `server/migrations/runner.ts` — runtime migration owner
2. `scripts/verify-prod.ts` — production verification script
3. `RELEASE.md` — release process / migration verification instructions
4. `docs/release-notes.md` — release rules / migration verification references

---

## Findings (evidence)

### 1. `server/migrations/runner.ts` — the migration OWNER

- The `MIGRATIONS` array is the single ordered migration history. New migrations
  are appended to the end (documented rule at lines 27–29, 1452).
- **Latest / last migration id in the array:** `2026-06-18_ws0_knowledge_registry`
  (`runner.ts:1369`, final entry before the array closes at line 1453).
- The runner does **not** hardcode an expected head. It derives it at runtime:
  ```ts
  const expectedHead = MIGRATIONS[MIGRATIONS.length - 1]?.id ?? null;  // runner.ts:1533
  ```
  It then logs `[Migrations] Schema at head: <lastAppliedId>` only when the DB's
  most-recently-applied id equals that self-derived head (`runner.ts:1526–1538`).
- **Conclusion:** runner.ts is self-consistent and self-describing. Its head is
  whatever sits last in the array → **`2026-06-18_ws0_knowledge_registry`**.

The seven migrations appended *after* the value the verify script expects:

| # | Migration id | runner.ts line |
|---|--------------|----------------|
| 1 | `2026-06-11_add_meal_uplift_applications` | 1104 |
| 2 | `2026-06-14_add_hybrid_meal_occasion` | 1137 |
| 3 | `2026-06-14_add_shell_nutrition_opportunities` | 1213 |
| 4 | `2026-06-15_enrich_six_pre_existing_shells` | 1232 |
| 5 | `2026-06-15_backfill_meals_from_templates` | 1343 |
| 6 | `2026-06-18_ws0_knowledge_registry` | 1369 |

(The verify script's expected value `2026-05-23_add_pantry_need_quantity` is the
second 05-23 entry; everything from 06-11 onward post-dates it.)

### 2. `scripts/verify-prod.ts` — production verification script

- **Expected head (hardcoded):** `2026-05-23_add_pantry_need_quantity`
  (`verify-prod.ts:44`).
- **How it validates production:** connects to the prod Neon DB via `DATABASE_URL`,
  reads the latest applied migration:
  ```sql
  SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1
  ```
  and compares it `=== expectedHead`. Mismatch → `FAIL "Schema at head"`
  (`verify-prod.ts:40–49`). It then runs 12 further structural/data checks
  (tables, columns, null-state, household integrity).
- **Status:** the hardcoded `expectedHead` is **STALE** — 6 migrations behind the
  runner's actual head. Against a correctly-migrated production DB (which would be
  at `2026-06-18_ws0_knowledge_registry`), check #1 would report **FAIL** with
  `Expected "2026-05-23_add_pantry_need_quantity", got "2026-06-18_ws0_knowledge_registry"`,
  causing the whole script to exit 1 — a **false-negative** release block.

### 3. `RELEASE.md` — release process / instructions

- Two hardcoded references to the expected head, both **STALE**:
  - `RELEASE.md:200` — Step 3 sample log line:
    `[Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state`
  - `RELEASE.md:283–285` — "Inspecting prod migration state", *Expected head (as of
    2026-04-19):* `2026-04-19_backfill_shopping_list_null_resolution_state`
- These are documentation/illustrative values pinned to 2026-04-19 and never updated
  as migrations were appended. (Line 268's reference to
  `2026-04-19_backfill_planner_weeks_household_id_final` is a failure-mode note about a
  *specific* migration, not a head declaration — not in scope.)

### 4. `docs/release-notes.md` — release rules / references

- Migration verification reference at `docs/release-notes.md:91–92`:
  > confirm `[Migrations] Schema at head: <latest>`
- Uses the placeholder `<latest>` — **no hardcoded migration id**. It defers to
  whatever the runner prints. Therefore it is **not inconsistent** and requires
  **no change**. This is the correct pattern.

---

## Cross-component comparison

| Component | Migration head referenced | Source-of-truth? | State |
|-----------|---------------------------|------------------|-------|
| `runner.ts` | `2026-06-18_ws0_knowledge_registry` (self-derived from array tail) | **YES — owner** | Current |
| `verify-prod.ts` | `2026-05-23_add_pantry_need_quantity` | No (consumer) | **STALE — 6 behind** |
| `RELEASE.md` | `2026-04-19_backfill_shopping_list_null_resolution_state` | No (docs) | **STALE — far behind** |
| `release-notes.md` | `<latest>` (placeholder) | No (docs) | OK — defers to runner |

---

## Authoritative source

**`server/migrations/runner.ts` is the authoritative source.** It is the single
migration owner: it executes the migrations, records them in `schema_migrations`,
and derives the expected head directly from the tail of its own ordered array. The
production DB head is, by construction, whatever runner.ts last applied. Every other
component is a *consumer* that must mirror runner.ts — never the reverse.

→ **Authoritative migration head: `2026-06-18_ws0_knowledge_registry`**

---

## Architecture compliance

| Requirement | Result | Evidence |
|-------------|--------|----------|
| One migration owner | ✅ PASS | `runner.ts` `MIGRATIONS[]` is the only ordered migration list; runs at startup (RELEASE.md:195, release-notes.md). |
| One canonical migration history | ✅ PASS | Single append-only array; `schema_migrations` table tracks applied ids exactly once (`runner.ts:1464–1498`). |
| No duplicate migration systems introduced | ✅ PASS | verify-prod.ts only *reads* `schema_migrations`; it does not define or apply migrations. No second runner found. |
| No fabricated migration state | ✅ PASS | This investigation made **no** code/data/migration changes. No ids invented; all ids quoted verbatim from `runner.ts`. |
| Extend existing architecture only | ✅ PASS | Recommended correction is a value sync inside the existing consumer files — no new mechanism. |

The inconsistency is a **stale hardcoded constant**, not a structural/architecture
defect. The owner and the canonical history are sound.

---

## Recommended minimum correction

Not applied (investigation is read-only; "do not make changes unless absolutely
required"). The minimum correction to make the chain consistent is:

1. **`scripts/verify-prod.ts:44`** — *required for a correct release gate.*
   Change `expectedHead` from `"2026-05-23_add_pantry_need_quantity"` to
   `"2026-06-18_ws0_knowledge_registry"`. Without this, verify-prod.ts will FAIL
   against a correctly-migrated prod DB (false block).

   *(Optional durability improvement, not required: import the runner's
   `MIGRATIONS` and derive `expectedHead = MIGRATIONS.at(-1).id` so the constant can
   never drift again. Flagged only — not part of the minimum fix.)*

2. **`RELEASE.md:200` and `RELEASE.md:285`** (+ the "as of 2026-04-19" note on 283)
   — *documentation accuracy.* Update both to
   `2026-06-18_ws0_knowledge_registry`. Lower urgency than #1 (these are human-read
   docs, not an automated gate), but needed for full chain consistency.

3. **`docs/release-notes.md`** — no change required (uses `<latest>` placeholder).

---

## Definition of Done

```
ROOT CAUSE:
  Migrations were appended to server/migrations/runner.ts (the owner) through
  2026-06-18 without updating the hardcoded expected-head constants in the
  downstream consumers. verify-prod.ts is pinned to 2026-05-23 (6 migrations
  stale); RELEASE.md is pinned to 2026-04-19. The verification chain has drifted
  from its single source of truth.

AUTHORITATIVE MIGRATION HEAD: 2026-06-18_ws0_knowledge_registry
  (server/migrations/runner.ts — last entry in MIGRATIONS[], self-derived at runtime)

runner.ts:        2026-06-18_ws0_knowledge_registry   (authoritative, current)
verify-prod.ts:   2026-05-23_add_pantry_need_quantity  (STALE — 6 behind)
RELEASE.md:       2026-04-19_backfill_shopping_list_null_resolution_state  (STALE)
release-notes.md: <latest> placeholder — no hardcoded id (OK, defers to runner)

CONSISTENT: NO

If NO:
- exact file requiring update:
    1. scripts/verify-prod.ts  (line 44)  — REQUIRED: blocks a correct release if left stale
         "2026-05-23_add_pantry_need_quantity"  →  "2026-06-18_ws0_knowledge_registry"
    2. RELEASE.md  (lines 200 and 283–285)  — docs accuracy
         "2026-04-19_backfill_shopping_list_null_resolution_state"  →  "2026-06-18_ws0_knowledge_registry"
- exact reason:
    Six migrations (2026-06-11 → 2026-06-18) were appended to runner.ts after these
    constants were last set. A correctly-migrated prod DB now reports
    2026-06-18_ws0_knowledge_registry, so verify-prod.ts's equality check FAILs and
    the docs misstate the expected head.

FILES CHANGED:
  - docs/investigations/PRODUCTION_MIGRATION_VERIFICATION_ALIGNMENT_2026-06-28.md  (this report — new file)
  - No source, migration, schema, or production changes were made.

ROLLBACK IDENTIFIER:
  Tag: rollback/pre-migration-verify-investigation-20260628-2259
  Commit: 556747e4d30bc1589eb52f4451e0d1ee350fa218
  Branch: safety/preserve-since-last-prod-20260617-1613
  Restore: git checkout rollback/pre-migration-verify-investigation-20260628-2259

READY FOR PRODUCTION RELEASE: NO
  The verification chain is internally INCONSISTENT. verify-prod.ts is pinned to a
  stale head and will FALSE-FAIL the "Schema at head" gate against correctly-migrated
  production. Correct scripts/verify-prod.ts:44 (minimum) — and ideally the two
  RELEASE.md references — to 2026-06-18_ws0_knowledge_registry, then re-run the
  release verification before approving.
```

---

*Investigation only. No production changes. Stopping after reporting, per instructions.*
