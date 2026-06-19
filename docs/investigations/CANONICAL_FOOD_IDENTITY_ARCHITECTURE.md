# Canonical Food Identity Architecture

> **One Food. One Meaning. Everywhere.**
>
> Architecture investigation only. **No code, schema, or data changes were made.**

| | |
|---|---|
| **Investigation date** | 2026-06-18 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at start** | `df914ad` |
| **Rollback tag** | `rollback/pre-canonical-food-identity-20260618-213704` |
| **Working tree** | Clean (verified before and during) |
| **Author** | Architecture investigation (read-only) |

---

## SECTION 1 — Executive Summary

### The real question

This is **not** "how do we normalise ingredients?" THA already normalises ingredients in at least
seven different ways. The real question is:

> **How does The Healthy Apples guarantee that a food has exactly one identity and one meaning
> in every surface — and that this identity cannot silently fork, drift, or be double-counted?**

### What I found (the uncomfortable truth)

There is **no single identity layer today. There are at least seven competing ones**, each invented
for a different feature, none aware of the others:

| # | System | Location | Identity form | Example for "pumpkin seeds" |
|---|--------|----------|---------------|------------------------------|
| 1 | Knowledge Registry (WS0) | `knowledge_foods.slug` | editorial slug | `pumpkin-seeds` |
| 2 | Algorithmic key | `normalizeIngredientKey()` (`shared/normalize.ts`, 15 callers) | runtime string | `pumpkin seeds` |
| 3 | Hard-coded alias map | `ALIASES` (`shared/ingredient-aliases.ts`) | curated string→string | (collapses varieties) |
| 4 | Bidirectional synonyms | `SYNONYM_MAP` (`shared/food-synonyms.ts`) | search expansion | — |
| 5 | AI/manual classifier | `ingredient_classifications.canonicalKey` (table) | reviewed string + aliases | — |
| 6 | Pantry knowledge | `pantry_ingredient_knowledge.ingredientKey` + `PANTRY_KNOWLEDGE` map | normalized key | `pumpkin seeds` |
| 7 | Plant-diversity keyword lists | `nutrition-variety.ts` (`SEEDS_LIST`, `FRUITS`, …) | substring matching | matched by `"pumpkin seed"` |
| 8 | Boost library | `BOOST_LIBRARY` (`nutrition-boosts.ts`) | display string | `Pumpkin Seeds` |
| 9 | Meal ingredients | `meals.ingredients` = `text[]` | raw free text | `"50g pumpkin seeds, toasted"` |

The summary brief's examples (`pumpkin-seeds` / `Pumpkin seeds` / `pumpkin seed` / `pumpkin_seeds` /
`Pumpkin Seeds`) are not hypothetical — they are **literally the live state of these nine systems**.

**It works today only because the food set is small and humans curated the overlaps by hand.**
It is already fragile: `ingredient-aliases.ts` collapses `cherry tomatoes → tomatoes`, while
`nutrition-variety.ts` lists `"cherry tomatoes"` as a distinct vegetable string. The same food
already has two contradictory meanings depending on which subsystem you ask.

### The recommendation in one paragraph

Introduce **one new additive identity spine — `canonical_food`** — that every subsystem *points at*
by nullable foreign key, resolved through **one resolver service**. Do **not** replace any existing
key, slug, or map on day one. The canonical layer **coexists** with all current identity systems as
a non-breaking superset, is populated **from** the existing Knowledge Registry (so launch foods are
1:1), and is rolled out in **shadow mode** (resolve-at-read) before any column is persisted. Identity,
varieties, and aliases become **data with referential integrity and uniqueness constraints**, not
nine hand-maintained code maps that drift apart.

### Confidence

**High confidence** in the diagnosis and the additive/coexistence strategy. **Medium-high** on the
exact variety hierarchy shape (Section 11) — it is the one genuinely new modelling decision and is
worth a small spike before commitment.

---

## SECTION 2 — Canonical Food Model

### 2.1 Is the brief's proposed model enough?

The brief proposes:

```
canonical_food(id, slug, name, category, subcategory, aliases, plant_diversity_key,
               knowledge_slug, created_at, updated_at, status)
```

This is **a good start but not enough**, and one field is actively dangerous. Critique:

- **`aliases` as an inline array is wrong for the long term.** It cannot enforce "an alias belongs
  to exactly one food." That is the *single most important integrity rule* in this whole project
  (see Section 13). Aliases must be a **separate table with a UNIQUE constraint on the alias key.**
  Keep a denormalised array only as a cached read convenience if needed — never as the source of truth.
