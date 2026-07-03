# NUT2 — Future-State Nutrition Vision (2029)

**Document type:** Investigation & vision design only — no code, schema, route, runtime, or data change.
**Date:** 2026-07-02
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-NUT2 (🔴 RED — architectural vision; governs future workstreams)
**Author role:** Senior product architect + nutrition-platform lead.
**Predecessor:** `docs/implementation/NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md` (EWO-NUT1 — delivered turn-specific, honestly-gated nutrition enrichment inside the Intelligence Platform).

**Governing architecture read before this investigation (STEP 2 bootstrap):**
- `docs/architecture/README.md` (canonical entry point)
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (domain ownership)
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (launch sequencing + long-term vision §10–§11)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`
- `docs/investigations/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (join + rank + explain engine; five-stage ladder; Rules G1, T0–T2, P1–P3, E1–E2, GO1–GO2, LT1–LT3)
- `docs/investigations/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` (external source provenance & licensing)

---

## ROLLBACK PROTECTION (STEP 1)

| Item | Value |
|---|---|
| Git status at start | Working tree already dirty with substantial prior uncommitted INT35–NUT1/FS-series work on this branch (intentionally dirty — pre-existing, unrelated to this task) |
| HEAD at start | `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Rollback tag | `rollback/before-nut2-future-state-nutrition-vision-20260702` → `4a2da73` |
| This task's writes | Exactly one new file: `docs/investigations/NUT2_FUTURE_STATE_NUTRITION_VISION.md` |
| Undo this doc only | `rm docs/investigations/NUT2_FUTURE_STATE_NUTRITION_VISION.md` |

**This task makes no code, schema, route, API, migration, or data change and generates no health claims.** It produces exactly this file plus one git tag.

---

# SECTION 1 — EXECUTIVE SUMMARY

By 2029, Nutrition is no longer a set of pages inside The Healthy Apples. It is the **connective intelligence of the whole product**: every plan, shop, pantry glance, meal, and conversation quietly carries trusted nutrition understanding, personalised to the household, explained on demand, and never fabricated.

The defining idea of this vision is that **THA's 2029 differentiation is not more knowledge — it is more trustworthy translation.** The world of 2029 is saturated with AI apps that will happily generate a confident nutrition answer. THA's position is the opposite and is already structurally encoded in today's platform: a deterministic, cited, explainable engine where **canonical knowledge, personal intelligence, generated reasoning, and external evidence are four permanently separate planes** that compose at request time and never contaminate each other (§5).

Three commitments carry from today to 2029 unchanged — they are the product:

1. **The Generic Knowledge Wall (Rule G1)** — global nutrition truth never learns about a household; personalisation happens entirely in the join layer.
2. **Companion verbs only (Rules T0–T2)** — THA *adds, pairs, counts, informs, surfaces gaps*; it never *diagnoses, doses, predicts illness, or prescribes*. This survives every new signal source, including biomarkers (§7).
3. **The explanation is the ranking trace (Rules E1–E2)** — every recommendation decomposes into (a cited generic fact) × (a private household fact) × (a visible signal weight). No citation, no card.

What grows between now and 2029 is **depth of personalisation, breadth of signal, and quietness of delivery** — never the trust model. The roadmap (§9) delivers this in five phases, each of which is a straight continuation of a workstream that already exists on this branch today.

**Confidence:** High on the architecture (every layer proposed extends an owner that already exists in the SoT Register or the Capability Registry). Medium on the external-integration timeline (wearable/biomarker partnerships depend on commercial and regulatory work outside engineering's control — flagged explicitly in §7.4 and §10).

---

# SECTION 2 — THE 2029 VISION FOR NUTRITION

## 2.1 One sentence

> **In 2029, a household's trusted nutrition understanding is present in every food decision they make — plan, shop, cook, eat, learn — without them ever having to open a "nutrition feature".**

## 2.2 The five properties of 2029 Nutrition

| Property | Meaning in 2029 | Seed that exists today |
|---|---|---|
| **Ambient** | Nutrition intelligence appears *inside* the Planner, Shopping, Pantry, Meals, and Companion at the moment of decision — not on a separate report the user must remember to visit. | Nutrition Boosts in meal detail; Companion enrichment (INT41/NUT1); Nutrition Centre (WX8) |
| **Household-shaped** | Every recommendation is reconciled across all eaters: hard restrictions gate absolutely, soft patterns and tastes weight, and the "why" names whose need shaped the answer. | `household_eaters`, restriction resolver, household compatibility engine |
| **Explained, always** | Every card, nudge, and sentence can unfold to its full provenance chain — source, benefit link, household fact, signal weight — in two taps. | Nutrient bridge; `SourceRef` discipline; explainability-service |
| **Longitudinal** | THA understands the household's food story over years — seasons, streaks, gaps, growth — and can tell it back honestly ("your household's plant diversity has grown every autumn since 2027"). | Weekly Nutrition Report, Nutrition Centre journey model, diary metrics |
| **Bounded** | The companion knows exactly where it stops: food, not bodies. Out-of-bounds requests get a warm, useful redirect, never a guess and never a cold refusal. | Rules T0–T2; goal class C decline path |

## 2.3 What 2029 Nutrition is NOT

Explicitly out of the vision, at every phase, permanently:

- **Not a diagnostic tool.** No deficiency diagnosis, no supplement dosing, no illness prediction, no calorie-restriction or weight-loss prescription — regardless of how rich the signal data becomes.
- **Not a generative knowledge base.** No LLM ever authors a nutrition fact, benefit link, or health claim. Generated language is confined to phrasing already-decided, already-cited content (§5.4).
- **Not a data-extraction business.** Household and personal-signal data is never sold, never used to train shared models, never written into the generic knowledge plane (Rule G1), and is viewable/resettable by the user.
- **Not a nag.** Proactivity stays governed by the existing restraint rules (earned, occasional, easy to dismiss, frequency-capped).

---

# SECTION 3 — THE FUTURE USER EXPERIENCE (unconstrained by current implementation)

Designed from the user's day, not from the current page inventory. Personas: the Reeves household — two adults (one vegetarian, one training for a half-marathon), two children (one dairy-free).

## 3.1 The everyday loop — nutrition without a nutrition page

**Sunday planning.** Maya opens the Planner. The week builds as it does today — but a quiet strip beneath the week reads: *"This week: 26 plants (4 short of 30) · fibre well covered · oily fish absent for the third week."* Each phrase is a tap-to-unfold fact (counting, not judgement). When she asks the Companion *"fix the fish gap"*, it proposes two meals that pass every eater's restrictions, shows the why-chain on each card, and places one on Thursday with a single confirmation. The shopping list updates itself.

**Wednesday shop.** In the Shopping workspace, the list is grouped as always — but items carry small, optional context: the salmon line shows *"covers this week's oily-fish gap"*; a swap chip on the yoghurt shows a same-category option with less sugar, compared on facts (existing Analyser judgement, surfaced in place). Nothing preachy; everything ignorable.

**Thursday cooking.** Opening the planned meal, the *Simply Better* panel offers one boost — pumpkin seeds — with its two-fact composition visible ("a source of magnesium" + "magnesium supports normal muscle function", each cited) and a household anchor ("pairs with the oats you already buy"). Accepting adds it to the next list.

**Any moment, conversation.** The Companion is the *front door to everything above*: "what did the kids eat well this month?", "is this cereal actually decent?", "we're all knackered lately — what should we look at food-wise?" The last one resolves the free-text goal to known goal ids, answers with counting facts and cited food suggestions, and — because "knackered" borders a health concern — includes the calm boundary line: energy is multi-causal; a GP conversation is the right place for persistent fatigue.

**Sunday review (optional).** The Weekly Nutrition Report has evolved into the household's **Food Story**: plants, variety, strengths, one suggested focus for next week, and a seasonal note. It reads in ninety seconds. Nothing in it is a score of the person; everything is a count of the food.

## 3.2 The knowledge experience — from encyclopedia to moments

Pantry Explore remains the encyclopedic surface (Benefit → Nutrient → Food → Meal → Action), but by 2029 the dominant knowledge delivery is **moment-sized**: one fact, at the moment it is decision-relevant, with provenance one tap away. The Discovery & Presentation Principle already governs this shape today; the vision scales it from conversation cards to every surface.

Knowledge also becomes **person-aware in presentation** (never in content): the same canonical chickpea fact renders with a household anchor for Maya ("in your Tuesday curry") and a training anchor for Sam ("a plant-protein staple") — two lenses on one canonical fact, never two facts.

## 3.3 Goals — the personal thread

Each eater can hold a small number of active goals ("more plants", "better sleep", "stronger training weeks"). Goals are aliases into the canonical chain (Rule GO1 — they carry no truth of their own), attributed per-person, actioned per-household (Rule GO2). The Companion tracks them over time conversationally: *"three weeks into the sleep goal — magnesium-source foods appeared in 9 meals; want to keep going or switch focus?"* Progress statements are always counting facts about food, never outcome claims about bodies.

## 3.4 Children and vulnerable users

The experience for and about children is deliberately quieter: diversity and discovery framing only ("Ivy tried 3 new plants this month"), no goal-setting on a child's behalf beyond variety, no body metrics, ever. Weight-loss framing remains declined product-wide (Rule from §9.2 of the Personalised Intelligence architecture); this is doubly enforced anywhere a child eater is in context.

## 3.5 Community (net-new domain — flagged)

Community is the one element of this vision with **no existing surface today** (only Partners/referrals exists). The 2029 shape:

- **Share the composition, not the claim.** Households share *meals, plans, boost ideas, and food stories* — never health claims. A shared meal card carries the sharer's household-fit facts recomputed for the *viewer's* household ("fits your household except Ivy's dairy-free — here's the adapted version").
- **Community proves practice, not science.** "1,200 THA households cook this in under 30 minutes" is an honest, displayable community fact. "This meal cured my bloating" is not displayable as knowledge — testimony never enters any knowledge plane (§5.6).
- **Curation stays canonical.** Community-popular meals can be *nominated* into THA's canonical catalogue only through the existing editorial/KMS review gate — popularity is a discovery signal, never a publication right.

---

# SECTION 4 — HOW TRUSTED KNOWLEDGE BECOMES EVERYDAY DECISIONS

The pipeline from knowledge to decision is the existing retrieval-and-ranking engine (Personalised Intelligence §4), matured but structurally unchanged. What the vision adds is a precise statement of the **five translation steps** every everyday decision passes through, and where each lives:

```
1. TRUTH        Canonical, cited, human-reviewed facts          (Knowledge plane, §5.1)
2. RELEVANCE    Join to this household, these eaters, this week  (Join layer — request-time, one-directional)
3. MOMENT       Attach to a real decision surface                (Planner slot, list line, meal panel, conversation turn)
4. LANGUAGE     Phrase for the person, cite for the sceptic      (Generated reasoning plane, §5.4 — phrasing only)
5. ACTION       One-tap verb: Add · Swap · Pair · Plan · Buy     (Existing capability writes via the Intelligence Platform)
```

Design rules that make the translation trustworthy:

- **Decisions are offered where they are executed.** A fish-gap insight on the Planner offers a planner action; the same insight in Shopping offers a list action. Insight and verb always co-locate (the Companion Card Experience Principle, generalised).
- **Silence is the default.** A week with nothing worth saying says nothing. Empty intelligence renders as absence — the WX8 `{ available: false }` discipline product-wide.
- **Counting before judging, always.** Every everyday phrase is a count ("third week without oily fish"), and the *user* supplies the judgement. THA offers the next verb, not the verdict.
- **Provenance is two taps from everywhere.** Glanceable reason chips → full chain (source, review date, household fact, signal weights). The explanation is the ranking trace; there is no separate explanation generator to drift.

---

# SECTION 5 — THE FOUR-PLANE KNOWLEDGE MODEL

The scope's required distinction — canonical knowledge vs personal intelligence vs generated reasoning vs external evidence — is the load-bearing structure of the whole vision. Each plane has one owner, one write path, and one contamination rule.

## 5.1 Plane 1 — Canonical Knowledge (what THA asserts)

- **Content:** foods, nutrients, benefits, the nutrient bridge, nutrition context, restriction library, diversity groups, editorial guidance. Generic, identical for every user on Earth.
- **Owner today:** WS0 Knowledge Registry (`shared/knowledge/` → `knowledge_*` tables via `nutrition-knowledge-registry.ts`), canonical food identity (`shared/canonical/`), `restriction-library.ts`, `uplift-rules.ts` — exactly as declared in the SoT Register.
- **Write path:** human editorial review only (KMS graduation, EFSA wording firewall, `SourceRef` + `lastReviewed` mandatory). By 2029 the KMS automation curve may auto-maintain *wording and staleness*, never the science (Master Roadmap §11 constraint carried forward verbatim).
- **Contamination rule (Rule G1, unchanged):** nothing household-, person-, or signal-derived is ever written into this plane.

## 5.2 Plane 2 — Personal Intelligence (what THA remembers about you)

- **Content:** household composition, eater restrictions/patterns/tastes, goals, planner/shopping/diary/pantry history, the personalisation event log (accepted/rejected boosts, staples, dismissals), and — new by 2029 — consented external signal summaries (§7).
- **Owner:** the existing transactional single-owner stores (`household_eaters`, planner/shopping/diary tables, `user_preferences`) plus one new store this vision requires: the **personalisation event log** (already specified in Personalised Intelligence §8 — `PersonalisationEvent`; it replaces nothing, so no retirement plan is required, per Principle 8).
- **Behaviour:** learning **re-weights transparent signals, never authors facts** (Rule P1). Negatives decay (P2). Per-person learning, per-household action (P3). Viewable and resettable by the user.
- **Contamination rule:** never leaves the household boundary; never trains shared models; never enters Plane 1.

## 5.3 Plane 3 — External Evidence (what others assert)

- **Content:** upstream sources THA composes from — USDA FDC composition data, Open Food Facts product records, EFSA/NHS/NIH-ODS claim wording, licensed recipe sources, and (future) partner health-signal feeds.
- **Owner:** the FS1-audited source integrations plus the Trusted Source Registry direction (FS1/editorial framework). Every external fact retains **provenance, licence, and tier** — external evidence is *ingested into review*, never published direct to users. The KMS discovered↔published hard wall is the enforcement seam.
- **Contamination rule:** external evidence becomes user-visible knowledge only by passing the editorial gate into Plane 1 (bulk product data like OFF/USDA passes through its existing declared owners with licence attribution per FS1's remediations). It is never blended silently into canonical content, and its licence obligations (attribution, share-alike) render with it.

## 5.4 Plane 4 — Generated Reasoning (how THA speaks)

- **Content:** natural-language phrasing of already-decided, already-cited bundles; free-text goal parsing ("knackered" → energy-related goal ids); conversational continuity. The LLM plane.
- **Owner:** the Intelligence Platform conversation gateway — the one existing seam already trusted to compose across capabilities per turn (the NUT1 precedent).
- **Contamination rule (Rule LT3, unchanged):** generated reasoning **never selects a food, never authors a claim, never overrides the deterministic engine**. It is a translator at the edges. Every generated sentence must be traceable to the deterministic bundle it phrases; a sentence that cannot be traced is not rendered.

## 5.5 The composition law

> **Every user-visible nutrition statement = Plane 1 fact(s) × Plane 2 context, optionally phrased by Plane 4, with Plane 3 provenance attached to the Plane 1 half.**
>
> Any statement that cannot be decomposed this way is a defect, regardless of how helpful it sounds.

## 5.6 Community and signals against the planes

- Community testimony is **Plane 2 social context at most** ("households like yours cook this") — never Plane 1, never Plane 3 evidence.
- Wearable/biomarker signals are **Plane 2 personal context** (consented, summarised, resettable) — never Plane 1, and their *interpretation* stays outside THA entirely (§7.3).

---

# SECTION 6 — DOMAIN INTERACTION DESIGN (Nutrition × Companion, Planner, Shopping, Pantry, Meals, Community)

One principle governs all six interactions: **Nutrition is a lens, never a second owner.** Each domain keeps its existing SoT-registered ownership; Nutrition composes read-time intelligence over it and offers actions back *through that domain's own capability* — exactly the WX8 assembler and Intelligence Platform binding pattern, matured.

| Interaction | 2029 behaviour | Read path (existing owner) | Action path (existing capability) |
|---|---|---|---|
| **× Companion** | The Companion is the primary nutrition interface: answers, goal tracking, weekly story, boundary-safe redirects. All conversational nutrition flows through the one Gateway — no second assistant, ever. | All planes via capability handlers | Registered capability verbs only |
| **× Planner** | Week-level ambient strip (plants, gaps, streaks); gap-aware slot suggestions at plan time; goal-aware weekly focus. The planner remains the data spine. | `planner_*` tables via planner binding | Planner write intents (add/swap entry) |
| **× Shopping** | In-place line context (covers-a-gap chips), fact-based same-category swaps (Analyser judgement), boost-accepted items flow to the list with their why attached. | `shopping_list` + Analyser services | Shopping write intents |
| **× Pantry** | Pantry remains the knowledge hub (Explore) and gains "cook from what you have" nutrition framing: what the current inventory can cover this week, honestly counted. | pantry inventory + Knowledge Registry | Pantry/planner intents |
| **× Meals** | Every meal carries its assembled intelligence (household fit, boost options, nutrition context) from the one meal-intelligence assembler; Simply Better stays the meal-level verb. | `meals` + assemblers + uplift engine | Meal/boost intents |
| **× Community** | Shared meals/plans re-ground in the *viewer's* household facts before display; popularity is a ranking signal (visible, like all signals), never a truth source. | net-new community store (Phase 3, §9) | Existing meal/planner import intents |

**The interaction anti-goals:** no domain grows a private nutrition store; no nutrition surface writes into another domain except through its registered capability intents; no bridge ever syncs two owners of the same fact (Principle 7).

---

# SECTION 7 — FUTURE SIGNAL INTEGRATIONS (wearables, biomarkers, gut health, activity, sleep, emerging signals)

This is the vision's most sensitive expansion, and the design is deliberately conservative. The governing idea:

> **Rule S1 — Signals contextualise, never diagnose.** An external health signal may (a) suggest which *already-canonical* topics are relevant to surface, and (b) re-weight existing transparent ranking signals — with the weight visible like every other signal. A signal never generates a claim, never unlocks a clinician verb, and never overrides a trust boundary.

## 7.1 The signal ladder (increasing sensitivity, increasing gate)

| Tier | Signals | 2029 treatment | Gate |
|---|---|---|---|
| **S-0 Self-reported** | Sleep hours, mood, energy, "stuck to plan" — **already captured today** in `food_diary_metrics` | First-class personalisation context: a user logging poor sleep may see sleep-relevant *food* knowledge ranked higher, visibly ("you've been logging short sleep — foods with magnesium…") | Existing diary consent; no new integration |
| **S-1 Activity & sleep (wearables)** | Steps, workouts, sleep duration from Apple Health / Google Health Connect / Garmin etc. | Read-only, summarised (weekly aggregates, not raw streams), consent-per-signal. Use: training-day meal framing ("higher-protein options on long-run days"), sleep-goal context. Wearable devices themselves are **edge adapters** in front of the one Gateway (per the AI Experience architecture) — never a second brain. | Explicit opt-in per signal type; view/delete/disconnect anytime |
| **S-2 Gut health & microbiome** | Consumer microbiome test summaries, symptom journals | THA consumes only **the user's own stated takeaways or a partner's consumer-safe summary** ("advised to increase fibre diversity") as goal-like context resolving to existing behavioural engines (fibre, fermented foods, plant diversity). THA never interprets raw microbiome data. | Opt-in + partner agreement + editorial review of any partner-summary vocabulary |
| **S-3 Blood biomarkers** | Results from clinician or regulated testing partners | **THA never interprets a biomarker value.** Interpretation (in/out of range, what it means) belongs to the clinician/regulated partner. What THA may accept is a *consented, interpreted, food-relevant flag* in a closed vocabulary (e.g. "advised to increase dietary fibre") — which behaves exactly like a user-stated goal: it resolves through the canonical chain with full citation, and it is user-visible, user-deletable context. | Opt-in + regulated-partner contract + legal/regulatory review (§7.4) + closed flag vocabulary reviewed editorially |
| **S-4 Emerging signals** | CGM trends, at-home testing, whatever 2028 brings | Admitted only by graduating through this same ladder: consented → summarised → closed-vocabulary → goal-alias semantics. No signal class ships with bespoke semantics. | New EWO per signal class; RED review |

## 7.2 What signals may do — exhaustively

1. **Surface relevance** — raise existing canonical topics into view at the right moment.
2. **Re-weight ranking** — as one more visible signal in the §4.4 signal table (e.g. "training day ↑ protein-source foods"), displayable as a reason like every other signal.
3. **Enrich the food story** — longitudinal, counting-style observations that pair food facts with signal facts *without asserting causation*: "in weeks with 25+ plants you also logged higher energy — correlation you may find interesting, not a claim."

## 7.3 What signals may never do

- Trigger diagnosis-shaped output ("your iron is low" — even if a partner said so, THA repeats only the food-relevant flag, never the clinical fact).
- Create supplement, dosing, calorie-target, or weight-loss recommendations (unchanged hard lines).
- Be inferred: THA never derives health states from behaviour (existing §8.2 prohibition — extended explicitly to signal fusion: no combining shopping + wearable data to infer conditions).
- Enter Plane 1, train shared models, or be shared to Community in any form.
- Concern a child: signal integrations are adult-eater-only, structurally.

## 7.4 Regulatory posture (flagged for legal, not decided by engineering)

Interpreting biomarkers or personal health data to produce individual guidance risks classification as medical-device software (UK MHRA / EU MDR). The architecture above is designed so THA stays on the general-wellbeing side of that line: **interpretation stays with clinicians/regulated partners; THA consumes closed-vocabulary, food-scoped flags with the same semantics as user-stated goals.** Phase gates in §9 make legal review a blocking gate for S-2/S-3 — engineering must never be the party deciding this boundary.

---

# SECTION 8 — CAPABILITY ARCHITECTURE REQUIRED

The 2029 vision requires **no new platform** — it is the existing Intelligence Platform (one Gateway, one Capability Registry, one Intent Engine, capability bindings over existing business services) plus a small number of new registered capabilities and one new engine service. Everything below extends; nothing replaces.

## 8.1 Target capability map (2029)

```
                          ┌──────────────────────────────────────────────┐
   Edge adapters          │        CONVERSATION GATEWAY (one, existing)  │
   web · mobile · voice · │  intent engine · capability registry ·       │
   wearable · display     │  permission model · enrichment · cards       │
                          └──────┬───────────────────────────┬───────────┘
                                 │ read/compose               │ action intents
                 ┌───────────────┴───────────────┐   ┌────────┴──────────┐
                 │  NUTRITION REASONING ENGINE   │   │ existing domain   │
                 │  (new service — join+rank+    │   │ capabilities:     │
                 │   explain, Personalised       │   │ planner · shopping│
                 │   Intelligence §4, one owner) │   │ pantry · meals ·  │
                 └──┬─────────┬─────────┬────────┘   │ diary · household │
                    │         │         │            │ profile · analyser│
              Plane 1     Plane 2    Plane 2(new)    └───────────────────┘
           Knowledge    household +  ┌────────────┐  ┌────────────────┐
           Registry /   event log    │ SIGNALS     │  │ COMMUNITY      │
           canonical /  (new store,  │ GATEWAY     │  │ (new capability │
           KMS          specified    │ (new cap.,  │  │  + store,       │
                        in P.I. §8)  │  §7 ladder) │  │  Phase 3)       │
                                     └────────────┘  └────────────────┘
