# EWO — Platform Knowledge Completion Architecture Investigation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only investigation)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/before-pkca1-platform-knowledge-completion-architecture-20260703` → `3460519` |
| Working tree at start | Dirty with pre-existing, unrelated uncommitted work from prior sessions (FI5 Food Intelligence UI Activation, EWO1/EWO2 Companion Platform, EWX1 Living Companion Experience, EL1/EL2 Evidence & Learning, PLATFORM_QUALITY_ARCHITECTURE — all already documented under `docs/implementation/` and `docs/investigations/`). None of these files are touched by this investigation. |
| This task's writes | This file, plus `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` and one new row in `docs/architecture/README.md` (see companion architecture document) |
| Rollback to committed state | `git checkout rollback/before-pkca1-platform-knowledge-completion-architecture-20260703` |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified.

---

## ARCHITECTURE COMPLIANCE (confirmed before investigation)

Governing architecture reviewed in full before writing this document: `docs/architecture/README.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI1), `PLATFORM_QUALITY_ARCHITECTURE.md`, `ENGINEERING_WORKFLOW.md`, plus the two same-day EWO audits (`EWO_DOMAIN_FUTURE_STATE_AUDIT.md`, `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md`) and the Evidence & Learning Platform records (`EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`, `EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md`). Knowledge-specific history reviewed: `FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md`, `FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md`, `THA_RECIPE_ACQUISITION_ARCHITECTURE.md`, the WS0X series (`WS0X_7`–`WS0X_13`), `CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md`, `WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md`, `WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md`, `WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md`, `WS7_FOOD_RELATIONSHIP_GRAPH_USAGE_AUDIT.md`, `THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md`, `THA_MASTER_EVOLUTION_ROADMAP.md`, and the six Capability Cards under `docs/architecture/capabilities/`.

| Check | Finding | Verdict |
|---|---|---|
| One canonical identity per entity | This investigation introduces no new entity. It reads and cross-references identity work already governed by `CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md` (the `canonical_food_alias.alias_key` uniqueness constraint) and Principle 1. | ✅ PASS |
| One owner per fact | Confirmed against the SoT Register's 27 declared domains; this investigation adds no new store and proposes no change to any declared owner — it only names a *pattern* across existing owners. | ✅ PASS |
| Progressive enrichment for knowledge entities | The entire investigation is organised around Principle 3's identity→core→optional→runtime pattern, extended (not replaced) by the WS0X.10 Level 1/2/3 model already in force for food. | ✅ PASS |
| No fabricated knowledge | Every gap named below is stated as a gap, not filled with an invented fact. Every "what's missing" line is evidenced from a cited document or a direct code/schema read. | ✅ PASS |
| No permanent synchronisation bridge | No bridge is proposed. Where a bridge already exists (e.g. `knowledgeFoodSlug`), it is named as pre-existing debt (per `ARCHITECTURE_PRINCIPLES.md`'s Contested Domains), not re-litigated here. | ✅ PASS |
| Evolution over replacement | This investigation's entire purpose is to find the *existing* governance patterns (WS0X promotion levels, WS4B evidence lifecycle, FS1 trust tiers, WS6's "one mouth" rule) and generalise them — not to invent a parallel scheme. | ✅ PASS |

**Gate result: PASS.** The investigation continues.

---

## GROUNDING — METHOD

This investigation answers a different question than any prior audit. `EWO_DOMAIN_FUTURE_STATE_AUDIT.md` asked *"does each domain match its own architected intelligence vision?"* (the Capability/Intent axis). `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` asked *"what would a first-time user notice?"* (the Experience/UI axis). **This document asks *"what does every domain know, what should it know, and how does the platform grow that knowledge without forking, fabricating, or duplicating it?"*** — the Knowledge axis.

This is not a green-field question. THA has, in fact, already solved fragments of it four separate times, once per knowledge-heavy workstream, without ever naming the common shape:

1. **WS0X** (food catalogue) built a three-level progressive-enrichment promotion model with automated gates.
2. **WS4B** (nutrition facts, inherited by WS5A/WS6) built a five-state evidence lifecycle with trust tiers and a wording firewall.
3. **FS1/FS2** (recipes) built a source-licensing register and a four-lane acquisition/storage-policy model.
4. **EL1/EL2** (household behaviour) built a four-stage observation→pattern→confirmation lifecycle with decay and consistency gates.

Each of these is correct and none should be replaced. The gap this investigation identifies is that **no document yet states these four are the same underlying pattern**, applied to four different knowledge types — which means the next knowledge-heavy domain (Preparation Knowledge, a future Signals Gateway, a future Community capability) has no single place to look before inventing a fifth variant. That is the governance gap the companion architecture document closes.

Evidence sources, each verified against a specific cited document (no claim below is asserted without a source):
1. Direct reads of all documents listed in Architecture Compliance above.
2. The Explore-agent research pass summarised in Part 2 below, cross-checked against the governing documents already read directly.
3. The SoT Register's own 27-domain inventory, used as the base domain list, extended with domains that have emerged since 2026-06-23 (Preparation Knowledge, Recipe Acquisition lanes, Evidence & Learning, the Intelligence Platform's own knowledge index).

---

# PART 1 — DOMAIN-BY-DOMAIN KNOWLEDGE INVENTORY

Domains are grouped into five knowledge clusters plus one explicit out-of-scope cluster (transactional state, per Principle 3). For each domain: **Owns** (what it knows today) / **Missing** (named gaps, cited) / **Future-State Complete** (what "done" already means, where a definition exists) / **Enrichment Source** (where new knowledge should come from) / **Governance Status** (existing gate, or none).

## Cluster A — Food & Nutrition Knowledge

### A1. Canonical Food Identity
- **Owns:** `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias`, `diversity_group` — 239 entries (SoT Register Domain 2). The `alias_key` uniqueness constraint is, in `CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md`'s own words, "the single most important constraint in the design."
- **Missing:** 43+ canonical foods with no `knowledgeFoodSlug` link; a 265 (knowledge) vs 249 (canonical) count drift unreconciled (`WS0X_13_UNIFIED_FOOD_INTELLIGENCE_ARCHITECTURE.md` Part 1); a third independent identity store, `server/data/canonical-map.json`, not yet folded in (same document, SUGGESTION 6).
- **Future-State Complete:** WS0X.13's own target — "one key-space + one runtime read model + one owner per property," via `buildFoodIntelligence(canonicalSlug)`.
- **Enrichment Source:** USDA FDC ingestion pipeline (`shared/catalogue/`) for new candidates; human editorial review for aliasing/variety classification (the four-way relationship taxonomy: alias / variety / diversity-group-shared / different food).
- **Governance Status:** **Mature and named** — `validateCanonicalSeed()` is a real, reusable integrity gate. This is the strongest-governed knowledge domain in the platform.

### A2. Food Knowledge (Nutrition)
- **Owns:** `shared/knowledge/` → DB `knowledge_*` tables via `nutrition-knowledge-registry.ts` — 188 foods (SoT Register Domain 1).
- **Missing:** Per `THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md`, real coverage gaps render as visible dashes (`Supports: —`) on common pantry ingredients — an honest data-population gap, not a code fault, but one with no demand-driven prioritisation model yet. `health-benefits-model.getFoodHealthProfile` is hardcoded to always return `healthBenefits: []` — benefits exist in WS0 but were never wired to the surface (`WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md` §1.3).
- **Future-State Complete:** WS0X.10's Minimum Viable Food (MVF) definition — *"a food is useful the moment it can be resolved, identified, classified, and counted"* — plus the Master Roadmap's launch gate: *"every curated food resolves to ≥1 real fact; benefits optional, never required."*
- **Enrichment Source:** Claude-batch authoring of context + knowledge content per WS0X.9's Phase 1–4 pipeline (USDA ingestion → category triage → batch authoring → THA review → promotion), at an established ~87–90% automation ceiling.
- **Governance Status:** **Mature** — `validatePromotion()` (`auto_promote|h1_qualify|needs_review|blocked`) plus WS4B's five-state fact lifecycle (`candidate→draft→in_review→approved→published→deprecated`).

### A3. Nutrition Evidence & Health Benefits
- **Owns:** `knowledge_health_benefits`, `knowledge_nutrient_benefits` — a 15-benefit taxonomy, four-level evidence strength (`strong/moderate/emerging/insufficient`), EFSA wording firewall.
- **Missing:** **The single largest named content gap in the entire platform.** Every food↔benefit and nutrient↔benefit relationship in the live seed data is hardcoded `confidence: "established"` / `source: "THA editorial"` — zero per-entry `SourceRef` or `reviewedAt` exists anywhere (`EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` Part 3, confirmed independently against live seed files). This is the same gap the Master Roadmap named as the launch keystone on 2026-06-18; unchanged as of this investigation.
- **Future-State Complete:** Master Roadmap §9 — *"minimum 5 established benefits live via the nutrient bridge, nutritionist/EFSA signed off."*
- **Enrichment Source:** Human nutritionist/editorial review against tier-1/tier-2 sources (NHS, BNF, NIH-ODS, EFSA) — this domain is **evidence-gated, not automatable** at the claim level, unlike A1/A2's identity/fact layer.
- **Governance Status:** **Named but unenforced.** WS4B's lifecycle and the EFSA wording firewall are documented rules; there is no automated check today that a live benefit row actually carries a `SourceRef` — this is the platform's largest gap between *stated* governance and *enforced* governance.

### A4. Preparation Knowledge
- **Owns:** Nothing structured today — preparation exists only as free text in `commonForms`, actively stripped during identity resolution (`WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md` §1).
- **Missing:** No `food_preparation` or `preparation_effect` table exists at all. THA holds three contradictory pre-WS5A "positions" on preparation (display trivia / identity noise / forbidden-as-food) that must be unified before any structured store is built.
- **Future-State Complete:** WS5A §9.3, verbatim: *"Preparation defaults to silence. A preparation says nothing about nutrition until trusted evidence earns it the right to speak — and even then, only as much as the evidence strength permits."* Three honest states (effect known / no meaningful change / genuinely unknown) must render as visually distinct.
- **Enrichment Source:** Same evidence pipeline as A3 (trusted-source-backed, human-reviewed) — "existence is cheap, effect is evidence-gated and rare."
- **Governance Status:** **Designed, not built.** WS5A is architecture without implementation — the clearest example in the codebase of a domain whose completeness model exists before its store does, which this investigation treats as the *correct* order (architecture-first), not a defect.

### A5. Food Relationships (Graph)
- **Owns:** `shared/relationships/food-graph.ts` — an in-memory, editorial-only graph: 5 hand-authored food nodes, ~100 edges (`WS7_FOOD_RELATIONSHIP_GRAPH_USAGE_AUDIT.md`). Already the live production data layer for Connected Foods, Discovery (`similar`/`cook_with`/`broaden_horizons`), and Pantry discover.
- **Missing:** No stated growth plan beyond the 5 authored nodes; derived relations (`same_family`, `shares_benefits`) fill in the rest algorithmically, but the editorial core is very thin relative to how many live surfaces depend on it.
- **Future-State Complete:** No explicit target stated in WS7 — this is itself a gap this investigation surfaces: a load-bearing knowledge store with no named completion criterion.
- **Enrichment Source:** Human editorial authoring (pairing/family/seasonal relationships are judgement calls, not automatable from USDA composition data alone).
- **Governance Status:** **Under-governed relative to its blast radius** — thin editorial base, several live consumers, no graduation model.

### A6. Plant Diversity, Dietary Restrictions, Dietary Rules
- **Owns:** `diversity_group` (WS2A canonical), `restriction-library.ts` v3.0.0 (10 of 14 UK-regulated allergens — fish, celery, lupin, molluscs, sulphites named "Phase 4 candidates," not yet built, per `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` Part 4), `server/lib/dietRules.ts`.
- **Missing:** Plant Diversity is **contested** — `nutrition-variety.ts` keyword lists shadow the canonical `diversity_group` table (M4, unresolved). Dietary Rules is **contested** — identical file exists in both `server/lib/` and `client/src/lib/` (M3, unresolved). Allergen coverage is a genuine safety-relevant gap (4 of 14 regulated allergens absent).
- **Future-State Complete:** `ARCHITECTURE_PRINCIPLES.md`'s own Contested Domains section already states the target for M3/M4; allergen completeness = all 14 UK-regulated allergens at the same depth (aliases, hidden ingredients, substitutions) as the existing 10.
- **Enrichment Source:** Regulatory reference data (UK FSA 14-allergen list) for restrictions; canonical slug lookup (no new authoring) for plant diversity once M4 lands.
- **Governance Status:** **Migration-gated, not knowledge-gated** — the knowledge itself (what a plant is, what an allergen contains) is well-governed; the *duplication* is the open problem, already tracked by the SoT Register.

## Cluster B — Recipe & Meal Knowledge

### B1. Recipe Acquisition & Licensing
- **Owns:** `shared/recipe-acquisition.ts` (policy) + `meals` table (SoT Register Domain 12, unchanged owner). Four acquisition lanes (`tha_library`, `licensed_discovery`, `personal_cookbook`, `community_cookbook` — dormant), each with `AcquisitionType`/`StoragePolicy`/`LicenceState`.
- **Missing:** 1,323 starter-meal rows have **genuinely unknown provenance** — `THA_RECIPE_ACQUISITION_ARCHITECTURE.md`/FS2 name this as needing resolution "before any of them is treated as THA-owned IP" (Finding E-a). TheMealDB integration was found running on a shared test key in production, breaching terms (FS1 G2; a code-level fix exists per `EWO_MEALDB_API_ACTIVATION.md`, operational verification of live deployment still open per `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` E6).
- **Future-State Complete:** `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §1, verbatim: *"Every recipe row THA holds must be able to answer one question: under what right does THA hold and display this content? A recipe whose row cannot answer it may not exist."*
- **Enrichment Source:** Licensed discovery partners (tier-1 sources per FS1), THA-authored originals, user personal imports (never promoted to shared surfaces without a lane transition).
- **Governance Status:** **Mature, actively enforced by a state machine** — the acquisition-lane/licence-state gate chain is the single best-specified enrichment pipeline in the platform for a non-nutrition knowledge type.

