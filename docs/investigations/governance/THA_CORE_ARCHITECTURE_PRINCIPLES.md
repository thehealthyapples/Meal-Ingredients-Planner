# THA CORE ARCHITECTURE PRINCIPLES — Investigation

**Classification:** 🟡 AMBER — Whole-platform architecture investigation only. No code, schema, data, validation, or runtime changes.
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Investigation complete. No implementation.
**Governing question:** Should The Healthy Apples formally adopt a **Unified Domain Entity Architecture (UDEA)** as its governing engineering principle — across *every* major domain, not just Food Intelligence?

> This is **not** a Food Intelligence investigation. It is a whole-platform architecture investigation. It builds on, but is broader than, `WS0X_13_UNIFIED_FOOD_INTELLIGENCE_ARCHITECTURE.md` and `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## ROLLBACK PROTECTION (mandatory first step — confirmed before any investigation)

| Item | Value |
|------|-------|
| Committed baseline tag | `rollback/core-arch-investigation-20260625` → `a8a912a` / full SHA `3237d4332fae0d3cb6abda35e133be0308fd6f3d` (*feat(ws0x7): Ingredient Resolution Engine Completeness Program*) |
| Rollback to committed state | `git checkout rollback/core-arch-investigation-20260625` |
| Working tree at start | **Intentionally dirty** — 17 modified tracked files + ~50 untracked docs/modules from in-progress WS0X.5–13 and related streams. **Not** created by this task. |
| This task's writes | **One file only** — this document. No code, schema, data, runtime, or validation touched. Revert = delete this file. |

**Why protection is sound despite a dirty tree:** the committed tag fixes the last-commit baseline as a permanent ref. This investigation writes nothing but prose into a single new file; there is no source, schema, or data change to undo. The pre-existing uncommitted work is untouched and can be discarded or kept independently of this document.

> Git status reported honestly: the tree is **intentionally dirty** (ongoing Food Intelligence WIP). I did not commit, stash, or alter that work. The rollback tag was created at HEAD before any reading or writing began.

---

## HEADLINE FINDING (read this first)

> **Yes — THA should adopt a Unified Domain Entity Architecture as its governing principle (Option A), but with a precise definition that prevents it from becoming a rewrite mandate.** The Food Intelligence work did not *invent* a new architecture; it *rediscovered*, under pressure, the pattern THA already half-implements everywhere — one canonical entity, one owner per attribute, progressive enrichment, runtime consuming a single assembled model. The evidence that this is a platform principle and not a food quirk is that **the same four failure modes recur in domains that have nothing to do with food**: duplicated identity (Food ×4 stores, Dietary Preference ×4 stores), dual namespaces (canonical slug vs knowledge slug), prototype client stores shadowing a DB source (Plant Diversity, Boost display, Diet Rules), and free-text attributes that should be entity references (`meals.ingredients` is `text[]`, not a link to canonical food).

The decisive evidence is not aspirational. Five facts settle it:

1. **THA already names a "source of truth" for every domain** — `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` declared 27 domains, of which **23 are cleanly single-owner and 4 are contested**. The platform is *already* ~85% UDEA-compliant by domain count. Adopting UDEA formalises the majority pattern; it does not impose a foreign one.

2. **The single-entity pattern is observably the healthy state.** Every domain the register marks "Authoritative — declared" (Meal Identity → `meals`, Planner → `planner_*`, Shopping → `shopping_list`, Household → `households`/`household_eaters`, Diary → `food_diary_*`, Restrictions → `restriction-library.ts`) is a domain with **no live trust complaint**. Every domain marked "Contested" (Food Knowledge, Plant Diversity counting, Diet Rules, Dietary Preferences) is a domain with a **named launch risk**. The correlation between "single owner" and "trustworthy" is total in the existing register.

3. **The one domain that went furthest toward UDEA produced a working prototype of the read model** — `shared/canonical/food-report-adapter.ts` (`buildFoodReport(canonicalSlug)`) already assembles identity + nutrients + benefits + context into one object keyed on one identity. Progressive enrichment is already real for Food (`FOOD_CONTEXT_SEED` merged onto `canonical_food` at seed build, per WS0X.13). The pattern is built, not theorised.

4. **The same defect class appears outside food.** WS0X.13 documents a silent runtime miss caused by *two slug namespaces* for one food. The register documents the identical shape for **Dietary Preferences** (`users.dietPattern` vs `household_eaters.defaultDietTypes` vs `planner_week_eater_overrides.dietTypes` vs `user_preferences`) and **Diet Rules** (`server/lib/dietRules.ts` vs an *identical copy* at `client/src/lib/dietRules.ts`). Different domain, same root cause: more than one owner for one fact.

5. **Free-text where an entity reference belongs is the platform's deepest structural debt.** `meals.ingredients` is `text("ingredients").array()` (schema line 99) — a meal does not *reference* canonical foods, it *restates* their names as strings. Every downstream surface (Plant Diversity counting, Nutrition Boost, Meal Food Intelligence) then re-resolves those strings back to identity, each via its own resolver. This is the single largest UDEA gap in THA and the reason the food work keeps hitting resolution bugs.

**Conclusion:** UDEA is not a Food Intelligence decision that might generalise. It is a platform principle that Food Intelligence happened to surface first, because food is THA's most-enriched and most cross-referenced entity. **Recommendation: Option A — adopt UDEA as the governing architecture — with the scope discipline defined in Part 8 and Part 10.**

---

## PART 1 — CURRENT DOMAIN REVIEW

Reviewed from `shared/schema.ts` (≈70 tables), `shared/*` seed/engine modules, `server/lib` + `server/services`, `client/src`, and the two predecessor investigations. For each major domain: primary entity, source of truth, and any duplicated ownership / state / workflow.

| Domain | Primary entity | Source of truth (today) | Duplicated ownership / state / workflow |
|---|---|---|---|
| **Food (identity)** | `canonical_food` (slug) | `shared/canonical/foods.ts` → `canonical_food` (+variety/alias/diversity) | **×4 identity stores:** `canonical_food`, `knowledge_foods` (own slug space), `server/data/canonical-map.json` (resolver), and denormalised columns on `shopping_list` (`canonicalName`/`normalizedName`/`category`/`subcategory`). Category/description duplicated across canonical+knowledge. |
| **Food Knowledge (nutrition)** | `knowledge_foods` | `shared/knowledge/*` → `knowledge_*` tables via `nutrition-knowledge-registry.ts` | **×3+ content stores** for the same facts: WS0 registry + `client/src/lib/nutrition-benefit-library.ts` + `client/src/lib/pantry-knowledge.ts` + `pantry_ingredient_knowledge` DB. Register flags this 🔴 launch risk. |
| **Meal** | `meals` (id) | `meals` + `meal_items`/`meal_categories`/`meal_diets`/`meal_allergens` | **Ingredients are free-text** (`meals.ingredients text[]`, line 99) — no FK to canonical food. `meal_items` exists as a structured alternative but ingredients-as-strings remains the live path. Diet/allergen facts partly on `meals.dietTypes[]` and partly in link tables. |
| **Recipe** | (no distinct entity) | Folded into `meals` via `mealSourceType`/`mealFormat`/`sourceUrl`; import via `recipe_source_settings` | Recipe is **not a separate domain** — it is a meal provenance variant. Recipe import resolves ingredients through `item-resolver.ts` (a *third* identity path). |
| **Household** | `households` (id) | `households` + `household_members` + `household_eaters` | Clean spine. But "who eats / their diet" duplicates into Dietary Preferences (below). Eater is the emerging single owner; `users.diet*` predates it. |
| **Person / Eater** | `household_eaters` + `users` | Split: account-holders on `users`, non-account eaters on `household_eaters` | **Dual identity for a person:** an adult is both a `user` row and a `household_eater` row (linked by `userId`). Diet facts live on both. |
| **Product** | `grocery_products` / `product_events` | `product-analysis.ts` + `upf-analysis-service.ts`; stores `product_events`, `product_history`, `grocery_products`, `additives`, `product_additives` | Product identity (barcode/name/brand) restated across `grocery_products`, `shopping_fulfilment_memory`, `meals` (barcode/brand cols), `basket_items`. No single product entity. |
| **Planner** | `planner_weeks`/`days`/`entries` | DB `planner_*` (+ `planner_entry_eaters`, `planner_week_eater_overrides`) | Legacy `meal_plans`/`meal_plan_entries` co-exist with the newer `planner_*` spine — two generations of planner state. |
| **Shopping** | `shopping_list` | `shopping_list` + `shopping_list_extras` (+ `shopping_fulfilment_memory`) | Single owner of list state, but **denormalises food + product identity** onto every row (Part 1 Food note). Status lives in `shopStatus`/`resolutionState`/`checked` — three overlapping state fields. |
| **Pantry** | `user_pantry_items` | DB `user_pantry_items`; knowledge via registry | Pantry *knowledge* contested (see Food Knowledge). Pantry *inventory* is clean. |
| **Diary** | `food_diary_days`/`entries`/`metrics` | DB `food_diary_*` | Clean single owner. No duplication found. |
| **Nutrition Report** | (derived view) | Aggregates `knowledge_*` via registry + planner/diary | Derived, not stored — correct. Inherits Food Knowledge's contested sources upstream. |
| **Discovery / Alternatives / Stories / Seasonal** | (engines) | `shared/{discovery,alternatives,stories,seasonal}/engine.ts` | Engines = computation, not stores — correct UDEA shape. But all key on the **knowledge** slug, inheriting the dual-slug issue. |
| **Analyser** | `product_events` | `product-analysis.ts` + `upf-analysis-service.ts` | Authoritative engine; clean. Additive wording gated on `additives.sources`. |
| **Dietary Preferences** | (contested) | `users.dietPattern`/`dietRestrictions` (live) | **×4 stores:** `users.diet*`, `household_eaters.defaultDietTypes`/`hardRestrictions`, `planner_week_eater_overrides.dietTypes`, `user_preferences`. The most duplicated *non-food* fact in THA. |
| **Diet Rules (pattern)** | `dietRules.ts` | `server/lib/dietRules.ts` | **Identical file copy** at `client/src/lib/dietRules.ts` (self-described as "identical copy"). Split-brain by construction. |
| **Plant Diversity counting** | (contested) | should be `diversity_group` (canonical) | Live path is `client/src/lib/nutrition-variety.ts` keyword lists — shadows the canonical `diversity_group` table. |
| **Restrictions** | `restriction-library.ts` | `shared/restrictions/restriction-library.ts` (v3.0.0) | Clean single owner. Good model. |
| **Membership** | `users.subscriptionTier` | DB column | Clean. |

**Conclusion of Part 1:** Of the major domains, the *stored-state* spines (Meal, Planner, Shopping, Household, Diary, Membership, Restrictions, Analyser) are mostly single-owner and healthy. The *knowledge / classification / preference* layers (Food identity, Food Knowledge, Dietary Preference, Plant Diversity, Diet Rules) are where ownership has forked. **The fork always follows the same pattern: a richer requirement appeared, a new store was created beside the old one, and the old one was never retired.**

---

## PART 2 — PATTERN IDENTIFICATION

**Do common "one X" patterns already exist?** Yes — and they are the platform's strongest, most trusted parts.

| Pattern | Already exists? | Where | Health |
|---|---|---|---|
| One meal | ✅ | `meals` table is the undisputed owner of meal identity | Trusted |
| One planner week | ✅ | `planner_weeks` (legacy `meal_plans` deprecated, not removed) | Trusted; minor legacy debt |
| One shopping item | ✅ | `shopping_list` row | Trusted (but identity-denormalised) |
| One household member | ✅ | `household_members` / `household_eaters` | Trusted |
| One food (identity) | ⚠️ Partial | `canonical_food` is *intended* owner; 3 rivals persist | Contested |
| One food (knowledge) | ❌ | 3–4 parallel stores | 🔴 Launch risk |
| One person's diet | ❌ | 4 stores | Contested |

**Where duplication exists — why, and what kind:**

| Duplication | Why it exists | Intentional? | Classification |
|---|---|---|---|
| Food identity ×4 | Stores grew per-need across WS0 (knowledge), WS2A (canonical), resolver era, shopping denormalisation | No coordination | **Technical debt** — removable |
| Food knowledge ×3 client/db | Prototype client files predate the WS0 DB registry | Was intentional *as prototype* | **Technical debt** — retirement already planned (register M1/M2) |
| Dietary preference ×4 | `users.diet*` predates household eaters; eaters predate week overrides; `user_preferences` added for richer prefs | Each step locally reasonable | **Technical debt** — no single migration ever consolidated them |
| Diet rules ×2 files | Browser needed Node-free logic; copy was the fast fix | Intentional shortcut | **Technical debt** — `shared/` placement is the fix |
| `meals.ingredients` as text[] | Meals predate the canonical food spine entirely | Historically necessary | **Architectural debt** — the oldest and deepest gap |
| Planner ×2 generations | `planner_*` superseded `meal_plans`; old kept for compatibility | Intentional during migration | **Migration residue** — should complete |
| Product identity scattered | No product-entity domain was ever defined; barcode/name copied where needed | Never decided | **Missing entity** — a domain that was never given a spine |
| Reference vocab (nutrients/benefits) | Shared taxonomy across all foods | Yes | **Legitimate — not duplication.** Reference data, must stay separate. |

**Pattern conclusion:** Duplication in THA is almost never an architectural *necessity*. With one exception (reference vocabularies, which are correctly separate), every duplication is either *technical debt from an un-retired predecessor* or *a missing entity that was never given a spine*. This is exactly the shape UDEA is designed to prevent.

---

## PART 3 — DEFINE UNIFIED DOMAIN ENTITY ARCHITECTURE

UDEA, defined for THA (design only — **not implemented**), is a four-layer model applied per major entity:

```
   IDENTITY                 Core trusted facts          Progressive enrichment        Runtime consumption
   (one key space)          (authored once, owned)      (additive, optional, sourced) (one assembled model)
 ┌──────────────┐        ┌────────────────────────┐   ┌─────────────────────────┐   ┌────────────────────┐
 │ canonical    │───────▶│ name · category · the   │──▶│ nutrients · benefits ·  │──▶│ buildXIntelligence │
 │ slug / id    │        │ irreducible facts that  │   │ context · stories ·     │   │ (one read model    │
 │ ONE per      │        │ define the entity       │   │ varieties — each with   │   │  every surface     │
 │ entity       │        │                         │   │ ONE owner, attached to  │   │  consumes)         │
 └──────────────┘        └────────────────────────┘   │ identity, gaps render   │   └────────────────────┘
                                                       │ as gaps (no fabrication)│
                                                       └─────────────────────────┘
   Reference data (vocabularies, taxonomies, enums) sit BESIDE the spine, shared across all entities — never merged in.
```

**Applied per entity:**

| Entity | Identity | Core trusted facts | Progressive enrichment | Runtime consumption |
|---|---|---|---|---|
| **Food** | canonical slug | name, category, subcategory, aliases | nutrients, benefits, context, varieties, stories | `buildFoodIntelligence(slug)` (generalised from existing adapter) |
| **Meal** | meal id | name, owner, format, servings | resolved ingredients→food, diet/allergen facts, nutrition, boost, plant-diversity contribution | `buildMealIntelligence(id)` |
| **Person/Eater** | eater id | display name, account link | diet pattern, restrictions, likes/dislikes, goals | `buildEaterProfile(id)` |
| **Product** | barcode (or product id) | name, brand, weight | UPF/NOVA analysis, additive risk, price intelligence, THA rating | `buildProductIntelligence(barcode)` |
| **Household** | household id | members, eaters | aggregate diet constraints, progress, familiarity | `buildHouseholdContext(id)` |

**Why this model succeeds for THA:** every one of THA's value surfaces is an *assembly* of one entity's facts plus optional enrichment — Meal Detail, Food Report, Nutrition Report, Analyser, Plant Diversity. The product *is* progressive enrichment of trusted entities. The architecture matches the product's own grain.

**Where it succeeds vs fails:**

- **Succeeds** for entities with rich, cross-referenced, enrichable attributes: **Food, Meal, Product** — these are exactly where THA's bugs cluster, and exactly where one-model assembly removes whole defect classes.
- **Succeeds, lightly** for **Person/Eater** and **Household**: their enrichment (diet, goals, progress) is real but smaller; UDEA mainly means *consolidating the 4 diet stores into one owner on the eater*.
- **Partial fit** for **transactional state** (Planner, Shopping, Diary): these are not "enriched knowledge entities", they are user state. UDEA's *identity + one owner* half applies (and is already satisfied); the *progressive enrichment* half mostly does not. **Forcing enrichment semantics here would be over-engineering.** This boundary matters and is reflected in the principles (Part 8).
- **Fails / is wrong** for **reference vocabularies** (nutrient list, benefit taxonomy, diet-pattern enum, allergen library): these are shared taxonomies, not per-entity facts. UDEA explicitly keeps them *beside* the spine. Merging them in would be the "redesign for elegance" the brief forbids.

---

## PART 4 — OWNERSHIP PRINCIPLES

**Should every attribute have exactly one owner?** Yes for *facts*; the principle needs one careful exception class.

| Attribute | One owner appropriate? | Current owner(s) | Verdict |
|---|---|---|---|
| Meal title | Yes | `meals.name` | ✅ Already single — keep |
| Ingredient (as food) | Yes | **None canonical** — `meals.ingredients` text[] + re-resolved per surface | ❌ Should reference canonical food. Deepest gap. |
| Food category | Yes | `canonical_food` **and** `knowledge_foods` | ❌ Canonical should own; knowledge reads through |
| Household member | Yes | `household_members`/`household_eaters` | ✅ Single — keep |
| Product barcode | Yes | scattered (meals, fulfilment memory, grocery_products) | ❌ Needs a product entity to own it |
| Planner state | Yes | `planner_*` | ✅ Single (retire legacy `meal_plans`) |
| Shopping status | Yes | `shopping_list` (but 3 overlapping fields) | ⚠️ Single table, but `shopStatus`/`resolutionState`/`checked` overlap — consolidate semantics |
| Profile / diet info | Yes | 4 stores | ❌ Consolidate onto eater (hard restrictions) + user (account pattern) |
| Nutrient/benefit vocab | **Shared, not single-per-entity** | `knowledge_nutrients`/`knowledge_health_benefits` | ✅ Legitimately shared reference data — exempt |

**Where shared responsibility currently exists — should it remain?**

1. **Food identity across canonical + knowledge** — *No.* Canonical should be the single owner; this is the WS0X.13 finding, now confirmed as the platform pattern.
2. **Diet facts across user + eater + week-override** — *Partially.* There is a legitimate layering here: a **hard restriction** (eater-level, never overridable) is a genuinely different fact from a **soft weekly diet choice** (week-override). These are not duplicates — they are *different facts at different scopes*. The duplication is specifically `users.dietPattern/dietRestrictions` shadowing `household_eaters` — that overlap should go; the eater→week layering should stay.
3. **Reference vocabularies** — *Yes, remain shared.* Not duplication.

**Ownership principle for THA:** *Every **fact** has exactly one owning entity-attribute. Facts that look duplicated but live at different **scopes** (eater hard-restriction vs week soft-diet) are distinct facts, not duplicates — the test is "can they legitimately disagree?" If two stores must always agree, one is redundant; if they may legitimately differ, both are valid.* This test resolves the diet-preference question cleanly and prevents UDEA from over-collapsing.

---

## PART 5 — PROGRESSIVE ENRICHMENT

**Should progressive enrichment be a platform-wide principle?** Yes — **for knowledge entities; no for transactional state.**

| Intelligence layer | Enrichment makes sense? | Evidence |
|---|---|---|
| **Food Intelligence** | ✅ Strongly | Already built: identity → context → nutrients → benefits, gaps render empty (`food-report-adapter.ts`). Proven. |
| **Meal Intelligence** | ✅ Strongly | Meal = identity (name, ingredients) progressively enriched with resolved foods, nutrition, boost, diversity, household-fit. `server/services/meal-food-intelligence.ts` is an early form. The free-text ingredient gap is the only thing blocking clean enrichment. |
| **Product Intelligence** | ✅ Yes | Already shaped this way: barcode → name/brand → UPF/NOVA → additive risk → price. `product-analysis.ts` *is* progressive enrichment without the name. Formalising would unify scattered product identity. |
| **Recipe Intelligence** | ⚠️ Folds into Meal | Recipe is a meal provenance variant, not a separate entity. Its enrichment = Meal Intelligence. Do **not** create a parallel recipe enrichment stack. |
| **Household Intelligence** | ✅ Lightly | Household → members/eaters → aggregate constraints → progress/familiarity. Real but lighter; mostly a consolidation, not a new stack. |
| **Planner / Shopping / Diary state** | ❌ No | These are *user-authored transactional state*, not enrichable knowledge. They need identity + one owner (UDEA half) but **not** an enrichment pipeline. Adding one would be ceremony. |

**Where progressive enrichment makes sense:** wherever the entity has *trusted core facts* plus *optional, sourced, additive context that may be absent*. Food, Meal, Product, Household qualify.

**Where it does not:** wherever the entity *is* the user's own state with no "missing knowledge to fill in later" (Planner, Shopping, Diary, Membership). For these, the relevant UDEA principle is "one owner, no duplicate state" — not enrichment.

**The non-fabrication guarantee is the load-bearing rule.** Progressive enrichment is only safe because THA already enforces "honest gaps over invented data" (the adapter renders empty, the Launch Roadmap's claim-safety gates, `reviewedAt`-required uplift rules). Enrichment as a platform principle **must inherit this guarantee** or it becomes a fabrication surface. This is non-negotiable and belongs in the principles.

---

## PART 6 — BRIDGE ARCHITECTURE REVIEW

Every current bridge / synchronisation layer found in the codebase:

| Bridge | Why it exists | Temporary or permanent? | Removable? | Should it exist? |
|---|---|---|---|---|
| `knowledgeFoodSlug` FK (canonical→knowledge) | Two slug namespaces ("tomato" vs "tomatoes") must be joined | Currently treated as permanent (WS0X.12 wanted to formalise it) | **Yes** — once link tables re-key to canonical slug (WS0X.13) | **No** — it is already a silent-defect source. Converge instead. |
| `server/data/canonical-map.json` (resolver's own identity map) | Resolver predates the canonical spine | De facto permanent | Yes — fold into canonical + alias table | **No** as a separate store; should resolve *into* canonical |
| `client/src/lib/dietRules.ts` (copy of server file) | Browser needs Node-free logic | "Temporary" but never removed | Yes — move to `shared/` | **No** — a `shared/` module replaces it |
| `health-benefits-model.ts` (bridges 2 prototype knowledge stores) | Glue between `nutrition-benefit-library` + `pantry-knowledge` | Temporary | Yes — once both prototypes retire to WS0 | **No** — it bridges two stores that should not both exist |
| `item-resolver.ts` (name→identity for shopping/import) | Raw strings must become identity | Permanent *function*, wrong *backing store* | The function stays; its `canonical-map.json` backing should become the canonical spine | **Yes as a function, no as a separate identity store** |
| `meals.ingredients` text[] → per-surface re-resolution | Meals predate canonical food | Permanent today | Resolvable only by making ingredients reference food | **No** — this is the bridge that should not exist; it forces every surface to re-bridge |
| Reference-vocab join tables (`knowledge_food_nutrients`, etc.) | Normalised many-to-many | Permanent | No — and correctly so | **Yes** — legitimate normalisation, not a bridge to remove |

**Bridge principle:** THA has two kinds of "bridge". **(a) Namespace/sync bridges** (slug FK, dietRules copy, canonical-map, knowledge-model glue) exist only because two stores own one fact — these are debt and should be *converged away*, not formalised. **(b) Resolution functions** (item-resolver, ingredient normalisation) are legitimate and permanent — they translate messy input *into* a single identity. The test: *a bridge that keeps two owners in sync is debt; a bridge that funnels many inputs into one owner is infrastructure.* No "permanent synchronisation bridge" should be built — WS0X.12's implicit proposal to institutionalise the slug FK is the wrong direction.

---

## PART 7 — SCALABILITY

Does UDEA improve each axis? Evidence-backed.

| Axis | Verdict | Evidence |
|---|---|---|
| **Developer experience** | **Improves** | The recurring "which slug / which store do I use here?" trap (WS0X.13 Part 0 defect; the dietRules split-brain; 3 knowledge stores) is *caused* by multiple owners. One owner per fact removes the question. |
| **Maintainability** | **Improves** | Authoring a food once vs in canonical+knowledge+client libs; one diet store vs four. Register's retirement plans (M1–M4) are all "collapse to one owner" — UDEA is their generalisation. |
| **Performance** | **Neutral / marginal** | WS0X.13 found latency unchanged (stores are small, read from in-memory seeds). The honest claim is *correctness*, not speed. Do not oversell performance. |
| **Testing** | **Improves** | One integrity pass over one spine + vocab vs two seed validators (`validateCanonicalSeed` + `validateKnowledgeSeed`) and untestable cross-store drift. |
| **AI integration** | **Improves, decisively** | An AI enrichment pipeline targets **one** store with **one** key, instead of writing identity + separately-keyed knowledge + an FK. WS0X.13 Part 7 shows the draft-queue automation gets *simpler* under unification. This is the strongest forward-looking argument. |
| **Editorial workflow** | **Improves** | Author each entity once; gaps are explicit; sourcing gates attach to one record. The Launch Roadmap's editorial pole is the critical path — halving authoring surfaces directly shortens it. |
| **Future feature development** | **Improves** | New surfaces consume `buildXIntelligence()` instead of re-resolving identity. Meal Intelligence, Household progress, Product deep-links all become assembly over a spine. |

**Honest caveats:** (1) performance is *not* an argument — say so. (2) The transitional/hybrid period (one surface migrating at a time) carries real cost and must be staged behind stable service signatures. (3) Transactional domains gain less than knowledge domains — UDEA's value is uneven, and the roadmap must spend effort where the entity is enrichable.

---

## PART 8 — PLATFORM PRINCIPLES

Recommended governing set for THA (refined from the brief's illustrative list, the register's 8 governance rules, and the evidence above). Eight principles, each with a one-line rationale:

1. **One canonical identity per entity.** Every major entity (food, meal, product, eater, household) has exactly one key space. *Rationale: dual namespaces are THA's recurring silent-defect source.*

2. **One owner per fact — but facts at different scopes are different facts.** Two stores that must always agree → one is redundant. Two that may legitimately differ (eater hard-restriction vs weekly soft-diet) → both valid. *Rationale: prevents both duplication and over-collapse.*

3. **Progressive enrichment for knowledge entities; single-owner state for transactional ones.** Enrich Food/Meal/Product/Household; do not bolt enrichment onto Planner/Shopping/Diary. *Rationale: matches the product's grain without ceremony.*

4. **Runtime consumes one assembled model per entity** (`buildXIntelligence`). Surfaces never re-resolve identity themselves. *Rationale: the adapter pattern already works; re-resolution is where bugs live.*

5. **Reference vocabularies stay beside the spine, never merged in.** Nutrient lists, benefit taxonomies, diet enums, allergen libraries are shared taxonomies. *Rationale: merging them is the elegance-rewrite to avoid.*

6. **No fabricated knowledge — honest gaps over invented facts.** Enrichment must inherit THA's existing non-fabrication gates (empty renders, `reviewedAt`, sourced claims). *Rationale: trust is the product; enrichment must not become a fabrication surface.*

7. **No permanent synchronisation bridge.** A bridge that keeps two owners in sync is debt to converge away; a bridge that funnels many inputs into one owner is permitted infrastructure. *Rationale: distinguishes the slug-FK (remove) from item-resolver (keep).*

8. **Prefer evolution over replacement; retire on introduction.** New stores must name what they replace and the retirement condition, in the same document (register Rules 2/3/8). Migrate surface-by-surface behind stable signatures. *Rationale: THA's debt is un-retired predecessors, not bad new stores.*

These supersede nothing in the register's 8 rules — they *generalise* them from "source of truth governance" to "entity architecture". The register's rules become the enforcement mechanism for these principles.

---

## PART 9 — THA EVOLUTION ROADMAP REVIEW

Reviewed `docs/investigations/governance/THA_LAUNCH_ROADMAP.md` (2026-06-18) and the WS0X / WSx investigation series.

**Natural alignment (work that already moves toward UDEA):**

| Roadmap item | Alignment |
|---|---|
| "Reading from **one shared knowledge model**" (Launch Roadmap §1 launch definition) | ✅ This *is* UDEA Principle 4, already adopted as the launch bar for the five knowledge surfaces. |
| Plant Diversity Tier A→Tier B "in place, zero UI rework" | ✅ Pure progressive enrichment (Principle 3) — Tier A renders honest gaps, Tier B enriches. |
| Claim-safety gates / nutrient bridge / source-required | ✅ Principle 6 (non-fabrication) is already the roadmap's gating constraint. |
| Register migrations M1–M4 (retire prototype stores) | ✅ Principle 8 (retire on introduction) applied. |
| WS0X.13 convergence to canonical-keyed runtime | ✅ Principles 1, 4, 7. |

**Potential conflicts (planned/possible work that would fight UDEA):**

| Item | Conflict | Recommended adjustment |
|---|---|---|
| WS0X.12's **permanent canonical→knowledge bridge** | ❌ Violates Principle 7 (no permanent sync bridge) | Supersede with WS0X.13 convergence; do not build the permanent bridge. |
| Per-person **goals/likes/dislikes** added to Profile *if* recommendation engine ships at launch (Roadmap §2 item 9) | ⚠️ Risk of a *5th* diet-preference store | Attach to the **eater** entity (Principle 2), not a new `user_preferences` extension. |
| Any new knowledge surface that imports a client `.ts` data map | ❌ Violates Principles 4 & 5 (register Rule 6) | Read `buildXIntelligence()` / the DB registry; never a client static store. |
| Household Progress (post-launch) | ⚠️ Could spawn its own household-state store | Build as Household Intelligence enrichment over the existing spine. |

**Conclusion:** the roadmap is *already implicitly UDEA-aligned* — its launch definition literally requires "one shared knowledge model". The only active conflict is WS0X.12's permanent bridge, which WS0X.13 already recommends superseding. Adopting UDEA formally would make the roadmap's existing instincts into explicit, enforceable gates.

---

## PART 10 — FINAL RECOMMENDATION

### Recommend: **Option A — Adopt Unified Domain Entity Architecture as the governing architecture for THA** — bounded by the Part 8 principles.

**Why A, not B (Food Intelligence only):** The brief asked whether this is a food decision or a platform one. The evidence is decisive that it is platform-wide: the *same four failure modes* (duplicate identity, dual namespace, prototype-shadow store, free-text-where-reference-belongs) appear in **Dietary Preferences, Diet Rules, Plant Diversity, Product, and Meal** — none of which are Food Intelligence. Confining UDEA to food would leave the second-most-duplicated fact in THA (dietary preference ×4) ungoverned, and would not address the deepest structural gap (`meals.ingredients` as free text). Option B treats a platform disease as a food symptom.

**Why A, not C (a different architecture):** No alternative is needed or evidenced. THA is *already* ~85% UDEA-compliant by domain count (23/27 single-owner). The healthy domains are healthy *because* they follow UDEA; the unhealthy ones are unhealthy *because* they don't. Inventing a new paradigm would discard a working, half-built pattern (the adapter, the canonical spine, the engines) in favour of an unproven one — the opposite of "prefer evolution over replacement".

**Why A is safe despite scope:** UDEA as defined here is **not** a rewrite mandate. It is (a) a set of governing principles, (b) applied surface-by-surface behind stable signatures, (c) explicitly *excluding* transactional state from the enrichment half, (d) explicitly *preserving* reference vocabularies, and (e) sequenced so the first cutovers are the already-defective surfaces (Meal Detail food context), where any change is a net improvement. The register's governance rules become its enforcement; the existing adapter becomes its template.

> **One-line answer to the governing question:** *Yes — THA should adopt Unified Domain Entity Architecture as its governing principle, because the architecture that makes Food Intelligence trustworthy is the same architecture that already makes Meals, Planner, Shopping, and Household trustworthy — and the domains in trouble are precisely the ones that broke it.*

---

## TRUST CHECK

| Question | Answer | Evidence |
|---|---|---|
| Would adopting these principles **reduce future architectural drift?** | **Yes** | Drift in THA = un-retired predecessor stores (food ×4, diet ×4, knowledge ×3). Principle 8 (retire on introduction) + register Rules 2/3 make drift a gate failure, not a silent accretion. |
| Would they **improve long-term trust?** | **Yes** | The register's only 🔴 launch risk (three phrasings of "chickpeas" across surfaces) is a *direct* multiple-owner symptom. One owner = one answer. Principle 6 keeps enrichment non-fabricating. |
| Would they **reduce duplication?** | **Yes** | Of 9 food duplications (WS0X.13), 7 are removable; of 4 register duplications, all 4 have retirement plans. UDEA generalises these into a standing rule rather than per-investigation cleanup. |
| Would they **simplify AI-assisted development?** | **Yes** | An AI enrichment/authoring pipeline targets one store, one key, one model (WS0X.13 Part 7). The free-text `meals.ingredients` gap is exactly what makes AI meal-understanding brittle today; referencing canonical food fixes it at the root. |

**Am I recommending A for elegance or on evidence?** On evidence. The single strongest data point is *not* taste: it is that **every domain the register marks "Authoritative — declared" is trusted, and every domain it marks "Contested" carries a named launch risk** — a perfect correlation between single-ownership and trustworthiness, observed across 27 domains. UDEA is the name for what the trusted 23 already do.

---

## DEFINITION OF DONE

| Criterion | Status |
|---|:--:|
| Every major THA domain reviewed | ✓ Part 1 (18 domains) |
| Existing duplication identified | ✓ Parts 1–2 (incl. food ×4, diet ×4, knowledge ×3, meals free-text) |
| Unified architecture assessed | ✓ Parts 3–4 |
| Progressive enrichment reviewed | ✓ Part 5 (knowledge vs transactional boundary) |
| Ownership principles defined | ✓ Part 4 (scope-test) + Part 8 |
| Bridge architectures analysed | ✓ Part 6 (sync-bridge vs resolution-function) |
| Scalability assessed | ✓ Part 7 (7 axes, with honest caveats) |
| Platform principles proposed | ✓ Part 8 (8 principles) |
| Master Evolution Roadmap reviewed | ✓ Part 9 |
| Single recommendation made | ✓ Part 10 (Option A) |
| Project file created | ✓ this file |

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | YES (source code + schema only) |
| Writes new data | **NO** |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Code / schema / validation / runtime / architecture changed | **NO** |

---

## SCOPE LOCK — confirmed

Investigation only. Did **not**: modify code · change schema · migrate data · build/redesign any system · alter runtime · change validation · touch any UI. The only write is this document. Implementation ideas are isolated below under SUGGESTION.

---

## SUGGESTION — implementation opportunities (NOT executed; for future workstreams)

Listed separately per scope lock. None of these is authorised by this document.

1. **Ratify the eight principles (Part 8) as `docs/ARCHITECTURE_PRINCIPLES.md`** and wire the register's governance gate into the investigation template. Zero code; pure governance. Highest leverage, lowest risk.
2. **Close the deepest gap first: make `meals.ingredients` reference canonical food.** Introduce a resolved ingredient link (meal_item → canonical slug) so Plant Diversity, Boost, and Meal Food Intelligence stop each re-resolving free text. This is the single highest-value structural change and the root cause of repeated food-resolution bugs.
3. **Consolidate Dietary Preference onto the eater** (Principle 2): retire `users.dietPattern`/`dietRestrictions` overlap; keep eater hard-restrictions + week soft-diet as legitimately-scoped distinct facts; do not add a 5th store for goals/likes.
4. **Execute register migrations M1–M4** (retire `nutrition-benefit-library.ts`, `pantry-knowledge.ts`, move `dietRules.ts` to `shared/`, replace `nutrition-variety.ts` with `diversity_group`) — each is a direct UDEA application already specified.
5. **Adopt WS0X.13 convergence; do not build WS0X.12's permanent bridge.** Re-key knowledge link tables to canonical slug; retire `knowledgeFoodSlug`; fold `canonical-map.json` into the spine.
6. **Define a Product entity** to own barcode/name/brand once, and reframe `product-analysis.ts` as `buildProductIntelligence(barcode)` — formalising the enrichment it already performs.
7. **Generalise the adapter into per-entity `buildXIntelligence()` read models** (Food first — it exists; then Meal; then Product), each consumed by surfaces in place of re-resolution.
8. **Complete the planner migration** — retire legacy `meal_plans`/`meal_plan_entries` once `planner_*` fully supersedes them (Principle 8).

---

*Report location: `docs/investigations/governance/THA_CORE_ARCHITECTURE_PRINCIPLES.md`*
*Rollback: `git checkout rollback/core-arch-investigation-20260625` (committed baseline `a8a912a`) · delete this file to revert this task's only write.*
