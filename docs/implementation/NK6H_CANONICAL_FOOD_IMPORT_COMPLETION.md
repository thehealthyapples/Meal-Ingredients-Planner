# NK6H — Canonical Food Import Completion

**Status:** ✅ Complete — foods, nutrients, benefits and relationships imported and verified
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)
**Predecessor:** [`NK6E_CANONICAL_FOOD_IMPORTER_IMPLEMENTATION.md`](./NK6E_CANONICAL_FOOD_IMPORTER_IMPLEMENTATION.md) (imported food identities only; nutrients/benefits deferred)

---

## 1. Executive summary

NK6E imported the 10 canonical food **identities** but imported **0 nutrients and 0 benefits**: the v2.0-draft YAML uses its own terminology (`long_chain_omega_3_EPA_DHA`, `plant_iron`, `gut_health_pattern`, …) which did not match the canonical vocabulary, and a Drizzle query bug broke the relationship writes.

NK6H closes this by implementing **GOV2 alias resolution inside the import path** and re-running the batch. Every incoming nutrient and benefit name now resolves through a **single shared resolver** to a canonical slug (exactly or via an alias) before it is bound; names that resolve to no canonical identity are **rejected and reported**, never minted into a second entity.

**Result (verified against the live DB):**

| Outcome | Value |
|---|---|
| Foods present | **10 / 10** |
| Resolved relationship assertions (all confirmed present in DB) | **46** — 34 nutrient, 12 benefit |
| Missing resolved relationships | **0** |
| New rows written this run | **+10** food-nutrient, **+7** food-benefit |
| Editorial-seed rows destroyed | **0** (non-destructive upsert) |
| Re-run (idempotency) | **+0** rows |

Constraints honoured: **no schema changes, no duplicate vocabularies, no canonical slug renames.** TypeScript remains the canonical owner of the nutrient and benefit vocabularies (NK6F).

---

## 2. What was built

### 2.1 The single GOV2 resolver — `shared/knowledge/canonical-vocabulary-resolver.ts` (new)

The one resolver mandated by **GOV2 Rule 5** ("there is exactly one resolver"). It:

- Derives the canonical slug sets **from the source of truth** (`NUTRIENT_SEED`, `HEALTH_BENEFIT_SEED`) — it adds **no new vocabulary**.
- Normalises any incoming label deterministically (lower-case; collapse spaces / underscores / slashes to single hyphens), so `vitamin_C`, `Vitamin C` and `vitamin-c` share one lookup key.
- Holds two **alias tables** (many alt-names → one canonical slug) — genuine same-thing synonyms only.
- Returns a structured `VocabularyResolution` — `{ resolved, canonicalSlug, via: exact|alias|unresolved, reason }`.
- **Fails fast at load** if any alias points at a non-canonical slug (GOV2 Rule 7 anti-fork guard).

Exported via `shared/knowledge/index.ts` so every future path (AI extraction, search, OCR, ingestion) uses the **same** resolver rather than a private synonym table.

### 2.2 Importer rewired — `server/lib/canonical-foods-importer.ts`

- Nutrient/benefit terms are now resolved through `resolveNutrientTerm` / `resolveBenefitTerm` instead of the old raw exact-match lookups.
- Resolved terms are de-duplicated to canonical slugs before binding (GOV2 Rule 7 — two aliases of one identity must not create two rows for one food).
- Unresolved terms are collected into `result.rejected.{nutrients,benefits}` **with a reason** and surfaced as warnings.
- **Relationship writes are now non-destructive upserts** (`onConflictDoNothing` on the unique `(food_slug, nutrient_slug)` / `(food_slug, benefit_slug)` keys), replacing the broken delete-then-insert. `.returning()` reports how many rows were genuinely new.
- `ImportResult` gained `resolved` and `rejected` (each `{ input, canonicalSlug|reason, via }`), replacing the old opaque `skipped: string[]`.

### 2.3 Two NK6E defects fixed

1. **Vocabulary mismatch** → resolved by the alias resolver (§3).
2. **`invalid input syntax for type boolean`** — the NK6E force-upsert used `db.delete().where((t) => eq(...) && eq(...))`, an invalid callback/`&&` form that stringified the predicate. Replaced with a non-destructive `onConflictDoNothing` upsert, which is also idempotent and preserves editorial-seed rows.

### 2.4 Supporting

- `server/cli/import-canonical-foods.ts` now prints resolved counts, the specific alias mappings applied, and rejected terms per file.
- `package.json` — registered the `import:canonical-foods` script (referenced by NK6E but absent from the manifest).

