# NK3 — Canonical Nutrition Knowledge Pack 1

**Status:** Investigation and roadmap (no implementation)  
**Date:** 2026-07-07  
**Purpose:** Define the first production Nutrition Knowledge Pack for ordinary UK households. Identify scope, coverage gaps, authoritative sources, and implementation sequencing.  
**Governing documents:** `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`

---

## EXECUTIVE SUMMARY

The first Nutrition Knowledge Pack (NK3–P1) is **not a feature**; it is **a curated editorial kernel of knowledge** that makes THA genuinely useful to ordinary UK households. It prioritizes foods households actually cook with, knowledge that directly informs meal choices, and practical guidance that respects budget, time, and cultural constraints.

NK3–P1 ships with:

- **50–80 canonical foods** (UK staples: legumes, grains, vegetables, affordable proteins) with complete knowledge coverage
- **Nutrition context prose** (why this food matters, how to choose well, when to use it) for every food
- **Principal food sources** for key nutrients, with practical alternatives (fresh/frozen/dried/canned)
- **Seasonality and affordability guidance** specific to UK households
- **Food relationships** (variants, pairings, family ties, seasonal alternatives)
- **Preparation and cooking impacts** (nutrient change with cooking, ripeness, storage)
- **Common household uses** (how this food appears in ordinary meals)
- **Planner and shopping opportunities** (where this food helps fill gaps, how to find it)

**Key principle (NK2 Methodology):** Guidance is food-centric, household-first, and sourced. Pack 1 emphasizes *honest depth* over aspirational breadth. Better to have 50 foods with complete, sourced knowledge than 200 foods with sparse, fabricated claims.

---

## PACK 1 SCOPE & PRIORITISATION

### What Pack 1 Is

NK3–P1 is the **editorial foundation for ordinary UK households** — the knowledge THA is confident explaining because it is:

1. **Well-sourced** (USDA + UK sources: NHS, BNF, gov.uk, local growing calendars)
2. **Practically useful** (answers the question "should I cook this meal?")
3. **Household-accessible** (foods a UK household can actually buy, afford, and prepare)
4. **Culturally respectful** (includes foods from cuisines common in UK households)
5. **Seasonally grounded** (reflects UK growing seasons and import patterns)
6. **Affordably positioned** (budget-friendly options listed first)

### What Pack 1 Is NOT

- Not exhaustive (139 other canonical foods deferred to Packs 2–4)
- Not for benchmark recipes or aspirational cuisine
- Not for rare/regional foods (Community phase)
- Not for branded products or prepared meals (Community phase)
- Not for medical diet patterns (low-FODMAP, renal diet — regulatory boundary)

### Prioritisation Criteria

Pack 1 foods are selected by:

1. **Household frequency:** Foods appearing in >50% of UK household meal plans (data from THA cohort)
2. **Nutritional power:** Foods that are principal sources for 3+ key nutrients
3. **Affordability:** Foods that provide nutrition within budget constraints
4. **Prep accessibility:** Foods that don't require specialized equipment or technique
5. **Versatility:** Foods that appear across multiple cuisines/meal types
6. **Cultural representation:** Foods from cuisines common in UK households (South Asian, Mediterranean, East Asian, African, Caribbean, traditional British)
7. **Sourcing confidence:** Foods with established NHS/BNF/USDA evidence for claimed benefits

---

## CURRENT COVERAGE AUDIT

### Knowledge Inventory (from NK1)

| Knowledge Layer | Pack 1 Applicability | Current Coverage | Gap |
|---|---|---|---|
| **Food Identity (239 foods)** | All 239 canonical foods in system | ✅ Complete | None for Pack 1 |
| **Food Composition (188 foods w/ USDA)** | All 50–80 Pack 1 foods should have USDA data | ~80% of Pack 1 foods (estimated) | Verify USDA mapping completeness; add portion-size variants |
| **Nutrient Vocabulary (30 nutrients)** | All 30 apply; show top 5–8 per food | ✅ Complete (seed) | None; locked vocabulary |
| **Health Benefits (15 benefits)** | 5–8 apply per food; show only sourced | 5 established (Heart, Gut, Immune, Bone, Energy) + 3 emerging | Phase 0 gate: confirm final 5; sourcing for 3 emerging TBD |
| **Nutrition Context (46 foods proto-data)** | Target 188 foods, focus Pack 1 first | 46 foods have proto-prose | 🔴 **CRITICAL GAP** — 40–80 Pack 1 foods need context authored |
| **Food Relationships** | Seasonality, variants, pairings, families | Designed but no data populated | 🔴 **CRITICAL GAP** — 100–150 edges per Pack 1 (pairings, seasonality, variants) |
| **Allergen Definitions** | All hard restrictions apply | ✅ Top 14 EU allergens complete | ✅ Sufficient for Pack 1 launch |
| **Diversity Classification** | All Pack 1 foods classified | ✅ 239 foods classified (M4 complete) | ✅ Sufficient for Pack 1 |

### Existing Nutrition Context (Proto-Data)

