# THA HOUSEHOLD TIME ARCHITECTURE

**Status:** GOVERNING ARCHITECTURE — Platform Governance (canonical). Required reading before any implementation that reads a clock, a date, a day, a week, or a season.
**Established:** 2026-07-16 (`TIME3`)
**Authority:** Promoted from investigations [`TIME1 — The Household Time Foundation`](../investigations/platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md) and [`TIME2 — The Household Time Consumer Audit`](../investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md), under `ARCHITECTURE_PRINCIPLES.md` and `CANONICAL_PUBLICATION_ARCHITECTURE.md`.
**Rollback:** `rollback/TIME3-household-time-architecture-promotion-20260716` → `7d1dd2ce`
**Enforcement:** Architecture Compliance Checklist (`ENGINEERING_WORKFLOW.md`); the Source of Truth Register's Appendix A; the § 16 verification gate at implementation.
**Implementation status:** **DECLARED, BUILT, AND CONVERGING** — see § 17. The module (`shared/time/household-time.ts`) and `households.timeZone` exist as of 2026-07-17 (`CONV1 P5`); **Phase 3's T2/T3 consumers converged on 2026-07-17 (`CONV1 P6`)** — the Companion's anchor, the freezer, the diary, and the four `getGreeting()` copies now read the owner. `planner_weeks.weekStartDate` still does not exist (Phase 4), so the **T5 consumers** — the five rival "current weeks" — are still live.

---

## PREAMBLE

This document establishes the governing architecture for **household time**: how The Healthy Apples knows what day it is for a household, which week they are living in, and what hour of their day it is — and, equally, where that knowledge must never reach.

It is promoted from two investigations, and it **supersedes neither**. Under `REPOSITORY_CONVENTIONS.md` § 3, an investigation and its promoted architecture are *"the only sanctioned form of two documents sharing a subject, and they are not duplicates: one is history, one is governing."* **TIME1 and TIME2 remain at their paths as point-in-time analysis and are retired as sources of rule.** Where this document and either investigation disagree, **this document governs and the investigation is history**.

This architecture **adds nothing to what those investigations found**. It designs no model they did not design, names no capability they did not name, and changes no phase of the roadmap they set. Its entire function is to move their conclusions from *recommendation* to *law*, and to give the platform an owner of time it can converge onto.

It exists because of one finding, which is the reason the whole thing is worth doing:

> **THA does not lack time. THA already tells households the time — in six places, with six private definitions, owned by nobody — and at least three of them are wrong.** (TIME1 § 1.)
>
> **Every consumer in THA that needs only a duration is correct. Every consumer that needs the household's calendar is broken. The line between them is exact.** (TIME2 § 1.1.)

Household Time is therefore **a convergence, not an addition**. Its first act is retirement (§ 15).

---

## 1. PURPOSE

Household Time exists to answer one question, once, for the whole platform:

> **What time is it for this household?**

Twenty domains ask that question today. None of them is entitled to answer it. This architecture makes exactly one thing entitled to answer it, and requires every other domain to ask.

**What it is for:**

- To make the claims THA already makes — *"today"*, *"this week"*, *"good morning"* — **true**.
- To give an owner to a fact five live frames currently guess at (UTC · server-process-local · browser-local · noon-anchored-local · week-index — TIME2 § 7.2).
- To let a governing rule THA already carries become obeyable: `THA_KEPT_ROOM_TRANSLATION.md` *Morning Rhythm* § 6 and § 8 **require** THA to know the hour, and the platform cannot (TIME1 § 4.2).

**What it is not for:**

- It gives THA **nothing new to say**. It changes no user-facing word. Households continue to plan with *This Week*, *Next Week*, *Monday* (TIME1 § 4.1).
- It is **not a scheduler**, not a calendar feature, not a notification system, and not a Planner change.

---

## 2. THE CANONICAL OWNER

> **`shared/time/household-time.ts` is the single canonical owner of household time. It owns the *rules* of household time and **none of its data**.**

This is the class the platform has already established twice, and which the Source of Truth Register records in Appendix A for both precedents:

| Precedent | Owns | Data owned |
|---|---|---|
| `shared/attention/index.ts` (ATTN1) | The attention vocabulary | **None** — *"no DB owner"* |
| `shared/attention/decision.ts` (DEC1) | The decision mechanics | **None** |
| **`shared/time/household-time.ts` (TIME3)** | **The time vocabulary and mechanics** | **None** |

It is a **reference vocabulary beside the entity spine** under **Principle 5** — *"Reference vocabularies stay beside the spine, never merged in… They sit beside the entity spine and are shared across entities."* Household time is the archetypal cross-entity vocabulary: the Planner, the Diary, the Pantry, Shopping, the Companion and Food Intelligence all need it, and **none of them may own it**.

