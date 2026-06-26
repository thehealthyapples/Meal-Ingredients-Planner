# WS0X.3 — Food Context Tagging Architecture Investigation

**Date:** 2026-06-24
**Status:** Investigation only — NO implementation performed
**Risk:** 🔴 RED (food metadata affects intelligence, recommendations, planner, discovery, reporting, personalisation)
**Author:** Claude Code

---

## Rollback Protection (Mandatory First Step)

- **Git status at start:** NOT clean. 9 modified tracked files + 16 untracked files — all pre-existing WS0X work, none authored by this investigation.
- **Rollback tag:** `rollback/ws0x3-food-context-tagging-20260624`
- **Commit:** `f531216731b97eef9bb4f312314d5925d307b699`
- **Rollback procedure:** This investigation writes exactly ONE new file (this document). To roll back: `git rm docs/investigations/WS0X_3_FOOD_CONTEXT_TAGGING_ARCHITECTURE.md`. No existing uncommitted work is touched.

---

## Executive Summary

The central question — *"How should contextual food intelligence (origin, availability, familiarity, tier, season) be represented?"* — has a surprising answer once the codebase is audited:

**Three of the five proposed tag families already exist in the codebase, in scattered and partly duplicated forms.** The real risk of WS0X.3 is not "we have no place to put tags." It is the opposite: **we are already growing parallel context systems, and adding more without consolidating will entrench the fork.**

Concrete evidence:

| Proposed tag | Already exists? | Where | Form |
|---|---|---|---|
| **Origin / cuisine** | ✅ Partially | `shared/discovery/cuisine-map.ts` (`CUISINE_SEED`) | Structured, but reverse-indexed (cuisine→foods, not food→origin), curated subset only |
| **Seasonality** | ✅ **Twice** | `knowledge_foods.seasonality` (free text) **and** `shared/discovery/seasonal-map.ts` (`SEASON_SEED`) | One unstructured string, one structured map — **already a parallel system** |
| **Familiarity** | ✅ Already correct | `HouseholdContext.enjoys[]` + derived `familiar` boolean in `shared/discovery/engine.ts` | Household-side, derived — exactly where Phase 4 concludes it belongs |
| **Availability** | ❌ Missing entirely | — | The single genuinely-absent dimension |
| **Recommendation tier** | ⚠️ Confusable | `canonical_food.tier` exists but means *import provenance* (`canonical`/`catalogue`), NOT recommendation suitability | Name collision risk |

**Top-line recommendation:** The most valuable next move is **not** adding three tags. It is choosing the single source of truth and **migrating the existing scattered representations onto it**, then adding the one missing dimension (`availability`). The "three tags" answer (Phase Final) is delivered within that frame.

---

## PHASE 1 — Current Data Model Audit

### What exists today

**Editorial knowledge spine — `knowledge_foods`** (`shared/schema.ts:1455`):
```
slug, name, category, subcategory, aliases[], description, imageUrl,
commonForms[], storageGuidance, seasonality (free text), source,
displayOrder, isActive, createdAt
```
- 265 foods seeded (`shared/knowledge/foods.ts`).
- `seasonality` is a **free-text string** — audit of live data shows **40+ distinct values** ("Year-round", "Year-round (imported)", "Autumn (dried year-round)", "Year-round (whole bird: Christmas season)", …). It is human prose, **not queryable, not enumerable, not safe to rank or filter on.**

**Relationship tables:**
- `knowledge_food_nutrients`, `knowledge_food_benefits`, `knowledge_nutrient_benefits` — typed many-to-many with `ranking`, `confidence`/`evidenceStrength`, `source`.
- `shared/knowledge/relationships.ts` — editorial graph (`FOOD_NUTRIENTS`, plus food↔food relations consumed by the discovery/alternatives engines).

**Identity spine — `canonical_food`** (`shared/schema.ts:1608`):
```
slug, name, category, subcategory, description, knowledgeFoodSlug (FK),
diversityGroupSlug (FK), status, source,
tier ("canonical"|"catalogue"),       ← import provenance, NOT recommendation tier
scientificName, sourceRef, confidence ("high"|"medium"|"low"), …
```
- Superset of `knowledge_foods` (can hold foods with no editorial entry).
- Anti-fork lock: `canonical_food_alias.alias_key` is UNIQUE → one string resolves to at most one food.
- `diversity_group` / `food_variety` already model "varieties roll up to one plant".

