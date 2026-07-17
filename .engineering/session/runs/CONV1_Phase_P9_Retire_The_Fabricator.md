# Session: CONV1_Phase_P9_Retire_The_Fabricator

| Field | Value |
|---|---|
| **Session ID** | `CONV1_Phase_P9_Retire_The_Fabricator` |
| **Rollback ID** | `rollback/CONV1-phase-p9-retire-the-fabricator-20260717` → `f62b5839` |
| **Start time** | 2026-07-17 |
| **Current stage** | Complete |

## Objective
Implement CONV1 Phase **P9** only: `BEH-5` — retire `approxDate`, the last live fabrication in the
time family. Preserve the Household Time Architecture. **No P10 (`SCH-3`), no offered anchor, no
unrelated refactoring.**

## THE DEFECT, MEASURED (not inherited from CONV1's grading)
```
The household planned curry on: Saturday (planner dayOfWeek=6)

What Stories SAYS, by the day you happen to open the app:
  you open it on Sunday    → "Sunday became curry night."     ✗ WRONG
  you open it on Monday    → "Monday became curry night."     ✗ WRONG
  …
  you open it on Saturday  → "Saturday became curry night."   ✓ correct

reportedDay = (now.getDay() + dayOfWeek + 1) mod 7 → correct ONLY when now is Saturday.
```
**The weekday Stories reports IS the day you are reading it.** It carries zero information about
the household. CONV1 grades this as *"the peak-day index computed against the **inverted**
convention"* — the truth is sharper: the date is **invented at request time**, so `e.date.getDay()`
is a fact about the request, not about the plan. Re-graded, with the work done anyway.

## TWO FABRICATORS, NOT ONE (TIME3 § 14 target 5: "2 → 0")
1. `server/routes.ts:11428` — a **private closure** inside `registerRoutes` (6 call sites).
2. `server/lib/household-history.ts:28` — the **exported extraction**, whose own docblock says it
   exists *"so it can have more than one honest caller"* (1 caller: `notice-gateway.ts`).
**They are logic-identical.** § 14 target 5 names exactly this: *"duplicated despite a docblock
stating the extraction exists to prevent it."*

## THE DESIGN (settled by evidence, not preference)
`date` is used by **two** pure engines (~14 sites) and NOT by `discover()`:

| Consumer | Needs a date? |
|---|---|
| `discover()` | ❌ — takes only `enjoys` (food slugs, built in the route from `entries.map(e => e.food)`) |
| `stories()` — all five story types | ✅ — weekday, 30/90/180/365 tiers, the 180-day favourite gate, seasons |
| `seasonalStories()` | ✅ for its windows; ❌ for its `enjoys` half |

→ **`MealEntry.date: Date | null`.** An entry from an **anchored** week carries its REAL date
(`weekStartDate + MONDAY_FIRST_ORDER.indexOf(dayOfWeek)` days); an entry from an **unanchored**
week carries `null` and can support **no date claim**. Food identity survives without a date, so
`discover()` is untouched — **dropping undatable entries would have silenced discovery for nothing.**

## The consequence, stated up front
**192 of 195 households are unanchored (HT7), so Stories goes SILENT for them.** That is the phase:
*"`approxDate` deleted; Stories honest for the first time"* — and it is the same principle the user
governed in P8 (**Option C**): honest absence, never an invented fact. Stories' own canon already
requires it — *"Memory, never report card"*, *"Trust by non-computation"*.

## Files being modified (provisional)
- `shared/stories/types.ts` — `MealEntry.date: Date | null`
- `shared/stories/engine.ts` · `shared/seasonal/engine.ts` — skip undated entries for every date claim
- `server/lib/household-history.ts` — the real date from the anchor; `null` when unanchored
- `server/routes.ts` — **retire the private closure** (2 → 1); import the extraction
- `server/verification/publication-register.ts` — the gate + **delete P8's `buildHouseholdHistory` excision**
- `server/tests/test-time3-p9-retire-the-fabricator.ts` *(new)* + `package.json`
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (§ 14 target 5, § 17) · Register · README
- `docs/implementation/governance/CONV1_PHASE_P9_COMPLETION.md`

## Scope refusals (decisions, not omissions)
- **No P10 (`SCH-3`)** — no column type changes.
- **No offered anchor** — the recommended next workstream, and a product decision. P9 does not take it.
- **No back-fill.** The 192 stay unanchored; their entries are undated, honestly.
- **No new story, no new threshold, no new phrasing.** P9 deletes a fabrication; it invents nothing.

## Checkpoints
- [x] Bootstrap read (README · CONV1 P8 report · CONV1 programme `BEH-5` row · TIME3 § 14 target 5)
- [x] Rollback protection created and reported
- [x] The defect reproduced numerically (the weekday IS the request day)
- [x] `MealEntry.date: Date | null` + `isDated`; both engines narrowed to `DatedMealEntry` at their seams
- [x] `plannerEntryDate` — a lookup over `weekStartDate` + `MONDAY_FIRST_ORDER`; **reads no clock**
- [x] Both fabricators deleted (**2 → 0**); `routes.ts` imports the one owner
- [x] 2 ratchets, **6/6 mutations caught**; **P8's excision deleted** as P8 instructed — `routes.ts` is held to `ht-one-planner-week-owner` again and passes
- [x] Suite **34/34** (registered + wired); live-verified on a real 337-entry household; governing docs corrected; report filed

**Last checkpoint:** COMPLETE. `household-time` 🟢 **17/17**; platform 75→77, reds unchanged at 4; typecheck **32 — identical set**; adoption 79·0·2; 9 suites green. **Live: the same household, the same 337 entries — unanchored → 0 stories; anchored → 4 sections and a TRUE weekday.** Nothing back-filled (verified).

## Next action
None — complete. **Recommends `CONV1 P10` (`SCH-3`)** — the last engineering phase; judge it by
*"could we restore production from an empty database?"*, never by user impact (51% → 100%
schema coverage; `R2`'s permanently-red gate; `R7` is its live risk).

**But the higher-value ask is not an engineering phase**: P7 built the anchor, P8 gave it consumers,
P9 made Stories truthful — and the truth is **silence for 192 of 195 households**. One offered,
never-forced question (*"Is this week beginning Monday 20 July?"*) converts the whole programme from
correct to visible. No schema, no migration, no legal review — a product decision.

## Blockers
None.

## Notes
- **P8 left an instruction for this phase**, in `publication-register.ts`'s
  `ht-one-planner-week-owner`: *"WHEN P9 RETIRES approxDate, DELETE THIS BLOCK — it is the only
  thing standing between that function and this gate."* P9 must delete it.
- A concurrent session's work (client/, `north2-home` captures) is in the tree, committed at
  `f62b5839` and untouched by this session. **P9 touches no client file.**

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
