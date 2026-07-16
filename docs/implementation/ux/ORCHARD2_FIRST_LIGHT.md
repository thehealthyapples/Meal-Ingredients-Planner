# ORCHARD2 — First Light

## The Arrival Experience of The Healthy Apples

**Status:** DESIGN SPECIFICATION — the first practical design work built on the Experience Governance blueprints; the canonical design of Home's arrival, and the gold standard every future room follows
**Classification:** Experience / UX design (implementation) — **not** governing architecture. This document *applies* the governing rules and owns only the concrete composition of one moment; it creates no rule and no second owner (Experience Blueprint § 18; Architecture Principle 2).
**Date:** 2026-07-15 (ORCHARD2)
**Scope:** The single moment of walking through the front door of the Home for the **first time each day**. Home only. No other room; no dashboard.
**Built on:** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (the design language) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) (the lived, felt account — its chapter *First Light*)
**Cites, never restates:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (behaviour) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (the binding look) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (the feeling)
**Fidelity:** Design intent only. **No code, no components, no production UI.** The diagrams below are spatial-composition sketches — deliberately low-fidelity, showing *where things sit and how they relate*, never how they look. Every visual value remains the UI Architecture's.

> **What this document is.** The blueprints describe the house in general; the Living Book tells what it is like to live there. This is the first document to take one moment — *arrival at Home, first thing in the morning* — and design it fully, so it can be built. It is the practical proof that the vision produces a real experience, and the reference every later room measures itself against. It describes **only** the arrival moment of Home and does not move past it. Where it touches a governed concern (Home's exposure, the one morning, the greeting, the Companion's manners, the shell), it *applies* the owner's rule and cites it — it never rewrites it. Nothing here ships until the governance path the Blueprint fixed has been walked (§ 0.3).

---

## 0. FRAME

### 0.1 The one moment, named

Every design in THA answers three questions before anything else (the Experience Test, Experience Blueprint § 15.3). For First Light:

- **Which room is this?** **Home** — the threshold and the heart of the house (Experience Blueprint § 4, § 5.1; Experience Architecture § 4).
- **How should someone feel here?** *Welcomed. Expected. Calm.* The one sentence that governs every decision below: **"I've come home."** (Experience Language § 5.1, Principle 1; § 4A Principle A, the THA Promise.)
- **What is the ONE thing this room helps them do?** **Arrive** — and, having arrived, be gently oriented: *how are we doing, and what's next?* — before anything is asked of them (Experience Architecture Principle 4; Experience Blueprint § 4.1).

Arrival is not a screen that loads. It is a *threshold that is crossed*. This document designs the crossing.

### 0.2 First Light is the first arrival of the day — and only that

The house is entered many times a day. **First Light is the design of the first entry only.** Later entries the same day are *Returning Home* (Orchard Living Book, chapter *Returning Home*): the same house, unchanged, the Companion arriving a beat after you, **no greeting re-performed**. This distinction is load-bearing and appears throughout:

- The greeting in the signature voice is spent **at most once per day** — it is a Living Detail with that exact ceiling (Experience Blueprint § 12.2, § 10). First Light is where the one greeting a day is spent.
- Every return after it is quieter by design. The warmth of return is *constancy*, not a repeated performance (Orchard Living Book, *Returning Home*).

A greeting that fired on every visit would wear out until it meant nothing — the anti-pattern the Living Book's *First Light* chapter names as *"the greeting worn out by overuse."* First Light protects the greeting by rationing it.

### 0.3 The governance path — what this design may become, and when

This is design intent. Three governed gates stand between it and a shipped pixel, and this document jumps none of them (Experience Blueprint § 2.4; OHDB § 2.4):

1. The **depth / ground-plane / light vocabulary** described here (the counter as a lit surface, the one sanctioned light moment settling on it) sits *beyond* the UI Architecture's current flat-surface law (UIA § 4) and **may not ship until the governed UIA § 4 amendment admits it.** Until then, UIA § 4 as written is the binding law of any shipped Home.
2. **Home's exposure and light values** (E3, the morning hue and direction) enter only as **semantic tokens by admission** (UIA § 16) — never as per-surface choices in a component.
3. The **greeting** is a Living Detail admitted **as its own named decision** against the Experience Review Questions (Experience Blueprint § 12.1, rule 6).

Two of the Blueprint's four open items (§ 18) bear directly on First Light and must be closed before it ships: the **orchard's canonical owner** (the E3 view has no owned environment asset yet) and **Home's header** (the live Home and the realm surfaces currently present two shell treatments; one must be made canonical). This document depends on both; it does not resolve them.