From `pantry_ingredient_knowledge.ts` (M2 migration legacy), 46 foods have seed prose:

**Legumes (5):** Lentils, chickpeas, black beans, kidney beans, split peas  
**Grains (3):** Oats, brown rice, wholemeal bread  
**Vegetables (8):** Broccoli, spinach, sweet potato, carrots, tomatoes, bell peppers, kale, Brussels sprouts  
**Proteins (4):** Eggs, salmon, chicken, almonds  
**Oils/Condiments (3):** Olive oil, garlic, ginger  
**Dairy (2):** Greek yogurt, milk  
**Fruits (2):** Apples, berries  
**Other (14):** Nuts, seeds, herbs, etc.

**Assessment:** This proto-data is uneven in quality and completeness. Some entries are 1–2 sentences; others are 3–4. Voice is inconsistent. **Action:** Standardise and expand, not replace.

---

## PACK 1 FOOD SELECTION

### Target Scope: 60 Core Foods

Reasoning: Large enough to cover diverse household meal-planning needs; small enough for complete editorial coverage (goal: 8–12 weeks of focused authoring).

### Selection by Category

#### **Legumes & Pulses (8 foods)**
Priority: **Highest** — Nutritionally dense, affordable, culturally universal, keystone for plant diversity.

- Lentils (green, red split, brown)
- Chickpeas (canned, dried)
- Black beans
- Kidney beans
- Split peas
- Baked beans (tinned, for affordability/accessibility)

*Rationale:* Affordable staple in >80% of UK households; principal source for fibre, plant protein, folate, iron; versatile across cuisines.

---

#### **Grains & Cereals (8 foods)**
Priority: **Highest** — Staple carbohydrate, affordable, principal fibre source, versatility.

- Brown rice (short-grain, long-grain)
- Wholemeal bread
- Oats (rolled, steel-cut)
- Wholemeal pasta
- Barley
- Quinoa
- Millet (for diversity)
- Buckwheat (for diversity)

*Rationale:* Every household uses grains; Pack 1 focuses on whole-grain options (fibre, B vitamins, minerals). Include raffia alternatives (barley, millet, buckwheat) to show variety beyond brown rice + oats.

---

#### **Vegetables (12 foods)**
Priority: **High** — Affordable, seasonal (UK sourced), nutritionally diverse, household staple.

**Leafy greens (3):**
- Spinach (fresh, frozen)
- Kale
- Cabbage (spring, summer, winter varieties)

**Root/Tuber (3):**
- Carrots
- Sweet potato
- Parsnips

**Brassicas (2):**
- Broccoli
- Brussels sprouts

**Other (4):**
- Tomatoes (fresh, tinned)
- Bell peppers (red, green, yellow)
- Onions (white, red)
- Courgettes

*Rationale:* UK seasonal vegetables, affordable year-round (fresh in season, frozen/tinned as equals), principal sources for vitamins, minerals, fibre, phytochemicals.

---

#### **Fruits (6 foods)**
Priority: **Medium** — Seasonal, affordable (frozen/tinned as equals to fresh), sweet tooth satisfaction, nutrition accessible.

- Apples (eating, cooking varieties)
- Berries (blueberries, strawberries, raspberries — fresh/frozen)
- Bananas
- Oranges
- Pears
- Stone fruits (peaches, plums — seasonal)

*Rationale:* Affordable, seasonally available in UK, principal sources for vitamin C, fibre, polyphenols.

---

#### **Proteins: Animal (6 foods)**
Priority: **High** — Affordable, accessible, principal source for protein, B12, iron, zinc.

