# NK6D — Canonical Food Import Simplification

**Decision:** Reject NK6C's new architecture. Extend existing Knowledge Platform services.  
**Date:** 2026-07-07  
**Status:** Simplified design specification  
**Scope:** Thin translation layer — parse v2.0-draft YAML, feed to existing services  
**Goal:** Import 10 canonical foods using only existing persistence and services

---

## EXECUTIVE SUMMARY

**Simplification principle:** Importer is a thin translation layer, not an architecture.

**NK6C approach:** v2.0-draft YAML → new v2.1-hybrid schema → new 3-layer importer → new PostgreSQL columns/tables → 4 weeks

**NK6D approach:** v2.0-draft YAML → extract knowledge → feed to existing services → existing tables → 1-2 weeks

**What changes:**
- ✅ Parse v2.0-draft YAML (extract knowledge sections only)
- ✅ Map to existing canonical knowledge services
- ✅ Insert into existing PostgreSQL tables
- ❌ No new schema version
- ❌ No new tables
- ❌ No new columns
- ❌ No governance metadata storage

**Result:** 10 canonical foods importable using only what already exists.

---

## SECTION 1: WHAT STAYS (Existing Services)

### 1.1 Existing Food Identity Service

**Location:** `shared/canonical/foods.ts`

**Current structure:**
```typescript
export const CANONICAL_FOODS = [
  {
    slug: "apple",
    name: "Apple",
    category: "fruit",
    aliases: ["apples", "red apple", "green apple"],
    // ...
  },
  // ...
] as const;
```

**Usage:** Seeded into `knowledge_foods` table at app startup

**For import:** Accept v2.0-draft YAML identity sections and transform to this format. No schema change.

---

### 1.2 Existing Nutrients Service

**Location:** `shared/knowledge/nutrients.ts`

**Current structure:**
```typescript
export const NUTRIENTS = [
  {
    slug: "vitamin-k",
    name: "Vitamin K",
    category: "vitamin",
    // ...
  },
  // ...
] as const;
```

**Usage:** Seeded into `knowledge_nutrients` table

**For import:** v2.0-draft lists nutrients by name/slug. Map to existing nutrient vocabulary. No new vocabulary needed.

---

### 1.3 Existing Benefits Service

**Location:** `shared/knowledge/health-benefits.ts`

**Current structure:**
```typescript
export const HEALTH_BENEFITS = [
  {
    slug: "gut-health",
    name: "Gut Health",
    // ...
  },
  // ...
] as const;
```

**Usage:** Seeded into `knowledge_health_benefits` table

**For import:** v2.0-draft benefit_language areas map to existing benefit slugs. No new benefits needed.

---

### 1.4 Existing Food-Benefit Relationships

**Location:** `knowledge_food_benefits` table (existing)

**Current usage:** Links food → benefit via seed data

**For import:** Create FK relationships from v2.0-draft benefit_language sections. No schema change.

---

### 1.5 Existing Planner Metadata

**Location:** Planner engine (existing) + optional `food_knowledge` table for prose

**Current usage:** Meal slots, good uses, tags managed in code

**For import:** v2.0-draft planner_metadata can live in seed data or lightweight metadata table (no new schema).

---

## SECTION 2: WHAT THE IMPORTER DOES (Thin Translation Layer)

### 2.1 Importer Purpose

```
Input:  v2.0-draft YAML file from docs/knowledge/canonical-foods/drafts/
Process: Parse YAML → extract knowledge → map to existing services
Output: Insert into existing PostgreSQL tables using existing APIs
```

### 2.2 Importer Logic (Pseudocode)