| Property | Value |
|---|---|
| **Class** | Pure, zero-I/O, deterministic, beside the entity spine |
| **Variant** (CPuBA Rule 1) | **None of the three.** Not seed-owned, not knowledge, not database-owned — it has no projection. See § 16 |
| **Totality** | **Total.** Every input — missing zone, unanchored week, malformed value — resolves to a stated answer. Never throws |
| **Persistence** | **None.** No table, no cache, no column |
| **I/O** | **None.** Callers supply the instant and the household's facts |
| **Clock** | **Reads none.** `now` is a parameter (Rule **HT5**) |
| **Learning** | **None** |
| **Not** | Not a service, not an engine, not a capability, not a store, not a numbered domain |

---

## 3. SOURCE OF TRUTH

Household Time needs **two facts**. Both live with owners that **already exist**. **No new domain is created.**

| Fact | Answers | Owner | Register domain | Scope |
|---|---|---|---|---|
| `households.timeZone` — IANA id, nullable | *Where does this household live in time?* | `households` — **existing owner, extended** | **16** — Household Profiles | Household |
| `planner_weeks.weekStartDate` — date, nullable | *Which calendar week is this planner slot?* | `planner_weeks` — **existing owner, extended** | **14** — Planner State | Planner week |

**Why two facts and not one.** Principle 2's scope test — *"Can these two stores legitimately disagree?"* — answers it: **yes**. A household's zone is a property of the home; a week's anchor is a property of that week. Neither derives from the other. They are **different facts at different scopes, and both are valid**.

**Everything else is derived and never stored.** *"Today"*, *"this week"*, *"the phase of day"* and *"the current planner week"* are **derivations** (Rule **HT3**).

---

## 4. RESPONSIBILITIES — WHAT HOUSEHOLD TIME OWNS

Four things, none of which has an owner today:

1. **The day-of-week key space** — `0 = Sunday … 6 = Saturday`. **Declared, never migrated** (Rule **HT8**).
2. **The week convention** — the household week **starts Monday** (ISO-8601, UK). The identity and display convention; it does not touch the stored `dayOfWeek` numbering.
3. **The phase-of-day vocabulary** — the named phases and their boundaries. **Coarse named phases, never a continuous variable.**
4. **The derivations** — `householdToday()`, `householdWeekOf()`, `householdPhase()`, `resolvePlannerWeek()`. Pure functions of `(instant, household facts)`.

> **The week convention is not a new decision.** `[1, 2, 3, 4, 5, 6, 0]` — the Monday-first reorder map — is hand-rolled **five times** in live display code (TIME2 § 7.2). The product already decided the week starts Monday; it decided it five times, locally, with no owner. This architecture **declares what is already true** and gives it one place to be true in.

---

## 5. WHAT HOUSEHOLD TIME MUST NOT OWN

**This section is as binding as § 4.** Each boundary names the owner it protects.

| Household Time must NOT own | Owner it belongs to |
|---|---|
| **The season** | The season rule. Household Time supplies its **input** (a civil date), never its **answer** (Rule **HT17**) |
| **Any user-facing word** — greetings, week labels, relative phrases | **Behaviour Engine** (INT21). *"Selection, then phrasing — in that order, with nothing in between"* |
| **What the model reads** | **Context Composition Engine** (INT17) — *"the single owner of every byte the language model reads as grounding"* (Rule **HT15**) |
| **Whether anything is said** | **Notice Engine** (INT20). Silence is a first-class outcome (Rule **HT14**) |
| **What surfaces, and in what order** | **Decision Engine** (DEC1). The attention stack is clock-free by construction and stays so (Rule **HT5**, § 11) |
| **Any visual property** — colour, palette, opacity, theme, motion | **UI Architecture**; `THA_KEPT_ROOM_TRANSLATION.md` *Morning Rhythm* § 9 (Rule **HT13**) |
| **The planner's slots** — `weekNumber`, `dayOfWeek`, `weekName` | **Planner** — Domain 14. Household Time *declares what `dayOfWeek` means*; the Planner *stores the integer* |
| **Durations** — token expiry, cache TTL, session length, evidence windows | Nobody. **They are INSTANT and need no owner of time** (Rule **HT9**, § 9) |
| **Schedules and delivery times** | Nothing — **no scheduler exists**, and when one arrives it is a separate platform capability (Rule **HT14**, § 9.2) |
| **Events** — bank holidays, school holidays, recurring household events | Nothing yet. Each is a **new fact and a governed act** (Register Rules 2, 8) |
| **Any derived value, stored** | Nobody. Storing a derivation creates a permanent sync bridge (Rule **HT3**, Principle 7) |

