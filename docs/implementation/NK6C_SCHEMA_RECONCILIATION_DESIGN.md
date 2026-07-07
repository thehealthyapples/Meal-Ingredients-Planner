# NK6C — Canonical Food Schema Reconciliation Design

**Decision:** Hybrid approach — v2.0-draft governance-first structure + NK5 evidence metadata  
**Date:** 2026-07-07  
**Status:** Design specification (no implementation yet)  
**Scope:** Smallest safe importer path for canonical-foods/drafts/ (10 foods)  
**Next phase:** Build importer per this design

---

## EXECUTIVE SUMMARY

**Hybrid schema unifies governance gates with evidence sourcing:**

- **Structure:** Keep v2.0-draft (governance-first, with claim_boundaries, progressive_enrichment)
- **Enhancement:** Add NK5-style evidence metadata to benefit_language, nutrition_profile, safety_and_limitations
- **Result:** Governance approval + evidence traceability in one schema
- **Importer scope:** Minimal — maps v2.0-draft hybrid YAML → 5 existing PostgreSQL tables + metadata store

**Timeline to importer ready:** This design document + signature decisions → engineering builds in parallel

---

## SECTION 1: HYBRID SCHEMA DESIGN

### 1.1 Design Principle: Add Evidence Without Restructuring

**Goal:** Preserve v2.0-draft governance structure (which is sound) while adding NK5 evidence metadata only where claims are made.

**Approach:** Add optional `evidence_sources` field to sections that make claims:
- `benefit_language[].evidence_sources`
- `nutrition_profile.notable_nutrients[].evidence_sources`
- `safety_and_limitations[].evidence_sources`
- `companion_behaviour.suggested_user_facing_phrases[].evidence_source_area`

This keeps v2.0-draft as the primary structure while layering evidence on top (not rewriting the schema).

---

### 1.2 Hybrid Schema Additions (Minimal)

#### 1.2.1 `benefit_language` Enhanced

**Current v2.0-draft:**
```yaml
benefit_language:
- area: plant_diversity
  approved_wording: Adds leafy-green diversity to the week.
  evidence_tone: high_level_consensus
```

**Hybrid v2.0-draft + NK5:**
```yaml
benefit_language:
- area: plant_diversity
  approved_wording: Adds leafy-green diversity to the week.
  evidence_tone: high_level_consensus
  
  # ADDED: NK5 evidence metadata (optional, for claims with sourcing)
  evidence_sources:
    - source_body: "NHS"
      source_title: "Plant diversity and micronutrient intake"
      source_url: "https://www.nhs.uk/..."
      evidence_level: "high_level_consensus"
      last_reviewed: "2026-06-15"
    - source_body: "BNF"
      source_title: "Dietary diversity and health outcomes"
      source_url: "https://www.nutrition.org.uk/"
      evidence_level: "high_level_consensus"
      last_reviewed: "2026-06-15"
  
  # Governance metadata (v2.0-draft style)
  governance_note: "Wording approved for use without diagnosis language."
```

---

#### 1.2.2 `nutrition_profile.notable_nutrients` Enhanced

**Current v2.0-draft:**
```yaml
nutrition_profile:
  notable_nutrients:
  - nutrient: vitamin K
    role: supports normal blood clotting and bone-related nutrition context
    confidence: well_established
```

**Hybrid v2.0-draft + NK5:**
```yaml
nutrition_profile:
  notable_nutrients:
  - nutrient: vitamin K
    role: supports normal blood clotting and bone-related nutrition context
    confidence: well_established
    
    # ADDED: NK5 sourcing (links to authoritative composition data)
    source_reference:
      body: "USDA"
      database: "FDC (Food Data Central)"
      url: "https://fdc.nal.usda.gov/fdc-app.html#/?query=spinach"
      last_updated: "2026-06-15"
    
    # ADDED: Quantitative pending metadata (lifecycle tracking)
    quantitative_pending:
      amount_per_100g: "483mcg (raw) or 141mcg (cooked)"
      serving_size_note: "Cooked reduces by ~70% due to water loss"
      bioavailability_note: "Fat-soluble; stable through cooking"
      validation_status: "pending_database_validation"
      approved_for_display: false  # v2.0-draft numeric_nutrition_policy
```

---

#### 1.2.3 `safety_and_limitations` Enhanced

