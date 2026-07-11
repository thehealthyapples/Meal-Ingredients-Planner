# THA SOURCE OF TRUTH ARCHITECTURE REGISTER

**Status:** GOVERNING ARCHITECTURE — Platform Governance (canonical). Relocated to `docs/architecture/` on 2026-06-30 (GOV-AI1). No code, schema, runtime, or API changes.
**Canonical location:** `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
**Date:** 2026-06-23
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** rollback/source-of-truth-register-20260623 → HEAD f531216
**Scope:** Investigation only. No implementation. No code changes.

---

## PREAMBLE

This register exists because a single investigation (Pantry Knowledge Population)
revealed that **Food Knowledge alone has five separate stores** serving different
surfaces. That is not a one-off accident. It is a signal that THA has grown
without an explicit governance model for source-of-truth ownership.

The objective of this document is to answer one question with clarity:

> Can THA truthfully state: "Every core domain has a single source of truth"?

**Short answer: NO.**

This register documents every domain, every store, every duplication, every
consumer non-compliance, and every launch risk — and proposes the governance
rules that would prevent recurrence.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/source-of-truth-register-20260623` |
| Points to | HEAD `f531216` |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Pre-existing uncommitted files | `client/src/components/PantryKnowledgeHub.tsx`, `server/routes.ts` (modified), 5 untracked docs |
| Action on rollback | `git checkout rollback/source-of-truth-register-20260623` |

---

## PHASE 1 — DOMAIN INVENTORY

The following domains have been identified by reading all TypeScript files under
`server/`, `shared/`, and `client/src/`, the full database schema
(`shared/schema.ts`), and the existing investigation archive under
`docs/investigations/`.

| # | Domain | Description |
|---|--------|-------------|
| 1 | Food Knowledge (Nutrition) | Facts about foods: nutrients, benefits, "why it matters" |
| 2 | Canonical Food Identity | What is this food? Varieties, aliases, diversity group |
| 3 | Food Relationships (Graph) | How foods relate: family, season, cooking pairings |
| 4 | Plant Diversity | Which plants count? How are they grouped for the 30-plants counter? |
| 5 | Dietary Restrictions | Allergen definitions: gluten, dairy, nut, sesame, etc. |
| 6 | Dietary Rules (Pattern Matching) | Keyword logic for vegan/vegetarian/keto/dairy-free filtering |
| 7 | Dietary Preferences (User) | Per-user diet pattern and restrictions |
| 8 | Discovery | Food discovery recommendations for pantry |
| 9 | Alternatives | Goal-driven food alternative suggestions |
| 10 | Stories | Household food narrative cards |
| 11 | Seasonal Stories | Season-aware food arc cards |
| 12 | Meal Identity | Core meal record: name, ingredients, instructions |
| 13 | Meal Templates / Shell Catalogue | Reusable THA-authored meal shells |
| 14 | Planner State | Weekly planner: weeks, days, entries, eater assignments |
| 15 | Shopping State | Shopping list items, extras, fulfilment memory |
| 16 | Household Profiles | Household members, eaters, overrides |
| 17 | Nutrition Boost (Uplift) | Rules engine for adding nutritional ingredients to meals |
| 18 | Nutrition Boost Display | Client-side display data for boost ingredient context |
| 19 | Product Analysis | Barcode scan results, UPF analysis, additive detection |
| 20 | Food Additive Knowledge | Editorial explanations of food additives/categories |
| 21 | Diary | Daily food logs, metrics |
| 22 | Food Reports (Plant Diversity) | 30-plants page; which ingredients count as plants |
| 23 | Food Reports (Nutrition / Food Report) | Per-food report with nutrients, benefits, varieties |
| 24 | Ingredient Catalogue | USDA-ingested ingredient pool, classification pipeline |
| 25 | Ingredient Normalization | Canonical name resolution, alias expansion |
| 26 | Membership / Subscription | User tier: free / premium / friends_family |
| 27 | User Preferences | Non-dietary preferences: display, saved settings |

---

## PHASE 2 — SOURCE OF TRUTH DECLARATION

### Domain 1: Food Knowledge (Nutrition)

> Identifies the nutritional character of a food: its key nutrients, health benefits, "why it matters" context, and "how to choose" guidance.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS0 Knowledge Registry** (`shared/knowledge/` → DB `knowledge_foods`, `knowledge_nutrients`, `knowledge_health_benefits`, `knowledge_food_nutrients`, `knowledge_food_benefits`, `knowledge_nutrient_benefits`) |
| Read layer | `server/services/nutrition-knowledge-registry.ts` |
| Seed data | `shared/knowledge/foods.ts`, `nutrients.ts`, `health-benefits.ts`, `relationships.ts` |
| DB seed runner | `server/seeds/seed-knowledge-registry.ts` |
| Foods covered | 188 foods |
| Consumers (authoritative) | Pantry Explore (`/api/knowledge/*`), Food Report (`shared/canonical/food-report-adapter.ts`), Weekly Nutrition Report, Simply Better Choices |
| Status | **Authoritative — declared** |