---

## 6. THE PUBLIC PLATFORM CONTRACT

The consumable surface. **This is the whole of what a consumer may ask for.**

```
householdToday(now: Instant, zone: IANAZone) → CivilDate
householdWeekOf(date: CivilDate)             → CalendarWeek      // Monday-first, ISO
householdPhase(now: Instant, zone: IANAZone) → PhaseOfDay        // coarse, named
resolvePlannerWeek(today: CivilDate, weeks: PlannerWeek[]) → PlannerWeekResolution
```

```
PlannerWeekResolution =
  | { anchored: true;  week: PlannerWeek; relation: "this" | "next" | "past" | "ahead" }
  | { anchored: false; reason: "no-anchor" | "window-expired" | "no-weeks" }
```

### 6.1 The consumption vocabulary

| Token | Name | Needs |
|---|---|---|
| **T1** | `zone` | `households.timeZone` |
| **T2** | `today` | T1 |
| **T3** | `phase` | T1 |
| **T4** | `week` | T2 |
| **T5** | `plannerWeek` | T2 **+ `planner_weeks.weekStartDate`** |

And two tokens that are **not** Household Time, named here because conflating them is this architecture's principal hazard:

| Token | Name | Why it is not Household Time |
|---|---|---|
| **S** | `season` | Owned by the season rule, which is *given* a T2 and never reads a clock (Rule **HT17**) |
| **I** | `instant` | An absolute point. Needs **no zone**. Consuming T1–T5 here is a **defect** (Rule **HT10**) |

### 6.2 `anchored: false` is an answer, not an error

The resolution is **total**. `anchored: false` is a **first-class answer** — it is what THA must truthfully say about every household that exists on the day this ships, and it is the difference between this architecture and the five implementations it replaces:

> **The current code cannot express *"I don't know which week this is"*, so it guesses — and the guess is indistinguishable from knowledge.**

---

## 7. THE CIVIL / INSTANT MODEL

**The instrument that decides whether a domain consumes Household Time at all.**

> **The test: if this household moved to Tokyo tomorrow, would this value have to change?**
>
> - **Yes → CIVIL.** It needs Household Time.
> - **No → INSTANT.** It must **never** consume Household Time.

| Value | Moving to Tokyo… | Verdict |
|---|---|---|
| *"What's for dinner today?"* | changes which day it is | **CIVIL** |
| *"Good morning"* | changes the greeting | **CIVIL** |
| *"This reset token expires 24h after issue"* | changes nothing | **INSTANT** |
| *"The 90 days of evidence before now"* | changes nothing | **INSTANT** |
| *"This cache entry is 5 minutes old"* | changes nothing | **INSTANT** |

**A third category exists and has exactly one future occupant:**

> **CIVIL (foreign zone)** — a value needing *a* zone, but **not the household's**. An event at 18:00 in Bristol is 18:00 `Europe/London` for a viewer in Madrid: the zone belongs to the **venue**, not the viewer. **Community is the only domain in this category** (§ 8), and it does not exist yet.

### 7.1 Why the model is load-bearing

Every INSTANT consumer in THA is **correct**, and correct *because* it is INSTANT — a duration needs no calendar, so the absent time zone has cost it nothing. Every CIVIL consumer is **broken**, all in the same way.

> **THA is broken exactly and only where household time is required.** The platform has been failing along this line for months. **The line is not an invention of this architecture; it is a diagnosis of the platform.**

---

## 8. THE CONSUMER MODEL

**Reads across. Owns down. `MUST NOT` is a permanent verdict, not a backlog.**

| Domain | T1 | T2 | T3 | T4 | T5 | S | I | **Owns** |
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
| **Food Intelligence** | – | ✅ | – | – | ✅ | ✅ | – | **Nothing** |
| **Household Nutrition** | – | – | – | – | ✅ | – | – | The target |
| **Community** | – | ○ | – | – | – | – | ○² | **Nothing** |
| **Streaks** | – | ✅ | ✅ | ✅ | – | – | – | `user_streaks` rows |
| **Savings** | – | ✅ | ✅ | ✅ | – | – | – | `savings_events` rows |
| **Health Trends** | – | ✅ | – | – | – | – | – | Trend rows |
| **Product / Analyser** | – | ✅ | – | – | – | – | ✅ | `product_history` rows |
| **Trial / Auth** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Token/session instants |
| **Learning** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Evidence instants |
| **Caching** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Nothing |
| **Observation** | 🚫³ | 🚫³ | 🚫³ | 🚫³ | 🚫³ | 🚫 | ✅ | `platform_observations` |
| **Decision Engine** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | Delivery instants |

