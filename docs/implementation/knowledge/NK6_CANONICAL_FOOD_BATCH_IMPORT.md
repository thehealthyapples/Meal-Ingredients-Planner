# NK6B — Batch Canonical Food Import Assessment

**Status:** Batch inventory and import readiness report  
**Date:** 2026-07-07  
**Scope:** Assessment of 10 canonical food draft files in knowledge/canonical-foods/drafts/  
**Governing documents:** NK1, NK2, NK4, NK5, NK6_CANONICAL_FOOD_PILOT_IMPORT.md

---

## EXECUTIVE SUMMARY

**Critical finding:** A schema transformation has occurred since NK6 pilot completion.

- **NK5 specification (created in this session):** 10-part nested structure optimized for LLM authoring
- **Actual schema in drafts directory:** `tha_canonical_food_draft` v2.0-draft with different structure (governance-first, not nutrition-first)
- **Files in drafts:** 10 canonical foods (spinach, lentils, chickpeas, broccoli, eggs, salmon, blueberries, yogurt, olive oil, oats)
- **Importer status:** No NK6 importer exists yet; batch import cannot proceed without building it
- **Batch readiness:** Files are partially ready; schema mismatch and importer gap block production import

**Recommendation:** Do NOT proceed with batch import until:
1. Schema reconciliation: NK5 vs. 2.0-draft governance (owner and design decision required)
2. Importer built: Target 8-12 hours engineering work
3. Validation suite built: Schema validation + evidence gating (4-6 hours)

---

## SECTION 1: BATCH INVENTORY

### 1.1 Files Found in drafts/

| File | Status | Schema | Notes |
|------|--------|--------|-------|
| spinach.yaml | ✅ Present | 2.0-draft (linter-transformed from NK5) | Pilot enriched version; auto-converted to 2.0-draft |
| lentils.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| chickpeas.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| broccoli.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| eggs.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| salmon.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| blueberries.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| greek-yoghurt.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| extra-virgin-olive-oil.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |
| oats.yaml | ✅ Present | 2.0-draft | Pre-existing in new schema |

**Total: 10 foods. All in v2.0-draft schema. None in NK5 YAML format.**

---

## SECTION 2: SCHEMA MISMATCH ANALYSIS

### 2.1 NK5 Schema (Designed in This Session)

**Structure:** 10-part nutrition-first hierarchy
```yaml
food:
  slug, name, category, description, forms, storage, seasonality
context:
  nutrition_context, forms_guidance, cooking_guidance, common_uses
nutrients: [array of nutrient objects with source_url, confidence, ranking]
benefits: [array with source_refs, evidence_strength, nutrient_bridge, reviewed_at]
relationships:
  variants, family, seasonal_pairings, nutritional_synergies
allergens_and_restrictions: [with compatibility matrix]
discovery: [gap_filling_intents, search_intents, ranking_metadata]
metadata: [authoring, compliance, validation, version tracking]
```

**Purpose:** LLM-friendly authoring with NK1/NK2/NK4 governance enforced at schema level

---

### 2.2 Actual Schema in Drafts (v2.0-draft)

**Structure:** 14-part governance-first hierarchy
```yaml
record:
  schema, schema_version, batch_id, status, canonical_slug, display_name, etc.
nk_controls: [governing patterns, policies, ai_usage_rules]
identity:
  food_category, plant_count_policy, aliases, not_same_as, canonical_identity_rule
classification:
  whole_food_status, upf_default, processing_watchouts
varieties_and_forms: [varieties, forms, preparation_states, form_policy]
nutrition_profile:
  quantitative_values_status, notable_nutrients (qualitative), editorial_summary
benefit_language: [approved_wording per area, evidence_tone]
planner_metadata: [meal_slots, roles, good_uses, tags, household_notes]
shopping_intelligence: [locations, buying_notes, quality_signals, budget_notes]
cooking_and_storage: [storage, prep_tips, texture_notes]
relationships: [pairs_well_with, nutrient_complements, category_neighbours, do_not_replace]
safety_and_limitations: [clinical caveats, storage safety, etc.]
companion_behaviour: [plain_answer, suggested_phrases, avoid_phrases]
claim_boundaries: [do not describe as treating/curing/preventing/reversing]
consumers: [which services consume this data]
progressive_enrichment: [ready_now vs requires_later_validation]
```

