# Hybrid Meal Occasion Model — Implementation Scope Investigation

**Date:** 2026-06-14
**Branch:** `main` @ `39de349`
**Rollback tag:** `rollback/pre-hybrid-meal-occasion-2026-06-14` → annotated tag object `f80cf8d`, points to commit **`39de349`**
**Restore command:** `git reset --hard rollback/pre-hybrid-meal-occasion-2026-06-14`
**Scope:** Investigation only. **No** code, schema, migration, shell seeding, or planner changes.
**Method:** Read-only source audit of `shared/schema.ts`, `server/lib/smart-suggest-service.ts`,
`server/lib/external-meal-service.ts`, `server/lib/meal-scoring-service.ts`, `server/routes.ts`,
and `client/src`. Builds on the two prior read-only investigations
(`FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md`, `SMART_PLANNER_POST_ENFORCEMENT_SLOT_FILL_FAILURE.md`).

> **Pre-work confirmation:** at investigation start the tracked working tree was clean (only
> untracked investigation docs + read-only `server/scripts/sim-*.ts` / `query-*.ts` present). The
> rollback tag was created **before** any work. No files were modified to produce this document
> except this document itself.

> ⚠️ **Terminology (carried from prior doc):** the existing `proteinSlots` / `carbSlots` /
> `vegSlots` / `toppingSlots` / `sauceSlots` columns are **component slots** (the shared-meal
> base+swappable-parts architecture). They are **NOT** meal-occasion slots. Everywhere below,
> "slot" unqualified means **meal-occasion** (breakfast / lunch / dinner / snack).

---

## TL;DR — Final Recommendation: **STATUS B**

> **Implement `primarySlot` + `suitableSlots[]` first; defer `energyBand` + `styleTags[]`.**

The product direction (full Hybrid model) is correct and was endorsed by the prior investigation
(Status D / Hybrid). For *implementation*, the safest path is to ship the two **planner-eligibility**
fields now (they fix the real failures: dinner over-supply, starved snack/lunch, dead Tier-4) and
defer the two **advisory** fields (`energyBand`, `styleTags`) which carry no planner risk and need
curation/derivation design before they earn their schema columns. All four are additive and
backward-compatible, so deferring two of them costs nothing and removes two columns' worth of
seeding/UX scope from the first change. See §10 for the full rationale and the alternative if the
product owner wants all four columns landed at once.

Why this is low-risk regardless of A vs B:
1. **One enforcement point.** Occasion eligibility lives in exactly one map + one function
   (`SLOT_CATEGORY_MAPPING` @ `smart-suggest-service.ts:250`, consumed by `getCandidateSlotFit` @
   `:325`). Everything else funnels through these.
2. **All new columns are nullable / default-empty and additive** — existing 650 templates and
   2,108 meals stay valid with zero backfill required for correctness (backfill is an
   *enhancement*, not a *migration prerequisite*).
3. **Migration is `drizzle-kit push`, not versioned SQL** (see §2) — additive nullable columns are
   the safest possible push.

---

## 1. Schema Impact

### 1a. Tables audited

| Table | Occasion field today | Needs new fields? |
|---|---|---|
| **`meal_templates`** (`shared/schema.ts:48-72`) | `category text NOT NULL default 'dinner'` (single value) | ✅ **Yes** — primary target |
| **`meals`** (`shared/schema.ts:88-121`) | `categoryId integer` FK → `meal_categories` (12-row enum) | ⚠️ **Optional** — see §1d |
| **`meal_plan_entries`** (`shared/schema.ts:389-397`) | `slot text NOT NULL` (the *resolved* occasion) | ❌ **No** — stores the chosen slot, not suitability |
| `planner_entries` (`shared/schema.ts:417+`) | `mealType text NOT NULL` (resolved) | ❌ No |
| `meal_categories` enum table | the 12-row clean taxonomy | ❌ No (referenced as the canonical slot vocabulary) |

