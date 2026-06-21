# WS0.6 — Claude Food Authoring Trial

## Status

**COMPLETE — VALIDATORS PASS**

Both validators passed with zero errors after seeding:
- `test:knowledge-registry` — 23/23 ✓
- `test:canonical-food` — 46/46 ✓

---

## Rollback Protection

Performed before any implementation:

1. **WS0.5 protected**: committed to branch as `e371af0`
2. **Rollback tag created**: `ws0.6-rollback-20260621-0519`
3. **Git status confirmed clean** before implementation began

To restore to pre-trial state:
```
git checkout ws0.6-rollback-20260621-0519
```

---

## Category Selection

**Chosen: Mediterranean Vegetables (Option A)**

### Rationale

| Factor | Mediterranean Vegetables | Herbs & Spices |
|--------|--------------------------|----------------|
| Existing canonical coverage | 0 of 25 existed in canonical layer | 9 already existed (basil, parsley, coriander, mint, cumin, turmeric, cinnamon, ginger, paprika) |
| Knowledge layer links | 7 already have knowledge entries to link to | Most would need new knowledge entries anyway |
| Variety exercise | Rich (pepper colours, kale cultivars, broccoli types) | Minimal (fresh/dried are the main variants) |
| Alias exercise | High (UK vs US names, regional terms, form variants) | Moderate (common_name, form) |
| Seasonality variety | High (spring/summer/autumn/winter across the set) | Low (most spices are year-round) |
| Benefit variety | High (12+ different benefit combinations) | Moderate |
| THA philosophy | Core of Mediterranean diet | Supporting flavour layer |

Herbs and Spices extending the existing 9 canonical entries would be an incremental exercise. Mediterranean Vegetables offered a genuine full-pipeline test: new diversity groups, new canonical foods, new knowledge foods, new relationships, and real cross-system linkage.

---

## Files Modified

| File | Change |
|------|--------|
| `shared/canonical/diversity-groups.ts` | +25 diversity groups (Mediterranean vegetables) |
| `shared/canonical/foods.ts` | +25 canonical food entries |
| `shared/knowledge/foods.ts` | +18 knowledge food entries |
| `shared/knowledge/relationships.ts` | +18 FOOD_NUTRIENTS entries, +18 FOOD_BENEFITS entries |

Seed counts before → after:
- Diversity groups: 27 → 52
- Canonical foods: 28 → 53
- Food varieties: 16 → 24
- Canonical aliases: 69 → 143
- Knowledge foods: 51 → 69
- Food→nutrient links: 165 → 232
- Food→benefit links: 137 → 192

---

## 25 Proposed Foods

### Category mapping

Seven foods had **existing knowledge entries** and needed only canonical + diversity group entries:
`kale`, `beetroot`, `carrots`, `garlic`, `onion`, `broccoli`, `red-pepper` (linked via `pepper` variety)

Eighteen foods needed **new knowledge entries + relationships**:
`watercress`, `rocket`, `parsnip`, `turnip`, `swede`, `red-cabbage`, `pak-choi`, `spring-onion`, `aubergine`, `courgette`, `cucumber`, `fennel`, `celery`, `asparagus`, `artichoke`, `broad-beans`, `radicchio`, `chicory`

---

### Food 1 — Kale

**Canonical**
- slug: `kale` | name: Kale | category: Vegetables | subcategory: Leafy greens
- description: "A hardy leafy green; curly kale and cavolo nero are cultivars of the same plant."
- diversityGroupSlug: `kale` | knowledgeFoodSlug: `kale`
- varieties: `curly-kale` (Curly Kale), `cavolo-nero` (Cavolo Nero)
- aliases: `black kale` (common_name), `Tuscan kale` (common_name), `kale leaves` (form)

**Knowledge** — existing entry `kale` linked; no new knowledge food created.

**Relationships** — existing: `vitamin-k, vitamin-c, sulforaphane, beta-carotene` → `bone-health, eye-health, anti-inflammatory-support, healthy-ageing`

**UNCERTAINTY FLAGS**
- Cavolo nero as variety vs separate food: cavolo nero (Tuscan kale) is botanically the same species as curly kale (Brassica oleracea var. sabellica) but looks very different to users. Editorial decision: treat as variety. Defensible for plant diversity counting. Could be revisited if THA wants to give it a separate food report.

---

### Food 2 — Watercress

**Canonical**
- slug: `watercress` | name: Watercress | category: Vegetables | subcategory: Leafy greens
- diversityGroupSlug: `watercress` | knowledgeFoodSlug: `watercress`
- aliases: `water cress` (misspelling)

**Knowledge**
- description: "A peppery aquatic leafy green rich in vitamin K, vitamin C and beta-carotene."
- commonForms: fresh, bagged, in soups, in salads
- storageGuidance: Refrigerate in a sealed bag; use within a few days.
- seasonality: Year-round (peak: spring to autumn)

