# FOUNDATION_MEALS3 — Phase 1: Retire the Broken Meals

**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Risk:** 🟠 AMBER — one additive migration (two nullable columns, no backfill), five source files, and a write to 76 meal rows. **No row deleted, no recipe rewritten, no provenance changed.**
**Phase:** 1 of the 6-phase Editorial Recovery Programme (`FOUNDATION_MEALS2` §7.2). **Only Phase 1.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | **`rollback/foundation-meals3-phase1-20260720` → `03a9fdc7`** |
| Created | **Before any file was written or any row touched** |
| Working tree at tag time | **Not clean** — one tracked file modified: `.engineering/session/CURRENT.md`, the session dashboard's automated Stop-hook heartbeat. The tag does not cover it. No other uncommitted work existed. |
| Data rollback | `npx tsx scripts/foundation-meals3-retire-broken-meals.ts --restore` — **exercised, not asserted** (see §7) |
| Code rollback | `git checkout rollback/foundation-meals3-phase1-20260720` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — the mandatory Architecture Bootstrap
- [x] `docs/implementation/cookbook/FOUNDATION_MEALS1_FOUNDING_COOKBOOK.md` — the ten editorial standards
- [x] `docs/implementation/cookbook/FOUNDATION_MEALS2_THA500_EDITORIAL_REVIEW.md` — **the verdicts this phase applies**
- [x] `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` — the four lanes; §3.4 honest provenance
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — Principles 1, 2, 4, 8
- [x] `MIGRATIONS.md` — the one sanctioned route to a production schema change
- [x] `shared/cookbook/curation.ts` — `COOKBOOK1`'s shelf owner

---

## 0. The problem this phase had to solve first: the 76 were never written down

`FOUNDATION_MEALS2` §2.1 classifies 76 of the 500 as **RETIRE**. It does not list them.

Its commit (`03a9fdc7`) contains exactly one file — the document itself. The scoring run it describes left no artefact, no id list, and no script. So the instruction *"retire only the 76 meals classified as RETIRE in FOUNDATION_MEALS2"* named a set that existed nowhere in the repository.

Two options: hand-copy a list from prose, or **re-derive the classifier and prove it lands on the same 76.** The first is an unverifiable assertion sitting between a verdict and 76 irreversible-feeling writes. This phase took the second.

`scripts/foundation-meals3-retire-broken-meals.ts` re-derives the classification from the same corpus `FOUNDATION_MEALS2` read, and **asserts twelve figures the review published independently** before it is permitted to write anything:

| Control figure | Source | Derived | Match |
|---|---|---:|:---:|
| Salad vegetables stewed | §2.3 | 66 | ✅ |
| · of which radish | §1.2 | 35 | ✅ |
| · of which cucumber | §1.2 | 31 | ✅ |
| Rolled oats as savoury starch | §2.3 | 26 | ✅ |
| Uncookable instruction | §2.3, §1.2 | 4 | ✅ |
| **Distinct RETIRE total** | **§2.1** | **76** | ✅ |
| Dinner retired | §2.2 | 44 | ✅ |
| Lunch retired | §2.2 | 25 | ✅ |
| Side retired | §2.2 | 7 | ✅ |
| Breakfast retired | §2.2 | 0 | ✅ |
| Snack retired | §2.2 | 0 | ✅ |
| Founding ten flagged | §0 control group | 0 | ✅ |

Twelve figures, published across four different sections of a document that never enumerated the set, all reproducing simultaneously. That is not a coincidence a wrong classifier can produce.

### 0.1 The one judgement this required, stated so it can be argued with

My first detector gated on the literal simmer step and returned **33 radish / 28 cucumber = 61**, not 66. The five-meal gap was informative rather than annoying: it is exactly the 2 radish and 3 cucumber meals on the **side** shelf, which use the generator's side frame (*"cook the X per packet" → "toss everything together"*) and never simmer anything.

The rule that reproduces the review is therefore: **a salad vegetable is dish-broken in a cooked frame (dinner, lunch, side) and fine in an uncooked one (breakfast pan, snack bowl).** That is also the only rule consistent with §2.2 retiring **0 of 75 breakfasts** despite 10 of them containing radish, and with §2.2's finding that the 74 breakfasts are *"the collection's most recoverable asset"*.

