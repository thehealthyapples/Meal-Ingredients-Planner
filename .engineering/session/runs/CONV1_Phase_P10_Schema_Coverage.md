# Session: CONV1_Phase_P10_Schema_Coverage

| Field | Value |
|---|---|
| **Session ID** | `CONV1_Phase_P10_Schema_Coverage` |
| **Rollback ID** | `rollback/CONV1-phase-p10-schema-coverage-20260717` → `a9116faa` |
| **Start time** | 2026-07-17 |
| **Current stage** | Complete |

## Objective
Implement CONV1 Phase **P10** only: `SCH-3` — 45 of 91 declared tables have no reviewed migration.
Improve coverage through **reviewed, additive migrations only**. **Do not alter runtime behaviour.
Do not change canonical ownership. No offered anchor. No post-CONV1 work. No unrelated refactoring.**

## BASELINE (measured, 2026-07-17)
```
Declared in shared/schema.ts .................. 91 tables
Created by a reviewed migration .............. 46 tables
NOT created by any reviewed migration ........ 45 tables
Table-level coverage (UPPER BOUND) ........... 51%
```
All 45 exist in the live database (verified) — they were created by `drizzle-kit push` from
`shared/schema.ts` and have **no reviewed provenance**. *"The schema cannot rebuild itself."*

## THE TRAP THIS PHASE MUST NOT FALL INTO
**The gate is a text grep** (`scripts/ci/verify-schema-migration-coverage.ts`): it counts
`CREATE TABLE [IF NOT EXISTS] <name>` occurrences in `runner.ts`. **45 hand-written strings would
report 100% and prove nothing** — and the gate's own docblock forbids exactly that: *"This script
measures that gap and prints it. It does NOT fix it, and **it does not pretend it is absent**."*

**A wrong `CREATE TABLE` is worse than no `CREATE TABLE`:**
- On an existing database `IF NOT EXISTS` makes it a **no-op** — so a wrong statement is invisible
  and the gate turns green anyway.
- On a **fresh** database (CI, disaster recovery) it builds the WRONG schema.
- **`SEC-3` is this defect at one column** — *"two identical declarations, two different physical
  types"* — so the hazard is named, precedented, and live.

**→ The DDL must come from the database's REAL shape (`information_schema`), never from my reading
of `schema.ts`; and the rebuild must be PROVEN, not asserted** (§ verification below).

## Plan
1. **Introspect** the live shape of all 45 tables — columns, types, nullability, defaults, PKs,
   uniques, indexes, FKs. (Live is what `push` actually created, and what production was built by.)
2. **Emit** `CREATE TABLE IF NOT EXISTS` DDL in dependency (topological) order, appended to
   `server/migrations/runner.ts` — the ONE sanctioned path (`migrations/*.sql` is not the migration
   system; `MIGRATIONS.md` / `migrations/README.md`).
3. **PROVE THE REBUILD**: build every table into a scratch Postgres schema from `runner.ts` alone
   and diff `information_schema` against `public`, column by column. **That is the only honest
   evidence that coverage is real rather than grepped.**
4. Report any **declaration-vs-physical drift** found on the way (`SEC-3`'s class) — as a finding,
   not a fix.

## Scope refusals (decisions, not omissions)
- **Additive only.** `CREATE TABLE IF NOT EXISTS` and nothing else. **No DROP, no ALTER, no retype,
  no data touched** — `R7`: *"the scaffolding is deleted first, because it looks like obvious debt."*
- **No runtime behaviour change.** On every existing database every statement is a **no-op**.
- **No ownership change.** P10 gives a table *provenance*, never a new owner (Register Rule 7).
- **No offered anchor** (a product decision), **no post-CONV1 work**, **no column-level repair**
  (the gate is table-level; column drift is recorded, not fixed).

## Checkpoints
- [x] Bootstrap read (README · CONV1 P9 report · CONV1 programme `SCH-3` row · the gate's source)
- [x] Rollback protection created and reported
- [x] Baseline measured (51%); all 45 confirmed present live
- [x] Introspected all 45 from `information_schema` (never from the declaration — `SEC-3`'s lesson); 78 statements
- [x] ONE **schema baseline** migration — placed at the **HEAD**, not appended, because appending cannot work (see below); the runner's append-only rule **amended by governed exception**
- [x] **Proven TWICE**: (1) builds from nothing — **93/93 migrations · 91/91 tables**, 45/45 column-identical, on a **pinned** connection; (2) **byte-identical no-op** on the live DB (983 → 983 columns)
- [x] Coverage **51% → 100%** (`--strict` exits 0); **platform reds 6 → 5** (CPI1 § 4.1 green for the first time); typecheck 32 identical; adoption 80·0·2; REL3 39/39; report filed

**Last checkpoint:** COMPLETE. **The grep-trap was real and I walked into it**: the same 78 statements APPENDED → gate 100% but rebuild **17/93 · 65/91**; AT THE HEAD → **93/93 · 91/91**. Three of my own defects caught by measuring (§ 5 of the report), incl. **running the full migration list against the live DB by accident** (pooled `SET search_path`) — schema verified intact.

## Next action
None — complete. **CONV1's engineering programme is finished**: every scheduled phase (P0–P10) is
closed. What remains is `OWN-2` + `SEC-5`→`BEH-2` **behind the legal gate**, and a cheap unclaimed
remainder (none of it a fabrication).

**The one thing that matters now is not engineering.** 192 of 195 households are unanchored and
always will be (`HT7`), so CONV1's household-visible value is close to zero until someone asks them
**"Is this week beginning Monday 20 July?"** — the offered anchor (TIME1 § 6.2). No schema, no
migration, no legal review. A product decision, and CONV1 was never entitled to take it.

## Blockers
None.

## Notes
- A concurrent session's work (`north3-home` captures, `.north3-probe.ts`) is in the tree, committed
  at `a9116faa` and untouched. **P10 touches no client file.**
- `.north3-probe.ts` at the repo root is that session's stray and will show in
  `repo-structure-verify.sh`. **Not P10's.**

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
