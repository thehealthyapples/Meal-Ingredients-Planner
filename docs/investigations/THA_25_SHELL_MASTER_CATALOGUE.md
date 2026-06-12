# THA 25-Shell Master Catalogue — Design Document

**Status:** DESIGN ONLY — for review and approval before any seeding work
**Date:** 2026-06-11
**Rollback tag:** `pre-25-shell-catalogue-design` (commit `43fbdda`)
**Scope guard:** No seed scripts, no SQL, no schema changes, no implementation plans.

---

# SECTION 1 — Executive Summary

## What this catalogue is

This is the first production-quality Meal Shell catalogue for The Healthy Apples: 25 shells (5 breakfast, 8 lunch, 12 dinner) designed as the foundation for Tier-4 Meal Shell Recovery, Shared Meal + Personal Adaptation, the Nutrition Enhancement philosophy, and difficult-household recovery.

## Design philosophy

Every shell in this catalogue is built around one question:

> **"What can be added?"** — never "what must be removed?"

A Meal Shell is a **shared meal architecture**, not a recipe. It consists of:

- **A shared base** everyone at the table eats together — the social anchor of the meal.
- **Open slots** (protein, carb, vegetable, topping, sauce) that each household member fills according to their own needs, restrictions, and preferences.
- **Enhancement opportunities** — whole-food additions (seeds, beans, herbs, fermented vegetables, olive oil, nuts, mushrooms) that raise nutritional diversity without changing the meal's identity.

This means a household with a vegetarian-gluten-free-dairy-free member, a Mediterranean-dairy-free member, and a keto member can all sit down to *the same meal* — Taco Night is still Taco Night whether your taco is in a corn tortilla, a lettuce cup, or piled on cauliflower rice.

## Core design principles applied to every shell

1. **Shared experience first.** The shell name and base must feel like one meal, not parallel meals.
2. **Slots are additive.** A restriction never deletes the meal; it routes the member to a different slot option.
3. **Whole foods, low UPF.** Default slot options are whole-food ingredients; UPF items never appear as defaults.
4. **Gut health is built in.** Every shell carries at least one fibre-diverse and one fermented/live enhancement opportunity.
5. **The hardest household must work.** Every shell is validated against the reference difficult household (Lilly: vegetarian + gluten-free + dairy-free + no eggs + no soy; Daisy: Mediterranean + dairy-free + no eggs; one keto member).

## Scoring summary

Each shell carries an **Adaptability Score (0–100)** weighted across four factors: restriction coverage (35%), ease of adaptation (25%), nutritional enhancement potential (20%), shared meal suitability (20%).

- **Catalogue average:** 88.4
- **Highest:** Build Your Own Salad (96)
- **Lowest:** Leftover Remix (75 — by design; it trades predictability for waste reduction)
- **18 of 25 shells score 85+**, confirming the "build-your-own slot" architecture as THA's strongest shared-meal pattern.

## Headline recommendation

Seed in three phases (Section 6), starting with the five shells that maximise meal-type coverage *and* adaptability: **Taco Night, Build Your Own Salad, Porridge Bar, Curry Night, Jacket Potato Bar.** These five alone can recover a full day of shared meals for the reference difficult household.

---

# SECTION 2 — Breakfast Shells

---

## Shell 1 — Cooked Breakfast

**Adaptability Score: 85**

### 1. Shell Purpose
The weekend anchor breakfast: a hot, plated, component-built breakfast where every element is cooked separately and assembled per person. Designed to prove that a "fry-up" can be a whole-food, vegetable-forward shared meal rather than a UPF processed-meat plate.

### 2. Shared Base Components
- Roasted vine tomatoes
- Garlic-thyme mushrooms (pan or roasted tray)
- Wilted spinach
- Slow-cooked herby butter beans in tomato (the THA "whole-food baked beans")

### 3. Protein Slots
- Free-range eggs (poached / scrambled / fried)
- High-meat-content sausages (97%+ pork, or chicken)
- Smoked salmon
- Halloumi slices
- Smoked tofu rashers *(skip for no-soy members)*
- Extra butter beans / black beans as the protein

### 4. Carb Slots
- Wholegrain sourdough toast
- Gluten-free seeded toast
- Crushed herby new potatoes
- Sweet potato hash
- *Keto route:* skip the carb slot; double mushrooms and avocado

### 5. Vegetable Slots
- Avocado half
- Grilled flat mushrooms (large portobello)
- Charred peppers
- Kale crisps
- Courgette ribbons in the hash

### 6. Topping Slots
- Fresh chives / parsley
- Dukkah sprinkle
- Toasted pumpkin seeds
- Chilli flakes
- Nutritional yeast

### 7. Sauce Slots
- Homemade tomato relish
- Salsa verde
- Extra-virgin olive oil drizzle
- Fermented chilli sauce
- Tahini drizzle

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (beans + tofu/avocado route) · Mediterranean ✓ (salmon + olive oil route) · Dairy-Free ✓ · Gluten-Free ✓ (GF toast or potato route) · Low-Carb ✓ · Keto ✓ (egg/salmon + avocado + mushrooms route)

### 9. Nutrition Enhancement Opportunities
- Butter beans in the shared base (fibre + plant protein for everyone)
- Mushrooms as a default base item (vitamin D when UV-exposed, beta-glucans)
- Pumpkin seed / dukkah sprinkle (zinc, magnesium)
- Fermented chilli sauce or kimchi side (live cultures)
- Wilted spinach folded into the base (folate, polyphenol diversity)
- Extra-virgin olive oil finishing drizzle

### 10. Household Adaptation Examples
- **Lilly (vegetarian, GF, DF, no eggs, no soy):** Shared base in full + butter beans as protein + sweet potato hash + avocado + pumpkin seeds + tomato relish. No egg, sausage, halloumi, or tofu slots used.
- **Daisy (Mediterranean, DF, no eggs):** Shared base + smoked salmon + sourdough + avocado + olive oil drizzle + salsa verde.
- **Keto member:** Shared base (light on beans) + eggs and sausage + no carb slot + double mushrooms + avocado + olive oil.

---

## Shell 2 — Porridge Bar

**Adaptability Score: 88**

### 1. Shell Purpose
The weekday warm-breakfast workhorse: one pot of porridge base, with a toppings bar that turns a plain bowl into a nutritionally diverse, personalised breakfast. The bar format makes enhancement the *point* of the meal.

### 2. Shared Base Components
- Porridge oats cooked in water or milk-of-choice (certified GF oats as house default so the pot stays shared)
- Pinch of sea salt + cinnamon

### 3. Protein Slots
- Stirred-in nut butter (almond / peanut)
- Hemp seeds
- Chia seeds
- Greek yoghurt dollop / coconut yoghurt dollop
- Protein powder stir-in (whey or pea, unsweetened)

### 4. Carb Slots
- The oat base itself
- Banana coins
- Stewed apple
- *Keto route:* swap the bowl base to a chia-flax-coconut "noatmeal" cooked alongside

### 5. Vegetable Slots
- Grated carrot stirred in ("carrot cake porridge")
- Grated courgette (invisible fibre)
- Pumpkin purée swirl

### 6. Topping Slots
- Mixed berries (fresh or frozen-warmed)
- Toasted flaked almonds
- Pumpkin and sunflower seeds
- Ground flaxseed
- Cacao nibs
- Bee pollen / desiccated coconut

### 7. Sauce Slots
- Date-tahini drizzle
- Honey / maple (small-pour)
- Warm berry compote (no added sugar)
- Nut butter drizzle

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (plant milk + coconut yoghurt) · Mediterranean ✓ (nuts, seeds, fruit, olive-oil-toasted oats) · Dairy-Free ✓ · Gluten-Free ✓ (certified GF oats) · Low-Carb ◐ (small bowl, seed-heavy) · Keto ✓ via noatmeal side-pot

### 9. Nutrition Enhancement Opportunities
- Ground flaxseed as a standing default (omega-3 ALA, lignans)
- Grated vegetables stirred into the pot (fibre diversity without flavour cost)
- Mixed seed jar on the bar (rotating 4-seed mix)
- Live yoghurt dollop (cultures)
- Berry compote (polyphenols)
- Cinnamon in the base (glycaemic moderation)

### 10. Household Adaptation Examples
- **Lilly:** GF oat base in oat milk + chia + hemp seeds + berries + flaxseed + date-tahini drizzle. (No soy milk; no yoghurt unless coconut.)
- **Daisy:** Oat base + flaked almonds + berries + olive-oil-toasted seeds + honey small-pour; coconut yoghurt instead of dairy.
- **Keto member:** Chia-flax noatmeal side-pot + nut butter + pumpkin seeds + a few raspberries + coconut yoghurt.

---

## Shell 3 — Smoothie Bowl

**Adaptability Score: 80**

### 1. Shell Purpose
The fast, cold, fruit-and-vegetable-dense breakfast that eats like a treat. The blended base hides vegetable diversity; the topping bar restores texture and adds the enhancement layer. Strong for households with reluctant fruit/veg eaters.

### 2. Shared Base Components
- Thick blended base: frozen banana + frozen berries + spinach handful + milk-of-choice
- Built thick enough to hold toppings (bowl, not glass)

### 3. Protein Slots
- Greek or coconut yoghurt blended in
- Hemp seeds / chia blended in
- Nut butter spoon
- Unsweetened protein powder (pea or whey)

### 4. Carb Slots
- Banana / mango in the blend
- Granola scatter (low-sugar, olive-oil baked)
- GF oat scatter
- *Keto route:* avocado-coconut-berry blend variant (low-fruit)

### 5. Vegetable Slots
- Spinach or kale in the blend (default)
- Frozen cauliflower florets (creaminess, invisible)
- Raw beetroot (colour + nitrates)
- Frozen courgette

### 6. Topping Slots
- Sliced kiwi / berries
- Toasted coconut flakes
- Mixed seeds (pumpkin, sunflower, flax)
- Chopped nuts
- Cacao nibs

### 7. Sauce Slots
- Nut butter drizzle
- Tahini drizzle
- Raw honey thread (optional, small)

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ · Low-Carb ◐ (avocado variant) · Keto ◐ (needs the dedicated low-fruit blend — a second blender run)

### 9. Nutrition Enhancement Opportunities
- Frozen cauliflower/courgette in the blend (fibre with zero flavour cost)
- Beetroot (nitrates, colour-led appeal for children)
- Mixed seed topping as a standing default
- Kefir as the blend liquid (live cultures)
- Spinach handful per bowl (folate)
- Chia soak (omega-3, gel fibre)

### 10. Household Adaptation Examples
- **Lilly:** Oat-milk berry-spinach blend + hemp seeds + GF oat scatter + seed topping. (No soy milk, no dairy yoghurt.)
- **Daisy:** Kefir-free DF blend with coconut yoghurt + berries + nuts + olive-oil granola + honey thread.
- **Keto member:** Avocado-coconut-raspberry blend + seeds + cacao nibs + nut butter; skips granola/banana.

---

## Shell 4 — Overnight Oats Bar

**Adaptability Score: 84**

### 1. Shell Purpose
The zero-morning-effort breakfast: jars built the night before from one shared base recipe, personalised at build time. Ideal for staggered-departure households — the shared experience is the evening build ritual plus identical jar architecture.

### 2. Shared Base Components
- Certified GF oats + chia + milk-of-choice + cinnamon (house ratio, mixed in one bowl then portioned)
- Optional yoghurt fold per jar

### 3. Protein Slots
- Chia (in base)
- Greek / coconut / skyr yoghurt layer
- Nut butter layer
- Hemp seed stir-in
- Protein powder stir-in

### 4. Carb Slots
- The oat base
- Grated apple / mashed banana layer
- Berry layer
- *Keto route:* chia pudding jar (chia + coconut milk, no oats) built alongside in the same session

