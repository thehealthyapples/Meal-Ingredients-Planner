# WS5A — Preparation Knowledge Architecture Investigation

> **The same food. A different thing done to it. Nutrition only changes if the evidence says so.**
>
> Investigation only. No schema changes. No UI changes. No DB changes. No implementation.

| | |
|---|---|
| **Document type** | Investigation + target architecture (no implementation) |
| **Date** | 2026-06-20 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at investigation** | `8e4ef24` (WS4B amendment committed) |
| **Rollback tag** | `rollback/ws5a-pre-investigation-20260620` → commit `8e4ef24` |
| **Restore command** | `git reset --hard rollback/ws5a-pre-investigation-20260620` |
| **Predecessor documents** | WS0 · WS1.5 · WS2A · WS2B · WS2C · WS2D · WS2E · WS2F · WS2G · WS3A · WS3B · WS4B (+ amendments A/B) |

**This document changes nothing executable.** Reads existing data: YES. Writes new data: NO.
Changes meaning of existing data: NO. Requires backfill: NO.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed clean** *before work began.* The working tree carried one uncommitted
   change: the completed **WS4B amendment** (Amendment A — Automated Canonical Food Growth;
   Amendment B — Multi-Path Benefits), 416 insertions to `WS4B_NUTRITION_KNOWLEDGE_PIPELINE.md`.
2. ✅ **WS4B and all amendments protected.** The uncommitted amendment was an *unprotected* edit
   (the `rollback/ws4b-amendment-20260620` tag marked the *pre-amendment* commit `5d453d0`, not the
   amendment content itself). To satisfy "WS4B and all amendments are protected", the finished
   amendment was committed → **`8e4ef24`** before any WS5A work. WS4B now lives in git history with
   its content, not just its rollback marker.
   - `rollback/ws4b-pre-investigation-20260620` → `72eccee` (original WS4B baseline)
   - `rollback/ws4b-amendment-20260620` → `5d453d0` (pre-amendment-content baseline)
   - `8e4ef24` (amendment content now committed and protected)
3. ✅ **Rollback tag created for WS5A:** `rollback/ws5a-pre-investigation-20260620` → commit `8e4ef24`.
4. ✅ **Rollback identifier:** `rollback/ws5a-pre-investigation-20260620`
   (restore: `git reset --hard rollback/ws5a-pre-investigation-20260620`)

No WS5A work began until the above was confirmed.

---

## EXECUTIVE SUMMARY

**Preparation already exists in THA — latently and untyped.** It lives today in the `commonForms`
field of `shared/knowledge/foods.ts` (`raw`, `toasted`, `smoked`, `soaked`, `cooked`, `roasted`,
`tinned`, `frozen`, `dried`), and its words are actively *stripped* for identity resolution by
`STRIP_WORDS` in `shared/canonical/variety.ts` (`fresh`, `dried`, `frozen`). The Food Report adapter
already enforces a **PREPARATION GUARD** (`buildFoodReport()` returns `null` for strings like
"grilled tomatoes"). So THA has three half-formed positions on preparation that WS5A must unify:

