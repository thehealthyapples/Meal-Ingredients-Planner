# DOC3 — DayOfWeek Comment Correction

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/DOC3-dayofweek-comment-correction-20260716` → `7d1dd2ce`
**Snapshots:** `routes.ts`, `household-history.ts`, `world-fixtures.ts` → session scratchpad (`*.DOC3-pre`), taken before each edit
**Scope:** Comments only. **Zero executable change — proved by hash comparison.**
**Authority:** `CONV1` § Tier 1 item `DOC-3`; § 7 phase P1.
**Report:** [`docs/implementation/governance/DOC3_DAYOFWEEK_COMMENT_CORRECTION.md`](../../../docs/implementation/governance/DOC3_DAYOFWEEK_COMMENT_CORRECTION.md)

---

## Mission

Implement CONV1 item `DOC-3` only. Correct the false `dayOfWeek` comment to the canonical
convention `0 = Sunday`. No runtime change, no renumbering, no BEH-4/BEH-5 fix, no refactoring.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + per-file snapshots)
- [x] `git status` confirmed (80 entries, dirty tree from concurrent sessions — preserved)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1` read — item `DOC-3`, plus `BEH-4`/`BEH-5` read to establish the exclusion boundary
- [x] Rule `HT8` read in `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
- [x] Convention proven from live code (5 independent confirmations) — not inherited

## What changed — 3 comment lines

| File | Correction |
|---|---|
| `server/routes.ts:11390` ★ | `0 = Monday` → `0 = Sunday … (Rule HT8)` — DOC-3's named site |
| `server/lib/household-history.ts:43` | Byte-identical duplicate — same correction |
| `server/benchmark/world-fixtures.ts:83` | `0 = Monday … 6 = Sunday` → `0 = Sunday … 6 = Saturday (Rule HT8)` |

**Left deliberately:** `server/intelligence/food-intelligence/opportunity-engine.ts:82`.

## Deviations reported, not silently applied

1. **CONV1's line citations had drifted.** `routes.ts:11371` → **`:11390`** (+19); the contradiction
   `:7431` → **`:7439-7440`** (+8). Comment located **by content**. Second consecutive item with
   rotted citations (`DOC-2` found `NK1:418` mis-cited).
2. **One site named; three corrected.** Sites 2 and 3 are the same defect, same class, comment-only
   (`DOC-1` § 3.1 precedent). Site 2 is a **verbatim duplicate on a live path**
   (`notice-gateway.ts:66` imports it).
3. **A fourth site found and deliberately NOT fixed** — `opportunity-engine.ts:82`. **The code
   implements the false belief**: `PLANNER_DAY_NAMES` is Monday-first, so `dayName(0)` returns
   "Monday" for a Sunday — **live, user-visible** mislabelling at `:226`/`:233`/`:235`. Correcting
   the comment alone would create a *new* falsehood; correcting the array is a runtime change and is
   **BEH-4**'s "backwards reader" work, excluded by the mission. **Reported for BEH-4 (P3), which
   should confirm whether it is among the four counted or a fifth.**
4. **`buildHouseholdHistory` is duplicated byte-for-byte** (`routes.ts` + `lib/household-history.ts`),
   including the `approxDate` fabricator — **`BEH-5` must be scoped to both copies** or it fixes one.
5. **Benchmark fixtures were authored against the false comment** (Bolognese intended Monday, seeds
   Sunday). Data deliberately unchanged — that would alter benchmark baselines. Flagged to the
   corpus owner.

## Verification

- Executable code **byte-identical** in all 3 files (comments stripped + hashed vs pre-edit snapshots)
- Typecheck: **304 errors with changes, 304 without** (measured by stashing) — all pre-existing, none in touched files
- Sweep: only the deliberate `opportunity-engine.ts:82` retains `0 = Monday`

## Next action

Complete. **Next CONV1 item: `DOC-4`** — the Product Knowledge status block (`docs/product/` claimed
non-existent; holds 151 files). Docs-only, no dependencies. **Verify its `:896-942` citations by
content first** — CONV1's citations have drifted on two consecutive items. Then `OWN-5` closes P1.
