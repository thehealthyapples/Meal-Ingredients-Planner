# NK6L — Canonical Vocabulary Implementation

**Status:** Implemented (source-of-truth vocabulary + resolver + draft YAML). **NO FOODS IMPORTED.**
**Date:** 2026-07-07
**Implements:** [`NK6K_CANONICAL_VOCABULARY_GOVERNANCE.md`](../investigations/NK6K_CANONICAL_VOCABULARY_GOVERNANCE.md) (all approved decisions) **with one amendment** (glucosinolates).
**Governing documents:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md), [`NK6F_CANONICAL_VOCABULARY_OWNERSHIP_AUDIT.md`](../investigations/NK6F_CANONICAL_VOCABULARY_OWNERSHIP_AUDIT.md)
**Files touched:** `shared/knowledge/nutrients.ts`, `shared/knowledge/canonical-vocabulary-resolver.ts`, 9 draft YAMLs under `docs/knowledge/canonical-foods/drafts/`.

---

## AMENDMENT APPLIED

The NK6K recommendation to **alias** `glucosinolates` → `sulforaphane` was **overridden**. As instructed:

- `glucosinolates` is created as **its own canonical phytonutrient identity** (not an alias).
- The **relationship** to sulforaphane (glucosinolates are the precursor that converts into
  sulforaphane) is preserved **once, in the glucosinolates editorial description**. The knowledge model
  has no nutrient↔nutrient structural edge (relationships are food→nutrient, food→benefit,
  nutrient→benefit), so prose is the supported, non-duplicating home for this fact.
- **No duplicated ownership or facts:** `sulforaphane` keeps its own identity, description and
  `NUTRIENT_BENEFITS` links unchanged. `glucosinolates` owns only its own identity; it does not restate
  sulforaphane's benefit associations.

---

## VERIFICATION

Run against the edited source (no DB writes, no food import):

- `validateKnowledgeSeed()` → **no problems**; nutrient count **30 → 35**.
- Every previously-unresolved nutrient term now resolves through the single GOV2 resolver:
  `protein`, `high_quality_protein`→`protein`, `choline`, `lutein`, `zeaxanthin`, `glucosinolates`,
  and the split targets `magnesium`/`manganese`/`iodine`/`selenium`/`copper`.
- All 10 draft YAMLs parse; **every** `notable_nutrients[].nutrient` and `benefit_language[].area` value
  across all drafts now resolves — 0 unresolved terms remain in source.
- The old compound strings (`lutein_and_zeaxanthin`, `magnesium_and_manganese`, `iodine_and_selenium`,
  `manganese_and_minerals`) correctly **stay unresolvable** (they were split in the YAML, not aliased —
  one string may not map to many identities, GOV2 Rule 3).

---

## REPORT

### 1 · Vocabulary added — 5 canonical nutrients

Added to `shared/knowledge/nutrients.ts` (`NUTRIENT_SEED`), the canonical owner (NK6F). Each is a
GOV2 Rule 4 new-identity decision — a real substance with no prior canonical home and no synonym match.

| Slug | Name | Category | Origin decision |
|---|---|---|---|
| `protein` | Protein | macronutrient | New canonical vocabulary (item 14; animal/dietary protein — distinct from `plant-protein`) |
| `choline` | Choline | other | New canonical vocabulary (item 17) |
| `lutein` | Lutein | phytonutrient | Split half of item 1 |
| `zeaxanthin` | Zeaxanthin | phytonutrient | Split half of item 1 |
| `glucosinolates` | Glucosinolates | phytonutrient | Own identity (item 22, **amended** from alias); precursor→sulforaphane relationship in description |

No `NUTRIENT_BENEFITS` links were fabricated for the new identities — benefit associations remain for
editorial to author with evidence (Principle 6). Validation does not require them.

### 2 · Aliases added — 1

Added to `NUTRIENT_ALIASES` in `shared/knowledge/canonical-vocabulary-resolver.ts`:

| Alias (normalised) | → Canonical | Reason |
|---|---|---|
| `high-quality-protein` | `protein` | "High-quality" is a quality *framing* of protein, not a separate substance (NK6K merge / item 4). Many-to-one pointer, no new slug. |

**Deliberately NOT added:** `glucosinolates` → `sulforaphane` (NK6L amendment — glucosinolates is its own
identity).

### 3 · Terms split — 4

Split at authoring time in the draft YAMLs (one substance per `notable_nutrients` entry). Two split into
**already-canonical** nutrients (no new vocabulary); one into two **new** identities; one into a canonical
mineral plus a specific named mineral (the vague "minerals" tail dropped).

