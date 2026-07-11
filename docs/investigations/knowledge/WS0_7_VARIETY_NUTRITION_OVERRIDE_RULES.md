# WS0.7 — Variety Nutrition Override Rules

**Date:** 2026-06-21
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `ws0.7-rollback-point` (at `83438e5`)
**Scope:** Investigation only. No implementation. No schema changes. No data changes.

---

## Status

**COMPLETE — INVESTIGATION ONLY**

---

## Rollback Protection

Confirmed before investigation began:

1. Git status: clean
2. WS0.6 trial: committed at `83438e5`, protected under tag `ws0.6-rollback-20260621-0519`
3. Rollback tag created: `ws0.7-rollback-point`
4. No code written. No schema changed. No data modified.

To restore to pre-WS0.7 state:
```
git checkout ws0.7-rollback-point
```

---

## Purpose

Establish the editorial rules that govern when food varieties should:

1. Inherit nutrition and benefits from their parent food.
2. Override or extend their parent's nutrition and benefits.
3. Have entirely separate knowledge with no inheritance.

**Central question:**
> Can THA describe food varieties honestly without creating duplicate or contradictory food knowledge?

---

## Schema Reality Check

Before rules can be made, the current schema must be understood.

A variety in `shared/canonical/foods.ts` has an optional field:

```ts
{ slug: "red-pepper", name: "Red Pepper", knowledgeFoodSlug: "red-pepper" }
```

When `knowledgeFoodSlug` is set on a variety, that variety points to a knowledge food entry in `shared/knowledge/foods.ts`. This knowledge food has its own nutrients and benefits.

**What the schema currently supports:**

| Level | Field | Effect |
|-------|-------|--------|
| Parent canonical food | `knowledgeFoodSlug` | Parent food → knowledge food |
| Variety | `knowledgeFoodSlug` | Variety → its own knowledge food (REPLACES parent) |

**What the schema does NOT support:**

The schema has no "extend parent" mechanism. A variety either:

- Inherits the parent's knowledge (by having `knowledgeFoodSlug: null` at variety level → parent's knowledge is used)
- Replaces the parent's knowledge entirely (by pointing to its own knowledge food via `knowledgeFoodSlug`)

There is no "parent knowledge + variety addendum" structure. The investigation must work within this constraint, and flag where a future extension mechanism would be valuable.

---

## Current Patterns in the Data

Three distinct patterns already exist in the codebase:

### Pattern 1 — Full Inheritance

Parent has knowledge. Varieties have none. Varieties inherit parent by default.

| Food | Parent knowledge | Variety knowledge |
|------|-----------------|-------------------|
| Tomato | `tomatoes` | None |
| Apple | `apples` | None |
| Spinach | `spinach` | None |

### Pattern 2 — All Varieties Separate

Parent has no knowledge (`null`). Each variety has its own knowledge food.

| Food | Parent knowledge | Variety knowledge |
|------|-----------------|-------------------|
| Mushroom | `null` | white-mushrooms, chestnut-mushrooms, shiitake-mushrooms, oyster-mushrooms |

### Pattern 3 — Partial (Incomplete)

Parent has no knowledge (`null`). One or two varieties have knowledge. Others have nothing.

| Food | Parent knowledge | Variety knowledge |
|------|-----------------|-------------------|
| Pepper | `null` | red-pepper only |
| Lentils | `null` | red-lentils only |

**Pattern 3 is the current problem.** When a user has green pepper, yellow pepper, or beluga lentils in their pantry, they see no knowledge — no description, no nutrients, no benefits. This is an information gap, not an editorial choice.

---

## Part A — Inheritance

### When Varieties Should Inherit

Varieties should inherit parent knowledge when:

1. **Nutritional equivalence holds.** The varieties are nutritionally very similar within the measurement variance of food databases. Small cultivar-to-cultivar differences exist but are not meaningful for health claims.

2. **No variety has a nutrient category absent in others.** No variety contains a distinct compound that another variety meaningfully lacks.

3. **Users experience the variety as interchangeable with the parent for nutrition purposes.** A user choosing between Gala and Granny Smith is making a flavour decision, not a nutritional one.

---

### Apples (Gala, Braeburn, Granny Smith)

**Do benefits differ?** No. All three are high in flavonoids and fibre (especially in the skin). Small sugar differences exist (Granny Smith is slightly lower sugar, slightly more tart) but these are not nutritionally meaningful for health claims. Flavonoid profiles differ by variety, but all confer similar benefits.

**Do nutrients differ?** Minimally. Fibre content varies by a fraction of a gram per 100g. Beta-carotene is low in all. Vitamin C is present at similar levels.

**Does the Food Report need to differ?** No. A single `apples` knowledge food is accurate and honest for all three varieties.

**Verdict: INHERIT.** Parent `apples` knowledge is correct for all varieties.