1. *Preparation is display trivia* (`commonForms`, never surfaced as knowledge).
2. *Preparation is identity noise* (stripped so "frozen spinach" still counts as spinach).
3. *Preparation must never be a food* (the adapter's null guard).

**The recommendation.** Promote Preparation to a first-class, **universal** concept that sits in the
spine between Qualifiers and Attributes — exactly as the approved direction states:

```
Canonical Food → Varieties → Qualifiers → PREPARATION → Attributes → Benefits → Key Nutrients → Nutrition Context → Meals
```

Model it as a **lightweight metadata layer on the canonical food** (a `food_preparation` catalogue
plus an evidence-gated `preparation_effect` link), **not** as new canonical foods and **not** as new
varieties. Every canonical food *supports* preparations; almost none of them carry a
preparation-specific nutrition *claim*, because **a preparation changes nutrition, benefits, or
guidance only where trusted evidence exists**. The default state — and the honest one — is:

> **No preparation-specific nutrition note yet.** We don't currently have trusted evidence that this
> preparation meaningfully changes the food's main nutrition profile.

This preserves THA's two load-bearing invariants from WS4B: the **identity spine does not fork**
(preparation never mints a food), and the **editorial hard wall protects claims** (preparation never
invents a benefit). Preparation is a *connector with a default of silence*, not a claim generator.

---

## SECTION 1 — PART 1: WHAT IS A PREPARATION?

### 1.1 Definition

A **Preparation** describes **what is done to a food between the shop and the plate** — a state
change, a cooking method, or a processing/preservation step — applied to one canonical food, without
changing its biological identity (Variety) or its sourcing/grade story (Qualifier).

```
Canonical Food: Tomato
  Preparation: Raw          ← no transformation
  Preparation: Cooked       ← heat applied
  Preparation: Sun-dried    ← preservation + concentration

Canonical Food: Salmon
  Preparation: Fresh        ← baseline state
  Preparation: Smoked       ← cure/smoke processing
  Preparation: Tinned       ← cook + preserve

Canonical Food: Spinach
  Preparation: Fresh
  Preparation: Frozen       ← preservation state
  Preparation: Steamed      ← cooking method

Canonical Food: Eggs
  Preparation: Boiled / Fried / Scrambled / Poached   ← cooking methods

Canonical Food: Oats
  Preparation: Rolled / Overnight oats / Granola      ← form + method + composite (see 1.5)
```

### 1.2 The governing rule (from the brief, made operational)

> **Preparation does NOT automatically imply different benefits, different nutrients, or different
> health claims. Only trusted evidence may create those relationships.**

So a Preparation has two independent dimensions:

- **Existence** — that the preparation is a recognised way people eat this food. This is cheap,
  editorial, and broadly true (boiled eggs exist; toasted bread exists). It is *always allowed*.
- **Effect** — that the preparation *measurably changes* nutrition/benefit/guidance. This is
  expensive, evidence-gated, and rare. It is *allowed only with a trusted source* (Section 3).

THA may always state that a preparation **exists**. THA may state that a preparation **changes
something** only when evidence backs it. Absence of an effect is reported honestly (Section 4), never
as a system gap.

### 1.3 Editorial rules — what IS a Preparation?

A term is a Preparation if it passes **all three** tests:

**Test P1 — Same food, transformed?**
Is this the *same* canonical food with something *done to it* (cooked, preserved, processed) — rather
than a different cultivar or a different sourcing choice? Raw tomato ↔ cooked tomato → YES (both
tomato). Cherry tomato ↔ plum tomato → NO (that is a Variety).

**Test P2 — Does the transformation happen at/after harvest-to-plate processing, not at the farm?**
Preparation is about *what happens to the ingredient on its way to being eaten* — kitchen cooking,
factory preservation, or curing. It is **not** how the animal was raised or how the oil was pressed
(those are Qualifiers — see 1.4). Smoked, frozen, toasted, boiled → YES. Grass-fed, organic,
cold-pressed → NO.

**Test P3 — Would a home cook or shopper recognise this as a choice of "how it's prepared/sold",
not "what it is"?**
If the term names a *condition you select at the point of cooking or buying a processed format*, it
is a Preparation. If it names *the food itself*, it is a Variety or a separate canonical food.
Tinned salmon → YES (still salmon, preserved). Refined olive oil → NO (a separate canonical food, per
WS3B Case A).

### 1.4 Preparation vs Variety vs Qualifier vs Attribute (the full lattice)

This is the heart of WS5A. WS1.5 established five classification rules (A=Alias, B=Variety, C=Form,
D=Separate Food, E=Composite); WS3B added Qualifier as the sixth. **WS5A's contribution is to
recognise that "Form" and the narrow "kitchen Preparation" WS3B mentioned in passing are the same
universal concept, and to name it Preparation.**

| Concept | The question it answers | Where in life it happens | DB home today | Example |
|---|---|---|---|---|
| **Variety** | *What kind* of this food is it? | Genetics / cultivar / breed | `food_variety` | Cherry tomato, Cavolo Nero, Greek yoghurt |
| **Qualifier** | *How was it produced/sourced?* | The farm / the press (pre-kitchen) | none (WS3B proposes `food_qualifier`) | Grass-fed, organic, wild, extra-virgin |
| **Preparation** | *What was done to it on the way to the plate?* | The factory / the kitchen | latent in `commonForms`; **none typed** | Raw, cooked, smoked, frozen, toasted, tinned |
| **Attribute** | *What nutritional property does it have?* | Intrinsic to the food (or a state of it) | `knowledgeFoodNutrients` / WS0 | High in fibre, source of omega-3 |
| **Benefit** | *What does it do for health?* | Composed from attributes/patterns | WS0 `FOOD_BENEFITS` (+WS4B multi-path) | Supports heart health |

**Preparation vs Variety.**
A Variety is a *biological sub-kind* fixed before anyone buys it (cherry vs plum is decided at the
seed). A Preparation is a *transformation chosen at or after purchase* (raw vs cooked is decided in
the kitchen). The test: *could the same physical specimen become either option?* A single tomato can
be eaten raw OR cooked → Preparation. A single tomato cannot be both cherry AND plum → Variety.

**Preparation vs Qualifier.**
Both are layered onto one canonical food. The divider is **time and place**: a Qualifier is settled
*before the kitchen* (how the salmon was caught, how the beef was raised) and is a **buying-decision**
signal; a Preparation happens *in or after the kitchen/factory* (the salmon is smoked, the egg is
boiled) and is a **cooking/format** signal. WS3B fixed this divider in §1.3 — WS5A keeps it
verbatim: *"A Qualifier describes what happened before the kitchen. A Preparation describes what
happened in the kitchen."* (extended here to include factory preservation: smoking, tinning,
freezing).

**Preparation vs Attribute.**
An Attribute is an intrinsic nutritional property. A Preparation may, *with evidence*, **modulate**
an attribute (cooking tomatoes raises *bioavailable* lycopene). The Preparation does not *become* the
attribute; it *adjusts the strength or availability of one*. This is why Preparation sits **upstream
of Attributes** in the spine: a preparation effect, when evidenced, feeds into how an attribute is
expressed for that prepared form.

### 1.5 Hard classification decisions — borderline cases

These cases look like preparations but need an explicit ruling, because THA already half-handles some
of them as Forms, Qualifiers, or composites.

