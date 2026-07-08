# THA Observation Engine Architecture

**Status:** GOVERNING ARCHITECTURE — Intelligence Governance (canonical). Established by workstream `INT20`, 2026-07-08.
**Classification:** Intelligence Governance — the single owner of what the platform proactively notices, and of the attention budget under which any notice reaches the user.
**Governing documents:** `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `PLATFORM_QUALITY_ARCHITECTURE.md`
**Implementation record:** `docs/implementation/INT20_OBSERVATION_ENGINE_ARCHITECTURE.md`
**Direct precedent:** `docs/implementation/FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md` (the producer), `docs/implementation/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` (the delivery lifecycle), `docs/implementation/INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md` / `INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md` (evidence & learning), CPA1 §4.3/§5.2 (the engine's Companion-layer position)
**Rollback:** `rollback-int20-pre-observation-engine` → `fbc0a3e`

---

## 0. MANDATE

**There is one Observation Engine. Every passive notice — every "here is something true about your own data that you did not ask about" — is an Observation: a fact an existing owner already computed, adapted into one shape, selected and rate-limited under one attention budget, voiced by the one Behaviour Engine, and, when it proposes action, resolved through the one opportunity-delivery lifecycle. No other component may decide what the platform proactively notices, how often, or in what order.**

The Companion Platform's hard invariant (CPA1 §0) applies without amendment and is the reason this layer is safe to own attention:

> The Observation Engine may change **which already-true fact** is surfaced, and **when**. It may never change **what is true, what is permitted, or what requires confirmation** — and it may never compute a new metric, threshold, or judgement of its own.

This document is the component-level architecture for the engine CPA1 names as one of the Companion's five responsibilities — the same relationship the Context Composition Engine Architecture has to the Conversation Gateway. It details CPA1; it does not override it.

---

## 1. EXECUTIVE SUMMARY

THA already has every part of an observation pipeline — built, tested, and owned in exactly one place each:

- **Producers** compute the facts. The Food Opportunity Engine (FI4) identifies `planner-empty-day`, `pantry-item-unused-in-plan`, and `shopping-restriction-conflict` from a household's own data — deterministic, cited, prioritised, never persisted. Companion Growth computes the one minimum-sample-gated trend signal. Streaks, plant diversity, and seasonal highlights each have an existing owner.
- **Delivery governance** exists. The Opportunity Delivery Framework (OD1) fans out to registered producers through `intelligencePlatform.handle()`, de-duplicates against what a user has already seen, respects `mutedOpportunityTypes`, and owns the only persistent fact in the pipeline: the delivery lifecycle (`delivered → acknowledged → dismissed | accepted`) in `opportunity_deliveries`.
- **The adapter** exists. `server/intelligence/conversation/observation-engine.ts` (EWX1) wraps those already-computed facts into one `Observation` shape across seven closed categories and applies the Silence Rules — de-dupe, priority order, at most two per moment.
- **Learning** exists. The Evidence & Learning platform (EL1) accumulates outcome evidence and derives household-confirmable signals — never from fewer than three consistent events.

What THA does **not** have is a single governed answer to *"what does the platform notice, and who is allowed to tell the user?"* On the current branch the canonical chain is **dormant** — no server route exposes observations, food opportunities, or learning signals, and no page renders the panels — while **parallel, ungoverned notice channels are live**: `GET /api/home/intelligence` and `GET /api/planner/weeks/:weekId/intelligence` assemble `{ celebration, seasonalHighlight, opportunity, householdInsight }` directly from the `shared/discovery`, `shared/stories`, and `shared/seasonal` engines, and the WX7 pantry-opportunities block builds its own "opportunities" in `server/routes.ts` — none of it passing through OD1's mute/de-dupe/lifecycle governance or the Silence Rules.

This document makes the dormant chain canonical, names the live bypasses as convergence debt (not defects — they predate the framework), and defines the rollout that activates the one chain and retires the bypasses' independence, one gated workstream at a time.

**The symmetry worth stating once:** the Context Composition Engine budgets the *model's* attention — every byte the LLM reads as grounding, under one budget. The Observation Engine budgets the *user's* attention — every unprompted notice the user reads, under one budget. Same architectural move, opposite direction, and the two never overlap: the ambient observation seam never touches the LLM, and the per-turn prompt is never assembled by the Observation Engine (§5.3).

---

## 2. WHAT IS OBSERVED

### 2.1 The definition

An **Observation** is a passive, request-scoped projection of a fact an existing owner already computed about **this user's or household's own data**. It has a closed category, a priority, and a fact payload copied **verbatim** from its producer. It is computed fresh on every request and persisted nowhere.

### 2.2 The closed source taxonomy

Seven categories (`ObservationCategory`), five fact kinds, each with exactly one producing owner. The engine adds no eighth category and no new fact without a registered owner behind it — an unmapped domain is dropped honestly, never guessed into a category.

| Category | Fact kind | Producing owner (unchanged) | What it is |
|---|---|---|---|
| `nutrition-trend` | `growth` | `companion-growth.ts` over `UserHealthTrend` rows | The one minimum-sample-gated trend signal |
| `streak-milestone` | `streak` | `storage.getUserStreak` | Streak at a notable multiple (×7) |
| `diversity-milestone` | `diversity` | assembled plant-diversity count | Plant count at a notable multiple (×10) |
| `planner-gap` | `opportunity` | FI4 via `opportunity-delivery` (`report`) | Empty planner days |
| `pantry-opportunity` | `opportunity` | FI4 via `opportunity-delivery` (`report`) | Pantry item unused in the plan |
| `shopping-opportunity` | `opportunity` | FI4 via `opportunity-delivery` (`report`) | Shopping item conflicting with a household restriction |
| `seasonal-highlight` | `seasonal` | `seasonalStories()` | The pre-chosen seasonal headline |

The `opportunity` rows are the load-bearing ones: they arrive **only** through the `opportunity-delivery` capability's `report` verb — never by calling FI4's engine internals — so OD1's muting, duplicate-delivery prevention, and terminal-status suppression have already been applied before the Observation Engine ever sees them. A future Domain Intelligence producer becomes observable by registering in OD1's `OPPORTUNITY_SOURCES`, not by touching this engine.

**Named future source (not authorised here):** a **confirmed** EL1 learning signal ("your household consistently swaps out fish meals — want the planner to reflect that?") is the natural eighth observation source. It enters through the same shape — a registered capability (`evidence-learning`) read via the platform, adapted verbatim — and only for signals with `status = confirmed`. A `pending_confirmation` signal is a question for the household, not a notice.

### 2.3 What is never observed

- **Nothing without a registered owner.** The engine computes no metric, threshold, or cluster of its own — its own header says "NO new business logic and NO reasoning of its own", and that is the contract, not a comment.
- **No other household's data.** Every producer read is ownership-scoped by the producer's own permission rules; the engine adds no read path of its own.
- **No model-inferred patterns.** Observation is deterministic adaptation. Anything learned belongs to EL1, behind its ≥3-events / ≥0.7-consistency / household-confirmation gates. **A single observation never becomes a preference** — that is EL1's founding rule, restated here as the Observation Engine's boundary with learning.
- **No raw behaviour surveillance.** Producers observe *state* the user already owns (their planner, pantry, shopping list, diary-derived trends), not interaction telemetry. Guidance analytics and product-event logging remain separately owned and are not observation sources.

---

## 3. WHO OWNS OBSERVATIONS

One owner per fact, walked explicitly:

| Fact | Owner | Persistence |
|---|---|---|
| The underlying business fact (an empty day, a restriction conflict, a trend) | The producing capability's own SoT (Planner D14, Shopping D15, Pantry D8–11, Household D16, trends) | The producer's existing tables — unchanged |
| The opportunity (explanation, evidence, suggestedAction, priority, type) | The producer (FI4 today); recomputed fresh per request | **Never persisted** |
| "Has user X seen / dismissed / accepted opportunity Y" | OD1's `delivery-store.ts`, sole owner of `opportunity_deliveries` | The pipeline's **only** persistent fact |
| Which types the user has muted | `user_preferences.mutedOpportunityTypes`, read via `storage.getUserPreferences()` | Existing prefs owner |
| The Observation itself (category, priority, verbatim fact) | **Transient.** The Observation Engine composes it per request and owns no store | **Never persisted** |
| The attention budget (Silence Rules: de-dupe, priority order, cap 2) | **The Observation Engine — its only genuine ownership** | n/a (pure function) |
| The category → interaction-kind vocabulary | `shared/companion-interaction.ts` (closed, shared verbatim server↔client) | n/a |
| The phrasing of a voiced observation | The Behaviour Engine (`phraseObservation`) — the same one voice seam every Companion output uses | n/a |
| Outcome evidence and learned signals | EL1's `evidence-learning-store.ts` (`household_evidence_events`, `household_learning_signals`) | EL1's existing tables |

Two consequences fall straight out of this table:

1. **The Observation Engine owns a decision, not data.** Its single canonical possession is the Silence Rules — the un-bypassable choke point deciding volume and order of ambient notices. Everything else it touches is someone else's, verbatim.
2. **Statelessness is the current design, and its known cost is already named.** CPA1 §11 G6 records that without a cross-session log, a notable observation can repeat across sessions. The named (not built) fix — a small additive `companion_observation_log` — would, if ever approved, record *delivery of a notice*, never a copy of any producer's fact, and would be owned by the Observation Engine's store exactly as `opportunity_deliveries` is owned by OD1's. That remains its own future Rule 8 review.

---

## 4. FROM OBSERVATION TO RECOMMENDATION

An observation becomes a recommendation by **graduation, never by escalation** — each step crosses into a mechanism that already exists, already has an owner, and already gates it:

```
  fact            a producer computes it from the household's own data
   │              (FI4, Companion Growth, streaks, diversity, seasonal)
   ▼
  opportunity     OD1 collects via intelligencePlatform.handle(), filters
   │              muted types, suppresses already-resolved ids, prioritises,
   │              groups, persists first-delivery rows
   ▼
  observation     the Observation Engine adapts what survives — verbatim
   │              explanation and suggestedAction — and the Silence Rules
   │              choose at most two per moment
   ▼
  notice          the Behaviour Engine voices it; the Companion panel or a
   │              domain surface renders it; the user may ignore it forever
   ▼
  resolution      acknowledge / dismiss / accept — OD1's review/delete/approve
   │              verbs, strong-confirmation-gated, writing ONLY delivery status
   ▼
  action          if the user acts, the suggestedAction becomes an ordinary
   │              typed intent through the Intent Engine — parse → resolve →
   │              validate → CONFIRM → invoke the owning service (TIP1 §5)
   ▼
  evidence        the outcome is recordable as an EL1 evidence event
   ▼
  learning        ≥3 consistent events → a pending signal → the household
                  confirms or declines → producers' owners may then honour it
