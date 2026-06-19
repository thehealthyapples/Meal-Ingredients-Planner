# WS1.5 — Alias vs Variety Classification Spike

> **One food. One meaning. But don't flatten what's worth keeping.**
>
> Editorial classification spike. **No code, schema, migration, seed, or data changes were made.**
> This document classifies existing food-identity terms ahead of the Canonical Food Identity build.

| | |
|---|---|
| **Spike date** | 2026-06-18 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at start** | `df914ad` |
| **Rollback tag** | `rollback/ws1_5-spike-20260618` → commit `df914ad` |
| **Working tree** | Tracked tree clean; only untracked file is the prior architecture doc (unaffected) |
| **Scope** | Investigation + editorial classification only |
| **Author** | Editorial classification (read-only) |
| **Companion doc** | [`CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md`](./CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md) (this spike resolves its risk **R2**, Section 11.3) |

---

## SECTION 0 — Rollback & change confirmation

- **Rollback identifier:** annotated tag `rollback/ws1_5-spike-20260618`, pointing at commit `df914ad`
  (`feat(pantry): WS1 Pantry Explore V2 — Nutrition Knowledge Hub (read-only)`).
- To restore: `git reset --hard rollback/ws1_5-spike-20260618` (or `git checkout` the tag).
- **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.
- **No code / schema / migration / seed / data / behaviour changes were made.** The only filesystem
  output of this spike is **this document** under `docs/investigations/`.

---

## SECTION 1 — Why this spike exists

The Canonical Food Identity architecture recommends four tables:

```
canonical_food        — the identity spine ("tomato")
food_variety          — named sub-kinds of one canonical food ("cherry-tomato")
diversity_group       — what the 30-plants counter counts once ("tomato")
canonical_food_alias  — same food, different words ("tomatoes" → "tomato")  [UNIQUE alias_key]
```

The single decision that **can move user-facing numbers** (plant counts, "Your Variety") is **how each
existing term is bucketed into those four tables**. Get it wrong and we either:

- **double-count** (cherry + plum + tomato = 3 plants — wrong), or
- **destroy variety information** (collapse cherry tomato → tomato as a plain alias — the data
  "Your Variety" needs is gone).

The current codebase **already disagrees with itself** on exactly this point, which is the proof we
need rules before we seed:

| Term | `shared/ingredient-aliases.ts` says | `client/src/lib/nutrition-variety.ts` says |
|---|---|---|
| `cherry tomatoes` | alias → `tomatoes` (collapsed) | distinct `VEGETABLES` entry (counted in its own right) |
| `baby spinach` | alias → `spinach` (collapsed) | (matches `spinach` substring) — but `pantry-knowledge.ts` gives it its **own** card |

This spike defines the editorial rules, then classifies the live terms against them.

---

## SECTION 2 — Sources reviewed

| Source | Role today | Identity form | What it contributes to classification |
|---|---|---|---|
| `shared/knowledge/foods.ts` (`FOOD_SEED`) | WS0 editorial registry, 8 categories | `slug` + inline `aliases[]` | The **canonical food** seed set; its `aliases[]` already mixes true aliases with varieties |
| `shared/ingredient-aliases.ts` (`ALIASES`) | Deterministic variant → canonical | string → string | The main **alias/variety/form** collapse map (the riskiest one) |
| `shared/food-synonyms.ts` (`SYNONYM_MAP`) | Bidirectional **search** expansion | canonical → variants[] | Mostly true aliases (US/UK, spelling); search-only, lower risk |
| `client/src/lib/nutrition-variety.ts` | Plant Diversity + meal variety scoring | substring keyword arrays | The **diversity-group** boundary; defines what counts as a plant |
| `client/src/lib/nutrition-boosts.ts` (`BOOST_LIBRARY`) | Boost suggestions | display strings | Surfaces **composites** ("Mixed Beans", "Mixed Mushrooms") as first-class items |
| `client/src/lib/pantry-knowledge.ts` (`PANTRY_KNOWLEDGE`) | Pantry Explore knowledge cards | normalized key | Shows where **forms/varieties already have their own editorial card** (e.g. `baby spinach`) |

(Server `server/data/canonical-map.json` / `productCanonicaliser.ts` are **brand-product**
canonicalisation — out of scope for whole-food identity; noted, not classified here.)

---

## SECTION 3 — Classification rules (editorial)

Five buckets. The first four come from the architecture doc; **Form** is split out from "alias"
because it behaves like an alias for *identity* but carries metadata we may want later.

### Rule A — Alias (same food, different words)
**Test:** Would a reasonable shopper say this is *literally the same item*, just worded differently?
- Plural ↔ singular: `tomatoes` ↔ `tomato`
- US ↔ UK: `eggplant` → `aubergine`, `cilantro` → `coriander`, `garbanzo beans` → `chickpeas`
- Spelling variants: `yoghurt` → `yogurt`, `linseed` → `flaxseed`
- Abbreviations / regionalisms: `EVOO` → `extra virgin olive oil`, `pepitas` → `pumpkin seeds`

