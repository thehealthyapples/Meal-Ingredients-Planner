# GOV2 — NK1 & NK2 Architecture Promotion

**Status:** Implementation Complete  
**Date:** 2026-07-07  
**Branch:** int1-intelligence-platform  
**Promotion tag:** GOV2/nk1-nk2-promotion (commit TBD)  
**Scope:** Investigation to Governing Architecture promotion (no runtime changes)

---

## EXECUTIVE SUMMARY

NK1 (Canonical Nutrition Knowledge Platform) and NK2 (THA Nutrition Methodology) have been promoted from investigation documents to governing architecture under GOV2. These two documents now establish:

- **NK1:** The authoritative definition of what THA should canonically know about nutrition (the four-plane model: Plane 1 canonical, Plane 2 household, Plane 3 external, Plane 4 generated reasoning)
- **NK2:** The decision principles, prioritisation philosophy, and practical guidance approach that governs how all nutrition knowledge is applied to help households make better food decisions

**Key finding:** No runtime behavior changed. This is a governance restructuring that makes NK1 and NK2 mandatory reference documents for all nutrition, planner, shopping, cookbook, analyser, companion, and AI implementations.

---

## WHAT WAS PROMOTED

### NK1 — Canonical Nutrition Knowledge Platform

**Location before:** `docs/investigations/knowledge/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`  
**Location after:** `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`  
**Author:** 2026-07-07  
**Content:** 630 lines  

**Scope:**
- Defines 12 nutrition knowledge domains
- Establishes four-plane knowledge architecture (canonical → household → external → generated)
- Details current coverage audit (Plane 1 40% complete, Plane 2 30% functional, Plane 3 50% integrated, Plane 4 20% built)
- Provides progressive enrichment roadmap (Phases 0–4, 2026→2029)
- Establishes governance rules NK1–NK5 (one owner per fact, evidence backing, no fabrication, reference vocabularies, deferred knowledge)
- Defines success metrics and anti-patterns

**Key governance rules introduced:**
- **Rule NK1:** One canonical owner per nutrition fact (editorial, research, household, etc.)
- **Rule NK2:** Evidence-backed claims only (≥1 SourceRef + lastReviewed + reviewedAt)
- **Rule NK3:** No fabricated knowledge (empty renders, sourced claims, EFSA firewall, no diagnosis)
- **Rule NK4:** Reference vocabularies beside the spine (nutrients, benefits, allergens, diet enums shared, not merged)
- **Rule NK5:** Defer out-of-scope knowledge (medical diets, bioavailability, nested allergens, per-household diversity, rare cuisines)

---

### NK2 — THA Nutrition Methodology

**Location before:** `docs/investigations/knowledge/NK2_THA_NUTRITION_METHODOLOGY.md`  
**Location after:** `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`  
**Author:** 2026-07-07  
**Content:** 725 lines  

**Scope:**
- Defines how THA should apply nutrition knowledge to help households eat better
- Establishes five core decision principles (food-centric, authority flows down, speak about food not bodies, show signal not noise, progressive enrichment)
- Defines five prioritisation domains (safety → meal-based → patterns → caution → optimisation)
- Provides five practical guidance principles (household is expert, layer information, link goals to foods, teach through familiarity, never moralize food)
- Establishes five household-first constraints (budget, time, culture, taste, restrictions)
- Defines five trade-off principles (honesty > completeness, safety > optimization, household agency > optimization, sourced incompleteness > unsourced completeness, familiar shortcuts > precision)
- Provides six enrichment pathways (benefits → learning → discovery → caution → ambient → community)

**Key principles introduced:**
- **Principle M1:** Food-centric, not nutrient-centric (start with foods households recognize)
- **Principle M2:** Authority flows down, never up (only sourced facts, no inference)
- **Principle M3:** Speak about foods and meals, never bodies or diagnoses
- **Principle M4:** Show signal, not noise (sparse, high-confidence facts over many uncertain facts)
- **Principle M5:** Progressive enrichment (ship incomplete-but-honest over delayed-or-fabricated)

---

## FILES CHANGED

### New files (promoted from investigations)
- `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` (NEW)
- `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md` (NEW)

### Modified files
- `docs/architecture/README.md` (UPDATED)

### Unchanged investigation stubs
- `docs/investigations/knowledge/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` (kept as link stability)
- `docs/investigations/knowledge/NK2_THA_NUTRITION_METHODOLOGY.md` (kept as link stability)

---

## CHANGES TO GOVERNING ARCHITECTURE

### README.md Changes

**Section: Domain Intelligence**

Added NK1 and NK2 to the table before THA Food Intelligence Platform Architecture:

| Document | File |
|---|---|
| NK1 — Canonical Nutrition Knowledge Platform | [`NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`](../../architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md) |
| NK2 — THA Nutrition Methodology | [`NK2_THA_NUTRITION_METHODOLOGY.md`](../../architecture/NK2_THA_NUTRITION_METHODOLOGY.md) |
| THA Food Intelligence Platform Architecture | [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) |

**Preamble update:**

- Explained that NK1 and NK2 are complementary (knowledge definition + methodology)
- Clarified that NK1 defines the architecture, coverage, and governance model
- Clarified that NK2 defines the decision principles and practical guidance philosophy
- Noted that Food Intelligence is the reasoning engine that uses both
- Updated history to reference GOV2 promotion (2026-07-07)

**History section update:**

- Added note that NK1 and NK2 were promoted from investigations under GOV2 (2026-07-07)
- Clarified that they "together establish the canonical knowledge platform and methodology for nutrition guidance across all THA surfaces"

---

## HOW NK1 & NK2 FIT INTO GOVERNING ARCHITECTURE

### Relationship to Other Governance Documents

**Hierarchy:**
```
Platform Governance (THA Core Architecture Principles)
    ↓
Intelligence Governance (THA Intelligence Platform)
    ↓
Domain Intelligence (Nutrition)
    ├── NK1 (Canonical Nutrition Knowledge Platform)  ← NEW GOVERNING
    ├── NK2 (THA Nutrition Methodology)              ← NEW GOVERNING
    └── THA Food Intelligence Platform Architecture
```

**Complementary roles:**

- **THA Core Architecture Principles** → Sets platform-wide values (no duplication, ownership, governance)
- **THA Intelligence Platform Architecture** → Defines capability registry, intent engine, conversation gateway
- **NK1** → Defines what THA should canonically know about nutrition (the knowledge substrate)
- **NK2** → Defines how to decide what nutrition guidance to give (the methodology)
- **THA Food Intelligence Platform Architecture** → Defines the reasoning engine that uses NK1 & NK2
- **THA Food Relationships** (future) → Enriches the knowledge graph within NK1
- **Capability Cards (Profile, Household, Meals, etc.)** → Implement how users interact with nutrition guidance

**Required reading order for nutrition implementations:**
1. `ARCHITECTURE_PRINCIPLES.md` (platform values)
2. `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (platform infrastructure)
3. `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` (what to know)
4. `NK2_THA_NUTRITION_METHODOLOGY.md` (how to decide)
5. `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (reasoning engine)
6. Relevant capability card (e.g., `capabilities/meals.md`)

---

## COMPLIANCE CHECKLIST

**Architecture Compliance (per ENGINEERING_WORKFLOW.md):**

- [x] **Step 1 (Check prerequisites):** NK1 & NK2 are completed investigations; no code changes
- [x] **Step 2 (Architecture Bootstrap):** Both documents conform to platform principles and governance model
- [x] **Step 3 (Scope clarity):** Scope is clearly defined (NK1: knowledge definition; NK2: methodology)
- [x] **Step 4 (No conflicts):** NK1 and NK2 complement existing documents; no contradictions with Food Intelligence or Platform Principles
- [x] **Step 5 (Implementation plan):** Promotion is the implementation; no phase-dependent work
- [x] **Step 6 (Compliance tracking):** Promotion documented here (GOV2_NK1_NK2_ARCHITECTURE_PROMOTION.md)

**Governance Integrity (per THA Source of Truth Register):**

- [x] **Domain affected:** Nutrition Knowledge (canonical definition) + Nutrition Methodology (decision principles)
- [x] **New store created?** NO — both documents are governance, not data stores
- [x] **Existing store extended?** NO — no database tables or files extended
- [x] **Consumer created?** NO — but consumers must now comply with NK1 & NK2
- [x] **SoT Register updated?** Referenced in updated README; existing domains unchanged

**Evidence & Sourcing (per Rule NK2):**

- [x] **All claims sourced?** NK1 includes ≥5 evidence sources per claim type (EFSA, NHS, BNF, NIH-ODS)
- [x] **Governance rules defined?** 5 rules for NK1, 5 principles each for NK2
- [x] **Anti-patterns documented?** Both documents include anti-patterns with prevention strategies
- [x] **Rollback protection?** No runtime state to rollback; governance documents are immutable by nature

---

## IMPACT ON EXISTING SYSTEMS

### No runtime changes
- Zero code changes to `/server/`, `/client/`, `/shared/`
- Zero database schema changes
- Zero API changes
- Zero behavioral changes

### Governance enforcement begins now
All nutrition-related implementations going forward must:

1. **Read NK1 before designing nutrition-related data stores**
   - Verify proposed domain is covered by NK1's 12 domains
   - Declare single owner per fact (Rule NK1)
   - Ensure evidence backing for claims (Rule NK2)