**Current v2.0-draft:**
```yaml
safety_and_limitations:
- High vitamin K content may matter for people on warfarin; advise consistent intake and clinician guidance.
- Can be higher in oxalates; avoid making kidney-stone claims without clinical context.
```

**Hybrid v2.0-draft + NK5:**
```yaml
safety_and_limitations:
- statement: "High vitamin K content may matter for people on warfarin; advise consistent intake and clinician guidance."
  affected_population: "people_on_anticoagulants"
  
  # ADDED: NK5 evidence (why this safety note exists)
  evidence_sources:
    - source_body: "NHS"
      source_title: "Vitamin K and warfarin interaction"
      source_url: "https://www.nhs.uk/..."
      evidence_level: "well_established"
      last_reviewed: "2026-06-15"
  
  # Governance note
  claim_boundary: "Does not diagnose; provides context for clinician discussion."

- statement: "Can be higher in oxalates; avoid making kidney-stone claims without clinical context."
  affected_population: "people_with_kidney_disease_or_history"
  
  # ADDED: NK5 evidence
  evidence_sources:
    - source_body: "Peer-reviewed"
      source_title: "Oxalate content in spinach and mineral bioavailability"
      source_url: "https://pubmed.ncbi.nlm.nih.gov/..."
      evidence_level: "well_established"
      last_reviewed: "2026-06-15"
  
  claim_boundary: "Provides context; does not diagnose kidney disease."
```

---

#### 1.2.4 `companion_behaviour.suggested_user_facing_phrases` Enhanced

**Current v2.0-draft:**
```yaml
companion_behaviour:
  suggested_user_facing_phrases:
  - Add a handful of spinach
  - Leafy-green boost
  - Easy plant-diversity win
```

**Hybrid v2.0-draft + NK5:**
```yaml
companion_behaviour:
  suggested_user_facing_phrases:
  - phrase: "Add a handful of spinach"
    context: "Generic suggestion for meal addition"
    evidence_area: null  # No evidence required; actionable suggestion
    
  - phrase: "Leafy-green boost"
    context: "Nutrient density context"
    evidence_area: "micronutrient_density"  # Links to benefit_language area
    # Evidence inherited from benefit_language[area=micronutrient_density].evidence_sources
    
  - phrase: "Easy plant-diversity win"
    context: "Plant counting context"
    evidence_area: "plant_diversity"  # Links to benefit_language area
    # Evidence inherited from benefit_language[area=plant_diversity].evidence_sources
```

---

### 1.3 Hybrid Schema Versioning

**New version:** `schema_version: 2.1-hybrid`

**Rationale:** v2.0-draft is foundational; v2.1-hybrid layers evidence on top without breaking v2.0-draft structure.

**Backward compatibility:** v2.0-draft files without evidence_sources are still valid v2.1-hybrid (evidence_sources optional).

---

## SECTION 2: POSTGRESQL SCHEMA MAPPING

### 2.1 Current Tables (Existing)

Based on NK1/NK2/NK4 architecture, the canonical-foods import will map to these tables:

| Table | Current purpose | v2.1-hybrid input | Status |
|-------|---|---|---|
| `knowledge_foods` | Food identity | record.canonical_slug, identity.food_category, varieties_and_forms | ✅ Exists |
| `knowledge_food_nutrients` | Nutrients per food | nutrition_profile.notable_nutrients | ✅ Exists |
| `knowledge_food_benefits` | Benefits per food | benefit_language[] | ✅ Exists |
| `knowledge_nutrient_benefits` | Nutrient → benefit bridge | (derived from nutrition_profile + benefit_language) | ✅ Exists |
| `knowledge_source_refs` | Evidence citations | benefit_language[].evidence_sources, nutrition_profile.notable_nutrients[].source_reference | ✅ Likely exists |

---

### 2.2 Mapping Details: v2.1-hybrid → PostgreSQL

#### 2.2.1 `knowledge_foods` Table

