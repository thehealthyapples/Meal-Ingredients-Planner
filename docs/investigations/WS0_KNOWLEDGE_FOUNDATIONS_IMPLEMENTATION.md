# WS0 — Knowledge Foundations: Implementation Report

**Date:** 2026-06-18
**Status:** Complete — additive only, no behavioural change.

The shared **Nutrition Knowledge Registry** — editorial nutrition knowledge that
will power Plant Diversity Tier B, Pantry Explore / Nutrition Knowledge Hub, the
Weekly Nutrition Report, Health Benefits, Simply Better Choices and
Recommendation Stage 1. This is **not** pantry inventory and **not** recipe
storage. It is human-curated, deterministic, explainable knowledge.

---

## 1. Rollback identifier

| | |
|---|---|
| **Rollback tag** | `rollback/ws0-knowledge-foundations-20260618-172210` |
| **Commit** | `bae3b992e021abe32182dcf13f9aff7f1e708a95` |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |

Created **before** any implementation, with a clean tracked working tree (only
pre-existing untracked `docs/investigations/*.md` files were present).

**To roll back the code:**

```bash
git reset --hard rollback/ws0-knowledge-foundations-20260618-172210
```

**To roll back the database** (additive tables — safe to drop, nothing else
references them):

```sql
DROP TABLE IF EXISTS knowledge_nutrient_benefits;
DROP TABLE IF EXISTS knowledge_food_benefits;
DROP TABLE IF EXISTS knowledge_food_nutrients;
DROP TABLE IF EXISTS knowledge_health_benefits;
DROP TABLE IF EXISTS knowledge_nutrients;
DROP TABLE IF EXISTS knowledge_foods;
DELETE FROM schema_migrations WHERE id = '2026-06-18_ws0_knowledge_registry';
```

No existing table, column or row is touched by this work, so a rollback cannot
affect the planner, restrictions, scoring, recommendations or Nutrition Boost.

---

## 2. Schema

Six new tables, all prefixed `knowledge_`. Entities are addressed by a stable,
human-readable `slug` so seed data and relationships stay editable by hand.
Every table carries `source` and `is_active` so any record can be sourced,
edited or retired.

### Entities

- **`knowledge_foods`** — `id, slug (unique), name, category, subcategory,
  aliases[], description, image_url, common_forms[], storage_guidance,
  seasonality, source, display_order, is_active, created_at`
- **`knowledge_nutrients`** — `id, slug (unique), name, description, category,
  source, display_order, is_active, created_at`
- **`knowledge_health_benefits`** — `id, slug (unique), name, description, icon,
  source, display_order, is_active, created_at`

### Relationships

- **`knowledge_food_nutrients`** — `food_slug → nutrient_slug`, plus optional
  `amount`, `confidence` (`established|good|emerging`), `ranking`, `source`.
  Unique on `(food_slug, nutrient_slug)`.
- **`knowledge_food_benefits`** — `food_slug → benefit_slug`, plus
  `evidence_strength`, `ranking`, `source`. Unique on `(food_slug, benefit_slug)`.
- **`knowledge_nutrient_benefits`** — `nutrient_slug → benefit_slug`, plus
  `evidence_strength`, `ranking`, `source`. Unique on `(nutrient_slug, benefit_slug)`.

All relationship slugs are foreign keys (`ON DELETE CASCADE`) onto the entity
`slug` columns, so the registry can never hold dangling references.

> **`evidence_strength` is STORED ONLY.** It must not be surfaced to users yet.
> The retrieval layer provides display-safe helpers that strip it (see §6).

**Files:**
- `shared/schema.ts` — Drizzle table definitions, `createInsertSchema` insert
  schemas, and `Insert*`/`Select*` types (appended; nothing existing changed).
- `server/migrations/runner.ts` — migration `2026-06-18_ws0_knowledge_registry`
  (idempotent `CREATE TABLE IF NOT EXISTS`), appended to the end of `MIGRATIONS`.
  Applies automatically on server boot.

---

## 3. Seed strategy

The **editorial source of truth** lives in typed, hand-editable TypeScript under
`shared/knowledge/`:

- `health-benefits.ts` — **15** benefits
- `nutrients.ts` — **30** nutrients
- `foods.ts` — **51** foods across all eight launch categories (Healthy fats,
  Seeds, Legumes, Fermented foods, Herbs, Mushrooms, Vegetables, Fruit)
- `relationships.ts` — compact `slug → [slug]` maps (array order = `ranking`)
- `index.ts` — expands the maps into typed insert rows, exposes
  `validateKnowledgeSeed()` and `KNOWLEDGE_SEED_COUNTS`

Seeded counts: **51 foods · 30 nutrients · 15 benefits · 165 food↔nutrient ·
137 food↔benefit · 68 nutrient↔benefit**.

The seed runner `server/seeds/seed-knowledge-registry.ts` (`npm run
seed:knowledge`):