✅ consumes · ○ future consumer · – n/a · 🚫 **MUST NOT consume**
¹ *writes* the anchor at creation only · ² CIVIL (foreign zone) — the venue's, never the household's · ³ **forbidden by Observation Engine § 7**

> **Every cell in the "Owns" column is either `Nothing` or a fact the domain already owned. No domain acquires an ownership.** The matrix's entire content is that Household Time is read by twenty domains and owned by none of them.

### 8.1 Domains that must never consume Household Time

**Five domains are correct today and consuming Household Time would break them.** This is not a migration backlog. It is a permanent verdict (Rule **HT10**).

| Domain | Why it must not | If it did |
|---|---|---|
| **Trial / Subscription** | A 20-minute countdown is a duration | A trial's length would depend on where the family lives |
| **Auth / Session** | `SESSION_MAX_AGE_MS`; token expiry is `issue + 24h` | A session's length would depend on the household's zone. **Security-relevant** |
| **Learning / Evidence** | `EVIDENCE_WINDOW_DAYS = 90` before *now* | The window would move with geography |
| **Caching / TTL** | Every cache is a pure duration | Cache lifetime would vary by household |
| **Observation Engine** | **Forbidden** — Observation Engine § 7: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop**."* `OBS_DISABLE_CAPTURE=1` must remain a functional no-op | Telemetry would inform behaviour |