**Relationships**
- Nutrients: `vitamin-k`, `vitamin-c`, `beta-carotene`, `calcium`
- Benefits: `immune-support`, `bone-health`, `eye-health`, `anti-inflammatory-support`

**UNCERTAINTY FLAGS**
- None. Watercress is nutritionally well-established, aliases are straightforward.

---

### Food 3 — Rocket

**Canonical**
- slug: `rocket` | name: Rocket | category: Vegetables | subcategory: Leafy greens
- diversityGroupSlug: `rocket` | knowledgeFoodSlug: `rocket`
- aliases: `arugula` (common_name), `roquette` (common_name), `rocket leaves` (form)

**Knowledge**
- description: "A peppery salad leaf supplying vitamin K and folate, with a distinctive bittersweet flavour."
- commonForms: fresh, bagged, in salads, with pasta
- storageGuidance: Refrigerate in the bag; best eaten within a day or two.
- seasonality: Year-round (peak: spring and autumn)

**Relationships**
- Nutrients: `vitamin-k`, `folate`, `vitamin-c`, `calcium`
- Benefits: `bone-health`, `anti-inflammatory-support`, `immune-support`

**UNCERTAINTY FLAGS**
- Rocket is a brassica (Eruca sativa) and does contain glucosinolates. `sulforaphane` nutrient description says "formed in brassicas such as broccoli and kale" — conservative decision: omitted sulforaphane here and kept to well-established nutrients only.

---

### Food 4 — Beetroot

**Canonical**
- slug: `beetroot` | name: Beetroot | category: Vegetables | subcategory: Root vegetables
- diversityGroupSlug: `beetroot` | knowledgeFoodSlug: `beetroot`
- aliases: `beet` (common_name), `beets` (common_name), `raw beetroot` (form), `cooked beetroot` (form)

**Knowledge** — existing entry `beetroot` linked.

**Relationships** — existing: `nitrates, folate, anthocyanins` → `heart-health, energy-support`

**UNCERTAINTY FLAGS**
- Varieties omitted: golden beetroot and candy stripe (Chioggia) beet are real cultivars but very similar nutritionally. Decision: no varieties for now. Flag for THA review — they may want golden beetroot as a visible variety.

---

### Food 5 — Carrots

**Canonical**
- slug: `carrots` | name: Carrots | category: Vegetables | subcategory: Root vegetables
- diversityGroupSlug: `carrots` | knowledgeFoodSlug: `carrots`
- aliases: `carrot` (singular), `baby carrots` (form), `grated carrot` (form)

**Knowledge** — existing entry `carrots` linked.

**Relationships** — existing: `beta-carotene, vitamin-a, fibre` → `eye-health, skin-health, immune-support`

**UNCERTAINTY FLAGS**
- Naming convention: knowledge food uses plural "Carrots" as slug; canonical uses same for consistency. Singular "carrot" is an alias.

---

### Food 6 — Parsnip

**Canonical**
- slug: `parsnip` | name: Parsnip | category: Vegetables | subcategory: Root vegetables
- diversityGroupSlug: `parsnip` | knowledgeFoodSlug: `parsnip`
- aliases: `parsnips` (plural)

**Knowledge**
- description: "A sweet, cream-coloured root high in fibre and folate, traditionally roasted or used in warming soups."
- commonForms: whole, roasted, mashed, in soups
- storageGuidance: Refrigerate; keeps well for up to two weeks.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `fibre`, `folate`, `potassium`, `vitamin-c`
- Benefits: `gut-health`, `heart-health`, `energy-support`

**UNCERTAINTY FLAGS**
- None.

---

### Food 7 — Turnip

**Canonical**
- slug: `turnip` | name: Turnip | category: Vegetables | subcategory: Root vegetables
- diversityGroupSlug: `turnip` | knowledgeFoodSlug: `turnip`
- aliases: `turnips` (plural)

**Knowledge**
- description: "A crisp brassica root with a mild, slightly peppery flavour, supplying vitamin C and fibre."
- commonForms: whole, diced, roasted, in stews
- storageGuidance: Refrigerate; use within two weeks.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `vitamin-c`, `fibre`, `folate`
- Benefits: `immune-support`, `gut-health`

**UNCERTAINTY FLAGS**
- Only 3 nutrients and 2 benefits: turnip is modestly nutritious compared to other brassicas. Conservative is appropriate here.

---

### Food 8 — Swede

**Canonical**
- slug: `swede` | name: Swede | category: Vegetables | subcategory: Root vegetables
- diversityGroupSlug: `swede` | knowledgeFoodSlug: `swede`
- aliases: `swedes` (plural), `rutabaga` (common_name)

**Knowledge**
- description: "A mild, starchy brassica root with a sweet flavour when roasted, supplying vitamin C, fibre and potassium."
- commonForms: whole, diced, mashed, roasted
- storageGuidance: Keep in a cool, dark place or refrigerate for longer storage.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `vitamin-c`, `fibre`, `potassium`
- Benefits: `immune-support`, `gut-health`, `heart-health`

