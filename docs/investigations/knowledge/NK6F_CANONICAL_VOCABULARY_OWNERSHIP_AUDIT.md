# NK6F — Canonical Vocabulary Ownership Audit

**Status:** Investigation and audit (no implementation)  
**Date:** 2026-07-07  
**Purpose:** Determine the canonical owner of nutrient and benefit vocabularies, and recommend whether the YAML format (NK5) or existing platform should be the canonical source.  
**Governing documents:** NK1, NK2, NK3, NK4, NK5, `shared/knowledge/nutrients.ts`, `shared/knowledge/health-benefits.ts`

---

## EXECUTIVE SUMMARY

**Current state:** Nutrient and benefit vocabularies are canonically owned by **TypeScript files** (`shared/knowledge/nutrients.ts` and `shared/knowledge/health-benefits.ts`), which define controlled vocabularies that are seeded into PostgreSQL.

**Finding:** The TypeScript files are the source of truth, but they are:
- ✅ Immutable (require code changes + seed run)
- ✅ Version-controlled (git audit trail)
- ✅ Deterministic (no silent conflicts)
- ❌ Hard to edit for non-developers
- ❌ Require technical deployment to modify

**Recommendation:** **Dual canonical ownership with clear hierarchy:**

1. **Canonical source (authority):** TypeScript files (`shared/knowledge/nutrients.ts`, `shared/knowledge/health-benefits.ts`)
   - Why: Version control, immutability, deterministic merges, existing infrastructure
   - Who owns it: Editorial + Engineering (joint ownership)
   - How it's edited: Code review + seed deployment

2. **YAML reference (editorial visibility):** Optional YAML exports for editorial team
   - Why: Human-readable, easier review without code knowledge
   - What it is: Auto-generated from TypeScript; read-only for editorial reference
   - When it's used: Editorial vocabulary proposals → code change → regenerate YAML

**Why not make YAML the canonical source?** Because:
- Foods (NK5) reference vocabulary slugs; changing vocabulary requires re-authoring all foods
- Vocabularies have versioning/deprecation needs that benefit from code review
- YAML vocabularies would create a second place to change things (sync problems)
- Current TS files have deterministic validation + deployment; YAML would need equivalent tooling

---

## PART 1: CURRENT VOCABULARY OWNERSHIP INVESTIGATION

### 1.1 Nutrient Vocabulary — Current State

**Location:** `shared/knowledge/nutrients.ts`

**Structure:**
```typescript
export const NUTRIENT_SEED: InsertKnowledgeNutrient[] = [
  { slug: "fibre", name: "Fibre", category: "macronutrient", displayOrder: 1, description: "..." },
  { slug: "plant-protein", name: "Plant Protein", category: "macronutrient", displayOrder: 2, description: "..." },
  // ... 28 more nutrients
]
```

**Current metrics:**
- **Count:** 30 nutrients
- **Categories:** macronutrient (3), fatty-acid (1), mineral (10), vitamin (8), phytonutrient (8), other (1)
- **Ownership:** Editorial (content) + Engineering (code structure)
- **Change process:** Edit TypeScript → git commit → npm run seed:knowledge → PostgreSQL upsert
- **Version control:** ✅ Yes (git history, blame, PR review)
- **Validation:** ✅ Yes (`validateKnowledgeSeed()` checks for duplicates, references)

**How it's seeded:**
```
shared/knowledge/nutrients.ts (TS source)
  ↓
server/seeds/seed-knowledge-registry.ts (seed runner)
  ↓
PostgreSQL knowledge_nutrients table (live data)
```

**Who uses it:**
- `food-report-adapter.ts` (maps slug → display name)
- `relationships.ts` (food-nutrient links reference these slugs)
- `shared/knowledge/index.ts` (validation + re-export)
- Tests (`test-knowledge-registry.ts`)
- NK5 foods (YAML foods reference these slugs: `nutrients.slug`)