### 5. Vegetable Slots
- Grated carrot + raisin layer ("carrot cake jar")
- Pumpkin purée layer
- Grated courgette stir-in

### 6. Topping Slots (added at serve time to keep crunch)
- Toasted seeds and nuts
- Granola scatter
- Fresh berries
- Cacao nibs
- Ground flaxseed

### 7. Sauce Slots
- Date paste swirl
- Berry compote
- Tahini or nut-butter drizzle
- Honey thread

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ (certified oats) · Low-Carb ◐ · Keto ✓ via chia-pudding jar

### 9. Nutrition Enhancement Opportunities
- Chia in every jar (default omega-3 + soluble fibre)
- Live yoghurt or kefir layer (cultures, overnight ferment-friendly)
- Grated vegetable layers (fibre diversity)
- Rotating seed-jar topping
- Stewed fruit instead of syrups (whole-fruit sugars + fibre)

### 10. Household Adaptation Examples
- **Lilly:** GF oats + oat milk + chia base; banana layer; seed topping; tahini drizzle. (No dairy/soy/egg anywhere in shell.)
- **Daisy:** Base with coconut yoghurt fold + berry layer + walnut topping + olive-oil granola + honey thread.
- **Keto member:** Coconut-milk chia pudding jar + nut butter layer + raspberries + toasted seeds.

---

## Shell 5 — Avocado Toast Bar

**Adaptability Score: 82**

### 1. Shell Purpose
The fast savoury breakfast/brunch shell: a smashed-avocado shared base with a bread bar and topping bar. Converts the café favourite into a protein- and fibre-complete home meal.

### 2. Shared Base Components
- Big bowl of smashed avocado (lime, sea salt, olive oil)
- Quick-pickled red onion
- Toasting station with two breads out

### 3. Protein Slots
- Poached / fried eggs
- Smoked salmon
- Crumbled feta
- Butter beans smashed with the avocado ("avo-bean smash" — egg-free protein route)
- Dukkah + extra seeds as plant protein top-up

### 4. Carb Slots
- Wholegrain sourdough
- GF seeded loaf
- Rye
- Sweet potato "toasts" (thick roasted slabs)
- *Keto route:* large grilled portobello "toasts" or halloumi slabs

### 5. Vegetable Slots
- Sliced tomato + basil
- Rocket handful
- Roasted cherry tomatoes
- Radish coins
- Grilled asparagus (seasonal)

### 6. Topping Slots
- Dukkah
- Chilli flakes / Aleppo pepper
- Toasted pumpkin seeds
- Microgreens / cress
- Za'atar
- Hemp seeds

### 7. Sauce Slots
- Extra-virgin olive oil
- Balsamic glaze (thread)
- Fermented chilli sauce
- Tahini-lemon drizzle

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (bean-smash route) · Mediterranean ✓ (signature fit) · Dairy-Free ✓ · Gluten-Free ✓ (GF loaf or sweet-potato toasts) · Low-Carb ✓ · Keto ✓ (portobello/halloumi base)

### 9. Nutrition Enhancement Opportunities
- Butter beans folded into the smash (protein + fibre for the whole table)
- Quick-pickled onion as standing base item (acetic acid, prebiotic onion fibre)
- Dukkah and hemp seeds (minerals + plant protein)
- Sourdough as default bread (fermented, lower-GI)
- Microgreens (concentrated micronutrients)
- EVOO finishing pour

### 10. Household Adaptation Examples
- **Lilly:** Avo-bean smash on GF seeded toast + roasted tomatoes + dukkah + pickled onion. (No egg, feta, or salmon slots.)
- **Daisy:** Avocado smash on sourdough + smoked salmon + rocket + EVOO + za'atar; skips egg and feta.
- **Keto member:** Avocado smash on grilled portobello toasts + fried egg + smoked salmon + hemp seeds + chilli oil.

---

# SECTION 3 — Lunch Shells

---

## Shell 6 — Jacket Potato Bar

**Adaptability Score: 89**

### 1. Shell Purpose
The great British shared-lunch equaliser: one tray of baked potatoes, one table of fillings. Near-universal acceptance, trivially gluten-free, and the filling bar is a natural enhancement vehicle. The keto route (swap the potato, keep the fillings) keeps everyone at the same table.

### 2. Shared Base Components
- Tray-baked jacket potatoes (crisped skins, olive oil + salt)
- Tray of baked sweet potatoes alongside (second base by default)
- Dressed leaf bowl for the table

### 3. Protein Slots
- Homemade chilli (beef or three-bean)
- Tuna with olive-oil mayo or yoghurt
- Slow-cooked BBQ pulled chicken
- Herby white beans in tomato
- Grated cheddar / DF cheese
- Cottage cheese

### 4. Carb Slots
- White jacket potato
- Sweet potato
- *Keto route:* roasted celeriac "jacket" or loaded portobello, same fillings

### 5. Vegetable Slots
- Dressed mixed leaves (shared)
- Coleslaw (yoghurt or olive-oil based)
- Roasted broccoli florets
- Sweetcorn
- Charred peppers

### 6. Topping Slots
- Chives / spring onion
- Toasted mixed seeds
- Jalapeños
- Crispy onions (home-fried)
- Nutritional yeast

### 7. Sauce Slots
- EVOO + lemon
- Yoghurt-herb sauce / DF coconut-yoghurt herb sauce
- Fermented hot sauce
- Homemade salsa
- Tahini-lemon

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (bean chilli + DF sauces) · Mediterranean ✓ (tuna + EVOO + leaves) · Dairy-Free ✓ · Gluten-Free ✓ (naturally) · Low-Carb ◐ · Keto ✓ via celeriac/portobello base

### 9. Nutrition Enhancement Opportunities
- Three-bean chilli as the default filling (legume diversity)
- Cool-then-reheat potatoes (resistant starch)
- Seed scatter on any filling
- Sauerkraut/kimchi pot on the bar (fermented)
- Coleslaw with live yoghurt dressing
- Eat-the-skin default (fibre)

### 10. Household Adaptation Examples
- **Lilly:** Sweet potato + three-bean chilli + slaw (DF dressing) + seeds + salsa. Naturally GF; no egg/dairy/soy slots needed.
- **Daisy:** Jacket potato + tuna in EVOO + leaves + peppers + tahini-lemon; no dairy toppings.
- **Keto member:** Celeriac jacket + beef chilli + cheddar + jalapeños + leaves with EVOO.

---

## Shell 7 — Build Your Own Salad

**Adaptability Score: 96**

### 1. Shell Purpose
The purest expression of the THA shell philosophy: every component is a slot, nothing is locked in, and the shared experience is the bar itself. The reference shell for "restriction routes you to a different slot, never away from the table."

### 2. Shared Base Components
- Two leaf bases (e.g., cos + baby spinach/rocket mix)
- House dressing trio made fresh (EVOO-lemon; tahini; yoghurt-herb)
- Toasted seed jar

### 3. Protein Slots
- Grilled chicken strips
- Flaked hot-smoked salmon / tuna
- Boiled eggs (halved)
- Chickpeas (roasted spiced + plain)
- Feta / halloumi cubes
- Lentils (puy, dressed)

### 4. Carb Slots
- Quinoa scoop
- Roasted new potatoes
- Wholegrain pasta spirals / GF pasta spirals
- Croutons (sourdough, olive-oil baked)
- *Keto route:* skip carbs, double avocado + nuts

### 5. Vegetable Slots
- Cherry tomatoes, cucumber, peppers, grated carrot, red onion (raw bar)
- Roasted tray veg (beetroot, squash, broccoli)
- Avocado
- Olives
- Fermented vegetable pot (kraut/kimchi)

### 6. Topping Slots
- Toasted seeds (default jar)
- Chopped walnuts / almonds
- Crispy chickpeas
- Fresh herbs (parsley, mint, basil)
- Nutritional yeast
- Pomegranate seeds

### 7. Sauce Slots
- EVOO + lemon (Mediterranean default)
- Tahini-lemon (vegan default)
- Yoghurt-herb
- Balsamic vinaigrette
- Fermented chilli + lime

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ · Low-Carb ✓ · Keto ✓ — **all seven, with no special preparation runs.**

### 9. Nutrition Enhancement Opportunities
- 30-plant-a-week engine: the raw + roasted veg bar makes plant-count visible and gamified
- Standing fermented pot (live cultures every lunch)
- Legume double-slot (chickpeas + lentils)
- Seed jar default scatter
- Fresh herb handfuls as salad leaves, not garnish
- EVOO as primary dressing fat

### 10. Household Adaptation Examples
- **Lilly:** Leaves + lentils + chickpeas + quinoa + raw bar + avocado + seeds + tahini-lemon. Every slot filled, zero compromises.
- **Daisy:** Leaves + hot-smoked salmon + olives + tomatoes + walnuts + EVOO-lemon; skips egg and feta slots.
- **Keto member:** Leaves + chicken + boiled egg + feta + avocado + olives + seeds + EVOO; no carb slot.

---

## Shell 8 — Grain Bowl

**Adaptability Score: 93**

### 1. Shell Purpose
The warm, structured cousin of the salad bar: a grain base layered with roasted vegetables, protein, and sauce. Batch-cook friendly (grains and tray veg keep for days), making it the meal-prep backbone shell.

### 2. Shared Base Components
- Pot of cooked wholegrain (brown rice / quinoa / buckwheat — house rotation, GF options as default rotation members)
- Tray of roasted seasonal vegetables
- One fresh element (shredded raw cabbage / leaves)

### 3. Protein Slots
- Harissa chicken thighs
- Baked salmon / mackerel
- Crispy chickpeas
- Marinated tempeh *(skip for no-soy members)*
- Soft-boiled egg
- Black beans

### 4. Carb Slots
- Brown rice / quinoa / buckwheat (base)
- Roasted sweet potato cubes
- *Keto route:* cauliflower rice base, same layers

### 5. Vegetable Slots
- Roasted tray (squash, broccoli, red onion, peppers)
- Shredded raw cabbage / carrot
- Steamed greens (kale, chard)
- Edamame *(soy — optional slot)*
- Pickled cucumber

### 6. Topping Slots
- Toasted seeds / dukkah
- Crispy onions
- Fresh coriander / parsley
- Chopped roasted nuts
- Pomegranate / quick-pickled onion

### 7. Sauce Slots
- Tahini-lemon (house default)
- Green herb sauce (zhoug-style)
- Miso-free ginger-lime dressing (no-soy table option)
- Yoghurt-harissa
- EVOO + za'atar

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ (rice/quinoa/buckwheat rotation) · Low-Carb ✓ · Keto ✓ (cauli-rice base)

### 9. Nutrition Enhancement Opportunities
- Grain rotation itself (fibre-type diversity week to week)
- Cooled-grain resistant starch (batch-cooked, fridge-stored)
- Legume slot always stocked (chickpeas/black beans)
- Dukkah + seed defaults
- Pickled/fermented element in every bowl
- Bitter greens in the steam slot (polyphenols)

### 10. Household Adaptation Examples
- **Lilly:** Quinoa + crispy chickpeas + roasted tray + raw cabbage + seeds + tahini-lemon. (Skips tempeh/edamame for soy; egg slot unused.)
- **Daisy:** Buckwheat + baked mackerel + roasted veg + parsley + EVOO-za'atar; no yoghurt sauces.
- **Keto member:** Cauliflower rice + harissa chicken + steamed kale + soft-boiled egg + dukkah + green herb sauce.

---

## Shell 9 — Soup & Side

**Adaptability Score: 84**

### 1. Shell Purpose
The vegetable-density champion: a blended or chunky shared soup pot plus a side-and-topping bar that personalises protein, carb, and texture. One pot can carry 8–10 plants invisibly.