**UNCERTAINTY FLAGS**
- "Yellow turnip" was omitted from aliases as it's rarely used in UK English and could cause confusion (turnip is already a separate canonical food).

---

### Food 9 — Broccoli

**Canonical**
- slug: `broccoli` | name: Broccoli | category: Vegetables | subcategory: Brassicas
- diversityGroupSlug: `broccoli` | knowledgeFoodSlug: `broccoli`
- varieties: `calabrese-broccoli` (Calabrese Broccoli), `purple-sprouting-broccoli` (Purple Sprouting Broccoli)
- aliases: `calabrese` (common_name), `tender stem broccoli` (form), `tenderstem` (form), `frozen broccoli` (form)

**Knowledge** — existing entry `broccoli` linked.

**Relationships** — existing: `vitamin-c, sulforaphane, folate, fibre` → `immune-support, anti-inflammatory-support, healthy-ageing`

**UNCERTAINTY FLAGS**
- Tenderstem broccoli is technically a hybrid of broccoli and kai-lan (Chinese broccoli). Treating it as a form alias is an editorial simplification — it is marketed as broccoli and most users treat it as the same food. Flag for THA: may warrant a variety entry if they want to distinguish it.

---

### Food 10 — Red Cabbage

**Canonical**
- slug: `red-cabbage` | name: Red Cabbage | category: Vegetables | subcategory: Brassicas
- diversityGroupSlug: `red-cabbage` | knowledgeFoodSlug: `red-cabbage`
- aliases: `purple cabbage` (common_name), `pickled red cabbage` (form)

**Knowledge**
- description: "A vivid purple brassica rich in anthocyanins, fibre and vitamin C, excellent eaten raw, pickled or slow-braised."
- commonForms: raw, shredded, pickled, braised
- storageGuidance: Refrigerate; a cut head keeps well for up to a week.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `anthocyanins`, `vitamin-c`, `fibre`, `vitamin-k`
- Benefits: `gut-health`, `anti-inflammatory-support`, `immune-support`, `healthy-ageing`

**UNCERTAINTY FLAGS**
- White cabbage not included: white cabbage is the same species (Brassica oleracea var. capitata) but a different cultivar. Decision: treat red and white as separate foods rather than varieties of "cabbage" because (a) different nutritional profiles (anthocyanins in red only), (b) users treat them as distinct ingredients. This is a meaningful editorial decision — white cabbage should be added separately in a future authoring run.

---

### Food 11 — Pak Choi

**Canonical**
- slug: `pak-choi` | name: Pak Choi | category: Vegetables | subcategory: Brassicas
- diversityGroupSlug: `pak-choi` | knowledgeFoodSlug: `pak-choi`
- aliases: `bok choy` (common_name), `bok choi` (common_name), `pak choy` (misspelling), `baby pak choi` (form)

**Knowledge**
- description: "A mild Chinese brassica with crisp stems and leafy tops, supplying vitamin K, vitamin C and calcium."
- commonForms: whole, halved, in stir-fries, steamed
- storageGuidance: Refrigerate and use within a few days.
- seasonality: Year-round

**Relationships**
- Nutrients: `vitamin-k`, `vitamin-c`, `beta-carotene`, `calcium`
- Benefits: `bone-health`, `immune-support`, `eye-health`

**UNCERTAINTY FLAGS**
- None. Bok choy / pak choi spelling variants are well-documented; included all common forms.

---

### Food 12 — Garlic

**Canonical**
- slug: `garlic` | name: Garlic | category: Vegetables | subcategory: Alliums
- diversityGroupSlug: `garlic` | knowledgeFoodSlug: `garlic`
- aliases: `garlic clove` (form), `garlic cloves` (form), `garlic bulb` (form), `crushed garlic` (form), `garlic powder` (form)

**Knowledge** — existing entry `garlic` linked.

**Relationships** — existing: `allicin, manganese` → `immune-support, heart-health, anti-inflammatory-support`

**UNCERTAINTY FLAGS**
- None. Garlic is a very clean canonical food — all forms (fresh, powder, pre-crushed) are the same plant.

---

### Food 13 — Onion

**Canonical**
- slug: `onion` | name: Onion | category: Vegetables | subcategory: Alliums
- diversityGroupSlug: `onion` | knowledgeFoodSlug: `onion`
- aliases: `onions` (plural), `red onion` (common_name), `brown onion` (common_name), `white onion` (common_name), `yellow onion` (common_name)

**Knowledge** — existing entry `onion` linked.

**Relationships** — existing: `flavonoids, fibre, vitamin-c` → `gut-health, heart-health`

**UNCERTAINTY FLAGS**
- Shallot excluded from aliases: shallot (Allium cepa var. aggregatum) is the same species as onion and counts as the same plant for diversity, but users know it as a distinct ingredient. Omitted to avoid surprising users — add separately as either an alias or a canonical food in a future run.

