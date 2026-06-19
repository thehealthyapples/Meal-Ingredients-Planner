# WS2D — Canonical Nutrition Knowledge Architecture

> **One food. One source of nutritional truth. Many surfaces.**
>
> This is an **investigation only**. No code, schema, route, migration, data, or
> UI change is made. The only artefacts are this document and one rollback tag.

| | |
|---|---|
| **Document type** | Investigation + target architecture (no implementation) |
| **Date** | 2026-06-19 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Author role** | Senior nutrition-education product architect + senior React/Node engineer |
| **Rollback tag** | `rollback/ws2d-pre-investigation-20260619` → commit `df28cf6` |
| **Restore command** | `git reset --hard rollback/ws2d-pre-investigation-20260619` |
| **Undo this doc only** | `rm docs/investigations/WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md` |

**Companion documents (read these first — WS2D sits on top of all of them):**
- `WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md` — canonical identity spine (shadow mode).
- `WS2B_VARIETY_SURFACING_IMPLEMENTATION.md` — Your / Broaden Variety (read-only).
- `WS2C_FOOD_REPORT_ENRICHMENT.md` — Food Report composition layer + the two-forked-stacks finding.
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the nutrient-bridge trust model.
- `WS0_KNOWLEDGE_FOUNDATIONS_IMPLEMENTATION.md` — the structured `knowledge_*` registry.
- `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` / `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` — editorial workflow.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed.** Branch `safety/preserve-since-last-prod-20260617-1613`. Working tree clean except one untracked file: the WS2C investigation doc.
2. ✅ **WS2A / WS2B / WS2C protected.**
   - WS2A → tag `rollback/ws2a-pre-impl-20260618`.
   - WS2B → tag `rollback/ws2b-pre-impl-20260619` (full tree snapshot `fbe4ef9`).
   - WS2C → tag `ws2c-rollback-baseline` + commit `2fcb754`; the **untracked** WS2C investigation doc was committed (`df28cf6`) so it is no longer at risk in the working tree.
3. ✅ **Rollback point created** — tag **`rollback/ws2d-pre-investigation-20260619`** → commit **`df28cf6`**.
4. ✅ **Rollback identifier reported** (top of doc + here).

**This task changes nothing executable.** Reads existing data: **YES**. Writes new data: **NO**. Changes meaning of existing data: **NO**. Requires backfill: **NO**.

---

# EXECUTIVE SUMMARY

The Healthy Apples does not have *too little* nutrition knowledge — it has the
**same knowledge stored four times in four shapes with three different slug
conventions**, and no single owner. A tomato is `tomato` in the canonical spine,
`tomatoes` in the WS0 registry and pantry-knowledge, and `Tomatoes` (display
name) in the benefit library; olive oil is additionally `olive oil` as a
normalised key. Nothing currently *forces* these to agree, so a food **can** say
different things in Food Report, Pantry, Planner and Shopping — not because anyone
authored a contradiction, but because four stores drift independently.

**The good news (verified in source):** the convergence target already exists in
embryo. WS0 (`knowledge_*` tables + `shared/knowledge/*`) is a real, structured,
evidence-stored **Food → Nutrient → Benefit** registry. WS2A (`canonical_food` +
resolver) is a real **identity spine** with a hard anti-fork lock
(`UNIQUE(alias_key)`) and an explicit `knowledge_food_slug` FK that already links
the spine to WS0. The missing piece is not a new database — it is a **single
canonical read model** that joins identity (WS2A) to knowledge (WS0), absorbs the
three new knowledge dimensions WS2C scoped (Pairings, Healthier Alternatives,
Nutrition Context), and is read by every surface through **one adapter**.

**Recommendation (Section 2): Option A+ — WS0 becomes the editorial authority for
knowledge, WS2A becomes the identity authority, and a thin "Canonical Nutrition
Knowledge" read-model (`buildFoodKnowledge(canonicalSlug)`) joins them.** No third
registry. The client libraries (`nutrition-benefit-library`, `pantry-knowledge`,
`nutrition-boosts`) are **demoted to a display cache** and converged into WS0 one
fact-type at a time, behind the resolver, with the existing live behaviour as the
parity gate — exactly the additive + shadow discipline WS2A/WS2B already proved.

