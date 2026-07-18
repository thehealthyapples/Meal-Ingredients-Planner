# EXP3 — Arrival Synthesis Prototypes

**Status:** DELIVERED — two development-only synthesis candidates awaiting the selection of ONE canonical arrival
**Classification:** Experience exploration (implementation report)
**Date:** 2026-07-15
**Session:** `EXP3_Arrival_Synthesis_Prototypes`
**Rollback:** `rollback/EXP3-arrival-synthesis-prototypes-20260715` → `da368a39`
**Governing documents read before work:** `docs/architecture/README.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` (incl. § 4A Place Principles), `EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md` (incl. § 7 carry-forward)

> **What this is.** Not more independent experiments. Two SYNTHESIS prototypes
> that deliberately combine the strongest discoveries of the five EXP2
> explorations into candidate THA Arrival Experiences — expected to be the
> **final exploration before selecting a single canonical arrival.** The live
> Home (`/home`), ARRIVAL1 (`/dev/arrival`) and all five EXP2 prototypes are
> untouched. Development routes only.

---

## 1. What is constant (inherited from EXP2, byte-unchanged)

Both candidates are built on EXP2's shared infrastructure
(`client/src/pages/dev/exp2-shared.tsx`, **not modified by this workstream**),
so everything that is not the arrival is literally the same code as before:

- **The canonical shell.** Each page renders the byte-identical header line the
  live Home renders (`WorkspaceHeader realm="home" title="Home" wide`), inside
  `ProtectedRoute` — same orchard backdrop, bottom navigation, error boundary
  and Companion as every authenticated page. Nothing restyles, reflows or
  animates the shell (Principles 9 / E), and the shell is **visible from frame
  one in both candidates** — EXP2's clearest structural finding, now the
  default posture.
- **The canonical owners.** Card, Button, Skeleton, LoadError, MealCard — no
  component forked, no second header, no bespoke navigation.
- **The data.** Same react-query keys as the live Home via `useHomeData()` —
  shared cache entries, zero extra fetches, no owned state. Loading renders as
  skeletons, failure as the canonical `LoadError`, absence as honest emptiness.
- **The Companion.** The ONE `FloatingAssistant`, never re-rendered or animated
  — only *withheld* (the existing channel), and in both candidates released a
  beat **after** the room settles: EXP2 D's manners, now standard.
- **The gates.** Reduced motion ⇒ **no arrival at all** — the finished
  workspace immediately. One arrival per prototype per session; `?replay`
  re-plays for review. Every sequence is choreography, never a queue: all
  content is in the DOM and interactive from the first frame.
- **Development-only, provably.** Both routes exist only under
  `import.meta.env.DEV` (the load-bearing compile-time ternary); the production
  build was verified — no EXP3 chunk, none of its strings, in `dist/`.

**Evidence:** `docs/ui-audit/exp3-arrival-synthesis/` (23 MB — stills, webm
recordings, GIFs, reduced-motion states, and
`control-{desktop,mobile}-live-home-unchanged.png` as the untouched control).

---

## 2. Synthesis S1 — Quiet Arrival

**Route:** `/dev/arrival-s1-quiet`
**File:** `client/src/pages/dev/arrival-s1-quiet.tsx`
**Evidence:** `s1-quiet-{desktop,mobile}-01-greeting-held / 02-giving-way / 03-workspace / 04-companion-arrived / 05-reduced-motion.png` · `video/s1-quiet-{desktop,mobile}.{webm,gif}`

**Objective.** The calmest possible premium arrival. Nothing attracts
attention; the user simply feels welcomed.

**What it combines, and how each idea changed in synthesis:**

| From | Idea | As synthesised |
|---|---|---|
| A | The human greeting | Time-of-day greeting in THA's hand, name beneath — but held for **~2s, half of A's pause**, exactly as EXP2 § 7 idea 5 prescribed |
| B | Shell visible from frame one | **No cream field at all.** The greeting is spoken *inside* the visible walls, centred over the orchard the person is already standing in |
| C | The reassurance | "Today is planned." / "Today is open." is the **first line of the room** the greeting gives way to — reassurance before any detail, said only once known |
| D | Companion arrives after you | Withheld until ~1.2s after the room rests (~5.8s), then makes its own quiet entrance |
| E | Restraint | Everything else refused: no light wash, no sheen, no glide, no scale, no per-card choreography. **Two beats total**, then permanent stillness |