---

## 1. EXPERIENCE NARRATIVE

You open The Healthy Apples at the start of the day. The first thing you feel is not information — it is *arrival*. The house was expecting you, and it says so once, gently, in a hand that looks written rather than typed: your name, the hour, nothing more. There is no wall of numbers standing to attention, no red badge, no report demanding to be read. There is a warm, low morning light — the same morning that has lit this house every time you have ever come — falling the same way it always falls. Through the wide window of the room, the orchard stands in that light: mature, in leaf, unhurried, needing nothing from you.

For a moment, nothing is asked. That silence is deliberate and it is the whole point: **you have arrived somewhere calm that already knew you were coming.** Then, as softly as sun moving across a counter, the room settles: a line or two telling you how the household is doing and what is coming — offered the way a friend slides a mug across the counter, not the way a dashboard reports to a manager. The Companion takes its usual place at the counter a beat after you, the way a good friend lets you get your coat off before they say hello, and waits — ready, saying nothing until there is something worth saying.

Only now, once you are *in*, does the day's first real choice become available — one clear thing, in the light, easy to reach. You were welcomed before you were asked to work. And when you move from here into the week, or the cookbook, or the day, you carry the feeling the whole moment was built to leave you with: *that was calm; they had already thought about us; I've come home.*

That is First Light. Everything in the sections below exists to produce exactly that paragraph, and to keep producing it for ten years without ever performing it.

---

## 2. SPATIAL LAYOUT

*(Low-fidelity spatial sketches. They show **relationships and proportion**, not appearance. All values — spacing, radius, colour, type — are the UI Architecture's. Home is **E3, the open view** — the one room in the house where the orchard is visible as itself, generously, and the view *is* part of the room's purpose; the working surface is a **compact counter that keeps its share** so the view keeps its own — Experience Blueprint § 5.1, § 6.2, § 8.)*

### 2.1 The room, at rest (after arrival has settled)

```
 ┌──────────────────────────────────────────────────────────┐
 │  ▓ THA          Home  Planner  Cookbook  Pantry  …    ⌂   │  ← THE WALLS (shell)
 │                                                          │    one frame · one nav · Home
 ├──────────────────────────────────────────────────────────┤    in the anchor · byte-identical
 │                                                          │    in every room (EXPARCH §8 ·
 │        ~ ~ ~   the open view — E3   ~ ~ ~                │    UIA §6 · unchanged here)
 │      ~   orchard in the one morning light   ~           │
 │        (still · in leaf · never wallpaper ·             │  ← THE VIEW (background ground)
 │         never carries this text · never animates)       │    orchard = setting, not decoration
 │                                                          │    (EXPBLUE §6). Generous, sparse.
 │      ┌────────────────────────────────────────┐         │
 │      │  Good morning, Sarah.        (THA's hand)│        │  ← THE COUNTER (middle ground)
 │      │  Thursday · a calm week ahead            │        │    compact · solid · lit · warm
 │      │                                          │        │    holds: greeting · orientation ·
 │      │  You're all set for tonight.             │        │    ONE primary action. Keeps its
 │      │  [ Look at the week ]   ← one clear door │        │    share so the view keeps its own
 │      └────────────────────────────────────────┘         │    (EXPBLUE §5.1, §8.2)
 │                                            ( ◐ )         │  ← THE COMPANION (foreground)
 │                                                          │    fixed chair at the counter ·
 └──────────────────────────────────────────────────────────┘    arrives a beat after you (§6)
```

Three grounds, exactly as the material law fixes them (Experience Blueprint § 8.1) — and Home is the room that spends the most of its frame on the first:

- **Background — the world.** The orchard and the daylight it casts. At Home this is *generous* (E3): the open view is part of why the room exists. It is still, in leaf, and it never carries the greeting text — any type sits on ground, not on landscape (Experience Blueprint § 6.1).
- **Middle ground — the room.** One **compact counter**: a single solid, warm, lit working surface holding the greeting, the orientation, and the one primary action. One ground, never nested (Experience Blueprint § 8.2). It is *compact* on purpose — Home is the only room where the working surface deliberately keeps itself small so the view keeps its share.
- **Foreground — the Companion.** The one Companion mark, in its fixed chair at the counter. Foreground, the room's own light, no view of its own (Experience Blueprint § 13).

### 2.2 The vertical rhythm — view above, counter below, one horizon

