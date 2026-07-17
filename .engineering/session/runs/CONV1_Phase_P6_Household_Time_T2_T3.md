# CONV1 Phase P6 — Household Time: the T2/T3 convergence

**Stage:** Complete
**Date:** 2026-07-17
**Rollback ID:** `rollback/CONV1-phase-p6-household-time-t2-t3-20260717` → `1648fc46`
**Type:** Git tag on a preservation commit, created **before any P6 file was touched**.

> ✅ **The tag is a true restore point** — the preservation commit `1648fc46` captured every
> previously-uncommitted change first (P5's completed work + the concurrent ODL2 session's
> in-flight work). `git checkout` of the tag loses nothing.

**Scope:** CONV1 Phase **P6** only — `READ-4` → `BEH-6` → `SCH-4` → the greeting ×4.
No P7+ work, no unrelated refactoring. Governed by `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
(HT1–HT18), **DECLARED, AND PARTLY BUILT** (§ 17) — the module and the zone exist since P5.

---

## Mission

Implement CONV1 Phase P6: Household Time **Phase 3** — the T2/T3 consumer convergence.
Consume the platform P5 introduced. Gate: **per-consumer; `anchored:false` → today's behaviour**
(migration principle 1 — the old behaviour is the floor, nothing regresses, ever).

## Pre-work checkpoints

- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_PHASE_P5_COMPLETION.md` read — P5 complete ⇒ P6 is the programme's own next phase
- [x] `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` read — § 3 (`READ-4`, `BEH-6`, `SCH-4`), § 4, § 7 (P6 row)
- [x] `TIME1` read (design reasoning) · `TIME2` read (consumer evidence — § 4.5, § 4.7, § 9.4)
- [x] GOVTIME1 **does not exist** (CONV1 § 0.3; P5 recorded the identical finding) —
      `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` read in full in its place
- [x] `shared/time/household-time.ts` read in full — the contract P6 consumes
- [x] `git status` confirmed (branch `int1-intelligence-platform`; dirty tree preserved by `1648fc46`)
- [x] Rollback tag created **before any file was touched**
- [x] Baseline measured, not inherited (CP11) — see below

## Baseline — measured at `1648fc46`, 2026-07-17 (CP11)