### 2. Shared Base Components
- One big soup pot (rotating: roasted tomato & red pepper / squash & ginger / minestrone-style chunky / leek & white bean)
- Topping bar + side board on the table

### 3. Protein Slots
- White beans blended into the base (default thickener)
- Shredded poached chicken stir-in
- Crispy chickpeas
- Grated cheese / DF alternative
- Cooked lentils stir-in
- Flaked smoked mackerel (for fish-led soups)

### 4. Carb Slots
- Sourdough hunk
- GF seeded roll
- Cooked pasta shapes stir-in (regular + GF pot)
- Rice stir-in
- *Keto route:* no bread; seed crackers + cheese/avocado side

### 5. Vegetable Slots
- The pot itself (6–10 vegetables)
- Raw veg side plate (carrot, cucumber, pepper batons)
- Wilted spinach stir-in at serve
- Roasted veg scatter (keeps texture)

### 6. Topping Slots
- Toasted seeds
- Croutons (sourdough) / GF croutons
- Fresh herbs
- Chilli oil ring
- Crispy onions
- Nutritional yeast

### 7. Sauce Slots
- EVOO swirl
- Yoghurt / coconut-yoghurt swirl
- Pesto spoon (classic or DF basil-cashew)
- Fermented chilli drops

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (veg-stock pots) · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ (GF sides) · Low-Carb ✓ · Keto ✓ (sides swap)

### 9. Nutrition Enhancement Opportunities
- Bean-thickened bases (protein + fibre, replaces cream)
- 8–10-plant pots (diversity in one bowl)
- Live yoghurt swirl added off-heat (cultures survive)
- Seed + crouton crunch layer (keeps soup satisfying, reduces bread reliance)
- Bone broth or well-made veg stock base (minerals)
- Herb-stem-in-stock habit (zero waste, flavour)

### 10. Household Adaptation Examples
- **Lilly:** Squash & ginger pot (veg stock, bean-thickened) + GF roll + seeds + coconut-yoghurt swirl + raw veg plate.
- **Daisy:** Minestrone-style pot + sourdough + EVOO swirl + DF basil-cashew pesto; no cheese topping.
- **Keto member:** Leek & white bean pot, light ladle + shredded chicken stir-in + seed crackers + cheese + chilli oil.

---

## Shell 10 — Mezze Plate

**Adaptability Score: 91**

### 1. Shell Purpose
The grazing shared table: many small whole-food dishes, everyone assembles their own plate. Naturally Mediterranean, naturally inclusive — restrictions simply mean reaching for different bowls. Excellent for guests and difficult-household entertaining.

### 2. Shared Base Components
- Hummus (house-made, generous bowl)
- Chopped salad (tomato-cucumber-parsley)
- Olive bowl + pickle bowl
- EVOO with za'atar dip

### 3. Protein Slots
- Falafel (baked)
- Grilled chicken / lamb skewers
- Sardines / grilled halloumi
- Boiled eggs with dukkah
- Extra legume dips (butter bean mash, spiced lentil dip)

### 4. Carb Slots
- Wholemeal pitta / flatbread
- GF flatbread or corn crackers
- Herbed bulgur or quinoa tabbouleh (quinoa version is the GF default)
- *Keto route:* cucumber boats, lettuce scoops, seed crackers

### 5. Vegetable Slots
- Chopped salad (base)
- Charred peppers and aubergine
- Raw veg batons
- Stuffed vine leaves
- Quick-pickled vegetables

### 6. Topping Slots
- Dukkah
- Toasted pine nuts / pumpkin seeds
- Pomegranate seeds
- Fresh mint and parsley
- Sumac dusting

### 7. Sauce Slots
- Tahini-lemon
- Zhoug (green chilli-herb)
- Yoghurt-mint / coconut-yoghurt mint
- EVOO + za'atar
- Pomegranate molasses thread

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ (signature fit) · Dairy-Free ✓ · Gluten-Free ✓ (quinoa tabbouleh + GF breads) · Low-Carb ✓ · Keto ✓ (scoop-vehicle swap)

### 9. Nutrition Enhancement Opportunities
- Multiple legume dishes per table (hummus + falafel + lentil dip)
- Herb-as-salad tabbouleh (parsley/mint in food quantities)
- Pickle and ferment bowls as standing items
- EVOO as the table's primary fat
- Seed/dukkah dusting on every dip
- Plant-count: a typical mezze table clears 15+ plants

### 10. Household Adaptation Examples
- **Lilly:** Hummus + baked falafel + quinoa tabbouleh + GF flatbread + chopped salad + pickles + tahini-lemon. (Egg/halloumi bowls untouched.)
- **Daisy:** Hummus + sardines + chopped salad + olives + wholemeal pitta + EVOO-za'atar + zhoug; skips egg and yoghurt bowls.
- **Keto member:** Chicken skewers + boiled egg + halloumi + cucumber boats + olives + tahini + dukkah; skips breads and tabbouleh.

---

## Shell 11 — Wrap Bar

**Adaptability Score: 88**

### 1. Shell Purpose
The portable build-your-own lunch: fillings bar plus a wrapper bar. The wrapper slot (wheat / GF / lettuce / nori) is the key adaptation mechanism — same fillings, different vehicle.

### 2. Shared Base Components
- Filling board: shredded crunchy slaw mix (cabbage, carrot)
- Hummus or bean-smash spread (the "glue")
- Dressed leaves

### 3. Protein Slots
- Grilled chicken / leftover roast meat strips
- Falafel
- Tuna or salmon mix
- Spiced black beans
- Halloumi strips
- Boiled egg slices

### 4. Carb Slots (the wrapper bar)
- Wholemeal tortilla / flatbread
- GF wrap (corn or buckwheat)
- *Keto / low-carb route:* large lettuce leaves (gem/iceberg), nori sheets
- Optional rice scoop for burrito-style

### 5. Vegetable Slots
- Slaw (base)
- Cucumber ribbons, pepper strips, grated beetroot
- Avocado slices
- Pickled jalapeños / pickled onion
- Sprouts and cress

### 6. Topping Slots
- Toasted seeds
- Crispy onions
- Fresh coriander / mint
- Chilli flakes
- Crushed nuts

### 7. Sauce Slots
- Tahini-lemon
- Yoghurt-garlic / DF coconut-garlic
- Fermented hot sauce
- Salsa
- Peanut-lime (no-soy satay style)

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ (wrapper swap) · Low-Carb ✓ · Keto ✓ (lettuce/nori wrapper)

### 9. Nutrition Enhancement Opportunities
- Bean-smash spread as default glue (legumes in every wrap)
- Slaw base (raw cruciferous fibre)
- Sprouted seeds slot (enzyme-rich micro-plants)
- Pickled elements (acid + ferment exposure)
- Seed scatter inside the roll
- Wholemeal/buckwheat wrappers over white

### 10. Household Adaptation Examples
- **Lilly:** GF buckwheat wrap + hummus glue + falafel + slaw + beetroot + seeds + tahini-lemon. (No egg/halloumi/soy sauces.)
- **Daisy:** Wholemeal wrap + tuna in EVOO + slaw + avocado + salsa; skips yoghurt-garlic for coconut-garlic.
- **Keto member:** Iceberg wrap ×2 + chicken + halloumi + avocado + pickled jalapeño + fermented hot sauce.

---

## Shell 12 — Bento Box

**Adaptability Score: 89**

### 1. Shell Purpose
The compartmentalised packed lunch: a fixed box architecture (protein / carb / veg / fruit / extra) filled per person from a shared prep session. The shared experience is the Sunday/evening build ritual and the identical box format; the compartments *are* the slots.

### 2. Shared Base Components
- The box architecture itself: 5 compartments — protein, carb, rainbow veg, fruit, "enhancement corner"
- Shared prep board of the week's fillers

### 3. Protein Slots
- Chicken skewers / meatballs (beef or chicken, batch-baked)
- Boiled eggs
- Edamame *(soy — optional)* / roasted chickpeas
- Cheese cubes / DF alternatives
- Salmon flakes
- Falafel bites

### 4. Carb Slots
- Rice balls (brown/sushi rice)
- Mini wholegrain pasta salad / GF pasta salad
- Oatcakes / seed crackers
- Sweet potato wedges (cold-friendly)
- *Keto route:* compartment filled with extra protein + nuts + olives

### 5. Vegetable Slots
- Rainbow raw veg (pepper, cucumber, carrot, sugar snaps, cherry tomatoes)
- Quick-pickled veg pot
- Steamed broccoli with sesame-free dressing
- Avocado (lemon-rubbed)

### 6. Topping Slots
- Seed mix sachet
- Dukkah pot
- Nori strips
- Dried fruit (small, with nuts)
- Olives

### 7. Sauce Slots (mini pots)
- Tahini-lemon
- Yoghurt-herb / coconut-herb
- Salsa
- Hummus pot
- Coconut-aminos dip (the no-soy "soy sauce")

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ · Low-Carb ✓ · Keto ✓ (compartment refill rule)

### 9. Nutrition Enhancement Opportunities
- "Enhancement corner" compartment institutionalises the add-something habit (seeds, ferments, nuts)
- Rainbow-rule for the veg compartment (colour diversity = polyphenol diversity)
- Pickle pot default (ferment exposure)
- Cold rice/pasta (resistant starch)
- Fruit compartment as the dessert (whole fruit over UPF snacks)

### 10. Household Adaptation Examples
- **Lilly:** Falafel + roasted chickpeas / GF pasta salad / rainbow veg / berries / dukkah + hummus pot. (Egg, cheese, edamame slots unused.)
- **Daisy:** Salmon flakes / rice balls / rainbow veg + olives / orange segments / EVOO-herb pot; no egg or dairy compartments.
- **Keto member:** Chicken skewers + boiled egg + cheese / nut-olive compartment instead of carbs / cucumber + avocado / few berries / seed sachet.

---

## Shell 13 — Leftover Remix

**Adaptability Score: 75**

### 1. Shell Purpose
The waste-elimination shell: a structured way to turn any leftover protein, carb, or vegetable into one of three remix formats (fried-rice-style bowl, frittata/chickpea-frittata, loaded flatbread/salad). Lowest predictability, highest sustainability — scored honestly for it.

### 2. Shared Base Components
- The remix format chosen for the day (one pan/tray everyone shares)
- Fresh "lifter" set: herbs, lemon, EVOO, alliums
- Fresh veg top-up (whatever needs using)

### 3. Protein Slots
- Yesterday's roast meat / fish, chopped
- Eggs (binds the frittata route)
- Chickpea-flour batter (egg-free frittata route)
- Tinned beans / lentils (standing top-up)
- Cheese ends (grated in)

### 4. Carb Slots
- Leftover rice (fried-rice route — properly stored/reheated)
- Leftover potatoes (hash route)
- Leftover pasta (frittata di pasta route)
- Flatbread base (pizza-ish route)
- *Keto route:* cauli-rice stir-fry or crustless frittata format

### 5. Vegetable Slots
- All leftover cooked veg (chopped in)
- Fridge-bottom fresh veg (stir-fried/roasted in)
- Frozen peas/spinach/sweetcorn (standing rescue stock)
- Fresh leaves on the side

### 6. Topping Slots
- Toasted seeds
- Fresh herbs (the remix essential)
- Crispy onions
- Chilli flakes
- Lemon zest

### 7. Sauce Slots
- Coconut aminos + ginger (fried-rice route, no-soy default)
- Salsa / fermented hot sauce
- Yoghurt-herb / DF herb sauce
- EVOO + lemon
- Leftover sauces repurposed (gravy, curry sauce)

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (chickpea-frittata / veg fried rice) · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ◐ (depends on the leftovers — rice/potato routes are safe) · Low-Carb ✓ · Keto ✓ (format choice)

