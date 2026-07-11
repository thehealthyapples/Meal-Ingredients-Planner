# NK6M — Canonical Nutrient Model Refinement

**Status:** ✅ Implemented in the TypeScript source of truth + resolver. **No DB push, no re-seed, no food import** (deferred — see Deployment).
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)
**Predecessor:** [`NK6L_CANONICAL_VOCABULARY_IMPLEMENTATION.md`](./NK6L_CANONICAL_VOCABULARY_IMPLEMENTATION.md) (added `protein`, `choline`, `lutein`, `zeaxanthin`, `glucosinolates`)
**Files touched:** `shared/schema.ts`, `shared/knowledge/nutrients.ts`, `shared/knowledge/relationships.ts`, `shared/knowledge/canonical-vocabulary-resolver.ts`, `server/intelligence/conversation/capability-composition.ts` (comment), `server/tests/test-intelligence-capability-composition.ts` (assertion message).

---

## 1. Executive summary

Two architecture refinements to the canonical nutrient model, applied at the TypeScript source of truth (NK6F: TypeScript owns the nutrient vocabulary) and enforced through the single GOV2 resolver.

1. **Protein — collapse to one identity.** `protein` is now the **single** canonical protein identity. Plant vs animal is a **source attribute** (a property of the food the protein comes from), *not* a separate nutrient. The former `plant-protein` identity is collapsed into `protein` and resolves to it as an alias. This removes the duplicate ownership that existed while `protein` and `plant-protein` were two identities each owning "protein used to build and repair the body".

2. **Carotenoids — introduce a parent family.** `carotenoids` is introduced as the parent phytonutrient **family**. `beta-carotene`, `lycopene`, `lutein` and `zeaxanthin` are **classified beneath** it via a new `family` attribute. They are **not** merged or aliased — each keeps its own canonical identity, description and facts. Family is a *classification*, not an alias.

The two refinements are deliberately different treatments because the entities are different:

| | Protein | Carotenoids |
|---|---|---|
| Real-world relationship | one substance, different **sources** | genuinely **different** substances, one family |
| GOV2 treatment | **merge** → one identity + alias | **classify** → parent family, members keep identity |
| Scope test (Core Principle 2) | "plant protein" and "protein" can never need to disagree on a fact → same identity | lutein and zeaxanthin *do* disagree on facts (different pigments/roles) → separate identities |
| Do not | duplicate ownership | merge or alias the members |

Verified against the edited source: `validateKnowledgeSeed()` → **no problems**; nutrient count **35** (34 after removing `plant-protein`, +1 for `carotenoids`); resolver load-time anti-fork guard passes.

---

## 2. Changes made

### 2.1 Protein — single identity, plant/animal as source attributes

- **Removed** `plant-protein` as a canonical nutrient identity from `NUTRIENT_SEED` (`shared/knowledge/nutrients.ts`). It no longer owns a slug, a display name or facts.
- **`protein` is the sole identity.** Its editorial description was rewritten to be source-neutral: it now states protein comes from *both* plant sources (beans, lentils, nuts, seeds) *and* animal sources (eggs, fish, dairy), and that **the source is a property of the food, not a different nutrient**.
- **Added aliases** in `NUTRIENT_ALIASES` (`shared/knowledge/canonical-vocabulary-resolver.ts`): `plant-protein → protein` and `animal-protein → protein`. Combined with the existing `high-quality-protein → protein`, every source-qualified or quality-framed protein name now resolves, many-to-one, to the one identity (GOV2 Rule 3/7).
- **Rewrote all `plant-protein` references** in `shared/knowledge/relationships.ts` to `protein`:
  - **36 `FOOD_NUTRIENTS` rows** (walnuts, almonds, all legumes, tofu, tempeh, quinoa, etc.) now link to `protein`. No food referenced both `plant-protein` and `protein`, so no de-duplication was required.
  - **1 `NUTRIENT_BENEFITS` key** (`plant-protein → [muscle-recovery, energy-support]`) renamed to `protein`.
  - 3 historical `// FI2:` annotation comments updated for accuracy.

