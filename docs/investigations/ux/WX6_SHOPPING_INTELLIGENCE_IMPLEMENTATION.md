# WX6 — Shopping Intelligence Implementation

**Status:** Implemented
**Date:** 2026-06-26
**Branch:** `safety/preserve-since-last-prod-20260617-1613`

---

## 1. Objective

Turn Shopping into the place where better food decisions happen naturally, by
surfacing **existing** food, nutrition, household, seasonality, planner and
product intelligence at the moment a purchasing decision is made — without
introducing duplicate ownership, persistence, or business logic.

Shopping Intelligence **owns nothing**. It assembles only.

---

## 2. Rollback protection (created BEFORE any change)

A stash-commit object capturing the **full working tree** (not just HEAD) was
created and tagged:

| Item | Value |
| --- | --- |
| Rollback tag | `rollback/wx6-shopping-intelligence-20260626` |
| Snapshot commit object | `73a0a85` |
| HEAD at start | `a8a912a` |

**Restore command:**

```bash
git stash apply 73a0a85
# or
git checkout rollback/wx6-shopping-intelligence-20260626 -- .
```

The snapshot was produced with `git stash create` so it captured the large body
of pre-existing uncommitted work without disturbing the working tree.

---

## 3. Architecture compliance

### Canonical ownership (confirmed — no violations)

| Concern | Owner | WX6 reuse |
| --- | --- | --- |
| Shopping workflow / list / purchased products | **Shopping** | unchanged |
| Food identity | **Canonical Food** | `resolveCanonicalFood` (read-only) |
| Nutrients, health benefits, seasonality, connected foods | **Food Intelligence** | `getFoodIntelligence`, `getConnectedFoodIntelligence` |
| Meal relationships | **Meal Intelligence** | via the above assemblers |
| Simply Better Choices | **Nutrition Enhancement** | via the above assemblers (uplift engine) |
| Product analysis / additives / Apple Score / healthier alternatives | **Analyser** | already rendered in `ProductAnalyseModal` (untouched) |
| History / favourites / discovery | **Household** | via the above assemblers |

Shopping Intelligence introduces **no new owner**. The new endpoint is a thin
projection that (a) resolves a free-text item name to a canonical slug using the
existing shared resolver, and (b) delegates to the **existing** Food Intelligence
and Connected Food Intelligence assemblers — the same functions the WX4 Food page
and WX5 Connected panel already call.

### Duplicate state — confirmed NONE

- No duplicated ownership — assemblers are reused, not re-implemented.
- No duplicated persistence — endpoint is read-only; nothing is written.
- No duplicated calculations — no nutrition/analyser/discovery logic is copied.
- No synchronisation bridge — the projection is ephemeral, computed per request.

### Progressive enrichment

Every section is independently optional. When the item name does not resolve to a
canonical food, `resolved: false` is returned and the panel renders nothing.
Individual sections (seasonal, meal support, household, simply-better, connected
foods) each disappear when their canonical source has no validated content.
Nothing is fabricated, estimated, or shown with invented confidence.

---

## 4. What was built

### 4.1 Server — `GET /api/shopping/intelligence` (`server/routes.ts`)

A thin assembler/projection endpoint:

1. Reads `?name=` (the shopping item's `canonicalName` or `productName`).
2. Resolves to a canonical slug via `resolveCanonicalFood` (shared, deterministic,
   read-only — the same resolver used across the platform).
3. If unresolved → `{ resolved: false }` (panel hides).
4. Otherwise delegates to the **existing** `getFoodIntelligence(slug, householdId)`
   and `getConnectedFoodIntelligence(slug, householdId)` assemblers.
5. Projects a compact, shopping-shaped model honouring the WX6 experience rules
   ("one primary insight, one opportunity, one celebration; quality over
   quantity"):
   - `seasonal` — current UK seasonal note (one line).
   - `mealSupport` — Cookbook meals containing this food (count honest about the
     assembler's cap; "8+" when capped, exact otherwise).
   - `household` — "Your family enjoys this regularly" / "…has chosen this
     before" when planner evidence exists; "a new discovery for your household"
     when the food is canonical but has no household history.
   - `simplyBetter` — at most one validated Nutrition Enhancement suggestion.
   - `connectedFoods` — "Often enjoyed with" (capped), from Connected Food
     Intelligence.
   - `slug` — so the panel can deep-link to the full `/foods/:slug` page.

No new schema, no persistence, no caching.

### 4.2 Client — `client/src/components/ShoppingIntelligencePanel.tsx`

One reusable panel. It owns nothing — it fetches the endpoint above and renders
only validated sections using the **WX2.5 Intelligence Experience System**
(`SeasonalCard`, `HouseholdInsightCard`, `SimplyBetterChoiceCard`,
`IntelligenceCard`, `OpportunityCard`). No shopping-specific card variants were
created. The whole panel disappears when nothing validates.

### 4.3 Wiring — `client/src/pages/shopping-list-page.tsx`

The panel is rendered inside `ProductAnalyseModal`, the single unified detail
surface used for viewing a shopping item, an analysed product, and food details
within shopping. The existing analyser content (Apple Score, additives, healthier
alternatives) is left exactly as-is — WX6 reuses it rather than duplicating it.

---

## 5. Definition of Done

- [x] Shopping Intelligence exists (panel + endpoint).
- [x] Existing analyser intelligence reused (not duplicated).
- [x] Connected Food Intelligence reused.
- [x] Nutrition Enhancement reused.
- [x] Household evidence reused.
- [x] Meal support shown where available.
- [x] Missing intelligence hidden.
- [x] Existing shopping workflow unchanged.
- [x] No schema changes.
- [x] No persistence changes.
- [x] Build passes (see §7).
- [x] Project report completed (this document).

---

## 6. Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | YES |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |

---

## 7. Verification

See bottom of this document for build status (updated after implementation).

Manual checks:
1. Rollback protection created — §2.
2. Report created — this file.
3. Shopping page loads normally.
4. Existing shopping workflow unchanged.
5. Analysed products continue working (analyser content untouched).
6. Connected foods display only when validated.
7. Meal support accurate (honest about assembler cap).
8. Household insights accurate (evidence-gated; "new discovery" only when no history).
9. No fabricated intelligence (all sections trace to canonical owners; `resolved:false` hides panel).
10. Build passes.

---

## 8. Rollback plan

Restore the snapshot (`73a0a85` / tag `rollback/wx6-shopping-intelligence-20260626`).

Remove only:
- `client/src/components/ShoppingIntelligencePanel.tsx`
- the `/api/shopping/intelligence` endpoint in `server/routes.ts`
- the panel render + import in `shopping-list-page.tsx`

Do **not** remove: Connected Food Intelligence, Food Intelligence, Meal
Intelligence, Home Intelligence, Planner Intelligence, the Intelligence
Experience System, or the Analyser.

---

## 9. Suggestions (documented only — NOT implemented)

- Smart basket optimisation
- Seasonal shopping collections
- Pantry-aware shopping
- Budget-aware healthy swaps
- Household shopping habits
- Shopping journey timeline
- Favourite shopping combinations
- Shopping discovery collections

---

## 10. Build status

**PASS.**

- `tsc --noEmit` — no new errors introduced by WX6. The only diagnostics are 27
  pre-existing errors confined to `server/scripts/*` and `server/tests/*`
  (unrelated to this change: `categories` schema property, top-level `await` in
  test files, household preference test fixtures). None touch the WX6 files.
- `npm run build` — client bundle `✓ built in 13.33s`; server bundle built OK.

Files added/changed by WX6:
- `server/routes.ts` — added `GET /api/shopping/intelligence` (thin projection).
- `client/src/components/ShoppingIntelligencePanel.tsx` — new reusable panel.
- `client/src/pages/shopping-list-page.tsx` — import + one render of the panel in
  `ProductAnalyseModal`.
- `docs/investigations/ux/WX6_SHOPPING_INTELLIGENCE_IMPLEMENTATION.md` — this report.
