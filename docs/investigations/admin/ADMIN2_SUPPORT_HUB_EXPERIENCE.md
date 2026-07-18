<!-- An investigation ANALYSES and RECOMMENDS. It changes nothing. -->

# ADMIN2 — Support Hub Experience — Design Investigation

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Design investigation only. No code, schema, route, component, or token change.
**Risk:** 🟢 GREEN (read-only investigation; product source byte-untouched)
**Author:** Colin Clapson (via Claude Code)
**Prior:** [`ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`](./ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md) — this document is its experience-design companion. ADMIN1 answered *what the console is and what it should surface*; ADMIN2 answers *what it should feel like to use.*

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ADMIN2-support-hub-experience-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| Working tree | **Intentionally dirty** — sibling sessions (NORTH3/4/5, FI18, P0, CONV1, INT19, ADMIN1) hold uncommitted changes at session start. The tag covers **committed state only**; ADMIN2 authors documents only and touches **no product source** (the `git status` modified-list is byte-identical to session start). |
| This task's writes | `docs/investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md`, `.engineering/session/runs/ADMIN2_Support_Hub_Experience.md`, `.engineering/session/CURRENT.md` (row) |
| Rollback | `git checkout HEAD -- docs/investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md` (or delete the file). No code was changed. |

> **Filing-location note (governance over the brief's literal path).** The brief named
> `docs/investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md` — already the governed
> location. `REPOSITORY_CONVENTIONS.md` §4 reserves `docs/investigations/admin/…` for
> *"Admin domain shell, navigation, admin regressions."* This report is filed there, beside
> its ADMIN1 prior. No conflict with the brief.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md` (the governing prior — inventory, IA, defects)
- [x] `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` (the vision & the place — the house, the rooms, **Admin = "the study off the hall"** §4.1)
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (what may happen — §5 Progressive Disclosure, §6 Calm before Capability, §7 One Primary Action, §9 Information Hierarchy)
- [x] `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` (how it feels — §3 the seven feelings, §3A the emotional palette, **§5.9 the Admin six-beat rhythm**, Principle G "Home is not the dashboard")
- [x] `docs/architecture/THA_UI_ARCHITECTURE.md` (how it looks — §7 Calm Orchard, §12 Interaction & State Presentation, §14 Visual Trust, §17 governance/exemptions)
- [x] `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (design-language face — the Admin room reading, "avoid the cold clinical admin-console temperature")
- [x] `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` (conversation-response vocabulary, if the Hub ever surfaces assistant output)
- [x] `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (the Operations layer the Hub surfaces — ADMIN1's governing owner)
- [x] Product source: all 13 `client/src/pages/admin-*-page.tsx` (actions & feedback catalogued at file:line), `admin-page.tsx` (the hub grid), `admin-banner.tsx`

---

## QUESTION

**What should the future Support Hub *feel like* to an operator — its philosophy, information
architecture, and the single interaction pattern every operational task should follow — so that it
reads as another room in the same Orchard House rather than a traditional admin console, and where
does the console fail that standard today?**

*(This is a design brief, not an engineering plan. ADMIN1 already specified what the Hub should
surface and how much of it already has endpoints. ADMIN2 specifies the experience only.)*

---

## METHOD

Two read-only exploration passes reconciled against the governing architecture:

1. **Philosophy pass** — extracted THA's UX law from the six experience/UI documents, with `file:line`
   anchors, to establish the standard the Hub must meet (not to invent one).
2. **Surface pass** — catalogued every operator **action** across the 13 admin pages and, for each,
   exactly what feedback the UI gives (spinner / disabled / toast / confirm / progress / silence),
   at `file:line`. Every action that runs without acknowledgement, progress, or completion signal was
   recorded as a candidate UX defect, per the brief's rule *"silent operations are UX defects."*

Where the two passes met — the governing feeling versus the shipped reality — is where this document's
findings are. Nothing was measured that could not be pointed at in the source.

---

## EXECUTIVE SUMMARY

**The Support Hub does not need a philosophy invented for it. It needs the one THA already wrote,
applied.** The governing architecture is unusually explicit here — it does not merely *permit* an
admin surface to feel like THA, it *requires* it, and it has already given the room a name, a light
level, and a temperature:

> *"THA has one home… Every realm, dialog, **admin surface**, and document is a room, a doorway, or a
> note inside the same house, on the same morning."* — `THA_EXPERIENCE_BLUEPRINT.md:138`
>
> **Admin — "The study off the hall"** — exposure **E0**, *"Task light; the warmth floor still
> applies… Still unmistakably in the house."* — `THA_EXPERIENCE_BLUEPRINT.md:181, :224`
>
> *"**Calm Orchard governs every surface a person can see — product, onboarding, sign-in, settings,
> administrative surfaces**… No surface is exempt as 'internal' or 'temporary'."* — `THA_UI_ARCHITECTURE.md:127`
>
> *"Admin is quieter and denser by necessity, but **never louder, never anxious, and never a second
> product.**"* — `THA_EXPERIENCE_LANGUAGE.md:453`

So the finding that frames everything below:

1. **🔴 THE HEADLINE — the console is the one room that left the house.** Today's `/admin` opens on a
   generic card grid titled *"Admin"* / *"Manage users, configurations, and platform settings"*
   (`admin-page.tsx:189-192`) — the exact *"cold, clinical 'admin console' temperature that leaves the
   house"* the Orchard House blueprint names as the thing to avoid
   (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:308`). It is not that THA lacks a philosophy for operators;
   it is that this room has been built *against* the one THA already binds it to. The brief's whole
   objective — "feel like part of THA, not a traditional admin console" — is therefore a **return to
   governance**, not a new invention.

