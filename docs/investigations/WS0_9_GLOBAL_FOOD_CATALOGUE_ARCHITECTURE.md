# WS0.9 — Global Food Catalogue and Curated Knowledge Architecture

**Date:** 2026-06-21
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `ws0.9-rollback-point` at `a7eaef5`
**Scope:** Investigation only. No implementation. No schema changes. No data changes.

---

## Rollback Protection

| Check | Status |
|---|---|
| Git status | Clean |
| WS0.8 (181/188 foods) | Protected — commit `bad86ca`, tag `ws0.8-rollback-point` |
| WS7 POC (relationship graph) | Protected — commit `a7eaef5` |
| WS0.9 rollback tag | Created: `ws0.9-rollback-point` at `a7eaef5` |

To restore pre-WS0.9 state:
```
git checkout ws0.9-rollback-point
```

---

## Current Architecture (Baseline)

WS0.8 and WS7 established this stack:

```
shared/canonical/foods.ts        — 181 canonical foods (identity layer)
  └── CANONICAL_SEED[]           — slug, name, category, subcategory,
                                   knowledgeFoodSlug, diversityGroupSlug,
                                   varieties[], aliases[]

shared/knowledge/foods.ts        — 188 knowledge foods (editorial layer)
  └── FOOD_SEED[]                — description, commonForms, storageGuidance,
                                   seasonality, aliases

shared/knowledge/relationships.ts — FOOD_NUTRIENTS, FOOD_BENEFITS, NUTRIENT_BENEFITS
shared/relationships/food-graph.ts — 7 relationship types (POC)
shared/canonical/diversity-groups.ts — 139 plant diversity groups
```

The canonical layer identifies foods. The knowledge layer explains them. They link via `knowledgeFoodSlug`.

**Current scale:**

| Layer | Count | Coverage |
|---|---|---|
| Canonical foods | 181 | UK household eating, Mediterranean bias |
| Canonical varieties | 57 | Sub-forms of canonical foods |
| Canonical aliases | 539 | Common names, plurals, forms |
| Knowledge foods | 188 | Descriptions, benefits, nutrients, forms |
| Diversity groups | 139 | Plant counting units |
| Editorial relationships | ~30 | WS7 POC (4 worked foods) |

**Current categories (canonical layer):** 70+ including Vegetables, Fruit, Grains, Proteins, Dairy, Dairy alternatives, Nuts, Seeds, Legumes, Herbs, Spices, Mushrooms, Fermented foods, Oily fish, White fish, Poultry, Red meat — broad UK household coverage, no global exhaustiveness.

---

## The Core Question

Can THA support:

```
Global Food Catalogue (thousands → tens of thousands)
↓
THA Canonical Foods (181 today)
↓
THA Knowledge Foods (188 today)
↓
Relationships
↓
Discovery / Alternatives / Stories
```

without duplication, conflicting facts, trust degradation, or architectural complexity?

**Short answer: Yes — but only with strict tier separation maintained at every level.**

---

## Part A — Global Food Catalogue

### What should exist for ALL foods?

A catalogue entry is the minimum viable record for a food THA can recognise. It should contain:

| Field | Purpose | Required |
|---|---|---|
| `slug` | Stable identifier | Yes |
| `name` | Display name (UK English preferred) | Yes |
| `aliases[]` | Common names, US English, plurals | Yes |
| `category` | Broad group (Vegetables, Fruit, Proteins…) | Yes |
| `subcategory` | Finer group (Brassicas, Oily fish…) | Yes |
| `scientificName` | Botanical/biological name | No (desirable) |
| `commonForms[]` | Fresh, tinned, dried, frozen | No |
| `nutrients{}` | Macros + key micros per 100g | Desirable |
| `sourceRef` | Where the data came from | Yes (if imported) |
| `tier` | `catalogue` \| `canonical` \| `knowledge` | Yes |

Nutrients at catalogue level should be basic (energy, protein, fat, carbs, fibre). Full micronutrient data is a knowledge-layer concern.

---

### Source options

| Source | Strengths | Weaknesses | Verdict |
|---|---|---|---|
| USDA FoodData Central | Comprehensive, API-accessible, well-structured, free | US English names, US-centric portions, occasionally eccentric categorisation | **Primary recommendation** |
| UK Food Composition Tables (McCance & Widdowson) | Authoritative for UK, good for staple foods | Not easily bulk-importable, fewer exotic foods | Secondary — use for UK overrides |
| Open Food Facts | Enormous coverage, community-maintained | Product-level (not ingredient-level), highly inconsistent quality | Not suitable for catalogue foundation |
| NHS Eatwell | Reliable health framing | Very limited food inventory, guidance-focused not data-focused | Not suitable as data source |
| Wikipedia / Wikidata | Huge coverage, multilingual, structured | Trust level uncertain, vandalism risk, nutritional data unreliable | Useful for scientific names and aliases only |

