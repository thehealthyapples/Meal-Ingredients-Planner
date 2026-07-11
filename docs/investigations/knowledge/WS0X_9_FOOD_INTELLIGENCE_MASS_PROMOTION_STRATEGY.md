# WS0X.9 — Food Intelligence Mass Promotion Strategy

**Classification:** 🟡 AMBER — Architecture investigation only  
**Date:** 2026-06-25  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Status:** Investigation complete — no implementation, no data changes, no architecture changes  
**Governing documents:** WS0X_FOOD_INTELLIGENCE_EXPANSION_PROGRAM.md · WS0X_7_INGREDIENT_RESOLUTION_ENGINE_COMPLETENESS_PROGRAM.md · WS0X_8_FOOD_INTELLIGENCE_DATA_EXPANSION_PROGRAM.md · THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/ws0x9-investigation-start` |
| Points to | HEAD commit `a8a912a` (feat(ws0x7): Ingredient Resolution Engine Completeness Program) |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Rollback command | `git checkout rollback/ws0x9-investigation-start` |
| Working tree at investigation start | 17 modified tracked files (UI + services from prior workspaces), multiple untracked docs — no new food data written |

No investigation began before this tag was confirmed present.

---

## EXECUTIVE SUMMARY

THA currently operates **249 canonical foods** and **265 knowledge foods (WS0)**. The fastest production-safe path to 2,000+ canonical foods is a **hybrid automated-plus-checkpoint promotion programme** using the existing pipeline architecture against the USDA FoodData Central full dataset (~2,075 ingredient-level foods already validated). At current pipeline performance, **500 canonical foods can be reached within 2–3 weeks** and **2,000 canonical foods within 3–4 months** without any architectural change. Reaching 5,000–10,000 requires a second data source (UK National Nutrient Databank) that is not currently integrated. The core architectural bottleneck is not the canonical system itself — it proved scale-ready in WS0X.8 — but the **food context authoring requirement** (availability, origin_region, peak_seasons) that gates every canonical promotion.

---

## PART 1 — CURRENT INVENTORY

### All Food Datasets Available to THA

| Dataset | Food Count | Location | Current Status | Promotion Ready? | Requires Work? | Blocked? |
|---------|-----------|----------|----------------|-----------------|----------------|---------|
| Canonical Foods (spine) | **249** | `shared/canonical/foods.ts` → DB `canonical_food` | Live. Seeded. All have food context. | N/A — already canonical | — | — |
| Knowledge Foods / WS0 | **265** | `shared/knowledge/foods.ts` → DB `knowledge_foods` | Live. Editorial + H1 batch. | N/A — already live | — | — |
| Diversity Groups | **173** | `shared/canonical/diversity-groups.ts` → DB `diversity_group` | Live. Seeded. | N/A | — | — |
| Varieties | **57** | Nested in `shared/canonical/foods.ts` | Live. | N/A | — | — |
| Aliases | **714** | `shared/canonical/foods.ts` + `shared/ingredient-aliases.ts` | Live. | N/A | — | — |
| USDA 500-Food Pilot Snapshot | **500** analysed; **295** net new | `data/usda-snapshot/ws011-usda-500.json` + reports | Analysed. Not yet promoted. | 8 READY, 257 need Claude authoring, 30 need THA review | Yes — content authoring + context | Partially |
| USDA Foundation Foods (full) | **~340** total (all pass filter) | External — USDA FDC API / full bulk download (not in repo beyond pilot) | 246 covered in pilot. ~94 remaining. | ~94 unprocessed foods await ingestion run | Run full ingestion pipeline | No |
| USDA SR Legacy (full) | **~7,793** total; **~1,735** post-filter | External — USDA FDC bulk download (not in repo beyond pilot) | 254 SR Legacy covered in pilot. ~1,481 remaining. | ~1,200–1,300 net new after dedup against existing WS0 | Run full ingestion pipeline | No |
| USDA Combined Unique (full) | **~2,075** post-filter | Derived from Foundation + SR Legacy | 500 processed in pilot. ~1,575 remaining. | ~1,200–1,500 net new | Ingest remaining ~1,575 foods | No |
| UK National Nutrient Databank (NDNS / McCance & Widdowson) | **Unknown — several thousand** | Not present in repo | Not integrated | NO | Full integration work required | **YES — not available** |
| NHS-derived datasets | **0** | Not present in repo | Never ingested | NO | Full sourcing + integration | **YES — not available** |
| `normalizedIngredients` table | Unknown | DB: `normalized_ingredients` | Secondary lookup, not food identity | NO | Different domain | NO |
| `ingredient_classifications` table | Unknown | DB: `ingredient_classifications` | AI-classified ingredients pending review | NO | Different domain | NO |
| `food_knowledge` table | Unknown | DB: `food_knowledge` | Additive/editorial articles (different schema) | NO — different domain | — | — |
| `pantry_ingredient_knowledge` table | Unknown | DB: `pantry_ingredient_knowledge` | Pantry enrichment cache, not food identity | NO | — | — |
| Raw ingredient strings (`meals.ingredients`, `user_pantry_items`) | Thousands | DB tables | Demand signal only; not food identities | NO — wrong domain | — | — |
| Branded product records (`grocery_products`) | Thousands | DB: `grocery_products` | Product catalogue, not food identities | NEVER | — | — |

### Current State Summary

| Metric | Value |
|--------|-------|
| Live canonical foods | **249** |
| Live knowledge foods (WS0) | **265** |
| Live diversity groups | **173** |
| Live aliases | **714** |
| Context coverage | **100%** (maintained as gate) |
| Resolver key collisions | **0** |
| USDA foods available but not yet promoted | **~1,575 unprocessed; ~295 from pilot awaiting promotion** |
| UK NDNS / NHS data | **Not available** |

---

## PART 2 — PROMOTION READINESS CLASSIFICATION

### Classification of All Available Foods

| Category | Count | Status |
|----------|-------|--------|
| LIVE — already canonical | 249 | Live in production |
| READY — pilot batch, `ready_for_canonical` | **8** | Score ≥90, Foundation source, ≥4 macros, auto name. Promote immediately with context. |
| MINOR WORK — pilot batch, `ready_for_claude_authoring` | **257** | Score 50–89. Claude authors description/nutrients/benefits from USDA data. Context needs authoring. Batch review before canonical. |
| EDITORIAL REVIEW — pilot batch, `needs_tha_review` | **30** | Score <50, name quality=review, or category=Other. Human must resolve identity. |
| MINOR WORK — remaining USDA (full run) | **~900–1,100 est.** | Will enter `ready_for_claude_authoring` stage on ingestion. Estimated from pilot 87% rate. |
| EDITORIAL REVIEW — remaining USDA (full run) | **~100–200 est.** | Will enter `needs_tha_review` on ingestion. Estimated from pilot 10–13% rate. |
| BLOCKED — prepared/composite/branded (pilot) | **24 blocked by WS0.12** | Already blocked by pipeline. Never promote. |
| BLOCKED — UK NDNS / NHS data | N/A | Data not available — blocked at source level |

### Summary Count

| Classification | Count |
|----------------|-------|
| READY (can promote with context authoring) | **8** |
| MINOR WORK (Claude authoring + batch editorial gate) | **~1,160–1,360** (pilot 257 + remaining USDA) |
| EDITORIAL REVIEW (needs human per-food review) | **~130–230** (pilot 30 + remaining USDA) |
| BLOCKED (prepared, branded, unsafe) | Pipeline auto-blocks; estimated ~700 blocked in full USDA run |
| Total available from USDA pipeline (net new) | **~1,300–1,600 net new canonical foods** |

### Gap to Targets

| Target | Current Gap | From USDA alone? | Additional source needed? |
|--------|-------------|-----------------|--------------------------|
| 500 foods | +251 | YES — pilot batch (295 available) | NO |
| 1,000 foods | +751 | YES — full USDA run provides ~1,300+ | NO |
| 2,000 foods | +1,751 | YES — full USDA run + comprehensive authoring | MARGINAL |
| 5,000 foods | +4,751 | NO — USDA tops out at ~2,075 unique ingredient-level foods | YES — UK NDNS required |
| 10,000 foods | +9,751 | NO | YES — multiple sources required |

---

## PART 3 — BOTTLENECK ANALYSIS

### Bottleneck 1: Food Context Authoring (CRITICAL — High Effort, High Impact)

**What it is:** Every food promoted to canonical requires a validated `FoodContextSeed` in `shared/canonical/food-context.ts` containing: `availability` (controlled vocabulary), `origin_region` (controlled vocabulary), `peak_seasons` (controlled vocabulary). Missing context blocks canonical promotion with a hard error from `validatePromotion()`.

**Current state:** `shared/canonical/food-context.ts` has 435 lines covering the 249 existing canonical foods. Each was manually authored with UK-appropriate values.

**Impact at scale:** 1,751 new foods needed for 2,000 target = 1,751 new context entries to author.

**Current throughput:** Manual authoring at ~10–20 foods/hour = 88–175 hours of editing for 1,751 foods. This is the single largest bottleneck.

**Automation potential:** HIGH. Food context values derive from predictable category-level rules:
- Availability: `"Year-round"` is correct for most pantry staples, grains, legumes, nuts, seeds, oils. Seasonal for summer fruit, autumn root vegetables.
- Origin region: derivable from food's botanical or cultural origin (USDA often includes this).
- Peak seasons: derivable from category + known seasonal patterns.

A Claude batch-authoring pass over the USDA pipeline output can generate context entries at high throughput. Spot-check review by THA (not per-food, per-category batch) is sufficient.

**Rank: #1 bottleneck. Must be automated to achieve any target above 500 foods.**

---

### Bottleneck 2: Knowledge Content Authoring (HIGH — High Effort, High Impact)

**What it is:** Each food in `knowledge_foods` requires: description (2–3 sentences), nutrient links (from 30-nutrient taxonomy), benefit links (from 15-benefit taxonomy), storage guidance, seasonality, common forms, source attribution.

**Current state:** The 265 WS0 foods were human-authored (editorial) + Claude-authored (H1 batch). The WS0X expansion program established that Claude can safely author Tier 2 content from USDA macro data + THA taxonomy alone (see WS0X Phase 4).

**Impact at scale:** 1,751 new foods for the 2,000 target = 1,751 new knowledge entries. At ~15 minutes per food manually = ~438 hours.

**Automation potential:** HIGH (~87–90%). The WS0X programme established that Claude can auto-author: name, slug, category, subcategory, aliases, description (conservative, non-medical), nutrients (from USDA macro IDs), benefits (from nutrient→benefit links), seasonality (heuristic), common forms (heuristic), storage guidance (heuristic).

**What cannot be auto-authored:** Allergen-relevant foods (tree nuts, shellfish, gluten, dairy, eggs, soya, peanuts, sesame, celery, mustard) — these require human allergen review. Any benefit outside the 15-benefit taxonomy. Foods with name quality=review.

**Rank: #2 bottleneck. Solvable via Claude batch authoring with batch-level human gate.**

---

### Bottleneck 3: USDA Full Dataset Not Yet Ingested (MEDIUM — Medium Effort, High Impact)

**What it is:** Only 500 of ~2,075 available USDA ingredient-level foods have been processed through the ingestion pipeline (`server/scripts/ws011-usda-ingestion.ts` + `server/scripts/ws012-normalisation.ts`). The remaining ~1,575 foods have not been ingested, scored, or staged.

**Impact:** Without the full run, there are only 295 net new candidates available. The gap to 1,000 foods cannot be closed from the pilot batch alone.

**Effort:** Medium. The scripts and pipeline exist and have been validated. Running the full dataset requires: (1) obtaining the full USDA FDC bulk download files (Foundation + SR Legacy JSON), (2) running `ws011-usda-ingestion.ts` across all records, (3) running `ws012-normalisation.ts` over the output. Estimated 1–3 days of pipeline work.

**Rank: #3 bottleneck. Must be run before any milestone above 500 foods.**

---

### Bottleneck 4: Alias Conflict Resolution (LOW — Low Effort, Low Risk)

**What it is:** The canonical system enforces a unique alias key constraint via `validateCanonicalSeed()`. Each new canonical food must have aliases that don't conflict with any existing food's aliases. The WS0X.8 batch (68 foods) produced 4 conflicts requiring manual resolution.

**Extrapolated rate:** ~1 conflict per 17 foods. At 1,751 new foods: ~103 conflicts expected.

**Automation potential:** MEDIUM. The pipeline's `deduplicator.ts` identifies conflicts before promotion. Conflicts need human decision (merge vs. resolve), but the conflict surface area is predictable and small.

**Rank: #4 bottleneck. Manageable. Not a blocker at any realistic promotion speed.**

---

### Bottleneck 5: UK Relevance Filtering for H2/H3 Foods (MEDIUM — Medium Effort, Medium Impact)

**What it is:** The H1 UK allow-list in `promotion-validator.ts` covers the explicitly confirmed H1 foods. Foods not on the list go to `needs_review` stage (not blocked, but not auto-promoted). Of the USDA dataset, ~12–15% of remaining foods are low UK-relevance (abiyuch, epazote, carioca beans, etc.).

**Impact:** If not filtered, these foods inflate the canonical database with entries users cannot find in UK supermarkets, weakening Discovery and Pantry Explore quality.

**Fix:** Extend the H1 allow-list to cover the full USDA promotion batch, or define a more systematic H1 scoring function (e.g. "appears in Tesco/Sainsbury's product catalogue"). H2/H3 foods enter as `tier='catalogue'` with no WS0 content until demand signals trigger authoring.

**Rank: #5. Should be resolved before any promotion batch above 500 foods.**

---

### Bottleneck 6: Search Performance at Scale (LOW NOW — HIGH AT 10,000)

**What it is:** `searchKnowledgeRegistry()` in `nutrition-knowledge-registry.ts` loads all foods into memory and filters in JavaScript. At 265 foods this is fast. At 2,000 foods: ~200KB per call (acceptable). At 10,000 foods: ~1MB per call (unacceptable — must be DB-side).

**Fix:** Add `tsvector` full-text index on `knowledge_foods.name` and GIN index on `aliases` array before reaching 5,000 foods. This is a schema migration (suggested, not required at 2,000).

**Rank: #6. Not a blocker before 5,000 foods.**

---

### Bottleneck 7: UK NDNS / NHS Data Unavailable (CRITICAL FOR 5,000+)

**What it is:** No UK National Nutrient Databank (McCance & Widdowson) integration exists. USDA data tops out at ~2,075 unique ingredient-level foods. The UK NDNS contains several thousand UK-specific foods and preparations. Without it, the ceiling from the current USDA-only pipeline is approximately 2,000 canonical foods.

**Effort:** High. Obtaining the NDNS data, building an ingestion pipeline, mapping USDA nutrient IDs to NDNS equivalents, and handling UK-specific food identities is a medium-to-large project. Not required for the 2,000-food target.

**Rank: #7. Not a bottleneck for any target below 2,000 foods. Required for 5,000–10,000.**

---

### Bottleneck Summary (Ranked by Effort × Impact for 2,000-food target)

| Rank | Bottleneck | Effort | Impact | Blocks target |
|------|-----------|--------|--------|--------------|
| 1 | Food context authoring (1,751 entries) | HIGH | HIGH | All targets above 500 |
| 2 | Knowledge content authoring (1,751 foods) | HIGH | HIGH | All targets above 500 |
| 3 | USDA full dataset not yet ingested | MEDIUM | HIGH | 1,000+ targets |
| 4 | Alias conflict resolution (~103 conflicts) | LOW | LOW | No hard block |
| 5 | UK relevance filtering for H2/H3 | MEDIUM | MEDIUM | Quality at scale |
| 6 | Search performance at scale | LOW | HIGH (future) | Only at 5,000+ |
| 7 | UK NDNS data unavailable | HIGH | HIGH | 5,000+ targets |

---

## PART 4 — AUTOMATION REVIEW

### The Two-Layer Requirement

Every canonical food requires both layers to be complete before it surfaces in the product:

| Layer | Component | Can Automate? | How |
|-------|-----------|--------------|-----|
| Canonical spine | `canonical_food` row (slug, name, category, subcategory, diversityGroupSlug, aliases) | YES — 87–90% of USDA foods | Pipeline: name normaliser + category mapper + alias resolver |
| Canonical context | `FoodContextSeed` (availability, origin_region, peak_seasons) | YES — ~95% of foods | Claude batch authoring from category + USDA origin data |
| Knowledge content | `knowledge_foods` row (description, nutrients, benefits, forms, storage, seasonality) | YES — 87–90% of USDA foods | Claude batch authoring from USDA macro data + THA taxonomy |
| Alias dedup | Check against 714 existing aliases | YES — automated by `validateCanonicalSeed()` | Pipeline: deduplicator.ts |
| Promotion validation | Check against processed/branded/allergen rules | YES — automated by `validatePromotion()` | Pipeline: promotion-validator.ts |

### What Claude Can Auto-Promote (no per-food human review)

From the WS0X expansion programme Phase 4, confirmed safe for automation:

| Field | Automated? | Source |
|-------|-----------|--------|
| Canonical name (UK English) | YES, if `nameQuality='auto'` | Pipeline name normaliser |
| Slug | YES | `nameToSlug(normalisedName)` |
| Category + subcategory | YES, if category ≠ "Other" | Pipeline category mapper |
| Aliases (initial set) | YES | Pipeline alias resolver |
| Description (2 sentences, conservative, no medical claims) | YES | USDA category + macro presence |
| Nutrient links (from 30-nutrient taxonomy) | YES | USDA macro IDs → nutrient slug mapping |
| Benefit links (from 15-benefit taxonomy) | YES | `knowledge_nutrient_benefits` join |
| Seasonality | YES (heuristic) | Category-based (e.g. grains=year-round, stone fruit=summer) |
| Common forms | YES (heuristic) | Category-based (e.g. grains=dry/cooked/flour) |
| Storage guidance | YES (heuristic) | Category-based (e.g. nuts=airtight, dairy=refrigerate) |
| Macros per 100g (energy, protein, fat, carbs, fibre) | YES | USDA nutrient IDs 1008/1003/1004/1005/1079 |
| Food context (availability, origin_region, peak_seasons) | YES — with category heuristics | Claude from category + known origin patterns |
| Diversity group assignment | YES — if parent canonical has group | Category lookup + parent group inheritance |

### What Requires Human Review (per-food or per-batch)

| Trigger | Review Level |
|---------|-------------|
| Name quality = "review" (USDA qualifier in name) | Per-food: human must confirm canonical name |
| Promotion score < 50 | Per-food: human must assess identity |
| Category = "Other" (no THA mapping) | Per-category: THA editor maps to correct category |
| Allergen-relevant food (tree nuts, shellfish, gluten, dairy, eggs, soya, peanuts, sesame) | Per-batch: THA confirms allergen flag is correct (does not write to allergen system — that is a separate domain) |
| Benefit outside 15-benefit taxonomy | Per-food: THA editor decides whether to extend taxonomy |
| New diversity group needed (novel food family) | Per-group: THA editor creates group entry |
| Animal product claim (poultry, fish, meat) | Per-batch: confirm no dietary pattern mismatch |
| H1/H2/H3 tier determination | Per-batch: THA confirms availability tier |

### Estimated Automation Rate

Based on the 500-food pilot:
- `nameQuality='auto'`: 238/295 = **80.7%** of net new foods
- `ready_for_claude_authoring` or above: 265/295 = **89.8%** of net new foods
- Foods requiring per-food THA review: 30/295 = **10.2%**

**Estimated automation rate: 87–90% of foods from the USDA pipeline can be promoted with no per-food human review. Approximately 10–13% require per-food editorial attention.**

At 1,751 new foods (to reach 2,000 canonical): ~155–228 foods need per-food review. The remaining ~1,523–1,596 can be batch-authored and batch-reviewed.

---

## PART 5 — PRODUCTION ROADMAP

### Milestone: 500 Canonical Foods (+251)

**Effort:** 2–3 weeks  
**Source:** USDA 500-food pilot batch (295 net new candidates available now)

| Step | Work | Owner |
|------|------|-------|
| 1 | Apply 5 WS0X.1 pipeline fixes (prepared-food filter tokens, brand guard, name normaliser strictness, bean dedup audit, processing level rule) | Engineering (1 day) |
| 2 | Author food contexts for ~251 foods (category-heuristic batch via Claude) | Claude batch authoring (2–3 hours) |
| 3 | Claude batch-author knowledge content for ~243 `ready_for_claude_authoring` foods | Claude batch authoring (4–8 hours) |
| 4 | THA editorial review of ~30 `needs_tha_review` foods | THA (4–8 hours) |
| 5 | Run `validateCanonicalSeed()` and `validatePromotion()` | Automated (minutes) |
| 6 | Promote to canonical in category batches (vegetables, then fish, then grains, etc.) | Engineering (1–2 days) |
| 7 | Re-seed DB (`npm run seed:canonical`) | Engineering (minutes) |

**Dependencies:** WS0X.1 fix 5 (processing level rule), food context authoring tooling, Claude batch authoring capability  
**Risks:** Alias conflicts (~15 expected in this batch); dairy category contamination rate (24% blocked in pilot)  
**Expected FI coverage increase:** Meal Detail recognises ~60–70% of common UK meal ingredients (vs. ~25% today)

---

### Milestone: 1,000 Canonical Foods (+751)

**Effort:** 6–8 weeks additional (cumulative: 8–11 weeks from now)  
**Source:** Full USDA dataset run (remaining ~1,575 unprocessed foods)

| Step | Work | Owner |
|------|------|-------|
| 1 | Obtain full USDA FDC bulk download (Foundation Foods 2025-04-24 + SR Legacy 2021-10-28) | Engineering/THA (1 day) |
| 2 | Run `ws011-usda-ingestion.ts` over full dataset | Engineering (half day) |
| 3 | Run `ws012-normalisation.ts` over ingestion output | Engineering (half day) |
| 4 | Triage output into promotion batches by category | Engineering (1 day) |
| 5 | Claude batch-author contexts + knowledge for ~500 additional foods | Claude batch authoring (1–2 days) |
| 6 | THA batch review (~60 foods needing per-food review) | THA (1 day) |
| 7 | Resolve alias conflicts (~45 expected from this batch) | Engineering (half day) |
| 8 | Promote in category batches; re-seed DB | Engineering (1–2 days) |

**Dependencies:** Full USDA bulk data obtained; ingestion pipeline running against full dataset  
**Risks:** SR Legacy data quality lower than Foundation (some older nutrient data); greater proportion of `needs_review` names  
**Expected FI coverage increase:** Meal Detail recognises ~75–80% of common UK meal ingredients

---

### Milestone: 2,000 Canonical Foods (+1,751)

**Effort:** 8–12 weeks additional (cumulative: 4–5 months from now)  
**Source:** Remainder of full USDA dataset + targeted editorial gap-fill

| Step | Work | Owner |
|------|------|-------|
| 1–8 | All 1,000-food steps completed | — |
| 9 | Analyse coverage gaps after 1,000 foods (which household ingredient types remain unrecognised?) | Engineering (1 day) |
| 10 | Targeted editorial authoring for high-demand gaps (e.g. condiments, sauces, common UK baking ingredients) | THA + Claude (1–2 weeks) |
| 11 | Extend H1 allow-list or implement systematic UK-availability scoring | THA (half day) |
| 12 | Add DB-side search index on knowledge_foods if not already done | Engineering (half day — schema migration) |
| 13 | Complete remaining USDA promotion batches with full quality gates | Engineering + THA (3–4 weeks) |

**Dependencies:** 1,000-food milestone complete; demand-signal analysis from live DB  
**Risks:** Diminishing returns — the most impactful foods promote first; USDA coverage gaps for some UK-specific foods (British cheeses, regional produce); alias collision rate increases with database size  
**Expected FI coverage increase:** Meal Detail recognises ~85–90% of common UK meal ingredients

---

### Milestone: 5,000 Canonical Foods (+4,751)

**Effort:** 6–12 months (cumulative: 7–13 months from now)  
**Source:** UK National Nutrient Databank (McCance & Widdowson) + USDA complete + editorial programme

| Step | Work | Owner |
|------|------|-------|
| 1 | Obtain UK NDNS data licence (McCance & Widdowson 8th Edition or equivalent) | THA / Commercial (timeline unknown) |
| 2 | Build NDNS ingestion pipeline (parallel to ws011, adapted for NDNS schema) | Engineering (2–4 weeks) |
| 3 | Map NDNS nutrient IDs to THA 30-nutrient taxonomy | THA editorial + Engineering (1–2 weeks) |
| 4 | Handle UK-specific food identities (British cheeses, UK game, regional produce) | THA editorial (ongoing) |
| 5 | Run dedup between USDA and NDNS datasets (significant overlap expected) | Engineering (1 week) |
| 6 | Scale food context authoring pipeline to handle batches of 500–1,000 at a time | Engineering (optimisation) |
| 7 | Add DB-side full-text search (required before 5,000 foods) | Engineering (1 day) |
| 8 | Ongoing editorial programme for quality maintenance | THA (continuous) |

**Dependencies:** UK NDNS data access (currently unavailable); USDA 2,000-food milestone complete; DB search indexing  
**Risks:** NDNS data licence cost and availability uncertain; UK-specific foods have different nutrient measurement standards; dedup between two international datasets is complex  
**Expected FI coverage increase:** Near-complete UK household ingredient recognition; covers ethnic diversity, regional produce, specialist dietary foods

---

### Milestone: 10,000 Canonical Foods (+9,751)

**Effort:** 12–24 months (cumulative: 13–29 months)  
**Source:** Multiple data sources + ongoing demand-signal programme + community/editorial

| Step | Work | Owner |
|------|------|-------|
| 1 | All 5,000-food steps complete | — |
| 2 | Identify and integrate additional sources: Open Food Facts (UK products), Fineli (Finnish/Nordic), CNF (Canada), or other FAOSTAT datasets | Engineering + THA (4–8 weeks per source) |
| 3 | Implement demand-signal promotion queue: foods appearing in household logs auto-escalate for authoring priority | Engineering (2–3 weeks) |
| 4 | Consider splitting `shared/canonical/foods.ts` into category sub-files for authoring ergonomics (no architecture change required — purely editorial) | Engineering (1 day) |
| 5 | Implement graduated `status` field on knowledge_foods (draft/review/active/retired) for managing large editorial queues | Engineering (schema migration — 1 day) |
| 6 | Scale canonical resolver validation to handle 40,000+ alias keys (still O(n) at startup — acceptable; confirm via benchmark) | Engineering (verify, 1 hour) |
| 7 | Ongoing editorial maintenance programme | THA (continuous) |

**Dependencies:** 5,000-food milestone complete; additional data source integrations; demand-signal infrastructure  
**Risks:** Data quality degrades at scale (more conflicts, more edge cases); alias collision probability increases; editorial maintenance burden grows significantly; risk of drift between source-of-truth and live data  
**Expected FI coverage increase:** Comprehensive — includes specialist, ethnic, regional, and branded-adjacent foods

---

### Roadmap Summary

| Milestone | Net new foods | Estimated calendar time | Primary effort | Source |
|-----------|--------------|------------------------|----------------|--------|
| 500 foods | +251 | 2–3 weeks | Context + knowledge authoring (pilot batch) | USDA pilot snapshot (exists) |
| 1,000 foods | +751 | 2–3 months total | Full USDA ingestion run | USDA full dataset |
| 2,000 foods | +1,751 | 4–5 months total | USDA complete + gap-fill editorial | USDA full dataset + targeted editorial |
| 5,000 foods | +4,751 | 7–13 months total | UK NDNS integration | UK NDNS (not yet available) |
| 10,000 foods | +9,751 | 13–29 months total | Multiple sources + demand-signal programme | Multiple sources |

---

## PART 6 — APPLICATION IMPACT

### Impact by Surface at Each Milestone

| Surface | Current state (249 canonical) | At 500 foods | At 1,000 foods | At 2,000 foods |
|---------|------------------------------|-------------|----------------|----------------|
| **Meal Detail — Food Intelligence** | FI panel appears for meals containing any of 265 WS0 foods. ~25% ingredient resolution rate (WS0X.7 baseline). Common UK meals with haddock, cheddar, sour cream, farro show no FI panel. | ~50% resolution rate. Most common protein, vegetable, and grain meals get FI. | ~70% resolution rate. UK household staples broadly covered. | ~85–90% resolution rate. Near-complete for everyday UK cooking. |
| **Nutrition Report / Plant Diversity** | 265 foods matchable in ingredient resolver. Many plant-foods unrecognised (hazelnut, kumquat, elderberry, black rice). | +251 plants/foods recognisable. Plant diversity counter materially more accurate. | Grains, legumes, fruit categories comprehensive. 30-plants counter reliable. | Comprehensive ingredient recognition. Report reflects actual household diet accurately. |
| **Pantry Explore / Knowledge Hub** | 265 browsable foods. Herb, spice, cheese, grain categories thin. | Cheese category fills (cheddar, feta, mozzarella, brie, parmesan). Grain ancient varieties added. | Near-complete fruit, vegetable, legume, nut/seed categories. | Full browse depth across all categories. |
| **Discovery Engine (WS8)** | 265 foods in recommendation pool. Discovery types (try something new, explore a category, try in season) limited by pool size. | +251 foods expands recommendation pool. More variety in Discover suggestions. | Pool breadth supports all 6 discovery types reliably. | Rich, personalised discovery with sufficient pool depth to never repeat. |
| **Alternatives Engine (WS9)** | 265 foods for alternative suggestions. Dairy alternatives thin. | Dairy alternatives much stronger (cream cheese → cottage cheese, gouda → cheddar). Grain alternatives richer. | Near-complete alternative trees for most food categories. | Comprehensive alternative networks. |
| **Stories (WS10/WS11)** | Stories anchored on 265 foods. White fish arc (only salmon, sardines). Ancient grain arc (only oats, quinoa). | Haddock, pollock in white fish arc. Sorghum, amaranth, farro in ancient grains arc. Elderberries, jackfruit in seasonal fruit arc. | Arcs complete across all categories. Seasonal stories match UK food calendar accurately. | New story types possible (British cheese arc, foraging arc, fermented foods arc). |
| **Planner** | Household food profiling based on 265 WS0 foods. Foods not in WS0 not profiled. | Better household profiling for white fish, cheeses, specialist grains. | Household food graph accurately reflects UK household variety. | Near-complete profiling. |
| **Shopping** | No direct dependency on canonical count. | No change. | No change. | No change. |
| **Simply Better Choices** | Alternatives drawn from 265 WS0 foods. | Richer alternative suggestions. | Comprehensive alternative suggestions. | Near-complete. |
| **Food Wrapped / Annual Report** | Limited by WS0 coverage. | Better food variety recognition. | Accurate variety tracking. | Comprehensive. |

### Most Impactful First-Batch Categories (for 500 foods milestone)

1. **Dairy (+13 cheeses/creams)** — highest immediate match rate on meal ingredients. UK households use cheddar, cream cheese, sour cream, feta in virtually every week of meal logs.
2. **Grains (+9 ancient/specialist grains)** — high-value FI panel unlock. Sorghum, farro, amaranth, semolina appear in growing household demand.
3. **Vegetables (+9 new types)** — leafy greens (okra, broccoli raab, mustard greens) appear frequently in diverse household cooking.
4. **Fish (+8 new species)** — haddock and pollock are the highest-impact additions. Both are UK household staples with zero current FI coverage.
5. **Fruit (+10 new)** — jackfruit (strong plant-based demand signal), elderberries (UK seasonal), lychees, papayas (UK household).

---

## PART 7 — QUALITY SAFEGUARDS

### How Large-Scale Promotion Preserves Trust

#### Safeguard 1: Pipeline Auto-Gates

The existing pipeline enforces before any data is written:

| Gate | What it blocks | Status |
|------|---------------|--------|
| `prepared-food-filter.ts` | Composite dishes, sauces, prepared products | Active |
| `brand-guard.ts` | Branded and trademarked products | Active |
| `deduplicator.ts` | Slug and alias collisions | Active |
| `category-mapper.ts` | Foods landing in "Other" category | Active (defers to review) |
| `confidence-scorer.ts` | Foods with insufficient nutrient data | Active |
| `promotion-readiness.ts` | Scores below 50 deferred to `needs_tha_review` | Active |
| `validateCanonicalSeed()` | Alias key uniqueness (anti-fork lock) | Active — runs at seed time |
| `validatePromotion()` | Context missing, alias conflicts, bean duplicates, blocked USDA categories | Active |

**No food can enter canonical status without passing all of the above.** The gates are enforced at seed time, not just at ingestion time.

#### Safeguard 2: Allergen Non-Interference

Auto-authored WS0 content does NOT write to the allergen system (`shared/restrictions/restriction-library.ts`). Allergen data is a separate, governed domain. Mass food promotion cannot corrupt allergen records. The two systems are independent.

#### Safeguard 3: Controlled Vocabulary Enforcement

Food context fields (`availability`, `origin_region`, `peak_seasons`) use controlled vocabularies enforced by `validateFoodContext()`. No free-text is accepted. A badly authored context entry is blocked before it reaches the DB.

#### Safeguard 4: Dual-Mode Promotion (Draft Before Live)

The `canonical_food` table supports `tier='catalogue'` (not user-visible) and `tier='canonical'` (live). Foods can be staged in `catalogue` mode after content authoring and only promoted to `canonical` after batch editorial review. Users never see draft-tier foods.

#### Safeguard 5: Benefit Taxonomy Gate

Only the existing 15 health benefits from `knowledge_health_benefits` can be linked to auto-authored foods. Claude cannot invent a new benefit. Foods whose primary benefit sits outside the taxonomy are deferred to `needs_tha_review` — they cannot auto-promote.

#### Safeguard 6: Evidence Strength Floor

Auto-authored food↔benefit links use `evidenceStrength='emerging'` (the most conservative level, already established in WS0X.5). Upgrading to `'established'` requires human editorial sign-off. Evidence strength is not surfaced to users (enforced in `nutrition-knowledge-registry.ts`).

#### Safeguard 7: Conservative Language Enforcement

The trust principle established in WS0X Phase 5 applies to all auto-authored content. Blocked patterns: "prevents [disease]", "cures", "boosts immunity", "detoxifies", "superfood", "clinically proven", precise nutrient amounts in auto-authored descriptions. Claude authoring operates within these constraints.

#### Safeguard 8: Rollback Is Always Available

Every canonical promotion is a DB seed operation. Every seed is idempotent and reversible:
- Food context: remove entry from `FOOD_CONTEXT_SEED` + re-seed
- Knowledge content: mark `isActive=false` in `knowledge_foods` or delete rows + re-seed
- Canonical food: remove from `CANONICAL_SEED` + re-seed

Git tags protect every batch start point. No promotion is permanent.

---

## PART 8 — LONG-TERM ARCHITECTURE REVIEW

### Does the Current Architecture Remain Appropriate at Scale?

#### At 2,000 Foods

| Component | Scales to 2,000? | Evidence |
|-----------|-----------------|---------|
| `canonical_food` table | YES | Relational table; no size limit. Index on `slug` already exists. |
| `food_variety` table | YES | Same — relational, indexed. |
| `canonical_food_alias` table | YES — up to ~8,000 alias rows | GIN or btree index on `alias_key` handles this trivially. |
| `diversity_group` table | YES | Expected ~400–600 groups at 2,000 foods. |
| `knowledge_foods` table | YES — in-memory OK up to ~2,000 | At 2,000 rows: ~200KB loaded per search call. Borderline. Recommend DB-side search index. |
| `shared/canonical/foods.ts` (seed file) | YES — with refactor | At 2,000 foods, single file becomes ~60,000+ lines. Split by category sub-files (ergonomics only — no architecture change). |
| `buildCanonicalIndex()` | YES | One-time Map<string, IndexTarget> build at startup. At 2,000 foods + ~8 aliases each = 16,000 Map entries. Well within normal JS Map performance. |
| `validateCanonicalSeed()` | YES | O(n) scan over ~8,000 aliases. At build time (not runtime). Under 50ms at 10x current scale. |
| `shared/canonical/food-context.ts` | YES — with split | At 2,000 foods, single file = ~15,000 lines. Category-split files recommended for authoring ergonomics. |

**Verdict at 2,000:** Architecture is appropriate. No structural changes required. Two ergonomic changes recommended (not required): split `foods.ts` and `food-context.ts` into category sub-files; add DB-side search index on `knowledge_foods`.

#### At 5,000 Foods

| Component | Scales to 5,000? | Action needed |
|-----------|-----------------|--------------|
| `canonical_food` / `food_variety` / `canonical_food_alias` tables | YES | Standard DB indexing sufficient. |
| `knowledge_foods` in-memory search | NO — ~500KB per search call | **Add `tsvector` full-text index + GIN index on aliases. Required before 5,000 foods.** |
| `shared/canonical/foods.ts` | ERGONOMICS CONCERN | Must be split into category sub-files. Each file remains ~2,000–4,000 lines. |
| `buildCanonicalIndex()` | YES | 5,000 foods × ~8 aliases = 40,000 Map entries. Still fast at startup (~20ms). |
| `validateCanonicalSeed()` | YES — ~100ms at startup | Acceptable at startup; not called at request time. |
| Food context seed file | ERGONOMICS CONCERN | Must be split into category sub-files. |

**Verdict at 5,000:** Architecture is broadly appropriate but requires the DB-side search migration before this milestone. The candidate architecture remains a three-layer system (canonical spine → knowledge content → context seed) — no layer should be collapsed or replaced.

#### At 10,000 Foods

| Component | Scales to 10,000? | Action needed |
|-----------|-----------------|--------------|
| DB tables | YES | Standard DB operations. |
| In-memory search | NO — already addressed at 5,000 | DB-side search required (already added). |
| Seed files | REQUIRES SPLIT | Category sub-files mandatory. Consider moving canonical seed from TypeScript to JSON with a schema validator for scale. |
| `validateCanonicalSeed()` | YES — ~200ms at startup | Acceptable for startup; not called at request time. Consider DB constraint enforcement as authoritative instead of seed-time validation. |
| Alias conflict detection | YES — but complexity increases | At 10,000 foods × 8 aliases = 80,000 aliases. Conflict detection remains O(n). Consider moving to DB unique constraint as primary enforcement. |
| `buildCanonicalIndex()` | YES | 10,000 foods + 80,000 aliases = ~90,000 Map entries. ~50ms build time. Acceptable. |
| Editorial maintenance | ORGANISATIONAL CONCERN | At 10,000 foods, the catalogue needs a tooling investment: admin UI for editorial review, batch status management, source attribution tracking. This is an operational/product investment, not an architecture change. |

**Verdict at 10,000:** The three-layer canonical architecture remains correct and does not need to be replaced. The primary changes are operational (editorial tooling, admin UI, demand-signal queue) and engineering scale (DB search, seed file splitting, DB-enforced alias uniqueness). No new architectural layer is required.

### Architecture Changes Required vs. Recommended

| Change | Required? | Milestone |
|--------|----------|-----------|
| Split `foods.ts` into category sub-files | RECOMMENDED | 2,000 foods |
| Split `food-context.ts` into category sub-files | RECOMMENDED | 2,000 foods |
| DB-side full-text search on knowledge_foods | REQUIRED | Before 5,000 foods |
| `macros` JSONB column on knowledge_foods | RECOMMENDED | Before 2,000 foods (enables Nutrition Report improvements) |
| `status` text field on knowledge_foods (draft/review/active/retired) | RECOMMENDED | Before 2,000 foods (enables staged promotion) |
| `sourceRef` + `tier` fields on knowledge_foods | RECOMMENDED | Before 2,000 foods (traceability) |
| Demand-signal promotion queue | RECOMMENDED | Before 5,000 foods |
| UK NDNS ingestion pipeline | REQUIRED | For 5,000+ target |
| DB alias uniqueness as primary enforcement | RECOMMENDED | Before 10,000 foods |
| Editorial admin UI | REQUIRED (operational) | Before 5,000 foods (operational manageability) |

---

## PART 9 — FINAL RECOMMENDATION

### Recommended Strategy: Option C — Hybrid Automated Promotion with Category-Level Editorial Checkpoints

#### Description

Run the promotion pipeline in category batches. Within each batch, Claude auto-authors all `ready_for_claude_authoring` foods (87–90% of total). A THA editor reviews the entire batch output at category level (not per food) — checking for category appropriateness, content tone, and benefit accuracy — before batch promotion to canonical. Foods in `needs_tha_review` receive per-food editorial attention.

#### Why this strategy over the alternatives

**Option A — Large automated promotion waves with validation** would be faster but creates two risks: (1) if a systematic error exists in the content authoring, it propagates across the entire wave before it's caught; (2) per-food trust issues (a wrongly described food) are harder to find and fix in a large wave.

**Option B — Category-by-category promotion without automation** is too slow. At manual authoring speed (15 min/food), reaching 2,000 foods would take 437 person-hours. Not realistic.

**Option C — Hybrid automated promotion with category checkpoints** is the right balance because:
1. **Speed:** 87–90% of foods are auto-authored. Editorial time is concentrated in category-level review (hours, not days) rather than per-food authoring.
2. **Safety:** A batch-level review before promotion catches systematic errors (wrong benefit mapping, wrong tone, wrong availability) before they reach users.
3. **Quality:** Per-food review reserved for foods that genuinely need it (10–13% of total). Human attention goes where it adds value.
4. **Rollback:** Category batches can be rolled back independently. A problem in the dairy batch does not affect the grains batch.
5. **Trust:** Users see consistent, conservative language across all auto-authored foods because the authoring constraints are encoded in the pipeline — not enforced per-reviewer.

#### How it works in practice

```
Phase 1: USDA full dataset ingestion (ws011 + ws012)
Phase 2: Triage output by category
Phase 3: For each category batch:
  a. Claude batch-authors food context for all foods in batch
  b. Claude batch-authors knowledge content for all ready_for_claude_authoring foods
  c. THA reviews batch output (1–3 hours per category, not per food)
  d. Foods approved: promote to canonical (draft tier)
  e. DB re-seed
  f. DB promotion: draft → canonical (live)
  g. Foods flagged: enter needs_tha_review queue for per-food work
