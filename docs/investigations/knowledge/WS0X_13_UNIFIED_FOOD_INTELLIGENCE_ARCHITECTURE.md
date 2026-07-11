# WS0X.13 — Unified Food Intelligence Architecture Investigation

**Classification:** 🟡 AMBER — Architecture investigation only. No code, schema, data, validation, or runtime changes.
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Investigation complete. No implementation.
**Governing question:** Can THA operate with **ONE** runtime Food Intelligence model built around the Canonical Food architecture — and *should* it, before WS0X.12's proposed permanent bridge is built?

---

## ROLLBACK PROTECTION (mandatory first step — confirmed before any investigation)

| Item | Value |
|------|-------|
| Committed baseline tag | `rollback/ws0x13-20260625` → `a8a912a` (*feat(ws0x7): Ingredient Resolution Engine Completeness Program*) |
| Working-tree snapshot tag | `rollback/ws0x13-worktree-20260625` → `1820e46` (a `git stash create` object capturing the full uncommitted tree: 17 modified tracked files + ~40 untracked docs/modules from in-progress WS0X.5–12) |
| Rollback to committed state | `git checkout rollback/ws0x13-20260625` |
| Restore the exact uncommitted tree | `git stash apply 1820e46` (or `git checkout rollback/ws0x13-worktree-20260625 -- .`) |
| Working tree at start | **Intentionally dirty** — pre-existing in-progress work, **not** created by this task. |
| This task's writes | **One file only** — this document. No code, schema, data, runtime, or validation touched. Revert = delete this file. |

**Why protection is sound despite a dirty tree:** the committed tag fixes the last-commit baseline; the worktree-snapshot tag captures the exact uncommitted state as a real commit object (re-appliable); and this investigation writes nothing but prose. There is no data, schema, or source change to undo.

---

## HEADLINE FINDING (read this first)

> **Yes — a single runtime Food Intelligence model built around Canonical Food is achievable, and it is the objectively better architecture. But "unified" means *one key-space and one owner per attribute*, NOT *one table*. The controlled vocabularies (nutrients, benefits) must stay as normalized reference tables beside the spine — merging them would be redesign-for-elegance, which this brief forbids.**

The decisive evidence is not theoretical. Three facts settle it:

1. **A working prototype of the unified read model already ships.** `shared/canonical/food-report-adapter.ts` (`buildFoodReport(canonicalSlug)`) already assembles identity + nutrients + benefits + context + varieties into **one object keyed on the canonical slug**, reading the knowledge store *through* the canonical spine via the `knowledgeFoodSlug` link. The unified model is not a hypothesis; it is partially built and in use.

2. **Attribute-attachment to canonical is already proven.** WS0X.5 food context (availability / peak seasons / origin region) was *merged onto `canonical_food`* at seed-build time and made the single runtime owner of that data (`shared/canonical/index.ts` folds `FOOD_CONTEXT_SEED` into each `canonical_food` insert). The pattern "an attribute that used to live elsewhere now lives on the canonical food" is established and validated.

3. **The dual-store / dual-slug architecture is already producing a silent runtime defect.** `server/services/meal-food-intelligence.ts` resolves ingredients to **knowledge** slugs (`resolveIngredientSlugs` → `knowledge_foods.slug`, e.g. `"tomatoes"`), then calls `getFoodContext(slug)` — which is keyed by **canonical** slugs (e.g. `"tomato"`). For **every food whose canonical slug differs from its knowledge slug**, food context silently resolves to `undefined`, so origin/availability never surface on Meal Detail. This is a *direct consequence* of running two slug namespaces, and it is exactly the class of bug a unified key-space removes.

The brief's question — "should the bridge exist at all?" — therefore answers itself on evidence: **the bridge (a hand-set FK across two slug namespaces) is already a defect source and a duplicated-maintenance tax. Institutionalising it permanently (WS0X.12's implicit recommendation) is the inferior path.** The recommendation below is **Option B — gradual convergence to one canonical-keyed runtime model** — with a precisely bounded scope so it is not a big-bang and not an elegance rewrite.

---

## PART 1 — CURRENT ARCHITECTURE (every food-related store mapped)

