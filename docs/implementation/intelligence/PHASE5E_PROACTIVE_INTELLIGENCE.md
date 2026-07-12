# PHASE5E — Proactive Intelligence

**Status:** Implementation report
**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER — no schema, no migration, no new engine, no new store, no new assistant. It adds
one READ verb to an existing capability, one source to an existing engine, and turns on a voice seam
that has been dormant since it was written. Small in code; wide in trust, because its blast radius is
*what THA says when nobody asked*.
**Rollback identifier:** `rollback/PHASE5E-pre-implementation-20260712` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef`

**Governing architecture:**
[`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`](../../architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md) (INT20 — **the document this workstream executes**),
[`THA_DECISION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_DECISION_ENGINE_ARCHITECTURE.md) (DEC1),
[`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`](../../architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md) (BEH1/CP2),
[`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1),
[`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) (TIP2),
[`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (TIP3),
[`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) (INT17),
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2),
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2)

**Predecessors:** PHASE5A (Knowledge Platform Activation) · PHASE5B (Decision→Evidence loop) ·
PHASE5C (Ambient Intelligence) · PHASE5D (Conversational Intelligence)

---

## 1. Summary — what this workstream found

PHASE5E was scoped as "activate proactive guidance." As with 5C and 5D, **almost none of the work was
construction.** The proactive platform was built, tested, ranked, budgeted, learning-aware, and had a
six-personality voice ready to speak. It was **unreachable**.

Three findings, each reproduced against the branch, not inherited from a prior document.

### 1.1 The Notice Engine had never spoken to a household 🔴

`GET /api/intelligence/companion/notices` is live and correct. Its one client consumer,
`use-companion-observations.ts`, fetched **`/api/intelligence/companion/observations`** — a route that
does not exist. It was renamed under OBS1; the hook never was. So Home's *"A gentle reminder"* section
fetched a 404, caught it, and rendered an empty list, silently, since the rename.

PHASE5D found this (§6, §9.4) and correctly declined to fix it out of scope. It is NTC-P1's exit
condition, so it is PHASE5E's.

### 1.2 The Behaviour Engine's notice voice was dormant, and the route bypassed it 🔴

`phraseNotice()` was code-complete and tested. `BEHAVIOUR_SURFACES` deliberately did **not** list a
notice surface, and said why: *"their route belongs to NTC-P1, not to this workstream — a surface here
is a promise that a transform ran."*

The route returned **raw `Notice` objects**. Even with the client pointed correctly, Home would have
received `{ kind: "growth", signal: {…} }` — **a fact with no sentence**. There was nothing to render.

**This is what "contextual coaching" turned out to be.** Not a new engine: the one voice seam, applied
to facts the platform already held.

### 1.3 An opportunity could not explain itself 🔴

PHASE5D **built** a "Why this?" affordance and **deleted it before shipping**, because the only
reachable answer was about the *domain*, under a button promising to explain *that card*. It recorded
the refusal in `companion-context.tsx` rather than ship the trust defect, and named the fix (§9.1):
*"register `explain` on `opportunity-delivery`, bind a handler that narrates the evidence the Decision
Engine already produced (no new reasoning — OD1 holds it verbatim), and carry a subject entity on the
opportunity payload."*

That is implemented here, to the letter.

### The honest headline

> THA computes proactive guidance on every request, ranks it, budgets it, suppresses what you have
> resolved, re-weights it by what you have confirmed about yourself, and has six voices ready to say
> it. **A household had never seen one word of it.**
>
> The gap was one renamed route, one unwired voice seam, and one missing read verb. Not a missing
> engine — and PHASE5E did not build one.

---

## 2. Architecture Bootstrap — what was read before implementing

- `docs/architecture/README.md` (the mandatory entry point)
- **`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` — in full.** This workstream executes its §8 rollout:
  **NTC-P1** (activate the canonical seam) and **NTC-P4** (learning-signal notices).
- `THA_DECISION_ENGINE_ARCHITECTURE.md` — §3 (hard boundaries), §5 (the sealed decision), §6 (budget
  doctrine), §7 (producer enrolment), §8 (explicitly rejected).
