# DCA1 — User-Visible Data Coverage Audit

**Status:** Investigation — analysis and recommendation only. **Nothing was implemented.**
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/DCA1-user-visible-data-coverage-audit-20260714` → `f9c23c97`
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `THA_EXPERIENCE_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → PUB1 → CPI1 / CPV1.

---

## HEADLINE

**PUB1 fixed publication. It did not fix surfacing — and surfacing is now the larger gap.**

THA's **data completion is ~75%**. Its **user-visible completion is ~55%**. The 20-point
gap between what the platform *knows* and what a household can *see* is the finding of
this audit. Before PUB1 the binding constraint was that facts were not published; today
the binding constraint is that **published facts do not reach a surface**.

The clearest single illustration: **Preparation knowledge is 100% published, correctly
owned, correctly served over the wire — and rendered by exactly zero React components.**
The client's own type definition (`PantryKnowledgeHub.tsx:39-47`) silently drops the
`preparations` field the API sends it.

Two claims this audit stakes itself on, because they are the least optimistic:

1. **21 households' dietary restrictions and allergens never reach the Companion.**
   `server/storage.ts:2751` hardcodes `dietRestrictions: []` into the AI-facing household
   context. This is a safety defect, not a coverage statistic.
2. **The Founding Cookbook — THA's flagship content — has 0 images across all 500 recipes,
   nutrition on only 73, and its provenance is rendered nowhere.**

---

## METHOD

Every number below is **measured, not inferred**:

- **Data axis** — live `psql` row counts against the running database, compared to each
  domain's owner declaration. Not read from a report.
- **Visibility axis** — the full chain traced per domain: DB → route (`server/routes.ts`)
  → client fetch → **a React component that actually renders the field into JSX** →
  reachable in the router (`client/src/App.tsx`) → linked in nav (`nav-bar.tsx:40-47`).
- **Publication integrity** — `npm run verify:publication` (CPV1): 22 domains, 59 checks.

**A route existing is not visibility. A component existing is not visibility.** A field
counts as user-visible only if a component renders it on a surface a household can reach.

### The Companion is a real surface — and this audit says so

CPV1's `pd-surface` check reports *"0 client surfaces consume preparation knowledge."*
**As written, that check is wrong, and this audit corrects it.** Preparation *does* reach
households — through the Companion's LLM-composed chat text
(`pattern-intent-resolver.ts:2499` → `nutrition-knowledge-read-handler.ts:248` →
`FloatingAssistant`). The same is true of Product Knowledge.

So this audit scores visibility in **two tiers**, because they are not the same product:

- **Rendered** — a designed surface, with fields THA controls, discoverable by browsing.
- **Companion-only** — reaches the household *only* if they think to ask the right
  question, as a paraphrase THA does not control. Real, but undiscoverable.

Preparation and Product Knowledge are **Companion-only**. That is why they score low here
despite being fully published.

---

## DOMAIN-BY-DOMAIN

### 1. Foods — Canonical Food Identity · Data 100% · Visible 80%

**Visible:** Food directory at `/pantry?mode=explore` (`PantryKnowledgeHub.tsx`) — nav-reachable
via Pantry. Detail at `/foods/:slug` (`food-detail-page.tsx`) — **reachable by URL and
in-app links, but not in nav.** Renders name, category, description, seasonality,
`commonForms` ("Varieties"), benefit chips, nutrient chips.

**Published:** `canonical_food` 312/312 active · aliases 801/801 · varieties 68/68.
Knowledge-bound 256/312 (99.3% of *bindable* identities; the rest refused, not guessed).

**Missing:** No top-level "Foods" nav entry — the food directory is nested inside Pantry.
**Why:** PUB1 published the identity layer; nothing has yet promoted it to a first-class
destination.

*Not a gap:* the 295 `draft`/`catalogue` rows are the WS0.11 USDA **candidate pool** —
Stage 1 of the graduation pipeline (PKCA §1.1), awaiting human promotion. A candidate is
not an unpublished fact.

### 2. Knowledge — knowledge_foods narrative · Data 46% · Visible 45%

**Visible:** `description`, `seasonality`, `commonForms` render.

**The gap is depth, not rows.** All 610 foods are published — but the *narrative* is thin:

| Field | Coverage of 610 | Reaches user? |
|---|---:|---|
| `commonForms` | 610 (100%) | ✅ rendered |
| `description` | 264 (43%) | ✅ rendered |
| `seasonality` | 264 (43%) | ✅ rendered |
| `storageGuidance` | 264 (43%) | ❌ **served, never rendered** |
| `aliases` | — | ❌ **served, never rendered** |
| `imageUrl` | **0 (0%)** | ❌ no data at all |