**One line:** *one identity (WS2A) + one knowledge registry (WS0) + one join
adapter + many thin surfaces — converge, never add a fifth store.*

---

# SECTION 1 — AUDIT OF ALL NUTRITION SYSTEMS

All rows below were verified against source on `df28cf6`, not inferred from prior
docs.

## 1.1 System inventory

| # | System | Location | Storage | Shape (food → …) | Keying | Status |
|---|---|---|---|---|---|---|
| 1 | **WS0 Knowledge Registry** | `shared/knowledge/{foods,nutrients,health-benefits,relationships}.ts` → `knowledge_*` tables (6 tables) | **DB + typed seed** | nutrients → benefits, with `ranking`, `confidence`, `evidenceStrength`, `source` | slug, plural (`tomatoes`, `extra-virgin-olive-oil`) | ✅ Real, seeded server-side |
| 2 | **nutrition-benefit-library** | `client/src/lib/nutrition-benefit-library.ts` | **Client const** (25 entries) | key nutrients (2–3) + one-line `summary` + `category` | **display name** (`"Pumpkin Seeds"`) normalised via `normaliseForReuse` | ✅ Real — *the source the report reads today* |
| 3 | **pantry-knowledge** | `client/src/lib/pantry-knowledge.ts` | **Client const** (46 entries) | `whyItMatters`, `goodToKnow`, `howToChoose`, `highlights`, `supports`, `tags` | **normalised key** (`"olive oil"`, `"tomatoes"`) | ✅ Real — proto Nutrition Context |
| 4 | **health-benefits-model** | `client/src/lib/health-benefits-model.ts` | **Adapter only** (no data) | `FoodHealthProfile` over #2 + #3; `TERMINOLOGY`, `EMPTY_STATES`, `HEALTH_DISCLAIMER` | `normaliseForReuse(ingredient)` | ✅ Real plumbing — `healthBenefits: []` **always** (honest empty) |
| 5 | **Nutrition Boosts** | `client/src/lib/nutrition-boosts.ts` | **Client const** | `BOOST_LIBRARY` by `BoostCategory` (legumes/seeds/nuts/herbs/mushrooms/fermented/healthy-fats/extra-veg) | **display name** (`"Chickpeas"`) | ✅ Real — meal-level suggestions |
| 6 | **WS2A Canonical Food** | `shared/canonical/{foods,resolver,variety,shadow,index}.ts` + `canonical_food*` tables | **DB + typed seed** | identity: food ↔ alias ↔ variety ↔ diversity group; `knowledge_food_slug` FK → WS0 | slug, singular (`tomato`) + `UNIQUE(alias_key)` | ✅ Real, **shadow mode** (nothing reads it in prod) |
| 7 | **WS2B Variety** | `shared/canonical/variety.ts` + `PlantDiversityReport.tsx` | derives from #6 seed | Your / Broaden variety chips | via resolver | ✅ Real, read-only |
| 8 | **Apple Score** | `shared/apple-score-trust.ts`, `basket-item-classifier.ts` | trust-gated scorer | product/basket quality rating | product, not food | ✅ Real — **different domain** (rates products, not educates about foods) |

**Scale of duplication today:** WS0 covers **51 foods**; benefit-library **25**;
pantry-knowledge **46**; WS2A canonical seed **26** (proving set). The same foods
recur across three of these with three slug conventions.

## 1.2 Responsibilities (who *should* own what)

