# WS0X — Food Intelligence Expansion Program

**Type:** Investigation and Architecture Plan
**Date:** 2026-06-24
**Status:** Investigation only — no implementation, no seeding, no promotion, no schema changes
**Branch:** safety/preserve-since-last-prod-20260617-1613

---

## ROLLBACK CONFIRMATION

### Git status at investigation time

Branch has seven modified tracked files (UI components and services from prior work) and eleven untracked investigation docs. No new food data has been written.

### WS0 seed protection confirmed

`shared/knowledge/foods.ts` — 188 curated foods, unmodified.
`shared/knowledge/nutrients.ts` — 30 nutrients, unmodified.
`shared/knowledge/health-benefits.ts` — 15 health benefits, unmodified.

### M1A protection confirmed

`server/seeds/seed-knowledge-registry.ts` — idempotent seed runner intact.
`server/services/nutrition-knowledge-registry.ts` — read-only registry service intact.

### Rollback tag created

```
ws0x-pre-expansion-rollback-20260624
```

Points to `HEAD` of branch `safety/preserve-since-last-prod-20260617-1613` at the moment of investigation.

To return to this exact state:

```
git checkout ws0x-pre-expansion-rollback-20260624
```

**No work was begun before this confirmation.**

---

## EXECUTIVE SUMMARY

THA currently operates 188 curated foods in the WS0 Knowledge Registry. A complete catalogue pipeline (WS0.10–WS0.12) has already been designed and piloted. The USDA FoodData Central dataset provides a validated, ingredient-level source of approximately 2,075 unique foods after strict filtering. A 500-food pilot proved the pipeline is safe: zero branded foods leaked, zero Foundation macros were overwritten, and 8 foods were identified as immediately ready for canonical promotion.

**The system can safely expand from 188 to approximately 2,000 foods using the current architecture with targeted schema additions.** Reaching 10,000 would require a second data source (UK National Nutrient Databank or equivalent).

The path is governed, demand-first, and fully rollbackable at every step.

---

## PHASE 1 — CATALOGUE SIZE AUDIT

### 1.1 WS0 Knowledge Registry (authoritative)

| Table | Records | Role | Authoritative | Feeds WS0 |
|---|---|---|---|---|
| `knowledge_foods` | 188 | Live food intelligence | YES | IS WS0 |
| `knowledge_nutrients` | 30 | Nutrient taxonomy | YES | IS WS0 |
| `knowledge_health_benefits` | 15 | Benefit taxonomy | YES | IS WS0 |
| `knowledge_food_nutrients` | ~260 est. | Food↔nutrient links | YES | IS WS0 |
| `knowledge_food_benefits` | ~370 est. | Food↔benefit links | YES | IS WS0 |
| `knowledge_nutrient_benefits` | ~45 est. | Nutrient↔benefit links | YES | IS WS0 |

Source: `shared/knowledge/` editorial files. Seeded idempotently by `server/seeds/seed-knowledge-registry.ts`.

### 1.2 Canonical Food Spine

| Table | Purpose | Authoritative | Feeds WS0 |
|---|---|---|---|
| `canonical_food` | Food identity spine. tier='canonical' or tier='catalogue'. | YES (canonical tier) | Via `knowledge_food_slug` FK |
| `food_variety` | Varieties (Braeburn apple, chicken thigh). Child of canonical_food. | YES | No direct WS0 link yet |
| `canonical_food_alias` | All aliases with unique `alias_key` anti-fork lock. | YES | No direct WS0 link yet |

**Current canonical_food row counts:** Not queryable without a DB connection. Based on pilot script output, WS0.11 `--write` mode would produce rows with `tier='catalogue'`. As of this investigation the pilot write has not been confirmed as run against production.

### 1.3 USDA FoodData Central (available, not yet ingested beyond pilot)

| Source | Total records | Available ingredient-level | Notes |
|---|---|---|---|
| Foundation Foods (2025-04-24) | 340 | ~340 (all pass strict filter) | Highest quality; full macros |
| SR Legacy (2021-10-28) | 7,793 | ~1,735 (after filter chain) | Broader coverage; some older data |
| **Combined unique** | **8,133** | **~2,075** | After dedup across sources |

Filter chain applied to SR Legacy (sequential):
- skip_category (not ingredient-level): −3,064
- skip_branded_prepared: −112
- skip_excessive_qualifiers (>4 comma segments): −2,827
- skip_dupe_desc: −55
- **Remaining: ~1,735**

Foundation passes all filters: ~340.

Combined after inter-source dedup: **~2,075 unique ingredient-level foods.**

Source: `data/usda-snapshot/build-snapshot.py`, `data/usda-snapshot/ws011-ingestion-report.json`.

### 1.4 Existing Pilot Snapshot

| File | Foods | Coverage |
|---|---|---|
| `data/usda-snapshot/ws011-usda-500.json` | 500 | 246 Foundation + 254 SR Legacy |
| `data/usda-snapshot/ws011-ingestion-report.json` | 500 processed | Full ingestion trace |
| `data/usda-snapshot/ws012-normalisation-report.json` | 500 processed | Normalisation + promotion scores |

### 1.5 Supporting Tables (not WS0, not canonical)

| Table | Records | Role | Feeds WS0 |
|---|---|---|---|
| `normalized_ingredients` | Unknown | Simple name→normalizedName lookup | NO |
| `ingredient_classifications` | Unknown | AI-classified ingredient names, pending review | NO |
| `food_knowledge` | Unknown | Older editorial article format (different schema) | NO |
| `pantry_ingredient_knowledge` | Unknown | Pantry-specific enrichment per ingredient key | NO |