**Two further domains consume nothing and must acquire no clock:** **Shopping** (an instant used as an instant, for ordering only — the platform's reference pattern) and **Shared Plan** (relative ordinals; a shared plan is a template, not a calendar).

**Operator time is a third scope** (household · operator · absolute). Admin surfaces, the Observation Engine's day buckets and guidance analytics are **operator-scoped**. The correct action for them is **to declare the frame, never to convert it**: an operator reviewing a household in Tokyo must never be silently shown the household's zone.

---

## 9. GOVERNANCE RULES

Binding on every implementation. Each is promoted from TIME1 or TIME2 and restates no other document's rule.

**Ownership**

- **HT1 — One owner.** `shared/time/household-time.ts` owns the rules of household time and none of its data. A second implementation of any T1–T5 derivation is an architecture violation on arrival.
- **HT2 — Two facts, two existing owners.** `households.timeZone` (Domain 16) and `planner_weeks.weekStartDate` (Domain 14). **No new domain, no new store, no new write funnel.**
- **HT3 — Nothing derived is stored.** *Today*, *this week*, *the phase*, *the current planner week* are derivations. A column or cache holding any of them is a **permanent sync bridge** (Principle 7).
- **HT4 — The zone is a property of the home.** Not of the device, not of the session, not of the member. A family on holiday is still a household at home. Per-member zones are a different fact at a different scope and do not exist.

**Correctness**

- **HT5 — `now` is a parameter, never an ambient read.** The module reads no clock. This is what makes it testable, replayable, and **incapable of disagreeing with itself**.
- **HT6 — Totality.** Every derivation is total. `anchored: false` is a first-class answer, never an error, never a throw.
- **HT7 — The anchor is written only at creation, and never back-filled.** The only moment THA can honestly know which calendar week a planner slot means is the moment the slot is created. **Existing rows stay `NULL` forever.** A back-filled anchor is fabrication (Core Principle 6).
- **HT8 — Declare, do not migrate.** `dayOfWeek` is `0 = Sunday`. The household week starts Monday. The stored numbering is **declared, never renumbered** — renumbering silently rotates every planner consumer by one day and no test would catch it.

**Consumption**

- **HT9 — A duration is not a date.** The CIVIL/INSTANT test (§ 7) decides whether a domain consumes at all.
- **HT10 — Consuming Household Time in an INSTANT domain is a defect,** not an improvement. § 8.1's verdicts are permanent.
- **HT11 — All of it, or none of it.** A consumer that takes T2 from the module but keeps its own week arithmetic compares the household against two calendars at once. **Half-converged is worse than unconverged.**
- **HT12 — The client renders household time; it never derives it.** The device may supply *the instant*, and may detect *the zone at signup*. It may never decide *the day*.

**Boundaries** *(each protects a rule another document owns — cited, never restated)*

- **HT13 — Time aims words and doors, never light.** Household time may aim what THA *says* and which door it *opens* (`THA_KEPT_ROOM_TRANSLATION.md` *Morning Rhythm* § 3, § 6, § 8). It may **never** aim a colour, token, palette, opacity, theme, or motion. A consumer reading T3 to dim a surface has broken the one-morning law; the rule to apply is that document's § 9: **STOP**.
- **HT14 — Time triggers; the Notice Engine decides.** Household Time may say *"it is now T for this household."* Whether anything is said is INT20's, and silence stays first-class. **A reminder is a notice with a time-shaped trigger — never a new mouth, and never a scheduler inside the Notice Engine.**
- **HT15 — Time reaches the model only through a Context View,** composed by INT17 under its budget. **Never templated into a prompt, a system message, or a fallback string.**
- **HT16 — Telemetry may never inform household time.** No learned routine, no inferred rhythm (Observation Engine § 7). A household pattern may only be read from state the household authored.
- **HT17 — Season is not Household Time.** There is **one** season rule. Household Time supplies its **input** and never its **answer**. A season computed inside the time module is the second owner Principle 2 forbids.
- **HT18 — Verification is that no second implementation exists.** For a pure vocabulary, drift is not a stale row — it is a **rival copy** (§ 16).

---

## 10. THE DEPENDENCY MODEL

```
   ┌──────────────────────────────────────────────────────────────┐
   │  PHASE 0 — GOVERNANCE (no code)          ← THIS DOCUMENT     │
   │  Owner declared. Register amended. Index updated.            │
   │  Without this there is nothing to converge onto.             │
   └───────────────────────────┬──────────────────────────────────┘
                               │
   ┌───────────────────────────▼──────────────────────────────────┐
   │  PHASE 1 — THE MODULE   shared/time/household-time.ts        │
   │  Declares: dayOfWeek (0=Sun) · week starts Monday ·          │
   │            phase vocabulary · the derivations                │
   │  Zero consumers. No new dependency — Intl suffices.          │
   └──────┬──────────────────────────────┬────────────────────────┘
          │                              │
          │                    ┌─────────▼──────────────────────┐
          │                    │ PHASE 1a — SEASON CONVERGENCE  │
          │                    │ 3 impls → 1.                   │
          │                    │ INDEPENDENT of zone + anchor.  │
          │                    └────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  PHASE 2 — THE ZONE   households.timeZone  (nullable)        │
   │  Unblocks 7 of 12 consumers. No anchor required.             │
   └──────┬───────────────────────────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  PHASE 3 — T2/T3 CONVERGENCE  (no anchor needed)             │
   │  Companion temporal anchor → Cookbook freezer → Diary →      │
   │  greeting ×4 → health trends · product · pantry season input │
   └──────┬───────────────────────────────────────────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────────┐
   │  PHASE 4 — THE ANCHOR   planner_weeks.weekStartDate          │
   │  ★ THE GATE. Written at creation only; never back-filled.    │
   └──────┬───────────────────────────┬───────────────────────────┘
          │                           │
   ┌──────▼──────────────────┐  ┌─────▼────────────────────────────┐
   │ PHASE 5 — T5 CONSUMERS  │  │ PHASE 6 — RETIRE THE FABRICATOR  │
   │ 5 rival "current weeks" │  │ Stories & Seasonal become honest │
   │ collapse to 1.          │  │ ← Cannot happen before Phase 4.  │
   └─────────────────────────┘  └──────────────────────────────────┘
```

**Three facts this graph fixes:**

1. **Phase 0 is not optional and is not code.** Every later phase is a *convergence*; the register must name the owner first, or each is a workstream inventing a store (Register Rule 8).
2. **Phase 2 unblocks more than Phase 4, and costs less.** Seven of twelve consumers need only T1+T2. **The expensive step is not on the critical path for most of the harm.**
3. **Phase 6 is gated absolutely by Phase 4.** Some claims cannot be repaired by household time, because there is no real date underneath to correct. **Fixing their time zone before the anchor exists makes a fabricated date *precisely* wrong** — the worst outcome available.

---

## 11. OWNERSHIP BOUNDARIES

The seams Household Time touches and must never cross. **Each is another document's law, cited here so a consumer knows it applies — never restated.**

| Seam | Owner | The boundary |
|---|---|---|
| **The house's light** | `THA_KEPT_ROOM_TRANSLATION.md` § 9; `THA_EXPERIENCE_BLUEPRINT.md` § 7, § 16 | Time reaches words and doors, never light. **HT13** |
| **The model's grounding** | INT17 | Time enters as a Context View. **HT15** |
| **What is said** | INT20 | Time triggers; INT20 decides. **HT14** |
| **What surfaces** | DEC1 | The attention stack is clock-free. Time is **never** an attention signal — *"it's Tuesday"* must not rank an opportunity |
| **The words** | INT21 | Every user-facing string, including the greeting and every week label |
| **Telemetry** | Observation Engine § 7 | Never an input. **HT16** |
| **The planner's slots** | Domain 14 | Household Time declares what `dayOfWeek` *means*; the Planner stores the integer and keeps its key space |
| **The season** | The season rule | Input, never answer. **HT17** |

> **Household Time is the platform's most-read module and its least-powerful one.** It answers one question and is forbidden from acting on the answer.

---

## 12. IMPLEMENTATION PHASES

**Unchanged from TIME1 § 10 and TIME2 § 10.** This document ratifies the roadmap; it does not revise it.

| Phase | Work | Needs | Reversible by |
|---|---|---|---|
| **0** | **Governance** — this document; the register; the index | — | Reverting the docs |
| **1** | **The module.** Pure, zero-I/O. Declares the key space, the week convention, the phase vocabulary. **No new dependency** — `Intl` ships in Node and every browser | 0 | Deleting one file |
| **1a** | **Season convergence** — three implementations to one | 1 | Reverting one import sweep |
| **2** | **The zone.** `households.timeZone`, nullable, detected at signup, user-correctable, `Europe/London` default with declared provenance | 1 | Dropping one column |
| **3** | **T2/T3 convergence,** one consumer at a time | 2 | Reverting one call site |
| **4** | **★ The anchor.** `planner_weeks.weekStartDate`, nullable, written only at creation | 2 | Dropping one column |
| **5** | **T5 convergence** | 4 | Reverting one call site |
| **6** | **Retire the fabricated dates** | 4 | Not shipping it |

**Phase 0 is complete on the adoption of this document. Phases 1–6 are authorised by nothing here** — each requires its own workstream under `ENGINEERING_WORKFLOW.md`.

---

## 13. MIGRATION PRINCIPLES

Five principles govern every phase. **They are what make the migration honest rather than merely additive.**

1. **The old behaviour is the floor.** `resolvePlannerWeek → anchored: false` means the caller keeps **exactly today's behaviour**. An unanchored household gets what it gets today; an anchored one gets the truth. **Nothing regresses, ever.** Totality (**HT6**) *is* the compatibility strategy.
2. **No row is rewritten.** Both facts are nullable and additive. **No back-fill, ever** (**HT7**).
3. **No key space changes.** `weekNumber` stays 1–6. `dayOfWeek` stays `0 = Sunday`. `weekName` is untouched. **The Planner API is byte-identical** (**HT8**).
4. **No user-facing word changes.** *This Week*, *Next Week*, *Monday* keep their text and gain a truth condition.
5. **Declare before implementing.** `CANONICAL_PUBLICATION_ARCHITECTURE.md` § Transition Rules: *"Every new domain must be declared **before** implementation."* This document is that declaration (§ 17).

> **The governing sentence of the migration:** **Household Time gives THA nothing new to say. It makes what THA already says true.**

---

## 14. RETIREMENT TARGETS

**Principle 8 requires the retirement list to be named in the document that introduces the replacement.** This is that list. Every entry is a **live duplicate of a fact this architecture now owns**.

**Retirement condition, for every entry:** the consumer reads `shared/time/household-time.ts`. **Nothing is deleted before its replacement is live.**

| # | Target | Count | Phase | Status |
|---|---|---|---|---|
| 1 | **Rival "current week" implementations** — three server-side `max(weekNumber)` variants, the dashboard's `plannerFull[0]`, and Home's `localStorage` active-week | **5 → 1** | 5 | **live** — gated on the anchor |
| 2 | **Week-shape declarations** — Sunday-first arrays, Monday-first arrays, and the `[1,2,3,4,5,6,0]` reorder map | **19 across 16 files → 1** | 1, 3, 5 | **live** — `MONDAY_FIRST_ORDER` is declared and unconsumed |
| 3 | **`getGreeting()` copies** — two live (boundary 17), two in prototypes (boundary 18) | **4 → 1** | 3 | ✅ **DONE** — `CONV1 P6`, `client/src/lib/greeting.ts`. The 17-vs-18 divergence is settled on the declared 17. **The words remain INT21's (CP3)** |
| 4 | **Season implementations** — one exported, two private and byte-identical | **3 → 1** | 1a | ✅ **DONE** — `CONV1 P5` |
| 5 | **Fabricated-date builders** — duplicated despite a docblock stating the extraction exists to prevent it | **2 → 0** | 6 | **live** — gated absolutely on the anchor |
| 6 | **Monday-week implementations** — the streak week, the savings week/month, and the client's | **3 → 1** | 5 | **live** |
| 7 | **Client-derived "today" for intelligence purposes** | **→ 0** | 3, **HT12** | ✅ **DONE** — `CONV1 P6`. The freezer's two client writes are server-stamped; the diary derives from the household's zone |
| 8 | **The diary's `T12:00:00` guard** — a ±12h workaround that breaks past UTC+12 | **→ 0** | 3 | ✅ **DONE** — `CONV1 P6`. **Both** occurrences; the second hid a live off-by-one that made *"Today!"* unreachable |
| 9 | **`dayOfYear` and the benchmark seeder's date offset** | **2 → 0** | 3 | **live** — `CONV1 P6` did not reach them (§ 17) |
| 10 | **The duplicated `WEEKLY_PLANT_TARGET`** — declared canonically and re-declared on Home | **2 → 1** | 5 | **live** |

> **Five frames are live today — UTC · server-process-local · browser-local · noon-anchored-local · week-index.** The retirement target is **one**.

---

## 15. RELATIONSHIP TO THE INVESTIGATIONS

**TIME1 and TIME2 are retired as sources of rule on the adoption of this document.** They remain at their paths as **point-in-time analysis and history** — the sanctioned promotion form (`REPOSITORY_CONVENTIONS.md` § 3).

| Document | Status | What it holds that this document does not |
|---|---|---|
| [`TIME1`](../investigations/platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md) | **History.** Superseded as rule by this document | The design reasoning: why the anchor is per-week and not a household epoch; why a scoring model was rejected; the full time audit of 2026-07-16 |
| [`TIME2`](../investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md) | **History.** Superseded as rule by this document | The per-domain evidence with file:line citations; the 14 live defects; the three corrections to TIME1 |

**Neither is a dependency.** No code, gate, or document may read them to decide anything. **Where an investigation and this document disagree, the investigation is history and this document governs.**

> **They are cited, never duplicated.** This document holds the **rules**; they hold the **evidence and the reasoning that produced them**. That division is the whole of why both may exist (`REPOSITORY_CONVENTIONS.md` § 3: *"they are not duplicates: one is history, one is governing"*).

---

## 16. VERIFICATION

**Household Time has no projection, and stating why is the point.**

Against `CANONICAL_PUBLICATION_ARCHITECTURE.md`'s three variants:

- **Not seed-owned** — there is no seed.
- **Not knowledge** — no claim, no source, no `reviewedAt`, no evidence gate. *(Bank holidays, if ever built, **would** be a knowledge domain — Variant 2, region-scoped. They are named as a future fact and are **not** part of this architecture.)*
- **Database-owned (Variant 3) on both facts** — each authored through its owner's **existing single write funnel** (Rule CPuBA4). **Household Time adds no writer.**
- **The module itself publishes nothing** — the class ATTN1 and DEC1 occupy, which Appendix A records with **no DB owner**.

> **The publication contract:** the owner is the module; the projection is **nothing**; the runtime read path is the module itself; and **verification is that no second implementation exists** (**HT18**). For a pure vocabulary, drift is not a stale row — it is a **rival copy**. The gate that matters is the one that fails when someone writes a sixth `getGreeting()`.

**The verification entry lands with Phase 1**, in the same change as the module. It is not added now, because a check asserting the properties of a file that does not exist would fail by design.

---

## 17. STATUS — DECLARED, BUILT, AND CONVERGING

**This must be read before anyone cites this document as describing the running system.**

*This section read **DECLARED, NOT BUILT** from 2026-07-16 until 2026-07-17, when `CONV1 P5`
built Phases 1, 1a and 2; it then read **DECLARED, AND PARTLY BUILT** until later the same
day, when `CONV1 P6` converged Phase 3's T2/T3 consumers. It is corrected here rather than
restated elsewhere: a governing document that is stale about its own domain is the
`DOC-4`/`KC14` failure, and this document owns this fact.*

| | |
|---|---|
| **`shared/time/household-time.ts`** | ✅ **BUILT — 2026-07-17** (`CONV1 P5` / `OWN-4`). Phase 1. Pure, zero-I/O, reads no clock. Its § 16 verification entry landed in the same change |
| **The season rule** | ✅ **CONVERGED — 2026-07-17** (`CONV1 P5` / `OWN-3`). Phase 1a. Three implementations → one: `shared/seasonal/season-rule.ts` (Domain 11). **Not Household Time** (HT17) — this module supplies its input |
| **`households.timeZone`** | ✅ **BUILT — 2026-07-17** (`CONV1 P5` / `SCH-1`). Phase 2. Nullable, additive, no back-fill, no SQL default; detected at signup, owner-correctable |
| **`planner_weeks.weekStartDate`** | **Does not exist.** Phase 4. So `resolvePlannerWeek` returns `anchored: false` for **every household**, which is the honest floor (§ 13.1), not a defect |
| **The T2/T3 consumers** | ✅ **CONVERGED — 2026-07-17** (`CONV1 P6`). Phase 3. The Companion's temporal anchor (`READ-4` — it was UTC's today, in the system prompt and the diary day), the freezer's write and comparison (`BEH-6`), the diary's day, both `T12:00:00` guards and `copyPlannerToFoodDiary`'s weekday (`SCH-4`), and the four `getGreeting()` copies. **Proven byte-identical to the frozen pre-convergence oracles wherever it must not change** |
| **The T5 consumers** | **Still read their own private clocks**, and cannot do otherwise: they need the anchor, which is Phase 4. The five rival "current weeks", streaks and savings are **live** (`CONV1 P7`/`P8`) |
| **§ 14's retirement list** | **Substantially discharged, not complete.** Done: target 3 (`getGreeting()` ×4 → 1), target 4 (seasons 3 → 1), target 7 (client-derived "today" for intelligence → 0), target 8 (the diary's `T12:00:00` guard → 0). **Live:** target 1 (five "current weeks"), target 2 (nineteen week-shapes), targets 5, 6, 9, 10 — every one of them gated on the anchor |
| **This document** | **In force from 2026-07-16** |