| Concern | Natural owner | Why |
|---|---|---|
| Food **identity** (is "passata" the same food as "tomato"?) | **WS2A** | Already the spine; has the anti-fork lock and resolver. |
| **Nutrients** a food contributes | **WS0** | Structured `FOOD_NUTRIENTS`, ranked, sourced. |
| **Benefits** (via nutrient bridge) | **WS0** | `FOOD_BENEFITS` + `NUTRIENT_BENEFITS`, evidence-stored. |
| **Nutrition Context** prose ("cooking ↑ lycopene") | **WS0 (new typed field)** | Today lives unstructured in pantry-knowledge #3; promote, don't fork. |
| **Varieties** | **WS2A** (`food_variety`) | Already there; shares diversity group. |
| **Pairings** | **NEW WS0 registry** | No store exists anywhere. |
| **Healthier Alternatives** | **NEW WS0 registry** | No store exists anywhere. |
| **Boost ideas** (meal-aware) | **Nutrition Boosts #5**, keyed by canonical slug | Meal-context, not food-intrinsic — keep, re-key. |
| **Diversity counting** | live `nutrition-variety.ts` (until parity cutover) | Unchanged; WS2A shadow proves parity first. |
| **Product quality score** | **Apple Score** | Separate domain — firewalled, never feeds knowledge. |

## 1.3 Overlaps & duplicated facts (the core risk, verified)