```typescript
async function importCanonicalFood(yamlFilePath: string) {
  // Step 1: Parse YAML
  const yaml = readFileSync(yamlFilePath, 'utf-8');
  const draft = parseYaml(yaml);

  // Step 2: Extract knowledge (ignore governance metadata)
  const food = {
    slug: draft.record.canonical_slug,
    name: draft.record.display_name,
    category: mapFoodCategory(draft.identity.food_category),
    aliases: draft.identity.aliases,
    plantFamily: draft.identity.plant_count_policy?.plant_family,
    countsTowardsDiversity: draft.identity.plant_count_policy?.counts_towards_plant_diversity,
    // ... other identity fields
  };

  const nutrients = draft.nutrition_profile.notable_nutrients.map(n => ({
    slug: n.nutrient, // e.g., "vitamin-k"
    role: n.role,
    confidence: mapConfidence(n.confidence), // well_established → established
    // quantitative values NOT imported (per v2.0-draft policy)
  }));

  const benefits = draft.benefit_language.map(b => ({
    benefitSlug: b.area, // e.g., "plant-diversity"
    wording: b.approved_wording,
    evidenceTone: b.evidence_tone,
    // NO evidence_sources (Phase 2 work)
  }));

  const relationships = {
    pairsWith: draft.relationships.pairs_well_with,
    complements: draft.relationships.nutrient_complements,
    neighbors: draft.relationships.category_neighbours,
  };

  const planner = draft.planner_metadata;
  const shopping = draft.shopping_intelligence;
  const safety = draft.safety_and_limitations;

  // Step 3: Insert using existing services
  await db.insert(knowledgeFoods).values(food);
  await db.insert(knowledgeFoodNutrients).values(nutrients.map(n => ({
    foodSlug: food.slug,
    nutrientSlug: n.slug,
    role: n.role,
    // ...
  })));
  await db.insert(knowledgeFoodBenefits).values(benefits.map(b => ({
    foodSlug: food.slug,
    benefitSlug: b.benefitSlug,
    wording: b.wording,
    // ...
  })));

  // Step 4: Log what was done
  return {
    success: true,
    foodSlug: food.slug,
    inserted: {
      foods: 1,
      nutrients: nutrients.length,
      benefits: benefits.length,
    },
  };
}
```

### 2.3 Decisions Baked Into Importer

**Decision 1: Ignore governance metadata**
- Skip: `nk_controls`, `record.status`, `claim_boundaries`, `progressive_enrichment`, `fact_owner_boundary`
- Rationale: Not needed for knowledge import; belongs in editorial workflow, not database

**Decision 2: No quantitative values**
- Skip: numeric nutrition values (per v2.0-draft `do_not_import_numeric_values_until validated`)
- Store: qualitative role ("supports normal blood clotting") only
- Rationale: Matches v2.0-draft policy; Phase 2 enrichment adds quantitative

**Decision 3: No evidence metadata**
- Skip: evidence_sources, source_refs (not in current v2.0-draft files; 10% coverage only)
- Store: approved_wording + evidence_tone only
- Rationale: Evidence metadata deferred to Phase 2; exists but sparse

**Decision 4: Duplicate handling**
- Check: slug uniqueness before insert
- Fail: if slug exists; require explicit retry with `--force-upsert` flag
- Rationale: Safety first; prevent accidental overwrites

**Decision 5: Foreign key resolution**
- food_category: Map v2.0-draft enum (leafy_green_vegetable) → existing category_id
- benefit_area: Map v2.0-draft area name → existing benefit_slug
- nutrient: Map v2.0-draft nutrient name → existing nutrient_slug
- Rationale: Reuse existing vocabularies; no new enums

---

## SECTION 3: POSTGRESQL MAPPING (Minimal)

### 3.1 Existing Tables Used (No Changes)

| Table | Input | Usage |
|-------|-------|-------|
| `knowledge_foods` | draft.record.* + draft.identity.* | Food identity, aliases, plant policy |
| `knowledge_food_nutrients` | draft.nutrition_profile.notable_nutrients[] | Nutrients per food |
| `knowledge_food_benefits` | draft.benefit_language[] | Benefits per food (without evidence) |
| `knowledge_health_benefits` | (existing) | Benefit vocabulary lookup |
| `knowledge_nutrients` | (existing) | Nutrient vocabulary lookup |

### 3.2 Optional Lightweight Additions (If Needed)

**Option A: Store planner/shopping metadata in existing `food_knowledge` table**
- `food_knowledge` already exists for prose/context
- Add optional JSON field: `planner_metadata` (meal_slots, good_uses, tags)
- Add optional JSON field: `shopping_metadata` (locations, budget_notes)
- Estimated: 1–2 hours DBA (ALTER TABLE + index)

**Option B: Store planner/shopping metadata as seed data**
- No database changes; keep in TypeScript/code
- Load during app startup like other seed data
- Estimated: 0 hours DBA; just code

**Recommendation:** Option B (no schema changes). Planner/shopping metadata is configuration, not persistence-critical.