> **The law was in force for one day before the code existed, and that was the point** (§ 17's
> original argument, now discharged rather than disproved): the declaration stopped the
> duplication growing while the module was written, and the module landed with a gate that fails
> the moment a rival copy returns.
>
> **P5's warning is now discharged too.** It ended with *"a module with no consumers is a rival
> copy in waiting"* — `R3`. It has consumers. What remains is not the declaration and no longer
> the first convergence: **it is the anchor**, and every target still on § 14's list is waiting
> on it.

**This is the correct and required order,** not a gap: `CANONICAL_PUBLICATION_ARCHITECTURE.md` § Transition Rules — *"Every new domain must be declared **before** implementation (owner, variant, publication path)."*

> **What is in force today is the *law*, not the *code*.** From this date, an implementation that reads a clock, invents a "today", writes a sixth `getGreeting()`, or adds a second "current week" **is in violation of governing architecture** — whether or not the module exists yet. **That is the entire value of Phase 0**, and it is why the declaration precedes the build: it stops the duplication growing while the module is written.

**The Source of Truth Register's Appendix A row names this owner and marks it not-yet-implemented.** A future reader must not mistake the declaration for a projection.

---

## 18. RELATIONSHIP TO OTHER GOVERNING DOCUMENTS

**Subordinate to:**