**Current state:** Correctly handled. Parent wired to `apples`. No variety-level knowledge needed.

---

### Citrus (Clementine, Satsuma, Tangerine)

Not currently in the canonical system, but investigated conceptually.

All three are mandarin-family fruits (Citrus reticulata). Nutritional profiles are nearly identical: high in vitamin C, folate, flavonoids. Flavour, size, and peel thickness differ, but not nutritional composition in any meaningful way for health purposes.

**Verdict: INHERIT.** A generic citrus or mandarin knowledge food is accurate for all three. No variety-level knowledge is justified.

---

### Spinach (Baby Spinach, Mature Spinach)

**Do benefits differ?** Not meaningfully. Both are high in folate, iron, vitamin K. Mature spinach has marginally more of each due to more concentrated leaves, but the difference is within measurement variance and dependent on cooking method, wilting, and water loss.

**Do nutrients differ?** Slightly. Mature spinach has slightly higher oxalate content. Baby spinach is milder and lower in oxalates. Neither difference is large enough to warrant a separate health claim.

**Does the Food Report need to differ?** No. The key note for spinach — iron absorption inhibited by oxalates; pair with vitamin C sources — applies equally to both varieties.

**Verdict: INHERIT.** Parent `spinach` knowledge is accurate for both varieties.

**Current state:** Correctly handled. Parent wired to `spinach`. No variety-level knowledge needed.

---

### Summary — Inheritance Rule

> **Inherit when:** Varieties are nutritionally equivalent within measurement variance, share the same compound profile, and the health claim made by the parent knowledge food is honestly applicable to every variety in the group.

---

## Part B — Meaningful Difference Overrides

### When Varieties Should Override

Varieties should have their own knowledge food when:

1. **A nutrient category is present in the variety but absent (or negligible) in others.** Not just "more" — but a qualitatively different nutritional contribution.

2. **The difference is reliably present across food databases, not batch-to-batch variation.**

3. **The difference is nutritionally significant** — it affects which health benefit a user can honestly attribute to that variety.

4. **The parent knowledge food, applied to this variety, would mislead.** If a user eating green peppers saw the red-pepper knowledge, they would form incorrect nutritional beliefs.

---

### Bell Peppers (Green, Yellow, Orange, Red)

**Nutritional differences (reliable, evidence-based):**

| Variety | Beta-carotene | Vitamin A (RAE) | Vitamin C | Sugar | Profile |
|---------|--------------|-----------------|-----------|-------|---------|
| Green | ~0.2 mg/100g | ~9 µg | ~80 mg | ~2.4g | Unripe; chlorophyll |
| Orange | ~0.6 mg/100g | ~49 µg | ~158 mg | ~4.7g | Mid-ripe |
| Yellow | ~0.1 mg/100g | ~7 µg | ~183 mg | ~5.4g | Mature; different carotenoid profile |
| Red | ~3.1 mg/100g | ~157 µg | ~128 mg | ~4.2g | Fully ripe; high lycopene + beta-carotene |

Source basis: USDA FoodData Central (multiple entries averaged).

**Do benefits differ?** Yes. The difference between green (no meaningful vitamin A contribution) and red (one of the richer plant sources of vitamin A) is not a matter of degree — it is a qualitative difference in what health benefit can be honestly claimed.

**Does the Food Report need to differ?** Yes for red. Yellow and orange are intermediate. Green is distinct.

**Verdict for red-pepper: OVERRIDE.** Red pepper correctly has its own knowledge food pointing to `immune-support`, `skin-health`, `eye-health` via `vitamin-c`, `beta-carotene`, `vitamin-a`.

**Verdict for parent `pepper`: CREATE GENERIC KNOWLEDGE FOOD.** A generic pepper knowledge food should describe what is common to all colours: a good source of vitamin C, antioxidants, dietary fibre; supports general immune health. This fills the gap for green, yellow, and orange pepper users.

**Verdict for yellow and orange: SUGGESTION (see below).** These are intermediate enough that a generic `pepper` knowledge food is honest for them. If THA wants to surface the yellow pepper's exceptional vitamin C content as a Food Report note, that requires either a yellow-pepper knowledge food (override) or future schema extension (partial override addendum).

**Verdict for green: INHERIT from generic.** Green pepper is honestly described by a generic pepper knowledge food. The key distinguishing feature (lower sugar, not yet ripe) is relevant to cooking, not a positive health claim.

---

### Potatoes (White, Red, Purple)

Not currently in the canonical system as regular potatoes. Investigated conceptually (sweet potato exists separately as `sweet-potato`).

**Nutritional differences:**

| Variety | Distinctive compound | Impact |
|---------|---------------------|--------|
| White/yellow | Potassium, vitamin C, fibre (in skin) | Standard potato nutrition |
| Red | Similar to white; slight differences by cultivar | No qualitative difference |
| Purple | Anthocyanins (absent in white/yellow) | Antioxidant category not present in others |