| Gate | Baseline |
|---|---|
| `verify:publication` | **FAIL** — 23 domains: 🟢7 · 🟡12 · 🔴4; 67 checks: 41 pass · 20 warn · 6 fail |
| `verify:coherence` | **PASS** — 0 failed, 0 warned; every declared owner and `file:line` citation resolves |
| `typecheck:ci` | **32 regressions** (pre-existing debt; the exact set is frozen at `scratchpad/typecheck-set-baseline.txt` for a post-change diff) |
| `adoption:check` | **2 fails** (pre-existing) · 0 notices · 71 pass *(71, not P5's 66 — the concurrent ODL2 session added owners since. Measured, not inherited.)* |

**The `household-time` domain is 🟢 healthy 7/7 at baseline** — P6 must keep it so: its HT18
ratchets fail the moment a rival copy returns, and P6 deletes rival copies rather than adding any.

## The risk to name at P6's start is `R3`, not `R1` (P5's handover)

`R1` is closed — the owner is built and a gate watches it. But **P5 built an owner with zero
consumers**, and an owner nobody imports is exactly what `OWN-3` spent a phase fixing.
**P6 is what turns P5 from a declaration into a convergence.**

`R3` — *convergence stalls after the visible harm is fixed; the anchor never lands and
`approxDate` is sanctioned by survival.* Mitigation is TIME3 § 14's cited retirement condition:
**Step 3 must not ship without Step 4 scheduled.** P6's report must recommend P7 explicitly.

## Constraints in force (HT1–HT18; CP5–CP11)

1. **HT11 / CP5** — **ALL of it, or none of it.** A consumer that takes T2 from the module but
   keeps its own week arithmetic compares the household against two calendars at once.
   **Half-converged is worse than unconverged.**
2. **HT12** — the client **renders** household time; it never **derives** it. The device may
   supply the *instant* and detect the *zone at signup*. It may never decide *the day*.
3. **HT15** — time reaches the model **only** through a Context View composed by INT17.
   Never templated into a prompt, a system message, or a fallback string.
4. **HT13** — time aims **words and doors, never light**. No colour, token, palette, opacity,
   theme or motion. (`TRANSLATION1` *Morning Rhythm* § 9: STOP.)
5. **INT21 owns every user-facing word** — including the greeting. The module declares the
   *phase vocabulary*; it does not speak.
6. **CP6** — the five MUST-NOT-consume domains (Trial/Auth, Learning, Caching, Observation,
   Decision) are untouched, permanently. `MUST NOT` is a verdict, not a backlog.
7. **Migration principle 1** — the old behaviour is the floor. The 17-vs-18 phase boundary:
   the module declares **17** (what is live), so convergence preserves today's behaviour exactly.
8. **`SCH-4`** — *fix the comparison before the column type; the comparison is what harms*
   (CONV1 § 3). No back-fill; no key space change.
9. No new dependency — `Intl` suffices.

## CP11 — a CONV1 grade corrected at source, before implementing against it

**CONV1 grades `BEH-6` 🔴 *"Highest user harm in the time family"* / *"✅ Live. The 'Expired'
badge flips at UTC midnight — 01:00 BST, so a UK household loses the whole final day."*
**The evidence does not support that grade.** Verified at source and against live data:

- `expiryDate` has **no writer anywhere** — 1 schema declaration + 3 read sites in
  `meals-page.tsx` (`:4414`, `:4415`, `:4473`). `POST /api/freezer` never computes an expiry;
  `addFreezerMeal` spreads the client's body verbatim. No client sends one.
- **Live census: `freezer_meals` — 10 rows, `with_expiry: 0`, `with_frozen: 10`.**
- Therefore `isExpired` is always falsy and `daysUntilExpiry` always null. **The "Expired"
  badge has never rendered for any household.** TIME2 § 4.5's defects **3 and 4** (the
  cross-frame comparison; the DST-drifting `Math.ceil` epoch arithmetic) are **latent**.