- `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` — the voice seam and its capture discipline.
- `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`
- `ENGINEERING_WORKFLOW.md` — all four compliance blocks.
- Runtime read before changing: `notice-engine.ts`, `behaviour-engine.ts`,
  `opportunity-delivery/framework.ts`, `opportunity-delivery-handler.ts`, `opportunity-engine.ts`,
  `capability-registry.ts`, `pattern-intent-resolver.ts`, `permissions.ts`, `context-view.ts`,
  `context-frame-assembler.ts`, `conversation-gateway.ts`, `routes.ts` (11480–11810),
  `companion-context.tsx`, `FloatingAssistant.tsx`, `AmbientIntelligence.tsx`,
  `FoodOpportunityCard.tsx`, `home-experience-page.tsx`.

**Conflict with governing architecture: NONE.** Every change is a rollout step the architecture already
specified. §3 records the one place the architecture said *no*, and PHASE5E complied.

---

## 3. THE ARCHITECTURAL DECISION: there is no scheduler, and PHASE5E did not build one

The mission asked for **"timely"** guidance and **"weekly"** insights. The obvious implementation is a
background job. **The governing architecture forbids it.**

- `opportunity-engine.ts`: *"'AMBIENT' means: always freshly computed from current state on request,
  **never a background job**, never a stored recommendation, never an autonomous action."*
- `routes.ts:12535`: *"**No scheduler** — this is the only way a snapshot is taken."*
- Verified: zero `setInterval` in `server/`; no `node-cron`/`agenda`/`bull`/`bree` in `package.json`.

| Word | What it does NOT mean | What it means in THA |
|---|---|---|
| **Timely** | A push at a moment THA chose | Computed **fresh from current state at the moment the household looks**. A notice is true *now*, or it is not shown. Nothing is stored, so nothing can go stale. |
| **Weekly** | A digest emailed on Sundays | The insights are **weekly in their subject**, not their schedule. The planner *is* week-shaped (`planner_weeks`); planner gaps, nutrition trends, diversity and streaks are computed over the household's real windows. THA speaks about the week without waking up to do it. |

A scheduled digest would additionally require **NTC-P5** (cross-session memory), so the same notice is
not repeated every session — which the architecture gates behind *"only if evidence demands it"* and its
own Rule 8 review. **PHASE5E produced the first evidence** (the seam is live for the first time) and
**deliberately does not pre-empt the gate.** This is the largest remaining gap (§9.1), recorded rather
than silently skipped (PKCA Rule KC12: a declined discovery is recorded, or it is re-asked forever).

---

## 4. Changes made

### 4.1 The Notice Engine speaks (NTC-P1) — *timely guidance · contextual coaching*

| Change | File |
|---|---|
| The route **voices** every notice via `phraseNotice`, **after** the Silence Rules select | `server/routes.ts` |
| `notice-voicing` claims its surface — the promise BEH1 requires | `server/intelligence/conversation/behaviour-engine.ts` |
| The dead hook is **retired**; a correct one replaces it | `use-companion-observations.ts` → `use-companion-notices.ts` |
| Home renders the voiced sentence; a client-side `.slice(0, 3)` — **a second attention budget** — is removed | `client/src/pages/home-experience-page.tsx` |

**One surface covers three phrasers, and that is deliberate.** `phraseGrowth` and `buildCelebration`
are unreachable except *through* `phraseNotice` (growth → `phraseGrowth`; streak/diversity →
`buildCelebration`). They are three branches of one seam, not three seams. A second or third surface
would promise a transform no route invokes independently — the exact dishonesty `BEHAVIOUR_SURFACES`
exists to prevent. Asserted in `test-intelligence-behaviour-decision.ts` by source-scanning
`phraseNotice`'s body.

**Voicing happens strictly after selection.** The Silence Rules choose *which* notices and *how many*
(at most two). The Behaviour Engine chooses only how they *sound*. Asserted by source-scanning the
route for `applySilenceRules(` **before** `phraseNotice(` — so a future edit cannot let voice influence
selection without failing a test.

### 4.2 Confirmed household learning becomes noticeable (NTC-P4) — *learning-aware recommendations*

`household-learning` is the **eighth** notice category — the source §2.2 named as the natural next one,
implemented in exactly the shape it specified, requiring **no amendment to that document**.

- Producer `noticeLearning()` (pure, zero-I/O) over `evidence-learning:search { status: "confirmed" }`,
  read through the **registered capability** on the ordinary platform path — never by importing EL1's store.
