# NTC-P2 — Notice Platform Convergence

**Status:** IMPLEMENTATION REPORT
**Workstream:** `NTC-P2` — the second phase of the Notice Engine rollout (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` §8).
**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback-ntc-p2-pre-notice-convergence` → `b4a63af8`
**Predecessor:** `PHASE5E_PROACTIVE_INTELLIGENCE.md` (NTC-P1 + NTC-P4 — made the canonical chain live)

---

## 0. MANDATE

NTC-P1 proved the canonical chain works. It did not make it the **only** chain.

The Notice Engine Architecture §7.2 named three live, ungoverned notice channels that
predate the framework and are grandfathered **only until their scheduled convergence**.
This workstream is that convergence:

> **NTC-P2 — Converge the parallel notice channels.** One surface at a time, re-point
> `/api/home/intelligence`, `/api/planner/.../intelligence`, and the WX7 pantry block at
> the canonical pipeline. Existing UI contracts may keep their response shapes as thin
> projections; what converges is the *source and governance*, not the pixels.
> *Exit: no notice reaches a user except through OD1 governance + Silence Rules; the
> bypass assemblies in `routes.ts` are consumers, not second engines.*

**Nothing here creates a second notice system.** Every change either points an existing
surface at the one engine, or deletes a duplicate of something the engine already owns.

---

## 1. THE HONEST BASELINE — WHAT WAS ACTUALLY THERE

Verified against the branch at `b4a63af8`, not asserted from prior documents.

### 1.1 The four ambient channels

| Channel | Route | Governed? |
|---|---|---|
| Companion notices | `GET /api/intelligence/companion/notices` | ✅ Notice Engine + Silence Rules + `phraseNotice` |
| Food opportunities | `GET /api/intelligence/food-opportunities` | ✅ OD1 (mute / de-dupe / lifecycle) |
| **Home intelligence** | `GET /api/home/intelligence` | ❌ **bypass** |
| **Planner intelligence** | `GET /api/planner/weeks/:weekId/intelligence` | ❌ **bypass** |
| **WX7 pantry opportunity** | inside `GET /api/pantry/intelligence` | ❌ **bypass** |

### 1.2 The five findings

**F1 — Duplicate notice generation, byte for byte.** The seasonal headline was derived
in **two** places from the same producer, by the same rule ("first card of
`looking_ahead`, else `discoveries`"): `server/lib/household-companion-fields.ts:88-97`
and, inline, in the canonical notices route (`server/routes.ts:11556-11566`). §7.2 named
this exactly — the bypasses *"re-surface the same seasonal headline the Notice Engine
would."* This is the duplicate notice generation the mission names, and it is the only
literal one on the branch.

**F2 — The gather logic was trapped inside one route handler.** ~130 lines of
"fetch from six owners → run the pure producers → `applySilenceRules` → `phraseNotice`"
lived inline in `routes.ts`. **This is the structural reason the bypasses exist.** There
was no way for a second surface to obtain a governed notice short of copying the
handler — so every surface that wanted to say something unprompted assembled its own.
A governed pipeline that only one caller can reach will grow bypasses forever, and no
amount of documentation prevents it.

**F3 — Four true facts reached users with no governance and no voice.** `celebration`,
`seasonalHighlight`, `opportunity` and `householdInsight` are, by §2.1's definition,
**Notices**: passive, request-scoped projections of facts a registered owner already
computed about the household's own data, which the household did not ask for. They
reached the Home companion card and the Planner strip having passed **no** Silence
Rules (no cap, no de-dupe, no priority order) and **never** the Behaviour Engine's voice
seam. Four unprompted rows, always, regardless of what else was competing for attention.

**F4 — WX7's pantry block was a second engine inside `routes.ts`.** It computed a new
metric ("adding X would unlock N meals you already have the rest of") from pantry
contents + system meals, inline in the route handler, calling it an `opportunity` while
sharing no type with OD1 — un-muted, un-de-duped, un-resolvable, and citing nothing.
Its sibling route (`/api/shopping/intelligence`) has no such block, which is the clearest
evidence it was an ad-hoc addition rather than a pattern.

**F5 — The client wrote prose for a fact.** `PantryIntelligencePanel.tsx:145-153`
composed the unlock sentence itself (`` `Adding ${ingredient} would unlock ${n} meals…` ``).
The one place in this entire surface family where the client authors words about the
household's data rather than rendering the server's verbatim.

---

## 2. THE DESIGN

### 2.1 One gather owner — `notice-gateway.ts`

The single I/O orchestrator every notice surface calls. It gathers from the registered
owners, hands each to the Notice Engine's **existing pure producers**, runs
`applySilenceRules`, and voices the survivors through `phraseNotice`.

This is **not a second engine**. It is the "pure reasoning core, thin I/O orchestrator"
split FI4's own opportunity engine already uses, applied to the seam that lacked it:

- The **engine** (`notice-engine.ts`) stays exactly what §5.2 requires — *"a zero-I/O
  pure module"* that *"holds no reference to the registry"*. Not one line of I/O moves
  into it.
- The **gateway** does what §5.2 says the caller must do: *"every producer read flows
  through `intelligencePlatform.handle()` **performed by the calling route, not by the
  engine**."* It is that calling code, extracted from one route so that every route can
  reach it.

F2 is the finding that makes this the load-bearing change. Converging three bypasses
without it would fix three symptoms and leave the cause in place.

### 2.2 Surface scopes — one mouth per knowledge type

A scope names **which categories a surface is the mouth for**. It is applied at *gather*
time (the out-of-scope producers are never run), never as a slice of the emitted list —
so the Silence Rules remain, exactly as §6 requires, *"the ONLY place presentation
order/volume is decided."*

```
NOTICE_SCOPE.companion  → all eleven categories        → home-experience "A gentle reminder"
NOTICE_SCOPE.household  → celebration · seasonal-highlight
                          food-discovery · household-insight
                                                        → Home companion card, Planner strip
```

This is the notice analogue of `AmbientIntelligence`'s `domains` prop — already
sanctioned by §5.2: *"Two presentation channels over one capability are legitimate…
Neither is a duplicate owner."*

**The scope is required for correctness, not convenience.** Every narrative category is
`low` priority (a calm fact is never a demand for attention). An *unscoped* Home card
would therefore be permanently starved by any `medium`/`high`/`critical` opportunity —
and would render exactly the opportunities `AmbientIntelligence` already renders two
components below it on the same page. The scope is what stops convergence producing the
duplicate presentation it exists to remove.

Criticals are not lost to it: the dashboard and the planner both mount
`AmbientIntelligence`, which auto-expands on `critical` (ATTN1 A3). The harm signal keeps
its own mouth.

### 2.3 Three new categories — the taxonomy grows, the system does not

Under NTC-P2's gate, and following NTC-P4's precedent exactly (a row in §2.2's table, a
pure producer, a `NOTICE_SOURCE` entry — no new lifecycle, no new store, no new gate):

| Category | Fact kind | Producing owner (unchanged) |
|---|---|---|
| `celebration` | `narrative` | `stories()` — `shared/stories/engine` (WS11) |
| `household-insight` | `narrative` | `stories()` — `shared/stories/engine` (WS11) |
| `food-discovery` | `narrative` | `discover()` — `shared/discovery/engine` |

§9's condition on any new category is *"a registered owner behind it"*. All three have
one — the same canonical shared engines the bypass routes were already reading. Nothing
new is computed; what changes is that their output now passes the attention budget and
the voice seam instead of going straight to a `<p>`.

One fact kind serves three categories, which is precedented: `opportunity` already serves
three. `narrative` carries a single verbatim `headline` — the sentence its engine already
wrote. `phraseNotice` gains one case, routing it to `voiceGuidanceLabel`, which prefixes
and **never rewords** (§9: *"any rewording of producer content — stop"*).

### 2.4 The WX7 pantry block — converged, and honestly NOT made a notice

The unlock fact is extracted out of `routes.ts` into one owned, pure, tested module
(`server/lib/meal-unlock.ts`), which composes its own sentence and **cites the meals it
counted**. The route becomes a consumer. The client stops writing prose.

It is **not** promoted to an OD1 `DeliverableOpportunity`, and it is **not** made a
Notice. Both were considered and both are wrong, for reasons worth recording rather than
quietly resolving:

- **Not an OD1 opportunity.** §8 admits producers *"where they earn it"*. This one does
  not, on two counts. It is **food-scoped** — it exists because the household opened a
  panel about one specific food — so it is not *delivered* to a household at all, and
  OD1's lifecycle (`delivered → acknowledged → dismissed | accepted`) has nothing to
  transition. And OD1's `subject` requires `{ entity, id: number, label }` — an existing
  row. The unlock ingredient is precisely the thing the household **does not have**; it
  has no row and no id. The type system refuses it, and it is right to.
- **Not a Notice.** §2.1: a Notice is a fact the household *"did not ask about"*. The
  household tapped this food. This is the answer to the question the panel asks — page
  content, in the same family as the `mealSupport`, `household` and `simplyBetter`
  sections beside it, none of which are notices either.

So it stops **impersonating** an opportunity (the field is renamed `mealUnlock`; it
shares no name with OD1's vocabulary), stops being computed in a route handler, and
starts citing its evidence. That is the whole of what was actually wrong with it.

**A household-scoped version of this fact — "the one ingredient that would unlock the
most meals for you" — *would* earn OD1 registration, and is named as a gap for NTC-P3
(§7).** Building it here would be a product change disguised as a convergence, which is
the mistake PHASE5B explicitly declined to make.

---

## 3. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Notices keep their existing id space (`<category>` for singletons,
  `opportunity:<id>` and `household-learning:<id>` for the keyed ones). The three
  new categories are singletons per request: `celebration`, `household-insight`,
  `food-discovery`. No new key space.

☑ One owner per fact
  Every new notice's fact is a verbatim string from an EXISTING owner:
  stories() (WS11) for celebration and household-insight; discover() for
  food-discovery; seasonalStories() for seasonal — the same owners the bypass
  routes already read. The gateway computes nothing. The engine concludes nothing.
  The seasonal headline, previously derived by TWO owners (F1), now has ONE.

☑ No duplicate entities
  No new entity. `notice-gateway.ts` is an I/O ORCHESTRATOR over the existing
  pure engine, not a second engine — it holds no rules, no thresholds, no
  ordering and no cap of its own. `meal-unlock.ts` is the WX7 computation moved
  out of routes.ts to an owner, not a new fact.

☑ No duplicate ownership
  The Silence Rules remain the Notice Engine's sole possession — the gateway
  CALLS applySilenceRules and never re-sorts, re-slices or re-caps its output.
  Surface scopes are applied BEFORE the engine, at gather time.

☑ No duplicate state
  Nothing new is persisted. A Notice remains request-scoped and stored nowhere.
  OD1's `opportunity_deliveries` remains the pipeline's only persistent fact.

☑ Extends existing architecture
  Extends the Notice Engine in place (NTC-P4's precedent: a row in the §2.2
  table, a pure producer, a NOTICE_SOURCE entry). Extends the FI4 "pure core,
  thin I/O orchestrator" split to the notice seam. No new pattern.

☑ Progressive enrichment where appropriate
  Transactional/presentational, not a knowledge entity. Each of the six owners
  degrades independently: an owner that has nothing contributes no notice and
  never blocks the others, and never yields a fabricated stand-in.

☑ Knowledge domain compliance
  N/A — introduces no knowledge domain. It changes which already-true facts are
  surfaced and when, never what is true (CPA1 §0).

☑ Honest gaps over fabricated information
  An empty notice set is a correct, complete answer and is never padded. Every
  converged field is `null` when its owner said nothing OR when the attention
  budget declined it — and the response reports `gatheredCount` vs `cap`, so the
  silence is auditable rather than indistinguishable from having nothing to say.

☑ No permanent synchronisation bridge
  None. The bypass routes now READ from the one pipeline; they mirror nothing.

☑ Evolution over replacement
  `deriveHouseholdCompanionFields` is not deleted — it is demoted from "the thing
  two routes call" to "the pure adapter the gateway calls once", and its seasonal
  derivation becomes the single owner of that headline. The duplicate copy inside
  the notices route is RETIRED in this same change.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — opportunities and learning signals are
    read ONLY through intelligencePlatform.handle(), never by importing OD1's
    framework or EL1's store.
✓ Uses the Capability Registry — `opportunity-delivery` and `evidence-learning`,
    both already registered. Zero new capabilities (CPA1 §7).
✓ Uses the Intent Engine — every capability read is a typed (verb × capability).
✓ Reuses existing business services — stories(), seasonalStories(), discover(),
    storage.*, assembleNutritionCentre(). Not one is modified.
✓ Does not create another assistant — no new engine, no new channel; three are removed.
✓ Does not duplicate conversation state — none is touched. The ambient seam still
    never reaches the LLM (§5.3): the Notice Engine emits zero prompt bytes.
✓ Uses registered capabilities only.
✓ Uses permission-aware access — every read is keyed on the authenticated user's own
    id, never a client-supplied one. The gateway takes a `User`, not a userId.
✓ Produces honest gaps — silence is a first-class outcome, and is reported as such.
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
✓ UX Governance Checklist (EXP1 §18, incl. Premium Standard §17) — completed.
    The visible effect is FEWER ambient rows, not more: the Home card and Planner
    strip now show at most two unprompted notices instead of always four. That is
    "calm before capability" (Principle 4) and the attention budget doing exactly
    what it exists to do. Premium standard: the household would feel the absence of
    this restraint — four unprompted claims competing on a home screen is the
    noise premium is defined against. §6 forbids raising the cap as a fix, and it
    was not raised.
✓ UI Governance Checklist (UIA2 §18) — completed. No new visual pattern. Response
    shapes are unchanged, so every existing component renders unchanged markup; the
    fields simply arrive governed and voiced.
✓ Conflict resolution — none arose.
✓ Nothing owns a fact at the presentation layer — and one violation of this is
    REMOVED: the client-side prose composition in PantryIntelligencePanel (F5).
✓ Predecessors retired in the same change — the inline gather block, the duplicate
    seasonal derivation, and the ad-hoc WX7 opportunity are DELETED, not deprecated.
```

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
✓ Registry impact assessed. `docs/product/` does not exist on this branch — PKR1/PKR3
    define the registry and deliberately do not populate it. There is no entry to
    update and none may be invented here; creating the registry is its own gated
    workstream (PKCA §7 Phase 7). Recorded as a known, owned gap rather than
    silently skipped.
✓ No new page, route, journey or capability is created. Three routes change their
    SOURCE, not their contract. One response field is renamed
    (`/api/pantry/intelligence`: `opportunity` → `mealUnlock`) — noted here as the
    one wire-contract change in this workstream, with its sole consumer updated in
    the same change.
✓ No product knowledge is written into any prompt, template or fallback string.
```

---

## 4. CHANGES MADE

**Net effect on `server/routes.ts`: −257 lines** (+144 / −401). Convergence removed more
than it added, in the file that had become the platform's second notice engine. That is
the shape of a real convergence: if `routes.ts` had grown, something would have been
wrong.

### New files (4)

| File | What it is |
|---|---|
| `server/intelligence/conversation/notice-gateway.ts` | **The one gather owner.** The I/O orchestrator every notice surface calls: gathers from the registered owners, runs the engine's pure producers, applies the Silence Rules, voices through the Behaviour Engine. Declares the named surface scopes. Holds no rule, threshold, ordering or cap of its own. |
| `server/lib/household-history.ts` | `buildHouseholdHistory`, moved verbatim out of a closure inside `registerRoutes`. It was reachable only by an Express handler; the gateway needs it and is not a route. |
| `server/lib/meal-unlock.ts` | The WX7 pantry-unlock computation, moved out of `routes.ts` to an owner. Pure, tested, composes its own sentence, cites the meals it counted. |
| `server/tests/test-intelligence-notice-convergence.ts` | 64 assertions. Mostly *structural* — because the defect this workstream fixes is not a wrong value, it is a **second place a right value is computed**, and no unit test over a pure function can see that. |

### Modified files (7)

| File | Change |
|---|---|
| `server/intelligence/conversation/notice-engine.ts` | +3 categories (`celebration`, `household-insight`, `food-discovery`), +1 fact kind (`narrative`), +3 pure producers, +2 `NOTICE_SOURCE` entries. **Still zero-I/O and pure** — asserted by test. |
| `server/intelligence/conversation/behaviour-engine.ts` | `phraseNotice` gains one `narrative` case, routed to `voiceGuidanceLabel` (prefixes, never rewords). Deliberately *not* `buildCelebration`, which wraps an achievement *phrase* — wrapping a finished sentence in it would produce a claim neither engine made. |
| `server/intelligence/conversation/knowledge-assembly.ts` | `applySilenceRules` → **`applyEnrichmentLimits`**. The §7.3 "naming-collision risk", renamed. Zero callers; behaviour identical. |
| `server/routes.ts` | The notices route becomes a 5-line consumer. `/api/home/intelligence` and `/api/planner/.../intelligence` become consumers. The WX7 block is deleted. The duplicated week-progress loop is collapsed to one `computeWeekProgress`. The notice-engine producers are **no longer imported here at all**. |
| `client/src/components/PantryIntelligencePanel.tsx` | Renders the server's sentence and evidence verbatim. **The client-side prose composition is deleted.** `opportunity` → `mealUnlock`. |
| `server/tests/test-coach1-proactive-coaching.ts` | The "exactly one call site applies the Silence Rules" assertion now **walks the whole server tree** instead of one file. |
| `server/tests/test-intelligence-behaviour-decision.ts` | The voice-seam assertions follow the pipeline to the gateway, plus a new one: `routes.ts` may never call `phraseNotice`, `applySilenceRules`, or any producer. |

### The one thing the stronger test found on its first run

Widening COACH1's assertion from *one file* to *the whole server* immediately failed —
on `knowledge-assembly.ts`'s unrelated `applySilenceRules`. §7.3 had recorded that
collision as accepted debt and a "naming-collision risk" **eight months before it cost
anything**, and this is what it cost: the platform's central claim — *exactly one function
applies the attention budget* — was not mechanically checkable, because a second function
wore its name and no test could tell them apart. Renaming it is what makes the assertion
enforceable, and the assertion is what will catch the fourth bypass.

### Validation

- **Full test suite: 4072 passed, 0 failed, across 68 suites.**
- **Typecheck gate: PASS** — baseline 168 errors, current 168, **no new type errors**.
  Every file this workstream touched is individually type-clean.
- New suite registered in `package.json` (`test:intelligence-notice-convergence`) and
  wired into `npm test` — a test that is not in the suite is a test that will rot.
- **Server boots clean**; all four notice surfaces are registered and auth-gated (401, not
  404/500).

### Driven end-to-end against real data — and what it proved

Structural tests prove the wiring *exists*; they do not prove it *runs*. The converged
pipeline was driven in-process against a real user with real planner history
(`testuser_0xz7Nl`, id 2):

| Scope | Owners read | Gathered | Shown | Result |
|---|---|---|---|---|
| `companion` | 5 (`opportunity-delivery`, `user_health_trends`, `user_streaks`, `household-stories`, `household-learning`) | **12** | **2** | Two `planner-gap` notices, `high`, **voiced**: *"Add a meal to Monday in "Week 6"."* |
| `household` | **1** (`household-stories`) | 2 | 2 | `seasonal-highlight` + `food-discovery`, **voiced**: *"Looking ahead to autumn, you may enjoy Apple, Leek, Beetroot."* |

Three things this observed, that no unit test could:

1. **The attention budget is real.** Twelve true facts were offered; two were spoken. Ten
   were withheld — and `trust.gatheredCount` reports it, so the silence is auditable.
2. **The scope is a genuine GATHER filter, not a post-hoc slice.** The household scope's
   `sources` lists **one** owner. The `opportunity-delivery` capability was never called —
   its cost was not paid and its output never existed to be discarded.
3. **§2.2's design decision is empirically correct, and this is the evidence.** Under the
   companion scope, the two surviving notices are both `planner-gap` — **zero narrative
   notices survived**. An *unscoped* Home companion card would therefore have rendered
   exactly the two opportunities `AmbientIntelligence` already renders on that same page,
   and **none of the narrative content the card exists to show**. The scope is not a
   convenience: without it, convergence would have produced the duplicate presentation it
   exists to remove. That was predicted in §2.2 from the priority model, and the branch
   confirms it.
4. **Every notice met the voice.** All four surfaces now speak through the one Behaviour
   Engine seam. Before NTC-P2, the two narrative ones never had.

---

## 5. DEFINITION OF DONE

| Requirement | Met by |
|---|---|
| No notice reaches a user except through the Silence Rules | All four notice surfaces call `notice-gateway.ts`; no route runs a producer or `applySilenceRules` itself |
| Opportunities reach users only through OD1 governance | Unchanged and re-verified: the only opportunity reads are `opportunity-delivery:report` |
| The bypass assemblies are consumers, not second engines | `/api/home`, `/api/planner/.../intelligence` project the gateway's output; the WX7 computation is out of `routes.ts` |
| Duplicate notice generation removed | The seasonal headline has one derivation (F1) |
| No new notice system | Zero new engines, capabilities, stores, lifecycles or caps |

---

## 6. TRUST CHECK

- **Nothing is fabricated.** Every notice is a verbatim string from a named owner. The
  three new producers copy a headline and add nothing.
- **Nothing is reworded.** `voiceGuidanceLabel` prefixes; it never edits. The narrative
  headline crosses the voice seam byte-identical.
- **Nothing new is claimed.** No metric, threshold, ranking or cluster is introduced by
  this workstream, in the engine, the gateway or any route.
- **Silence is honest and auditable.** `gatheredCount` vs `cap` is reported, so "we had
  nothing to say" is distinguishable from "we had four things and chose two."

---

## 7. REMAINING INTELLIGENCE GAPS

Named, owned, and deliberately not closed here. Each would have been a product change or a
new gate smuggled into a convergence workstream.

### G1 — Repeat-notice fatigue is now real, and is the largest gap in the pipeline (NTC-P5)

The Notice Engine is **stateless**, so a notice can repeat every session (CPA1 §11 G6).
PHASE5E named this the moment it made the chain live. **NTC-P2 makes it worse, and should
say so:** the converged Home and Planner surfaces are the two most-visited pages in THA,
and they now show notices that were previously re-derived fresh each time with no memory
either — but they now do so *through a channel that is supposed to have an attention
budget*, which raises the expectation that it remembers. A cap of two per moment means
nothing if it is the same two, every moment, forever.

Closing it means persisting *delivery of a notice*, which is a new store, which is
NTC-P5's own Rule 8 review. It is not a thing to slip into a convergence.

### G2 — The second real producer, and the household-scoped meal unlock (NTC-P3)

OD1 still has **exactly one** registered producer (`food-intelligence`); cross-producer
prioritise/group/de-dupe remains proven by synthetic fixtures only. NTC-P2 surfaced a
concrete candidate — the household-scoped meal unlock (§2.4) — whose pure computation now
exists and is tested. Its one real blocker: `FoodOpportunitySubject` requires an existing
row id, and the unlock ingredient is by definition a food the household **does not have**.
That type needs widening before this producer can register, and widening it is a decision
about OD1's subject model, not a side effect of a notice workstream.

### G3 — Plant diversity has three derivations (contested, and not a notice)

`/api/home/intelligence` computes a *weekly* plant count; `PlannerIntelligenceStrip`
recomputes it **client-side** from `weekIngredients` and ignores the server's; the
Nutrition Centre owns the *all-time* `plantDiversity` the `diversity-milestone` notice
reads. The Home `/30` bar and the Planner `/30` bar are therefore derived from different
sources **and can disagree today**. Plant diversity is already a CONTESTED domain in
`ARCHITECTURE_PRINCIPLES.md`. NTC-P2 did not touch it — it is progress data, not a notice,
and converging it is a Data-ownership workstream. It is the most user-visible
inconsistency this investigation found and did not fix.

### G4 — `/api/pantry/intelligence` and `/api/shopping/intelligence` are near-duplicates

Both assemble `mealSupport`, `household`, `simplyBetter` and connected-food rows from the
same two assemblers, with independently-worded prose (`"Your household reaches for this
regularly"` vs `"Your family enjoys this regularly"` — the same fact, two voices, neither
the Behaviour Engine's). Real duplication, but food-page content rather than a notice path.

### G5 — Three client components hand-declare the same response shape

`HomeIntelligenceCompanion`, `PlannerIntelligenceStrip` and `home-experience-page` each
declare their own copy of the home-intelligence payload interface. There is no shared type,
so a server-side field rename breaks all three independently and silently. NTC-P2 kept the
wire contract stable precisely so this stayed a latent risk rather than an outage — but it
remains latent.

### G6 — NTC-P6 is still partial

The model can be handed an **opportunity** (`opportunity-delivery:explain`, with `evidence`
PINNED). It still cannot see a **Notice** — so the Companion cannot say *"I mentioned your
empty Thursday earlier."* The §5.3 boundary holds and was never approached: the Notice
Engine emits **zero prompt bytes**.

---

## 8. ROLLBACK PLAN

| | |
|---|---|
| Rollback tag | `rollback-ntc-p2-pre-notice-convergence` → `b4a63af8` |
| Inspect | `git show rollback-ntc-p2-pre-notice-convergence` |
| Roll back | `git reset --hard rollback-ntc-p2-pre-notice-convergence` |
| Data impact | **None.** No schema change, no migration, no backfill. Nothing new is persisted. Rollback is pure code. |

---

## 9. SCOPE LOCK

**In scope:** the three §7.2 bypass channels; the gather-logic extraction; the three
narrative categories; the duplicate seasonal derivation.

**Explicitly NOT in scope** (each named as a gap in §7 rather than half-done):

- NTC-P3 (a second registered producer) — including the household-scoped meal-unlock
  opportunity this workstream declines to build (§2.4).
- NTC-P5 (cross-session notice memory) — still gated on its own Rule 8 review.
- The `/api/pantry/intelligence` ↔ `/api/shopping/intelligence` assembly duplication —
  real, but it is food-page content, not a notice path.
- The weekly plant-count derivation, which has three implementations. Real, contested,
  and not a notice.
