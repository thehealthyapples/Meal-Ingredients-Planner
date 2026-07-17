# CONV1 Phase P6 — Household Time: the T2/T3 convergence

**Workstream:** `CONV1_Phase_P6_Household_Time_T2_T3`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p6-household-time-t2-t3-20260717` → `1648fc46`
**Status:** ✅ **COMPLETE** — all four workstreams closed in the approved sequence.
**The gate target is met: every T2/T3 consumer reads the owner, and `anchored:false` guarantees the floor. The `household-time` domain is 🟢 healthy, now 9/9 checks.**

> **Scope.** CONV1 Phase **P6** only: `READ-4` → `BEH-6` → `SCH-4` → the greeting ×4.
> No P7+ work, no unrelated refactoring. Implementation report — it creates no rule, and where it
> and any governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**P5 built an owner with zero consumers. It has consumers now.** That was the whole of `R3`, and
P5 named it in its own handover: *"a module with no consumers is a rival copy in waiting — an
owner nobody imports is exactly what `OWN-3` just spent a phase fixing."* Before today, the only
production import of `shared/time/household-time.ts` anywhere was `isKnownZone`. **Today the
Companion, the freezer, the diary and every greeting read it.**

**The Companion no longer tells the language model the wrong day.** `READ-4` was one line, and
it was the highest-leverage one in the platform: it became the literal `TODAY:` in the system
prompt *and* the diary day the Companion reads and writes. **Proven live, against a household in
Pacific/Midway: the anchor resolved to `2026-07-16` while UTC said `2026-07-17`.** The fact that
would have made it true was being fetched two lines below the line that got it wrong, and thrown
away.

**The greeting is one implementation, and the 17-vs-18 divergence is settled.** Four private
clocks — two live at boundary 17, two prototypes at 18 — became one, on the boundary the module
declares. **Behaviour is unchanged by proof, not intent:** across all 24 hours the converged
greeting is byte-identical to the frozen live oracle.

**What P6 refused to do is as load-bearing as what it did.** It converged the greeting's
**clock** and left its **voice** exactly where it found it, because INT21 § 9 already schedules
those words as `CP3` and states that *"nothing below is authorised by this document"* (§ 3).

**And one CONV1 grade did not survive contact with the evidence.** `BEH-6` is graded 🔴 *"highest
user harm in the time family… ✅ Live"*. **It is latent** — `expiryDate` has no writer anywhere
and every one of the 11 freezer rows holds `NULL`, so the *"Expired"* badge has never rendered
for any household (§ 2.1). The work was done anyway; the grade was corrected.

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`READ-4`** — the Companion's `TODAY` is UTC's today | ✅ **CLOSED** | `context-frame-assembler.ts` — the anchor is now `formatCivilDate(householdToday(now, zone))` over the **household's** zone, read from the household row the function already fetched two lines below the defect. Flows to `TODAY:` in the system prompt (`conversation-gateway.ts:1053`), to `hints.temporalAnchor` (the resolver), and to the diary day the Companion reads and writes (`pattern-intent-resolver.ts` ×3). **Ratcheted** (`ht-companion-anchor-is-the-households`, mutation-tested) |
| **`BEH-6`** — the freezer's expiry | ✅ **CLOSED** | **The write moved to the server** (`storage.addFreezerMeal`, the single write funnel — CPuBA4): `frozenDate` is no longer part of the caller's input at all (`Omit<InsertFreezerMeal, "frozenDate">`), so a client **cannot** get it wrong. Both client write sites retired. **The comparison** is civil, not cross-frame: the expiry day itself is no longer expired, and `Math.ceil` over epoch-ms is gone. **The display** parses civilly. **P6 invented no expiry** — a new fact is a governed act |
| **`SCH-4`** — civil dates as `text`, compared across frames | ✅ **CLOSED** *(the comparisons — "fix the comparison before the column type; the comparison is what harms")* | The diary's day is the household's; **`toDateStr`'s UTC funnel is retired**; **both `T12:00:00` guards are retired** (§ 14 target 8 → 0); `copyPlannerToFoodDiary`'s weekday now asks the owner and is **frame-independent by construction** — it was parsing UTC-midnight then reading `.getDay()` in server-local, so any server west of Greenwich copied the wrong weekday's meals into the diary. **No column type changed; no row rewritten; no key space renumbered** |
| **The greeting ×4** | ✅ **CLOSED** | `client/src/lib/greeting.ts` — 4 → 1 (§ 14 target 3). The **clock** converged onto `householdPhase`; the **words** are byte-identical and remain INT21's (`CP3`). The 17-vs-18 divergence settled on the declared 17. **Ratcheted** (`ht-no-rival-greeting`, mutation-tested) — the gate § 16 names by name |

### 1.1 The owner gained the vocabulary its consumers needed — rather than three consumers minting three copies of it

`formatCivilDate` · `parseCivilDate` · `civilDaysBetween` · `compareCivilDates` · `addCivilDays`.

Three converging consumers needed a civil date as a string and civil arithmetic over it. Each
hand-rolling `${y}-${pad(m)}-${pad(d)}` and `Math.ceil(ms / 86_400_000)` would have minted
exactly the rival copies this phase exists to retire (Rule 4). **TIME2 § 4.6 already placed this
fact here rather than with a consumer** — the Diary *"must NOT own … the date serialisation
format"*. The additions are pure: the module still reads no clock (HT5) and owns no season
(HT17), both re-asserted by the suite.

---

## 2. THE MEASURE — re-run for this phase, never inherited (CP11)

| Signal | Baseline (measured at `1648fc46`, this session) | **After P6** | Δ |
|---|---|---|---|
| **The phase gate — every T2/T3 consumer reads the owner** | **zero production consumers** (only `isKnownZone` was imported anywhere) | **the Companion · the freezer · the diary · all four greetings** | **★ the phase gate, met** |
| `verify:publication` — `household-time` | 🟢 healthy, **7/7** | **🟢 healthy, 9/9** — two ratchets added, both **mutation-tested** | **+2 checks, both able to fail** |
| `verify:publication` — platform | 23 domains: 🟢7 · 🟡12 · 🔴4; 67 checks: 41 pass · 20 warn · 6 fail | **23 domains: 🟢7 · 🟡12 · 🔴4; 69 checks: 43 pass · 20 warn · 6 fail** | **+2 checks, both passing; reds unchanged at 4** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt) | **32 — identical set, diffed line by line** | **0 added by P6** |
| `adoption:check` | 2 pre-existing fails · 0 notices · 71 pass | **2 pre-existing fails · 0 notices · 76 pass** | **0 added**; +5 = the new greeting concern's own checks |
| `npm run build` | passes | **passes** | — |
| **Live data census** | `freezer_meals`: 10 rows, **0 with expiry** | **11 rows, 0 with expiry** — P6's own write added one and **invented no expiry** | no row rewritten; no fact fabricated |
| Affected suites | — | **14 suites run · 0 failures** (§ 6) | — |
| `repo-structure-verify.sh` | **FAIL** (pre-existing, not P6's) | **FAIL — the identical set** | 0 added |

**The repo-structure gate's FAIL is pre-existing and every cause is named** rather than reported
as a P6 side-effect — the identical set P5 recorded: `.glibcheck.txt` + `.libdirs_uxhome.txt` at
root; `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` and
`docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md` (`DEV1`'s); and
`docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md` (a **concurrent session's**).
**This report is filed under `docs/implementation/governance/`** — by workstream, not loose.

**P6 is code-only.** No migration, no schema change, no column added or dropped, no key space
renumbered. **A `git checkout` of the tag is a complete revert** — which is the difference
between this phase's rollback and P5's.

### 2.1 The grade that did not survive the evidence (CP11)

**CONV1 grades `BEH-6` 🔴 — *"Highest user harm in the time family"*, *"✅ Live. The 'Expired'
badge flips at UTC midnight — 01:00 BST, so a UK household loses the whole final day; US
households are told food is expired while still in date."*** Verified at source and against live
data, **the evidence does not support that grade**:

- **`expiryDate` has no writer anywhere.** One schema declaration and three read sites in
  `meals-page.tsx`. `POST /api/freezer` never computed an expiry; `addFreezerMeal` spread the
  client's body verbatim; **no client has ever sent one.**
- **Live census: `freezer_meals` — 10 rows, `with_expiry: 0`.** So `isExpired` was always
  falsy and `daysUntilExpiry` always null. **The badge has never rendered, for anyone.**

TIME2 § 4.5's four stacked defects are all genuinely *in the code*, but **three of the four
require `expiryDate` to be non-null, and it never is.** What **was** live is defect 2 — the UTC
write, through which all 10 rows were authored — and the display parse.

> **The distinction matters for sequencing, which is what a programme is for.** `BEH-6` was
> ranked above `SCH-4` on the strength of daily user harm. On the evidence, its *live* harm was
> a write recording the wrong day for households west of Greenwich, and the *"Expired"* badge —
> the thing that made it sound like the sharpest defect in the backlog — is unreachable code.

**This changed the grade, not the work.** The code was a rival clock and P6 converged it. **P6
did not invent an expiry to make the defect real** — a new fact is a governed act (Register
Rules 2/8; TIME1 § 15.4), and manufacturing one to justify a grade would be the fabrication the
architecture exists to end.

### 2.2 Verified end-to-end against the running application

Driven live, not reasoned — and **against a zone that genuinely disagreed with UTC at that
instant**, because the first run could not have failed (§ 5.1):

```
Real instant 2026-07-17T08:52Z · UTC's today = 2026-07-17
Household in Pacific/Midway (UTC-11) — their day is 2026-07-16.  ← DIFFERENT: the test can fail