### 9. Nutrition Enhancement Opportunities
- Standing bean/lentil top-up (turns any remnant into a complete meal)
- Frozen vegetable rescue stock (peas/spinach always available)
- Herb-heavy finishing (freshness restores appeal and adds polyphenols)
- Seed scatter default
- Ferment pot on the table
- Whole-meal waste reduction is itself a THA health-of-household win

### 10. Household Adaptation Examples
- **Lilly:** Veg fried rice route — leftover rice + tinned chickpeas + frozen peas + fridge veg + coconut aminos + seeds. (Chickpea-frittata if no rice; never the egg route.)
- **Daisy:** Frittata di pasta is out (eggs) — flatbread route with leftover roast veg + tinned sardines + EVOO + herbs, or fried rice with leftover fish.
- **Keto member:** Crustless frittata of leftover roast meat + cheese ends + frozen spinach; or cauli-rice stir-fry with leftover chicken.

---

# SECTION 4 — Dinner Shells

---

## Shell 14 — Taco Night

**Adaptability Score: 95**

### 1. Shell Purpose
The flagship shared-dinner shell: the build-your-own taco table is the strongest social food format there is, and every single element is a slot. The benchmark against which other dinner shells are designed.

### 2. Shared Base Components
- Warmed tortilla stack (corn as house default — naturally GF) + lettuce cups alongside
- Pico de gallo (tomato, onion, coriander, lime)
- Shredded lettuce/cabbage bowl
- Lime wedges

### 3. Protein Slots
- Spiced beef or turkey mince (home spice blend, no packet mixes)
- Shredded chipotle chicken
- Spiced black beans (standing vegan default)
- Grilled fish (fish-taco route)
- Roasted cauliflower-walnut crumble (plant-led second veggie option)

### 4. Carb Slots
- Corn tortillas (GF default)
- Wholewheat tortillas
- Rice scoop (burrito-bowl conversion)
- *Keto route:* lettuce cups, taco-salad bowl

### 5. Vegetable Slots
- Pico de gallo (base)
- Charred peppers and onions
- Sweetcorn (charred)
- Shredded red cabbage
- Avocado / guacamole

### 6. Topping Slots
- Guacamole
- Pickled red onion
- Pickled jalapeños
- Fresh coriander
- Grated cheese / DF cheese
- Toasted pumpkin seeds (pepitas — the native enhancement)

### 7. Sauce Slots
- Fresh salsa (mild + hot)
- Lime crema (yoghurt) / coconut-lime crema (DF)
- Fermented hot sauce
- Chipotle drizzle

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (black beans + DF toppings) · Mediterranean ✓ (fish tacos + avocado + EVOO slaw) · Dairy-Free ✓ · Gluten-Free ✓ (corn default) · Low-Carb ✓ · Keto ✓ (lettuce cups) — **all seven with zero extra cooking runs.**

### 9. Nutrition Enhancement Opportunities
- Black beans on the table every time, even for meat eaters (the "and" not "or" rule)
- Pepitas as the default crunch (zinc, magnesium)
- Double-fermented layer: pickled onions + fermented hot sauce
- Cabbage slaw base (raw cruciferous)
- Guacamole as table fat (whole-food fats over cheese-only)
- Home spice blend (no UPF seasoning packets)

### 10. Household Adaptation Examples
- **Lilly:** Corn tortillas + spiced black beans + charred peppers + guac + pickled onion + pepitas + salsa. Full taco experience, zero compromises.
- **Daisy:** Corn tortillas + grilled fish + cabbage slaw + avocado + coriander + coconut-lime crema.
- **Keto member:** Lettuce cups + beef mince + cheese + guacamole + jalapeños + hot sauce; or a taco-salad bowl.

---

## Shell 15 — Curry Night

**Adaptability Score: 92**

### 1. Shell Purpose
The two-pot shared feast: one meat/fish curry + one legume-vegetable curry from the same base sauce, with a rice-and-sides bar. The shared base sauce keeps it one meal; the two pots plus sides cover virtually every household.

### 2. Shared Base Components
- House curry base (onion, garlic, ginger, tomato, whole spices — batch-made)
- Two pots from one base: Pot A (meat/fish) + Pot B (legume/veg, coconut)
- Rice pot + sides board

### 3. Protein Slots
- Chicken thigh curry (Pot A rotation)
- Fish or prawn curry (Pot A rotation)
- Chickpea & spinach (Pot B standing)
- Dhal (red lentil — side or main)
- Paneer (add-in bowl, kept separate)

### 4. Carb Slots
- Basmati / brown basmati rice (GF naturally)
- Wholemeal chapati / GF chapati
- *Keto route:* cauliflower rice (made alongside in one tray)

### 5. Vegetable Slots
- Spinach wilted into Pot B
- Roasted cauliflower + green beans tray (curry-spiced, served separately)
- Kachumber salad (tomato, cucumber, red onion, lemon)
- Peas into either pot

### 6. Topping Slots
- Fresh coriander
- Toasted flaked almonds / cashews
- Crispy onions (home-fried)
- Nigella and cumin seed sprinkle
- Fresh green chilli

### 7. Sauce Slots
- Coconut yoghurt raita / dairy yoghurt raita (two small bowls)
- Lime pickle (fermented, traditional)
- Mango chutney (small-pour)
- Tamarind drizzle

### 8. Compatible Diets
Vegetarian ✓ (Pot B + dhal) · Vegan ✓ (Pot B coconut-based) · Mediterranean ✓ (fish curry + veg sides) · Dairy-Free ✓ (coconut throughout) · Gluten-Free ✓ (rice-led) · Low-Carb ✓ · Keto ✓ (cauli rice + Pot A)

### 9. Nutrition Enhancement Opportunities
- Dhal as a standing side for every curry night (legumes for all)
- Whole-spice cooking (polyphenols: turmeric, cumin, coriander seed)
- Lime pickle (traditional ferment)
- Kachumber raw salad (raw crunch against soft curry)
- Brown basmati rotation (intact-grain fibre)
- Coconut Pot B = DF richness without cream

### 10. Household Adaptation Examples
- **Lilly:** Pot B chickpea-spinach + dhal + rice + kachumber + coriander + coconut raita + lime pickle. (GF naturally; paneer bowl untouched.)
- **Daisy:** Pot A fish curry + rice + roasted cauliflower tray + kachumber + almonds + coconut raita.
- **Keto member:** Pot A chicken thigh curry + cauliflower rice + green-bean tray + coriander + a spoon of full-fat raita.

---

## Shell 16 — Stir Fry

**Adaptability Score: 87**

### 1. Shell Purpose
The 20-minute vegetable-volume dinner: a blazing-hot shared vegetable base with proteins cooked in batches and sauce added per-bowl (not per-wok), which is the key adaptation trick — the no-soy member gets coconut aminos on the same vegetables.

### 2. Shared Base Components
- Wok-charred vegetable base (cabbage, broccoli, carrot, pepper, spring onion, beansprouts)
- Garlic-ginger aromatics
- Sauce added per bowl, not in the wok (house rule)

### 3. Protein Slots
- Chicken strips (velveted, batch one)
- Prawns / salmon chunks
- Beef strips
- Crispy tofu *(soy — separate batch)*
- Cashew-and-egg (veggie route)
- Edamame *(soy — optional)*; chickpeas as the no-soy plant protein

### 4. Carb Slots
- Wholewheat noodles
- Rice noodles (GF default)
- Brown rice
- *Keto route:* extra wok veg + shirataki or kelp noodles

### 5. Vegetable Slots
- The wok base (6+ vegetables by default)
- Pak choi / tenderstem (quick-steam adds)
- Mushrooms (shiitake for depth)
- Water chestnuts (crunch)
- Frozen peas / sweetcorn rescue adds

### 6. Topping Slots
- Toasted cashews / peanuts
- Sesame seeds
- Crispy onions
- Fresh coriander + spring onion curls
- Chilli crisp (homemade)

### 7. Sauce Slots (per-bowl)
- Tamari (GF soy)
- Coconut aminos (no-soy default)
- Ginger-garlic-honey-lime
- Peanut-lime sauce
- Chilli-sesame oil

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ · Mediterranean ◐ (works as olive-oil veg sauté variant with fish) · Dairy-Free ✓ (naturally) · Gluten-Free ✓ (rice noodles + tamari/aminos) · Low-Carb ✓ · Keto ✓ (noodle swap)

### 9. Nutrition Enhancement Opportunities
- 6-plant wok base minimum (house rule)
- Shiitake mushrooms (beta-glucans, depth without UPF flavourings)
- Cashew/seed finish (minerals + satiety)
- Quick-pickled cucumber side (acid + crunch)
- Kimchi side bowl (fermented, thematically at home)
- Per-bowl saucing keeps sodium visible and controllable

### 10. Household Adaptation Examples
- **Lilly:** Wok veg + chickpeas + rice noodles + cashews + coconut-aminos-ginger sauce. (Tofu, edamame, tamari all skipped — coconut aminos route is first-class, not a workaround.)
- **Daisy:** Wok veg + salmon chunks + rice noodles + sesame + ginger-lime sauce (light); EVOO-finished variant available.
- **Keto member:** Double wok veg + beef strips + shirataki noodles + chilli crisp + coconut aminos.

---

## Shell 17 — Pasta Bar

**Adaptability Score: 86**

### 1. Shell Purpose
The midweek crowd-pleaser made adaptive: two pasta pots (wheat + GF) with shared sauces and a protein/veg/topping bar. Converts the most repetitive family dinner into a diversity vehicle.

### 2. Shared Base Components
- Two pasta pots: wholewheat + GF (brown-rice or lentil pasta)
- House tomato sauce (slow-cooked, 5+ hidden vegetables)
- Dressed leaf bowl for the table

### 3. Protein Slots
- Beef or pork-fennel meatballs (batch-baked)
- Chicken strips
- White beans / lentil-rich sauce option (lentil ragù)
- Tuna stir-in
- Mozzarella / burrata tear / DF alternative

### 4. Carb Slots
- Wholewheat pasta
- GF pasta (brown rice / red lentil — lentil pasta doubles as protein)
- *Keto route:* courgetti / boodles (spiralised, flash-sautéed) with the same sauces

### 5. Vegetable Slots
- Hidden-veg tomato sauce (base)
- Roasted Mediterranean tray (courgette, pepper, aubergine) to fold through
- Wilted spinach stir-in
- Frozen pea stir-in
- Dressed leaves (shared side)

### 6. Topping Slots
- Parmesan / nutritional yeast "parm"
- Toasted pine nuts / pumpkin seeds
- Fresh basil
- Chilli flakes
- Herby sourdough crumb (pangrattato)

### 7. Sauce Slots
- House tomato (base)
- Lentil ragù
- Basil pesto / DF cashew-basil pesto
- EVOO + garlic + chilli (aglio e olio route)
- Tomato-mascarpone (small add for those who want cream)

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (lentil ragù + DF pesto + nutritional yeast) · Mediterranean ✓ (EVOO routes, fish, veg tray) · Dairy-Free ✓ · Gluten-Free ✓ (second pot) · Low-Carb ✓ · Keto ✓ (courgetti)

### 9. Nutrition Enhancement Opportunities
- Lentil ragù as a standing sauce (legume servings inside comfort food)
- 5-veg hidden sauce base
- Lentil pasta in the GF pot (protein-carb)
- Seed + pangrattato toppings (texture without cheese reliance)
- EVOO finishing
- Leaf-bowl-with-every-pasta house rule

