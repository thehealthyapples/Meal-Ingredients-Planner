# THA ARCHITECTURE PRINCIPLES — Governing Document

**Status:** GOVERNING — required reading before any significant implementation
**Adopted:** 2026-06-25
**Source investigation:** `docs/investigations/governance/THA_CORE_ARCHITECTURE_PRINCIPLES.md`
**Source register:** `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
**Supersedes:** Nothing — these principles *generalise* the Source of Truth Register's 8 governance rules from "source of truth governance" to "entity architecture". Both documents remain in force; the Register's rules become the enforcement mechanism for these principles.

---

## THE EIGHT PRINCIPLES

These are the governing engineering standards for The Healthy Apples. All future implementations must comply. Every future workstream must confirm compliance before implementation begins.

---

### Principle 1 — One canonical identity per entity

Every major entity (food, meal, product, eater, household) has exactly one key space.

**Rationale:** Dual namespaces are THA's recurring silent-defect source. The `knowledgeFoodSlug` vs canonical slug gap (WS0X.12/13), the `meals.ingredients` text array, scattered product identity — all stem from a single root cause: more than one key space for one entity.

**Applies to:** Food (canonical slug), Meal (meal id), Product (barcode or product id), Eater (eater id), Household (household id).

**Fail test:** Two stores that use different keys for the same real-world entity → fail.

---

### Principle 2 — One owner per fact — but facts at different scopes are different facts

Two stores that must always agree → one is redundant and must be retired.
Two stores that may legitimately differ (e.g. eater hard-restriction vs weekly soft-diet) → both are valid distinct facts.

**The scope test:** "Can these two stores legitimately disagree?" If yes, they are different facts at different scopes. If no, one is redundant.

**Rationale:** Prevents both duplication (the 4-store dietary preference problem) and over-collapse (the eater→week layering is a legitimate distinction that must survive consolidation).

**Current violations:** `users.dietPattern`/`users.dietRestrictions` shadowing `household_eaters` (same scope, must always agree → redundant). `client/src/lib/dietRules.ts` copy of server file (same scope → redundant).

---

### Principle 3 — Progressive enrichment for knowledge entities; single-owner state for transactional ones

**Knowledge entities** (Food, Meal, Product, Household) support progressive enrichment: identity → core trusted facts → optional sourced context → runtime assembled model. Gaps render as gaps, never as fabricated content.

**Transactional state** (Planner, Shopping, Diary, Membership) requires only "one owner, no duplicate state". Do not bolt enrichment pipelines onto transactional state — that is over-engineering.

**Rationale:** THA's value surfaces are all assemblies of one entity's facts plus optional enrichment. The architecture must match the product's grain.

---

### Principle 4 — Runtime consumes one assembled model per entity

Every surface reads from a single assembled model for each entity — never re-resolves identity itself.

Pattern: `buildFoodIntelligence(slug)`, `buildMealIntelligence(id)`, `buildProductIntelligence(barcode)`, etc.

**Rationale:** `shared/canonical/food-report-adapter.ts` (`buildFoodReport`) already proves this pattern works. Re-resolution is where bugs live. Every surface that re-resolves identity creates a new defect surface.

**Fail test:** A surface imports a client static data file for knowledge data → fail.

---

### Principle 5 — Reference vocabularies stay beside the spine, never merged in

Nutrient lists, benefit taxonomies, diet enums, allergen libraries, and other shared taxonomies are reference data. They sit beside the entity spine and are shared across entities.

**Rationale:** Merging them in would be the "redesign for elegance" that creates unnecessary coupling. Reference vocabularies correctly shared across domains are not duplication — they are normalisation.

**Applies to:** `knowledge_nutrients`, `knowledge_health_benefits`, allergen library, diet-pattern enum.

---

### Principle 6 — No fabricated knowledge — honest gaps over invented facts

Progressive enrichment must inherit THA's existing non-fabrication guarantees:
- Empty renders for missing knowledge (never invented placeholder text)
- `reviewedAt` required for uplift rules
- Sourced claims only (`SourceRef` with NHS/BNF/NIH ODS/EFSA + `url` + `lastReviewed`)
- EFSA wording firewall on all established health claims
- `emerging` benefits never shown as `established`

**Rationale:** Trust is the product. Enrichment must not become a fabrication surface. This is non-negotiable.

**Hard stop:** Any implementation that would display knowledge claims without a source reference must stop and seek approval.

---

### Principle 7 — No permanent synchronisation bridge

**A bridge that keeps two owners in sync** → this is debt to converge away, not formalise. Do not build permanent sync bridges.

**A bridge that funnels many inputs into one owner** → this is permitted infrastructure (e.g. `item-resolver.ts`, ingredient normalisation).

**The test:** Does this bridge exist because two stores both own the same fact? If yes, converge the stores. If no (it translates messy input into a single canonical identity), it is infrastructure.

**Rationale:** The `knowledgeFoodSlug` FK is a sync bridge (two owners of identity) — it is debt. `item-resolver.ts` is an input-funnelling bridge (many strings → one canonical owner) — it is infrastructure.

---

### Principle 8 — Prefer evolution over replacement; retire on introduction

Every new store that supersedes an existing store must:
1. Name what it replaces in the same document.
2. State the retirement condition (what must be true before the old store is deleted).
3. Migrate surface-by-surface behind stable service signatures.

**Rationale:** THA's accumulated debt is almost entirely un-retired predecessors, not bad new stores. Stores accumulate when each step locally adds a new store without retiring the old one.

**Enforcement:** See Source of Truth Register Rules 2, 3, and 8 (the governance enforcement mechanism for this principle).

---

## DOMAIN OWNERSHIP QUICK REFERENCE

| Domain | Source of Truth | Status |
|--------|----------------|--------|
| Food Knowledge (Nutrition) | `shared/knowledge/` → DB `knowledge_*` via `nutrition-knowledge-registry.ts` | Authoritative |
| Canonical Food Identity | `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias` | Authoritative |
| Food Relationships | `shared/relationships/food-graph.ts` | Authoritative |
| Plant Diversity | DB `diversity_group` (via WS2A canonical) | **Contested** — `nutrition-variety.ts` shadows |
| Dietary Restrictions | `shared/restrictions/restriction-library.ts` | Authoritative |
| Dietary Rules (pattern) | `server/lib/dietRules.ts` | **Contested** — identical copy in `client/src/lib/` |
| Dietary Preferences (user) | DB `users.dietPattern` + `users.dietRestrictions` | **Contested** — shadows `household_eaters` |
| Discovery | `shared/discovery/engine.ts` | Authoritative |
| Alternatives | `shared/alternatives/engine.ts` | Authoritative |
| Stories | `shared/stories/engine.ts` | Authoritative |
| Seasonal Stories | `shared/seasonal/engine.ts` | Authoritative |
| Meal Identity | DB `meals` table | Authoritative |
| Meal Templates | DB `meal_templates` | Authoritative |
| Planner State | DB `planner_weeks`, `planner_days`, `planner_entries` | Authoritative |
| Shopping State | DB `shopping_list`, `shopping_list_extras` | Authoritative |
| Household Profiles | DB `households`, `household_members`, `household_eaters` | Authoritative |
| Nutrition Boost Rules | `server/lib/uplift-rules.ts` | Authoritative |
| Nutrition Boost Display | **Contested** — retire `nutrition-benefit-library.ts` → use WS0 | Contested |
| Product Analysis | `server/lib/product-analysis.ts` + `server/lib/upf-analysis-service.ts` | Authoritative |
| Food Additive Knowledge | DB `food_knowledge` table | Authoritative |
| Diary | DB `food_diary_days`, `food_diary_entries`, `food_diary_metrics` | Authoritative |
| Plant Diversity Report | **Contested** — retire `nutrition-variety.ts` → use `diversity_group` | Contested |
| Food Report (Nutrition) | `shared/canonical/food-report-adapter.ts` | Authoritative |
| Ingredient Catalogue | `shared/catalogue/` → DB `ingredient_classifications` | Authoritative |
| Ingredient Normalization | `server/lib/ingredient-normalization-service.ts` | Authoritative |
| Membership | DB `users.subscriptionTier` | Authoritative |
| User Preferences | DB `user_preferences` | Authoritative |

---

## CONTESTED DOMAINS — MIGRATION BACKLOG

Four domains are currently contested. All must be migrated. None are migrated by this document. Ordered by launch risk:

### 1. Food Knowledge Display — 🔴 LAUNCH RISK (highest priority)

**Problem:** Three parallel stores answer the same question about the same food in the same session:
- `client/src/lib/nutrition-benefit-library.ts` (~25 boost ingredients)
- `client/src/lib/pantry-knowledge.ts` (~50 pantry ingredients)
- WS0 Knowledge Registry (`shared/knowledge/` → DB `knowledge_*`)

**Target:** All consumers read WS0 Knowledge Registry via `nutrition-knowledge-registry.ts`.

**Migrations required (from Source of Truth Register):**
- M1: Retire `nutrition-benefit-library.ts` — update `MealUpliftPanel.tsx` + `PlantDiversityReport.tsx`
- M2: Retire `pantry-knowledge.ts` — seed into `pantry_ingredient_knowledge` DB, update `pantry-page.tsx`

---

### 2. Plant Diversity Counting — 🟡 IMPORTANT

**Problem:** `client/src/lib/nutrition-variety.ts` keyword lists shadow the authoritative `diversity_group` DB table. An ingredient can be counted in the 30-plants widget but produce an empty Food Report.

**Target:** 30-plants counter derives plant status from WS2A `diversity_group` table.

**Migration required:**
- M4: Replace `nutrition-variety.ts` with canonical slug lookup via `GET /api/canonical/plants`

---

### 3. Dietary Rules — 🟡 IMPORTANT

**Problem:** `client/src/lib/dietRules.ts` is an identical copy of `server/lib/dietRules.ts`. Any keyword change to one file but not the other produces silent split-brain behaviour.

**Target:** Single `shared/dietRules.ts` imported by both server and client.

**Migration required:**
- M3: Move to `shared/dietRules.ts`; delete both existing files; update all imports

---

### 4. Dietary Preferences — 🟢 SAFE (lowest priority)

**Problem:** `users.dietPattern`/`users.dietRestrictions` shadow `household_eaters` diet facts. Currently no live split-brain, but risk is structural.

**Target:** Eater entity owns hard restrictions; week-override owns soft-diet. Retire the `users.diet*` overlap.

**Note:** Eater hard-restrictions and week soft-diet are legitimately different facts (scope test passes). Only the `users` column overlap with `household_eaters` is the contested duplication.

---

## WHAT UDEA DOES NOT APPLY TO

These are out of scope for the enrichment half of UDEA (Principles 3, 4). One-owner rules still apply.

- **Planner state** (`planner_*`) — user-authored transactional state, not an enrichable knowledge entity
- **Shopping state** (`shopping_list`) — same; one owner is already satisfied
- **Diary** (`food_diary_*`) — same; clean single owner
- **Membership** (`users.subscriptionTier`) — same
- **Reference vocabularies** (nutrient list, benefit taxonomy, allergen library) — legitimately shared across all entities; not duplication

---

## GOVERNANCE RULES (from Source of Truth Register)

These eight rules are the enforcement mechanism for the eight principles above.

1. Every major domain must declare a named source of truth (a file path or DB table name).
2. Every architecture proposal must answer: "Does this replace an existing store?" If yes: retirement plan required in the same document.
3. No parallel stores for the same domain. Temporary stores must name their retirement condition in the document that creates them.
4. No identical file copies. Server+client shared modules must live in `shared/`.
5. Consumers must read from the authoritative source. Exceptions require written justification naming the blocked technical dependency.
6. Static client `.ts` files are not knowledge stores. Data that overlaps with DB knowledge, will grow beyond 30 entries, or will need post-launch enrichment must live in the DB.
7. The Source of Truth Register must be updated at every workspace before the workspace is considered complete.
8. Governance review required before any new knowledge store is created (check the register; provide justification if a new store is genuinely needed).

---

*Required reading before any significant implementation.*
*Update this document if a contested domain is resolved or a new domain is introduced.*
*Rollback: this document only — `git checkout HEAD docs/architecture/ARCHITECTURE_PRINCIPLES.md` (or delete the file to revert).*