- **Confirmed-only is enforced structurally, in the producer**, not merely by the route's query. A future
  caller passing the wrong filter cannot make THA announce a preference a household never agreed to.
  *A `pending_confirmation` signal is a question for the household, not a notice* — it stays on the
  Profile's learning panel, where it can be answered.
- EL1's `rationale` crosses the voice seam **verbatim**. The voice may prefix it; it may never reword
  it — because a paraphrase is where *"you tend to skip fish on weeknights"* quietly becomes *"you don't
  like fish"*, which is a different and unearned claim.
- Priority is always `low`. A confirmed preference is a calm fact, never a demand for attention, and
  never (A2) a `critical`.

Learning was **already** re-weighting opportunity rank inside the Decision Engine (LEARN1). What it
could not do was *speak*. Now it can.

### 4.3 An opportunity explains itself (PHASE5D §9.1) — *conversational explanation*

Four changes, in the order PHASE5D prescribed:

1. **A structured subject.** `FoodOpportunity.subject` (`{ entity, id, label }`) — **required** on the
   producer's type, optional on OD1's envelope. Every generator already held this record: it is the row
   the opportunity's `id` is keyed on, and the label it already interpolated into its own prose. Nothing
   new is computed; what was known is now *expressed*. Carried verbatim by OD1, and **never persisted**
   (Notice Engine §3: opportunity content is never stored).
2. **The `explain` verb.** Registered on `opportunity-delivery`, bound, executable. A **READ** verb
   (`READ_ONLY_VERBS` → `ConfirmationTier: "none"`): it collects nothing, resolves nothing, writes
   nothing. `handleExplain` re-collects through the **same** `collectOpportunities` path every surface
   uses and returns the found opportunity's own explanation, evidence and subject — **verbatim**.
3. **A Context View.** `opportunity-delivery:explain`, with **`evidence` PINNED** — a pinned field is
   emitted *even when empty*, so the model can never be handed a recommendation stripped of its
   justification and left to invent one.
4. **The ask channel + the affordance.** `useAskCompanion` (the channel PHASE5D built and deleted) and a
   quiet **"Why this?"** on every opportunity card.

**Why re-collecting is the correct — and the honest — implementation.** Opportunity *content* is never
persisted; only the delivery lifecycle is. So an opportunity that has been accepted, dismissed, or has
simply **become untrue** (they filled the empty day in another tab) is **not found**, and the household
is told so. THA declines to explain a recommendation it would no longer make. A stale justification is a
confident wrong answer, which TIP3 §12.2 names as the worst thing this product can produce.

**The resolver path is a deliberate SHORT-CIRCUIT**, and this is the single most safety-relevant decision
in the workstream. The `FOOD_INTELLIGENCE` matchers carry an explicit warning: *"If a future workstream
ever adds `OPPORTUNITY_DELIVERY_MATCHERS`, these two matchers MUST be revisited so the two never co-fire
on one turn"* (INT42's "double delivery path"). Short-circuiting makes co-firing **impossible rather than
merely unlikely** — nothing else runs. It fires only when a card pointer is present **and** the utterance
is why-shaped, so it cannot fire by accident; and when it fires it is the *whole* resolution, so the
Context Composition budget is spent grounding the model on the card the household actually asked about.

### 4.4 Accept, dismiss, and the feedback loop — *clear actions*

- **Accept** and **dismiss** already existed and already emit Evidence (PHASE5B closed that edge).
  **The Evidence loop IS the feedback mechanism** — accept is positive evidence, dismiss is negative —
  and ≥3 consistent events become a Pattern the household is asked to confirm. No second feedback store
  was created; creating one would have been a second owner of the same fact.
- **`acknowledge`** has been plumbed end-to-end since PHASE5B **with no UI caller**, so COACH1's
  "seen yields to unseen" ordering had no signal to order by. It now fires when a household asks
  **"Why this?"** — which is precisely what `acknowledged` means: *seen and engaged with, but not
  resolved*. It is non-terminal (the card stays, because nothing was decided) and emits **no Evidence** —
  being seen is not an opinion, and must never become one, or THA would learn from attention rather than
  from choice.

---

## 5. Files changed

**26 files: 1 new, 1 deleted, 24 modified.** No schema, no migration.

### Server — the platform (13)

