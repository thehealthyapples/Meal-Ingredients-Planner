# EXP2 — Arrival Experience Exploration

**Status:** DELIVERED — five development-only prototypes awaiting review
**Classification:** Experience exploration (implementation report)
**Date:** 2026-07-15
**Session:** `EXP2_Arrival_Experience_Exploration`
**Rollback:** `rollback/EXP2-arrival-exploration-20260715` → `74aaa8da`
**Governing documents read before work:** `docs/architecture/README.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` (incl. § 4A Place Principles)

> **What this is.** Five separate, development-only Arrival Experience
> prototypes, each a genuinely different interpretation of the THA Experience
> Language — not five cosmetic variations of one idea. The purpose is
> exploration: **the objective is not to choose a winner but to discover which
> individual ideas should become part of the final THA Experience.** The live
> Home (`/home`) is untouched. The existing ARRIVAL1 prototype (`/dev/arrival`)
> is untouched and still awaits its own decision.

---

## 1. What is constant across all five

Every prototype holds the same things fixed, so that the ONLY variable is the
emotional experience of arriving:

- **The canonical shell.** Each page renders the byte-identical header line the
  live Home renders (`WorkspaceHeader realm="home" title="Home" wide`), inside
  `ProtectedRoute` — the same orchard backdrop, bottom navigation, error
  boundary and Companion every authenticated page gets. No prototype restyles,
  reflows or animates the shell (Principles 9 / E: the frame earns no exception,
  even for an arrival).
- **The canonical owners.** Card, Button, Skeleton, LoadError, MealCard — no
  component is forked, no second header exists, no bespoke navigation exists.
- **The data.** All five read the SAME react-query keys as the live Home
  (`/api/planner/full`, meals summary, shopping list, `/api/home/intelligence`,
  companion notices) via one shared dev-only hook — shared cache entries, zero
  extra fetches, no owned state. Loading renders as skeletons, failure as the
  canonical `LoadError`, absence as honest emptiness. Nothing is fabricated.
- **The Companion.** The ONE `FloatingAssistant`, never re-rendered or animated
  by a prototype — only *withheld* (the existing `withheld` channel) until each
  arrival settles, then released to make its own entrance.
- **The gates.** Reduced motion ⇒ **no arrival at all** — the finished
  workspace immediately (a guarantee, not a faster animation). One arrival per
  prototype per session (a return is navigation, not a first impression);
  `?replay` re-plays for review. Every sequence is choreography, never a queue:
  all content is in the DOM and interactive from the first frame.