> **Why source-as-attribute, not a `source` column.** The plant/animal distinction is already carried by the **food**: walnuts are a plant, salmon is animal. Modelling it on the nutrient would re-fork the identity we just merged. So "plant protein" is a source-qualified *name for protein*, resolved by the resolver; the source itself lives on the food side of the `food → nutrient` link.

### 2.2 Carotenoids — parent phytonutrient family

- **Added a nullable `family` column** to `knowledge_nutrients` (`shared/schema.ts`): `family: text("family")`. A nutrient may be classified beneath a broader canonical family without being merged/aliased into it. Null = top-level (which includes family rows such as `carotenoids` itself). Additive and nullable, so no existing row or consumer breaks; `createInsertSchema` makes it optional.
- **Added the `carotenoids` canonical identity** to `NUTRIENT_SEED` — category `phytonutrient`, its own description of the fat-soluble pigment family. It is a real identity in its own right, not a synthetic bucket.
- **Classified the four carotenoids beneath it** with `family: "carotenoids"`: `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin`. Each keeps its own slug, name, description and `NUTRIENT_BENEFITS` links unchanged. **No merge, no alias.**

### 2.3 Downstream honesty fix (no behaviour change)

`server/intelligence/conversation/capability-composition.ts` carried a comment claiming the registry "only has the narrower `plant-protein`" to justify leaving the `'protein'` uplift tag unmapped. That rationale is now stale (there *is* a canonical `protein`). The comment (and the matching test assertion message) were updated to state the true reason: the `'protein'` tag is **deliberately** left unmapped — an editorial routing gap, not a missing slug. The tag remains unmapped; **no runtime behaviour changed** and the test still passes.

---

## 3. Data impact

| Area | Impact |
|---|---|
| **Canonical nutrient count** | 35 → 35 (−`plant-protein`, +`carotenoids`). |
| **Nutrient identities removed** | `plant-protein` (collapsed into `protein`). |
| **Nutrient identities added** | `carotenoids` (parent family). |
| **`family` classification set** | 4 rows: `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin` → `carotenoids`. |
| **`FOOD_NUTRIENTS` rows re-pointed** | 36 rows `plant-protein → protein`. On the next seed/import these foods bind to the `protein` slug instead of `plant-protein`. |
| **`NUTRIENT_BENEFITS`** | `plant-protein` benefit key → `protein` (associations preserved verbatim). |
| **Fabricated facts** | None. No `NUTRIENT_BENEFITS` were invented for `carotenoids`; benefit associations remain for editorial to author with evidence (Core Principle 6). The four members keep their existing evidence-checked links. |
| **Numeric nutrition values** | Untouched (still database-validated only). |

**Live DB state (unchanged by this task).** No `db:push`, no re-seed and no re-import were run (consistent with NK6L). The current `knowledge_nutrients` table still contains the old `plant-protein` row and lacks the `family` column until the deployment steps below are run. Nothing in this change executes a write at import time, so the app boots unchanged.

---

## 4. Backwards compatibility

- **Old `plant-protein` strings still resolve.** Any path still emitting `plant-protein` / `plant_protein` / `Plant Protein` — importers, previously-seeded rows, the draft YAMLs (`lentils`, `oats`, `chickpeas`, `sweetcorn`, `garden-peas`), OCR/AI/search — resolves through the single resolver to `protein` (`via: "alias"`). No path is broken and no second identity can be minted from the old string (GOV2 Rule 5/7).
- **Draft YAMLs need no edit.** They keep `plant_protein`; it resolves via the new alias. (Left intentionally, to demonstrate the alias carries the backwards-compat load — same pattern NK6L used for `greek-yoghurt`.)
- **Existing DB rows survive.** Seeding is upsert-by-slug and never deletes: after a future re-seed the `protein` row is upserted and the orphaned `plant-protein` row simply lingers (harmless, resolvable). A one-line cleanup can retire it later; it is **not** required for correctness.
- **`family` is additive.** A new nullable column; existing rows read back `null`. No consumer reads `family` yet, so nothing depends on it being populated. Carotenoid slugs are unchanged, so all existing `food → nutrient` links to `beta-carotene`/`lycopene`/`lutein`/`zeaxanthin` are intact.
- **Freeform food tags** (e.g. `server/lib/seed-food-knowledge.ts` `tags: [... "plant-protein" ...]`) are display/search tags, **not** governed nutrient-slug references, and were left as-is.
- **No user-facing name regression** (GOV2 Rule 6): the product now shows the one canonical name **Protein**; "plant protein" survives as an *Also known as…* alias, and as descriptive prose in food descriptions.