**Why:** `storageGuidance` and `aliases` are in the API payload *and* in the client's own
type (`PantryKnowledgeHub.tsx:42-43`) — they are simply never referenced in JSX. The work
to surface them is display-layer only; the data is already there.

Also dead: the legacy `food_knowledge` store's `nutrientSnapshot` (computed
`routes.ts:10440`, never rendered), and `/api/food-knowledge` list/search — **zero client
consumers**.

### 3. Benefits · Data 100% · Visible 80%

**Visible:** benefit chips on foods, `BenefitExplorer` on the Nutrition page's Nutrients
tab, and `/foods/:slug`. 15 health benefits · 1,366 food-benefit links · 70
nutrient-benefit links. **All 610 foods carry ≥1 benefit.**

**Missing:** The tab literally **labelled "Benefits"** on the nav-reachable Nutrition page
is a hard-coded **"Coming soon" placeholder** (`plant-diversity-page.tsx:104-136`) — as is
"Suggestions" (`:139-183`). A household clicking the one thing named after this domain
finds an empty room, while the data renders elsewhere.

### 4. Nutrients · Data 100% · Visible 85%

**Visible, and the best-surfaced domain in the platform:** nutrient chips, nutrient detail,
"Key nutrients" on food detail, the Plant Diversity report table, meal detail. 35 active
nutrients · 1,950 active links · **610/610 foods covered.**

**PUB1's correction is live:** the count moved 1,988 → 1,950 because 38 orphaned
`plant-protein` rows were retired. Before PUB1, households were shown a nutrient THA's own
vocabulary had removed. **The visible number went down because it was wrong.**

**Missing:** `knowledge_nutrients.family` (NK6M) has no client reader.

### 5. Preparation · Data 50% · Visible 10% ⚠️

**The starkest gap in the platform.**

**Published:** 39 methods · 420 food→preparation links · covering 214/610 foods (35%).

**Rendered by zero React components.** The API *does* send it — `preparations` is on
`FoodDetailView` (`nutrition-knowledge-registry.ts:526`) and ships on every
`GET /api/knowledge/foods/:slug`. The sole consumer's type
(`PantryKnowledgeHub.tsx:39-47`) **omits the field**, so it is parsed away and discarded.
A household sees it only by asking the Companion *"how is salmon usually prepared?"*.

**And the payload itself is hollow:** `knowledge_preparation_effects` holds **0 rows.**
The taxonomy of *how* food is prepared is published; the *nutritional consequence* of
preparing it that way — the entire reason the domain exists — was never populated.

**Why:** the domain was built owner-first and correctly (PKCA-exemplary), and then no
workstream ever claimed the display layer or the effects data.

### 6. Plant Diversity · Data 100% · Visible 70%

**Visible and nav-linked** (Nutrition). 173/173 diversity groups published — up from 52.

**Missing: the headline number is still not the canonical one.** THA now has **two rival
plant counters shown to the same household**:

| Surface | Counts by | Canonical? |
|---|---|---|
| Home, Planner (`/api/home/intelligence`) | `plantDiversityGroup()` → `diversity_group` | ✅ — PUB1 fixed this |
| **Nutrition page "N / 30" ring** (`PlantDiversityReport.tsx:256-264`) | client-side string normalisation | ❌ **over-counts** |
| `household-nutrition-assembler.ts:184`, `nutrition-centre-assembler.ts:151` | canonical slug, not group | ❌ over-counts |

PUB1 converged Home and Planner (a week of kale/cavolo nero/curly kale now reads 3 plants,
not 6). **The flagship 30-plants ring on the page named after this domain was not
converged** and still tells households they have eaten more plants than they have.

### 7. Cookbook · Data 60% · Visible 55% ⚠️

**Visible and nav-linked.** All 500 Founding Cookbook recipes are browsable by default
(grouped as "Wholefood Suggestions"), with full method text.

**Missing — and this is THA's flagship content:**

| Field | Coverage of 500 |
|---|---|
| `instructions` | **500/500** ✅ |
| `image_url` | **0/500** ❌ |
| `nutrition` row | **73/500 (15%)** ❌ |
| `attribution_text` / `licence_ref` | **0/500** ❌ |

