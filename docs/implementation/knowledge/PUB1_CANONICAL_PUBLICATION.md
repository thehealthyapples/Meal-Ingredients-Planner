# PUB1 — Canonical Food & Knowledge Publication

**Status:** Implemented
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Risk:** 🟠 AMBER — database publication (reversible), one user-visible number changes
**Authority:** `CANONICAL_PUBLICATION_ARCHITECTURE.md` (CPuBA1–8), CPI1 (Canonical Publication Integrity Audit), CPV1 (Canonical Publication Verification Platform)

**Rollback protection (created before any work):**

| Item | Value |
|---|---|
| Tag (HEAD anchor) | `rollback/PUB1-canonical-publication-20260714` → `f9c23c97` |
| Restore committed state | `git reset --hard rollback/PUB1-canonical-publication-20260714` |
| Database snapshot | `pg_dump --data-only` of the 7 affected tables, taken before the first write |
| Database rollback | Re-run `npm run seed:canonical` / `npm run seed:knowledge` — both are idempotent and retire softly. **No row was deleted by this work.** |

**Governing documents read (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → CPI1 → CPV1 → `CANONICAL_FOOD_OWNERSHIP_VERIFICATION.md`.

---

## HEADLINE

**Nothing was wrong with THA's publication architecture. It had simply never run.**

The owners were correct, the seed runners were correct, and the verification gate was correct. But `canonical_food` held **53 of 312** foods, `diversity_group` held **52 of 173**, and `canonical_food_alias` held **143 of 801** — because `npm run seed:canonical`, the domain's one authorised writer, **could not execute at all**. The projection table was missing six columns its owner declares, so Postgres rejected the insert:

```
column "family" of relation "canonical_food" does not exist
```

That is the whole story of the drift. It was not slow publication; it was **absent** publication, and it failed silently for the reason CPI1 gave: nothing reads the table, so nobody noticed the publisher was dead. A publication path nothing exercises is indistinguishable from one that works.

This work published the existing approved data through the existing approved paths. **No data was created, no owner was moved, and no publication path was added.**

---

## WHAT WAS PUBLISHED

| Projection | Owner declares | Before | After | Publication path |
|---|---:|---:|---:|---|
| `canonical_food` (active) | 312 | **53** | **312** | `npm run seed:canonical` |
| `diversity_group` | 173 | **52** | **173** | `npm run seed:canonical` |
| `food_variety` | 68 | **24** | **68** | `npm run seed:canonical` |
| `canonical_food_alias` | 801 | **143** | **801** | `npm run seed:canonical` |
| `knowledge_foods` | 610 | 610 | **610** | `npm run seed:knowledge` |
| `knowledge_food_nutrients` (active) | 1950 | 1988 | **1950** | `npm run seed:knowledge` (reconcile) |

**Knowledge connected to Canonical Food:** `canonical_food.knowledge_food_slug` went from **44** bound rows to **256**. The binding is the seed's own `knowledgeFoodSlug` field — published, not invented. Coverage is **99.3% of bindable identities**; the rest sit in `DEFERRED_KNOWLEDGE_BINDINGS`, refused rather than guessed (KNOW3). Five bindings rest on editorial judgement rather than name equality (`peas → garden-peas`, `strawberry → strawberries`, …) and the seed prints them as warnings on every run — a tracked gap, never a silent one.

**The KNOW1 residue is retired.** `plant-protein` — a nutrient NK6M removed from the vocabulary that still sat live in `knowledge_nutrients` with 38 composition rows and 2 benefit links — was retired by the reconcile sweep that has existed in `seed-knowledge-registry.ts` since KNOW5 and had never been run. `GET /api/knowledge/nutrients/plant-protein` now returns **404**; `red-lentils` reports `Protein`, the surviving canonical vocabulary.

---

## THE FOUR CHANGES THAT WERE NOT "RUN THE SEED"

### 1. The projection could not receive its owner — migration `2026-07-14_pub1_canonical_food_projection_columns`

Six columns declared by `shared/schema.ts` had never reached the database: `family` (NK6R), the four WS0X.5 food-context columns, and `fermented` (M4.5). Each was added by its owner; none was ever given a migration. They reach the database here through the one sanctioned DDL path — a reviewed migration appended to `server/migrations/runner.ts`, exactly as `schema-push-guard.ts` requires. Additive, nullable-or-defaulted, and behaviour-neutral on its own: **no runtime path reads these columns**. It is the seed run that follows which publishes the data.

### 2. Publishing was one-way — the reconcile sweep (`seed-canonical-food.ts`)

The canonical seed was a pure upsert, so the projection could only ever grow: a food corrected *out* of `CANONICAL_SEED` stayed live forever, and `validateCanonicalSeed()` — which reads the seed, not the database — could not see that it had. CPV1's `fi-reconcile-sweep` check failed until this existed.

It now reconciles **on exactly the terms the knowledge registry already set** (KNOW5): a row the owner no longer authors is **retired** (`status='retired'` / `is_active=false`), **never deleted**. One publication law, applied identically on both halves of the platform. It retired 5 stale aliases on its first run.

**What the sweep may not touch.** It retires only rows the seed *published* — the active canonical tier. The 295 `tier='catalogue'` / `status='draft'` rows are the WS0.11 USDA candidate pool: **Stage 1 (CANDIDATE)** of the graduation pipeline (PKCA §1.1), awaiting human promotion. A candidate is not a stale publication; it is a food THA has not yet decided to know. KNOW5 stated the general rule and it holds here: *this sweep may only retire rows this seed is the author of. It is not a garbage collector for the whole table.*

### 3. Two checks were asking the wrong question (`publication-register.ts`)

- **`fi-*-publication` / `pd-publication`** now count the **published** projection (`status='active'` / `is_active`), not every row in the table. Two kinds of row legitimately sit there without being a publication — **retired** rows (soft retirement is the platform's law) and **draft candidates** — and counting either against the owner's declaration would have made the reconcile sweep register as *drift* the moment it did its job.
- **`fk-orphan-nutrients`** now counts only **active** nutrients. KNOW5 retires an orphan rather than deleting it, deliberately, so that a bad import is reversible. Counting a retired row as published would have meant the only way to satisfy the check was a **hard delete** — the one thing the owner's publication law forbids.

**Nothing is swept under the carpet.** A new check, **`fi-unowned-rows`**, counts every row in `canonical_food` the owner does not author and names it, so the candidate pool stays visible and an unowned row can never hide behind the narrowing. It reports the 295 today.

### 4. The published data did not reach the counter (`routes.ts`, CPI1 S1-2)

The 30-plants counter resolved each ingredient through the canonical owner and then **threw the answer away**, deduping on the raw ingredient slug instead of the diversity group. `plantDiversityGroup()` — new, in the canonical plant-classifier, and now the single owner of "what counts as one plant" — is the key a plant count must dedupe on. `isPlantIngredient()` is the same question asked as a yes/no and is now answered *by* it, so the two can never disagree.

**This lowers a number households see, because the number was wrong.** A week containing cavolo nero, curly kale, kale, cherry tomatoes, plum tomatoes and olive oil:

| | plantCount |
|---|---:|
| Before | **6** — `cavolo nero, curly kale, kale, cherry tomato, plum tomato, olive oil` |
| After | **3** — `kale, tomato, olive-oil` |

The canonical owner says kale is one plant however it is spelled, and every tomato variety is one plant. The old counter told the household it had eaten twice as many plants as it had.

---

## THE FIXTURE THAT KEPT A BUG ALIVE

`scripts/ci/seed-know1-residue.ts` re-inserted the `plant-protein` defect into every CI database, because two suites asserted the defect was still present — they test that `reconcile` deactivates orphans, and **a cleanup test needs dirt to clean**. So CI supplied the dirt by keeping a known bug alive. CPI1 §4.5 named it: *a synchronisation bridge whose synchronised artefact is a bug.* Its own header admitted it: *"THIS SHOULD NOT EXIST FOREVER… the tests assert that a bug is still there."*

Publishing the knowledge registry reconciled the residue away, so the fixture's premise is gone. It is **deleted**, along with its entry in `setup-test-database.ts`, and both suites were rewritten:

- **`test-know5-evidence-contract.ts`** now **injects its own orphan** inside the transaction it already rolls back. Reconcile is still driven for real, against real rows, and still has to deactivate exactly the orphans and exactly nothing else. Nothing is weakened — the test simply no longer needs the product to be broken in order to pass.
- **`test-knowledge-food-ownership.ts`** now asserts what publication makes true: **no active row is unreproducible from the seed**, and any unreproducible row that remains is **retired, never deleted**. This holds on a fresh CI database (zero residue rows) *and* on the long-lived development one (38 retired rows) — which is precisely the coupling that has now been broken.

---

## VERIFICATION

### `npm run verify:publication`

| | Before | After |
|---|---|---|
| Publication failures | **8** | **6** |
| Checks passed | 13 | **21** |
| Checks failed | 17 | **13** |

**The three affected domains carry zero failing checks:**

| Domain | Before | After |
|---|---|---|
| Food Identity | 🟡 (4 drift warnings) | 🟡 — all publication checks **pass** |
| Food Knowledge | 🔴 (orphan nutrients, residue fixture) | 🟡 — both failures **cleared** |
| Plant Diversity | 🔴 (30% published, counter defect) | 🟡 — both failures **cleared** |

The gate still exits 1 on **six pre-existing failures in domains this work did not touch** (Meals, Meal Templates, Household Dietary Preference, Pantry, Nutrition Uplift, Capability Registry) and two cross-cutting failures (migration coverage, boot-time writers). **This implementation introduced no publication failure and resolved two.**

### Tests

| Suite | Result |
|---|---|
| `test:knowledge-food-ownership` | ✅ 28 passed (rewritten) |
| `test:know5-evidence-contract` | ✅ 111 passed (rewritten) |
| `test:canonical-food` | ✅ 46 passed |
| `test:knowledge-evidence-gate` | ✅ 116 passed |
| `test:canonical-knowledge-binding` | ✅ 67 passed |
| `test:know4-graduated-food-reports` | ✅ 102 passed |
| `test:knowledge-claim-coverage` | ✅ 14 passed |
| `test:variety-surfacing` · `test:nk6r` · `test:nk6s` · `test:preparation-knowledge` | ✅ pass |
| `typecheck:ci` | No new errors. All 32 baseline regressions pre-date this change (baseline recorded 2026-07-12; CPV1 landed 2026-07-13). The baseline was **not** re-recorded. |

### Manual verification (live app)

| Check | Result |
|---|---|
| `GET /api/knowledge/foods` | **610** published foods served through the one mouth |
| `GET /api/knowledge/foods/red-lentils` | `Protein, Fibre, Iron, Folate` — canonical vocabulary, no retired nutrient |
| `GET /api/knowledge/nutrients/plant-protein` | **404** — retired vocabulary no longer published |
| `GET /api/knowledge/nutrients/protein` | **200** |
| 30-plants counter | 6 → **3** on the same week (see above) |
| Boot | Migrations at head, no errors |

---

## KNOWN GAPS — NOT INTRODUCED HERE, NOT FIXED HERE

1. **`ws011-usda-ingestion.ts` is still a second writer into `canonical_food`** (raw `INSERT` + runtime DDL). `CANONICAL_FOOD_OWNERSHIP_VERIFICATION.md` §6 explicitly directed that this be raised as its own item and *not* folded into a publication change. It remains a warning, and `fi-unowned-rows` now counts its 295 rows on every run.
2. **Two plant counters still dedupe on the canonical slug**, not the diversity group, and can over-count: `household-nutrition-assembler.ts` (`weekPlantFacts`) and `nutrition-centre-assembler.ts` (`plantDiversity`). The user-facing Home and Planner number was converged; these two were not. Recorded in the SoT Register, Domain 22.
3. **`test:food-report` has 2 pre-existing failures** — `lentils: Red has Plant Protein` and `lentils: Green has no additionalNutrients`. **Verified to fail identically at `f9c23c97` before any change in this work** (run from a clean worktree at the rollback tag). They are stale assertions: NK6M retired `plant-protein`, and `green-lentils` has since gained a knowledge binding in the seed. They rotted unnoticed because `test:food-report` is **not in the `npm test` gate**.
4. **Food Knowledge's three remaining warnings** (the legacy `food_knowledge` table's 5 duplicate narratives, its boot-time writer, and its early-return seed) are pre-existing and untouched.

---

## GOVERNANCE

**Rule CPuBA5** — `npm run verify:publication` run before completion; no domain moved into publication failure. ✅
**Rule CPuBA6** — Source of Truth Register updated in the same change: Domain 1 (188 → **610 foods**), Domain 2 (239 → **312 entries**, plus published counts, binding coverage, candidate pool and runtime read path), Domain 4 (Plant Diversity: **Contested → Authoritative, published**), Domain 22, and Appendix A. ✅
**Rule CPuBA7** — the publication contract did not change. The owner, the publication path and the runtime read path are the ones the architecture already declared. ✅
**Principle 2 (one owner per fact)** — preserved. No fact acquired a second owner; the knowledge↔canonical binding is the seed's own field, published rather than bridged. ✅

**One owner. One publication path. One runtime read path. It now runs.**

---

*Implemented 2026-07-14 under the authority of the Canonical Publication Architecture.*