1. Runs `validateKnowledgeSeed()` and **refuses to seed** on any dangling or
   duplicate slug — the registry can never enter an inconsistent state.
2. **Upserts** every row (`ON CONFLICT … DO UPDATE`) keyed by slug / relationship
   pair. Editing the data files and re-running brings the DB back in line —
   idempotent, no duplicates. Verified: a second run leaves all counts unchanged.

---

## 4. Editorial rules (Trust Check)

The registry is **human-curated, deterministic and explainable**. Content is
food-positive ("what can we add?"), never medical.

- **Could this fabricate certainty?** No. Associations are conservative and
  well-established; `confidence`/`evidence_strength` are explicit, editable
  editorial signals, not generated probabilities.
- **Could this make medical claims?** No. Descriptions are educational and framed
  around what foods *contribute*. No disease cures, treatments or dosing.
- **Could the user edit or correct the knowledge?** Yes. Every row has a `source`
  and `is_active`; the data files are the editable source of truth and re-seeding
  applies edits.

No AI generates content here — the seed is curated by hand, and the registry is
**not** wired to any AI path.

---

## 5. Files changed

**Edited (additive only):**
- `shared/schema.ts` — 6 tables + insert schemas + types
- `server/migrations/runner.ts` — 1 appended migration
- `package.json` — `seed:knowledge`, `test:knowledge-registry` scripts

**New:**
- `shared/knowledge/{foods,nutrients,health-benefits,relationships,index}.ts`
- `server/services/nutrition-knowledge-registry.ts` — retrieval helpers
- `server/seeds/seed-knowledge-registry.ts` — idempotent seed runner
- `server/tests/test-knowledge-registry.ts` — verification test
- `docs/investigations/WS0_KNOWLEDGE_FOUNDATIONS_IMPLEMENTATION.md` — this report

No existing file's logic was modified. The planner, restriction engine, meal
scoring, recommendation ranking and Nutrition Boost are untouched and unaware of
this layer.

---

## 6. Retrieval helpers

`server/services/nutrition-knowledge-registry.ts` is the single read-only access
point. It exposes typed storage and retrieval only — no behavioural hooks.

- Entities: `listFoods({category?, includeInactive?})`, `getFoodBySlug`,
  `listNutrients`, `getNutrientBySlug`, `listHealthBenefits`,
  `getHealthBenefitBySlug`
- Relationships: `getNutrientsForFood`, `getBenefitsForFood`,
  `getBenefitsForNutrient`, `getFoodsForNutrient`, `getFoodsForBenefit`
- **Display-safe:** `getFoodBenefitsForDisplay`, `getNutrientBenefitsForDisplay`
  return benefits with `evidenceStrength` removed, so it can never reach the UI
  through the recommended path.

All results are ordered by `ranking` (then `display_order`/name), giving callers
deterministic "top nutrients / benefits" lists.

---

## 7. Manual tests

`npm run test:knowledge-registry` — **23 passed, 0 failed**:

- Editorial integrity (no dangling/duplicate slugs), minimum counts (≥50 / ≥30 /
  ≥15), all eight categories present, every food has ≥1 nutrient and ≥1 benefit
  link, every relationship row carries a source.
- Live DB helpers: `listFoods` returns seeded rows; `getFoodBySlug`;
  pumpkin-seeds → magnesium link present; nutrient links ranked; **display
  helpers omit `evidenceStrength`** while internal helpers retain it; reverse
  lookup foods-for-nutrient works.

Also verified:
- `tsc --noEmit` — no new type errors from any WS0 file (pre-existing errors in
  unrelated files remain, unchanged by this work).
- Migration applies cleanly on boot; seed runs and is idempotent (counts stable
  across two runs).

---

## 8. Future extension points

- **More foods/nutrients/benefits:** add rows to the `shared/knowledge/*` data
  files and re-run `npm run seed:knowledge`. Validation guards integrity.
- **Per-row sourcing:** populate `source` (e.g. NHS Eatwell, BNF) and `amount`
  per relationship as editorial review deepens.
- **Surfacing evidence strength:** when an editorial policy for displaying
  evidence exists, extend the display-safe helpers — the data is already stored.
- **Consuming systems** read exclusively through
  `server/services/nutrition-knowledge-registry.ts`. Wiring into Plant Diversity
  Tier B, Pantry Explore, the Weekly Nutrition Report etc. is deliberately left
  to their own work-streams; WS0 only provides storage + retrieval.
- **Linking to inventory:** a future bridge can map canonical ingredient keys /
  `pantry_ingredient_knowledge` to `knowledge_foods.slug` without changing this
  schema.

---

## Data impact

| | |
|---|---|
| Reads existing data | No |
| Writes new data | Yes (new `knowledge_*` tables only) |
| Changes meaning of existing data | No |
| Requires backfill | No |