| File | Change |
|---|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | `FoodOpportunitySubject` + all three generators name their subject |
| `server/intelligence/opportunity-delivery/framework.ts` | `OpportunitySubject` carried verbatim through the adapter and envelope |
| `server/intelligence/handlers/opportunity-delivery-handler.ts` | **`explain`** verb → `handleExplain` |
| `server/intelligence/bindings/opportunity-delivery.ts` | `explain` executable |
| `server/intelligence/capability-registry.ts` | `explain` in `supportedIntents`; `apiSurface` corrected |
| `server/intelligence/context/context-view.ts` | `opportunity-delivery:explain` Context View (**evidence PINNED**) |
| `server/intelligence/intent-resolver.ts` | `selectedOpportunityId` on `IntentResolutionHints` |
| `server/intelligence/pattern-intent-resolver.ts` | The explain **short-circuit** (hint-gated) |
| `server/intelligence/conversation/context-frame-assembler.ts` | `selectedOpportunityId` pointer (pass-through only, **no** prior-ref fallback) |
| `server/intelligence/conversation/conversation-gateway.ts` | Pointer → resolver hints |
| `server/intelligence/conversation/notice-engine.ts` | `household-learning` category + `noticeLearning()` |
| `server/intelligence/conversation/behaviour-engine.ts` | `notice-voicing` surface; `learning` fact voiced |
| `server/routes.ts` | Notices route: learning source + **voicing**; turn route accepts the pointer |

### Client (7 — 1 new, 1 deleted)

| File | Change |
|---|---|
| `client/src/hooks/use-companion-notices.ts` | **NEW** — the correct route, the voiced shape |
| `client/src/hooks/use-companion-observations.ts` | **DELETED** — fetched a route that does not exist (UI Principle 5: retire on introduction) |
| `client/src/pages/home-experience-page.tsx` | Renders real voiced notices; **second attention budget removed** |
| `client/src/components/conversation/companion-context.tsx` | The **ask channel** PHASE5D withheld |
| `client/src/components/conversation/FloatingAssistant.tsx` | Consumes an ask; merges its pointer for that one turn |
| `client/src/components/intelligence/FoodOpportunityCard.tsx` | **"Why this?"** + `onAcknowledge` |
| `client/src/components/intelligence/AmbientIntelligence.tsx` | Passes `acknowledge` through |
| `client/src/hooks/use-food-opportunities.ts` | Carries `subject` |

### Tests (9) · Architecture currency (2) · This report (1)

Tests: `test-intent-resolver`, `test-intelligence-notice-engine`,
`test-intelligence-opportunity-delivery-binding`, `test-intelligence-behaviour-decision`,
`test-intelligence-context-composition`, `test-intelligence-personality-platform`,
`test-intelligence-food-opportunity-binding`, `test-dec1-decision-engine`,
`test-attn1-attention-platform`.

Architecture (**currency corrections only — no rule changed**): `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`
(§2.2 source built; §7 baseline superseded; §8 NTC-P1 ✅ / NTC-P4 ✅ / P5 evidence / P6 partial),
`THA_COMPANION_PLATFORM_ARCHITECTURE.md` (§5.2 hook name).

---

## 6. Compliance

### ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                      ✅
  Entities touched: planner_days.id, user_pantry_items.id, shopping_list_items.id
  (as opportunity SUBJECTS — each carried as its OWN existing key), and OD1's
  existing opportunity id `${capabilityId}:${type}:${recordId}`. No new key space.

□ One owner per fact                                                          ✅
  Zero new facts. `subject` is the producer's own row identity, expressed rather
  than computed. The explanation and evidence remain the producer's, verbatim.
  The learning rationale remains EL1's, verbatim. The voice remains the Behaviour
  Engine's. Not one owner gained a second.

□ No duplicate entities                                                       ✅
  Nothing new is created. `household-learning` is a notice CATEGORY over an
  existing capability's existing rows — not a new entity, store, or signal.

□ No duplicate ownership                                                      ✅
  `explain` narrates what OD1 already produced; it computes no justification.
  The Notice Engine still concludes nothing. The Decision Engine still owns rank,
  budget and suppression — and PHASE5E REMOVED a client-side `.slice(0, 3)` that
  was a second (latent) attention budget.

□ No duplicate state                                                          ✅
  `selectedOpportunityId` is a POINTER on the per-turn channel, cleared with the
  question. Opportunity content is still NEVER persisted (Notice Engine §3):
  `subject` is deliberately absent from `opportunity_deliveries`.