```
        top of frame
   ─────────────────────────  ← the walls (shell): constant, never part of the moment
        ▓ orchard / open view ▓          the view holds the upper field —
        ▓  (E3, generous)     ▓          you look UP and OUT, as you would from a sink
   ~ ~ ~ ~ ~  one soft horizon ~ ~ ~ ~    the counter meets the light here
        �e counter (compact)  e▓          the working surface sits LOWER, in reach
        ▒ greeting · state · 1 action ▒   solid ground under all text
        · · Companion at the counter · ·  foreground, lower-right, its usual place
   ─────────────────────────
        bottom of frame — one viewport. No scroll to arrive. (§2.4)
```

The composition reads top-to-bottom as **sky → light → surface → hand**: you look out and up to the orchard, the morning meets the counter at one soft horizon, and everything you might *do* is gathered low and near, where a hand rests on a counter. This is the architecture of a real kitchen at the good hour, and it is why the room feels like one you already know.

### 2.3 Placement rules that hold this layout together

- **The greeting sits on the counter, never on the view.** Legibility is never traded for atmosphere (Experience Blueprint § 6.1). The signature-voice greeting is the warmest thing on the warmest surface — the counter — not floating on the orchard.
- **One primary action, in the light, on the counter.** Exactly one door forward (Experience Architecture Principle 4). It is the brightest-weighted element *after* the greeting, and it does not appear until arrival has happened (§ 5, § 8).
- **The Companion's chair is fixed.** Same position here as in every room — the friend at the counter, lower in the foreground, never centre stage (Experience Blueprint § 13). It is *in* the room, never a room.
- **The walls are not part of the moment.** The shell (header, navigation, way home) is present from frame one, byte-identical to every other room, and it does not animate, reveal, or participate in the arrival — arrival happens *inside* constant walls (Experience Blueprint § 14; Experience Architecture § 8).

### 2.4 One viewport — arrival is complete without scrolling

Arrival resolves within a single viewport. You never scroll to be welcomed or to be oriented; the whole moment is visible at once, the way stepping through a door shows you the whole room. Scrolling, if the Home offers more below, is *walking further into the same room* (Experience Language Principle D) — but the arrival itself is complete above the fold, on one screen, on one morning.

---

## 3. VISUAL COMPOSITION