---

## 5. Remaining future phytonutrients to classify

Only `carotenoids` was introduced now (in scope). The registry already holds other phytonutrients that form natural families; classifying them is deferred, separate editorial work (each is additive, using the same `family` attribute — never a merge/alias):

| Candidate parent family | Current registry members to classify beneath it | Notes |
|---|---|---|
| `polyphenols` | `flavonoids`, `anthocyanins`, and (arguably) `lignans` if added | Real nested hierarchy: **anthocyanins ⊂ flavonoids ⊂ polyphenols**. `polyphenols` and `flavonoids` already exist as identities; `family` can encode the two levels (`anthocyanins.family = flavonoids`, `flavonoids.family = polyphenols`) once editorially confirmed. |
| `carotenoids` (this task) | ✅ `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin` | Future carotenoids (e.g. `astaxanthin`, `beta-cryptoxanthin`) should be added with `family: "carotenoids"`. |
| `glucosinolates` | precursor→active relationship to `sulforaphane` (stated in prose, NK6L) | Kept as its own identity; whether `sulforaphane` should carry `family: "glucosinolates"` is an editorial call — the two are precursor/product, which is a relationship, not necessarily a family membership. Decide explicitly, do not auto-classify. |
| (ungrouped) | `allicin`, `nitrates` | No parent family in the current registry; leave `family = null` until a real family identity exists. Do **not** invent an umbrella. |

**Governance for future classification:** adding a `family` value is a content edit (like adding an alias), never a schema or identity change. A member is only classified beneath a family when it genuinely *is* a member of that family (scope test) — never to tidy the list. Members always keep their own identity and facts; classification adds a parent pointer, it never merges ownership.

---

## 6. Verification

Run against the edited source (no DB writes):

- `validateKnowledgeSeed()` → **no problems** (no dangling nutrient slugs after the 36-row re-point + key rename).
- `NUTRIENT_SEED.length` = **35**; `plant-protein` no longer a canonical slug; `carotenoids` present.
- `family: "carotenoids"` set on exactly `beta-carotene`, `lycopene`, `lutein`, `zeaxanthin`.
- Resolver (single GOV2 resolver, load-time anti-fork guard passes):
  - `plant-protein`, `plant_protein`, `Plant Protein`, `animal-protein`, `high-quality protein` → `protein` (`via: alias`)
  - `protein` → `protein` (`via: exact`), `carotenoids` → `carotenoids` (`via: exact`), `lutein` → `lutein` (`via: exact`, i.e. **not** aliased into the family).
- `npx tsc --noEmit`: introduces **no new** type errors (pre-existing unrelated errors in `turn-outcome-store.ts`, query scripts and some tests are untouched by this change).
- `test-intelligence-capability-composition.ts`: the protein-tag assertions pass; the 7 pre-existing failures (intent-composition wiring, unrelated to the nutrient model) are unchanged by this task.

---

## 7. Deployment (deferred — not done here)

Consistent with NK6L, the source-of-truth change is made but not deployed:

1. **`npm run db:push`** — add the new nullable `knowledge_nutrients.family` column to the live DB. Safe/additive.
2. **`npm run seed:knowledge`** (or equivalent) — upsert `NUTRIENT_SEED`: adds `carotenoids`, populates `family` on the four carotenoids, and rebinds the 36 protein `food → nutrient` links. The orphaned `plant-protein` row remains until optionally retired.
3. **Re-import / reconcile** the canonical-food drafts (a separate, approved action) if/when the live `food → nutrient` links should reflect the re-pointed protein relationships and the `plant_protein` draft terms should be persisted as `protein`.
