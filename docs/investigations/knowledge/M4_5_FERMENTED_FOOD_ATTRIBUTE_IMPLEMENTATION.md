# M4.5 — Canonical Food Attributes: Fermented Food Attribute Implementation

**Date:** 2026-06-25
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🔴 RED — Canonical food architecture
**Reason:** Adding a new column to the canonical food identity spine (`canonical_food` table). Architecture is additive and non-breaking, but any change to the canonical identity layer is classified RED per THA risk policy.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-m4-5-fermented-attribute-20260625-1830` → HEAD at tag time |
| Working tree at start | Intentionally dirty — 30+ modified tracked files from in-progress WS0X streams and M1–M4 completion. Not created by this task. |
| This task's writes | `shared/schema.ts` (1 column added) · `shared/canonical/foods.ts` (11 `fermented: true` assignments + 1 new food) · `shared/canonical/food-context.ts` (1 entry added) · `server/seeds/seed-canonical-food.ts` (UPSERT extended) · `migrations/0001_m4_5_fermented_attribute.sql` (new) · this document |
| Rollback command | `git checkout rollback/before-m4-5-fermented-attribute-20260625-1830` |

**Rollback confirmed before implementation began.**

---

## REFERENCE DOCUMENTS READ

- [x] `docs/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/ENGINEERING_WORKFLOW.md`
- [x] `docs/investigations/knowledge/M4_CANONICAL_DIVERSITY_GROUP_CONVERGENCE_IMPLEMENTATION.md`
- [x] `shared/schema.ts` (canonicalFoods table — columns and types)
- [x] `shared/canonical/foods.ts` (CANONICAL_SEED — 249 editorial foods before M4.5)
- [x] `shared/canonical/index.ts` (CANONICAL_FOOD_SEED build, validateCanonicalSeed)
- [x] `shared/canonical/food-context.ts` (FOOD_CONTEXT_SEED — controlled vocabularies)
- [x] `server/seeds/seed-canonical-food.ts` (UPSERT runner)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  canonical_food.slug remains the single key space for food identity.
  No new key space introduced. The fermented boolean is an ATTRIBUTE
  on the existing identity, not a new identity.

☑ One owner per fact
  fermented attribute has exactly one owner: the canonical_food table.
  No parallel store. No client-side copy. Seed input is in foods.ts
  (same pattern as availability/peakSeasons/originRegion from WS0X.5).

☑ No duplicate entities
  No new entity created. fermented is a column on the existing
  canonical_food table. One new canonical food added (kombucha) —
  not a duplicate of any existing food.

☑ No duplicate ownership
  fermented is not owned anywhere else in the system. The attribute
  does not shadow any existing field. No parallel boolean exists.

☑ No duplicate state
  fermented is editorial seed fact, not user state. No user state
  is split or duplicated.

☑ Extends existing architecture
  Follows exactly the same progressive enrichment pattern established
  by WS0X.5 (availability, peakSeasons, originRegion, modifiers).
  The column is additive, nullable-compatible (default false),
  and read from the single canonical source.

☑ Progressive enrichment where appropriate
  Knowledge entity (food). fermented: false is the safe default.
  No food is marked fermented without evidence. Missing context
  renders as false (not fermented / attribute not applicable) — never
  as fabricated content.

☑ Honest gaps over fabricated information
  Only 11 foods receive fermented: true — all with clear evidence
  from food science (live microbial cultures, metabolic transformation
  by micro-organisms). Foods where fermentation is ambiguous (e.g.
  aged hard cheeses) are left at the default false. No fabrication.

☑ No permanent synchronisation bridge
  No bridge. fermented is read directly from the canonical_food table.
  No second store exists to sync with.

☑ Evolution over replacement
  Nothing is replaced. This is a pure addition. Principle 8 applies
  only when a new store supersedes an existing one — not applicable here.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Canonical Food Identity
Declared SoT: shared/canonical/foods.ts → DB canonical_food (via seed-canonical-food.ts)
New store created? NO
  If YES: retirement plan for any replaced store: N/A
Existing store extended? YES — one new boolean column (fermented) added to canonical_food
Consumer created? NO
  The fermented attribute is available to future report surfaces (e.g. "Fermented Foods
  This Week") but no consumer is created in this workstream (scope lock).
  If YES: reads from declared SoT? N/A
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Canonical Food Identity — Fermented Attribute

Current Canonical Owner:
  shared/canonical/foods.ts → DB canonical_food.fermented

Current Runtime Consumer(s):
  None created in M4.5. The attribute is available to future report surfaces.
  Future consumers will read from canonical_food.fermented via the assembled
  food model (consistent with Principle 4 — runtime consumes one assembled model).

Duplicate Owners Remaining:
  NONE. No parallel store for fermentation status existed before M4.5.
  This is a new attribute introduced for the first time.

Duplicate State Remaining:
  NONE.

Duplicate Workflows Remaining:
  NONE.

Current Convergence (%):
  100% — the fermented attribute has a single owner from inception.
  No pre-existing parallel store to converge away from.

Target Convergence (%):
  100%

Next Planned Milestone:
  M5 (or a future reporting workstream) will introduce a "Fermented Foods This Week"
  report surface that reads from canonical_food.fermented. That workstream will
  also review whether additional fermented foods should be added to the seed.

Remaining Architectural Risks:
  NONE — the attribute is additive, single-owner, and does not alter plant diversity
  counting, meal identity, or any existing architectural boundary.
```

