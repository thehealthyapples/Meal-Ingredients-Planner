# THA CORE ARCHITECTURE PRINCIPLES — Implementation

**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Risk:** 🟡 AMBER — Engineering governance. No schema, runtime, or data changes.
**Rollback tag:** `rollback/before-arch-governance-20260625` → `a8a912a` (feat(ws0x7): Ingredient Resolution Engine Completeness Program)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-arch-governance-20260625` → `a8a912a` |
| Full SHA | `3237d4332fae0d3cb6abda35e133be0308fd6f3d` |
| Working tree at start | **Intentionally dirty** — 17 modified tracked files + ~50 untracked docs/modules from in-progress WS0X.5–13 and related streams. Not created by this task. |
| This task's writes | Three new files (see Files Changed). No code, schema, data, runtime, or validation touched. |
| Rollback command | `git checkout rollback/before-arch-governance-20260625` |
| Undo this task only | Delete the three files listed under Files Changed. |

**Why protection is sound despite a dirty tree:** The committed tag fixes the last-commit baseline as a permanent ref. This implementation writes nothing but documentation into three new files; there is no source, schema, or data change to undo. The pre-existing uncommitted work is untouched.

---

## REFERENCE DOCUMENTS READ

Before any implementation began:

- [x] `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES.md` — the investigation (source of the 8 principles, all 10 parts)
- [x] `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — 27 domain register, 8 governance rules, 4 migrations, 4 contested domains
- [x] `docs/investigations/THA_LAUNCH_ROADMAP.md` — launch sequencing, workstreams WS0–WS5, post-launch roadmap
- [x] `docs/investigations/current_dev_status.md` — development drift analysis
- [x] `docs/change-control.md` — existing engineering workflow (unchanged by this task)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

This workstream introduces governance only. It does not create new entities, stores, consumers, or runtime logic.

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entities touched. Governance document declares the single-identity principle.

☑ One owner per fact
  No data written. Governance declares single-ownership rules.

☑ No duplicate entities
  No new entities. The governance document names existing entities and their owners.

☑ No duplicate ownership
  No new ownership created. Contested ownerships are named and migration-backlogged.

☑ No duplicate state
  No state created or modified.

☑ Extends existing architecture
  Extends the Source of Truth Register's 8 governance rules into platform-wide entity
  architecture principles. The Register's rules become the enforcement mechanism for
  the new principles — no replacement, pure extension.

☑ Progressive enrichment where appropriate
  Not applicable — this is governance, not a knowledge entity or transactional system.

☑ Honest gaps over fabricated information
  Not applicable — no knowledge claims made.

☑ No permanent synchronisation bridge
  Not applicable — no bridges created.

☑ Evolution over replacement
  The change-control.md document is unchanged. The Source of Truth Register is unchanged.
  The investigation document is unchanged. This implementation adds two new governance
  documents (docs/ARCHITECTURE_PRINCIPLES.md, docs/ENGINEERING_WORKFLOW.md) that
  generalise and extend the existing governance — they do not replace it.
