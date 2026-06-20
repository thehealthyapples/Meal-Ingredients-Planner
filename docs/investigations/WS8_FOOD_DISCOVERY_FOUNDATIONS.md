# WS8 — Food Discovery Foundations Investigation

> **Status:** Investigation only. No implementation. No schema / UI / DB changes.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO
> **Scope:** Layer 1 only — the **food↔food relationship graph**. Households, Stories, Seasons (as
> household features), Healthier Alternatives and the Pantry redesign are **OUT OF SCOPE**.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — only the untracked WS7 investigation was present |
| WS7 investigation protected | ✅ Committed as `ea90557` — *docs(ws7): preserve Food Relationships, Discovery and Stories investigation* |
| Rollback point created | ✅ Tag `rollback/pre-ws8-20260620` → `ea90557` |
| How to undo all WS8 work | `git reset --hard rollback/pre-ws8-20260620` |

No work began until the rollback point was confirmed.

---

## EXECUTIVE SUMMARY

WS7 proved the *architecture*: two layers (a food↔food graph, a household↔food overlay) power five
features. **WS8 zooms into one cell of that architecture — Layer 1 — and asks the only question that
makes Discovery either trustworthy or worthless:**

> The graph can connect almost any food to almost any other food. **Discovery is not the graph. Discovery
> is the editorial art of deciding which of those connections a household deserves to be shown — and which
> must be deliberately withheld.**

The central finding of WS8:

> **THA already owns enough graph to answer "what should I try next?" *safely* — but only for the
> narrowest, most trustworthy relationship types. The trustworthy unit of discovery is small, and that
> smallness is the feature, not a limitation.**

Concretely, the relationship types fall into three trust tiers, set by *how much editorial judgement
sits between the foods*:

| Tier | Relationship types | Editorial cost | Trust | Exists today? |
|---|---|---|---|---|
| **Tier 1 — Structural** (the graph already asserts the link as *identity*) | Same-Family (variety), Broaden-Variety, Same-Group | **Zero new editorial** — already authored in the canonical spine | **Highest** — "a cherry tomato *is* a tomato" is not an opinion | ✅ Live (`variety.ts`, diversity groups, `citrus`) |
| **Tier 2 — Compositional** (the link is *derived* from facts THA already holds) | Similar-Food (shared nutrient / benefit / role), Shares-Benefit | **Low** — derivable from `relationships.ts`, needs a closeness rule | **High, IF the closeness rule is conservative** | 🟡 Latent (`FOOD_NUTRIENTS`/`FOOD_BENEFITS` imply it; no traversal exists) |
| **Tier 3 — Editorial** (the link is a *curated human assertion* with no structural basis) | Same-Cuisine, Seasonal, Broaden-Preparation, Often-Cooked-With | **High** — needs new, reviewed, curated seed maps | **Conditional** — trustworthy *only if* small, curated, and conservatively framed | ❌ Mostly missing (no food→cuisine, no food→season edges) |

The single load-bearing recommendation:

> **Build Discovery from Tier 1 first, extend cautiously into Tier 2, and treat Tier 3 as small curated
> editorial — never as algorithmic reach. The trustworthy unit of discovery is "one comfortable step from
> a food you already love, where the link is something a knowledgeable friend could explain in one
> sentence without checking anything."**

Everything below is the working-out. Three invariants carry forward from the WS0–WS7 lineage:

1. **One knowledge seam (WS7 Invariant 1).** Any *reason* a Discovery edge gives ("also rich in fibre")
   must be the *same* fact the target food's WS0 Key Nutrients / Benefits already assert. Discovery invents
   no nutrition.
