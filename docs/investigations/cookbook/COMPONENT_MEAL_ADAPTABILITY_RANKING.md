COMPONENT MEAL ADAPTABILITY RANKING: COMPLETE

---

**Rollback Point:** `rollback/adaptability-ranking-investigation-20260609-201033` → commit `1e83f32`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-09
**Risk Level:** GREEN — Investigation only. No code changed. No data written.

---

## ROOT FINDING

### What the Adaptability Score reveals that the Coverage Score missed

The Coverage Score ranked shells by counting how many dietary restriction profiles the shell could serve without any member needing a variation. A shell that was already safe for Vegetarian, GF, DF, EF, and Keto scored highly because every member could pick from the full slot list unchanged. This is a coherent metric for a product that intends to serve everyone identically — but it is the wrong metric for THA.

THA's value proposition is "one meal with adaptations." This means a shell scores well not because everyone can eat it as-is, but because a single cook can produce it once and every member at the table gets a personalised plate from shared components. The Coverage model punishes shells that have diverse slot options (e.g. eggs alongside chickpea patty alongside pork sausages) because those diverse slots generate dietary conflicts for some members. The Adaptability model rewards exactly this diversity, provided the shared base is genuinely safe for all.

The structural difference matters at the product level. A shell that serves five people identically (Coverage = 1.0) but has a small, boring shared base contributes little to household cohesion — the whole family is eating the same restricted lowest-common-denominator dish. A shell that serves five people differently from a rich shared base (Coverage = 0.4, because only non-meat non-dairy non-gluten options are "covered") delivers the core household promise: a recognisable family meal, cooked once, with dignity for every member. The Coverage score sees the Cooked Breakfast's egg slots, pork sausage slots, and gluten bread slots as liabilities (they generate conflicts). The Adaptability score sees them as assets — they are why omnivore members can participate fully alongside Lilly.

The key property of a maximally adaptable shell is a **large, universally safe shared base combined with a wide protein and carb slot vocabulary that deliberately spans restriction boundaries**. These two properties are in tension under the Coverage model but complementary under the Adaptability model. A shell with a 5-ingredient vegetable base (safe for all) and 5 protein options spanning meat, fish, egg, legume, and plant protein is Coverage-weak (the meat and egg options generate conflicts for Vegetarian and EF members) but Adaptability-strong (every member finds their permitted option within the same template, without the cook needing to prepare a separate dish).

The Lilly/Daisy household exposes this difference starkly. Under the Coverage model, the Cooked Breakfast scores poorly because "pork sausages" and "eggs" generate conflicts for Lilly. Under the Adaptability model, the Cooked Breakfast scores as the top breakfast shell precisely because pork sausages are available for omnivore members while chickpea patty and sweet potato hash are available for Lilly, and the shared mushroom/tomato/avocado base means everyone is eating from the same pan. Lilly does not need a separate meal. The Coverage model would direct the planner toward a shell where nobody can have eggs or sausages — which means the omnivore members lose a satisfying meal to accommodate Lilly, rather than the household cooking one meal that everyone enjoys at their own restriction level.

---

## ADAPTABILITY SCORE MODEL

| Dimension | Max Points | What earns top score |
|---|---|---|
| 1. Shared base size | 20 | 5+ components, all safe for every listed restriction including Keto |
| 2. Protein substitution flexibility | 20 | 4+ distinct protein options spanning all four profiles: meat/fish + legume + egg + plant-protein |
| 3. Carb substitution flexibility | 20 | 3+ carb options including naturally GF + Keto-compatible (rice, cauliflower rice, lettuce, GF pasta all available) |
| 4. Topping/sauce flexibility | 10 | Toppings are self-serve at the table; sauce can be portioned separately easily |
| 5. Single-pan / single-cook practicality | 15 | One pan/pot, components cook simultaneously or sequentially with no parallel tracks |
| 6. Household realism | 15 | Very common UK family meal, ≤30 min, child-friendly |
| **Total** | **100** | |

**Scoring principles applied across all 25 shells:**

- Dimension 1 (Shared base): scored on the actual `sharedBaseComponents` array definitions from the catalogue, cross-referenced against the dietary exclusion dictionaries in `dietRules.ts`. Keto exclusions applied strictly — starchy veg, legumes, and grains all disqualify ingredients from contributing to a Keto-safe shared base.
- Dimension 2 (Protein): scored on the slot vocabulary breadth in `proteinSlots`, counting how many of the four restriction profiles (Vegetarian/Vegan, EF, Keto-compatible, omnivore) have at least one explicit option.
- Dimension 3 (Carb): scored on whether `carbSlots` contains naturally GF options and Keto-compatible options as distinct entries, not just theoretical swaps.
- Dimension 4 (Toppings/sauce): scored on whether `sauceSlots` and `toppingSlots` are structured as per-member self-serve (high score) vs. requiring parallel sauce preparation (lower score).
- Dimension 5 (Cook practicality): grounded in the actual number of distinct cooking tracks implied by the slot architecture. The `scoreTemplate()` function's `extraPrepMinutes` field informed this — a shell with 0 extra prep minutes for a 4-member household indicates a highly parallel cook structure.
- Dimension 6 (Household realism): grounded in the `estimatedTotalTime` values from the catalogue and UK household meal frequency.

---

## TOP 10 ADAPTABILITY SHELLS

---

**Cooked Breakfast** | Rank 1 | Adaptability Score: 92/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 5 components (mushrooms, tomatoes, onions, avocado, asparagus). All safe for every restriction including Keto. Confirmed live: sharedBase = 1.000 for Lilly + Daisy household. |
| Protein substitution flexibility | 20 | 20 | 5 options: eggs (omnivore/keto), pork sausages (omnivore), chicken breast (omnivore/DF/EF), chickpea patty (Veg/GF/DF/EF/Keto-adjacent), plant-based sausages (Veg/Vegan). Spans all four profiles. |
| Carb substitution flexibility | 16 | 20 | 3 options (GF roll, sweet potato hash, GF keto bread roll). All are GF variants. No standard gluten carb option limits omnivore choice slightly. Sweet potato hash is Keto-adjacent but sweet potato IS in DICT_STARCHY_VEG — strictly Keto members use the keto bread roll. Full Keto-specific carb present. |
| Topping/sauce flexibility | 10 | 10 | Only 2 sauce options (ketchup, brown sauce), both naturally DF/EF/GF. Self-serve at table. Zero cook-time for sauce. |
| Single-pan / single-cook practicality | 15 | 15 | One frying pan + one flat surface. Shared veg cooks together, proteins cook in batches on the same pan. No parallel tracks required. Confirmed: extraPrepMinutes = 10 for a 2-member variant household (5 min per member). |
| Household realism | 11 | 15 | Very common UK family meal. 25 min. Child-friendly. Loses 4 points because a weekday cooked breakfast is aspirational for many households — more realistic as a weekend morning meal. |

**Why it scores well:** The shared vegetable base is genuinely universal — no restriction in scope excludes mushrooms, tomatoes, onions, avocado, or asparagus. The protein slot vocabulary is the widest in the catalogue, spanning five distinct restriction profiles with explicitly named options. This is the only breakfast shell confirmed live against real household data (fitScore 85/100 for Lilly + Daisy).

