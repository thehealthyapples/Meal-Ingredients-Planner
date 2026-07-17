# CONV1 Phase P5 — Household Time: the module and the zone

**Workstream:** `CONV1_Phase_P5_Household_Time`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p5-household-time-20260716` → `fed6dcaf`
**Status:** ✅ **COMPLETE** — all three workstreams closed in the approved sequence.
**The gate target is met: `HT18` — no second implementation exists. The `household-time` domain is 🟢 healthy, 7/7 checks.**

> **Scope.** CONV1 Phase **P5** only: `OWN-4` → `OWN-3` → `SCH-1`.
> No P6+ work, no unrelated refactoring. Implementation report — it creates no rule, and where it
> and any governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**`shared/time/household-time.ts` exists.** It has been law without code since 2026-07-16, and it was
the programme's highest structural risk (`R1`: *"the declared owners are never built… a declared
owner nobody builds becomes a 21st time implementation with better manners"*). It is pure, zero-I/O
and **reads no clock** — `now` is a parameter, which is what makes it incapable of disagreeing with
itself. **Its HT18 verification entry landed in the same change**, which is the whole of what CP10
asks: *a convergence is finished when a gate can fail.* It can: the ratchets were **mutation-tested**,
and each one fails when the shape it guards returns (§ 4).

**The season rule has one implementation, and it is the owner the Register declared.** Three became
one — and behaviour is unchanged **by proof, not intent**: across a four-year sweep the converged rule
is byte-identical to all three retired implementations.

**`households.timeZone` exists, and it is honest.** Nullable, additive, **no back-fill and no SQL
default**: all 299 existing households hold `NULL`, which means *"THA has not been told"* — a
different thing from *"THA assumed Europe/London"*, and the difference is the whole of CP8.

**What P5 deliberately did NOT do: converge a single consumer.** The twenty private clocks are still
live. That is Phase 3 (`CONV1 P6`), and taking it here would have been half-converging consumers
against a calendar the anchor cannot yet supply (`HT11`: *half-converged is worse than unconverged*).

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`OWN-4`** — the declared owner does not exist | ✅ **CLOSED** | `shared/time/household-time.ts` — the § 6 contract exactly as declared (`householdToday`, `householdWeekOf`, `householdPhase`, `resolvePlannerWeek`), plus the vocabulary it owns: the `dayOfWeek` key space (`0 = Sunday`, **declared, never renumbered** — HT8), the Monday-first week convention, `MONDAY_FIRST_ORDER` (the retirement target for 19 week-shapes across 16 files), the coarse phase vocabulary, `isKnownZone`, and `DECLARED_DEFAULT_ZONE` with its provenance. No new dependency (`Intl` suffices). **73-assertion suite** + **HT18 verification entry in the same change** |
| **`OWN-3`** — the season rule's declared owner is not its actual owner | ✅ **CLOSED** | `shared/seasonal/season-rule.ts` — Domain 11's own file, a **leaf** (imports nothing). `discovery/seasonal-map.ts`, `seasonal/engine.ts` and `stories/engine.ts` all delegate to it; the `UKSeason` vocabulary is declared with its rule and re-exported (not re-declared) by the two type files that held duplicate copies. **No ownership moved.** One process-local frame read survives, named and dated: the transitional `seasonOfLocalDate()`, Phase 3's target |
| **`SCH-1`** — `households.timeZone` does not exist | ✅ **CLOSED** | Nullable `text` column (schema + migration `2026-07-17_conv1_p5_household_time_zone`, applied). **Signup detection** at both real doors (`createUser`, `createDemoUser` — the client detects via `Intl`, HT12); **correction path** `PATCH /api/household/time-zone` → `storage.setHouseholdTimeZone` (owner-only, `renameHousehold`'s precedent); unknown IANA ids **dropped, never stored**; the zone surfaced on `GET /api/household` so the correction path is usable |

---

## 2. THE MEASURE — re-run for this phase, never inherited (CP11)

| Signal | Baseline (measured at `fed6dcaf`, this session) | **After P5** | Δ |
|---|---|---|---|
| **`HT18` — no second implementation exists** | **the module did not exist**; the season rule existed **3×** | **🟢 `household-time` domain healthy — 7/7 checks pass**; season rule **1×** | **★ the phase gate, met** |
| `verify:publication` — platform | 22 domains: 🟢6 · 🟡12 · 🔴4; 60 checks: 34 pass · 20 warn · 6 fail | **23 domains: 🟢7 · 🟡12 · 🔴4; 67 checks: 41 pass · 20 warn · 6 fail** | **+1 domain, +7 checks, all passing; reds unchanged at 4** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt; P4 recorded 33 — one closed since by a concurrent session) | **32 — identical set** | **0 added by P5** |
| `adoption:check` | 2 pre-existing fails · 1 notice · 65 pass | **2 pre-existing fails · 0 notices · 66 pass** | 0 added (the notice was a concurrent session's `dark:` count fact, since settled) |
| `npm run build` | passes | **passes** | — |
| **Live data census** (post-migration) | column absent | **`time_zone` text, nullable, `column_default: null`; 299 households, 0 with a zone, 299 NULL** | **no row rewritten; no silent default** |
| Affected suites | — | **15 suites run · 0 failures** (§ 6) | — |
| `repo-structure-verify.sh` | **FAIL** (pre-existing, not P5's — see below) | **FAIL — the identical set** | 0 added |

**The repo-structure gate's FAIL is pre-existing and every cause is named**, rather than reported as
a P5 side-effect: `.glibcheck.txt` + `.libdirs_uxhome.txt` at root (recorded by `TIME2` before this
work began); `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` and
`docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md` (tracked, `DEV1`'s); and
`docs/implementation/ODL2_VISUAL_LANGUAGE_FOUNDATION.md` (untracked, a **concurrent session's**).
**This report is filed under `docs/implementation/governance/`** — by workstream, not loose.

### 2.2 One artifact class checked rather than trusted

Running the WS8/WS10/WS11 suites rewrites their committed report JSONs. Two changed only by
`generatedAt`; **WS11's content changed** (`"Looking ahead to spring… Spring Onion, Asparagus,
Rocket"` → `"…Spring Onion, Rocket, Watercress"`), which looks exactly like a season regression.
It is not. The committed artifact was generated in **June**; the suite regenerates against `now`,
and WS10's recency weighting is date-dependent. **Proven, not argued:** the **pre-P5 code checked
out at `fed6dcaf` in an isolated worktree, run at the same July instant, produces byte-identical
content to P5's.** The three artifacts were then **restored** — they are side-effects of
verification, not part of this change.

