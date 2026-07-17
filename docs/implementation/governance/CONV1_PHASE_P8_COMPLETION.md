# CONV1 Phase P8 — Household Time: the T5 convergence

**Workstream:** `CONV1_Phase_P8_T5_Convergence`
**Date:** 2026-07-17
**Rollback identifier:** `rollback/CONV1-phase-p8-t5-convergence-20260717` → `5c4611e8`
**Status:** ✅ **COMPLETE — four of five workstreams closed.** `READ-3` · `OWN-6` · `BEH-3` · `BEH-9`.
**`OWN-2` is REFUSED with evidence: it is behind the same legal gate as `SEC-5`, and CONV1 grades it as unblocked** (§ 8). Named as a deviation, not quietly skipped.
**The five rival "current weeks" are one. `household-time` is 🟢 healthy at 15/15.**

> **Scope.** CONV1 Phase **P8** only. No P9+ work — **`approxDate`/`BEH-5` is untouched**. No
> unrelated refactoring. Implementation report — it creates no rule, and where it and any
> governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**P7 built a fact. P8 gave it consumers — and the fact turned out to say "I don't know" to almost
everyone.**

```
planner_weeks : 1170 weeks · 18 anchored
households    : 195 total · 3 anchored · 192 UNANCHORED FOREVER (HT7)
```

**The only three anchored households are the ones P7 created to verify itself.** `HT7` is absolute
— the anchor is written only at week creation and never back-filled — and every real household's
weeks were created before it existed. `createPlannerWeeks` returns existing weeks untouched, so
**they can never become anchored**. The convergence is real, it is gated, and its honest output for
**98% of households** is *"THA does not know which week this is."*

**The five rivals were never computations.** Three server `max(weekNumber)` variants ≡ **the
constant 6** (all six weeks are created eagerly at first touch and the API bounds them at 6); the
dashboard's `plannerFull[0]` ≡ **1** (a fact about array order); Home's `localStorage` ≡ **1**
(`if (!raw) return 1`). *"A constant wearing the costume of a computation."* They are one now:
`server/lib/household-planner-week.ts`, published once, read through one hook.

**`BEH-3` was never fixable by picking a week, and P8 did not pick one.** Home rendered Week 1's
meals twenty-one lines above Week 6's plant count — one component, one screen, one paint, and it
**did not agree with itself**. The fix is not choosing the right rival; it is **having one answer**:
two cards reading one field cannot disagree, whatever that field says. Where the answer is "I don't
know", Home says so.

**And two CONV1 grades did not survive contact with the code.** `BEH-9` reads *"Home has no primary
action"* — **Home has one**, hand-rolled hours earlier by the concurrent `NORTH1` session and aimed
by `localStorage`, *precisely* what HOME3 § 4 refused. `OWN-2` reads *"Not blocked by the § 5 legal
gate"* — **it is blocked by it**, transitively, and its stated user impact is already false.

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | What actually changed |
|---|---|---|
| **`READ-3`** — five rival "current weeks" | ✅ **CLOSED** | **`server/lib/household-planner-week.ts`** — a thin I/O orchestrator over the pure `resolvePlannerWeek` (the split this codebase already uses for the opportunity engine and the nutrition assembler). It owns **no rule** and **no data**: it fetches the two facts and asks the owner. Published once at **`GET /api/planner/current-week`**; read by one hook. All five retired: `routes.ts` weeklyProgress, `opportunity-engine.ts`, `household-nutrition-assembler.ts`, `dashboard.tsx`, `home-experience-page.tsx`. **Ratcheted** (`ht-one-planner-week-owner`, mutation-tested) |
| **`OWN-6`** — `planner:active-week` in `localStorage` | ✅ **CLOSED** | Home reads the owner. `loadActiveWeek()` and `ACTIVE_WEEK_KEY` are **gone from Home**. **The key survives on the planner page and that is correct, not an omission**: there it means *"which week am I editing"* — device-local **view** state, which is nobody's idea of a household fact. `OWN-6` was about Home reading it as **the current week**, and that reading is gone. *"It cannot be fixed by seeding it — `localStorage` is not household state"* (HOME3 § 4) |
| **`BEH-3`** — Home rendered Week 1 beside Week 6 | ✅ **CLOSED** | Every Home **and** Dashboard card resolves from **one** resolution, so they cannot disagree by construction. Where it answers `anchored:false`, both surfaces render **the Unanchored state** (§ 3) rather than a fallback. **Ratcheted** (`ht-unanchored-is-never-filled-in`, mutation-tested) |
| **`BEH-9`** — Home's door | ✅ **CLOSED** *(re-graded — § 2.1)* | Converged onto HOME2's **`resolveHomePrimaryAction`** — **its first production consumer, ever**. The resolver decides the **tier** and the **destination** from household facts; the **words stay client-side** and remain INT21's open item (§ 9 / CP3) — P6's discipline, one phase on: *converge the decision, leave the voice*. `week: null` when unanchored falls to the floor and still returns exactly one action (HOME3 § 6), so **the door survives for all 192 without anyone inventing a week for it**. **Ratcheted** (`ht-home-door-is-the-resolvers`, mutation-tested) |
| **`OWN-2`** — household composition at the wrong scope | ❌ **REFUSED — behind the legal gate** | § 8. The scope defect LIFE1 § 5 names is **real and unfixed**; the work is **not available** without a legal answer, and CONV1's dependency row is corrected |