households.time_zone (raw DB)          = "Pacific/Midway"
temporalAnchor the Companion receives  = 2026-07-16   ← the HOUSEHOLD's day
  the old code would have said           2026-07-17   (and told the model TODAY: 2026-07-17)

A household that has never stated a zone:
households.time_zone (raw DB)          = null         ← the honest gap, never back-filled (CP8)
temporalAnchor                         = 2026-07-17   ← the DECLARED default, resolved at READ time
```

And at the write door itself, over real HTTP, with a **lying client**:

```
POST /api/demo/start {"timeZone":"Pacific/Midway"}                  → 201
GET  /api/household                          → timeZone: "Pacific/Midway"   (visible, so correctable)
POST /api/freezer {"mealId":4615, … ,"frozenDate":"2099-01-01"}     → frozenDate: "2026-07-16"
                                                                       expiryDate: null
```

> **The last line is the phase in one exchange:** a client asserted a date, and the server
> stamped the household's own day instead. `frozenDate` is no longer something a client can be
> wrong about, because it is no longer something a client is asked.

---

## 3. THE GOVERNANCE DECISION P6 HAD TO SETTLE — AND DID NOT TAKE ALONE

**TIME3 § 14 target 3 requires the four `getGreeting()` copies to become one. INT21 § 9 already
schedules the same words as `CP3`** — *"Retire the last three client-side voiced strings … the
home-page time-of-day greeting … needs registry content and a route to reach it"* — and § 10
fires a tripwire: *"Any phrasing transform, template, or voiced string created outside the
Behaviour Engine + Personality Registry pair — **stop**. That is a second voice nobody chose;
grandfathered strings (the hardcoded greeting) are debt scheduled by §9, not precedent."*

**Two governing documents, one greeting, and a "stop" in the middle of it.** It was put to the
user on 2026-07-17 and decided:

1. **One client module — converge the CLOCK, leave the VOICE.** `client/src/lib/greeting.ts`
   reads `householdPhase` and maps it to the three words **byte-identical to those shipping
   today**. It creates no second voice: four grandfathered copies become one, which is exactly
   the debt § 10 names as *"scheduled by §9, not precedent"* — and it makes `CP3` cheaper, with
   **one site to retire instead of four**. The file's own header says the next change to it
   should be its deletion.
2. **The two dev prototypes converge to the declared 17.** Both are `import.meta.env.DEV`-gated
   and compile-time dropped from the production bundle, so **no household is affected**; the
   in-code *"byte-untouched"* note was a prototype's rationale for holding a local copy, and
   governing architecture prevails over it. The divergence can no longer ship on the day an idea
   graduates — which is precisely when it would have.

**No ownership moved.** Register Rule 7 is not triggered: INT21 still owns every word, Household
Time still owns the phase, and the platform converged **onto** both.

---

## 4. THE GATE — MUTATION-TESTED, NOT ASSUMED (CP10)

A gate nobody proved can fail is a third failure mode, so each new ratchet was **broken on
purpose** and observed:

| Mutation | Result |
|---|---|
| A fifth `getGreeting()` returns to `dashboard.tsx` | 🔴 **FAIL** — *"1 rival greeting implementation(s) derive a greeting from an ambient hour: client/src/pages/dashboard.tsx"* |
| The UTC `temporalAnchor` returns to the assembler | 🔴 **FAIL** — *"…serialises an instant through UTC to make a civil date. HT12 — the device may supply the instant; it may never decide the day"* |
| Both reverted | 🟢 **healthy, 9/9** |

The two new checks join P5's seven. **`ht-no-rival-greeting` is the gate TIME3 § 16 names by
name:** *"the gate that matters is the one that fails when someone writes a sixth
`getGreeting()`."* Its rival ceiling is also recorded in the Adoption Register at **0**, so the
shape is watched by two independent instruments.

---

## 5. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Five, all caught before they landed. Recorded because a report that only lists successes is not
evidence.

1. **A live off-by-one, found by this phase's own suite.** The diary's countdown used
   `Math.ceil((noonOfTarget − midnightToday) / 86_400_000)` — half a day, rounded up. So an
   event happening **today** returned `1` and read *"1 day away"*, and the
   `days === 0 → "Today!"` branch below it was **unreachable for everyone**. It is reachable for
   the first time. *(Found because a source-scan asserted the `T12:00:00` guard was gone and it
   was not — the assertion was broader than the implementation, and the gap was a real bug.)*
2. **Three of my own test assertions were wrong**, and were corrected against **measured**
   behaviour rather than patched to pass: the retired freezer comparison flips at **01:00 BST**,
   not the 00:30 I had asserted (measured hour by hour); a device on **Los Angeles** time greets
   a London breakfast *"Good morning"*, not *"Good evening"* — **Auckland** is the zone that
   reproduces the reported defect; and `formatCivilDate` normalises garbage to the epoch, so
   composing it hid what `addCivilDays` actually returns.
3. **A missing import, caught by the gate.** `civilDaysBetween` was used in the diary's countdown
   and never imported — `typecheck:ci` went 32 → **33**. Fixed; back to the identical 32.
   Recorded because the earlier targeted typecheck ran *before* that edit: **"I checked it once"
   is not a measure.**
4. **A malformed Adoption Register entry.** `evidence` must be an **array** of dated
   `{what, pattern, asAt, asAtDate}` facts; I gave it prose, so the gate iterated the string's
   **characters** and emitted 375 notices against a count of 3,884,724. Fixed by reading the
   gate rather than guessing at its schema.
5. **A test fixture that could not fail.** The first live verification ran at 08:52 UTC, when
   Tokyo, London and UTC all agreed on the date — so *"the anchor matches the household"* was
   true for the wrong reason. Re-run against **Pacific/Midway**, which genuinely disagreed.

### 5.1 The live-environment trap, caught for the third time

**My first verification server died with `EADDRINUSE` on `:5199`, and a stale process — pid
15555, started 1h17m earlier, running PRE-P6 code — was holding that port.** Had I trusted those
requests I would have exercised the old tree, seen a UTC anchor, and concluded `READ-4` did not
work. **This is the identical failure mode `DEV1` investigated and `P5` hit** (*"a stale pre-P4
process restarted onto the post-P4 tree"*).

Resolved by not trusting the port: a **verified-free** port was chosen (`:5321`), the serving pid
was confirmed to be a **descendant of the process I started**, and the log was checked for
**zero** `EADDRINUSE`. **The pre-existing servers on `:5000` and `:5199` were left running — they
were not mine to kill.**

> **Three sessions in a row have now been lied to by a stale process.** It is no longer a trap;
> it is a property of this environment, and the only defence that has worked is refusing to
> believe a port until the process behind it is identified.

---

## 6. TEST SUITES — 14 affected suites, 0 failures

| Suite | Result | Why it is affected |
|---|---|---|
| **`test-time3-p6-consumer-convergence`** *(new)* | **107/107** | The phase's own suite (§ 6.1) |
| `test-time3-household-time` (P5's) | **73/73** | The owner gained vocabulary — it must still read no clock and own no season |
| `test-intelligence-conversation-gateway` · `test-intelligence-context-composition` | **pass · 166/166** | The frame the anchor lives in, and the composition it reaches the model through |
| `test-intelligence-diary-binding` · `test-intelligence-diary-discovery-binding` · `test-log-meal-to-diary` | **56/56 · 37/37 · 10/10** | The diary's day and `copyPlannerToFoodDiary` |
| `test-intelligence-meals-binding` | **72/72** | The freezer's write door |
| `test-intelligence-household-binding` | **50/50** | The household read path the zone comes from |
| `test-home2-home-primary-action` · `test-intelligence-notice-engine` | **47/47 · 65/65** | Home's time-adjacent decision model; `HT14`'s boundary |
| `test-plan1-planner-intelligence` · `test-intelligence-platform` · `test-intelligence-conversation-store` | **58/58 · 33/33 · pass** | The planner and platform paths around the frame |

The suite is registered as `npm run test:time3-p6-consumer-convergence` and **wired into the
aggregate `npm test`**, so it runs in `release:check` — otherwise the gate would exist and never
fire.

### 6.1 The technique: the pre-convergence code is the oracle

The retired implementations are embedded in the suite **verbatim** — the UTC anchor, both live
`getGreeting()` copies, the prototype's 18-boundary copy, the freezer's comparison, the
countdown's arithmetic. The converged code is then checked **against them**:

- **Where it must not change, it is proven identical.** The greeting is byte-identical to the
  frozen live oracle at **all 24 hours**. The anchor is unchanged at **22 of 22** UK hours
  outside the 00:00–01:00 BST window.
- **Where it must change, the change is pinned to the exact input that was the defect** — 00:30
  BST resolving to yesterday; New York at 21:00 resolving to tomorrow; noon on the expiry day
  reading *"expired"*.

**That is what makes "nothing regresses" a measurement rather than an intention.**

---

## 7. WHAT WAS REFUSED

- **`CP3` — moving the greeting's words into the Personality Registry.** INT21 § 9 schedules it
  and says plainly that *"nothing below is authorised by this document"*. P6 converged the clock
  and left the voice byte-identical. **The words are still client-side strings, and that is
  INT21's open item, not a P6 omission** (§ 3).
- **Inventing a freezer expiry.** `expiryDate` has no writer and never has (§ 2.1). Adding one
  would be a new fact, which is a governed act — and it would have been done to make a grade
  true rather than to serve a household.
- **Changing any column type.** `SCH-4` is explicit: *"fix the comparison before the column
  type — the comparison is what harms."* `frozen_date`, `food_diary_days.date` and the rest are
  still `text`. That is P7+ work and it needs a migration this phase did not take.
- **`seasonOfLocalDate()`** — see § 7.1. **Named as a deviation, not quietly skipped.**
- **Touching any T5 consumer.** The five rival "current weeks", streaks and savings need the
  anchor. Converging them now would be arithmetic over a week nobody can date — and `HT11` makes
  a half-converged consumer worse than an unconverged one.
- **`product_history.scannedAt` and `user_health_trends.date`.** TIME2 lists them in Step 3;
  **CONV1's P6 row does not**, and `scannedAt`'s semantics are genuinely unsettled (it is a
  `text` column named for an *instant*, and TIME2 § 4.12 records it leaking raw UTC into a
  sentence the Companion speaks). Recorded, not guessed at.
- **Renumbering the `dayOfWeek` key space.** `HT8`/`R9`. `copyPlannerToFoodDiary` was fixed by
  *asking the owner what the number means*, not by changing the number.
- **Adopting the pre-existing typecheck/adoption debt.** None of it is P6's, and adopting it
  would make P6's own measure unreadable (the P2–P5 discipline).

## 7.1 A deviation from P5's handover, stated plainly

**P5's report § 7.1 and the Source of Truth Register both named `seasonOfLocalDate()` as
*"Phase 3's retirement target (`CONV1 P6`)"*. P6 did not retire it.**

**Why:** CONV1's own P6 row names four workstreams — `READ-4` → `BEH-6` → `SCH-4` → the greeting
×4 — and the season input is not among them; the mission's approved sequence is those same four.
Retiring the adapter means threading the household's zone through **seven** server assemblers
that each pass a process-local `now` (`food-intelligence-assembler.ts:212`,
`meal-intelligence-assembler.ts:317`, `nutrition-centre-assembler.ts:154`,
`connected-food-intelligence-assembler.ts:336`, `planner-explanation-context.ts:124`,
`meal-food-intelligence.ts:133`, `routes.ts:5862`). **That is a workstream, not a line.**

**No consumer is half-converged by leaving it** (`HT11`): those seven take neither T2 nor a rival
week — they are untouched, which is the honest state. **The Register's claim was corrected in
this change** rather than left to be discovered as a lie later.

## 7.2 New backlog raised by P6 (recorded, not smuggled in)

- **The greeting's words remain outside the Personality Registry** — `CP3`, INT21's, now with
  one site to retire instead of four.
- **`GET /api/household` is fetched by four surfaces for one field.** The zone reaches the
  client through an inline `useQuery(["/api/household"])` in each — the existing convention (no
  `useHousehold` hook exists). If a fifth surface needs it, that is the moment to give it an
  owner rather than a fifth copy.
- **`LookingForwardWidget`'s countdown dates live in `localStorage`** — a household-shaped fact
  with no Register domain, exactly the shape `OWN-6` records for `planner:active-week`. P6 fixed
  its arithmetic and did **not** touch its ownership.
- **The freezer's expiry UI is dead code making food-safety-adjacent claims.** Now correct if a
  writer ever appears — but *whether* the freezer should have an expiry is a product decision
  with a governed new fact behind it, and it has no owner today.

---

## 8. GOVERNING DOCUMENTS — corrected, not amended (CP4; Register Rule 7 not triggered)

**No ownership changed anywhere in this phase.** Only status and citation rows were corrected:

- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** — the header and § 17 (*DECLARED, AND PARTLY BUILT* →
  **DECLARED, BUILT, AND CONVERGING**), per-fact, including what remains false about the running
  system; **§ 14's retirement list gained a Status column** — targets 3, 4, 7, 8 done; 1, 2, 5,
  6, 9, 10 live and every one gated on the anchor.
- **`docs/architecture/README.md`** — the mandatory **Architecture Bootstrap** asserted *"no
  consumer has converged yet (Phase 3)"*. **Corrected in the same change that made it false** —
  the `DOC-4`/`KC14` failure this same README records two paragraphs below.
- **Source of Truth Register** — Domain 16 (*"No consumer derives household time from it yet"* →
  **✅ CONSUMED**, with its consumers named); Appendix A (the retirement list's true state, and
  the gate at 9 checks); Domain 11's `seasonOfLocalDate` note (**corrected to say it is still
  live**, with the reason and the seven-assembler fan-out — § 7.1).
- **`server/verification/publication-register.ts`** — two ratchets (§ 4) and the domain's
  `knownGaps` rewritten: the claim that no consumer had converged became false today.
- **`docs/implementation/ux/adoption-register.json`** — the `time-of-day-greeting` concern
  (owner, floor 4, the two retired copies, a rival ceiling of **0**, and `CP3` named as the open
  migration with its owner). `ADOPTION_REGISTER.md` regenerated, never hand-edited.

**Not amended:** the Experience canon is **byte-untouched**. `HT13` was not engaged — P6 aims
words and doors and no light. `TRANSLATION1` *Morning Rhythm* § 6 already sanctioned the
greeting's clock read; P6 supplied the fact that makes it the *household's* clock, and added no
rule to the document that required it.

---

## 9. THE REMAINING CONV1 BACKLOG

**Closed to date:** P0 (out-of-band security) · P1 (`DOC-1..4`·`OWN-5`) · P2 (`WRITE-4`·`BEH-8`) ·
P3 (`BEH-1`·`BEH-4`·`BEH-7`) · P4 (`WRITE-3`·`WRITE-2`·`OWN-1`·`READ-1`·`READ-2`·`WRITE-1`) ·
P5 (`OWN-4`·`OWN-3`·`SCH-1`) · **P6 (`READ-4`·`BEH-6`·`SCH-4`·the greeting ×4)** —
**23 of 24 census items… of the items that have phases before P7.**

| Phase | Contains | Status |
|---|---|---|
| **P7 — The anchor** ★ | `SCH-2` | **open — recommended next.** Blocked by nothing. **Everything left is behind it** |
| **P8 — The T5 convergence** | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | open — needs P7 |
| **P9 — Retire the fabricator** | `BEH-5` | open — needs `SCH-2` |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** |
| **Unclaimed Phase 3 remainder** | `seasonOfLocalDate()` ×7 assemblers · `product_history.scannedAt` · `user_health_trends.date` · `dayOfYear` · the benchmark seeder's offset | open — **needs no anchor**; cheap, and not in any CONV1 phase row (§ 7.1) |

---

## 10. RECOMMENDED NEXT WORKSTREAM

> **P7 — The anchor (`SCH-2` — `planner_weeks.weekStartDate`).**

It is the programme's own next phase, and **it is now the only thing standing between the
platform and the rest of its time debt.** Every remaining § 14 retirement target — the five rival
"current weeks", the nineteen week-shapes, the fabricated-date builders, the Monday-week
implementations — is gated on it, and **not one of them is fixable before it**. P6 exhausted the
work that needs only T1+T2: *"the expensive step is not on the critical path for most of the
harm"* is now spent, and what remains is the expensive step.

**The risk to name at P7's start is `R5`, and it is the reason the phase is dangerous rather than
hard.** The column is additive, nullable and touches no row — the work is trivial. **The danger
is that `NULL` looks like a bug and someone back-fills it.** `HT7` is absolute: the only moment
THA can honestly know which calendar week a slot means is the moment the slot is created;
existing rows stay `NULL` **forever**. *A back-filled anchor is `approxDate` with a schema* — it
would be indistinguishable from a real one, which is what makes it worse than an absent one.
**Assert it in the migration's own comment**, and put a gate on it in the same change (CP10).

**`R3` is closed by this phase, and that is worth saying once:** P5's warning was that an owner
with no consumers is a rival copy in waiting. It has consumers, they are proven, and two ratchets
fail the moment a rival returns. **What P6 could not close is that Phase 3 was never the finish
line — `anchored:false` is still the answer for every household in THA, and it will be until the
anchor lands.**

---

*Rollback: `rollback/CONV1-phase-p6-household-time-t2-t3-20260717` → `1648fc46`. **The tag is a
true restore point for everything that existed when P6 began** — the preservation commit captured
every previously-uncommitted change before any P6 file was touched, so `git checkout` of the tag
loses nothing of the **prior** sessions' work.*

> ⚠️ **A concurrent session is live in this tree, and it changes what a blanket rollback means.**
> `NORTH1_Home_Implementation` has been editing `home-experience-page.tsx`, `App.tsx`,
> `orchard-backdrop.tsx`, `nav-bar.tsx`, `index.css`, `.replit` and the EXP4 capture scripts
> **since `1648fc46`**. **None of those files is P6's, and there is no collision** — but a
> `git checkout` of this tag would discard that session's in-flight work along with P6's.
> **To revert P6 alone, revert P6's own files** (§ 1 and the run file's list). P6 is code-only, so
> that is a complete revert with nothing left in the database.
*✅ **No migration, no schema change, no column added or dropped, no row rewritten.** P6 is
code-only: reverting the code reverts the phase completely, with nothing left behind in the
database. The demo households created during live verification carry the ordinary demo
expiry.*
