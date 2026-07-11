# WS3B — Qualifiers Architecture Investigation

> **The same food. A different choice about it.**
>
> Investigation only. No schema changes. No UI changes. No implementation.

| | |
|---|---|
| **Document type** | Investigation + target architecture (no implementation) |
| **Date** | 2026-06-20 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at investigation** | `72eccee` (WS3A complete) |
| **Rollback tag** | `rollback/ws3b-pre-investigation-20260620` → commit `72eccee` |
| **Restore command** | `git checkout rollback/ws3b-pre-investigation-20260620` |
| **Predecessor documents** | WS0 · WS1.5 · WS2A · WS2B · WS2C · WS2D · WS2E · WS2F · WS2G · WS3A |

**This document changes nothing executable.** Reads existing data: YES. Writes new data: NO.
Changes meaning of existing data: NO. Requires backfill: NO.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed clean.** Branch `safety/preserve-since-last-prod-20260617-1613`. Working tree clean.
2. ✅ **WS3A protected.** Tag `rollback/ws3a-pre-impl-20260619` → commit `9a436f8`.
   All prior workstreams (WS0 through WS2G) also protected via their respective tags.
3. ✅ **Rollback tag created:** `rollback/ws3b-pre-investigation-20260620` → commit `72eccee`.
4. ✅ **Rollback identifier reported** (top of doc + here).

---

## EXECUTIVE SUMMARY

THA currently models food identity as:

```
DiversityGroup
  └─ CanonicalFood                 (tomato, salmon, olive oil)
       ├─ FoodVariety              (cherry tomato, plum tomato)
       └─ CanonicalFoodAlias      (tomatoes → tomato, EVOO → extra-virgin-olive-oil)
           └─ aliasType: form     (tinned tomatoes, dried basil)
```

Qualifiers sit in a gap this model does not address. They are not:
- varieties (not cultivar differences — the same animal, bean, or fish)
- aliases (they carry real nutritional and sourcing signals)
- forms (not cooking/processing state — they describe production before the kitchen)
- separate foods (grass-fed beef IS beef; smoked salmon is still salmon)

**The recommendation:** Qualifiers should be modelled as a lightweight metadata layer on
`canonical_food` — a `food_qualifier` table, or initially as a `qualifiers: jsonb` field —
rather than as new canonical foods or new variety records. Their primary home is the
**Analyser** and **Pantry knowledge** surfaces. They should surface in **Shopping** as
buying guidance, optionally in **Nutrition Report** as context, but **not** in Planner
recipes or as named ingredients in meals.

---

## SECTION 1 — What is a Qualifier?

### 1.1 Definition

A Qualifier describes **a production, sourcing, or quality choice** that applies to the
same canonical food, without changing the food's fundamental identity or taxonomy.

```
Canonical Food: Salmon
  Qualifier: Wild           ← how it was caught
  Qualifier: Farmed         ← how it was raised
  Qualifier: Smoked         ← how it was processed (borderline — see 1.4)

Canonical Food: Beef
  Qualifier: Grass-fed      ← how the animal was raised
  Qualifier: Organic        ← certification standard
  Qualifier: Wagyu          ← breed (borderline — see 1.4)
  Qualifier: Lean           ← fat content descriptor

Canonical Food: Olive Oil
  Qualifier: Extra Virgin   ← production grade (but see 1.3 — currently canonical)
  Qualifier: Cold-pressed   ← processing method
  Qualifier: Organic        ← certification standard

Canonical Food: Yoghurt
  Qualifier: Greek          ← style/process (strained) (borderline — see 1.4)
  Qualifier: Natural        ← flavour/additive status
  Qualifier: Organic        ← certification standard
  Qualifier: Full fat       ← fat content descriptor
  Qualifier: Low fat        ← fat content descriptor
```

### 1.2 Editorial rules — what IS a Qualifier?

Use all three tests. A term must pass all three to qualify.

**Test Q1 — Same Food?**
Would a nutritionist, supermarket buyer, and home cook all agree this is fundamentally
the same food? If yes, proceed.
- Grass-fed beef ↔ standard beef → YES (both are beef)
- Wild salmon ↔ farmed salmon → YES (both are salmon)
- Greek yoghurt ↔ natural yoghurt → MAYBE (see 1.4)
- Wagyu ↔ standard beef → MOSTLY (Wagyu is a breed, but culturally treated as a distinct product)