2. **Educational / celebratory, never judgemental (WS7 Invariant 2).** Discovery is invitation ("you might
   enjoy…"), never lack ("you're missing…"), never a verdict on the current food.
3. **Empty is silent, not broken (WS7 Invariant 3).** A food with no trustworthy neighbours surfaces
   *nothing* — never filler, never "no suggestions yet".

And WS8 adds the operative principle the brief asks us to assume and test:

> **The graph is neutral. Discovery is the art of choosing which relationships deserve to be shown.**

WS8's whole job is to define *that art*: the rules of choosing.

---

## PART A — THE UNIT OF DISCOVERY

### A.1 The tomato ladder, classified

The brief's ladder is the perfect stress test because every rung is a *different kind* of relationship,
and they degrade in trustworthiness as you descend:

```
Tomato                  ← the food (the starting point)
  ├─ Cherry tomato      ← VARIETY        (Tier 1, structural)  ✅ same plant, smaller
  ├─ Beef tomato        ← VARIETY        (Tier 1, structural)  ✅ same plant, larger
  ├─ Heirloom tomato    ← VARIETY        (Tier 1, structural)  ✅ same plant, older cultivars
  ├─ Sun-dried tomato   ← PREPARATION    (Tier 3, editorial)   ⚠️ same food, transformed
  ├─ Tomato paste       ← PREPARATION/PRODUCT (boundary)        ⚠️ concentrated, a pantry product
  ├─ Tomato sauce       ← PRODUCT        (too far)              ❌ a composed product, not a food
  └─ Ketchup            ← PRODUCT        (too far + UPF)         ❌ a different category entirely
```

Mapped to the brief's labels:

| Item | Variety? | Preparation? | Product? | Discovery? | Alternative? | Too far? |
|---|---|---|---|---|---|---|
| Cherry / Beef / Heirloom tomato | ✅ | | | ✅ (within-food) | | |
| Sun-dried tomato | | ✅ | | maybe | | |
| Tomato paste | | ~ | ✅ | | | borderline |
| Tomato sauce | | | ✅ | | | ✅ too far |
| Ketchup | | | ✅ | | (an *alternative-from*, WS7 Part A) | ✅ too far |

**Finding — the ladder is not one relationship; it is a transition from *identity* to *processing* to
*product*.** Discovery lives at the top (varieties), is *cautious* in the middle (preparations), and
**stops before the bottom** (composed products / UPF). Ketchup is never a *discovery* from tomato — at most
it is the *origin* of a Healthier-Alternative edge pointing the other way (ketchup → tinned tomatoes), which
is explicitly **out of WS8 scope**.

### A.2 The smallest trustworthy unit of discovery

> **The smallest trustworthy unit is the *within-food variety step*: tomato → heirloom tomato.**

Why this is the floor of trust:

- The link is **structural, not editorial** — the canonical spine already asserts "heirloom tomato is a
  variety of tomato" (`foods.ts`, `varieties: [...]`). No human had to *decide* these foods are related;
  their relatedness is their identity.
- It is **maximally adjacent** — it is the same plant, the same diversity group, the same cooking role.
  There is zero risk of the "leap to an ingredient they'll never buy" failure (WS7 C.3).
- It is **already built and shipping** — `variety.ts` `buildVarietyDisplay()` computes exactly "Your
  Variety" vs "Broaden Your Variety" today (WS2B).

This gives WS8 its anchoring definition:

> **A unit of discovery is trustworthy when (a) the link between the two foods can be stated in one plain
> sentence a knowledgeable friend wouldn't need to look up, and (b) the suggested food is *one comfortable
> step* from a food the household already enjoys.** Variety steps satisfy both perfectly. Each tier below
> satisfies them progressively less, which is exactly why trust degrades down the tiers.

---

## PART B — RELATIONSHIP TYPES

Investigated in trust order (Tier 1 → Tier 3), because trust order *is* build order.

### B.1 Same Family — *Tier 1, structural* ✅

```
Tomato ──▶ Cherry tomato · Beef tomato · Heirloom tomato     (varieties of one plant)
```

- **Already represented?** **Yes, fully.** `foods.ts` nests `varieties[]` under each canonical food;
  `variety.ts` surfaces them. Diversity groups (`diversity-groups.ts`) additionally express the
  *many-foods-one-group* case (`citrus` = orange + clementine + …; `lentils` = red + green + puy + beluga).
- **Gaps?** The proving set is 45 canonical foods. "Family" coverage is only as wide as the seed. Beef
  tomato, for example, is **not** in the current `tomato` varieties list (only cherry/plum/heirloom) — so
  family discovery is bounded by editorial seed completeness, not by architecture.
- **Should varieties surface differently from foods?** **Yes.** A variety is a *smaller, safer* prompt than
  a neighbouring food ("try heirloom tomatoes" vs "try fennel"). WS2B already treats them as their own UI
  affordance ("Broaden Your Variety"). WS8 endorses keeping varieties as a *distinct, gentler* discovery
  surface from cross-food discovery.

**Verdict:** the trustworthy core. Build here first. Zero new data.

### B.2 Broaden Variety (cross-food, same group) — *Tier 1, structural* ✅

The brief's onion example:

```
White onion ──▶ Red onion ──▶ Shallots ──▶ Spring onions
```

- **Discoveries or untried varieties?** This is the **key classification question of Part B.** In THA's
  current model, onion is **not** yet seeded, but *by analogy to citrus*, these would either be:
  - **one diversity group ("onion") with several canonical foods** (like citrus) → then they are
    *same-group discoveries*, Tier 1; or
  - **varieties of one "onion" food** → then they are *variety steps*, Tier 1.
- Either way they resolve to **Tier 1** — the relatedness is structural (same allium family, interchangeable
  cooking role). The editorial decision (variety vs same-group) is the WS1.5 "alias vs variety" question,
  already a solved pattern in the canonical spine.

**Verdict:** these are **untried members of a structural group**, not algorithmic discoveries. Treat them
exactly like citrus: the safest cross-food discovery there is. The only work is *seed completeness* (adding
an onion group), never new architecture.

### B.3 Similar Food — *Tier 2, compositional* 🟡

```
Chickpeas ──▶ Butter beans · Cannellini beans · Puy lentils
```

The brief asks *which* similarity counts. Investigated dimension by dimension against existing data:

| Dimension | Data that exists | Verdict for Discovery |
|---|---|---|
| **Same nutrition profile** | `FOOD_NUTRIENTS` (chickpeas & butter-beans both → `fibre`, `plant-protein`, `iron`) | ✅ **Primary signal.** A *shared-nutrient* overlap is computable today and is honest. |
| **Same benefit** | `FOOD_BENEFITS` (both → `gut-health`, `blood-sugar-balance`) | ✅ **Strong secondary.** "Also good for gut health" is already a graph edge in map form. |
| **Same cooking role** | `category` / `subcategory` (`Beans`, `Legumes`) | ✅ **Essential guard.** Role-compatibility is what stops "shares iron" linking chickpeas→spinach (true, but a *bad* discovery — different role). |
| **Same texture** | ❌ not modelled | ⚠️ Desirable, would be new editorial. Defer. |
| **Same cuisine** | ❌ not at food level | ⚠️ Tier 3 — see B.5. |
| **Same diversity group** | `diversityGroupSlug` | ✅ When present, this *is* Tier 1 (see B.2). When absent, fall back to category + nutrient overlap. |

**The closeness rule (the load-bearing Tier 2 decision):**

> Two foods are a trustworthy *Similar-Food* discovery when they share **the same category/role AND a
> meaningful overlap of nutrients or benefits.** Nutrient overlap *alone* is not enough (it would link
> spinach→sardines on iron). Role *alone* is not enough (it would link every bean to every other bean
> regardless of nutrition, which is fine for beans but breaks for "Vegetables").

This is why chickpeas→butter-beans is the canonical *good* example: same role (legume) **and** same nutrients
(fibre, plant-protein, iron) **and** same benefits (gut-health). Three independent agreements. That triple
agreement is the trust threshold.

**Verdict:** buildable from existing data with a conservative two-of-three closeness rule. The risk is
entirely in the *threshold* — too loose and discovery becomes noise (Part D).

### B.4 Broaden Preparation — *Tier 3, editorial* ⚠️

```
Tomato ──▶ Roasted · Sun-dried · Fresh        Mushroom ──▶ Raw · Roasted · Stuffed
```

- **Does preparation belong in the graph?** **Only partially, and carefully.** WS0 `knowledge_foods`
  carries a free-text `commonForms` field (e.g. olive oil → `["bottle","drizzle","dressing"]`; walnuts →
  `["raw","toasted","in trail mix"]`). This is a *latent* preparation signal but it is **free text, not
  structured edges**, and it mixes packaging ("bottle") with preparation ("toasted").
- **Trust implication:** preparation discovery ("try them roasted") is *delightful and low-risk* because it
  keeps the exact same food — there is no "buy something new" leap at all. But WS5A already warned that
  preparation suggestions must never become a "ladder of shame" (deep-fried → baked framed as a verdict).
  In **Discovery** framing (not Alternatives), preparation is purely additive: "you usually have these raw —
  they're lovely roasted too." No judgement, because no swap.
- **Boundary with Alternatives (out of scope):** preparation-as-*discovery* ("also try roasted") is in
  scope as inspiration; preparation-as-*alternative* ("bake instead of fry, it's healthier") is WS7 Part A
  and **out of WS8 scope.** Same data, different framing — the WS7 trust rule applies.

**Verdict:** belongs in Discovery as a Tier 3 *editorial* layer (a curated, structured `preparation` map,
not the free-text `commonForms`). High delight, but needs authoring. Defer behind Tiers 1–2.

### B.5 Same Cuisine — *Tier 3, editorial* ⚠️

```
You enjoy: chickpeas · tomatoes · olive oil   (Mediterranean)
You could try: fennel · artichokes · sardines
```

- **What exists?** **No food→cuisine map.** `cuisine` is a column on the **`meals`** table only (a meal is
  "Mediterranean"), never on canonical foods. There is no edge saying "fennel is a Mediterranean food."
- **How broad is too broad?** This is the trust cliff of Discovery. "Mediterranean" is enormous —
  tomatoes, lamb, pasta, feta, olives, anchovies, oranges, rice, aubergine all qualify. Linking on cuisine
  *alone* would let discovery wander to almost anything (the "random / overwhelming" failure, Part D).
- **Can cuisine discovery stay trustworthy?** **Only if it is curated and narrow** — a hand-authored,
  reviewed "starter foods of cuisine X" seed (a *small* list of emblematic, beginner-friendly foods),
  **not** an algorithmic "all foods tagged Mediterranean." The good example (chickpeas + tomatoes + olive
  oil → fennel) works precisely because fennel is a *curated, emblematic, accessible* Mediterranean food,
  not a random member of a huge set.

**Verdict:** highest delight, highest risk. Trustworthy **only** as small curated editorial. Tier 3, defer,
and never let it become "everything tagged with this cuisine."

### B.6 Seasonal Discovery — *Tier 3, editorial* ⚠️

```
Summer: Tomatoes · Courgettes · Basil        Winter: Squash · Cabbage · Leeks
```

- **What exists?** A **partial, free-text** signal: WS0 `knowledge_foods.seasonality` ("Year-round",
  "Autumn (dried year-round)", etc.). It is descriptive prose, not a structured `season → foods` map, and
  most entries are "Year-round" (because the seed is pantry-heavy: oils, nuts, seeds, tinned fish).
- **Editorial burden:** a trustworthy seasonal map is a *small curated* artefact — a handful of foods per
  UK season — exactly the kind of reviewable seed `FOOD_BENEFITS` already is. Low *volume*, but it is
  genuine editorial that must be kept honest (and UK-specific, since "in season" is geographic).
- **Could it be small and curated?** **Yes — and it must be.** Seasonal discovery's whole charm is
  *timeliness and restraint* ("courgettes are at their best right now"). A long list defeats the warmth.

**Verdict:** Tier 3, small curated seed, high warmth, low volume. A good *second* editorial investment
after preparation. Out of scope to build; flagged as SUGGESTION.

### B.7 The relationship-type summary

| Type | Tier | Link is… | New data needed | Trust |
|---|---|---|---|---|
| Same-Family (variety) | 1 | identity | none | ★★★★★ |
| Broaden-Variety / Same-Group | 1 | identity | seed breadth only | ★★★★★ |
| Similar-Food | 2 | derived (role + nutrient/benefit) | a closeness rule | ★★★★ |
| Shares-Benefit | 2 | derived | a closeness rule | ★★★½ |
| Broaden-Preparation | 3 | curated | structured prep map | ★★★ (additive framing) |
| Seasonal | 3 | curated | season→food seed | ★★★ |
| Same-Cuisine | 3 | curated | cuisine→food seed | ★★½ (cliff: breadth) |
| Often-Cooked-With | (hybrid) | curated *or* household-derived | pairing seed | — (overlay/Layer 2, mostly out of scope) |

---

## PART C — WHAT ALREADY EXISTS

> Question: *Can Discovery be built mostly from existing architecture?* **Answer: Tiers 1–2 yes; Tier 3 no.**

| THA capability | What it gives Discovery | Graph-shaped? | Status for WS8 |
|---|---|---|---|
| **Canonical Food spine** (`shared/canonical/foods.ts`, 45 foods) | the nodes; every endpoint is a canonical slug (WS2E one-slug-one-food) | ✅ nodes | ✅ exists |
| **Varieties** (`foods.ts` `varieties[]`, `variety.ts`) | Same-Family + Broaden-Variety edges, *already surfaced* | ✅ food→variety edges | ✅ **live (WS2B)** |
| **Diversity groups** (`diversity-groups.ts`) | Same-Group edges, incl. many-foods-one-group (`citrus`) | ✅ food→group→food | ✅ exists |
| **`relationships.ts`** (`FOOD_NUTRIENTS`, `FOOD_BENEFITS`, `NUTRIENT_BENEFITS`) | Similar-Food + Shares-Benefit, in **map form** | ✅ a literal graph (food→nutrient→benefit) | 🟡 exists but **no traversal** computes food↔food similarity |
| **`category` / `subcategory`** | the cooking-role guard for Similar-Food closeness | ✅ taxonomy | ✅ exists |
| **Aliases** (`canonical_food_alias`) | string→food resolution (so eaten "tomatoes" maps to `tomato`) | ✅ string→node | ✅ exists (the entry point) |
| **Preparation** (WS0 `commonForms`, WS5A model) | Broaden-Preparation | 🟡 free-text, unstructured | ❌ not graph-ready |
| **Benefits / Nutrition context** (WS0, WS6 report) | the *reasons* Discovery edges cite (Invariant 1 seam) | ✅ | ✅ exists |
| **Plant Diversity report** (`shadow.ts`, computePlantData) | the "eaten vs not-eaten" pattern Discovery generalises | ✅ pattern | ✅ exists |
| **Pantry Explore (WS1)** | the *surface* a Discovery block could live on (future) | — | UI, out of scope |
| **Cuisine** (`meals.cuisine`) | nothing at food level | ❌ | ❌ missing for foods |
| **Seasonality** (WS0 `seasonality` free-text) | partial seasonal hint | 🟡 free-text | ❌ not graph-ready |
| **Existing discovery logic** (`SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT`, `whole-food-alternatives.ts`, `uplift-*`) | meal-level discovery & alternatives, *string/regex keyed* | 🟡 | different domain (meals/alternatives), not food↔food discovery |

**Answers to the brief's four questions:**

1. **How much of Discovery already exists?** The *nodes* and the *safest edges* (Tier 1) exist and ship
   today. The Tier-2 *signal* exists (`relationships.ts`) but **no code traverses it to find similar
   foods** — that traversal is the main missing piece, and it's *logic, not data.* Tier 3 data is absent.
2. **What already behaves like a graph?** `relationships.ts` is literally a graph in adjacency-map form;
   the canonical spine holds typed food→variety and food→group edges in normalised tables. THA has *two*
   real graphs already; they're just never read *as* "find me neighbours of food X."
3. **What relationship types are missing?** Food→cuisine, food→season (structured), food→preparation
   (structured), and food↔food pairing ("often cooked with"). All Tier 3 editorial.
4. **Can Discovery be built mostly from existing architecture?** **Yes for the trustworthy core.** Tiers 1
   and 2 — the highest-trust ~60% of discovery value — need **no new data**, only a traversal + a closeness
   rule. Tier 3 needs new curated seeds but is *optional polish*, not the foundation.

---

## PART D — TRUST (the most important section)

### D.1 Why a user would trust discovery — the anatomy of the good examples

| Good example | Tier | Why it earns trust |
|---|---|---|
| ✅ Chickpeas → Butter beans | 2 | **Triple agreement** — same role (legume), same nutrients (fibre/protein/iron), same benefit (gut-health). A friend could explain it in one breath. |
| ✅ Tomatoes → Heirloom tomatoes | 1 | **Identity** — it *is* a tomato. Zero leap, zero risk, zero editorial opinion. |
| ✅ Mediterranean → Fennel | 3 | **Curated emblem** — fennel is a famous, accessible Mediterranean vegetable; a knowledgeable, *narrow* recommendation, not a random member of a huge set. |

The anatomy of the bad examples — and *exactly which rule each breaks*:

| Bad example | Why it fails | The guard that must stop it |
|---|---|---|
| ❌ Tomatoes → Ketchup | crosses food→**product**→UPF; not a discovery at all (Part A) | **Node-type guard:** discovery edges connect *foods* to *foods*, never foods to composed/UPF products. |
| ❌ Bacon → Sardines | a *single* shared attribute (both savoury animal protein) with **different role, different nutrition, different cuisine** — one weak agreement masquerading as similarity | **Two-of-three closeness rule (B.3):** one shared attribute is never enough. |
| ❌ Mushrooms → Truffle oil | commercially-biased "luxury upsell"; truffle oil is a *flavouring product*, often synthetic, not a food neighbour | **Anti-commercial guard + node-type guard:** discovery never points at premium/branded products; no edge whose only logic is "fancier version of." |

### D.2 The five qualities the brief asks us to define

> *What makes two foods meaningfully related / educationally valuable / close enough / too distant /
> commercially biased / surprising in a good way?*

- **Meaningfully related** = the link is *structural* (Tier 1) or carries **two-of-three** agreement
  (role + nutrient + benefit, Tier 2) or is a *curated editorial emblem* (Tier 3). One coincidental shared
  attribute is *not* meaningful (bacon→sardines).
- **Educationally valuable** = the suggestion teaches something true the user can act on — "butter beans
  are another high-fibre legume" — grounded in the WS0 seam (Invariant 1). If the only thing learned is
  "this product exists," it's an advert, not education.
- **Close enough** = *one comfortable step*. Same role, plausibly the same shopping trip, the same skill to
  cook. The overlay's job (Layer 2, mostly out of WS8 scope) is to keep it adjacent to what they *already*
  love; within Layer 1, closeness = shared category + the closeness rule.
- **Too distant** = a different cooking role, a different category, or a leap requiring new skills/shops.
  Chickpeas→fennel is borderline (different role) and only works via *cuisine* curation, not similarity.
- **Commercially biased** = any edge whose justification is "more premium / branded / processed"
  (truffle oil, ketchup, "artisan" anything). THA has no commercial incentive and must encode none.
- **Surprising in a good way** = an *adjacent* food the user simply hadn't thought of (puy lentils when
  they love chickpeas), where the surprise is "oh, of course" — not "where did that come from?". Good
  surprise is *recognition*; bad surprise is *non-sequitur*.

