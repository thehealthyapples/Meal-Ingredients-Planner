# Session: CONV1_Phase_P8_T5_Convergence

| Field | Value |
|---|---|
| **Session ID** | `CONV1_Phase_P8_T5_Convergence` |
| **Rollback ID** | `rollback/CONV1-phase-p8-t5-convergence-20260717` → `5c4611e8` |
| **Start time** | 2026-07-17 |
| **Current stage** | Complete |

## Objective
Implement CONV1 Phase **P8** only, in the approved sequence: `READ-3` → `OWN-6` → `BEH-3` →
`OWN-2` → `BEH-9`. Converge every T5 consumer onto the Planner Week Anchor. No P9+ work
(**`BEH-5`/`approxDate` is P9 and must not be touched**), no unrelated refactoring.

## THE FINDING THAT REFRAMES THE PHASE (measured, 2026-07-17)
```
planner_weeks : 1170 weeks · 18 anchored
households    : 195 total · 3 anchored · 192 UNANCHORED FOREVER (HT7)
```
**The only 3 anchored households are P7's own verification households.** `createPlannerWeeks`
stamps only at creation and returns existing weeks untouched, so **every real household is
unanchored and can never become anchored** except by TIME1 § 6.2's *offered* anchor (a product
decision, not in P8's row). So `resolvePlannerWeek` answers `anchored:false` for every household
that exists.

## THE GOVERNANCE DECISION — taken by the user, 2026-07-17, not by me
**Put to the user because the governing documents conflict and fixing a self-contradiction
logically requires changing one of the two contradicting sides.** Decided:

> **Option C — the explicit "Unanchored Home" state. Do not invent or floor a planner week.**
> - Home must never imply certainty where none exists.
> - There must be one canonical owner of time.
> - **Every Home card must resolve from the same canonical planner state.**
> - If no anchor exists, Home honestly communicates that the planner is not yet anchored,
>   rather than mixing data from different fallback weeks.
> - **This is not an error state** — it is the expected first-run experience until a canonical
>   anchor exists.

### The conflict this creates, named rather than lawyered around
**TIME3 § 13.1 (governing) says:** *"`resolvePlannerWeek → anchored: false` means the caller keeps
**exactly today's behaviour** … **Nothing regresses, ever.**"* The Unanchored Home state does not
keep today's behaviour: Home stops showing Week 1's meals.

**Why the decision is nonetheless coherent, and what P8 must do about it:**
1. **§ 13.1 is already in tension with `OWN-6`, independently of this decision.** Home's "today's
   behaviour" for meals **is** `localStorage`, and `OWN-6` retires it. You cannot both retire the
   floor and stand on it. Something had to change on Home the moment `OWN-6` was scheduled.
2. **§ 13.1's purpose is to protect *correct* behaviour from a convergence** (*"if `anchored:false`
   meant 'show nothing', the Foundation would blank the product"*). Home's Week 1 meals are not
   correct behaviour being protected — they are the fabrication `BEH-3` reports.
3. **`BEH-3` forbids the alternative by name:** *"Do not pick a week to fix it"* (HOME3 § 4 refused
   both candidates).
**→ TIME3 § 13 must be amended by governed amendment to admit the honest-absence case**, or the
code will contradict the governing document and the next implementer will "fix" it back (CP4).
**The amendment is P8's, because P8 is the change that makes § 13.1 false.**

## Files being modified (provisional)
- `server/lib/household-planner-week.ts` *(new)* — the ONE server-side composition: fetch the two
  facts, ask the owner. Owns no rules (the module owns those); owns no data