- **`plant_diversity_key` should not be a free string.** Plant diversity must count at a *botanical /
  grouping* level (all tomatoes = one plant). That grouping is itself an identity and deserves a
  foreign key, not a copy-paste string that can drift. See Section 5.
- **Missing: the variety dimension.** "Cherry tomato" vs "tomato" cannot be expressed at all in the
  proposed flat model. This is half the brief (Questions 2, 4, 10).
- **Missing: provenance/trust fields.** Who created this identity, from which source, is it reviewed,
  is it editorial vs auto-generated? The Knowledge Registry already models this (`source`,
  `isActive`); the canonical layer must too, or trust erodes.
- **`status` is right and important** — keep it. Identities should be retireable, never deleted.

### 2.2 Recommended canonical model (conceptual — not a migration)

```
canonical_food
  id                  serial PK
  slug                text UNIQUE NOT NULL      -- stable forever; the public identity
  name                text NOT NULL             -- canonical display name ("Tomato")
  plural_name         text                      -- "Tomatoes" (UK display)
  category            text NOT NULL             -- aligns with knowledge_foods.category
  subcategory         text
  diversity_group_id  int  FK -> diversity_group(id)   -- what it counts as for Plant Diversity
  knowledge_slug      text FK -> knowledge_foods.slug NULL  -- editorial content, if any
  kind                text NOT NULL DEFAULT 'whole_food'    -- whole_food | composite | brand | non_food
  status              text NOT NULL DEFAULT 'active'        -- active | draft | merged | retired
  merged_into_id      int  FK -> canonical_food(id) NULL    -- safe "this turned out to be a dup"
  source              text NOT NULL DEFAULT 'THA editorial'
  review_status       text NOT NULL DEFAULT 'approved'      -- approved | pending | rejected
  created_at, updated_at
```

Supporting tables:

```
canonical_food_alias
  id            serial PK
  alias_key     text UNIQUE NOT NULL     -- normalizeIngredientKey() output; THE uniqueness guarantee
  canonical_food_id int FK NOT NULL
  alias_type    text NOT NULL            -- synonym | us_uk | spelling | form | brand_generic
  source        text NOT NULL
  -- UNIQUE(alias_key) => one string can resolve to at most one food. This is the anti-fork lock.

food_variety
  id            serial PK
  canonical_food_id int FK NOT NULL      -- parent identity ("tomato")
  slug          text UNIQUE NOT NULL     -- "cherry-tomato"
  name          text NOT NULL            -- "Cherry Tomato"
  variety_type  text                     -- cultivar | colour | size | preparation
  status        text NOT NULL DEFAULT 'active'

diversity_group
  id            serial PK
  slug          text UNIQUE NOT NULL     -- "tomato" (the thing the 30-plants counter counts once)
  name          text NOT NULL
```

> **Key principle:** `canonical_food.slug` for the launch foods is **identical to
> `knowledge_foods.slug`** (`pumpkin-seeds`, `tomato`…). The canonical layer is seeded *from* the
> registry so WS1 keeps working unchanged. `canonical_food` is then a **superset** that can also hold
> foods with no editorial entry (chicken, bread, branded items) — things the Knowledge Registry was
> never meant to cover.

### 2.3 What makes this "one meaning"

Meaning is not the slug. Meaning is the **graph the slug anchors**: the editorial description
(`knowledge_foods`), the nutrients/benefits (`knowledge_food_*`), the diversity group, the varieties,
and every alias that points in. The canonical_food row is the *single hub* all of those hang off, and
the *single thing* every feature references. That is what makes meaning singular.

---

## SECTION 3 — Aliases & Varieties

This is the section that exposes the deepest existing confusion, so it must be precise.

### 3.1 The four-way distinction (this is the core mental model)

| Relationship | Definition | Example | Stored as |
|---|---|---|---|
| **Same food (alias)** | Different *words*, identical identity & meaning | `aubergine` = `eggplant`; `pepitas` = `pumpkin seeds`; `tomatoes` = `tomato` | `canonical_food_alias` row |
| **Same food, distinct variety** | Same plant/identity, a *named sub-kind* worth tracking | `cherry tomato`, `plum tomato`, `heirloom tomato` → all under `tomato` | `food_variety` row (FK to parent) |
| **Same diversity group, different food** | Botanically/practically related, counts together for diversity but is its own identity | (rare; use sparingly) | shared `diversity_group_id` |
| **Different food** | Different identity, meaning, nutrition | `tomato` vs `tomatillo` | separate `canonical_food` |

