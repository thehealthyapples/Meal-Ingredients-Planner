# WS2A — Canonical Food Identity Foundations (Implementation)

> **One food. One meaning. Everywhere — without changing a single user-facing number.**
>
> This phase builds the canonical identity **spine beside** every existing system
> and validates it in **shadow mode**. Nothing user-facing changes. Plant
> Diversity, Pantry, Shopping, Planner, Boosts and the Analyser are untouched.

| | |
|---|---|
| **Implementation date** | 2026-06-18 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at start** | `df914ad` |
| **Rollback tag** | `rollback/ws2a-pre-impl-20260618` → commit `df914ad` |
| **Predecessors** | WS0 Knowledge Registry ✓ · WS1 Pantry Explore ✓ · WS1.5 Alias-vs-Variety Spike ✓ |
| **Companion docs** | [`CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md`](./CANONICAL_FOOD_IDENTITY_ARCHITECTURE.md) · [`WS1_5_ALIAS_VS_VARIETY_CLASSIFICATION_SPIKE.md`](./WS1_5_ALIAS_VS_VARIETY_CLASSIFICATION_SPIKE.md) |
| **Tests** | `npm run test:canonical-food` → **46 passed, 0 failed** |

---

## SECTION 0 — Rollback protection (completed before any implementation)

1. **Git status confirmed clean** — only untracked files were the two prior
   investigation docs; the tracked tree had no modifications.
2. **Current branch confirmed** — `safety/preserve-since-last-prod-20260617-1613`.
3. **Rollback point created** — annotated tag **`rollback/ws2a-pre-impl-20260618`**
   pointing at commit **`df914ad`**
   (`feat(pantry): WS1 Pantry Explore V2 — Nutrition Knowledge Hub (read-only)`).
4. **Reported before starting.**

**To restore:** `git reset --hard rollback/ws2a-pre-impl-20260618`
**To drop the DB layer:** `DROP TABLE canonical_food_alias, food_variety, canonical_food, diversity_group CASCADE;`
(All four tables are additive — nothing else references them.)

---

## SECTION 1 — What was built

A new additive identity layer, populated **from** the WS0 Knowledge Registry and
the WS1.5 editorial decisions, validated against the live plant-diversity counter
in shadow mode. **No existing key, slug, map, table or behaviour was modified.**

```
free text ──▶ Canonical Resolver ──▶ canonical food ──▶ (optional) variety
                                              └────────▶ diversity group
```

### Files changed (additive)

| File | Change |
|---|---|
| `shared/schema.ts` | **+109 lines appended** — 4 tables + insert schemas + types. No existing line touched. |
| `package.json` | **+2 scripts** — `seed:canonical`, `test:canonical-food`. |

### Files added

| File | Purpose |
|---|---|
| `shared/canonical/diversity-groups.ts` | `DIVERSITY_GROUP_SEED` (25 groups) |
| `shared/canonical/foods.ts` | Structured `CANONICAL_SEED` — foods + varieties + aliases |
| `shared/canonical/resolver.ts` | `resolveCanonicalFood()` + index builder (anti-fork conflict detection) |
| `shared/canonical/shadow.ts` | Shadow-mode comparison + parity reporting |
| `shared/canonical/index.ts` | Flattening, `validateCanonicalSeed()`, counts |
| `server/seeds/seed-canonical-food.ts` | Idempotent upsert seed runner |
| `server/tests/test-canonical-food.ts` | 46 checks (integrity, resolver, trust, shadow, live DB) |
| `scripts/apply-canonical-tables.ts` | Idempotent additive DDL (used instead of interactive `drizzle-kit push`) |

**Production behaviour files touched: _none._** No edits to `nutrition-variety.ts`,
`ingredient-aliases.ts`, `routes.ts`, `storage.ts`, the planner, shopping, pantry,
boosts or analyser.

---

## SECTION 2 — Schema

Four additive tables (`shared/schema.ts`). Every table carries `status` /
`is_active` so identities are **retireable, never deleted**.