**Verdict for white and red potatoes: INHERIT.** A generic `potato` knowledge food is accurate and honest for both.

**Verdict for purple potato: OVERRIDE.** Purple potatoes contain anthocyanins — a distinct antioxidant class (the same pigment family found in berries, red cabbage, and beetroot). This is a qualitative difference, not just a quantitative one. Purple potato deserves its own knowledge food noting anthocyanins and the benefit category this implies.

**Trust note:** The override should not say "purple potatoes are healthier." It should say: "Purple potatoes contain anthocyanins, a class of antioxidant pigments that give them their characteristic colour."

---

### Tomatoes (Cherry, Plum, Heirloom, Tinned)

**Nutritional differences:**

| Form | Distinctive | Notes |
|------|------------|-------|
| Cherry | Similar to standard | Slight antioxidant concentration per gram due to surface area:volume ratio |
| Plum | Similar to standard | Denser flesh; cooking tomato |
| Heirloom | Variable by colour | Yellow/green heirlooms have less lycopene than red |
| Tinned | More bioavailable lycopene | Cooking + cell breakdown increases lycopene bioavailability markedly |

**Key question: Should tinned override lycopene?**

Tinned tomatoes are currently an **alias/form** (`tinned tomatoes`, `chopped tomatoes`) — not a variety. This is the correct structural placement. Form-level preparation notes belong in `commonForms` or `storageGuidance` within the parent knowledge food, not as a variety override.

The lycopene bioavailability note is important and belongs in the parent `tomatoes` knowledge food description or commonForms: "Lycopene bioavailability is higher in cooked and tinned forms."

**Should cherry override antioxidants?** The antioxidant concentration advantage of cherry tomatoes (per 100g, similar; per individual fruit, higher surface area) is too small and too dependent on variety to justify a separate knowledge food. The parent `tomatoes` knowledge food is honest for cherry, plum, and red heirloom.

**What about yellow/green heirloom tomatoes?** These have meaningfully less lycopene. But they are currently under the `heirloom-tomato` variety with no separate knowledge food. If THA adds yellow-tomato as a distinct variety in future, that would warrant a separate knowledge food noting the absence of lycopene. For now, the parent `tomatoes` knowledge food applies to red varieties.

**Verdict: INHERIT for cherry, plum, red heirloom.** A `tomatoes` parent knowledge food is honest for these.

**SUGGESTION:** The parent `tomatoes` description should note that lycopene bioavailability increases significantly with cooking, given how prominently tinned tomatoes feature in UK cooking.

---

### Summary — Override Rule

> **Override when:** A variety contains a nutrient category qualitatively absent in siblings (not merely more of the same), the difference is reliably documented, and using the parent knowledge food for that variety would create a materially incorrect nutritional impression.

---

## Part C — Separate Knowledge (Not Varieties, Effectively)

### When Varieties Should Have Entirely Separate Knowledge

Some canonical variety groupings are diversity counting decisions, not editorial nutrition groupings. The canonical system says "these count as one plant for your 30 Plants." The knowledge system may need to say "these have genuinely distinct nutritional stories."

When:
1. **Varieties are experienced as distinct foods by users** — they are bought separately, cooked differently, taste differently.
2. **Each variety has a nutritional profile specific enough to justify its own description.**
3. **Using a generic parent knowledge food would be uninformative** — too vague to be useful.

---

### Mushrooms (Button, Chestnut, Shiitake, Oyster)

**Current state:** The best-handled case in the system. All four varieties have distinct knowledge foods.

| Variety | Distinctive nutrients | Distinctive benefits |
|---------|----------------------|---------------------|
| Button (White) | Vitamin D (UV-grown), selenium, copper | Immune support, bone health |
| Chestnut | Selenium, copper, fibre | Immune support, heart health |
| Shiitake | Copper, selenium, lentinan | Immune support, heart health |
| Oyster | Fibre, vitamin B6 | Immune support, heart health |

**Are these varieties or separate foods?**

Botanically, these are different species (button/chestnut = Agaricus bisporus cultivars; shiitake = Lentinula edodes; oyster = Pleurotus ostreatus). They are not even the same species. The canonical system groups them under `mushroom` for **plant diversity counting only** — eating all four gives a user high diversity credit for their 30 Plants.

For knowledge purposes, these are separate foods. A user who eats only shiitake and wants to know why should not get generic mushroom knowledge — they should get shiitake-specific knowledge.

**Verdict: SEPARATE KNOWLEDGE.** This is already handled correctly.

**Structural principle:** The diversity group `mushroom` answers "does this count toward your 30 Plants?" The variety-level knowledge food answers "what do we know about this specific mushroom?" These are separate editorial questions.

---

### Lentils (Green, Red, Puy, Beluga)