| v2.1-hybrid field | PostgreSQL column | Notes |
|---|---|---|
| record.canonical_slug | slug (PK) | Unique identifier |
| record.display_name | name | Human-readable name |
| record.scientific_or_source_name | scientific_name | Lens culinaris, Spinacia oleracea, etc. |
| identity.food_category | category_id (FK → categories) | legume_pulse, leafy_green_vegetable, etc. |
| identity.plant_count_policy.counts_towards_plant_diversity | counts_towards_plant_diversity (bool) | true/false |
| identity.plant_count_policy.plant_family | plant_family | Fabaceae, Amaranthaceae, etc. |
| identity.plant_count_policy.plant_part | plant_part | seed, leaf, fruit, etc. |
| identity.aliases | aliases (JSON array) | Store as array or separate table |
| identity.not_same_as | not_same_as (JSON array) | Canonical slug exclusions |
| classification.whole_food_status | upf_classification | whole_or_minimally_processed, etc. |
| classification.upf_default | is_upf | Boolean or enum |
| varieties_and_forms.varieties | varieties (JSON) | baby spinach, mature spinach, etc. |
| varieties_and_forms.forms | forms (JSON) | fresh leaves, frozen, etc. |
| varieties_and_forms.preparation_states | preparation_states (JSON) | raw, cooked, wilted, etc. |
| nk_controls.governing_patterns | governance_patterns (JSON) | Store as array |
| record.status | import_status | draft, validated, published |
| progressive_enrichment.ready_now | enrichment_stage | Track what's ready |

**New columns (if not exists):**
- `governance_patterns` (JSON) — Store nk_controls governing patterns
- `enrichment_stage` (ENUM) — Track progressive enrichment state

---

#### 2.2.2 `knowledge_food_nutrients` Table

| v2.1-hybrid field | PostgreSQL column | Notes |
|---|---|---|
| nutrition_profile.notable_nutrients[].nutrient | nutrient_slug (FK) | vitamin_k, folate, iron, etc. |
| nutrition_profile.notable_nutrients[].role | nutrient_role | Qualitative description from v2.1-hybrid |
| nutrition_profile.notable_nutrients[].confidence | confidence_level | well_established, moderate, emerging |
| nutrition_profile.notable_nutrients[].source_reference.url | source_url | USDA FDC URL, etc. |
| nutrition_profile.notable_nutrients[].quantitative_pending.amount_per_100g | amount_pending_text | "483mcg (raw) or 141mcg (cooked)" |
| nutrition_profile.notable_nutrients[].quantitative_pending.validation_status | quantitative_validation_status | pending_database_validation |
| nutrition_profile.notable_nutrients[].quantitative_pending.approved_for_display | is_quantitative_approved | false (v2.0-draft policy) |

**Note:** Quantitative values NOT imported yet per v2.0-draft numeric_nutrition_policy. Only qualitative roles + pending metadata stored.

---

#### 2.2.3 `knowledge_food_benefits` Table

| v2.1-hybrid field | PostgreSQL column | Notes |
|---|---|---|
| benefit_language[].area | benefit_slug (FK) | plant_diversity, micronutrient_density, etc. |
| benefit_language[].approved_wording | benefit_wording | "Adds leafy-green diversity..." |
| benefit_language[].evidence_tone | evidence_tone | high_level_consensus, food_composition, etc. |
| benefit_language[].evidence_sources[] | source_refs (JSON or FK) | Array of {body, title, url, evidence_level, last_reviewed} |
| benefit_language[].governance_note | governance_note | "Wording approved for use without diagnosis language" |

---

#### 2.2.4 `knowledge_source_refs` Table (New or Existing)

| v2.1-hybrid field | PostgreSQL column | Notes |
|---|---|---|
| benefit_language[].evidence_sources[].source_body | source_body | EFSA, NHS, BNF, NIH-ODS, USDA, Peer-reviewed |
| benefit_language[].evidence_sources[].source_title | source_title | Full citation title |
| benefit_language[].evidence_sources[].source_url | source_url | HTTPS URL on trusted domain |
| benefit_language[].evidence_sources[].evidence_level | evidence_level | high_level_consensus, well_established, moderate, emerging |
| benefit_language[].evidence_sources[].last_reviewed | last_reviewed | ISO date; when nutritionist verified currency |

---

#### 2.2.5 `knowledge_food_safety_and_limitations` Table (New or Extends existing)

| v2.1-hybrid field | PostgreSQL column | Notes |
|---|---|---|
| safety_and_limitations[].statement | safety_statement | Full text of safety note |
| safety_and_limitations[].affected_population | affected_population | people_on_anticoagulants, people_with_kidney_disease, etc. |
| safety_and_limitations[].evidence_sources[] | source_refs (JSON) | Same as knowledge_source_refs format |
| safety_and_limitations[].claim_boundary | claim_boundary | "Does not diagnose; provides context for clinician discussion" |

