# WS9 — Goal-Driven Alternatives Investigation

> **Status:** Investigation only. No implementation. No schema / UI / DB changes.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — only the untracked WS8 investigation was present |
| WS8 investigation protected | ✅ Committed as `cd4ef75` — *docs(ws8): preserve Food Discovery Foundations investigation* |
| Rollback point created | ✅ Tag `rollback/pre-ws9-20260620-214537` → `cd4ef75` |
| How to undo all WS9 work | `git reset --hard rollback/pre-ws9-20260620-214537` |

No work began until the rollback point was confirmed.

---

## EXECUTIVE SUMMARY

**Alternatives are not a new system. They are a fourth reading of the WS7 graph — the one that adds two
filters WS7/WS8 deliberately left out: a food's *role* and the household's *goal*.**

WS7 gave THA a typed food↔food graph (`alternative-to`, `similar-to`, `same-group`, …) plus a
household↔food overlay. WS8 defined Discovery as *"which `similar-to` edges deserve to be shown?"* —
answering **"what else might I enjoy?"** WS9 asks the harder question: **"what else could fulfil the same
*role* for *my goals*?"**

The single load-bearing finding:

> **THA can confidently answer the goal-driven alternatives question *today* for one narrow, high-trust
> slice — and only that slice. The slice where it is already safe is: *hard dietary patterns × ingredients
> THA has authored a substitution rule for.* That engine (`shared/substitution-rules.ts`) already does
> role-preserving, conflict-aware, non-judgemental substitution. Everything beyond that slice — soft
> nutrition goals (more fibre), philosophy goals (less UPF), practical goals (lower cost) — requires new
> editorial that does not yet exist, and most of it is Tier 3 (curated) trust, not algorithmic.**

The second finding, which matters more than the first:

> **The danger in WS9 is not "can we find an alternative?" It is "the word *alternative* implies the
> current food was deficient." Discovery is invitation; Alternatives is, by grammar, a comparison. THA's
> existing `ingredient_swaps` table literally names its columns `original → healthier`. WS9's whole job is
> to make sure the *architecture* never inherits that verdict — the swap may be neutral; the framing is
> where trust is won or lost, and it must be authored once, on the edge, not per feature.**

Three structural facts make the answer "yes, for the narrow slice":

1. **Role already lives in the meal model, not the food.** `meal_templates` decomposes a meal into
   `proteinSlots`, `carbSlots`, `vegSlots`, `sauceSlots`, `toppingSlots`, `sharedBaseComponents`
   (`shared/schema.ts:61-67`). A food's *role in a meal* is the slot it occupies. "What else could fill
   the protein slot?" is a question THA's data shape can already express.
2. **The household-adaptation case is already built.** `server/lib/household-meal-matcher.ts` produces
   per-member `memberChanges` (swaps) over a shared base — exactly the "Dad bacon / Mum eggs / Lilly veg
   sausages / Daisy beans over shared tomatoes-mushrooms-toast" example in the brief. The cooked-breakfast
   example is *not* a future feature; it is the matcher's output today.
3. **The diet-driven substitution engine is the alternatives engine.** `shared/substitution-rules.ts` maps
   `ingredient pattern + diet trigger → ranked replacements + cooking notes + prohibitedPhrases`. It is
   deterministic, reviewed, conflict-aware, and already enforces non-judgemental language downstream.

What is **missing** is everything that turns "diet substitution" into "goal-driven alternatives": a
soft-goal vocabulary, a role abstraction above ingredient strings, and a closeness/honesty rule for the
non-dietary goals where there is no single right answer.

---

## TRUST PRINCIPLE (assumed true; consequences investigated)

> Discovery asks: *"What else might I enjoy?"*
> Alternatives ask: *"What else could fulfil this role for my goals?"*

**Consequence 1 — Alternatives is strictly more dangerous than Discovery.** Discovery never references the
current food as a problem ("you might also enjoy X"). Alternatives, by construction, names a *reason to
change* ("if you want more fibre…"). The instant a reason is attached, the current food is implicitly
positioned as *lacking that thing*. WS7 Invariant 2 ("invitation, never lack") is therefore *harder* to
honour here, not easier. The framing contract must be stricter for WS9 than for WS8.

**Consequence 2 — Alternatives needs two inputs Discovery doesn't.** Discovery needs only a food and the
graph. Alternatives needs a food **+ a role** (what is this food doing here?) **+ a goal** (why are we
looking?). Both new inputs are sources of error: the wrong role gives a nonsensical swap (rice→quinoa as a
*drink*?), the wrong/assumed goal gives a preachy one.