---

### Food 14 — Spring Onion

**Canonical**
- slug: `spring-onion` | name: Spring Onion | category: Vegetables | subcategory: Alliums
- diversityGroupSlug: `spring-onion` | knowledgeFoodSlug: `spring-onion`
- aliases: `spring onions` (plural), `scallion` (common_name), `scallions` (common_name), `green onion` (common_name), `salad onion` (common_name)

**Knowledge**
- description: "A slender allium with a mild flavour, eaten whole and rich in vitamin K and vitamin C."
- commonForms: whole, sliced, in salads, in stir-fries
- storageGuidance: Wrap in a damp cloth and refrigerate; use within a week.
- seasonality: Spring to autumn (available year-round in shops)

**Relationships**
- Nutrients: `vitamin-k`, `vitamin-c`, `folate`
- Benefits: `bone-health`, `immune-support`

**UNCERTAINTY FLAGS**
- Spring onion (Allium fistulosum) is a distinct species from common onion (A. cepa), so warranting its own canonical food is biologically correct. Some food systems treat it as an alias of onion — this system correctly keeps them separate.

---

### Food 15 — Aubergine

**Canonical**
- slug: `aubergine` | name: Aubergine | category: Vegetables | subcategory: Fruiting vegetables
- diversityGroupSlug: `aubergine` | knowledgeFoodSlug: `aubergine`
- aliases: `aubergines` (plural), `eggplant` (common_name), `brinjal` (common_name)

**Knowledge**
- description: "A deep-purple nightshade with a meaty texture when cooked, supplying fibre, polyphenols and manganese."
- commonForms: whole, sliced, roasted, in dips
- storageGuidance: Keep at room temperature for short-term; refrigerate once cut.
- seasonality: Late summer to autumn

**Relationships**
- Nutrients: `fibre`, `polyphenols`, `manganese`
- Benefits: `heart-health`, `gut-health`, `anti-inflammatory-support`

**UNCERTAINTY FLAGS**
- Aubergine is modest in most individual vitamins; `polyphenols` (especially nasunin in the skin) and `fibre` are its strongest nutritional story. 3 benefits is conservative and appropriate.

---

### Food 16 — Courgette

**Canonical**
- slug: `courgette` | name: Courgette | category: Vegetables | subcategory: Fruiting vegetables
- diversityGroupSlug: `courgette` | knowledgeFoodSlug: `courgette`
- aliases: `courgettes` (plural), `zucchini` (common_name)

**Knowledge**
- description: "A tender summer squash supplying vitamin C, vitamin B6 and potassium, with a mild flavour suited to many styles of cooking."
- commonForms: whole, sliced, grated, spiralised
- storageGuidance: Refrigerate and use within a few days.
- seasonality: Summer to early autumn

**Relationships**
- Nutrients: `vitamin-c`, `vitamin-b6`, `potassium`, `fibre`
- Benefits: `immune-support`, `heart-health`, `gut-health`

**UNCERTAINTY FLAGS**
- None.

---

### Food 17 — Pepper

**Canonical**
- slug: `pepper` | name: Pepper | category: Vegetables | subcategory: Fruiting vegetables
- diversityGroupSlug: `pepper` | **knowledgeFoodSlug: null**
- varieties: `red-pepper` (Red Pepper, knowledgeFoodSlug: `red-pepper`), `green-pepper` (Green Pepper), `yellow-pepper` (Yellow Pepper), `orange-pepper` (Orange Pepper)
- aliases: `peppers` (plural), `bell pepper` (common_name), `bell peppers` (common_name), `capsicum` (common_name), `sweet pepper` (common_name)

**Knowledge** — uses existing `red-pepper` knowledge entry via the `red-pepper` variety.

**Relationships** — existing `red-pepper` knowledge food: `vitamin-c, beta-carotene, vitamin-a` → `immune-support, skin-health, eye-health`

**UNCERTAINTY FLAGS**
- `knowledgeFoodSlug: null` at the canonical level: the existing knowledge food is `red-pepper`, which describes the red variety specifically. Red pepper has significantly more vitamin C and beta-carotene than green. Wiring the parent canonical to `red-pepper` would be misleading for green and yellow pepper users. The variety-level link (red variety → `red-pepper`) is the accurate approach.
- **This is the most editorial complex food in the trial.** The knowledge layer needs a generic `pepper` entry to serve the parent canonical food correctly. Deferred for THA to review — currently the parent canonical has no knowledge food, only the red variety does.

---

### Food 18 — Cucumber

**Canonical**
- slug: `cucumber` | name: Cucumber | category: Vegetables | subcategory: Fruiting vegetables
- diversityGroupSlug: `cucumber` | knowledgeFoodSlug: `cucumber`
- aliases: `cucumbers` (plural)