**Test Q2 — Does the qualifier signal a sourcing or production choice?**
Is the distinguishing factor HOW it was raised, certified, or graded — rather than what
cultivar/variety it is, or how it was cooked?
- Organic → YES (certification)
- Grass-fed → YES (farming method)
- Extra virgin → YES (production grade/process)
- Cherry tomato → NO (cultivar — that is a Variety)
- Smoked → BORDERLINE (processing method, but see 1.4)

**Test Q3 — Is there a nutritional or trust signal worth communicating?**
Does the choice between qualifiers carry meaningful nutritional or sourcing information
that THA should communicate to a user? If the answer is "not really", it is a Form
(`aliasType: form`) and should be folded into aliases.
- Wild vs farmed salmon → YES (omega-3 profiles, environmental context)
- Organic → YES (production standard users actively choose for)
- Extra virgin → YES (polyphenol retention, processing difference)
- Lean beef vs standard beef → YES (fat content is nutritionally meaningful)
- "Fresh" salmon → NO (this is a Form — matches the existing STRIP_WORDS list)

### 1.3 Qualifiers vs Varieties vs Attributes vs Preparations

The WS1.5 spike established five classification rules (A=Alias, B=Variety, C=Form,
D=Separate Food, E=Composite). Qualifiers are a **sixth**, not covered by those rules.

| Concept | Test | DB home today | Example |
|---|---|---|---|
| **Alias** | Same food, different words | `canonical_food_alias` | `EVOO` → `extra-virgin-olive-oil` |
| **Variety** | Same species, named cultivar/sub-kind worth tracking | `food_variety` | Cherry Tomato, Cavolo Nero |
| **Form** | Same food/variety, different physical state | `aliasType: 'form'` | Frozen spinach, tinned tomatoes |
| **Preparation** | How it was cooked in the kitchen | No DB home yet | Roasted, steamed, raw |
| **Attribute** | A nutritional property of the food itself | `knowledgeFoodNutrients` | High in fibre, source of omega-3 |
| **Qualifier** | How it was sourced, raised, or graded before the kitchen | **No DB home yet** | Grass-fed, organic, extra virgin, wild |

The key distinctions:

**Qualifier vs Variety:**
A Variety is a *biological* sub-kind (cherry tomato is a different cultivar to plum tomato).
A Qualifier is a *commercial/production* signal layered on top of one food (grass-fed beef
is still beef, sourced differently). Varieties answer "what type of food is this?" —
Qualifiers answer "how was this food produced?".

**Qualifier vs Attribute:**
An Attribute is an intrinsic nutritional property (salmon is high in omega-3). A Qualifier
explains *which version* of the food has more or less of that attribute (wild salmon
typically has a different omega-3 profile to farmed). Attributes live in `knowledgeFoodNutrients`.
Qualifiers are the layer that explains *why one version is better* for that attribute.

**Qualifier vs Preparation:**
A Preparation describes what happened in the kitchen (roasted, steamed, poached). A Qualifier
describes what happened before the kitchen (how the animal was raised, how the oil was pressed).
Preparations are meal-construction metadata. Qualifiers are buying-decision metadata.

**Qualifier vs Form:**
A Form is a physical state change (dried, frozen, tinned). A Qualifier is a sourcing or
grade descriptor. Both apply before the kitchen, but a form changes the food's state;
a qualifier describes its provenance. Borderline cases exist (smoked salmon — see 1.4).

### 1.4 Hard classification decisions — borderline cases

These are the cases that look like qualifiers but require an explicit editorial ruling.

**Case A: Extra Virgin Olive Oil**

*Current state:* `extra-virgin-olive-oil` is the **canonical food** in WS2A. "Olive oil" is
an alias pointing TO it. This is the correct call: EVOO is sufficiently distinct in nutrition
profile (polyphenol content, minimal processing) that it warrants canonical identity. Refined
olive oil would be a separate canonical food (`refined-olive-oil`) rather than a qualifier on
a shared parent.

*Ruling:* NOT a qualifier. EVOO is the canonical food. "Cold-pressed" IS a qualifier on EVOO.
"Organic" IS a qualifier on EVOO (same food, additional certification). "Refined olive oil" is
a separate canonical food.

**Case B: Smoked Salmon**

*Current state:* `smoked` appears in `knowledge/foods.ts` as a commonForm of `salmon`. The
variety stripper (`STRIP_WORDS`) does not strip "smoked". `ingredient-aliases.ts` does not have
a smoked → salmon mapping.