### `diversity_group` — what the 30-plants counter counts ONCE
```
id · slug (UNIQUE) · display_name · description
count_as_single_plant (bool, default true) · source · is_active · created_at · updated_at
```

### `canonical_food` — the identity spine (a SUPERSET of knowledge_foods)
```
id · slug (UNIQUE) · name · category · subcategory · description
knowledge_food_slug  → knowledge_foods.slug   (nullable FK, ON DELETE SET NULL)
diversity_group_slug → diversity_group.slug   (nullable FK, ON DELETE SET NULL)
status (active|draft|merged|retired) · source · created_at · updated_at
```

### `food_variety` — named sub-kinds of ONE canonical food
```
id · canonical_food_id → canonical_food.id (NOT NULL, ON DELETE CASCADE)
slug (UNIQUE) · name · description · display_order · status · source · created_at · updated_at
```

### `canonical_food_alias` — same food, different words
```
id · canonical_food_id → canonical_food.id (NOT NULL, ON DELETE CASCADE)
alias · alias_key (UNIQUE) · alias_type · source · is_active · created_at
```

### Two structural guarantees built into the schema

1. **`canonical_food_alias.alias_key` is UNIQUE** — the *anti-fork lock*. One
   string resolves to **at most one** food, so a food can never silently split.
2. **Plant Diversity counts at `diversity_group`, not `canonical_food`** — a
   food's varieties share one group, so adding/tracking varieties can **never**
   change a plant count.

> **Note vs the brief schema.** The brief listed `canonical_food_alias(id,
> canonicalFoodId, alias, aliasType)`. We added a normalised **`alias_key`
> (UNIQUE)** alongside the human `alias`, because the uniqueness guarantee is the
> single most important integrity rule in the project (architecture doc §13).
> `slug` differs from `knowledge_food_slug` by design: canonical `tomato` ↔
> knowledge `tomatoes` — the link is the explicit FK, never an assumed match.

### How it was applied

`drizzle-kit push` is interactive (rename-vs-create prompts) and unsupported in
this environment, so the four tables were created with idempotent
`CREATE TABLE IF NOT EXISTS` DDL (`scripts/apply-canonical-tables.ts`) that
mirrors the Drizzle definitions exactly. The Drizzle schema remains the source of
truth; a future `drizzle-kit push` will see the tables already match.

---

## SECTION 3 — Seed data

Authored as **structured editorial seed** (`shared/canonical/foods.ts`) that
reads top-to-bottom (food → its varieties → its aliases), flattened into
per-table arrays by `index.ts`. Seeded **from WS0 knowledge** plus the WS1.5
classification.

**Live DB row totals after seeding (idempotent — re-running yields the same):**

| Table | Rows |
|---|---|
| `diversity_group` | **25** |
| `canonical_food` | **26** |
| `food_variety` | **10** |
| `canonical_food_alias` | **63** |

### Coverage (the proving set — deliberately NOT everything)

| Category | Canonical foods | Proves |
|---|---|---|
| Tomatoes | `tomato` | variety model + plural alias + form aliases |
| Mushrooms | `mushroom` | **one food, many varieties → one plant** (button/chestnut/shiitake/oyster) |
| Herbs | `basil`, `parsley`, `coriander`, `mint` | each counts individually; fresh/dried = aliases |
| Spices | `cumin`, `turmeric`, `cinnamon`, `ginger`, `paprika` | superset (no WS0 entry); ground/fresh = aliases; misspelling |
| Apples | `apple` | variety model + diversity group `apple` |
| Citrus | `orange`, `clementine` | **many foods, one diversity group** (`citrus`) |
| Beans | `chickpeas`, `black-beans`, `kidney-beans`, `butter-beans` | common-name aliases, form aliases |
| Seeds | `pumpkin-seeds`, `sunflower-seeds`, `chia-seeds`, `flaxseed` | singular/common-name/form aliases |
| Nuts | `walnuts`, `almonds` | singular + form aliases |
| Healthy fats | `extra-virgin-olive-oil`, `avocado` | grade aliases (EVOO/olive oil), plural |

