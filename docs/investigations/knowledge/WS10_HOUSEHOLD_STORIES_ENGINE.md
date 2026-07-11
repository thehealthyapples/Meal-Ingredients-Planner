# WS10 — Household Stories Engine

> **Status:** Implemented. Engine complete. Five story types live. Tests passing.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO
> **Scope:** Stories Engine only. Not Pantry Explore. Not Food Wrapped. Not Seasonal Stories UI.

---

## 0. ROLLBACK & SAFETY HEADER (completed before implementation)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Clean on branch `safety/preserve-since-last-prod-20260617-1613` |
| WS0.12 protected | ✅ Tag `ws0.12-rollback-point` → `b47afcb` |
| WS7 protected | ✅ Tag `rollback-ws7-start-20260620` exists |
| WS8 protected | ✅ Tag `ws8-rollback-point` → `0a996f8` |
| WS9 protected | ✅ Tag `ws9-rollback-point` → `52cd86d` |
| WS10 rollback point created | ✅ Tags `rollback/pre-ws10-20260622` AND `ws10-rollback-point` → `52cd86d` |
| How to undo all WS10 work | `git checkout rollback/pre-ws10-20260622` |

No implementation began until rollback protection was confirmed.

---

## EXECUTIVE SUMMARY

WS10 builds the Household Stories Engine — the third and final read-lens on the WS7 household↔food overlay, alongside Discovery (WS8) and Alternatives (WS9).

**Stories face backward. Discovery and Alternatives face forward.** Discovery asks "what else might I enjoy?"; Alternatives ask "what else could work here?"; Stories ask "what has our household enjoyed together?" The three lenses are deliberately separate so that Stories remain pure memory, never prescription.

Five story types are implemented, each with thresholds recommended after investigation:

| # | Story Type | Brief Example |
|---|---|---|
| 1 | Favourite Foods | "Tomatoes became a household favourite." |
| 2 | Discovery Stories | "This spring you discovered: Artichokes, Fennel, Butter beans." |
| 3 | Family Traditions | "Friday became pizza night." |
| 4 | Seasonal Habits | "Summer became: Tomatoes, Basil, Courgettes." |
| 5 | Food Journeys | "You started with Chickpeas. Then discovered Butter beans. Now you enjoy Cannellini beans." |

The engine is **pure** — no DB calls, no stored state. It takes an in-memory `HouseholdHistory` (assembled by the route layer from existing tables) and returns a `StoriesResult`. Stories are generated at read time, never stored.

All 42 story cards across five worked examples pass the trust gate (no ranking, no judgement, no deficit, no gamification, no surveillance language).

---

## ARCHITECTURE

### The Three Layers (WS7 lineage)

```
LAYER 1 — Food↔Food Graph         (WS7 relationships, WS8 Discovery, WS9 Alternatives)
LAYER 2 — Household↔Food Overlay  (WS7 model, WS10 Stories)
```

Stories are Layer 2 only. They aggregate the household↔food overlay per food, per season, and per pattern, framing the result as memory. The only Layer 1 involvement in WS10 is the Seasonal Stories forward "broaden" block — which is WS8 Discovery with a date filter — and that is a **future consumer**, not part of WS10 itself.

### The Read Model

```
householdFoodMemory(HouseholdHistory) 
  ↓ aggregated per canonical food
  ↓ framed as memory
  ↓ filtered by timeframe (optional)
  ↓ filtered by story type (optional)
  → StoriesResult { sections: StorySection[] }
```

The route layer assembles `HouseholdHistory` from:

| Source | What it witnesses |
|---|---|
| `planner_entries` | PLANNED meals (not eating) |
| `planner_entry_eaters` | which eaters a planned meal was for |
| `food_diary_entries` | LOGGED consumption (adults only) |
| `user_item_usage` | engagement (adds, not meals — see §Trap) |
| Canonical resolution (WS2E) | slug → canonical food → varieties |