**Recommended approach:** USDA FoodData Central as the catalogue backbone, with UK Food Composition Tables applied as a regional override layer for nutrients, and THA editorial data always winning when it exists.

---

### Conflict resolution

Three-level priority chain:

```
THA editorial (highest trust — always wins)
  ↓
UK Food Composition Tables (regional authority)
  ↓
USDA FoodData Central (global baseline)
```

Every field stores a `sourceRef` alongside the value. When two sources disagree, the higher-trust source wins. A future admin tool could flag conflicts for human review.

Example:
- USDA says salmon has 208 kcal/100g. UK FCT says 180 kcal/100g. THA editorial has 182 kcal. → THA editorial wins.
- Kohlrabi: USDA has it, THA editorial has nothing. → USDA value displayed, clearly attributed.

---

### Duplicate detection

The alias system is the primary defence:

- "Zucchini" (USDA name) → must resolve to "Courgette" (THA canonical) via alias matching before a new entry is created.
- "Arugula" → "Rocket"
- "Eggplant" → "Aubergine"

Import pipeline must:
1. Check slug match first.
2. Check alias match second.
3. Check scientific name match third.
4. Only create a new entry if all three fail.

Without this, the catalogue fills with US-English duplicates of UK-English canonical foods.

---

### Updates

USDA FoodData Central releases quarterly updates. For a food catalogue:
- Stable foods (carrot, chicken, lentils) rarely change meaningfully.
- New foods (novel proteins, emerging crops) are added occasionally.
- Recommended cadence: annual review of catalogue data, triggered by USDA major releases.
- THA editorial data is version-controlled in TypeScript — updates are PRs, not database jobs.

---

## Part B — Curated THA Knowledge

### Which foods deserve full THA treatment?

Not all foods — and this is intentional. THA's editorial voice is its differentiation. Spreading it thin degrades quality.

Three tiers, in descending editorial depth:

| Tier | Name | What it has | Examples |
|---|---|---|---|
| 1 | THA Curated | Description, benefits, nutrients, relationships, seasonality, stories, alternatives | Tomato, Salmon, Chickpeas (all 188 current knowledge foods) |
| 2 | Catalogue with context | Name, category, basic nutrients, source attribution, derived relationships | Kohlrabi, Oca, Teff, most regional/uncommon foods |
| 3 | Bare catalogue | Name, category, slug only | Extremely obscure foods, edge cases |

**The right curation model: editorial priority + demand-driven promotion.**

Not every food should be curated. The correct triggers for promotion to Tier 1:

1. **Usage signal**: A food appears frequently across household pantries/meals. If many households log soba noodles, soba becomes a curation priority.
2. **Editorial priority**: THA decides which food families matter (Mediterranean foods, fermented foods, gut-health foods). Foods in those families are queued for curation.
3. **Never automatic**: Promotion from Tier 2 to Tier 1 requires human review. Algorithms can queue; humans must approve.

The 181 canonical / 188 knowledge foods are entirely Tier 1 today. Expansion adds Tier 2 (catalogue), and the curation pipeline promotes Tier 2 → Tier 1 over time.

---

### How many foods at each tier?

Rough projections:

| Phase | Tier 1 (Curated) | Tier 2 (Catalogue) | Tier 3 (Bare) | Total recognisable |
|---|---|---|---|---|
| Now (WS0.8) | 188 | 0 | 0 | 188 |
| Near term | 300–500 | 500–2,000 | — | 2,000–2,500 |
| Medium term | 500–1,000 | 5,000–8,000 | ~2,000 | 10,000+ |
| Long term | 1,000–2,000 | 20,000+ | variable | 30,000+ |

THA's editorial identity lives in Tier 1. The catalogue (Tiers 2–3) enables recognition without claiming depth.

---

## Part C — Food Report Behaviour

### Curated food report (Tier 1)

Standard full report. No changes to current architecture.