### 3.2 Answering the brief's tomato example

```
Tomato / Tomatoes          -> SAME FOOD (plural is an alias)              canonical_food "tomato"
Cherry Tomato / Cherry Tomatoes -> VARIETY of tomato                     food_variety "cherry-tomato"
Plum Tomatoes              -> VARIETY of tomato                          food_variety "plum-tomato"
Heirloom Tomatoes          -> VARIETY of tomato                          food_variety "heirloom-tomato"
```

All four resolve to **one canonical_food (`tomato`)** and **one diversity group (`tomato`)**, but
cherry/plum/heirloom are *distinguishable varieties*.

### 3.3 "Your Variety" vs "Broaden Your Variety"

This falls straight out of the variety table — no extra mechanism needed:

- **Your Variety** = the set of `food_variety` rows the user has actually *used* (from planner /
  pantry / shopping history) under a given canonical_food. "You've had Cherry and Plum tomatoes."
- **Broaden Your Variety** = `food_variety` rows under the same canonical_food the user has **not**
  used yet. "Try Heirloom, Yellow, or Beefsteak." Pure set difference.

> **Critical correction to current behaviour:** `shared/ingredient-aliases.ts` today maps
> `cherry tomatoes → tomatoes` as a plain alias. That **destroys variety information** — exactly the
> data "Your Variety" needs. Under the new model these become *varieties*, not aliases, so the
> variety signal is preserved instead of flattened. This is the single clearest example of why the
> alias-only approach cannot carry the product forward.

### 3.4 Migrating the existing maps

`ALIASES`, `SYNONYM_MAP`, `INGREDIENT_TAXONOMY`, and `PANTRY_KNOWLEDGE` keys become the **seed data**
for `canonical_food_alias` / `food_variety`. They are not thrown away — they are *promoted* into a
table with integrity guarantees. The hand-curation is preserved; only the storage and the uniqueness
enforcement change.

---

## SECTION 4 — Knowledge Registry Integration

### 4.1 Which references which?

The brief asks: should `knowledge_foods → canonical_food`, or `canonical_food → knowledge_foods`?

**Recommendation: `canonical_food` is the spine; `knowledge_foods` is one facet hanging off it —
but the link is carried by the shared natural key `slug`, and the FK lives on `canonical_food`.**

```
canonical_food.knowledge_slug  ─FK(nullable)─►  knowledge_foods.slug
```

Reasoning:

- **`canonical_food` must be a superset.** Many real foods (chicken, bread, branded yoghurt) will
  never have editorial Knowledge content but absolutely need a canonical identity for pantry/shopping/
  planner. So knowledge content is *optional* on a canonical food → the nullable FK belongs on
  `canonical_food`, pointing *out* to the registry.
- **WS1 stays untouched.** PantryExplore / Knowledge Hub already read `knowledge_foods.slug`. We do
  **not** repoint them. We seed `canonical_food` so that, for every editorial food, a canonical row
  exists with `slug == knowledge_foods.slug` and `knowledge_slug == knowledge_foods.slug`. WS1 keeps
  reading the registry exactly as before.
- **Don't put a FK on `knowledge_foods` pointing into `canonical_food` as the primary link.** That
  would invert the dependency (editorial table depends on identity table) and risks breaking the WS0
  seed runner and its `validateKnowledgeSeed()` integrity check.

### 4.2 The slug equality invariant

For any editorial food: `canonical_food.slug == canonical_food.knowledge_slug == knowledge_foods.slug`.
This invariant is cheap to assert in a validation function (mirroring the existing
`validateKnowledgeSeed()` pattern in `shared/knowledge/index.ts`) and makes "knowledge and identity
agree" a *checked fact*, not a hope. See Section 13.

### 4.3 Net effect

```
            ┌────────────────────┐
            │   canonical_food   │  ← every feature points here
            └─────────┬──────────┘
       knowledge_slug │ (nullable)
                      ▼
            ┌────────────────────┐   foodSlug    ┌──────────────────────────┐
            │   knowledge_foods  │──────────────►│ knowledge_food_nutrients │ etc.
            └────────────────────┘               └──────────────────────────┘
```

---

## SECTION 5 — Plant Diversity Integration

### 5.1 Today

`client/src/lib/nutrition-variety.ts` decides plant diversity by **substring keyword matching**
against nine hand-maintained arrays (`FRUITS`, `VEGETABLES`, `SEEDS_LIST`, …). There is **no identity
and no ID** — `isPlantIngredient("50g toasted pumpkin seeds")` works by string inclusion. This is
brittle: it both *misses* (a new food not in the list) and *mis-buckets* (note the existing comments
about "chilli powder" matching "chilli" in the vegetable list).