**Context maps living OUTSIDE the schema** (the important finding):
- `shared/discovery/cuisine-map.ts` — `CUISINE_SEED`: cuisine → emblematic foods.
- `shared/discovery/seasonal-map.ts` — `SEASON_SEED`: UK peak season → foods, plus `seasonForDate()`.
- These are deliberately curated *subsets* (restraint is a feature for discovery), but they are functionally **food-context tags stored in TypeScript constants, decoupled from the food record.**

### What metadata already exists vs is missing

| Dimension | Status |
|---|---|
| Category / subcategory | ✅ `knowledge_foods` + `canonical_food` |
| Aliases / synonyms | ✅ `aliases[]` + `canonical_food_alias` |
| Nutrients / benefits | ✅ typed relationship tables |
| Storage / common forms | ✅ `knowledge_foods` |
| Seasonality | ⚠️ Exists twice, inconsistent (free text + structured map) |
| Origin / cuisine | ⚠️ Exists once, reverse-indexed, subset only |
| Diversity grouping / varieties | ✅ `diversity_group` / `food_variety` |
| Scientific name / source ref | ✅ `canonical_food` |
| **Availability / sourcing difficulty** | ❌ **Missing** |
| **Recommendation tier (suitability)** | ❌ Missing (`tier` is provenance, not suitability) |
| **Household familiarity** | ✅ Already household-side (`enjoys[]` + `familiar`) |

### Fields already available for extension

- `canonical_food` is the natural home for **food-intrinsic** tags: it is the superset spine, it already carries cross-source metadata (`scientificName`, `sourceRef`, `confidence`, `tier`), and it is where the catalogue grows toward 2k–10k. Adding nullable columns here is additive and low-risk.
- `knowledge_foods` should stay **editorial/display-focused**; it is a subset and not the identity spine.

---

## PHASE 2 — Origin Tag Investigation

**Should origin be single / multiple / hierarchical?**

Evidence from `CUISINE_SEED`: a food appears under multiple cuisines (tomato → Mediterranean, Italian; chickpeas → Mediterranean, Middle Eastern, Indian). **Origin is inherently many-valued and conflates two different concepts:**

1. **Geographic/botanical origin** (where the food comes from) — Jackfruit → South Asia, Natto → Japan, Halloumi → Cyprus. Mostly single-valued, stable, factual.
2. **Culinary association / cuisine** (where the food is *used*) — tomato is "from" the Americas but culinarily Italian/Mediterranean/Mexican/Indian. Many-valued, fuzzy, editorial.

**Recommendation:**
- Model these as **two separate concepts**, not one "origin" field.
- **`origin_region`** (geographic): single value, hierarchical-lite — store a controlled region slug (e.g. `south-asia`, `east-asia`, `mediterranean`, `north-europe`). A 2-level hierarchy (region → country) is *optional* and should be deferred; region alone serves recommendations.
- **Cuisine association** is already modelled by `CUISINE_SEED` and is many-to-many. **Do not duplicate it as a food column.** If it must move into data, it belongs in a join table (food ↔ cuisine), not a scalar field — but the existing curated map is adequate for now and moving it is a separate decision.
- Full free-form country/region/cuisine/tradition (4 fields) is **over-modelling** for the recommendation goals. Region + the existing cuisine map covers every Phase-2 example.

---

## PHASE 3 — Availability Tag Investigation

This is the **one genuinely missing dimension** and the highest-value addition.

**Examples map cleanly to an ordinal scale:** Mainstream → Common → Specialist → Rare, with orthogonal modifiers (Seasonal, Imported, Online-only).

**Can it be maintained?** Yes, but only as a **coarse, ordinal, geography-scoped** value. Do not attempt per-retailer precision — that ages instantly and cannot be curated at 2k–10k scale.

**Can it be inferred?** Partially. The catalogue pipeline (`shared/catalogue/`) and USDA imports give weak signals; true availability is editorial. For the first batch, Claude can author a defensible coarse value per food (see Phase 11).

**Can it vary by country?** Yes — jackfruit is "specialist" in some markets, "mainstream" in UK supermarkets now. **This is the architectural trap.** Two options:
- (A) **Single value scoped to "primary market = UK"** — store one `availability` value, documented as UK-centric. Simple, honest, sufficient for a UK-first product.
- (B) **Per-market join table** (food ↔ market → availability). Correct long-term, premature now.