```
Tomato

[THA description paragraph]

Benefits
└── [3–5 editorial benefits with explanations]

Nutrients
└── [Key macros and micros, sourced from THA knowledge]

Varieties
└── Cherry Tomato · Plum Tomato · Heirloom Tomato

Relationships
└── Same family: Aubergine, Pepper, Courgette
└── Often cooked with: Basil, Garlic, Olive Oil

Stories / Seasonality
└── [Editorial content]
```

---

### Catalogue-only food report (Tier 2)

Reduced, but still THA in character. The key UX principle: **reduced knowledge must feel intentional, not broken.**

```
Kohlrabi

A brassica vegetable native to Northern Europe, with a mild,
slightly sweet flavour. The swollen stem is eaten raw or cooked.

Nutrients
└── [Basic macros from USDA FoodData Central]

Also from the brassica family
└── Broccoli · Cauliflower · Cabbage · Brussels Sprouts · Kale

──────────────────────────────
THA's knowledge of this food is still growing. Check back soon.
──────────────────────────────
```

**Is this honest?** Yes. It accurately represents the data depth available.

**Is it useful?** Yes — recognition + basic nutrients + family relationships is a meaningful minimum.

**Is it frustrating?** Potentially, for households who use a food regularly and want more. But "THA is still learning" is less frustrating than "food not found." The frustration is a curation signal — high engagement with catalogue-only foods should accelerate their promotion to Tier 1.

---

### Copy principles for Tier 2

Avoid:
- "We don't have information about this food yet." (sounds broken)
- "THA is still learning about this food." (sounds like the AI is mid-thought)
- "Coming soon." (sounds like a product promise)

Prefer:
- "THA's full knowledge for this food is still in progress."
- "More about [food] is coming."
- Nothing — just show what exists without apology, and let the tier badge communicate depth.

The badge approach (a subtle "THA Curated" indicator on Tier 1 foods) is the cleanest UX. Tier 2 foods simply have no badge, no explanation needed.

---

## Part D — Discovery

### Can discovery work for catalogue-only foods?

Partially — and degraded discovery is better than no discovery.

**What works without editorial relationships:**

| Relationship type | Works for catalogue foods? | How |
|---|---|---|
| `same_variety` | Yes | Derived from canonical variety data |
| `same_family` | Yes | Derived from `subcategory` matching |
| `similar_to` | No | Editorial only |
| `often_cooked_with` | No | Editorial only |
| `shares_benefits` | No | Requires knowledge food benefits data |
| `seasonal_with` | Partially | If seasonality imported from catalogue source |
| `alternative_for_goal` | No | Editorial + goal context required |

**Worked example — Kohlrabi (Tier 2, Brassicas subcategory):**

```
Kohlrabi

Also from the brassica family:
└── Broccoli (Tier 1 — full knowledge)
└── Cauliflower (Tier 1 — full knowledge)
└── Cabbage (Tier 1 — full knowledge)
└── Brussels Sprouts (Tier 1 — full knowledge)
└── Kale (Tier 1 — full knowledge)
```

The discovery surface is narrow but real. The family relationship is structurally accurate.

**UX consideration:** derived relationships must be labelled differently from editorial ones. "Also from the brassica family" is truthful. "You might also enjoy" is editorial and should not appear for catalogue-only foods.

**Is this acceptable?** Yes — with appropriate framing. The discovery message shifts from "here are foods curated to go well with this" to "here are foods from the same family." Both are useful. Neither misleads.

**Should discovery degrade gracefully?** Yes. The degradation model:

```
Tier 1 food → full relationship graph (all 7 types)
Tier 2 food → structural relationships only (same_variety, same_family)
Tier 3 food → same_family only (if subcategory exists)
```

The resolver already supports this: `same_family` is derived, not editorial. A catalogue food with a correctly assigned subcategory gets family discovery for free.

---

## Part E — Backfilling Strategy

### Can THA reach 10,000+ foods?

The honest answer: **Claude authoring alone cannot scale to 10,000+ Tier 1 foods**. It can scale Tier 2 catalogue population if combined with automated ingestion.

**Scale zones:**

| Target | Feasibility | Method |
|---|---|---|
| 181 → 500 Tier 1 | Feasible now | Claude authoring (WS0.8 method) |
| 500 → 1,000 Tier 1 | Feasible within 3–6 months | Claude authoring + validator pipeline + THA spot review |
| 1,000 → 5,000 Tier 2 | Requires pipeline | Automated USDA import + alias dedup + staging |
| 5,000 → 10,000+ Tier 2 | Requires pipeline + moderation | Automated ingestion + confidence scoring + queue |

