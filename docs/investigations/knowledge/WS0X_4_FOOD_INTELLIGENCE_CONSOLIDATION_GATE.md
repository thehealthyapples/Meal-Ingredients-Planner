# WS0X.4 — Food Intelligence Consolidation Gate

**Date:** 2026-06-24
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Risk:** 🔴 RED — food intelligence architecture, recommendation/discovery systems, source-of-truth ownership
**Status:** Consolidation gate complete. Findings + ownership map produced. One zero-behaviour safe consolidation applied (ownership-declaration comments). All structural migration documented for future work — not implemented.
**Author:** Claude Code

---

## 1. ROLLBACK PROTECTION (Mandatory First Step — CONFIRMED)

Git status at start was **NOT clean**: 9 modified tracked files + ~18 untracked files, all pre-existing WS0X / audit work, none authored by this gate. A plain tag captures only committed state, so the dirty tree was snapshotted into a dangling commit and tagged.

| Item | Identifier |
|------|-----------|
| HEAD commit | `f531216731b97eef9bb4f312314d5925d307b699` |
| Dirty-tree snapshot (tracked files) | `ebe8489c849de3da37f572a5564e3fffc08e77e5` |
| Rollback tag | `rollback/ws0x4-pre-consolidation` → `ebe8489…` |

**Rollback procedure:**
- Undo any tracked-file edit from this gate: `git checkout rollback/ws0x4-pre-consolidation -- <file>`
- Remove this document: `git rm docs/investigations/knowledge/WS0X_4_FOOD_INTELLIGENCE_CONSOLIDATION_GATE.md`
- Pre-existing untracked files are never touched by this gate.

**No work began before this confirmation.**

---

## 2. EXECUTIVE SUMMARY

The brief asks whether THA can add `availability`, `peak_seasons`, and `origin_region` without creating duplicate systems. The honest finding, after auditing the live code (not just the prior investigation docs):

**Seasonality already exists in THREE forms, not two. Cuisine/origin exists in two forms plus a name-collision trap. Familiarity is already correctly owned. The canonical spine is sound but does not yet carry any context tags.**

The three governing investigations (WS0X.3, the Source-of-Truth Register, the Knowledge Surfaces Audit) each independently reached the same verdict: **the failure mode is not "no home for tags" — it is "adding a new representation before declaring which existing one wins."** WS0X.3 Phase 6 named this exact latent bug ("today neither is declared canonical") and never closed it.

**This gate closes the declaration gap.** It declares canonical ownership in writing for every food-intelligence concept, identifies every parallel representation, and produces a YES/NO readiness decision.

**Readiness verdict (Phase 9): YES — with one mandatory precondition** (declare-and-derive seasonality ownership at implementation time, so `peak_seasons` consolidates the existing three forms rather than becoming a fourth).

**New finding beyond the governing docs:** a **third** seasonality store — `seasonal_with` relationships in `shared/relationships/food-graph.ts` (9 editorial food↔food pairs with embedded season prose). Any seasonality consolidation must account for all three, not two.

---

## 3. PHASE 1 — FOOD INTELLIGENCE OWNERSHIP MAP

Verified against live code. "Declared SoT" is this gate's ruling; "Status" reflects whether reality matches it today.