### 2.1 Verified end-to-end against the running application

Driven live, not reasoned — on a **clean instance**, after a stale-process trap was caught (§ 5.1):

```
POST /api/demo/start {"timeZone":"Asia/Tokyo"}   → 201   (device DETECTS — HT12)
  raw DB: households.time_zone = "Asia/Tokyo"            (detection lands)
GET  /api/household                              → timeZone: "Asia/Tokyo"   (visible, so correctable)
PATCH /api/household/time-zone {"Europe/London"} → 200   {"timeZone":"Europe/London"}
GET  /api/household                              → timeZone: "Europe/London"  ← the household is BELIEVED over the device
PATCH /api/household/time-zone {"Not/AZone"}     → 400   "Not a recognised time zone."
GET  /api/household                              → timeZone: "Europe/London"  ← garbage never landed
```

And at the write door itself, for the cases the demo rate-limiter blocked over HTTP:

```
createDemoUser("Mars/Olympus")      → time_zone = null   (unknown id dropped, never stored)
createDemoUser(null)                → time_zone = null   (honest gap; no silent default)
createDemoUser("America/Los_Angeles") → "America/Los_Angeles"
setHouseholdTimeZone(…, "Not/AZone")  → refused: UNKNOWN_ZONE
setHouseholdTimeZone(…, "Pacific/Auckland") → "Pacific/Auckland"
```

> **The fourth line is the phase in one exchange:** a device guessed Tokyo, the household said London,
> and THA believed the household. That is the difference between a detected fact and a fabricated one.

---

## 3. THE GOVERNANCE DECISION P5 HAD TO SETTLE — AND DID NOT TAKE ALONE

**`CONV1` § 9 explicitly refused this choice:** *"Choose the season rule's owner (`OWN-3`) — Domain 11
as declared, or the Register corrected to name Domain 8's file. **A governance decision, not
CONV1's**."* It could not be implemented without being settled. **It was put to the user on 2026-07-17
and decided: Domain 11, as declared.**

