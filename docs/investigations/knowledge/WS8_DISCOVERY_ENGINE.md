# WS8 — Food Discovery Engine

**Status:** Complete (engine implemented)
**Date:** 2026-06-21
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Rollback tag:** `ws8-rollback-point` → commit `b47afcb`
**Undo everything:** `git checkout ws8-rollback-point` (then delete `shared/discovery/`, the test, the report, this doc)

> **Goal.** Given a food, help households discover other foods they may genuinely
> enjoy. This is curiosity, variety, inspiration — *not* ranking, *not* healthy
> vs unhealthy, *not* upselling, *not* optimisation.
>
> WS8 builds **the engine**. Not Pantry Explore, not Stories, not Social, not
> Seasonal Stories. Those consume WS8 later.

---

## 0. Rollback & safety (mandatory first step — completed before any code)

| Check | Result |
|---|---|
| Git status clean before work | ⚠️→✅ Uncommitted **WS0.12** work was present; committed as `b47afcb` *(chore(ws0.12): preserve …)* to protect it, then the tree was clean |
| WS0.12 protected | ✅ commit `b47afcb` |
| WS7 protected | ✅ commit `a7eaef5` (POC) + `ea90557` (investigation) — untouched |
| Rollback point created | ✅ annotated tag `ws8-rollback-point` → `b47afcb` |
| Catalogue / canonical / knowledge / relationships preserved | ✅ WS8 only **adds** `shared/discovery/`; it reads existing data and changes none of it |

No implementation began until the rollback point was confirmed and reported.

---

## 1. What WS8 is built on

```
Catalogue → Canonical Foods → Knowledge Foods → Benefits → Relationships (WS7)
                                                                  │
                                                                  ▼
                                                    WS8 Food Discovery Engine
```

WS7 proved: **no graph database is required; editorial relationships are
trustworthy; the relationship graph can be traversed from flat data.** WS8 does
not rebuild any of that. It *reads* `getFoodRelationships()` (WS7) and *adds* the
two curated edge sets WS7 lacked (cuisine, season), then wraps the whole thing in
a **selection function** — the real deliverable.

> The WS8 Foundations investigation (`WS8_FOOD_DISCOVERY_FOUNDATIONS.md`)
> established the philosophy: *"The graph is neutral. Discovery is the art of
> choosing which relationships deserve to be shown — and which must be withheld."*
> WS8 (this document) **implements that art.**

---

## 2. Architecture

A single new module, `shared/discovery/`, layered strictly on top of WS7:

| File | Role |
|---|---|
| `types.ts` | `DiscoveryType`, `DiscoverRequest`, `DiscoverySuggestion`, `DiscoverySection`, `DiscoveryResult`, `HouseholdContext`. **No scores anywhere** — ordering is array position only. |
| `cuisine-map.ts` | Curated, *narrow* cuisine → emblematic foods seed (Tier 3 editorial). The new edge WS7 lacked. |
| `seasonal-map.ts` | Curated UK season → peak foods seed + `seasonForDate()`. The other new edge. |
| `trust.ts` | The trust guard: banned vocabulary + `validateReason` / `assertTrustworthy`. **Fails closed.** |
| `engine.ts` | `discover()` — the one entry point. The six discovery types, household context, ranking, trust gate, cap. |
| `index.ts` | Public surface (re-exports `discover`). |

**Data flow per request:**

```
discover(request)
  ├─ resolve anchor (WS7 getFoodRelationships) + household familiarity set
  ├─ build candidate suggestions per requested type
  │     similar / cook_with / explore_varieties → WS7 graph edges
  │     broaden_horizons                        → WS7 neighbours of enjoyed foods
  │     cuisine                                 → curated cuisine seed
  │     seasonal                                → curated season seed
  ├─ TRUST GATE  : drop any suggestion whose reason carries ranking/judgement language
  ├─ DE-DUPE     : one suggestion per slug per section
  ├─ RANK        : familiarity → editorial → same-cuisine → variety → alphabetical
  ├─ CAP         : limitPerType (default 3 — "the graph holds many, the surface shows few")
  └─ EMPTY-SILENT: omit any section with zero survivors
```

