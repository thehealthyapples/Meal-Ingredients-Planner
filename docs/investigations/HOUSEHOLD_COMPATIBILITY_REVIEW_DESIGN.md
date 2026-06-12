# THA Household Compatibility Review — Experience Design

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `design/household-compatibility-review-experience-2026-06-12`
**Status:** Design only. No code changes. No schema changes.

---

## Rollback Protection

```
Tag: design/household-compatibility-review-experience-2026-06-12
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout design/household-compatibility-review-experience-2026-06-12
```

---

## Grounding in Verified Architecture

This design is grounded entirely in the findings of the prior feasibility investigation.
The backend already computes everything described in this document.
The gap is only at the API surface and UI layer.

Key existing data available per meal:

| Field | Source | Contains |
|-------|--------|---------|
| `memberChanges[]` | `household-meal-matcher.ts:291` | Per-eater name + required swaps |
| `swapsNeeded[]` | `household-meal-matcher.ts:303` | Unique swap strings across all eaters |
| `scoreBreakdown.compatibility` | `household-meal-matcher.ts:310` | 0–1 ratio of compatible eaters |
| `scoreBreakdown.swapSimplicity` | `household-meal-matcher.ts:312` | 0–1 penalty for variant complexity |
| `fitScore` | `household-meal-matcher.ts:325` | Weighted composite 0–100 |
| `explanation` | `household-meal-matcher.ts:327` | "Fits 3 of 4 profiles" phrase |
| `extraPrepMinutes` | `household-meal-matcher.ts:316` | Additional time cost of variants |
| `sharedIngredients` | `household-meal-matcher.ts:322` | Ingredients shared across all eaters |

---

## THA Philosophy

The design must embody a specific goal:

**Not:** "Can everybody eat this exact recipe?"

**Yes:** "How can everybody participate in this meal?"

This is a household cooking philosophy, not a dietary restriction filter. The question is never "does Lilly ruin dinner?" — it is "what does Lilly's version look like, and how easy is that to prepare alongside everyone else's?"

Every meal in THA has the potential to be a household meal. The compatibility system's job is to make the adaptation cost visible and manageable, not to exclude meals from consideration.

---

## Section 1 — Compatibility Model

### Five Tiers

The compatibility model is derived directly from the existing `scoreBreakdown` fields. No new computation is required.

---

#### Tier 1 — Fully Compatible

**Condition:** `memberChanges.length === 0`

The meal fits every household eater as-is. No changes needed. The recipe can be prepared once and served to everyone.

**Display label:** `Fits all 4`
**Visual:** Solid green indicator
**Card behaviour:** No review prompt. The compatibility signal is positive reinforcement only.

---

#### Tier 2 — Mostly Compatible

**Condition:**
- `memberChanges.length === 1` (one eater needs changes)
- All swaps in that eater's `swaps[]` are of the form `"X → Y"` (no `"remove X"` entries)
- `extraPrepMinutes <= 10`

One eater has a small, well-understood adaptation. The meal can be prepared with a single parallel step — cook the shared version, set aside a portion before adding the incompatible ingredient, or use a direct swap.

**Display label:** `Fits 3 of 4 · 1 easy swap`
**Visual:** Green with a small amber accent
**Card behaviour:** Tappable. Opens inline or drawer review.

---

#### Tier 3 — Adaptable

**Condition:**
- `memberChanges.length >= 1`
- At least one swap exists for every conflict (no orphaned `"remove X"` without a swap)
- `scoreBreakdown.swapSimplicity >= 0.5`

Multiple eaters need changes, or a single eater needs several changes, but the system has swap suggestions for all of them. Meal is viable with parallel preparation.

**Display label:** `Fits 2 of 4 · Adaptable`
**Visual:** Amber indicator
**Card behaviour:** Review changes prompt is prominent.

---

#### Tier 4 — Poor Fit

**Condition:**
- Some conflicts have only `"remove X"` (no substitution available)
- `scoreBreakdown.swapSimplicity < 0.5`
- OR `extraPrepMinutes > 20`

The meal can technically accommodate everyone but requires significant changes that either substantially alter the meal for one eater (removal, not substitution) or create meaningful extra work.

**Display label:** `Fits 1 of 4 · Significant changes`
**Visual:** Amber/orange indicator
**Card behaviour:** Review changes is available but the card is de-prioritised in the planner ordering. The planner will prefer Tier 1–3 meals when available.

---

#### Tier 5 — Incompatible

**Condition:**
- `memberChanges.length === members.length` (every eater needs changes)
- OR `scoreBreakdown.compatibility === 0`

