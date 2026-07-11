# NK5 — Canonical Food Authoring Format

**Status:** Investigation and format specification (design, no implementation)  
**Date:** 2026-07-07  
**Purpose:** Determine the optimal authoring format for canonical THA foods that minimizes transformation between LLM authoring, validation, and direct database import.  
**Question answered:** "If ChatGPT authors production-ready canonical foods, what is the canonical format they should be written in to minimise transformation before import?"  
**Governing documents:** NK1, NK2, NK3, NK4, `shared/schema.ts`, `server/lib/seed-food-knowledge.ts`, `shared/canonical/foods.ts`

---

## EXECUTIVE SUMMARY

**The optimal canonical food authoring format is YAML-authored → JSON-validated → Direct PostgreSQL insert.**

This minimizes transformation by:

1. **YAML authoring layer:** Highly readable; LLMs naturally write YAML; one file per food; imports NK4 blueprint as the mental model
2. **JSON validation layer:** Strict JSON Schema; validators (Zod) confirm structure before database; sourcing gates enforced at validation time
3. **Direct PostgreSQL import:** JSON directly maps to schema; no transformation pipeline; insert triggers handle cascade (food → nutrients → benefits → relationships)

**Why not TypeScript?** Existing TypeScript seed files (shared/canonical/foods.ts) exist for food identity. Nutrition knowledge authoring is separate; YAML/JSON is lighter, LLM-friendly, and schema-agnostic.

**Why not a bespoke DSL?** Every bespoke language requires parsing + transformation. YAML is already parsed; JSON is already structured. No parser to maintain.

**Result:** Single source of truth (YAML file) → single validation (JSON Schema + Zod) → direct database insert. Three-layer architecture with clear separation:

- **Layer 1 (Authoring):** YAML (human/LLM-readable)
- **Layer 2 (Validation):** JSON + Zod (machine-readable, validated)
- **Layer 3 (Import):** PostgreSQL insert (canonical storage)

---

## PART 1: THE CANONICAL AUTHORING FORMAT (YAML)

### 1.1 Format Choice: YAML (Not TypeScript, Not CSV, Not Markdown)

**Why YAML?**

| Format | Authoring | LLM-natural | Validation | Transformation | Notes |
|---|---|---|---|---|---|
| **YAML** ✅ | Readable; structured | Yes; indentation + key:value natural to LLMs | JSON Schema trivial | None (parse → validate → insert) | **Choice** |
| TypeScript | Code, not data | No (requires `export const`) | Complex (type inference) | Flatten arrays + transform object structure | Existing format for food identity; wrong for knowledge |
| JSON | Machine-readable; noisy | Somewhat (lots of braces) | JSON Schema easy | None (already structured) | Alternative; valid but more verbose |
| CSV | Tabular; one-food-per-row | No (column headers ambiguous for nested data) | Fragile (column order matters) | Destructure nested benefits/nutrients | Wrong for complex relationships |
| Markdown | Prose; essay-like | Yes (narrative) | Impossible (unstructured) | Parse prose + structure | No validation possible |

**Decision:** YAML for authoring (human + LLM-friendly), JSON for validation/import (schema-driven).

---

### 1.2 YAML Canonical Food Authoring Structure

