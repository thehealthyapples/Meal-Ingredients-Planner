# Health Benefits & Nutrition Context — V1 Knowledge Model Design

**Document type:** Architecture + data-model investigation (investigation only — no implementation).
**Date:** 2026-06-18
**Author role:** Senior nutrition-education product architect + senior React/Node engineer.
**Companion documents:**
- `THA_HEALTH_BENEFITS_CONNECTED_EXPERIENCE_IMPLEMENTATION.md` (the shipped "separate but connected" surfaces + shared display model)
- `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` (Tier A / Tier B framing; this document **is** the Tier B data layer)
- `WEEKLY_NUTRITION_REPORT_AND_CAUTION_FOODS_MODEL.md` (weekly aggregation + claim-safety rules; build-order Phase A)
- `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/health-benefits-v1-design-20260618` |
| **Tag object SHA** | `d0ded8b052f86feaec37707798274f320d6cc012` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/health-benefits-v1-design-20260618` |
| **Undo this doc only** | `rm docs/investigations/HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status checked.** No tracked files modified or staged. Two pre-existing untracked artefacts
   present from prior investigations (`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`,
   `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`). The committed tree is clean; these predate this
   task and are untouched by it.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/health-benefits-v1-design-20260618` at `bae3b99`.
4. ✅ **Rollback identifier reported** (above) before any investigation work.

**This task makes no code, CSS, route, schema, API, migration, or data change.** It creates exactly two
artefacts: this markdown file and one annotated git tag. Full confirmation in §13 and the Final Report.

---

# SECTION 1 — EXECUTIVE SUMMARY

This investigation answers one question: **how do we build a single, trustworthy nutrition knowledge
layer that powers all five THA surfaces for launch — without overclaiming, fabricating, or implying
medical advice?**

The most important finding is that **the hard part is already designed and partly built.** This is not
a greenfield investigation; it is the convergence point of three prior ones. The shared display model,
the trust guardrails, the user-facing vocabulary, the empty-state discipline, and the food→nutrient
data already exist in code. **The only missing piece is curated, source-backed data** — the
Benefit→Nutrient registry and the Nutrition Context registry. Everything else is plumbing that is
already laid.

What exists today (verified in source):

| Layer | Status | Where |
|---|---|---|
| Foods → Key Nutrients + summary | ✅ **REAL, curated** (24 foods, ~23 nutrients) | `nutrition-benefit-library.ts` |
| Store-cupboard context (`goodToKnow`, `howToChoose`, `whyItMatters`) | ✅ **REAL, curated** (~40 items) — *this is proto Nutrition Context* | `pantry-knowledge.ts` |
| Plant detection + 9-category taxonomy | ✅ REAL | `nutrition-variety.ts` |
| Shared display adapter + vocabulary + disclaimer | ✅ REAL (renders empty until data lands) | `health-benefits-model.ts` |
| Nutrient→Food index (inversion) | ✅ REAL | `health-benefits-model.buildNutrientIndex()` |
| **Health Benefit → Nutrient registry** | ❌ **DOES NOT EXIST** | — |
| **Structured Nutrition Context registry** | ❌ **DOES NOT EXIST** (proto data lives unstructured in `pantry-knowledge`) | — |
| **Source / citation / evidence / last-reviewed storage** | ❌ **DOES NOT EXIST** | — |

The architectural recommendation is therefore **not to build new machinery, but to author two small,
curated, source-backed registries** that snap into the adapter that already expects them, and to
**formalise the Nutrition Context that is already being written ad-hoc** in `pantry-knowledge.ts` into a
structured shape.

**The defining design principle — the "nutrient bridge":** THA must *never* author a per-food health
claim. Instead it authors `Benefit → Nutrient` links once (curated, cited, nutritionist-reviewed), and
the existing `Food → Nutrient` data composes the chain automatically:

```
Sleep Quality ──(Magnesium)──> Pumpkin Seeds        is NOT authored as "pumpkin seeds help sleep"
              ↑ curated+cited        ↑ already exists   it is DERIVED through the shared nutrient
```

This is the single most important trust decision in the whole model. It means every benefit shown is
**evidenced, auditable, and traceable to a nutrient and a source** — never asserted about a food
directly, never inferred from free-text, never AI-generated.

**Recommendation in one line:** Ship a **curated, source-backed, static TypeScript registry** of
**8 Health Benefits** and **structured Nutrition Context** for the existing ~24–30 foods, composed
through the nutrient bridge, governed by a global safe-wording standard, surfaced
**differently per surface** behind a hard fallback (show nutrients only; hide unsupported benefits).
No schema change for V1.

---

# SECTION 2 — HEALTH BENEFITS MODEL

## 2.1 The canonical model

The brief's suggested fields are close. Refined and reconciled with the existing `HealthBenefit`
interface in `health-benefits-model.ts` (which today is `{ name; emoji?; nutrient? }`):

```ts
// CANONICAL — Health Benefit topic (the "outcome" node)
interface HealthBenefitTopic {
  id: string;              // stable slug, e.g. "heart-health"  — the join key
  name: string;            // user-facing, e.g. "Heart Health"
  icon: string;            // single emoji/icon token, e.g. "❤️"
  description: string;     // curated, ONE sentence, safe-worded (§7). Educational, not medical.
  evidenceStrength: "established" | "emerging";   // INTERNAL gate (see §6) — controls visibility
  displayPriority: number; // curator-set ordering when multiple benefits compete for one slot
  sources: SourceRef[];    // ≥1 required for "established"; see §6
  active: boolean;         // kill-switch — lets a benefit be hidden without deleting curation
}

