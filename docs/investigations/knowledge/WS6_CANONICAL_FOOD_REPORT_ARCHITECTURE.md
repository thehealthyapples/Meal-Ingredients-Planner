# WS6 — Canonical Food Report Architecture Investigation

> **One food. One explanation. Many surfaces. No duplicate knowledge.**
>
> The Food Report becomes the single place THA explains a food — reusable by the
> Nutrition Report, Pantry, Food Search, Analyser, Broaden Your Week, Healthier
> Alternatives, and future AI explanations.
>
> Investigation only. No implementation. No schema changes. No UI changes. No DB changes.

| | |
|---|---|
| **Document type** | Investigation + target architecture (no implementation) |
| **Date** | 2026-06-20 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at investigation** | `5f44ca1` (WS5A investigation committed) |
| **Rollback tag** | `rollback/ws6-start-20260620` → commit `5f44ca1` |
| **Restore command** | `git reset --hard rollback/ws6-start-20260620` |
| **Predecessor documents** | WS0 · WS1 · WS1.5 · WS2A · WS2B · WS2C · WS2D · WS2E · WS2F · WS2G · WS3A · WS3B · WS4B (+ amendments A/B) · WS5A |

**This document changes nothing executable.** Reads existing data: YES. Writes new data: NO.
Changes meaning of existing data: NO. Requires backfill: NO.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed clean** *before work began.* The working tree carried one untracked
   file: the completed **WS5A investigation** (`WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md`,
   42,851 bytes). It existed on disk but was **not yet in git history** — i.e. unprotected.
2. ✅ **WS5A investigation protected.** To satisfy "confirm WS5A is protected", the untracked file was
   committed → **`5f44ca1`** before any WS6 work began. WS5A now lives in git history with its content,
   not merely on the working tree. (This mirrors the WS5A §0 precedent, where the unprotected WS4B
   amendment was committed to `8e4ef24` before WS5A started.)
3. ✅ **Rollback tag created for WS6:** `rollback/ws6-start-20260620` → commit `5f44ca1`
   (tree `db01aec`).
4. ✅ **Rollback identifier:** `rollback/ws6-start-20260620`
   (restore: `git reset --hard rollback/ws6-start-20260620`).

No WS6 work began until the above was confirmed and reported.

---

## EXECUTIVE SUMMARY

**The Food Report already exists — but it lives on only one surface, and three other surfaces
re-explain the same foods their own way.**

The canonical Food Report is real and shipping. The WS2F adapter
(`shared/canonical/food-report-adapter.ts`, `buildFoodReport(slug) → FoodReportKnowledge | null`)
assembles Overview, Key Nutrients, Health Benefits, Nutrition Context and Varieties from a single
authoritative seam (`canonical_food.knowledgeFoodSlug → WS0`). The WS2G component
(`client/src/components/FoodReport.tsx`) renders it. But today it is consumed by **exactly one
caller**: `PlantDiversityReport.tsx` (the WS3A Nutrition Report). Every other place THA talks about a
food has its **own** knowledge path:

| Surface | How it explains a food today | Uses the Food Report? |
|---|---|---|
| Nutrition Report | `<FoodReport>` (WS2G) in the expanded plant row | ✅ Yes |
| Pantry knowledge | `PantryKnowledgeHub.tsx` + `pantry-knowledge.ts` (WS0/prose) | ❌ No |
| Food knowledge modal | `food-knowledge-modal.tsx` (separate WS0 display) | ❌ No |
| Analyser | `server/lib/product-analysis.ts` (its own classification/context) | ❌ No |
| Healthier Alternatives | `client/src/lib/whole-food-alternatives.ts` + `server/lib/uplift-*` | ❌ No |
| Broaden Your Week | `PlantDiversityReport.BroadenYourWeek` (category gaps) | ⚠️ Partial (sibling, not consumer) |
| AI explanations | none yet | — (greenfield) |

**This is the duplication WS6 exists to end.** Four parallel "what is this food" code paths means four
places a nutrient list can drift, four places the disclaimer can be forgotten, four editorial voices.

**The recommendation.** Promote the Food Report from *a component on one page* to **THA's single canonical
food-explanation contract** — one adapter output (`FoodReportKnowledge`), one renderer family, consumed
everywhere. WS6 does **not** invent new food knowledge; it defines the **report contract** (sections,
optionality, ordering, evidence/trust rules) and the **integration pattern** (how each surface composes
the same report into its own context). The architecture is already 80% in place: the adapter is the
single source of truth, the component already omits empty sections and never fabricates, and the
preparation guard already prevents non-foods from getting a report. WS6's job is to (a) name the full
target section set — folding in WS3B Qualifiers, WS5A Preparation, and a new Healthier Alternatives and
Sources section — and (b) define how seven surfaces read from the one report without re-deriving
anything.

Three load-bearing invariants carry forward from the lineage and must hold on every surface:

1. **One knowledge seam.** All nutrients/benefits flow through `knowledgeFoodSlug → WS0`. No surface
   gets a second editorial path. (WS2F §7.)
2. **Educational, never medical.** Benefits carry `HEALTH_DISCLAIMER`; no disease claims; evidence-gated
   wording. (WS2G, WS4B, WS5A §3.4.)
3. **Empty is silent, not broken.** Sections omit when empty; non-foods return `null`. No placeholders,
   no "coming soon". (WS2F preparation guard, WS2G null discipline.)

