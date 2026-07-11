# THA Food Intelligence Platform Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `NUT2` on 2026-07-03 (EWO-FI1). No code, schema, runtime, or API changes.
**Classification:** Domain Intelligence (canonical)
**Date:** 2026-07-03
**Author:** Architecture promotion (Claude Code)
**Promoted from:** `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` (EWO-NUT2, approved 2026-07-02)
**Absorbs governing rules from:** `docs/investigations/intelligence/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (the join+rank+explain engine design; Rules G1, T0–T2, P1–P3, E1–E2, GO1–GO2, LT1–LT3 — reproduced here as governing rules rather than left in an investigation)
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree already dirty with substantial prior uncommitted INT35–NUT1/FS-series/NUT2 work on this branch (pre-existing, unrelated to this task) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` |
| Rollback tag | `rollback/before-fi1-food-intelligence-platform-promotion-20260703` → `8ae0f7e` |
| This task's writes | `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (this file), `docs/implementation/governance/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md`, one row in `docs/architecture/README.md`, one pointer stub at `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md`, references in `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` §11 |
| Code modified | None |
| Schema modified | None |
| Runtime modified | None |

**This is a governance promotion only.** No application code, database schema, services, routes, or prompts were modified. See `docs/implementation/governance/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md` for the full change log.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

