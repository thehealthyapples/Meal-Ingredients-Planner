# WS11 — Seasonal Stories Engine

> **Status:** Implemented (engine only).
> **Rollback point:** `ws11-rollback-point` (tag at commit `0dd662a`).
> **Scope:** the Seasonal Stories *engine*. **Not** Food Wrapped UI, **not** Pantry Explore, **not** Dashboard, **not** social sharing. Those consume WS11 later.
> **Data impact:** Reads existing data — **YES**. Writes new data — **NO**. Changes meaning of existing data — **NO**. Requires backfill — **NO**.

---

## 1. The question WS11 answers

The lenses, in order of how they face the household:

| WS  | Question | Direction |
|-----|----------|-----------|
| WS8 Discovery | "What else might I enjoy?" | forward |
| WS9 Alternatives | "What else could work here?" | sideways |
| WS10 Stories | "What has our household enjoyed?" | backward |
| **WS11 Seasonal Stories** | **"What did this season of food mean?"** | **backward, framed by a season — with one gentle forward glance** |

A Seasonal Story helps a household **look back on a season of food together**. It is:

- warm
- reflective
- celebratory
- grounded in evidence

It is **NOT** an achievement, a scorecard, a yearly review, a competition, or a nutrition report. A Seasonal Story is a **memory**, never a report card.

---

## 2. The architectural decision: generate, never store

**WS11 stores nothing.** A Seasonal Story is **generated at read time** by orchestrating the engines that already exist, over the household's existing meal history:

```
                       seasonalStories(request)
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   WS11-owned            WS10 Stories             WS8 Discovery
  Season Summary    (Discoveries, Favourite     (Looking Ahead —
  (count meals,      Moments, Seasonal Habits     next season's
   foods, top         — reused verbatim,          foods at UK peak)
   ingredients)       scoped to the season)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                         SeasonalStory
                    (assembled, returned, never persisted)
```

The **only** persisted data is the meal history (`planner_entries`, `food_diary_entries`) that already exists for WS10. There is:

- no `season_summary` table,
- no saved "favourite moment",
- no "seasonal report" row.

**Why this matters for trust:** a stored seasonal report is the seed of a scorecard. Once you persist "Summer 2027: 62 meals", the next obvious feature is "compare to Summer 2026", then "your best summer", then a leaderboard. By generating everything fresh from history, the comparison primitives are never even materialised. Trust by **non-computation** — see §6.

This mirrors WS10's contract exactly ("Store ONLY history. Generate everything else.") and extends it one layer up.

### Files

```
shared/seasonal/
  types.ts    — SeasonalBlockType, SeasonRef, request/result types (reuse WS10 StoryCard)
  trust.ts    — WS11 ban list (extends WS10 → WS9 → WS8) + guard
  engine.ts   — seasonalStories(request): the orchestrator + Season Summary
  index.ts    — public surface
server/tests/
  test-seasonal-stories-engine.ts — four worked households, silence + trust gates
data/seasonal/
  ws11-seasonal-stories-report.json — preserved worked-example output
```

The engine is **pure**: it takes in-memory history, never touches the DB, never writes. The route layer assembles `MealEntry[]` exactly as it already does for WS10.

---

## 3. Season definitions

**Recommendation: FIXED UK meteorological seasons.** Not hemisphere-aware, not location-aware — *yet*.

| Season | Months |
|--------|--------|
| Spring | March, April, May |
| Summer | June, July, August |
| Autumn | September, October, November |
| Winter | December, January, February |

Winter is labelled by the **year of its January/February** months: *Winter 2027* spans **Dec 2026 – Feb 2027**. This is the convention a household intuitively means by "last winter" — the cold stretch that ended this year.

### Why fixed, why UK, and why not (yet) hemisphere/location aware

1. **One season truth across three engines.** WS10 (`seasonOf`) and WS8 (`seasonForDate`) already use fixed UK meteorological months. WS11 adopts the *identical* boundaries. Three engines, one definition — a tomato that WS8 calls "at its summer peak" is the same tomato WS10 files under "summer habits" and WS11 frames in "Summer 2025". Divergent season models would produce subtly inconsistent stories.
2. **The catalogue is UK.** The entire seasonal seed (`shared/discovery/seasonal-map.ts`) and canonical food set are UK-centric. A Southern-hemisphere season model would point a June story at "summer produce" while the seed lists asparagus and purple-sprouting broccoli — UK *spring* foods. Hemisphere-awareness without a hemisphere-aware catalogue is worse than no awareness: it is confidently wrong.
3. **Fixed boundaries are explainable and provable.** "March–May" is something a household can verify against their own memory. Astronomical equinox/solstice dates (Mar 20-ish) drift year to year and surprise people. Meteorological months are clean.
4. **Location-awareness is a real future, not this work.** When the catalogue gains regional seasonal data and households carry a locale, `windowFor()` and the WS8 seasonal seed become the two seams to localise. Logged as a **SUGGESTION** (§12), not built — building it now would be speculative and untestable.

