# WS10 — Household Food Stories Investigation

> **Status:** Investigation only. No implementation. No schema / UI / DB changes.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO
> **Scope:** Layer 2 only — the **household↔food consumption overlay**, read as *memory* rather than as
> graph traversal (WS8) or goal-driven swap (WS9). The food↔food relationship graph (Layer 1) is read only
> for the single forward-looking "broaden next season" block of a Seasonal Story.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — only the untracked WS9 investigation was present |
| WS9 investigation protected | ✅ Committed as `17dee8e` — *docs(ws9): preserve Goal-Driven Alternatives investigation* (was previously untracked and unprotected) |
| Rollback point created | ✅ Tag `rollback/ws10-pre-investigation-20260620` → `17dee8e` |
| How to undo all WS10 work | `git reset --hard rollback/ws10-pre-investigation-20260620` |

No work began until the rollback point was confirmed.

---

## EXECUTIVE SUMMARY

**Stories are the third reading of the WS7 overlay, and the only one that points backwards. Discovery
(WS8) asks "what next?"; Alternatives (WS9) ask "what instead?"; Stories ask "what already happened, and
was it good?" Stories add no new edges and almost no new graph traversal — a Story is the household↔food
consumption overlay (WS7 Layer 2) *aggregated per food and framed as memory.***

The brief's question — *can THA become a kitchen that remembers, without becoming surveillance,
competition, optimisation or judgement?* — has a clean architectural answer and a sharp honesty caveat.

**The architectural answer is yes.** Every fact in the brief's worked examples ("ate tomatoes 87 times",
"explored 4 varieties", "first tried heirloom in summer 2027", "most often paired with basil") is an
aggregation over rows THA already stores: `planner_entries` + `planner_entry_eaters` (who, what, when),
`food_diary_entries` (what was logged as eaten, with a date), `user_item_usage` (`useCount`, `lastUsedAt`),
and the canonical resolution path (`canonical_food_alias` → canonical food → varieties) that WS2B already
walks. No new write path, no new edge type, no backfill is required to *read* a household's history. A
Story is a read model.

**The honesty caveat is the whole investigation, and it is this:**

> **A kitchen remembers what it *witnessed*, and THA witnessed *planning*, not eating. The data records
> what was put on the plan and — for adult account-holders only — what was logged in a diary. It does not
> record what was actually cooked, what was actually eaten, or what a child put in their mouth.**
> `planner_entries` has no "cooked" flag (`shared/schema.ts:429`); `food_diary_entries`
> (`shared/schema.ts:1194`) is keyed to a `userId` and **children without accounts (`userId = null`,
> `shared/schema.ts:1090-1091`) have no diary at all.** So "First time Daisy ate tofu" is, in the data,
> *"first time tofu was planned for Daisy."* The brief's verbs ("ate", "discovered", "fell in love with")
> claim more than the rows can prove.

This is not a reason to abandon Stories. It is the **design constraint that keeps them warm.** A friend who
remembers your kitchen says *"you cooked a lot of pizza this spring"* — soft, generous, allowing the
exception. A surveillance system says *"you consumed 87 units of tomato."* The honest framing is also the
trustworthy framing: **Stories must use the gentle, fuzzy, forgiving verbs of memory, not the precise verbs
of measurement — and they should be honest in tone precisely because the data underneath is approximate.**
The gap between *planned* and *eaten* is not a bug to hide; it is the reason the voice must stay soft.

The five load-bearing findings:

1. **A Story is the overlay aggregated per food, framed as memory** — Layer 2 in isolation, no graph hop
   (except a Seasonal Story's single forward "broaden" block, which is just WS8 Discovery with a date
   filter). This is exactly WS7 Part B, deepened.
2. **Provenance of every fact must be honest.** *Planned* (`planner_entries`), *logged-eaten*
   (`food_diary_entries`), and *engagement* (`activity_summary` lifetime *adds*) are three different
   signals. They must never be silently merged into one confident "you ate X". `activity_summary` counts
   **adds, not meals**, and must not be used as a "meals cooked" count.
3. **Favourites are derived, never declared — but the user may always overrule.** A favourite is high
   frequency + recency for a canonical food. Inference is the default (curation is a chore); correction is
   a right (a wrong "favourite" is a small betrayal of being known).
4. **Per-eater memory is the highest delight and the highest risk, and children invert the usual rule.**
   For adults, the diary is the richer source; for children, *only the plan exists*, and a child's name
   plus a food history is a safeguarding surface the moment it leaves the home. Children are celebrated
   *inside* the household and are a hard boundary *outside* it.
5. **The overlay must have no concept of a deficit, a decline, or another household.** Stories celebrate
   what happened and what rose; they are structurally incapable of saying "you fell short", "you did less
   than last season", or "you did less than the Smiths" — because those primitives are simply never
   computed. Absence is silent. This is what separates a memory from a scoreboard.

Three invariants carry forward from the WS0–WS9 lineage and bind everything below; WS10 adds a fourth:

1. **One knowledge seam (WS7 Inv. 1).** Any nutritional aside in a Story ("tomatoes are rich in lycopene")
   is the *same* fact the food's WS0 Key Nutrients already assert — never a new claim. A Story is mostly
   *not* nutritional; when it is, it points at WS0.
2. **Educational / celebratory, never judgemental (WS7 Inv. 2).** A Story celebrates; it never grades.
3. **Empty is silent, not broken (WS7 Inv. 3).** A household with three logged meals gets a gentle card or
   none — never a card padded with "you've only…".
4. **WS10's contribution — Honest memory.** *A kitchen remembers what it witnessed, in the voice of
   memory.* The data is approximate (planned ≠ cooked ≠ eaten; children have no diary); the framing must be
   correspondingly soft, generous and forgiving. Precision is the voice of surveillance; fuzziness is the
   voice of a friend.

---

## PART 1 — STORIES PHILOSOPHY

### 1.1 What a food story is, and is not

The brief draws the line and WS10 endorses it:

