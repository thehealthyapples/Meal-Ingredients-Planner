# TIME2 — The Household Time Consumer Audit

## Every domain that should consume Household Time, and every domain that must not

> ## ⛔ RETIRED AS A SOURCE OF RULE — 2026-07-16 (`TIME3`)
>
> **Its validated findings were promoted to governing architecture: [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](../../architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md)** — the consumer matrix (§ 8), the CIVIL/INSTANT model (§ 7), the must-never-consume verdicts (§ 8.1), and the dependency graph (§ 10).
>
> **Read the architecture, not this document, for any rule.** This file remains at its path as **point-in-time analysis and history** (`REPOSITORY_CONVENTIONS.md` § 3). It holds the **evidence** the architecture does not: the per-domain census with `file:line` citations, the **fourteen live defects** (§ 9.4 — including two security defects unrelated to household time), and the three corrections to TIME1.
>
> **It is not a dependency.** No code, gate, or document may read it to decide anything. **Where it and the architecture disagree, this document is history and the architecture governs.**
>
> **Superseded within this file:** § 10.2's recommendation of *"TIME3 — the TIME1 register amendment (Step 0)"* — **Step 0 completed on 2026-07-16.** § 13.2's recommendation *against* promoting this audit was **honoured**: the audit was not promoted; **TIME1's model was**, and this document's validated findings were incorporated into it rather than frozen as a rule of their own.
>
> **This document is a snapshot of twenty consumers on 2026-07-16 and will go stale the first time one converges. The architecture's § 8 is the live matrix.**

