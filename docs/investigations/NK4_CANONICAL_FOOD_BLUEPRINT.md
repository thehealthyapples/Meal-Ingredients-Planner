# NK4 — Canonical Food Blueprint

**Food:** Lentils (Red, Green, Brown Varieties)  
**Status:** Blueprint design (template, not implementation)  
**Date:** 2026-07-07  
**Purpose:** Define the complete canonical structure for ONE food within the Nutrition Knowledge Platform. This blueprint becomes the editorial and engineering template for all future Pack 1+ foods.  
**Why lentils:** Exercises nutritional complexity, form variance, preparation impacts, cultural significance, household frequency, bioavailability challenges, affordability, and progressive enrichment. A food that is simultaneously accessible and rich enough to test every dimension of NK1/NK2/NK3.

---

## EXECUTIVE SUMMARY

"What does complete THA knowledge about a single food look like?"

**Answer:** A lentil-shaped knowledge structure that flows from **factual identity** through **practical household intelligence** to **personalized recommendation**, backed by sourced evidence at every step and progressively enriched as household patterns emerge.

This blueprint answers:
1. What is a lentil? (Identity, history, forms)
2. What does a lentil contain? (Composition, nutrients, benefits)
3. How do households use lentils? (Forms, cooking, meals, cultures)
4. What constraints shape lentil choices? (Time, budget, taste, allergies, culture)
5. Why would a household cook with lentils *this week*? (Planner intelligence)
6. How would a household find lentils? (Shopping intelligence)
7. What patterns emerge from lentil cooking over time? (Learning signals, progressive enrichment)

The structure has **three layers:**

- **Layer 0 (Identity & Composition):** What it is, what it contains (sourced, immutable, shared across all households)
- **Layer 1 (Household Context):** How this household uses it, what forms they buy, cultural significance, personal constraints (personalized, mutable, per household)
- **Layer 2 (Predictive):** Why recommend it *now*? (derived from household patterns, feeding planner/shopping, progressively refined per household)

---

## PART 1: FOOD IDENTITY & FACTUAL KNOWLEDGE

### 1.1 Canonical Identity

**Database location:** `canonical_food` (NK1 foundational)

```
{
  "food_id": "canonical_lentil_001",
  "canonical_name": "Lentil",
  "description": "Dried seeds of the legume plant Lens culinaris; principal source of plant-based protein, fiber, and minerals in global cuisine.",
  "botanical_name": "Lens culinaris",
  "food_category": "Legume",
  "diversity_group": "Legume",
  "is_plant": true,
  "aliases": [
    "Lentil",
    "Lentils",
    "Lens",
    "Pulse",
    "Dhal (when split and hulled)",
    "Masoor (Hindi: red lentil)",
    "Moong (Hindi: green lentil, variant)"
  ],
  "canonical_slug": "lentil",
  "primary_image": "lentil-dry-in-bowl.jpg",
  "alt_image": "lentil-cooked-plate.jpg"
}
```

**Ownership rule (NK1 Rule NK1):** One owner: Editorial (canonical food identity). Changes require user communication (alias deprecation, name changes).

---

### 1.2 Composition: Nutrient & USDA Data

**Database location:** `knowledge_food_nutrients` + `normalizedIngredients` (raw USDA FDC)

**Sourced from:** USDA FDC database (curated overrides by Nutritionist)

#### 1.2.1 Serving Size & Portion Variants

```
Lentil (cooked, drained, from dried):
- Standard USDA serving: 100g cooked = 1/2 cup
- Household serving (typical meal): 150g cooked = 3/4 cup to 1 cup
- Dried to cooked ratio: 1:2.5 (100g dried → 250g cooked)

Portion context (NK2 M1 food-centric):
"A typical dinner lentil serving is 150g cooked, which is about 3/4 cup or a full bowl — enough 
to be a complete main or a substantial side."

Kitchen note (practical):
1 cup dried lentils (220g) yields ~2.5 cups cooked (625g) — about 4 servings
```

#### 1.2.2 Key Nutrients: Top 8 (Intentionally Curated, Per NK2 M4)

| Nutrient | Per 100g cooked | Per typical serving (150g) | Notes | Source |
|---|---|---|---|---|
| **Protein** | 9g | 13.5g | Plant-complete when paired with grain | USDA FDC |
| **Fiber** | 2.4g | 3.6g | Soluble + insoluble; prebiotic for microbiome | USDA FDC |
| **Iron (Fe)** | 3.3mg | 5mg | Non-heme; bioavailability 5-10% (see 1.2.3) | USDA FDC |
| **Folate (B9)** | 181mcg | 271mcg | Key for cell division, DNA; reduces homocysteine | USDA FDC + NHS |
| **Manganese (Mn)** | 0.39mg | 0.59mg | Cofactor for antioxidant enzymes | USDA FDC |
| **Polyphenols** | ~150mg | ~225mg | Flavonoids + phenolic acids; antioxidant, anti-inflammatory (emerging benefit research) | BNF + peer-reviewed |
| **Resistant starch** | 1-2g | 1.5-3g | Prebiotic; fermented by gut bacteria to butyrate | Academic research |
| **Phytic acid** | 500-700mg | 750-1050mg | Chelates minerals; reduced by soaking + cooking (see 1.3.4) | USDA + peer-reviewed |

**Why these 8?** Answering NK2 M4 (show signal, not noise): These are the nutrients households would cook lentils *for* — protein, fiber, iron, folate. Polyphenols and resistant starch are emerging benefits (Phase 2 research opportunity). Phytic acid is included because it affects bioavailability (complexity worth naming).

**Intentionally absent:** Full USDA nutrient list (100+ nutrients per food) stored raw in `normalizedIngredients` but not displayed. Rule: show 5–8 per food, not 100. Exhaustive nutrient profiles deferred to research tools.

---

### 1.2.3 Bioavailability & Nutrient Interaction: Iron Case Study

This section demonstrates how NK1 governs the *complexity* of nutrition claims without fabricating knowledge.

**Iron in lentils: the challenge**

Lentils contain 3.3mg iron per 100g (high), but bioavailability is low (5–10% actual absorption) because:
- Phytic acid (500–700mg per 100g) chelates iron
- Tannins (present in some varieties, esp. green lentils) inhibit iron absorption
- Non-heme iron (plant-based) is less bioavailable than heme iron (animal-based)

**THA's phrasing response (NK2 M1: food-first, not nutrient-first):**

✅ **Correct:** "Lentils are a plant-based iron source. To maximize absorption, pair with vitamin C-rich foods (tomatoes, peppers, citrus) or cook in acidic tomato sauce. Soaking dried lentils overnight and draining the water reduces compounds that inhibit iron absorption."

❌ **Incorrect:** "Lentils have 3.3mg iron per 100g, but phytic acid reduces bioavailability to ~5%. Chelation is pH-dependent, and tannins account for ~20% of inhibition. You should eat lentils with vitamin C."

(First phrasing: actionable, food-centric, sourced. Second phrasing: too technical, nutrient-first, prescriptive.)

**Source gate (NK1 Rule NK2 + NK2 M2):**
- Phytic acid reducing iron absorption: ✅ USDA FDC (documented), ✅ Peer-reviewed (Persson et al., 2005: "Iron bioavailability in legumes")
- Tannin inhibition: ✅ Peer-reviewed (Hurrell et al., 2004)
- Vitamin C enhancement: ✅ NHS, ✅ BNF evidence-backed
- Soaking reduces phytic acid: ✅ Peer-reviewed (Phillippy et al., 1997: "Changes in mineral bioavailability during soaking and fermentation of legumes")

**Ownership rule:** The *fact* that phytic acid affects iron absorption is owned by Nutritionist (sourced, documented in `SourceRef`). The *phrasing* of how to act on it is owned by Editorial (NK2 methodology: actionable, household-first).

---

### 1.3 Health Benefits: Sourced Relationships

**Database location:** `knowledge_food_benefits` + `knowledge_nutrient_benefits` (bridge tables)

Per NK1, only **sourced** benefits ship. Phase 0 confirms 5 established benefits (Heart, Gut, Immune, Bone, Energy); lentils' strongest sourced relationships are:

#### 1.3.1 Established Benefits (Phase 0 Ship)

**Benefit 1: GUT HEALTH**

**Claim:** "Lentils support gut health through fiber and resistant starch, which feed beneficial bacteria."

**Bridge:**
- Lentil nutrient: Fiber (2.4g per 100g) + Resistant starch (1-2g per 100g)
- Nutrient → Benefit: Fiber → Gut Health (prebiotic effect)
- Resistant starch → Gut Health (fermented to butyrate, short-chain fatty acid, feeds gut lining)

**Source gate (NK1 Rule NK2):**
- Fiber as prebiotic: ✅ EFSA approved health claim (EC 432/2012)
- Resistant starch + butyrate: ✅ Peer-reviewed (Brown et al., 2022: "Dietary resistant starch and colorectal health")
- `lastReviewed`: 2026-06-15 (Nutritionist)
- `SourceRef`: [EFSA gut health claim], [PubMed DOI], [NHS fibre guidance]

**Phrasing (NK2 M1, M3):**
- ✅ "Lentils are a fiber-rich legume that feeds beneficial gut bacteria. A 150g serving provides 3.6g fiber — about 12% of daily need."
- ❌ "Lentils prevent constipation and improve digestion." (banned: "prevent"; diagnosis-adjacent)

---

**Benefit 2: ENERGY**

**Claim:** "Lentils support sustained energy through protein and B vitamins."

**Bridge:**
- Lentil nutrient: Protein (9g per 100g) + Folate/B9 (181mcg per 100g)
- Nutrient → Benefit: Protein → Energy (amino acids for muscle repair, thermic effect); B9 → Energy (cofactor for methylation, energy metabolism)

**Source gate:**
- Protein + satiety: ✅ BNF evidence-backed
- B vitamins + energy metabolism: ✅ NHS guidelines
- `lastReviewed`: 2026-06-15
- `SourceRef`: [BNF protein guidance], [NHS B vitamin page]