□ Extends existing architecture                                               ✅
  It executes the Notice Engine's OWN §8 rollout (NTC-P1, NTC-P4) and PHASE5D's
  OWN §9.1 prescription. Zero new engines. The producer-enrolment door (DEC1 §7),
  the verb taxonomy (TIP2), and the Silence Rules are all used, not extended.

□ Progressive enrichment where appropriate                                    ✅
  Each notice source degrades independently (a household with no streak simply
  contributes no streak notice). An opportunity with a malformed subject still
  DELIVERS — it merely cannot be explained — so a producer's shape error can never
  silence a `critical` safety card.

□ Knowledge domain compliance                                                 ✅
  N/A — introduces and extends no knowledge domain. It changes what the platform
  SAYS about knowledge it already holds, never what knowledge exists.

□ Honest gaps over fabricated information                                     ✅
  Strengthened in five places: an opportunity no longer being delivered CANNOT be
  explained (no stale justification); `explain` without an id is a gap, never an
  answer about the domain; an uncited learning signal is dropped (Rule E1); a
  non-confirmed signal is never noticed; and no pointer means no explain — THA
  never guesses which suggestion someone meant.

□ No permanent synchronisation bridge                                         ✅
  None. Notices are request-scoped and persisted nowhere. `explain` re-collects
  rather than caching, precisely so no second copy of an opportunity can exist.

□ Evolution over replacement                                                  ✅
  `use-companion-observations.ts` is DELETED, not left dormant beside its
  replacement (UI Principle 5). The stale assertions in three test suites were
  INVERTED to assert the new truth, not deleted to hide the old one.
```

### AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform   — every read goes through
                                                intelligencePlatform.handle(). The notices
                                                route reaches opportunities and learning
                                                signals through their REGISTERED
                                                capabilities, never by importing OD1's or
                                                EL1's stores.
✓ Uses the Capability Registry                — `explain` is registered on
                                                opportunity-delivery, bound, and truthfully
                                                declared in executableIntents (INT6A).
✓ Uses the Intent Engine                      — the "Why this?" question is an ORDINARY turn
                                                through the one Conversation Gateway. No
                                                privileged answer path exists, which is
                                                exactly why the answer can be trusted.
✓ Reuses existing business services           — no service called, no owner touched. Every
                                                fact is read from the owner that already
                                                computed it.
✓ Does not create another assistant           — one FloatingAssistant, one gateway, one
                                                history. The ask channel exists so a surface
                                                does NOT need its own assistant.
✓ Does not duplicate conversation state       — the ask is consumed and cleared; the pointer
                                                lives exactly as long as its question.
✓ Uses registered capabilities only           — one verb added to an existing capability from
                                                the CLOSED 20-verb taxonomy. No new verb, no
                                                new capability, no new engine.
✓ Uses permission-aware access                — `explain` is ownership-scoped (userId from the
                                                session, never a hint) and is a READ_ONLY_VERB,
                                                so ConfirmationTier is "none" by the platform's
                                                own rule — not by an exception written for it.
                                                Surfacing never changes acting (ATTN1 A7).
✓ Produces honest gaps rather than fabricated — see the checklist above; strengthened in five
   knowledge                                    places, and NOT ONE new claim is generated.
```

### EXPERIENCE & UI GOVERNANCE COMPLIANCE

```
✓ UX Governance Checklist (EXP § 18) completed
    · Calm before capability — Home's reminders remain capped at TWO by the Silence Rules,
      and PHASE5E DELETED the client-side slice(0,3) that was quietly a second budget.
      Nothing shouts. Silence is still the default disposition of a true fact.
    · One primary action — "Why this?" is a QUESTION, not a resolution. It is styled as the
      quietest of the three affordances and placed last, so a household never feels they must
      justify a suggestion to themselves before dismissing it.
    · Honest absence — no notices → the section does not render. Never a placeholder, never a
      "tip of the day".
    · Progressive disclosure — evidence stays behind the card's existing "Why" toggle; the
      conversational explanation is opt-in, one tap, and never interrupts.
✓ UI Governance Checklist (UIA § 18) completed
    · One new affordance (a text button) reusing existing tokens and the canonical
      IntelligenceCard. No new colour, no new motion, no new card family.
    · Colour is never the only signal — unchanged; the critical treatment remains tone + icon
      + explicit text label.
✓ Conflict resolution — none arose.
✓ Nothing owns a fact at the presentation layer — the card renders the producer's explanation,
    the producer's evidence and the Behaviour Engine's sentence. It computes none of them, and
    it RE-RANKS NOTHING (DEC1 §3).
✓ Retire-on-introduction — `use-companion-observations.ts` is DELETED in this same change. No
    dormant predecessor, no two owners of one concern.
```

