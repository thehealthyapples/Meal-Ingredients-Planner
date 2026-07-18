# HOME1 — Arrival Behaviour Investigation

## Is the THA Home room an Arrival room containing an ambient Household Display?

**Status:** INVESTIGATION — point-in-time analysis and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation. It creates no rule, no principle, and no second owner (Experience Blueprint § 18; Architecture Principle 2; Experience Principle 6). **It amends nothing.**
**Classification:** Experience Governance (investigation)
**Date:** 2026-07-16 (HOME1)
**Rollback ID:** `rollback/HOME1-arrival-behaviour-investigation-20260716` → `7d1dd2ce`
**Hypothesis under test:** *"The THA Home room is not a dashboard. It is the household's Arrival room, containing an ambient Household Display similar in behavioural philosophy to devices such as Apple Home, Google Nest Hub and Amazon Echo Show, while remaining fully compliant with the Orchard House philosophy."*
**Reviewed against:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**Prior work read:** [`NORTH1`](../../implementation/ux/NORTH1_THE_VISUAL_NORTH_STAR.md) · [`NORTH2`](./NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md) · [`EXPCOMP1`](./EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md)
**No Home redesigned, no UI implemented, no architecture modified, no experience principle created.**

---

## 1. THE HEADLINE FINDING

**The hypothesis is two claims wearing one sentence, and they have opposite verdicts.**

> **"Home is the household's Arrival room" — TRUE, and already law in four documents. Nothing to adopt.**
>
> **"Home contains an ambient Household Display" — REFUSED. It conflicts with the two-second rule, the mandatory Experience Test, and Experience Principle 4 — and adopting it would convert Home's most valuable pending fix into a design intent.**

The Arrival half is not a discovery and not a better interpretation. It is a **restatement**. Home is already named *"the threshold and the heart"* in the map of the house (Blueprint § 5.1; OHDB § 13.1), already required to be *"the emotional place where the household arrives"* (Experience Language Principle G), already governed by *arrival before work* (Principle C), and its job is already fixed as *"arrive and be oriented, then step through the one right door for the hour"* (DESIGN1 § 0.1, cited by NORTH1 § 5.4). Every word of the Arrival half is owned. Writing it again would create the second owner Blueprint § 18 forbids.

The Display half is where the investigation earns its keep, and the finding is a warning rather than a proposal:

> **An ambient display is, by construction, a surface with no door.** Apple Home, Nest Hub and Echo Show are *destinations* — always-on surfaces designed to be looked at. THA's Home is a *threshold* — a surface designed to be **passed through**. The seven behavioural characteristics the mission asks me to extract are real, and THA already requires every one of them. But they are the **shared symptoms of any calm surface**, not evidence of a shared philosophy. The purposes are opposite, and the opposition is precisely at the point THA cannot afford to lose.

**And the trap is live.** NORTH1 § 8.3 found that **Home currently has no primary action** — three equal-weight card links and not one `<Button>` on the page (`client/src/pages/home-experience-page.tsx:179-397`). EXPCOMP1 AREA 1 names why that went unnoticed through the entire visual programme: *"absence of a primary action looks exactly like restraint."* The Household Display hypothesis is the most persuasive intellectual justification that defect could ever be given. Adopting it would not add a principle to THA — it would **retire Experience Principle 4 at Home** and call the retirement calm.

**Recommendation: adopt nothing, amend nothing, and fix the door.** The canon predicted this surface correctly before the hypothesis was framed. As NORTH2 § 6 concluded of NORTH1's findings: the architecture *"does not need refining — it needs obeying."*

---

## 2. THE TEST APPLIED

This investigation uses the gate NORTH2 § 2 established and EXPCOMP1 § 4.3 made binding on an AI assessor:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms (Blueprint § 18; OHDB § 16.3; TRANSLATION1 § 7.3; Experience Principle 6).

> **"An AI agent has one extra obligation, and it is the one it will most want to skip: *do not infer a rule.* If an area's owner does not say the thing you are about to grade against, **you are inventing a principle**... **Cite, or do not grade.** Where the canon is silent, record silence as a gap — never fill it."** (EXPCOMP1 § 4.3)

Two consequences bind everything below. First, a behavioural characteristic that the canon already requires is **cited, never re-coined** — however much more intuitive the new name is. Second, where the canon is genuinely silent (§ 8), the silence is **recorded**, not filled.

---

## 3. THE BEHAVIOURAL EXTRACTION — WHAT AMBIENT DISPLAYS ACTUALLY DO

Per the mission, visual design is out of scope entirely. What follows is the **behavioural philosophy** of the household-display category — the posture these devices adopt toward a person's attention.

### 3.1 The category's behavioural characteristics

| Behaviour | What the device does |
|---|---|
| **Ambient information** | Information is *present* rather than *delivered*. It is available to a glance and costs nothing to ignore. |
| **Glanceability** | The primary reading is complete in a second or two, from across a room, without focus. |
| **Calm presence** | The resting state is quiet. The device does not compete for attention it has not earned. |
| **Always useful** | There is no "empty" mode that is useless — at minimum it is a clock. It never has nothing to offer. |
| **Non-demanding interaction** | Nothing must be done. The device is complete if never touched; interaction is optional and always initiated by the person. |
| **Today's household context** | The subject matter is *now* and *this household* — this hour, this day, these people — never history, analysis, or configuration. |
| **Low cognitive load** | Few facts, large, unranked-but-uncluttered. Nothing to parse, hold, or decide. |

