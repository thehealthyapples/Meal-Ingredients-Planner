# WS2F Amendment — Spinach Variety Model & Canonical DB Alignment

**Date:** 2026-06-19
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `rollback/ws2f-pre-amendment-20260619` (at commit `781dfc5`)

---

## Approved Decisions

### Decision 1 — Spinach uses the variety model

Variety matters for user recognition, exploration, diversity and food report usefulness.

- Canonical food: `spinach`
- Varieties: `baby-spinach`, `mature-spinach`
- Forms (aliases): `fresh spinach`, `frozen spinach`

Baby Spinach is NOT a simple alias. It is a variety.

### Decision 2 — Seed and DB must remain aligned

If WS2A adds canonical foods, varieties, aliases or diversity groups, the seed path
must be run and DB alignment verified. No long-running seed-only divergence.

---

## Files Changed

| File | Change |
|---|---|
| `shared/canonical/foods.ts` | Spinach: added `varieties` (baby-spinach, mature-spinach); removed `baby spinach` from aliases; kept `fresh spinach` + `frozen spinach` as form aliases |
| `server/tests/test-food-report-adapter.ts` | Updated spinach section: was asserting 0 varieties; now asserts 2 varieties (baby-spinach, mature-spinach) with correct labels and no fabricated additional nutrients |

---

## Implementation Notes

### foods.ts change (WS2A canonical seed)

Before:
```ts
{
  food: { slug: "spinach", ... },
  aliases: [
    { alias: "baby spinach", aliasType: "form" },   // WRONG: should be variety
    { alias: "fresh spinach", aliasType: "form" },
    { alias: "frozen spinach", aliasType: "form" },
  ],
}
```

After:
```ts
{
  food: { slug: "spinach", ... },
  varieties: [
    { slug: "baby-spinach", name: "Baby Spinach", displayOrder: 0 },
    { slug: "mature-spinach", name: "Mature Spinach", displayOrder: 1 },
  ],
  aliases: [
    { alias: "fresh spinach", aliasType: "form" },
    { alias: "frozen spinach", aliasType: "form" },
  ],
}
```

### Seed count delta

| Table | Before | After | Delta |
|---|---|---|---|
| varieties | 14 | 16 | +2 (baby-spinach, mature-spinach) |
| aliases | 70 | 69 | -1 (baby spinach removed from aliases) |

---

## Validation Results

### Pure tests (no DB required)

| Test suite | Result |
|---|---|
| `npm run test:canonical-food` (pure checks) | 42/42 passed |
| `npm run test:variety-surfacing` | 36/36 passed |
| `npm run test:food-report` | 94/94 passed |

- Referential integrity: 0 problems
- Resolver conflicts: 0
- Dangling FKs: 0
- Duplicate alias keys: 0

### Live DB tests (after `npm run seed:canonical`)

| Check | Result |
|---|---|
| `DB diversity_group count ≥ seed` | ✓ (db=27, seed=27) |
| `DB canonical_food count ≥ seed` | ✓ (db=28, seed=28) |
| `DB food_variety count ≥ seed` | ✓ (db=16, seed=16) |
| `DB canonical_food_alias count ≥ seed` | ✓ (db=69, seed=69) |

Full test run: **46/46 passed, 0 failed** (`test:canonical-food`)

---

## Manual Resolver Tests

| Input | canonical | variety | matchType | aliasType |
|---|---|---|---|---|
| `baby spinach` | spinach | baby-spinach | variety | — |
| `mature spinach` | spinach | mature-spinach | variety | — |
| `fresh spinach` | spinach | — | alias | form |
| `frozen spinach` | spinach | — | alias | form |
| `spinach` | spinach | — | canonical | — |
| `lentils` | lentils | — | canonical | — |
| `red lentils` | lentils | red-lentil | variety | — |
| `green lentils` | lentils | green-lentil | variety | — |
| `puy lentils` | lentils | puy-lentil | variety | — |
| `beluga lentils` | lentils | beluga-lentil | variety | — |
| `grilled tomatoes` | — | — | unknown | — |
| `mixed beans` | — | — | unknown | — |

All resolve exactly as specified in the brief.

---

## Data Impact

| Category | Impact |
|---|---|
| Reads existing data | Yes (resolver reads seed) |
| Writes new data | Yes (2 variety rows via seed:canonical) |
| Changes meaning of existing data | No |
| Requires backfill | No |
| User data modified | None |

New DB writes (idempotent upsert):
- 2 `food_variety` rows: `baby-spinach`, `mature-spinach`
- 1 `canonical_food_alias` row removed (`baby spinach` form alias)

---

## Variety Display Model

When a user has eaten baby spinach and mature spinach exists in the seed:

```
Spinach

Your Variety
✓ Baby

Broaden Your Variety
○ Mature
```

Variety knowledge: both baby-spinach and mature-spinach have `knowledgeFoodSlug: undefined`
(no WS0 link). No additional nutrients are fabricated. Varieties display with no additional
knowledge as per Part 2 of the brief.

---

## Trust Check

- Misleads users? No — varieties surfaced as variety, not nutrition claims.
- Fabricates certainty? No — variety knowledge is empty because no WS0 link exists.
- Changes plant counts? No — both varieties resolve to the same `spinach` diversity group.
  `fresh spinach + baby spinach + mature spinach + spinach` = 1 plant.

Production counting verified unchanged:
```
countCanonicalPlants(["fresh spinach", "baby spinach", "mature spinach", "frozen spinach", "spinach"]) = 1
```

---

## Scope Lock

Implemented:
- Spinach variety model (baby-spinach, mature-spinach as varieties)
- fresh/frozen spinach remain form aliases
- Canonical DB alignment (seed run, all counts match)
- Test suite updated to reflect approved model

NOT implemented (future):
- Food Report UI rendering of varieties
- Pairings, Healthier Alternatives, Nutrition Boost Ideas
- Apple Score integration
- Production plant count migration
- WS0 knowledge links for baby-spinach / mature-spinach (no nutrition data added)

---

## SUGGESTION (future, not in scope)

- If nutritional differences between baby and mature spinach are editorially established,
  `knowledgeFoodSlug` can be wired to WS0 entries for each variety without any structural
  change — the adapter already supports this pattern (see mushroom varieties).
- A resolver test for spinach varieties could be added to `test-canonical-food.ts` in a
  future WS2 iteration alongside other food-specific resolver examples.
