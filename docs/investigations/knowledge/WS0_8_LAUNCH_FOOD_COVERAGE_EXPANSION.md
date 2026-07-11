# WS0.8 — Launch Food Coverage Expansion

**Date:** 2026-06-21
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `ws0.8-rollback-point` (at `761fcb5`)
**Scope:** Production-scale food authoring — canonical + knowledge data. No schema changes. No UI changes.

---

## Status

**COMPLETE — validators pass, 181 canonical / 188 knowledge foods authored**

---

## Rollback Protection

Confirmed before implementation began:

1. Git status: clean
2. WS0.5 investigation: committed and protected (`e371af0`)
3. WS0.6 trial: committed and protected (`83438e5`, tag `ws0.6-rollback-20260621-0519`)
4. WS0.7 investigation: committed and protected (`761fcb5`, tag `ws0.7-rollback-point`)
5. WS0.8 rollback tag created: `ws0.8-rollback-point`

To restore to pre-WS0.8 state:
```
git checkout ws0.8-rollback-point
```

---

## Coverage Goals

| Metric | Before | Target | Achieved |
|--------|--------|--------|---------|
| Canonical foods | 53 | ~200 | **181** |
| Knowledge foods | 69 | ~200 | **188** |
| Diversity groups | 52 | ~140 | **139** |
| Varieties | 24 | — | **57** |
| Aliases | 143 | — | **539** |

---

## Category Strategy

Eight waves, UK household focus, Mediterranean eating bias, lower UPF orientation.

| Wave | Category | Net new target |
|------|----------|---------------|
| 1 | Pantry Essentials | ~16 |
| 2 | Mediterranean Vegetables | ~4 |
| 3 | Beans, Pulses and Legumes | ~3 |
| 4 | Fruit | ~28 |
| 5 | Herbs and Spices | ~16 |
| 6 | Nuts and Seeds | ~10 |
| 7 | Dairy and Alternatives | ~14 |
| 8 | Proteins | ~15 |
| + | Grains & Cereals | ~14 |
| + | Other pantry | ~7 |

---

## WS0.7 Variety Rules Applied

**Rule 1 — INHERIT** (variety uses parent knowledge, no knowledgeFoodSlug):
- All apple varieties (Gala, Braeburn, Granny Smith)
- Orange, clementine, lemon, lime, grapefruit all share "citrus" diversity group
- Grape varieties (red, green)
- Peach varieties (yellow, white)
- Cabbage varieties (savoy, white, green)
- Melon varieties (honeydew, cantaloupe)

**Rule 2 — OVERRIDE** (variety has its own knowledge food):
- Greek yoghurt → variety of "yoghurt" pointing to "greek-yoghurt" knowledge food
  (Rationale: significantly different nutritional profile — strained, much higher protein)
- Red pepper → already established variety of "pepper" (WS0.6)

**Rule 3 — SEPARATE** (separate canonical, separate knowledge):
- Lentil varieties: green-lentils, puy-lentils, beluga-lentils get own knowledge entries
  (Established in WS0.7 investigation; red-lentils already implemented)
- Mushroom varieties already established (WS0.6)

---

## Knowledge Authoring Approach

### New nutrients added
NONE. All nutrient associations use only existing nutrient slugs.

### New health benefits added
NONE. All benefit associations use only existing benefit slugs.

### Conservative editorial rules applied
- Descriptions: UK English, maximum 2 sentences, educational only
- Language: "source of", "rich in", "associated with", "contributes to"
- Never: cures, prevents, treats, proven to, medical claims

---

## Uncertainty Flags

| Food | Flag | Decision |
|------|------|----------|
| Greek yoghurt | Rule 2 vs separate canonical | Made variety under yoghurt with own knowledge |
| Raisins | Alias of grape vs own canonical | Own canonical — distinct product, different nutrition |
| Tahini | Alias of sesame seeds vs own food | Alias — kept as form alias under sesame-seeds |
| Nori/seaweed | Include or not | Excluded — specialist food, not UK staple |
| Butter | Health food or pantry staple | Included — whole food, not UPF |
| Oat milk nutrients | Variable by brand | Conservative: natural oat nutrients listed only |
| Dark chocolate | Plant diversity contribution | Included — cacao is a distinct plant |
| Kimchi diversity group | null or cabbage | null — complex multi-plant ferment |
| Couscous, bulgur, pasta | Own diversity or wheat | Share "wheat" diversity group |
| Lemon, lime, grapefruit | Own citrus or shared | Shared "citrus" diversity group |
| Jackfruit | Include or exclude | Excluded — not yet UK staple |
| Animal protein nutrient | plant-protein slug unusable | Focused on micronutrients only for meat/fish/dairy |
| Savoy cabbage | Separate canonical or variety | Variety under "cabbage" |
| Nectarine | Alias of peach or separate | Separate canonical — distinct in UK shops |
| White rice | Include or not | Included — very common UK pantry staple |
| Sunflower oil | EVOO alternative | Included conservatively |