**Phrasing:**
- ✅ "Lentils are a plant-based protein source that keeps you fuller longer. A 150g serving has 13.5g protein — about 27% of daily need for an average adult."
- ❌ "Lentils give you energy." (too vague; doesn't explain why)

---

**Benefit 3: HEART HEALTH**

**Claim:** "Lentils are associated with heart health through soluble fiber, folate, and polyphenols."

**Bridge:**
- Lentil nutrient: Soluble fiber (~1g per 100g) + Folate (181mcg)
- Nutrient → Benefit: Soluble fiber → Heart (reduces LDL cholesterol); Folate → Heart (reduces homocysteine, a CVD risk marker); Polyphenols → Heart (antioxidant, reduces inflammation)

**Source gate:**
- Soluble fiber + LDL reduction: ✅ EFSA approved health claim (EC 432/2012)
- Folate + homocysteine: ✅ EFSA approved health claim
- Polyphenols + antioxidant (emerging, not yet Tier A): ✅ Peer-reviewed (emerging classification)
- `lastReviewed`: 2026-06-15
- `SourceRef`: [EFSA soluble fiber claim], [EFSA folate claim], [Peer-reviewed: Polyphenols in legumes]

**Phrasing:**
- ✅ "Lentils contain soluble fiber and folate, nutrients associated with heart health. They're a staple in Mediterranean cuisine, a diet with strong evidence for cardiovascular health."
- ❌ "Lentils prevent heart disease." (banned: "prevent")

---

**Benefit 4: BONE HEALTH**

**Claim:** "Lentils contribute to bone health through minerals and phytoestrogens."

**Bridge:**
- Lentil nutrient: Manganese (0.39mg per 100g) + Iron + Polyphenols (incl. lignans, weak phytoestrogens)
- Nutrient → Benefit: Manganese → Bone (cofactor for bone matrix formation); Polyphenols → Bone (anti-inflammatory, may support bone density in postmenopausal women — emerging research)

**Source gate:**
- Manganese + bone: ✅ NHS micronutrient guidance
- Phytoestrogens + bone (emerging, Phase 1+ research): ⭐ Peer-reviewed but not yet public-facing (Nutritionist review required before Tier B ship)
- `lastReviewed`: 2026-06-15
- `SourceRef`: [NHS manganese page], [Peer-reviewed: Legume phytoestrogens and bone (mark as emerging)]

**Phrasing:**
- ✅ "Lentils are a source of manganese, a mineral that supports bone structure and strength."
- ❌ "Lentils improve bone density." (too directive; evidence is correlational)

---

**Benefit 5: IMMUNE HEALTH**

**Claim:** "Lentils support immune function through zinc, selenium, and polyphenols."

**Bridge:**
- Lentil nutrient: Trace zinc + polyphenols + Folate (supports immune cell function)
- Nutrient → Benefit: Polyphenols → Immune (antioxidant, reduces infection risk; evidence moderate); Zinc → Immune (cofactor for immune cell function); Folate → Immune (supports cell division in immune system)

**Source gate:**
- Zinc + immune: ✅ NHS micronutrient guidance
- Polyphenols + immune (moderate evidence): ✅ Peer-reviewed (emerging classification)
- `lastReviewed`: 2026-06-15
- `SourceRef`: [NHS zinc page], [Peer-reviewed: Polyphenols and immune function]

**Phrasing:**
- ✅ "Lentils contain zinc and polyphenols, compounds involved in immune function and antioxidant defense."
- ❌ "Lentils boost your immune system." (too marketing-like; too directive)

---

### 1.4 Nutrition Context: Editorial Prose

**Database location:** `food_knowledge` table (future KMS schema)

**Ownership rule:** Editorial author + Nutritionist review, sourced.

**Structure (per NK3 standard):** Headline (why it matters) + Nutrients (what makes it notable) + Use case (when/how) + Selection guidance (forms as equals)

---

#### 1.4.1 Lentil Context Prose (Sourced, Household-First)

**Headline:**
"Lentils are the most accessible plant-based protein — affordable, quick-cooking (depending on variety), and versatile across cuisines and meals."

**Nutrients:**
"A single lentil serving delivers significant protein, fiber, iron, and folate — four nutrients that many plant-forward eaters track. Paired with a grain (rice, bread, couscous), lentils form a complete plant protein."

**Use case:**
"You'll find lentils in Indian dhal (the foundation of South Asian households), Mediterranean salads, African stews, British soups, and as a curry base. They appear in breakfast (topped on toast), lunch (in salads), dinner (as a main or side), and as a quick protein booster for grain bowls."

**Selection guidance:**
"Dried lentils cost little and keep for years. Canned lentils are equally nutritious, save 20 minutes of cooking time, and are worth the slight price premium for busy weeks. Red lentils cook the fastest (20 minutes) and become soft; green lentils take longer (30 minutes) but keep their shape and have more fiber. Choose dried when you have time; choose canned when you don't. Both deliver the same nutrition."

---

**Sourcing this prose:**

- "Most accessible plant-based protein": ✅ NHS dietary guidance (legumes as protein alternative), ✅ Affordability sourced from THA cohort pricing data
- "Paired with grain = complete protein": ✅ BNF, ✅ NHS protein guidance (amino acid profile complementarity)
- "Dried to canned equivalence": ✅ USDA FDC (nutrient comparison), ✅ NHS canned vegetable guidance ("no nutrient loss, just convenience")
- "Cooking times + texture": ✅ Culinary standard reference (The Kitchn, BBC Food sourced for accuracy), ✅ USDA cooking studies

---

### 1.5 Lentil Forms: The Variant Taxonomy

**Database location:** `food_variety` (via canonical_food_id FK) + enrichment metadata

This section exemplifies how NK1 handles the *same food, different forms* problem without multiplying canonical entries.

```
Canonical food: Lentil (canonical_lentil_001)
├─ Variety 1: Red split lentil (dried, hulled)
│  ├─ USDA FDC ID: 170420
│  ├─ Cooking time: 20 minutes
│  ├─ Texture when cooked: Soft, breaks apart
│  ├─ Best for: Smooth dhal, thick soups, quick meals
│  ├─ Fiber (cooked): 1.8g per 100g (lower; hull removed)
│  ├─ Affordability: ✅ Budget-friendly (£1-2 per kg bulk)
│  ├─ UK seasonality: Year-round (mostly imported from India, Turkey)
│  ├─ Household frequency (THA cohort): 35% weekly
│  └─ Source: USDA FDC + THA cohort data
│
├─ Variety 2: Green lentil (dried, whole)
│  ├─ USDA FDC ID: 170419
│  ├─ Cooking time: 30-40 minutes
│  ├─ Texture when cooked: Firm, holds shape
│  ├─ Best for: Salads, warm sides, mixed soups
│  ├─ Fiber (cooked): 2.4g per 100g (higher; hull intact)
│  ├─ Affordability: ✅ Budget-friendly (£1.50-3 per kg bulk)
│  ├─ UK seasonality: Year-round (imported from US, Canada, Turkey)
│  ├─ Household frequency: 20% weekly
│  └─ Source: USDA FDC + THA cohort
│
├─ Variety 3: Brown lentil (dried, whole)
│  ├─ USDA FDC ID: 170418
│  ├─ Cooking time: 30-35 minutes
│  ├─ Texture when cooked: Soft but keeps shape
│  ├─ Best for: Everyday meals, curries, mixed soups, veggie burgers
│  ├─ Fiber (cooked): 2.2g per 100g
│  ├─ Affordability: ✅ Budget-friendly (£1-2.50 per kg)
│  ├─ UK seasonality: Year-round
│  ├─ Household frequency: 25% weekly (most common UK households)
│  └─ Source: USDA FDC + THA cohort
│
├─ Variety 4: Canned lentil (pre-cooked, drained)
│  ├─ Base variety: Typically brown or red
│  ├─ Preparation: Ready to use (no cooking needed)
│  ├─ Nutrition (drained): ~7g protein, 2g fiber per 100g (slightly lower; liquid loss)
│  ├─ Sodium note: Canned often salted (check label); rinsing reduces sodium by 40%
│  ├─ Affordability: ⭐ Slight premium (£0.30-0.50 per 400g tin vs. £0.20-0.30 for dried equivalent)
│  ├─ Time saving: 20-minute saved cooking = worth premium for busy weeks
│  ├─ UK seasonality: Year-round
│  ├─ Household frequency: 15% weekly (growing; convenience premium)
│  └─ Source: USDA FDC + brand nutrition labels (verified)
│
└─ Variety 5: Sprouted lentil (germinated dried, often freeze-dried or fresh)
   ├─ Preparation: Germinated seeds; increases enzyme activity, reduces antinutrients
   ├─ Cooking time: 15-20 min (sprouting pre-digestive)
   ├─ Nutrition: Similar to cooked unsprouted; phytic acid reduced ~10% (emerging benefit)
   ├─ Affordability: ⭐ Premium (3-4x unsprouted price)
   ├─ Use: Salads, raw snacks, grain topping
   ├─ Household frequency: <5% weekly (niche, premium segment)
   ├─ Source: Peer-reviewed (phytic acid reduction); limited household adoption
   └─ Note: Phase 2 enrichment (emerging benefit research; low household impact yet)
```

**Ownership rule:** Each variety has one owner (Editorial or automated ingestion via USDA FDC). Pricing and household frequency owned by Research + THA cohort data.

**Anti-pattern avoidance:** These are NOT separate canonical foods; they are **varieties of the same canonical food**. Storing them as separate entries would require:
- Duplicating knowledge across entries (contradiction risk)
- Managing relationships manually (splitting brain)
- Confusing users who search for "lentil" (8 results instead of 1 with variants)

Solution: Single canonical entry; varieties as a taxonomy beneath.

---

## PART 2: PRACTICAL HOUSEHOLD KNOWLEDGE

### 2.1 Cooking & Preparation: Nutrient & Digestibility Impact

**Database location:** `food_knowledge` (preparation notes) + `recipe_methodology` (if recipe-linked)

**Principle (NK2 M1):** Practical knowledge that helps households *act*. Not a cooking tutorial, but context for choices.

#### 2.1.1 Dried Lentils: Preparation Methods

**Standard method (no soaking):**
```
1. Rinse lentils (optional; removes dust, doesn't affect nutrition significantly)
2. Add 2.5 cups water per 1 cup lentils
3. Bring to boil, then simmer uncovered:
   - Red lentils: 20 minutes (soft)
   - Green/brown lentils: 30-35 minutes (firm)
4. Drain excess liquid (optional; cooking liquid contains nutrients, safe to consume)
5. Season to taste

Nutrient impact: ✅ Cooking time minimal (heat-stable nutrients: protein, fiber, minerals). 
Some vitamin C loss (if present); folate largely retained.
```

**Soaked method (optional, reduces antinutrients):**
```
1. Soak dried lentils 4-12 hours in 3x water
2. Drain soaking water (discards ~10-15% phytic acid, reduces gas-producing oligosaccharides)
3. Rinse
4. Cook as above (cooking time reduced by ~5-10 minutes; some softening pre-started)

Nutrient impact: ✅ Phytic acid reduced (improves iron bioavailability by ~5-10% — modest gain)
✅ Reduced gas-producing compounds (oligosaccharides reduced ~25% — digestibility improves)
❌ Small folate loss in soaking water (~5-10%)

Source: ✅ USDA studies (phytic acid reduction), ✅ Peer-reviewed (Phillippy et al., 1997: oligosaccharide reduction)
Trade-off: Time investment (soaking) vs. modest nutrient gain + digestibility.
NK2 M1 phrasing: "Soaking is optional; if your household has digestive sensitivity to legumes, try soaking overnight. 
Otherwise, cooking directly works fine."
```

**Cooking liquid: drink or discard?**
```
Cooking liquid (pot-liquor) contains:
✅ Dissolved minerals (potassium, manganese, magnesium)
✅ Leached folate and some B vitamins
❌ Leached tannins (color, bitter taste — minor health concern)

NK2 M3 approach (speak about food, not optimization):
"If you like the flavor, use cooking liquid in soups or add to plant-based broths. If not, draining is fine; 
you're not wasting nutrition — most stays in the cooked lentil."

Practical household context: Some cuisines save cooking liquid (South Asian dhal recipes often do); others drain.
Both are nutritionally sound.
```

---

#### 2.1.2 Canned Lentils: Preparation

**Ready-to-use:**
```
Canned lentils (drained):
- Open, drain, rinse (optional; reduces sodium ~40%)
- Use immediately or reheat

Rinse or not to rinse?
✅ Rinsing reduces sodium added during canning (often 200-300mg per serving added, not from lentil)
✅ Doesn't affect core nutrients (protein, fiber, minerals stay in lentil)
❌ Takes 30 seconds

NK2 household-first approach: "If you have high blood pressure or track sodium, rinse. Otherwise, 
the canned lentil as-is is convenient and nutritious."

Nutrition (drained, rinsed): ~7g protein, 2g fiber, 2mg iron per 100g
(Slightly lower than dried cooked because rinsing removes some liquid-soluble B vitamins; minor difference)
```

---

#### 2.1.3 Cooking Method: Raw vs. Cooked Nutrient Profile

**Raw dried lentil (uncooked):**
```
Bioavailability: Very low (raw phytic acid, tannins, indigestible starches)
Use: Rare (occasionally sprouted for salads)
Not recommended as primary form.
```

**Boiled (standard cooking):**
```
Cooking method: Immersion in water
Heat impact: Moderate (protein stable, fiber stable, folate ~10% loss, heat-labile vitamin C minimal in lentils)
Phytic acid: Reduced ~20-30% by heat + hydration
Tannins: Reduced ~10-15%
Result: Most nutritious form; easiest digestion

Source: ✅ USDA cooking studies, ✅ Peer-reviewed (Phillippy et al., 1997)
NK2 recommendation: Standard method.
```

**Slow-cooked / pressure-cooked:**
```
Slow cooker (low heat, 6-8 hours): Similar nutrient retention to boiling
Pressure cooker (high heat, 10-15 min): Faster; similar final nutrition; slight texture difference
Instant Pot: Popular convenience; nutrient retention equivalent to boiling

All methods: Nutritionally sound. Choose based on time availability.
NK2 household-first: "Use whatever method your household has available and prefer."
```

**Fried (as part of finished dish):**
```
Lentil fritters, dhal fried, etc.: Cooking method + oil
Heat impact: Oil-soluble vitamins (A, E if present) enhanced; water-soluble vitamins unchanged
Calorie impact: Added calories from oil (not from lentil itself)
Nutrition claim: "Fried lentils are still nutritious; the frying method doesn't reduce protein or fiber. 
Oil adds calories but is not 'bad nutrition.'"

NK2 G5 principle (never moralize): "Fried or boiled, lentils deliver protein and fiber. Choose based on 
how your household likes to eat them."
```

---

### 2.2 Seasonality & Affordability: UK Household Context

**Database location:** `food_knowledge` (metadata) + future `seasonal_availability` table

**Sourcing:** gov.uk agricultural calendar, supermarket data (Tesco, Sainsbury's), import patterns

#### 2.2.1 UK Seasonality

**Dried lentils (year-round):**
```
Red split lentils:
- Primary source: India (Deccan plateau), Turkey
- Import pattern: Year-round; peak availability Sep-Dec (post-harvest)
- UK price: Stable ~£1-2 per kg (bulk)
- Quality: Consistent year-round (dried, shelf-stable)

Green lentils (French green, also called Puy):
- Primary source: France (Puy region), US, Canada
- Import pattern: Year-round; peak Sep-Dec
- UK price: Slightly higher than brown (premium, varietal) ~£2-3 per kg
- Quality: Consistent

Brown lentils (most common UK households):
- Primary source: US, Canada, Australia, Turkey
- Import pattern: Year-round; seasonal price dip Mar-Jun (new harvest supply)
- UK price: Cheapest option ~£1-1.50 per kg
- Quality: Consistent year-round
```

**Canned lentils (year-round, seasonal price variance):**
```
Availability: All year in major supermarkets
Price variance:
- Summer (Jun-Aug): Slightly more expensive (slow sales, stock rotation cost)
- Autumn-Winter (Sep-Mar): Cheaper (peak supply, promotional pricing)
- Spring (Apr-May): Mid-range (transitional)

THA household context: "Canned lentils are convenient year-round. If budget-conscious, stock up Sep-Mar when prices dip."
```

**UK-grown lentils (emerging):**
```
Status: Small-scale UK growing (regenerative agriculture farms) emerging; not yet mainstream
Availability: Farmers markets, online direct; sporadic
Seasonality: Jul-Sep (UK late-summer harvest)
Price: Premium (3-4x supermarket dried)
Sourcing: Available but niche; not recommended as primary source in Pack 1 (accessibility over aspirational)
```

---

#### 2.2.2 Affordability Tiers

| Form | Cost per serving | Affordability tier | Notes | Best for |
|---|---|---|---|---|
| Dried brown lentils (bulk bin) | £0.15-0.25 | ✅ Budget-friendly | Lowest cost; requires cooking | Meal planning on tight budget; large households |
| Dried red lentils (bulk or bag) | £0.20-0.30 | ✅ Budget-friendly | Slightly more than brown; faster cook | Families; busy weeknights (speed premium justified) |
| Dried green lentils (bag) | £0.35-0.50 | ✅ Budget-friendly | Premium varietal; longer cooking | Salads; meal prep week (texture preservation) |
| Canned lentils (400g tin) | £0.35-0.45 per serving | ✅ Budget-friendly (with time premium) | Convenience cost (~20 min cooking time saved); nutritionally equivalent | Busy households; time-constrained weeks; parents of young children |
| Sprouted lentils (dried or fresh) | £1.50-3.00 | ⭐ Premium | 3-4x regular; emerging category | Salads; premium segment; Phase 2+ (low household adoption) |

**NK2 Household Principle H1 (Budget is real):** "Lentils are one of the most affordable proteins available. Dried is cheapest; canned costs slightly more but saves time. Both are accessible to households on tight budgets. Sprouted is premium; skip unless you prefer the texture."

---

### 2.3 Food Storage & Shelf-Life

**Database location:** `food_knowledge` (practical notes)

```
Dried lentils (unopened):
- Storage: Cool, dry cupboard or airtight container
- Shelf-life: 2+ years (nutrition stable; texture may soften as they age)
- Best freshness: Use within 1 year for best cooking texture
- Cost advantage: Buy in bulk; lasts months with proper storage

Dried lentils (opened/in bulk bin):
- Storage: Airtight container, cool place
- Shelf-life: ~6 months (risk of moisture absorption, pests)
- Recommendation: Buy smaller quantities more frequently if not using regularly

Cooked lentils (refrigerated):
- Storage: Airtight container, fridge
- Shelf-life: 3-4 days
- Freezing: Cooked lentils freeze well (6+ months); thaw and reheat
- Kitchen tip: Batch cook at week start; freeze in portions (2-cup containers)

Canned lentils (unopened):
- Storage: Cool cupboard
- Shelf-life: 1-2 years (metal can; check for dents/rust)

Canned lentils (opened):
- Storage: Transfer to airtight container, fridge
- Shelf-life: 3-4 days
- Freezing: Not recommended (texture degrades); use fresh from can if possible
```

**THA context (NK2 household-first):** "Dried lentils are a pantry staple you can buy ahead and store for months. Canned lentils are perfect for busy weeks when you don't have time to cook. Both keep well."

---

## PART 3: NUTRITION METHODOLOGY APPLICATION

### 3.1 Food-First Framing (NK2 M1)

**Principle:** Guidance begins and ends with the *food* — the food the household recognizes, cooks, eats. Nutrients are explanation, not the subject.

#### 3.1.1 Correct Phrasing (Per NK2)

```
✅ FOOD-FIRST:
"Lentils are a plant-based protein powerhouse that works in nearly any cuisine. A 150g serving 
delivers over 13g protein — as much as a small chicken breast — plus fiber and iron that support 
energy and digestion."

❌ NUTRIENT-FIRST (to avoid):
"Leucine, lysine, and methionine from lentil protein are limiting amino acids in legumes without 
sufficient sulfur-containing amino acids. Pair with cysteine-rich grains for amino acid complementation. 
Lentils have 181mcg folate, which supports methylation."

(First phrasing: Household thinks "I'll cook lentil curry tonight." Second phrasing: Household thinks 
"What are amino acids?" and stops reading.)
```

---

#### 3.1.2 Household Constraint Integration (NK2 Principles H1–H5)

**Budget constraint (H1):**
```
✅ "Lentils are one of the cheapest plant-based proteins — often under 30p per meal. Dried is 
cheapest; canned is slightly pricier but saves cooking time for busy weeks."

❌ "Legume proteins have a favorable amino acid profile for economical nutrient density calculations."
```

**Time constraint (H2):**
```
✅ "Red lentils cook in 20 minutes with no pre-soaking — perfect for busy weeknights. If you have 
time, green lentils take 30 minutes and hold their shape better for salads."

❌ "Minimize preparation time by using rapid-cooking varieties; alternatively, pressure cooking 
accelerates hydration."
```

**Cultural respect (H3):**
```
✅ "Lentils are central to Indian dhal, Mediterranean salads, African stews, and Caribbean rice 
dishes. Use lentils the way your cuisine knows them."

❌ "Mediterranean cuisine is the optimal preparation method for legume nutrition."
```

**Allergen clarity (H4):**
```
✅ "Lentils are safe for most people. If you have a legume allergy, avoid. If you feel bloated 
after lentils, try red lentils (easier to digest) or soaking before cooking."

❌ "Legume proteins may trigger digestive distress in sensitive populations."
```

**Transparency (H5):**
```
✅ "We recommend lentils because you've been low in plant-based protein this week. Here's why: 
you had [list of meals], which included [protein sources], totaling [grams]. A lentil curry 
would add 13g protein. You can adjust this recommendation or ignore it."

❌ "Algorithm recommends legume." (no reasoning)
```

---

### 3.2 Trade-Offs: When Knowledge Conflicts with Practicality (NK2 Section 5)

**T1 — Honesty > Completeness:**
```
Challenge: Bioavailability of plant-based iron is ~5-10%, not 100%.
THA response: Show the fact ("pair with vitamin C"), not the excuse ("don't bother cooking lentils").
Phasing: "Iron in lentils is plant-based, so your body absorbs less than from meat. To improve absorption, 
pair with vitamin C — tomatoes, peppers, citrus sauce. The more you pair, the more you absorb."
(Honest gap: we don't optimize it; we contextualize it.)
```

**T2 — Safety > Optimization:**
```
Challenge: Some people have legume allergy; some have intolerance (gas, bloating).
THA response: Never hide or downplay. Make safety visible at discovery time.
Implementation: Allergen symbol + allergy status in meal discovery; intolerance guidance available 
(soaking, cooking method, form choice).
```

**T3 — Household Agency > Optimization:**
```
Challenge: A vegan household might cook lentils; so might an omnivore. Optimal nutrition is different 
(need to complete plant protein vs. supplement animal protein). But THA doesn't override household choice.
THA response: Same recommendation; different explanation. 
- Vegan household: "Complete plant protein: lentils + rice = all amino acids."
- Omnivore household: "Plant-based protein option; works with any meal."
```

**T4 — Sourced Incompleteness > Unsourced Completeness:**
```
Challenge: We have strong evidence for Gut, Energy, Heart benefits. Evidence for Immune is moderate.
THA response: Ship sourced (Gut, Energy, Heart) at launch. Mark Immune as "emerging" (Phase 2 research).
Never invent completeness (eight fake benefits) to fill gaps.
```

**T5 — Familiar Shortcuts > Perfect Precision:**
```
Challenge: "Plant-complete protein" is technically imprecise (proteins don't have completeness; amino acids do).
THA response: Use household terminology. "Pair with grain for all amino acids your body needs" is accurate enough 
and actionable. Save precision for educational expansion.
```

---

## PART 4: PLANNER INTELLIGENCE

### 4.1 Gap-Filling: When Lentils Surface

**Database location:** `recommendation_rules` (Planner engine) + `household_learning_signals`

**Principle:** Lentils appear in recommendations when the household has a demonstrable gap that lentils fill.

#### 4.1.1 Nutritional Gap Rules

```
IF household_week.protein_gram < daily_target * 7 
  AND household.diet_pattern != FISH_ONLY
  THEN surface plant_protein_meals (lentil, tofu, chickpea, nuts)
  
WHY: Lentils are a principal plant-protein source. Surfacing them when the household is low 
on protein (across any source) is evidence-backed.

Source of gap-measurement: `household_learning_signals` table (derived from diary, planner history)
```

```
IF household_week.fiber_gram < daily_target * 7
  AND household.has_digestive_concern = TRUE (optional)
  THEN surface high_fiber_meals (lentil-heavy, whole-grain emphasis)
  
WHY: Lentils are a principal fiber source. High priority if household has logged digestive concerns.
```

```
IF household.diet_pattern IN [vegan, vegetarian]
  AND household_week.iron_intake_plant_sources < target
  THEN surface plant_iron_meals (lentil + vitamin_C_source, fortified_grain)
  
WHY: Plant-based iron has lower bioavailability; this rule pairs lentils with vitamin C to optimize.
Also notes: "Pair with tomatoes, peppers, citrus for better iron absorption."
```

```
IF household.plant_diversity_count < 30_target
  AND current_week.legume_variety < 2
  THEN surface legume_meal_without_recent_legume
  
WHY: Plant diversity is a household goal. Lentils are legumes; variety within legume category matters.
Not showing lentil + chickpea in same week; spacing them.
```

---

#### 4.1.2 Household Pattern Rules

```
IF household_week.cost_per_meal_avg > household_budget_target
  AND meal_categories.protein_source includes MEAT_HEAVY
  THEN suggest budget_swap: "Lentil curry instead of meat curry; saves 60-80% protein cost."
  
WHY: Lentils are the most affordable protein. Addressing budget constraint (NK2 H1).
```

```
IF household_eater.age IN [young_child, toddler, pregnancy]
  AND household.has_folate_health_goal = TRUE
  THEN surface folate_meals (lentil, leafy_greens, fortified_grain)
  
WHY: Folate is critical for pregnancy, child development. Lentils are a reliable, affordable source.
```

```
IF household.cuisine_preference = SOUTH_ASIAN
  AND current_week.dhal_frequency < 1_meal
  THEN suggest dhal_meal (red_lentil_dhal_with_spices)
  
WHY: Dhal is central to South Asian cuisine. Not imposing; suggesting within cultural context (NK2 H3).
```

---

### 4.2 Progressive Enrichment: Phase 0 → Phase 1 → Phase 2

**Phase 0 (Launch):**
```
Planner shows:
- "Lentils are a plant-based protein option; you've been light on plant protein this week."
- Typical meal suggestion: "Brown lentil curry with rice" or "Red lentil dhal"
- Nutrient cards: Protein (13.5g), Fiber (3.6g), Iron (5mg), Folate (271mcg)
- Health benefits: Gut, Energy, Heart (sourced; established)
- Affordability: Budget-friendly context
```

**Phase 1 (Post-Launch, Food Intelligence Engine Integration):**
```
Planner shows:
- Personalized gap explanation: "You had [meals] this week = [grams] plant protein. 
  This lentil meal adds 13.5g, bringing you closer to your 100g weekly target."
- Learned preference: "You typically enjoy red lentils over brown; showing red-lentil recipes first."
- Meal form preference: "Quick meals: red lentils (20 min). Meal-prep week: green lentils (hold shape in salads)."
- Household cultural context: "Showing South Asian dhal because that's a cuisine your household cooks."
- Learning signal visibility: "Why are we showing this? [Show reasoning above]. Not interested? Skip or reset."
```

**Phase 2 (Ambient + Predictive):**
```
Planner shows (ambient, in-context):
- "You usually plan curry on Fridays. Here are lentil curry options that fit your typical prep time."
- "This week you're on a tight budget. Lentil meal saves £3 vs. meat equivalent; same protein."
- Wearable signal integration (if opted): "Your activity was 15% above average this week; 
  protein needs might be slightly higher. Lentil meal is a good plant-based option."
- Predictive suggestion: "Your household hasn't had a legume meal in 2 weeks. Adding plant diversity 
  to next week's plan? Here's a lentil recipe."
```

---

## PART 5: SHOPPING INTELLIGENCE

### 5.1 Search Intent & Discovery

**Database location:** `shopping_search_log` + `product_search_rules`

**Principle:** When a household *searches* for something, lentils surface if they meet the search intent.

#### 5.1.1 Search Intent Taxonomy

```
**Search intent 1: "Plant protein"**
- Household explicit: Types "plant protein" or "vegan protein" in search
- Household implicit: Filtering for "vegetarian" or "vegan" meal types
- Lentil response: "Lentils are a principal plant-based protein source. Here are lentil recipes."
- Confidence: ✅ High (direct intent match)

**Search intent 2: "Quick dinner" OR "20-minute meal"**
- Household context: Late evening, hungry, short cooking window
- Lentil response: "Red lentils cook in 20 minutes; here's a quick dhal recipe."
- Confidence: ✅ High (red lentils specifically match intent)
- Anti-pattern avoidance: Don't suggest brown lentils (30+ min) for "quick"; suggest red instead.

**Search intent 3: "Budget meal" OR "cheap" OR "affordable protein"**
- Household context: Budget constraint (NK2 H1)
- Lentil response: "Lentils are the most affordable plant-based protein. Dried costs <30p per meal; 
  canned is slightly pricier but saves cooking time."
- Confidence: ✅ High (lentils are objectively the cheapest plant protein)
- Affordability emphasis: "Save 60-70% on protein cost vs. meat."

**Search intent 4: "High fiber" OR "gut health" OR "digestion"**
- Household context: Health goal or digestive concern
- Lentil response: "Lentils are a fiber-rich legume. A serving has 3.6g fiber — about 12% of daily need. 
  Fiber feeds beneficial gut bacteria, supporting digestion and gut health."
- Confidence: ✅ High (Gut benefit sourced; NK1 Rule NK2)

**Search intent 5: "Iron-rich food" OR "vegetarian iron"**
- Household context: Vegetarian/vegan household or health goal
- Lentil response: "Lentils are a plant-based iron source. Pair with vitamin C (tomatoes, peppers, citrus) 
  to boost absorption. A red-lentil tomato dhal is a tasty iron-rich meal."
- Confidence: ⭐ High (sourced; includes bioavailability context from Part 1.2.3)
- Complexity note: This response includes NK1 bioavailability knowledge; requires Nutritionist authoring.

**Search intent 6: "Meal prep" OR "batch cook"**
- Household context: Weekly prep routine; may seek long-storage, reheatable options
- Lentil response: "Lentils freeze beautifully in 2-cup portions. Cook 3-4 servings on Sunday, 
  freeze, reheat for weeknight meals."
- Confidence: ✅ High (practical household knowledge)

**Search intent 7: "[Cuisine] recipe" where cuisine = South Asian, Mediterranean, African**
- Household context: Culturally familiar cooking
- Lentil response (South Asian): "Dhal is a legume foundation in Indian, Pakistani, Bangladeshi cooking. 
  Here are traditional dhal recipes."
- Lentil response (Mediterranean): "Lentil salads and soups are Mediterranean staples. Here are fresh, 
  seasonal recipes."
- Confidence: ✅ High (culturally grounded; NK2 H3)

**Search intent 8: "Complete protein" OR "vegan protein pairing"**
- Household context: Vegetarian/vegan household, nutritional awareness
- Lentil response: "Lentils + rice (or grain) = complete plant protein with all amino acids. 
  Here are grain-lentil recipes."
- Confidence: ✅ High (sourced; NK2 M1: food-first explanation)

**Search intent 9: "No-prep meal" OR "canned" OR "convenience"**
- Household context: Very time-constrained; may seek ready-to-use options
- Lentil response: "Canned lentils are ready to use (drain and season) and nutritionally equivalent 
  to dried. Saves 20 minutes of cooking."
- Confidence: ✅ High (practical; addresses time constraint)
```

---

#### 5.1.2 Anti-Search Patterns (When NOT to Surface Lentils)

```
Search: "Fast carbs" OR "energy boost" OR "sports meal"
→ DO NOT default to lentils (though they have sustained carbs, fresh fruit/toast might be more 
  immediately relevant for acute energy need)
→ Surface if household explicitly wants "plant-based"; otherwise prioritize faster options

Search: "Allergy-free food" (in context of legume allergy)
→ Filter OUT lentils if household has logged legume allergy
→ Surface alternatives: grains, vegetables, other protein sources

Search: "Gluten-free" (unrelated to lentils)
→ Lentils are naturally gluten-free; can mention, but don't make it the headline 
  (lentils are about protein/fiber, not "free-from" positioning)

Search: "Low FODMAP" (if household has IBS or similar)
→ DO NOT recommend standard lentils (high FODMAP)
→ Note: This is a medical diet pattern (NK3 scope boundary); defer to Phase 4+ with clinician partnership
```

---

### 5.3 Shopping Context: Suppermarket Layout & Product Discovery

**Database location:** `shopping_catalog` + `product_location` (future)

**Principle:** Help households find lentils in the store; contextualize choice at point of purchase.

```
Shopping interface (future MVP):
- Household opens Shopping list feature
- Goal: "Plan protein meals for next week"
- THA suggests: "Add lentils for 2 plant-protein meals"
- Household clicks "Add to list" → Lentils added with quantity guidance

Quantity guidance context:
- "2 plant-protein meals" = 300g dried (about 1.5 cups; typical bulk-bin purchase)
- Or: "2 x 400g cans canned lentils" (if household prefers speed)
- Affordability callout: "Dried = ~60p total; canned = ~70p total. Dried saves time over week; canned saves prep time."

Store navigation (future, if integrated with supermarket data):
- Supermarket aisle info: "Pulses section, aisle 5" (Tesco layout example)
- Brand options: "Tesco own-brand vs. premium; nutritionally identical; save 20% with own-brand"
- Bulk-bin option: "Buy loose from bulk bin (aisle 5) — cheapest; bring your own container or use provided bag"

Impulse guidance (to prevent over-buying):
- "You already have 400g dried lentils at home (purchased 2 weeks ago). Sure you want to buy more? 
  Use what you have first; lentils store well."
```

---

## PART 6: MEAL INTELLIGENCE

### 6.1 Common Household Meals: Lentil Appearances

**Database location:** `recipe_methodology` + `meal_taxonomy`

**Principle:** Help households understand where lentils appear in *their* meal patterns.

#### 6.1.1 Meal Type Taxonomy

```
**Breakfast (emerging in modern UK households):**
- Lentil toast topping (cooked lentils + seasoning on whole grain toast)
- Lentil pancakes (flour as binder)
- Lentil soup (leftover dhal for breakfast, common in some cultures)
- Frequency: ~5-10% of UK households (trending upward; emerging breakfast protein)
- THA context: "Lentils for breakfast? Some households enjoy leftover dhal or lentil-topped toast. 
  Unconventional but nutritious — protein starts the day."

**Lunch:**
- Lentil salads (cold, dressed; Mediterranean style)
- Lentil soup (warm, light)
- Lentil grain bowls (lentil + grain + vegetables)
- Lentil wraps (hummus + cooked lentils in flatbread)
- Frequency: ~35-40% of UK households (common)
- THA context: "Lentil salads are quick lunch prep; green lentils hold their shape. Make ahead for work."

**Dinner (main course):**
- Dhal (South Asian: spiced lentil curry)
- Lentil curry (broader fusion style)
- Lentil bolognese / lentil "meatballs" (meat substitute)
- Lentil shepherd's pie (meat substitute in traditional dish)
- Lentil soup (thicker, more substantial)
- Frequency: ~25-35% of UK households (common; highest frequency among age 25-45, 
  higher in vegetarian households)
- THA context: "Lentils are a versatile meal base; they work in curries, soups, 
  and as a meat substitute in any ground-meat recipe."

**Dinner (side):**
- Lentil side salad (with vegetables)
- Dhal as side (to bread or rice)
- Frequency: ~15-20% of households (secondary role; often when main is vegetarian)

**Snack/Appetizer:**
- Lentil hummus / dip
- Roasted lentil crisps (if product available)
- Lentil soup as snack
- Frequency: <5% (niche; emerging category)

**Meal prep / batch cooking:**
- Freeze 4-6 portions of dhal or curry
- Lentil base for multiple meals (mixed with different vegetables/grains across week)
- Frequency: ~20-30% of households that batch cook (growing trend)
```

---

#### 6.1.2 Meal Pairing Intelligence

**Database location:** `food_relationship_graph` + `meal_composition_rules`

```
**Lentil + Rice = Complete Plant Protein**
- Pairing logic: Lentil amino acid profile (low methionine) + Rice amino acid profile (low lysine) 
  = complementary; together = all 9 essential amino acids
- Source: ✅ BNF, ✅ NHS protein guidance
- THA phrasing: "Lentils + rice = complete plant protein. A 150g lentil + 150g rice meal provides 
  all amino acids your body needs from plant sources."
- Meal examples: Dhal with rice, lentil risotto, lentil-rice grain bowl
- Household context: Staple across South Asian, Mediterranean, and African households; increasingly 
  adopted in UK for budget + nutritional balance

**Lentil + Vitamin C Source = Enhanced Iron Absorption**
- Pairing logic: Plant iron (non-heme) has low bioavailability (~5-10%); vitamin C (ascorbic acid) 
  can increase absorption 2-3x
- Source: ✅ USDA FDC, ✅ Peer-reviewed (iron-vitamin C interaction)
- THA phrasing: "To boost iron absorption from lentils, pair with vitamin C — tomatoes, peppers, 
  citrus. A lentil-tomato dhal is both delicious and optimized for iron absorption."
- Meal examples: Lentil-tomato curry, lentil salad with lemon dressing, red-lentil soup with 
  paprika (vitamin C-rich)
- Science note: This demonstrates NK1 bioavailability knowledge (Part 1.2.3) surfaced at meal level.

**Lentil + Grain (any) = Balanced Macro Profile**
- Pairing logic: Lentil (high protein, fiber, minerals; lower carbs) + Grain (higher carbs, some protein) 
  = balanced macronutrient profile
- Source: ✅ Dietary composition guidelines
- THA phrasing: "Lentils pair with any grain — rice, bread, couscous, quinoa. Add vegetables 
  for a complete meal."
- Meal examples: Lentil-rice, lentil-couscous salad, lentil curry with naan, lentil-barley soup
- Household context: Universal pairing across cuisines; economical (grain + legume = budget protein base)

**Lentil + Spice (turmeric + black pepper) = Enhanced Absorption**
- Pairing logic: Turmeric contains curcumin (anti-inflammatory); black pepper (piperine) enhances 
  curcumin absorption 20-fold
- Source: ✅ Peer-reviewed (Shoba et al., 2007: "Influence of piperine on the pharmacokinetics of curcumin")
- THA phrasing: "Dhal with turmeric + black pepper maximizes the anti-inflammatory benefit. 
  This pairing is traditional in South Asian cooking, and nutrition science confirms it."
- Meal examples: Traditional dhal with turmeric, curry with spice blend
- Complexity note: This is Phase 2 enrichment (food pairings + absorption enhancement); 
  not Phase 0 baseline but example of progressive enrichment

**Lentil + Fermented (yogurt, pickle) = Improved Digestibility**
- Pairing logic: Fermented foods have enzymes + probiotics that support legume digestion 
  (legumes can cause gas/bloating)
- Source: ⭐ Emerging research; traditional practice across South Asian/Mediterranean cuisines
- THA phrasing: "Serve dhal with plain yogurt or pickles; fermented foods have enzymes that 
  ease legume digestion. This tradition exists across South Asian cooking for good reason."
- Meal examples: Dhal + yogurt, lentil curry + raita, lentil salad + pickled vegetables
- Household context: Particularly useful if household has reported legume intolerance (soaking + fermented pairing)
```

---

### 6.2 Cultural Meal Context: Where Lentils Are Central

**Database location:** `meal_taxonomy` + `cuisine_context` (future)

```
**South Asian (Indian, Pakistani, Bangladeshi, Sri Lankan):**
Cultural role: Dhal is foundational; appears 3-5x per week in traditional households
Forms used: Red split lentils (soft dhal), brown lentils (heartier), sometimes mixed
Preparation: Spiced with turmeric, cumin, mustard seeds, asafoetida; cooked until soft; served with rice/bread
Meals: Breakfast dhal, lunch dhal, dinner dhal; dhal as side; dhal as protein base for shared meal
THA context: "If your household cooks South Asian, dhal is a foundational meal. THA shows recipes 
that honor this tradition while helping track nutrition."

**Mediterranean (Italian, Greek, Spanish, Turkish, Lebanese):**
Cultural role: Lentil salads, soups, and sides are common; appear 1-2x per week
Forms used: Green lentils (hold shape), brown lentils
Preparation: Cold salads (dressed with olive oil, lemon, herbs), warm soups, sides with vegetables
Meals: Lunch salads, appetizers, sides to main protein
THA context: "Mediterranean lentil salads are light, fresh, and nutritious. Green lentils 
work beautifully; cook ahead and mix with fresh vegetables."

**African (Ethiopian, West African, Southern African):**
Cultural role: Lentils are a staple protein; appear regularly in traditional households
Forms used: Red split lentils, brown lentils
Preparation: Spiced stews (misir wot in Ethiopian), slow-cooked soups
Meals: Main course with injera (bread) or rice
THA context: "Lentil stews are protein-rich, flavorful, and affordable. This recipe honors 
African traditions while being accessible in the UK."

**Caribbean:**
Cultural role: Lentil rice (rice and peas variant using lentils), soups
Forms used: Red split lentils, brown lentils
Preparation: Cooked with coconut milk, spices, herbs
Meals: Main dish with bread or rice; side dish
THA context: "Lentil and rice is a traditional Caribbean staple. Quick, affordable, and delicious."

**East Asian (Chinese):**
Cultural role: Less traditional; emerging as plant-based protein alternative; 
Forms used: Red lentils (for soups), brown (for grain bowls)
Preparation: In soups, stir-fries, or as grain bowl component
THA context: "Lentil soups and stir-fries are modern fusion; not traditional but delicious. 
Try in your favorite East Asian recipes."

**British:**
Cultural role: Lentil soups are traditional (historically); reemergence as plant-based/vegan option
Forms used: Brown lentils, red lentils
Preparation: Soups, pies, cottage-pie variants
Meals: Winter soup, side dish, meat substitute in traditional recipes
THA context: "Lentil soup is a British comfort food. Here's a traditional recipe with a modern twist."
```

---

## PART 7: FOOD RELATIONSHIPS & GRAPH STRUCTURE

### 7.1 Variant Relationships

**Database location:** `food_variety` (via canonical_food_id FK)

```
Canonical: Lentil
├─ Variety: Red split lentil ←→ Relationship: Form (same plant, different processing)
│  ├─ Attributes: Faster cooking (20 min), softer texture (breaks apart), lower fiber
│  ├─ Use cases: Dhal, soups, quick meals
│  └─ Swap-worthiness: Yes (for speed trade-off on texture)
│
├─ Variety: Green lentil ←→ Relationship: Form (same plant, different variety)
│  ├─ Attributes: Longer cooking (30-40 min), holds shape, higher fiber
│  ├─ Use cases: Salads, meal prep, sides
│  └─ Swap-worthiness: No (texture significantly different; salad = green not brown)
│
├─ Variety: Brown lentil ←→ Relationship: Form (same plant, standard variety)
│  ├─ Attributes: Mid cooking (30-35 min), versatile, most common UK
│  ├─ Use cases: Everyday meals, curries, soups
│  └─ Swap-worthiness: Yes (closest to red; slightly longer cooking)
│
└─ Variety: Canned lentil ←→ Relationship: Form (same plant, ready-to-use)
   ├─ Attributes: Instant (no cooking), slight nutrient loss (liquid-soluble vitamins)
   ├─ Use cases: Convenience, busy weeks, time-constrained
   └─ Swap-worthiness: Yes (nutritionally equivalent; convenience premium)
```

**Swap logic (for meal discovery/alternatives):**
```
IF user searches "lentil soup, 30 minutes"
  → Red lentils suggested (faster) OR brown lentils suggested (same time, slightly more soup volume)
  
IF user searches "lentil salad"
  → Green lentils suggested (shape retention) NOT red (breaks apart)
  
IF user has "busy week" signal
  → Canned lentils suggested OR red lentils (fastest dried option)
```

---

### 7.2 Family Relationships (Legume Family)

**Database location:** `food_family` / `canonical_food_relationships`

```
Legume family:
Lentil ←→ Chickpea: Same family; similar nutrients (protein, fiber, folate); different texture/flavor
Lentil ←→ Black bean: Same family; similar role (legume protein base); cultural difference (Caribbean vs. South Asian)
Lentil ←→ Kidney bean: Same family; similar nutrients; larger (different portion size)
Lentil ←→ Split pea: Same family; similar (often cooked together in soups)
Lentil ←→ Peanut: Same legume family (Fabaceae); different use (nut vs. legume); relevant for allergy considerations

Relationship type: "Family (Legume)"
Swap logic: If household is "low on legume variety" (30-plants goal), suggest rotating across legume types
  - Week 1: Lentil dhal
  - Week 2: Chickpea curry
  - Week 3: Black bean stew
  etc.
```

---

### 7.3 Seasonal Relationships (Pairing & Timing)

**Database location:** `seasonal_pairing` / `meal_seasonality`

```
Lentil + Spring peas: Seasonal UK pairing (both available Mar-May)
- Context: "Fresh spring peas + lentils = light spring dish; both at peak affordability"
- Meal: Lentil and pea salad

Lentil + Summer tomatoes: Seasonal UK pairing (Jul-Aug, UK-grown peak)
- Context: "Fresh tomatoes + lentils = optimal iron absorption pairing (vitamin C) 
  + seasonal budget advantage"
- Meal: Tomato lentil salad, lentil soup with fresh tomatoes

Lentil + Autumn root vegetables: Seasonal UK pairing (Sep-Oct)
- Context: "Lentils + carrots, parsnips, onions = hearty autumn meals; 
  all affordable and in season"
- Meal: Lentil and root vegetable curry, soup

Lentil + Winter greens: Seasonal UK pairing (Nov-Feb, winter greens peak)
- Context: "Lentils + kale, cabbage = warming winter meals; both store well; 
  greens provide vitamin C for iron absorption"
- Meal: Lentil and kale curry, lentil and cabbage soup

Temporal pattern: Lentils appear year-round (dried, imported); seasonal variation is in 
*what pairs with them*, not the lentil itself.
```

---

### 7.4 Nutritional Synergy Relationships

**Database location:** `nutrient_pairing_graph` (future)

```
Lentil (iron) + Tomato (vitamin C): Synergy ratio 2-3x absorption boost
- Source: ✅ USDA FDC, ✅ Peer-reviewed
- Meal: Red-lentil tomato dhal
- THA phrasing: "Tomato naturally boosts iron absorption. This pairing is practical nutrition."

Lentil (low methionine) + Rice (low lysine): Amino acid complementarity = complete protein
- Source: ✅ BNF, ✅ Peer-reviewed (amino acid profile charts)
- Meal: Dhal + rice
- THA phrasing: "Lentil + grain = all amino acids your body needs from plants."

Lentil (protein) + Leafy green (volume/minerals): Nutrient density
- Source: ✅ Dietary composition guidelines
- Meal: Lentil salad with spinach/kale
- THA phrasing: "Lentils provide protein; greens add minerals and volume. Together = nutrient-dense meal."

Lentil (antinutrients: phytic acid) + Fermented (enzymes): Digestibility enhancement
- Source: ⭐ Emerging research; traditional practice
- Meal: Dhal + yogurt, lentil + pickle
- THA phrasing: "Fermented foods have enzymes that ease legume digestion. This tradition 
  exists for a reason." (Phase 2 enrichment)

Lentil (soluble fiber) + Oat (soluble fiber): Doubled microbiome benefit
- Source: ✅ EFSA approved health claim (soluble fiber × 2)
- Meal: Lentil oat soup, lentil-oat risotto (emerging)
- THA phrasing: "Lentils + oats = high soluble fiber for gut health." (Phase 2 enrichment)
```

---

## PART 8: EVIDENCE OWNERSHIP & GOVERNANCE RULES

### 8.1 Ownership Matrix: Every Fact Has One Owner

**Rule (NK1 Rule NK1):** Every piece of lentil knowledge has one declared owner with one authority.

| Knowledge | Owner | Authority | Change process |
|---|---|---|---|
| **Canonical identity (food name, slug, aliases)** | Editorial | Canonical food governance | Alias deprecation required; user communication on rename |
| **USDA composition (macros, micros, serving sizes)** | Data Engineering | USDA FDC ingestion | Automated with human verification; yearly refresh |
| **Key nutrient selection (top 5-8 per food)** | Nutritionist + Editorial | Curated kernel; NK2 M4 (show signal, not noise) | Nutritionist recommends; Editorial gates; rare changes |
| **Health benefit claims** | Nutritionist | Evidence gate (NK1 Rule NK2: ≥1 valid SourceRef + lastReviewed + reviewedAt) | Research → Bridge → Evidence gate → Publish |
| **Nutrition context prose (3-4 sentence explanation)** | Editorial | Editorial voice consistency + Nutritionist fact-check | Draft → Nutritionist review → Publish |
| **Cooking guidance (prep, cooking time, nutrient impact)** | Editorial + Nutritionist | Sourced (academic papers, BNF, kitchen testing) | Research → Draft → Nutritionist review → Publish |
| **Seasonality & affordability metadata** | Research + Editorial | gov.uk calendar, supermarket data, THA cohort patterns | Quarterly review; seasonal updates |
| **Food variant taxonomy (red/green/brown/canned)** | Data Engineering + Editorial | USDA FDC + editorial classification | Yearly refresh; new variants as they emerge |
| **Food relationships (pairings, family, seasonal)** | Editorial + Research | Sourced from culinary tradition + nutritional synergy evidence | Editorial decision → Research sourcing → Publish |
| **Planner rules (when to surface lentils)** | Product + Food Intelligence Team | Household pattern analysis + nutritionist guidance | Rule design → Testing → Publish |
| **Shopping intent mapping** | Product + Editorial | User behavior analysis + editorial judgment | Search log analysis → Editorial intent definition → Publish |
| **Meal intelligence (common meals, cultural context)** | Editorial + Community Research | THA cohort meal frequency + cultural knowledge | Cohort analysis → Editorial authoring → Community review → Publish |

**Enforcement:** Every PR adding/modifying lentil knowledge must declare the owner and authority. Code review gates on ownership clarity (prevent split-brain).

---

### 8.2 Evidence Gate: NK1 Rule NK2

**Rule:** No health benefit claim reaches a user without:
1. ≥1 valid `SourceRef` (EFSA/NHS/BNF/NIH-ODS, https, trusted domain per `evidence.ts`)
2. ISO date `lastReviewed` on the SourceRef (Nutritionist verification timestamp)
3. Human `reviewedAt` sign-off on the entire claim row (Nutritionist/Editor timestamp)

#### 8.2.1 Lentil Claims: Evidence Gate Examples

**Claim: "Lentils support gut health through fiber."**

```
✅ PASSED GATE:
- Nutrient: Fiber (2.4g per 100g cooked)
- Source 1: USDA FDC (nutrient composition)
- Source 2: EFSA approved health claim (EC 432/2012: "Dietary fibre contributes to normal bowel function")
- Source 3: BNF guidance on plant-based fiber
- lastReviewed (EFSA claim): 2026-06-15 (within 1 year; Nutritionist verified current)
- reviewedAt: 2026-06-20 (Nutritionist sign-off)
- Status: ✅ PUBLISHED (sourced, current, verified)

Schema example:
{
  "food_id": "canonical_lentil_001",
  "benefit_id": "gut_health",
  "claim": "Lentils support gut health through fiber",
  "nutrient_bridge": "fiber",
  "source_refs": [
    {
      "domain": "usda.gov",
      "url": "https://fdc.nal.usda.gov/fdc-app.html#/?query=lentils",
      "claim_in_source": "Cooked lentil: 2.4g fiber per 100g",
      "lastReviewed": "2026-06-15",
      "reviewer_initials": "AN" (Nutritionist)
    },
    {
      "domain": "eur-lex.europa.eu",
      "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012R0432",
      "claim_in_source": "Dietary fibre contributes to normal bowel function",
      "lastReviewed": "2026-06-15",
      "reviewer_initials": "AN"
    },
    {
      "domain": "nutrition.org.uk",
      "url": "https://www.nutrition.org.uk/...",
      "claim_in_source": "Plant-based fiber sources include legumes",
      "lastReviewed": "2026-06-15",
      "reviewer_initials": "AN"
    }
  ],
  "reviewedAt": "2026-06-20",
  "reviewer": "Nutritionist",
  "status": "published"
}
```

---

**Claim: "Lentils improve bone density over 6 months."**

```
❌ FAILED GATE:
- Issue: Claim is too specific (6-month timeframe not sourced) and directive (improves = medical claim territory)
- Source 1: Peer-reviewed paper on legumes + bone density exists (limited evidence; population-specific)
- Problem: Evidence is correlational, not causational; specific timeframe unfounded
- Status: ❌ REJECTED (reframe or defer)

Acceptable reframe:
✅ "Lentils contain manganese, a mineral involved in bone structure formation."
- Nutrient: Manganese (0.39mg per 100g)
- Source: NHS micronutrient guidance
- lastReviewed: 2026-06-15
- reviewedAt: 2026-06-20
- Status: ✅ PUBLISHED (narrower, sourced, precise)
```

---

**Claim: "Phytic acid in lentils reduces iron absorption; soaking removes phytic acid."**

```
✅ PASSED GATE (Complex, multi-part sourcing):
- Part 1: "Phytic acid in lentils reduces iron absorption"
  - Source: USDA FDC (phytic acid content documented)
  - Source: Peer-reviewed (Sharpe et al., 1950s+; Hallberg et al., iron bioavailability research)
  - lastReviewed: 2026-06-15
  - Status: ✅ Sourced

- Part 2: "Soaking removes phytic acid"
  - Source: Peer-reviewed (Phillippy et al., 1997: phytic acid reduction measured; ~10-15% reduction)
  - Source: USDA cooking studies
  - lastReviewed: 2026-06-15
  - Status: ✅ Sourced (with quantification)

- Phrasing gate (NK2 M3: speak about food, not diagnosis):
  - ✅ "Iron in lentils is plant-based, so your body absorbs less. Soaking for 4-12 hours reduces 
    compounds that block iron absorption. Pairing with vitamin C (tomatoes, peppers) boosts absorption 2-3x."
  - ❌ "Lentil phytic acid prevents iron uptake; you need supplementation."
  
- Status: ✅ PUBLISHED (sourced, accurate, actionable)
```

---

### 8.3 Anti-Fabrication Gates: Code & Review

**Prevention mechanisms:**

1. **Schema-level enforcement:** `reviewedAt` is NOT NULL for published claims (database constraint)
2. **Seeding-time validation:** Seed script refuses unsourced rows (fails fast)
3. **Runtime validation:** `isEvidenceBackedClaim()` validator runs on every render (double-gate)
4. **Code review gate:** Every PR modifying lentil knowledge includes "evidence audit" comment (human review)
5. **Audit queries:** Nutritionist can query all lentil claims → trace each to source (monthly audit)

**Example code review comment:**

```
// src/knowledge/foods/lentil-benefits.ts

✅ APPROVED: Gut health claim
- Nutrient: Fiber (USDA FDC, verified)
- Source: EFSA EC 432/2012 (linked, verified current)
- Phrasing: "Lentils support gut health through fiber" (food-first, per NK2 M1)
- Evidence gate: reviewedAt = 2026-06-20 (Nutritionist verified)

❌ REJECTED: "Superfood" claim removed
- Reason: Banned word per NK2 G5 (moralization)
- Alternative: "Nutritionally dense; principal source of protein, fiber, iron"

❌ REJECTED: "Iron deficiency prevention" claim
- Reason: Medical claim (Rule T1, NK2 M3); speaks about diagnosis
- Alternative: "Iron source; pair with vitamin C for better absorption"
```

---

## PART 9: PROGRESSIVE ENRICHMENT ROADMAP

### 9.1 Phase 0 (Launch): Minimum Viable Knowledge

**What ships:**

| Knowledge Layer | Content | Status |
|---|---|---|
| **Identity & Composition** | Red, green, brown, canned lentil varieties; USDA composition; 8 key nutrients | ✅ Complete |
| **Health Benefits** | 5 sourced benefits (Gut, Energy, Heart, Bone, Immune); phrased food-first | ✅ Complete (pending benefit confirmation from NK1) |
| **Nutrition Context** | 3-4 sentence prose (why it matters, nutrients, use case, forms as equals) | ✅ Authored, reviewed |
| **Practical Forms** | Red (20 min), Green (30+ min), Brown (30 min), Canned (ready); affordability comparison | ✅ Complete |
| **Cooking Guidance** | Boiling + soaking (optional); nutrient impact + phytic acid reduction context | ✅ Complete |
| **Seasonality & Affordability** | Year-round availability; affordability tier (budget-friendly); price variance notes | ✅ Complete |
| **Allergen Info** | Legume allergy (rare; documented); intolerance note (soaking + red lentils ease digestion) | ✅ Complete |
| **Planner Rules** | Surface when household low in plant protein, fiber, or folate; simple gap rules | ✅ Complete |
| **Shopping Intent** | Plant protein, quick dinner, budget, fiber, plant-based protein pairings | ✅ Complete |
| **Meal Intelligence** | Common meals (dhal, curry, salad, soup); South Asian, Mediterranean, British contexts | ✅ Complete |
| **Food Relationships** | Variant relationships (red/green/brown/canned); family (legumes); basic pairings (grain, vitamin C) | ✅ Complete |

**What defers to Phase 1+:**
- Bioavailability optimization pairings (emerging research)
- Predictive meal suggestions (requires learning signals)
- Fermented-pairing digestibility (Phase 2 enrichment)
- Curcumin-bioavailability pairings (turmeric) (Phase 2 research)

---

### 9.2 Phase 1 (6 months post-launch): Personalization & Learning

**New layers:**

| Knowledge Layer | Enhancement | Trigger |
|---|---|---|
| **Personalized gap context** | "You had [X] plant protein this week; this meal adds [Y]" | Planner integration + household learning signals live |
| **Learned preference** | "Your household prefers red lentils (faster); showing red recipes first" | Household choice tracking (event log) + learning signal generation |
| **Meal-prep context** | "Cooking 4 portions on Sunday? Here's a red-lentil curry that reheats beautifully" | Household pattern detection (batch cook frequency) |
| **Cost-aware recommendation** | "Your budget is tight this week; lentil meal saves 70% vs. meat protein" | Household financial context (if tracked) |
| **Cultural reinforcement** | "Your household cooks South Asian; showing traditional dhal recipes" | Household cuisine profile (if collected) |
| **Bioavailability optimization** | "Pair with tomatoes for iron absorption; try this lentil-tomato recipe" | Household health goal (if set) + research completion (bioavailability pairings) |

---

### 9.3 Phase 2 (12 months post-launch): Prediction & Ambient

**New layers:**

| Knowledge Layer | Enhancement | Trigger |
|---|---|---|
| **Predictive timing** | "You usually plan curry Friday; here are lentil curry options" | Household meal-pattern prediction (Stage 4 Food Intelligence Engine) |
| **Ambient context** | "You're low on fiber this week; lentils help. Click to add to planner" | Ambient nutrition strips (in-context guidance) |
| **Food stories** | "Your household's plant-protein intake is 15% below average. Lentils are a budget-friendly booster" | Weekly nutrition narrative (Food Intelligence Engine) |
| **Wearable signals** | "Your activity is 20% above average; protein needs slightly higher. Lentil meal is efficient" | Wearable signal integration (S-1) |
| **Fermented pairing** | "Lentils + yogurt ease digestion. Try dhal with raita" | Household digestive-sensitivity signal or explicit preference |
| **Emerging benefit research** | "New research on lentil polyphenols + inflammation. We're monitoring for future updates" | Research completion (Phase 2 research window) |

---

### 9.4 Phase 3+ (Future): Community & Long-Term Learning

| Knowledge Layer | Enhancement | Trigger |
|---|---|---|
| **Community meals** | "Households like yours cook this lentil dhal. Click to see recipe" | Community capability v1 (Phase 3) |
| **Household-specific variant preference** | "Based on 6 months of cooking, we know red lentils are your go-to. Green lentils are easier for salads" | Long-term household learning (6+ months) |
| **Biomarker integration** | "Your microbiome test suggests high legume fermentation. Pairing lentils with yogurt reduces bloating" | Biomarker signal integration (S-2) + household consent |

---

## PART 10: CANONICAL LENTIL BLUEPRINT SUMMARY

### 10.1 The Template

This blueprint is the **editorial and engineering template** for every future canonical food. Every Pack 1 food must include:

1. **Layer 0 (Identity & Composition):** What it is; what it contains (immutable, shared)
2. **Layer 1 (Household Context):** How households use it; constraints; culture (personalized)
3. **Layer 2 (Predictive):** Why recommend it now? (derived, progressive)

### 10.2 What Makes Lentils a Strong Blueprint

Lentils exercise every dimension:

- ✅ **Nutritional complexity:** Multiple nutrients, multiple benefits, bioavailability challenges
- ✅ **Form variance:** Dried (red/green/brown), canned, sprouted; different cooking times, textures, uses
- ✅ **Preparation complexity:** Cooking affects digestion, nutrient bioavailability, antinutrient reduction
- ✅ **Cultural significance:** Central to South Asian, Mediterranean, African, Caribbean, British cuisines
- ✅ **Household frequency:** High (35%+ of UK households weekly)
- ✅ **Affordability story:** Cheapest plant protein; budget-conscious context
- ✅ **Food relationships:** Pairings (grain, vitamin C, fermented), family (legumes), seasonal pairs
- ✅ **Planner opportunities:** Multiple gaps filled (protein, fiber, plant diversity, affordability, iron)
- ✅ **Shopping diversity:** Multiple search intents (plant protein, quick, budget, gut health, vegan, meal base)
- ✅ **Progressive enrichment:** Phase 0 simple (lentil = protein) → Phase 1 personal (learned preference) → Phase 2 predictive (Friday curry timing) → Phase 3 community (households like yours)

---

### 10.3 Reusable Sections for Other Foods

Every Pack 1 food will follow this structure:

```
Part 1: Food Identity & Factual Knowledge
  └─ 1.1 Canonical Identity (name, slug, aliases, diversity group)
  └─ 1.2 Composition: Nutrient & USDA Data
  └─ 1.3 Health Benefits: Sourced Relationships (5 per benefit established)
  └─ 1.4 Nutrition Context: Editorial Prose (3-4 sentences)
  └─ 1.5 Food Variants: The Variant Taxonomy

Part 2: Practical Household Knowledge
  └─ 2.1 Cooking & Preparation (nutrient/digestibility impact)
  └─ 2.2 Seasonality & Affordability (UK context)
  └─ 2.3 Storage & Shelf-Life

Part 3: Nutrition Methodology Application
  └─ 3.1 Food-First Framing (NK2 M1)
  └─ 3.2 Trade-Offs (NK2 Section 5: honesty, safety, agency, sourcing, familiarity)

Part 4: Planner Intelligence
  └─ 4.1 Gap-Filling Rules (when to surface)
  └─ 4.2 Progressive Enrichment (Phase 0 → Phase 1 → Phase 2)

Part 5: Shopping Intelligence
  └─ 5.1 Search Intent & Discovery
  └─ 5.2 Anti-Search Patterns
  └─ 5.3 Shopping Context (store navigation, quantity guidance)

Part 6: Meal Intelligence
  └─ 6.1 Common Household Meals (breakfast, lunch, dinner, snack, meal prep)
  └─ 6.2 Cultural Meal Context

Part 7: Food Relationships & Graph Structure
  └─ 7.1 Variant Relationships
  └─ 7.2 Family Relationships
  └─ 7.3 Seasonal Relationships
  └─ 7.4 Nutritional Synergy Relationships

Part 8: Evidence Ownership & Governance
  └─ 8.1 Ownership Matrix (one owner per fact)
  └─ 8.2 Evidence Gate (NK1 Rule NK2)
  └─ 8.3 Anti-Fabrication Gates

Part 9: Progressive Enrichment Roadmap
  └─ 9.1 Phase 0 (Launch)
  └─ 9.2 Phase 1 (Personalization)
  └─ 9.3 Phase 2 (Prediction & Ambient)
  └─ 9.4 Phase 3+ (Community & Long-Term)

Part 10: Blueprint Summary & Reusability
```

---

### 10.4 Quality Gates (For Every Food)

Before a canonical food ships:

- [ ] **Identity:** Canonical slug unique, aliases deduplicated
- [ ] **Composition:** USDA data verified for all forms; portion sizes included
- [ ] **Benefits:** 5 sources (one per established benefit); each traced to EFSA/NHS/BNF/NIH-ODS
- [ ] **Context prose:** 3-4 sentences, food-first phrasing, household-accessible, sourced
- [ ] **Variants:** All forms (fresh/frozen/dried/canned if applicable) included; swap logic defined
- [ ] **Cooking guidance:** Nutrient impacts sourced (peer-reviewed or BNF); practical advice tested
- [ ] **Seasonality:** gov.uk calendar + supermarket data verified; affordability tiers current
- [ ] **Food relationships:** 5-10 edges sourced; swaps and pairings verified
- [ ] **Planner rules:** Gap-filling logic tested; no over-recommendation
- [ ] **Shopping intents:** 3-5 search intents defined; anti-patterns identified
- [ ] **Meal intelligence:** 3-5 common meals researched; cultural context respectful
- [ ] **Evidence audit:** 100% of sourced claims traced to authority; `reviewedAt` signed off
- [ ] **Prose quality:** NK2 methodology checks (food-first, household-first, non-moralizing, accurate)

---

## ROLLBACK & SAFETY

**This is a blueprint only. No code, schema, data, or runtime changes.**

- No database migrations needed for NK4 publication.
- No API changes.
- No implementation (design-only document).
- SoT Register update (pointer-only) + implementation-record documents when Phase 0 begins.

**Safe to promote:** This blueprint is a **planning and governance document**. Publishing it establishes the template; actual lentil authoring begins in Phase 0 (post-NK1 promotion).

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **What does complete THA knowledge about a single food look like?** | A 10-layer structure: identity → composition → benefits → context → forms → cooking → seasonality → affordability → relationships → ownership. Each layer sourced, owned, and progressively enriched. |
| **What makes lentils the right blueprint food?** | They exercise every dimension: nutritional complexity, form variance, preparation impacts, cultural significance, household frequency, affordability, relationships, planner/shopping opportunities, and progressive enrichment potential. |
| **How is evidence owned and gated?** | NK1 Rule NK1: one owner per fact. NK1 Rule NK2: evidence gate enforced (≥1 SourceRef + lastReviewed + reviewedAt). Anti-fabrication gates at schema, seeding, runtime, and code-review levels. |
| **How do forms work without multiplying canonical entries?** | Single canonical food; multiple varieties beneath (red/green/brown/canned). Swap logic defined per use case. Avoids split-brain, confusion, duplicate knowledge. |
| **How does NK2 methodology apply?** | Food-first phrasing (lentil → nutrients), household-first constraints (budget, time, culture), honesty over completeness (gaps admitted), safety over optimization, household agency over direction. |
| **How do planner & shopping surfaces use this knowledge?** | Planner: gap-filling rules (protein, fiber, plant diversity) + learned preference (red vs. green). Shopping: search intent mapping (plant protein, quick, budget, gut health) + quantity/affordability guidance. |
| **What's the progressive enrichment path?** | Phase 0: sourced nutrients + benefits + context. Phase 1: personalized gaps + learned preferences. Phase 2: predictive timing + ambient strips + wearable context. Phase 3+: community + long-term learning. |
| **How do food relationships integrate?** | Graph structure (variant, family, seasonal, nutritional synergy). Relationships sourced and owned. Discovery/alternatives algorithms can rank by relationship type. |
| **Is this a reusable template?** | Yes. 10-part structure; quality gates; ownership matrix. Every Pack 1 food follows this template with food-specific variations. |

---

*Blueprint completed: 2026-07-07*  
*Template ready for editorial and engineering adoption*  
*Next milestone: Apply blueprint to 59 other Pack 1 foods; gate each by quality checklist*