The meal in its current form does not work for any household member without modification. This tier is effectively filtered by the existing Tier-4 shell recovery logic (`compatibility < 1` blocks shells). For non-shell meals it may still be surfaced as a lowest-priority suggestion with full review required.

**Display label:** `Requires full adaptation`
**Visual:** Red indicator (used sparingly)
**Card behaviour:** Not surfaced in primary Smart Planner suggestions. May appear in a "stretch" or "with effort" section if implemented.

---

### Tier Summary Table

| Tier | Name | Condition | Label | Colour |
|------|------|-----------|-------|--------|
| 1 | Fully Compatible | 0 eaters need changes | `Fits all 4` | Green |
| 2 | Mostly Compatible | 1 eater, all swaps known, <10 min extra | `Fits 3 of 4 · 1 easy swap` | Green + amber accent |
| 3 | Adaptable | Some eaters need changes, swaps available | `Fits 2 of 4 · Adaptable` | Amber |
| 4 | Poor Fit | Removals required or >20 min extra | `Fits 1 of 4 · Significant changes` | Amber/orange |
| 5 | Incompatible | All eaters need changes | `Requires full adaptation` | Red |

---

## Section 2 — Planner Meal Card Experience

### Design Principles

1. Compatibility is informative, not gatekeeping. A Tier 2 meal is a good meal.
2. The card must be scannable. A household cook planning seven days should absorb compatibility at a glance.
3. The most important signal is: "does this meal work tonight without extra effort?" — secondary is "what is the effort if I do want it?"
4. Household member indicators should be human (names or avatars), not abstract percentages.

---

### Card Anatomy

Each planner meal card contains three zones relevant to compatibility:

```
┌─────────────────────────────────────────────────────────┐
│  [Meal image / colour block]                            │
│                                                         │
│  Beef Lasagne                          [fitScore chip]  │
│  Dinner · Italian · 45 min                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  HOUSEHOLD FIT STRIP                             │  │
│  │  ● Colin  ● Daisy  ● Oliver  ◐ Lilly            │  │
│  │  Fits 3 of 4 · Review changes →                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

**Eater indicator dots:**
- Filled green circle `●` = this eater is fully compatible
- Half-filled amber circle `◐` = this eater needs adaptation (swap available)
- Outlined red circle `○` = this eater has a hard conflict (no swap, removal only)

**The strip is only visible when the household has 2+ eaters with dietary data.** For a solo user it does not appear.

---

### Card Examples

#### Example A — Fully Compatible (Tier 1)

```
┌─────────────────────────────────────────────────────────┐
│  [image]                                                │
│  Pizza Night                                   [82]    │
│  Dinner · Italian · 30 min                             │
│                                                         │
│  ● Colin  ● Daisy  ● Oliver  ● Lilly                   │
│  Fits all 4                                            │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

No review prompt. The green strip is positive reinforcement. Household dot indicators give visual confidence at a glance.

---

#### Example B — Mostly Compatible (Tier 2)

```
┌─────────────────────────────────────────────────────────┐
│  [image]                                                │
│  Beef Lasagne                                  [74]    │
│  Dinner · Italian · 45 min                             │
│                                                         │
│  ● Colin  ● Daisy  ● Oliver  ◐ Lilly                   │
│  Fits 3 of 4  ·  1 easy swap  ·  Review →              │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

The amber `◐` on Lilly's dot signals she needs a change. "1 easy swap" is reassuring — it signals the planner already has a suggestion. "Review →" is a secondary action, not a blocker.

---

#### Example C — Adaptable (Tier 3)

```
┌─────────────────────────────────────────────────────────┐
│  [image]                                                │
│  Chicken Tikka Masala                          [61]    │
│  Dinner · Indian · 40 min                              │
│                                                         │
│  ● Colin  ◐ Daisy  ◐ Oliver  ◐ Lilly                   │
│  Fits 1 of 4  ·  Adaptable  ·  Review →                │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

Three eaters need changes. The "Adaptable" label signals the system has swap suggestions. This is still a valid meal — just requires cooking awareness.

---

#### Example D — Single User (No Household Data)