### B2. Meal Templates / Shell Catalogue, Ingredient Catalogue, Ingredient Normalization
- **Owns:** `meal_templates` (SoT Register Domain 13); `shared/catalogue/` → `ingredient_classifications` (Domain 24); `ingredient-normalization-service.ts` (Domain 25).
- **Missing:** 55 meal-shell frameworks have no ingredients; 310 ready-meal rows are name-only (`EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` Part 4) — **zero seeded recipe-type meals with real instructions exist**. `ingredient_classifications` is populated only at runtime with no seed, so coverage is operationally unknown from static code alone.
- **Future-State Complete:** No document names a completion criterion for "a real recipe corpus" today — named in this investigation as an open gap (see Part 3).
- **Enrichment Source:** The already-named Edamam licensed corpus option (not yet acquired), or scaled THA-authored recipe authoring.
- **Governance Status:** **Scale-verified, content-thin** — WS0X.8/WS0X.9 certify the architecture holds at 2,000–10,000 foods; no equivalent certification exists for meal/recipe volume because the corpus itself barely exists yet.

## Cluster C — Product, Additive & Retailer Knowledge

### C1. Product Analysis & Food Additive Knowledge
- **Owns:** `server/lib/product-analysis.ts` + `upf-analysis-service.ts` (Domain 19, always a live recompute — the Analyser capability card confirms "no product-analysis result table exists," correcting a stale SoT Register implication); `food_knowledge` DB table (Domain 20) — 300 raw E-number entries, only 13 editorial concept explainers.
- **Missing:** The "why it matters" editorial layer (13 entries) is thin relative to the raw E-number list (300) it is meant to explain (`EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` E8).
- **Future-State Complete:** No explicit ratio target stated; this investigation names "editorial coverage proportional to scan frequency" as the natural criterion (demand-driven, mirroring A2's pantry-coverage recommendation).
- **Enrichment Source:** Editorial authoring against regulatory additive classifications (E-number registries), prioritised by real scan frequency once that telemetry exists.
- **Governance Status:** **Correctly never fabricated** — the Analyser capability card explicitly states a binding "must never fabricate a UPF/NOVA classification since none is persisted" — a strong existing trust rule, just thin content.

### C2. Retailer / Partner Knowledge
- **Owns:** `retailIntelligence.ts` — 11 UK stores via static, confidence-tiered availability **inference**, explicitly "no external APIs called."
- **Missing:** No live pricing; `groceryProducts.price` has no populating source. The Partners capability card names two registered routes (`/api/routing`, `/api/savings/aggregates`) as unrelated to retailers at all, and flags that synthesising per-store prices from one live fetch + hardcoded multipliers "would be a fabrication" if bound to the Companion.
- **Future-State Complete:** Not yet defined at the product level — the Master Roadmap's own open question ("is Partners in launch scope") remains unresolved as of both same-day EWO audits.
- **Enrichment Source:** A genuine retailer data partnership (not yet acquired) would be required for anything beyond inference-labelled advisory content.
- **Governance Status:** **Correctly self-restrained** — this is the platform's best example of a domain declining to fabricate completeness it does not have, rather than papering over the gap.

## Cluster D — Household & Personalisation Knowledge

### D1. Household Profiles (transactional, restriction-critical)
- **Owns:** `households`, `household_members`, `household_eaters` (Domain 16) — `displayName` + `defaultDietTypes[]` + `hardRestrictions[]` only.
- **Missing:** No age band, likes/dislikes, goals, or appetite/portion field — a real personalisation-blocking gap, but **correctly deferred** per the Master Roadmap until a recommendation engine is prioritised.
- **Future-State Complete:** Deferred by design, not undefined — the Master Roadmap explicitly scopes this extension to "if/when" a recommendation engine ships.
- **Enrichment Source:** Direct user input only (this is transactional state per Principle 3, not an enrichable knowledge entity — no automated authoring applies).
- **Governance Status:** **Correctly out of the progressive-enrichment model** — Household composition is transactional, single-owner state; only Rule FI1 ("Food Intelligence reads, never writes household composition") governs its knowledge-adjacent boundary.

### D2. Personal Intelligence / Evidence & Learning (Plane 2)
- **Owns:** `household_evidence_events` (append-only) + `household_learning_signals` (derived, confirmation-gated) — the Evidence & Learning Platform (EL1), the platform's 21st capability, four verbs (`report`/`search`/`approve`/`delete`).
- **Missing:** **Zero real reporters, zero real consumers** (confirmed independently by EL2 and both same-day EWO audits) — a fully-built continuous-learning mechanism with no domain wired into it yet.
- **Future-State Complete:** EL2 §2's five-stage lifecycle — Observation → Evidence → Pattern → Confirmed Understanding → Improved Opportunities — with two named terminal branches (Declined Pattern, No Pattern Yet).
- **Enrichment Source:** Any Business Domain or Domain Intelligence layer calling `report` through the one door (Rule EL2) — Food Intelligence reporting meal-outcome evidence is the named first candidate.
- **Governance Status:** **Mature and the newest addition to the platform's knowledge-governance vocabulary** — ET1–ET6 (never-from-one-observation, consistency-before-confidence, decay, confidence-grows-with-volume, confirmation-is-a-separate-gate, every-signal-explains-itself) are the most rigorously named trust rules of any cluster in this inventory, precisely because they were built last and could learn from the others.

## Cluster E — Platform & Developer Knowledge

### E1. The Intelligence Platform's Own Knowledge Index (TIP Knowledge Plane)
- **Owns (per TIP1 §3):** A derived, rebuildable, permission-classified (`public`/`admin`/`developer`) index of pointers into `docs/`, DB knowledge tables, release notes — never a second editable copy.
- **Missing:** TIP1 itself states this index is Phase 0/not-yet-built; this investigation's own two output documents will become part of its `developer`-class source material once the index exists.
- **Future-State Complete:** TIP1 §14 Phase 0 exit gate — "index rebuildable from source; every public doc classified."
- **Enrichment Source:** Existing authored documentation (this is a pure projection layer — it authors nothing).
- **Governance Status:** **Architecturally solved, operationally unbuilt** — the strongest possible governance-by-design (Rule 3 of TIP1: "index is derived, never owned") for a domain that does not exist as running code yet.

### E2. Companion Personality & Observation Knowledge
- **Owns:** `personality-registry.ts` (six voices), `observation-engine.ts`, `companion-growth.ts` — this is *meta-knowledge about how to phrase*, not business-domain knowledge (per `PLATFORM_QUALITY_ARCHITECTURE.md` §9: "a pure presentation/phrasing layer... introduces no new data owner").
- **Missing:** Nothing structural — its own minimum-sample-size discipline (`companion-growth.ts`) already mirrors ET1 above, independently arrived at.
- **Future-State Complete:** Personality/observation may change *how* something is said, never *what* is true — an already-permanent invariant.
- **Enrichment Source:** N/A — this domain does not accumulate facts, only phrasing variety.
- **Governance Status:** **Correctly excluded from the knowledge-completion model** — named here only to draw the boundary explicitly: this is not a knowledge domain in the sense this investigation is scoped to.

## Cluster F — Explicitly Out of Scope (Transactional State)

Per Principle 3, **Planner State, Shopping State, Diary** are transactional, single-owner stores, not enrichable knowledge entities. Bolting a progressive-enrichment or evidence-lifecycle model onto them would be over-engineering (`ARCHITECTURE_PRINCIPLES.md` §3, "What UDEA Does Not Apply To"). They are named here only so the completion model in the companion document can state explicitly what it does *not* govern, rather than leaving the boundary implicit.

---

# PART 2 — CROSS-DOMAIN GOVERNANCE FINDINGS

This section names the patterns that already exist, independently, in four different places — the raw material the companion architecture document generalises.

## 2.1 Four independent "completion" models already exist

| Model | Domain | Stages | Source |
|---|---|---|---|
| **Progressive Enrichment Levels** | Food catalogue | Level 1 (MVF, mandatory) → Level 2 (optional) → Level 3 (optional) | WS0X.10 |
| **Fact Evidence Lifecycle** | Nutrition facts | `candidate → draft → in_review → approved → published → deprecated` | WS4B (inherited by WS5A/WS6) |
| **Acquisition/Licence Lifecycle** | Recipes | `owned/licensed/conditional` (callable) vs `pending_review/unlicensed` (not callable), across 4 lanes | FS1/FS2, `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` |
| **Evidence & Learning Lifecycle** | Household behaviour | Observation → Evidence → Pattern → Confirmed Understanding → Improved Opportunities | EL1/EL2 |

**The finding:** all four models share an identical deep structure — *(1) raw candidate enters, (2) automated/structural gates filter, (3) a human or an explicit confirmation decision promotes, (4) the promoted fact is visibly distinguishable from the unpromoted one, (5) rejection is a first-class terminal state, never silently retried.* No document before this one names that shared shape. Each of the four teams re-derived it from scratch. This is the single most valuable finding of this investigation: **the pattern is right every time it's built; it's just never been named once so the fifth team doesn't have to re-derive it.**

## 2.2 Three independent trust/evidence vocabularies already exist

| Vocabulary | Scope | Source |
|---|---|---|
| Trust tier × source role (`tier1_official`/`tier2_scientific`/`tier3_reference`/`banned` × `composition`/`outcome`/`wording`/...) | External sources feeding nutrition/recipe knowledge | FS1 §4 |
| Evidence strength (`strong/moderate/emerging/insufficient`) + EFSA wording firewall | Nutrition claims | WS4B, restated as Rule 6/E1/E2 in `ARCHITECTURE_PRINCIPLES.md`/FI1 |
| Evidence Trust Rules ET1–ET6 (never-one-observation, consistency, decay, confidence-grows-with-volume, confirmation-gate, self-explaining) | Household behavioural evidence | EL2 §7 |

These are not duplicates of each other — they answer different questions (is this *external source* trustworthy? is this *claim* strong enough to state? is this *pattern* real enough to confirm?) — but nothing today states that they are the three layers of one bigger idea (source trust → claim trust → behavioural-pattern trust), each gating the next. The companion document names this chain explicitly.

## 2.3 One anti-duplication mechanism generalises across every cluster

`WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md`'s "the report is the only mouth" rule — no surface may speak about a food except through the one canonical adapter — is currently scoped only to Food Reports. But the identical failure mode recurs in Cluster C (Analyser vs `food_knowledge` risk of independent additive commentary) and Cluster B (a future recipe detail surface re-deriving licence/attribution text independently). This is a generalisable rule, not a food-specific one: **exactly one adapter per knowledge entity type is the "mouth"; every surface reads through it; no surface re-derives or re-phrases the underlying fact independently.**

## 2.4 The demand-driven prioritisation gap

Both `THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md` (for pantry coverage) and this investigation's Cluster C1 (for additive editorial coverage) independently want the same missing input: **real usage frequency as the enrichment priority signal.** Today, every enrichment queue (WS0X's `needs_review`, additive editorial backlog, allergen Phase-4 candidates) is prioritised by editorial judgement alone, with no feedback loop from what households actually encounter. The Evidence & Learning Platform (D2) is architecturally the right mechanism to eventually supply this signal (a `search` result surfacing "this dimension has evidence but no matching canonical knowledge" is a natural enrichment-priority signal) — but D2 has zero real reporters today, so this loop does not exist yet. Named here as a roadmap item, not a defect.