---

### Domain 2: Canonical Food Identity

> Defines what a food *is*: its canonical name, category, subcategory, aliases, varieties, and which diversity group it belongs to.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS2A Canonical Seed** (`shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias`, `diversity_group`) |
| Foods covered | 239 entries in shared/canonical/foods.ts |
| Seed runner | `server/seeds/seed-canonical-food.ts` |
| Consumers | Food Report adapter, Variety surfacing, Pantry Explore drill-down |
| Status | **Authoritative — declared** |

---

### Domain 3: Food Relationships (Graph)

> Documents how foods relate to each other: same variety, same family, seasonal pairings, benefit overlaps.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS7 Food Graph** (`shared/relationships/food-graph.ts`) |
| Supplementary source | WS0 `FOOD_BENEFITS` in `shared/knowledge/relationships.ts` (benefits overlap inference) |
| Status | **Authoritative — declared** |

---

### Domain 4: Plant Diversity

> Defines the counting rules for the 30-plants-a-week feature: which ingredients count as plants, and how varieties group.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS2A Canonical → diversity_group table** (`shared/canonical/diversity-groups.ts`) |
| Status | **Contested — see Phase 3** |

---

### Domain 5: Dietary Restrictions

> Canonical allergen and intolerance definitions: what is in each restriction, what triggers it, what the safe substitutions are.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **shared/restrictions/restriction-library.ts** |
| Version | 3.0.0 (as of this register) |
| Consumers | `restriction-resolver.ts`, `restriction-safety.ts`, planner compliance gate, meal scoring |
| Status | **Authoritative — declared** |

---

### Domain 6: Dietary Rules (Pattern Matching)

> Keyword-based logic for identifying vegan, vegetarian, keto, dairy-free, gluten-free meals.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/dietRules.ts** |
| Status | **Contested — see Phase 3** |

---

### Domain 7: Dietary Preferences (User)

> Per-user dietary pattern and restriction selections.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **Contested** (`users.dietPattern` + `users.dietRestrictions` columns vs `user_preferences` table) |
| Status | **Contested — see Phase 3** |

---

### Domain 8: Discovery

> Personalised food discovery recommendations surfaced in Pantry Explore.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS8 Discovery Engine** (`shared/discovery/engine.ts`) |
| API | `GET /api/pantry/discover` (built in routes.ts using `discover()` from shared/discovery) |
| Status | **Authoritative — declared** |

---

### Domain 9: Alternatives

> Goal-driven food alternative suggestions (dietary, budget, UPF-reduction).

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS9 Alternatives Engine** (`shared/alternatives/engine.ts`) |
| API | `GET /api/pantry/alternatives` |
| Status | **Authoritative — declared** |

---

### Domain 10: Stories

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS10 Stories Engine** (`shared/stories/engine.ts`) |
| API | `GET /api/pantry/stories` |
| Status | **Authoritative — declared** |

---

### Domain 11: Seasonal Stories

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS11 Seasonal Stories Engine** (`shared/seasonal/engine.ts`) |
| API | `GET /api/pantry/seasonal` |
| Status | **Authoritative — declared** |

---

### Domain 12: Meal Identity

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `meals` table** |
| Supporting tables | `meal_categories`, `meal_diets`, `meal_allergens`, `meal_items` |
| Storage | PostgreSQL via Drizzle ORM (`shared/schema.ts`) |
| Status | **Authoritative — declared** |

---

### Domain 13: Meal Templates / Shell Catalogue

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `meal_templates` + `meal_template_products`** |
| Seed | `server/seeds/seed-meal-shell-templates.ts`, `server/lib/seed-ready-meals.ts` |
| Status | **Authoritative — declared** |

---

### Domain 14: Planner State

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `planner_weeks`, `planner_days`, `planner_entries`** |
| Supporting tables | `planner_entry_eaters`, `planner_week_eater_overrides`, `meal_plan_entries`, `meal_plans` |
| Status | **Authoritative — declared** |

---

### Domain 15: Shopping State

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `shopping_list`, `shopping_list_extras`** |
| Supporting table | `shopping_fulfilment_memory` |
| Status | **Authoritative — declared** |

---

### Domain 16: Household Profiles

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `households`, `household_members`, `household_eaters`** |
| Types | `shared/household-eater.ts` |
| Status | **Authoritative — declared** |

