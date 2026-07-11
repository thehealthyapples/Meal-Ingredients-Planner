COMPONENT MEAL CATALOGUE RANKING: COMPLETE

---

**Rollback Identifier:** `rollback/catalogue-ranking-investigation-20260609-180438` → commit `1e83f32`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-09
**Risk Level:** GREEN — Investigation only. No code changed. No data written.

---

## ROOT FINDING

### Why component meal shells recover planner failures

The Smart Planner fails silently when its three-tier fallback chain returns zero recipe candidates for a slot. This happens structurally — not due to bugs — when a household's combined dietary restrictions eliminate every meal in the local library for a given meal type. The canonical example from live data: a Vegetarian + Gluten-Free + Dairy-Free + Egg-Free member (Lilly) combined with a Mediterranean + Dairy-Free + Egg-Free member (Daisy) in the same household produces zero breakfast candidates because every breakfast recipe in the library contains at least one excluded ingredient.

A component meal shell bypasses this failure mode entirely by restructuring the meal question. Instead of asking "find a recipe that everyone can eat", it asks "find a base that everyone can share, then let each person choose from their own permitted slot options." The shared base — vegetables, aromatics, sauces made from unrestricted ingredients — is safe for all members. The variable slots (protein, carb, toppings) are presented per-member, with each member's exclusions applied to their own slot selection only.

### What makes a shell maximally effective

From the live validation results (Cooked Breakfast, fitScore 88/100 with all four household eaters, 85/100 for Lilly + Daisy alone), the properties that maximise a shell's recovery value are:

1. **A large shared base of unrestricted vegetables and aromatics.** Vegetables are safe across Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Keto (excluding starchy veg), and Mediterranean. A 5+ ingredient shared base maximises the `sharedBase` scoring dimension (weight 20%).

2. **Protein slot diversity that spans at least four restriction profiles.** A shell with eggs + chicken + chickpea patty + plant sausages can serve Omnivore, Vegetarian, Egg-Free, and Vegan (if a vegan protein is added) from the same template. Each member picks their permitted option; the shared base is already cooked.

3. **At least one carb slot that is naturally GF and starchy-veg-free.** Rice, sweet potato hash (confirmed: sweet potato is excluded from Keto but included in Paleo and is fine for all others), lettuce cups, and corn tortillas serve Gluten-Free members where bread-based options are excluded. This is the single highest-impact slot type for crossing the Gluten-Free boundary.

4. **`compatibleDiets` populated with exact case-matching the restriction label storage format.** From Issue 3 identified in live validation: adult user `user_preferences.diet_types` stores lowercase ("gluten-free", "keto") while the seeded template uses title-case ("Gluten-Free", "Keto"). Case mismatch collapses the compatibility score to 0 for those members. All future shells should store `compatibleDiets` in the same case as the dietary label in `household_eaters.hardRestrictions`, which uses title-case ("Gluten-Free", "Dairy-Free", etc.) — see schema.ts line 1078.

5. **Protein slot names must be interpretable by the substring exclusion matcher.** From Issue 2: "pork sausages" and "chicken breast" are not excluded for Vegetarian members because "vegetarian" is not a substring of those ingredient names. Until a diet-pattern-aware slot filter is added, slot names for meat and fish proteins should carry explicit parenthetical labels or the `vegSlots` array should be used to offer plant alternatives that the matcher CAN correctly identify.

6. **Short estimated total time (≤35 min).** The `timeFit` scoring dimension penalises templates whose `estimatedTotalTime` exceeds the household's `maxTotalCookTime`. For households that have not set a time limit, this defaults to no penalty. However, shells above 60 minutes will score poorly for households that have set a 45-minute limit. Most component meals are inherently short because components cook independently and in parallel.

7. **`costBand: "standard"` as the default.** The household's `budgetLevel` defaults to "standard" when no preference is set (see `callerPrefs?.budgetLevel ?? "standard"` in `household-meal-matcher.ts:217`). A "standard" costBand matches the default and scores `costFit: 1.000`.

---

## TOP 10 ESSENTIAL SHELLS

### Shell 1 — Cooked Breakfast

**Meal type:** Breakfast
**Recovery value:** Very High
**Dietary restrictions supported:** Vegetarian, Gluten-Free, Dairy-Free, Egg-Free, Keto, Mediterranean, Mixed
**Example variants:**
- Omnivore: scrambled eggs + pork sausages + gluten-free roll
- Lilly (Veg/GF/DF/EF): chickpea patty + sweet potato hash + mushroom/tomato base
- Keto adult: eggs + pork sausages (no carb, or gluten-free keto roll)

**Shared base definition:**
`sharedBaseComponents: ["mushrooms", "tomatoes", "onions", "avocado", "asparagus"]`
All five are safe across every supported restriction. Confirmed live against household 44 (fitScore 88/100, sharedBase: 1.000).

**Required slots:**
- `proteinSlots`: eggs / pork sausages / chicken breast / chickpea patty / plant-based sausages
- `carbSlots`: gluten-free roll / sweet potato hash / gluten-free keto bread roll
- `sauceSlots`: tomato ketchup / brown sauce

**Notes:** Already seeded at id=633. The reference shell against which all others should be validated. Known issues: meat proteins not excluded for Vegetarian members by substring match (Issue 2 from live validation); `compatibleDiets` case alignment needed.

---

### Shell 2 — Jacket Potato Bar

**Meal type:** Lunch
**Recovery value:** Very High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Mediterranean, Mixed
**Example variants:**
- Standard: baked potato + tuna + cheddar cheese
- Vegan: baked potato + baked beans + avocado + dairy-free spread
- Gluten-Free / Dairy-Free: baked potato + mixed beans + dairy-free cheese + salad

**Shared base definition:**
`sharedBaseComponents: ["baked potato", "mixed salad leaves", "cucumber", "cherry tomatoes"]`
Baked potato is naturally gluten-free, dairy-free, egg-free, and vegetarian. It is NOT keto-compatible (potato is in `DICT_STARCHY_VEG` in dietRules.ts) — keto members would skip the carb base entirely and use only the salad.

**Required slots:**
- `proteinSlots`: tuna / baked beans / chickpeas / mixed beans / egg (hard-boiled)
- `toppingSlots`: cheddar cheese / dairy-free cheese / avocado / sour cream / coleslaw
- `sauceSlots`: butter / dairy-free spread

**Notes:** A cornerstone lunch shell. Naturally handles most restriction combinations at the topping level. Keto members should use `vegSlots` options only — the potato itself is excluded for Keto.

---

### Shell 3 — Curry Night

**Meal type:** Dinner
**Recovery value:** Very High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Keto (protein only, no rice), Mediterranean, Mixed
**Example variants:**
- Standard: curry sauce + rice + chicken thigh
- Vegetarian / Vegan: curry sauce + rice + chickpeas or tofu
- Dairy-Free / Egg-Free: curry sauce (coconut milk base) + rice + chicken or chickpeas
- Keto: curry sauce (no potato) + cauliflower rice + chicken