**Why zero images — two compounding causes:**
1. The source JSON (`data/cookbook/.../batches/*.json`) has **no image field at all.** The
   recipes were never authored with images.
2. `seed-ready-meals.ts:29-30` sets `imageUrl: null` on **every system meal at every boot**
   — so even if images were added, the next boot would erase them.

The consequence is compounding: an **image-first sort** (`meals-page.tsx:3340`) then sinks
all 500 founding recipes *below every user meal that has a photo*. THA's best content is
both unillustrated and ranked last.

**Provenance is served but rendered nowhere** — `attributionText`, `licenceRef`,
`acquisitionSourceKey` have **zero references in `client/src`**. Related exposure: **163
meals persist under forbidden/unlicensed source keys** (`bbcgoodfood` ×156, `allrecipes` ×7).

### 8. Planner · Data 70% · Visible 75%

**Visible and nav-linked**, healthy and live: 1,068 weeks · 7,476 days · 2,391 entries.

**Missing:**
- **Meal templates are 96% hollow.** 1,316 rows, but only **55 carry shell structure** —
  the other 1,261 are boot-job stubs, not owner-published templates.
- `weeklyProgress.{mealsPlanned, daysWithMeals}` is computed server-side via an **N+1 walk
  over every day → entry → meal** (`routes.ts:11428-11450`) and then **discarded** — it
  appears in `PlannerIntelligenceStrip`'s type and is never read.
- The client **mints a rule identity that does not exist on the server**:
  `weekly-planner-page.tsx` stamps `fallback-deterministic-boosts` into a server-owned
  projection (8 rows carry it). Households see boosts attributed to a rule THA never wrote.
- The retired `meal_plans` store still holds 13/150 rows and is **still written at boot**.

### 9. Pantry · Data 13% · Visible 13% ⚠️

**The item list works** (28,978 items, nav-linked). **The knowledge behind it barely exists.**

- `pantry_ingredient_knowledge`: **50 rows**, covering **32 of 247** distinct ingredient
  keys households actually have → **13% coverage**. (`highlights` on only 18 of the 50.)
- So **~87% of pantry row-expands return `null`**, then fire a **fire-and-forget OpenAI
  enrichment whose result the user never sees in that session** (`routes.ts:7751-7764`).

**Why:** the surface was built before the knowledge was. This is the one domain where the
*data*, not the display layer, is the binding constraint — the UI is ready and starved.

### 10. Shopping · Data 90% · Visible 55%

**The intelligence is stranded on a page the nav no longer points at.**

- Nav → `/shopping-workspace` (`ShoppingWorkspacePage`): renders items and store
  categories. It does **not** fetch `shopping_list_extras` and does **not** mount
  `ShoppingIntelligencePanel`.
- **`shopping_list_extras` (377 rows) and the entire `ShoppingIntelligencePanel` render
  only on `/basket`** (`ShoppingListPage`) — **which is not in nav.**
- And `/shopping-list` + `/list` **actively redirect** (`App.tsx:289-290`) *away* from the
  page that has the intelligence, to the one that lacks it.

The shopping list itself is healthy: 1,318 items, 100% categorised.

### 11. Companion · Data 75% · Visible 60% ⚠️

**Globally visible** — `FloatingAssistant` is mounted on every authenticated page. Live:
14,670 conversation turns, 456 opportunity deliveries.

**Missing — the most serious finding in this audit:**

> **Dietary restrictions and allergens never reach the AI.**
> `server/storage.ts:2751` hardcodes `dietRestrictions: []` into the AI-facing household
> context. **21 users carry live restrictions the Companion has never once seen.**

This is not a coverage percentage. A Companion that cannot see an allergen can recommend a
meal containing it. It is compounded by the domain having **three rival owners** for the
same fact (`users.diet_pattern` / `user_preferences.diet_types` /
`household_eaters.default_diet_types`), bridged by the platform's only **self-confessed
permanent synchronisation bridge** — which `ARCHITECTURE_PRINCIPLES.md` Principle 7 forbids.

**Also missing:**
- **6 of 24 capabilities are gated out of guidance.** `CAPABILITY_DOMAIN`
  (`companion-guidance.ts:75`) has 18 entries and is used as a hard filter (`:145`). Four
  of the six excluded are ordinary **user-role** capabilities — `product-knowledge`,
  `food-intelligence`, `opportunity-delivery`, `evidence-learning`. They remain *executable*
  on direct ask but **can never be offered** as a follow-up chip or cited as a source.
  Silently undiscoverable. (`administration`/`developer` are excluded correctly.)
