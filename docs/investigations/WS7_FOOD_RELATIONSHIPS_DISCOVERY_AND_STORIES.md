# WS7 — Food Relationships, Discovery & Household Stories Investigation

> **Status:** Investigation only. No implementation. No schema / UI / DB changes.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — only the untracked WS6 investigation was present |
| WS6 investigation protected | ✅ Committed as `28e656f` — *docs(ws6): preserve Canonical Food Report Architecture investigation* |
| Rollback point created | ✅ Tag `rollback-ws7-start-20260620` → `28e656f` |
| How to undo all WS7 work | `git reset --hard rollback-ws7-start-20260620` |

No work began until the rollback point was confirmed.

---

## EXECUTIVE SUMMARY

**The three concepts in this brief — Healthier Alternatives (A), Household Stories (B) and Food
Discovery (C) — are not three systems. They are three *readings* of one structure THA already
half-owns.**

That structure has exactly two layers:

1. **A food↔food relationship graph** — typed edges between canonical foods (*alternative-to*,
   *similar-to*, *broaden-variety*, *same-group*, *often-cooked-with*, *seasonal-with*). This is
   household-neutral, editorial, and **already exists in skeletal form**: `shared/knowledge/relationships.ts`
   holds `FOOD_NUTRIENTS`, `FOOD_BENEFITS` and `NUTRIENT_BENEFITS` (a real graph), the canonical spine
   holds food→variety and food→diversity-group edges (`food_variety`, `diversity_group`), and
   `canonical_food_alias` holds string→food edges. WS7 would *extend the edge vocabulary*, not invent a graph.

2. **A household↔food consumption overlay** — facts about *this* household's relationship to a food
   (*eaten 87 times*, *first discovered*, *most loved meal*, *4 varieties explored*). This is **already
   recorded** across `planner_entries`, `food_diary_entries`, `user_item_usage` (`useCount`,
   `lastUsedAt`) and `activity_summary` — it is simply never *aggregated per food* or *celebrated* today.

The central finding:

> **Healthier Alternatives, Food Discovery, Household Stories, Seasonal Stories and Social Sharing are
> all the SAME two layers, traversed with different edge-types and different framing. The graph is one.
> The overlay is one. Only the lens changes.**

| Concept | Layer 1 (graph) | Layer 2 (overlay) | What changes |
|---|---|---|---|
| **Healthier Alternatives** | `alternative-to` edges, ranked by nutrient/UPF/benefit delta | *(optional)* respect what household already eats | **edge type** = *alternative-to* |
| **Food Discovery** | `similar-to` / `same-group` / `same-cuisine` edges | filter OUT already-eaten, surface the rest | **edge type** = *similar-to*, then overlay subtracts |
| **Household Story** | *(none — food in isolation)* | aggregate all consumption facts for one food, celebrate | **overlay only**, aggregated per food |
| **Seasonal Story** | `seasonal-with` edges for "broaden" prompts | consumption facts windowed by date range | **overlay** windowed by time + `seasonal-with` graph |
| **Social Sharing** | *(none)* | a *rendering* of Story/Seasonal facts, opt-in | **presentation** of layer 2, nothing new |

The single most important design consequence — and the whole reason to investigate them *together* —
is a trust one:

> **The same edge, traversed with different framing, becomes judgement, celebration, or discovery.**
> *White bread → wholemeal* is an *alternative* (helpful) or a *verdict* (judgemental) depending only on
> wording. *You've eaten 87 tomatoes* is *celebration* (warm) or a *scoreboard* (competitive) depending
> only on framing. **Because all five features share one graph, the trust guardrails must live on the
> graph and its framing contract — authored once — not be re-litigated per feature.**

WS7 does **not** propose building this. It proposes the **architecture** that would let all five be built
on one graph + one overlay, and flags every place that architecture could betray the brief's own rule:
*celebration, not optimisation; a trusted friend in the kitchen, never a critic.*

Three invariants carry forward from the WS0–WS6 lineage and bind everything below:

1. **One knowledge seam.** Any nutritional *reason* an edge asserts ("more fibre") must be the same fact
   the target food's Key Nutrients / Benefits already assert via `knowledgeFoodSlug → WS0`. No edge
   invents nutrition. (WS2F §7, WS6 EXEC.)