// CANONICAL — the bridge (the ONLY place an outcome is linked to anything)
interface BenefitNutrientLink {
  benefitId: string;       // → HealthBenefitTopic.id
  nutrient: string;        // MUST be a value already used in NutritionBenefit.keyNutrients
  strength: "established" | "emerging";
  sources: SourceRef[];    // the citation lives on the LINK, not the food
}
```

**Why this shape, and what I changed from the brief:**

- **`evidence strength` is two-valued, not three.** The brief proposes Strong / Moderate / Emerging.
  I recommend **`established` | `emerging`** only (see §6.4 for the full argument). Three tiers invite
  endless curator debate about "strong vs moderate" and tempt us to ship "moderate" claims that are
  really guesses. Two tiers map to a clean rule: *established ships and is shown plainly; emerging is
  hidden at launch (or shown with an explicit "emerging evidence" tag, curator's choice per benefit).*
- **Added `id`** (stable slug). The brief's model keyed on `name`; names get reworded, ids don't.
- **Added `active` kill-switch.** A curated registry needs a way to retract a benefit instantly without
  a code deletion or losing the citation work.
- **`sources` lives on both the topic and the link.** The topic-level source backs the *description*;
  the link-level source backs the *Benefit↔Nutrient relationship*. They are different claims.
- **No `Food` field anywhere in the benefit model.** Foods attach only through nutrients. This is the
  bridge, and it is non-negotiable for trust.

## 2.2 Which Health Benefits should ship in V1?

The constraint is **what the existing food→nutrient data can actually evidence.** A benefit with no
bridging nutrient present in `nutrition-benefit-library.ts` would render empty — worse than not existing.
Cross-referencing the brief's 10 candidates against the ~23 nutrients already curated:

| Benefit | Bridging nutrients present in library today | Verdict |
|---|---|---|
| **Heart Health** | Omega-3, Monounsaturated Fats, Polyphenols, Fibre, Potassium | ✅ strong coverage |
| **Gut Health** | Fibre, Probiotics, (fermented foods) | ✅ strong coverage |
| **Bone Health** | Calcium, Vitamin K, Vitamin D, Magnesium | ✅ strong coverage |
| **Energy** | Iron, B Vitamins, (slow-release whole grains) | ✅ good coverage |
| **Immune Support** | Vitamin C, Zinc, Vitamin A, Selenium, Vitamin D | ✅ strong coverage |
| **Muscle Function** | Plant Protein, Magnesium, Potassium | ✅ good coverage |
| **Brain Health** | Omega-3, Vitamin E, B Vitamins | ✅ good coverage |
| **Sleep Quality** | Magnesium | ⚠️ thin (one nutrient) + evidence is weaker → `emerging` |
| **Blood Sugar Balance** | Fibre, (slow-release energy) | ⚠️ wording-sensitive; near "treatment" of a condition → defer |
| **Satiety** | Fibre, Plant Protein | ⚠️ conceptually overlaps Gut/Energy; low standalone value → defer |

### Recommendation — three tiers

**MINIMUM LAUNCH SET (5) — ship these, all `established`, all strongly evidenced and well-covered:**

> **Heart Health · Gut Health · Bone Health · Immune Support · Energy**

These five have the strongest public-health consensus *and* the densest nutrient coverage in the
existing library, so nearly every curated food will surface at least one benefit. This is the safest
possible launch — high coverage, low claim risk.

**IDEAL LAUNCH SET (8) — recommended target if curation/review capacity allows:**

> Minimum 5 **+ Muscle Function + Brain Health + Sleep Quality**

Sleep Quality ships as **`emerging`** (single thin nutrient bridge, softer evidence) — meaning at
launch it is either hidden or carries an explicit "emerging evidence" tag. The brief's flagship example
(Pumpkin Seeds → Sleep Quality → Magnesium) thus becomes *honestly representable* rather than
overstated.

**FUTURE EXPANSION (post-launch, needs new food/nutrient data + review):**

> Blood Sugar Balance · Satiety · Skin Health · Eye Health · Hydration · Anti-inflammatory

**Blood Sugar Balance is deliberately deferred, not minimised.** "Balancing blood sugar" sits one
careless reword away from implying diabetes management — a medical claim. It needs its own wording
review and is not worth the risk for a launch differentiator. Same logic retired the "Anti-inflammatory"
free-text already loosely present in `pantry-knowledge` (turmeric, ginger): keep it as *culinary
context*, not a *health benefit topic*, until it can be sourced and worded safely.

**Hard cap: 8 benefits at launch.** More is an encyclopedia, not a product. Each benefit must end in an
action (a food to add, a meal it appears in) — never a dead-end fact.

---

# SECTION 3 — NUTRIENT MODEL

## 3.1 The canonical model

Nutrients are **the spine of the whole system** — they are the join between foods (which have them) and
benefits (which are evidenced by them). Today nutrients exist only as **bare strings** inside
`NutritionBenefit.keyNutrients: string[]`. For V1 this is *almost* enough, but the strings are
inconsistent and uncontrolled, which will break the bridge.

**Recommended canonical model — a controlled nutrient vocabulary:**

```ts
interface Nutrient {
  id: string;              // "magnesium"  — canonical join key
  name: string;            // "Magnesium"  — display
  aliases: string[];       // ["Mg"] — tolerate library/source variations
  visibility: "public" | "internal" | "hidden";   // see §3.3
  kind: "vitamin" | "mineral" | "macronutrient" | "fatty-acid" | "phytonutrient" | "other";
}
```

This is a **controlled vocabulary**, not new claim data — it is the lowest-risk part of the model.
Its job is to guarantee that the nutrient string a *food* uses (`"Omega-3"`) is exactly the string a
*benefit link* uses, so the bridge actually connects. Today they are free strings on both sides; one
typo (`"Omega 3"` vs `"Omega-3"` vs `"Omega‑3"`) silently breaks a benefit. **Normalising the nutrient
vocabulary is a prerequisite for the bridge to work** and should be the very first curation step.

## 3.2 Data-quality fracture found (must fix before bridging)

The existing `keyNutrients` strings mix three different *kinds* of thing:

- True nutrients: `Magnesium`, `Iron`, `Vitamin C`, `Calcium`, `Omega-3`, `Plant Protein`…
- Compound/phytonutrient classes: `Polyphenols`, `Antioxidants`, `Lignans`, `Lycopene`, `Nitrates`
- Vague buckets: `B Vitamins`, `Antioxidants`, `Probiotics`, `Monounsaturated Fats`

`Antioxidants` and `B Vitamins` are **too vague to bridge to a specific benefit with a citation**. You
cannot source "Antioxidants → Heart Health" cleanly. These must be marked `internal` (shown on foods as
descriptive nutrients, but **not** used as a benefit bridge).

## 3.3 Which nutrients display, stay internal, or are hidden?

The brief asks exactly this. Answer, applied to the existing vocabulary:

| Visibility | Rule | Examples from current library |
|---|---|---|
| **`public`** | Recognised, citable, safe to bridge. Shows on foods AND can evidence a benefit. | Magnesium, Iron, Zinc, Calcium, Vitamin C, Vitamin K, Vitamin D, Vitamin E, Vitamin A, Omega-3, Fibre, Plant Protein, Folate, Potassium, Selenium, Probiotics, Monounsaturated Fats |
| **`internal`** | Real and fine to *display on a food*, but **too vague to bridge** to a benefit + source. | Antioxidants, B Vitamins, Polyphenols, Lignans, Nitrates |
| **`hidden`** | Not yet sourced / not display-ready. Hidden everywhere until curated. | Lycopene*, any future trace nutrient added without a source |

\* **Lycopene** is interesting: it is the brief's own Tomatoes→Heart Health example, but it is currently
only a display string on "Grilled Tomatoes". To use it as a *bridge* it needs a citation; until then it
displays on the food but does not evidence a benefit. This is the model working correctly — show the
real nutrient, don't assert the outcome until sourced.

**Principle:** *a nutrient may always be shown on a food (content is low-risk); a nutrient may only
bridge to a benefit if it is `public` and the link carries a source.* Display ≠ evidence.

---

# SECTION 4 — FOOD MODEL

## 4.1 How foods map to nutrients (already built)

This layer **exists and is good** — `nutrition-benefit-library.ts`:

```ts
interface NutritionBenefit {   // (existing name; really a "FoodEntry")
  name: string;           // "Pumpkin Seeds"
  category: string;       // needs reconciliation to the 9-category enum (see §4.3)
  keyNutrients: string[]; // ["Magnesium", "Zinc", "Plant Protein"] — 2–3 each
  summary: string;        // one-sentence, already safe-worded
}
```

Lookup is normalisation-aware (`normaliseForReuse`), so "fresh pumpkin seeds" matches "Pumpkin Seeds".
The food→nutrient mapping is the part the brief worries about ("how do foods map to nutrients?") and
**it is already solved.** The only change needed is reconciling the nutrient *strings* to the controlled
vocabulary (§3.1) and the category strings to the enum (§4.3).

## 4.2 Should foods rank nutrients, show top only, or show all?

The brief asks this directly. Recommendation:

- **Show the curated `keyNutrients` (already capped at 2–3), in curated order — do NOT compute a ranking.**
- **The first nutrient is the "lead" nutrient by curator intent**, not by algorithm. The library is
  already authored most-relevant-first (e.g. Pumpkin Seeds → Magnesium first). Honour that order;
  never sort by quantity (we don't store quantities) or by frequency (that fabricates a ranking).
- **Display rule per surface:** collapsed/dense views show the lead 1–2 nutrients
  (the report already does `slice(0,2)`); expanded views show all curated nutrients.

**Why not "rank"?** Ranking implies a measured ordering THA cannot defend without per-100g data it does
not have. "Top nutrients" curated by a nutritionist is honest; "ranked nutrients" computed by code is
fabricated precision. Same trust principle as §2.1 (curated, not algorithmic).

## 4.3 Category reconciliation (carried over, still required)

`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` §4 already documented the fracture: the benefit library uses
category strings (`Herbs`, `Mushrooms`, `Fermented`, `Leafy Greens`, `Extra Veg`, `Healthy Fats`) that
do **not** match the 9-value `PlantCategory` enum in `nutrition-variety.ts`, and avocado is
double-classified. The knowledge model **shares the same foods**, so this must be fixed once, centrally:
adopt the **9 canonical categories** (Vegetables, Fruits, Legumes, Whole Grains, Nuts, Seeds, Herbs &
Spices, Fermented Foods, Healthy Fats), reconcile library strings to them, reclassify avocado → Healthy
Fats, no "Other". This is a **data-curation fix, not new claims**, and is a prerequisite for any
benefit/context grouping to be correct.

---

# SECTION 5 — NUTRITION CONTEXT MODEL (APPROVED FOR V1)

## 5.1 Key finding — Nutrition Context already exists, unstructured

The brief presents Nutrition Context as net-new. It is not. `pantry-knowledge.ts` is **already writing
exactly this content**, just in unstructured free-text fields:

| Brief's Nutrition Context category | Already present in `pantry-knowledge` as |
|---|---|
| **Best Pairings** | `goodToKnow` — *"Often paired with black pepper… supports absorption"* (turmeric) |
| **Things To Be Aware Of** | `goodToKnow` — *"rinsing before use reduces sodium"* (tinned chickpeas) |
| **Best Time** | *(not yet present — genuinely new)* |
| How to choose | `howToChoose[]` — *"cold-pressed, dark glass, recent harvest"* (EVOO) — adjacent, keep separate |

So Nutrition Context is **a formalisation of an existing editorial habit**, which dramatically lowers its
risk: curators are already writing this voice, we are just giving it structure.

## 5.2 Structured vs free text vs hybrid — RECOMMENDATION: **C (Hybrid)**

The brief asks A (structured) / B (free text) / C (hybrid). **Recommend Hybrid**, decisively:

```ts
interface NutritionContext {
  foodId: string;                       // → food canonical key
  bestTime?: BestTimeTag[];             // STRUCTURED enum — filterable, renderable as chips
  bestPairings?: PairingRef[];          // STRUCTURED refs — each links to another food, with optional note
  thingsToBeAwareOf?: AwarenessNote[];  // SEMI-STRUCTURED — typed reason + curated free-text line
}

