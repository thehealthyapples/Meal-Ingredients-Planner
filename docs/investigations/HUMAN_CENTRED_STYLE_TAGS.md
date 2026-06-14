# Human-Centred Style Tags — Final Canonical Naming Investigation

**Date:** 2026-06-14
**Branch:** `main` @ `39de349`
**Rollback tag:** `rollback/pre-human-centred-style-tags-20260614` → points to commit **`39de349`**
**Restore command:** `git reset --hard rollback/pre-human-centred-style-tags-20260614`
**Scope:** Investigation only. **No** code, schema, migration, shell seeding, or planner changes.
**Method:** Read-only audit of `shared/schema.ts:48-121` (re-verified this session) plus the three
prior investigations: `STYLE_TAG_SYSTEM_DESIGN.md` (the canonical technical vocabulary),
`HYBRID_MEAL_OCCASION_MODEL_IMPLEMENTATION_SCOPE.md`, and
`FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md`.

> **Pre-work confirmation:** at investigation start the tracked working tree was clean (only
> untracked investigation docs + read-only `server/scripts/sim-*.ts` / `query-*.ts` present). The
> rollback tag was created **before** any work. The only file written by this investigation is this
> document.

> ⚠️ **Terminology (carried from prior docs):** "slot" unqualified = **meal-occasion** (breakfast /
> lunch / dinner / snack). The `proteinSlots` / `carbSlots` / `vegSlots` / `toppingSlots` /
> `sauceSlots` columns are **component slots** (the shared-meal base + swappable parts), **not**
> occasion slots.

---

## TL;DR — Final Verdict: **STATUS C (Hybrid)**

> **Keep stable technical slugs as the stored canonical key; present human-centred display labels in
> the UI via a single label map. The names families read change; the data the system reasons over
> does not. This is the same store-slug / render-label split the prior investigation already
> recommended (`STYLE_TAG_SYSTEM_DESIGN.md` line 88–93) — this document just fixes the human labels.**

The previous investigation deliberately chose lower-case kebab slugs (`shared-meal`, `quick`,
`one-pot`, `comfort`) *for storage and equality checks*, and explicitly said display labels should be
"render[ed]… from a single lookup map." It never claimed those slugs were the words families should
read. So the question "technical vs human-centred tags?" is a **false binary**: the canonical system
already has room for both. The only real decision is **what the human labels say** and **whether any
of the new human names introduce new derivation logic** (they do not).

Concretely:

1. **`Family Table` replaces `shared-meal` as the display label, not the data.** It is a label over
   the existing, high-confidence system-derived slug (`hasComponentSlots`). Option **B** in the
   brief ("actual canonical style tag") is correct *in the sense that it is a first-class tag*, but
   it is the **display name of a tag whose stored key stays stable** — so it is **derivable today**.
2. **`Adaptable` keeps its name** — it is already human-readable and already system-derivable from
   `compatibleDiets[]` / `dietTypes[]`. No change needed.
3. **`Quick & Easy` replaces `quick`** as a label; still partly derivable (templates only).
   **`Fuss Free` is NOT a separate tag** — it is the same concept as `Quick & Easy` plus "no
   technique", which the schema cannot measure. Merge, do not split.
4. **`Family Pleaser`, `Comfort`, `Fresh`, `Indulgent`, `Buffet`, `Bar`** are **curated only** —
   they encode vibe / crowd-appeal / serving-format that **no schema field can faithfully decide**.
   Auto-guessing them damages trust (Q4 of the prior doc).
5. **No new schema, no new derivation pipeline.** Every human label maps 1:1 onto a slug already in
   the canonical-20 vocabulary, or is a pure rename. The label map is UI-only.

Net: adopt human-centred **labels**; keep machine-stable **slugs**; change **zero** derivation rules.
That is Status C, and it costs nothing because the slug/label seam already exists in the design.

---

## The core architectural insight (why this isn't "technical vs human")

The prior canonical design stores each tag as a **slug** and renders a **label** from a lookup map.
That single decision dissolves the whole "too technical" complaint:

```
STORED (stable, machine key)     DISPLAYED (human, family-voiced)     DERIVATION (unchanged)
--------------------------------------------------------------------------------------------
shared-meal                  →   "Family Table"                   →   system: hasComponentSlots
adaptable                    →   "Adaptable"                      →   system: ≥2 compatibleDiets
quick                        →   "Quick & Easy"                   →   system: estTotalTime < ~20 (templates)
one-pot                      →   "One Pot"                        →   curated / seed
comfort                      →   "Comfort"                        →   curated
family-pleaser  (new slug)   →   "Family Pleaser"                 →   curated
buffet                       →   "Buffet"                         →   curated
bar                          →   "Build-Your-Own" / "…Bar"        →   curated
fresh                        →   "Fresh"                          →   curated
indulgent                    →   "Indulgent"                      →   curated (editorial only)
```

- **Renaming a label is a one-line map edit, fully reversible, never a migration.** Slugs never
  appear in the UI, so they can stay terse and stable; labels can be re-voiced any time without
  touching data, queries, or the planner.
- **This protects equality/containment queries.** `styleTags @> {shared-meal}` keeps working no
  matter how the label reads. If we instead stored "Family Table" we would re-introduce exactly the
  casing/wording rot already documented on `category` (`dinner` 297 vs `Dinner` 26).

**Therefore:** the answer to almost every "should this be a display-only label or a real tag?"
question is **"both, and that is the point"** — it is a real tag (a stored slug, queryable,
sometimes derived) *wearing* a human label.

---

## 1. `shared-meal` → **Family Table**

**Recommendation: adopt "Family Table" as the display label of the existing `shared-meal` slug.
It is a real canonical tag (brief Option B), and it is system-derived today.**

### Brief Q: display-only label (A) or actual canonical style tag (B)?

**B — but precisely:** it is a canonical tag whose **stored key is the stable slug `shared-meal`**
and whose **rendered label is "Family Table".** Calling it "display-only" (A) would wrongly imply it
isn't queryable or derivable; it is both. The human name is the label; the tag is real.

### Brief Q: can it be system-derived from proteinSlots / carbSlots / vegSlots?

**Yes — high confidence, and this is the single most reliable derivation in the vocabulary.** A
template "is a Family Table" when it has at least one populated component-slot array:

```
isFamilyTable(template) = any of
  proteinSlots, carbSlots, vegSlots, toppingSlots, sauceSlots  is non-empty
```

This is exactly the prior doc's `shared-meal` rule (rated **High** confidence). The meaning maps
perfectly onto the family scene in the brief: one shared base ("Curry Night"), swappable components
per eater (Keto → chicken + salad + avocado; Vegetarian → chickpeas + rice + greens), everyone at
the same table. That *is* what populated component slots encode.