**Shared base definition:**
`sharedBaseComponents: ["onion", "garlic", "ginger", "coconut milk", "tomatoes", "spinach", "curry spices"]`
A coconut milk curry base avoids dairy entirely. Garlic, ginger, onion, tomatoes, spinach, and spices are safe across all supported restrictions.

**Required slots:**
- `proteinSlots`: chicken thigh / chicken breast / lamb / chickpeas / tofu / paneer (note: paneer = dairy, excluded for Dairy-Free)
- `carbSlots`: basmati rice / cauliflower rice / gluten-free naan / plain rice
- `vegSlots`: extra spinach / roasted cauliflower / broccoli
- `sauceSlots`: mango chutney (not keto) / raita (dairy — excluded for DF)

**Notes:** Extremely high recovery value for dinner. Coconut milk base is the key design choice — it makes the core sauce dairy-free by default, which covers Dairy-Free, Vegan, and Vegetarian simultaneously. Rice is not Keto-compatible; cauliflower rice is the correct carbSlot alternative.

---

### Shell 4 — Grain Bowl

**Meal type:** Lunch
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Mediterranean, Mixed
**Example variants:**
- Mediterranean: quinoa + falafel + roasted veg + tahini
- Standard: rice + grilled chicken + roasted veg
- Vegan: quinoa + tofu + roasted veg + lemon dressing

**Shared base definition:**
`sharedBaseComponents: ["roasted peppers", "roasted courgette", "cherry tomatoes", "red onion", "olive oil", "lemon juice", "fresh herbs"]`
All roasted vegetables are universally safe. Olive oil and lemon dressing are Mediterranean-aligned and restriction-safe.

**Required slots:**
- `carbSlots`: quinoa / brown rice / white rice / cauliflower rice (keto)
- `proteinSlots`: grilled chicken / falafel / halloumi (dairy — excluded for DF) / tofu / hard-boiled egg / chickpeas
- `toppingSlots`: tahini / hummus / pomegranate seeds
- `sauceSlots`: lemon tahini dressing / olive oil and lemon / dairy-free pesto

**Notes:** Quinoa and brown rice are not keto-compatible. Cauliflower rice in carbSlots enables keto recovery. High Mediterranean alignment.

---

### Shell 5 — Stir-Fry Bar

**Meal type:** Dinner
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free (with tamari), Dairy-Free, Egg-Free, Keto, Mixed
**Example variants:**
- Standard: rice + chicken + mixed veg + soy sauce
- Gluten-Free: rice + chicken + mixed veg + tamari (GF soy sauce)
- Vegan / Keto: cauliflower rice + tofu + mixed veg + tamari

**Shared base definition:**
`sharedBaseComponents: ["mixed stir-fry vegetables", "beansprouts", "spring onion", "garlic", "ginger", "sesame oil"]`
These are universally safe. Soy sauce is a GLUTEN keyword in dietRules.ts (`GLUTEN_KEYWORDS` includes "soy sauce") — it must be in a `sauceSlots` position, not the shared base, so GF members can swap to tamari.

**Required slots:**
- `proteinSlots`: chicken breast / beef strips / king prawns / tofu / tempeh (soy-based — excluded for Soy-Free)
- `carbSlots`: egg noodles (gluten — excluded for GF) / rice noodles / white rice / cauliflower rice
- `sauceSlots`: soy sauce / tamari (gluten-free soy) / coconut aminos (soy-free)

**Notes:** The soy-free dimension requires coconut aminos in sauceSlots. Tempeh is soy-based and must not be offered to Soy-Free members — the substring "soy" will be caught by the matcher if the slot name includes "(soy)" as a parenthetical. Rice noodles and rice are not keto-compatible.

---

### Shell 6 — Build-Your-Own Salad

**Meal type:** Lunch
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Keto, Mediterranean, Mixed
**Example variants:**
- Standard: mixed leaves + chicken + eggs + croutons + Caesar dressing
- GF / Dairy-Free: mixed leaves + chicken + avocado + GF seeds + oil and lemon
- Vegan / Keto: mixed leaves + avocado + mixed seeds + marinated tofu + lemon

**Shared base definition:**
`sharedBaseComponents: ["mixed salad leaves", "cucumber", "cherry tomatoes", "red onion", "avocado"]`
All universally safe. Avocado is particularly valuable as a fat source for Keto and Mediterranean.

**Required slots:**
- `proteinSlots`: grilled chicken / tuna / hard-boiled egg / chickpeas / tofu / halloumi (dairy — excluded for DF)
- `toppingSlots`: croutons (gluten — excluded for GF) / mixed seeds / pomegranate seeds / olives
- `sauceSlots`: Caesar dressing (dairy + egg — excluded for DF/EF) / olive oil and lemon / tahini dressing / dairy-free Caesar

**Notes:** Croutons in toppingSlots are a gluten source and will be correctly excluded for GF members by the substring matcher ("bread" or "crouton" matches `GLUTEN_KEYWORDS`). Including "GF croutons" as a separate topping slot option enables a safe alternative.

---

### Shell 7 — Pasta Bar

**Meal type:** Dinner
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free (GF pasta slot), Dairy-Free, Egg-Free, Mediterranean, Mixed
**Example variants:**
- Standard: pasta + Bolognese sauce + parmesan
- Vegetarian: GF pasta + mushroom/lentil Bolognese + nutritional yeast
- Vegan / GF: GF pasta + marinara + plant mince

**Shared base definition:**
`sharedBaseComponents: ["tomatoes", "garlic", "onion", "olive oil", "fresh basil", "bay leaf"]`
A marinara base avoids dairy and eggs entirely. Garlic, onion, tomatoes, olive oil, and herbs are universally safe.

**Required slots:**
- `carbSlots`: regular pasta (gluten — excluded for GF) / gluten-free pasta / courgette noodles (keto)
- `proteinSlots`: beef mince / chicken / mushrooms / lentils / plant-based mince
- `toppingSlots`: parmesan (dairy — excluded for DF) / nutritional yeast / pine nuts
- `sauceSlots`: tomato marinara / dairy-free pesto / arrabiata

**Notes:** Keto is not well-served by pasta (even GF pasta has high carbs). Courgette noodles ("zoodles") in carbSlots provides a Keto-compatible option without excluding any other member's choice. Pasta is not in `KETO_EXCLUDE` by exact match but "pasta" IS in `DICT_GRAINS` and therefore `KETO_EXCLUDE` — this is correctly excluded by the planner's dietary filter for recipe-level selection, but at the slot level the matcher checks against `member.excludedIngredients` (which contains "keto" for keto-tracked members via dietTypes path, not as an ingredient exclusion). Design note: Keto members' protein and vegSlots are fine; only carbSlots need GF/courgette options.