*Ruling:* Smoked salmon sits in a grey area. For food identity purposes (Nutrition Report, Plant
Diversity) it should resolve to the `salmon` canonical food — smoked is a processing method
applied post-catch. For Analyser and Shopping, however, "smoked salmon" has a distinct retail
identity, different nutritional profile (higher sodium, often cured), and different health
considerations. *Recommended treatment:* Form (`aliasType: 'form'`) for identity purposes, but
with a Qualifier flag (`isProcessed: true`) that the Analyser can use to surface sodium/curing
context. The distinction between wild-smoked and farmed-smoked is a Qualifier stack.

**Case C: Greek Yoghurt**

*Ruling:* Greek yoghurt is a processing *style* (strained to remove whey) that produces a
nutritionally distinct product (higher protein, lower lactose, thicker texture). It is best
classified as a `food_variety` of `yoghurt` rather than a qualifier. The distinction is more
significant than "full fat vs low fat". However, the full fat / low fat and organic modifiers
applied TO Greek yoghurt are qualifiers.

**Case D: Wagyu Beef**

*Ruling:* Wagyu is a cattle breed, which makes it closer to a Variety than a Qualifier. It also
carries strong marketing connotations and a distinct price/luxury positioning. Recommended
treatment: `food_variety` of `beef` for identity; qualifiers (`organic`, `grass-fed`) remain
applicable on top. The Analyser trust check (Section 7) is especially important here given the
marketing signal strength of "Wagyu".

**Case E: Organic (cross-cutting)**

Organic is a certification standard that applies across many foods (beef, salmon, yoghurt, olive
oil, vegetables). It is the clearest, most consistent Qualifier across the board. It signals:
production standards, absence of certain chemicals, and consumer trust signals — but does NOT
consistently mean "nutritionally superior" in every case (evidence is mixed and food-specific).

*Ruling:* `organic` is a valid Qualifier. Its meaning and health narrative MUST be food-specific.
"Organic olive oil" means certifiably lower pesticide residue; "organic beef" additionally means
higher welfare standards. These are different stories. THA must not generalise.

---

## SECTION 2 — Which foods support Qualifiers?

The table below identifies the launch-priority foods and their qualifiers.

### 2.1 Priority tier A — qualifiers with nutritional signal

| Canonical Food | Qualifier | Signal type | Nutritional relevance |
|---|---|---|---|
| Salmon | Wild | Sourcing | Typically higher omega-3 DHA/EPA than most farmed |
| Salmon | Farmed (standard) | Sourcing | Lower omega-3 on average; varies by feed |
| Salmon | Organic farmed | Certification | Welfare/feed standards; omega-3 varies |
| Beef | Grass-fed | Farming method | Higher CLA and omega-3 vs grain-finished; lower saturated fat |
| Beef | Organic | Certification | No routine antibiotics; welfare standards |
| Beef | Lean | Fat descriptor | Lower total fat, calories; varies by cut |
| Extra Virgin Olive Oil | Cold-pressed | Processing | Confirms minimal processing; overlaps with EVOO by definition |
| Extra Virgin Olive Oil | Organic | Certification | Pesticide-reduction signal |
| Yoghurt | Organic | Certification | Feed and welfare standards for dairy herd |
| Yoghurt | Full fat | Fat descriptor | Higher fat-soluble vitamin absorption context |
| Yoghurt | Low fat | Fat descriptor | Often higher sugar; context required |

### 2.2 Priority tier B — qualifiers with trust/context signal

| Canonical Food | Qualifier | Signal type | Why it matters to THA |
|---|---|---|---|
| Beef | Wagyu | Breed/variety | Luxury marketing, high fat — context required |
| Salmon | Smoked | Processing | High sodium; curing method context |
| Eggs | Free range | Welfare standard | Consumer preference signal |
| Eggs | Organic | Certification | Feed + welfare |
| Milk | Organic | Certification | Feed standards |
| Milk | Full fat | Fat descriptor | Nutrient context |
| Chicken | Free range | Welfare standard | Consumer preference signal |
| Chicken | Organic | Certification | Feed + welfare |

### 2.3 Foods where qualifiers are NOT appropriate (for now)

| Canonical Food | Reason |
|---|---|
| Tomato | Variety (cherry/plum) is more relevant than sourcing qualifier |
| Spinach | "Organic spinach" is a valid qualifier but THA has no spinach-specific story yet |
| Almonds | Roasted vs raw is a Form, not a qualifier |
| Chickpeas | Tinned vs dried is a Form; no sourcing qualifier signal warranted |