type BestTimeTag = "morning" | "evening" | "pre-activity" | "with-meals" | "anytime";

interface PairingRef {
  food: string;                         // another food key — enables "pairs with X" cross-links
  note?: string;                        // curated, optional: "may help absorption" (NOT a claim about cure)
}

interface AwarenessNote {
  reason: "energy-dense" | "oxalates" | "absorption-interaction" | "sodium" | "caffeine" | "general";
  text: string;                         // curated free-text, safe-worded, ONE line
  sources?: SourceRef[];                // required when the note makes a physiological claim
}
```

**Why hybrid, not pure structured (A):** Best Time is a clean closed set → structured enum (filterable,
chip-renderable, no wording risk). But "Things To Be Aware Of" is irreducibly editorial — *"contains
oxalates"* vs *"energy dense"* vs *"may reduce iron absorption if eaten with iron-rich meals"* cannot be
captured by an enum alone without losing the nuance that keeps it safe. Forcing it structured would
either lose meaning or explode the enum.

**Why hybrid, not pure free text (B):** Free text cannot power Best Pairings as *links* (the brief wants
"pairs well with yoghurt and porridge" to connect foods across surfaces), cannot be filtered ("show
evening foods"), and gives no place to attach a `reason` or a `source`. Free text is unauditable.

**The hybrid wins because it makes the safe parts machine-readable (Best Time enum, Pairing refs, awareness
`reason` codes) and keeps the unsafe-to-templatise part (the actual awareness sentence) as
curator-controlled, source-backed text.** It also matches the existing data: `bestPairings` and
`thingsToBeAwareOf` are direct structurings of today's `goodToKnow`.

## 5.3 Worked examples (mapping the brief's examples onto the model)

```ts
// Pumpkin Seeds
{ foodId: "pumpkin-seeds",
  bestTime: ["morning", "evening"],
  bestPairings: [{ food: "yoghurt" }, { food: "porridge" }, { food: "salads" }],
  thingsToBeAwareOf: [{ reason: "energy-dense", text: "Energy dense — a small handful goes a long way." }] }