**The sequence** (total ~4.6s to rest, vs A's 7.6s): the shell and orchard are
simply there → the hand writes the greeting (0.4s), the name settles (1.2s) →
~2s of held stillness → one slow crossfade (3.2–4.6s): the words recede *as*
the room comes through in the same space, its first line C's state sentence →
stillness → the Companion joins you (~5.8s).

**How it behaves at the edges.** Reduced motion: the finished workspace
immediately, greeting never rendered. Return visit in the same session:
navigation, not a first impression — no arrival. Loading: the state sentence
is withheld until the truth is known; skeletons in the canonical shape.
Failure: canonical `LoadError` per surface. Empty day: "Today is open." +
honest empty card.

**What the synthesis proved**

- **A's warmth and B's safety were never in conflict.** EXP2 read A's hidden
  shell as a cost of the cream field; S1 shows the greeting loses nothing by
  being spoken inside the visible room — and gains the orientation story,
  because the walls never assemble. The strongest idea of each is compatible.
- **The halved pause keeps the feeling.** ~2s of held stillness still reads as
  being met, not as latency; the crossfade-as-giving-way carries the rest. The
  7.6s → 4.6s saving is pure toll removed.
- **C's sentence is the perfect first line for a greeting to give way to.**
  The greeting says *you're welcome here*; the room's first words say *and
  today is under control* — Arrival then Orientation then Confidence, the
  canonical rhythm, each beat in its own register.
- **Restraint is what makes it premium.** With no second device, the eye goes
  greeting → sentence → the one card → the one action. Nothing can be pointed
  to; the care is in the timing (Principle H's test passes by construction).

**Weaknesses / tensions to weigh**

- The greeting overlays the centre of the viewport while the workspace fades
  in beneath it; for ~1.4s both are partially present. The crossfade is one
  motion in one place, but a very fast reader could begin reading the state
  sentence through the receding greeting. (Invisible at the recorded pacing;
  worth one look at slower devices.)
- S1 spends the signature voice on a dev route — the third permitted surface
  of a typeface whose value is scarcity. The register row records it; the
  binary disposition (below) is what keeps this honest.
- Like every full welcome, it is right **once per day at most**; the session
  gate encodes once-per-session, and the adopted arrival should encode the
  first-arrival/return distinction deliberately (EXP2's structural finding,
  reconfirmed).

## 3. Synthesis S2 — Walking Home

**Route:** `/dev/arrival-s2-walking-home`
**File:** `client/src/pages/dev/arrival-s2-walking-home.tsx`
**Evidence:** `s2-walking-home-{desktop,mobile}-01-beneath-the-trees / 02-walking-in / 03-arrived / 04-companion-arrived / 05-reduced-motion.png` · `video/s2-walking-home-{desktop,mobile}.{webm,gif}`

**Objective.** One additional idea: the user gently walking into the orchard
before reaching Home — *"I'm arriving somewhere"*, never *"I'm watching an
animation"*.

**The constraint, honoured literally.** The orchard never performs. The trees
do not move. Nature does not animate. Nothing translates, scales, sways, loops,
or couples to the scroll. There is no parallax (no plane ever moves, let alone
differentially), no cinematic camera, no scroll-jacking (the scroll is never
touched), no theatrical effect. What moves is the **person**, and a person's
movement through a still place is felt as things being *passed*:

- **Depth by composition, not motion.** Three still planes: the near canopy
  shade (a soft darkening over the top of the frame — you begin beneath the
  boughs); the blurred glimpses of trees at the left and right edges (near
  field, out of focus the way close things are when you look past them,
  framing the clear view *between* them); and the orchard backdrop itself (far
  field, crisp — the shared canvas, composed over and never transformed,
  forked or restyled). Near is dark and blurred; far is clear and lit. That is
  perspective, and none of it moves.
- **Movement by passage.** Each near plane **dissolves exactly once, nearest
  first** — the shade lifts (0.3s), then the edge trees clear (0.7s) — which is
  what walking forward past still things feels like from inside. A dissolve is
  not a translation: at no point does any tree change position, and no plane
  ever returns.
- **Warm morning light** (B's one device, unchanged in meaning): a single wash
  from the upper left settles into ordinary daylight (1.1–3.5s) as you come
  out into the open — light meaning exactly one thing, once (Principle F).
- **Home rises to meet you** (B's furnish): as the walk completes, the
  workspace settles into place as ONE piece (2.2–3.7s). Then stillness,
  permanently. The Companion joins a beat later (~4.9s).

Total ~3.7s to rest. The workspace is B's parity room, deliberately — S2's
only variable against Prototype B is the walk itself, so the two recordings
are directly comparable.

**What the synthesis proved**

- **"Walking in" is achievable without nature performing.** The nearest-first
  stagger of three one-way dissolves genuinely reads as forward movement on
  the recordings — arrival at a place, with not one moving tree, and nothing
  for the eye to catch as "an effect". The forbidden list cost nothing.
- **Depth survives stillness.** Blur-near/crisp-far framing gives the first
  frame real perspective — the orchard glimpsed *between* trees — from two
  static gradient masses. Composition did what parallax pretends to do.
- **The first breath matters.** For ~1.3s the orchard seen between the trees
  IS the content (B's discovery, deepened): the person stands somewhere before
  anything is asked of them. Principle 1 in its purest form here.

**Weaknesses / tensions to weigh**

- **The first frame is a dimmed canvas.** The shade + glimpses necessarily
  darken the edges of frame one, and a household trained by other software may
  read dark-clearing-to-light as a *state* (something finishing loading)
  rather than a *place* (somewhere being walked into). B's empty-orchard risk,
  inherited and slightly amplified. The recordings read correctly; the risk is
  the fast daily open.
- **It is a welcome without words.** Like B, some people will not register the
  walk as a welcome at all. S2 answers "am I somewhere?" beautifully and
  "was I met?" not at all — the exact complement of S1.
- **It cannot simply be added to S1.** Layering the walk under the greeting
  would put three environmental devices and a signature greeting in one
  arrival — the accumulation Premium-through-restraint exists to refuse. One
  arrival carries one idea: either the words or the walk.

## 4. Governance posture

- **Experience & UI Governance.** Development-only exploration surfaces built
  to be evaluated against the Experience Review Questions (§ 6) — the material
  for that review, not shipped UX. No live surface changed; shell, navigation
  and Companion byte-untouched; every value from its canonical owner; nothing
  fabricated (loading / broken / empty all designed); no motion gates use;
  reduced motion loses nothing (verified in the captures: finished workspace,
  no arrival). Known deliberate tensions are recorded above as weaknesses.
- **Signature typeface discipline (UIA § 8).** S1 speaks the signature voice.
  The `signature-typography` adoption-register row was extended by this
  governed edit: permitted surfaces are now exactly three, all dev-only
  (ARRIVAL1, EXP2 Prototype A, EXP3 S1), same one moment (the arrival
  greeting), same binary disposition. The webfont still loads only on the dev
  pages; production ships no third typeface.
- **Adoption register.** Updated (`adoption:record`) and gate run: 64 passed ·
  0 notices · 2 failed — both failures are the pre-existing baseline from
  other sessions' untracked files (`HouseholdNutritionPanel.tsx` orphan; the
  539th raw `<button>`), unchanged by EXP3 (these pages add zero raw buttons
  and no orphans).
- **Production bundle.** `npm run build` passes; `dist/` contains no EXP3
  chunk and none of its strings.
- **Typecheck.** `tsc --noEmit` — 0 errors in the EXP3 files.
- **EXP2 untouched.** `exp2-shared.tsx` and all five EXP2 prototypes are
  byte-unchanged; S1 carries a local copy of A's five-line time-of-day helper
  precisely so the files under EXP2's own review stay untouched.
- **Product Registry impact.** None — `docs/product/` does not yet exist, and
  these are developer-only surfaces created for a bounded exploration with
  deletion as part of their disposition.

## 5. Recommendation — what should graduate into the final Arrival Experience

This exploration was built to end the exploring. The recommendation is
concrete:

**Adopt S1 — Quiet Arrival — as the shape of the canonical THA Arrival
Experience.** All five of its constituent ideas graduate together, in the form
S1 gives them:

1. **Shell visible from frame one** (B) — the default posture, no exceptions.
2. **The time-of-day greeting in THA's hand, held ~2s, receding by one
   crossfade** (A, halved) — the welcome beat, spoken inside the visible walls.
3. **The state sentence as the room's first line** (C) — reassurance before
   detail, only once known. (Independently: a live-Home candidate today,
   with or without any arrival.)
4. **The Companion arriving a beat after the person** (D) — everywhere,
   including the live Home, independent of every other idea.
5. **Restraint as the completing act** (E) — no second environmental device in
   the same arrival; two beats, then permanent stillness.

With S1's gating made deliberate per EXP2's structural finding: **the full
welcome at most once per day; every other open gets E's register** (a single
~0.9s fade to rest).

**From S2, graduate the finding, not the planes.** S2 proves the walking
feeling is honestly achievable — depth by composition, movement by
nearest-first dissolve, zero performing nature — and it is the better of the
two *at placing you somewhere*. But it cannot say *you were expected*, its
dimmed first frame carries a real loading-misread risk on the daily open, and
it cannot be combined with S1 without breaching the restraint that makes S1
premium. If, on viewing, the first-open-of-the-day is judged to deserve an
environmental beat, S2's shade-and-glimpse dissolve is the proven-safe way to
build it — as the *once-per-day* variant, replacing (never underneath) the
greeting. The default recommendation is the simpler one: **S1, with S2 recorded
as the door not taken and the technique that makes it safe to take later.**

## 6. Disposition

Unchanged from EXP2, and binding on this pair too — a shared, binary
disposition with no third option:

- **GRADUATE** — the selected ideas are folded into the ONE adopted arrival /
  the live Home by a follow-on workstream, and **all exploration prototypes —
  the five EXP2 pages, `exp2-shared.tsx`, both EXP3 pages, both capture
  scripts, and their routes — are DELETED** in that same change (ARRIVAL1's
  `/dev/arrival` resolves under its own open decision at the same moment).
- **REJECT** — the same deletion, without the graduation.

A prototype that survives its own decision has become the
authored-but-unadopted successor the adoption register exists to make
impossible to hide.

---

*Files:* `client/src/pages/dev/arrival-s1-quiet.tsx`, `client/src/pages/dev/arrival-s2-walking-home.tsx`, two routes in `client/src/App.tsx`, `scripts/capture-exp3-arrival-synthesis.ts`, evidence under `docs/ui-audit/exp3-arrival-synthesis/`, adoption register (`signature-typography` row).
*Untouched:* the live Home, the shell, the navigation, the Companion, ARRIVAL1's `/dev/arrival`, all five EXP2 prototypes and `exp2-shared.tsx`.