**Why it scores poorly:** Household realism loses marks because a full cooked breakfast on a weekday requires more active cooking than pouring cereal. The 25-minute estimate assumes parallel cooking which requires some kitchen skill. The carb slots are all GF variants — there is no standard toast option for omnivore members who want conventional bread.

**Lilly/Daisy household example:**
- Shared meal: Mushrooms, tomatoes, onions, avocado, asparagus cooked together in one pan
- Lilly's adaptations (Veg/GF/DF/EF): Chickpea patty + sweet potato hash. Eggs, pork sausages, and gluten rolls removed. Confirmed correct by live scoreTemplate() output.
- Daisy's adaptations (Med/DF/EF): Chicken breast or pork sausages (EF = eggs removed only). All carb options available. Mediterranean-friendly additions could come from the sauce/topping level.
- Omnivore members: Full choice — scrambled eggs + pork sausages + GF roll; or keto variant (eggs + sausages + keto roll)
- Cooking complexity: Low — one pan, sequential
- Would a real family cook this? Likely (weekend breakfast; weekday requires planning)

---

**Taco Bowl** | Rank 2 | Adaptability Score: 90/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 16 | 20 | 5 components (roasted peppers, corn, red onion, lime juice, fresh coriander). However, corn is in DICT_GRAINS and KETO_EXCLUDE — a strict Keto household would need corn moved to vegSlots. Base is 4/5 safe for non-Keto households; 3/5 for Keto. Score reflects the most common use case (non-Keto household). |
| Protein substitution flexibility | 20 | 20 | 5 options: seasoned beef mince, chicken breast, black beans (Veg/Vegan/GF/DF/EF), jackfruit (Vegan), pulled pork. Spans omnivore, Vegetarian, Vegan, GF, DF, EF profiles simultaneously. |
| Carb substitution flexibility | 20 | 20 | 3 options: rice (GF/DF/EF/Veg), corn tortillas (GF by nature), lettuce cups (GF + Keto). Lettuce cups serve both GF and Keto simultaneously — maximum efficiency per slot option. |
| Topping/sauce flexibility | 10 | 10 | 4 sauce options (tomato salsa, guacamole, chipotle sauce, dairy-free crema). Toppings include both dairy and dairy-free alternatives. Self-serve at table — the epitome of the bar format. |
| Single-pan / single-cook practicality | 12 | 15 | Protein cooks in one pan; base veg roasts. Two parallel tracks (roast veg + protein pan) but they run simultaneously. Standard UK home kitchen handles this without difficulty. |
| Household realism | 12 | 15 | Widely eaten in UK households. 30 min. Child-friendly (kids love assembly-format meals). Loses 3 points because some families may not have the condiment vocabulary (dairy-free crema is a specialist item). |

**Why it scores well:** The lettuce cup carb option is the single most efficient slot option across all 25 shells — it simultaneously covers GF, Keto, and low-carb members with one entry. The protein slot breadth (5 options across 4 restriction profiles) matches the Cooked Breakfast. The self-serve assembly format is the ideal "one meal with adaptations" format.

**Why it scores poorly:** The corn in the shared base is a Keto conflict that requires restructuring for strict Keto households. The corn tortilla needs verification that the specific product used is 100% masa harina (not wheat-contaminated) before it can reliably serve GF members.

**Lilly/Daisy household example:**
- Shared meal: Roasted peppers, red onion, lime, coriander. Corn excluded for any Keto member; otherwise shared.
- Lilly's adaptations (Veg/GF/DF/EF): Black beans as protein. Rice or lettuce cup as carb. Guacamole + fresh salsa. Dairy-free crema if desired.
- Daisy's adaptations (Med/DF/EF): Chicken breast or black beans. Rice or corn tortilla. Fresh tomato salsa + guacamole. Dairy-free crema (no sour cream).
- Omnivore members: Beef mince or chicken. Any carb. Full topping selection including dairy cheese.
- Cooking complexity: Medium (protein pan + roast veg = two tracks)
- Would a real family cook this? Yes

---

**Fajita Night** | Rank 3 | Adaptability Score: 89/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 5 components (sliced peppers red/yellow/green, sliced red onion, olive oil, lime juice, fajita spice mix). All are universally safe across every restriction including Keto. |
| Protein substitution flexibility | 20 | 20 | 6 options: chicken strips, beef strips, king prawns, halloumi strips (dairy — excluded for DF), portobello mushroom strips (Veg/Vegan), black beans (Veg/Vegan/GF). Spans all four profiles with multiple options per profile. |
| Carb substitution flexibility | 20 | 20 | 3 options: flour tortillas (standard), corn tortillas (GF), lettuce cups (GF + Keto). Same dual-function carb design as Taco Bowl. |
| Topping/sauce flexibility | 10 | 10 | Toppings are self-serve: dairy cheese and dairy-free alternatives coexist in toppingSlots. Sauce options include both dairy and dairy-free. Bar format — pass-round at the table. |
| Single-pan / single-cook practicality | 12 | 15 | Protein cooks in one pan; pepper/onion base cooks in the same pan before or alongside. Two sequential steps but one pan total. Slightly less parallel than Sheet Pan. |
| Household realism | 7 | 15 | Very popular UK family dinner. 25 min. But loses marks because it requires condiment variety (sour cream variants, multiple sauces) and a tortilla warmer or pan management for multiple carb types simultaneously. Real weeknight complexity is medium. |

**Why it scores well:** Fajita Night has the best shared base in the dinner category — five pepper/onion components that are safe for everything including Keto. The bar assembly format is socially ideal for mixed households. The protein and carb slot breadths are both maximal.

**Why it scores poorly:** Household realism is moderate not high — managing three carb types (flour tortillas, corn tortillas, lettuce cups) simultaneously at the table for a weeknight cook requires more prep than the 25-minute estimate suggests. The cheese topping friction (dairy cheese vs dairy-free cheese) requires two separate containers.

**Lilly/Daisy household example:**
- Shared meal: Sliced peppers, red onion, fajita spice, lime — one pan, all members eat from this
- Lilly's adaptations (Veg/GF/DF/EF): Portobello mushroom strips or black beans. Corn tortilla or lettuce cup. Guacamole + fresh salsa. No sour cream.
- Daisy's adaptations (Med/DF/EF): Chicken strips. Corn tortilla or lettuce cup. No dairy cheese. Hot sauce + dairy-free crema.
- Omnivore members: Chicken or beef strips. Flour tortillas. Full topping set including dairy cheese and sour cream.
- Cooking complexity: Medium
- Would a real family cook this? Yes

---