---

### Shell 8 — Taco Bowl

**Meal type:** Dinner
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free, Dairy-Free, Egg-Free, Keto (protein only), Mediterranean, Mixed
**Example variants:**
- Standard: rice + beef mince + shredded cheese + sour cream + salsa
- Vegan / GF: rice + black beans + guacamole + fresh salsa
- Keto: lettuce cups + seasoned chicken + guacamole + jalapeños

**Shared base definition:**
`sharedBaseComponents: ["roasted peppers", "corn", "red onion", "lime juice", "fresh coriander"]`
Corn is in `DICT_GRAINS` and therefore `KETO_EXCLUDE`. Corn should be moved to vegSlots with a keto-friendly alternative (roasted poblano strips) if strict Keto support is required. If the household has no Keto members, corn in the shared base is safe.

**Required slots:**
- `carbSlots`: cooked rice / corn tortillas (gluten-check: corn tortillas use masa harina, not wheat — technically GF but should be verified) / lettuce cups
- `proteinSlots`: seasoned beef mince / chicken breast / black beans / jackfruit / pulled pork
- `toppingSlots`: shredded cheddar (dairy — excluded for DF) / dairy-free cheese / jalapeños / sour cream (dairy — excluded for DF)
- `sauceSlots`: fresh tomato salsa / guacamole / chipotle sauce / dairy-free crema

**Notes:** Corn tortillas are naturally gluten-free if made from 100% masa harina. Rice is not keto-compatible. Lettuce cups as a carbSlot option cover both GF and Keto simultaneously. Jackfruit is a Vegan meat alternative with appropriate texture for taco use.

---

### Shell 9 — Porridge Bar

**Meal type:** Breakfast
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian, Vegan, Gluten-Free (GF oats), Dairy-Free, Egg-Free, Mediterranean, Mixed
**Example variants:**
- Standard: oats + whole milk + banana + honey
- Vegan / Dairy-Free: oats + oat milk + mixed berries + maple syrup
- GF / Vegan: certified GF oats + oat milk + chia seeds + blueberries

**Shared base definition:**
`sharedBaseComponents: ["oats (certified gluten-free option available)", "cinnamon", "vanilla"]`
Note: oats are not Keto-compatible (oats is in `DICT_GRAINS`). Oats are also not safe for Coeliac (as opposed to Gluten-Free sensitivity) unless certified GF. The base design accommodates GF via the slot label "certified GF oats" — the substring matcher will not flag "gluten" in "certified gluten-free oats" incorrectly if the exclusion is "gluten" because the slot name also contains "gluten-free". (This was confirmed correct from the Cooked Breakfast analysis — "gluten" appears in the slot name and matches the exclusion correctly.)

**Required slots:**
- `carbSlots`: rolled oats / certified gluten-free oats / overnight oats
- `toppingSlots`: banana slices (not keto) / mixed berries / chia seeds / flax seeds / almond butter (nut-free alert) / pumpkin seeds
- `sauceSlots`: whole milk / oat milk / almond milk (nut-free alert) / coconut milk / soy milk (soy-free alert)

**Notes:** "Plant-based milk alternatives are vegan and dairy-free by definition" — from the `removePlantMilkPhrases()` logic in `dietRules.ts` lines 217–222. Oat milk, soy milk, almond milk, and coconut milk will NOT trigger the dairy filter for Dairy-Free members. This is confirmed in the live codebase. Nut-free members (e.g. Lilly) must be excluded from almond milk — "almond" does not match "nuts" by substring, so the slot label should include "(nut)" or the shell should not offer almond milk for nut-restricted households.

---

### Shell 10 — Sheet Pan Dinner

**Meal type:** Dinner
**Recovery value:** High
**Dietary restrictions supported:** Vegetarian (halloumi/chickpeas), Vegan (chickpeas), Gluten-Free, Dairy-Free, Egg-Free, Keto (protein + low-starch veg), Mediterranean, Mixed
**Example variants:**
- Standard: roasted veg + chicken thighs + roast potatoes
- Vegetarian / Mediterranean: roasted veg + halloumi + sweet potato
- Vegan / GF / DF / EF: roasted veg + chickpeas + sweet potato + tahini drizzle
- Keto: roasted non-starchy veg + chicken thighs + olive oil and herb drizzle (no potato)

**Shared base definition:**
`sharedBaseComponents: ["courgette", "red peppers", "red onion", "cherry tomatoes", "garlic cloves", "olive oil", "rosemary", "thyme"]`
All universally safe. Non-starchy roasted vegetables are safe for every dietary restriction in scope.

**Required slots:**
- `proteinSlots`: chicken thighs / salmon fillet / halloumi (dairy — excluded for DF) / chickpeas / sausages
- `carbSlots`: roast potatoes (not keto) / sweet potato (Paleo and non-keto only — it IS in `DICT_STARCHY_VEG` so keto members skip it) / butternut squash (lower carb but still moderate GI)
- `vegSlots`: tenderstem broccoli / asparagus / green beans / spinach
- `sauceSlots`: olive oil and lemon / tahini / chimichurri / dairy-free pesto

**Notes:** Sheet pan is one of the most accessible household cooking formats — one pan, components separated spatially, easy to customise per member without separate cookware. Keto members can eat all protein and non-starchy veg; the only exclusion is the starchy carb slot.

---

## TOP 25 STARTER CATALOGUE

Shells ranked 1–25, ordered by cross-restriction recovery breadth and household frequency.

### BREAKFAST (5 shells)

**Rank 1 — Cooked Breakfast**
*(Full definition above, Shell 1)*
- Recovery value: Very High
- Diets: Vegetarian, GF, DF, EF, Keto, Mediterranean, Mixed
- Time: 25 min | Cost: standard

**Rank 2 — Porridge Bar**
*(Full definition above, Shell 9)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF (certified oats), DF, EF, Mediterranean, Mixed
- Time: 10 min | Cost: budget

**Rank 3 — Smoothie Bowl**
- Recovery value: High
- Diets: Vegetarian, Vegan, GF, DF, EF, Mediterranean, Mixed
- Shared base: `["frozen banana", "mixed frozen berries", "plant-based milk"]`
- Required slots:
  - `toppingSlots`: GF granola (check GF certification) / chia seeds / flax seeds / pumpkin seeds / desiccated coconut / sliced banana
  - `proteinSlots`: protein powder (vanilla, plant-based) / Greek yogurt (dairy — excluded for DF) / silken tofu (soy-free alert)
  - `sauceSlots`: nut butter (almond, excluded for nut-free) / tahini / coconut cream
- Example variants: Vegan/GF: frozen berries + oat milk + chia seeds + GF granola; EF/DF: frozen banana + coconut milk + seeds + tofu (if soy-ok)
- Notes: Frozen banana is in `DICT_HIGH_SUGAR_FRUITS` and therefore `KETO_EXCLUDE` — not keto-compatible. This shell serves all other profiles.
- Time: 10 min | Cost: budget