2. **Educational / celebratory, never medical or judgemental.** Alternatives are *options*, never verdicts;
   stories are *celebration*, never *optimisation*. (WS5A §7.3, WS6 Part 15.)
3. **Empty is silent, not broken.** A food with no alternatives / no story / no discovery surfaces
   *nothing* — never a placeholder, never "coming soon". (WS2B honesty rule, WS2F preparation guard.)

---

## PART A — HEALTHIER ALTERNATIVES

### A.1 The two worked examples, as graph edges

```
white-bread ──alternative-to──▶ wholemeal-bread ──alternative-to──▶ rye-bread ──alternative-to──▶ sourdough
   reason: + fibre · less refined · different flavour profile

bacon ──alternative-to──▶ lean-back-bacon ──alternative-to──▶ eggs ──alternative-to──▶ beans
   reason: less processed · lower salt · higher fibre · different nutrition profile
```

Read as data, each arrow is one typed edge: `{ from, to, type: 'alternative-to', reasons: [...] }`.
The "ladder" (white → wholemeal → rye → sourdough) is **not** a ranked hierarchy of virtue — it is
simply several `alternative-to` edges from one starting food. Rendering them as a *staircase of shame*
is the failure mode WS5A §7.3 rule 5 already bans ("offer **one** useful swap, not a ladder of shame").

### A.2 What should connect alternatives? — investigated dimension by dimension

The brief asks whether alternatives connect by nutrition, preparation, flavour, household habits, dietary
patterns, cost, or UPF level. Findings:

| Connector | Verdict | Why / how it grounds |
|---|---|---|
| **Nutrition** | ✅ **Primary, but only via the one seam** | "+ fibre / lower salt" must be the *same* fact the target's WS0 Key Nutrients already carry. The edge stores a *pointer* to the differing nutrient, not a free-text claim. No second nutrition path (Invariant 1). |
| **Preparation** | ✅ **Highest-value, lowest-friction** | A *same-food* preparation swap (deep-fried → oven-baked) keeps the food and is the most actionable "alternative" (WS5A §7.1). Must be modelled as a **preparation** edge, never mislabelled a food swap (WS5A §7.1 trap). |
| **UPF level** | ✅ **Strong, because it's honest about processing** | bacon→beans, white→wholemeal are fundamentally *less-processed* edges. UPF is already a live THA concept (`whole-food-alternatives.ts`, `additives`/`productAdditives`). A `less-processed` reason is defensible without moralising. |
| **Flavour profile** | ⚠️ **Yes, but as a *reassurance*, not a driver** | "different flavour profile" matters because it tells the user the swap is *not lateral* — it's a real change they might dislike. Flavour belongs on the edge as an honesty note ("tastes different"), preventing the "swap and be disappointed" trap. |
| **Dietary patterns** | ⚠️ **As a *filter*, not a connector** | An alternative must respect the household's hard restrictions (`household_eaters.hardRestrictions`) and soft diet types — *never* suggest bacon→eggs to a vegan. This is the existing `restriction-resolver` / `substitution-rules` conflict logic (already built), applied as a gate over edges. |
| **Cost** | ⚠️ **Mandatory guard, optional driver** | WS3B already requires a `budgetNote` guard so an alternative never quietly assumes a pricier product. Cost is a **constraint to respect**, and *occasionally* a positive reason (beans cheaper than bacon) — but never the headline, or THA reads as means-testing the user's shop. |
| **Household habits** | ⚠️ **As ranking, via the overlay** | Among valid `alternative-to` edges, prefer the one closest to what the household *already* eats (Layer 2). Suggesting rye when they already buy wholemeal is a smaller, kinder step than sourdough. This is where the graph meets the overlay — see Part D. |

### A.3 What already exists (and the duplication to retire)

Two live, non-overlapping systems already do fragments of this — neither reads the Food Report
(confirmed in WS6 EXEC table):

- **`client/src/lib/whole-food-alternatives.ts`** — client, *regex-pattern* → whole-food recipe
  (tortilla→homemade flatbread, pesto→homemade pesto). It is a *make-it-yourself / less-UPF* engine,
  keyed on ingredient name patterns, returning a full recipe object. Strong, but isolated and string-matched.
