# PHASE5D — Conversational Intelligence

**Status:** Implementation report
**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER — no schema, no new engine, no new capability. It changes what the
Companion is grounded in on *every* turn, which is a small diff with a wide blast radius.
**Rollback identifier:** `rollback/PHASE5D-pre-implementation-20260712` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef`
**Governing architecture:** [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (TIP3),
[`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1),
[`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) (TIP2),
[`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) (INT17),
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md), [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md)
**Predecessors:** PHASE5A (Knowledge Platform Activation), PHASE5B (Decision→Evidence loop), PHASE5C (Ambient Intelligence)

---

## 1. Summary — what this workstream actually found

PHASE5D was scoped as "activate conversational experiences." Like PHASE5C before it,
almost none of the work turned out to be construction.

**The conversational platform is built, and it is good.** One assistant
(`FloatingAssistant`, mounted once, globally). One conversation store (turns +
references, pointer-disciplined, never business data). One gateway
(`POST /api/intelligence/conversation/turn`) accepting twelve surfaces. Contextual
personas with per-surface labels and quick actions. A Context Frame assembler that
implements TIP3 Part 4 exactly. Multi-turn threads, prior-entity-ref pronoun
resolution, discovery cards, guidance, enrichment, executable action proposals with
confirmation tiers, and honest fallback states. 658 tests cover it.

**And it was being starved.** The one client that talks to the gateway sent this:

```ts
surfaceHints: { currentPath: window.location.pathname }
```

`currentPath` is not a field the route reads. The route reads
`activePlannerWeekId`, `selectedMealId`, `currentFoodSlug`, `selectedPlannerDayId`
and `selectedMealSlot` — and received **none of them, on every turn, from every
surface, since the gateway shipped.**