**Consequence 3 — "fulfil the same role" is the honesty anchor.** The phrase is doing real work: it bounds
the suggestion to a *lateral* move, not an *upgrade*. An alternative that fulfils the role is a sideways
option; the moment it claims to be *better*, it has stopped answering this question and started judging.

---

## PART A — WHAT IS A FOOD ROLE?

> *A food is not only what it is. It is also what role it plays, where it appears, and why people choose it.*

### A.1 Finding: THA already encodes role — twice, in two different places, and never as a property of the food itself.

| Where role lives today | Mechanism | Granularity |
|---|---|---|
| **Meal structure** | `meal_templates` slots: `proteinSlots`, `carbSlots`, `vegSlots`, `sauceSlots`, `toppingSlots`, `sharedBaseComponents` (`shared/schema.ts:61-67`) | Role = **the slot a food occupies in a given meal** |
| **Substitution rules** | `ingredientPatterns` matched within a recipe (`shared/substitution-rules.ts`) | Role = **implicit** ("beef mince" implies the savoury-protein-base role) |

The critical insight: **role is contextual, not intrinsic.** Bacon is a "breakfast protein" in a fry-up,
a "salty flavour" in a carbonara, and a "crispy topping" on a salad. The *same canonical food* has
different roles in different meals. This is why role must be read from the **meal slot**, not stored as a
fixed attribute on the food.

### A.2 The brief's three examples, mapped to THA's existing slot model

| Food | Roles (brief) | Maps to slot |
|---|---|---|
| **Bacon** | breakfast protein, savoury element, fry-up component, salty flavour, crispy topping | `proteinSlots` (fry-up) / `toppingSlots` (salad) / flavour = *no slot* (seasoning role is unmodelled) |
| **Rice** | starchy base, absorbs sauce, neutral flavour, side dish, quick carb | `carbSlots` / `sharedBaseComponents` |
| **Milk** | drink, cereal base, tea/coffee addition, cooking ingredient, protein source | *Mostly unmodelled* — beverage and "splash in tea" roles have no slot; "cooking ingredient" ≈ `sauceSlots` |

**Finding:** the slot model covers the *cooked-meal* roles well (protein/carb/veg/sauce/topping). It does
**not** cover **beverage, condiment/seasoning, or standalone-snack roles** — and milk, the brief's third
example, is *primarily* those uncovered roles. This is a real coverage gap, not a framing one.

### A.3 Should roles be structured, editorial, or inferred?

**Recommendation: inferred-from-slot first, editorial for the gaps, never free-text.**

- **Structured/inferred (preferred):** A food's role in a meal *is* its slot. This is zero new editorial —
  it falls out of `meal_templates` for free. It is also self-correcting: the same food correctly gets
  different roles in different meals.
- **Editorial (for the uncovered roles):** beverage / seasoning / snack roles need a small curated map
  because no slot expresses them. This is **Tier 3** (WS8 vocabulary) — small, curated, conservatively
  scoped.
- **Never inferred by free-text/LLM:** "what role does this food play" answered by an LLM is exactly the
  un-auditable reach WS7/WS8 forbid. The reason on any alternatives edge must resolve to an authored fact.

> **A.4 Can foods have multiple roles? Yes — and that is precisely why role cannot be a column on the food.
> Role is a function of (food, meal-slot). The alternatives question is therefore never "alternatives to
> bacon"; it is "alternatives to bacon *in this slot*."**

---

## PART B — GOALS AND INTENT

> *Why would someone seek an alternative?*

### B.1 Finding: THA's goal vocabulary is split across exactly two trust classes, and only one is built.

| Goal class | Examples | THA support today | Trust class |
|---|---|---|---|
| **Hard dietary patterns** | Vegetarian, Vegan, Dairy-free, Gluten-free, Keto, Low-carb | ✅ **Fully built** — `dietRules.ts` (keyword exclusion + `scoreRecipeForDiet`), `substitution-rules.ts` (`DietTrigger`), `restriction-resolver`, `household_eaters.hardRestrictions` | **Highest — deterministic, rule-based, already a gate** |
| **Soft nutrition goals** | Higher protein, higher fibre, lower sat-fat, lower salt/sugar, more healthy fats, more plants | 🟡 **Partial** — `userPreferences.healthGoals` is *captured* (`schema.ts:647`) and weakly used in `scoreHealthAlignment` (`household-meal-matcher.ts`), but there is no food→food "+fibre" edge | **Medium — needs the WS0 nutrition seam + a delta rule** |
| **Philosophy goals** | Lower UPF, less processed, more whole foods, seasonal | 🟡 **Partial** — `preferLessProcessed`/`upfSensitivity` exist (`schema.ts:650,674`); `whole-food-alternatives.ts` is a real less-processed engine; seasonal is unbuilt | **Medium (UPF) / Tier 3 (seasonal)** |
| **Practical goals** | Lower cost, easier to prepare, family favourite, child-friendly | 🟡 **Partial** — `costBand`, `estimatedTotalTime` on templates; household-familiarity from the overlay | **Medium — data exists, no alternatives traversal** |