Traced from source, not from prior reports. The current shape is **three** stores, not two.

```
 ┌──────────────────── IDENTITY SPINE (superset) ────────────────────┐
 │  shared/canonical/foods.ts  CANONICAL_SEED  → canonical_food       │
 │  + food_variety + canonical_food_alias + diversity_group          │
 │  + FOOD_CONTEXT_SEED merged in at seed build (availability/        │
 │    peak_seasons/origin_region) = SINGLE owner of food context      │
 │  249 foods + 57 varieties.  KEY SPACE: canonical slug ("tomato")   │
 │  Read at runtime?  Only via food-report-adapter (reads SEED        │
 │  CONSTANTS, not the DB) + getFoodContext().  canonical_food the    │
 │  TABLE is read by seeds/tests/scripts only.                        │
 └───────────────────────────────┬───────────────────────────────────┘
                 knowledgeFoodSlug FK (hand-set, 259 set / 4 null)
                 CROSSES A SLUG NAMESPACE BOUNDARY ("tomato"→"tomatoes")
                                 │
 ┌───────────────────────────────▼───────────────────────────────────┐
 │  CONTENT STORE  shared/knowledge/* → knowledge_foods (+ links)     │
 │  knowledge_food_nutrients · knowledge_food_benefits               │
 │  + reference vocab: knowledge_nutrients (30) ·                    │
 │    knowledge_health_benefits (15) · knowledge_nutrient_benefits   │
 │  265 foods.  KEY SPACE: knowledge slug ("tomatoes")               │
 │  Read at runtime?  YES — server/services/                        │
 │  nutrition-knowledge-registry.ts is THE runtime store for         │
 │  Meal Detail · Nutrition Report · Plant Diversity · Pantry.       │
 └───────────────────────────────────────────────────────────────────┘

 ┌──────────────── RESOLVER (a THIRD identity store) ────────────────┐
 │  server/lib/item-resolver.ts ← server/data/canonical-map.json (112)│
 │  name → category/identity for cupboard, basket, recipe import.     │
 │  Its OWN "canonical" map, independent of canonical_food.           │
 │  KEY SPACE: normalized name keys. Does not consult canonical_food. │
 └───────────────────────────────────────────────────────────────────┘
```

### Per-store: who writes / reads / owns / duplicates

| Store | Writes (author) | Reads (runtime) | Owns | Duplicates |
|---|---|---|---|---|
| **Canonical Food** (`canonical_food` + variety/alias/diversity) | `shared/canonical/*` seed → `seed-canonical-food.ts` | `food-report-adapter` (via SEED constants), `getFoodContext` | Identity, aliases (anti-fork), category/subcategory, varieties, diversity group, scientific name, tier/provenance, **food context** | `category`, `subcategory`, `description` **also** held in `knowledge_foods` |
| **Knowledge Registry** (`knowledge_foods` + nutrient/benefit links) | `shared/knowledge/*` → `seed-knowledge-registry.ts` | `nutrition-knowledge-registry.ts` → all four intelligence surfaces | Nutrients, benefits, description, storage guidance, display seasonality copy | `category`, `subcategory`, `description`, `aliases` **also** held in `canonical_food`; `seasonality` copy overlaps `peakSeasons` fact |
| **Reference vocab** (`knowledge_nutrients`, `knowledge_health_benefits`, `knowledge_nutrient_benefits`) | `shared/knowledge/*` | registry + adapter | The 30-term nutrient vocab, 15-term benefit taxonomy, nutrient→benefit derivation | **None — legitimately singular reference data** |
| **Resolver map** (`canonical-map.json`) | hand-edited JSON | `item-resolver.ts` | Name→category for shopping/import resolution | "Canonical" name/category resolution **also** conceptually owned by `canonical_food` + `canonical_food_alias` |

### Per-surface ownership (the brief's checklist)