### WS1.5 editorial decisions applied

| Decision | Encoded as |
|---|---|
| Tomato = **1 plant**; cherry / plum / heirloom = **varieties** | `tomato` canonical → diversity group `tomato`; 3 `food_variety` rows |
| Mushroom = **1 plant**; button / chestnut / shiitake / oyster = **varieties** | `mushroom` canonical → diversity group `mushroom`; 4 `food_variety` rows |
| Each herb/spice counts **individually**; fresh vs dried = **aliases** | one diversity group per herb/spice; `fresh/dried/ground X` = `alias_type = 'form'` |

`alias_type` values exercised: `singular`, `plural`, `common_name`, `misspelling`,
`form`. (`brand` is supported by the schema; none seeded this phase.)

---

## SECTION 4 — Resolver logic

`resolveCanonicalFood(text)` (`shared/canonical/resolver.ts`) is **pure and
deterministic** — it resolves against the editorial seed (the same source the DB
is seeded from), so it runs in tests and shadow mode with no DB round-trip.

**Algorithm:**
1. `normalizeIngredientKey(text)` (the shared normaliser — lowercase, strip
   diacritics/punctuation, collapse spaces).
2. Generate candidate forms in priority order: the raw normalised key, then
   plural→singular variants (so `cherry tomatoes` reaches the `cherry tomato`
   variety and `shiitake mushrooms` the `shiitake mushroom` variety).
3. Look each candidate up in a prebuilt index (`name`, `slug`, every `alias`, and
   every variety `name`/`slug`). **Exact-key, never substring.** First hit wins.
4. Return `{ canonicalSlug, varietySlug?, diversityGroupSlug, matchType,
   aliasType? }`, or an `unknown` result when nothing matches — **it never throws
   and never invents an identity.**

**The index build records conflicts.** If two different canonical foods ever
claimed the same key, `buildCanonicalIndex()` lists it and `validateCanonicalSeed()`
**refuses to seed** — the in-code mirror of the `UNIQUE(alias_key)` DB constraint.

### Worked examples (all asserted by tests)

| Input | canonical | matchType | variety | diversity group |
|---|---|---|---|---|
| `tomatoes` | `tomato` | alias (plural) | — | `tomato` |
| `cherry tomatoes` | `tomato` | variety | `cherry-tomato` | `tomato` |
| `fresh basil` | `basil` | alias (form) | — | `basil` |
| `shiitake mushrooms` | `mushroom` | variety | `shiitake-mushroom` | `mushroom` |
| `pepitas` | `pumpkin-seeds` | alias (common_name) | — | `pumpkin-seeds` |
| `EVOO` | `extra-virgin-olive-oil` | alias (common_name) | — | `olive-oil` |
| `bog roll` | — | **unknown** | — | — |

---

## SECTION 5 — Shadow mode

`shared/canonical/shadow.ts`. **Critical: this replaces nothing.** It runs the
canonical resolver **silently beside** the existing identity logic and reports
agreement. Nothing here is wired into any production surface.

The "existing identity" is reproduced faithfully from shared building blocks: it
is the **same key the live 30-plants counter uses** —
`resolveIngredientAlias(stripForMatch(raw))`, i.e. the client
`nutrition-variety` / `ingredient-reuse.normaliseForReuse` key — rebuilt in the
shared layer so shadow mode has no client dependency.

### Diagnostics (per the brief)

| Bucket | Meaning |
|---|---|
| **matched** | Resolved, and its diversity grouping agrees 1:1 with the existing key |
| **mismatch** | Resolved, but its group **merges** keys the existing logic splits (or vice-versa) |
| **unknown** | Resolver found no canonical food (normal for non-whole-foods) |
| **ambiguous** | Resolver returned >1 candidate — structurally impossible given the unique key (kept for completeness) |

