# WX5 — Connected Food Intelligence — Implementation Report

**Status:** In progress
**Date:** 2026-06-26
**Branch:** `safety/preserve-since-last-prod-20260617-1613`

---

## 1. Objective

Turn individual Food Pages into a connected food ecosystem. Every food should
naturally lead to other relevant foods, meals and knowledge — assembled from
existing canonical owners, never invented.

The deliverable is a **Connected Food Intelligence Assembler** that owns no
facts and persists nothing; it assembles validated relationships only.

---

## 2. Pre-implementation — Rollback protection

Rollback protection was created **before any code changes**.

| Item | Value |
| --- | --- |
| Rollback tag | `wx5-rollback-checkpoint` |
| Rollback object | `1630d971254ffea512113db8a11c7d57743b1fc5` |
| HEAD at start | `a8a912a4ba923e756992ed7b51e92d89ff4a7171` |

The rollback object was produced with `git stash create` so it captures **both**
the committed HEAD **and** the (large) pre-existing working-tree changes, without
disturbing the working tree. To roll back this work specifically:

```
# Inspect what WX5 added (see §7 Rollback Plan), then revert only those files.
git checkout wx5-rollback-checkpoint -- <wx5 files>
```

(The tag is a full snapshot, so a hard reset to it is **not** required and would
discard unrelated in-flight work.)

---

## 3. Architecture compliance (confirmed before implementation)

### 3.1 Canonical ownership — the assembler owns NO facts

| Concern | Canonical owner (read-only) |
| --- | --- |
| Food identity | `shared/canonical` (`buildFoodReport`, `isCanonicalFood`) |
| Food↔food relationships | `shared/relationships/food-graph` (`getFoodRelationships`) |
| Discovery | `shared/discovery/engine` (`discover`) |
| Seasonality | `shared/discovery/seasonal-map` (`seasonForDate`, `SEASON_SEED`) |
| Cookbook meals | DB `meals` (system meals) via `resolveCanonicalFood` |
| Household evidence | DB `planner_entries` / `planner_days` / `planner_weeks` |
| Nutrition enhancement | `uplift-engine` + `uplift-rules` |

The Connected Food Intelligence Assembler reads these owners and returns an
ephemeral runtime object. It defines no new persistence, no new tables, no new
calculations of fact.

### 3.2 Duplicate state — checks

- **No duplicated ownership** — every section traces back to a single canonical owner.
- **No duplicated persistence** — nothing is written; no caches, no tables.
- **No duplicated calculations** — relationships come from existing owners; the
  only derivation is **household co-occurrence counting**, which is a read-time
  aggregation over the household's own planner rows (evidence assembly, not a new
  owned fact).
- **No synchronisation layer.**
- **No graph database** — relationships are assembled per-request from the
  existing in-memory relationship graph and DB reads.

### 3.3 Progressive enrichment

Every relationship section is independently optional. Absent data returns `null`.
Nothing is fabricated. An unknown / non-canonical slug returns `food === null`
(safe 404). Relationships appear only when validated by a canonical owner.

**All Architecture Compliance checks pass.** Implementation proceeds.

---

## 4. What is being built

### 4.1 `ConnectedFoodIntelligenceAssembler`

`server/lib/connected-food-intelligence-assembler.ts`

```
getConnectedFoodIntelligence(canonicalFoodSlug, householdId?)
  → ConnectedFoodIntelligence
```

Relationship sections assembled (each validated, each capped, each independently
optional):

| Section | Source (owner) | Linkable rule |
| --- | --- | --- |
| Often Enjoyed With | `getFoodRelationships` → `often_cooked_with` | `isCanonicalFood(slug)` |
| Similar Foods | `getFoodRelationships` → `similar_to` + `same_family` | `isCanonicalFood(slug)` |
| Often Appears In | DB system `meals` containing the food | meal id → `/meals/:id` |
| Discover Next | `discover()` → varieties / broaden / cuisine | `isCanonicalFood(slug)` |
| Seasonal Connections | `getFoodRelationships` → `seasonal_with`, gated on the food being in its UK season *now* | `isCanonicalFood(slug)` |
| Household Connections | household planner co-occurrence (real evidence only) | `isCanonicalFood(slug)` |
| Simply Better Choices | uplift rules matching the food | n/a |

Every food reference is pre-resolved to `{ slug, name, reason, linkable }`, so the
UI never has to guess whether a link is safe — `linkable: false` renders a calm,
non-clickable chip (no dead ends).

### 4.2 Route

`GET /api/foods/:slug/connected` — thin wrapper; auth-gated; resolves the
caller's household; 404 when the slug is not a canonical food; never writes.

### 4.3 Food Page integration

`client/src/pages/food-detail-page.tsx` gains a single new
`ConnectedFoodPanel` section ("Explore connected foods") that renders the
relationship web as clearly-labelled, clickable chips and related meals, using
the existing WX2.5 Intelligence Experience System.

