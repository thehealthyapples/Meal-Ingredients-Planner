# RM1 — Canonical Ready Meal Role

**Type:** Investigation (point-in-time analysis and recommendation). Per
`docs/architecture/README.md`, investigations *discover*; they do not govern. This
document recommends a target architecture and the workstream that would adopt it.
It changes no code, no schema, no Planner, and no Cookbook, and migrates no ready
meals.

**Date:** 2026-07-15
**Session ID:** `RM1_Canonical_Ready_Meal_Role`
**Rollback:** `rollback/RM1-canonical-ready-meal-role-20260715` → `0f0615aa`
**Status:** Complete — recommendation pending direction on the next workstream.

---

## 1. Mission

Determine the correct long-term architectural role of ready meals within THA:

- Should ready meals remain **Cookbook** entities?
- Should they instead become **Product Intelligence** entities surfaced through the Analyser?
- Should the **Planner** support both cookable meals and analysed products without duplicating ownership?

And specifically resolve the **missing journey**:

> Analyser → search "Beef Lasagne" → select retailer product → **Add to Planner**

deciding whether the Planner should store (a) the retailer product, (b) a generic
meal intent, or (c) a planner reference to the canonical product.

---

## 2. Headline recommendation

**A ready meal is a `meals`-table identity that you buy instead of cook. Keep it
there. Do not create a Product entity; make the Analyser the intelligence *lens*
over that identity, and keep the Planner storing a `mealId` (option c).**

Concretely:

1. **One identity — the `meals` row.** THA already treats a packaged product as a
   meal-you-don't-cook (`isReadyMeal`, `mealFormat='ready-meal'`, `barcode`/`brand`
   columns, an OpenFoodFacts importer that writes into `meals`, and an Analyser
   "Save" that writes into `meals`). Extend this; do **not** introduce a `products`
   table — that would be a second key space for the same real-world thing
   (Principle 1) and a permanent sync bridge to `meals` (Principle 7).
2. **The Analyser is a reasoning lens, not an owner.** UPF, Apple Score, NOVA and
   additives are *computed* by the pure functions `product-analysis.ts` /
   `upf-analysis-service.ts`; the analyser capability owns no stored product (its
   Capability Card already says so). Product Intelligence is a **read/enrichment
   layer over the meal identity**, not a rival entity.
3. **The Planner keeps referencing `mealId` — option (c).** Not the retailer
   product (a), not a free-text intent (b). The plan holds the canonical identity;
   every downstream fact (nutrition, Apple Score, allergens, cross-supermarket
   shopping) resolves from that identity at read time (Principle 4).
4. **Cross-supermarket resolution stays at the shopping layer.** The plan holds a
   store-neutral meal; the existing shopping-resolution layer maps it to whatever
   store the household uses. The analysed product's barcode becomes a *preferred-
   match hint*, never the planner's stored identity.
5. **Retire the duplicate.** `meal_template_products` + `meal-resolution-service.ts`
   are a *second* product representation with no live consumer. Converge them away
   under Principle 8 (a separate follow-on workstream — not this one).

The "missing journey" then costs no new entity and no new planner reference type:
it chains primitives THA already has (§7).

---

## 3. What exists today — the evidence

A "packaged product / ready meal" is currently represented **five** disconnected
ways. This scatter is the real finding.

### 3.1 `meals` rows, `mealSourceType='ready_meal'` — THA-authored generic ready meals
- Seeded by `server/lib/seed-ready-meals.ts` into the **`meals`** table as system
  meals (`userId=0`, `isSystemMeal=true`, `mealFormat='ready-meal'`,
  `isReadyMeal=true`). ~300 entries from `server/lib/ready-meals-seed.ts`.
- The seed shape carries **only** `name`, `category`, `dietTypes`, and optional
  drink/audience/freezer flags — **no nutrition, price, UPF, Apple Score, allergens,
  or barcode**. No `nutrition`, `meal_items`, or `meal_allergens` rows are created.
- Surfaced in the Cookbook under the "Packaged & Processed" group
  (`meals-page.tsx:2492–2505`), with a placeholder tile and a "Ready Meal" badge.

### 3.2 `meals` rows, `mealSourceType='openfoodfacts'` — real branded products
- The **closest thing to a real product identity**, and it lives in `meals`.
- Written by the bulk importer `server/lib/openfoodfacts-importer.ts:298–320`
  (`db.insert(meals)…` with `barcode`, `brand`, `isReadyMeal`, a `nutrition` row),
  and by the Analyser "Save" path `routes.ts:1000–1031` (`api.meals.saveProduct`)
  and `PlannerAnalyserContent.tsx` → `POST /api/meals`.
- Carries `barcode`, `brand`, and a real `nutrition` row.