**Current state:** Incomplete. Only red-lentil wired to `red-lentils` knowledge food. Green, puy, beluga have no knowledge.

**Nutritional and functional differences:**

| Variety | Distinctive features | Cooking |
|---------|---------------------|---------|
| Red | Hull removed; high GI relative to green; very quick cooking | 15–20 min; falls apart |
| Green | Hull intact; lower GI; firm; peppery | 30–35 min; holds shape |
| Puy | French green lentil; nutty; firm; slightly higher in iron | 25–30 min; holds shape |
| Beluga (Black) | Anthocyanins; visually distinctive; holds shape | 25–30 min; caviar-like |

**Are these varieties or separate foods?**

All are Lens culinaris — the same species. For plant diversity: one plant. For user experience: these are as distinct as shiitake and oyster mushrooms. A recipe calling for Puy lentils cannot substitute red lentils without a fundamentally different dish.

The nutritional differences reinforce this:
- Red lentils: higher glycaemic response, higher fibre per gram (splits release beta-glucans differently), no hull
- Green/Puy: more resistant starch, lower GI, hull intact
- Beluga: anthocyanins (absent in all other lentil varieties)

**Verdict: SEPARATE KNOWLEDGE for each variety that THA currently lists.** Each lentil variety deserves its own knowledge food, following the mushroom pattern.

**Priority:** Beluga lentils are the most urgent — they contain anthocyanins (a qualitatively distinct compound), and the parent `lentils` knowledge food would be actively misleading if it claimed anthocyanins for red lentils.

**Implication for parent `lentils` canonical:** Should remain `knowledgeFoodSlug: null`. A generic `lentils` knowledge food would either be too vague to be honest or would have to misrepresent the differences across types.

---

### The Lentils vs Mushrooms Parallel

| | Mushrooms | Lentils |
|--|-----------|---------|
| Same species? | No — different species | Yes — same species |
| Taste/texture similar? | No — very different | No — very different |
| Cooked interchangeably? | No | No |
| Nutritional profiles overlapping? | Partly | Partly |
| Current knowledge status | All 4 varieties done | Only red done |
| Recommended approach | Separate knowledge (done) | Separate knowledge (incomplete) |

The botanical difference doesn't determine the editorial rule. What determines it is whether users experience these as distinct foods.

---

### Summary — Separate Knowledge Rule

> **Separate knowledge when:** Varieties are experienced by users as distinct foods with distinct uses, textures, and cooking properties — even if they share a diversity group for plant counting. The diversity group answers the counting question. The knowledge food answers the nutrition question. These are different questions.

---

## Part D — Food Report Implications

### The Gap Exposed by the Current Schema

The schema forces a binary for each canonical food:

**Binary A:** Parent food has knowledge → varieties inherit it.
**Binary B:** Parent food has no knowledge (`null`) → varieties either have their own knowledge or nothing.

There is no "parent + addendum" model. This means that when WS0.6 left `pepper` with `knowledgeFoodSlug: null`, the four varieties were left without a shared knowledge baseline.

### How Food Reports Should Behave Today (Within Current Schema)

**Scenario: User has red pepper in their pantry**

System path: `red-pepper` variety → `knowledgeFoodSlug: "red-pepper"` → red-pepper knowledge food.

Report shows: "A sweet pepper exceptionally high in vitamin C and beta-carotene."
Benefits: Immune support, skin health, eye health.

**This is correct.** But it's complete only because red-pepper knowledge includes vitamin C (which is broadly true of all peppers, not just red). If THA ever creates a variety knowledge food for a less nutrient-dense variety, it must still be complete in itself — it cannot rely on a parent to supply the shared nutrients.

**Scenario: User has green pepper in their pantry**

System path: `green-pepper` variety → `knowledgeFoodSlug: null` → parent `pepper` → `knowledgeFoodSlug: null`.

Report shows: Nothing. No knowledge food surfaced.

**This is the current gap.** It is not honest — green peppers are a real food with real nutritional value — it is simply incomplete.

**Resolution (within current schema):**
Create a generic `pepper` knowledge food and wire `pepper` canonical to it.
- Nutrients: `vitamin-c`, `fibre`, `capsaicin-precursors` (if nutrient exists)
- Benefits: `immune-support`, `digestive-comfort`
- Description: "Sweet bell peppers in any colour provide vitamin C and dietary fibre. Colour reflects ripeness: red peppers develop significantly more beta-carotene and vitamin A as they ripen."

Green, yellow, and orange pepper varieties would then inherit this parent knowledge. Red pepper variety would continue to override with its specific knowledge food.

### Is the Dual-Level Display Understandable?

Currently, the Food Report can only show one level of knowledge per canonical food interaction. If the parent has knowledge, varieties show parent. If a variety has its own knowledge, it shows the variety's.

The question "would parent knowledge + variety addendum be understandable?" is a future design question. The investigation's finding is:

**It would be honest and delightful if clearly framed.**

A Food Report that says:
> "Peppers: support immune health and provide vitamin C."
> "Red peppers are particularly rich in beta-carotene and vitamin A — nutrients that develop as the pepper fully ripens."

...would be more informative than either a generic pepper entry or a red-pepper-only entry. But this requires a schema change (see SUGGESTIONS).

**Is it too complex?** No — if the UI presents it as "what's special about your variety." Not as a comparison against other varieties.

---

## Part E — Trust Language

### The Core Principle

THA must never create a hierarchy of variety superiority. The purpose of variety knowledge overrides is to accurately describe what a specific food contains, not to rank foods against each other.

### Language to Avoid

| Avoid | Why |
|-------|-----|
| "Red peppers are healthier than green." | Implies green is worse. Green is not worse — it is different. |
| "Purple potatoes are superior to white." | Morally-loaded; ignores context (what the user is eating alongside) |
| "Green peppers are a poor source of vitamin A." | Framed as deficiency rather than difference |
| "Yellow peppers are best for vitamin C." | Invites unfair comparison among colours |
| "White mushrooms are the least nutritious." | Actively harmful — white mushrooms are excellent foods |

### Language to Use

| Use instead | Why it works |
|-------------|-------------|
| "Red peppers are particularly rich in beta-carotene and vitamin A." | Positive statement about the variety; no comparison implied |
| "Purple potatoes contain anthocyanins, the antioxidant pigments that give them their striking colour." | Describes what's there, not what others lack |
| "Yellow peppers are among the highest food sources of vitamin C." | Factual; no ranking against siblings |
| "Green peppers offer vitamin C and fibre at a lower calorie density than their riper siblings." | Positive framing; sibling reference is factual and complimentary |
| "White mushrooms are a reliable source of selenium and copper." | Positive; no comparison needed |

### How to Describe Uncertainty

Nutritional differences between food varieties are often smaller than the variation between samples, growing conditions, and measurement methods. THA should acknowledge uncertainty where it exists.

**Appropriate qualifiers:**

- "Beta-carotene content increases as peppers ripen to red." (Mechanism stated — more reliable than citing a single value)
- "Shiitake mushrooms contain lentinan, a beta-glucan compound that has been studied for its immune properties." (Distinguishes studied-for from proven-to)
- "Puy lentils may retain a slightly firmer texture than green lentils when cooked." (Hedged when cooking-dependent)
- "Purple potatoes contain anthocyanins — the same class of compounds found in blueberries and red cabbage." (Contextualises without overclaiming)

**Things THA should not claim:**

- Specific milligram figures for variety-level nutrients (databases vary; the figure changes with growing conditions)
- That eating one variety provides a specific clinical benefit
- That the presence of a compound (e.g. lentinan in shiitake) translates directly to a health outcome

### The Evidence Description Principle

> State what the food contains. Describe what that compound is associated with. Do not claim the outcome will occur from eating the food.

Example:
- ✓ "Red peppers contain beta-carotene. The body converts beta-carotene to vitamin A, which supports eye health and immune function."
- ✗ "Eating red peppers improves your eyesight."

---

## Part F — Worked Examples

### 1. Peppers

**Current state:**
- Canonical: `pepper` → `knowledgeFoodSlug: null`
- Varieties: `red-pepper` → `red-pepper` knowledge ✓ | `green-pepper`, `yellow-pepper`, `orange-pepper` → nothing ✗

**Recommended structure:**

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `pepper` | `pepper` (to be created) | Generic: vitamin C, fibre, antioxidants → immune-support, digestive-comfort |
| Variety: red | `red-pepper` | `red-pepper` (exists) | Override: adds beta-carotene, vitamin A → eye-health, skin-health |
| Variety: green | `green-pepper` | inherits `pepper` | Generic pepper knowledge |
| Variety: yellow | `yellow-pepper` | inherits `pepper` | Generic pepper knowledge (SUGGESTION: yellow-pepper knowledge to surface vitamin C note) |
| Variety: orange | `orange-pepper` | inherits `pepper` | Generic pepper knowledge |

**Diversity group:** `pepper` — all colours count as one plant for 30 Plants.

**Food Report behaviour:**
- Green pepper user sees: generic pepper report.
- Red pepper user sees: red-pepper-specific report (richer; correctly describes what makes red pepper distinctive).
- Yellow/orange user sees: generic pepper report (correct; honest; not misleading).

**Trust framing:**
> "Red peppers contain significantly more beta-carotene and vitamin A than other colours — a reflection of full ripeness."

Not: "Red peppers are healthier."

---

### 2. Tomatoes

**Current state:**
- Canonical: `tomato` → `knowledgeFoodSlug: "tomatoes"` ✓
- Varieties: cherry, plum, heirloom → all inherit `tomatoes` knowledge ✓