> **Premium Standard (EXP2 § 17).** *Would the household feel its absence?* They already did — as
> absence. THA noticed their empty Thursday, the allergen on their shopping list, and the preference
> they had explicitly confirmed, and said **nothing**, because a hook pointed at the wrong URL. The
> product felt inert rather than broken, which is worse: there was no bug to report. Care taken on the
> household's behalf that never reaches them is not care; it is only cost. This is craft, not decoration.

### PRODUCT REGISTRY COMPLIANCE

```
✓ Registry impact assessed — would "what is THA?" answer differently now?  YES.
    THA now proactively tells a household things they did not ask about, in the
    Companion's voice, and can explain any suggestion conversationally. That is a
    genuine change to what the product IS — not a refactor.
✓ No product knowledge written into a prompt, template or fallback string (Rule PKR27) ✅
    Every sentence the household reads is derived from THEIR OWN data by a named owner
    and voiced by the registry-driven Behaviour Engine. No product fact is hardcoded.
✓ Permission filtering before composition — unchanged; untouched by this change ✅
✓ Every replaced surface retired — `use-companion-observations.ts` DELETED ✅
✓ Visibility — every surface added here is `household` (a household's own data,
    ownership-scoped by userId from the session, never a client-supplied id) ✅
```

**Registry entries created / updated / retired: NONE — and that is a reported gap, not a pass.**

> **Honest note.** `docs/product/` **does not exist.** `PKR1`/`PKR3` define the Product Knowledge
> Registry and deliberately populate it nowhere; creating it is not PHASE5E's mandate. So there is no
> entry to update — but the answer to *"would 'what is THA?' change?"* is **YES**, which means PHASE5E
> is the second consecutive user-facing workstream (after PHASE5C/5D) to accrue registry debt against a
> registry that has no home. Recorded under Rule KC12 rather than skipped silently, and escalated in
> §9.4: the debt is now compounding, and the next user-facing workstream should not be the third.

---

## 7. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:     Intelligence — Notice (INT20), Decision (DEC1), Behaviour (BEH1),
                     Evidence & Learning (EL1). No BUSINESS domain is touched.
Declared SoT:        opportunity_deliveries (OD1 delivery-store) — the pipeline's ONLY
                     persistent fact, UNCHANGED by this workstream.
                     household_learning_signals / household_evidence_events (EL1) — READ ONLY.
                     A Notice is request-scoped and owned by no store.
New store created?   NO
Existing store extended? NO — no column, no table, no migration.
                     `subject` is deliberately NOT persisted to opportunity_deliveries:
                     opportunity CONTENT is never stored (Notice Engine §3), and adding it
                     would have created a second copy of a producer's fact.
Consumer created?    YES — the notices route gains a sixth source (evidence-learning),
                     read through the REGISTERED capability.
  Reads from declared SoT? YES — via intelligencePlatform.handle(), never around it.
