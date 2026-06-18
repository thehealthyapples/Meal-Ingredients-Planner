# WS1 — Pantry Explore V2 · Nutrition Knowledge Hub

**Status:** Implemented
**Date:** 2026-06-18
**Scope:** READ-ONLY integration of the WS0 Nutrition Knowledge Registry into the Pantry "Explore" mode.

Pantry now has two modes — **Inventory** (unchanged) and **Explore** (the Nutrition
Knowledge Hub). Explore lets users search and browse foods, nutrients and health
benefits sourced entirely from the WS0 `knowledge_*` tables, and drill between them
(food → its nutrients → other foods rich in that nutrient → benefits, etc.).

---

## Rollback protection

| Item | Value |
| --- | --- |
| **Rollback tag** | `rollback/pre-ws1-pantry-explore-v2` |
| **Rollback commit** | `83801f4` |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |

The rollback commit captures the completed WS0 state with a clean working tree, taken
**before** any WS1 code. To revert WS1 entirely:

```bash
git reset --hard rollback/pre-ws1-pantry-explore-v2
```

No data was written or migrated by WS1, so a code-level revert is a complete rollback.

---

## What this is (and is not)

- It **is** a knowledge view: search, browse, read.
- It is **not** inventory, the planner, shopping, recommendations, or canonical food
  identity. None of those systems were touched.
- It is **read-only**: no writes, no AI generation, no source ingestion, no ranking.
- Everything displayed comes from WS0 editorial data. Nothing is fabricated.
- Internal editorial signals (`source`, `evidenceStrength`, `confidence`) are stripped
  in the service display layer and never reach the client ("source hidden for now").

---

## Files changed

### Server (additive, read-only)

- **`server/services/nutrition-knowledge-registry.ts`** — appended a WS1 *display layer*
  (clearly demarcated section). New exports:
  - `searchKnowledgeRegistry(q)` — unified partial search → `{ foods, nutrients, benefits }`
  - `listFoodCategories()` — distinct categories with counts, in editorial order
  - `listFoodCards(category?)` — display-safe food list, optionally filtered
  - `getFoodDetailView(slug)` — food + benefits + nutrients (source-stripped)
  - `getNutrientDetailView(slug)` — nutrient + contributing foods + linked benefits
  - `getBenefitDetailView(slug)` — benefit + supporting foods
  - Display interfaces: `FoodCard`, `BenefitChip`, `NutrientChip`, `NutrientLite`,
    `KnowledgeSearchResult`, `FoodDetailView`, `NutrientDetailView`, `BenefitDetailView`.
  These are the **only** surface the Explore routes call; each omits internal signals.

- **`server/routes.ts`** — added six `GET /api/knowledge/*` read-only endpoints
  (and the registry import). No auth-gated user data; reference content only.

### Client

- **`client/src/components/PantryKnowledgeHub.tsx`** — new component. Search box,
  category browse, food list, and food/nutrient/benefit detail cards with an in-component
  navigation stack (Back / Explore home).
- **`client/src/pages/pantry-page.tsx`** — swapped the legacy `<PantryExplore />` (which
  read a client-side model) for `<PantryKnowledgeHub />` in Explore mode. The
  Inventory/Explore toggle itself already existed and was left unchanged.

### Not changed / not used

- `client/src/components/PantryExplore.tsx` (legacy) is now unreferenced but left in place
  to keep the change minimal and reversible. It can be deleted in a later cleanup.
- No schema, migration, seed, planner, shopping, recommendation, or canonical-identity
  files were modified.

---

## API surface (all `GET`, read-only)

| Route | Returns |
| --- | --- |
| `/api/knowledge/search?q=` | `{ query, foods[], nutrients[], benefits[] }` |
| `/api/knowledge/categories` | `[{ category, count }]` |
| `/api/knowledge/foods` | `FoodCard[]` (all active foods) |
| `/api/knowledge/foods?category=X` | `FoodCard[]` filtered to category `X` |
| `/api/knowledge/foods/:slug` | `{ food, benefits[], nutrients[] }` |
| `/api/knowledge/nutrients/:slug` | `{ nutrient, foods[], benefits[] }` |
| `/api/knowledge/benefits/:slug` | `{ benefit, foods[] }` |

---

## Search architecture

- Single unified endpoint over the three entity types. The registry loads the (small,
  ~50/30/15 row) active sets and filters in-process — case-insensitive `includes`:
  - **Foods** match on name, slug, category, subcategory, or any alias.
  - **Nutrients** match on name or slug.
  - **Benefits** match on name or slug.
- Results are returned in three labelled groups so the UI can render
  *Health Benefits → Key Nutrients → Foods* sections (mirrors the WS1 spec flow:
  `sleep → Sleep Quality`, `iron → Iron`, `pumpkin → Pumpkin Seeds`).
- The client debounces input (200 ms) and uses a single-string query key so the React
  Query default fetcher (`queryKey.join("/")`) preserves the `?q=` query string rather
  than turning it into a path segment.

## Category architecture

- Categories are **derived dynamically** from the actual WS0 food rows
  (`listFoodCategories()`), not hardcoded. Counts come from the live data, and order
  follows the editorial `displayOrder` of the first food in each category.
- This is deliberate: the WS1 brief lists aspirational categories (e.g. "Nuts",
  "Whole Grains", "Herbs & Spices") that WS0 does not yet model. Rendering the real
  categories avoids showing empty or fabricated buckets. As WS0 grows, the Hub picks up
  new categories automatically with no code change.
- Current categories: Healthy fats (6), Fruit (6), Herbs (6), Vegetables (10),
  Legumes (7), Mushrooms (4), Seeds (6), Fermented foods (6).

## WS0 integration

