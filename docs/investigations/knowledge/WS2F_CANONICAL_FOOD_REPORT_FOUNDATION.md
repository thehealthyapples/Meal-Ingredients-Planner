# WS2F — Canonical Food Report Foundation (Implementation)

> **One food. One source of truth. A reusable report that every surface can read.**
>
> WS2F implements the foundational Food Report knowledge adapter using
> WS2A (canonical identity), WS2B (variety surfacing), WS2D (architecture
> principles) and WS2E (slug reconciliation) as its authority sources.

| | |
|---|---|
| **Document type** | Implementation + validation report |
| **Date** | 2026-06-19 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at start** | `e3857d6` (WS2E doc committed) |
| **Implementation commit** | `39a8810` |
| **Rollback tag** | `rollback/pre-ws2f-food-report-foundation-20260619` → commit `e3857d6` |
| **Restore command** | `git reset --hard rollback/pre-ws2f-food-report-foundation-20260619` |
| **Tests** | `npm run test:food-report` → **89 passed, 0 failed** |
| **Predecessors** | WS2A · WS2B · WS2C · WS2D · WS2E |

---

## 0. ROLLBACK & SAFETY HEADER (completed before implementation)

1. ✅ **Git status confirmed clean** — only untracked file was `WS2E_CANONICAL_SLUG_RECONCILIATION.md`.
2. ✅ **WS2A / WS2B / WS2C / WS2D / WS2E all protected.**
   - WS2A → tag `rollback/ws2a-pre-impl-20260618`
   - WS2B → tag `rollback/ws2b-pre-impl-20260619`
   - WS2C → tag `ws2c-rollback-baseline` + commit `df28cf6`
   - WS2D → tag `rollback/ws2d-pre-investigation-20260619` → commit `df28cf6`
   - WS2E → committed `e3857d6` then tagged `rollback/ws2e-pre-investigation-20260619`
3. ✅ **Rollback point created** — tag **`rollback/pre-ws2f-food-report-foundation-20260619`** → commit **`e3857d6`**.
4. ✅ **Rollback identifier reported** (top of doc + here).

**Restore command:** `git reset --hard rollback/pre-ws2f-food-report-foundation-20260619`

---

## SECTION 1 — What was built

The Food Report Foundation is a **read-only knowledge adapter** assembled from
existing authoritative registries. No new data stores were created. No existing
production code was modified.

### Architecture

```
canonicalFoodSlug
       │
       ▼
 CANONICAL_SEED (WS2A)
       │
       ├─ identity: name, category, description
       ├─ knowledgeFoodSlug (FK → WS0)
       └─ varieties → each with optional knowledgeFoodSlug (WS2F extension)
                              │
                              ▼
                  WS0 knowledge registry
                  ├─ FOOD_NUTRIENTS  → Key Nutrients (max 5)
                  ├─ FOOD_BENEFITS   → Health Benefits
                  └─ FOOD_SEED       → fallback description
                              │
                  NUTRITION_CONTEXT  → Nutrition Context lines
                              │
                              ▼
                  FoodReportKnowledge
                  ├─ overview (name + category + description)
                  ├─ keyNutrients (string[], max 5)
                  ├─ healthBenefits (string[])
                  ├─ nutritionContext (string[])
                  └─ varieties (each with additionalNutrients + additionalBenefits)
```

### Files changed (additive)

| File | Change | Lines |
|---|---|---|
| `shared/canonical/foods.ts` | Added `knowledgeFoodSlug` to `VarietySeed`; wired mushroom varieties to WS0; added `spinach` + `lentils` canonical entries | +70 |
| `shared/canonical/diversity-groups.ts` | Added `spinach` + `lentils` diversity groups | +5 |

### Files created

| File | Purpose |
|---|---|
| `shared/canonical/food-report-adapter.ts` | `buildFoodReport(slug)` → `FoodReportKnowledge \| null`; `isCanonicalFood(slug)` |
| `shared/canonical/nutrition-context.ts` | Curated context lines for 10 proving-set foods (WS2D Stage S2 seed shape) |
| `server/tests/test-food-report-adapter.ts` | 89 checks — manual tests, integrity, preparation guard, deduplication |

**Production behaviour files touched: none.** No edits to routes, storage, existing
client components, Pantry, Planner, Shopping, Nutrition Boosts or Apple Score.

---

## SECTION 2 — Canonical food additions

Two new canonical foods were added to the WS2A proving set:

### Spinach
- Slug: `spinach` · Category: `Vegetables` / `Leafy greens`
- `knowledgeFoodSlug`: `spinach` (WS0 already holds nutrients + benefits)
- Aliases: `baby spinach` (form), `fresh spinach` (form), `frozen spinach` (form)
- No varieties defined (spinach has no WS2A variety structure yet)
- **Why now:** spinach is the highest-priority missing canonical identity from
  WS2E §6.2 — present in WS0, benefit library, pantry and boosts, but previously
  unresolvable by the adapter.

### Lentils
- Slug: `lentils` · Category: `Legumes` / `Lentils`
- `knowledgeFoodSlug`: **null** — deliberately avoids conflating generic "lentils"
  with `red-lentils` nutritionally (WS2E §3.1 risk).
- Varieties: Red Lentils (→ WS0 `red-lentils`), Green Lentils, Puy Lentils, Beluga Lentils
- Aliases (form): `dried lentils`, `split lentils`, `tinned lentils`, `cooked lentils`
- **Decision applied:** WS2E recommended "decide whether Lentils is one canonical
  food with varieties" — WS2F takes that decision: **one canonical food, four varieties**.
  Preparations (dried/split/tinned) are form aliases, never varieties.

### Mushroom variety knowledge links (WS2F extension)
Mushroom varieties are now wired to their WS0 food slugs via the new `VarietySeed.knowledgeFoodSlug`:

| WS2A variety | WS0 food |
|---|---|
| `button-mushroom` | `white-mushrooms` |
| `chestnut-mushroom` | `chestnut-mushrooms` |
| `shiitake-mushroom` | `shiitake-mushrooms` |
| `oyster-mushroom` | `oyster-mushrooms` |

This resolves the mushroom granularity issue documented in WS2E §3.6 — the adapter
can now surface per-variety knowledge for mushrooms.

---

## SECTION 3 — Nutrition Context seed

`shared/canonical/nutrition-context.ts` holds the first authored set of curated
context lines (WS2D Stage S2 seed shape). Ten foods have context:

| Canonical food | Context |
|---|---|
| `tomato` | Cooking increases lycopene availability |
| `spinach` | Vitamin C supports iron absorption |
| `mushroom` | UV/sunlight increases vitamin D (+ non-animal vitamin D source note) |
| `chickpeas` | Combining with wholegrains → complete amino acids |
| `lentils` | Both protein and fibre in one ingredient |
| `flaxseed` | Ground form is better absorbed |
| `chia-seeds` | Soaking makes them gentler on digestion |
| `walnuts` | ALA omega-3 source (body converts to DHA/EPA) |
| `extra-virgin-olive-oil` | Mediterranean diet cornerstone + least processed form |
| `avocado` | Fat supports fat-soluble vitamin absorption |

Rules upheld: short · evidence-based · educational · no disease claims · sourced
from established nutritional understanding.

---

## SECTION 4 — The FoodReportKnowledgeAdapter

### `buildFoodReport(canonicalSlug: string): FoodReportKnowledge | null`

**Returns null when:**
- The slug is not in `CANONICAL_SEED` (the preparation guard — preparations like
  "grilled-tomatoes", containers like "mixed-beans", and unknown strings all fall
  through to null and never receive a Food Report).

**Returns `FoodReportKnowledge` when:**
- The slug exists in `CANONICAL_SEED` as a canonical food.

**`FoodReportKnowledge` shape:**
```typescript
{
  canonicalSlug: string;
  overview: {
    name: string;         // from WS2A canonical food
    category: string;     // from WS2A
    description: string;  // canonical preferred; "" when absent
  };
  keyNutrients: string[];      // display names, max 5, from WS0 FOOD_NUTRIENTS
  healthBenefits: string[];    // display names, from WS0 FOOD_BENEFITS
  nutritionContext: string[];  // curated lines from NUTRITION_CONTEXT
  varieties: Array<{
    slug: string;
    name: string;
    label: string;              // food-name-stripped label (e.g. "Cherry")
    additionalNutrients: string[]; // variety-exclusive (not in parent)
    additionalBenefits: string[];  // variety-exclusive (not in parent)
  }>;
}
```

### Deduplication guarantee
Variety knowledge shows ONLY facts not already covered by the parent food:
- `additionalNutrients` = variety nutrients **not** in parent's nutrient set
- `additionalBenefits` = variety benefits **not** in parent's benefit set
- Empty arrays → caller renders nothing for that variety (WS2B discipline applies)

---

## SECTION 5 — Manual test results

All manual tests from the WS2F brief executed successfully:

### Tomato
```
overview.name      = "Tomato"
overview.category  = "Vegetables"
overview.description = "A fruiting vegetable eaten fresh, tinned or cooked..."
keyNutrients       = ["Lycopene", "Vitamin C", "Potassium"]
healthBenefits     = ["Heart Health", "Skin Health", "Healthy Ageing"]
nutritionContext   = ["Cooking and processing increase lycopene availability..."]
varieties          = [Cherry (no additional), Plum (no additional), Heirloom (no additional)]
```
Cherry label = "Cherry". No additional knowledge (no WS0 link on tomato varieties — WS0 covers tomato as a whole via knowledgeFoodSlug on the canonical food).

### Spinach
```
overview.name      = "Spinach"
overview.category  = "Vegetables"
keyNutrients       = ["Folate", "Iron", "Vitamin K", "Beta-Carotene"]
healthBenefits     = ["Eye Health", "Energy Support", "Bone Health"]
nutritionContext   = ["Pairing spinach with a source of vitamin C..."]
varieties          = [] (none defined)
```

### Mushroom
```
overview.name      = "Mushroom"
overview.category  = "Mushrooms"
keyNutrients       = [] (knowledgeFoodSlug = null)
healthBenefits     = [] (knowledgeFoodSlug = null)
nutritionContext   = ["Placing mushrooms gill-side up in sunlight...", "...non-animal vitamin D"]
varieties (all "additional" since parent has none):
  Button    → Vitamin D, Selenium, Copper, Fibre + Immune Support, Bone Health
  Chestnut  → Selenium, Copper, Fibre + Immune Support, Heart Health
  Shiitake  → Copper, Selenium, Fibre + Immune Support, Heart Health
  Oyster    → Fibre, Vitamin B6 + Immune Support, Heart Health
```

### Lentils
```
overview.name      = "Lentils"
overview.category  = "Legumes"
keyNutrients       = [] (knowledgeFoodSlug = null — safe, no red-lentil conflation)
healthBenefits     = []
nutritionContext   = ["Lentils provide both plant protein and fibre..."]
varieties:
  Red Lentils   → label "Red", additionalNutrients: Plant Protein, Fibre, Iron, Folate
  Green Lentils → label "Green", additionalNutrients: [] (no WS0 entry yet)
  Puy Lentils   → label "Puy", additionalNutrients: []
  Beluga Lentils → label "Beluga", additionalNutrients: []
```

### Grilled Tomatoes
```
buildFoodReport("grilled-tomatoes") → null ✓
isCanonicalFood("grilled-tomatoes") → false ✓
```
Preparation. Never a food. Cooking notes live in `nutritionContext` of the base tomato.

### Mixed Beans
```
buildFoodReport("mixed-beans") → null ✓
```
Multi-food container. Not a canonical food. No Food Report.

---

## SECTION 6 — Validation results

### WS2A identity authority preserved
```
validateCanonicalSeed() → 0 problems
  - 27 diversity groups (0 dangling FKs, 0 duplicates)
  - 28 canonical foods (0 dangling FKs, 0 duplicates)
  - 14 varieties (0 dangling FKs, 0 duplicates)
  - 70 aliases (0 dangling alias_keys, 0 forks)
resolver conflicts → 0
```

### WS0 knowledge authority preserved
```
validateKnowledgeSeed() → 0 problems
  - All food→nutrient links valid (0 dangling food slugs, 0 dangling nutrient slugs)
  - All food→benefit links valid
  - All nutrient→benefit links valid
```

### Variety knowledgeFoodSlug FK integrity
All 5 non-null variety knowledgeFoodSlugs point to real WS0 foods:
- `button-mushroom` → `white-mushrooms` ✓
- `chestnut-mushroom` → `chestnut-mushrooms` ✓
- `shiitake-mushroom` → `shiitake-mushrooms` ✓
- `oyster-mushroom` → `oyster-mushrooms` ✓
- `red-lentil` → `red-lentils` ✓

### Test summary
```
npm run test:food-report        → 89 passed, 0 failed
npm run test:variety-surfacing  → 36 passed, 0 failed (unchanged)
npm run test:canonical-food     → 42 passed pure, 4 DB skips (DB behind seed — expected)
```

The 4 DB skips in `test:canonical-food` are expected: WS2F adds 2 canonical foods, 2
diversity groups, 4 lentil varieties and 7 aliases to the seed. The DB counts reflect
the pre-WS2F state. Running `npm run seed:canonical` would bring the DB into alignment.
Pure (non-DB) checks are all ✓.

---

## SECTION 7 — Trust check

**Could knowledge diverge?**
No. The adapter reads through a single seam: `canonical_food.knowledgeFoodSlug → WS0`.
Every nutrient and benefit is sourced from WS0 only; there is no second editorial
path. The `NUTRITION_CONTEXT` seed is a separate slot (context, not nutrients/benefits)
and is keyed by canonical slug with referential-integrity checks in the test.

