# HOME3 — The Two Current Weeks

## Why the Home door cannot yet be aimed, and why that is the right answer

**Status:** FINDING — surfaced on instruction, during the `HOME3` implementation of `HOME2`'s Home
Primary Action Resolver. **Not** governing architecture, **not** a specification. It creates no rule
and amends nothing. **Nothing was fixed.**
**Classification:** Platform (Household Time) — the workstream `TIME1` opened and `TIME2` is auditing
**Date:** 2026-07-16 (HOME3)
**Rollback ID:** `rollback/HOME3-home-primary-action-implementation-20260716` → `7d1dd2ce`
**Prior work read:** [`HOME2`](../ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md) · [`TIME1`](./TIME1_HOUSEHOLD_TIME_FOUNDATION.md) · [`EXPCOMP2`](../ux/HOME_COMPLIANCE_AUDIT_20260716.md) · [`NORTH1`](../../implementation/ux/NORTH1_THE_VISUAL_NORTH_STAR.md)
**Every claim below was verified against the code, not inherited from a prior document.**

---

## 1. THE HEADLINE

The `HOME2` resolver's Tiers 1 and 2 need one fact: **does the household's current week have empty
days?** THA holds two rival answers to *"which week is current"*, they are **guaranteed to disagree
by default**, and the disagreement is **already on Home's screen**:

> **Home renders Week 1's meals beside Week 6's plant count. Today. In production.**

Aiming the door at either definition would not settle this. It would **ratify one of them as correct
and make a live self-contradiction into a design intent** — the precise failure `HOME1` warned about
in a different key (*"absence of a primary action looks exactly like restraint"*).

**So the door stays unaimed, and that is the finding, not a delay.**

---

## 2. THE TWO DEFINITIONS

| | **Server** | **Client** |
|---|---|---|
| **Where** | `server/routes.ts:11503-11505` | `client/src/pages/home-experience-page.tsx:51-61` |
| **Rule** | `weeks.reduce((a, b) => b.weekNumber > a.weekNumber ? b : a)` | `localStorage["planner:active-week"]`, else `1` |
| **Means** | "the highest-numbered week that exists" | "the week this device last had open" |
| **Value in practice** | **the constant 6** | **1**, until someone picks otherwise |
| **Scope** | the household | **this browser** |
| **Feeds** | `weeklyProgress` → Home's plant ring (`:160`) | `todaysMeals` → Home's "Today's Meals" card (`:139`) |

### 2.1 Why the server's is the constant 6

Not an inference — the two lines that fix it:

- **`server/storage.ts:1220`** — `for (let w = 1; w <= 6; w++)`: **all six weeks are created eagerly,
  in one transaction, at first touch.** `createPlannerWeeks` is called by `/api/planner/full`
  (`routes.ts:6438`) the first time any household opens the planner.
- **`server/routes.ts:7182`** — `weekNumber: z.number().int().min(1).max(6)`: the ceiling is 6.

So for **every household past its first planner load**, `max(weekNumber)` ≡ **6**, always. It is a
constant wearing the costume of a computation. `TIME1` found this first; this document confirms it
independently and reports the consequence `TIME1` did not reach: **what it does to Home.**

### 2.2 Why the client's is 1

`planner:active-week` has **five readers** (`home-experience-page.tsx:53`,
`weekly-planner-page.tsx:264`, `use-week-meal-entries.ts:15`, `AddToWeekModal.tsx:80`, plus two dev
pages) and **exactly one writer** — `weekly-planner-page.tsx:276` — which fires **only when a person
manually picks a week**. It is **never seeded** from the server's week. An untouched household reads
`null` and falls to the literal default: **`if (!raw) return 1;`** (`home-experience-page.tsx:54`).

---

## 3. THE LIVE DEFECT

For any household that has not manually selected Week 6 in the Planner — **which is the default state
of every household** — Home's two halves describe **two different weeks, simultaneously**:

```
  Home
  ├─ "Today's Meals"  ← fullPlanner.find(w => w.weekNumber === activeWeek)   → WEEK 1   (:139)
  └─ "N of 30 plants" ← homeIntel.weeklyProgress.plantCount                   → WEEK 6   (:160)
```

Both are rendered from `home-experience-page.tsx`, in one component, on one screen, in one paint —
twenty-one lines apart.