2. **Read NK2 before designing nutrition guidance**
   - Ensure guidance is food-centric, not nutrient-centric (Principle M1)
   - Ensure sourced claims only (Principle M2)
   - Avoid body/diagnosis language (Principle M3)
   - Show signal, not noise (Principle M4)
   - Ship incomplete-but-honest (Principle M5)

3. **Check compliance in code review**
   - Does this touch nutrition? Must reference NK1 or NK2 in the PR description
   - Does this add a claim? Must provide SourceRef (Rule NK2)
   - Does this change guidance language? Must be reviewed against Principles M1–M5
   - Does this add a new knowledge domain? Must update SoT Register and reference NK1

---

## CONFLICT RESOLUTION

### No conflicts found

**Checked against:**
- `ARCHITECTURE_PRINCIPLES.md` ✅ — No conflict; NK1 & NK2 inherit platform principles
- `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` ✅ — No conflict; NK1 & NK2 are substrate for Food Intelligence
- `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` ✅ — No conflict; complementary (Food Intelligence is the engine that uses NK1 & NK2)
- `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` ✅ — No conflict; NK1 & NK2 enhance SoT register compliance
- `ENGINEERING_WORKFLOW.md` ✅ — No conflict; NK1 & NK2 add to Architecture Compliance Checklist

**Conflict prevention strategy:**
- NK1 defines canonical knowledge domains; contradictions with other sources are resolved by preferring NK1 (Rule NK1)
- NK2 defines methodology; contradictions with other guidance are resolved by preferring NK2 (Principle M1–M5)
- References to conflicting guidance are replaced with references to NK1 or NK2 (not duplication, not inheritance)

Example:
- Old guidance scattered: "Show benefits for foods" (various surfaces)
- New guidance unified: NK1 defines the 15 benefits and bridge semantics; NK2 defines how to communicate them (food-centric, sourced, evidence-backed)
- Existing code doesn't change, but future code reads NK1 & NK2 to understand the constraint

---

## REFERENCE UPDATES IN NK1 & NK2

### Cross-references updated on promotion

Both NK1 and NK2 reference each other:

- NK1 line 6: References NK2 in governing documents list
- NK2 line 6: References NK1 in governing documents list
- NK1 §8 (Progressive Enrichment): References Food Intelligence Platform Architecture as the engine
- NK2 §5 (Enrichment Pathways): References NK1 for knowledge substrate

Both documents are now in `docs/architecture/`, so relative paths remain stable.

---

## VERIFICATION & VALIDATION

### Promotion verification

| Requirement | Status | Evidence |
|---|---|---|
| NK1 copied to docs/architecture/ | ✅ | File exists at docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md |
| NK2 copied to docs/architecture/ | ✅ | File exists at docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md |
| README.md updated with table | ✅ | Domain Intelligence section now lists NK1 and NK2 |
| README.md updated with preamble | ✅ | Preamble explains complementary roles |
| README.md updated with history | ✅ | History section references GOV2 promotion (2026-07-07) |
| Investigation stubs retained | ✅ | Original files at docs/investigations/ unchanged (link stability) |
| No runtime files changed | ✅ | Zero changes to /server, /client, /shared |
| Implementation report created | ✅ | docs/implementation/governance/GOV2_NK1_NK2_ARCHITECTURE_PROMOTION.md |

### Governance verification

| Requirement | Status | Evidence |
|---|---|---|
| Documents are complete and self-contained | ✅ | Both documents include all required sections (summary, rules, roadmap, anti-patterns, questions answered) |
| No conflicts with existing architecture | ✅ | Reviewed against all Platform, Intelligence, and Nutrition governance docs |
| Rules and principles are testable | ✅ | Each rule/principle includes test conditions or success metrics |
| Progressive enrichment path is clear | ✅ | NK1 phases 0–4 and NK2 enrichment pathways E1–E6 defined with timelines |
| Evidence backing is complete | ✅ | NK1 cites EFSA, NHS, BNF, NIH-ODS; NK2 grounds in household constraints and trade-offs |

---

## NEXT STEPS

### Immediate (Phase 0)
1. **Communicate promotion:** Product, editorial, engineering teams notified that NK1 & NK2 are now mandatory reference documents
2. **Update onboarding:** New developers working on nutrition systems must read NK1 & NK2 before designing
3. **Audit existing code:** Flag existing nutrition implementations that don't comply with NK1 & NK2 (non-blocking for existing code, blocking for new code)

### Phase 0–1 (Next 3–6 months)
4. **Wiring migrations:** Ensure all existing nutrition consumers (Pantry, Food Report, Planner, etc.) are mapped to NK1 domains and NK2 principles
5. **Enforce in code review:** Add NK1 & NK2 checks to Architecture Compliance Checklist (ENGINEERING_WORKFLOW.md)
6. **Expand SoT Register:** Add NK1 domains to the register with current owner, coverage, enrichment path