`runShadowComparison(inputs)` returns counts for all four buckets plus
`existingDistinctPlants`, `canonicalDistinctPlants`, **`parityPct`**, the list of
mismatches, and the list of unknown foods.

### Parity reporting (live output)

**Parity set** (cases where canonical and the live counter already agree):
```
{ total: 10, diagnostics: { matched: 10, mismatch: 0, unknown: 0, ambiguous: 0 },
  existingDistinctPlants: 5, canonicalDistinctPlants: 5, parityPct: 100 }
```
→ **100% parity. Existing plant count == canonical plant count.**

**Mushroom set** `["shiitake mushrooms","oyster mushrooms"]` — an *expected,
surfaced divergence*:
```
existingDistinctPlants: 2   (live counter treats them as 2 distinct plants)
canonicalDistinctPlants: 1  (canonical correctly collapses both → mushroom group)
diagnostics.mismatch: 2
```
This is the **canonical layer fixing** a live over-count, surfaced honestly by
shadow mode rather than hidden. Note the direction: canonical is `1 ≤ 2` — it
**never inflates above** the existing count. Plant Diversity is **not switched**;
this delta is a reviewable input to a *future* cutover, gated on parity.

---

## SECTION 6 — Plant Diversity (unchanged)

- The current system (`client/src/lib/nutrition-variety.ts` keyword lists +
  `normaliseForReuse`) **remains the sole source of truth**. Not one line changed.
- Shadow mode **proves**: on cases the two systems are meant to agree on, the
  canonical count **equals** the current count (parity 100% on the parity set).
- Where they differ (mushroom varieties), the canonical count is **lower or
  equal**, never higher — so canonical can never inflate the 30-plants number.
- **No counting was switched.** Plant Diversity will only ever cut over behind a
  parity gate, separately, later.

---

## SECTION 7 — Parity & trust checks

The three "must be impossible" guarantees from the brief — each asserted by a
passing test:

| Trust question | Guaranteed by | Test result |
|---|---|---|
| Could **Tomatoes** become **Tomato + Cherry Tomato** and double-count? | Both resolve to diversity group `tomato`; `tomatoes` resolves to the food (never a variety). `countCanonicalPlants(tomato + 3 varieties) == 1` | ✓ |
| Could **Fresh Basil** & **Dried Basil** count separately? | Both are `alias_type='form'` → canonical `basil` → group `basil`. `count(... ) == 1` | ✓ |
| Could **Mushroom varieties** inflate Plant Diversity? | All four varieties share diversity group `mushroom`. `count(4 varieties + plural) == 1` | ✓ |

Underlying structural reasons these are *impossible*, not merely *untested*:
- **`UNIQUE(alias_key)`** + resolver conflict detection ⇒ one string → one food.
- **Counting at `diversity_group`** ⇒ varieties share a parent's group ⇒ a
  variety can never add a plant.
- **Resolver never auto-creates identities** ⇒ free text cannot fork a food.

---

## SECTION 8 — Surface-by-surface confirmation (all unchanged)

| Surface | Status | Note |
|---|---|---|
| **Plant Diversity** | unchanged | current keyword counter remains source of truth; canonical runs in shadow only |
| **Pantry Inventory** | unchanged | no column added, no read repointed |
| **Pantry Explore** | unchanged | still `knowledge_foods` → display; future bridge documented (§9) |
| **Shopping** | unchanged | no `canonical_food_id` added this phase |
| **Planner** | unchanged | `meals.ingredients` still raw `text[]` |
| **Nutrition Boosts** | unchanged | `BOOST_LIBRARY` untouched |
| **Analyser** | unchanged | extraction/UPF/Apple Score untouched |

---

## SECTION 9 — Future migration path

Per the architecture doc's additive + shadow rollout (each step independently
reversible; none in scope for WS2A):

