# NK6K — Canonical Vocabulary Governance — Knowledge Review Queue Triage

**Status:** Investigation and governance triage — **NO IMPORT PERFORMED**
**Date:** 2026-07-07
**Source artefact:** `knowledge-review-filtered-2026-07-07-20-35-28.csv` (Filtered · CSV export from Admin → Knowledge Review → Queue)
**Queue state at export:** 24 items, all `review_type = vocabulary`, `status = unresolved`
**Governing documents:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md), [`NK6F_CANONICAL_VOCABULARY_OWNERSHIP_AUDIT.md`](./NK6F_CANONICAL_VOCABULARY_OWNERSHIP_AUDIT.md)
**Canonical owners (unchanged):** `shared/knowledge/nutrients.ts` (30 nutrients), `shared/knowledge/health-benefits.ts` (15 benefits), resolver + aliases in `shared/knowledge/canonical-vocabulary-resolver.ts`

---

## EXECUTIVE SUMMARY

The 24 queued items are **rejected vocabulary terms** captured by the NK6 canonical-food importer
(`server/lib/canonical-foods-importer.ts` → `captureRejectedTerms`) while validating the 10-food
`NK6_CANONICAL_FOOD_FOUNDATION_BATCH_V2` drafts. Each is a nutrient or benefit name in a draft YAML
that the single GOV2 resolver could not match to a canonical slug or alias. They are **proposals for
review only** — nothing has been minted, and this document mints nothing.

Every item originates in exactly one of two draft slots:

- **`nutrient` domain (12 items)** → `nutrition_profile.notable_nutrients[].nutrient`
- **`benefit` domain (12 items)** → `benefit_language[].area`