- **Development-only, provably.** Each route exists only under
  `import.meta.env.DEV` (ARRIVAL1's compile-time ternary), and the production
  build was verified: no EXP2 chunk, none of the prototypes' strings, in `dist/`.

**Shared infrastructure:** `client/src/pages/dev/exp2-shared.tsx` (data hook,
arrival gate, parity workspace). **Evidence:**
`docs/ui-audit/exp2-arrival-explorations/` (stills, webm recordings, GIFs, and
`control-{desktop,mobile}-live-home-unchanged.png` as the untouched control).

---

## 2. Prototype A — The Welcome

**Route:** `/dev/arrival-a-welcome`
**File:** `client/src/pages/dev/arrival-a-welcome.tsx`
**Evidence:** `a-welcome-{desktop,mobile}-01-greeting-held / 02-giving-way / 03-workspace / 04-reduced-motion.png` · `video/a-welcome-{desktop,mobile}.{webm,gif}`

**Emotional objective.** *Can THA feel like somebody is welcoming you home?*
The entire budget is spent on the greeting: the hand, the timing, the breathing
space, the pause. There is deliberately no environment moment, no sheen, no
glide — the exploration is whether words, warmth of colour and above all TIME
are enough on their own.

**What it does.** A calm cream field. THA writes the time-of-day greeting in its
own hand — *Good morning / Good afternoon / Good evening* — the name settles
beneath, and then **nothing happens, on purpose, for ~3.5 seconds**. The
greeting is held, whole and unhurried, before a single slow crossfade lets the
words recede as the ordinary workspace (header already in place) comes through.
Settled at ~7.6s; the Companion arrives after.

**Strengths**
- **The pause is the prototype's discovery.** Held stillness reads as being
  *met*, not as latency — the strongest pure-warmth lever of all five, and it
  costs no pixels, no motion, no new machinery.
- **A greeting that knows what time it is feels like a person.** "Good evening"
  lands categorically warmer than a fixed phrase; it is honest (a clock, not a
  simulation of emotion) and almost free.
- The single crossfade exit — words receding *as* the room arrives — never
  cuts, never blinks, and reads as the hello giving way to the home.

**Weaknesses**
- **It is the most expensive arrival in the set** (~7.6s to rest). It yields
  instantly to intent and plays once per session, but as a daily beat this
  length flirts with the anti-pattern *"a welcome you cannot get past is a
  toll"* — the pause that feels generous on Monday may feel like a queue by
  Friday.
- The cream field hides the shell for the whole welcome. Prototype B proves the
  frame-visible-from-frame-one alternative is also viable — hiding the walls is
  a choice, not a necessity, and it spends some of Principle 9's reassurance.
- Two full-screen scenes on one route means the workspace is below the first
  viewport for a returning scroll — inherent to the scene structure, invisible
  in practice but structurally heavier than C/D/E.

**Carry forward**
1. **The time-of-day greeting text** — into whatever arrival is adopted, and
   arguably into the live Home's greeting today.
2. **The held pause, shortened.** The principle (hold, then recede — never
   blink out) matters more than the duration; ~2s of stillness likely buys most
   of the feeling at half the cost.
3. The crossfade-as-giving-way exit shape.

---

## 3. Prototype B — The Orchard

**Route:** `/dev/arrival-b-orchard`
**File:** `client/src/pages/dev/arrival-b-orchard.tsx`
**Evidence:** `b-orchard-{desktop,mobile}-01-morning-light / 02-furnishing / 03-settled / 04-reduced-motion.png` · `video/b-orchard-{desktop,mobile}.{webm,gif}`

**Emotional objective.** *Can users feel they are entering a place rather than
opening software?* The budget is spent entirely on environment: the orchard,
the light, the constancy of the walls. No greeting text at all.

**What it does.** You are in the orchard from the first frame — header and
navigation fully visible (the walls never assemble in front of you), and for
the first breath the shared orchard backdrop IS the content. A soft wash of
warm morning light lies over the canvas and settles into ordinary daylight
(light meaning exactly one thing, once: *morning — you're welcome here*,
Principle F), while the workspace rises gently into place as ONE piece — a room
already prepared coming to meet you. Still at ~3.4s.

**Strengths**
- **Shell visible from frame one is the strongest orientation story in the
  set.** Nothing lurches, nothing is hidden and revealed; the walls are simply
  there, and the arrival happens *inside* them. This is § 4A Principle E made
  literal, and it makes the whole sequence feel safe.
- The light wash is the most place-like single device tried — felt, not
  spotted; it disappears into "this feels warm" exactly as Principle 5/6 ask.
- The furnish-as-one-piece reveal (opacity + a few px of settle, one unit,
  once) delivers "a place settling, never a screen loading" at less than half
  ARRIVAL1's duration.
- Cheapest full arrival: no webfont, no extra scene, no scroll choreography.

**Weaknesses**
- **Without words, some people will not register it as a welcome at all** — the
  emotional signal is real but quiet, and quiet signals are missable. B on its
  own may read as "the page faded in nicely".
- The empty-orchard first beat (content absent for ~1.3s) risks being read as a
  *loading* state by a household trained by other software — the exact
  confusion between "the room before the furniture" and "the skeleton before
  the data" the state law exists to avoid. The distinction is felt on the
  recording but is fragile on a slow connection where real skeletons follow.
- The wash must never grow. At 0.30 opacity it is atmosphere; a stronger value
  would tip into a light *show* (Principle F's boundary is close by).

**Carry forward**
1. **The shell present from frame one** — this should be the default posture of
   any adopted arrival unless the full-cream welcome earns its exception.
2. **Light as the one welcome device** — a single settling wash is a gentler,
   cheaper sibling of ARRIVAL1's logo sheen; at most one of the two should
   survive into the adopted arrival.
3. The one-piece furnish as the standard way a workspace enters.

---

## 4. Prototype C — The Workspace

**Route:** `/dev/arrival-c-workspace`
**File:** `client/src/pages/dev/arrival-c-workspace.tsx`
**Evidence:** `c-workspace-{desktop,mobile}-01-orientation / 02-composed / 03-reduced-motion.png` · `video/c-workspace-{desktop,mobile}.{webm,gif}`

**Emotional objective.** *Can Home feel like arriving in a beautifully prepared
kitchen?* The budget is spent on the room itself — hierarchy, composition,
information ordering, visual breathing — with almost no choreography.

**What it does.** The canonical hierarchy taken literally, one tier per visual
register: **orientation** (the date, "Today") → **state** (one honest sentence:
*"Today is planned."* / *"Today is open."*, said only once it is actually known,
never while loading) → **the primary** (today's meals, the one card and the one
action) → **support demoted from cards to two quiet rows** (shopping, plants —
a prepared kitchen does not present the salt with the meal's ceremony) → one
reminder → one way deeper. The reveal is two beats only: orientation lands,
then the WHOLE of the rest arrives as one piece — deliberately not UXHOME1's
card-by-card sequence, which was already tried and discarded. Still at ~2.2s.

**Strengths**
- **The state sentence is the purest execution of Principle 1 in the set** —
  the most reassuring fact (*today is under control*) reaches the person before
  any detail, in four words, honestly derived, at zero visual cost. It is also
  the cheapest idea in the whole exploration to adopt anywhere.
- **Demoting shopping/plants from cards to rows produces a real hierarchy.**
  With one card on the surface, the primary is unmistakable; the two-second
  rule passes with room to spare, and the composition visibly breathes.
- The least motion of any prototype that still *has* an arrival: two opacity
  beats, then permanent stillness.

**Weaknesses**
- **It is the least *welcoming* of the five.** There is no greeting of any kind
  — "Today" orients but does not greet. As the first arrival of a day it feels
  prepared rather than met; C is a room, not a hello.
- The two-beat reveal sits closest to the discarded UXHOME1 territory of any
  choice here; it stays on the right side (two beats, one piece each) but the
  boundary should be written down if adopted.
- The state sentence needs vocabulary care at the edges (partial days, only
  breakfast planned, plan for tomorrow but not today) — "planned/open" is
  honest today because it is derived from the same rows the card details, but
  the sentence must never promise more than the card shows.

**Carry forward**
1. **The state sentence** — the single highest-value/lowest-cost idea in the
   exploration; a strong candidate for the live Home regardless of what happens
   to arrivals.
2. **Support-tier demotion** (cards → quiet rows) — a live-Home candidate on
   its own merits; it makes the primary primary.
3. The two-beat ceiling: if a reveal exists at all, orientation first, then
   everything else as one piece — never more beats than two.

---

## 5. Prototype D — Quiet Intelligence

**Route:** `/dev/arrival-d-quiet`
**File:** `client/src/pages/dev/arrival-d-quiet.tsx`
**Evidence:** `d-quiet-{desktop,mobile}-01-prepared / 02-companion-arrived / 03-reduced-motion.png` · `video/d-quiet-{desktop,mobile}.{webm,gif}`

**Emotional objective.** *Can intelligence feel naturally present without
demanding attention?* Its boldest move is having no choreography at all — the
thesis is that the most convincing intelligence at the moment of arrival is not
an animation but a room that has visibly **already been prepared**.

**What it does.** One gentle 0.6s fade of the whole page, then stillness. The
intelligence is entirely in the content: the Notice Engine's single most
relevant sentence sits beneath the greeting like **a note left on the counter**
("From your companion", rendered verbatim from the Behaviour Engine, demanding
nothing); the primary action's label already knows today ("Plan today" vs "Open
today's plan"); and the Companion itself arrives a beat AFTER the person does
(~1.5s) — present, available, and conspicuously not pouncing on entry (§ 5.7).
If there is no notice, there is no note: silence is a first-class outcome.

**Strengths**
- **The companion-arrives-after-you beat is the best single idea here.** It
  turns an existing mechanism (the withheld channel) into a felt statement of
  manners: *you* arrive first; the intelligence joins you. It costs one timing
  constant and works with every other prototype.
- The note-on-the-counter placement gives the Notice Engine's sentence real
  presence — attributed, calm, one sentence, one place — without any new
  machinery, priority logic, or second attention budget.
- The most honest interpretation possible of "invisible intelligence": nothing
  performs; the preparation IS the evidence (Principle 7; § 3's counterfeit
  test passes trivially because there is nothing to counterfeit with).

**Weaknesses**
- **The thesis is hostage to the Notice Engine's quality.** With a strong
  observation, D feels uncannily attentive; with none it is indistinguishable
  from a plain fade into Home. Honest — but it means the *feeling* is
  probabilistic, which an arrival cannot fully rely on.
- The observation sits above the primary card, between the greeting and the
  work. On days when the sentence is routine, the most prominent early position
  is occupied by the least important content — an information-ordering tension
  with C's strict hierarchy (and with Principle C's clean seam between welcome
  and content: a note is not work, but it is *reading*).
- "From your companion" introduces a user-facing label that must join the
  one-name-per-concept vocabulary deliberately if adopted, not by default.

**Carry forward**
1. **The Companion's delayed, mannerly entrance** — adoptable everywhere,
   including the live Home, independent of every other idea.
2. The note-on-the-counter as the canonical *presentation* shape for a Home
   observation — but likely positioned after the primary (C's ordering), not
   before it.
3. The truth-following primary label (already ARRIVAL1's; reconfirmed here).

---

## 6. Prototype E — Premium Restraint

**Route:** `/dev/arrival-e-restraint`
**File:** `client/src/pages/dev/arrival-e-restraint.tsx`
**Evidence:** `e-restraint-{desktop,mobile}-01-settled / 02-reduced-motion.png` · `video/e-restraint-{desktop,mobile}.{webm,gif}`

**Emotional objective.** *How little can we do while making THA feel
world-class?* The budget is spent on subtraction: whitespace, typography,
pacing, light — and the removal of everything else.

**What it does.** One unhurried 0.9s fade of one radically reduced composition,
then nothing ever moves again. The greeting is the display voice at full size —
typography IS the welcome; no signature hand, no second line of copy. ONE
surface: today's meals and the one action, floating in daylight and breathing
space. Shopping, plants and the reminder are not demoted — they are **absent**,
reachable only through the one quiet way deeper. The exploration deliberately
overshoots the floor to find it.

**Strengths**
- **It proves the premium claim: restraint reads as expense.** The one-card
  composition photographs like the most finished surface of the five, and
  nothing in it can be pointed to — which is § 4A Principle H's definition of
  success (*"this feels expensive, and I couldn't tell you why"*).
- The fastest to rest (≈1.2s), making it the natural register for a **return**
  — the tenth arrival of the week — where any longer welcome would be a toll.
- The large display greeting carries genuine warmth without the signature
  voice, which usefully calibrates how much of A's warmth is the *hand* and how
  much is simply the *words given room*.

**Weaknesses**
- **It overshoots.** Removing shopping and plants doesn't just quiet the room —
  it half-unanswers Home's own question, *"how are we doing, and what's
  next?"*. A glanceable Home owes the household its at-a-glance state; E's
  floor is below the UX checklist's "Home unharmed" line if read as a Home
  replacement (it is not one — but the finding stands: **the floor is above
  this**).
- With no state sentence and no supporting facts, reassurance rests entirely on
  the meals card; on an empty day E's whole content is "Nothing planned for
  today yet", which reads sparse rather than serene.

**Carry forward**
1. **The pacing** — a single ~0.9s fade is the right *daily-return* arrival;
   the full welcome (A/B) is a first-arrival-of-the-day event, not an
   every-visit one.
2. The typographic register of the greeting (display voice, full size, given
   room) as the baseline even where the signature hand is not used.
3. The calibration finding itself: the composition floor for Home sits between
   C (demoted support) and E (deleted support) — demote, don't delete.

---

## 7. Synthesis — what should survive this exploration

No prototype is the answer; each contributed at least one idea that should be.
If the five are distilled into the shape of an adoptable arrival:

| # | Idea | From | Cost | Where it could land |
|---|---|---|---|---|
| 1 | **The state sentence** ("Today is planned.") — reassurance before detail | C | trivial | Live Home candidate now |
| 2 | **Companion arrives after you** (~1.5s withhold) | D | trivial | Any arrival; live Home candidate now |
| 3 | **Shell visible from frame one** as the default arrival posture | B | — | The adopted arrival |
| 4 | **Time-of-day greeting** in THA's hand | A | trivial | The adopted arrival's welcome beat |
| 5 | **Hold-then-recede** greeting discipline, at ~half A's duration | A | — | The adopted arrival's welcome beat |
| 6 | **Light settles once** as the single brand light moment (either this or ARRIVAL1's sheen — not both) | B | — | The adopted arrival |
| 7 | **One-piece furnish**; two beats maximum for any reveal | B, C | — | The adopted arrival |
| 8 | **Support demoted to quiet rows**, never deleted | C (bounded by E) | small | Live Home evolution |
| 9 | **Return visits get E's register** (one ~0.9s fade), full welcome once per day at most | E | — | The adopted arrival's gating |
| 10 | Note-on-the-counter presentation for a Home observation — after the primary | D | small | Home / adopted arrival |

**Two structural findings** that outlast any prototype:

- **First arrival and return are different beats and should be designed as
  such.** A's welcome is right *once*; E's near-instant settle is right the
  other nine times. The session gate already encodes this mechanically; the
  design should encode it deliberately.
- **The floor for Home's composition is "demote, don't delete".** E found the
  edge by crossing it; C stands on the right side of it.

## 8. Governance posture

- **Experience & UI Governance.** These are development-only exploration
  surfaces built explicitly to be *evaluated against* the Experience Review
  Questions (§ 6) — they are the material for that review, not shipped UX. No
  live surface changed; the shell, navigation and Companion are byte-untouched;
  every value shown comes from its canonical owner; nothing is fabricated
  (loading/broken/empty all designed); no motion gates use; reduced motion
  loses nothing. Known deliberate tensions are recorded above as weaknesses
  (A's duration, D's pre-primary observation, E's overshoot) — that is the
  exploration doing its job.
- **Signature typeface discipline (UIA § 8).** Prototype A speaks the signature
  voice. The `signature-typography` adoption-register row was extended in this
  change: permitted surfaces are now exactly two, both dev-only
  (`arrival-experience.tsx`, `arrival-a-welcome.tsx`), and the EXP2 prototypes
  share ARRIVAL1's binary disposition. The webfont still loads only on the
  dev pages; production ships no third typeface.
- **Adoption register.** Updated (`adoption:record`) and gate run: 64 passed ·
  0 notices · 2 failed — both failures are the pre-existing baseline from other
  sessions' untracked files (`HouseholdNutritionPanel.tsx` orphan; the 539th
  raw `<button>`), unchanged by EXP2 (these pages add zero raw buttons and no
  orphans).
- **Production bundle.** `npm run build` passes; `dist/` contains no EXP2
  chunk and none of the prototypes' strings ("arrival-a…e", "exp2",
  "Welcome home"). The "Good morning/afternoon" hits in `dist/` belong to the
  live Dashboard's own pre-existing greeting.
- **Typecheck.** `tsc --noEmit` — 0 errors in the EXP2 files.
- **Product Registry impact.** None — `docs/product/` does not yet exist, and
  these are developer-only surfaces (`visibility: developer`) created for a
  bounded exploration with deletion as part of their disposition.

## 9. Disposition

The five prototypes are proposals with a shared, binary disposition and no
third option:

- **GRADUATE** — the ideas selected from § 7 are folded into the ONE adopted
  arrival / the live Home by a follow-on workstream, and **all five EXP2
  prototype files, their routes, `exp2-shared.tsx` and the capture script are
  DELETED** in that same change.
- **REJECT** — the same deletion, without the graduation.

A prototype that survives its own decision has become the
authored-but-unadopted successor the adoption register exists to make
impossible to hide.

---

*Files:* `client/src/pages/dev/exp2-shared.tsx`, `client/src/pages/dev/arrival-{a-welcome,b-orchard,c-workspace,d-quiet,e-restraint}.tsx`, five routes in `client/src/App.tsx`, `scripts/capture-exp2-arrival-explorations.ts`, evidence under `docs/ui-audit/exp2-arrival-explorations/`, adoption register (`signature-typography` row).
*Untouched:* the live Home, the shell, the navigation, the Companion, ARRIVAL1's `/dev/arrival`.