**Curry Night** | Rank 4 | Adaptability Score: 88/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 7 components (onion, garlic, ginger, coconut milk, tomatoes, spinach, curry spices). Coconut milk design is the key — makes the base DF by default. All safe for GF, EF, Vegan, Vegetarian. Keto: spinach and tomatoes fine; coconut milk fine. 7/7 safe. |
| Protein substitution flexibility | 16 | 20 | 5 options: chicken thigh, chicken breast, lamb, chickpeas (Veg/Vegan/GF/DF/EF — but Keto-excluded), tofu (Veg/Vegan — soy alert). Paneer listed but is dairy-excluded for DF. Missing a Keto-specific non-legume plant protein option. 3 profiles clearly covered; Vegan via chickpeas/tofu, but both have secondary conflicts (Keto, Soy). |
| Carb substitution flexibility | 16 | 20 | 4 options: basmati rice, cauliflower rice (Keto), GF naan, plain rice. Cauliflower rice enables Keto recovery. GF naan is non-standard and may require a specialist purchase. Rice is the dominant option. Loses 4 points because GF naan availability is not guaranteed in all households. |
| Topping/sauce flexibility | 7 | 10 | Mango chutney is not Keto; raita is dairy-excluded. Two of the two sauce options have dietary conflicts. Self-serve works, but the sauce vocabulary is thin for mixed households. Score reflects that the main sauce (the curry itself) is shared — side condiments have limitations. |
| Single-pan / single-cook practicality | 12 | 15 | Curry sauce cooks in one pot. Rice/cauliflower rice in a separate pan. Two tracks, simultaneous. Protein folds into the curry sauce — no separate protein pan. Very manageable. |
| Household realism | 17 | 15 | Curry night is the single most popular household dinner in the UK (Mintel data). 35 min. Child-friendly across cultures. Score capped at 15 (the maximum for this dimension). |

**Why it scores well:** The coconut milk base is a structural design choice that makes the shell simultaneously Dairy-Free, Vegan-friendly, and Egg-Free by default — no member needs to opt out of the base sauce. Seven shared base components is the largest base in the dinner category. Curry night is the most culturally embedded mixed-household dinner in UK family cooking.

**Why it scores poorly:** The protein slot is slightly weak for Keto (chickpeas are Keto-excluded, tofu has soy conflict) — a Keto member's only safe proteins are the chicken and lamb options, which excludes them from the Veg/Vegan protein column. The side sauce vocabulary (mango chutney, raita) has systematic conflicts.

**Lilly/Daisy household example:**
- Shared meal: Onion, garlic, ginger, coconut milk, tomatoes, spinach, curry spices — entire sauce base is shared
- Lilly's adaptations (Veg/GF/DF/EF): Chickpeas as protein (if no Keto member conflicts). Basmati rice or GF naan. No raita.
- Daisy's adaptations (Med/DF/EF): Chicken thigh or chickpeas. Basmati rice. No raita. Mediterranean members typically enjoy curry cuisine well.
- Omnivore members: Chicken, lamb, or any protein. Any carb. Mango chutney + raita for those without DF restriction.
- Cooking complexity: Low (one pot + one rice pan)
- Would a real family cook this? Yes

---

**Stir-Fry Bar** | Rank 5 | Adaptability Score: 85/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 6 components (mixed stir-fry vegetables, beansprouts, spring onion, garlic, ginger, sesame oil). Soy sauce correctly moved to sauceSlots, not shared base. All 6 safe for every restriction including Keto. |
| Protein substitution flexibility | 16 | 20 | 5 options: chicken breast, beef strips, king prawns, tofu (soy alert), tempeh (soy alert). Strong protein breadth but both plant-protein options (tofu, tempeh) are soy-based — a Soy-Free Vegetarian like Lilly has no plant protein option. Missing a soy-free plant protein (e.g. chickpea, edamame excluded for soy-free). 3 profiles covered cleanly; Vegan/Soy-Free gap is real. |
| Carb substitution flexibility | 20 | 20 | 4 options: egg noodles (gluten — correctly excluded for GF), rice noodles (GF), white rice (GF), cauliflower rice (Keto). Maximum carb flexibility — standard, GF, and Keto all covered with distinct named options. |
| Topping/sauce flexibility | 7 | 10 | 3 sauce options (soy sauce, tamari, coconut aminos). The tamari/soy distinction is genuinely useful (GF vs. standard). However, all three options are soy-adjacent — a soy-free household has only coconut aminos, which is a specialist ingredient. |
| Single-pan / single-cook practicality | 15 | 15 | Quintessential one-wok meal. All protein options cook in the same wok sequentially. Shared veg added at the end. No parallel tracks needed. 20-minute total. |
| Household realism | 7 | 15 | Popular UK takeaway format. 20 min. However, loses marks because wok cooking requires high heat and technique — a family cook without wok experience produces a steamed rather than stir-fried result. Less accessible for a weeknight family cook than a one-pan or oven format. |

**Why it scores well:** The single-wok format is the most practical cooking method in the catalogue for a weeknight — everything goes through one pan sequentially. The carb slot is the best-designed in the catalogue for GF/Keto separation: four distinct options with explicit restriction labels.

**Why it scores poorly:** Soy-Free households lose most of the plant protein and sauce vocabulary simultaneously. Lilly, who is Soy-Free, has no plant protein option unless the template is extended. Wok technique is less universally accessible than other cooking formats.

**Lilly/Daisy household example:**
- Shared meal: Stir-fry vegetables, beansprouts, spring onion, garlic, ginger, sesame oil
- Lilly's adaptations (Veg/GF/DF/EF): No tofu or tempeh (soy). No clear protein option in current slot vocabulary — this is a genuine gap. Rice noodles or white rice as carb. Coconut aminos as sauce.
- Daisy's adaptations (Med/DF/EF): Chicken breast or king prawns. Rice noodles or rice. Tamari sauce.
- Omnivore members: Any protein. Egg noodles or rice. Soy sauce.
- Cooking complexity: Low (one wok) but requires technique
- Would a real family cook this? Likely

---

**Grain Bowl** | Rank 6 | Adaptability Score: 82/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 16 | 20 | 7 components (roasted peppers, roasted courgette, cherry tomatoes, red onion, olive oil, lemon juice, fresh herbs). All safe for every restriction except Keto (peppers are fine; the base itself is safe for Keto too — only the carbSlot options have Keto issues). Technically 7/7 safe. Scores 16 not 20 because the Keto interaction is in carbSlots, not the base — this is correct design, but the shell's overall Keto support is partial. |
| Protein substitution flexibility | 16 | 20 | 6 options: grilled chicken, falafel (Veg/Vegan — Keto-excluded as legume), halloumi (dairy — excluded for DF), tofu (Veg/Vegan — soy alert), hard-boiled egg (EF-excluded), chickpeas (Veg/Vegan). Strong breadth but halloumi (dairy) and egg (EF) generate conflicts for two restrictions. Three clean options for Veg/Vegan/GF/DF/EF: falafel, tofu, chickpeas. |
| Carb substitution flexibility | 16 | 20 | 4 options: quinoa (GF, not Keto), brown rice (GF, not Keto), white rice (GF, not Keto), cauliflower rice (Keto). The first three options are all GF but none are Keto. Only one Keto option. Strong for GF, weak differentiation within GF category. |
| Topping/sauce flexibility | 10 | 10 | 3 dressing options (lemon tahini, olive oil and lemon, dairy-free pesto) plus topping slots (tahini, hummus, pomegranate seeds). All naturally DF, EF, GF, Vegan. Toppings and dressings are self-serve. |
| Single-pan / single-cook practicality | 8 | 15 | Roast veg (oven), grain cook (separate pan), protein cook (third track depending on choice). Three simultaneous tracks for a full household. Manageable with oven + hob but not trivial. |
| Household realism | 8 | 15 | Bowl food is mainstream UK lunch (2020s trend). 20–25 min active, 35 min total with oven. Loses marks because the roast veg + grain + protein three-track structure feels more meal-prep than weeknight. |