---

## IMPLEMENTATION

### New Column: `canonical_food.fermented`

Added to `shared/schema.ts` in the `canonicalFoods` table:

```typescript
fermented: boolean("fermented").notNull().default(false),
```

- `false` is the safe default — existing and new foods that do not undergo meaningful fermentation default to `false` without any explicit assignment.
- `true` is assigned only where the food undergoes meaningful fermentation: live microbial cultures or metabolic transformation by micro-organisms is a defining characteristic of the food.
- The column sits beside the existing WS0X.5 food context columns (availability, peakSeasons, originRegion) following the same progressive enrichment pattern.

### Migration

`migrations/0001_m4_5_fermented_attribute.sql`:
```sql
ALTER TABLE "canonical_food" ADD COLUMN "fermented" boolean DEFAULT false NOT NULL;
```

### Seed Data Assignments

Evidence used: food science definitions. A food is marked `fermented: true` if fermentation by micro-organisms is a **defining characteristic** of the food — not merely incidental.

| Food | Slug | Fermented | Evidence |
|------|------|-----------|----------|
| Yoghurt | `yoghurt` | `true` | Cultured with Lactobacillus; fermentation is definitional |
| Kefir | `kefir` | `true` | Cultured with kefir grains (bacteria + yeast symbiosis) |
| Tempeh | `tempeh` | `true` | Fermented with Rhizopus mold; transformed soya cake |
| Miso | `miso` | `true` | Fermented with Aspergillus oryzae (koji); definitional |
| Sauerkraut | `sauerkraut` | `true` | Lacto-fermented cabbage; fermentation is definitional |
| Kimchi | `kimchi` | `true` | Lacto-fermented vegetables; fermentation is definitional |
| Natto | `natto` | `true` | Fermented with Bacillus subtilis; definitional |
| Sour Cream | `sour-cream` | `true` | Description: "Cream fermented with lactic acid bacteria" |
| Crème Fraîche | `creme-fraiche` | `true` | Cultured cream with active bacterial cultures |
| Buttermilk | `buttermilk` | `true` | Cultured from milk with lactic acid bacteria |
| Kombucha | `kombucha` | `true` | Fermented tea with SCOBY; definitional (new food added) |

### New Food: Kombucha

Added to `shared/canonical/foods.ts` as a first-class canonical food:
- `slug: "kombucha"`
- `category: "Fermented foods"`, `subcategory: "Fermented drinks"`
- `diversityGroupSlug: null` — tea is not tracked for plant diversity
- `knowledgeFoodSlug: null` — no WS0 knowledge entry yet
- `fermented: true`
- Food context: `fc("common", [], "east-asia", ["imported"])` (widely available in UK supermarkets; origin: East Asia)

### Seed Runner Update

`server/seeds/seed-canonical-food.ts` UPSERT `set` clause extended with:
```typescript
fermented: sqlExcluded("fermented"),
```
This ensures re-seeding always re-aligns the `fermented` column to the editorial seed.

### Architecture Note — Plant Diversity Unchanged

The M4 compliance checklist explicitly preserved `diversityGroupSlug: null` for sauerkraut, kimchi, miso, tempeh as editorial decisions (honest gaps). M4.5 does NOT reverse those decisions. The `fermented` attribute is orthogonal to plant diversity:

- Sauerkraut: `fermented: true`, `diversityGroupSlug: null` → fermented food; not counted for plant diversity
- Kimchi: `fermented: true`, `diversityGroupSlug: null` → fermented food (multi-plant; can't be represented by one slug)
- Tempeh: `fermented: true`, `diversityGroupSlug: null` → fermented food; not counted for plant diversity
- Miso: `fermented: true`, `diversityGroupSlug: null` → fermented food; not counted for plant diversity
- Natto: `fermented: true`, `diversityGroupSlug: "edamame"` → fermented AND counts for plant diversity (pre-existing assignment)

The "Verify" items from the task brief confirm the canonical IDENTITY of these foods is preserved:
- Sauerkraut's description ("Fermented cabbage") preserves its cabbage identity ✓
- Kimchi's description ("Korean ferment of cabbage and spices") preserves its multi-plant identity ✓
- Tempeh's description ("firm fermented soya cake") preserves its soya identity ✓
- Miso's description ("fermented soya bean paste") preserves its soya identity ✓

Adding `fermented: true` does NOT change any of these canonical identities. ✓

---

## DEFINITION OF DONE

| Criterion | Status |
|-----------|--------|
| `fermented` boolean column added to `canonical_food` schema | ✓ |
| Migration SQL created | ✓ |
| 11 foods assigned `fermented: true` with evidence | ✓ |
| Kombucha added as new canonical food | ✓ |
| Seed runner updated to persist `fermented` on UPSERT | ✓ |
| `validateCanonicalSeed()` passes — 0 violations | ✓ |
| TypeScript typechecks — 0 new errors introduced | ✓ |
| No new diversity groups created | ✓ |
| Canonical food identities (slugs, names, diversityGroupSlugs) unchanged | ✓ |
| Plant diversity architecture unchanged | ✓ |
| Future "Fermented Foods This Week" surface enabled | ✓ (attribute in place) |
| Project documentation created | ✓ |

**What must not break:**
- Plant diversity counts — unchanged ✓
- 30-plants widget — unchanged ✓
- Existing canonical food slugs — unchanged ✓
- Existing `diversityGroupSlug` assignments — unchanged ✓
- `validateCanonicalSeed()` — passes ✓

**Manual test steps (post-migration):**
1. Run `npm run seed:canonical` — should complete with 250 canonical foods (up from 249)
2. `SELECT slug, fermented FROM canonical_food WHERE fermented = true ORDER BY slug;` — should return 11 rows
3. `SELECT slug FROM canonical_food WHERE slug = 'kombucha';` — should return 1 row
4. `SELECT COUNT(*) FROM diversity_group;` — should remain at 173 (no new groups)
5. Confirm the 30-plants widget is unaffected by testing a meal containing sauerkraut

---

## DATA IMPACT

- Reads existing data: YES — reads all canonical food seed entries
- Writes new data: YES — adds `fermented` column; adds kombucha row
- Changes meaning of existing data: NO — all existing rows gain `fermented: false` by default; no existing attribute changes meaning
- Requires backfill: YES (limited scope) — `fermented` attribute population only. No `diversityGroupSlug` changes. The `ALTER TABLE ... DEFAULT false NOT NULL` migration handles existing rows automatically.

---

## TRUST CHECK

| Question | Answer |
|----------|--------|
| Could this mislead the user? | No. `fermented` is not displayed to users in M4.5; it enables future reporting only. |
| Could this fabricate certainty? | No. Only evidence-based assignments. Default is `false` (not "unknown"). |
| Is anything guessed but shown as real? | No. |
| What happens if the system is wrong? | An incorrectly marked food appears in a future "Fermented Foods This Week" report. Impact is low: no health claim is made, only a food categorisation. |
| No architectural duplication introduced | YES — single owner from inception |
| No new source of truth created | YES — extends existing canonical_food, not a parallel store |
| No runtime behaviour altered | YES — no consumer reads `fermented` yet; attribute is in place for future surfaces |
| No duplicate ownership | YES — confirmed |
| No fabricated food attributes | YES — 11 assignments, all with evidence cited above |
| No plant diversity changes | YES — zero diversityGroupSlug changes; zero diversity_group additions |
| No bridges introduced | YES — no bridge; single store |

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-m4-5-fermented-attribute-20260625-1830` |
| Files modified | `shared/schema.ts`, `shared/canonical/foods.ts`, `shared/canonical/food-context.ts`, `server/seeds/seed-canonical-food.ts`, `migrations/0001_m4_5_fermented_attribute.sql` |
| Rollback command | `git checkout rollback/before-m4-5-fermented-attribute-20260625-1830` |
| DB rollback | `ALTER TABLE "canonical_food" DROP COLUMN "fermented";` — safe, no downstream consumers yet |
| Verification after rollback | Run `validateCanonicalSeed()` — should pass. Confirm `fermented` column absent from schema. |

---

## SCOPE LOCK

**Implemented scope:**
- `fermented` boolean column on `canonical_food`
- 11 evidence-based `fermented: true` assignments
- 1 new canonical food (kombucha)
- 1 migration SQL file
- Seed runner UPSERT extension

**Explicitly excluded scope:**
- No "Fermented Foods This Week" report UI — M5 or future reporting workstream
- No Nutrition Report redesign
- No plant diversity changes (zero `diversityGroupSlug` modifications)
- No new diversity groups
- No knowledge entries (`knowledge_foods` table unchanged)
- No changes to `plant-classifier.ts`, `item-resolver.ts`, or any runtime service

**SUGGESTION (do not implement without approval):**
- Tempeh, miso, and sauerkraut currently have `diversityGroupSlug: null`. A future editorial decision could link tempeh and miso to `"edamame"` (as natto already is) and sauerkraut to `"cabbage"` — this would make them count for plant diversity. This was explicitly preserved as null in M4. A separate editorial decision workstream is needed before any change.
- Blue cheeses (Stilton, Gorgonzola, Roquefort) undergo mold fermentation. A future M4.5b could add `fermented: true` to blue cheese varieties if the product team decides to include them in the fermented foods narrative.
- Water kefir is a distinct product from milk kefir — may warrant its own canonical food entry if usage data supports it.
