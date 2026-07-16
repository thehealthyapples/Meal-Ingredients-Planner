# EXP4 — Materiality & Depth

**Status:** DELIVERED — three development-only material studies awaiting review
**Classification:** Experience exploration (implementation report)
**Date:** 2026-07-15
**Session:** `EXP4_Materiality_And_Depth`
**Rollback:** `rollback/EXP4-materiality-and-depth-20260715` → `b3c650cd`
**Governing documents read before work:** `docs/architecture/README.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` (incl. § 3A Emotional Palette and § 4A Place Principles), `EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md`, `EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md`

> **What this is.** Three development-only visual material studies asking one
> question the arrival work deliberately left open: **how should THA occupy
> visual space?** The platform is emotionally stronger than before but still
> visually flat — most surfaces exist on one plane, and cards feel like
> rectangles placed on a page rather than objects within an environment. Each
> study explores depth, hierarchy and warmth **without increasing visual
> noise**: no gloss, no artificial glassmorphism, no decoration — premium
> through restraint. This is a design-language exploration, not a finished
> design: no production surface, workflow, navigation, or functionality is
> touched.

---

## 1. Method — what is constant, so the material is the only variable

All three studies render the **same room**: the same orientation beat (the
date, "Today", EXP2-C's state sentence, said only once known), the same
primary (today's meals and the one action), the same supporting facts
(shopping, plants), the same quiet reminder, the same one way deeper. Content,
hierarchy, and function are deliberately identical — **the ONLY variable is
the material**: how each layer's surface sits in space, catches light, and
answers the hand.

- **The canonical shell.** Each page renders the byte-identical header line
  the live Home renders (`WorkspaceHeader realm="home" title="Home" wide`),
  inside `ProtectedRoute` — the same orchard backdrop, bottom navigation,
  error boundary and Companion every authenticated page gets. No study
  restyles, reflows or animates the shell (Principles 9 / E).
- **The canonical owners.** Card, Button, Skeleton, LoadError, MealCard — no
  component forked, no second header, no bespoke navigation.
- **The data.** EXP2's `useHomeData()` (from `exp2-shared.tsx`, reused
  **byte-unchanged** — imports only) — the same react-query keys and cache
  entries as the live Home, zero extra fetches, no owned state. Loading
  renders as skeletons, failure as the canonical `LoadError`, absence as
  honest emptiness. Nothing is fabricated.
- **No arrival.** These are materiality studies, not arrival studies: every
  page is still from the first frame and nothing ever moves unasked. The only
  motion on any study is a surface answering the hand (hover / press / focus),
  and every such transition is removed entirely under reduced motion
  (`motion-reduce:transition-none`).
- **The layer inventory.** Each study accounts for the same seven layers:
  **environment** (the orchard, canonical, untouched) · **application shell**
  (canonical, untouched) · **workspace** · **primary card** · **secondary
  cards** · **floating elements** and **the Companion** (the ONE
  `FloatingAssistant`, deliberately left untouched to demonstrate the floating
  layer by itself). The studies vary only the middle four.
- **Development-only, provably.** Each route exists only under
  `import.meta.env.DEV` (ARRIVAL1's load-bearing compile-time ternary), and
  the production build was verified: no EXP4 chunk, none of the studies'
  strings, in `dist/`.

**Evidence:** `docs/ui-audit/exp4-materiality-depth/` (21 MB — composed
stills, hover / press / keyboard-focus stills, close-up element shots of the
primary and supporting surfaces, webm recordings + GIFs of the
micro-interactions, desktop 1440×900 + mobile 390×844, and
`control-{desktop,mobile}-live-home-unchanged.png` as the untouched control).

**A note on the shadows all three studies share.** Every shadow in EXP4 is
**warm** — its hue taken from the room's green-brown foreground, never black
or grey — and every shadow **describes space** (how far a surface sits above
what is beneath it), never drama. The studies' working hypothesis: what made
"depth" feel wrong in flat-design history was grey shadow used as decoration;
depth that describes one believable room is not noise.

---

## 2. Study A — The Warm Layered Workspace

**Route:** `/dev/material-a-warm-layers`
**File:** `client/src/pages/dev/material-a-warm-layers.tsx`
**Evidence:** `a-warm-layers-{desktop,mobile}-01-composed / 02-hover-support (desktop) / 03-press-support / 04-focus-support.png` · `a-warm-layers-05-detail-primary.png` · `a-warm-layers-06-detail-support.png` · `video/a-warm-layers-{desktop,mobile}.{webm,gif}`

**Design rationale.** Can THA's surfaces feel like objects resting on a
prepared counter, rather than rectangles printed on a page? Study A answers
with **distinct layers**, each one nameable, back to front:

1. **Environment** — the orchard (untouched), the daylight the room stands in.
2. **The ground** — the study's one structural invention: a broad, warm,
   linen-soft plane (`hsl(42,40%,97%)` at 75 %, softly blurred, hairline
   warm border) that the whole workspace sits ON. It is the prepared counter:
   it gathers the content into one place and gives every card something to
   rest against, so nothing floats on the raw page.
3. **The primary surface** — the nearest plane: fully solid, warmest white,
   the deepest (still soft, still warm-hued) shadow, and a one-pixel rim of
   light along its top edge — the one place the morning catches.
4. **Supporting surfaces** — visibly lower: translucent enough for the ground
   to breathe through, shallower shadows, quieter rims.
5. **Quiet surfaces** — no surface at all: the reminder lies directly on the
   counter, the way a note does.
6. **Floating** — the Companion, canonical and untouched, already above every
   plane.

**Micro-interaction.** Physical, answering the hand only: hover **lifts** a
supporting surface slightly toward you (2 px rise, shadow deepens, surface
brightens); press **settles** it back down (rise cancelled, shadow shortens);
focus is the canonical visible ring, reached by real Tab in the evidence.

**Strengths**

- **The ground plane is the single biggest discovery of the exploration.** It
  converts "cards on a page" into "objects in a place" — exactly the
  mission's gap. With a counter beneath them, the cards stop being rectangles
  *on* the orchard and become things *in* it, and the workspace itself
  becomes a thing (a prepared surface) rather than a void with content in it.
  This is § 4A Principle B ("THA is a place") expressed as material.
- **Three unmistakable tiers.** In the composed stills the eye lands on the
  primary card without instruction: solid-and-lit beats translucent-and-low
  beats no-surface-at-all. The hierarchy is felt, not read.
- **Warm shadows work.** The depth reads as afternoon light, not as grey
  drama; nothing in the study glosses, glassmorphs, or shines. Materiality
  lands as *soft and crafted* rather than *elevated and shouting*.
- **The lift/settle hand feel is genuinely physical.** Hover raises the
  object; press seats it. The metaphor survives the recording: surfaces
  answer like things with weight, not like styles changing.

**Weaknesses**

- **It is the most material-expensive study.** A fourth plane (the ground)
  exists everywhere, always. On mobile it costs real width (padding inside
  padding) and the cards narrow visibly against Study B/C.
- **A ground can be misread as "a big card containing cards".** If adopted
  carelessly the pattern multiplies — grounds inside grounds — and the depth
  budget inflates exactly the way emphasis budgets do. Any graduation needs a
  one-line law: **one ground per workspace, ever; a ground never nests.**
- **Nested radii need governance.** 1.75 rem ground / 1 rem cards happens to
  compose; unmanaged, mixed radii across surfaces is how craft drifts.
- **On mobile, the Companion FAB overlaps the quiet reminder row** at the
  bottom of the ground (visible in `a-warm-layers-mobile-01-composed.png`) —
  an existing shell behaviour the denser composition exposes; the live Home
  has the same overlap risk with any bottom content.
- **It presses hardest on the UIA's flat-surface law** (§ 6 below): its
  primary shadow is the deepest in the set. Still soft, still warm — but the
  study is knowingly exploring past "flat, frosted, calm".

**Recommendation.** Graduate the **ground plane** (with the one-ground law),
the **warm shadow palette**, and the **lift/settle interaction** as the
strongest candidates in the exploration. The ground is the idea to carry even
if everything else in A is refused.

---

## 3. Study B — Natural Depth and Atmosphere

**Route:** `/dev/material-b-atmosphere`
**File:** `client/src/pages/dev/material-b-atmosphere.tsx`
**Evidence:** `b-atmosphere-{desktop,mobile}-01-composed / 02-hover-support (desktop) / 03-press-support / 04-focus-support.png` · `b-atmosphere-05-detail-primary.png` · `b-atmosphere-06-detail-support.png` · `video/b-atmosphere-{desktop,mobile}.{webm,gif}`

**Design rationale.** Can **light alone** tell the eye where to go? Study B
builds no ground and stacks no planes. The room is lit the way a kitchen is on
a bright morning — daylight falls from the upper left, once, and never moves —
and the entire hierarchy follows from where each surface stands in that light:

- **The ambient** — a still pool of warm morning light lies over the top of
  the workspace, where orientation and the primary live. It is not an effect:
  it never moves, never sweeps, never glows for attention (Principle F: light
  means welcome, warmth, calm, clarity, optimism — nothing else).
- **The primary stands in the light** — the brightest, warmest white on the
  page, upper-left edge catching the sun (a one-pixel warm highlight), shadow
  cast softly down-right.
- **Supporting surfaces stand in the penumbra** — a half-step dimmer and
  warmer-grey, translucent to the orchard, shorter shadows in the same
  direction. The eye reads *less lit* as *less now*.
- **Quiet surfaces sit in the shade** — no surface, slightly muted ink.

Every shadow on the page falls the same way, from one believable morning sun.
Remove the light and the page is flat — there are no layers for layers' sake.

**Micro-interaction.** The hand moves things **in the light**: hovering a
supporting surface brings it into full daylight (it brightens to the primary's
white; its shadow reaches a little further); pressing holds it down toward the
counter (shadow shortens); focus is the canonical ring.

**Strengths**

- **The cheapest depth in the set.** No new planes, no new structure — the
  hierarchy is carried entirely by illumination, and in the composed stills it
  works: the primary visibly *stands in the morning*, the supporting pair
  visibly waits in the penumbra. Depth through illumination, exactly as the
  mission asked.
- **The most on-palette study.** § 3A demands warm and alive; B *is* morning
  light as a material. Of the three, its stills read most like "a kitchen on a
  bright morning" and least like software.
- **Penumbra demotion is felt, never itemised.** Nobody will say "the
  supporting card is 4 % darker with a shorter shadow"; they say the primary
  "stands out". That is Principle 13's test passing — the feeling remains,
  the device does not.
- **Hover-into-the-light is the most honest hover of the three.** Light
  already means *now* on this page; the surface you are about to choose
  coming into the light is meaning, not decoration. The desktop recording
  shows the shopping card at full daylight beside the still-penumbral plants
  card — the clearest single micro-interaction frame in the evidence.

**Weaknesses**

- **The ambient pool lives one step from Principle F's boundary.** At the
  captured value it is atmosphere — felt, not spotted. A stronger value would
  tip into a light *show*, and there is no natural fence except governance:
  if adopted, the value must be a named token with a stated ceiling, like
  EXP2-B's 0.30 wash.
- **Directional shadow is a vocabulary THA has never spoken.** Done at the
  captured softness it reads as daylight; done 20 % harder it reads as
  skeuomorphism. The technique has a narrow correct band and needs values
  fixed in the one definition source, not per-surface taste.
- **Penumbra costs contrast.** The supporting surfaces' dimming slightly
  reduces text contrast against their surface. It passes visual inspection;
  it must be *measured* against the accessibility floors (UIA § 15) before
  any graduation, because "less lit" may never become "less legible".
- **The thesis does not survive dark mode as designed.** In dark mode the
  studies honestly collapse to canonical card surfaces (no hand-written dark
  variant — § 6), which for B removes the entire hierarchy device. A dark
  equivalent (lamplight?) is real, unexplored design work, and adopting B
  without it would offer an incomplete mode — which the token law forbids.

**Recommendation.** Graduate **one light direction, product-wide** and the
**penumbra demotion of supporting surfaces** as the exploration's hierarchy
language, and **hover-into-the-light** as the interaction meaning. Hold the
ambient pool itself until a dark-mode equivalent exists and the contrast
floors are measured.

---

## 4. Study C — Minimal Premium Restraint

**Route:** `/dev/material-c-restraint`
**File:** `client/src/pages/dev/material-c-restraint.tsx`
**Evidence:** `c-restraint-{desktop,mobile}-01-composed / 02-hover-support (desktop) / 03-press-support / 04-focus-support.png` · `c-restraint-05-detail-primary.png` · `c-restraint-06-detail-support.png` · `video/c-restraint-{desktop,mobile}.{webm,gif}`

**Design rationale.** How little material does the hierarchy need? Where A
adds planes and B adds light, C subtracts until exactly **one surface**
remains — and asks whether space and ink can do the rest:

- **The primary is the only card on the page.** Solid, hairline border, one
  minimal shadow — barely more than the certainty that it is an object.
  Because it is the only surface, it needs no depth contest to win: presence
  itself is the hierarchy.
- **Supporting facts are not surfaces at all:** two quiet rows of ink
  separated by hairlines — EXP2-C's demotion, kept ("a prepared kitchen does
  not present the salt with the meal's ceremony").
- **Quiet is a plain sentence on the canvas.**
- **The spacing rhythm is a full step more generous** than the live Home —
  breathing space is this study's principal material.

C is also the exploration's **control**: it renders the current canonical
flat-surface law (UIA § 4) at its best, so the exploration can honestly ask
whether A's layers or B's light buy anything that the flat law, executed with
enough air, does not already give.

**Micro-interaction.** The canonical answer, unchanged: rows speak the one
existing `hover-elevate` / `active-elevate-2` overlay; focus is the canonical
ring. Nothing translates, nothing casts more shadow — restraint extends to the
hand.

**Strengths**

- **It proves air is material.** With one more step of spacing, the flat law
  already delivers most of the calm — C's stills breathe more than the live
  Home's without one new device. Whatever else graduates, the spacing rhythm
  should.
- **The one-object hierarchy is unmistakable.** With a single card on the
  page, the two-second rule passes instantly; the primary needs no
  competition to win because none exists.
- **Zero new vocabulary.** Everything C does could ship tomorrow inside
  current law — no UIA amendment, no new tokens, no new interaction
  mechanism. It is the least risky study by an order of magnitude.

**Weaknesses**

- **The support tier undershoots.** The ink rows sit directly on the orchard
  backdrop: their hairline dividers all but disappear against it (visible in
  `c-restraint-desktop-01-composed.png`), their legibility is hostage to the
  backdrop's local luminance, and they read as floating text rather than as
  *quiet surfaces* — unanchored, not restrained. Where EXP2-E found the
  composition floor ("demote, don't delete"), C finds the material floor:
  **support needs an anchor — a whisper of surface — and naked ink on the
  environment is below it.**
- **It is the least warm of the three.** Without ground or light, C's
  material story is typography and air: calm, premium — and the closest of
  the three to the "visually flat" observation that motivated EXP4. It
  answers the mission's noise constraint perfectly and its depth question not
  at all.
- **Row affordance is weakest.** Nothing about the ink rows says *touchable*
  until hovered — an acceptable trade on a study, a real cost on a Home.

**Recommendation.** Graduate the **spacing rhythm** and the **finding** (the
support tier's material floor is "anchored, not naked"). Keep the canonical
overlay as the press vocabulary everywhere — it composed perfectly well under
A's and B's hover treatments and needs no successor.

---

## 5. Synthesis — what the exploration discovered

No study is the answer; each contributed something the others cannot. If the
three are distilled:

| # | Idea | From | Cost | Where it could land |
|---|---|---|---|---|
| 1 | **The ground plane** — the workspace as a prepared counter, one per workspace, never nested | A | small | The Home workspace; candidate for every realm's workspace |
| 2 | **Warm shadows that describe space** (room-hued, never black; depth = distance, never drama) | A, B | trivial | The one shadow definition, if depth graduates |
| 3 | **One light direction, product-wide** (upper-left; every shadow agrees) | B | trivial | The one shadow definition |
| 4 | **Penumbra demotion** — supporting surfaces a half-step dimmer, in the same light | B | small | Card hierarchy law |
| 5 | **The spacing rhythm one step more generous** | C | trivial | Live Home candidate now, independent of depth |
| 6 | **The state sentence + support demotion** (EXP2-C, reconfirmed in all three rooms) | EXP2 | trivial | Already recommended by EXP3 § 5 |
| 7 | **Lift / settle micro-interaction** (hover raises, press seats) | A | small | If depth graduates; else keep canonical overlay |
| 8 | **Hover-into-the-light** as the hover *meaning* | B | small | With idea 4 |
| 9 | **Support anchored, never naked ink** — the material floor | C (by finding the edge) | — | Card hierarchy law |
| 10 | **The Companion untouched proves the floating layer needs nothing** — it already reads as the nearest plane in every study | all | — | No work needed |

**Three structural findings that outlast the studies:**

1. **Depth is believable exactly when it describes ONE room.** One ground,
   one light, one direction, every shadow explaining a distance — and depth
   stops being noise. The historical failure ("cards with drop shadows
   everywhere") was many imaginary rooms on one page. This is the law any
   graduation should be written around.
2. **Warmth lives in the shadow's hue and the surface's white.** The same
   geometry with grey shadows and clinical white reads as Material-era
   software; with room-hued shadows and cream-warm whites it reads as § 3A's
   lived-in home. The temperature is in the values, not the structure.
3. **The hierarchy has a floor and a ceiling, and the studies found both.**
   Ceiling: A's full stack is the most depth THA could ever justify — anything
   beyond it is theatre. Floor: C's naked ink is one step too little — support
   needs an anchor. The adoptable language lives between them, and B sits
   closest to the middle.

**Recommended shape for the follow-on** (a synthesis study, or the adoption
workstream directly, at the user's discretion): **A's ground + B's light +
C's air** — the counter as the one structural device, one morning light as
the one hierarchy device, C's spacing rhythm as the resting state, supporting
surfaces as low warm cards (A) in penumbra (B), quiet content as notes on the
counter (A), the canonical overlay retained for press everywhere. Home reads
as "a beautifully prepared kitchen ready for the day" in the A and B stills
in a way it does not in the control shots — the combination should be
photographed before any adoption decision.

## 6. Governance posture

- **Experience & UI Governance.** These are development-only exploration
  surfaces built explicitly to be *evaluated against* the Experience Review
  Questions (§ 6) — they are the material for that review, not shipped UX. No
  live surface changed; the shell, navigation and Companion are
  byte-untouched; every value shown comes from its canonical owner; nothing
  is fabricated (loading / broken / empty all designed); nothing moves
  unasked, and every hand-answering transition dies under reduced motion.
- **The flat-surface law is knowingly explored, never breached in
  production.** UIA § 4 states the current law: *"flat, frosted, calm
  surfaces — no heavy shadows, no skeuomorphic depth; elevation is reserved
  for what genuinely floats."* Studies A and B deliberately explore past it —
  that is the assignment — but only on `import.meta.env.DEV` routes that
  provably do not ship. **If any depth idea graduates, the path is a governed
  UIA amendment** (the way EXPLANG1A/1B entered the Experience Language:
  discovered in prototype, admitted by governance), never drift. The studies'
  own hypothesis for that amendment is § 5's finding 1: depth that describes
  one room, in warm values, with elevation still meaning nearness-to-hand.
- **Raw values, confessed.** The studies write their material values inline
  (arbitrary-value utilities), exactly as the EXP2/EXP3 prototypes did. In a
  production implementation every one of them would be a semantic token
  admitted through UIA § 16; a study that tokenised first would put values in
  the one definition source before governance admitted the names.
- **Dark mode, honestly.** The studies are designed in the light mode where
  their materiality lives; in dark mode they fall back to the canonical card
  surfaces (`dark:` fallbacks — no hand-written second design). That is an
  honest degradation for a study and a named open problem for adoption
  (Study B's weakness 4).
- **Signature typeface discipline (UIA § 8).** Untouched — no study speaks
  the signature voice; the `signature-typography` register row is unchanged
  (still exactly three dev-only surfaces, from ARRIVAL1/EXP2/EXP3).
- **Adoption register.** `adoption:record` run (re-dating the moved `dark:`
  utility count); gate run: 64 passed · 0 notices · 2 failed — both failures
  are the pre-existing baseline from other sessions' untracked files
  (`HouseholdNutritionPanel.tsx` orphan; the 539th raw `<button>`), unchanged
  by EXP4 (these pages add **zero** raw buttons and no orphans; all three are
  routed).
- **Production bundle.** `npm run build` passes; `dist/` contains no EXP4
  chunk and none of the studies' strings or routes.
- **Typecheck.** `tsc --noEmit` — 0 errors in the EXP4 files.
- **EXP2/EXP3 untouched.** `exp2-shared.tsx` is consumed by import only,
  byte-unchanged; all seven arrival prototypes and both capture scripts are
  untouched, still awaiting their own decisions.
- **Product Registry impact.** None — `docs/product/` does not yet exist, and
  these are developer-only surfaces (`visibility: developer`) created for a
  bounded exploration with deletion as part of their disposition.

## 7. Disposition

The three studies are proposals with a shared, binary disposition and no third
option — the same discipline as EXP2/EXP3:

- **GRADUATE** — the ideas selected from § 5 are folded into the canonical
  visual language by a follow-on workstream (including the governed UIA § 4
  amendment any depth idea requires and the admission of its semantic
  tokens), and **all three study files, their routes, and the capture script
  are DELETED** in that same change.
- **REJECT** — the same deletion, without the graduation.

A study that survives its own decision has become the authored-but-unadopted
successor the adoption register exists to make impossible to hide.

---

*Files:* `client/src/pages/dev/material-a-warm-layers.tsx`, `client/src/pages/dev/material-b-atmosphere.tsx`, `client/src/pages/dev/material-c-restraint.tsx`, three routes in `client/src/App.tsx`, `scripts/capture-exp4-materiality-depth.ts`, evidence under `docs/ui-audit/exp4-materiality-depth/`, adoption register re-dated (`adoption:record`).
*Untouched:* the live Home, the shell, the navigation, the Companion, ARRIVAL1's `/dev/arrival`, all five EXP2 prototypes, `exp2-shared.tsx`, both EXP3 candidates.