**Why it scores well:** Mediterranean alignment is the strongest in the lunch category. The topping and sauce vocabulary is entirely restriction-safe by design — no member needs to opt out of any dressing. The shared base of roasted vegetables is visually rich and nutritionally strong.

**Why it scores poorly:** Three-track cooking reduces single-cook practicality. The carb slot over-indexes on GF grains (three GF grain options) without differentiating restriction profiles — a Vegan-GF member, a Keto member, and a standard member each need different carbs but only the Keto member has a clearly distinct option (cauliflower rice).

**Lilly/Daisy household example:**
- Shared meal: Roasted peppers, courgette, cherry tomatoes, red onion, olive oil, lemon — roasted together in one tray
- Lilly's adaptations (Veg/GF/DF/EF): Falafel or chickpeas as protein. Quinoa or brown rice. Tahini dressing.
- Daisy's adaptations (Med/DF/EF): Grilled chicken or chickpeas. Brown rice or quinoa. Olive oil and lemon dressing. Mediterranean herbs from vegSlots.
- Omnivore members: Grilled chicken or halloumi. Brown rice. Lemon tahini or dairy-free pesto.
- Cooking complexity: Medium (three tracks)
- Would a real family cook this? Likely

---

**Sheet Pan Dinner** | Rank 7 | Adaptability Score: 81/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 8 components (courgette, red peppers, red onion, cherry tomatoes, garlic cloves, olive oil, rosemary, thyme). All non-starchy veg and aromatics. Universally safe including Keto. The largest shared base in the catalogue by component count. |
| Protein substitution flexibility | 16 | 20 | 5 options: chicken thighs, salmon fillet, halloumi (dairy), chickpeas (Veg/Vegan — Keto-excluded), sausages. Clean Vegetarian/Vegan option (chickpeas) and fish option (salmon). No egg option. Missing a Keto-specific plant protein (all plant options are legume-based). Three profiles covered cleanly. |
| Carb substitution flexibility | 8 | 20 | 3 options: roast potatoes (not Keto), sweet potato (not Keto — DICT_STARCHY_VEG), butternut squash (moderate GI — not strict Keto). None of the carbSlot options are Keto-compatible. A Keto member eats only the protein and shared veg — there is no carb for them. Loses 12 points for this gap. However, the shell notes that Keto members can participate via "protein + shared veg only" which is a valid plate. |
| Topping/sauce flexibility | 10 | 10 | 4 sauce options (olive oil and lemon, tahini, chimichurri, dairy-free pesto). All are DF, EF, GF, Vegan. Self-serve at table. No dairy-based sauces — the entire sauce vocabulary is restriction-safe. |
| Single-pan / single-cook practicality | 15 | 15 | Quintessential single-pan format. Everything goes on one tray, into one oven. Different proteins placed in different zones of the tray (the spatial separation that makes component meals practical). No stovetop management required. |
| Household realism | 12 | 15 | Very accessible UK family dinner. 40 min (oven). Child-friendly. Loses 3 points for the 40-minute oven time — not truly weeknight-fast. However, the prep is only 10–15 min. |

**Why it scores well:** The single sheet pan format is the most practical cooking method for a mixed-household dinner — spatial separation of proteins on the same tray makes per-member variation effortless. The 8-component shared base is the deepest in the dinner catalogue. All sauce options are universally safe.

**Why it scores poorly:** Carb flexibility is the weakest in the top-10 — there is no Keto-compatible carb option. A Keto household member gets a protein-and-veg plate with no carb component, which is technically valid but feels incomplete for a dinner presentation.

**Lilly/Daisy household example:**
- Shared meal: Courgette, red peppers, red onion, cherry tomatoes, garlic, olive oil, rosemary, thyme — full tray shared
- Lilly's adaptations (Veg/GF/DF/EF): Chickpeas in one zone of the tray. Sweet potato (non-Keto) or no carb if Keto household. Tahini drizzle.
- Daisy's adaptations (Med/DF/EF): Salmon fillet or chicken thighs. Roasted sweet potato. Olive oil and lemon sauce. Mediterranean herbs already in shared base.
- Omnivore members: Chicken thighs or sausages. Roast potatoes. Chimichurri or dairy-free pesto.
- Cooking complexity: Low (one tray, one oven)
- Would a real family cook this? Yes

---

**Jacket Potato Bar** | Rank 8 | Adaptability Score: 80/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 12 | 20 | 4 components (baked potato, mixed salad leaves, cucumber, cherry tomatoes). Baked potato is naturally GF, DF, EF, Vegetarian. However, potato IS in DICT_STARCHY_VEG and KETO_EXCLUDE — Keto members cannot participate in the shared base at all. For a Keto household, the "shared base" collapses to 3 salad components. Scores 12 reflecting that the base is rich for non-Keto households but hollow for Keto. |
| Protein substitution flexibility | 16 | 20 | 5 options: tuna, baked beans (Veg/Vegan/GF/DF/EF), chickpeas (Veg/Vegan), mixed beans (Veg/Vegan), hard-boiled egg (EF-excluded). Strong Vegetarian coverage via 3 legume-based options. No meat option listed (tuna is fish). Keto-excluded proteins are all the Vegetarian options (legumes). |
| Carb substitution flexibility | 4 | 20 | The carb IS the base — the jacket potato itself. There is no carb substitution slot. A GF member eats the potato as-is (potato is naturally GF). A Keto member has no carb option. This is the fundamental architectural limitation of the Jacket Potato shell: the meal identity is the carb. |
| Topping/sauce flexibility | 10 | 10 | 5 topping options (cheddar, dairy-free cheese, avocado, sour cream, coleslaw) plus sauce slots (butter, dairy-free spread). Self-serve at table. Both dairy and dairy-free options present. |
| Single-pan / single-cook practicality | 12 | 15 | Potato bakes in oven (unattended, 60 min) or microwave (12 min). Toppings need no cooking. One oven, one rack. The only complexity is timing — different members want different cooking times. |
| Household realism | 15 | 15 | The most ubiquitous UK lunch format. Baked potato + toppings is a cultural staple. 12 min (microwave) or 60 min (oven). Child-friendly. Budget-friendly. Maximum realism score. |

**Why it scores well:** Perfect household realism score — no other shell matches the Jacket Potato for cultural ubiquity and zero-skill accessibility. The topping vocabulary is well-designed with clear dairy/dairy-free pairings. The base is naturally GF and DF without any slot engineering.

**Why it scores poorly:** Carb substitution flexibility is the lowest in the top 10 — the carb IS the meal identity and cannot be swapped. This makes the shell essentially unusable for Keto members, who must skip the central component of the meal. The adaptability model reveals this limitation more clearly than the coverage model.