```

## 8.2 New components (each a future EWO, named here for the roadmap)

| Component | What it is | Extends / replaces | SoT impact |
|---|---|---|---|
| **Nutrition Reasoning Engine** | The deterministic join + rank + explain service (Stages 1–5 of the Personalised Intelligence ladder). One engine, many entry points (goals, Simply Better, Choose Better, weekly story, Companion). | Extends: uplift engine, meal scoring, WX8 assembler patterns. Replaces: nothing at introduction; long-term it becomes the single ranking path and ad-hoc per-surface ranking retires surface-by-surface (Principle 8 retirement named per phase). | New service, no new fact ownership — reads Planes 1+2 only |
| **Personalisation Event Log** | `personalisation_events` store per P.I. §8 — the unit of learning. | Extends household state. Replaces nothing. | New single-owner transactional store (declared in SoT Register at creation) |
| **Goals capability** | Goal CRUD + alias resolution (Rule GO1/GO2), registered in the Capability Registry with read/write intents. | Extends profile/household capabilities. | Goals table = new single-owner store |
| **Signals Gateway capability** | Consent management, per-signal summarisation, closed-vocabulary flags (§7). One funnel-many-inputs bridge (permitted infrastructure under Principle 7). | Extends diary-metrics pattern (S-0 already exists there — the diary remains owner of self-reported metrics; the gateway owns only external-signal summaries, a different fact at a different scope, passing the scope test). | New store for external signal summaries + consents |
| **Community capability** | Share/browse/import of meals, plans, stories; re-grounding on import; nomination-to-editorial flow. | Extends meals/templates/planner import paths. | New store for shares/social metadata only — shared meals remain `meals`-owned |
| **Evidence & provenance surfacing** | User-facing provenance unfold (two-tap chain) + licence attribution rendering (FS1 remediation) as a shared presentation component. | Extends explainability-service + SourceRef discipline. | None — presentation only |

## 8.3 What is explicitly NOT built

- **No second assistant, no per-domain bots** — every new surface (wearable, display, car) is an edge adapter to the one Gateway.
- **No nutrition-owned copies of domain data** — the Reasoning Engine holds no state beyond its own event log reads.
- **No ML model that owns decisions** — learning re-weights the visible signal table; weights are configuration with an audit trail.
- **No new knowledge stores without the Rule 8 governance gate** — the Knowledge Registry + KMS remain the only Plane 1 owners.

---

# SECTION 9 — PHASED ROADMAP (today → 2029)

Each phase is gated (Rule LT1: no stage skips its predecessor's trust bar), independently shippable, and names its convergence duty. Phases are sequenced from the actual current platform on this branch — not from a blank slate.

## Phase 0 — Foundation completion (now → end 2026) — *largely the existing Master Roadmap*

- Complete the five-surface connected knowledge launch (WS0–WS5) and the contested-domain migrations (M1, M2, M4 — M3 `shared/dietRules.ts` is already done on this branch).
- Complete FS1 licensing remediations (OFF attribution, USDA key, source registry direction) — external evidence hygiene before external evidence *expansion*.
- Continue NUT1's line: deepen honest, deterministic nutrition enrichment in the Companion.
- **Gate to Phase 1:** launch surfaces live; Plane 1 single-owner convergence at 100% for Food Knowledge display.

## Phase 1 — The Reasoning Engine (2027 H1)

- Build the Nutrition Reasoning Engine, Stages 1–2 (static → household-aware), as the single join+rank+explain path; wire goals capability (per-person goals, alias resolution); Simply Better and goal answers run through the one engine.
- Provenance unfold (two-tap chain) ships product-wide.
- **Retirement duty:** each surface that adopts the engine retires its ad-hoc ranking path in the same workstream.
- **Gate:** every engine card decomposes per §5.5 in production; zero uncited cards (Rule E1 verified by test).

## Phase 2 — Learning & the ambient layer (2027 H2 → 2028 H1)

- Personalisation event log + Stage 3 learning (re-weight only, decaying negatives, user-resettable).
- Ambient nutrition strips in Planner and Shopping (counting facts + co-located verbs); Weekly Report evolves into the Food Story.
- S-0 self-reported signals (already-owned diary metrics) enter the visible signal table.
- **Gate:** learned weights are individually explainable in the UI; opt-out and reset shipped before learning ships.

## Phase 3 — Community & prediction (2028)

- Community capability v1: share/import meals & plans with viewer-household re-grounding; nomination-to-editorial flow; testimony firewall (§5.6).
- Reasoning Engine Stage 4 (predictive, offer-never-assume, frequency-capped); LLM phrasing layer for engine bundles (Plane 4, traceability-enforced).
- S-1 wearable integrations (activity/sleep aggregates) behind per-signal consent, as edge-adapter + Signals Gateway.
- **Gates:** proactivity restraint rules verified in usage data; wearable launch blocked on privacy review; community launch blocked on moderation + claim-firewall review.

## Phase 4 — The full companion (2029)

- Stage 5: conversational goal-tracking-over-time, multi-eater reconciliation, seasonal long-memory food story.
- S-2/S-3 partner integrations (gut health, biomarkers) **only if** the §7.4 legal gate passes and partners carry interpretation; closed-vocabulary flags flow as goal-aliases.
- KMS automation matures toward exceptions-only curation (THA-owned wording layer only; science stays human).
- **Gates:** Stage 4 trust record; regulated-partner contracts; every §7.3 prohibition covered by structural tests, not policy documents.

## Phase invariants (all phases)

The two walls never move: **discovered↔published** (KMS) and **generic↔personalised** (Rule G1). The trust vocabulary never grows a clinician verb. Every phase's new store is declared in the SoT Register in the workstream that creates it.

---

# SECTION 10 — RISKS

| # | Risk | Phase | Rating | Mitigation |
|---|---|---|---|---|
| V1 | Signal integrations drift into diagnosis-shaped output | 3–4 | 🔴 High | Rule S1; closed flag vocabulary; interpretation stays with partners; structural tests on prohibited output shapes; legal gate blocks S-2/S-3 |
| V2 | Community becomes an unreviewed claim channel | 3 | 🔴 High | Testimony firewall (§5.6); share compositions not claims; editorial gate for canonical nomination; moderation before launch |
| V3 | LLM phrasing quietly becomes LLM deciding | 2–4 | 🔴 High | Rule LT3 + traceability requirement (§5.4): unphraseable-to-bundle sentences are not rendered; deterministic engine owns all selection |
| V4 | Learning weights become an opaque profile | 2+ | 🟠 Med | Every weight displayable as a reason; view/reset UI ships *before* learning; no signal that can't be shown can rank (existing §4.3 coupling) |
| V5 | Ambient layer becomes nagging | 2+ | 🟠 Med | Silence-default; frequency caps; counting-not-judging copy rules; easy dismissal feeding decay |
| V6 | Scope creep pulls Phase 3–4 items into earlier phases | all | 🟠 Med | Phase gates are EWO-enforced; this document is the holding pen, as §10 of the Master Roadmap was for launch |
| V7 | Regulatory reclassification (medical device) | 4 | 🟠 Med | §7.4 posture; legal review as blocking gate; food-not-bodies line is structural |
| V8 | Partner/licence obligations (signals, recipes, OFF) unmet at scale | 0,3,4 | 🟠 Med | FS1 register maintained; licence attribution rendered with content; per-source compliance in each integration EWO |
| V9 | Editorial capacity again under-costed (canonical growth + community nominations) | all | 🟠 Med | Automation only on the THA-owned wording layer; nomination queue is demand-paced; honest gaps remain acceptable product states |

---

# SECTION 11 — ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□✓ One canonical identity
  Vision only — no entity created. All future components named here key on existing
  identities (canonical food slug, meal id, eater id, household id, user id).

□✓ One owner per fact
  The four-plane model (§5) strengthens this: each plane has one owner and one write
  path. New stores named (§8.2) each own a genuinely new fact (events, goals, signal
  summaries, shares) — each passes the scope test against existing stores.

□✓ No duplicate entities
  No new entity duplicates an existing one. Signals Gateway summaries vs diary
  self-reported metrics addressed explicitly (§8.2): different fact, different scope.

□✓ No duplicate ownership
  Confirmed — Nutrition is defined as a lens over existing owners (§6), never a
  second owner. The Reasoning Engine owns process, not facts.

□✓ No duplicate state
  Confirmed — no state proposed in two places; retirement duties named where the
  engine subsumes ad-hoc ranking paths (§9 Phase 1).

□✓ Extends existing architecture
  Every component extends a named existing pattern: Gateway/Capability Registry,
  WX8 assembler, uplift engine, diary metrics, KMS, SourceRef discipline.

□✓ Progressive enrichment where appropriate
  Knowledge entities keep identity→core→optional→runtime enrichment; transactional
  stores (events, goals, shares) get single-owner state only — no enrichment bolted on.

□✓ Honest gaps over fabricated information
  Silence-default is a named design rule (§4); every phase gate includes it;
  composition law (§5.5) makes unfabricated-ness testable.

□✓ No permanent synchronisation bridge
  The Signals Gateway is a many-inputs→one-owner funnel (permitted infrastructure).
  No sync bridge proposed anywhere.

□✓ Evolution over replacement
  Each new store names what it replaces (nothing, at introduction) and each
  adoption workstream carries the retirement of the path it subsumes (§8.2, §9).
```