> `meal_plan_entries.slot` and `planner_entries.mealType` record **where a meal was placed**, not
> **where it may be placed**. They are outputs of the planner and are unaffected by adding
> suitability inputs. Existing rows remain 100% valid.

### 1b. Proposed fields on `meal_templates`

| Field (TS / column) | Type | Nullable / default | Migration? | Phase |
|---|---|---|---|---|
| `primarySlot` / `primary_slot` | `text` | nullable, no default | ✅ additive | **B (now)** |
| `suitableSlots` / `suitable_slots` | `text[]` | nullable (default empty `{}` acceptable) | ✅ additive | **B (now)** |
| `energyBand` / `energy_band` | `text` | nullable | ✅ additive | Defer (A only) |
| `styleTags` / `style_tags` | `text[]` | nullable / `{}` | ✅ additive | Defer (A only) |

- **`category` is retained unchanged.** Do **not** rename or drop it — it is the back-compat
  default, the fallback authority (§3), and is read by the API and matcher. `primarySlot` is a
  *new* normalised companion, not a rename.
- **Vocabulary:** constrain `primarySlot` and each `suitableSlots[]` element to the lower-cased
  occasion set `{breakfast, lunch, dinner, snack}` (align with `SLOT_CATEGORY_MAPPING` keys). Note
  `category` today also carries non-occasion values (`drink`, `dessert`, `frozen meal`, `kids meal`,
  `baby meal`) — `primarySlot`/`suitableSlots` should map those to their planner slot
  (`drink`/`dessert` → snack via the existing mapping) rather than copy them verbatim.

### 1c. Zod / insert schemas needing edits (for Phase B fields)

| Schema | File:line | Change |
|---|---|---|
| `insertMealTemplateSchema` (`createInsertSchema(...).pick`) | `shared/schema.ts:805-827` | add `primarySlot: true, suitableSlots: true` (+ `energyBand`/`styleTags` if Status A) to the `.pick({})` |
| inline PATCH `updateSchema` | `server/routes.ts:5399-5403` | add `primarySlot`, `suitableSlots` optional fields (currently only `name`/`category`/`description`) |
| `MealTemplate` / `InsertMealTemplate` types | `shared/schema.ts:841-842` | auto-derived from the table + insert schema — no manual edit |
| `ScoredCandidate` | `server/lib/meal-scoring-service.ts:4-12` | add `suitableSlots?: string[] | null` (+ `primarySlot`, advisory fields if used) so the planner can read suitability off a candidate (currently only has `category: string | null`) |

### 1d. `meals` table — deliberate non-decision for Phase B

Saved/scraped **meals** carry occasion via `categoryId` (single FK), not the template path.
Per-meal `suitableSlots` on `meals` would let *user* meals span slots too — valuable, but it is a
larger surface (affects meal import, every candidate build site, 2,108 rows). **Recommendation:
exclude `meals` from Phase B.** The planner already derives per-meal slot fit from `category` via
`SLOT_CATEGORY_MAPPING`, and that fallback (§3) keeps meals working. Revisit `meals.suitableSlots`
as a later phase once the template path is proven.

---

## 2. Migration Impact

### 2a. Mechanism — **`drizzle-kit push`, not versioned SQL**

`package.json:14` → `"db:push": "drizzle-kit push"`. `drizzle.config.ts` points `out: ./migrations`
but `migrations/` contains only the initial snapshot `0000_conscious_nuke.sql` + `meta/`. The team
evolves the DB by **editing `shared/schema.ts` and running `npm run db:push`** (schema-diff against
the live DB), **not** by authoring incremental SQL migration files.

**Implication:** "the migration" = (1) add the columns to the `mealTemplates` table definition in
`shared/schema.ts`, (2) run `db:push`. Because all four columns are **additive and nullable**,
`drizzle-kit push` will apply them non-interactively and **without data loss** (no `NOT NULL`
without default, no type changes, no drops). This is the safest class of push.

### 2b. Per-field migration + backfill strategy