**Authority level:** Tier 1 (authoritative source)

---

### 1.2 Health Benefit Vocabulary — Current State

**Location:** `shared/knowledge/health-benefits.ts`

**Structure:**
```typescript
export const HEALTH_BENEFIT_SEED: InsertKnowledgeHealthBenefit[] = [
  {
    slug: "gut-health",
    name: "Gut Health",
    description: "Foods that feed and support a thriving gut microbiome...",
    icon: "sprout",
    displayOrder: 1,
  },
  // ... 14 more benefits
]
```

**Current metrics:**
- **Count:** 15 benefits
- **Ownership:** Editorial (content) + Engineering (code structure)
- **Change process:** Edit TypeScript → git commit → npm run seed:knowledge → PostgreSQL upsert
- **Version control:** ✅ Yes (git history, PR review)
- **Validation:** ✅ Yes (`validateKnowledgeSeed()` checks for duplicates, relationships)

**How it's seeded:**
```
shared/knowledge/health-benefits.ts (TS source)
  ↓
server/seeds/seed-knowledge-registry.ts (seed runner)
  ↓
PostgreSQL knowledge_health_benefits table (live data)
```

**Who uses it:**
- `food-report-adapter.ts` (maps slug → display name + icon)
- `relationships.ts` (nutrient-benefit and food-benefit links)
- Tests
- NK5 foods (YAML foods reference these slugs: `benefits.slug`)

**Authority level:** Tier 1 (authoritative source)

---

### 1.3 Current Governance Model

**Source of truth hierarchy:**

```
Tier 1 (Authoritative):
├─ shared/knowledge/nutrients.ts (NUTRIENT_SEED)
├─ shared/knowledge/health-benefits.ts (HEALTH_BENEFIT_SEED)
└─ shared/knowledge/relationships.ts (FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS)

Tier 2 (Derived, cached):
├─ PostgreSQL knowledge_* tables (seeded, read-only from app perspective)
└─ TypeScript TS files as read-only references (food-report-adapter.ts)

Tier 3 (Display only):
└─ UI components (render benefits, nutrients, icons)
```

**Change control (current):**
1. Editorial proposes change (e.g., "Add 'Metabolism Support' benefit")
2. Editorial + Engineering review (code review in GitHub)
3. Engineering implements (edit TS file)
4. Engineering deploys (npm run seed:knowledge)
5. Database updated (PostgreSQL upsert by slug)
6. UI reflects change (automatic, no code change needed)

**Immutability guarantees:**
- ✅ Slug cannot change (PK, FK references). Rename = create new slug, deprecate old.
- ✅ No silent conflicts (TypeScript validation catches duplicates)
- ✅ Audit trail (git log shows who changed what when)
- ✅ Rollback possible (git revert; re-seed)

---

## PART 2: YAML AUTHORING FORMAT CONSIDERATION (NK5)

### 2.1 How NK5 YAML Foods Reference Vocabularies

From NK4/NK5, canonical foods in YAML reference vocabulary:

```yaml
# canonical-foods/lentils.yaml
nutrients:
  - slug: "fibre"          # ← references nutrient vocabulary
    name: "Fibre"          # ← references display name (could be from TS)
    ranking: 1

benefits:
  - slug: "gut-health"     # ← references benefit vocabulary
    name: "Gut Health"     # ← references display name (could be from TS)
    ranking: 1
```

**Current plan (NK5):**
- YAML foods import directly via: `nutrients.slug`, `benefits.slug`
- Validation (Zod) confirms slug exists in canonical vocabulary
- If slug doesn't exist in vocabulary → validation error → import fails

---

### 2.2 Option A: Keep TypeScript Canonical (Recommended)

**Model:**
```
shared/knowledge/nutrients.ts (source of truth)
  ↓ [seeded into DB]
PostgreSQL knowledge_nutrients
  ↓ [read by validator]
NK5 YAML validation (Zod checks slug exists)
  ↓
canonical-foods/lentils.yaml (references TS vocabulary)
```