- **The platform learns nothing.** 4 learning signals exist, **0 are confirmed** — and the
  Decision Engine reads only confirmed signals, so learning contributes an **empty set**.

### 12. Product Knowledge · Data 90% · Visible 30%

**Built, published, and almost entirely unreachable by design.**

`docs/product/` **exists and is substantial** — 154 entries tiered 27 public / 69 household
/ 51 admin / 7 developer, with a read port, a registered capability, and intent routes
bound at boot.

> ⚠️ **`docs/architecture/README.md` is stale on this point.** It states the registry is
> *"defined here and populated nowhere: `docs/product/` does not exist."* It does exist and
> is populated. The governing index is out of date with the platform it governs.

**Missing:**
- **Zero HTTP API. Zero React components.** No surface renders it.
- It is **Companion-only** — *and* it is one of the four user-role capabilities **gated out
  of guidance** (§11), so the Companion can answer about it but can never *offer* to.
- The publication and verification generators are **not wired to any npm script** —
  currency rests on human discipline alone, in the one domain (per PKCA Rule KC14) where
  **staleness is the whole risk** and a stale entry is indistinguishable from a fresh one.

---

## THE TABLE

**Before** = state immediately prior to PUB1 (2026-07-14). **Now** = measured today.
**Target** = the domain's own completion criterion.

Each cell is **data % / user-visible %**.

| Domain | Before | Now | Target |
|---|---|---|---|
| Foods | 17% / 20% | **100% / 80%** | 100% / 100% |
| Knowledge | 46% / 45% | **46% / 45%** | 100% / 100% |
| Benefits | 100% / 80% | **100% / 80%** | 100% / 100% |
| Nutrients | 95%\* / 75%\* | **100% / 85%** | 100% / 100% |
| Preparation | 50% / 10% | **50% / 10%** | 100% / 100% |
| Plant Diversity | 30% / 25% | **100% / 70%** | 100% / 100% |
| Cookbook | 60% / 55% | **60% / 55%** | 100% / 100% |
| Planner | 70% / 75% | **70% / 75%** | 100% / 100% |
| Pantry | 13% / 13% | **13% / 13%** | 100% / 100% |
| Shopping | 90% / 55% | **90% / 55%** | 100% / 100% |
| Companion | 75% / 60% | **75% / 60%** | 100% / 100% |
| Product Knowledge | 90% / 30% | **90% / 30%** | 100% / 100% |

\* Nutrients "before" was 1,988 rows *including 38 orphaned `plant-protein` rows* — the
data was not merely incomplete, it was **wrong**, and households were shown a retired
nutrient. PUB1 corrected it to 1,950.

**PUB1 moved exactly three domains** (Foods, Plant Diversity, Nutrients). Every other row
is unchanged — which is the honest reading: **PUB1 did what it said it did, and nothing
else has moved.**

---

## OVERALL COMPLETION

| Measure | Before PUB1 | **Now** | Target |
|---|---|---|---|
| **Platform data completion** | 61% | **≈ 75%** | 100% |
| **User-visible completion** | 45% | **≈ 55%** | 100% |
| **Knows-but-does-not-show gap** | 16 pts | **≈ 20 pts** | 0 |

*(Unweighted mean across the 12 domains. The per-domain counts above are exact and
measured; the percentages are judgement-weighted from them, and are stated so the reader
can re-derive them rather than trust them.)*

**The gap widened.** PUB1 raised data completion by ~14 points and user-visible completion
by only ~10, because publishing a fact does not surface it. **THA's constraint has moved
from publication to surfacing** — and that is the single most important sentence in this
audit.

---

## TOP REMAINING DATA GAPS

Ranked by harm to the household, not by size.

