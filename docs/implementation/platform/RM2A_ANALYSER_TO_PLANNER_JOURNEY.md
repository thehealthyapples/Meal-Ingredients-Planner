# RM2A — Analyser → Planner Journey

**Type:** Implementation (delivers the workstream RM1 recommended). Per
`docs/architecture/README.md`, investigations *discover*; implementations *build and
maintain*. This document records what was built, how it was verified, and what remains.

**Date:** 2026-07-15
**Session ID:** `RM2A_Analyser_To_Planner_Journey`
**Rollback:** `rollback/RM2A-analyser-to-planner-journey-20260715` → `0f0615aa`
**Governing basis:** `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`
(headline recommendation §2, the missing journey §7, workstream RM2 §8).
**Status:** Complete.

---

## 1. Mission

Implement the missing user journey:

> Analyser → search a product → analyse it → **Add to Planner**

reusing the **existing canonical meal identity** — no new Product entity, no second
planner reference type. Concretely: an "Add to Planner" action from the Analyser that
**resolve-or-creates** the canonical `meals` row **by barcode** (idempotent — reusing an
existing row where possible), then creates the **normal** `planner_entries` row using
that `mealId`, preserving all existing planner, nutrition and shopping behaviour.

This is RM1's option **(c)** — the Planner stores a `mealId` reference to the canonical
identity — realised with no schema change, exactly as RM1 §6 predicted.

---

## 2. What already existed (and what was actually missing)

Discovery found the *UI* half of the journey already present on the main Analyser and
the *identity* half broken:

- **`products-page.tsx` → `AnalyserDetailV2` "Add to Week" → `AddToWeekModal`** already
  chained "create cookbook meal" + "create planner day-slot entries". The button even
  reads *"Add to Planner"*.
- **`PlannerAnalyserContent.tsx`** (the in-Planner Analyser panel) had only **"Save to
  Cookbook"** followed by a **drag** onto a day slot — no direct button.
