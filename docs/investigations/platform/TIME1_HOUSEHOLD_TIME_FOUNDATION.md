# TIME1 — The Household Time Foundation

## How THA should understand calendar time

> ## ⛔ RETIRED AS A SOURCE OF RULE — 2026-07-16 (`TIME3`)
>
> **This investigation was promoted to governing architecture: [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](../../architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md).**
>
> **Read the architecture, not this document, for any rule.** This file remains at its path as **point-in-time analysis and history** — the sanctioned promotion form (`REPOSITORY_CONVENTIONS.md` § 3: *"they are not duplicates: one is history, one is governing"*). It holds the **reasoning** the architecture does not: why the anchor is per-week rather than a household epoch, why a weighted score was rejected, and the full time audit of 2026-07-16.
>
> **It is not a dependency.** No code, gate, or document may read it to decide anything. **Where it and the architecture disagree, this document is history and the architecture governs.**
>
> **Superseded within this file:** § 13's *"MUST EVOLVE — at implementation, not now"* — **the register amendment landed on 2026-07-16.** Household Time is now a recognised platform capability: declared in the Source of Truth Register's Appendix A, indexed in `docs/architecture/README.md`, and in force as law. **Its § 9 retirement list was found incomplete by TIME2 § 8.3 and is superseded by the architecture's § 14.**