**Knowledge**
- description: "A cool, crunchy vegetable with high water content, providing vitamin K and contributing to a hydrating diet."
- commonForms: whole, sliced, pickled, in salads
- storageGuidance: Refrigerate; best used within a week.
- seasonality: Summer (imported year-round)

**Relationships**
- Nutrients: `vitamin-k`, `potassium`, `vitamin-c`
- Benefits: `heart-health`, `digestive-comfort`

**UNCERTAINTY FLAGS**
- 2 benefits only: cucumber is high in water, low in most concentrated nutrients. Conservative is correct. Do not overstate.
- Gherkin: excluded from aliases. A gherkin is a smaller cucumber cultivar (Cucumis sativus var. hardwickii) primarily used for pickling. It could be an alias or a separate food — left for THA to decide.

---

### Food 19 — Fennel

**Canonical**
- slug: `fennel` | name: Fennel | category: Vegetables | subcategory: Bulb vegetables
- diversityGroupSlug: `fennel` | knowledgeFoodSlug: `fennel`
- aliases: `fennel bulb` (form), `florence fennel` (common_name), `fennel seed` (form), `fennel seeds` (form)

**Knowledge**
- description: "An aromatic bulb vegetable with a gentle aniseed flavour, rich in fibre and vitamin C; used raw, roasted or braised."
- commonForms: raw, braised, roasted, in salads
- storageGuidance: Refrigerate and use within a few days; the fronds wilt quickly.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `fibre`, `potassium`, `vitamin-c`, `folate`
- Benefits: `gut-health`, `digestive-comfort`, `heart-health`

**UNCERTAINTY FLAGS**
- Fennel seed (spice) and fennel bulb (vegetable) are the same plant. Fennel seed is treated as a form alias here, collapsed into the vegetable canonical food. The Herbs and Spices category list includes "fennel seed" separately — if THA wants fennel seed counted as a separate spice experience, they should add it as a distinct canonical food and remove it from these aliases. This is a deliberate editorial decision that requires THA's agreement.

---

### Food 20 — Celery

**Canonical**
- slug: `celery` | name: Celery | category: Vegetables | subcategory: Stem vegetables
- diversityGroupSlug: `celery` | knowledgeFoodSlug: `celery`
- aliases: `celery sticks` (form), `celery stalks` (form)

**Knowledge**
- description: "A crunchy stem vegetable rich in vitamin K and potassium, commonly used raw as a snack or as an aromatic base for cooking."
- commonForms: raw, diced, in soups, in stocks
- storageGuidance: Refrigerate; wrapping in foil keeps it crisp longer.
- seasonality: Year-round

**Relationships**
- Nutrients: `vitamin-k`, `potassium`, `fibre`, `folate`
- Benefits: `heart-health`, `bone-health`, `digestive-comfort`

**UNCERTAINTY FLAGS**
- None.

---

### Food 21 — Asparagus

**Canonical**
- slug: `asparagus` | name: Asparagus | category: Vegetables | subcategory: Stem vegetables
- diversityGroupSlug: `asparagus` | knowledgeFoodSlug: `asparagus`
- aliases: `asparagus spears` (form), `green asparagus` (form)

**Knowledge**
- description: "A seasonal spring vegetable rich in folate, vitamin K and fibre, associated with gut and bone health."
- commonForms: whole, steamed, grilled, roasted
- storageGuidance: Stand upright in a little water in the fridge; use within a few days.
- seasonality: Spring (April to June in the UK)

**Relationships**
- Nutrients: `folate`, `vitamin-k`, `fibre`, `vitamin-c`
- Benefits: `bone-health`, `gut-health`, `energy-support`

**UNCERTAINTY FLAGS**
- White asparagus: a cultivated form grown without light. Omitted from aliases and varieties — white asparagus has a very different culinary use and is rarely seen in UK supermarkets. Could be added as a variety later.

---

### Food 22 — Artichoke

**Canonical**
- slug: `artichoke` | name: Artichoke | category: Vegetables | subcategory: Speciality vegetables
- diversityGroupSlug: `artichoke` | knowledgeFoodSlug: `artichoke`
- aliases: `globe artichoke` (common_name), `artichoke heart` (form), `artichoke hearts` (form), `tinned artichokes` (form)

**Knowledge**
- description: "The globe artichoke is a thistle vegetable with exceptional fibre content, prized in Mediterranean cooking and associated with digestive health."
- commonForms: whole, tinned hearts, jarred hearts, steamed
- storageGuidance: Refrigerate fresh; tinned hearts keep in the cupboard.
- seasonality: Spring to summer

**Relationships**
- Nutrients: `fibre`, `folate`, `vitamin-c`, `magnesium`
- Benefits: `gut-health`, `digestive-comfort`, `heart-health`, `blood-sugar-balance`