### B.2 The decisive distinction: **excludes vs. optimises.**

- **Hard dietary goals are *exclusion* goals.** "Vegan" means *bacon cannot stay* — there is a
  forcing function, and the substitution engine exists precisely because the food *must* change. The
  alternative is **mandatory and bounded**: it must satisfy the rule, and the set of valid replacements is
  small and authorable. **This is why THA can answer it confidently.**
- **Soft/philosophy/practical goals are *optimisation* goals.** "More fibre" never means *rice cannot
  stay* — rice is fine. The alternative is **optional and unbounded**: there are dozens of higher-fibre
  bases, none mandatory, and the "right" one depends on taste, budget, and household. **This is why THA
  must answer it cautiously, or stay silent (Part E).**

> **B.3 This single distinction reorganises the entire workstream.** The brief lists all goals as a flat
> menu. They are not flat. Exclusion goals are a *solved, high-trust* problem (reuse the substitution
> engine). Optimisation goals are an *open, medium-trust* problem (new editorial, conservative framing,
> frequent silence). WS9's recommendation depends entirely on keeping these two separate.

### B.4 Can alternatives depend on multiple goals simultaneously? Yes — and the composition rule is the same conflict logic THA already has.

The brief's examples:

- **Rice + Keto → cauliflower rice.** Single exclusion goal. Solvable: keto excludes the carb, cauliflower
  rice fills the `carbSlots`/base role.
- **Rice + Mediterranean + Higher-protein → quinoa / bulgur.** A *pattern* goal (Mediterranean) AND a
  *soft* goal (protein). Composition = **intersection of valid sets**: candidates must (a) fit
  Mediterranean and (b) raise protein vs rice. Quinoa satisfies both; bulgur satisfies Mediterranean and
  fibre but is **lower** protein than quinoa — so under *higher-protein* specifically, quinoa ranks above
  bulgur, and the honesty note matters.

**Existing mechanism that already does multi-goal composition:** `substitution-rules.ts` already has
`conflictsWithRestrictions` and *"first safe (non-conflicting) strategy wins"* (`strategies` ranking).
That is exactly intersection-with-conflict-resolution. Multi-goal alternatives is the **same algorithm
extended from "diet triggers" to "diet triggers + soft-goal deltas."**

> **B.5 Trap: goals can conflict irreconcilably.** "Lower cost" + "more protein" + "less processed" can
> have an empty intersection (cheap unprocessed protein that also fits the household's taste may not
> exist). When the intersection is empty, the correct output is **silence**, not a forced compromise
> (Part E). The conflict-detection machinery to *recognise* this already exists; it just needs to be
> allowed to return nothing.

---

## PART C — HOUSEHOLD CONTEXT

> *Is the cooked-breakfast example alternatives, household adaptation, component meals — or all three?*

### C.1 Finding: it is all three, and THA already produces it.

The brief's cooked breakfast —

```
Shared: tomatoes, mushrooms, toast
Dad:    bacon
Mum:    eggs
Lilly:  vegetarian sausages
Daisy:  beans
```

— is **exactly the output shape of `server/lib/household-meal-matcher.ts`**:

- The shared items map to `sharedBaseComponents`.
- The per-person items map to `proteinSlots` resolved *per member* via `memberChanges` (`MemberChange { userId, displayName, swaps[] }`).
- The matcher already scores `compatibility`, `sharedBase`, `swapSimplicity`, `healthAlignment`, etc.
  (`ScoreBreakdown`) and writes a human `explanation`.

So the answer to the brief's question:

| Lens | Is the cooked breakfast this? | Why |
|---|---|---|
| **Component meal** | ✅ Yes, fundamentally | One shared base + per-slot variation is the *definition* of a component meal (the slot schema) |
| **Household adaptation** | ✅ Yes | Per-member `memberChanges` over a shared base is what the matcher computes |
| **Alternatives** | ✅ Yes, *implicitly* | Each member's per-slot choice (bacon vs eggs vs veg sausage vs beans) is a *role-preserving alternative in the protein slot*, selected by that member's diet/goal |

> **C.2 The cooked breakfast proves the central WS9 thesis in miniature: an "alternative" and a "household
> adaptation" are the same operation — replace the food in a slot with another food that fills the slot and
> satisfies a constraint. The only difference is *whose* constraint drives it: an individual's goal
> (alternatives) or each member's profile (household adaptation). One engine, two callers.**