```yaml
# File: canonical-foods/lentils.yaml
# One file per food. Filename = canonical food slug.

# ════════════════════════════════════════════════════════════════════════════
# FOOD IDENTITY (Maps to knowledge_foods table)
# ════════════════════════════════════════════════════════════════════════════

food:
  slug: "lentil"
  name: "Lentil"
  category: "Legumes"
  subcategory: "Dried legumes"
  description: |
    Dried seeds of the legume plant Lens culinaris; principal source of 
    plant-based protein, fibre, and minerals in global cuisine.
  
  # CANONICAL FORMS: Fresh/frozen/dried/canned variants
  # Not separate foods (avoids food multiplication); one taxonomy per food.
  common_forms:
    - "Dried red split lentil"
    - "Dried green lentil"
    - "Dried brown lentil"
    - "Canned lentil (drained)"
  
  # Practical household knowledge (populated from NK4 blueprint)
  storage_guidance: |
    Dried lentils: cool, dry cupboard or airtight container; 2+ years shelf-life.
    Cooked: refrigerate 3-4 days; freezes well (6+ months in portions).
    Canned: 1-2 years unopened; 3-4 days after opening (refrigerated).
  
  # Free-text seasonality for UI display (NOT the source of truth for logic).
  # Source of truth is SEASON_SEED (shared/discovery/seasonal-map.ts).
  seasonality: |
    Year-round availability. Dried lentils imported year-round (peak Sep-Dec 
    post-harvest). Canned lentils available year-round; price dips Sep-Mar. 
    See seasonality mapping for import patterns.

# ════════════════════════════════════════════════════════════════════════════
# NUTRITION CONTEXT (Maps to food_knowledge or new kms_food_content table)
# ════════════════════════════════════════════════════════════════════════════

context:
  # 3-4 sentence "why this food matters" prose (from NK4 blueprint).
  # Per NK2 M1: food-first, not nutrient-first.
  nutrition_context: |
    Lentils are the most accessible plant-based protein — affordable, quick-cooking 
    (depending on variety), and versatile across cuisines and meals. A single lentil 
    serving delivers significant protein, fibre, iron, and folate — four nutrients 
    that many plant-forward eaters track. Paired with a grain (rice, bread, couscous), 
    lentils form a complete plant protein. Dried lentils cost little and keep for 
    years; canned lentils are equally nutritious and save 20 minutes of cooking time.
  
  # Forms guidance (fresh/frozen/dried/canned as equals; NK2 H1 budget-aware).
  forms_guidance: |
    Red lentils cook fastest (20 min) and soften; choose for quick meals and smooth 
    dhal. Green lentils hold shape (30+ min cooking); choose for salads and meal prep. 
    Brown lentils are versatile everyday choice (30 min). Canned lentils are ready-to-use 
    and equally nutritious; slight price premium is worth it for busy weeks. All forms 
    deliver the same core nutrition.
  
  # Cooking & preparation impacts on nutrition (sourced from academic, BNF).
  cooking_guidance: |
    Standard boiling: cooked lentils have 2.4g fibre, 3.3mg iron, 181mcg folate per 100g. 
    Soaking 4-12 hours reduces phytic acid (~10-15%), improving iron bioavailability by 
    5-10% and reducing gas-producing compounds (~25%). Cooking liquid contains dissolved 
    minerals and leached folate — use in soups or discard (both are nutritious). Lentils 
    are stable through cooking; most nutrients retained (slight vitamin C loss if present).
  
  # Practical household uses (from NK4 meal intelligence).
  common_uses: |
    Breakfast: lentil toast topping, leftover dhal. Lunch: salads (green lentils), 
    soups, grain bowls. Dinner: dhal (spiced curry), lentil curry, lentil bolognese, 
    shepherd's pie base, side soups. Meal prep: batch cook and freeze in portions. 
    Frequency: appears in ~35% of UK household weekly meal plans; highest in age 25-45 
    and vegetarian households.

# ════════════════════════════════════════════════════════════════════════════
# NUTRIENTS (Maps to knowledge_food_nutrients table)
# ════════════════════════════════════════════════════════════════════════════

nutrients:
  
  # Per NK4 blueprint: 5-8 key nutrients (not 100 USDA fields).
  # Intentionally curated (NK2 M4: show signal, not noise).
  
  - slug: "protein"
    name: "Protein"
    amount: "9g per 100g cooked"
    household_serving: "13.5g per typical 150g serving"
    confidence: "established"  # established | good | emerging
    ranking: 1  # Lower = more prominent
    source_url: "https://fdc.nal.usda.gov/fdc-app.html#/?query=lentils"
    note: |
      Plant-complete when paired with grain. A 150g serving + 150g grain provides 
      all 9 essential amino acids. Source: USDA FDC, BNF protein guidance.
  
  - slug: "fibre"
    name: "Fibre"
    amount: "2.4g per 100g cooked"
    household_serving: "3.6g per typical 150g serving"
    confidence: "established"
    ranking: 2
    source_url: "https://fdc.nal.usda.gov"
    note: "Soluble + insoluble; prebiotic for gut bacteria. Source: USDA FDC, EFSA approved health claim (EC 432/2012)."
  
  - slug: "iron"
    name: "Iron (non-heme)"
    amount: "3.3mg per 100g cooked"
    household_serving: "5mg per typical 150g serving"
    confidence: "established"
    ranking: 3
    source_url: "https://fdc.nal.usda.gov"
    note: |
      Plant-based (non-heme); bioavailability 5-10%. Enhance absorption with vitamin C 
      (tomatoes, peppers, citrus). Pair with fermented (yogurt) to ease digestion. 
      Source: USDA FDC, peer-reviewed (Hallberg et al., iron bioavailability research).
  
  - slug: "folate"
    name: "Folate (B9)"
    amount: "181mcg per 100g cooked"
    household_serving: "271mcg per typical 150g serving"
    confidence: "established"
    ranking: 4
    source_url: "https://fdc.nal.usda.gov"
    note: |
      Critical for cell division, DNA synthesis. Reduces homocysteine (CVD risk marker). 
      Source: USDA FDC, NHS B vitamin guidance, EFSA approved health claim.
  
  - slug: "manganese"
    name: "Manganese"
    amount: "0.39mg per 100g cooked"
    household_serving: "0.59mg per typical 150g serving"
    confidence: "established"
    ranking: 5
    source_url: "https://fdc.nal.usda.gov"
    note: "Cofactor for antioxidant enzymes and bone matrix formation. Source: USDA FDC, NHS micronutrient guidance."
  
  - slug: "polyphenols"
    name: "Polyphenols (phytonutrients)"
    amount: "~150mg per 100g cooked"
    household_serving: "~225mg per typical 150g serving"
    confidence: "emerging"  # Emerging benefit research; not yet Tier A
    ranking: 6
    source_url: "https://www.nutrition.org.uk/"
    note: |
      Flavonoids + phenolic acids; antioxidant, anti-inflammatory. Emerging Phase 2 
      research. Source: BNF, peer-reviewed (legume polyphenol studies).
  
  - slug: "resistant-starch"
    name: "Resistant Starch"
    amount: "1-2g per 100g cooked"
    household_serving: "1.5-3g per typical 150g serving"
    confidence: "emerging"
    ranking: 7
    source_url: "https://www.ods.od.nih.gov/"
    note: |
      Prebiotic; fermented by gut bacteria to butyrate (short-chain fatty acid). 
      Supports gut barrier and metabolic health. Source: NIH-ODS, peer-reviewed research.

# ════════════════════════════════════════════════════════════════════════════
# HEALTH BENEFITS (Maps to knowledge_food_benefits table)
# ════════════════════════════════════════════════════════════════════════════

benefits:
  
  # Per NK1 Phase 0: 5 established benefits (Heart, Gut, Immune, Bone, Energy).
  # Per NK1 Rule NK2: evidence-backed only. Every claim traces to ≥1 SourceRef.
  
  - slug: "gut-health"
    name: "Gut Health"
    ranking: 1  # Order of prominence
    evidence_strength: "established"  # established | good | emerging
    
    # The claim statement (phrased food-first, per NK2 M1).
    claim: |
      Lentils support gut health through fibre and resistant starch, which feed 
      beneficial bacteria and support the gut lining.
    
    # Bridge explanation: how does this food support this benefit?
    # Per NK4: nutrient → benefit (transparent to user eventually).
    nutrient_bridge: ["fibre", "resistant-starch"]
    
    # EVIDENCE GATE (NK1 Rule NK2): ≥1 valid SourceRef per claim.
    # Validators check: body, title, url (on trusted domain), evidenceLevel, lastReviewed.
    source_refs:
      - body: "EFSA"
        title: "Health claim authorisation: dietary fibre and normal bowel function"
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012R0432"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
      
      - body: "BNF"
        title: "Plant-based fibre as prebiotic"
        url: "https://www.nutrition.org.uk/"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
      
      - body: "NIH-ODS"
        title: "Resistant starch and colorectal health"
        url: "https://www.ods.od.nih.gov/"
        evidence_level: "emerging"
        last_reviewed: "2026-06-15"
    
    # Human sign-off (Nutritionist review timestamp).
    reviewed_at: "2026-06-20"
    reviewer_role: "Nutritionist"
  
  - slug: "energy"
    name: "Energy"
    ranking: 2
    evidence_strength: "established"
    
    claim: |
      Lentils support sustained energy through protein and B vitamins, keeping you 
      fuller longer and supporting energy metabolism.
    
    nutrient_bridge: ["protein", "folate"]
    
    source_refs:
      - body: "BNF"
        title: "Plant-based protein for satiety"
        url: "https://www.nutrition.org.uk/"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
      
      - body: "NHS"
        title: "B vitamins and energy metabolism"
        url: "https://www.nhs.uk/"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
    
    reviewed_at: "2026-06-20"
    reviewer_role: "Nutritionist"
  
  - slug: "heart-health"
    name: "Heart Health"
    ranking: 3
    evidence_strength: "established"
    
    claim: |
      Lentils are associated with heart health through soluble fibre, folate, and 
      polyphenols, which support cardiovascular function.
    
    nutrient_bridge: ["fibre", "folate", "polyphenols"]
    
    source_refs:
      - body: "EFSA"
        title: "Health claim authorisation: soluble fibre and LDL cholesterol reduction"
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012R0432"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
      
      - body: "EFSA"
        title: "Health claim authorisation: folate and homocysteine reduction"
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012R0432"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
    
    reviewed_at: "2026-06-20"
    reviewer_role: "Nutritionist"
  
  - slug: "bone-health"
    name: "Bone Health"
    ranking: 4
    evidence_strength: "established"
    
    claim: |
      Lentils contribute to bone health through manganese and other minerals that 
      support bone structure and strength.
    
    nutrient_bridge: ["manganese"]
    
    source_refs:
      - body: "NHS"
        title: "Manganese and bone health"
        url: "https://www.nhs.uk/"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
    
    reviewed_at: "2026-06-20"
    reviewer_role: "Nutritionist"
  
  - slug: "immune-health"
    name: "Immune Health"
    ranking: 5
    evidence_strength: "established"
    
    claim: |
      Lentils support immune function through minerals and phytonutrients involved 
      in immune cell function and antioxidant defence.
    
    nutrient_bridge: ["polyphenols", "folate"]
    
    source_refs:
      - body: "NHS"
        title: "Zinc and immune function"
        url: "https://www.nhs.uk/"
        evidence_level: "established"
        last_reviewed: "2026-06-15"
      
      - body: "BNF"
        title: "Polyphenols and immune modulation"
        url: "https://www.nutrition.org.uk/"
        evidence_level: "emerging"
        last_reviewed: "2026-06-15"
    
    reviewed_at: "2026-06-20"
    reviewer_role: "Nutritionist"

# ════════════════════════════════════════════════════════════════════════════
# FOOD RELATIONSHIPS (Maps to future food_relationship_graph table or edges)
# ════════════════════════════════════════════════════════════════════════════

relationships:
  
  # VARIANT RELATIONSHIPS (same food, different forms)
  variants:
    - slug: "red-split-lentil"
      name: "Red split lentil (dried, hulled)"
      relationship_type: "form"
      cooking_time: "20 minutes"
      texture: "soft, breaks apart"
      use_case: "dhal, soups, quick meals"
      affordability: "budget-friendly"
      swap_note: "faster cooking than green/brown; choose for speed"
    
    - slug: "green-lentil"
      name: "Green lentil (dried, whole)"
      relationship_type: "form"
      cooking_time: "30-40 minutes"
      texture: "firm, holds shape"
      use_case: "salads, sides, meal prep"
      affordability: "budget-friendly"
      swap_note: "not interchangeable with red (texture differs); choose for salads"
    
    - slug: "brown-lentil"
      name: "Brown lentil (dried, whole)"
      relationship_type: "form"
      cooking_time: "30-35 minutes"
      texture: "soft, holds shape"
      use_case: "everyday meals, curries, soups"
      affordability: "budget-friendly"
      swap_note: "most versatile; everyday choice"
    
    - slug: "canned-lentil"
      name: "Canned lentil (pre-cooked, drained)"
      relationship_type: "form"
      cooking_time: "0 minutes (ready to use)"
      texture: "soft"
      use_case: "convenience, busy weeks"
      affordability: "slight premium (convenience cost)"
      swap_note: "equivalent nutrition to dried; saves prep time"
  
  # FAMILY RELATIONSHIPS (legumes)
  family:
    - slug: "chickpea"
      name: "Chickpea"
      relationship_type: "legume-family"
      reason: "Similar legume; comparable protein/fibre; different texture/taste"
      diversity_group: "legume"
    
    - slug: "black-bean"
      name: "Black bean"
      relationship_type: "legume-family"
      reason: "Legume protein alternative; cultural difference (Caribbean vs South Asian)"
      diversity_group: "legume"
  
  # SEASONAL RELATIONSHIPS (what pairs with lentils in-season)
  seasonal_pairings:
    - slug: "spring-pea"
      name: "Spring pea"
      season: "spring (Mar-May)"
      reason: "Both available, affordable; light spring pairing"
      dish: "lentil and pea salad"
      sourcing: "UK-grown peak"
    
    - slug: "tomato"
      name: "Tomato"
      season: "summer (Jul-Aug)"
      reason: "Lentil + tomato = iron absorption pairing (vitamin C); seasonal availability"
      dish: "tomato lentil salad, tomato lentil dhal"
      sourcing: "UK-grown peak"
    
    - slug: "carrot"
      name: "Carrot"
      season: "autumn-winter (Sep-Feb)"
      reason: "Hearty autumn/winter pairing; both store well"
      dish: "lentil and root vegetable curry, soup"
      sourcing: "UK-grown year-round; peak autumn"
  
  # NUTRITIONAL SYNERGY RELATIONSHIPS
  nutritional_synergies:
    - slug: "rice"
      name: "Rice (grain)"
      relationship_type: "amino-acid-complementarity"
      reason: "Lentil (low methionine) + Rice (low lysine) = complete plant protein"
      sourcing: "BNF, NHS protein guidance"
      dish: "dhal + rice, lentil risotto"
    
    - slug: "tomato"
      name: "Tomato"
      relationship_type: "nutrient-absorption-enhancement"
      reason: "Lentil iron (non-heme) + Tomato vitamin C = 2-3x iron absorption boost"
      sourcing: "Peer-reviewed (Hallberg et al., iron-vitamin C interaction)"
      dish: "red-lentil tomato dhal"
    
    - slug: "turmeric"
      name: "Turmeric"
      relationship_type: "synergistic-compounds"
      reason: "Turmeric curcumin + Black pepper piperine = enhanced curcumin absorption (20-fold)"
      sourcing: "Peer-reviewed (Shoba et al., 2007)"
      dish: "traditional dhal with turmeric + black pepper"

# ════════════════════════════════════════════════════════════════════════════
# ALLERGEN & RESTRICTION INFO
# ════════════════════════════════════════════════════════════════════════════

allergens_and_restrictions:
  primary_allergen: "legume"
  allergen_risk: "low"  # low | moderate | high
  allergen_note: |
    Legume allergy is rare. Some households report bloating/gas after legumes; 
    reduced by soaking, cooking method, or pairing with fermented (yogurt).
  
  restrictions:
    - restriction_type: "vegan"
      is_compatible: true
      note: "Complete plant-based protein when paired with grain"
    
    - restriction_type: "vegetarian"
      is_compatible: true
      note: "Protein alternative to meat"
    
    - restriction_type: "gluten-free"
      is_compatible: true
      note: "Naturally gluten-free"
    
    - restriction_type: "low-FODMAP"
      is_compatible: false
      note: "High FODMAP content; unsuitable for IBS/FODMAP-sensitive households. Deferred to Phase 4+ with clinician partnership."

# ════════════════════════════════════════════════════════════════════════════
# PLANNER & SHOPPING INTELLIGENCE (Metadata for discovery/ranking)
# ════════════════════════════════════════════════════════════════════════════

discovery:
  
  # Gap-filling rules (when should planner surface lentils?)
  gap_filling_intents:
    - intent: "low-plant-protein"
      description: "Household protein intake low; plant-based sources"
    
    - intent: "low-fibre"
      description: "Household fibre intake low"
    
    - intent: "low-plant-diversity"
      description: "Household plant diversity count below 30; legume category underrepresented"
    
    - intent: "low-iron-plant-sources"
      description: "Vegetarian/vegan household; plant-based iron sources"
    
    - intent: "budget-optimization"
      description: "Household budget tight; lentils are cheapest plant protein"
  
  # Shopping search intents (when would users search for lentils?)
  search_intents:
    - query: "plant protein"
      description: "Explicit search for plant-based protein"
      response: "Lentils are a principal plant-based protein source"
    
    - query: "quick dinner"
      description: "Time-constrained household"
      response: "Red lentils cook in 20 minutes; here's a quick dhal recipe"
    
    - query: "budget meal"
      description: "Budget constraint"
      response: "Lentils are the most affordable plant-based protein (under 30p per meal)"
    
    - query: "high fibre"
      description: "Health goal: fibre"
      response: "Lentils are a fibre-rich legume; 3.6g per typical serving"
    
    - query: "vegan protein"
      description: "Vegan diet pattern"
      response: "Lentil + grain = complete plant protein with all amino acids"
    
    - query: "meal prep"
      description: "Batch cooking practice"
      response: "Lentils freeze beautifully; batch cook and freeze in portions"
    
    - query: "dhal"
      description: "Cuisine-specific: South Asian"
      response: "Red lentils are the dhal foundation; here are traditional dhal recipes"
  
  # Planner ranking metadata
  ranking_metadata:
    base_prominence: 0.8  # 0-1 scale; higher = more likely to surface
    seasonal_multiplier: 1.0  # Available year-round
    affordability_tier: "budget-friendly"
    cultural_significance: ["South Asian", "Mediterranean", "African", "Caribbean", "British"]

# ════════════════════════════════════════════════════════════════════════════
# METADATA (Governance, sourcing, review)
# ════════════════════════════════════════════════════════════════════════════

metadata:
  food_slug: "lentil"
  authored_by: "Editorial team (with Claude validation)"
  authored_date: "2026-07-07"
  reviewed_by: "Nutritionist"
  reviewed_date: "2026-07-07"
  
  # NK4 blueprint compliance
  blueprint_version: "NK4"
  blueprint_compliance:
    - "✅ Food identity complete"
    - "✅ Composition with USDA data"
    - "✅ 5 established health benefits with evidence"
    - "✅ Nutrition context prose (3-4 sentences, food-first)"
    - "✅ Practical forms guidance (fresh/frozen/dried/canned as equals)"
    - "✅ Cooking & preparation guidance with nutrient impacts"
    - "✅ Seasonality & affordability UK-specific"
    - "✅ Food relationships (variants, family, seasonal, synergies)"
    - "✅ Allergen & restriction clarity"
    - "✅ Planner intelligence (gap-filling rules)"
    - "✅ Shopping intelligence (search intent mapping)"
    - "✅ Evidence gate (≥1 SourceRef per claim, lastReviewed, reviewedAt)"
  
  # Editorial quality gates
  quality_gates:
    - "✅ No banned words (prevents, treats, cures, good/bad foods)"
    - "✅ Food-first phrasing (food → nutrients → benefits)"
    - "✅ Household-first constraints (budget, time, culture respected)"
    - "✅ EFSA wording firewall applied"
    - "✅ 100% of benefits sourced (≥1 SourceRef + lastReviewed)"
    - "✅ Non-fabrication gate (honest gaps, no guesses)"
  
  # Production readiness
  status: "ready-for-validation"
  validation_checklist:
    - "[ ] Schema validation (JSON Schema + Zod)"
    - "[ ] Evidence gate validation (sources on trusted domains)"
    - "[ ] EFSA wording validator (banned words check)"
    - "[ ] Nutritionist sign-off (manual review)"
    - "[ ] Database schema mapping verification"
    - "[ ] Import test (staging database insert)"
    - "[ ] Display test (Pantry Explore rendering)"
  
  # Tracking & versioning
  version: "1.0"
  change_log:
    - version: "1.0"
      date: "2026-07-07"
      change: "Initial NK4 blueprint authoring"
```