**Case A: "Frozen", "Tinned", "Dried" (the old "Form" cases).**
*Current state:* `STRIP_WORDS` strips `frozen`/`dried` for identity; `commonForms` lists `tinned`,
`frozen`, `dried`. WS1.5/WS3B called these **Forms** (`aliasType: 'form'`).
*Ruling:* These ARE Preparations (preservation-state sub-type). Folding the old "Form" concept into
Preparation removes a redundant category. **Identity behaviour is unchanged** — `frozen spinach`
still resolves to `spinach`; the word `frozen` is still stripped for matching. The difference is that
"frozen" is now *captured as preparation metadata* rather than silently discarded. (Identity strip
and preparation capture are two reads of the same string — see 1.7.)

**Case B: "Smoked" (the WS3B grey area).**
*Current state:* WS3B ruled smoked salmon as *Form for identity, Qualifier-flag for Analyser
(`isProcessed: true`, sodium/curing context)*.
*Ruling:* Reclassify smoked as a **Preparation** (processing sub-type) — it is unambiguously
"something done to the fish", not how it was caught. This is cleaner than the WS3B compromise: the
sodium/curing context becomes a *preparation effect* with evidence (smoking → higher sodium), which
is exactly the evidence-gated effect model of Section 3. Identity still collapses to `salmon`.

**Case C: "Sun-dried tomato".**
*Ruling:* Preparation (preservation + concentration). It resolves to `tomato`. An evidenced effect
exists (concentration raises per-gram lycopene *and* sodium/sugar where salted) — a good example of
a preparation that changes nutrition in *more than one direction*, requiring balanced wording.

**Case D: "Granola", "Overnight oats", "Trail mix".**
*Ruling:* SPLIT. *Overnight oats* and *rolled oats* are Preparations of `oats` (state/method).
*Granola* and *trail mix* are **composites** (WS1.5 Rule E — added sugar, oil, nuts, dried fruit) and
are **NOT** preparations of a single food; they are separate composite items that should never
inherit oats' clean nutrition profile. The test: *does the preparation add other foods?* If yes →
composite, not preparation. This guards against "granola is just prepared oats, so it's healthy".

**Case E: "Homemade" (bread), "Toasted" (bread).**
*Ruling:* *Toasted* is a Preparation (method) of `bread` with — per the brief — no meaningful
evidenced nutrition change (Section 4). *Homemade* is **not a Preparation** — it is closer to a
Qualifier (a sourcing/production choice) or simply out of scope; it describes *who made it*, not
*what was done to the food*. Recommend: do not model "homemade" as a preparation.

**Case F: "Cooked" / "Raw" as a generic pair.**
*Ruling:* Valid Preparations, but "cooked" is a *family* (boiled, steamed, roasted, fried). Model a
shallow hierarchy: a generic `cooked` preparation, with specific methods as children where an
*effect* distinguishes them (boiling vs frying changes fat; steaming vs boiling changes water-soluble
vitamin loss). Where no effect distinguishes children, keep only the generic parent to avoid
combinatorial bloat.

### 1.6 A proposed Preparation sub-type taxonomy

To keep editorial decisions consistent, every Preparation carries a **type**:

| Sub-type | Meaning | Examples | Typical evidence pattern |
|---|---|---|---|
| `state` | Baseline / no transformation | raw, fresh | Reference point; rarely an effect |
| `preservation` | Format that extends shelf life | frozen, tinned, dried, sun-dried | Often sodium/sugar (added), sometimes vitamin retention (frozen-at-source) |
| `cooking` | Heat method in the kitchen | boiled, steamed, roasted, fried, grilled, poached | Fat (frying), water-soluble vitamin loss, bioavailability |
| `processing` | Industrial/curing transformation | smoked, toasted, fermented* | Sodium (smoking), acrylamide context (heavy toasting) |
| `composite` | **NOT a preparation** — adds other foods | granola, trail mix, hummus | Excluded; routes to composite handling |

\* *Fermented* sits on the Preparation/Attribute border. WS4B Amendment B treats *fermented* as an
**attribute** path for benefits (gut health). Ruling: fermentation is a *processing preparation* that
*creates* the `fermented` attribute — model it as a preparation whose evidenced effect is "confers
the fermented attribute". This keeps WS4B's benefit logic intact while giving fermentation a home in
the preparation layer.

### 1.7 Identity is preserved — the two-reads principle

The single most important architectural guarantee: **reading a preparation off an ingredient string
must not change which canonical food that string resolves to.**

```
"200g chopped frozen spinach"
   ├─ identity read   → stripQuantityAndPrep + resolveCanonicalFood → "spinach"   (UNCHANGED)
   └─ preparation read → detectPreparation                          → "frozen"     (NEW, additive)
```

The preparation read is a *second, independent pass* over the same string. It never feeds back into
identity. This means Preparation can be added with **zero risk to plant counting, variety
resolution, or meal matching** — the WS2/WS3 hot paths are untouched.

---

## SECTION 2 — PART 2: WHAT CAN PREPARATION INFLUENCE?

### 2.1 The influence matrix