```
┌─────────────────────────────────────────────────────────┐
│  [image]                                                │
│  Spaghetti Bolognese                           [78]    │
│  Dinner · Italian · 35 min                             │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

No household strip. No compatibility indicators. The strip is invisible until household eater data exists.

---

### Interaction Behaviour

- Tapping the household strip (not the eater dots individually) opens the Review Changes panel.
- Tapping an individual eater dot shows a brief inline tooltip for that eater: `"Lilly · Vegetarian · beef mince → lentils"`.
- The strip does not block card selection. The user can select a meal without reviewing changes.
- If a meal is selected without review, the adaptation details remain accessible via the card's detail view.

---

## Section 3 — Review Changes Experience

### Design Principles

1. The review is informative, not instructional. THA is not telling the cook how to cook — it is showing what it knows about who needs what.
2. Every change is attributed to a specific named eater. No anonymous "some members may require..."
3. Changes are presented as positive adaptations ("Lilly's version"), not as problems ("Lilly cannot eat this").
4. The household as a whole still shares the meal. The framing is "one pot, one conversation, different plates" — not separate meals.

---

### Review Panel Anatomy

The Review Changes panel opens as a bottom sheet or side drawer from the meal card. It does not replace the card — it overlays it so the user retains context.

```
┌─────────────────────────────────────────────────────────────┐
│  ╳                          Beef Lasagne                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Fits 3 of 4 eaters                                        │
│  ────────────────────────────────────                       │
│  ● Colin           No changes needed                        │
│  ● Daisy           No changes needed                        │
│  ● Oliver          No changes needed                        │
│  ◐ Lilly           2 adaptations                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LILLY'S VERSION                                           │
│                                                             │
│  ◐  beef mince  →  Quorn mince                             │
│     [Why?]                                                  │
│                                                             │
│  ◐  pasta sheets  →  gluten-free pasta sheets              │
│     [Why?]                                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shared ingredients (no changes needed):                    │
│  tomato sauce · ricotta · mozzarella · herbs                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Extra prep time:  +5 min                                   │
│                                                             │
│  [Accept adaptations]          [Choose a different meal]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### "Why?" Inline Expansion

Each adaptation line has a collapsible "Why?" that surfaces the conflict reason from the existing system:

```
  ◐  beef mince  →  Quorn mince
  ▼  Why?
     Lilly follows a Vegetarian diet.
     Beef mince is a meat protein — Quorn mince is a
     plant-based equivalent with similar texture for baking.
```

This maps to the existing `swaps[]` format. The swap string `"beef mince → Quorn mince"` is already produced by `household-meal-matcher.ts:284`. The "Why?" explanation requires the conflict reason (`"Vegetarian diet not covered"` from Path A) to be surfaced alongside it.

---

### Multiple Eaters Needing Changes

When multiple eaters need changes, each gets their own named section:

```
┌─────────────────────────────────────────────────────────────┐
│  Chicken Tikka Masala                                       │
│                                                             │
│  Fits 1 of 4 eaters                                        │
│  ● Colin           No changes needed                        │
│  ◐ Daisy           1 adaptation                             │
│  ◐ Oliver          1 adaptation                             │
│  ◐ Lilly           2 adaptations                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DAISY'S VERSION                                            │
│  ◐  chicken  →  chickpeas                                   │
│                                                             │
│  OLIVER'S VERSION                                           │
│  ◐  chicken  →  tofu                                        │
│                                                             │
│  LILLY'S VERSION                                            │
│  ◐  chicken  →  chickpeas                                   │
│  ◐  cream  →  coconut cream                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Shared: spices · onion · garlic · tomatoes · rice          │
│  Extra prep time: +10 min                                   │
│                                                             │
│  [Accept adaptations]     [Choose a different meal]         │
└─────────────────────────────────────────────────────────────┘
```

---

### Conflict Display Nuance

The design must handle both conflict detection paths:

**Path B conflicts (ingredient exclusion — high precision):**
```
  ◐  beef mince  →  Quorn mince
```
Ingredient name is exact. Swap is specific. This is the ideal case.

**Path A conflicts (diet pattern — category level):**
```
  ◐  Vegetarian diet  ·  Some ingredients may not be suitable
     [View ingredients]
```
When Path A fires without a corresponding Path B confirmation, the display acknowledges the category conflict but avoids fabricating specific ingredient claims. "View ingredients" expands the raw `allSlotIngredients` list so the user can judge for themselves.

**Priority rule:** If Path A fires AND a corresponding Path B ingredient conflict is detected for the same eater, show the ingredient-level conflict (Path B result) and suppress the generic Path A label. The specific is always more useful than the general.

---

## Section 4 — Accept Adaptations Behaviour

### The Four Options

When the user taps "Accept adaptations", they have a choice about persistence. This is the most consequential UX decision in the entire feature.

---

#### Option A — Apply This Week Only (Recommended for V1)