## 2.5 Where governance is stated but not enforced

Cluster A3 (Nutrition Evidence) is the platform's clearest case of a rule that is *written* (SourceRef required, Principle 6, Rule 6/E1 of `ARCHITECTURE_PRINCIPLES.md`/FI1) but not *checked* — no automated validator confirms a live benefit row actually carries a `SourceRef` before it renders. This is structurally different from A1/A2, where `validateCanonicalSeed()`/`validatePromotion()` are real, running gates. The companion document's Evidence Standards section treats "is the rule enforced by code, or only stated in a document" as its own explicit maturity axis, mirroring `PLATFORM_QUALITY_ARCHITECTURE.md`'s "declared vs enforced" distinction for Security/Privacy/Trust.

---

# PART 3 — PLATFORM QUESTIONS

**1. What does "knowledge complete" mean, platform-wide?**
There is no single number. Per Cluster A/B/C above, completeness is domain-specific (MVF for food, minimum-5-sourced-benefits for nutrition claims, licence-answerable for recipes, evidence-earned for preparation). What generalises is the *shape* of "complete enough to ship" — §2.1's four-stage pattern — not a single completeness percentage. The companion document formalises the shape, not a false single metric.

**2. Where should additional knowledge come from?**
Ranked by domain, from Part 1: USDA FDC (food facts, largely automatable), licensed partners + THA editorial authoring (recipes, nutrition claims — evidence-gated, not automatable), regulatory reference data (allergens), and — not yet flowing — the Evidence & Learning Platform's own confirmed signals, once a first real reporter exists (D2). No domain should invent a fifth acquisition channel without checking this list first (Rule 8 of the SoT Register, generalised).