**Could variety knowledge contradict parent knowledge?**
No by construction. The deduplication is exact-set: `additionalNutrients` filters out
any nutrient slug already in `parentNutrientSlugs` before display-name resolution.
A nutrient that appears in both parent and variety can only show once — in the parent.

**Could preparations accidentally become foods?**
No. The preparation guard is structural: `buildFoodReport` returns null for any slug
not in `CANONICAL_SEED`. Preparations are aliases (form) on canonical foods, not
canonical foods themselves, so they can never be passed to `buildFoodReport` and get
a report. "Grilled Tomatoes" and "Roasted Peppers" are not in `CANONICAL_SEED` →
null ✓. "Mixed Beans" is not in `CANONICAL_SEED` → null ✓.

**Could the generic "lentils" conflate with red-lentils nutrition?**
No. The canonical `lentils` food has `knowledgeFoodSlug: null`, so
`buildFoodReport("lentils").keyNutrients` returns `[]`. Red Lentil variety knowledge
(from WS0 `red-lentils`) is surfaced only on the Red Lentil variety, clearly labelled.
No user would see "Lentils has: Plant Protein" — they would see "Red Lentils (additional): Plant Protein".

---

## SECTION 8 — Data impact

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (WS2A canonical seed, WS0 knowledge seed, WS2B variety.ts) |
| Writes new data? | **YES** — two new canonical foods (spinach + lentils), two diversity groups, four lentil varieties added to the WS2A editorial seed. No existing data changed. |
| Changes meaning of existing data? | **NO** |
| Requires DB migration? | **NO** — the adapter reads from the TS seed constants, not the DB. `npm run seed:canonical` will apply the new entries to the DB when run. |
| Requires backfill? | **NO** |
| Breaking change to existing tests? | **NO** — 36/36 WS2B tests pass unchanged; 42/42 pure WS2A tests pass unchanged. |

---

## SCOPE LOCK CONFIRMATION

**Implemented (approved scope):**
- ✅ `FoodReportKnowledgeAdapter` (`buildFoodReport` + `isCanonicalFood`)
- ✅ Overview (name, category, description)
- ✅ Key Nutrients (max 5, from WS0)
- ✅ Health Benefits (from WS0)
- ✅ Nutrition Context (curated, 10 foods)
- ✅ Variety knowledge (shared + per-variety additional facts)
- ✅ Preparation guard (null return for non-canonical inputs)

**NOT implemented (future workstreams):**
- Pairings
- Healthier Alternatives
- Nutrition Boost Ideas
- Gut Health breakdown
- Apple Score integration
- UI components (adapter only — display layer is separate)

---

## SUGGESTIONS (future ideas only — require approval, not implemented)

1. **Run `npm run seed:canonical`** to bring the DB in line with the seed (spinach +
   lentils + diversity groups + lentil varieties). Low risk, purely additive.

2. **Add spinach and lentils to WS2B variety display** — spinach has no varieties yet
   (nothing to surface); lentils would show Red/Green/Puy/Beluga in the report once
   the display layer is built.

3. **Build the Food Report UI component** — the adapter returns `FoodReportKnowledge`
   with all six approved sections. A `FoodReport.tsx` component consuming this type
   is the natural next step.

4. **Add Green/Puy/Beluga lentils to WS0** — currently only `red-lentils` has WS0
   data. Adding the other three would populate their variety knowledge sections.

5. **Add Spinach varieties** — baby spinach could be a form alias (as it is now) or
   a variety; a WS1.5-style editorial decision would settle this.

6. **Extend NUTRITION_CONTEXT** to more foods as editorial review capacity allows;
   transition it to a WS0 `knowledge_context` table (WS2D Stage S2) when ready.

7. **Add WS2F to the `test` master suite** (`package.json` `test` script) once the
   DB seeding stabilises so CI can run it reliably.

8. **CI slug-parity guard** (WS2E suggestion §SUGGESTION 2) — a standing check that
   all NUTRITION_CONTEXT keys and variety `knowledgeFoodSlug` values remain valid
   after any seed edit. The referential-integrity checks in `test:food-report` already
   cover this during development; the CI version would run on every PR.

---

**File location:** `docs/investigations/knowledge/WS2F_CANONICAL_FOOD_REPORT_FOUNDATION.md`
**Rollback identifier:** `rollback/pre-ws2f-food-report-foundation-20260619` → commit `e3857d6`
(`git reset --hard rollback/pre-ws2f-food-report-foundation-20260619`)
**Implementation commit:** `39a8810`