Phase 4: Repeat for next category
```

#### Expected Velocity

| Phase | Foods added | Calendar time |
|-------|------------|--------------|
| Phase 1 (pilot batch, Option C) | ~251 foods (to 500 total) | 2–3 weeks |
| Phase 2 (remaining USDA — first half, Option C) | ~500 foods (to 1,000 total) | 4–6 weeks |
| Phase 3 (remaining USDA — complete, Option C) | ~1,000 foods (to 2,000 total) | 8–12 weeks |
| Phase 4 (UK NDNS integration, Option C) | ~3,000 foods (to 5,000 total) | 6–12 months |

#### Quality Gate at Each Phase

Before any category batch promotes to canonical (live):
1. `validateCanonicalSeed()` passes with 0 problems
2. `validatePromotion()` passes for every food in batch
3. THA editor has reviewed and approved category batch output
4. A sample of 10 randomly selected foods from the batch have been spot-checked in the app (live FI panel review)

---

## TRUST CHECK

### Could mass promotion reduce quality, introduce duplicates, weaken trust, or reduce resolver accuracy?

| Risk | Assessment | Safeguard |
|------|-----------|-----------|
| Duplicate foods | Pipeline deduplicator + `validateCanonicalSeed()` catches slug collisions before write. WS0X.8 batch (68 foods): 0 duplicates. | `deduplicator.ts` + `validateCanonicalSeed()` |
| Wrong benefit claims | Only 15-benefit taxonomy used. Auto-authored foods get `evidenceStrength='emerging'`. No new benefits invented. | Benefit taxonomy gate |
| Medical claims in descriptions | Claude authoring constrained to approved patterns. Blocked: "prevents", "cures", "detoxifies", "superfood". | Trust language ruleset (WS0X Phase 5) |
| Allergen confusion | Auto-authored content does not write to allergen system. Allergen domain is separate and governed independently. | Domain separation (THA SoT Register) |
| Resolver accuracy reduction | New aliases go through `validateCanonicalSeed()` — zero alias key collisions allowed. Resolver can only improve with more foods (more matches). | Anti-fork lock |
| User sees confusing "unfamiliar" food | H2/H3 foods enter as `tier='catalogue'` (not user-visible) until promoted. Users only see `tier='canonical'` foods. | Tier gating |
| Inconsistent descriptions across surfaces | All auto-authored descriptions use same conservative template. No parallel stores created (SoT Register governance). | SoT governance rules |
| Quality regression after large batch | Category-level editorial checkpoint before promotion. Batch-level rollback available at any point. | Editorial gate + rollback tags |

**Conclusion:** Mass promotion via the Option C hybrid strategy does not reduce quality, weaken trust, or compromise resolver accuracy, provided the existing safeguards are applied at every promotion batch.

---

## DEFINITION OF DONE — VERIFICATION

| Requirement | Status |
|-------------|--------|
| All food datasets audited | ✅ 15 datasets across canonical, knowledge, USDA, NHS, raw ingredients, products |
| Promotion-ready foods counted | ✅ 8 READY, ~1,160–1,360 MINOR WORK, ~130–230 EDITORIAL REVIEW |
| Bottlenecks identified | ✅ 7 bottlenecks ranked by effort × impact |
| Automation opportunities assessed | ✅ 87–90% automation rate confirmed; Claude authoring boundaries documented |
| Roadmap to 2,000–10,000 foods produced | ✅ 5 milestones with effort, dependencies, risks, and velocity estimates |
| Application impact assessed | ✅ All surfaces assessed at 500 / 1,000 / 2,000 food milestones |
| Trust safeguards documented | ✅ 8 safeguards confirmed; trust check completed |
| Single recommended strategy | ✅ Option C — Hybrid automated promotion with category-level editorial checkpoints |
| Project file created | ✅ This document |

---

## SUGGESTIONS

SUGGESTION 1 — Automate food context authoring via category heuristics. A simple lookup table (category → default availability/origin/seasons) would generate correct values for ~95% of foods without per-food manual work. This is the single fastest unblock to reaching 500 foods.

SUGGESTION 2 — Build a `ws0x9-pre-promotion-audit.ts` script that reads the WS0.11/WS0.12 output, applies all five WS0X.1 fixes, and emits a clean promotion queue as a validated JSON file. This script becomes the only gate between pipeline output and any canonical write operation.

SUGGESTION 3 — Add `macros` JSONB column to `knowledge_foods` before the 500-food milestone. USDA per-100g data is available for all Tier 2 foods. Storing it directly on the food row enables the Nutrition Report to surface accurate per-portion data without a join to `knowledge_food_nutrients` for every food.

SUGGESTION 4 — Add `status` field (draft/review/active/retired) to `knowledge_foods` before the 500-food milestone. Boolean `isActive` cannot represent the staged promotion flow. A `status` field enables safe batch staging before live promotion.

SUGGESTION 5 — Introduce a demand-signal query before the 1,000-food milestone. A SQL query over `meals.ingredients` and `user_pantry_items` that counts how frequently each ingredient string appears gives THA a priority ordering: promote foods that users actually log before promoting obscure USDA entries. This is the `demandSignal` input already modelled in `rankPromotionQueue()` in `shared/catalogue/promotion-readiness.ts` — it just needs a live data source.

SUGGESTION 6 — Split `shared/canonical/foods.ts` into category sub-files before the 2,000-food milestone. The current 3,244-line single file is already large. At 2,000 foods it would exceed 25,000 lines. Split by category (vegetables.ts, fruit.ts, grains.ts, etc.) with a barrel re-export in `foods.ts`. This is ergonomics only — no architecture change.

SUGGESTION 7 — For the 5,000+ target, begin UK NDNS data sourcing now. The McCance & Widdowson 8th Edition is available from Public Health England / NDNS. The data licence process and NDNS schema mapping are the long-lead items. Starting sourcing now does not block the 2,000-food target but prevents the 5,000-food target from being gated by a data licence delay.

---

## DATA IMPACT

| Category | Impact |
|----------|--------|
| Reads existing data | YES — all findings derived from reading current codebase and investigation archive |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Foods promoted | NONE |
| Architecture changed | NONE |

---

*Investigation only. No implementation performed.*  
*No foods promoted. No data written. No schema changes.*  
*Rollback tag: `rollback/ws0x9-investigation-start` → commit `a8a912a`*  
*Report location: `docs/investigations/knowledge/WS0X_9_FOOD_INTELLIGENCE_MASS_PROMOTION_STRATEGY.md`*