`currentSeasonRef(now)` defaults the season to the one containing `now`; December correctly belongs to the *next* year's winter.

---

## 4. The five blocks

WS11 implements **only these five**, in this order. Empty blocks are **never emitted** (empty is silent).

### Block 1 — Season Summary *(WS11-owned)*

The one block WS11 computes itself. Pure accumulation:

```
This summer you cooked 18 meals together.
  You explored 5 foods.
  You cooked most often with Tomato, Basil and Courgette.
```

- **Meals** = distinct meal *occasions* (`day + slot + meal name`), so several foods in one meal count once.
- **Foods** = distinct **canonical** foods (cherry-tomato + plum-tomato → one "Tomato").
- **Cooked most often with** = top 3 canonical foods by appearance count.

Every number **counts up**. No averages, no targets, no comparison to another season. Stays silent below `SUMMARY_MIN_MEALS = 3` (a thin "you cooked 2 meals" reads as a deficit; 3 is the same "pattern not coincidence" threshold WS10 uses for traditions).

### Block 2 — Discoveries *(reuses WS10 Discovery)*

```
This spring your household discovered: Fennel, Asparagus.
```

Calls `stories({ types: ["discovery"], timeframe: seasonWindow })`. WS10 keys discovery off a food's **first-ever appearance**, so `timeframe = the season` means exactly "foods first met this season" — true to the full history, not just the season slice.

### Block 3 — Favourite Moments *(reuses WS10 Favourite Foods + Family Traditions)*

```
Tomatoes became a household favourite.
Friday became pizza night.
```

Calls `stories({ types: ["favourite_foods", "family_traditions"], now: window.end })` over the **season's own entries**. A favourite is therefore one that featured ≥ 3 times *within this season*; a tradition is one that recurred *within this season*.

### Block 4 — Seasonal Habits *(reuses WS10 Seasonal Habits)*

```
Summer became: Tomato, Basil, Courgette.
```

Calls `stories({ types: ["seasonal_habits"] })` over the season's entries. Because every entry falls in one season, WS10 emits a single habit card — the shape of *this* season.

### Block 5 — Looking Ahead *(reuses WS8 Discovery)*

The one block that faces **forward**.

```
Looking ahead to autumn, you may enjoy Apple, Leek, Beetroot.
```

Calls `discover({ household: { enjoys: seed }, season: nextSeason, types: ["seasonal"] })`. The seed = the season's top foods + any explicit `enjoys`, so suggestions lean familiar. Framed as **invitation** ("you may enjoy"), never instruction. `nextSeasonRef()` rolls spring→summer→autumn→winter→spring (autumn→winter increments the year).

**Only these five.** No others were built.

---

## 5. API design

**Recommendation: `seasonalStories(request)`** — one entry point, one optional context bag.

```ts
seasonalStories({
  household,            // HouseholdHistory (the SAME shape WS10 consumes)
  season?,              // { season, year }; default = season of `now`
  enjoys?,              // string[] — seeds Looking Ahead (WS8 familiarity)
  blocks?,              // SeasonalBlockType[]; default = all five
  now?,                 // Date; default = new Date()
  limitPerBlock?,       // number; default 5
}): SeasonalStory
```

### Why `request`, not `seasonalStories(household)` or `seasonalStories(household, season)`

| Option | Verdict |
|--------|---------|
| `seasonalStories(household)` | Too rigid — can't ask for a *specific* past season, can't narrow blocks, can't seed Looking Ahead. |
| `seasonalStories(household, season)` | Positional args don't extend: every new option (blocks, enjoys, now, limit) becomes another positional or a trailing options bag — the worst of both. |
| **`seasonalStories(request)`** ✅ | **Identical shape to `discover(request)` (WS8), `alternatives(request)` (WS9), `stories(request)` (WS10).** One mental model across all four engines. Absent fields take sensible defaults; new options are additive and never break callers. One endpoint can power Pantry Explore, a Dashboard card, and a future Food Wrapped with no redesign. |