The engine itself never queries the DB. It works on whatever the route layer passes in.

### File Structure

```
shared/stories/
  types.ts         ← public types (StoryRequest, MealEntry, StoriesResult, etc.)
  trust.ts         ← trust guard (WS9 bans extended with stories-specific bans)
  journey-map.ts   ← curated Food Journey clusters (8 clusters, 60+ foods)
  engine.ts        ← five story generators + stories() entry point
  index.ts         ← public exports

server/tests/
  test-stories-engine.ts   ← worked examples + trust validation + JSON report
```

---

## STORY TYPES — IMPLEMENTATION

### 1. Favourite Foods

Groups all entries by canonical food (variety slugs resolved to parent: `cherry-tomato → tomato`). Applies recency-weighted frequency scoring.

**Favourite Rules — Recommendation:**

A favourite is a food with **≥ 3 appearances AND last seen within 180 days**, sorted by recency-weighted frequency score (count × recency_factor).

| Recency | Factor |
|---|---|
| ≤ 30 days | 1.00 |
| ≤ 90 days | 0.75 |
| ≤ 180 days | 0.50 |
| ≤ 365 days | 0.25 |
| > 365 days | 0.10 |

**Rationale:**
- 3 appearances = deliberate, not coincidental
- 180 days = still current (a favourite you stopped cooking 8 months ago is a former favourite)
- Recency weighting = the favourite you love NOW ranks above the one you ate most in 2023
- Alternatives considered: "most months" (complex, achieved by recency weighting), "multiple eaters" (adds complexity without clarity), raw count only (produces stale favourites)

**Headlines by count:**
- ≥ 10 uses: "Tomatoes became a household favourite."
- ≥ 5 uses: "Chickpeas quietly appeared in more and more meals."
- ≥ 3 uses: "Feta featured regularly in your household."

### 2. Discovery Stories

Tracks first appearances (`MIN(date)` per slug across history) and confirms discoveries.

**Discovery Rules — Recommendation:**

A food is "discovered" on its first appearance. It becomes a **confirmed discovery** (surfaced in a story) after **≥ 2 total uses**.

**Rationale:**
- First use = the discovery actually happened (count up from this moment)
- Second use = not a one-off, worth celebrating
- Below 2 would surface every single ingredient tried once (spam: 100 foods tried once is not a story)
- Above 2 (e.g., 3+) would miss genuine discoveries the household repeated twice (many seasonal foods)

**Two sub-types:**
1. **New foods** — foods whose first use falls within the optional `timeframe` ("This spring you discovered: Artichokes, Fennel, Butter beans"), or all-time if no timeframe
2. **Variety exploration** — distinct slugs sharing a canonical parent ("Your household explored 4 tomato varieties")

Variety detection: when a household has used both `tomato` and `cherry-tomato`, two distinct slugs resolve to the same canonical, triggering a variety card.

### 3. Family Traditions

Detects two pattern types:

**Day-of-week tradition:** a meal/food appearing on the same weekday ≥ 3 times AND ≥ 50% of all appearances fall on that day.
- "Friday became pizza night." (Pizza: 10 of 12 appearances on Fridays)

**Regular go-to:** a food/meal appearing ≥ 4 times in any rolling 30-day window.
- "Breakfast Bowl became your go-to weekday meal." (33 times, mostly weekdays)

**Tradition Rules — Recommendation:**

Threshold of **3 occurrences** for day-of-week traditions and **4 occurrences in 30 days** for go-to patterns.

**Rationale:**
- 3 = enough to be deliberate, not accidental. 2 is a coincidence. 3 is a pattern.
- The 50% day-of-week concentration prevents calling every common food a "Monday food" just because Mondays are common.
- The 30-day / 4-uses go-to threshold catches "quick weekday curry" patterns without requiring day-of-week regularity.