### 3.3 `meal_template_products` — denormalized per-template product rows
- `shared/schema.ts:82–94`: `mealTemplateId` (plain integer, **no FK**),
  `productName`, `store` (single nullable retailer), `qualityTier`, `estimatedPrice`,
  `upfScore`, `thaRating`, `imageUrl`, `barcode`. **No nutrition, no allergens, no
  canonical/OFF linkage** — a standalone denormalized copy.
- Consumed only by `server/meal-resolution-service.ts` (scores scratch-meal vs
  ready-meal per template). That engine is **effectively dead**: the client never
  calls the `/resolve` route, and `resolveAllTemplatesForPlan` is not route-wired.
- Its only writer is the orphaned Analyser "link to template" flow
  (`products-page.tsx:925–950`), which creates a throwaway template per product with
  `store: null`.

### 3.4 `grocery_products` / `ingredient_products` — curated retailer catalogues
- `grocery_products` (`schema.ts:166–179`) and `ingredient_products`
  (`schema.ts:1093`) map **ingredients → retailer products** for *shopping
  resolution*. Keyed by `ingredientName`/`supermarket`; **no barcode**; not a product
  identity.

### 3.5 Ephemeral live OpenFoodFacts — the Analyser's default
- `GET /api/products/barcode/:barcode` and `GET /api/search-products` live-fetch
  OpenFoodFacts, recompute UPF/Apple Score/additives **in-memory**, and persist
  **nothing** but telemetry (`barcode_lookup_events`).

> **There is no canonical product entity keyed by barcode.** The nearest persisted
> product identity in THA is a barcode-bearing row in the **`meals`** table.

### 3.6 The Planner reference model
- `planner_entries` (`schema.ts:446–462`) references **`mealId` only** — a single
  row in `meals`. Not a template, not a product, not free text.
- A ready meal is already a `meals` row, so it already flows into the planner by
  `mealId` exactly like any other meal.
- Shopping generation (`routes.ts:4100–4282`) treats an `isReadyMeal` meal as a
  single **`unit:'pack'`, `category:'ready meals'`** line item (name = meal name),
  bypassing ingredient explosion — but it does **not** pin it to a specific retailer
  product; that happens later at the shopping-resolution layer.

### 3.7 The missing journey, as it stands
- The Analyser can search OFF, analyse, and **"Save to Cookbook"** (creates an
  `openfoodfacts` meal). The user must then separately open the Planner and add that
  meal by `mealId`. There is **no direct "Add to Planner"** from the Analyser, and no
  "add the exact retailer product to the plan" action anywhere.

---

## 4. Evaluating the three options against the principles

The mission's question — what should the Planner store — is the crux. Judged against
`ARCHITECTURE_PRINCIPLES.md`:

| Option | What the plan would hold | Verdict |
|---|---|---|
| **(a) the retailer product** | A specific Tesco/Aldi SKU pinned onto the planner row | **Reject.** Bolts product state onto transactional planner state (Principle 3). Wrong for the "different supermarkets" requirement — pins one store's SKU into a plan the household may shop elsewhere. Creates product identity on the planner row *and* wherever else it lives (Principles 1–2). |
| **(b) a generic meal intent** | A store-neutral "Beef Lasagne" idea | Partially right — it is exactly how THA-authored ready meals work today, and it is cross-supermarket-neutral. But it **discards the specific product the user analysed** (its barcode, brand, exact UPF/allergens), so it cannot answer "add the product I just looked at." |
| **(c) a planner reference to the canonical identity (`mealId`)** | The canonical meal-identity of the product | **Adopt.** One identity (P1); planner owns *placement*, `meals` owns *identity* (P2); no duplicated transactional state (P3); every fact resolves from one assembled model (P4). The specific product is preserved *as* the identity; store-neutrality is preserved because resolution to a SKU happens later, at shopping time. |

Option (c) is the only one that keeps a single owner for identity while still letting
the household shop wherever they like. It is also the option that requires the least
change, because the Planner **already** stores `mealId`.

---

## 5. How the recommendation answers every stated concern

| Concern | Where it is owned under the recommendation |
|---|---|
| **Users shopping at different supermarkets** | The plan holds a store-neutral meal-identity. Store choice is resolved at shopping time, per household, by the existing shopping-resolution layer (`grocery_products` / `product_matches` / `retailIntelligence`). The plan never pins a store. |
| **Shopping resolution** | Unchanged. A ready-meal line already emits as a `unit:'pack'` item and resolves to a store product downstream. The analysed barcode becomes a *preferred-match hint* via the existing `shopping_list.matchedProductId`, not a stored planner identity. |
| **Nutrition** | Owned by the `nutrition` table joined to the `meals` identity (`openfoodfacts` products already get a `nutrition` row). Progressive enrichment (P3): gap renders as gap, never fabricated (P6). |
| **Apple Score / UPF** | Computed by the Analyser's pure functions over the identity's ingredients; the Analyser is the read lens, not a second store. No score is persisted onto the plan. |
| **Allergens** | Owned by `meal_allergens` against the `meals` identity — one owner, same as every other meal. |
| **Product substitution** | Happens at the shopping/basket layer against the household's stores, **not** by rewriting the plan. The plan is stable; the basket substitutes. |
| **Planner ownership** | `planner_entries` owns *placement* (which meal, which day, which eater). `meals` owns *identity*. These are different facts at different scopes (P2) — no overlap, no duplication. |
| **Shopping list generation** | Unchanged path; the ready-meal-as-`meals`-row already generates a single shopping line. Nothing new to own. |

