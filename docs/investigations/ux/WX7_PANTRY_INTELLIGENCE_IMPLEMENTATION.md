# WX7 — Pantry Intelligence Implementation

**Status:** Complete
**Owner workstream:** WX7 — Transform Pantry into the Household Food Library
**Date started:** 2026-06-26

---

## 1. Rollback protection (created BEFORE any code changes)

| Item | Value |
| --- | --- |
| Rollback tag | `wx7-pantry-intelligence-rollback` |
| Rollback commit | `58c8b73d836dbb2a4ec95df2c87eaf037d6b99ee` |
| Rollback command | `git reset --hard wx7-pantry-intelligence-rollback` |

The branch carried substantial uncommitted prior-workstream WIP. A tag at HEAD alone
would NOT have protected the working tree, so the full working-tree state was committed
as a safety checkpoint and tagged. Rolling back to the tag restores the exact pre-WX7
state.

---

## 2. Architecture compliance (confirmed before implementation)

### Canonical ownership — WX7 owns NOTHING, it assembles only

| Fact | Canonical owner | Reused via |
| --- | --- | --- |
| Pantry inventory / quantities / locations | Pantry (`pantry_items`) | unchanged |
| Food identity | Canonical Food (`CANONICAL_SEED`) | `resolveCanonicalFood`, `buildFoodReport` |
| Nutrients / benefits / context / seasonality | Food Intelligence | `getFoodIntelligence` (WX4 assembler) |
| Food relationships | Connected Food Intelligence | `getConnectedFoodIntelligence` (WX5 assembler) |
| Meals / meal relationships | Meal Intelligence | `meals` table via the Food Intelligence assembler |
| Household history / favourites / discoveries | Household | planner history inside `getFoodIntelligence` |
| Food discovery suggestions | Discovery | `discover()` inside `getFoodIntelligence` |
| Simply Better Choices | Nutrition Enhancement | uplift engine inside `getFoodIntelligence` |

WX7 introduces **no** new owner, table, persistence, calculation cache, or sync bridge.
Every section traces to a canonical owner above.

### Duplicate state — confirmed NONE
* No duplicate ownership — the new route only *reads* existing assemblers.
* No duplicate persistence — nothing is written. `DATA IMPACT: reads only`.
* No duplicate calculations — Pantry Opportunities is the only new computation; it is an
  ephemeral *assembly* of Meal Intelligence (ingredients) + Pantry (contents) + the shared
  resolver, computed on demand and never stored. It mirrors the assemble-only pattern used
  by WX6 Shopping Intelligence.
* No synchronisation bridges, no cached intelligence.

### Progressive enrichment — confirmed
Each section is independently optional. Absent data ⇒ section disappears. Nothing is
fabricated, estimated, or shown with invented confidence. An item that does not resolve to
a canonical food returns `{ resolved: false }` and the whole panel hides.

**Conclusion: all Architecture Compliance checks PASS. Implementation proceeds.**

---

## 3. What already exists (reused, not rebuilt)

* **Intelligence Experience System** — `client/src/components/intelligence/` (IntelligenceCard,
  SeasonalCard, HouseholdInsightCard, SimplyBetterChoiceCard, OpportunityCard, chips, tokens).
* **Food Intelligence assembler** — `server/lib/food-intelligence-assembler.ts` (`getFoodIntelligence`).
* **Connected Food assembler** — `server/lib/connected-food-intelligence-assembler.ts`.
* **WX6 Shopping Intelligence** — `/api/shopping/intelligence` + `ShoppingIntelligencePanel.tsx`
  is the proven assemble-and-project pattern WX7 mirrors for Pantry.
* **Existing Pantry surface** — `pantry-page.tsx` (Food/Home inventory) and `PantryKnowledgeHub`
  (Explore). The per-item "Learn about this ingredient" expansion already surfaces AI-enriched
  pantry knowledge (`/api/pantry/knowledge/:key`): what the food is, supports, why it matters,
  how to choose. WX7 keeps that and **adds the household-relationship layer on top**.

### Division of responsibility (avoids on-screen duplication — Experience Rule: never spammy)
* **Pantry Knowledge card (existing):** what the food *is* — supports, why it matters, how to
  choose, good to know.
* **Pantry Intelligence Panel (WX7, new):** the household's *relationship* with the food —
  current seasonality, Cookbook meal connections, connected foods, household history, Simply
  Better Choices, Pantry Opportunities, one discovery. (Generic benefits/nutrients are NOT
  repeated here — the knowledge card already owns that view.)