**Status:** INVESTIGATION — a design and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation. It creates no rule, no store, no column, and no second owner (Principle 2; Register Rules 1, 3, 8). **It amends nothing and builds nothing.**
**Classification:** Platform Governance (investigation) — with Planner, Household, Intelligence and Experience dependencies
**Date:** 2026-07-16 (TIME1)
**Rollback ID:** `rollback/TIME1-household-time-foundation-20260716` → `7d1dd2ce`
**Question designed against:** *"HOME2 found THA cannot reliably determine 'today', relate planner weeks to calendar dates, or support time-aware household intelligence. Design the canonical Household Time Foundation."*
**Reviewed against:** [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) · [`ENGINEERING_WORKFLOW.md`](../../architecture/ENGINEERING_WORKFLOW.md) · [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) · [`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`](../../architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md) · [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md) · [`THA_DECISION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_DECISION_ENGINE_ARCHITECTURE.md) · [`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`](../../architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**Prior work read:** [`HOME2`](../ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md) (the origin — § 8.1) · [`HOME1`](../ux/HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION.md) · [`NORTH2`](../ux/NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md) (§ 3.5 — the rejection of visual time) · [`EXPCOMP1`](../ux/EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md)
**No schema modified, no code written, no architecture amended, no Planner redesigned, no second owner of time created.**

---

## 1. THE HEADLINE FINDING

**THA does not lack time. THA already tells the household the time — in six places, with six private definitions, owned by nobody, and at least three of them are wrong.**

This is the opposite of the gap HOME2 recorded, and it is a worse problem than the one this mission was written to solve. HOME2 § 1 concluded that *"THA cannot answer 'what is planned for today'"*. The evidence says something sharper:

> **THA answers it already — on Home, today, in production — and it has no basis on which to do so.**

Three findings carry the whole document.

**First: `max(weekNumber)` is not "the household's current week". It is the constant `6`.**
All six planner weeks are created **eagerly, at once**, the first time a household touches the planner (`server/storage.ts:1220-1226` — `for (let w = 1; w <= 6; w++)`), and `weekNumber` is bounded to 1–6 at the API edge (`server/routes.ts:7182` — `.min(1).max(6)`). So `weeks.reduce((a, b) => b.weekNumber > a.weekNumber ? b : a)` (`server/routes.ts:11503-11505`) — the definition of "current week" that feeds `/api/home/intelligence` — **always returns Week 6, for every household, forever.** It is a constant wearing the costume of a computation.

**And the dashboard disagrees.** `client/src/pages/dashboard.tsx:191` takes `plannerFull[0]` — Week **1**, ordered ascending (`server/storage.ts:1204`) — and renders it under the heading **"This Week"** (`:426`) and **"This Week's Plan"** (`:493`).

> **Two live surfaces. Two constants. Both called "this week". Week 6 and Week 1. Neither consults a calendar, because there is not one to consult.**

**Second: the planner is not a calendar and was never built as one.** `planner_weeks` holds `weekNumber` and `weekName` and nothing else (`shared/schema.ts:420-428`); `planner_days` holds `dayOfWeek` and nothing else (`:430-436`). **No date, no timestamp, not even a `createdAt`** — verified against the ORM and the physical DDL (`migrations/0000_conscious_nuke.sql:171-195`). In a schema where 99 other columns carry `timestamp(…, { withTimezone: true })`, the planner's datelessness is a **design, not an oversight**. The legacy table it replaced *did* carry a date (`shared/schema.ts:404` — `weekStart`); the planner dropped it.

**Third: nothing in THA knows where any household is.** There is **no timezone column on any table**, no `Intl.` call in `server/` (0 occurrences), no `date-fns-tz`, no `luxon`, no IANA identifier anywhere in the repository. `date-fns@3.6.0` is a declared dependency that is **never imported** — its only occurrence outside `package.json` is the bundler's `external` list (`script/build.ts:12`). THA stores **instants** correctly (99 `timestamptz` columns) and **civil time** not at all.

**The model that follows from these facts:**

> **Household time has exactly one owner — a pure, zero-I/O reference module beside the entity spine, which owns the *rules* of household time and none of its data. The two facts it needs live with the owners that already exist: the household's time zone on the household, and a planner week's calendar anchor on the planner week. No new domain. No new store. No time service. No second clock.**

And the sentence that governs the whole design:

> **THA already speaks about time. The Foundation does not give THA new things to say — it makes the things THA already says true.**

---

## 2. THE FIRST QUESTION: IS THIS A MISSING FACT, OR A MISSING OWNER?

This had to be settled first, because it determines whether the Foundation is an *addition* or a *convergence* — and the mission's instruction to *"avoid introducing duplicate ownership of time"* is unanswerable until it is settled.

The answer is that duplicate ownership of time **already exists and is live**. THA has not one clock but many, each private to its reader:

| # | The claim THA makes | Where | What it actually reads | Verdict |
|---|---|---|---|---|
| 1 | **"Good morning / afternoon / evening"** | `HomeIntelligenceCompanion.tsx:34-36`; `dashboard.tsx:57-59` | The **device** clock, `new Date().getHours()` | Two copies. Boundary `< 12` / `< 17`. The Arrival prototypes authored a **third and fourth**, at `< 18` (`arrival-a-welcome.tsx:58-60`; `arrival-s1-quiet.tsx:63-65`) — a divergence that ships the moment one graduates |
| 2 | **"Today's meals"** | `home-experience-page.tsx:138-157` | `new Date().getDay()` joined to `planner_days.dayOfWeek` | **A live planner↔calendar join, on the client**, resting on two unstated assumptions (§ 3.2) |
| 3 | **"N plants this week"** | `routes.ts:11503` → `HomeIntelligenceCompanion.tsx:94`; `PlantDiversityReport.tsx:910` | `max(weekNumber)` — **always Week 6** | The number is true of *a* week. It is not true of *this* week, and it says "this week" |
| 4 | **"This Week's Plan"** | `dashboard.tsx:191`, `:426`, `:493` | `plannerFull[0]` — **always Week 1** | Directly contradicts #3 in the same product |
| 5 | **Every historical meal date** | `routes.ts:11372`; duplicated at `lib/household-history.ts:44-46` | `now.getTime()` minus arithmetic over `weekNumber` | **Fabricated at read time** (§ 3.3) |
| 6 | **"Today" in the diary** | `food-diary-page.tsx:124`, `:1195` → `GET /api/food-diary/:date` | `toISOString().slice(0,10)` — **UTC**, computed by the browser | The server validates the string's *shape* and never its *meaning* (`routes.ts:10182`). **The client is the sole authority on what day it is** |

**Six claims. Six owners. Zero governance.** Not one of them reads a fact THA owns; every one of them derives a private answer from whatever clock is nearest.

> **The verdict: the Foundation is a convergence, not an addition.** Principle 2's fail test — *"Two stores that must always agree → one is redundant"* — is met six times over. These six answers must always agree (there is one real "today" for one household) and today nothing makes them. The mission's instruction to avoid duplicate ownership of time cannot be honoured by careful design alone: **the duplication is already here, and the Foundation's first job is to retire it** (Principle 8 — *retire on introduction*).

### 2.1 Why this is worse than an honest gap

HOME2 § 8.1 recorded the time gap and, correctly, refused to fill it. But an absent fact and a **fabricated** one are not the same failure, and Core Principle 6 draws the line exactly here — *"No fabricated knowledge — honest gaps over invented facts."*

A household that has never opened the planner sees no claim about their week. A household that opened it eight weeks ago is told *"12 plants this week"* about a plan they wrote in May. **The first is a gap; the second is an invented fact**, and it is the one that ships.

---

## 3. WHAT THA ACTUALLY HAS — THE TIME AUDIT

Every claim below is checked against the code. **This table is the most load-bearing thing in the document**, because a Foundation designed against a fact that does not exist is the fabrication it is meant to end.

| # | Time concept | Exists? | Reality |
|---|---|---|---|
| 1 | **The instant ("now")** | ✅ **YES** | 165 `new Date()` + 120 `Date.now()` in `server/`; 29 + 16 in `client/`. THA has **many** clocks and no shared `today()` helper |
| 2 | **Instants, stored** | ✅ **YES — correctly** | 99 `timestamp(…, { withTimezone: true })` columns. Postgres `timestamptz` stores an unambiguous instant. **This half of time is already right** |
| 3 | **Household time zone** | ❌ **NO** | **No timezone column on any table.** No `Intl.` in `server/` (0). No `date-fns-tz`, `luxon`, `dayjs`, IANA id, or offset anywhere. THA has never known where a household lives |
| 4 | **Household-local date ("today")** | ❌ **NO** | Cannot be derived — #3 is missing. Every "today" in the product is the **device's** UTC date (`food-diary-page.tsx:124`) or the **server process's** date |
| 5 | **Calendar week identity** | ❌ **NO — and contested** | No ISO week anywhere. Two rival week orders are live: **Sunday-first** in every planner consumer, **Monday-first** in `PlantDiversityReport.tsx:86-89` and `dashboard.tsx:54` |
| 6 | **Planner → calendar anchor** | ❌ **NO** | `planner_weeks` has no date (`schema.ts:420-428`). **This is the real blocker**, exactly as HOME2 § 8.1 said |
| 7 | **Planner week semantics** | ⚠️ **NOT WHAT ANYONE ASSUMED** | Six eagerly-created slots, bounded 1–6, that never advance and never roll over (§ 3.1) |
| 8 | **Day-of-week key space** | ⚠️ **UNDOCUMENTED, and mis-documented twice** | `dayOfWeek` is **0 = Sunday** (§ 3.2). The schema declares no convention. Two comments in `routes.ts` contradict each other, and the one at `:11371` is **false** |
| 9 | **Seasons** | ✅ **YES — and correctly shaped** | `shared/seasonal/engine.ts` takes `now` as an **injectable parameter** (`:320`), defaulting to the clock. Fixed UK meteorological months (`:96-102`). **The seam is already right; only the value handed to it is wrong** |
| 10 | **Calendar dates, stored** | ⚠️ **AS TEXT** | `food_diary_days.date` is `text` (`schema.ts:1258`). Postgres `date`, `time` and `interval` are used **zero** times in the entire schema. Format is guaranteed only by a regex at one route (`routes.ts:10182`) |
| 11 | **Date library** | ⚠️ **DECLARED, NEVER USED** | `date-fns@3.6.0` in `package.json`; **0 imports**. 100% of date handling is hand-rolled on native `Date` |
| 12 | **Bank holidays** | ❌ **NO** | Zero hits repo-wide |
| 13 | **School holidays** | ❌ **NO** | One hit: a free-text placeholder, `food-diary-page.tsx:994` — `placeholder="e.g. Holiday, Birthday…"` |
| 14 | **Recurring events** | ❌ **NO** | No recurrence, no RRULE, no repeat model |
| 15 | **Scheduler / cron** | ❌ **NO — deliberately** | No `node-cron`, `bullmq`, or `agenda`. Stated in-code: *"No scheduler — this is the only way a snapshot is taken"* (`routes.ts:12770`) |
| 16 | **Reminders / notifications** | ❌ **NO** (as scheduled things) | A *vocabulary*, not a schedule. Notices are computed **at read time, on a request the user initiated** (`notice-engine.ts:231` — *"stateless heuristic … not a persisted"*). **Nothing in THA can fire at a time** |

### 3.1 The discovery that reshapes the design: the planner is a fixed six-slot window

This was not expected, and it changes the answer to the mission's central question.

```ts
// server/storage.ts:1220-1226
for (let w = 1; w <= 6; w++) {
  const [week] = await tx.insert(plannerWeeks).values({
    userId, householdId, weekNumber: w, weekName: `Week ${w}`,
  }).returning();
```

**All six weeks exist from first touch. `weekNumber` is bounded 1–6** (`routes.ts:7182`). It **never advances, never rolls over, and is never reconciled with a calendar.**

Three consequences, each of which invalidates a reading the codebase currently relies on:

1. **`max(weekNumber)` ≡ 6.** "Current week" on `/api/home/intelligence` is not a computation. It is the number six.
2. **`weekNumber` is not a time coordinate in any sense.** It is a **slot label in a fixed rota**. It carries no ordering in calendar time — only in the rota.
3. **The window silently expires.** A household that anchored on week 1 in May is, by July, living past the end of their own planner — and **no surface knows**, because nothing can compare a slot to a date.

> **This is the finding that makes the anchor design tractable.** Had `weekNumber` been a growing sequence, a household-level epoch (`start + 7 × (N−1)`) would break the first time a household skipped a week. Had it been an ISO week, no anchor would be needed. It is neither: it is **six slots that mean whatever the household currently intends them to mean** — which is precisely why the meaning must be **stored, per week, at the moment it is true**, and can never be recovered afterwards (§ 5).

### 3.2 The day-of-week key space — correct by coincidence, documented nowhere

`planner_days.dayOfWeek` is `integer`, range 0–6 (`storage.ts:1227-1231`), with **no comment at the point of definition**. Its convention is established only by consumer consensus — and the consensus is **0 = Sunday**, matching JavaScript's `getDay()`:

- `weekly-planner-page.tsx:105`, `:1706` — the primary planner UI, Sunday-first
- `use-week-meal-entries.ts:11`, `:63` · `use-planner-scan.ts:5`, `:25` · `AddToWeekModal.tsx:35` · `PlannerBulkAssignPanel.tsx:21-22` · `meals-page.tsx:1374` · `shopping-list-page.tsx:94` · `SmartReviewPanelContent.tsx:431` — all Sunday-first

Two comments in `routes.ts` contradict each other, and **the one sitting directly on the fabricated-date line is false**:

| Location | Claim | Verdict |
|---|---|---|
| `routes.ts:7431` | `// Planner dayOfWeek 0-6 (Sun=0, Mon=1, Sat=6)` | ✅ correct |
| `routes.ts:11371` | `// dayOfWeek: 0 = Monday in plannerDays convention` | 🔴 **false** |

**So `home-experience-page.tsx:141`'s join — `new Date().getDay()` against `d.dayOfWeek` — is correct.** It is correct **because two undocumented conventions happen to coincide**, which is the EXPCOMP1 **WARNING** grade exactly: *correct today, correct for the wrong reason, one innocent change from wrong.* A migration that renumbered `dayOfWeek` to ISO (Mon=1) would silently rotate Home's "Today's meals" by one day, and no test would catch it, because **no owner declares what the number means.**

**And one consumer already gets it wrong.** `dashboard.tsx:54` declares a **Monday-first** label array and indexes **Sunday-first** planner data with it (`:192-196`):

```ts
54   const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
192      const days = [...(firstWeek?.days || [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
193      return DAY_LABELS.map((label, i) => { const day = days[i]; …
```

`days[0]` is Sunday, rendered under **"Mon"**. **The dashboard's "This Week" bar chart is rotated by one day, live.** *(Reported, not fixed — § 15.)*

### 3.3 The fabricated date is worse than HOME2 recorded

HOME2 § 8.1 named `approxDate` and reported it as a live Core Principle 6 defect used *"only for recency ordering"* — which is what the source's own docblock claims (`lib/household-history.ts:17-20`). **The docblock is wrong.**

```ts
// server/routes.ts:11372
const approxDate = new Date(now.getTime() - (weeksAgo * 7 + Math.max(0, 6 - day.dayOfWeek)) * MS_PER_DAY);
```

It is consumed as a **hard season filter** and as an **identity key**:

- `shared/seasonal/engine.ts:330` — `household.entries.filter((e) => inWindow(e.date, window))` — decides **which season a meal belongs to**
- `shared/seasonal/engine.ts:206` — `const day = \`${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}\`` — dedupes **distinct meal occasions**, feeding `mealCount`

Because `approxDate` is recomputed from the wall clock on every request, and `maxWeek` ≡ 6:

> **The entire six-week planner is projected onto the trailing ~42 days from "now", on every read. A household's "Summer 2026" memories silently become "Autumn 2026" memories as the months pass — the same unedited rows, re-attributed to whichever season is being asked about.**

For an engine whose stated first principles are *"Memory, never report card — a season is recalled, never graded"* and *"Trust by non-computation"* (`seasonal/engine.ts:17`, `:22`), **the recalled memory is manufactured at read time.**

And it is **duplicated**: `routes.ts:11356` defines a local closure while `lib/household-history.ts:28` holds an identical copy — whose docblock states the extraction exists precisely so there would not be two (`:8-15`). `routes.ts:64` imports only `deriveHouseholdCompanionFields`, so **both copies are live** (Rule 4 — no identical file copies).

### 3.4 The forbidden input, named once

**`platform_observations` may never inform household time.** The Observation Engine § 7 names routing first: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, learning — stop."* Its operational test binds the Foundation: **`OBS_DISABLE_CAPTURE=1` must remain a functional no-op.**

> **Consequence, stated once so it is not rediscovered as a missed opportunity:** there is **no** learned "this household shops on Saturdays", no inferred routine, no telemetry-derived rhythm. Not because it would be hard — because it is forbidden, and because it is the exact mechanism by which a calm platform becomes a predictive one. A household *pattern* may only ever be read from **household state the household authored**, never from telemetry about them.

---

## 4. THE THREE LAYERS — THE DISTINCTION THE MISSION REQUIRES

The mission asks for platform time, planner representation and user-facing language to be clearly distinguished. They are three layers, and **the whole design is the rule that they may never leak into each other.**

| | **Platform time** | **Planner representation** | **User-facing language** |
|---|---|---|---|
| **Question** | *What is actually true of the calendar?* | *Which slot is the household editing?* | *What do we call it?* |
| **Vocabulary** | Instant · IANA zone · civil date · ISO week · phase of day | `weekNumber` (1–6) · `dayOfWeek` (0–6) · `weekName` | "This Week" · "Next Week" · "Monday" · "Good morning" |
| **Owner** | `shared/time/household-time.ts` (§ 5) | Planner — SoT **Domain 14**, unchanged | **Behaviour Engine** (INT21) |
| **Shape** | Absolute, machine, precise | Ordinal, household-scoped, opaque | Relative, warm, human |
| **Ever shown?** | **Never** | **Never** | **Always** |
| **Ever stored?** | Two facts only (§ 5.2) | Already stored | `weekName` only, once renamed |
| **May change?** | Only when the calendar does | Only when the household edits | Only by the Behaviour Engine |

### 4.1 Why this preserves the experience exactly

The mission requires that users keep planning with *This Week · Next Week · Monday*. **They will, and not one word changes** — because of a distinction the product has never made:

> **"This Week" is not a time label. It is a *relation*.**

The user's language is already relative, and relative language is *derived*, never stored. Today, "This Week" is derived from `plannerFull[0]` on one surface and `max(weekNumber)` on another — two guesses at a relation neither can compute. With the Foundation, "This Week" means *the planner week whose calendar anchor contains the household's today*. **Same words. Finally true.**

> **The Foundation changes no user-facing language. It makes the existing language honest.** That is the whole of its effect on the experience, and it is why no Experience document requires amendment (§ 13).

### 4.2 The boundary that protects the one-morning law

The governing Experience canon has already ruled on time, twice, in opposite directions — and **both rulings survive this design intact.** `TRANSLATION1` *Morning Rhythm* is the governing text:

- **§ 3 — time in language and selection is REQUIRED:** *"A surface's 'rhythm of the day' is carried **entirely by what is true right now — the household's data — never by the house's light, theme, palette, or mood**. The interface reflects the hour by **saying the true and useful thing for it**, and by nothing else."*
- **§ 6 — the greeting is a sanctioned clock read:** *"The greeting word (morning/afternoon/evening) is **a plain reading of the clock** in the once-a-day greeting only."*
- **§ 8 — re-aiming is required:** *"The one primary action is **re-aimed by relevance across the day** — look at the week in the morning, start tonight's dinner at the dinner hour."*
- **§ 9 — time in *light* is FORBIDDEN:** *"**No evening theme, night mode as atmosphere, or dimmed dinner-hour palette** — that is the second sun, and it breaks the one-morning law; **STOP**."*

> **This is the finding that makes TIME1 legitimate rather than presumptuous: the governing architecture has already decided that THA must know the hour.** § 6 and § 8 are law, and they are **unobeyable without this Foundation**. TIME1 does not propose a capability — it supplies the fact an existing law already requires.

**And NORTH2 § 3.5's rejection of "Time" stands, undisturbed.** NORTH2 rejected time as a *visual* principle — *"an atmosphere that varies by hour **is** a theme"* — against Blueprint § 7 and § 16 (*the second sun*). That rejection is about **light**. This Foundation is about **facts**. They are orthogonal, and the Foundation must state the boundary as its own hard rule so the two are never confused:

> **HARD BOUNDARY — the Foundation feeds words and selection. It may never reach the light.**
> Household time may aim **what THA says** and **which door THA opens** (`TRANSLATION1` § 3, § 6, § 8). It may **never** aim a colour, a token, a palette, an opacity, a theme, or a motion. A consumer that reads the phase of day to *dim* something has broken the one-morning law, and the rule to apply is § 9's: **STOP**.

---

## 5. THE CANONICAL MODEL

### 5.1 The one owner

> **`shared/time/household-time.ts` is the canonical owner of household time. It owns the *rules* of household time and **none of its data**.**

This is not a novel shape — it is the class the platform already established twice, and the Source of Truth Register already records both precedents in **Appendix A**:

| Precedent | What it owns | Data owned |
|---|---|---|
| `shared/attention/index.ts` (ATTN1) | The attention vocabulary — levels, rank, labels, the `critical` allowlist | **None** — *"no DB owner"* |
| `shared/attention/decision.ts` (DEC1) | The decision mechanics — ordering, clamp, dedupe | **None** |
| **`shared/time/household-time.ts` (proposed)** | **The time vocabulary and mechanics** | **None** |

This is **Principle 5** exactly — *"Reference vocabularies stay beside the spine, never merged in… They sit beside the entity spine and are shared across entities."* Household time is the archetypal cross-entity vocabulary: the planner, the diary, the pantry, shopping, seasons and the Companion all need it, and **none of them may own it**.

| Property | Value | Why / owner |
|---|---|---|
| **Class** | Pure, zero-I/O, deterministic, beside the entity spine | Principle 5; the ATTN1/DEC1 class |
| **Totality** | **Total.** Every input — missing zone, unanchored week, malformed value — resolves to a stated answer, never a throw | The `resolveBehaviour` precedent (INT21 § 2.4, § 4.1): *"never to silence or a crash"* |
| **Persistence** | **None.** Owns no table, no cache, no column | Principle 2; Principle 7 (a cached "today" over a moving clock is a **permanent sync bridge** — debt by definition) |
| **I/O** | **None.** Callers supply the instant and the household's facts | Observation Engine § 4 rule 4 (*"Pure modules … never record — their callers do"*) |
| **Clock** | **Reads none.** `now` is a **parameter**, never an ambient read | § 5.4 — the seam `shared/seasonal/engine.ts:320` already got right |
| **Learning** | **None** | Observation Engine § 7 (§ 3.4) |
| **Not** | Not a service, not an engine, not a capability, not a store, not a domain with rows | INT20 § 5.2; DEC1 § 4 |

**What it owns, precisely — four things nobody owns today:**

1. **The day-of-week key space** — `0 = Sunday … 6 = Saturday`. **Declared, not changed** (§ 5.5).
2. **The week convention** — the household week **starts Monday** (ISO-8601, UK). This is the *identity and display* convention; it does not touch the stored `dayOfWeek` numbering.
3. **The phase-of-day vocabulary** — the named phases and their boundaries, converging the four private copies of `getGreeting()` (§ 2, claim 1). **Coarse named phases, never a continuous variable** — honouring HOME2 § 6.3 by name.
4. **The derivations** — `householdToday()`, `householdWeekOf()`, `resolvePlannerWeek()`. Pure functions of `(instant, household facts)`.

### 5.2 The two facts — and why they are two, not one

Principle 2's **scope test** decides this: *"Can these two stores legitimately disagree?"*

| Fact | Answers | Owner | Domain | Scope |
|---|---|---|---|---|
| `households.timeZone` — IANA id, nullable | *Where does this household live in time?* | `households` — **existing owner, extended** | **16** (Household Profiles) | Household |
| `planner_weeks.weekStartDate` — date, nullable | *Which calendar week is this planner slot?* | `planner_weeks` — **existing owner, extended** | **14** (Planner State) | Planner week |

**Can they legitimately disagree? Yes — they answer different questions at different scopes.** A household's zone is a property of the home; a week's anchor is a property of that week. Neither derives from the other. **They are different facts, and both are valid** — Principle 2's over-collapse guard, applied.

**No new domain is created.** Both facts are **extensions of owners the register already declares** — Principle 8's *"prefer evolution over replacement"* in its cheapest possible form. The Foundation adds **one column to a five-column table** and **one nullable column to a five-column table**, and nothing else.

**Everything else is derived and never stored:**

> **"Today", "this week", "the phase of day", "the current planner week" are *derivations*, never columns.** Storing any of them would create a fact that is wrong the moment the clock moves — and a job to refresh it would be the **permanent sync bridge** Principle 7 forbids by name. `activity_summary` is the cautionary precedent the register already records: a derived cache that **drifted** (*"🔴 DRIFT: cache out of sync on 2/9 rows"*). **The stability mechanism is determinism, not memoisation.**

### 5.3 Why the time zone belongs to the household, not the user or the session

Three candidates were tested against the scope test. Two fail.

| Candidate | Verdict |
|---|---|
| **The session / device** (`Intl.DateTimeFormat().resolvedOptions().timeZone` per request) | **REJECTED.** This is what ships today, and it is the defect. A device in an airport is not the household. A phone left on US time does not move the family's dinner |
| **`user_preferences`** (per member) | **REJECTED — a split-brain by construction.** The planner is **one shared plan**. Two members in two zones would produce two "this week"s for one week's meals. **The clock must sit at the same scope as the thing it dates** |
| **`households`** | ✅ **CORRECT.** The planner, the shopping list and the pantry are household-scoped; so is their week |

> **The governing sentence: a household's time zone is a property of their home, not of their device.** A family on holiday in Spain is still a UK household — their Tuesday dinner does not move because someone opened the app in Málaga.

**Acquisition and provenance.** Detected once at signup from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone` — the client's *one* legitimate contribution to time), **stored, user-correctable, and never silently updated**. Provenance is `declared | detected | default`, borrowing INT21 § 2.4's discipline verbatim in spirit: *"there is no middle value, because there is no middle knowledge."*

**Fail-safe default: `Europe/London`.** This is not fabrication — it is a **declared default**, exactly as `getPersonality()` normalises the unknown to `companion` (INT21 § 4.1). THA is a UK product and says so in code already: *"the entire current food catalogue and seasonal seed are UK"* (`seasonal/engine.ts:89-94`). The default is **stated, not inferred**, and a household that corrects it is believed.

### 5.4 The contract

```
householdToday(now: Instant, zone: IANAZone) → CivilDate          // pure, total
householdWeekOf(date: CivilDate)             → CalendarWeek       // Monday-first, ISO
householdPhase(now: Instant, zone: IANAZone) → PhaseOfDay         // coarse, named
resolvePlannerWeek(today: CivilDate, weeks: PlannerWeek[]) → PlannerWeekResolution
```

```
PlannerWeekResolution =
  | { anchored: true;  week: PlannerWeek; relation: "this" | "next" | "past" | "ahead" }
  | { anchored: false; reason: "no-anchor" | "window-expired" | "no-weeks" }
```

**`now` is a parameter, never an ambient read.** This is the seam `shared/seasonal/engine.ts:320` already got right (`now = new Date()` as an injectable default) and every other consumer got wrong. It makes the module testable without a clock, deterministic under replay, and — critically — **incapable of disagreeing with itself**, because there is only one place the instant enters.

**The resolution is total and honest.** `anchored: false` is a **first-class answer**, not an error. It is what THA must say about every household that exists today (§ 10), and it is the difference between this design and the six it replaces: **the current code cannot express "I don't know which week this is", so it guesses, and the guess is indistinguishable from knowledge.**

### 5.5 The week convention — declared, not migrated

THA holds two rival week orders today (§ 3, row 5). Principle 1 — *"one canonical identity per entity… two stores that use different keys for the same real-world entity → fail"* — requires one.

**The resolution costs zero migration**, and this is deliberate:

- **The stored key space stays `0 = Sunday`.** It matches JavaScript's `getDay()`, it matches every planner consumer, and renumbering it would be a data migration over live rows that silently rotates Home's "Today's meals" (§ 3.2). **Principle 8: evolution over replacement.**
- **The *household week* starts Monday.** This is the identity and display convention — ISO-8601, the UK norm, and the order `PlantDiversityReport.tsx:86-89` already displays.
- **The module owns the mapping between them**, and the three rival day-name arrays retire into it (Rule 4).

> **The defect was never the numbering. It was that the numbering had no owner**, so eleven consumers each guessed — and `dashboard.tsx:54` guessed wrong. The Foundation declares what is already true and gives it one place to be true in.

---

## 6. THE PLANNER ANCHOR — THE HARD PROBLEM

This is the question HOME2 § 8.1 identified as *"the real blocker"*, and § 3.1's discovery is what makes it answerable.

### 6.1 Three designs, two rejected

| Design | Verdict |
|---|---|
| **(a) Household epoch** — store *"slot 1 began on date D"*; derive slot N = D + 7(N−1) | **REJECTED.** It assumes the six slots are calendar-consecutive. **Nothing enforces that**, and the assumption is exactly the one `approxDate` already makes and is already wrong about (§ 3.3). It would encode today's fabrication as a schema |
| **(b) Redefine `weekNumber` as an ISO week** | **REJECTED.** It changes the Planner's key space (Principle 1), breaks the 1–6 bound (`routes.ts:7182`), the unique constraint, the eager creation, and every consumer. **This is the Planner redesign the mission forbids** |
| **(c) Per-week anchor** — `planner_weeks.weekStartDate` | ✅ **ADOPTED** |

**Why (c) is the only honest one.** It assumes nothing. A household whose slot 1 is w/c 20 July and whose slot 2 is w/c 3 August — because they skipped a week — is **representable**. Resolution becomes a **lookup** (*which week's range contains today?*) rather than **arithmetic** (*which week should contain today, if my assumptions hold?*). Arithmetic over an unenforced assumption is how `approxDate` was born.

And it preserves everything the mission protects: `weekNumber` stays a slot label, the 1–6 bound stands, the eager creation stands, `weekName` stands, the Planner UI stands, **and not one line of the Planner is redesigned.**

### 6.2 When the anchor may honestly be written

This is the crux, and Core Principle 6 decides it.

> **The only moment THA can honestly know which calendar week a planner slot means is the moment the slot is created.**

At `storage.ts:1220-1226`, all six weeks are created in one transaction, at a known instant, for a household that is — at that instant — looking at the week they are living in. **Anchoring there is an observation of the present, not a reconstruction of the past:**

```
weekStartDate(N) = mondayOf(householdToday(now, zone)) + 7 × (N − 1)
```

At creation, and **only** at creation, slot 1 *is* this week and slot 2 *is* next week — which is exactly what the UX has always promised. The arithmetic is legitimate **here** and nowhere else, because here the slots genuinely are consecutive: they are being made consecutive, now, in one statement.

**Existing weeks get `NULL` and stay `NULL`. Forever.**

> **THA cannot know which calendar week a household's existing Week 3 meant, and must never guess.** Guessing is precisely `approxDate` — the defect this Foundation exists to retire (§ 3.3). A back-filled anchor would be indistinguishable from a real one, which makes it worse than an absent one. **Honest gaps over invented facts** (Core Principle 6).

The one legitimate route to anchoring an existing week is **the household declaring it** — an explicit, offered, never-forced confirmation (*"Is this week beginning Monday 20 July?"*). A **declared** anchor is a fact. An **inferred** one is fabrication. That path is named as an extension point (§ 10, Phase 4), not designed here.

### 6.3 What the anchor reveals: the window has been expiring all along

With anchors, `resolvePlannerWeek` can return `{ anchored: false, reason: "window-expired" }` — the household is living past the end of their six slots.

**This state has always existed. Nothing could see it.** Every household that anchored in May and returned in July has been in it, silently, while `/api/home/intelligence` told them about Week 6 and the dashboard told them about Week 1.

> **What THA should *do* when the window expires — roll, extend, archive, or ask — is a Planner design decision, and it belongs to the Planner's owner.** TIME1 supplies the fact and stops. Answering it here would be the redesign the mission forbids, and would be a platform document deciding a product question. **Recorded as the top open item (§ 15.1), not answered.**

---

## 7. THE DETERMINATIONS

The mission's seventeen questions, answered against the facts above.

| # | Question | Determination |
|---|---|---|
| 1 | **Canonical owner of household time** | `shared/time/household-time.ts` — pure, zero-I/O, owns the rules and no data (§ 5.1). Precedent: ATTN1, DEC1 |
| 2 | **Planner weeks → calendar dates** | `planner_weeks.weekStartDate` (nullable date), written **only at creation**, never back-filled (§ 6). Resolution is a **lookup**, never arithmetic |
| 3 | **How "Today" is determined** | `householdToday(now, zone)` — a **derivation**, never a column. Computed **server-side**; the client renders it and never derives it (§ 8) |
| 4 | **Time zone ownership** | `households.timeZone` — Domain 16, existing owner extended. A property of the **home**, not the device or the session (§ 5.3) |
| 5 | **Household-local time** | Instant + zone → civil time, via the one module. THA already stores instants correctly (99 `timestamptz`); only the **frame** is missing |
| 6 | **Calendar week identity** | The household week **starts Monday** (ISO). Stored `dayOfWeek` stays `0 = Sunday`, **declared not migrated** (§ 5.5) |
| 7 | **Historical planning** | Weeks whose anchor precedes the current week. **Unanchored weeks are honestly unknown** — they do not become history by inference. This **retires `approxDate`** (§ 3.3) |
| 8 | **Future planning** | Weeks whose anchor follows the current week. Already representable at creation (`relation: "ahead"`) |
| 9 | **Seasonal awareness** | **Already owned** — `shared/seasonal/engine.ts` (SoT Domain 11). The Foundation creates **no second season owner**; it hands the existing engine a *household* civil date instead of a process-local instant. The seam is already right (`:320`); only the value is wrong |
| 10 | **Bank holidays** | A **knowledge domain** (CPuBA Variant 2) — sourced, region-scoped (England & Wales / Scotland / NI differ), evidence-backed. **Its evidence standard is currency, not sourcing** (Rule KC14) — a holiday list is true when published and stale two years later. **Named, not designed** (§ 14) |
| 11 | **School holidays** | **NOT a platform fact and must never be seeded.** They vary by local authority and by school; a national list would be **wrong for most households** — fabrication at scale (Core Principle 6). Only ever **household-declared state**. Honest gap today |
| 12 | **Recurring household events** | **Household state**, a future entity with a recurrence rule. **Precondition: the anchor.** Named as an extension point, not designed |
| 13 | **Reminders / notifications** | Unblocked, **not** invented. A reminder is a **time-triggered notice**, and the Notice Engine owns notices. **Time is a trigger, never a channel** (§ 14.1) |
| 14 | **Companion intelligence** | Time enters the model **only** as part of a capability's Context View, composed by INT17. **Never templated into a prompt** (§ 14.2) |
| 15 | **Shopping intelligence** | Unblocked (trip timing, week-relative lists). **No learned routine** — Observation Engine § 7 (§ 3.4) |
| 16 | **Pantry intelligence** | Freshness/expiry needs a **purchase date**, which needs this Foundation. **Blocked twice**: pantry also has **no SoT domain at all** (HOME2 § 8.3), which must be fixed first |
| 17 | **Community events** | **A different scope, named now so it is not later duplicated** (§ 14.3): an event is **absolute** time at a venue's zone; a household's day is **local** time at their home. 18:00 in Bristol is 18:00 for a viewer in Madrid. Two facts, one vocabulary |

---

## 8. THE PLATFORM CAPABILITY MAP

**The Foundation owns nothing and is read by everything.** Every fact below is cited to the owner that already exists.

| Consumer | Needs | Today | With the Foundation |
|---|---|---|---|
| **Home — "Today's meals"** | today; the current week | `new Date().getDay()` on the **client**, joined on an undocumented key space (§ 3.2) | `resolvePlannerWeek()` server-side; honest `anchored: false` when unknown |
| **Home — "N plants this week"** | the current week | `max(weekNumber)` ≡ **6** (`routes.ts:11503`) | The week containing today — or an honest gap |
| **Dashboard — "This Week's Plan"** | the current week | `plannerFull[0]` ≡ **1** (`dashboard.tsx:191`) | **The same answer as Home.** The contradiction (§ 1) closes |
| **The greeting** | phase of day | 4 private copies; boundaries 17 **and** 18 | One vocabulary; voiced by INT21 |
| **Seasonal Stories** (Domain 11) | a real date | `approxDate`, fabricated (§ 3.3) | A household civil date. **The engine is unchanged** — only its input |
| **Diary** (Domain 21) | today | Client-computed **UTC** (`food-diary-page.tsx:124`) | Server-computed household date |
| **Decision Engine** (DEC1) | — | Clock-free by construction | **Unchanged.** Time is not an attention signal |
| **Notice Engine** (INT20) | trigger time (future) | Read-time only | Time may **trigger**; the engine still decides. Silence stays first-class |
| **Companion** (INT17) | today, in context | `context-frame-assembler.ts:119` — a **UTC** `temporalAnchor` | A household date, via a Context View |
| **Behaviour Engine** (INT21) | phase; week relation | — | Owns **every user-facing word** the Foundation's facts produce |

**Net: the Foundation is read by ten consumers, and creates zero owners.** It retires six private clocks (§ 2), two rival day arrays, four `getGreeting()` copies, and one fabricated date used twice.

### 8.1 The publication path

Household time has **no publication step**, and stating why is the point.

Against `CANONICAL_PUBLICATION_ARCHITECTURE.md`'s three variants:

- **Not seed-owned.** There is no seed; the facts are authored by the household and the calendar.
- **Not knowledge.** No claim, no source, no `reviewedAt`, no evidence gate. *(Bank holidays, when built, **are** knowledge — Variant 2, § 14.)*
- **Database-owned (Variant 3), on both facts.** `households.timeZone` is authored by the household; `planner_weeks.weekStartDate` is authored by the planner's **existing single write funnel** (Rule CPuBA4 — the register already records Planner as *"✅ single write funnel verified"*). **The Foundation adds no writer.**
- **The module itself publishes nothing.** It is a reference vocabulary — the class ATTN1 and DEC1 occupy, which the register's Appendix A records with **no DB owner**.

> **The publication contract, stated once:** the owner is the module; the projection is **nothing**; the runtime read path is the module itself; **verification is that no second implementation exists.** For a pure vocabulary, drift is not a stale row — it is a **rival copy**. The gate that matters is the one that fails when someone writes a fifth `getGreeting()`.

**One derived value is published, and it must be published exactly once:** `householdToday` reaches the client as a **server-computed field**, never a client derivation.

> **RULE — the client renders household time; it never derives it.** The device clock may supply *the instant* and may detect *the zone at signup* (§ 5.3). It may never decide *the day*. This single rule retires claims 1, 2 and 6 of § 2.

---

## 9. DOMAIN IMPACT

*(Per `ENGINEERING_WORKFLOW.md` STEP 6 and Register Rule 7 / Appendix C.)*

```
GOVERNANCE GATE
===============
Domain affected:        Household Time (new — reference vocabulary, no store)
                        Domain 14 Planner State (extended — one nullable column)
                        Domain 16 Household Profiles (extended — one nullable column)
                        Domain 11 Seasonal Stories (consumer corrected — no ownership change)

Declared SoT:           shared/time/household-time.ts        (rules; owns no data)
                        households.timeZone                  (fact — Domain 16)
                        planner_weeks.weekStartDate          (fact — Domain 14)

New store created?      NO. No table. No cache. No projection. No seed.
                        Two columns on two existing tables, each owned by the
                        table's existing owner and its existing write funnel.

Existing store extended? YES — Domains 14 and 16, additively and nullably.
                        Retirement plan (Principle 8) — this Foundation RETIRES:
                          • 4 × getGreeting()   → HomeIntelligenceCompanion.tsx:34,
                                                  dashboard.tsx:57, and 2 prototypes
                          • 3 × rival day arrays → Rule 4 (no identical copies)
                          • approxDate ×2        → routes.ts:11372,
                                                  lib/household-history.ts:44
                          • max(weekNumber) as "current week" → routes.ts:11503
                          • plannerFull[0] as "This Week"     → dashboard.tsx:191
                          • client-side "today" for intelligence → §8.1's rule
                        Retirement condition: each consumer reads the module.
                        Nothing is deleted before its replacement is live.

Consumer created?       NO. Ten existing consumers are CONVERGED onto one owner.
                        Reads from declared SoT? YES — all ten.

New knowledge store?    NO (Register Rule 8 does not fire).
                        Bank holidays WOULD be one — deferred, not designed (§14).
```

---

## 10. MIGRATION STRATEGY

**Five phases. Each ships alone, each is reversible, none breaks a live surface.** The governing property is that **the old behaviour is the floor** — the HOME2 ladder shape, reused.

| Phase | Change | Risk | Reversible by |
|---|---|---|---|
| **1 — The module** | Create `shared/time/household-time.ts`. Pure, tested with a table of `(instant, zone) → expected`. **Zero consumers.** Needs **no new dependency** — Node and every browser ship `Intl.DateTimeFormat` with full IANA support | **None.** No caller, no column, no behaviour | Deleting one file |
| **2 — The zone** | `households.timeZone`, nullable. Detect at signup, offer in profile, default `Europe/London` with declared provenance. **No consumer reads it yet** | Very low. Nullable, additive | Dropping one column |
| **3 — The anchor** | `planner_weeks.weekStartDate`, nullable. Written **only** by the existing funnel, **only** at creation (§ 6.2). **Existing rows stay NULL, forever** | Very low. Additive; no back-fill; no existing row touched | Dropping one column |
| **4 — Convergence, one consumer at a time** | Each of the ten (§ 8) moves to the module. **`resolvePlannerWeek` returns `anchored: false` → the consumer keeps today's behaviour.** Order: greeting → diary → Home's week → dashboard's week → seasonal → Companion | Low, and **isolated per consumer** — because the fallback *is* the current code | Reverting one call site |
| **5 — The offered anchor** *(optional, later)* | Invite the household to **declare** their current week. Never forced, never inferred (§ 6.2) | Product decision, not architecture | Not shipping it |

### 10.1 Backward compatibility — the floor

> **An unanchored household gets exactly today's behaviour. An anchored household gets the truth. Nothing regresses, ever.**

This is not a courtesy; it is what makes the migration honest. THA has ~zero anchored weeks on the day Phase 3 ships and gains them only as households create weeks. If `anchored: false` meant *"show nothing"*, the Foundation would blank the product for every existing household. Instead:

```
resolvePlannerWeek(today, weeks)
  → { anchored: true,  … }  → the truth
  → { anchored: false, … }  → the caller's existing behaviour, unchanged
```

**Totality is the compatibility strategy.** The `resolveBehaviour` precedent again (INT21 § 4.1) — *"a broken preference degrades to the default voice, never to silence or a crash."*

**The three compatibility guarantees:**

1. **No row is rewritten.** Both columns are nullable and additive. No back-fill, ever (§ 6.2).
2. **No key space changes.** `weekNumber` stays 1–6; `dayOfWeek` stays 0=Sunday; `weekName` untouched. **The Planner API is byte-identical.**
3. **No user-facing word changes.** "This Week", "Next Week", "Monday" keep their text and gain a truth condition (§ 4.1).

---

## 11. RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Convergence stalls after Phase 3.** The columns ship, consumers never move, and THA holds *seven* clocks instead of six | 🔴 **The highest risk, and the likeliest** | This is the failure THA has repeated for three years (PKR1 Risk R7 — *discovery without transfer of ownership*). **Principle 8: the retirement condition is named in § 9, and Phase 3 must not ship without Phase 4 scheduled** |
| 2 | **The anchor gets back-filled** by a well-meaning migration, because `NULL` looks like a bug | 🔴 High | It is **not** a bug; it is the honest answer (§ 6.2). A back-filled anchor is `approxDate` with a schema. **Core Principle 6.** Assert it in the migration's own comment |
| 3 | **Phase of day reaches the light** — a consumer dims a surface for the evening | 🔴 High | `TRANSLATION1` § 9: **STOP**. The § 4.2 hard boundary exists for this and names it as the design's one forbidden move |
| 4 | **A `todaysDate` column appears** — someone caches the derivation | 🟡 Medium | Principle 7 (permanent sync bridge); `activity_summary`'s recorded drift is the precedent. **Determinism, not memoisation** (§ 5.2) |
| 5 | **DST correctness.** BST transitions; a "week" is not always 168 hours | 🟡 Medium | Never do date arithmetic on epoch milliseconds — the bug `approxDate` has (`MS_PER_DAY`). Operate on **civil dates**; let `Intl` own the zone rules |
| 6 | **The `T12:00:00` guard breaks past UTC+12** (`food-diary-page.tsx:128`) | 🟡 Medium | A real ±12h hack, live today. Phase 4 retires it. Until then it is a **known limitation**, not a new one |
| 7 | **The window-expired state has no product answer** | 🟡 Medium | § 6.3 — the Planner's owner decides. **The Foundation must not decide it**, and must not hide it either |
| 8 | **Time becomes an attention signal** — "it's Tuesday" starts ranking opportunities | 🟡 Medium | DEC1's stack is clock-free *by construction* (`shared/attention/decision.ts:20-22`) and stays so. Time aims **words and doors**, never **attention** |
| 9 | **A household in two zones** (a member abroad) | 🟢 Low | Out of scope by § 5.3: one household, one clock. A per-member frame is a legitimate **future fact at a different scope** (Principle 2) — recorded (§ 15.4), not created |
| 10 | **`date-fns` gets imported to "help"** | 🟢 Low | It is a dead dependency (§ 3, row 11) and has **no timezone support** without `date-fns-tz`. `Intl` is already present and sufficient. **The Foundation needs no new dependency** |

---

## 12. FUTURE CAPABILITIES UNLOCKED

Each is named with its **precondition**, and none is designed here. *"The ladder was designed to be extended by governance, not by drift"* (HOME2 § 8.4).

| Capability | Precondition | Note |
|---|---|---|
| **`TRANSLATION1` § 8 — re-aiming the door across the day** | Foundation + HOME2's resolver | **This is the one that matters: a governing rule THA currently cannot obey** (§ 13). *Look at the week in the morning; start tonight's dinner at the dinner hour.* HOME2's ladder gains a fifth rung — **by governance, not by drift** |
| **Honest history & seasonal memory** | Foundation only | **Retires `approxDate`** (§ 3.3). Summer memories stop becoming autumn memories |
| **Reminders** | Foundation + a trigger seam | § 14.1 — time triggers, INT20 decides |
| **Pantry freshness / expiry** | Foundation **+ a pantry SoT domain** | Blocked twice; the second blocker is HOME2 § 8.3's |
| **Bank-holiday awareness** | Foundation + a knowledge domain | § 14 — Variant 2, sourced, region-scoped, currency-gated |
| **School holidays** | Foundation + household-declared events | **Never seeded** (§ 7, #11) |
| **Recurring household events** | Foundation + an events entity | Governed act; new fact, new owner |
| **Push notifications** | Foundation + a channel owner + consent | Leaves the app. A genuinely new surface — **out of scope, named** |
| **Community events** | Foundation + the Community lane | Domain 21 is *"reserved lane, dormant"* (CPuBA). **Absolute time, not household-local** (§ 14.3) |

### 12.1 Reminders — time is a trigger, never a channel

INT20 § 9 is a tripwire: *"Any second ambient-notice channel — a route, panel, or prompt block that surfaces unprompted facts without passing OD1 governance and the Silence Rules — **stop.**"*

A reminder is the most natural second channel anyone will ever propose, and it must not be one:

> **The Foundation says "it is now T for this household." The Notice Engine decides whether anything is said.** Silence stays first-class (INT20 § 4). The cap stays two. The mute list still applies. **A reminder is a notice with a time-shaped trigger — not a new mouth.**

### 12.2 The Companion — composed, never templated

INT17 is the *"single owner of every byte the language model reads as grounding."*

> **Household time reaches the Companion only inside a capability's Context View, composed by INT17 under its budget. It is never templated into a prompt, a system message, or a fallback string.**

The precedent is exact: PKR2 § 12 forbids the Companion duplicating registry content into a prompt. **Time is not its own capability** — time alone answers no household question. What changes is that existing capabilities' Context Views become *able to be true*: the planner view can say "this week" and mean it. `context-frame-assembler.ts:119`'s UTC `temporalAnchor` is the one line that converges.

### 12.3 Community — the scope trap, named before it is sprung

> **A community event is not household-local time.** An event at 18:00 in Bristol is 18:00 `Europe/London` for **every** viewer — a household in Madrid must not see 19:00 "helpfully" converted, because the event's time belongs to the **venue**, not the viewer.

Household-local time and event-absolute time are **different facts at different scopes** (Principle 2) sharing one vocabulary. Named now so the Community lane does not later mint a second time owner to hold the difference.

---

## 13. ARCHITECTURE IMPACT ASSESSMENT

**Does the existing architecture require amendment? Yes — one document, one time, and only when the fact is built.**

| Document | Verdict |
|---|---|
| **`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** | ✅ **MUST EVOLVE — at implementation, not now.** Rule 1: *"Every major domain must declare a named source of truth."* **Three edits: (1)** an **Appendix A** row — *Household Time (vocabulary, mechanics, derivations) → `shared/time/household-time.ts`* — on the **exact footing Appendix A already gives ATTN1 and DEC1**, both `shared/` modules with *"no DB owner"*; **(2)** Domain 14 gains `weekStartDate`; **(3)** Domain 16 gains `timeZone`. **No new domain section.** *Trigger: Phase 1* |
| **`ARCHITECTURE_PRINCIPLES.md`** | 🟡 **One line, at implementation.** The Domain Ownership Quick Reference gains a Household Time row. Mechanical; **no principle changes** |
| **`CANONICAL_PUBLICATION_ARCHITECTURE.md`** | 🟡 **Only if bank holidays are built.** Then a Variant 2 knowledge domain must declare its contract (Rule CPuBA1). **Not triggered by the Foundation itself** (§ 8.1) |
| **`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** | 🟡 **Only if bank holidays are built.** A sixth knowledge domain in § 9 — and the **second** whose evidence standard is *currency* (Rule KC14), after Product Knowledge. **Not triggered now** |
| **`THA_KEPT_ROOM_TRANSLATION.md`** | ❌ **NO AMENDMENT — and this is the finding.** *Morning Rhythm* § 3, § 6, § 8 **already require** THA to know the hour; § 9 already forbids it reaching the light. **The law is right; the platform is behind it.** The Foundation makes an existing rule obeyable |
| **`THA_EXPERIENCE_BLUEPRINT.md`** · **`THA_EXPERIENCE_ARCHITECTURE.md`** · **`THA_EXPERIENCE_LANGUAGE.md`** · **`THA_UI_ARCHITECTURE.md`** · **`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`** | ❌ **NO AMENDMENT. Byte-untouched.** The one-morning law (§ 6.1, § 7, § 16) is **untouched and must stay so** — § 4.2's hard boundary exists to guarantee it. NORTH2 § 3.5's rejection of visual time **stands** |
| **`THA_DECISION_ENGINE_ARCHITECTURE.md`** · **`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`** · **`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`** · **`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`** · **`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`** | ❌ **NO AMENDMENT.** Each governs a seam the Foundation **feeds** and never crosses (§ 12.1, § 12.2, § 3.4) |
| **`ENGINEERING_WORKFLOW.md`** | ❌ **NO AMENDMENT.** STEP 6's Domain Impact already covers this (§ 9) |

> **The whole architectural impact is one Appendix A row and two domain rows in one register — and not one line of it is due today.** That small number is the finding, not a disappointment from it. It is the third consecutive investigation to reach it (NORTH2: *the canon is right, the render is wrong*; HOME2: *the law is right, the facts are absent*), and the pattern is now the most reliable signal the architecture has: **THA's governing documents keep predicting its defects before its code produces them.**

---

## 14. CONFLICTS WITH GOVERNING ARCHITECTURE

**None found.** The mission's stop condition is not triggered: **no architecture was modified, and none conflicts.**

Four near-misses, checked and cleared:

| Candidate conflict | Verdict |
|---|---|
| **`TRANSLATION1` § 9 / Blueprint § 7, § 16 — the one-morning law** | **Cleared, and this is the load-bearing check.** The Foundation supplies a **fact**, not a light. § 4.2 makes the boundary a hard rule of the design: time aims words and doors, never colour, palette, opacity, theme, or motion. **NORTH2 § 3.5 stands undisturbed** |
| **DEC1 § 7** — *"a workstream adding surfacing logic anywhere else must STOP"* | **Cleared.** The Foundation surfaces nothing, ranks nothing, and adds no suppress/rank/budget path. It answers *what day is it* — a question DEC1 does not ask. The attention stack stays clock-free |
| **INT20 § 9** — no second ambient-notice channel | **Cleared.** Time triggers; the Notice Engine decides and speaks (§ 12.1). No second mouth |
| **Register Rule 8** — governance review before any new knowledge store | **Cleared — not triggered.** Household time is **not knowledge**: no claim, no source, no `reviewedAt` (§ 8.1). **Bank holidays would trigger it**, which is exactly why they are deferred (§ 12) |

**One governing rule remains unobeyable until this is built** — `TRANSLATION1` *Morning Rhythm* § 8, precisely as HOME2 § 8.1 recorded. **This is not a conflict.** The rule is correct; the facts are absent. **Amending the rule to match the platform's limitation would ratify a gap as law** — the error NORTH2 § 1 and HOME2 § 10 both refused, and this document refuses it a third time.

---

## 15. GAPS RECORDED, NOT FILLED

Per EXPCOMP1 § 4.3 — *"where the canon is silent, record silence as a gap — never fill it"* — and Core Principle 6.

### 15.1 What happens when the six-slot window expires — **the top open item**

**A Planner product decision, not a platform one** (§ 6.3). The state has existed since launch and no surface can see it. The Foundation makes it **visible**; the Planner's owner must decide what it **means**. Roll, extend, archive, or ask — TIME1 does not choose, because choosing would be the redesign the mission forbids.

### 15.2 Live defects found, reported not fixed

All five pre-date TIME1. None is touched here.

1. **The dashboard's week chart is rotated one day** — `dashboard.tsx:54` + `:192-196`, Mon-first labels over Sun-first data (§ 3.2). **User-visible today.** Independently fixable, needs no Foundation.
2. **`/api/home/intelligence` and the dashboard contradict each other** on which week is "this week" — Week 6 vs Week 1 (§ 1). **User-visible today.**
3. **`approxDate` is a season filter and an occasion key**, not the recency hint its docblock claims (§ 3.3). **A live Core Principle 6 defect, and worse than HOME2 recorded.**
4. **`buildHouseholdHistory` is duplicated** — `routes.ts:11356` and `lib/household-history.ts:28` — against Rule 4, in the file whose docblock says the extraction exists to prevent it (§ 3.3).
5. **Eight timezone-naive timestamps** (`schema.ts:23, 28, 2316-2317, 2326-2327, 2357, 2772`) against 99 `timestamptz`. **Two are security-relevant** — `emailVerificationExpires` and `passwordResetExpires` are token expiries compared against a naive column. **Reported to be triaged on its own merits, not as part of this Foundation.**

### 15.3 The false comment

`routes.ts:11371` — *"dayOfWeek: 0 = Monday in plannerDays convention"* — is **false** (§ 3.2), and sits on the fabricated-date line. A one-line fix, named so it is not rediscovered.

### 15.4 Facts deliberately not created

**Per-member time zones · pantry purchase dates · household events · holiday calendars · a scheduler.** Each is a **new fact**, and a new fact is a governed act (Register Rules 2 and 8; Principle 8). **None may be invented inside a time module** — that is precisely how a vocabulary quietly becomes an owner.

---

## 16. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| **One canonical owner of household time** | § 5.1 — one pure module owning the rules and no data; the ATTN1/DEC1 class the register already records |
| **Existing ownership preserved** | § 5.2, § 9 — two facts on **two existing owners**; no new domain, no new store, no new write funnel. Domains 11, 14, 16 keep everything they own |
| **No duplicate concepts introduced** | § 2, § 9 — the design **retires** six private clocks, four greetings, three day arrays, two `approxDate` copies and two rival "current week" definitions. It adds one owner where there were none |
| **Migration path identified** | § 10 — five phases, each reversible; **the old behaviour is the floor**; no back-fill, no row rewritten, no key space changed |
| **Future intelligence capabilities clearly enabled** | § 12 — nine, each with a stated precondition and an owner; none designed here |
| **No implementation performed** | Nothing built. No code, no schema, no column, no migration, no architecture modified |

---

## 17. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this investigation; every Platform Governance document and every Intelligence and Experience document bearing on time read.
- **Principle 1 — one canonical identity per entity:** the day-of-week key space is **declared, not forked** (§ 5.5). `weekNumber` keeps its key space entirely.
- **Principle 2 — one owner per fact, at scope:** the scope test is applied three times and *decides* three questions — zone at household not user (§ 5.3), zone vs. anchor as two facts (§ 5.2), household-local vs. event-absolute time (§ 12.3).
- **Principle 5 — reference vocabularies beside the spine:** the whole shape of § 5.1, on ATTN1's and DEC1's recorded precedent.
- **Principle 6 — honest gaps over invented facts:** the load-bearing test of this design. **Existing planner weeks are never back-filled** (§ 6.2); school holidays are **never seeded** (§ 7, #11); `anchored: false` is a first-class answer (§ 5.4).
- **Principle 7 — no permanent synchronisation bridge:** nothing derived is stored or cached (§ 5.2). Determinism, not memoisation.
- **Principle 8 — retire on introduction:** § 9 names **every** store this replaces and its retirement condition, in this document, as the rule requires.
- **Register Rules 1, 2, 3, 4, 7, 8:** SoT declared (§ 5.1); the replacement question answered (§ 9); no parallel store; three identical-copy families retired; Domain Impact stated (§ 9); Rule 8 checked and **not triggered** (§ 14).
- **Observation Engine § 7:** `platform_observations` is named as a **forbidden input** (§ 3.4). `OBS_DISABLE_CAPTURE=1` stays a no-op.
- **The one-morning law:** protected by a hard boundary the Foundation imposes on itself (§ 4.2), not by a rule added to any Experience document.
- **The mission's stop conditions:** honoured. **Nothing implemented. Schema not modified. Planner not redesigned. No architecture modified. No duplicate owner of time created** — the duplication was found **already live** (§ 2) and the design retires it.
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Where it and any governing document disagree, **this document is the defect.**

---

## 18. THE FOUNDATION IN ONE PARAGRAPH

THA was never missing time — it was missing an **owner** of time, and in the absence of one, six different surfaces each grew a private clock: two greetings that disagree with two more the prototypes authored, a "today" the browser computes in UTC, a "this week" that is always Week 6 on Home and always Week 1 on the dashboard, and a historical date fabricated from the request clock and then used to decide which season a meal belongs to. So the Foundation is a **convergence**, not an addition: one pure, zero-I/O module beside the entity spine — the class the platform already built twice for attention and for decisions — that owns the rules of household time and none of its data. It needs exactly two facts, and both live with owners that already exist: the household's time zone on the household, because a family's clock is a property of their home and not of the phone in their pocket; and a calendar anchor on a planner week, written **only** at the moment the week is created, because that is the only moment THA can honestly know what the week means — and never back-filled, because a guessed anchor is the very fabrication this exists to retire. It reads no telemetry, learns no routines, stores nothing derived, and touches no light: the house keeps its one unchanging morning, and time reaches the household only through **what THA says and which door it opens** — which is not a concession the design makes to the Experience canon, but a rule that canon wrote first and has been waiting for the platform to become able to obey. Users go on planning with *This Week*, *Next Week* and *Monday*; not one word changes. **The Foundation gives THA nothing new to say. It makes what THA already says true.**

---

*An investigation — a point-in-time design of the Household Time Foundation against the governing Platform, Intelligence and Experience architectures. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the TIME1 workstream: `rollback/TIME1-household-time-foundation-20260716` → `7d1dd2ce`.*