No DB tables, no schema change, no migration, no UI. Pure read + compute.

---

## 3. The six discovery types (only these six)

| # | Type (`DiscoveryType`) | Source | Heading | Example |
|---|---|---|---|---|
| 1 | `similar` | WS7 `similar_to` (editorial) + `same_family` (same subcategory/role) | "You might enjoy" | Tomato → Pepper, Aubergine |
| 2 | `cook_with` | WS7 `often_cooked_with` (editorial) | "Lovely cooked together" | Tomato → Basil, Mozzarella, Garlic |
| 3 | `explore_varieties` | WS7 `same_variety` (structural) | "Varieties to explore" | Apple → Gala, Braeburn, Granny Smith |
| 4 | `broaden_horizons` | WS7 lateral neighbours of *each food the household enjoys* | "If you like these, you might enjoy" | Chickpeas + Lentils → Cannellini, Black Beans |
| 5 | `cuisine` | New curated `cuisine-map.ts` | "Explore the cuisine" | Mediterranean → Fennel, Artichoke, Sardines |
| 6 | `seasonal` | New curated `seasonal-map.ts` | "At their best right now" | Summer → Tomato, Courgette, Basil, Peach |

### The one closeness decision that matters (type 1 & 4)

WS7 also exposes a derived `shares_benefits` edge (≥2 overlapping benefits). **WS8
deliberately excludes it from `similar` and `broaden_horizons`.** The Foundations
investigation found benefit-overlap *without a matching cooking role* is the weak
"bacon→sardines" shape — true on paper, a bad discovery in a kitchen:

| With `shares_benefits` (rejected) | Without (shipped) |
|---|---|
| Pumpkin seeds → **Garlic, Courgette** (both "immune-support") | Pumpkin seeds → **Sesame, Chia, Flaxseed** (all seeds) ✓ |
| Chicken → **Broad Beans** (both "muscle-recovery") | Chicken → **Turkey, Duck** (poultry) ✓ |
| Greek yoghurt → **Artichoke, Asparagus** (both "gut-health") | Greek yoghurt → **Kefir** (fermented dairy) ✓ |

`similar` therefore requires **role agreement** — which both `similar_to`
(editorial) and `same_family` (same subcategory) carry. This is the
"two-of-three" closeness rule from the Foundations doc, enforced by *omission*.

---

## 4. Ranking rules (philosophy, not a score)

The brief's ranking order, implemented as a **stable comparator** in
`rankSuggestions()`. There is no numeric score, no "best", no hidden weighting —
just a deterministic preference order, then alphabetical for reproducibility:

1. **Household familiarity** — a suggestion adjacent to something the household
   already enjoys surfaces first. *Already eats Tomato + Pepper → Aubergine
   before Okra.*
2. **Editorial relationships before derived** — `similar_to` / `often_cooked_with`
   (human-authored) outrank `same_family` (computed).
3. **Same cuisine before cross-cuisine** — when an anchor belongs to a cuisine,
   foods from that cuisine rank above foods from others.
4. **Variety before obscurity** — proxy: a food that appears in *some* curated
   cuisine seed (i.e. a recognisable, accessible food) ranks above one that
   doesn't.

**Explicitly NOT optimised for:** nutrients, health, calories, or engagement.
None of those signals enter the comparator at all.

---

## 5. Household context — can it stay delightful?

> *Can discovery use household history without becoming "You should eat this"?*
> **Yes — by using it in two strictly bounded, non-judgemental ways.**