- **`ARCHITECTURE_PRINCIPLES.md`** — Principle 5 gives this architecture its class; Principle 2 its two-facts test; Principle 6 the no-back-fill rule; Principle 7 the no-stored-derivation rule; Principle 8 the retirement list.
- **`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** — Appendix A names the owner; Domains 14 and 16 name the facts. **The register prevails** on any question of which store owns which fact.
- **`CANONICAL_PUBLICATION_ARCHITECTURE.md`** — § 16's contract and the declare-before-implement order are its rules applied.

**A non-overriding sibling of** the Intelligence Governance documents (INT17, INT20, INT21, DEC1, the Observation Engine) and the Experience Governance documents. **Household Time feeds those seams and crosses none of them** (§ 11). Where any conflict of rule arises, **the seam's owner prevails and this document is the defect.**

**It amends none of them.** The Experience canon in particular is **byte-untouched**: `THA_KEPT_ROOM_TRANSLATION.md` *Morning Rhythm* § 6 and § 8 already require THA to know the hour, and § 9 already forbids time reaching the light.

> **The law was right; the platform was behind it. This architecture supplies the fact an existing law already required — and adds no rule to the document that required it.**

---

## 19. HISTORY

**`TIME3` (2026-07-16)** promoted this architecture from investigations `TIME1` (the Foundation) and `TIME2` (the Consumer Audit), both of 2026-07-16, both of which remain at `docs/investigations/platform/` as point-in-time analysis.

`TIME1` was written against the gap `HOME2` § 8.1 recorded — that THA cannot determine *"today"*, cannot relate planner weeks to calendar dates, and cannot support time-aware household intelligence. It found the sharper problem: **the platform already answers those questions, six times, with no owner.** `TIME2` audited twenty domains against it and found **every INSTANT consumer correct and every CIVIL consumer broken** — the line between them exactly TIME1's — and **corrected TIME1 on three points**, the load-bearing one being that the `dayOfWeek` key space is not merely undocumented but **actively split in live server code**, which is why **HT8** declares it rather than assuming it.

**This promotion creates no rule that TIME1 or TIME2 did not establish, designs nothing they did not design, and changes no phase of the roadmap they set.** Its whole content is the transfer of ownership that PKR1 Risk R7 names as THA's most repeated failure: *something is found, written down beautifully, read once, and never maintained.* **The investigations discovered; this document owns.**

---

*Governing architecture. Required reading before any implementation that reads a clock, a date, a day, a week, or a season.*
*Rollback: `git checkout HEAD docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (or delete the file to revert). Workstream tag: `rollback/TIME3-household-time-architecture-promotion-20260716` → `7d1dd2ce`.*