// Spinach
{ foodId: "spinach",
  bestPairings: [{ food: "tomatoes" }, { food: "citrus", note: "vitamin C may support iron absorption" }],
  thingsToBeAwareOf: [{ reason: "oxalates", text: "Contains oxalates, which some people prefer to vary.",
                       sources: [/* NHS / BNF */] }] }

// Coffee  (note: NOT a plant-diversity food, but a valid context-only entry)
{ foodId: "coffee",
  bestTime: ["morning"],
  thingsToBeAwareOf: [{ reason: "absorption-interaction",
    text: "May reduce iron absorption if consumed with iron-rich meals.",
    sources: [/* NHS */] }] }
```

Note how the Spinach + Coffee pairing the brief sketches (Vitamin C aids iron / coffee hinders iron)
emerges naturally from the structured `note` and `reason: "absorption-interaction"` — and is
**source-gated**: an interaction note that makes a physiological claim *must* carry a citation.

---

# SECTION 6 — TRUSTED SOURCES REVIEW

This is the critical section. A nutrition knowledge layer is only as trustworthy as its sources, and THA
**currently stores no sources at all** (`additives` table has none; the registries don't exist). The
source model must be designed before any claim is written.

## 6.1 The source storage shape

**Recommend storing all four fields the brief asks about — they are all needed:**

```ts
interface SourceRef {
  body: string;        // "NHS", "USDA FoodData Central", "NIH ODS", "EFSA"
  title: string;       // the specific page/document title
  url: string;         // direct, stable link
  evidenceLevel: "established" | "emerging";   // mirrors the claim's strength
  lastReviewed: string; // ISO date — when a human last checked the link + content
}
```

`lastReviewed` is **not optional** — it is the difference between "cited" and "maintained". A dead or
drifted link is worse than no link. It also drives the maintenance model (§9.4) and the DoD (§11).

## 6.2 Source tiering (the brief's Primary / Secondary / Reference question)

Evaluated against THA's needs (UK-first audience, public-health consensus, non-commercial, durable URLs):

| Source | Tier | Rationale |
|---|---|---|
| **NHS** (nhs.uk) | **PRIMARY** | UK public-health authority; plain-language; legally cautious wording THA can mirror; the natural default for a UK product. |
| **British Nutrition Foundation** (nutrition.org.uk) | **PRIMARY** | UK, education-focused, non-commercial, consensus-based — squarely THA's voice. |
| **NIH Office of Dietary Supplements** (ods.od.nih.gov) | **PRIMARY** | Gold-standard nutrient fact sheets (Magnesium, Iron, Zinc…) with explicit evidence grading — *ideal for the Benefit↔Nutrient bridge.* |
| **EFSA** (health claims register) | **PRIMARY (for claim wording)** | The European authority on *permitted* nutrient/health-claim wording. Use it as the **wording firewall**: if EFSA permits a claim phrasing for a nutrient, THA is on safe ground. |
| **USDA FoodData Central** | **SECONDARY (composition only)** | Authoritative for *nutrient content* of foods, NOT for health outcomes. Use to back "is a source of X", never "X helps Y". |
| **Harvard (Nutrition Source)** | **SECONDARY** | High quality, well-referenced, but US academic voice; use to corroborate, not to lead UK wording. |
| **Examine.com** | **REFERENCE ONLY** | Excellent evidence synthesis for *curators to read*, but it aggregates primary research and is partly paywalled — cite the underlying primary source it points to, not Examine itself, in user-facing `sources`. |
| Blogs, brands, influencers, AI output | **BANNED** | Never a source. |

**Decision rule for a curator:** *outcome claims (benefits, awareness interactions)* → NHS / BNF / NIH
ODS / EFSA. *Food composition (which nutrients a food has)* → USDA FDC. *Wording safety check* → EFSA
permitted-claims register. Examine/Harvard to read and corroborate, not to cite alone.

## 6.3 What must a source back?

| Claim type | Source required? | Tier |
|---|---|---|
| Food has nutrient X ("source of magnesium") | Recommended | USDA FDC / NIH ODS |
| Benefit↔Nutrient link ("magnesium → bone health") | **Required** | NIH ODS / NHS / BNF + EFSA wording check |
| Benefit description sentence | **Required** | NHS / BNF |
| Awareness note with a physiological claim (absorption, oxalates) | **Required** | NHS / BNF |
| Best Time / Best Pairings (culinary, no health claim) | Not required | — (editorial) |

Best Time and most Best Pairings are *culinary* context, not health claims, so they need no source — a
deliberate scoping that keeps the citation burden focused on the genuinely risky statements.

## 6.4 Does THA need evidence strength? (the brief's direct question)

**Yes — but as a two-valued INTERNAL gate, shown to users only minimally.**

The brief asks: Strong / Moderate / Emerging, or would it confuse users? My answer:

- **Store `established | emerging` internally on every benefit, link, and source.** This is essential —
  it is the mechanism that lets THA ship the strong stuff and hold back the speculative stuff.
- **Do NOT show a three-tier Strong/Moderate/Emerging badge on every benefit.** It *would* confuse and,
  worse, it draws the user's eye to litigate THA's confidence on a food app. Most users read "moderate
  evidence" as "THA isn't sure" — corrosive to trust.
- **Launch rule:** `established` benefits show **plainly, with no strength badge** (their presence *is*
  the confidence signal). `emerging` benefits are **either hidden at launch or shown behind an explicit,
  honest "emerging evidence" tag** — curator's choice per benefit, defaulting to hidden.
- This collapses the brief's three tiers into a clean operational rule and removes the impossible
  "is this strong or merely moderate?" curation argument.

So: evidence strength is **load-bearing internally, near-invisible externally.** That is the trustworthy
configuration.

---

# SECTION 7 — TRUST & CLAIM RULES (SAFE LANGUAGE)

## 7.1 Global THA nutrition wording guidelines

This is a **product-wide standard**, to live as a curator's rulebook and ideally a lint check on the
registries. The brief's allowed/avoid lists are correct; formalised and extended:

**ALLOWED — the only verbs/phrasings a benefit or context line may use:**

| Phrase | Use for |
|---|---|
| *supports* / *contributes to* | Nutrient → broad area ("contributes to heart health") |
| *source of* / *rich in* / *good source of* | Nutrient content (food composition) |
| *associated with* | Population-level associations, never causal |
| *may help* / *may support* | Emerging-evidence or interaction notes ("may help absorption") |
| *often consumed with* / *pairs well with* | Best Pairings (culinary) |
| *best enjoyed* / *works well* | Best Time / culinary context |

**BANNED — never appear in any user-facing nutrition copy (enforce by review + ideally automated scan):**

> treats · prevents · cures · protects against · guarantees · fights · combats · detoxes · boosts
> (as a guarantee) · heals · reverses · "good for your [organ/disease]" · any named disease/diagnosis
> · "clinically proven" · "doctor recommended"

**Structural rules (beyond word choice):**

1. **Always at the area level, never the diagnosis level.** "Supports heart health" ✅ — "prevents heart
   disease" ❌. Bridge to a broad *area*, never a *condition*.
2. **Many-to-many, never one-food-one-outcome.** Per `THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT`,
   a food relates to benefits *through nutrients*, and a benefit draws on *many* nutrients/foods. Never
   render "Pumpkin seeds = better sleep". Render "Magnesium contributes to areas including sleep
   quality; pumpkin seeds are a source of magnesium."
3. **Bridge is mandatory.** Every displayed benefit must name its bridging nutrient
   (`Heart Health · Omega-3`). A benefit with no visible nutrient is a bare claim — forbidden.
4. **Disclaimers always present.** Reuse the existing `HEALTH_DISCLAIMER` ("educational summaries, not
   medical advice") on every surface; add an "associations, not causation" note wherever benefits appear,
   and "individual needs vary — consult a professional" once per surface.
5. **No AI-generated health content, ever.** Every benefit, link, description, and awareness note is
   human-curated and human-reviewed. AI may *draft for a nutritionist to edit*, but nothing AI-authored
   ships unreviewed. (Matches the existing guardrail comment in `health-benefits-model.ts`.)
6. **EFSA wording firewall.** Before an `established` Benefit↔Nutrient claim ships, check it against the
   EFSA permitted health-claims register; if EFSA permits a phrasing for that nutrient, mirror it.

## 7.2 The fallback contract (what happens if the system is wrong)

The brief asks "what happens if the system is wrong?" — the answer is a hard, designed fallback that is
**already the live behaviour today**:

```
If a benefit is missing, unsourced, inactive, or emerging-and-hidden:
   → show Key Nutrients only (REAL data)
   → render the safe empty state from EMPTY_STATES   ("Health benefit data coming soon")
   → NEVER infer, NEVER guess, NEVER AI-fill