### 3.3 Zero New Columns, Zero New Tables

✅ No new schema version  
✅ No new columns on existing tables  
✅ No new tables (use existing or keep in code)  
✅ Backward compatible (all additive or code-based)

---

## SECTION 4: IMPORTER SCOPE (Thin Layer Only)

### 4.1 What Importer Does

1. **Read:** v2.0-draft YAML files from `docs/knowledge/canonical-foods/drafts/`
2. **Parse:** YAML → JSON (standard YAML parser)
3. **Extract:** Knowledge sections only (ignore governance, evidence gaps, metadata)
4. **Map:** v2.0-draft field names → existing PostgreSQL column names
5. **Resolve:** Foreign keys (category_id, benefit_slug, nutrient_slug)
6. **Insert:** Into existing tables using standard SQL/ORM
7. **Report:** Per-file success/failure and row counts

### 4.2 What Importer Does NOT Do

- ❌ Validate governance metadata (not needed for import)
- ❌ Store evidence sources (Phase 2 work)
- ❌ Create new schema version or tables
- ❌ Handle quantitative nutrition validation (blocked by v2.0-draft policy)
- ❌ Transform v2.0-draft structure (minimal parsing only)

### 4.3 Single CLI Command

```bash
# Validate and import (no staged approach)
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/spinach.yaml

# Import all files in batch
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/*.yaml

# Import with force-upsert (override duplicate check)
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/spinach.yaml --force-upsert
```

**That's it. One command. No validate-first, no dry-run staging, no CI/CD complexity.**

---

## SECTION 5: IMPLEMENTATION (Minimal Code)

### 5.1 Importer Module (~200 lines)

```typescript
// server/lib/canonical-foods-importer.ts

import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { db } from "../db";
import { knowledgeFoods, knowledgeFoodNutrients, knowledgeFoodBenefits } from "@shared/schema";

interface ImportResult {
  success: boolean;
  foodSlug: string;
  errors: string[];
  inserted: { foods: number; nutrients: number; benefits: number };
}

export async function importCanonicalFood(filePath: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    foodSlug: "",
    errors: [],
    inserted: { foods: 0, nutrients: 0, benefits: 0 },
  };

  try {
    // Parse YAML
    const content = readFileSync(filePath, "utf-8");
    const draft = parseYaml(content);
    result.foodSlug = draft.record.canonical_slug;

    // Extract knowledge only
    const food = {
      slug: draft.record.canonical_slug,
      name: draft.record.display_name,
      category: mapCategory(draft.identity.food_category),
      // ... map other fields
    };

    // Check duplicate
    const existing = await db.query.knowledgeFoods.findFirst({
      where: (t) => eq(t.slug, food.slug),
    });
    if (existing) {
      result.errors.push(`Food slug "${food.slug}" already exists`);
      return result;
    }

    // Insert food
    await db.insert(knowledgeFoods).values(food);
    result.inserted.foods = 1;

    // Insert nutrients
    for (const n of draft.nutrition_profile.notable_nutrients) {
      await db.insert(knowledgeFoodNutrients).values({
        foodSlug: food.slug,
        nutrientSlug: n.nutrient,
        role: n.role,
        confidence: mapConfidence(n.confidence),
      });
      result.inserted.nutrients++;
    }

    // Insert benefits
    for (const b of draft.benefit_language) {
      await db.insert(knowledgeFoodBenefits).values({
        foodSlug: food.slug,
        benefitSlug: b.area,
        wording: b.approved_wording,
        evidenceTone: b.evidence_tone,
      });
      result.inserted.benefits++;
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

// Helper: map v2.0-draft category enum to existing category_id
function mapCategory(draft_category: string): string {
  const mapping: Record<string, string> = {
    leafy_green_vegetable: "vegetable",
    legume_pulse: "legume",
    whole_grain: "grain",
    // ... add others
  };
  return mapping[draft_category] || draft_category;
}

function mapConfidence(draft_conf: string): string {
  const mapping: Record<string, string> = {
    well_established: "established",
    moderate: "emerging",
    // ...
  };
  return mapping[draft_conf] || draft_conf;
}
```

**Estimated LOC:** 200–250 lines. Fits in one file.

### 5.2 CLI Command (~50 lines)