---

### 2.3 Minimal PostgreSQL Changes

**New columns (if not existing):**
```sql
-- On knowledge_foods table:
ALTER TABLE knowledge_foods ADD COLUMN IF NOT EXISTS governance_patterns JSONB;
ALTER TABLE knowledge_foods ADD COLUMN IF NOT EXISTS enrichment_stage VARCHAR(50);
ALTER TABLE knowledge_foods ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100);

-- On knowledge_food_nutrients table:
ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS quantitative_validation_status VARCHAR(50);
ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS is_quantitative_approved BOOLEAN DEFAULT false;
ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS amount_pending_text TEXT;

-- On knowledge_food_benefits table:
ALTER TABLE knowledge_food_benefits ADD COLUMN IF NOT EXISTS source_refs JSONB;
ALTER TABLE knowledge_food_benefits ADD COLUMN IF NOT EXISTS governance_note TEXT;
```

**New tables (if not existing):**
```sql
-- If knowledge_food_safety_and_limitations doesn't exist:
CREATE TABLE knowledge_food_safety_and_limitations (
  id SERIAL PRIMARY KEY,
  food_slug VARCHAR(100) NOT NULL REFERENCES knowledge_foods(slug),
  statement TEXT NOT NULL,
  affected_population VARCHAR(100),
  source_refs JSONB,
  claim_boundary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(food_slug, statement)
);
```

**Estimated schema changes:** 1–2 hours DBA/engineering time

---

## SECTION 3: IMPORTER SPECIFICATIONS

### 3.1 Importer Scope (Minimal)

**What it does:**
1. Read v2.1-hybrid YAML files from knowledge/canonical-foods/drafts/
2. Validate against v2.1-hybrid schema
3. Map YAML fields to PostgreSQL columns
4. Insert records into 5–6 tables
5. Report per-file success/failure
6. Support idempotent reimport (upsert on slug)

**What it does NOT do:**
- Numeric nutrition validation (blocked by v2.0-draft policy)
- Database schema migrations (assume columns exist or prepared)
- UI rendering (separate concern)
- Evidence source URL validation (assumed pre-validated by nutritionist review)

---

### 3.2 Importer Architecture

**Three-layer architecture (minimal):**

#### Layer 1: Schema Validator
```
Input: YAML file
Process: 
  1. Parse YAML → JSON
  2. Validate against v2.1-hybrid JSON Schema
  3. Check required fields per record.status
  4. Verify enum values (food_category, evidence_level, etc.)
Output: Validation report or validated JSON
```

#### Layer 2: Mapper
```
Input: Validated v2.1-hybrid JSON
Process:
  1. Normalize field names (v2.1-hybrid → PostgreSQL column names)
  2. Resolve foreign keys (food_category → category_id, nutrient → nutrient_slug, benefit → benefit_slug)
  3. Serialize nested structures (aliases, evidence_sources as JSON/arrays)
Output: Normalized record ready for insert
```

#### Layer 3: Database Writer
```
Input: Normalized record
Process:
  1. Check for duplicates (slug uniqueness per duplicate_policy)
  2. Insert or update (upsert) into knowledge_foods
  3. Insert related nutrients, benefits, safety records
  4. Link evidence_sources via foreign keys
  5. Handle cascade deletes if needed
Output: Import result (success/failure, row counts, errors)
```

---

### 3.3 Importer Decisions (Small, Safe)

**Decision 1: Duplicate handling**
- Policy (from v2.0-draft): `duplicate_policy: stop_on_slug_conflict_or_merge_only_with_explicit_approval`
- Implementation: Reject file if slug already exists; require explicit `--force-merge` flag
- Rationale: Safety-first; prevent accidental overwrites

**Decision 2: Quantitative values**
- Policy (from v2.0-draft): `do_not_import_numeric_values_until validated against the project-approved nutrition database`
- Implementation: Store as `amount_pending_text` (text), NOT as numeric columns; set `is_quantitative_approved: false`
- Rationale: Phase 2 enrichment will add numeric validation

**Decision 3: Evidence validation**
- Policy (from NK5): Source URLs must be on trusted domains (NHS, EFSA, BNF, NIH-ODS, USDA, Peer-reviewed)
- Implementation: Validator checks URL domain against whitelist; warn (not fail) if untrusted
- Rationale: Nutritionist review should have caught this; warn for audit trail