```

## 8. DEFINITION OF DONE

**Success:** THA proactively says something true, in its own voice, about the household's own data — and
can explain any suggestion it makes, from the evidence it already had.

**Verified (evidence, not assertion):**

| Check | Result |
|---|---|
| Typecheck | **168 → 168** — the exact pre-existing baseline. **Zero errors in any file this change touched.** Measured against a clean worktree of the rollback tag, not asserted. ✅ |
| Build (`vite build`) | exit 0 ✅ |
| Intent resolver | **137 passed, 0 failed** (was 124 — **+13 new**, all PHASE5E) ✅ |
| Notice Engine | **65 passed, 0 failed** (was 46 — **+19 new**, all NTC-P4) ✅ |
| OD1 Opportunity Delivery binding | **60 passed, 0 failed** (was 50 — **+10 new**, all `explain`) ✅ |
| Behaviour decision | 119 passed, 0 failed ✅ |
| Personality platform | 323 passed, 0 failed ✅ |
| Context composition | 166 passed, 0 failed ✅ |
| **DEC1 golden identity** | **49 passed, 0 failed** — `subject` provably does not perturb the Decision Engine's ordering ✅ |
| ATTN1 | 29 passed, 0 failed ✅ |
| Conversation gateway, EL1, FI4, registry-executability, native discovery, fallback | all pass, 0 failed ✅ |

**Behaviour proven by the new tests, not by inspection:**

- `explain` returns the producer's explanation, evidence **and** subject **verbatim**.
- An opportunity **no longer being delivered** yields an **honest gap** — never a stale justification.
- `explain` **resolves nothing**: asking why is not accepting, and never writes a delivery status.
- `explain` is **ownership-scoped**: an anonymous caller explains nothing.
- The resolver **short-circuits**: exactly one intent, and **no other capability co-fires** (the INT42
  double-delivery-path constraint, enforced structurally rather than hoped for).
- **No pointer → no explain.** A card pointer alone → no explain. Both are required.
- The ordinary planner resolution is **unregressed** (PHASE5D's week fix still holds).
- A **non-confirmed** learning signal is **never** noticed; an **uncited** one is dropped.
- EL1's rationale survives all six personalities **verbatim**.
- A low-attention learning notice **never outranks a critical** — one budget, one owner.
- The notices route calls `applySilenceRules` **before** `phraseNotice` (source-scanned), so voice can
  never influence selection.

**Pre-existing and NOT introduced here:** `test-intelligence-capability-composition` fails 8 assertions
(15 passed, 8 failed). **Verified byte-identical at the rollback tag** — it fails the same way on a clean
checkout. Not touched, not masked, reported.

**Must not break:** the Decision Engine's ordering; the delivery lifecycle; `critical` handling; the
conversation store's pointer discipline; named-entity resolution. All verified above.

**Manual test steps:**
1. Open **Home**. If the household has anything worth saying, "A gentle reminder" now shows **at most
   two** notices, **as sentences**, in the household's chosen Companion voice. (Before: always empty.)
2. Change the Companion personality in Profile, reload Home → **the same facts, differently voiced.**
3. Open the **Planner / Pantry / Shopping**, expand the ambient surface, press **"Why this?"** on a card
   → the Companion opens and explains **that card**, citing the evidence under it. Not the domain.
4. Accept or dismiss a card, then ask "Why this?" on it again → an **honest gap**, never a stale answer.
5. Confirm a pattern on the Profile learning panel → it may now appear on Home as a notice. Leave one
   **pending** → it must **never** appear.

## 9. Remaining gaps

### 9.1 A notice can repeat every session 🔴 *(the largest gap; NTC-P5)*

The Notice Engine is stateless, so the same true fact can be surfaced every session (CPA1 §11 G6).
**Before PHASE5E this cost was theoretical, because no notice reached anyone. It is now real.**

**Deliberately not closed here.** Closing it means persisting *delivery of a notice* — a new store, which
is NTC-P5's own Rule 8 review, not something to slip into an activation workstream. This is also the
blocker on any genuinely *scheduled* weekly digest (§3).

### 9.2 The parallel, ungoverned notice channels are still live 🟠 *(NTC-P2)*

`/api/home/intelligence`, `/api/planner/weeks/:weekId/intelligence` and the WX7 pantry block still
assemble celebration/seasonal/opportunity/insight objects directly, bypassing OD1's governance and the
Silence Rules. They are **convergence debt, not defects** (Notice Engine §7.2) and NTC-P2 owns them.
PHASE5E deliberately did not touch them: the architecture's ordering constraint is that the canonical
chain is proven live **before** any bypass converges onto it. It is now live — so NTC-P2 is unblocked, and
is the natural next workstream.

### 9.3 OD1 still has exactly one producer 🟡 *(NTC-P3)*

Cross-producer prioritise/group/dedupe remains proven by synthetic fixtures only.

### 9.4 The Product Knowledge Registry has no home, and the debt is compounding 🟠

`docs/product/` does not exist. PHASE5E is the second consecutive user-facing workstream to change *what
THA is* with nowhere to record it (§6). The next user-facing workstream should not be the third.

### 9.5 Inherited from PHASE5D, unchanged 🟡

The planner `add` action remains unreachable (needs a real "slot in view" concept or a confirmed
clarification turn — §9.2 there); `voice` remains an adapter-less surface; `QuickActions` still vanish
once a household has history.

## 10. DATA IMPACT

- **Reads existing data:** YES (via existing owners, through registered capabilities, unchanged).
- **Writes new data:** NO. *(`acknowledge` writes a delivery STATUS, which PHASE5B already shipped; no
  new fact, no new column, no new table.)*
- **Changes meaning of existing data:** NO. `contextFrameRef` gains a `selectedOpportunityId` key that is
  `null` on every historic turn and is not backfilled.
- **Requires backfill:** NO.

## 11. TRUST CHECK

- **Could this mislead the user?** This is the workstream's central risk, because it makes THA *speak
  unprompted*, and it is answered structurally rather than by care: an opportunity that is no longer
  being delivered **cannot be explained**; a non-`confirmed` learning signal **cannot be noticed**; an
  uncited fact **cannot be surfaced** (Rule E1); the model **cannot** receive a recommendation without its
  evidence (pinned Context View); and the resolver **cannot** answer about the domain when asked about a
  card (short-circuit). Each is a test, not a convention.
- **Could this fabricate certainty?** No. Not one sentence is generated. Every claim is a named owner's,
  verbatim; the voice may prefix, never reword — which is why `phraseNotice` is asserted to carry EL1's
  rationale intact in all six personalities.
- **Is anything guessed but shown as real?** No. Four guesses were explicitly **refused**: the
  opportunity pointer has **no** prior-entity-ref fallback (there is no such thing as "the opportunity
  they probably meant"); a malformed subject drops rather than being inferred; an unmapped notice domain
  is dropped; and a pending signal is never spoken.
- **What happens if the system is wrong?** The worst case is a *stale* notice — a true-when-computed fact
  the household has since acted on. It is bounded: notices are recomputed from current state on every
  request, and resolution suppresses an opportunity permanently. No notice executes anything; accepting
  one writes only a delivery status (ATTN1 A7 — surfacing never changes acting).
- **No architectural duplication introduced:** YES *(and one latent duplicate — the client's second
  attention budget — was removed).*
- **No new source of truth created:** YES.

## 12. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tag | `rollback/PHASE5E-pre-implementation-20260712` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef` |
| Working tree at start | **Intentionally dirty** — carried uncommitted PHASE5C (`AmbientIntelligence`) and PHASE5D (`companion-context`) work, plus PDA1/TRUST1 docs. |
| Rollback command | `git checkout rollback/PHASE5E-pre-implementation-20260712` |
| Verification after rollback | `npx tsx server/tests/test-intent-resolver.ts` → 124 passed; Home's reminders return to silently empty. |