---

## SECTION 3 — Supermarket integration

Qualifiers give the Shopping surface a richer signal for product recommendation.

### 3.1 Qualifier-guided product suggestion model

When a user adds a food to their shopping list, THA could present a brief qualifier panel:

```
Beef
  ✓ Grass-fed           ← Recommended
  ✓ Lean cut            ← Alternative
  ○ Wagyu               ← Occasional treat
  ○ Premium wagyu       ← Out of scope / not THA-relevant

Olive Oil
  ✓ Extra Virgin (EVOO) ← Recommended (canonical default)
  ○ Refined blends      ← Not recommended (no note needed — just don't surface)

Salmon
  ✓ Wild                ← Recommended (where budget allows)
  ✓ Organic farmed      ← Good alternative
  ○ Standard farmed     ← Baseline
  ○ Smoked              ← Separate use case (different nutrition story)

Yoghurt
  ✓ Full fat natural    ← Recommended
  ✓ Greek               ← High protein — good alternative
  ✓ Organic             ← Certification preference
  ○ Low fat flavoured   ← Not recommended (higher sugar usually)
```

### 3.2 Integration approach

The qualifier panel does NOT need to be implemented as a separate database concept at first.
The same effect is achievable via:

1. **Pantry knowledge `howToChoose` extension** (already exists in `client/src/lib/pantry-knowledge.ts`):
   The `howToChoose` array already carries qualifier-like buying guidance for olive oil
   ("Extra virgin (EVOO) over refined varieties"). Extending this for beef, salmon, yoghurt
   is a content edit, not a schema change.

2. **Apple Score trust integration**: Products resolved as `PRODUCT_RESOLVED` or
   `WHOLE_FOOD_TRUSTED` could carry a qualifier tag from barcode scan or product canonical
   match. The qualifier then informs the Apple Score context, not the score itself.

3. **Future: `food_qualifier` table** with `canonicalFoodId`, `slug`, `label`,
   `recommendationTier` (preferred / alternative / occasional / avoid), `rationale`, `source`.
   This enables the Shopping surface to show "why THA recommends grass-fed" with one query.

### 3.3 What supermarkets need from Qualifiers

| Supermarket need | Qualifier answer |
|---|---|
| "Which version of this food should I buy?" | Recommendation tier (preferred / alternative / occasional) |
| "Why is EVOO better than blended olive oil?" | Rationale string from qualifier knowledge |
| "Does THA have a preference between wild and farmed salmon?" | Yes — qualifier tier and rationale |
| "What does organic mean for THIS food?" | Food-specific qualifier description (not generic) |

---

## SECTION 4 — Analyser integration

The Analyser is the natural home for Qualifier explanations. When a user scans or searches a
specific product (e.g. "Waitrose Scottish Farmed Salmon fillet"), the Analyser can surface:

### 4.1 Qualifier explanation pattern

```
Extra Virgin Olive Oil — Bertolli

Why this choice?
• Extra virgin is the least processed form of olive oil
• Cold-pressing retains more natural plant compounds (polyphenols)
• Associated with Mediterranean-style eating patterns in observational studies

Qualifier in context:
  ✓ Extra Virgin     ← This product
  ○ Refined / Light  ← Less preferred
```

```
Wild Alaskan Salmon — Waitrose

Why wild?
• Wild-caught salmon typically has a different omega-3 profile to farmed
• Diet is naturally diverse (krill, smaller fish) vs controlled feed
• Environmental context varies by fishery certification (look for MSC label)

Qualifier in context:
  ✓ Wild             ← This product (where budget allows)
  ✓ Organic farmed   ← Good alternative
  ○ Standard farmed  ← Baseline — still a good source of oily fish
```

### 4.2 Analyser integration model

The `buildFoodReport()` adapter (WS2F) currently returns:

```ts
FoodReportKnowledge {
  overview: { name, category, description }
  keyNutrients: string[]
  healthBenefits: string[]
  nutritionContext: string[]
  varieties: VarietyKnowledge[]
}
```

Qualifiers would extend this with:

```ts
FoodReportKnowledge {
  ...existing,
  qualifiers?: QualifierKnowledge[]   // SUGGESTION — not implemented
}

QualifierKnowledge {
  slug: string                         // 'wild', 'grass-fed', 'extra-virgin'
  label: string                        // 'Wild'
  recommendationTier: 'preferred' | 'alternative' | 'baseline' | 'avoid'
  rationale: string[]                  // why THA recommends/notes this qualifier
  thisProductHasIt: boolean            // resolved from barcode/product scan
}
```

This is additive to the existing adapter. It does not change Food Report for foods with no
qualifiers (null guard already in place in FoodReport.tsx).

---

## SECTION 5 — Healthier Alternatives integration

Qualifiers enable a cleaner Healthier Alternatives model than the current one-level swap.

### 5.1 Three-level qualifier ladder

The WS2C model considered Healthier Alternatives as a food-to-food upgrade path:

```
White bread → Wholemeal bread → Sourdough
Standard yoghurt → Greek yoghurt → Kefir
```

Qualifiers add a within-food upgrade path that sits BELOW food-to-food swaps:

```
Standard farmed salmon → Organic farmed salmon → Wild salmon
[Level 0: baseline]       [Level 1: qualifier]    [Level 2: qualifier+]

Standard beef → Lean beef → Grass-fed beef → Organic grass-fed beef
[Level 0]       [Level 1]   [Level 2]        [Level 3]
```

### 5.2 Interaction with current uplift-rules.ts

The existing `uplift-rules.ts` (e.g. "mac-cheese-wholemeal-swap") handles food-to-food
swaps (pasta → wholemeal pasta). Qualifier-based uplifts would be a different pattern:
same food, better sourcing version.

```
// SUGGESTION — future uplift rule shape
{
  id: 'salmon-wild-qualifier',
  trigger: { ingredientPattern: ['salmon', 'salmon fillet'] },
  suggestions: [{
    qualifier: 'wild',
    action: 'qualifier-prefer',
    why: 'Wild salmon typically has a different fatty acid profile to farmed.',
    budgetNote: 'Where budget allows — farmed salmon is still an excellent oily fish choice.',
  }]
}
```

This is NOT a swap (do not suggest "buy wild instead of farmed" as a hard rule — it is a
preference, not a requirement). The budget note is essential — Wagyu beef and wild salmon
are premium products that most households cannot buy weekly.

### 5.3 Qualifier ladders: current examples

**Yoghurt:**
```
Flavoured low-fat yoghurt  →  Natural yoghurt  →  Greek yoghurt  →  Kefir
[No qualifier guidance]       [plain qualifier]    [Greek variety]   [fermented food]
```

**Olive oil:**
```
Vegetable oil  →  Olive oil  →  Extra Virgin Olive Oil (already canonical)
[different food]  [alias of EVOO]  [canonical — no qualifier needed above this]
```

**Beef:**
```
Standard beef  →  Lean beef  →  Grass-fed lean beef
[baseline]        [qualifier]    [two qualifiers]
```

---

## SECTION 6 — Where should Qualifiers appear?

| Surface | Qualifier presence | How |
|---|---|---|
| **Analyser** | ✅ Yes — primary home | Qualifier explanation section in FoodReport; "why this choice" context when product is resolved |
| **Shopping** | ✅ Yes — buying guidance | `howToChoose` extension in pantry knowledge; future qualifier recommendation tier in product list |
| **Pantry** | ✅ Yes — knowledge context | Already partially present (`howToChoose` in `PANTRY_KNOWLEDGE`); extend with qualifier rationale |
| **Nutrition Report** | ⚠️ Cautiously | Qualifier label may appear in ingredient name (user typed "grass-fed beef"); the report should display it as-is but the canonical identity resolves to `beef`. A future "Qualifier Insights" section is a SUGGESTION. |
| **Planner (recipes)** | ❌ No — not in recipe ingredients | Recipes should specify `beef`, not `grass-fed beef`. Qualifier guidance lives at the shopping/buying layer, not the cooking layer. Adding "grass-fed" to recipe ingredients would make meals fail ingredient matching for households that buy standard beef. |
| **Pantry stock / inventory** | ⚠️ Optional — user-authored | If a user adds "organic salmon" to their pantry, the canonical food resolves to `salmon`; the qualifier is preserved as display metadata only. No counting change. |

### 6.1 Planner recipes — why Qualifiers do NOT belong here

Qualifiers are buying choices. A recipe that says "500g grass-fed beef mince" is making a
buying decision on behalf of the user. THA recipes should specify the canonical food. The
qualifier guidance happens at the Shopping / Analyser layer when the user goes to buy the
ingredient. This matches how THA already handles variety: recipes say "beef", not "Aberdeen
Angus grass-fed beef"; the Variety system surfaces "Broaden Your Variety" separately.