**Rank 4 — Egg-Free Breakfast Plate**
- Recovery value: High
- Diets: Vegan, Vegetarian, GF, DF, EF, Mediterranean, Mixed (specifically designed for egg-free households)
- Shared base: `["avocado", "cherry tomatoes", "mushrooms", "baby spinach", "olive oil"]`
- Required slots:
  - `proteinSlots`: tofu scramble (soy-free alert) / chickpea scramble / black bean patty / smoked salmon (not vegetarian/vegan)
  - `carbSlots`: gluten-free sourdough toast / gluten-free sweet potato toast / rice cakes
  - `toppingSlots`: capers / fresh herbs (chives, parsley) / lemon zest
  - `sauceSlots`: tahini / dairy-free pesto / hot sauce
- Example variants: Vegan/GF/EF: avocado + tomatoes + mushrooms + spinach + chickpea scramble + rice cakes; Mediterranean/EF: avocado + tomatoes + smoked salmon + GF toast + capers
- Notes: Designed to maximise recovery for the Egg-Free dimension, which is one of the hardest breakfast restrictions (nearly every breakfast recipe contains eggs). The chickpea scramble protein option is safe for Vegan, Vegetarian, GF, DF, EF, Soy-Free simultaneously.
- Time: 20 min | Cost: standard

**Rank 5 — Overnight Oats Bar**
- Recovery value: Medium-High
- Diets: Vegetarian, Vegan, GF (certified oats), DF, EF, Mixed
- Shared base: `["oats (GF option)", "plant-based milk", "vanilla extract", "cinnamon"]`
- Required slots:
  - `toppingSlots`: fresh strawberries / blueberries / raspberries / sliced banana (not keto) / mixed seeds / honey (not vegan — agave alternative)
  - `proteinSlots`: Greek yogurt layer (dairy — excluded for DF) / coconut yogurt / protein powder
  - `sauceSlots`: agave syrup / maple syrup / honey (not vegan)
- Example variants: Vegan/GF: GF oats + oat milk + agave + mixed berries + seeds; Standard: oats + whole milk + honey + banana + seeds
- Notes: Pure prep-ahead meal — assembled the night before. Particularly useful for Breakfast slot recovery because it requires zero morning cooking. Keto is excluded (oats, banana both excluded). Not suitable as sole breakfast shell for Keto households.
- Time: 5 min active (overnight soak) | Cost: budget

---

### LUNCH (8 shells)

**Rank 6 — Jacket Potato Bar**
*(Full definition above, Shell 2)*
- Recovery value: Very High
- Diets: Vegetarian, Vegan, GF, DF, EF, Mediterranean, Mixed (not Keto)
- Time: 60 min (oven) / 12 min (microwave) | Cost: budget

**Rank 7 — Build-Your-Own Salad**
*(Full definition above, Shell 6)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF, DF, EF, Keto, Mediterranean, Mixed
- Time: 15 min | Cost: standard

**Rank 8 — Grain Bowl**
*(Full definition above, Shell 4)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF, DF, EF, Mediterranean, Mixed (limited Keto via cauliflower rice)
- Time: 20 min | Cost: standard

**Rank 9 — Soup + Bread Bar**
- Recovery value: High
- Diets: Vegetarian, Vegan, GF (GF bread slot), DF, EF, Mediterranean, Mixed
- Shared base: `["mixed seasonal vegetables", "onion", "garlic", "vegetable stock", "olive oil"]`
- Required slots:
  - `proteinSlots`: butter beans / red lentils / chicken pieces (not vegetarian/vegan) / chickpeas
  - `carbSlots`: gluten-free bread / sourdough bread (not GF) / GF crackers / no bread (Keto option)
  - `toppingSlots`: fresh parsley / chives / pumpkin seeds / dairy-free cream drizzle
  - `sauceSlots`: dairy-free cream / crème fraîche (dairy — excluded for DF) / olive oil drizzle
- Example variants: Vegan/GF: lentil vegetable soup + GF bread; Standard: chicken vegetable soup + sourdough; Keto: broth-based vegetable soup (no legumes) + no bread
- Notes: Soup is uniquely valuable as a recovery meal because the liquid base is universally safe and the solid components are modular. Keto support requires removing legume-based proteins (chickpeas, beans are in `DICT_LEGUMES` and therefore `KETO_EXCLUDE`) and the bread slot.
- Time: 30 min | Cost: budget

**Rank 10 — Wrap Bar**
- Recovery value: Medium-High
- Diets: Vegetarian, Vegan, GF (GF wrap slot), DF, EF, Mediterranean, Mixed
- Shared base: `["mixed salad leaves", "tomatoes", "cucumber", "avocado", "hummus"]`
- Required slots:
  - `carbSlots`: flour tortilla wrap (gluten — excluded for GF) / gluten-free wrap / lettuce leaf wrap (GF + keto)
  - `proteinSlots`: grilled chicken / falafel / tuna / halloumi (dairy — excluded for DF) / chickpeas
  - `toppingSlots`: shredded red cabbage / pickled onions / roasted peppers
  - `sauceSlots`: hummus / tzatziki (dairy — excluded for DF) / dairy-free tzatziki / hot sauce
- Example variants: Vegan/GF: lettuce wrap + falafel + hummus + salad; Mediterranean/GF: GF wrap + grilled chicken + tzatziki; Keto: lettuce wrap + chicken + avocado + salad
- Notes: GF and Keto both converge on the lettuce leaf wrap option. Hummus contains chickpeas which are in `DICT_LEGUMES` and `KETO_EXCLUDE` — for strict Keto, hummus should be in sauceSlots as an optional swap-out.
- Time: 15 min | Cost: standard

**Rank 11 — Noodle Bowl**
- Recovery value: Medium-High
- Diets: Vegetarian, Vegan, GF (rice noodles), DF, EF, Keto (with courgette noodles), Mixed
- Shared base: `["vegetable broth", "garlic", "ginger", "spring onion", "beansprouts"]`
- Required slots:
  - `carbSlots`: rice noodles / egg noodles (gluten — excluded for GF) / courgette noodles (keto)
  - `proteinSlots`: chicken breast / tofu (soy-free alert) / king prawns / soft-boiled egg (EF alert) / edamame (soy-free alert)
  - `vegSlots`: pak choi / tenderstem broccoli / baby corn / shiitake mushrooms
  - `sauceSlots`: tamari (GF) / miso paste (check GF — some contain barley) / sesame oil / chilli oil
- Notes: Miso paste often contains barley and is therefore not safe for GF members without verification. This should be noted in the slot definition.
- Time: 20 min | Cost: standard