| Can a preparation effect influence…? | Allowed? | Condition | Example |
|---|---|---|---|
| **Nutrients** (amount / bioavailability) | ✅ Yes | Trusted evidence only | Cooked tomato → higher bioavailable lycopene |
| **Attributes** | ✅ Yes | Trusted evidence only | Fermentation → confers `fermented` attribute |
| **Benefits** | ⚠️ Indirect only | Via an evidenced nutrient/attribute path (WS4B) — never directly | Smoked salmon does NOT gain a benefit; it may carry a *caution* |
| **Nutrition Context** (educational lines) | ✅ Yes | Editorial, sourced | "Cooking tomatoes can increase lycopene availability." |
| **Guidance / cautions** | ✅ Yes | Trusted evidence only | Smoked → "higher in salt; enjoy occasionally" |
| **Healthier Alternatives** | ⚠️ Cautiously | Only as an *educational* swap, never judgemental (Section 7) | Deep-fried → oven-baked |
| **Shopping recommendations** | ⚠️ Future | Buying-format guidance, evidence-gated | Tinned vs fresh trade-offs |
| **Plant Diversity count** | ❌ Never | Preparation never adds/removes a plant | Raw + cooked carrot = one carrot |
| **Canonical identity** | ❌ Never | Preparation never mints a food | "Grilled tomatoes" ≠ a food |
| **Apple Score** | ❌ Not directly | Score rates products/meals, not preparations | A preparation may *inform context*, not move the score |

### 2.2 The benefit firewall (preparation edition)

Per the brief's IMPORTANT RULE and WS4B's hard wall: **a preparation never authors a benefit
directly.** The only legitimate route is:

```
Preparation (evidenced effect) → changes a Nutrient/Attribute → which (via WS4B's composed path)
                                  may strengthen/weaken an existing benefit's expression
```

THA must never write "Smoked salmon is good for your heart *because it's smoked*." Smoking does not
create the heart benefit; the omega-3 does, and smoking is irrelevant or mildly *negative* (sodium).
This direction-of-causation discipline is the preparation-specific form of WS4B's "composed, not
invented" rule.

### 2.3 Worked examples (from the brief) and their evidence status

| Food | Preparation | Claimed effect | Evidence direction | THA treatment |
|---|---|---|---|---|
| Tomato | Cooked | ↑ bioavailable lycopene | Strong (well-replicated) | State as a positive nutrition-context note |
| Salmon | Smoked | ↑ sodium | Strong | State as a gentle *caution*, not a benefit |
| Oats | Overnight | different glycaemic response | Emerging/contested | Hedge heavily or default to "no firm note yet" |
| Potato | Boiled-then-cooled | ↑ resistant starch | Moderate/emerging | Educational note with uncertainty framing |
| Bread | Toasted | meaningful change | None | **Default "no note yet"** (Section 4) |
| Chicken | Roasted vs grilled | meaningful change | None | **Default "no note yet"** |

The table shows the realistic distribution: **a few strong effects, several uncertain ones, and a
long tail of "nothing meaningful".** The architecture must make the long tail the *comfortable
default*, not an exception.

---

## SECTION 3 — PART 3: PREPARATION EVIDENCE MODEL

WS5A **reuses WS4B's evidence and editorial machinery wholesale** — no new evidence vocabulary is
invented. A preparation effect is just another evidenced claim flowing through the WS4B pipeline.

### 3.1 What a preparation effect record carries

```ts
// SUGGESTION — target shape, not an implementation
interface PreparationEffect {
  canonicalFoodSlug: string;        // 'tomato'
  preparationSlug: string;          // 'cooked'
  effectKind: 'nutrient' | 'attribute' | 'caution' | 'context';
  targetSlug?: string;              // 'lycopene' (the nutrient/attribute affected)
  direction: 'increases' | 'decreases' | 'changes' | 'no-meaningful-change';
  approvedWording: string;          // editorial, EFSA-checked where a claim
  evidenceStrength: 'strong' | 'moderate' | 'emerging' | 'insufficient';  // WS4B four-level
  sources: SourceRef[];             // WS4B three-tier trusted sources
  editorialStatus:                  // WS4B five-state lifecycle
    'candidate' | 'draft' | 'in_review' | 'approved' | 'published' | 'deprecated';
  reviewedAt: string;               // ISO date
  reviewExpiresAt: string;          // staleness monitoring (WS4B Section on staleness)
  uncertaintyNote?: string;         // surfaced when strength < strong
}
```

### 3.2 Mapping to the brief's question

The brief asks: *should preparations have evidence strength, source references, editorial status,
review date, uncertainty notes?* **Yes to all five** — and they are already defined by WS4B:

| Brief asks for | WS4B provides | WS5A reuse |
|---|---|---|
| evidence strength | four-level: strong / moderate / emerging / insufficient | `evidenceStrength` |
| source references | three-tier trusted source hierarchy (+ EFSA wording authority) | `sources[]` |
| editorial status | five-state lifecycle (candidate → … → published/deprecated) | `editorialStatus` |
| review date | review-expiry staleness monitoring | `reviewedAt` / `reviewExpiresAt` |
| uncertainty notes | strength-gated language guardrails | `uncertaintyNote` |

### 3.3 Worked record (the brief's example)