- **Pantry/Knowledge bridge.** `canonical_food.knowledge_food_slug` already links
  the spine to WS0 editorial content. The future bridge is *Knowledge food →
  canonical food* enrichment so a Pantry Explore card can show varieties /
  diversity contribution — read-only, additive, no inventory change. The four
  mushroom knowledge foods (`white/chestnut/shiitake/oyster-mushrooms`) will map
  as varieties under the single canonical `mushroom` when that bridge is built.
- **Phase 1 — Shadow resolve (this is where we stop).** Resolver runs beside live
  logic; disagreements logged. Already demonstrated.
- **Phase 2 — Additive columns.** Nullable `canonical_food_id` on
  `user_pantry_items`, `shopping_list`, optionally a meal-ingredient projection.
  Backfill via resolver; legacy rows stay NULL = unchanged.
- **Phase 3 — Feature-by-feature cutover.** One surface at a time, behind a flag,
  lowest-risk first (Boost → Pantry Explore → Plant Diversity → Shopping →
  Analyser). **Plant Diversity switches only after shadow shows count parity.**
- **Phase 4 — Converge the old maps.** Deprecated maps delegate to the resolver;
  they need not be deleted to win.

Open items inherited from WS1.5 needing a product-owner call before any cutover:
herbs/spices diversity counting rule, citrus split (satsuma/clementine), baby
spinach variety-vs-form, `tahini` as its own food.

---

## SECTION 10 — Manual tests / how to verify

```bash
# 1. Unit + integration + shadow + trust checks (no DB needed for core; live DB checks auto-skip without DATABASE_URL)
npm run test:canonical-food          # → 46 passed, 0 failed

# 2. (Re)create the additive tables — idempotent
npx tsx scripts/apply-canonical-tables.ts

# 3. Seed (idempotent upsert; refuses to seed on any integrity violation)
npm run seed:canonical               # re-run → identical row counts (25/26/10/63)

# 4. Spot-check the resolver
npx tsx -e "import('./shared/canonical/index.js').then(m=>console.log(m.resolveCanonicalFood('cherry tomatoes')))"

# 5. Spot-check shadow parity
npx tsx -e "import('./shared/canonical/shadow.js').then(m=>console.log(m.runShadowComparison(['tomatoes','cherry tomatoes','fresh basil','dried basil'])))"
```

**Results observed:**
- All **46** checks pass (integrity, resolver, aliases, varieties, diversity
  groups, unknown handling, the 3 trust checks, shadow parity, live DB counts).
- Seed is idempotent: second run reports the same `25 / 26 / 10 / 63`.
- `tsc --noEmit`: no errors introduced by WS2A (the 26 pre-existing errors are all
  in unrelated files — `query-*` scripts, household/slot-filling tests — and are
  present on the rollback tag).

---

## SECTION 11 — Data impact

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (WS0 knowledge slugs for FK validation; live alias map mirrored read-only for shadow) |
| Writes new data? | **YES** (four new additive tables only) |
| Changes meaning of existing data? | **NO** |
| Requires backfill? | **NO** |

---

## SECTION 12 — Definition of done

| Criterion | Status |
|---|---|
| Canonical tables exist | ✓ (4 tables, live in DB) |
| Resolver exists | ✓ (`resolveCanonicalFood`) |
| Seed data exists | ✓ (25 groups / 26 foods / 10 varieties / 63 aliases) |
| Aliases work | ✓ (singular/plural/common_name/misspelling/form) |
| Varieties work | ✓ (tomato ×3, mushroom ×4, apple ×3) |
| Diversity groups work | ✓ (incl. one-food-many-varieties AND many-foods-one-group/citrus) |
| Shadow mode works | ✓ (4 diagnostics + parity %; 100% on parity set) |
| Existing systems unchanged | ✓ (no production behaviour file touched) |
| Plant Diversity unchanged | ✓ |
| Pantry unchanged | ✓ |
| Shopping unchanged | ✓ |
| Planner unchanged | ✓ |
| Boosts unchanged | ✓ |
| Analyser unchanged | ✓ |