**UNCERTAINTY FLAGS**
- Jerusalem artichoke: a completely unrelated plant (Helianthus tuberosus, related to sunflower). Excluded entirely. If THA wants to add it, it must be a separate canonical food.
- "Speciality vegetables" is a new subcategory not previously used in the system. It is appropriate here as artichoke does not fit cleanly into fruiting, root, stem or leafy categories.

---

### Food 23 — Broad Beans

**Canonical**
- slug: `broad-beans` | name: Broad Beans | category: Vegetables | subcategory: Pods and beans
- diversityGroupSlug: `broad-beans` | knowledgeFoodSlug: `broad-beans`
- aliases: `broad bean` (singular), `fava beans` (common_name), `fava bean` (common_name), `frozen broad beans` (form)

**Knowledge**
- description: "A hearty legume eaten as a vegetable, rich in plant protein, fibre and folate; a Mediterranean staple enjoyed fresh or frozen."
- commonForms: fresh, frozen, dried, podded
- storageGuidance: Keep fresh pods in the fridge; frozen work well year-round.
- seasonality: Late spring to summer (frozen year-round)

**Relationships**
- Nutrients: `plant-protein`, `fibre`, `folate`, `iron`
- Benefits: `muscle-recovery`, `gut-health`, `energy-support`

**UNCERTAINTY FLAGS**
- Category decision: broad beans are botanically legumes (Vicia faba) but culinarily treated as vegetables when fresh or frozen. Categorised here as Vegetables with subcategory "Pods and beans". THA should decide whether to move to Legumes for consistency.
- Dried broad beans: also included in commonForms. When dried and used as legumes, the nutrient profile is more concentrated. Conservative descriptions apply equally.

---

### Food 24 — Radicchio

**Canonical**
- slug: `radicchio` | name: Radicchio | category: Vegetables | subcategory: Chicory
- diversityGroupSlug: `radicchio` | knowledgeFoodSlug: `radicchio`
- aliases: `red chicory` (common_name), `Italian chicory` (common_name)

**Knowledge**
- description: "A vivid red Italian chicory, pleasantly bitter in flavour and rich in anthocyanins, fibre and vitamin K."
- commonForms: whole, in salads, grilled, braised
- storageGuidance: Refrigerate; keeps for up to a week.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `anthocyanins`, `vitamin-k`, `fibre`, `folate`
- Benefits: `gut-health`, `anti-inflammatory-support`, `bone-health`, `healthy-ageing`

**UNCERTAINTY FLAGS**
- Radicchio vs chicory relationship: radicchio IS a type of chicory (Cichorium intybus var. foliosum). They share the same species but are treated here as separate canonical foods because they look and taste noticeably different, and UK users know them by distinct names. This is the same logic as treating orange and clementine as separate foods within the "citrus" diversity group — if THA wants them to share a diversity group (e.g., "chicory-family"), that is a valid alternative.
- "Radicchio di Treviso" was considered as a common_name alias but omitted as too niche for most UK users.

---

### Food 25 — Chicory

**Canonical**
- slug: `chicory` | name: Chicory | category: Vegetables | subcategory: Chicory
- diversityGroupSlug: `chicory` | knowledgeFoodSlug: `chicory`
- aliases: `Belgian endive` (common_name), `witloof` (common_name)

**Knowledge**
- description: "A pale, tightly furled endive with a mild bitter flavour, supplying fibre, vitamin K and folate."
- commonForms: whole, halved, braised, in salads
- storageGuidance: Refrigerate in a dark bag to prevent greening.
- seasonality: Autumn to winter

**Relationships**
- Nutrients: `fibre`, `vitamin-k`, `folate`, `vitamin-c`
- Benefits: `gut-health`, `digestive-comfort`, `anti-inflammatory-support`

**UNCERTAINTY FLAGS**
- "Endive" alias omitted: "endive" is ambiguous in UK English. It can refer to Belgian chicory (this food) OR curly endive / frisée (a different plant). Adding "endive" as an alias would create incorrect identity resolution risk. THA should discuss whether to (a) leave it out, (b) add it as a note in the description only, or (c) create a separate canonical food for curly endive.
- "Chicory" is also used in the UK to mean coffee chicory (the roasted root used as a coffee substitute). This is a completely different product. No alias was added for it.

---

## Validation Results

### Knowledge Registry (`test:knowledge-registry`)

```
PASS — 23 passed, 0 failed

counts: {
  foods: 69,            (+18 from WS0.6)
  nutrients: 30,        (unchanged)
  healthBenefits: 15,   (unchanged)
  foodNutrients: 232,   (+67 from WS0.6)
  foodBenefits: 192,    (+55 from WS0.6)
  nutrientBenefits: 68  (unchanged)
}
```

**Corrections required: None.**

### Canonical Food (`test:canonical-food`)

```
PASS — 46 passed, 0 failed

counts: {
  diversityGroups: 52,  (+25 from WS0.6)
  canonicalFoods: 53,   (+25 from WS0.6)
  varieties: 24,        (+8 from WS0.6)
  aliases: 143          (+74 from WS0.6)
}
```