Pattern key is `mealName` (preferred) or `foodName` (fallback) — so "Pizza" is the tradition, not "Tomato" individually.

### 4. Seasonal Habits

Groups entries by UK season (Spring: Mar–May, Summer: Jun–Aug, Autumn: Sep–Nov, Winter: Dec–Feb).

A season needs **≥ 5 entries** to generate a habit card. Top 3 foods (by count) per qualifying season are surfaced. Variety slugs resolve to canonical names to avoid fragmentation.

```
Summer became: Tomatoes, Basil, Courgettes.
  • Tomatoes — featured 20 times this summer.
  • Basil — featured 8 times this summer.
  • Courgettes — featured 6 times this summer.
```

**Only observed behaviour. Never invented.** An empty or sparse season is silent.

### 5. Food Journeys

Uses 8 curated `JOURNEY_CLUSTERS` (legumes, Mediterranean, leafy greens, whole grains, root vegetables, fermented foods, brassicas, stone fruits — 60+ food slugs total).

A journey fires when:
- ≥ 3 confirmed foods from a cluster (each used ≥ 2 times)
- First and latest confirmed food ≥ 60 days apart (proves progression, not simultaneous discovery)

```
You started with Chickpeas. Then discovered Butter Beans. Now you enjoy Cannellini Beans.
  Started with Chickpeas (summer 2024).
  Explored 4 foods in this family: Chickpeas, Lentils, Butter Beans, Cannellini Beans.
```

**Only if the evidence exists. Never invented. Never forward-looking.** The engine looks backward only ("you started with... then... now").

---

## API DESIGN

### Recommendation: `stories(request: StoryRequest)`

The investigation considered three shapes:

| Shape | Assessment |
|---|---|
| `stories(household)` | Too thin — can't express timeframe or type narrowing |
| `stories(household, timeframe)` | Better, but timeframe is ONE of several optional contexts |
| `stories(household, theme/type)` | Better, but misses timeframe, limits to one story type |
| `stories(request)` **← recommended** | One endpoint, optional context bag — mirrors WS8 `discover()` and WS9 `alternatives()` |

**Rationale:** The same pattern that makes WS8 and WS9 composable (one endpoint, absent context = all results, present context = narrowed results) works here. A single `stories(request)` call can power:
- The Pantry Explore "what stories does this food tell?" card → `types: ["favourite_foods", "discovery"]`
- A Seasonal Summary → `timeframe: springWindow, types: ["discovery", "seasonal_habits"]`
- The Food Wrapped equivalent → no types filter, widest possible history
- A Household Dashboard widget → `types: ["favourite_foods", "family_traditions"]`

No API redesign needed when new consumers arrive.

### The `StoryRequest` type

```typescript
interface StoryRequest {
  household: HouseholdHistory;   // in-memory history from the route layer
  types?: StoryType[];           // default: all five
  timeframe?: TimeWindow;        // narrow Discovery + Seasonal to a period
  now?: Date;                    // for recency (defaults to today)
  limitPerType?: number;         // max cards per section (default: 5)
}
```

---

## TRUST RULES

### The trust hierarchy

WS10's trust guard extends WS9 (which extends WS8) — one authoring decision, inherited throughout:

```
WS8 Discovery banned terms
  ↓ extended by WS9 Alternatives banned terms
    ↓ extended by WS10 Stories banned terms
```

### WS10-specific additions

Stories-specific failure modes add to WS9's ban list:

| Category | Banned terms |
|---|---|
| Gamification | streak, achievement, leaderboard |
| Deficit framing | fell short, below average, you only ate, you only cooked, only managed, not enough, missing out |
| Decline comparison | less than last, fewer than last, declined, you failed, failed to |
| Health verdicts | you improved, you're doing well, well done |
| Surveillance | we tracked, we noticed, we recorded, we logged |

### The guard mechanism