| # | Concept | Current Owner(s) | Current Consumers | Declared Source of Truth | Status |
|---|---------|------------------|-------------------|--------------------------|--------|
| 1 | **Canonical Food Identity** | `canonical_food` table (`shared/canonical/foods.ts`, 239 entries) | Food Report adapter, discovery/seasonal food index, variety surfacing, Pantry Explore drill-down | `canonical_food` (spine) | ✅ Single owner |
| 2 | **Aliases** | `canonical_food_alias.alias_key` (UNIQUE anti-fork lock) + `knowledge_foods.aliases[]` + `shared/ingredient-aliases.ts` | Ingredient normalisation, matching | `canonical_food_alias` (anti-fork lock); `knowledge_foods.aliases[]` is display-local | ⚠️ Two stores, reconcilable |
| 3 | **Benefits** | `knowledge_food_benefits` (typed M:N) | Pantry Explore, Plant Diversity, Meal Uplift, Food Report | WS0 registry | ✅ Single owner |
| 4 | **Nutrients** | `knowledge_food_nutrients` (typed M:N) | Same as benefits | WS0 registry | ✅ Single owner |
| 5 | **Seasonality** | (a) `knowledge_foods.seasonality` free text — 265 foods, ~50 distinct values; (b) `SEASON_SEED` structured map — ~30 foods; (c) `food-graph.seasonal_with` — 9 editorial pairs | (a) display only; (b) discovery `seasonalExploration()` + (indirectly) seasonal stories via `discover()`; (c) alternatives / relationships | **`SEASON_SEED` structured map = canonical for logic; `knowledge_foods.seasonality` = display copy; `seasonal_with` = derived editorial graph** | 🔴 THREE forms, none declared canonical |
| 6 | **Cuisine** | `CUISINE_SEED` (food→cuisine, 7 cuisines) | Discovery `cuisineExploration()` + ranking tilt | `CUISINE_SEED` (food-level, many-to-many curated view) | ⚠️ One food-level owner; do not fork |
| 7 | **Origin** | ❌ Does not exist as food data | — | (proposed) `origin_region` slug on `canonical_food` | ❌ Missing |
| 8 | **Availability** | ❌ Does not exist | — | (proposed) ordinal enum on `canonical_food`, UK-scoped | ❌ Missing |
| 9 | **Familiarity** | `HouseholdContext.enjoys[]` → derived `familiar` (`shared/discovery/engine.ts:91 buildFamiliaritySet`) | Discovery ranking, seasonal Looking-Ahead | **Household-side, derived** — never a food tag | ✅ Correctly owned |
| 10 | **Discovery Relationships** | `shared/discovery/engine.ts` (WS8) over food-graph + seeds | `/api/pantry/discover` | WS8 discovery engine | ✅ Single owner |
| 11 | **Alternatives** | `shared/alternatives/engine.ts` (WS9) | `/api/pantry/alternatives` | WS9 alternatives engine | ✅ Single owner |
| 12 | **Stories** | `shared/stories/engine.ts` (WS10) | `/api/pantry/stories` | WS10 stories engine | ✅ Single owner |
| 13 | **Seasonal Stories** | `shared/seasonal/engine.ts` (WS11) — calls `discover()` | `/api/pantry/seasonal` | WS11 engine (consumes WS8) | ✅ Single owner |
| 14 | **Varieties** | `food_variety` (child of `canonical_food`) | Food Report, season/story food index | `food_variety` | ✅ Single owner |
| 15 | **Diversity Groups** | `diversity_group` (`shared/canonical/diversity-groups.ts`) | Plant Diversity counting (canonical path) | `diversity_group` table — **but `nutrition-variety.ts` keyword lists are a contested parallel (see SoT Register Dup #3)** | ⚠️ Contested (out of WS0X scope) |
| 16 | **Recommendation Ranking** | Per-engine ranking functions (discovery `rankWithin`, etc.) | All five engines | Derived at query time — never stored | ✅ Correctly derived |

**Spine confirmation:** `canonical_food` already carries cross-source, non-editorial metadata (`scientificName`, `sourceRef`, `confidence`, `tier`). It does **not** yet carry `availability`, `peak_seasons`, or `origin_region` (verified: zero occurrences in `shared/`, `server/`, `client/src/`).

---

## 4. PHASE 2 — SEASONALITY CONSOLIDATION

### Three representations confirmed in live code

| Form | Location | Shape | Scale | Role today | Drives recommendations? |
|------|----------|-------|-------|-----------|-------------------------|
| Free-text string | `knowledge_foods.seasonality` (`schema.ts:1466`) | `text` prose | 265 foods, ~50 distinct values ("Year-round (whole bird: Christmas season)", …) | Display copy | ❌ No — cannot enumerate/filter/rank |
| Structured map | `SEASON_SEED` (`shared/discovery/seasonal-map.ts`) | `Record<UKSeason, {slug,name}[]>` + `seasonForDate()` | ~30 curated foods | Candidate generation | ✅ **Yes** — `discovery/engine.ts:269 seasonalExploration()` |
| Relationship graph | `food-graph.ts seasonal_with` | 9 editorial food↔food pairs w/ season prose | 9 pairs | Pairing/alternatives | ✅ Yes (alternatives, "seasonal-swap" goal) |

The free-text field and the structured map **can and do disagree**, and neither is declared canonical — exactly the latent bug WS0X.3 §Phase 6 flagged and left open.

### Determination

| Representation | Verdict | Rationale |
|----------------|---------|-----------|
| `SEASON_SEED` | **CANONICAL (for logic)** | It already drives the only seasonality *logic* in the app (discovery → which feeds WS11 seasonal stories). One date model (`seasonForDate`/`seasonOf`) is shared across WS8/WS10/WS11 — "three engines, one season truth" (`seasonal/engine.ts:91`). |
| `knowledge_foods.seasonality` | **DERIVED / EDITORIAL DISPLAY** | Human prose for the food-detail surface. Keep, but it is display copy, not a logic source. |
| `food-graph seasonal_with` | **DERIVED EDITORIAL GRAPH** | Curated pairings; should reference the same peak-season facts SEASON_SEED encodes, not invent new ones. |

**Recommendation:** When `peak_seasons` is implemented, it must **absorb `SEASON_SEED` as a structured per-food field on `canonical_food`**, and `SEASON_SEED` becomes a **derived curated view** (restraint preserved — the curated short list still picks what discovery shows; see `seasonal-map.ts` header). The free-text field is demoted to display. **Do NOT create a fourth representation.** `peak_seasons` is therefore a *consolidation*, not a new fork — which is precisely why it is safe to add.

**Not consolidated in code now** (trust check fails — would change discovery/seasonal-stories behaviour and needs a schema column). Documented for the `peak_seasons` implementation.

---

## 5. PHASE 3 — CUISINE / ORIGIN CONSOLIDATION

### Current state

- **`CUISINE_SEED`** (`shared/discovery/cuisine-map.ts`): the single food-level cuisine model — 7 cuisines, each a short curated emblematic-foods list, reverse-indexed via `getCuisinesForFood(slug)`. Consumed only by `discovery/engine.ts` (cuisine exploration + ranking tilt). **Restraint is the explicit design intent** (file header).
- **Meal-level cuisine** (the many `cuisine` grep hits in `server/lib/*`, `planner-*`, `meals-page`): a **different domain** — cuisine tags on *meals/recipes*, not on *foods*. Not a duplicate of food cuisine; out of scope.
- **`origin_region`**: does not exist.

### Determination — single ownership model

| Concept | Owner | Shape | Ruling |
|---------|-------|-------|--------|
| **Culinary association (cuisine)** | `CUISINE_SEED` | many-to-many curated (food appears in several cuisines) | Keep as the curated view. If ever moved into data, it is a **join table**, never a scalar food column. Many-valued by nature (tomato → Mediterranean/Italian/Mexican). |
| **Geographic origin** | (proposed) `origin_region` | single controlled region slug on `canonical_food` | A **distinct concept** from cuisine — where a food *comes from* vs where it is *used*. Single-valued, factual, Claude-authorable from `scientificName`. |

**Critical rule:** `origin_region` and cuisine are **two concepts, not one**. Adding `origin_region` does not duplicate `CUISINE_SEED` provided origin stays geographic/single-valued and cuisine stays culinary/many-valued. Do **not** collapse them, and do **not** store cuisine as a scalar food column.

**Not implemented now** (origin_region is explicitly out of scope per SCOPE LOCK).

---

## 6. PHASE 4 — FAMILIARITY REVIEW

**Verified correct and unchanged.**

- Familiarity is computed **household-side**: `HouseholdContext.enjoys[]` → `buildFamiliaritySet()` (`shared/discovery/engine.ts:91`) expands across the relationship graph → `familiar: boolean`.
- It is a **ranking signal only**. Type docs (`discovery/types.ts:58-62`) are emphatic: "A RANKING signal only … Never used to say 'you should eat' or 'you're missing'."
- Consumers: discovery ranking (`rankWithin`), WS11 Looking-Ahead familiarity seed (`seasonal/engine.ts:60 SEASON_TOP_FOODS_SEED`).

**Confirmation: NO food-level familiarity field should exist.** "Global familiarity" of a food (e.g. jackfruit is exotic) is a facet of `availability`, not a separate tag. Household familiarity is the household's story, derived from signals (meals → pantry → planner → shopping), never stored on the food. No change required.

---

## 7. PHASE 5 — CANONICAL FOOD SPINE REVIEW

**Verified: `canonical_food` remains the authoritative food identity layer.**

- It is the **superset** of `knowledge_foods` (can hold foods with no editorial entry; `knowledge_food_slug` is a nullable FK).
- Anti-fork lock: `canonical_food_alias.alias_key` is **UNIQUE** — one string resolves to at most one food (guarantees one food = one tag set; no double-counting at scale).
- It already carries non-editorial cross-source metadata (`scientificName`, `sourceRef`, `confidence`, `tier`) — context tags belong with their kin here.

**Ruling:** All future **food-intrinsic** context metadata (`availability`, `peak_seasons`, `origin_region`) belongs on `canonical_food` as nullable, additive columns — **except** genuinely many-to-many dimensions (cuisine association; future per-market availability), which belong in join tables, not scalar columns.

**Identified exceptions:**
1. **Cuisine association** — many-to-many → join table or curated map, not a `canonical_food` scalar.
2. **Editorial display copy** (`knowledge_foods.seasonality`, descriptions) — stays on the editorial subset `knowledge_foods`, not the spine.
3. **Household familiarity / recommendation tier** — derived, never stored anywhere.

---

## 8. PHASE 6 — CONSUMER REVIEW

Does each system read food intelligence from the canonical source? (Verified via `THA_KNOWLEDGE_SURFACES_AND_ROUTE_OWNERSHIP_AUDIT.md` traces + code.)

| System | Reads from canonical source? | Notes |
|--------|------------------------------|-------|
| Planner | N/A | Does not consume WS0 food intelligence (out of scope). |
| Smart Planner | N/A | Restriction engine is separate; no WS0 read. |
| Meal Detail (`MealUpliftPanel`) | ✅ YES | WS0 via `/api/knowledge/ingredient-lookup`. |
| Cookbook | N/A | No food-knowledge surface. |
| Dashboard | ✅ Indirect | Via stories/boosts, which read WS0/engines. |
| Shopping | ⚠️ Separate | `FoodKnowledgeModal` reads the `food_knowledge` additive encyclopedia (distinct domain), not WS0. |
| Analyser | ⚠️ Partial | Ingredient match to WS0; min-confidence threshold needed at scale. |
| Pantry Explore (`PantryKnowledgeHub`) | ✅ YES | WS0 registry + WS8–WS11 engines. |
| Nutrition Report (`PlantDiversityReport`) | ✅ YES | WS0 via ingredient-lookup; `—` shown on data gaps (honest empty state). |
| Discovery | ✅ YES | WS8 over canonical + seeds. |
| Stories | ✅ YES | WS10. |
| Seasonal Stories | ✅ YES | WS11 → `discover()` → SEASON_SEED. |
| Food Wrapped foundations | N/A (future) | Best future fit for origin/availability. |

**Pre-existing non-compliance** (from SoT Register, *not* WS0X-introduced, out of this gate's scope): pantry-item-expand uses static `pantry-knowledge.ts`; Plant Diversity counting has the `nutrition-variety.ts` vs `diversity_group` fork. Logged as governance debt; see SUGGESTION.

**Key point for WS0X:** every system that *would* consume the three new tags (Discovery, Alternatives, Stories, Seasonal, Pantry Explore, future Wrapped) already reads through the canonical/registry path. Adding tags on `canonical_food` reaches them **without new wiring or a new consumer**.

---

## 9. PHASE 7 — PARALLEL SYSTEM DETECTION

Full sweep of `shared/`, `server/`, `client/src/`.

| # | Concept | Representations found | Classification |
|---|---------|----------------------|----------------|
| 1 | **Seasonality** | `knowledge_foods.seasonality` (free text) · `SEASON_SEED` (structured) · `food-graph seasonal_with` (9 pairs) | 🔴 **Needs consolidation** — declare SEASON_SEED canonical-for-logic, others derived. Defer code migration to `peak_seasons`. |
| 2 | **Cuisine (food-level)** | `CUISINE_SEED` only | 🟢 **Safe** — single owner. (Meal-level cuisine is a separate domain.) |
| 3 | **Origin** | none | 🟢 Safe (absent — add as new, distinct from cuisine). |
| 4 | **Availability** | none (lycopene bioavailability, retail store availability, confidence copy are unrelated) | 🟢 Safe (absent — genuinely new). |
| 5 | **Familiarity** | `enjoys[]`/`familiar` (household, derived) only | 🟢 **Safe** — correctly single-owned. |
| 6 | **Recommendation metadata / tier** | derived per-engine; `canonical_food.tier` = import provenance (name-collision risk only) | ⚠️ **Safe but guard the name** — any "recommendation tier" must NOT reuse `tier`; derive from `availability`. |
| 7 | Aliases | `canonical_food_alias` · `knowledge_foods.aliases[]` · `ingredient-aliases.ts` | ⚠️ Reconcilable (pre-existing; out of WS0X scope). |
| 8 | Plant-diversity classification | `diversity_group` · `nutrition-variety.ts` keyword lists | ⚠️ **Needs consolidation** (pre-existing SoT Register Dup #3; out of WS0X scope). |

**Must remove:** none introduced by WS0X. No destructive removal is in scope.

---

## 10. PHASE 8 — CONSOLIDATION IMPLEMENTATION

**Trust check applied to every candidate.** A consolidation is implemented here **only** if ownership is obvious, risk is low, and **no behavioural change occurs**.

| Candidate | Behaviour change? | Decision |
|-----------|-------------------|----------|
| Migrate `seasonality` free-text → structured `peak_seasons` | YES (discovery/seasonal output + schema) | ❌ Document for `peak_seasons` impl. |
| Make `SEASON_SEED` a derived view of canonical | YES (data source change) | ❌ Document. |
| Move `CUISINE_SEED` into a join table | YES (data source change) | ❌ Document. |
| Add `origin_region` / `availability` columns | YES + explicitly out of SCOPE LOCK | ❌ Document. |
| **Declare ownership in-code (comments only)** | **NO** — comments cannot change behaviour | ✅ **IMPLEMENTED** |

### Implemented: ownership-declaration comments (zero behaviour change)

The single safe, in-scope action is closing the **declaration gap** WS0X.3 left open. Source-of-truth roles were added as header comments to the two discovery seed files and the seasonality schema field, cross-referencing this gate. No data, no logic, no types changed.

Files touched (comments only):
- `shared/discovery/seasonal-map.ts` — declares `SEASON_SEED` canonical-for-logic; names the two derived forms.
- `shared/discovery/cuisine-map.ts` — declares `CUISINE_SEED` the single food-level cuisine owner; flags origin as a distinct future concept.
- `shared/schema.ts` (`knowledge_foods.seasonality`) — declares the field display-only / derived.

These resolve "neither is declared canonical" (WS0X.3 §Phase 6) without touching behaviour.

---

## 11. PHASE 9 — READINESS CHECK

> Can THA safely implement `availability`, `peak_seasons`, `origin_region` without creating architecture duplication?

### ✅ YES — with one precondition for `peak_seasons`.

| Tag | Safe to add? | Condition |
|-----|--------------|-----------|
| **`availability`** | ✅ YES, no blockers | Genuinely absent. Add as nullable ordinal enum on `canonical_food` (UK-scoped) + separate `imported`/`seasonal`/`online_only` modifiers. Derive recommendation tier from it; do **not** reuse `canonical_food.tier`. |
| **`peak_seasons`** | ✅ YES, **conditional** | Must be implemented as a **consolidation**: absorb `SEASON_SEED` (declared canonical here), demote `knowledge_foods.seasonality` to display, and re-point `SEASON_SEED`/`seasonal_with` as derived views. If added as a *new* field alongside the untouched three forms, it becomes a **fourth fork** → blocker. The declaration in Phase 10 makes the safe path the obvious one. |
| **`origin_region`** | ✅ YES, no blockers | Absent and distinct from cuisine. Single controlled region slug on `canonical_food`; keep cuisine many-to-many. |

**Blockers if the precondition is ignored:** adding `peak_seasons` without consolidating leaves four seasonality representations and entrenches the fork this gate exists to prevent.

---

## 12. FINAL QUESTION — Will the ownership model hold at 2,000 / 5,000 / 10,000 foods?

### YES — the model scales; two operational caveats apply.

**Why it holds:**
1. **One spine.** `canonical_food` is the single identity layer; the `alias_key` UNIQUE lock guarantees one food = one tag set regardless of catalogue size. Context tags as columns on the spine cost ~3 scalars + 1 small array per row — negligible at 10k rows, and read in the same row fetch (zero extra round-trips per rank).
2. **Derived-not-stored discipline.** Familiarity and recommendation tier are computed at query time, so they never need backfill as the catalogue grows.
3. **Curated views stay small by design.** `SEASON_SEED`/`CUISINE_SEED` remain short editorial shortlists even when the underlying `peak_seasons`/origin data covers thousands — restraint is preserved as candidate-generation feeds curation.

**Caveats (already flagged in WS0X Expansion Program, restated):**
1. **Search must move server-side before 2,000 go live** (`searchKnowledgeRegistry()` currently loads all foods in memory). Independent of tags, but a hard precondition for the surfaces that will read them.
2. **Availability is a market judgement that ages and cannot be inferred** — at 10k it must default to `specialist`/`unknown` and promote only on review. A second market means migrating availability to a per-market join (anticipated, not premature).

The ownership model itself does not change shape at any scale — only population strategy (hand-authored → batch → inference-by-exception) shifts.

---

## 13. TRUST CHECK

| Could this gate's consolidation… | Answer |
|----------------------------------|--------|
| Hide information? | ❌ No — only comments were added; no data or display path changed. |
| Change recommendations? | ❌ No — discovery/alternatives/stories/seasonal logic is byte-for-byte unchanged. |
| Alter planner behaviour? | ❌ No — planner does not consume these systems and nothing executable changed. |

All behaviour-changing consolidations were **documented, not implemented**, per the trust rule.

---

## 14. DATA IMPACT

- Reads existing data: **YES**
- Writes new data: **NO** (no schema, no seed, no DB writes)
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## 15. FILES CHANGED

| File | Change | Behaviour impact |
|------|--------|------------------|
| `docs/investigations/knowledge/WS0X_4_FOOD_INTELLIGENCE_CONSOLIDATION_GATE.md` | New (this document) | None |
| `shared/discovery/seasonal-map.ts` | Ownership-declaration comment | None (comment) |
| `shared/discovery/cuisine-map.ts` | Ownership-declaration comment | None (comment) |
| `shared/schema.ts` | Inline comment on `knowledge_foods.seasonality` | None (comment) |

---

## 16. VERIFICATION

- Confirmed `availability` / `peak_seasons` / `origin_region` have **zero** food-data occurrences in `shared/`, `server/`, `client/src/` (only unrelated bioavailability / retail / copy matches).
- Confirmed `SEASON_SEED` and `CUISINE_SEED` are consumed **only** by `shared/discovery/engine.ts`; WS11 seasonal reaches seasonality solely via `discover()` (`seasonal/engine.ts:275`).
- Confirmed three seasonality forms (free text 265 foods / SEASON_SEED ~30 / `seasonal_with` 9 pairs).
- Confirmed `canonical_food` carries `scientificName`/`sourceRef`/`confidence`/`tier` and no context tags (`schema.ts:1608-1634`).
- Edits are comments only → no type/behaviour change. (Recommend a `tsc --noEmit` / build run as the standard gate before commit; this document authored no executable change.)

---

## 17. DEFINITION OF DONE

| Requirement | Status |
|-------------|--------|
| Ownership map created | ✅ Phase 1 (16 concepts) |
| Seasonality ownership resolved | ✅ Phase 2 — SEASON_SEED canonical-for-logic; declared in code |
| Cuisine/origin ownership resolved | ✅ Phase 3 — two distinct concepts; CUISINE_SEED sole food-level owner |
| Familiarity ownership verified | ✅ Phase 4 — household-derived; no food field |
| Canonical spine verified | ✅ Phase 5 |
| Consumers audited | ✅ Phase 6 (13 systems) |
| Parallel systems identified | ✅ Phase 7 (8 concepts classified) |
| Safe consolidations completed | ✅ Phase 8 (ownership-declaration comments; structural migration documented) |
| Readiness decision produced | ✅ Phase 9 — YES with `peak_seasons` precondition |
| Project file created | ✅ This document |

---

## 18. SUGGESTION — Future Work (NOT authorised here)

1. **Implement `peak_seasons` as a consolidation** — add structured `peak_seasons` (+ `imported`) to `canonical_food`; re-point `SEASON_SEED` and `seasonal_with` as derived views; demote `knowledge_foods.seasonality` to display copy. This *removes* the three-way fork; it must not add a fourth.
2. **Add `availability`** — nullable ordinal enum on `canonical_food` (UK-scoped) + `imported`/`seasonal`/`online_only` modifiers. Derive recommendation tier from it; never reuse `canonical_food.tier`.
3. **Add `origin_region`** — single controlled region slug, Claude-authored from `scientificName`; keep cuisine as a many-to-many curated map/join.
4. **Server-side search** before 2,000 foods go live (precondition for all tag-consuming surfaces).
5. **Pre-existing forks (out of WS0X scope, owned by SoT Register):** retire `nutrition-variety.ts` → `diversity_group`; retire `nutrition-benefit-library.ts`/`pantry-knowledge.ts` → WS0; move `client/src/lib/dietRules.ts` → `shared/`.
6. **Update the SoT Register** Appendix A with the seasonality and cuisine/origin ownership rulings declared here.

---

*Consolidation gate complete. One zero-behaviour safe consolidation applied; all structural migration documented for future implementation. No recommendations, planner behaviour, or displayed data changed.*
*Rollback: `git checkout rollback/ws0x4-pre-consolidation -- <file>` / `git rm` this document.*