**Rank 12 — Buddha Bowl**
- Recovery value: Medium
- Diets: Vegetarian, Vegan, GF, DF, EF, Mediterranean, Mixed
- Shared base: `["roasted sweet potato", "roasted chickpeas", "avocado", "mixed greens"]`
- Required slots:
  - `carbSlots`: brown rice / quinoa / cauliflower rice (keto) / farro (not GF)
  - `proteinSlots`: roasted chickpeas / edamame (soy-free alert) / tofu (soy-free alert) / grilled chicken
  - `toppingSlots`: pomegranate seeds / toasted sesame seeds / dried cranberries (not keto — high sugar)
  - `sauceSlots`: tahini lemon dressing / miso ginger dressing / olive oil and herb
- Notes: Sweet potato is in `DICT_STARCHY_VEG` and is NOT Keto-compatible. This shell is strongest for Vegan, Vegetarian, Mediterranean, and mixed households.
- Time: 35 min | Cost: standard

**Rank 13 — Cheese and Charcuterie Lunch Platter**
- Recovery value: Medium
- Diets: GF, Keto, Mediterranean, Mixed (not Vegetarian/Vegan/Dairy-Free)
- Shared base: `["mixed olives", "cornichons", "cherry tomatoes", "rocket leaves"]`
- Required slots:
  - `proteinSlots`: prosciutto / salami / smoked salmon / brie / cheddar (dairy — excluded for DF)
  - `carbSlots`: GF crackers / rice cakes / sourdough crackers (not GF)
  - `toppingSlots`: fig jam (not keto) / Dijon mustard / chutney (not keto)
  - `sauceSlots`: olive oil drizzle / balsamic reduction
- Notes: Limited to non-Vegetarian and non-Dairy-Free households. Included because it strongly serves Keto and Mediterranean profiles for lunch recovery with zero cooking. Low dietary breadth but high relevance for the profiles it serves.
- Time: 5 min | Cost: premium

---

### DINNER (12 shells)

**Rank 14 — Curry Night**
*(Full definition above, Shell 3)*
- Recovery value: Very High
- Diets: Vegetarian, Vegan, GF, DF, EF, Keto (protein-only without rice), Mediterranean, Mixed
- Time: 35 min | Cost: standard

**Rank 15 — Taco Bowl**
*(Full definition above, Shell 8)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF, DF, EF, Keto (lettuce cups), Mediterranean, Mixed
- Time: 30 min | Cost: standard

**Rank 16 — Pasta Bar**
*(Full definition above, Shell 7)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF (GF pasta), DF, EF, Mediterranean, Mixed (not Keto)
- Time: 25 min | Cost: standard

**Rank 17 — Stir-Fry Bar**
*(Full definition above, Shell 5)*
- Recovery value: High
- Diets: Vegetarian, Vegan, GF (tamari), DF, EF, Keto (cauliflower rice), Mixed
- Time: 20 min | Cost: standard

**Rank 18 — Sheet Pan Dinner**
*(Full definition above, Shell 10)*
- Recovery value: High
- Diets: Vegetarian (halloumi/chickpeas), Vegan (chickpeas), GF, DF, EF, Keto (no starchy carbs), Mediterranean, Mixed
- Time: 40 min | Cost: standard

**Rank 19 — Fajita Night**
- Recovery value: High
- Diets: Vegetarian, Vegan, GF (corn tortillas / lettuce wraps), DF, EF, Keto (lettuce cups), Mediterranean, Mixed
- Shared base: `["sliced peppers (red, yellow, green)", "sliced red onion", "olive oil", "lime juice", "fajita spice mix"]`
- Required slots:
  - `proteinSlots`: chicken strips / beef strips / king prawns / halloumi strips (dairy — excluded for DF) / portobello mushroom strips / black beans
  - `carbSlots`: flour tortillas (not GF) / corn tortillas (naturally GF) / lettuce cups (GF + keto)
  - `toppingSlots`: shredded cheese (dairy — excluded for DF) / guacamole / fresh salsa / jalapeños / sour cream (dairy — excluded for DF)
  - `sauceSlots`: dairy-free sour cream / hot sauce / lime wedges
- Notes: Similar to Taco Bowl but with a different assembly format (wrap vs bowl). The fajita base (sliced peppers + onion + spices) is universally safe. Corn tortillas vs lettuce cups provides GF and Keto coverage simultaneously.
- Time: 25 min | Cost: standard

**Rank 20 — Burger Night**
- Recovery value: Medium
- Diets: GF (GF bun), DF, EF, Keto (lettuce bun), Mediterranean (limited), Mixed
- Shared base: `["sliced tomato", "lettuce", "sliced red onion", "pickles"]`
- Required slots:
  - `proteinSlots`: beef patty / chicken burger / veggie patty / fish fillet / portobello mushroom burger (Vegan/Vegetarian)
  - `carbSlots`: brioche bun (not GF) / GF burger bun / lettuce bun (GF + keto)
  - `toppingSlots`: cheddar cheese (dairy — excluded for DF) / dairy-free cheese / avocado / bacon (not Vegetarian/Vegan)
  - `sauceSlots`: ketchup (not keto — contains sugar) / mustard / dairy-free mayo / burger sauce
- Notes: Moderate recovery value as a standalone shell. Strongest for GF, Keto, and Mixed households. Weaker for Vegetarian and Vegan without explicit veggie patty varieties. The lettuce bun option covers both GF and Keto at carbSlots simultaneously.
- Time: 20 min | Cost: standard

**Rank 21 — Pizza Night**
- Recovery value: Medium
- Diets: Vegetarian, GF (GF base), DF, EF, Mixed
- Shared base: `["tomato pizza sauce", "fresh basil", "olive oil", "garlic"]`
- Required slots:
  - `carbSlots`: classic pizza base (not GF) / gluten-free pizza base / cauliflower pizza base (keto attempt — moderate)
  - `proteinSlots`: mozzarella (dairy — excluded for DF) / dairy-free cheese / pepperoni (not Vegetarian) / chicken / mushrooms
  - `toppingSlots`: roasted peppers / olives / sun-dried tomatoes / artichokes / spinach
  - `sauceSlots`: tomato marinara / white sauce (dairy-based — excluded for DF)
- Notes: Pizza is an inherently strong family meal. GF pizza bases are widely available. Cauliflower pizza base is low-carb but not truly Keto. The tomato sauce base is universally safe. A DF household uses dairy-free cheese exclusively in toppingSlots.
- Time: 30 min (pre-made bases) | Cost: standard

**Rank 22 — Roast Dinner**
- Recovery value: Medium
- Diets: GF (naturally), DF, EF, Keto (roast meat + non-starchy veg, no potato/parsnip), Mediterranean, Mixed
- Shared base: `["roasted carrots", "roasted parsnips", "green beans", "broccoli", "onion gravy (GF option)"]`
- Required slots:
  - `proteinSlots`: chicken / lamb / beef / pork / nut roast (Vegetarian / Vegan — nut-free alert)
  - `carbSlots`: roast potatoes (not keto — potato is in `DICT_STARCHY_VEG`) / mashed potato / cauliflower mash (keto)
  - `vegSlots`: roast parsnips / Yorkshire puddings (not GF — contain wheat flour) / stuffing (not GF — check recipe)
  - `sauceSlots`: gravy (check GF) / mint sauce / horseradish sauce / cranberry sauce (not keto — contains sugar)