The trust guard **fails closed**: any story card whose headline or facts carry a banned term is **dropped by the engine** (never shown), not styled away. The test harness asserts against all generated text as a hard gate.

Trust by **non-computation**, not by copy-policing:
- No `deficit` primitive → "only X times" is uncomputable
- No `declineVsSelf` primitive → "fewer than last spring" is uncomputable
- No `rankMembers` primitive → "Dad eats worst" is uncomputable
- No `compareToOtherHousehold` primitive → "below average" is uncomputable
- No `rejectionCount` primitive → "rejected mushrooms 12 times" is uncomputable

### Provenance-aware verbs

The `source` field on each `MealEntry` governs verb choice:

| Source | Verb |
|---|---|
| `planned` | "featured in", "appeared in your meals", "cooked with" |
| `logged` | "enjoyed", "ate" |
| mixed / unknown | "featured" (safest default) |

For children (`userId = null` → source always `"planned"`): verbs must be plan-based. Never claim eating for a child. "You introduced Daisy to tofu last spring" is warm and honest; "First time Daisy ate tofu" is a claim the data cannot support.

---

## VALIDATION — "WOULD THIS MAKE SOMEONE SMILE?"

For every story type, against the brief's four questions:

### 1. Could this be proven?

| Story | Evidence | Provable? |
|---|---|---|
| "Tomatoes became a household favourite." | 38 `planner_entries` with tomato resolving to canonical | ✅ Observable count |
| "Friday became pizza night." | 10 of 12 pizza entries have `getDay() === 5` | ✅ Observable pattern |
| "Your household explored 4 tomato varieties." | 4 distinct slugs under canonical "tomato" | ✅ Observable variety |
| "You started with Chickpeas." | MIN(date) for chickpeas < MIN(date) for butter-beans | ✅ Observable ordering |
| "Summer became: Tomatoes, Basil, Courgettes." | Counts by season from entry dates | ✅ Observable grouping |

### 2. Could a household disagree?

Yes — and the engine makes this possible. A household that stopped making pizza on Fridays 6 months ago can disagree with a tradition card. This is correct: the tradition detection uses full history, not just recent history. A future enhancement would add recency gating to tradition detection (SUGGESTION).

The `FAVOURITE_MAX_DAYS = 180` recency gate on favourites already handles this for the favourite story type.

### 3. Is anything inferred beyond evidence?

**No** — by construction. The primitives the engine implements are:
- `count(food, window)` — observable
- `firstSeen(food)` — observable  
- `topByFrequency(window, N)` — observable
- `patternByDayOfWeek(meal)` — observable
- `peakWindowCount(food)` — observable
- `distinctVarieties(canonical)` — observable
- `journeyProgression(cluster)` — observable (first/last dates, count)

The primitives the engine **does NOT implement**:
- `deficit(food, target)` — no targets exist
- `declineVsSelf(window, prev)` — no decline comparison
- `rankMembers(...)` — no person-vs-person
- `compareToOtherHousehold(...)` — no cross-household
- `rejectionCount(food, eater)` — no negative counting

### 4. Would this make someone smile?

Tested with the "kind friend" heuristic: "Would a kind person who has cooked alongside this household for two years say this out loud, unprompted, and would it make them smile?"

- "Tomatoes became a household favourite." → yes ✅
- "Friday became pizza night." → yes ✅
- "Your household explored 4 tomato varieties." → yes ✅
- "You started with Chickpeas. Then discovered Butter Beans. Now you enjoy Cannellini Beans." → yes ✅
- "Summer became: Tomatoes, Basil, Courgettes." → yes ✅

---

## WORKED EXAMPLES

All five worked examples pass the trust gate and produce expected story sections. Full output is in `data/stories/ws10-stories-report.json`.

### Example 1: Tomatoes