---

## 3. Alias resolution decisions

### 3.1 Nutrient aliases (alt-name → canonical) — genuine same-substance synonyms

| Incoming YAML term | Canonical slug | Rationale |
|---|---|---|
| `long_chain_omega_3_EPA_DHA` | `omega-3` | EPA/DHA are long-chain omega-3 fractions |
| `beta_glucan_soluble_fibre` | `fibre` | Beta-glucan is a soluble fibre |
| `polyphenols_anthocyanins` | `anthocyanins` | Names the canonical berry polyphenol specifically |
| `plant_iron` | `iron` | Non-haem (plant) iron is iron |
| `monounsaturated_fat` | `unsaturated-fats` | Monounsaturated fat is an unsaturated fat |
| `live_cultures_when_labelled` | `live-cultures` | Live cultures regardless of the labelling caveat |

Exact matches (no alias needed): `fibre`, `folate`, `calcium`, `iodine`, `magnesium`, `selenium`, `polyphenols`, `plant_protein`, `vitamin_C`, `vitamin_D`, `vitamin_E`, `vitamin_K`, `vitamin_B12`.

### 3.2 Benefit aliases (framing term → canonical health benefit) — definitionally grounded

The draft `benefit_language[].area` values are meal/planner framing terms, a **different vocabulary** from the canonical health-benefit **identities**. A framing term is aliased **only** when the target benefit's own editorial description already encompasses it (so the mapping is a synonym, not a fabricated association — Core Principle 6):

| Incoming term | Canonical benefit | Grounding (canonical description) |
|---|---|---|
| `gut_health_pattern`, `plant_diversity`, `fermented_food_context` | `gut-health` | "fibre-rich plants and fermented foods that add variety to what lives in your gut" |
| `healthy_fat` | `heart-health` | "unsaturated fats, fibre, potassium and colourful plants" |
| `calcium` | `bone-health` | "calcium, vitamin D, vitamin K and magnesium" |
| `protein`, `meat_free_protein` | `muscle-recovery` | "foods that add protein and minerals which muscles use" |

### 3.3 Rejected terms (reported, not imported)

Per **GOV2 Rule 4** these surface a new-identity/disambiguation decision rather than being silently minted. They fall into three honest classes:

- **Genuine vocabulary gaps** (no canonical identity exists): `high_quality_protein` / `protein`-as-nutrient (the vocabulary has only `plant-protein`, not a generic/animal protein — mapping animal protein to `plant-protein` would be a scope violation), `choline`, `natural_sugars`, `slow_release_carbohydrate`, `whole_grain_carbohydrate`, `energy_density`, `lutein_and_zeaxanthin`, `glucosinolates`.
- **Compound / ambiguous strings** (one string implying several identities — a resolver conflict per **GOV2 Rule 3**, to be disambiguated in the draft, not aliased): `iodine_and_selenium`, `magnesium_and_manganese`, `manganese_and_minerals`.
- **Planner/wording framing that is not a health-benefit identity**: `oily_fish_exposure`, `meal_balance`, `meal_enrichment`, `breakfast_quality`, `micronutrient_density`, `absorption_context`, `legume_exposure`, `whole_grain`, `fibre`-as-benefit, `plant_compounds`, `household_practicality`, `household_adaptability`.

Rejections are a **correct** outcome, not a failure: they keep the canonical key space clean and hand genuine gaps to the vocabulary owner (see §6).

---

## 4. Per-food import result

| Food | Nutrients resolved (canonical) | Benefits resolved | Rejected (n / b) |
|---|---|---|---|
| salmon | omega-3\*, vitamin-d, vitamin-b12, selenium | muscle-recovery\* | 1 / 2 |
| blueberries | anthocyanins\*, fibre, vitamin-c, vitamin-k | gut-health\* | 1 / 2 |
| spinach | vitamin-k, folate, iron\*, magnesium | gut-health\* | 1 / 2 |
| extra-virgin-olive-oil | unsaturated-fats\*, polyphenols, vitamin-e | heart-health\* | 1 / 2 |
| lentils | plant-protein, fibre, folate, iron\* | muscle-recovery\*, gut-health\* | 1 / 1 |
| greek-yoghurt | calcium, iodine, vitamin-b12, live-cultures\* | muscle-recovery\*, bone-health\*, gut-health\* | 1 / 0 |
| oats | fibre\*, plant-protein | — | 2 / 3 |
| chickpeas | plant-protein, fibre, folate | muscle-recovery\* | 2 / 2 |
| broccoli | vitamin-c, vitamin-k, folate, fibre | gut-health\* | 1 / 2 |
| eggs | vitamin-b12 | muscle-recovery\* | 4 / 2 |