### 10. Household Adaptation Examples
- **Lilly:** Red-lentil GF pasta + house tomato sauce + roasted Med tray fold-through + pumpkin seeds + DF cashew pesto.
- **Daisy:** Wholewheat pasta + tuna + aglio e olio + roasted veg + pine nuts + basil; skips cheese toppings.
- **Keto member:** Courgetti + meatballs + house tomato sauce + parmesan + EVOO-chilli.

---

## Shell 18 — Burger Night

**Adaptability Score: 87**

### 1. Shell Purpose
The "fakeaway" that beats the takeaway: a patty bar + bun bar + toppings board. Proves THA can deliver maximal-craving food in whole-food form — the win is what gets *added* (slaw, pickles, beans) not what's taken away.

### 2. Shared Base Components
- Toppings board: lettuce, tomato, red onion, pickles (gherkins + pickled onion)
- House slaw (cabbage-carrot, yoghurt or EVOO dressing)
- Oven chips tray (chunky, olive-oil roasted) + roasted carrot chips alongside

### 3. Protein Slots
- Beef patties (good mince, hand-formed)
- Chicken or turkey patties
- Black-bean and mushroom patty (egg-free, soy-free house veggie patty)
- Grilled halloumi stack
- Portobello "patty"

### 4. Carb Slots
- Wholemeal buns
- GF buns
- *Keto / low-carb route:* lettuce-wrapped burger, or "burger bowl" on slaw
- Chips tray (shared side, plus carrot-chip option)

### 5. Vegetable Slots
- Toppings board (base)
- House slaw
- Grilled mushrooms and onions
- Avocado slices
- Corn on the cob (seasonal side)

### 6. Topping Slots
- Cheese slice / DF cheese
- Avocado / guacamole
- Crispy onions (home-fried)
- Jalapeños
- Fried egg (optional crown)
- Seed-sprinkled slaw top

### 7. Sauce Slots
- House burger sauce (yoghurt-based) / DF version (avocado-based)
- Homemade ketchup (low-sugar)
- Mustard
- Fermented hot sauce
- Garlic aioli / DF aioli

### 8. Compatible Diets
Vegetarian ✓ (bean-mushroom or halloumi) · Vegan ✓ (bean patty + DF sauces) · Mediterranean ◐ (portobello/chicken + avocado + EVOO slaw route) · Dairy-Free ✓ · Gluten-Free ✓ (GF bun / lettuce wrap) · Low-Carb ✓ · Keto ✓ (burger bowl)

### 9. Nutrition Enhancement Opportunities
- Black-bean patty on the grill every burger night (legumes normalised)
- Double-pickle board (gherkins + pickled onions — acid, ferment-adjacent)
- Slaw as a default burger layer, not a side
- Carrot chips alongside potato (root diversity)
- Homemade sauces (kills the UPF condiment shelf)
- Mushroom-blended beef patties option (30% mushroom — fibre into the patty itself)

### 10. Household Adaptation Examples
- **Lilly:** Black-bean-mushroom patty + GF bun + slaw (EVOO) + avocado + pickles + DF burger sauce + chips. (Patty is egg-free and soy-free by design.)
- **Daisy:** Chicken patty + wholemeal bun + avocado + tomato + rocket + DF aioli + carrot chips.
- **Keto member:** Beef patty burger-bowl on slaw + cheese + fried egg + jalapeños + mustard; skips chips, extra avocado.

---

## Shell 19 — Sheet Pan Dinner

**Adaptability Score: 88**

### 1. Shell Purpose
The minimal-effort whole-food dinner: everything roasts on trays, with zone-based tray layout as the adaptation mechanism (protein zones, veg zones, carb tray). One oven, one timer, every diet served.

### 2. Shared Base Components
- Big roast vegetable tray (red onion, peppers, courgette, broccoli — EVOO, herbs)
- Herby roast potato / sweet potato tray
- Lemon wedges + fresh herb finish

### 3. Protein Slots (zoned or on a second tray)
- Chicken thighs (lemon-herb or harissa)
- Salmon fillets (added late)
- Sausages (high-meat)
- Chickpeas roasted among the veg (crisped, standing default)
- Halloumi slabs (added late)

### 4. Carb Slots
- Roast potato tray
- Sweet potato wedges
- Crusty sourdough on the side
- *Keto route:* skip the potato tray portion; double veg zone + avocado side

### 5. Vegetable Slots
- The main veg tray (4+ veg minimum)
- Tenderstem / green beans (late-add zone)
- Cherry-tomato-on-the-vine zone
- Whole roasted garlic heads (squeeze-over)

### 6. Topping Slots
- Toasted seeds / dukkah
- Fresh parsley / basil
- Lemon zest
- Crumbled feta / DF alternative
- Chilli flakes

### 7. Sauce Slots
- Salsa verde (house default)
- Tahini-lemon
- Yoghurt-harissa / coconut-harissa
- EVOO + lemon
- Romesco (pepper-almond)

### 8. Compatible Diets
Vegetarian ✓ (chickpea + halloumi zones) · Vegan ✓ (chickpea zone + tahini/romesco) · Mediterranean ✓ (signature fit — salmon, veg, EVOO) · Dairy-Free ✓ · Gluten-Free ✓ (naturally) · Low-Carb ✓ · Keto ✓ (zone selection)

### 9. Nutrition Enhancement Opportunities
- Chickpeas roasted into the veg tray by default (legumes without a separate pot)
- Whole garlic heads (prebiotic allium, roast-sweet)
- Romesco sauce (nuts + peppers as a sauce)
- 4-veg-minimum tray rule
- Seed/dukkah finish
- Cool-and-keep tray surplus → tomorrow's Grain Bowl / Leftover Remix (cross-shell synergy)

### 10. Household Adaptation Examples
- **Lilly:** Veg tray + crispy chickpea zone + sweet potato wedges + dukkah + tahini-lemon. (Naturally GF/DF/egg-free/soy-free.)
- **Daisy:** Salmon zone + veg tray + roast potatoes + salsa verde + lemon; no feta.
- **Keto member:** Chicken thigh zone + double veg + halloumi + romesco; skips the potato tray.

---

## Shell 20 — Buddha Bowl

**Adaptability Score: 94**

### 1. Shell Purpose
The plant-forward showcase bowl: a formula (greens + grain + legume + roasted veg + raw element + fat + sauce + sprinkle) rather than a recipe. The shell that teaches the THA enhancement formula most explicitly — every component answers "what can be added?"

### 2. Shared Base Components
- The bowl formula itself, posted on the table: GREENS + GRAIN + LEGUME + ROAST + RAW + FAT + SAUCE + SPRINKLE
- Massaged kale / leaf base bowl
- Tahini-lemon house sauce

### 3. Protein Slots
- Legume slot (formula-mandatory): chickpeas, black beans, lentils, edamame *(soy optional)*
- Optional animal add-on: chicken, salmon flakes, soft egg, feta
- Marinated tempeh *(soy — optional)*

### 4. Carb Slots
- Quinoa / brown rice / buckwheat (rotation)
- Roasted sweet potato
- *Keto route:* cauliflower rice + doubled fat slot (avocado, seeds, EVOO)

### 5. Vegetable Slots
- Massaged kale base
- Roasted rainbow veg (beetroot, squash, broccoli)
- Raw slot: shredded carrot, red cabbage, cucumber ribbons
- Sprouts / microgreens
- Fermented slot: kraut or kimchi spoon (formula-encouraged)

### 6. Topping Slots ("sprinkle" slot)
- Toasted mixed seeds
- Dukkah
- Crispy chickpeas
- Chopped herbs
- Pomegranate
- Nutritional yeast

### 7. Sauce Slots
- Tahini-lemon (house)
- Green goddess (herb-cashew, DF)
- Ginger-carrot dressing
- Yoghurt-herb / coconut-herb
- Harissa-EVOO

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (native format) · Mediterranean ✓ · Dairy-Free ✓ · Gluten-Free ✓ · Low-Carb ✓ · Keto ✓ (formula swap) — all seven.

### 9. Nutrition Enhancement Opportunities
- The formula *is* the enhancement framework — legume, raw, ferment, seed slots are structural, not optional extras
- Massaged kale (volume cruciferous base)
- Fermented spoon institutionalised in the formula
- Grain rotation (fibre diversity)
- Seed sprinkle mandatory slot
- Teaches household members to self-build balanced plates (transferable skill — the meta-enhancement)

### 10. Household Adaptation Examples
- **Lilly:** Kale + quinoa + chickpeas + roasted beetroot/squash + raw cabbage + avocado + tahini-lemon + seeds + kraut. (Formula complete with zero exclusion friction.)
- **Daisy:** Leaves + buckwheat + white beans + salmon flakes + raw cucumber + olives + EVOO-harissa + dukkah.
- **Keto member:** Kale + cauli-rice + halloumi or chicken + soft egg + avocado ×2 + seeds + green goddess; light legume spoon.

---

## Shell 21 — Loaded Salad

**Adaptability Score: 92**

### 1. Shell Purpose
The dinner-worthy salad: distinguished from lunch's Build Your Own Salad by being *composed and abundant* — one magnificent shared platter (plus a parallel platter for the divergent diets) rather than a bar. Teaches that salad can be the main event.

### 2. Shared Base Components
- One large composed platter built in layers in front of the household
- Leaf + herb base (cos, rocket, soft herbs in salad quantities)
- Warm element (roasted veg or grilled protein laid over)
- House dressing poured at the table

### 3. Protein Slots
- Griddled chicken / steak slices (rested, fanned)
- Hot-smoked salmon / seared tuna
- Crispy chickpeas + butter beans
- Halloumi / feta crumble
- Soft-boiled eggs, halved
- Lentils dressed warm

### 4. Carb Slots
- Warm roasted new potatoes tossed through
- Quinoa / freekeh scatter
- Sourdough croutons
- *Keto route:* the platter minus potato/grain scatter, double avocado + nuts

### 5. Vegetable Slots
- Leaf + herb base
- Warm roasted veg layer (squash, beets, peppers)
- Raw crunch layer (radish, cucumber, fennel shavings)
- Charred broccoli / asparagus
- Olives, sun-dried tomatoes

### 6. Topping Slots
- Toasted nuts (walnut, almond)
- Seed mix
- Pomegranate
- Crispy onions / capers (briny pop)
- Shaved parmesan / nutritional yeast

### 7. Sauce Slots
- EVOO-lemon-garlic house dressing
- Tahini-herb
- Balsamic-shallot vinaigrette
- Yoghurt-dill / coconut-dill
- Anchovy-free green dressing (and a true Caesar-ish option on the side)

### 8. Compatible Diets
Vegetarian ✓ · Vegan ✓ (legume + tahini build) · Mediterranean ✓ (signature fit) · Dairy-Free ✓ · Gluten-Free ✓ (skip croutons / GF crouton) · Low-Carb ✓ · Keto ✓

### 9. Nutrition Enhancement Opportunities
- Herbs-as-leaves (parsley/mint/basil in salad quantities)
- Warm-roasted + raw in one dish (cooked and raw phytonutrient forms together)
- Double-legume layer standard
- Nut + seed double topping
- Fennel/radish bitter-crunch layer (bitter compounds, digestion)
- EVOO poured generously and visibly (healthy fat as celebration, not restriction)

### 10. Household Adaptation Examples
- **Lilly:** Her platter section: leaves + chickpeas/butter beans + roasted squash + raw fennel + avocado + seeds + tahini-herb; potatoes fine, croutons skipped.
- **Daisy:** Leaves + seared tuna + olives + sun-dried tomato + raw crunch + walnuts + EVOO-lemon-garlic.
- **Keto member:** Leaves + steak slices + soft egg + feta + avocado + olives + seeds + balsamic-shallot; no potato/grain scatter.

---

## Shell 22 — Fajita Night

**Adaptability Score: 93**