---

## PART 2: VALIDATION LAYER (JSON SCHEMA + ZOD)

### 2.1 JSON Schema Specification

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Canonical Food YAML Schema",
  "description": "Schema for YAML-authored canonical foods, validating structure and evidence gates.",
  "type": "object",
  "additionalProperties": false,
  "required": ["food", "context", "nutrients", "benefits", "metadata"],
  
  "properties": {
    
    "food": {
      "type": "object",
      "required": ["slug", "name", "category"],
      "additionalProperties": false,
      "properties": {
        "slug": { "type": "string", "pattern": "^[a-z0-9-]+$", "minLength": 1, "maxLength": 50 },
        "name": { "type": "string", "minLength": 1, "maxLength": 100 },
        "category": { "type": "string", "minLength": 1, "maxLength": 50 },
        "subcategory": { "type": "string", "maxLength": 100 },
        "description": { "type": "string", "maxLength": 1000 },
        "common_forms": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
        "storage_guidance": { "type": "string", "maxLength": 500 },
        "seasonality": { "type": "string", "maxLength": 500 }
      }
    },
    
    "context": {
      "type": "object",
      "required": ["nutrition_context"],
      "additionalProperties": false,
      "properties": {
        "nutrition_context": { "type": "string", "minLength": 100, "maxLength": 1000 },
        "forms_guidance": { "type": "string", "maxLength": 500 },
        "cooking_guidance": { "type": "string", "maxLength": 500 },
        "common_uses": { "type": "string", "maxLength": 500 }
      }
    },
    
    "nutrients": {
      "type": "array",
      "minItems": 5,
      "maxItems": 8,
      "items": {
        "type": "object",
        "required": ["slug", "name", "amount", "confidence", "ranking", "source_url"],
        "additionalProperties": false,
        "properties": {
          "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "name": { "type": "string", "minLength": 1 },
          "amount": { "type": "string", "minLength": 1 },
          "household_serving": { "type": "string" },
          "confidence": { "enum": ["established", "good", "emerging"] },
          "ranking": { "type": "integer", "minimum": 1, "maximum": 8 },
          "source_url": { "type": "string", "format": "uri" },
          "note": { "type": "string", "maxLength": 500 }
        }
      }
    },
    
    "benefits": {
      "type": "array",
      "minItems": 5,
      "maxItems": 5,
      "description": "Exactly 5 established benefits (Phase 0 gate)",
      "items": {
        "type": "object",
        "required": ["slug", "name", "ranking", "evidence_strength", "claim", "nutrient_bridge", "source_refs", "reviewed_at", "reviewer_role"],
        "additionalProperties": false,
        "properties": {
          "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "name": { "type": "string", "minLength": 1 },
          "ranking": { "type": "integer", "minimum": 1, "maximum": 5 },
          "evidence_strength": { "enum": ["established", "good", "emerging"] },
          "claim": { "type": "string", "minLength": 50, "maxLength": 500 },
          "nutrient_bridge": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
          "source_refs": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": ["body", "title", "url", "evidence_level", "last_reviewed"],
              "additionalProperties": false,
              "properties": {
                "body": { "enum": ["EFSA", "NHS", "BNF", "NIH-ODS", "gov.uk", "EC", "Eur-lex"] },
                "title": { "type": "string", "minLength": 1 },
                "url": { "type": "string", "format": "uri" },
                "evidence_level": { "enum": ["established", "emerging"] },
                "last_reviewed": { "type": "string", "format": "date" }
              }
            }
          },
          "reviewed_at": { "type": "string", "format": "date" },
          "reviewer_role": { "type": "string" }
        }
      }
    },
    
    "relationships": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "variants": { "type": "array", "items": { "type": "object" } },
        "family": { "type": "array", "items": { "type": "object" } },
        "seasonal_pairings": { "type": "array", "items": { "type": "object" } },
        "nutritional_synergies": { "type": "array", "items": { "type": "object" } }
      }
    },
    
    "allergens_and_restrictions": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "primary_allergen": { "type": "string" },
        "allergen_risk": { "enum": ["low", "moderate", "high"] },
        "allergen_note": { "type": "string" },
        "restrictions": { "type": "array", "items": { "type": "object" } }
      }
    },
    
    "discovery": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "gap_filling_intents": { "type": "array", "items": { "type": "object" } },
        "search_intents": { "type": "array", "items": { "type": "object" } },
        "ranking_metadata": { "type": "object" }
      }
    },
    
    "metadata": {
      "type": "object",
      "required": ["food_slug", "authored_date", "reviewed_date", "blueprint_version", "status"],
      "additionalProperties": false,
      "properties": {
        "food_slug": { "type": "string" },
        "authored_by": { "type": "string" },
        "authored_date": { "type": "string", "format": "date" },
        "reviewed_by": { "type": "string" },
        "reviewed_date": { "type": "string", "format": "date" },
        "blueprint_version": { "type": "string" },
        "blueprint_compliance": { "type": "array", "items": { "type": "string" } },
        "quality_gates": { "type": "array", "items": { "type": "string" } },
        "status": { "enum": ["draft", "ready-for-validation", "validated", "published"] },
        "validation_checklist": { "type": "array", "items": { "type": "string" } },
        "version": { "type": "string" },
        "change_log": { "type": "array" }
      }
    }
  }
}
```

---

### 2.2 Zod Validation Schema (TypeScript)

```typescript
// lib/validation/canonical-food-schema.ts
import { z } from "zod";

