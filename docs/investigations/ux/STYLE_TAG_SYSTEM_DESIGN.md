# Style Tag System — Canonical Design Investigation

**Date:** 2026-06-14
**Branch:** `main` @ `39de349`
**Rollback tag:** `rollback/pre-style-tag-investigation-20260614` → annotated tag object `fc56253`, points to commit **`39de349`**
**Restore command:** `git reset --hard rollback/pre-style-tag-investigation-20260614`
**Scope:** Investigation only. **No** code, schema, migration, shell seeding, or planner changes.
**Method:** Read-only schema audit (`shared/schema.ts:48-121`), read-only review of the two prior
investigations (`FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md`,
`HYBRID_MEAL_OCCASION_MODEL_IMPLEMENTATION_SCOPE.md`), and a read of the planner enforcement
surface (`server/lib/smart-suggest-service.ts`).

> **Pre-work confirmation:** at investigation start the tracked working tree was clean (only
> untracked investigation docs + read-only `server/scripts/sim-*.ts` / `query-*.ts` present). The
> rollback tag was created **before** any work. The only file written by this investigation is this
> document.

> ⚠️ **Terminology (carried from the prior docs):** "slot" unqualified means **meal-occasion**
> (breakfast / lunch / dinner / snack). The existing `proteinSlots` / `carbSlots` / `vegSlots` /
> `toppingSlots` / `sauceSlots` columns are **component slots** (the shared-meal base + swappable
> parts architecture), **not** occasion slots.

---

## TL;DR — Final Verdict: **STATUS A**

> **Style Tags are an optional, non-gating discovery/browsing layer. Ship them as a metadata-only
> facet now; defer planner involvement to a separate, explicitly-approved future phase.**

The Hybrid Meal Occasion model (prior docs) already assigns Style Tags their correct architectural
role: **advisory, never gating**. This investigation confirms that and pins it down concretely:

1. **Multi-tag arrays are trivially supported** — `text[]` is already the repo's idiom
   (`compatibleDiets`, `dietTypes`, the 5 component-slot arrays). Q1 = yes, technically simple.
2. **A small canonical vocabulary (20 tags, 4 categories)** is enough to cover every example in the
   brief and the §8 catalogue, while staying curatable.
3. **Roughly half the vocabulary can be system-derived** with usable confidence from fields that
   already exist; the **subjective half must be curated** and must *never* be auto-generated.
4. **Energy Band already owns Light / Medium / Hearty** — those must **not** be Style Tags (Q2
   answer: keep them out of the tag vocabulary to avoid a second, conflicting energy axis).
5. **Planner involvement (Status B/C) is deferrable at zero cost** because tags are additive and
   non-gating — but it carries real product risk (filter starvation), so it should be its own
   approved phase, not bundled into the first landing.

Why **A**, not B or C: the brief's stated *initial* intents are all discovery (browsing,
collections, inspiration). Status B ("planner preferences") and C ("planner filters") are valuable
later but introduce eligibility/scoring risk that contradicts the explicit design constraint that
Style Tags must not affect eligibility or scoring. Ship the safe, reversible discovery layer first;
graduate to preferences (soft, opt-in, ranking-only — **never** a hard filter) only after the tag
data is populated and trusted. See **Final Verdict** for the full A-vs-B-vs-C-vs-D reasoning.

---

## Q1 — Can meals & shell templates support `styleTags: string[]` with multiple tags?

**Yes — technically trivial. This is the single lowest-risk field in the whole Hybrid model.**

### Evidence from the live schema

`text[]` (Postgres text array) is already the dominant idiom in exactly the two target tables:

| Table | Existing `text[]` columns (proof the pattern is established) |
|---|---|
| `meal_templates` (`schema.ts:48-72`) | `sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `toppingSlots`, `sauceSlots`, `compatibleDiets` — **7 array columns already** |
| `meals` (`schema.ts:88-121`) | `ingredients`, `instructions`, `dietTypes` (note `dietTypes` even has `.notNull().default([])`) |

Adding `styleTags text[]` is the **same shape** as `compatibleDiets[]` — a multi-value, nullable
(or `default {}`) array. No new column *type*, no join table, no enum table required for v1.

### Migration cost

- Mechanism is `drizzle-kit push` (per `HYBRID_…_SCOPE.md §2`): add the column to the table
  definition + push. Additive, nullable/empty-default → the safest class of push, zero backfill
  required for correctness.
- Zod: add `styleTags: true` to the `.pick({})` in `insertMealTemplateSchema` (`schema.ts:805-827`)
  and (if added to meals) `insertMealSchema`. `MealTemplate` / `Meal` types auto-derive.

### Multi-tag examples from the brief — all expressible as-is

```
Cooked Breakfast  styleTags = [shared-meal, family, brunch, adaptable]
Curry Night       styleTags = [shared-meal, one-pot, family, comfort]
Pizza Night       styleTags = [shared-meal, family, adaptable, comfort, make-ahead]
```

All three are just string arrays. **Multi-tag arrays are technically simple — confirmed.**

> **Storage recommendation (v1):** store tags as **lower-case kebab-case slugs**
> (`shared-meal`, `one-pot`, `make-ahead`) and render display labels in the UI from a single
> lookup map. This avoids the casing rot already documented on `category` (`dinner` 297 vs `Dinner`
> 26 in the prior audit) and keeps tag-equality checks trivial. A controlled vocabulary constant
> (one source-of-truth array) is the v1 enforcement; a DB enum/lookup table is a possible later
> hardening but is **not** required for the discovery feature.

---

## Q2 — Style Tag Categories

**Recommendation: yes, group tags into 4 categories — but the grouping is purely a UI/curation
organising device, NOT a data constraint.** Tags remain a flat `string[]`; the category is a
property of *each tag in the canonical vocabulary*, not a second column on the meal. (i.e. the tag
`brunch` "is an" Occasion tag — that mapping lives in the vocabulary definition, §7, not on the
row.)

The four proposed groups all make sense and map cleanly onto the brief:

| Category | Purpose | Tags (canonical subset — see §7) |
|---|---|---|
| **OCCASION** | *When / what social context* | brunch, lunchbox, party, picnic, bbq, celebration, date-night |
| **COOKING STYLE** | *How it's made / logistics* | quick, one-pot, make-ahead, batch-cook, freezer-friendly, slow-cook |
| **HOUSEHOLD STYLE** | *How the household eats it* | shared-meal, family, adaptable, buffet, bar |
| **EATING EXPERIENCE** | *Mood / feel* | comfort, fresh, indulgent |

These are good categories because they map to **distinct derivation strategies**, which is the most
useful cut:

- **COOKING STYLE** + **HOUSEHOLD STYLE** are largely **structural/objective** → system-derivable.
- **OCCASION** + **EATING EXPERIENCE** are largely **subjective/contextual** → curated.

That alignment (category ⇒ derivation strategy) is the single most valuable reason to keep the
categories.

### Should Energy Band already cover Light / Medium / Hearty — instead of Style Tags?

**Yes — emphatically. Light / Medium / Hearty must be the `energyBand` field, NOT Style Tags.**

The prior investigation (`FLEXIBLE_…_SUITABILITY.md §5`, `HYBRID_…_SCOPE.md §1b`) already defines
`energyBand` as a dedicated advisory field with values **Light / Medium / Hearty**. Reasons to keep
energy strictly out of the tag vocabulary:

1. **No duplicate axes.** A meal has exactly one energy level; that is an ordinal scalar, not a
   free multi-tag. Modelling it as a tag would let a meal be tagged both `light` and `hearty`
   (incoherent) and would fork "what's the energy of this meal?" across two fields.
2. **Different consumer.** `energyBand` is intended to inform **day-shape balancing / ranking**
   (hearty breakfast → light dinner). Style Tags are intended for **discovery/browse**. Keeping
   them separate keeps each consumer reading one authoritative field.
3. **Different derivation.** `energyBand` derives from calories/portion; Style Tags derive from
   structure/keywords/curation. Conflating them muddies both derivation pipelines.

**Conclusion:** the EATING EXPERIENCE category is about *mood* (comfort / fresh / indulgent), which
is orthogonal to *quantity* (energy band). Keep `comfort/fresh/indulgent` as tags; keep
`light/medium/hearty` as `energyBand`. Do **not** add light/medium/hearty to the tag list.

---

## Q3 — System-Derived Tags

A tag is "system-derivable" only if the signal **already exists in the schema** at usable
reliability. The critical schema asymmetry (verified `schema.ts:48-121`) constrains this heavily:

| Signal | `meal_templates` | `meals` |
|---|---|---|
| prep time | `estimatedTotalTime` (int, sparse) | **absent** |
| servings | **absent** | `servings` (int, `default 1`) |
| component slots | `protein/carb/veg/topping/sauceSlots[]` (only **1 of 650** populated) | **absent** (uses `mealTemplateId` FK) |
| diet flexibility | `compatibleDiets[]` | `dietTypes[]` |
| freezer | **absent** | `isFreezerEligible` (bool, `default true`) |
| calories | `defaultCalories` (sparse) | `nutrition.calories` (text, sparse) |

So derivation logic differs by table, and several "obvious" derivations are **blocked by missing or
low-quality data today**. Honest assessment per tag:

| Tag | Derivation logic | Source field(s) | Confidence | Editable? | Caveats |
|---|---|---|---|---|---|
| **quick** | `estimatedTotalTime < 20` (template); meals have **no** prep field → not derivable on meals | `meal_templates.estimatedTotalTime` | **Medium** (templates only) | ✅ yes | Sparse on templates; **undeducible on `meals`** — would be null there, not false |
| **shared-meal** | template has ≥1 non-empty component-slot array | `proteinSlots`/`carbSlots`/… | **High** (when slots populated) | ✅ yes | **Only 1/650 templates** has slots today — accurate but near-empty until shells are seeded |
| **family** | `servings >= 3` | `meals.servings` | **High** (meals only) | ✅ yes | Templates have **no** servings field → not derivable on templates |
| **adaptable** | `compatibleDiets.length >= 2` (template) / `dietTypes.length >= 2` (meal) | `compatibleDiets[]` / `dietTypes[]` | **Medium-High** | ✅ yes | "≥2 diets" is a proxy for adaptability, not a guarantee of swap mechanics |
| **freezer-friendly** | `meals.isFreezerEligible === true` | `meals.isFreezerEligible` | **LOW** | ✅ yes | Column **defaults to `true`** → derives "freezer-friendly" for nearly everything → near-useless as a discriminator until the default is curated. **Recommend NOT auto-deriving in v1.** |
| **make-ahead** | freezer/batch indicators | `isFreezerEligible` (+ future batch flag) | **LOW** | ✅ yes | Same `default true` problem; "make-ahead" also implies *prep-ahead*, a concept not modelled. Treat as **curated** for now. |
| **batch-cook** | high servings + freezer eligible | `servings` + `isFreezerEligible` | **LOW-Medium** | ✅ yes | Plausible (`servings>=4 && isFreezerEligible`) but the freezer default poisons it; meals-only |
| **one-pot** | single pan/pot detected | — **no field exists** | **Very Low** | ✅ yes | Would require NLP over `instructions`/`name`. **Not reliably derivable today → treat as curated/seed-time.** |

### Derivation rules of engagement

- **Derived ≠ locked.** Every derived tag must be **overridable by a curator** (and the override
  must win). The recommended model: a derived tag is a *default suggestion* written at
  seed/import time, then editable; the row stores the final array, not a live formula.
- **Derive at write-time, not read-time.** Don't compute tags in the planner/query hot path; bake
  them into `styleTags[]` when a template/meal is created or seeded, so reads are a plain array.
- **Null vs false.** Where a signal is absent (e.g. `quick` on `meals`, `family` on templates), the
  tag is simply **not added** — never asserted false. Absence of a tag means "unknown", not "no".
- **Confidence gate.** Only auto-apply tags rated **Medium or higher** in v1: realistically that is
  **`shared-meal`, `family`, `adaptable`, and `quick` (templates only)**. Everything LOW
  (`freezer-friendly`, `make-ahead`, `batch-cook`, `one-pot`) should be **curated** in v1 until the
  underlying data quality improves (notably: fix the `isFreezerEligible` default, add a batch flag,
  add prep time to meals).

---

## Q4 — Curated Tags (must NEVER be auto-generated)

A tag must be curated when its meaning is **subjective, contextual, or brand-voiced** — i.e. no
schema field can faithfully decide it, and a wrong auto-guess actively damages trust/UX.

| Tag | Category | Why it must be curated (never derived) |
|---|---|---|
| **comfort** | Eating Experience | Pure subjective/cultural ("comfort food" varies by person & culture). No field encodes "feels comforting". Auto-guessing from cuisine/calories would be wrong and brand-damaging. |
| **fresh** | Eating Experience | Subjective; "fresh" ≠ low-calorie ≠ salad. Ingredient heuristics (raw veg) are noisy and miss the intent. |
| **indulgent** | Eating Experience | Subjective and **value-laden** — auto-labelling a user's saved meal "indulgent" reads as judgemental. Must be an editorial/curatorial choice, never a calorie threshold. |
| **party** | Occasion | Context of *use*, not a property of the dish. The same nachos are "party" or "Tuesday dinner" depending on intent. |
| **celebration** | Occasion | Cultural/contextual occasion. Nothing in the schema knows it's a celebration. |
| **date-night** | Occasion | Pure context/mood; unrelated to any structural field. |
| **brunch** | Occasion | *Partially* anchored (breakfast-capable + leisurely) but the "brunch" framing is editorial. Could be **seed-suggested** for breakfast/lunch-spanning shells, but final say is curatorial — never silently auto-applied to every B/L item. |
| **picnic / bbq / buffet / bar** | Occasion / Household | Format-of-serving context; not encoded structurally. (`bar`/`buffet` *could* later be seed-defaults for component-slot "build-your-own" shells, but that's seed-curation, not runtime derivation.) |

**Principle:** *If a wrong tag would embarrass the brand or mislead the user, it must be curated.*
Discovery tags are a **promise about vibe/intent**; the system can measure structure (slots,
servings, time) but cannot measure vibe. So structure → derivable; vibe/occasion → curated.

> **Grey-zone tags** (`brunch`, `bar`, `buffet`, `make-ahead`): derivation is *possible but
> unreliable*. Treat these as **"seed-suggested, human-confirmed"** — the seed catalogue (§8) may
> propose them, a curator confirms, and the planner never generates them at runtime.

---

## Q5 — Planner Interaction (evaluate A / B / C risks)

The hard design constraint (from the brief and both prior docs): **Style Tags must not affect
dietary restrictions, planner eligibility, hard exclusions, or scoring.** Evaluate the three
options against that constraint and the planner architecture (single enforcement point —
`SLOT_CATEGORY_MAPPING` + `getCandidateSlotFit`, `smart-suggest-service.ts:250/325`).

### A — Discovery only (browse / collections / inspiration)

- **Planner touch:** none. Tags live entirely in browse/collection UI + queries.
- **Risk:** **Minimal.** Fully additive, fully reversible, cannot starve a slot or break a plan.
- **Verdict:** ✅ **Safe to ship now.** This is the only option that fully honours the "no
  eligibility / no scoring" constraint with zero ambiguity.

### B — Planner *preferences* ("show me Comfort meals", soft nudge)

- **Planner touch:** tags become a **soft ranking nudge** — preferred-tag candidates sort higher,
  but **all** eligible candidates remain eligible. Analogous to the existing "variety nudge".
- **Risk:** **Moderate, manageable.** The danger is scope-creep from "nudge" into "filter". If a
  preference quietly drops candidates, it has become a hidden eligibility gate — violating the
  constraint and re-introducing the slot-starvation failure the Hybrid model exists to fix
  (preferring `comfort` could empty the snack slot if few snacks are tagged comfort).
- **Guard rails if/when adopted:** (1) preference adjusts **score only**, never the candidate set;
  (2) preference is a **tie-breaker-weight**, capped so it can't override diet/occasion fit;
  (3) **fallback always ignores preference** (a starved slot fills from the full pool regardless of
  tags). With those, B is safe — but it is *new planner code with new tests*, so it should be a
  **separate approved phase**, not bundled with the discovery landing.

### C — Planner *filters* (select Comfort → exclude non-Comfort)

- **Planner touch:** tags become a **hard eligibility gate** on the candidate pool.
- **Risk:** **HIGH — directly violates the design constraint** ("Style Tags must not affect planner
  eligibility / hard exclusions"). Concretely it re-creates the documented failure mode: the tag
  data is **sparse** (1/650 templates has component slots; most rows will have *zero* curated tags
  for a long time), so a hard `comfort`-only filter would empty most slots and the plan would fail
  to fill — exactly the "post-enforcement slot-fill failure" the sibling investigation traces.
- **Verdict:** ❌ **Reject for the foreseeable future.** A hard tag filter is only conceivable once
  tag coverage is near-complete AND it is implemented as a *separate "strict mode"* with a
  mandatory fallback-to-full-pool when a slot would otherwise starve. Even then, "filter" should
  arguably live in **browse/collections** (where an empty result is acceptable) rather than the
  **planner** (where an empty slot is a failure).

### Summary

| Option | Honours "no eligibility/scoring" constraint? | Risk | Recommendation |
|---|---|---|---|
| **A** Discovery only | ✅ Fully | Minimal | **Ship now** |
| **B** Soft preferences | ⚠️ Only with strict score-only + fallback guards | Moderate | Separate later phase, opt-in, ranking-only |
| **C** Hard filters | ❌ No | High (slot starvation, sparse data) | Reject in planner; allow only in browse |

---

## Q6 — Future Discovery without additional schema

**Yes — every one of these is answerable from a single `styleTags text[]` column (plus the
`primarySlot`/`suitableSlots` fields the Hybrid model already proposes). No further schema.**

| "Show me…" | Query basis | Field |
|---|---|---|
| Shared Meals | `styleTags @> {shared-meal}` | `styleTags[]` |
| Quick Meals | `styleTags @> {quick}` | `styleTags[]` |
| Family Meals | `styleTags @> {family}` | `styleTags[]` |
| Comfort Meals | `styleTags @> {comfort}` | `styleTags[]` |
| Lunchbox Ideas | `styleTags @> {lunchbox}` | `styleTags[]` |
| Brunch Ideas | `styleTags @> {brunch}` | `styleTags[]` |
| One-Pot Meals | `styleTags @> {one-pot}` | `styleTags[]` |
| Adaptable Meals | `styleTags @> {adaptable}` | `styleTags[]` |

- Postgres array containment (`@>`) and overlap (`&&`) operators answer single-tag and multi-tag
  ("Quick **and** Family") browse queries directly. A **GIN index** on `styleTags` makes these fast
  if/when volume warrants — that's an index, not a schema change.
- **Collections** = saved tag-filters (a `WHERE styleTags @> {…}` predicate persisted in a
  collections table — which is a *separate* future feature, but the meal/template side needs **no**
  new columns).
- "Show me **Quick Family Shared Meals** for **Lunch**" combines `styleTags @> {quick,family,shared-meal}`
  with `suitableSlots @> {lunch}` — the Hybrid model already supplies the slot side. **No
  additional schema beyond the two arrays already in the Hybrid plan.**

**Conclusion:** the single array column is forward-compatible with the entire discovery roadmap.

---

## Q7 — Recommended Canonical Tag List

**Recommendation: 20 tags** (the "intentionally small" sweet spot — fewer than 15 can't cover the
§8 catalogue + brief; more than 25 becomes unbrowsable and dilutes curation). Twenty maps 1:1 onto
the four categories from Q2.

Legend — **Src:** `S` = system-derived (auto-suggested, editable), `C` = curated (never auto),
`S/C` = seed-suggested + human-confirmed (grey zone).

### OCCASION (7) — when / social context

| Tag | Src | Definition |
|---|---|---|
| `brunch` | S/C | Leisurely late-morning meal; breakfast/lunch-spanning shells. Seed-suggested for B+L items, curator-confirmed. |
| `lunchbox` | C | Portable, eat-cold/packed; fits a lunchbox/bento. |
| `party` | C | For entertaining a group; sharing/grazing context. |
| `picnic` | C | Eaten outdoors, transportable, no reheat needed. |
| `bbq` | C | Grilled/cooked outdoors; summer cookout context. |
| `celebration` | C | Special-occasion / festive meal. |
| `date-night` | C | Restaurant-feel meal for two; "occasion at home". |

### COOKING STYLE (6) — how it's made / logistics

| Tag | Src | Definition |
|---|---|---|
| `quick` | S | Ready in under ~20 min. Derived from `estimatedTotalTime < 20` (templates); curated on meals (no prep field). |
| `one-pot` | S/C | Cooked in a single pan/pot — minimal washing-up. No field today → curated/seed-time until NLP exists. |
| `make-ahead` | C | Can be fully prepared in advance and served later (prep-ahead, not just freezable). |
| `batch-cook` | S/C | Designed to cook large quantities for multiple meals. Seed-suggested from `servings>=4 (+freezer)`. |
| `freezer-friendly` | S/C | Freezes & reheats well. Derivable from `isFreezerEligible` **only after** that column's `default true` is curated; until then, curated. |
| `slow-cook` | C | Long, low-temperature cooking (slow-cooker/braise). |

### HOUSEHOLD STYLE (5) — how the household eats it

| Tag | Src | Definition |
|---|---|---|
| `shared-meal` | S | One base the household shares. Derived from template having ≥1 populated component-slot array. **High confidence.** |
| `family` | S | Serves 3+. Derived from `meals.servings >= 3`; curated on templates (no servings field). |
| `adaptable` | S | Can flex to multiple diets via swaps. Derived from `compatibleDiets.length >= 2` / `dietTypes.length >= 2`. |
| `buffet` | C | Build-from-a-spread serving format (help-yourself). Seed-curated for spread-style shells. |
| `bar` | C | Build-your-own assembly (taco bar, jacket-potato bar, grain bowl bar). Seed-curated for component-slot "bar" shells. |

### EATING EXPERIENCE (2) — mood / feel

| Tag | Src | Definition |
|---|---|---|
| `comfort` | C | Cosy, hearty-feeling, nostalgic. Subjective → always curated. |
| `fresh` | C | Light, crisp, vibrant feeling. Subjective → always curated. |

> **Note on `indulgent`:** the brief lists Indulgent under Eating Experience. It is **omitted from
> the canonical 20** because (a) it overlaps heavily with `energyBand = Hearty` + `comfort`, and
> (b) it is value-laden and risky on *user-saved* meals (Q4). If the product owner wants it, add it
> as a **21st, strictly-curated, editorial-only** tag (never applied to user meals). Recorded here
> as a deliberate trim to keep the list tight, not an oversight.

**Tally:** 7 + 6 + 5 + 2 = **20 canonical tags.** Of these: **4 are confidently system-derived**
(`shared-meal`, `family`, `adaptable`, `quick`), **5 are grey-zone seed-suggested** (`brunch`,
`one-pot`, `batch-cook`, `freezer-friendly`, + `buffet`/`bar` as seed-curation), and **the rest are
curated.**

---

## Q8 — Worked Examples

Combining the Hybrid model fields (Primary Slot, Suitable Slots, Energy Band — from the prior docs)
with the canonical Style Tags above. **System-derived** vs **Curated** is marked per tag.
(`B`=Breakfast, `L`=Lunch, `D`=Dinner, `Sn`=Snack.)

### Cooked Breakfast
- **Primary Slot:** Breakfast
- **Suitable Slots:** B, L, D
- **Energy Band:** Hearty
- **Style Tags:** `shared-meal`, `family`, `brunch`, `adaptable`, `comfort`
  - **System-derived:** `shared-meal` (component slots populated), `adaptable` (multi-diet), `family` (if served 3+)
  - **Curated:** `brunch` (occasion/editorial), `comfort` (subjective)

### Soup & Side
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Light–Medium
- **Style Tags:** `shared-meal`, `one-pot`, `make-ahead`, `freezer-friendly`, `comfort`
  - **System-derived:** `shared-meal` (if slots populated), `adaptable` if multi-diet
  - **Curated / seed-suggested:** `one-pot`, `make-ahead`, `freezer-friendly`, `comfort`

### Curry Night
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Hearty
- **Style Tags:** `shared-meal`, `one-pot`, `family`, `adaptable`, `comfort`
  - **System-derived:** `shared-meal`, `adaptable`, `family` (serves 3+)
  - **Curated / seed-suggested:** `one-pot`, `comfort`

### Pizza Night
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Hearty
- **Style Tags:** `shared-meal`, `family`, `adaptable`, `comfort`, `make-ahead`, `party`
  - **System-derived:** `shared-meal`, `adaptable`, `family`
  - **Curated:** `comfort`, `make-ahead`, `party`

### Grain Bowl
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Medium
- **Style Tags:** `shared-meal`, `bar`, `adaptable`, `fresh`, `quick`
  - **System-derived:** `shared-meal`, `adaptable`, `quick` (if `estimatedTotalTime < 20`)
  - **Curated:** `bar` (build-your-own format), `fresh`

### Wrap Bar
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Medium
- **Style Tags:** `shared-meal`, `bar`, `family`, `adaptable`, `quick`, `party`
  - **System-derived:** `shared-meal`, `adaptable`, `family`, `quick`
  - **Curated:** `bar`, `party`

### Jacket Potato Bar
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Medium–Hearty
- **Style Tags:** `shared-meal`, `bar`, `family`, `adaptable`, `comfort`, `make-ahead`
  - **System-derived:** `shared-meal`, `adaptable`, `family`
  - **Curated:** `bar`, `comfort`, `make-ahead`

> Pattern across all examples: the **structural** tags (`shared-meal`, `adaptable`, `family`,
> `quick`) fall out of existing fields; the **vibe/format/occasion** tags (`comfort`, `bar`,
> `party`, `brunch`, `make-ahead`) are curated at seed time. This is exactly the Q3/Q4 split, and it
> demonstrates the 20-tag vocabulary covers the full §8 catalogue without gaps.

---

## FINAL VERDICT — **STATUS A**

> **Style Tags optional. Pure discovery feature (browsing / collections / inspiration).
> Metadata-only, non-gating, additive. Planner involvement deferred to a separate approved phase.**

### Reasoning

1. **It is exactly what the brief's *initial* intents ask for.** The stated v1 intents — discovery,
   browsing, inspiration, collections, *future* planner preferences — are all satisfied by a
   non-gating metadata facet. "Future planner preferences" is explicitly *future*, which is Status
   B as a **later** phase, not the first landing.

2. **It is the only option that fully honours the hard constraint.** The brief and both prior docs
   require Style Tags to **never** affect dietary restrictions, eligibility, hard exclusions, or
   scoring. Status A is the only option that satisfies this with **zero** ambiguity. B satisfies it
   *only* with careful score-only/fallback guards (new code, new risk); C **violates** it outright.

3. **The data isn't ready for gating.** Tag coverage will be sparse for a long time (1/650
   templates has component slots today; curated tags accrue slowly). Any hard filter (C) on sparse
   tags re-creates the slot-starvation failure documented in
   `SMART_PLANNER_POST_ENFORCEMENT_SLOT_FILL_FAILURE.md`. Discovery (A) is *fine* with sparse data —
   an empty browse result is acceptable; an empty planner slot is a failure.

4. **It is free to defer B/C and free to add later.** Because `styleTags[]` is additive and
   non-gating, shipping A now closes off **no** future option. B (soft preferences) and C (filters)
   can be added later, each as its own approved phase with its own tests — without re-touching the
   tag data model. Deferring them removes planner risk and new test surface from the first change at
   zero forward cost.

5. **Why not D (alternative):** no alternative is needed — the Hybrid model already supplies the
   right architecture (advisory `styleTags[]` alongside gating `suitableSlots[]`). This
   investigation's contribution is the *canonical vocabulary* (Q7), the *derive-vs-curate split*
   (Q3/Q4), and the *staged planner posture* (A now → guarded B later → C only in browse). That is
   a refinement of D's metadata layer, not a replacement — and it lands as Status **A** for v1.

### One-line recommendation

**Adopt the 20-tag canonical vocabulary (§7) as an optional, non-gating `styleTags text[]` facet
for discovery; auto-suggest only the 4 high-confidence structural tags and curate the rest; keep
Light/Medium/Hearty in `energyBand`, not tags; defer all planner involvement to a later,
separately-approved phase (soft preferences only — never a hard filter in the planner).**

---

## Scope Lock — confirmed

- ❌ No implementation
- ❌ No schema changes
- ❌ No planner changes
- ❌ No shell seeding
- ✅ Investigation only
- ✅ Rollback tag created **before** work: `rollback/pre-style-tag-investigation-20260614` → `39de349`

> The only file written by this investigation is this document. No `server/scripts` or other
> artifacts were added or modified.