**Caveat (unchanged from prior doc):** only **1 of 650** templates has component slots populated
today. So the derivation is *accurate* but applies to almost nothing until shells are seeded — a
data-coverage fact, not a naming problem. Until coverage grows, "Family Table" may also be applied
**curator-side** to obviously-shared meals (it is a grey-zone of "derive when slots exist, else
curate"), exactly like the prior `shared-meal` treatment.

> **Naming verdict:** "Family Table" is warmer and instantly legible to a parent, and it keeps the
> shared-base/adaptation/enhancement structure intact behind it. **Adopt.** (Minor watch-out: some
> single-person or housemate households aren't "family" — see §10 risk note; "Family Table" still
> reads fine as "one meal, everyone eats together," but flag for product copy review.)

---

## 2. **Adaptable**

**Recommendation: keep the name "Adaptable" as-is. System-derivable today. No change.**

"Adaptable" is *already* human-readable — a parent understands "this meal can flex for different
diets" with no gloss. There is nothing technical to fix.

### Brief Q: can it be system-derived from `compatibleDiets[]` (or similar)?

**Yes — Medium-High confidence**, unchanged from the prior doc:

```
isAdaptable(template) = compatibleDiets.length >= 2     // templates
isAdaptable(meal)     = dietTypes.length >= 2           // meals (dietTypes is .notNull().default([]))
```

"Supports Vegetarian / Vegan / Keto / Gluten-Free / Dairy-Free" is precisely a `compatibleDiets`
array of length ≥ 2. Caveat (carried): "≥2 diets listed" is a *proxy* for adaptability — it confirms
the meal is *tagged* for multiple diets, not that swap mechanics exist. Good enough to auto-suggest,
must stay curator-overridable.

> **Naming verdict:** keep "Adaptable". It is the rare tag that is both human and machine-friendly.

---

## 3. **Family Pleaser**

**Recommendation: curated only. Never derived. New slug `family-pleaser`, label "Family Pleaser".**

Definition (from brief): most families enjoy it; low drama; kids and adults usually happy.
Examples: Pizza Night, Cooked Breakfast, Jacket Potato Bar, Mac & Cheese.

### Brief Q: curated only? Can it ever be derived?

**Curated only. It cannot be honestly derived** — and this is the most important "no" in the
document. "Crowd-pleasing / low-drama / kids-and-adults-both-like-it" is **social acceptance data**.
The schema has **no** field for palatability, kid-friendliness, or household reception. Any proxy we
could reach for is wrong:

- *cuisine/calories/ingredients* → measure composition, not appeal;
- *`audience` column on meals* (`adult`/`kids`/`baby`) → marks **who a meal is FOR**, not **who
  enjoys it**; a "Family Pleaser" is precisely a single meal *both* adults and kids like, which is
  the opposite of an audience split.

A wrongly-applied "Family Pleaser" is brand-damaging (it's a promise to a tired parent). So it must
be an **editorial/curatorial** call.

> **Could it *ever* be derived?** Only from data the app does not yet collect — e.g. aggregate
> household ratings / re-cook frequency ("families who plan this re-plan it"). That is a **future
> behavioural-signal** feature, not a schema derivation. Until such signals exist: **curated only.**

> **Naming verdict:** excellent family-voiced name; keep it, but gate it strictly to curation.

---

## 4. **Comfort**

**Recommendation: keep "Comfort". Curated only. Unchanged from prior doc.**

Definition: warm, cosy, familiar, emotionally satisfying. Examples: Soup, Pasta Bake, Cottage Pie,
Curry Night.

### Brief Q: should Comfort remain? Curated only?

**Yes, remain; yes, curated only.** "Comfort" is pure subjective/cultural vibe — comfort food varies
by person and culture; no field encodes "feels comforting." Auto-guessing from cuisine or calories
would be wrong and brand-damaging (prior doc Q4). It also must **not** be conflated with energy:
*cosy* (Comfort, a mood tag) is orthogonal to *quantity* (`energyBand` = Light/Medium/Hearty).

> **Naming verdict:** already human, already correctly curated. Keep verbatim.

---

## 5. `quick` → **Quick & Easy**

**Recommendation: adopt label "Quick & Easy" over the existing `quick` slug. Partly system-derived
(templates only); curated on meals.**

Definition: low effort, minimal washing-up, easy weeknight meal.

### Brief Q: derivable from prep time, or does it require curation?

**Partly derivable — templates only**, unchanged from prior doc:

```
isQuick(template) = estimatedTotalTime < ~20      // meal_templates.estimatedTotalTime (sparse)
isQuick(meal)     = NOT derivable                  // meals has NO prep-time field → curate
```

Two honest caveats:
- `estimatedTotalTime` exists **only on templates** and is **sparse**, so derivation covers a
  minority of rows; absence ⇒ tag simply not added (never asserted false).
- The label says "Quick **& Easy**" but the field measures **time only**. "Easy / low effort /
  minimal washing-up" is **not** in the schema. So the derived signal under-delivers on the label's
  promise. **Recommendation:** derive the *time* component where data exists, and treat the
  *effort/"easy"* component as curator-confirmable. The label is fine; just don't over-claim the
  derivation.

> **Naming verdict:** "Quick & Easy" is friendlier than bare "Quick" and matches how families talk
> ("something quick and easy tonight"). Adopt as the label; keep `quick` as the slug.

---

## 6. **Fuss Free** — same thing as Quick & Easy?

**Recommendation: do NOT create a separate "Fuss Free" tag. Fold it into "Quick & Easy".**

Definition (brief): simple, reliable, no stress, no complicated techniques. Examples: Tray Bake,
Jacket Potato Bar, Cooked Breakfast.

### Brief Q: separate from Quick & Easy, or the same thing?

**Effectively the same consumer intent, and neither extra component is independently derivable.**
"Fuss Free" = "Quick & Easy" minus the speed requirement, plus "no complicated techniques." But:

- "No complicated technique" is **not** a schema field (same wall as `one-pot` — would need NLP over
  `instructions`). So a separate "Fuss Free" tag would be **100% curated** and would overlap so
  heavily with "Quick & Easy" that users could not tell them apart. Two near-synonymous tags dilute
  curation and confuse browse (which do I pick? are they different?).
- Tray Bake / Jacket Potato Bar / Cooked Breakfast are *already* well-covered by **Quick & Easy**
  (easy weeknight) and, for the build-your-own ones, **Bar/Buffet**.

**Decision:** "Quick & Easy" carries the "low-effort, no-stress weeknight" meaning. Drop "Fuss Free"
from the canonical vocabulary to keep the list tight and unambiguous. (If, later, the team wants a
distinct "minimal-technique" facet, it would be a single curated tag — but only if user research
shows families actually distinguish it from "Quick & Easy". Not now.)

---

## 7. Final **Household Style** tags

*How the household eats it.* Legend — **S** = system-derived (auto-suggested, editable),
**C** = curated (never auto), **S/C** = derive-when-data-exists else curate.

| Stored slug | Display label | Src | Definition | Examples |
|---|---|---|---|---|
| `shared-meal` | **Family Table** | **S** (`hasComponentSlots`) / S-C until coverage grows | One shared base, everyone eats together, components swap per eater. | Curry Night, Pizza Night, Cooked Breakfast, Jacket Potato Bar |
| `adaptable` | **Adaptable** | **S** (`compatibleDiets ≥ 2` / `dietTypes ≥ 2`) | Flexes across diets (Veg/Vegan/Keto/GF/DF) via swaps. | Grain Bowl, Wrap Bar, Curry Night |
| `family-pleaser` | **Family Pleaser** | **C** (no appeal data; future: ratings) | Crowd-pleasing, low-drama, kids + adults both happy. | Pizza Night, Mac & Cheese, Cooked Breakfast |
| `buffet` | **Buffet** | **C** (seed-curated for spread shells) | Help-yourself spread; multiple dishes laid out. | Cooked Breakfast spread, party platters |
| `bar` | **Build-Your-Own** *(label)* / `bar` *(slug)* | **C** (seed-curated for component-slot "bar" shells) | Each person assembles their own from a line-up of parts. | Jacket Potato Bar, Wrap Bar, Taco Bar, Grain Bowl bar |

Notes:
- **Family Table** is the headline Household-Style tag and the only one that is confidently
  system-derived (when component slots exist). The rest are curated/seed.
- **Bar** keeps the short slug `bar` but is best **labelled** "Build-Your-Own" for families (or
  per-shell as "…Bar", e.g. "Jacket Potato Bar"), since "Bar" alone is ambiguous out of context.
- `family` (the prior "serves 3+" derived tag) is **folded into "Family Table"** at the label level
  to avoid two near-identical "family…" tags. If a pure servings-based facet is wanted later it can
  return as its own slug; for the human-centred set, one "Family" concept is clearer.

---

## 8. Final **Eating Experience** tags

*Mood / feel.* Same legend.

| Stored slug | Display label | Src | Definition | Examples |
|---|---|---|---|---|
| `comfort` | **Comfort** | **C** (subjective) | Warm, cosy, familiar, emotionally satisfying. | Soup, Pasta Bake, Cottage Pie, Curry Night |
| `quick` | **Quick & Easy** | **S** time-only on templates; **C** on meals / for "easy" | Low effort, minimal washing-up, easy weeknight. | Tray Bake, Stir-Fry, Wrap Bar |
| `fresh` | **Fresh** | **C** (subjective) | Light, crisp, vibrant, lots of veg/raw. | Salads, Grain Bowl, summer plates |
| `indulgent` | **Indulgent** | **C, editorial only** (never on user meals) | A treat; rich/decadent by intent. | Pizza Night, desserts, Mac & Cheese |

Notes:
- **Fuss Free is intentionally absent** — merged into Quick & Easy (§6).
- **Indulgent** stays editorial-only and is **never** auto-applied (it is value-laden; labelling a
  user's saved meal "Indulgent" reads as judgemental — prior doc Q4). Carried as a curated option.
- **Light / Medium / Hearty are NOT here** — those are `energyBand`, a separate ordinal field, kept
  out of the tag vocabulary to avoid a second, conflicting energy axis (prior doc Q2). "Comfort"
  (mood) ≠ "Hearty" (quantity).

---

## 9. Worked examples (human-centred labels + derivation marks)

Combines Hybrid fields (Primary Slot, Suitable Slots, Energy Band) with the human-centred Style
Tags. **(S)** = system-derived, **(C)** = curated, **(S/C)** = derive-when-data-exists else curate.
`B`=Breakfast, `L`=Lunch, `D`=Dinner, `Sn`=Snack.

### Cooked Breakfast
- **Primary Slot:** Breakfast
- **Suitable Slots:** B, L, D
- **Energy Band:** Hearty
- **Style Tags:** Family Table (S/C), Adaptable (S), Family Pleaser (C), Comfort (C)
  - *Derived:* Family Table (component slots populated), Adaptable (multi-diet)
  - *Curated:* Family Pleaser, Comfort

### Curry Night
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Hearty
- **Style Tags:** Family Table (S), Adaptable (S), Comfort (C), One Pot (C)
  - *Derived:* Family Table, Adaptable
  - *Curated:* Comfort, One Pot

### Pizza Night
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Hearty
- **Style Tags:** Family Table (S), Adaptable (S), Family Pleaser (C), Comfort (C), Indulgent (C)
  - *Derived:* Family Table, Adaptable
  - *Curated:* Family Pleaser, Comfort, Indulgent

### Soup & Side
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Light–Medium
- **Style Tags:** Family Table (S/C), Comfort (C), Quick & Easy (S/C)
  - *Derived:* Family Table (if slots populated), Quick & Easy (if `estimatedTotalTime < 20`)
  - *Curated:* Comfort

### Grain Bowl
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Medium
- **Style Tags:** Family Table (S/C), Adaptable (S), Build-Your-Own/Bar (C), Fresh (C), Quick & Easy (S/C)
  - *Derived:* Family Table (if slots), Adaptable, Quick & Easy (if time data)
  - *Curated:* Build-Your-Own, Fresh

### Jacket Potato Bar
- **Primary Slot:** Dinner
- **Suitable Slots:** L, D
- **Energy Band:** Medium–Hearty
- **Style Tags:** Family Table (S/C), Adaptable (S), Build-Your-Own/Bar (C), Family Pleaser (C), Comfort (C)
  - *Derived:* Family Table (if slots), Adaptable
  - *Curated:* Build-Your-Own, Family Pleaser, Comfort

### Wrap Bar
- **Primary Slot:** Lunch
- **Suitable Slots:** L, D
- **Energy Band:** Medium
- **Style Tags:** Family Table (S/C), Adaptable (S), Build-Your-Own/Bar (C), Quick & Easy (S/C), Family Pleaser (C)
  - *Derived:* Family Table (if slots), Adaptable, Quick & Easy (if time data)
  - *Curated:* Build-Your-Own, Family Pleaser

> Pattern (identical to the prior doc's Q3/Q4 split, just re-labelled): the **structural** tags
> (Family Table, Adaptable, Quick & Easy) fall out of existing fields; the **vibe / appeal / format**
> tags (Comfort, Family Pleaser, Indulgent, Fresh, Build-Your-Own) are curated at seed time. The
> human labels cover every example in the brief without gaps and without new derivation logic.

---

## FINAL VERDICT — **STATUS C (Hybrid)**

> **Human-centred display labels + machine-stable technical slugs. Re-voice the labels; keep the
> slugs, the derive-vs-curate split, and the non-gating discovery posture exactly as the prior
> canonical design set them.**

### Why C, not A (technical) or B (human-only as stored values)

1. **A (technical tags are better) is wrong for the user-facing layer.** "shared-meal", "one-pot"
   are engineer words; families don't browse by them. The brief's instinct — speak like families
   cook — is correct *for what users see*.

2. **B (human tags are better) is wrong if it means storing the human strings.** Storing
   "Family Table" / "Quick & Easy" as the canonical value re-introduces casing/wording rot (the
   documented `category` problem), breaks array containment queries, and makes every re-wording a
   data migration. Human words are unstable; keys must be stable.

3. **C captures both with zero conflict** because the canonical design **already** stores slugs and
   renders labels from a map (`STYLE_TAG_SYSTEM_DESIGN.md` line 88–93). Adopting human labels is
   therefore a **UI label-map change**, not a schema or data change — fully reversible, no migration,
   no planner impact. The system keeps reasoning over `shared-meal`; the parent reads "Family Table".

4. **It changes no derivation rules.** Every human label maps onto an existing canonical-20 slug
   (Family Table→`shared-meal`, Quick & Easy→`quick`, Adaptable→`adaptable`, Comfort/Fresh/Indulgent/
   Buffet/Bar unchanged) or is a pure curated rename (`family-pleaser`). The derive-vs-curate
   confidence ratings are untouched. Only **two** real vocabulary edits result: **add**
   `family-pleaser` (curated), and **drop** `fuss-free` as redundant (merged into Quick & Easy).

5. **Discovery posture is unchanged (still the prior Status A for the planner).** These remain an
   optional, non-gating discovery/browse facet. Human labels don't change that they must never affect
   diet, eligibility, or scoring. Naming and planner-posture are independent decisions; this doc only
   settles naming.

### One-line recommendation

**Adopt human-centred labels over the existing canonical slugs via a UI label map — `shared-meal`→
"Family Table", `quick`→"Quick & Easy", `bar`→"Build-Your-Own"; add a curated `family-pleaser`; drop
the redundant "Fuss Free" (merge into Quick & Easy); keep "Adaptable", "Comfort", "Fresh",
"Indulgent", "Buffet" as-is; keep Light/Medium/Hearty in `energyBand`; change no derivation logic and
no planner behaviour.**

### Summary of changes vs the canonical-20 vocabulary

| Action | Slug | Label | Src |
|---|---|---|---|
| Re-label | `shared-meal` | **Family Table** | S (when component slots exist) |
| Keep | `adaptable` | Adaptable | S |
| Re-label | `quick` | **Quick & Easy** | S (templates) / C (meals + "easy") |
| Re-label | `bar` | **Build-Your-Own** | C |
| Keep | `comfort`, `fresh`, `indulgent`, `buffet`, `one-pot` | (as written) | C (one-pot C/seed) |
| **Add** | `family-pleaser` | **Family Pleaser** | **C only** (future: ratings) |
| **Drop** | `fuss-free` | — | merged into Quick & Easy |
| **Fold** | `family` (serves 3+) | into **Family Table** | — |

---

## Scope Lock — confirmed

- ❌ No implementation
- ❌ No schema changes
- ❌ No planner changes
- ❌ No shell seeding
- ✅ Investigation only
- ✅ Rollback tag created **before** work: `rollback/pre-human-centred-style-tags-20260614` → `39de349`

> The only file written by this investigation is this document. No `server/scripts` or other
> artifacts were added or modified.
</content>
</invoke>