**Recommended structure:**

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `tomato` | `tomatoes` (exists) | Generic: lycopene, vitamin C, folate → heart-health, immune-support |
| Variety: cherry | `cherry-tomato` | inherits `tomatoes` | No override needed |
| Variety: plum | `plum-tomato` | inherits `tomatoes` | No override needed |
| Variety: heirloom | `heirloom-tomato` | inherits `tomatoes` | No override needed (see note) |

**Note on heirloom:** Yellow and green heirloom tomatoes have significantly less lycopene than red. If THA adds `yellow-heirloom-tomato` as a distinct variety in future, that would warrant a separate knowledge food. Currently, `heirloom-tomato` covers all heirlooms and the generic `tomatoes` knowledge food (lycopene, vitamin C) is applied. This is an honest approximation for red heirlooms; slightly misleading for yellow heirlooms. Flagged as low-severity uncertainty.

**Food Report behaviour:**
- All tomato variety users see the same report. Honest for cherry, plum, red heirloom.

**Trust framing:**
> The `tomatoes` description should note: "Lycopene availability increases when tomatoes are cooked or tinned, as heat breaks down cell walls."

---

### 3. Potatoes

Not currently in canonical system as regular potatoes. Future authoring recommendation:

**Recommended structure:**

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `potato` | `potato` (to be created) | Generic: potassium, vitamin C, fibre (skin) → heart-health, gut-health, energy-support |
| Variety: white | `white-potato` | inherits `potato` | No override needed |
| Variety: red | `red-potato` | inherits `potato` | No override needed |
| Variety: purple | `purple-potato` | `purple-potato` (to be created) | Override: adds anthocyanins → healthy-ageing, anti-inflammatory-support |

**Diversity group:** `potato` — all varieties count as one plant.

**Trust framing:**
> "Purple potatoes contain anthocyanins — the same antioxidant pigments found in blueberries and red cabbage."

Not: "Purple potatoes are more nutritious."

---

### 4. Mushrooms

**Current state:** Already handled correctly.

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `mushroom` | `null` ✓ | No generic knowledge — varieties too distinct |
| Variety: button | `button-mushroom` | `white-mushrooms` ✓ | Vitamin D, selenium, copper → immune-support, bone-health |
| Variety: chestnut | `chestnut-mushroom` | `chestnut-mushrooms` ✓ | Selenium, copper, fibre → immune-support, heart-health |
| Variety: shiitake | `shiitake-mushroom` | `shiitake-mushrooms` ✓ | Copper, selenium, fibre → immune-support, heart-health |
| Variety: oyster | `oyster-mushroom` | `oyster-mushrooms` ✓ | Fibre, vitamin B6 → immune-support, heart-health |