```
Foods your household loves:
  Tomato became a household favourite.
    Tomato featured in 38 meals.
    Across: Pasta Sauce, Greek Salad, Pizza.
  Basil quietly appeared in more and more meals.
  Courgette quietly appeared in more and more meals.

Foods your household has discovered:
  Your household discovered: Tomato, Basil, Cherry Tomato, Courgette, Heirloom Tomato.
  Your household explored 4 tomato varieties.
    Varieties: Tomato, Cherry Tomato, Plum Tomato, Heirloom Tomato.

Your household traditions:
  Friday became pizza night.
    Pizza appeared on Fridays 10 times.

Your seasonal habits:
  Summer became: Tomato, Basil, Courgette.
    Tomato — featured 20 times this summer.
    Basil — featured 8 times this summer.
    Courgette — featured 6 times this summer.
```

**WHY this works:** Tomato has 38 confirmed planner entries, qualifies for favourite (count ≥10, last seen < 30 days). Four distinct tomato slugs trigger the variety card. Pizza appears on 10 of 12 Fridays (83% > 50% threshold) → Friday tradition. Summer has tomato/basil/courgette each ≥5 entries → seasonal habit.

### Example 2: Chickpeas (Legume Journey)

```
Foods your household loves:
  Chickpeas became a household favourite. (16 meals)
  Lentils became a household favourite. (13 meals)
  Butter Beans became a household favourite. (11 meals)
  Cannellini Beans quietly appeared in more and more meals. (8 meals)

Your food journeys:
  You started with Chickpeas. Then discovered Butter Beans. Now you enjoy Cannellini Beans.
    Started with Chickpeas (summer 2024).
    Explored 4 foods in this family: Chickpeas, Lentils, Butter Beans, Cannellini Beans.
```

**WHY:** 4 legume cluster foods each used ≥2 times; first (Chickpeas, summer 2024) to latest (Cannellini Beans, spring 2025) = ~300 days > JOURNEY_MIN_SPAN_DAYS (60). Journey fires.

### Example 3: Greek Yoghurt (Breakfast Habits)

```
Foods your household loves:
  Yoghurt became a household favourite. (20 meals)
  Strawberry quietly appeared in more and more meals.
  Blueberry quietly appeared in more and more meals.

Your household traditions:
  Breakfast Bowl became your go-to weekday meal. (33 times, mostly weekdays)

Your seasonal habits:
  Summer became: Yoghurt, Strawberry, Blueberry.
```

**WHY:** `greek-yoghurt` resolves to canonical `yoghurt`; 20 recent uses → favourite. Summer has yoghurt+strawberry+blueberry each appearing heavily → seasonal habit fires.

### Example 4: Pizza (Friday Tradition)

```
Foods your household loves:
  Tomato became a household favourite. (12 meals)

Your household traditions:
  Friday became pizza night.
    Pizza appeared on Fridays 10 times.
```

**WHY:** Pattern key is `mealName: "Pizza"`, not the food slug. 10 of 12 pizza entries on Fridays (83% > 50%) → "Friday became pizza night."

### Example 5: Mediterranean Household

```
Foods your household loves:
  Tomato became a household favourite. (20 meals)
  Extra Virgin Olive Oil became a household favourite. (18 meals)
  Feta became a household favourite. (10 meals)
  Courgette quietly appeared... (5 meals)
  Butter Beans quietly appeared... (6 meals)

Your seasonal habits:
  Summer became: Tomato, Extra Virgin Olive Oil, Courgette.
  Autumn brought: Feta, Aubergine, Chickpeas.

Your food journeys:
  You started with Chickpeas. Then discovered Butter Beans. Now you enjoy Cannellini Beans.
  Your family embraced Mediterranean cooking: Tomato, Courgette, Aubergine and more.
    Explored 6 foods in this family: Tomato, Extra Virgin Olive Oil, Chickpeas, Courgette, Feta, Aubergine.
```

**WHY:** 6 Mediterranean cluster foods each confirmed (≥2 uses) spanning summer 2024 to spring 2026 → Mediterranean journey fires. Legume journey also fires independently.