**Decision 4: Progressive enrichment tracking**
- From v2.0-draft: `progressive_enrichment.ready_now` vs `requires_later_validation`
- Implementation: Import both sections as metadata; set `enrichment_stage` based on `requires_later_validation` fields
- Rationale: Track what's Phase 0 ready vs. Phase 2 pending

---

### 3.4 Importer CLI Interface (Minimal)

```bash
# Validate a single file (dry-run)
npm run canonical-foods:validate docs/knowledge/canonical-foods/drafts/spinach.yaml

# Validate all files in batch
npm run canonical-foods:validate docs/knowledge/canonical-foods/drafts/*.yaml

# Import to staging database (dry-run)
npm run canonical-foods:import docs/knowledge/canonical-foods/drafts/spinach.yaml --env staging --dry-run

# Import to staging database (execute)
npm run canonical-foods:import docs/knowledge/canonical-foods/drafts/spinach.yaml --env staging

# Import all files in batch
npm run canonical-foods:import docs/knowledge/canonical-foods/drafts/*.yaml --env staging

# Import with force-merge (override duplicate check)
npm run canonical-foods:import docs/knowledge/canonical-foods/drafts/spinach.yaml --env staging --force-merge

# Generate import report (what would happen without changing DB)
npm run canonical-foods:report docs/knowledge/canonical-foods/drafts/*.yaml
```

---

## SECTION 4: EVIDENCE METADATA GAP ANALYSIS

### 4.1 Current State: Evidence Gaps in 10 Files

| Food | benefit_language | evidence_sources | Status | Gap |
|------|---|---|---|---|
| Spinach | 3–5 areas | ⚠️ 0% (linter-removed NK6 SourceRefs) | Draft | HIGH — lost during transformation |
| Lentils | 3–4 areas | ⚠️ 10% (sparse) | Draft | HIGH — needs full sourcing |
| Chickpeas | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Broccoli | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Eggs | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Salmon | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Blueberries | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Yogurt | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Olive Oil | 3–4 areas | ⚠️ 10% | Draft | HIGH |
| Oats | 3–4 areas | ⚠️ 10% | Draft | HIGH |

**Average coverage:** ~10% of benefit areas have evidence_sources; 90% gap

---

### 4.2 Evidence Gap Remediation Plan

**Option A: Pre-sourcing before import (Recommended for Phase 0)**
- Nutritionist batch-sources evidence for all 10 foods
- Adds evidence_sources sections to benefit_language before import
- Timeline: 2–3 weeks (nutritionist 16–24 hours work)
- Importer imports complete v2.1-hybrid files
- Result: Phase 0 imports with full evidence traceability

**Option B: Import now, source in Phase 2**
- Import 10 files as-is (with 90% evidence gap)
- Track as `requires_later_validation: evidence_sourcing`
- Phase 2 enrichment adds evidence_sources via secondary import/update
- Timeline: Faster to initial import (days), but Phase 2 rework needed
- Risk: Users see benefit_language without evidence trail initially

**Recommendation:** **Option A** — Pre-source before import. Aligns with NK1 Rule NK2 (evidence-backed claims). Minimal delay (2–3 weeks) saves Phase 2 rework.

---

### 4.3 Evidence Sourcing Template (For Nutritionist)

**Per-benefit sourcing task:**
```
Benefit area: "plant_diversity"
Food: Spinach

Current approved_wording: "Adds leafy-green diversity to the week."

Find and verify ≥1 trusted source:
  ☐ NHS guidance on plant diversity
  ☐ EFSA claim on dietary diversity
  ☐ BNF documentation on plant counting
  ☐ Peer-reviewed research on plant diversity benefits

Record for each source:
  - source_body: [EFSA/NHS/BNF/NIH-ODS/USDA/Peer-reviewed]
  - source_title: [Full citation]
  - source_url: [https URL]
  - evidence_level: [high_level_consensus/well_established/moderate/emerging]
  - last_reviewed: [ISO date verified]

Add to benefit_language[area=plant_diversity].evidence_sources[]
```

**Estimated effort:** 2 hours per food (10 foods × 2 = 20 hours total)

---

## SECTION 5: DATA IMPACT ASSESSMENT

### 5.1 Row Counts (Projected)

**Assuming 10 foods imported with full evidence sourcing:**