### 6.2 Nutrition Report — treatment

In the Nutrition Report (WS3A), ingredient rows resolve to canonical foods. If a user's
meal says "wild salmon", the Nutrition Report row shows "Salmon" (canonical), with the
qualifier preserved as display context in the ingredient name column. No new counting category.
The qualifier does NOT affect the plant count or the macro section. A future "Sourcing Highlights"
sub-section of the Nutrition Report (e.g. "This week your household ate wild salmon") is a
SUGGESTION for a later workstream.

---

## SECTION 7 — Trust check — Qualifiers as marketing claims

This section is a mandatory editorial guardrail before any Qualifier surfaces to users.

### 7.1 Risk categories

| Qualifier | Risk level | Risk description |
|---|---|---|
| Wagyu | ⚠️ HIGH | Strong marketing premium; health benefit (if any) is marginal vs ordinary grass-fed. Users may assume THA endorses spending premium on Wagyu for health reasons. |
| Organic | ⚠️ MEDIUM | Evidence for nutritional superiority over non-organic is mixed and food-specific. Some research shows marginal differences; others show none. Must not be presented as "healthier" generically. |
| Grass-fed | ⚠️ MEDIUM | Omega-3 and CLA differences are real but often modest in practice (cooking methods, cut variation). Grass-fed is a meaningful signal, not a dramatic health claim. |
| Extra Virgin | ✅ LOW | The polyphenol and processing story is well-supported. EVOO vs refined olive oil is a clear, defensible distinction. |
| Wild salmon | ✅ LOW-MEDIUM | The omega-3 difference is real but variable by season and fishery. MSC certification is a better proxy for sustainability than wild vs farmed alone. |
| Free range | ✅ LOW | Welfare standard, not primarily a health claim. Present as a consumer preference signal. |

### 7.2 Required evidence standards for each qualifier

Before THA surfaces a Qualifier to users, editorial must confirm:

1. **Source:** Published nutrition or food science literature, regulatory definitions (e.g. EU
   definitions of organic certification), or established industry standards (e.g. EVOO is
   defined by IOC standards with measurable acidity/polyphenol thresholds).

2. **Language guard:** No qualifier rationale may use the words: cures, prevents, guarantees,
   reverses, heals, superior, miracle, clinically proven. This mirrors the existing uplift-rules
   language guard.

3. **Food-specificity:** Organic does not have one story. Organic olive oil, organic beef, and
   organic yoghurt each have their own rationale. Generic claims ("organic is better") are
   prohibited.

4. **Budget awareness:** Any qualifier that implies a premium product (Wagyu, wild salmon,
   organic) MUST include budget context: "where budget allows" or "a good alternative if
   [qualifier] isn't available".

### 7.3 How THA should explain the primary examples

**Wagyu:**
> "Wagyu is a breed of cattle known for its marbled fat. It is often priced at a premium for
> its texture and flavour. For everyday cooking, grass-fed beef provides similar sourcing
> benefits at a more accessible price point."

**Organic:**
> "Organic certification covers farming standards including restrictions on routine antibiotic
> use and certain pesticides. The nutritional difference between organic and non-organic versions
> varies by food and is modest in most studies. Organic is a consumer preference and welfare
> choice as much as a nutritional one."

**Grass-fed:**
> "Grass-fed cattle typically have a slightly different fat profile to grain-finished cattle,
> including higher levels of conjugated linoleic acid. The practical difference in a balanced
> diet is modest, but it is a meaningful sourcing choice where available."

**Extra Virgin:**
> "Extra virgin olive oil is the least processed form, cold-pressed with no use of heat or
> solvents. It retains more of the natural plant compounds (polyphenols) found in olives.
> This is the version associated with Mediterranean-style eating patterns."

---

## SECTION 8 — Relationship to existing architecture

### 8.1 Where Qualifiers fit in the current data model

```
DiversityGroup
  └─ CanonicalFood                    e.g. "salmon", "beef"
       ├─ FoodVariety                 e.g. "Greek yoghurt" (see 1.4 Case C)
       ├─ CanonicalFoodAlias          e.g. "salmon fillet" → salmon
       │    └─ aliasType: form        e.g. "smoked salmon" (identity collapses)
       └─ [NEW] FoodQualifier         e.g. "wild", "grass-fed", "organic"
            ├─ slug: "wild"
            ├─ label: "Wild"
            ├─ recommendationTier: "preferred"
            ├─ rationale: string[]
            └─ budgetNote: string?
```