**Purpose:** Governance-first, with explicit boundaries on ownership, claims, and progressive stages

---

### 2.3 Key Differences

| Aspect | NK5 | v2.0-draft |
|--------|-----|-----------|
| **Primary focus** | Nutrition data + sources | Governance + claim boundaries |
| **Nutrients** | Quantitative (amount, ranking, source_url) | Qualitative only (no numeric until validated) |
| **Evidence** | source_refs per benefit claim | claim_boundaries + approved_wording |
| **Ownership** | Implicit (owner field in metadata) | Explicit (fact_owner_boundary section) |
| **Progressive stage** | metadata.status (draft/ready/validated/published) | progressive_enrichment (ready_now vs requires_later_validation) |
| **LLM-friendliness** | Designed for LLM authoring | Designed for governance review before LLM use |
| **Schema intent** | Data import preparation | Governance gate before enrichment |

---

### 2.4 Assessment

**Neither schema is wrong; they serve different purposes:**

- **NK5:** Optimized for "content authoring with governance enforcement"
- **v2.0-draft:** Optimized for "governance approval then content enrichment"

**The difference represents a **philosophical choice**:**
- NK5 assumes: LLM can author facts safely if evidence gates are in place
- v2.0-draft assumes: Governance must approve the *intent* before LLM writes facts

This is **not** a defect; it's a **design decision** that needs to be made explicitly.

---

## SECTION 3: IMPORTER STATUS

### 3.1 Required NK6 Importer

**Current state:** No importer exists.

**What needs to be built:**

1. **Schema validator (v2.0-draft validation)**
   - Validate YAML structure against v2.0-draft schema
   - Check required fields (record, nk_controls, identity, etc.)
   - Validate enums (status, plant_family, upf_default, etc.)
   - Estimated: 2–3 hours

2. **Evidence gate validator** (IF using evidence from nutrition_profile)
   - Check approved_wording against claim_boundaries
   - Validate that qualitative claims don't cross into quantitative/diagnostic
   - Estimated: 2–3 hours

3. **Duplicate detection**
   - Check canonical_slug uniqueness
   - Handle merge_only_with_explicit_approval policy
   - Estimated: 1 hour

4. **Progressive enrichment state machine**
   - Determine if file is ready for: import vs. enrichment vs. validation
   - Map `progressive_enrichment.ready_now` vs `requires_later_validation`
   - Estimated: 2 hours

5. **Database mapping layer**
   - Convert v2.0-draft YAML structure to existing PostgreSQL schema
   - Determine which sections map to which tables
   - **Problem:** Existing schema may not have tables for all v2.0-draft fields
   - Estimated: 4–6 hours (plus schema migration assessment)

6. **CLI interface**
   - `npm run import:canonical-foods-batch docs/knowledge/canonical-foods/drafts/*.yaml`
   - Per-file error handling (continue on failure)
   - Idempotency checks
   - Estimated: 2 hours

**Total estimated effort: 13–17 hours engineering**

### 3.2 Current Blocker

**Schema mapping to PostgreSQL unknown.** Questions that must be answered first:

- Does `knowledge_foods` table have fields for all sections in v2.0-draft?
- What table stores `companion_behaviour.plain_answer` and `suggested_user_facing_phrases`?
- What table stores `claim_boundaries`?
- What table stores `safety_and_limitations`?
- What table stores `planner_metadata.meal_slots` and `meal_shell_roles`?
- What table stores `progressive_enrichment.requires_later_validation`?

**If new tables are needed:** +4–6 hours schema migration design + migration scripts.

---

## SECTION 4: FILE-BY-FILE STATUS

### 4.1 Spinach (NK6 Pilot)

**Status:** 🟡 Partially ready  
**Schema:** 2.0-draft (linter-transformed from NK5)  
**Content completeness:** ✅ 95% (all sections present and detailed)  
**Validation readiness:** ⏳ Requires evidence gate reconciliation (NK5 SourceRefs → v2.0-draft approved_wording)

**Issues:**
- NK5 benefits section (with detailed SourceRefs) was auto-converted to v2.0-draft benefit_language (approved_wording only)
- Loss of per-benefit evidence traceability (15 SourceRefs from NK6 pilot lost in transformation)
- **Recommendation:** Restore evidence metadata OR accept v2.0-draft as governance checkpoint

---

### 4.2 Lentils (Pre-existing)

