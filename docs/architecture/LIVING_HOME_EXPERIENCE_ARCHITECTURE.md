# THA Living Home Experience Architecture

**Document ID:** `LIVINGHOME1`
**Date:** 2026-07-20
**Status:** GOVERNING — law in force · Traditions & Celebrations domain **DECLARED, NOT BUILT**
**Rollback identifier:** `rollback/LIVINGHOME1-living-home-architecture-20260720` → `1fe5e62c`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow

---

## 0. Mandate

**The Healthy Apples is one home that a household lives in, not a collection of application pages — and the way a home stays alive for a decade is that the house holds still while the life moves.**

This document is the governing source for the **Living Home**: how the one canonical home and the one canonical orchard remain constant, how each room is a viewpoint on that one home rather than a separate environment, and how the home nonetheless evolves naturally — through the household's seasons, the household's hours, and the household's own traditions and celebrations — without ever becoming theatrical, gimmicky, or a theme.

Its central instrument is a single sentence, and everything below is that sentence applied:

> **The house holds still; the life moves.**
>
> Every change a household ever perceives in THA is a change in *their life shown truthfully* — what is in season on their table, what today's hour makes relevant, what their family has declared worth celebrating — and never a change in the house itself: not its light, not its season, not its walls, not its geography.

This is not a compromise position. It is the reason a real home feels alive: the kitchen does not repaint itself in October; the family carries autumn in through the door. A house that changes its own weather is a stage set, and a stage set is exactly what the canon's anti-pattern law calls it (`THA_EXPERIENCE_BLUEPRINT.md` § 16 — *the theme park*, *the second sun*).

---

## 1. Why this document exists

The North Star implementation (`docs/implementation/EXP1_NORTH_STAR_EXPERIENCE_ARCHITECTURE.md`, 2026-07-20) made every room begin at the top of the browser inside one shell, with one orchard rendered at each room's governed exposure. The house, for the first time, *is* one house.

What no governing document then answered, in one place, was the question that arrives next: **how does one constant house stay alive across years of a household's life?** The canon answers it piecemeal and emphatically — the one-morning law, the one-season law, data-borne Living Details, the Companion's sole voice of interpretation — but three gaps remained:

1. **The synthesis was unowned.** "The house holds still; the life moves" is executed everywhere (Stories, seasonal highlights, the re-aimed primary action, the Living Details constitution) and stated as one governing principle nowhere. An unowned synthesis is re-derived — or eroded — one reasonable exception at a time (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` on unrecorded reasoning).
2. **Household traditions and celebrations have no owner at all.** Today THA holds: an *observed* "family traditions" story type (`shared/stories/types.ts` — "Friday became pizza night"), a device-local diary countdown widget in `localStorage` with no owner, and nothing else. There is no way for a household to *declare* what they celebrate, and no law preventing a future feature from *assuming* it — shipping a default Christmas to a household that does not keep one.
3. **The pressure to "make the home seasonal" will recur.** `NORTH2` § 3.5 rejected time-of-day atmosphere; `EXP5` § 5.3 and `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 11 record seasonal dressing as *considered and declined*. Those refusals live in three documents and an investigation. This document collects the standing answer — the lawful way the home *does* evolve — so the next proposal has a governing document to read instead of a precedent to rediscover.

---

## 2. Position in governance

### 2.1 Layer and subordination

This is a **Layer 2 Experience Architecture document** under the three-layer model (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1). It is:

- **Subordinate to** `THA_EXPERIENCE_ARCHITECTURE.md` — behaviour prevails in every conflict of rule — and, through it, to the Governing Experience Architecture and the Brand Constitution.
- **Subordinate to** `THA_EXPERIENCE_BLUEPRINT.md` on every question of the place: the one home, the one orchard, the Exposure Scale, the one sun, the Living Details constitution are the Blueprint's, and this document cites them without exception.
- A **non-overriding sibling** of `THA_UI_ARCHITECTURE.md` (the look), `THA_EXPERIENCE_LANGUAGE.md` (the feeling), `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (the design character), and `THA_KEPT_ROOM_TRANSLATION.md` (the translation).
- **Bound by** `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18) for every clock, date, and season input, and by the Intelligence Governance canon (`THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `COMP_AUTH1`, `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`, `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`) for every word the Companion speaks about the matters governed here.

On any question of *rule* owned below or beside it, the rule's owner prevails and this document is corrected — the same two-axis position the Brand Constitution and the Experience Constitution hold (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.3).

### 2.2 What this document owns — exactly, and nothing else

Following the canon's pattern (`THA_EXPERIENCE_BLUEPRINT.md` § 2.2), this document is the canonical owner of exactly:

1. **The Living Home Principle** — *the house holds still; the life moves* — as a named, governing synthesis (§ 3).
2. **The lawful shape of the home's evolution** — the collected, one-place statement of how season and time-of-day are expressed through the household's life and never the house's light or calendar (§ 5, § 6). Every underlying rule is cited to its owner; what is owned here is the *assembled answer*.
3. **The Household Traditions & Celebrations domain** — its principles, its participation model, its declared (not built) data shape, and rules **LH1–LH11** (§ 7). This is the document's one genuinely new domain, and nothing else in the canon owns it.
4. **The future Household → Traditions & Celebrations settings experience definition** (§ 8) — what that surface must and must never be, ahead of any implementation.
5. **The Living Home asset governance synthesis** (§ 10) — which existing owners govern the home's environmental assets, and the standing verdicts on the known open items.

And it deliberately owns **nothing else**: no behaviour rule, no visual value, no token, no colour, no component, no route, no capability, no string, no feeling, no gate that duplicates an existing gate. Where a concern named in this document later earns a fuller governing home, this document yields ownership in the same change and cites the new owner.

### 2.3 Restate-no-rule

Restating a rule creates a second owner of it, which the architecture forbids (`ARCHITECTURE_PRINCIPLES.md` Principle 2). Throughout this document, statements of already-owned law are **citations**, marked as such; any sentence later found to duplicate an owned rule is a defect in this document and is corrected to a citation.

---

## 3. The Living Home Principle

### 3.1 One canonical home

There is exactly one Home and it has no rival (**GEA5**, cited). The application shell is the walls of one house; every room begins at the top of the browser inside it (`EXP1_NORTH_STAR_EXPERIENCE_ARCHITECTURE.md` § 1, cited); the geography must stay still (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 4.1, cited). The Living Home adds one clause of reasoning to this, at the altitude this document owns:

> **Constancy is the feature.** A household under load — a new baby, a diagnosis, a hard year — is served by the one place that does not change under them. The home's stillness is not the absence of design effort; it is its product. Any proposal that makes the house itself move must first name what it is spending: the household loses the one place that does not change (the cost `NORTH2` § 3.5 required be named, cited).

### 3.2 One canonical orchard

There is one orchard: one canonical environment, one owner, one season — perpetual bright morning, in leaf, tended (`THA_EXPERIENCE_BLUEPRINT.md` § 6.1, cited). The orchard is a permanent fact of the site; a room at E0 is shuttered, not relocated (**GEA6**, cited). What differs between rooms is *how much* orchard, never *which* orchard (Blueprint § 6.1, cited).

### 3.3 What "living" means here

The Living Home is alive in exactly three lawful ways, each with a named owner, and in no other way:

| The life that moves | What the household perceives | Owner of the mechanism |
|---|---|---|
| **The household's food, in season** | Seasonal produce, seasonal stories, what belongs on the table this month | Season rule `shared/seasonal/season-rule.ts` (Domain 11) · Stories engine · Notice Engine `seasonal-highlight` |
| **The household's day** | The greeting's word, the door most worth opening now, the Companion's timing | Household Time (`shared/time/household-time.ts`, HT13/HT14) · the resolver's doors · INT21's words |
| **The household's own occasions** | The traditions and celebrations they have declared, honoured the way they chose | **This document, § 7** — the one new domain |

Everything in that table is **data-borne** — it renders something true from a canonical owner or it renders nothing (`THA_EXPERIENCE_BLUEPRINT.md` § 12.1, Living Details rule 2, cited). "Calm must never become lifeless" (`THA_EXPERIENCE_LANGUAGE.md` § 3A.4, cited) — and the canon's answer to lifelessness is *more of the household's true life shown*, never applied charm.

---

## 4. Rooms are viewpoints, not environments

A room in THA is a viewpoint on the one home: the same walls, the same sun, the same orchard, seen from a different purpose. This is already the law, assembled here from its owners:

- The map of the house and each room's identity: `THA_EXPERIENCE_BLUEPRINT.md` § 5.1 (cited). The per-room design reading: `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 13 (cited).
- How much orchard each room admits is a **governed per-domain constant** on the Exposure Scale E0–E3 (Blueprint § 6.2, cited), realised by the North Star shell (EXP1 § 1.1/§ 7, cited): Home E3 · Cookbook/Pantry/Nutrition/Diary/Orchard E2 · Planner/Shopping/Analyser/Household E1 · Admin E0.
- A room may not fork the house — no room owns its own shell, header, nav, palette, or theme (**GEA19**, cited). Rooms are differentiated by purpose, light, material, and at most one sign of life — never by their own architecture (Blueprint § 4, cited). The room you are in is shown by light, not fill (`UX_NAV1`, implementation of Blueprint § 7, cited).

**The standing verdict this document collects:** per-room *distinct environments* (a pantry scene, a greenhouse, a village) were evaluated and refused at North Star implementation, and remain a **future governed admission only** — new canonical assets plus a Blueprint amendment, never shipped by taste (EXP1 § 1.1/§ 8.1, cited; § 10 below). Until that admission happens, every room's environment band *is* the one orchard at the room's exposure, and any surface that quietly ships its own environment is a defect regardless of its quality (`THA_UI_ARCHITECTURE.md` § 17, cited).

---

## 5. Seasonal evolution — the household's seasons, never the house's

### 5.1 The law, assembled

The house and the orchard have **one season**, and this is a deliberate design decision, not an unfinished one (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 11; the rule is `THA_EXPERIENCE_BLUEPRINT.md` § 6.0/§ 6.1 — both cited). Seasonal dressing — autumn leaves in October, snow in December, blossom in April — was considered and declined (`EXP5` § 5.3, recorded in OHDB § 11, cited): it is temporary, fashionable charm that dates the product to a moment (`OHDB` § 14, cited), and it breaks the one-season law by construction.

### 5.2 How the home's seasons actually live

Seasonal evolution in the Living Home is the **household's** seasonal life, shown truthfully:

1. **The season itself is a fact with one owner** — `shared/seasonal/season-rule.ts` (Domain 11), the single season rule, whose *input* Household Time supplies and whose *answer* nothing else may derive (**HT17**, cited). No surface, story, or prompt computes its own season.
2. **What is in season reaches the household as food, words, and doors** — the seasonal pantry surface (`GET /api/pantry/seasonal`, Domain 11), the `seasonal-highlight` notice category (Notice Engine § 2.2, cited — under the Silence Rules, capped and deduplicated like every other notice), and the Stories engine's observed `seasonal_habits` ("Summer became: tomatoes, basil, courgettes").
3. **The table changes; the room does not.** A cookbook that surfaces plums in August is the Living Home working. A cookbook that turns amber in August is the theme park. The boundary is the Living Details constitution (Blueprint § 12.1, cited): data-borne or dead, one per domain, still, honest in absence.

**Rule of thumb this document records for future proposals:** if a "seasonal" change would still be visible to a household whose planner, pantry, and diary were empty, it is dressing the *house* and is refused; if it disappears when the household's data disappears, it is showing the *life* and may proceed through the ordinary gates.

---

## 6. Time-of-day atmosphere — words and doors, never light

### 6.1 The law, assembled

One sun, one direction, one hour; every room in this house is a morning room (`THA_EXPERIENCE_BLUEPRINT.md` § 7, cited). No evening theme, no night mode as atmosphere, no dimmed dinner-hour palette — that is the second sun: **STOP** (`THA_KEPT_ROOM_TRANSLATION.md` § 4.3 *Morning Rhythm*, cited; Blueprint § 16, cited). An atmosphere that varies by hour *is* a theme (`NORTH2` § 3.5, standing rejection, cited). Light never encodes time (**GEA10**, cited). Time aims **words and doors, never light** (**HT13**, cited).

### 6.2 How the home's hours actually live

Time-of-day atmosphere in the Living Home is the household's day made effortless, carried entirely by data:

1. **Words** — the greeting knows the phase of the household's day (`householdPhase`, T3, via `households.timeZone` — Household Time § 4.3, cited), and the Companion's words are produced by their owners (INT21; the Behaviour Engine), never templated from a clock (**HT15**, cited).
2. **Doors** — the one primary action is re-aimed by relevance across the day: look at the week in the morning, start dinner at the dinner hour — *same house, different door* (Kept Room Translation § 4.3, cited; Experience Principle 4, cited).
3. **Timing** — a time-shaped occasion is a **trigger**; the Notice Engine alone decides whether anything is said, and silence stays first-class (**HT14**, cited; Notice Engine § 6, cited).

The atmosphere of evening in THA is that the *work offered* is evening's work — while the light stays morning ("Quieter is never darker here" — `THA_ORCHARD_LIVING_BOOK.md`, *Evening In The Orchard*, cited). This is the whole of the Living Home's time-of-day model; nothing further is planned or permitted without amendment of the owners cited above.

---

## 7. Household Traditions & Celebrations — the new domain

This is the one place this document legislates rather than assembles. Nothing in the canon owns household-declared occasions; today's nearest artefacts are an *observed* story type and an unowned `localStorage` countdown widget (§ 1). The domain is defined here and **DECLARED, NOT BUILT** — the order `CANONICAL_PUBLICATION_ARCHITECTURE.md`'s transition rules require, and the precedent `TIME3` set: the law first, so nothing rival grows while the owner is built.

### 7.1 The principles

**A tradition is a household fact.** What a family celebrates — and whether they celebrate at all — belongs to the household the way their allergies and their time zone do: authored by them, owned in one place, never inferred, never assumed, never disclosed beyond its purpose.

**THA is a guest at the household's table, not the host of its calendar.** THA ships **no** calendar of occasions. There is no default Christmas, no assumed Eid, no pre-ticked birthdays, no "users like you celebrate…". A household that declares nothing experiences nothing — and that absence is honest and complete, not a nagging empty state.

**Participation is chosen, per tradition, by the household.** For each occasion a household declares, they also choose *how THA participates* — from a closed ladder (§ 7.3) whose quietest rung is the default. THA never escalates its own participation.

### 7.2 The rules — LH1–LH11

- **LH1 — Declared, never assumed.** The set of a household's traditions and celebrations is authored by the household, is empty by default, and is never seeded, suggested from demographics, or inferred from any data. There is no platform occasion calendar.
- **LH2 — Participation is chosen per tradition, from a closed ladder, quietest by default.** (§ 7.3.) THA may participate less than the chosen level (silence is always lawful — GEA15, cited) and never more.
- **LH3 — A tradition never changes the house.** No dressing, no theme, no palette, no motion, no environment change, for any occasion, at any participation level. A tradition's whole expression is **words** (the Companion's), **doors** (what is aimed), and **food** (what is suggested) — the one-morning and one-season laws (Blueprint § 7/§ 6.1, cited) admit no occasion exception, and the shell's constancy earns no seasonal-moment exception (`THA_EXPERIENCE_LANGUAGE.md` § 5, cited).
- **LH4 — No celebration theatre.** No confetti, effects, badges, streaks of kept traditions, or celebration-for-ordinary-use (**GEA13**, cited; Experience Language delight principle, cited). Acknowledgement is quiet words at a genuine moment, voiced by the Companion.
- **LH5 — Observed rhythms are not declared traditions.** The Stories engine's `family_traditions`/`seasonal_habits` are the Companion's *interpretation* of patterns (GEA22, cited) and may never auto-promote into the declared set. Promotion is the household's explicit act (**GEA23**, cited): the Companion may say *"Friday seems to have become pizza night — is that one of yours?"*; only the household's answer writes the fact. Rooms may display the declared set (a room observes the way a window observes — GEA § 7.4.2, cited); only the Companion interprets it.
- **LH6 — One owner, household grain.** A tradition is household-scoped (one shared home, one shared table — the same grain reasoning as Domain 16 and Domain 37, cited). Declared before implementation in the Source of Truth Register (owner, variant, publication path) per the CPuBA transition rule; no parallel store; the diary countdown widget is a named predecessor to converge or retire at build time (retire-on-introduction, cited).
- **LH7 — Special-category care, from day one.** A declared occasion can reveal religion or belief (Eid, Passover, Diwali, Christmas) — special category data under Article 9, exactly like the health data THA already holds by design (`THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md`, cited). The domain enters the personal data registry (Domain 35 — export *and* erasure, one owner, two verbs) **in the same change that creates its table**, is used for nothing but the participation the household chose, is never an input to commerce, analytics, or any model training, and is never visible outside the household.
- **LH8 — Dates are CIVIL and resolve on read.** An occasion's date is calendar-shaped by nature (it would change meaning if the household moved to Tokyo — the CIVIL test, cited); it resolves through Household Time (**HT1–HT13**, cited), recurrence is computed at read time, and no scheduler is created (**HT14**, cited; the BUS2A expire-on-read precedent, cited).
- **LH9 — Time-shaped triggers, one mouth.** A tradition surfaces only as a notice through the Notice Engine's Silence Rules or as Companion conversation grounded through a Context View composed by INT17 (**HT15**, cited). No room banner, no interstitial, no second channel. An unobserved tradition is never an error, a reminder-nag, or a guilt surface — THA does not grade the household (**GEA13**, cited).
- **LH10 — The Companion never invents an occasion.** It speaks only from the declared set or from clearly-labelled observed rhythms, with evidence; it may change how a true occasion is spoken of and when — never what the household's calendar contains (`THA_COMPANION_PLATFORM_ARCHITECTURE.md` § 0 invariant, cited).
- **LH11 — Leaving is one act.** A household deletes a tradition — or the whole set — as easily as it was declared, and deletion is genuine (append-only consent reasoning notwithstanding, the *fact* is erased; only the fact that a consent existed follows the Trust & Compliance ledger rules, cited). No retention "in case", no soft-delete that outlives the household's decision.

