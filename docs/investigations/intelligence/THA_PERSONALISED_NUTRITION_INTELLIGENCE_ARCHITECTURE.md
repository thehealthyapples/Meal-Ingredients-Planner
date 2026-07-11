# THA Personalised Nutrition Intelligence Architecture

**Document type:** Architecture investigation (**investigation only — no implementation**).
**Date:** 2026-06-18
**Author role:** Senior nutrition-education product architect + senior React/Node/Postgres engineer.
**Companion documents (read together):**
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the curated Global Knowledge content model + the **nutrient bridge** trust rule. This document treats that as the canonical Global layer.
- `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` — the database-backed, review-gated graduation of the Global registry (candidate → review → published).
- `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` — sourcing, EFSA wording, automation guardrails.
- `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` — weekly aggregation + "separate but connected" surface rule.
- `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` — Tier A / Tier B framing; plant taxonomy.

> **Scope of this document.** This is the **synthesis layer** that sits on top of all five prior
> investigations. It does not redesign Global Knowledge or the KMS — it answers the one question those
> documents deliberately left open: **how does THA combine trusted Global Nutrition Knowledge with
> private Household Understanding to help a family make better decisions, without ever pretending
> certainty?**

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/nutrition-intelligence-arch-20260618` |
| **Tag object SHA** | `3b3af8978148b7030ab6a3c08e5811a6ff2001db` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/nutrition-intelligence-arch-20260618` |
| **Undo this doc only** | `rm docs/investigations/intelligence/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status checked.** No tracked files modified or staged. Five pre-existing untracked
   investigation artefacts were present (`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`,
   `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md`,
   `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md`,
   `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md`,
   `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`). The committed tree is clean; these predate this
   task and are untouched by it.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/nutrition-intelligence-arch-20260618` (annotated, object `3b3af89`) at `bae3b99`.
4. ✅ **Rollback identifier reported** (above) **before** any investigation work.

**This task makes no code, CSS, route, schema, API, migration, or data change.** It produces exactly
two artefacts: this markdown file and one annotated git tag. Full confirmation in §13 and the Final Report.

---

# SECTION 1 — EXECUTIVE SUMMARY

THA has, across five prior investigations, built or designed two halves of a brain that have never been
formally connected:

- **Global Knowledge** — generic, source-backed, human-reviewed nutrition truth:
  `Health Benefit → Nutrient → Food → Nutrition Context → Meal → Action`. It knows nothing about any
  specific family. (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, the KMS.)
- **Household Knowledge** — private, per-family understanding: eaters, restrictions, diet patterns,
  likes/dislikes, favourite meals, shopping history, plant diversity, Simply Better Choices history,
  Weekly Nutrition Reports. (`household_eaters`, `household_members`, `shopping_list`,
  `shopping_fulfilment_memory`, planner tables.)

**The central finding: the combination must be a one-directional join, computed at request time, and
never written back into Global Knowledge.** Global Knowledge stays completely generic. Household
Knowledge is the *lens*. The recommendation engine is a **join + rank + explain** function — not a
model that "knows" things. This is the single most important architectural decision in the document,
and it is what keeps THA truthful: **THA never invents nutrition facts and never invents facts about
your family. It only intersects two sets of facts it already holds, and shows its working.**

**The second finding: the honest version of this product is a *retrieval-and-ranking* engine, not a
generative one.** Every recommendation THA makes is a row that already exists in curated Global data,
filtered by household facts, ranked by transparent signals, and rendered with its provenance attached.
There is no step where a language model authors a nutrition claim. This is what the brief calls "not an
AI pretending certainty" — and it is achievable today with deterministic code over the data THA already
has. (An LLM may *phrase* an already-decided, already-cited recommendation in Stage 4+, but it never
*decides* one. See §4.6 and §11.)

**The third finding: the trust boundary is not a feature flag — it is a *vocabulary*.** THA helps you
*add* and *choose*, never *diagnose*, *dose*, or *predict illness*. The difference between "Pumpkin
seeds are a source of magnesium, which supports normal muscle function — you don't currently eat them"
(allowed) and "You are magnesium deficient, take a supplement" (forbidden) is the entire product. The
nutrient bridge from the Health Benefits investigation already enforces half of this; this document
extends it from a *content* rule to a *recommendation* rule.

**Recommendation in one line:** Build a **deterministic, explainable retrieval-and-ranking
recommendation engine** that joins generic Global Knowledge to private Household Knowledge at request
time, ranks candidates by a small set of transparent signals, attaches a "why am I seeing this?"
provenance chain to *every* card, enforces an `add / choose-better` (never `diagnose / dose / predict`)
trust vocabulary, and grows along a five-stage roadmap from static lists to a learning companion —
where learning only ever **re-weights** transparent signals and never **authors** new facts.

**Confidence: High** on the architecture (it is a thin synthesis of already-validated layers). **Medium**
on the long-term learning stages, which depend on data volume THA does not yet have and should be
deferred behind explicit gates.

---

# SECTION 2 — GLOBAL KNOWLEDGE MODEL

## 2.1 The canonical chain (unchanged from prior work)

Global Knowledge is the generic, source-backed spine. It is the same chain the brief states, and it is
already partially real in code:

```
Health Benefit
   │  (Benefit → Nutrient links — curated, source-backed; the "nutrient bridge")
   ▼
Nutrient
   │  (Food → Nutrient data — curated: nutrition-benefit-library.ts, ~24 foods / ~23 nutrients)
   ▼
Food
   │  (Nutrition Context — pantry-knowledge.ts: goodToKnow / howToChoose / whyItMatters)
   ▼
Nutrition Context  ── Best Time · Best Pairings · Things To Be Aware Of
   │
   ▼
Meal  (a composition of Foods)
   │
   ▼
Action  (the verb THA offers: Add · Swap · Choose Better · Pair)
```