**No migration to reverse. No data written. Rollback is a checkout.**

## 13. SCOPE LOCK

**Implemented:** NTC-P1 (activate the canonical seam: voice + live client) · NTC-P4 (confirmed learning
notices) · PHASE5D §9.1 (opportunity `explain` + structured subject + ask channel + "Why this?") ·
the first UI caller for `acknowledge` · removal of the client's second attention budget · architecture
currency corrections.

**Explicitly excluded:**
- **A scheduler / background job** — forbidden by the governing architecture (§3). Not built, and the
  reason is recorded rather than worked around.
- **NTC-P5 cross-session memory** — a new store, behind its own Rule 8 review (§9.1).
- **NTC-P2 convergence of the parallel channels** — now unblocked, deliberately not started (§9.2).
- **NTC-P3 a second producer** (§9.3).
- Any new engine, capability, verb, store, table, migration, or assistant.
- Resolution actions on Home's notices — Home stays **read-only** by design. The Silence-Ruled Companion
  notice and the page's persistent accept/dismiss panel are TWO legitimate channels over one capability
  (Notice Engine §5.2 / CPA1 §7); collapsing them would have made Home a notification feed.

**SUGGESTION (do not implement without approval):**
1. **NTC-P2** is the natural next workstream and is now unblocked.
2. `server/intelligence/README.md:3` still declares *"no assistant, no conversation, no public
   endpoint."* False for many workstreams, and it is the first thing a new engineer reads. *(Carried
   forward from PHASE5D — still unfixed.)*
3. `test-intelligence-capability-composition` has **8 pre-existing failures** (verified at the rollback
   tag). Nobody owns them.