### 7.3 The participation ladder

A closed vocabulary, one value per declared tradition, chosen by the household. Quietest is the default. (The names below are this document's; the eventual settings surface may rename them through the ordinary language gates, but the *rungs* — their count and meaning — are governed here.)

| Rung | Name | What THA does |
|---|---|---|
| 0 | **Private** *(default)* | THA records the tradition and does nothing with it. It exists so the household controls their own record; no word, no door, no suggestion. |
| 1 | **Aware** | The Companion may acknowledge the occasion in words, near it, once — under the Silence Rules. Nothing else changes. |
| 2 | **At the table** | Aware, plus the food may participate: the Planner and Cookbook doors may be aimed toward it ("the door most worth opening"), and suggestions may take it into account — composed from existing capabilities, never a new engine. |

There is no rung at which the house changes (LH3), no rung with effects (LH4), and no rung THA selects for the household (LH2).

### 7.4 The declared data shape (not built)

For the future Source of Truth Register declaration — recorded here so the domain arrives whole, and binding on whoever builds it:

- **Owner:** a `household_traditions` table (Variant 3, database-owned), household-grained (`household_id`, no `user_id` — the Domain 37 lesson, cited), one row per declared tradition.
- **Facts per row (indicative, finalised at declaration):** name (the household's own words) · date or recurrence rule (CIVIL, resolved on read — LH8) · participation rung (LH2/§ 7.3) · optional free-text note. **No** category taxonomy of religions or festival types is shipped: THA does not need to know *what kind* of occasion it is to keep the household's word about it — a taxonomy would be an inference surface LH1 exists to prevent.
- **Write funnel:** one, through the future settings surface (§ 8) and the household's explicit confirmation of a Companion question (LH5). No import, no sync, no bulk seed.
- **Erasure/export:** registered in the personal data registry in the same change (LH7).
- **Nothing derived is stored** (HT3, cited): "days until", "next occurrence", and "was acknowledged this year" are read-time derivations, never columns.

---

## 8. The future Household → Traditions & Celebrations settings

Not built, and not to be built until the domain above is declared in the Register. When it is built, this section governs its experience ahead of any design:

1. **Where it lives:** inside the Household realm (today `profile-page.tsx`'s Household section; tomorrow whatever the Household room becomes) — it is a household fact beside the household's other facts, not a feature room, not a new realm, and it adds no navigation (**GEA19**, the shell is constant, cited).
2. **What it is:** a quiet family record — the household's own list, in their own words, with each tradition's participation rung beside it. It reads like the family record the Household room already is (`OHDB` § 13, cited), not like a calendar product.
3. **What it must never be:** a calendar grid to fill, a completion meter, a suggestion feed of occasions, an onboarding step, or a prompt-on-arrival. An empty list is a complete, honest state — "honest in absence" (Blueprint § 12.1, cited) — and THA never asks twice.
4. **Gates:** as a user-facing surface it passes the full stack in order — Experience Constitution Check before design, Experience Test, UX/UI checklists, Experience Review Questions, Blueprint Checks, Design Character Check, Intelligence Language Check where the Companion speaks, Adoption Register (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.1, cited).
5. **Convergence obligation:** the diary's `localStorage` countdown widget (`tha_diary_countdowns`) is the named predecessor. At build time it is converged into the declared domain or explicitly retired with the household's data honoured — never left as a rival store (Register Rule 3, cited).

---

## 9. Companion integration

The Companion is the person in the house — one presence, one fixed chair, in every room (Blueprint § 13, cited). Its place in the Living Home is exactly its place everywhere else, applied:

- **The rooms observe. The Companion understands. The household decides** (GEA21–GEA23, cited). Rooms may *show* the declared traditions (a fact, in the family record); only the Companion may say what a season, an hour, or an approaching occasion *means*; only the household decides what is celebrated and how.
- **Authority:** the page sets the subject; the effective identity sets the permissions (`COMP_AUTH1`, cited). A room's viewpoint never widens what the Companion may reach.
- **Grounding:** every byte the model reads about seasons, phases, or traditions arrives through a Context View composed by INT17 under budget (**HT15**, INT17 § 0, cited) — never templated into a prompt.
- **Voice and occasion:** which already-true fact is surfaced, and when, is the Notice Engine's under its Silence Rules; how it is said is the Behaviour Engine's in the household's chosen personality; what is true is neither's to change (CPA1 § 0 invariant, cited). Tradition-shaped notices ride the existing engine — if a dedicated category beyond `seasonal-highlight` is needed at build time, it is admitted by governed amendment of the Notice Engine's closed vocabulary, not invented beside it.
- **Restraint is the credibility budget:** the Companion's licence to mention a family's occasion at all is built out of every occasion it stayed quiet (**GEA15**, cited). Prefer silence over weak festivity.

---

## 10. Asset ownership and governance

The Living Home introduces **no** asset and no visual value. It records the standing governance so the next asset decision has one place to read:

1. **One orchard, one owner.** The orchard environment is a governed visual concern with one canonical owner (`components/layout/orchard-backdrop.tsx`, registered as the `orchard-environment` concern — Blueprint § 6.1/§ 18, Adoption Register, cited). The Exposure Scale values are governed tokens (UIA § 16, cited).
2. **Known open item, inherited not closed:** the two orchard assets (arrival `/orchard-bg.webp` vs rooms `/orchard.webp`) must converge to one canonical asset (EXP1 § 8, cited). This document adds no deadline and takes no side; it records that until convergence, neither asset may gain a third sibling.
3. **Any future environment asset** — a per-room view, a refined orchard — enters only by the fixed path: named concern → conflict check → governed Blueprint amendment → tokens by admission → predecessor retired in the same change → register entry (Blueprint § 2.4, UIA § 17, cited). Anything visual that ships without admission is a defect regardless of its quality (UIA § 17, cited).
4. **No tradition ever carries an asset.** LH3 stated as asset law: the Traditions & Celebrations domain owns words and dates, never imagery, iconography, or decoration. There is no lawful future in which a declared occasion admits a themed asset — that future would require amending the one-season law itself, which this document does not propose and records as the cost any such proposal must name (`NORTH2` § 3.5 pattern, cited).
5. **Graded-surface ceiling:** any atmosphere-adjacent asset work respects the declared-ceiling rule for graded surfaces carrying no text (UIA § 15, cited) — ambience cannot be turned up later by taste.

---

## 11. Implementation roadmap

All phases are future work; **this document ships none of them.** Each phase is a separate governed act with its own rollback identifier, gates, and report. Order matters — the law is already in force (Phase 0), so nothing rival can grow while the owner is built (the TIME3 precedent).

| Phase | Scope | Gate it must clear first |
|---|---|---|
| **0 — Law (this document)** | Governing architecture in force; README indexed. **Complete on merge.** | — |
| **1 — Domain declaration** | `household_traditions` row in the Source of Truth Register (owner, Variant 3, publication path, write funnel), personal-data-registry entry drafted in the same declaration (LH7). Still no code. | Register amendment review |
| **2 — Owner built** | Table + migration + storage funnel + read-time resolution (LH8) + export/erasure wired (LH7). No UI, no Companion. | Phase 1; schema review; `verify:publication` |
| **3 — Settings surface** | Household → Traditions & Celebrations per § 8; countdown-widget convergence/retirement decision executed. | Phase 2; full experience gate stack (§ 8.4) |
| **4 — Companion participation** | Rung 1 (*Aware*): Context View for the declared set (INT17), notice route under the Silence Rules; Notice Engine category amendment if needed. | Phase 3; AI Architecture Compliance; Intelligence Language Check |
| **5 — At the table** | Rung 2: planner/cookbook door-aiming composed from existing capabilities. | Phase 4; capability governance (no new engine) |

Deliberately **not** phased, because it is refused rather than deferred: house/orchard seasonal dressing; time-of-day lighting; celebration effects; a shipped occasion calendar; per-member tradition grains; community sharing of traditions (would cross the Domain 37 boundary and inherits that document's recorded disagreement).

---

## 12. Future recommendations

1. **Two-orchard convergence** (§ 10.2) remains the highest-value asset task in the house and should precede any per-room environment ambition.
2. **Per-room environments**, if ever pursued, should be proposed as one governed admission (Blueprint amendment + canonical assets) covering all rooms at once — nine separate taste decisions would produce nine houses (EXP1 § 8.1 reasoning, cited).
3. **Foreign-zone occasions** (a tradition kept on another country's calendar, e.g. a festival dated by a relative's time zone) fit the CIVIL (foreign zone) category Household Time § 7 names but does not build; if wanted, extend at the Household Time owner, never locally.
4. **Observed-rhythm promotion** (LH5's Companion question) is the most natural Phase 4+ enhancement and the one most worth doing well: it is the Living Home's whole philosophy in one interaction — the house noticed, the household decided.
5. **A "quiet year" affordance** — one household-level switch that sets every tradition to *Private* for a period (bereavement, hard times) — should be considered at Phase 3. A home that can go quiet for a grieving family without ceremony is the Household First Principle applied where it matters most.

---

## 13. Compliance

### Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: One home, one orchard, one Companion — reaffirmed by citation; the new
  domain has one owner (household_traditions, declared not built).
☑ One owner per fact
  Explain: Every owned rule cited to its owner (§ 2.3); the only new facts
  (declared traditions) get exactly one owner at Phase 1/2.
☑ No duplicate entities
  Explain: No entity created. The localStorage countdown widget is named as a
  predecessor to converge/retire at build time (LH6, § 8.5).
☑ No duplicate ownership
  Explain: § 2.2 lists exactly what this document owns; everything else is
  citation, with a yield clause.
☑ No duplicate state
  Explain: No state created; HT3 applied to the declared shape (§ 7.4 — nothing
  derived is stored).
☑ Extends existing architecture
  Explain: Extends the North Star + Experience canon downward; invents no rival
  layer; new rules only where no owner exists (LH1–LH11).
☑ Progressive enrichment where appropriate
  Explain: Five-phase roadmap, each additive, quietest-first participation ladder.
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; Product Knowledge Registry impact is nil
  until a user-facing phase ships (recorded in Definition of Done).
☑ Honest gaps over fabricated information
  Explain: Empty tradition set is a complete honest state (LH1, § 8.3); the
  Companion never invents an occasion (LH10).
☑ No permanent synchronisation bridge
  Explain: None created; recurrence resolves on read (LH8), no scheduler (HT14).
☑ Evolution over replacement
  Explain: Nothing retired by this document; future retirements (countdown
  widget) named with their phase.

If any item cannot be checked, implementation must stop and explain why.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

For every AI-related implementation confirm:

✓ Uses the canonical Intelligence Platform (all Companion participation rides the existing spine — § 9)
✓ Uses the Capability Registry (Phase 4/5 compose registered capabilities only; none registered by this document)
✓ Uses the Intent Engine (no bypass path defined; tradition questions route as ordinary intents)
✓ Reuses existing business services (door-aiming composes existing planner/cookbook services — Phase 5)
✓ Does not create another assistant (one Companion, one chair — § 9)
✓ Does not duplicate conversation state (nothing conversational stored in the declared shape — § 7.4)
✓ Uses registered capabilities only (any new Notice category enters by governed amendment — § 9)
✓ Uses permission-aware access (COMP_AUTH1 effective identity; traditions never visible outside the household — LH7)
✓ Produces honest gaps rather than fabricated knowledge (LH10; silence first-class — LH9)

If any check fails: STOP. Explain why. Do not continue.
```

### Definition of Done

- **What success looks like:** this document exists at `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, is indexed in `docs/architecture/README.md`, states the Living Home Principle and LH1–LH11, and is committed and pushed with the rollback identifier reported. The one-morning and one-season laws are byte-untouched in their owners.
- **What must not break:** nothing runtime — this change touches documentation and session files only; no code, schema, token, asset, string, route, capability, or test changes.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only `docs/` and `.engineering/session/` paths; the README index resolves; `.engineering/scripts/repo-structure-verify.sh` reports no *new* failures attributable to this change.
- **Product Registry impact:** none now (no user-facing surface ships); Phases 3–5 each carry their own Product Registry Impact section when they ship.

### Data Impact

- **Reads existing data:** NO (document only).
- **Writes new data:** NO. (Declares a future `household_traditions` owner — created at Phase 2, not now.)
- **Changes meaning of existing data:** NO. (Notably: the Stories engine's `family_traditions` type is explicitly *not* redefined — LH5 fixes its meaning as observation, unchanged.)
- **Requires backfill:** NO — and the declared domain forbids seeding by construction (LH1).

### Trust Check

- **Could this mislead the user?** No runtime change. The document's one mislead-risk is a future one, named and closed: a Companion that assumed or invented occasions would speak falsehoods about a family's own life — forbidden by LH1/LH10 before any code exists.
- **Could this fabricate certainty?** No. The declared domain's honest state is emptiness; nothing derived is stored; observed rhythms are labelled as interpretation, never promoted silently (LH5).
- **Is anything guessed but shown as real?** No. This is the domain's founding rule (LH1 — declared, never assumed).
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment. For the future domain: a wrongly-surfaced occasion is a notice under the Silence Rules — capped, quiet, and traceable to a household-authored row, never to an inference.
- **Special-category exposure:** named rather than discovered later — declared occasions can reveal religion or belief (Article 9); LH7 binds registry entry, purpose limitation, and non-disclosure into the same change that creates the table.
- **No architectural duplication introduced:** YES.
- **No new source of truth created:** YES (one declared for the future, created nowhere).
- **No runtime behaviour altered (governance-only work):** YES.

### Rollback Plan

- **Rollback identifier:** `rollback/LIVINGHOME1-living-home-architecture-20260720` → `1fe5e62c` (annotated tag).
- **Files modified:** `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (new) · `docs/architecture/README.md` (index entry) · `.engineering/session/CURRENT.md` (session row) · `.engineering/session/runs/LIVINGHOME1_Living_Home_Experience_Architecture.md` (session record).
- **Rollback commands:**
  ```
  git checkout rollback/LIVINGHOME1-living-home-architecture-20260720 -- docs/architecture/README.md .engineering/session/CURRENT.md
  git rm docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md
  git rm .engineering/session/runs/LIVINGHOME1_Living_Home_Experience_Architecture.md
  git commit -m "Rollback LIVINGHOME1"
  ```
- **Verification after rollback:** `git diff rollback/LIVINGHOME1-living-home-architecture-20260720 -- docs/ .engineering/` is empty; no runtime surface existed to verify.

### Scope Lock

- **Implemented scope:** this governing document; its README index entry; the session record. Nothing else.
- **Explicitly excluded:** all code, schema, migrations, tokens, assets, strings, routes, capabilities, notice categories, settings UI, Stories changes, Register rows (Phase 1 is a separate act), and any amendment to the one-morning law, the one-season law, the Exposure Scale, or any cited owner — every one of which is byte-untouched.
- **Suggestions recorded, not taken:** the five future recommendations (§ 12).

### Manual Verification

Performed for this change (documentation-only):

1. `git status` confirmed clean before work apart from the session heartbeat; rollback tag created and verified to resolve to `1fe5e62c` **before** any file was written.
2. `git diff --stat` at commit time confirmed the change touches only the four files named in the Rollback Plan.
3. The README index entry was verified to link to this file's exact path.
4. `.engineering/scripts/repo-structure-verify.sh` run; result recorded in the completion report (pre-existing failures, if any, are not claimed to pass and none are introduced by these paths, which live in sanctioned locations per `REPOSITORY_CONVENTIONS.md` § 3).
5. No build, typecheck, or test surface is affected; none is claimed to have been re-run for this change beyond confirming the diff contains no code path.

### User Acceptance Evidence

- **State: Waiting for User.** This is a governing-law deliverable; acceptance is the owner's review of this document — there is no household-facing surface to evidence, and none is claimed.
- Evidence available for that review: this document; the session record at `.engineering/session/runs/LIVINGHOME1_Living_Home_Experience_Architecture.md` (including the three governing-canon research briefs' key findings and the conflicts they surfaced); and the standing refusals this document collects rather than overrides (`NORTH2` § 3.5, `EXP5` § 5.3, `OHDB` § 11).
- The owner decision this document makes explicit rather than assumes: **"seasonal evolution" and "time-of-day atmosphere" are delivered as the household's life (data, words, doors) and not as the house's light or calendar.** If the owner intends the *house itself* to change visually with seasons or hours, that is an amendment to `THA_EXPERIENCE_BLUEPRINT.md` § 6.1/§ 7 — a reversal of the canon's most-cited law — and per the Architecture Bootstrap this document STOPS at recording the conflict and the cost, and does not propose it.

---

*The Healthy Apples is a modern home in an ancient orchard. The orchard keeps its one bright morning so that every season of the household's life — the loud years, the quiet ones, the ones they choose to celebrate and the ones they need to pass in peace — has somewhere unchanging to come home to.*