### C.3 Review of the named systems — what exists vs. what is missing

| System | File | What it does | Reusable for WS9 alternatives? |
|---|---|---|---|
| `household-meal-matcher` | `server/lib/household-meal-matcher.ts` | Scores templates per household; emits per-member swaps + explanation | ✅ **Core reuse** — this *is* the household-adaptation alternatives engine |
| `scoreTemplate()` | same file:444 | Scores one template against members/settings via slot ingredients | ✅ Provides the slot read + health-alignment scoring |
| `dietRules()` | `server/lib/dietRules.ts` | `shouldExcludeRecipe`, `scoreRecipeForDiet` (keyword sets per pattern) | ✅ The **gate** that keeps alternatives diet-safe |
| Substitution engine | `shared/substitution-rules.ts` | Deterministic `ingredient + DietTrigger → ranked safe replacements` w/ conflict resolution + prohibited phrases | ✅ **The exclusion-goal alternatives engine, already built** |
| Whole-food alternatives | `client/src/lib/whole-food-alternatives.ts` | Pattern → homemade less-processed version (flatbread, pesto…) | ✅ The **philosophy-goal (less-UPF)** engine, already built — but *additive*, not a food swap |
| Uplift engine | `server/lib/uplift-*.ts` | Reviewed "add turmeric/peas" enrichments with approved-language guardrails | 🟡 Model for **goal-aware *additions*** (more fibre via "add a handful of peas") + the **language-guardrail pattern to copy** |
| `meal_templates` slots | `shared/schema.ts:61-67` | Decompose meals into roles | ✅ The **role abstraction** |
| Relationship knowledge | `shared/knowledge/relationships.ts` | `FOOD_NUTRIENTS`, `FOOD_BENEFITS`, `NUTRIENT_BENEFITS` | ✅ The **WS0 nutrition seam** the "+fibre" reason must resolve through (no second nutrition path) |

**What is missing (the actual WS9 gap list):**

1. **A role abstraction above ingredient strings.** Substitution rules key on `ingredientPatterns`
   (regex on "beef mince"), not on "the savoury-protein role." Alternatives by role needs the slot read to
   become first-class.
2. **A soft-goal delta rule.** There is no "candidate raises fibre vs source food" comparison; this needs
   the WS0 seam plus a *conservative* delta threshold (so "+0.3g fibre" is not surfaced as "more fibre").
3. **Beverage / seasoning / snack roles** (Part A.2 gap) — milk, tea, condiments are unmodelled.
4. **A soft-goal vocabulary surface** — `healthGoals` is captured but not connected to any food→food
   traversal.
5. **A "say nothing" contract** — no current path is allowed to return *deliberate silence* as a
   first-class result for alternatives (Part E).

> **C.4 Net: ~70% of the machinery exists. The exclusion-goal × cooked-meal-slot quadrant is essentially
> done. The missing 30% is concentrated entirely in the soft/optimisation goals — and that 30% is mostly
> editorial and framing, not engineering.**

---

## PART D — TRUST AND FRAMING (the most important section)

### D.1 The inherited verdict: `ingredient_swaps.original → healthier`

`shared/schema.ts:306-310`:

```
ingredientSwaps = { original: text, healthier: text }
```

This table is the single clearest statement of the framing WS9 must *not* inherit. The column is literally
named **`healthier`**. Any architecture that traverses this table inherits a verdict: *the original was
worse.* WS9's framing contract must treat this as a **legacy data shape to read defensively, never as the
vocabulary of the new feature.** (Note: `uplift-rules.ts` and `substitution-rules.ts` already model the
*correct* discipline — approved-language lists and `prohibitedPhrases`. The newer engines learned the
lesson the old table predates.)

### D.2 The framing contract (authored once, on the edge — per WS7 Invariant)

Every alternative THA shows must satisfy **all** of:

1. **No verdict on the current food.** Never "bacon is bad", "stop eating rice", "this is healthier."
   The current food is *fine*; we are answering a question the household asked.
2. **Goal-conditional, never absolute.** Always *"if you're looking for more fibre…"* — the benefit is
   framed as *contingent on a goal the household stated*, never as a universal truth. This is what makes it
   educational rather than preachy.
3. **Role-anchored ("fulfil a similar role").** The honesty anchor from the Trust Principle: the
   suggestion is *lateral*, an option, not an upgrade.
4. **Reason resolves to the WS0 seam.** "+fibre" must be the *same* fact the target food's Key Nutrients
   already assert (WS7 Invariant 1). No edge invents nutrition.
5. **Honest about difference.** If the alternative tastes/cooks differently (cauliflower rice is *not*
   neutral like rice), the edge carries that honesty note — preventing the "swap and be disappointed"
   trap (WS7 §A flavour finding).