| Table | Rows per food | Total (10 foods) | Impact |
|---|---|---|---|
| knowledge_foods | 1 | 10 | Minimal; additive |
| knowledge_food_nutrients | 5–8 (avg 6.5) | 65 | Moderate; growth expected |
| knowledge_food_benefits | 3–5 (avg 4) | 40 | Moderate; within expected capacity |
| knowledge_source_refs | 15–25 per food (avg 18) | 180 | Significant; ~180 new evidence citations |
| knowledge_food_safety_and_limitations | 1–3 (avg 2) | 20 | Minimal; new table |

**Total new rows:** ~315 rows across 5 tables

**Storage impact:** ~2 MB (conservative estimate; mostly JSON/text fields)

**Database performance impact:** Negligible (10 foods << thousands of expected canonical foods)

---

### 5.2 Backward Compatibility

**Existing queries/code:**
- All new columns are nullable or have defaults
- All new tables are optional (outer joins only)
- No breaking schema changes
- Existing planner/shopping services continue to work (use existing columns)

**Risk level:** LOW

---

## SECTION 6: IMPLEMENTATION ROADMAP

### 6.1 Immediate (This Week): Design Approval

**Deliverable:** This document  
**Decision needed:** Approve v2.1-hybrid schema + PostgreSQL mapping + importer approach  
**Stakeholders:** Product, Engineering, Nutritionist

**Approval gates:**
- [ ] Schema reconciliation decision (v2.1-hybrid approved)
- [ ] PostgreSQL mapping reviewed by DBA/Engineering
- [ ] Importer scope accepted (minimal, 3-layer architecture)
- [ ] Evidence gap remediation plan approved (Option A: pre-source before import)

---

### 6.2 Week 1 (Next): Pre-sourcing & Schema Prep

**Parallel track 1: Nutritionist Pre-sourcing**
- Batch-source evidence for all 10 foods
- Populate evidence_sources sections in YAML files
- Estimated: 20 hours nutritionist time

**Parallel track 2: Engineering Schema Prep**
- Review existing PostgreSQL schema
- Prepare column additions (ALTER TABLE statements)
- Create knowledge_food_safety_and_limitations table if needed
- Estimated: 2–3 hours DBA time

---

### 6.3 Week 2: Importer Build

**Build:** 3-layer importer per Section 3.2  
**Estimated:** 12–16 hours engineering time

**Deliverables:**
1. v2.1-hybrid JSON Schema (validation spec)
2. Schema validator (parse + validate)
3. Mapper (YAML → PostgreSQL)
4. Database writer (insert/upsert logic)
5. CLI interface (6 commands per Section 3.4)
6. Unit tests (validation, mapping, edge cases)

---

### 6.4 Week 3: Staging Import & Testing

**Import:** All 10 files to staging database  
**Testing:**
- Validate data integrity (row counts, FK relationships)
- Verify UI rendering (Pantry Explore shows foods correctly)
- Spot-check evidence sourcing (random sample)

**Estimated:** 4–6 hours engineering + QA

---

### 6.5 Week 4: Production Import

**Pre-deploy:**
- Final nutritionist sign-off on imported data
- Database backup/snapshot
- Deployment plan (blue-green or rolling)

**Deploy:** All 10 foods to production  
**Post-deploy:** Monitoring for errors, user feedback

**Estimated:** 2–3 hours engineering + ops

---

## SECTION 7: NEXT PROMPT FOR IMPORTER BUILD

### 7.1 Prompt for Engineering (To build importer)

