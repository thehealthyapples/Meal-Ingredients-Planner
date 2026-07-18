# CONV1 Phase P10 — The long game: the schema can rebuild itself

**Workstream:** `CONV1_Phase_P10_Schema_Coverage`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p10-schema-coverage-20260717` → `a9116faa`
**Status:** ✅ **COMPLETE** — the single workstream (`SCH-3`) closed.
**Coverage 51% → 100%. `verify:publication`'s *"Every declared table is created by a reviewed migration"* is GREEN for the first time — platform reds 6 → 5.**

> **Scope.** CONV1 Phase **P10** only. **Additive migrations only; no runtime behaviour changed; no
> canonical ownership moved; no offered anchor; no post-CONV1 work; no unrelated refactoring.**
> Implementation report — it creates no rule, and where it and any governing document disagree,
> **this document is the defect.**

---

## 0. THE HEADLINE

**The coverage gate is a text grep, and this phase's real finding is that it can be satisfied by a
lie.**

45 of 91 declared tables had no reviewed migration — `users`, `meals`, `planner_weeks`,
`planner_entries`, `shopping_list`, `user_preferences` among them. They existed only because
somebody once ran `drizzle-kit push`. **The schema could not rebuild itself.** CPI1 called it
*"arguably the deepest structural defect in the platform"*, and it survived three years for one
reason: **it has no user impact at all.** You notice it exactly once, on the worst day.

**Writing 45 `CREATE TABLE IF NOT EXISTS` statements takes the gate to 100% and proves nothing.**
So P10 proved the thing the gate cannot see — and the proof caught P10's own first draft:

```
baseline APPENDED at the end : 17/93 migrations apply · 65/91 tables built   ← gate still says 100%
baseline AT THE HEAD         : 93/93 migrations apply · 91/91 tables built
```

**The same 78 statements. Only the position differs.** Appending — which is what the runner's
append-only rule *requires* — leaves the schema unbuildable while turning the gate green. That is
the exact failure the gate exists to detect, and P10 walked into it before measuring its way out
(§ 3).

**The DDL was introspected from the database's real shape, never transcribed from the
declaration.** `SEC-3` is that distinction at one column — *"two identical declarations, two
different physical types"* — and a wrong `CREATE TABLE` here would be **invisible**: `IF NOT EXISTS`
swallows it on every existing database while building a wrong schema on a fresh one.

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`SCH-3`** — 45 of 91 declared tables have no reviewed migration | ✅ **CLOSED** | One **schema baseline** migration (`2026-07-17_conv1_p10_schema_coverage`) — **78 statements: 45 `CREATE TABLE IF NOT EXISTS` + 22 guarded constraints + 11 guarded indexes** — introspected from the live database's real shape, placed at the **head** of the list (§ 4), and **proven twice** (§ 2). Coverage **51% → 100%**; `--strict` exits 0; no orphans |

**No table gained an owner.** A baseline gives a table *provenance*, never a new owner — Register
Rule 7 is not triggered, and Domain assignments are untouched.

---

## 2. IT WAS PROVEN TWICE, BECAUSE ONCE WAS NOT ENOUGH (CP10)

**Two different properties. Proving one does not prove the other, and P10's first draft passed the
first and failed the second at boot.**

### Proof 1 — it builds from nothing

Every statement executed into an **empty Postgres schema**, on **one pinned connection**, read
**straight out of `runner.ts`** (not from the generator — so what is proven is what ships):

```
93/93 migrations apply cleanly · 91/91 declared tables built
column-by-column diff of the 45 vs live: 45/45 IDENTICAL
```

### Proof 2 — it is a no-op on a database that already has everything

Applied at boot against the live database, with the full column census compared before and after:

```
columns before : 983      columns after : 983
✓ BYTE-IDENTICAL — not one table, column, type, nullability or default changed
```

**On every database that exists today, all 78 statements are no-ops.** That is the mission's *"do
not alter runtime behaviour"*, measured rather than asserted.

### 2.1 The measure

| Signal | Baseline (measured at `a9116faa`) | **After P10** | Δ |
|---|---|---|---|
| **`verify:schema-coverage`** | **91 declared · 46 covered · 45 uncovered · 51%** | **91 declared · 91 covered · 0 uncovered · 100%** | **★ the phase gate, met.** `--strict` exits 0 |
| **Can the migrations build the schema from empty?** | **NO** — never tested; 26 tables unbuildable | **YES — 93/93 migrations · 91/91 tables**, on a pinned connection | **the question `SCH-3` actually asks** |
| `verify:publication` — platform | 23 domains: 🟢7 · 🟡12 · 🔴4; **77 checks: 51 pass · 20 warn · 6 fail** | **77 checks: 52 pass · 20 warn · 5 fail** | **★ reds 6 → 5.** *"Every declared table is created by a reviewed migration (CPI1 § 4.1)"* — **green for the first time since it was built** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt) | **32 — identical set**, diffed line by line | **0 added** |
| `adoption:check` | 79 pass · 0 notices · 2 fails | **80 · 0 · 2 — the same two** | **0 added.** P10 touches no client file |
| `npm run build` | passes | **passes** | — |
| **Live schema** | 983 columns · 94 tables | **983 columns · 94 tables** | **nothing changed** |
| `test:rel3-production-verification` | — | **39/39** | — |
| `repo-structure-verify.sh` | FAIL (pre-existing) | **FAIL — the same three categories** | 0 added |

---

## 3. THE FINDING: THE GATE CAN BE SATISFIED BY A LIE, AND ALMOST WAS

`scripts/ci/verify-schema-migration-coverage.ts` greps `runner.ts` for
`CREATE TABLE [IF NOT EXISTS] <name>`. Its own docblock is explicit: *"This script measures that gap
and prints it. It does NOT fix it, **and it does not pretend it is absent**."*

**P10's first draft appended the baseline, as the append-only rule requires. The gate reported
100%.** The rebuild test reported the truth:

```
17/93 migrations apply · 65/91 tables built
✗ 2026-02-27_add_user_diet_fields: relation "users" does not exist
```

**Why appending can never work.** The list's **second** entry does `ALTER TABLE users …`, and
`users` is created by the baseline. Appending puts the CREATEs *after* the 76 migrations that alter
them. **These tables predate migration #1** — chronologically, their CREATEs belong at the head, and
no amount of appending can put them there. **`SCH-3` is therefore not closable by appending**, which
is why it sat at 51% while every other convergence in this programme shipped.

> **The number was one edit away from being permanently meaningless.** A gate that reads 100% while
> a rebuild fails 65/91 is worse than one that reads 51% honestly — `R2`'s twin: *a permanently-red
> gate is indistinguishable from no gate; a falsely-green one is indistinguishable from success.*

### 3.1 Two more defects the measuring caught

1. **Unguarded `ADD CONSTRAINT` — it would have broken every existing deployment's boot.** Postgres
   has no `ADD CONSTRAINT … IF NOT EXISTS`. The empty schema accepted the bare statements; the live
   database rejected them (*"constraint … already exists"*) and **the boot aborted**. The runner's
   transaction rolled the whole thing back — failing closed, exactly as designed — and the column
   census confirmed the database was untouched. Each constraint is now wrapped in a `pg_constraint`
   existence check. **A scratch-schema test can only ever demonstrate "builds from nothing"; it is
   silent on "does nothing to a full one".**
2. **My own comment corrupted the gate's reading.** The gate greps the **whole file, comments
   included**, and its optional existence-check group needs trailing whitespace — so writing the
   phrase in prose immediately followed by a backtick made it capture the word **`IF`** and report a
   phantom orphan table. Reworded, and the hazard recorded in the file for whoever edits those
   comments next: **prose in `runner.ts` is read by the gate as if it were DDL.**

---

## 4. THE GOVERNED EXCEPTION — the append-only rule, amended by the change that made it false (CP4)

`runner.ts`'s header said: *"Add a new entry to the MIGRATIONS array below (**append to the END**)"*
and *"IMPORTANT: Never remove or reorder entries. Only append new ones at the end."*

**Obeying it literally makes `SCH-3` unachievable** (§ 3). So P10 amends it, rather than quietly
breaking it — the same act P8 performed on TIME3 § 13.1, for the same reason: **the phase that makes
a rule false is the phase that must amend it.**

**The amendment, stated narrowly:** entry `[0]` is the **schema baseline** and is the **sole**
permitted exception. There is exactly one, it is already there, and everything else appends to the
end. A second entry at the head would be reordering, which is what the rule forbids.

**Why the rule's purpose survives.** The rule protects **applied history**: never remove an entry,
never reorder entries relative to one another, never edit one that shipped. **The baseline does none
of those** — it removes nothing, edits nothing, and changes no existing entry's relative order. And
position is irrelevant to a database that already exists: `runMigrations()` keys on **IDs** and
applies only what is pending, so the baseline arrives as a no-op wherever it sits.

### 4.1 The one cost, named rather than discovered later

A database that adopts the baseline **after the fact** — i.e. every database that exists today — has
the baseline as its chronologically-newest row, while `expectedMigrationHead()` returns the list's
**last** entry. So `runMigrations()` logs **one cosmetic parity WARNING** on the next boot:

```
[Migrations] Schema head mismatch — DB at "…conv1_p10_schema_coverage", expected "…conv1_p7_planner_week_anchor"
```

**It is a `console.warn`, not a gate.** The boot completes and the server serves (verified). It is
**invisible to a fresh database** (which applies in list order, baseline first, so the last entry
applied *is* the last entry). It **self-resolves** the moment any further migration is appended. And
**`scripts/verify-prod.ts` is unaffected**: `compareMigrationState` is *set-based on purpose* — it
asks *"is anything missing, anywhere"*, never *"is the newest row this literal"*, which is precisely
the inferior check its own docblock says it replaced. **`test:rel3-production-verification` passes
39/39.** The consequence is recorded on `expectedMigrationHead()` itself, where the next reader will
meet it.

---

## 5. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Four, all caught before they landed. The third is the serious one.

1. **The appended baseline** (§ 3) — would have made the gate permanently meaningless.
2. **Unguarded `ADD CONSTRAINT`** (§ 3.1) — would have broken every existing deployment's boot.
3. **★ I ran the full migration list against the live database by accident.** My rebuild harness did
   `db.execute("SET search_path TO …")` — but **`db.execute` takes a connection from the pool per
   call**, so the search_path did not survive between statements and the migrations fell through to
   `public`. The result was self-contradictory (*"89/93 applied · 0/91 tables built"*), which is what
   exposed it. **The live schema was verified intact immediately** — 983 columns, byte-identical —
   because every statement that reached `public` was idempotent by this file's own convention. **I
   was lucky, and the convention saved me.** Every subsequent proof runs on **one pinned client**
   (`pool.connect()`), with `public` off the search_path so nothing can silently fall through again.
4. **My own prose corrupted the gate** (§ 3.1).

---

## 6. WHAT WAS REFUSED

- **Any non-additive change.** No `DROP`, no `ALTER` of an existing column, no retype, no data
  touched — `R7`: *"the scaffolding is deleted first, because it looks like obvious debt."*
- **Trusting the declaration.** The DDL is introspected from the live shape; `SEC-3` is what
  transcription costs.
- **Column-level repair.** The gate is **table-level and says so** — *"Columns added declaratively
  without a migration are NOT detected, so true coverage is no better than the figure above."* P10
  closes the **table** gap. **See § 8: the full-rebuild proof now measures the column gap too, and
  it is clean — but the gate still cannot see it, and that is recorded, not fixed.**
- **The offered anchor** — a product decision, and CONV1's true bottleneck (§ 9).
- **Post-CONV1 work**, `user_streaks`' sixth private week, and the unclaimed remainder.
- **Editing `expectedMigrationHead()` or `verify-prod.ts`** to accommodate the baseline. Changing a
  verifier to suit the change it audits is not verification. The consequence is documented instead
  (§ 4.1).

---

## 7. GOVERNING DOCUMENTS — one amendment, one correction (CP4; Register Rule 7 not triggered)

- **`server/migrations/runner.ts` — AMENDED** (§ 4): the append-only rule gains its one baseline
  exception, stated narrowly, with the measured reason. `expectedMigrationHead()`'s docblock — which
  leaned on *"the list is append-only"* — is corrected, with § 4.1's parity consequence recorded
  where its next reader will meet it.
- **`docs/architecture/README.md`** — the mandatory Bootstrap now records `SCH-3` closed, the 51% →
  100%, the red that turned green, and the grep-trap finding.
- **The Source of Truth Register** makes **no** coverage claim (verified) — so there was nothing to
  correct, and nothing was invented to have something to say.

**Not amended:** the Household Time Architecture is **byte-untouched** — P10 touches no clock, no
date and no owner. The Experience canon is untouched. **No ownership moved.**

---

## 8. THE HONEST LIMIT OF "100%"

**The gate's number is a table-level UPPER BOUND, and it still is.** It counts `CREATE TABLE`
occurrences; it cannot see a column added declaratively to an already-covered table, and it says so
in its own closing line.

**What P10 can say beyond it, because it measured:** the full rebuild built **91/91 declared tables
from `runner.ts` alone**, and the 45 baselined tables were diffed against live **column by column —
45/45 identical**. So for those 45, column coverage is not an upper bound; it is verified.

**What P10 cannot say:** the other **46** tables' columns were never diffed against a rebuild — the
rebuild produced all 91 tables, but P10 only column-diffed the 45 it authored. **The residual
column-level gap is unmeasured**, exactly as it was before, and `runner.ts` already contains
migrations that exist to repair precisely that (`2026-03-13_pantry_columns_fix` — *"Add columns that
were added to the Drizzle schema without a migration"*). **Recorded as the honest remainder, not
closed by assertion.**

---

## 9. THE REMAINING CONV1 BACKLOG, AND THE COMPLETION ASSESSMENT

**Closed:** P0 · P1 · P2 · P3 · P4 · P5 · P6 · P7 · P8 · P9 · **P10 (`SCH-3`)**.

| Phase | Contains | Status |
|---|---|---|
| **P—** | **`OWN-2`** · `SEC-5` → a birth date → `BEH-2` | **behind the legal gate.** Not an engineering decision |
| **Unclaimed remainder** | `seasonOfLocalDate()` ×7 · `product_history.scannedAt` · `user_health_trends.date` · `dayOfYear` · `user_streaks.weekStartDate` · the remaining week-shapes · the residual column-level schema gap (§ 8) | open — needs no anchor; cheap; **none is a fabrication** |
| **Not a CONV1 item** | **The offered anchor** (TIME1 § 6.2) | **open — a product decision, and the bottleneck for the whole programme's value** |

### 9.1 CONV1 completion assessment

> **Every engineering phase CONV1 scheduled is closed. The programme is complete as an engineering
> programme, and its value is now gated on one product decision it was never entitled to take.**

**What CONV1 actually did.** It began with a census of 24 divergences and a claim that THA *"does
not lack time — it already tells households the time in six places, with six private definitions,
owned by nobody, and at least three of them are wrong."* It ends with **one owner of household
time**, both its facts built, **five rival "current weeks" collapsed to one**, **every fabricated
date deleted**, and **a schema that can rebuild itself**. Seventeen ratchets guard the time family
alone, **every one mutation-tested**; platform reds are **6 → 5** and CPI1 § 4.1 is green for the
first time.

**What it refused, and why that is the achievement.** Three phases in a row declined to take a
decision that was not theirs: P7 refused to back-fill the anchor (`HT7`), P8 and P9 refused to pick a
fallback week, and P8 **moved `OWN-2` behind the legal gate** on the evidence rather than deriving
children's data an engineer had no authority to invent. **CONV1 corrected four of its own grades**
(`BEH-6` latent not live · `BEH-9` a convergence not a build · `OWN-2` gated not free · `BEH-5`'s
mechanism) — a programme that never revises itself is not measuring.

**The honest close, and it must not be buried.** **192 of 195 households are unanchored and always
will be.** For them, `resolvePlannerWeek` answers *"I don't know"*, Home says so, and Stories is
silent. **That is the programme working exactly as designed** — every one of those surfaces used to
answer confidently and wrongly. But it means **the household-visible value of CONV1 is currently
close to zero**, and it is not blocked by engineering. It is blocked by one question nobody has
asked a household: ***"Is this week beginning Monday 20 July?"***

> **CONV1 made THA truthful. It cannot make THA useful — that needs a product decision, and it needs
> exactly one.** Everything else on the remaining list is cheap, honest, and can wait.

---

*Rollback: `rollback/CONV1-phase-p10-schema-coverage-20260717` → `a9116faa`. The preservation commit
captured every previously-uncommitted change before any P10 file was touched — **including CONV1
P9's completed deliverables**, which were still uncommitted.*

> ⚠️ **A concurrent session's work is in this tree** (the `north3-home` capture harness, its
> screenshots, and `.north3-probe.ts` at the repo root — that session's stray, which is why
> `repo-structure-verify.sh` reports *"root contains only permitted files"*). All of it is committed
> at `a9116faa` and untouched. **P10 touches no client file.**

*⚠️ **The migration is applied** to the dev database — as a **byte-identical no-op** (§ 2, Proof 2).
Reverting P10's code reverts the phase completely: the baseline created nothing, so there is nothing
to un-create. The only database residue is one row in `schema_migrations`, which a code revert makes
an unknown id — visible to `verify-prod.ts` as `unknown`, and removable with
`DELETE FROM schema_migrations WHERE id = '2026-07-17_conv1_p10_schema_coverage'`.*
