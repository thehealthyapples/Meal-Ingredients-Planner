# THA Platform Knowledge Completion Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md` (workstream `EWO-PKCA1`), 2026-07-03. No code, schema, runtime, or API changes.
**Classification:** Platform Governance (canonical, cross-cutting — applies to every knowledge domain, not Food Intelligence-specific)
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`
**Source investigation:** `docs/investigations/platform/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md`

---

## 0. MANDATE

**Every knowledge domain THA ships must grow through the same graduation pipeline, be governed by the same three-layer evidence chain, and be spoken by exactly one adapter — regardless of which team builds it or which knowledge type it holds.**

This document does not invent a new governance scheme. It names one that THA has already built correctly, four separate times, without ever writing down that it is one scheme: WS0X's food-catalogue promotion levels, WS4B's nutrition-fact evidence lifecycle, FS1/FS2's recipe-licensing lanes, and EL1/EL2's household-evidence lifecycle. Each was designed independently, and each arrived at the same underlying shape — candidate → gate → confirm → publish, with rejection as a first-class terminal state, never a silent retry. This is the same discipline the Source of Truth Register applies to fact *ownership* (one owner, no duplication) and `PLATFORM_QUALITY_ARCHITECTURE.md` applies to *quality* (one enforcement seam per dimension), generalised to a third axis: **knowledge completeness is a platform-owned pipeline shape, not a per-domain invention.**

This document does not replace the SoT Register, WS0X, WS4B, FS1/FS2, or EL1/EL2. It **names, generalises, and closes gaps between** them, and gives the next knowledge-heavy workstream (Preparation Knowledge, a future Signals Gateway, a future Community capability) one place to read before inventing a fifth variant of a pattern that already exists four times.

---

## 1. THE KNOWLEDGE GRADUATION PIPELINE

Every knowledge entity in THA — a food, a nutrition claim, a recipe, a detected household pattern, and every future knowledge type — moves through the same four stages. This is not a new mechanism; it is the shape already proven by four independent implementations, named here for the first time as one canonical pipeline.

```
   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
   │  1 CANDIDATE │ ──▶ │  2 GATED     │ ──▶ │  3 CONFIRMED /    │ ──▶ │  4 PUBLISHED  │
   │  raw input,  │     │  structural/ │     │    PROMOTED       │     │  visible,     │
   │  not yet a   │     │  automated   │     │  human decision   │     │  distinguish- │
   │  platform    │     │  filter —    │     │  or explicit      │     │  able from    │
   │  fact        │     │  never a     │     │  confirmation —   │     │  unpublished  │
   │              │     │  guess       │     │  never automatic  │     │               │
   └──────────────┘     └──────┬───────┘     └─────────┬─────────┘     └───────────────┘
                                │                        │
                                ▼                        ▼
                         ┌─────────────┐          ┌─────────────┐
                         │  DECLINED / │          │  NEEDS      │
                         │  BLOCKED    │          │  REVIEW     │
                         │  (terminal, │          │  (queued,   │
                         │  never re-  │          │  not lost)  │
                         │  asked      │          │             │
                         │  silently)  │          │             │
                         └─────────────┘          └─────────────┘