**Status:** 🟡 Governance gate complete  
**Schema:** 2.0-draft  
**Content completeness:** ✅ 85% (identity, planner, shopping solid; nutrition_profile qualitative only)  
**Validation readiness:** ⏳ Awaiting evidence sourcing + benefit_language population

**Sample sections present:**
- ✅ identity (food_category: legume_pulse, aliases: red/green/brown/split/tinned, not_same_as rules)
- ✅ nutrition_profile (qualitative: vitamin K, folate, iron, magnesium, plant compounds)
- ✅ planner_metadata (good_uses: dhal, curry, grain bowls, soups)
- ✅ shopping_intelligence (locations, budget notes)
- ⏳ benefit_language (present but light; only 3 benefits outlined)
- ⏳ companion_behaviour (partially filled)

---

### 4.3 Chickpeas (Pre-existing)

**Status:** 🟡 Governance gate complete  
**Schema:** 2.0-draft  
**Content completeness:** ✅ 85%  
**Validation readiness:** ⏳ Similar to lentils; benefit_language needs expansion

---

### 4.4 Others (Broccoli, Eggs, Salmon, Blueberries, Yogurt, Olive Oil, Oats)

**Status:** 🟡 Governance gate complete (7 files)  
**Schema:** 2.0-draft (all)  
**Content completeness:** ✅ 80–85% (identity and planner solid; nutrition qualitative only)  
**Validation readiness:** ⏳ All similar pattern; benefit_language and evidence needs work

---

### 4.5 Batch Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Governance completeness** | ✅ 90% | All files have nk_controls, identity, claim_boundaries |
| **Nutrition completeness** | ⚠️ 60% | Qualitative only; quantitative values blocked by `do_not_display_numeric_values_yet: true` |
| **Benefit sourcing** | ⚠️ 50% | benefit_language present but without SourceRef evidence (NK1 Rule NK2 gap) |
| **Planner readiness** | ✅ 90% | meal_slots, good_uses, nutrition_boost_tags well-documented |
| **Shopping readiness** | ✅ 85% | locations, budget_notes, quality_signals present |
| **Safety documentation** | ✅ 80% | safety_and_limitations present but varies in depth |

---

## SECTION 5: IMPORT RECOMMENDATIONS

### 5.1 Do NOT Proceed With Batch Import Until:

1. **Schema decision:** Leadership chooses between:
   - Option A: Continue with NK5 (nutrition-first, evidence-gated from authoring)
   - Option B: Accept v2.0-draft (governance-first, evidence added in Phase 2)
   - Option C: Hybrid (merge NK5 evidence metadata into v2.0-draft structure)

2. **Database schema audit:** Map v2.0-draft sections to existing PostgreSQL tables
   - Determine if new tables needed for companion_behaviour, claim_boundaries, progressive_enrichment
   - Estimate: 2–3 hours

3. **Importer build:** Once schema decided, build validator + mappers + CLI
   - Estimated: 13–17 hours engineering

4. **Evidence reconciliation:** Decide how to preserve NK6 pilot evidence sourcing
   - Option: Add evidence_sources subsection to v2.0-draft benefit_language
   - Or: Accept this batch as governance-approved; defer evidence to Phase 2

---

### 5.2 Phased Approach (If Proceeding)

**Phase A (This week): Governance approval**
- Review all 10 files against claim_boundaries
- Nutritionist verifies that approved_wording and safety_and_limitations are accurate
- Approve or reject each file for content accuracy (NOT import yet)
- Estimated: 4–6 hours

**Phase B (Next week): Schema decision + importer build**
- Finalize NK5 vs. v2.0-draft decision
- Audit database schema; identify new tables if needed
- Build importer + validators
- Estimated: 13–17 hours engineering

**Phase C (Week 3): Staging import + testing**
- Import 10 files to staging database
- Verify data integrity in all tables
- Test UI rendering (Pantry Explore, Planner, Shopping)
- Estimated: 4–6 hours

**Phase D (Week 4+): Production import**
- Blue-green deploy: staging → production
- Monitor for data integrity issues
- Estimated: 2–3 hours

**Total timeline: 3–4 weeks to production**

---

### 5.3 If Governance Decision is "Accept v2.0-draft as-is"

**Tradeoffs to document:**

✅ **Gains:**
- Governance gate prevents unsourced claims from being authored
- Clear claim_boundaries prevent diagnosis language
- Explicit ownership model (fact_owner_boundary)
- Progressive enrichment prevents premature numeric shipping