| Surface | Writes | Reads | True owner today |
|---|---|---|---|
| Canonical Food | seed | adapter/context | `canonical_food` (identity) |
| Knowledge Registry | seed | registry service | `knowledge_foods` (content) |
| Resolver | JSON | item-resolver | `canonical-map.json` (separate) |
| Promotion Pipeline | `shared/catalogue/*` | — (build-time) | writes `canonical_food` (tier=catalogue); **does not write knowledge** (the WS0X.12 broken seam) |
| Food Context | `food-context.ts` seed | `getFoodContext` + merged into `canonical_food` | `canonical_food` (single owner) |
| Meal Detail | — | `meal-food-intelligence.ts` → registry (content) + `getFoodContext` (context) | **split across both stores + both slug spaces** |
| Nutrition Report | — | registry service | `knowledge_foods` |
| Pantry Explore / Knowledge Hub | — | registry service (+ client legacy libs, see SoT register) | `knowledge_foods` |
| Discovery | `shared/discovery/*` | `discover()` | discovery engine (keyed on knowledge slug) |
| Planner / Shopping | DB | item-resolver | `canonical-map.json` + DB |

**Conclusion of Part 1:** identity facts (category, subcategory, description, aliases) are physically duplicated across `canonical_food` and `knowledge_foods`; a third identity store (`canonical-map.json`) exists for the resolver; and the runtime crosses **two slug namespaces** on every Meal Detail render.

---

## PART 2 — RESPONSIBILITY REVIEW (true owner of every property)

For each property: where it lives today, and where it *should* live under a single-spine model.

| Property | Lives today | True owner (single-spine) | Notes |
|---|---|---|---|
| Identity (slug/name) | both `canonical_food` + `knowledge_foods` | **Canonical Food** | Knowledge name is a duplicate of canonical name |
| Aliases (anti-fork) | `canonical_food_alias` (unique key) **and** `knowledge_foods.aliases[]` **and** `canonical-map.json` | **Canonical Food** | Three alias stores today; only the unique `alias_key` is anti-fork-safe |
| Scientific name | `canonical_food.scientificName` | **Canonical Food** | Already singular |
| Category / Subcategory | both `canonical_food` + `knowledge_foods` | **Canonical Food** | True duplication; can drift |
| Varieties | `food_variety` (canonical) | **Canonical Food** | Already singular |
| Nutrients (food→nutrient links) | `knowledge_food_nutrients` (keyed knowledge slug) | **Canonical Food spine, re-keyed to canonical slug** | Content stays normalized; only the *key* changes |
| Benefits (food→benefit links) | `knowledge_food_benefits` | **Canonical Food spine, re-keyed** | ~80% derivable from nutrients via `NUTRIENT_BENEFITS` |
| Nutrient vocab (30) | `knowledge_nutrients` | **Reference table (stays separate)** | NOT food data — shared taxonomy |
| Benefit taxonomy (15) | `knowledge_health_benefits` | **Reference table (stays separate)** | NOT food data |
| Nutrient→benefit derivation | `knowledge_nutrient_benefits` | **Reference table (stays separate)** | Pure derivation map |
| Description prose | both `canonical_food.description` + `knowledge_foods.description` | **Canonical Food** (adapter already prefers canonical, WS0 fallback) | Duplicated; adapter already picks a winner |
| Storage guidance | `knowledge_foods.storageGuidance` | **Canonical Food** (attach) | Single field, easy to attach |
| Seasonality — **fact** | `canonical_food.peakSeasons` | **Canonical Food** | Already declared single owner; `knowledge_foods.seasonality` is display copy only |
| Availability | `canonical_food.availability` | **Canonical Food** | Already singular |
| Stories / Discovery / Alternatives / Seasonal | `shared/{stories,discovery,alternatives,seasonal}/*` engines | **Engines (derive from spine)** | Engines are computation, not stores; should consume the spine's key |
| Resolver (name→identity) | `canonical-map.json` | **Canonical Food + alias table** | The resolver should resolve *into* the canonical spine |
| Plant Diversity grouping | `diversity_group` (canonical) | **Canonical Food** | Already singular |
| Meal Detail intelligence | computed in `meal-food-intelligence.ts` | **Derived view over the spine** | Should read one key-space, not two |