**The nutrient bridge is the load-bearing trust device and is carried forward verbatim.** THA never
authors a per-food health claim ("kiwi helps you sleep"). It authors two *separately sourced* facts:

1. `Benefit → Nutrient`: "Sleep Quality is associated with **Magnesium**" (cited to NIH/EFSA-permitted wording).
2. `Food → Nutrient`: "Pumpkin seeds are **a source of magnesium**" (cited to USDA/composition data).

The product *composes* them at display time. Composition is transparent and reversible; an authored
claim is neither. **Every personalised recommendation in this document is a composition, never an
assertion.**

## 2.2 The data shapes (as they exist / as designed)

| Entity | Status today | Where | Key fields |
|---|---|---|---|
| Food → Nutrients + summary | ✅ REAL, curated | `nutrition-benefit-library.ts` | `name, category, keyNutrients[], summary` |
| Nutrition Context | ✅ REAL (proto) | `pantry-knowledge.ts` | `goodToKnow, howToChoose, whyItMatters` |
| Plant taxonomy (9 cats) | ✅ REAL | `nutrition-variety.ts` | category detection |
| Boost candidates | ✅ REAL | `nutrition-boosts.ts` (`BOOST_LIBRARY`) | `name, category` across 8 groups |
| Benefit → Nutrient registry | 🟡 DESIGNED | KMS / Health Benefits doc | the missing curated content |
| Best Time / Pairings / Aware-of | 🟡 DESIGNED | Nutrition Context registry | structured context fields |
| Published knowledge snapshot | 🟡 DESIGNED | KMS | review-gated, versioned |

Two layers are real and curated; the connective registries are designed and review-gated. **This
investigation assumes the KMS published snapshot is the only thing the recommendation engine reads.**

## 2.3 The decisive question — *Should Global Knowledge ever know about households?*

**No. Never. This is a hard architectural rule, not a preference.**

Global Knowledge must remain **completely generic, household-agnostic, and identical for every user on
the planet.** Reasons:

1. **Truth integrity.** A magnesium fact is true regardless of who reads it. The moment Global rows are
   shaped by one family's data, they stop being citable, shareable, and reviewable. The KMS review gate
   (human approves generic facts) becomes meaningless if facts are per-household.
2. **Privacy.** If Global Knowledge "knew" households, household data would leak into a shared layer.
   Keeping Global generic means the private layer never has to cross into the shared layer.
3. **Cache & scale.** Generic knowledge is cacheable once for everyone. Household-shaped knowledge would
   be N× the storage and uncacheable.
4. **Auditability.** "Why did THA say this?" must always decompose into *(a generic, cited fact) × (a
   private household fact)*. If the generic half were already personalised, the audit chain collapses.

> **Rule G1 — Generic Knowledge Wall.** Global Knowledge is read-only, household-agnostic, and flows
> *only* downward into the recommendation engine. Nothing about a household is ever written into,
> inferred into, or used to re-rank the Global registry itself. Personalisation happens *entirely* in
> the join layer (§4), never in the knowledge layer.

This mirrors the KMS "hard wall" between discovered and published — we now add a second wall between
*generic* and *personalised*.

---

# SECTION 3 — HOUSEHOLD KNOWLEDGE MODEL

## 3.1 Canonical household model

Household Knowledge is private, per-family, mutable, and **never sourced or cited** — it is *observed*,
not *asserted*. It already has real foundations in `shared/schema.ts` and `shared/household-eater.ts`.

```
Household (households)
├── Members (household_members)            role: owner / admin / member; account-level
├── Eaters  (household_eaters)             the PEOPLE meals are planned for
│     ├── displayName
│     ├── kind: "user" | "child"
│     ├── defaultDietTypes[]   (SOFT — overridable per meal/week)
│     └── hardRestrictions[]   (HARD — allergies/medical/religious; never overridable)
│
├── Per-eater preferences   (DESIGNED — see 3.3)
│     ├── likes[]            (observed + declared)
│     ├── dislikes[]         (observed + declared)
│     ├── goals[]            (declared interests, e.g. "Better Sleep")
│     └── health interests   (declared, soft)
│
├── Household behaviour (observed — already partly real)
│     ├── Favourite / repeated meals      (planner entries + frequency)
│     ├── Shopping history                (shopping_list, shopping_list_extras)
│     ├── Fulfilment memory               (shopping_fulfilment_memory)
│     ├── Plant Diversity (weekly)        (nutrition-variety + week aggregation)
│     ├── Simply Better Choices history   (accepted/rejected boosts)
│     └── Weekly Nutrition Reports        (aggregation shell output)
```

## 3.2 The decisive question — *What belongs per-person vs per-household?*

This is the most consequential modelling decision in the household layer. The answer is a clean split
along one axis: **safety and identity are per-person; behaviour and logistics are per-household.**

| Belongs **per-person (eater)** | Belongs **per-household** |
|---|---|
| Hard restrictions (allergy, medical, religious) — **safety-critical** | Shopping history & fulfilment memory |
| Soft diet types / patterns (vegetarian, low-UPF) | Favourite / repeated meals (shared cooking) |
| Likes & dislikes (taste is personal) | Plant Diversity score (the family eats plants together) |
| Goals & health interests ("better sleep") | Weekly Nutrition Report (a household story) |
| Age band / life-stage (child vs adult) → context gating | Simply Better Choices acceptance history (who cooks?) |

**Why this split:**