| Field | DDL effect (via push) | Backfill (separate, optional, not a correctness prerequisite) |
|---|---|---|
| `primary_slot` | add nullable `text` | `primary_slot = lower(category)` mapped to occasion vocab; rows with non-occasion `category` (drink/dessert/…) → their planner slot |
| `suitable_slots` | add `text[]` (nullable or default `{}`) | derive from existing `SLOT_CATEGORY_MAPPING` reverse logic: `suitable_slots = [every slot whose allow-list includes lower(category)]`. e.g. `category='snack'` → `[lunch, snack]`; `category='smoothie'` → `[breakfast, snack]`; `category='dinner'` → `[dinner]` |
| `energy_band` (defer) | add nullable `text` | `null` initially; later derive from `defaultCalories` where present, else curate |
| `style_tags` (defer) | add `text[]` / `{}` | empty array initially |

> **Backfill is optional for correctness.** The planner fallback (§3) means a row with
> `suitable_slots = NULL/{}` behaves exactly as today (uses `category` + `SLOT_CATEGORY_MAPPING`).
> Backfill is what *unlocks* the new flexibility for legacy rows; without it, only newly-seeded
> shells gain multi-slot behaviour. Recommended approach: a one-off **idempotent backfill script**
> in `server/scripts/` (the repo's established pattern) run after `db:push`, **not** raw SQL in a
> migration file (consistent with the push-based workflow).

### 2c. Do existing rows remain valid?

**Yes — unconditionally.** All new columns are nullable/empty-defaulted; no existing constraint
changes; `category` is untouched. All 650 templates, 2,108 meals, and every `meal_plan_entries` /
`planner_entries` row remain valid with no edits. A row that is never backfilled simply falls
through to today's behaviour.

---

## 3. Planner Impact

All occasion logic lives in `server/lib/smart-suggest-service.ts`. The matcher
(`household-meal-matcher.ts`) does **not** reference `category` at all (it scores diet
compatibility); occasion gating for Tier-4 happens back in `selectShellRecoveryCandidate`.

### 3a. The single fallback rule to introduce

```
slotFit(candidate, slot):
  if candidate.suitableSlots is non-empty:
      return suitableSlots (lower-cased) includes slot      # NEW authority
  else:
      return existing category + SLOT_CATEGORY_MAPPING logic # UNCHANGED fallback
```

This preserves every current behaviour for un-backfilled rows and only changes behaviour for rows
that opt in by populating `suitableSlots`.

### 3b. Functions affected

| Function (file:line) | Today | Phase-B change |
|---|---|---|
| `SLOT_CATEGORY_MAPPING` (`:250`) | the entire occasion model; many-to-many category→slots | **Keep as the fallback table.** No change to its contents required. |
| `getCandidateSlotFit()` (`:325`) | `if (!category) return slot==='dinner'; allowed = MAPPING[slot]; return allowed.includes(category)` | Wrap with the §3a rule: prefer `candidate.suitableSlots.includes(slot)` when populated, else current logic. **~3 lines.** This is the central edit — Tiers 1 & 3 both route through here. |
| `getRepeatCandidates()` (`:317`) | filters via `getCandidateSlotFit` | **No direct edit** — inherits the new fallback automatically. |
| `getSafeFallbackCandidates()` (`:288`) | Tier-2; **breakfast strict** (only `breakfast`/`smoothie`); non-breakfast excludes breakfast-categorised items | **Decide policy:** today breakfast is hard-walled. To honour "cooked breakfast can fill dinner" the suitability check must also be consulted here, **but** the strict-breakfast guard must remain for items that do *not* opt in. Recommended: in fallback, a candidate may enter a non-primary slot **only if** its `suitableSlots` explicitly lists that slot; otherwise keep today's strict rule. (Most behaviourally sensitive edit — test heavily, §8.) |
| `selectShellRecoveryCandidate()` (`:345-359`) | Tier-4; `allowedCategories = MAPPING[slot]; if(!allowedCategories.includes(template.category)) continue` | Replace the category gate at `:358-359` with the §3a rule on `template.suitableSlots` (fallback to `template.category` + MAPPING). See §4. |
| Candidate build — user meals (`:541-543`) | sets `base.category` from `meal.categoryId` | If `meals.suitableSlots` is **not** added (recommended, §1d), leave as-is — user meals keep deriving slot fit from `category`. |
| Candidate build — external (`convertExternalToCandidate`, `meal-scoring-service.ts:280-289`) | sets `category` from `inferCategoryFromCuisineAndName` | No change for Phase B (external meals have no template; they keep category-based fit). Optionally, later, have the inferencer emit `suitableSlots` (see §7). |
| `inferCategoryFromCuisineAndName()` (`external-meal-service.ts:146`) | one category, defaults `dinner`, never emits `snack` | **Out of scope for the hybrid model itself**; tracked separately in the prior slot-fill investigation as its own defect. |

### 3c. What does **not** change

- `SLOT_CATEGORY_MAPPING` contents (still the fallback).
- Diet/hard-exclusion/premium/component/drink gates — orthogonal to occasion.
- The 4-slot day loop and `usedIds` mechanics.
- Selection/scoring (`topN.slice`, variety nudge).

---

## 4. Shell Recovery (Tier-4) Impact

`selectShellRecoveryCandidate()` (`smart-suggest-service.ts:345`) currently gates a shell into a
slot **only** by `template.category` against `SLOT_CATEGORY_MAPPING[slot]` (`:353-359`). Change:

- **New:** if `template.suitableSlots` is populated → `template.suitableSlots.includes(slot)`.
- **Fallback:** else → today's `allowedCategories.includes(template.category)` (unchanged).

Everything after the gate (component-slot assembly `:362-369`, compliance filtering `:370-388`,
diet/hard checks) is **unchanged** — suitability only widens *which slots a shell is eligible for*,
never relaxes diet/restriction compliance.

**Old templates still work:** the 649 templates with empty component slots are already skipped
(`compliantIngredients.length === 0 → continue`, `:375`) regardless of this change. "Cooked
Breakfast" (the one populated shell) keeps filling breakfast via the `category` fallback; once it is
*re-seeded/backfilled* with `suitableSlots = [breakfast, lunch, dinner]` it would additionally
become eligible for lunch/dinner — which is exactly the desired brunch/brinner behaviour and the
clearest demonstration test (§8).

---

## 5. Seed Compatibility

Future shell seeds (and the backfill in §2b) should populate, per shell:

| Field | Rule |
|---|---|
| `category` | keep — the back-compat single occasion (= `primarySlot` value, occasion-cased) |
| `primarySlot` | the default placement slot, lower-case occasion vocab |
| `suitableSlots[]` | every slot the shell may legitimately fill (superset including `primarySlot`) |
| `energyBand` (deferred) | Light / Medium / Hearty (advisory) — only once that field lands |
| `styleTags[]` (deferred) | Brunch / One-Pot / Lunchbox / Bowl … — only once that field lands |

Worked example (the approved Cooked Breakfast case):

```
category      = breakfast
primarySlot   = breakfast
suitableSlots = [breakfast, lunch, dinner]
energyBand    = hearty          # only if Status A
styleTags     = [brunch, family-style, adaptable]   # only if Status A
```

The §8 catalogue in `FLEXIBLE_MEAL_OCCASION_AND_SHELL_SUITABILITY.md` is the ready-made seed
payload (each row already lists Primary + Suitable). Seeds must keep `compatibleDiets[]` and the
component-slot arrays populated, otherwise Tier-4 still skips them (`:375`) — a shell with
`suitableSlots` but empty component slots gains *eligibility* but cannot be *assembled*.

---

## 6. UI Impact (list only — no UI designed here)

`meal-templates` is consumed by the client in exactly **one** surface:

- **`client/src/pages/products-page.tsx`** — the only file referencing the `meal-templates`
  API / `MealTemplate` type. It is the admin/products template surface. It currently reads
  `template.category`; it would continue to work unchanged (category retained). It would only need
  adjustment if you want to *display or edit* `primarySlot`/`suitableSlots` — which is new UI and
  explicitly out of scope.

Other `client/src` files matching `.category` (`meals-page`, `weekly-planner-page`,
`shopping-list*`, `pantry-page`, `NutritionBoostPanel`, `basket-item-classifier`, etc.) reference
**meal/ingredient/basket/product categories**, **not** `meal_templates.category` occasion data.
They are **not affected** by adding template suitability fields.

**Net:** zero UI changes are *required* for Phase B (fields are additive and read server-side by the
planner). `products-page.tsx` is the only surface that *could* optionally expose the new fields
later.

---

## 7. API Impact

| Route (file:line) | Today | Change needed |
|---|---|---|
| `POST /api/meal-templates` (`routes.ts:5385-5395`) | validates with `insertMealTemplateSchema` | add new fields to the schema's `.pick` (§1c) — then create accepts them automatically |
| `PATCH /api/meal-templates/:id` (`routes.ts:5397-5413`) | inline `updateSchema = {name, category?, description?}` | extend inline schema with `primarySlot?`, `suitableSlots?` (+ advisory if Status A) |
| `GET /api/meal-templates` / `:id` (`routes.ts:5362, 5372`) | returns full row | no change — new columns serialise automatically |
| `POST /api/meal-plans/smart-suggest` (`routes.ts:4796`) | runs `generateSmartSuggestion` | no route change — behaviour change is internal to the planner (§3) |
| `POST /api/smart-suggest/auto-import` (`routes.ts:5020`) | imports suggestions | no schema change for Phase B |
| **Meal import / scraped-meal creation** | builds `meals` rows; external candidates get inferred `category` | **no change** for Phase B (meals path excluded, §1d). Only relevant if/when `meals.suitableSlots` is added later. |
| Planner entry creation (`insertMealPlanEntrySchema` `schema.ts:466`, `upsertPlannerEntrySchema` `:500`) | persists resolved `slot`/`mealType` | **no change** — entries store the resolved occasion, not suitability |

---

## 8. Test Plan (required before implementation is accepted)

Reproduction harness already exists and is read-only: `server/scripts/sim-slot-fill.ts`,
`sim-shells.ts` (used by the prior investigation). Extend these for assertions; do not add prod code
to test.

**Backward-compat (must pass first):**
1. Template with **only `category`** (no `suitableSlots`) → `getCandidateSlotFit` returns the
   identical result as today for every slot (table-driven across breakfast/lunch/dinner/snack).
2. Null-`category` candidate → still eligible for `dinner` only (current `:326` behaviour preserved).
3. All 28 slots still fill for users 1 / 42 / 56 / 57 at `mealsPerDay=4` (parity with prior sim — no
   regression).

**New behaviour:**
4. Template with `suitableSlots=[breakfast,lunch,dinner]` → eligible in all three; **Cooked
   Breakfast fills a dinner slot** (Tier-4 brinner case) when its component slots are populated and
   diet-compatible.
5. Smoothie shell `suitableSlots=[breakfast,snack]` → fills **snack** (and breakfast), not lunch.
6. Soup shell `suitableSlots=[lunch,dinner]` → fills **lunch and dinner**, not breakfast.
7. `suitableSlots` overrides the category fallback: a `category='dinner'` shell with
   `suitableSlots=[lunch]` is eligible for lunch and **not** dinner.

**Non-gating guarantees (deferred fields, test only if Status A):**
8. `energyBand` present (any value) does **not** change slot eligibility (eligibility identical with
   band null vs set).
9. `styleTags` present (any value) does **not** change slot eligibility.

**Tier-2 fallback policy (most sensitive):**
10. Breakfast strictness preserved: a `category='dinner'` item **without** `suitableSlots` never
    enters breakfast via `getSafeFallbackCandidates`; an item **with** `suitableSlots` listing
    breakfast may.

---

## 9. Rollback Plan (RED change)

| Aspect | Plan |
|---|---|
| **Undo code** | `git reset --hard rollback/pre-hybrid-meal-occasion-2026-06-14` (→ `39de349`). Reverts schema.ts, planner, routes, types in one step. |
| **New columns** | Because the columns are **additive and nullable**, leaving them in the DB after a code rollback is **harmless** — no code references them, no constraint depends on them, queries ignore unknown columns. *Preferred rollback = leave columns in place.* If a clean DB is required, drop them explicitly: `ALTER TABLE meal_templates DROP COLUMN IF EXISTS primary_slot, suitable_slots, energy_band, style_tags;` (note `drizzle-kit push` will **not** auto-drop on schema revert unless you push the reverted schema and confirm column drops). |
| **Data cleanup** | None required if columns are left. The §2b backfill only *populated* new columns; reverting code makes the old `category` path authoritative again, so backfilled values become inert (read by nothing). No corruption risk. |
| **Seeded shell rows** | If new shells were seeded as part of the same change, they are normal `meal_templates` rows. They remain valid and inert under rollback (planner falls back to `category`). Only delete them if the seed itself is being reverted — track seeded IDs in the seed script for targeted cleanup. For Phase B (no seeding in scope) this is N/A. |
| **Planner entries** | **Unaffected.** `meal_plan_entries` / `planner_entries` store the *resolved* slot + mealId; they contain no suitability data and need no cleanup. Plans generated while the feature was live remain valid. |
| **Blast radius** | Contained to one planner function (`getCandidateSlotFit`) + Tier-4 gate + additive columns. The fallback design means the worst case of a partial rollback (columns present, code reverted) is simply "old behaviour." |

---

## 10. Final Recommendation

### **STATUS B — Implement `primarySlot`/`suitableSlots` first; defer `energyBand`/`styleTags`.**

**Rationale:**

- The **product direction (full Hybrid)** is endorsed and correct — this is purely a *sequencing*
  recommendation for the *implementation*, not a rejection of energyBand/styleTags.
- `primarySlot` + `suitableSlots[]` are the only two fields that touch the **planner eligibility**
  path, and they are precisely what fixes the documented failures (dinner over-supply, starved
  lunch/snack, dead Tier-4 for non-breakfast). They generalise an engine that is *already
  many-to-many* at one enforcement point → smallest viable, highest-value change.
- `energyBand` and `styleTags` are **advisory / non-gating** by design (they must never affect
  eligibility — see tests 8–9). They therefore carry **zero planner risk** but **do** carry
  real *derivation* (calorie-data sparsity) and *curation/UX* design cost. Landing them in the same
  change adds two columns of seeding + UI scope for no eligibility benefit. Because every field is
  additive and independent, deferring them costs nothing and can be a fast follow-up.
- All migration/rollback risk is identical and low for any subset (additive nullable columns,
  push-based, fallback-protected).

**If the product owner prefers a single schema landing (Status A):** it is *safe* to add all four
columns at once — the schema/migration/rollback story is unchanged (§2, §9), and tests 8–9 already
guard the advisory fields against gating. The only added scope is deciding `energyBand` derivation
and the `styleTags` vocabulary up front. The investigation's position: **B is the safer default; A
is acceptable if the team wants the columns in place now and is willing to define the advisory-field
rules in the same PR.** It is **not** Status C (design is sufficient) or Status D (the change is
backward-compatible and does not require the shell catalogue to be seeded first — un-backfilled rows
keep working).

---

## Scope Lock — confirmed

- ❌ No implementation
- ❌ No schema change
- ❌ No migration / `db:push`
- ❌ No shell seeding
- ❌ No planner changes
- ✅ Investigation only
- ✅ Rollback tag created **before** work: `rollback/pre-hybrid-meal-occasion-2026-06-14` → `39de349`

> The only file written by this investigation is this document. No `server/scripts` or other
> artifacts were added or modified.