**Corrections required: None.**

Both validators passed on the first attempt after seeding.

---

## Uncertainty Flags Summary

| Food | Flag | Severity |
|------|------|----------|
| Kale | Cavolo nero as variety vs separate food | Low — defensible; flag for THA |
| Beetroot | No varieties (golden, candy stripe omitted) | Low |
| Broccoli | Tenderstem is a hybrid; treated as form alias | Medium — THA should confirm |
| Red Cabbage | White cabbage not included; may need separate food | Low |
| Onion | Shallot excluded — same species but feels distinct | Medium — THA should decide |
| Pepper | knowledgeFoodSlug null at parent level; no generic pepper knowledge food | Medium — knowledge gap |
| Cucumber | Gherkin excluded — cultivar or separate food? | Low |
| Fennel | Fennel seed (spice) collapsed as form alias | High — structural decision |
| Artichoke | Jerusalem artichoke entirely different plant (excluded) | Low — documented |
| Broad Beans | Category: Vegetables vs Legumes | Medium — THA to decide |
| Radicchio | Could share diversity group with chicory | Low |
| Chicory | "Endive" alias omitted (ambiguous) | Medium — users may search "endive" |
| Swede | "Yellow turnip" alias omitted to avoid confusion | Low |

**High severity flags: 1** (fennel seed / fennel bulb collapse) — requires THA editorial decision before production.

**Medium severity flags: 5** — should be reviewed but are unlikely to cause harm.

**Low severity flags: 7** — safe to proceed; refinement opportunities.

---

## Review Experience Assessment

### 1. How long would THA take to review 25 foods?

**Estimated: 2–4 hours for an experienced reviewer.**

The majority of foods (20 out of 25) are straightforward — the uncertainty flags are clear, the aliases are obvious, the nutrients are well-matched. A reviewer would spend most of their time on the 5 medium/high flags, particularly:
- Fennel seed decision (~20 mins discussion)
- Pepper knowledge gap (~15 mins to write a generic knowledge entry)
- Shallot/onion decision (~10 mins)
- Broad beans category (~5 mins)

A second reviewer reading the document cold could likely move through all 25 in 2 hours.

### 2. What mistakes were common?

In this trial: **none that failed validators.** The validators caught zero errors on first attempt.

**Potential error patterns to watch for (documented from authoring experience):**

| Risk | Where it occurred |
|------|--------------------|
| Alias collision (duplicate aliasKey) | Nearly added "curly kale" as alias when it was already a variety name — avoided |
| Overstating benefits for modest foods | Cucumber has only 2 benefits; temptation to add more — resisted |
| Wrong knowledge food link for umbrella canonical | `pepper` → wanted to link to `red-pepper` but it only covers the red variety — correctly set to null |
| Subcategory inconsistency | "Pods and beans" and "Speciality vegetables" are new subcategories |
| Species confusion | Jerusalem artichoke vs globe artichoke — caught before authoring |

### 3. Which fields caused uncertainty?

Ranked by difficulty:

1. **`knowledgeFoodSlug`** — deciding when to link vs leave null requires editorial judgment. The `pepper` case is the clearest example.
2. **Variety vs alias vs separate food** — cavolo nero, tenderstem, shallot, gherkin all required explicit decisions.
3. **Category for cross-over foods** — broad beans (vegetable or legume), fennel (vegetable or spice).
4. **Alias completeness** — how many international/regional names to include? Balance between useful and noisy.
5. **Benefit count** — conservative restraint sometimes conflicts with completeness instinct.

### 4. Could batches of 25 / 50 / 100 be realistic?

| Batch size | Assessment |
|------------|------------|
| 25 | **Proven.** This trial is evidence. ~1 hour to author, 2–4 hours THA review. |
| 50 | **Realistic with preparation.** Two batches of 25 with category focus. Review effort ~1 day. |
| 100 | **Feasible but needs workflow structure.** Recommend: author in themed groups of 25, review per group (4 review sessions), not all at once. |

The bottleneck at scale is not Claude's authoring speed but THA's review capacity. Each batch produces uncertainty flags that need human judgment.

### 5. What would improve trust?

1. **Per-food confidence scores** — if Claude rates its own certainty on each field, reviewers can focus attention.
2. **Cross-reference lookup** — for knowledgeFoodSlug decisions, a lookup of existing knowledge foods during authoring (already available; should be made explicit in the workflow).
3. **Category pre-agreement** — before authoring a batch, THA and Claude agree on category/subcategory conventions to reduce surprise.
4. **Alias review tool** — the canonical resolver can be run interactively to spot-check alias resolution before committing.
5. **Staged review** — review canonical layer first (identity), then knowledge layer (descriptions, seasonality), then relationships (nutrients, benefits) as three separate passes.

---

## Trust Check

### Could Claude invent foods?

**Risk: Low, with the current pipeline.**