- **Hard restrictions MUST be per-person and MUST aggregate to the strictest union when a meal is
  shared.** A nut allergy on one child constrains the whole meal. The existing `EffectiveDietProfile`
  resolution and the household-vegan/vegetarian hard-enforcement tests already encode this — the
  recommendation engine inherits it unchanged. **A recommendation that violates any present eater's
  hard restriction must never be generated, ranked, or shown.** (Rule T0, §9.)
- **Taste (likes/dislikes) is irreducibly personal** but **meals are cooked for the household.** So
  recommendations must reconcile: a boost disliked by the cook's child is down-ranked for a *shared*
  meal but fine for that adult's solo lunch. The `plannerEntryEaters` join already tells us who eats
  what.
- **Goals are per-person, but the household is the unit of action.** "I want better sleep" is the
  parent's goal; the shopping that serves it is the household's. THA should attribute goals to a person
  and *act* at the household level — and say so ("Pumpkin seeds — for your sleep goal").

> **Rule H1 — Strictest-union safety.** For any meal with multiple eaters, the active hard-restriction
> set is the **union** of all present eaters' hard restrictions. Soft preferences and likes are
> **intersected/weighted**, never unioned into hard filters.

> **Rule H2 — Observed ≠ Asserted.** Household facts are *observations* ("you bought oats 6 times").
> THA may state them back to the user ("you already eat oats") but must never elevate an observation
> into a health assertion ("you eat enough fibre"). Counting is allowed; clinical judgement is not.

## 3.3 What is real vs designed

- **Real:** `households`, `household_members`, `household_eaters` (with soft/hard diet tiers),
  `plannerEntryEaters`, `plannerWeekEaterOverrides`, `shopping_list(_extras)`,
  `shopping_fulfilment_memory`, plant taxonomy, boost library.
- **Designed (this doc + KMS):** explicit `likes/dislikes`, `goals`, and a **personalisation event log**
  (§8). These are the only new household structures the engine needs — and they are additive.

---

# SECTION 4 — RECOMMENDATION ENGINE

## 4.1 The honest framing

> The brief asks "How do we recommend foods?" The honest engineering answer is:
> **THA does not *generate* recommendations. It *retrieves* candidate facts from Global Knowledge,
> *filters* them through Household Knowledge, *ranks* them by transparent signals, and *renders* them
> with provenance.** Retrieval, not generation. Ranking, not judgement.

This reframing is the whole defence against "AI pretending certainty": **if every card is a pre-existing
cited fact intersected with a pre-existing household fact, there is no point at which certainty can be
fabricated — only revealed or withheld.**

## 4.2 The pipeline (the worked example, generalised)

User: *"I want better sleep."* The engine runs five deterministic stages:

```
STAGE 0 — RESOLVE CONTEXT
   goal = "Better Sleep"
   eaters present, active hard-restriction union, household behaviour snapshot

STAGE 1 — GLOBAL RETRIEVAL  (generic, cacheable)
   Goal "Better Sleep" → Benefit "Sleep Quality"
        → Nutrient "Magnesium"  (Benefit→Nutrient, cited)
        → Foods [Pumpkin Seeds, Kiwi, Greek Yoghurt, Almonds, Oats…]  (Food→Nutrient, cited)
   → candidate set C (every row carries its citation chain)

STAGE 2 — HOUSEHOLD FILTER  (hard gates — remove, never rank)
   - drop any food violating the strictest hard-restriction union   (Rule T0/H1)
   - drop any food conflicting with a present eater's soft pattern, UNLESS it is the only path
   → C becomes C'  (allergen-safe, diet-compatible)

STAGE 3 — HOUSEHOLD CLASSIFY  (label, don't drop)
   For each food, attach household facts:
     - alreadyEaten?  (Greek Yoghurt ✓, Oats ✓)      → "you already eat this"
     - usedThisWeek?  (plant diversity / planner)      → freshness signal
     - liked / disliked?                               → taste signal
     - pairsWith something they eat? (Nutrition Context Best Pairings)

STAGE 4 — RANK  (transparent weighted score, §4.4)

STAGE 5 — EXPLAIN + RENDER  (§10 — every card gets its "why")
```

Output, exactly as the brief envisions:

```
You already eat Greek Yoghurt — a source of magnesium that supports sleep quality.
Try adding:
  • Pumpkin Seeds   (magnesium · pairs well with your oats)
  • Kiwi            (magnesium · not eaten this week)
Pairs well with: Oats (you already have these)
```

Note what the engine did NOT do: it did not say sleep *will* improve, did not diagnose a deficiency,
did not dose. It surfaced cited foods you don't yet eat, anchored to one you do.

## 4.3 The three things the brief asks: ranked / explained / cited

**Cited** — solved by construction. Every candidate enters the pipeline carrying its `Benefit→Nutrient`
and `Food→Nutrient` source IDs from the KMS published snapshot. Citation is not added at the end; it is
the entry ticket. A candidate with no citation chain cannot enter the candidate set. (Rule E1, §10.)

**Ranked** — by a small, transparent, *explainable* score (§4.4). The ranking signals are exactly the
things THA can honestly show the user as reasons. **If a signal cannot be shown as a reason, it cannot
be a ranking input.** This couples ranking and explainability deliberately.

**Explained** — every card answers "why am I seeing this?" with the actual signals that ranked it (§10).

## 4.4 The ranking signal set (transparent by design)

A candidate food's score is a weighted sum of signals that are *each individually displayable*:

| Signal | Direction | Why it's honest to show |
|---|---|---|
| **Relevance to goal** | ↑ | "source of magnesium → supports sleep quality" (cited) |
| **Already eaten by household** | context | anchors trust: "you already eat X" — not necessarily ↑ rank for *new* suggestions; used as the anchor card |
| **Nutrition gap** | ↑ | nutrient under-represented in recent meals (counting, not judgement) |
| **Plant diversity gain** | ↑ | adds a new plant category this week |
| **Pairing fit** | ↑ | Best Pairings match something they already eat |
| **Liked / not disliked** | ↑ / hard-down | taste fit for present eaters |
| **Freshness (not used this week)** | ↑ | avoids repetition; visible as "new this week" |
| **Hard-restriction conflict** | **EXCLUDE** | safety gate — removes, never just down-ranks |
| **Cost / availability** *(later stage)* | ↑ | only if real shopping data supports it; else omitted |

**Weights are configuration, not magic.** They start as hand-tuned constants (Stage 1–2), and only
later become household-adjusted via learning (§8) — and even then, learning **re-weights existing
signals**, it never invents a new signal or a new fact.

## 4.5 Fallback behaviour (what happens when data is thin)

The engine degrades *gracefully and visibly*, never silently:

- **No Benefit→Nutrient data for a goal** → fall back to nutrient-level guidance only ("foods rich in
  magnesium") and say so. Never fabricate the missing link.
- **No household data yet** → behave as Stage 1 (generic best-of list), clearly framed as generic
  ("general suggestions — tell us what you eat to personalise these").
- **Conflicting signals** → show alternatives rather than forcing one answer (Trust Check fallback).
- **Empty after filters** → honest empty state ("we couldn't find a suggestion that fits everyone's
  needs"), never a guessed one.

## 4.6 Where (if anywhere) an LLM fits

The deterministic engine decides *what* to recommend and *why*. An LLM is **optional and confined to
phrasing** in later stages: turning a decided, cited recommendation bundle into natural sentences, or
parsing free-text user goals ("I'm knackered all the time") into a known goal id. **The LLM never selects
a food, never authors a nutrition fact, and never sees a recommendation it can override.** It is a
translator at the edges, never the brain. This keeps the "no AI pretending certainty" guarantee intact
regardless of how conversational the UI becomes.

---

# SECTION 5 — GOAL ARCHITECTURE

## 5.1 The decisive question — *Should goals map to Benefit → Nutrient → Food → Meal?*

**Yes — and this is the single most reusable idea in the document.** A goal should be a **thin alias
that resolves into the existing Global chain.** It is *not* a new knowledge type; it is an entry point.

```
Goal ("Better Sleep")
   └─► one or more Health Benefits ("Sleep Quality")     ← curated mapping, cited
          └─► Nutrients ("Magnesium", "Tryptophan"…)
                 └─► Foods
                        └─► Nutrition Context / Meals / Actions
```

**Why an alias, not a new layer:**

1. **Reuse.** Goals, Simply Better Choices, Choose Better, and the Weekly Report all then run through
   *the same* retrieval pipeline (§4). One engine, many entry points.
2. **Trust.** A goal inherits the citation chain of the benefits it maps to. "Better Sleep" is only as
   strong as its sourced `Goal → Benefit` mapping — which is itself a reviewed, cited row in the KMS.
3. **Honesty about scope.** Some goals map cleanly to nutrients ("Increase Fibre" → Fibre → foods).
   Others are *behavioural* and map to nutrients only weakly ("More Plant Diversity" → the plant
   taxonomy engine; "Lower UPF" → the Choose Better engine). The alias model lets each goal resolve to
   the *right* engine, not be forced through nutrients.

## 5.2 Goal taxonomy — three honest classes

Not all the brief's example goals are the same kind of thing. Forcing them through one path would
fabricate certainty for some. THA should classify goals:

| Class | Examples | Resolves to | Honesty note |
|---|---|---|---|
| **A. Nutrient-anchored** | Increase Fibre, More Energy*, Heart Health*, Muscle Recovery | Benefit → Nutrient → Food | strongest evidence; *energy/heart phrased carefully via EFSA-permitted wording |
| **B. Behavioural / dietary-pattern** | More Plant Diversity, Lower UPF, Improve Gut Health | dedicated engines (plant taxonomy, Choose Better, fermented/fibre foods) | counting & pattern, not clinical |
| **C. Sensitive / out-of-bounds** | Weight loss, "fix my deficiency" | **declined / redirected** | trust boundary, §9 |

> **Rule GO1 — Goals are aliases, never authorities.** A goal carries no nutrition truth of its own. It
> resolves into Benefits/engines that *do* carry cited truth. A goal with no cited mapping shows generic
> guidance and says it is generic — it never invents a mapping.

> **Rule GO2 — Goals are per-person, action is per-household.** (See Rule H1.) A goal is attributed to
> the eater who set it and surfaced in their context, but the resulting shopping/meal actions operate at
> the household level and are labelled with the originating goal.

---

# SECTION 6 — SIMPLY BETTER CHOICES INTELLIGENCE

## 6.1 What changes

Today Simply Better Choices is additive and household-light: it suggests boosts from `BOOST_LIBRARY`
(legumes, seeds, nuts, herbs, mushrooms, fermented, healthy-fats, extra-veg) for a meal. Global
Knowledge **enhances** it by attaching *why* each boost helps and *what it pairs with* — turning a flat
list into an explained, ranked one. The worked example from the brief:

```
Thai Curry  (contains Chicken, Rice, Peppers)

Simply Better Choices
  • Pumpkin Seeds   — Magnesium · supports Sleep Quality · pairs well with rice dishes
  • Lentils         — Fibre + Plant Protein · adds a new plant this week
  • Coriander       — adds a 7th plant · you cook with herbs often
```

The boost is still just *adding a real food to a real meal* — but now it carries the nutrient bridge and
the Nutrition Context (Best Pairings), so it teaches while it suggests.

## 6.2 The decisive question — *Rank by what?*

The brief offers: Health Benefits / nutrition gaps / household preferences / plant diversity / meal
compatibility / cost / **all of the above.**

**Answer: All of the above — but combined through the §4.4 transparent signal set, weighted, and capped.**
This is not a cop-out; it is *exactly* the unified ranking model already designed. Simply Better Choices
is just the §4 pipeline with the *meal* as context instead of a *goal*:

```
context = current meal (its foods, its eaters)
candidates = BOOST_LIBRARY ∩ Global foods that complement this meal
score = w1·goalRelevance + w2·nutritionGap + w3·plantDiversityGain
      + w4·pairingFit(meal) + w5·tasteFit(eaters) + w6·freshness  (+ w7·cost later)
hard gate = strictest-union restrictions + diet pattern
```

**Priority ordering when weights tie**, chosen for honesty and usefulness:

1. **Meal compatibility** first — a boost that doesn't fit the dish is useless however healthy
   (pairingFit + the dish actually accepting it).
2. **Plant diversity gain** — THA's signature positive metric; low-risk, always honest (counting).
3. **Nutrition gap / Health Benefit relevance** — cited, but phrased as "adds" not "fixes".
4. **Household preference / taste** — keeps suggestions accepted, not ignored.
5. **Cost** — **only when backed by real shopping data**; otherwise omitted entirely (never guessed).

> **Rule SBC1 — Additive only, never corrective.** Simply Better Choices *adds* to a plate. It never
> tells the user their meal is bad, never removes, never scores the meal negatively. "Better" means
> "richer in plants/nutrients," shown as opportunity, not deficiency.

> **Rule SBC2 — Cap the suggestions.** Show 2–3 ranked boosts, not the whole library. A wall of
> "improvements" reads as criticism; a short, explained list reads as help.

---

# SECTION 7 — CHOOSE BETTER ARCHITECTURE

## 7.1 The problem this solves

Simply Better Choices is about *adding* to a good plate. **Choose Better** is the harder, more
trust-sensitive case: the user eats something occasional (bacon, sausages, white bread) and THA must
help **without judging, shaming, or moralising.** This is where a careless product becomes a nagging
diet app — the exact thing THA must not be.

## 7.2 The model — *enjoy + choose better + balance*, never *avoid*

The brief's bacon example, formalised into three honest moves:

```
Bacon  →  classified as "Occasional Food"  (a neutral label, not a warning)

THA presents THREE things, in this order:

1. PERMISSION         "Enjoy occasionally — this is a normal part of many diets."
2. CHOOSE BETTER      When you buy it, compare on objective, factual axes:
                        • Lower salt        (per-100g, from product data — factual)
                        • Fewer additives   (additive count — factual)
                        • Higher meat %     (composition — factual)
3. BALANCE THE PLATE  Add alongside (this is just §6 again):
                        • Beans · Tomatoes · Spinach
```

## 7.3 The decisive question — *How does THA educate without judging?*

This is a **language and framing** problem more than a data problem. The architecture enforces it:

1. **Neutral taxonomy.** Foods are "everyday" or "occasional" — never "good/bad," "healthy/unhealthy,"
   "junk," or "treat" (which implies guilt). "Occasional" is descriptive, not evaluative.
2. **Permission precedes guidance.** The first line always affirms the user's choice. THA never opens
   with a correction.
3. **Compare like-for-like on facts, not feelings.** "Choose Better" ranks *within the same food
   category* (bacon vs bacon) on **objective, product-data-derived axes** (salt, additives, meat %) —
   these come from the Analyser's existing product model, are factual, and are citable. THA never
   compares bacon to broccoli (a moralising false equivalence).
4. **Balance, don't subtract.** The constructive move is always *additive* (add beans/tomatoes/spinach),
   never *restrictive* (eat less bacon). This reuses Simply Better Choices wholesale.
5. **No frequency policing.** THA does not count how often you eat bacon and warn you. "Occasionally" is
   stated once as context, never tracked into a scolding metric. (Rule H2.)

> **Rule CB1 — Affirm, inform, offer. Never restrict or shame.** Choose Better may state objective
> product facts and offer same-category alternatives and additive balance. It may never assign moral
> value, predict harm ("this will raise your blood pressure"), count "bad" foods, or tell the user to
> stop eating something.

## 7.4 Architecturally

Choose Better is the §4 pipeline with: `context = an occasional product`, `candidates = same-category
products ranked on factual product axes` **plus** a Simply Better Choices balance panel. It reuses the
Analyser's product-comparison data and the boost engine. No new engine.

---

# SECTION 8 — PERSONALISATION & LEARNING

## 8.1 The decisive question — *Remember forever / forget / weight more heavily?*

THA learns by **re-weighting transparent signals from an event log** — never by authoring new facts and
never by building an opaque profile. The unit of learning is the **personalisation event**:

```
PersonalisationEvent
  eaterId / householdId
  type:  boost_accepted | boost_rejected | goal_set | goal_dropped
       | food_liked | food_disliked | meal_repeated | recommendation_dismissed
  subject: foodId / goalId / mealId
  context: surface, timestamp, season
```

| Category | Policy | Rationale |
|---|---|---|
| **Hard restrictions** | **Remember forever** (until user edits) | safety-critical; never decay |
| **Declared likes/dislikes** | Remember until changed | explicit user intent |
| **Accepted boosts** | Weight **up** (recency-weighted) | strong positive signal that food fits this kitchen |
| **Rejected boosts** | Weight **down**, but **decay** | a "no" today isn't "no" forever; avoid permanent suppression |
| **Repeated meals / staples** | Strengthen the "already eat this" anchor | builds trust, improves pairing |
| **Health interests/goals** | Remember while active; soft-expire | a sleep goal in March may be stale in June |
| **Time-of-use / seasonality** | Weight contextually, never as identity | suggest seasonal foods; don't profile the person |
| **One-off dismissals** | **Forget quickly** | a single dismiss is noise, not preference |

> **Rule P1 — Learning re-weights, never authors.** Personalisation only adjusts the *weights* of the
> §4.4 signals and the *order* of candidates. It can never create a new nutrition fact, a new
> Benefit→Nutrient link, or a new claim. The candidate set always originates in cited Global Knowledge.

> **Rule P2 — Decay over delete for negatives.** Rejections decay rather than hard-block, so THA never
> permanently writes off a food the family might later embrace. (Hard restrictions are the exception —
> they are explicit and permanent.)

> **Rule P3 — Per-person learning, per-household action.** Taste/goal learning attaches to the eater;
> acceptance/cooking patterns attach to the household. (Mirrors §3.2.)

## 8.2 What THA must NOT learn

- **Inferred health states.** THA must never learn-and-store "this user is iron-deficient" from
  behaviour. That is diagnosis (§9).
- **Sensitive inferences** (pregnancy, eating disorders, illness) from shopping/meal patterns. Even if
  statistically suggestive, THA does not infer or act on these.
- **A hidden score the user can't see.** Every learned weight must be explainable back as a visible
  reason ("you've added pumpkin seeds before"). No opaque profile.

## 8.3 Privacy & control

The event log is private household data (§3), never written to Global Knowledge (Rule G1), and the user
can view and reset it. Learning is a convenience layer, not a lock-in.

---

# SECTION 9 — TRUST BOUNDARIES

## 9.1 The decisive question — *Where should THA stop?*

THA is a **household nutrition companion**, not a publisher, not a medical advisor, not an oracle. The
boundary is defined by **verbs**:

| THA **DOES** (companion verbs) | THA **NEVER DOES** (clinician/oracle verbs) |
|---|---|
| **Add** — suggest foods to include | **Diagnose** — "you are magnesium deficient" |
| **Choose better** — compare same-category products on facts | **Dose** — "take 400mg magnesium" / recommend supplements |
| **Pair** — suggest complementary foods | **Predict illness** — "you'll get heart disease" |
| **Count** — "you ate 24 plants this week" | **Prescribe weight loss** — calorie targets, restriction plans |
| **Inform** — cited, EFSA-permitted benefit wording | **Promise outcomes** — "this *will* fix your sleep" |
| **Surface gaps** — "magnesium is low in this week's meals" | **Treat** — manage a medical condition |

## 9.2 The four explicit boundary questions from the brief

- **Diagnose nutrient deficiencies?** **No.** THA may say a nutrient is *under-represented in logged
  meals* (a counting fact about food) but never that the *person* is deficient (a clinical claim about a
  body). The line is food-vs-body.
- **Recommend supplements?** **No. Hard line.** THA is a *food* companion. Supplements are dosing and
  veer into medical territory; THA only ever suggests whole foods. (If a user asks, redirect: "we focus
  on food — for supplements, speak to a GP or pharmacist.")
- **Predict illness?** **No.** No predictive health claims of any kind.
- **Recommend weight loss?** **No.** THA does not set weight goals, calorie targets, or restriction
  plans. It supports *positive, additive* goals (more plants, more fibre, better sleep). A weight-loss
  request is redirected to balanced-eating support, not a diet plan. (This also protects vulnerable
  users from disordered-eating reinforcement.)

> **Rule T0 — Safety supersedes everything.** A hard-restriction violation is never surfaced under any
> ranking, learning, or goal. This gate runs first and cannot be overridden by any signal or weight.

> **Rule T1 — Food, not bodies.** THA makes statements about *foods and meals* (composition, plant
> count, cited nutrient associations). It never makes statements about the *user's body, health status,
> or future.*

> **Rule T2 — When in doubt, defer to a professional.** Any request crossing into diagnosis, dosing,
> medical conditions, pregnancy nutrition, or eating disorders triggers a calm redirect to a qualified
> professional — never a guess, never a refusal-with-no-help.

## 9.3 Where the boundary lives in the architecture

The boundary is enforced in three independent places (defence in depth, mirroring the KMS hard wall):

1. **Content layer** — the nutrient bridge + EFSA-permitted wording (no disease claims can even be
   authored).
2. **Engine layer** — Rule T0 hard gate; goal class C declined (§5.2); no supplement/weight-loss
   candidates exist in the data.
3. **Presentation layer** — companion-verb vocabulary; standing disclaimer; redirect copy for
   out-of-bounds requests.

---

# SECTION 10 — EXPLAINABILITY

## 10.1 The decisive question — *Should THA explain every recommendation?*

**Yes — every single one, with no exceptions.** Explainability is not a nice-to-have; it is the
mechanism by which the entire trust model is *verifiable by the user.* If a card can't answer "why am I
seeing this?", it must not be shown.

The brief's target is exactly right and achievable because the ranking signals (§4.4) *are* the reasons:

```
Pumpkin Seeds
Recommended because:
  ✓ Source of Magnesium                    (Food→Nutrient, cited)
  ✓ Supports Sleep Quality                 (Benefit→Nutrient, cited)
  ✓ You already eat oats — they pair well  (Nutrition Context + household)
  ✓ You haven't had these this week        (freshness / plant diversity)
  ✓ Fits everyone's dietary needs          (passed the hard-restriction gate)
```

## 10.2 The "why" is a by-product, not an extra step

Because ranking inputs are constrained to displayable signals (§4.3), the explanation is *literally the
list of signals that fired*, with their provenance. There is no separate "explanation generator" that
could drift from the real reasons — **the explanation IS the ranking trace.** This coupling is the
strongest honesty guarantee in the system.

> **Rule E1 — No citation, no card.** Every recommendation card must show (a) its nutrient/benefit
> citation chain, and (b) the household reasons that ranked it. A candidate that cannot produce both is
> filtered out, not shown unexplained.

> **Rule E2 — Show uncertainty, don't hide it.** When evidence is nutrient-level only (no
> benefit link), the card says so ("a source of magnesium" without a sleep claim). When a suggestion is
> generic (no household data yet), it's labelled generic. Uncertainty is displayed, never papered over.

## 10.3 Two depths of explanation

- **Glanceable** (default): 2–4 ✓ reasons on the card.
- **Full provenance** (on tap): the complete chain — which source, which benefit, which household
  observation, which week — so a curious or sceptical user can audit any claim to its root. This is the
  user-facing expression of the KMS source-backing.

---

# SECTION 11 — LONG-TERM EVOLUTION

## 11.1 The decisive question — *What capability belongs in each stage?*

The five stages are a **maturity ladder**, each gated on the previous one being trustworthy and on
having enough data. **Crucially, the trust guarantees (§9) and explainability (§10) are constant across
all five stages — only the personalisation depth grows.**

| Stage | Name | New capability | Depends on | Risk |
|---|---|---|---|---|
| **1** | **Static recommendations** | Goal/meal → cited Global candidates, hand-tuned weights, fully explained. Generic for everyone. | KMS published snapshot | Low |
| **2** | **Household-aware** | Join with household facts: restrictions filter, "you already eat," likes/dislikes, plant diversity, pairing. The worked example works here. | Household model §3 | Low–Med |
| **3** | **Learns accepted suggestions** | Personalisation event log re-weights signals; rejections decay; staples strengthen anchors. | Event log §8 + data volume | Med |
| **4** | **Predictive meal guidance** | Anticipates: "you usually plan curry on Fridays — here's a plant boost"; seasonal nudges; gap-aware weekly planning. LLM may *phrase* (never decide). | Stage 3 + behaviour history | Med–High |
| **5** | **Household nutrition companion** | Conversational, goal-tracking-over-time, proactive but non-nagging, multi-eater reconciliation; the full "companion" vision. | Stages 1–4 proven + sustained trust | High |

## 11.2 Stage gating rules

> **Rule LT1 — No stage skips its predecessor's trust bar.** A stage ships only when the prior stage's
> recommendations are demonstrably explainable, cited, and safe in real use. Personalisation depth never
> outruns trust.

> **Rule LT2 — Predictive ≠ presumptuous.** Stages 4–5 *offer*, never *assume*. Predictions are framed
> as easy-to-dismiss suggestions ("want a plant boost for Friday's curry?"), never auto-applied, never
> nagging. Frequency caps and easy opt-out are mandatory.

> **Rule LT3 — The brain stays deterministic.** Even at Stage 5, the *decision* of what to recommend
> remains the deterministic, cited, explainable engine. Conversation and prediction are interface and
> timing layers on top — they never become the source of nutrition truth.

**Most of the value lands at Stages 1–3, which need no AI at all** — just the join, the ranking, and the
event log. Stages 4–5 are genuine product evolution and should be explicitly deferred, not assumed.

---

# SECTION 12 — RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Fabricated certainty** — a suggestion read as a promise/diagnosis | **High** | Composition-not-assertion (§2.1); companion verbs (§9); "source of… supports…" wording; no outcome claims |
| R2 | **Safety failure** — recommending an allergen | **Critical** | Rule T0 hard gate runs first, cannot be overridden; strictest-union (H1); existing hard-enforcement tests |
| R3 | **Moralising / shaming** (esp. Choose Better) | **High** | Rule CB1 affirm-inform-offer; neutral "occasional" taxonomy; additive-only |
| R4 | **Disordered-eating reinforcement** | **High** | No weight loss, no calorie targets, no frequency policing (§9); positive/additive framing only |
| R5 | **Privacy leak** — household data into Global | **High** | Rule G1 generic wall; one-directional join; event log private |
| R6 | **Opaque personalisation** — hidden profile | **Med** | Rule P1 (re-weight only); every weight maps to a visible reason; user can view/reset |
| R7 | **Thin-data over-personalisation** — confident from little | **Med** | Stage gating (LT1); honest "generic" labelling (E2); decay over delete (P2) |
| R8 | **Stale Global facts** | **Med** | KMS staleness plane; citation chain surfaces source date |
| R9 | **Engine drift / unexplained cards** | **Med** | Rule E1 no-citation-no-card; explanation = ranking trace (§10.2) |
| R10 | **Scope creep into medical advice** | **High** | Rule T2 redirect; no supplement/weight data exists in candidate set |
| R11 | **Over-suggestion fatigue / nagging** | **Med** | SBC2 cap 2–3; LT2 frequency caps + easy dismiss |
| R12 | **Multi-eater conflict mishandled** | **Med** | H1 union for safety, weight for taste; per-meal eater resolution already real |

---

# SECTION 13 — FINAL RECOMMENDATION

**Build a deterministic, explainable retrieval-and-ranking recommendation engine** as the synthesis
layer between the already-designed Global Knowledge (KMS) and the already-real Household Knowledge. It is
a thin, honest join — not a new intelligence.

**The five non-negotiable architectural commitments:**

1. **Generic wall (G1).** Global Knowledge never knows about households. Personalisation lives entirely
   in the request-time join.
2. **Composition, not assertion (§2.1).** Every recommendation is `(cited Benefit→Nutrient) ×
   (cited Food→Nutrient) × (observed household fact)`. THA never authors a nutrition claim.
3. **Safety first (T0).** Hard-restriction gate runs before any ranking and cannot be overridden.
4. **Explanation = ranking trace (E1, §10.2).** Ranking signals are exactly the displayable reasons;
   every card explains itself or isn't shown.
5. **Companion verbs only (§9).** Add / Choose Better / Pair / Count / Inform — never Diagnose / Dose /
   Predict / Prescribe.

**Sequencing:** Ship Stages 1–3 (static → household-aware → learning-by-reweighting), which require no
AI and deliver most of the value. Defer Stages 4–5 (predictive, conversational) behind explicit trust
gates. Reuse one pipeline for Goals (§5), Simply Better Choices (§6), and Choose Better (§7) — they are
the same engine with different context.

This is the honest answer to the real question: **THA combines trusted nutrition knowledge with
household understanding by *intersecting two sets of facts it already holds and showing its working* —
never by guessing, never by judging, never by pretending to be a doctor.**

**Confidence: High** (architecture is a thin synthesis of validated layers). **Medium** on Stages 4–5,
which are correctly deferred.

---

## FINAL REPORT

1. **Rollback identifier:** `rollback/nutrition-intelligence-arch-20260618` (annotated tag, object
   `3b3af8978148b7030ab6a3c08e5811a6ff2001db`), pointing at commit `bae3b99`
   (`bae3b992e021abe32182dcf13f9aff7f1e708a95`). Restore: `git reset --hard
   rollback/nutrition-intelligence-arch-20260618`.

2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.

3. **Recommended recommendation engine:** A **deterministic retrieval-and-ranking engine** (§4):
   resolve context → retrieve cited Global candidates → hard-filter by household safety → classify by
   household facts → rank by a transparent displayable-signal set → explain & render. Retrieval not
   generation; ranking not judgement. An LLM, if used, only *phrases* already-decided, already-cited
   recommendations — it never selects a food or authors a fact.

4. **Recommended goal architecture:** Goals are **thin aliases** that resolve into the existing
   `Benefit → Nutrient → Food → Meal` chain or a dedicated engine (§5), classified as A) nutrient-anchored,
   B) behavioural/pattern, or C) sensitive/out-of-bounds (declined). Goals carry no truth of their own
   (GO1); per-person attribution, per-household action (GO2).