The `FoodQualifier` table would have a many-to-many relationship with `CanonicalFood`
(one qualifier like "organic" applies to many foods; one food like salmon has multiple
qualifiers). A junction table `food_qualifier_canonical` would carry the food-specific
`recommendationTier` and `rationale`.

**This is a SUGGESTION — not an implementation plan.**

### 8.2 How Qualifiers interact with existing systems

| Existing system | Qualifier interaction |
|---|---|
| `ingredient-aliases.ts` STRIP_WORDS | "organic" is already in STRIP_WORDS — stripped during variety resolution. Correct: qualifier does not change canonical food identity. |
| `variety.ts` stripQuantityAndPrep | "fresh", "dried", "frozen", "organic" are already stripped. Qualifiers should remain strip-eligible for identity resolution. |
| `canonical_food_alias` aliasType:'form' | "smoked salmon" → treated as a form alias. Qualifier metadata (`isProcessed: true`) could be added as a flag. |
| `knowledgeFoodNutrients` | Qualifiers reference nutrients indirectly (wild salmon → omega-3); they do not replace nutrient associations. |
| `PANTRY_KNOWLEDGE.howToChoose` | Already carries qualifier guidance in prose form. Structured qualifiers would make this machine-readable. |
| `FoodReportKnowledgeAdapter` | Would be extended with a `qualifiers` section when the `food_qualifier` table exists. Currently null-safe. |
| `apple-score-trust.ts` | Apple Score rates products, not qualifiers. A product resolved as `PRODUCT_RESOLVED` with a grass-fed label would carry its qualifier through barcode/product data, not from THA editorial. |
| `uplift-rules.ts` | Qualifier-based suggestions would be a new `action: 'qualifier-prefer'` type alongside existing `add` and `swap`. |

### 8.3 The "Extra Virgin Olive Oil is already canonical" tension

The current canonical seed makes `extra-virgin-olive-oil` the canonical food with "olive oil"
as an alias pointing to it. This is the right decision architecturally (EVOO is the version
THA recommends; "olive oil" in a recipe is assumed to mean EVOO). However it means:

- "Cold-pressed" applied to EVOO is a qualifier ON the EVOO canonical food
- "Organic EVOO" is EVOO + qualifier
- "Refined olive oil" is a DIFFERENT canonical food, not a qualifier on EVOO
- "Light olive oil" is a DIFFERENT canonical food, not a qualifier on EVOO

This is consistent and defensible. The existing architecture pre-emptively resolved the main
Qualifier question for olive oil by making the highest-quality form canonical.

---

## SECTION 9 — Risks

| Risk | Severity | Mitigation |
|---|---|---|
| R1: Qualifiers become marketing endorsements | HIGH | Editorial language guard; food-specific rationale only; mandatory budget notes for premium qualifiers |
| R2: Identity inflation — too many canonical foods for qualifier variants | HIGH | Qualifiers MUST NOT become canonical foods. Grass-fed beef is NOT a new food; it is beef with a qualifier. The WS2A identity spine must not fork. |
| R3: Recipe ingredient specificity creep | MEDIUM | Hard rule: no Qualifier language in recipe ingredients. Qualifiers live at the buying layer only. |
| R4: Organic over-promise | MEDIUM | Food-specific organic rationale only; no generic "organic is healthier" claim |
| R5: Wagyu positioning confusion | MEDIUM | Position as "occasional treat" or "a flavour/culture choice" — not a health choice |
| R6: User confusion: Qualifier vs Variety | LOW-MEDIUM | Internal editorial rule; users only see labels and rationale, not the classification system |
| R7: Data maintenance — qualifiers go stale | LOW | Qualifier content should be editorial-reviewed annually; `source` and `reviewedAt` fields mandatory |
| R8: Performance — qualifier lookups add latency | LOW | Qualifiers are read at Analyser/FoodReport time (user-initiated), not in the hot meal-counting path |

---

## SECTION 10 — Recommendations

### 10.1 Short-term (now, without schema changes)

1. **Extend `PANTRY_KNOWLEDGE.howToChoose`** for salmon, beef, and yoghurt with
   qualifier-style buying guidance (prose). This is a content change only — no schema.