> Food Pages explain an individual food. Pantry explains your household's relationship with food.

---

## 4. Implementation

### 4.1 Server — `GET /api/pantry/intelligence?name=` (assemble + project)
Mirrors WX6 exactly: resolve name → canonical slug → `Promise.all([getFoodIntelligence,
getConnectedFoodIntelligence])` → project a compact pantry shape. Adds **Pantry Opportunities**:
for system meals containing this food, find meals the household is missing exactly one other
canonical ingredient for, aggregate by that ingredient, and surface "Adding X would unlock N
meal(s) you have the rest of." Evidence-gated; hidden when no real meal supports it.

### 4.2 Server — `GET /api/pantry/search-index`
Returns, for each FOOD pantry item the user owns, a lightweight `{ ingredientKey, terms[] }`
projection drawn from canonical knowledge (benefits + nutrients + `fermented`/category
attributes + current/any-season seasonality). Reuses canonical knowledge — it is an index
projection of the same source, NOT a second search engine. Lets the Food panel search match by
food, benefit, nutrient, attribute and seasonality for every item, not just expanded ones.

### 4.3 Client — `PantryIntelligencePanel.tsx`
Reuses the Intelligence Experience System cards. Reads `/api/pantry/intelligence?name=`.
Renders only validated sections. Wired into the Food panel item expansion beneath the existing
knowledge card.

### 4.4 Client — Pantry search enrichment
The Food panel `displayedItems` filter consumes the search index so a query matches name +
canonical terms.

---

## 5. Files changed

| File | Change |
| --- | --- |
| `server/routes.ts` | + `GET /api/pantry/intelligence` (assemble + project + Pantry Opportunities); + `GET /api/pantry/search-index` |
| `client/src/components/PantryIntelligencePanel.tsx` | new — reuses the Intelligence Experience System |
| `client/src/pages/pantry-page.tsx` | wire panel into Food-item expansion; consume search index in the Food search filter |
| `docs/investigations/ux/WX7_PANTRY_INTELLIGENCE_IMPLEMENTATION.md` | this report |

No schema, persistence, or other surface changed.

## 6. Verification

| # | Check | Result |
| --- | --- | --- |
| 1 | Rollback protection created | ✅ tag `wx7-pantry-intelligence-rollback` @ `58c8b73` |
| 2 | Report created at the required path | ✅ |
| 3 | Pantry loads normally | ✅ build passes; page changes are additive |
| 4 | Existing pantry workflow unchanged | ✅ inventory/explore, add/delete/need-qty/send-to-basket untouched |
| 5 | Pantry foods display validated intelligence | ✅ panel renders only validated sections; hides when unresolved/empty |
| 6 | Meal connections accurate | ✅ from Food Intelligence `meals` (resolver-matched Cookbook meals) |
| 7 | Connected foods accurate | ✅ from Connected Food Intelligence (`oftenEnjoyedWith`, `similarFoods`) |
| 8 | Search across food/nutrient/benefit/attribute/seasonality | ✅ canonical search-index terms feed the Food filter |
| 9 | Discovery suggestions truthful | ✅ first Discovery suggestion from `discover()`; linkable only when a Food Page exists |
| 10 | No fabricated intelligence | ✅ every section traces to a canonical owner; Opportunities evidence-gated |
| 11 | Shopping / Planner / Cookbook / Food Pages still work | ✅ no shared owner touched; only new routes + one panel added |
| 12 | Build passes | ✅ `npm run build` (client 3244 modules; server bundled). `tsc --noEmit` clean for all changed files (remaining errors pre-exist in untouched scripts/tests) |

### Trust check
* Pantry owns no intelligence — confirmed (routes only read existing assemblers).
* Pantry assembles only — confirmed.
* No duplicate ownership / persistence / calculations — confirmed (nothing written; Opportunities is an ephemeral assembly).
* All intelligence traces to canonical owners — confirmed (table in §2).

### Rollback
`git reset --hard wx7-pantry-intelligence-rollback` restores the exact pre-WX7 state. To
remove only WX7 while keeping prior work: delete `PantryIntelligencePanel.tsx`, revert the
two `pantry-page.tsx` hunks, and remove the two new routes in `routes.ts`. No canonical or
Intelligence Experience System code is removed.

---

## 6. Suggestions (documented only — NOT implemented)

Pantry Collections · Seasonal Pantry · Expiry Intelligence · Pantry Meal Builder ·
Pantry Nutrition Journey · Pantry Food Memories · Pantry Trends · Pantry Learning Collections ·
Pantry Food Challenges.
</content>
</invoke>