---

## PART 1 — REPORT PURPOSE

### 1.1 What the Food Report is *for*

The Food Report answers one human question — *"Tell me about this food"* — at whatever depth the surface
allows. It is THA's **canonical explanation object** for a single canonical food. It is not a meal view,
not a product/Analyser score, and not a planner. It is the place a curious user (or a future AI) goes to
understand a single ingredient and how it fits their eating.

### 1.2 The questions it should answer

The brief's questions map cleanly onto the section set (Part 2). Each question is owned by exactly one
section so there is no overlap and no gap:

| User question | Owning section | Source of truth |
|---|---|---|
| What is this food? | Overview | WS2A canonical (name, category, description) |
| Are there different kinds? | Varieties | WS2B variety surfacing |
| What sourcing/quality choices exist? | Qualifiers | WS3B (educational, not recommendations) |
| How does preparation affect it? | Preparations | WS5A (evidence-gated; default "no note") |
| What properties does it have? | Attributes | WS0 / WS3A `benefitSummary` |
| Why is it good for me? | Benefits | WS0 `FOOD_BENEFITS` + WS4B multi-path |
| What nutrients does it contain? | Key Nutrients | WS0 `FOOD_NUTRIENTS` (max 5) |
| Any useful nutrition context? | Nutrition Context | `nutrition-context.ts` (curated) |
| Where have I used it? | Meals | the household's week (already in the Nutrition Report row) |
| What could I try instead/alongside? | Healthier Alternatives | WS5A §7 swaps / `whole-food-alternatives` |
| Where did THA learn this? | Sources | WS4B three-tier source hierarchy |

### 1.3 The questions it must **not** try to answer

- *"Should I eat this?"* — the Report informs; it never prescribes or moralises. (WS5A §7.2.)
- *"Is this product good?"* — that is the Analyser/Apple Score scoring a *product*, not a *food*. The
  Report supplies the food-level knowledge the Analyser draws on; it does not itself score.
- *"What's my plan?"* — meal planning is the Planner's job; the Report only reflects meals already eaten.

### 1.4 Design principle — *one report, read at many depths*

The same `FoodReportKnowledge` object is consumed at three depths (Part 14):
- **Glance** (a chip, a one-line summary) — Overview line + top benefit.
- **Card** (an expanded row, a modal) — the current WS2G section set.
- **Full** (a dedicated food page, an AI explanation) — every section, sources expanded.

No surface re-fetches or re-derives; it chooses a *depth*, not a *different report*.

---

## PART 2 — REPORT STRUCTURE

### 2.1 The full target section order

```
Food
 └─ Overview              ← what it is
 └─ Varieties             ← what kinds (WS2B)
 └─ Qualifiers            ← sourcing/quality choices (WS3B)         [future section]
 └─ Preparations          ← what's done to it (WS5A)               [future section]
 └─ Attributes            ← nutritional properties                 [future section]
 └─ Benefits              ← what it supports (WS0/WS4B)
 └─ Key Nutrients         ← what's in it (WS0)
 └─ Nutrition Context     ← curated educational lines
 └─ Meals                 ← where the household used it
 └─ Healthier Alternatives← educational swaps (WS5A §7)            [future section]
 └─ Sources               ← provenance/trust (WS4B)               [future section]
```

This order matches the approved spine. Sections marked `[future section]` are **not yet** in the WS2F
adapter (`FoodReportKnowledge` currently exposes `overview · keyNutrients · healthBenefits ·
nutritionContext · varieties`). WS6 names them as the target contract; their build is gated on their own
workstreams (Qualifiers → WS3B follow-on; Preparation → WS5B; Sources → WS4B publish layer).

> **Ordering note — current vs target.** The live component (WS2G) renders Key Nutrients **before**
> Health Benefits. The brief's target order puts Benefits before Key Nutrients (benefit-led, "why" before
> "what"). This is a deliberate target change (Part 8/9), not a discrepancy to silently preserve — see
> the SUGGESTION on re-ordering.

### 2.2 Should all sections be optional? — **Yes.**

Every section is optional and **self-omitting**. This is already the live discipline: `FoodReport.tsx`
wraps each section in a truthiness/length guard (`report.keyNutrients.length > 0 && …`), and the whole
component returns `null` when `buildFoodReport()` returns `null`. The target contract extends the same
rule to every future section.

### 2.3 Should sections hide automatically when empty? — **Yes, and they already do.**

| Behaviour | Rule | Already live? |
|---|---|---|
| Empty section | Omit entirely — no header, no empty card, no skeleton | ✅ (WS2G) |
| Non-food slug | Whole report returns `null` (preparation guard) | ✅ (WS2F) |
| Variety with no unique facts | Omitted from "What Each Variety Adds" via dedup | ✅ (WS2F/WS2G) |
| Preparation with no evidenced effect | Show the food, render the WS5A §4 *reassurance* line | 🔜 (WS5A target) |

**One nuance from WS5A:** the *Preparations* section is the one place where "empty" is **not** silence.
When a food has preparations but no evidenced effect, the honest, on-brand move is to render the WS5A §4
reassurance ("the benefits apply however you prepare it"), not to hide. "No data" hides; "we know it
doesn't matter" reassures. The contract must let a section distinguish *absent* from *present-but-null-effect*.

