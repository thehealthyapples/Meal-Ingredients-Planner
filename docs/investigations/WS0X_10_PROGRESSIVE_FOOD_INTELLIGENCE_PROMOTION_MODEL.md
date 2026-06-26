# WS0X.10 — Progressive Food Intelligence Promotion Model

**Classification:** 🟡 AMBER — Architecture investigation only
**Date:** 2026-06-25
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Status:** Investigation complete — no implementation, no data changes, no architecture changes, no promotions
**Governing documents:** WS0X_FOOD_INTELLIGENCE_EXPANSION_PROGRAM.md · WS0X_8_FOOD_INTELLIGENCE_DATA_EXPANSION_PROGRAM.md · WS0X_9_FOOD_INTELLIGENCE_MASS_PROMOTION_STRATEGY.md · THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/ws0x10-progressive-fi-20260625` |
| Tag object | `9812346` |
| Points to | HEAD commit `a8a912a` — *feat(ws0x7): Ingredient Resolution Engine Completeness Program* |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Rollback command | `git checkout rollback/ws0x10-progressive-fi-20260625` |
| Working tree at investigation start | 46 entries: 17 modified tracked files (UI + services from prior workspaces) + untracked investigation docs and new catalogue modules. **No food data written by this investigation.** |

Git status was **not clean** at start (active in-progress work from WS0X.5–WS0X.9). Because this task is investigation-only and writes exactly one new markdown file, the rollback tag at HEAD is sufficient protection; the in-progress working tree was left untouched. No investigation began before the tag was confirmed present.

---

## EXECUTIVE SUMMARY

THA today runs a **complete-before-visible** promotion model: a food cannot enter the canonical spine until it carries fully-authored food context (`availability`, `peakSeasons`, `originRegion`). `validateCanonicalSeed()` *refuses to seed* any canonical food missing context, and `validatePromotion()` returns a **hard block** for any promotion candidate without it. This gate, not the canonical system itself, is the rate-limiter on growth (confirmed in WS0X.9).

**The investigation finds that a Progressive Food Intelligence model is safe, already 80% supported by the existing architecture, and would materially accelerate the journey to 2,000+ foods.** The decisive evidence:

1. **The presentation layer already hides absent data.** `meal-food-intelligence.ts` returns `EMPTY` on no coverage; origin chips suppress generic/unknown regions; availability notes only render for `specialist`/`rare`; per-ingredient intelligence is only emitted when it has content. Missing enrichment is *invisible*, not blank.
2. **The schema is already nullable where enrichment lives.** `originRegion` is explicitly documented as "`null` = honest gap." `availability`, `peakSeasons`, `subcategory`, `description`, `scientificName` are all nullable. The spine was *designed* to hold partially-populated foods.
3. **The visibility scaffolding already exists.** `canonical_food.status` (`active | draft | merged | retired`) and `canonical_food.tier` (`canonical | catalogue`) are live columns built for exactly this staging.

The only thing standing between THA and progressive enrichment is **two validation rules** — the seed-time context requirement and the promotion-time context hard-block — *not* the schema, the source-of-truth model, or the UI.

**Recommendation: Option C — Hybrid model. Mandatory Level 1 (canonical identity + aliases + nutrient link), with food context and editorial richness as optional, progressively-added enrichment.** This preserves the single source of truth and every anti-fork lock, requires no schema change, and unblocks automated Level 1 promotion against the already-validated USDA set.

---

## PART 1 — CURRENT PROMOTION ANALYSIS

### 1.1 The promotion pipeline (two gates)

A food becomes "visible everywhere" in THA only after clearing **two independent gates**:

**Gate A — Promotion validation** (`shared/catalogue/promotion-validator.ts`, `validatePromotion()`), applied per-candidate when promoting from a data source (e.g. USDA) into the spine. Returns one of: `auto_promote` · `h1_qualify` · `needs_review` · `blocked`.

**Gate B — Seed integrity** (`shared/canonical/index.ts`, `validateCanonicalSeed()`), applied at build/seed time over the whole canonical seed. The seed runner (`server/seeds/seed-canonical-food.ts`) **refuses to seed** if it returns any problem.

### 1.2 Field inventory

| Field | Table / location | Mandatory today? | Gate that enforces it | Why it exists |
|-------|------------------|------------------|----------------------|---------------|
| `slug` | `canonical_food` | **Yes** (`notNull`, unique) | Schema | Identity key; the anti-fork primary identity. |
| `name` | `canonical_food` | **Yes** (`notNull`) | Schema | Display + resolution. |
| `category` | `canonical_food` | **Yes** (`notNull`) | Schema | Plant-food classification, grouping, discovery. |
| `subcategory` | `canonical_food` | No (nullable) | — | Finer grouping; cosmetic. |
| `description` | `canonical_food` | No (nullable) | — | Editorial copy. |
| `knowledgeFoodSlug` | `canonical_food` | No (nullable FK) | FK validity only | Link OUT to WS0 nutrient/benefit editorial. |
| `diversityGroupSlug` | `canonical_food` | No (nullable FK) | FK validity only | What Plant Diversity counts once. |
| `status` | `canonical_food` | Defaulted `active` | — | Lifecycle (active/draft/merged/retired). |
| `tier` | `canonical_food` | Defaulted `canonical` | — | Provenance (editorial vs imported catalogue). |
| `availability` | `canonical_food` | **Effectively yes** | **Gate A + Gate B** | UK retail reach (ordinal). |
| `peakSeasons` | `canonical_food` | **Effectively yes** | **Gate A + Gate B** | UK seasonality fact owner. |
| `originRegion` | `canonical_food` | **Effectively yes** (may be `null`, but the *record* must exist) | **Gate A + Gate B** | Geographic/botanical origin. |
| `availabilityModifiers` | `canonical_food` | Defaulted `{}` | — | Orthogonal flags. |
| Nutrient links | `knowledge_food_nutrients` | No (food can have zero) | — | Powers Nutrition Report / Meal Detail. |
| Benefit links | `knowledge_food_benefits` | No | — | Powers benefit chips. |
| Aliases | `canonical_food_alias` | No, but **unique `alias_key`** | Gate B (anti-fork) | Resolution; one string → at most one food. |

### 1.3 The blocking dependency

The single **blocking dependency** that creates "complete-before-visible" is the **food-context requirement**:

- **Gate A**, `validatePromotion()` lines 203–224: for an H1-allowed slug, `getFoodContext()` returning `undefined` → `status: "blocked"`, reason *"Missing food context… Pre-stage availability / peak_seasons / origin_region in FOOD_CONTEXT_SEED before promoting."* Invalid context → also `blocked`.
- **Gate B**, `validateCanonicalSeed()` lines 163–170: every canonical food lacking a `FOOD_CONTEXT_SEED` entry produces *"missing food context"*, and the seed runner aborts.

Everything else (nutrients, benefits, description, varieties, origin precision) is already optional. **Food context is the only hard prerequisite beyond bare identity.** This matches WS0X.9's finding that context authoring — not the canonical machinery — is the growth bottleneck.

### 1.4 Why each requirement exists (and whether it must gate *visibility*)

| Requirement | Genuine purpose | Must it block visibility? |
|-------------|-----------------|---------------------------|
| `slug`/`name`/`category` | Identity, resolution, classification | **Yes** — without these a food cannot be referenced or counted. |
| Unique `alias_key` | Anti-fork: one string → one food | **Yes** — this is a correctness invariant, not enrichment. |
| Prepared/composite + brand blocks | Keep the spine to whole foods | **Yes** — these are *exclusion* rules, cheap, and protect trust. |
| `availability` | Surface "specialist/rare" notes; derive recommendation tier | **No** — UI already hides it unless specialist/rare. |
| `peakSeasons` | Seasonal highlights | **No** — UI already hides when not in season. |
| `originRegion` | Origin chips | **No** — UI already suppresses generic/unknown origins; `null` is a sanctioned honest gap. |

**Conclusion:** the context gate enforces *editorial completeness*, not *user-facing correctness*. The features that consume context already degrade silently. The gate is therefore stricter than the trust philosophy requires.

---

## PART 2 — MINIMUM VIABLE FOOD (MVF)

### 2.1 Definition

A food is **useful** the moment it can be **resolved, identified, classified, and counted**. That requires only:

| MVF field | Source | Cost to produce |
|-----------|--------|-----------------|
| `slug` | Derived from name | Automated |
| `name` | Source dataset | Automated |
| `category` | Mapped from source category | Automated (mapping table) |
| ≥1 `alias` (singular/plural) | Derived | Automated |
| `diversityGroupSlug` *(if a plant)* | Mapped/derived | Automated + light review |
| `knowledgeFoodSlug` → ≥1 nutrient *(strongly desirable)* | WS0 editorial or source import | Semi-automated |

That is the whole MVF. No availability, no season, no origin, no description, no storage guidance, no benefit prose.

### 2.2 Does MVF already enable the core features? (evidence)

| Feature | Needs from a food | MVF sufficient? | Evidence |
|---------|-------------------|-----------------|----------|
| **Meal Detail — ingredient resolution** | slug + aliases | **Yes** | `item-resolver.ts` / canonical `resolver.ts` resolve on identity + `alias_key` alone; no context read. |
| **Meal Detail — Food Intelligence section** | whatever exists; hides the rest | **Yes** | `meal-food-intelligence.ts` returns `EMPTY` / omits per-ingredient entries with no content; section hides gracefully (line 11). |
| **Nutrition Report** | knowledge food + nutrient links | **Yes, if nutrients linked** | `nutrition-knowledge-registry.ts` reads `knowledge_food_nutrients`; a food with zero nutrients simply contributes nothing. |
| **Planner** | identity (slug/name) | **Yes** | Planner references foods by identity; carries no context dependency. |
| **Discovery ("similar")** | category / diversity group | **Yes** | `discover()` keys off identity + grouping; context is optional ranking input. |
| **Plant Diversity** | `diversityGroupSlug` | **Yes** | Counts at group level; needs no context, nutrients, or prose. |
| **Ingredient Intelligence (per-ingredient)** | nutrients OR seasonality; emitted only if present | **Yes** | Line 236: pushed only when `nutrients.length > 0 || isSeasonal`. |

**Verdict:** MVF (identity + aliases + nutrient link) **already powers Meal Detail, Nutrition Report, Planner, Discovery, Plant Diversity and Ingredient Intelligence.** None of these require `availability`, `peakSeasons`, or `originRegion`. Those three fields enrich exactly three optional surfaces (origin chip, seasonal highlight, rarity note) that are *already* conditionally hidden.

---

## PART 3 — PROGRESSIVE ENRICHMENT LEVELS (recommended model)

Three levels. Each is a strict superset of the prior. A food is **visible from Level 1**; later levels only *add* surfaces, never gate existing ones.

### Level 1 — Identity & Nutrition (MVF) — *required for visibility*
- Canonical identity: `slug`, `name`, `category`
- ≥1 alias (resolution coverage)
- Diversity group (if plant) — enables the 30-plants counter
- Knowledge link + ≥1 nutrient (enables Nutrition Report / Meal Detail nutrients)
- Passes exclusion gates (not prepared/composite, not branded)

> **Unlocks:** resolution, Meal Detail nutrients, Nutrition Report, Planner, Plant Diversity, basic Discovery.

### Level 2 — Context & Provenance — *optional enrichment*
- `availability` (+ modifiers)
- `peakSeasons`
- `originRegion` (`null` permitted as an honest gap)
- Benefit links (`knowledge_food_benefits`)

> **Unlocks:** seasonal highlights, origin chips, rarity notes, benefit chips, Simply Better Choices ranking signals, richer Discovery.

### Level 3 — Editorial Richness — *optional enrichment*
- `description`, `commonForms`, `storageGuidance`
- Varieties
- Pairings, stories, sustainability, educational content
- Image

> **Unlocks:** full food-detail editorial, pairing/story surfaces, Food Wrapped narrative depth.

**Why this shape (and not the prompt's example):** the prompt's example put *nutrients* in Level 1 and *health benefits* in Level 2 — this model agrees, because nutrients are factual and largely importable while benefit prose is editorial. It deliberately moves `availability`/`season`/`origin` **out of the visibility gate into Level 2**, because the codebase proves these are already optional at the presentation layer. It keeps Level 1 to the genuine correctness minimum (identity + anti-fork alias + classification), which is the smallest set that is *useful and never wrong*.

---

## PART 4 — FEATURE DEPENDENCY MATRIX

Minimum enrichment level that unlocks each feature (✓ = fully works; ◐ = works, richer with more):

| Feature | L1 (Identity + Nutrients) | L2 (Context) | L3 (Editorial) |
|---------|:--:|:--:|:--:|
| Meal Detail — resolution | ✓ | ✓ | ✓ |
| Meal Detail — nutrients/benefits | ◐ (nutrients) | ✓ (+benefits) | ✓ |
| Meal Detail — origin / season / rarity chips | — | ✓ | ✓ |
| Pantry Explore | ◐ | ◐ | ✓ (full detail) |
| Nutrition Report | ✓ | ✓ | ✓ |
| Planner | ✓ | ✓ | ✓ |
| Shopping | ✓ (identity/aliases) | ◐ (availability aids) | ✓ |
| Discovery ("similar"/grouping) | ✓ | ◐ (context-ranked) | ◐ |
| Simply Better Choices | ◐ (nutrient signal) | ✓ (context/season signal) | ✓ |
| Food Wrapped | ◐ (counts/nutrients) | ◐ (seasonal/origin colour) | ✓ (narrative) |
| Plant Diversity counter | ✓ (diversity group) | ✓ | ✓ |
| Future AI recommendations | ◐ (identity/nutrients) | ✓ (context features) | ✓ (full corpus) |

**Reading:** every "spine" feature (resolution, nutrition, planner, diversity, shopping) is fully unlocked at **Level 1**. Level 2/3 enrich peripheral chips and ranking quality but gate **no** core feature. This is the structural justification for moving the visibility threshold to Level 1.

---

## PART 5 — TRUST REVIEW

THA's principle: **useful before complete · never inaccurate · never misleading · never fabricated.** Progressive enrichment must not let a food *imply knowledge that does not yet exist*.

| Risk | Present in this model? | Safeguard (mostly already in code) |
|------|------------------------|-------------------------------------|
| Showing a blank "Origin: —" | No | `meal-food-intelligence.ts` only pushes origin when present and non-generic (lines 158–167); `SUPPRESS_ORIGINS` drops `global`/`uk`/`europe`. |
| Showing "Season: unknown" | No | Seasonal highlight only emitted when the food is in the current season's set. |
| Implying rarity data exists for all | No | Availability note renders only for `specialist`/`rare` (lines 169–173). |
| Fabricating origin to satisfy a gate | No | `originRegion: null` is a sanctioned honest gap; nothing infers a region. **Automation must never guess origin.** |
| Inconsistent experience (food rich in one place, bare in another) | Low | All surfaces read the *same* single source; a missing field is uniformly absent everywhere, not contradictory. |
| Nutrient/benefit confidence leaking | No | `evidenceStrength` is storage-only and stripped before UI (registry `…removed. Safe to pass to the UI`). |

**Net:** the model's trust posture is *equal to or stronger than* today's, because it relies on the exact suppression logic already shipped. The one new discipline required: **Level 1 automation may import identity, category, and nutrients, but must leave context fields `null`/empty rather than inferring them.** Empty stays hidden; guessed values would be the only way this model could mislead, and it explicitly forbids them.

**Optional hardening:** gate any *prose* (description, stories, pairings) behind `status = active` + THA approval, so imported Level 1 foods surface facts and identity but never unreviewed editorial voice.

---

## PART 6 — PERFORMANCE IMPACT (roadmap comparison)

Baselines from WS0X.9: **249 canonical / 265 knowledge foods**; USDA holds **~2,075 already-validated ingredient-level foods**. Under today's model the throttle is *context authoring* — three human-authored fields per food.

| Milestone | Current (complete-before-visible) | Progressive (Level 1 visible) |
|-----------|-----------------------------------|-------------------------------|
| **500 foods** | 2–3 weeks (context authoring per food) | **Days** — Level 1 is automatable (identity + category map + nutrient import); no per-food context authoring on the critical path. |
| **1,000 foods** | ~6–8 weeks | **1–2 weeks** — bounded by category-mapping review + nutrient import QA, not context prose. |
| **2,000 foods** | 3–4 months | **3–5 weeks** — essentially the full validated USDA ingredient set at Level 1. |
| **5,000–10,000** | Requires a second source (UK NDB) regardless | Same second-source dependency; but Level 1 ingestion of that source is likewise fast. |

**Why the speed-up is real, not nominal:** context authoring is a *serial human* task (≈ the dominant per-food cost). Removing it from the visibility critical path converts promotion from human-rate to import-rate for the bulk of the catalogue, while context is back-filled *in parallel* on already-live foods. Enrichment no longer blocks reach; reach no longer waits on enrichment.

**Caveat:** the win is conditional on Level 1 nutrient coverage. A food with identity but no nutrients is visible but thin. Sequencing should prioritise foods where USDA nutrient data imports cleanly, so Level 1 foods are useful (nutrients) on day one.

---

## PART 7 — CANONICAL ARCHITECTURE REVIEW

| Property | Preserved under progressive model? | Notes |
|----------|:--:|-------|
| Single source of truth | **Yes** | All fields still live on `canonical_food` / WS0 join tables. No new store. Enrichment fills the *same* rows over time. |
| Anti-fork lock (unique `alias_key`) | **Yes** | Unchanged; still enforced at L1. One string → one food, always. |
| Plant-diversity-at-group-level | **Yes** | Diversity group is an L1 field; counting integrity intact. |
| No duplicate systems | **Yes** | No parallel "draft store." The existing `status`/`tier` columns express stage. |
| No parallel workflows | **Yes** | Same seed → same validator → same tables. Only the *strictness* of two rules changes. |

**Required changes (validation only, no schema):**
1. `validateCanonicalSeed()` — relax the "missing food context" error so it is **not** fatal for foods at Level 1 (e.g. permitted when `status = 'draft'` or `tier = 'catalogue'`, or simply downgraded to a non-blocking *coverage warning*). Keep it enforced for foods marked Level-2-complete.
2. `validatePromotion()` — change the context-missing outcome from `blocked` to a **`needs_review`/`level_1` pass** that promotes identity+nutrients and flags context as pending, instead of refusing promotion.

Both are edits to *rules*, not to tables or columns. `status` and `tier` already exist to carry the stage signal. **No architectural change is required; the architecture already anticipated this.**

---

## PART 8 — EDITORIAL WORKFLOW

A single forward-only pipeline; foods accrete enrichment without rework.

```
 SOURCE (USDA / UK NDB)
        │  automated
        ▼
 L1 PROMOTION  ── identity, category-map, aliases, nutrient import
        │        context fields left NULL/empty (never guessed)
        ▼
 LIVE @ Level 1  ── visible, useful, facts-only
        │  parallel, non-blocking
        ▼
 L2 ENRICHMENT  ── availability / season / origin / benefits
        │        THA-reviewed (context + benefits are editorial judgement)
        ▼
 L3 ENRICHMENT  ── description, forms, storage, varieties, stories, pairings
                   THA-authored / approved