---

## TRUST CHECK

| Risk | How prevented |
|---|---|
| **Stories become competitive** | No cross-household primitive. No ranking primitive. Uncomputable by construction. |
| **Stories become judgemental** | Trust guard bans all verdict language. Engine only implements count-up primitives. |
| **Stories fabricate memories** | Every fact is derived from observed entries only. Journey requires ≥60-day span of actual use. Discovery requires ≥2 uses. |
| **Stories imply progress where none exists** | No `declineVsSelf` primitive. Stories surface only rises and presences. Silence on absence. |
| **Gamification creep** | "streak", "achievement", "leaderboard" all banned. Milestones not implemented (future consumer decision). |
| **Surveillance smell** | "we tracked", "we noticed" banned. Voice is "your kitchen remembers", not "we logged". Pull, not push. |
| **Child privacy** | Per-eater stories note `source: "planned"` for children. Verbs are plan-based. Hard child gate for sharing is a future consumer decision. |
| **Activity_summary miscount** | Engine takes `MealEntry[]` from the route layer, not `activity_summary`. Route must count from `planner_entries` / `food_diary_entries`, not `lifetimePlannerAdds`. |

---

## FUTURE CONSUMERS

| Consumer | How WS10 powers it |
|---|---|
| **Pantry Explore** | `stories(request, types: ["favourite_foods", "discovery"])` filtered to one canonical food — the "your history with this food" card |
| **Food Reports** | The favourite + discovery sections become the "Your history" section of a Food Report, reusing WS6's Key Nutrient facts for any nutritional aside |
| **Seasonal Stories** | `stories(request, types: ["discovery", "seasonal_habits"], timeframe: seasonWindow)` + the WS8 "broaden next season" block appended by the Seasonal Stories consumer |
| **Food Wrapped** | `stories(request)` with the widest possible history window + a consumer that renders the top card per section as a shareable card (with the hard child gate enforced at the consumer, not in WS10) |
| **Social sharing** | Aggregates only (headlines + counts), never raw entries. Child gate at the share renderer. WS10 provides the aggregates; the consumer decides what is shareable. |
| **Household Dashboard** | `stories(request, types: ["favourite_foods", "family_traditions"])` → the household's identity card |

WS10 is a single `stories()` call. Every consumer picks the sections it needs. No API redesign required.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`planner_entries`, `planner_entry_eaters`, `food_diary_days`/`_entries`, `user_item_usage`, canonical spine + `canonical_food_alias`, WS2B varieties — assembled by the route layer into `HouseholdHistory`) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** |
| Schema changes | **NO** |
| UI changes | **NO** |

---

## RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Overclaiming consumption** — "featured" used when THA only witnessed planning | **High** | `source` field on `MealEntry`; verb vocabulary in engine defaults to "featured" (plan-safe); route layer must set `source` correctly |
| R2 | **Activity_summary miscount** — route uses `lifetimePlannerAdds` as meal count | **High** | Route must use `planner_entries` count, not `activity_summary`. Documented in architecture. |
| R3 | **Stale tradition** — household stopped Friday pizza 6 months ago, still shows | **Medium** | Tradition detection uses full history. Future: add recency gate (SUGGESTION). |
| R4 | **Child exposure** — per-eater facts surface at share time | **Medium** | WS10 itself has no sharing. Sharing consumers must enforce the hard child gate. |
| R5 | **Journey mismatch** — journey cluster uses wrong canonical slug | **Low** | All JOURNEY_CLUSTERS slugs verified against CANONICAL_SEED. Test suite catches slug mismatches. |
| R6 | **Single-food seasonal habit** — only 1 food in a season → no card | **Low** | Threshold is ≥2 distinct canonical foods per season. Sparse seasons are silent. |
| R7 | **Notification spam** — every discovery surfaced as a push notification | **Low** | WS10 generates on demand only. Push notification is a consumer decision. Rate-limit at the consumer. |