```

---

## IMPLEMENTATION SUMMARY

Eight governance artefacts delivered across the eight parts of the approved scope:

| Part | Requirement | Delivered |
|------|-------------|-----------|
| 1 | Architecture Principles governing document | `docs/ARCHITECTURE_PRINCIPLES.md` |
| 2 | Engineering workflow updated with Architecture Compliance | `docs/ENGINEERING_WORKFLOW.md` |
| 3 | Mandatory Architecture Checklist | Section in `docs/ENGINEERING_WORKFLOW.md` |
| 4 | Implementation template updated | Template section in `docs/ENGINEERING_WORKFLOW.md` |
| 5 | Roadmap alignment — recommended amendments | Part 5 of this document (below) |
| 6 | Source of Truth alignment — contested domains and migration backlog | `docs/ARCHITECTURE_PRINCIPLES.md` (Contested Domains section) |
| 7 | Implementation priority list | Part 7 of this document (below) |
| 8 | Verification — no runtime behaviour changed | Part 8 of this document (below) |

---

## FILES CHANGED

Three new files. No existing files modified.

| File | Type | Change |
|------|------|--------|
| `docs/ARCHITECTURE_PRINCIPLES.md` | New | Official governing document — the 8 principles, domain ownership register, contested domains and migration backlog |
| `docs/ENGINEERING_WORKFLOW.md` | New | Updated engineering workflow with mandatory Architecture Compliance, Domain Impact Declaration, Architecture Checklist, and Implementation Template |
| `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES_IMPLEMENTATION.md` | New | This project file |

No other files were created, modified, or deleted.

---

## PART 1 — ARCHITECTURE GOVERNING DOCUMENT

**Delivered:** `docs/ARCHITECTURE_PRINCIPLES.md`

The investigation document (`THA_CORE_ARCHITECTURE_PRINCIPLES.md`) contains the full evidence base, all 10 analytical parts, the trust check, and the definition of done for the investigation phase. It is preserved as-is and remains the evidence record.

The governing document (`docs/ARCHITECTURE_PRINCIPLES.md`) is the distilled, action-oriented version: the 8 principles, their rationale, the domain ownership quick reference, the contested domain migration backlog, and the governance enforcement rules. This is what future implementations must read.

The investigation document is **not** promoted to replace the governing document; both serve different purposes. The investigation is the evidence; the governing document is the standard.

---

## PART 2 — ENGINEERING WORKFLOW UPDATED

**Delivered:** `docs/ENGINEERING_WORKFLOW.md`

The existing `docs/change-control.md` is unchanged. The new engineering workflow document extends it with three additions:

1. **Mandatory Step 0 — Architecture Compliance** (Steps 1–3 in the new workflow): every implementation must create rollback protection, read the architecture principles, and complete the checklist before any implementation begins.

2. **Domain Impact Declaration** (Step 6): every workstream touching a data domain must declare which domain, which SoT, whether new stores are being created, and whether consumers read from the authoritative source.

3. **Hard stops** (Step 7): explicit list of conditions that must pause implementation and require approval before continuing.

---

## PART 3 — MANDATORY ARCHITECTURE CHECKLIST

**Delivered:** In `docs/ENGINEERING_WORKFLOW.md` (Mandatory Architecture Compliance Checklist section)

The ten-item checklist from the implementation brief:

```
□ One canonical identity
□ One owner per fact
□ No duplicate entities
□ No duplicate ownership
□ No duplicate state
□ Extends existing architecture
□ Progressive enrichment where appropriate
□ Honest gaps over fabricated information
□ No permanent synchronisation bridge
□ Evolution over replacement
```

Each item requires an explanation, not just a checkbox. If any item fails, implementation must stop.

---

## PART 4 — IMPLEMENTATION TEMPLATE UPDATED

**Delivered:** In `docs/ENGINEERING_WORKFLOW.md` (Implementation Template section)

The standard template now contains six mandatory sections:

1. Architecture Compliance (checklist)
2. Definition of Done
3. Data Impact
4. Trust Check
5. Rollback Plan
6. Scope Lock

The template is formatted as a markdown code block for easy copy-paste into new workstream documents.

---

## PART 5 — ROADMAP ALIGNMENT

Reviewed `docs/investigations/THA_LAUNCH_ROADMAP.md` against the 8 Architecture Principles.

### Natural alignment (already UDEA-aligned)

| Roadmap item | Principle alignment |
|---|---|
| "Reading from one shared knowledge model" as the launch definition | Principle 4 (one assembled model) |
| Plant Diversity Tier A → Tier B "in place, zero UI rework" | Principle 3 (progressive enrichment for knowledge entities) |
| Claim-safety gates / nutrient bridge / source-required | Principle 6 (honest gaps, no fabrication) |
| Register migrations M1–M4 (retire prototype stores) | Principle 8 (retire on introduction) |
| WS0X.13 convergence to canonical-keyed runtime | Principles 1, 4, 7 |

The roadmap is already implicitly UDEA-aligned. Its launch definition literally requires "one shared knowledge model". Adopting UDEA formally makes the roadmap's existing instincts into explicit, enforceable gates.

### Recommended amendments

**Amendment A — Do not build the WS0X.12 permanent bridge**

The WS0X.12 proposal to formalise a permanent `canonical→knowledge` slug bridge violates Principle 7 (no permanent synchronisation bridge). WS0X.13's convergence approach (re-key knowledge link tables to canonical slug) is the correct path. Recommended: supersede WS0X.12 with WS0X.13. Do not build the permanent bridge.

**Amendment B — New profile goals/likes/dislikes must attach to the eater entity**

The Launch Roadmap (§2 item 9) notes per-person goals/likes/dislikes may be added if the recommendation engine ships at launch. If implemented, these must attach to `household_eaters`, not a new `user_preferences` extension. Creating a 5th dietary preference store violates Principle 2 (one owner per fact). Recommended: pre-commit that any goals/likes/dislikes field goes on the eater entity.

**Amendment C — No new surface may import a client static knowledge `.ts` file**

Any new knowledge surface that imports a client `.ts` data map (like `LIBRARY: NutritionBenefit[]`) violates Principles 4 and 6 (single assembled model, governance Rule 6). Recommended: add this as an explicit DoD requirement for every knowledge surface workstream.

**Amendment D — Household Progress must be built as Household Intelligence enrichment**

When Household Progress is built (post-launch item 8), it must use the Household entity's enrichment spine rather than spawning its own household-state store. Recommended: note this constraint in the post-launch planning document before work begins.

### No roadmap changes recommended that affect launch sequencing or workstream scope

The four amendments above are constraint additions, not scope or sequence changes. The existing launch workstream sequence (WS0 → WS1 → WS2 → WS3 → WS4 → WS5) is UDEA-aligned and unchanged.

---

## PART 6 — SOURCE OF TRUTH ALIGNMENT

Cross-referenced `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` with `docs/ARCHITECTURE_PRINCIPLES.md`.

### Currently contested domains (4 of 27)

| Domain | Register status | UDEA Principle violated | Launch risk |
|--------|----------------|------------------------|-------------|
| Food Knowledge Display | 🔴 Contested | P1 (multiple identity paths), P2 (multiple owners of same fact), P4 (no single assembled model), P7 (health-benefits-model.ts bridges two parallel stores) | 🔴 LAUNCH RISK |
| Plant Diversity Counting | 🟡 Contested | P1 (two classification mechanisms for one entity), P4 (surfaces re-resolve independently) | 🟡 IMPORTANT |
| Dietary Rules (pattern) | 🟡 Contested | P2 (identical copy = two owners of same fact), Governance Rule 4 (no file copies) | 🟡 IMPORTANT |
| Dietary Preferences | 🟢 Contested | P2 (users.diet* shadows household_eaters for same-scope facts) | 🟢 SAFE (for now) |

### 23 of 27 domains are already UDEA-compliant

The following domains satisfy all 8 principles: Food Relationships, Dietary Restrictions, Discovery, Alternatives, Stories, Seasonal Stories, Meal Identity, Meal Templates, Planner State, Shopping State, Household Profiles, Nutrition Boost Rules, Product Analysis, Food Additive Knowledge, Diary, Food Report (Nutrition), Ingredient Catalogue, Ingredient Normalization, Membership, User Preferences, Canonical Food Identity, Food Knowledge (Nutrition — WS0 registry itself is clean).

**The platform is approximately 85% UDEA-compliant by domain count. Adoption formalises the majority pattern.**

### Prioritised migration backlog

| Priority | Migration | Domain | Launch risk | Estimated effort |
|----------|-----------|--------|-------------|-----------------|
| 1 | M1: Retire `nutrition-benefit-library.ts` | Food Knowledge Display | 🔴 | Low (2–3 prompts) |
| 2 | M2: Retire `pantry-knowledge.ts` | Food Knowledge Display | 🔴 | Medium (3–4 prompts) |
| 3 | M3: Move `dietRules.ts` to `shared/` | Dietary Rules | 🟡 | Very low (1 prompt) |
| 4 | M4: Replace `nutrition-variety.ts` with canonical | Plant Diversity | 🟡 | Medium-high (4–5 prompts) |
| 5 | Consolidate dietary preferences onto eater | Dietary Preferences | 🟢 | Medium (migration needed) |

**Do not begin these migrations.** They are listed here as the backlog for future workstreams. Each requires its own rollback protection, architecture compliance check, and scoped implementation prompt.

---

## PART 7 — IMPLEMENTATION PRIORITY LIST

Recommended implementation order for future workstreams. None of these are authorised by this document.

**Priority 1 — Food Intelligence convergence (highest leverage)**

Retire `nutrition-benefit-library.ts` (M1) and `pantry-knowledge.ts` (M2). This is the 🔴 launch risk. Three phrasings of chickpeas across surfaces in one session is directly user-visible and undermines trust. The WS0 Knowledge Registry already contains all 25+ foods. This is the single highest-return migration: close the most visible trust gap with the least architectural risk.

**Priority 2 — Dietary Rules unification (lowest effort, eliminates a split-brain trap)**

Move `dietRules.ts` to `shared/` (M3). This is one prompt, zero runtime risk, and eliminates the category of bug where a keyword change to one file silently breaks the other. The benefit compounds: every future dietary rule change automatically applies to both server and client.

**Priority 3 — Meals ingredient identity (deepest structural gap)**

Make `meals.ingredients` reference canonical food rather than storing free text. This is the deepest architectural gap in THA. Every downstream surface (Plant Diversity counting, Nutrition Boost, Meal Food Intelligence) currently re-resolves free text back to identity, each via its own resolver. Fixing this at the root eliminates whole defect classes across all three surfaces at once. It requires a migration strategy and should be planned as a dedicated workstream.

**Priority 4 — Plant Diversity counting from canonical (M4)**

Replace `nutrition-variety.ts` keyword lists with `diversity_group` canonical lookup. This closes the inconsistency where an ingredient can be counted in the 30-plants widget but produce an empty Food Report. The normalization bridge (raw string → canonical slug) is the hard part; this should follow Priority 3 (meals ingredient identity) so the canonical pipeline is mature before the diversity counter depends on it.

**Priority 5 — Dietary preference consolidation**

Retire `users.dietPattern`/`users.dietRestrictions` overlap with `household_eaters`. Keep the eater→week layering (legitimately different facts). The challenge here is migration: live dietary preference data must move from `users` columns to the eater entity without disrupting the planner compliance gate. Requires a careful migration with rollback protection.

**Priority 6 — Product identity entity**

Define a Product entity to own barcode/name/brand once, and reframe `product-analysis.ts` as `buildProductIntelligence(barcode)`. Currently product identity is scattered across `grocery_products`, `shopping_fulfilment_memory`, `meals` (barcode/brand columns), and `basket_items`. This formalises enrichment the analyser already performs and removes scattered product identity as a future defect source.

**Priority 7 — Planner legacy retirement**

Retire legacy `meal_plans`/`meal_plan_entries` once `planner_*` fully supersedes them. This is debt from the planner migration that was left in place for compatibility. The newer spine is the live path; the legacy tables exist but carry no live writes.

**Priority 8 — Remaining contested domains**

Any domains that remain contested after Priorities 1–7 are addressed.

---

## PART 8 — VERIFICATION

Confirming all scope-lock requirements.

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Existing application behaviour unchanged | ✅ | No source files modified. No runtime logic touched. |
| No runtime logic changed | ✅ | Three new markdown documentation files only. |
| No database schema changed | ✅ | `shared/schema.ts` unmodified. |
| No data migrated | ✅ | No seed scripts, no DB writes, no migrations. |
| No APIs altered | ✅ | `server/routes.ts` unmodified. |
| Governance documentation complete | ✅ | `docs/ARCHITECTURE_PRINCIPLES.md` + `docs/ENGINEERING_WORKFLOW.md` + this project file. |

---

## DEFINITION OF DONE — VERIFICATION

| Criterion | Status |
|-----------|:------:|
| Core Architecture Principles adopted | ✅ `docs/ARCHITECTURE_PRINCIPLES.md` created |
| Engineering workflow updated | ✅ `docs/ENGINEERING_WORKFLOW.md` created with mandatory Architecture Compliance |
| Architecture checklist introduced | ✅ In `docs/ENGINEERING_WORKFLOW.md` |
| Future implementation template updated | ✅ In `docs/ENGINEERING_WORKFLOW.md` |
| Source of Truth Register aligned | ✅ Part 6 of this document |
| Roadmap reviewed | ✅ Part 5 of this document |
| Migration backlog created | ✅ Part 6 and Part 7 of this document |
| No runtime behaviour changed | ✅ Part 8 of this document |
| Project file created | ✅ This file |

---

## DATA IMPACT

| Question | Answer |
|----------|--------|
| Reads existing data | YES (source code, schema, investigation docs) |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |

---

## TRUST CHECK

| Question | Answer |
|----------|--------|
| No architectural duplication introduced | YES — governance only; no stores, no entities |
| No new source of truth created | YES — no data sources created |
| No runtime behaviour altered | YES — documentation files only |
| Implementation within approved scope | YES — governance documents and project file only |

---

## ROLLBACK PLAN

**Rollback identifier:** `rollback/before-arch-governance-20260625` → `a8a912a`

**Files created by this task:**
- `docs/ARCHITECTURE_PRINCIPLES.md`
- `docs/ENGINEERING_WORKFLOW.md`
- `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES_IMPLEMENTATION.md`

**Rollback commands (to undo this task only):**
```bash
rm docs/ARCHITECTURE_PRINCIPLES.md
rm docs/ENGINEERING_WORKFLOW.md
rm docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES_IMPLEMENTATION.md
```

**Rollback commands (to restore committed baseline):**
```bash
git checkout rollback/before-arch-governance-20260625
```

**Verification after rollback:**
- Confirm `docs/ARCHITECTURE_PRINCIPLES.md` does not exist
- Confirm `docs/ENGINEERING_WORKFLOW.md` does not exist
- Confirm application builds and runs normally (no changes to any source file)

---

## SCOPE LOCK

**Implemented:**
- Architecture Principles governing document (Part 1)
- Engineering workflow with Architecture Compliance (Parts 2, 3, 4)
- Roadmap alignment analysis with recommended amendments (Part 5)
- Source of Truth alignment and migration backlog (Part 6)
- Implementation priority list (Part 7)
- Verification (Part 8)
- This project file

**Explicitly excluded (per scope lock):**
- Migration of Food Intelligence
- Redesign of Planner
- Redesign of Shopping
- Redesign of Pantry
- Redesign of Products
- Any modification of runtime behaviour
- Any modification of database schema
- Any data migration
- Any implementation of the migrations listed in the backlog

**SUGGESTION — future workstreams (not implemented; require separate approval):**

1. Implement M1 (retire `nutrition-benefit-library.ts`) — the highest-priority migration with lowest effort. Closes the 🔴 launch risk.
2. Implement M2 (retire `pantry-knowledge.ts`) — seed content into `pantry_ingredient_knowledge` DB; update consumers.
3. Implement M3 (move `dietRules.ts` to `shared/`) — one prompt, eliminates split-brain dietary rules.
4. Implement M4 (replace `nutrition-variety.ts` with canonical plant counting) — requires normalization bridge.
5. Plan meals ingredient identity workstream — the deepest structural gap; own workstream required.
6. Dietary preference consolidation workstream — requires migration strategy for live `users.diet*` data.

---

*Project file: `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES_IMPLEMENTATION.md`*
*Rollback: `rollback/before-arch-governance-20260625` → `a8a912a` · delete three new files to revert*
*No code, schema, data, runtime, or API changes made.*