**What IS live** is TIME2 § 4.5's defect **2** — the UTC write (`frozenDate:
new Date().toISOString().split('T')[0]`), through which all 10 rows were authored — and the
display parse at `:4472` (UTC-midnight parse rendered via `toLocaleDateString()`).

**This does not remove `BEH-6` from P6.** The code is a rival clock and P6 converges it. It
changes the *grade*, not the work — and P6 must **not** invent an expiry to make the defect
real (a new fact is a governed act — Register Rules 2/8; TIME1 § 15.4).

## Progress

- [x] Rollback protection (`1648fc46` preservation commit + annotated tag)
- [x] Baseline gates measured
- [x] Consumer sites mapped at source; `BEH-6`'s grade corrected against live data (CP11)
- [x] Owner gains the civil-date vocabulary its consumers need (`formatCivilDate`,
      `parseCivilDate`, `civilDaysBetween`, `compareCivilDates`, `addCivilDays`) — so three
      consumers do not hand-roll three rival copies of it (Rule 4)
- [x] `READ-4` — the Companion's UTC `temporalAnchor` → `householdToday(now, householdZone)`
- [x] `BEH-6` — the freezer: server-stamped `frozenDate` (HT12) + civil comparison + display
- [x] `SCH-4` — the diary's day, the `T12:00:00` guards (→ 0), `copyPlannerToFoodDiary`'s weekday
- [x] Greeting ×4 → 1 (`client/src/lib/greeting.ts`) — clock converged, words left to INT21/CP3
- [x] Two HT18 ratchets added + **mutation-tested** (`ht-no-rival-greeting`,
      `ht-companion-anchor-is-the-households`); `household-time` 🟢 **9/9**
- [x] P6 suite: **107/107**, registered and wired into the aggregate `npm test`
- [x] Adoption register: greeting concern recorded (5/5 pass) — **76 pass · 0 notices · 2 fail
      = the 2 pre-existing; 0 added**. (My first entry was malformed: `evidence` must be an
      ARRAY of dated facts and I gave it prose, so the gate iterated the string's characters —
      375 bogus notices. Read the gate, fixed the schema.)
- [x] `verify:coherence` **PASS** — every declared owner and `file:line` citation resolves
- [x] Governing documents corrected (TIME3 header + § 14 + § 17; README Bootstrap; Register
      Domain 16, Appendix A, Domain 11's `seasonOfLocalDate` note)
- [x] **14 affected suites · 0 failures** · `npm run build` passes
- [x] **Live end-to-end verified** against a zone that genuinely disagreed with UTC
      (Pacific/Midway): anchor `2026-07-16` vs UTC's `2026-07-17`; a lying client's
      `frozenDate: "2099-01-01"` dropped and the household's own day stamped
- [x] `typecheck:ci` **32 = baseline, identical set** (a 33rd was added by me and fixed)
- [x] Report filed: `docs/implementation/governance/CONV1_PHASE_P6_COMPLETION.md`

## Outcome

**COMPLETE.** All four workstreams closed in the approved sequence. **P5 built an owner with zero
consumers; it has consumers now** — `R3` is closed. `household-time` 🟢 **9/9** (two new ratchets,
both **mutation-tested**). Gate deltas vs baseline: publication 67→69 checks, 41→43 passing,
**reds unchanged at 4**; `typecheck:ci` **32 = 32**; `adoption:check` **2 pre-existing fails, 0
added**; coherence PASS; build passes; `repo-structure` FAIL = the identical pre-existing set
(every cause named, none P6's).

**P6 is code-only** — no migration, no schema change, no column added or dropped. `git checkout`
of the tag is a complete revert.

## Next action

None — complete. Recommends **CONV1 P7** (`SCH-2` — `planner_weeks.weekStartDate`, the anchor).
**Name `R5` at P7's start:** the column is trivial (additive, nullable, no row touched); the
danger is that `NULL` looks like a bug and someone back-fills it. `HT7` is absolute — existing
rows stay `NULL` forever; *a back-filled anchor is `approxDate` with a schema*. Assert it in the
migration's own comment and gate it in the same change (CP10).

**Everything left in the programme is behind the anchor.** P6 spent the last of the work that
needs only T1+T2.

## Scope deviation, stated rather than hidden

**`seasonOfLocalDate()` is NOT retired by P6.** P5's report and the Register both called it
*"Phase 3's retirement target (`CONV1 P6`)"* — but **CONV1's own P6 row names four workstreams
and the season input is not among them**, and the mission's approved sequence is those same
four. Retiring it means threading the household's zone through **seven** server assemblers
(`food-intelligence-assembler:212`, `meal-intelligence-assembler:317`,
`nutrition-centre-assembler:154`, `connected-food-intelligence-assembler:336`,
`planner-explanation-context:124`, `meal-food-intelligence:133`, `routes.ts:5862`) — a
workstream, not a line. **No consumer is half-converged by leaving it** (HT11): those seven
take neither T2 nor a rival week. The Register's claim was corrected to say so.

## Two governance decisions put to the user (2026-07-17) — not taken alone

1. **The greeting's scope.** TIME3 § 14 target 3 says 4 → 1; INT21 § 9 schedules the *words*
   as **CP3** and § 10 fires a "stop" on phrasing created outside the Behaviour Engine.
   **Decided: one client module — converge the CLOCK, leave the VOICE.** The three strings are
   byte-identical to today's; four grandfathered copies become one, which is CP3's remaining
   surface and makes it cheaper.
2. **The two dev prototypes** (boundary 18 vs the declared 17), one of which declares itself
   "byte-untouched". **Decided: converge to 17.** Both are compile-time dropped from
   production, so no household is affected; the divergence can no longer ship when an idea
   graduates.

## Defects found by the discipline (report § 5)

1. **`BEH-6` is mis-graded by CONV1** — the expiry comparison is latent, not live (above).
2. **A live off-by-one the suite found:** the diary's countdown `daysUntil` used
   `Math.ceil((noonOfTarget − midnightToday) / 86_400_000)` = **half a day rounded up**, so an
   event happening TODAY returned 1. The `days === 0 → "Today!"` branch was **unreachable for
   everyone**. Civil days make it reachable for the first time.
3. **Three of my own test assertions were wrong** and were corrected against measured
   behaviour rather than patched: the retired freezer comparison flips at 01:00 BST (not
   00:30, which I had asserted); a device on Los Angeles time greets a London breakfast
   "Good morning" not "Good evening" (Auckland is the zone that reproduces it); and
   `formatCivilDate` normalises garbage to the epoch, so composing it hid what
   `addCivilDays` returns.
4. **A missing import I added, caught by the gate** — `civilDaysBetween` used in the diary's
   countdown and never imported (`TS2304`). It took `typecheck:ci` from 32 → 33. Fixed;
   back to the identical 32. Recorded because the earlier targeted typecheck ran *before*
   that edit — "I checked it once" is not a measure.
5. **A malformed adoption-register entry** — `evidence` must be an array of dated facts and I
   gave it prose, so the gate iterated the string's characters and emitted 375 bogus notices
   against a count of 3,884,724. Read the gate rather than guessing at the schema.

## The live-verification trap, caught again (P5/DEV1's failure mode)

My first verification server **died with `EADDRINUSE` on :5199 and a stale process (pid 15555,
started 1h17m earlier, running PRE-P6 code) was holding that port.** Had I trusted those
requests I would have "verified" the old tree and concluded `READ-4` did not work — which is
exactly what `DEV1` recorded and `P5` hit. Resolved by choosing a **verified-free** port
(:5321), confirming the serving pid was a **descendant of the process I started**, and checking
the log held **zero** `EADDRINUSE`. The pre-existing servers on :5000 and :5199 were **left
running — they were not mine to kill.**

**And the first live run could not have failed:** at 08:52 UTC, Tokyo, London and UTC all agreed
on the date, so the assertion was blind. Re-run against **Pacific/Midway (UTC-11)**, which
genuinely disagreed with UTC at that instant.

## Next action

Regenerate the adoption register (`adoption:record` — the `.md` is GENERATED, never
hand-edited), re-run the full gates, run the affected suites, correct the governing documents
(§ 17 / § 14 / Register), verify end-to-end against the running app, and file
`docs/implementation/governance/CONV1_PHASE_P6_COMPLETION.md`.

## Files touched (rollback list — keep current)

**Code (new):**
- `client/src/lib/greeting.ts` (the one greeting — 4 → 1)
- `server/tests/test-time3-p6-consumer-convergence.ts` (107 assertions)

**Code (modified):**
- `shared/time/household-time.ts` (the owner gains the civil-date vocabulary)
- `server/intelligence/conversation/context-frame-assembler.ts` (READ-4)
- `server/storage.ts` (BEH-6 — `addFreezerMeal` stamps; SCH-4 — `copyPlannerToFoodDiary`)
- `server/routes.ts` (BEH-6 — `POST /api/freezer` omits `frozenDate`)
- `client/src/pages/meals-page.tsx` · `client/src/hooks/use-planner-operations.ts` (BEH-6)
- `client/src/pages/food-diary-page.tsx` (SCH-4 — the day, both `T12:00:00` guards)
- `client/src/pages/dashboard.tsx` · `client/src/components/HomeIntelligenceCompanion.tsx` (greeting)
- `client/src/pages/dev/arrival-a-welcome.tsx` · `client/src/pages/dev/arrival-s1-quiet.tsx` (greeting)
- `server/verification/publication-register.ts` (2 ratchets + knownGaps)
- `docs/implementation/ux/adoption-register.json` (+ generated `ADOPTION_REGISTER.md`)
- `package.json` (suite registered + wired into aggregate `test`)

⚠️ **No migration. No schema change. No column added or dropped.** P6 is code-only.

⚠️ **A concurrent session (`NORTH1_Home_Implementation`) is live in this tree** and has been
editing `home-experience-page.tsx`, `App.tsx`, `orchard-backdrop.tsx`, `nav-bar.tsx`,
`index.css`, `.replit` and the EXP4 capture scripts **since `1648fc46`**. **None of those is
P6's and there is no collision** — but a blanket `git checkout` of the tag would discard their
in-flight work too. **To revert P6 alone, revert the files listed above.**