---

## PART 3 — OVERVIEW

### 3.1 Example (live shape)

```
Tomato
Category    Plant Based → Vegetables
Overview    A fruiting vegetable eaten fresh, tinned or cooked; rich in
            antioxidants and an important source of lycopene and vitamin C.
```

This is `report.overview` from the adapter: `{ name, category, description }`. The component renders
"About {name}" + the description paragraph, omitted when `description` is empty (mushroom/lentils today
have empty descriptions and correctly render no Overview paragraph).

### 3.2 Investigation findings

| Dimension | Finding / recommendation |
|---|---|
| **Summary length** | 1–2 sentences (~120–200 chars). Long enough to place the food and name its headline nutrient; short enough for a card. Glance depth uses the first clause only. |
| **Tone** | Calm, plain, second-person-neutral. THA's anti-anxiety voice. Describe, don't sell ("rich in antioxidants", not "a superfood powerhouse"). |
| **Evidence requirements** | The Overview is *descriptive*, not a *claim*. It may name well-established nutrient associations ("source of vitamin C") but must not state a health *outcome* ("prevents colds"). Health outcomes belong in Benefits, under the disclaimer. |
| **AI-generated vs editorial** | **Editorial-authored, AI-assisted at most.** The Overview is the food's "face" and is high-trust; it should be curated and reviewed (WS4B lifecycle), not free-generated at request time. A future AI may *draft* candidates (WS4B Amendment A automated growth), but publishing requires review. |
| **Category provenance** | `category` comes from WS2A and is the diversity-group path. Keep it as breadcrumb ("Plant Based → Vegetables") at full depth; truncate to leaf ("Vegetables") in tables (WS3A SUGGESTION). |

---

## PART 4 — VARIETIES

### 4.1 Example (live shape)

```
Tomato
Your Variety            ✓ Cherry   ✓ Plum
Broaden Your Variety    ○ Heirloom   ○ Yellow
What Each Variety Adds  (per-variety additional nutrients/benefits, if unique)
```

This is live. `FoodReport` splits `report.varieties` into **Your Variety** (matched against
`eatenVarietyLabels`) and **Broaden Your Variety** (the rest), and renders "What Each Variety Adds" only
for varieties whose `additionalNutrients`/`additionalBenefits` are non-empty after parent dedup.

### 4.2 Investigation findings

- **When varieties appear:** only when `report.varieties` is non-empty. Foods with no WS2A variety
  structure (spinach today) render no variety section — correct.
- **Hidden when unavailable:** yes — empty → omitted (Part 2). The Your/Broaden split also self-hides:
  with no `eatenVarietyLabels`, all varieties fall into "Broaden", and "Your Variety" is omitted.
- **Relationship to Nutrition Report:** The split is **context-injected, not baked into the report.**
  `buildFoodReport()` returns the *full* variety catalogue; the *caller* supplies
  `eatenVarietyLabels` (the Nutrition Report passes the household's eaten varieties from WS2B
  `buildRowVarietyDisplays`). This is the core reuse pattern: **the report is household-neutral; the
  surface personalises it.** Pantry/Food Search would pass no eaten labels (everything shows as "Broaden"
  / "Explore"); the Nutrition Report passes the week's eaten set.

### 4.3 The dedup guarantee (carry-forward)

Variety knowledge shows **only** facts not already covered by the parent (WS2F): a nutrient in both
parent and variety appears once, on the parent. This prevents "Lentils has Plant Protein" from ever
showing when the fact really belongs to the Red Lentil variety. Any new variety-bearing surface inherits
this for free by reading the adapter.

---

## PART 5 — QUALIFIERS

> **Qualifiers are educational, not recommendations.** (Brief + WS3B.)

### 5.1 Example (target shape — not yet in adapter)

```
Beef
Common Qualifiers   ✓ Grass fed   ✓ Lean   ○ Wagyu   ○ Organic
```

### 5.2 Investigation findings (grounded in WS3B)

- **Where qualifiers belong:** WS3B's primary homes are **Analyser** and **Pantry knowledge**, with
  **Shopping** as buying guidance and **Nutrition Report** as optional context — explicitly **not** in
  Planner recipes or as named meal ingredients. In the **Food Report**, Qualifiers sit as an *educational*
  section between Varieties and Preparations (Part 2 spine), explaining the sourcing/quality choices that
  exist for this food. The Report is the natural canonical home for the *explanation*; the Analyser and
  Shopping are where qualifiers *act*.