The canonical seed requires every `diversityGroupSlug` to exist in `DIVERSITY_GROUP_SEED` and every `knowledgeFoodSlug` to exist in `FOOD_SEED`. The validator enforces this referentially. Claude cannot invent a knowledge food slug and claim a canonical food links to it — it would fail validation. However, Claude CAN add new knowledge foods AND reference them in the same authoring run (as done here) — this is the correct workflow, not an exploit.

The only true "invention" risk is Claude proposing foods that do not exist as real foods. The editorial review step catches this.

### Could Claude create duplicates?

**Risk: Low.**

The alias uniqueness check (anti-fork lock) catches any attempt to add a food under a name already owned by another food. The `validateCanonicalSeed` validator fails immediately on duplicate alias keys. In this trial, one near-miss was caught manually (variety name "curly kale" would have been shadowed if added as an alias too) — the validator would have caught this at the duplicate-alias-key level if it had been submitted.

### Could Claude overstate benefits?

**Risk: Medium, mitigated by editorial rules.**

Claude naturally wants to be helpful and complete. Cucumber with only 2 benefits feels "sparse" — the instinct to add more is real. The editorial rule (conservative, well-established only) resisted this. A reviewer should specifically check the lower-benefit foods (cucumber, turnip, spring onion) to confirm the conservatism is appropriate, not accidental.

### Could Claude create unsafe wording?

**Risk: Low, given the constraint set.**

All 25 descriptions were authored to the editorial rules:
- UK English ✓
- Maximum 2 sentences ✓
- No disease claims ✓
- No "cures", "prevents", "treats", "proven to" ✓
- Preferred language used: "rich in", "supplying", "associated with", "contributing to" ✓

The constraint set is effective. A reviewer scanning descriptions quickly should see consistent tone across all 25.

---

## Final Recommendation

### Can Claude safely become The Healthy Apples Food Knowledge Author?

**YES — with the pipeline in place.**

The workflow proven in this trial is:

```
Claude proposes (canonical + knowledge + relationships)
        ↓
validateCanonicalSeed() — structural integrity enforced
        ↓
validateKnowledgeSeed() — referential integrity enforced
        ↓
THA reviews (uncertainty flags + editorial content)
        ↓
Seed → Production
```

This trial demonstrated:
- 25 foods authored with **zero validator errors on first attempt**
- **13 uncertainty flags surfaced** — all discoverable before production
- **No invented nutrients, benefits or health claims**
- **No forked identities or alias collisions**
- Descriptions consistent with editorial rules across all 25

### Scale estimates

| Scale | Claude authoring time | THA review effort | Risk level |
|-------|----------------------|-------------------|------------|
| 100 foods | ~2–3 hours | 1–2 review days | Low |
| 200 foods | ~5–6 hours | 3–4 review days | Low–Medium |
| 500 foods | ~15 hours | ~2 weeks review | Medium |

The review effort is the binding constraint, not Claude's authoring capacity.

**Recommended path to 200 foods:**
1. Agree subcategory conventions with THA (1 session)
2. Author in themed batches of 25 (Herbs & Spices, Nuts, Fruits, Grains, etc.)
3. THA reviews each batch before the next is authored — maintains quality gate
4. Uncertainty flags collected across batches for a final editorial session
5. Seed to staging, validate, then production

**What Claude should NOT do autonomously:**
- Publish directly without THA review
- Invent new nutrients or benefits not in the existing registry
- Author foods in a category where conventions haven't been agreed
- Resolve its own uncertainty flags — those require human editorial judgment

---

## Suggestions (out of scope for WS0.6)

- **SUGGESTION**: Generic `pepper` knowledge food. Currently `pepper` (canonical) has `knowledgeFoodSlug: null`. A future authoring session should create a generic `pepper` knowledge entry covering all colours, and individual colour entries can override via variety-level links.
- **SUGGESTION**: White cabbage as a separate canonical food. It is the same species as red cabbage but different nutritional profile and distinct culinary identity.
- **SUGGESTION**: Shallot as a canonical food or alias decision. Currently absent from the system.
- **SUGGESTION**: Curly endive / frisée as a separate canonical food (distinct from chicory).
- **SUGGESTION**: Jerusalem artichoke as a separate canonical food (completely different plant from globe artichoke).
- **SUGGESTION**: Gherkin decision — alias of cucumber or separate food.
- **SUGGESTION**: Fennel seed review — if THA wants it to count separately for spice diversity, move it out of the fennel (vegetable) canonical food.
- **SUGGESTION**: Tenderstem broccoli — THA to confirm alias vs variety treatment.
- **SUGGESTION**: A confidence/uncertainty tier on each proposed food (high/medium/low) would help THA prioritise review effort in larger batches.

---

*WS0.6 trial authored by Claude Sonnet 4.6, 2026-06-21. All uncertainty flags surfaced intentionally. No production data modified without validation.*