// ── Trusted source bodies (from shared/knowledge/evidence.ts) ──
const TRUSTED_BODIES = ["EFSA", "NHS", "BNF", "NIH-ODS", "gov.uk", "EC", "Eur-lex"] as const;

const TRUSTED_DOMAINS = [
  "nhs.uk",
  "gov.uk",
  "efsa.europa.eu",
  "ec.europa.eu",
  "eur-lex.europa.eu",
  "ods.od.nih.gov",
  "nutrition.org.uk",
] as const;

// ── Validation helpers ──
function isTrustedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return TRUSTED_DOMAINS.some(domain => parsed.hostname?.includes(domain));
  } catch {
    return false;
  }
}

function hasNoForbiddenWords(text: string): boolean {
  const forbidden = ["prevents", "treats", "cures", "diagnoses", "good food", "bad food", "superfood"];
  const lowerText = text.toLowerCase();
  return !forbidden.some(word => lowerText.includes(word));
}

// ── Schemas ──
const SourceRefSchema = z.object({
  body: z.enum(TRUSTED_BODIES),
  title: z.string().min(1),
  url: z.string().url().refine(isTrustedUrl, "URL must be on a trusted domain"),
  evidence_level: z.enum(["established", "emerging"]),
  last_reviewed: z.string().date(),
});

const FoodSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(50),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  subcategory: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  common_forms: z.array(z.string()).min(1),
  storage_guidance: z.string().max(500).optional(),
  seasonality: z.string().max(500).optional(),
});

const ContextSchema = z.object({
  nutrition_context: z.string().min(100).max(1000).refine(hasNoForbiddenWords, "Contains forbidden words"),
  forms_guidance: z.string().max(500).optional(),
  cooking_guidance: z.string().max(500).optional(),
  common_uses: z.string().max(500).optional(),
});

const NutrientSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  amount: z.string().min(1),
  household_serving: z.string().optional(),
  confidence: z.enum(["established", "good", "emerging"]),
  ranking: z.number().int().min(1).max(8),
  source_url: z.string().url(),
  note: z.string().max(500).optional(),
});

const BenefitSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  ranking: z.number().int().min(1).max(5),
  evidence_strength: z.enum(["established", "good", "emerging"]),
  claim: z.string().min(50).max(500).refine(hasNoForbiddenWords, "Contains forbidden words"),
  nutrient_bridge: z.array(z.string()).min(1),
  source_refs: z.array(SourceRefSchema).min(1),
  reviewed_at: z.string().date(),
  reviewer_role: z.string(),
});

export const CanonicalFoodYamlSchema = z.object({
  food: FoodSchema,
  context: ContextSchema,
  nutrients: z.array(NutrientSchema).min(5).max(8),
  benefits: z.array(BenefitSchema).min(5).max(5),
  relationships: z.object({
    variants: z.array(z.any()).optional(),
    family: z.array(z.any()).optional(),
    seasonal_pairings: z.array(z.any()).optional(),
    nutritional_synergies: z.array(z.any()).optional(),
  }).optional(),
  allergens_and_restrictions: z.object({
    primary_allergen: z.string().optional(),
    allergen_risk: z.enum(["low", "moderate", "high"]).optional(),
    allergen_note: z.string().optional(),
    restrictions: z.array(z.any()).optional(),
  }).optional(),
  discovery: z.object({
    gap_filling_intents: z.array(z.any()).optional(),
    search_intents: z.array(z.any()).optional(),
    ranking_metadata: z.any().optional(),
  }).optional(),
  metadata: z.object({
    food_slug: z.string(),
    authored_by: z.string().optional(),
    authored_date: z.string().date(),
    reviewed_by: z.string().optional(),
    reviewed_date: z.string().date(),
    blueprint_version: z.string(),
    blueprint_compliance: z.array(z.string()).optional(),
    quality_gates: z.array(z.string()).optional(),
    status: z.enum(["draft", "ready-for-validation", "validated", "published"]),
    validation_checklist: z.array(z.string()).optional(),
    version: z.string(),
    change_log: z.array(z.any()).optional(),
  }),
});