---

## 6. Migration impact

- **No schema migration is required for the core recommendation.** The Planner
  already stores `mealId`; analysed products already land in `meals`. The core work
  is *consolidation + one new UI action*, not a data migration. (And this document
  performs neither — the mission forbids it.)
- **Cleanups surfaced for future, separate workstreams (not now):**
  1. **Retire `meal_template_products` + `meal-resolution-service.ts`.** A second,
     unlinked product representation with no live consumer — the store to converge
     away under Principle 8 / Register Rule 3. Its legitimate idea ("this meal-shell
     can be cooked *or* bought") is already expressible as two `meals` rows sharing a
     `meals.mealTemplateId` (the FK already exists).
  2. **Unify the ready-meal vocabulary.** The "product-ness" of a meal is currently
     encoded in *four overlapping* ways — `mealSourceType ∈ {ready_meal,
     openfoodfacts}`, the `isReadyMeal` boolean, and `mealFormat='ready-meal'` —
     checked inconsistently across ~20 client files. This is a "one canonical
     identity" cleanup (P1), not a data migration.
  3. **Decide the fate of the ~300 authored generic ready meals** (§3.1), which carry
     no nutrition/UPF/allergens and therefore render as gaps. Keep them as generic
     intents, or enrich them — a product decision, recorded here so it is not
     rediscovered.
- **No governing-architecture change.** This recommendation *fits inside* the
  existing Source-of-Truth domains (12 Meal Identity, 14 Planner, 15 Shopping, 19
  Product Analysis). If adopted, Domain 13's `meal_template_products` half and its
  resolution engine are the only entries that would change status (→ retiring).

---

## 7. The missing journey, once identity is unified

Analyser → search "Beef Lasagne" → select → **Add to Planner** becomes a chain of
primitives THA **already** has:

1. **Resolve-or-create the canonical identity.** Look up the product by `barcode`;
   reuse the existing `meals` row if present (Principle 1 — one identity, no duplicate
   cookbook row per add), else create it via the existing `saveProduct` /
   `openfoodfacts` path.
2. **Place it.** Create a `planner_entries` row with that `mealId` — the exact same
   operation as adding any other meal to a day slot.
3. **Shop it later, unchanged.** The plan's ready-meal line resolves to the
   household's store at shopping time; the analysed barcode rides along as a
   preferred-match hint.

No new entity. No new planner reference type. No change to how the Planner or
Cookbook fundamentally work — only a new action that composes existing ones.

---

## 8. Recommended next implementation workstream

**RM2 — Analyser → Planner Convergence (the "Add to Planner" journey).** Scope:

1. Add a single **"Add to Planner"** (and "Add to this week / day") action to the
   Analyser surfaces, chaining resolve-or-create-meal + create-planner-entry (§7).
2. Make identity resolution **idempotent on barcode**, so re-adding the same product
   reuses one canonical `meals` row (P1) instead of multiplying cookbook rows.
3. Leave shopping resolution untouched; carry the barcode as the shopping preferred-
   match hint.

**RM3 — Retire `meal_template_products` / resolution engine** (follow-on, Principle 8):
converge the dead second product representation away, expressing "cook-or-buy" as two
`meals` rows under one `meal_template`.

RM2 is the higher-value, lower-risk starting point: it delivers the missing user
journey using only existing primitives and no schema change. RM3 is pure debt
convergence and can follow independently.

---

## 9. Summary

- **Ready meals should remain Cookbook (`meals`) entities** — a meal you buy instead
  of cook — **not** a new Product entity. The Analyser is the *intelligence lens* over
  that identity, not a second owner.
- **The Planner should store option (c): a `mealId` reference to the canonical
  identity** — which it already does. Not the retailer product, not a free-text intent.
- **Cross-supermarket concerns live at the shopping layer**, keeping the plan
  store-neutral and substitution stable.
- **The missing Analyser → Planner journey needs no new entity** — only an action that
  composes existing primitives (RM2).
- **The real debt is duplication:** five scattered product representations, one of them
  (`meal_template_products` + its dead resolution engine) a converge-away candidate
  under Principle 8 (RM3).

---

_Rollback reference: `rollback/RM1-canonical-ready-meal-role-20260715` → `0f0615aa`._
_No code, schema, Planner, or Cookbook was changed by this investigation._