**I record this as a judgement, not a measurement.** A reader who thinks a stewed radish is a cook's problem rather than a recipe's problem can move 66 meals back with one command (§7). Nothing here is unrecoverable.

### 0.2 The classifier refuses to write if it drifts

The twelve assertions are not a comment; they are `throw`s. If the corpus changes, or the rule is edited, the script aborts before touching a row:

```
FOUNDATION_MEALS3 classifier disagrees with FOUNDATION_MEALS2 on "salad vegetables stewed (§2.3)":
derived 61, review published 66. Refusing to retire anything.
```

---

## 1. The architecture had no safe retirement mechanism — so this built the smallest one

The mission said: *if the current architecture lacks a safe retirement mechanism, STOP; implement the smallest architecture-compliant mechanism rather than deleting records.* It lacks one. Here is what was actually there.

### 1.1 What existed, and why neither option was safe

**`meals` had no retirement concept at all.** No `retired_at`, no `is_active`, no status. A meal could exist or not exist.

**The `library` shelf is not retirement, and it is not enforced where it matters.** `COOKBOOK1` shelved the generated 490 as `library` — reachable by search, absent from browsing. Three problems for this purpose:

1. **It is a browsing decision, not a truth decision.** Library means *"true, but not worth meeting while scrolling."* These 76 are not true.
2. **It is enforced entirely client-side.** The only rule is `meals-page.tsx:3360`, and `isShelved`/`BROWSABLE_SHELVES` had **zero consumers** anywhere in the codebase. `/api/meals` shipped all 500 rows to the browser on every call.
3. **It explicitly steps aside for search.** `if (shelfForMeal(meal) === "library" && !activeSearch && !libraryOpen)` — a household searching *"rice bowl"* was handed the uncookable ones. That is precisely the Phase 1 gate: *"a household can no longer reach a recipe that cannot be cooked."*

**Deleting the rows was the other option, and it is worse.** Eleven tables carry a bare `integer("meal_id")` with **no foreign key** — `planner_entries`, `basket_items`, `freezer_meals`, `ingredient_sources`, `meal_plan_entries`, `nutrition`, `meal_diets`, `meal_allergens`, `meal_plan_template_items`, `week_provisioning_items`, `product_events`. `storage.deleteMeal` cleans only four of them. On this database a delete would have orphaned **214 planner entries and 19 nutrition rows** on the spot, and destroyed the record of what was withdrawn and why.

### 1.2 What was built

**Two additive nullable columns on `meals`, and one word in `curation.ts`.**

```
meals.retired_at      TIMESTAMPTZ  -- null = live
meals.retired_reason  TEXT         -- null unless retired
CHECK ((retired_at IS NULL AND retired_reason IS NULL)
    OR (retired_at IS NOT NULL AND retired_reason IS NOT NULL))
CREATE INDEX meals_live_idx ON meals (id) WHERE retired_at IS NULL
```

The CHECK is load-bearing: a reason without a retirement, or a retirement without a reason, is an unauditable half-state, and Postgres holds the pairing rather than a comment. The partial index keeps the new filter free on the common case.

**The mechanism is one asymmetry, and it is the whole design:**

> A retired meal stops being **offered**. It does not stop **existing**.

| Read | Retired meals | Why |
|---|---|---|
| `getSystemMeals`, `getSystemMealsSummary`, `getMeals`, `getMealsSummary` | **excluded** | browsing |
| `lookupMeals` (search) | **excluded** | the path the library shelf left open |
| `getMealsByNutritionFilter` | **excluded** | candidate selection |
| `getStarterMeals` | **excluded** | THA offering food unprompted — the worst place of all |
| `getSystemMealByName` | **excluded** | resolution-for-offering |
| **`getMeal(id)`** | **RESOLVES** | every existing reference arrives here |
| **`getMealsExport`** (admin) | **RESOLVES** | audit and history |

`shelfForMeal` gained a `retired` shelf, checked **first**, before every other classification — a retired drink is not a drink on the drinks shelf, it is withdrawn. `retired` is deliberately absent from `SHELF_ORDER` (no heading can be rendered for it) and from `BROWSABLE_SHELVES`.