---

## Canonical Additions

### Wave 1 — Pantry Essentials

potato, sweet-potato, leek, shallot, cauliflower, cabbage (with varieties), butternut-squash, pumpkin, peas, edamame, brussels-sprouts, celeriac, green-beans, radish, kohlrabi, corn

### Wave 2 — Mediterranean Vegetables

lettuce, olives, chard, jerusalem-artichoke
(majority already added in WS0.6)

### Wave 3 — Beans, Pulses and Legumes

cannellini-beans, borlotti-beans, haricot-beans
(lentil varieties get knowledge entries; canonical varieties already in place)

### Wave 4 — Fruit

banana, strawberry, blueberry, raspberry, kiwi, pear, mango, grape, lemon, lime, pomegranate, peach, plum, cherry, nectarine, watermelon, pineapple, fig, apricot, grapefruit, passion-fruit, blackberry, melon, cranberry, blackcurrant, redcurrant, gooseberry, raisins

### Wave 5 — Herbs and Spices

rosemary, thyme, oregano, dill, chives, sage, tarragon, bay-leaf, lemongrass, vanilla, chilli, black-pepper, cardamom, star-anise, cloves, nutmeg
(also: knowledge entries added for ginger, turmeric, cumin, cinnamon, paprika, clementine)

### Wave 6 — Nuts and Seeds

sesame-seeds, hemp-seeds, hazelnuts, cashews, pistachios, brazil-nuts, pine-nuts, pecans, peanuts, macadamia

### Wave 7 — Dairy and Alternatives

milk, yoghurt (with greek-yoghurt variety), cheddar, mozzarella, halloumi, feta, parmesan, ricotta, oat-milk, soy-milk, almond-milk, kefir, tempeh, tofu

### Wave 8 — Proteins

eggs, chicken, turkey, beef, lamb, pork, duck, salmon, sardines, tuna, mackerel, cod, haddock, anchovies, prawns

### Grains and Cereals

oats, brown-rice, white-rice, quinoa, buckwheat, barley, spelt, rye, wheat, couscous, bulgur-wheat, pasta, millet, freekeh

### Other

coconut, dates, dark-chocolate, raisins (also in fruit), butter, sunflower-oil, miso, sauerkraut, kimchi

---

## Knowledge Additions

### New knowledge foods authored (not previously in registry)

Vegetables: potato, leek, shallot, cauliflower, cabbage, butternut-squash, pumpkin, brussels-sprouts, celeriac, green-beans, radish, kohlrabi, corn, lettuce, olives, chard, jerusalem-artichoke

Fruit: raspberry, pear, mango, grape, lemon, lime, pomegranate, peach, plum, cherry, nectarine, watermelon, pineapple, fig, apricot, passion-fruit, blackberry, melon, cranberry, blackcurrant, redcurrant, gooseberry, raisins

Herbs: oregano, dill, chives, sage, tarragon, bay-leaf, lemongrass, vanilla

Spices: chilli, black-pepper, cardamom, star-anise, cloves, nutmeg

Spices (existing canonical, new knowledge): ginger, turmeric, cumin, cinnamon, paprika

Other existing canonical (new knowledge): clementine

Lentil varieties (Rule 3 SEPARATE): green-lentils, puy-lentils, beluga-lentils

Nuts: hazelnuts, cashews, pistachios, brazil-nuts, pine-nuts, pecans, peanuts, macadamia

Grains: oats, brown-rice, white-rice, quinoa, buckwheat, barley, spelt, rye, wheat, couscous, bulgur-wheat, pasta, millet, freekeh

Dairy: milk, yoghurt, greek-yoghurt, cheddar, mozzarella, halloumi, feta, parmesan, ricotta, oat-milk, soy-milk, almond-milk, tofu

Proteins: eggs, chicken, turkey, beef, lamb, pork, duck, tuna, mackerel, cod, haddock, anchovies, prawns

Other: coconut, dates, dark-chocolate, butter, sunflower-oil

---

## Validator Results

Run: 2026-06-21

### validateCanonicalSeed()

PASS — 41 passed, 0 validator failures.

5 "Live DB" failures are expected (DB not yet seeded with WS0.8 data — seed scripts run separately).

Seed counts confirmed:
- `diversity_group`: 139
- `canonical_food`: 181
- `food_variety`: 57
- `canonical_food_alias`: 539