- `server/routes.ts` — `/api/home/intelligence` weeklyProgress (rival #1) + publish the resolution
- `server/intelligence/food-intelligence/opportunity-engine.ts` — rival #2
- `server/lib/household-nutrition-assembler.ts` — rival #3
- `client/src/pages/dashboard.tsx` — rival #4 (`plannerFull[0]`)
- `client/src/pages/home-experience-page.tsx` — rival #5 (`localStorage`) + the Unanchored state + the door
- `shared/schema.ts` + `server/migrations/runner.ts` + `server/storage.ts` — `OWN-2` (retire the 3 count columns)
- `server/verification/publication-register.ts` — the gates
- `server/tests/test-time3-p8-t5-convergence.ts` *(new)* + `package.json`
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` — **§ 13 amendment** + § 14/§ 17 status
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 14/16/27; `OWN-6`'s row
- `docs/implementation/governance/CONV1_PHASE_P8_COMPLETION.md` — the report

## Scope refusals (decisions, not omissions)
- **`BEH-5` / `approxDate` (`routes.ts` `buildHouseholdHistory`, the `maxWeek`/`weeksAgo`
  fabricator) is P9 — NOT TOUCHED.** CONV1's `maxWeek` citation for `READ-3` is the
  **weeklyProgress** reduce, not this one.
- **No back-fill and no offered/declared anchor UI** — TIME1 § 6.2's extension point is a product
  decision and is not in P8's row. **It is the only honest route to fixing the 192**, and is the
  recommended next workstream.
- **No floor, no invented week** (the user's decision).
- The planner page keeps `planner:active-week` as **view state** ("which week am I editing") —
  that is not a household fact and is not `OWN-6`'s target. `OWN-6` is Home using it as *the
  current week*.

## Checkpoints
- [x] Bootstrap read (README · CONV1 P7 report · CONV1 programme P8 rows · HOME3 · TIME1 § 6.2/§ 10 · TIME3 § 13/§ 14/§ 17)
- [x] Rollback protection created and reported
- [x] Live census — 192/195 households unanchored forever
- [x] Governance decision taken by the user (Option C — the Unanchored Home)
- [x] `READ-3` — five rivals → one owner (`server/lib/household-planner-week.ts` + `GET /api/planner/current-week` + `useCurrentPlannerWeek`). **Also fixed the dashboard's live day rotation** (Mon-first labels over Sun-first data, TIME1 § 3.2 'reported, not fixed') — HT11 forbade fixing the week and leaving the days
- [x] `OWN-6` — Home reads the owner; `loadActiveWeek`/`ACTIVE_WEEK_KEY` gone from Home. The planner page keeps the key as **view state**
- [x] `BEH-3` — every Home + Dashboard card resolves from the ONE resolution; the **Unanchored Home** state built (Home + both Dashboard week cards)
- [x] `OWN-2` — **REFUSED, with evidence. It is behind the legal gate, and CONV1's row is mis-graded.** Named as a deviation, not quietly skipped (see below)
- [x] `BEH-9` — the door converged onto HOME2's `resolveHomePrimaryAction` (**its first production consumer ever**; tier + destination from the resolver, words left client-side = INT21/CP3)
- [x] TIME3 § 13.1 **amended** (governed, by the phase that made it false) + 3 ratchets (**6/6 mutations caught**) + suite **62/62** + live-verified over HTTP + governing docs corrected + report filed

**Last checkpoint:** COMPLETE. 4 of 5 closed; **`OWN-2` refused with evidence** (behind the legal gate; CONV1's row corrected). `household-time` 🟢 **15/15**; platform 72→75 checks, reds unchanged at 4; typecheck **32 — identical set**; adoption 79·0·2 (same 2 pre-existing). **Live: an unanchored household gets `anchored:false` + `weeklyProgress: null` — no fallback.**

## Next action
None — complete. **Recommends: the offered anchor (TIME1 § 6.2) — a PRODUCT decision, and now the
whole programme's bottleneck.** P8 finished the engineering and revealed the engineering was not the
constraint: five rival weeks are one, the gate fails on a sixth, and **192 of 195 households still
see only an honest "I don't know"** — permanently, because `HT7` is right. Everything Household Time
was built to deliver waits on one question: *may THA ask a household "Is this week beginning Monday
20 July?"* No schema, no migration, no legal review needed — a product decision, which is why P7 and
P8 both refused to take it.

**If an engineering phase is preferred: `CONV1 P9` (`BEH-5`)** — retire `approxDate`. Reachable for
the first time since CONV1 was written; the last live fabrication in the time family.

## Blockers
**`OWN-2` is blocked by a legal review, not by engineering — and CONV1 grades it as unblocked.**
Verified at source and against live data:

1. **Its convergence strategy is not implementable.** CONV1: *"Derive from eater rows; retire the
   columns… a projection over rows, never a column (CP7)."* **`household_eaters` carries no age or
   life-stage fact** — verified in the schema AND the live DB: `id, household_id, display_name,
   user_id, default_diet_types, hard_restrictions`. There is nothing to derive a count of adults,
   children or babies FROM.
2. **The one proxy that ever looked like one is not one, and is already renamed.** CONV1's stated
   user impact — *"two eaters typed `kind: "child"` in one context block"* — **is already false**:
   `kind` was `row.userId != null ? "user" : "child"`, it meant *has no account* and never age
   (LIFE1 § 6), and **CONV1 `BEH-1` renamed it to `"account" | "no-account"` in P3**. Counting it
   would tell the language model that a live-in grandparent is a child.
3. **Supplying the missing fact is LIFE1 Step 2 — `household_eaters.birthYear`/`.birthMonth` —
   whose stated precondition is § 12.1 LEGAL REVIEW.** LIFE1 § 13's table makes **Step 3 (= this
   item) depend on Step 2**, and § 12.1 is unambiguous: *"Children's data is a legal and product
   question with a regulatory surface (UK GDPR), and an engineering investigation has no authority
   to decide it… A birth date collected before § 12.1 is answered is a minor's personal data
   gathered without a governing position on minors' personal data — and unlike every other finding
   in this document, that one is not reversible by dropping a column."*
4. **Retiring the columns now would destroy live data with no destination.** Measured:
   **166 of 211 `user_preferences` rows hold non-default counts.** That is `R7`'s exact shape —
   *"the scaffolding is deleted first, because it looks like obvious debt."*

**→ CONV1's `OWN-2` row must be corrected**: *"Dependencies: … **Not blocked by the § 5 legal
gate**"* is false. It is blocked by the **same** gate as `SEC-5`, transitively, via LIFE1 Step 2 —
which CONV1 itself cites as OWN-2's source (*"LIFE1 Step 3 = PEOPLE1 Step 6 — one item, two
authors"*). The scope defect LIFE1 § 5 names is real and unfixed; **what is available without the
legal answer is a scope move (user → household), which CONV1's own strategy forbids (CP7 — "a
projection over rows, never a column")**. That is a decision for the user, not a refactor for me.

## Notes
- **`BEH-9`'s CONV1 grade did not survive contact with the code.** CONV1 says *"Home has no
  primary action"*; **Home has one** — `home-experience-page.tsx:727`, built by the concurrent
  `NORTH1_Home_Implementation` session hours ago. It is a **rival implementation**
  (`todaysMeals.length === 0 ? "Plan today" : "Open today's plan"`), it does **not** use HOME2's
  canonical `resolveHomePrimaryAction`, and it is aimed by `todaysMeals` → `activeWeek` →
  **`localStorage`** — *precisely* what HOME3 § 4 refused (*"aimed at `localStorage` it moves when
  you change device"*). **`BEH-9` is therefore a CONVERGENCE, not a build.**
- **`NORTH1_Home_Implementation` is `Waiting for User`, not mid-implementation** — its Home
  redesign is committed at `5c4611e8` and under review. P8 changes that screen; the visual
  language must be preserved and only the *facts* re-sourced.
- HOME2's resolver is **total with `week: null`** (HOME3 § 6) — so the door is honest for the 192
  without picking any week.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