| Principle | Compliance | Verdict |
|---|---|---|
| 1 — One canonical identity per entity | This document introduces no new entities. Every component named here keys on existing identities (canonical food slug, meal id, eater id, household id, user id). | ✅ Pass |
| 2 — One owner per fact | The four-plane knowledge model (§4) is the enforcement mechanism: each plane has exactly one owner. Food Intelligence is defined as owning **zero** business-domain facts (§2). | ✅ Pass |
| 3 — Progressive enrichment / single-owner state | Knowledge entities keep identity→core→optional→runtime enrichment; the transactional stores this architecture names (personalisation events, goals) get single-owner state only. | ✅ Pass |
| 4 — Runtime consumes one assembled model | Food Intelligence composes over each business domain's existing assembled model (planner service, meal-intelligence assembler, etc.) — it never re-resolves identity. | ✅ Pass |
| 5 — Reference vocabularies stay beside the spine | No merged vocabularies introduced; nutrient/benefit taxonomies remain where the SoT Register declares them. | ✅ Pass |
| 6 — No fabricated knowledge | The composition law (§4.5) makes every user-visible statement traceable to a cited Plane 1 fact; ungrounded statements are not rendered. | ✅ Pass |
| 7 — No permanent synchronisation bridge | Food Intelligence reads business-domain data at request time and writes back only through each domain's own registered capability intent — never a second copy kept in sync. | ✅ Pass |
| 8 — Evolution over replacement | Every new component is named as extending an existing owner (the Intelligence Platform's Capability Registry, the existing uplift engine, the existing WX8 assembler pattern); nothing is replaced without a named retirement plan. | ✅ Pass |

**Gate result: PASS.** Carried forward as binding: (a) Food Intelligence never becomes a second owner of business-domain data, (b) every Food Intelligence statement is grounded and cited, (c) all Food Intelligence write actions flow through the Intelligence Platform's Capability Registry — never a private write path.

---

## 1. WHY "FOOD INTELLIGENCE" AND WHAT CHANGED IN THE RENAME

This document promotes NUT2's approved 2029 vision into governing architecture. The rename from **Nutrition** to **Food Intelligence** is a rename of the *architectural domain layer* — the reasoning engine that turns canonical food knowledge into household-relevant, cited, everyday guidance. It is **not** a rename of the underlying source-of-truth stores, which keep their existing names and owners exactly as declared in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Food Knowledge (Nutrition), Nutrition Boost Rules, Food Reports, etc.). Those stores are consumed by Food Intelligence; none are renamed, moved, or re-owned by this document.

**Why the rename matters architecturally:** "Nutrition" described a set of pages and a content domain. "Food Intelligence" describes what NUT2 established as the real shape of the thing: a **Domain Intelligence layer** — a deterministic, cited, explainable reasoning engine that sits between the Business Domains (which own transactional and knowledge data) and the Intelligence Platform (which is domain-agnostic orchestration). This is a distinction the platform already needed and did not yet have a name for. Food Intelligence is the first fully specified Domain Intelligence; the pattern is designed to be reusable by any future domain reasoning layer (e.g. a future Household Intelligence) without re-deriving these rules.

---

## 2. THE THREE-LAYER SEPARATION (the load-bearing structure)

THA's architecture has exactly three layers relevant to intelligence. This document's primary architectural contribution is making the middle layer explicit and permanent.

```
┌──────────────────────────────────────────────────────────────────────┐
│  INTELLIGENCE PLATFORM  (docs/architecture/THA_INTELLIGENCE_        │
│  PLATFORM_ARCHITECTURE.md — domain-agnostic, already governing)     │
│                                                                        │
│  One Gateway · one Capability Registry · one Intent Engine ·         │
│  Conversation Gateway · permission model · knowledge index           │
│  Routes natural-language turns to capabilities. Owns no domain facts.│
└───────────────────────────────┬────────────────────────────────────┘
                                 │ capability bindings (registered intents)
┌───────────────────────────────▼────────────────────────────────────┐
│  DOMAIN INTELLIGENCE  (this document — Food Intelligence is the     │
│  first fully specified instance)                                    │
│                                                                        │
│  Deterministic join + rank + explain reasoning over ONE domain's     │
│  canonical knowledge, composed with household context at request     │
│  time. Owns its own reasoning process and its own event/goal logs.  │
│  Owns ZERO business-domain data.                                     │
└───────────────────────────────┬────────────────────────────────────┘
                                 │ reads (read-only) · writes only via
                                 │ the owning domain's own capability
┌───────────────────────────────▼────────────────────────────────────┐
│  BUSINESS DOMAINS  (per docs/architecture/                          │
│  THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md — unchanged owners)   │
│                                                                        │
│  Planner · Shopping · Pantry · Meals · Household · Diary ·           │
│  (future) Community — each keeps its own single-owner data,          │
│  exactly as declared in the SoT Register.                            │
└──────────────────────────────────────────────────────────────────────┘
```

**The rule that makes this durable:** authority flows down, never up. The Intelligence Platform never contains domain reasoning (Principle 2 of the Intelligence Platform architecture: "TIP owns no business facts and no business logic"). Domain Intelligence never contains cross-domain orchestration, conversation state, or a second assistant (that stays the Intelligence Platform's job). Business Domains never grow a private copy of Food Intelligence's reasoning or event data.

### 2.1 What each layer is and is not

| Layer | Is | Is not |
|---|---|---|
| **Intelligence Platform** | The one Gateway, Capability Registry, Intent Engine and Conversation Gateway all domains and all domain intelligences share. Domain-agnostic. | A place where food/nutrition reasoning lives. It routes to Food Intelligence; it does not replicate it. |
| **Domain Intelligence (Food Intelligence)** | The deterministic join+rank+explain engine that turns canonical food knowledge into household-relevant, cited answers and enrichment, registered as capabilities on the Intelligence Platform. | A second owner of planner, shopping, pantry, meal, household or diary data. A second assistant. A second write path into any business domain. |
| **Business Domains** | Planner, Shopping, Pantry, Meals, Household, Diary — each with one authoritative store per the SoT Register, each exposing its own capability intents. | A place that re-implements food reasoning, or that is bypassed by a direct Food Intelligence write. |

---

## 3. FOOD INTELLIGENCE ENRICHES — IT NEVER OWNS

This is the single confirmation the promotion scope requires, stated as an explicit, testable rule.

> **Rule FI1 — Enrichment, not ownership.** Food Intelligence may **read** any business domain's data through that domain's existing authoritative service, and may **write** to a business domain **only** through that domain's own registered capability intent (Planner write intents, Shopping write intents, etc. — per the Intelligence Platform's Intent Engine, §5 of `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`). Food Intelligence never gains a private write path, never caches a business domain's data as a second copy, and never becomes the fact-of-record for anything a business domain already owns.

This rule is not new policy — it restates and hardens NUT2's Domain Interaction Design ("Nutrition is a lens, never a second owner", NUT2 §6) as governing architecture, and it is the same non-negotiable the Intelligence Platform architecture already applies to itself (Principle 2: "TIP owns no business facts").

### 3.1 Enrichment map (Food Intelligence × each Business Domain)

| Business Domain | What Food Intelligence enriches | Read path (domain's own authoritative source) | Write path (domain's own capability intent) |
|---|---|---|---|
| **Planner** | Week-level ambient counts (plants, gaps, streaks); gap-aware slot suggestions; goal-aware weekly focus. | `planner_*` tables via the planner service | Planner write intents (add/swap entry) — registered capability only |
| **Shopping** | In-place line context (covers-a-gap chips); fact-based same-category swaps (existing Analyser judgement, surfaced in place); boost-accepted items with their reasoning attached. | `shopping_list` + Analyser services | Shopping write intents — registered capability only |
| **Pantry** | "Cook from what you have" framing over the existing inventory; Pantry Explore stays the knowledge hub, unchanged owner. | Pantry inventory + Food Knowledge Registry | Pantry/planner intents — registered capability only |
| **Meals** | Household-fit facts, boost options, nutrition context assembled per meal; Simply Better stays the meal-level verb. | `meals` + existing meal/food intelligence assemblers + uplift engine | Meal/boost intents — registered capability only |
| **Household** | Reads eater composition, restrictions, patterns to personalise every answer; never writes household composition itself. | `household_eaters`, restriction resolver | None — Household composition remains Household-domain-owned and Household-domain-written |
| **Diary** | Reads self-reported metrics (S-0 signal tier, §6.1) as personalisation context. | `food_diary_metrics` | None — diary entries remain Diary-domain-owned and Diary-domain-written |
| **Community** *(future, not built)* | Would re-ground shared meals/plans in the *viewer's* household facts before display. | net-new community store, when it exists (Business Domain, not Food Intelligence) | Existing meal/planner import intents — registered capability only |

**The anti-goals this map enforces (unchanged from NUT2 §6):** no business domain grows a private Food Intelligence store; no Food Intelligence surface writes into a business domain except through that domain's registered capability intent; no bridge ever syncs two owners of the same fact (Architecture Principle 7).

---

## 4. THE FOUR-PLANE KNOWLEDGE MODEL

This is Food Intelligence's internal structure — how it stays non-fabricating while composing across canonical knowledge, household context, external evidence, and generated language. Promoted verbatim in substance from NUT2 §5; renamed only where the domain label changed.

### 4.1 Plane 1 — Canonical Knowledge (what THA asserts)

- **Content:** foods, nutrients, benefits, the nutrient bridge, nutrition context, restriction library, diversity groups, editorial guidance. Generic, identical for every user.
- **Owner:** Food Knowledge Registry (`shared/knowledge/` → `knowledge_*` tables via `nutrition-knowledge-registry.ts`), canonical food identity (`shared/canonical/`), `restriction-library.ts`, `uplift-rules.ts` — exactly as declared in the SoT Register. Unchanged by this document.
- **Write path:** human editorial review only (KMS graduation, EFSA wording firewall, `SourceRef` + `lastReviewed` mandatory).
- **Contamination rule (Rule G1, unchanged):** *"Global Knowledge is read-only, household-agnostic, and flows one way — nothing household-, person-, or signal-derived is ever written into this plane."*

### 4.2 Plane 2 — Personal Intelligence (what Food Intelligence remembers about a household)

- **Content:** household composition, eater restrictions/patterns/tastes, goals, planner/shopping/diary/pantry history (read, not owned — §3), the personalisation event log, and consented external signal summaries (§6).
- **Owner:** the existing transactional single-owner Business Domain stores (`household_eaters`, planner/shopping/diary tables, `user_preferences`) plus the **personalisation event log** — built under EWO-EL1 (2026-07-03) as the reusable, domain-agnostic **Evidence & Learning Platform** (`server/intelligence/evidence-learning/` → DB `household_evidence_events` + `household_learning_signals`) rather than a Food-Intelligence-owned store, so any future Domain Intelligence layer (not only Food Intelligence) can be a consumer. A genuinely new fact at a genuinely new scope, passing the Principle 2 scope test. See `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`.
- **Behaviour rules:**
  - **Rule P1 — Learning re-weights, never authors.** Personalisation only adjusts the *weights* of transparent ranking signals; it never invents a fact.
  - **Rule P2 — Decay over delete for negatives.** Rejections decay rather than hard-block.
  - **Rule P3 — Per-person learning, per-household action.** Taste/goal learning attaches to the eater; the action taken attaches to the household.
- **Contamination rule:** never leaves the household boundary; never trains shared models; never enters Plane 1.

### 4.3 Plane 3 — External Evidence (what others assert)

- **Content:** upstream sources Food Intelligence composes from — USDA FDC composition data, Open Food Facts product records, EFSA/NHS/NIH-ODS claim wording, licensed recipe sources, and future partner health-signal feeds.
- **Owner:** the FS1-audited source integrations plus the Trusted Source Registry direction. Every external fact retains provenance, licence, and tier — external evidence is ingested into editorial review, never published direct to users.
- **Contamination rule:** external evidence becomes user-visible knowledge only by passing the editorial gate into Plane 1. It is never blended silently into canonical content; licence obligations (attribution, share-alike) render with it.

### 4.4 Plane 4 — Generated Reasoning (how Food Intelligence speaks)

- **Content:** natural-language phrasing of already-decided, already-cited bundles; free-text goal parsing; conversational continuity.
- **Owner:** the Intelligence Platform's Conversation Gateway — the one existing seam already trusted to compose across capabilities per turn.
- **Contamination rule (Rule LT3, unchanged):** *"The brain stays deterministic — even when generated reasoning phrases the output, the decision of what to recommend is never made by the LLM."* Generated reasoning never selects a food, never authors a claim, never overrides the deterministic engine. Every generated sentence must be traceable to the deterministic bundle it phrases; an untraceable sentence is not rendered.

### 4.5 The composition law

> **Every user-visible Food Intelligence statement = Plane 1 fact(s) × Plane 2 context, optionally phrased by Plane 4, with Plane 3 provenance attached to the Plane 1 half.**
>
> Any statement that cannot be decomposed this way is a defect, regardless of how helpful it sounds.

### 4.6 Community and signals against the planes

- Community testimony is Plane 2 social context at most ("households like yours cook this") — never Plane 1, never Plane 3 evidence.
- Wearable/biomarker signals are Plane 2 personal context (consented, summarised, resettable) — never Plane 1; their *interpretation* stays outside THA entirely (§6.4).

---

## 5. THE GOVERNING TRUST RULES (carried forward, permanent)

These rules originate in `THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (an investigation) and NUT2 (an investigation). They are reproduced here in full as **governing rules** so future Food Intelligence work cites this document, not the investigations.

> **Rule T0 — Safety supersedes everything.** A hard-restriction violation is never surfaced under any circumstance.
>
> **Rule T1 — Food, not bodies.** Food Intelligence makes statements about *foods and meals* (composition, plant counts, pairing, sourcing) — never about bodies, symptoms, diagnoses, or outcomes.
>
> **Rule T2 — When in doubt, defer to a professional.** Any request crossing into diagnosis, dosing, or treatment gets a warm, bounded redirect — never a guess and never a cold refusal.
>
> **Rule G1 — The Generic Knowledge Wall.** Global/canonical knowledge is read-only, household-agnostic, and flows one way; personalisation happens entirely in the join layer, never in Plane 1.
>
> **Rule E1 — No citation, no card.** Every recommendation card must show its nutrient/benefit citation chain; a candidate with no citation chain cannot enter the candidate set.
>
> **Rule E2 — Show uncertainty, don't hide it.** When evidence is nutrient-level only (no benefit-level citation), the card says so rather than implying a stronger claim than the evidence supports.
>
> **Rule GO1 — Goals are aliases, never authorities.** A goal carries no nutrition truth of its own; it resolves into the canonical chain.
>
> **Rule GO2 — Goals are per-person, action is per-household.** A goal is attributed to the eater who set it; the meal/plan action it produces is a household-level decision.
>
> **Rule LT1 — No stage skips its predecessor's trust bar.** A capability maturity stage ships only when the prior stage's trust guarantees hold in production.
>
> **Rule LT2 — Predictive ≠ presumptuous.** Predictive guidance *offers*, never *assumes*; framed as a suggestion, not a fait accompli.
>
> **Rule LT3 — The brain stays deterministic.** Restated at §4.4 — the decision layer is never the LLM.
>
> **Rule S1 — Signals contextualise, never diagnose** (new at NUT2, carried forward at §6.4).
>
> **Rule FI1 — Enrichment, not ownership** (new at this promotion, §3).

Companion verbs only (T0–T2's practical expression): Food Intelligence *adds, pairs, counts, informs, surfaces gaps* — it never *diagnoses, doses, predicts illness, or prescribes*.

---

## 6. FUTURE SIGNAL INTEGRATIONS (wearables, biomarkers, activity, sleep)

Promoted from NUT2 §7, governing rule already stated at Rule S1 (§5).

### 6.1 The signal ladder (increasing sensitivity, increasing gate)

| Tier | Signals | Treatment | Gate |
|---|---|---|---|
| **S-0 Self-reported** | Sleep hours, mood, energy, "stuck to plan" — already captured today in `food_diary_metrics` | First-class personalisation context, visibly reasoned ("you've been logging short sleep — foods with magnesium…") | Existing diary consent; no new integration |
| **S-1 Activity & sleep (wearables)** | Steps, workouts, sleep duration from Apple Health / Google Health Connect / Garmin | Read-only, summarised (weekly aggregates, not raw streams); consent-per-signal; wearables are edge adapters in front of the one Gateway | Explicit opt-in per signal type; view/delete/disconnect anytime |
| **S-2 Gut health & microbiome** | Consumer microbiome test summaries, symptom journals | Food Intelligence consumes only the user's own stated takeaways or a partner's consumer-safe summary, resolved as goal-like context | Opt-in + partner agreement + editorial review of any partner-summary vocabulary |
| **S-3 Blood biomarkers** | Results from clinician or regulated testing partners | Food Intelligence never interprets a biomarker value; it may accept a consented, interpreted, food-relevant flag in a closed vocabulary, behaving exactly like a user-stated goal | Opt-in + regulated-partner contract + legal/regulatory review + closed flag vocabulary reviewed editorially |
| **S-4 Emerging signals** | CGM trends, at-home testing, future signal classes | Admitted only by graduating through this same ladder: consented → summarised → closed-vocabulary → goal-alias semantics | New EWO per signal class; RED review |

### 6.2 What signals may do — exhaustively

1. Surface relevance — raise existing canonical topics into view at the right moment.
2. Re-weight ranking — as one more visible signal, displayable as a reason like every other signal.
3. Enrich the food story — longitudinal, counting-style observations that pair food facts with signal facts without asserting causation.

### 6.3 What signals may never do

- Trigger diagnosis-shaped output.
- Create supplement, dosing, calorie-target, or weight-loss recommendations.
- Be inferred (no combining shopping + wearable data to infer conditions).
- Enter Plane 1, train shared models, or be shared to Community in any form.
- Concern a child — signal integrations are adult-eater-only, structurally.

### 6.4 Regulatory posture (flagged for legal, not decided by engineering)

Interpreting biomarkers or personal health data to produce individual guidance risks classification as medical-device software (UK MHRA / EU MDR). The architecture keeps THA on the general-wellbeing side of that line: interpretation stays with clinicians/regulated partners; Food Intelligence consumes closed-vocabulary, food-scoped flags with the same semantics as a user-stated goal. Legal review is a blocking gate for S-2/S-3 (§8).

---

## 7. CAPABILITY ARCHITECTURE

Food Intelligence requires **no new platform** — it registers capabilities on the existing Intelligence Platform (one Gateway, one Capability Registry, one Intent Engine, capability bindings over existing Business Domain services), exactly as NUT1's nutrition enrichment binding already does today.

### 7.1 Target capability map

```
                          ┌──────────────────────────────────────────────┐
   Edge adapters          │  INTELLIGENCE PLATFORM GATEWAY (one, existing)│
   web · mobile · voice · │  intent engine · capability registry ·       │
   wearable · display     │  permission model · enrichment · cards       │
                          └──────┬───────────────────────────┬───────────┘
                                 │ read/compose               │ action intents
                 ┌───────────────┴───────────────┐   ┌────────┴──────────┐
                 │  FOOD INTELLIGENCE ENGINE     │   │ Business Domain   │
                 │  (join + rank + explain,      │   │ capabilities:     │
                 │   registered on the Gateway,   │   │ planner · shopping│
                 │   one owner of process)        │   │ pantry · meals ·  │
                 └──┬─────────┬─────────┬────────┘   │ diary · household │
                    │         │         │            │ profile · analyser│
              Plane 1     Plane 2    Plane 2(new)    └───────────────────┘
           Food Knowledge household +  ┌────────────┐  ┌────────────────┐
           Registry /   event log      │ SIGNALS     │  │ COMMUNITY      │
           canonical /  (new store,    │ GATEWAY     │  │ (new capability │
           KMS          §4.2)          │ (new cap.,  │  │  + store,       │
                                       │  §6 ladder) │  │  future)        │
                                       └────────────┘  └────────────────┘
```

### 7.2 New components (each a future EWO, named here for the roadmap — except where marked ✅ built)

| Component | What it is | Extends / replaces | SoT impact |
|---|---|---|---|
| **Food Intelligence Engine** | The deterministic join + rank + explain service (the Stages 1–5 capability ladder from `THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md`). One engine, many entry points (goals, Simply Better, Choose Better, weekly story, Companion). | Extends: uplift engine, meal scoring, WX8 assembler patterns. Replaces nothing at introduction; long-term becomes the single ranking path, retiring ad-hoc per-surface ranking surface-by-surface (Principle 8). | New service; reads Planes 1+2 only, owns no business-domain fact |
| **Personalisation Event Log** ✅ built (EWO-EL1, 2026-07-03) | Built as the **Evidence & Learning Platform** — captures structured household outcomes, accumulates them, and deterministically detects explainable patterns (never from a single observation) that require explicit household confirmation before ever informing a preference. Generalised beyond Food Intelligence into a reusable platform capability (`evidence-learning` on the Capability Registry) so any future Domain Intelligence layer can be a consumer, not only Food Intelligence — see `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`. | Extends household state; replaces nothing. | New single-owner transactional stores: `household_evidence_events` (append-only) + `household_learning_signals` (derived, confirmation-gated) |
| **Goals capability** | Goal CRUD + alias resolution (Rules GO1/GO2), registered on the Capability Registry with read/write intents. | Extends profile/household capabilities. | Goals table = new single-owner store |
| **Signals Gateway capability** | Consent management, per-signal summarisation, closed-vocabulary flags (§6). | Extends diary-metrics pattern (S-0 already exists there — Diary remains owner of self-reported metrics; the gateway owns only external-signal summaries, a different fact at a different scope). | New store for external signal summaries + consents |
| **Community capability** | Share/browse/import of meals, plans, stories; re-grounding on import; nomination-to-editorial flow. | Extends meals/templates/planner import paths (Business Domain owned). | New store for shares/social metadata only — shared meals remain `meals`-owned |
| **Evidence & provenance surfacing** | User-facing provenance unfold + licence attribution rendering, as a shared presentation component. | Extends explainability-service + `SourceRef` discipline. | None — presentation only |

### 7.3 What is explicitly NOT built

- No second assistant, no per-domain bots — every new surface (wearable, display, car) is an edge adapter to the one Intelligence Platform Gateway.
- No Food-Intelligence-owned copies of Business Domain data (§3, Rule FI1).
- No ML model that owns decisions — learning re-weights the visible signal table; weights are configuration with an audit trail.
- No new knowledge stores without the Rule 8 governance gate — the Food Knowledge Registry + KMS remain the only Plane 1 owners.

---

## 8. PHASED ROADMAP

Carried forward from NUT2 §9 as forward-looking guidance (not a commitment made by this promotion). Each phase is gated (Rule LT1), independently shippable, and sequenced from the actual current platform, not a blank slate.

| Phase | Window | Delivers | Gate |
|---|---|---|---|
| **0 — Foundation completion** | now → end 2026 | Complete WS0–WS5 + contested-domain migrations (M1, M2, M4); complete FS1 licensing remediations; continue NUT1's enrichment line | Launch surfaces live; Plane 1 single-owner convergence at 100% for Food Knowledge display |
| **1 — The Food Intelligence Engine** | 2027 H1 | Build the engine, Stages 1–2 (static → household-aware); wire the Goals capability; Simply Better and goal answers run through the one engine; provenance unfold ships product-wide | Every engine card decomposes per §4.5 in production; zero uncited cards (Rule E1 verified by test) |
| **2 — Learning & the ambient layer** | 2027 H2 → 2028 H1 | Personalisation event log + Stage 3 learning; ambient nutrition strips in Planner and Shopping; Weekly Report evolves into the Food Story; S-0 signals enter the visible signal table | Learned weights individually explainable; opt-out and reset shipped before learning ships |
| **3 — Community & prediction** | 2028 | Community capability v1 with viewer-household re-grounding and testimony firewall; Engine Stage 4 (predictive, offer-never-assume); LLM phrasing layer (traceability-enforced); S-1 wearable integrations | Proactivity restraint rules verified in usage data; wearable launch blocked on privacy review; community launch blocked on moderation + claim-firewall review |
| **4 — The full companion** | 2029 | Stage 5 conversational goal-tracking-over-time, multi-eater reconciliation; S-2/S-3 partner integrations only if the §6.4 legal gate passes; KMS automation matures toward exceptions-only curation | Stage 4 trust record; regulated-partner contracts; every §6.3 prohibition covered by structural tests |

**Phase invariants (all phases):** the two walls never move — **discovered↔published** (KMS) and **generic↔personalised** (Rule G1). The trust vocabulary never grows a clinician verb. Every phase's new store is declared in the SoT Register in the workstream that creates it.

---

## 9. RISKS

| # | Risk | Phase | Rating | Mitigation |
|---|---|---|---|---|
| R1 | Signal integrations drift into diagnosis-shaped output | 3–4 | 🔴 High | Rule S1; closed flag vocabulary; interpretation stays with partners; structural tests; legal gate blocks S-2/S-3 |
| R2 | Community becomes an unreviewed claim channel | 3 | 🔴 High | Testimony firewall (§4.6); share compositions not claims; editorial gate; moderation before launch |
| R3 | LLM phrasing quietly becomes LLM deciding | 2–4 | 🔴 High | Rule LT3 + traceability requirement (§4.4); deterministic engine owns all selection |
| R4 | Food Intelligence quietly gains a private write path into a Business Domain | all | 🔴 High | Rule FI1 (§3); every write intent traced to a registered Business Domain capability; code review gate |
| R5 | Learning weights become an opaque profile | 2+ | 🟠 Med | Every weight displayable as a reason; view/reset UI ships before learning; no signal that can't be shown can rank |
| R6 | Ambient layer becomes nagging | 2+ | 🟠 Med | Silence-default; frequency caps; counting-not-judging copy rules; easy dismissal feeding decay |
| R7 | Scope creep pulls later-phase items into earlier phases | all | 🟠 Med | Phase gates are EWO-enforced |
| R8 | Regulatory reclassification (medical device) | 4 | 🟠 Med | §6.4 posture; legal review as blocking gate; food-not-bodies line is structural |
| R9 | Partner/licence obligations (signals, recipes, OFF) unmet at scale | 0,3,4 | 🟠 Med | FS1 register maintained; licence attribution rendered with content; per-source compliance in each integration EWO |
| R10 | Editorial capacity again under-costed | all | 🟠 Med | Automation only on the THA-owned wording layer; nomination queue is demand-paced; honest gaps remain acceptable product states |

---

## 10. DEFINITION OF DONE

- **What success looks like:** the approved NUT2 vision has a permanent home in `docs/architecture/`; the domain is named Food Intelligence at the architecture layer; the three-layer separation (Business Domains / Domain Intelligence / Intelligence Platform) is explicit and testable (§2); Food Intelligence's enrich-never-own boundary is a named, citable rule (Rule FI1, §3); future Food Intelligence EWOs cite this document, not the NUT2 investigation.
- **What must not break:** nothing can — no code, schema, route, or data was touched.
- **Manual verification:** `git status` shows exactly the files listed in ROLLBACK PROTECTION; rollback tag exists (`git tag -l 'rollback/before-fi1*'`); `docs/architecture/README.md` lists this document; `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` is a pointer stub.

## 11. DATA IMPACT

- Reads existing data: **NO** (documentation only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

## 12. TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. This document strengthens every existing trust rule by making Rule FI1 explicit and permanent.
- **Could this fabricate certainty?** No. Forward-looking content (§8 roadmap, §7.2 unbuilt components) is explicitly labelled as not-yet-built; current-state claims were verified against the codebase and the SoT Register.
- **Is anything guessed but shown as real?** No.
- **What happens if the system is wrong?** If a future phase proves this architecture wrong, it is corrected by a successor governing document, exactly as this document supersedes NUT2.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES** (future stores are only named, each gated by Rule 8 at creation)
- No runtime behaviour altered: **YES**

## 13. ARCHITECTURE CONVERGENCE STATUS

```
Domain:
  Food Intelligence (Domain Intelligence layer over Food Knowledge + its
  consuming Business Domains: Planner, Shopping, Pantry, Meals, Household, Diary)

Current Canonical Owner (Business Domain layer, unchanged by this document):
  Food Knowledge Registry (shared/knowledge/ -> DB knowledge_* via
  server/services/nutrition-knowledge-registry.ts) for knowledge;
  shared/canonical/ for identity; per-SoT-Register owners for every
  transactional Business Domain.

Current Runtime Consumer(s):
  Food Report (food-report-adapter), Pantry Explore (/api/knowledge/*),
  Weekly Nutrition Report, Nutrition Centre (WX8 assembler), Simply Better
  (uplift engine), Intelligence Platform nutrition-knowledge binding + NUT1
  enrichment, meal/food intelligence assemblers.

Domain Intelligence layer status:
  This document is governance-only. No Food Intelligence Engine, Personalisation
  Event Log, Goals capability, Signals Gateway, or Community capability exists
  yet. NUT1's existing Companion nutrition enrichment binding is the only live
  Domain-Intelligence-shaped capability today, and it already satisfies Rule FI1
  (reads via existing services, writes via registered capability intents).

Duplicate Owners Remaining (Business Domain layer, inherited, unchanged):
  - client/src/lib/nutrition-benefit-library.ts (M1 pending)
  - client/src/lib/pantry-knowledge.ts (M2 pending)
  - client/src/lib/nutrition-variety.ts (M4 pending)

Current Convergence (%):
  ~60% at the Business Domain / Food Knowledge layer (inherited from the SoT
  Register, unchanged by this document — see ARCHITECTURE_PRINCIPLES.md
  Contested Domains). 0% Domain Intelligence layer build-out (by design — this
  document is governance only; Phase 0 (§8) must complete before Phase 1 build
  work begins).

Target Convergence (%):
  This document changes nothing. It sets 100% Business Domain / Plane 1
  convergence as the Phase 0 exit gate (§8) before any Food Intelligence Engine
  build work begins.

Next Planned Milestone:
  M1 (retire nutrition-benefit-library.ts), then M2, M4, per the Master
  Evolution Roadmap; Phase 0 of §8 is the umbrella; the Food Intelligence
  Engine (Phase 1) is future work, not started.

Remaining Architectural Risks:
  The three unretired prototype stores; users.diet* overlap; risk that Phase
  1+ build work starts before the Phase 0 convergence gate (mitigated by the
  gate being written into §8 explicitly).
```

## 14. SCOPE LOCK

**Implemented scope (this promotion):** exactly EWO-FI1 — promote the approved NUT2 vision into governing architecture; rename the domain from Nutrition to Food Intelligence at the architecture layer; make the Business Domains / Domain Intelligence / Intelligence Platform separation explicit; state and govern the enrich-never-own rule (Rule FI1); create this canonical document and its companion implementation record; index it in `docs/architecture/README.md`; update the Master Evolution Roadmap's forward references; leave a pointer stub at the NUT2 investigation path.

**Explicitly excluded (out of scope — not implemented by this promotion):** any implementation of the Food Intelligence Engine, Goals capability, Signals Gateway, or Community capability (the Personalisation Event Log was subsequently built under EWO-EL1, 2026-07-03 — see §7.2); any schema, route, or registry change; any change to runtime behaviour; any rename of underlying code, tables, or file paths (e.g. `nutrition-knowledge-registry.ts`, `knowledge_*` tables, `NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md` keep their existing names); any decision on regulatory classification (§6.4 flags it for legal); resolution of the contested Food Knowledge domains (M1/M2/M4 — tracked in `ARCHITECTURE_PRINCIPLES.md`, unaffected by this promotion).

---

*Governance promotion only. No code was changed in the production of this document.*
*Rollback: `rollback/before-fi1-food-intelligence-platform-promotion-20260703` → `8ae0f7e`.*