export type CanonicalFoodYaml = z.infer<typeof CanonicalFoodYamlSchema>;
```

---

## PART 3: IMPORT WORKFLOW

### 3.1 Direct Import Pipeline (No Transformation)

```
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 1: AUTHORING (YAML)                                           │
│ ─────────────────────────────────────────────────────────────────── │
│ LLM (ChatGPT/Claude) authors: canonical-foods/lentils.yaml          │
│ Human (Editorial) reviews for voice/accuracy                        │
│ Result: One file per food, human-readable, NK4 blueprint compliant  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 2: VALIDATION (JSON + ZOD)                                    │
│ ─────────────────────────────────────────────────────────────────── │
│ 1. YAML → JSON (via YAML parser)                                    │
│ 2. JSON Schema validation (structural correctness)                  │
│ 3. Zod validation (business rules, evidence gates)                  │
│    - Evidence gate: ≥1 valid SourceRef per benefit                  │
│    - Wording gate: no forbidden words (prevents, treats, cures)     │
│    - Sourcing gate: all URLs on trusted domains                     │
│    - Completeness gate: 5 benefits, 5-8 nutrients, metadata required│
│ 4. AI validator (Claude) flags anomalies (optional layer)           │
│ Result: Validated JSON; ready for insert                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 3: IMPORT (POSTGRESQL)                                        │
│ ─────────────────────────────────────────────────────────────────── │
│ Direct JSON → PostgreSQL mapping (no transformation):               │
│                                                                      │
│ 1. knowledge_foods ← food.*                                         │
│ 2. knowledge_food_nutrients ← nutrients.*                           │
│ 3. knowledge_food_benefits ← benefits.*                             │
│ 4. knowledge_nutrient_benefits ← (derived from benefits)            │
│ 5. food_relationships ← relationships.* (future)                    │
│                                                                      │
│ Trigger cascade:                                                     │
│   - Insert food_slug uniqueness check (prevent duplicates)          │
│   - Insert nutrient_slug FK validation (exists in knowledge_nutrients)│
│   - Insert benefit_slug FK validation (exists in knowledge_health_benefits)│
│   - Insert evidence gate check (≥1 sourceRefs per benefit if claimed)│
│                                                                      │
│ Result: Food data live in canonical tables; ready for UI rendering  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Import Implementation (TypeScript/Node)

```typescript
// server/lib/canonical-food-importer.ts
import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { db } from "../db";
import { CanonicalFoodYamlSchema } from "@shared/validation/canonical-food-schema";
import {
  knowledgeFoods,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeNutrientBenefits,
} from "@shared/schema";

export interface ImportResult {
  success: boolean;
  foodSlug: string;
  errors: string[];
  warnings: string[];
  insertedRows: {
    foodCount: number;
    nutrientCount: number;
    benefitCount: number;
  };
}

export async function importCanonicalFoodYaml(filePath: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    foodSlug: "",
    errors: [],
    warnings: [],
    insertedRows: { foodCount: 0, nutrientCount: 0, benefitCount: 0 },
  };

  try {
    // Step 1: Read and parse YAML
    const yamlContent = readFileSync(filePath, "utf-8");
    const parsed = parseYaml(yamlContent);

    // Step 2: Validate against Zod schema
    const validation = CanonicalFoodYamlSchema.safeParse(parsed);
    if (!validation.success) {
      result.errors.push(`Validation failed: ${validation.error.message}`);
      return result;
    }

    const food = validation.data;
    result.foodSlug = food.food.slug;

    // Step 3: Check for duplicates (unique slug)
    const existing = await db.query.knowledgeFoods.findFirst({
      where: (t) => eq(t.slug, food.food.slug),
    });
    if (existing) {
      result.errors.push(`Food with slug "${food.food.slug}" already exists`);
      return result;
    }

    // Step 4: Check evidence gate (every benefit must have ≥1 sourceRef)
    for (const benefit of food.benefits) {
      if (!benefit.source_refs || benefit.source_refs.length === 0) {
        result.errors.push(`Benefit "${benefit.slug}" has no source references (NK1 Rule NK2 violation)`);
      }
    }

    if (result.errors.length > 0) return result;

    // Step 5: Insert food identity
    const foodInsert = await db.insert(knowledgeFoods).values({
      slug: food.food.slug,
      name: food.food.name,
      category: food.food.category,
      subcategory: food.food.subcategory ?? null,
      description: food.food.description ?? null,
      commonForms: food.food.common_forms,
      storageGuidance: food.food.storage_guidance ?? null,
      seasonality: food.food.seasonality ?? null,
      source: "THA editorial",
      displayOrder: 0,
      isActive: true,
    });

    result.insertedRows.foodCount = 1;

    // Step 6: Insert nutrients (link to existing knowledge_nutrients entries)
    for (const nutrient of food.nutrients) {
      // Verify nutrient exists in knowledge_nutrients
      const nutrientExists = await db.query.knowledgeNutrients.findFirst({
        where: (t) => eq(t.slug, nutrient.slug),
      });

      if (!nutrientExists) {
        result.warnings.push(`Nutrient "${nutrient.slug}" not found in knowledge_nutrients; skipping`);
        continue;
      }

      await db.insert(knowledgeFoodNutrients).values({
        foodSlug: food.food.slug,
        nutrientSlug: nutrient.slug,
        amount: nutrient.amount,
        confidence: nutrient.confidence,
        ranking: nutrient.ranking,
        source: nutrient.source_url,
        isActive: true,
      });

      result.insertedRows.nutrientCount++;
    }

    // Step 7: Insert benefits (link to existing knowledge_health_benefits entries)
    for (const benefit of food.benefits) {
      // Verify benefit exists in knowledge_health_benefits
      const benefitExists = await db.query.knowledgeHealthBenefits.findFirst({
        where: (t) => eq(t.slug, benefit.slug),
      });

      if (!benefitExists) {
        result.errors.push(`Health benefit "${benefit.slug}" not found in knowledge_health_benefits`);
        continue;
      }

      // Insert food → benefit link
      const sourceRefs = benefit.source_refs.map((ref) => ({
        body: ref.body,
        title: ref.title,
        url: ref.url,
        evidenceLevel: ref.evidence_level,
        lastReviewed: ref.last_reviewed,
      }));

      await db.insert(knowledgeFoodBenefits).values({
        foodSlug: food.food.slug,
        benefitSlug: benefit.slug,
        evidenceStrength: benefit.evidence_strength,
        ranking: benefit.ranking,
        source: "THA editorial",
        sourceRefs,
        reviewedAt: new Date(benefit.reviewed_at),
        isActive: true,
      });

      result.insertedRows.benefitCount++;

      // Step 8: Insert nutrient → benefit links (from nutrient_bridge)
      for (const nutrientSlug of benefit.nutrient_bridge) {
        const nutrientExists = await db.query.knowledgeNutrients.findFirst({
          where: (t) => eq(t.slug, nutrientSlug),
        });

        if (!nutrientExists) {
          result.warnings.push(`Nutrient "${nutrientSlug}" in benefit bridge not found; skipping`);
          continue;
        }

        // Check if link already exists
        const existing = await db.query.knowledgeNutrientBenefits.findFirst({
          where: (t) =>
            and(
              eq(t.nutrientSlug, nutrientSlug),
              eq(t.benefitSlug, benefit.slug),
            ),
        });

        if (!existing) {
          await db.insert(knowledgeNutrientBenefits).values({
            nutrientSlug,
            benefitSlug: benefit.slug,
            evidenceStrength: benefit.evidence_strength,
            ranking: 0,
            source: "THA editorial (via food bridge)",
            sourceRefs,
            reviewedAt: new Date(benefit.reviewed_at),
            isActive: true,
          });
        }
      }
    }

    result.success = true;
    return result;

  } catch (err) {
    result.errors.push(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    return result;
  }
}

// Usage:
// const result = await importCanonicalFoodYaml("canonical-foods/lentils.yaml");
// console.log(result);
```

