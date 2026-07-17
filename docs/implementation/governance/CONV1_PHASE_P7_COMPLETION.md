# CONV1 Phase P7 — Household Time: the anchor

**Workstream:** `CONV1_Phase_P7_Planner_Week_Anchor`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p7-planner-week-anchor-20260717` → `8fcb3d72`
**Status:** ✅ **COMPLETE** — the single workstream (`SCH-2`) closed.
**Both of Household Time's two facts now exist. The declaration is fully discharged, and `household-time` is 🟢 healthy at 12/12 checks.**

> **Scope.** CONV1 Phase **P7** only: `SCH-2` — `planner_weeks.weekStartDate`. No P8+ work, no
> consumer converged, no unrelated refactoring. Implementation report — it creates no rule, and
> where it and any governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**The planner has a calendar for the first time, and it earned it by refusing to invent one.**
`planner_weeks` held `id`, `userId`, `householdId`, `weekNumber`, `weekName` — *"no date, no
timestamp, not even a `createdAt`"*. In a schema with 99 `timestamptz` columns, the planner's
datelessness was a design. It is now a nullable `text` column, written in one place, and **1,152
of the 1,164 rows in the table are still `NULL` — measured, after the migration ran.**

**The whole phase is one line of SQL and one refusal, and the refusal is the expensive part.**
Adding the column is `ALTER TABLE … ADD COLUMN IF NOT EXISTS week_start_date text`. The work was
making it impossible for the next person to "fix" the 1,152 `NULL`s — because that UPDATE is a
one-liner, it looks like housekeeping, and it would be the most damaging change available to this
schema. **`HT7` is asserted in the migration's own comment (CONV1's named mitigation for `R5`),
and three ratchets now fail if anyone writes it anyway.**

**The anchor is an observation of the present, not a reconstruction of the past.** It is written
**only** at `storage.createPlannerWeeks` — the Planner's existing single write funnel, no new
writer — as `mondayOf(householdToday(now, zone)) + 7 × (N − 1)`. That arithmetic is legitimate
*there and nowhere else*, because there the six slots are **being made consecutive, now, in one
statement** (TIME1 § 6.2). Applied to an existing rota it would be the household epoch TIME1 § 6.1
**rejected** — and § 6 of this phase's suite proves why: a household who skipped a fortnight
resolves correctly to slot 3 under the per-week design, while an epoch computes **slot 5**, and
would be confidently wrong.

**`existing.length > 0 → return existing` is not an optimisation. It is the no-back-fill
guarantee**, and it was verified live: an existing household called the funnel again and got six
`NULL`s back, untouched.

**And P7 has built a fact that nothing reads.** That is not a criticism of the phase; it is the
phase's honest end state, and it is **exactly the shape `R3` names** — the shape P5 created with
a module nobody imported and P6 closed. **Today the anchor is to P8 what the module was to P6.**

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`SCH-2`** — `planner_weeks.weekStartDate` does not exist | ✅ **CLOSED** | **The column** (`shared/schema.ts`) — nullable `text`, with `HT7` stated at the point of definition. **The migration** (`2026-07-17_conv1_p7_planner_week_anchor`) — additive, **no `DEFAULT`, no `UPDATE`, no row rewritten**, and the no-back-fill assertion in its own comment (CONV1 `R5`'s named mitigation). **The writer** (`storage.createPlannerWeeks`) — the existing single funnel stamps `mondayOf(householdToday(now, zone)) + 7 × (N − 1)`, asking the **owner** for the Monday rather than hand-rolling one (`HT1`/`HT11`). **Three ratchets**, all mutation-tested (§ 4) |

### 1.1 What P7 deliberately did not add

**No new writer, no new domain, no new store, no key space change.** `weekNumber` stays a slot
label bounded 1–6; the unique constraint, the eager six-slot creation, `weekName` and the Planner
API are untouched (`HT8`; `R9`). **The Planner is not redesigned, which is what TIME1 § 6.1
rejected design (b) to protect.**

The type is `text`, not `date`: a civil date carries no zone, and `text` is the type the civil-date
vocabulary in `shared/time/household-time.ts` already speaks. Changing column *types* is `SCH-3`
(P10) and needs a migration this phase did not take.

---

## 2. THE MEASURE — re-run for this phase, never inherited (CP11)

Every "before" below was **measured at the rollback tag in a throwaway worktree during this
session**, not quoted from P6's report.

| Signal | Baseline (measured at `8fcb3d72`) | **After P7** | Δ |
|---|---|---|---|
| **The phase gate — the anchor exists and cannot be back-filled** | **the column does not exist**; `resolvePlannerWeek` can only ever answer `anchored:false` | **the column exists; 3 ratchets fail on a back-fill** | **★ the phase gate, met** |
| `verify:publication` — `household-time` | 🟢 healthy, **9/9** | **🟢 healthy, 12/12** — three ratchets added, **all mutation-tested** | **+3 checks, all able to fail** |
| `verify:publication` — platform | 23 domains: 🟢7 · 🟡12 · 🔴4; **69 checks: 43 pass · 20 warn · 6 fail** | **23 domains: 🟢7 · 🟡12 · 🔴4; 72 checks: 46 pass · 20 warn · 6 fail** | **+3 checks, all passing; reds unchanged at 4** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt) | **32 — identical set, diffed line by line against the tag** | **0 added by P7** |
| `adoption:check` | 2 pre-existing fails · 0 notices · 76 pass | **2 pre-existing fails · 0 notices · 76 pass** | **0 added** — P7 touches no client-side building block |
| `npm run build` | passes | **passes** | — |
| **Live data census** | `planner_weeks`: **1,152 rows**, column **absent** | **1,164 rows — 1,152 `NULL` (the originals, untouched) + 12 anchored** (2 verification households × 6 slots) | **no row rewritten; nothing back-filled** |
| Affected suites | — | **11 suites run · 0 failures** (§ 6) | — |
| `repo-structure-verify.sh` | **FAIL** (pre-existing) | **FAIL — the same three categories** | 0 added |

**The repo-structure FAIL is pre-existing and every cause is named**: `.glibcheck.txt` and
`.libdirs_uxhome.txt` at root; `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` and
`docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md` (`DEV1`'s); and
`docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md` **plus
`docs/implementation/NORTH1_HOME_IMPLEMENTATION.md`** — both **concurrent sessions'**, and the
NORTH1 file appeared *during* this phase. **This report is filed under
`docs/implementation/governance/`** — by workstream, so it adds nothing to that gate.

### 2.1 ⚠️ P7 IS NOT CODE-ONLY — the migration is applied

**This is the difference between P7's rollback and P6's, and it is the same difference P5 had.**
A `git checkout` of the tag reverts the code and **does not drop the column**. To revert the
schema as well:

```sql
ALTER TABLE planner_weeks DROP COLUMN week_start_date;
```

**Nothing is lost by that DROP that was not created by this phase.** 1,152 rows hold `NULL`; the
12 anchored rows belong to three households this session created for verification (§ 5.3).

---

## 3. THE GOVERNANCE QUESTION P7 HAD TO ANSWER FIRST

**"What does a `weekStartDate` *mean* at creation?"** — and it is not obvious, because TIME1 § 3.1
is emphatic that `weekNumber` is *"a slot label in a fixed rota — NOT a time coordinate"* that
*"carries no ordering in calendar time"*. If the six slots are not a calendar, then stamping slot 1
with this week's Monday looks exactly like the assumption the architecture exists to retire.

**The governing documents had already settled it, and P7's job was to read rather than decide**
(TIME1 § 6.2):

> *"At creation, and **only** at creation, slot 1 **is** this week and slot 2 **is** next week —
> which is exactly what the UX has always promised. The arithmetic is legitimate **here** and
> nowhere else, because here the slots genuinely are consecutive: they are being made consecutive,
> now, in one statement."*

**So the same arithmetic is a fact in one place and a fabrication everywhere else**, and the
difference is not the formula — it is *when* you are entitled to run it. That is the whole design,
and it is why `existing.length > 0 → return existing` is load-bearing rather than incidental.

**No ownership moved. Register Rule 7 is not triggered.** Domain 14 already owned the fact;
Household Time already owned the week convention; P7 extended an existing owner with an existing
funnel, which is Principle 8's *"prefer evolution over replacement"* in its cheapest form.

---

## 4. THE GATE — MUTATION-TESTED, NOT ASSUMED (CP10)

A gate nobody proved can fail is a third failure mode. **Each ratchet was broken on purpose,
observed, and the files restored byte-exactly** (`cmp` verified) — 7 mutations, 7 caught:

| # | Mutation | Check | Result |
|---|---|---|---|
| 1 | The anchor column is removed from `planner_weeks` | `ht-anchor-is-the-planners` | 🔴 **FAIL** — *"the anchor is the second of Household Time's two facts…"* |
| 2 | **The REJECTED household-epoch design is implemented** (`households.plannerEpoch`) | `ht-anchor-is-the-planners` | 🔴 **FAIL** — *"TIME1 § 6.1 REJECTED design (a)…"* |
| 3 | **A migration back-fills the anchor** — the `R5` one-liner, verbatim | `ht-anchor-is-never-back-filled` | 🔴 **FAIL** — *"HT7 is absolute…"* |
| 4 | **The column is added `WITH A DEFAULT`** — a back-fill wearing an ALTER's clothes | `ht-anchor-is-never-back-filled` | 🔴 **FAIL** — *"that back-fills every existing row in one statement…"* |
| 5 | **The legacy-row repair path is "finished"** by also stamping the anchor | `ht-anchor-is-never-back-filled` | 🔴 **FAIL** — *"updates planner_weeks.weekStartDate after creation…"* |
| 6 | `createPlannerWeeks` hand-rolls its own Monday | `ht-anchor-is-stamped-from-the-owner` | 🔴 **FAIL** — *"the week convention is the owner's, not the planner's…"* |
| 7 | `createPlannerWeeks` stops stamping the anchor at all | `ht-anchor-is-stamped-from-the-owner` | 🔴 **FAIL** — *"a week created without one is unanchored forever…"* |
| — | All reverted | — | 🟢 **healthy, 12/12** |

**Mutations 4 and 5 are the ones worth having.** An `UPDATE` is the obvious back-fill and any
reviewer would catch it. **`ADD COLUMN … DEFAULT '2026-07-13'` back-fills all 1,152 rows in a
statement that reads like the migration P7 actually shipped** — and the legacy repair path already
does `db.update(plannerWeeks).set({ householdId })` two lines from where a `weekStartDate` would
look like completing the job. **Those are where this defect would really arrive**, and neither is
caught by reading the migration list.

**The gate is scoped to `plannerWeeks` by parsing the `.set({…})` that belongs to
`.update(plannerWeeks)`** — because `user_streaks` carries its **own** `weekStartDate` (a
different fact, and TIME1's *"sixth private notion of a week"*). A naive grep would fire on it
forever, and **a gate that fires falsely is worse than no gate** (`R2`).

---

## 5. VERIFIED AGAINST THE RUNNING APPLICATION — including what it could NOT prove

Driven live, post-migration, against a server whose serving pid was **confirmed to descend from
the process this session started** (§ 5.1).

### 5.1 The live-environment trap, caught for the FOURTH time

**Four stale servers were running pre-P7 code — including pid `15555`, the exact pid P6's report
named**, still alive 1h52m later, holding `:5199`. `:5000` was held by another.

> **This is no longer a trap; it is a property of this environment.** Four sessions in a row have
> now been lied to by a stale process. **The pre-existing servers on `:5000` and `:5199` were left
> running — they were not mine to kill.** A verified-free port (`:5417`) was chosen, the log was
> checked for **zero** `EADDRINUSE`, and the listener's ancestry was walked to the pid this session
> started before a single request was believed.

The migration applied at that server's boot, through the sanctioned path:

```
[Migrations] 1 pending migration(s) to apply
[Migrations] Applying "2026-07-17_conv1_p7_planner_week_anchor" …
[Migrations] ✓ Applied "2026-07-17_conv1_p7_planner_week_anchor"
[Migrations] Schema at head: 2026-07-17_conv1_p7_planner_week_anchor
```

### 5.2 What the live run proved

```
Real instant 2026-07-17T09:26Z · UTC's today = 2026-07-17