**This is new to the canon.** `EXPCOMP2` graded "Today's Meals" **unfalsifiable** — derived from
`localStorage` against a schema with no calendar anchor — which is true and is a weaker statement.
The sharper fact is that Home does not merely fail to be checkable against a calendar; **it fails to
agree with itself**, and the contradiction is deterministic rather than occasional.

Two further properties, recorded because they bear on any fix:

- **The week is device-local.** The same household on a phone and a laptop has two current weeks.
  `TIME1` fixed the principle for the clock — *"a clock is a property of the home, not the device in
  your pocket"* — and the identical argument binds here, over one shared plan.
- **Five readers, one writer, no owner.** `planner:active-week` is a household-shaped fact living in
  `localStorage` with no entry in the Source of Truth Register. Architecture Principle 2's fail test
  (*one owner per fact*) is met.

---

## 4. WHY THE DOOR CANNOT PICK ONE

Both candidates fail, and they fail for different reasons — which is why this is a platform gap and
not a choice.

| Candidate | Verdict |
|---|---|
| **Server `max(weekNumber)` ≡ 6** | **Refused.** The door would aim at a week the household is *not looking at* — Home's own "Today's Meals" card shows Week 1. A door contradicting the card beside it is worse than no door. And "the highest week that exists" is not a fact about the household; it is a fact about `createPlannerWeeks`. |
| **Client `activeWeek`** | **Refused.** Device-local, so the door would differ between a household's phone and laptop for identical household state — breaking `HOME2` § 6.1's theorem (*"the door changes when the household's state changes"*) at its root: `localStorage` is not household state. It is also unavailable server-side, foreclosing the route chosen for the call site. |

> **Picking either would make the resolver's central guarantee false.** `HOME2` § 6.1 is a *theorem*
> of the construction — the door moves only when a household fact moves. Aimed at `max(weekNumber)`
> it never moves. Aimed at `localStorage` it moves when you change **device**. Neither is a household
> fact, so neither preserves the theorem. **The resolver is correct; there is nothing correct to feed it.**

---

## 5. WHAT THIS IS, PRECISELY

**A platform gap, not an architecture defect** — the same shape `HOME2` § 10 and `TIME1` both reached,
and for the same reason: *the law is right; the facts are absent.* The rule that would settle it
(`TRANSLATION1` *Morning Rhythm* § 8 — the primary action re-aimed by relevance across the day) is
**law and is unimplementable**, and `HOME2` § 8.1 named the real blocker as **the planner's missing
calendar anchor**, not the missing clock.

This finding is that blocker, arriving with a bill attached: it is no longer only a *future*
refinement of the door — **it is the reason the door cannot be aimed at all**, and it is already
producing a visible contradiction on Home without any door being built.

**It belongs to `TIME1`'s foundation** — specifically `planner_weeks.weekStartDate` (D14, *written only
at creation, the only moment THA can honestly know what a week means*) — **and to `TIME2`'s consumer
audit**, which is the open workstream whose entire subject is *which domains should consume Household
Time*. **The Home door is one of those consumers, and this is its entry.**

---

## 6. WHAT WAS NOT DONE

- **Nothing fixed.** No week definition chosen, no reconciliation written, no `localStorage` seeded,
  no route changed, no UI touched.
- **No rule created.** Section 3's two properties are Principle 2 and `TIME1`'s existing argument
  applied to a fact they already cover — not new law.
- **No schema.** `weekStartDate` is `TIME1`'s to land, by a governed workstream, under Register Rule 8.
- **No architecture amended.** Every governing document is byte-untouched.
- **The resolver was not compromised to fit.** It remains total without a week: with `week: null` it
  falls to the floor and still returns exactly one action (`HOME3` test § 2, case 3). **The door is
  buildable the moment a week means something.**

---

## 7. THE FINDING IN ONE PARAGRAPH

THA has two current weeks. The server's is the constant six, because all six weeks are created at
once and nobody ever adds a seventh; the client's is one, because that is the default and only a
manual click ever changes it. They are not close and they never converge, and the proof is not
theoretical — it is Home, today, showing Week 1's dinners above Week 6's plant count. The
`HOME2` resolver asked this platform one question — *does the household's current week have empty
days?* — and discovered the platform cannot say which week that is. **That is not a reason to delay
the door. It is the door's most useful output so far: the first consumer of Household Time to state
its precondition in terms a schema can satisfy.**

---

*A finding — point-in-time analysis surfaced during implementation, on instruction, before a
definition was chosen. It is history the moment it is written and is never to be read as law
(`docs/architecture/README.md`; PKR1 § 4.4).*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file.*