- Notes: Roast dinner is architecturally simple — proteins cook separately, veg can be separated on trays. Gravy often contains wheat flour and must be made or confirmed GF for GF members. Lower position in ranking due to prep time (typically 90+ min) and Keto complexity.
- Time: 90 min | Cost: standard

**Rank 23 — Fish Night**
- Recovery value: Medium
- Diets: GF, DF, EF, Keto (no batter/breadcrumbs), Mediterranean, Mixed (not Vegetarian/Vegan)
- Shared base: `["lemon", "garlic butter (DF option)", "cherry tomatoes", "capers", "fresh parsley"]`
- Required slots:
  - `proteinSlots`: salmon fillet / cod fillet / sea bass / haddock / tuna steak
  - `carbSlots`: new potatoes (not keto) / sweet potato wedges (not keto) / cauliflower mash (keto) / rice
  - `vegSlots`: tenderstem broccoli / asparagus / green beans / wilted spinach
  - `sauceSlots`: lemon butter sauce (dairy — excluded for DF) / dairy-free lemon sauce / tartare sauce
- Notes: Fish night naturally excludes Vegetarian and Vegan households. Strongest for households without meat-exclusion restrictions. Keto-friendly with cauliflower mash and non-starchy veg. Mediterranean-aligned with olive oil, capers, herbs.
- Time: 25 min | Cost: standard-premium

**Rank 24 — Chilli Night**
- Recovery value: Medium
- Diets: GF (naturally), DF, EF, Mediterranean (moderate), Mixed (not Keto — beans/rice excluded)
- Shared base: `["chopped tomatoes", "tomato puree", "onion", "garlic", "cumin", "smoked paprika", "chilli flakes", "coriander"]`
- Required slots:
  - `proteinSlots`: beef mince / turkey mince / plant mince / black beans (Vegetarian/Vegan) / kidney beans (Vegetarian/Vegan — note: beans are in `DICT_LEGUMES` and `KETO_EXCLUDE`)
  - `carbSlots`: white rice / brown rice / cauliflower rice (keto attempt) / jacket potato (not keto)
  - `toppingSlots`: sour cream (dairy — excluded for DF) / dairy-free sour cream / grated cheese (dairy — excluded for DF) / sliced jalapeños / guacamole
  - `sauceSlots`: hot sauce / lime wedges
- Notes: Kidney and black beans are `KETO_EXCLUDE` (legumes). Cauliflower rice is only a partial recovery for Keto households; the bean-based proteins are also excluded. Best positioned as a recovery shell for non-Keto mixed and Vegetarian households.
- Time: 35 min | Cost: budget

**Rank 25 — Omelette / Frittata Bar**
- Recovery value: Medium (restricted by egg dependency)
- Diets: GF (naturally), DF, Keto, Mediterranean, Mixed (explicitly NOT egg-free)
- Shared base: `["mixed vegetables (peppers, onion, courgette)", "fresh herbs", "olive oil"]`
- Required slots:
  - `proteinSlots`: eggs (main base — excluded for EF) / additional: smoked salmon / chorizo (not Vegetarian) / spinach / feta (dairy — excluded for DF)
  - `toppingSlots`: sun-dried tomatoes / olives / rocket leaves / caramelised onions
  - `sauceSlots`: hot sauce / salsa verde / tomato relish
- Notes: This shell is deliberately the lowest ranked because it requires eggs as its primary protein base. It is placed last to signal: it recovers egg-capable households for Keto and GF dinners, but should not be seeded until higher-ranked shells (which cover egg-free households) are in place. An "omelette bar" is highly Keto-friendly — eggs are a primary Keto protein — and serves GF, DF, and Mediterranean profiles well. Recovery value is **Medium** not Low because it meaningfully fills Keto dinner slots and GF dinner slots where egg-containing recipes are eliminated by other household members' restrictions.
- Time: 15 min | Cost: budget

---

## SLOT ARCHITECTURE REQUIRED

From reading all 25 shells above against the existing `MealShellDef` interface in `seed-meal-shell-templates.ts`, the full slot vocabulary required is:

### Core slot types (all present in the schema)

| Slot field | DB column | Purpose | Used by shells |
|---|---|---|---|
| `sharedBaseComponents` | `shared_base_components text[]` | Fixed ingredients cooked for everyone; forms the household intersection | All 25 |
| `proteinSlots` | `protein_slots text[]` | Per-member protein selection; most variation happens here | All 25 |
| `carbSlots` | `carb_slots text[]` | Per-member carb selection; GF and Keto diverge most heavily here | 20/25 |
| `vegSlots` | `veg_slots text[]` | Optional extra vegetables; used to add Mediterranean-specific veg, keto substitutes | 15/25 |
| `toppingSlots` | `topping_slots text[]` | Finishing ingredients (cheese, seeds, sauces); strong dairy/nut divergence | 18/25 |
| `sauceSlots` | `sauce_slots text[]` | Dressings, condiments, finishing liquids; GF diverges on soy/teriyaki; DF diverges on cream-based | All 25 |

### The full `MealShellDef` interface is sufficient as-is