**Behaviour:** The adaptation is noted for this planner week. When the meal appears in the plan for this week, the meal card shows Lilly's variant. Nothing is written to any meal or eater record.

**Trade-off (pro):** Zero persistence risk. User can freely experiment. No long-term data to maintain or explain.
**Trade-off (con):** User must re-review the same adaptations every week. Learns nothing. No memory.

**Implementation surface:** Existing `plannerWeekEaterOverrides` table already supports per-week dietary overrides. This option extends that mechanism.

---

#### Option B — Remember for Lilly (Recommended for V2)

**Behaviour:** The specific swap (`beef mince → Quorn mince`) is associated with Lilly's household eater record. On future meals where beef mince appears, the system proactively shows Lilly's adaptation without requiring a fresh review.

**Trade-off (pro):** Progressive learning. The household compatibility picture improves over time. Each accepted adaptation enriches future planner suggestions.
**Trade-off (con):** The eater record now carries meal-specific knowledge (`beef → Quorn`) as well as dietary category knowledge (`Vegetarian`). These are different granularities. Needs careful distinction.

**Implementation surface:** Extends `household_eaters.hardRestrictions` with ingredient-level entries, or introduces a new `household_eaters.knownSwaps` concept. Requires schema change.

---

#### Option C — Save as Household Variant

**Behaviour:** A new entry is created in the user's meal library: "Beef Lasagne (Household)" or "Beef Lasagne — Lilly's version". This variant stores Lilly-specific ingredients and becomes a separate selectable meal.

**Trade-off (pro):** Rich library capability. The variant can be nutritionally tracked, shared, annotated.
**Trade-off (con):** Meal library bloat. Users may not want a second copy of every meal. Naming is awkward. Schema complexity.

**Implementation surface:** Requires a new "derived meal" or "variant" concept in the meals table. Most complex option.

---

#### Option D — Annotate the Planner Entry

**Behaviour:** The planner entry for Beef Lasagne gets a non-destructive annotation: `"Lilly: beef mince → Quorn mince, pasta → GF pasta"`. This is visible on the entry, not stored as a meal variant or eater preference.

**Trade-off (pro):** Lightweight. No schema changes to meals or eaters. Human-readable note.
**Trade-off (con):** Not machine-readable in future. Doesn't feed back into compatibility scoring.

**Implementation surface:** A `notes` or `adaptations` text field on `planner_entries`. Minimal change.

---

### Recommended Sequence

- **V1:** Option A (this week only). Uses existing `plannerWeekEaterOverrides` infrastructure.
- **V2:** Option B (remember for Lilly). Adds ingredient-swap knowledge to eater records.
- **Long-term:** Options C and D as power-user features.

---

## Section 5 — Shell Meals

### What Makes Shell Meals Different

A traditional recipe is a fixed ingredient list. Beef Lasagne is beef mince, pasta sheets, ricotta, tomato sauce. Adaptation means substituting within that fixed list.

A shell meal is a structural template. Taco Night is not a recipe — it is a meal format with interchangeable components. The template defines:

- `sharedBaseComponents`: the table — salsa, guacamole, lettuce, lime
- `proteinSlots`: chicken, beef, black beans, tofu, pulled jackfruit
- `carbSlots`: corn tortillas, flour tortillas, lettuce wraps
- `toppingSlots`: cheese, dairy-free cheese, jalapeños, sour cream, cashew cream

**Household compatibility for a shell meal is not adaptation. It is participation.** Lilly doesn't need a modified Taco Night — she picks from the plant-based protein slot and the dairy-free topping slot. The meal is inherently inclusive.

---

### Shell Meal Compatibility Display

The compatibility strip for shell meals reads differently:

```
┌─────────────────────────────────────────────────────────┐
│  [image]                                                │
│  Taco Night                                    [88]    │
│  Dinner · Mexican · 30 min                             │
│                                                         │
│  ● Colin  ● Daisy  ● Oliver  ● Lilly                   │
│  Fits all 4  ·  Build your own                         │
│                                                         │
│  [Select]  [Lock]  [Swap]                               │
└─────────────────────────────────────────────────────────┘
```

"Build your own" signals that the meal format naturally accommodates everyone. No review required. The shell structure does the work.

---

### Shell Meal Review Panel

When tapped, the shell meal review panel shows participation layout rather than adaptation instructions:

```
┌─────────────────────────────────────────────────────────────┐
│  Taco Night                              Build your own      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shared for everyone:                                       │
│  salsa · guacamole · lettuce · lime · jalapeños             │
│                                                             │
│  PROTEIN OPTIONS                                            │
│  Colin, Daisy, Oliver  →  chicken thigh (or beef mince)    │
│  Lilly                 →  black beans (or spiced tofu)      │
│                                                             │
│  CARB OPTIONS                                               │
│  Everyone  →  corn tortillas (GF) or flour tortillas       │
│                                                             │
│  TOPPING OPTIONS                                            │
│  Colin, Daisy, Oliver  →  sour cream or cheddar            │
│  Lilly                 →  cashew cream or dairy-free cheese │
│                                                             │
│  Extra prep time: +5 min (parallel protein prep)           │
│                                                             │
│  [Add to plan]                                              │
└─────────────────────────────────────────────────────────────┘
```

This is not adaptation — it is presentation. The cook sees the table to set up, the parallel prep needed, and exactly which options to prepare per eater.

---

### Shell Meal Examples

#### Pizza Night

```
Shared base: tomato sauce · fresh basil · olive oil

Base options:
  Colin, Daisy, Oliver  →  standard dough
  Lilly                 →  gluten-free base

Topping options:
  Everyone              →  tomato · mushrooms · peppers
  Colin, Daisy, Oliver  →  mozzarella + pepperoni
  Lilly                 →  dairy-free cheese + artichoke
```

#### Burger Night

```
Shared: lettuce · tomato · pickles · ketchup · fries (shared or GF)

Patty options:
  Colin, Oliver  →  beef burger patty
  Daisy          →  chicken burger
  Lilly          →  plant-based burger

Bun options:
  Colin, Daisy, Oliver  →  brioche bun
  Lilly                 →  gluten-free bun
```

#### Curry Night

```
Shared: onion base · garlic · ginger · spice blend · rice

Protein options:
  Colin, Oliver  →  chicken thigh
  Daisy, Lilly   →  chickpeas + spinach

Dairy options:
  Colin, Oliver  →  single cream
  Daisy, Lilly   →  coconut cream
```

#### Stir Fry Night

```
Shared: noodles (or rice) · soy sauce · sesame oil · vegetables

Protein options:
  Colin, Daisy  →  chicken breast
  Oliver        →  king prawns
  Lilly         →  tofu (extra-firm, pressed)
```

---

### Why Shell Meals Score Higher

The `swapSimplicity` score (`household-meal-matcher.ts:88`) rewards meals where variants exist with swap suggestions. Shell meals, by design, have multiple protein and carb slot options. The matcher's logic naturally favours them for mixed households — they surface in Tier 1 even when members have varied restrictions because the slot structure provides compatible options across the household without anyone "missing out".

---

## Section 6 — Traditional Recipes

### Design Challenge

Traditional recipes present a harder compatibility problem because they have a single ingredient list. Adaptation requires the cook to make a deliberate change, not just present additional components.

The design must be honest about the effort involved without discouraging the meal.

---

### Beef Lasagne

**Conflict profile:**
- Lilly (Vegetarian): `beef mince → lentils/Quorn` (Path B, swap available)
- Lilly (Gluten-Free if applicable): `pasta sheets → GF pasta sheets` (Path B, swap available)

**Review panel:**

```
Beef Lasagne  ·  Fits 3 of 4 eaters

Shared ingredients:
tomato sauce · ricotta · mozzarella · herbs · garlic

LILLY'S PORTION
Set aside 1/4 of the sauce before adding beef.
Use gluten-free pasta sheets throughout (affects whole dish).

Adaptations:
  beef mince  →  Quorn mince (or lentils)
  pasta sheets  →  gluten-free pasta sheets

Note: gluten-free pasta sheets affects the whole dish —
Lilly's adaptation benefits everyone, not just her.
```

**Key design note:** When an adaptation (GF pasta) affects the entire dish rather than just one portion, the UI should surface this clearly. "This change affects the whole dish" is more useful than presenting it as a single-eater change.

---

### Chicken Curry

**Conflict profile:**
- Lilly (Vegetarian): `chicken → chickpeas` (Path B, swap available)
- Lilly (Dairy-Free): `cream → coconut cream` (Path B, swap available)

**Review panel:**

```
Chicken Curry  ·  Fits 3 of 4 eaters

Shared: onion base · garlic · ginger · spices · tomatoes · rice

LILLY'S VERSION (parallel prep)
Cook a separate smaller pan with:
  chickpeas (replace chicken)
  coconut cream (replace single cream)

Everything else — same pot, same spice blend, same rice.

Adaptations:
  chicken  →  chickpeas
  single cream  →  coconut cream

Extra prep: +8 min
```