2. **Extend `NUTRITION_CONTEXT`** (WS2F) with qualifier-informed context lines for
   salmon and beef canonical foods. e.g. for salmon:
   > "Wild-caught salmon typically has a different omega-3 profile to farmed.
   > Both are excellent sources of oily fish."

3. **Document the "EVOO is canonical" decision** in a canonical foods amendment so
   future editors know not to add "refined olive oil" as a qualifier on EVOO.

### 10.2 Medium-term (next investigation, before schema changes)

4. **Commission a WS4 Qualifier Architecture** investigation to define the full
   `food_qualifier` table schema, the junction table, and the `recommendationTier` taxonomy.

5. **Define editorial qualification workflow** — who authors qualifiers, what evidence standard
   is required, and who reviews them before they surface.

6. **Decide the Smoked Salmon question** formally: form (aliases to salmon) or qualifier
   (stays distinct with sodium/curing context). Recommend: Form for identity, Qualifier flag
   for Analyser.

### 10.3 Long-term (implementation — future workstream)

7. **`food_qualifier` table** as described in 8.1, with food-specific rationale and
   recommendation tiers.

8. **Analyser FoodReport extension** — `buildFoodReport()` adapter extended with
   `qualifiers` section, null-safe, showing recommendation tier and rationale.

9. **Shopping qualifier panel** — when user adds a food to the shopping list, surface
   the top-1 or top-2 qualifier recommendations (e.g. "Looking for salmon? Wild or organic
   farmed is worth choosing where available").

10. **Qualifier-based Uplift rule type** — `action: 'qualifier-prefer'` alongside
    existing `add` and `swap`, with mandatory `budgetNote`.

---

## SUGGESTION

Items below are future possibilities flagged during this investigation. They are outside the
current scope and require their own investigation before any commitment.

- **SUGGESTION:** A "Sourcing Highlights" sub-section in Nutrition Report: "This week your
  household ate wild salmon and grass-fed beef" — recognised from ingredient strings that
  contain qualifier words.

- **SUGGESTION:** Qualifier display in Planner Meal Picker: when a meal ingredient is `beef`,
  show a "Choose grass-fed where available" tip in the ingredient detail. Does NOT change the
  ingredient in the recipe.

- **SUGGESTION:** User preference for qualifiers ("I always buy organic") stored in profile,
  used to filter Shopping recommendations.

- **SUGGESTION:** Cross-qualifier deduplication rule: if a food has both an "organic" qualifier
  AND a "grass-fed" qualifier selected, the shopping guidance should show "organic grass-fed"
  as a combined recommendation, not two separate items.

- **SUGGESTION:** Qualifier-aware barcode scanning: when a scanned product barcode resolves to
  a grass-fed beef product, the Analyser shows the qualifier tier and rationale automatically.
  Currently Apple Score trust (`apple-score-trust.ts`) handles the product identity layer;
  qualifiers would add an educational layer on top.

- **SUGGESTION:** A "Qualifier Glossary" page — an educational resource explaining what each
  qualifier means and what evidence THA uses to assess it. Prevents individual surfaces from
  needing to carry full explanations.

---

## DEFINITION OF DONE — Investigation

| Criterion | Status |
|---|---|
| Qualifiers clearly defined | ✅ Section 1 |
| Distinction from Variety agreed | ✅ Section 1.3 |
| Distinction from Form agreed | ✅ Section 1.3 |
| Distinction from Attribute agreed | ✅ Section 1.3 |
| Borderline cases ruled on | ✅ Section 1.4 |
| Foods supporting qualifiers identified | ✅ Section 2 |
| Supermarket integration considered | ✅ Section 3 |
| Analyser integration considered | ✅ Section 4 |
| Healthier Alternatives considered | ✅ Section 5 |
| Surface-by-surface presence ruled | ✅ Section 6 |
| Planner exclusion ruled and explained | ✅ Section 6.1 |
| Nutrition Report treatment ruled | ✅ Section 6.2 |
| Trust / marketing claim risk addressed | ✅ Section 7 |
| Evidence standards defined | ✅ Section 7.2 |
| Per-qualifier trust language provided | ✅ Section 7.3 |
| Relationship to existing architecture mapped | ✅ Section 8 |
| Risks catalogued | ✅ Section 9 |
| Recommendations given | ✅ Section 10 |
| No schema changes made | ✅ Confirmed |
| No UI changes made | ✅ Confirmed |
| No recipe changes made | ✅ Confirmed |