**Advantages:**
- ✅ Single source of truth (TS files, not duplicate YAML)
- ✅ Version control built-in (git history, blame, audit trail)
- ✅ Deterministic validation (no conflicts between YAML and TS)
- ✅ Existing infrastructure (seeder, tests, change control)
- ✅ Editorial visibility (could export TS → YAML for review, but TS is authority)
- ✅ No sync problems (one place to change, one deployment)

**Disadvantages:**
- ❌ Non-developers can't directly edit vocabularies
- ❌ Requires code change + seed run for vocabulary edits
- ❌ Higher barrier to editorial proposals

**Implementation:**
- No change needed; current system is this model
- Optional: Export TS vocab to YAML for editorial reference (read-only)
- NK5 import validates against TS vocabulary (via DB or in-memory)

---

### 2.3 Option B: Move Vocabularies to YAML (Not Recommended)

**Model:**
```
canonical-vocabularies/nutrients.yaml (source of truth)
  ↓ [parsed + validated]
Zod validation (schema check)
  ↓ [seeded into DB]
PostgreSQL knowledge_nutrients
  ↓ [read by app]
UI components
```

**Advantages:**
- ✅ Easier for editorial team to edit (no code, no git commit)
- ✅ Faster iteration (edit YAML, re-seed, done)

