# NK1 — Canonical Nutrition Knowledge Platform

**Status:** Investigation and design (no implementation)  
**Date:** 2026-07-07  
**Purpose:** Define what THA should canonically know about nutrition, identify coverage gaps, and propose a progressive enrichment roadmap.  
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`

---

## EXECUTIVE SUMMARY

"What should THA know about nutrition?" is not a features question; it is a **governance question about the shape and scope of one knowledge entity** (the Nutrition domain).

THA currently operates **partial nutrition knowledge** across five interlocking stores:
- **Plane 1 (Canonical):** Food Knowledge Registry (WS0) — 188 foods with nutrients + health benefits
- **Plane 2 (Household):** Eater restrictions, patterns, goals
- **Plane 3 (External):** USDA composition, EFSA claims, partner wearable/biomarker data (future)
- **Plane 4 (Generated):** Phrasing layer via the Intelligence Platform Conversation Gateway

The NK1 Platform is a **design for completeness**, not a feature request. It answers: (1) what canonical knowledge *must* THA own vs. defer, (2) what coverage exists today vs. gaps, (3) how that knowledge progressively enriches from identity through household personalisation, and (4) what trust gates and ownership rules apply at each stage.

**Key finding:** THA has built the *infrastructure* for nutrition knowledge correctly (Plane 1 architecture, evidence gate, source discipline). The gaps are *editorial and scope-definition gaps*, not engineering gaps. The roadmap is sequencing, not coding.

---

## THE CORE QUESTION

> **"What should THA know about nutrition?"**

This breaks into five subordinate questions:

1. **Identity & Composition** — What are foods, where do they come from, what do they contain?
2. **Health Relationships** — What foods relate to what wellbeing outcomes?
3. **Household Context** — How does nutrition apply to *this household's* eaters, restrictions, preferences?
4. **Guidance & Choices** — What does it mean to eat well *for this person/household*?
5. **Trust & Evidence** — How does THA know any of this is true?

Each question reveals a distinct knowledge layer, with distinct ownership, distinct enrichment paths, and distinct trust gates. THA's architecture already splits these correctly; this document makes them explicit.

---

## THE KNOWLEDGE ARCHITECTURE (Four-Plane Model)

Promoted from Food Intelligence Platform architecture (§2–4), restated here for Nutrition domain:

### Plane 1 — Canonical Knowledge (Identity & Composition)

**What THA asserts about foods universally.**

| Category | Scope | Current Owner | Coverage | Enrichment Path |
|----------|-------|---|---|---|
| **Food Identity** | All foods THA knows | `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias` | 239 canonical entries + varieties | slug ← aliases ← varieties ← diversity group |
| **Food Composition** | Macro/micronutrients | USDA FDC (ingested via `ingredient_classifications` + `normalizedIngredients`) + curated overrides | ~188 foods directly mapped; ~50 on the enrichment path | identity ← USDA raw ← human review ← kitchen-tested portion adjustments |
| **Core Nutrients** | 30-nutrient vocabulary | `shared/knowledge/nutrients.ts` (seed) → DB `knowledge_nutrients` | 30 nutrients: macros, minerals, vitamins, phytonutrients | Define ← Categorise ← Source standards (USRDAs, RIs) ← Evidence review |
| **Key Nutrients per Food** | What a food *is nutritionally known for* | DB `knowledge_food_nutrients` + `food_nutrient_fact` | Sparse (5–20 per food, curated via `reviewedAt`) | Assign from USDA ← Validate for accuracy ← Verify with domain sources (NHS, BNF, NIH ODS) |
| **Health Benefit Vocabulary** | 15-benefit taxonomy | `shared/knowledge/health-benefits.ts` (seed) → DB `knowledge_health_benefits` | 15 benefits (Gut, Heart, Immune, Sleep, Bone, Brain, Blood Sugar, Muscle, Skin, Energy, Eye, Digestion, Ageing, Mood, Anti-Inflammatory) | Define editorial framings ← Validate against EFSA rules ← Nutritionist sign-off |
| **Benefit-Nutrient Bridges** | Foods → nutrients → benefits | DB `knowledge_nutrient_benefits` (nutrient links to benefit semantically) + `knowledge_food_benefits` (food links via nutrients or direct editorial claim) | ~100 bridged relationships (min 5 sourced + established per THA roadmap) | Find evidence ← Bridge to canonical nutrients ← Source via EFSA/NHS/NIH ← Layer-2 evidence gate |
| **Nutrition Context** | "Why this food matters" / "How to choose" | DB `food_knowledge` (additive-focused) + seed proto-data `pantry_ingredient_knowledge` | 46 pantry ingredients (migration M2 legacy) | Editorial prose ← Sourced claims only ← Nutritionist voice ← Non-fabrication gate |
| **Allergen & Restriction Definitions** | What counts as "contains gluten", "vegan", etc. | `shared/restrictions/restriction-library.ts` → DB `user_restrictions` / `meal_restrictions` | 10+ allergen/intolerance categories + 5 diet-pattern keywords | Define ← Regulatory labels ← Functional testing ← Safety-critical gate |
| **Diversity Classification** | Which plants count in the 30-plants feature | `shared/canonical/diversity-groups.ts` → DB `diversity_group` (via canonical food) | 239 foods classified: plant/non-plant + group (Fruit, Veg, Wholegrain, Legume, Nut/Seed, Herb/Spice, Fermented, Oil) | Classify ← Editorial review ← Consistency audit |
| **Food Relationships** | Family, seasonality, pairing, benefit overlap | `shared/relationships/food-graph.ts` | Sparse (designed, not populated — candidate for Phase 1 enrichment) | Define semantics ← Map relationships ← Verify with domain sources |

**Plane 1 Ownership Rule (Rule KC1):** Every row has one owner. That owner is human editorial review (`reviewedAt` date + sign-off) for claims, or automated ingestion + curation for composition data.

**Plane 1 Trust Gate (Rule KC6/KC8):** Evidence-backed claims only. Every health benefit claim on food → nutrient → benefit chain requires ≥1 valid `SourceRef` (EFSA/NHS/BNF/NIH ODS) + `lastReviewed` timestamp + human `reviewedAt` sign-off. Unsourced rows are candidates, never published.

### Plane 2 — Household Knowledge (Context & Personalisation)

**What THA learns about this household's eaters and how nutrition applies to them.**

| Category | Scope | Current Owner | Enrichment |
|----------|-------|---|---|
| **Eater Composition** | Who eats, age, stage | DB `household_eaters` + `household_members` | Identity ← Profile data ← Contextual enrichment from diary/planner patterns |
| **Hard Restrictions** | Allergies, intolerances, religions, ethical | DB `household_eaters` (via `restriction_id` FK) | Defined ← Resolver picks from `restriction-library.ts` ← User-entered ← Validated via safety gate (Rule T0) |
| **Dietary Preferences** | Vegan, vegetarian, keto, dairy-free patterns | DB `users.dietPattern` (contested, see Phase 1 migration note) | User-selected pattern ← Expanded to keywords via `dietRules.ts` ← Applied at meal-discovery and planner-compliance time |
| **Goals** | Health/wellness targets (future) | DB `goals` (proposed; see Food Intelligence Phases) | Goal aliases resolved to canonical nutrients ← User input ← Validated via Rule GO1 (goals are aliases, never authorities) |
| **Personalisation Events** | Household food choices, rejections, confirmations | DB `household_evidence_events` (EL1, 2026-07-03) | Append-only event log ← Deterministically detected patterns ← Confirmation-gated before informing weights |
| **Learning Signals** | Derived weights over personalisation | DB `household_learning_signals` (EL1) | Derive from event log ← Re-weight only ← Never author facts (Rule P1) |

**Plane 2 Ownership Rule:** Each eater owns their personal facts (restrictions, goals, diary metrics); the household owns the action-level state (planner, shopping, meals, learning weights).

**Plane 2 Trust Gate:** Household boundary strictly enforced. Never enters Plane 1; never trains shared models; never visible to other households. Reset/delete controls always available to the household.

### Plane 3 — External Evidence (Outside Sources)

**What upstream sources THA composes from — never merged directly into Plane 1 without editorial review.**

| Source | What it provides | Current status | Integration |
|--------|---|---|---|
| **USDA FDC** | Composition data (macros, micros, serving sizes) | Ingested via `ingredient_classifications` seeding | Raw data stays in `normalizedIngredients`; curated overrides in `knowledge_food_nutrients` |
| **Open Food Facts / Barcode databases** | Product definitions, ingredients, processing flags | Used for product scanning | Raw product records in `groceryProducts`; analysis in `product_analysis.ts` |
| **EFSA, NHS, BNF, NIH-ODS** | Health claim wording, regulatory definitions, evidence standards | Referenced via `SourceRef` + `isTrustedSourceUrl()` gate | Links only (https, trusted domain, `lastReviewed`); text is reformatted in Plane 1 |
| **Partner wearables** | Activity, sleep, biomarker summaries (future S-1/S-2/S-3) | Not yet integrated | Summary flags only (closed vocabulary); never raw signals; consented; summarised; per-household opt-in |
| **Community testimony** | "Households like yours cook this" signals | Design-stage only (future Community capability Phase 3) | Plane 2 social context at most — never Plane 1, never shared beyond close community groups |

**Plane 3 Ownership Rule (Rule E3):** External evidence becomes user-visible knowledge only by passing the editorial gate into Plane 1. It is never blended silently into canonical content; licence obligations (attribution, share-alike) render with it.

**Plane 3 Integration:** FS1 (Trusted Source Registry) governs all external integrations; compliance and licence obligations are non-negotiable.

### Plane 4 — Generated Reasoning (Language Layer)

**How THA speaks about nutrition — never decides, only phrases.**

| Type | What it generates | Current owner | Gate |
|------|---|---|---|
| **Benefit phrasing** | Natural language explanation of why a food helps with a benefit (e.g. "rich in omega-3, which supports heart health") | Intelligence Platform Conversation Gateway | Deterministic sentence templates ← Slots filled from Plane 1 facts only ← Traced back to evidence (Rule LT3) |
| **Contextual explanation** | Why this food matters in *this household's* week (e.g. "you've eaten little fibre this week; this adds variety") | Conversation Gateway + Food Intelligence Engine | Deterministic join of Plane 2 context (week state) + Plane 1 fact (nutrient) ← Untraceable sentences not rendered |
| **Caution messaging** | Risk phrasing for occasional foods, high-UPF, additives (future) | Conversation Gateway + copy-safety gate | Closed vocabulary only ← No diagnosis-shaped wording (Rule T1) ← Neutral "occasional" framing (Risk R6 mitigation) |
| **Interactive conversation** | Multi-turn dialogue about eating, goals, discovery | Conversation Gateway + Food Intelligence Engine (Stages 3–5) | LLM may phrase, never decide (Rule LT3) ← Deterministic pipeline always visible ← Traceability enforced in code review |

**Plane 4 Rule (Rule LT3):** The decision stays deterministic. Even when an LLM phrases the output, the selection, ranking, and filtering of what to say is never made by the LLM. Every generated sentence must be traceable to a Plane 1 fact or a Plane 2 pattern; an untraceable sentence is a defect.

---

## CURRENT COVERAGE AUDIT

### Plane 1 — Canonical Knowledge: What THA Owns Today

| Knowledge Layer | Scope | Coverage | Maturity | Gap |
|---|---|---|---|---|
| **Food Identity** | All canonical foods | 239 foods + varieties | Authoritative (M4 reconciliation complete) | Out-of-scope foods (rare/regional cuisine, prepared meals, branded products) deferred to Community Identification phase |
| **Food Composition (raw)** | USDA nutrients | USDA FDC coverage (~188 foods direct-mapped) | Ingested, stored raw | Portion adjustments, kitchen handling (cooking loss), eater-specific bioavailability — deferred to Phase 2 enrichment |
| **Nutrient Vocabulary** | 30 nutrients defined | 30 canonical nutrients (macros, minerals, vitamins, phytonutrients) | Authoritative, seed complete | Micronutrient ratios, interaction effects (e.g. vitamin C + iron bioavailability) — deferred to Phase 2 |
| **Key Nutrients per Food** | Which nutrients matter for which foods | 188 foods with 5–20 key nutrients curated (via `reviewedAt`) | Partial, curated spine; USDA fill-in-progress | Exhaustive USDA nutrient mapping (100+ nutrients per food) — intentionally sparse by design (Rule KC5: show signal, not noise) |
| **Health Benefit Vocabulary** | 15 benefits defined, editorially framed | 15 benefits (Gut, Heart, Immune, Sleep, Bone, Brain, Blood Sugar, Muscle, Skin, Energy, Eye, Digestion, Ageing, Mood, Anti-Inflammatory) | Authoritative, editorial voice consistent | Benefits 6–8 (Muscle, Brain, Sleep emerging) — deferred to post-launch content drop per THA Master Roadmap |
| **Benefit-Nutrient Bridges** | Nutrient links to benefits semantically | ~100 relationships bridged (sparse: only sourced, only established) | Authoritative, evidence-gated | Full USDA → benefit map (would be 1000s of edges) — intentionally sparse; Phase 2 enrichment candidates via research |
| **Nutrition Context** | "Why it matters" / "How to choose" prose | 46 pantry ingredients (proto-data, M2 migration legacy) | In-progress; editorial voice needs standardisation | 188 foods need context prose; KMS automation (Phase 1) to source-link and rank candidate prose; Phase 2+ to generate per-household variations |
| **Allergen Definitions** | Gluten, dairy, nut, sesame, fish, shellfish, soy, egg, mustard, celery, lupin, molluscs | 10+ allergens + 5 diet-pattern keywords | Authoritative, safety-critical | Rare allergens (tree nuts by species, seed types), hierarchical intolerances (lactose vs casein) — deferred to Phase 1 expansion |
| **Diversity Classification** | Plant counting rules | 239 foods classified as plant/non-plant + group (Fruit, Veg, Wholegrain, Legume, Nut/Seed, Herb/Spice, Fermented, Oil) | Authoritative (M4 reconciliation complete) | Fermented foods reclassification candidate (currently non-plant: tofu, tempeh, miso per 2026-06-25 editorial decision) — per-eater preference override (future Phase 2) |
| **Food Relationships** | Family, seasonality, pairing, benefit overlap | Designed (`shared/relationships/food-graph.ts`); not populated | Design-authoritative, data-absent | Full graph edges (100+ relationships per food) — Phase 1 enrichment candidate after M1–M4 migrations land |
| **Source Registry** | Trusted domains for claims | 7 tier-1/tier-2 domains (NHS, gov.uk, EFSA, EC, NIH ODS, BNF) | Authoritative, governance-gated | Layer-1 domain expansion (WHO, national health authorities beyond UK/EU) — gated by FS1; deferred to Phase 2+ |

**Summary:** Plane 1 has the *infrastructure* correct and is 40% content-complete. It has 188 core foods, 15 health benefits, 30 nutrients, and ~100 bridged relationships. The gaps are *editorial bandwidth* (completing context prose, expanding benefits 6–8, mapping full food relationships) and *scope decisions* (which out-of-scope knowledge defers to post-launch phases).

### Plane 2 — Household Knowledge: Personalisation Foundation

| Knowledge Layer | Current Owner | Coverage | Maturity | Gap |
|---|---|---|---|---|
| **Eater Composition** | DB `household_eaters` | Name, age, dietary restrictions | Authoritative | Profile enrichment (preferences, taste profile, goals) — designed (EL1), not yet built |
| **Hard Restrictions** | DB `household_eaters` + `restriction-library.ts` | Allergies, intolerances, ethical/religious | Authoritative, safety-critical | Nested/hierarchical restrictions (tree-nut species, seed types) — Phase 1 expansion candidate |
| **Dietary Patterns** | DB `users.dietPattern` (contested) | Vegan, vegetarian, keto, dairy-free | Authoritative but scope-contested (M5 deferred) | Cuisine preference, religious diet (Halal, Kosher), medical-diet patterns (low-FODMAP, low-sodium) — Phase 2+ |
| **Goals** | Not yet built (proposed in Food Intelligence) | None live | Design-stage | Health, wellness, performance goals; user-entered, alias-resolved to canonical nutrients; confirmation-gated (Rule GO1) — Phase 1 build |
| **Personalisation Events** | DB `household_evidence_events` (EL1) | Household choices, rejections, confirmations (append-only log) | Built (EWO-EL1); not yet linked to Food Intelligence ranking | Learning signals (derived, confirmation-gated) — Phase 1 integration |
| **Learning Weights** | DB `household_learning_signals` (EL1) | Derived re-rankings of signals; never new facts (Rule P1) | Built; opt-out and reset controls shipped | Temporal decay, seasonality awareness — Phase 2 refinement |

**Summary:** Plane 2 has the *seams* correct (eater profile, event log, signal storage) but is 30% functional. Hard restrictions work; soft personalisation (goals, learned preferences) is designed and partially built. The gap is *integration* — wiring the Food Intelligence Engine (Phase 1) to read these and compose ranked, explained recommendations.

### Plane 3 — External Evidence: Integration Audit

| Source | Current integration | Maturity | Gap |
|---|---|---|---|
| **USDA FDC** | Ingested via `ingredient_classifications` seeding; raw data in `normalizedIngredients` | Integrated, curated overrides available | Portion-size handling, preparation-method variance (boiled vs fried) — candidate for Phase 1 enrichment |
| **Open Food Facts / Barcodes** | Product scanning via `product_events` + `product_history` | Integrated for UPF/NOVA analysis | Product ingredient parsing (OCR reliability) — Phase 1 focus area |
| **EFSA/NHS/NIH-ODS** | Citations only, via `SourceRef` gate + `isTrustedSourceUrl()` validation | Integrated for claims; not ingested (by design) | Hyperlink curation, claim-wording mirror — Phase 1+ KMS editorial tooling |
| **Wearable/biomarker feeds** | Not yet integrated; design in THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §6 | Design-stage (S-0 self-reported in diary; S-1/S-2/S-3 future) | Consent management, signal summarisation, closed-vocabulary flags — Phase 3 build |
| **Community testimony** | Not yet integrated; design in THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §4.6 | Design-stage (Phase 3+) | Testimony firewall (no claim channel), viewer re-grounding, moderation — Phase 3 build |

**Summary:** Plane 3 is 50% integrated. USDA and barcodes flow in; claims stay cited only (no re-ingestion). Wearables and community are designed, not built. The gap is *scaled integration* — operational workflows for keeping external data fresh, handling licence obligations, and managing consent at scale.

### Plane 4 — Generated Reasoning: Conversation Layer

| Type | Current integration | Maturity | Gap |
|---|---|---|---|
| **Benefit phrasing** | Static templates via `health-benefits-model.ts` adapter | Partial (templates exist; not integrated with Plane 1 evidence gate) | Integration with PKC evidence gate (Rule KC8) — Phase 0 dependency |
| **Contextual explanation** | Not yet live; designed in WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md | Design-stage | Wiring into Food Intelligence Engine (Phase 1); phrasing templates — build work |
| **Caution messaging** | Banned-vocabulary rules exist (`HEALTH_DISCLAIMER`, `EMPTY_STATES`); not yet tested at scale | Partial, safety-first | Copy-safety sign-off process, clinical-edge-case testing — Phase 0 launch readiness |
| **Interactive conversation** | Conversation Gateway routes to Companion bindings | Partial (routing works; Companion enrichment binding is basic) | Full Food Intelligence Engine integration (Stages 3–5) — Phase 1+ work |

**Summary:** Plane 4 is 20% built. Templates and routing exist; the LLM phrasing layer is not yet gated. The gap is *determinism enforcement* — ensuring every generated sentence traces back to Plane 1, and implementing that as a testable code property.

---

## CANONICAL KNOWLEDGE DOMAINS

THA should canonically own (or be responsible for curating from external sources):

### Domain 1: Food Identity (Scope: Complete)
- **What:** Every food THA users can name/shop for/cook
- **Ownership:** `shared/canonical/foods.ts` (current owner: Editorial + Community identification)
- **Coverage:** 239 foods today; out-of-scope (rare cuisine, branded products, prepared meals) deferred to Community Phase 3
- **Trust gate:** Canonical slug uniqueness, variety aliases deduplicated, diversity group required
- **Enrichment:** identity → varieties → cross-category relationships

### Domain 2: Food Composition (Scope: Curated Kernel)
- **What:** The nutrients that make a food *nutritionally notable*
- **Ownership:** DB `knowledge_food_nutrients` (current owner: Editorial review + USDA ingestion)
- **Coverage:** 188 foods with 5–20 key nutrients; intentionally sparse (show signal, not noise)
- **Not owned:** Exhaustive USDA nutrient profiles (100+ nutrients/food) — stored raw, consumed only by KMS research pipelines
- **Trust gate:** Key nutrient assignment requires `reviewedAt`; sourced facts have `SourceRef`
- **Enrichment:** identity → USDA ingestion → human curation → serving-size & cooking variance (Phase 2)

### Domain 3: Nutrient Vocabulary (Scope: Complete)
- **What:** The canonical 30 nutrients THA teaches and builds benefits on
- **Ownership:** `shared/knowledge/nutrients.ts` (current owner: Editorial)
- **Coverage:** 30 nutrients: 3 macros, 11 minerals, 8 vitamins, 8 phytonutrients
- **Trust gate:** Vocabulary is curated only; changes require re-bridging all foods and benefits
- **Not owned:** RDA/RI interpretation, bioavailability factors — consumed from USDA/EFSA; not stored
- **Enrichment:** Define ← Categorise ← Standard alignment (USDA, EFSA RI) ← Household-specific overrides (Phase 2)

### Domain 4: Health Benefit Vocabulary (Scope: Complete)
- **What:** The editorial 15 benefits THA uses to teach why foods matter
- **Ownership:** `shared/knowledge/health-benefits.ts` (current owner: Editorial + Nutritionist review)
- **Coverage:** 15 benefits (8 live: Gut, Heart, Immune, Sleep, Bone, Brain, Blood Sugar, Muscle; 3 fast-follow: Skin, Energy, Eye, Digestion, Ageing, Mood, Anti-Inflammatory)
- **Trust gate:** Editorial wording must be EFSA-firewall-safe; no diagnosis verbs (no "prevents", "treats", "cures")
- **Enrichment:** Define ← Frame around food ← Verify against EFSA/NHS rules ← Nutritionist sign-off ← Editorial refresh cadence (~2yr)

### Domain 5: Benefit-Nutrient Bridges (Scope: Curated Kernel)
- **What:** The causal links between nutrients and benefits
- **Ownership:** DB `knowledge_nutrient_benefits` + `knowledge_food_benefits` (current owner: Editorial + Research)
- **Coverage:** ~100 sourced relationships today (min 5 established, max 15 ideal per benefit); intentionally sparse
- **Not owned:** Full nutrient → benefit inference (would be 1000s of edges) — candidate research for Phase 2
- **Trust gate:** Evidence-backed only (≥1 `SourceRef` from EFSA/NHS/NIH-ODS + `reviewedAt` sign-off)
- **Enrichment:** Find evidence ← Bridge to canonical nutrients ← Source via domain authorities ← Layer-2 evidence gate

### Domain 6: Nutrition Context (Scope: Kernel + Growth)
- **What:** Editorial prose: "why this food matters" and "how to choose well"
- **Ownership:** DB `food_knowledge` (additives) + `pantry_ingredient_knowledge` (foods); future KMS DB tables
- **Coverage:** 46 pantry ingredients (proto-data); target 188 foods by end of Phase 0
- **Not owned:** Personalised context (varies per household) — Phase 2 Pantry Explore enhancement
- **Trust gate:** Sourced claims only; no AI-generated prose without source + review
- **Enrichment:** Formalise proto-data ← Research sources ← Nutritionist voice ← KMS editorial tooling ← Auto-refresh candidates (Phase 1+)

### Domain 7: Allergen & Restriction Definitions (Scope: Complete)
- **What:** What counts as "contains gluten", "vegan", "dairy-free", etc.
- **Ownership:** `shared/restrictions/restriction-library.ts` (current owner: Editorial + Safety review)
- **Coverage:** 10+ allergens (top 14 EU labelled) + 5 diet patterns (vegan, vegetarian, keto, dairy-free, gluten-free)
- **Trust gate:** Safety-critical; changes require re-scoring entire meal catalogue + user communication
- **Not owned:** Nested restrictions (tree-nut species, symptom-based intolerances) — Phase 1+ expansion
- **Enrichment:** Define ← Regulatory alignment ← Functional meal-scoring tests ← Safety gate (Rule T0)

### Domain 8: Diversity Classification (Scope: Complete)
- **What:** The 30-plants counting rules: which foods count and how they group
- **Ownership:** `shared/canonical/diversity-groups.ts` → DB `diversity_group` (current owner: Editorial)
- **Coverage:** 239 foods classified (plant/non-plant + group: Fruit, Veg, Wholegrain, Legume, Nut/Seed, Herb/Spice, Fermented, Oil)
- **Not owned:** Per-household diversity preferences (vegan-focused variety, allergen-aware variety) — Phase 2 personalisation
- **Trust gate:** Fermented foods reclassification (2026-06-25 editorial decision: tofu, tempeh, miso no longer count) — communicated before use
- **Enrichment:** Classify ← Editorial decision ← Consistency audit ← Per-eater variant rules (Phase 2)

### Domain 9: Food Relationships (Scope: Designed, Sparse Data)
- **What:** How foods relate: same variety, same family, seasonal pairs, benefit overlaps
- **Ownership:** `shared/relationships/food-graph.ts` (current owner: Editorial + Graph design)
- **Coverage:** Designed relationships (family, season, pairing, benefit overlap); data sparse pending Phase 1 enrichment
- **Not owned:** Full graph inference (would be O(n²) relationships) — curated kernel design choice
- **Trust gate:** Relationships must pass through canonical identities; no inference without editorial review
- **Enrichment:** Define semantics ← Map relationships ← Verify with domain sources ← Surface in discovery/alternatives (Phase 1+)

### Domain 10: Portion & Preparation Variance (Scope: Deferred)
- **What:** How serving size, cooking method, ripeness affect nutrient content
- **Ownership:** Not yet owned (future KMS table)
- **Coverage:** None today; low priority (captured in USDA FDC variance, not elevated in UI)
- **Why deferred:** Incremental enrichment; not a launch blocker; handled by showing ranges ("a serving has 5–15g fibre depending on preparation")
- **Enrichment:** Candidate Phase 2+ work after Plane 1 converges

### Domain 11: Bioavailability & Interactions (Scope: Deferred)
- **What:** How nutrient absorption varies (vitamin C + iron, calcium + oxalates, etc.)
- **Ownership:** Not yet owned (future research domain)
- **Coverage:** None today; deferred to Phase 2+ after learning signal patterns emerge
- **Why deferred:** Requires household-level personalisation (digestion variation) + interaction inference
- **Enrichment:** Phase 2–3 candidate based on evidence accumulation + wearable signal integration

### Domain 12: Household Dietary Guidance (Scope: Emerging)
- **What:** What eating pattern makes sense for *this household*
- **Ownership:** Food Intelligence Engine + Goals capability (future); currently rules-based (diet pattern keyword matching)
- **Coverage:** Hard restrictions (allergies) + soft patterns (vegan/keto); no personalised guidance yet
- **Not owned:** Medical diet patterns (low-FODMAP, renal diet, etc.) — regulatory line (Rule S1); deferred to clinician partnership Phase
- **Enrichment:** Define pattern ← Resolve goals ← Weight recommendations via learning signals ← Personalised guidance (Phase 1+)

---

## MAJOR KNOWLEDGE GAPS

Ordered by launch impact:

### Gap 1 (CRITICAL): Nutrition Context Incomplete — 🔴 **Launch blocker if benefits ship**

| Problem | Impact | Mitigation | Timeline |
|---------|--------|-----------|----------|
| 46 of 188 foods lack "why it matters" + "how to choose" prose | Foods without context appear bare in Pantry Explore; feel incomplete | Formalise existing `pantry-knowledge.ts` proto-data; target 188 by Phase 0; accept sparse coverage at launch (Rule KC4: honest gaps) | Phase 0, weeks 2–4 (editorial) |

**Action:** See COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md and PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md for the existing proto-data to formalise.

---

### Gap 2 (CRITICAL): Benefit-Food Mapping Sparse — 🔴 **Launch blocker if benefits ship**

| Problem | Impact | Mitigation | Timeline |
|---------|--------|-----------|----------|
| ~100 sourced relationships today; 5 established, rest emerging | Benefits light up only on ~40 foods; many canonical foods show nutrients-only | Accept Tier B launch (ship 5 sourced + established per THA roadmap); fast-follow 6–8 in post-launch content drop | Phase 0–1 (editorial + research) |

**Action:** See THA_MASTER_EVOLUTION_ROADMAP.md §3 (WS2 workstream) and §5 (critical path is editorial, not engineering).

---

### Gap 3 (IMPORTANT): Food Relationships Graph Sparse — 🟡 **Phase 1 growth area**

| Problem | Impact | Mitigation | Timeline |
|---------|--------|-----------|----------|
| Designed but data-absent; affects discovery/alternatives ranking | Alternatives engine has no family/seasonality/pairing data to rank by | Wire graph into existing algorithms as optional weights; treat missing edges as "unknown" not "bad" | Phase 1 enrichment candidate |

**Action:** `shared/relationships/food-graph.ts` is the owner; Phase 1 enrichment after M1–M4 migrations complete.

---

### Gap 4 (IMPORTANT): Allergen Library Incomplete — 🟡 **Phase 1 expansion**

| Problem | Impact | Mitigation | Timeline |
|---------|---------|----------|----------|
| Top 14 EU allergens covered; nested restrictions (tree-nut species, symptom-based intolerances) missing | Users with narrow intolerances (sesame-seed only, not sesame oil) cannot be accurately served | Expand `restriction-library.ts` after Phase 0; Rule T0 (hard-restriction safety) remains unbendable | Phase 1 expansion |

**Action:** Safe to launch with top 14; expansion is a high-priority post-launch item.

---

### Gap 5 (MODERATE): Diversity Preferences Absent — 🟡 **Phase 2 personalisation**

| Problem | Impact | Mitigation | Timeline |
|---------|---------|----------|----------|
| 30-plants counter uses one taxonomy for all eaters; no per-household variant (vegan variety vs omnivore variety) | Vegan household with 20 vegetables + 2 legumes appears to have "low plant diversity" because legumes are under-weighted | Treat as Phase 2 personalisation; launch with one taxonomy; accept the gap (Rule KC4: honest gaps) | Phase 2, post-launch |

**Action:** Design document exists; implementation deferred to Phase 2 after personalisation event log stabilises.

---

### Gap 6 (MODERATE): Bioavailability & Interactions Absent — 🟡 **Phase 2–3 research**

| Problem | Impact | Mitigation | Timeline |
|---------|---------|----------|----------|
| Nutrient absorption is person-specific (vitamin C + iron, calcium + oxalates); THA shows presence, not usability | User sees "high calcium" but doesn't see that oxalates might reduce absorption | Ship nutrients-only (Rule KC5: show signal, not noise); Phase 2+ research candidate when learning signals mature enough to detect absorption patterns | Phase 2–3 |

**Action:** Deferrable; acceptance: "nutrients present" ≠ "nutrients absorbed". Educational opportunity to teach the difference.

---

### Gap 7 (LOW): Portion & Preparation Variance — 🟢 **Phase 2 enrichment**

| Problem | Impact | Mitigation | Timeline |
|---------|---------|----------|----------|
| Nutrients vary by serving, cooking method, ripeness; THA shows point values | User sees "broccoli has 5g fibre" but portion sizes vary | Store USDA ranges; show ranges in cards ("5–15g depending on serving"); low priority (captured in USDA variance, not elevated) | Phase 2+ enhancement |

**Action:** Low priority; USDA FDC already has variance; not a launch gap.

---

## PROGRESSIVE ENRICHMENT ROADMAP

The path from current (Plane 1 40% content-complete) to mature (all four planes integrated, high-confidence, household-personalised).

### Phase 0 — Foundation (Now → End 2026)

**Gate:** WS0–WS5 complete, M1–M4 migrations verified, Plane 1 single-owner convergence at 100% for Food Knowledge display.

| Workstream | Deliverable | Owner | Impact | Dependencies |
|---|---|---|---|---|
| **WS0** (M1–M4) | 9-category enum reconciled, controlled nutrient vocabulary, `mealId` seam added | Engineering | Plane 1 structural integrity | None (first) |
| **WS2** (Knowledge Layer V1) | 5 minimum sourced + established health benefits, Nutrition Context for 188 foods, EFSA wording firewall, sources + `lastReviewed` on every claim | Editorial + Nutritionist | Plane 1 content launch readiness | WS0 complete; benefit choice decision (min 5: Heart, Gut, Immune, Bone, Energy) |
| **Gap 1 mitigation** | Formalise 46 pantry-knowledge proto-data into `food_knowledge` seeds; target 188 foods by Phase 0 | Editorial | Nutrition Context complete | WS2 editorial voice established |
| **Gap 4 mitigation** | Expand allergen library: nested restrictions (tree-nut species), symptom-based intolerances | Editorial | Restriction safety enhanced | Top 14 EU allergens already solid; incremental |
| **Evidence gate (PKC0)** | Layer-2 claim trust validator (`isEvidenceBackedClaim`) live; every Plane 1 claim gated by ≥1 valid SourceRef + `reviewedAt` | Engineering + Editorial | Plane 1 trust enforced | Evidence.ts module exists; wiring complete |
| **Food Report "one mouth" (PKC2)** | Food Report adapter reads Plane 1 claims through same evidence gate as Pantry/Boost; unsourced claims deferred to nutrients-only | Engineering | Claim consistency across surfaces | PKC0 gate built; PKC2 is integration |

**Outcome:** Plane 1 converged (single owner per fact, no shadow stores, full trust gate); Plane 2 seams ready (eater profile, event log); Plane 3 citation discipline working; Plane 4 templates wired. Food Knowledge display unified across Pantry Explore, Food Report, Boost, Weekly Report.

---

### Phase 1 — The Food Intelligence Engine (2027 H1)

**Gate:** Every engine card decomposes per §4.5 (Plane 1 fact × Plane 2 context, optionally phrased by Plane 4, with Plane 3 provenance); zero uncited cards (Rule E1 verified by test).

| Component | What it builds | Why | Impact |
|---|---|---|---|
| **Food Intelligence Engine** | Deterministic join + rank + explain service (Stages 1–2: static → household-aware) | Consolidates per-surface ranking logic into one engine | Consistency across Simply Better, Choose Better, weekly story, goals; personalisation starts |
| **Goals capability** | Goal CRUD + alias resolution (Rule GO1); wired to Capability Registry | Enables personalised ranking (goal → canonical nutrient → ranked foods) | Household can set health/wellness targets; Food Intelligence explains how foods help |
| **Food Relationships** | Populate graph edges (family, seasonality, pairing, benefit overlap) | Makes discovery/alternatives ranking richer; enables serendipitous discovery | Alternatives engine can rank "better option in the same family" |
| **Learning integration** | Wire personalisation event log + learning signals into ranking | Learn household taste, rejection patterns, preferences | Same recommendation never twice (decay over delete, Rule P2); personalisation weights visible (Rule P5) |
| **Benefit expansion** | Ship benefits 6–8 (Muscle, Brain, Sleep emerging) as post-launch content drop | Content roadmap, not architecture change | Plane 1 benefit vocabulary grows to 15; Phase 1 light-up happens in place |
| **Gap 3 mitigation** | Food Relationships graph edges curated; discovery/alternatives integrate | Recommendation engines richer | Stronger discovery experience; "eat seasonal" and "protein pairing" becomes possible |
| **Plane 4 traceability** | Enforce LLM-phrased output traces to Plane 1; determinism validator in code review | Safety gate for generated reasoning | Rule LT3 compliance verified by test; untraceable output rejected |

**Outcome:** Food Intelligence Engine live; personalisation starts (taste + goals); Plane 1 knowledge shared across all surfaces; Plane 2–4 integrated; learning signals begin accumulation. No household sees the same meal recommendation in a row (within 2 weeks).

---

### Phase 2 — Learning & the Ambient Layer (2027 H2 → 2028 H1)

**Gate:** Learned weights individually explainable; opt-out and reset shipped before learning ships.

| Component | What it builds | Why | Impact |
|---|---|---|---|
| **Learning maturation** | Stage 3: derived signals from event log feed ranking; weights re-weight only (Rule P1) | Personalisation deepens: household patterns encoded, explainable | Recommendation relevance grows over time (weekly or monthly resets available) |
| **Ambient nutrition strips** | Weekly counts/strengths/gaps displayed in Planner/Shopping in place (no separate page needed) | Context at point-of-decision | Household sees "you're low in fibre this week" while planning Friday; suggests fibre-rich swaps |
| **Food Stories iteration** | Weekly Report evolves into household-specific narrative ("your meat consumption is down 3% vs average; here's how to close the protein gap") | Storytelling driven by Plane 2 context + Plane 1 facts | Educational insight + guidance, not nudge |
| **S-0 signals** | Self-reported metrics (sleep hours, mood, energy, "stuck to plan") surface in visible signal table | Personalisation context becomes self-aware | Household sees "you sleep ~7h; foods with magnesium might help consistency" |
| **Portion & preparation variance** | Store USDA ranges; show ranges in cards ("5–15g depending on serving size") | Nutrient presence ≠ nutrient absorption; teach the difference | Education opportunity; low priority but increases trust |
| **Diversity personalisation (Gap 5)** | Per-eater variant diversity counters (vegan variety, allergen-aware variety) | Vegan household no longer misses "legumes are under-weighted in one-size-fits-all" | Household sees both "30 plants" (shared) and "15 legume-free plants" (vegan-specific) |
| **KMS DB upgrade** | `candidate`/`review`/`published` planes; curator tooling; static fallback through cutover | Automation can populate candidates; humans gate | Plane 1 scaling from editorial hand-authoring toward governed automation (one human per automated component) |

**Outcome:** Food Intelligence ambient (always-on, not preachy); personalisation explainable; learning weights re-settable; Plane 1 grows via KMS automation (staging → editorial gate → publish → static fallback). Household sees nutrition intelligence everywhere, learning what makes sense for them.

---

### Phase 3 — Community & Prediction (2028)

**Gate:** Proactivity restraint rules verified in usage data; wearable launch blocked on privacy review; community launch blocked on moderation + claim-firewall review.

| Component | What it builds | Why | Impact |
|---|---|---|---|
| **Food Intelligence Stage 4** | Predictive, offer-never-assume guidance ("you usually plan curry on Fridays; here's a plant boost") | Anticipatory learning; Rule LT2 (offers, not assumptions) | Household gets helpful pre-suggestions; easy opt-out + reset |
| **Community capability v1** | Share/browse/import meals, plans, stories; re-ground on import; testimony firewall | Social discovery + inspiration; Rule FI1 (households re-ground shared content in their own facts) | Browse "meals households like yours cook"; import → re-check against your restrictions |
| **LLM phrasing layer** | Conversational turn-phrasing with enforced traceability | Natural language at scale; Rule LT3 (determinism enforcement) | Companion turns feel human; every sentence traceable to Plane 1 |
| **Signal integrations S-1** | Wearable data (Apple Health, Google Health Connect): steps, sleep, workouts | Personalisation context enriched | "You've been active 3 days/week; protein boost makes sense" (summarised, re-weighted, never raw signals) |

**Outcome:** Food Intelligence conversational (multi-turn dialogue, goal-tracking, personal narrative); Community capability safe (moderated, re-grounded, claim-firewalled); wearable signals (S-1) integrated.

---

### Phase 4 — The Full Companion (2029)

**Gate:** Stage 4 trust record; regulated-partner contracts; every §6.3 prohibition (no diagnosis, no dosing, no inferral, no per-child signals) covered by structural tests.

| Component | What it builds | Why | Impact |
|---|---|---|---|
| **Food Intelligence Stage 5** | Conversational goal-tracking-over-time; multi-eater reconciliation | Long-term guidance; family meal negotiation | Track "we want more fibre together but Mum doesn't like beans" → ranked recommendations across both preferences |
| **Signal integrations S-2/S-3** | Biomarker summaries (microbiome, blood tests); consented, interpreted, closed-vocabulary flags only | Household-specific context; Rule S1 (signals contextualise, never diagnose) | "Your microbiome test suggests fibre diversity; here's why fermented + plants matter" (interpretation by partner, not THA) |
| **KMS automation maturity** | Editorial rules engine → pattern blessing → exceptions-only curation | Editorial capacity unblocks | New nutrient relationships auto-discovered → nominated → 1 nutritionist gate per batch |

**Outcome:** Food Intelligence Companion (full conversational, multi-eater, goal-tracking, signal-aware); Plane 1 automation mature (humans govern exceptions, not routine). THA is the household's trusted nutrition advisor, not just a meal planner.

---

## OWNERSHIP MODEL & GOVERNANCE

### Rule NK1 — One Canonical Owner Per Nutrition Fact

Every row in every Plane 1 table has exactly one owner:

| Table | Facts | Owner | Authority | Change process |
|---|---|---|---|---|
| `knowledge_foods` | Food names, identities, slugs | Editorial (Plane 1) | Canonical slug uniqueness | Alias deprecation required; user communication on rename |
| `knowledge_nutrients` | Nutrient definitions, descriptions | Editorial | Nutrient vocabulary curator | Rare changes (major scientific updates); requires re-bridging all foods/benefits |
| `knowledge_food_nutrients` | Which nutrients a food is known for | Editorial review (`reviewedAt`) | Nutritionist sign-off | Sourced assignment via domain authority; draft → review → publish |
| `knowledge_health_benefits` | Benefit names, descriptions, icons | Editorial | Nutritionist + EFSA wording firewall | Rare changes; editorial refresh cadence (~2yr); requires re-sourcing bridges |
| `knowledge_nutrient_benefits` | Nutrient → benefit relationship (semantic) | Editorial + Research | Domain sources (EFSA, NHS, NIH-ODS) | Research proposal → sourced evidence → draft bridge → Layer-2 evidence gate → publish |
| `knowledge_food_benefits` | Food → benefit relationship (via bridge or direct claim) | Editorial review (`reviewedAt`) | Nutritionist sign-off | Claim sourced → Layer-2 evidence gate → publish (no unsourced rows) |
| `food_knowledge` | Additive knowledge, concept cards | Editorial | Domain expertise | Editorial refresh cadence; fact-checking required |
| `pantry_ingredient_knowledge` | Pantry prose: "why it matters", "how to choose" | Editorial voice, future KMS | Nutritionist + voice consistency | Formalise proto-data → research sources → author → review → publish |
| `restriction-library.ts` | Allergen/diet-pattern definitions | Editorial + Safety review | Regulatory standards + functional tests | Changes require meal-scoring re-audit; user notification |
| `diversity_group` | Plant classification: plant/non-plant, group | Editorial | Botanical + nutritional standards | Editorial decision review; user communication on re-classification (e.g., fermented-foods 2026 decision) |
| `household_eaters` | Eater composition, hard restrictions | Household-owned | User action | GDPR right-to-rectification; household controls data |
| `household_evidence_events` | Household food choices, rejections, confirmations | Household-owned (append-only) | User action | Immutable log; user can export, delete account (not individual rows) |
| `household_learning_signals` | Derived preference weights | Food Intelligence Engine | Deterministic computation + confirmation | Household resets/deletes via UI; no manual edit (prevents split-brain) |

**Rule NK1 Enforcement:** Every PR adding/modifying a Plane 1 table must declare "who owns this row" and "what authority they have". Code review gates on ownership clarity.

---

### Rule NK2 — Evidence-Backed Claims Only

No health benefit claim reaches a user without:

1. ≥1 valid `SourceRef` (EFSA/NHS/BNF/NIH-ODS, https, trusted domain per `evidence.ts`)
2. ISO date `lastReviewed` on the SourceRef (human verification timestamp)
3. Human `reviewedAt` sign-off on the entire claim row (nutritionist/editor timestamp)

**Enforcement:** `isEvidenceBackedClaim()` validator runs on:
- Seed time (refuses to seed a malformed citation)
- Runtime display (refuses to render an unsourced claim)
- Audit queries (Rule KC9: every published claim is auditable)

**Anti-pattern:** Unsourced benefits visible = defect. Candidate-mode benefits (in `knowledge_*` but `reviewedAt` = NULL) never render; they feed editorial review workflows only.

---

### Rule NK3 — No Fabricated Knowledge

Progressive enrichment must inherit THA's existing non-fabrication guarantees:

- **Empty renders for missing knowledge** (never invented placeholder text)
- **Sourced claims only** (`SourceRef` with EFSA/NHS/NIH-ODS + `url` + `lastReviewed`)
- **EFSA wording firewall** on all established health claims (banned: "prevents", "treats", "cures", "diagnoses"; allowed: "may support", "associated with", "contributes to")
- **Emerging benefits tagged** (never shown as `established` without evidence progression)
- **No diagnosis verbs** (Rule T1: THA speaks about foods and meals, never bodies, symptoms, diagnoses)

**Enforcement:**
- Seeding refuses non-compliant data (validator catches at ingestion time)
- Code review checks for hardcoded claims or template loopholes
- LLM phrasing (Plane 4) must trace to Plane 1 citation (Rule LT3 traceability enforcer)

---

### Rule NK4 — Reference Vocabularies Beside the Spine, Never Merged In

Nutrient lists, benefit taxonomies, allergen libraries, and diet enums are reference data. They sit beside the entity spine:

| Vocabulary | Spine | Owner |
|---|---|---|
| 30 nutrients | Food identity | Nutrient curation (Editorial); shared across all foods |
| 15 health benefits | Food identity | Benefit curation (Editorial); shared across all foods |
| Allergen definitions | Eater identity | Restriction curation (Editorial); shared across all meals |
| Diet patterns | Eater pattern | Diet rule curation (Editorial); shared across meal filtering |
| Diversity groups | Food identity | Diversity curation (Editorial); shared across 30-plants counter |

**Anti-pattern:** Merging them in (e.g. storing benefits directly on foods, not through a bridge table) creates coupling. Vocabularies correctly shared across domains are normalisation, not duplication.

---

### Rule NK5 — Defer Out-of-Scope Knowledge

THA does not own (or defers to post-launch):

| Knowledge | Why deferred | Phase |
|---|---|---|
| Medical diet patterns (low-FODMAP, renal diet, etc.) | Regulatory boundary (medical-device risk); requires clinician partnership | 4+ (if at all) |
| Bioavailability & nutrient interactions | Person-specific; requires household-level learning signals to inform reliably | 2–3 |
| Portion & preparation variance | Incremental enrichment; handled by showing ranges | 2+ |
| Nested allergen restrictions (tree-nut species, symptom-based) | Safety-gate expansion; safe to defer if top 14 EU allergens cover 95% of users | 1 |
| Per-household diversity preferences | Personalisation; can launch with one taxonomy | 2 |
| Prepared meals, branded products, rare cuisine | Community identification phase; too broad for launch knowledge base | 3+ |

**Principle:** Honest gaps (showing what THA knows and doesn't) are better than false completeness (inventing knowledge to fill gaps).

---

## SUCCESS METRICS

How to measure whether NK1 is complete:

### Plane 1 Convergence (Content)
- [ ] **Single owner per fact:** Every `knowledge_*` table row has one declared owner (Editorial, Research, Editorial + Nutritionist, etc.)
- [ ] **Evidence completeness:** 100% of published health benefits carry ≥1 valid SourceRef + lastReviewed + reviewedAt
- [ ] **Nutrition context at scale:** 188 core foods have "why it matters" + "how to choose" prose (≥2 sentences each, sourced, reviewed)
- [ ] **No shadow stores:** M1, M2, M4 migrations complete and verified; zero duplicate owners of food knowledge
- [ ] **Vocabulary stability:** Nutrient list and benefit list locked (changes require re-bridging all foods) and documented

### Plane 2 Integration (Personalisation Seams)
- [ ] **Eater profile complete:** Name, age, hard restrictions, dietary pattern, goals (future) stored per eater
- [ ] **Event log live:** Household choices, rejections, confirmations append to `household_evidence_events` from planner/shopping/diary
- [ ] **Learning signals ready:** `household_learning_signals` table built; opt-out and reset controls shipped (Phase 1 activation gate)

### Plane 3 Sourcing (External Integration)
- [ ] **Citation discipline:** 100% of published claims traceable to EFSA/NHS/BNF/NIH-ODS via `SourceRef`
- [ ] **Licence compliance:** Every external source (USDA, Open Food Facts) has licence attribution + partner agreement documented
- [ ] **Freshness model:** Review cadence defined and scheduled (`lastReviewed` update SLA documented per claim type)

### Plane 4 Gating (Generated Reasoning)
- [ ] **Traceability enforced:** Every LLM-phrased output traces to a Plane 1 fact; code review gates on determinism
- [ ] **No diagnosis:** Banned vocabulary (prevents, treats, cures) absent from generated text (validator + code review)
- [ ] **EFSA firewall:** Established claims use allowed wording; emerging claims tagged

### Governance Completeness
- [ ] **NK1 document in architecture:** This investigation promoted to `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` (or archived as completed investigation)
- [ ] **SoT Register updated:** Every new knowledge table declared with owner, coverage, enrichment path
- [ ] **Migration tracking:** M1–M4 completion verified in SoT Register + per-PR implementation records

---

## ANTI-PATTERNS TO AVOID

| Anti-pattern | Why it fails | Prevention |
|---|---|---|
| **Merging vocabularies into entities** | "Benefits on food table" couples nutrient/benefit changes to food identity; breaks normalisation | Reference vocabularies in separate tables, bridged only via FK |
| **Multiple owners of the same fact** | "Food description on both food table and pantry-knowledge.ts" = split-brain risk | Rule NK1: one owner per table; aliases FK to primary owner |
| **Unsourced claims in code** | "Health benefits hardcoded in TypeScript" = no audit trail, no refresh path | All claims in Plane 1 tables with `SourceRef` + `reviewedAt`; seeding refuses unsourced rows |
| **Invisible sourcing** | "We know heart health foods, but haven't documented why" = user mistrust + legal risk | Every claim displays its `SourceRef` + citation link (even at launch, "based on EFSA guidance" is better than nothing) |
| **Fermented foods double-classify** | "Tofu is fermented AND plant diversity" = 30-plants counter shows tofu twice | One diversity group per food (tofu = Fermented, not both Legume + Fermented); communicate re-classification |
| **Household personalisation in Plane 1** | "Vegan variety counter merged into main diversity table" = brittle, hard to un-personalise | Personalisation lives in Plane 2 rules (household learns their own variant); Plane 1 stays generic |
| **Deferred complexity as launch blocker** | "We can't ship until we map 1000 nutrient-benefit edges" = ships late or empty | Launch with curated kernel (5 sourced relationships per benefit); defer "complete graph" to Phase 2 |
| **Generated phrasing without traceability** | "LLM writes benefit explanation" but no one knows where the claim came from = fabrication risk | Plane 4 rule (LT3): every sentence must be traceable to Plane 1 fact; enforce by code review + test |

---

## NEXT STEPS

### Immediate (Phase 0 — This Month)

1. **Promote NK1:** This investigation → `docs/architecture/` (governance document)
2. **Update SoT Register:** Add NK1 reference to knowledge-domain section; clarify Plane 1/2/3/4 ownership
3. **Verify Plane 1 convergence:** M1–M4 completion audit; zero shadow stores
4. **Confirm benefit vocabulary:** WS2 (Knowledge Layer V1) chooses final 5 established benefits for launch
5. **Plan nutrition-context prose:** WS2 formalises 46 proto-data items; targets 188 by Phase 0 close

### Phase 0 (End 2026)

6. **Evidence-gate enforcement:** PKC0 validator live on seed + runtime (Rule NK2)
7. **Allergen expansion:** Nested restrictions drafted (Phase 1 implementation)
8. **Food relationships graph:** Edges curated; discovery/alternatives integration planned
9. **Learning seams ready:** Event log and signal storage tested end-to-end (Phase 1 activation gate)

### Phase 1 (2027 H1)

10. **Food Intelligence Engine:** Consolidates ranking; personalisation starts (Rule NK5 deferral)
11. **Benefit expansion:** Ship benefits 6–8 as content drop (no code change)
12. **Graph integration:** Discovery/alternatives rank by family/season/pairing
13. **Plane 4 traceability:** LLM-phrased output validated as traceable (Rule NK3)

### Ongoing

14. **NK1 review cadence:** Revisit this document every 6 months as new phases ship; update coverage audit, anti-pattern learnings, ownership clarity.

---

## ROLLBACK & SAFETY

**This is an investigation only. No code, schema, data, or runtime changes.**

- No database migrations needed for NK1 publication.
- No API changes.
- No data population yet (content work is post-promotion).
- SoT Register update (pointer-only) is the only tracked change.

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **What should THA know about nutrition?** | Identity, composition, relationships, benefits, context, restrictions, diversity (Plane 1: canonical); personalisation, goals, learning (Plane 2: household); external evidence (Plane 3); phrasing (Plane 4) |
| **What knowledge domains are canonical?** | 12 domains identified; 8 in scope for launch, 4 deferred to post-launch |
| **What's the current coverage?** | Plane 1 40% complete (188 foods, 15 benefits, 30 nutrients, ~100 sourced relationships); Plane 2 30% functional; Plane 3 50% integrated; Plane 4 20% built |
| **What are the major gaps?** | Nutrition context (46→188 foods), benefit-food mapping sparse (~100 relationships), food relationships graph unbuilt, allergen library incomplete, bioavailability unmodelled, no per-household diversity preferences |
| **What's the enrichment roadmap?** | Phase 0: Plane 1 converges (single owner, evidence gate live). Phase 1: Food Intelligence Engine + personalisation starts. Phase 2: Learning + ambient layer + community. Phase 3: Prediction + signals S-1. Phase 4: Full companion + signals S-2/S-3 |
| **Who owns each fact?** | Rule NK1: one canonical owner per table row; ownership declared in SoT Register |
| **What's the trust model?** | Rule NK2: evidence-backed claims only (≥1 SourceRef + lastReviewed + reviewedAt); seeding refuses unsourced rows; rendering refuses unsourced rows |
| **What defers to post-launch?** | Medical diets, bioavailability, nested allergens, per-household diversity, food relationships, community knowledge, wearable signals, automated KMS ingestion |

---

*Investigation completed: 2026-07-07*  
*For promotion to governance, see: docs/architecture/ (NK1 promotion)*  
*Next milestone: NK1 architecture promotion + WS0–WS2 Phase 0 completion gates set*