planner_weeks BEFORE : 1152 rows · column absent
planner_weeks AFTER  : week_start_date  text  nullable=YES  default=null     ← no default
                       1164 rows · 12 anchored · 1152 NULL

A household in Pacific/Midway (UTC-11):
  households.time_zone (raw DB) = "Pacific/Midway"
  their today                   = 2026-07-16        ← DIFFERENT from UTC's 2026-07-17
  anchors                       = 2026-07-13 · 2026-07-20 · 2026-07-27 · 2026-08-03 · 2026-08-10 · 2026-08-17
  slot 1 = mondayOf(their today)= 2026-07-13        ✓ MATCH   · 7 days apart ✓ · all Mondays ✓

A household that has never stated a zone:
  households.time_zone (raw DB) = null              ← the honest gap, never back-filled (CP8)
  anchors                       = 2026-07-13 …      ← the DECLARED default, resolved at WRITE time

Over real HTTP (login → GET /api/planner/weeks), a household in Pacific/Auckland:
  week 1: weekStartDate = '2026-07-13'   …   week 6: weekStartDate = '2026-08-17'
```

**THE NO-BACK-FILL PROOF:**

```
rows at/below the pre-P7 watermark (#2620) : 1152
  …of those, carrying an anchor            : 0     ✓ NOT ONE PRE-EXISTING ROW WAS BACK-FILLED
rows created after it                      : 12
  …of those, carrying an anchor            : 12    ✓ every NEW week is anchored at creation

An EXISTING household asks for its weeks again:
  user 42 → createPlannerWeeks() → 6 weeks · anchors = null · null · null · null · null · null
  ✓ the funnel returned them untouched — the one moment THA could know has passed, and THA does not guess
  pre-existing rows anchored after that call: 0
```

> **The last block is the phase in one exchange:** the funnel was asked for a household's weeks,
> it had the zone, it had the clock, it could trivially have computed a Monday — **and it returned
> six `NULL`s**, because those weeks were not created now.

### 5.3 What the live run could NOT prove, stated plainly (P6 § 5.1's lesson)

**At 09:26 UTC on 17 July, every time zone on earth agreed about the *week*.** Local dates spanned
Thursday 16 July (Midway, UTC-11) to Friday 17 July (Kiritimati, UTC+14) — **and both fall in the
week beginning Monday 13 July.** So the live run shows the anchor is *the household's Monday*, but
**it cannot discriminate the zone at week level, because no zone disagreed.** Reporting a Midway
household's `2026-07-13` as proof of zone-sensitivity would be P6's *"fixture that could not
fail"*, one phase later.

**The week-level frame-sensitivity is proven deterministically instead** (§ 6, suite § 2), at an
instant chosen because the zones genuinely disagree **by a whole week**:

```
2026-07-19T23:30Z — Sunday night, UTC
  London (BST, UTC+1) → already Monday 20 July → slot 1 anchors to 2026-07-20
  New York (UTC-4)    → still Sunday 19 July   → slot 1 anchors to 2026-07-13
  a UTC-stamped anchor→                          2026-07-13
                        ↑ A WHOLE WEEK EARLY for the London household — across ALL SIX of their slots
```

**That is the defect the frame avoids, and it is a week wide, not a day.** `READ-4`'s worst case
was a wrong *day*; the anchor's worst case is a wrong *week*, and it would be stamped once and
believed forever.

**Three households were created in the dev database by this verification** and are left there
(they hold the only 12 anchors in the table). Recorded rather than swept away — they are the only
anchored households that exist, and **P8 will need one**.

---

## 6. TESTS — 11 affected suites, 0 failures

| Suite | Result | Why it is affected |
|---|---|---|
| **`test-time3-p7-planner-week-anchor`** *(new)* | **51/51** | The phase's own suite |
| `test-time3-household-time` (P5's) · `test-time3-p6-consumer-convergence` (P6's) | **73/73 · 107/107** | The owner and its converged consumers must be untouched |
| `test-intelligence-planner-binding` | **31/31** | Its `PlannerWeek` fixtures gained the field (§ 7.1) |
| `test-planner-compliance` · `test-plan1-planner-intelligence` | **25/25 · 58/58** | The planner's own gates |
| `test-intelligence-notice-engine` · `test-intelligence-diary-binding` | **65/65 · 56/56** | Existing `weekStartDate: null` fixtures; the diary's planner reads |
| `test-intelligence-platform` · `test-home2-home-primary-action` · `test-intelligence-context-composition` | **33/33 · 47/47 · 166/166** | The platform paths around the planner and the frame |

Registered as `npm run test:time3-p7-planner-week-anchor` and **wired into the aggregate
`npm test`**, so it runs in `release:check` — otherwise the gate would exist and never fire.

### 6.1 The technique: a phase whose central rule is a REFUSAL

P6 could use the pre-convergence code as an oracle. **P7 has no oracle — it converges nothing** —
so the suite is built the other way round:

- **What must not change is pinned as a floor.** § 5 proves an unanchored household's answer is
  *byte-identical* to P5/P6's at today, a year ago and a year ahead: `anchored:false` /
  `no-anchor`. **P7 converges no consumer, so this is the entirety of "nothing regresses".**
- **The refusal is tested as source, not intention.** § 4 asserts over the **real** migration and
  the **real** funnel: no `UPDATE`, no `DEFAULT`, no `NOT NULL`, the early-return present, the
  repair path stamping nothing, and no other file writing the column.
- **The rejected design is executed and shown to be wrong.** § 6 computes what a household epoch
  *would* have answered for a household who skipped a fortnight (**slot 5**, against the truth of
  **slot 3**) — so TIME1 § 6.1's rejection is a demonstrated fact rather than a cited opinion.

---

## 7. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Five, all caught before they landed. Recorded because a report that only lists successes is not
evidence.

1. **Two of my own test assertions were wrong**, and were corrected against **measured** behaviour
   rather than patched to pass. I asserted that a mixed rota resolves `anchored:false` on an
   unanchored week, and that the skipped fortnight resolves `no-anchor`. **The module is right and
   subtler than I was:** it names the nearest week it can *honestly locate* (slot 3) and reports the
   true relation (`next` / `ahead`) — it never invents the unanchored slot, and it never says
   `this` when the household is not living in a planned week. The corrected assertions are stronger
   than the ones I meant to write: *every week the resolver ever names carries a real anchor.*
2. **A typecheck regression I caused, found by the gate.** The schema change made `weekStartDate`
   required on `PlannerWeek`, breaking three fixtures in `test-intelligence-planner-binding.ts`
   (32 → 33). Fixed honestly with `weekStartDate: null` — **the correct value**, since those
   fixtures stand for weeks that already existed. Then diffed **line by line against the rollback
   tag in a worktree**: back to the identical 32.
3. **A citation I invented.** My § 17 correction cited *"§ 12.2"* of the Household Time
   Architecture. **There is no § 12.2** — § 12 is a phase table with no subsections. Corrected to
   `HT7`; TIME1 § 6.2. **`verify:coherence` passed both before and after**, which is worth
   recording: it checks declared owners and `file:line` citations, and an invented *intra-document*
   § reference is not something it can see. I caught it by opening the section.
4. **My own verification script was wrong**, and the proof was re-run rather than accepted. The
   no-back-fill check used `id = ANY(${array})` and Postgres refused it (`op ANY/ALL (array)
   requires array on right side`). The census arithmetic already implied the answer
   (1164 − 12 = 1152) — **implication is not measurement**, so the proof was rewritten against a
   watermark and run again.
5. **My first two ratchet drafts used spread/`for…of` over a `ReadonlyMap` and `matchAll`**, adding
   two TS2802 errors to a gate file. Fixed with `Array.from`. Recorded because the earlier targeted
   run was green: **"I checked it once" is not a measure.**

---

## 8. WHAT WAS REFUSED

- **Any back-fill of the 1,152 existing weeks.** Not in SQL, not in code, not "just for the demo
  households". `HT7`; `R5`; Core Principle 6. **This is the phase.**
- **Converging any T5 consumer.** `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` are **P8**. The
  five rival "current weeks" still guess, and `HT11` makes a half-converged consumer worse than an
  unconverged one.
- **The offered/declared anchor for existing weeks.** TIME1 § 6.2 names it — *"Is this week
  beginning Monday 20 July?"* — as **the one legitimate route** to anchoring an existing week, and
  names it an **extension point, not designed here**. It is a product decision with a governed new
  fact behind it.
- **`user_streaks.weekStartDate`** — the *sixth* private notion of a week, on a different table,
  written from a rival Monday. It is `OWN-2`/`BEH-9` (P8). **Recorded in the domain's `knownGaps`
  and deliberately left ungated**, rather than swept into P7's ratchets where it would fire falsely
  forever (`R2`).
- **Renumbering the `dayOfWeek` key space** (`HT8`/`R9`) and **changing any column type**
  (`SCH-3`, P10).
- **`seasonOfLocalDate()` ×7 assemblers**, `product_history.scannedAt`, `user_health_trends.date`
  — the unclaimed Phase 3 remainder. Not in CONV1's P7 row; still open (P6 § 7.1).
- **Adopting the pre-existing typecheck/adoption/repo-structure debt.** None of it is P7's, and
  adopting it would make P7's own measure unreadable (the P2–P6 discipline).

---

## 9. NEW BACKLOG RAISED BY P7 (recorded, not smuggled in)

- **★ THE ANCHOR HAS ZERO CONSUMERS — `R3`'s exact shape, one phase later.** `resolvePlannerWeek`
  is still called by **no production code**. P5 built a module nobody imported and P6 closed it;
  **P7 has built a fact nobody reads.** P5's warning applies verbatim: *"a module with no consumers
  is a rival copy in waiting"*. **This is why P8 is the recommendation and why it should be next.**
- **`window-expired` is now computable and nothing surfaces it.** TIME1 § 6.3's finding — households
  living past the end of their six slots — becomes *visible* for anchored households for the first
  time. **What the Planner should DO about it is a product decision TIME1 § 15.1 deliberately left
  open**, and P7 did not decide it.
- **1,152 weeks are unanchored forever unless the household is asked.** That is correct today. Whether
  THA ever *offers* the declared anchor is the open product question above.
- **Three verification households in the dev database** hold the only 12 anchors that exist.

---

## 10. GOVERNING DOCUMENTS — corrected, not amended (CP4; Register Rule 7 not triggered)

**No ownership changed anywhere in this phase.** Only status and citation rows were corrected, each
**in the same change that made the old text false** — the `DOC-4`/`KC14` failure this repo has now
recorded three times:

- **`docs/architecture/README.md`** — the mandatory **Architecture Bootstrap** asserted *"**What is
  NOT built:** `planner_weeks.weekStartDate` (Phase 4 …)"*. Corrected: both facts are built; what is
  **not converged** is the T5 consumers, and they now have an anchor **and do not read it**.
- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** — the header status; § 17's anchor row (*"Does not exist.
  Phase 4"* → **✅ BUILT**, with the 1,152 `NULL`s named); § 17's T5 row (*"cannot do otherwise: they
  need the anchor"* → **the excuse is gone**); and **§ 14's retirement list**, where targets 1 and 5
  said *"gated on the anchor"* / *"gated absolutely on the anchor"* — **both gates are now open**, and
  a closing note states that **not one live entry on that list is blocked by a missing fact any
  more**.
- **Source of Truth Register** — Domain 14's calendar-anchor row (*"Not yet implemented"* → **✅
  BUILT**, with the funnel, the formula, the measured census and the three gates named); Appendix A's
  Household Time row (both facts built; *"every one of them gated on the anchor"* corrected to
  *"still live, and no longer gated"*; the gate's count 9 → 12).
- **`server/verification/publication-register.ts`** — three ratchets (§ 4) and the domain's
  `knownGaps` rewritten: the claim that the anchor does not exist became false today, and the
  `user_streaks` collision is now recorded there rather than rediscovered.
- **`shared/time/household-time.ts`** — the module's own header and its `PlannerWeek` doc comment
  said the column *"does NOT exist yet"*. Corrected, with the reason `NULL` is not a legacy artefact
  to be tidied away.

**Not amended:** the Experience canon is **byte-untouched**. `HT13` was not engaged — P7 aims no
words, no doors and no light; it adds a column. **The Adoption Register is untouched** and correctly
so: P7 creates no client-side building block.

---

## 11. THE REMAINING CONV1 BACKLOG

**Closed to date:** P0 (out-of-band security) · P1 (`DOC-1..4`·`OWN-5`) · P2 (`WRITE-4`·`BEH-8`) ·
P3 (`BEH-1`·`BEH-4`·`BEH-7`) · P4 (`WRITE-3`·`WRITE-2`·`OWN-1`·`READ-1`·`READ-2`·`WRITE-1`) ·
P5 (`OWN-4`·`OWN-3`·`SCH-1`) · P6 (`READ-4`·`BEH-6`·`SCH-4`·the greeting ×4) · **P7 (`SCH-2`)**.

| Phase | Contains | Status |
|---|---|---|
| **P8 — The T5 convergence** ★ | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | **open — recommended next.** Blocked by nothing. **The anchor it waited for exists** |
| **P9 — Retire the fabricator** | `BEH-5` | **open — reachable for the first time.** Its absolute gate (`SCH-2`) is open |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** |
| **Unclaimed Phase 3 remainder** | `seasonOfLocalDate()` ×7 assemblers · `product_history.scannedAt` · `user_health_trends.date` · `dayOfYear` · the benchmark seeder's offset | open — **needs no anchor**; cheap, and in no CONV1 phase row |

---

## 12. RECOMMENDED NEXT WORKSTREAM

> **P8 — The T5 convergence (`READ-3` → `OWN-6` → `BEH-3` → `OWN-2` → `BEH-9`).**

**It is the programme's own next phase, and it is the phase that gives the anchor a reason to
exist.** Everything CONV1 has built since P5 — the module, the zone, the anchor — is now in place,
and **not one household is better off yet**, because no consumer reads any of it for a week.
`READ-3` first: five rival "current weeks" (`max(weekNumber)` ≡ **the constant 6** on three server
paths, `plannerFull[0]` ≡ **1** on the dashboard, and `localStorage` ≡ **1** on Home) collapse to
`resolvePlannerWeek`.

**The risk to name at P8's start is `R3`, and P7 has just re-created it.** *"A module with no
consumers is a rival copy in waiting"* — the anchor is now a **fact** with no consumers, and the
same logic applies: an unread fact is not a source of truth, it is a column. **P5 → P6 is the
proof this closes cleanly; P7 → P8 is the same move on the same architecture.**

**And `HT11` is the rule that decides P8's shape:** *all of it, or none of it.* A consumer that
takes the anchor but keeps its own week arithmetic compares the household against two calendars at
once, and **half-converged is worse than unconverged**. `anchored:false` → the caller keeps today's
behaviour, so **nothing regresses for the 1,152 unanchored weeks** — which is exactly why the floor
was pinned in § 5 of this phase's suite before any of it was needed.

**The second-order prize is `BEH-5` (P9).** It could never precede the anchor — *"fixing a
fabricated date's timezone first makes it precisely wrong, the worst outcome available"*. That gate
is open for the first time since CONV1 was written.

---

*Rollback: `rollback/CONV1-phase-p7-planner-week-anchor-20260717` → `8fcb3d72`. **The tag is a true
restore point for everything that existed when P7 began** — the preservation commit captured every
previously-uncommitted change before any P7 file was touched, **including CONV1 P6's completed
deliverables, which were still uncommitted**.*

> ⚠️ **A concurrent session is live in this tree, and it changes what a blanket rollback means.**
> `NORTH1_Home_Implementation` (stage: Implementation) has been editing `client/`, `.replit` and the
> EXP4 capture scripts throughout this phase, and filed
> `docs/implementation/NORTH1_HOME_IMPLEMENTATION.md` during it. **None of those files is P7's and
> there is no collision** — but a `git checkout` of this tag would discard that session's in-flight
> work along with P7's. **To revert P7 alone, revert P7's own files** (§ 1 and the run file's list).

*⚠️ **The migration is applied** (§ 2.1). Reverting P7's code does **not** drop
`planner_weeks.week_start_date`. `ALTER TABLE planner_weeks DROP COLUMN week_start_date` completes
the revert and loses nothing this phase did not create: 1,152 rows hold `NULL`, and the 12 anchored
rows belong to the three households created during live verification.*