1. **As a ranking hint (familiarity).** Foods adjacent to what the household
   already enjoys are shown *first*. The household never sees a verdict; they just
   notice the suggestions feel close to home. The `familiar` flag is a ranking
   signal — callers may *gently* frame it ("you already love chickpeas") but must
   never render it as a deficiency.
2. **As the seed for `broaden_horizons`.** Given {chickpeas, lentils, butter
   beans}, the engine steps *one comfortable pace* to their shared neighbours
   they don't already eat — Cannellini Beans, Black Beans — and phrases it as
   invitation: *"You enjoy chickpeas and butter beans — cannellini beans sits
   comfortably alongside them."*

**The three questions, answered:**

| Can it remain… | Answer |
|---|---|
| Delightful? | ✅ Yes — "you enjoy X, you might enjoy Y" is the trusted-friend voice. |
| Non-judgemental? | ✅ Yes — invitation only. The banned-vocabulary guard makes "you should eat / you're missing / healthier" *impossible to ship* (it's dropped at the gate). |
| Optional? | ✅ Yes — `household` is an optional field. With no household, the engine still works (anchor-based discovery); household context only *adds* familiarity ranking + broaden_horizons. |

**Framing rules baked in:** the phrasing is always *"You enjoy … you might
enjoy / sits comfortably alongside"*, never *"you should"*. History informs
ordering and the broaden seed; it never becomes prescription.

---

## 6. Trust rules (enforced, not aspirational)

`trust.ts` holds the banned vocabulary — the brief's "never say" list plus the
"DISCOVERY IS NOT" list and judgement phrases:

> better than · healthier · healthiest · superior · the best · worse · unhealthy
> · superfood · optimal · optimise · highest nutrient · most nutritious · top
> food · you should eat · you're missing · upgrade

Every suggestion's reason passes through `isReasonTrustworthy()` **inside the
engine**. A reason that fails is *dropped* (fail closed, empty-is-silent) — it is
never shown and never logged as a user-facing string. The test harness
additionally runs `assertTrustworthy()` as a hard gate over every worked example.

**Preferred phrasing** (used in all generated reasons):
*"Often enjoyed with…", "Similar flavour", "Different variety", "A common
Mediterranean ingredient", "At its best in the UK summer", "sits comfortably
alongside".*

**Anti-commercial / node-type guards (inherited & honoured):** discovery only
ever points food → food. The curated seeds contain no products, no premium SKUs,
no UPF (no ketchup, no truffle oil). There is no commercial edge anywhere and
there is no mechanism to add one.

---

## 7. Worked examples

Generated by `server/tests/test-discovery-engine.ts` (season fixed to summer for
reproducibility; full machine-readable copy in
`data/discovery/ws8-discovery-report.json`). Every example passed the trust gate.

### 7.1 Tomato
- **Varieties:** Cherry, Heirloom, Plum tomato — *it is a tomato; zero leap.*
- **Similar:** Aubergine, Pepper, Olives — *fruiting-veg role agreement.*
- **Cook with:** Basil, Extra Virgin Olive Oil, Garlic — *the caprese / sofrito core.*
- **Cuisine:** Artichoke, Aubergine (Mediterranean), Avocado (Mexican) — *tomato is emblematic of both.*
- **Seasonal (summer):** Aubergine, Basil, Courgette — *the summer Mediterranean garden.*
- **WHY it lands:** every rung is one explainable step; nothing reaches for a product or a "better tomato".

### 7.2 Chickpeas
- **Similar:** Lentils, Butter Beans, Cannellini Beans — *legume role + creamy texture.*
- **Cook with:** Coriander, Cumin, Lemon — *the curry / hummus aromatics.*
- **Cuisine:** Artichoke, Aubergine (Mediterranean), Cardamom (Indian) — *chickpeas span both cuisines.*
- **Seasonal:** Aubergine, Courgette, Tomato.
- **WHY:** the flagship trustworthy discovery — chickpeas→butter beans is triple agreement (role + nutrient + benefit).

### 7.3 Greek yoghurt
- **Varieties:** Yoghurt (its parent canonical).
- **Similar:** Kefir — *fermented dairy with live cultures; the single honest neighbour.* (No artichoke/asparagus — see §3.)
- **Cook with:** Garlic, Mint, Blueberry — *tzatziki and the breakfast bowl.*
- **Seasonal:** summer fruits/veg.
- **WHY:** discovery stays narrow and true rather than padding with weak benefit links.

### 7.4 Chicken
- **Similar:** Turkey, Duck — *poultry; same cooking method.*
- **Cook with:** Coriander, Garlic, Lemon.
- **Seasonal:** summer produce to cook it with.
- **WHY:** lateral peer proteins, never "swap for something healthier" (that is Alternatives, out of scope).

### 7.5 Pumpkin seeds
- **Similar:** Sesame, Chia, Flaxseed — *whole seeds; "explore other seeds".*
- **Seasonal:** summer produce.
- **WHY:** the §3 fix is most visible here — the seed family, not a benefit-overlap grab-bag.

### 7.6 Apple
- **Varieties:** Braeburn, Gala, Granny Smith — *the textbook "explore varieties" case.*
- **Similar:** Grape, Pear — *top fruit.*
- **Cuisine:** Cabbage, Carrots, Leek (British).
- **Seasonal (summer shown; apple peaks in autumn):** summer fruits.
- **WHY:** varieties are the gentlest, highest-trust discovery — the brief's apple example, answered directly.

### 7.7 Household examples
- **Enjoys {chickpeas, lentils, butter beans} → broaden_horizons:** Cannellini Beans, Black Beans, Kidney Beans — all legumes (the §3 closeness fix keeps it on-role, no cross-role benefit grabs) — *"you enjoy chickpeas and butter beans; cannellini beans sits comfortably alongside them."* ★familiar.
- **Enjoys {chickpeas, tomato, olive oil, olives} → cuisine:** Artichoke, Aubergine, Basil — *"a common Mediterranean ingredient."* ★familiar.
- **Anchor Tomato + enjoys {pepper, aubergine} → similar:** Aubergine and Pepper rank first, both ★familiar — *familiarity ranking demonstrated.*

---

## 8. API design — ONE endpoint

> *Should WS8 expose `discoverFood()` / `discoverCuisine()` / `discoverSeason()`
> / `discoverVarieties()` / `discoverBroader()`, OR one `discover()`?*

**Recommendation: ONE `discover()` endpoint.** Five verbs were rejected.

```ts
discover({
  food?: string,                 // anchor (canonical or variety slug) — optional
  household?: { enjoys?: string[] },
  types?: DiscoveryType[],        // pick the sections you want; default = all applicable
  season?: UKSeason,              // default: derived from `now`
  now?: Date,
  limitPerType?: number,          // default 3
}): DiscoveryResult               // { anchor, sections[] } — empty sections omitted
```

**Why one, not five:**

1. **The six types share one selection function.** Trust gate, de-dupe, ranking,
   cap and empty-is-silent are *identical* across every type. Five endpoints
   would duplicate that contract five times — and the moment they drift, trust
   drifts. One endpoint = one trust contract, versioned and reviewable (exactly
   the Foundations doc's "selection function is the deliverable" finding).
2. **Consumers want a mix, not a silo.** Pantry Explore wants similar + cuisine +
   seasonal *together* on one food page; a single call returns all of them
   ranked and capped. Five calls would force the consumer to re-merge and
   re-rank — re-implementing the engine on the client.
3. **`types` already gives the granularity** the five verbs offered, without the
   surface area: `discover({ food, types: ["explore_varieties"] })` *is*
   `discoverVarieties()`, with no extra endpoint to maintain.
4. **Household-only discovery has no natural verb.** `discoverBroader()` and
   `discoverCuisine()` both need household context but no anchor — one optional
   `food` field handles anchored *and* household-only modes cleanly.

---

## 9. Validation — would a household understand / try / find it obvious / delightful?

Applied to every suggestion. Where the answer was NO, the suggestion was removed
by design (not at runtime — by the §3 closeness rule and the curated, narrow
seeds):

| Question | How WS8 satisfies it |
|---|---|
| Would a household **understand** this? | Reasons are one plain sentence; the §3 fix removed machine-y benefit-slug pairs from `similar`. |
| Would they **try** it? | Every suggestion is an accessible, buyable whole food (no products, no obscure SKUs). |
| Would it feel **obvious**? | Varieties and same-role similars are "of course" links; cuisine/seasonal name the *why* explicitly. |
| Would it feel **delightful**? | Friend-voice phrasing + familiarity ranking ("you already love X") make it feel personal, not algorithmic. |
| If NO → **removed**? | Yes: `shares_benefits` cross-role links removed (§3); cuisine kept narrow & curated; empty-is-silent over padding. |

---

## 10. Trust check — the four dangers

| Could discovery… | Prevented by |
|---|---|
| become **judgemental**? | Banned-vocabulary guard (fail closed) + invitation-only phrasing. "You should / healthier / best" cannot ship. |
| become **overwhelming**? | Hard cap (`limitPerType`, default 3) per section; empty sections omitted. The graph holds many; the surface shows few. |
| push **obscure foods**? | "Variety before obscurity" ranking + curated seeds of *emblematic, accessible* foods only. |
| encourage **unhealthy comparisons**? | No nutrient/health/calorie signal enters ranking at all; no "vs", no hierarchy of virtue; food→food only. |

---

## 11. Future consumers — can WS8 power them? (Yes — how)

WS8 is the engine; these are consumers. Each calls `discover()` and renders.

| Consumer | How WS8 powers it |
|---|---|
| ✅ **Pantry Explore** | `discover({ food, household, types: ["similar","cook_with","explore_varieties","cuisine","seasonal"] })` on a food page → ready-made ranked, capped sections. |
| ✅ **Food Reports** | Add a "you might enjoy" block: `discover({ food, types: ["similar","explore_varieties"] })`. |
| ✅ **Alternatives** | *Distinct feature* — Alternatives is directional (WS7 `alternative_for_goal`), Discovery is lateral. They share the WS7 graph but WS8's `discover()` deliberately does **not** emit alternatives (that edge is excluded). Consumers needing alternatives call WS7 directly. |
| ✅ **Stories** | `discover({ household, types: ["broaden_horizons","cuisine"] })` → "your household loves Mediterranean — explore artichokes" narratives. |
| ✅ **Seasonal Stories** | `discover({ household, types: ["seasonal"], season })` → "it's summer — courgettes are at their best" (household-aware via familiarity ranking). |
| ✅ **Food Wrapped** | Aggregate `discover({ household })` across the year; the `familiar` flag and broaden_horizons give "foods you discovered / might love next" retrospectives. |

The single `discover()` contract means every consumer inherits the *same* trust
guarantees for free.

---

## 12. The final question

> When a household sees "You might enjoy…", should they think *"that makes
> sense"*, *"that's interesting"*, or ideally *"of course — why haven't we tried
> that before?"*

**WS8 is tuned for the third.** The ladder of trust is deliberate:

- **Varieties** (Apple → Gala) and **same-role similars** (Pumpkin seeds →
  Sesame seeds) produce *"of course"* — the relationship is identity or role, and
  familiarity ranking surfaces the ones nearest to home first.
- **Cuisine** (Mediterranean → Fennel) and **seasonal** (Summer → Courgette)
  produce *"that's interesting"* in the best way — a knowledgeable, narrow nudge.
- The §3 closeness fix exists precisely to *prevent* the fourth reaction — *"where
  did that come from?"* — by withholding weak cross-role links.

> The engine can already be the friend who says *"you love chickpeas — try butter
> beans"* and means it.

---

## 13. Definition of Done

| Criterion | Status |
|---|---|
| Discovery Engine implemented | ✅ `shared/discovery/` |
| Six discovery types implemented | ✅ similar · cook_with · explore_varieties · broaden_horizons · cuisine · seasonal |
| Household context explored | ✅ familiarity ranking + broaden_horizons (§5) |
| Ranking philosophy defined | ✅ familiarity → editorial → cuisine → variety, as a comparator (§4) |
| Worked examples completed | ✅ six foods + household examples, all trust-passing (§7) |
| API proposed | ✅ one `discover()` endpoint, with reasoning (§8) |
| Trust rules enforced | ✅ banned-vocabulary guard, fail closed, automated gate (§6, §10) |
| Future consumers identified | ✅ six, each with the call (§11) |
| No Pantry UI / Stories / Social / production UX change | ✅ engine only |

---

## 14. Data impact

| | |
|---|---|
| Reads existing data | **YES** — WS7 graph, canonical foods |
| Writes new data | **YES (additive only)** — `shared/discovery/` editorial seeds (cuisine, season); a report JSON artifact |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** · DB change **NO** · Schema change **NO** · UI change **NO** |

---

## 15. Rollback plan

```
git checkout ws8-rollback-point      # → commit b47afcb
```

Remove (if cherry-picking the undo): `shared/discovery/`,
`server/tests/test-discovery-engine.ts`, `data/discovery/`, this doc.
Preserved regardless: catalogue, canonical foods, knowledge foods, WS7
relationships, production behaviour. WS8 added a parallel module and touched none
of them.

---

## 16. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Curated cuisine/season seeds go stale or get too broad | Medium | Kept deliberately short & emblematic; reviewable like `FOOD_BENEFITS`; add to authoring checklist |
| Sparse anchors yield thin discovery | Medium (238 canonical foods, uneven editorial coverage) | Empty-is-silent — never pad; seed breadth is the cure, not algorithmic reach |
| A consumer renders `familiar` as judgement | Low | Documented as ranking-only; invitation phrasing baked into reasons |
| Cuisine breadth drifts toward "everything tagged X" | Low | Architecture forbids it — only the curated seed is read, never a meal-cuisine join |
| Scope creep into Alternatives / Stories | Low | `discover()` deliberately omits `alternative_for_goal`; UI is out of scope |

---

## SUGGESTION (future, out of WS8 scope)

- **SUGGESTION:** Add a `preparation` discovery type (Tier 3) from a *structured*
  prep map (not the free-text `commonForms`) — "you have these raw; lovely
  roasted too." High delight, additive framing, needs authoring.
- **SUGGESTION:** Persist a per-household "already seen" memory so
  `broaden_horizons` rotates rather than repeating — prevents the "repetitive"
  failure. (Overlay / Layer 2 — needs its own investigation.)
- **SUGGESTION:** Promote the WS8 seeds into the production `food_relationships`
  table proposed by WS7 (cuisine/season as new edge types) when Discovery ships
  to a real surface.
- **SUGGESTION:** Broaden the canonical seed with more diversity groups (e.g. an
  `onion` group, a `pepper` group) so Tier-1 cross-food discovery has richer
  structural neighbourhoods to walk.
- **SUGGESTION:** A "completeness critic" pass listing canonical foods with no
  editorial `similar_to` / `often_cooked_with` coverage, to target authoring.

---

## Scope lock

Implemented ONLY the Food Discovery Engine. Did NOT build Pantry Explore,
Stories, Seasonal Stories, or Social; changed no production UX. Every forward idea
is confined to SUGGESTION above.

---

*Engine: `shared/discovery/` · Validation: `server/tests/test-discovery-engine.ts`
· Report: `data/discovery/ws8-discovery-report.json` · Rollback: `ws8-rollback-point`.*