```

**Rule KC1 — Four stages, always.** Every knowledge-entity domain names its own Candidate source, its own structural Gate, its own Confirmation authority, and its own Published form. A domain that skips a stage (e.g. auto-publishing a candidate with no gate, or gating without a rejection path) has not built a knowledge pipeline — it has built a fabrication risk.

**Rule KC2 — Rejection is terminal, not silent.** A candidate that fails the gate, or a pattern a household declines, does not get silently re-asked on the next run. It is a named, first-class outcome (`blocked`, `declined`, `needs_review`) — never dropped, never retried without new evidence.

**Rule KC3 — Published is visibly distinct from unpublished.** A user-facing surface must never be able to confuse a `draft`/`pending_confirmation`/`needs_review` fact with a `published`/`confirmed` one. Where no visible distinction is possible yet, the fact does not render (Principle 6 — honest gaps).

### 1.1 The four existing instances, mapped onto the canonical pipeline

| Domain | 1. Candidate | 2. Gated | 3. Confirmed/Promoted | 4. Published | Terminal rejection |
|---|---|---|---|---|---|
| **Food catalogue** (WS0X.10) | USDA FDC raw ingestion | `validateCanonicalSeed()` (identity/context completeness) | `validatePromotion()` → `auto_promote / h1_qualify / needs_review` | Level 1 (MVF) live, Level 2/3 additive | `blocked` |
| **Nutrition facts** (WS4B, inherited by WS5A/WS6) | `candidate` | `draft → in_review` (evidence strength + wording-firewall check) | `approved` (editorial sign-off) | `published` | `deprecated` |
| **Recipes** (FS1/FS2, `THA_RECIPE_ACQUISITION_ARCHITECTURE.md`) | Acquired via a named lane (`tha_library`/`licensed_discovery`/`personal_cookbook`/`community_cookbook`) | Licence-state check (`owned/licensed/conditional` callable; `pending_review/unlicensed` not) | Lane-appropriate storage-policy applied (`import/cache_ttl/link_only`) | Row answers "under what right does THA hold this?" | `unlicensed` (forbidden, never silently imported anyway) |
| **Household evidence** (EL1/EL2) | `report` (an Evidence event) | `MIN_EVIDENCE_COUNT`(3) + `MIN_CONSISTENCY`(70%) structural bar | `approve` (strong confirmation tier, explicit household decision) | Confirmed Understanding, always carrying `rationale`/`supportingEventIds` | `declined` (never silently re-asked while evidence keeps accumulating) |

**Why this table matters going forward:** a fifth knowledge domain (Preparation Knowledge, a Signals Gateway, Community) does not need to invent Candidate/Gate/Confirm/Publish semantics from scratch — it fills in this table's fifth row, using whichever existing instance is the closest analogue (Preparation Knowledge, per `WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md`, is closest to the Nutrition Facts row: existence is a cheap Candidate, *effect* is the evidence-gated claim).

---

## 2. CANONICAL KNOWLEDGE OWNERSHIP

This document adds one rule to the Source of Truth Register's existing ownership model — it does not replace it.

**The SoT Register already answers:** *which store owns a fact* (Rules 1–8, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Phase 6). That remains unchanged and is the senior rule.

**This document adds the surface-level complement:** *which adapter is allowed to speak that fact to a user.*

> **Rule KC4 — One owner, one mouth.** Every knowledge entity type has exactly one owning store (per the SoT Register) **and** exactly one runtime adapter that is the sole surface permitted to render facts about it. Every consuming surface calls that adapter; no surface re-derives, re-phrases, or independently queries the underlying store for the same fact.

This generalises `WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md`'s "the report is the only mouth" rule — previously scoped only to Food Reports — into a platform-wide rule, because the identical failure mode recurs anywhere a fact has more than one narrator: three different phrasings of the same food fact across Plant Diversity/Pantry/Explore (the SoT Register's own 🔴-rated Food Knowledge duplication), a future recipe surface re-deriving licence/attribution text independently, or a future Analyser surface inventing its own additive commentary alongside `food_knowledge`'s.

### 2.1 The "one mouth" register (adapters that already exist)

| Knowledge entity type | Owning store (SoT Register) | The one mouth (adapter) |
|---|---|---|
| Food (nutrition + identity composed) | `shared/knowledge/` + `shared/canonical/` | `shared/canonical/food-report-adapter.ts` (`buildFoodReport`) |
| Meal | `meals` table | `meal-intelligence-assembler.ts` |
| Product (barcode/UPF) | live recompute, no persisted result | `product-analysis.ts`/`upf-analysis-service.ts` (recomputed, never cached as a second copy) |
| Household evidence/pattern | `household_evidence_events`/`household_learning_signals` | `evidence-learning/framework.ts`'s `rationale`+`supportingEventIds` contract (§7, ET6) — the "mouth" is structural: no signal may render without its own evidence trail attached |
| Platform/developer documentation | `docs/`, DB knowledge tables | The Intelligence Platform's derived knowledge index (TIP1 §3) — not yet built, but already designed as the one read projection |

Any knowledge entity type in Part 1 of the companion investigation with no row in this table yet (Food Relationships, Preparation Knowledge, Recipe detail/licence attribution, Retailer/Partner data) is an open item for the roadmap (§7) — not a violation today, because none of those surfaces currently has *more than one* narrator. The rule exists so that the moment a second consuming surface appears, the adapter is built before the second narrator is, not after.

---

## 3. THE DOMAIN COMPLETENESS MODEL

Generalises WS0X.10's three-level progressive-enrichment model (previously scoped only to the food catalogue) into the platform-wide shape every knowledge entity type uses, while keeping Architecture Principle 3's transactional/knowledge boundary exactly where it already is.

> **Rule KC5 — Minimum Viable Fact (MVF).** A knowledge entity is visible from the moment it clears a domain-specific, explicitly-named minimum bar — identity + at least one real, sourced fact. Nothing beyond the MVF bar may gate visibility; everything beyond it is additive enrichment, never a precondition.

> **Rule KC6 — Enrichment only ever adds a surface, never gates an existing one.** Level 2/3-equivalent enrichment (WS0X's own wording) unlocks new chips, new context, new depth — it never revokes or hides what Level 1/MVF already made visible. A later enrichment pass that failed does not un-publish an already-published MVF.

### 3.1 The MVF bar, per knowledge entity type (from the companion investigation, Part 1)

| Knowledge entity type | MVF (Level 1 — visible from here) | Additive enrichment (never gates) |
|---|---|---|
| Food | Slug, name, category, ≥1 alias, diversity group (if plant), ≥1 real nutrient fact (WS0X.10) | Availability/season/origin/benefits (L2); description/forms/storage/varieties/stories/image (L3) |
| Nutrition claim | A cited nutrient fact at `strong`/`moderate` evidence strength | `emerging` benefit context (never shown as `established` — Principle 6) |
| Recipe | A row that can answer "under what right does THA hold this?" (licence-state resolved) | Full instructions, imagery, nutrition analysis, variety/pairing links |
| Preparation | Existence (a named form/variant) — always cheap, always allowed | A stated nutritional *effect* — evidence-gated, rare, and only as strong as the evidence (WS5A §9.3) |
| Household pattern | N/A — patterns are never "visible" below Confirmed Understanding (§1, Rule KC2/ET5) | Rationale detail, supporting-event count, confidence bucket |

**Why Household patterns have no MVF row:** this is a deliberate, correct exception, not a gap. Architecture Principle 3 draws a hard line between knowledge entities (which progressively enrich, gaps rendering as gaps) and this platform's newest lifecycle, which is confirmation-gated by design (ET5, EL2 §7) — a pattern below Confirmed Understanding is not a "thin" fact awaiting enrichment, it is *not yet a fact at all*. The Domain Completeness Model applies MVF/progressive-enrichment semantics only to Cluster A/B/C-style editorial knowledge (Part 1 of the investigation); it explicitly does not force Cluster D's confirmation-gated behavioural evidence into the same shape, and any future Signals Gateway or Community capability should ask which of the two this new knowledge more resembles before choosing a completeness model.

### 3.2 What this model does not apply to

Restated from Architecture Principle 3, unchanged: Planner state, Shopping state, and Diary are transactional, single-owner stores. They have no MVF bar because they are not knowledge entities — "one owner, no duplicate state" is their entire completeness requirement. A future workstream must not bolt a graduation pipeline onto transactional state; that is the exact over-engineering Principle 3 already forbids.

---

## 4. EVIDENCE STANDARDS

Generalises three independently-built trust vocabularies (FS1's source trust tiers, WS4B's evidence-strength/wording-firewall, EL2's Evidence Trust Rules ET1–ET6) into one three-layer chain, each layer gating the next.

```
LAYER 1 — SOURCE TRUST         LAYER 2 — CLAIM TRUST            LAYER 3 — PATTERN TRUST
(is this external source        (is this specific claim          (is this specific household
 trustworthy at all?)            strong enough to state?)         pattern real enough to confirm?)