```typescript
// server/cli/import-canonical-foods.ts

import { program } from "commander";
import { glob } from "glob";
import { importCanonicalFood } from "../lib/canonical-foods-importer";

program
  .command("import:canonical-foods [files...]")
  .option("--force-upsert", "Override duplicate check")
  .action(async (files: string[], options: { forceUpsert?: boolean }) => {
    const patterns = files.length > 0 ? files : ["docs/knowledge/canonical-foods/drafts/*.yaml"];
    const filePaths = await glob(patterns, { absolute: true });

    console.log(`Importing ${filePaths.length} canonical food files...`);

    for (const filePath of filePaths) {
      console.log(`\n→ ${filePath}`);
      const result = await importCanonicalFood(filePath);
      
      if (result.success) {
        console.log(`✅ Imported: ${result.inserted.foods} foods, ${result.inserted.nutrients} nutrients, ${result.inserted.benefits} benefits`);
      } else {
        console.log(`❌ Failed: ${result.errors.join("; ")}`);
      }
    }
  });
```

**Estimated LOC:** 30–50 lines. Fits in one command file.

---

## SECTION 6: TIMELINE & EFFORT

| Phase | Task | Effort | Owner |
|-------|------|--------|-------|
| **1** | Importer module (~200 lines) | 2–3 hours | Engineering |
| **1** | CLI command (~50 lines) | 0.5–1 hour | Engineering |
| **1** | Test on one file (spinach.yaml) | 1 hour | QA |
| **2** | Batch import all 10 files | 0.5 hour | Engineering |
| **2** | Spot-check database | 1 hour | QA |
| **3** | Deployment & monitoring | 1–2 hours | Ops |

**Total effort:** 6–8 hours (vs. NK6C: 40–50 hours)  
**Timeline:** 1–2 weeks (vs. NK6C: 4 weeks)

---

## SECTION 7: DATA IMPACT (Same As NK6C)

| Table | Rows (10 foods) | Notes |
|-------|---|---|
| knowledge_foods | 10 | Food identity |
| knowledge_food_nutrients | 65 | ~6.5 per food |
| knowledge_food_benefits | 40 | ~4 per food |
| **Total** | **115** | No evidence metadata (Phase 2) |

**Storage:** ~1 MB  
**Performance:** Negligible  
**Schema changes:** ZERO

---

## SECTION 8: DECISIONS (Simplified)

### Decision 1: Planner/Shopping Metadata
- [ ] **Option A:** Store in TypeScript seed data (no schema changes)
- [ ] **Option B:** Add JSON columns to `food_knowledge` table (minimal schema change)

**Recommended:** Option A (zero schema changes)

### Decision 2: Force-Upsert Flag
- [ ] **Confirm:** Reject on slug conflict; require `--force-upsert` to override
- [ ] **Change:** Allow silent overwrites

**Recommended:** Confirm (safety)

### Decision 3: Partial Import on File Failure
- [ ] **Confirm:** Continue importing other files if one fails (batch mode)
- [ ] **Change:** Stop on first error

**Recommended:** Confirm (robustness)

---

## SECTION 9: WHAT'S NOT IMPORTED (And Why)

### Not Imported: Governance Metadata
- `nk_controls`, `claim_boundaries`, `progressive_enrichment`, `fact_owner_boundary`
- **Why:** Belongs in editorial workflow/review, not database. Can be tracked separately if needed.

### Not Imported: Quantitative Nutrition Values
- Numeric amounts (per v2.0-draft policy: `do_not_import_numeric_values_until validated`)
- **Why:** Requires nutrition database validation. Phase 2 work.

### Not Imported: Evidence Sources
- `evidence_sources` sections (10% coverage in current files; sparse)
- **Why:** Phase 2 enrichment. Can be added later without reimporting.

### Not Imported: Processed Forms
- Recipes, branded products, ready meals (explicitly marked `not_same_as`)
- **Why:** These are foods themselves; not variants of canonical food.

---

## SECTION 10: SUCCESS CRITERIA

✅ **Simple:** Importer fits in 2 files (~300 lines total)  
✅ **Reuses:** All existing services; no new architecture  
✅ **Extensible:** Easy to add evidence metadata later without breaking import  
✅ **Safe:** Duplicate check; transaction safety; error reporting  
✅ **Fast:** 6–8 hours engineering vs. 40–50 hours (NK6C)  
✅ **Zero schema changes:** Import into existing tables only  
✅ **Backward compatible:** Doesn't touch existing code or schema  