**Disadvantages:**
- ❌ No version control (YAML files don't have blame history; requires separate tooling)
- ❌ Sync problems (foods reference vocabulary slugs; changing vocabulary breaks foods)
- ❌ Deprecation hard (if renaming "Gut Health" → "Digestive Health", all 60 foods must update)
- ❌ Duplicate source of truth (vocabulary in both YAML and TS)
- ❌ No git audit trail for editorial decisions
- ❌ Editorial team must be comfortable with YAML + schema validation
- ❌ Migration work (extract TS → YAML, test equivalence)

**Example problem:**
```
Old vocabulary:  { slug: "gut-health" }
↓ Editorial renames to "digestive-health"
New YAML:        { slug: "digestive-health" }
↓ But 60 foods still reference "gut-health" in their YAML!
→ Import fails; must re-author all foods
→ No git history of which food editor made which reference
```

**Not recommended because:** Vocabularies are infrastructure; infrastructure should be version-controlled and code-reviewed. Foods reference vocabularies; changing vocabulary is a breaking change that should be visible in git.

---

### 2.4 Option C: Hybrid (Partial Recommendation)

**Model:**
```
shared/knowledge/nutrients.ts (source of truth, authoritative)
  ↓ [run script]
canonical-vocabularies/nutrients.yaml (auto-generated, for editorial review)
  ↓ [editorial proposes changes here]
Editorial review (non-binding, for discussion)
  ↓ [Engineering translates to TS edit]
shared/knowledge/nutrients.ts (updated)
  ↓ [seeded]
PostgreSQL
```

**Advantages:**
- ✅ TS remains source of truth (version-controlled)
- ✅ Editorial visibility (YAML is human-readable for review)
- ✅ Clear change process (editorial proposes in YAML, engineering implements in TS)
- ✅ Parallel workflows (editorial drafts in YAML while engineering reviews in code)

**Disadvantages:**
- ⚠️ Extra step (TS → YAML auto-generation + reverse-engineering edits)
- ⚠️ Two formats to maintain (though YAML is generated, not edited)

**Partial recommendation (low priority):**
- Keep TS as canonical
- Optionally: Provide auto-generated YAML export for editorial team to review
- YAML export is read-only (for visibility, not direct editing)
- Editorial change proposals come as issues/PRs, not YAML edits

---

## PART 3: RECOMMENDATION

### 3.1 Canonical Owner: TypeScript Files

**For nutrient vocabulary:** `shared/knowledge/nutrients.ts` (NUTRIENT_SEED)

**For benefit vocabulary:** `shared/knowledge/health-benefits.ts` (HEALTH_BENEFIT_SEED)

**For relationships:** `shared/knowledge/relationships.ts` (FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS)

**Authority model:**
- These files are the single source of truth
- Changes flow: Editorial proposal → Code review → TS edit → Seed → DB → UI
- Version control: Git provides full audit trail
- Validation: `validateKnowledgeSeed()` prevents conflicts

---

### 3.2 Why Not YAML?

1. **Sync risk:** Foods (NK5) reference vocabulary slugs. If vocabulary is YAML and foods are YAML, renaming a benefit slug requires re-authoring 60+ food files. No single change point.

2. **Version control missing:** YAML files don't have PR history, blame, or rollback without separate tooling. TypeScript + git is already in place.

3. **Deprecation nightmare:** If you want to deprecate "Gut Health" (slug: `gut-health`):
   - TS model: Edit TS, run seed, done. All foods still work (slug is immutable).
   - YAML model: Rename YAML, but all foods still reference old slug → must update 60 foods.

4. **Infrastructure as code:** Vocabularies are infrastructure (like database schema). Infrastructure should be versioned, reviewed, and deployed formally. TypeScript + git + PR review is the right pattern.

5. **Validation:** Current `validateKnowledgeSeed()` is deterministic and catches errors. Equivalent YAML validation would need to be written and maintained.

---

### 3.3 What About Editorial Usability?

**Problem:** Non-developers can't easily propose vocabulary changes.

**Solution (three-tier approach):**

1. **Short term:** Editorial team proposes vocabulary changes via GitHub issues
   - Issue template: "Add new benefit: Sleep Recovery" with description, evidence, foods
   - Engineering implements in TS + PR review
   - Clear change control, visible to team

2. **Medium term:** Publish YAML export of TS vocabulary
   - Auto-generated from TS files
   - Read-only for editorial reference
   - Easier to review than TS code
   - Editorial team can draft proposals in YAML, but TS is authority
   - Script: `npm run export:knowledge-vocabulary` → `canonical-vocabularies/nutrients.yaml`, `health-benefits.yaml`

3. **Long term (future):** KMS tool for vocabulary management
   - Dedicated UI for editorial team
   - Propose, review, approve workflows
   - Still writes to TS (or YAML + auto-generate TS)
   - Version control enforced
   - Future work (Phase 2+)

---

## PART 4: IMPLEMENTATION GUIDANCE

### 4.1 TypeScript Files Remain Canonical

**Maintain:**
```
shared/knowledge/nutrients.ts         (source of truth)
shared/knowledge/health-benefits.ts   (source of truth)
shared/knowledge/relationships.ts     (source of truth)
server/seeds/seed-knowledge-registry.ts (seeder, unchanged)
shared/knowledge/index.ts             (validation, unchanged)
server/tests/test-knowledge-registry.ts (tests, unchanged)
```

**Change process (for Editorial):**
1. Open GitHub issue: "Propose vocabulary change: [details]"
2. Engineering team discusses (comment on issue)
3. Engineering implements (edit TS file, PR)
4. PR review by Editorial + Engineering (approval before merge)
5. Merge to main
6. Deploy (npm run seed:knowledge)
7. Verify in staging/prod

---

### 4.2 Optional: Export YAML for Editorial Reference

**Low-priority enhancement (Phase 2+):**

```bash
# Script: export-knowledge-vocabulary.ts
import { NUTRIENT_SEED, HEALTH_BENEFIT_SEED, NUTRIENT_BENEFITS } from '@shared/knowledge';
import { writeFileSync } from 'fs';
import YAML from 'yaml';

// Export nutrients as YAML
const nutrientYaml = YAML.stringify({
  nutrients: NUTRIENT_SEED.map((n) => ({
    slug: n.slug,
    name: n.name,
    category: n.category,
    description: n.description,
  })),
});
writeFileSync('canonical-vocabularies/nutrients.yaml', nutrientYaml);

// Export benefits as YAML
const benefitYaml = YAML.stringify({
  benefits: HEALTH_BENEFIT_SEED.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description,
    icon: b.icon,
  })),
});
writeFileSync('canonical-vocabularies/health-benefits.yaml', benefitYaml);
```

**Usage:**
- Editorial team reads YAML for review (human-readable)
- Proposed changes: Editorial creates issue + code snippet showing TS edit
- Engineering implements in TS
- No editing of exported YAML (it's read-only, auto-generated)

---

### 4.3 NK5 Foods Reference TypeScript Vocabulary

**In NK5 import validation (Zod):**

```typescript
// shared/validation/canonical-food-schema.ts
import { NUTRIENT_SEED, HEALTH_BENEFIT_SEED } from '@shared/knowledge';

const nutrientSlugs = new Set(NUTRIENT_SEED.map((n) => n.slug));
const benefitSlugs = new Set(HEALTH_BENEFIT_SEED.map((b) => b.slug));

const nutrientSchema = z.object({
  slug: z.string().refine((slug) => nutrientSlugs.has(slug), 'Unknown nutrient slug'),
  // ...
});

const benefitSchema = z.object({
  slug: z.string().refine((slug) => benefitSlugs.has(slug), 'Unknown benefit slug'),
  // ...
});
```

**Result:**
- YAML food imports are validated against TS vocabulary
- If food references unknown slug → import fails with clear error
- TS vocabulary is authority; YAML foods must conform

---

## PART 5: GOVERNANCE RULES

### 5.1 Nutrient Vocabulary Ownership (Rule NK6-N)

**Owner:** Editorial + Engineering (joint)

**Authority:** `shared/knowledge/nutrients.ts` (TypeScript, version-controlled)

**Change process:**
1. Proposal (GitHub issue or PR comment)
2. Discussion (Editorial + Engineering alignment)
3. Implementation (edit TS file)
4. Review (PR approval by Editorial + Engineering)
5. Merge (git commit, audit trail)
6. Deploy (npm run seed:knowledge)
7. Verify (tests pass, staging + prod confirmed)

**Immutability rule:**
- Slug is immutable (primary key, FK in 6 tables)
- To rename: Create new slug, deprecate old (mark `isActive: false`)
- Do NOT delete rows (breaks foreign keys)

**Scope (what belongs in vocabulary):**
- Core nutrients (30 max): macros, key minerals, vitamins, phytonutrients
- Not in scope: individual amino acids, sub-micronutrients, component compounds
- Test: "Would a household recognize this nutrient?" If no, maybe it's Phase 2+

---

### 5.2 Health Benefit Vocabulary Ownership (Rule NK6-B)

**Owner:** Editorial + Nutritionist (joint)

**Authority:** `shared/knowledge/health-benefits.ts` (TypeScript, version-controlled)

**Change process:**
1. Proposal (issue + evidence summary)
2. Nutritionist review (is this evidence-backed?)
3. Editorial review (is phrasing household-first, per NK2?)
4. Implementation (edit TS file + update relationships.ts)
5. Review (PR approval by Editorial + Nutritionist)
6. Merge + Deploy + Verify

**Immutability rule:**
- Slug is immutable (primary key, FK in 4 tables)
- To rename: Create new slug, deprecate old
- Do NOT delete rows (breaks benefits for 60+ foods)

**Scope (what belongs):**
- Household-recognized benefits (15 max, per NK1)
- Evidence-backed (per NK1 Rule NK2)
- Not medical claims (per NK2 M3)
- Not "superfoods" (per NK2 G5)

**Current count:** 15 benefits (Gut, Heart, Immune, Sleep, Bone, Brain, Blood Sugar, Muscle, Skin, Energy, Eye, Digestive Comfort, Healthy Ageing, Mood, Anti-Inflammatory)

---

### 5.3 Relationships Ownership (Rule NK6-R)

**Owner:** Editorial + Research (joint)

**Authority:** `shared/knowledge/relationships.ts` (TypeScript, version-controlled)

**Change process:**
1. Research identifies new food-nutrient or nutrient-benefit link
2. Evidence sourcing (find literature, verify)
3. Proposal (issue with evidence summary)
4. Editorial + Nutritionist review
5. Implementation (edit relationships.ts)
6. Review + Merge + Deploy

**Immutability rule:**
- Once a relationship exists, don't remove it (ranking can change, but presence is immutable)
- To deprecate: Mark `isActive: false` in seeded data

---

## PART 6: CURRENT STATE AUDIT

### 6.1 Nutrient Vocabulary Audit

| Aspect | Current State | Status | Issue |
|---|---|---|---|
| **Source of truth** | `shared/knowledge/nutrients.ts` | ✅ Good | Clear, TypeScript, version-controlled |
| **Completeness** | 30 nutrients | ✅ Good | Covers macros, minerals, vitamins, phytos |
| **Version control** | Git (full history) | ✅ Good | Audit trail, blame, rollback |
| **Validation** | `validateKnowledgeSeed()` checks duplicates | ✅ Good | Prevents conflicts |
| **Schema adherence** | `InsertKnowledgeNutrient` type | ✅ Good | TypeScript ensures shape |
| **Documentation** | Comments in TS file + descriptions | ✅ Good | Each nutrient explained |
| **Governance clarity** | Implicit (Editorial owns content) | ⚠️ Unclear | No written rule; should be formalized |
| **Editorial accessibility** | Requires code change | ⚠️ Hard | Non-developers need Engineering |

---

### 6.2 Health Benefit Vocabulary Audit

| Aspect | Current State | Status | Issue |
|---|---|---|---|
| **Source of truth** | `shared/knowledge/health-benefits.ts` | ✅ Good | Clear, TypeScript, version-controlled |
| **Completeness** | 15 benefits | ✅ Good | Covers major health domains; extensible to 15 |
| **Version control** | Git (full history) | ✅ Good | Audit trail, blame, rollback |
| **Validation** | `validateKnowledgeSeed()` checks duplicates | ✅ Good | Prevents conflicts |
| **Schema adherence** | `InsertKnowledgeHealthBenefit` type | ✅ Good | TypeScript ensures shape |
| **Evidence-backing** | Not enforced at vocabulary level | ⚠️ Partial | Sourcing happens in relationships; vocab is just namespace |
| **EFSA compliance** | Phrasing reviewed per NK2; no auto-gate | ⚠️ Partial | Manual review in PR; could be automated |
| **Documentation** | Comments in TS file + descriptions | ✅ Good | Each benefit explained |
| **Governance clarity** | Implicit (Editorial + Nutritionist own) | ⚠️ Unclear | Should be formalized |
| **Editorial accessibility** | Requires code change | ⚠️ Hard | Non-developers need Engineering |

---

### 6.3 Relationships Audit

| Aspect | Current State | Status | Issue |
|---|---|---|---|
| **Source of truth** | `shared/knowledge/relationships.ts` | ✅ Good | Clear, TypeScript, version-controlled |
| **Scope** | Food→Nutrient, Nutrient→Benefit, Food→Benefit | ✅ Good | Comprehensive |
| **Validation** | `validateKnowledgeSeed()` checks referential integrity | ✅ Good | Prevents dangling slugs |
| **Version control** | Git (full history) | ✅ Good | Audit trail |
| **Evidence gating** | `claim-sources.ts` sourcing layer exists | ⚠️ Partial | Sourcing is separate; not all edges sourced |
| **Completeness** | Not all edges sourced; selective curating | ✅ Good | Per NK1: curated kernel, not exhaustive |

---

## PART 7: SUMMARY TABLE

| Question | Answer | Rationale |
|---|---|---|
| **Where is nutrient vocabulary canonical?** | `shared/knowledge/nutrients.ts` | TypeScript source file; version-controlled; single source of truth |
| **Where is benefit vocabulary canonical?** | `shared/knowledge/health-benefits.ts` | TypeScript source file; version-controlled; single source of truth |
| **Should YAML be canonical instead?** | No | Sync risk with foods; no version control; hard deprecation. TS is right pattern for infrastructure. |
| **Should both TS and YAML be canonical?** | No | Creates sync problems. Choose one; export the other for visibility. |
| **Recommended canonical owner** | TypeScript files (shared/knowledge/) | Version control built-in; deterministic validation; single edit point; clear change control |
| **Should YAML vocabularies exist?** | Optional (Phase 2+) | Auto-generated exports for editorial reference; read-only visibility; not direct editing |
| **How do NK5 foods reference vocabularies?** | By slug (nutrient.slug, benefit.slug) | Zod validation confirms slug exists in TS vocabulary; import fails if unknown |
| **What happens when renaming a benefit?** | Create new slug, deprecate old | Immutability rule; no breaking changes to foods; old slug stays in DB (isActive: false) |
| **Who can propose vocabulary changes?** | Anyone (GitHub issue) | Engineering implements; Editorial + Nutritionist review; git controls history |
| **Can Editorial directly edit vocabularies?** | Currently no (requires code) | By design; change control is valuable. Future KMS tool (Phase 2+) could automate. |

---

## ROLLBACK & SAFETY

**This is an audit and governance recommendation only. No implementation or data changes.**

- No code changes to vocabulary files
- No database migrations
- No vocabulary edits
- Recommendation can be accepted or rejected without affecting current system

---

## NEXT STEPS

### Immediate (If recommendation accepted)

1. ✅ **Formalize governance rules** (NK6-N, NK6-B, NK6-R) → add to ARCHITECTURE_PRINCIPLES.md or new governance doc
2. ✅ **Document change process** → create VOCABULARY_CHANGE_PROCESS.md
3. ✅ **Train Editorial team** → how to propose vocabulary changes via GitHub issues
4. ✅ **Update code review checklist** → vocabulary edits require Nutritionist approval

### Phase 2 (Post-NK5 launch)

5. ⭐ **Export script** → Auto-generate YAML from TS for editorial visibility (optional enhancement)
6. ⭐ **KMS tool** → Dedicated UI for vocabulary management (future, but recommended)
7. ⭐ **Deprecation process** → Document how to retire old slugs (maintain immutability)

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **Which nutrient vocabulary is authoritative?** | `shared/knowledge/nutrients.ts` (TypeScript, version-controlled, seeded into DB) |
| **Which benefit vocabulary is authoritative?** | `shared/knowledge/health-benefits.ts` (TypeScript, version-controlled, seeded into DB) |
| **Should YAML be canonical?** | No. TS is better (version control, deterministic, immutability guarantees). YAML vocabularies create sync problems with foods. |
| **Should platform (DB) be canonical?** | No. TS files are canonical; DB is a derived, seeded cache. One-way flow: TS → seed → DB. |
| **Who owns the vocabularies?** | Editorial (content) + Engineering (TS structure) for nutrients; Editorial + Nutritionist for benefits. Joint ownership with clear change control. |
| **How do YAML foods reference vocabularies?** | By slug (nutrient.slug, benefit.slug). Zod validation confirms slug exists in TS vocabulary at import time. |
| **What's the governance model?** | Version-controlled single source of truth (TS files) + PR review + change audit trail via git. |

---

*Audit completed: 2026-07-07*  
*Recommendation: Keep TypeScript files as canonical; no YAML vocabulary authoring (use for visibility only)*  
*Next milestone: Document governance rules (NK6-N, NK6-B, NK6-R); establish vocabulary change process*