### 5.2 The brief's three options

- **Option A — all tomatoes count as "Tomatoes" (one plant).** Botanically correct for the
  30-plants-a-week goal (variety of *species*, not *cultivars*). Loses the richer "you tried 3 kinds"
  story.
- **Option B — every variety counts separately.** Gameable and misleading (eating cherry + plum +
  heirloom is not "3 plants" for gut-diversity purposes). **Reject.**
- **Option C — count the plant once, *track* the varieties.** Counts correctly AND powers "Your
  Variety / Broaden Your Variety."

### 5.3 Recommendation: **Option C**, via `diversity_group`

```
plant-diversity count   = COUNT(DISTINCT canonical_food.diversity_group_id) over the week
your-variety detail     = the food_variety rows seen under each canonical_food
```

- Cherry + Plum + Heirloom tomatoes → **+1** plant (one `diversity_group`), **3 varieties tracked.**
- The `diversity_group` indirection (rather than counting `canonical_food` directly) lets us, *later
  and deliberately*, decide that e.g. "spring onion" and "onion" are one diversity group while staying
  distinct canonical foods — without re-plumbing anything.

### 5.4 Coexistence (no breakage)

The keyword lists in `nutrition-variety.ts` **stay live**. The resolver runs *alongside* them in
shadow mode and we compare outputs (Section 12). Plant Diversity only switches to ID-based counting
once the resolver demonstrably reproduces today's counts on real planner data. The 30-plants counter
is a *trust-critical surface* — it must not move by even one plant during migration without an
explicit, reviewed reason.

---

## SECTION 6 — Planner Integration

### 6.1 Today

`meals.ingredients` is `text[]` — raw free-text strings (`"50g pumpkin seeds, toasted"`). Planner
entries (`planner_entries`) reference `meal_id`, not ingredients. There is **no ingredient identity
in the planner at all**; everything is recomputed at read time by parsing/normalising strings.

### 6.2 How they become canonical food IDs — *gradually, without migrations*

**Yes, this can happen gradually with zero migrations**, because the planner never needs to *store*
canonical IDs to benefit from them:

1. **Phase 0 (resolve-at-read, no schema change):** a `resolveCanonicalFood(rawText)` service takes a
   raw ingredient string → `normalizeIngredientKey()` → alias/variety lookup → `canonical_food_id | null`.
   Plant diversity, variety chips, and boosts call this at render time. Nothing is persisted. Fully
   reversible (delete the call).
2. **Phase 1 (optional cache):** if performance demands, add a *nullable, additive* resolution cache
   table keyed by `normalized_key → canonical_food_id` (the existing `ingredient_classifications`
   table is already almost exactly this — it has `normalizedKey`, `canonicalKey`, `category`,
   `reviewStatus`). Reuse it rather than inventing a new one.
3. **Phase 2 (optional, much later):** when meals are *created/edited*, persist a structured
   ingredient with an optional `canonical_food_id` alongside the raw text. Never rewrite history;
   raw text remains the source of truth for display.

The raw `text[]` is **never destroyed**. Canonical IDs are an *additive interpretation layer*.

---

## SECTION 7 — Pantry Integration

### 7.1 Today

`user_pantry_items(ingredientKey, displayName, …)`. `ingredientKey` is a `normalizeIngredientKey()`
string. `pantry_ingredient_knowledge` is keyed by the same `ingredientKey`. PantryExplore (WS1) joins
to the Knowledge Hub via `knowledge_foods.slug`.

### 7.2 Mapping to canonical food

`user_pantry_items` gains a **nullable `canonical_food_id`** (additive column, default NULL). It is
populated by the resolver, not by a destructive migration. The existing `ingredientKey` stays as-is
and remains the operational key until canonical coverage is proven complete. Existing rows keep
working with `canonical_food_id = NULL`.

### 7.3 Should pantry support food *not* in the Knowledge Registry?

**Yes — unconditionally, and this is a requirement, not an edge case.** Users keep chicken, bread,
ketchup, and Branston pickle in their pantry. The Knowledge Registry covers ~8 editorial categories
of *whole plant foods*; it will never cover everything. This is *precisely* why `canonical_food` must
be a **superset of** `knowledge_foods` (Section 4):