### D.3 The four failure modes the brief names — and the Layer-1 guard for each

| Failure | How it happens | Layer-1 guard |
|---|---|---|
| **Overwhelming** | surfacing every graph neighbour (a food can have 30+) | **Hard cap of 2–3**, ranked by tier (Tier 1 before 2 before 3) then closeness. The graph holds many; the surface shows few. |
| **Random** | loose closeness (one shared attribute), or unconstrained cuisine breadth | **Two-of-three rule** (B.3) + **curated-only Tier 3** (B.5). Randomness is always a too-loose threshold. |
| **Repetitive** | always suggesting the same 2 foods | **Tier-diversity + rotation** (don't show only varieties forever; vary the *type* of discovery). A Layer-2 "already-seen" memory helps, but is overlay (out of scope). |
| **Untrustworthy** | a single wrong/biased edge poisons the whole feature | **Tier discipline + the WS0 seam.** Every reason must trace to an existing nutrition fact; no free-text claims; no commercial edges. One bad suggestion costs more trust than ten good ones earn. |

### D.4 Remaining a trusted friend

> A trusted friend in the kitchen recommends the *next obvious thing you'd love*, can *explain why in a
> sentence*, **never sells you anything**, and **knows when to say nothing.** Every guard above is in
> service of that one sentence. Discovery that can't pass "would a friend say this, and could they explain
> it?" should not be shown — and per Invariant 3, showing nothing is always a valid, honest answer.

---

## PART E — WHAT DISCOVERY SHOULD NOT DO

Explicit boundaries (the brief's list, each with *where the line is*):

| Discovery must NOT be… | The boundary | Why it matters here (Layer 1) |
|---|---|---|
| **Healthier Alternatives** | Discovery = *lateral* ("another food like this you might enjoy"). Alternatives = *directional improvement* ("a less-processed swap"). Same graph, **different edge type** (`similar-to` vs `alternative-to`) and **different framing.** | The instant discovery implies the current food is *worse*, it becomes judgement (WS7 Part A territory). Discovery never ranks the starting food. |
| **Household Stories** | Stories = Layer 2 aggregation of *your* consumption. Discovery = Layer 1 graph traversal. | WS8 is Layer 1 only. Discovery uses *no* counts, *no* "you've eaten 87" — those are overlay. |
| **Favourites** | Favourites = derived overlay fact. | Out of scope; Layer 2. |
| **Social feeds** | sharing is a Layer-2 rendering. | Out of scope. |
| **Sponsored recommendations** | THA has no commercial edges, ever. | The truffle-oil/ketchup guard (D.1). This is a *permanent* product boundary, not a v1 limitation. |
| **Ranking foods good/bad** | Discovery offers *lateral options*, never a hierarchy of virtue. | The "ladder of shame" trap (WS5A §7.3, WS7 A.4). Tomato→heirloom is not "better tomato," just "another tomato." |
| **Judging household choices** | Discovery says "you might also enjoy," never "you should be eating." | Invariant 2. Invitation, never prescription. |

**The cleanest boundary statement:**

> **Discovery moves *sideways* (to a peer food), with *invitation* framing, citing *existing* facts, never
> *upward* (to a "better" food) or *inward* (to your private history). The moment it moves up or in, it has
> become a different feature with different trust rules — and is out of WS8 scope.**

---

## PART F — WORKED EXAMPLES

For each: candidate discoveries, relationship type, tier, trust reasoning, recommend / do-not-recommend.
Grounded in the *actual* seed data read above where present.

### F.1 Tomato

| Candidate | Type | Tier | Recommend? | Reasoning |
|---|---|---|---|---|
| Cherry / Plum / Heirloom tomato | Same-Family (variety) | 1 | ✅ **Yes** | Structural identity; already in `foods.ts` varieties; the safest discovery there is. |
| Red pepper | Similar-Food | 2 | ⚠️ **Cautious** | Shares role-ish (fruiting veg) + some benefits (skin/heart via `FOOD_BENEFITS`), but nutrient overlap is partial (lycopene vs vitamin-c). Borderline two-of-three. Show only if higher-trust options are exhausted. |
| Sun-dried tomato | Broaden-Preparation | 3 | ⚠️ **Only with curated prep map** | Same food, transformed; delightful but needs structured preparation data (not free-text `commonForms`). |
| Tomato sauce / Ketchup | Product / UPF | — | ❌ **No** | Composed products; cross the food→product line (Part A). Ketchup→tomato is an *Alternative*, out of scope. |
| Strawberry | (shares "fruit") | — | ❌ **No** | Botanically/culinarily unrelated in role; the kind of non-sequitur a loose rule would produce. |

**Why not the others:** the discipline is visible here — discovery from tomato should be *almost entirely
Tier 1 varieties*, because that's where trust is total. Everything below is either cautious or excluded.

### F.2 Chickpeas

| Candidate | Type | Tier | Recommend? | Reasoning |
|---|---|---|---|---|
| Butter beans | Similar-Food | 2 | ✅ **Yes (flagship)** | Triple agreement in real data: both `Beans`/`Legumes`, both → fibre+plant-protein+iron (`FOOD_NUTRIENTS`), both → gut-health+blood-sugar-balance (`FOOD_BENEFITS`). The textbook trustworthy discovery. |
| Black beans / Kidney beans | Similar-Food | 2 | ✅ **Yes** | Same triple-agreement profile; same diversity-group neighbourhood. |
| Red lentils / Puy lentils | Similar-Food | 2 | ✅ **Yes** | Legume role + fibre/protein/folate overlap; "lentils" is its own group, a natural adjacent step. |
| Hummus | Preparation/Product | 3/— | ⚠️/❌ | Hummus is a *preparation* of chickpeas (in scope as prep inspiration) but as a *product* it edges toward out-of-scope. Show as "chickpeas are also lovely as hummus," never as a separate food discovery. |
| Spinach | shares `iron`/`folate` only | — | ❌ **No** | One-attribute overlap, **different role** (leafy green vs legume). The exact bacon→sardines failure: shared nutrient ≠ similar food. |

### F.3 Mushrooms

| Candidate | Type | Tier | Recommend? | Reasoning |
|---|---|---|---|---|
| Button / Chestnut / Shiitake / Oyster mushroom | Same-Family (variety) | 1 | ✅ **Yes** | All seeded varieties of the one `mushroom` plant (`foods.ts`); each even has its own `knowledgeFoodSlug` for variety-specific nutrition. Perfect Tier-1 discovery. |
| Other immune-support foods (garlic, broccoli) | Shares-Benefit | 2 | ⚠️ **Cautious** | Shared benefit (`immune-support`) but very different roles. Benefit-only links are weak; only show framed as "also supports immunity," never as "similar food." |
| Truffle oil | Product (premium) | — | ❌ **No** | The brief's named bad case. Commercially biased, a flavouring product, often synthetic — fails node-type *and* anti-commercial guards (D.1). |
| Roasted / Stuffed mushrooms | Broaden-Preparation | 3 | ⚠️ **With curated prep map** | High delight, same food; needs structured prep data. |

### F.4 Olive oil

| Candidate | Type | Tier | Recommend? | Reasoning |
|---|---|---|---|---|
| Rapeseed oil / other cold-pressed oils | Similar-Food | 2 | ⚠️ **Cautious** | Same role (culinary oil) + unsaturated-fats overlap, but THA's seed only has olive oil in `Oils`; thin neighbourhood. Honest only if a peer oil is seeded. |
| Avocado | Shares-Nutrient/Benefit | 2 | ⚠️ **Cautious** | Both → unsaturated-fats + heart-health (`FOOD_NUTRIENTS`/`FOOD_BENEFITS`); different role (fruit vs oil) but a *defensible* "healthy fats" neighbour. Show framed by the shared benefit, not as "like olive oil." |
| Walnuts / almonds / seeds | Same group ("healthy fats" category) | 2 | ⚠️ **Cautious** | Category `Healthy fats`/`Nuts`/`Seeds` overlap + unsaturated-fats; a "broaden your healthy fats" framing works, but it's a benefit-cluster, not a similar food. |
| "Extra virgin" upsell, infused oils | Product (premium) | — | ❌ **No** | Anti-commercial guard. Discovery never trades up to premium SKUs. |

**Note:** olive oil exposes a real limit — **a sparsely-seeded node has few trustworthy neighbours, so
discovery should fall silent (Invariant 3) rather than reach.** This is the architecture behaving correctly.

### F.5 Greek yoghurt

| Candidate | Type | Tier | Recommend? | Reasoning |
|---|---|---|---|---|
| Kefir | Similar-Food / Shares-Benefit | 2 | ✅ **Yes** | In `relationships.ts` kefir & live-yogurt both → live-cultures, calcium, b12, and both → gut-health+bone-health+digestive-comfort. Strong overlap; a genuinely educational "another live-culture dairy" step. (Greek yoghurt itself isn't seeded, but `live-yogurt` is its clear canonical neighbour.) |
| Live / natural yoghurt | Same-Family-ish | 1–2 | ✅ **Yes** | Nearly the same food; the gentlest possible step. |
| Kimchi / sauerkraut | Shares-Benefit (fermented) | 2 | ⚠️ **Cautious** | Shared `live-cultures` + `gut-health`, but very different role (condiment veg vs dairy). Frame as "other foods rich in live cultures," explicitly *not* "similar to yoghurt." |
| Flavoured/"high-protein" branded yoghurts | Product (commercial) | — | ❌ **No** | Anti-commercial guard; also drifts toward UPF. |

---

## TRUST PRINCIPLE — consequences of "the graph is neutral; discovery is the art of choosing"

Assuming the principle is true, its consequences (the spine of WS8):

1. **The graph being neutral means trust cannot live in the graph — it lives in the *selection function*.**
   So WS8's deliverable is not "a graph" (largely exists) but **the rules of choosing**: tier order, the
   two-of-three closeness rule, the 2–3 cap, the node-type and anti-commercial guards, curated-only Tier 3.
2. **A neutral graph will happily connect tomato→ketchup and mushroom→truffle-oil.** Those edges may even
   be *true*. Neutrality is exactly why the *withholding* rules (Part E, D.1) are as important as the
   surfacing rules. **Discovery is defined as much by its silences as its suggestions.**
3. **Because choosing is editorial, it must be authored once and reviewed** — the same posture WS4B applies
   to nutrition claims and WS7 applies to framing. The selection rules are a *trust contract*, versioned and
   reviewable, not scattered per-surface heuristics.
4. **The neutral graph can be reused** for Alternatives, Stories, etc. (WS7). WS8 only commits that
   *Discovery's* reading of it is the lateral/invitational/cited/capped one. Other readings are other
   features with other contracts.

---

## DEFINITION OF DONE — checklist

| Required | Status |
|---|---|
| Discovery philosophy defined | ✅ "one explainable step from a food you love; defined by its silences" (A.2, Trust Principle) |
| Relationship types defined | ✅ three trust tiers, eight types (Part B, B.7) |
| Existing THA graph capabilities identified | ✅ canonical spine + `relationships.ts` + diversity groups + category (Part C) |
| Missing data identified | ✅ food→cuisine, food→season (structured), food→preparation (structured), pairing (Part C) |
| Trust framework established | ✅ tiers, two-of-three rule, node-type + anti-commercial guards, 2–3 cap (Part D) |
| Worked examples completed | ✅ five, grounded in real seed data (Part F) |
| Clear recommendations provided | ✅ below |
| No implementation / schema / UI / DB change | ✅ investigation only |

---

## RECOMMENDATIONS

### Short-term (now, no schema / UI change)

1. **Adopt the three-tier trust model as the WS8 contract.** Build order = trust order: Tier 1 (structural)
   → Tier 2 (compositional) → Tier 3 (editorial). This single ordering prevents the worst mistake: reaching
   for delightful-but-risky cuisine/season discovery before the safe structural core is solid.
2. **Recognise the trustworthy core already ships.** Tier 1 *is* WS2B "Broaden Your Variety." Discovery v1
   could be "WS2B generalised across diversity groups" with **zero new data** — the highest-trust, lowest-
   cost slice.
3. **Name the selection function as the real deliverable**, not the graph. Document the two-of-three
   closeness rule, the 2–3 cap, and the node-type + anti-commercial withholding rules as a reviewable
   *trust contract* (the WS8 analogue of WS4B's evidence gates / WS7's framing contract).

### Medium-term (before any build)

4. **Define the Tier-2 closeness rule precisely** (same category/role AND ≥2 nutrient/benefit overlaps)
   and validate it against the full seed to confirm it produces no bacon→sardines / spinach→chickpeas
   false positives.
5. **Specify the withholding rules as first-class:** node-type guard (food→food only, never product/UPF),
   anti-commercial guard (no premium/branded edges), and the "empty is silent" honesty rule for sparse
   nodes (the olive-oil case).

### Long-term (implementation, future workstreams — each its own investigation + approval)

6. **A food↔food traversal** over `relationships.ts` + canonical spine producing tiered, capped, reason-
   bearing Similar-Food / Same-Group candidates (logic, not new data).
7. **Curated Tier-3 seeds** — structured `preparation` map, small `season → foods` (UK) map, narrow
   curated `cuisine → emblematic foods` map — each small, reviewed, like `FOOD_BENEFITS`.
8. **A Discovery surface** (likely within Pantry Explore / the Food Report) rendering 2–3 capped
   suggestions with one-sentence "why," empty-silent when there are no trustworthy neighbours.

---

## RISKS

| Risk | Likelihood | Impact | Mitigation (from this investigation) |
|---|---|---|---|
| **Loose closeness rule → noise** (bacon→sardines) | High if naive | Trust-fatal | Two-of-three rule (B.3); validate against full seed (Rec 4). |
| **Cuisine breadth → randomness** | High | High | Curated-only, narrow Tier 3; never "all foods tagged X" (B.5). |
| **Commercial drift** (truffle oil, premium SKUs) | Medium (pressure will come) | Trust-fatal + reputational | Permanent anti-commercial guard; food→food only (D.1, Part E). |
| **Sparse seed → thin/forced discovery** | High now (45 foods) | Medium | Empty-is-silent (Invariant 3); never pad. Seed breadth is the cure, not algorithmic reach. |
| **Tier 3 editorial burden underestimated** | Medium | Medium | Defer Tier 3; ship Tier 1–2 first; keep seeds small and reviewed. |
| **Scope creep into Alternatives / Stories** | Medium | Medium | The sideways/up/in boundary (Part E); Discovery never ranks the start food or reads private history. |
| **Geographic/seasonal inaccuracy** | Medium | Low–Medium | UK-specific curated season map; honest "at their best now" framing, not hard claims. |

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`shared/canonical/*`, `shared/knowledge/relationships.ts`, `shared/knowledge/foods.ts`, category/diversity-group seeds) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** · Schema changes **NO** · UI changes **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No Pantry redesign. No Household Stories. No Seasonal Stories
(as a household feature). No Healthier Alternatives. No UI mockups. No schema / DB changes. Every concrete
build idea is confined to RECOMMENDATIONS (long-term) and SUGGESTION below; each needs its own investigation
and approval.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** Ship "Discovery v0" as Tier 1 only — `variety.ts` generalised across diversity groups —
  proving the feature with **zero new data** and maximal trust before any editorial investment.
- **SUGGESTION:** A `findSimilarFoods(slug)` pure traversal over `relationships.ts` + canonical category,
  applying the two-of-three closeness rule, returning tiered capped candidates with WS0-sourced reasons.
- **SUGGESTION:** A small, reviewed `season → foods` (UK) seed and a *narrow curated* `cuisine → emblematic
  foods` seed — the same editorial shape as `FOOD_BENEFITS`, kept deliberately short for trust.
- **SUGGESTION:** A structured `preparation` map (replacing free-text `commonForms` for discovery use) so
  "also lovely roasted" is a clean edge, not parsed prose.
- **SUGGESTION:** A single **Discovery Selection Contract** module (tier order, closeness rule, 2–3 cap,
  node-type + anti-commercial guards, empty-is-silent) imported wherever discovery renders — the WS8
  analogue of the WS7 framing contract.
- **SUGGESTION:** Broaden the canonical seed (e.g. an `onion` group) so Tier-1 cross-food discovery has
  more structural neighbourhoods to walk — seed breadth, not algorithm, is the growth lever.

---

## FINAL QUESTION

> If a household says **"I enjoy this food,"** can THA confidently answer **"What should I try next?"**

**Yes — confidently, but only within the trustworthy core, and that is the right answer to ship.**

- **Why yes:** For any food with seeded **varieties or a diversity group** (tomato, mushroom, citrus,
  lentils, beans), THA can answer *today* with total confidence, because the relationship is *identity* and
  the surfacing already exists (WS2B). For **legumes, seeds, nuts and other well-populated neighbourhoods**,
  THA can add high-confidence **Similar-Food** answers from `relationships.ts` using a conservative
  closeness rule — chickpeas→butter beans is provable from data in the repo right now.
- **Where it must stay silent (and that is also confidence):** For sparsely-seeded foods (olive oil) or
  when only a single weak attribute is shared (the bacon→sardines shape), the *confident* answer is to say
  **nothing** rather than reach. Saying nothing honestly is itself a trustworthy answer.
- **What is missing for the richest answer:** structured **cuisine**, **season**, and **preparation**
  edges (Tier 3). These unlock the most delightful discoveries (Mediterranean→fennel, "courgettes are at
  their best now") but are *editorial polish on top of a sound foundation* — not prerequisites for a
  trustworthy v1.

> **THA can already be the friend who says "you love chickpeas — try butter beans" and means it. It cannot
> yet be the friend who says "it's June — try courgettes" until a small curated seasonal map is authored.
> The first friend is the one worth shipping first, and the architecture to be that friend already exists.**

---

*End of WS8 — Food Discovery Foundations Investigation.*