So the Companion knew *which page* the household was on. It did not know *what was on
it*. Every pointer slot in the Context Frame — the entire mechanism TIP3 Part 4 exists
to provide — arrived empty, and the deixis TIP3 §5.3 was written to resolve ("move
**it**", "add **this** to Saturday", "is **it** good for sleep?") had nothing to point
at.

### The honest headline

> The planner persona ships a quick action reading **"What meals do I have this
> week?"**. With no `activePlannerWeekId` on the wire, the Context Frame assembler
> falls back to `storage.getPlannerWeeks(userId)[0]` — and `getPlannerWeeks` orders by
> `weekNumber`. So THA's own suggested question answered about **week 1. Always.** A
> household reading week 9 was told, fluently and with complete confidence, about a
> week they planned in January.
>
> This is the worst failure mode the product can produce (TIP3 §12.2: *"a confident
> wrong answer is the worst outcome"*). It was not a fabrication — every word was
> grounded in real data. It was grounded in the **wrong entity**, which no amount of
> grounding discipline can catch.

Two further consequences fell out of the same starvation, and one unrelated defect was
found next to them (§6).

---

## 2. Architecture Bootstrap — what was read before implementing

- `docs/architecture/README.md` (the mandatory entry point)
- `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` — TIP3, in full. This is the
  document PHASE5D implements; it is quoted throughout.
- `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — TIP1 (the spine, §1–§4)
- `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` — TIP2 (capabilities, verbs, classes, confirmation tiers)
- `ENGINEERING_WORKFLOW.md` — compliance checklists (Architecture, AI, Experience & UI, Product Registry)
- Runtime read before changing: `conversation-gateway.ts`, `context-frame-assembler.ts`,
  `pattern-intent-resolver.ts`, `companion-actions.ts`, `capability-registry.ts`,
  `meals-read-handler.ts`, `FloatingAssistant.tsx`

**Conflict with governing architecture: NONE.** PHASE5D adds no assistant, no history,
no engine, no capability, no verb, and no reasoning. It carries pointers the
architecture already specified, to an assembler already built to receive them.

---

## 3. What was actually wrong (evidence, not assertion)

Each finding below was reproduced by driving the live `PatternIntentResolver` directly.

### 3.1 The planner answered about the wrong week 🔴

`context-frame-assembler.ts:124-127` — with no hint, `activePlannerWeekId` falls back to
the household's **first** planner week. `pattern-intent-resolver.ts` then passes it
straight through:

```
[planner] "What meals do I have this week?"  ->  planner.read {"scope":"week","weekId":5}
```

`weekId: 5` appears **only** because the probe supplied `activePlannerWeekId: 5`.
Without it, the value is `weeks[0].id`. Every planner conversation in production has
been answering about week 1.

### 3.2 The nutrition persona asked about a food that does not exist 🔴

The matchers slugify whatever entity term they extract. Given the nutrition persona's
own shipped quick action:

```
BEFORE: "What are the benefits of this food?"  ->  nutrition-knowledge.explain {"foodSlug":"this-food"}
```

It slugified the **demonstrative**. THA went looking for a food called *"this food"*,
found none, and returned an honest gap — about a fabricated entity — while the food the
household was actually reading sat untouched in `currentFoodSlug`. The same bug
produced `foodSlug: "this-meal"` on the Cookbook.

This is a deixis failure, not a knowledge failure. The honest gap made it *invisible*:
the Companion looked like it was correctly admitting ignorance, when in fact it had
never understood the question.

### 3.3 The Cookbook answered about the whole cookbook 🟠

`meals.read` has supported `scope: "detail"` with a `mealId` since INT15
(`meals-read-handler.ts:342`). `buildSurfacePrimary` hard-coded `{ scope: "list" }` for
`meals` — while doing exactly the right thing for `planner` (uses its week hint) and
`nutrition-knowledge` (uses its food hint). So with a meal open, "is it good for the
kids?" was answered about the household's *entire* cookbook. A built, executable,
correct capability path reached by nothing.

### 3.4 The planner's `add` action could never fire 🟠

`companion-actions.ts:103` refuses to propose a planner write without **both**
`selectedPlannerDayId` and `selectedMealSlot` — deliberately, because the platform must
never guess which day someone's dinner goes on (TIP3 Risk R6). Nothing has ever supplied
either. INT40's Companion Task Delegation has therefore been **unreachable in production
for the planner since it shipped** — not broken, not disabled: unreachable.

PHASE5D closes half of this (§4.2) and reports the other half as a gap (§9), because
closing it honestly requires product state that does not exist.

---

## 4. Changes made

Seven files. One is new. No schema, no migration, no new engine, no new capability, no
new verb, no new reasoning.

### 4.1 The Companion Context Channel (new — the client half of TIP3 Part 4)

**`client/src/components/conversation/companion-context.tsx`** *(new)*

The channel by which a surface tells the one assistant what is on screen. It is **not a
store**, and that is the line TIP3 Risk R1 draws:

- Holds **pointer IDs only** — never a planner row, a meal, a food, a list.
- Pages publish what they **already own**. It derives, resolves and computes nothing.
- **Cleared on unmount**, so a pointer can never outlive the view that described it.
- The server **re-reads every pointer from its owning service** before use (TIP3 §5.4).
  A hint says *where the household is looking*. It never says *what is true*.

`CompanionContextProvider` is mounted once in `App.tsx`, wrapping both the routed page
(which publishes) and `FloatingAssistant` (which reads). One channel, one assistant.

Its type mirrors the server's `SurfaceHints` **exactly** — deliberately. A field that
does not exist on the server would be dropped by the route, which would make it a lie
told silently.

### 4.2 Surfaces publish their pointers

| File | Publishes | Why |
|---|---|---|
| `client/src/pages/weekly-planner-page.tsx` | `activePlannerWeekId`, `selectedPlannerDayId` | Fixes §3.1. |
| `client/src/pages/meal-detail-page.tsx` | `selectedMealId` | Conversational Cookbook (§3.3). |
| `client/src/pages/food-detail-page.tsx` | `currentFoodSlug` | Conversational Nutrition deixis (§3.2). |

**The planner publishes two pointers and deliberately not a third.**
`selectedPlannerDayId` is the day the household **explicitly selected** (the
`PlannerContext` selection) — never the page's `selectedDay`, which falls back to
`sortedDays[0]` for the grid's benefit. **That fallback is a fine thing to render and a
dangerous thing to act on**: "add it to that day" must never resolve to a day nobody
chose. `selectedMealSlot` is **not published at all**, because the planner has no such
state — slot is chosen per-action, never "in view". Inventing one is exactly the guess
`companion-actions.ts:103` refuses to make, so the planner `add` action remains an
honest gap rather than a coin-flip about someone's dinner.

### 4.3 `FloatingAssistant` sends the pointers

`surfaceHints: { currentPath }` → `surfaceHints` (the real pointers). One line, and it
is the line the whole workstream turns on.

### 4.4 A demonstrative is not an entity name (server — fixes §3.2)

**`server/intelligence/pattern-intent-resolver.ts`** — `toSlug()` now returns `""` for a
term that is only a demonstrative (`isDeicticTerm`: "this", "it", "this food", "that
meal", "the recipe"…). Every caller already guards `if (!slug) return null`, so the
matcher **declines** instead of fabricating, and the utterance falls through to
`buildSurfacePrimary` — which resolves the pointer the surface actually published.

Off such a surface there is no pointer, and an honest gap is the correct answer — but it
is now a gap about *nothing*, rather than a confident answer about a *fabricated food*.

This is a correctness fix inside an existing function, not new reasoning. Named entities
are untouched: `"benefits of lentils"` → `explain {foodSlug: "lentils"}`,
`"what nutrients does broccoli have"` → `read {slug: "broccoli"}`.

### 4.5 The Cookbook reads its own meal (server — fixes §3.3)

`buildSurfacePrimary` `case "meals"` now uses `hints.selectedMealId` → `{ scope:
"detail", mealId }`, and falls back to `{ scope: "list" }` when nothing is open — which
is what a Cookbook with nothing open honestly is. This is the *identical* pattern
`planner` and `nutrition-knowledge` already use, applied to a handler that already
existed.

### 4.6 What was built and then removed before shipping

An "ask the Companion about this card" channel (`useAskCompanion`), intended to deliver
*explain recommendations naturally* as a "Why this?" button on the ambient opportunity
cards. **It was removed, because it has no honest consumer today** — see §9.1. The
reasoning is recorded in `companion-context.tsx` at the point where the affordance would
go, so the next person does not rediscover it.

Shipping it dormant would have repeated precisely the failure PHASE5C existed to undo: a
presentation owner imported by nothing.

---

## 5. What is now true (the conversational experiences)

| Mission deliverable | State after PHASE5D |
|---|---|
| **Conversational Planner** | ✅ **Read/explain, anchored to the week on screen.** Was answering about week 1 forever. Writes (`add`) remain an honest gap — no slot state (§9.2). |
| **Conversational Shopping** | ✅ **Working, unchanged.** Surface + `shopping.read`/`add` bindings + quick actions were already correct; shopping needs no pointer (the list is user-scoped, not selected). No code change was needed and none was invented. |
| **Conversational Pantry** | ✅ **Working, unchanged.** Same as shopping: `pantry.read` + `pantry-discovery.search` route correctly from the surface alone. |
| **Conversational Cookbook** | ✅ **Now real.** Answers about the meal on screen instead of the whole cookbook. |
| **Context-aware Companion** | ✅ **This is the workstream.** The Context Frame is fed for the first time. |
| **Explain recommendations naturally** | 🟡 **Partial.** Entity-anchored explanation now works and is grounded in the *right* entity (planner week, food, meal), and the Decision Engine's evidence already renders verbatim under "Why" on every card. Explaining a *specific opportunity* conversationally is **blocked** — see §9.1. |
| **Multi-turn contextual conversations** | ✅ **Already built; now actually contextual.** Threads, prior `entityRefs` and pronoun resolution all existed. They were resolving against empty frames. |

---

## 6. Discovered, not fixed (out of scope — reported, not improvised)

**`GET /api/intelligence/companion/observations` does not exist.**
`client/src/hooks/use-companion-observations.ts:30` fetches it;
`home-experience-page.tsx:106` consumes it. The server only defines
`/api/intelligence/companion/notices` — the route was renamed under OBS1 and the client
hook was not. The Reminders section on the home experience page is silently dead.

This is real, and it is not PHASE5D's. It is recorded here so it is not rediscovered,
and listed in §9.4.

---

## 7. Compliance

### ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                      ✅
  Entities touched: planner_weeks.id, planner_days.id, meals.id, food slug.
  Each is carried as its OWN existing key. No new key space, no new id.

□ One owner per fact                                                          ✅
  Zero facts are stored by this change. The Context Channel carries POINTERS to
  facts; the server re-reads each one from its owning service (planner service,
  meal service, food knowledge registry) before use.

□ No duplicate entities                                                       ✅
  Nothing new is created. `CompanionSurfaceHints` mirrors the server's existing
  `SurfaceHints` type rather than declaring a rival shape.

□ No duplicate ownership                                                      ✅
  No attribute gains a second owner. A hint is a statement about the VIEWPORT,
  not about the domain.

□ No duplicate state                                                          ✅
  This is the TIP3 Risk R1 line and it is held: the channel is cleared on
  unmount, holds only IDs, and is never read as truth — the owner is re-read
  every turn (TIP3 §5.4). "The active week" remains whatever the planner service
  says it is.

□ Extends existing architecture                                               ✅
  It fills the `SurfaceHints` contract that `context-frame-assembler.ts` has
  declared and documented since INT18 Phase 1, and that nothing ever populated.

□ Progressive enrichment where appropriate                                    ✅
  Transactional state — no enrichment added. The Context Frame remains derived
  read state, assembled per turn and discarded (TIP1 Principle 4).

□ Knowledge domain compliance                                                 ✅
  N/A — introduces and extends no knowledge domain. It changes which EXISTING
  knowledge the Companion is grounded in, never what knowledge exists.

□ Honest gaps over fabricated information                                      ✅
  Strengthened in three places: a demonstrative can no longer become a food
  (§4.4); the planner `add` action stays unproposed rather than guessing a slot
  (§4.2); the opportunity-explain affordance was withdrawn rather than shipped
  misleading (§4.6).

□ No permanent synchronisation bridge                                          ✅
  None. The channel is per-turn and unmount-cleared. Nothing is kept in sync.

□ Evolution over replacement                                                   ✅
  Nothing replaced, nothing retired. The withdrawn ask-channel (§4.6) was never
  shipped, so it retires nothing.
```

### AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform    — every turn goes through the one
                                                 Conversation Gateway → Intent Engine →
                                                 intelligencePlatform.handle(). Nothing
                                                 routes around it.
✓ Uses the Capability Registry                 — every intent resolves to a registered
                                                 (verb × capability): planner.read,
                                                 meals.read, nutrition-knowledge.read/explain.
✓ Uses the Intent Engine                       — unchanged. PHASE5D changes the PARAMETERS
                                                 an intent resolves with, never the path.
✓ Reuses existing business services            — no service called, no owner touched. The
                                                 client publishes IDs it already holds.
✓ Does not create another assistant            — one FloatingAssistant, one gateway, one
                                                 history. The channel exists precisely so a
                                                 surface does NOT need its own assistant.
✓ Does not duplicate conversation state        — zero conversation state added. Turns,
                                                 threads and entityRefs are untouched.
✓ Uses registered capabilities only            — no capability, verb or matcher added.
✓ Uses permission-aware access                 — untouched. userId comes from the session;
                                                 hints NEVER carry identity, and the server
                                                 has always ignored any that tried.
✓ Produces honest gaps rather than fabricated  — strengthened; see the checklist above.
   knowledge
```

### EXPERIENCE & UI GOVERNANCE COMPLIANCE

```
✓ UX Governance Checklist (EXP § 18) completed — no new surface, no new visual element,
    no new primary action, no new interruption. The Companion looks and behaves exactly
    as it did; it is now correct. Calm before capability is unaffected.
✓ UI Governance Checklist (UIA § 18) completed — zero visual change. No new component
    renders. `companion-context.tsx` emits no DOM.
✓ Conflict resolution — none arose (no presentation change).
✓ Nothing owns a fact at the presentation layer — the channel carries IDs and renders
    nothing; every value shown still comes from its single owner.
✓ Retire-on-introduction — no new visual pattern introduced, so nothing to retire.
```

> **Premium Standard (EXP2 § 17).** The test is: *would the household feel its absence?*
> They already did. They asked about the week in front of them and were answered about a
> week from January, fluently. Nothing about that is felt as a bug — it is felt as an
> assistant that does not listen. Correcting it is craft, not decoration.

### PRODUCT REGISTRY COMPLIANCE

```
✓ Registry impact assessed — would "what is THA?" answer differently now?  NO.
    No page, route, journey, feature, capability, dialog, integration or setting is
    created, renamed, moved or retired. The Companion's inventory entry (one assistant,
    twelve surfaces, contextual personas) is unchanged and remains true.
✓ No product knowledge written into a prompt, template or fallback string  (Rule PKR27) ✅
✓ Permission filtering before composition — unchanged; untouched by this change ✅
✓ Every replaced surface retired — none replaced ✅
```

**Registry entries created / updated / retired: NONE.**

> **Honest note on the registry.** `docs/product/` **does not exist**. `PKR1`/`PKR3`
> define the Product Knowledge Registry and deliberately populate it nowhere. There is
> therefore no entry to update, and creating the registry is not PHASE5D's mandate. This
> is recorded rather than silently skipped, because Rule KC12 says a declined discovery
> must be written down or it is re-asked forever.

---

## 8. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:     Conversation / Intelligence (TIP3 Context Frame)
Declared SoT:        conversation_turns.contextFrameRef (pointer IDs only) — the frame
                     itself is derived read state, owned by no store.
                     Underlying pointers: planner_weeks (D14), planner_days (D14),
                     meals (D12), knowledge_* food slugs (D1) — all unchanged.
New store created?   NO
Existing store extended? NO — no column, no table, no migration.
Consumer created?    YES — the Companion Context Channel (client) is a consumer of
                     page-held IDs and a producer of request hints.
  Reads from declared SoT? YES — indirectly and correctly: it carries the ID; the
                     server re-reads the entity from its owning service every turn.
```

## 9. Remaining gaps before PHASE5E

### 9.1 An opportunity cannot be explained conversationally 🔴 *(blocks "explain recommendations naturally")*

`opportunity-delivery` supports `report / review / approve / delete` — **not `explain`** —
and **deliberately has no resolver matcher** (`pattern-intent-resolver.ts` §"ONE DELIVERY
PATH"). Its payload carries prose (`explanation`, `evidence`, `suggestedAction`) and **no
structured subject**.

So a "Why this?" button on an ambient card can today only:
- answer about the **domain** (`"why are you suggesting this?"` on the planner routes to
  `planner.read`) — a grounded answer under a button that promised to explain *that card*.
  The household would believe the recommendation had been justified. **That is a trust
  defect**, and it is why the affordance was withdrawn (§4.6); or
- answer about the **opportunity** — which needs an `explain` intent on
  `opportunity-delivery` plus a structured subject on the payload, so a routable question
  can be composed **without the presentation layer parsing intelligence it does not own**.

**PHASE5E work:** register `explain` on `opportunity-delivery`, bind a handler that
narrates the evidence the Decision Engine *already produced* (no new reasoning — OD1
holds it verbatim), and carry a subject entity on the opportunity payload.

### 9.2 The planner `add` action is still unreachable 🟠

Needs `selectedMealSlot`, which no planner UI state provides (§4.2). Either the planner
gains a genuine "slot in view" concept, or `companion-actions.ts` gains a **confirmed**
slot-clarification turn ("which meal — lunch or dinner?"), which TIP3 §4.4 already
specifies as first-class. **Do not** resolve the slot server-side from the utterance: the
refusal at `companion-actions.ts:103` is a safety design, not an oversight.

### 9.3 Voice is unimplemented 🟡

`voice` is a valid surface at the gateway with no adapter behind it (TIP3 Part 5 / Phase E3).

### 9.4 `/api/intelligence/companion/observations` is a dead client fetch 🟠

See §6. One renamed route, one un-renamed hook, one silently dead Reminders section.

### 9.5 Quick actions vanish once a household has history 🟡

`QuickActions` renders only on an empty thread, so a returning household never sees an
in-context prompt again. Not a bug; a discoverability gap worth a decision.

---

## 10. DEFINITION OF DONE

**Success:** the Companion answers about the entity in front of the household.

**Verified (evidence, not assertion):**

| Check | Result |
|---|---|
| Planner resolves to the week on screen | `"What meals do I have this week?"` + `activePlannerWeekId:5` → `planner.read {scope:"week", weekId:5}` ✅ |
| Food deixis resolves to the food on screen | `"What are the benefits of this food?"` + `currentFoodSlug:"lentils"` → `read {scope:"food", slug:"lentils"}` (was `explain {foodSlug:"this-food"}`) ✅ |
| Deixis degrades honestly off-surface | same utterance, no hint → `read {scope:"foods"}` — never a fabricated slug ✅ |
| Named entities unregressed | `"benefits of lentils"` → `explain {foodSlug:"lentils"}`; `"what nutrients does broccoli have"` → `read {slug:"broccoli"}` ✅ |
| Cookbook resolves to the open meal | `"Is it good for the kids?"` + `selectedMealId:12` → `meals.read {scope:"detail", mealId:12}` ✅ |
| Cookbook degrades honestly | no meal open → `meals.read {scope:"list"}` ✅ |
| Test suite | **658 passed, 0 failed** — resolver 124, gateway 64, COMP2 210, context-composition 164, conversation-store 55, llm-provider 41 ✅ |
| Typecheck | 168 errors → **168 errors** (unchanged pre-existing baseline); **zero in any file this change touched** ✅ |
| Build | `vite build` exit 0 ✅ |

**Must not break:** conversation history; permission scoping; the pointer discipline of
the conversation store; named-entity resolution. All verified above.

**Manual test steps:**
1. Open the planner, switch to a week that is **not** week 1, open the Companion, ask
   *"What meals do I have this week?"* → it must describe **that** week.
2. Open any food page, ask *"What are the benefits of this food?"* → it must describe
   **that** food (previously: an honest gap about a food named "this food").
3. Open a meal in the Cookbook, ask *"Is it good for the kids?"* → it must describe
   **that** meal, not the cookbook.
4. Ask the same three questions from Home (no surface pointers) → each must degrade to an
   honest, general answer. **None may invent an entity.**

## 11. DATA IMPACT

- Reads existing data: **YES** (via existing owners, unchanged)
- Writes new data: **NO**
- Changes meaning of existing data: **NO** — `contextFrameRef` already had these fields; they were persisted as `null`. They will now be populated. Historic turns keep their nulls and are not rewritten.
- Requires backfill: **NO**

## 12. TRUST CHECK

- **Could this mislead the user?** It **stops** the product misleading them. The prior
  behaviour was the worst class of error this product can produce: a fluent, grounded,
  confidently wrong answer about the wrong entity.
- **Could this fabricate certainty?** No — and one existing fabrication (a food invented
  from the word "this") is removed.
- **Is anything guessed but shown as real?** No. Three guesses were explicitly **refused**:
  the planner slot (§4.2), the unselected day (§4.2), the opportunity explanation (§4.6).
- **What happens if the system is wrong?** A wrong hint yields an answer about the wrong
  (but real, owned, permission-scoped) entity — the pre-existing failure mode, now
  narrowed from "always wrong" to "wrong only if the page lies about itself". No hint can
  cause a mutation: writes still require a registered intent at its confirmation tier, and
  `userId` never comes from a hint.
- **No architectural duplication introduced:** YES (none)
- **No new source of truth created:** YES (none)

## 13. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tag | `rollback/PHASE5D-pre-implementation-20260712` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef` |
| Working tree at start | **Intentionally dirty** — carried uncommitted PHASE5C work (`AmbientIntelligence.tsx` and its page mounts) plus PDA1/TRUST1 docs. |
| Rollback command | `git checkout rollback/PHASE5D-pre-implementation-20260712` |
| Verification after rollback | `npx tsx server/tests/test-intent-resolver.ts` → 124 passed; the Companion returns to answering about week 1. |

**Files changed (7 — 1 new, 6 modified):**

| File | Change |
|---|---|
| `client/src/components/conversation/companion-context.tsx` | **NEW** — the Companion Context Channel |
| `client/src/App.tsx` | Mount `CompanionContextProvider` around the page + the assistant |
| `client/src/components/conversation/FloatingAssistant.tsx` | Send real `surfaceHints` instead of `{ currentPath }` |
| `client/src/pages/weekly-planner-page.tsx` | Publish `activePlannerWeekId`, `selectedPlannerDayId` |
| `client/src/pages/meal-detail-page.tsx` | Publish `selectedMealId` |
| `client/src/pages/food-detail-page.tsx` | Publish `currentFoodSlug` |
| `server/intelligence/pattern-intent-resolver.ts` | Deixis guard in `toSlug`; `meals` surface primary uses `selectedMealId` |

## 14. SCOPE LOCK

**Implemented:** the client half of the TIP3 Context Frame; three surfaces publishing
their pointers; the deixis correctness fix; the Cookbook surface-primary fix.

**Explicitly excluded:**
- Voice (TIP3 Phase E3) — no adapter.
- Any new capability, verb, matcher bank, engine, handler, or reasoning path.
- The opportunity-explain affordance — **withdrawn deliberately** (§4.6, §9.1).
- The planner `add` slot (§9.2) — requires a product decision, not a guess.
- The dead `/companion/observations` route (§6, §9.4) — a real bug, another workstream's.
- Publishing pointers from Shopping/Pantry — **they need none**; inventing hint fields
  for them would have been duplication with no consumer.

**SUGGESTION (do not implement without approval):**
1. Fix `use-companion-observations.ts` → `/api/intelligence/companion/notices` (§9.4).
   One line; the Home Reminders section is dead until it lands.
2. `server/intelligence/README.md:3` still declares "no assistant, no conversation, no
   public endpoint." That has been false for many workstreams. It is the first thing a new
   engineer reads about the Intelligence Platform.