---

### Domain 17: Nutrition Boost (Uplift Rules)

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/uplift-rules.ts** (human-authored, requires `reviewedAt`) |
| Engine | `server/lib/uplift-engine.ts` |
| Persistence | DB: `meal_uplift_applications` |
| Status | **Authoritative — declared** |

---

### Domain 18: Nutrition Boost Display (Client-Side Ingredient Context)

> What context text to show next to a boost suggestion ingredient in the UI.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **Contested** (`nutrition-benefit-library.ts` vs WS0 Knowledge Registry) |
| Status | **Contested — see Phase 3** |

---

### Domain 19: Product Analysis

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/product-analysis.ts** + **server/lib/upf-analysis-service.ts** |
| Data stores | DB: `product_events`, `product_history`, `groceryProducts`, `productAdditives`, `additives` |
| Status | **Authoritative — declared** |

---

### Domain 20: Food Additive Knowledge

> Editorial explanations of what a food additive is and why THA highlights it.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `food_knowledge` table** |
| Seed | `server/lib/seed-food-knowledge.ts` |
| API | `GET /api/food-knowledge`, `GET /api/food-knowledge/:slug` |
| Coverage | Additives, E-numbers, food concepts |
| Status | **Authoritative — declared** |

---

### Domain 21: Diary

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `food_diary_days`, `food_diary_entries`, `food_diary_metrics`** |
| Status | **Authoritative — declared** |

---

### Domain 22: Food Reports — Plant Diversity (30 Plants)

> Which ingredients from planner/pantry count as "plants", and how many unique plants has the household eaten this week.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **Contested** (`client/src/lib/nutrition-variety.ts` keyword lists vs `diversity_group` DB table) |
| Status | **Contested — see Phase 3** |

---

### Domain 23: Food Reports — Nutrition / Food Report

> Per-food report: overview, nutrients, benefits, varieties.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **FoodReportKnowledgeAdapter** (`shared/canonical/food-report-adapter.ts`) |
| Reads from | WS2A canonical seed + WS0 knowledge seed — no duplication at query time |
| Status | **Authoritative — declared** |

---

### Domain 24: Ingredient Catalogue