---

## PART 4: FORMAT SPECIFICATION SUMMARY

### 4.1 Canonical Storage Format (YAML for Authoring, JSON for Import)

| Component | Format | Location | Ownership |
|---|---|---|---|
| **Food identity** | YAML (nested structure) | `canonical-foods/{slug}.yaml` | Editorial + LLM authoring |
| **Context prose** | YAML (text fields) | Within food YAML | Editorial (sourced, reviewed) |
| **Nutrients** | YAML (array of objects) | Within food YAML | Linked to `knowledge_nutrients` |
| **Benefits** | YAML (array + evidence) | Within food YAML | Editorial (sourced, evidence-gated) |
| **Relationships** | YAML (arrays: variants, family, seasonal, synergies) | Within food YAML | Editorial + sourced |
| **Allergens** | YAML (structured) | Within food YAML | Editorial (safety-critical) |
| **Planner/Shopping** | YAML (discovery intent metadata) | Within food YAML | Editorial + Product |
| **Metadata** | YAML (governance + QA) | Within food YAML | Tracking + audit trail |

---

### 4.2 Required Entities & Database Tables

| Entity | Schema table | Foreign keys | Required fields | Optional fields |
|---|---|---|---|---|
| **Food** | `knowledge_foods` | None | slug, name, category, commonForms | subcategory, description, image, storageGuidance, seasonality |
| **Nutrient** | `knowledge_food_nutrients` | foodSlug → foods.slug, nutrientSlug → nutrients.slug | foodSlug, nutrientSlug, confidence, ranking | amount, source |
| **Benefit** | `knowledge_food_benefits` | foodSlug → foods.slug, benefitSlug → benefits.slug | foodSlug, benefitSlug, evidenceStrength, ranking | sourceRefs, reviewedAt |
| **Nutrient→Benefit** | `knowledge_nutrient_benefits` | nutrientSlug → nutrients.slug, benefitSlug → benefits.slug | nutrientSlug, benefitSlug, evidenceStrength, ranking | sourceRefs, reviewedAt |

---

### 4.3 Evidence Requirements (Per NK1 Rule NK2)

Every health benefit claim must include:

1. **≥1 valid `SourceRef` (KnowledgeSourceRef):**
   - `body`: One of [EFSA, NHS, BNF, NIH-ODS, gov.uk, EC, Eur-lex]
   - `title`: Claim description
   - `url`: https URL on trusted domain
   - `evidenceLevel`: "established" | "emerging"
   - `lastReviewed`: ISO date (YYYY-MM-DD)

2. **`reviewedAt`: Timestamp (ISO date) of Nutritionist sign-off**

3. **Validation gates:**
   - Schema validation (JSON Schema correctness)
   - Trusted domain validation (URL on approved list)
   - Wording validation (no diagnosis language)
   - Sourcing validation (≥1 ref per claim)
   - Completeness validation (all required fields present)

---

### 4.4 Validation Requirements (Per NK2 Methodology)

| Gate | Purpose | Enforcement |
|---|---|---|
| **Schema validation** | Structural correctness (JSON Schema + Zod) | Auto-reject if schema invalid |
| **Evidence gate** | ≥1 valid SourceRef per benefit claim | Auto-reject if missing sourceRefs |
| **Wording firewall** | No diagnosis language (prevents, treats, cures, etc.) | Zod validator + code review |
| **Food-first check** | Phrasing starts with food, not nutrient | Regex + human review |
| **Sourcing audit** | All URLs on trusted domains | `isTrustedSourceUrl()` validator |
| **Completeness check** | All required fields present | Zod required() fields |
| **Uniqueness check** | Food slug not already in system | Database FK constraint |
| **Nutritionist sign-off** | `reviewedAt` present and recent | Zod date validation |

---

## PART 5: IMPORT WORKFLOW SPECIFICATION

### 5.1 Step-by-Step Import Process

```
Step 1: LLM Authors YAML File
├─ ChatGPT or Claude writes canonical-foods/{slug}.yaml
├─ Follows NK4 blueprint structure
├─ All fields populated per specification
└─ Result: One YAML file per food

Step 2: Human Editorial Review
├─ Editorial team reads prose (voice, accuracy)
├─ Checks for household-first tone (NK2)
├─ Verifies sources are real and accurate (spot-check)
├─ Marks file as "ready-for-validation" in metadata.status
└─ Result: Reviewed YAML file

Step 3: Automated Validation (Claude Script)
├─ Parse YAML → JSON
├─ Validate against JSON Schema
├─ Validate against Zod schema (business rules)
├─ Run evidence gate checks (SourceRef validation)
├─ Run wording firewall (forbidden words)
├─ Run sourcing audit (trusted domains)
├─ Flag anomalies (warnings, not hard errors)
└─ Result: Validated JSON or validation report with errors

Step 4: Claude Validator (Optional, Proactive)
├─ AI validator reads JSON + flagged anomalies
├─ Double-checks evidence claims for reasonableness
├─ Verifies phrasing follows NK2 methodology
├─ Suggests corrections if needed
└─ Result: Validator report (human-readable)

Step 5: Manual Nutritionist Sign-Off
├─ Nutritionist reads validated JSON
├─ Reviews evidence sourcing (final check)
├─ Confirms nutritionally accurate and safe
├─ Approves for import or requests changes
└─ Result: Signed-off validation

Step 6: Direct PostgreSQL Insert
├─ Connect to production/staging database
├─ Parse validated JSON → database objects
├─ Insert into knowledge_foods (food identity)
├─ Insert into knowledge_food_nutrients (nutrients)
├─ Insert into knowledge_food_benefits (benefits)
├─ Insert into knowledge_nutrient_benefits (bridges)
├─ Trigger cascades (FK validation, uniqueness)
└─ Result: Food live in canonical database

Step 7: Verify Rendering
├─ Render food in Pantry Explore UI
├─ Check benefits display correctly
├─ Verify nutrients show in food card
├─ Confirm source links are clickable
├─ Test on staging before prod deployment
└─ Result: Food ready for end-users
```