The panel here naturally guides the cook toward parallel preparation without prescribing it. The language is "here is what Lilly needs" not "here is how to cook."

---

### Cottage Pie

**Conflict profile:**
- Cottage Pie has a unique structure: shared mash topping, meat filling below
- Lilly (Vegetarian): `beef mince → lentils/mushroom ragu`

**Review panel:**

```
Cottage Pie  ·  Fits 3 of 4 eaters

Shared: potato mash · butter · milk · carrots · onion · peas

LILLY'S PORTION
The mash is shared — make one batch for everyone.
For the filling, set aside 1/4 and use lentil ragu.
Bake in a separate small ramekin.

Adaptation:
  beef mince  →  lentil and mushroom ragu

Extra prep: +10 min (separate ramekin)
```

---

### Spaghetti Bolognese

**Conflict profile:**
- Lilly (Vegetarian): `beef mince → lentils` or `mushroom mince`

**Review panel:**

```
Spaghetti Bolognese  ·  Fits 3 of 4 eaters

Shared: tomato base · onion · garlic · herbs · spaghetti

LILLY'S PORTION
Cook sauce without mince first — divide off a portion.
Add mince to the main pan, simmer.
Add lentils (pre-cooked) to Lilly's portion.

Adaptation:
  beef mince  →  green or puy lentils (pre-cooked)

Extra prep: +3 min
Note: Pasta is shared — use GF pasta if Lilly has a gluten restriction.
```

---

### Ingredient-Level Conflict Precision (Design Note)

As established in the feasibility investigation, Path A conflicts (diet pattern mismatch) produce a category-level message and do not resolve to specific ingredients. When the household compatibility UI shows "Lilly requires changes," the quality of that information depends on the eater's `hardRestrictions` being populated.

**Short-term design:** When only Path A fires (no ingredient-level conflicts), the review panel shows:

```
LILLY'S VERSION
Lilly follows a Vegetarian diet.
This recipe may contain meat or fish.
Tap [View ingredients] to check.
```

This is honest. It does not fabricate a specific conflict the system cannot confirm. It gives the cook the information they need to decide.

**Post adult-eater-fix design:** Once adult eater `hardRestrictions` are populated from profile data, Path B fires and specific ingredient-level conflicts are surfaced. The full review panel becomes available without the fallback message.

---

## Section 7 — Nutrition Enhancement Integration

### The Layered Opportunity

Once adaptations are accepted, the meal is understood at a deeper level than before. The system knows:

- Who is eating what
- Which ingredients are shared vs personal
- Which dietary constraints are active

This creates a richer context for Nutrition Boost suggestions.

---

### Current Nutrition Boost Behaviour

The Nutrition Boost system (`MealUpliftPanel`) currently suggests additions based on the meal's ingredient profile and the requesting user's health goals. It operates at the meal level, not the household level.

---

### Integrated Design

When a meal has accepted adaptations, Nutrition Boost suggestions should be:

1. **Household-safe**: Only suggest additions that are compatible with every eater (or flag which eaters need their own addition)
2. **Aware of variants**: Suggest shared additions where possible — things everyone can have

---

### Pizza Night Example

```
┌─────────────────────────────────────────────────────────────┐
│  Pizza Night  ·  Fits all 4  ·  Adaptations accepted        │
│                                                             │
│  CURRENT ADAPTATIONS                                        │
│  Lilly: gluten-free base                                    │
│  Colin: keto base                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  NUTRITION BOOST IDEAS                                      │
│                                                             │
│  For everyone:                                              │
│  + Rocket (post-bake) — adds peppery iron-rich greens      │
│  + Fresh herbs (basil, oregano) — antioxidants             │
│  + Cherry tomatoes — lycopene, all dietary types           │
│                                                             │
│  For Lilly specifically:                                    │
│  + Pumpkin seeds — plant-based zinc and magnesium          │
│                                                             │
│  Flagged: Parmesan shavings — not Dairy-Free (Lilly)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Beef Lasagne Example

```
NUTRITION BOOST IDEAS

For everyone:
+ Spinach layer (hidden in sauce) — iron, folate
+ Courgette layer (under pasta) — fibre, moisture

For Colin, Daisy, Oliver (meat version):
+ Extra lean mince upgrade — lower sat fat

For Lilly (plant-based version):
+ Lentil ragu boost: smoked paprika + walnuts
  (walnuts add omega-3 to the plant-based version)