**Status:** INVESTIGATION — an audit and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation. It creates no rule, no store, and no second owner. **It amends nothing and builds nothing.**
**Classification:** Platform Governance (investigation)
**Date:** 2026-07-16 (TIME2)
**Rollback ID:** `rollback/TIME2-household-time-consumer-audit-20260716` → `7d1dd2ce`
**Foundation audited against:** [`TIME1 — The Household Time Foundation`](./TIME1_HOUSEHOLD_TIME_FOUNDATION.md)
**Reviewed against:** [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · [`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md) · [`ENGINEERING_WORKFLOW.md`](../../architecture/ENGINEERING_WORKFLOW.md) · [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) · [`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`](../../architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md) · [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md) · [`THA_DECISION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_DECISION_ENGINE_ARCHITECTURE.md) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**No code written, no schema modified, no architecture amended, no feature designed, no TIME1 phase implemented.**

---

## 0. TWO DECLARATIONS THE MISSION REQUIRES ME TO MAKE FIRST

### 0.1 This document is not governing, and it cannot be

The mission asked for *"the **governing** Household Time Consumer Audit"* and for it to be *"stored under `docs/investigations/`"*. **Those two instructions are mutually exclusive**, and the architecture says so in three places:

- `docs/architecture/README.md` (line 4): *"Architecture documents no longer live in `docs/investigations/` — investigation files there are **point-in-time analysis and history only**."*
- `REPOSITORY_CONVENTIONS.md` § 3 (line 47): `docs/investigations/` — *"Do not put here: **Governing architecture**; loose files at its root."*
- `REPOSITORY_CONVENTIONS.md` § 3 (lines 89–93): *"**Promotion.** An investigation may be *promoted* to governing architecture by copying it into `docs/architecture/` and indexing it in that directory's `README.md`."*

**So this is an investigation.** It is history the moment it is written and is never to be read as law. If it should govern, that is a **promotion** — a separate, deliberate act (§ 13.2), and one this document does not perform on itself.

**The same is true of TIME1, and it matters more.** The mission calls TIME1 *"the governing foundation"*. **It is not.** Verified: the Source of Truth Register contains no household-time owner, and `docs/architecture/README.md` does not index TIME1. TIME1 is a recommendation that has not yet been adopted.

> **This is not pedantry — it sets the roadmap's first step.** You cannot converge twenty consumers onto an owner the register does not recognise. **Step 0 is a governance act, not a code act** (§ 10).

### 0.2 The specified file path violates governing architecture

The mission specified `docs/investigations/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md` — the directory root. That path is forbidden by `REPOSITORY_CONVENTIONS.md:47` and `:74` (*"An investigation, audit, assessment, or root-cause analysis → `docs/investigations/<workstream>/`"*), restated by `docs/investigations/README.md:11` (*"the root itself holds only this index"*), and **mechanically enforced**:

```sh
# .engineering/scripts/repo-structure-verify.sh:52-54
inv_loose="$(find docs/investigations -maxdepth 1 -type f ! -name 'README.md' | wc -l)"
[ "$inv_loose" -eq 0 ]
check "docs/investigations/ has no loose files (all filed by workstream; README.md index only)" $?
```

**Following the mission literally would have failed the repository structure gate.** This document is therefore filed at `docs/investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md` — TIME1's workstream, filename preserved, intent honoured.

---

## 1. EXECUTIVE SUMMARY

### 1.1 The headline

> **Every INSTANT consumer in THA is correct. Every CIVIL consumer is broken. The line between them is exact — and it is precisely the line TIME1 drew.**

This is the audit's central finding, and it is a stronger result than a list of defects. The platform is not randomly wrong about time. The trial countdown, the 90-day evidence window and every cache TTL are **flawless** — because a duration needs no calendar, so the missing time zone costs them nothing. Every consumer that needs the household's *local calendar* is broken, and they are broken **in the same way**: local-frame arithmetic serialised through `.toISOString()`.

**THA is broken exactly and only where household time is required.** That is the strongest available evidence that the boundary TIME1 proposed is the real one — the platform has been failing along it for months.

### 1.2 The thesis

> **The platform did not forget about time. It reasoned about time carefully, in twenty places, in isolation — and each place chose a different frame.**

The competence is present and documented. `shared/seasonal/engine.ts:89-93` defers hemispheres *deliberately*. `notice-engine.ts:216-218` refuses to persist a "just crossed" detector *on purpose*. `shared/nutrition/household-nutrition.ts:59-63` refuses to invent a target. The diary's `T12:00:00` noon-anchor (`food-diary-page.tsx:128`) shows someone reasoned explicitly about DST and got it right. `server/tests/benchmark/bundle.ts:75-77` **independently arrived at TIME1's exact recommendation** months ago and filed it as open work:

> *"It requires the temporal anchor to become an **injectable input** of the Context Composition Engine — **a platform change with production value of its own**, not a benchmark accommodation."*

What is absent is a single authority to route that competence through. Five frames are live — **UTC · server-process-local · browser-local · noon-anchored-local · week-index** — and they disagree at every seam.

> **`buildHouseholdHistory` is what a system does when it needs a date and nobody owns one.**

### 1.3 What the audit found

| | Count | Meaning |
|---|---|---|
| **Domains audited** | 11 named + 9 discovered = **20** | § 4 |
| **True Household Time consumers** | **12** | Must consume; §§ 4.1–4.12 |
| **Must NOT consume (INSTANT)** | **5** | Correct today; consuming would *break* them (§ 3.3) |
| **Consume nothing (correct by abstinence)** | **3** | Shopping, Alternatives, Shared Plan |
| **Live defects found** | **14** | § 9.4 — 6 user-visible |
| **Rival "current week" implementations** | **5** | § 7.2 |
| **Rival week-shape declarations** | **19 across 16 files** | § 7.2 |
| **Rival season implementations** | **3** | § 7.4 |
| **Mission confirmations that hold** | **2 of 5** | § 7 — **three are refuted** |

### 1.4 Three of the five confirmations are refuted, not confirmed

The mission asked me to confirm five properties. **Two hold. Three do not** — and in each case the duplication the mission asked me to prevent **already exists** (§ 7).

### 1.5 The one finding that changes sequencing

**Stories tells households facts about their own lives that it derived from dates that do not exist**, using a weekday convention it documented backwards:

```ts
// shared/stories/engine.ts:441
`${DAY_NAMES[peakDay]} became ${patternName.toLowerCase()} night.`
```

> **"Friday became curry night."** The household never told THA which day they eat curry — **the planner cannot express that**. The weekday was derived from `approxDate` (`routes.ts:11372`), which was invented at request time, and the peak-day index was computed against an inverted convention.

**Household time will not fix this.** There is no real date underneath to correct. It requires the planner anchor (TIME1 Phase 3) first — which makes Stories a *dependant* of the anchor, not a convergence target. **This is the single most important sequencing fact in the roadmap** (§ 10).

---

## 2. THE CONSUMPTION VOCABULARY

*"Needs time"* is too vague to govern. Before any domain can be audited, what it means to **consume Household Time** must be typed. TIME1 § 5.4 defines the contract; this is its consumable surface.

| Token | Name | Contract (TIME1 § 5.4) | Owner |
|---|---|---|---|
| **T1** | `zone` | `households.timeZone` — the household's IANA zone | **Household** — SoT Domain 16 |
| **T2** | `today` | `householdToday(now, zone) → CivilDate` | **`shared/time/household-time.ts`** (derivation) |
| **T3** | `phase` | `householdPhase(now, zone) → PhaseOfDay` — coarse, named | **`shared/time/household-time.ts`** |
| **T4** | `week` | `householdWeekOf(date) → CalendarWeek` — Monday-first, ISO | **`shared/time/household-time.ts`** |
| **T5** | `plannerWeek` | `resolvePlannerWeek(today, weeks) → PlannerWeekResolution` | **`shared/time/household-time.ts`** over **Planner** (Domain 14) |

And two tokens that are **not** Household Time, named here because conflating them is the audit's main hazard:

| Token | Name | Why it is not Household Time |
|---|---|---|
| **S** | `season` | **Owned by the season rule** (§ 7.4), which is *given* a `T2` and never reads a clock. Household Time supplies its **input**, never its **answer**. A Foundation that computed seasons would be the second owner Principle 2 forbids |
| **I** | `instant` | An absolute point on the timeline. Needs **no zone**. Consuming `T1`–`T5` here is a **defect**, not an improvement (§ 3.3) |

**The dependency order is fixed by the contract itself**, and it drives the whole roadmap:

```
T1 (zone) ──> T2 (today) ──> T3 (phase)
                 │
                 ├──> T4 (week)
                 │
                 └──> S (season)          [S needs T2; S is not ours]

T2 + planner_weeks.weekStartDate ──> T5 (plannerWeek)
```

> **T5 is the expensive one.** T1–T4 need one column on `households`. **T5 additionally needs the planner anchor** — TIME1 Phase 3 — and it is the token that most consumers actually want.

---

## 3. THE CIVIL/INSTANT TEST — THE AUDIT'S INSTRUMENT

### 3.1 The test

> **If this household moved to Tokyo tomorrow, would this value have to change?**
>
> - **Yes → CIVIL.** It needs Household Time.
> - **No → INSTANT.** It must **never** consume Household Time.

Worked:

| Value | Moving to Tokyo… | Verdict |
|---|---|---|
| *"What's for dinner today?"* | …changes which day it is | **CIVIL** |
| *"Good morning"* | …changes the greeting | **CIVIL** |
| *"This reset token expires 24h after issue"* | …changes nothing | **INSTANT** |
| *"Show the 90 days of evidence before now"* | …changes nothing | **INSTANT** |
| *"This cache entry is 5 minutes old"* | …changes nothing | **INSTANT** |
| *"This observation was recorded at instant X"* | …changes nothing | **INSTANT** |

### 3.2 The third category, named before it is sprung

TIME1 § 12.3 named a scope trap. The test makes it precise:

> **CIVIL (foreign zone)** — a value needing *a* zone, but **not the household's**. A community event at 18:00 in Bristol is 18:00 `Europe/London` for a viewer in Madrid. The zone belongs to the **venue**, not the viewer.

**Community is the only domain in this category** (§ 4.11), and it does not exist yet — which is why naming it now is cheap and naming it later is not.

### 3.3 Consuming Household Time where it is not needed is a defect

**This is as important as the positive findings, and it is the discipline the mission's *"avoid duplicate ownership"* actually requires.**

`SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000` (`server/auth.ts:52`) is **correct**. Making it household-aware would mean a session's length depended on where the family lives — an absurdity, and a new bug. The same holds for the trial countdown, the evidence window, and every cache.

> **The audit's boundary rule: a duration is not a date.** Five domains are correct **because** they are genuinely INSTANT, and the absence of a time zone has cost them **nothing**. They must be left alone — and § 5's matrix records them as **`MUST NOT`**, not as *"not yet migrated"*, so no future sweep "fixes" them.

---

## 4. CONSUMER INVENTORY

Each domain answers the mission's six questions. **Order** refers to § 10's roadmap step.

---

### 4.1 HOME — 🔴 **Consumer. Highest user-visible severity.**

| | |
|---|---|
| **Why it needs Household Time** | Home makes **three** time claims in one viewport: a greeting, *"Today's Meals"*, and *"N plants **this week**"*. **All three are currently derived from the device clock or from a constant.** Home is where the platform's time incoherence is visible to the household in a single glance |
| **Consumes** | **T3** (greeting) · **T2** (today's date caption, today's meals) · **T5** (the week — plants, meals planned, days with meals) |
| **Must NOT own** | The phase boundaries; the day-of-week key space; *which* week is current; **any user-facing word** (INT21 owns every string). Home must not keep its own `WEEKLY_PLANT_TARGET` — it already does (`home-experience-page.tsx:49`), duplicating the canonical constant at `shared/nutrition/household-nutrition.ts:96` |
| **Canonical owner** | `shared/time/household-time.ts` (T2/T3/T5) · Planner Domain 14 (the weeks) · Behaviour Engine INT21 (the words) |
| **Dependencies** | Step 1 (module) → T3; Step 2 (zone) → T2; **Step 4 (anchor) → T5** |
| **Order** | **Step 3** (greeting, today) · **Step 5** (the week) |

**The live defect — Home contradicts itself in one viewport.** `weeklyProgress` comes from the server's `max(weekNumber)` — **always Week 6** (`routes.ts:11503-11505`; TIME1 § 3.1). *"Today's Meals"* comes from `loadActiveWeek()` — `localStorage["planner:active-week"]`, **defaulting to 1** (`home-experience-page.tsx:48-61`).

> **On the same screen, "N plants this week" describes Week 6 and the dinners listed above it describe Week 1.** Neither is the calendar week. Nothing reconciles them, because there is no date to reconcile them with.

This is a **fifth** rival "current week" (§ 7.2) — and the only one stored in `localStorage`.

---

### 4.2 PLANNER — 🟢 **Owner of the anchor. Consumes almost nothing.**

| | |
|---|---|
| **Why it needs Household Time** | **It mostly does not — and that is a structural strength, not a gap.** The Planner does **no date arithmetic**, because it has no dates. Its cross-week copy adds **1 to an integer** (`weekly-planner-page.tsx:1608`). It needs Household Time for exactly one thing: to **write** the anchor at week creation (TIME1 § 6.2) |
| **Consumes** | **T2** — once, at `createPlannerWeeks`, to stamp `weekStartDate`. Nothing else |
| **Must NOT own** | The zone; the phase; the definition of "today"; **the meaning of `dayOfWeek`** (it *stores* the integer; the module *declares* what it means) |
| **Canonical owner** | **The Planner owns `weekStartDate`** — Domain 14, written by its existing single write funnel (Rule CPuBA4). `shared/time/household-time.ts` owns the *derivation* over it |
| **Dependencies** | Step 2 (zone) — you cannot stamp a household's Monday without knowing their zone |
| **Order** | **Step 4** — and it gates Step 5 and Step 6 entirely |

> **The Planner is the domain every other domain is trying to date.** It is time-free and honest; `buildHouseholdHistory` exists *solely* to manufacture the dates the Planner refuses to store, so that the intelligence engines have something to compute on. **Fix the Planner's anchor and the fabricator becomes deletable** — which is why Step 4 unblocks more than any other step.

---

### 4.3 SHOPPING — ✅ **Not a consumer. The reference implementation.**

| | |
|---|---|
| **Why it needs Household Time** | **It does not, today.** Shopping is the cleanest domain in the audit |
| **Consumes** | **Nothing.** `shopping_fulfilment_memory.chosenAt` is a `withTimezone` instant read in exactly one place — `routes.ts:11258`, `.orderBy(desc(...))` — **for ordering only**. No window, no cutoff, no "days ago", no decomposition into a calendar day |
| **Must NOT own** | Nothing to own. **It must not acquire a clock** during convergence |
| **Canonical owner** | n/a |
| **Dependencies** | None |
| **Order** | **Never** (unless a trip-timing feature is built — § 12) |

> **This is the pattern the rest of the platform should be measured against: an instant used as an instant.** It is TZ-proof and DST-proof *by construction*. If the clock is wrong, the only consequence is that a suggestion is ranked in the wrong order — **no lie is told.**

---

### 4.4 PANTRY — 🟡 **Not a consumer today. Blocked twice.**

| | |
|---|---|
| **Why it needs Household Time** | **It does not today, because it cannot.** `user_pantry_items` (`schema.ts:1010-1025`) has **no date column at all** beyond `createdAt` — no expiry, no purchase date, no best-before. **The pantry has no concept of food ageing.** The domain most semantically entitled to expiry owns none |
| **Consumes** | **T2** — but only *indirectly and wrongly*: `/api/pantry/search-index` badges foods "in season now" via `seasonForDate(new Date())` (`routes.ts:5872-5874`) — the **server process's** month. The one cosmetic read is `MICRO_INSIGHTS[new Date().getDate() % N]` (`pantry-page.tsx:1095`) — device day-of-month, rotates unevenly across month ends, harmless |
| **Must NOT own** | An expiry model invented inside the pantry; a second season rule; a purchase-date column added opportunistically |
| **Canonical owner** | `shared/time/household-time.ts` (T2) → the season rule (S). **Pantry freshness has no owner because the fact does not exist** |
| **Dependencies** | **Blocked twice**: (1) Step 2 (zone); (2) **Pantry has no Source of Truth Register domain at all** — HOME2 § 8.3, unresolved. A domain with no declared owner cannot be given a new fact (Register Rule 8) |
| **Order** | **Step 3** for the season input. **Freshness: not scheduled** — it needs a governed new fact and a register domain first |

**`activity_summary` is correctly time-independent** — counters only (`currentShoppingItems`, `lifetimePantryAdds`), read at `routing.ts:35-36` with no time predicate. *"Lifetime"* and *"current"*, never *"this week"*. **It must stay that way.**

---

### 4.5 COOKBOOK / MEALS — 🔴 **Consumer. The worst domain in the audit.**

| | |
|---|---|
| **Why it needs Household Time** | The freezer makes **food-safety-adjacent claims** — *"Expired"*, *"{n}d left"*, *"Expires {date}"* — and every one of the four failure modes is present at once |
| **Consumes** | **T2** (the civil day a meal was frozen; the civil day it expires) |
| **Must NOT own** | The definition of "today"; date parsing conventions; **its own expiry arithmetic**. It must not keep `frozenDate`/`expiryDate` as `text` |
| **Canonical owner** | `shared/time/household-time.ts` (T2) · Meals Domain 12 (the freezer rows) |
| **Dependencies** | Step 2 (zone). **No anchor needed** — this is pure T2 |
| **Order** | **Step 3** — high severity, low cost, no anchor dependency |

**Four stacked defects:**

1. **The type is wrong.** `frozenDate: text("frozen_date").notNull()`, `expiryDate: text("expiry_date")` (`schema.ts:812-813`). Postgres validates nothing. **The server never reads them** — `grep expiryDate` over `server/` returns zero. The freezer's entire temporal model is client-authored strings the server accepts verbatim.
2. **The write is UTC.** `frozenDate: new Date().toISOString().split('T')[0]` (`meals-page.tsx:2789`; same at `use-planner-operations.ts:347`). Freeze at 20:00 in New York → recorded as **tomorrow**.
3. **The comparison mixes frames.** `new Date(frozen.expiryDate) < new Date()` (`meals-page.tsx:4414`) — `new Date("2026-07-16")` parses as **UTC midnight**; `new Date()` is the **local** instant. The "Expired" badge flips at UTC midnight — **01:00 BST for a UK household**, so the whole final day is lost; for US households food is declared expired **while still in date**.
4. **Epoch-ms arithmetic** (`:4415`): `Math.ceil((… .getTime() - Date.now()) / (1000*60*60*24))`. Across DST a civil day is 23 or 25 hours and `Math.ceil` **converts that hour into a whole day**. Combined with (3), `daysUntilExpiry` and `isExpired` can **disagree with each other** — the badge reads *"Expires in 1 day"* while `isExpired` already reads true.

---

### 4.6 DIARY — 🔴 **Consumer. Half-right, and the wrong half poisons the right half.**

| | |
|---|---|
| **Why it needs Household Time** | The diary's primary key **is** a civil date, and the client is its sole author. `food_diary_days.date` is `text`, `unique(userId, date)` (`schema.ts:1258`, `:1263`) — **a uniqueness constraint on an unvalidated client string** |
| **Consumes** | **T2** (which day am I logging?) · **T4** (trend windows) |
| **Must NOT own** | The definition of "today"; the date serialisation format; **the `T12:00:00` guard** (a workaround that retires with the Foundation) |
| **Canonical owner** | `shared/time/household-time.ts` (T2/T4) · Diary Domain 21 (the rows) |
| **Dependencies** | Step 2 (zone) |
| **Order** | **Step 3** |

> **Someone here knew about DST and got it right.** `new Date(dateStr + "T12:00:00")` (`food-diary-page.tsx:128`, `:930-935`, `:1446-1454`) noon-anchors so a ±1h DST shift can never cross a date boundary, and `d.setDate(d.getDate() ± 1)` is **correct local-calendar arithmetic — the only place in the codebase that does this properly.**

**And `toDateStr` destroys it.** `toISOString().slice(0,10)` (`:123-125`) funnels every carefully noon-anchored local Date back through **UTC**:

- `goToday()` / `isToday` at 00:30 BST resolve to **yesterday**. The household taps "Today" and lands on **yesterday's diary**.
- The noon anchor survives only within ±12h. **At UTC+13, `prevDay()` skips two days and `nextDay()` appears not to move.**

**And a live server bug:** `copyPlannerToFoodDiary` (`storage.ts:3073-3074`) parses `new Date(date)` as **UTC midnight** then reads `.getDay()` in **server-local**. Verified empirically: `TZ=America/New_York new Date("2026-07-16").getDay() = 3`; `TZ=UTC → 4`. **Any server west of UTC copies the wrong weekday's meals into the diary**, silently.

---

### 4.7 COMPANION — 🔴 **Consumer. The single highest-leverage line in the platform.**

| | |
|---|---|
| **Why it needs Household Time** | `temporalAnchor` is the closest thing THA has to an owner of household time, and it is **handed to the language model as fact** |
| **Consumes** | **T2** (the anchor; the diary day it reads and writes) · **T3** (future — re-aiming, `TRANSLATION1` § 8) |
| **Must NOT own** | The anchor's derivation. **It must never template time into a prompt** — INT17 is *"the single owner of every byte the language model reads as grounding"*; time enters **only** inside a Context View, composed under INT17's budget (TIME1 § 12.2) |
| **Canonical owner** | `shared/time/household-time.ts` (T2) → composed by **INT17** |
| **Dependencies** | Step 2 (zone) |
| **Order** | **Step 3 — first. One line, largest blast radius.** |

```ts
// server/intelligence/conversation/context-frame-assembler.ts:119
const temporalAnchor = new Date().toISOString().slice(0, 10);
```

Its own doc comment (`:79`) claims it *"grounds the LLM to today"*. **It grounds the LLM to UTC's today.** That one line becomes:

- **The literal string `TODAY: ${frame.temporalAnchor}` in the system prompt** (`conversation-gateway.ts:1053`). Every relative expression the model produces — *"tonight"*, *"tomorrow"*, *"yesterday"* — is computed off a wrong anchor for any UK household between 00:00–01:00 BST and any US household after ~19:00 local.
- **The diary day the Companion reads and writes** — `{ scope: "day", date: hints.temporalAnchor }` (`pattern-intent-resolver.ts:1130`, `:1141`, `:2793`). Ask it to log tonight's dinner in New York and it can land in **tomorrow's** diary — while the diary UI's own `goToday()` is wrong in a *different* way (§ 4.6). **Three different "todays" for one household.**

**`computeGrowthSignal` (`companion-growth.ts:63-77`) already has the seam** — `now: Date = new Date()` as an injectable parameter. It is one of only three such seams in the codebase (with `seasonal/engine.ts:320` and `nutrition-centre-assembler.ts:128`), and it is **exactly the shape `bundle.ts:75-77` says the platform needs everywhere**. Its windows are still cross-frame (local cutoffs vs UTC-midnight `new Date(t.date)`), and with `MIN_SAMPLES_PER_WINDOW = 5` a single boundary misclassification can **silence a true signal or reverse the direction of a claim** the Companion speaks aloud.

---

### 4.8 NOTIFICATIONS — 🟡 **Not a consumer today. The sharpest architectural finding.**

| | |
|---|---|
| **Why it needs Household Time** | **It does not — today.** No notification infrastructure exists: no table, no route, no scheduler, no push-token store, no `notificationsEnabled`. `@capacitor/local-notifications` and `@capacitor/push-notifications` are **not wired**, despite `capacitor.config.ts` being present |
| **Consumes** | **Nothing.** "Reminders" is a pull-based, render-time section on Home (`home-experience-page.tsx:358-366`) fed by `useCompanionNotices`. **It fires only when the user opens Home.** Nothing is scheduled; nothing wakes up |
| **Must NOT own** | **A scheduler.** **A delivery clock.** **A second notice channel** — INT20 § 9: *"Any second ambient-notice channel … **stop**"* |
| **Canonical owner** | `shared/time/household-time.ts` (T2/T3) → **the Notice Engine decides; time only triggers** (TIME1 § 12.1) |
| **Dependencies** | Step 2 (zone) + a channel owner + consent |
| **Order** | **Not scheduled.** A genuinely new surface |

**The Notice Engine consciously traded "the right moment" for "no time dependency"**, and documented it (`notice-engine.ts:216-218`):

> *"A streak is 'notable' … only at a round multiple — **a stateless heuristic for what deserves a moment, not a persisted 'just crossed' detector**."*

`noticeStreak` (`:235`) is `streak.currentEliteStreak % 7 !== 0` — **pure integer modulo, no clock.** It cannot know *when* a streak was crossed, only that the value divides by seven.

> **That trade holds only while delivery is pull-based.** The instant anyone ships a push — *"your plan starts tomorrow"* — this domain acquires a hard dependency on household time (**never notify at 3 a.m. local**), and there is no column, no function, and no `Intl.` call in the entire server that could answer *"what time is it for this household?"*
>
> **The finding, in one line:** `MAX_NOTICES_PER_MOMENT = 2` budgets **how many** notices per moment — and **nothing in the platform defines when a moment is.**

---

### 4.9 FOOD INTELLIGENCE — 🔴 **Consumer, and the platform's date *fabricator*.**

| | |
|---|---|
| **Why it needs Household Time** | It makes **assertions about the physical world** (*"at its best right now"*) and **about the household's own past** (*"Friday became curry night"*). Both are currently derived from invented dates and a process-local month |
| **Consumes** | **T2** (→ S, the season input) · **T5** (planner-gap opportunities) · **real dates** (which only Step 4 can supply) |
| **Must NOT own** | A season rule (§ 7.4) · a "current week" rule (it has the **third** copy) · **a date fabricator**. Its own architecture already forbids ownership: *"Owns ZERO business-domain data"* (`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:75`) |
| **Canonical owner** | `shared/time/household-time.ts` (T2/T5) · the season rule (S) · Planner Domain 14 (the real dates) |
| **Dependencies** | Step 2 → the season input. **Step 4 (anchor) → everything else** |
| **Order** | **Step 3** (season input) · **Step 6** (retire the fabricator) |

**The fabricator, and why it is not a timezone bug.** `routes.ts:11372` (duplicated verbatim at `lib/household-history.ts:44-46`) carries **three stacked defects**:

1. **Epoch-ms arithmetic** with hardcoded `MS_PER_DAY` — DST-drifting, and since `approxDate` inherits `now`'s clock time and is later bucketed by `.getDay()`/`.getMonth()`, **an hour of drift silently reclassifies a meal into a different weekday, and at month boundaries a different season**.
2. **The convention is inverted** (§ 8.1). `Math.max(0, 6 - day.dayOfWeek)` is built on *"0 = Monday"* while the platform's real convention is **0 = Sunday**. **Every fabricated weekday is wrong** — not approximate, *wrong*.
3. **`maxWeek` ≡ 6** (TIME1 § 3.1), so Week 6 is always "this week" and Week 1 always "5 weeks ago" — **a meal a household plans to eat next month is timestamped five weeks in the past.**

It flows into `/api/pantry/discover` (`:11403`), `/api/pantry/stories` (`:11446`), `/api/home/intelligence` (`:11542`), the planner-week strip, and every Notice the Companion voices via `notice-gateway`.

> **All of Stories' arithmetic — the 30/90/180/365-day recency tiers (`stories/engine.ts:129-134`), the 180-day favourite gate (`:212`), the 30-day go-to window (`:480-482`) — operates on `approxDate`. It is arithmetic on fiction.** The DST bugs are real but **secondary: the inputs were never true.**

**`shared/alternatives/engine.ts` has zero clock reads** — verified. Correct by abstinence.

---

### 4.10 HOUSEHOLD NUTRITION — 🟡 **Consumer of T5 only. The most honest module in the audit.**

| | |
|---|---|
| **Why it needs Household Time** | Only to know **which planner week the household is actually living in**. Its "weekly" is a *planner* week, not a calendar week — and it says so |
| **Consumes** | **T5** — and nothing else. Not T2, not T3, not S |
| **Must NOT own** | A "current week" rule (it holds the **fourth** copy) · `WEEKLY_PLANT_TARGET` (Home duplicates it) · a calendar |
| **Canonical owner** | `shared/time/household-time.ts` (T5) · `shared/nutrition/household-nutrition.ts` (the target) |
| **Dependencies** | **Step 4 (anchor)** — nothing earlier helps it |
| **Order** | **Step 5** |

> **`shared/nutrition/household-nutrition.ts` is fully pure** — no `new Date`, no `getDay`, no `getMonth` — and it is honest *because* it refuses to read a clock. Its comment at `:109` is explicit: the denominator is **"Days in a planner week"** — the 7 slots of the lattice, not seven elapsed days. **Nothing about "30 plants a week" can be wrong-in-time, because it never claims to be about a time.**

**But the assembler reintroduces the assumption**, and states it as a belief (`household-nutrition-assembler.ts:200-201`):

> *"`weekNumber` defaults to the household's LATEST planned week — **the week a household looking at their dashboard is actually living in**."*

**Nothing verifies this.** Nothing *can* — there is no date on `planner_weeks`. A household rotating Weeks 1–2 gets their nutrition report for **Week 6**, and the assembler reports `daysWithMeals: 0` against a 7-day denominator. Its escape hatches (`:215`, `:222`) fire only for a **missing** week, never a **wrong** one — because *"wrong"* is not expressible without a date.

**`nutrition-centre-assembler.ts:246-248`** — *"not cooked recently"* is `a.lastWeek <= maxLastWeek - 2`: **week-index** arithmetic. Since planner weeks have no duration, this means *"not in the last 2 grid columns"*.

> **If a household planned Week 6 in January and Week 4 in June, THA says the Week 4 food was "not cooked recently" — the exact opposite of the truth.** This domain cannot have a DST bug. It can only have a **meaning** bug, and it does.

---

### 4.11 COMMUNITY — ⚪ **Does not exist. The only domain that could be born correct.**

| | |
|---|---|
| **Why it needs Household Time** | It does not, because it is not a domain — it is a **reserved word**. Zero routes, zero tables, zero pages. Only three references exist, all deliberate reservations: `shared/recipe-acquisition.ts:34`, `:44` (marked `(future)`), and `server/verification/publication-register.ts:1240-1267`, whose check **asserts the lane stays empty** |
| **Consumes** | **Nothing.** Zero time reads |
| **Must NOT own** | **An event entity** (§ 7.5) · a second time owner to hold event-absolute time · a scheduler |
| **Canonical owner** | Household Time (T1–T5) for the *viewer*; **the venue's zone** for the *event* (§ 3.2) |
| **Dependencies** | The Community lane activating; the Foundation |
| **Order** | **Not scheduled** |

> **This is the only domain in the platform that would be *born* correct** — a greenfield surface where a household-time owner can be **required at design time rather than retrofitted**. Every social feature is unavoidably time-dense (*"posted 2 hours ago"*, weekly challenges, event times), and it is the one place in this audit where the cost of getting time right is **zero** rather than a migration.
>
> **And it is the one domain that will be tempted to mint a second time owner**, because its events are **CIVIL (foreign zone)** — a category no other domain needs (§ 3.2). Naming that now is the cheapest governance act available.

---

### 4.12 ADDITIONAL CONSUMERS DISCOVERED

Nine domains the mission did not name. **Four are true consumers; five must never consume.**

#### 🔴 Consumers

| Domain | Consumes | Finding | Order |
|---|---|---|---|
| **Streaks / Elite** (`routes.ts:6708-6713`) | **T2, T4** | `getWeekStart` — a **fourth** Monday-week implementation. Three defects in six lines: **frame-mixed** (`getDay()`/`getDate()` local, `.toISOString()` UTC); **mutates its argument** (`new Date(d.setDate(diff))` — harmless only because the caller passes a throwaway); and `today` (`:6700`, UTC) **disagrees with `currentWeekStart`** (`:6713`, local) *in the same request*. **Streaks break for anyone not near Greenwich** — and feed a spoken Companion milestone via `notice-engine.ts:237-248` | **Step 5** |
| **Savings** (`storage.ts:3689-3706`) | **T2, T4** | A **fifth** Monday-week implementation, same frame-mix. Worst case: `new Date(y, m, 1).toISOString()` builds **local** midnight then converts to UTC — **for any server east of UTC this yields the last day of the previous month**, so "this month's savings" silently gains or loses a day at both ends. Queried against `savings_events.date`, itself `text` (`schema.ts:1350`) | **Step 5** |
| **Health Trends** (`storage.ts:1408-1410`, `:3140-3142`) | **T2** | Local `setDate` arithmetic → `.toISOString()` UTC → compared against client-authored `text` dates. The `?days=N` window includes/excludes one extra day at the boundary. `user_health_trends.date` is `text` (`schema.ts:763`) | **Step 3** |
| **Product / Analyser** (`schema.ts:793`) | **T2** | `product_history.scannedAt` is **`text`**, sorted **lexically** (`storage.ts:1462`). **And it leaks raw UTC to the household**: `comparison-engine.ts:326` interpolates the stored string into a sentence the Companion speaks — *"…scanned/recorded 2026-07-16T23:41:07.221Z"* | **Step 3** |

#### ✅ Must NOT consume — correct as INSTANT

| Domain | Why it is correct | Verdict |
|---|---|---|
| **Trial / Subscription** (`auth.ts:183`; `TrialBanner.tsx:24-34`) | `new Date(Date.now() + 20*60*1000)`. Columns are `withTimezone`. A 20-minute countdown needs no calendar | **✅ Reference implementation. Leave alone** |
| **Auth / Session** (`auth.ts:52`, `:273`, `:315`, `:365`, `:413`) | `SESSION_MAX_AGE_MS`; `Date.now() + 24h`. Comparisons are instant-vs-instant | **✅ Correct — but see § 9.4 for two *schema* defects** |
| **Learning / Evidence** (`framework.ts:199`, `:249`) | `EVIDENCE_WINDOW_DAYS = 90`; `new Date(Date.now() - 90*24*60*60*1000)`. Columns `withTimezone`. No decay, a hard cutoff | **✅ Reference implementation. Leave alone** |
| **Caching / TTL** (`retailIntelligence.ts:626`; `recipe-source-gate.ts:59`; all client `staleTime`) | Pure durations throughout | **✅ Correct. Leave alone** |
| **Shared Plan** (`shared-plan-page.tsx:12-54`) | Relative ordinals only — `weekNumber` × `dayOfWeek`, no `Date` at all. **A shared plan is a template, not a calendar** | **✅ Correct by abstinence** |

#### 🟡 Operator-scoped — a declaration, not a migration

| Domain | Finding |
|---|---|
| **Observation Engine** (`observation-engine.ts:191-193`) | `dayOf()` buckets by **UTC** day. Defensible for a global operator view — but **undeclared**, and `admin-observation-workbench-page.tsx:183` re-renders those instants in the **operator's local** zone, so **the bucket boundary and the displayed timestamp disagree**. An event shown `16 Jul 20:00` (UTC-5) sits in the `2026-07-17` bucket. **Forbidden from consuming household time** — Observation Engine § 7 (TIME1 § 3.4) |
| **Analytics** (`companion-guidance-analytics.ts:70`) | Same UTC bucketing, same undeclared frame |
| **Admin surfaces** (`admin-users-page.tsx:38-45`; `admin-benchmark-households-page.tsx:78`; `admin-observation-workbench-page.tsx:183`) | Rendered in the **operator's laptop** zone; `:183` passes **no locale at all**. Two operators in different offices see **different dates for the same event**, with nothing disclosing which frame is in play |
| **Benchmarks** (`world-seeder.ts:277-286`) | `offsetDateIso` — same frame-mix. A non-UTC runner seeds the fixture **off by one day**, silently changing what "this week" means for every benchmark question. `bundle.ts:78`: `export const BENCHMARK_CLOCK = "wall";` — honest, and names the fix |

> **Operator time is a third scope** (household · operator · absolute). The correct action is **to declare the frame, not to give operators household time** — an operator reviewing a household in Tokyo should see UTC or their own zone *labelled*, never the household's silently.

---

## 5. THE OWNERSHIP MATRIX

**Reads across. Owns down. `MUST NOT` is a permanent verdict, not a backlog.**

| Domain | T1 zone | T2 today | T3 phase | T4 week | T5 plannerWeek | S season | I instant | **Owns** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Home** | – | ✅ | ✅ | – | ✅ | – | – | **Nothing** |
| **Planner** | – | ✅¹ | – | – | – | – | – | **`weekStartDate`** (D14) |
| **Household** | – | – | – | – | – | – | – | **`timeZone`** (D16) |
| **Shopping** | – | – | – | – | – | – | ✅ | Nothing |
| **Pantry** | – | ✅ | – | – | – | ✅ | – | Nothing |
| **Cookbook** | – | ✅ | – | – | – | – | – | Freezer rows (D12) |
| **Diary** | – | ✅ | – | ✅ | – | – | – | Diary rows (D21) |
| **Companion** | – | ✅ | ✅ | – | – | – | – | **Nothing** — INT17 composes |
| **Notifications** | – | ○ | ○ | – | – | – | – | **Nothing** — INT20 decides |
| **Food Intelligence** | – | ✅ | – | – | ✅ | ✅ | – | **Nothing** (its own § 75) |
| **Household Nutrition** | – | – | – | – | ✅ | – | – | The target |
| **Community** | – | ○ | – | – | – | – | ○² | **Nothing** |
| **Streaks** | – | ✅ | ✅ | ✅ | – | – | – | `user_streaks` rows |
| **Savings** | – | ✅ | ✅ | ✅ | – | – | – | `savings_events` rows |
| **Health Trends** | – | ✅ | – | – | – | – | – | Trend rows |
| **Product/Analyser** | – | ✅ | – | – | – | – | ✅ | `product_history` rows |
| **Trial / Auth** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Token/session instants |
| **Learning** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Evidence instants |
| **Caching** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Nothing |
| **Observation** | 🚫³ | 🚫³ | 🚫³ | 🚫³ | 🚫³ | 🚫 | ✅ | `platform_observations` |
| **Decision Engine** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Delivery instants |

✅ consumes · ○ future consumer · – n/a · 🚫 **MUST NOT consume**
¹ *writes* the anchor at creation only · ² CIVIL (foreign zone) — the venue's, never the household's · ³ **forbidden by Observation Engine § 7**

**Every cell in the "Owns" column is either `Nothing` or a fact the domain already owns.** No domain acquires a new ownership. **The matrix's whole content is that Household Time is read by twenty domains and owned by none of them.**

---

## 6. THE DEPENDENCY GRAPH

```
   ┌──────────────────────────────────────────────────────────────┐
   │  STEP 0 — GOVERNANCE (no code)                               │
   │  TIME1's register amendment: Appendix A row + D14 + D16      │
   │  Without this there is no owner to converge onto.            │
   └───────────────────────────┬──────────────────────────────────┘
                               │
   ┌───────────────────────────▼──────────────────────────────────┐
   │  STEP 1 — THE MODULE   shared/time/household-time.ts         │
   │  Declares: dayOfWeek key space (0=Sun) · week starts Monday  │
   │            · phase vocabulary · the derivations              │
   │  Zero consumers. No dependency. Reversible: delete one file. │
   └──────┬──────────────────────────────┬────────────────────────┘
          │                              │
          │                    ┌─────────▼──────────────────────┐
          │                    │ STEP 1a — SEASON CONVERGENCE   │
          │                    │ 3 impls → 1 (Rule 4)           │
          │                    │ INDEPENDENT of the zone.       │
          │                    └────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  STEP 2 — THE ZONE   households.timeZone  (nullable)         │
   │  Unblocks EVERY T2/T3 consumer. No anchor required.          │
   └──────┬───────────────────────────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  STEP 3 — THE T2/T3 CONVERGENCE  (no anchor needed)          │
   │  1. Companion temporalAnchor  ← highest leverage, one line   │
   │  2. Diary toDateStr                                          │
   │  3. Cookbook freezer expiry   ← highest user harm            │
   │  4. Greeting (×4 copies)                                     │
   │  5. Health trends · Product scannedAt · Pantry season input  │
   └──────┬───────────────────────────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  STEP 4 — THE ANCHOR   planner_weeks.weekStartDate           │
   │  ★ THE GATE. Written at creation only; never back-filled.    │
   └──────┬───────────────────────────┬───────────────────────────┘
          │                           │
   ┌──────▼──────────────────┐  ┌─────▼────────────────────────────┐
   │ STEP 5 — T5 CONSUMERS   │  │ STEP 6 — RETIRE THE FABRICATOR   │
   │ Home's week · dashboard │  │ approxDate ×2 deleted.           │
   │ · nutrition assembler   │  │ Stories & Seasonal become honest │
   │ · opportunity-engine    │  │ FOR THE FIRST TIME.              │
   │ · streaks · savings     │  │ ← Cannot happen before Step 4.   │
   └─────────────────────────┘  └──────────────────────────────────┘
```

**The three facts the graph encodes:**

1. **Step 0 is not optional and is not code.** Steps 1–6 are convergences onto an owner. The register must name that owner first, or every step is a workstream inventing a store (Register Rule 8).
2. **Step 2 unblocks more than Step 4, and costs less.** Seven of the twelve consumers need only T1+T2. **The anchor is not on the critical path for most of the harm** — including the Companion's `temporalAnchor` and the freezer, the two sharpest defects.
3. **Step 6 is gated absolutely by Step 4.** Stories' claims cannot be repaired by household time; they need a real date to exist first (§ 1.5). **Any attempt to "fix Stories' timezone" before Step 4 is wasted work** — it would make a fabricated date *precisely* wrong.

---

## 7. THE FIVE CONFIRMATIONS

**Two hold. Three are refuted.** In each refuted case, the duplication the mission asked me to prevent **already exists** — which is TIME1 § 2's finding, holding at every seam.

### 7.1 ✅ *"Household Time remains the single canonical owner of time"* — **HOLDS, conditionally**

**Holds by design** (§ 5): twenty domains read, none owns. Every consumer's "Owns" cell is `Nothing` or a fact it already owned.

**The condition:** it "remains" nothing until Step 0. **The register recognises no time owner today** (§ 0.1). A property cannot be preserved before it exists.

### 7.2 ❌ *"No duplicate 'today' logic"* — **REFUTED. It is already duplicated at scale.**

**Five rival "current week" implementations:**

| # | Implementation | Answer |
|---|---|---|
| 1 | `routes.ts:11503-11505` — `max(weekNumber)` | **Always Week 6** |
| 2 | `opportunity-engine.ts:385` — `reduce(… weekNumber > latest …)` | **Always Week 6** |
| 3 | `household-nutrition-assembler.ts:216-217` — `weeks[weeks.length-1]` | **Always Week 6** |
| 4 | `dashboard.tsx:191` — `plannerFull[0]` | **Always Week 1** |
| 5 | `home-experience-page.tsx:48-61` — `localStorage["planner:active-week"]` | **Defaults to 1** |

**Nineteen week-shape declarations across sixteen files** — 12 Sunday-first arrays, 4 Monday-first arrays, and **5 copies of the `[1,2,3,4,5,6,0]` reorder map**.

**Five frames live simultaneously:** UTC · server-process-local · browser-local · noon-anchored-local · week-index.

> **The reorder map is the most telling artefact in the audit.** `[1,2,3,4,5,6,0]` **is** the Monday-first convention, hand-rolled five times. **The product already decided the week starts Monday — it just decided it five times, locally, in display code, with no owner.** TIME1 § 5.5's proposal is not a new decision; it is an existing *undeclared* one.

### 7.3 ⚠️ *"No duplicate schedulers"* — **HOLDS VACUOUSLY. This is an absence, not a guarantee.**

**There is no scheduler at all.** No `node-cron`, `bullmq`, or `agenda`. Stated in-code (`routes.ts:12770`): *"No scheduler — this is the only way a snapshot is taken."* Expired demo rows are reaped only when an admin manually calls `/api/admin/demo/cleanup-expired` (`auth.ts:528-537`).

> **Confirming "no duplicate schedulers" today is worth nothing.** The confirmation that matters is **prospective**: when the first scheduler arrives — and Notifications is the only domain that needs one (§ 4.8) — it must arrive **once**, as a platform capability, and **it must not be built inside the Notice Engine**. Time triggers; INT20 decides; the scheduler is a third thing that owns neither.

### 7.4 ❌ *"No duplicate season logic"* — **REFUTED. Three implementations, and the declared owner is not the real one.**

| # | Implementation | Visibility | Consumers |
|---|---|---|---|
| 1 | `shared/discovery/seasonal-map.ts:63-69` — `seasonForDate()`, `getMonth()` 0-indexed | **Exported** | **5+** — discovery, `meal-intelligence-assembler.ts:317`, `planner-explanation-context.ts:124`, `meal-food-intelligence.ts`, `routes.ts:5873` |
| 2 | `shared/seasonal/engine.ts:96-102` — `seasonOf()`, `getMonth()+1` | **Private** | 1 (itself) |
| 3 | `shared/stories/engine.ts:137-143` — `seasonOf()`, **byte-identical to #2** | **Private** | 1 (itself) |

**#2 and #3 are byte-identical copies** — Register **Rule 4**'s exact fail case. **#1 expresses the same rule with a different month base** (0 vs 1) — semantically equal today, which is *worse*: a reviewer diffing them sees different numbers and cannot tell at a glance that they agree.

**And the duplication is documented as a virtue** (`seasonal/engine.ts:90-91`):

> *"This matches WS10's `seasonOf` and WS8's `seasonForDate` exactly — **three engines, one season truth**."*

> **"One season truth" is the claim. The mechanism is that three authors wrote the same if-ladder and somebody checked once.** That is a comment, not an owner.

**The ownership is inverted.** The Source of Truth Register declares **Domain 11 Seasonal Stories → `shared/seasonal/engine.ts`**. But that file's season rule is **private with one consumer**, while every real consumer imports **Discovery's** (`shared/discovery/seasonal-map.ts` — **Domain 8's file**).

> **The season rule's declared owner is not its actual owner, and its actual owner sits in the wrong domain's folder.** This is a Register Rule 1 defect that predates TIME1, is **independent of household time**, and is fixable at **Step 1a** without a zone or an anchor.

**Scope note, and it is a genuine one:** `seasonForDate` reads the **server process's** month. **The season is currently a property of where THA is deployed, not of the household.** `seasonal/engine.ts:89-93` defers hemispheres *deliberately* and correctly for a UK-only catalogue — but the copy it produces (*"At its best in the UK summer"* — `discovery/engine.ts:275`; *"is at its best right now"* — `household-companion-fields.ts:119`) makes **assertions about the physical world**, and on the wrong side of a month boundary they are simply false.

### 7.5 ⚠️ *"No duplicate event ownership"* — **HOLDS VACUOUSLY. No events exist.**

Zero recurrence, zero RRULE, zero repeat model, zero events table. The only "holiday" in the product is a **free-text placeholder** (`food-diary-page.tsx:994` — `placeholder="e.g. Holiday, Birthday…"`).

> **The prospective confirmation:** when events arrive they must have **one owner**, and it must be **household state** — not Community's, not the Planner's, not the Notice Engine's. **School holidays must never be seeded** (TIME1 § 7, #11): they vary by local authority and by school, so a national list would be *wrong for most households* — fabrication at scale. **Bank holidays are a separate, knowledge-shaped fact** (CPuBA Variant 2, region-scoped, currency-gated) and must not be conflated with household events.

---

## 8. CORRECTIONS TO TIME1

An audit that only confirmed its foundation would not be worth running. **Three of TIME1's claims are wrong or incomplete**, stated here rather than quietly fixed.

### 8.1 TIME1 § 3.2 is wrong: `dayOfWeek` is not "correct by coincidence with one false comment"

TIME1 concluded that `0 = Sunday` held by consumer consensus and that `routes.ts:11371`'s *"0 = Monday"* was an isolated false comment. **The server is genuinely split, and the misreading has produced live defects.**

| Camp | Evidence |
|---|---|
| **0 = Sunday** — *the real convention* | `weekly-planner-page.tsx:105` + `:107` (the primary planner UI: `DAY_NAMES[0]==="Sunday"`, and `MONDAY_FIRST_ORDER` moves `0` **last**) · `storage.ts:3074` · `routes.ts:7431` (the template bridge, `Mon=1..Sun=7 → Sun=0..Sat=6`) · 12 client arrays |
| **0 = Monday** — *a minority misreading* | `routes.ts:11371` · `household-history.ts:43` · **`storage.ts:3345` (live code)** · `test-intelligence-food-opportunity-binding.ts:96` |

**It is not a 50/50 split — `0 = Sunday` is the convention. But the misreading is in live code, twice:**

1. **`storage.ts:3345-3348` — the starter-meal seeder:**
   ```ts
   const monday    = days.find(d => d.dayOfWeek === 0);   // ← this is SUNDAY
   const tuesday   = days.find(d => d.dayOfWeek === 1);
   ```
   > **Every new THA household's starter meals are seeded onto Sunday–Wednesday while the code believes it is seeding Monday–Thursday.** It is the first thing a new household sees, and it is off by one.

2. **`routes.ts:11372`** — the fabricator's offset is built on the inverted reading (§ 4.9).

**The corrected finding:** the defect was never the numbering, and it is not a typo either. **It is an undeclared key space that eleven consumers read correctly and four read backwards** — and Principle 1's fail test (*"two stores that use different keys for the same real-world entity → fail"*) is met **inside one file** (`storage.ts:3074` vs `:3345`).

### 8.2 TIME1 undercounted the duplication

| TIME1 said | The audit found |
|---|---|
| "3 rival day arrays" | **19 declarations across 16 files** (§ 7.2) |
| "2 rival 'current week' definitions" | **5** (§ 7.2) |
| Season: "already owned — creates no second owner" | **3 implementations; the declared owner is not the real one** (§ 7.4) |
| "6 private clocks" | **5 frames; ~20 consuming sites** |

**This strengthens TIME1's conclusion rather than weakening it.** Its § 2 thesis — *duplicate ownership of time is already live, so the Foundation is a convergence, not an addition* — is more true than it claimed.

### 8.3 TIME1 § 9's retirement list is incomplete

It named four `getGreeting()` copies, three day arrays, two `approxDate` copies and two "current week" definitions. **Add:** the season rule ×3 · two further "current week" implementations · `getWeekStart` · `getSavingsAggregates`'s week/month · the diary's `T12:00:00` guard · `dayOfYear` (`routes.ts:12156`) · `offsetDateIso` · `WEEKLY_PLANT_TARGET`'s duplicate (`home-experience-page.tsx:49`).

> **Principle 8 requires the retirement list to be named in the document that introduces the replacement.** TIME1's list must be amended before Step 0, or the workstream will converge two-thirds of the duplication and leave the rest looking sanctioned.

---

## 9. RISKS AND ARCHITECTURAL CONSTRAINTS

### 9.1 The binding constraints

| # | Constraint | Owner | What it forbids |
|---|---|---|---|
| **C1** | **Time may aim words and doors, never light** | `TRANSLATION1` *Morning Rhythm* § 9; Blueprint § 7, § 16 | Any consumer reading T3 to dim, tint, or theme. **STOP.** NORTH2 § 3.5 stands |
| **C2** | **Telemetry may never inform behaviour** | Observation Engine § 7 | Any consumer deriving a household routine from `platform_observations`. `OBS_DISABLE_CAPTURE=1` stays a no-op |
| **C3** | **One mouth for the model** | INT17 | Any consumer templating a date into a prompt. Time enters **only** via a Context View |
| **C4** | **Time triggers; INT20 decides** | INT20 § 9 | Any consumer surfacing a time-driven notice outside the Notice Engine |
| **C5** | **The attention stack is clock-free** | DEC1; `shared/attention/decision.ts:20-22` | Time becoming an attention signal. *"It's Tuesday"* must never rank an opportunity |
| **C6** | **A duration is not a date** | § 3.3 | Consuming T1–T5 in an INSTANT domain |
| **C7** | **Nothing derived is stored** | Principle 7 | A `todaysDate` column; a cached week. `activity_summary`'s recorded drift is the precedent |

### 9.2 The risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Step 0 is skipped** — the module ships without the register amendment, so THA gains a *21st* time implementation that merely *looks* canonical | 🔴 **Highest** | § 6's graph makes Step 0 the root. A module nobody is obliged to use is a rival, not an owner |
| 2 | **Step 4 is attempted before Step 2**, or Step 6 before Step 4 | 🔴 High | § 6. Fixing Stories' timezone before the anchor makes a *fabricated* date **precisely** wrong — the worst outcome available |
| 3 | **Convergence stalls after Step 3** — the visible harm is fixed, the anchor never lands, and `approxDate` is sanctioned by survival | 🔴 High | TIME1 Risk 1 (PKR1 Risk R7). **Step 3 must not ship without Step 4 scheduled** |
| 4 | **An INSTANT domain is "fixed"** — a sweep makes the trial countdown or the evidence window household-aware | 🟡 Medium | § 5 records `MUST NOT` as a **permanent verdict**. C6 |
| 5 | **The anchor gets back-filled** because `NULL` looks like a bug | 🟡 Medium | TIME1 § 6.2. A back-filled anchor is `approxDate` with a schema |
| 6 | **Operators are given household time** | 🟡 Medium | § 4.12. **Declare the frame; do not convert it.** An operator must never silently see a household's zone |
| 7 | **The `dayOfWeek` key space is "fixed" by renumbering** to ISO | 🟡 Medium | TIME1 § 5.5: **declare, do not migrate.** Renumbering silently rotates Home's "Today's meals" and no test would catch it |
| 8 | **A scheduler is built inside the Notice Engine** | 🟡 Medium | § 7.3; C4 |
| 9 | **Community mints a second time owner** for event-absolute time | 🟢 Low, but permanent if it happens | § 3.2, § 4.11. Cheap to name now |
| 10 | **The season rule convergence is deferred** because it "isn't a time bug" | 🟢 Low | It *isn't* — and that is why it is **Step 1a**: it needs no zone, no anchor, and no register row |

### 9.3 The constraint the audit adds to TIME1

> **A consumer that consumes Household Time must consume *all* of it.**

Half-converged is worse than unconverged. `getWeekStart` computes its week boundary in **server-local** and its `today` in **UTC** *in the same request* (`routes.ts:6700` vs `:6713`) — the household is compared against **two calendars at once**. A consumer that takes T2 from the module but keeps its own week arithmetic reproduces exactly that failure with a canonical-looking veneer.

### 9.4 Live defects found — reported, not fixed

All fourteen pre-date TIME2. None is touched here. **Six are user-visible.**

| # | Defect | Visible? |
|---|---|---|
| 1 | **Starter meals seeded on the wrong days** — `storage.ts:3345-3348` (§ 8.1). Every new household | ✅ |
| 2 | **Home contradicts itself** — Week 6's plants above Week 1's dinners (§ 4.1) | ✅ |
| 3 | **Freezer expiry wrong for hours daily** — UK loses the final day; US told food expired while in date (§ 4.5) | ✅ |
| 4 | **"Today" opens yesterday** at 00:30 BST; skips two days at UTC+13 (§ 4.6) | ✅ |
| 5 | **Raw UTC ISO spoken to the household** — `comparison-engine.ts:326` (§ 4.12) | ✅ |
| 6 | **Stories states invented facts** — *"Friday became curry night"* (§ 1.5) | ✅ |
| 7 | **The Companion's `TODAY` is UTC's** — wrong anchor + wrong diary day (§ 4.7) | Indirect |
| 8 | **`copyPlannerToFoodDiary` copies the wrong weekday** west of UTC — verified empirically (§ 4.6) | Indirect |
| 9 | **Streaks break outside Greenwich** — frame-mix + argument mutation (§ 4.12) | Indirect |
| 10 | **"This month's savings" off by a day** east of UTC (§ 4.12) | Indirect |
| 11 | **`password_reset_expires`: declared naive, DB is `TIMESTAMPTZ`** (`schema.ts:28` vs `migrations/runner.ts:74`). **If the process TZ is ever not UTC, reset tokens expire at the wrong instant** — early (lockout) or late (**an extended security window**). Masked only because the host defaults to UTC | 🔒 **Security** |
| 12 | **`email_verification_expires` has no migration at all** (`schema.ts:23`). Exists in production only via `drizzle-kit push`, as naive `TIMESTAMP` — so **two sibling token columns have physically different types despite identical declarations** | 🔒 **Security** |
| 13 | **Nutrition reports the wrong week** — "not cooked recently" inverted (§ 4.10) | Indirect |
| 14 | **Observation buckets and admin display disagree** (§ 4.12) | Operator |

> **#11 and #12 are security defects that have nothing to do with household time.** They surfaced because this audit read every timestamp in the schema. **They must be triaged on their own merits and must not wait for Step 0** — they are INSTANT-domain defects, and the Foundation will never touch them.

---

## 10. RECOMMENDED IMPLEMENTATION ROADMAP

| Step | Work | Needs | Unblocks | Risk | Reversible by |
|---|---|---|---|---|---|
| **0** | **GOVERNANCE — TIME1's register amendment.** Appendix A row (Household Time → `shared/time/household-time.ts`, on ATTN1/DEC1's exact footing) + D14 `weekStartDate` + D16 `timeZone`. **Amend TIME1 § 9's retirement list first** (§ 8.3) | Nothing | **Everything** | None — docs | Reverting one doc |
| **1** | **The module.** Pure, zero-I/O. **Declares `0 = Sunday`** (§ 8.1) · week starts Monday · the phase vocabulary. No new dependency — `Intl` suffices | 0 | 1a–6 | None — no consumer | Deleting one file |
| **1a** | **Season convergence** — 3 impls → 1; fix the declared/actual owner inversion (§ 7.4) | 1 | Honest season copy | Low | Reverting one import sweep |
| **2** | **The zone.** `households.timeZone`, nullable, detected-at-signup, user-correctable, `Europe/London` default with declared provenance | 1 | **7 of 12 consumers** | Very low — additive | Dropping one column |
| **3** | **T2/T3 convergence, in this order:** Companion `temporalAnchor` (**one line, largest blast radius**) → Cookbook freezer (**highest user harm**) → Diary `toDateStr` → greeting ×4 → health trends · `scannedAt` · pantry season input | 2 | Defects 3, 4, 5, 7 | Low — **isolated per consumer; `anchored:false` → today's behaviour** | Reverting one call site |
| **4** | **★ The anchor.** `planner_weeks.weekStartDate`, nullable, written **only at creation**, **never back-filled** | 2 | 5, 6 | Very low — additive, no row touched | Dropping one column |
| **5** | **T5 convergence.** Home's week · dashboard · nutrition assembler · opportunity-engine · streaks · savings. **The 5 rival "current weeks" collapse to 1** | 4 | Defects 2, 9, 10, 13 | Low | Reverting one call site |
| **6** | **Retire the fabricator.** Delete `approxDate` ×2. **Stories and Seasonal become honest for the first time** | 4 | Defects 1, 6 | Medium — the only step that **changes what THA says** | Not shipping it |
| **—** | **Out of band, do not sequence behind Step 0:** the two auth schema defects (§ 9.4 #11, #12) · `storage.ts:3345` starter-meal off-by-one · `dashboard.tsx:54` rotated chart · the `routes.ts:11371` false comment | — | — | — | — |

### 10.1 Why this order

- **Step 0 first** because Steps 1–6 are *convergences*, and there is nothing to converge onto until the register names an owner (§ 0.1).
- **Step 2 before Step 4** because **seven of twelve consumers need only the zone** — including the two sharpest defects (the Companion's anchor, the freezer). **The expensive step is not on the critical path for most of the harm.**
- **Step 1a anywhere after Step 1** because the season duplication is **not a time bug** — it needs no zone, no anchor, no register row. It is the cheapest genuine ownership win available.
- **Step 6 last** because it is the only step that **changes what THA says to a household**. Everything before it makes existing claims *true*; Step 6 **withdraws claims that were never true** — and that is a product decision as much as an engineering one.

### 10.2 The recommended next workstream

> **TIME3 — the TIME1 register amendment (Step 0). Documentation only. No code.**

It is the cheapest step, it is the root of the graph, and **it is the only one that cannot be skipped without turning the Foundation into the twenty-first time implementation.** Its Definition of Done: the Source of Truth Register names Household Time's owner, Domains 14 and 16 record their new facts, and TIME1 § 9's retirement list is complete (§ 8.3).

**Do not start with Step 3**, however tempting the one-line `temporalAnchor` fix is. A converged consumer pointing at an unregistered module is a **rival owner with better manners**.

---

## 11. GAPS RECORDED, NOT FILLED

1. **The window-expired decision** — TIME1 § 15.1. Still a **Planner product decision**. Step 4 makes the state visible; it does not decide what it means.
2. **Pantry has no Source of Truth Register domain** — HOME2 § 8.3, unresolved. **It blocks pantry freshness independently of time** (§ 4.4).
3. **Operator time has no owner.** Household · operator · absolute are three scopes; the platform declares none of them. Recorded as an open item, **not invented** (§ 4.12).
4. **Hemisphere/location awareness** — `seasonal/engine.ts:89-93` defers it deliberately. **Correct for a UK catalogue. Not this audit's to reopen.**
5. **What `/dashboard` is** — HOME1 § 8.2's finding. It holds a rival "This Week" (§ 7.2 #4), and whether to fix or retire it depends on a decision nobody has taken.
6. **Whether planner entries should carry dates at all** — the deeper question under § 1.5. TIME1 answers it for *weeks*; **entries are untouched**, and Stories' day-of-week claims may need more than a week anchor.

---

## 12. DOMAIN IMPACT

```
GOVERNANCE GATE
===============
Domain affected:        NONE — this document is an audit. It touches no domain.
                        It recommends changes to domains TIME1 already named
                        (14 Planner, 16 Household) and names one register
                        defect TIME1 did not (Domain 11 Seasonal Stories —
                        declared owner ≠ actual owner, §7.4).

Declared SoT:           n/a — no store is proposed, extended, or read.
New store created?      NO.
Existing store extended? NO.
Consumer created?       NO. Twenty existing consumers are INVENTORIED.
New knowledge store?    NO (Register Rule 8 does not fire).
```

---

## 13. ARCHITECTURE IMPACT

### 13.1 Is an architecture index update required? **No.**

- **`docs/architecture/README.md` — NO.** It indexes **governing architecture**. TIME2 is an investigation (§ 0.1); adding it would be the category error the README's own line 4 exists to prevent.
- **`docs/investigations/README.md` — NO.** It is a **workstream index**, not a document index (verified: it lists eleven folders and no files). `platform/` already exists and already covers this.

> **The mission's *"update the architecture index if required"* resolves to: not required.** The correct filing is the whole of the requirement, and § 0.2 satisfies it.

### 13.2 If TIME2 should govern

**Promotion is a distinct act** (`REPOSITORY_CONVENTIONS.md:89-93`): copy into `docs/architecture/`, index it in that README, leave this file as history. **This document does not perform it**, and recommends against it for this artefact:

> **An audit measures; it does not govern.** This is EXPCOMP1's resolved precedent — *"the audit measures surfaces, never governs changes"*. **TIME1 is the thing that should govern** (its § 13 names the one register amendment). TIME2 is the evidence that TIME1 is right, and evidence is not law. Promoting an inventory would freeze a snapshot of twenty consumers as a rule, and it would be **stale the first time one converged**.

---

## 14. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| Every domain that should consume Household Time identified | § 4 — 11 named + 9 discovered = **20**; 12 consumers, 5 must-not, 3 abstinent |
| Per domain: why · what · must-not-own · owner · dependencies · order | § 4 — all six, every domain |
| Additional consumers discovered | § 4.12 — **9**: Streaks · Savings · Health Trends · Product/Analyser · Trial/Auth · Learning · Caching · Observation/Analytics · Admin |
| Executive summary | § 1 |
| Consumer inventory | § 4 |
| Ownership matrix | § 5 |
| Dependency graph | § 6 |
| Recommended implementation roadmap | § 10 |
| Risks and architectural constraints | § 9 — 7 constraints, 10 risks, 14 live defects |
| **Confirm:** single canonical owner | § 7.1 — **holds, conditional on Step 0** |
| **Confirm:** no duplicate schedulers | § 7.3 — **holds vacuously; none exists.** Prospective rule stated |
| **Confirm:** no duplicate "today" logic | § 7.2 — **REFUTED.** 5 current-weeks · 19 week-shapes · 5 frames |
| **Confirm:** no duplicate season logic | § 7.4 — **REFUTED.** 3 implementations; declared owner ≠ actual owner |
| **Confirm:** no duplicate event ownership | § 7.5 — **holds vacuously; no events exist.** Prospective rule stated |
| No features designed | None. Every future capability is TIME1's, cited not re-designed |
| TIME1 not implemented | Nothing built |
| No code modified | Zero files touched outside this document and session bookkeeping |

---

## 15. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** read before this audit; `docs/architecture/README.md` verified byte-unchanged.
- **Principle 1 — one key space:** § 8.1 finds the fail test met **inside one file** (`storage.ts:3074` vs `:3345`) and corrects TIME1's verdict rather than repeating it.
- **Principle 2 — one owner per fact:** the audit's whole instrument (§ 3). The CIVIL/INSTANT test *is* the scope test applied to time.
- **Principle 5:** the module is a reference vocabulary beside the spine — ATTN1/DEC1's recorded class.
- **Principle 6 — honest gaps over invented facts:** § 1.5 and § 4.9. The audit **records** the fabricator and does not repair it, because repair needs a fact that does not exist yet.
- **Principle 8 — retire on introduction:** § 8.3 finds TIME1's retirement list **incomplete** and requires it amended before Step 0.
- **Register Rules 1, 4, 7, 8:** Rule 1 defect found (§ 7.4 — Domain 11's declared owner is not its actual one); Rule 4 breached in three families (season ×3, day arrays ×19, `buildHouseholdHistory` ×2); Domain Impact stated (§ 12); Rule 8 checked, **not triggered**.
- **Repository Conventions:** § 0.2 — the mission's path would have failed `repo-structure-verify.sh`. Filed compliantly; the deviation is reported, not hidden.
- **C1 (the one-morning law) · C2 (Observation § 7) · C3 (INT17) · C4 (INT20) · C5 (DEC1):** each restated as a **binding constraint on consumers** (§ 9.1), none amended, none restated as a new rule.
- **The mission's stop conditions:** honoured. **Nothing implemented. TIME1 not built. No code modified. No feature designed. No architecture amended.**
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Where it and any governing document disagree, **this document is the defect.**

---

## 16. THE AUDIT IN ONE PARAGRAPH

Twenty domains in THA touch time, and they split with a clarity nobody designed: **every consumer that needs only a duration is flawless, and every consumer that needs the household's calendar is broken** — the trial countdown, the ninety-day evidence window and every cache TTL are correct precisely *because* a duration needs no calendar, while the Companion's `TODAY`, the freezer's expiry, the diary's "today", Home's week and the whole of Stories are wrong, all in the same way, all serialising a local frame through `.toISOString()`. That line is exactly the one TIME1 drew, which means the platform has been failing along it for months and the Foundation is not a proposal so much as a diagnosis. The competence was never missing — someone noon-anchored the diary against DST, someone deferred hemispheres deliberately, someone refused to persist a "just crossed" detector, and a benchmark engineer wrote TIME1's recommendation down months ago and filed it as open — but with no authority to route it through, each domain reasoned correctly *in isolation*, picked one of five frames, and the frames now disagree at every seam; `buildHouseholdHistory` is simply what a system does when it needs a date and nobody owns one. So the audit's answer to *"who should consume Household Time"* is twelve domains, and its more useful answer is the five that **must not**, because a duration is not a date and converging them would be a new defect wearing a canonical badge. The order is fixed by the graph and not by severity: **the register must name an owner before anything can converge onto it**, the zone unblocks seven of the twelve without touching the Planner, and the anchor gates the rest — including the only repair that cannot be made by fixing a timezone, because *"Friday became curry night"* is not a claim about a mis-zoned date but about **a date that was never real**. **Nothing here is a new rule; every constraint already had an owner, and the audit's whole finding is that twenty domains have been quietly answering a question none of them was ever given the right to ask.**

---

*An investigation — a point-in-time audit of Household Time's consumers against TIME1's proposed Foundation and the governing Platform, Intelligence and Experience architectures. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the TIME2 workstream: `rollback/TIME2-household-time-consumer-audit-20260716` → `7d1dd2ce`.*