- Pantry item with a canonical identity **and** editorial content → full Knowledge Hub experience.
- Pantry item with a canonical identity but **no** editorial content (`knowledge_slug = NULL`) →
  works fully as inventory, just no Knowledge Hub card.
- Pantry item with **no canonical match yet** (`canonical_food_id = NULL`) → still works exactly as
  today. Degrades gracefully; never blocks.

---

## SECTION 8 — Shopping Integration

### 8.1 Today — and a happy surprise

`shopping_list` **already has an "Item Resolution Layer"**: `originalText`, `canonicalName`,
`subcategory`, `resolutionState` (`raw | needs_review | resolved | matched_to_product`),
`reviewReason`, `reviewSuggestions`. The shopping team independently reinvented a resolution pipeline.
This is both validation of the idea *and* yet another fork to reconcile.

### 8.2 Connecting to canonical food

Add a nullable `canonical_food_id` to `shopping_list`, populated by the same resolver during the
existing resolution step (`raw → resolved`). The existing `resolutionState` machine is a perfect host:
"resolved" can mean "resolved to a canonical_food." `canonicalName` becomes a *cache* of
`canonical_food.name` rather than an independently-curated string (kills a drift source).

### 8.3 The three hard cases

| Case | Handling |
|---|---|
| **Brand products** (`groceryProducts`, `productMatches`) | A product is **not** a canonical food; it *contains/maps to* one. Link product → `canonical_food_id` (e.g. "Cauldron Tofu" → `tofu`). `canonical_food.kind = 'brand'` is reserved for cases where the brand *is* the identity. Diversity/knowledge attach via the underlying whole food. |
| **Composite ingredients** ("vegetable stir-fry mix", "mixed beans") | `canonical_food.kind = 'composite'`. A composite may *expand* to multiple diversity groups (a future `composite_members` table). For now: one identity, marked composite, counts conservatively (e.g. "mixed beans" = 1 legume) — matching today's behaviour, not inflating diversity. |
| **Unknown items** ("bog roll", "that thing from the deli") | Stay `canonical_food_id = NULL`, `resolutionState = needs_review`. **Never auto-invent a canonical food from free text.** Unknowns route to the existing review queue. Silent identity creation is the #1 way one food becomes two (Section 13). |

---

## SECTION 9 — Nutrition Boost Integration

### 9.1 Today

`BOOST_LIBRARY` (`client/src/lib/nutrition-boosts.ts`) is a hard-coded list of `{ name, category }`
where `name` is a display string (`"Pumpkin Seeds"`). It has its own category enum
(`legumes | seeds | nuts | herbs | mushrooms | fermented | healthy-fats | extra-veg`) that *overlaps
but does not equal* the Knowledge Registry categories or the plant-diversity categories. A fourth
category taxonomy.

### 9.2 Should boosts reference `canonical_food` directly?

**Yes — boosts should become `canonical_food_id` references**, not display strings. Each `BoostItem`
carries a `canonical_food_id` (or canonical `slug`). The display name then comes *from* the canonical
food, so a boost can never disagree with the rest of the app about what "Pumpkin Seeds" is.

### 9.3 "Can health benefits / nutrients / plant diversity appear automatically?"

**This is the single most compelling payoff of the whole architecture, and the answer is yes.** Once a
boost references a `canonical_food`, you get *for free*, by traversal:

```
boost → canonical_food → knowledge_slug → knowledge_food_nutrients / knowledge_food_benefits
                       → diversity_group  (does this boost add a new plant this week?)
                       → food_variety     ("Broaden your variety")
```

So "add Pumpkin Seeds" can automatically show *"+magnesium, +zinc · supports gut health · +1 plant
this week"* — sourced from the registry, not re-typed into the boost library. **Today this requires
hand-maintaining four parallel lists; with canonical identity it's one join.** This single capability
is the strongest justification for the project.

---

## SECTION 10 — Analyser Integration

### 10.1 Today

Analyser flow: `product → extracted ingredients → UPF classification → Apple Score`
(`server/lib/product-analysis.ts`, `upf-analysis-service.ts`, `apple-score-trust.ts`). Extracted
ingredients are strings.

### 10.2 Should analyser-extracted ingredients map to canonical food? How?

**Yes — but as an *enrichment*, never as a gate, and never with auto-creation.**

- Each extracted ingredient runs through the **same resolver** → `canonical_food_id | null`.
- A match **enriches**: show the whole-food's Knowledge Hub card, contribute to "real foods you
  recognise" framing, link to diversity.