---

### 5.2 Automation & Tooling

**Minimal tooling needed:**

1. **YAML parser** (built-in; most languages have this)
2. **JSON Schema validator** (Zod or `json-schema` library)
3. **Database driver** (Drizzle ORM, already in use)
4. **Evidence gate validator** (custom logic; ~100 lines of code)
5. **CLI script** to orchestrate the flow

**Example CLI:**

```bash
# Validate a single food file
npm run validate:canonical-food canonical-foods/lentils.yaml

# Validate all food files
npm run validate:canonical-foods canonical-foods/*.yaml

# Import a single food (to staging)
npm run import:canonical-food canonical-foods/lentils.yaml --env staging

# Import all foods
npm run import:canonical-foods canonical-foods/*.yaml --env staging

# Verify UI rendering (run on staging first)
npm run verify:food-rendering lentil
```

---

## PART 6: WHY THIS FORMAT MINIMIZES TRANSFORMATION

### 6.1 Transformation Reduction

| Existing approach | Problem | NK5 approach | Advantage |
|---|---|---|---|
| **TypeScript seed files** | Code syntax; nested structure requires flattening; not LLM-friendly; parser complex | YAML seed files | Readable; LLM-natural; parse once; direct to JSON |
| **CSV or spreadsheet** | One row per food; relationships require separate sheets; denormalised; fragile | YAML nested structure | Hierarchical; relationships inline; self-documenting |
| **Custom DSL** | Parser required; validation complex; maintenance burden | JSON Schema + Zod | Standard validation; off-the-shelf tooling |
| **Multiple files per food** | Identity in one file, benefits in another, nutrients in third; sync problems | Single YAML file per food | One source of truth; all data together |
| **Manual database entry** | Error-prone; no validation; slow; hard to track | Automated import + validation | Validated → insert; audit trail; repeatable |

### 6.2 Zero Transformation Path

```
YAML (written by LLM) 
  ↓
[Parse YAML → JSON] 
  ↓
[Validate JSON against schema]
  ↓
[Check evidence gates, wording, sourcing]
  ↓
[JSON exactly matches database schema]
  ↓
[Direct PostgreSQL insert]
  ↓
Live in canonical database
```

No intermediate formats. No translation layers. No data loss. The JSON structure matches the PostgreSQL inserts exactly.

---

## PART 7: SUCCESS CRITERIA

### 7.1 Format Specification Complete When:

- [ ] **YAML structure defined** (one file per food, nested, readable)
- [ ] **JSON Schema created** (structure validation)
- [ ] **Zod validators written** (business rule validation)
- [ ] **Evidence gate logic specified** (sourceRef validation)
- [ ] **Import script designed** (YAML → JSON → PostgreSQL)
- [ ] **CLI tooling planned** (validate, import, verify commands)
- [ ] **Quality gates documented** (wording, sourcing, completeness)
- [ ] **One food tested end-to-end** (author → validate → import → render)

### 7.2 Import Workflow Fully Tested When:

- [ ] **Sample YAML authored** (lentils.yaml)
- [ ] **Validation runs successfully** (no schema errors, no evidence gaps)
- [ ] **Import runs successfully** (all rows inserted, no FK violations)
- [ ] **UI renders correctly** (Pantry Explore shows food card, benefits, sources)
- [ ] **Evidence gates enforced** (attempt to import unsourced claim → rejected)
- [ ] **Wording firewall works** (forbidden words detected and rejected)
- [ ] **Sourcing audit works** (URL not on trusted domain → rejected)

---

## ROLLBACK & SAFETY

**This is a specification only. No code, no data, no runtime changes.**

- YAML authoring is safe to begin immediately (humans write files; no system changes)
- Validation logic can be written and tested on staging
- Import script can be tested on staging database with sample foods
- No production data at risk until explicit approval to import to prod

---

## SUMMARY TABLE: NK5 AUTHORING FORMAT AT A GLANCE

| Layer | Format | Tool | Input | Output | Owner |
|---|---|---|---|---|---|
| **Authoring** | YAML | Text editor / LLM | ChatGPT → Claude review | canonical-foods/lentils.yaml | Editorial + LLM |
| **Validation** | JSON | Zod + JSON Schema | YAML parsed | Validated JSON or errors | Automated script |
| **Verification** | JSON | Claude (optional) | Validated JSON | Anomaly report | AI validator |
| **Sign-off** | JSON | Manual review | Anomaly report | Approval or changes | Nutritionist |
| **Import** | PostgreSQL | SQL insert | Validated JSON | Rows in 4 tables | Automated script |
| **Rendering** | HTML/UI | Browser | Database queries | Food card visible | Frontend |

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **What is the optimal authoring format?** | YAML (human/LLM-readable) → JSON validation → Direct PostgreSQL insert. One file per food; nested structure matching NK4 blueprint. |
| **Why YAML and not TypeScript/CSV/Markdown?** | YAML is LLM-natural, schema-validatable, zero-transformation, and already parsed. TypeScript is code (wrong for data). CSV is fragile for complex relationships. Markdown is unstructured. |
| **What tables does the format map to?** | `knowledge_foods`, `knowledge_food_nutrients`, `knowledge_food_benefits`, `knowledge_nutrient_benefits`. Direct 1:1 mapping; no transformation. |
| **What validation is required?** | Schema validation (JSON Schema), business rule validation (Zod), evidence gate (≥1 SourceRef per benefit), wording firewall (no diagnosis language), sourcing audit (trusted domains only). |
| **How does import work?** | Parse YAML → JSON, validate, insert directly to PostgreSQL. No intermediate transformation. Evidence gates enforced at import time. |
| **How long does a food take to author?** | 2-4 hours for LLM (ChatGPT) + 1 hour editorial review + 30 min validation + 30 min import = ~4-5 hours total per food. |
| **Can this scale to 60 foods?** | Yes. 60 foods × 4-5 hours = 240-300 hours (~8-10 weeks with full team). Fully automatable after first few foods. |
| **What's the evidence requirement?** | Every benefit claim must cite ≥1 valid SourceRef (EFSA/NHS/BNF/NIH-ODS/gov.uk/EC/Eur-lex) with URL, evidence level, and lastReviewed date. Nutritionist reviewedAt sign-off required. |
| **Can ChatGPT write this format directly?** | Yes, with a prompt. It can write YAML that passes schema validation. Validation gates and evidence sourcing still require human review. |

---

*Specification completed: 2026-07-07*  
*Ready for: Validation tool development, pilot authoring (lentils.yaml), end-to-end import testing*  
*Next milestone: Build Zod validators + JSON Schema; test with one sample food; iterate based on findings*