1. **Two parallel nutrition stacks.** Structured **WS0** (DB, evidence-stored) vs
   curated **client libraries** (#2 + #3). The report renders from the client
   stack; the benefits live in WS0 — which is *exactly why
   `health-benefits-model.getFoodHealthProfile` returns `healthBenefits: []`*
   (verified: line 143, hard-coded empty with an honest comment). **This is the
   single biggest convergence target.**
2. **Three slug conventions for one food.** Verified:
   - WS0: `tomatoes`, `extra-virgin-olive-oil`
   - WS2A: `tomato`, `extra-virgin-olive-oil`
   - pantry-knowledge: `tomatoes`, **`olive oil`** (a fourth, normalised-key form)
   - benefit-library: `"Tomatoes"` display name → `normaliseForReuse`
   Nothing forces these to agree. The WS2A `knowledge_food_slug` FK is the *only*
   explicit bridge that exists, and only between WS2A↔WS0.
3. **Two "why it matters" prose stores:** `pantry-knowledge.whyItMatters/goodToKnow`
   and WS0 `health-benefits.description`. A naive Nutrition Context section would
   become a **third**.
4. **Three "what can we add?" surfaces** that must not contradict: Broaden Your
   Variety (WS2B, food-level), Nutrition Boosts (#5, meal-level), Category
   Completion Suggestions (report-level). Each has its own list source.
5. **"Healthy fats" appears three times:** a WS2A `category`, a Boost
   `BoostCategory`, and a WS0 food category. (WS2C resolved this: it is a
   *category lens*, never a section — carried forward here.)

## 1.4 Conflicting ownership

- **No single owner of "what is true about food X".** WS0 owns structured
  relations; the client libs own the prose and the nutrients that actually render.
  Neither is authoritative; both are edited independently.
- **No owner of cross-food relations at all** (Pairings, Alternatives) — genuinely
  missing, so there is nothing to converge there, only to *create once, correctly*.

## 1.5 Missing concepts

| Concept | Exists? | Where it would live |
|---|---|---|
| Pairings (food → food, typed) | ❌ nowhere | NEW WS0 registry (§4) |
| Healthier Alternatives (food → food, reasoned) | ❌ nowhere | NEW WS0 registry (§5) |
| Nutrition Context (typed, sourced) | ⚠️ unstructured in pantry-knowledge | promote into WS0 (typed field) |
| Wired Health Benefits in the report | ⚠️ data in WS0, unread by UI | the join adapter (§3) |
| One slug that every surface keys on | ❌ four conventions | WS2A canonical slug (§2) |
| Editorial review state per fact | ⚠️ partial (`source`, `confidence`, `evidenceStrength` on WS0 relations only) | extend WS0 trust metadata (§3.4) |

---

# SECTION 2 — WHAT BECOMES THE CANONICAL SOURCE?

## 2.1 The three options, assessed

| | **A. WS0 is the authority** | **B. Client libraries are the authority** | **C. New unified registry** |
|---|---|---|---|
| **Pros** | Already structured, DB-backed, evidence-stored, validated (referential-integrity check refuses dangling slugs); server-editable; the nutrient-bridge trust model lives here. | Already what the UI reads; zero wiring change; fast. | Clean slate; could model everything (pairings, alternatives, context) natively. |
| **Cons** | Not yet wired to the report; slug form differs from UI keys. | Unstructured prose; no evidence model; no relations; client-only (no editorial tooling); would entrench the duplication. | A **fifth** store — the exact failure mode this workstream exists to end; huge migration; throws away two working systems. |
| **Migration complexity** | **Medium** — wire adapter, reconcile slugs via WS2A resolver. | Low but **wrong direction** — locks in the fork. | **Very high** — re-author + re-validate everything. |
| **Editorial workflow** | Typed seeds + seed runner + integrity gate already exist; admin tooling designed in companion docs. | None — edits are code changes to client consts. | Would need to be built from scratch. |
| **Long-term maintainability** | **High** — one structured owner, evidence-aware. | Low — prose drifts, no relations. | Low until built; then duplicates A. |

## 2.2 Recommendation — **Option A+ (refined A)**

**Adopt WS0 as the single editorial knowledge authority, WS2A as the single
identity authority, and add a thin join adapter — not a new registry.**

> **Canonical Nutrition Knowledge = WS2A identity ⨝ WS0 knowledge, read through one
> adapter. The client libraries become a display cache that is converged into WS0
> one fact-type at a time.**

Why A+ and not pure A, B, or C:
- **Not B** — making the unstructured client libs authoritative would entrench the
  fork and discard WS0's evidence model. Wrong direction.
- **Not C** — a brand-new registry is the fifth store the whole effort is meant to
  prevent; it would re-create the WS0 work and require re-validating every fact.
- **A+ over plain A** — plain A says "WS0 wins"; A+ adds the crucial detail that
  **identity is WS2A's job, not WS0's** (WS0 has no alias/variety model), so the
  authority is *split by concern*: WS2A owns *which food*, WS0 owns *what's true
  about it*. The `knowledge_food_slug` FK that already exists is the seam.

**The canonical slug is the WS2A canonical slug** (`tomato`), because only WS2A has
the anti-fork uniqueness guarantee. WS0 keeps its own slugs; the FK reconciles
them. Every surface resolves free text → canonical slug → adapter.

---

# SECTION 3 — THE CANONICAL MODEL

## 3.1 Target read shape (the join, not a new table)

```
CanonicalFoodKnowledge {                       ── assembled by buildFoodKnowledge(slug)
  // identity (WS2A — authoritative)
  canonicalSlug        string                  ← canonical_food.slug
  name                 string
  category             string
  description          string | null           ← canonical_food.description (preferred)
  diversityGroupSlug   string | null
  varieties            Variety[]               ← food_variety (WS2A)

  // knowledge (WS0 — authoritative, via knowledge_food_slug FK)
  nutrients            RankedNutrient[]         ← knowledge_food_nutrients (ranking, confidence)
  benefits             BridgedBenefit[]         ← knowledge_food_benefits ⨝ knowledge_nutrient_benefits
  nutritionContext     ContextLine[]            ← promoted pantry-knowledge → WS0 typed field
  commonForms          string[]                 ← knowledge_foods.common_forms
  seasonality          string | null            ← knowledge_foods.seasonality
  storageGuidance      string | null            ← knowledge_foods.storage_guidance

  // cross-food relations (NEW WS0 registries, canonical-slug-keyed)
  pairings             Pairing[]                ← NEW (§4)
  healthierAlternatives Alternative[]           ← NEW (§5)

  // action (meal-context only)
  boostIdeas           BoostItem[]              ← nutrition-boosts, re-keyed by canonical slug

  // trust
  sources              Source[]                 ← per-fact source/confidence/evidence (stored)
  editorialReview      ReviewState | null       ← NEW lightweight review metadata (§3.4)
}
```

This is a **read model** assembled at request time from existing tables plus two
new small registries — **not** a new master table that must be kept in sync.
"One food, one truth" is achieved by **single ownership per fact-type**, not by
copying everything into one row.

## 3.2 Required vs optional fields

| Field | Required? | Rule |
|---|---|---|
| `canonicalSlug`, `name`, `category` | **Required** | Identity must exist (WS2A). |
| `description` | Optional | Falls back canonical → WS0 → none; never fabricated. |
| `nutrients` | Optional, **shown when present** | The report's reliable core. |
| `benefits` | Optional | **Hard fallback:** if the nutrient bridge doesn't support a benefit, show nutrients only — never an unsupported benefit. |
| `nutritionContext` | Optional | Descriptive, sourced, typed; never prescriptive. |
| `varieties` | Optional | WS2B discipline: show nothing if none defined. |
| `pairings`, `healthierAlternatives` | Optional | Render nothing when empty; **reason required** on each. |
| `boostIdeas` | Conditional | Meal context only. |
| `sources` / `editorialReview` | Stored, mostly not surfaced in V1 | Trust metadata. |

**Universal rule (carried from WS2B/WS2C): missing data renders nothing. No empty
cards, no placeholder prose, no fabricated certainty.**

## 3.3 Relationships

```
diversity_group ─1:N─ canonical_food ─1:N─ food_variety
                            │
                            ├─ knowledge_food_slug (FK, nullable) ─▶ knowledge_foods
                            │         └─ knowledge_food_nutrients ─▶ knowledge_nutrients
                            │         └─ knowledge_food_benefits  ─▶ knowledge_health_benefits
                            │                 (and knowledge_nutrient_benefits = the bridge)
                            ├─ pairings[]            (NEW: canonicalSlug → canonicalSlug, typed)
                            ├─ healthier_alternatives[] (NEW: fromSlug → toSlug, reasoned)
                            └─ canonical_food_alias (UNIQUE alias_key — the anti-fork lock)
```

Every cross-food edge (variety, pairing, alternative) is keyed by **canonical
slug**, so the resolver makes the whole Pantry a navigable graph for free.

## 3.4 Trust & evidence metadata

WS0 already stores, per relationship row: `source` (default "THA editorial"),
`confidence` (food↔nutrient: established/good/emerging), `evidenceStrength`
(food↔benefit & nutrient↔benefit: established/good/emerging — **stored, not
surfaced in V1**). WS2D extends this *pattern* (does not invent a new one) to the
new registries and to context lines:

- Every Pairing, Alternative and Context line carries `source` + an evidence/kind
  tag — the same discipline as WS0 relations.
- **New lightweight `editorialReview`** (proposed, additive): `reviewedBy`,
  `reviewedAt`, `status ∈ {draft, reviewed, retired}` on knowledge foods / new
  registries. Mirrors WS2A's `status` column philosophy: **facts are retireable,
  never deleted.**
- **Uncertainty is stored, shown conservatively.** Emerging-evidence benefits stay
  hidden in V1; the fallback always degrades to nutrients-only.

---

# SECTION 4 — PAIRINGS

**Concept:** Tomato → Olive oil / Basil / Mozzarella; Spinach → Lemon / Chickpeas
/ Garlic.

## 4.1 Storage model (proposed — not implemented)

A curated, canonical-slug-keyed registry — symmetric in meaning, stored once,
surfaced both ways:

```
PAIRINGS: { slug: [{ pairSlug, kind, note?, source }] }
"tomato":  [{ pairSlug: "basil",                 kind: "culinary",     source: "THA editorial" },
            { pairSlug: "extra-virgin-olive-oil", kind: "culinary",     source: "THA editorial" }]
"spinach": [{ pairSlug: "lemon",                 kind: "nutritional",  note: "vitamin C supports iron absorption", source: "THA editorial" },
            { pairSlug: "chickpeas",             kind: "gut-health",   source: "THA editorial" }]
```

Lives **in WS0** (a new `knowledge_pairings` table + typed seed) so it shares the
seed runner, the integrity gate, and the editorial workflow — **not** a new client
const (which would repeat the fork).

## 4.2 Pairing types

| Kind | Example | Carries evidence note? | Why THA cares |
|---|---|---|---|
| **Culinary** | Tomato + Basil | No | Makes "what can we add?" feel natural/appetising. |
| **Nutritional** | Spinach + Lemon (vit-C ↑ iron) | **Yes** (sourced) | Educational; shares Nutrition Context sourcing rules. |
| **Gut health** | Beans + wholegrains (fibre diversity) | Optional | Ties to the diversity philosophy. |

**Storing the kind is the trust mechanism:** a tasty-but-unevidenced culinary
pairing can never masquerade as a health claim, because only `nutritional`/
`gut-health` kinds may carry (and must source) an evidence note.

## 4.3 Review process

Authored as typed seed, reviewed exactly like WS0 seeds (referential-integrity
gate refuses pairings to unknown canonical slugs); **never inferred, never
AI-generated, never derived from Apple Score.** Capped at ~3–4 chips per food to
avoid a recipe-engine feel. A pairing partner that is itself a known food links to
*its* Food Report (resolver makes this free).

---

# SECTION 5 — HEALTHIER ALTERNATIVES

**Concept:** White bread → Wholemeal / Rye / Sourdough; White rice → Brown rice /
Quinoa; White pasta → Wholewheat / Lentil.

## 5.1 Storage model (proposed — not implemented)

```
HEALTHIER_ALTERNATIVES: { fromSlug: [{ toSlug, reason, nutrient, source }] }
"white-rice": [
  { toSlug: "brown-rice", reason: "More fibre and a steadier release of energy", nutrient: "fibre",          source: "THA editorial" },
  { toSlug: "quinoa",     reason: "Adds plant protein alongside fibre",          nutrient: "plant-protein",  source: "THA editorial" },
]
```

In WS0 (new `knowledge_alternatives` table + seed). Keyed by canonical slug so
aliases resolve. **`reason` is required** — *an alternative without a why is a
ranking; an alternative with a why is education.*

## 5.2 Explanations — the reason vocabulary

Each `reason` is a short, nutrient-anchored, **comparative** phrase:
- "more fibre" · "higher protein" · "less processed" · "steadier release of
  energy" · "adds plant protein".

Never a value judgement on the original food. **Framing: "you may also enjoy",
never "stop eating".** This is the no-food-shaming guarantee.

## 5.3 Trust model & editorial workflow

- **Not universal.** Only a small curated set of *refined staples with an obvious
  wholegrain/higher-fibre sibling* has an entry. Broccoli, walnuts, olive oil have
  **no** alternative and surface nothing.
- **Not everywhere.** Shown only on the source food's report and (optionally)
  Shopping, where a swap is *actionable*. **Never injected into Variety or Boost
  lists** — those answer "what can we add?", not "replace this".
- Authored + reviewed like all WS0 seeds; never AI-generated, never inferred.

## 5.4 Interaction with Apple Score — **firewalled**

Healthier Alternatives must **never** be derived from a computed Apple Score.
Apple Score rates *products/baskets* through a trust gate; Healthier Alternatives
is *editorial food guidance*. Deriving one from the other would convert an
educational nudge into an implicit ranking/shaming engine. They stay independent;
at most, Shopping may display both side by side. **Healthier Alternatives remains
guidance, not judgement.**

---

# SECTION 6 — ROLLOUT (multiple systems → one canonical registry, safely)

The constraint is absolute: move to one registry **without breaking Pantry, Food
Report, Planner or Nutrition Boost, without duplicating content, and without
changing production behaviour.** The proven pattern from WS2A/WS2B is *additive +
shadow + parity-gated cutover, one surface at a time*. WS2D applies the same.

## 6.1 Migration stages (each independently reversible; none in scope here)

| Stage | What | Risk | Reversibility |
|---|---|---|---|
| **S0 — Reconcile slugs (read-only)** | Run the WS2A resolver in shadow over WS0 slugs, benefit-library names, and pantry-knowledge keys; produce a **mapping report** of which client-lib entries resolve to which canonical food. Fix `knowledge_food_slug` FKs where missing. **No surface changes.** | None | Delete the report. |
| **S1 — Build the join adapter** | Implement `buildFoodKnowledge(slug)` reading WS2A ⨝ WS0. Render it **only** behind the existing expanded `PlantReportRow` path that already shows this data — i.e. wire `health-benefits-model.healthBenefits` to WS0 so it stops returning `[]`. The report's marquee gap closes with **zero new data**. | Low | Revert adapter; model returns `[]` again. |
| **S2 — Promote Nutrition Context** | Move `pantry-knowledge.whyItMatters/goodToKnow` into a typed WS0 field; the client lib becomes a thin re-export during transition (no key changes). | Low | Keep reading the client lib. |
| **S3 — Author the two new registries** | Pairings + Healthier Alternatives as WS0 seeds (canonical-slug-keyed, reason/kind required, sourced). Surface **only** where empty-state discipline allows. | Low (additive) | Drop the tables; sections render nothing. |
| **S4 — Re-key Boosts** | Point `nutrition-boosts` lookups at canonical slugs (keep the meal-aware logic). Boosts and Variety/Pairings now share one identity, so the three "what can we add?" surfaces can never contradict on *identity*. | Low | Keep display-name keys. |
| **S5 — Demote client libs to cache** | Once WS0 holds nutrients + summaries, `nutrition-benefit-library` becomes a generated cache or is read-through the adapter. Deprecated, not deleted. | Medium | Re-point reads to the const. |
| **S6 — Diversity cutover (separate, parity-gated)** | Switch the 30-plants counter to canonical grouping **only after** WS2A shadow shows count parity. **Explicitly out of WS2D scope.** | High | Flag flip back to keyword counter. |

**Stop points are real.** Each stage ships value and is independently revertible.
The project could stop after S1 (benefits wired) and already be net-better with
**no new data**.

## 6.2 What guarantees production behaviour is unchanged

- **Counting never moves** until S6, which is parity-gated and out of scope — same
  guarantee WS2A/WS2B already hold.
- **Each surface cuts over behind the resolver**, lowest-risk first
  (Report benefits → Pantry → Boost re-key → Shopping), never all at once.
- **Empty-state discipline** means a half-migrated food shows *less*, never
  *wrong*.

---

# IMPORTANT CONSTRAINTS — COMPLIANCE

| Constraint | How WS2D honours it |
|---|---|
| Do NOT implement / migrate / change schema / code / UI | Investigation only; only artefacts are this doc + the rollback tag. |
| Do NOT redesign Pantry / Planner | WS2D *converges the data they read*; their surfaces are untouched. |
| Extend existing architecture | Authority = WS0 + WS2A (both exist); the adapter extends `getFoodHealthProfile`. |
| Prefer reuse | Zero new stores for existing facts; only 2 new registries for genuinely-missing cross-food relations. |
| Preserve backward compatibility | Additive + shadow + parity-gated, one surface at a time. |
| Preserve trust | Nutrient-bridge only; sourced facts; firewalled Apple Score; "you may enjoy" framing. |

---

# TRUST CHECK

**Could facts diverge?** *Today, yes* — four stores, three slug conventions, no
single owner (§1.3). **That is the precise problem WS2D ends:** single ownership
per fact-type (WS0 for knowledge, WS2A for identity) + one read adapter means a
food can have only one nutrient list, one benefit set, one context, one pairing
set — because there is one place each is authored.

**How are claims reviewed?** Through the **nutrient bridge**: THA never authors
"food X is good for Y"; it authors `Benefit → Nutrient` (curated, cited) and
`Food → Nutrient`, and the chain composes. Every benefit is therefore traceable to
a nutrient and a source. New registries carry `source` + kind/reason and are
reviewed like WS0 seeds. The integrity gate refuses to seed dangling slugs.

**How is uncertainty stored?** `confidence` (food↔nutrient) and `evidenceStrength`
(benefit links) are **stored but not surfaced in V1**. Emerging-evidence claims
stay hidden; the report degrades to nutrients-only via the hard fallback. Missing
data renders nothing.

**What should never be claimed?** No disease prevention/treatment/cure; no
"superfood"; no dosage; no per-food medical assertion; **no value judgement on a
food the user already eats** (Alternatives say "you may enjoy", never "stop");
nothing derived from a computed Apple Score; nothing AI-generated or inferred from
free text. `HEALTH_DISCLAIMER` stays on every surface.

**How does THA stay educational and trustworthy?** One sourced, reviewed,
evidence-aware registry; descriptive-not-prescriptive language; firewalls between
education (knowledge) and scoring (Apple Score); and the discipline that the app
shows *less* when unsure, never something *wrong*.

---

# DATA IMPACT DECLARATION

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (WS0 registry, WS2A canonical, WS2B variety, client libraries — all read-only) |
| Writes new data? | **NO** |
| Changes meaning of existing data? | **NO** |
| Requires backfill? | **NO** |

---

# RECOMMENDATIONS (priority order)

1. **Adopt Option A+:** WS0 = knowledge authority, WS2A = identity authority, joined
   by one adapter. **Do not create a fifth store.**
2. **Close the benefits gap first (Stage S1):** wire `health-benefits-model` to read
   WS0 so `healthBenefits` stops being `[]`. Highest value, **zero new data**.
3. **Reconcile slugs via the WS2A resolver (Stage S0)** before anything else — it is
   the keystone that lets every surface share one identity.
4. **Promote Nutrition Context into WS0** (typed field) rather than authoring a third
   prose store.
5. **Author Pairings + Healthier Alternatives as WS0 seeds** — canonical-slug-keyed,
   reason/kind required, sourced, Apple-Score-firewalled.
6. **Demote the client libraries to a display cache** converged into WS0 fact-by-fact;
   deprecate, never bulk-delete.
7. **Hold the empty-state and counting discipline** from WS2A/WS2B at every stage;
   keep the diversity cutover (S6) separate and parity-gated.

---

# RISKS

| Risk | Likelihood | Mitigation |
|---|---|---|
| **A fifth store is created by accident** | High if rushed | A+ mandates single ownership per fact-type; every section names its one registry. |
| **Slug mismatch corrupts the join** | High (real today: 3–4 conventions) | WS2A resolver + `knowledge_food_slug` FK as the only bridge; Stage S0 reconciliation report before any cutover. |
| **Benefit reads as a medical claim** | Medium | Nutrient bridge + hard fallback (nutrients-only) + disclaimer + nutritionist review. |
| **Healthier Alternatives feels like food-shaming** | Medium | "You may enjoy" framing; reason-required; refined-staples only; Apple-Score firewall. |
| **Production counting changes during migration** | Medium | Counting frozen until parity-gated S6, out of WS2D scope (WS2A/WS2B precedent). |
| **Half-migrated food shows contradictory data** | Low–Med | Single ownership + empty-state discipline → shows *less*, never *wrong*. |
| **Pairings drift into a recipe engine** | Low | Cap 3–4 chips; tag kind; editorial only. |
| **Editorial burden of converging 4 stores** | Medium | Stage-by-stage, value at each stop; existing seed runner + integrity gate + admin tooling design reused. |

---

# SCOPE LOCK CONFIRMATION

**Investigation only.** No implementation, migration, schema change, production-code
change, or UI change was made. The only artefacts are this document and the
`rollback/ws2d-pre-investigation-20260619` tag. Pantry and Planner were not
redesigned. Diversity counting was not touched.

## SUGGESTION (future ideas only — require approval, not implemented)

1. **Stage S1 first slice:** wire WS0 benefits into the report (close the empty
   `healthBenefits` gap) — the highest-value, no-new-data move.
2. **`buildFoodKnowledge(slug)` adapter + `FoodKnowledgeSections` renderer** — one
   adapter, one renderer, mounted in Report / Pantry / (subset) Planner & Shopping.
3. **`knowledge_pairings` + `knowledge_alternatives` tables + typed seeds** — the two
   genuinely-new registries, canonical-slug-keyed and sourced.
4. **Promote Nutrition Context** from `pantry-knowledge.ts` into a typed WS0 field.
5. **Re-key Nutrition Boosts** to canonical slugs so all three "what can we add?"
   surfaces share one identity.
6. **Lightweight editorial-review metadata** (`reviewedBy/At/status`) on knowledge
   foods + new registries, mirroring WS2A's retireable `status`.
7. **Inter-food navigation graph:** variety / pairing / alternative chips deep-link
   to their own Food Reports via the resolver.
8. **Slug-reconciliation report** (Stage S0) as a standalone read-only diagnostic,
   shippable on its own.
9. **Parity-gated diversity cutover (S6)** kept as a separate, later workstream.

---

**File location:** `docs/investigations/WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md`
**Rollback identifier:** `rollback/ws2d-pre-investigation-20260619` → commit `df28cf6`
(`git reset --hard rollback/ws2d-pre-investigation-20260619`)