| A food story is NOT | A food story IS |
|---|---|
| calories, macros, nutrients | memories |
| rankings, scores | favourites |
| optimisation, targets | exploration |
| a verdict on the household | traditions |
| a comparison to others | discoveries |

The distinction is not cosmetic. **Calories and macros are *measurements of a moment*; a story is *the
shape of a relationship over time*.** "You ate 2,100 kcal on Tuesday" is data. "Tomatoes have been a part
of your kitchen for two years, in eighteen different meals, and your favourite is still homemade pizza" is
a memory. The first invites judgement (too much? too little?). The second invites only recognition. **THA
already has a place for measurement — the Weekly Nutrition Report, the Food Diary metrics. Stories must be
the place that deliberately refuses to measure.**

### 1.2 What makes the tomato example feel warm, human, meaningful

The brief asks this directly. Decomposing the example:

```
Tomato — your household
  • ate tomatoes 87 times                      ← scale of relationship (a number, but a generous one)
  • explored 4 varieties                       ← curiosity, recognised
  • first tried heirloom tomatoes summer 2027  ← a specific memory, placed in time
  • most often paired tomatoes with basil      ← a habit, observed without comment
  • favourite tomato meal: ❤️ Homemade pizza   ← affection, named
```

Four properties make this warm rather than clinical:

1. **It counts up, never down.** Every number is an accumulation ("87 times", "4 varieties") — an
   achievement of *presence*, never a shortfall. There is no "but you only…", no "below target". Warmth is
   structurally impossible if the overlay can express a deficit; see §10.
2. **It is specific and placed in time.** "First tried heirloom tomatoes in summer 2027" is a *memory*, not
   a statistic, because it has a *when* and a *first*. Generic counts feel like analytics; a dated first
   feels like a photograph. (Source: `MIN(createdAt)` across resolving entries — WS7 B.2.)
3. **It observes habits without prescribing them.** "Most often paired with basil" notices a pattern and
   says nothing about whether it's good. A friend notices you always have basil; they don't suggest you
   diversify your herbs. The moment an observation acquires a recommendation, it stops being memory.
4. **It names affection, not virtue.** "Favourite tomato meal: pizza" celebrates *what you love*, which is
   nutritionally irrelevant and emotionally central. A system optimising health would bury pizza; a kitchen
   that remembers leads with it. **This single choice — leading with the loved thing, not the healthy
   thing — is the clearest signal that Stories are not optimisation in disguise.**

### 1.3 The philosophical test for every Story element

> **Would a kind person who has cooked alongside you for two years say this out loud, unprompted, and would
> it make you smile?**

- "You've made pizza a lot — it's clearly a favourite 🍕" → yes, smile. ✅
- "You first cooked lentils two springs ago" → yes, warm. ✅
- "You ate vegetables only twice this week" → no — that's a parent's nag, not a friend's memory. ❌
- "Tomatoes were your most-used food" → playful, yes. ✅
- "Dad eats the least healthily of the four of you" → no — that ends friendships. ❌