### 1. Shell Purpose
The sizzle-platter sibling of Taco Night: one shared skillet of charred peppers and onions at the centre, proteins griddled in batches, build-your-own at the table. The shared sizzling pan is the strongest sensory shared-meal moment in the catalogue.

### 2. Shared Base Components
- The fajita veg skillet: charred peppers (3 colours) + onions, home fajita spice (no packet mixes)
- Warm tortilla stack (corn GF default + wholewheat) + lettuce cups
- Lime wedges + coriander

### 3. Protein Slots
- Chicken strips (fajita-spiced, batch one)
- Steak strips (batch two)
- Prawns (quick batch)
- Spiced black beans + charred corn (standing plant option)
- Portobello strips (griddled with the veg)

### 4. Carb Slots
- Corn tortillas (GF default)
- Wholewheat tortillas
- Spiced rice (burrito-bowl conversion)
- *Keto route:* lettuce cups / fajita bowl over shredded slaw

### 5. Vegetable Slots
- The pepper-onion skillet (base)
- Charred corn
- Shredded lettuce / slaw
- Avocado / guacamole
- Pico de gallo

### 6. Topping Slots
- Guacamole
- Pickled jalapeños + pickled red onion
- Grated cheese / DF cheese
- Fresh coriander
- Pepitas (toasted pumpkin seeds)

### 7. Sauce Slots
- Fresh salsa
- Lime crema / coconut-lime crema (DF)
- Fermented hot sauce
- Chipotle-tomato drizzle

### 8. Compatible Diets
Vegetarian ✓ (bean + portobello) · Vegan ✓ · Mediterranean ✓ (prawn + avocado + slaw route) · Dairy-Free ✓ · Gluten-Free ✓ (corn default) · Low-Carb ✓ · Keto ✓ (lettuce/bowl route)

### 9. Nutrition Enhancement Opportunities
- Three-colour pepper rule (polyphenol breadth in the shared base itself)
- Black beans on every fajita table (the "and" rule again)
- Double-pickle toppings (jalapeño + onion)
- Pepitas crunch default
- Home spice blend (cumin, smoked paprika, oregano — zero UPF)
- Slaw under fajita bowls (raw cruciferous volume)

### 10. Household Adaptation Examples
- **Lilly:** Corn tortillas + black beans & charred corn + skillet peppers + guac + pickled onion + pepitas + salsa.
- **Daisy:** Corn tortillas + prawns + skillet peppers + avocado + coriander + coconut-lime crema.
- **Keto member:** Fajita bowl — slaw base + steak strips + skillet peppers (light) + cheese + guac + jalapeños.

---

## Shell 23 — Chilli Bar

**Adaptability Score: 90**

### 1. Shell Purpose
The batch-cook hero: two pots from one sofrito (beef chilli + three-bean chilli), with a carb bar and toppings board. Freezes perfectly, scales infinitely, and the bean pot makes the plant route the equal headliner, not the understudy.

### 2. Shared Base Components
- Shared sofrito + spice base (onion, garlic, celery, pepper; cumin, smoked paprika, oregano, cocoa touch)
- Pot A: beef chilli (with kidney beans)
- Pot B: three-bean & sweet potato chilli (vegan by default)
- Toppings board

### 3. Protein Slots
- Pot A beef
- Pot B three-bean (kidney, black, pinto)
- Extra black beans stir-in
- Shredded chicken chilli variant (rotation)

### 4. Carb Slots
- Brown rice
- Baked potatoes / sweet potatoes
- Corn tortilla chips (oven-baked, for nachos route)
- Cornbread (when baking)
- *Keto route:* cauliflower rice / over charred cabbage steak

### 5. Vegetable Slots
- Hidden-veg base (celery, peppers, grated carrot in both pots)
- Charred corn stir-in
- Shredded lettuce + tomato (fresh layer)
- Avocado
- Roasted squash chunks in Pot B

### 6. Topping Slots
- Grated cheese / DF cheese
- Avocado / guacamole
- Fresh coriander + spring onion
- Pickled jalapeños
- Toasted pumpkin seeds
- Lime wedges

### 7. Sauce Slots
- Yoghurt / coconut yoghurt dollop
- Fresh salsa
- Fermented hot sauce
- Lime crema / DF lime crema

### 8. Compatible Diets
Vegetarian ✓ (Pot B) · Vegan ✓ (Pot B + DF toppings) · Mediterranean ◐ (Pot B is legume-EVOO-veg aligned) · Dairy-Free ✓ · Gluten-Free ✓ (naturally) · Low-Carb ✓ · Keto ✓ (Pot A light-bean ladle + cauli rice)

### 9. Nutrition Enhancement Opportunities
- Three-bean diversity in Pot B (different fibres, different microbiome feeds)
- Cocoa in the base (polyphenols, depth)
- Hidden sofrito veg in both pots
- Pepita + jalapeño toppings
- Cool-store-reheat (resistant starch in beans and rice; chilli improves overnight)
- Yoghurt dollop added off-heat (live cultures)

### 10. Household Adaptation Examples
- **Lilly:** Pot B + brown rice + avocado + coriander + pepitas + salsa + coconut-yoghurt dollop. (Both pots are naturally GF/egg-free/soy-free.)
- **Daisy:** Pot B over baked potato + avocado + lime + coriander; or light Pot A with fish swapped — Pot B is her natural home.
- **Keto member:** Pot A (light on beans, ladled from the top) + cauliflower rice + cheese + avocado + jalapeños.

---

## Shell 24 — Roast Dinner

**Adaptability Score: 85**

### 1. Shell Purpose
The ceremonial weekly anchor: the meal most strongly associated with shared family eating in the UK. THA's version is component-plated — every element served separately so each plate is built per person — with a vegetable-led centrepiece option co-starring alongside the roast.

### 2. Shared Base Components
- Roast vegetable medley (carrots, parsnips, red onion — honey or maple-EVOO)
- Greens pot (steamed kale / cabbage / broccoli, finished with EVOO or butter on the side)
- Two gravies: meat gravy + onion-mushroom gravy (GF-thickened, vegan — the shared default)

### 3. Protein Slots
- Roast chicken / beef / lamb (rotation)
- Whole roasted cauliflower or celeriac (vegetable centrepiece, dukkah-crusted)
- Stuffed squash (grain or nut-stuffed; nut version is the GF/egg-free route)
- Extra: white beans braised in roast juices or onion gravy