**Conclusion of Part 2:** every *food-level* property has a natural single owner in Canonical Food. The only properties that legitimately live elsewhere are the **reference vocabularies and derivation map**, which are not food data at all. This is the crux: unification is about collapsing the duplicated food-level columns and the dual key-space — not about absorbing the vocab tables.

---

## PART 3 — DUPLICATION AUDIT

| # | Duplication | Type | Why it exists | Required? | Removable? |
|---|---|---|---|---|---|
| 1 | `category` / `subcategory` in both `canonical_food` and `knowledge_foods` | Duplicate **data** | The two stores were built independently (WS0 before WS2A) | No | **Yes** — canonical becomes owner; knowledge reads through |
| 2 | `description` in both tables | Duplicate **data** | Same | No | **Yes** — adapter already prefers canonical |
| 3 | Aliases in `canonical_food_alias` + `knowledge_foods.aliases[]` + `canonical-map.json` | Duplicate **data** (×3) | Each store grew its own resolution needs | No | **Yes** — `alias_key` (unique) is the only anti-fork-safe one; others derive |
| 4 | Two slug namespaces (canonical vs knowledge), bridged by `knowledgeFoodSlug` | Duplicate **identity / responsibility** | WS0 chose plural slugs ("tomatoes"); WS2A chose singular ("tomato") | No | **Yes** — pick one key-space; this removes the FK bridge and the Part 0 defect |
| 5 | `knowledge_foods.seasonality` (copy) vs `canonical_food.peakSeasons` (fact) | Duplicate **data** (already governed) | WS0X.4 explicitly demoted the copy to display-only | Tolerated | Partially — keep copy as derived view, not authored twice |
| 6 | Resolver `canonical-map.json` vs `canonical_food` + aliases | Duplicate **responsibility** | Resolver predates the canonical spine | No | **Yes** — fold into the spine over time |
| 7 | Promotion writes canonical; runtime reads knowledge | Duplicate **workflow / promotion** | The WS0X.12 broken seam | No | **Yes under unification** — one spine means promotion and runtime target the same store |
| 8 | `validateCanonicalSeed` and `validateKnowledgeSeed` | Duplicate **validation** | Two seeds, two integrity checkers | Partly | Converges to one integrity pass over the spine + vocab |
| 9 | Editorial authoring in `shared/canonical/*` AND `shared/knowledge/*` for the same food | Duplicate **maintenance** | Two stores → two edits per food | No | **Yes** — single authoring surface per food |

**Net:** of nine duplications, **seven are removable**, one is already governed down to "display copy" (5), and one (the reference vocab) is **not duplication at all** and must be preserved. Duplications 4 and 9 are the expensive ones: the dual slug-space causes silent runtime misses (Part 0), and dual authoring doubles editorial cost at every scale tier (Part 7).

---

## PART 4 — UNIFIED MODEL FEASIBILITY

**Theoretical unified model (design only — NOT implemented):**

```
                       ┌─────────────────────────────────────┐
   REFERENCE TABLES    │        CANONICAL FOOD (spine)        │
   (stay separate,     │  key = canonical slug (ONE space)    │
    NOT food data)     │                                      │
  ┌──────────────┐     │  Identity: slug · name · scientific  │
  │ nutrients(30)│◄────┤  Classification: category · sub      │
  ├──────────────┤     │  Aliases (anti-fork unique key)      │
  │ benefits(15) │◄────┤  Varieties · diversity group         │
  ├──────────────┤     │  Context: availability · peakSeasons │
  │ nutrient→    │     │           · originRegion             │
  │  benefit map │     │  Content: description · storage       │
  └──────────────┘     │  Links → nutrients (re-keyed)        │
                       │  Links → benefits (re-keyed/derived) │
                       │  Provenance: tier · source · conf.   │
                       └──────────────────┬───────────────────┘
                                          │  ONE runtime read model
                                          ▼
                      buildFoodIntelligence(canonicalSlug)
              (generalised FoodReportKnowledgeAdapter — already exists)
                                          │
        ┌───────────────┬─────────────────┼──────────────┬───────────────┐
   Meal Detail    Nutrition Report   Plant Diversity   Pantry        Discovery/
                                                        Explore     Alternatives/Stories
```

**Is it achievable? YES.** Evidence:

- **The read model already exists** (`buildFoodReport` assembles exactly this object). Generalising it from "Food Report" to "Food Intelligence" is incremental, not greenfield.
- **The attribute-attachment pattern already exists** (food context merged onto `canonical_food`). Nutrients/benefits attach the same way: the link tables are re-keyed from knowledge slug to canonical slug.
- **Reference vocabularies stay put.** They are addressed by their own slugs and shared across all foods; nothing about unification touches them. This is what keeps the change bounded.
- **The FK bridge disappears.** Once the link tables key on canonical slug, `knowledgeFoodSlug` is no longer needed to join identity↔content — the join is identity itself.

**What "achievable" does *not* mean:** it does not mean one giant table. Nutrient and benefit links remain normalized relationship tables; vocabularies remain reference tables. "Unified" = **one food key-space + one runtime read model + one owner per food-level property.**

---

## PART 5 — PERFORMANCE REVIEW

If the runtime consumed the canonical spine directly:

| Dimension | Dual-store today | Unified spine | Verdict |
|---|---|---|---|
| Runtime joins | Meal Detail issues a content query (registry) **plus** a context lookup in a **different slug space** | One key-space; one assembly pass | **Improves** (correctness more than speed) |
| Correctness | Context silently drops whenever canonical slug ≠ knowledge slug (Part 0 defect) | No cross-namespace miss possible | **Improves materially** |
| Query count | registry + context + discovery, each resolving slugs independently | one resolution to canonical slug, reused | **Improves** |
| Data volume | identical content, duplicated identity columns | identity stored once | Marginally smaller |
| Seed/build time | two seed runners + two validators | one spine seed + vocab seed | **Improves** |
| Hot-path latency | both stores are small (≤265 rows) and largely read from in-memory seed constants | same | **Unchanged** (neither store is a latency bottleneck) |

**Conclusion:** raw latency is **unchanged** (both stores are tiny and the adapter already reads in-memory constants), but **correctness and query-clarity improve**, because the dual slug-space — the thing that *causes the silent context miss today* — is eliminated. Performance is not the argument for unification; **correctness and maintainability are.**

---

## PART 6 — MIGRATION FEASIBILITY

A unified model is possible; here is the honest cost. This is **gradual, adapter-first**, never big-bang.

| Factor | Assessment | Evidence / detail |
|---|---|---|
| **Complexity** | **Medium** | The read model and attribute-attachment patterns already exist. The work is (a) choosing one slug-space, (b) re-keying the two link tables, (c) collapsing duplicated columns, (d) repointing four read surfaces at one assembler. |
| **Backward compatibility** | **High if staged** | Keep the registry service's function signatures; change their *internals* to read the spine. Surfaces don't change. |
| **Data migration** | **Bounded** | Re-key ≤265 foods' nutrient/benefit links from knowledge slug → canonical slug using the existing `knowledgeFoodSlug` map as the translation table. The 4 null-knowledge canonical foods and the 265-knowledge/249-canonical drift must be reconciled first (a finite list). |
| **Runtime impact** | **Low, staged** | Behind existing service functions; one surface at a time (start: Meal Detail, which is *already* buggy, so any change is a net improvement). |
| **Developer impact** | **Positive after** | One store, one slug-space, one authoring surface. Removes "which slug do I use here?" — the exact trap that produced the Part 0 defect. |
| **Editorial impact** | **Positive after, transitional during** | End state: author a food once. Transition: a reconciliation pass to align the two slug-spaces and fill the 43+ canonical foods lacking knowledge links. |

**Hard prerequisite (the only true blocker to doing it *today*):** the two stores have **drifted** (265 knowledge vs 249 canonical; 43+ canonical foods with no knowledge link per WS0X.12). Unification must begin with a **reconciliation audit**, not a re-key. This is finite and was already flagged as SUGGESTION #3 in WS0X.12.

---

## PART 7 — FUTURE SCALABILITY