- A non-match is **completely normal and must not degrade the Apple Score.** Most label ingredients
  (emulsifiers, stabilisers, "flavourings") are *not* whole foods and correctly resolve to NULL. UPF
  classification is independent of canonical identity and must stay that way.

> **Hard rule:** the Analyser must **never auto-create canonical foods** from OCR/label text. Label
> text is the noisiest input in the system; auto-creation there would flood the identity layer with
> garbage and fork real foods. Analyser is a *read-only consumer* of identity. Proposed new foods, if
> ever, go to a human review queue (reuse `ingredient_classifications.reviewStatus = 'pending'`).

---

## SECTION 11 — Your Variety Architecture

This is the genuinely new modelling work, so it gets the most scrutiny.

### 11.1 Storage model

```
canonical_food   "tomato"     (diversity_group "tomato")
   └─ food_variety  "cherry-tomato"   (variety_type: cultivar)
   └─ food_variety  "plum-tomato"     (variety_type: cultivar)
   └─ food_variety  "heirloom-tomato" (variety_type: cultivar)
   └─ food_variety  "yellow-tomato"   (variety_type: colour)
   └─ food_variety  "beefsteak-tomato"(variety_type: cultivar)
```

User-facing computation (no new user-state table needed initially — derive from existing history):

```
seenVarieties(user, canonical_food) =
    distinct food_variety resolved from the user's planner/pantry/shopping history

YourVariety        = seenVarieties
BroadenYourVariety = allVarieties(canonical_food) \ seenVarieties
```

### 11.2 Why a separate `food_variety` table (not just more aliases, not just more canonical foods)

- **Not aliases:** aliases mean "same thing, different word" and *must* collapse. Varieties mean
  "same plant, distinguishable kind" and *must not* collapse — we need to count them as distinct.
- **Not separate canonical foods:** if cherry tomato were its own canonical_food, plant diversity
  would double-count (Option B, rejected) and every nutrient/benefit relationship would have to be
  duplicated per variety. Varieties *inherit* the parent's knowledge graph by default.
- A variety **may** override specifics later (e.g. a variety-specific note) but defaults to the
  parent's meaning. Inheritance keeps "one meaning" intact.

### 11.3 Recommendation & caveat

Adopt the two-level `canonical_food → food_variety` hierarchy with diversity counted at
`diversity_group`. **Caveat (the one medium-confidence call):** the boundary between "variety" and
"alias" is editorially fuzzy (is "baby spinach" a variety of spinach or just an alias? — today
`ingredient-aliases.ts` treats it as an alias). Recommend a **2–3 day editorial spike** to classify
the existing ~150 alias entries into alias-vs-variety *before* seeding, because reclassifying later is
the one change that *can* move plant-diversity counts. Get this right once.

---

## SECTION 12 — Migration Strategy

The non-negotiable: **introduce canonical food without breaking planner, shopping, boosts, knowledge,
pantry, or plant diversity.** Achieved by strict additive + shadow rollout.

### Phase 0 — Build the spine (no behaviour change)
- Create `canonical_food`, `canonical_food_alias`, `food_variety`, `diversity_group` tables.
- Seed them **from existing curated data**: `knowledge_foods` (1:1, identical slugs), then promote
  `ALIASES` / `SYNONYM_MAP` / `INGREDIENT_TAXONOMY` / `PANTRY_KNOWLEDGE` / boost & plant-diversity
  lists as aliases/varieties.
- Ship a `validateCanonicalSeed()` function (mirror of `validateKnowledgeSeed()`) that **refuses to
  seed** on any integrity violation (dup alias, dangling FK, slug-equality breach).
- **Nothing reads it yet.** Zero user-facing change. Fully revertible by dropping the tables.

### Phase 1 — Shadow resolve (read-only, instrumented)
- Add `resolveCanonicalFood()` service. Run it **alongside** existing logic on real planner/shopping/
  pantry data and **log disagreements** (e.g. resolver says +1 plant, keyword list says +0).
- **No surface changes.** This is the trust-building phase: prove the resolver reproduces today's
  plant-diversity counts, boost names, and pantry matches before anything switches.

### Phase 2 — Additive columns
- Add **nullable** `canonical_food_id` to `user_pantry_items`, `shopping_list`, (optionally) a meal
  ingredient projection. Backfill via resolver. Legacy rows = NULL = unchanged behaviour.

### Phase 3 — Feature-by-feature cutover (one surface at a time, each independently reversible)
- Switch surfaces to canonical identity **one at a time**, behind a flag, lowest-risk first
  (suggested order: Boost → Pantry Explore → Plant Diversity → Shopping → Analyser).