> USDA-derived global food pool, normalised and scored for promotion to canonical.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **shared/catalogue/** (ingestion pipeline) |
| DB table | `ingredient_classifications` (reviewed), `normalizedIngredients` (raw) |
| Status | **Authoritative — declared** |

---

### Domain 25: Ingredient Normalization

> Resolving a raw ingredient string to a canonical key/name.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/ingredient-normalization-service.ts** |
| Supporting data | `shared/ingredient-aliases.ts`, `shared/normalize.ts` |
| Status | **Authoritative — declared** |

---

### Domain 26: Membership / Subscription

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `users.subscriptionTier` column** |
| Supporting columns | `users.subscriptionStatus`, `users.subscriptionExpiresAt` |
| Access helper | `hasPremiumAccess(user)` in routes.ts |
| Status | **Authoritative — declared** |

---

### Domain 27: User Preferences

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `user_preferences` table** |
| Contested columns | `users.dietPattern`, `users.dietRestrictions` (overlapping dietary data) |
| Status | **Contested — see Phase 3** |

---

## PHASE 3 — DUPLICATION AUDIT

### DUPLICATION 1: Food Knowledge (Nutrition) — CRITICAL

**Multiple sources? YES — 5 systems**

| System | Location | Coverage | Purpose | Status |
|--------|----------|----------|---------|--------|
| WS0 Knowledge Registry | `shared/knowledge/` → DB `knowledge_*` tables | 188 foods, structured nutrients + benefits | Primary nutrition knowledge store for Pantry Explore, Food Report | **Authoritative** |
| `pantry-knowledge.ts` | `client/src/lib/pantry-knowledge.ts` | ~50 ingredients (flat map) | Pantry inventory context: why it matters, how to choose, tags | **Parallel — not retired** |
| `nutrition-benefit-library.ts` | `client/src/lib/nutrition-benefit-library.ts` | ~25 boost ingredients | Boost ingredient display: key nutrients + one-line summary | **Parallel — not retired** |
| `pantryIngredientKnowledge` table | DB `pantry_ingredient_knowledge` | 1 row per ingredient_key | AI-enriched version of pantry-knowledge, same schema | **Parallel — enrichment cache** |
| `foodKnowledge` table | DB `food_knowledge` | Additives + food concepts | Editorial articles on additives (separate domain — additive knowledge) | Scoped correctly to additive domain |

**Overlap:** `pantry-knowledge.ts` and `nutrition-benefit-library.ts` both contain
facts about the same foods (chickpeas, walnuts, spinach, chia seeds, flaxseed,
almonds, pumpkin seeds). WS0 Registry contains all of these and more.

**Conflict Risk:** HIGH
- The three stores can and do disagree on phrasing, scope, and which nutrients
  to highlight. PlantDiversityReport uses `nutrition-benefit-library.ts`.
  Pantry inventory uses `pantry-knowledge.ts`. Pantry Explore uses WS0. Three
  different descriptions of chickpeas can appear in the same session.

**Launch Risk:** HIGH
- A user who sees "Chickpeas" in Plant Diversity (from nutrition-benefit-library)
  gets different nutrient emphasis than the same user viewing Pantry inventory
  (pantry-knowledge) vs Pantry Explore (WS0). This undermines trust.

---

### DUPLICATION 2: Dietary Rules (Pattern Matching) — MODERATE

**Multiple sources? YES — 2 copies**

| System | Location | Purpose |
|--------|----------|---------|
| `server/lib/dietRules.ts` | Server | Recipe filtering, meal scoring |
| `client/src/lib/dietRules.ts` | Client | Client-side diet checks |

**Nature of duplication:** The client file carries the comment:
> "This file is an identical copy of server/lib/dietRules.ts — pure TypeScript
> with no Node.js dependencies so it runs safely in the browser."

**Overlap:** 100% — keyword sets, logic, interfaces are identical.

**Conflict Risk:** MEDIUM
- Any change to dietary rule keywords made to server but not client (or vice
  versa) produces silent split-brain behaviour. There is no enforcement that
  they stay in sync.

**Launch Risk:** YELLOW — not an immediate user-visible consistency failure,
but a maintenance trap that will surface eventually.

---

### DUPLICATION 3: Plant Diversity Counting — MODERATE

**Multiple sources? YES — 2 systems**

| System | Location | Approach | Coverage |
|--------|----------|----------|---------|
| `nutrition-variety.ts` | `client/src/lib/nutrition-variety.ts` | Keyword word-lists (FRUITS, VEGETABLES, WHOLE_GRAINS, HERBS_SPICES, OLIVE_OIL) | ~200 ingredient strings |
| WS2A `diversity_group` table | `shared/canonical/diversity-groups.ts` → DB | Structured groups with explicit plant/non-plant membership | WS2A canonical food set |

**Overlap:** Both answer "does this ingredient count as a plant?" but by
different mechanisms. nutrition-variety.ts uses keyword matching; diversity_group
uses structured canonical records.

**Conflict Risk:** MEDIUM
- An ingredient that matches nutrition-variety.ts but has no canonical record
  will be counted in the 30-plants widget but produce an empty Food Report.
  An ingredient that is in the diversity_group DB but not in nutrition-variety.ts
  word lists will not be counted in the 30-plants counter even though it is
  a verified plant.

**Launch Risk:** YELLOW — inconsistent counts are plausible.

---

### DUPLICATION 4: Dietary Preferences (User) — LOW-MODERATE

**Multiple sources? YES — 2 locations**

| System | Location | What is stored |
|--------|----------|---------------|
| `users` table columns | `users.dietPattern`, `users.dietRestrictions` | Diet pattern + restriction array directly on users row |
| `user_preferences` table | `user_preferences` (separate table) | Richer preference set (display prefs, etc.) |

**Overlap:** Both store dietary information. `user_preferences` was created to
extend preferences beyond what fit on the users row, but dietary data now
exists in both places.

**Conflict Risk:** LOW — routes currently read from `users` columns for dietary
data, not `user_preferences`. But if a future PR writes to `user_preferences`
for dietary settings, a split-brain will emerge.

**Launch Risk:** GREEN — low immediate risk, medium future risk.

---

## PHASE 4 — RETIREMENT REGISTER

| System | Domain | Recommendation | Reason |
|--------|--------|---------------|--------|
| `nutrition-benefit-library.ts` | Food Knowledge | **Retire** | Superseded by WS0 Knowledge Registry. Covers only 25 foods vs 188. Client reads WS0 via the knowledge API or FoodReportKnowledgeAdapter. |
| `pantry-knowledge.ts` | Food Knowledge | **Merge → Retire** | The "why it matters / how to choose" content should be migrated into WS0 (as editorial `description` + `storageGuidance` fields) or into `pantryIngredientKnowledge` DB. The static file then retires. |
| `pantryIngredientKnowledge` table | Food Knowledge | **Retain as cache** | This is the correct enrichment cache pattern — lock = manual, unlocked = AI-enrichable. Once `pantry-knowledge.ts` is migrated in, this becomes the single persistence layer. |
| `foodKnowledge` table | Food Additive Knowledge | **Retain** | Different domain (additives/concepts, not ingredient-level nutrition). Not a duplicate. |
| `client/src/lib/dietRules.ts` | Dietary Rules | **Retire** | Move to `shared/` as a single module imported by both server and client. Eliminates the copy-paste maintenance risk. |
| `nutrition-variety.ts` | Plant Diversity | **Migrate → Retire** | Plant classification should derive from WS2A canonical + diversity_group. nutrition-variety.ts keyword lists are a prototype-era workaround that pre-dates the canonical model. |
| `users.dietPattern` / `users.dietRestrictions` | Dietary Preferences | **Retain** | These columns are the current live path — do not change without a migration strategy. Mark them as the SoT until user_preferences is promoted. |

---

## PHASE 5 — CONSUMER COMPLIANCE AUDIT

For each consumer, verify: does it read from the declared authoritative source?

### Food Knowledge Consumers

| Consumer | Domain SoT (declared) | Actual source used | Compliant? |
|----------|----------------------|--------------------|-----------|
| `PlantDiversityReport.tsx` | WS0 Knowledge Registry | `nutrition-benefit-library.ts` | **NO** |
| `MealUpliftPanel.tsx` | WS0 Knowledge Registry | `nutrition-benefit-library.ts` | **NO** |
| `PantryExplore.tsx` | WS0 Knowledge Registry | `health-benefits-model.ts` → both nutrition-benefit-library AND pantry-knowledge | **PARTIAL** |
| `PantryKnowledgeHub.tsx` | WS0 Knowledge Registry | `health-benefits-model.ts` → nutrition-benefit-library + pantry-knowledge | **PARTIAL** |
| `FoodReport.tsx` | WS0 Knowledge Registry | `food-report-adapter.ts` → WS0 + canonical | **YES** |
| `pantry-page.tsx` | WS0 Knowledge Registry | `pantry-knowledge.ts` | **NO** |
| `health-benefits-model.ts` | WS0 Knowledge Registry | Bridges both `pantry-knowledge.ts` and `nutrition-benefit-library.ts` | **NO** |
| `server/services/nutrition-knowledge-registry.ts` | WS0 Knowledge Registry | WS0 DB tables directly | **YES** |
| `GET /api/knowledge/*` routes | WS0 Knowledge Registry | `nutrition-knowledge-registry.ts` | **YES** |

---

### Dietary Rules Consumers

| Consumer | Domain SoT (declared) | Actual source | Compliant? |
|----------|----------------------|---------------|-----------|
| `server/lib/meal-scoring-service.ts` | `server/lib/dietRules.ts` | server/lib/dietRules.ts | **YES** |
| `server/lib/smart-suggest-service.ts` | `server/lib/dietRules.ts` | server/lib/dietRules.ts | **YES** |
| Client-side components | `server/lib/dietRules.ts` | `client/src/lib/dietRules.ts` (copy) | **NO** — uses copy, not canonical |

---

### Plant Diversity Consumers

| Consumer | Domain SoT (declared) | Actual source | Compliant? |
|----------|----------------------|---------------|-----------|
| `PlantDiversityReport.tsx` | diversity_group DB + canonical | `nutrition-variety.ts` (keyword lists) | **NO** |
| `plant-diversity-page.tsx` | diversity_group DB + canonical | `nutrition-variety.ts` | **NO** |
| `FoodReport.tsx` varieties | diversity_group DB + canonical | `food-report-adapter.ts` → WS2A canonical | **YES** |

---

### Dietary Preferences Consumers

| Consumer | SoT (declared) | Actual source | Compliant? |
|----------|---------------|---------------|-----------|
| Planner compliance gate | `users.dietRestrictions` | reads users table | **YES** |
| Smart suggest service | `users.dietPattern` / `users.dietRestrictions` | reads users table | **YES** |
| Profile page save | users table | writes users table | **YES** |
| `user_preferences` table | Secondary | limited usage | Not in conflict currently |

---

## PHASE 6 — ARCHITECTURE GOVERNANCE RULES

The following rules are proposed as mandatory for all future THA development.

---

### Rule 1: Every Major Domain Must Declare a Source of Truth

Every domain listed in Phase 1 must have an explicit, named Source of Truth.
The name must be a file path or DB table name — never a vague description.

> _"We use the knowledge registry"_ is not acceptable.
> _"`shared/knowledge/` → DB `knowledge_*` tables, read via `nutrition-knowledge-registry.ts`"_ is acceptable.

---

### Rule 2: Every Architecture Proposal Must Answer the Replacement Question

Before any new system is created that stores domain data, the proposal must answer:

**"Does this replace an existing store?"**

- If **YES**: a retirement plan for the replaced store must be included in the same prompt/PR.
- If **NO**: proof must be provided that the new store is genuinely a different domain.

---

### Rule 3: No Parallel Stores for the Same Domain

Two stores that answer the same question about the same domain are not permitted.
If a temporary store is created (e.g. as a prototype), it must have a named
retirement condition in the same document that created it.

---

### Rule 4: No Identical File Copies

If a module is needed in both server and client, it must be moved to `shared/`
and imported from there. Copying a file and adding "identical copy of X" is
not a valid solution — it creates a maintenance trap.

> **Applies immediately to:** `client/src/lib/dietRules.ts`

---

### Rule 5: Consumers Must Read from the Authoritative Source

No consumer is permitted to read domain data from a non-authoritative source
once the authoritative source exists and is reachable.

Exceptions require explicit written justification in the relevant investigation
document, naming the blocked technical dependency.

---

### Rule 6: Static Client Files Are Not Knowledge Stores

Client-side `.ts` files containing data maps (like `LIBRARY: NutritionBenefit[]`
or `PANTRY_KNOWLEDGE: Record<string, PantryKnowledge>`) are not authoritative
knowledge stores. They are read-only display fragments appropriate only during
prototype phases.

Any data that:
- Overlaps with content in the WS0 Knowledge Registry, OR
- Will need to grow beyond 20–30 entries, OR
- Will need to be enriched or corrected after launch

...must live in the database, not in a client file.

---

### Rule 7: The SoT Register Must Be Updated at Every Workspace

Before any new workspace (WSN) is considered complete, the lead investigation
document for that workspace must include a section:

```
DOMAIN IMPACT
Which domains does this workspace touch?
Does it create a new store? [YES/NO]
Does it retire an existing store? [YES/NO]
Does it introduce a consumer? Which source does it read from?
Is that source the declared SoT?
```

If any answer is YES/NO and creates a duplication, the workspace is incomplete.

---

### Rule 8: Governance Review Before Any New Knowledge Store

Before any new table, file, or module that stores editorial knowledge data is
created, a governance check must be performed:

1. Is there an existing store for this domain? (Check this register.)
2. If yes: why is the existing store insufficient?
3. If the existing store is insufficient: what is the retirement plan?

This check must be documented in the investigation document.

---

## PHASE 7 — LAUNCH RISK REVIEW

| Domain | Risk | Reason |
|--------|------|--------|
| Food Knowledge — three stores active | 🔴 Launch Risk | User sees different nutrient descriptions of the same food across surfaces (PlantDiversity vs Pantry vs Explore). Undermines trust. Directly visible. |
| Dietary Rules — duplicate files | 🟡 Important | Silent split-brain risk if dietary keyword changes are made to one file but not the other. Not currently visible but inevitable. |
| Plant Diversity — two counting mechanisms | 🟡 Important | An ingredient could be counted in the 30-plants counter (nutrition-variety.ts) but produce no data in the Food Report (not in canonical). Visible inconsistency. |
| Dietary Preferences — two storage locations | 🟢 Safe | Currently no live split-brain. Risk is future, not present. |

---

### Launch Risk Detail: Food Knowledge

**Why this is 🔴:**

In a single user session it is possible to see:

1. Pantry inventory row → `pantry-knowledge.ts`: _"Chickpeas: high in soluble fibre, good source of plant protein"_
2. Plant Diversity Report → `nutrition-benefit-library.ts`: _"Chickpeas: High in plant protein and fibre. Counts towards weekly plant diversity."_
3. Pantry Explore → WS0 Registry (via API): _"Chickpeas: Versatile legumes high in fibre and plant protein"_

Three different phrasings. Consistent topic — but inconsistent language. A user
who reads all three will notice. A user who trusts THA will wonder which is "right".

---

## PHASE 8 — MIGRATION ROADMAP

**NOTE: This is a plan only. No implementation is authorised by this document.**

---

### Migration M1: Retire `nutrition-benefit-library.ts`

| Step | Description |
|------|-------------|
| 1. Target architecture | All boost ingredient display reads from WS0 Knowledge Registry via `nutrition-knowledge-registry.ts` or a new client-accessible endpoint |
| 2. Migration approach | Add a `GET /api/knowledge/foods/:slug` response path for the 25 boost ingredients; update `MealUpliftPanel.tsx` and `PlantDiversityReport.tsx` to use the API or a shared adapter |
| 3. Verification | Compare WS0 output for each of the 25 foods against current library output; confirm no regressions in Boost panel or Plant Diversity |
| 4. Retirement | Delete `nutrition-benefit-library.ts`; remove all imports |
| Estimated prompts | 2–3 (adapter update, consumer updates, verification) |
| Effort | Low — the WS0 data already covers all 25 foods |
| Risk | Low — WS0 is already seeded and tested |

---

### Migration M2: Retire `pantry-knowledge.ts`

| Step | Description |
|------|-------------|
| 1. Target architecture | All pantry inventory knowledge reads from `pantryIngredientKnowledge` DB table; `pantry-knowledge.ts` content is seeded into that table |
| 2. Migration approach | (a) Write a one-time seed that inserts each `PANTRY_KNOWLEDGE` entry into `pantry_ingredient_knowledge` with `enrichmentSource='manual'` and `isLocked=true`; (b) Update `pantry-page.tsx` to call the existing `/api/pantry/ingredient-knowledge/:key` endpoint instead of importing the static file; (c) Update `health-benefits-model.ts` to read from the API |
| 3. Verification | For each of the ~50 pantry ingredients, confirm DB row matches static file content |
| 4. Retirement | Delete `pantry-knowledge.ts`; remove all imports |
| Estimated prompts | 3–4 (seed script, page updates, model updates, verification) |
| Effort | Medium — requires seed script, API wiring, client refactor |
| Risk | Medium — pantry-page.tsx is a high-traffic surface; requires careful regression testing |

---

### Migration M3: Move `dietRules.ts` to `shared/`

| Step | Description |
|------|-------------|
| 1. Target architecture | `shared/dietRules.ts` (single file, no Node.js dependencies) imported by both server and client |
| 2. Migration approach | Move `server/lib/dietRules.ts` to `shared/dietRules.ts`; update all imports on server and client; delete `client/src/lib/dietRules.ts` |
| 3. Verification | Run all diet-related tests; verify server and client use identical logic |
| 4. Retirement | `client/src/lib/dietRules.ts` deleted; `server/lib/dietRules.ts` deleted |
| Estimated prompts | 1 (straightforward file move + import update) |
| Effort | Very low |
| Risk | Low — pure refactor, no logic change |

---

### Migration M4: Replace `nutrition-variety.ts` Plant Counting with Canonical

| Step | Description |
|------|-------------|
| 1. Target architecture | 30-plants counter derives plant status from WS2A `diversity_group` table (via API or shared seed) |
| 2. Migration approach | (a) Expose a `GET /api/canonical/plants` endpoint returning all slugs with diversityGroupSlug != null; (b) Client caches this at session start; (c) Replace nutrition-variety.ts word-list matching with canonical slug lookup after normalization |
| 3. Verification | Test each ingredient currently counted in 30-plants against new canonical lookup; ensure no regressions in counter or category display |
| 4. Retirement | Delete `nutrition-variety.ts`; remove all imports |
| Estimated prompts | 4–5 (API endpoint, normalization bridge, client refactor, verification) |
| Effort | Medium-High — the normalization bridge (raw string → canonical slug) is the hard part |
| Risk | Medium — 30-plants is a prominent launch feature; any regression is visible |

---

## FINAL QUESTION

**Can THA truthfully state: "Every core domain has a single source of truth"?**

## NO.

---

### Exceptions Ordered by Risk

| # | Domain | Duplication | Risk |
|---|--------|-------------|------|
| 1 | Food Knowledge (Nutrition) | nutrition-benefit-library.ts + pantry-knowledge.ts + WS0 Registry (+ pantryIngredientKnowledge DB) | 🔴 LAUNCH RISK |
| 2 | Plant Diversity Counting | nutrition-variety.ts (keyword) vs diversity_group DB (canonical) | 🟡 IMPORTANT |
| 3 | Dietary Rules | server/lib/dietRules.ts + client/src/lib/dietRules.ts (identical copy) | 🟡 IMPORTANT |
| 4 | Dietary Preferences (User) | users.dietPattern/dietRestrictions + user_preferences table | 🟢 SAFE (for now) |

---

## DEFINITION OF DONE — VERIFICATION

| Requirement | Status |
|-------------|--------|
| Complete domain inventory | ✅ 27 domains identified |
| Source of Truth Register created | ✅ All 27 domains declared |
| Duplicate systems identified | ✅ 4 duplications found |
| Consumer compliance audit completed | ✅ See Phase 5 |
| Retirement register completed | ✅ 7 systems assessed |
| Governance rules defined | ✅ 8 rules defined (Phase 6) |
| Launch risks identified | ✅ 1 red, 2 yellow, 1 green |
| Migration roadmap created | ✅ 4 migrations defined (Phase 8) |

---

## APPENDIX A — QUICK REFERENCE: AUTHORITATIVE SOURCES

| Domain | Source of Truth |
|--------|----------------|
| Food Knowledge (Nutrition) | `shared/knowledge/` → DB `knowledge_*` tables via `nutrition-knowledge-registry.ts` |
| Canonical Food Identity | `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias` |
| Food Relationships | `shared/relationships/food-graph.ts` |
| Plant Diversity | DB `diversity_group` (via WS2A canonical) ← **NOT yet enforced** |
| Dietary Restrictions | `shared/restrictions/restriction-library.ts` |
| Dietary Rules (pattern) | `server/lib/dietRules.ts` ← **duplicated in client** |
| Dietary Preferences (user) | DB `users.dietPattern` + `users.dietRestrictions` |
| Discovery | `shared/discovery/engine.ts` |
| Alternatives | `shared/alternatives/engine.ts` |
| Stories | `shared/stories/engine.ts` |
| Seasonal Stories | `shared/seasonal/engine.ts` |
| Meal Identity | DB `meals` table |
| Meal Templates | DB `meal_templates` |
| Planner State | DB `planner_weeks`, `planner_days`, `planner_entries` |
| Shopping State | DB `shopping_list`, `shopping_list_extras` |
| Household Profiles | DB `households`, `household_members`, `household_eaters` |
| Nutrition Boost Rules | `server/lib/uplift-rules.ts` |
| Nutrition Boost Display | ← **CONTESTED: retire nutrition-benefit-library.ts → use WS0** |
| Product Analysis | `server/lib/product-analysis.ts` + `server/lib/upf-analysis-service.ts` |
| Food Additive Knowledge | DB `food_knowledge` table |
| Diary | DB `food_diary_days`, `food_diary_entries`, `food_diary_metrics` |
| Plant Diversity Report | ← **CONTESTED: retire nutrition-variety.ts → use diversity_group** |
| Food Report (Nutrition) | `shared/canonical/food-report-adapter.ts` (reads WS2A + WS0) |
| Ingredient Catalogue | `shared/catalogue/` → DB `ingredient_classifications` |
| Ingredient Normalization | `server/lib/ingredient-normalization-service.ts` |
| Membership | DB `users.subscriptionTier` column |
| User Preferences | DB `user_preferences` table |
| Attention Vocabulary (levels, rank, labels, `critical` allowlist) | `shared/attention/index.ts` (ATTN1, 2026-07-09 — reference vocabulary per Principle 5; replaced the three module-local priority unions/rank maps in FI4, OD1 and the Notice Engine; no DB owner — `opportunity_deliveries.priority` remains a non-authoritative snapshot) |
| Decision mechanics (attention ordering, delivery budget clamp, id dedupe, `EvidenceCitation`) | `shared/attention/decision.ts` (DEC1, 2026-07-09 — reference mechanics per Principle 5; replaced the three module-local sort/clamp/dedupe/evidence copies in FI4, OD1 and the Notice Engine, golden-identity tested byte-identical) |
| Decision Engine (ambient surfacing: eligibility, muting, lifecycle suppression, learning re-weight, rank, budget, surface routing, sealed `DeliveryDecision`) | `server/intelligence/opportunity-delivery/framework.ts` (OD1 framework, designated canonical by DEC1 2026-07-09 — governance: `THA_DECISION_ENGINE_ARCHITECTURE.md`; the decision record is a `delivery-decision` observation, never a table, and nothing reads it back) |

---

## APPENDIX B — SYSTEMS IDENTIFIED AS PROTOTYPES NOW NEEDING RETIREMENT

These existed for valid reasons at time of creation. They should not be extended.
Retirement is the correct path.

1. `client/src/lib/nutrition-benefit-library.ts` — 2026-06 prototype, pre-WS0
2. `client/src/lib/pantry-knowledge.ts` — 2026-06 prototype, pre-pantryIngredientKnowledge
3. `client/src/lib/nutrition-variety.ts` — 2026-06 prototype, pre-WS2A canonical
4. `client/src/lib/dietRules.ts` — copy of server file, pre-shared/ modularisation

---

## APPENDIX C — GOVERNANCE CHECKLIST FOR FUTURE INVESTIGATIONS

Copy this into any investigation document that introduces a new data store or
consumes domain data:

```
GOVERNANCE GATE
===============

Domain affected: [name]
Declared SoT: [file path or DB table]
New store created? YES / NO
  If YES: retirement plan for any replaced store: [plan or N/A]
Existing store extended? YES / NO
Consumer created? YES / NO
  If YES: reads from declared SoT? YES / NO
    If NO: blocked by: [technical dependency]
          Resolution plan: [plan]
```

---

*No code was changed in the production of this document.*
*All findings are based on reading the current state of the codebase.*
*Rollback: `git checkout rollback/source-of-truth-register-20260623`*