**Claude authoring ceiling:**

A WS0.8-style session produces ~20–30 well-authored foods per hour with validators passing. At this rate:
- 500 Tier 1 foods: ~15 hours across multiple sessions. Achievable.
- 1,000 Tier 1 foods: ~35 hours. Achievable with a sprint cadence over weeks.
- 5,000 Tier 1 foods: ~170 hours. Not practical without quality degradation.

For Tier 1 beyond ~1,000, the bottleneck is editorial review, not authoring. Every Tier 1 food requires a human to confirm: description accuracy, benefit claims, nutrient accuracy, relationship appropriateness. Claude can draft; only THA can certify.

**For Tier 2 (catalogue), the math is different:**

USDA FoodData Central has ~700,000 food records, but most are branded products. Filtered to basic ingredients: ~10,000–20,000. An import pipeline can ingest these in hours. The challenge is:
1. Deduplication against existing canonical foods (alias resolution)
2. Categorisation mapping (USDA categories ≠ THA categories)
3. UK English name normalisation
4. Quality floor (excluding records with missing or suspicious data)

**Staging and moderation requirements:**

At scale (1,000+ Tier 2 foods), a staging system becomes necessary:

```
USDA import → staging table (not live)
  ↓
Alias resolver (deduplication check)
  ↓
Category mapper (USDA → THA categories)
  ↓
Confidence scorer (data completeness)
  ↓
Queue for THA review (low-confidence) / Auto-promote (high-confidence)
  ↓
Live catalogue
```

**Confidence levels** are honest, not decorative:
- `high`: matches known food patterns, complete data, no alias conflicts
- `medium`: some gaps, possible alias ambiguity — human spot-check recommended
- `low`: incomplete data, unusual category, possible duplicate — human review required

At Tier 1, confidence is binary: curated (reviewed) or not curated (not live as Tier 1).

---

## Part F — Trust Model

### Could catalogue + curated create contradictions?

Yes. Three specific risks:

---

**Risk 1: Conflicting nutritional facts**

A catalogue entry for avocado (from USDA) shows different calorie figures than THA's editorial knowledge food.

Prevention:
- THA editorial always wins for any food that has a knowledge food entry.
- The API layer never serves catalogue nutrient data when knowledge data exists.
- The catalogue is not a fallback display — it is a foundation that knowledge data is built upon.

---

**Risk 2: Duplicate foods**

"Zucchini" imported from USDA creates a new catalogue entry alongside the existing "Courgette" canonical food.

Prevention:
- The alias system (`canonical_food_alias` table) already contains "courgette" → aliases include "zucchini".
- Import pipeline checks alias table before creating entries.
- Scientific name (`Cucurbita pepo`) provides a third deduplication axis.
- Duplicates that slip through the pipeline appear in a review queue, not live.

---

**Risk 3: False confidence from tier mixing**

A user sees a deep food report for tomato, then a thin report for kohlrabi, and assumes THA is inconsistent rather than understanding the tier difference.

Prevention:
- Explicit tier badging: "THA Curated" appears on Tier 1 food reports.
- Tier 2 reports are visually distinct (shorter, fewer sections) — the gap is visible.
- Onboarding copy explains: "THA has deep knowledge of [N] foods, with more being added regularly."
- No food should appear in food report search results unless it has at least Tier 2 (catalogue) status.

---

**What does NOT cause trust problems:**

- Catalogue foods existing in the database but not surfaced in the UI yet. Silent expansion is fine.
- Catalogue foods appearing in search but showing reduced information. The reduction is honest.
- Tier 2 foods receiving family-only discovery. That is accurate, not misleading.

---

## Part G — Launch vs Future

### Three options

**Option A: Only expose curated foods at launch**
Only the 188 knowledge foods appear in food reports and food search. Everything else returns "not found."

**Option B: Expose catalogue foods with reduced knowledge**
Catalogue foods appear in search and food reports, with visibly reduced information and tier labelling.

**Option C: Expose everything equally**
All foods display in the same format. Tier differences are invisible to users.

---

### Recommendation: A at launch, B in near-term phase

**At launch: Option A.**

Reasons:
- Trust is THA's primary differentiator. A single low-quality or incorrect food report damages it.
- 181 canonical / 188 knowledge foods already cover the majority of UK household eating. Most households will not encounter "food not found" for common foods.
- The catalogue architecture can be built in the background without being user-visible. This is the right order: build the system, validate it, then expose it.
- "We don't know that food yet" is an acceptable launch answer. "We know this food but our information is incomplete" requires the Tier 2 UX to be polished first.