tier1_official / tier2_scientific /   strong / moderate /          ET1 (≥3 events) + ET2 (≥70%
tier3_reference / banned              emerging / insufficient      consistency) + ET5 (explicit
(FS1 §4) — gates whether a            (WS4B) + EFSA wording        household `approve`, never
source may be cited at all            firewall — gates whether     automatic) — gates whether a
                                       a claim may be *stated*,     detected pattern becomes
                                       and in what words            Confirmed Understanding
        │                                     │                             │
        └───────────────── each layer's output is the only input the ──────┘
                            next layer is permitted to reason from
```

> **Rule KC7 — Layers gate downward, never sideways.** A claim (Layer 2) may only cite a source that has already cleared Layer 1 — a `banned` source (blogs, brand copy, AI-generated text per FS1 §3) can never become a claim's citation, regardless of how confident the claim's author feels. A household pattern (Layer 3) never reaches back to relax a claim's evidence strength, and a claim never reaches forward to auto-confirm a household pattern — the layers compose, they do not substitute for one another.

> **Rule KC8 — Declared is not enforced.** A trust rule that exists only as prose in a governing document is not yet a trust guarantee — it is a hope, in the same sense `PLATFORM_QUALITY_ARCHITECTURE.md` §3 already states for Security/Privacy ("if a rule can only be satisfied by every author remembering to do the right thing, it is not yet a platform responsibility"). Applied here: **every layer must have a running, automated validator**, not only a documented expectation.

### 4.1 The declared-vs-enforced gap this document names explicitly

The companion investigation (§2.5) found the platform's clearest violation of Rule KC8 already live: **Layer 2 (nutrition claim trust) is fully declared — `SourceRef`, `reviewedAt`, the EFSA wording firewall are all named requirements in `ARCHITECTURE_PRINCIPLES.md` (Principle 6) and `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule E1/E2) — but no automated check exists today confirming a live benefit row actually carries a `SourceRef` before it renders.** Every food↔benefit relationship in the live seed data is hardcoded `confidence: "established"` / `source: "THA editorial"`, with zero per-entry sourcing. Layer 1 (`validateCanonicalSeed()`) and Layer 3 (ET1–ET6, all structural `if` statements, not conventions) do not have this gap — they are real, running gates. Layer 2 is the priority closure item in the roadmap (§7).