This test, applied consistently, is the entire trust model. It is the WS7 social-sharing test ("would a
kind friend say this out loud?") promoted to the governing principle of the whole feature.

---

## PART 2 — THE HOUSEHOLD MEMORY MODEL

### 2.1 Where memory already lives (verified)

WS7 asserted the data exists; WS10 verified each source in the current schema:

| Memory fact | Source (verified) | What it actually witnesses |
|---|---|---|
| "cooked / ate X" (count) | `planner_entries` (`schema.ts:429`) + `food_diary_entries` (`:1194`) | **planner = *planned*; diary = *logged as eaten*** — see §2.3 |
| "who ate it" (per-eater) | `planner_entry_eaters` (`:1101`) → `household_eaters` (`:1086`) | which eaters a *planned* entry was for |
| "first discovered" (date) | `MIN(createdAt)` on planner/diary entries; diary date via `food_diary_days.date` (`:1186`) | when it *first appeared* on a plan / in a diary |
| "favourite / most used" | `user_item_usage.useCount`, `lastUsedAt` (`:1292-1299`) | frequency + recency of *use* (planner/shopping interaction) |
| "explored N varieties" | canonical spine + `food_variety` (WS2B "Your Varieties") | distinct varieties seen |
| "paired with basil" | co-occurrence of ingredients within the same meal | editorial or emergent pairing (WS7 D.2) |
| lifetime engagement | `activity_summary` (`:1380`) | **`lifetime*Adds` — adds, NOT meals eaten** (§2.4) |

### 2.2 The model: one read, three lenses on time

A household's food memory is one query shape — *gather every consumption fact resolving to a canonical
food for this household* — read through three time lenses:

```
            ┌──────────────────────────────────────────────────────────┐
            │  HOUSEHOLD↔FOOD CONSUMPTION OVERLAY (WS7 Layer 2)          │
            │  planner_entries · planner_entry_eaters · food_diary_*     │
            │  user_item_usage · canonical resolution (WS2E) · varieties │
            └──────────────────────────────────────────────────────────┘
                     │                  │                    │
              ALL-TIME lens        SEASON lens          MOMENT lens
              (Food Story)         (Seasonal Story)     (Milestone / First)
                     │                  │                    │
         "tomatoes, 87 times,    "Spring 2027: 62      "Lilly's first
          over two years"         meals, discovered     mushroom meal,
                                  fennel"                12 Mar"
```

- **All-time lens → a Food Story** (Part 4 / WS7 Part B): aggregate everything for one food, framed warmly.
- **Season lens → a Seasonal Story** (Part 7 / WS7 Part E): the same aggregate windowed by `[start, end]`,
  plus one forward "broaden" block (the only graph traversal in WS10).
- **Moment lens → a Milestone or First Discovery** (Parts 3 & 6): a single dated fact crossing a threshold
  or being seen for the first time.

There is **one** read model — `householdFoodMemory(householdId, …)` (WS7 Recommendation 5) — and the lens
is a parameter (a food, a window, a threshold), not a separate system. This is the answer to Part H below.

### 2.3 The planned / cooked / eaten gap (the load-bearing honesty finding)

This is the finding that most shapes WS10 and was not fully drawn out in WS7.

```
   PLANNED                  COOKED                   EATEN
   planner_entries          (no signal)              food_diary_entries
   "put on the plan"        THA never learns this    "logged as eaten" — adults only
   ───────────────▶         ─ ─ ─ ─ ─ ─ ─ ─▶         ───────────────▶
   has createdAt, eaters    no flag, no table        userId-scoped; date via diary day
```

- `planner_entries` has **no `cooked` / `completed` / `eaten` column** (`schema.ts:429-445`). A planned
  meal may have been cooked, swapped, skipped, or eaten as a takeaway instead. THA does not know.
- `food_diary_entries` is the *only* "actually consumed" signal, and it is **per `userId`**
  (`schema.ts:1197`). It even records its provenance (`sourceType`, `sourcePlannerEntryId`,
  `:1201-1202`) — so it already knows whether an eaten item came from a plan or was logged manually.
- **Children without accounts have `userId = null` (`schema.ts:1090-1091`) and therefore no diary.** For a
  child, the *only* food memory THA holds is what was *planned for them* via `planner_entry_eaters`.

**Consequence for Stories:** the verbs must match the evidence.

| Brief's verb | Honest verb when source is `planner_entries` | Honest verb when source is `food_diary_entries` |
|---|---|---|
| "ate tomatoes 87 times" | "cooked with tomatoes 87 times" / "tomatoes featured 87 times" | "ate tomatoes 87 times" ✅ (adult, logged) |
| "First time Daisy ate tofu" | "First time you cooked tofu for Daisy" (child → plan only) | n/a (child has no diary) |
| "fell in love with cherry tomatoes" | "cherry tomatoes featured more and more" | "cherry tomatoes became a regular" |

This is not pedantry — it is the difference between a friend's generous memory and a creepy claim to know
what went in your mouth. **The softer verb is both more honest and warmer.** WS10 recommends a single
*provenance-aware verb vocabulary* (§Recommendations) so a Story never claims "ate" when it only witnessed
"planned", and never claims to know a child's consumption at all.

### 2.4 The `activity_summary` trap

`activity_summary.lifetime*Adds` (`schema.ts:1389-1393`) counts *adds* — shopping adds, planner adds,
pantry adds, recipe adds. It is an **engagement** metric, not a **consumption** metric. "100 meals cooked
together" must come from planner/diary entries, **not** from `lifetimePlannerAdds` — because an add that
was later removed, or a meal planned three times, would inflate the memory into a falsehood. Honest counting
(WS7 B.5) means choosing the right source, and `activity_summary` is the wrong one for a memory.

---

## PART 3 — FOOD MILESTONES (brief Part D)

### 3.1 What a milestone is

A milestone is the **moment lens**: a single count crossing a threshold, surfaced once, as *arrival*.

```
🌱 Ate 30 different plants this week     ← DISTINCT canonical plants in 7-day window crosses 30
🍅 Explored 10 tomato varieties          ← DISTINCT varieties of one food crosses 10
🥣 Cooked 100 meals together             ← COUNT of meals (honest source: planner/diary, not activity_summary)
🌍 Tried 25 new ingredients              ← DISTINCT first-seen canonical foods crosses 25
🥬 First homemade kimchi                  ← first-seen of a specific food (a First Discovery — Part 6)
🍄 Lilly discovered mushrooms            ← per-eater first-seen (Part 6, child-sensitive)
```

### 3.2 Should milestones exist? Celebrate, teach, or motivate?

| Purpose | Verdict | Reasoning |
|---|---|---|
| **Celebrate** | ✅ **Yes — the only safe purpose** | "You hit 30 plants this week 🌱" is a moment of arrival. It looks backward at something already achieved. No pressure, because it's already done. |
| **Teach** | ⚠️ **Only as a gentle, optional aside** | A milestone *may* carry one WS0-sourced fact ("30 different plants supports gut diversity") — but as a footnote, opt-in, never the headline. The moment teaching becomes the point, the milestone becomes a lesson, and a lesson implies a test. |
| **Motivate** | ❌ **No — this is the trap** | "You're 3 plants away from 30!" turns a memory into a target, and a target you can *miss*. The 30 Plants feature already lives elsewhere in THA as an *active goal*; Stories must not duplicate it as a *nag*. A milestone celebrates the *crossing*; it must never announce the *gap*. |

### 3.3 The pressure / competition / performance risks

The brief names them; each has an architectural guard:

| Risk | How it appears | Guard |
|---|---|---|
| **Pressure** | "2 plants to go!" / streaks that can break | Milestones fire only *on crossing*, never *before*. No streak that can be lost. No "you didn't hit it this week". |
| **Competition** | "You hit 30 plants faster than 80% of households" | The overlay has **no cross-household primitive** (§10). Comparison is not styled-away; it is *uncomputable*. |
| **Performative** | Milestones designed to be screenshotted/posted | Milestones are private by default; sharing is a separate, opt-in act (Part 8). A milestone's job is to make *you* smile, not an audience. |

**Recommendation:** milestones are **celebratory-only, threshold-crossing, rate-limited, gap-silent.** They
celebrate arrival and never announce distance-to-go. The same threshold, framed as "you're nearly there",
belongs to the goal features — not to memory.

---

## PART 4 — FAVOURITES (brief Part C)

### 4.1 Two levels, both supported by existing data

**Household level** — most-loved meals, favourite ingredient, favourite cuisine, favourite breakfast — is
frequency over *all* the household's entries.

**Individual level** — "Lilly loves lentils, strawberries, halloumi" — is frequency over the entries linked
to one eater via `planner_entry_eaters` (`schema.ts:1101`), or, for an adult, over their `food_diary_entries`.

```
Household favourites          Individual favourites
  fav ingredient: tomatoes      Lilly  → lentils · strawberries · halloumi   (planner_entry_eaters)
  fav cuisine: Mediterranean    Dad    → prawns · tomatoes · olive oil       (diary OR plan)
  fav breakfast: porridge
```

### 4.2 How favourites are determined — and the user's right to overrule

| Question | Finding |
|---|---|
| **How determined?** | Derived: high `user_item_usage.useCount` + recent `lastUsedAt`, or high planner/diary frequency for a canonical food. Recency matters — a food eaten weekly for a year then dropped is a *former* favourite (§4.3). |
| **Should users choose favourites?** | **Not required, but always allowed.** Forcing curation makes a chore and a self-judgement ("am I allowed to call pizza a favourite?"). Inference removes the chore. But a user must be able to **pin** ("yes, this is a favourite") and **dismiss** ("no, that was a phase") a derived favourite. |
| **Should THA infer favourites?** | **Yes, as the default** — this is the "kitchen that remembers" working. But inference must be *correctable*, because a confidently wrong favourite ("your favourite is the meal you cooked once for guests and hated") is a small betrayal of being known. |
| **Can favourites change?** | **Yes — and Stories should celebrate the change, not resist it.** "Cherry tomatoes have become your go-to" is a lovely memory. A favourite is a *current* relationship, recency-weighted, not a lifetime award. |

### 4.3 Recency: a favourite is present-tense

The honesty rule for favourites: **a favourite is what you love *now*, not what you logged *most over all
time*.** `user_item_usage.lastUsedAt` (`schema.ts:1298`) makes this computable. Without recency weighting,
a household that ate pasta nightly for a year then went low-carb would be told "your favourite is pasta"
forever — a memory frozen wrong. Stories must let favourites *evolve*, and may gently mark the evolution
("strawberries are this summer's favourite") rather than overwrite the past silently.

### 4.4 Trust posture for favourites

- **Lead with the loved, not the healthy** (§1.2). The favourite ingredient may be cheese; the Story says
  so warmly. No nudge attached.
- **Never rank family members' favourites against each other.** "Lilly loves lentils" and "Dad loves
  prawns" sit side by side as *individual* celebrations, never as "Lilly eats better than Dad" (§9).
- **A favourite is never a prescription.** "Your favourite is pizza" must not become "so here's a healthier
  pizza" inside a Story. That is WS9 Alternatives, a different lens, a different (opt-in) surface.

---

## PART 5 — (reserved: covered within Parts 2 & 4 — the household memory model and favourites)

> The brief's Part C (Favourites) is addressed in Part 4; the household memory model underpinning both
> household-level and individual-level favourites is Part 2. No separate section needed.

---

## PART 6 — FIRST DISCOVERIES (brief Part B)

### 6.1 What they are

The moment lens applied to *firsts*: `MIN(createdAt)` for the first appearance of a canonical food, a
preparation, a cuisine, or a per-eater first.

```
• First time you cooked lentils              ← household first-seen of "lentil"
• First vegetarian family meal               ← first entry with no animal-protein component for all eaters
• First homemade pizza                       ← first-seen of a specific meal
• First meal Lilly enjoyed with mushrooms    ← per-eater first-seen (Lilly + mushroom) — PLAN only for a child
• First time Daisy ate tofu                  ← per-eater first-seen (Daisy + tofu)  — PLAN only for a child
```

### 6.2 The four questions

| Question | Finding |
|---|---|
| **Should these exist?** | ✅ Yes — firsts are the warmest memory THA can offer. A dated first is a photograph, not a statistic (§1.2). |
| **Should users see them?** | ✅ Yes, but **gently and pulled, not pushed** — surfaced inside a food's Story or a Seasonal Story, not as a push notification ("we noticed Daisy ate tofu!"). The *surveillance smell* (WS7 B.5) is strongest here: a *first* proves THA has been watching since the beginning. Framing must be "your kitchen remembers", never "we tracked". |
| **Should they be automatic?** | ✅ The *computation* is automatic (it's a `MIN(date)`); the *surfacing* should feel offered, not announced. Automatic detection, gentle presentation. |
| **Should children be treated differently?** | ✅ **Emphatically yes — and the data forces the honesty.** For a child (`userId = null`) there is no diary, so a child's "first" is necessarily *"first time we planned tofu for Daisy"*, not *"first time Daisy ate tofu"*. The verb must not overclaim (§2.3). And the surfacing must stay *inside* the household — a child's name + food history is a safeguarding boundary the instant it could leave (§8, §9). |

### 6.3 The honest "first" for a child

Because a child's only signal is the plan, a child's First Discovery is honest only as a *planning* memory.
A warm, honest rendering: *"You introduced Daisy to tofu last spring 🌱"* — true to the data (you planned
it), warm, and free of the false claim that THA observed Daisy eating. This is strictly better than the
brief's "First time Daisy ate tofu", which the data cannot support.

### 6.4 Rate-limiting firsts

Every food has a first; surfacing all of them is spam (WS7 B.5). Firsts should appear **occasionally and in
context** — woven into a Seasonal Story's "discovered" block, or shown when a user opens that food's Story —
never as a stream. Quality of memory over completeness of log.

---

## PART 7 — SEASONAL STORIES (brief Part E)

### 7.1 The example, decomposed against verified sources

```
Spring 2027 — your household
  cooked 62 meals together       ← COUNT entries in [Mar..May 2027]   (honest source: planner/diary, NOT activity_summary)
  explored 14 new ingredients    ← DISTINCT canonical foods first-seen IN window
  discovered fennel              ← a first-seen in window (Part 6)
  fell in love with cherry toms  ← variety whose frequency ROSE most in window (WS2B varieties + recency)
  Most loved meals ❤️ ...        ← top meals by frequency in window
  Most used 🥇 toms 🥈 oil ...   ← top canonical foods by frequency in window
  This summer you might enjoy:   ← Layer 1: WS8 Discovery + seasonal-with edges for the NEXT window
    ☀ heirloom tomatoes · courgettes · peaches
```

Everything above the "this summer" line is **Layer 2 windowed by date** — pure memory. The "this summer"
line is the **only** graph traversal in WS10, and it is exactly WS8 Discovery seeded by a small `seasonal-with`
editorial map (WS7 E.2, WS8 Tier 3).

### 7.2 Can it be automatic, zero-input, and stay warm?

| Brief's question | Finding |
|---|---|
| **Automatic?** | ✅ Yes. Every fact is an aggregation over timestamped rows (`createdAt` on entries, `food_diary_days.date`). A scheduled end-of-season read assembles the whole card. |
| **No input required?** | ✅ Yes. The only editorial inputs are the small `seasonal-with` seed map and the copy templates — authored once, not per household. |
| **Remain warm?** | ✅ **If and only if it never computes a delta-against-self that reads as decline.** "62 meals this spring" is warm. "18 fewer than last spring" is a scoreboard. The windowed overlay must surface *presence and rises*, and be **structurally unable** to surface *declines* (§10). |
| **Avoid becoming Spotify Wrapped?** | ⚠️ **The real risk.** See §7.3. |

### 7.3 The "Spotify Wrapped" failure mode

Spotify Wrapped is the cautionary tale the brief invokes. It fails — for a *kitchen* — in four specific ways
that WS10 must consciously avoid:

| Spotify Wrapped trait | Why it's wrong for a kitchen | WS10 guard |
|---|---|---|
| **Hyper-precise** ("you listened 47,213 minutes") | False precision in food is creepy (it implies measurement of your mouth) | Soft verbs, rounded/generous numbers, the voice of memory not the voice of a meter (§2.3) |
| **Ranked / chart-shaped** ("your #1 artist") | Charts invite comparison and a sense of "performance" | 🥇🥈🥉 are *playful affection markers*, not a leaderboard; never "vs last year", never "vs others" |
| **Designed for sharing/clout** | Optimises for the post, not the person | Private by default; sharing is a separate opt-in act (Part 8) |
| **Annual spectacle** | A once-a-year performance, not a relationship | A quiet *seasonal* cadence, opt-in, skippable; a gentle card, not an event |

The distinction in one line: **Wrapped tells you what you *did* so you'll *post* it; a kitchen that
remembers tells you what you *loved* so you'll *smile*.** Same data shape; opposite intent. WS10's framing
contract (§Recommendations) is what keeps Stories on the second side.

### 7.4 Honest or absent

A sparse season (3 meals logged) gets a *gentle* card or none — never one padded with "you only cooked 3
meals" (Invariant 3). Empty is silent.

---

## PART 8 — CELEBRATIONS & SOCIAL SHARING (brief Part G)

### 8.1 What "celebration" means here

A celebration is a Story element *surfaced at a warm moment* — a milestone crossed, a season closed, a first
recorded. It is the *act of noticing out loud*, internally, kindly. Celebration is the default mode of all
Stories; sharing is the optional act of letting a celebration leave the house.

### 8.2 What is shareable (THA already has the social primitive)

THA supports meal-plan invites — a sharing primitive exists. The shareable artefacts are **renderings of
aggregates**, never raw history:

| Shareable | Example | Risk |
|---|---|---|
| Seasonal headline | "We discovered 12 new foods this spring." | Low — aggregate, positive |
| Household MVP food | "Tomatoes were our household MVP." | Low — playful, no person named |
| Favourite meal | "Our favourite meal this season was homemade pizza." | Low |
| Milestone | "We hit 30 plants this week." | Low–medium (can read as a boast) |
| Per-eater fact | "Lilly discovered lentils." | **High — names a (likely child) family member** |

### 8.3 Opt-in vs opt-out, privacy, child protection, delight vs oversharing

- **Opt-in, per-share, always.** Nothing auto-posts. Sharing is an explicit act each time, never a default
  setting or a background sync. (Sending content externally publishes it; it may be cached or indexed even
  if later deleted — the user must choose knowingly.)
- **Aggregates leave the house; raw history never does.** "12 new foods" is shareable; the list of every
  meal and date is not. The share renderer reads the aggregate, not the entries.
- **Children are a hard boundary.** A per-eater fact naming a child (`household_eaters.userId = null`,
  `schema.ts:1090-1091`) is **off by default** and gated behind explicit adult consent, if permitted at all.
  "Lilly discovered lentils" is adorable in the home and a safeguarding question outside it. And, per §2.3,
  for a child it isn't even an "ate" fact — it's a "planned" fact — so sharing it would publish a claim the
  data can't support *about a child*. Double reason for the hard gate.
- **Delight vs oversharing — the test:** *would a kind friend say this out loud?* "We cooked a lot of pizza
  this spring 🍕" — yes. "Our member Lilly ate 47 portions of carbohydrate" — no. The copy templates and the
  per-eater/child gate are what keep sharing on the delight side.

### 8.4 No comparison leaves the house either

A share celebrates *this* household against *itself*, never against a board. The moment a share implies "we
did better than you", THA becomes a competition platform. Because the overlay has no cross-household
primitive (§10), there is nothing comparative to share even by accident.

---

## PART 9 — PRIVACY AND TRUST (brief Part F)

### 9.1 What must NEVER be shown

The brief's red list, with the reason each is forbidden:

| ❌ Never | Why it's forbidden |
|---|---|
| "Lilly rejected mushrooms 12 times." | Counts a *negative*, names a child, and shames a normal childhood behaviour. The overlay must not surface rejection counts as memory at all. |
| "You only ate vegetables twice." | "Only" is a deficit. Stories have no deficit primitive (§10). |
| "Dad eats the most unhealthy foods." | Ranks family members + applies a health verdict. Two forbidden moves in one sentence (§9.2). |
| "Your family eats fewer plants than average." | Cross-household comparison — uncomputable by design (§10). |

The pattern: **every forbidden example is either a deficit, a ranking of people, a health judgement, or a
cross-household comparison.** WS10's architectural answer is to make all four *structurally absent* from the
overlay, not merely *styled away* in copy. Copy can be edited badly; an absent primitive cannot leak.

### 9.2 The questions

| Should stories… | Finding |
|---|---|
| **compare households?** | ❌ Never. No cross-household primitive exists or should (§10). |
| **rank households?** | ❌ Never. Same. |
| **rank family members?** | ❌ Never *against each other*. Per-eater facts are *individual celebrations* ("Lilly loves lentils"), never relative ("Lilly > Dad"). The data *can* compute the comparison; the feature must refuse to. |
| **include children by name?** | ⚠️ **Inside the home: yes, warmly** ("Lilly discovered mushrooms 🍄"). **Outside the home: off by default, hard-gated** (§8.3). And always with honest verbs (a child's memory is plan-based, not eating-based — §2.3, §6.3). |
| **expire?** | ⚠️ **Stories themselves needn't expire — memory is the point — but two protections apply.** (1) The user must be able to *forget*: delete a Story, a fact, or all of it (the right to be forgotten by your own kitchen). (2) Derived favourites are recency-weighted, so stale relationships fade naturally (§4.3). Memory persists; the user holds the eraser. |

### 9.3 What feels celebratory / creepy / competitive / invasive

| Feeling | Trigger | Where it's guarded |
|---|---|---|
| **Celebratory** ✅ | counting up, firsts, loved things, rises | the default mode (§1) |
| **Creepy** ⚠️ | "we tracked you since day one", false precision, push notifications about a child | "kitchen remembers" voice, soft verbs, pull-not-push, child gate (§2.3, §6.2) |
| **Competitive** ❌ | rankings of people or households, streaks, "vs last year" | no comparison/deficit primitive (§10) |
| **Invasive** ❌ | claiming to know what a child ate; raw history leaving the house | honest provenance verbs (§2.3); aggregates-only sharing (§8.3) |

### 9.4 The trust foundation: known, not watched

The single distinction underneath all of the above:

> **To be *known* is warm; to be *watched* is cold. They use the same data. The difference is entirely in
> whether the system (a) counts up or down, (b) celebrates or grades, (c) keeps it in the home or sends it
> out, (d) speaks in the soft verbs of memory or the precise verbs of a meter, and (e) hands the user the
> eraser.** Get those five right and "a kitchen that remembers" is a friend. Get any one wrong and it is
> surveillance wearing an apron.

---

## PART 10 — THE NO-DEFICIT, NO-COMPARISON ARCHITECTURE (the core guard)

This is WS10's central architectural contribution, and it restates WS7's "neutral graph, framed reading"
for the overlay: **trust is won not by *styling away* dangerous facts but by *never computing them*.**

A Story overlay should expose only these primitive operations:

```
ALLOWED (memory primitives)                  FORBIDDEN (scoreboard primitives)
  count(food, window)            up          deficit(food, target)        ✗ no targets
  firstSeen(food[, eater])                   declineVsSelf(window, prev)  ✗ no "fewer than last time"
  topByFrequency(window, N)                  rankMembers(...)             ✗ no person-vs-person
  rose(food, window)             ▲ rises     compareToOtherHousehold(...) ✗ no cross-household
  distinctVarieties(food)                    rejectionCount(food, eater)  ✗ no negatives
  pin/dismiss(favourite)                     belowAverage(...)            ✗ no "average"
```

If the forbidden primitives are never implemented in the read model, then:

- a milestone *cannot* announce a gap (no `deficit`);
- a Seasonal Story *cannot* say "fewer than last spring" (no `declineVsSelf`);
- a Story *cannot* rank Dad below Lilly (no `rankMembers`);
- a share *cannot* leak "below average" (no `compareToOtherHousehold`, no `average`);
- a child's "rejected mushrooms 12 times" *cannot* be shown (no `rejectionCount`).

The dangerous outputs become not *forbidden-by-policy* but *impossible-by-construction*. Copy guidelines
protect against careless wording; an absent primitive protects against careless wording *and* future
features *and* a well-meaning engineer who adds "just one comparison". This is the strongest available
trust guarantee, and it costs nothing — it is a decision *not* to build something.

---

## PART 11 — RELATIONSHIP TO PREVIOUS WORKSTREAMS (brief Part H)

### 11.1 Are Stories generated from the Overlay? A read model? A scheduled summary? A separate system?

| Question | Answer |
|---|---|
| **Generated from the Household Overlay (WS7 Layer 2)?** | ✅ **Yes — Stories *are* the overlay**, aggregated per food/window/threshold and framed as memory. No new edges, no new write path. |
| **A read model?** | ✅ **Yes — the primary characterisation.** One reader, `householdFoodMemory(householdId, lens)`, assembling existing tables (WS7 Rec. 5). The lens (food / window / threshold) is a parameter. |
| **A scheduled summary?** | ⚠️ **Only Seasonal Stories**, and only as an *option*. A Food Story is computed on demand when a user opens a food. A Seasonal Story *may* be a scheduled end-of-season job (WS7 E.2). Scheduling is a delivery choice, not the nature of the feature. |
| **A separate system?** | ❌ **No.** A separate Stories system would re-introduce the duplication WS6/WS7 exist to end. Stories share the canonical resolution path (WS2E), the overlay (WS7), and — for the one "broaden" block — the Discovery graph (WS8). One graph, one overlay, one more lens. |

### 11.2 Lineage map

| Workstream | What WS10 builds on |
|---|---|
| **WS2A / WS2E** | Canonical spine + one-slug-one-food lock — every counted fact resolves to a canonical slug, so "87 tomatoes" is honest (no double-count, no missed alias). Counts inherit the anti-fork guarantee or must not be shown (WS7 B.5). |
| **WS2B** | The eaten / not-yet-eaten split and "Your Varieties" — Stories' "explored N varieties" *is* this computation; Seasonal Stories' "broaden next season" generalises it. |
| **WS4B** | Evidence tiers + approved-language gates — any nutritional aside in a milestone inherits WS4B gating; copy templates inherit the language rules. |
| **WS6** | The Food Report contract — a food's Story is a natural *Food Report section* ("Your history with this food"), so its nutritional asides are the report's own Key Nutrient facts, not a third assertion. |
| **WS7** | The two-layer model + the framing contract. WS10 is WS7 Parts B/E/F deepened, with the planned/eaten honesty finding (§2.3) and the no-deficit architecture (§10) added. |
| **WS8** | Discovery (Layer 1 traversal) — reused *only* for a Seasonal Story's single forward "broaden" block. |
| **WS9** | Alternatives — explicitly *out of scope* for Stories. A Story may name a favourite; it must never attach a swap. Alternatives are a different (opt-in) lens on a different surface. The boundary keeps memory free of optimisation. |

---

## TRUST PRINCIPLE (assumed true; consequences investigated)

> Discovery helps households **explore** ("what else might I enjoy?").
> Alternatives help households **adapt** ("what else could fulfil this role?").
> Stories help households **remember** ("what has our household enjoyed together?").

**Consequence 1 — Stories are the only backward-facing lens, and backward-facing is *safer*.** Discovery and
Alternatives suggest a *future action*, which always carries an implied "you should". A memory suggests
nothing; it only recognises. Stories are therefore the *least* prescriptive of the three and the easiest to
keep non-judgemental — *provided* they never smuggle a suggestion in (no swaps, no targets, no nudges).

**Consequence 2 — but Stories are the most *intimate*, so the trust failure is different.** Discovery's
failure is *overwhelm*; Alternatives' failure is *judgement*; **Stories' failure is *surveillance*.** A
Story proves THA has been watching, remembering, and — worst case — knows things about your children. The
guard is not "be less accurate"; it is "be honest about what was witnessed (§2.3), keep it in the home by
default (§8), speak as a friend who remembers, not a system that logs (§9.4), and hand the user the eraser
(§9.2)."

**Consequence 3 — remembering well *requires* forgetting.** A friend who recites every meal you've ever
eaten is not warm — they're unsettling. Good memory is *selective*: the loved, the first, the milestone, not
the exhaustive log. Rate-limiting (§6.4), recency-weighting (§4.3), and the user's eraser (§9.2) are not
constraints on the feature — they *are* the feature. Memory is curation, not completeness.

---

## RECOMMENDATIONS

### Short-term (now, no schema / UI change)

1. **Adopt "Honest Memory" as WS10's invariant (the 4th in the lineage):** *a kitchen remembers what it
   witnessed, in the voice of memory.* Stories surface presence and rises, never deficits or declines;
   speak in soft, provenance-aware verbs; stay in the home by default.
2. **Define a provenance-aware verb vocabulary** mapping data source → permissible verb:
   `planner_entries` → "cooked / featured / planned"; `food_diary_entries` (adult) → "ate / logged";
   child (`userId = null`) → "introduced / planned for", **never "ate".** Authored once, inherited by every
   Story surface. This is the single most important deliverable (§2.3).
3. **Document the `activity_summary` trap** (lifetime *Adds* ≠ meals eaten, `schema.ts:1389-1393`): a "meals
   cooked" count must come from planner/diary entries, never from `activity_summary`.

### Medium-term (before any build)

4. **Specify the Story read model as `householdFoodMemory(householdId, lens)`** — one reader, lens =
   {food | window | threshold} — assembling existing tables, proving Stories need no new write path
   (extends WS7 Rec. 5).
5. **Specify the overlay's *allowed* primitives and explicitly forbid the scoreboard primitives** (§10):
   no `deficit`, `declineVsSelf`, `rankMembers`, `compareToOtherHousehold`, `rejectionCount`, `average`.
   Trust by non-computation, not by copy-policing.
6. **Author the Stories framing contract** (celebratory / count-up / soft-verb / private-by-default /
   no-comparison / no-deficit / user-erasable) as a single module every Story surface imports — the WS10
   analogue of WS7's framing contract and WS6's disclaimer.
7. **Specify the child-privacy rule once:** per-eater facts naming `userId = null` eaters are warm *inside*
   the household, use plan-based verbs only, and are off-by-default and hard-gated for any sharing.

### Long-term (implementation, future workstreams — each its own investigation + approval)

8. **Build the memory read model** over existing tables (counts, firsts, favourites, varieties); consider a
   materialised `household_food_memory` aggregate **only** if per-food aggregation at scale proves slow
   (SUGGESTION).
9. **Render a food's Story as a Food Report section** ("Your history with this food", WS6) so its
   nutritional asides reuse the report's Key Nutrient facts (no third assertion).
10. **Seasonal Stories as a scheduled, zero-input, deficit-free job**, opt-in, quiet cadence, with the one
    forward "broaden" block powered by WS8 Discovery + a small `seasonal-with` seed.
11. **Favourites with pin/dismiss + recency weighting**; **the user's eraser** (delete a fact, a Story, or
    all of it) shipped *with* the first Story surface, not after.
12. **Social sharing as opt-in aggregate rendering** with the hard child gate — built only after Stories
    themselves are trusted in-home.

---

## RISKS

| # | Risk | Severity | Mitigation (where investigated) |
|---|---|---|---|
| R1 | **Overclaiming consumption** — "ate 87 times" when THA only saw the plan; "Daisy ate tofu" when Daisy has no diary | **High** | Provenance-aware verbs (§2.3, Rec. 2); plan-based verbs for children (§6.3) |
| R2 | **Surveillance smell** — firsts/anniversaries reading as "we watched you since day one" | **High** | "Kitchen remembers" voice, pull-not-push, rate-limit, the eraser (§6.2, §9.4) |
| R3 | **Child exposure** — naming a child + food history, especially if shared | **High** | In-home warmth / off-by-default-and-gated outside; plan-based verbs (§8.3, §9.2) |
| R4 | **Deficit creep** — a well-meaning "you only…" or "below target" entering a Story | **High** | No deficit primitive — uncomputable by construction (§10) |
| R5 | **Competition creep** — member-vs-member or household-vs-household ranking | **High** | No ranking/comparison primitive (§10); per-eater = individual celebration (§9.2) |
| R6 | **Spotify-Wrapped drift** — precise, ranked, clout-shaped, annual spectacle | **Medium** | Soft verbs, affection-not-leaderboard, private-by-default, quiet seasonal cadence (§7.3) |
| R7 | **Stale favourite** — a former favourite frozen forever | **Medium** | Recency weighting + pin/dismiss (§4.3, §4.4) |
| R8 | **`activity_summary` miscount** — using lifetime *adds* as "meals cooked" | **Medium** | Honest source selection (§2.4, Rec. 3); inherit WS2E anti-fork counting |
| R9 | **Optimisation smuggling** — a Story attaching a swap/nudge to a favourite | **Medium** | Hard boundary: Stories name; Alternatives (WS9) swap, on a different opt-in surface (§4.4, §11.2) |
| R10 | **Notification spam** — every food gets a first/anniversary | **Low–Med** | Rate-limit hard; memory is selective, not exhaustive (§6.4, Trust Consequence 3) |
| R11 | **No eraser** — user cannot forget what their kitchen remembers | **Medium** | Ship delete-a-fact/Story/all *with* the first surface (§9.2, Rec. 11) |

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`planner_entries`, `planner_entry_eaters`, `food_diary_days`/`_entries`, `user_item_usage`, `activity_summary`, `household_eaters`, canonical spine + `canonical_food_alias`, WS2B varieties) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** |
| Schema changes | **NO** |
| UI changes | **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No schema changes. No UI changes. No DB changes. No UI mockups (the
ASCII blocks above are decompositions of the brief's own examples against verified data sources, not designs).
Every concrete build idea is confined to RECOMMENDATIONS (long-term) and SUGGESTION below, and each requires
its own investigation and approval before any commitment.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** A `householdFoodMemory(householdId, lens)` read model assembling Layer 2 from existing
  tables; a materialised `household_food_memory` aggregate **only** if per-food aggregation at scale is slow.
- **SUGGESTION:** A **provenance-aware verb vocabulary** module (source → permissible verb), the single
  guard against overclaiming consumption and the only safe way to render a child's "first" (§2.3, §6.3).
- **SUGGESTION:** A **Stories framing contract** module (count-up / soft-verb / private-by-default /
  no-comparison / no-deficit / erasable), imported by every Story surface — the WS10 analogue of WS7's
  framing contract.
- **SUGGESTION:** A read model that exposes **only** memory primitives (count, firstSeen, topByFrequency,
  rose, distinctVarieties) and **omits** scoreboard primitives (deficit, declineVsSelf, rankMembers,
  compareToOtherHousehold, rejectionCount, average) — trust by non-computation (§10).
- **SUGGESTION:** A food's Story as a **Food Report section** ("Your history with this food", WS6), reusing
  the report's Key Nutrient facts for any aside.
- **SUGGESTION:** Seasonal Stories as a **scheduled, zero-input, deficit-free seasonal job**, opt-in, with
  one forward "broaden" block from WS8 Discovery + a small `seasonal-with` seed.
- **SUGGESTION:** **Favourites** as derived + recency-weighted, with user **pin/dismiss**, and a user
  **eraser** (delete a fact / a Story / all) shipped with the first Story surface.
- **SUGGESTION:** A standing **child-privacy guard** — per-eater facts for `userId = null` eaters use
  plan-based verbs, stay in-home, and are off-by-default + hard-gated for any sharing.

---

## FINAL QUESTION — answered explicitly

> **Can THA become "a kitchen that remembers" while remaining warm, trustworthy, non-judgemental and
> privacy-respecting?**

**Yes — with one honest constraint that is also what makes it warm.**

**Why yes:**

1. **The data already exists; nothing new is written.** Every fact in the brief's examples is an aggregation
   over rows THA already stores (planner, diary, usage, varieties), resolved through the canonical spine. A
   Story is a *read model*, not a new system, not a backfill, not a schema change.
2. **Memory is the *safest* of the three lenses.** Discovery and Alternatives face forward and carry an
   implied "you should"; Stories face backward and only *recognise*. Kept free of swaps, targets and nudges,
   a Story prescribes nothing.
3. **The dangerous outputs can be made impossible, not merely discouraged.** By building a read model that
   exposes only count-up and rise primitives and *never* implements deficit, decline, person-ranking or
   cross-household comparison (§10), "you only ate veg twice", "Dad eats worst", "fewer plants than average"
   and "12 mushroom rejections" become *uncomputable*, not just *forbidden*. Trust by non-computation is the
   strongest guarantee available, and it costs nothing.
4. **Privacy has clear, enforceable boundaries:** aggregates may leave the house, raw history never; sharing
   is opt-in per act; children are warm in-home and hard-gated outside; and the user holds an eraser.

**The one honest constraint (which is the gift, not the catch):**

> **THA must remember in the *voice of memory*, not the *voice of a meter* — because it witnessed *planning*,
> and (for adults only) *logging*, never *eating*, and never anything at all for a child without an account.**
> "First time you cooked tofu for Daisy" is true and warm; "First time Daisy ate tofu" is a claim the data
> cannot support. The soft, generous, forgiving verb is simultaneously the *honest* one and the *warm* one.
> The gap between planned and eaten is not a limitation to hide — it is precisely why the kitchen must speak
> like a friend who remembers fondly rather than a system that logs exactly.

So nothing is *missing* to begin — no new data, no new write path. What is *required* is a discipline,
authored once: **honest provenance-aware verbs, a no-deficit/no-comparison read model, private-by-default
sharing with a hard child gate, and a user-held eraser.** With those four disciplines, THA becomes a kitchen
that remembers what you loved so you'll smile — not what you did so it can grade you. That is a friend in the
kitchen. Without them, the same data becomes surveillance in an apron. **The architecture decides which; the
brief's answer is yes.**

---

*End of WS10 — Household Food Stories Investigation. Investigation only; no implementation performed.*
*Rollback: `git reset --hard rollback/ws10-pre-investigation-20260620`.*