### 1.3 Why the retirement fact lives on `meals` and not somewhere new

Principle 2's scope test — *can these two stores legitimately disagree?* Retirement is a property of the meal itself; nothing else can hold an opinion about whether a recipe may be offered. Putting it in `curation.ts` would have made the presentation layer own a fact (the exact `GEA17` violation `curation.ts` was created to end), and putting it in a new table would have created a second store that must always agree with the first — Principle 2's definition of redundant.

It is explicitly **not provenance**. `acquisition_lane`, `acquisition_type` and `acquisition_source_key` record *how the row was acquired* and are never rewritten by a retirement. Verified: all 76 retired rows still read `tha_library / authored / is_system_meal / user_id=0`.

---

## 2. WHAT WAS RETIRED

**76 meals. Exactly the 76 `FOUNDATION_MEALS2` §2.1 classified as RETIRE.**

| Reason recorded on the row | Meals |
|---|---:|
| `salad_vegetable_stewed` | 66 |
| `oats_as_savoury_starch` | 8 |
| `uncookable_instruction` | 2 |
| | **76** |

*(Per-row reasons are assigned first-match-wins over overlapping defects, so these are disjoint and sum to 76. The per-reason totals before overlap are the review's own 66 / 26 / 4.)*

Worked example, `THA-194` — ***Australian Cafe-style Green Pea, Celery & Cucumber Rice Bowl***. Called a Rice Bowl; contains no rice. Instructs the cook to *"add tomatoes, stock or water as listed"*, none of which is listed. Simmers cucumber until tender and thickens the result with 250g of porridge oats. A household that trusted this page would have bought exactly what THA told them to buy and produced something inedible. **It is now retired, and it is still in the database.**

### 2.1 One honest discrepancy, recorded rather than smoothed

The corpus classifies 7 of the 76 as `side`. The **database** maps those 7 onto the Lunch category, so a per-category query returns **Dinner 44 / Lunch 32** rather than the review's 44 / 25 / 7. This is a pre-existing property of the `COOKBOOK1` seed — the corpus `category` field and `meals.category_id` disagree about sides — and **this phase neither caused it nor fixed it.** It is noted because a reader checking §2.2 against the database will hit it, and should know it is a seeding artefact rather than a wrong retirement.

---

## 3. ARCHITECTURE COMPLIANCE

```
□ One canonical identity                                                    ✅ PASS
  Meal identity remains `meals.id` (Domain 12). The THA-### ids reach rows
  through the EXISTING `acquisition_source_key` join (`tha_original:THA-###`)
  written by the CBK1 import. No key minted, no second namespace.

□ One owner per fact                                                        ✅ PASS
  The retirement fact has exactly one owner: `meals.retired_at`. Principle 2's
  scope test asked and answered in §1.3. `curation.ts` READS it and stores
  nothing, exactly as it reads every other field. Provenance keeps its owner
  (`acquisition_*`) and is untouched on all 76 rows.

□ No duplicate entities                                                     ✅ PASS
  Zero meals created. Zero rows inserted. Row count 3,207 before and after.

□ No duplicate ownership                                                    ✅ PASS
  No attribute gains a second owner. The EDITORIAL STANDARD stays with
  FOUNDATION_MEALS1; the VERDICTS stay with FOUNDATION_MEALS2. This document
  owns only the record of the verdicts being APPLIED.

□ No duplicate state                                                        ✅ PASS
  No second store of "is this meal retired". No status table, no shelf table,
  no cached list.

□ Extends existing architecture                                             ✅ PASS
  `curation.ts` gains a shelf in the vocabulary it already owns. `meals` gains
  two nullable columns. No new table, no new service, no new module.

□ Progressive enrichment where appropriate                                  ✅ PASS
  Additive nullable columns, no backfill. Every pre-existing row reads as live
  without being rewritten.

□ Knowledge domain compliance                                               ✅ PASS
  No new knowledge domain. This is the withdrawal step of the existing
  Recipe/Meal lifecycle, applied retrospectively.

□ Honest gaps over fabricated information                                   ✅ PASS
  §0 records that the 76 were never enumerated and how they were re-derived.
  §0.1 records the judgement the derivation rests on and my first wrong answer.
  §2.1 records a discrepancy that makes this document look less tidy.

□ No permanent synchronisation bridge                                       ✅ PASS
  None created. One column, read directly by every consumer.

□ Evolution over replacement                                                ✅ PASS
  Principle 8 in its purest form: the alternative was deleting 76 rows. Nothing
  is replaced, nothing deleted, and the mechanism is reversible by one command.

□ Migration discipline (MIGRATIONS.md)                                      ✅ PASS
  Appended to `server/migrations/runner.ts` — the ONLY sanctioned route to a
  production schema — never removed, never reordered. Idempotent statements
  (ADD COLUMN IF NOT EXISTS / DROP CONSTRAINT IF EXISTS / CREATE INDEX IF NOT
  EXISTS). Added to `shared/schema.ts` in the SAME change, per that document's
  explicit warning about dev-only columns.
```

**AI ARCHITECTURE COMPLIANCE** — *not applicable.* No capability, intent, prompt, conversation state or model call. No text here enters any prompt, template or fallback string (Rule PKR27).

**EXPERIENCE & UI GOVERNANCE COMPLIANCE** — **applicable, and the change is a subtraction.** No screen, string, component, token or interaction was added or altered. `client/` is untouched. What changes is that 76 recipes stop appearing in the Cookbook and in search results. `GEA21` (rooms report, they never counsel) is unaffected: nothing new is said to anyone.

---

## 4. DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** |
| Writes new data | **YES** — two columns on 76 rows. Nothing else written, anywhere. |
| Rows deleted | **ZERO** — meal count 3,207 before, 3,207 after |
| Founding cookbook rows | **500 before, 500 after** — 424 live + 76 retired |
| Changes meaning of existing data | **NO** — no name, ingredient, method, rationale, lane, type, source key, shelf or owner altered on any row |
| Provenance | **UNTOUCHED** — all 76 still `tha_library / authored / is_system_meal / user_id=0` |
| Requires backfill | **NO** — both columns nullable, null = live |
| Schema / migration | **ONE** — `2026-07-20_foundation_meals3_editorial_retirement`, additive, idempotent |
| Referential integrity | **PRESERVED** — 214 planner entries and 19 nutrition rows still point at retired meals and still resolve |
| Production | **Schema change pending deploy.** Applied and verified on the disposable database; production applies it at boot via `runMigrations()`. The data step is a separate, explicit script run. |

### PRODUCT REGISTRY IMPACT

**YES.** `FOUNDATION_MEALS2` §8 predicted exactly this: *"the moment any verdict here is acted on — a meal retired — the registry is affected and that change owes it an entry."* This is that moment. A household's answer to *"what is THA?"* changes, because the Cookbook now holds 76 fewer meals and none of the missing ones can be found by searching. **Owed, and flagged in §9 as an owner action — this document does not write the registry entry on its own authority.**

### ADOPTION REGISTER IMPACT

**NO.** No component, hook, token, utility class or shared pattern created, adopted or retired. No client file touched; `npm run adoption:check` unaffected.

---

## 5. TRUST CHECK

- **Could this mislead a household?** The change makes THA *less* misleading — that is its entire purpose. The one honest risk is the opposite of misleading: a household that had one of these 76 in a saved plan keeps seeing it, because the alternative was breaking their week. That is the right trade and it is deliberate (§1.2).
- **Could this fabricate certainty?** The load-bearing claim is *"these are the same 76"*, and it is the one claim I could not take on trust, because the review never listed them. It is defended by twelve independently-published figures reproducing at once (§0), and the classifier aborts rather than writes if any disagrees. **The claim is falsifiable in one command** (§8).
- **Is anything guessed but shown as real?** One judgement, labelled as one: the cooked-frame rule in §0.1, including the fact that my first attempt returned 61 and was wrong. The `retired_reason` values are derived, not asserted — every row carries the reason its own classifier fired on.
- **What happens if this is wrong?** If the 76 are the wrong 76, or retirement is too harsh, `--restore` returns every row to live and the collection to its exact prior state. **This was executed, not assumed** (§7). No row was deleted, so there is no version of this being wrong that loses data.
- **No architectural duplication introduced:** YES *(one owner, one column)*
- **No new source of truth created:** YES *(the standard stays FOUNDATION_MEALS1's; the verdicts stay FOUNDATION_MEALS2's)*
- **Runtime behaviour altered:** **YES, deliberately and narrowly** — seven collection-level reads gained one filter. Documented in full at §1.2 rather than buried.

---

## 6. SCOPE LOCK

**Implemented scope:** the retirement *mechanism* (two columns, one shelf, seven read filters), and its *first application* (the 76 meals `FOUNDATION_MEALS2` classified RETIRE).

**Files changed — six, and no more:**

| File | Change |
|---|---|
| `shared/schema.ts` | +2 nullable columns on `meals` |
| `server/migrations/runner.ts` | +1 appended migration |
| `shared/cookbook/curation.ts` | +`retired` shelf; `shelfForMeal` checks it first |
| `server/storage.ts` | `live()` predicate + 7 read sites; `retiredAt`/`retiredReason` projected in summaries |
| `server/lib/meal-service.ts` | `getStarterMeals` excludes retired |
| `scripts/foundation-meals3-retire-broken-meals.ts` | new — classifier, apply, `--dry-run`, `--restore` |

**Explicitly excluded — none of this was done, and none may be inferred as approved:**

- ❌ **No KEEP or IMPROVE meal modified** — the 424 surviving founding rows are byte-identical to their pre-change state
- ❌ **No recipe rewritten** — zero names, ingredients, methods or rationales changed. The 153 missing liquids, 140 false names and 94 fabricated rationales are **Phase 2** and remain untouched
- ❌ **No duplicates consolidated** — the 98 semantic groups are **Phase 3**; no canonical chosen, no variant merged
- ❌ **No provenance changed** — the false `authored` on the generated cohort survives untouched. That is **Phase 4** and the owner's
- ❌ **No meal created** — including for the weeknight-dinner gap. That is **Phase 5**
- ❌ **No founding collection chosen** — that is **Phase 6**
- ❌ **No acquisition lane modified** — `acquisition_*` untouched on all 500
- ❌ **No canonical ownership changed** — `userId=0` / `isSystemMeal=true` untouched on every row
- ❌ **No re-shelving of the surviving 424** — `isGeneratedLibraryName` not retired, `library` shelf unchanged
- ❌ **No meal deleted** — row count identical before and after
- ❌ **The §7.3 Coherence Check was NOT implemented** — still a recommendation to `FOUNDATION_MEALS1`'s owner
- ❌ **No client file touched**

---

## 7. ROLLBACK PLAN

| | |
|---|---|
| Rollback identifier | **`rollback/foundation-meals3-phase1-20260720` → `03a9fdc7`** |
| Data rollback | `npx tsx scripts/foundation-meals3-retire-broken-meals.ts --restore` |
| Code rollback | `git checkout rollback/foundation-meals3-phase1-20260720` |
| Schema rollback | **Not required.** Two nullable columns with every value null are inert — no read depends on them and no write populates them. Dropping them is optional cleanup, not rollback. |

**The rollback was exercised, not asserted.** Restore → re-apply → re-run, in sequence, on the live database:

```
=== RESTORE ===        Restored 76 meals to live.
                       retired: 0 | system meals: 884      ← exact pre-change state
=== RE-APPLY ===       Retired 76 meals.
                       424 live + 76 retired = 500 rows
=== IDEMPOTENT RE-RUN ===
                       Nothing to do — all 76 are already retired.
```

A rollback plan nobody has run is a hope. This one returns the database to `system meals: 884` — the exact number it held before the change.

---

## 8. MANUAL VERIFICATION

**What must not break — and the evidence it did not:**

| # | Surface | Check | Result |
|---|---|---|---|
| 1 | **Seed verification** | `npm run verify:cookbook-seed` | **8/8 PASS** — 500 rows present, provenance canonical, content intact |
| 2 | **Cookbook browsing** | `getSystemMeals()` count | **884 → 808** (exactly 76 fewer); 0 retired rows returned |
| 3 | **Shelving** | `shelfForMeal` over all 76 | all return `retired`; not in `BROWSABLE_SHELVES`, not in `SHELF_ORDER` |
| 4 | **Search** | `lookupMeals("Rice Bowl")`, `("Cucumber")` | 0 retired results — the path the library shelf left open is closed |
| 5 | **Planner (existing refs)** | 214 planner entries naming a retired meal | **all resolve via `getMeal(id)`**, sampled and confirmed by name |
| 6 | **Planner (new selection)** | starter-meal candidate pool | **685 → 609** — retired meals are never offered |
| 7 | **Shopping** | `shopping_list` rows | 1,904 — unaffected; `ingredient_sources` resolve through `getMeal(id)` |
| 8 | **Referential integrity** | 11 tables carrying `meal_id` | **0 orphans** — 214 planner + 19 nutrition references preserved intact |
| 9 | **Constraint** | write a reason without a retirement | **REJECTED** by `meals_retirement_check` ✓ |
| 10 | **Row count** | `select count(*) from meals` | **3,207 before, 3,207 after** — nothing deleted |
| 11 | **Founding ten** | still live | **10/10** |
| 12 | **Typecheck** | `npx tsc --noEmit` | **88 errors before, 88 after** — zero introduced; none in any file touched |
| 13 | **Test suites** | 8 targeted suites | **363 passed, 0 failed** |
| 14 | **Production verification** | `npm run verify:prod` | **22 passed, 2 warned, 0 failed** — both warnings pre-existing and unrelated |

Test suites run: `cbk1-cookbook-seed` (37), `trust1-o8-production-schema-protection` (33), `surf1b5-starter-meal-safety` (84), `surf1c1-starter-cookbook-diet-classification` (81), `intelligence-meals-binding` (72), `planner-compliance` (25), `log-meal-to-diary` (10), `rm4-planner-ready-meal-library` (21).

**Reproducing the identification of the 76 — the check that matters most:**

```bash
# Re-derives the classification and asserts all twelve of FOUNDATION_MEALS2's
# published figures. Writes nothing. Exits non-zero if any figure disagrees.
npx tsx scripts/foundation-meals3-retire-broken-meals.ts --dry-run
```

```
  reasons: salad 66 · oats 26 · uncookable 4 → 76 distinct
  by slot: {"lunch":25,"dinner":44,"side":7}
  all 12 control figures from FOUNDATION_MEALS2 reproduce exactly ✓
```

**Manual test steps for a person:**
1. Open the Cookbook — the shelves render as before, with 76 fewer library recipes behind them.
2. Search *"cucumber"* — no recipe that stews it is returned.
3. Open a planner week containing a retired meal — it renders normally.
4. `npm run verify:cookbook-seed` — 8/8 pass, 500 rows.

---

## USER ACCEPTANCE EVIDENCE

| Claim | How the owner can check it without trusting me |
|---|---|
| These are the same 76 the review meant | `--dry-run` asserts twelve figures published across §1.2, §2.1, §2.2 and §2.3 of a document that never listed the set. All reproduce at once. |
| Nothing was deleted | `select count(*) from meals` → 3,207, unchanged. `verify:cookbook-seed` still counts 500 founding rows. |
| No KEEP or IMPROVE meal was touched | `git diff` shows no data script other than the retirement one; the write sets two columns on rows matched by the 76 source keys only. |
| Provenance is untouched | `verify:cookbook-seed` check 5 passes: all 500 rows still `tha_library / authored / user_id=0 / is_system_meal`. |
| Existing references still work | 214 planner entries and 19 nutrition rows point at retired meals; all resolve. Sampled by name in §8 row 5. |
| A household can no longer reach one | `getSystemMeals` 884→808, `lookupMeals` returns 0 retired, starter pool 685→609. |
| The rollback works | It was run (§7), returning the database to `system meals: 884`, then re-applied. |
| The scope lock held | `git show --stat` for this commit: six files, one of them this document. |

**The success test, answered honestly.** `FOUNDATION_MEALS2` §7.2 sets Phase 1's gate as: *"a household can no longer reach a recipe that cannot be cooked."*

**Met, for these 76.** Not met for the collection — and this document should not be read as claiming otherwise. **222 recipes still instruct the cook to add a liquid their ingredient list never buys, and 208 are still named after food they do not contain.** Those are Phase 2, they are the larger number, and they remain in front of a household today. What Phase 1 achieves is narrower and worth stating plainly: **the recipes that could not be repaired by any edit are no longer offered, and no household's saved week broke to achieve it.**

---

## DEFINITION OF DONE

| The mission required | Where this document meets it |
|---|---|
| Confirm git status | Confirmed before any change; recorded in Rollback Protection |
| Create rollback protection | `rollback/foundation-meals3-phase1-20260720` → `03a9fdc7`, created first |
| Report the rollback identifier | Rollback Protection, §7, and the session summary |
| Read the four named documents | Reference Documents Read — all four, plus `MIGRATIONS.md` and `ARCHITECTURE_PRINCIPLES.md` |
| Retire only the 76 RETIRE meals | §2 — 76 retired, identification defended in §0 |
| Do not modify KEEP or IMPROVE meals | §6 Scope Lock — the 424 survivors are byte-identical |
| Do not rewrite recipes | §6 — zero names, ingredients, methods or rationales changed |
| Do not consolidate duplicates | §6 — Phase 3, untouched |
| Do not change provenance | §6, §4 — `acquisition_*` untouched; verified by seed check 5 |
| Do not create new meals | §6 — zero created |
| Do not modify acquisition lanes | §6 — untouched on all 500 |
| Preserve canonical ownership | §4 — `userId=0` / `isSystemMeal=true` untouched |
| No longer appear in household browsing | §8 rows 2, 3, 4 — 884→808, `retired` shelf, 0 search hits |
| Remain available for audit/history | §1.2 — `getMeal(id)` and the admin export resolve them; `retired_reason` records why |
| Preserve referential integrity | §8 row 8 — 0 orphans across 11 tables carrying `meal_id` |
| Not break planner, shopping, favourites, references | §8 rows 5–8. *(No favourites table exists in this schema — recorded honestly rather than claimed as passing.)* |
| STOP if no safe retirement mechanism exists | §1 — it did not exist; §1.2 is the smallest one that is architecture-compliant |
| Implement rather than delete records | §1.1 — why deletion was rejected, with the orphan count it would have caused |
| Verify cookbook / planner / shopping / search / references / seed / production | §8, all fourteen rows |
| Architecture Compliance | §3, completed in full |
| Definition of Done | This section |
| Data Impact | §4 |
| Trust Check | §5 |
| Rollback Plan | §7 — exercised, not asserted |
| Scope Lock | §6 |
| Manual verification | §8, with reproducible commands |
| User Acceptance Evidence | Above |
| Commit · Push | Recorded in the session summary |

---

## 9. REMAINING OWNER DECISIONS

**1. The Product Registry entry is owed.** §4 explains why: this is the first change in the programme a household can perceive. This document does not write it.

**2. Do you accept the cooked-frame judgement?** §0.1. If a stewed radish is a cook's problem rather than a recipe's, 66 meals come back with one command and Phase 1 retires 10.

**3. Phase 2 is now the binding constraint, and it needs the named editor `FOUNDATION_MEALS1` §12.4 never appointed.** 326 meals need a person's judgement. Phase 1 was the only phase that could be done without one — it is mechanical, and it is now done. **Every remaining phase needs a name against it.**

**4. Both FOUNDATION_MEALS documents still live in different folders** (`docs/implementation/` and `docs/implementation/cookbook/`). This file follows `FOUNDATION_MEALS2`'s precedent and the mission's explicit path. `FOUNDATION_MEALS2` §9.5 recommends moving all three to `cookbook/`; one `git mv` does it.

---

*The review before this one found that 208 of the founding 500 are named after food they do not contain, and 222 cannot be cooked from the ingredients they list. It also found that most of that is an editing problem — a careful sentence, not a funeral. This phase is the part that was a funeral: 76 meals whose dish is wrong rather than whose text is wrong, and which no editor could rescue without writing a different recipe.*

*They are not deleted. They sit in the database with the date they were withdrawn and the reason beside them, still resolving for every household that already had one in a plan, and reachable by anyone auditing what THA once offered. What they have lost is the right to be offered again. That distinction — withdrawn rather than destroyed — is the whole of what was built here, and it is the thing that made it safe to act on an editorial verdict at all.*

*Rollback: `rollback/foundation-meals3-phase1-20260720` → `03a9fdc7`.*