---

## SCOPE LOCK

**Implemented:** Household Stories Engine, five story types, trust guard, journey map, worked examples, test suite.

**Not implemented (out of scope):**
- Pantry Explore UI
- Food Wrapped UI
- Seasonal Stories UI
- Social sharing
- Production route wiring
- Per-eater story surfaces (the engine accepts `eater` on MealEntry; per-eater rendering is a consumer decision)
- Milestone / achievement system (explicitly NOT a story — see trust rules)

---

## SUGGESTION (future ideas, out of current scope)

- **SUGGESTION:** Route wiring — a `/api/stories` endpoint that assembles `HouseholdHistory` from `planner_entries` + `food_diary_entries` and calls `stories(request)`. The engine is ready; only the route is missing.
- **SUGGESTION:** Recency gate on tradition detection — a tradition last seen > 90 days ago could be presented as "was a tradition" rather than "is a tradition".
- **SUGGESTION:** Per-eater favourite cards — "Lilly's favourites: lentils, strawberries" — using `planner_entry_eaters` data. WS10 accepts `eater` on MealEntry; the rendering is a consumer decision with the child gate enforced there.
- **SUGGESTION:** A materialised `household_food_memory` aggregate (count, firstSeen, lastSeen per canonical food per household) if on-demand aggregation proves slow at scale. The engine interface stays identical; the route assembles from the aggregate instead of raw entries.
- **SUGGESTION:** A "story of the week" scheduler — once per week, pick the richest story card and surface it quietly (pull, not push). Rate-limit: one card per week maximum.
- **SUGGESTION:** The user's eraser — a `deleteStoryFact(household, food)` endpoint that pins a "don't surface" flag on a specific food in story context. Because stories are generated at read time, "erasing" means storing a small exclusion list, not deleting entries.
- **SUGGESTION:** Seasonal Stories consumer — `stories(request, { types: ["discovery", "seasonal_habits"], timeframe: seasonWindow })` + a "what to try next season" block from WS8 Discovery, composed at the consumer level.

---

## FINAL QUESTION — ANSWERED

> **When a household reads "Tomatoes became your family favourite." should they think: "Yes… I remember that."?**

**Yes — and the architecture explains why.**

Four properties make a story warm rather than clinical, and all four are present in the WS10 output:

1. **It counts up, never down.** "38 times" is an accumulation, not a shortfall. There is no "but only 38…", no "below your average", no "fewer than last year". The no-deficit architecture makes these impossible by construction.

2. **It is specific and placed in time.** "Summer became: Tomatoes, Basil, Courgettes" is a dated observation. "First tried summer 2024" is a photograph, not a statistic. The kitchen places memories in seasons, not in database timestamps.

3. **It observes habits without prescribing them.** "Friday became pizza night" notices a pattern and says nothing about whether pizza is a good choice. The moment an observation acquires a recommendation, it stops being memory. WS10 stops at the observation.

4. **It names affection, not virtue.** "Tomatoes became a household favourite" celebrates what the household loves. Pizza is called out as the tradition, not sidelined as the unhealthy option. A system optimising health would bury pizza; a kitchen that remembers leads with what was loved.

The single discipline that makes it work: **honest provenance-aware verbs, a no-deficit/no-comparison read model, and trust by non-computation**. The same data that could power surveillance — "we tracked every meal since day one" — becomes warmth when the system counts up, speaks softly, stays in the home by default, and never computes the scoreboard primitives that would make the data feel cold.

That is a kitchen that remembers. That is what WS10 builds.

---

*WS10 — Household Stories Engine. Implemented 2026-06-22.*
*Engine: `shared/stories/`. Test: `server/tests/test-stories-engine.ts`. Report: `data/stories/ws10-stories-report.json`.*
*Rollback: `git checkout rollback/pre-ws10-20260622`.*