- **Future Shopping integration:** a qualifier can become buying guidance ("wild salmon has a different
  omega-3 profile") via WS3B's non-mandatory `qualifier-prefer` framing — *a preference, never a
  requirement*, always with a `budgetNote` (WS3B's structural anti-snobbery guard).
- **Future Analyser integration:** qualifiers carry trust/processing signals (`isProcessed`, sodium
  context) the Analyser consumes when scoring a *product*. The Report supplies the food-level qualifier
  knowledge; the Analyser applies it to a scanned item. **One knowledge source, two surfaces.**
- **The trust line:** qualifiers must read as *"these are the choices that exist and what they mean"*,
  never *"THA recommends grass-fed"*. The "Common Qualifiers" heading and the ✓/○ (used/not-used, not
  good/bad) idiom keep it descriptive. See Part 15, R2 (qualifiers-as-marketing).

*No implementation — Qualifiers are not in the WS2F `FoodReportKnowledge` shape today; this is the target
contract only.*

---

## PART 6 — PREPARATION

### 6.1 Examples (target shape — from WS5A §5)

```
Tomato
Preparations you've used   ✓ Raw   ✓ Cooked
Preparation notes          Cooking can increase lycopene availability.   [evidence: strong]
```

```
Bread
Preparations you've used   ✓ Fresh   ✓ Toasted
Preparation notes          No preparation-specific note.
                           Toasting doesn't meaningfully change bread's core nutrition —
                           the benefits above apply however you have it.
```

### 6.2 Investigation findings (grounded in WS5A)

- **Wording:** lead with **reassurance**, not absence (WS5A §4.2). The default "no note" state is a
  *trust-building* statement, not a gap. Three honest states must be visually distinct: *effect known* /
  *no meaningful change* / *genuinely unknown* (WS5A §4.3).
- **Visual design:** mirror the Variety pattern — "Preparations you've used" (✓, from the household's
  ingredient strings via the WS5A "second read") + an optional "Explore" row, **lower prominence than
  varieties** and **no scoring** (preparation diversity is not a health target — WS5A §6.3).
- **Evidence display:** every effect note carries an evidence strength (`strong/moderate/emerging/
  insufficient`) gating its language (WS5A §3.4). `insufficient` → render the reassurance default, never
  a claim.
- **"Comes for free":** "Preparations you've used" is a second read of the *same* ingredient strings the
  report already processes — no new user input, no new write path (WS5A §5.4).

### 6.3 The benefit firewall (carry-forward)

A preparation **never** authors a benefit directly. The only route is `preparation → (evidenced)
nutrient/attribute → benefit` (WS5A §2.2). "Smoked salmon is heart-healthy *because smoked*" is
forbidden. This is the preparation-specific form of WS4B's "composed, not invented" rule.

*No implementation — Preparations are not in the adapter today; WS5A §11.3 / WS5B own the build.*

---

## PART 7 — ATTRIBUTES

### 7.1 Examples

```
Olive Oil   Attributes   ✓ Healthy fats   ✓ Mediterranean staple   ✓ Minimally processed
Kefir       Attributes   ✓ Fermented   ✓ Probiotic
```

### 7.2 Investigation findings

- **Chip display:** attributes are intrinsic nutritional/character properties (WS5A §1.4 lattice) — render
  as neutral chips, distinct in colour from Benefits (which carry the disclaimer) and Key Nutrients
  (emerald). The current component uses emerald for nutrients and muted for benefits; Attributes want a
  *third* neutral tone so the three rows read as different *kinds* of fact.
- **Expandable descriptions:** each attribute can expand to a one-line plain-English gloss ("Minimally
  processed — close to its natural form, little done to it industrially"). Optional, collapsed by default
  at card depth, expanded at full depth.
- **Sorting:** sort by *evidence/centrality* not alphabetically — lead with the attribute that most
  defines the food ("Healthy fats" before "Mediterranean staple" for olive oil). A stable editorial order
  per food beats client-side sorting here.
- **Provenance gap (live):** WS3A noted "healthy-fats" today lives in a `benefitSummary` string, not a
  structured attribute. WS3A SUGGESTION already flags adding `healthy-fats` as an explicit adapter
  attribute. Attributes are the **least-formed** section in the current data model — its build is the
  natural companion to the WS0 attribute registry.

*No implementation — `attributes` is not in `FoodReportKnowledge` today.*

---

## PART 8 — BENEFITS

### 8.1 Example (live)

```
Benefits   ✓ Supports heart health   ✓ Supports gut health   ✓ Supports bone health

           Health benefits and key nutrients are educational summaries, not medical advice.
```

Live: `report.healthBenefits` rendered as muted chips, **always** followed by `HEALTH_DISCLAIMER`.

### 8.2 Investigation findings

- **Ordering:** strongest/most-central benefit first; stable editorial order per food (not alpha). With
  WS4B multi-path benefits, order by composed evidence strength.
- **Grouping:** optionally group by body system (heart / gut / bone / immune) at full depth; flat chips at
  card depth. Don't over-engineer — most foods have ≤4 benefits.
- **Evidence-strength display:** WS4B's four-level strength should be *visible but quiet* — a subtle
  weight/tooltip, never a loud "PROVEN" badge (that itself reads as a claim). At minimum, `emerging`
  benefits must be visually softer than `strong` ones.
- **Wording:** "Supports X health" — the deliberately hedged, non-causal verb. Banned words (cures,
  prevents, guarantees, reverses, heals, miracle, clinically proven) from WS3B §7.2 / WS5A §3.4 apply.
- **The invariant:** **Benefits are educational, not medical claims.** The disclaimer is non-negotiable
  and travels with the section to *every* surface (Part 15, R3). A surface that renders benefits without
  the disclaimer is a bug.

### 8.3 Relationship to Key Nutrients

Benefits answer *"why"*; Key Nutrients answer *"what's in it"*. WS4B's model is that benefits are
**composed from** nutrients/attributes via evidenced paths — so a future full-depth view could let a
benefit expand to show the nutrient(s) that justify it ("Supports heart health ← omega-3, potassium").
This is the Benefits↔Nutrients link the brief asks about in Part 9.

---

## PART 9 — KEY NUTRIENTS

### 9.1 Example (live)

```
Key Nutrients   ✓ Lycopene   ✓ Vitamin C   ✓ Folate   ✓ Potassium
```

Live: `report.keyNutrients`, **capped at 5** by the adapter, emerald chips.

### 9.2 Investigation findings

- **How many to show:** the adapter cap of **5** is the right default — the *headline* nutrients, not a
  full nutrition panel. A full-depth surface could offer "show all" but the canonical report leads with 5.
- **Expandable behaviour:** each nutrient can expand to a one-line role gloss ("Folate — supports normal
  blood and energy"). Collapsed by default. At glance depth, show none; at card depth, chips only; at full
  depth, expandable.
- **Relationship to Benefits:** the two are linked by WS4B's composed-benefit paths (§8.3). Key Nutrients
  is the *evidence base* the Benefits sit on. Showing them adjacent (nutrients → benefits, or the target
  benefits → nutrients order) lets a curious user trace *why*.

---

## PART 10 — NUTRITION CONTEXT

### 10.1 Examples (live — `nutrition-context.ts`)

```
Tomato         Cooking and processing increase lycopene availability.
Spinach        Pairing spinach with a source of vitamin C can support iron absorption.
Olive Oil      Extra virgin olive oil is associated with Mediterranean-style eating patterns.
```

Live: `report.nutritionContext` — curated lines for 10 proving-set foods, rendered as a bullet list.

### 10.2 Investigation findings

- **Tone:** practical, additive, never alarmist. These are *"useful to know"* lines, not warnings. They
  are the warm, human layer between dry nutrient lists and benefit claims.
- **Evidence requirements:** "short · evidence-based · educational · no disease claims · sourced from
  established nutritional understanding" (WS2F §3). This is the same bar as Benefits but expressed as
  *context* rather than *claim*. A context line that asserts a health outcome must be demoted to a Benefit
  (under the disclaimer) or dropped.
- **Source visibility:** today context lines are unsourced prose. Target: each line gains a WS4B source
  ref so the **Sources** section (Part 13) can aggregate provenance. WS2D Stage S2 already anticipates
  migrating `NUTRITION_CONTEXT` into a structured `knowledge_context` table with sources.
- **Overlap risk with Preparation notes:** some context lines ("cooking increases lycopene") will
  *become* preparation effects (WS5A). The rule: a fact that is *about a specific preparation* belongs in
  Preparations; a general food fact stays in Nutrition Context. Avoid showing the same lycopene line in
  both sections (Part 15 dedup concern).

---

## PART 11 — MEALS

### 11.1 Example

```
Meals
Monday     • Greek salad
Thursday   • Tomato soup
Saturday   • Pasta sauce
```

### 11.2 Investigation findings

This section is **household evidence, not canonical knowledge** — it is the one section sourced from the
user's week, not the adapter. The Nutrition Report already computes it (`dayMealMap: Map<day, string[]>`
in `PlantDiversityReport`, deduped and week-ordered). It must therefore be **caller-supplied**, exactly
like `eatenVarietyLabels` — the canonical report stays household-neutral.

| Grouping | When it fits |
|---|---|
| **By day** (live) | The Nutrition Report's week context — "where did this show up this week" |
| **By meal/recipe** | Pantry/Food Search context — "which of my saved meals use this" |
| **By recency** | A food page — "last eaten Thursday" |

- **Sorting options:** week order (Mon→Sun) is the live default for the day view. For a meal/recipe view,
  recency or frequency. The grouping is a **caller choice**, driven by surface context, over the same
  underlying "where used" data.
- **Empty state:** on Pantry/Food Search a food may have *no* meals yet — omit the section (a food you've
  never cooked simply shows no Meals), or, at full depth, invite ("not used yet — Broaden Your Week has
  ideas") linking to Part 12 without pressure.

---

## PART 12 — HEALTHIER ALTERNATIVES

### 12.1 Example (target)

```
White Bread
You could also try:   ✓ Wholemeal bread   ✓ Rye bread   ✓ Sourdough
Why?                  More fibre · Less refined · Different flavour profile
```

### 12.2 Investigation findings (grounded in WS5A §7 + live `whole-food-alternatives.ts`/`uplift-*`)

- **Educational wording:** "You could also try", never "you should switch" (WS5A §7.3). Frame the current
  choice as *fine* and the alternative as *an option*. The mandatory `enjoymentNote`/`budgetNote` guards
  (WS5A §7.4 / WS3B) prevent the judgemental failure mode.
- **Avoiding judgement:** never moralise ("white = bad"); acknowledge trade-offs both ways; respect the
  treat/occasion; offer **one** useful swap, not "a ladder of shame" (WS5A §7.3 rule 5).
- **Relationship to Qualifiers:** a qualifier swap (standard → grass-fed) and an alternative are the same
  *non-mandatory preference* mechanism — both reuse WS3B's `qualifier-prefer` framing. Healthier
  Alternatives is the *cross-food* swap (white bread → wholemeal); a qualifier is a *same-food* choice.
- **Relationship to Preparation:** a preparation swap (deep-fried → oven-baked) is often the *most
  actionable* alternative because the food stays the same (WS5A §7.1). **Trap to avoid:** white→wholemeal
  is a *food/variety* swap, not a preparation swap — editorial must not mislabel them (WS5A §7.1).
- **Live duplication to unify:** two systems exist today — `client/src/lib/whole-food-alternatives.ts`
  (client, whole-food swaps) and `server/lib/uplift-*` (server uplift engine). Neither reads the Food
  Report. WS6's target: alternatives become a **report section** sourced through the same evidenced-swap
  contract, so the *reason* ("more fibre") is the same fact the target food's own Key Nutrients/Benefits
  already assert — no third place to state "wholemeal has more fibre".

*No implementation — `healthierAlternatives` is not in `FoodReportKnowledge` today (WS2G §"Not
implemented" already flags it as a future suggestion).*

---

## PART 13 — SOURCES

### 13.1 Example (target)

```
Sources   NHS · Harvard · USDA · British Heart Foundation
```

### 13.2 Investigation findings

- **Should Food Reports show sources? — Yes, but collapsed by default.** Provenance is a powerful trust
  signal *and* a clutter risk. The right pattern is a **collapsed "Sources" affordance** at the foot of
  the report that expands to the aggregated source list. This satisfies transparency without burying the
  knowledge under citations (Part 15, R1 — sources overwhelming users).
- **Collapsed vs expanded:** collapsed at glance/card depth (a small "Sources (4)" link); expandable; fully
  expanded only on a dedicated food page or when a user opts in. The *count* visible while collapsed
  already signals "this is sourced".
- **User-trust implications:** named institutional sources (NHS, Harvard, USDA, BHF) raise perceived
  authority — which is exactly why WS4B gates them behind a three-tier hierarchy and EFSA wording checks.
  A source must genuinely back the claim it's attached to; decorative citations erode trust faster than
  none.
- **Evidence transparency:** sources should attach to *claims*, not to the food in the abstract. The
  Sources section is an **aggregation** of the per-claim sources already carried by Benefits, Nutrition
  Context, and Preparation effects (WS4B). It is a *roll-up*, not a new editorial input — which keeps the
  one-knowledge-seam invariant intact.

*No implementation — sources are not surfaced today; WS4B's publish layer owns the per-claim source data
that this section would aggregate.*

---

## PART 14 — INTEGRATION

> **One food report. Many surfaces. No duplicate knowledge.**

### 14.1 The integration contract

Every surface consumes the **same** two-call contract and never re-derives food knowledge:

```
buildFoodReport(canonicalSlug) → FoodReportKnowledge | null   // household-neutral canonical knowledge
   + surface-supplied context  → { eatenVarietyLabels?, eatenPreparations?, meals?, depth }
   ─────────────────────────────────────────────────────────────────────────────────────
   = the same report, personalised and rendered at the surface's chosen depth
```

The split already proven in WS2G/WS3A — **report is canonical; surface injects personalisation** — is the
whole integration model. `eatenVarietyLabels` today; `eatenPreparations`, `meals`, and `depth`
tomorrow.

### 14.2 How each surface composes the report

| Surface | Reads | Injects (context) | Depth | Current state → target |
|---|---|---|---|---|
| **Nutrition Report** | full report | eaten varieties, week meals | Card | ✅ Already the reference implementation |
| **Pantry** | full report | none (or "in your pantry") | Card/Full | 🔧 `PantryKnowledgeHub`/`food-knowledge-modal` to consume `buildFoodReport` instead of their own WS0 display |
| **Food Search** | overview + benefits | none | Glance/Card | 🔧 Search result expands to a FoodReport card |
| **Analyser** | attributes, qualifiers, key nutrients | scanned product | (informs score) | 🔧 `product-analysis.ts` reads report food-knowledge instead of re-classifying |
| **Broaden Your Week** | overview + benefits of the *suggested* food | week's category gaps | Glance | 🔧 Suggestion cards show *why* via the report, not bespoke copy |
| **Healthier Alternatives** | the alternative's overview/benefits as the "why" | current food | Glance | 🔧 `whole-food-alternatives`/`uplift` reasons sourced from the target food's report |
| **AI explanations** | full report as grounding | user question | Full | 🆕 Greenfield — the report is the retrieval object the model explains from |

### 14.3 Why this kills duplication

Today four code paths each answer "what is this food". After WS6 there is **one** (`FoodReportKnowledge`)
and N *thin* presenters. A nutrient added to WS0 appears everywhere at once; the disclaimer is attached in
one renderer family; the editorial voice is singular. The adapter is **already** the single source of
truth — WS6's integration work is *deleting the other three knowledge paths and pointing them at the
adapter*, not building new ones.

### 14.4 The AI-explanation angle

A future AI explanation should be **grounded in `FoodReportKnowledge`, not free-generated.** The report is
the retrieval object: the model is handed the canonical sections (with sources) and asked to *explain/
rephrase for this user*, never to invent facts. This makes the AI inherit every guardrail (disclaimer,
banned words, evidence gating) for free, because it can only speak from what the report already asserts.
WS4B Amendment A (automated candidate growth) is the *inverse* path — AI *proposing* knowledge into the
review pipeline; both directions keep the human-reviewed seam authoritative.

---

## PART 15 — TRUST CHECK

### 15.1 The four brief questions, answered

| Risk (brief) | Could it happen? | Guardrail |
|---|---|---|
| **R1 — Sources overwhelm users** | Yes, if every claim shows citations inline | Collapsed Sources roll-up (Part 13); count-only while collapsed; expand on opt-in |
| **R2 — Qualifiers become marketing** | Yes, if framed as recommendations | Educational-only framing; ✓/○ = used/not-used (not good/bad); "Common Qualifiers" heading; no "THA recommends" (WS3B) |
| **R3 — Benefits become medical claims** | Yes, the highest-stakes risk | `HEALTH_DISCLAIMER` travels with the section to **every** surface; banned-words list; "Supports X" non-causal verb; evidence-strength gating (WS4B) |
| **R4 — Preparation effects overstated** | Yes | Strength→wording gate; "meaningfully" editorial bar; marginal effects not surfaced; default to reassurance (WS5A §3.4, §9) |

### 15.2 WS6-specific trust risks (from reuse)

| Risk | Severity | Description | Guardrail |
|---|---|---|---|
| **T1 — Disclaimer drops on a new surface** | HIGH | A surface renders `healthBenefits` without `HEALTH_DISCLAIMER` | Disclaimer belongs to the *benefits renderer*, not the page; one shared component carries it. A benefits chip-set without the disclaimer is a lint-able bug. |
| **T2 — Knowledge re-derivation creeps back** | HIGH | A surface "enriches" the report with its own extra facts | Single-seam invariant: surfaces may *filter/order/depth*, never *add* knowledge. Context (eaten/meals) is personalisation, not knowledge. |
| **T3 — Section duplication across reused parts** | MEDIUM | "Cooking increases lycopene" shows in both Nutrition Context and Preparation notes | Ownership rule (Part 10.2): preparation-specific facts live in Preparations; general facts in Context. Dedup at the adapter, once. |
| **T4 — Personalisation leaks into the canonical cache** | MEDIUM | `eatenVarietyLabels` baked into a memoised report shared across users | `buildFoodReport(slug)` is pure/household-neutral and memoised by slug only (live: `useMemo([canonicalSlug])`); personalisation applied *after*, per-render. |
| **T5 — Non-foods get a report on a new surface** | MEDIUM | Analyser/Search passes "mixed beans"/"grilled tomatoes" | Preparation guard is structural in `buildFoodReport` (returns `null`); every surface inherits it by reading the adapter, not bypassing it. |
| **T6 — Sources decorate rather than back claims** | MEDIUM | A food shows "Harvard, NHS" unrelated to its actual claims | Sources are a roll-up of *per-claim* WS4B sources, never a hand-typed badge (Part 13.2). |

### 15.3 The overarching invariant

> **The report is the only mouth.** No surface speaks about a food except by reading the canonical Food
> Report. Surfaces choose *depth* and inject *personalisation*; they never add, override, or re-author a
> single fact. Trust is enforced once, in the report, and inherited everywhere.

---

## RELATIONSHIP TO PREVIOUS WORKSTREAMS (WS0–WS5)

| Workstream | What WS6 inherits / how the Report uses it |
|---|---|
| **WS0** | The knowledge registry (`FOOD_NUTRIENTS`, `FOOD_BENEFITS`, `FOOD_SEED`) — the single seam every report nutrient/benefit flows through. |
| **WS1 / WS1.5** | Pantry Explore + the Alias/Variety/Form/Composite classification rules that decide what *is* a food vs a variety vs a form — the report's input taxonomy. |
| **WS2A** | Canonical identity (name, category, description, `knowledgeFoodSlug`) — the Overview + the resolution key (`canonicalSlug`) every surface passes. |
| **WS2B** | Variety surfacing + the eaten/uneaten split pattern — the Varieties section and the "report-neutral, surface-personalises" model (`eatenVarietyLabels`). |
| **WS2C/WS2D** | Food-report enrichment + the canonical nutrition-knowledge architecture (Stage S2 `knowledge_context`) — the structure the report's sections target. |
| **WS2E** | Slug reconciliation — the integrity guarantee that one canonical slug means one food across surfaces (no drift). |
| **WS2F** | **The adapter itself** — `buildFoodReport()`, `FoodReportKnowledge`, the preparation guard, the dedup guarantee, `nutrition-context.ts`. WS6's foundation. |
| **WS2G** | **The component itself** — `FoodReport.tsx`, the empty-section-omission and null-return discipline, the disclaimer placement. WS6's renderer. |
| **WS3A** | The Nutrition Report — the *first and only current consumer*; the reference integration (eaten varieties + day→meal map). |
| **WS3B** | Qualifiers architecture — the Qualifiers section (Part 5), the `qualifier-prefer` non-mandatory framing, the banned-words list, the Analyser/Shopping homes. |
| **WS4B** | The nutrition-knowledge pipeline — evidence strength, three-tier sources, five-state editorial lifecycle, multi-path benefits, automated candidate growth. The Report's Sources section and all evidence gating. |
| **WS5A** | Preparation architecture — the Preparations section (Part 6), the benefit firewall, the "no meaningful change" reassurance default, preparation-based Healthier Alternatives. |

---

## RECOMMENDATIONS

### Short-term (now, no schema/UI change)

1. **Adopt this document as the canonical Food Report contract.** Name the full section set (Part 2) as
   the target so future workstreams build *into* one report rather than alongside it.
2. **Audit the three parallel knowledge paths** (`PantryKnowledgeHub`/`food-knowledge-modal`,
   `product-analysis.ts`, `whole-food-alternatives`/`uplift`) and document, per surface, what knowledge
   they duplicate that the adapter already provides. (Investigation/audit only.)
3. **Extract the disclaimer + benefits chip-set into one shared renderer** (where they aren't already) so
   T1 (dropped disclaimer) is structurally impossible on new surfaces. (A small, low-risk refactor — its
   own ticket.)

### Medium-term (before broad reuse)

4. **Define the surface-context contract** (`{ eatenVarietyLabels?, eatenPreparations?, meals?, depth }`)
   as the single way surfaces personalise, so personalisation never becomes knowledge re-derivation (T2).
5. **Migrate Pantry's `food-knowledge-modal`/`PantryKnowledgeHub` to consume `buildFoodReport`** as the
   first reuse beyond the Nutrition Report — the highest-value, lowest-risk second consumer (WS2G already
   flagged this). Prove the multi-surface pattern once.
6. **Decide the Benefits-before-Nutrients ordering** (Part 2.1) — the target order differs from the live
   component; settle it as an editorial decision before more surfaces copy the current order.

### Long-term (implementation, future workstreams)

7. **Extend `FoodReportKnowledge`** with the `[future section]` sections — Qualifiers (WS3B follow-on),
   Preparations (WS5B), Attributes (WS0 attribute registry), Healthier Alternatives, Sources (WS4B
   publish) — each null-safe and self-omitting, gated on its own workstream.
8. **Build the depth-aware renderer family** (Glance / Card / Full) so one report serves a chip, a modal,
   and a dedicated food page.
9. **Ground AI food explanations in `FoodReportKnowledge`** (Part 14.4) — retrieval object, not free
   generation — so the AI inherits every guardrail.
10. **Aggregate per-claim sources into the collapsed Sources section** once WS4B's publish layer carries
    source refs on Benefits, Context, and Preparation effects.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (WS2A canonical seed, WS0 knowledge seed, `food-report-adapter.ts`, `nutrition-context.ts`, WS2B variety surfacing) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** |
| Schema changes | **NO** |
| UI changes | **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No schema changes. No UI changes. No DB changes. All concrete
build ideas are listed under SUGGESTION / Recommendations (long-term) and require their own investigation
and approval before any commitment.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** A `FoodReportContext` type (`{ eatenVarietyLabels?, eatenPreparations?, meals?, depth }`)
  as the single, typed personalisation channel — so the household-neutral/surface-personalised split is
  enforced by the type system, not convention.
- **SUGGESTION:** Depth-aware rendering (`FoodReportGlance` / `FoodReportCard` / `FoodReportPage`) over one
  `FoodReportKnowledge`, so a chip, a modal, and a food page share one knowledge object.
- **SUGGESTION:** A standing "single-seam" CI guard that fails if a surface imports food knowledge from
  anywhere except the adapter (prevents T2 re-derivation regressing).
- **SUGGESTION:** A dedicated `/food/:slug` Food Report page as the canonical "full depth" home and the
  link target for every glance/card surface.
- **SUGGESTION:** A `BenefitsWithDisclaimer` shared component so the disclaimer can never be dropped on a
  new surface (T1).
- **SUGGESTION:** Ground a future "Ask THA about this food" AI affordance in `FoodReportKnowledge` +
  sources, returning explanations strictly within the report's asserted facts.
- **SUGGESTION:** A per-claim → roll-up Sources aggregator so the Sources section is always derived, never
  hand-authored.

---

## DEFINITION OF DONE — Investigation

| Criterion | Status |
|---|---|
| Rollback point created & reported | ✅ Section 0 (`rollback/ws6-start-20260620` → `5f44ca1`) |
| Git status confirmed clean before work | ✅ Section 0 |
| WS5A investigation protected | ✅ Section 0 (committed `5f44ca1`) |
| Food Report purpose defined | ✅ Part 1 |
| Report sections defined | ✅ Part 2 |
| All sections optional / self-omitting investigated | ✅ Part 2.2–2.3 |
| Overview investigated (length/tone/evidence/AI) | ✅ Part 3 |
| Varieties investigated | ✅ Part 4 |
| Qualifiers investigated (educational, Shopping/Analyser) | ✅ Part 5 |
| Preparation investigated (wording/visual/evidence) | ✅ Part 6 |
| Attributes investigated | ✅ Part 7 |
| Benefits investigated (ordering/grouping/evidence/wording) | ✅ Part 8 |
| Key Nutrients investigated | ✅ Part 9 |
| Nutrition Context investigated | ✅ Part 10 |
| Meals investigated (grouping/sorting) | ✅ Part 11 |
| Healthier Alternatives investigated | ✅ Part 12 |
| Sources investigated (collapsed/trust/transparency) | ✅ Part 13 |
| Integration mapped (7 surfaces) | ✅ Part 14 |
| Trust model / guardrails documented | ✅ Part 15 |
| Relationships to WS0–WS5 documented | ✅ Relationship section |
| Examples included | ✅ Throughout (Parts 3–13) |
| Future extensibility documented | ✅ Recommendations + SUGGESTION |
| No implementation / schema / UI / DB changes | ✅ Confirmed (Data Impact + Scope Lock) |

---

**File location:** `docs/investigations/knowledge/WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md`
**Rollback identifier:** `rollback/ws6-start-20260620` → commit `5f44ca1`
(`git reset --hard rollback/ws6-start-20260620`)