### 1.1 A live off-by-one, fixed because `HT11` forbade leaving it

The dashboard's `DAY_LABELS` is **Monday-first**; `planner_days.dayOfWeek` is **Sunday-first**
(`0 = Sunday`, the declared key space). It indexed one against the other **positionally**, so
`days[0]` — **Sunday** — was rendered under **"Mon"**, for every household, live. TIME1 § 3.2
reported it and did not fix it.

**Fixing the week and leaving the days would have been `HT11`'s half-convergence** — *"a consumer
that takes T2 from the module but keeps its own week arithmetic compares the household against two
calendars at once"* — and it would have been worse than before: the **right** week's meals under the
**wrong** days is a confident lie where there had been a confused one. `MONDAY_FIRST_ORDER` is the
owner's declared shape (§ 14 target 2, *"declared and unconsumed"*), and **this is its first
consumer**.

---

## 2. THE TWO GRADES THAT DID NOT SURVIVE THE EVIDENCE (CP11)

### 2.1 `BEH-9` — "Home has no primary action" is false, and the truth is sharper

CONV1: *"`home-experience-page.tsx:179-397` — **no primary action**… Home's Experience Test question
3 is answered by the canon and unanswered by the code."*

**Home has a door.** `home-experience-page.tsx:727` — `<Button data-testid="button-home-primary">` —
built by the concurrent `NORTH1_Home_Implementation` session **hours before this phase started**.
The grade was true when CONV1 was written and stopped being true on 2026-07-17.

**The real defect is worse than the one CONV1 recorded**, and it is exactly the one HOME3 predicted:

```ts
const primaryLabel = todaysMeals.length === 0 ? "Plan today" : "Open today's plan";
//                   └── todaysMeals ← activeWeek ← localStorage
```

- It is a **rival implementation of a canonical owner**. `shared/home/home-primary-action.ts` was
  built, proven total, given **47 passing tests** — and had **zero production consumers**. That is
  `R3`'s shape for the third time in this programme (*"a module with no consumers is a rival copy in
  waiting"*), and the rival duly arrived.
- **It was aimed by `localStorage`** — which HOME3 § 4 refused **by name**: *"Device-local, so the
  door would differ between a household's phone and laptop for identical household state — breaking
  HOME2 § 6.1's theorem (**the door changes when the household's state changes**) at its root."*

> **HOME3 said the door must not be aimed until a week means something. NORTH1 aimed it anyway, at
> the one thing HOME3 named as unaimable.** `BEH-9` is therefore a **convergence, not a build** —
> which is a different phase of work than CONV1 scheduled, and cheaper.

### 2.2 `OWN-2` — "Not blocked by the § 5 legal gate" is false

See § 8. It is blocked, transitively, by the **same** gate as `SEC-5`.

---

## 3. THE GOVERNANCE DECISION P8 COULD NOT TAKE ALONE — AND DID NOT

**Fixing a self-contradiction logically requires changing one of the two contradicting sides.** With
192 of 195 households permanently unanchored, that choice decides what **every real household** sees.
Two governing rules pointed opposite ways:

| | |
|---|---|
| **TIME3 § 13.1** | *"`anchored: false` means the caller keeps **exactly today's behaviour**… **Nothing regresses, ever.**"* → keep Week 1 meals **and** Week 6 plants → **the contradiction survives forever** |
| **`BEH-3`** | *"**Do not pick a week to fix it**"* — HOME3 § 4 refused both candidates → **no fallback is legitimate** |

**It was put to the user on 2026-07-17 and decided — and the decision was none of the three options
offered:**

> **Option C — the explicit "Unanchored Home". Do not invent or floor a planner week.**
> - Home must never imply certainty where none exists.
> - There must be one canonical owner of time.
> - **Every Home card must resolve from the same canonical planner state.**
> - If no anchor exists, Home honestly communicates that the planner is not yet anchored, rather
>   than mixing data from different fallback weeks.
> - **This is not an error state** — it is the expected first-run experience until a canonical
>   anchor exists.

### 3.1 The conflict was named, not lawyered around — and the architecture was amended

**The decision makes TIME3 § 13.1 false, so P8 amends it** (CP4). Leaving the code to contradict the
governing document would guarantee the next implementer "fixes" it back.

**Why § 13.1 had to give:**

1. **It was already in tension with `OWN-6`, independently of this decision.** Home's "today's
   behaviour" for meals **was** `localStorage` — and `OWN-6` retires it. **You cannot retire the
   floor and stand on it.** Something had to change on Home the moment `OWN-6` was scheduled.