These tables are **not authoritative food identities**. They are secondary enrichment or legacy lookups. They are distinct from and do not feed WS0 today.

### 1.6 Meal and Pantry Ingredients

| Table | Role | Feeds WS0 |
|---|---|---|
| `meals.ingredients` | Raw ingredient strings from user-logged meals | NO |
| `user_pantry_items` | User pantry stock | NO |
| `shopping_list` | Shopping items | NO |
| `planner_entries` | Planned meals | NO |

These carry raw ingredient text. They are demand signal sources (how often a food appears), not food identity sources.

### 1.7 Duplicate Rate in USDA Dataset

From the 500-food pilot:
- 184 of 500 (36.8%) matched existing WS0 canonical foods via slug, alias, or scientific name
- Within-batch slug collisions in the pilot: 7 (resolved by keeping first occurrence)
- Duplicate risk (proposed slug = existing matched slug): 0
- Collapsed foods in WS0.12: 12 (variety/form collapsed to parent)

Extrapolated to full 2,075-food dataset: approximately 700–800 foods will match existing WS0 entries (THA's 188 foods are drawn from the most common foods; many USDA entries are variants of the same). Estimated **~1,200–1,500 net new unique foods** from USDA alone.

### 1.8 NHS / UK Data Sources

No NHS-derived data files were found in the repository. A UK National Nutrient Databank (McCance and Widdowson) integration does not exist. Reaching 5,000–10,000 foods would require this source. It is **not currently available in the codebase.**

---

## PHASE 2 — PROMOTION STATUS AUDIT

Based on code analysis and WS0.11–WS0.12 pilot data, all food identities across THA map to:

### Category A — Already live in WS0

**Count: 188**

The 188 foods in `shared/knowledge/foods.ts`. Fully curated, with nutrients, benefits, descriptions, storage guidance, seasonality, and aliases. Seeded into `knowledge_foods` and all six WS0 tables.

### Category B — Canonical but not live in WS0

**Count: Unknown (estimated 50–200)**

Foods in `canonical_food` with `tier='canonical'` that have a `knowledgeFoodSlug` FK pointing to a WS0 food that does not exist yet, or canonical foods with no WS0 link at all. These have a canonical identity spine but no editorial intelligence layer.

From the pilot, 184 matched existing WS0 slugs — meaning some canonical foods exist that are already WS0-linked. The gap is: canonical foods that were promoted as part of the spine architecture but never received WS0 editorial content.

### Category C — Catalogue-known but not canonical

**Count: ~295–316 from pilot; ~1,500–1,700 from full USDA**

Foods that passed the ingestion pipeline with action `create_catalogue` or `review_required`. These have:
- A proposed slug and UK-English name
- USDA nutrient data (macros)
- A THA category and (often) subcategory
- A promotion readiness score (mean: 60.7/100 from pilot)

From the pilot's 295 new entries:
- 8 were `ready_for_canonical` (score ≥ 90, name auto-quality, ≥4 macros, category mapped)
- 257 were `ready_for_claude_authoring` (score 50–89; sufficient signal for AI to draft content)
- 30 were `needs_tha_review` (score <50 or name needs manual work)

### Category D — Raw ingredient only

**Count: High (thousands)**

Raw ingredient strings in `meals.ingredients`, `user_pantry_items`, `shopping_list`. Not food identities — these are user-entered text. Some are already covered by WS0 aliases. Others are product names, branded items, or composites.

These are demand signal sources, not promotion candidates directly. They feed the `ingredient_classifications` table when processed.

### Category E — Product ingredient, not food identity

**Count: Unknown (estimated thousands)**

Items in `grocery_products`, `shopping_list`, `meal_template_products` that are products (branded, packaged, portion-specific). Not eligible for WS0 promotion. Examples: "Heinz Baked Beans 415g", "Warburtons Medium Sliced Bread".

### Category F — Duplicate / alias candidate

**Count: ~700–800 from full USDA**

USDA entries that resolve to existing WS0 canonical foods via slug, alias, or scientific name. These should be captured as additional aliases on the existing canonical food, not promoted as new identities.

### Category G — Unsafe / not edible / not relevant

**Count: Blocked by pipeline filters (thousands in raw USDA)**

Blocked by `prepared-food-filter.ts` (composite dishes), category filter (baby foods, snacks, beverages, sweets), and brand/excessive-qualifier filters. Zero leaked into the pilot catalogue.

### Summary Table

| Category | Estimated Count | Next Action |
|---|---|---|
| A. Live in WS0 | 188 | Maintain and expand via editorial |
| B. Canonical, no WS0 | 50–200 | Author WS0 content |
| C. Catalogue-known, not canonical | 1,500–1,700 (full USDA) | Promote via pipeline |
| D. Raw ingredient only | Thousands | Demand signal only |
| E. Product ingredient | Thousands | Do not promote |
| F. Duplicate / alias candidate | 700–800 | Add aliases to existing canonical |
| G. Unsafe / not relevant | Blocked | Pipeline self-protects |

---

## PHASE 3 — QUALITY TIERS

### Tier 1 — WS0 Editorial Core (current + near-term)

**Target size: 200–400 foods**

The current 188 foods plus the ~50–200 foods in Category B that need WS0 content authored. These are the highest-confidence, most commonly eaten UK household foods.

**Must have:**
- Canonical name (UK English)
- 3+ aliases (including plurals and common forms)
- THA category and subcategory
- Macros: energy, protein, fat, carbs, fibre (per 100g)
- 2+ health benefits (from the 15-benefit taxonomy)
- 2+ nutrients (from the 30-nutrient taxonomy)
- Human-authored description (2–3 sentences, plain language)
- Storage guidance
- Seasonality
- Common forms

**Authoring path:** Human editorial or Claude-authored with human sign-off.

---

### Tier 2 — USDA Whole-Food Promotion (ready_for_claude_authoring)

**Target size: 400–1,500 foods**

Foods from the USDA Foundation and SR Legacy datasets that score ≥50 on the promotion readiness rubric. Pipeline has already classified these as having sufficient signal for AI to draft content.

**Must have:**
- Canonical name (auto or review quality)
- THA category (not "Other")
- ≥3 of 5 key macros present (energy, protein, fat, carbs, fibre)
- Proposed slug that passes dedup check

**May have (via Claude authoring):**
- Basic description (1–2 sentences; no medical claims)
- Mapped benefits from existing taxonomy
- Mapped nutrients from existing taxonomy
- Common aliases

**Authoring path:** Claude authors from USDA nutrient data + THA taxonomy. THA admin reviews batch before promotion to canonical.

---

### Tier 3 — Varieties and Forms

**Target size: 200–500 foods**

Foods that are forms or varieties of Tier 1/2 parents. Examples: Braeburn apple, chicken thigh, red pepper, chestnut mushroom, tinned chickpeas.

**Classification decision (must be made per food):**

| Decision | Description | Counts for Diversity |
|---|---|---|
| Separate canonical + WS0 | Nutritionally distinct variety | YES (separate) |
| food_variety child | Same nutrition, different presentation | NO (inherits parent) |
| Alias on parent | Name variant, identical food | NO |
| Separate canonical, parent alias | Different name, same nutrients | NO |

**Rule of thumb:** If the nutritional profile differs meaningfully (red vs. green pepper, chicken thigh vs. breast) → separate canonical. If it is the same food in a different format (tinned vs. fresh chickpeas, dried vs. soaked lentils) → alias or variety.

---

### Tier 4 — Specialist and Obscure Foods

**Target size: 100–300 foods**

Safe, edible, real foods with low household demand signal. Examples: maca powder, jackfruit, cassava, ackee.

**Must have:**
- Canonical name and slug
- Category
- Basic macros (at least energy and protein)

**Promotion gate:** Demand signal required before authoring WS0 content. These sit in `canonical_food` with `tier='catalogue'` until a household has them in pantry or diary.

---

### Tier 5 — Products and Processed Foods

**Do not promote into WS0.**

Branded, packaged, or composite foods. These live in `grocery_products`, `shopping_list`, and `meal_template_products`. They should not acquire WS0 identity.

**Exception:** A processed food with a clear whole-food identity claim (e.g. "100% peanuts" peanut butter) may be flagged for human review. It does not auto-promote.

---

## PHASE 4 — AUTO-PROMOTION RULES

### What Claude can author safely (without per-item human review)

Claude can author the following from USDA nutrient data + THA taxonomy alone, given that the food has passed the ingestion pipeline with `ready_for_claude_authoring` status:

| Field | Claude can author? | Source |
|---|---|---|
| `name` (UK English) | YES, if name quality is "auto" | Pipeline normaliser |
| `slug` | YES | nameToSlug(normalisedName) |
| `category` | YES, if mapped (not "Other") | Pipeline category mapper |
| `subcategory` | YES, if mapped | Pipeline category mapper |
| `aliases` | YES (from aliasCandidates in pipeline) | Pipeline name normaliser |
| `description` | YES, conservative 2-sentence draft | USDA category + nutrient data |
| `nutrients` (which from taxonomy) | YES, based on macro presence | USDA nutrient IDs |
| `benefits` (which from taxonomy) | YES, from nutrient→benefit links already in registry | knowledge_nutrient_benefits |
| `seasonality` | YES for known seasonal foods; "Year-round" otherwise | Category-based heuristic |
| `commonForms` | YES, 1–2 obvious forms | Category-based heuristic |
| `storageGuidance` | YES, category-level guidance | Category-based heuristic |
| `macros per 100g` | YES, from USDA | USDA nutrient IDs 1008/1003/1004/1005/1079 |

### What requires human review before promotion

| Trigger | Reason |
|---|---|
| Name quality = "review" | Pipeline flagged phrasing as ambiguous or unusual |
| Promotion score < 50 | Insufficient signal; risk of fabrication |
| Category = "Other" | Category not mapped; THA taxonomy gap |
| Scientific name conflict | Potential misidentification |
| Allergen relevance (tree nuts, shellfish, gluten, dairy) | Medical safety risk; human must confirm |
| Animal product claim | Diet compliance accuracy required |
| Any benefit outside the 15-benefit taxonomy | New benefit needs editorial approval before adding |

### What must be blocked (never auto-promoted)

| Block | Reason |
|---|---|
| Branded / trademark names | Products, not food identities |
| Prepared / composite foods | Pipeline already blocks; double-checked at seed |
| Baby foods and supplements | Not a THA food category |
| Any food with `confidence = "low"` AND no human review | Too much uncertainty |
| Any food whose name ends with preparation qualifier after normalisation | Signals a form, not an identity |
| Foods with `promotionScore < 30` | Below minimum viability |

### Draft seeding (pre-promotion holding state)

Foods that pass the pipeline with `action="create_catalogue"` or `action="review_required"` should enter `canonical_food` with:
- `tier = 'catalogue'`
- `status = 'draft'`
- No `knowledgeFoodSlug` link (not yet in WS0)
- Source attribution: `"USDA FDC import"`

They are invisible to all user-facing surfaces in this state. Draft ≠ live.

---

## PHASE 5 — TRUST AND SAFETY RULES

### The principle

WS0 editorial content must be conservative, plain-language, and unable to be mistaken for medical advice. These rules apply to every food, whether authored by humans or Claude.

### Approved wording patterns

**Nutrients:**
- "Provides fibre." ✓
- "A source of plant protein." ✓
- "Contains magnesium and zinc." ✓
- "Rich in unsaturated fats." ✓
- "One of the few plant sources of omega-3." ✓

**Benefits (linking a food to a benefit):**
- "Supports gut health via prebiotic fibre." ✓
- "Associated with heart health." ✓
- "Used in the body for energy and cell repair." ✓

**Descriptions:**
- "A legume rich in fibre and plant protein, commonly used in soups and curries." ✓
- "A leafy green providing folate and vitamin C." ✓

### Blocked wording patterns

| Pattern | Block reason |
|---|---|
| "Prevents [disease]" | Medical claim |
| "Cures / treats / heals" | Medical claim |
| "Superfood" | Exaggerated marketing |
| "Boosts immunity" | Exaggerated health claim |
| "Detoxifies" | Pseudoscientific |
| "Best source of..." (without qualification) | False certainty |
| "Safe for everyone" | Allergen assumption |
| "Eat more of this to lose weight" | Diet culture |
| "Clinically proven" | Medical claim |
| Precise nutrient amounts (e.g. "contains 4.2g of fibre per 30g") for auto-authored foods | Fabricated precision |

### Allergen rules

- Never assert a food is allergen-free without explicit editorial review.
- Foods in allergen categories (tree nuts, shellfish, gluten-bearing grains, dairy, eggs, soya, peanuts, sesame, celery, mustard, sulphites, lupin, molluscs) must be flagged in the review queue, not auto-promoted.
- Do not surface allergen status in auto-authored WS0 descriptions. The allergen system is a separate, authoritative system.

### Benefit taxonomy gate

- Only the 15 health benefits already in `knowledge_health_benefits` may be linked to foods.
- No new benefit slugs are created during expansion.
- If a food's primary benefit does not fit the existing taxonomy, it enters the `needs_tha_review` stage. A THA editor decides whether to extend the taxonomy.

### Evidence strength

- `evidenceStrength` on food↔benefit links is stored but must not be surfaced to users (this boundary already exists in `nutrition-knowledge-registry.ts`).
- Auto-authored links use `evidenceStrength = 'emerging'` (the most conservative level).
- Upgrading to `'established'` requires human editorial sign-off.

---

## PHASE 6 — DATA MODEL REVIEW

### Current knowledge_foods schema

```
knowledge_foods:
  id            serial PK
  slug          text UNIQUE NOT NULL
  name          text NOT NULL
  category      text NOT NULL
  subcategory   text
  aliases       text[] DEFAULT '{}'
  description   text
  imageUrl      text
  commonForms   text[] DEFAULT '{}'
  storageGuidance text
  seasonality   text
  source        text DEFAULT 'THA editorial'
  displayOrder  integer DEFAULT 0
  isActive      boolean DEFAULT true
  createdAt     timestamp
```

### Can this table support 2,000–10,000 foods?

**Yes, with additions.** The schema is relational and correct. Four improvements are recommended before scaling:

#### Addition 1: Macro nutrients column on knowledge_foods (SUGGESTION)

Currently macros (energy, protein, fat, carbs, fibre) live in USDA data but are not stored in `knowledge_foods`. The food detail view gets nutrients from `knowledge_food_nutrients` (which maps to the 30-slug nutrient taxonomy, not raw USDA macros).

For Tier 2 auto-promoted foods, raw per-100g macro figures from USDA should be stored. Two options:

**Option A:** Add `macros` JSONB column to `knowledge_foods`.
- `{ energyKcal, proteinG, fatG, carbsG, fibreG }` per 100g
- Simple to query; searchable via JSON operators
- Consistent with USDA provenance

**Option B:** Create a separate `knowledge_food_macros` table with foreign key to slug.
- More normalised; allows per-macro source attribution
- More complex to join

**Recommendation: Option A** (JSONB column). Macros are always read as a unit; normalisation buys nothing here.

#### Addition 2: Search index on knowledge_foods.name and aliases (SUGGESTION)

Current search in `searchKnowledgeRegistry()` loads ALL foods into memory and filters in JavaScript. At 188 foods this is acceptable. At 2,000+ it is not.

Required additions:
- Full-text index on `name` (pg `tsvector`)
- GIN index on `aliases` array column
- Server-side search function using `to_tsvector` + `@>` operator

Without this, each search call at 2,000 foods loads ~200KB of food rows. At 10,000 foods: ~1MB per call.

#### Addition 3: Status field on knowledge_foods (SUGGESTION)

Currently `isActive` is a boolean. For graduated promotion (draft → review → live), a `status` text field is needed:
- `'draft'` — seeded by pipeline, not user-visible
- `'review'` — submitted for editorial review
- `'active'` — live and user-visible (default)
- `'retired'` — removed from active display (preserves history)

`isActive` could be derived from `status = 'active'`, or kept as a materialized boolean for query simplicity. Both work.

#### Addition 4: sourceRef and tier fields on knowledge_foods (SUGGESTION)

For traceability of auto-promoted foods:
- `sourceRef text` — e.g., `"USDA:167762"`, `"THA editorial"`, `"UK NDNS:A01234"`
- `tier text` — mirrors canonical_food tier: `'editorial'` | `'catalogue'`

This separates "foods Colin curated" from "foods the pipeline promoted" without breaking any existing query.

### Relationship tables

`knowledge_food_nutrients`, `knowledge_food_benefits`, `knowledge_nutrient_benefits` are already normalised correctly. They will scale to 2,000–10,000 foods without schema changes. At 10,000 foods with 3 nutrients and 2 benefits each:
- `knowledge_food_nutrients`: ~30,000 rows
- `knowledge_food_benefits`: ~20,000 rows

Both are small in relational terms. PG handles this comfortably.

### Unique constraints

- `knowledge_foods.slug` is UNIQUE — correct; prevents duplicates
- `knowledge_food_nutrients` has `uq_knowledge_food_nutrient` on (foodSlug, nutrientSlug) — correct
- `knowledge_food_benefits` has `uq_knowledge_food_benefit` on (foodSlug, benefitSlug) — correct
- `canonical_food_alias.alias_key` is UNIQUE — the anti-fork lock; correct

### No schema changes are needed to begin promotion to 2,000 foods.

The four additions above are recommended before going beyond 2,000 foods, particularly the search index (Addition 2).

---

## PHASE 7 — SURFACE READINESS REVIEW

### Surface × Readiness Matrix

| Surface | Current WS0 Consumption | Ready now | Needs API support | Needs UI support | Risk of clutter |
|---|---|---|---|---|---|
| **Pantry Explore** | YES — search, categories, food cards, detail | YES | Search index at scale | None | LOW (browse by category) |
| **Pantry Knowledge Hub** | YES — ingredient lookup by key | YES | None | None | LOW |
| **Nutrition Report / Plant Diversity** | YES — ingredient → WS0 batch lookup | YES | None | None | LOW |
| **Meal Detail / Uplift Panel** | YES — ingredient → WS0 nutrients+benefits | YES | None | None | LOW |
| **Stories (WS10)** | YES — food identity via discovery engine | YES | More foods = richer stories | None | LOW |
| **Seasonal Stories (WS11)** | YES — seasonal arcs | YES (more foods expand coverage) | Seasonality field on new foods | None | LOW |
| **Food Alternatives (WS9)** | YES — alternatives() API | YES (more foods = more alternatives) | None | None | LOW |
| **Food Discovery (WS8)** | YES — discover() API | YES | None | None | LOW |
| **Dashboard** | Indirect (via stories, boosts) | YES | None | None | LOW |
| **Cookbook** | NO — meal ingredients don't query WS0 directly | Not applicable | None | None | None |
| **Planner** | NO — planner does not query WS0 | Not applicable | None | None | None |
| **Smart Planner** | NO — restriction engine is separate | Not applicable | None | None | None |
| **Shopping** | NO — shopping list items don't query WS0 | Not applicable | None | None | None |
| **Analyser** | Partial — ingredient lookup for knowledge | Possible | Ingredient matching to WS0 | None | MEDIUM (clutters if partial match) |
| **Diary** | NO — diary does not query WS0 | Not applicable | None | None | None |
| **Food Reports** | Partial — canonical_food feeds food report pages | YES | WS0 link on canonical | WS0 enrichment on food report page | LOW |

### Key observations

**Already consumption-ready (expand transparently):**

Pantry Explore, Pantry Knowledge Hub, Nutrition Report, Meal Detail, Stories, Seasonal Stories, Alternatives, Discovery — all consume WS0 through `nutrition-knowledge-registry.ts`. Adding more foods expands their coverage automatically. No UI changes required.

**Analyser risk:**

The Analyser matches product ingredients against WS0. With 2,000+ foods, partial-match false positives may increase. A minimum-confidence threshold on ingredient matching should be in place before expanding Analyser coverage.

**Planner / Smart Planner / Shopping / Diary:**

These surfaces do not consume WS0 food intelligence today. They are out of scope for this expansion. Do not wire them to WS0 during this phase.

**Food Reports:**

Currently fed by `canonical_food`. Adding a `knowledgeFoodSlug` link from canonical to WS0 will automatically enrich food report pages with WS0 intelligence. This is the correct integration point.

---

## PHASE 8 — PERFORMANCE REVIEW

### Risk inventory at 2,000–10,000 foods

#### Critical risk: in-memory search

`searchKnowledgeRegistry()` in `server/services/nutrition-knowledge-registry.ts` (line 250–273) calls `listFoods()` with no filter and loads the entire food table into memory, then filters in JavaScript.

At 188 foods: ~20KB in memory, fast.
At 2,000 foods: ~200KB, acceptable.
At 10,000 foods: ~1MB per search call, unacceptable at any meaningful request rate.

**Must fix before 2,000+ goes live:** Move to server-side ILIKE or full-text search with a tsvector index. Return a maximum of 20–30 results per search.

#### Medium risk: batch ingredient lookup

`resolveIngredientsToKnowledgeSummary()` (line 382–439) also calls `listFoods()` to build a lookup map, then runs N concurrent DB queries (one per matched slug). At 188 foods, this is fast. At 2,000 foods, building the lookup map is still fast (it's just a JavaScript Map), but the N concurrent queries could fan out. A `WHERE foodSlug IN (...)` batch query should replace the `Promise.all` of individual lookups.

#### Low risk: food list browse

`listFoods()` with a category filter is a simple `SELECT WHERE category = ?`. With 2,000–10,000 foods and a B-tree index on category, this is fast. Adding `displayOrder` and `name` ordering is also indexed-friendly.

#### Low risk: food detail view

`getFoodDetailView()` is a point lookup by slug (unique index) plus two JOIN queries. Fast at any scale.

#### Low risk: dashboard story calls

Stories are authored by the WS8–WS11 engines and reference food slugs. The slug-based lookups are O(1). No risk.

#### Low risk: pantry explore browsing

Category-browse is fast. The search box is the risk (see Critical above).

### Recommendations

| Risk | Fix | Priority |
|---|---|---|
| searchKnowledgeRegistry loads all foods | Server-side ILIKE / tsvector index, LIMIT 30 | BEFORE 2,000 foods live |
| batch ingredient lookup uses N concurrent queries | Replace with IN-clause batch query | BEFORE 5,000 foods live |
| listFoods() has no cache | Add short-lived server-side cache (5 min TTL) for category browsing | BEFORE 10,000 foods live |
| API payload for /api/knowledge/foods | Add pagination (?page=&limit=) and/or category filter enforcement | BEFORE 5,000 foods live |
| Food images at scale | Lazy-load; placeholder until image resolved | Before UI expansion |

---

## PHASE 9 — PROMOTION PIPELINE DESIGN

### Pipeline overview (already substantially built)

The catalogue pipeline at `shared/catalogue/pipeline.ts` implements six of the seven stages. Stage 7 (WS0 seeding from catalogue) is the missing step.

```
External Source (USDA FDC JSON)
        ↓
[Stage 1] prepared-food-filter.ts
  — Block composite dishes, branded products, infant foods
        ↓
[Stage 2] alias-resolver.ts
  — US→UK name mapping
  — Check against canonical index (slug + alias + scientific name)
  — If match → action="matched_existing" (alias enrichment only)
        ↓
[Stage 3] deduplicator.ts
  — Slug, alias_key, scientific_name dedup check
        ↓
[Stage 4] category-mapper.ts
  — USDA category → THA category + subcategory
  — Confidence: "mapped" | "keyword_hint" | "ambiguous"
        ↓
[Stage 5] name-normaliser.ts + macro-fallback.ts
  — Produce normalisedName, nameQuality, aliasCandidates
  — Fill missing macros from SR Legacy or category-derived fallback
        ↓
[Stage 6] confidence-scorer.ts
  — Score 0–100, level: high | medium | low
  — action: "create_catalogue" | "review_required"
        ↓
[Stage 7] promotion-readiness.ts
  — promotionScore: 0–100
  — promotionStage: ready_for_canonical | ready_for_claude_authoring | needs_tha_review
        ↓
canonical_food (tier='catalogue', status='draft')   ← WS0.11 --write does this
        ↓
[NEW Stage 8] Claude Authoring Service (not yet built)
  — Input: canonical_food row (tier='catalogue', promotionStage='ready_for_claude_authoring')
  — Output: InsertKnowledgeFood + food↔nutrient links + food↔benefit links
  — Trust rules enforced (no medical claims, no new benefits, conservative wording)
        ↓
Draft WS0 food (status='draft' in knowledge_foods)
        ↓
[NEW Stage 9] Admin Review Queue (not yet built)
  — Batch review of drafted foods
  — Approve → status='active' (goes live in WS0)
  — Reject → status='rejected' (stays in canonical as tier='catalogue' only)
  — Edit → human edits description/benefits before approval
        ↓
knowledge_foods (status='active', isActive=true)
        ↓
[Verification] verify-promotion.ts (not yet built)
  — Assert: no medical claims in descriptions
  — Assert: all benefit slugs exist in knowledge_health_benefits
  — Assert: all nutrient slugs exist in knowledge_nutrients
  — Assert: slug matches canonical_food slug
  — Assert: knowledgeFoodSlug on canonical_food is set
        ↓
WS0 Live — surfaces consume via nutrition-knowledge-registry.ts
```

### Services and functions needed (not yet built)

| Service | File location (proposed) | Input | Output |
|---|---|---|---|
| Claude Authoring Service | `server/services/food-knowledge-author.ts` | `CatalogueIngestionResult` + taxonomy | `InsertKnowledgeFood` + nutrient/benefit links |
| Admin Review Queue | `server/routes/knowledge-admin.ts` | Draft foods | Approve/reject/edit actions |
| Promotion Seeder | `server/scripts/ws0x-promote-batch.ts` | Batch of catalogue slugs | Writes to knowledge_foods (draft) |
| Promotion Verifier | `server/scripts/ws0x-verify-promotion.ts` | knowledge_foods (draft) | Pass/fail safety check |
| Rollback Script | Built into promotion seeder | Source tag | Deletes draft batch |

### Admin review points

1. **After catalogue ingestion** — THA reviews `needs_tha_review` foods (30 per 500-food batch)
2. **After Claude authoring** — THA reviews batch of drafted WS0 foods before activating
3. **After promotion** — Verification script asserts safety invariants

### Rollback approach

All promotion writes are tagged with a batch source string (e.g. `"WS0X batch 1 — USDA Foundation 2026-06-24"`). A rollback script deletes all `knowledge_foods` rows with that source tag, and sets `knowledgeFoodSlug = NULL` on the affected `canonical_food` rows. The canonical spine is not deleted (it can be re-promoted later).

Rollback is safe at any stage:
- Draft in knowledge_foods: delete the rows
- Active in knowledge_foods: set `isActive = false` → surfaces immediately see zero results for those foods
- canonical_food rows with tier='catalogue': delete or set status='retired'

---

## PHASE 10 — PHASED IMPLEMENTATION ROADMAP

### Step 0 — Pre-conditions (before any food is promoted)

**Risk:** LOW
**Data impact:** None (schema additions only)
**Effort:** 1–2 days

Tasks:
1. Add server-side search to `searchKnowledgeRegistry()` (ILIKE + limit, or tsvector)
2. Add `status` text field to `knowledge_foods` (draft | review | active | retired)
3. Add `sourceRef` and `tier` fields to `knowledge_foods`
4. Add `macros` JSONB column to `knowledge_foods`
5. Run existing seed to verify no regressions on 188 existing foods

Verification:
- `npm run seed:knowledge` succeeds
- All 188 foods remain active
- Search returns correct results
- No surface regressions

---

### Step 1 — Catalogue Size Audit (database)

**Risk:** READ ONLY
**Data impact:** None
**Effort:** Half a day

Run the existing `ws011-usda-ingestion.ts` in analysis mode (no `--write`) against the full USDA dataset to produce an exact count of:
- Total USDA foods available
- Foods matching existing WS0 (alias enrichment queue)
- Foods at each promotion stage
- Foods in each THA category

This gives an exact promotion queue before any writes.

Verification:
- Report file written to `data/usda-snapshot/ws0x-full-audit-report.json`
- No DB writes

---

### Step 2 — Alias Enrichment (matched foods)

**Risk:** LOW
**Data impact:** Additive only — new aliases on existing canonical_food_alias
**Effort:** 1 day

For the ~700–800 USDA foods that matched existing WS0 entries, extract new alias candidates from USDA descriptions and add them to `canonical_food_alias`. This improves ingredient matching without touching WS0.

Prompts required: none (deterministic pipeline output)

Verification:
- `canonical_food_alias` row count increases
- No existing aliases removed
- Search recall test: check 10 common alias variants resolve correctly

---

### Step 3 — Promote Tier 2: First 500 catalogue foods

**Risk:** MEDIUM
**Data impact:** ~500 new rows in `knowledge_foods` (status='draft' initially)
**Effort:** 2–3 days

Process:
1. Run full USDA ingestion in `--write` mode → populates `canonical_food` (tier='catalogue')
2. Run Claude Authoring Service on `ready_for_canonical` foods (8 from pilot; ~40–80 from full dataset) → creates `knowledge_foods` rows with status='review'
3. Run Claude Authoring Service on `ready_for_claude_authoring` foods, limited to 500 highest-priority by promotion queue ranking → status='review'
4. THA admin reviews batch (expected: 5–15% edits, 2–5% rejections)
5. Activate approved foods → status='active'

Prompts required: Claude Authoring Service prompt (designed in Step 0 prep)

Risk mitigation: draft and review stages mean zero user-visible change until admin activates

Verification:
- Verification script passes all safety invariants
- 188 existing foods unchanged
- Search returns new foods correctly
- No benefit slugs outside the 15-benefit taxonomy
- No medical claims in any description

---

### Step 4 — Promote Tier 2: Next 1,000 catalogue foods

**Risk:** MEDIUM
**Data impact:** ~1,000 new rows
**Effort:** 2–3 days

Same pipeline as Step 3. Focus on `ready_for_claude_authoring` foods with the next-highest demand signals.

Verification:
- Same as Step 3
- Performance check: search and list-foods response times < 200ms

---

### Step 5 — Promote Tier 3: Varieties and Forms

**Risk:** MEDIUM
**Data impact:** ~200–500 new `food_variety` rows + alias enrichment
**Effort:** 3–5 days (classification decisions are manual)

This step requires human decision-making for each variety:
- Does "Braeburn apple" become a separate WS0 food or a `food_variety` child of apple?
- Does "chicken thigh" become a separate WS0 food (different macros from breast) or an alias?

A classification worksheet must be created before writes. No auto-promotion for varieties.

Verification:
- Plant diversity counter unchanged for existing foods
- Meal Detail uplift panel shows correct food (not variety) when matched
- Stories engine handles varieties without duplicate stories

---

### Step 6 — Expose intelligence across top five surfaces

**Risk:** LOW
**Data impact:** Read only
**Effort:** 1–2 days

With 2,000+ foods live, verify the top five intelligence surfaces are consuming expanded data correctly:

1. Pantry Explore — browse and search all new foods
2. Nutrition Report — plant diversity counts new foods correctly
3. Meal Detail — ingredient lookup covers new foods
4. Stories engine — new foods appear in discovery and alternatives
5. Seasonal Stories — new foods appear in seasonal arcs where seasonality is set

---

### Step 7 — Scale to 5,000–10,000 (future; requires second data source)

**Risk:** HIGH
**Data impact:** Requires NHS / UK NDNS integration
**Effort:** 5–10 days (data acquisition + pipeline extension)

USDA alone cannot provide 10,000 ingredient-level foods. A UK source is required. The most authoritative is McCance and Widdowson's composition of foods (UK NDNS). This requires:
- Data acquisition agreement or public-domain download
- Pipeline extension for UK food naming and category mapping
- Performance additions (Step 0 search fix is mandatory before this step)

This step is out of scope for the current expansion and requires a separate investigation.

---

## PHASE 11 — GOVERNANCE GATE

### Source of Truth Register update

| Domain | Food Knowledge |
|---|---|
| Declared SoT | WS0 Knowledge Registry (`knowledge_foods` and related tables) |
| New store created? | NO |
| Existing store extended? | YES — `knowledge_foods` receives new rows via promotion pipeline |
| New consumer created? | NO — all surfaces already consume via `nutrition-knowledge-registry.ts` |
| Reads from declared SoT? | YES — all reads go through the registry service |
| Exception | NONE |

### What this expansion does NOT create

- No new food knowledge table
- No new static food knowledge file on the client
- No new client-side map or library
- No parallel ingestion system
- No alternative food facts endpoint

Every new food goes through the same `knowledge_foods` table and is served by the same `nutrition-knowledge-registry.ts` service.

### What the promotion pipeline adds

A write path that did not previously exist: `shared/catalogue/pipeline.ts` → `canonical_food` (tier='catalogue') → Claude Authoring → `knowledge_foods` (status='draft') → admin review → `knowledge_foods` (status='active').

This is an extension of WS0, not a new system.

---

## FINAL QUESTION

> Can THA safely expand from 188 foods to 2,000–10,000 foods using the current architecture?

### YES

**The safe path to 2,000 foods:**

1. The catalogue ingestion pipeline (WS0.10–WS0.12) is already built and proven in a 500-food pilot.
2. The USDA dataset is available and provides ~2,075 unique ingredient-level foods after strict filtering.
3. The promotion readiness rubric already scores foods and routes them correctly (ready_for_canonical, ready_for_claude_authoring, needs_tha_review).
4. The `canonical_food` table already has a `tier` field that separates catalogue foods from live canonical foods.
5. The trust rules in the pipeline already block branded products, composite dishes, and low-confidence foods.
6. The only missing pieces are: a Claude Authoring Service, an Admin Review Queue, and a Promotion Seeder/Verifier — all of which are well-defined and low-risk.

**The caveat for 10,000 foods:**

Reaching 10,000 requires a second data source (UK NDNS). This is a separate investigation. USDA alone supports approximately 1,700–2,200 unique foods including the existing 188.

**The two non-negotiable prerequisites before any food is promoted:**

1. Server-side search must replace the in-memory `listFoods()` filter in `searchKnowledgeRegistry()`.
2. The `status` field must be added to `knowledge_foods` so draft foods cannot accidentally go live.

Both are schema additions, not architectural changes.

**Summary:** Architecture is sound. Data source is available. Pipeline is built. Trust rules are defined. The expansion path is governed, demand-first, rollbackable at every stage, and does not require a new system. The safe path from 188 to 2,000 is approximately three weeks of implementation work.

---

## DEFINITION OF DONE — CHECKLIST

- [x] Catalogue size known (USDA: ~2,075 ingredient-level foods available; ~1,500–1,700 net new)
- [x] WS0 gap quantified (188 live; ~1,500–1,700 ready to promote from USDA)
- [x] Promotion categories defined (A through G, with counts)
- [x] Quality tiers defined (Tier 1 through Tier 5)
- [x] Auto-promotion rules defined (what Claude can author; what needs review; what is blocked)
- [x] Trust rules defined (approved/blocked wording patterns; allergen rules; benefit gate)
- [x] Data model assessed (current schema sufficient; four additions recommended)
- [x] Performance assessed (critical: in-memory search fix before scale; others low risk)
- [x] Surface readiness mapped (13 surfaces reviewed; immediate consumers identified)
- [x] Phased roadmap created (7 steps from 188 to 2,000+)
- [x] No implementation performed
- [x] No foods seeded
- [x] No foods promoted
- [x] No schema changes made
- [x] No UI changes made

---

## APPENDIX — KEY FILES

| File | Purpose |
|---|---|
| `shared/knowledge/foods.ts` | WS0 food seed (188 foods, authoritative) |
| `shared/knowledge/nutrients.ts` | WS0 nutrient seed (30 nutrients) |
| `shared/knowledge/health-benefits.ts` | WS0 benefit seed (15 benefits) |
| `shared/knowledge/relationships.ts` | Food↔nutrient, food↔benefit, nutrient↔benefit links |
| `shared/knowledge/index.ts` | Seed validation + expansion |
| `server/seeds/seed-knowledge-registry.ts` | Idempotent UPSERT seed runner |
| `server/services/nutrition-knowledge-registry.ts` | Read-only registry service (all surface consumption) |
| `shared/catalogue/pipeline.ts` | Full ingestion pipeline (7 stages) |
| `shared/catalogue/promotion-readiness.ts` | Promotion scoring + queue ranking |
| `shared/catalogue/alias-resolver.ts` | US→UK name resolution + canonical lookup |
| `shared/catalogue/deduplicator.ts` | Slug/alias/scientific name dedup |
| `shared/catalogue/category-mapper.ts` | USDA→THA category mapping |
| `shared/catalogue/confidence-scorer.ts` | Confidence scoring |
| `shared/catalogue/name-normaliser.ts` | Name normalisation + alias harvesting |
| `shared/catalogue/macro-fallback.ts` | Missing macro completion |
| `shared/catalogue/prepared-food-filter.ts` | Composite dish blocking |
| `server/scripts/ws011-usda-ingestion.ts` | USDA ingestion pilot (analysis + write modes) |
| `server/scripts/ws012-normalisation.ts` | WS0.12 normalisation + promotion scoring |
| `data/usda-snapshot/ws011-usda-500.json` | 500-food USDA pilot snapshot |
| `data/usda-snapshot/ws011-ingestion-report.json` | WS0.11 full ingestion trace |
| `data/usda-snapshot/ws012-normalisation-report.json` | WS0.12 normalisation + promotion report |
| `shared/schema.ts` | All DB table definitions |

---

*Investigation only. No implementation performed. Report complete.*
*Rollback tag: `ws0x-pre-expansion-rollback-20260624`*