| # | Gap | Evidence | Why it matters |
|---|---|---|---|
| **1** | **Allergens/restrictions never reach the AI** | `storage.ts:2751` hardcodes `dietRestrictions: []`; **21 users affected** | **Safety.** The Companion can recommend a meal containing a household's allergen. Not a percentage — a defect. |
| **2** | **Pantry knowledge 13%** | 32 of 247 real ingredient keys | ~87% of pantry expands return empty. The UI is built and starved. |
| **3** | **Cookbook: 0/500 images, 73/500 nutrition, 0 provenance** | source JSON has no image field; `seed-ready-meals.ts:29` re-nulls at every boot | THA's flagship content is unillustrated, and an image-first sort ranks it below everything. |
| **4** | **Preparation: 0 rendered surfaces; effects table empty** | client type drops the field; `knowledge_preparation_effects` = **0 rows** | 100% published, ~0% seen. The domain's whole payload was never written. |
| **5** | **Shopping intelligence stranded off-nav** | extras (377 rows) + panel render only on `/basket`; `/shopping-list` redirects away | Built, working, and unreachable by navigation. |
| **6** | **Plant-diversity headline ring is non-canonical** | `PlantDiversityReport.tsx:256-264` | The flagship 30-plants number still over-counts, on the page named after the domain. |
| **7** | **Meal templates 96% hollow** | 55 of 1,316 carry shell structure | The planner's template intelligence rests on 55 real rows. |
| **8** | **Knowledge narrative 43% deep** | `storageGuidance` served, never rendered | Display-layer only — the data is already on the wire. |
| **9** | **Product Knowledge: no surface, gated out of guidance** | 154 entries, 0 components, absent from `CAPABILITY_DOMAIN` | Fully built, effectively invisible; currency unenforced. |
| **10** | **The platform learns nothing** | 4 signals, **0 confirmed** | The Decision Engine reads an empty set. |
| **11** | **"Benefits" and "Suggestions" tabs are placeholders** | `plant-diversity-page.tsx:104-183` | Nav-reachable "Coming soon" cards while the data renders elsewhere. |
| **12** | **163 meals under unlicensed source keys** | `bbcgoodfood` ×156, `allrecipes` ×7 | Licensing exposure, pre-soft-launch. |

---

## RECOMMENDED NEXT WORKSTREAM

### `SURF1` — Canonical Knowledge Surfacing

**Rationale.** THA has spent its recent workstreams making facts *true* (CPI1 → CPV1 →
PUB1). They now are. The measured 20-point gap says the next unit of value is not another
fact — it is **making the facts THA already owns reach the household.** Gaps 4, 5, 8, 9 and
11 are all display-layer work over data that is *already published and already on the wire*:
the cheapest user-visible gain available.

Proposed sequence:

- **W0 — Household Safety (do this first, and separately).** Restore
  `dietRestrictions` to the AI-facing household context and resolve the three-owner diet
  contest. **This should not wait for the rest of SURF1, and should not be bundled with it**
  — it is a safety fix with a different risk profile and deserves its own review. If only
  one thing is done from this audit, it is this.
- **W1 — Surface what is already served.** Render `preparations`, `storageGuidance` and
  `aliases` (all already in the payload); replace the two "Coming soon" tabs; add
  `CAPABILITY_DOMAIN` entries for the four user-role capabilities so they can be *offered*.
- **W2 — Converge the plant counter.** Make the Nutrition-page ring and the two remaining
  assemblers dedupe on `plantDiversityGroup()`, closing PUB1's known gap #2.
- **W3 — Fill the starved stores.** Pantry knowledge 13% → target; preparation *effects*
  0 rows → populated; cookbook imagery + nutrition (and stop `seed-ready-meals` nulling
  images it does not own).
- **W4 — Fix shopping navigation.** Put the extras and the intelligence panel on the page
  the nav actually points at.

**Explicitly out of scope for SURF1** (each is its own item, per CPI1/PUB1):
the `ws011-usda-ingestion` second writer, the boot-time writers, the meal-template bridge,
and the 163 unlicensed meal rows.

**Also recommended, cheaply:** correct `docs/architecture/README.md`, which still declares
`docs/product/` non-existent. The governing index should not be stale about the registry
whose entire purpose is to not be stale.

---

## GOVERNANCE

**Nothing was implemented.** No source file, seed, migration, or database row was modified
by this work. The rollback tag anchors committed state only; the working tree was already
dirty on arrival (uncommitted PUB1-adjacent work by another session), and this audit
**did not touch, commit, or revert any of it**.

`npm run verify:publication` was **run, not modified**: 22 domains · 59 checks · 22 passed
· 24 warned · 13 failed · 6 domains in publication failure. This audit introduced no
check, no failure, and no fix.

**This audit corrects one governing document by observation, and changes neither:** CPV1's
`pd-surface` check asserts *"0 client surfaces consume preparation knowledge"* — true of
React components, **false of the Companion**, which does surface it. The check's wording
should be narrowed to *"0 designed client surfaces"* rather than the platform concluding
the knowledge is unreachable. Filed here as a finding for the check's owner; **not changed
by this investigation.**

---

*Investigation only. 2026-07-14. Recommends `SURF1`; implements nothing.*