**Two systemic patterns drive the triage** (see [Systemic findings](#systemic-findings)):

1. **`benefit_language[].area` is a *wording-area* label, not a health-benefit identity.** It is being
   resolved against the canonical health-benefit vocabulary, which it was never meant to match. This is
   why 10 of 12 benefit-domain items are framing or planner concepts rather than genuine benefits.
2. **Compound nutrient labels** (`X_and_Y`) pack two substances into one term, so they must be *split*,
   not resolved as a single identity.

### Decision tally

| Classification | Count | Items |
|---|---|---|
| **New canonical vocabulary** | 2 | `protein`, `choline` |
| **Alias** | 1 | `glucosinolates` → `sulforaphane` |
| **Merge** | 1 | `high_quality_protein` → proposed `protein` |
| **Split** | 4 | `lutein_and_zeaxanthin`, `magnesium_and_manganese`, `iodine_and_selenium`, `manganese_and_minerals` |
| **Reject** | 9 | `whole_grain_carbohydrate`, `slow_release_carbohydrate`, `energy_density`, `natural_sugars`, `micronutrient_density`, `whole_grain`, `fibre` (benefit slot), `absorption_context`, `plant_compounds` |
| **Platform concept** | 7 | `meal_enrichment`, `meal_balance`, `oily_fish_exposure`, `legume_exposure`, `household_practicality`, `household_adaptability`, `breakfast_quality` |
| **Total** | **24** | |

---

## CLASSIFICATION FRAMEWORK

Grounded in GOV2 (one identity · one display name · unlimited aliases · one resolver) and the NK6F
ownership boundary (TypeScript owns the nutrient/benefit vocabularies; the Planner/Intelligence Platform
owns planner and household concepts).

| Bucket | Meaning | GOV2 basis |
|---|---|---|
| **New canonical vocabulary** | Names a real substance/benefit with no canonical home. Requires a governed new-identity decision + editorial authoring. | Rule 4 (unresolved → honest new-identity decision, never silent mint) |
| **Alias** | Same-thing synonym of an **existing** canonical identity. Many-to-one pointer; no new slug. | Rules 1, 3, 7 |
| **Merge** | Two queue rows denote the same identity; collapse them into one (the surviving identity may itself be a new-vocabulary proposal, with the other recorded as its alias). | Rule 7 (never fork one entity into two) |
| **Split** | One term packs **two** substances; it must become two separate identities (each an existing canonical or its own new-identity decision). | Core Principle 1 (one identity per entity — the inverse of merge) |
| **Reject** | Not a valid canonical knowledge term: nutrition-science *framing/property*, a food *classification*, a *misfiled* term (wrong domain), or a duplicate of knowledge already owned elsewhere (e.g. the relationship graph). | Rule 4 / Principle 6 (no fabricated associations) |
| **Platform concept** | A legitimate concept, but owned by the **Planner/Intelligence Platform or household model**, not the canonical nutrition vocabulary (planner meal composition, meal occasion/quality, household adaptation, dietary-variety patterns). | NK6F ownership boundary; GOV2 scope |

> **Reject vs Platform concept.** *Reject* = the term should simply not exist as canonical vocabulary
> (framing, misfile, or already-owned knowledge). *Platform concept* = the term is real and useful but
> belongs to a **different owner** (Planner/Intelligence/household), so it must not become a canonical
> nutrient or benefit — it should be modelled where that owner lives.

---

## NUTRIENT DOMAIN — `notable_nutrients[].nutrient`

### 1 · `lutein_and_zeaxanthin` — **Split**  ·  files: spinach.yaml, eggs.yaml · occ 2
- **Reason:** Two distinct carotenoid phytonutrients bundled into one term. Neither exists canonically;
  both are real substances with independent eye-health nutrition context. Bundling forks nothing but
  hides two identities behind one string (fails the scope test — the two can disagree on facts).
- **Action required:** Split into two **new-identity decisions** — `lutein` and `zeaxanthin`
  (category `phytonutrient`), authored in `shared/knowledge/nutrients.ts`. Re-author spinach.yaml and
  eggs.yaml to list them as separate `notable_nutrients` entries. **No import until authored.**

### 4 · `high_quality_protein` — **Merge** (→ proposed `protein`)  ·  files: eggs.yaml, salmon.yaml · occ 2
- **Reason:** Same substance as item 14 (`protein`) with a quality qualifier. "High-quality" is a
  framing adjective, not a separate identity; canonical `plant-protein` cannot absorb it (eggs/salmon
  protein is animal-source). It denotes the same nutrient as item 14.
- **Action required:** Merge into the proposed new `protein` identity (see item 14); record
  `high-quality-protein` as an **alias** of `protein` in `NUTRIENT_ALIASES`. Re-author eggs.yaml and
  salmon.yaml to reference `protein`. Depends on item 14 being approved first.

### 7 · `whole_grain_carbohydrate` — **Reject**  ·  file: oats.yaml · occ 1
- **Reason:** Carbohydrate-*type* framing, not a nutrient substance. The vocabulary has no carbohydrate
  nutrient by design, and "whole grain" is a **food classification** already captured by
  `identity.food_category: whole_grain_cereal`. Minting it would fabricate a nutrient identity.
- **Action required:** Reject as a nutrient. Re-author oats.yaml to reference the real nutrients it
  means (`fibre`, and — if approved — `plant-protein`); drop the framing term.

### 8 · `magnesium_and_manganese` — **Split**  ·  file: oats.yaml · occ 1
- **Reason:** Compound of **two already-canonical** nutrients: `magnesium` and `manganese`. It failed
  only because it was one concatenated string.
- **Action required:** No new vocabulary. Split the oats.yaml entry into two `notable_nutrients` rows
  (`magnesium`, `manganese`); each then resolves by exact match. Pure authoring fix.

### 12 · `slow_release_carbohydrate` — **Reject**  ·  files: lentils.yaml, chickpeas.yaml · occ 2
- **Reason:** Glycaemic/blood-sugar framing, not a nutrient substance (no canonical carbohydrate
  nutrient). The value ("slow release") is a *benefit* narrative (blood-sugar-balance), not an identity.
- **Action required:** Reject as a nutrient. If the blood-sugar story is wanted, express it via the
  existing `blood-sugar-balance` benefit and the `fibre` nutrient — not a fabricated carb nutrient.

### 14 · `protein` — **New canonical vocabulary**  ·  file: greek-yoghurt.yaml · occ 1
- **Reason:** Genuine gap. The vocabulary has `plant-protein` only, but animal-source foods
  (greek-yoghurt, eggs, salmon) contain protein that is not plant-protein. Per GOV2 Rule 4 an
  unresolved-but-real substance becomes an honest new-identity decision, not a silent mint or a wrong
  alias to `plant-protein`.
- **Action required:** Editorial + engineering **new-identity decision** for `protein`
  (category `macronutrient`) in `shared/knowledge/nutrients.ts`, with `high-quality-protein` (item 4) as
  an alias. *Editorial alternative:* scope it as `animal-protein` if `plant-protein` is to stay strictly
  parallel — decide before authoring. **No import until decided + seeded.**

### 15 · `energy_density` — **Reject**  ·  file: extra-virgin-olive-oil.yaml · occ 1
- **Reason:** A nutrition *property* (kcal per gram), not a nutrient substance. For olive oil it is the
  fat/calorie framing. Not a canonical nutrient and not a health benefit.
- **Action required:** Reject. Re-author olive-oil.yaml to reference the real nutrients
  (`unsaturated-fats`, and its `monounsaturated-fat` alias) instead of the property.

### 17 · `choline` — **New canonical vocabulary**  ·  file: eggs.yaml · occ 1
- **Reason:** Choline is a real, well-defined essential nutrient (eggs are the archetypal source) with
  no canonical home. Genuine identity gap, not framing.
- **Action required:** Editorial + engineering **new-identity decision** for `choline` (category
  `other` or `vitamin`-adjacent) in `shared/knowledge/nutrients.ts`. Re-author eggs.yaml to reference it
  once seeded. **No import until decided + seeded.**

### 18 · `iodine_and_selenium` — **Split**  ·  file: eggs.yaml · occ 1
- **Reason:** Compound of **two already-canonical** nutrients: `iodine` and `selenium`.
- **Action required:** No new vocabulary. Split the eggs.yaml entry into two `notable_nutrients` rows;
  each resolves by exact match. Pure authoring fix.

### 21 · `manganese_and_minerals` — **Split** (+ partial reject)  ·  file: chickpeas.yaml · occ 1
- **Reason:** Compound: `manganese` (already canonical) plus a vague "minerals" category that is **not**
  an identity. The manganese half is a clean split; the "and minerals" tail is a non-specific
  non-identity.
- **Action required:** Split out `manganese` (exact match). Drop "minerals", or name the specific
  intended minerals (e.g. `copper`, `magnesium`, `zinc` — all canonical) as explicit entries. Authoring
  fix; no new vocabulary.

### 22 · `glucosinolates` — **Alias** (→ `sulforaphane`)  ·  file: broccoli.yaml · occ 1
- **Reason:** In brassicas, sulforaphane is the isothiocyanate **derived from** glucosinolates; canonical
  `sulforaphane` already carries broccoli's protective-compound story. Treating glucosinolates as an
  alias keeps one identity for one editorial narrative rather than forking a near-duplicate phytonutrient.
- **Action required:** Add `glucosinolates` → `sulforaphane` to `NUTRIENT_ALIASES`
  (`shared/knowledge/canonical-vocabulary-resolver.ts`). *Editorial alternative:* if the platform wants
  to distinguish precursor (glucosinolates) from active (sulforaphane) as separate facts, mint a
  **new identity** instead — this is a scope-test judgement call for editorial. Recommend Alias.

### 23 · `natural_sugars` — **Reject**  ·  file: blueberries.yaml · occ 1
- **Reason:** Intrinsic-sugars framing. There is no canonical sugar nutrient (deliberately), and
  "natural sugars" is a property/qualifier, not an identity.
- **Action required:** Reject. The berry's value is already carried by `anthocyanins` / `fibre` and the
  `blood-sugar-balance` benefit narrative — no sugar nutrient should be minted.

---

## BENEFIT DOMAIN — `benefit_language[].area`

> **Context for this whole section:** `benefit_language[].area` is an *editorial wording-area* label, not
> a health-benefit slug. It is being resolved against the 15-entry canonical benefit vocabulary, which it
> was never authored to match. Hence most items here are framing (Reject) or belong to another owner
> (Platform concept). Only `plant-diversity` from this slot ever resolved — via the deliberate
> `plant-diversity → gut-health` alias. See [Systemic findings](#systemic-findings).

### 2 · `micronutrient_density` — **Reject**  ·  files: spinach.yaml, broccoli.yaml · occ 2
- **Reason:** A nutrition *property* ("dense in micronutrients"), not a health-benefit identity and not a
  health outcome. Aliasing it to any benefit would fabricate an association (Principle 6).
- **Action required:** Reject as a benefit. The density story is already told by the food's specific
  `notable_nutrients`; no benefit vocabulary change.

### 3 · `meal_enrichment` — **Platform concept**  ·  files: spinach.yaml, olive-oil.yaml, chickpeas.yaml · occ 3
- **Reason:** Describes a culinary/planner function ("easy to add without changing a meal's identity"),
  not a health benefit. Owned by the Planner/Intelligence meal-composition model, not the benefit
  vocabulary. The resolver comments already name this class as intentionally non-benefit.
- **Action required:** Do **not** mint as a benefit. If wanted, model as planner meal-composition
  metadata (Planner/Intelligence owner). Remove from the `benefit_language` slot on re-author.

### 5 · `oily_fish_exposure` — **Platform concept**  ·  file: salmon.yaml · occ 1
- **Reason:** A dietary-*variety/pattern* concept (getting oily fish into the week), analogous to
  plant-diversity. Not a health-benefit identity; the nutritional value is already carried by the
  `omega-3` nutrient. Aliasing to heart/brain-health would fabricate a benefit from a food-exposure term.
- **Action required:** Do not mint as a benefit. Model as a dietary-variety/pattern signal in the
  Planner/Intelligence layer if the platform wants to track food-group exposure.

### 6 · `meal_balance` — **Platform concept**  ·  file: salmon.yaml · occ 1
- **Reason:** Planner meal-composition framing (a balanced plate), not a health outcome. Explicitly cited
  in the resolver as a non-benefit framing term for editorial decision.
- **Action required:** Do not mint as a benefit. Model in the Planner meal-composition layer; drop from
  `benefit_language` on re-author.

### 9 · `whole_grain` — **Reject**  ·  file: oats.yaml · occ 1
- **Reason:** A **food classification**, not a benefit. Already captured by
  `identity.food_category: whole_grain_cereal` and by the `fibre` nutrient. (Same concept as the rejected
  nutrient-slot item 7 — a classification, not a substance or an outcome.)
- **Action required:** Reject as a benefit. No vocabulary change; the classification is already owned by
  the food identity.

### 10 · `fibre` — **Reject** (misfiled — wrong domain)  ·  file: oats.yaml · occ 1
- **Reason:** `fibre` **is a canonical nutrient**, placed here in the *benefit* slot by the draft author.
  It is not a benefit; this is a domain misfile, not a missing benefit.
- **Action required:** Reject as a benefit. Fibre is already bound as a nutrient (oats/broccoli); if a
  fibre-driven benefit is wanted, use the existing `gut-health` / `digestive-comfort` benefits — do not
  create a `fibre` benefit.

### 11 · `household_practicality` — **Platform concept**  ·  file: oats.yaml · occ 1
- **Reason:** A household/planner practicality concept ("cheap, store-cupboard friendly, easy to adapt"),
  not a health benefit. Owned by the household/planner model.
- **Action required:** Do not mint as a benefit. Model as household/planner metadata; drop from
  `benefit_language` on re-author.

### 13 · `legume_exposure` — **Platform concept**  ·  files: lentils.yaml, chickpeas.yaml · occ 2
- **Reason:** Dietary-variety/pattern concept (getting legumes into the week), same class as
  `oily_fish_exposure`. Value already carried by `plant-protein` / `fibre`; not a benefit identity.
- **Action required:** Do not mint as a benefit. Model as a dietary-variety/pattern signal in
  Planner/Intelligence if desired.

### 16 · `absorption_context` — **Reject**  ·  file: extra-virgin-olive-oil.yaml · occ 1
- **Reason:** Nutrient-absorption pairing knowledge (fat carries fat-soluble compounds; vitamin C aids
  iron). This is **relationship-graph knowledge** — already modelled by the drafts' `nutrient_complements`
  / `relationships` — not a health-benefit identity.
- **Action required:** Reject as a benefit. Ensure the pairing is expressed via `nutrient_complements`
  (it already is in olive-oil/spinach/lentils drafts); no benefit vocabulary change.

### 19 · `breakfast_quality` — **Platform concept**  ·  files: eggs.yaml, greek-yoghurt.yaml, blueberries.yaml · occ 2
- **Reason:** A meal-occasion / meal-quality framing (a good breakfast), not a health benefit. Named in
  the resolver as a non-benefit framing term for editorial decision.
- **Action required:** Do not mint as a benefit. Model as planner meal-occasion/quality metadata; drop
  from `benefit_language` on re-author.

### 20 · `household_adaptability` — **Platform concept**  ·  file: eggs.yaml · occ 1
- **Reason:** A household-adaptation concept (works across household members with different needs), not a
  health benefit. Owned by the household model. Note `household_adaptation_notes` already exists on the
  drafts as the correct home for this.
- **Action required:** Do not mint as a benefit. It is already representable via
  `household_adaptation_notes`; drop from `benefit_language` on re-author.

### 24 · `plant_compounds` — **Reject**  ·  file: blueberries.yaml · occ 1
- **Reason:** A vague phytonutrient *umbrella* ("plant compounds"), broader than any canonical identity.
  The specific canonical phytonutrients (`anthocyanins`, `polyphenols`, `flavonoids`) already carry the
  value; aliasing an umbrella to any one of them would either under- or over-claim.
- **Action required:** Reject. Re-author blueberries.yaml to reference the specific canonical
  phytonutrients (`anthocyanins`, `polyphenols`) instead of the umbrella term.

---

## SYSTEMIC FINDINGS

These sit above the per-item triage and are the higher-value outcomes of NK6K.

1. **`benefit_language[].area` is being resolved against the wrong vocabulary.**
   The slot holds *editorial wording areas* (`meal_enrichment`, `household_practicality`,
   `breakfast_quality`, `micronutrient_density`…), yet the importer resolves each against the 15-entry
   **health-benefit** vocabulary. Only `plant-diversity` (via a deliberate alias) ever matched. Result:
   10 of 12 benefit-domain rejections are framing or platform concepts, not missing benefits.
   **Recommendation:** treat `benefit_language[].area` as free-form editorial copy that is *not* resolved
   to canonical benefits, **or** introduce a separate, explicit `benefits[].slug` field for genuine
   health-benefit references. This is an importer/schema decision for NK6, tracked here, not actioned.

2. **Compound nutrient labels must be split at authoring time.**
   `magnesium_and_manganese`, `iodine_and_selenium`, `manganese_and_minerals`, and
   `lutein_and_zeaxanthin` all failed only because two substances shared one string. Two of these resolve
   to **existing** canonical nutrients once split (no vocabulary change); the drafts should list one
   nutrient per `notable_nutrients` entry.
   **Recommendation:** add a draft-linting rule that rejects `X_and_Y` nutrient tokens before import.

3. **Two genuine canonical gaps: `protein` and `choline`.**
   These are the only two items that warrant new canonical *nutrient* identities. Both are real,
   well-defined nutrients with animal-source foods in the batch (greek-yoghurt/eggs/salmon; eggs). All
   other "missing" terms are framing, classifications, splits, or platform concepts — **not** vocabulary
   gaps. This keeps the vocabulary from bloating with wording.

4. **The queue is working as designed.** Per GOV2 Rules 4–7, the importer surfaced every unresolved
   string as an honest review proposal and minted nothing. NK6K is the editorial decision step; the
   canonical owners (`shared/knowledge/*.ts`) remain the sole place identities are created.

---

## WHAT HAPPENS NEXT (NOT DONE HERE)

Per the task, **no import, alias, or canonical change has been made.** The actions above are proposals.
The governed sequence to enact any of them:

1. **New identities** (`protein`, `choline`, `lutein`, `zeaxanthin`): editorial + engineering
   new-identity decision → author in `shared/knowledge/nutrients.ts` → `npm run seed:knowledge`.
2. **Aliases** (`glucosinolates` → `sulforaphane`; `high-quality-protein` → `protein`): add to
   `NUTRIENT_ALIASES` in `shared/knowledge/canonical-vocabulary-resolver.ts` (or publish via the KQ1F
   governed alias overlay).
3. **Splits** (`magnesium_and_manganese`, `iodine_and_selenium`, `manganese_and_minerals`): re-author the
   affected draft YAMLs to one nutrient per entry — **no vocabulary change**.
4. **Rejects & Platform concepts**: remove the terms from the draft `nutrient` / `benefit_language`
   slots; where a platform concept is wanted, model it in its true owner (Planner/Intelligence/household),
   never as canonical nutrition vocabulary.
5. Re-run the NK6 import against the corrected drafts; the queue should then drain to the 2 genuine
   new-identity decisions plus the alias/split authoring fixes.

**No item in this queue should be imported until its decision above is enacted through the owning source.**