**Why the parent has no generic knowledge:** These are different fungal species. A generic "mushroom" knowledge food would be either misleadingly specific (if it listed shiitake's lentinan as if it applied to button mushrooms) or too vague to be useful (if it just said "fungi contain fibre"). The variety-specific knowledge is more honest and more informative.

**The parent's role** is plant diversity counting only. Eating button + shiitake = 2 plants toward 30 Plants.

**Trust framing:**
> Each mushroom variety is described on its own terms. No comparisons between varieties in the knowledge entries. Button mushrooms are "an everyday source of B vitamins and fibre" — not "less nutritious than shiitake."

---

### 5. Lentils

**Current state:** Incomplete. Only red-lentil wired to `red-lentils`. Green, puy, beluga have no knowledge.

**Recommended structure:**

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `lentils` | `null` ✓ | No generic knowledge — follows mushroom pattern |
| Variety: red | `red-lentil` | `red-lentils` ✓ | Plant protein, fibre, iron, folate → gut-health, energy-support, muscle-recovery |
| Variety: green | `green-lentil` | `green-lentils` (to be created) | Plant protein, fibre, folate, iron → gut-health, heart-health, muscle-recovery |
| Variety: puy | `puy-lentil` | `puy-lentils` (to be created) | Plant protein, fibre, folate → gut-health, heart-health |
| Variety: beluga | `beluga-lentil` | `beluga-lentils` (to be created) | Plant protein, fibre, anthocyanins → gut-health, heart-health, anti-inflammatory-support |

**Why follow the mushroom pattern:**
Lentil varieties are experienced as distinct foods by users. Cooking time, texture, culinary use, and — in beluga's case — compound profile all differ meaningfully. A generic `lentils` knowledge food would be too vague ("plant protein and fibre" applies equally to all) while failing to surface what makes beluga lentils distinctive.

**Beluga lentils urgency:** Beluga lentils contain anthocyanins (confirmed in peer-reviewed literature). This is a qualitatively distinct compound absent from red, green, and puy lentils. A user with beluga lentils in their pantry receiving red-lentil knowledge (or no knowledge at all) is getting an incomplete picture.

**Trust framing for lentils:**
> "Beluga lentils get their striking dark colour from anthocyanins, the same antioxidant pigments found in blueberries and red cabbage."
> "Red lentils cook quickly and break down into a smooth texture — making them ideal for dal, soups, and sauces."

Not: "Beluga lentils are healthier." Not: "Red lentils are nutritionally inferior."

---

### 6. Apples

**Current state:** Correctly handled.

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `apple` | `apples` ✓ | Fibre, flavonoids → gut-health, heart-health |
| Variety: gala | `gala-apple` | inherits `apples` ✓ | No override needed |
| Variety: braeburn | `braeburn-apple` | inherits `apples` ✓ | No override needed |
| Variety: granny smith | `granny-smith-apple` | inherits `apples` ✓ | No override needed |

**Future variety additions** (e.g., Cox, Russet, Pink Lady) should inherit without variety-level knowledge unless a specific cultivar is shown to have a markedly different compound profile — unlikely for commonly eaten UK apple varieties.

---

### 7. Citrus (Clementine, Satsuma, Tangerine)

Not currently in canonical system. Future authoring recommendation:

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `clementine` or `mandarin` | generic knowledge | Vitamin C, folate, flavonoids → immune-support, energy-support |
| Varieties | satsuma, tangerine, clementine | inherits parent | No override needed |

**Note:** Whether clementine/satsuma/tangerine each deserve their own canonical food (with varieties within) or whether one "mandarin" canonical covers all three is a separate structural decision (closer to WS1.5 alias-vs-variety territory). Nutritionally, the inheritance principle is clear: they are equivalent.

---

### 8. Spinach

**Current state:** Correctly handled.

| Level | slug | Knowledge food | Content |
|-------|------|---------------|---------|
| Parent canonical | `spinach` | `spinach` ✓ | Folate, iron, vitamin K → bone-health, energy-support, gut-health |
| Variety: baby | `baby-spinach` | inherits `spinach` ✓ | No override needed |
| Variety: mature | `mature-spinach` | inherits `spinach` ✓ | No override needed |

---

## Inheritance and Override Rules — Summary

### The Three Rules

**Rule 1 — Inherit (Full Inheritance)**

> Apply when varieties are nutritionally equivalent within measurement variance, share the same compound profile, and the parent knowledge food is honestly applicable to every variety.

*Examples: apples, citrus, spinach, tomato (cherry/plum/heirloom)*

**Rule 2 — Override (Variety Replaces Parent)**

> Apply when a specific variety contains a compound category qualitatively absent or greatly reduced in siblings, the difference is reliably documented, and using the parent knowledge would create a materially incorrect nutritional impression.

*Examples: red pepper (beta-carotene/vitamin A vs green), purple potato (anthocyanins), yellow heirloom tomato (less lycopene)*

**Rule 3 — Separate (Each Variety Independent)**

> Apply when varieties are experienced by users as distinct foods with distinct uses, cooking properties, and compound profiles. The diversity group answers "does this count as one plant?" The knowledge food answers "what should we tell users about this specific food?" These are different questions with different answers.

*Examples: mushrooms, lentils*

### Decision Guide

```
Is the variety nutritionally equivalent to siblings (within measurement variance)?
  └─ YES → INHERIT parent knowledge (Rule 1)
  └─ NO → Does the variety have a qualitatively distinct compound category?
            └─ YES → Is the variety experienced as a distinct food from siblings?
                      └─ YES → SEPARATE knowledge (Rule 3)
                      └─ NO → OVERRIDE (Rule 2): variety gets its own knowledge food
            └─ NO (only quantitative differences) → INHERIT (Rule 1)
```

---

## Final Question

**Can THA support "Identity inherited" while allowing "Knowledge to be overridden when evidence and user value justify it"?**

**YES — with the following rules:**

1. **Identity (canonical food, diversity group, aliases) is always inherited.** A red pepper is always a Pepper for plant diversity counting. This never changes.

2. **Knowledge follows the three-rule framework.** Inherit when equivalent. Override when a variety has a qualitatively distinct compound. Separate when varieties are functionally distinct foods.

3. **The schema supports Rules 1 and 2 today.** A variety with `knowledgeFoodSlug: null` inherits parent. A variety with its own `knowledgeFoodSlug` overrides parent.

4. **Rule 3 (Separate) is also supported today.** Parent `knowledgeFoodSlug: null` + each variety gets its own knowledge food (mushroom pattern). This works.

5. **The gap is Rule 2 partial overrides.** When a variety has both shared nutrients (from parent) and distinctive nutrients (its own), the knowledge food for that variety must currently be complete in itself — it cannot say "plus what's in the parent." This means red-pepper's knowledge food should include vitamin C (common to all peppers) alongside beta-carotene (distinctive to red). It should not assume the parent knowledge food's vitamin C is also shown.

---

## Risks

### Risk 1 — Variety Knowledge Foods That Are Incomplete

If a variety is given its own knowledge food (override), and that knowledge food omits nutrients that are shared with siblings, users reading only the variety report get an incomplete picture.

**Mitigation:** Variety knowledge foods that override must be complete in themselves. The red-pepper knowledge food must include vitamin C even though vitamin C is also in the parent pepper knowledge food. Do not depend on the parent to supply the shared baseline.

### Risk 2 — Parent Knowledge That Misleads Yellow/Green Heirloom Tomato Users

The generic `tomatoes` knowledge food mentions lycopene. Yellow heirloom tomatoes have significantly less lycopene than red. If yellow heirloom is eventually added as a variety, it should not inherit a knowledge food that prominently features lycopene.

**Mitigation:** When adding varieties of tomato with non-red flesh, wire them to appropriate knowledge foods or flag the existing `tomatoes` knowledge food description for amendment.

### Risk 3 — Lentil Knowledge Inconsistency

Currently, `red-lentils` is the only lentil with a knowledge food. If a user has green, puy, or beluga lentils in their pantry, they see nothing. This is a gap today, not a future risk.

**Mitigation:** Authoring green-lentils, puy-lentils, and beluga-lentils knowledge foods in a future WS0.6-style trial.

### Risk 4 — Generic Pepper Knowledge Overpromising for Green Peppers

A generic `pepper` knowledge food will mention vitamin C. Green peppers do have vitamin C (~80mg/100g). This is accurate. But if the knowledge food is built primarily from the red-pepper profile and then applied to green, the description may skew too warm ("exceptionally high in vitamin C" — accurate for red, less accurate for green at ~80mg vs red at ~128mg).

**Mitigation:** The generic `pepper` knowledge food description must be calibrated to the lowest common denominator across all colours. "A good source of vitamin C" rather than "exceptionally rich in vitamin C."

### Risk 5 — Future Schema Extension Breaks Current Editorial Rules

If THA implements a "parent + addendum" knowledge model in future (see SUGGESTIONS), existing variety knowledge foods that are currently complete-in-themselves may appear redundant or duplicative alongside parent knowledge.

**Mitigation:** When building the extension model, plan a migration pass over variety knowledge foods to remove nutrients that are now covered by the parent.

---

## SUGGESTIONS

Items outside the scope of this investigation that emerged from the analysis. Not to be implemented without separate investigation.

**SUGGESTION 1 — Generic `pepper` Knowledge Food**
Create a knowledge food for the `pepper` canonical that covers all colour varieties (vitamin C, fibre, antioxidants). This fills the green/yellow/orange pepper gap immediately within the current schema. No schema change needed.

**SUGGESTION 2 — Green, Puy, Beluga Lentil Knowledge Foods**
Author three new knowledge food entries to complete the lentils variety coverage, following the mushroom pattern. Beluga is highest priority (anthocyanins are qualitatively distinctive). No schema change needed.

**SUGGESTION 3 — Schema Extension: Variety Override Addendum**
Design a future schema capability where a variety can specify "additional nutrients" relative to the parent, rather than replacing the parent entirely. This would enable:
- `pepper` parent → vitamin C, fibre → immune-support
- `red-pepper` variety → `extends: pepper` → additionally: beta-carotene, vitamin A → additionally: eye-health, skin-health

This requires schema change and Food Report UI changes. Investigation scope: separate WS.

**SUGGESTION 4 — Food Report Variety Context Line**
In the Food Report UI, when a variety is being displayed, show a context line explaining what the variety distinction means: "Red peppers are the fully ripe form of bell pepper — they develop more beta-carotene and vitamin A as they ripen." This is a UX decision, not a data model decision.

**SUGGESTION 5 — Yellow Heirloom Tomato Future Flag**
If heirloom tomatoes are ever split by colour in the canonical system (red heirloom vs yellow heirloom), yellow heirloom should not inherit the `tomatoes` knowledge food. Flag this before authoring colour-split heirloom varieties.

**SUGGESTION 6 — Lycopene Note in `tomatoes` Description**
Amend the `tomatoes` knowledge food description to note that lycopene bioavailability is higher in cooked and tinned forms. This is a commonForms note, not a structural change.

---

## Definition of Done

- [x] Inheritance rules defined (Rule 1)
- [x] Override rules defined (Rule 2)
- [x] Separate knowledge rules defined (Rule 3)
- [x] Decision guide created
- [x] Worked examples: Peppers, Tomatoes, Potatoes, Mushrooms, Lentils, Apples, Citrus, Spinach
- [x] Food Report implications explored
- [x] Trust language investigated
- [x] Recommendations provided
- [x] Risks documented
- [x] No implementation performed
- [x] No schema changes made
- [x] No migrations written
- [x] Future ideas logged under SUGGESTIONS