- Plant Diversity switches **only** after Phase 1 shows count parity.

### Phase 4 — Converge the old maps (optional, slow)
- Once a map is fully represented in the tables, mark it deprecated and make it delegate to the
  resolver. The code maps don't have to be deleted to win — they just stop being *independent
  sources of truth*.

### Can canonical food coexist before replacing existing keys?
**Yes — that is the entire strategy.** Nothing replaces existing keys until Phase 3, per surface,
behind a flag, after parity is proven. At every phase the system is shippable and revertible.

---

## SECTION 13 — Trust & Drift Prevention

### 13.1 Could one food accidentally become two?

This is the central danger. Defences, in order of strength:

1. **`UNIQUE(canonical_food_alias.alias_key)`** — the keystone. A normalized string can resolve to
   **at most one** food. Two foods *cannot* claim the same alias; the DB rejects it. This is the
   single most important constraint in the design.
2. **`UNIQUE(canonical_food.slug)`** and **`UNIQUE(food_variety.slug)`** — no duplicate identities.
3. **No auto-creation from noisy inputs** (Analyser/OCR, shopping free text). Unknowns → review
   queue, never silent new identities.
4. **`merged_into_id`** — if a duplicate *does* slip in, merge is a safe, reversible pointer operation
   (resolve-through), not a destructive delete-and-repoint.

### 13.2 Could Tomatoes and Cherry Tomatoes be counted incorrectly?

Prevented by the **variety hierarchy + diversity_group**: cherry resolves to its parent's
`diversity_group`, so the 30-plants counter sees one plant regardless of how many varieties appear.
The *current* code is actually more at risk here than the proposal — `ingredient-aliases.ts` collapses
cherry→tomato while `nutrition-variety.ts` lists "cherry tomatoes" separately, so the two systems can
already disagree.

### 13.3 Could shopping and knowledge drift apart?

Today: **yes, easily** — they use different identity systems with no link. Under the proposal: prevented
by **the slug-equality invariant** (Section 4.2) + **shared resolver** + an automated **reconciliation
report**:

- A scheduled/CI check asserting: every `knowledge_foods.slug` has a `canonical_food`; every
  `canonical_food.knowledge_slug` resolves; no orphan aliases; no two diversity groups disagree with
  their members. Mirror the existing `validateKnowledgeSeed()` pattern — THA already trusts that
  pattern in WS0.
- **Golden tests:** a fixed corpus of real ingredient strings → asserted canonical resolutions.
  Any drift fails CI.

### 13.4 The trust model in one line

> Identity is **data with constraints + one resolver + automated reconciliation** — not nine code
> maps maintained by memory. Drift becomes a *failing test*, not a *silent bug discovered by a user*.

---

## SECTION 14 — Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **Plant-diversity counts shift during migration** (trust-critical user-facing number) | High | Phase 1 shadow parity gate; Plant Diversity is the *last* surface cut over; reconciliation report |
| R2 | **Alias-vs-variety misclassification** when promoting existing maps (e.g. "baby spinach") | Medium-High | Editorial spike (Section 11.3) *before* seeding; reversible while still aliases |
| R3 | **Auto-creation floods identity with junk** (esp. Analyser/OCR) | High | Hard rule: no auto-create from noisy inputs; review queue only |
| R4 | **Yet another parallel system** — canonical_food becomes #8, not the unifier | High | Coexistence + convergence plan (Phase 4); resolver is the *single* entry point; deprecate maps |
| R5 | **Performance** of resolve-at-read on large planners | Medium | Reuse `ingredient_classifications` as cache (Phase 1); memoise resolver |
| R6 | **Composite foods** ("mixed beans") mis-counted for diversity | Medium | `kind='composite'`; conservative counting matching today; future `composite_members` |
| R7 | **Two teams keep extending old maps** during migration | Medium | Freeze old maps to additions once promoted; PR check flags edits to deprecated maps |
| R8 | **Scope creep** — trying to canonicalise *everything* at once | Medium | Phase per surface; ship value early (Boost enrichment, Section 9.3) |
| R9 | **`merged_into_id` resolution loops** | Low | Constraint/test: merge chains resolve in ≤1 hop; no cycles |

---

## SECTION 15 — Final Recommendation

1. **Adopt `canonical_food` as a new, additive identity spine** — not a replacement for anything on
   day one. Every subsystem points at it by **nullable FK**, resolved through **one resolver service**.