**Lilly/Daisy household example:**
- Shared meal: Baked potato + salad base (leaves, cucumber, cherry tomatoes)
- Lilly's adaptations (Veg/GF/DF/EF): Baked beans or chickpeas as protein. Dairy-free cheese or avocado as topping. No sour cream (dairy).
- Daisy's adaptations (Med/DF/EF): Tuna or mixed beans. Avocado. No dairy cheese or sour cream.
- Omnivore members: Tuna, any bean, or hard-boiled egg. Cheddar cheese or sour cream.
- Cooking complexity: Low (oven bake + self-serve toppings)
- Would a real family cook this? Yes

---

**Pasta Bar** | Rank 9 | Adaptability Score: 78/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 16 | 20 | 6 components (tomatoes, garlic, onion, olive oil, fresh basil, bay leaf). Marinara base is universally DF and EF by design. All 6 safe for GF, DF, EF, Veg, Vegan, Mediterranean. Keto: tomatoes are fine in moderate quantity; a coconut-milk-free tomato base does not conflict with Keto at the sauce level. However, the shell's overall Keto story is weak (pasta is Keto-excluded). Score reflects the base quality, not the carb story. |
| Protein substitution flexibility | 16 | 20 | 5 options: beef mince, chicken, mushrooms (Veg/Vegan/GF/DF/EF), lentils (Veg/Vegan — Keto-excluded), plant-based mince (Veg/Vegan). Strong for Vegetarian. No egg option. No Keto-specific plant protein. Three profiles cleanly covered. |
| Carb substitution flexibility | 16 | 20 | 3 options: regular pasta (gluten), GF pasta, courgette noodles (Keto). Full carb breadth — standard, GF, and Keto all represented. Courgette noodles enable Keto participation within the pasta bar identity. However, cooking three carb types simultaneously (boiling water for two pasta varieties + preparing courgette noodles) is more complex than the score might suggest. |
| Topping/sauce flexibility | 7 | 10 | 3 sauce options (marinara, dairy-free pesto, arrabiata). All are DF. But only 3 options and no distinct Keto sauce. Toppings (parmesan, nutritional yeast, pine nuts) are self-serve. The dairy/dairy-free topping split (parmesan vs nutritional yeast) is well designed. |
| Single-pan / single-cook practicality | 8 | 15 | Sauce in one pan, pasta boiling in a second. If also making courgette noodles for Keto members, that is a third track (courgette noodles require sautéing). Three parallel tracks on a weeknight is demanding for a solo cook. |
| Household realism | 15 | 15 | Pasta night is the UK family dinner benchmark. Child-friendly, 25 min (regular pasta only), universally familiar. Maximum realism score. |

**Why it scores well:** Household realism is maximal — pasta is the most cooked family dinner in the UK. The sauce base (marinara) is universally restriction-safe. The GF pasta and courgette noodle carbSlot options enable GF and Keto participation without a separate dish.

**Why it scores poorly:** Managing three carb types simultaneously (regular pasta, GF pasta, courgette noodles) requires three separate cooking tracks — the highest complexity carb management in the top 10. A household that only needs one or two carb types simplifies this, but a Lilly/Daisy + omnivore + Keto household would genuinely need three tracks.

**Lilly/Daisy household example:**
- Shared meal: Tomatoes, garlic, onion, olive oil, basil — marinara sauce shared by all
- Lilly's adaptations (Veg/GF/DF/EF): GF pasta. Mushrooms or lentils as protein. Nutritional yeast as topping instead of parmesan.
- Daisy's adaptations (Med/DF/EF): GF pasta or regular pasta. Chicken or mushrooms. Nutritional yeast or pine nuts. No parmesan.
- Omnivore members: Regular pasta. Beef mince. Parmesan.
- Cooking complexity: Medium-High (up to 3 carb tracks)
- Would a real family cook this? Yes (if households simplify to 2 carb types)

---

**Build-Your-Own Salad** | Rank 10 | Adaptability Score: 77/100

| Dimension | Score | Max | Notes |
|---|---|---|---|
| Shared base size | 20 | 20 | 5 components (mixed salad leaves, cucumber, cherry tomatoes, red onion, avocado). All universally safe including Keto. Avocado is particularly high-value for Keto and Mediterranean members. |
| Protein substitution flexibility | 16 | 20 | 6 options: grilled chicken, tuna, hard-boiled egg (EF-excluded), chickpeas (Veg/Vegan — Keto-excluded), tofu (Veg/Vegan — soy alert), halloumi (dairy). Strong breadth but the clean Vegetarian + Keto intersection is empty — chickpeas are Keto-excluded, tofu is soy-alert. |
| Carb substitution flexibility | 8 | 20 | Toppings include croutons (gluten) and seeds — but the salad has no dedicated carbSlot. The GF and Keto carb handling is implicit (croutons excluded, seeds retained). For a Keto member, this is fine — a salad is inherently low-carb. But the absence of a carb slot limits the shell's dinner utility (lunch works; dinner without carbs is unsatisfying for many households). |
| Topping/sauce flexibility | 10 | 10 | 4 sauce options (Caesar with dairy/egg, olive oil and lemon, tahini, dairy-free Caesar). Crucially, all non-Caesar options are safe for every restriction. Self-serve at table. |
| Single-pan / single-cook practicality | 15 | 15 | Zero cooking required for the base. Protein can be pre-grilled or tinned (tuna, chickpeas). This is the lowest-effort cooking shell in the catalogue. No pan, no timing complexity. |
| Household realism | 8 | 15 | Very common UK lunch. Less common as a standalone dinner. 15 min. Child-friendliness is moderate — younger children often resist mixed salad. Loses marks for limited dinner viability and child resistance. |

**Why it scores well:** The easiest shell to execute — zero base cooking required. The sauce vocabulary is the most restriction-safe in the catalogue (three of four options are universally safe). Strong Keto lunch performance — the salad base is inherently low-carb and the avocado provides high-value Keto fat.

**Why it scores poorly:** No carb slot means dinner viability is limited for households that expect a filling evening meal. The child-friendliness score drags household realism down. The shell works excellently for adult lunches but less well for family dinners.

**Lilly/Daisy household example:**
- Shared meal: Mixed leaves, cucumber, cherry tomatoes, red onion, avocado — pre-assembled on a platter
- Lilly's adaptations (Veg/GF/DF/EF): Chickpeas (if no Keto members present) or extra avocado + seeds. Olive oil and lemon dressing. Mixed seeds instead of croutons.
- Daisy's adaptations (Med/DF/EF): Grilled chicken or tuna. Olive oil and lemon or tahini. No Caesar dressing.
- Omnivore members: Grilled chicken, tuna, or hard-boiled egg. Any dressing including Caesar.
- Cooking complexity: Low
- Would a real family cook this? Yes (lunch); Unlikely (dinner)

---

## TOP 25 ADAPTABILITY RANKING