Consistency with the three sibling engines is the deciding factor — a developer who has used any one of them already knows how to call this one.

---

## 6. Trust rules

### Never say
"Best season" · "Most productive" · "Healthiest" · "You improved" · "You failed" · "You only" · "Below average"

### Prefer
"You discovered" · "You explored" · "Became a favourite" · "Featured often" · "You may enjoy"

### How the rules are enforced

Two independent layers:

1. **Non-computation (primary).** The engine never calculates a ranking of seasons, a "best", a deficit, an average, or a progress metric. The Season Summary counts *up* only. Because these quantities are never materialised, no future edit can accidentally surface them — there is nothing to surface.
2. **The ban-list guard (fail-closed backstop).** `shared/seasonal/trust.ts` extends WS10's ban list (which already extends WS9 → WS8) with seasonal-specific terms: `best season`, `worst season`, `most productive`, `productivity`, `healthiest`, `season score`, `report card`, `annual review`, `scorecard`, `you should`, `you need to`, `this season you only`. Any card whose headline or fact contains a banned term is **dropped silently** (never shown), and `assertTrustworthy()` throws in tests. All reused WS10/WS8 cards are re-filtered through the WS11 guard before emission.

The test: *"Would a kind person who cooked alongside this household say this out loud — and would it feel like a **memory** of the season, not a verdict on it?"*

**Validation result:** all **77 cards** across the six worked stories pass the trust gate.

---

## 7. Worked examples

Full output is preserved in `data/seasonal/ws11-seasonal-stories-report.json`. Run: `tsx server/tests/test-seasonal-stories-engine.ts`.

### 7.1 Mediterranean household — four seasons from one history

A two-year Mediterranean kitchen (tomato/olive-oil/feta backbone; basil & courgette in summer; squash & kale in autumn; legumes through winter). The **same** history is framed into four distinct seasons — proof the engine *frames*, it doesn't re-derive.

**Summer 2025**
```
Your season together:
  This summer you cooked 18 meals together.
    You explored 5 foods.
    You cooked most often with Tomato, Basil and Courgette.
Favourite moments:
  Tomato quietly appeared in more and more meals.   (7 meals)
  Friday became greek salad night.                  (14 Fridays)
The shape of the season:
  Summer became: Tomato, Basil, Courgette.
Looking ahead:
  Looking ahead to autumn, you may enjoy Apple, Leek, Beetroot.
```
**Why:** the summary recognises volume without grading it; the habit names the season's signature; Looking Ahead pivots to the very next season's UK produce, seeded by what they already cook.

**Autumn 2025** — discoveries fire correctly (Aubergine, Butternut Squash, Kale — genuinely first met that autumn), habit becomes "Butternut Squash, Mushroom, Lentils", Looking Ahead → winter.

**Winter 2026** (Dec 2025 – Feb 2026) — butter beans & leeks recognised, Looking Ahead → spring. Proves the Dec→Feb window crosses the year boundary correctly.

**Spring 2026** — Fennel and Asparagus surface as discoveries (first met that spring), Looking Ahead → summer.

> **Honesty note on discoveries:** discovery depends on *prior* history depth. Because this synthetic history *begins* in summer 2025, that first season legitimately reads as rich in "first tries" (tomato, olive oil, feta). With a longer real history, the first season's discoveries sharpen to genuinely-new foods, exactly as autumn/winter/spring already do here. The engine is correct; the data is simply young.

### 7.2 Family with children — Summer 2025

```
This summer you cooked 27 meals together.
  You cooked most often with Tomato, Pasta and Strawberry.
Favourite moments:
  Tomato became a household favourite.   (11 meals)
  Friday became pizza night.             (11 Fridays)
The shape of the season:
  Summer became: Tomato, Pasta, Strawberry.
```
**Why:** children have no diary, so every entry is `source: "planned"` — the engine says foods "featured", never that the children "ate". The story still lands as a warm family summer: Friday pizza, breakfast bowls, strawberries. No "should", no nutrition.

### 7.3 Vegetarian household — Autumn 2025