```

This is not a new mechanism — `getFoodHealthProfile()` already returns `healthBenefits: []` and callers
already render `EMPTY_STATES`. The fallback is the *default state*, and data is the *additive layer*.
That ordering is what makes the system safe-by-construction: being wrong degrades to showing less, never
to showing fiction.

---

# SECTION 8 — SURFACE INTEGRATION

The model is one shared layer; each surface consumes the **subset that fits its question.** The five
surface questions (from prior architecture) drive the field selection:

| Surface | Its question | Health Benefits | Key Nutrients | Nutrition Context | Notes |
|---|---|---|---|---|---|
| **Plant Diversity** | *How diverse was my week?* | ✅ 1 primary in row; "More" on expand | ✅ lead 1–2 / all on expand | ⚠️ **Best Pairings only**, on expand (as "Broaden Your Variety" feeder) | Food-first. Read-only/reflective. No Best Time/awareness clutter in a *diversity* report. |
| **Pantry Explore** | *What can I add?* | ✅ full (benefit lens) | ✅ full (nutrient lens) | ✅ **full** (Best Time, Best Pairings, Things To Be Aware Of) | The evergreen knowledge hub — the richest, most complete view. Positive only (no caution foods — per WNR doc §8). |
| **Weekly Nutrition Report** | *How did my whole week look?* | ✅ aggregated as **Strengths** ("your week supported heart & gut health") + **Gaps** | ✅ via strengths/gaps | ⚠️ light — surface awareness only where a flagged food appears | Synthesis layer. Benefits roll up to strengths; gaps drive "Choose Better". |
| **Simply Better Choices** | *How can I improve this meal?* | ❌ not the headline | ✅ **Key Nutrients** of the suggested addition | ✅ **Best Pairings + Best Time** (why this addition fits here/now) | Action surface. Context answers "why add this, and when". Per-meal, not encyclopedic. |
| **Analyser** | *Is this product a good choice?* | ✅ **only where trustworthy** (resolved product, bridged) | ✅ where present | ✅ **Things To Be Aware Of** (most relevant here) | Gated by `apple-score-trust` — never show a benefit for an unresolved item. Drives "Choose Better". |

## 8.1 Field-to-surface matrix (the brief's "which fields on which surfaces")

| Field | Plant Diversity | Pantry Explore | Weekly Report | Simply Better Choices | Analyser |
|---|:--:|:--:|:--:|:--:|:--:|
| Health Benefit (primary) | ● | ● | ● (as Strength) | ○ | ◐ gated |
| More Health Benefits | ● expand | ● | ○ | ○ | ◐ gated |
| Key Nutrients | ● | ● | ● | ● | ● |
| Best Time | ○ | ● | ○ | ● | ○ |
| Best Pairings | ● expand | ● | ○ | ● | ○ |
| Things To Be Aware Of | ○ | ● | ◐ | ○ | ● |
| Your Variety / Broaden | ● | ○ | ○ | ○ | ○ |
| Choose Better (deep-link) | ○ | ○ | ● | ● | ● |

● = primary · ◐ = conditional/gated · ○ = absent

**Governing principle (unchanged from prior docs): one surface, one question.** The shared model means
all five speak the same vocabulary (`TERMINOLOGY`, `COLUMN_LABELS`) and read the same data, but each
*shows only what its question needs.* Pantry Explore is the only surface that shows everything, because
its question ("what can I add?") is the encyclopedic one.

---

# SECTION 9 — DATA POPULATION STRATEGY

## 9.1 Static / DB / Hybrid — RECOMMENDATION: **C (Hybrid), static-first**

The brief asks A (static curated registry) / B (database table) / C (hybrid). **Recommend Hybrid with a
static-first launch**, which in practice means: **launch as a static curated TypeScript registry, with a
schema designed for a clean later migration to DB.**

| Option | Verdict |
|---|---|
| **A — Static curated registry (TS files)** | ✅ **Launch approach.** Matches every existing pattern: `nutrition-benefit-library.ts`, `nutrition-boosts.ts`, `pantry-knowledge.ts` are all static curated TS. Zero schema, zero migration, instant rollback (delete file), version-controlled, code-reviewable diffs, type-safe. For ~24–30 foods × 8 benefits this is *more* maintainable than a DB, not less. |
| **B — Database table** | ❌ Not for V1. Adds schema + migration + admin tooling for data that changes monthly, by one curator, at small scale. Premature. **But** the right *destination* once there is non-engineer curation, or per-user/locale variation, or the dataset outgrows hand-editing. |
| **C — Hybrid** | ✅ **The strategy.** Ship A; design the registry shapes (§2, §3, §5, §6) to be **1:1 mappable to DB rows** so the later migration is mechanical. The `sources` field, ids, and `lastReviewed` are deliberately DB-shaped from day one. |

## 9.2 Launch approach (concrete)

Author three new static client libraries (data only — the adapter to consume them already exists):

```
client/src/lib/health-benefits-registry.ts   →  HealthBenefitTopic[] + BenefitNutrientLink[]
client/src/lib/nutrition-context-registry.ts →  NutritionContext[]  (formalises pantry-knowledge proto data)
client/src/lib/nutrients-vocabulary.ts        →  Nutrient[]  (controlled vocabulary, §3)
```

Then wire them into the **existing** `health-benefits-model.ts` adapter so `getFoodHealthProfile()`
returns real `healthBenefits` (through the nutrient bridge) and `listHealthBenefitTopics()` returns the
8 topics. **No UI change is needed** — the empty states disappear as data appears, exactly as the
shipped implementation report (§14) anticipated.

## 9.3 Migration path (static → DB, when triggered)

The migration is mechanical because the shapes are already row-shaped:

```
HealthBenefitTopic[]   → health_benefit_topics table
BenefitNutrientLink[]  → benefit_nutrient_links table (FK benefit_id, nutrient_id)
Nutrient[]             → nutrients table
NutritionContext[]     → nutrition_context table (+ best_pairings, awareness_notes child tables)
SourceRef (embedded)   → sources table (+ join rows) — THIS is the one schema item to add early-ish
```

**Trigger for migration:** a non-engineer needs to edit content, OR per-locale/per-user variation is
needed, OR the dataset exceeds ~100 foods. None of these are true at launch.

## 9.4 Maintenance model

- **Owner:** one curator (nutrition-literate) + nutritionist reviewer sign-off before any `established`
  claim ships.
- **Cadence:** review every `SourceRef.lastReviewed` on a fixed schedule (e.g. 6-monthly); a link past
  its review date auto-demotes its claim to the fallback (show nutrients only) until re-verified.
- **Change control:** registry edits are normal PRs — diffable, reviewable, revertable. The `active`
  flag allows instant retraction without a deploy-shaped deletion.
- **Provenance:** every claim traces benefit → nutrient → source → lastReviewed. Fully auditable.

---

# SECTION 10 — YOUR VARIETY & BROADEN YOUR VARIETY

## 10.1 The distinction (wording approved; mechanics need building)

`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` §7 found a **mislabel in the live code**: today's per-row
"Broaden Your Variety" actually shows *only the variant forms the user already used* (`row.variants`) —
it suggests nothing new. The approved model corrects this into two clearly distinct mechanics:

| Concept | Means | Data source | Example |
|---|---|---|---|
| **Your Variety** | The forms of this plant **you already ate** this week | `WeekMealEntry` ingredients (real usage) | Tomatoes → *Cherry, Plum* |
| **Broaden Your Variety** | New forms/foods **to try next** that you have **not** used | Curated suggestion pool, minus used | Tomatoes → *Heirloom, Yellow, Beefsteak* |

**Required naming fix:** rename the current per-row variant display to **"Your Variety"** (or "Forms you
used"), and reserve **"Broaden Your Variety"** for the actual suggestion mechanic. One name, one meaning.

## 10.2 Should recommendations be same family / same nutrients / same category / all of the above?

The brief offers four options. **Recommendation: same category, ordered by nutrient overlap — NOT "all
of the above".**

- **Primary signal: same category** (a Seed suggests other Seeds; Tomatoes suggest other tomato
  varieties / other red Vegetables). This matches the 30-plants mental model — more *kinds* within a
  group — and is intuitive and curatable.
- **Secondary signal: nutrient overlap** to *order* the same-category candidates (suggest the ones that
  share or complement the food's key nutrients first). The data exists: `buildNutrientIndex()` already
  inverts foods→nutrients.
- **Source: curated pool, exclude what's already used.** Reuse the existing `CATEGORY_SUGGESTIONS` /
  benefit library as the candidate set; subtract this week's plants so every suggestion is actionable.
- **Reject "all of the above" / free cross-category nutrient matching.** It produces surprising,
  hard-to-trust pairings (a fortified grain suggested next to a seed "for omega-3"). Surprise erodes
  trust in a knowledge product.

So: **same category (primary) + nutrient overlap (ordering) + curated + exclude-used.** This is the
"Broaden Your Variety" engine; "Your Variety" is just the real usage echo.

---

# SECTION 11 — LAUNCH DEFINITION OF DONE

**Health Benefits V1** and **Nutrition Context V1** are launch-ready when ALL of the following hold:

**Sources**
- [ ] Every `established` benefit and every Benefit↔Nutrient link carries ≥1 `SourceRef` (NHS / BNF /
      NIH ODS / EFSA) with `url` + `lastReviewed`.
- [ ] Every awareness note that makes a physiological claim carries a source.
- [ ] `lastReviewed` set for all sources; review cadence agreed.

**Trust**
- [ ] Nutritionist sign-off on all 5 (minimum) or 8 (ideal) benefits and all bridge links.
- [ ] EFSA wording firewall applied to all `established` claims.
- [ ] Zero AI-generated health content; all curation human-reviewed.
- [ ] `emerging` benefits hidden (or explicitly tagged); none shown as `established`.

**Wording**
- [ ] All copy passes the allowed/banned wording standard (§7.1); ideally an automated scan exists.
- [ ] Area-level, many-to-many, nutrient-bridged — no diagnosis-level or one-food-one-outcome claims.
- [ ] `HEALTH_DISCLAIMER` + "associations not causation" present on every benefit-bearing surface.

**Completeness**
- [ ] Nutrient controlled vocabulary built; every `keyNutrients` string reconciled to it; `public` /
      `internal` / `hidden` set.
- [ ] 9-category enum reconciled across library + counter; avocado reclassified.
- [ ] Every curated food resolves to ≥1 real fact (key nutrients) — benefit optional, never required.
- [ ] Nutrition Context populated for the launch food set (Best Time / Pairings / Awareness as applicable).

**Surface integration**
- [ ] All five surfaces consume the shared model; field-to-surface matrix (§8.1) honoured.
- [ ] Benefits render through the existing adapter with no per-surface forked logic.

**Responsiveness** *(inherited from Plant Diversity DoD)*
- [ ] Benefit/context chips wrap; no overflow at 375/640/768/1024/1280/1536; density-aware.

**Maintenance**
- [ ] Registries are static TS, PR-reviewable, revertable; `active` kill-switch works.
- [ ] Review cadence + owner assigned; migration path documented (this doc).

**Fallback behaviour**
- [ ] Missing/unsourced/inactive/hidden benefit → Key Nutrients only + safe empty state. Verified live.
- [ ] Analyser benefits gated by `apple-score-trust`; never shown for unresolved items.

---

# SECTION 12 — RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Pressure to fabricate / AI-fill benefits to hit a "flagship" launch.** | 🔴 High | Ship the minimum 5 `established` benefits only; everything else falls back to nutrients. Curated + sourced + reviewed is the gate. *This is the defining risk* (carried from prior docs). |
| R2 | **Nutrient string drift silently breaks the bridge** (`Omega-3` vs `Omega 3`). | 🟠 Medium | Build the controlled vocabulary (§3) FIRST; reconcile all `keyNutrients`; lint that every bridge nutrient is `public` and exists. |
| R3 | **Diagnosis-level wording creep** ("prevents", "good for diabetes"). | 🔴 High | Banned-word scan (§7.1) + nutritionist review + EFSA firewall + area-level-only rule. |
| R4 | **Stale / dead sources** make a cited claim hollow. | 🟠 Medium | `lastReviewed` mandatory; past-due claim auto-demotes to fallback; 6-monthly review. |
| R5 | **Category fracture** (Olive Oil vs Healthy Fats, avocado, off-enum library strings). | 🟠 Medium | §4.3 reconciliation before grouping/filtering goes live (carried from Plant Diversity doc). |
| R6 | **"Broaden Your Variety" still mislabelled** at launch (shows used forms, not suggestions). | 🟠 Medium | §10 rename + build the curated same-category suggestion engine. |
| R7 | **Evidence-strength badges confuse users / invite confidence-litigation.** | 🟡 Low | Strength is internal; `established` shown plainly, `emerging` hidden/tagged (§6.4). |
| R8 | **Nutrition Context over-templatised** loses the nuance that keeps awareness notes safe. | 🟡 Low | Hybrid model (§5.2): structure the safe parts, keep awareness sentences curator-controlled + sourced. |
| R9 | **Surface sprawl** — every surface tries to show everything → clutter + the "one surface one question" line blurs. | 🟠 Medium | Enforce the field-to-surface matrix (§8.1); only Pantry Explore is encyclopedic. |
| R10 | **Benefit with no bridging nutrient renders empty** (e.g. shipping Sleep Quality without coverage). | 🟡 Low | V1 set chosen *by* existing nutrient coverage (§2.2); Sleep Quality ships `emerging`/hidden. |
| R11 | **Schema premature-optimisation** — building DB tables before they're needed. | 🟡 Low | Static-first (§9); migrate only on a named trigger. |

---

# SECTION 13 — FINAL RECOMMENDATION

**Build two small, curated, source-backed static registries — not new machinery.** The shared display
model, the trust guardrails, the vocabulary, the empty-state fallback, and the food→nutrient data all
already exist and already render whatever data lands. This investigation's entire output reduces to:
*author the data, safely, behind the nutrient bridge, and wire it into the adapter that is already
waiting for it.*

The five surfaces are not five problems. They are **one knowledge layer with five viewports.** The
layer is:

```
Health Benefit ──(curated, cited)──> Nutrient ──(already exists)──> Food ──> Nutrition Context ──> Meals ──> Actions
   8 topics          bridge links      controlled vocab   library      hybrid registry    week seam   cross-links
   (5 min / 8 ideal)                                                   (formalises proto data)