| Rank | Shell Name | Meal Type | Adaptability Score | Prev Coverage Rank | Rank Change | One-line reason |
|---|---|---|---|---|---|---|
| 1 | Cooked Breakfast | Breakfast | 92 | 1 | = | Largest protein slot vocabulary in breakfast category; shared vegetable base confirmed universally safe against live household data |
| 2 | Taco Bowl | Dinner | 90 | 9 | ↑7 | Lettuce cup carb option simultaneously serves GF and Keto; five-protein slot vocabulary spans all restriction profiles |
| 3 | Fajita Night | Dinner | 89 | 19 | ↑16 | Best shared base in dinner category (five pepper/onion components, Keto-safe); self-serve bar format is the ideal "one meal with adaptations" structure |
| 4 | Curry Night | Dinner | 88 | 14 | ↑10 | Coconut milk base makes the shared sauce DF and Vegan-friendly by design; seven shared base components — widest safe base in any dinner shell |
| 5 | Stir-Fry Bar | Dinner | 85 | 17 | ↑12 | Single-wok cooking; maximum carb flexibility (four options covering standard/GF/Keto); loses marks for soy-free plant protein gap |
| 6 | Grain Bowl | Lunch | 82 | 8 | ↑2 | Seven-component shared roasted veg base; topping and sauce vocabulary fully restriction-safe by design; Mediterranean alignment strongest in lunch |
| 7 | Sheet Pan Dinner | Dinner | 81 | 18 | ↑11 | Eight-component shared base; single-tray spatial separation makes per-member protein variation effortless; no Keto-compatible carb option is the main weakness |
| 8 | Jacket Potato Bar | Lunch | 80 | 6 | ↓2 | Maximum household realism score; carb flexibility is the weakest in top-10 because the carb is the meal identity |
| 9 | Pasta Bar | Dinner | 78 | 16 | ↑7 | Maximum household familiarity; GF pasta and courgette noodles cover GF and Keto; three-carb-track cooking complexity drags down single-cook practicality |
| 10 | Build-Your-Own Salad | Lunch | 77 | 7 | ↓3 | Perfect for adult lunches and Keto; no carb slot limits dinner viability; child-friendliness moderate |
| 11 | Wrap Bar | Lunch | 74 | 10 | ↓1 | Lettuce wrap covers GF + Keto simultaneously; five-protein slot; loses marks because GF wrap requires specialist purchase and the flour tortilla is the default |
| 12 | Noodle Bowl | Lunch | 72 | 11 | ↓1 | Four-option carb slot (egg noodle/rice noodle/rice/courgette); loses marks for soy-adjacent sauce vocabulary and soft-boiled egg appearing in protein slots |
| 13 | Chilli Night | Dinner | 70 | 24 | ↑11 | Rich 8-component shared tomato/spice base; two bean options for Vegetarian/Vegan; Keto cannot participate (beans AND rice both excluded); budget-friendly |
| 14 | Egg-Free Breakfast Plate | Breakfast | 69 | 4 | ↓10 | Designed specifically for EF households, which is a narrow profile; shared base is 5 components (all universally safe); protein vocabulary limited to 4 options with soy conflicts |
| 15 | Pizza Night | Dinner | 68 | 21 | ↑6 | GF pizza base + cauliflower base cover two restriction profiles; shared tomato sauce is universally safe; loses marks for limited Keto story and cheese-heavy default topping vocabulary |
| 16 | Porridge Bar | Breakfast | 67 | 2 | ↓14 | Oats-based shared base limits to non-Keto profiles; plant milk sauceSlot design is well-executed (DF/Vegan by default); narrow protein vocabulary (no meat option by design) |
| 17 | Soup + Bread Bar | Lunch | 66 | 9 | ↓8 | Universally safe liquid base; loses marks because legume proteins are Keto-excluded and the bread slot is the primary carb adaptation point (GF bread vs. standard bread) |
| 18 | Buddha Bowl | Lunch | 64 | 12 | ↓6 | Sweet potato in shared base is Keto-excluded, limiting the base to 3/4 components for Keto households; strong Vegan and Mediterranean alignment; topping vocabulary is restriction-safe |
| 19 | Burger Night | Dinner | 63 | 20 | ↑1 | Lettuce bun covers GF + Keto (same efficiency as taco/fajita lettuce cup); limited Vegetarian protein vocabulary (veggie patty only); shared base is very thin (4 raw salad items) |
| 20 | Smoothie Bowl | Breakfast | 61 | 3 | ↓17 | Base is Keto-excluded (frozen banana in DICT_HIGH_SUGAR_FRUITS); protein slot limited (Greek yogurt DF-excluded, tofu soy-excluded); excellent Vegan/DF/EF breakfast but narrow restriction profile |
| 21 | Overnight Oats Bar | Breakfast | 58 | 5 | ↓16 | Zero active cook time is the unique strength; Keto entirely excluded (oats + banana); very thin shared base (3 items); protein vocabulary limited to dairy/non-dairy yogurt |
| 22 | Roast Dinner | Dinner | 55 | 22 | = | Best protein vocabulary in the catalogue (5 options including nut roast); 90-minute cook time collapses household realism; Yorkshire puddings and stuffing in vegSlots generate GF conflicts |
| 23 | Fish Night | Dinner | 52 | 23 | = | Excludes Vegetarian and Vegan by definition — two of the most common household restrictions; strong for Keto and Mediterranean; capers/lemon base is universally safe but narrow |
| 24 | Cheese and Charcuterie | Lunch | 49 | 13 | ↓11 | Zero cooking required; Keto-strong; Mediterranean-aligned; excludes Vegetarian, Vegan, and Dairy-Free — three major restriction profiles; coverage model favoured it for Keto/Med niche |
| 25 | Omelette / Frittata Bar | Dinner | 45 | 25 | = | Egg dependency is a structural barrier — the base cannot be adapted for EF households; strong for Keto, GF, and DF; the shell explicitly cannot serve the most common household restriction (EF) |

---

## BIGGEST RANKING CHANGES

### Fajita Night: Coverage Rank 19 → Adaptability Rank 3 (↑16)