2. **Its purpose is to protect *correct* behaviour** (*"if `anchored: false` meant 'show nothing',
   the Foundation would blank the product"*). Home's Week 1 meals are not correct behaviour being
   protected — **they are the fabrication `BEH-3` reports.**

**The amendment, in one line:** *when a consumer's pre-convergence behaviour was itself an invented
answer, the floor does not protect it — the consumer states the absence honestly instead.* Its scope
is fenced: **it is not licence to blank a surface** (an honest state is rendered, calm and
first-class), **it is never an excuse to pick a week**, and **a consumer whose old behaviour was
correct still keeps it** — which is why P6's freezer, diary and greeting are untouched here.

### 3.2 The Unanchored Home is not an empty state

Every consumer's honest-absence shape **already existed**, which is the clearest evidence available
that absence was always the right answer:

| Consumer | Its honest shape — and who wrote it |
|---|---|
| `/api/home/intelligence` | **`weeklyProgress: null`** — *already* this route's shape for "no weekly picture" |
| `household-nutrition-assembler` | **`UNAVAILABLE`** — *already* its shape for "the household has told THA nothing… silence, never a zero score" |
| `opportunity-engine` | **no planner opportunity** — *already* its honest degrade for an unreadable planner |
| Home / Dashboard | **the Unanchored state** — new; the one shape that did not exist |

**Home does not say "you have planned nothing."** It says the planner isn't linked to the calendar,
that the plan is all still there, and it keeps the door open. Saying *"Today is open"* to a household
who planned all seven days is the fabrication this phase retires.

---

## 4. THE MEASURE — re-run for this phase, never inherited (CP11)

Every "before" was **measured at the rollback tag in a throwaway worktree during this session**.

| Signal | Baseline (measured at `5c4611e8`) | **After P8** | Δ |
|---|---|---|---|
| **The phase gate — five current weeks → one** | **five rivals**, none a computation | **one owner; a sixth fails the gate** | **★ the phase gate, met** |
| `verify:publication` — `household-time` | 🟢 healthy, **12/12** | **🟢 healthy, 15/15** — three ratchets, **all mutation-tested** | **+3, all able to fail** |
| `verify:publication` — platform | 23 domains: 🟢7 · 🟡12 · 🔴4; **72 checks: 46 pass · 20 warn · 6 fail** | **23 domains: 🟢7 · 🟡12 · 🔴4; 75 checks: 49 pass · 20 warn · 6 fail** | **+3 passing; reds unchanged at 4** |
| `verify:coherence` | PASS | **PASS** | 0 added |
| `typecheck:ci` | **32** regressions (pre-existing debt) | **32 — identical set**, diffed line by line | **0 added by P8** |
| `adoption:check` | **76 pass · 0 notices · 2 fails** (measured at the tag) | **79 pass · 0 notices · 2 fails** — the same two, neither P8's | **+3 passing; 0 added.** P8 added **zero** raw `<button>` |
| `npm run build` | passes | **passes** | — |
| **Live data census** | — | **195 households · 3 anchored · 192 unanchored forever** | **the phase's headline** |
| Affected suites | — | **13 suites · 0 failures** (§ 6) | — |
| `repo-structure-verify.sh` | FAIL (pre-existing) | **FAIL — the same three categories** | 0 added |

**P8 is code-only.** No migration, no schema change, no column added or dropped, **no row rewritten**
— *because `OWN-2`, the one workstream that would have needed a migration, was refused* (§ 8). **A
`git checkout` of the tag is a complete revert**, with nothing left in the database.

---

## 5. THE GATE — MUTATION-TESTED, NOT ASSUMED (CP10)

Each new ratchet was **broken on purpose** and observed; files restored **byte-exactly** (`cmp`
verified). **6 mutations, 6 caught:**

| Mutation | Check | Result |
|---|---|---|
| **A sixth rival returns** — the assembler goes back to `reduce(max weekNumber)` | `ht-one-planner-week-owner` | 🔴 **FAIL** |
| The dashboard's `plannerFull[0]` returns | `ht-one-planner-week-owner` | 🔴 **FAIL** |
| Home reads `planner:active-week` again (`OWN-6` undone) | `ht-one-planner-week-owner` | 🔴 **FAIL** |
| **A consumer fills the gap in with `?? 1`** — the temptation the decision forbids | `ht-unanchored-is-never-filled-in` | 🔴 **FAIL** |
| Home hand-rolls its door again (`BEH-9` undone) | `ht-home-door-is-the-resolvers` | 🔴 **FAIL** |
| Home derives the day from the device again (`HT12`) | `ht-home-door-is-the-resolvers` | 🔴 **FAIL** |
| All reverted | — | 🟢 **healthy, 15/15** |

**`ht-unanchored-is-never-filled-in` is the gate that matters**, because it guards a *decision*
rather than a mechanism. `anchored: false` is the ordinary answer for 98% of households, and `?? 1`
is a one-line "fix" that looks like defensive coding. It is how the platform grew five rivals.

**The gate excises `buildHouseholdHistory` BY NAME, not by a file-wide exemption.** That function's
`maxWeek` orders the rota to **fabricate a date** — it is `approxDate`, `BEH-5`, **P9's** — and
converging it before the fabricator is retired would make a fabricated date *precisely* wrong,
*"the worst outcome available"* (CONV1 § 4.1). Excising it by name means **a genuine rival appearing
elsewhere in `routes.ts` is still caught**, and the block carries its own deletion instruction for
P9. *(The first draft exempted the whole file and I narrowed it — § 7.)*

---

## 6. TESTS — 13 affected suites, 0 failures

| Suite | Result |
|---|---|
| **`test-time3-p8-t5-convergence`** *(new)* | **62/62** |
| `test-time3-household-time` · `test-time3-p6-consumer-convergence` · `test-time3-p7-planner-week-anchor` | **73/73 · 107/107 · 51/51** |
| **`test-home2-home-primary-action`** | **47/47** — the resolver `BEH-9` finally consumes |
| `test-intelligence-planner-binding` · `test-planner-compliance` · `test-plan1-planner-intelligence` | **31/31 · 25/25 · 58/58** |
| `test-intelligence-food-opportunity-binding` · `test-intelligence-opportunity-delivery-binding` | **40/40 · 60/60** |
| `test-intelligence-platform` · `test-intelligence-notice-engine` · `test-intelligence-profile-binding` | **33/33 · 65/65 · 50/50** |

Registered as `npm run test:time3-p8-t5-convergence` and **wired into the aggregate `npm test`**.

### 6.1 The technique: the five rivals are the oracle

Each retired rival is embedded **verbatim** and then shown to be a **constant**:

- **`retiredRoutesWeek(shuffled) === 6`** — the rota can say anything and it does not move.
- **`retiredDashboardWeek` was RIGHT on 17 July — by coincidence.** It is week 1 because 1 is the
  first row, not because it is their week. **A month on, the coincidence is gone and it is wrong.**
  That is the difference between a constant and a computation, stated as a test.
- **`BEH-3` is reproduced exactly** — `homeMealsWeek === 1 && homePlantsWeek === 6` — and then shown
  **unrepresentable**: two cards reading one field agree by construction, not by care.
- **The zone test can fail**: at `2026-07-19T23:30Z` London is living in **week 2** while New York is
  still in **week 1** — one instant, one rota, different weeks.

---

## 7. DEFECTS FOUND IN MY OWN WORK, BY THE DISCIPLINE (Principle 6 / CP11)

Five, all caught before they landed.

1. **My own gate failed on my own code, correctly, and I nearly excused it too broadly.**
   `ht-one-planner-week-owner` fired on `routes.ts` — `buildHouseholdHistory`'s `maxWeek`, which is
   **P9's fabricator**, not a rival current week. My first exemption was `file === "routes.ts" &&
   /weeksAgo/.test(code)` — a **file-wide** blind spot that would have hidden a real sixth rival
   forever. Narrowed to excising that one function **by name**. *(The exemption was also silently
   broken: `pattern.source` contains `Math\.max`, escaped, so `.includes("Math.max")` was always
   false — the gate was right for the wrong reason and I only found out by reading it.)*
2. **A malformed Adoption Register entry — the same class P6 recorded, one phase on.** I claimed
   `loadActiveWeek` and `new Date().getDay()` as **retired**, and the gate fired: they are **not
   gone repo-wide** (the planner page's view state, two dev prototypes, `routes.ts`) — and my own
   *comments* naming them tripped the grep. A `retired` entry is a promise a pattern never returns
   **anywhere**; it may only hold what is genuinely gone. Corrected to `plannerFull[0]` alone, with
   the survival recorded in `openMigration` and Home's reading gated by the instrument that can tell
   **where** a pattern appears.
3. **I hand-edited the register's prose.** `ADOPTION_REGISTER.md` drifted from its JSON and the
   gate failed: *"the register's prose and its data have one owner; they may never disagree."*
   Regenerated with `npm run adoption:record`, never by hand.
4. **A broken template literal in a gate's own message** — nested backticks inside a `` ` `` string
   (`TS1005`). Caught by typecheck. A gate that cannot compile is not a gate.
5. **`resolveFromFacts` first returned the module's resolution unchanged**, dropping the household's
   `today`. That would have forced every caller to recompute the day — re-creating the exact
   `HT11` split (the week from the household, the day from the device) that this phase exists to
   close. The day now ships **with** the week, from one resolution.

---

## 8. `OWN-2` — REFUSED, WITH EVIDENCE

**CONV1's convergence strategy is not implementable, and its dependency row is wrong.** Verified at
source and against live data:

1. **There is nothing to derive from.** CONV1: *"Derive from eater rows; retire the columns… **a
   projection over rows, never a column** (CP7)."* **`household_eaters` carries no age or life-stage
   fact** — confirmed in the schema *and* the live database: `id, household_id, display_name,
   user_id, default_diet_types, hard_restrictions`.
2. **The one proxy that ever looked like one is not one — and is already renamed.** CONV1's stated
   user impact is *"two eaters typed `kind: "child"` in one context block"*. **That is already
   false.** `kind` was `row.userId != null ? "user" : "child"`; it meant ***has no account*** and
   never age (LIFE1 § 6 — *"a live-in parent, a grandparent, a lodger… each is typed `child`"*), and
   **`CONV1 BEH-1` renamed it to `"account" | "no-account"` in P3**. Counting it would tell the
   language model that a grandparent is a child.
3. **Supplying the missing fact is behind a legal review.** It is **LIFE1 Step 2** —
   `household_eaters.birthYear`/`.birthMonth` — whose stated precondition is **§ 12.1 legal
   review**, and **LIFE1 § 13's table makes Step 3 (= `OWN-2`) depend on Step 2**:
   > *"Children's data is a legal and product question with a regulatory surface (UK GDPR), and an
   > engineering investigation has no authority to decide it… **A birth date collected before § 12.1
   > is answered is a minor's personal data gathered without a governing position on minors' personal
   > data** — and unlike every other finding in this document, that one is **not reversible by
   > dropping a column**."*
4. **Retiring the columns now would destroy live data with no destination.** Measured: **166 of 211
   `user_preferences` rows hold non-default counts.** That is **`R7`'s exact shape** — *"the
   scaffolding is deleted first, because it looks like obvious debt."*

> **→ CONV1's `OWN-2` row must be corrected.** *"Dependencies: … **Not blocked by the § 5 legal
> gate**"* is false: it is blocked by the **same** gate as `SEC-5`, transitively, via LIFE1 Step 2 —
> **which CONV1 itself cites as `OWN-2`'s source** (*"LIFE1 Step 3 = PEOPLE1 Step 6 — one item, two
> authors"*). And `R10` is the risk it walks into: *"`SEC-5` is answered by an engineer because it
> blocks a column."*

**The scope defect LIFE1 § 5 names is real and remains unfixed**: household composition is a Domain
16 fact living at Domain 27's **user** scope, so two adults in one household hold private,
divergent `childrenCount`s — *"the split-brain `HT4` rejected, already live, already shipped, and
already the platform's only composition signal reaching the model."* **What is available without a
legal answer is a scope move** (`user_preferences` → `households`), which **CONV1's own strategy
forbids** (CP7 — *"a projection over rows, never a column"*). **That is a decision for the user, not
a refactor for me.**

---

## 9. WHAT WAS REFUSED

- **`OWN-2`** — § 8.
- **`BEH-5` / `approxDate`** — **P9**, untouched. Its `maxWeek` is excised from the gate by name, and
  the gate carries the instruction to delete that exemption when P9 lands.
- **Any fallback week.** No `?? 1`, no `latest`, no `max(weekNumber)` — the user's decision, `BEH-3`
  by name, and a gate that fails.
- **The offered/declared anchor** (TIME1 § 6.2) — **the only honest route to fixing the 192**, and a
  product decision explicitly outside P8's row. **It is the recommended next workstream** (§ 12).
- **`user_streaks.weekStartDate`** — the *sixth* private week, on a different table. `OWN-2`/`BEH-9`'s
  siblings; recorded, not swept in.
- **The planner page's `planner:active-week`** — view state, not a household fact. Retiring it would
  have broken a working control to satisfy a grep.
- **Adopting the pre-existing typecheck/adoption/repo-structure debt** — none of it is P8's.

---

## 10. NEW BACKLOG RAISED BY P8

- **★ 192 of 195 households can never be anchored.** The convergence is complete and **almost nobody
  sees a week**. This is not a defect in P7 or P8 — it is `HT7` working exactly as designed — but it
  means **the value of the whole Household Time programme is now gated on one product decision**:
  whether THA offers the household the chance to *declare* their week.
- **The `window-expired` state is now computable and nothing surfaces it** (carried from P7; TIME1
  § 15.1 left it open).
- **`user_streaks.weekStartDate` is a sixth private week**, written from a rival Monday.
- **The dashboard's `DAY_LABELS` rotation is fixed; the other week-shape rivals are not** (§ 14
  target 2 — the planner page still declares its own `MONDAY_FIRST_ORDER`).