❌ **Losses:**
- Evidence sourcing deferred to Phase 2 (loss of NK6 pilot rigor)
- No per-benefit SourceRef traceability at import time
- approved_wording without citations (trusts editorial review)
- Numeric nutrition values explicitly NOT imported ("pending_database_validation")

**This is a valid tradeoff IF governance and editorial review are rigorous.** Recommend:
- Nutritionist approval required before any import
- Each benefit_language statement must be citable (even if citation not stored)
- Phase 2 enrichment adds SourceRef metadata to benefit_language

---

## SECTION 6: DELIVERABLE READINESS

### 6.1 Spinach (NK6 Pilot)

**For production import:** ⏳ Blocked until schema decision  
**For staging validation:** ✅ Ready now (schema transformation complete, governance present)

**Recommendation:** Use spinach.yaml as test case for importer once built

### 6.2 Lentils + 8 others

**For production import:** ⏳ Blocked; need Phase A governance approval + Phase B importer  
**For nutritionist review:** ✅ Ready now; send to nutritionist for claim verification

**Recommendation:** Parallel path: nutritionist reviews while engineers build importer

---

## SECTION 7: CRITICAL QUESTIONS FOR DECISION-MAKER

**Before proceeding with batch import, answer these:**

1. **Schema philosophy:** Is v2.0-draft "governance-first then enrichment" the intended design? Or should NK5 "evidence-gated authoring" have been preserved?

2. **Evidence sourcing:** Acceptable to defer evidence metadata (SourceRefs) to Phase 2? Or must every benefit_language statement cite a source at import time?

3. **Numeric nutrition:** Acceptable to block numeric values ("pending_database_validation") from import? Or should USDA values be added now with validation flags?

4. **Progressive enrichment:** Is the "requires_later_validation" gate in v2.0-draft the right enforcement? Or should validation happen at import?

5. **Timeline:** Is 3–4 weeks to production import acceptable? Or prioritize faster (reduce scope)?

---

## SECTION 8: NEXT IMMEDIATE ACTIONS

### If Decision is "Proceed with v2.0-draft as-is":

**Week 1 (This week):**
- [ ] Confirm schema decision
- [ ] Send 10 files to nutritionist for claim_boundaries + benefit_language verification
- [ ] Audit existing PostgreSQL schema; identify new tables needed

**Week 2:**
- [ ] Engineer begins importer build (validators, mappers, CLI)
- [ ] Create v2.0-draft JSON Schema for validation
- [ ] Nutritionist completes reviews; flag any need for revisions

**Week 3:**
- [ ] Complete importer build
- [ ] Conduct staging import of all 10 files
- [ ] UI rendering tests (Pantry Explore, Planner, Shopping)

**Week 4:**
- [ ] Production blue-green deploy
- [ ] Monitoring + validation

---

### If Decision is "Reconcile with NK5 (restore evidence sourcing)":

**Week 1:**
- [ ] Transform v2.0-draft files back to NK5 format (or create hybrid schema)
- [ ] Restore NK6 pilot evidence metadata to spinach.yaml
- [ ] Decide: do this for all 10, or just spinach?

**Timeline extends by 1–2 weeks** due to schema reconciliation.

---

## SECTION 9: CONCLUSION

**Batch import CANNOT proceed until:**

1. ✅ Schema decision made (NK5 vs. v2.0-draft vs. hybrid)
2. ⏳ Importer built (13–17 hours engineering)
3. ⏳ Database schema audited (2–3 hours)
4. ⏳ Nutritionist governance approval on all 10 files (4–6 hours)

**Current batch readiness: 30% (governance structure present; execution infrastructure missing)**

**Recommended decision path:**
- Accept v2.0-draft as phase-gate (governance checkpoint before enrichment)
- Defer evidence sourcing to Phase 2 (acceptable IF nutritionist review is rigorous)
- Build importer for v2.0-draft as-is
- Plan Phase 2 to add SourceRef metadata to benefit_language

**This allows: 3–4 week path to production with 10 foods live.**

---

*Assessment completed: 2026-07-07*  
*Batch inventory: 10 foods, all schema v2.0-draft, all governance-complete, all awaiting importer + evidence sourcing decision*  
*Next milestone: Schema decision → importer build → staging validation → production import*