```
Food: tomato · Preparation: cooked
  effectKind:       nutrient
  targetSlug:       lycopene
  direction:        increases (bioavailability)
  approvedWording:  "Cooking tomatoes can increase the availability of lycopene,
                     an antioxidant compound."
  evidenceStrength: strong
  sources:          [Harvard Nutrition Source; peer-reviewed cooking-bioavailability studies]
  editorialStatus:  approved
  reviewedAt:       2026-06-20
  reviewExpiresAt:  2028-06-20
  uncertaintyNote:  (none — strength is strong)
```

### 3.4 Strength → wording gate (inherited from WS4B)

| Strength | Permitted language | Forbidden |
|---|---|---|
| `strong` | "can increase", "is higher in", "improves availability of" | "cures", "guarantees", "dramatically" |
| `moderate` | "may", "is often", "tends to" | confident causal verbs |
| `emerging` | "early research suggests", "some studies indicate" | any settled-science framing |
| `insufficient` | **No effect stated.** Renders the Section 4 default note. | any effect claim at all |

The same banned-words list as WS3B §7.2 and the uplift-rules language guard applies: *cures, prevents,
guarantees, reverses, heals, superior, miracle, clinically proven.*

---

## SECTION 4 — PART 4: WHEN NOTHING CHANGES (the honest default)

Most preparations will carry **no** evidenced effect. This is the *normal* case and must read as a
confident editorial position, never as a missing feature.

### 4.1 The wording problem

The brief's candidate wording:
> "We do not currently have trusted evidence that this preparation meaningfully changes the main
> nutrition profile."

This is good but has two weaknesses: "we do not currently have" can be read as *"THA hasn't gotten
around to it"* (a system-gap implication the brief explicitly forbids), and "trusted evidence" is
slightly clinical for a consumer surface.

### 4.2 Recommended wording (tiered by surface)

**Primary (Food Report, full):**
> **No preparation-specific note.**
> Eating this {raw / toasted / boiled} doesn't meaningfully change its core nutrition. The benefits
> below apply however you prepare it.

**Compact (inline chip / Nutrition Report):**
> *No major nutrition change from how it's prepared.*

**When evidence is genuinely emerging (not absent):**
> *Early research is exploring whether {overnight soaking} changes {glycaemic response}. There's no
> firm guidance yet, so we're not making a claim.*

The key editorial shift: lead with the **reassurance** ("the benefits apply however you prepare it"),
not the absence. This turns a non-event into a *trust-building* statement.

### 4.3 The three honest states (must be visually distinct)

| State | Meaning | Tone |
|---|---|---|
| **Effect known** | Trusted evidence of a meaningful change | Informative |
| **No meaningful change** | Evidence exists and shows it *doesn't* matter much | Reassuring |
| **Genuinely unknown** | Evidence is emerging/contested | Honest hedge |

THA must distinguish *"we know it doesn't matter"* from *"nobody knows yet."* Collapsing them into
one vague line is the single biggest trust risk in this whole area (Section 9, R3).

### 4.4 Educational opportunity

"No change" is a teaching moment: *"You don't need to seek out a special preparation to get the
benefit — that's one less thing to worry about."* This aligns with THA's calm, anti-anxiety voice and
counters wellness-culture pressure to optimise every cooking decision.

---

## SECTION 5 — PART 5: FOOD REPORT IMPLICATIONS

### 5.1 Where Preparation sits in the report

The WS2F adapter (`buildFoodReport()`) currently returns: `overview · keyNutrients · healthBenefits ·
nutritionContext · varieties`. Preparation slots in as an **additive section after Attributes/Benefits
and before Meals**, mirroring the variety pattern (full catalogue from adapter; user-scoped split at
the presentation layer).

```
Tomato
  Category            Vegetable
  Your Variety        ✓ Cherry
  Preparations you've used
                      ✓ Raw   ✓ Cooked
  Attributes          ✓ Rich in antioxidants
  Benefits            ✓ Supports heart health
  Preparation notes   Cooking may increase lycopene availability.   [evidence: strong]
  Meals               Greek salad · Tomato soup · Pasta sauce
```

### 5.2 The empty / no-evidence state

```
Bread
  Preparations you've used
                      ✓ Fresh   ✓ Toasted
  Preparation notes
                      No preparation-specific note.
                      Toasting doesn't meaningfully change bread's core nutrition —
                      the benefits above apply however you have it.
```

### 5.3 Adapter extension (suggestion)

```ts
// SUGGESTION — additive, null-safe, mirrors the WS3B qualifier proposal
interface FoodReportKnowledge {
  ...existing,
  preparations?: PreparationKnowledge[];   // omitted/empty → render nothing
}
interface PreparationKnowledge {
  slug: string;                 // 'cooked'
  label: string;                // 'Cooked'
  type: 'state'|'preservation'|'cooking'|'processing';
  userHasUsed: boolean;         // resolved from the household's ingredient strings
  effect: PreparationEffectDisplay | null;   // null → render the Section 4 default note
}
```

This is fully backward-compatible: foods with no preparation data render exactly as today (the same
null-guard discipline the adapter already uses for varieties and the PREPARATION GUARD).

### 5.4 "Preparations you've used" comes for free

Because preparation is a *second read* of the same ingredient strings the report already processes
(1.7), "Preparations you've used" is computed from existing data — no new user input, no new write
path. It uses the same household-eaten aggregation pattern as `buildEatenVarietyIndex`.