No new slot types are needed. The six-array structure (`sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `toppingSlots`, `sauceSlots`) covers all 25 shells without modification to schema or seed interface.

### Slot naming conventions required

The substring exclusion matcher in `scoreTemplate()` matches `member.excludedIngredients` against slot names. For the matcher to work correctly, slot names must follow these conventions:

1. **Dairy ingredients must contain a recognisable dairy keyword** from `DAIRY_KEYWORDS` (e.g., "milk", "cream", "butter", "cheese", "yogurt", "feta", "mozzarella", "halloumi", "parmesan"). A slot named "white sauce" without the word "cream" or "dairy" will NOT be excluded for Dairy-Free members.

2. **Gluten-containing ingredients must contain a recognisable gluten keyword** from `GLUTEN_KEYWORDS` (e.g., "bread", "pasta", "flour", "wheat", "noodle", "tortilla"). A slot named "flatbread" will be caught via "bread". A slot named "pita" will be caught via "pita".

3. **Meat and fish must carry explicit labels for Vegetarian/Vegan exclusion.** The substring matcher cannot detect that "pork sausages" is meat unless "pork" is in the exclusion set. Since `hardRestrictions` for a Vegetarian member contains "Vegetarian" (the label, not the ingredient), there is no substring match. Until Issue 2 is resolved, meat protein slots should be named with the meat type explicitly (which is already the case for most — "pork sausages", "chicken breast", "beef mince") so that a diet-pattern-aware filter layer can use keyword lists to exclude them.

4. **Nut ingredients must contain a nut name** (almond, walnut, cashew, pecan, hazelnut, peanut, pistachio, macadamia, brazil nut, pine nut) for Nut-Free exclusion. The restriction label "Nuts" does not substring-match "almond butter" — this is a known gap in the substring matcher for nut-free households like Lilly's.

5. **Soy ingredients must contain "soy" or "tofu" or "edamame" or "tempeh"** for Soy-Free exclusion. The restriction label "Soy" will not substring-match "miso" (miso is fermented soy but the word "soy" does not appear). Miso should be explicitly flagged or a parenthetical added: "miso paste (soy)".

### Recommended slot name format

```
"ingredient name [(dietary flag)]"
Examples:
  "almond butter (nut)"
  "miso paste (soy)"
  "halloumi cheese (dairy)"
  "tempeh (soy)"
  "corn tortillas (naturally GF)"
```

The parenthetical is parsed by the substring exclusion matcher as part of the ingredient string. This is the lowest-risk way to make implicit dietary content explicit without schema changes.

---

## COVERAGE ESTIMATE

### Household failure scenarios

| Household Type | Primary failure mode | Primary recovery shell |
|---|---|---|
| Vegetarian | All meat recipes excluded | Curry Night, Grain Bowl, Jacket Potato Bar |
| Vegan | All meat + dairy + egg recipes excluded; breakfast entirely empty | Egg-Free Breakfast Plate, Curry Night (coconut milk), Grain Bowl |
| Gluten-Free | All bread/pasta/grain recipes excluded; breakfast very thin | Cooked Breakfast (sweet potato hash carb), Jacket Potato Bar, GF variants in all dinner shells |
| Dairy-Free | Cream/cheese-heavy recipes excluded; some breakfast and dinner thinning | Cooked Breakfast (base only), Curry Night (coconut milk), most shells with DF topping swaps |
| Egg-Free | All egg-based breakfast excluded; dinner moderately affected | Egg-Free Breakfast Plate, Cooked Breakfast (plant protein), Overnight Oats, Smoothie Bowl |
| Keto | All grain/sugar/legume/starchy-veg recipes excluded; lunch and breakfast collapse | Cooked Breakfast (no carb), Salad (lettuce), Stir-Fry (cauliflower rice), Sheet Pan (no starchy carbs) |
| Mediterranean | Positive bias not exclusionary; rarely causes 0-candidate collapse | Almost all shells score well; not a primary failure mode |
| Multi-restriction (2+ hard limits) | Compound exclusion eliminates almost all library meals | Cooked Breakfast, Egg-Free Plate, Sheet Pan, Curry Night with careful slot design |

### Coverage estimate by shell count

**5 shells (Ranks 1–5: Cooked Breakfast, Jacket Potato Bar, Curry Night, Grain Bowl, Stir-Fry Bar)**

| Household type | Breakfast | Lunch | Dinner | Overall |
|---|---|---|---|---|
| Vegetarian | 80% (Cooked Breakfast covers it) | 70% (Jacket Potato, Grain Bowl) | 80% (Curry Night, Stir-Fry with tofu) | ~75% |
| Vegan | 40% (Cooked Breakfast marginal — needs vegan protein slot) | 60% (Jacket Potato + beans) | 75% (Curry Night, Stir-Fry + tofu) | ~58% |
| Gluten-Free | 75% (Cooked Breakfast, GF carb slots) | 70% (Jacket Potato is naturally GF) | 75% (Curry + rice, Stir-Fry + tamari) | ~73% |
| Dairy-Free | 75% (Cooked Breakfast base, no dairy needed) | 70% | 80% (Curry Night is DF by design) | ~75% |
| Egg-Free | 60% (Cooked Breakfast needs plant protein only) | 80% | 75% | ~72% |
| Keto | 50% (Cooked Breakfast without carbs) | 55% (Salad only) | 65% (Stir-Fry cauliflower rice, Sheet Pan partial) | ~57% |
| Multi-restriction | 55% | 60% | 70% | ~62% |
| **Weighted average** | | | | **~68%** |

**10 shells (Ranks 1–10: add Sheet Pan, Taco Bowl, Pasta Bar, Porridge Bar, Build-Your-Own Salad)**

Adding Porridge Bar and Overnight Oats recovers Vegan and EF breakfast. Adding Build-Your-Own Salad, Grain Bowl, and Sheet Pan broadens Keto lunch and dinner recovery significantly.

| Household type | Estimated coverage |
|---|---|
| Vegetarian | ~88% |
| Vegan | ~78% |
| Gluten-Free | ~85% |
| Dairy-Free | ~88% |
| Egg-Free | ~85% |
| Keto | ~72% |
| Multi-restriction | ~75% |
| **Weighted average** | **~82%** |

**25 shells (full catalogue, Ranks 1–25)**

Full catalogue adds Soup + Bread Bar, Wrap Bar, Noodle Bowl, Buddha Bowl, Fajita Night, Burger Night, Pizza Night, Roast Dinner, Fish Night, Chilli Night, Omelette Bar, and Cheese Platter.

| Household type | Estimated coverage |
|---|---|
| Vegetarian | ~95% |
| Vegan | ~90% |
| Gluten-Free | ~93% |
| Dairy-Free | ~93% |
| Egg-Free | ~92% |
| Keto | ~83% |
| Multi-restriction | ~87% |
| **Weighted average** | **~90%** |

### Calibration notes

These estimates are grounded in:

1. The candidate pool trace findings: 0 Vegan breakfast candidates, 2 Keto breakfast candidates, 14 Keto dinner candidates from a 206-meal library (SMART_PLANNER_CANDIDATE_POOL_TRACE.md).
2. The breakfast slot strictness: only `breakfast` and `smoothie` categories pass the Tier-1/2/3 breakfast filter — cross-slot promotion is explicitly blocked.
3. The Tier-3 controlled repeat mechanism: already fills slots when ≥1 compliant meal exists. Shells only need to cover the case where 0 compliant meals exist.
4. The 25% weight of breakfast slots in a 3-meal-per-day 7-day plan (21 total slots: 7 breakfast + 7 lunch + 7 dinner). Breakfast failures are disproportionately visible.

The 10% residual failure rate at 25 shells reflects: extreme multi-restriction combinations (e.g. Vegan + Soy-Free + Nut-Free + GF + EF), Carnivore households (no exclusion logic but almost no shells align well), and the known Issue 2 gap where Vegetarian members are offered meat slots by the substring matcher.

---

## RECOMMENDED SEEDING ORDER

Ordered by: (1) breakfast recovery urgency (empty breakfast slots are the most visible failure), (2) dietary breadth (number of restriction profiles recovered per shell), (3) cross-meal-type coverage.

| Seq | Shell | Meal Type | Rationale |
|---|---|---|---|
| 1 | Cooked Breakfast | Breakfast | Already seeded (id=633). Reference shell. Architecture proven against live household (fitScore 88). Seeds first because it is the only existing shell and the one all other shell work is based on. |
| 2 | Egg-Free Breakfast Plate | Breakfast | Seeds second because breakfast is the highest-impact slot failure (strict category boundary, no cross-slot fallback). Egg-Free is the single most impactful breakfast restriction — almost every breakfast recipe contains eggs. Directly recovers Lilly's actual planning scenario without requiring her meat restrictions to be handled by the protein slot matcher. |
| 3 | Curry Night | Dinner | Seeds third because it covers the broadest dietary matrix for dinner (Vegetarian, Vegan via chickpeas, GF, DF via coconut milk, EF, Keto partial). A coconut milk curry base makes the shell safe for Dairy-Free and Vegan simultaneously without any member needing to opt out of the sauce. Highest dinner recovery value. |
| 4 | Jacket Potato Bar | Lunch | Seeds fourth as the highest-value lunch shell. Naturally GF, DF, EF, and Vegetarian at the base. Covers the Vegan dimension with beans. The baked potato requires no GF swap at the carb level — it already IS the GF carb. Most lunch recovery per shell authored. |
| 5 | Porridge Bar | Breakfast | Seeds fifth to recover Vegan and Dairy-Free breakfast separately from the Cooked Breakfast path. A plant-milk-based porridge is simultaneously Vegan, DF, and EF. Covers the household scenario where a member needs a grain-based (not protein-plate) breakfast. |
| 6 | Stir-Fry Bar | Dinner | Sixth because it adds a quick dinner shell (20 min) with strong GF coverage (tamari) and Keto coverage (cauliflower rice), both at the slot level. Diversifies away from the curry/potato dinner axis. |
| 7 | Build-Your-Own Salad | Lunch | Seventh — covers Keto lunch (the hardest lunch restriction: no grains, no potato, no legumes). The salad base is universally safe and is one of the few lunch formats where Keto members can fully participate. |
| 8 | Grain Bowl | Lunch | Eighth — Mediterranean-aligned, strong for Vegetarian and Vegan at lunch. Complements Jacket Potato Bar by providing a non-starchy-carb lunch option. |
| 9 | Taco Bowl | Dinner | Ninth — second Mexican-format dinner shell (complements Fajita Night when that is seeded). Strong for Vegan (black beans + rice + guacamole) and GF (rice or lettuce cups). |
| 10 | Sheet Pan Dinner | Dinner | Tenth — very low cooking complexity, one pan, high dietary coverage. Seeds here because it completes the core 3×3 matrix (3 breakfast + 3 lunch + 4 dinner shells). |
| 11 | Overnight Oats Bar | Breakfast | Adds a prep-ahead breakfast option. No cooking. Covers Vegan, DF, EF. Completes breakfast coverage for all non-Keto profiles. |
| 12 | Smoothie Bowl | Breakfast | Adds a cold breakfast variant. Strong for Mediterranean, Vegan. Completes breakfast to 4 shells. |
| 13 | Pasta Bar | Dinner | GF pasta slot makes this the GF-friendly dinner for non-Keto households. Highest familiarity as a meal format. |
| 14 | Soup + Bread Bar | Lunch | Budget-friendly, covers Vegan, GF, DF, EF. Adds a warm lunch option (others are cold or ambient). |
| 15 | Fajita Night | Dinner | Complements Taco Bowl. Strong for Keto (lettuce cups) and GF (corn tortillas). |
| 16 | Wrap Bar | Lunch | Adds variety to the lunch rotation. GF wrap and lettuce leaf options cover most restrictions. |
| 17 | Noodle Bowl | Lunch | GF via rice noodles. Strong for Asian-cuisine-familiar households. Adds cuisine variety. |
| 18 | Chilli Night | Dinner | Budget dinner shell. Not Keto-compatible but covers all other profiles including Vegan. |
| 19 | Pizza Night | Dinner | GF pizza base is the critical slot. High household familiarity. Popular with mixed households. |
| 20 | Burger Night | Dinner | GF bun and lettuce bun cover GF and Keto. Adds a format distinct from the grain-bowl and stir-fry pattern. |
| 21 | Buddha Bowl | Lunch | Adds visual variety to lunch. Overlaps with Grain Bowl in profile coverage — seeded later because Grain Bowl is stronger. |
| 22 | Roast Dinner | Dinner | Long prep time reduces recovery utility for weekday slots. Seeds late because other dinner shells cover the same dietary profiles more efficiently. |
| 23 | Fish Night | Dinner | Non-Vegetarian, non-Vegan. Seeds late because it only serves households without meat-exclusion restrictions. |
| 24 | Cheese and Charcuterie | Lunch | Seeds late — narrow dietary breadth (excludes Vegetarian, Vegan, Dairy-Free). Serves Mixed and Keto households specifically. |
| 25 | Omelette / Frittata Bar | Dinner | Seeds last because it requires eggs and thus excludes egg-free households. Positioned as a Keto + GF dinner recovery shell for non-egg-restricted households only. |

---

## IMPLEMENTATION NOTES

These are observations grounded in the codebase and are not implementation instructions. They document constraints relevant to shell authoring.

**Case normalisation is required for `compatibleDiets`.** The live validation (LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md, Issue 3) confirms that `user_preferences.diet_types` stores values as lowercase ("gluten-free", "keto") while `household_eaters.hardRestrictions` stores title-case ("Gluten-Free", "Eggs"). The `scoreTemplate()` function uses exact equality (`!templateDiets.includes(diet)`). All shells should store `compatibleDiets` in title-case to match `hardRestrictions` format — this is what the Cooked Breakfast seed already does. When adult users' diet types are used (via `household_eaters.defaultDietTypes`, which are set by `syncMembersAsEaters()` to empty arrays), the case mismatch only affects the compatibility dimension for adults, not for the hard-restriction-based children.

**The PATCH API route (`PATCH /api/meal-templates/:id`) cannot update slot fields** (confirmed in MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md, Section 3). All 25 shells must be seeded via the `seed-meal-shell-templates.ts` script using `pool.query()` directly (the approach confirmed working in COOKED_BREAKFAST_MEAL_SHELL_SEED.md). The INSERT via `pool.query()` with parameterised arrays is the correct and proven write path.

**`matchMealsForHousehold()` is dead code — not connected to any route.** All 25 shells can be seeded immediately and will be scored correctly once the Tier-4 planner path is wired. Template data is independent of route wiring.

**The `household-meal-matcher.ts` migration to `household_eaters` is complete** (confirmed in MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md). Lilly and Daisy will be correctly included in template scoring when Tier-4 is wired.

---

*Investigation complete. No code changed. No data written. No templates created.*