- **The real defect:** every save went through `POST /api/meals` (or
  `POST /api/meals/save-product`), and both **always inserted a new `meals` row**. There
  was **no resolve-or-create-by-barcode** anywhere (confirmed: `storage.createMeal`
  always inserts; the only barcode-vs-meals query is the bulk importer's dedup set). So
  **the same product added twice produced two cookbook identities** — a direct violation
  of RM1's Principle 1 and of this mission's first verification criterion.

The missing journey was therefore **one identity guarantee + one button**, not a new
entity — precisely RM1 §7.

---

## 3. Implementation

### 3.1 Idempotent canonical-identity resolution (the core)

**`server/storage.ts` — new `resolveOrCreateProductMeal(userId, insertMeal)`.**
When the product carries a `barcode`, it looks up the household member's existing
`openfoodfacts` `meals` row for that barcode and **reuses it**; otherwise it falls back
to `createMeal`. Returns `{ meal, created }` so callers can skip duplicate work on reuse.

```ts
async resolveOrCreateProductMeal(userId, insertMeal): Promise<{ meal; created }> {
  const barcode = insertMeal.barcode;
  if (barcode) {
    const [existing] = await db.select().from(meals).where(and(
      eq(meals.userId, userId),
      eq(meals.barcode, barcode),
      eq(meals.mealSourceType, "openfoodfacts"),
    )).orderBy(meals.id).limit(1);
    if (existing) return { meal: existing, created: false };
  }
  return { meal: await this.createMeal(userId, insertMeal), created: true };
}
```

Scope is **per household member** by design: it fixes the duplication a user actually
experiences (re-adding *their* product), and never silently hands one member's identity
to another. It does **not** touch canonical ownership, and creates no new key space.

### 3.2 Both product-creation routes now resolve, not blindly insert

**`server/routes.ts`:**
- `POST /api/meals` (`api.meals.create`) — when, and only when, the payload is a product
  save (`mealSourceType === 'openfoodfacts'` **and** a `barcode` is present), it routes
  through `resolveOrCreateProductMeal`. Every other meal create (scratch recipes,
  imports, components) keeps its exact previous `createMeal` path. On **reuse**, the
  duplicate nutrition write, the `MEAL_SAVED` telemetry, and `autoAnalyzeMeal` are all
  skipped (the identity and its facts already exist); the response is `200` instead of
  `201`. On **create**, behaviour is byte-for-byte unchanged.
- `POST /api/meals/save-product` (`api.meals.saveProduct`) — same treatment: resolve by
  barcode, only write nutrition / fire telemetry when a new identity was created.

### 3.3 A direct "Add to Planner" on the in-Planner Analyser

**`client/src/components/PlannerAnalyserContent.tsx`** now shows a primary **"Add to
Planner"** action on the analysed-product card, opening the existing **`AddToWeekModal`**
(reused, not reinvented) so the household can place the product into **any planner week ·
day · meal slot**, or into weekly provisioning. "Save to Cookbook" + drag remains for
users who only want the cookbook entry. The action uses the design-system `Button`
(adopting the owner, adding no raw `<button>`).

Because `AddToWeekModal` creates the cookbook meal via `POST /api/meals` — now
idempotent — the modal's existing flow **automatically** stopped multiplying identities;
no change to the modal was required.

### 3.4 What was deliberately *not* changed

Per the mission's guardrails: no new `products` table; no second planner reference type
(`planner_entries.mealId` unchanged); Planner and Cookbook untouched structurally;
shopping resolution untouched (a ready-meal line still emits as one `unit:'pack'` item
and the barcode still rides along as the preferred-match hint); no ready-meal migration;
canonical ownership untouched. `meal_template_products` / the dead resolution engine are
left for **RM3** (RM1 §8), exactly as scoped.

---

## 4. The user journey, end to end

1. Open the Analyser (main Analyser page, or the in-Planner Analyser panel).
2. **Search** a product (`GET /api/search-products`) → **analyse** it (Apple Score, UPF,
   NOVA, additives — all computed by the existing pure functions; the Analyser stays a
   read lens).
3. Press **Add to Planner** → choose week · day · slot (or weekly provisioning).
4. The product is **resolved to one canonical `meals` identity by barcode** (reused if
   already in the member's cookbook, created once if not), then a **normal
   `planner_entries` row** is created against that `mealId` via
   `POST /api/planner/days/:dayId/items` — the identical operation used for every other
   meal.
5. It appears in the Planner like any meal; nutrition, Apple Score, dietary safety and
   shopping all resolve from the one identity, unchanged.

> **On "Today":** the THA Planner is week/day-structured (`weekNumber`, `dayOfWeek`) and
> owns **no calendar mapping** (the INT2 planner binding is explicit that "today" has no
> owner). "Add to Planner" therefore offers **any week · any weekday · any slot** — the
> current weekday is selectable like any other. We did not fabricate a calendar "today"
> the platform does not model (Experience Principle 6 — honest gaps over invented facts).

---

## 5. Verification

**Automated — `server/tests/test-rm2a-analyser-to-planner.ts`** (new; wired into the
`npm test` chain as `test:rm2a-analyser-to-planner`). Runs against the real database,
creates and cleans its own rows. **14/14 pass:**

- Resolving the same barcode twice reuses **one** identity (`created=false`, same
  `meal.id`, exactly one row for the barcode) — *the same product never creates duplicate
  meal identities.*
- A different barcode creates a distinct identity.
- A product with **no** barcode always creates (legacy behaviour preserved).
- Identity is **scoped per household member** — a second user resolving the same barcode
  gets their own row, never user A's.
- The resolved identity carries the ready-meal shape downstream relies on
  (`isReadyMeal`, `mealSourceType='openfoodfacts'`, `barcode`) — so nutrition, Apple
  Score, dietary safety and shopping are unaffected.

**Regression — existing suites pass unchanged:**
- `test:intelligence-analyser-binding` — 30/30
- `test:intelligence-planner-binding` — 31/31
- `test:intelligence-meals-binding` — 72/72
- `test:product-dedup` — 76/76

**Typecheck:** the CI typecheck gate shows **no new errors in any file this workstream
touched** (`server/storage.ts`, `server/routes.ts`, `PlannerAnalyserContent.tsx`,
`test-rm2a-analyser-to-planner.ts`). Pre-existing baseline regressions in the working
tree belong to other concurrent sessions, not RM2A.

**Manual reasoning against each mission verify point:**
- *Same product never duplicates identity* — proven (test 1).
- *Products plannable directly from the Analyser* — "Add to Planner" on both Analyser
  surfaces.
- *Planned products appear correctly in Planner* — a normal `planner_entries` row via the
  unchanged `/items` route.
- *Nutrition / Apple Score / dietary safety continue to work* — resolved from the one
  identity; nothing removed.
- *Shopping unchanged* — no touch to shopping resolution; ready-meal line still one
  `unit:'pack'` item; barcode still the preferred-match hint.
- *Existing planner functionality passes regression* — suites above.

---

## 6. Adoption / compliance notes

RM2A creates **no new client building block** — it adopts existing owners: `AddToWeekModal`
(Dialog) gains a new importer, and `components/ui/button.tsx` gains an adopter (now 60).
`npm run adoption:check` reports two failures — a `HouseholdNutritionPanel.tsx` orphan and
a raw-`<button>` ceiling overage — **both from other sessions' uncommitted working-tree
files**, not from RM2A. This workstream adds **zero** raw buttons and increases adoption;
no register edit is owed by it.

---

## 7. Remaining gaps

1. **Cross-member canonical identity.** Resolution is per household member. If the
   platform later wants a single shared canonical identity per barcode across members
   (or reuse of the `userId=0` imported `openfoodfacts` system rows), that is a
   deliberate ownership decision — not taken here to avoid touching cookbook ownership.
2. **A one-tap "Today"** would require the Planner to own a calendar mapping, which it
   does not (see §4). A genuine calendar Planner is a separate experience decision.
3. **RM3 — retire `meal_template_products` + `meal-resolution-service.ts`** (RM1 §8): the
   dead second product representation. Untouched here by design.
4. **Ready-meal vocabulary unification** (`mealSourceType` / `isReadyMeal` /
   `mealFormat`, RM1 §6.2) and the fate of the ~300 authored generic ready meals
   (RM1 §6.3) remain open product decisions, recorded so they are not rediscovered.

---

## 8. Milestone commit

Commit: **`RM2A — Analyser → Planner Journey`** (see git log). Files:
`server/storage.ts`, `server/routes.ts`,
`client/src/components/PlannerAnalyserContent.tsx`,
`server/tests/test-rm2a-analyser-to-planner.ts`, `package.json`, this document, and the
session run file.

---

_Rollback reference: `rollback/RM2A-analyser-to-planner-journey-20260715` → `0f0615aa`._