```

**The lines that make this safe:**

- **A recommendation is always the producer's, verbatim.** The Observation Engine forwards `explanation` and `suggestedAction` unchanged (asserted in its test suite). It never composes advice, never re-ranks a producer's judgement, never merges two producers' facts into a new claim.
- **No observation executes anything.** Accepting an opportunity transitions a delivery record; it does not touch a planner entry, shopping item, or pantry row. Acting requires a separate, confirmed intent whose confirmation tier is decided server-side by capability class (TIP2 §4–5) — an observation cannot lower it.
- **Learning is downstream of outcomes, never of notices.** Showing an observation generates no evidence. Only what the user *does* is evidence, and only EL1's thresholds turn evidence into a signal, and only the household's explicit confirmation turns a signal into something any owner may act on.
- **Silence is a first-class outcome.** Most true facts should never be surfaced. The cap of two per moment, the notability gates (×7 streaks, ×10 diversity), and the mute list mean the default disposition of an observable fact is *unspoken* — the engine exists as much to withhold honestly as to surface.

---

## 5. INTEGRATION

### 5.1 With the Intent Engine (TIP1 §5, TIP2)

The Observation Engine sits entirely on the read side. It invokes nothing, and nothing about an observation shortcuts the intent pipeline:

- Resolving an observation-backed opportunity uses OD1's registered verbs (`review`/`approve`/`delete`) — three of the closed 20, platform-wide strong-confirmation, no special case.
- Acting on a suggestion is a fresh `(verb × capability)` intent resolving to one existing endpoint, confirmed by its class. The Intent Engine neither knows nor cares that the intent originated from a notice.
- No new verb, no new capability class, and no confirmation-tier exception may ever be introduced *for* observations.

### 5.2 With the Capability Registry (TIP2)

The Observation Engine is **not a capability and must not become one.** It is a Companion-layer presentation seam (CPA1 §7: "the Companion Platform registers zero new capabilities"), and it holds no reference to the registry. The registered capabilities in this pipeline are `opportunity-delivery` and `evidence-learning`; every producer read flows through `intelligencePlatform.handle()` **performed by the calling route, not by the engine** — the engine receives plain data and stays a zero-I/O pure module. Widening what is observable therefore never touches the engine: register a producer in OD1's `OPPORTUNITY_SOURCES`, or (future, gated) adapt confirmed EL1 signals.

Two presentation channels over one capability are legitimate and already named (CPA1 §7): the Companion's silence-ruled notice and a page's persistent accept/dismiss panel both read `opportunity-delivery:report`. Neither is a duplicate owner; the capability owns the opportunity exactly once. What is **not** legitimate is a channel that reaches around the capability to a producer's internals or to raw tables — that is the §7 bypass debt this document schedules for convergence.

### 5.3 With the Context Composition Engine (INT17)

The boundary is absolute in both directions:

- **The ambient seam never touches the LLM.** Observations are fetched by a dedicated request outside the per-turn pipeline (CPA1 §5.2), voiced deterministically by the Behaviour Engine, and rendered as cards. No model call, no prompt bytes, no grounding.
- **The Observation Engine never serialises prompt content.** If observations are ever to reach the model as grounding — e.g. so the Companion can say "I mentioned your empty Thursday earlier" — they enter **only** as a capability Full Result composed by the Context Composition Engine under its budget, its guarantees, and its Context View contract. The Observation Engine emitting one byte of CONTEXT DATA would make it a second owner of the prompt — exactly what INT17 §7 forbids on its side and this document forbids on this side.
- The two engines share the invariant (change how much / which / when — never what is true) and the discipline: deterministic, zero-I/O composition; verbatim facts; honest declaration of what was withheld. The Silence Rules are to the user what the token budget is to the model.

### 5.4 With the Companion Platform (CPA1) and Evidence & Learning (EL1)

CPA1 remains the governing frame: one Companion, one Behaviour Engine, one Observation Engine, phrasing after selection, both seams ending in the same voice. This document adds component depth — the source taxonomy (§2), the ownership walk (§3), the graduation ladder (§4), and the rollout (§7) — and changes none of CPA1's rules. EL1 bounds the engine from the other side: observation is *what we noticed*, learning is *what repeated and was confirmed*, and the two vocabularies stay deliberately distinct so neither can impersonate the other.

---

## 6. THE SILENCE RULES — THE ATTENTION BUDGET

The one mechanism the engine owns, stated as guarantees of the emitted set:

1. **Cap.** At most `MAX_OBSERVATIONS_PER_MOMENT = 2` observations per request. A moment is a panel-open, not a conversation turn.
2. **Priority.** High before medium before low, with the producer's own priority copied verbatim — the engine never re-derives it.
3. **De-duplication.** One observation per id; the same fact arriving via two categories is surfaced once.
4. **Notability.** Milestone categories fire only at their gates (streak ×7, diversity ×10). An unremarkable true fact is silence, not filler.
5. **Honest absence.** No producer data → no observation → an empty set. The engine never pads, never invents a "tip of the day".
6. **Determinism.** Same inputs → same selection. No clock-based rotation, no randomness. (The Behaviour Engine's day-seeded phrasing varies the *voice*, never the *selection*.)

Raising the cap is the Observation Engine's equivalent of raising `CAPABILITY_CONTEXT_BUDGET_CHARS` — the move INT17 §7 forbids as a fix. More attention spent on the same selection buys nothing and costs every user; improvement must come from better producers and better relevance upstream, not a louder channel.

---

## 7. CURRENT STATE — THE HONEST BASELINE

Verified against the branch (`int1-intelligence-platform`, 2026-07-08), not asserted from prior documents:

1. **The engine is code-complete, pure, and tested** (`observation-engine.ts`; `test-intelligence-observation-engine.ts` covers producers, gates, verbatim copying, and the Silence Rules) — and **dormant**. `GET /api/intelligence/companion/observations` does not exist in `server/routes.ts`; the client hook `use-companion-observations.ts` names it but no component calls the hook. CPA1 §4.3/§5.2 describe this seam as wired; on this branch it is designed but not connected. The same is true of `GET /api/intelligence/food-opportunities` (FI5's `FoodOpportunitiesPanel` has no page consumer) and `GET /api/intelligence/learning-signals` (`LearningSignalsPanel`, likewise).
2. **Live, ungoverned notice channels exist in parallel.** `/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence` assemble celebration/seasonal/opportunity/insight objects straight from `shared/discovery`, `shared/stories`, `shared/seasonal`; WX7's pantry-opportunities block builds ad-hoc opportunities in `routes.ts`. They share no types with OD1, bypass mute/de-dupe/lifecycle governance and the Silence Rules, and re-surface the same seasonal headline the Observation Engine would. They predate the framework and are **convergence debt, not defects** — and they are the reason "one Observation Engine" needs a governing document rather than a module comment.
3. **Known duplication inside the canonical lineage**, accepted and named: a second, unrelated `applySilenceRules` in `knowledge-assembly.ts` (same name, different concern — enrichment items; a naming-collision risk), and a priority-rank sort implemented three times (FI4, OD1, Observation Engine) by deliberate layer-independence.
4. **OD1 has exactly one registered producer** (`food-intelligence`); cross-producer behaviour is proven by synthetic fixtures only.

---

## 8. ROLLOUT PATH

Each phase is a separately gated workstream under `ENGINEERING_WORKFLOW.md`. **Nothing below is authorised by this document.** Order is chosen so the canonical chain is proven live before any bypass is converged onto it.

**OBS-P1 — Activate the canonical seam.** Wire `GET /api/intelligence/companion/observations` exactly as CPA1 §5.2 specifies (route performs all I/O — trends, streak, diversity, `opportunity-delivery:report` — each best-effort; engine selects; `phraseObservation` voices; panel renders once per fresh open). Wire the FI5 food-opportunities route/panel and the learning-signals route/panel the same way. *Exit: the dormant chain is live end-to-end; observations reach a real user with Silence Rules applied; resolutions round-trip through OD1's verbs.*

**OBS-P2 — Converge the parallel notice channels.** One surface at a time, re-point `/api/home/intelligence`, `/api/planner/.../intelligence`, and the WX7 pantry block at the canonical pipeline: opportunities via `opportunity-delivery:report` (registering `shared/discovery`-backed producers in `OPPORTUNITY_SOURCES` where they earn it), seasonal/celebration via the observation categories that already exist for them. Existing UI contracts may keep their response shapes as thin projections; what converges is the *source and governance*, not the pixels. *Exit: no notice reaches a user except through OD1 governance + Silence Rules; the bypass assemblies in `routes.ts` are consumers, not second engines.*

**OBS-P3 — Second real producer.** Register a second Domain Intelligence producer in `OPPORTUNITY_SOURCES` (OD1's own named next milestone), proving cross-producer prioritise/group/de-dupe against real data and retiring the synthetic-fixture caveat. *Exit: two live producers, zero changes to collection logic.*

**OBS-P4 — Learning-signal observations.** Adapt **confirmed** EL1 signals as an observation source, with household confirmation remaining EL1's gate and the engine adapting verbatim. *Exit: a confirmed signal can be noticed; a pending one never is.*

**OBS-P5 — Cross-session memory (only if evidence demands it).** If OBS-P1 telemetry shows repeat-notice fatigue is real, take `companion_observation_log` (CPA1 §11 G6) through its own Rule 8 review. *Exit: notices can be genuinely dated; still zero producer content persisted.*

**OBS-P6 — In-turn grounding via the CCE (optional, last).** If the Companion should reference its own notices mid-conversation, expose them as a capability Full Result with a Context View, composed by the Context Composition Engine like any other grounding. *Exit: the model can see observations; the Observation Engine still emits no prompt bytes.*

---

## 9. NON-NEGOTIABLES

Hard stops, in the spirit of `ENGINEERING_WORKFLOW.md` STEP 7, CPA1 §12, and INT17 §7:

- **Any second ambient-notice channel** — a route, panel, or prompt block that surfaces unprompted facts without passing OD1 governance and the Silence Rules — **stop.** That is a second Observation Engine wearing different clothes; §7.2's channels are grandfathered *only* until their scheduled convergence.
- **Any reasoning inside the engine** — a new metric, threshold, cluster, ranking, or judgement not copied verbatim from a producer — **stop.** The engine adapts and selects; it never concludes.
- **Any rewording of producer content** before the Behaviour Engine's voice seam — **stop.** Explanation and suggestedAction are verbatim or absent.
- **Any observation that executes, or lowers a confirmation tier** — **stop.** Acting is always a separately confirmed intent; accepting an opportunity only ever writes delivery status.
- **Any persistence of an observation or a producer's fact** by this layer — **stop.** The only persistent facts are OD1's delivery lifecycle and (if ever approved) a delivery log — never content.
- **Any preference or behaviour change inferred from a single observation** — **stop.** Learning is EL1's, behind its thresholds and the household's explicit confirmation.
- **Any prompt bytes emitted by the Observation Engine** — **stop.** Grounding is the Context Composition Engine's, alone (§5.3).
- **Any new observation category without a registered owner behind it, or any guessed mapping for an unmapped domain** — **stop.** Unmapped is dropped, honestly.
- **Any raising of the per-moment cap presented as a fix** — **stop.** Improve the producers, not the volume.
- **Any second Observation Engine, anywhere, rather than the one extended in place** — **stop.**

---

## 10. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| One canonical Observation Engine defined | §0 mandate; §3 (single owner of the attention budget); §9 (second-engine stop) |
| What is observed | §2 — closed seven-category taxonomy, one owner per source, never-observed list |
| Who owns observations | §3 — full ownership walk; engine owns a decision, not data |
| How observations become recommendations | §4 — graduation ladder through OD1, Intent Engine confirmation, EL1 learning |
| Integration with Intent Engine, Capability Registry, Context Composition Engine | §5.1–§5.3 (+ §5.4 CPA1/EL1) |
| No implementation, no business logic changes | This document and its INT20 record are the only artefacts; verified in INT20 |
| Clear rollout path | §8 — OBS-P1…P6, each separately gated, activation before convergence |

---

*Required reading before adding any proactive notice, ambient insight, nudge, or observation source anywhere in THA — including any new route or page section that tells the user something they did not ask about.*
*Implementation record: `docs/implementation/INT20_OBSERVATION_ENGINE_ARCHITECTURE.md`.*
*Rollback: `rollback-int20-pre-observation-engine` → `fbc0a3e`.*