**Recommendation:** Start with **(A): a single ordinal `availability` field on `canonical_food`, explicitly UK-scoped**, with `imported`/`seasonal` captured as **separate boolean-ish modifiers** rather than folded into the scale (because a food can be both "mainstream" and "imported"). Migrate to (B) only when a second market launches.

Proposed enum: `mainstream | common | specialist | rare`. Modifiers (separate, not part of the enum): `imported`, `seasonal`, `online_only`.

---

## PHASE 4 — Household Familiarity Model

**Does familiarity belong to the food (A) or the household (B)?**

**Answer: B (household) — and the codebase has already answered this correctly.**

Evidence (`shared/discovery/engine.ts:84-107`): familiarity is *already* computed household-side. `HouseholdContext.enjoys[]` seeds a `familiar` set; `buildFamiliaritySet()` expands it across the relationship graph; `familiar` is a **ranking signal only**, never a verdict (the type docs are emphatic: "Never used to say 'you should eat' or 'you're missing'").

The Jackfruit example confirms the split:
- *Global familiarity* (moderate) is a **food property** → this is really a facet of **availability/tier**, not a separate tag. Fold it into Phase-3 availability + Phase-5 tier.
- *Household familiarity* (never tried) is a **household property** → already modelled.

**How should it evolve / be measured / sourced?**
- It must be **derived, not stored as a food tag.** Sources, in priority order: **meals logged** (strongest — actually eaten) → **pantry** (have it) → **planner selections** (chose it) → **shopping** (bought it). `PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md` (2026-06-10, RED, deferred) already scopes this as a future household capability.
- Recommendation: **no food-level familiarity tag.** Continue feeding `enjoys[]` from household signals; enrich the source set over time (meals → pantry → planner → shopping). Familiarity is the household's story, not the food's.

---

## PHASE 5 — Recommendation Tiers

**Should Tier 1–4 (Mainstream / Common / Specialist / Discovery) exist?**

These tiers are **almost identical to the Phase-3 availability scale** (mainstream/common/specialist/rare). Creating a *separate* tier field would duplicate availability and immediately create the parallel-system problem this investigation exists to prevent.

**Recommendation:**
- **Do NOT create a separate recommendation-tier field.** Derive tier from `availability` (+ optionally household familiarity) at ranking time. "Discovery food" = specialist/rare *and* not household-familiar — a computed view, not stored state.
- **Not user-facing.** Tier language ("Tier 3 specialist food") is internal. User-facing copy stays invitational (the discovery engine already enforces no scores, no ratings, no ordering numbers).
- **Affects ranking only**, never filtering-out. A specialist food is ranked lower for a mainstream household, never hidden — the discovery engine's whole philosophy is curiosity over optimisation.
- **Naming hazard:** `canonical_food.tier` already exists meaning import provenance (`canonical`/`catalogue`). Any "recommendation tier" must use a different name (e.g. `availability`) to avoid collision.

---

## PHASE 6 — Seasonality Review

**Current state is the clearest case of an existing parallel system:**
- `knowledge_foods.seasonality` — 40+ distinct free-text strings. Good for *display* ("at their best in autumn"), useless for *logic* (cannot enumerate, filter, or rank).
- `shared/discovery/seasonal-map.ts` `SEASON_SEED` — clean structured `Record<UKSeason, food[]>` with `seasonForDate()`. This is what Seasonal Stories / discovery actually compute on.

So seasonality **already drives recommendations** — via the structured map, **not** via the food field. The free-text field and the structured map can and do disagree.

**Recommendation:**
- **Promote structured season tags to the source of truth** and treat the `knowledge_foods.seasonality` string as derived *display copy*, OR keep the string purely editorial and the structured map canonical — but **declare which one wins.** Today neither is declared canonical, which is the latent bug.
- Structured representation: a small set `peak_seasons: ("spring"|"summer"|"autumn"|"winter")[]` plus boolean `year_round` / `imported_year_round`. This maps to `SEASON_SEED` directly and to Seasonal Stories without translation.
- **Integration with Seasonal Stories:** Seasonal Stories (`shared/seasonal/`) and discovery already consume `SEASON_SEED`. Structured season tags on the food record would let these engines query the catalogue directly instead of maintaining a hand-curated subset — but **restraint must be preserved**: the curated short lists exist *because* a full "everything in season" list defeats the warmth (per `seasonal-map.ts` header comment). So structured tags feed *candidate generation*; editorial curation still picks the short list.