**Next phase: Option B.**

Once:
- The catalogue pipeline has been built and validated (dedup, category mapping, source attribution)
- The Tier 2 food report UI has been designed and tested
- THA has confidence in the quality floor for catalogue-imported foods

...then exposing Tier 2 foods with reduced but honest information is the right move. It extends recognition breadth while preserving editorial depth for Tier 1.

**Never: Option C.**

Presenting catalogue data and curated data equally is a trust risk. Users cannot distinguish quality levels, and incorrect or incomplete catalogue data appears with the same confidence as editorial knowledge. This is how trust erodes.

---

## Final Question — Can THA Become a Catalogue of Almost Every Edible Food?

**Yes.**

The architecture that achieves this:

---

### Three-tier food model

```
┌─────────────────────────────────────────────────────┐
│  TIER 3: Bare Catalogue                             │
│  slug, name, category only                          │
│  Source: automated import, edge cases               │
│  UI: not surfaced (internal only, or "not found")   │
└─────────────────────────────────────────────────────┘
           ↑ promoted when data enriched
┌─────────────────────────────────────────────────────┐
│  TIER 2: Catalogue with Context                     │
│  + subcategory, aliases, basic nutrients, source    │
│  Source: USDA / UK FCT import + dedup pipeline      │
│  UI: reduced food report, family discovery only     │
└─────────────────────────────────────────────────────┘
           ↑ promoted when editorial review complete
┌─────────────────────────────────────────────────────┐
│  TIER 1: THA Curated                               │
│  + description, benefits, relationships, stories    │
│  Source: THA editorial authoring (Claude + review)  │
│  UI: full food report, all relationship types       │
└─────────────────────────────────────────────────────┘
```

Every canonical food today is Tier 1. Every new food enters at Tier 2 (or lower) and is promoted by editorial work. The catalogue is the foundation the canonical layer is built upon — not a parallel track.

---

### Ingestion strategy

```
External source (USDA FoodData Central)
  ↓
Alias resolution — check against existing canonical aliases
  ↓
Category mapping — USDA categories → THA categories
  ↓
Confidence scoring — completeness + conflict check
  ↓
Staging (not live)
  ↓
THA review queue (low/medium confidence)
    OR
Auto-promote to Tier 2 (high confidence, no conflicts)
  ↓
Live catalogue (Tier 2)
  ↓
Editorial priority queue → Claude authoring → THA review → Tier 1
```

---

### Data field ownership by tier

| Field | Tier 1 source | Tier 2 source | Tier 3 |
|---|---|---|---|
| `slug` | THA editorial | THA or import | Import |
| `name` | THA editorial | Import + normalised | Import |
| `aliases` | THA editorial | Import | Import |
| `category` | THA editorial | THA mapper | Import |
| `subcategory` | THA editorial | THA mapper | — |
| `scientificName` | THA editorial | Import | Import |
| `description` | THA editorial | Import (attributed) | — |
| `nutrients` | THA editorial | Import (attributed) | — |
| `benefits` | THA editorial | — | — |
| `relationships` | THA editorial + derived | Derived only | — |
| `seasonality` | THA editorial | Import (if available) | — |
| `stories` | THA editorial | — | — |

---

### Trust properties maintained

| Property | How maintained |
|---|---|
| Trustworthy | THA editorial wins in all conflicts. Tier 2 data is clearly attributed. |
| Curated | Tier 1 label only applies after human editorial review. |
| Educational | Tier 1 full reports; Tier 2 honest but still informative. |
| Family friendly | No tier exposes content that isn't family-safe. |
| Non-judgemental | Tier structure describes knowledge depth, not food quality. Kohlrabi is not less healthy than tomato because it is Tier 2. |

---

## Migration Implications

**No migration required at investigation phase.**

When Tier 2 is implemented:
- Schema addition: `tier` column on `canonical_food` table (`catalogue` | `canonical`) — canonical foods are already canonical in spirit, so this is a label formalisation.
- Schema addition: `sourceRef` column for nutrient provenance.
- New table: `catalogue_foods` (if Tier 2 is kept separate from canonical) OR `catalogueStatus` field on existing `canonical_food`.

**Two structural choices for Tier 2 storage:**

Option 1: Unified table (one `canonical_food` table with `tier` field)
- Simpler joins. Tier is a field, not a location.
- Risk: catalogue data pollutes the canonical query paths if `tier` filtering is forgotten.

