# NK6O — Batch 006 Nutrient Binding Repair

**Status:** ✅ Complete — 11 legumes re-bound, importer hardened, NK6M deployment applied.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Predecessors:** [`NK6N_BATCHS_003_TO_006_IMPORT_REPORT.md`](../../investigations/knowledge/NK6N_BATCHS_003_TO_006_IMPORT_REPORT.md) (the partial import) · [`NK6M_CANONICAL_NUTRIENT_MODEL_REFINEMENT.md`](./NK6M_CANONICAL_NUTRIENT_MODEL_REFINEMENT.md) (deferred deployment) · [`NK6L_CANONICAL_VOCABULARY_IMPLEMENTATION.md`](./NK6L_CANONICAL_VOCABULARY_IMPLEMENTATION.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)
**Files touched:** `server/lib/canonical-foods-importer.ts` (hardening), `server/cli/import-canonical-foods.ts` (partial reporting), `server/seeds/seed-knowledge-registry.ts` (propagate `family` on upsert). **New artifacts:** `scripts/nk6o-add-family-column.ts`, `scripts/nk6o-rebind-legume-nutrients.ts`, `scripts/nk6o-verify.ts`.

---

## 1. Executive summary

NK6N imported 46 safe-new foods; 35 fully, but the **11 Batch-006 legumes landed with benefits and ZERO nutrients**. Root cause: every legume names protein (`plant-protein`), the GOV2 resolver resolves it to canonical `protein`, but `protein` was **missing from the `knowledge_nutrients` table**. Because the importer bound a food's nutrients in a **single all-or-nothing `INSERT … VALUES(rows)`**, the one FK-failing `protein` row **aborted the whole nutrient batch** for each legume — and the importer still reported "success".

This task:

1. **Confirmed** the DB target is the Replit **dev / lower** environment (not production).
2. **Applied the pending NK6M deployment** — added the nullable `knowledge_nutrients.family` column and seeded the canonical vocabulary (`protein`, `carotenoids`, `lutein`, `zeaxanthin`, `choline`, `glucosinolates`) with the four carotenoids classified under `family: carotenoids`.
3. **Re-bound nutrients for exactly the 11 legumes** through a targeted, governed re-bind (no duplicate foods, no broad `--force-upsert`, no unrelated batches) — **34 nutrient rows** written.
4. **Hardened the importer** so a single missing/unbindable nutrient can only drop **its own row**, never the food's whole set, and an incomplete import is reported as **`partial`**, never a silent success.

Final verification: all 11 legumes carry `protein` + their other nutrients; zero legumes with zero nutrients; no duplicate identities; per-row isolation proven.

---

## 2. DB target — Replit dev (lower) environment

| Marker | Value | Meaning |
|---|---|---|
| `DATABASE_URL` host / db / user | `helium` / `heliumdb` / `postgres` | app's single configured DB |
| `REPL_ID` | `a6376337-…` (set) | inside a Replit workspace |
| `REPLIT_DEPLOYMENT` | **unset** | **dev workspace, NOT a deployment** |
| `REPLIT_DEV_DOMAIN` | `…spock.replit.dev` (set) | interactive dev domain |
| `NODE_ENV` | unset | not production-flagged |

**Assessment:** Replit dev / lower environment — consistent with NK6I/NK6J/NK6N. **Production was not touched.** All writes were the additive `family` column, the idempotent knowledge seed, and the 11-food nutrient re-bind.

---

## 3. NK6M database / vocabulary deployment

### 3.1 `family` column — applied surgically, NOT via full `db:push`

`npm run db:push` was **declined**: drizzle-kit's diff bundled **unrelated schema drift** across other tables (it prompted to *truncate* `meal_plan_template_items` to add a unique constraint). Applying that would exceed this task's scope and risk data. The command was aborted with **no changes applied** (verified: `family` still absent, `meal_plan_template_items` still 186 rows).

Instead the **exact NK6M column** — additive, nullable, identical to the drizzle schema (`family: text("family")`) — was applied idempotently:

```sql
ALTER TABLE knowledge_nutrients ADD COLUMN IF NOT EXISTS family text;
```
(`scripts/nk6o-add-family-column.ts`). Result: `family` present, `text`, `nullable = YES`. The broader `db:push` drift remains **deferred** (a separate, reviewed migration decision — see §7).

### 3.2 Vocabulary seed — `npm run seed:knowledge`

Idempotent upsert of the editorial knowledge registry. Bug found and fixed along the way: the nutrient upsert's `SET` clause **omitted `family`**, so on the first run only the *newly-inserted* carotenoids (`lutein`, `zeaxanthin`) got classified while the *already-present* `beta-carotene`/`lycopene` stayed `null`. Added `family: sqlExcluded("family")` to the `SET` clause so a re-seed propagates the classification onto existing rows too (NK6M treats `family` as editorial content that seeds must propagate). Re-ran → all four classified.

**Seed result (DB totals after):**

| Table | Before | After | Note |
|---|---|---|---|
| `knowledge_nutrients` | 30 | **36** | +6: `protein`, `carotenoids`, `lutein`, `zeaxanthin`, `choline`, `glucosinolates` (source-of-truth adds from NK6L/NK6M, never seeded until now). Legacy `plant-protein` row **lingers** (harmless — resolves to `protein` via alias; retire later, not required). |
| `knowledge_foods` | 311 | **312** | +1 THA-editorial seed food reconciled by `seed:knowledge` from its own `FOOD_SEED`. **Not** a legume, **not** a batch re-import, **not** a duplicate (11 legume identities remain exactly 11). |
| `knowledge_food_nutrients` | — | 1050 | includes the NK6M protein re-point of seed foods + the legume re-bind below. |
| carotenoid `family` rows | 0 | **4** | `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin` → `carotenoids`. |

