# EWX1 — Living Companion Experience — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Builds on:** the Intelligence Platform (TIP1–3, INT1–41) and the Companion Personality Platform ([EWO1](../investigations/EWO1_COMPANION_PLATFORM_FOUNDATION.md) design / [EWO2](EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md) implementation)
**Risk:** 🟢 GREEN
**Reason:** Every new module is a pure, read-only adapter over already-owned data (see Trust Validation). The one new route is additive (`GET /api/intelligence/companion/observations`); the one changed file with real behaviour (`FloatingAssistant.tsx`) swaps one already-ephemeral, session-only banner for a strictly more general version of the same pattern. Zero schema change, zero new table, zero new capability.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/before-ewx1-living-companion-experience-20260703` → `3460519` |
| Working tree at start | Dirty with pre-existing, uncommitted work from prior sessions: FI5 (Food Intelligence UI Activation), EL2 (investigation doc), and EWO2 (Companion Personality Platform — personality-registry.ts, behaviour-engine.ts, companion-growth.ts, shared/companion-personality.ts, its own test suite and doc). None of those files were authored by this task; EWX1 is explicitly required to build on EWO2, so this task's own diff touches `behaviour-engine.ts` additively (one new exported function) and reads (never modifies) the rest. |
| This task's writes | See **Files Changed** at the end of this document. |
| Rollback to committed state | `git checkout rollback/before-ewx1-living-companion-experience-20260703` |
| Rollback this task only | `git checkout rollback/before-ewx1-living-companion-experience-20260703 -- <path>` for any file listed in **Files Changed**; delete the new files listed there. No database change was made by this task (Data Impact: reads only) — there is nothing to roll back at the data layer. |

---

## REFERENCE DOCUMENTS READ

- [x] [`EWO1_COMPANION_PLATFORM_FOUNDATION.md`](../investigations/EWO1_COMPANION_PLATFORM_FOUNDATION.md) — the personality-as-a-voice-layer architecture and its §5 hard invariant
- [x] [`EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md`](EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md) — the Behaviour Engine, Personality Registry, and Growth Model this task extends
- [x] [`FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md`](FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md) and [`FI5_FOOD_INTELLIGENCE_UI_ACTIVATION.md`](FI5_FOOD_INTELLIGENCE_UI_ACTIVATION.md) — the opportunity-delivery (OD1) bundle this task wraps as observations, never re-derives
- [x] Live code: `server/intelligence/conversation/{behaviour-engine,personality-registry,companion-growth,turn-fallback,companion-guidance}.ts`, `server/intelligence/opportunity-delivery/framework.ts`, `server/intelligence/food-intelligence/opportunity-engine.ts`, `server/lib/nutrition-centre-assembler.ts`, `server/lib/household.ts`, `server/storage.ts` (`getUserStreak`, `getUserHealthTrends`), `server/routes.ts`, `client/src/components/conversation/FloatingAssistant.tsx`, `client/src/hooks/use-food-opportunities.ts`

---

## ARCHITECTURE COMPLIANCE (confirmed before implementation)

```
☑ One canonical Intelligence Platform  — the new observations route calls the
  SAME intelligencePlatform.handle() the FI5 food-opportunities route already
  calls, for the SAME "opportunity-delivery" capability/"report" verb. No
  second platform, no bypass path.
☑ One Companion                        — no new persona/assistant object.
  Observations are voiced through the EXISTING PersonalityId + Behaviour
  Engine (EWO2); observation-engine.ts never talks to an LLM and never opens
  a second conversation surface.
☑ One conversation                     — conversation-store.ts and
  conversation_turns have zero diff in this task. Observations are computed
  fresh per request and are never written into a turn.
☑ One Capability Registry              — zero new capabilities registered.
  capability-registry.ts has zero diff. The Observation Engine is a
  presence-layer adapter, the same architectural class as EWO2's
  behaviour-engine.ts — not a capability.
☑ One Behaviour Engine                 — every observation is voiced by
  ADDING ONE FUNCTION (`phraseObservation`) to the existing
  behaviour-engine.ts, dispatching to the SAME per-personality
  `buildCelebration` / `growthTemplate` / `guidanceLabelPrefix` EWO2 already
  shipped. Zero new template content, zero new tone dimension.
☑ Existing ownership remains unchanged — companion-growth.ts, the
  opportunity-delivery framework, storage.getUserStreak, and
  nutrition-centre-assembler.ts are all called read-only and are byte-
  identical after this task (zero diff to any of them).