6. **Approved language only.** Reuse the `uplift-rules.ts` discipline: "supports / may help / adds / many
   households enjoy"; ban "cures / detox / healthier / should / bad / clean."

### D.3 The framing tiers, by goal class

| Goal class | Safe phrasing template | Why it's safe |
|---|---|---|
| Hard dietary | *"For vegetarian households, eggs or vegetarian sausages can fill a similar role."* | The household *required* a change; we're just helping execute it |
| Soft nutrition | *"If you're looking for more fibre, beans are another breakfast option many households enjoy."* | Goal-conditional + role-anchored + no verdict on bacon |
| Philosophy (UPF) | *"If you'd prefer something less processed, a homemade version can fill the same role."* | Honest about processing without moralising (WS7 §UPF finding) |
| Practical | *"On a tighter budget, lentils fill a similar role and cost less."* | States a fact (cost), not a judgement |

> **D.4 The grammar test (the one rule that catches every violation):** *Could a knowledgeable, kind
> friend say this sentence to your face, about a food you just chose, without it sounding like a
> correction?* "If you fancy more fibre, beans are nice too" passes. "Beans are healthier than bacon"
> fails. Every alternative must pass this test before it is shown.

---

## PART E — WHEN SHOULD THA SAY NOTHING?

> *Could alternatives become preachy, repetitive, overwhelming, misleading, or culturally insensitive?*

### E.1 Finding: silence is a *feature* and must be a first-class return value.

This carries WS8 Invariant 3 ("empty is silent, not broken") into a stricter regime, because for
alternatives the *temptation to fill* is stronger — there is almost always *some* food that is technically
higher in *something*. The discipline is to suppress that.

**THA should deliberately stay silent when:**

| Condition | Why silence | Detection (exists today?) |
|---|---|---|
| **Goals conflict / empty intersection** | A forced compromise would be misleading (Part B.5) | ✅ Conflict logic exists (`conflictsWithRestrictions`) |
| **Confidence is low** | A weak/Tier-3 link presented as advice betrays trust | 🟡 Trust-tier from WS8 needed |
| **Multiple choices equally valid** | Picking one implies the others are wrong; "more plants" has no single answer | 🟡 Needs a "many-valid → suggest a *small set or none*" rule |
| **Delta is trivial** | "+0.3g fibre" surfaced as "more fibre" is misleading | ❌ Needs the conservative delta threshold (Part C gap 2) |
| **No trustworthy alternative exists** | Filler is worse than nothing | ✅ Empty result already possible |
| **The food is culturally central / the role is the point** | Suggesting "cauliflower rice" to a household for whom rice is a cultural staple can read as erasure, not help | ❌ Needs cultural-sensitivity guardrail; default to silence unless the household *asked* |
| **Repetition** | Re-suggesting the same swap the household already declined/saw is nagging | 🟡 The overlay knows what they eat; needs a "don't re-nag" memory |

> **E.2 The cultural-sensitivity case deserves emphasis.** "Rice → cauliflower rice for keto" is a fine
> answer *when keto is the stated goal*. The same suggestion **unprompted** can read as "your staple food
> is a problem." This is why WS9 must be **pull, not push**: alternatives are surfaced *because the
> household asked the question* ("we'd like this to better fit our goals"), never volunteered as a verdict
> on what they cooked. The Final Question's framing ("a household *says*…") is therefore not incidental —
> it is the safety precondition for the whole feature.

> **E.3 The governing principle:** *An alternative not shown can never offend. An alternative shown wrongly
> can. When the trust math is uncertain, silence always wins.*

---

## PART F — WORKED EXAMPLES