---

## SECTION 6 — PART 6: NUTRITION REPORT IMPLICATIONS

### 6.1 Is preparation diversity valuable?

**Qualified yes — but secondary to plant diversity, and never as a target.** Eating salmon four ways
is mildly interesting; it is *not* a health goal the way "30 plants a week" is. The risk is implying
that preparation variety is itself virtuous (it largely isn't — Section 9, R4).

### 6.2 Recommended treatment

Show preparation diversity as **gentle, optional context**, modelled on WS3A's "Broaden Your
Variety" but with **lower prominence** and **no scoring**:

```
Salmon
  Preparations         ✓ Fresh   ✓ Smoked
  Explore              ○ Poached   ○ Baked
                       (just ideas — variety in how you cook is nice,
                        not something to chase)
```

### 6.3 What it must NOT do

- It must **not** feed any count, score, or streak.
- It must **not** appear as a "gap" or "incomplete" indicator.
- "Broaden your preparation" wording must be softer than "Broaden your variety", because preparation
  diversity has far weaker health justification than plant diversity.

WS3A's Nutrition Report is the wrong place for anything that feels like a *new metric*. Preparation
belongs there only as a low-key curiosity, if at all. **Recommendation: defer preparation from the
Nutrition Report at launch; prove it in the Food Report first.**

---

## SECTION 7 — PART 7: HEALTHIER ALTERNATIVES IMPLICATIONS

### 7.1 Can a preparation be a healthier alternative?

Yes — preparation swaps are often the *most actionable* healthier alternative, because the food stays
the same (no new shopping, no taste leap):

```
Deep-fried potato   →  Oven-baked potato     (less added fat)
White toast         →  Wholemeal toast        (this is a Variety/food swap, NOT a preparation swap)
Smoked salmon       →  Fresh/poached salmon   (less sodium)
```

Note the middle example is a trap: *white → wholemeal* is a **food/variety swap**, not a preparation
swap. Editorial must not mislabel food swaps as preparation swaps.

### 7.2 The educational/judgemental line

This is the most delicate editorial boundary in WS5A. A preparation swap is **educational** when it:

- offers a concrete, evidenced trade-off ("baking uses less added oil than deep-frying");
- treats the current choice as *fine* and the alternative as *an option*;
- never moralises ("fried = bad");
- includes an *enjoyment* acknowledgement (some foods are eaten fried because they're a treat).

It becomes **judgemental** when it:

- implies the user's normal preparation is a failure;
- attaches guilt language ("you should", "avoid", "unhealthy");
- presents a marginal difference as if it were major (Section 9, R4).

### 7.3 Editorial rules for preparation-based alternatives

1. **Evidence first.** No swap without an evidenced effect (Section 3). "Baked vs fried" passes
   (added fat). "Grilled vs roasted chicken" fails (no meaningful difference) → no swap offered.
2. **Frame as "you could also try", never "you should switch".** Reuse WS3B's `qualifier-prefer`
   non-mandatory framing — a *preference, not a requirement.*
3. **Acknowledge the trade-off both ways.** Smoked salmon is higher in salt *and* a delicious
   convenience food. Say both.
4. **Respect the occasion.** "Sometimes deep-fried is the point" — THA does not police treats.
5. **One swap, not a ladder of shame.** Offer the single most useful alternative, not a five-rung
   purity ladder.

### 7.4 Interaction with `uplift-rules.ts`

Preparation swaps fit the existing uplift engine as a new action type alongside WS3B's proposed
`qualifier-prefer`:

```ts
// SUGGESTION — future uplift rule shape
{
  id: 'potato-bake-not-fry',
  trigger: { ingredientPattern: ['chips','fries','deep-fried potato'] },
  suggestions: [{
    preparation: 'baked',
    action: 'preparation-prefer',
    why: 'Oven-baking uses less added oil than deep-frying.',
    evidenceStrength: 'strong',
    enjoymentNote: 'Fried chips are a treat — this is just an everyday alternative.',
  }]
}
```

The mandatory `enjoymentNote` is the preparation analogue of WS3B's mandatory `budgetNote` — a
structural guard against the judgemental failure mode.

---

## SECTION 8 — PART 8: SHOPPING IMPLICATIONS

### 8.1 Should shopping be preparation-aware?

Yes — but the shopping-relevant preparations are the **format** ones (preservation/processing:
tinned, frozen, smoked, dried), because those are what you *buy*, as opposed to cooking methods,
which you *do* at home.

```
Salmon
  You usually buy     ✓ Smoked
  You could also try  ○ Fresh   ○ Tinned
  Why                 Fresh is lower in salt and versatile for cooking;
                      tinned is an affordable everyday source of the same omega-3.
```

### 8.2 Preparation format trade-off knowledge (educational, future)

Format choices have genuine, evidenced trade-offs THA can teach neutrally:

| Format | Honest trade-off |
|---|---|
| Frozen veg | Often as nutritious as fresh (frozen at peak); convenient, low waste |
| Tinned beans/fish | Affordable, long shelf life; check for added salt |
| Dried vs tinned legumes | Dried cheaper + less salt; tinned faster |
| Smoked vs fresh fish | Smoked = convenience + flavour; higher salt |

This is the *anti-snobbery* opportunity: frozen and tinned are frequently the smart, affordable,
low-waste choice, and THA should say so — countering the "fresh is always best" myth.

### 8.3 Integration approach

As with WS3B qualifiers, no new DB concept is required to start: the existing
`PANTRY_KNOWLEDGE.howToChoose` (in `client/src/lib/pantry-knowledge.ts`) already carries
format/buying guidance in prose. Structured preparation-format records make it machine-readable
later. **This is a future opportunity, not a launch requirement.**

---

## SECTION 9 — PART 9: TRUST CHECK & GUARDRAILS

### 9.1 Risk register

| Risk | Severity | Description | Guardrail |
|---|---|---|---|
| **R1: Overstating preparation effects** | HIGH | "Cooking tomatoes boosts antioxidants!" overstated into a cure-all | Strength→wording gate (3.4); banned-words list; EFSA wording check on any claim |
| **R2: Certainty where evidence is weak** | HIGH | Overnight-oats glycaemic claims stated as fact | `emerging`/`insufficient` strengths forbid confident verbs; default to "no firm note" (Section 4) |
| **R3: Conflating "no effect" with "unknown"** | HIGH | User can't tell "doesn't matter" from "THA doesn't know" | Three distinct honest states (4.3), visually differentiated |
| **R4: Exaggerating small differences** | MEDIUM | A 5% nutrient change framed as transformative | Effect records must note magnitude; "meaningfully" is the editorial bar; marginal → no surface |
| **R5: Shaming user choices** | MEDIUM | "You always fry — switch to baking" | Mandatory `enjoymentNote`; "you could also try" framing; respect-the-treat rule (7.2–7.3) |
| **R6: Identity inflation** | HIGH | "Smoked salmon" / "grilled tomato" minted as foods | Preparation NEVER creates a canonical food; PREPARATION GUARD stays; two-reads principle (1.7) |
| **R7: Preparation diversity as a pressure metric** | MEDIUM | "You've only cooked salmon 2 ways!" | No scoring/streaks/gaps for preparation (6.3); softest possible wording |
| **R8: Direct benefit attribution** | HIGH | "Smoked = heart healthy because smoked" | Benefit firewall (2.2): preparation → nutrient/attribute → benefit, never preparation → benefit |
| **R9: Composite leakage** | MEDIUM | "Granola is just prepared oats → inherits oats' health halo" | Composite exclusion (1.5 Case D, 1.6); composites are not preparations |
| **R10: Evidence staleness** | LOW | Nutrition science updates; old effect notes persist | WS4B review-expiry monitoring; mandatory `reviewedAt`/`reviewExpiresAt` |

### 9.2 The four trust questions (from the brief), answered

- *Could THA overstate preparation effects?* — Prevented by the strength→wording gate and the
  "meaningfully" editorial bar; marginal effects are not surfaced at all.
- *Imply certainty where evidence is weak?* — Prevented by `emerging`/`insufficient` strengths
  mapping to hedged or absent language.
- *Shame user choices?* — Prevented by mandatory enjoyment notes, non-mandatory framing, and the
  respect-the-treat rule.
- *Exaggerate small differences?* — Prevented by requiring magnitude in the effect record and a
  "meaningful change" threshold for any surface at all.

### 9.3 The overarching invariant

> **Preparation defaults to silence.** A preparation says nothing about nutrition until trusted
> evidence earns it the right to speak — and even then, only as much as the evidence strength permits.

---

## SECTION 10 — RELATIONSHIP TO EXISTING ARCHITECTURE

### 10.1 Position in the spine (approved direction, realised)

```
DiversityGroup
  └─ CanonicalFood                 (tomato, salmon, oats)
       ├─ FoodVariety              (cherry tomato)            — "what kind"
       ├─ [WS3B] FoodQualifier     (wild, grass-fed)          — "how sourced"
       ├─ [WS5A] FoodPreparation   (raw, cooked, smoked)      — "what's done to it"  ◀ NEW
       │     └─ PreparationEffect  (evidence-gated) ──┐
       ├─ Attributes (WS0)         (high in fibre) ◀──┘ effects modulate attributes
       └─ Benefits (WS0/WS4B)      (heart health)       — composed, never from preparation directly
```

### 10.2 How preparation interacts with existing systems

| Existing system | Preparation interaction |
|---|---|
| `commonForms` (`knowledge/foods.ts`) | **The seed.** Existing `raw/toasted/smoked/tinned/frozen` values become the initial preparation catalogue. Migration is a re-typing of data THA already authored — no new facts invented. |
| `STRIP_WORDS` (`variety.ts`) | Unchanged. `fresh/dried/frozen` still stripped for identity; preparation is a *separate* read of the same string (1.7). Keep in sync as today. |
| `buildFoodReport()` PREPARATION GUARD | Unchanged and reinforced. "Grilled tomatoes" still returns `null` as a *food*; preparation lives as metadata *on* the tomato food, never as its own report. |
| `FoodReportKnowledgeAdapter` | Additive `preparations?` section, null-safe (5.3). |
| `buildEatenVarietyIndex` pattern | Reused to compute "Preparations you've used" from existing ingredient strings (5.4). |
| `NUTRITION_CONTEXT` (`nutrition-context.ts`) | Preparation context lines can seed here initially (prose), before structured effect records exist. |
| `uplift-rules.ts` / `uplift-engine.ts` | New `action: 'preparation-prefer'` with mandatory `enjoymentNote` (7.4). |
| WS4B pipeline | Preparation effects are ordinary evidenced claims flowing through the same ingestion → review → publish path. No new pipeline. |
| WS4B Amendment B (multi-path benefits) | Fermentation-as-preparation creates the `fermented` attribute, which Amendment B already consumes as a benefit path (1.6). |

### 10.3 What WS5A deliberately does NOT change

- The identity spine (no new canonical foods from preparation).
- Plant Diversity counting (preparation is count-neutral).
- The hard wall (preparation never auto-publishes a claim).
- WS3A Nutrition Report scoring (preparation feeds no metric).

---

## SECTION 11 — RISKS (consolidated) & RECOMMENDATIONS

### 11.1 Recommendations — short-term (now, no schema change)

1. **Re-type `commonForms` mentally as the preparation catalogue.** Document that these values are
   THA's first preparation list. No code change — an editorial recognition.
2. **Author 3–5 high-confidence preparation context lines** in `NUTRITION_CONTEXT` (prose) for the
   clear cases only: cooked tomato (lycopene), smoked salmon (sodium caution). Strong evidence only.
3. **Adopt the Section 4 default wording** as the standard "no preparation note" copy across surfaces.

### 11.2 Recommendations — medium-term (next investigation, before schema)

4. **Commission WS5B — Preparation Schema & Effect Model**: define `food_preparation` and
   `preparation_effect` tables, the sub-type taxonomy (1.6), and the `effectKind`/`direction`
   vocabulary, reusing WS4B's evidence fields verbatim.
5. **Decide the cooking-method depth** per food (generic `cooked` vs explicit `boiled/fried`) — only
   split where an evidenced effect distinguishes them (1.5 Case F).
6. **Formalise composite exclusion** (granola, trail mix) so preparation migration never lets a
   composite inherit a single food's profile (1.5 Case D).

### 11.3 Recommendations — long-term (implementation, future workstreams)

7. **`food_preparation` catalogue + `preparation_effect`** as in 3.1 / 10.1.
8. **Food Report `preparations` section** (5.3), null-safe, with "Preparations you've used".
9. **`preparation-prefer` uplift action** with mandatory `enjoymentNote` (7.4).
10. **Shopping format guidance** (Section 8), starting from `PANTRY_KNOWLEDGE.howToChoose`.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`commonForms`, `STRIP_WORDS`, canonical seed, food-report adapter) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No schema changes. No UI changes. No DB changes. All concrete
build ideas are listed under SUGGESTION / Section 11.3 and require their own investigation before any
commitment.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** Migrate `commonForms` into a typed `food_preparation` catalogue (preserving values,
  adding sub-type) — the cheapest possible first build, since the data already exists.
- **SUGGESTION:** A `detectPreparation()` second-pass resolver mirroring `stripQuantityAndPrep`, so
  "frozen spinach" yields preparation `frozen` without touching identity (1.7).
- **SUGGESTION:** "Preparation Glossary" educational page (parallel to WS3B's qualifier glossary),
  explaining each preparation and THA's evidence stance, so surfaces don't repeat explanations.
- **SUGGESTION:** Shopping format-trade-off cards (frozen/tinned anti-snobbery education, Section 8.2).
- **SUGGESTION:** Profile-level preparation preference ("I don't eat fried food") to filter
  Healthier-Alternative preparation swaps.
- **SUGGESTION:** "However you prepare it" reassurance badge — a reusable component for the common
  no-effect case, turning the default state into a calm, on-brand trust signal.

---

## DEFINITION OF DONE — Investigation

| Criterion | Status |
|---|---|
| Rollback point created & reported | ✅ Section 0 (`rollback/ws5a-pre-investigation-20260620` → `8e4ef24`) |
| WS4B + all amendments protected | ✅ Section 0 (committed `8e4ef24`) |
| Preparation clearly defined | ✅ Section 1.1–1.2 |
| Distinction from Variety documented | ✅ Section 1.4 |
| Distinction from Qualifier documented | ✅ Section 1.4 |
| Distinction from Attribute documented | ✅ Section 1.4 |
| Relationship to Benefits documented | ✅ Sections 2.2, 10.1 |
| Borderline cases ruled on | ✅ Section 1.5 (Forms, smoked, sun-dried, granola, homemade, cooked/raw) |
| Preparation effects investigated | ✅ Section 2 |
| Evidence model proposed | ✅ Section 3 (reuses WS4B) |
| "When nothing changes" wording investigated | ✅ Section 4 |
| Food Report implications documented | ✅ Section 5 |
| Nutrition Report implications documented | ✅ Section 6 |
| Healthier Alternatives implications documented | ✅ Section 7 |
| Shopping implications documented | ✅ Section 8 |
| Trust model / guardrails documented | ✅ Section 9 |
| Relationship to existing architecture mapped | ✅ Section 10 |
| Risks catalogued | ✅ Sections 9.1, 11 |
| Recommendations given | ✅ Section 11 |
| No implementation / schema / UI / DB changes | ✅ Confirmed |