☑ Companion consumes existing platform intelligence — every Observation's
  `fact` traces to one of those four existing, unmodified owners (see
  observation-engine.ts's module header for the full provenance table).
☑ No duplicated business logic          — observation-engine.ts computes
  ZERO new metrics. It is a pure adapter: it selects, filters (Silence
  Rules) and re-shapes facts an existing owner already computed; it never
  re-implements a computation that owner already owns.
☑ No duplicated state                   — Silence Rules (Stage 6) are
  implemented as STATELESS predicates (priority ranking, de-dup by id, a
  "round number" notability heuristic) specifically so this task adds NO
  new table, NO new column, and NO new persisted "last shown" tracker. See
  Trust Validation and Suggestions for what this deliberately cannot do yet.
```

**Gate result: PASS.**

---

## OBJECTIVE

Make the Companion feel naturally present throughout THA — observing,
encouraging, celebrating, guiding, teaching, and remaining silent when
appropriate — without adding a second AI, a second conversation system, or
any duplicated logic. Users should feel accompanied, not interrupted.

---

## STAGE 1 — OBSERVATION ENGINE

`server/intelligence/conversation/observation-engine.ts` is a new, pure,
read-only adapter. It defines the closed `Observation` shape and one producer
function per existing data source:

| Producer | Wraps (existing, unmodified owner) | Category |
|---|---|---|
| `observeNutritionTrend` | `companion-growth.ts`'s `computeGrowthSignal` (EWO2 Stage 7 — `storage.getUserHealthTrends`) | `nutrition-trend` |
| `observeStreak` | `storage.getUserStreak` (existing `user_streaks` table) | `streak-milestone` |
| `observeDiversity` | `assembleNutritionCentre`'s `overview.plantDiversity` (WX8 — all-time, household-owned) | `diversity-milestone` |
| `observeOpportunities` | The `opportunity-delivery` capability (OD1/FI4) — the SAME bundle FI5's route already returns | `planner-gap` / `pantry-opportunity` / `shopping-opportunity` |

Every producer is a pure function over already-fetched rows (no I/O of its
own), mirroring `opportunity-engine.ts`'s own "pure reasoning core, thin I/O
orchestrator" split — fully unit-testable without a database (§ Trust
Validation, test file below).

**What was explicitly NOT built** (brief examples with no existing, honest
data source — see Trust Validation): "weekly planning progress" as a
%-complete figure (only a gap-count exists, reused via `planner-gap`);
"meal diversity" as a weekly counter (the only weekly plant counter found is
client-side derived state in `PlantDiversityReport.tsx`, not a server-owned
fact — using it would mean either duplicating that computation server-side or
trusting client-supplied "diversity", both rejected); "household achievements"
beyond the streak table (no achievement/milestone table exists to read).

---

## STAGE 2 — WORKSPACE OBSERVATION MATRIX

`FloatingAssistant.tsx` is mounted once, globally (per EWO2 §5's own audit,
`client/src/App.tsx`) — outside the per-route page component — so it is
already present on all 9 named workspaces with no per-page wiring. This
task's single Observation banner (Stage 7) therefore applies everywhere at
once. The matrix below records what is HONEST to show on each workspace
today, not 9 new components:

| Workspace | Arrival | Observations (this task) | Celebrations | Education | Suggestions | Silent moments |
|---|---|---|---|---|---|---|
| Dashboard | Existing "Hi, I'm Apple!" empty state (EWO2, personality-voiced greeting unchanged by this task) | nutrition-trend, streak/diversity milestone | streak/diversity milestone (via `buildCelebration`) | — (none owned here) | opportunity pass-through | No banner when Silence Rules find nothing — never a placeholder |
| Planner | Same global entry point | planner-gap (highest-priority when the week is genuinely thin) | — | — | "Add a meal to `<day>`" (verbatim OD1 text) | A fully-planned week shows nothing — the absence of a nudge IS the signal |
| Shopping | Same global entry point | shopping-opportunity (restriction conflicts) | — | — | verbatim OD1 suggestion | An empty/compliant list shows nothing |
| Cookbook (Meals) | Same global entry point | diversity-milestone, pantry-opportunity | diversity milestone | — | verbatim OD1 suggestion | No repeat "try something new" nudging beyond the round-number gate |
| Pantry | Same global entry point | pantry-opportunity | — | — | verbatim OD1 suggestion | An empty pantry or nothing unused shows nothing |
| Nutrition Report | Same global entry point | nutrition-trend | — | (existing Nutrition Centre content, unchanged) | — | Thin health-trend history → no banner (honest gap, unchanged from EWO2) |
| Diary | Same global entry point | nutrition-trend (same computation, different surface) | — | — | — | — |
| Profile | Same global entry point + existing Personality selector (EWO2) | streak-milestone | streak milestone | — | — | — |
| Partners | Same global entry point | (none of the four sources are partner-scoped) | — | — | — | Always silent on this surface today — honest, not a bug |

No new per-workspace widget was built (Core Principle: "not a notification
system"). The banner is capped to **one line, one observation, fresh-panel-
only** everywhere (Stage 6).

---

## STAGE 3 — BEHAVIOUR INTEGRATION

`behaviour-engine.ts` gains exactly one new exported function,
`phraseObservation(observation, personalityId)`, which dispatches on the
observation's `fact.kind` to EXISTING per-personality builders:

- `fact.kind === "growth"` → `phraseGrowth` (EWO2, unchanged)
- `fact.kind === "streak" | "diversity"` → `buildCelebration` (EWO2, unchanged) — a Friend and a Coach already render this differently because EWO2's `experience.celebrations` templates already differ per personality
- `fact.kind === "opportunity"` → `voiceGuidanceLabel` (EWO2, unchanged) — reorders/prefixes only; the OD1-produced `explanation`/`suggestedAction` text is never reworded

No new template string was added to `personality-registry.ts`. "Friend
notices differently from Coach" falls out of reusing content EWO2 already
wrote for a different call site (guidance suggestions, growth insight) — this
IS the "same intelligence, said differently" principle, proven by the same
mechanism EWO2 already tested.

---

## STAGE 4 — EMOTIONAL INTERACTION FRAMEWORK

`shared/companion-interaction.ts` — the closed `InteractionKind` vocabulary
(`welcome | encouragement | celebration | milestone | discovery | reminder |
completion | reflection | seasonal`) plus `OBSERVATION_CATEGORY_INTERACTION_KIND`,
a static map from each Stage 1 `ObservationCategory` to the interaction shape
that best describes it. This file carries no phrasing — it is pure
vocabulary, shared verbatim client/server (same discipline as
`companion-personality.ts`) so a future observation category slots into an
EXISTING kind rather than the client and server independently inventing a
new one. Only 6 of the 9 kinds have a real producer wired to them today
(`reflection`, `milestone`, `reminder`, `discovery`); `welcome`,
`encouragement`, and `seasonal` are declared for the Delight Framework
(Stage 5) to consume once a real, honest source exists for them (see
Suggestions) — this is the "build the reusable framework, don't fully
implement every kind" discipline EWO2's Experience Framework scaffold also
followed.

---

## STAGE 5 — DELIGHT FRAMEWORK

`client/src/lib/companion-delight.ts` — three reusable framer-motion
`Variants` (`fadeInUp`, `celebrationPop`, `quietFade`), a
`variantForInteraction(kind)` picker keyed off Stage 4's `InteractionKind`,
and a `prefersReducedMotion()` helper. Every variant is ≤400ms, single-
purpose, and was chosen to be a *strict subset* of animation styles already
present in `FloatingAssistant.tsx`'s own inline transitions — this task adds
no new visual language, only names and reuses the restrained one that
already existed. Wired at exactly one call site (the Observation banner);
no theme CSS, no avatar artwork, no celebration confetti/particle effects,
and no per-workspace animation were built (Core Principle: "never distract").

---

## STAGE 6 — COMPANION SILENCE

`observation-engine.ts`'s `applySilenceRules` is a pure, stateless filter,
applied server-side before anything reaches the client:

1. **Honest-gap filtering** happens upstream, inside each producer — a
   thin/absent signal (no health-trend history, zero streak, zero diversity,
   no opportunities) never enters the list at all.
2. **Notability gating** (`observeStreak`, `observeDiversity`) — a streak or
   diversity count only becomes an observation at a round multiple (7 for
   streaks, 10 for diversity). This is a stateless "is this worth a moment"
   heuristic, not a persisted "you just crossed this" detector (see
   Suggestions for the honest limit of what a stateless rule can promise).
3. **De-duplication** by observation id.
4. **Priority ordering + a hard cap** (`MAX_OBSERVATIONS_PER_MOMENT = 2`,
   though the client currently renders only the first) — the Companion never
   reads as a list of pending nudges.
5. **Placement gating** (client-side, `FloatingAssistant.tsx`) — the banner
   is shown only when the panel is freshly opened with no conversation
   history yet, exactly the gate EWO2's growth-insight line already used.
   Mid-conversation, the banner never appears — silence during an active
   exchange is not this task's call to interrupt.

**What Silence Rules deliberately do NOT do yet:** avoid re-showing the same
observation across repeat panel-opens/days (would require a new persisted
"last shown" fact — a real, minimal, additive addition, but the brief's own
"no duplicated state" discipline says this task should not add write state it
cannot fully specify and test end-to-end in this pass). See Suggestions.

---

## STAGE 7 — PLATFORM PRESENCE

`GET /api/intelligence/companion/observations` (new, `server/routes.ts`) is
the single new HTTP surface: it gathers from the four Stage 1 sources
(each independently best-effort — a household that hasn't resolved yet
degrades only the diversity/opportunity sources, never the whole response,
mirroring FI4's own per-domain honest-gap discipline), applies Silence Rules,
and voices the survivors via `phraseObservation`.

`client/src/hooks/use-companion-observations.ts` is the one client-side
owner of that read (mirrors `use-food-opportunities.ts`'s "one hook, every
surface shares the query key" discipline). `FloatingAssistant.tsx` — already
mounted globally on all 9 workspaces — is the ONLY consumer, replacing its
previous EWO2 growth-insight-only banner with this strictly more general
version of the same pattern (same gating, same "fresh panel only" rule, same
"nothing shown when nothing honest to say" default). No new mount point, no
new per-page component: the Companion is present because it was already
there, not because a new widget was added.

**Consolidation note:** the dedicated `GET /api/intelligence/companion/
growth-insight` route (EWO2) is left in place, unmodified — it is still a
valid, harmless, independently-addressable endpoint — but is no longer
called by the client, which now reads growth through the unified
observations endpoint (which calls the exact same `computeGrowthSignal` /
`phraseGrowth` functions, not a re-implementation). This avoids two
overlapping mechanisms in the one place a user actually sees them, without
deleting a previously-shipped, still-correct API surface.

---

## DELIVERABLES

1. **Observation Engine** — `server/intelligence/conversation/observation-engine.ts`
2. **Workspace Observation Matrix** — Stage 2 table above
3. **Emotional Interaction Framework** — `shared/companion-interaction.ts`
4. **Delight Framework** — `client/src/lib/companion-delight.ts`
5. **Companion Presence Specification** — Stage 7 above (one route, one hook, one existing mount point)
6. **Silence Rules** — `applySilenceRules` (Stage 6 above)
7. **Implementation Report** — this document
8. **Trust Validation** — below
9. **Rollback Plan** — Rollback Protection above

---

## TRUST VALIDATION

- **Observations use validated platform knowledge only.** Every `fact` in
  every `Observation` traces to one named, existing, unmodified owner (Stage
  1 table). `observation-engine.ts` performs zero I/O of its own reasoning —
  it is a pure function over rows the route fetches from those owners.
- **No fabricated familiarity.** `observeNutritionTrend` returns `[]` on
  `computeGrowthSignal`'s honest `null` (thin data) — proven by test (§1).
  `observeStreak`/`observeDiversity` return `[]` at zero and at any non-round
  value — proven by test (§2).
- **No fabricated achievements.** A milestone observation only ever states a
  real, currently-true number (`currentStreak`, `plantCount`) — it never
  claims "you just achieved" a threshold this module cannot actually date
  without new persisted state (documented limit, not a hidden one).
- **No duplicated intelligence.** `observeOpportunities` copies
  `explanation`/`suggestedAction` **verbatim** from the OD1 bundle — proven
  by test (§3) that the text is byte-identical, and that an unrecognised
  domain is filtered out rather than guessed into a category.
- **Personality influences expression only.** `phraseObservation` never
  changes which fact is present or its underlying numbers — proven by test
  (§5) that a streak observation's phrased text differs across personalities
  while the opportunity observation's verbatim `suggestedAction` text is
  preserved as a substring under every personality's prefix.
- **Honest gaps remain honest.** A caller with no resolvable household, no
  health-trend history, no streak, and no opportunities receives
  `{ observations: [] }` — the client's `topObservation` is `undefined` and
  no banner renders. This is the SAME "nothing shown, never a placeholder"
  contract EWO2's growth-insight line already established.

---

## DATA IMPACT

- **Reads existing data:** `user_health_trends`, `user_streaks`, the
  household planner-derived `plantDiversity` (via `assembleNutritionCentre`),
  and the `opportunity-delivery` capability's already-computed bundle. All
  four reads are pre-existing, unmodified code paths.
- **Writes new data:** None. This task adds zero tables, zero columns, zero
  write paths.
- **Changes meaning of existing data:** No.
- **Requires backfill:** No.

---

## SCOPE LOCK

**Implemented scope (this task):** Observation Engine (4 producers + Silence
Rules), Workspace Observation Matrix (audit, no new per-page widgets),
Emotional Interaction Framework (vocabulary + category mapping, 6 of 9 kinds
wired to a real producer), Delight Framework (3 motion variants + picker,
wired at one call site), one new route, one new client hook, this document.

**Explicitly excluded (not implemented, not to be started without a further
decision gate):**
- No persisted "last shown" / frequency-over-time Silence tracking (Stage 6 —
  would need one small, additive table; deliberately not added without a
  separate decision gate per the brief's "no duplicated state" caution).
- No `welcome` / `encouragement` / `seasonal` interaction producers (Stage 4
  declares the vocabulary; no existing, honest data source justified building
  them yet — see Suggestions).
- No avatar artwork, particle/confetti effects, theme CSS, or per-workspace
  animation (Stage 5 is a motion-primitive scaffold, same discipline as
  EWO2's Experience Framework scaffold).
- No change to `capability-registry.ts`, `intent-resolver.ts`,
  `intent-engine.ts`, `conversation-store.ts`, or any OD1/FI4 file.
- No full browser/Playwright UI verification was performed (no headless
  browser tool available in this environment) — verified instead via
  `tsc --noEmit` (154 pre-existing errors, 0 new — confirmed by diff against
  the documented EWO2 baseline), the full existing test suite (114/114 on
  `test:intelligence-personality-platform`, no regressions), a new dedicated
  test suite (`test:intelligence-observation-engine`, 32/32), and a live
  dev-server restart + route registration check (`curl` → `401`
  unauthenticated on the new route, not a 404/500/SPA-fallthrough).

**SUGGESTIONS (observed outside scope — do not implement without approval):**
- A small, additive `companion_observation_log` (user_id, category,
  shown_at) table would let Silence Rules genuinely avoid repetition across
  sessions/days, and let a milestone honestly say "you just crossed this"
  instead of "you are currently at this" — the single biggest upgrade to
  Stage 6's honesty ceiling, deliberately not built in this pass.
- A server-owned WEEKLY plant-diversity counter (today only computed
  client-side in `PlantDiversityReport.tsx`) would let `observeDiversity`
  produce a genuinely weekly "30 plants this week" observation instead of
  the all-time count used here.
- Wire `welcome`/`encouragement` interaction kinds to `buildGreeting` on the
  Dashboard's very first visit (a real "first time" fact, e.g. `user.createdAt`
  within N days, would be needed to keep it honest).
- Extend the Observation banner beyond "first observation only" to a small,
  dismissible queue, once real cross-session Silence tracking (above) exists
  to prevent it from ever re-showing something the user already dismissed.

---

## FILES CHANGED

**New:**
| File | Purpose |
|---|---|
| `server/intelligence/conversation/observation-engine.ts` | Observation type, 4 producers, Silence Rules (Stages 1, 6) |
| `shared/companion-interaction.ts` | `InteractionKind` vocabulary + category mapping (Stage 4) |
| `client/src/lib/companion-delight.ts` | Reusable motion variants (Stage 5) |
| `client/src/hooks/use-companion-observations.ts` | One client-side owner of the observations read (Stage 7) |
| `server/tests/test-intelligence-observation-engine.ts` | 32 assertions across honest-gap, notability, verbatim pass-through, Silence Rules, and personality voicing |
| `docs/implementation/EWX1_LIVING_COMPANION_EXPERIENCE.md` | This document |

**Modified (additive only):**
| File | Change |
|---|---|
| `server/intelligence/conversation/behaviour-engine.ts` | + `phraseObservation` (dispatches to existing builders only) |
| `server/routes.ts` | + `GET /api/intelligence/companion/observations` |
| `client/src/components/conversation/FloatingAssistant.tsx` | Growth-insight-only banner generalised to the unified Observation banner (same gating, same fresh-panel-only rule) |
| `package.json` | + `test:intelligence-observation-engine`, appended to the `test` chain |

**Database:** none.

**Verified:** `npx tsc --noEmit` (154 pre-existing errors, 0 new), full
`test:intelligence-personality-platform` (114/114, no regression from the
`behaviour-engine.ts` addition), new `test:intelligence-observation-engine`
(32/32), live dev-server restart + route registration check (`401`
unauthenticated on `/api/intelligence/companion/observations`,
`/growth-insight`, and `/food-opportunities` — all real routes, not
404/500/SPA-fallthrough).