**→ Collapses.** Stored as `canonical_food_alias`. **Must not** create a variety or a separate food.
**Does not** affect plant counts (it always resolved to the same food anyway).

### Rule B — Variety (same plant, named sub-kind worth tracking)
**Test:** Same canonical food *and* same diversity group, but a distinguishable, named cultivar/
colour/size a user might deliberately choose — and that "Your Variety / Broaden Your Variety" would
want to surface.
- `cherry tomato`, `plum tomato`, `vine tomato`, `roma tomato` → varieties of `tomato`
- `curly kale`, `cavolo nero` → varieties of `kale`
- `red onion`, `brown onion` → varieties of `onion`
- `gala apple` → variety of `apple`

**→ Does NOT collapse.** Stored as `food_variety` (FK to parent). Counts **once** for plant diversity
(shares the parent's `diversity_group`) but is **tracked** individually for variety.

### Rule C — Form / preparation (same food, different state)
**Test:** Same food and same variety; differs only by physical state or processing.
- Fresh / dried / frozen / tinned: `frozen spinach`, `dried basil`, `tinned tomatoes`
- Cut / processed: `ground almonds`, `flaked almonds`, `crushed garlic`, `ground flaxseed`

**→ Collapses to the canonical food for identity & diversity** (treat as an alias subtype,
`alias_type = 'form'`). Optionally retain the form as **metadata** (`commonForms` already exists in
`foods.ts`). **Editorial caution:** a few "forms" are nutritionally distinct enough to deserve their
own canonical food (see `tahini`, `ground flaxseed` in High-Risk, Section 6).

### Rule D — Separate food (distinct identity)
**Test:** Different identity, meaning, nutrition — would never be substituted 1:1.
- `pumpkin seeds` ≠ `sunflower seeds` ≠ `chia seeds` (each its own canonical food, all in diversity
  group **Seeds**-level? No — see note) 
- `tomato` ≠ `tomatillo`; `sweet potato` ≠ `potato`

**→ Separate `canonical_food`.** May still **share a diversity_group** with relatives where the
30-plants goal treats them together — but identity stays distinct.

### Rule E — Composite (contains/!groups multiple foods)
**Test:** The term denotes more than one underlying food, or an unspecified mixture.
- `mixed seeds`, `mixed beans`, `five bean mix`, `mixed nuts`, `mixed herbs`, `mixed mushrooms`,
  `trail mix`

**→ `canonical_food.kind = 'composite'`.** Counts **conservatively** for diversity (matching today —
"mixed beans" = 1 legume, not N), pending a future `composite_members` expansion. **Never** treat a
composite as an alias of one of its members.

### Tie-breakers (when A vs B vs C is genuinely fuzzy)
1. **Does collapsing it lose information a user would care about choosing?** If yes → Variety, not
   Alias. (e.g. cherry vs plum tomato.)
2. **Does it already have its own editorial card / distinct nutrition story?** If yes → lean Variety
   or Separate food. (e.g. `baby spinach` has its own `PANTRY_KNOWLEDGE` card.)
3. **Is the difference purely physical state with identical nutrition story?** → Form (collapse).
4. **When still unsure → Alias is the *safer* default for launch** *only because* aliases are the
   easiest to reclassify later **while still aliases** — but note that reclassifying alias→variety is
   the one move that can change "Your Variety". Flag every such call for the product owner (Section 8).

---

## SECTION 4 — Master classification table

Grouped by canonical food family. "Source" abbreviations: **F** = `foods.ts`, **AL** =
`ingredient-aliases.ts`, **SYN** = `food-synonyms.ts`, **NV** = `nutrition-variety.ts`, **B** =
`nutrition-boosts.ts`, **PK** = `pantry-knowledge.ts`.

### 4.1 Tomato family

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| tomato / tomatoes | F, AL, NV, PK | **Canonical** (`tomato`) | — | tomato | `foods.ts` slug is plural `tomatoes`; pick singular `tomato` as canonical | Low |
| cherry tomatoes | AL, NV | **Variety** | tomato | tomato | AL collapses → tomatoes; NV lists separately. **Conflict.** Make variety | **High** |
| plum tomatoes | AL | **Variety** | tomato | tomato | Currently alias → tomatoes (info lost) | Med-High |
| vine tomatoes | AL | **Variety** | tomato | tomato | Currently alias → tomatoes | Med |
| roma tomatoes | AL | **Variety** | tomato | tomato | Currently alias → tomatoes | Med |
| tinned tomatoes / canned / crushed tomatoes | AL, PK | **Form** | tomato | tomato | Collapse for identity; `tinned tomatoes` has own PK card (keep as content) | Low |
| passata / sun-dried / tomato purée | SYN, F | **Form** (processed) | tomato | tomato | Processed forms; collapse identity. Purée arguably borderline-composite (no) | Low |
| grilled tomatoes / roasted peppers (boosts) | B | **Form/display** | tomato / red pepper | tomato / pepper | Boost display strings; resolve to parent food | Low |

### 4.2 Leafy greens

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| spinach | F, NV, PK | **Canonical** (`spinach`) | — | spinach | | Low |
| baby spinach | F(alias), AL, PK | **Variety (recommended)** — *PO decision* | spinach | spinach | AL collapses → spinach; **PK gives it its own card**. Form vs variety is genuinely fuzzy | **High** |
| frozen spinach | AL | **Form** | spinach | spinach | Collapse | Low |
| kale | F, NV | **Canonical** (`kale`) | — | kale | | Low |
| curly kale | F(alias) | **Variety** | kale | kale | Listed as alias in `foods.ts` | Med |
| cavolo nero | F(alias) | **Variety** (PO: arguably separate) | kale | kale | Botanically distinct cultivar; today bundled as kale alias | Med-High |
| rocket / arugula / roquette | AL, SYN, NV | **Alias** (rocket canonical) | rocket | rocket | US/UK + spelling | Low |
| watercress, chard, lettuce, cabbage | NV | **Canonical** each | — | own | Distinct foods | Low |
| spring greens / collard greens | SYN | **Alias** (spring greens) | spring greens | (brassica?) | UK/US | Low |

### 4.3 Alliums

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| onion / onions | F, NV | **Canonical** (`onion`) | — | onion | | Low |
| brown onion | F(alias), AL? | **Variety** | onion | onion | | Low |
| red onion / red onions | F(alias), NV | **Variety** | onion | onion | NV lists `red onion` separately | Med |
| spring onion / scallion / green onion / salad onion | AL, SYN, NV | **Alias** (spring onion canonical) — *but distinct food from onion* | spring onion | onion *(PO)* | US/UK aliases of each other; spring onion ≠ onion as a food | Med |
| shallot / shallots | NV, SYN | **Separate food** | shallot | onion *(PO)* | Distinct from onion; diversity grouping is a PO call | Med |
| garlic / garlic clove / cloves / minced / paste / bulb | F, AL, NV, PK | garlic = **Canonical**; clove/minced/paste/bulb = **Form** | garlic | garlic | All forms collapse | Low |
| garlic powder / granules | NV(herbs) | **Form** (spice form) | garlic | garlic *(PO)* | NV counts these under Herbs & Spices, not garlic veg — note double-path | Med |
| leek, celery, fennel | NV | **Canonical** each | — | own | | Low |

### 4.4 Seeds (high-risk for "separate vs composite")

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| pumpkin seeds / pepitas | F, NV, B, PK | **Canonical** (`pumpkin-seeds`); `pepitas` = **Alias** | — | pumpkin seeds | | Low |
| sunflower seeds / kernels | F, NV | **Canonical**; `kernels` = **Alias/Form** | — | sunflower seeds | ≠ pumpkin seeds | Low |
| chia seeds / chia | F, NV, B, PK | **Canonical**; `chia` = **Alias** | — | chia seeds | | Low |
| flaxseed / linseed / flax seed(s) | F, AL, NV, PK | **Canonical** (`flaxseed`); `linseed`, `flax seed(s)` = **Alias** | — | flaxseed | `linseed` has its own PK card but same food — keep card, treat as alias | Med |
| ground flaxseed / ground linseed / milled | AL, PK | **Form** (PO: borderline separate) | flaxseed | flaxseed | Nutritionally more bioavailable ground; PK has own card. Likely Form | Med |
| sesame seeds / sesame / tahini | F | sesame = **Canonical**; `sesame` = Alias; **`tahini` = Separate food** | — / tahini | sesame | **`foods.ts` lists tahini as a sesame alias — wrong.** Tahini is a processed paste (own identity) | **High** |
| hemp seeds / hemp hearts | F, NV | **Canonical**; `hemp hearts` = **Alias** | — | hemp seeds | | Low |
| poppy seeds | NV | **Canonical** | — | poppy seeds | | Low |
| **mixed seeds** | NV, (B-style) | **Composite** | — (kind=composite) | counts 1 (conservative) | Q3 — see Section 5 | Med |

### 4.5 Legumes & pulses

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| chickpeas / garbanzo / garbanzos / chana | F, AL, NV, PK | **Canonical** (`chickpeas`); others = **Alias** | — | chickpeas | | Low |
| tinned/canned chickpeas | AL, PK | **Form** | chickpeas | chickpeas | | Low |
| red lentils / split red lentils | F, NV, PK | **Variety** (or Canonical) of lentil | lentil *(PO)* | lentil | `foods.ts` makes `lentils` an alias of red-lentils — inverted | Med |
| green / puy / beluga lentils | NV, PK | **Variety** | lentil | lentil | | Med |
| lentils (generic) | F, NV, PK | **Canonical** (`lentil`) | — | lentil | Should be the parent, not an alias of red lentils | Med |
| butter beans / lima beans | F, SYN | **Canonical** (`butter-beans`); `lima` = **Alias** | — | butter beans | | Low |
| black beans / turtle beans | F, NV | **Canonical**; `turtle` = **Alias** | — | black beans | | Low |
| kidney beans / red kidney beans | F, NV | **Canonical**; `red kidney` = **Alias/Variety** | — | kidney beans | | Low |
| cannellini / haricot / navy / borlotti / cranberry beans | NV, SYN | **Separate food** each; navy=alias of haricot; cranberry=alias of borlotti | own | own | | Low |
| edamame / soya beans / soybeans / soy beans | F, AL, SYN, NV | **Canonical** (`edamame`); others = **Alias** | — | edamame/soya | AL maps `soya beans → edamame` — defensible but PO check (soya beans can be mature, not edamame) | Med |
| garden peas / peas / frozen peas | F, NV | peas = **Canonical**; `garden`/`frozen` = **Variety/Form** | peas | peas | `foods.ts` slug `garden-peas` with `peas` alias | Low |
| split peas | NV | **Separate food** | split peas | peas *(PO)* | | Low |
| baked beans | NV | **Composite/processed** (PO) | — | counts 1 | Beans + sauce; lean processed-single | Med |
| **mixed beans / five bean mix / bean mix** | NV, B | **Composite** | — (kind=composite) | counts 1 (conservative) | Q4 — see Section 5 | Med |
| tofu / silken / firm tofu | NV | tofu = **Canonical**; silken/firm = **Variety/Form** | tofu | soya | | Low |
| tempeh | F, NV | **Canonical** | — | soya/fermented | Appears in legumes AND fermented lists — dual path | Med |

### 4.6 Nuts

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| walnuts / walnut / halves / pieces | F, AL, NV, PK | **Canonical** (`walnuts`); halves/pieces = **Form**; walnut = Alias | — | walnuts | | Low |
| almonds / almond / ground / flaked / blanched | F, AL, NV, PK | **Canonical**; ground/flaked/blanched = **Form** | — | almonds | | Low |
| cashew / pecan / pistachio / hazelnut / pine nut / brazil / macadamia / peanut / chestnut | NV | **Separate food** each | own | own | | Low |
| **mixed nuts** | NV | **Composite** | — (kind=composite) | counts 1 | Same rule as mixed seeds/beans | Med |

### 4.7 Herbs & spices

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| parsley / flat-leaf / curly / fresh / dried parsley | F, AL, NV | parsley = **Canonical**; flat-leaf/curly = **Variety**; fresh/dried = **Form** | parsley | herbs* | | Low |
| basil / sweet basil / fresh / dried | F, AL, NV | basil = **Canonical**; sweet basil = Alias; fresh/dried = Form | basil | herbs* | | Low |
| coriander / cilantro / fresh coriander / seeds / ground | F, AL, NV | coriander = **Canonical**; cilantro = **Alias**; seeds/ground = **Form (or separate — see note)** | coriander | herbs* | Coriander **seed** (spice) vs coriander **leaf** (herb) are arguably different foods | Med |
| mint / spearmint / fresh mint | F, NV | mint = **Canonical**; spearmint = **Variety**; fresh = Form | mint | herbs* | | Low |
| rosemary, thyme, oregano, sage, dill, tarragon, chives, bay | F, NV | **Canonical** each | — | herbs* | fresh/dried variants = Form | Low |
| ginger / fresh / ground ginger | NV, PK | ginger = **Canonical**; fresh/ground = **Form** | ginger | herbs/spices* | PK treats fresh vs ground as separate cards (same food) | Low |
| turmeric / ground turmeric | NV, PK | turmeric = **Canonical**; ground = **Form** | turmeric | spices* | | Low |
| cumin / ground cumin, paprika / smoked / sweet paprika, etc. | NV | base spice = **Canonical**; ground/smoked/sweet = **Form/Variety** | base spice | spices* | smoked paprika arguably Variety | Low |
| **mixed herbs / dried herbs / fresh herbs / mixed spice / garam masala / curry powder / ras el hanout / chinese five spice** | NV | **Composite** (blends) | — (kind=composite) | counts 1 (conservative) | Q5 — spice blends are composites | Med |
| chilli / chili / chile / chilli flakes / powder / red pepper flakes | NV, SYN | chilli = **Canonical**; chili/chile = Alias; flakes/powder = Form | chilli | spices* | NV deliberately checks herbs before veg so "chilli powder" ≠ veg `chilli` | Med |

\* **Diversity-group note for herbs/spices:** today `nutrition-variety.ts` counts the **whole**
"Herbs & Spices" category as **one** plant (`herbsSpices = 1`, a single flag) in `computeMealVariety`,
but `getPlantCategory` / `isPlantIngredient` (the 30-plants counter) count **each herb/spice
individually**. This dual behaviour is a live inconsistency — see Q5 and High-Risk Section 6.

### 4.8 Mushrooms

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| white mushrooms / button / closed cup | F | white = **Canonical**; button/closed cup = **Alias** | — | mushrooms*(PO) | | Low |
| chestnut mushrooms / cremini / brown / baby bella | F, SYN, B | chestnut = **Canonical**; cremini/brown/baby bella = **Alias** | — | mushrooms*(PO) | | Low |
| shiitake / oyster mushrooms | F | **Separate food** each | own | mushrooms*(PO) | | Low |
| **mixed mushrooms** | B | **Composite** | — (kind=composite) | counts 1 | Boost library item | Med |

\* **PO call:** are all mushrooms one diversity group or distinct? Affects 30-plants counting.

### 4.9 Peppers

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| red pepper / bell pepper / capsicum / red bell / red capsicum | F, AL, SYN, NV | red pepper = **Canonical** (UK); bell pepper/capsicum = **Alias**; colour = **Variety** | pepper | pepper | AL maps `bell pepper → pepper`; SYN treats `red/green/yellow pepper` distinctly | Med |
| green pepper / yellow pepper | SYN, NV | **Variety** (colour) | pepper | pepper | | Med |
| roasted peppers | B | **Form** | pepper | pepper | | Low |

### 4.10 Fruit

| Term | Source | Recommended | Parent canonical | Diversity group | Notes | Risk |
|---|---|---|---|---|---|---|
| apple / apples / gala apple | F, AL, NV | apple = **Canonical**; apples = Alias; **gala = Variety** | apple | apple | AL maps `gala apple → apple` (variety info lost) | Med |
| orange / oranges / satsuma / clementine / mandarin / tangerine | F, AL, NV | orange = **Canonical**; satsuma/clementine/mandarin/tangerine = **Separate food or Variety (PO)** | orange *(PO)* | citrus *(PO)* | AL collapses satsuma/clementine → orange. These are arguably distinct fruits | **High** |
| banana, apple, pear, peach, plum, cherry, grape, melon, mango, etc. | F, NV | **Canonical** each (plurals = Alias) | — | own | | Low |
| blueberries / blueberry, strawberries, raspberries, etc. | F, NV | **Canonical** (singular); plural = **Alias** | — | own | | Low |
| sultanas / raisins / golden raisins | SYN, NV | sultanas = **Canonical**; raisins/golden raisins = **Alias or Separate (PO)** | (PO) | grape *(PO)* | SYN groups raisins+sultanas; they are different dried grapes | Med |
| kiwi / kiwifruit / kiwi fruit | F | **Canonical**; others = **Alias** | — | kiwi | | Low |

### 4.11 Oils, grains, dairy, fish (lower-risk, summarised)

| Term group | Source | Recommended | Notes | Risk |
|---|---|---|---|---|
| olive oil / EVOO / extra virgin / virgin / pure / light olive oil | F, AL, PK | `olive oil` = **Canonical**; EVOO/virgin/pure/light = **Alias/Variety**; **extra virgin** has its own PK card (Variety, keep card) | AL flattens *all* → `olive oil`, losing the EVOO distinction the product cares about | Med |
| oats / rolled / porridge / instant / steel-cut / jumbo oats | AL, NV, PK | oats = **Canonical**; all others = **Form/Variety** | rolled vs instant is a quality distinction the app teaches | Low |
| flour (plain/strong/wholemeal/self-raising/bread/00) | AL, SYN | flour = **Canonical**; types = **Variety** | AL flattens all → `flour`; wholemeal vs white is nutritionally real | Med |
| rice / brown / wild / long-grain / short-grain | AL, NV, PK | rice = **Canonical**; brown/wild = **Variety**; grain length = **Variety/Form** | brown rice is a whole grain, white is not — collapsing loses this | Med |
| bread (white/brown/seeded/sourdough/wholemeal/wholegrain) | AL, NV | bread = **Canonical**; types = **Variety** | wholemeal vs white nutrition differs | Med |
| chocolate (dark/milk/white/drinking) | AL, PK | chocolate = **Canonical**; types = **Variety**; **dark chocolate** has own PK card | dark vs milk is the whole health story | Med |
| yogurt / yoghurt / natural / plain / greek / bio / full-fat | AL, SYN, NV, PK | natural yogurt = **Canonical**; yoghurt = spelling Alias; greek = **Variety**; bio/full-fat = **Form** | Multiple PK cards (natural, greek, plain) for same food | Low |
| cream (double/single/heavy/whipping/etc.) | AL, SYN | type-specific **Canonical or Variety**; US/UK = **Alias** | double ≠ single (fat content) — not aliases of each other | Med |
| salmon / fresh / fillet, sardines / pilchards, mackerel, tuna + tinned/canned | F, AL, PK | each fish = **Canonical**; fresh/fillet/tinned = **Form**; canned = Alias of tinned; pilchards = Alias of sardines | | Low |
| kefir, kimchi, sauerkraut, miso, tempeh, kombucha, live/natural yogurt | F, NV, PK | **Canonical** each | fermented foods; tempeh dual-listed (legume+fermented) | Low |

---

## SECTION 5 — Answers to the specific questions

**Q1. Should cherry tomatoes be a variety of tomato?**
**Yes — Variety.** Same plant (*Solanum lycopersicum*), same diversity group (`tomato`), but a named
kind users deliberately choose and that "Your Variety" should surface. Current state is contradictory
(`ingredient-aliases.ts` collapses it to an alias; `nutrition-variety.ts` lists it separately). Making
it a variety counts it once for plant diversity **and** preserves the variety signal. Applies equally
to plum/vine/roma/heirloom/beefsteak tomatoes.

**Q2. Should baby spinach be alias, variety, or form?**
**Recommended: Variety; acceptable fallback: Form. Flag for product owner.** It is the same plant as
spinach, so it is **not** a separate food and **not** something that should change plant counts. The
reason it isn't a clean "alias" is that it (a) already has its **own Pantry Knowledge card**
(`pantry-knowledge.ts`) and (b) is a genuinely distinguishable product a shopper chooses. Treating it
as a **Variety** preserves that and keeps the card meaningful. If the PO prefers the simplest model,
**Form** ("young leaf") is acceptable since nutrition is ~identical — but **not a plain alias that
discards the distinction**. Either way: **counts once** under `spinach` diversity group.

**Q3. Should mixed seeds be composite?**
**Yes — Composite** (`kind = 'composite'`). It denotes an unspecified mixture (pumpkin + sunflower +
chia + …). It must **not** be an alias of any single seed. For plant diversity, **count conservatively
as 1** for now (matching today's `SEEDS_LIST` substring behaviour), with a future `composite_members`
table able to expand it to its true member count when membership is known.

**Q4. Should mixed beans be composite?**
**Yes — Composite**, same treatment as mixed seeds. `mixed beans` / `five bean mix` / `bean mix` all
group multiple legumes. Count conservatively as **1 legume** today (this is what `LEGUMES_PULSES`
already does). Never collapse to a single named bean. `baked beans` is a borderline case (beans + sauce,
a processed single product) — lean "processed single food," PO to confirm.

**Q5. Should herbs and spices be handled separately or grouped?**
**Handle each herb/spice as its own canonical food, but resolve the existing dual diversity behaviour
— this needs a PO decision.** Today there are **two different rules in the same file**:
- `computeMealVariety` counts **all** herbs/spices as a **single** flag (`herbsSpices = 1`).
- `isPlantIngredient` / `getPlantCategory` (the 30-plants counter) count **each** herb/spice
  **individually**.

For Canonical Food Identity, the clean model is: each herb/spice = its own `canonical_food`; **spice
blends** (`mixed herbs`, `garam masala`, `curry powder`, `mixed spice`, `ras el hanout`, `chinese five
spice`) = **Composite**. Whether the *30-plants counter* should keep counting individual herbs or cap
the category is a **product-owner / nutrition-science call**, because it directly changes plant counts
(Section 6, R1).

**Q6. Which terms could affect Plant Diversity counts?** (see Section 6 for the ranked list)
Any term whose classification changes whether it resolves to a **new diversity group**. The dangerous
moves are: alias→variety (no count change if diversity_group preserved — *safe*), variety→separate-food
(**increases** counts — dangerous), separate-food→variety/alias (**decreases** counts — dangerous),
and **composite expansion** (mixed beans counting as N instead of 1 — **increases** counts).

**Q7. Which terms could affect "Your Variety / Broaden Your Variety"?**
Every term classified as **Variety** is, by definition, the input to these features. The highest-impact
are the ones **currently collapsed as aliases** (so the variety signal is being destroyed today and
would *appear* for the first time): cherry/plum/vine/roma tomatoes, gala apple, red/brown onion,
curly kale / cavolo nero, olive-oil grades (EVOO), flour/rice/bread types, chocolate types, greek
yogurt. Promoting these from alias→variety is what *enables* "Your Variety" — but is also exactly the
reclassification that must be reviewed (it cannot change *counts* as long as the diversity group is
preserved, but it changes what the UI shows).

---

## SECTION 6 — High-risk terms (ranked)

Risk = (a) the classification is contested across existing sources, and/or (b) getting it wrong
moves a user-facing number (plant count) or destroys data ("Your Variety").

| # | Term(s) | Risk type | Why high risk | Recommended call |
|---|---|---|---|---|
| **H1** | **cherry / plum / vine / roma tomatoes** | Count + data | **Already contradictory** between `ingredient-aliases.ts` (alias) and `nutrition-variety.ts` (separate veg). Whatever we seed, one existing system disagrees | **Variety** of tomato; one diversity group; preserve variety |
| **H2** | **Herbs & spices diversity counting** | Count | Two different rules **in the same file** (category-flag vs per-item). Migration must pick one or counts shift | **PO decision** (Q5); keep per-item parity until decided |
| **H3** | **baby spinach** | Data | Alias in code, but has its own PK card; collapsing discards a curated distinction | **Variety** (fallback Form); never plain alias |
| **H4** | **mixed seeds / mixed beans / mixed nuts / mixed mushrooms / spice blends** | Count | If a composite is ever expanded to member count, plant diversity **inflates**; if collapsed to one member, it's wrong identity | **Composite**, count **1** conservatively now |
| **H5** | **tahini (listed as a sesame alias in `foods.ts`)** | Identity | A processed paste modelled as an alias of the raw seed — wrong identity, and they have different uses/nutrition | **Separate food** (or Form of sesame), **not** alias |
| **H6** | **satsuma / clementine / mandarin / tangerine → orange** | Count + identity | `ingredient-aliases.ts` collapses citrus to `orange`; these are arguably distinct fruits (own diversity contribution) | **PO decision**: separate foods sharing a citrus diversity group, or varieties of orange |
| **H7** | **lentils inversion** (`foods.ts` makes `lentils` an alias of `red-lentils`) | Identity | Parent/child inverted; red/green/puy should be varieties of a `lentil` parent | Make `lentil` the canonical parent; colours = varieties |
| **H8** | **cavolo nero → kale** | Count + identity | Distinct cultivar bundled as a kale alias; could be its own food | **PO decision**: variety of kale vs separate food (same diversity group either way) |
| **H9** | **EVOO / extra-virgin vs olive oil** | Data | `ingredient-aliases.ts` flattens all grades to `olive oil`; the EVOO distinction is core product education and has its own PK card | **Variety** (grade); keep card |
| **H10** | **wholemeal vs white (flour / bread / rice)** | Data/nutrition | Collapsing types to `flour`/`bread`/`rice` hides the whole-grain-vs-refined story the app teaches | **Variety**; whole-grain variants flagged for whole-grain diversity |
| **H11** | **spring onion / shallot vs onion** | Count | Distinct foods; whether they share onion's diversity group changes counts | **PO decision** on diversity grouping; distinct canonical foods |
| **H12** | **tempeh dual-listing** (legume **and** fermented) | Count | Appears in two `nutrition-variety.ts` arrays; must resolve to **one** identity to avoid double categorisation | One canonical food; pick primary diversity group |

---

## SECTION 7 — Trust check

| Question | Finding |
|---|---|
| **Could this change plant counts later?** | **Yes — and that is the main hazard.** Safe moves: alias→variety **when the diversity group is preserved** (no count change). Dangerous moves: variety/composite → separate foods (**inflates** counts), separate → alias (**deflates**). Mitigation: classify **before** seeding; count at `diversity_group`; composites count 1; Plant Diversity cuts over **last**, behind a parity gate (architecture doc R1). |
| **Could this cause duplicate foods?** | **Yes if seeded carelessly** — the same food currently appears under different strings across 6 sources (`tomato`/`tomatoes`/`cherry tomatoes`). Mitigation: the `UNIQUE(canonical_food_alias.alias_key)` constraint is the anti-fork lock; seed canonical foods **once** from `foods.ts`, then promote every other source's strings as aliases/varieties pointing in — never as new canonical rows. |
| **Could this destroy useful variety information?** | **Yes — it is being destroyed today.** `ingredient-aliases.ts` already flattens cherry/plum tomato, gala apple, olive-oil grades, flour/bread/rice/chocolate types into plain aliases. This spike's core recommendation (alias→variety for those) **recovers** that signal rather than cementing the loss. |
| **Could this confuse Pantry Explore?** | **Manageable, but watch the existing PK cards.** Several "forms/varieties" already have their **own** `PANTRY_KNOWLEDGE` cards (baby spinach, extra virgin olive oil, linseed, ground/fresh ginger, tinned variants). The classification must keep those cards reachable: a Variety should inherit the parent's card by default **and** be able to surface its own when one exists. Don't let collapsing identity orphan a curated card. |

---

## SECTION 8 — Items needing product-owner decision

1. **Herbs & spices diversity counting (Q5 / H2)** — keep per-herb counting in the 30-plants counter,
   or cap the whole category? Directly moves plant counts. *(Highest priority — it's a science call.)*
2. **baby spinach (H3)** — Variety (recommended) vs Form. Affects whether it shows in "Your Variety".
3. **Citrus collapse (H6)** — are satsuma / clementine / mandarin / tangerine separate foods, varieties
   of orange, or aliases? Affects fruit diversity counts.
4. **cavolo nero (H8)** — variety of kale or separate food? (Same diversity group either way.)
5. **Diversity grouping of relatives (H11)** — do `spring onion`, `shallot` share `onion`'s diversity
   group? Do all mushrooms share one group? Do split peas share `peas`? Do raisins/sultanas share
   `grape`? Each is a count-affecting grouping call.
6. **Grade/type as Variety vs Alias (H9, H10)** — confirm EVOO, wholemeal/white flour-bread-rice,
   dark/milk chocolate, greek yogurt are **varieties** (preserve), not aliases (flatten). Recommended:
   varieties.
7. **Composite expansion policy (H4)** — confirm composites count **1** for plant diversity until a
   `composite_members` table exists (recommended). Decide if/when expansion is ever enabled.
8. **`foods.ts` data corrections (H5, H7)** — approve treating `tahini` as a separate food (not a
   sesame alias) and `lentil` as the canonical parent (not a child of `red-lentils`). These are
   editorial seed corrections, to be made **when** the canonical seed is authored — not now.

---

## SECTION 9 — Recommended seed approach for Canonical Food Identity

Concrete, ordered, and additive — consistent with the architecture doc's Phase 0.

1. **Seed `canonical_food` once from `shared/knowledge/foods.ts`.** Slug = `foods.ts` slug
   (singularised where needed, e.g. `tomatoes` → `tomato`). This is the authoritative identity set;
   `canonical_food.slug == knowledge_foods.slug` invariant holds for editorial foods.
2. **Seed `diversity_group` from the `nutrition-variety.ts` category arrays**, one group per countable
   plant (tomato, kale, chickpeas, …). Map each canonical food to its `diversity_group_id`. This is
   where the count-affecting decisions (Section 8 #1, #5) are encoded — **freeze them by review**.
3. **Promote varieties into `food_variety`** (FK to parent): everything in this spike marked
   **Variety** — cherry/plum/vine/roma tomato, gala apple, red/brown onion, curly kale, cavolo nero
   (pending H8), EVOO/grades, flour/bread/rice/chocolate/yogurt types, lentil colours, etc.
4. **Promote aliases into `canonical_food_alias`** (with `alias_type`): plurals, US/UK, spellings,
   abbreviations, and **forms** (`alias_type='form'`: tinned/frozen/dried/ground/flaked/etc.). Source
   them from `ingredient-aliases.ts` + `food-synonyms.ts` + `foods.ts` `aliases[]`. The
   **`UNIQUE(alias_key)`** constraint will *surface every conflict* at seed time — treat a rejected
   insert as a required editorial decision, not an error to suppress.
5. **Mark composites** (`kind='composite'`): mixed seeds/beans/nuts/mushrooms, spice blends, (baked
   beans pending). No member expansion at seed time; diversity counts 1.
6. **Apply the `foods.ts` corrections** from H5/H7 (tahini, lentil parent) **in the canonical seed**,
   leaving the WS0 registry untouched unless separately approved.
7. **Ship `validateCanonicalSeed()`** (mirror of `validateKnowledgeSeed()`): refuses to seed on
   duplicate alias_key, dangling FK, slug-equality breach, or a variety whose diversity group differs
   from its parent. Add **golden tests**: a fixed corpus of real strings → asserted canonical + variety
   + diversity group, so any future drift fails CI.
8. **Do not read it yet.** Seed in shadow (Phase 0/1 of the architecture doc); prove plant-diversity
   parity before any surface switches.

> **Sequencing:** this classification is the input to step 3/4/5. Treat **Section 8** decisions as
> blocking for the *count-affecting* groups (diversity groups, herbs/spices, composites, citrus) and
> non-blocking for the rest (where alias-vs-variety can be refined while still additive).

---

## SECTION 10 — Final report (brief checklist)

1. **Rollback identifier:** annotated tag `rollback/ws1_5-spike-20260618` → commit `df914ad`.
2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.
3. **Classification rules:** five buckets — **Alias** (same food, different words → collapse),
   **Variety** (same plant, named sub-kind → keep, count once), **Form** (same food, different state →
   collapse, optional metadata), **Separate food** (distinct identity), **Composite** (multiple/grouped
   foods → `kind='composite'`, count conservatively). Tie-breakers favour Variety when collapsing would
   lose a choice a user cares about; Alias is the safe-but-flagged default only because aliases are the
   cheapest to reclassify while still additive. (Section 3.)
4. **Classification table:** full term-by-term table across all six sources, grouped by food family.
   (Section 4.)
5. **High-risk terms:** H1–H12, led by cherry-tomato (contradictory today), herbs/spices counting
   (two rules in one file), baby spinach, the mixed-* composites, and the `foods.ts` tahini/lentil
   modelling errors. (Section 6.)
6. **Recommended seed approach:** seed `canonical_food` once from `foods.ts`; seed `diversity_group`
   from `nutrition-variety.ts`; promote varieties → `food_variety`, aliases/forms →
   `canonical_food_alias` (UNIQUE alias_key surfaces conflicts), composites → `kind='composite'`;
   apply tahini/lentil corrections; gate with `validateCanonicalSeed()` + golden tests; seed in shadow,
   read nothing until parity proven. (Section 9.)
7. **Items needing product-owner decision:** herbs/spices counting, baby spinach, citrus collapse,
   cavolo nero, diversity grouping of relatives, grade/type-as-variety, composite expansion policy,
   `foods.ts` data corrections. (Section 8.)
8. **Confirmation:** **No code, schema, migration, seed, data, or app-behaviour changes were made.**
   The only output is this document under `docs/investigations/`, plus the annotated rollback tag. The
   tracked working tree is otherwise clean.
```