2. **🔴 The console's defining defect is silence.** THA's state law is that *"every state is
   designed"* (`THA_UI_ARCHITECTURE.md:87`) and that *"completion is acknowledged, quietly"*
   (`THA_EXPERIENCE_ARCHITECTURE.md:181`). The surface pass found **the two operations that mutate
   canonical knowledge — Publish and Roll Back a Knowledge Release — do so with no confirmation, no
   progress, no spinner: a disabled button and a post-hoc toast** (`admin-knowledge-review-page.tsx:738-745,
   :794-799`). The **longest-running operation in the platform — a Full benchmark across up to 10
   households — reports nothing between click and finish but a spinner**, and silently resets those
   households first with no confirmation (`admin-benchmark-households-page.tsx:305-312`). These are not
   edge cases; they are the highest-consequence tasks in the Hub, and they are the quietest. Per the
   brief, **silence is the defect.**

3. **🟠 Feedback is uniform in mechanism and wildly uneven in application.** Nearly every mutation uses
   the same stack (`useMutation` + `useToast` + `disabled` while pending). But toast usage ranges from
   **18 calls in Knowledge Review to 0 in the Intelligence, Observation, and Publication-Integrity
   pages**; some destructive actions confirm, most don't; **no page anywhere reports true progress** —
   there is not one progress bar, percent-complete, or job-status poll in the entire admin surface.
   One mechanism, thirteen dialects.

4. **🟠 "Benchmark" is the case study in task confusion the brief predicted.** It appears on **five
   surfaces**: two *different* pages that both "run the Intelligence Benchmark" (against your live
   household vs. the 10 canonical households — `admin-intelligence-page.tsx:473-481` and
   `admin-benchmark-households-page.tsx:305-312`), one read-only echo (`admin-observation-workbench-page.tsx`
   Tab 8), and **two separate hub cards** presenting them as unrelated (`admin-page.tsx:54-61, :70-77`).
   An operator cannot tell from the hub which page benchmarks what. There is no single obvious place to
   perform the action — a direct violation of the brief's Task-Clarity test.

5. **🟢 The good news, again, is that this is mostly a *presentation* fix, not a build.** The feedback
   mechanism already exists and is already good in places (`admin-recipe-sources-page.tsx` does
   optimistic update with rollback; `admin-canonical-publication-integrity-page.tsx` signals a
   re-verify cleanly). The work is to **name one canonical Operation pattern and make every task obey
   it** — the same "one canonical owner per concern" discipline (`THA_UI_ARCHITECTURE.md:80`) the rest
   of THA already lives by, applied to operator tasks.

**This document delivers seven things** (as the brief requests): a Support Hub UX philosophy, a
recommended information architecture, a progressive-guidance standard, a long-running-task interaction
standard, an operator-feedback standard, the areas of current confusion, and a prioritised set of UX
improvements. **It implements none of them.**

---

## PART 1 — SUPPORT HUB UX PHILOSOPHY

### 1.1 The one sentence

> **The Support Hub is the study off the hall: the room where the house is kept running — the same
> walls, the same warm light, the same calm voice as every other room, only plainer, denser, and
> entered through a door the household never opens.**

Every recommendation in this document is a consequence of that sentence. It is not a metaphor chosen
for charm; it is the room the `THA_EXPERIENCE_BLUEPRINT.md` map already assigns to Admin (`:181`), and
the brief's own instruction — *"another room in the same Orchard House, not a different application"* —
is a restatement of it.

### 1.2 Reconciling "a separate destination" with "the same house"

The brief holds two things that only *look* like a tension:

- *"The Home experience remains exclusively for households."*
- *"The Support Hub is a separate destination for administrators and operators."*
- *"It should feel like entering another room in the same Orchard House — not a different application."*

A real home resolves this exactly. **A study is a separate room** — a household member enters it to do
a different kind of work, and a guest never goes in — **but it is unmistakably the same house**: the
same floor runs under the door, the same daylight temperature, the same walls. The Support Hub is
*separated by access, not by architecture.* THA already draws this line twice:

- **Home is not the operator's room.** *"Home is the emotional place where the household arrives. The
  dashboard is only the first workspace within that home"* (`THA_EXPERIENCE_LANGUAGE.md:348`).
  Operational health, benchmarks, and system state have **no place on Home** — surfacing them there
  would *"turn the household's home into a data screen"* (`:350`). The household's Home stays exclusively
  theirs; the operator's work lives in its own room. This aligns precisely with ADMIN1's frame: the
  Engineering Health Dashboard belongs in the Hub's *"Overview"* stub, **not** on the household Home.
- **Admin is still in the house.** Exposure **E0** means *"no orchard image; the same warm canvas,
  tokens, and light temperature. Still unmistakably in the house"* (`THA_EXPERIENCE_BLUEPRINT.md:224`).
  The Hub does not get its own palette, its own navigation grammar, its own component set, or its own
  tone. *"A room that reaches for its own accent colour to feel distinct has become a costume"*
  (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:142`).

**Design consequence:** the Support Hub inherits, without exception, the shell (the walls), the
canonical component owners, the semantic tokens and palette, the type scale and its voices, the motion
vocabulary, and the state law. It differs from a household room in only the four governed ways a room
may ever differ (`THA_EXPERIENCE_BLUEPRINT.md:158`): **purpose** (running the house), **light** (E0 task
light — plainest in the house), **material** (*"solid working ground"* — dense tables, not soft cards),
and **sign of life** (none — see 1.4).

### 1.3 The seven feelings still apply — including to admin

The emotional palette is *"the temperature of every THA surface, in every realm, in every state —
including errors, empty states, and **admin**"* (`THA_EXPERIENCE_LANGUAGE.md:113`). The Hub must still
feel **calm, thoughtful, decisive, and trustworthy**. What changes at E0 is only the *warmth cues that
are turned down*, never the temperature floor:

| Household rooms | Support Hub (E0) |
|---|---|
| Orchard imagery in the window | **No orchard image** — the warm canvas only (`:224`) |
| A signature/handwritten greeting | **No signature voice** — *"never where it is working for them"* (`THA_UI_ARCHITECTURE.md:183`); admin is working UI |
| One "Living Detail" (a sign of the household's life) | **None — deliberately.** *"Admin is the one room with no Living Detail; its honesty is its warmth"* (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:307`) |
| Soft cards, generous air | **Denser by necessity** — but *"never louder, never anxious"* (`THA_EXPERIENCE_LANGUAGE.md:453`) |