To avoid showing the same chips twice (Experience Rule: never spammy), the
pre-existing inline "Discover" block on the page stops rendering its `similar`
and `cook_with` sub-sections — those lateral relationships are now presented as
first-class, labelled relationship sections in the Connected panel. The Discover
block keeps the forward-exploration sub-sections (varieties / broaden / cuisine /
seasonal). No other page behaviour changes.

---

## 5. Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | YES |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |

---

## 6. Manual verification

| # | Check | Result |
| --- | --- | --- |
| 1 | Rollback protection created | ✅ tag `wx5-rollback-checkpoint` → `1630d971…` (captures HEAD + working tree) |
| 2 | Report created | ✅ this file |
| 3 | Food pages still load normally | ✅ build passes; page unchanged except additive panel + Discover filter |
| 4 | Related foods only display when validated | ✅ each link carries server `linkable`; sections null when empty |
| 5 | Related meals link correctly | ✅ existing Meals section (`/meals/:id`) unchanged; assembler `oftenAppearsIn` mirrors it |
| 6 | Discovery suggestions remain truthful | ✅ sourced from `discover()`; trust guard unchanged |
| 7 | Household connections use real evidence | ✅ only co-occurrence from the household's own planner rows; `times ≥ 1` |
| 8 | No dead links | ✅ non-`linkable` foods render as calm, non-clickable chips |
| 9 | Unknown foods fail safely | ✅ smoke test: `not-a-real-food-xyz` → `food: null`, every section null, route 404 |
| 10 | Home / Planner / Cookbook behaviour unchanged | ✅ no files in those surfaces touched |
| 11 | Build passes | ✅ `npm run build` succeeds (client + server) |

**Smoke test (canonical owners read by the assembler):**

```
Tomato → Often enjoyed with: Basil, Mozzarella, Garlic, Onion, Olive Oil, Oregano  (all linkable)
        Similar foods:       Pepper, Aubergine, Cucumber, Olives
Spinach → Similar foods:     Kale, Watercress, Rocket, Lettuce, Chard
not-a-real-food-xyz → canonical=false, nothing surfaced
```

These match the spec's worked examples (Tomato → Basil/Olive Oil/Mozzarella/Garlic;
Spinach → Kale/Chard). Pre-existing TypeScript errors in three untouched test
files (`test-household-vegan-vegetarian-hard-enforcement`, `test-slot-filling-recovery`,
`test-tier4-shell-recovery-activation`) are present at the rollback checkpoint and
are unrelated to this work; the build (which does not typecheck those tests) passes.

---

## 7. Rollback plan

Remove only:

- `server/lib/connected-food-intelligence-assembler.ts`
- The `GET /api/foods/:slug/connected` route block in `server/routes.ts`
- `client/src/components/intelligence/ConnectedFoodPanel.tsx` (+ its export)
- The Connected panel wiring and the Discover-filter change in
  `client/src/pages/food-detail-page.tsx`

Do **not** remove Food Intelligence Pages, Meal/Home/Planner Intelligence, the
Intelligence Experience System, or Canonical Food systems.

---

## 8. Outcome

**Complete.** The Connected Food Intelligence layer exists and the Food Page now
opens into a navigable food ecosystem.

Files added:

- `server/lib/connected-food-intelligence-assembler.ts` — the assembler (owns
  nothing; reads canonical owners; returns the seven relationship sections).
- `client/src/components/intelligence/ConnectedFoodPanel.tsx` — the lateral
  food-web section for the Food Page (exported from `intelligence/index.ts`).

Files changed:

- `server/routes.ts` — added `GET /api/foods/:slug/connected` (auth-gated, 404 on
  non-canonical, read-only).
- `client/src/pages/food-detail-page.tsx` — renders `<ConnectedFoodPanel>` and
  drops the now-duplicated `similar` / `cook_with` sub-sections from the inline
  Discover block (those are now first-class labelled relationship sections).

### Definition of Done

- ✅ Connected Food Intelligence Assembler exists.
- ✅ Food Pages display connected relationships (clickable where validated).
- ✅ All relationships come from existing canonical owners.
- ✅ Missing relationships disappear; unknown foods fail safely.
- ✅ Existing Food Pages continue working.
- ✅ No schema changes, no persistence changes.
- ✅ Build passes.
- ✅ Project report completed.

### Scope lock honoured

Only Connected Food Intelligence was implemented. No Shopping Intelligence, no
Pantry Intelligence, no redesign of Home / Planner / Cookbook, no new persistence.

---

## 9. Suggestions (documented only — NOT implemented)

Future opportunities to deepen the ecosystem, deliberately left for later:

- Benefit Pages and Nutrient Pages (make benefits/nutrients first-class navigable nodes).
- Seasonal Collections and "People who enjoy…" collections.
- Food Journey Timeline and Household Food Journey.
- Recipe Discovery Collections and Learning Collections.
- Nutrition Pathways and Smart Shopping Connections.

These would extend the Connected layer with new *views* over the same canonical
owners — none require new ownership or persistence.
</content>
</invoke>