### validateKnowledgeSeed()

PASS — 23 passed, 0 failures.

Knowledge registry counts confirmed:
- `foods`: 188
- `nutrients`: 30 (unchanged — no new nutrients invented)
- `health_benefits`: 15 (unchanged — no new benefits invented)
- `food_nutrients` links: 670
- `food_benefits` links: 503
- `nutrient_benefits` links: 68

---

## Review Effort

### Estimated THA editorial review time

- 119 new knowledge food descriptions × ~3 min each = ~6 hours reading
- 128 new canonical foods × ~2 min alias/variety check = ~4 hours
- Uncertainty flags review (16 items) = ~1 hour
- Total: **approximately 10–12 hours** for a thorough editorial review
- As a lighter pass (spot-check 20%, trust editorial rules for rest): **~3 hours**

### Most common uncertainty flags

1. **Alias coverage** — did we include enough common UK cooking names? (e.g. "silverbeet" for chard, "ground beef" for beef)
2. **Diversity group boundaries** — are raisins correctly separate from grapes? (Yes — distinct product, different nutrition, different shopping choice)
3. **Animal protein nutrient representation** — only micronutrients listed (no "protein" nutrient). Under-represents the main reason people buy meat/fish.
4. **Plant milk diversity group assignment** — oat-milk → oats, soy-milk → edamame, almond-milk → almonds. Correct but might surprise users.
5. **Grapefruit** — assigned to shared "citrus" group with no own knowledge food yet. Acceptable for launch; knowledge entry can follow.

---

## Launch Readiness

### Can THA truthfully say "We understand the foods most households buy"?

**Yes, with high confidence for the core basket.**

THA now covers:
- All major UK alliums ✓
- Full brassica family ✓
- Full legume/pulse range ✓
- All common UK fruit including tropicals and stone fruit ✓
- Full herb rack (fresh and dried) ✓
- Full spice rack (common UK spices) ✓
- Full nut and seed range ✓
- Dairy and the main dairy alternatives ✓
- All common UK proteins (white meat, red meat, oily fish, white fish, shellfish, eggs) ✓
- All major grains including ancient grains ✓
- Fermented foods ✓
- Key pantry staples (coconut, dates, dark chocolate, butter) ✓

### WS7 ready?

**Yes.** The food universe is now large enough and consistent enough to build the WS7 graph. The food-nutrient and food-benefit relationship maps are populated for all 188 knowledge foods.

### 300/500 food feasibility?

**300 foods: Achievable with one more focused wave.** Gaps include:
- More fish varieties (trout, sea bass, sea bream, mussels, clams)
- More grain products (tortillas, naan, bread types)
- More dairy (cream, crème fraîche, cottage cheese)
- South Asian vegetables (bitter melon, drumstick, methi)
- Latin American staples (plantain, yuca)
- Condiments and sauces (soy sauce, fish sauce, Worcestershire sauce)

**500 foods: Requires significant scope expansion** beyond UK household staples into global cuisines, specialist health foods and restaurant ingredients. This is a 6–12 month roadmap, not a single wave.

---

## Risks

1. **Validator collisions** — alias overlap between canonical foods (e.g. "natural yogurt" appearing for both yoghurt aliases and live-yogurt knowledge). Mitigation: canonical alias keys are separate from knowledge aliases; validator only checks canonical uniqueness.

2. **Nutrient accuracy** — plant-protein nutrient cannot be used for animal protein foods. Conservative approach: only list micronutrients for meat/dairy/fish. May underrepresent their nutritional contribution in the app.

3. **Diversity group scale** — adding ~88 new diversity groups. Risk of wrong groupings or duplicates. Mitigation: citrus, rice, wheat are shared groups; validator checks for duplicates.

4. **Knowledge food quality** — descriptions may be inconsistent across 119 new entries. Mitigation: editorial rules applied consistently; THA review recommended.

5. **Lentil variety update** — canonical lentil varieties updated to add knowledgeFoodSlug. Risk of breaking existing resolver. Mitigation: validator will catch missing knowledge slugs.

---

## SUGGESTION (out of scope for WS0.8)

- Add a "protein" nutrient to cover animal protein sources properly
- Add "saturated fat" as a nutrient (needed for dairy, coconut, meat context)
- Add "probiotics" as a sub-type of live-cultures for specific fermented foods
- Review whether kimchi and sauerkraut should share the "cabbage" diversity group
- Discovery: once food universe is complete, connect foods to meal plans via Discovery Engine (WS8)
- Alternatives: protein alternatives section linking e.g. tofu ↔ chicken ↔ tempeh (WS9)
- Seasonal Stories: now possible to author stories about seasonal availability across 200+ foods (WS11)