```
This autumn you cooked 25 meals together.
  You cooked most often with Butternut Squash, Lentils and Mushroom.
The shape of the season:
  Autumn brought: Butternut Squash, Mushroom, Lentils.
Looking ahead:
  Looking ahead to winter, you may enjoy Parsnip, Swede, Leek.
```
**Why:** a plant-forward autumn celebrated *as itself* — no comparison to a meat-eating household, no "well done for eating vegetables". Beetroot is recognised as a discovery; Looking Ahead stays plant-forward into winter.

### 7.4 Household discovering legumes — Winter 2026

```
This winter you cooked 17 meals together.
What you discovered:
  This winter your household discovered: Chickpeas, Butter Beans, Cannellini Beans...
Favourite moments:
  Chickpeas quietly appeared in more and more meals.
  Wednesday became chickpea curry night.
The shape of the season:
  Winter brought: Chickpeas, Butter Beans, Leek.
Looking ahead:
  Looking ahead to spring, you may enjoy Spring Onion, Asparagus, Peas.
```
**Why:** the legume journey is recognised as **discovery and habit**, never as "improvement" or "you finally ate more fibre". The household leaned into legumes; the story simply remembers that, warmly.

---

## 8. Validation — every story passes the four questions

For every Seasonal Story the brief requires four checks. Applied to all five block types:

| Question | Season Summary | Discoveries | Favourites | Habits | Looking Ahead |
|----------|:--:|:--:|:--:|:--:|:--:|
| **1. Could this be proven?** (traceable to history) | ✅ counts of real entries | ✅ first-appearance dates | ✅ ≥3 appearances | ✅ season counts | ✅ UK seasonal fact + their foods |
| **2. Could this be generated again?** (deterministic) | ✅ | ✅ | ✅ | ✅ | ✅ (curated seed) |
| **3. Could the household disagree?** (would they say "no, not us"?) | ✅ no — it's their own count | ✅ no | ✅ no | ✅ no | ✅ invitation, not claim |
| **4. Would this make them smile?** | ✅ | ✅ | ✅ | ✅ | ✅ |

Any block failing these is **rejected** — and the engine's empty-is-silent contract means rejection is invisible, never a padded apology.

---

## 9. Trust check — could Seasonal Stories drift?

| Risk | Prevented how |
|------|---------------|
| **Become competitive?** | No ranking is computed; no "best/worst season"; no other-household comparison exists in the data model. Banned terms backstop it. |
| **Become scorecards?** | Nothing is stored, so there is no score to persist or compare across seasons. `season score`, `scorecard`, `report card` are banned. |
| **Become nutrition rankings?** | WS11 reads only food *identity* and *frequency*, never nutrition values. `healthiest` is banned. It cannot rank by health because it never reads health. |
| **Imply progress?** | The Season Summary counts up only — no deltas, no "more than last season". `you improved`, `declined`, `less than last` (inherited from WS10) are banned. |
| **Pressure households?** | No "should", no targets. `you should`, `you need to` banned. Looking Ahead is invitation ("you may enjoy"), framed by curiosity not obligation. |

---

## 10. Future consumers

WS11 was designed to be **consumed**, not to render. It can power all five:

| Consumer | Can WS11 power it? | How |
|----------|:--:|-----|
| **Pantry Explore** | ✅ | Call `seasonalStories({ household, season: currentSeasonRef })` for a "this season" strip; render `blocks` as cards. |
| **Dashboard** | ✅ | Narrow with `blocks: ["season_summary"]` for a single compact "your season so far" tile. |
| **Food Wrapped** | ✅ | Generate all four seasons of a year and combine (see §11). |
| **Social sharing** | ✅ | A `SeasonalBlock`/`StoryCard` is already self-contained, trust-checked text — safe to render to a shareable image. The engine guarantees no card carries judgement, so nothing unshareable can leak. |
| **Annual review** | ✅ | Four `seasonalStories` calls + aggregation = a year. The *engine* permits it; the *framing* must stay a memory, never a "review" (the word "annual review" is itself banned in card text). |

In every case the consumer reads `SeasonalStory.blocks` and renders — it never recomputes a memory. One engine, many surfaces.

---

## 11. Food Wrapped — feasibility (investigated, **NOT** implemented)

**Question:** can Seasonal Stories combine into a "Food Wrapped"?

**Finding: yes, cleanly, with no new engine work.** A year is four seasonal stories plus a thin aggregation layer:

```
2027
  You cooked 248 meals together.        ← Σ season summaries' mealCount
  You discovered 28 foods.              ← union of seasonal discovery cards
  Tomatoes became a household favourite. ← top favourite across seasons (WS10)
  Friday became pizza night.            ← strongest tradition across seasons (WS10)
  You explored 6 tomato varieties.      ← WS10 variety-exploration card, year-scoped
  Most loved meals: ❤️ Pizza, Greek salad ← top traditions/go-tos (WS10)
```

Every line above is **already produced** by WS10/WS11 today:
- meal/food totals → sum the four Season Summaries;
- discoveries → `stories({ types: ["discovery"], timeframe: theYear })`;
- favourites & traditions → `stories({ types: ["favourite_foods","family_traditions"], timeframe: theYear })`;
- variety exploration → WS10's existing variety card.

**The only genuinely new work for Food Wrapped is presentation** (the animated, shareable "Wrapped" UI) and a trivial year-level aggregator — *not* a new memory engine. The trust risk is also identical and already handled: as long as Wrapped renders WS10/WS11 cards verbatim, it inherits the ban-list guard and cannot become a year-end scorecard.

**Decision: do NOT implement.** Logged so the future builder knows the engine layer is ready and the work is UI + a small aggregator. See §12.

---

## 12. SUGGESTION (future ideas — explicitly out of WS11 scope)

1. **Food Wrapped UI + year aggregator** — §11. The engine is ready; this is presentation plus a thin `yearStories()` that calls `seasonalStories` ×4 and merges. Keep it rendering WS10/WS11 cards verbatim to inherit the trust guard.
2. **Hemisphere / location-aware seasons** — when the catalogue gains regional seasonal data and households carry a locale, localise `windowFor()` and `shared/discovery/seasonal-map.ts`. Until then, fixed UK seasons are honest; a hemisphere flip without a hemisphere-aware catalogue would be confidently wrong (§3).
3. **Pantry Explore "this season" strip** — consume `seasonalStories({ season: currentSeasonRef })`; pure rendering.
4. **Dashboard "your season so far" tile** — consume with `blocks: ["season_summary"]`.
5. **Richer Season Summary** — e.g. "your most-cooked meal this season" — only if it remains pure accumulation and passes the four validation questions.

None of these are built in WS11.

---

## 13. The final question

> When a household reads *"Summer became tomatoes, basil and courgettes."* — should they think *"Yes. That was our summer."*?

**Yes — and that is the entire bar.** The worked examples were built to clear it:

- the Mediterranean household's summer genuinely *was* tomatoes, basil and courgettes (7, 6, 5 appearances);
- the family's summer genuinely *was* Friday pizza and breakfast bowls;
- the legume household's winter genuinely *was* chickpeas becoming a Wednesday regular.

Every line is traceable to their own history, regenerable on demand, and impossible to disagree with — because it is *their* count, in *their* words, with no verdict attached. A Seasonal Story succeeds when it disappears into recognition: not "the app says", but **"yes — that was our season."**

---

## 14. Definition of Done — checklist

- [x] Rollback point created and reported (`ws11-rollback-point` @ `0dd662a`); WS0.12 / WS7 / WS8 / WS9 / WS10 confirmed protected.
- [x] Seasonal Stories Engine implemented (`shared/seasonal/`).
- [x] Five blocks implemented (Season Summary, Discoveries, Favourite Moments, Seasonal Habits, Looking Ahead) — and only these five.
- [x] WS8 reused (Looking Ahead).
- [x] WS10 reused (Discoveries, Favourite Moments, Seasonal Habits) verbatim.
- [x] Season definitions investigated; fixed UK seasons recommended with rationale.
- [x] API investigated; `seasonalStories(request)` recommended with rationale.
- [x] Trust rules enforced (non-computation + fail-closed ban-list guard); 77/77 cards pass.
- [x] Four worked households completed across seasons, with "why" for each.
- [x] Validation + trust-drift checks answered.
- [x] Future consumers identified (Pantry Explore, Dashboard, Food Wrapped, Social, Annual review).
- [x] Food Wrapped feasibility explored — **NOT** implemented.
- [x] Nothing stored; reads existing data only; no production UX change; no Pantry/Dashboard/Wrapped/Social built.

## 15. Rollback plan

```
git checkout ws11-rollback-point
```
Removes the Seasonal Stories engine (`shared/seasonal/`, the test, the data report). Preserves catalogue, discovery (WS8), alternatives (WS9), stories (WS10), and all production behaviour — WS11 added only new files and touched no existing engine.