Option 2: Separate `catalogue_food` table, promoted to `canonical_food` on curation
- Cleaner separation. Promotion is an explicit data event.
- More complex migrations when promoting.

**Preliminary recommendation:** Unified table with `tier` field and strong query conventions (`WHERE tier = 'canonical'` for all THA-grade lookups). The risk of forgetting the filter is lower than the complexity of managing promotion migrations.

---

## Launch Implications

**WS0.9 does not change launch scope.**

At launch:
- 181 canonical / 188 knowledge foods (Tier 1 only)
- Food reports: full experience for all 181
- Discovery: WS7 relationship types (editorial + derived)
- Search: canonical foods + aliases only
- "Not found" for foods outside the catalogue

**Post-launch, pre-catalogue phase:**
- Continue Claude authoring (WS0.8 method) to expand Tier 1 to 300–500
- Begin designing the catalogue pipeline architecture
- Do not surface Tier 2 foods until pipeline is validated

**Post-catalogue phase:**
- Tier 2 foods live in search and food reports (reduced experience)
- Clear tier labelling in UI
- Curation promotion queue active

---

## Recommendations

1. **Maintain strict tier separation.** Tier 1 (curated) and Tier 2 (catalogue) must never appear equal in the UI. The difference is load-bearing for trust.

2. **Use USDA FoodData Central as the catalogue foundation.** Apply UK Food Composition Tables as a regional override. THA editorial always wins.

3. **Build alias resolution before catalogue import.** The deduplication problem (zucchini/courgette) is the highest-risk technical failure in catalogue ingestion. Solve it first.

4. **Invest in the category mapper.** USDA categories do not map cleanly to THA categories. A mapping table (USDA category → THA category) is required before any import.

5. **Curate by editorial priority, not comprehensiveness.** The 30 Plants model is a useful framing: THA knows deeply the foods that matter most to its users, not all foods equally.

6. **Launch with Tier 1 only.** The current 181/188 is the right launch scope. Do not expose Tier 2 until the pipeline quality is validated.

7. **Use usage data to drive curation priorities.** When Tier 2 is live, track which catalogue foods households engage with. Those are the next curation queue entries.

8. **Attribute all catalogue data.** "Source: USDA FoodData Central" in the UI is not a weakness — it is honest and reinforces THA's editorial discipline.

---

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Catalogue data contradicts THA editorial | High | Medium | THA editorial always wins in conflict resolution |
| Duplicate foods (US/UK English) | High | High | Alias resolution before import; scientific name dedup |
| Trust erosion from low-quality Tier 2 | High | Medium | Staging + quality floor + confidence scoring |
| Tier 2 UX feels broken, not intentional | Medium | Medium | Explicit tier badging; designed reduced report |
| Category mapping errors pollute discovery | Medium | High | Category mapper is a first-class deliverable |
| Curation backlog grows faster than capacity | Medium | High | Demand-driven priority; Claude authoring scales |
| Users expect all foods to have full knowledge | Low | Medium | Onboarding + tier labelling manages expectations |
| USDA API changes break ingestion pipeline | Low | Low | Source abstraction layer; annual update cadence |

---

## SUGGESTION (out of scope for WS0.9)

- **Community curation signals**: household logs of catalogue-only foods automatically generate a curation queue entry with engagement data attached.
- **Catalogue import CLI**: a THA-internal tool that runs USDA → staging → review queue in one command.
- **Knowledge confidence score on food reports**: internal signal (not user-facing) showing how complete the knowledge data is per food.
- **Scientific name as universal identifier**: treat the scientific name as a cross-source deduplication key, not just a display field. Reduces alias collision risk significantly.
- **Regional catalogue extensions**: UK-specific foods (laverbread, Eccles cake ingredients) may not be in USDA. A UK FCT dedicated import pass would catch these.
- **Relationship seeding for common Tier 2 foods**: even before editorial review, `same_family` + `same_variety` relationships auto-populate from the category mapper. Discovery for catalogue foods starts immediately.

---

## Definition of Done

| Deliverable | Status |
|---|---|
| Catalogue architecture explored | Done |
| Curated layer architecture explored | Done |
| Food Report behaviour explored | Done |
| Discovery implications explored | Done |
| Backfill strategy explored | Done |
| Launch vs future recommendation made | Done — Option A at launch, Option B post-pipeline |
| Risks identified | Done |
| Implementation | None — investigation only |
| Schema changes | None |
| Data changes | None |