```
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform (one Gateway; wearables etc. are edge adapters)
✓ Uses the Capability Registry (new capabilities registered, none bypass it)
✓ Uses the Intent Engine (all actions via registered intents)
✓ Reuses existing business services (assemblers, uplift, scoring, restriction resolver)
✓ Does not create another assistant
✓ Does not duplicate conversation state
✓ Uses registered capabilities only
✓ Uses permission-aware access (per-signal consent added on top, never instead)
✓ Produces honest gaps rather than fabricated knowledge (composition law §5.5)
```

---

# SECTION 12 — DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Nutrition (vision-level; touches Knowledge, Planner, Shopping,
                 Pantry, Meals, Diary, Household, Intelligence Platform, plus
                 future Goals / Signals / Community / Events domains)
Declared SoT: unchanged for every existing domain (per SoT Register)
New store created? NO (by this document). Four future stores are NAMED
  (personalisation_events, goals, signal summaries+consents, community shares) —
  each must be declared in the SoT Register by the workstream that creates it,
  with the Rule 8 governance gate.
Existing store extended? NO
Consumer created? NO
```

---

# SECTION 13 — ARCHITECTURE CONVERGENCE STATUS (STEP 8 — mandatory for 🔴 RED)

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Nutrition (Food Knowledge + its consuming surfaces)

Current Canonical Owner:
  WS0 Knowledge Registry (shared/knowledge/ → DB knowledge_* via
  server/services/nutrition-knowledge-registry.ts) for knowledge;
  shared/canonical/ for identity; per-SoT-Register owners for all
  transactional domains.

Current Runtime Consumer(s):
  Food Report (food-report-adapter), Pantry Explore (/api/knowledge/*),
  Weekly Nutrition Report, Nutrition Centre (WX8 assembler), Simply Better
  (uplift engine), Intelligence Platform nutrition-knowledge binding +
  NUT1 enrichment, meal/food intelligence assemblers.

Duplicate Owners Remaining:
  - client/src/lib/nutrition-benefit-library.ts (M1 pending)
  - client/src/lib/pantry-knowledge.ts (M2 pending)
  - client/src/lib/nutrition-variety.ts (M4 pending — Plant Diversity counting)
  (M3 dietRules duplication is resolved: shared/dietRules.ts exists on this branch.)

Duplicate State Remaining:
  users.dietPattern/dietRestrictions vs household_eaters overlap (SoT Register
  contested item 4 — structural risk, no live split-brain).

Duplicate Workflows Remaining:
  Keyword plant-counting (nutrition-variety.ts) beside canonical diversity_group
  resolution; benefit display resolution in retained client libraries beside the
  registry.

Current Convergence (%):
  ~60% — of the 4 contested migrations in the SoT Register (M1–M4), 1 is complete
  (M3); of the 5 Food-Knowledge stores audited, WS0 + food-report path are
  converged while 3 client prototype stores remain live consumers' sources
  (register Phase 5 audit). Evidence: SoT Register Phases 3–5; presence of
  shared/dietRules.ts and absence of the M1/M2/M4 retirements on this branch.

Target Convergence (%):
  This document changes nothing (vision only). It sets 100% Plane 1 convergence
  as the Phase 0 exit gate (§9) before any Phase 1+ vision work begins.

Next Planned Milestone:
  M1 (retire nutrition-benefit-library.ts), then M2, M4 — per Master Roadmap;
  Phase 0 of §9 is the umbrella.

Remaining Architectural Risks:
  The three unretired prototype stores; users.diet* overlap; risk that vision
  phases are started before Phase 0 convergence gate (mitigated by the gate
  being written into §9 explicitly).
```