---

## 4. Nutrients re-bound for the 11 legumes

Targeted governed re-bind via `scripts/nk6o-rebind-legume-nutrients.ts` — allow-listed to exactly the 11 slugs, **never mints/mutates a food identity** (each must already exist), **no `--force-upsert`**, resolves every term through the single GOV2 resolver, and binds through the hardened row-resilient path. **34 nutrient rows written; 0 dropped; 0 rejected.** Re-running is idempotent (`+0 bound, N already present`).

| Food | Nutrients bound | Rows |
|---|---|---|
| `adzuki-beans` | protein, fibre, folate, polyphenols | 4 |
| `brown-lentils` | protein, fibre, folate | 3 |
| `chana-dal` | protein, fibre, folate | 3 |
| `flageolet-beans` | protein, fibre, folate | 3 |
| `green-split-peas` | protein, fibre, folate | 3 |
| `lupin-beans` | protein, fibre | 2 |
| `marrowfat-peas` | protein, fibre, folate | 3 |
| `mixed-beans` | protein, fibre, folate, polyphenols | 4 |
| `mung-beans` | protein, fibre, folate | 3 |
| `toor-dal` | protein, fibre, folate | 3 |
| `yellow-split-peas` | protein, fibre, folate | 3 |
| **Total** | | **34** |

In every case `plant-protein → protein` resolved **via alias** (GOV2), confirming the collapsed-identity model from NK6M works end-to-end. Benefit bindings (2 per legume) were **left untouched** — they were already present from NK6N and are out of scope for a nutrient re-bind.

---

## 5. Importer hardening

**Problem:** one unbindable nutrient dropped a food's **entire** nutrient set, yet the food was still reported **successful**.

**Change (`server/lib/canonical-foods-importer.ts`):**

- **Row-by-row binding.** New exported `bindFoodNutrients()` / `bindFoodBenefits()` insert each resolved slug as its **own** statement (`onConflictDoNothing` + `returning`, wrapped in try/catch). A missing FK target (e.g. a resolved slug absent from `knowledge_nutrients`) drops **only that row** and is recorded; the remaining nutrients still bind. Steps 6/7 now call these helpers.
- **Honest completeness.** `ImportResult` gains `partial: boolean` and `dropped: { nutrients, benefits }`. When any target is dropped, the food is reported **`partial` — never `success`** (`result.success = !result.partial`). `success` and `partial` are mutually exclusive.
- **CLI (`server/cli/import-canonical-foods.ts`).** Three buckets — ✅ Successful / ⚠️ Partial (incomplete — target dropped) / ❌ Failed — and a **non-zero exit** when any partials occur, so an incomplete import can never pass silently as success.
- **Reusable helpers exported** (`extractNutrients`, `mapConfidence`, `collectResolved`) so the governed re-bind uses the importer's exact resolution path, not a fork.

Had this been in place during NK6N, the legumes would have imported with fibre/folate/polyphenols bound and been flagged **PARTIAL (dropped: protein)** — the missing target obvious, not silently swallowed.

---

## 6. Verification query results

`scripts/nk6o-verify.ts` — **ALL CHECKS PASSED ✅**:

1. **Vocabulary present** — `protein` and `carotenoids` exist; `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin` all `family = carotenoids`; `knowledge_nutrients` total **36**.
2. **Legume bindings** — all 11 have `has_protein = true` and `n ≥ 2`; **legumes with zero nutrients: none; legumes missing protein: none**.
3. **No duplicate legume identities** — none.
4. **Hardening proof (non-mutating)** — binding `[protein (real), __bogus__]` on `adzuki-beans` returned `inserted=0, alreadyPresent=1, dropped=[__bogus__]` → **per-row isolation CONFIRMED**: the real target survives, the bogus one is dropped alone.

**Typecheck:** the changed files introduce no new type errors (one pre-existing `--downlevelIteration` warning on the CLI's `[...new Set()]` line is untouched by this task).

---

## 7. Remaining unresolved items

1. **Legacy `plant-protein` nutrient row** still present in `knowledge_nutrients` (upsert never deletes). Harmless — resolves to `protein` via alias. A one-line cleanup can retire it later; **not** required for correctness.
2. **Broader `db:push` schema drift is deferred.** drizzle-kit wants to add unique constraints (and offered to truncate `meal_plan_template_items`) on unrelated tables. Out of scope here; needs its own reviewed migration decision.
3. **Two pre-existing knowledge-registry test failures** — "every food has ≥ 1 nutrient link" / "≥ 1 benefit link" — check the editorial `FOOD_SEED` arrays (not the imported legumes). **Not introduced by NK6O** (no seed array was modified here); a pre-existing editorial-coverage gap to close separately.
4. **NK6N editorial backlog is unchanged** (this task only repaired the 11 legumes): 24 🟠 merge candidates and 8 🟡 editorial-review foods still await human-approved decisions (NK6N §5.2–5.3).
5. **`carotenoids` / `protein` benefit associations** remain for editorial to author with evidence (Core Principle 6) — none were fabricated.

---

## 8. Constraints honoured

- ✅ DB target confirmed as Replit lower env; **production untouched**.
- ✅ **No duplicate foods** created (11 legume identities remain 11; no singular/plural forks).
- ✅ **No broad `--force-upsert`**; the re-bind is allow-listed to exactly 11 slugs and writes only `knowledge_food_nutrients`.
- ✅ **No unrelated batches re-imported.**
- ✅ Importer hardened so a missing nutrient cannot silently drop a food's whole nutrient set while reporting success.