### 3.2 The category's defining property — the one the mission does not list

Every characteristic above is a description of how the device **spends attention**. None of them describes what the device is **for**, because the category's answer to that question is the thing that makes it a category:

> **An ambient display is a destination. Its purpose is to be present. It has nowhere to send you, and it is not trying to.**

This is not a criticism of the devices — it is their design achievement. A Nest Hub on a kitchen counter is *successful* when it is glanced at a hundred times and touched twice. Presence **is** the product. The device is always-on, shared, unauthenticated, and glanced at peripherally across a room; there is no session, no arrival, and no departure, because you never went anywhere.

### 3.3 The category's failure modes — instructive, and already forbidden

The devices are also honest about where the philosophy breaks, and THA has already legislated against every one:

| Failure mode of the category | Already forbidden by |
|---|---|
| Rotating suggestions, "try saying…", feature promotion | Experience Architecture § 11 (*serves the household's goals, not engagement metrics*), § 15 (*notify about their life, not our product*) |
| Advertising and re-engagement bait | Experience Architecture § 12 (*no dark patterns, without exception*), § 17.12 |
| Filling the display because it must never be blank | Experience Architecture § 6 (*empty is a valid, designed state*); Experience Language Principle 8; Blueprint § 12.1 rule 3 (*honest in absence*) |
| Metrics, streaks and scores as ambient wallpaper | OHDB § 13.1 (*a dashboard of metrics greeting the arrival*); EXPCOMP1 AREA 13 (*scores as trophies, streaks*) |

Nothing in this column is new information for THA. It is listed because it is the reference set's actual behavioural legacy, and because the hypothesis asks THA to take that set as a philosophical model.

---

## 4. THE OWNERSHIP TEST — SEVEN FOR SEVEN

Each behavioural characteristic, put through the § 2 gate.

| # | Characteristic | Already owned? | Owner |
|---|---|---|---|
| 1 | **Ambient information** | **Yes** | Experience Architecture § 4 — *"Home reflects; it does not demand... It is **read-only in spirit**: acting on something means moving to that thing's canonical place."* § 9 — *"The most important fact is visible without any interaction."* |
| 2 | **Glanceability** | **Yes** | UI Architecture § 5 — **the two-second rule**. Experience Architecture § 9 — *"If a person glances for two seconds and leaves, they leave correctly informed."* Named as a per-room constant in Blueprint § 5.2. |
| 3 | **Calm presence** | **Yes** | Experience Principle 3 (*calm before capability*); Experience Language § 3, § 3A.2, § 3A.4; OHDB § 4. **NORTH2 § 3.3 already refused "Presence" as a new principle** — *"the most emphatic of the four refusals"*. |
| 4 | **Always useful** | **Yes** | Experience Language § 4A Principle A (the THA Promise — *reduce effort · increase confidence · give time back*). **See § 4.1 below — this is the one that must not be adopted in the display's sense.** |
| 5 | **Non-demanding interaction** | **Yes** | Experience Principle 8 (*attention is borrowed, never taken*); Experience Architecture § 4 (*Home reflects; it does not demand*); Experience Language Principle C (*arrival before work* — *"a welcome is never combined with a workload"*). |
| 6 | **Today's household context** | **Yes** | Experience Architecture § 4 — *"Sections earn their place on Home only by answering **'how are we doing today?'**"*. Blueprint § 12.2 (the greeting is *"Clock + household name"* — data-borne). TRANSLATION1 *Morning Rhythm* § 3. |
| 7 | **Low cognitive load** | **Yes** | Experience Architecture § 16 (*"cognitive load is treated as seriously as contrast ratios"*), § 17.5 (Premium Principle 6); Experience Language Principle 3 (*one thought at a time*). |

**Seven for seven.** Not one behavioural characteristic of an ambient household display is absent from THA's governing architecture. There is nothing here to adopt, and — per EXPCOMP1 § 1.2's yield clause — a HOME1 principle restating any of them *"would be that defect on the day it was written"* (NORTH2 § 3.2).

**This is the result, not a disappointing outcome from it.** That an independent behavioural philosophy, extracted from an unrelated product category, lands entirely inside THA's existing law is the strongest available evidence that the law is describing something real.

### 4.1 The one characteristic that is owned *and* inverted — "always useful"

Characteristic 4 is the exception worth isolating, because THA and the display category agree on the words and disagree on the meaning.

- **The display's "always useful"** means *never blank*. A Nest Hub with nothing to say shows a clock, then photos. Blankness is failure, because presence is the product.
- **THA's "always useful"** means *never wasted*. Experience Architecture § 6: *"Empty is a valid, designed state."* Experience Language Principle 8: an honest empty state *"is one of the most reassuring things THA can show."* Home's own code already honours this — the Reminders section is **absent entirely** when the Notice Engine is silent, with the comment *"Silence is a first-class outcome, never padded"* (`client/src/pages/home-experience-page.tsx:174`, `:359`).

Adopted carelessly, "always useful" is the exact pressure that produces filler — and filler is forbidden by construction (Blueprint § 12.1 rule 3). **The words are shared; the rule is opposite.** This is what makes the hypothesis dangerous rather than merely redundant: it agrees with THA everywhere it is checked casually.

---

## 5. THE TWO HALVES

### 5.1 "Home is the household's Arrival room" — TRUE, and owned four times

| Claim | Owner |
|---|---|
| Home is where the household **arrives** | Experience Architecture § 4 (*"Home is where every session begins"*); Experience Language Principle 1 (*arrival before information*), Principle C (*arrival before work*) |
| Home is a **place**, not a data screen | Experience Language Principle G — *"Home is the emotional place where the household arrives... **I came home** — never **I opened my dashboard**"* |
| Home is **the threshold** | **Blueprint § 5.1** — Home's place in the house is literally *"The threshold and the heart"*. **OHDB § 13.1** repeats the reading as Home's design character |
| Home's **verb** | DESIGN1 § 0.1 (cited NORTH1 § 5.4) — *"arrive and be oriented, then step through the one right door for the hour"* |

The word the canon already uses for Home is **threshold**. "Arrival room" is a synonym for it. Introducing the synonym would put two names on one concept, which Experience Architecture § 13 forbids in terms: *"One name per concept, everywhere."*

> **Verdict: nothing to adopt. The Arrival half is already the canon's own reading of Home, in the canon's own words.**

### 5.2 "Home contains an ambient Household Display" — REFUSED

The claim has two possible readings. Both fail, for different reasons — which is why neither can be salvaged by rewording.

#### Reading A — the Display is the room's *nature* (Home is ambient)

**This conflicts, four times.**

**Conflict 1 — the two-second rule (UI Architecture § 5).** The canon's glanceability is not two-thirds of the display's glanceability; it is a strictly larger requirement:

> *"**The two-second rule.** A two-second glance at any surface must yield **three** things: what this is (orientation), how things stand (state), and **the one obvious next thing (primary action)**. If a two-second glance yields decoration, promotion, or noise instead, the surface fails."*

An ambient display yields orientation and state. It does not yield a primary action, because it does not have one. **"Glanceable ambient display" is therefore not a THA-legal decomposition of glanceability — it deletes one of the three required answers** and keeps the name.

**Conflict 2 — the mandatory Experience Test (Blueprint § 15.3).** Every screen must answer three questions before any other gate, and the third is fatal:

> *"□ 3. **What is the ONE thing this room helps them do?** One primary purpose, stated as a verb... **if there are none, it is decoration.**"*

An ambient display has no verb. That is its category definition (§ 3.2). Under THA's own mandatory test, **a room with no verb is not an ambient room — it is decoration**, and the Test instructs *"STOP, resolve it, do not continue."*

**Conflict 3 — Experience Principle 4 and § 7.** *"Every surface has exactly one obvious next thing to do."* *"A surface that cannot name its primary action is not finished being designed."* Home is a surface. The Display concept exists precisely to explain why it need not name one.

**Conflict 4 — dwell versus departure.** The deepest of the four, and the one that survives every rewording:

> **An ambient display succeeds when you look at it. THA succeeds when you stop.**

- Experience Architecture § 11: the Companion's *"success measure is 'the household ate better with less effort', **never 'the household spent more time in the product'**."*
- Experience Architecture § 17.11: *"THA has succeeded when a household **stops noticing the product** and simply eats better."*
- Blueprint § 1.5: *"**Technology should quietly disappear.** The household should always feel present."*
- Blueprint § 1.1: *"**Not a dashboard reporting to you. Not an app competing for you.** A *place*... that a household arrives in, moves through, and **leaves calmer than it came**."*

The display category's entire value proposition is presence — attention held, ambiently, forever. THA's is the opposite: attention **returned**. A threshold that succeeds is one you walk through.

**The NORTH2 precedent applies directly.** NORTH2 § 3.4 refused *"the room always remains the primary experience"* because it *"would generalise Home's E3 exception into a law"*. "Home is an ambient display" is structurally the same claim — that the ambience is the primary experience — and inherits the same refusal, with NORTH2's own disposal instruction: *"It is not a law, and as a law it would be a wrong one."*

#### Reading B — the Display is a *component* within the arrival room

The more generous reading: Home remains a threshold with a door, and *within* it sits a canonical component showing today's household context ambiently.

**This does not conflict — it is simply already owned, with nothing left over.** Decompose what such a component would govern:

| What "Household Display" would own | Actual owner |
|---|---|
| *What may appear* | Experience Architecture § 4 — *"Sections earn their place on Home only by answering 'how are we doing today?'"* |
| *How it is ordered and emphasised* | Experience Architecture § 9 (information hierarchy); UI Architecture § 5 (hierarchy, the two-second rule, emphasis budget) |
| *How it must feel* | Experience Language § 3, § 3A |
| *That it is read-only* | Experience Architecture § 4 — *"Home reflects; it does not demand"* |
| *Its one sign of life* | Blueprint § 12.2 — **Home already has exactly one Living Detail** (*the greeting in THA's hand*), and § 12.1 rule 1 is *"One per domain, maximum. Not one kind — one."* |

Every column on the right is filled. **A "canonical Household Display" would own nothing**, and a component that owns nothing but has a name is a second owner of everything it touches.

The hypothesis' honest residue in Reading B is a **heuristic** — *"would this belong on an ambient household display?"* is an intuitive way to ask § 4's *"does this answer how are we doing today?"*. That is a useful private thinking tool for a designer. It is not a principle, it is not architecture, and per EXPCOMP1 § 1.2 it must never become either.

> **Verdict: refused in both readings.** As the room's nature it conflicts four times; as a component it is owned with no remainder.

---

## 6. THE MISSION'S QUESTIONS, ANSWERED

### 6.1 Should "Dashboard" be retired in favour of "Arrival"?

**No — and the question contains a category error worth naming, because it is the reason the swap looks free.**

The three words are not competing names for one thing. They name three different kinds of thing, at three different levels:

| Word | What it names in the canon | Owner |
|---|---|---|
| **Home** | The **place**. The household's name for where they are | Experience Architecture § 4; Blueprint § 4 |
| **Arrival** | A **beat** — the first of the six-beat Experience Rhythm, which runs in *every* room and *every* journey, not only at Home | Experience Language § 5; Blueprint § 11 |
| **Dashboard** | A **room** — *"the dashboard is only the first workspace within that home"* | Experience Language Principle G; Blueprint § 4 |

Three consequences follow, each independently sufficient:

1. **The swap would break one-name-per-concept.** "Arrival" already names a beat that occurs in the Planner, the Cookbook, the Pantry and every other room (Experience Language §§ 5.1–5.9). Making it also name a room would give one word two concepts — forbidden by Experience Architecture § 13 (*"One name per concept, everywhere"*) and Experience Language Principle 11.

2. **Nothing user-facing would change, and the canon forbids the only change worth making.** Home is *already* called "Home" everywhere a household member can see: the nav label (`client/src/components/nav-bar.tsx:40`), the page heading (`home-experience-page.tsx:181`), the header logo's aria-label (`workspace-header.tsx:283`), and the greeting itself — *"Welcome Home"* (`:196`). "Arrival" appears **zero times** as a user-facing string anywhere in the product. And Blueprint § 4 closes the door explicitly: *"as the house grows, new rooms are added — **the home is never renamed**."*

3. **"Dashboard" cannot be retired without amending the two documents that depend on it.** Experience Language Principle G and Blueprint § 4 both use *the dashboard* as the load-bearing contrast that makes Home a place. Retiring the word would require rewriting the principle that protects Home from becoming one.

**But there is a genuine defect underneath the question, and it is more specific than a rename.** Two, in fact — both recorded in § 8 as findings rather than fixed here:

- **The word does double duty in the canon.** "Dashboard" is simultaneously the **anti-pattern** (Blueprint § 1.1 *"Not a dashboard reporting to you"*; OHDB § 13.1 *"a dashboard of metrics greeting the arrival"*; EXPCOMP1 AREA 13) and the **proper name of a legitimate room** (Principle G; Blueprint § 4). The canon relies on context to tell them apart. That is precisely the one-name-per-concept strain the mission's instinct detected — the instinct is sound; the proposed fix is aimed at the wrong word.
- **`/dashboard` is a real, live, household-reachable page** with a real `<h1>Dashboard</h1>` (`client/src/pages/dashboard.tsx:227`) — and it has **no row in the map of the house** (§ 8.2).

> **Recommendation: do not rename anything. Resolve what `/dashboard` *is* (§ 8.2) — that is the question the rename was reaching for.**

### 6.2 Should Home contain a canonical Household Display?

**No.** Refused in both readings (§ 5.2). As the room's nature it conflicts with UIA § 5, Blueprint § 15.3, Experience Principle 4, and the dwell-versus-departure law of Experience Architecture § 11 / § 17.11 / Blueprint § 1.5. As a component it is owned with no remainder, and Home's one permitted Living Detail is already spent on the greeting (Blueprint § 12.1 rule 1, § 12.2).

**And the cost of adopting it is concrete, not theoretical:** it would supply the justification for Home's live missing door (NORTH1 § 8.3) — the change NORTH1 calls *"the most valuable single change to the product in this list, quite apart from how anything looks."*

### 6.3 What information naturally belongs on Home?

**The canon already states the test, and it needs no help:**

> *"**Home is not the everything page.** Sections earn their place on Home only by answering **'how are we doing today?'** — anything else lives in its own realm and is reached by navigation."* (Experience Architecture § 4)

Applied to what Home renders today (`home-experience-page.tsx`), all of it passes, which is worth recording plainly:

| Section | Answers *"how are we doing today?"* | Verdict |
|---|---|---|
| The greeting (date + household name) | *You were expected* — Home's one Living Detail (Blueprint § 12.2) | Belongs |
| Today's Meals | What we are eating today | Belongs |
| Shopping (open item count) | What today still needs | Belongs |
| Plant Diversity (count vs 30) | How the week is going | Belongs — **as state, never as a score** (§ 6.4) |
| Reminders (Notice Engine, silence-ruled) | What gently deserves attention | Belongs — and is correctly **absent** when silent |

**Nothing needs adding.** The one thing Home is missing is not information — it is the **door** (§ 7.1).

### 6.4 What should never appear there?

Every item below is cited to an existing owner; none is coined here.

| Never on Home | Forbidden by |
|---|---|
| **Anything that does not answer *"how are we doing today?"*** | Experience Architecture § 4 (*not the everything page*) |
| **A dashboard of metrics greeting the arrival** | **OHDB § 13.1**, *Things to avoid* — leads the list |
| **Scores as trophies, streaks, notification piles, *"you haven't…"*** | EXPCOMP1 AREA 13; Experience Architecture § 13 (*no shame-flavoured streak language*) |
| **Forms, inputs, decisions, or any work done in place** | Experience Architecture § 4 (*read-only in spirit*); Experience Language Principle C (*a welcome is never combined with a workload*) |
| **Manufactured attention — alert badges, amber urgency at the threshold** | Experience Principle 8 (*attention borrowed, never taken*); NORTH1 § 5.4 |
| **Charts, analysis, history** | Experience Architecture § 4 (*"today's state"*); § 5 (depth is layer two/three, reached by intent) |
| **Filler when there is nothing to say** | Experience Architecture § 6; Experience Language Principle 8; Blueprint § 12.1 rule 3 |
| **A second Living Detail** | Blueprint § 12.1 rule 1 — Home's one is the greeting |
| **A launcher or tile grid presented as a threshold** | EXPCOMP1 AREA 1; NORTH1 § 5.3, § 5.4 (*a menu at the arrival*) |

**There is an unusually precise negative definition available**, and it is worth naming because it already exists in the product: **`/dashboard` holds almost exactly the list above** — a THA Score tile, a Recharts bar chart, a Recharts donut, four stat tiles, and two modal forms including a nine-field health-signals logger (`client/src/pages/dashboard.tsx:364-919`). Whatever is decided about that page (§ 8.2), it is a useful artefact: **it is a working inventory of what Home must never become.**

### 6.5 How does this differ from a traditional dashboard?

The distinction is not calmness, density, or restraint — a dashboard can be calm, and Home's current defect is that it is calm *and* dashboard-shaped. The distinction is the **verb**:

| | Traditional dashboard | THA's Home |
|---|---|---|
| **Purpose** | To **report** | To **send** |
| **Verb (Blueprint § 15.3 Q3)** | None — *"if there are none, it is decoration"* | *Arrive, be oriented, step through the one right door for the hour* (DESIGN1 § 0.1) |
| **Two-second glance yields** | Orientation + state | Orientation + state + **the one obvious next thing** (UIA § 5) |
| **Success measure** | Dwell — you looked | Departure — you left, calmer (Blueprint § 1.1; EXP ARCH § 17.11) |
| **Emphasis** | Many facts, equally weighted | A budget, spent on the top of the hierarchy (EXP ARCH § 9) |
| **Relationship to work** | The work happens here | The work happens in the room the door leads to (EXP ARCH § 4 — *read-only in spirit*) |

**This is exactly why the ambient-display framing is seductive and wrong.** It correctly rejects the traditional dashboard's *density* — and then keeps the traditional dashboard's *doorlessness*, which is the half that actually matters. NORTH1 § 5.4 named the resulting shape precisely: **"the glance card without a door — the dashboard at the threshold."** A calm dashboard at the threshold is still a dashboard at the threshold.

### 6.6 How does it strengthen the Orchard House metaphor?

**The Arrival half strengthens it by being the metaphor's own word.** Blueprint § 5.1 and OHDB § 13.1 both give Home the same place-identity — *"the threshold and the heart"*. In a house, a threshold is where you arrive **and where you choose your room**; it is architecturally defined by the doors leading off it. That is Home's whole design: E3, *"the open view"*, Home only, *"the view **is** part of the room's purpose"* (Blueprint § 6.2), with a *"compact counter — the view keeps its share"* (§ 5.1). A threshold can afford the most orchard in the house precisely because it holds the least work.

**The Display half weakens it, and does so in the metaphor's own terms.** An ambient display in a house is not a threshold — it is **an appliance on a counter**. Installing one where the doorway should be is:

- **The theme park** risk inverted — not a drawn kitchen, but a *drawn device*: a literal consumer-electronics artefact imported into a room that is supposed to be produced by material, light, and composition (Blueprint § 16).
- **An imported aesthetic without its reasoning** — Experience Architecture § 17.11 anticipates this move by name: *"**Benchmark the craft, never the artefact**... An imported aesthetic arrives without the reasoning that produced it, and always reads as costume."* And: *"A food companion for a household is not a phone, a bank, a music player, or a productivity tool."* A smart display is the closest thing to all four at once.
- **Contrary to the vision's own sentence** — Blueprint § 1.5: *"Technology should quietly disappear. The household should always feel present."* A Household **Display** makes the technology the noun.

> The Orchard Living Book's account of arriving home has no device in it. It has a door, a warm room, light, and someone who has already thought about dinner. That is not an aesthetic preference — it is § 1.5 rendered as a place.

### 6.7 Does it conflict with any governing architecture?

| Half of the hypothesis | Conflict |
|---|---|
| **"Home is the household's Arrival room"** | **None.** It agrees with the canon completely — which is the problem with adopting it: agreement this total is called *restatement* (Blueprint § 18). |
| **"…containing an ambient Household Display"** | **Yes — four, listed in § 5.2:** UI Architecture § 5 (the two-second rule requires three answers, not two) · Blueprint § 15.3 (the Experience Test — no verb means decoration, and instructs STOP) · Experience Architecture Principle 4 and § 7 (exactly one primary action; *"a surface that cannot name its primary action is not finished being designed"*) · Experience Architecture § 11 / § 17.11 and Blueprint § 1.5, § 1.1 (dwell versus departure). Plus the NORTH2 § 3.4 precedent against generalising Home's E3 exception into a law. |
| **"…while remaining fully compliant with the Orchard House philosophy"** | **This clause is not sustainable.** The Display half is refused by OHDB § 13.1's own *Things to avoid* list, whose first entry is *"a dashboard of metrics greeting the arrival"*, and by Blueprint § 16. |

Per the mission's stop condition, the conflicts are **named, not resolved**. No architecture was modified.

### 6.8 Amendment, or a better interpretation of existing canon?

**Neither — and the honest answer is the finding.**

- It is **not an architectural amendment**: nothing in it is new (§ 4 — seven for seven), and what is new conflicts (§ 5.2).
- It is **not a better interpretation**: the Arrival half is not an *interpretation* of the canon at all, it is a **paraphrase** of it — Home is already *the threshold and the heart*, in those words, in two governing documents. A paraphrase cannot be better than its source; it can only become a second owner of it.
- The Display half is a **worse interpretation** — one that would license the exact defect (`no primary action at Home`) that three separate prior investigations have now independently identified as the product's most valuable pending fix.

> **Net: zero amendments. Zero principles. The investigation's value is negative — it closes a question, names a trap, and records two gaps it declines to fill.**

That is the same shape NORTH2 reached, and for the same underlying reason. The canon is now seven governing documents deep on the experience layer. **At this size, the discipline that protects it is refusing to write things twice** (NORTH2 § 1). An investigation that adopts nothing is not an investigation that found nothing.

---

## 7. IMPLEMENTATION IMPLICATIONS

**No implementation is recommended by this investigation, and none is authorised by it.** What follows is what *already-existing law* requires of Home, located precisely so a future workstream can act. Every item is a **conformance defect** — the product disagreeing with the architecture — not an architectural gap. None requires an amendment; none is blocked by the UIA § 4 amendment or any open item.

### 7.1 Home has no door — the one that matters

**Cited to:** Experience Architecture Principle 4 and § 7; UI Architecture § 5 (the two-second rule); Blueprint § 15.3 Q3; EXPCOMP1 AREA 1 (FAIL — *"no primary action"*).
**Located at:** `client/src/pages/home-experience-page.tsx:179-397` — three equal-weight card links (`:216`, `:273`, `:317`), each with identical `Card` styling and a `ChevronRight`; no `<Button>` imported on the page; the only de-emphasised text link points at `/dashboard` (`:386-393`).
**Already specified:** NORTH1 § 8.3 — *"Resolve Home to **orientation + one door**, re-aimed by relevance across the day."* The re-aiming mechanism is owned by TRANSLATION1 *Morning Rhythm* § 8: *"the one primary action is re-aimed by relevance across the day — look at the week in the morning, start tonight's dinner at the dinner hour."*

**HOME1's only contribution here is a warning about the fix, not the fix:** the door must be a **door**, not a fourth card. Home is *read-only in spirit* (Experience Architecture § 4) — *"acting on something means moving to that thing's canonical place."* Home's primary action is therefore a **departure**, not an operation performed at Home. This is the reconciliation the canon already contains and that the Display hypothesis obscures: **Home is both non-demanding and door-bearing, because its one action is to leave.** Experience Language § 5.1 states it as the room's Action beat: *"one gentle, obvious next thing (open today's plan, add tonight's meal), never a wall of options."*

### 7.2 The other located Home defects — already owned by prior workstreams

Recorded for completeness; **all four belong to NORTH1 § 8 and NORTH2 § 6, not to HOME1**, and are not re-opened here:

- The orchard backdrop at `opacity: 0.90` behind every room, with parallax (`client/src/components/layout/orchard-backdrop.tsx:9`) — Blueprint § 16 *wallpaper* and *the rendered world*; § 6.1 *"the orchard never animates"*.
- `--card: 0 0% 100%` (`client/src/index.css:11`) — the one cold plane in a warm palette (UIA § 7).
- Home's container divergence — the only one of sixteen `WorkspaceHeader` pages not using `pageContainerClass` (Blueprint § 18.2's open item).
- Home's hardcoded HSL literals (`home-experience-page.tsx:223`, `:280`, `:324`) — a second owner of colour (UIA § 16).

### 7.3 What HOME1 explicitly does **not** recommend

- **No rename.** Not Home, not Dashboard, not any nav label, heading, or route (§ 6.1).
- **No new component**, canonical or otherwise. No "Household Display" (§ 5.2 Reading B).
- **No change to what Home shows.** All five current sections pass § 4's earn-your-place test (§ 6.3).
- **No amendment to any governing document.** `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_KEPT_ROOM_TRANSLATION.md`, `THA_ORCHARD_LIVING_BOOK.md` and `THA_UI_ARCHITECTURE.md` all stay **byte-untouched**.
- **No second visual language**, no token, no exposure change, no Living Detail.

---

## 8. GAPS RECORDED, NOT FILLED

Per EXPCOMP1 § 4.3 (*"Where the canon is silent, record silence as a gap — never fill it"*) and § 6.2's precedent (Performance & Responsiveness has no owner, recorded rather than invented).

### 8.1 "Ambient" is absent from the entire canon

The word **"ambient" appears nowhere** in the governing Experience documents, nor in NORTH1 or EXPCOMP1. This is silence, and it is recorded as such rather than filled.

**The honest reading:** the canon governs every *behaviour* an ambient surface would need (§ 4 — seven for seven) and has simply never needed the *word*, because it reached the same behaviours from a different root — the house, the threshold, and borrowed attention. **This is a vocabulary gap, not a rule gap, and it does not justify an amendment.** Recorded so that no future audit rediscovers the absence and mistakes it for an omission.

### 8.2 `/dashboard` is a live room that is not on the map — **a conformance finding, reported not fixed**

The most concrete thing this investigation found, and it is not about Home.

**The facts:**

- `/dashboard` is a **live, protected, household-reachable route** (`client/src/App.tsx:381`) rendering a 923-line page with a real `<h1>Dashboard</h1>` (`client/src/pages/dashboard.tsx:227`).
- It is **not in the primary navigation** — `NAV_ITEMS` (`client/src/components/nav-bar.tsx:39-48`) has no Dashboard entry. Its `REALM_STYLES["/dashboard"]` block (`:59-65`) is orphaned. The four "Dashboard" nav labels in `nav-bar.tsx` (`:421`, `:427`, `:485`, `:578`) sit inside `TopBar`/`BrandBanner`, which are **never instantiated**.
- **Its only live door in the entire application is Home's muted footer link** (`home-experience-page.tsx:386-393`).
- It is **actively maintained** — last touched 2026-07-13 (`eb9296e7`) — and explicitly sanctioned in-file as *"the ONE sanctioned aggregate view"* (`dashboard.tsx:294-299`, PHASE5C).
- **It has no row in the map of the house** (Blueprint § 5.1). The map holds eleven: Home, Planner, Cookbook, Shopping, Pantry, Nutrition, Diary, Analyser, Household/Profile, Companion, Admin. There is no Dashboard.

**Why this matters, cited:** Blueprint § 15.3's mandatory Experience Test, Q1 — *"**Which room of the home is this?** Name it against the map (§ 5.1). If the screen belongs to no room... its place has not been decided, and **a placeless surface cannot be one home**."* And Blueprint § 15.2's Blueprint Check *the map respected* — *"If this is a NEW domain, has its row been added to the map by governance rather than improvised?"*

**And it is unclear whether the canon already blesses it.** Experience Language Principle G says *"the dashboard is only the first workspace within that home"* and Blueprint § 4 repeats the spatial consequence — but **neither defines which "dashboard" it means**. Written out of `ARRIVAL1`, it could mean (a) Home's own workspace content — the card region the arrival settles into — or (b) the `/dashboard` page. The live product has **both**, and the canon never says which it named. **That ambiguity is recorded, not resolved:** resolving it is a governance decision about the map, not an inference an investigation may make (EXPCOMP1 § 4.3).

**The open question already exists and is unapproved.** `UX0_HOME_EXPERIENCE.md:329-330`, under *"SUGGESTION (out of scope — do not implement without approval)"*: *"Consider whether the detailed `/dashboard` view should eventually fold into Home or remain a separate 'full view' — a product decision for a later phase."*

> **Recommendation: this is the question the mission's rename instinct was actually reaching for, and it is a product and governance decision — not this investigation's to take.** Three things would settle it, in this order: (1) decide what `/dashboard` *is* — a room, or a surface to retire; (2) if a room, add its row to the map by governance and give it a real door; if not, retire it and its footer link together; (3) resolve Principle G's ambiguous *"the dashboard"* to whichever survives. **HOME1 takes none of these steps.**

### 8.3 "Dashboard" names two concepts in the canon

Recorded as an observation, deliberately **not** graded — the standard that would grade it (EXPCOMP1) is itself a proposed instrument, and this investigation is not an audit.

The canon uses "dashboard" for two different things: the **anti-pattern shape** (Blueprint § 1.1 *"Not a dashboard reporting to you"*; OHDB § 13.1 *"a dashboard of metrics greeting the arrival"*; EXPCOMP1 AREA 13; Experience Language Principle G's own title, *home is not the dashboard*) and the **proper name of a legitimate workspace room** (Principle G's body; Blueprint § 4). Experience Architecture § 13 requires *"One name per concept, everywhere."*

**This is not proposed for amendment**, for two reasons: it may dissolve entirely once § 8.2 is decided (if `/dashboard` retires, only the anti-pattern sense remains, and the strain is gone); and a governing-document wording change is a governance decision requiring the owner's judgement, not an investigation's. **Recorded so it is visible when § 8.2 is taken, and so no future audit rediscovers it.**

---

## 9. WHAT SHOULD EXPLICITLY NOT BE ADOPTED

Recorded so no future investigation rediscovers and re-asks them — the discipline Blueprint § 12.2, NORTH2 § 5, and `EXP5` § 5.3 already apply to declined proposals.

| Proposal | Why it is refused |
|---|---|
| **"Home is an ambient Household Display"** (room's nature) | **Conflicts four times:** UIA § 5 (two-second rule needs three answers) · Blueprint § 15.3 Q3 (no verb = decoration; STOP) · EXP ARCH Principle 4 / § 7 · EXP ARCH § 11 / § 17.11 + Blueprint § 1.5 / § 1.1 (dwell vs departure). Inherits NORTH2 § 3.4's refusal of generalising Home's E3 exception. **Would legitimise Home's live no-door defect (NORTH1 § 8.3).** |
| **A canonical "Household Display" component** | Owned with **no remainder**: content by EXP ARCH § 4, hierarchy by EXP ARCH § 9 / UIA § 5, feeling by EXPLANG § 3, § 3A, read-only posture by EXP ARCH § 4, sign of life by Blueprint § 12.2 (Home's one Living Detail is already the greeting). A component owning nothing is a second owner of everything it touches. |
| **Retiring "Dashboard" in favour of "Arrival"** | Category error: *Arrival* is a **beat** (EXPLANG § 5) running in every room; *Dashboard* is a **room** (Principle G); *Home* is the **place**. The swap breaks EXP ARCH § 13 (one name per concept). Changes nothing user-facing — Home is already "Home" everywhere; "Arrival" is zero user-facing. Blueprint § 4: *"the home is never renamed."* |
| **An "Arrival room" principle** | **Restatement.** Home is already *"the threshold and the heart"* (Blueprint § 5.1; OHDB § 13.1), already governed by EXPLANG Principles 1, C and G, and its verb is already fixed by DESIGN1 § 0.1. Adopting it creates the second owner Blueprint § 18 forbids. |
| **"Always useful" in the display's sense** (never blank) | **Inverts** EXP ARCH § 6 (*empty is a valid, designed state*), EXPLANG Principle 8, and Blueprint § 12.1 rule 3 (*honest in absence*). THA's "always useful" means *never wasted*, not *never blank* (§ 4.1). |
| **Any behavioural principle drawn from the reference devices** | Seven for seven already owned (§ 4). Per EXPCOMP1 § 1.2's yield clause, each would be *"that defect on the day it was written"* (NORTH2 § 3.2). |

---

## 10. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this investigation; every governing Experience document read. NORTH1, NORTH2 and EXPCOMP1 read in full, and treated as what they declare themselves to be — evaluation and proposal, never law.
- **One rule, one owner, forever** (Blueprint § 18; Architecture Principle 2; Experience Principle 6): the load-bearing test of this investigation. Seven of seven behavioural characteristics fail it and are refused on that ground.
- **EXPCOMP1 § 4.3 — *"Cite, or do not grade... where the canon is silent, record silence as a gap — never fill it"*:** honoured. Every claim above routes to a named owner; three silences are recorded in § 8 and none is filled.
- **The mission's stop conditions:** honoured in full. **Nothing implemented. Home not redesigned. No experience principle created. No governing architecture modified** — conflicts are named (§ 6.7) rather than resolved, per *"do not modify the governing architecture unless a genuine conflict is discovered"*: genuine conflicts **were** discovered, and they are conflicts **with the hypothesis**, not within the canon — so the correct response is to refuse the hypothesis, not to amend the architecture.
- **Scope:** no UI designed, no UI implemented, no component, token, route, colour, or dependency touched; no second visual language; no mock-up; no audit performed. Code was read for facts only.
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Where it and any governing document appear to disagree, **this document is the defect.**

---

## 11. THE FINDING IN ONE PARAGRAPH

Home is the household's Arrival room — and the canon has said so since 2026-07-15, in those words, in two governing documents: *the threshold and the heart*. Every behavioural characteristic of an ambient household display is already required of it by name. What the display category adds is not a philosophy THA lacks but the one property THA must never have: **no door**. Apple Home, the Nest Hub and the Echo Show are destinations, and they succeed when you look at them; THA is a threshold, and it succeeds when you leave it calmer than you came. Those two designs produce identical behaviour right up to the moment the household needs to *do* something, and then they diverge completely. **Home's real problem is not that it has been mistaken for a dashboard. It is that it currently has no door, and the ambient-display hypothesis is the most convincing argument yet advanced for never giving it one.** Refuse the hypothesis; fix the door.

---

*An investigation — point-in-time analysis of the Home room's behavioural role against the governing Experience Architecture and its siblings. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the HOME1 workstream: `rollback/HOME1-arrival-behaviour-investigation-20260716` → `7d1dd2ce`.*