```
TASK: Build canonical food importer per NK6C hybrid schema design

INPUTS:
1. v2.1-hybrid YAML schema spec (Section 1.2 of this document)
2. PostgreSQL mapping (Section 2)
3. Importer architecture (Section 3.2)
4. CLI interface spec (Section 3.4)

REQUIREMENTS:
1. Schema validator
   - Parse YAML → JSON
   - Validate against v2.1-hybrid JSON Schema
   - Check required fields per record.status
   - Verify enum values (food_category, evidence_level, etc.)
   - Report validation errors clearly

2. Mapper
   - Normalize v2.1-hybrid field names → PostgreSQL columns
   - Resolve foreign keys (food_category → category_id)
   - Serialize nested structures (aliases, evidence_sources as JSON)

3. Database writer
   - Slug uniqueness check per duplicate_policy
   - Upsert logic (insert or update on slug)
   - Insert related nutrients, benefits, safety records
   - Link evidence_sources via FK
   - Transaction safety (all-or-nothing per file)

4. CLI interface
   - 6 commands (validate, validate-batch, import, import-batch, import-merge, report)
   - Dry-run support
   - Per-file error handling (continue on failure)
   - Idempotency (can reimport same file safely)

CONSTRAINTS:
- Do not import numeric nutrition values (blocked by v2.0-draft policy)
- Do not validate evidence source URLs (assumed pre-validated by nutritionist)
- Assume PostgreSQL schema exists (from Section 2.3); no migrations

DELIVERABLES:
1. Importer code (src/server/lib/canonical-food-importer.ts or similar)
2. JSON Schema for v2.1-hybrid (validation spec)
3. Unit tests (validation, mapping, edge cases)
4. CLI commands (package.json scripts)
5. Implementation notes (what was built, assumptions, limitations)

ESTIMATE: 12–16 hours engineering time

NEXT STEP: After build complete, run importer on 10 files to staging database
```

---

## SECTION 8: SIGNATURE DECISIONS (Confirm These)

**Before proceeding to Week 1 pre-sourcing + Week 2 importer build, confirm:**

### Decision 1: Evidence Sourcing Timing
- [ ] **Approve Option A:** Pre-source evidence before import (2–3 weeks, clean Phase 0)
- [ ] **Approve Option B:** Import now with 90% evidence gap, source in Phase 2 (faster, rework later)
- [ ] **Other:** (specify)

### Decision 2: Numeric Nutrition Policy
- [ ] **Confirm:** Do NOT import numeric values yet (store as text in `amount_pending_text`, Phase 2 sourcing)
- [ ] **Change:** Import numeric values with validation flags (requires Phase 2 nutrition DB work)

### Decision 3: Evidence URL Validation
- [ ] **Confirm:** Do NOT validate source URLs at import time (trust nutritionist pre-review)
- [ ] **Change:** Validate URLs against trusted domain whitelist (adds ~1 hour to importer)

### Decision 4: Duplicate Handling
- [ ] **Confirm:** Reject on slug conflict; require `--force-merge` flag to override
- [ ] **Change:** Auto-merge silently (risky; not recommended)

### Decision 5: PostgreSQL Schema Migration
- [ ] **Confirm:** Assume columns exist; DBA prepared (Section 2.3 ALTER TABLE statements)
- [ ] **Change:** Importer runs migrations automatically (adds complexity; ~4 hours)

---

## SECTION 9: DELIVERABLES CHECKLIST

**This design document provides:**

✅ **Schema mapping recommendation** (Section 2: v2.1-hybrid → PostgreSQL)  
✅ **Importer changes needed** (Section 3: 3-layer architecture, CLI interface)  
✅ **Evidence metadata gap** (Section 4: 90% gap, Option A pre-sourcing plan)  
✅ **Data impact** (Section 5: ~315 rows, LOW risk)  
✅ **Implementation report path** (Section 6: 4-week roadmap)  
✅ **Next prompt to build importer** (Section 7: detailed engineering brief)  

**Signature decisions needed** (Section 8: 5 decisions to confirm)

---

## SECTION 10: SUMMARY FOR DECISION-MAKER

**Hybrid v2.1-hybrid approach is sound and minimal:**

1. **Structure:** Keep v2.0-draft governance; layer NK5 evidence on top
2. **Importer:** 3-layer (validator → mapper → writer), ~13–16 hours engineering
3. **Schema changes:** Minimal (5 new columns, 1 new table)
4. **Timeline:** 
   - Week 1: Pre-sourcing (20 hrs nutritionist) + schema prep (2–3 hrs DBA)
   - Week 2: Importer build (12–16 hrs engineering)
   - Week 3: Staging testing (4–6 hrs)
   - Week 4: Production import (2–3 hrs)
   - **Total: 4 weeks to 10 foods live**

5. **Evidence gap:** Recommend pre-source before import (clean Phase 0, avoids Phase 2 rework)

6. **Risk level:** LOW (backward compatible, additive, tested on staging first)

**Ready to proceed? Confirm signature decisions (Section 8) → Schedule Week 1 pre-sourcing → Schedule importer build Week 2.**

---

*Design completed: 2026-07-07*  
*Next phase: Engineering builds importer per Section 7 prompt*  
*Next milestone: Importer ready → 10 foods to staging database → production import*