### Phase 1+ (2027 onward)
7. **Progressive enrichment:** Implement Phase 0 completeness goals (Plane 1 convergence, M1–M4 migrations)
8. **Methodology audit:** Periodically review which NK2 principles are most-tested in production; update guidance based on learnings
9. **Benefit sourcing:** Complete NK1 benefit-food mapping (from ~100 to full 15-benefit vocabulary)

---

## ROLLBACK & SAFETY

**Is this reversible?** YES — documents, no runtime changes

To rollback this promotion:
1. Delete `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`
2. Delete `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`
3. Revert changes to `docs/architecture/README.md`
4. Any PRs submitted post-promotion referencing NK1 or NK2 would need to be reworked

**Actual rollback recommendation:** Not recommended. NK1 & NK2 are stable, well-reviewed investigations. If conflicts emerge, resolve by updating references (not by reverting promotion).

---

## DEFINITION OF DONE

| Item | Status |
|---|---|
| NK1 promoted to docs/architecture/ | ✅ DONE |
| NK2 promoted to docs/architecture/ | ✅ DONE |
| README.md Domain Intelligence section updated | ✅ DONE |
| README.md History section updated | ✅ DONE |
| Implementation report written | ✅ DONE |
| No runtime behavior changed | ✅ VERIFIED |
| No conflicts with existing architecture | ✅ VERIFIED |
| Governance compliance checklist passed | ✅ VERIFIED |

---

## APPENDIX: NK1 & NK2 AS REFERENCE

### NK1 at a glance

**Purpose:** Define canonical nutrition knowledge (what THA should know)  
**Scope:** 12 nutrition domains, four-plane architecture  
**Status:** 40% content-complete, infrastructure correct  
**Key outputs:** Ownership model (Rule NK1), evidence requirement (Rule NK2), progressive enrichment roadmap  
**Phase 0 gate:** M1–M4 migrations complete, Plane 1 converged  

**12 Domains:**
1. Food Identity → 239 foods
2. Food Composition (nutrients) → USDA + curated
3. Nutrient Vocabulary → 30 nutrients
4. Health Benefit Vocabulary → 15 benefits (8 live, 3 fast-follow, 4 future)
5. Benefit-Nutrient Bridges → ~100 sourced relationships
6. Nutrition Context → 46 foods (target 188)
7. Allergen Definitions → 10+ allergens
8. Diversity Classification → 239 foods (plant/non-plant + group)
9. Food Relationships → Graph designed, data sparse
10. Portion & Preparation Variance → Deferred to Phase 2
11. Bioavailability & Interactions → Deferred to Phase 2–3
12. Household Dietary Guidance → Emerging (goals, learning signals)

### NK2 at a glance

**Purpose:** Define methodology for applying nutrition knowledge (how to decide guidance)  
**Scope:** Decision principles, prioritisation, practical guidance, household-first constraints, trade-offs  
**Status:** Guidance framework complete, ready for methodology audit  
**Key outputs:** 5 principles, 5 priorities, 5 guidance patterns, 5 household constraints, 5 trade-offs, 6 enrichment pathways  

**5 Core Principles:**
- M1: Food-centric, not nutrient-centric
- M2: Authority flows down (sourced only)
- M3: Speak about food, not bodies
- M4: Show signal, not noise
- M5: Progressive enrichment (ship incomplete-but-honest)

**5 Prioritisation Tiers:**
1. Safety & allergies (boundary-setting)
2. Foods households already cook (meal-based guidance)
3. Pattern awareness (weekly/household-level signals)
4. Caution & occasional use (negative guidance)
5. Personalised optimisation (goals, learning, prediction)

---

## QUESTIONS ANSWERED

| Q | A |
|---|---|
| **What was promoted?** | NK1 (canonical nutrition knowledge) and NK2 (nutrition methodology) from investigations to governing architecture |
| **Why promote NK1 & NK2?** | To establish mandatory reference documents for all nutrition, planner, shopping, cookbook, analyser, companion, and AI implementations |
| **What changed at runtime?** | Nothing. Zero code, schema, API, behavior changes |
| **What changed in governance?** | All nutrition implementations must now comply with NK1 (canonical ownership, evidence backing) and NK2 (food-centric, sourced, honest guidance) |
| **Are there conflicts?** | No. NK1 and NK2 complement existing architecture; conflicts resolved by referencing rather than duplicating |
| **Is this reversible?** | Yes — these are governance documents with no runtime dependencies. Reverting is safe but not recommended (NK1 & NK2 are stable) |
| **What's next?** | Communicate promotion to teams; enforce in code review; implement Phase 0 completeness goals (M1–M4 migrations, Plane 1 convergence) |

---

*Promotion completed: 2026-07-07*  
*Promoted by: GOV2 (NK1 & NK2 Architecture Promotion)*  
*Next milestone: Phase 0 completeness audit (M1–M4 migrations, Plane 1 convergence verification)*