### 4.2 What each layer forbids, explicitly

- **Layer 1:** No claim may cite a `banned` source. No AI-generated text may itself be treated as a citable source (FS1 §3 — a hard rule, not a style preference; this is distinct from, and does not relax, THA's own use of AI to *author* candidate content that a human then reviews against a real Layer-1 source).
- **Layer 2:** No `emerging` benefit may render as `established` (Principle 6, restated). No claim may exist without a `SourceRef` carrying a URL and `lastReviewed` date (Rule 6/E1 of `ARCHITECTURE_PRINCIPLES.md`/FI1).
- **Layer 3:** No pattern may be detected from fewer than `MIN_EVIDENCE_COUNT` events (ET1). No pattern may cross into Confirmed Understanding without an explicit, platform-gated confirmation (ET5). No Confirmed Understanding may itself auto-write a business-domain preference (EL1's "never adapts a preference itself" boundary).

---

## 5. ENRICHMENT STRATEGY

Formalises WS0X.9's proven pipeline (already running at an ~87–90% automation ceiling for food) as the platform-wide enrichment strategy shape, while keeping each layer's human-judgement requirement exactly where Evidence Standards (§4) place it.

```
1. SOURCE INTAKE GATE       Is this source Layer-1 trusted (§4)? Is it under a resolvable
                            licence (FS1/FS2, for content types that need one)?
                                          │
2. IDENTITY RESOLUTION      Does this candidate already exist under a different alias?
                            (canonical anti-fork check — one string, one `alias_key`,
                            never two forks of the same real-world entity — Principle 1)
                                          │
3. AUTOMATED AUTHORING      Where the automation ceiling allows (~87–90% for food-fact
                            candidates, per WS0X.9 Part 4): batch-author via the existing,
                            reviewed pipeline. This is Candidate-stage output only —
                            never auto-published (Rule KC1).
                                          │
4. STRUCTURAL GATE          validateCanonicalSeed() / validatePromotion() / evidence-
                            strength check / licence-state check — whichever of the four
                            §1.1 instances this knowledge type maps to.
                                          │
5. HUMAN REVIEW             The ~10–13% the automated gate cannot resolve (name-quality
                            flag, score<50, new diversity group, benefit outside the
                            existing taxonomy, animal-product claims, anything the
                            Layer-1/Layer-2 evidence chain cannot itself resolve).
                                          │
6. CONFIRM / PROMOTE        Explicit human sign-off (nutrition/recipes) or explicit
                            household confirmation (behavioural evidence) — never a
                            timer, never an accumulation threshold alone (Rule KC1,
                            "3 CONFIRMED / PROMOTED").
                                          │
7. PUBLISH                  Idempotent upsert into the one owning store, by identity —
                            never a re-creation, never a parallel store (Principle 8,
                            "no duplicated effort").
```

> **Rule KC9 — Automation authors candidates, never publishes them.** Wherever THA uses AI to draft content (batch-authoring food context, drafting a claim summary), the output is always Candidate-stage (§1). No automated process may move a fact past the Gate stage on its own authority — that step is always a named human or an explicit platform confirmation tier (`strong`, per `permissions.ts::confirmationFor`).

> **Rule KC10 — Prioritise by demand once the signal exists, by editorial judgement until it does.** Today, every enrichment queue in the platform (WS0X's `needs_review`, the additive editorial backlog, the allergen Phase-4 candidate list) is prioritised by editorial judgement alone. The Evidence & Learning Platform (§1.1, row 4) is architecturally the correct future source of a demand-driven signal — once it has a first real reporter and a first real Domain Intelligence consumer (both still unbuilt, per EL1/EL2's own named next milestones), a `search` result that finds evidence with no matching canonical knowledge is itself a legitimate, evidence-based enrichment-priority input. Until that reporter exists, editorial judgement (real ingredient-frequency audits, scan-frequency data where available) remains the correct interim signal — this document does not fabricate a demand signal that does not yet flow.

---

## 6. FUTURE-STATE COMPLETION CRITERIA

There is no single "% knowledge complete" number for the platform — completeness is domain-specific by design (§3). What generalises is the *template shape* a domain's own completion criterion should take, borrowed from `THA_MASTER_EVOLUTION_ROADMAP.md`'s own launch Definition of Done and applied narrowly to knowledge (not feature/polish, which stay in that document's own scope).

> **Rule KC11 — Every knowledge domain states its own MVF bar, evidence layer requirement, and one-mouth adapter before it is considered "complete enough to ship."** A domain that cannot answer all three has not reached future-state completion, regardless of how much content it holds.

### 6.1 Per-cluster completion criteria (carried from the companion investigation, stated as the binding target here)

| Cluster | Completion criterion |
|---|---|
| Canonical Food Identity | One key-space, one runtime read model, one owner per property (WS0X.13) — no `knowledgeFoodSlug` orphans, no `canonical-map.json` second identity store |
| Food Knowledge (Nutrition facts) | Every curated food resolves to ≥1 real, cited nutrient fact; minimum 5 established, EFSA-signed-off benefits live via the nutrient bridge (Master Roadmap §9) |
| Preparation Knowledge | Existence stated freely; effect stated only where Layer-2 evidence earns it; the three honest states (effect known / no meaningful change / unknown) are visually distinct |
| Recipes | Every row can answer "under what right does THA hold this?" — zero rows in `pending_review`/`unlicensed` reachable by a live surface |
| Household Evidence & Learning | At least one real reporting capability and one real consuming capability wired (currently zero of either) |
| Retailer/Partner | A resolved product-scope decision exists (in scope with a real data partnership, or explicitly out of scope) — "silently inferred forever" is not a completion state |

### 6.2 What this document does not claim

This document does not assert any of the above criteria are met today. Per the companion investigation, most are not (Layer 2 evidence enforcement is the largest open gap; Evidence & Learning has zero real reporters; Preparation Knowledge is unbuilt). Stating the criterion is this document's job; closing it is the roadmap's (§7).

---

## 7. IMPLEMENTATION ROADMAP

Sequenced from the platform's actual current state (per the companion investigation), not a blank slate. Each phase is independently shippable and gated (mirrors `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`'s own phase-gating discipline, Rule LT1: no stage skips its predecessor's trust bar).

| Phase | Delivers | Gate |
|---|---|---|
| **0 — Close the declared/enforced gap (§4.1)** | An automated validator confirming every live nutrition-benefit row carries a real `SourceRef` + `reviewedAt` before render; ship the Master Roadmap's own minimum-5-sourced-benefits content | Zero benefit rows render without a checked `SourceRef` — Rule KC8 satisfied for Layer 2 |
| **1 — Complete the contested-domain migrations (M1/M2/M4)** | Retire `nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts` — already named, scoped, and low-effort per the SoT Register | Rule KC4 ("one mouth") satisfied for Food Knowledge — no domain currently violates it more visibly |
| **2 — Name the "one mouth" adapter for every Cluster A/B/C entity type still missing one** | Extend §2.1's register: Food Relationships, Preparation Knowledge (once built), recipe licence/attribution detail | No knowledge entity type has more than zero adapters once it has more than one consuming surface |
| **3 — Wire the Evidence & Learning Platform's first real reporter and first real consumer** | Prove the Cluster D lifecycle end-to-end with genuine household data (EL1/EL2's own named next milestone) | A first Domain Intelligence layer reads `search`'s Confirmed Understanding as one re-weighting input (Rule P1 — re-weight, never author) |
| **4 — Build Preparation Knowledge (WS5A)** | The first knowledge type built *after* this document exists — the first real test of whether §1/§3/§4/§5 as written are sufficient guidance without further re-derivation | Ships using the existing Nutrition Facts pipeline row (§1.1) as its template, with zero new lifecycle invented |
| **5 — Resolve the demand-driven prioritisation loop (Rule KC10)** | Once Phase 3 has real reporters, wire enrichment-queue prioritisation to real evidence gaps instead of editorial judgement alone | First enrichment queue item prioritised by a genuine `search` result, cited as such |
| **6 — Product-scope decisions for Retailer/Partner knowledge** | A resolved decision (in-scope-with-partnership or explicitly out-of-scope) — a product decision, not an engineering task | The Master Roadmap's open question (unresolved since 2026-06-18) is closed one way or the other |

---

## 8. RISKS

| # | Risk | Phase | Rating | Mitigation |
|---|---|---|---|---|
| R1 | A future knowledge domain invents a fifth graduation-pipeline variant instead of using §1's table | 4+ | 🟠 Med | This document exists precisely so the next workstream has a citable reference; code review gate should ask "which §1.1 row is this closest to?" before approving a new lifecycle |
| R2 | Layer 2 (claim trust) enforcement (Phase 0) is deferred indefinitely because it requires nutritionist/editorial time, not engineering time | 0 | 🔴 High | Named explicitly as the platform's single largest declared-not-enforced gap; tracked here and in the Master Roadmap so it cannot silently drop off either document's radar |
| R3 | The "one mouth" rule (KC4) is treated as aspirational rather than enforced, allowing a second narrator to appear before the adapter is built | 2 | 🟠 Med | Code review gate: any PR adding a second consuming surface for an existing knowledge entity type must either point at an existing adapter or build one in the same PR |
| R4 | Evidence & Learning's first reporter (Phase 3) ships without re-confirming `RecordOutcomeParams`'s shape is adequate for real data, repeating a mistake EL1 itself warned against | 3 | 🟡 Med | EL1's own "Remaining Architectural Risks" note is carried forward unchanged — this document adds no new mitigation, only reaffirms it |
| R5 | Rule KC10's demand-driven prioritisation is implemented as an inferred signal before real reporters exist, fabricating a demand signal that doesn't yet flow | 5 | 🟠 Med | Rule KC10 explicitly forbids this; editorial judgement remains the only legitimate interim signal |
| R6 | Preparation Knowledge (Phase 4) is built as a genuinely new fifth pipeline instead of reusing the Nutrition Facts template, undermining this document's own central claim | 4 | 🟡 Med | §1.1's table names Preparation Knowledge's closest analogue explicitly; a build that diverges without justification fails the Architecture Compliance Checklist's "extends existing architecture" item |

---

## 9. DEFINITION OF DONE

- **What success looks like:** the four independently-built graduation pipelines (WS0X, WS4B, FS1/FS2, EL1/EL2) are named as one canonical pipeline (§1) with a citable table future workstreams fill a row into rather than re-deriving; the SoT Register's ownership rule is complemented by an explicit "one mouth" adapter rule (§2, Rule KC4); a platform-wide Domain Completeness Model generalises WS0X.10's MVF pattern without forcing it onto behavioural evidence, which correctly stays confirmation-gated (§3); the three pre-existing trust vocabularies are named as one layered Evidence Standard, with the platform's largest declared-vs-enforced gap (Layer 2 `SourceRef` enforcement) named explicitly rather than left implicit (§4); the enrichment pipeline's automation ceiling and human-review boundary are stated as a reusable strategy (§5); every domain's own completion criterion is stated as a target, not fabricated as already met (§6); a phased roadmap sequences real, already-identified gaps rather than inventing new ones (§7).
- **What must not break:** nothing can — no code, schema, route, or data was touched by either this document or its source investigation.
- **Manual verification:** `git status` shows exactly the files listed in this document's and the investigation's Rollback Protection sections; rollback tag exists (`git tag -l 'rollback/before-pkca1*'`); `docs/architecture/README.md` lists this document.

## 10. DATA IMPACT

- Reads existing data: **NO** (documentation only).
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.

## 11. TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. This document strengthens every existing evidence rule by making the declared-vs-enforced gap (§4.1) explicit rather than leaving it implicit.
- **Could this fabricate certainty?** No. §6.2 states directly that none of the per-cluster completion criteria are met today — this document names targets, it does not claim they are achieved.
- **Is anything guessed but shown as real?** No. Every pipeline instance in §1.1, every adapter in §2.1, and every gap in §4.1 traces to a specific, cited document or code finding from the companion investigation.
- **What happens if the system is wrong?** If a future phase proves this generalisation wrong (e.g. a fifth knowledge type genuinely does not fit the four-stage shape), it is corrected by a successor governing document, exactly as this document itself generalises rather than replaces its four sources.
- No architectural duplication introduced: **YES** — this document creates no new store, table, or capability.
- No new source of truth created: **YES** — every fact named here already has the owner the SoT Register or a cited investigation already gave it.
- No runtime behaviour altered: **YES**.

## 12. ARCHITECTURE CONVERGENCE STATUS

```
Domain:
  Platform Knowledge Completion — a new cross-cutting governance layer (like
  PLATFORM_QUALITY_ARCHITECTURE.md) over every existing knowledge domain named
  in the SoT Register plus the newer Evidence & Learning and Preparation
  Knowledge domains.

Current Canonical Owner (unchanged by this document):
  Each knowledge domain's own owner exactly as declared in
  THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, WS0X.13, WS4B/WS5A/WS6,
  FS1/FS2/THA_RECIPE_ACQUISITION_ARCHITECTURE.md, and EL1.

Current Runtime Consumer(s):
  Unchanged — this document adds no new consumer of any store.

Duplicate Owners Remaining (inherited, unchanged):
  The same three pre-existing contested stores named in ARCHITECTURE_PRINCIPLES.md
  (nutrition-benefit-library.ts, pantry-knowledge.ts, nutrition-variety.ts) —
  this document does not resolve them, it sequences their resolution as Phase 1
  of its own roadmap (§7).

Current Convergence (%):
  Governance-naming convergence (this document's own scope): 100% — the four
  pre-existing pipelines are now named as one canonical shape (§1.1) and the
  "one mouth" rule is stated platform-wide (§2) for the first time. Enforcement
  convergence (whether every domain's Evidence Standard is code-enforced, not
  just declared): the single largest known gap is Layer 2 (§4.1), currently
  0% code-enforced — zero live benefit rows carry a checked SourceRef.

Target Convergence (%):
  100% governance-naming (achieved by this document). Enforcement convergence
  target and roadmap are stated in §7 Phase 0; not committed to a number by
  this document, which is governance-only.

Next Planned Milestone:
  Phase 0 of §7 — the automated SourceRef/reviewedAt validator for live
  nutrition-benefit rows.

Remaining Architectural Risks:
  See §8. The most consequential is R2 (Layer 2 enforcement deferred
  indefinitely) — a content/editorial resourcing risk, not an architecture gap.
```

## 13. SCOPE LOCK

**Implemented scope (this promotion):** exactly EWO-PKCA1 — investigate every platform domain's knowledge ownership, gaps, and existing completion/evidence/enrichment patterns (the companion investigation); name the shared shape across WS0X/WS4B/FS1-FS2/EL1-EL2 as one canonical Knowledge Graduation Pipeline (§1); state the "one owner, one mouth" rule generalising WS6 platform-wide (§2); generalise WS0X.10's MVF model into a platform-wide Domain Completeness Model while explicitly excluding transactional state and confirmation-gated behavioural evidence from it (§3); name the three pre-existing trust vocabularies as one layered Evidence Standard and name the platform's largest declared-vs-enforced gap explicitly (§4); formalise the enrichment pipeline shape and its automation ceiling (§5); state per-cluster future-state completion criteria without claiming any are met (§6); sequence a phased roadmap from real, already-identified gaps (§7); create this document and its companion investigation; index both in `docs/architecture/README.md`.

**Explicitly excluded (out of scope — not implemented by this promotion):** any code, schema, route, or validator change (including the Phase 0 SourceRef validator itself — named, not built, here); any resolution of the M1/M2/M4 contested-domain migrations; any build-out of Preparation Knowledge, a Signals Gateway, or a Community capability; any product decision on Partners/Retailer scope; any change to WS0X, WS4B, WS5A, WS6, FS1, FS2, EL1, or EL2's own content, code, or governing text — all are cited, none are rewritten.

---

*Governance promotion only. No code was changed in the production of this document.*
*Rollback: `rollback/before-pkca1-platform-knowledge-completion-architecture-20260703` → `3460519`.*