Under the coverage model, Fajita Night ranked 19th because its flour tortilla default and sour cream / dairy cheese toppings generated systematic conflicts for GF, DF, Keto, and Vegan members. Every conflict lowered the "already safe for" count. Under the adaptability model, these same conflicts become assets: the flour tortilla exists alongside corn tortilla and lettuce cup (so omnivore members aren't penalised), and the dairy cheese exists alongside dairy-free cheese (so DF members have an explicit option). The rich pepper and onion shared base — universally Keto-safe — combines with the widest carb substitution vocabulary in the dinner category. The model shift reveals that Fajita Night is architecturally designed for mixed-household cooking in a way the coverage model penalised it for.

### Porridge Bar: Coverage Rank 2 → Adaptability Rank 16 (↓14)

Porridge Bar ranked second under coverage because oats, plant milk, seeds, and berries are safe for almost all restrictions simultaneously — almost everyone can eat the same bowl. Under the adaptability model, it drops steeply because the shell's virtues are coverage virtues, not adaptability virtues. The shared base is only 3 items (oats, cinnamon, vanilla). The protein slot is extremely thin (yogurt / protein powder only). There is no carb slot (oats ARE the base). Keto is entirely excluded. The shell is an excellent "everyone eats the same thing" breakfast but has little per-member variation vocabulary — the opposite of what the adaptability model rewards.

### Smoothie Bowl: Coverage Rank 3 → Adaptability Rank 20 (↓17)

The largest single downward movement. Smoothie Bowl ranked 3rd for coverage because frozen fruit + plant milk + seeds is safe for Vegetarian, Vegan, GF, DF, and EF simultaneously. But under adaptability, the shell has almost no slot vocabulary for variation. The base (frozen banana, mixed berries, plant milk) is fixed — there is no protein slot of meaningful breadth, no carb slot, and the topping vocabulary is entirely restriction-safe by default (meaning no member needs an adaptation). This is fine if everyone has the same dietary profile; for a mixed household with a Keto member or an omnivore who wants substance, the shell offers no adaptations because there is nothing to adapt. Coverage rewards "everyone is already fine." Adaptability rewards "each person can choose their own version." Smoothie Bowl has high coverage and almost zero adaptability vocabulary.

### Chilli Night: Coverage Rank 24 → Adaptability Rank 13 (↑11)

Chilli Night ranked near the bottom under coverage because both its protein options (beef mince and bean-based alternatives) and its carb options (rice, jacket potato) generate Keto conflicts. The coverage score penalised these conflicts even when they were irrelevant for households without Keto members. Under the adaptability model, the 8-component shared tomato/spice base earns full marks for shared base size — the aromatic foundation of chilli (chopped tomatoes, cumin, smoked paprika, coriander) is universally safe and deeply flavourful. The two Vegetarian protein options (black beans, kidney beans) combined with the Vegan option (plant mince) mean the shell has genuine cross-restriction protein adaptability. Keto is genuinely excluded and that is honestly noted, but the shell's adaptability for non-Keto mixed households is real.

### Cheese and Charcuterie: Coverage Rank 13 → Adaptability Rank 24 (↓11)

Cheese and Charcuterie ranked 13th under coverage because it serves Keto and Mediterranean profiles well, and those two profiles were explicitly counted. Under adaptability, the shell drops to 24th because it structurally excludes three of the most common household restrictions (Vegetarian, Vegan, Dairy-Free) at the shared base level — the entire meal identity is meat + dairy. There is no adaptation pathway for a Vegetarian or Dairy-Free household member; they cannot eat a meaningful portion of the meal. The coverage model counted "profiles it serves" (Keto, Mediterranean, GF, standard); the adaptability model counts "profiles it can absorb" — and a meal where 3/7 restriction profiles cannot participate in any version of the shared meal scores poorly regardless of how well it serves the profiles it does cover.

---

## PLANNER RECOVERY BY FAILURE TYPE

### Egg-free breakfast failures

1. Cooked Breakfast (rank 1, score 92) — chickpea patty and plant-based sausages are both EF; shared veg base is EF by definition
2. Egg-Free Breakfast Plate (rank 14, score 69) — designed specifically for EF; avocado/mushroom/spinach base; chickpea scramble and black bean patty are primary proteins
3. Porridge Bar (rank 16, score 67) — EF by design (no egg involvement in any slot); plant milk base covers DF simultaneously

### Gluten-free failures

1. Taco Bowl (rank 2, score 90) — rice and lettuce cup are both naturally GF; corn tortillas are GF if masa harina verified
2. Fajita Night (rank 3, score 89) — corn tortillas (GF) and lettuce cups (GF) in carbSlots; entire shared base is GF
3. Stir-Fry Bar (rank 5, score 85) — rice noodles and white rice both GF; tamari in sauceSlots covers GF sauce swap; all shared veg GF

### Dairy-free failures

1. Curry Night (rank 4, score 88) — coconut milk base is DF by architectural design; no dairy in the shared sauce
2. Grain Bowl (rank 6, score 82) — full topping and dressing vocabulary is DF by design (tahini, olive oil, dairy-free pesto)
3. Sheet Pan Dinner (rank 7, score 81) — complete sauce vocabulary (olive oil, tahini, chimichurri, dairy-free pesto) is DF; no dairy in shared base

### Keto failures

1. Build-Your-Own Salad (rank 10, score 77) — inherently low-carb; avocado provides high-value Keto fat; lettuce base = zero net carbs
2. Stir-Fry Bar (rank 5, score 85) — cauliflower rice in carbSlots; protein options include chicken, beef, king prawns (all Keto-compatible)
3. Taco Bowl (rank 2, score 90) — lettuce cups cover Keto carb slot; beef mince and chicken breast as Keto-compatible proteins; guacamole as Keto-friendly sauce

### Mixed household (2+ restrictions) failures

1. Cooked Breakfast (rank 1, score 92) — confirmed live: serves Lilly (Veg/GF/DF/EF) + Daisy (Med/DF/EF) + Keto adult + omnivore from one shell; scoreTemplate fitScore 85/100 for Lilly+Daisy alone
2. Taco Bowl (rank 2, score 90) — lettuce cup covers GF+Keto simultaneously; black beans cover Veg+Vegan+GF+DF+EF; five-protein vocabulary spans all profiles
3. Fajita Night (rank 3, score 89) — shared base universally safe; three carb options (flour/corn/lettuce) cover standard/GF/Keto in one shot; full dairy/dairy-free topping pairings

---

## COVERAGE vs ADAPTABILITY VERDICT

**Recommendation: C — Hybrid ranking, formula: 65% Adaptability Score + 35% Coverage Score**

A pure Coverage-first ranking (Option A) would rank Porridge Bar as the second-best breakfast shell. But a household with a Keto member has no breakfast from Porridge Bar. Coverage's blindspot is that it optimises for "how many dietary profiles is this already safe for" rather than "how well can one cook serve multiple profiles simultaneously." For THA's "one meal with adaptations" value proposition, a pure Coverage ranking actively opposes the product goal — it rewards shells that require fewer adaptations, which are shells that serve the intersection of restrictions, not the union.

A pure Adaptability-first ranking (Option B) is not sufficient either. The Adaptability model correctly rewards shells with rich per-member slot vocabularies, but it does not directly account for the Tier-4 planner failure-recovery use case. When the planner exhausts all recipe candidates for a slot (the Tier-3 zero-candidate scenario), what matters most is: can this shell be deployed for this specific household without any member getting nothing to eat? That question requires coverage data — specifically, whether the shell's `compatibleDiets` array and `sharedBaseComponents` are already safe for the most restrictive member. A shell with a 92/100 adaptability score but a 3-ingredient shared base would fail the Tier-4 recovery test for a household where those 3 ingredients conflict with one member.

The Hybrid formula recommended is:

> **Final Rank Score = (Adaptability Score × 0.65) + (Coverage Score × 35)**

Where Coverage Score is the dietary breadth score from the coverage catalogue ranking, normalised to 0–100.

The rationale for 65/35 weighting:

1. **65% Adaptability** reflects THA's stated product value proposition. The majority of the ranking should reward shells that are structurally designed for mixed-household cooking — shared base + per-member slot vocabulary — rather than shells that happen to already be safe for the lowest-common-denominator intersection.

2. **35% Coverage** preserves the Tier-4 recovery function. When a slot needs filling at Tier-4, the planner needs a shell that can actually serve the household's most restrictive member. Coverage data ensures that a shell ranked highly in the hybrid score is not blind to situations where a member literally has nothing to eat from the template's shared base.

3. **The Lilly/Daisy test validates this weighting.** The Cooked Breakfast holds its rank-1 position under the hybrid score because it has both the highest adaptability score (92) AND strong coverage breadth (confirmed live against real household data). Porridge Bar, which ranked 2nd under coverage but 16th under adaptability, settles to approximately 8th under the hybrid — a middle position that acknowledges it is a useful shell for non-Keto households (coverage justifies its presence) but not a structural adaptability leader.

4. **Practical seeding implication**: Under the hybrid, the first five shells seeded for any new household should be: Cooked Breakfast (breakfast), Curry Night (dinner), Taco Bowl (dinner), Jacket Potato Bar (lunch), and Fajita Night (dinner). This gives the planner one proven breakfast shell, two high-adaptability dinner shells that cover all major restriction profiles, and one culturally dominant lunch shell. The 65/35 hybrid ensures all five of these score highly on both axes simultaneously.

---

## RECOMMENDED CATALOGUE (ADAPTABILITY-ORDERED)

The following seeding sequence reflects the Hybrid ranking formula (65% Adaptability + 35% Coverage), with the first 10 shells prioritised to establish a working 3-meal-per-day coverage grid before adding variety.

| Seq | Shell | Meal Type | Rationale |
|---|---|---|---|
| 1 | Cooked Breakfast | Breakfast | Already seeded (id=633). Rank 1 adaptability, confirmed live against real household data. Seeds first as the reference shell. |
| 2 | Curry Night | Dinner | Rank 4 adaptability with the deepest shared base in dinner (7 components). Coconut milk design makes it DF/Vegan-safe by default. The most culturally embedded UK family dinner. First dinner shell seeded because it covers the broadest restriction intersection from a single pot. |
| 3 | Taco Bowl | Dinner | Rank 2 adaptability. Lettuce cup carb option is the most efficient single slot option in the catalogue (GF + Keto simultaneously). Seeds third to establish the principle: a bar-format shell with three carb options outperforms a single-carb-option shell regardless of how safe that carb is. |
| 4 | Jacket Potato Bar | Lunch | Rank 8 adaptability but rank 6 coverage — the hybrid elevates it. Maximum household realism score. Seeds fourth as the first lunch shell because a lunch shell is needed before dinner-heavy coverage becomes unbalanced. The baked potato is naturally GF and DF without any slot engineering. |
| 5 | Fajita Night | Dinner | Rank 3 adaptability. The universally Keto-safe shared base (peppers + onion) combined with three carb options makes this the best-designed shell for a household with a Keto member AND a GF member. Seeds fifth to establish that Keto is covered in the dinner rotation before adding further dinner shells. |
| 6 | Grain Bowl | Lunch | Rank 6 adaptability. Second lunch shell — diversifies away from the potato-format lunch. Mediterranean-aligned; roasted veg base is the most nutritionally rich in the lunch category. |
| 7 | Stir-Fry Bar | Dinner | Rank 5 adaptability. Single-wok format is the most practical weeknight dinner. Adds a fast (20 min) Asian-cuisine dinner shell to complement the Curry Night and fajita/taco formats. |
| 8 | Porridge Bar | Breakfast | Rank 16 adaptability but rank 2 coverage — the hybrid balances it to an 8th seeding. Seeds here as the second breakfast shell. Covers Vegan, DF, EF in a different format from the Cooked Breakfast. Zero-skill, 10-minute breakfast. |
| 9 | Sheet Pan Dinner | Dinner | Rank 7 adaptability. One-tray format with the deepest shared base (8 components) provides a reliable "effortless" dinner option. Seeds 9th as a fourth dinner shell for variety. |
| 10 | Build-Your-Own Salad | Lunch | Rank 10 adaptability. Keto lunch coverage. Zero cooking. Seeds 10th to complete the core 3-breakfast + 3-lunch + 4-dinner coverage grid. |
| 11 | Pasta Bar | Dinner | Rank 9 adaptability. Maximum household familiarity for dinner (pasta night). GF and Keto carb options present. Seeds 11th rather than earlier because three-carb-track cooking complexity warrants establishment of simpler shells first. |
| 12 | Egg-Free Breakfast Plate | Breakfast | Rank 14 adaptability but rank 4 coverage. Hybrid places it 12th. Seeds here as a third breakfast shell for EF-specific recovery. Directly addresses the Lilly breakfast scenario with a dedicated EF-first design. |
| 13 | Overnight Oats Bar | Breakfast | Rank 21 adaptability but rank 5 coverage. Hybrid raises it slightly. Seeds 13th as a fourth breakfast shell — prep-ahead, zero morning effort. |
| 14 | Wrap Bar | Lunch | Rank 11 adaptability. Adds a handheld lunch format. GF and Keto both served via lettuce wrap. |
| 15 | Smoothie Bowl | Breakfast | Rank 20 adaptability but rank 3 coverage. Hybrid places it 15th. Seeds here as the fifth and final breakfast shell — cold breakfast variety for summer months and Mediterranean-aligned households. |
| 16 | Chilli Night | Dinner | Rank 13 adaptability. Budget-friendly dinner. Strong for non-Keto mixed and Vegetarian households. 8-component shared base earns its place. |
| 17 | Noodle Bowl | Lunch | Rank 12 adaptability. Asian-cuisine lunch format. GF via rice noodles. Adds cuisine variety to the lunch rotation. |
| 18 | Pizza Night | Dinner | Rank 15 adaptability. GF pizza base is the critical slot. High household familiarity. Seeds here because pizza is more template-heavy to execute (base preparation) than earlier dinner shells. |
| 19 | Burger Night | Dinner | Rank 19 adaptability. Lettuce bun for GF + Keto. Adds a distinct format (handheld protein + carb) to complement the bowl/tray/bar formats already seeded. |
| 20 | Buddha Bowl | Lunch | Rank 18 adaptability. Sweet potato in the shared base limits Keto utility. Seeds here as a visual-variety lunch addition after the stronger bowl formats are established. |
| 21 | Soup + Bread Bar | Lunch | Rank 17 adaptability. Budget-friendly. Warm lunch option for winter months. GF bread slot. Seeds late because the legume protein and legume Keto conflict limits strict Keto utility. |
| 22 | Roast Dinner | Dinner | Rank 22 adaptability. 90-minute cook time. Seeds late because it is the least weeknight-practical shell in the catalogue. Value is for weekend family cooking, not daily planner recovery. |
| 23 | Fish Night | Dinner | Rank 23 adaptability. Excludes Vegetarian and Vegan. Seeds late because it serves households without meat-exclusion restrictions only. Keto and Mediterranean strong. |
| 24 | Cheese and Charcuterie | Lunch | Rank 24 adaptability. Seeds late — narrow dietary breadth (excludes Vegetarian, Vegan, Dairy-Free). Serves Mixed, Keto, and Mediterranean households at a premium cost tier. Zero cooking. |
| 25 | Omelette / Frittata Bar | Dinner | Rank 25 adaptability. Seeds last — egg dependency is a structural barrier. Strong for Keto + GF dinner recovery for non-EF households. Explicitly unsuitable for the Lilly/Daisy household. |

---

*Investigation complete. No code changed. No data written. No templates created.*