### 1.4 What "warmth" means for an operator: honesty, not decoration

Because the Hub has no Living Detail and no orchard, its warmth has exactly one source: **it tells the
operator the truth, calmly and completely.** *"Its honesty is its warmth."* An operator who always
knows what a task will do before running it, sees it acknowledged the instant it is asked, watches its
progress, and reads an honest outcome — that operator is being *cared for* in precisely the way THA
cares for a household. This is the emotional target for the whole Hub, and it is why the
progressive-guidance and feedback standards below are not "nice to have" polish: **they are the Hub's
only available form of warmth.** A silent operation is not merely a usability gap in the study — it is
the study going cold, which is the one thing this room is forbidden to do.

### 1.5 The five governing principles for the Hub (each inherited, none invented)

1. **Calm before capability.** *"When calm and capability conflict, calm wins"*
   (`THA_EXPERIENCE_ARCHITECTURE.md:133`). A new operational tool earns *"at most, a quiet place in the
   existing hierarchy"* (`:129`) — never a new banner or badge. The Hub grows by adding calm rooms, not
   by getting louder.
2. **One primary action per surface.** *"Every surface has exactly one obvious next thing to do"*
   (`:92`). Each tool leads with its one primary action; everything else is *"present, discoverable, but
   not competing"* (`:139`).
3. **Progressive disclosure by intent.** *"Show the essence first; reveal depth only when the person
   asks"* (`:89`). *"Calm at the threshold; capability on request"*
   (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:109`). This is Part 3.
4. **Every state is designed, and status never lies.** *"Empty, loading, error, and disabled are
   first-class designed states"* (`THA_UI_ARCHITECTURE.md:87`); *"stale or unknown status says so rather
   than posing as current"* (`:263`). This is Parts 4 and 5.
5. **One canonical owner per concern.** *"Every visual concern… has exactly one owning pattern"*
   (`:80`). The Hub needs **one** Operation pattern (Part 6), **one** nav config (ADMIN1's QW-4), and
   **one** obvious place per task (Part 7).

### 1.6 Governance note — a new map row, not an improvised one

If the "Support Hub" is admitted as a *materially* new domain (a rename of Admin, or a broader operator
home than today's console), the Blueprint requires its row be *"added to the map by governance rather
than improvised"* (`THA_EXPERIENCE_BLUEPRINT.md:377`). Absent that, it inherits the **Admin** row's
character verbatim: E0, study-off-the-hall, no Living Detail, task light. **This document recommends the
inheritance, not a new row** — the Hub is the Admin room, done properly, not a new place. Any decision
to formally rename Admin → Support Hub in the canonical map is an owner decision (see Next Steps).

---

## PART 2 — RECOMMENDED INFORMATION ARCHITECTURE

The Hub's IA is **ADMIN1's five-domain map, given a threshold and a voice.** ADMIN1 already established
the canonical grouping (its Part 3); ADMIN2 does not relitigate it — it dresses it as a room.

### 2.1 The room, top to bottom (the Information Hierarchy, §9, applied)

Every THA surface presents in the same descending order of claim on attention
(`THA_EXPERIENCE_ARCHITECTURE.md:157-163`). The Hub is no exception:

```
SUPPORT HUB  (the study off the hall — E0, warm canvas, no orchard image)
│
├─ 1. ORIENTATION  — "You're in the study. Here is how the house is doing."
│     A calm, plain greeting in the one voice (NOT "Manage users, configurations,
│     and platform settings"). Below it: the Engineering Health strip — the few
│     signals that orient an operator in a glance (ADMIN1 Part 4: is the house up,
│     is CI green, is anything red). This fills the permanently-stubbed "Overview"
│     card (admin-page.tsx:14-21) — the natural home ADMIN1 identified.
│
├─ 2. STATE  — the health strip is itself the "how are things?" beat; anything
│     red or UNKNOWN rises here, everything green rests quietly.
│
├─ 3. THE ROOMS OF THE STUDY  — the five domains, each a calm shelf of tools:
│     • Platform        — Engineering Health · Operations · Publication Integrity
│     • Intelligence    — Benchmark & Release · Learning Queue · Observations · Behaviour
│     • Content & Knowledge — Picks · Recipe Sources · Knowledge Review
│     • Access & Users  — Users
│     • Development (DEV-only) — Benchmark Households · Development World
│
└─ 5. DEPTH  — each tool discloses its own guidance and detail on request (Part 3);
      the hub never greets the operator with everything at once.
```

### 2.2 The five IA rules (three from ADMIN1, two added by ADMIN2 for the *experience*)

ADMIN1's three (carried, not re-argued): **one nav owner** (a single `ADMIN_SECTIONS` config consumed by
hub + banner, retiring the divergent second declaration); **one admin guard**; **names match namespaces**
("Learning Queue" / "Benchmark & Release", not two things both called "Intelligence").

ADMIN2 adds two, both about *feeling*:

4. **One threshold, then quiet.** The Hub opens on **orientation, not a wall of tools** — the arrival
   beat THA requires everywhere (`THA_EXPERIENCE_LANGUAGE.md:449`: *"the same calm shell and character…
   administrative surfaces are not exempt from… this rhythm"*). The tool grid is *below* the fold of the
   greeting and health strip, not the first thing that hits the eye. Today `/admin` opens directly on the
   grid with a one-line subtitle — orientation is skipped, which §5.9's diagnostic names exactly:
   *"it opens on information with no arrival."*
5. **Tools are shelves, not a feature billboard.** *"Navigation is boring on purpose… Predictability is
   the feature"* (`THA_EXPERIENCE_ARCHITECTURE.md:153`). Tools are grouped by the operator's mental model
   of *what job they're doing* (run the house / tune the intelligence / tend the knowledge / manage
   people / develop), added rarely, and never reordered for attention.

### 2.3 What does *not* belong in the Hub

- **Nothing household-facing.** The Hub is entered by a door the household never opens; it never
  borrows Home's greeting, its orchard, or its Living Details.
- **No second telemetry store** (ADMIN1's hard line via `THA_OBSERVATION_ENGINE_ARCHITECTURE.md §7`) —
  the health strip *links/projects* existing signals; it never becomes a new owner. This is an IA
  constraint as much as an engineering one: the Hub is a *reading room* over the platform's truth, not
  a second source of it.

---

## PART 3 — PROGRESSIVE GUIDANCE STANDARD

The brief asks that every operational tool show, initially, only a **short description** and its
**primary action**, and let the operator expand for the full explanation. This is THA's three-layer
progressive disclosure (`THA_EXPERIENCE_ARCHITECTURE.md:118-123`) applied to operator tools — *"calm at
the threshold; capability on request"* (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:109`).

### 3.1 The three layers, for a tool

| Layer | For a household entity | For an operational tool |
|---|---|---|
| **1 — Essence** | a meal's name & image | **the tool's name, one honest sentence, and its one primary action** — nothing else |
| **2 — Detail** | the canonical page | **the guidance panel** — What / Why / When / What happens / Duration / Data impact / Production impact |
| **3 — Reasoning** | methodology & provenance | **links to the governing documentation** (the architecture / runbook that owns this operation) |

**Rule (from `:122-123`):** *"Every layer is honest about the next"* and *"disclosure is by intent, not
by accident."* The collapsed tool visibly leads somewhere deeper (a quiet, consistent "What does this
do?" affordance); the depth is never shown because the card had room to fill.

### 3.2 The canonical tool card — collapsed (Layer 1)

Exactly two things, and the primary action obeys §7 (one primary action) and §12 (a designed disabled
state that explains itself):

```
┌────────────────────────────────────────────────┐
│  Run Intelligence Benchmark                      │   ← name (section-title role)
│  Measures the Companion against the 100-question │   ← one honest sentence, plain voice
│  canonical set.                                  │
│                                                  │
│  [ Run benchmark ]              What does this do? ▾ │   ← ONE primary action + disclosure affordance
└────────────────────────────────────────────────┘
```

- **The sentence is honest and plain** (`THA_EXPERIENCE_ARCHITECTURE.md:214`: *"honest verbs"*): *"Measures
  the Companion…"*, never *"Supercharge your intelligence"*.
- **One primary action.** If a tool seems to need two equally-weighted buttons, *"the surface is doing
  two jobs and should be split"* (`:142`). (Benchmark's "Quick / Full / Certification" are one action
  with a mode, not three primaries — see 3.5.)