*(Composition and hierarchy of weight — not styling. Every actual value is the UI Architecture's; the depth described ships only via the § 0.3 path.)*

### 3.1 The composition, in one line

> **A generous, still view; a compact warm counter meeting it at one soft horizon; the household's name the single warmest mark in the frame; one clear door forward; the friend already in their chair.**

### 3.2 The order of weight (what the eye meets, and in what order)

```
   1st  ●  The greeting — the household's name, in THA's hand
           the single warmest, most human mark; signature voice; once a day
   2nd  ◐  The one primary action — the door forward, in the light
           the brightest-weighted UI element AFTER the greeting
   3rd  ~  The orientation line(s) — "how we're doing / what's next"
           calm human sentences, low contrast, on the counter
   4th  ▓  The open view — the orchard, generous but quiet
           large in AREA, low in ATTENTION: it holds the eye's rest, not its work
   5th  ·  The Companion — present, foreground, waiting
           lowest emphasis until invited; its only sign of life is arriving late
       —  The walls — the shell: read as PLACE, not as content; not competing
```

The deliberate inversion is the whole composition: **the orchard is the largest thing and the quietest thing.** It carries area, not attention — it is what the eye rests *on* between reading the greeting and reaching the door, never what the eye must *work*. This is E3 done correctly: the view is generous because looking is part of the room's purpose, and quiet because the household came home, not to a landscape (Experience Blueprint § 6.2; § 16, *all view, no room* — avoided by giving the counter real content and real weight).

### 3.3 Composition guardrails

- **The signature voice appears exactly once** — the greeting — and nowhere else on the screen. Scarcity is its entire value (Experience Blueprint § 10; OHDB § 8).
- **Colour does not carry the hierarchy; light and weight do.** The primary action leads by standing in the light, not by wearing an accent the rest of the room lacks (OHDB § 6, § 7).
- **No hero, no marketing band, no carousel, no metric tiles.** Home is a place, not a dashboard (Experience Language Principle G; Experience Blueprint § 4). The composition has one warm human centre, not a grid of widgets.

---

## 4. INFORMATION HIERARCHY

*(What is said, in what order, and — as importantly — what is withheld until asked. Progressive disclosure is the interior principle here: calm at the threshold, capability on request — Experience Architecture Principle 2; OHDB § 4.)*

### 4.1 The three things Home says, in order

```
  LAYER 1 — ARRIVAL          "Good morning, Sarah."
  (identity + welcome)        You are known; you are expected. Nothing asked.
        │                     Signature voice. Once a day. (EXPBLUE §12.2)
        ▼
  LAYER 2 — ORIENTATION      "Thursday · a calm week ahead ·
  (how are we / what's next)   you're all set for tonight."
        │                     One or two calm human lines. The honest state of
        │                     the household — never a metrics wall. (EXPARCH §4)
        ▼
  LAYER 3 — THE ONE DOOR     [ Look at the week ]
  (a single primary action)   One thing forward, appearing only AFTER arrival.
                              Everything else is one nav-step away, not here. (P4)
```

### 4.2 The hierarchy laws for First Light

- **Arrival outranks information, always.** Layer 1 is complete and felt before Layer 2 resolves. The welcome carries no task (Experience Language Principles 1 and C). A person who reads only the greeting and closes the app has still had a complete, correct arrival.
- **Orientation is human, honest, and thin.** *"A calm week ahead"* not *"7/7 days planned, 82% nutrition score."* The state is told the way a friend tells it, and it is **honest in absence** — if there is nothing worth saying, the room has the confidence to stay quiet, and quiet never curdles into cold (Orchard Living Book, *Tea Before The Day Begins*; Experience Language § 3A.4). No number is shown for the sake of showing a number.
- **One door, chosen for the household, not a menu.** The single primary action is the most useful next step *today* — decided by the product, taken by the person (Experience Architecture Principle 5, *the product orients, the person chooses*). The full house remains reachable through the constant navigation; Home does not lay it all out.
- **Everything deeper is disclosed, not displayed.** Counts, breakdowns, history, settings — all one step away, none of it greeting the arrival (OHDB § 4).

### 4.3 What Home never leads with

No streaks, no scores as trophies, no notification pile, no "you haven't…" guilt, no unread badges, no onboarding checklist. These are the dashboard trying to prove it was busy while you were gone — the exact opposite of a home that simply kept (Orchard Living Book, *Returning Home*; Experience Blueprint § 16).

---

## 5. MOTION PHILOSOPHY

*(Motion is fully owned — the UI Architecture owns its vocabulary of durations and easings (§ 11); the Experience Language owns what it must feel like (Principles 4, 12, D). This section adds no rule; it composes the owned rules into the arrival, and names the one sanctioned moment.)*

### 5.1 The governing test, quoted

> **If the person notices the animation before they notice the content, the animation has failed.** *(Experience Language Principle H, via Experience Blueprint § 9.)*

First Light is the most tempting moment in the entire product to break this rule, and the discipline is to refuse. Arrival is *felt*, not *watched*.

### 5.2 The one sanctioned light moment

The house has exactly one sanctioned light *moment*, and it is the arrival's: **it reads as morning sun settling on a surface — once, softly — carrying warmth, not attention** (Experience Blueprint § 7). At First Light, as the greeting appears, the warmth gathers gently across the counter, the way sun moves across a real counter at the good hour. It is slow, low-contrast, and singular. It does not sweep, pulse, sparkle, or repeat. If you tried to point to the animation, you would struggle — you would only be able to say the room felt warm.

### 5.3 The choreography of arrival (what moves, in what order, and how little)

```
   t         what settles                         how it feels
   ──────────────────────────────────────────────────────────────────
   0s   the walls + the one morning are           nothing "loads"; the house is
        ALREADY there                             simply there (shell constant)
   ~0.5s the greeting resolves in THA's hand       a quiet fade-up, felt not seen
   ~1s   the light gathers on the counter          the one sanctioned moment — once
        (the single light moment)
   ~2s   orientation settles beneath the greeting  a soft settle, no motion for show
   ~3s   the Companion arrives a beat after you    manners rendered as timing (§6)
   ~3s   the one door is present and reachable      arrival is over; the day may begin
```

Total: a few seconds, and every part of it subordinate to the content. The sequence is an *order of appearance*, not a performance to sit through — and it never blocks intent (§ 5.4).

### 5.4 Motion laws for First Light

- **The shell never moves.** No wall animates in or reveals. Arrival happens inside constant walls (Experience Blueprint § 14; the arrival prototypes proved the point by holding the shell byte-identical, § 14).
- **The orchard never moves.** No drifting mist, no swaying trees, no ambient life. Place survives total stillness; the view's life is warmth and light, never motion (Experience Blueprint § 6.1).
- **Motion yields instantly to intent.** If the person acts during the arrival — taps the door, starts navigating — the choreography completes *immediately* and gets out of the way. The welcome is a gift, never a gate (Experience Language Principle 12; Experience Architecture Principle 8, *attention is borrowed, never taken*).
- **The greeting fades; it does not perform.** No typewriter effect, no letter-by-letter reveal, no handwriting-being-drawn animation — that would make the technology the subject (Experience Blueprint § 1.5). The hand appears *written*, not *being written*.
- **Nothing in First Light animates for its own sake.** One light moment, one arrival beat for the Companion, and the felt settle of the greeting — and nothing else moves, ever.

---

## 6. COMPANION BEHAVIOUR

*(The Companion's conduct is Experience Architecture § 11's; its feeling is Experience Language Principle 7's; its place in the house is Experience Blueprint § 13's. This section applies those to the arrival moment only.)*

At First Light the Companion is at its most characteristic and its most restrained. It is **the knowledgeable friend at the counter** — a presence, not a room — and its entire behaviour at arrival is three quiet things:

- **It arrives a beat after you.** The person crosses the threshold *first*; the Companion joins *after*, taking its fixed chair at the counter. That beat is manners rendered as motion, and it is the Companion's entire sign of life — no pulse, no typing dots, no face, no simulated mood (Experience Blueprint § 12.2, § 13; UIA § 10). It is the friend who lets you get your coat off before they say hello.
- **It waits, and silence is a valid state.** It says nothing until there is something worth saying. If the day is calm and thought-through, the Companion is simply *present and ready*, and that readiness is enough — it never fills the silence to seem useful (Orchard Living Book, *Tea Before The Day Begins*; Experience Language § 5.7).
- **If it speaks, it offers — once, easy to take or leave — and never decides.** A single low, plain line if something genuinely needs the household ("you're low on the thing you use every week"), offered the way a friend slides it across the counter, then out of the way. It suggests; the household chooses (Experience Architecture Principle 5, § 11).

**What the Companion never does at First Light:** greet you *before* you have arrived (it never pre-empts the house's welcome); follow you around the room; perform helpfulness; open with everything that happened while you were away; or be lit differently from the room so it becomes a stage (Experience Blueprint § 13). Its finest arrival is the one where, a few seconds in, you have forgotten it is a piece of software at all.

---

## 7. LIGHT AND ATMOSPHERE

*(The house's light — one sun, one direction, one morning, rooms differing by exposure not hour — is the Experience Blueprint's (§ 7); its meaning is the Experience Language's (Principles 6, F); every value is the UI Architecture's (§ 7). Applied to Home, the brightest room.)*

### 7.1 The quality of the light

Home is lit by the same low, warm, **upper-left morning sun** that lights every room in the house, and it is the **brightest room** of them all — full morning, the most open exposure (Experience Blueprint § 5.1, § 7). It is the light of a kitchen at the good hour, before the noise: warm, generous, optimistic, and utterly consistent. Every shadow in the room agrees on one direction, because the house has exactly one sun and always will.

The light carries five meanings and no others — **welcome · warmth · calm · clarity · optimism** — and never performs or alarms (Experience Language Principles 6, F). At First Light it is doing all five at once: welcoming you in, warming the counter, calming the room, clarifying the one thing to do, and quietly insisting the day ahead is a good one.

### 7.2 The atmosphere

The air of the room is **warm, still, and unhurried** — *"a warm, lived-in home where someone has already thought about dinner"* (Experience Language § 3A; Experience Blueprint § 1.1). It is calm without being empty, quiet without being cold. The single guard against calm curdling into the lifeless, funeral-parlour stillness the palette forbids (Experience Language § 3A.4) is that the room is visibly *lived in*: your own name in the greeting, your own week in the orientation, the orchard alive beyond the glass. The house is warm because it is lived in, not because it was decorated (OHDB § 4, § 12).

### 7.3 The absolute light laws for First Light

- **One morning, never dusk.** First Light is always the same bright morning, whatever the real hour or the household's mood. There is no evening theme, no night mode-as-atmosphere, no shade-as-mood. Quieter is never darker (Experience Blueprint § 7; § 16, *the second sun*).
- **The orchard shares the room's sun.** One sun in the house; the view is lit by the same morning as the counter, meeting it at one horizon (Experience Blueprint § 7).
- **Light is the quietest instrument of hierarchy.** The greeting and the one door stand in the light; orientation waits a half-step back; the view rests in generous, even morning — depth meaning distance, never drama (Experience Blueprint § 7; OHDB § 6). All contrast is measured against the accessibility floors before adoption (UIA § 15).

---

## 8. EMOTIONAL JOURNEY — THE FIRST 30 SECONDS

*(Mapped to the canonical six-beat Rhythm — Arrival → Orientation → Confidence → Action → Understanding → Completion — owned by Experience Language § 5. At the arrival moment the early beats dominate; the later beats are the door opening, not the work itself.)*

```
  SECOND   BEAT           WHAT HAPPENS                    WHAT THE PERSON FEELS
  ─────────────────────────────────────────────────────────────────────────────
  0–2      ARRIVAL        The house is already there,     "Oh — it's calm.
           (the welcome)  lit, the view open. The         Nothing's shouting at me."
                          greeting appears in THA's       Relief. Being expected.
                          hand. Nothing is asked.         The day hasn't started yet —
                                                          and that's allowed.

  2–6      (arrival       The one light moment settles    "This place knows me."
           settling)      warmly on the counter. The      Warmth. Recognition.
                          orchard rests, still and        Not watched — welcomed.
                          alive, beyond the glass.

  6–12     ORIENTATION    A calm line or two: how the     "We're okay. Tonight's
           (how are we /  household is doing, what's      handled. Good."
           what's next)   next — human, honest, thin.     Reassurance. Lightness.
                          Never a wall of metrics.        Stress quietly lifting.

  10–14    (Companion     The Companion takes its chair   "A friend's here if I
           arrives)       a beat after you. Present,      want them — no pressure."
                          waiting, silent unless there    Company. Ease.
                          is something worth saying.

  12–20    CONFIDENCE     The room is honestly what it    "I trust this. It's the
           (it is what    appears — same walls, same      same as yesterday."
           it seems)      morning, nothing rearranged     Trust. Familiarity.
                          to seem busy or new.            Settledness.

  18–26    ACTION         The one clear door is present   "I know exactly what to
           (the door      and reachable — one useful      do next, and it's easy."
           opens)         step, in the light, easy to     Capability without effort.
                          reach. Offered, not forced.     Momentum, gently.

  26–30    UNDERSTANDING  Everything is legible in a      "I'm oriented. I've got
           → COMPLETION   glance; nothing is pending.     this. And I can just… be
           (rest)         Rest is a valid place to be —   here for a second."
                          the calm centre, one step        Calm. Presence.
                          from anywhere.                   → "I've come home."
```

### 8.1 The shape of the journey

The arc moves from **relief → recognition → reassurance → trust → capability → rest**, and it is deliberately *front-loaded on feeling*: the person is made to feel welcomed and known before they are given a single thing to do. Stress comes *down* across the thirty seconds, not up — the opposite of a dashboard, which raises stress by presenting everything at once. By the thirtieth second the person is not "using an app"; they are *standing calmly in a place that kept*, oriented, unhurried, and free to act or simply to be.

### 8.2 The one feeling the whole journey exists to leave

Whatever happens in the seconds after — planning the week, opening the cookbook, closing the app entirely — the arrival's job is done if the person is left holding one sentence:

> **"I've come home."**

Not *"I've checked my dashboard."* Not *"I've opened an app."* Home. The design succeeds exactly to the degree it produces that, and it produces it by *withholding* — by welcoming before working, by staying quiet, by keeping — never by performing warmth at the person.

---

## 9. FIRST LIGHT DESIGN PRINCIPLES

The ten principles that make an arrival a *First Light*. Each is the applied, arrival-specific reading of an owned rule — a design a decade from now stays a First Light by keeping these. (Each routes to its owner; none is new law.)

1. **Arrival before information.** The welcome carries no task; the person is expected before they are asked. A First Light that opens with work is not a First Light. *(Experience Language Principles 1, C; Experience Architecture Principle 2.)*

2. **You are known, once.** The household's name in THA's hand, spent at most once a day. The greeting's power is its scarcity; a greeting on every visit is a greeting worn out. *(Experience Blueprint § 10, § 12.2.)*

3. **One morning, forever.** Always the same bright, warm, upper-left morning — whatever the hour, whatever the mood carried in. Quieter is never darker; the house keeps a different weather than the world. *(Experience Blueprint § 7; Orchard Living Book, *Rain Against The Glass*.)*

4. **The view is generous and quiet.** Home is E3 — the largest view in the house and the least demanding. The orchard holds the eye's rest, never its work, and never carries text. *(Experience Blueprint § 6.2; § 16.)*

5. **A compact counter keeps its share.** One solid, warm, lit working surface, deliberately small so the view keeps its own. Everything the person reads sits on the counter, not on the landscape. *(Experience Blueprint § 5.1, § 8.)*

6. **One door, chosen for them.** Exactly one primary action, appearing only after arrival — the product orienting, the person choosing. Not a menu, not a grid of widgets. *(Experience Architecture Principles 4, 5.)*

7. **Orientation is human, honest, and thin.** *"A calm week ahead,"* not a metrics wall — and honest in absence, confident enough to stay quiet when there is nothing to say. *(Experience Architecture § 4; Experience Language § 3A.4.)*

8. **The friend arrives a beat after you.** The person crosses first; the Companion joins after, waits, and offers only when it matters. That beat is its entire sign of life. *(Experience Blueprint § 13, § 12.2.)*

9. **One light moment, felt not seen.** The single sanctioned motion of arrival reads as morning sun on a counter — once, softly. If the person notices the animation before the content, it has failed. *(Experience Blueprint § 7, § 9.)*

10. **The walls never move; the household is the subject.** The shell is byte-identical and silent; technology and design both quietly disappear, leaving only a person, welcomed, in a place that kept. *(Experience Blueprint § 14, § 1.5; OHDB § 1.2.)*

> **The First Light test, in one line:** *Was the person welcomed home before they were asked to do anything — and did they notice the welcome, not the software?*

---

## 10. THE REASON BEHIND EVERY MAJOR DESIGN DECISION

Why each decision is the way it is — so a future designer changes it only with the reason in hand.

| # | Decision | Why it exists |
|---|---|---|
| 1 | **Arrival is a threshold crossed, not a screen loaded** | The product's entire promise is *a home, not a dashboard* (Experience Blueprint § 4; Experience Language Principle G). A load-and-report opening would make it the thing it is defined against. Arrival must *feel like entering somewhere*, so it is designed as a crossing. |
| 2 | **The greeting is spent once a day, in the signature voice** | The signature hand is the single most protected material in the house; scarcity is its whole value (Experience Blueprint § 10; OHDB § 8). Once a day keeps the warmth from wearing out — the *"greeting worn out by overuse"* the Living Book names — while still meeting every real arrival. |
| 3 | **Welcome carries no task; the one door appears only after arrival** | *Arrival before information* is a governing feeling (Experience Language Principle 1). Presenting work with the welcome would raise stress at the exact moment the product exists to lower it, and would make the first thing the household feels an *obligation* rather than a *welcome*. |
| 4 | **Home is E3, and the counter is compact** | Home is the one room whose *purpose includes the view* (Experience Blueprint § 6.2). A compact counter is the mechanism that lets the view stay generous without the room becoming *all view, no room* (§ 16) — the working surface is real and weighted, but it keeps its share so the orchard keeps its own. |
| 5 | **The orchard is largest in area, quietest in attention, still, and never carries text** | The orchard is *the setting, not the decoration*, and it means *life* (Experience Blueprint § 6, § 1.4; Experience Language § 3A.3). Making it large gives the room its openness and calm; making it quiet and still keeps it from becoming wallpaper or a scene to explore (§ 16); keeping text off it protects legibility, which is never traded for atmosphere (§ 6.1). |
| 6 | **Orientation is one or two human lines, honest in absence** | Home answers *how are we doing, what's next* (Experience Architecture § 4), and it must do so as *a friend, not a manager* (Experience Language § 5.1). A metrics wall is the dashboard failure; a human line that stays silent when there's nothing to say is the home succeeding. |
| 7 | **One primary action, chosen by the product** | *One primary action* and *the product orients, the person chooses* (Experience Architecture Principles 4, 5). A single door removes the small stress of a menu at the threshold and demonstrates the product has already thought on the household's behalf — the core of *"someone has already thought about dinner."* |
| 8 | **The Companion arrives a beat after you and may stay silent** | Manners rendered as timing is the Companion's entire sign of life (Experience Blueprint § 13, § 12.2). Arriving *after* the person keeps the household the subject; allowing silence keeps the Companion from performing usefulness (Experience Language § 5.7). |
| 9 | **One light moment, subordinate to content; nothing else animates** | The house has lighting, not light shows, and the one sanctioned moment is the arrival's (Experience Blueprint § 7). Any motion the person *notices as motion* has failed the governing test (§ 9). Restraint here is what keeps First Light feeling timeless rather than of a fashionable moment (OHDB § 14). |
| 10 | **The shell is byte-identical and does not participate in arrival** | The walls are what make many rooms one house (Experience Blueprint § 14). If the frame animated or varied to make arrival special, every other room would pay for the broken constancy, and the house would lose a wall (Experience Architecture § 8). |
| 11 | **The first arrival differs from later returns (First Light vs. Returning Home)** | The greeting's once-a-day ceiling and the value of *constancy on return* require it (Experience Blueprint § 12.2; Orchard Living Book, *Returning Home*). Re-performing the welcome on every visit would cheapen it and make return feel like a fresh start rather than a homecoming. |
| 12 | **Arrival completes in one viewport, without scrolling** | Stepping through a door shows the whole room at once; making the person scroll to be welcomed would break the feeling of *arriving somewhere*. Scrolling is reserved for *walking further into* the room, never for completing the arrival (Experience Language Principle D). |
| 13 | **No dashboard furniture — no scores, streaks, badges, notification piles** | These are the product proving it was busy while you were away; a home simply *kept* (Orchard Living Book, *Returning Home*; Experience Blueprint § 16). Each would raise stress and shift the subject from the household to the software. |
| 14 | **Home is the gold standard; this design is written to be copied in principle** | The mission fixes Home as the reference every room follows. The transferable pattern — *arrive before work · one view sized to purpose · one compact working ground · one primary action · the friend a beat behind · one light moment · constant walls* — is exactly the four-way room grammar of the Blueprint (§ 5), demonstrated once, correctly, so every later room inherits a proven arrival rather than reinventing one. |

---

## 11. HOW HOME BECOMES THE GOLD STANDARD

First Light is designed so that the *next* room does not start from a blank page. What every future room inherits from Home — the arrival grammar, stated once:

1. **Arrive before you work.** Every room opens with its own miniature arrival — a calm posture before its first task — exactly as the session opens with Home's (Experience Language § 5, the fractal rhythm; Experience Blueprint § 11).
2. **Size the view to the room's purpose.** Home spends the most view (E3) because looking is its purpose; every other room spends less, down its exposure level, because it has more work (Experience Blueprint § 6.2). The *principle* — view sized to purpose — is Home's gift; the *level* is each room's own.
3. **One working ground, one primary action, the friend a beat behind, constant walls.** These do not change room to room; Home simply shows them first and cleanest.
4. **One morning, one orchard, one Companion, one shell — forever.** The constants Home establishes are the constants every room keeps (Experience Blueprint § 5.2).

A future room is *not* free to reinterpret arrival, light, the orchard, the Companion, or the shell. It is free only in the four governed ways a room may differ — purpose, light *level*, material *posture*, and one sign of life (Experience Blueprint § 5). First Light is the worked example that makes that freedom safe.

---

## 12. WHAT IS DELIBERATELY ABSENT

Named so their absence is understood as a decision, not an omission:

- **No dashboard, no metric tiles, no KPI row.** Home is a place, not a report (Experience Language Principle G).
- **No red badges, unread counts, or notification pile** at the door (Experience Blueprint § 16).
- **No onboarding modal, coach-mark, tour, or checklist** interrupting the welcome (Experience Architecture Principle 8).
- **No marketing hero, carousel, or promotional band.** Nothing is being sold to the household in their own home.
- **No load spinner theatre.** The house is simply *there*; the shell and the morning do not "load" (§ 5.3).
- **No confetti, no reward animation, no celebration.** Earned delight only, and arrival is not an achievement to congratulate (Experience Language Principle 10).
- **No animated orchard** — no drifting mist, swaying trees, moving light, parallax, or ambient life (Experience Blueprint § 6.1).
- **No second sun** — no dusk, night-as-mood, fog, or spa-light. One morning (Experience Blueprint § 16).
- **No signature voice beyond the single greeting** (Experience Blueprint § 10).
- **No fabricated warmth** — no drawn kitchens, painted produce, fake steam, handwriting-being-drawn effects. Every warm thing is *true* (Experience Blueprint § 12; OHDB § 3).
- **No task, question, or demand before the welcome has landed.** Arrival first, always (§ 4.2).

---

*A design specification — the first practical design built on the Experience Blueprint (the place), the Orchard House Design Blueprint (the design language), and the Orchard Living Book (the lived account). It applies their rules to one moment and owns only that moment's composition; it restates no rule and creates no second owner. Subordinate to the Experience Architecture, which prevails in any conflict.*
*Nothing here ships until the governance path of § 0.3 is walked (UIA § 4 amendment · tokens by admission · the greeting admitted as its own decision) and the Blueprint's open items on the orchard's owner and Home's header are closed.*
*Rollback: this document is new and uncommitted — to revert entirely, delete the file. Rollback tag for the ORCHARD2 workstream: `rollback/ORCHARD2-first-light-20260715` → `b3c650cd`.*