```

Every benefit is **derived through a shared nutrient, never asserted about a food**; every claim is
**curated, cited, reviewed, and area-level**; every gap **falls back to real nutrients, never to
fiction**. This is the trustworthy construction, and it is achievable for launch because the data is
small and the engine is built.

**Do not** chase completeness or a three-tier evidence UI or a DB schema. Ship 5 established benefits,
structured Nutrition Context for the existing foods, a controlled nutrient vocabulary, and a source
model with review dates. That is a launch-ready, trustworthy nutrition knowledge layer.

---

# FINAL REPORT (required 13 answers)

1. **Rollback identifier:** `rollback/health-benefits-v1-design-20260618` → commit `bae3b99`
   (tag object `d0ded8b`). Restore: `git reset --hard rollback/health-benefits-v1-design-20260618`.

2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.

3. **Recommended Health Benefits model:** `HealthBenefitTopic { id, name, icon, description,
   evidenceStrength(established|emerging), displayPriority, sources[], active }` linked to foods **only**
   via `BenefitNutrientLink { benefitId, nutrient, strength, sources[] }` (the nutrient bridge). **V1
   set:** minimum **5** (Heart Health, Gut Health, Bone Health, Immune Support, Energy); ideal **8**
   (+ Muscle Function, Brain Health, Sleep Quality[emerging]); defer Blood Sugar Balance & Satiety.
   One curated *primary* benefit per food in dense views; "More Health Benefits" on expand; **curated
   ranking, never algorithmic**.

4. **Recommended Nutrition Context model:** **Hybrid (Option C).** Best Time = structured enum;
   Best Pairings = structured food-refs with optional notes; Things To Be Aware Of = typed `reason` +
   curated source-backed sentence. Formalises the proto data already in `pantry-knowledge.goodToKnow`.

5. **Recommended trusted sources:** **Primary** — NHS, British Nutrition Foundation, NIH ODS, EFSA
   (also the wording firewall). **Secondary** — USDA FoodData Central (composition only), Harvard
   Nutrition Source. **Reference only (curators, don't cite alone)** — Examine. **Banned** — blogs,
   brands, AI. **Store all four fields:** Source Name (`body`+`title`), URL, Evidence Level,
   Last Reviewed (mandatory). Evidence strength = **two-valued internal gate** (established|emerging),
   shown to users minimally (established plainly, emerging hidden/tagged) — three tiers would confuse.

6. **Recommended wording rules:** Allowed — *supports, source of, contributes to, associated with, may
   help, often consumed with, pairs well with*. Banned — *treats, prevents, cures, protects against,
   guarantees, fights, detox, heals, reverses, any named disease, "clinically proven"*. Structural:
   area-level not diagnosis-level; many-to-many nutrient-bridged; disclaimer always present; no
   AI-generated health content; EFSA firewall on established claims.

7. **Recommended surface integrations:** Plant Diversity = primary benefit + nutrients + Best Pairings
   (food-first). Pantry Explore = **full** model (the encyclopedic hub). Weekly Report = benefits→
   Strengths/Gaps. Simply Better Choices = nutrients + Best Pairings/Best Time of the suggested addition.
   Analyser = benefits + Things To Be Aware Of, **gated by `apple-score-trust`**. One surface, one
   question; field-to-surface matrix in §8.1.

8. **Recommended data population strategy:** **Hybrid, static-first (Option C/A).** Launch as three
   curated static TS libraries (`health-benefits-registry`, `nutrition-context-registry`,
   `nutrients-vocabulary`) wired into the existing `health-benefits-model.ts` adapter — **no schema, no
   migration, no UI change**. Shapes are DB-row-shaped for a mechanical later migration triggered by
   non-engineer curation / locale variation / >100 foods. Maintenance = one curator + nutritionist
   sign-off + `lastReviewed` review cadence + `active` kill-switch.

9. **Recommended Your Variety model:** **Your Variety** = forms you already ate (real usage echo);
   **Broaden Your Variety** = new curated suggestions you haven't used, **same category (primary) +
   nutrient overlap (ordering) + exclude-used** — *not* "all of the above". Requires renaming today's
   mislabelled per-row variant display.

10. **Launch Definition of Done:** §11 — sources cited + reviewed; nutritionist + EFSA sign-off; wording
    standard passed; nutrient vocabulary + category enum reconciled; all five surfaces consume the shared
    model; responsive; static/revertable with review cadence; **fallback verified** (missing benefit →
    nutrients only + safe empty state; Analyser gated).

11. **Risks:** §12 — top risks: R1 pressure to fabricate (🔴), R3 diagnosis-level wording creep (🔴),
    R2 nutrient-string drift breaking the bridge (🟠), R4 stale sources (🟠), R5 category fracture (🟠),
    R6 mislabelled variety (🟠), R9 surface sprawl (🟠).

12. **Confidence level:** **High** on the code-grounded architecture (shared adapter, nutrient bridge,
    fallback, proto-context in `pantry-knowledge`, category fracture, mislabelled variety — all verified
    in source). **Medium** on the exact curated content (the 8 benefits, the specific bridge links and
    sources) — that is editorial/nutritionist work that does not yet exist and must not be guessed or
    AI-generated.

13. **Confirmation — no code changes made:** ✅ Confirmed. No code, CSS, route, schema, API, migration,
    data population, AI-generated health claims, or commits beyond the rollback tag. Only artefacts
    created: this markdown file and the annotated git tag `rollback/health-benefits-v1-design-20260618`.

---

## TRUST CHECK (brief's required self-audit)

- **Could this mislead users?** Potentially — *mitigated*: only source-backed, nutritionist-reviewed,
  area-level claims; everything else falls back to real nutrients.
- **Could this fabricate certainty?** Potentially — *mitigated*: nutrient bridge (derived, not
  asserted), two-tier internal evidence gate, `emerging` hidden, no algorithmic ranking.
- **Is anything guessed but shown as real?** **No** — `getFoodHealthProfile()` returns `[]` until a
  curated entry exists; the fallback is the default state.
- **What happens if the system is wrong?** Fallback: **show Key Nutrients only, hide unsupported
  benefits, render the safe empty state** — never infer, never AI-fill.

---

**Investigation completed:** 2026-06-18
**Rollback available:** `git reset --hard rollback/health-benefits-v1-design-20260618`