- **The disclosure affordance is quiet and consistent** — one product-wide "What does this do?"
  expander, styled identically everywhere (the *"one canonical owner"* rule, `THA_UI_ARCHITECTURE.md:80`).

### 3.3 The guidance panel — expanded (Layer 2), the brief's seven questions

On expand, exactly the operator's questions, in this order, each answered in one or two plain
sentences:

| # | Question | What it answers | Example (Run Benchmark) |
|---|---|---|---|
| 1 | **What does this do?** | the mechanism, plainly | "Runs every canonical question against the live Companion and records the scores." |
| 2 | **Why would I run it?** | the operator's intent | "To confirm the Companion is safe and good enough to release after a change." |
| 3 | **When should I run it?** | the trigger | "Before a release, or after any capability or knowledge change." |
| 4 | **What happens?** | the sequence & side effects | "Households are reset to their canonical state, then each question is asked and scored. A new run is added to the benchmark history." |
| 5 | **Expected duration** | honest time, no false precision | "A Full run takes a few minutes; keep this open." (`THA_UI_ARCHITECTURE.md:260`: **no precision theatre** — "~3–5 min", not "00:04:12 remaining" unless the server truly reports it) |
| 6 | **Data impact** | what it reads/writes/resets | "Resets the 10 benchmark households first. Does not touch any real household." |
| 7 | **Production impact** | blast radius on the live platform | "None — read-only against a fixed test world." *(or, for Publish:)* "Changes canonical knowledge every household will see." |
| 8 | **Related documentation** | Layer 3 links | → Benchmark World architecture · release-safety runbook |

**Design laws for the panel:**

- **Calm and uncluttered — the panel is closed by default.** The operator who knows the tool never sees
  the panel; the operator who doesn't, expands it once. *"Depth is never required"* (`THA_EXPERIENCE_ARCHITECTURE.md:122`).