- The Hub reads **exclusively** through `nutrition-knowledge-registry.ts`, the WS0
  single read layer. WS1 added a display layer on top; it did not change WS0 retrieval,
  seed data, or schema.
- Benefit icons reuse the WS0 `icon` field (lucide names: `moon`, `heart`, `shield`, …),
  mapped to lucide-react components client-side.
- Nutrient/benefit links surface only display-safe fields (name, slug, optional editorial
  `amount`). `evidenceStrength` and `confidence` are dropped server-side and are never
  serialised.

## Honest "coming soon" sections

The food card shows the sections WS0 has data for — **Health Benefits**, **Key Nutrients**,
and **Nutrition Context** (real `seasonality` / `commonForms` / `storageGuidance`). The
sections WS0 does **not** yet model are rendered as muted "coming soon" placeholders rather
than fabricated content:

- Best Time (time-of-day) — no WS0 data
- Best Pairings — no WS0 data
- Things To Be Aware Of — no WS0 data
- Your Variety — depends on the future canonical identity bridge
- Meals — depends on the future canonical identity bridge

---

## Future canonical food identity bridge

WS1 deliberately does **not** implement canonical food identity. Today the Pantry Explore
layer bridges knowledge → UI purely via **`knowledge_foods.slug`**:

```
knowledge_foods.slug ──► /api/knowledge/* ──► PantryKnowledgeHub (UI)
```

The knowledge `slug` is an **editorial identifier**. It is *not* the same key used by:

- **Pantry inventory** (`pantry_items.ingredientKey` / normalised display name)
- **Shopping / ingredients** (parsed ingredient keys, product matching)
- **Nutrition boosts** and **Smart Planner** (their own ingredient identities)
- **Plant diversity** counting (canonical plant keys)

Because these identities are not yet unified, the Hub currently cannot truthfully say
"this is in your pantry", "add this to a meal", or "you've eaten this 3× this week".
Those are exactly the sections left as "coming soon" (Your Variety, Meals).

**What must change later** when one canonical food identity is introduced:

1. A mapping from `knowledge_foods.slug` → canonical food id (and from inventory /
   ingredient / planner keys → the same canonical id).
2. The detail endpoints gain optional, still read-only joins so the card can show
   "in your pantry" and "appears in N of your meals" from real user data.
3. "Broaden Your Variety" / "Your Variety" become computable against the plant-diversity
   key space.
4. Only **after** identity is unified should any "add to meal / shopping" action exist —
   and that step is a separate, explicitly-approved write feature, out of WS1 scope.

Until then, the slug bridge is intentionally one-directional and read-only.

---

## Manual tests (performed against a local dev server)

Server booted clean; migrations reported at head (`2026-06-18_ws0_knowledge_registry`).

| Test | Result |
| --- | --- |
| `GET /api/knowledge/categories` | 8 categories with correct counts ✓ |
| `search?q=sleep` | → benefit **Sleep Quality** (icon `moon`) ✓ |
| `search?q=iron` | → nutrient **Iron** ✓ |
| `search?q=pumpkin` | → food **Pumpkin Seeds** ✓ |
| `foods?category=Seeds` | 6 seeds, alpha within category ✓ |
| `foods/pumpkin-seeds` | benefits (Sleep/Heart/Immune) + nutrients (Magnesium, Zinc, Plant Protein, Iron) + context (seasonality, forms, storage) ✓ — matches the spec's EXPLORE CARD |
| `nutrients/iron` | foods: Spinach, Red Lentils, Kidney Beans, Pumpkin Seeds, Butter Beans, Chickpeas ✓ |
| `benefits/sleep-quality` | foods: Pumpkin Seeds ✓ |
| **Source-leak check** | no `source` / `evidence` / `confidence` / "THA editorial" in any payload ✓ |
| Unknown slug | returns `404` ✓ |
| `npx tsc --noEmit` (WS1 files) | no errors ✓ (pre-existing errors in unrelated test/script files only) |

### Suggested UI smoke test
1. Open `/pantry` → toggle **Explore**.
2. Type "sleep" → tap **Sleep Quality** → tap **Pumpkin Seeds** → tap **Magnesium**
   → confirm Back and "Explore" breadcrumb both work.
3. Clear search → pick category **Seeds** → open a food → confirm Health Benefits,
   Key Nutrients and Nutrition Context render and the "coming soon" sections are muted.

---

## Future extension points

- **Canonical identity bridge** (above) unlocks Your Variety / Meals / "in your pantry".
- **Timing, pairings, cautions**: add WS0 editorial fields/tables, then render in place of
  the current placeholders. No UI restructure needed — the card sections already exist.
- **Nutrient/benefit landing pages**: the detail views are already routable building blocks;
  could be promoted to first-class browse tabs.
- **Search ranking**: currently unranked membership. If the corpus grows, add a relevance
  sort (exact > prefix > alias > substring) in `searchKnowledgeRegistry`.
- **Evidence display**: when editorial policy allows, `evidenceStrength` could be surfaced —
  but only via a new explicitly-approved display helper, never by relaxing the current strip.

---

## Definition of Done — checklist

- [x] Pantry has Inventory and Explore modes
- [x] Search works (food / nutrient / benefit, partial)
- [x] Food detail cards work
- [x] Health Benefits display
- [x] Nutrients display
- [x] Nutrition Context display
- [x] Category browsing works
- [x] Read-only (no writes, no new data, no backfill)
- [x] No planner changes
- [x] No shopping changes
- [x] No recommendation engine changes
- [x] No canonical food identity changes
- [x] Source kept internal (stripped server-side)
- [x] Editorial-safe wording only; no medical claims, no fabricated certainty
- [x] Rollback protection in place and recorded
- [x] Documentation saved (this file)