### 4. Carb Slots
- Roast potatoes (olive oil or goose fat — olive oil tray kept separate for plant-based plates)
- Yorkshire puddings (standard + a GF/egg-free flatbread alternative for those who can't have them)
- Mashed swede-carrot
- *Keto route:* skip potatoes/yorkshires; celeriac mash + double greens

### 5. Vegetable Slots
- Roast medley (base)
- Greens pot (base)
- Braised red cabbage (with apple — batch, freezes)
- Cauliflower (roasted, or cheese-sauced as a separate dish)
- Peas

### 6. Topping Slots
- Dukkah (for the veg centrepiece)
- Toasted seeds over greens
- Fresh herbs (rosemary, thyme, parsley)
- Crispy sage
- Apple sauce / mint sauce / horseradish (tradition slot)

### 7. Sauce Slots
- Meat gravy
- Onion-mushroom gravy (vegan, GF — always made)
- Bread sauce (optional, with GF route)
- EVOO + lemon for greens
- Salsa verde (the modern roast upgrade)

### 8. Compatible Diets
Vegetarian ✓ (veg centrepiece + veg gravy) · Vegan ✓ (same, olive-oil potatoes) · Mediterranean ✓ (chicken + EVOO veg + salsa verde) · Dairy-Free ✓ (component plating) · Gluten-Free ✓ (GF gravies, yorkshire swap) · Low-Carb ✓ · Keto ✓ (plate composition)

### 9. Nutrition Enhancement Opportunities
- Vegetable centrepiece normalised alongside the meat (not a substitute — a co-star)
- Braised red cabbage (anthocyanins; batch + freeze)
- White beans in gravy juices (legumes inside tradition)
- Seeds/dukkah over greens and centrepiece
- Bone-stock gravy (when meat-roasting)
- Leftover pipeline: roast → Leftover Remix / Wrap Bar / Bento (cross-shell synergy by design)

### 10. Household Adaptation Examples
- **Lilly:** Dukkah-crusted roast cauliflower + olive-oil roasties + greens (EVOO) + red cabbage + onion-mushroom gravy + GF flatbread instead of yorkshire. (Nut-stuffed squash on rotation weeks.)
- **Daisy:** Roast chicken + olive-oil roasties + greens + roast medley + salsa verde; skips yorkshires and bread sauce (eggs/dairy).
- **Keto member:** Roast beef + celeriac mash + double greens + cauliflower + meat gravy; no potatoes or yorkshire.

---

## Shell 25 — Mediterranean Tray Bake

**Adaptability Score: 91**

### 1. Shell Purpose
The Mediterranean philosophy in one tray: vegetables as the headline, fish/legumes as protein, olive oil as the fat, herbs as the flavour engine. The shell that most directly encodes THA's gut-health and low-UPF values into a single dinner.

### 2. Shared Base Components
- The big tray: courgette, aubergine, peppers, red onion, cherry tomatoes on the vine, whole garlic, oregano, generous EVOO
- Butter beans nestled into the tray (standing default — they roast in the juices)
- Lemon halves roasted on the tray

### 3. Protein Slots
- Whole fish fillets / sea bass / salmon (laid on top, final 12 minutes)
- Chicken thighs (started first, veg added around)
- The tray's own butter beans (plant route — already in)
- Halloumi slabs (final 10 minutes)
- Prawns (final 6 minutes)

### 4. Carb Slots
- Crusty sourdough for the juices
- GF bread / herbed rice on the side
- Baby potatoes roasted into the tray
- *Keto route:* no potatoes in one tray corner; bread skipped, extra olives + feta

### 5. Vegetable Slots
- The tray itself (6+ vegetables)
- Wilted spinach folded in at the end
- Olives scattered for the last 10 minutes
- Fennel wedges (rotation)
- Artichoke hearts (jarred in olive oil)

### 6. Topping Slots
- Crumbled feta / DF alternative
- Toasted pine nuts / flaked almonds
- Fresh basil and parsley (handfuls)
- Capers
- Lemon zest + roasted lemon squeeze

### 7. Sauce Slots
- The tray juices (EVOO + tomato + garlic = the sauce)
- Salsa verde
- Tahini-lemon
- Yoghurt-mint / coconut-mint
- Romesco

### 8. Compatible Diets
Vegetarian ✓ (beans + halloumi) · Vegan ✓ (bean tray + DF toppings) · Mediterranean ✓ (the definitional shell) · Dairy-Free ✓ · Gluten-Free ✓ (rice/GF bread) · Low-Carb ✓ · Keto ✓ (corner-zoning + bread skip)

### 9. Nutrition Enhancement Opportunities
- Butter beans roasting in tray juices (legumes absorbed into the meal's identity)
- Whole roasted garlic (prebiotic, sweetened by roasting)
- 6-veg tray minimum
- EVOO used generously and heated gently (polyphenol-rich fat as the foundation)
- Caper/olive briny layer
- Herb handfuls as a finishing vegetable, not garnish

### 10. Household Adaptation Examples
- **Lilly:** The tray + its butter beans + herbed rice + olives + pine nuts + salsa verde. (Fish/halloumi zones untouched; naturally GF/DF/egg-free/soy-free.)
- **Daisy:** The tray + sea bass on top + sourdough for juices + capers + lemon + basil. Her definitional dinner.
- **Keto member:** Tray corner without potatoes + salmon + olives + feta + almonds + extra EVOO.

---

# SECTION 5 — Top 10 Highest Adaptability Shells

| Rank | Shell | Meal | Score | Why it leads |
|------|-------|------|-------|--------------|
| 1 | Build Your Own Salad | Lunch | **96** | Every component is a slot; all 7 diets served with zero extra prep runs; the bar *is* the shared experience. |
| 2 | Taco Night | Dinner | **95** | Strongest social format in the catalogue; corn-default makes GF invisible; lettuce cups make keto first-class. |
| 3 | Buddha Bowl | Dinner | **94** | The formula structurally embeds legume, ferment, raw, and seed slots — enhancement is the architecture. |
| 4 | Grain Bowl | Lunch | **93** | Batch-cook backbone; grain rotation + cauli-rice route covers every diet; meal-prep multiplier. |
| 5 | Fajita Night | Dinner | **93** | Shared sizzle-skillet centrepiece; batched proteins; corn/lettuce vehicles; bean option always on. |
| 6 | Curry Night | Dinner | **92** | Two pots from one base sauce keeps it one meal; dhal-for-all rule; coconut Pot B solves DF richness. |
| 7 | Loaded Salad | Dinner | **92** | Composed abundance proves salad-as-dinner; warm+raw layering; double-legume standard. |
| 8 | Mezze Plate | Lunch | **91** | Grazing format makes restriction invisible — you simply reach for different bowls; 15+ plants per table. |
| 9 | Mediterranean Tray Bake | Dinner | **91** | Beans roasted into the shared base; protein laid on top in zones; the THA philosophy in one tray. |
| 10 | Chilli Bar | Dinner | **90** | Two pots, one sofrito; freezer-scaling hero; the bean pot is a headliner, not an understudy. |

**Pattern across the top 10:** every one of them either (a) is a bar/build format where the slot architecture is visible on the table, or (b) splits one shared base into two pots/zones. These are the two mechanisms THA should treat as canonical shell patterns.

**Just outside:** Jacket Potato Bar (89), Bento Box (89), Sheet Pan Dinner (88), Porridge Bar (88), Wrap Bar (88) — all production-ready, none weak.

**Honest tail:** Leftover Remix (75) scores lowest because its inputs are unpredictable, but it is strategically essential — it is the shell that closes the loop on Roast Dinner, Sheet Pan, and Chilli Bar surpluses.

---

# SECTION 6 — Recommended Initial Seed Order

Seeding should optimise for: (1) immediate Tier-4 recovery coverage across all three meal types, (2) the reference difficult household working end-to-end from day one, (3) batch-cook/cross-shell synergy arriving early.

## Phase 1 — Core Five (seed first)

| # | Shell | Meal | Score | Rationale |
|---|-------|------|-------|-----------|
| 1 | Taco Night | Dinner | 95 | Flagship; proves the whole philosophy in one meal; highest family-acceptance dinner. |
| 2 | Build Your Own Salad | Lunch | 96 | Highest score in catalogue; the reference implementation of slot architecture. |
| 3 | Porridge Bar | Breakfast | 88 | Best weekday breakfast coverage; cheapest; enhancement-bar format. |
| 4 | Curry Night | Dinner | 92 | Two-pot pattern exemplar; batch-cook; strongest DF coverage. |
| 5 | Jacket Potato Bar | Lunch | 89 | Universal acceptance; naturally GF; lowest-skill entry shell for struggling households. |

*Phase 1 alone gives every household — including the reference difficult household — a complete recoverable day (breakfast, lunch, dinner) with two dinner alternatives.*

## Phase 2 — Coverage Eight (seed second)

| # | Shell | Meal | Score | Rationale |
|---|-------|------|-------|-----------|
| 6 | Buddha Bowl | Dinner | 94 | Embeds the enhancement formula; vegan-native option arrives. |
| 7 | Grain Bowl | Lunch | 93 | Meal-prep backbone; pairs with Sheet Pan surplus. |
| 8 | Sheet Pan Dinner | Dinner | 88 | Lowest-effort dinner; feeds Grain Bowl and Leftover Remix. |
| 9 | Fajita Night | Dinner | 93 | Second build-your-own dinner; variety against Taco Night. |
| 10 | Overnight Oats Bar | Breakfast | 84 | Zero-morning-effort breakfast; staggered households. |
| 11 | Stir Fry | Dinner | 87 | Fastest dinner; per-bowl saucing pattern exemplar (solves soy). |
| 12 | Chilli Bar | Dinner | 90 | Freezer/batch hero; winter anchor. |
| 13 | Wrap Bar | Lunch | 88 | Portable lunch; wrapper-bar adaptation pattern. |

## Phase 3 — Completion Twelve (seed third)

| # | Shell | Meal | Score |
|---|-------|------|-------|
| 14 | Mezze Plate | Lunch | 91 |
| 15 | Mediterranean Tray Bake | Dinner | 91 |
| 16 | Loaded Salad | Dinner | 92 |
| 17 | Pasta Bar | Dinner | 86 |
| 18 | Burger Night | Dinner | 87 |
| 19 | Bento Box | Lunch | 89 |
| 20 | Cooked Breakfast | Breakfast | 85 |
| 21 | Roast Dinner | Dinner | 85 |
| 22 | Soup & Side | Lunch | 84 |
| 23 | Avocado Toast Bar | Breakfast | 82 |
| 24 | Smoothie Bowl | Breakfast | 80 |
| 25 | Leftover Remix | Lunch | 75 — seed **last deliberately**: it depends on other shells existing to generate leftovers. |

## Sequencing principles applied

1. **Recovery first:** Phase 1 guarantees Tier-4 Meal Shell Recovery can always offer a full day, for any household, before anything else ships.
2. **Patterns before variations:** each phase introduces a new shell *pattern* (bar, two-pot, formula, zoned tray, per-bowl sauce, wrapper swap) before seeding its siblings.
3. **Synergy ordering:** producers of leftovers (Sheet Pan, Chilli, Roast) are seeded before or alongside their consumers (Grain Bowl, Leftover Remix).
4. **Honest tail last:** the lowest-scoring shells are still seeded — diversity matters more than uniform scores — but they ship after the foundations are proven.

---

---

# SECTION 7 — THA Production Recommendation

Each shell is assessed independently for initial production seeding readiness. All 25 shells are recommended for eventual seeding (YES); the phase assignment reflects the order in which value is maximised and dependencies are respected.

**Key for Phase column:**
- **Phase 1** — seed immediately; essential for baseline Tier-4 recovery and difficult-household coverage
- **Phase 2** — seed once Phase 1 is proven; adds patterns, batch-cook infrastructure, and meal-type breadth
- **Phase 3** — seed once Phase 2 culture is established; completes coverage, niche formats, and synergy consumers

---

## Shell 1 — Cooked Breakfast

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Strong weekend anchor (score 85) and the highest-trust breakfast format for adults. Placed in Phase 3 because weekday breakfast is already covered by Porridge Bar (Phase 1) and Overnight Oats (Phase 2); the cooked breakfast requires more components than any other breakfast shell and benefits from households having adopted the whole-food slot mindset first. |

---

## Shell 2 — Porridge Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 1 |
| **Reasoning** | The highest-priority breakfast shell in the catalogue (score 88). Cheapest per serving, lowest skill barrier, and the "toppings bar makes enhancement the point" format introduces the THA philosophy through a meal every household already owns. Certified GF oats as house default means the shared pot works for every member simultaneously. Tier-4 breakfast recovery cannot be considered complete without it. |

---

## Shell 3 — Smoothie Bowl

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Solid plant-density vehicle (score 80) but the lowest-scoring breakfast shell. The keto route requires a dedicated second blender run, making it the only breakfast shell where one household member cannot share the same batch. Phase 1/2 breakfast slots cover weekday and weekend needs; Smoothie Bowl completes variety rather than filling a gap. Best positioned after households are comfortable with the enhancement-bar concept. |

---

## Shell 4 — Overnight Oats Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | The zero-morning-effort breakfast (score 84). Natural follow-on from Porridge Bar — same ingredients, different format, adds the evening-ritual shared experience and handles staggered-departure households that Phase 1 doesn't fully address. The chia-pudding keto alternative built alongside makes this the most operationally versatile breakfast shell. |

---

## Shell 5 — Avocado Toast Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | A nutritionally complete savoury breakfast/brunch shell (score 82) with strong Mediterranean and plant-protein alignment. Positioned Phase 3 because breakfast is well-covered from Phase 1/2 and this shell's strongest use-case — weekend brunch, guests, slower mornings — is unlocked once the household has normalised the whole-food slot habit. The avo-bean smash protein route is worth introducing for its own merits. |

---

## Shell 6 — Jacket Potato Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 1 |
| **Reasoning** | The lowest-skill-barrier lunch in the catalogue (score 89). Naturally GF, universally accepted by children and adults, trivially batch-scalable. The filling bar format is as close to "no restriction can fail" as a hot lunch gets. Alongside Build Your Own Salad, it ensures the difficult-household reference test passes from day one of seeding. The jacket potato is also the keto-accessible base that doesn't require a replacement cook — celeriac "jacket" uses identical fillings. |

---

## Shell 7 — Build Your Own Salad

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 1 |
| **Reasoning** | Highest adaptability score in the catalogue (96). All seven target diets are served with zero extra preparation runs. The bar format makes the shell architecture visible and teachable to households. It is the reference implementation of THA's slot philosophy and the benchmark against which all other shells are designed. Must be in Phase 1 to prove the whole system works. |

---

## Shell 8 — Grain Bowl

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | The batch-cook backbone shell (score 93). Introduces grain rotation as a deliberate fibre-diversity practice, and pairs with Sheet Pan Dinner surplus as a day-two meal. Positioned Phase 2 because its value multiplies only once households are building surplus from Sheet Pan and other roast-based shells. The cauliflower-rice keto route is first-class here, not a workaround. |

---

## Shell 9 — Soup & Side

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | The vegetable-density champion (score 84): one pot can carry 8–10 plants invisibly. However, GF status depends on the carb side chosen, and the adaptability score is lower than Phase 1/2 lunch shells. Strongest in autumn and winter; positioned Phase 3 to allow the bean-thickening technique (established through Curry Night and Chilli Bar in Phase 2) to arrive before households encounter it here. |

---

## Shell 10 — Mezze Plate

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Excellent score (91) and the best guest-entertaining and difficult-household lunch. However, the mezze table requires more components (7–10 dishes) than any other lunch shell — the prep complexity means households need the whole-food batch-cook confidence that Phase 2 builds first. Once seeded, the 15+ plant-count per table and the grazing format make restrictions completely invisible. |

---

## Shell 11 — Wrap Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | Introduces the wrapper-vehicle adaptation pattern (score 88): same fillings, different physical format for each diet. This is a canonical THA mechanic — the wrapper slot is the clearest demonstration that restriction routes to a different slot, never away from the table. Pairs naturally with batch proteins from Sheet Pan or Curry Night. Portable lunch format fills a gap that Phase 1 shells leave open. |

---

## Shell 12 — Bento Box

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | The compartment-architecture shell (score 89) institutionalises the "enhancement corner" habit and teaches household members to self-build balanced plates portably. Requires the Sunday batch-cook culture that Phase 2 shells build; the box format is most powerful when there is already cold grain, roasted veg, and cooked protein to draw from. Positioned Phase 3 deliberately — it is a multiplier on existing habits, not a foundation-layer. |

---

## Shell 13 — Leftover Remix

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 (seed last) |
| **Reasoning** | The lowest-scoring shell (75) by design — inputs are inherently unpredictable. However, it is strategically essential: it closes the waste loop on every other shell in the catalogue, converting Roast Dinner, Sheet Pan, Chilli Bar, and Curry Night surpluses into complete additional meals. It must be seeded last because it only functions once other shells are generating leftovers; seeding it early would produce a shell that rarely triggers. The chickpea-flour frittata route is the most important innovation here for restricted households (egg-free, GF). |

---

## Shell 14 — Taco Night

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 1 |
| **Reasoning** | The flagship shell (score 95). Corn tortillas as house default makes GF invisible — no household member is aware of an adaptation. All seven target diets are served with zero additional cooking runs. Black beans on the table every Taco Night alongside the meat option is the single best demonstration of the "and, not or" nutrition principle. Highest family-acceptance dinner in the catalogue. Must be the first dinner households encounter in the system. |

---

## Shell 15 — Curry Night

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 1 |
| **Reasoning** | Score 92 and the definitive two-pot-from-one-base pattern exemplar. The Pot A + Pot B architecture from one shared sofrito is THA's most important dinner scaling technique — it appears again in Chilli Bar (Phase 2) and is referenced throughout the catalogue. Coconut Pot B solves DF richness in a way no other dinner shell matches. Dhal as a standing side ensures every table has a legume dish regardless of dietary route. A Phase 1 must: it proves the two-pot system to households immediately. |

---

## Shell 16 — Stir Fry

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | The fastest dinner in the catalogue (20 minutes, score 87) and the canonical exemplar of per-bowl saucing — the technique that solves soy restriction elegantly without requiring a parallel dish. Positioned Phase 2 because the no-soy/coconut-aminos substitution is better introduced after the concept of "slot adapts, not meal changes" has been learned from Phase 1. Shiitake mushrooms as a default wok ingredient are the beta-glucan delivery mechanism for households who will never cook mushrooms intentionally. |

---

## Shell 17 — Pasta Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Strong cross-household appeal and comfort-food legitimacy (score 86). Requires two pasta pots simultaneously — the operational overhead is manageable but higher than Phase 1/2 dinners. The hidden-veg tomato sauce (5+ vegetables) and lentil ragù as a standing sauce option are important nutrition contributions, but these techniques are most confidently executed after households have learned batch cooking through Curry Night and Chilli Bar. The lentil GF pasta doubling as protein is a significant detail worth communicating at seed time. |

---

## Shell 18 — Burger Night

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | The fakeaway-replacement shell (score 87): proves THA can satisfy maximum-craving food in whole-food form. Positioned Phase 3 because it relies on the household already valuing the health philosophy — a burger night seeded too early risks reinforcing the UPF-condiment-and-processed-patty habit it is designed to replace. The black-bean-mushroom patty (egg-free, soy-free) is the standout innovation. Once households have Phase 1/2 foundations, Burger Night lands as a celebration rather than a compromise. |

---

## Shell 19 — Sheet Pan Dinner

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | The minimal-effort whole-food dinner (score 88) and the primary surplus generator for Grain Bowl and Leftover Remix. Zone-based tray layout is the adaptation mechanism — protein zones keep different proteins separate without separate pans. Chickpeas roasted into the veg tray by default is the key enhancement pattern: legumes arrive without a second dish. Seeding in Phase 2 when batch-cook culture is being built maximises the cross-shell surplus pipeline immediately. |

---

## Shell 20 — Buddha Bowl

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | Score 94 and the most explicitly educational shell in the catalogue: the GREENS + GRAIN + LEGUME + ROAST + RAW + FAT + SAUCE + SPRINKLE formula teaches households the THA enhancement framework as a meal-building skill they can transfer to other contexts. The formula makes legume, fermented, and seed slots structural rather than optional. Positioned Phase 2 — slightly later than its score warrants — because the formula is most powerful when households already know what grain rotation and roasted legumes look like from Curry Night and Jacket Potato Bar. |

---

## Shell 21 — Loaded Salad

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Score 92 and the composed-platter sibling of Build Your Own Salad. Distinguished from lunch's salad bar by the dinner-occasion framing — a magnificent shared platter rather than a self-service bar. Positioned Phase 3 because the cultural shift ("salad as a dinner worth celebrating") requires the philosophy to have been normalised through Phase 1/2 first. Warm-and-raw layering in a single platter is one of the catalogue's strongest nutrition techniques; once households accept it, it becomes a weekly rotation. |

---

## Shell 22 — Fajita Night

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | Score 93 and the shared-sizzle anchor: the cast-iron skillet of charred peppers arriving at the table is the strongest sensory shared-meal moment in the dinner half of the catalogue. Provides variety against Taco Night without duplicating it — different vehicle architecture, different protein batching rhythm. Three-colour pepper rule in the shared base delivers polyphenol breadth before anyone has served their own plate. Seeded in Phase 2 to consolidate the build-your-own dinner pattern after Taco Night proves it in Phase 1. |

---

## Shell 23 — Chilli Bar

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 2 |
| **Reasoning** | The freezer hero and batch-cook scaling shell (score 90). Two pots from one sofrito is the same pattern as Curry Night — seeding them both in Phase 2 reinforces the pattern across two different cuisine contexts. Three-bean Pot B (kidney, black, pinto) is the most important legume-diversity vehicle in the dinner half of the catalogue. Cocoa in the base is the flagship example of a whole-food flavour depth technique that replaces UPF spice packets. Freezes perfectly, scales to any household size. |

---

## Shell 24 — Roast Dinner

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Score 85 and the highest cultural-value shell in the catalogue. The weekly roast is the meal most associated with shared family eating in the UK, and THA's component-plated version proves the philosophy works even for the most tradition-bound meal. Positioned Phase 3 because execution complexity is the highest of any shell (multiple concurrent elements, two gravies, vegetable centrepiece alongside the meat) and because the leftover pipeline (Roast → Wrap Bar → Bento Box → Leftover Remix) requires those consumer shells to already be seeded. The vegan onion-mushroom gravy always made alongside the meat gravy is the centrepiece innovation. |

---

## Shell 25 — Mediterranean Tray Bake

| Field | Value |
|-------|-------|
| **Recommended for initial production seed** | YES |
| **Priority** | Phase 3 |
| **Reasoning** | Score 91 and the definitional shell for THA's gut-health and low-UPF philosophy: EVOO as the foundation fat, vegetables as the headline, butter beans roasting in the tray juices as the default. Positioned Phase 3 not for quality reasons — this is one of the most complete shells in the catalogue — but because Sheet Pan Dinner (Phase 2) already covers the one-tray format. Mediterranean Tray Bake arrives as a philosophical deepening rather than a format introduction, and lands most powerfully when households already understand why the tray-bake model is THA's lowest-effort, highest-nutrition dinner pattern. |

---

# FINAL SUMMARY — Catalogue Statistics and Strategic Assessment

## Quantitative Summary

| Metric | Value |
|--------|-------|
| **Total shells** | 25 |
| **Breakfast shells** | 5 (Shells 1–5) |
| **Lunch shells** | 8 (Shells 6–13) |
| **Dinner shells** | 12 (Shells 14–25) |
| **Average adaptability score** | **88.4** |
| **Highest scoring shell** | Build Your Own Salad — **96** |
| **Lowest scoring shell** | Leftover Remix — **75** (by design) |
| **Shells scoring 85 or above** | 21 of 25 (84%) |
| **Shells serving all 7 target diets with zero extra cooking runs** | 7 (Taco Night, Build Your Own Salad, Buddha Bowl, Grain Bowl, Fajita Night, Mezze Plate, Mediterranean Tray Bake) |
| **Phase 1 shells** | 5 |
| **Phase 2 shells** | 8 |
| **Phase 3 shells** | 12 |
| **All 25 recommended for production seeding** | YES |

---

## Top 5 Most Important Shells for Smart Planner Recovery

These are the five shells the Smart Planner's Tier-4 Meal Shell Recovery should prioritise when recovering a failed plan slot. Selection criteria: (1) highest adaptability score, (2) all target diets served with zero extra cooking runs, (3) lowest skill and ingredient barriers, (4) coverage of the meal type most likely to fail (dinner).

| Rank | Shell | Meal | Score | Why it leads for recovery |
|------|-------|------|-------|--------------------------|
| 1 | **Build Your Own Salad** | Lunch | 96 | All 7 diets; no special prep; bar format means any ingredient subset still produces the shell; most failure-tolerant structure in the catalogue. |
| 2 | **Taco Night** | Dinner | 95 | All 7 diets with zero extra runs; corn tortillas + lettuce cups are pantry-stable alternatives; spiced black beans as standing plant protein makes recovery trivially executable from a minimal stock. |
| 3 | **Jacket Potato Bar** | Lunch | 89 | Naturally GF; trivially executed; near-universal acceptance including children; fillings are largely pantry and fridge items (beans, tuna, yoghurt) that survive imperfect shopping weeks. |
| 4 | **Curry Night** | Dinner | 92 | Two pots solve virtually every diet restriction from one preparation; the batch-cook nature means it can also serve as a plan-ahead insurance dinner cooked in advance and reheated. |
| 5 | **Porridge Bar** | Breakfast | 88 | The most reliable breakfast recovery: certified GF oats, one pot, infinite topping variants. Recovers any failed breakfast slot for any household composition from a small number of stable pantry ingredients. |

**Recovery pattern:** all five share a single property — the adaptation mechanism lives in the slot options, not in the cooking method. A household with half the expected ingredients still executes the shell successfully. This is the defining property the Smart Planner should use when scoring candidate recovery shells.

---

## Top 5 Most Important Shells for Nutrition Enhancement Philosophy

These are the five shells that most directly embody and teach THA's nutrition enhancement philosophy: "What can be added?" — whole-food diversity layered onto shared meals without changing their identity.

| Rank | Shell | Meal | Score | Why it leads for enhancement |
|------|-------|------|-------|------------------------------|
| 1 | **Buddha Bowl** | Dinner | 94 | The formula (GREENS + GRAIN + LEGUME + ROAST + RAW + FAT + SAUCE + SPRINKLE) makes legume, fermented, raw, and seed slots *structural* — they are not optional extras, they are the shell. The most explicitly educational enhancement vehicle in the catalogue; households that internalise the formula can self-build balanced plates for life. |
| 2 | **Build Your Own Salad** | Lunch | 96 | The 30-plant-a-week engine made visible: the bar format lets households count and gamify plant diversity. Standing fermented pot makes live cultures a lunch default. Herb handfuls as salad leaves rather than garnish — the single highest-leverage nutrition practice change in the catalogue. |
| 3 | **Porridge Bar** | Breakfast | 88 | Enhancement is the *point of the meal*: the toppings bar exists to raise nutritional complexity, not to add flavour. Ground flaxseed, rotating 4-seed mix, grated vegetables in the pot, live yoghurt, and cinnamon in the base — more daily enhancement touchpoints per serving than any other shell. |
| 4 | **Mediterranean Tray Bake** | Dinner | 91 | The THA gut-health and low-UPF philosophy distilled into a single tray: butter beans roasting in EVOO-tomato-garlic juices, whole garlic as a prebiotic, herbs in food quantities, EVOO as the primary fat used generously. The tray juices become the sauce — nothing is added; the enhancement is the method. |
| 5 | **Mezze Plate** | Lunch | 91 | Multiple legume dishes per table (hummus + falafel + lentil dip), ferment and pickle bowls as standing items, herb-heavy tabbouleh where parsley and mint are eaten in salad quantities, EVOO as the table's primary fat. A typical mezze table delivers 15+ plants with no individual effort required — the variety is the format. |

**Enhancement pattern:** the top five all share one characteristic — the enhancement is embedded in the shell architecture itself, not bolted on. Seed, ferment, legume, and herb slots appear in the base or as default toppings, not as optional extras the planner must explicitly suggest. THA's nutrition philosophy is best delivered through shells where the enhancement is invisible by default.

---

*End of catalogue. Awaiting review and approval before any seeding, schema, or implementation work begins.*