5. **Recommended Simply Better Choices intelligence:** The §4 pipeline with the *meal* as context —
   **all of the above** ranking signals combined transparently, prioritising meal compatibility →
   plant-diversity gain → cited benefit/gap → taste → cost-when-real. Additive only, never corrective
   (SBC1); capped at 2–3 explained boosts (SBC2).

6. **Recommended Choose Better architecture:** **Affirm → inform → offer** (§7). Neutral "occasional"
   taxonomy; same-category factual comparison (salt/additives/meat %) from Analyser product data;
   additive "balance the plate" via Simply Better Choices. Never restrict, score down, moralise, or
   police frequency (CB1).

7. **Recommended learning model:** A private **personalisation event log** that **re-weights transparent
   signals only** (§8, P1). Remember forever: hard restrictions, declared likes/dislikes. Weight up
   (recency): accepted boosts, staples. Weight down but **decay**: rejections (P2). Soft-expire: goals,
   seasonality. Forget fast: one-off dismissals. Never infer health states; no opaque profile.

8. **Recommended trust boundaries:** Companion verbs only — Add/Choose-Better/Pair/Count/Inform (§9).
   **No** diagnosis, **no** supplements (hard line), **no** illness prediction, **no** weight-loss plans.
   Statements about *foods*, never *bodies* (T1); safety supersedes everything (T0); redirect to
   professionals when in doubt (T2). Enforced in content, engine, and presentation layers.