| Foods | Dual-store (status quo + permanent bridge) | Unified spine |
|---|---|---|
| **500** | Author each food in *two* stores + maintain the FK by hand + keep two slug-spaces aligned | Author once; links re-key automatically |
| **2,000** | Bridge maintenance and slug-space drift scale linearly; the Part 0 silent-miss class grows with every slug divergence | One key-space; drift impossible by construction |
| **5,000** | Two validators, two seeds, two authoring surfaces; cross-store dedup gets harder | One integrity pass; dedup is a single-table concern |
| **10,000** | The hand-set FK becomes the dominant maintenance cost and the dominant trust risk | The spine scales as one table + two normalized link tables + fixed vocab |

**Which stays simpler?** The unified spine — its complexity is constant in the number of *stores* (one), while the dual-store grows a per-food bridge obligation. **Which is easier to maintain?** Unified — single authoring surface. **Which better supports future AI features?** Unified, decisively: an AI authoring/enrichment pipeline (WS0X.12's recommendation) targets **one** store with **one** key, instead of writing a canonical identity and *then* a separately-keyed knowledge entry *and* setting an FK between them. The unified spine is the substrate that makes WS0X.12's draft-queue automation simpler, not harder.

---

## PART 8 — TRUST REVIEW

**Would a unified architecture improve, reduce, or leave trust unchanged?** → **Improve.**

- **Removes a live silent-failure class.** The Part 0 defect (context dropping whenever slugs differ) is a trust failure: the app *has* the data and fails to show it. One key-space makes this impossible.
- **Removes cross-store disagreement.** Duplicated `category`/`description` can drift between the two stores and present differently on different surfaces (the SoT register already logs this risk for the client knowledge libs). One owner = one answer.
- **Preserves the no-fabrication rule perfectly.** Unification changes *where* a fact lives, never *whether* it is asserted. Missing data still renders empty (the adapter already does this).
- **One caveat (transitional):** during reconciliation, the 43+ canonical-without-knowledge and 265/249 drift must be resolved honestly (gaps shown as gaps, never back-filled by guess). Handled as data hygiene, this is a trust *gain*, not a risk.

---

## PART 9 — FINAL RECOMMENDATION

### Recommend: **Option B — gradually migrate to ONE unified runtime model, built around Canonical Food** — with a precisely bounded scope.

**Scope lock for B (so it is neither big-bang nor elegance-rewrite):**
1. **One key-space:** canonical slug becomes the single runtime food key. Re-key the nutrient/benefit link tables to it (translate via the existing `knowledgeFoodSlug` map).
2. **One read model:** generalise the existing `FoodReportKnowledgeAdapter` into the single `buildFoodIntelligence(canonicalSlug)` that every surface consumes. Keep the registry service's public signatures; swap internals.
3. **Reference vocabularies stay as separate normalized tables** (nutrients, benefits, nutrient→benefit). They are not food data; merging them is out of scope and forbidden by the "no redesign for elegance" rule.
4. **Retire the `knowledgeFoodSlug` FK bridge** once links are re-keyed — the join becomes identity itself.
5. **Fold `canonical-map.json` into the canonical spine** so the resolver resolves *into* canonical identity.
6. **Sequence:** reconciliation audit first → Meal Detail second (it is already buggy, so it is the safest, highest-value first cutover) → remaining surfaces → resolver fold-in last.

**Why B and not A (retain dual-store):** A is the status quo plus WS0X.12's *permanent* bridge. The bridge is **already** a defect source (Part 0) and a per-food maintenance tax that grows with scale (Part 7). Retaining it institutionalises both. The brief forbids defending the current architecture merely because it exists; on evidence, the dual-store loses on trust, maintainability, and scalability.

**Why B and not C (hybrid):** C — "keep both stores, formalise the bridge" — is what WS0X.12 implicitly proposed (the Knowledge Authoring Pipeline as a *permanent* canonical→knowledge bridge). It is better than A only because it documents the seam; it still carries two slug-spaces, two authoring surfaces, and the silent-miss class. A hybrid is the right *transitional* state (B is delivered surface-by-surface, so the system is hybrid *during* migration), but it is the wrong *destination*.

**Why B is safe to recommend despite cost:** the two enabling patterns already exist in the codebase (the adapter; context-on-canonical), the change is staged behind stable service signatures, and the first cutover (Meal Detail) strictly improves a surface that is *already* defective. The only true prerequisite — reconciling store drift — is finite and was already on WS0X.12's suggestion list.

> **One-line answer to the governing question:** *Yes — THA can and should run one Food Intelligence model keyed on Canonical Food, with the nutrient/benefit vocabularies kept beside it as reference data; the WS0X.12 permanent bridge should be superseded by convergence, not built.*

---

## TRUST CHECK

> **Am I recommending B for elegance, or on evidence?**

On evidence. The single most important data point is **not** architectural taste — it is the live `meal-food-intelligence.ts` slug-space mismatch (knowledge slug passed to a canonical-keyed `getFoodContext`), which silently suppresses food context for every food whose slugs differ. That is a concrete, today, user-facing trust failure caused *directly* by running two slug-spaces. Elegance does not enter into it; correctness does. The recommendation also explicitly **refuses** the elegant-but-wrong move (merging the vocab tables) and **refuses** to defend the status quo. B is the narrowest change that removes the defect class.

---

## DEFINITION OF DONE

| Criterion | Status |
|---|:--:|
| Current architecture fully mapped (three stores, two slug-spaces) | ✓ Part 1 |
| Ownership of every food property identified | ✓ Part 2 |
| Duplication analysed (9 found; 7 removable) | ✓ Part 3 |
| Unified model investigated + diagrammed | ✓ Part 4 |
| Performance reviewed | ✓ Part 5 |
| Migration feasibility assessed | ✓ Part 6 |
| Scalability compared (500→10,000) | ✓ Part 7 |
| Trust implications reviewed | ✓ Part 8 |
| Single recommendation made (B) | ✓ Part 9 |
| Project file created | ✓ this file |

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | YES |
| Writes new data | **NO** |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Code / schema / validation / runtime / architecture changed | **NO** |

---

## SCOPE LOCK — confirmed

Investigation only. Did **not**: modify code · change schema · migrate data · build a bridge · alter runtime · change validation · touch any UI. Implementation ideas are isolated below under SUGGESTION.

---

## SUGGESTION — implementation opportunities (NOT executed; for future workstreams)

1. **Store-drift reconciliation audit (prerequisite to everything).** Produce the finite list of: the 4 null-knowledge canonical foods, the 43+ canonical foods with no `knowledgeFoodSlug`, and the 265-knowledge/249-canonical delta. Resolve honestly (link, author, or mark as intentional gap) before any re-key.
2. **Fix the Part 0 defect first, independently.** `server/services/meal-food-intelligence.ts` passes a *knowledge* slug to `getFoodContext` (canonical-keyed). Even under the status quo this should be corrected by translating slug-spaces via `knowledgeFoodSlug` — it is a live, isolated bug and the cheapest possible trust win.
3. **Generalise `FoodReportKnowledgeAdapter` → `buildFoodIntelligence(canonicalSlug)`** as the single runtime read model; repoint Meal Detail first (already defective ⇒ safest cutover).
4. **Re-key the link tables to canonical slug** (`knowledge_food_nutrients`, `knowledge_food_benefits`) using `knowledgeFoodSlug` as the translation map; retire the FK bridge once complete.
5. **Keep the vocabularies separate.** Do **not** merge `knowledge_nutrients` / `knowledge_health_benefits` / `knowledge_nutrient_benefits` into the spine — they are reference data; collapsing them would be the elegance-rewrite this brief forbids.
6. **Fold `server/data/canonical-map.json` into the canonical spine + alias table** so the resolver resolves into canonical identity (closes the third identity store).
7. **Point WS0X.12's draft-queue automation at the unified spine.** The Knowledge Authoring Pipeline becomes *simpler* under B — it writes one store with one key instead of a canonical identity plus a separately-keyed knowledge entry plus an FK.

---

*Report location: `docs/investigations/knowledge/WS0X_13_UNIFIED_FOOD_INTELLIGENCE_ARCHITECTURE.md`*
*Rollback: `git checkout rollback/ws0x13-20260625` (committed state) · `git stash apply 1820e46` (restore uncommitted tree) · delete this file to revert this task's only write.*
</content>
</invoke>
