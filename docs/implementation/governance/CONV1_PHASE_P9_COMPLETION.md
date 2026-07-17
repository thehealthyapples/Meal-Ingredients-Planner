# CONV1 Phase P9 — Household Time: retire the fabricator

**Workstream:** `CONV1_Phase_P9_Retire_The_Fabricator`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p9-retire-the-fabricator-20260717` → `f62b5839`
**Status:** ✅ **COMPLETE** — the single workstream (`BEH-5`) closed.
**`approxDate` is deleted, in both its copies. No date in THA is invented from a week number any more. `household-time` is 🟢 healthy at 17/17.**

> **Scope.** CONV1 Phase **P9** only. **No P10 (`SCH-3`), no offered anchor**, no unrelated
> refactoring. Implementation report — it creates no rule, and where it and any governing document
> disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**THA was telling households which day their curry night was, and the day it named was the day they
happened to open the app.**

```
approxDate = now − (weeksAgo × 7 + max(0, 6 − dayOfWeek)) days
           ⇒ reportedDay = (now.getDay() + dayOfWeek + 1) mod 7
```

Measured, from the retired builder embedded verbatim — **one household, one unchanged plan, curry
every Saturday**:

```
you open it on Sunday    → "Sunday became curry night."     ✗
you open it on Monday    → "Monday became curry night."     ✗
…
you open it on Friday    → "Friday became curry night."     ✗   ← CONV1's headline, reproduced
you open it on Saturday  → "Saturday became curry night."   ✓   ← right once, by coincidence
```

**Seven different answers to one question, from data that never changed.** The weekday carried *no
information whatever* about the household — it was a fact about the request. CONV1 grades this as
*"the peak-day index computed against the **inverted** convention"*; the truth is sharper and worse
(§ 2.1). And because `weeksAgo` came from `maxWeek ≡ 6`, *"a meal a household plans to eat next month
was timestamped five weeks in the past"* — CONV1's own words, now proven.

**It existed in two copies** (§ 14 target 5, *"2 → 0"*): a private closure in `routes.ts`, and the
module extracted **specifically to prevent that duplication**, whose docblock said so in as many
words while the closure sat six thousand lines above it, untouched.

**Both are gone.** A planner entry's date is now a **lookup** over `planner_weeks.weekStartDate`
(P7's anchor) — or it is `null`. **Where THA cannot date a household's plan, Stories says nothing.**

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`BEH-5`** — Stories tells households invented facts about their own lives | ✅ **CLOSED** | **The fabricator is deleted, twice.** `server/lib/household-history.ts` derives the date from the week's anchor + `MONDAY_FIRST_ORDER` and **reads no clock** (`now`, `maxWeek`, `weeksAgo` all gone). `routes.ts`'s private closure is retired and imports the one owner (§ 14 target 5 — **2 → 0**). **`MealEntry.date` is `Date \| null`**, with `isDated` at both engines' seams, so an undated entry is *unrepresentable* inside a story rather than something the route layer must invent. **Ratcheted ×2** (`ht-no-fabricated-dates`, `ht-stories-tell-no-undated-story` — both mutation-tested) |

### 1.1 The date is now a lookup, and it does not move

`weekStartDate` is the Monday the household's week opens on; `dayOfWeek` is the planner's declared
key space (`0 = Sunday`, **HT8**, never renumbered). The offset is the day's position in the
household's **Monday-first** week — `MONDAY_FIRST_ORDER`'s to declare, not this file's to assume.
Monday → +0; **Sunday → +6, the day the week closes** (not −1).

**The property the fabrication lacked: it does not depend on when you ask.** No clock is read,
because nothing about a household's *planned history* depends on the time of the request. That one
sentence is the whole of `BEH-5`.

### 1.2 Why `date` is nullable rather than the undated entries dropped

Dropping them was simpler and would have been wrong. `discover()` takes only `enjoys` — a list of
**food slugs**, built in the route from `entries.map(e => e.food)` — and needs no calendar at all.
Dropping undated entries would have **silenced discovery to fix a defect it never had**.

So the distinction is drawn exactly where it belongs: an undated entry still says **what** the
household plans; it says nothing about **when**. Food identity survives; only date claims go quiet.

---

## 2. THE MEASURE — re-run for this phase, never inherited (CP11)

| Signal | Baseline (measured at `f62b5839`) | **After P9** | Δ |
|---|---|---|---|
| **The phase gate — `approxDate` deleted; Stories honest** | **2 fabricators, live** | **0. Both deleted; two ratchets fail on their return** | **★ the phase gate, met** |
| `verify:publication` — `household-time` | 🟢 healthy, **15/15** | **🟢 healthy, 17/17** — two ratchets, **both mutation-tested** | **+2, both able to fail** |
| `verify:publication` — platform | 23 domains: 🟢7 · 🟡12 · 🔴4; **75 checks: 49 pass · 20 warn · 6 fail** | **23 domains: 🟢7 · 🟡12 · 🔴4; 77 checks: 51 pass · 20 warn · 6 fail** | **+2 passing; reds unchanged at 4** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt) | **32 — identical set**, diffed line by line | **0 added by P9** |
| `adoption:check` | 79 pass · 0 notices · 2 fails | **79 · 0 · 2 — the same two** | **0 added.** P9 touches no client file |
| `npm run build` | passes | **passes** | — |
| **Live data census** | — | **1194 weeks · 30 anchored · 5 anchored households** (P7/P8/P9's verification households only) | **no row rewritten** |
| Affected suites | — | **9 suites · 0 failures** (§ 5) | — |

**P9 is code-only.** No migration, no schema change, no column added or dropped, **no row rewritten**
— and **nothing back-filled** (§ 4.2 verifies this against the real household it drove). **A
`git checkout` of the tag is a complete revert.**

### 2.1 The grade that did not survive the evidence (CP11)

CONV1 grades `BEH-5`'s mechanism as *"the weekday comes from `approxDate`… **with the peak-day index
computed against the inverted convention**."*

**The "inverted convention" half is not the defect, and looking for it would have hidden the real
one.** `DAY_NAMES` is `0 = Sunday` and `Date.getDay()` is `0 = Sunday`: they agree, and
`DAY_NAMES[e.date.getDay()]` is internally consistent. There is no index inversion to fix.

**The defect is that `e.date` was never a date.** `getDay()` of a fabricated instant is a fact about
the fabrication, and the fabrication was seeded from `now`. Had P9 "fixed the inverted convention",
it would have corrected an index into a lie — *"making a fabricated date precisely wrong"*, which is
the exact failure CONV1 § 4.1 warns of when it forbids fixing Stories' timezone before the anchor.
**The grade pointed at the symptom; the sequencing rule beside it was right.**

*(What CONV1 likely saw: `max(0, 6 − dayOfWeek)` orders the week Sunday→Saturday, while the household
week runs Monday→Sunday (HT8). That ordering **is** inverted relative to the household's week — and
it is also moot, because the whole expression is now deleted.)*

---

## 3. THE GATE — MUTATION-TESTED, NOT ASSUMED (CP10)

Each new ratchet was **broken on purpose** and observed; files restored **byte-exactly** (`cmp`
verified). **6 mutations, 6 caught:**

| Mutation | Check | Result |
|---|---|---|
| `approxDate` returns **by name** | `ht-no-fabricated-dates` | 🔴 **FAIL** |
| The fabricator returns **under another name** (`now − weeks × 7` arithmetic) | `ht-no-fabricated-dates` | 🔴 **FAIL** |
| `date` is made non-nullable again — an undated entry becomes unrepresentable | `ht-stories-tell-no-undated-story` | 🔴 **FAIL** |
| The `isDated` guard is deleted | `ht-stories-tell-no-undated-story` | 🔴 **FAIL** |
| Stories stops filtering at its seam | `ht-stories-tell-no-undated-story` | 🔴 **FAIL** |
| The seasonal engine windows undated entries again | `ht-stories-tell-no-undated-story` | 🔴 **FAIL** |
| All reverted | — | 🟢 **healthy, 17/17** |

**The second mutation is the one worth having.** Forbidding the *identifier* `approxDate` would be
theatre — the next author would call it `entryDate` and ship the same arithmetic. The gate forbids
the **shape**: a clock, minus a multiple of a week index, to make a calendar position.

**And the third guards the doorway rather than the crime.** Making `date` non-nullable does not
itself fabricate anything — it makes an honest gap *unrepresentable*, which leaves the route layer
no option but to invent one. **That is how `approxDate` was born**, and it is why the type is part
of the gate.

### 3.1 P9 deleted the exemption P8 left it

P8 could not hold `routes.ts` to `ht-one-planner-week-owner`, because `buildHouseholdHistory`'s
`maxWeek` was a fabricated-date builder rather than a rival current week. It excised that function
**by name** and left an instruction in the code:

> *"WHEN P9 RETIRES approxDate, DELETE THIS BLOCK — it is the only thing standing between that
> function and this gate."*

**Deleted.** The whole of `routes.ts` is held to that gate again, and it passes — which is the
difference between a temporary exemption that is written down and one that quietly becomes
permanent.

---

## 4. VERIFIED AGAINST THE RUNNING APPLICATION

### 4.1 The one test that could fail — and did not

Driven against a **real household with 337 real planner entries**, on a verified-free port
(`:5601`, listener ancestry confirmed to descend from the process this session started; zero
`EADDRINUSE`; the pre-existing servers on `:5000` and `:5199` left running — **pid 15555 is now
3h33m old**, the same stale process P6 first named, and still not mine to kill).

**The same household. The same plan. The only variable is the anchor:**

```
── UNANCHORED — one of the 192 (their weeks predate the anchor) ──
  planner entries in history : 337
  …dated                     : 0
  …undated (honest gap)      : 337
  story sections             : 0
     (silence — THA cannot date this household's plan, so it says nothing)

── THE SAME HOUSEHOLD, THE SAME PLAN, now ANCHORED ──
  planner entries in history : 337
  …dated                     : 337
  story sections             : 4
     • "olive oil became a household favourite."
     • "Your household discovered: Mushrooms, Spinach, Extra Virgin Olive Oil, …"
     • "Sunday became thai prawn curry night."
     • "Summer became: olive oil, Eggs, Spinach."
```

**"Sunday became thai prawn curry night" is TRUE** — the household planned it on `dayOfWeek = 0`,
and the date resolves to **2026-08-02, which is the Sunday of the week opening Mon 27 July**.
Before today the same sentence would have named whatever day the request arrived on.

> **The silence and the stories are the same code.** That is what makes the silence evidence rather
> than breakage: switch the anchor on and the identical 337 entries produce four sections; switch it
> off and they produce none. **Stories only ever spoke because it was making the dates up.**

### 4.2 Nothing was back-filled, and that was checked

The anchoring above ran inside a transaction that was rolled back. Verified afterwards, against the
real household:

```
user 1 (the real household I drove): 6 weeks · 0 anchored → ✓ CLEAN — the rollback held
platform: 1194 weeks · 30 anchored · 5 anchored households (verification households only)
```

**P9 back-fills nothing** (HT7). The 192 remain honestly unanchored.

---

## 5. TESTS — 9 affected suites, 0 failures

| Suite | Result |
|---|---|
| **`test-time3-p9-retire-the-fabricator`** *(new)* | **34/34** |
| `test-time3-household-time` · `test-time3-p6-consumer-convergence` | **73/73 · 107/107** |
| `test-time3-p7-planner-week-anchor` · `test-time3-p8-t5-convergence` | **51/51 · 62/62** |
| `test-intelligence-notice-engine` · `test-intelligence-platform` | **65/65 · 33/33** |
| `test-plan1-planner-intelligence` · `test-intelligence-context-composition` | **58/58 · 166/166** |

Registered as `npm run test:time3-p9-retire-the-fabricator` and **wired into the aggregate
`npm test`**.

### 5.1 The technique: the fabricator is its own oracle

The retired builder is embedded **verbatim** and executed:

- **Seven request-days → seven different "traditions"**, from one unchanged plan.
- **The algebra is asserted, not asserted-about**: across all 49 `(now.getDay(), dayOfWeek)` pairs,
  `reportedDay === (now.getDay() + dayOfWeek + 1) mod 7`. The weekday *was* the request.
- **The silence is proven honest**: 12 undated entries → 0 stories; **the same 12, dated** → stories.
  A mixed household gets *exactly* the cards its dated half supports — **the undated half cannot
  inflate a count, a tier or a tradition**.
- **What survives is proven to survive**: Looking Ahead still fires for an unanchored household,
  because `enjoys` needs no calendar.

---

## 6. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Three, all caught before they landed.

1. **My own test re-implemented the function under test — in the phase about retiring a duplicate.**
   The first draft copied `plannerEntryDate` into the suite rather than importing it, and **the copy
   immediately drifted**: it used `split("-").map(Number)` and returned an Invalid Date for malformed
   input, where the real function asks `parseCivilDate` and answers `null`. The suite failed, and it
   was right to. **A test that re-implements its subject is the same defect wearing a lab coat** — so
   `plannerEntryDate` is now exported and the suite exercises the real one. *Recorded because the
   irony is the lesson: `BEH-5` exists because someone copied a derivation rather than importing it.*
2. **A live verification fixture that could not fail.** The first run created two fresh households,
   planned nothing (new households have no meals), and reported `0 entries · 0 stories` for both —
   which "passed" and proved nothing. **P6 § 5.1's trap, one phase on.** Re-run against a real
   household with **337 real entries**, toggling only the anchor.
3. **`isDated(e) && inWindow(...)` inside a `.filter()` does not narrow.** TypeScript returned
   `MealEntry[]`, and `aggregateSeason` then read a possibly-null `.date` — the compiler caught it.
   Fixed with a type predicate (`(e): e is DatedMealEntry`) rather than a cast, so the guarantee is
   carried by the type rather than by my assurance.

---

## 7. WHAT WAS REFUSED

- **P10 (`SCH-3`)** — no column type changed.
- **The offered anchor** — **the recommended next workstream and the whole programme's bottleneck**,
  and a product decision. P7, P8 and now P9 have each declined to take it.
- **Any back-fill** (§ 4.2). The 192 stay unanchored; their entries are honestly undated.
- **Inventing a "good enough" date.** A week's midpoint, the week's Monday for every day, the
  creation timestamp — each would have kept Stories talking, and each is `approxDate` with better
  manners.
- **Fixing "the inverted convention"** (§ 2.1) — it would have made a fabricated date precisely
  wrong.
- **`user_streaks.weekStartDate`** — the sixth private week (§ 14 target 6). Not `BEH-5`'s.
- **`seasonOfLocalDate()` ×7 assemblers, `product_history.scannedAt`, `user_health_trends.date`** —
  the unclaimed remainder; none is a fabrication.
- **Adopting the pre-existing typecheck/adoption debt** — none of it is P9's.

---

## 8. NEW BACKLOG RAISED BY P9

- **★ Stories is now silent for 192 of 195 households**, and that is `HT7` working as designed — but
  it means **a shipped feature reaches almost nobody**. It is the same bottleneck P8 named: the
  offered anchor. **Stories is the strongest argument yet for asking**, because it is the one place
  the anchor buys something a household can *see*.
- **`MealEntry.date` is nullable and no producer of `source: "logged"` exists yet.** The diary path
  (which would always be dated) is unbuilt; the contract is stated in the type for whoever builds it.
- **The `window-expired` state is still computable and still unsurfaced** (carried from P7/P8).

---

## 9. GOVERNING DOCUMENTS — corrected, not amended (CP4; Register Rule 7 not triggered)

**No ownership moved, and no rule changed.** P9 deletes a fabrication; it invents nothing. Every
edit is a status correction made **in the same change that made the old text false**:

- **`docs/architecture/README.md`** — the mandatory Bootstrap listed `approxDate` under *"What is
  NOT converged"*.
- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** — the header; § 17's T5 row; **§ 14 target 5 → ✅ DONE**
  (*"2 → 0"*, with the measured defect named); § 14's closing note — **every fabricated date in THA
  is now gone, and what remains on that list invents no fact, it duplicates one**.
- **Source of Truth Register** — Appendix A's *"still live"* sentence; the gate 15 → **17**.
- **`server/verification/publication-register.ts`** — two ratchets, and **P8's excision deleted**
  (§ 3.1).
- **`server/lib/household-history.ts`** — its docblock claimed `date` was *"the same deliberate
  approximation it has always been… the engines downstream use it only for recency ordering."*
  **Every clause was false** and is corrected at the point of definition.

**Not amended:** the Experience canon is **byte-untouched**. **TIME3 § 13.1 needed no further
amendment** — P8 amended it to admit the honest-absence case, and P9 is that amendment's second
consumer: *when a consumer's pre-convergence behaviour was itself an invented answer, the floor does
not protect it.* Stories' silence is that rule, applied.

---

## 10. THE REMAINING CONV1 BACKLOG

**Closed to date:** P0 · P1 · P2 · P3 · P4 · P5 · P6 · P7 · P8 · **P9 (`BEH-5`)**.

| Phase | Contains | Status |
|---|---|---|
| **P10 — The long game** | `SCH-3` | **open — the last engineering phase in the programme** |
| **P—** | `OWN-2` · `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** (`OWN-2` moved there by P8) |
| **Unclaimed remainder** | `seasonOfLocalDate()` ×7 · `product_history.scannedAt` · `user_health_trends.date` · `dayOfYear` · `user_streaks.weekStartDate` · the remaining week-shapes | open — needs no anchor; cheap; **none is a fabrication** |
| **Not a CONV1 item** | **The offered anchor** (TIME1 § 6.2) | **open — a product decision, and the bottleneck for the entire programme's value** |

---

## 11. RECOMMENDATION FOR P10

> **`SCH-3` is the right phase to run, and it should be run knowing it changes nothing a household
> can see.**

**What it is.** `verify:schema-coverage` reports **51%**: *"45 of 91 declared tables have no reviewed
migration — the schema cannot rebuild itself."* The target is 100%. It is the last engineering phase
in CONV1, it is blocked by nothing, and it is a **trust and recoverability** item, not a household
one.

**Three things to carry into it:**

1. **It is the opposite kind of work to P5–P9, and the discipline must invert with it.** Those five
   phases each ended a claim THA was making to a household. `SCH-3` makes **no** claim honest — it
   makes the platform **rebuildable**. Judge it by *"could we restore production from an empty
   database?"*, never by user impact, or it will look like the least valuable phase in the programme
   and be deferred forever.
2. **The `R2` risk applies squarely.** A gate that has read 51% since it was built teaches the team
   that red is the normal colour. **The cheapest honest win is to make that number move**, and it
   moves table by table — so it is a phase that can be run incrementally and reported truthfully at
   any point.
3. **The precedent P7 set is the one to follow**: additive, reviewed migrations in
   `server/migrations/runner.ts`, each asserting in its own comment what it must never do. `SCH-3`
   touches **existing** tables, so `R7` is its live risk — *"the scaffolding is deleted first,
   because it looks like obvious debt"*. **A migration that drops or retypes a column holding live
   data must refuse rather than proceed**, exactly as `CONV1 P4`'s `retire_users_diet_columns` did.

**But the higher-value ask is not an engineering phase at all.** P7 built the anchor; P8 gave it
consumers; **P9 has now made Stories tell the truth, and the truth is silence for 192 of 195
households.** Everything the Household Time programme built is in place and **almost no household can
see any of it**, because their planner weeks predate the anchor and `HT7` rightly forbids inventing
one. **One offered, never-forced question — *"Is this week beginning Monday 20 July?"* — converts the
whole programme from correct to visible.** It needs no schema, no migration and no legal review. It
needs a decision.

---

*Rollback: `rollback/CONV1-phase-p9-retire-the-fabricator-20260717` → `f62b5839`. The preservation
commit captured every previously-uncommitted change before any P9 file was touched — **including
CONV1 P8's completed deliverables**, which were still uncommitted.*

> ⚠️ **A concurrent session's work is in this tree** (client/, `north2-home` captures), committed at
> `f62b5839` and untouched by this session. **P9 touches no client file** — its whole surface is two
> `shared/` engines, one `server/lib/` module, `routes.ts`, the gate, and docs.

*✅ **P9 is code-only.** No migration, no schema change, no column added or dropped, no row rewritten,
nothing back-filled. Reverting the code reverts the phase completely, with nothing left behind in the
database.*