---

## PHASE 7 — Discovery Intelligence Review

How tags improve each engine **without becoming intrusive** (the engines' shared discipline: no scores, invitation not instruction, empty-is-silent):

- **Discovery** (`shared/discovery/engine.ts`): `availability` would let "broaden horizons" prefer obtainable foods; `origin_region` would strengthen cuisine exploration with real data instead of the curated subset. Use as **ranking tilt only**.
- **Alternatives** (`shared/alternatives/`): availability is genuinely useful — "a more available alternative to X" is a real user need (the Natto→tempeh case). High value.
- **Stories** (`shared/stories/`): origin enables "the story of this food" narratives (Halloumi → Cyprus). Optional, additive.
- **Seasonal Stories** (`shared/seasonal/`): structured season tags are the natural fuel (Phase 6). High value.
- **Food Wrapped** (future): origin + availability power "you explored 6 cuisines / tried 3 specialist foods this year" — celebratory, retrospective, non-judgemental. This is the **best fit** for the tags, precisely because Wrapped is opt-in and reflective, not in-the-moment.

**Intrusiveness guard:** every engine already forbids verdict language. Tags must remain ranking/candidate signals and celebratory retrospectives — never "you should eat the specialist food."

---

## PHASE 8 — Smart Planner Review

**Should the planner use these tags? How heavily?**

- `availability` and `seasonal` are the two tags with clear planner value: recommend foods the household can actually buy this week, and nudge toward seasonal peak. This directly serves "available / familiar / seasonal / locally accessible."
- Familiarity is **already** a planner concept (`PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md`), household-derived.

**Recommendation:** Planner should use availability/season as a **soft ranking tilt, weighted lightly** — a tiebreaker, not a gate. Hard-filtering by availability would make the planner timid and repetitive (it would never suggest the slightly-adventurous thing, which is half the value). Weight order: dietary/restriction constraints (hard) ≫ nutrition goals ≫ household familiarity ≫ availability/season (light tilt).

---

## PHASE 9 — Surface Impact Review

| Surface | Origin | Availability | Season | Tier (derived) | Verdict |
|---|---|---|---|---|---|
| Dashboard | optional | not recommended | optional | not recommended | Mostly **not recommended** — keep clean |
| Smart Planner | optional | **useful** (light tilt) | **useful** | useful (ranking) | **Useful** |
| Meal Detail | optional | optional | optional | not recommended | **Optional** |
| Cookbook | optional | optional | optional | not recommended | **Optional** |
| Shopping | not recommended | **useful** (seasonal/imported note) | useful | not recommended | **Useful** |
| Analyser | not recommended | not recommended | not recommended | not recommended | **Not recommended** |
| Pantry Explore | **useful** (origin facets) | **useful** (filter) | **useful** | useful | **Useful** — best browse surface |
| Nutrition Report | not recommended | not recommended | not recommended | not recommended | **Not recommended** |
| Discovery | **useful** | **useful** | **useful** | useful (rank) | **Useful** |
| Stories | **useful** (origin narratives) | optional | useful | optional | **Useful** |
| Food Wrapped (future) | **useful** | **useful** | **useful** | useful | **Most useful** |

**Pattern:** tags shine on **exploratory/retrospective** surfaces (Pantry Explore, Discovery, Stories, Wrapped, Planner). They are **noise** on **analytical/clinical** surfaces (Analyser, Nutrition Report, Dashboard).

---

## PHASE 10 — Source of Truth Review

**Decision: `canonical_food` is the single source of truth for food-intrinsic context tags.**

Rationale:
- It is the **identity spine** and a **superset** of `knowledge_foods` — the scaling target for 2k–10k foods.
- It already carries cross-source, non-editorial metadata (`scientificName`, `sourceRef`, `confidence`, `tier`), so context tags belong with their kin.
- The anti-fork lock (`alias_key` UNIQUE) guarantees one food = one tag set; no double-counting.
- `knowledge_foods` stays editorial/display-only (it's a subset; not every catalogue food has an entry).

**Explicit rejections (no parallel systems):**
- ❌ New standalone metadata table — premature; columns on `canonical_food` are additive and simpler. (A join table is justified ONLY for genuinely many-to-many dimensions: cuisine-association and, later, per-market availability.)
- ❌ New taxonomy system — over-engineering for ~5 controlled vocabularies.
- ❌ Leaving tags in TypeScript maps (`CUISINE_SEED`/`SEASON_SEED`) as the *long-term* home — these become **derived/curated views** over the canonical data, not the source. The free-text `knowledge_foods.seasonality` becomes display copy.

**Critical consolidation mandate:** WS0X.3 must not *add* a fourth representation of origin or a third of season. Any implementation must **migrate the existing scattered maps and the free-text field onto the chosen spine**, or explicitly designate one existing representation as canonical and the others as derived. Adding without consolidating is the failure mode.

**Tag homes:**
| Tag | Home | Shape |
|---|---|---|
| `availability` | `canonical_food` column | ordinal enum (UK-scoped) |
| `imported` / `seasonal` / `online_only` | `canonical_food` modifiers | booleans |
| `peak_seasons` | `canonical_food` | small array OR join; reconcile with `SEASON_SEED` |
| `origin_region` | `canonical_food` column | single controlled slug |
| cuisine association | join table (or keep `CUISINE_SEED` as curated view) | many-to-many |
| household familiarity | **household side, derived** | not a food tag |
| recommendation tier | **derived at ranking time** | not stored |

---

## PHASE 11 — Population Strategy

| Scale | Strategy |
|---|---|
| **265 (now)** | Claude-authored, human-reviewed. All five dimensions are tractable by hand for 265 foods. Reconcile against existing `CUISINE_SEED`/`SEASON_SEED`/`seasonality` rather than inventing fresh. |
| **2,000** | Claude-authored in batches via the existing promotion pipeline (`shared/catalogue/promotion-validator.ts`, `promotion-readiness.ts`), with spot-review. Availability + origin_region are coarse enough to author at this scale; season needs editorial care. |
| **10,000+** | Inference-assisted, review-by-exception. USDA/UKFCT provide weak origin signals (`sourceRef` already exists). Availability cannot be inferred reliably — default new catalogue imports to `specialist`/`unknown` and promote to `mainstream`/`common` only on review. |

**Per dimension:**
- **`origin_region`** — Claude can author; USDA/botanical name (`scientificName`) supports it; high confidence, low review burden.
- **`availability`** — Claude can author a coarse UK value; **cannot** be reliably inferred or USDA-sourced; **requires review** at every scale (it's a market judgement, and it ages).
- **`peak_seasons`** — Claude can author for UK; must reconcile with `SEASON_SEED`; editorial review needed (regional/varietal nuance).
- Familiarity / tier — **not populated** (derived).

**Backfill:** none required (DATA IMPACT: writes NO data in this investigation). When implemented, all new columns are nullable with sane defaults → additive, no destructive backfill.

---

## PHASE 12 — Performance Review

- **Storage:** ~3 scalar columns + a small array/join on `canonical_food`. Negligible at 10k rows.
- **Search:** ordinal/enum tags are cheap to index (single b-tree per column). Far cheaper than the existing text/alias matching.
- **Ranking:** tags are read alongside the food row already being fetched — **zero extra round-trips** if columns live on `canonical_food`. This is a decisive argument for columns over a separate table (which would add a join to every ranking query).
- **Planner / discovery queries:** light tilt = arithmetic on already-loaded fields. No measurable cost.
- **The performance trap to avoid:** a separate `food_metadata` table forces a join on every recommendation/discovery/planner read. Columns on the spine avoid this. (Genuinely many-to-many dimensions — cuisine, per-market availability — pay the join, but those are filtered/faceted operations, not per-rank reads.)

---

## FINAL QUESTION — The Three Tags

If THA may add only **three** food-intelligence tags before 2,000 foods:

### 1. `availability` (ordinal, UK-scoped: mainstream | common | specialist | rare)
**Why #1:** It is the **only proposed dimension that does not already exist** in some form — every other tag has a partial home. It directly powers the brief's motivating examples (Jackfruit *high* / Natto *low* suitability), it serves the most surfaces (Planner, Shopping, Pantry Explore, Discovery, Alternatives, Wrapped), and recommendation tier (Phase 5) derives from it for free. Highest marginal value, zero duplication.
**Evidence:** Missing everywhere (Phase 1 audit); maps 1:1 to the brief's suitability examples; subsumes Phase-5 tiers.

### 2. `peak_seasons` (structured: subset of spring/summer/autumn/winter + `imported`)
**Why #2:** Seasonality **already drives recommendations** through `SEASON_SEED`, but in a system that is **disconnected from and inconsistent with** the 40+ free-text `knowledge_foods.seasonality` strings. This tag's value is as much **consolidation as addition** — it ends an existing parallel-system bug and directly fuels Seasonal Stories, Discovery, Planner, and Wrapped.
**Evidence:** Two conflicting representations today (Phase 6); structured map already consumed by 3+ engines; 40+ ungoverned free-text values proving the string can't carry logic.

### 3. `origin_region` (single controlled region slug)
**Why #3:** Enables cuisine/discovery/stories/Wrapped narratives with real per-food data instead of the curated `CUISINE_SEED` subset, and is the **cheapest to populate** (Claude + `scientificName`/USDA, low review burden). Ranked third because cuisine association already has a working curated home — the upside is narrative richness, not a missing capability.
**Evidence:** Partial reverse-indexed home today (Phase 2); high populate-ability (Phase 11); strong Stories/Wrapped fit (Phases 7, 9).

**Explicitly NOT in the top three:**
- **Household familiarity** — already exists, already correct (household-derived); not a food tag (Phase 4).
- **Recommendation tier** — derive from `availability`; storing it duplicates Phase-3 (Phase 5).

**Ranking summary:** `availability` ≫ `peak_seasons` > `origin_region`.

---

## DEFINITION OF DONE — Checklist

- ✅ Origin model reviewed (Phase 2 — split geographic vs cuisine; region single-value)
- ✅ Availability model reviewed (Phase 3 — ordinal, UK-scoped, modifiers separate)
- ✅ Familiarity model reviewed (Phase 4 — household-side, derived, already implemented)
- ✅ Recommendation tiers reviewed (Phase 5 — derive, don't store; not user-facing)
- ✅ Seasonality reviewed (Phase 6 — existing parallel system; structure + declare canonical)
- ✅ Surface impact reviewed (Phase 9 — table)
- ✅ Source of truth defined (Phase 10 — `canonical_food`, no parallel systems)
- ✅ Population strategy defined (Phase 11 — Claude→batch→inference-by-exception)
- ✅ Top tags ranked (Final — availability > peak_seasons > origin_region)
- ✅ No implementation performed

---

## DATA IMPACT

- Reads existing data: **YES**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## SCOPE LOCK

Investigation only. No schema changes. No UI changes. No recommendation changes. None performed.

---

## SUGGESTION — Implementation Opportunities (not authorised here)

1. **Consolidate before adding.** Before any new tag, designate ONE canonical representation for season (reconcile `knowledge_foods.seasonality` free text vs `SEASON_SEED`) and one for origin (`CUISINE_SEED` vs a food-level field). Eliminating the existing fork is higher-value than new tags.
2. **Add `availability` to `canonical_food`** as a nullable ordinal enum + `imported`/`seasonal`/`online_only` boolean modifiers. UK-scoped, documented as such. Additive, no backfill.
3. **Structure `peak_seasons`** on `canonical_food` and make `SEASON_SEED` a derived/curated view; demote the free-text `seasonality` to display copy.
4. **Add `origin_region`** (controlled slug) sourced from Claude + `scientificName`; keep cuisine association as a many-to-many (curated map or join), not a scalar.
5. **Derive recommendation tier and global familiarity at query time** from availability (+ household signals). Never store them as food columns.
6. **Enrich household familiarity sources** (meals → pantry → planner → shopping) feeding the existing `enjoys[]` set — separate household-capability track per `PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md`.
7. **Keep tags off clinical surfaces** (Analyser, Nutrition Report, Dashboard); use them on exploratory/retrospective surfaces (Pantry Explore, Discovery, Stories, Planner, future Food Wrapped).
8. **Prefer columns over a metadata table** for scalar tags to avoid per-rank joins; reserve join tables for genuinely many-to-many dimensions (cuisine, future per-market availability).