---

# SECTION 14 — DEFINITION OF DONE

- **What success looks like:** a single canonical vision document exists that (1) defines the 2029 Nutrition experience end-to-end, (2) fixes the four-plane knowledge model and the signal ladder as the governing shape for all future nutrition workstreams, (3) sequences delivery from the real current platform with named gates, and (4) passes the RED workflow's mandatory sections. Future EWOs (Reasoning Engine, Goals, Signals Gateway, Community) can each cite this document as their governing vision.
- **What must not break:** nothing can — no code, schema, route, or data was touched. Verified: this task's only write is this file.
- **Manual test steps:** `git status` shows exactly one new file under `docs/investigations/`; rollback tag exists (`git tag -l 'rollback/before-nut2*'`); no other file differs from pre-task state.

# SECTION 15 — DATA IMPACT

- Reads existing data: **NO** (documentation reads only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

# SECTION 16 — TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. The vision itself is designed around non-misleading composition (§5.5) and strengthens every existing trust rule.
- **Could this fabricate certainty?** No. The document repeatedly constrains future work *against* fabrication (Rules S1, LT3 carried forward; composition law; testimony firewall).
- **Is anything guessed but shown as real?** No. Current-state claims in this document were verified against the codebase (file presence, schema fields, SoT Register) during this investigation; forward-looking content is explicitly labelled as vision.
- **What happens if the system is wrong?** If the vision is wrong, nothing runs differently — it is corrected by a successor document. Phase gates prevent a wrong vision from shipping unsafely.
- No architectural duplication introduced: **YES** (none — no code)
- No new source of truth created: **YES** (none — future stores only *named*, each gated by Rule 8 at creation)
- No runtime behaviour altered (governance-only work): **YES**

# SECTION 17 — ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-nut2-future-state-nutrition-vision-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Files modified | None. One file created: `docs/investigations/NUT2_FUTURE_STATE_NUTRITION_VISION.md` |
| Rollback commands | `rm docs/investigations/NUT2_FUTURE_STATE_NUTRITION_VISION.md` (or `git rm` + commit after the doc commit) |
| Verification after rollback | `git status` clean of this file; tag may be deleted with `git tag -d rollback/before-nut2-future-state-nutrition-vision-20260702` |

# SECTION 18 — SCOPE LOCK

- **Implemented scope:** exactly the EWO-NUT2 brief — 2029 vision; future UX; knowledge→decision translation; six domain interactions; personal+household+external combination model; future signal integrations; capability architecture; four-way knowledge distinction; phased roadmap. One document, no code.
- **Explicitly excluded:** any implementation of the Reasoning Engine, Goals, Signals Gateway, Community, event log, or provenance UI; any schema or registry change; any change to the Master Roadmap or SoT Register (both referenced, neither edited); any licensing remediation (owned by FS1 follow-ups); any decision on regulatory classification (§7.4 flags it for legal).
- **Suggestions (out of scope — do not implement without approval):**
  1. The SoT Register still lists Dietary Rules as "Contested — identical copy in client"; since `shared/dietRules.ts` now exists on this branch, the register should be updated when this branch's work is consolidated.
  2. The four-plane model (§5) and signal ladder (§7.1) are candidates for promotion to `docs/architecture/` as governing documents once approved, per the GOV-AI1 promotion pattern.
  3. Community has no capability card; when Phase 3 approaches, an INT-style capability card should precede any binding work.

---

*Investigation only. No code was changed in the production of this document.*
*Rollback: `rollback/before-nut2-future-state-nutrition-vision-20260702` → `4a2da73`.*