`\*` = resolved via an alias. Totals: **34** nutrient bindings, **12** benefit bindings resolved.

`lentils` is the clearest gain: the editorial seed keys lentil relationships under `red-lentils` / `green-lentils`, so the generic `lentils` identity had **0** relationships before this run. It now carries `plant-protein, fibre, folate, iron` and `muscle-recovery, gut-health`. Most other foods were already richly populated by the editorial seed; the non-destructive upsert added only the genuinely-new resolved pairs (e.g. `blueberries→vitamin-k`, `greek-yoghurt→iodine,live-cultures`, `broccoli→vitamin-k`, and the `gut-health` / `muscle-recovery` benefit associations).

---

## 5. Verification

Re-parsed every draft, re-resolved every term, and asserted each resolved `(food, canonical-slug)` pair exists in the live tables:

```
Foods present: 10/10
Resolved relationship assertions: 46 (nutrients 34, benefits 12)
Missing from DB: 0
DB totals now: food_nutrients=922 (was 912), food_benefits=693 (was 686)
✅ ALL RESOLVED RELATIONSHIPS PRESENT; seed rows preserved.

lentils (was 0/0 before import)
  N: plant-protein, fibre, folate, iron
  B: muscle-recovery, gut-health
```

- **Completeness:** 0 resolved relationships missing from the DB.
- **Non-destruction:** totals moved 912→922 (+10) and 686→693 (+7); no editorial-seed relationship was deleted.
- **Idempotency:** a second `--force-upsert` run added **0** nutrient/benefit rows (counts held at 922 / 693).
- **Types:** `tsc --noEmit` is clean for `canonical-vocabulary-resolver.ts` and `canonical-foods-importer.ts`. (Pre-existing `--downlevelIteration` noise on the CLI's unrelated `[...new Set()]` dedup is unchanged and tolerated by the `tsx` runtime.)

Reproduce:

```bash
npm run import:canonical-foods -- docs/knowledge/canonical-foods/drafts/*.yaml --force-upsert
```

---

## 6. Follow-ups (editorial / vocabulary-owner decisions — out of scope here)

These are surfaced by the rejections and belong to the **vocabulary owner**, not the importer (GOV2 Rule 4 new-identity decisions):

1. **Generic/animal protein nutrient.** The vocabulary has only `plant-protein`. Salmon, eggs and Greek yoghurt name a general "high quality protein" with no canonical home. Decide whether to add a canonical `protein` nutrient identity; until then it is correctly rejected.
2. **Split compound draft entries.** `iodine_and_selenium` (eggs), `magnesium_and_manganese` (oats), `manganese_and_minerals` (chickpeas) each name two canonical nutrients in one line — a draft authoring issue. Splitting them into separate entries in the draft (all targets are already canonical) would let them resolve; this is a content edit, not a resolver change.
3. **Eye-health carotenoids / brassica compounds.** `lutein_and_zeaxanthin` and `glucosinolates` have no canonical identity. If THA wants to surface them, add them to `NUTRIENT_SEED` (owner decision), after which they resolve exactly with no importer change.
4. **`benefit_language` vs health-benefit identity.** The draft's benefit framing vocabulary is largely orthogonal to `knowledge_health_benefits`. If more of it should drive food→benefit associations, the durable path is the editorial `FOOD_BENEFITS` seed (already the source of truth for these 10 foods), not force-mapping framing terms.

---

## 7. Files changed

**New**
- `shared/knowledge/canonical-vocabulary-resolver.ts` — the single GOV2 vocabulary resolver (nutrient + benefit alias tables, derived canonical sets, load-time anti-fork guard).

**Modified**
- `server/lib/canonical-foods-importer.ts` — resolve-then-bind via the shared resolver; non-destructive `onConflictDoNothing` upserts; resolved/rejected reporting; fixed the NK6E delete bug.
- `server/cli/import-canonical-foods.ts` — richer per-file output (aliases applied, rejected terms).
- `shared/knowledge/index.ts` — re-export the resolver.
- `package.json` — register `import:canonical-foods`.

**Unchanged (as required)**
- Database schema (zero changes).
- Canonical vocabularies `nutrients.ts` / `health-benefits.ts` (no new vocabulary, no slug renames).
- The 10 draft YAML files.

---

*NK6H complete: GOV2 alias resolution implemented in the import path; foods, nutrients, benefits and relationships imported and verified; unknown terms rejected and reported.*