- **`server/lib/uplift-*`** (`uplift-rules.ts`, `uplift-engine.ts`, `uplift-persistence.ts`) — server,
  human-authored *uplift rules* registry (mac & cheese → add turmeric + peas) with `confidence`,
  `evidenceTopic`, `learnMoreSlug`, and approved-language guardrails baked in. This is an *additive*
  ("add a handful of peas"), not a *substitution* — a different edge type (*broaden-within-meal*), but
  the same shape: trigger → suggestion → evidenced reason → guarded wording.

**Finding:** these are two edge *generators* writing to two private formats. In the WS7 architecture both
become *producers of typed edges* into one graph, and the *reason* on each edge resolves through the same
WS0 seam — so "wholemeal has more fibre" is asserted in exactly one place (the target food's Key Nutrients),
never re-typed in an alternatives file. WS6 Part 12 already flagged this as the target.

### A.4 Trust posture for Part A

- **Frame the current choice as fine.** "You could also try…", never "you should switch" / "white = bad"
  (WS5A §7.3, WS6 Part 12). The edge carries an *option*, the renderer must carry the *non-judgement*.
- **One swap, not a ladder.** Render the *single* closest-step edge by default; the full chain only on
  explicit "show more". The graph may hold four edges; the surface shows one.
- **Respect the treat.** Bacon at the weekend is not a problem to be solved. An alternative must be
  suppressible and must never fire on an occasion/treat context.

---

## PART B — HOUSEHOLD STORIES

### B.1 The example, mapped to existing data

```
Tomato — Your household story
  • eaten 87 times          ← COUNT of planner_entries / food_diary_entries resolving to canonical "tomato"
  • used in 18 meals        ← DISTINCT meals containing a tomato-resolving ingredient
  • explored 4 varieties    ← DISTINCT food_variety eaten (WS2B "Your Varieties" already computes this)
  • cooked raw and cooked   ← DISTINCT preparation forms seen (WS5A preparation layer)
  Most loved meals
   ❤️ Pasta sauce  ❤️ Greek salad  ❤️ Chilli   ← most-repeated meals containing tomato (useCount / frequency)
```

**Every fact above is derivable from data THA already records.** Nothing here needs a new editorial input
or a new write path for the *facts themselves* — they are aggregations of the consumption overlay
(Layer 2). The one honest caveat (B.4) is that *aggregation* may want a derived read-model for
performance, but the source facts exist.

### B.2 The questions the brief asks — investigated

| Concept | Should it exist? | Grounding / source |
|---|---|---|
| **Favourite foods** | ✅ Yes — *derived*, never *declared* | A favourite = high `user_item_usage.useCount` + recency, or high planner/diary frequency for a canonical food. Derive it; don't make the user curate a list (curation becomes a chore and a judgement). |
| **First-discovered date** | ✅ Yes — *gentle*, opt-in surfacing | `MIN(createdAt)` across planner/diary entries resolving to that canonical food. Powerful for warmth ("you first cooked lentils last March"). Must never read as surveillance — see B.5. |
| **Family-member favourites** | ✅ Yes — `household_eaters` already models per-eater | `planner_entry_eaters` links entries to specific eaters; "Lilly's favourite" is the most-frequent food among Lilly's entries. **Highest delight, highest sensitivity** (B.5 — never compare members). |
| **Milestones** | ✅ Yes — but *celebratory thresholds only* | "20th plant this week", "50 meals cooked together". These are counts crossing a threshold. Must be *arrival* moments, never *targets you're failing to hit*. |
| **Food anniversaries** | ⚠️ Yes, but *quietly* | "A year ago this week you discovered chickpeas." Delightful in small doses; becomes spam if every food gets an anniversary. Rate-limit hard (B.5). |

### B.3 The architectural point — Stories are the overlay, aggregated

A Household Story is **not** a food↔food graph traversal at all. It is **Layer 2 in isolation**: take one
canonical food, gather every household consumption fact that resolves to it, aggregate, and *frame warmly*.

This is why Stories share architecture with Discovery and Alternatives despite looking different: all three
read the *same* canonical-resolution path (eaten string → `canonical_food_alias` → canonical food → its
varieties / preparations) that WS2B "Your Variety" already walks. The Story just stops at the food instead
of hopping to a neighbour.

### B.4 What's genuinely new vs. what exists

- **Exists:** the raw facts (entries, useCount, eater links, variety resolution).
- **New (read-model, future):** a *per-canonical-food household aggregate* — count, distinct meals,
  distinct varieties, first/last seen, top meals. Today nothing aggregates consumption *by canonical food*;
  the counts are computed per-surface (e.g. WS2B variety surfacing, `activity_summary` lifetime counts).
  A future `householdFoodStory(householdId, canonicalSlug)` reader would assemble this **by reading
  existing tables** — no new write path required for a v1 (SUGGESTION lists a materialised option for scale).

### B.5 Trust posture for Part B — *celebration, not optimisation* (the brief's own rule)

- **No judgement, ever.** "87 tomatoes" is celebration; "only 3 portions of oily fish — below target" is
  optimisation. Stories surface *what you did*, never *what you fell short of*. The overlay must have **no
  concept of a deficit** in this feature.
- **Never compare household members.** "Lilly's favourite" = warmth. "Lilly ate more veg than Dad" =
  a wedge in a family. Per-eater facts are *individual celebrations*, never *leaderboards* (links to the
  Trust Check on competitiveness).
- **Surveillance smell.** "First discovered" / anniversaries are warm *from the inside* and creepy if
  they read as *being watched*. Framing: "your kitchen remembers", not "we tracked". Opt-in, rate-limited.
- **Honest counting.** A count that double-counts (same meal logged twice) or under-counts (alias missed
  resolution) erodes trust silently. Counts inherit the WS2E one-slug-one-food integrity guarantee or they
  must not be shown.

---

## PART C — FOOD DISCOVERY

### C.1 The examples, as graph traversal + overlay subtraction

```
You enjoy:  chickpeas · lentils · hummus        ← Layer 2: high-frequency eaten foods
You might enjoy:  butter-beans · cannellini · puy-lentils
        ▲ Layer 1: similar-to / same-group edges from what you enjoy
        ▲ Layer 2: MINUS anything already eaten  →  leaves the genuinely-new neighbours

You cook:  Mediterranean                         ← Layer 2: cuisine inferred from meal history
You could try:  fennel · artichokes · sardines
        ▲ Layer 1: same-cuisine edges            ▲ Layer 2: not-yet-eaten filter
```

**Discovery = (graph neighbours of what you eat) − (what you already eat).** It is the WS2B
"Broaden Your Variety" pattern (eaten vs. not-yet-eaten split) **generalised from within-one-food to
across-the-graph**. WS2B today walks food→its-own-varieties; Discovery walks food→neighbour-foods. Same
split, wider edges.

### C.2 The discovery bases the brief lists — investigated

| Basis | Edge type | Verdict |
|---|---|---|
| **Similarity** | `similar-to` (shares nutrients/benefits/role) | ✅ Core. chickpeas→butter-beans (both legumes, fibre+plant-protein per `FOOD_NUTRIENTS`). |
| **Variety** | `broaden-variety` (within one food) | ✅ Already live (WS2B). The narrowest, safest discovery. |
| **Benefits** | `shares-benefit` (via `FOOD_BENEFITS`) | ✅ "Also good for gut health" — already a graph edge in `relationships.ts`. |
| **Flavours** | `flavour-affinity` | ⚠️ Appealing but **not yet modelled**; would be new editorial. Defer. |
| **Cuisine** | `same-cuisine` | ✅ High delight (Mediterranean→fennel). Cuisine inference exists in style-tags/meal data; the *food→cuisine* edge is partly new editorial. |
| **Seasonality** | `seasonal-with` | ✅ See Part E. New editorial (a food→season map), but small and high-warmth. |
| **Household habits** | overlay ranking | ✅ The *filter and ranker*, not an edge — see Part D. |

### C.3 Trust posture for Part C

- **Discovery must not overwhelm** (Trust Check). The graph may yield 40 neighbours; surface **2–3**,
  chosen by closeness-to-what-they-love and seasonality. A wall of suggestions is paralysis, not delight.
- **Adjacent, not aspirational.** Suggest the *next* step (chickpeas→butter-beans), not a leap to an
  unfamiliar ingredient they'll never buy. The overlay's job is to keep discovery *one comfortable step* out.
- **Never imply inadequacy.** "You might enjoy…" (invitation), never "you're missing out on…" (lack).

---

## PART D — THE SHARED RELATIONSHIP GRAPH (the core of this investigation)

### D.1 The proposal: one graph, one overlay

```
                         ┌─────────────────────────────────────────────┐
   CANONICAL FOOD  ──────│   Layer 1 — FOOD↔FOOD RELATIONSHIP GRAPH     │   household-NEUTRAL, editorial
   (the WS2A spine)      │   typed, directional, reason-bearing edges   │   (extends shared/knowledge/
                         └─────────────────────────────────────────────┘    relationships.ts + canonical spine)
                                  │  edge types (the shared vocabulary)
        ┌───────────────┬─────────┼──────────┬──────────────┬─────────────┬──────────────┐
   alternative-to   similar-to  broaden-   broaden-      same-group    seasonal-with   shares-benefit
   (Part A)         (Part C)    variety    preparation   (citrus…)     (Part E)        / shares-nutrient
                                (WS2B✓)    (WS5A)        (canonical✓)                   (relationships.ts✓)

                         ┌─────────────────────────────────────────────┐
   HOUSEHOLD  ──────────▶│   Layer 2 — HOUSEHOLD↔FOOD CONSUMPTION       │   household-SPECIFIC, derived
   (households /         │   OVERLAY — facts, counts, dates, favourites │   (reads planner_entries,
    household_eaters)    └─────────────────────────────────────────────┘    food_diary, user_item_usage,
                                  │  overlay facts                           activity_summary)
        ┌───────────────┬─────────┼──────────┬──────────────┬─────────────┐
   eaten / not-eaten  times-eaten  first-seen  most-loved   per-eater     varieties-explored
   (the WS2B split✓)  (counts)    (MIN date)  (frequency)  favourite     (WS2B✓)

   ─────────────────────────────────────────────────────────────────────────────────────────
   FIVE FEATURES = combinations of {edge type} × {overlay operation}:

     Healthier Alternatives = alternative-to            (+ overlay ranks by closeness, gates by restriction)
     Food Discovery         = similar-to / same-group   ∩  overlay "not-yet-eaten"
     Household Story         = (no edge)                 =  overlay aggregated per food, celebrated
     Seasonal Story          = seasonal-with             +  overlay windowed by date
     Social Sharing          = (no edge)                 =  Story / Seasonal rendered, opt-in
```

### D.2 Can all four (A, C, B, Seasonal) be powered by one graph? — **Yes, with one clarification.**

Yes — **provided we name the two layers as distinct.** The brief's Part D list mixes them:

| Brief's listed relationship | Which layer | Already exists? |
|---|---|---|
| Alternative to | Layer 1 edge | partial (`whole-food-alternatives`, `uplift`) |
| Similar to | Layer 1 edge | partial (`FOOD_NUTRIENTS`/`FOOD_BENEFITS` imply it) |
| Broaden variety | Layer 1 edge | ✅ WS2B |
| Broaden preparation | Layer 1 edge | partial (WS5A preparation model) |
| Seasonal with | Layer 1 edge | ❌ new editorial (small) |
| Often cooked with | Layer 1 edge **derived from Layer 2** | derivable (co-occurrence in meals) |
| Household favourite | **Layer 2 overlay** | derivable (`user_item_usage`) |
| First discovered | **Layer 2 overlay** | derivable (`MIN(createdAt)`) |
| Most used | **Layer 2 overlay** | derivable (frequency) |

The clarification: **"household favourite / first discovered / most used" are NOT food↔food edges — they
are household↔food overlay facts.** Conflating them into the same edge table would entangle editorial
knowledge (shared, reviewable, identical for everyone) with private consumption (per-household, derived,
never editorial). Keeping them as **two layers that meet at query time** is the load-bearing decision.

"Often cooked with" is the interesting hybrid: it can be *editorial* (tomato + basil, authored) **or**
*emergent* (this household pairs tomato + halloumi, derived from their meals). Both are legitimate; they
are different *sources* of the same edge type and should be tagged with provenance (`source: editorial |
household-derived`) so the household-derived ones never leak across households.

### D.3 Why one graph (and not three feature-specific stores)

1. **One reason, one seam.** An `alternative-to` edge and a `similar-to` edge both justify themselves with
   the *same* nutrient/benefit facts from WS0. Three stores = three places "wholemeal has more fibre" can
   drift (exactly the duplication WS6 exists to end).
2. **One trust surface.** The judgement/celebration/overwhelm risks (Trust Check) are *edge-framing* risks.
   One graph + one framing contract = guardrails authored once, not re-implemented per feature.
3. **One integrity guarantee.** Every edge endpoint is a canonical slug (WS2E: one slug = one food). The
   graph inherits the anti-fork lock for free; a feature-specific store would re-introduce string matching
   (the `whole-food-alternatives` regex approach) and its drift.
4. **Composability.** Seasonal Stories = Discovery edges + Story overlay + a date window. With one graph
   that's a *query*, not a fourth codebase.

### D.4 Minimal shape of an edge (illustrative — NOT a schema proposal)

```
FoodRelationship {
  fromSlug:   canonical_food.slug      // endpoint — anti-fork locked
  toSlug:     canonical_food.slug      // endpoint
  type:       'alternative-to' | 'similar-to' | 'broaden-variety'
            | 'broaden-preparation' | 'same-group' | 'seasonal-with'
            | 'often-cooked-with' | 'shares-benefit' | 'shares-nutrient'
  reasons:    string[]                 // POINTERS to WS0 facts, not free claims (Invariant 1)
  direction:  'directional' | 'mutual' // alternative-to is directional; similar-to is mutual
  source:     'editorial' | 'household-derived'   // provenance — derived never crosses households
  evidence?:  // for nutrition reasons, the WS4B tier/source already gating the underlying claim
}
```

Much of this is *already implied* by `relationships.ts` (the maps are untyped mutual edges) and the
canonical spine (variety/group are typed edges in normalised tables). WS7's graph is the **explicit,
typed superset** of structures already present — consistent with how `canonical_food` became the explicit
superset of `knowledge_foods` in WS2A.

---

## PART E — SEASONAL STORIES

### E.1 The example, decomposed

```
Spring 2027 — your household
  cooked 62 meals together          ← overlay: COUNT(planner/diary entries) in [Mar..May 2027]
  explored 14 new ingredients       ← overlay: DISTINCT canonical foods first-seen in window
  cherry tomatoes became your        ← overlay: variety whose frequency rose most in window (WS2B varieties)
    favourite tomato
  Lilly discovered lentils          ← overlay: per-eater first-seen in window (planner_entry_eaters)
  Most loved meals  ❤️ pizza…        ← overlay: top meals by frequency in window
  Most used  🥇 tomatoes 🥈 oil…     ← overlay: top canonical foods by frequency in window
  Broaden this summer  ☀ heirloom…  ← Layer 1: seasonal-with + Discovery edges for the NEXT window
```

**A Seasonal Story is a Household Story with a date filter, plus a single forward-looking Discovery
block.** Everything before "Broaden this summer" is Layer 2 windowed by `[start, end]`. The "broaden"
block is the only Layer 1 traversal, and it's just Discovery (Part C) seeded by the season's
`seasonal-with` edges.

### E.2 Could it be generated automatically, with no manual input? — **Yes.**

Every fact is an aggregation over existing timestamped rows (`createdAt` on entries, `lastUsedAt` on
usage). A scheduled, end-of-season job could assemble the whole card with **zero manual authoring** and
**zero judgement**, because:

- counts and "most used" are pure `COUNT`/`ORDER BY frequency`;
- "X became your favourite" is a *rise in frequency*, not a target hit;
- "discovered" is *first-seen-in-window*, a warm fact by construction;
- "broaden this summer" is the existing Discovery query with a season filter.

The only editorial input the whole feature needs is the **`seasonal-with` / season→food map** (small,
reviewable, the same kind of editorial seed as `FOOD_BENEFITS`), and the **copy templates** (which must
pass the same approved-language / no-judgement checks the `uplift-rules` already enforce).

### E.3 Trust posture for Part E

- **Only celebration and discovery, no scorecard.** A season summary must never say "you cooked *fewer*
  meals than last season" or "your veg intake dropped". The overlay, in this feature, **must not compute
  deltas-against-self that read as decline.** Rises are celebrated; absences are silent.
- **Quiet cadence.** Once per season, opt-in. Not a weekly nag. (Anniversaries/milestones rate-limited
  per Part B.5.)
- **Honest or absent.** A sparse household (3 meals logged) gets a *gentle* card or none — never a card
  padded with "you've only…". Empty is silent (Invariant 3).

---

## PART F — SOCIAL SHARING

### F.1 What is shareable

THA membership already supports meal-plan invites (a social primitive exists). The shareable artefacts are
**renderings of Layer 2 aggregates** — never the raw graph or raw history:

| Shareable | Example | Risk level |
|---|---|---|
| Seasonal headline | "We discovered 12 new foods this spring." | Low — aggregate, positive |
| Household MVP food | "Tomatoes were our household MVP." | Low — playful, no person named |
| Favourite meal | "Our favourite meal this season was homemade pizza." | Low |
| Milestone | "We hit 30 plants this week." | Low–medium (can read as boast) |
| Per-eater fact | "Lilly discovered lentils." | **High** — names a (possibly child) family member |

### F.2 Privacy, opt-in, and the delight/oversharing line — investigated

- **Opt-in, per-share, always.** Nothing auto-posts. Sharing is an *affordance on a Story card*, an
  explicit act each time — never a background sync or a default-on setting. (Sending content externally
  publishes it; it may be cached/indexed even if later deleted — the user must choose knowingly.)
- **Aggregates leave the house; raw history never does.** "12 new foods" is shareable; the *list of every
  meal and date* is not. The share renderer reads the *aggregate*, not the underlying entries.
- **Children are a hard boundary.** Per-eater facts that name a child (`household_eaters` with
  `userId = null`) must be **off by default** and gated behind explicit adult consent, if allowed at all.
  "Lilly discovered lentils" is adorable inside the home and a safeguarding question outside it.
- **No comparison, no ranking against other households.** The moment a share implies "we did better than
  you", THA stops being a friend and becomes a competition platform (Trust Check). Shares celebrate *this*
  household against *itself*, never a global board.

### F.3 Delight vs. oversharing

The test: *would a kind friend say this out loud?* "We cooked a lot of pizza this spring 🍕" — yes.
"Our member Lilly ate 47 portions of carbohydrate" — no. The graph never produces the second; the **copy
templates and the per-eater gate** are what keep sharing on the delight side. Author them with the same
approved-language guardrails as `uplift-rules.ts`.

---

## TRUST CHECK — *a trusted friend in the kitchen*

The brief names four ways this could go wrong. Each maps to a layer decision above:

| Risk | How it happens | The architectural guard |
|---|---|---|
| **Stories become competitive** | Per-eater facts rendered as leaderboards; household-vs-household shares | Per-eater facts are *individual celebrations* only (B.5); shares are self-vs-self only (F.2); **the overlay has no cross-household ranking primitive.** |
| **Alternatives become judgemental** | "white = bad", ladders of shame, firing on treats | Edges carry *options + reasons*, never verdicts; render *one* swap; suppress on occasions; "you could also try" wording (A.4, WS5A §7.3). |
| **Discovery becomes overwhelming** | Surfacing all graph neighbours; aspirational leaps | Cap at 2–3, ranked by closeness + season; adjacent not aspirational (C.3). |
| **Social becomes performative** | Auto-posting; child exposure; boast-shaped milestones | Opt-in per share; aggregates only; children off by default; no global board (F.1–F.3). |

**The overarching invariant (WS7's contribution to the lineage):**

> **The graph is neutral; the framing carries the trust.** One `alternative-to` edge is help or judgement
> depending only on wording. One `times-eaten: 87` fact is celebration or surveillance depending only on
> framing. Because all five features share one graph and one overlay, **the framing contract — educational,
> celebratory, opt-in, never comparative, never deficit-based — must be authored once at the graph/overlay
> boundary and inherited by every feature.** A friend in the kitchen notices what you love and gently
> points at what's next; they never keep score, never grade your shop, and never tell the neighbours.

This extends WS6's three invariants with a fourth: **Neutral graph, framed reading.**

---

## RELATIONSHIP TO PREVIOUS WORKSTREAMS

| Workstream | What WS7 builds on |
|---|---|
| **WS0** | `relationships.ts` (`FOOD_NUTRIENTS`, `FOOD_BENEFITS`, `NUTRIENT_BENEFITS`) — the **graph already exists** here in map form. WS7's Layer 1 is its typed superset. |
| **WS2A/2E** | Canonical spine + one-slug-one-food lock — every edge endpoint and every overlay resolution is a canonical slug. The anti-fork guarantee makes counts and edges trustworthy. |
| **WS2B** | The eaten / not-yet-eaten split (`variety.ts`) — Discovery (Part C) and Stories (Part B) **generalise this exact pattern** from within-one-food to across-the-graph. |
| **WS3B** | `qualifier-prefer` non-mandatory framing + `budgetNote` guard — the template for Alternatives' "option not verdict" and cost guard (A.2, A.4). |
| **WS4B** | Evidence tiers + approved-language gates — every nutrition *reason* on an edge inherits WS4B gating; copy templates inherit the language rules. |
| **WS5A** | Preparation model + "one swap not a ladder" + benefit firewall — `broaden-preparation` edges and the Alternatives trust posture (A.2, A.4). |
| **WS6** | The Food Report contract — Alternatives (Part 12) and a future "relationships" section would be *report sections*, so an edge's reason is the report's own nutrient fact, not a third assertion. |

---

## RECOMMENDATIONS

### Short-term (now, no schema / UI change)

1. **Adopt the two-layer model as the WS7 contract.** Name **Layer 1 (food↔food editorial graph)** and
   **Layer 2 (household↔food consumption overlay)** as *distinct*, meeting only at query time. This single
   distinction prevents the worst architectural mistake: storing private consumption as editorial graph edges.
2. **Recognise the graph already half-exists.** `relationships.ts` is a graph in map form; the canonical
   spine holds variety/group/alias edges; consumption lives in `planner_entries`/`food_diary`/
   `user_item_usage`/`activity_summary`. WS7 is *consolidation and typing*, not greenfield.
3. **Audit the two live alternatives engines** (`whole-food-alternatives.ts`, `uplift-*`) as edge
   *producers*, and document what reasons they assert that WS0 already owns (the duplication to retire).
   Investigation only — extends WS6 Recommendation 2.

### Medium-term (before any build)

4. **Define the edge vocabulary and provenance tag** (`type`, `source: editorial | household-derived`)
   so household-derived "often cooked with" edges can never leak across households.
5. **Define a `householdFoodStory(householdId, canonicalSlug)` read contract** that assembles Layer 2
   facts from existing tables — proving Stories need no new write path for a v1.
6. **Author the framing contract once** (educational / celebratory / opt-in / never-comparative /
   never-deficit) as the single guardrail every feature inherits — the WS7 analogue of WS6's disclaimer.

### Long-term (implementation, future workstreams — each its own investigation + approval)

7. **Type the editorial graph** as the explicit superset of `relationships.ts` + canonical edges.
8. **Build the overlay aggregator** (counts, first-seen, favourites) reading existing tables; consider a
   materialised read-model only if scale demands (SUGGESTION).
9. **Discovery as graph-traversal ∩ not-yet-eaten**, capped and season-ranked.
10. **Seasonal Stories as a scheduled, zero-input, judgement-free job**; Social Sharing as opt-in
    aggregate rendering with a hard child-privacy gate.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`relationships.ts`, canonical spine, `planner_entries`, `food_diary_*`, `user_item_usage`, `activity_summary`, `household_eaters`, WS2B variety surfacing) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** |
| Schema changes | **NO** |
| UI changes | **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No schema changes. No UI changes. No DB changes. Every concrete
build idea is confined to RECOMMENDATIONS (long-term) and SUGGESTION below, and each requires its own
investigation and approval before any commitment.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** A typed `FoodRelationship` graph (Part D.4) as the explicit superset of WS0
  `relationships.ts` + canonical variety/group edges — one store, provenance-tagged, reason-pointers into WS0.
- **SUGGESTION:** A `householdFoodStory(householdId, slug)` reader assembling Layer 2 from existing tables;
  a materialised `household_food_aggregate` read-model **only** if per-food aggregation at scale proves slow.
- **SUGGESTION:** A `season → food` editorial seed (`seasonal-with` edges), small and reviewable like
  `FOOD_BENEFITS`, powering both Discovery's seasonal ranking and Seasonal Stories' "broaden" block.
- **SUGGESTION:** A single **framing contract** module (approved language, no-judgement, no-deficit,
  opt-in, no cross-household comparison) imported by every feature — the WS7 analogue of `HEALTH_DISCLAIMER`.
- **SUGGESTION:** A standing guard that household-derived edges (`source: household-derived`) are never
  served outside their owning household, and per-eater facts naming children are off by default.
- **SUGGESTION:** Render Alternatives as a Food Report section (WS6 Part 12) so an edge's reason is the
  report's own Key Nutrient fact — no third place to assert "wholemeal has more fibre".
- **SUGGESTION:** A "your kitchen remembers" surfacing voice for first-discovered / anniversaries
  (warm-from-inside), rate-limited, to avoid the surveillance smell (B.5).
```