```

---

### Design Principle for Integrated Boosts

The boost panel should explicitly distinguish between:

- **Shared boosts**: Safe and beneficial for all eaters simultaneously
- **Individual boosts**: Beneficial for specific eaters (flag the eater by name)
- **Flagged suggestions**: Would be a nutrition boost but conflicts with an eater restriction (show it crossed out, with reason)

This prevents the cook from unknowingly serving a boost that harms one eater while benefiting others.

---

## Section 8 — Planner Transparency

### Why This Meal Was Chosen

The Smart Planner currently produces an `explanation` string and a `MealExplanation` object with `reasons[]`. These are based on individual user preferences. The design needs to extend them to include household context.

---

### Existing Explanation Fields Available

From `household-meal-matcher.ts` and `explainability-service.ts`:

| Source | Data |
|--------|------|
| `explanation` string | "Fits 3 of 4 profiles, 1 swap needed" |
| `scoreBreakdown.compatibility` | 0.75 (3 of 4) |
| `scoreBreakdown.swapSimplicity` | 0.82 (1 easy swap) |
| `scoreBreakdown.healthAlignment` | 0.90 |
| `scoreBreakdown.sharedBase` | 0.70 (many shared ingredients) |
| `sharedIngredients[]` | ["tomato sauce", "mozzarella", "herbs"] |
| `MealExplanation.reasons[]` | ["Matches your Mediterranean diet", "Fits your budget"] |

---

### Extended Transparency Panel Design

```
┌─────────────────────────────────────────────────────────────┐
│  Why was Beef Lasagne suggested?                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HOUSEHOLD FIT                                              │
│  ✓ Fits 3 of 4 eaters                                      │
│  ✓ 1 easy adaptation (Lilly)                               │
│  ✓ Only 5 extra minutes prep                               │
│                                                             │
│  SHARED MEAL                                               │
│  ✓ 6 ingredients shared across everyone                    │
│    tomato sauce · mozzarella · ricotta · herbs · garlic     │
│                                                             │
│  PERSONAL PREFERENCES (Colin)                              │
│  ✓ Matches Mediterranean diet pattern                       │
│  ✓ Fits standard budget                                     │
│  ✓ Uses pasta (already in this week's plan)                 │
│                                                             │
│  HEALTH & NUTRITION                                         │
│  ✓ Moderate UPF score                                       │
│  ✓ Good protein content                                     │
│                                                             │
│  PLAN EFFICIENCY                                            │
│  ✓ Shares base sauce with Tuesday's Spaghetti              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Condensed Card Version

For the meal card, the transparency is condensed into a scannable "why" strip:

```
Selected because:  Fits 3 of 4  ·  1 easy swap  ·  High nutrition  ·  Shares sauce base
```

This maps directly to:
- `explanation` string (household fit)
- `MealExplanation.reasons[]` (personal preferences / nutrition)
- `sharedIngredients` (plan efficiency)

---

### Tone Guidelines

- Use household framing: "Fits 3 of 4" not "1 eater conflict"
- Use active language: "shares ingredients with Tuesday" not "ingredient overlap detected"
- Use specific names where beneficial: "Lilly needs 1 swap" not "1 eater requires adaptation"
- Avoid numerical scores in the main UI: `fitScore: 74` has no consumer meaning — translate to tier labels

---

## Section 9 — Recommended THA Experiences

---

### Recommended Version 1 — Household Fit Strip

**Scope:** Minimal. Surface existing backend data with no new computation.

**What it adds:**
- Eater indicator dots on each planner meal card
- "Fits X of Y" label derived from existing `memberChanges.length`
- Tappable strip opens bottom-sheet review panel
- Review panel shows per-eater changes from existing `MemberChange[]` data

**What it does NOT add:**
- No accept/persist flow
- No "Why?" explanations
- No Nutrition Boost integration
- No new backend computation (all data already exists in `MealMatch`)

**Required implementation change:**
- Propagate `memberChanges` from `MealMatch` into `SmartCandidate` API response
- Add `householdFit` field to `SmartCandidate` client type
- Render household fit strip in planner meal card component
- Build review bottom sheet (display only)

**Risk:** Low. No schema changes. No new computation. No persistence. Read-only surface change.

**Prerequisite:** Adult eater `hardRestrictions` data gap must be resolved first — otherwise the feature works only for children's restrictions, not adult profiles. (See `HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md`.)

**Expected result:**
The planner immediately shows households which meals are frictionless and which need attention. Children's dietary needs become visible for the first time. Adult needs become visible once the data gap is resolved.

---

### Recommended Version 2 — Reviewable Adaptations with Weekly Acceptance

**Scope:** Adds the review-and-accept interaction. Uses existing `plannerWeekEaterOverrides` for persistence.

**What it adds on top of V1:**
- "Review changes" bottom sheet with full per-eater adaptation list
- "Accept for this week" action that writes to `plannerWeekEaterOverrides`
- Accepted state reflected in meal card (strip shows "Adaptations accepted" badge)
- "Why was this chosen?" transparency panel

**What it does NOT add:**
- No persistent eater learning (swaps are not saved to household_eater records)
- No meal variant library
- No Nutrition Boost integration

**Risk:** Low-medium. Uses existing `plannerWeekEaterOverrides` table. No new schema. The only new write path is from the review panel into that existing table.

**Expected result:**
The household planner becomes genuinely household-aware. A parent planning the week can see at a glance which meals need preparation thought, review the specific adaptations, and confirm the week's plan with confidence.

---

### Recommended Long-Term Vision — Household Cooking Intelligence

**Scope:** Full integration of compatibility, adaptations, nutrition, and household variant memory.

---

#### Stage 1: Eater Learning (Post-V2)

After accepting adaptations several times, THA proposes:

```
You've replaced beef mince with Quorn mince for Lilly
three times this month.

Would you like to save this as Lilly's default?
[Save for Lilly]  [Not now]
```

This writes to Lilly's household eater record and enriches future compatibility scoring. Over time the household's adaptation knowledge grows — new meals are pre-analysed against Lilly's known ingredient preferences.

---

#### Stage 2: Household Variant Library (Post-V2)

A household can save named variants:

```
Spaghetti Bolognese
  Standard version (Colin, Daisy, Oliver)
  Lilly's version  →  lentil bolognese, GF pasta
```

Variants appear in the meal library as a grouped entry. They can be scheduled together ("Bolognese night") or separately.

---

#### Stage 3: Shared Table Planning

The planner week view gains a household dimension. Each week slot shows:

```
Monday Dinner: Beef Lasagne
  Everyone:  standard lasagne
  Lilly:     Quorn + GF pasta version
  Prep note: Make one sauce base, divide before adding beef
```

The planner becomes a cooking briefing document, not just a meal list.

---

#### Stage 4: Nutrition Integration

Accepted adaptations feed into Nutrition Boost:

- Boosts are filtered for household safety
- The boost panel distinguishes shared vs individual additions
- Lilly's plant-based version can receive protein-specific boost suggestions that don't apply to the meat version
- The household's cumulative nutrition picture tracks across all versions

---

#### Stage 5: Progressive Household Profile

Over time, THA builds a household dietary intelligence that it did not have at the start:

- Which meals always need adaptation
- Which adaptations are simple (swap) vs complex (remove + substitute)
- Which eaters have the broadest vs narrowest ingredient range
- Which meals the whole household eats without any changes

This feeds back into Smart Planner suggestion ordering. The planner learns that for this household, shell meals and Mediterranean food reliably score highest — and over-suggests those categories for frictionless weekly planning.

---

## Design Constraints and Non-Goals

The following are explicitly out of scope for this design:

| Out of Scope | Reason |
|-------------|--------|
| Instructional cooking steps ("Step 1: brown the mince") | THA is not a recipe app — it is a planning app |
| AI-generated adaptation suggestions | Not needed: existing swap rules already cover the key cases |
| Caloric/macro recalculation per variant | Valuable long-term but adds complexity beyond V1/V2 scope |
| Household variant synchronisation across devices | Architecture concern, not design concern |
| "Can I make this vegan?" meal transformation | Too broad — this is adaptation within a known meal, not meal transformation |

---

## Summary of Design Decisions

| Decision | Rationale |
|----------|-----------|
| Compatibility expressed as "Fits X of Y" not a percentage | More human. "3 of 4" means someone specific — not 75% abstract |
| Eater dots on the card, not a number chip alone | Names and faces > statistics. The household is not a dataset |
| Review is non-blocking | Compatibility info should not prevent meal selection |
| V1 has no accept/persist flow | Zero-persistence first reduces risk; learn what users want before committing a write path |
| "Why?" per swap is collapsible, not always visible | Experts don't need it; beginners do. Collapsed by default respects scanning |
| Shell meals use "Build your own" framing | Removes the word "adaptation" when none is actually needed — the meal format does the work |
| Path A conflicts displayed honestly as category-level | Never fabricate ingredient specificity the system does not have |
| Nutrition Boost flagged suggestions (crossed out) | Prevents the boost feature from accidentally harming an eater |