| Compound term | → Split into | Draft(s) | New vocab? |
|---|---|---|---|
| `lutein_and_zeaxanthin` | `lutein` + `zeaxanthin` | spinach, eggs | Yes (both new) |
| `magnesium_and_manganese` | `magnesium` + `manganese` | oats | No (both existing) |
| `iodine_and_selenium` | `iodine` + `selenium` | eggs | No (both existing) |
| `manganese_and_minerals` | `manganese` + `copper` | chickpeas | No (both existing) |

> For `manganese_and_minerals`, the vague "minerals" tail was resolved to the specific canonical
> `copper` (a well-established chickpea mineral, per the NK6K "name the specific minerals" option) rather
> than fabricating an unnamed mineral identity.

### 4 · Drafts updated — 9

`docs/knowledge/canonical-foods/drafts/`: **spinach**, **salmon**, **eggs**, **oats**, **lentils**,
**chickpeas**, **extra-virgin-olive-oil**, **broccoli**, **blueberries**.

- **greek-yoghurt.yaml — unchanged.** Its `protein` nutrient and its benefit areas already resolve once
  `protein` became canonical; no edit required.
- `broccoli.yaml` and `eggs.yaml` keep `glucosinolates` / `choline` respectively — those terms now
  resolve against the newly-added canonical identities (no nutrient-line edit needed beyond the splits).

### 5 · Rejected terms removed

Removed from the draft `notable_nutrients` / `benefit_language` slots (framing, food classifications,
misfiled nutrients, or knowledge already owned elsewhere).

**Nutrient-slot rejects removed (4 terms):**

| Term | Draft(s) | Why |
|---|---|---|
| `whole_grain_carbohydrate` | oats | Carbohydrate-type framing; "whole grain" already in `food_category` |
| `slow_release_carbohydrate` | lentils, chickpeas | Glycaemic framing, not a substance |
| `energy_density` | extra-virgin-olive-oil | A property (kcal/g), not a nutrient |
| `natural_sugars` | blueberries | Intrinsic-sugars framing; no canonical sugar nutrient |

**Benefit-slot rejects removed (5 terms):**

| Term | Draft(s) | Why |
|---|---|---|
| `micronutrient_density` | spinach, broccoli | Nutrition property, not a health-benefit identity |
| `whole_grain` | oats | Food classification, not a benefit |
| `fibre` (benefit slot) | oats, broccoli | Misfiled — `fibre` is a canonical *nutrient*, wrong domain |
| `absorption_context` | extra-virgin-olive-oil | Relationship-graph knowledge (`nutrient_complements`), not a benefit |
| `plant_compounds` | blueberries | Vague phytonutrient umbrella; specific canonical phytonutrients carry it |

**Platform-concept benefit areas removed (7 terms)** — legitimate concepts owned by the
Planner/Intelligence/household layer, never canonical nutrition vocabulary:

| Term | Draft(s) | Owner |
|---|---|---|
| `meal_enrichment` | spinach, chickpeas, extra-virgin-olive-oil | Planner meal-composition |
| `oily_fish_exposure` | salmon | Dietary-variety/pattern |
| `meal_balance` | salmon | Planner meal-composition |
| `household_practicality` | oats | Household/planner |
| `legume_exposure` | lentils, chickpeas | Dietary-variety/pattern |
| `breakfast_quality` | eggs, blueberries | Planner meal-occasion/quality |
| `household_adaptability` | eggs | Household model (`household_adaptation_notes` already exists) |

`oats.yaml` had all three of its benefit areas removed; its `benefit_language` is now an explicit empty
list with a comment. Editorial may later add **canonical** benefit areas (e.g. gut-health, heart-health)
with evidence — none were fabricated here.

### 6 · Remaining unresolved items — 0 requiring a decision

- **Source of truth: fully resolved.** After these changes every nutrient and benefit term in all 10
  drafts resolves through the single resolver. There are **no remaining vocabulary terms awaiting a
  governance decision.**
- **Live review queue (DB):** the 24 `knowledge_review_queue` rows were **not** mutated (no import, no
  queue writes performed, per "do not import any foods"). They are all now **addressed at source** and
  will clear on the next import reconciliation — which is deliberately **not** run here.

---

## NOT DONE (deliberate — deployment / follow-up)

1. **No `npm run seed:knowledge`.** The 5 new nutrients live in the TypeScript source of truth but were
   not seeded into the `knowledge_nutrients` table (seeding also touches editorial seed foods; kept out
   of scope by "do not import any foods"). Seeding is the deployment step to make the vocabulary live.
2. **No food import / re-import.** The corrected drafts were not run through
   `server/lib/canonical-foods-importer.ts`. Re-importing them (a separate, approved action) is what will
   bind the new nutrients to foods and drain the existing 24 queue rows.
3. **No queue-row status changes.** The live queue reflects the pre-fix state until an import
   reconciliation is run.