- **Home's state sentences are still client-side strings** — INT21 § 9's `CP3`. P8 added one
  (*"Your planner isn't linked to the calendar yet"*) in the same idiom as the grandfathered ones,
  because the decision required Home to *say* something. **Recorded as CP3 debt, not precedent.**
- **Four verification households now exist in the dev database** (P7's three plus P8's two, one of
  which had its anchors deliberately **removed** — the reverse of a back-fill — to reproduce the
  192's state honestly).

---

## 11. GOVERNING DOCUMENTS — one amendment, the rest corrections (CP4)

**One amendment, and it is named as such:**

- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md` § 13.1 — AMENDED** by governed amendment (§ 3.1), because
  **P8 is the change that made it false**. *"Nothing regresses, ever"* → *"Nothing **correct**
  regresses, ever"*, with the honest-absence case admitted, fenced, and its scope stated.

**No ownership moved. Register Rule 7 is not triggered.** Everything else is a status correction made
**in the same change that made the old text false**:

- **`docs/architecture/README.md`** — the mandatory Bootstrap said the T5 consumers *"now have an
  anchor to read and **not one of them reads it yet**"*.
- **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** — the header; § 17's T5 row (*"still read their own
  private clocks"* → **✅ CONVERGED**); § 14 target 1 (→ **DONE**, with the `buildHouseholdHistory`
  exemption named) and target 2 (*"declared and unconsumed"* → **its first consumer, and the live
  rotation it fixed**); § 14's closing note.
- **Source of Truth Register** — Domain 14's anchor row (**✅ CONSUMED**, with the owner, the door,
  the hook and the 192 named); Appendix A (**`R3` closed for the anchor**; the gate 12 → **15**).
- **`server/verification/publication-register.ts`** — three ratchets (§ 5).
- **`docs/implementation/ux/adoption-register.json`** — the `household-planner-week` concern (owner,
  floor 2, a **rival ceiling of 0**, the retired `plannerFull[0]`, and the offered anchor named as
  the open migration with its owner). `ADOPTION_REGISTER.md` **regenerated, never hand-edited** (§ 7).
- **`opportunity-engine.ts`** — its doc comment claimed *"planner has no calendar date field to
  compute this from any other way"*. **P7 made that false**; corrected here.

**Not amended:** the Experience canon is **byte-untouched**. `HT13` was not engaged — P8 aims words
and doors, **never light**. NORTH1's visual language on Home is preserved: only the **facts** were
re-sourced.

---

## 12. THE REMAINING CONV1 BACKLOG, AND THE RECOMMENDATION

**Closed to date:** P0 · P1 · P2 · P3 · P4 · P5 · P6 · P7 · **P8 (`READ-3`·`OWN-6`·`BEH-3`·`BEH-9`)**.

| Phase | Contains | Status |
|---|---|---|
| **P9 — Retire the fabricator** | `BEH-5` | **open — reachable for the first time.** Its absolute gate (`SCH-2`) opened at P7 and nothing else blocks it |
| **P10 — The long game** | `SCH-3` | open |
| **P—** | **`OWN-2`** · `SEC-5` → a birth date → `BEH-2` | **behind the legal gate** — `OWN-2` **moved here by this phase** (§ 8) |
| **Unclaimed remainder** | `seasonOfLocalDate()` ×7 · `product_history.scannedAt` · `user_health_trends.date` · `dayOfYear` · `user_streaks.weekStartDate` · the remaining week-shapes | open — needs no anchor; cheap |

### 12.1 Recommended next workstream

> **The offered anchor (TIME1 § 6.2) — a product decision, and it is now the whole programme's
> bottleneck.**

**P8 finished the engineering and revealed that the engineering was not the constraint.** Five rival
weeks are one, the gate fails on a sixth, and **192 of 195 households still see nothing but an honest
"I don't know"** — permanently, because `HT7` is right and the anchor cannot be invented for a week
whose meaning has passed. **Everything Household Time was built to deliver is now waiting on one
question**: *may THA ask a household "Is this week beginning Monday 20 July?"*

It is **one offered, never-forced confirmation**. *"A declared anchor is a fact. An inferred one is
fabrication."* It needs no schema (the column exists), no migration, and no legal review — **it needs
a product decision**, which is why P7 and P8 both refused to take it.

**If an engineering phase is preferred instead: `P9` (`BEH-5`)** — retire `approxDate`. It is
reachable for the first time since CONV1 was written, it is *"the only phase that changes what THA
**says**"*, and it is the last live fabrication in the time family.

---

*Rollback: `rollback/CONV1-phase-p8-t5-convergence-20260717` → `5c4611e8`. The preservation commit
captured every previously-uncommitted change before any P8 file was touched — **including CONV1 P7's
completed deliverables**, which were still uncommitted.*

> ⚠️ **A concurrent session's work is in this tree.** `NORTH1_Home_Implementation` is **`Waiting for
> User`, not mid-implementation** — its Home redesign is committed at `5c4611e8` and under review.
> **P8 changes that screen**: it re-sources Home's facts and converges its door, and **preserves its
> visual language entirely** (no token, colour, shadow, radius or exposure touched). A `git checkout`
> of this tag would discard nothing of NORTH1's — its work is *inside* the tag.

*✅ **P8 is code-only.** No migration, no schema change, no column added or dropped, no row rewritten
— because the one workstream that needed a migration (`OWN-2`) was refused. Reverting the code
reverts the phase completely, with nothing left behind in the database. The four verification
households in the dev database are P7's three plus P8's two.*