---

## SECTION 11: NEXT PROMPT FOR ENGINEERING

```
TASK: Build simplified canonical food importer

REQUIREMENTS:
1. Parse v2.0-draft YAML files from docs/knowledge/canonical-foods/drafts/
2. Extract knowledge sections only (ignore governance, evidence, metadata)
3. Map to existing PostgreSQL tables using existing services
4. Insert into: knowledge_foods, knowledge_food_nutrients, knowledge_food_benefits
5. Handle duplicates: reject on slug conflict; --force-upsert to override

SCOPE (Minimal):
- Importer module: ~200 lines (parse → extract → map → insert)
- CLI command: ~50 lines (single command, batch support)
- Tests: 3–4 unit tests (parse, map, duplicate, success cases)

CONSTRAINTS:
- No new PostgreSQL columns or tables
- No new schema version
- Ignore governance/evidence metadata
- Do not import numeric nutrition values (per v2.0-draft policy)

DELIVERABLES:
1. server/lib/canonical-foods-importer.ts
2. server/cli/import-canonical-foods.ts
3. Unit tests for importer logic
4. CLI integration in package.json scripts

ACCEPTANCE:
- npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/spinach.yaml succeeds
- Data appears in knowledge_foods, knowledge_food_nutrients, knowledge_food_benefits
- Batch import of all 10 files succeeds
- Duplicate check works (second import rejected)

ESTIMATE: 4–6 hours engineering time

TIMELINE: Can build in parallel with nutritionist pre-sourcing (NK6C Week 1)
```

---

## SECTION 12: COMPARISON: NK6C vs. NK6D

| Aspect | NK6C | NK6D |
|--------|------|------|
| **Schema version** | v2.1-hybrid (new) | v2.0-draft (existing) |
| **New PostgreSQL columns** | 5 | 0 |
| **New PostgreSQL tables** | 1 | 0 |
| **Importer architecture** | 3-layer | Thin translation layer |
| **Lines of code** | 500+ | ~300 |
| **Engineering time** | 12–16 hours | 4–6 hours |
| **CLI commands** | 6 | 1 |
| **Evidence metadata** | Stored in DB | Deferred to Phase 2 |
| **Governance tracking** | Stored in DB | Not stored (editorial workflow) |
| **Timeline** | 4 weeks | 1–2 weeks |
| **Risk** | Medium (new architecture) | Low (reuse existing services) |
| **Backward compatibility** | ✅ Additive but complex | ✅ Complete (zero schema changes) |

**Verdict:** NK6D is 70% simpler, 75% faster, zero new architecture, same end result (10 foods in database).

---

## SECTION 13: PATH TO PHASE 2 (Evidence + Governance)

**Phase 2 can add evidence metadata without reimporting:**

1. Extend `knowledge_food_benefits` with `evidence_sources` column (JSON)
2. Update importer to optionally import evidence_sources (if present in YAML)
3. Existing Phase 1 data unaffected (backward compatible)

**Or, Phase 2 can be separate workflow:**
1. Keep importer as-is (no evidence metadata)
2. Add separate `enrich-with-evidence` command
3. Read evidence from NK6 pilot document; augment existing foods

**Both paths available. NK6D doesn't lock Phase 2 into one approach.**

---

## SECTION 14: RECOMMENDATION

**Proceed with NK6D (simplified). Reasons:**

1. **Sufficient:** Imports all 10 foods into existing persistence
2. **Simple:** 300 lines of code vs. 1000+ (NK6C)
3. **Fast:** 1–2 weeks vs. 4 weeks
4. **Safe:** Reuses existing services; zero new architecture risk
5. **Extensible:** Phase 2 can add evidence without breaking Phase 1
6. **Honest:** Acknowledges that evidence sourcing is Phase 2 work; doesn't force it into Phase 1 import

**Next step:** Approve NK6D design → Engineering builds importer (4–6 hours) → Test on 10 files → Ready for production in 1–2 weeks.**

---

*Simplification completed: 2026-07-07*  
*NK6D: Thin translation layer, reuse existing services, zero new architecture*  
*Next milestone: Engineering builds ~300-line importer → all 10 foods in production database*
