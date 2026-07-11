# THA Original Founding Cookbook — Batch 001

**Theme:** Everyday Family Foundations
**Status:** Content authoring only — no code, no schema, no importer, no seed, no database writes.
**Acquisition lane (per `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md`):** `tha_library` / `authored`. These are THA-owned, original, THA-authored recipes.
**Created:** 2026-07-10

---

## Architecture Compliance

Governing architecture reviewed before authoring:
- `docs/architecture/README.md` (Architecture Bootstrap / mandatory entry point)
- `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (recipe content governance)

Confirmed:
- **Governing architecture reviewed** — yes. README bootstrap and the Recipe Acquisition Architecture were read prior to authoring.
- **Cookbook owns recipe content only** — this document defines only recipe name, meal category, ingredients, quantities, method, and practical cooking notes. Nothing else.
- **Planner / Household Reasoning / Decision Engine retain ownership** of adaptations, dietary swaps, leftover opportunities, ingredient-continuity suggestions, and all planning/shopping decisions. None of those are present in any recipe below.
- **No duplicate ownership introduced** — the Cookbook does not restate, pre-compute, or embed anything owned by the Planner, Household Reasoning, Food Intelligence Platform, or Decision Engine. THA infers those later from canonical ingredients, household profiles, pantry, planner and shopping state.
- **No new architecture introduced** — this is a content batch, not an architectural change. It fits the existing `tha_library / authored` lane without any new lane, store, or vocabulary.

## AI Architecture Compliance

Confirmed (per `ENGINEERING_WORKFLOW.md` AI Architecture Compliance):
- **No new assistant created.**
- **No duplicate conversation state created.**
- **No AI capability implemented.**
- **No AI-owned business logic introduced.**
- **Future THA inference remains owned by the Intelligence Platform and registered capabilities** — this document supplies canonical recipe facts only; any downstream reasoning (fit, swaps, continuity, opportunities) is inferred later by registered capabilities over the Capability Registry.

## Data Impact

- **Reads existing data:** no
- **Writes new data:** no database writes
- **Changes meaning of existing data:** no
- **Requires backfill:** no

This document is a Markdown authoring artifact. It touches no tables, no migrations, and no runtime code.

## Trust Check

Confirmed:
- **No copied recipes** — every recipe below is original THA authoring.
- **No external recipe adaptation** — nothing is derived or transcribed from an external recipe source.
- **No fabricated source claims** — no provenance, endorsement, or origin is claimed beyond "original THA authoring".
- **No hard-coded household adaptations** — no household, child, allergy, or preference variant is embedded in any recipe.
- **No leftover/planner logic embedded** — no "use leftover X in Y", no reuse suggestion, no planner instruction appears in recipe content.
- **No unsupported nutrition claims** — descriptions reference only what the listed ingredients plainly provide (e.g. "contains chickpeas", "wholegrain", "high in fibre from lentils and vegetables"). No quantified or medical claims are made.

## Rollback Plan

- **Rollback identifier:** git tag `rollback/cookbook-batch-001-pre`, pointing at commit `8e10ea3` (the pre-change HEAD).
- **How to revert:** this change adds exactly one new, previously-untracked file — `docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md`. To remove it: delete the file (`rm docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md`). Because the file is untracked, no committed history is affected and no `git revert` is required. The tag `rollback/cookbook-batch-001-pre` can be deleted afterwards with `git tag -d rollback/cookbook-batch-001-pre`.
- No database, migration, or code state exists to roll back.

## Scope Lock

This task creates the Batch 001 content document only:
- No code.
- No schema.
- No importer.
- No seed script.
- No database writes.
- No household fixtures.

## Recipe Authoring Standard

Every recipe in this batch conforms to the following standard:

1. **Original & owned.** Authored by THA for the THA Library lane. Not copied, not adapted from any external recipe.
2. **Whole-food first.** Built from recognisable whole ingredients — vegetables, legumes, whole grains, fruit, and quality protein.
3. **Plant-forward, not vegetarian/vegan by default.** Plants dominate the plate; meat and fish appear as quality-over-quantity components, not as the bulk of the dish.
4. **No UPF sauce shortcuts.** No jar sauces, no packet sauce bases, no Dolmio-style products. Sauces are built from real ingredients — chopped tomatoes, tomato purée, onions, garlic, herbs, spices, stock and vegetables.
5. **Low added sugar, low salt by default.** Seasoning is conservative; salt is "to taste" and kept modest. Heat is optional and added after serving.
6. **Wholegrain where practical.** Wholewheat pasta, brown rice, wholegrain bread, wholemeal flour used as the default where it works for a family meal.
7. **Mild family base.** The base recipe carries no chilli heat. Chilli, jalapeños, or stronger spice are noted as an optional after-serving addition only, so children can eat the base meal.
8. **Realistic UK supermarket ingredients.** Everything is buyable in a standard UK supermarket.
9. **Filling by design.** Satiety comes from fibre, whole grains, legumes, vegetables and quality protein rather than refined bulk.
10. **Everyday-cookable.** Batch 001 favours normal family cooking; a small number of dishes are gently more adventurous but remain foundations.

**Content ownership note carried through every recipe:** each recipe below stops at recipe facts. "Why this works for THA" explains the recipe's own properties only. "Planner readability notes" describe factual recipe properties (ingredient presence, mild base, freezer/batch/lunchbox suitability) and never instruct the Planner, Household Reasoning, or Decision Engine what to do.

**Batch composition:** 1 breakfast · 1 lunch · 7 dinners · 1 lunchbox-friendly side. Total: 10.

---

## Recipes

### THA-001 — The Healthy Apples Apple, Oat & Cinnamon Morning Bowl

- **recipe_id:** THA-001
- **recipe_name:** The Healthy Apples Apple, Oat & Cinnamon Morning Bowl
- **category:** breakfast
- **difficulty:** easy
- **servings:** 4
- **prep time:** 10 minutes
- **cook time:** 10 minutes (or overnight, no-cook)

**Introduction:** A warm, gently sweet porridge built on wholegrain oats, grated fresh apple and cinnamon — no added sugar needed because the fruit does the sweetening. Easy enough for a school morning, and steady enough to keep a family going until lunch.

**Ingredients:**
- 160g rolled wholegrain oats
- 600ml semi-skimmed milk (or unsweetened oat milk)
- 200ml water
- 2 eating apples (e.g. Gala or Braeburn), 1 grated and 1 diced
- 1 tsp ground cinnamon
- 1 tbsp mixed seeds (e.g. pumpkin and sunflower)
- 1 tbsp chopped walnuts (optional)
- 1 tsp honey to finish, per bowl, only if wanted

**Method:**
1. Put the oats, milk, water, grated apple and cinnamon in a medium saucepan.
2. Bring to a gentle simmer over medium heat, stirring often, for 6–8 minutes until thick and creamy.
3. Stir in half the diced apple in the last minute so it softens slightly but keeps some bite.
4. Spoon into bowls and top with the remaining diced apple, the seeds and the walnuts.
5. Finish with a thread of honey only if a sweeter bowl is wanted.

*No-cook overnight version:* combine oats, milk, grated apple and cinnamon in a lidded container, refrigerate overnight, then top with diced apple, seeds and nuts before serving.

**Why this works for THA:** Wholegrain oats and apple provide slow-release carbohydrate and fibre; the sweetness comes from fruit and cinnamon rather than added sugar. Seeds and nuts add texture and healthy fats. It is a whole-food breakfast with no UPF components.

**Planner readability notes (factual properties only):**
- category: breakfast
- contains wholegrain oats
- contains fresh apple
- no added sugar in the base recipe (honey is an optional per-bowl finish)
- mild base recipe
- has a no-cook overnight preparation option

---

### THA-002 — The Healthy Apples Chickpea, Lemon & Spinach Soup

- **recipe_id:** THA-002
- **recipe_name:** The Healthy Apples Chickpea, Lemon & Spinach Soup
- **category:** lunch
- **difficulty:** easy
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 25 minutes

**Introduction:** A bright, hearty lunch soup built entirely from real ingredients — chickpeas for body, spinach for colour, and a squeeze of lemon to lift it. Served with wholegrain bread it is a filling midday meal that reheats well.

**Ingredients:**
- 1 tbsp olive oil
- 1 onion, finely chopped
- 2 carrots, diced
- 2 celery sticks, diced
- 3 garlic cloves, crushed
- 1 tsp ground cumin
- 1 tsp ground coriander
- 2 x 400g tins chickpeas, drained and rinsed
- 1.2 litres low-salt vegetable stock
- 1 tbsp tomato purée
- 100g fresh spinach, roughly chopped
- Juice of 1 lemon
- Black pepper, and salt to taste
- Wholegrain bread, to serve

**Method:**
1. Heat the olive oil in a large pan. Add the onion, carrot and celery and cook gently for 8 minutes until soft.
2. Stir in the garlic, cumin and coriander and cook for 1 minute until fragrant.
3. Add the tomato purée and stir for 30 seconds, then tip in the chickpeas and stock.
4. Simmer for 12–15 minutes until the vegetables are tender.
5. For a thicker soup, blitz about a third of the soup with a stick blender, then stir it back through.
6. Add the spinach and cook for 2 minutes until just wilted. Stir in the lemon juice, season with pepper and a little salt, and serve with wholegrain bread.

**Why this works for THA:** Chickpeas provide plant protein and fibre; the vegetable base is built from scratch with no packet stock paste dominating and no jar sauce. Lemon and herbs carry the flavour so salt stays low. It is plant-forward and genuinely filling.

**Planner readability notes (factual properties only):**
- category: lunch
- contains chickpeas
- contains spinach
- served with wholegrain bread
- mild base recipe
- batch-cook friendly
- freezer friendly (freeze before adding lemon; add fresh on reheating)

---

### THA-003 — The Healthy Apples Basil Tomato Wholewheat Pasta

- **recipe_id:** THA-003
- **recipe_name:** The Healthy Apples Basil Tomato Wholewheat Pasta
- **category:** dinner
- **difficulty:** easy
- **servings:** 4
- **prep time:** 10 minutes
- **cook time:** 25 minutes

**Introduction:** A proper from-scratch tomato and basil sauce, slow-softened with onion and garlic, tossed through wholewheat pasta. No jar, no packet — just real tomatoes cooked down until sweet and glossy. A weeknight foundation the whole family can share.

**Ingredients:**
- 350g wholewheat pasta (penne or fusilli)
- 1 tbsp olive oil
- 1 onion, finely chopped
- 3 garlic cloves, finely chopped
- 2 x 400g tins chopped tomatoes
- 1 tbsp tomato purée
- 1 tsp dried oregano
- 1 tsp balsamic vinegar
- A pinch of black pepper, salt to taste
- 1 large handful fresh basil, torn
- 30g Parmesan or a vegetarian hard cheese, grated (optional, to serve)

**Method:**
1. Heat the olive oil in a wide pan. Cook the onion gently for 8 minutes until soft and translucent.
2. Add the garlic and oregano and cook for 1 minute.
3. Stir in the tomato purée, then add the chopped tomatoes and balsamic vinegar. Half-fill one empty tin with water, swirl, and add that too.
4. Simmer gently for 15–18 minutes, stirring now and then, until thickened and rich. Season with pepper and a little salt.
5. Meanwhile cook the wholewheat pasta in boiling water until just tender. Reserve a mugful of pasta water, then drain.
6. Toss the pasta through the sauce, loosening with a splash of pasta water if needed. Stir through most of the basil.
7. Serve topped with the remaining basil and a little grated cheese if wanted.

**Why this works for THA:** The sauce is built from whole ingredients with no UPF base; long, gentle cooking brings natural sweetness so no added sugar is needed. Wholewheat pasta adds fibre and keeps the meal filling. It is mild, shareable and endlessly foundational.

**Planner readability notes (factual properties only):**
- category: dinner
- contains wholewheat pasta
- tomato-based sauce made from scratch (no jar sauce)
- mild base recipe
- batch-cook friendly (sauce)
- freezer friendly (sauce freezes well)

---

### THA-004 — The Healthy Apples Golden Potato, Chickpea & Spinach Curry

- **recipe_id:** THA-004
- **recipe_name:** The Healthy Apples Golden Potato, Chickpea & Spinach Curry
- **category:** dinner
- **difficulty:** easy
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 30 minutes

**Introduction:** A mild, golden curry built on a real spice base — onion, garlic, ginger and ground spices bloomed in oil, not a jar. Potatoes and chickpeas make it filling; spinach keeps it fresh. Gentle enough for children, with heat left as an after-serving choice.

**Ingredients:**
- 1 tbsp vegetable oil
- 1 onion, finely chopped
- 3 garlic cloves, crushed
- 20g fresh ginger, grated
- 1 tsp ground cumin
- 1 tsp ground coriander
- 1 tsp ground turmeric
- 1 tsp garam masala
- 500g potatoes, peeled and cut into 2cm cubes
- 1 x 400g tin chopped tomatoes
- 1 x 400g tin chickpeas, drained and rinsed
- 300ml low-salt vegetable stock
- 100g fresh spinach
- Salt to taste
- Brown basmati rice or wholemeal flatbreads, to serve
- Fresh coriander, to finish (optional)

**Method:**
1. Heat the oil in a large pan. Cook the onion for 8 minutes until soft.
2. Add the garlic and ginger and cook for 1 minute, then stir in the cumin, coriander, turmeric and garam masala and cook for 30 seconds until fragrant.
3. Add the potatoes and stir to coat in the spices. Pour in the chopped tomatoes and stock.
4. Cover and simmer for 15 minutes, then add the chickpeas and cook, partly covered, for a further 8–10 minutes until the potatoes are tender and the sauce has thickened.
5. Stir through the spinach until wilted. Season with a little salt.
6. Serve with brown basmati rice or wholemeal flatbreads, scattered with fresh coriander. Offer chilli flakes or sliced fresh chilli at the table for those who want heat.

**Why this works for THA:** The curry base is made from whole spices and aromatics rather than a UPF paste. Chickpeas and potatoes provide plant protein, fibre and staying power, and the base is mild so the whole family can share it. Heat is a personal, after-serving addition.

**Planner readability notes (factual properties only):**
- category: dinner
- contains chickpeas
- contains potatoes
- contains spinach
- spice base made from scratch (no curry jar or paste)
- mild base recipe (chilli added after serving)
- served with brown rice or wholemeal flatbread
- batch-cook friendly
- freezer friendly

---

### THA-005 — The Healthy Apples Gentle Taco Rice Bowls

- **recipe_id:** THA-005
- **recipe_name:** The Healthy Apples Gentle Taco Rice Bowls
- **category:** dinner
- **difficulty:** easy
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 25 minutes

**Introduction:** A mild, build-your-own taco bowl over brown rice, using a small amount of quality beef mince stretched with black beans and plenty of vegetables. The spice mix is made from scratch and kept gentle, so children eat the base and the heat goes on top for those who want it.

**Ingredients:**
- 250g brown rice
- 1 tbsp olive oil
- 1 onion, finely chopped
- 1 red pepper, diced
- 2 garlic cloves, crushed
- 250g quality lean beef mince (about 12% fat, from a trusted source)
- 1 tsp ground cumin
- 1 tsp sweet smoked paprika
- 1 tsp dried oregano
- 1 tbsp tomato purée
- 1 x 400g tin chopped tomatoes
- 1 x 400g tin black beans, drained and rinsed
- 200g tin sweetcorn, drained (optional)
- Black pepper, salt to taste
- To serve: shredded lettuce, diced tomato, diced avocado, a squeeze of lime, natural yoghurt

**Method:**
1. Cook the brown rice in boiling water until tender, then drain.
2. Meanwhile, heat the oil in a large pan and cook the onion and red pepper for 6–7 minutes until soft. Add the garlic and cook 1 minute.
3. Push the vegetables to one side, add the beef mince and brown it well, breaking it up as it cooks.
4. Stir in the cumin, smoked paprika and oregano, then the tomato purée, and cook for 1 minute.
5. Add the chopped tomatoes, black beans and sweetcorn. Simmer for 10 minutes until thickened. Season with pepper and a little salt.
6. Divide the brown rice between bowls, spoon over the taco mixture, and let everyone add their own lettuce, tomato, avocado, lime and yoghurt.
7. Offer sliced jalapeños or hot sauce at the table for anyone who wants heat.

**Why this works for THA:** A modest amount of quality mince is stretched with black beans and vegetables — quality over quantity, plants leading. The spice mix is built from real ground spices, not a taco seasoning packet, keeping salt and additives down. The base is mild and assembled at the table so it flexes to every eater.

**Planner readability notes (factual properties only):**
- category: dinner
- contains beef mince
- contains black beans
- contains brown rice
- spice mix made from scratch (no seasoning packet)
- mild base recipe (jalapeños/hot sauce added after serving)
- assemble-at-table serving style
- batch-cook friendly (the taco mixture)
- freezer friendly (the taco mixture)

---

### THA-006 — The Healthy Apples Roast Vegetable & Butter Bean Traybake

- **recipe_id:** THA-006
- **recipe_name:** The Healthy Apples Roast Vegetable & Butter Bean Traybake
- **category:** dinner
- **difficulty:** easy
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 40 minutes

**Introduction:** A one-tray dinner of roasted seasonal vegetables and creamy butter beans, brought together with a simple tomato and garlic dressing made in the tin. Minimal washing up, maximum vegetables, and filling thanks to the beans.

**Ingredients:**
- 2 courgettes, cut into chunks
- 1 red pepper and 1 yellow pepper, cut into chunks
- 1 red onion, cut into wedges
- 300g cherry tomatoes
- 2 x 400g tins butter beans, drained and rinsed
- 3 garlic cloves, thinly sliced
- 2 tbsp olive oil
- 1 tsp dried mixed herbs
- 1 tbsp tomato purée
- 1 tsp balsamic vinegar
- Black pepper, salt to taste
- A handful of fresh parsley or basil, chopped
- Wholegrain bread or a spoon of brown rice, to serve

**Method:**
1. Heat the oven to 200°C fan. Put the courgettes, peppers, red onion and cherry tomatoes into a large roasting tray.
2. Add the garlic, 1 tbsp of the olive oil and the mixed herbs. Toss to coat and roast for 20 minutes.
3. Meanwhile, whisk the tomato purée, balsamic vinegar and remaining 1 tbsp olive oil with 3 tbsp water to make a loose dressing.
4. Take the tray out, add the butter beans, pour over the dressing and toss everything together. Return to the oven for 15–18 minutes until the vegetables are tender and lightly caramelised.
5. Season with pepper and a little salt, scatter with parsley or basil, and serve with wholegrain bread or brown rice.

**Why this works for THA:** Vegetables genuinely dominate the plate, with butter beans supplying plant protein and fibre so the meal stays filling without meat. Everything is whole-food and the "sauce" is a quick real-ingredient dressing rather than anything from a jar. It is a mild, low-effort family dinner.

**Planner readability notes (factual properties only):**
- category: dinner
- contains butter beans
- vegetable-forward (courgette, peppers, onion, tomatoes)
- one-tray / traybake method
- mild base recipe
- batch-cook friendly
- suitable to serve with wholegrain bread or brown rice

---

### THA-007 — The Healthy Apples Chicken, Leek & Wholewheat Orzo One-Pot

- **recipe_id:** THA-007
- **recipe_name:** The Healthy Apples Chicken, Leek & Wholewheat Orzo One-Pot
- **category:** dinner
- **difficulty:** medium
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 35 minutes

**Introduction:** A comforting one-pot of quality chicken thighs, soft leeks and wholewheat orzo cooked together so the pasta drinks up the flavour. A small amount of good chicken goes a long way alongside plenty of vegetables and greens stirred in at the end.

**Ingredients:**
- 1 tbsp olive oil
- 4 skinless, boneless chicken thighs (quality / higher-welfare), each cut into 3
- 2 leeks, sliced and washed
- 2 carrots, diced
- 2 garlic cloves, crushed
- 1 tsp dried thyme
- 250g wholewheat orzo
- 900ml low-salt chicken stock
- 100g frozen peas
- 80g fresh spinach
- Zest of 1 lemon and a squeeze of juice
- Black pepper, salt to taste
- Grated Parmesan or hard cheese, to serve (optional)

**Method:**
1. Heat the oil in a large, deep pan or casserole. Brown the chicken pieces for 4–5 minutes until golden, then lift out and set aside.
2. Add the leeks and carrots to the pan and cook gently for 6–7 minutes until softening. Stir in the garlic and thyme and cook 1 minute.
3. Return the chicken to the pan, add the orzo and pour in the stock. Stir well.
4. Simmer, stirring often so the orzo doesn't stick, for 12–14 minutes until the orzo is tender and the chicken is cooked through.
5. Stir in the peas and spinach and cook for 2–3 minutes until the greens wilt and the peas are hot.
6. Add the lemon zest and a squeeze of juice, season with pepper and a little salt, and serve with a little grated cheese if wanted.

**Why this works for THA:** A modest amount of quality chicken flavours a pot that is really carried by leeks, carrots, peas, spinach and wholewheat orzo — quality over quantity, plants leading. Everything cooks in real stock with no packet sauce, and it is mild and comforting for the whole table.

**Planner readability notes (factual properties only):**
- category: dinner
- contains chicken (thigh)
- contains wholewheat orzo
- contains leeks, carrots, peas and spinach
- one-pot method
- mild base recipe
- best eaten fresh (orzo continues to absorb liquid on standing)

---

### THA-008 — The Healthy Apples Lentil & Root Vegetable Cottage Pie

- **recipe_id:** THA-008
- **recipe_name:** The Healthy Apples Lentil & Root Vegetable Cottage Pie
- **category:** dinner
- **difficulty:** medium
- **servings:** 6
- **prep time:** 25 minutes
- **cook time:** 45 minutes

**Introduction:** A hearty, plant-forward cottage pie with a rich lentil and root-vegetable base under a golden mash topping. Deeply savoury from slow-cooked vegetables, tomato and herbs rather than any gravy packet — a proper batch-cook family dinner.

**Ingredients:**

*For the base:*
- 1 tbsp olive oil
- 1 onion, finely chopped
- 2 carrots, diced
- 2 celery sticks, diced
- 1 parsnip, diced
- 2 garlic cloves, crushed
- 1 tbsp tomato purée
- 300g dried green or brown lentils, rinsed (or 2 x 400g tins, drained)
- 1 x 400g tin chopped tomatoes
- 600ml low-salt vegetable stock
- 1 tsp dried thyme
- 1 tsp dried rosemary
- 1 tbsp Worcestershire sauce (or a vegetarian equivalent)
- 150g frozen peas
- Black pepper, salt to taste

*For the topping:*
- 1kg potatoes, peeled and chopped
- 200g swede or extra potato, peeled and chopped
- 30g butter
- 3 tbsp milk
- Black pepper

**Method:**
1. Heat the oil in a large pan. Cook the onion, carrot, celery and parsnip gently for 10 minutes until softening. Add the garlic and cook 1 minute.
2. Stir in the tomato purée, then add the lentils, chopped tomatoes, stock, thyme, rosemary and Worcestershire sauce.
3. Bring to a simmer, then cook, partly covered, for 30–35 minutes (if using dried lentils) until the lentils are tender and the mixture is thick. Add a splash more stock if it dries out. Stir in the peas and season. *If using tinned lentils, simmer for 15 minutes only.*
4. Meanwhile, boil the potatoes and swede until tender, about 18 minutes. Drain well, then mash with the butter and milk and season with pepper.
5. Heat the oven to 200°C fan. Spoon the lentil base into an ovenproof dish, top evenly with the mash and rough up the surface with a fork.
6. Bake for 25–30 minutes until the topping is golden and the filling bubbles at the edges. Rest for 5 minutes before serving with a green vegetable.

**Why this works for THA:** Lentils and a mix of root vegetables make a filling, high-fibre base with real depth built from aromatics, tomato and herbs — no packet gravy. Plants lead the plate entirely, and the generous batch size makes it a natural family foundation. The base is mild and child-friendly.

**Planner readability notes (factual properties only):**
- category: dinner
- contains lentils
- contains root vegetables (carrot, celery, parsnip, potato, swede)
- mash-topped bake
- mild base recipe
- batch-cook friendly (serves 6)
- freezer friendly (freezes well cooked or assembled)

---

### THA-009 — The Healthy Apples Salmon, Broccoli & Brown Rice Traybake

- **recipe_id:** THA-009
- **recipe_name:** The Healthy Apples Salmon, Broccoli & Brown Rice Traybake
- **category:** dinner
- **difficulty:** medium
- **servings:** 4
- **prep time:** 15 minutes
- **cook time:** 30 minutes

**Introduction:** Quality salmon fillets roasted over lemony broccoli and cherry tomatoes, served on nutty brown rice. A simple, fresh dinner where good fish is the treat and vegetables fill the plate. Gentle flavours the whole family can enjoy.

**Ingredients:**
- 250g brown rice
- 4 quality salmon fillets (about 120g each)
- 1 large head of broccoli, cut into small florets
- 250g cherry tomatoes
- 1 tbsp olive oil
- 2 garlic cloves, thinly sliced
- Zest and juice of 1 lemon
- 1 tsp dried oregano
- Black pepper, salt to taste
- Fresh dill or parsley, chopped, to finish

**Method:**
1. Cook the brown rice in boiling water until tender, then drain and keep warm.
2. Heat the oven to 200°C fan. Toss the broccoli florets and cherry tomatoes with the olive oil, garlic, oregano and lemon zest in a large roasting tray. Roast for 12 minutes.
3. Take the tray out, make four gaps and nestle in the salmon fillets. Squeeze over half the lemon juice and season with pepper and a little salt.
4. Return to the oven for 12–14 minutes until the salmon flakes easily and the broccoli is tender with lightly charred edges.
5. Spoon the brown rice onto plates, top with the roasted vegetables and salmon, finish with the remaining lemon juice and a scattering of dill or parsley.

**Why this works for THA:** A single quality salmon fillet per person sits alongside a generous amount of broccoli and tomato over wholegrain rice — quality protein with plants leading. Everything is whole-food, roasted simply with lemon, garlic and herbs, with no sauce shortcuts. It is mild and family-friendly.

**Planner readability notes (factual properties only):**
- category: dinner
- contains salmon
- contains broccoli
- contains brown rice
- one-tray / traybake method (rice cooked separately)
- mild base recipe
- best eaten fresh

---

### THA-010 — The Healthy Apples Roasted Carrot, Chickpea & Herb Grain Salad

- **recipe_id:** THA-010
- **recipe_name:** The Healthy Apples Roasted Carrot, Chickpea & Herb Grain Salad
- **category:** side
- **difficulty:** easy
- **servings:** 4 (as a side) / 2 (as a lunchbox main)
- **prep time:** 15 minutes
- **cook time:** 30 minutes

**Introduction:** A flexible grain salad of roasted carrots and chickpeas over wholegrain bulgur wheat, dressed with lemon and fresh herbs. Good warm as a side or packed cold for a lunchbox, and sturdy enough to hold its texture the next day.

**Ingredients:**
- 150g wholegrain bulgur wheat
- 400g carrots, cut into batons
- 1 x 400g tin chickpeas, drained and rinsed
- 2 tbsp olive oil
- 1 tsp ground cumin
- 1 tsp sweet smoked paprika
- Zest and juice of 1 lemon
- 3 spring onions, sliced
- A large handful of fresh parsley and mint, chopped
- 2 tbsp mixed seeds
- Black pepper, salt to taste

**Method:**
1. Heat the oven to 200°C fan. Toss the carrot batons and chickpeas with 1 tbsp of the olive oil, the cumin and the smoked paprika on a roasting tray. Roast for 25–28 minutes, turning once, until the carrots are tender and the chickpeas are lightly crisp.
2. Meanwhile, cook the bulgur wheat according to the packet (usually simmer 10–12 minutes, or soak in just-boiled water until tender), then drain any excess and fluff with a fork.
3. Whisk the remaining 1 tbsp olive oil with the lemon zest and juice and a little pepper and salt.
4. Combine the bulgur, roasted carrots and chickpeas, spring onions and herbs in a large bowl. Pour over the dressing and toss well.
5. Scatter with the mixed seeds. Serve warm as a side, or cool and pack into containers for a lunchbox.

**Why this works for THA:** Wholegrain bulgur and chickpeas make a fibre-rich, filling base, with roasted carrots and fresh herbs carrying the flavour so it needs little salt and no dressing from a bottle. It holds up well cold, making it a practical lunchbox option, and it is entirely whole-food and mild.

**Planner readability notes (factual properties only):**
- category: side
- contains chickpeas
- contains wholegrain bulgur wheat
- contains carrots
- mild base recipe
- lunchbox friendly
- can be served warm or cold
- keeps well for next-day eating

---

## Manual Verification Steps

**Starting page:**
- `docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md`

**User action:**
- Review each recipe manually.

**Expected behaviour:**
- Each recipe is original, whole-food-first, family-friendly and planner-readable.
- Every `recipe_name` begins with "The Healthy Apples".
- No recipe contains hard-coded THA adaptations or planner decisions.

**Success criteria:**
- 10 recipes created — ✅
- All recipes include ingredients and method — ✅
- Recipes use realistic UK ingredients — ✅
- Recipes avoid UPF sauce shortcuts — ✅ (all sauces built from real ingredients)
- Recipes suitable for future Cookbook import — ✅ (each carries recipe_id, recipe_name, category, servings, times, difficulty, ingredients, method)
- Recipe names follow the required branding convention — ✅

**Regression checks:**
- No code changed — ✅
- No database changed — ✅
- No migrations created — ✅
- No household fixtures changed — ✅

## User Acceptance Evidence

- **Recipe count:** 10 (THA-001 through THA-010).
- **Categories covered:** breakfast ×1 (THA-001), lunch ×1 (THA-002), dinner ×7 (THA-003, THA-004, THA-005, THA-006, THA-007, THA-008, THA-009), side / lunchbox-friendly ×1 (THA-010). Matches the requested 1 / 1 / 7 / 1 composition.
- **Branding confirmation:** every `recipe_name` begins with "The Healthy Apples". Full list:
  - THA-001 The Healthy Apples Apple, Oat & Cinnamon Morning Bowl
  - THA-002 The Healthy Apples Chickpea, Lemon & Spinach Soup
  - THA-003 The Healthy Apples Basil Tomato Wholewheat Pasta
  - THA-004 The Healthy Apples Golden Potato, Chickpea & Spinach Curry
  - THA-005 The Healthy Apples Gentle Taco Rice Bowls
  - THA-006 The Healthy Apples Roast Vegetable & Butter Bean Traybake
  - THA-007 The Healthy Apples Chicken, Leek & Wholewheat Orzo One-Pot
  - THA-008 The Healthy Apples Lentil & Root Vegetable Cottage Pie
  - THA-009 The Healthy Apples Salmon, Broccoli & Brown Rice Traybake
  - THA-010 The Healthy Apples Roasted Carrot, Chickpea & Herb Grain Salad
- **Adaptations not embedded:** no recipe contains a "THA adaptation", dietary swap, leftover reuse, or household-specific variant. "Why this works for THA" describes only the recipe's own properties.
- **Planner / Decision Engine ownership preserved:** planner readability notes describe factual recipe properties only and issue no instruction to the Planner, Household Reasoning, Food Intelligence Platform, or Decision Engine. THA infers adaptations, swaps, continuity and opportunities later from canonical ingredients and household/planner/shopping state.

## Definition of Done

- Batch 001 document exists — ✅ `docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md`
- 10 original recipes complete — ✅
- Every `recipe_name` begins with "The Healthy Apples" — ✅
- Ingredients and methods clear — ✅
- No THA adaptation logic included — ✅
- Rollback identifier reported — ✅ tag `rollback/cookbook-batch-001-pre` at commit `8e10ea3`
- Files changed reported — ✅ see below

## Files Changed

- **Added (new, previously untracked):** `docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md`
- No other files created, modified, or deleted by this task. No code, schema, migration, seed, or fixture changes.