- Eggs
- Chicken (whole, breast, thighs; fresh, frozen)
- Canned fish (sardines, mackerel, tuna)
- Ground beef (beef mince)
- Pork (pork mince, loin, chops)
- Milk (cow's milk, for dairy eaters)

*Rationale:* Budget-friendly protein options accessible to most UK households. Emphasize affordability (eggs, canned fish, mince) over premium cuts.

---

#### **Proteins: Plant-Based (4 foods)**
Priority: **High** — Affordable, culturally significant, principal source for plant protein.

- Tofu
- Tempeh
- Nuts (almonds, peanuts, walnuts, cashews — mixed)
- Seeds (pumpkin, sunflower, flax, chia — mixed)

*Rationale:* Legumes covered above; these add variety. Emphasize affordability (peanuts, sunflower seeds) alongside premium options (cashews).

---

#### **Dairy & Alternatives (4 foods)**
Priority: **Medium** — Affordable, accessibility varies by diet pattern.

- Greek yogurt
- Cheese (cheddar, as representative)
- Milk (covered above)
- Plant-based milk (oat, soy — for dietary diversity)

*Rationale:* Calcium sources; accessibility varies by cost + diet pattern. Include both dairy and plant-based.

---

#### **Fats & Oils (3 foods)**
Priority: **Low-Medium** — Small volume, high impact per serving.

- Olive oil (for salads, finishing)
- Vegetable oil (for cooking: rapeseed, sunflower)
- Butter (for households that use it)

*Rationale:* Context: cooking methods, heat-stability, portion guidance. Not showcased as "foods" but as culinary knowledge.

---

#### **Herbs & Aromatics (5 foods)**
Priority: **Low-Medium** — Small volume, cultural diversity, depth-of-knowledge opportunity.

- Garlic
- Ginger
- Onions (culinary role, distinct from food role)
- Coriander (herb and seed)
- Turmeric

*Rationale:* Appear in >50% of meals; opportunity to teach about cooking methods, preservation, seasonal sourcing.

---

#### **Condiments & Flavourings (2 foods)**
Priority: **Low** — High-sodium risk; context-focused.

- Soy sauce (or tamari for low-sodium)
- Honey

*Rationale:* Common household use; opportunity to contextualize sodium, sugar, portion guidance.

---

### Total: **60 Core Foods**

This scope prioritizes **household staples with depth** over aspirational foods. Every food in Pack 1 will have:
- ✅ Identity & composition (from NK1)
- ✅ 5–8 key nutrients (from NK1)
- ✅ 5 sourced health benefits (from NK1, pending benefit confirmation)
- 🟡 Nutrition context prose (to author)
- 🟡 Food relationships (seasonality, variants, pairings — to map)
- 🟡 Practical guidance (cooking, storage, affordability, alternatives)

---

## KNOWLEDGE REQUIREMENTS PER FOOD

### Minimum NK3–P1 Content Standard

Every Pack 1 food must include:

#### 1. **Food Identity** (Existing from NK1)
- Canonical name (e.g. "Broccoli")
- Aliases (e.g. "Calabrese broccoli", "sprouting broccoli")
- Primary image (food in situ, not plated)
- Diversity group (Vegetable, Legume, Grain, Fruit, Protein, etc.)

#### 2. **Composition & Key Nutrients** (Existing from NK1)
- Serving size (per 100g + typical household serving)
- USDA portion data (if available; NK1 has this)
- 5–8 key nutrients (macro + 4–7 micros/phytos)
- Nutrient notes for special cases (e.g. cooked vs. raw iron bioavailability)

#### 3. **Health Benefits** (From NK1 + NK2 methodology)
- 1–4 sourced benefits (from 5 established: Heart, Gut, Immune, Bone, Energy)
- Benefit explanation (food → nutrient → benefit, per M1 methodology)
- Source reference (NHS, BNF, USDA evidence)

#### 4. **Nutrition Context** (To Author — CRITICAL GAP)
**Structure (3–4 sentences, food-first):**
- **Headline:** Why this food matters for ordinary households (1 sentence)
- **Nutrients:** What makes it nutritionally notable (1 sentence)
- **Use case:** When/how households typically use it (1 sentence)
- **Selection guidance:** How to choose (fresh/frozen/tinned/dried variants as equals)

**Example (aspirational):**
> "Lentils are a powerhouse legume that makes plant-based meals substantial and affordable. They're a principal source of plant protein, fiber, and iron — three nutrients many plant-focused eaters track. You'll find them as a base for soups, salads, curries, and as a red-meat replacement. Dried lentils cost little and keep well; tinned lentils are equally nutritious and save prep time."

#### 5. **Practical Variants** (To Author)
- **Forms available:** Fresh/dried/frozen/tinned/canned options
- **Affordability tier:** ✅ Budget-friendly / ⭐ Premium / 📊 Price varies by season
- **UK seasonality:** When locally grown; when imported; when canned/frozen available
- **Storage & shelf-life:** How long it keeps; best storage method
- **Prep & cooking:** How cooking changes nutrient profile (e.g. cooking increases bioavailability of some, reduces others)

**Example (aspirational):**
> **Broccoli variants:**
> - Fresh (spring/summer: UK-grown, cheaper; autumn/winter: Spanish imports, pricier)
> - Frozen (year-round, same nutrition as fresh, often cheaper)
> - Tinned (rare; not recommended — texture loss, sodium added)
>
> **Cooking impact:** Raw broccoli has higher vitamin C but lower sulforaphane bioavailability. Light steaming (3–4 min) preserves both. Boiling leaches vitamins into water (save the water for soups).

#### 6. **Food Relationships** (To Map — CRITICAL GAP)
- **Family ties:** Related foods (same plant family or culinary family)
- **Seasonal pairings:** What grows/cooks well together
- **Nutritional pairing:** Foods that enhance nutrient absorption (e.g. vitamin C + iron)
- **Cultural use:** Cuisines where this food is central
- **Affordable alternatives:** Swap-worthy foods with similar nutrition

**Example (aspirational):**
> **Relationships:**
> - **Family:** Chickpeas (legume family); compares to lentils, beans
> - **Seasonal:** Spring greens + spring peas = seasonal pairing in UK gardens
> - **Nutritional:** Chickpeas + spinach = good plant protein + iron pairing
> - **Cuisine:** Central to Indian, Mediterranean, Middle Eastern cooking
> - **Alternatives:** Cooked chickpeas ≈ cooked lentils (cost/prep time trade-off); black beans (if texture preference differs)

#### 7. **Planner & Shopping Opportunities** (To Define)
- **Gap-filling:** Which nutrients does this food address?
- **Meal context:** Common meals where this appears (breakfast, lunch, dinner, snack)
- **Household patterns:** If household is low in fibre, legumes light up in recommendations
- **Shopping intent:** "Looking for plant protein" → legumes surface first

---

## AUTHORITATIVE SOURCES MAPPING

### Tier 1 (Canonical, Governance-Gated)

| Source | What it provides | License | NK1 Trust Gate | Pack 1 Use |
|---|---|---|---|---|
| **USDA FDC** | Nutrient composition (macros, micros, serving sizes) | Public domain (with attribution) | ✅ Raw ingestion via `ingredient_classifications` | Composition data for all 60 foods |
| **NHS Eatwell Guide** | UK household guidance, food groups, portion sizes | Crown copyright (free use with attribution) | ✅ Trusted domain for UK-specific guidance | Household portion sizes, seasonal UK farming calendar |
| **British Nutrition Foundation (BNF)** | Balanced diet guidance, nutrient education | Licence (partnership required) | ✅ Trusted domain for sourced claims | Nutrient benefits, household dietary patterns |

### Tier 2 (Research-Supported, Editorial Review)

| Source | What it provides | License | NK1 Trust Gate | Pack 1 Use |
|---|---|---|---|---|
| **EFSA (European Food Safety Authority)** | Health claim rulings, evidence standards | Public domain | ✅ Trusted domain for benefit claims | Benefit sourcing, EFSA wording firewall |
| **NIH Office of Dietary Supplements** | Nutrient function, evidence summaries | Public domain | ✅ Trusted domain for micronutrient research | Micronutrient benefits (e.g. selenium, vitamin D) |
| **gov.uk / DEFRA** | UK seasonal growing calendar, food production data | Crown copyright | ✅ UK-specific sourcing | Seasonality, affordability, import patterns |

### Tier 3 (Operational, Internal Curation)

| Source | What it provides | License | NK1 Trust Gate | Pack 1 Use |
|---|---|---|---|---|
| **Tesco/Sainsbury's seasonal guides** | UK supermarket seasonality, affordability | Commercial (partnerships) | ⭐ Requires partnership; cite with permission | Affordability tier, in-season availability |
| **THA cohort data** | Household meal frequency, common uses | Proprietary | ⭐ Anonymized; household frequency validation | "Common household uses" section sourcing |
| **Academic nutritionists** | Cooking method impact, nutrient bioavailability | Licence per paper | ✅ Peer-reviewed; cite with DOI | Preparation guidance, cooking impacts |

### Content Sourcing Workflow

For each Pack 1 food:

1. **Composition:** USDA → NK1 ingestion ✅ (done)
2. **Benefits:** BNF/EFSA/NIH-ODS → Nutritionist review → NK1 sourcing
3. **Context:** NHS Eatwell + BNF + THA cohort patterns → Editorial authoring → Nutritionist review
4. **Variants:** gov.uk calendar + supermarket data → Editorial + partnerships
5. **Cooking:** Academic sources (peer-reviewed) + THA testing → Editorial + proof-reading

---

## KNOWLEDGE GAPS & IMPLEMENTATION STRATEGY

### Gap 1: Nutrition Context Prose (40–50 foods need authoring)

**Current state:** 46 foods have proto-prose (uneven quality, 1–4 sentences, inconsistent voice)

**Target state:** 60 foods with standardised, sourced, 3–4 sentence prose per food

**Effort estimate:** 40–50 hours editorial (40 new foods × ~1 hour per food including research, authoring, review)

**Sequencing:**
1. Weeks 1–2: Standardise existing 46 proto-foods (voice, structure, source validation)
2. Weeks 3–4: Author nutrition context for 14 new Pack 1 foods (fruits, herbs, condiments not yet covered)
3. Week 5: Nutritionist review + source gate pass

**Ownership:** Editorial + Nutritionist

---

### Gap 2: Food Relationships Graph (100–150 edges)

**Current state:** Designed (`shared/relationships/food-graph.ts`); data absent

**Target state:** 100–150 sourced relationships per Pack 1 (2–3 edges per food avg: seasonality, variant, pairing)

**What to map:**
- **Seasonality (60 edges):** When each food grows/imports; what pairs seasonally
- **Variants (40 edges):** Fresh/frozen/dried/tinned forms; related foods (spinach → kale)
- **Pairings (30 edges):** Nutritional synergies (vitamin C + iron), culinary pairings
- **Family ties (20 edges):** Botanical/culinary family (all legumes related; all brassicas related)

**Effort estimate:** 30–40 hours research + mapping (identify edges; source seasonality data; validate relationships)

**Sequencing:**
1. Week 2: Research UK seasonality calendar (gov.uk, supermarket data)
2. Week 3: Map variant edges (fresh/frozen/tinned forms per food)
3. Week 4: Map seasonal pairings + culinary families
4. Week 5: Map nutritional synergies (with Nutritionist input)

**Ownership:** Editorial + Research

---

### Gap 3: Cooking & Preparation Guidance (60 foods)

**Current state:** Minimal; only proto-data hints exist

**Target state:** 1–2 sentence guidance per food on prep, cooking, nutrient impact

**What to include:**
- Raw vs. cooked nutrient changes (does cooking increase/decrease key nutrients?)
- Ripeness impact (unripe vs. ripe affects nutrients + taste)
- Storage & shelf-life (room temp vs. fridge vs. freezer)
- Quick-cook options (for time-constrained households)

**Effort estimate:** 20–30 hours editorial (partner with culinary test kitchen if available; otherwise sourced from BNF/NHS)

**Sequencing:**
1. Week 3: Pull existing preparation guidance from BNF resources
2. Week 4: Fill gaps with editorial input + brief testing (especially for cooking impact claims)
3. Week 5: Incorporate into food context (part of variant guidance)

**Ownership:** Editorial + Nutritionist

---

### Gap 4: Affordability Tiers (60 foods)

**Current state:** Not systematically recorded

**Target state:** Every food tagged with affordability tier (✅ Budget-friendly / ⭐ Premium / 📊 Price varies)

**What to establish:**
- Baseline price (UK average, as of 2026-07)
- Seasonal variance (cheaper in-season vs. out-of-season)
- Form variance (fresh vs. frozen vs. canned affect price)

**Effort estimate:** 10–15 hours research (supermarket pricing data, gov.uk agricultural data)

**Sequencing:**
1. Week 2: Pull current pricing from Tesco/Sainsbury's online (per canonical food)
2. Week 3: Layer in seasonal variance (gov.uk calendar)
3. Week 4: Integrate into food knowledge (part of variant guidance)

**Ownership:** Editorial + Data research

---

### Gap 5: Health Benefits Sourcing (5 final benefits)

**Current state:** 5 benefits established (Heart, Gut, Immune, Bone, Energy); 3 emerging (Muscle, Brain, Sleep)

**Target state:** Confirm final 5 for Pack 1; source relationships for each

**Effort estimate:** 5–10 hours research (per NK1 WS2 workstream)

**Sequencing:**
- **Immediate:** WS2 (Knowledge Layer V1) confirms final 5 benefits for launch
- **Week 2:** Research minimum 5 sourced + established foods per benefit (from EFSA/NHS/NIH-ODS)
- **Week 3:** Bridge benefits to Pack 1 foods (which foods show which benefits)

**Ownership:** Editorial + Nutritionist (per NK1)

---

## PACK 1 IMPLEMENTATION ORDER

### Phase: Foundation (Weeks 1–2)

**Deliverables:**
1. ✅ Confirm Pack 1 food selection (60 foods finalized)
2. ✅ Standardise nutrition context for 46 existing proto-foods (voice, source gate, structure)
3. ✅ Verify USDA composition coverage (all 60 foods have serving-size data)
4. ⭐ Confirm health benefits (5 final benefits per NK1 WS2)

**Ownership:** Editorial, Data Engineering, Nutritionist

**Dependencies:** NK1 benefit confirmation (rule: no benefits in Pack 1 until final 5 locked)

---

### Phase: Research & Mapping (Weeks 2–4)

**Deliverables:**
1. ✅ UK seasonality calendar (all 60 foods × season)
2. ✅ Food relationships edges (100–150 mapped + sourced)
3. ✅ Cooking & preparation guidance (60 foods, 1–2 sentences each)
4. ✅ Affordability tiers + variant pricing
5. ✅ Health benefits sourcing complete (5 benefits × 5–20 Pack 1 foods each)

**Ownership:** Editorial, Research, Nutritionist

**Parallel work:** Engineering can wire food-graph edges into discovery/alternatives logic (Phase 1, but can start design)

---

### Phase: Content Authoring (Weeks 3–5)

**Deliverables:**
1. ✅ New nutrition context prose (14 foods not yet covered)
2. ✅ Variant guidance (fresh/frozen/dried/canned per food)
3. ✅ Planner opportunity mapping (which foods fill which nutritional gaps)
4. ✅ Shopping opportunity mapping (search intent → food suggestions)

**Ownership:** Editorial, Nutritionist

**Dependencies:** Seasonality + affordability mapping complete (week 3)

---

### Phase: Review & Gating (Week 5–6)

**Deliverables:**
1. ✅ Nutritionist review of all benefits sourcing
2. ✅ Nutritionist review of cooking impact claims
3. ✅ EFSA wording firewall check (zero banned words: "prevents", "treats", "cures")
4. ✅ Source gate audit (100% of sourced claims have SourceRef + lastReviewed)
5. ✅ Prose quality audit (voice consistency, household accessibility, food-first phrasing per NK2)

**Ownership:** Nutritionist, Editorial

**Dependencies:** All content complete (week 5)

---

### Phase: Engineering Integration (Weeks 6–8, Parallel)

**Deliverables:**
1. ✅ Food composition data seeded (all 60 foods → NK1 knowledge_food_nutrients)
2. ✅ Health benefits relationships seeded (5 benefits × foods → NK1 knowledge_food_benefits)
3. ✅ Nutrition context prose seeded (→ `food_knowledge` table)
4. ✅ Food relationships edges seeded (→ `shared/relationships/food-graph.ts`)
5. ✅ Affordability + seasonality metadata stored (→ new KMS tables or food_knowledge extensions)
6. ✅ Evidence gate enforced (isEvidenceBackedClaim() validator passes all claims)

**Ownership:** Engineering, Data

**Dependencies:** Content review complete + source gate locked (week 5)

---

## PACK 1 COVERAGE ROADMAP

### What's Covered at Launch

| Knowledge Area | Coverage | Status |
|---|---|---|
| **Food Identity** | 60/60 foods (100%) | ✅ Complete (from NK1) |
| **Composition (USDA)** | 60/60 foods (100%) | ✅ Complete (verified this phase) |
| **Key Nutrients** | 5–8 per food, 30-nutrient vocabulary | ✅ Complete (from NK1) |
| **Health Benefits** | 1–4 per food, 5 sourced benefits | ⭐ Pending benefit confirmation |
| **Nutrition Context** | 60/60 foods (100%) | 🟡 Week 5 target |
| **Cooking Guidance** | 60/60 foods (100%) | 🟡 Week 4 target |
| **Seasonality & Variants** | 60/60 foods (100%) | 🟡 Week 3 target |
| **Affordability Tiers** | 60/60 foods (100%) | 🟡 Week 2 target |
| **Food Relationships** | 100–150 edges (60 foods × 2–3 edges avg) | 🟡 Week 4 target |
| **Allergen Definitions** | 10+ allergens (top 14 EU) | ✅ Complete (from NK1) |
| **Planner Opportunities** | 60/60 foods mapped | 🟡 Week 5 target |
| **Shopping Opportunities** | 60/60 foods mapped | 🟡 Week 5 target |

### What Defers to Packs 2–4

| Knowledge Area | Why Deferred | Target Phase |
|---|---|---|
| **Remaining 179 foods** | Fewer households use these foods regularly; sourcing effort higher per food | Pack 2 (Q1 2027) |
| **Nested allergen restrictions** | Top 14 EU allergens cover ~95% of Pack 1 households; expansions Phase 1 | Pack 1.5 (Q4 2026) |
| **Cooking method variants** | Boiled vs. fried nutrient profiles are edge-case; Phase 2 if demand signals | Pack 2 (Q1 2027) |
| **Household-specific diversity preferences** | Requires Plane 2 personalisation infrastructure (Phase 2) | Pack 2+ |
| **Bioavailability interactions** | Requires learning signals + household patterns (Phase 2–3) | Pack 2+ |
| **Medical diet patterns** | Regulatory boundary; requires clinician partnership (Phase 4+) | Deferred |
| **Prepared meals & branded products** | Community phase; scope deferred | Community Phase (2028) |

---

## SUCCESS CRITERIA FOR NK3–P1

### Content Completeness
- [ ] **60 core foods** selected and locked (no scope creep after week 1)
- [ ] **100% of Pack 1 foods** have nutrition context prose (3–4 sentences, sourced, voice-consistent)
- [ ] **100% of Pack 1 foods** have cooking/prep guidance (nutrient-impact evidence-backed)
- [ ] **100% of Pack 1 foods** have seasonality + affordability metadata (UK-specific)
- [ ] **100–150 food relationship edges** mapped and sourced (variants, pairings, families, seasonality)

### Sourcing & Trust
- [ ] **100% of health benefits** linked to foods have ≥1 valid SourceRef (BNF/EFSA/NHS/NIH-ODS)
- [ ] **100% of sourced claims** have `lastReviewed` timestamp (Nutritionist sign-off within 6 months)
- [ ] **Zero banned words** in public-facing copy ("prevents", "treats", "cures", "good/bad foods", "superfoods")
- [ ] **EFSA wording firewall** enforced (established benefits use allowed phrasing; emerging benefits tagged)
- [ ] **Source audit passed** (every benefit-food link traced to a trusted domain with citation link)

### Household Accessibility (NK2 Methodology)
- [ ] **Food-first phrasing** in all nutrition context prose (food → nutrients → benefits, never nutrients → food)
- [ ] **Affordable options listed first** (✅ Budget-friendly variants highlighted; premium options acknowledged)
- [ ] **Practical guidance included** (fresh/frozen/dried/canned framed as equals; quick-cook options visible)
- [ ] **Cultural diversity represented** (foods from cuisines common in UK households; no stereotyping)
- [ ] **No moralizing** of food ("good/bad" language absent; descriptive only)

### Knowledge Integrity
- [ ] **Pack 1 locked at 60 foods** (no mid-phase additions; scope creep deferred to Pack 2)
- [ ] **Dependencies verified** (all 60 foods have complete NK1 Plane 1 data before Pack 1 ships)
- [ ] **Benefit sourcing gated** (no benefits light up until final 5 confirmed; sourcing complete per NK1)
- [ ] **No shadow knowledge** (all Pack 1 facts live in NK1 tables; no duplicate owners)

### Engineering Integration
- [ ] **Evidence gate live** (isEvidenceBackedClaim() validator passes all sourced claims; rejects unsourced)
- [ ] **Food graph edges functional** (relationships wire into discovery/alternatives algorithms without breaking existing logic)
- [ ] **Seasonality/affordability queryable** (metadata stored in schema; planner/shopping can filter/sort by season/price)
- [ ] **Planner integration ready** (Pack 1 foods surface in meal recommendations; gap-filling logic uses Pack 1 context)

### Documentation
- [ ] **NK3 roadmap locked** (this document promoted to `docs/architecture/` and declared complete)
- [ ] **SoT Register updated** (Pack 1 ownership, coverage, enrichment path recorded)
- [ ] **Implementation records created** (one document per food category — legumes, grains, etc. — tracking sourcing, authoring, review)

---

## ANTI-PATTERNS TO AVOID

| Anti-pattern | Why it fails | Prevention |
|---|---|---|
| **Scope creep (more than 60 foods)** | Editorial effort explodes; sourcing discipline weakens; launch delays | Lock scope at 60 foods; defer to Pack 2 ruthlessly |
| **Uneven nutrition context** | Some foods feel complete, others bare; user experience inconsistent | Standardize structure (headline, nutrients, use case, selection); target 3–4 sentences per food |
| **Affordability omission** | Guidance assumes affluence; excludes budget-constrained households | Every food must have affordability tier (✅ Budget / ⭐ Premium / 📊 Varies); budget option listed first |
| **Unsourced cooking claims** | "Steaming preserves nutrients" stated without evidence | Cooking impact claims sourced from BNF/academic sources + Nutritionist sign-off |
| **Food relationships as inference** | "Beans pair with rice" assumed without sourcing | Relationships sourced from culinary tradition + nutritional synergy evidence + household frequency data |
| **Moralizing language** | "Clean eating", "superfoods", "avoid junk" creates shame | Every public phrase tested against NK2 banned-word list; editorial review for tone |
| **Missing seasonality for UK context** | Guidance assumes global sourcing; disconnects from UK household reality | gov.uk calendar + supermarket data layer; seasonality mandatory per food |
| **Variants treated as inferior** | "Fresh is best; frozen/tinned are acceptable" phrasing | Frozen/tinned positioned as equals to fresh (same nutrition, often cheaper, less food waste); sourced from NHS |
| **Benefits without sourcing** | 8 benefits light up on a food; only 2 have evidence | Rules: only sourced benefits ship; count per food visible in content; unsourced candidates deferred to Pack 2 |
| **Context limited to Tier A foods** | Benefits and context ship for Tier B; Tier A looks bare | Both tiers get equal context (different level: Tier A shows nutrients + context; Tier B adds benefits) |

---

## TIMELINE & RESOURCE ESTIMATE

### Total Effort: 8–10 Weeks (Starting After NK1 Promotion)

| Phase | Duration | Effort | Owners |
|---|---|---|---|
| Foundation (Benefit confirmation, scope lock, proto-data standardisation) | Weeks 1–2 | 20 hours | Editorial, Nutritionist |
| Research & Mapping (Seasonality, relationships, affordability, cooking) | Weeks 2–4 | 80 hours | Editorial, Research, Nutritionist |
| Authoring (14 new foods, variants, planner/shopping opportunities) | Weeks 3–5 | 50 hours | Editorial |
| Review & Gating (Nutritionist review, source gate, EFSA firewall, prose quality) | Weeks 5–6 | 30 hours | Nutritionist, Editorial |
| Engineering Integration (Seeding, validation, graph integration) | Weeks 6–8 | 60 hours | Engineering, Data |
| **Total** | **8 weeks** | **240 hours** | **Multi-disciplinary** |

### Resource Breakdown

- **Editorial:** 120 hours (50% authoring, 30% research, 20% coordination)
- **Nutritionist:** 60 hours (20% benefit sourcing, 30% review + gating, 10% teaching editorial on methodology)
- **Research/Data:** 30 hours (seasonality calendar, pricing, food relationships)
- **Engineering:** 60 hours (schema, seeding, validation, graph integration)

### Dependencies

1. ✅ **NK1 promotion complete** (governance in place)
2. ✅ **NK2 adoption by product/editorial teams** (methodology understood)
3. ⭐ **WS2 (Knowledge Layer V1) benefit confirmation** (final 5 benefits locked)
4. ⭐ **Editorial voice established** (prose standardisation possible)
5. ⭐ **Nutritionist availability** (part-time, 8 weeks)

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| **Scope creep (pressure to add more foods)** | Delays launch; sourcing quality drops | Lock 60-food scope before week 1; escalate any additions to Pack 2 queue |
| **Benefit confirmation delayed (WS2 not ready)** | Pack 1 ships without benefits (nutrients-only) | Design Pack 1 content to work beautifully with nutrients-only; add benefits as post-launch content drop |
| **Affordability data unavailable** | Cannot show cost-aware guidance | Fallback: tier foods as "common household choice" (no price data); full tiers post-launch |
| **Seasonality calendar missing** | Guidance disconnects from UK reality | Fallback: use generic "available year-round" or "seasonal" labels; detailed calendar post-launch |
| **Nutritionist bottleneck** | Review delays pack completion | Plan: bring Nutritionist in weeks 1–2 for teaching; allow Editorial to pre-screen; Nutritionist gates final sign-off |
| **Cooking impact sourcing difficult** | Guidance omitted or unsourced | Fallback: only include cooking impacts with clear sources (BNF has this); avoid subjective claims |
| **Engineering schema complexity** | Integration time overruns | Scope: use existing `food_knowledge` table for context + metadata; defer graph optimization to Phase 1 |

---

## PROMOTION & NEXT STEPS

### Immediate (This Month)

1. ✅ **Finalize scope:** Editorial team locks 60-food list; peer review (no scope creep after sign-off)
2. ✅ **Confirm benefits:** WS2 (Knowledge Layer V1) publishes final 5 benefits; sourcing begins
3. ✅ **Standardize proto-data:** Existing 46 foods edited for voice + structure consistency
4. ✅ **Timeline agreement:** Editorial, Nutritionist, Engineering commit to 8-week delivery schedule

### Week 1–2

5. **Organize content sprints:** Break 60 foods into 6 squads (10 foods each); assign Editorial leads
6. **Source authoritative data:** Pull USDA composition, gov.uk seasonality, supermarket pricing
7. **Create content template:** Standardized structure for nutrition context (headline, nutrients, use case, selection)

### Week 3–5

8. **Parallel work streams:** Authoring, research mapping, cooking guidance, affordability tiers all in progress
9. **Weekly sync:** Editorial + Nutritionist + Engineering align on progress, blockers, quality gates

### Week 5–6

10. **Review & gating:** Nutritionist review, source audit, EFSA firewall, prose quality
11. **Final corrections:** Address review feedback, re-source any gaps

### Week 6–8

12. **Engineering integration:** Seeding, validation, graph wiring, planner/shopping integration
13. **Final testing:** Evidence gate validator confirms 100% sourcing; no unsourced claims pass

### Post-Launch (Weeks 9+)

14. **Promotion:** NK3–P1 documented in `docs/architecture/NK3_CANONICAL_NUTRITION_KNOWLEDGE_PACK_1.md` and SoT Register
15. **Pack 2 planning:** Start research for remaining 179 foods (parallel workstream)
16. **Benefit expansion:** Post-launch content drop (benefits 6–8 if sourcing ready)

---

## ROLLBACK & SAFETY

**This is an investigation only. No code, schema, data, or runtime changes.**

- No database migrations needed for NK3 publication.
- No API changes.
- No implementation yet (content authoring is editorial work, starting Phase 0).
- SoT Register update (pointer-only) + implementation-record documents are tracked changes when Phase 0 begins.

**Safe to promote:** This roadmap is a planning document. Publishing it does not commit engineering resources; it clarifies scope and sequencing for editorial and Nutritionist input.

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **What is Pack 1?** | 60 curated UK household staple foods with complete, sourced nutrition knowledge: identity, composition, benefits, context, variants, seasonality, affordability, cooking, relationships. |
| **Who is Pack 1 for?** | Ordinary UK households (not benchmark questions, not aspirational cuisine, not rare/medical diets). |
| **Why these 60 foods?** | Household frequency (>50% of meal plans), nutritional power (3+ key nutrients), affordability, cultural representation, sourcing confidence. |
| **What knowledge does each food include?** | Identity (NK1), nutrients (NK1), benefits (sourced, 5 per benefit established), context prose (to author), variants, seasonality, affordability, cooking guidance, relationships, planner/shopping opportunities. |
| **What's the critical gap?** | Nutrition context prose (40–50 foods need authoring) and food relationships (100–150 edges to map and source). |
| **How is it sourced?** | USDA (composition), NHS/BNF/EFSA/NIH-ODS (benefits), gov.uk/supermarket data (seasonality/affordability), academic sources (cooking impacts), THA cohort (household frequency). |
| **How long does it take?** | 8 weeks, 240 hours, multi-disciplinary (Editorial 120h, Nutritionist 60h, Research 30h, Engineering 60h). |
| **What defers to Pack 2+?** | Medical diets, bioavailability, nested allergens, per-household diversity, prepared meals, branded products, remaining 179 foods. |

---

*Investigation completed: 2026-07-07*  
*Ready for Editorial/Nutritionist/Engineering alignment*  
*Next milestone: Scope lock (60 foods), benefit confirmation (WS2), timeline commitment*