2. **Model identity as four distinct relationships** — alias (same food), variety (same plant, named
   sub-kind), diversity group (counts together), different food. Aliases live in a table with a
   **UNIQUE alias_key** — the anti-fork keystone.
3. **`canonical_food` is a superset of `knowledge_foods`**, linked by a nullable `knowledge_slug` FK
   with a **slug-equality invariant** for editorial foods. Pantry/shopping foods without editorial
   content are first-class.
4. **Plant Diversity = Option C:** count `diversity_group` once, track `food_variety` for
   Your-Variety / Broaden-Your-Variety. Preserve the variety signal that today's alias map destroys.
5. **Roll out in shadow mode**, additive columns, feature-by-feature, behind flags, with a
   parity gate before Plant Diversity cuts over.
6. **Prevent drift by construction:** uniqueness constraints, no auto-creation from noisy inputs, a
   `validateCanonicalSeed()` integrity check, an automated reconciliation report, and golden tests —
   reusing the WS0 `validateKnowledgeSeed()` pattern THA already trusts.
7. **Reuse, don't reinvent:** `ingredient_classifications` is already a proto-canonical table and the
   shopping `resolutionState` machine is already a resolution pipeline — fold them in rather than
   adding parallel infrastructure.
8. **First shippable win:** wire Nutrition Boost to canonical identity so benefits/nutrients/diversity
   appear automatically (Section 9.3) — high value, low blast radius, proves the model.

> **Sequencing note:** do the **alias-vs-variety editorial spike (R2)** and the **Phase 1 shadow
> parity work** *before* committing schema, because they are the two decisions that can move
> user-facing numbers. Everything else is reversible engineering.

---

## FINAL REPORT (brief checklist)

1. **Rollback identifier:** tag `rollback/pre-canonical-food-identity-20260618-213704` → commit `df914ad`
2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`
3. **Recommended canonical model:** `canonical_food` spine (id, slug, name, category, subcategory,
   `diversity_group_id`, nullable `knowledge_slug`, kind, status, `merged_into_id`, provenance) + three
   supporting tables: `canonical_food_alias` (UNIQUE alias_key), `food_variety` (FK to parent),
   `diversity_group`. **Superset of `knowledge_foods`.** (Section 2.)
4. **Alias strategy:** aliases are *same-food synonyms* in a dedicated table with a **UNIQUE
   constraint on the normalized alias key** (the anti-fork lock). Existing code maps (`ALIASES`,
   `SYNONYM_MAP`, taxonomy, pantry knowledge) are *promoted* into this table as seed data, not
   discarded. (Section 3.)
5. **Variety strategy:** two-level `canonical_food → food_variety`; diversity counts at
   `diversity_group` (Option C). Your-Variety = varieties seen; Broaden-Your-Variety = set difference.
   Corrects today's alias map which destroys variety info. (Sections 3, 5, 10/11.)
6. **Migration strategy:** strictly additive + shadow. Phase 0 build & seed (no reads) → Phase 1
   shadow-resolve with parity logging → Phase 2 nullable `canonical_food_id` columns → Phase 3
   per-surface cutover behind flags (Plant Diversity last, after parity) → Phase 4 converge old maps.
   Coexists fully before replacing any key. (Section 12.)
7. **Drift prevention:** UNIQUE alias_key + UNIQUE slugs; no auto-creation from noisy inputs;
   `validateCanonicalSeed()` integrity gate; slug-equality invariant; automated reconciliation report;
   golden resolution tests; safe `merged_into_id`. (Section 13.)
8. **Trust model:** identity = data with constraints + one resolver + automated reconciliation, not
   hand-maintained code maps. Drift becomes a failing test, not a silent user-visible bug. Meaning is
   owned by editorial `canonical_food` + Knowledge Registry; noisy consumers (Analyser, free-text
   shopping) are read-only and cannot mint identities. (Section 13.)
9. **Risks:** R1 plant-diversity count shift (High), R2 alias/variety misclassification (Med-High),
   R3 junk auto-creation (High), R4 becoming an 8th parallel system (High), plus performance,
   composites, map-extension, scope-creep, merge-loops. All with mitigations. (Section 14.)
10. **Confidence level:** **High** on diagnosis (the parallel-systems problem is verified in code) and
    on the additive/coexistence migration approach. **Medium-high** on the exact variety-hierarchy
    boundary — recommend a short editorial spike before seeding.
11. **Confirmation:** **No code, schema, or data changes were made.** This investigation only created
    this document under `docs/investigations/` and an annotated git rollback tag. The working tree is
    otherwise clean; no application files, schema, migrations, or seeds were modified.