Each: role · goals · candidate alternatives · reasoning · trust framing · when to stay silent.
(Nutritional reasons shown are illustrative of *the seam*; in production each must resolve to the target
food's WS0 Key Nutrients, never be invented here.)

### F.1 Bacon

**Role:** breakfast protein (`proteinSlots`) / sometimes crispy topping.

| Goal | Candidate(s) | Reasoning | Trust framing |
|---|---|---|---|
| Vegetarian | eggs, vegetarian sausages, halloumi | Exclusion goal; fills protein slot; matches `substitution-rules` triggers | "For vegetarian breakfasts, eggs or veg sausages can fill a similar role." |
| Lower-processed (UPF) | grilled fresh pork, eggs | Honest less-processed move, not a health verdict | "If you'd prefer something less processed, grilled fresh cuts or eggs fill the same role." |
| More fibre | beans, mushrooms | Beans add fibre *and* keep the savoury-breakfast role | "If you fancy more fibre, beans are another breakfast many households enjoy." |
| Keto | eggs, bacon itself (already keto-friendly) | **Bacon already fits keto** → likely **silent or affirming**, not a swap | "Bacon already suits a keto breakfast." (or say nothing) |
| Mediterranean | eggs, tomatoes, white beans, sardines | Pattern goal; Mediterranean de-emphasises processed red meat | "On a Mediterranean pattern, eggs or white beans are common breakfast proteins." |

**Stay silent when:** the household didn't ask; or goal = keto (no change needed); or it's a one-off treat
fry-up (the role *is* the indulgence).

### F.2 Rice

**Role:** starchy base / sauce-absorber (`carbSlots`, `sharedBaseComponents`).

| Goal | Candidate(s) | Reasoning | Trust framing |
|---|---|---|---|
| Keto | cauliflower rice | Exclusion goal; fills base role; **honesty note: different taste/texture** | "Following keto? Cauliflower rice gives a similar base — it's lighter and tastes different." |
| Higher protein | quinoa | Fills base, raises protein | "If you'd like more protein in the base, quinoa is one many households enjoy." |
| Mediterranean | bulgur, freekeh, quinoa | Pattern-typical grains | "On a Mediterranean pattern, bulgur or freekeh are common bases." |
| Gluten-free | rice **is already GF** → affirm/silent | No change needed | "Rice is already gluten-free." (or say nothing) |

**Stay silent when:** rice is culturally central and the goal is soft/unprompted; or GF (no change);
or two grains tie under the goal (suggest a small set, not a single verdict).

### F.3 Milk

**Role:** drink / cereal base / tea-coffee splash / cooking ingredient / protein source. *(Most of these
are the Part A.2 uncovered roles.)*

| Goal | Candidate(s) | Reasoning | Trust framing | Note |
|---|---|---|---|---|
| Dairy-free | oat / soya / almond drink | Exclusion goal; `substitution-rules` dairy strategies exist (oat cream etc.) | "For dairy-free, oat or soya drinks fill the same role — soya is closest on protein." | ⚠️ role matters: soya for protein-source role, oat for tea/coffee |
| Lower-processed | — *often silence* | Plant drinks are typically *more* processed than milk; whole milk is minimally processed | **Likely silent** — suggesting a swap here could mislead | Honesty forbids "less processed plant milk" as a blanket claim |
| More protein | soya drink, dairy milk itself, Greek yoghurt (if role allows) | Soya ≈ milk protein; most others are *lower* | "If protein is the aim, soya is the plant drink closest to milk; many others are lower." | Honest about the trade-off |

**Stay silent when:** goal = lower-processed (claim doesn't hold honestly); or the role is "splash in tea"
where the difference is negligible and nagging.

### F.4 Pasta

**Role:** carb base / vehicle for sauce (`carbSlots`).

| Goal | Candidate(s) | Reasoning | Trust framing |
|---|---|---|---|
| Gluten-free | GF pasta (rice/corn), courgetti | Exclusion; `substitution-rules` GF strategy exists | "For gluten-free, rice- or corn-based pasta fills the same role." |
| Higher protein | lentil/chickpea pasta | Raises protein, same format | "Lentil pasta is a higher-protein option many households enjoy." |
| More fibre | wholewheat pasta, lentil pasta | Fibre delta is real and large | "Wholewheat pasta adds fibre and works just the same." |
| Lower-carb | courgetti, edamame pasta | **Honesty note: not a like-for-like texture** | "If you're cutting carbs, courgette ribbons fill the base role — they're lighter and softer." |

**Stay silent when:** delta trivial; or household has clearly chosen white pasta as comfort food and
didn't ask.

### F.5 Greek yoghurt

**Role:** protein source / breakfast base / creamy topping / cooking creaminess.

| Goal | Candidate(s) | Reasoning | Trust framing |
|---|---|---|---|
| Dairy-free | coconut/soya yoghurt | Exclusion; honesty: protein differs (soya closest) | "For dairy-free, soya yoghurt is closest on protein; coconut is creamier but lower protein." |
| More protein | Greek yoghurt **is already high-protein** → affirm/silent | Often no better option | "Greek yoghurt is already one of the higher-protein choices." |
| Lower-processed | plain Greek yoghurt itself (vs flavoured) | The honest move is *within* the food (plain vs sweetened), not a swap | "Plain Greek yoghurt is less processed than the flavoured pots." |
| Vegetarian | Greek yoghurt **is already vegetarian** → silent | No change | (say nothing) |

**Stay silent when:** goal = vegetarian or more-protein (already satisfied) — surfacing a swap here would
manufacture a problem that doesn't exist. **This row is the clearest demonstration that the most
trustworthy answer is often "no change needed."**

---

## PART G — RELATIONSHIP TO PREVIOUS WORKSTREAMS

> *Is Food → Role → Goal → Alternative a new graph, or a new traversal of the existing graph?*

**Finding: a new traversal, with two new filter inputs — not a new graph.**

| WS | Contribution WS9 traverses | Role in alternatives |
|---|---|---|
| **WS0** | Nutrition knowledge (`relationships.ts`, Key Nutrients/Benefits) | The **seam** every soft-goal reason ("+fibre") must resolve through. No new nutrition. |
| **WS2** | Canonical food identity, varieties, diversity groups | The **nodes**. Alternatives connect canonical foods; varieties feed the same-family option. |
| **WS5** | Preparation knowledge | A **same-food alternative** (deep-fried → oven-baked) is the lowest-friction "alternative" and a *preparation* edge — must never be mislabelled a food swap (WS5A §7.1). |
| **WS7** | The typed food↔food graph + household overlay | The **graph itself**. `alternative-to` is already a named edge type. Alternatives = traverse `alternative-to`, filtered by role + goal, ranked by the overlay. |
| **WS8** | Discovery = editorial selection over `similar-to`; trust tiers | The **selection discipline**. WS9 reuses WS8's trust tiers verbatim; the *role+goal filter* is the only addition. |

### G.1 The unified picture

```
        WS7 graph (nodes = canonical foods; edges = alternative-to / similar-to / same-group …)
                                   │
WS8 Discovery   ── traverse similar-to ─────────────► "what else might I enjoy?"   (no role, no goal)
                                   │
WS9 Alternatives ─ traverse alternative-to,
                   FILTER by role (meal slot),
                   FILTER by goal (diet gate ∩ soft-goal delta),
                   RANK by household overlay ──────► "what else fills this role for my goals?"
```

> **G.2 The answer: Food → Role → Goal → Alternative is the *same graph* WS7 built, entered through the
> `alternative-to` edge, with two filters bolted on (role from the meal slot, goal from the profile) and
> ranked by the same overlay WS7 defined. It is the fourth reading of the one structure — after
> Alternatives-as-judgement (rejected), Stories, and Discovery. No new graph. No new nutrition. New
> *filters* and new *framing*.**

---

## RECOMMENDATIONS

1. **Adopt the exclusion/optimisation split (Part B.2) as the organising principle.** Treat hard-dietary
   alternatives and soft-goal alternatives as two different trust regimes, not one menu.

2. **For exclusion goals (vegan, GF, dairy-free…): reuse the substitution engine as-is.** It already does
   role-preserving, conflict-aware, reviewed, non-judgemental substitution. This slice is shippable trust
   today; the only work is surfacing it as "alternatives" with the Part D framing.

3. **For the household-adaptation case: reuse `household-meal-matcher`.** The cooked-breakfast example is
   already its output. Frame per-member `memberChanges` as "alternatives that fill the same slot."

4. **For soft/optimisation goals: build conservatively, or not at all in v1.** These need (a) the role
   abstraction above ingredient strings, (b) a *conservative* soft-goal delta rule resolved through the
   WS0 seam, (c) the silence contract. Until those exist, soft-goal alternatives should default to silence.

5. **Author the framing contract once, on the edge (Part D.2), and the silence contract once (Part E).**
   Per WS7 — guardrails live on the graph, not per feature. Make silence a first-class return value.

6. **Make alternatives pull, not push.** Surface only in response to a household question / explicit goal,
   never as an unprompted verdict on what was cooked (Part E.2).

7. **Quarantine `ingredient_swaps.original→healthier` (Part D.1).** Do not let the new feature inherit that
   column's vocabulary. Read it defensively if at all; never name a new field "healthier."

8. **Apply the grammar test (D.4) as the gate.** No alternative ships unless a kind, knowledgeable friend
   could say the sentence to the household's face without it sounding like a correction.

---

## RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | The word "alternative" itself implies the current food was deficient | **High** | Goal-conditional + role-anchored framing (D.2); pull-not-push (E.2) |
| R2 | Soft-goal deltas surfaced as advice when trivial ("+0.3g fibre = more fibre") | High | Conservative delta threshold; silence default (E.1) |
| R3 | Cultural erasure — swapping a staple unprompted | High | Pull-not-push; cultural-sensitivity silence (E.2) |
| R4 | Inventing nutrition reasons outside the WS0 seam | High | Invariant 1: reason must resolve to target's Key Nutrients (D.2 #4) |
| R5 | Forced compromise when goals conflict | Medium | Empty-intersection → silence (B.5, E.1) |
| R6 | Inheriting `original→healthier` framing | Medium | Quarantine the table (D.1, Rec 7) |
| R7 | Role mis-read → nonsensical swap (rice→quinoa as a "drink") | Medium | Role = meal slot, not intrinsic; beverage/seasoning roles unbuilt → don't serve them yet (A.2) |
| R8 | Repetition / nagging | Low-Med | Overlay-aware "don't re-suggest declined" memory (E.1) |
| R9 | "Honesty note" omitted → swap-and-be-disappointed | Medium | Flavour/texture honesty note on the edge (D.2 #5) |

---

## SUGGESTIONS (future ideas — explicitly out of scope; no implementation)

- **SUGGESTION:** A `role` read derived from meal slots, exposed as a first-class lookup
  `(food, meal) → role`, so alternatives can be queried per-slot.
- **SUGGESTION:** A small curated editorial map for the uncovered roles (beverage, seasoning, snack) so
  milk/tea/condiments can participate — Tier 3, conservatively scoped.
- **SUGGESTION:** A conservative soft-goal delta rule over the WS0 seam (e.g. surface "+fibre" only above a
  meaningful threshold), feeding the silence contract.
- **SUGGESTION:** A "no change needed / already fits" affirming response type (Greek yoghurt + protein,
  rice + GF) — turning silence into gentle reassurance when a goal is already satisfied.
- **SUGGESTION:** Extend the substitution engine's conflict resolver to accept soft-goal weights, unifying
  exclusion and optimisation ranking under one algorithm (B.4).
- **SUGGESTION:** A household "declined / seen" memory on the overlay to prevent repetition (R8).

---

## DEFINITION OF DONE — CHECKLIST

- [x] Alternatives philosophy defined (Exec Summary; Trust Principle; Part D)
- [x] Food roles investigated (Part A)
- [x] Goals and intent investigated (Part B — incl. exclusion/optimisation split)
- [x] Household context explored (Part C — cooked breakfast = matcher output today)
- [x] Existing THA systems reviewed (Part C.3 — matcher, dietRules, substitution-rules, whole-food-alternatives, uplift, slots, relationships)
- [x] Trust framework established (Part D + Part E)
- [x] Worked examples completed (Part F — bacon, rice, milk, pasta, Greek yoghurt)
- [x] Clear recommendations provided (Recommendations; Risks; Suggestions)
- [x] No implementation / schema / UI / DB changes

---

## FINAL QUESTION

> A household says: *"We enjoy this meal, but we'd like it to better fit our goals."*
> Can THA confidently answer: *"Here are some alternatives that could fulfil the same role"?*

**Yes — confidently, for the exclusion-goal slice; cautiously and often with silence, for the
optimisation-goal slice. The honest answer is a qualified yes.**

**Why yes (where it is yes):**

1. **The question is pulled, not pushed** — the household *asked*, which is the precondition that makes
   alternatives safe rather than preachy (E.2).
2. **Role is already expressible** — the meal's slots tell THA what each food is *doing*, so "fulfil the
   same role" is a question the data shape answers (A.1, C).
3. **The engine for hard-dietary goals already exists** — `substitution-rules.ts` does role-preserving,
   conflict-aware, reviewed, non-judgemental substitution today; `household-meal-matcher` already emits the
   per-member, same-base adaptations the cooked-breakfast example describes (C.1).
4. **It is a traversal, not a new system** — WS7's `alternative-to` graph + WS0 nutrition seam + WS8 trust
   tiers already exist; WS9 adds only two filters (role, goal) and a framing contract (G).

**What is missing (where the yes becomes "cautiously / not yet"):**

1. A **role abstraction above ingredient strings**, and the **uncovered roles** (beverage, seasoning,
   snack) — so milk-class foods can't be served safely yet (A.2, C gap 1/3).
2. A **conservative soft-goal delta rule** through the WS0 seam, so "more fibre / lower sat-fat" is honest
   and never trivial (B, C gap 2, R2).
3. A **first-class silence contract** — the discipline to answer "no change needed" or *nothing* when
   goals conflict, deltas are trivial, the food already fits, or the food is culturally central (E).
4. **Quarantine of the legacy `original→healthier` framing**, replaced by the goal-conditional,
   role-anchored, verdict-free contract (D).

> **Bottom line: THA can answer the Final Question *today* for "make this vegan/gluten-free/dairy-free"
> and for per-person household adaptation, because the engines and the framing discipline already exist.
> It cannot yet safely answer "make this higher-fibre / lower-cost / less-processed" as a confident
> recommendation — and the most trustworthy version of THA will often answer those with a gentle "this
> already fits" or with deliberate silence. The architecture to close the gap is small, mostly editorial,
> and is a traversal of graphs WS0–WS8 already built — not a new system.**

---

*End of WS9 investigation. No code, schema, UI, or DB changes were made. Rollback: `git reset --hard rollback/pre-ws9-20260620-214537`.*