```

| Concern | Decision |
|---------|----------|
| **Automatable** | slug, name, category mapping, aliases (singular/plural), nutrient links from source, scientific name, source ref. |
| **Requires THA approval** | category-map *exceptions*, all context (availability/season/origin — judgement + UK-specific), benefit associations, every prose field, varieties. |
| **How updates flow** | Always forward into the *same* canonical row / join tables. Enrichment is an UPDATE by slug (the seed runner is already idempotent upsert-by-slug). No migration of the food between stores. |
| **Audit history** | Preserve via the existing `source` / `sourceRef` / `confidence` columns + git history of the seed files (every enrichment is a reviewable seed diff). Optionally add `enrichmentLevel` / `contextStatus` as a derived/recorded marker. Identities are never deleted — `status` retires them (already the rule). |

No duplicated effort: a food authored at L1 is never re-created; L2/L3 are additive edits to its existing record.

---

## PART 9 — RECOMMENDATION

**Adopt Option C — Hybrid: mandatory Level 1, optional progressive enrichment.**

| Option | Verdict |
|--------|---------|
| **A — keep complete-before-visible** | Rejected. The context gate is stricter than the trust philosophy requires (the UI already hides absent context), and it is the confirmed growth bottleneck. |
| **B — pure staged visibility (everything optional, including identity)** | Rejected. Identity, anti-fork aliases, and classification are *correctness* invariants, not enrichment — they must stay mandatory. |
| **C — hybrid: mandatory L1, optional L2/L3** | **Recommended.** Smallest mandatory set that is useful and never wrong; everything else accretes safely over time. |

**Supporting evidence, in one line each:**
- The presentation layer *already* hides every Level-2/3 field when absent (`meal-food-intelligence.ts`).
- The schema is *already* nullable for all Level-2/3 fields; `originRegion: null` is a sanctioned honest gap.
- The staging columns (`status`, `tier`) *already* exist.
- Only **two validation rules** change; **zero** schema/UI/source-of-truth changes.
- It converts bulk promotion from human-rate to import-rate, compressing "2,000 foods" from ~3–4 months to ~3–5 weeks (Part 6).

---

## TRUST CHECK

> **Could this ever cause users to believe THA knows more than it actually does?**

**No — provided the one rule in Part 5 holds: Level 1 automation imports facts (identity, category, nutrients) and leaves context fields empty rather than inferring them.**

How it is prevented:
1. **Absence is invisible, never blank.** Every context-derived surface already renders only when data is present and meaningful (origin suppression, seasonal-set membership, specialist/rare-only availability). A Level 1 food simply shows fewer chips — it never shows an empty or placeholder one.
2. **No fabrication path.** Nothing in the proposed pipeline infers origin, season, or availability. `null`/`[]` are first-class honest gaps already modelled in the schema.
3. **Facts only at Level 1.** Nutrients are imported factual data, not editorial claims; benefit *prose* and stories stay behind THA approval (L2/L3), so unreviewed editorial voice never ships early.
4. **One source, uniform absence.** Because all surfaces read the same record, a missing field is absent *consistently* everywhere — no surface contradicts another.

The only way this model could mislead is by *guessing* context to satisfy a gate. The model explicitly forbids that and removes the gate that would tempt it. Net trust posture: **equal to or stronger than today's.**

---

## DEFINITION OF DONE

| Criterion | Status |
|-----------|:--:|
| Current promotion pipeline analysed | ✓ (Part 1) |
| Minimum viable food defined | ✓ (Part 2) |
| Progressive enrichment model proposed | ✓ (Part 3) |
| Feature dependency matrix completed | ✓ (Part 4) |
| Trust implications assessed | ✓ (Part 5, Trust Check) |
| Editorial workflow proposed | ✓ (Part 8) |
| Timeline comparison completed | ✓ (Part 6) |
| Single recommendation made | ✓ (Option C, Part 9) |
| Project file created | ✓ (this file) |

---

## DATA IMPACT

| Question | Answer |
|----------|--------|
| Reads existing data | YES (source files only; no DB writes) |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Promotes any food | NO |
| Modifies canonical architecture | NO |
| Modifies UI | NO |

---

## SUGGESTION — implementation opportunities (NOT executed here)

Listed for a future, separately-classified implementation workspace:

1. **Relax the two gates.** Downgrade the `validateCanonicalSeed()` context check from fatal to a coverage warning for `status='draft'`/`tier='catalogue'` foods; change `validatePromotion()`'s context-missing outcome from `blocked` to a Level-1 pass with a `context_pending` flag.
2. **Record enrichment stage explicitly.** Consider a derived/stored `enrichmentLevel` (1/2/3) or reuse `status`/`contextStatus` so dashboards can report L1/L2/L3 coverage as the catalogue grows.
3. **Build the L1 automated importer** against the WS0X.9 validated USDA ingredient set: identity + category map + alias derivation + nutrient import, context left empty.
4. **Add an L1 nutrient-coverage guard** so Level 1 foods ship with ≥1 nutrient where source data allows (keeps "useful", not merely "visible").
5. **Coverage dashboard** over `FOOD_CONTEXT_COVERAGE` (already computed in `shared/canonical/index.ts`) extended to report per-level completeness, so context back-fill can be prioritised on already-live foods.
6. **Editorial queue** that surfaces live Level 1 foods lacking context/benefits/prose for THA review, turning back-fill into a steady parallel workflow rather than a promotion blocker.

---

*End of WS0X.10 investigation. No data, schema, architecture, UI, or food promotions were changed. Rollback available at `rollback/ws0x10-progressive-fi-20260625`.*