9. **Recommended explainability model:** **Every** recommendation explains itself; **explanation = the
   ranking trace** (§10.2). No citation + household reasons ⇒ no card (E1). Glanceable ✓-reasons by
   default; full source provenance on tap. Uncertainty is displayed, never hidden (E2).

10. **Recommended long-term roadmap:** Stage 1 static → 2 household-aware → 3 learns-by-reweighting (all
    AI-free, most of the value) → 4 predictive (LLM phrasing only) → 5 conversational companion. Each
    stage gated on the prior being proven safe/explainable (LT1); the decision-brain stays deterministic
    at every stage (LT3). Defer 4–5 explicitly.

11. **Risks:** Fabricated certainty (R1), allergen safety failure (R2, critical), moralising (R3),
    disordered-eating reinforcement (R4), privacy leak into Global (R5), opaque personalisation (R6),
    thin-data over-confidence (R7), stale facts (R8), unexplained cards (R9), medical scope creep (R10),
    suggestion fatigue (R11), multi-eater conflict (R12) — each mitigated in §12.

12. **Confidence level:** **High** on the core architecture (a thin, honest synthesis of five
    already-validated layers; Stages 1–3 need no new AI). **Medium** on Stages 4–5, which depend on data
    volume THA does not yet have and are deliberately deferred behind trust gates.

13. **Confirmation — no code, schema or data changes made.** ✅ This task produced exactly two artefacts:
    this markdown file and one annotated git tag (`rollback/nutrition-intelligence-arch-20260618`). No
    source, CSS, route, schema, migration, API, AI, or data change was made. The committed tree is
    unchanged apart from this document; the five pre-existing untracked investigation docs are untouched.