**3. How should new knowledge be governed?**
By the four-stage pattern named in §2.1, generalised: raw candidate → structural/automated gate → human or confirmation-gated promotion → visibly distinguishable published fact, with rejection as a first-class, never-silently-retried terminal state. Every cluster in Part 1 that has "Governance Status: Mature" already does this; every cluster marked "Designed, not built" or "Named but unenforced" is the gap the roadmap should close first.

**4. How is duplicate ownership avoided?**
Two existing, complementary mechanisms, not one: (a) the SoT Register's per-fact ownership table (which store owns which fact), and (b) the newer, narrower "one mouth" rule (§2.3) for which *surface* is allowed to speak a fact once it's owned. Cluster findings show ownership duplication is largely solved (SoT Register) while speaking-surface duplication is only solved for one domain (Food Reports) and should generalise.

**5. How are evidence and trust maintained?**
By the three-layer vocabulary chain in §2.2 (source trust → claim trust → pattern trust), each already independently rigorous, never yet named as one chain. The chain's weakest link, per §2.5, is that claim-level trust (A3) is stated but not code-enforced — this is the single highest-priority gap this investigation surfaces for the roadmap.

---

## DATA IMPACT

- Reads existing data: **YES** (this document's entire content is derived from existing files).
- Writes no data: **CONFIRMED** — no code, schema, route, or capability was touched.
- Changes no ownership: **CONFIRMED.**
- Requires no schema changes: **CONFIRMED.**

## TRUST CHECK

- Every finding above traces to a specific file and, where possible, a specific quoted passage — no gap or maturity claim is asserted without cited evidence.
- Where a domain's future state is genuinely undecided at the product level (Partners, C2), this document says so explicitly rather than inventing a target.
- No recommendation in this document proposes a new store, table, or duplicate of anything that already exists — every finding either names an existing gap or names an existing pattern to generalise.
- Work in flight (EL1/EL2, FI1, PLATFORM_QUALITY_ARCHITECTURE) was read and credited accurately, not re-litigated — this investigation's job was to find the shared shape across already-approved architecture, not to re-review it.

---

*Investigation only. No implementation performed.*
*Rollback: `git checkout rollback/before-pkca1-platform-knowledge-completion-architecture-20260703`.*