**A load-bearing fact CONV1 did not record, found by reading the imports:** its Option A is **not
implementable as literally stated.** `shared/seasonal/engine.ts` — the declared owner — **already
imports** `../discovery/engine` (`:32`), which imports `./seasonal-map` (`:23`), and `../stories/engine`
(`:33`). Making those files import the rule back from `engine.ts` is a **circular import**.

**The resolution honours the declaration without the cycle:** the rule is a **leaf** inside Domain 11's
own folder (`shared/seasonal/season-rule.ts`), importing nothing. All three consume it.

- **No ownership moved** — Register **Rule 7 is not triggered**; Domain 11 is the owner it always was,
  and the platform converged **onto** it (P4's precedent exactly).
- The Register's Domain 11 row gains a **file-path citation**, not a new owner.
- It is the class **CONV1 § 10 itself records** for `OWN-3`: *"a reference vocabulary beside the spine"*.

---

## 4. THE GATE — MUTATION-TESTED, NOT ASSUMED (CP10, `R1`)

`R1` is the programme's highest risk and `R2` is that a red gate teaches people red is normal. A gate
nobody proved can fail is a third failure mode, so each ratchet was **broken on purpose** and observed:

| Mutation | Result |
|---|---|
| A rival season implementation returns to `stories/engine.ts` | 🔴 **FAIL** — *"1 rival season implementation(s) re-derive the season from a month: shared/stories/engine.ts"* |
| The module reads an ambient clock (`new Date()`) | 🔴 **FAIL** — *"household-time.ts reads an ambient clock. HT5: `now` is a parameter…"* |
| A per-member `timeZone` appears on `users` | 🔴 **FAIL** — *"A time zone is declared on users as well as households. HT4…"* |
| All three reverted | 🟢 **healthy** |

The seven checks: the owner exists (`HT1`) · reads no clock (`HT5`) · one season rule (`HT17`/`OWN-3`) ·
the time module owns no season (`HT17`) · nothing derived is stored (`HT3`) · the five MUST-NOT domains
hold no household clock (`HT10`/`CP6`) · the zone is the home's and there is one of it (`HT4`/`HT2`).

---

## 5. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Three, all caught before they landed. Recorded because a report that only lists successes is not evidence.

1. **An inverted sort comparator in `resolvePlannerWeek`.** `daysBetween(a, b)` is `b − a`, so
   `.sort((a, b) => daysBetween(a.start, b.start))` sorted the rota **descending**: `"next"` resolved to
   the **last** week of the rota instead of the first, and `"window-expired"` compared against the
   earliest week. Caught by the suite. **And the test that should have caught it did not** — it only
   checked the `"this"` case, which is order-insensitive, so it passed against a genuinely broken
   comparator. The assertion was **strengthened to order-sensitive cases and mutation-tested**: it now
   fails 4× against the inverted comparator.
2. **A false positive in my own HT4 check.** It matched `/users[\s\S]{0,4000}?timeZone: text\("time_zone"\)/`
   over the whole schema — i.e. the word *"users"* appearing anywhere within 4000 characters of the
   column — and reported a per-member split-brain **that does not exist** (there is exactly one
   `time_zone` in `shared/schema.ts`, on `households`). A gate that fires falsely is `R2` with extra
   steps. Rewritten to parse **each table's own declaration block** via the existing
   `parseObjectLiteralKeys`; it still catches a real `users.timeZone` (mutation-tested above).
3. **A wrong assertion in my own test.** It expected the epoch's fallback week to start in 1970; the
   epoch (Thu 1 Jan 1970) sits in the Monday-first week opening **Mon 29 Dec 1969**. The module was
   right and the test was wrong — corrected to assert the true span.

### 5.1 A live-environment trap, caught rather than trusted

The first end-to-end run reported `timeZone: null` after a signup that detected `Asia/Tokyo` — which
looked like a defect in the write door. It was not. **My replacement server had died with
`EADDRINUSE` and a stale process was serving the requests** — the identical failure mode `DEV1`
recorded ("*a stale pre-P4 process restarted onto the post-P4 tree*"). Re-run on a genuinely clean
port, detection landed. **Two real findings survived that noise and were fixed**: `GET /api/household`
omitted `timeZone` entirely (a correction path nobody can read is not a correction path), and the demo
signup door had no zone parameter at all. The original dev server on `:5000` was **left running** —
it was not mine to kill.

---

## 6. TEST SUITES — 15 affected suites, 0 failures

| Suite | Result | Why it is affected |
|---|---|---|
| **`test-time3-household-time`** *(new)* | **73/73** | The phase's own suite. HT5 (no clock) · zone-decides-the-date (Tokyo/London/LA + DST both ways) · HT8 (key space + Monday week coexisting, cross-checked against `getDay()`) · ISO weeks incl. the 2026→2027 year boundary · phase vocabulary **golden-identical to both live `getGreeting()` copies across all 24 hours** · `resolvePlannerWeek` totality and every relation · abuse sweep (malformed zone, 31 Feb, NaN instant) · **HT18 ratchets** · **OWN-3 GOLDEN IDENTITY over 144 dates × 3 oracles** |
| `test-seasonal-stories-engine` (WS11) · `test-stories-engine` (WS10) · `test-discovery-engine` (WS8) | **all pass** | **The three files whose season implementations were converged** — the strongest available evidence behaviour is preserved |
| `test-intelligence-household-binding` | **50/50** | Household fixture gained `timeZone: null` (the schema change makes it a required, nullable property) |
| `test-intelligence-profile-binding` | **50/50** | Shares the household/profile read path |
| `test-sec1-departed-member-eater-exposure` | **17/17** | Household membership + creation doors |
| `test-household-eater` · `test-guest-eater` | **13/13 · 17/17** | `createUser`/`createDemoUser` household creation |
| `test-home2-home-primary-action` | **47/47** | Home's time-adjacent decision model |
| `test-plan1-planner-intelligence` | **58/58** | Planner weeks (`resolvePlannerWeek`'s eventual consumer) |
| `test-intelligence-notice-engine` | **65/65** | `HT14` boundary — time triggers, INT20 decides |
| `test-dec1-decision-engine` · `test-attn1-attention-platform` | **49/49 · 29/29** | The attention stack is clock-free and stays so |
| `test-coach1-proactive-coaching` | **71/71** | Consumes seasonal/discovery output |

The suite is registered as `npm run test:time3-household-time` and **wired into the aggregate `npm test`**,
so it runs in `release:check` — otherwise the gate would exist and never fire.

---

## 7. WHAT WAS REFUSED

- **Converging any consumer.** Phase 3 = `CONV1 P6`. The Companion's UTC today (`READ-4`) and the
  freezer expiry (`BEH-6`) are still wrong, deliberately: they are P6's, and `HT11` makes a partial
  conversion worse than none.
- **Retiring the four `getGreeting()` copies.** Architecture § 14 target 3 puts them in Phase 3, and
  **INT21 owns the words** in any case. The module declares the vocabulary; it does not speak.
- **Settling the 17-vs-18 phase boundary.** Both live copies use 17 and both prototypes use 18. The
  module declares **17** — *what is already live* — so P6's convergence preserves today's behaviour
  exactly (migration principle 1: the old behaviour is the floor). Reconciling the prototypes is P6's.
- **Declaring a fourth "night" phase.** It would invent a distinction no live surface makes and force
  P6 to answer *"what does THA say at night?"* — a product decision this phase may not take.
- **Back-filling `timeZone`, or giving the column a SQL default of `Europe/London`.** Either would
  manufacture a fact indistinguishable from one the household stated (`HT7`, CP8, Core Principle 6).
  The declared default lives in the module and is applied **at read time**, never written to a row.
- **Touching `demoExpiresAt`, session lifetime, cache TTLs or the evidence window.** The five MUST-NOT
  domains are correct **because** a duration is not a date (`HT10`, CP6) — a permanent verdict, not a
  backlog. A gate now watches two of them.
- **`planner_weeks.weekStartDate`.** Phase 4 / `CONV1 P7`. `resolvePlannerWeek` therefore answers
  `anchored: false` for every household — the honest floor, and the thing the module exists to be able
  to say.
- **Adopting the pre-existing typecheck/adoption debt.** None of it is P5's, and adopting it would make
  P5's own measure unreadable (the P2/P3/P4 discipline).

## 7.1 New backlog raised by P5 (recorded, not smuggled in)

- **`seasonOfLocalDate()`** — the one surviving process-local frame read. It preserves today's
  behaviour and is **Phase 3's** retirement target. Named and dated in the code, not left to be
  rediscovered.
- **`GET /api/household` now exposes `timeZone`, but no UI reads it.** The correction path is
  reachable by API only; a Profile surface for it is a UI pass, and would sit under the Experience
  gates this phase did not engage.
- **Two `UKSeason` type declarations were collapsed into re-exports.** The `shared/canonical/`
  `UKSeasonSlug` (a different, adjacent vocabulary) was **left alone deliberately** — collapsing it
  would be the over-collapse CP6 refuses.

---

## 8. GOVERNING DOCUMENTS — corrected, not amended (CP4; Register Rule 7 not triggered)

**No ownership changed anywhere in this phase.** Only status and citation rows were corrected:

- **Source of Truth Register** — Appendix A (Household Time: *DECLARED, NOT BUILT* → **BUILT**, with
  what is still unbuilt stated plainly); Domain 16 (the zone: *"Not yet implemented"* → **BUILT**, with
  its write funnel, its no-back-fill posture and its read/correction doors); Domain 11 (the season
  rule's file citation + the convergence note and the settled decision); the Appendix listing row.
- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** — the header status line and § 17 (*DECLARED, NOT BUILT* →
  **DECLARED, AND PARTLY BUILT**), per-fact, including what remains false about the running system.
- **`docs/architecture/README.md`** — the mandatory **Architecture Bootstrap** asserted *"the module
  and both columns do not exist"*. **Corrected in the same change that made it false** — which is
  precisely the `DOC-4`/`KC14` failure this same README records two paragraphs below, where a stale
  claim sat in the Bootstrap for five days after it stopped being true.
- **`server/verification/publication-register.ts`** — the new `household-time` domain (§ 4).

---

## 9. THE REMAINING CONV1 BACKLOG

**Closed to date:** P0 (out-of-band security) · P1 (`DOC-1..4`·`OWN-5`) · P2 (`WRITE-4`·`BEH-8`) ·
P3 (`BEH-1`·`BEH-4`·`BEH-7`) · P4 (`WRITE-3`·`WRITE-2`·`OWN-1`·`READ-1`·`READ-2`·`WRITE-1`) ·
**P5 (`OWN-4`·`OWN-3`·`SCH-1`)** — **19 of 24 census items.**

| Phase | Contains | Status |
|---|---|---|
| **P6 — Household Time: T2/T3** | `READ-4` ★ → `BEH-6` ★ → `SCH-4` → the greeting ×4 | **open — recommended next.** Unblocked by P5: the zone and the module both exist |
| **P7 — The anchor** ★ | `SCH-2` | open — needs P6's consumers to exist first in practice; blocked by nothing technically |
| **P8 — The T5 convergence** | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | open — needs P7 |
| **P9 — Retire the fabricator** | `BEH-5` | open — needs `SCH-2` |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** |

---

## 10. RECOMMENDED NEXT WORKSTREAM

> **P6 — Household Time: the T2/T3 convergence (`READ-4` → `BEH-6` → `SCH-4` → the greeting ×4).**

It is the programme's own next phase, and **P5 has just cleared its entire runway**: the module exists,
the zone exists, and `anchored: false` guarantees every consumer a floor it cannot regress below.
**No anchor is needed for any of it** — these are the seven of twelve consumers that need only T1+T2,
*"the expensive step is not on the critical path for most of the harm."*

Take them in the stated order: **`READ-4` first** (the Companion's UTC today — one line, largest blast
radius), **`BEH-6` second** (the freezer expiry, *"wrong for hours every day"* — the highest user harm
in the backlog). Both are live defects today, and after P5 they are one function call from correct.

**The risk to name at P6's start is `R3`, not `R1`.** `R1` is now closed — the owner is built and a gate
watches it. But P5 built an owner with **zero consumers**, and an owner nobody imports is exactly what
`OWN-3` just spent a phase fixing. *A module with no consumers is a rival copy in waiting.* P6 is what
turns P5 from a declaration into a convergence, and it should not wait.

---

*Rollback: `rollback/CONV1-phase-p5-household-time-20260716` → `fed6dcaf`. **The tag is a true restore
point** — the preservation commit captured every previously-uncommitted change before any P5 file was
touched, so `git checkout` of the tag loses nothing of the prior sessions' work.*
*⚠️ **The migration is applied.** Reverting P5's code does not drop `households.time_zone`. That is
safe and deliberate: the column is additive and nullable, no row was rewritten, and no code outside
P5 reads it — a code-only revert leaves an unread nullable column, not a broken schema. To roll the
DATA back: `ALTER TABLE households DROP COLUMN time_zone` (299 rows hold NULL; one demo household
holds a test value).*