- **Honesty over completeness.** If an answer is unknown (e.g. a duration the server can't estimate),
  the panel says *"varies"* — it never fabricates a number. *"A beautiful surface that conceals a gap is
  a failure"* (`:370`).
- **Production impact is where colour is spent.** The status vocabulary (§7) applies: a tool whose
  Production impact is *"changes what every household sees"* carries the honest warning weight; a
  read-only tool does not. **Colour is never spent on the merely unfinished** (`THA_UI_ARCHITECTURE.md:263`
  — no "red for the merely unfinished").

### 3.4 The panel is also the confirmation

A crucial simplification: **the guidance panel and the confirmation dialog are the same content, shown
at two moments.** When an operator triggers a consequential action, the confirm step *is* the "What
happens / Data impact / Production impact" answers, surfaced as the thing they must acknowledge before
proceeding. This means an operator is never asked to confirm an action whose consequences they were
never shown — the panel that teaches the tool is the panel that guards it. (This directly closes the
Publish/Rollback "no confirmation" defect in Part 5, using content the tool should already carry.)

### 3.5 Benchmark modes — the model for "one action, several shapes"

Where a tool has variants (Quick / Full / Certification), the collapsed card shows **one** primary
action ("Run benchmark") with the mode as a quiet secondary selector, and the guidance panel explains
what each mode costs (duration, coverage). This keeps §7 (one primary action) intact while honestly
disclosing depth — rather than three competing buttons that make the operator choose before they
understand.

---

## PART 4 — LONG-RUNNING TASK INTERACTION STANDARD

The single largest gap the surface pass found: **no page reports true progress anywhere** — not one
progress bar, percent, or job-status poll across all 13 pages. The longest operations in the platform
(a Full benchmark across 10 households; a knowledge publish) show only a spinner. THA's own law is that
*"progress is visible in long journeys — a person mid-journey always knows how much remains and what
happens at the end"* (`THA_EXPERIENCE_ARCHITECTURE.md:180`). The Hub must render that for operators.

### 4.1 The canonical operation lifecycle

Every operation that can take more than a moment runs through **one** visible lifecycle, in the same
vocabulary everywhere (the brief's Operator-Confidence list, mapped to THA's state law and the Admin
six-beat rhythm §5.9):

| State | What the operator sees | THA anchor |
|---|---|---|
| **Acknowledged** | the instant they click, the action confirms it heard — the button enters its pending state, the tool says *"Started…"* | §5.9 Action; *"every state is designed"* (`UI:87`) |
| **Queued** *(if applicable)* | *"Waiting to start — 2 ahead"* — honest, not a fake spinner pretending it's already running | §14 *"stale or unknown status says so"* (`UI:263`) |
| **Running** | a calm, layout-stable progress presentation — *"shape before spin"* (`UI:240`); a determinate bar where the server reports steps, an indeterminate calm placeholder where it can't | §180 "how much remains" |
| **Progress** | *"Question 40 of 100 · household 3 of 10"* when the server exposes it — real counts, **never precision theatre** (`UI:260`) | §14 |
| **Estimated completion** | *"about 2 minutes left"* only if honestly derivable; otherwise *"this can take a few minutes"* — never a fabricated countdown (`UI:263` — no "countdown theatre") | §14 |
| **Completed** | *"Benchmark complete — 100 questions, score 82."* Calm confirmation, **not celebration theatre** (`ExpArch:181`) | §5.9 Completion |
| **Completed with warnings** | *"Complete — 3 questions could not be scored."* The warning tier of the status vocabulary, honest, actionable | §14 semantic colour |
| **Failed** | the calm three-tier error: what happened · what it means · one way forward (`UI:241-244`; `ExpArch:222`) — *"never blame, never celebration styling"* | §12, §14 |
| **Next recommended action** | the completion beat names the next step without demanding it — *"View results"* / *"Review the 3 warnings"* — *"not an immediate demand for the next task"* (`ExpArch:181`) | §5.9 Completion |

### 4.2 The rule that makes it honest (carried from ADMIN1)

**A state that did not run renders as UNKNOWN, never as green or done.** This is ADMIN1's single most
important framework rule (its Part 5), and it applies to every operation here: an operation whose result
was lost (a volatile store cleared, a poll that never returned) says *"outcome unknown — re-run to
confirm"*, never quietly shows the last green. *"A person who believes exactly what the pixels imply
must end up believing the truth"* (`THA_UI_ARCHITECTURE.md:265`).

### 4.3 Where the server can't yet report progress

Honesty about the *mechanism*, not just the result: several operations today are single blocking HTTP
calls with no intermediate signal to report. Where that is so, the standard is **not** to fake a bar —
it is to (a) show the calm indeterminate "running" placeholder, (b) state the honest expected duration
from the guidance panel (*"this can take a few minutes — keep this open"*, which the intelligence page
already does at `:494`), and (c) name the real progress-reporting mechanism (job status / streamed
steps) as a **backend capability the operation needs** — an engineering item, flagged, not designed
away. The experience standard defines the *target*; it does not pretend the plumbing already exists.

### 4.4 The "keep this tab open" fragility

Because these operations are tab-bound blocking calls, closing the tab loses the operator's view of the
outcome (not necessarily the operation). The standard names this as a defect to close: an operation's
outcome should be **recoverable** — an operator who returns to the tool sees *"last run: complete /
failed / unknown"*, not a blank slate. This is the operator-facing twin of the household law that *"a
blank or broken screen is the one unforgivable state"* (`THA_UI_ARCHITECTURE.md:244`).

---

## PART 5 — OPERATOR FEEDBACK STANDARD

The surface pass established that the *mechanism* is uniform (`useMutation` + toast + disabled) and the
*application* is not. The feedback standard is therefore mostly **levelling up to the best pattern
already in the codebase**, not inventing one.

### 5.1 The five things every task must communicate (the brief's Consistency list)

Mapped to THA's law, and to what already exists:

| The task must say | THA anchor | Best existing example |
|---|---|---|
| **What it is** | §5 progressive disclosure (Part 3) | (none yet — cards show a description but no guidance panel) |
| **Why it exists** | §5.9 Orientation | — |
| **What will happen** | §5.9 Action, guarded proportionally | `admin-users` reset-password dialog (`:496-569`) |
| **Current status** | §12 state law; §14 status honesty | `admin-recipe-sources` optimistic toggle w/ rollback (`:121-142`) — best in the app |
| **Final outcome** | §5.9 Completion; §14 UNKNOWN≠green | `admin-canonical-publication-integrity` "Verified {timestamp}" (`:273-277`) |

### 5.2 Confirmation is proportional to consequence — and today it is inverted

THA's law: *"destructive submissions guarded proportionally to their consequence"*
(`THA_UI_ARCHITECTURE.md:252`; `THA_EXPERIENCE_ARCHITECTURE.md`). The surface pass found the guarding is
**inversely** correlated with consequence in the worst cases:

| Action | Consequence | Confirmed today? | file:line |
|---|---|---|---|
| Deactivate one THA Pick | low | ✅ AlertDialog | `admin-ingredient-products:350-369` |
| Reset one benchmark household | medium (test data) | ✅ AlertDialog | `admin-benchmark-households:469-483` |
| **Publish knowledge release** | **🔴 changes canonical knowledge every household sees** — code calls it *"the only operation that changes canonical knowledge"* | ❌ **none** | `admin-knowledge-review:738-745` |
| **Roll back knowledge release** | **🔴 deactivates aliases, reverts proposals** | ❌ **none** | `admin-knowledge-review:794-799` |
| **Run Full benchmark** | resets 10 households as a side effect | ❌ **none** | `admin-benchmark-households:305-312` |
| Fix account | repairs a real user's household | ❌ none | `admin-users:394-404` |

**Standard:** confirmation weight tracks the guidance panel's *Production impact* line. A tool that
*"changes what every household sees"* gets the fullest confirm (the guidance panel, surfaced as the
gate — Part 3.4); a read-only re-verify gets none. **The two canonical-knowledge mutations are the
single highest-priority correction in this document.**

### 5.3 Feedback consistency rules

1. **One acknowledgement moment, always.** Every mutation confirms it was heard the instant it's
   triggered (pending state on the primary action), and every mutation resolves to a stated outcome
   (toast in the operation-error voice, or an inline result). No action is fire-and-forget. This closes
   the **exports** defect (`admin-observation-workbench:1034-1039`, `admin-behaviour:613-617`) which
   today toast *only on failure* — a successful export gives the operator nothing.
2. **Loading is silent and shaped** (`THA_UI_ARCHITECTURE.md:240`). Queries render layout-stable
   skeletons, not spinner theatre or full-page "Loading…". Several pages already do this; it becomes the
   rule.
3. **Errors are the calm three tiers** (`:241-244`), never a wall of red, never blame. An operation
   error states what happened, what it means, and the one way forward.
4. **Status never poses as current.** Timestamps on every computed result (as
   publication-integrity already does), and UNKNOWN for anything stale or unrun (5.1, 4.2).
5. **Toast is for outcomes, not narration.** A toast marks *completion / warning / failure* — it does
   not narrate progress (that's Part 4's job) and it does not celebrate (*"a saved form says 'Saved'"*,
   `:253`).

---

## PART 6 — THE SINGLE INTERACTION PATTERN (the Operation Card)

Parts 3–5 converge on **one canonical pattern** the brief asks for — *"a single interaction pattern for
every operational task."* Call it the **Operation Card**. It is to operator tasks what the Companion
Card is to conversation responses (`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`): one reusable owner
every tool adopts rather than each page improvising.

```
COLLAPSED (Layer 1 — essence)
┌──────────────────────────────────────────────────────┐
│  {Tool name}                                           │
│  {One honest sentence.}                                │
│  [ {Primary action} ]            What does this do? ▾  │
│  {Status line — only when there is honest status to    │
│   show: "Last run: complete · 2h ago" / "Running…" }   │
└──────────────────────────────────────────────────────┘

EXPANDED (Layer 2 — guidance / also the confirm gate)
   What does this do? · Why · When · What happens ·
   Expected duration · Data impact · Production impact
   → Related documentation (Layer 3)

RUNNING (Part 4 lifecycle)
   Acknowledged → Queued → Running (progress) → Completed /
   Completed-with-warnings / Failed → Next recommended action

Every state designed · status never lies · UNKNOWN ≠ green ·
one primary action · confirmation proportional to consequence.
```

**Why one pattern, not thirteen dialects:** *"Every visual concern… has exactly one owning pattern.
Every other occurrence uses that owner; none re-implements it"* (`THA_UI_ARCHITECTURE.md:80`). A single
Operation Card means: a new admin tool *cannot* be silent (the pattern won't let it ship without a
lifecycle), *cannot* skip its guidance (the pattern carries the seven questions), and *cannot* invent a
fourteenth feedback dialect. It is the same discipline that makes the rest of THA cohere, applied to the
one room that has so far escaped it. It also makes the **adoption register** (ADMIN1 QW-4 / UI §17)
meaningful for operator tools: *"authored-but-unadopted must be impossible to hide."*

---

## PART 7 — AREAS OF CURRENT CONFUSION (Task Clarity)

The brief's Task-Clarity test, applied to every tool: *is its purpose obvious; could a new admin know
when to use it; is there duplication; is there a single obvious place to perform it?*

### 7.1 Benchmarking — the worst offender (reviewed carefully, as the brief directs)

| Surface | Role | Runs a benchmark? | file:line |
|---|---|---|---|
| `admin-intelligence-page` ("Intelligence Workspace") | runner + dashboard, vs. **your live household** | ✅ | run `:473-481`; mut `:971-988` |
| `admin-benchmark-households-page` | runner, vs. **the 10 canonical households** | ✅ | run `:305-312`; mut `:150-161` |
| `admin-observation-workbench-page` Tab 8 | **view-only** echo of observed runs | ❌ | `:830-926` |
| `admin-companion-intelligence-page` | "Companion Health" cross-linked from Intelligence | ❌ | linked `:1050-1057` |
| `admin-page` hub | **two separate cards** ("Benchmark Households", "Intelligence Dashboard") presented as unrelated | ❌ | `:54-61`, `:70-77` |

**The confusion, precisely:** two different pages both "run the Intelligence Benchmark" against two
different worlds (live vs. canonical), their results land in the same run history, and the hub lists
them as unrelated cards — so an operator cannot answer *"where do I go to benchmark?"* from the hub.
The intelligence page even carries a **World Mode banner** (`:517-540`) explaining that a live-household
run is *"not reproducible"* while canonical households are — which is exactly *why* two runners exist,
but that rationale is invisible from the entry point.

**Fix (design, not build):** one obvious place to benchmark, with the *world* as an honest, explained
choice inside it — *"Run against my household"* vs *"Run against the canonical households"* — carrying
the reproducibility note from the World Mode banner into the guidance panel (Part 3.3). The view-only
observation echo is made visibly distinct (a *record*, not a *runner*). The two hub cards collapse to
one "Benchmark & Release" entry (ADMIN1's IA rename). This is the brief's "single obvious place"
principle, applied.

### 7.2 The naming collisions (ADMIN1 §2.4, restated as operator confusion)

- *"Companion Intelligence"* (a **learning approval queue**) vs *"Intelligence Dashboard"* (a **benchmark
  score**) — two hub cards both named "Intelligence", doing unrelated jobs. A new admin cannot tell which
  is which. → Rename to *"Learning Queue"* and *"Benchmark & Release"* (names match namespaces).
- *"Observation Workbench"* vs *"Behaviour Workbench"* — aggregate telemetry vs. single-interaction
  timeline. Legitimately different, but the names don't teach the difference. → The guidance sentence
  (Part 3.2) carries the distinction: *"fleet-wide telemetry"* vs *"reconstruct one interaction."*

### 7.3 The hub itself teaches nothing

Today's hub card shows title + one description line and nothing about *when* an operator would use each
tool (`admin-page.tsx:13-110`). A new administrator lands on 12 cards with no orientation and no sense of
which they need. → The Operation Card's collapsed state (name + honest sentence + primary action)
already fixes this at the tool; the hub grid additionally groups by the five domains (Part 2) so the
operator's first question — *"what am I here to do?"* — is answered by the shelf they're standing at.

### 7.4 Silent operations are the deepest confusion

Per the brief's rule, every operation that runs without acknowledgement/progress/outcome is a UX defect.
The catalogue's silent or under-signalled operations, ranked:

1. 🔴 **Knowledge Publish / Roll Back** (`admin-knowledge-review:738-745, :794-799`) — canonical-mutating,
   no confirm, no progress, no spinner; disabled button + post-hoc toast only.
2. 🔴 **Benchmark runs** (`admin-benchmark-households:305-312`; `admin-intelligence:473-481`) —
   longest-running, no progress beyond a spinner; benchmark-households additionally silently resets
   households first with no confirm.
3. 🟠 **Approve / Reject / Bulk-edit knowledge proposals** (`:399-404`, `:603-608`, `:1291`) — state
   changes, no confirmation.
4. 🟠 **Fix account** (`admin-users:394-404`) — repairs a real household, no confirmation.
5. 🟠 **Exports** (`admin-observation:1034-1039`; `admin-behaviour:613-617`) — fire-and-forget; success
   is unacknowledged (toast on failure only).

---

## PART 8 — PRIORITISED UX IMPROVEMENTS

Severity: 🔴 (operator can cause high-consequence change blind, or the room has left the house) ·
🟠 (real confusion / inconsistency) · 🔵 (polish). Effort mirrors ADMIN1's legend: **XS** copy/label ·
**S** apply an existing pattern · **M** new presentation over existing data · **L** needs backend
capability. **None is authorised here — each is an owner-gated change under `ENGINEERING_WORKFLOW.md`.**

| Prio | Improvement | Sev | Effort | Anchor |
|---|---|---|---|---|
| **QW-1** | **Confirm + guidance-gate the two canonical-knowledge mutations** (Publish, Roll Back). Surface the guidance panel (What happens / Data impact / Production impact) as the confirm step. | 🔴 | S | Part 3.4, 5.2 |
| **QW-2** | **Give benchmark runs the lifecycle** (Part 4): acknowledged → running (honest duration) → completed/failed → next action; confirm the silent household reset. | 🔴 | M | Part 4 |
| **QW-3** | **Re-dress the hub as the study's threshold**: a plain greeting + Engineering Health strip in the "Overview" stub, tools grouped by the five domains — retire *"Manage users, configurations, and platform settings."* | 🔴 | S | Part 1, 2 |
| **QW-4** | **One obvious place to benchmark**: consolidate the two runners behind a world choice; make the view-only echo visibly a record; collapse the two hub cards to one. | 🟠 | M | Part 7.1 |
| **P1-1** | **Adopt the Operation Card as the one pattern**; migrate tools to it; register adoption (UI §17). | 🟠 | L | Part 6 |
| **P1-2** | **Level feedback to the best existing pattern**: acknowledge every mutation, acknowledge successful exports, skeletons not spinners, three-tier errors, timestamps + UNKNOWN≠green everywhere. | 🟠 | M | Part 5 |
| **P1-3** | **Rename for namespaces**: "Learning Queue", "Benchmark & Release"; guidance sentences that teach Observation vs Behaviour. | 🟠 | XS | Part 7.2 |
| **P1-4** | **Confirm the remaining state-changing actions** proportional to consequence (Approve/Reject, Bulk-edit, Fix account). | 🟠 | S | Part 5.2 |
| **P2-1** | **Progressive guidance panels on every tool** — the seven questions, closed by default. | 🟠 | M | Part 3 |
| **P2-2** | **Recoverable operation outcomes** — a tool returned-to shows last run / failed / unknown, not a blank slate. | 🟠 | M | Part 4.4 |
| **P3-1** | **Real server-side progress reporting** (job status / streamed steps) so Part 4's determinate progress is honest, not indeterminate. | 🔵 | L | Part 4.3 |

---

## OPTIONS

| Option | Description | Cost | Risk | Reversible? |
|---|---|---|---|---|
| **A — Pattern-first** (recommended) | Define the Operation Card as the one canonical pattern, fix the 🔴 silent/unconfirmed high-consequence tasks first (QW-1/2/3/4), then migrate the rest to the pattern incrementally. | Low→Med | Low (presentation over existing data; the confirms *reduce* risk) | Fully |
| B — Full re-skin | Rebuild all 13 pages to the pattern in one pass. | High | Med (large surface, no incremental safety) | Costly |
| C — Do nothing | Leave the console as-is. | Zero | **High** — the highest-consequence operations stay blind and unconfirmed; the room stays "left the house." | n/a |

---

## RECOMMENDATION

**Adopt Option A.** The Support Hub does not need a new philosophy — it needs THA's own, applied to the
one room that escaped it. Define **one** Operation Card pattern (Part 6) carrying progressive guidance
(Part 3), the operation lifecycle (Part 4), and the feedback standard (Part 5); then **fix the 🔴 items
first**, because they are the highest-consequence and quietest tasks in the platform: gate the two
canonical-knowledge mutations behind their own honest guidance (QW-1), give benchmark runs a visible
lifecycle and confirm their silent reset (QW-2), re-dress the hub as the study's calm threshold (QW-3),
and give benchmarking one obvious home (QW-4). Each is presentation over data that already exists, each
*reduces* operator risk, and each moves the room back inside the house.

**What would change this recommendation:** if the owner wants to formally rename **Admin → Support Hub**
in the canonical experience map (`THA_EXPERIENCE_BLUEPRINT.md §5.1`), that is a governance amendment
(a new/renamed map row, `:377`) and must be taken to the owning architecture before any build — this
document recommends *inheriting the Admin room's character*, not minting a new one.

---

## ARCHITECTURE COMPLIANCE

The design **complies** and is deliberately derived from, not merely checked against, the governing
documents:

- **`THA_EXPERIENCE_BLUEPRINT.md §4.1`** — the Hub is the **Admin room** ("the study off the hall", E0,
  no Living Detail), a room *inside* the one house, never a second application. The recommendation adds
  no new map row without governance (`:377`).
- **`THA_EXPERIENCE_ARCHITECTURE.md §5–§9`** — progressive disclosure (three layers), one primary
  action, calm before capability, and the standard information hierarchy are applied verbatim to
  operator tools.
- **`THA_UI_ARCHITECTURE.md §12, §14, §17`** — every state designed; status never poses as current;
  UNKNOWN≠green; one canonical owner (the Operation Card) with a register entry. No new palette, token,
  or component family is proposed — the Hub uses the existing owners.
- **`THA_EXPERIENCE_LANGUAGE.md §3A, §5.9`** — the seven feelings (incl. admin), *"calm must never
  become lifeless"*, and the Admin six-beat rhythm are the spine of the feedback and guidance standards.
- **`ADMIN1` prior** — the five-domain IA, the "Overview" stub as the dashboard's home, and the
  UNKNOWN≠green rule are carried, not re-derived; ADMIN2 is its experience face, adding no second owner.

No conflict found. Any change that would give the Hub its own palette, navigation grammar, component
set, or a formal new map-row identity must **STOP** for owning-architecture review.

---

## DATA IMPACT

None — design investigation only. No data read into behaviour, no store, no schema, no route, no
component, no token.

---

## TRUST CHECK

- **Stated more confidently than the evidence supports?** No. Every defect cites a `file:line` from the
  surface pass (Publish `:738-745`; Rollback `:794-799`; benchmark run `:305-312`; toast-usage spread
  counted across the 13 pages). Every philosophy claim cites the governing document at `file:line`.
- **Guessed but presented as measured?** No. "No progress reporting anywhere" is the surface pass's
  finding across all 13 pages; where the *server* cannot yet report progress, the document says so
  (Part 4.3) rather than pretending the plumbing exists.
- **Unknowns listed as plainly as findings?** Yes: the backend job-status capability (Part 4.3, P3-1),
  the Admin→Support Hub rename as an *unmade governance decision* (Part 1.6, Recommendation), and the
  "keep this tab open" fragility (Part 4.4) are all named as open, not resolved.
- **Is the metaphor doing work the evidence doesn't?** No. "The study off the hall" is not ADMIN2's
  invention — it is the canonical Admin row (`THA_EXPERIENCE_BLUEPRINT.md:181`); the document applies it,
  it does not romanticise it.

---

## OUTCOME

The future Support Hub is specified as an *experience*: **the study off the hall** — the same house,
plainer light, entered by a door the household never opens — whose only warmth is that it tells the
operator the truth calmly and completely. Seven deliverables are provided (philosophy, IA, progressive-
guidance standard, long-running-task standard, feedback standard, areas of confusion, prioritised
improvements), all as the *application of THA's existing law* to the one room that had drifted out of
it. The console's real defects are located precisely — **silence at the highest-consequence tasks**
(canonical-knowledge Publish/Rollback, benchmark runs), **feedback uniform in mechanism but uneven in
application**, and **benchmarking scattered across five surfaces with no single home** — and every one
is correctable mostly by *presentation*, using patterns already present in the codebase's better pages.

## NEXT STEPS

Owner decisions unblock the work:

1. **Option A vs B** (pattern-first incremental vs full re-skin) — recommendation: **A**.
2. **Admin → Support Hub rename?** — if yes, a governance amendment to the experience map is required
   *before* build (this document recommends inheriting the Admin row, not a new one).
3. **Backend progress capability** (P3-1) — is job-status/streamed-step reporting in scope, or does the
   long-running standard ship with honest indeterminate "running" until then?

On approval, QW-1…QW-4 become normal decision-gated implementations under `ENGINEERING_WORKFLOW.md` —
none is authorised here.

---

## FUTURE OPPORTUNITIES (not approved)

- **The Operation Card as a shared operator primitive** with a registry entry (UI §17) — the operator
  twin of the Companion Card.
- **Recoverable, resumable operations** (Part 4.4) — outcomes that survive a closed tab.
- **An operator's "how the house is doing" arrival** — the Engineering Health strip (ADMIN1 Part 4) as
  the Hub's true orientation beat, not a card.
- **A calm operator activity log** — the study's own quiet record of what was run, by whom, and how it
  resolved (honest history, not telemetry — distinct from the Observation Engine).

---

## SCOPE LOCK

- **Implemented scope:** none — design investigation and this document only.
- **Explicitly excluded:** every code, route, schema, endpoint, component, and token change; nothing
  was built. Product source is byte-untouched.
- **Suggestions (do not implement without approval):** the entire prioritised roadmap, options, and
  future opportunities above are recommendations pending owner decision.
