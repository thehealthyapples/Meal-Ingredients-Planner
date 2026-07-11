# WS11 — Seasonal Stories Investigation

> **Status:** Investigation only. No implementation. No schema / UI / DB changes.
> **Reads existing data:** YES · **Writes new data:** NO · **Changes meaning of existing data:** NO · **Requires backfill:** NO
> **Scope:** The **seasonal lens** over the WS7 Layer-2 household↔food consumption overlay — WS10's Seasonal
> Story (§7) promoted to its own investigation — *plus* the single forward "what comes next" bridge into
> WS8 Discovery. A Seasonal Story **closes the chapter that ended** (Layer 2, windowed, backward, memory)
> and **gently opens the next** (Layer 1, seasonally seeded, forward, invitation). This is NOT Food Wrapped.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — only the untracked WS10 investigation was present |
| WS10 investigation protected | ✅ Committed as `5e4cb83` — *docs(ws10): preserve Household Food Stories investigation* (was previously untracked and unprotected) |
| Rollback point created | ✅ Tag `rollback/ws11-pre-investigation-20260620` → `5e4cb83` |
| How to undo all WS11 work | `git reset --hard rollback/ws11-pre-investigation-20260620` |

No work began until the rollback point was confirmed.

---

## EXECUTIVE SUMMARY

**A Seasonal Story is WS10's seasonal lens (WS10 §7) standing on its own, defined by the one thing that
makes it different from every other lens in the WS7–WS10 lineage: it is the only Story that turns around.**
Every other lens points one way. Stories (WS10) point backward — *what did we love?* Discovery (WS8) points
forward — *what else might we enjoy?* A Seasonal Story does both in one breath: it **closes a chapter**
(the season that ended, read as memory) and **opens the next** (the season beginning, read as a gentle
Discovery invitation). The trust principle the brief asks us to assume is exactly this hinge:

> Stories remember. Discovery explores. **Seasonal Stories celebrate the chapter that ended and gently
> introduce the chapter that comes next.**

The core question — *can THA celebrate a season warmly, personally, gently, privately and hopefully without
becoming Food Wrapped, a leaderboard, a health score or a competition?* — has the same shape of answer WS10
reached, with **one new load-bearing honesty constraint** that is the seasonal twin of WS10's
planned-vs-eaten finding.

**The architectural answer is yes**, and almost nothing new is required to read it. The backward half of a
Seasonal Story is *literally* WS10's overlay windowed by a date range `[start, end]` — `count(food, window)`,
`firstSeen(food, window)`, `topByFrequency(window, N)`, `rose(food, window)` — all primitives WS10 already
defined and bounded (WS10 §2.2, §10). The forward half is *literally* WS8 Discovery, seeded by a season and
framed as an invitation rather than an instruction. No new edge type, no new write path, no backfill.

**The new honesty constraint (WS11's central finding):**

> **THA knows *when* a household cooked (every entry has a `createdAt`), but it does not know *where* the
> household lives, and "season" is a property of *place* as much as time.** There is **no household or user
> location, region, hemisphere or climate field** anywhere in the schema — only `supermarket_links.country`
> (`schema.ts:558`), which is about shops, not people. THA's only seasonal knowledge is an **editorial,
> approximate, UK-default free-text string** already living on `knowledge_foods.seasonality`
> (`schema.ts:1466`), seeded with honest hedges like *"Summer (tinned year-round)"*, *"Early summer"*,
> *"Autumn (stored year-round)"* (`shared/knowledge/foods.ts`). So a Seasonal Story can say *"this summer you
> might enjoy peaches"* as a **warm editorial suggestion**, but it cannot truthfully say *"peaches are in
> season near you right now"* — it doesn't know where "near you" is, and globalised supply means the produce
> aisle has peaches in December anyway.

This is not a flaw to paper over. It is, exactly as in WS10, **the constraint that keeps the voice warm.**
A friend says *"it's nearly summer — you might fancy some peaches 🍑"*; a precision system says *"peaches are
optimally available in your region for the next 34 days."* The soft, editorial, approximate seasonal voice is
both the honest one and the warm one. **The seasonal frame must be a gentle editorial gesture, never a claim
of local-supply precision THA cannot back.**

The five load-bearing findings:

1. **A Seasonal Story is two existing lenses hinged together** — WS10's overlay windowed (backward, memory)
   + WS8 Discovery seeded by season (forward, invitation). It is a **read model and a framing**, not a new
   system. The hinge — the gentle handoff from "remember" to "explore" — *is* WS11's contribution.
2. **"What comes next" is Discovery wearing a seasonal coat, not a new engine.** The brief's "is this
   Discovery, Seasonal Discovery, or a new chapter?" resolves to: *the same WS8 engine, seasonally seeded,
   narratively reframed as the opening of a chapter.* (Part C.)
3. **Seasonality is already editorial, already approximate, and that is correct.** It lives on
   `knowledge_foods.seasonality` today. Region-specific / climate-aware seasonality would require location
   data THA deliberately does not hold; it must stay editorial, approximate, UK-default, and honestly hedged.
   (Part D.)
4. **The seasonal cadence is Food Wrapped's exact trap, slowed down — so the anti-Wrapped guards matter
   *more* here, not less.** A recurring seasonal "reveal" is structurally closer to an annual spectacle than
   any other Story surface. It must be quiet, opt-in, skippable, private-by-default — a card, not an event.
   (Parts A, F.)
5. **The forward block is the only place a "should" can enter a Story — so WS11 concentrates the
   judgement-risk that WS10 had almost designed away.** A memory prescribes nothing; an invitation always
   carries a faint "you ought to." The guard is invitational framing, seasonal honesty, opt-out, and the
   absolute prohibition on "eat *more*" / "you ate too few" deficit language (Parts C, E).

WS11 inherits the four lineage invariants and adds a fifth:

1. **One knowledge seam (WS7 Inv. 1).** Any nutritional aside reuses the food's WS0 Key Nutrients — never a new claim.
2. **Educational / celebratory, never judgemental (WS7 Inv. 2).**
3. **Empty is silent, not broken (WS7 Inv. 3).** A quiet season gets a gentle card or none.
4. **Honest memory (WS10 Inv. 4).** A kitchen remembers what it witnessed, in the voice of memory; planned ≠ eaten; children have no diary.
5. **WS11's contribution — Honest seasonality & the gentle hinge.** *A season is a place as well as a time, and THA knows the time but not the place.* The forward "next chapter" must be an editorial, approximate, opt-out **invitation** — never a local-supply claim, never a target, never a "should."

---

## PART A — WHAT IS A SEASONAL STORY?

### A.1 The brief's example, decomposed against verified sources

```
Spring 2027 — your household
  cooked 62 meals together          ← COUNT entries in [Mar..May 2027]  (honest source: planner/diary, NOT activity_summary — WS10 §2.4)
  explored 14 new ingredients       ← DISTINCT canonical foods first-seen IN window  (firstSeen ∩ window)
  discovered fennel                 ← a first-seen in window (a "First Discovery" — WS10 §6)
  cherry tomatoes became a family   ← a variety whose frequency ROSE most across the window (rose(food, window) — WS10 §10)
    favourite
  Most loved meals  ❤️ pizza ...    ← topByFrequency(meals, window, 3)  (affection markers, NOT a leaderboard — A.3)
  Most loved foods  🥇 tomatoes ... ← topByFrequency(canonical foods, window, 3)
  ────────────────────────────────────── the hinge ──────────────────────────────────────
  This summer you might enjoy:      ← FORWARD: WS8 Discovery, seeded by the NEXT season, framed as invitation (Part C)
    ☀ heirloom tomatoes · courgettes · peaches
```

Everything **above the hinge** is Layer 2 windowed by date — pure memory, every primitive already defined and
bounded in WS10 §10. Everything **below the hinge** is Layer 1 Discovery (WS8) with a seasonal seed. The hinge
itself — the gentle turn from *"what we loved"* to *"what you might enjoy next"* — is the whole of WS11.

### A.2 What makes it warm, memorable, personal, gentle

The brief asks this directly. The four properties from WS10 §1.2 all carry over, and the seasonal frame adds
specifics:

| Property | Why this example has it |
|---|---|
| **Warm** | It counts *up* only — 62 meals, 14 ingredients, a discovery, a rise. No "fewer than", no "only", no target. Warmth is structurally guaranteed because the windowed overlay has no deficit primitive (WS10 §10; Part E). |
| **Memorable** | It is *placed in a named season* — "Spring 2027" is a chapter title, not a date range. A season is the natural human unit of remembering ("the summer we kept making pizza"). The window gives the memory an edge, a beginning and an end, like a photograph has a frame. |
| **Personal** | Every line is *this* household's own foods, own meals, own first (fennel), own rising favourite (cherry tomatoes). Nothing is generic; nothing is comparative. It is a portrait, not a benchmark. |
| **Gentle** | It *closes* softly (celebration, no grade) and *opens* softly (invitation, no instruction). The forward line is "you **might** enjoy", never "you **should** eat". The whole card asks nothing of you. |

**The decisive warmth choice, inherited from WS10 §1.2 and sharpened seasonally:** the card leads with the
*loved* thing (pizza, tomatoes), not the *healthy* thing, and the forward block invites *delight*
("heirloom tomatoes, peaches"), not *correction* ("more leafy greens"). A health optimiser would invert both.
That single inversion is the clearest signal a Seasonal Story is not optimisation in seasonal clothing.

### A.3 Affection markers are not a leaderboard

`🥇🥈🥉` and `❤️` are the highest-risk visual in the whole feature, because they are *literally* the grammar
of a chart. WS11 endorses WS10 §7.3's ruling and makes it a hard line: **these glyphs are playful affection
markers for *this household against itself*, never a ranking against a person, a household, or a previous
season.** "🥇 Tomatoes" means *"tomatoes were everywhere this spring, and weren't they lovely"* — it does not
mean tomatoes *beat* olive oil, and it must never sit next to a "vs last spring" or a "vs other households"
number. The moment a medal acquires an opponent, the Story becomes a scoreboard. The opponent is uncomputable
by construction (Part E / WS10 §10), so the medal stays affectionate.

---

## PART B — STORY STRUCTURE

The brief proposes three structural ingredients. All three are sound; each maps to verified data and to a WS10
finding.

### B.1 Memories — ✅ (Layer 2, windowed)

| Memory | Source (windowed to `[start, end]`) | Honest verb (WS10 §2.3) |
|---|---|---|
| meals cooked | COUNT planner/diary entries in window | "cooked / featured" (plan) · "ate / logged" (adult diary) — **never** `activity_summary` adds |
| favourite foods | `topByFrequency(window, N)` over canonical foods | "you kept reaching for…" |
| discoveries | `firstSeen(food) ∩ window` | "you discovered…" / "you introduced [child] to…" (plan-only for children) |
| varieties explored | `distinctVarieties(food, window)` (WS2B) | "you explored N varieties of…" |

These are WS10's primitives with a `WHERE createdAt BETWEEN start AND end` clause. Nothing new.

### B.2 Milestones — ✅ (moment lens, may fall inside a season)

A milestone (WS10 §3) is a single count crossing a threshold — *30 plants this season, first homemade kimchi,
100 meals together*. Within a Seasonal Story they appear as **arrivals reached during the chapter**, which is
their warmest possible context ("this is the spring you hit 30 plants 🌱"). The WS10 milestone rules transfer
intact and are *reinforced* by the seasonal frame:

- **Celebrate the crossing, never announce the gap.** "You hit 30 plants this spring" ✅ — never "3 plants
  short of last spring" (a `declineVsSelf` — uncomputable, Part E).
- **No streak that can break.** A season that *didn't* cross a threshold simply has no milestone line. Absence
  is silent (Invariant 3). There is no "you didn't hit 30 this season."
- **Rate-limited.** A season is a natural rate-limiter — one card per season is already quiet. Don't pad it
  with every minor first (WS10 §6.4).

### B.3 Affection — ✅ but inferred, and framed as observation not verdict

The brief's examples — *"Cherry tomatoes became a family favourite," "You kept coming back to homemade pizza,"
"Lentils became part of your kitchen"* — are the emotional heart of the card. Two questions:

**Can affection be inferred?** **Yes — affection is `rose(food, window)` plus recency**, i.e. a food whose
frequency climbed across the season, or a favourite that stayed high (WS10 §4.2–4.3). "Became a family
favourite" = rose and stayed. This is derived, never declared, and — per WS10 §4.4 — always overrulable
(pin/dismiss). A confidently wrong "favourite" is a small betrayal of being known.

**How should it be framed?** As a **gentle observation of a pattern, never a verdict and never a prescription.**

| Framing | Verdict |
|---|---|
| "Cherry tomatoes became a family favourite." | ✅ Observes a rise, names affection, asks nothing. |
| "You kept coming back to homemade pizza." | ✅ Notices a habit, says nothing about whether it's good. |
| "Lentils became part of your kitchen." | ✅ Belonging, warmth, no health-claim attached. |
| "You finally started eating lentils — good!" | ❌ "Finally" + "good" = a grade. A friend's memory, not a parent's approval. |
| "Pizza was your favourite — here's a healthier version." | ❌ Smuggles WS9 Alternatives into a memory. Stories name; they never swap (WS10 §4.4, §11.2). |

The honesty rule from WS10 §2.3 governs the verbs: *featured / kept reaching for / became a regular* (plan);
*ate / loved* (adult diary); *you introduced [child] to* (child, plan-only — **never** "ate"). Affection is
the warmest claim a Story makes, so it must be the most carefully provenance-checked.

---

## PART C — WHAT COMES NEXT? (the hinge — WS11's defining section)

This is the **only** forward-looking section in the entire Stories family, and therefore where WS11's whole
trust-risk concentrates. WS10 was the *safest* lens precisely because it never turned around (WS10 Trust
Consequence 1). WS11 deliberately turns around — so it must do so with maximum care.

### C.1 The brief's question, answered

> *Is "this summer you might enjoy heirloom tomatoes, courgettes, peaches" Discovery, Seasonal Discovery, or a
> new story chapter?*

**It is all three descriptions of one thing, and the engine is unambiguous:**

- **Mechanically, it is WS8 Discovery** — the same Layer-1 relationship-graph traversal that powers "what else
  might I enjoy?", with **two seeds added**: (a) the foods the household just loved this season (so the
  suggestions are *personal*, growing out of the closing chapter — "you loved tomatoes → heirloom tomatoes,
  courgettes pair with them"), and (b) the *next* season's editorial seasonality (so the suggestions are
  *timely*). No new engine. (This is exactly the single forward "broaden" block WS10 §7.1 identified as the
  only graph hop in a Seasonal Story.)
- **Experientially, it is a new chapter opening.** The narrative frame — *"This summer you might enjoy…"* —
  reframes a Discovery list as the first page of the next season. That reframe *is* the value WS11 adds over
  raw WS8: Discovery offered cold is a menu; Discovery offered as *"the chapter that comes next, growing out
  of the one you loved"* is a story continuing.

So the answer: **Seasonal Discovery = WS8 Discovery, seeded by (loved-this-season ∪ next-season editorial
seasonality), narratively framed as the opening of a chapter.** One engine, two seeds, one warm frame.

### C.2 Why the hinge is the dangerous bit, and how it stays safe

A memory asks nothing of you. An invitation always carries a faint *"you ought to."* The hinge is where a
Seasonal Story stops being purely backward-safe and takes on a sliver of Discovery's forward risk (overwhelm)
and Alternatives' risk (implied judgement). Four guards keep it gentle:

| Guard | Rule |
|---|---|
| **Invitational, never imperative** | "you **might** enjoy" / "if you fancy it" — never "you **should** add", never "to improve your…". The verb mood is the whole battle. |
| **Grows from delight, not deficit** | Seeds are foods the household *loved* (tomatoes → heirloom tomatoes), never foods they *lacked* ("you ate few greens → here are greens"). The forward block must be uncomputable from a deficit, because deficit is uncomputable (Part E). It celebrates a *direction of joy*, not a *correction of a gap*. |
| **Seasonally honest, not supply-precise** | "this summer you might enjoy peaches" is an editorial gesture toward the season (Part D), **not** a claim that peaches are in your local shops now. THA has no location (Exec. Summary); it must not pretend to. |
| **Opt-out and quiet** | The forward block is skippable. A household that wants only memory, not suggestion, can turn the hinge off and keep the celebration. |

### C.3 The handoff, stated as the trust principle's consequence

The brief asks us to assume *"Seasonal Stories celebrate the chapter that ended and gently introduce the
chapter that comes next."* Its consequence is a clean division of labour with the existing lenses:

```
   WS10 Stories          WS11 Seasonal Story                         WS8 Discovery
   (pure memory)         (the hinge)                                 (pure exploration)
   "what we loved"  ───▶ "this is the chapter we loved,  ───gently──▶ "what else you might enjoy"
                          and here's the one beginning"   handoff

   backward · celebrate   close + open · celebrate + invite           forward · explore
   safest                 carries a sliver of forward-risk            forward by nature
```

A Seasonal Story does not *replace* Discovery; it **introduces** the household to it, at a natural moment (the
turn of a season), seeded by what they just loved. It is the warmest possible on-ramp to WS8 — and because the
on-ramp is opt-out, no one is pushed onto it.

---

## PART D — SEASONAL RELATIONSHIPS

### D.1 The data that already exists (verified — this is WS11's key new ground)

Seasonality is **not a thing WS11 must invent — it already lives in the schema**, and its existing shape
answers most of the brief's questions:

- **`knowledge_foods.seasonality` — `text` (`schema.ts:1466`)**, `source` defaulting to `"THA editorial"`.
  A free-text, editorial, per-food string.
- **Already seeded for ~51 foods** in `shared/knowledge/foods.ts`, and the existing values are *honestly
  hedged*, which is the whole lesson:

  | Food | Existing `seasonality` value | What the hedge teaches |
  |---|---|---|
  | Tomatoes | `"Summer (tinned year-round)"` | names the season *and* the year-round reality of preservation |
  | Strawberries | `"Early summer"` | precise-ish but still approximate, no region |
  | Apples | `"Autumn (stored year-round)"` | season of harvest + the truth that storage extends it |
  | Cashews / oils | `"Year-round"`, `"Year-round (imported)"` | honest that globalised supply has no season |
  | Walnuts | `"Autumn (dried year-round)"` | harvest season + preserved availability |

- **`meal_plan_templates.season` — `text` (`schema.ts:872`)**: THA *already* tags whole meal-plan templates by
  season. So a "spring plan" / "summer plan" editorial primitive exists, and the forward hinge (Part C) could
  one day lean on it (SUGGESTION) as well as on food-level seasonality.

### D.2 The brief's four questions, answered from that data

| Question | Finding |
|---|---|
| **Editorial?** | ✅ **Yes — it already is, and should stay so.** `source = "THA editorial"`. Seasonality is curatorial knowledge ("tomatoes feel like summer"), authored once, not computed per household. |
| **Region-specific?** | ❌ **No — THA cannot, and should not pretend to.** There is **no household/user location, region, hemisphere, postcode or climate field** in the schema (only `supermarket_links.country`, `schema.ts:558`, which is about shops). The existing strings are UK-default by editorial choice (British produce calendar; the brief's own spelling — *courgettes* — confirms the audience). Region-personalised seasonality would require new location data THA deliberately does not hold. Out of scope; a SUGGESTION at most, and a privacy decision in its own right. |
| **Approximate?** | ✅ **Yes — and approximation is a feature.** "Summer (tinned year-round)" is honest *because* it's fuzzy. A precise "in season 14 May–2 Sep" would be both false (globalised supply) and cold (the voice of a meter, WS10 §2.3). Approximate is warm and true. |
| **Climate-aware?** | ❌ **No.** Climate-awareness needs location + a live produce-calendar feed — neither exists, both are new data, and both would push the soft seasonal gesture toward a precision claim THA can't keep. Out of scope. |

### D.3 "How much is enough?"

**The existing free-text editorial string is enough** to power a warm Seasonal Story. The forward hinge needs
only to know, approximately, *which foods belong to the coming season* — and a coarse season tag
(spring/summer/autumn/winter, derivable from today's `knowledge_foods.seasonality` strings) plus the small
editorial `seasonal-with` seed map (WS7 E.2 / WS8 Tier 3) is sufficient.

A future, optional refinement — a structured `season` enum or month-range on the canonical spine, so the
forward block is less dependent on parsing free text — is a **SUGGESTION**, not a requirement, and would still
be editorial and approximate, never region-personalised without a separate location/privacy investigation.

The brief's own seasonal groupings (spring: asparagus, peas, radishes; summer: tomatoes, courgettes, basil,
peaches; autumn: pumpkins, mushrooms, apples; winter: leeks, squash, cabbage) are a perfect *editorial seed* —
UK-default, approximate, warm — and align with the values already in `shared/knowledge/foods.ts`. They are
content for an editor, not a computation for an engine.

---

## PART E — WHAT SHOULD NEVER APPEAR

The brief's red list, and *why each is dangerous* — then the architectural answer that makes them
**structurally impossible**, not merely discouraged.

| ❌ Never | Why it is dangerous |
|---|---|
| "You ate fewer vegetables than last spring." | A **decline-vs-self**. Turns a memory into a report card and the seasonal cadence into a recurring judgement. The seasonal frame makes this *worse* than WS10 — it invites a season-over-season trend line, the most natural and most toxic thing to compute. |
| "You only discovered 2 ingredients." | A **deficit**. "Only" shames a quiet season. Punishes exactly the households (busy, struggling, new) who most need warmth. |
| "You are below average." | A **cross-household comparison** against a fabricated norm. There is no healthy "average household"; the number can only wound. |
| "Dad eats less healthily than Lilly." | A **person-ranking** + a **health verdict**, naming family members against each other. Two forbidden moves; ends trust inside the home (and is a safeguarding risk if it leaves it). |
| "Your household ranked in the top 20%." | A **leaderboard**. Even "good" rankings make food a competition and the next season a thing to defend. Today's top-20% is tomorrow's pressure to stay there. |

### E.1 How they become structurally impossible

WS11 adopts WS10 §10 wholesale: **trust is won by *never computing* the dangerous primitive, not by *styling
it away*.** The seasonal overlay exposes only these operations, all windowed:

```
ALLOWED (seasonal memory primitives)                FORBIDDEN (scoreboard primitives)
  count(food, window)              counts up           declineVsSelf(window, prevWindow)   ✗ no "fewer than last spring"
  firstSeen(food[, eater], window) firsts              deficit(food, target)               ✗ no "only 2", no targets
  topByFrequency(window, N)        affection           rankMembers(window)                 ✗ no Dad-vs-Lilly
  rose(food, window)               rises               compareToOtherHousehold / average   ✗ no leaderboard, no "below average"
  distinctVarieties(food, window)  exploration         rejectionCount(food, eater, window) ✗ no negatives
  seasonalDiscover(lovedFoods, nextSeason) the hinge   trendOverSeasons(...)               ✗ no season-over-season line
```

The single most important addition WS11 makes to the forbidden list is **`trendOverSeasons` /
`declineVsSelf`**. WS10's overlay already forbade comparing to the past, but a *seasonal* product is the one
place where "this season vs last season" feels natural to build — it is the obvious next feature a
well-meaning engineer would add, and it is the gateway to every red-list item above. By declaring it
**uncomputable by construction**, every one of the brief's forbidden sentences becomes impossible:

- no `declineVsSelf` → *cannot* say "fewer vegetables than last spring";
- no `deficit` → *cannot* say "only discovered 2";
- no `average` / `compareToOtherHousehold` → *cannot* say "below average" or "top 20%";
- no `rankMembers` → *cannot* say "Dad eats less healthily than Lilly";
- no `rejectionCount` → *cannot* surface a child's refusals as memory.

A Seasonal Story can only ever say *what was present and what rose, this season*. It has no vocabulary for
*less*, *worse*, *behind*, or *versus*. That absence is the feature.

---

## PART F — SHARING

WS11 inherits WS10 §8 in full and adds the seasonal-cadence nuance.

### F.1 What is shareable

Aggregated, positive, person-anonymous renderings — never raw history:

| Shareable | Example | Risk |
|---|---|---|
| Seasonal headline | "This spring we discovered 12 new foods." | Low — aggregate, positive |
| Household MVP food | "Tomatoes were our household MVP this spring." | Low — playful, no person named |
| Seasonal milestone | "We cooked together 62 times this spring." | Low–medium (can read as a mild boast) |
| Per-eater fact | "Lilly discovered lentils." | **High — names a (likely child) family member** |

### F.2 The brief's four questions

| Question | Finding |
|---|---|
| **Opt in?** | ✅ **Per-share, every time.** Nothing auto-posts; a seasonal card never becomes a seasonal *broadcast*. Sending content externally publishes it — it may be cached or indexed even if later deleted — so the choice must be knowing and explicit each time (WS10 §8.3). |
| **Child privacy?** | ⚠️ **Hard boundary.** A per-eater fact naming a child (`household_eaters.userId = null`, `schema.ts:1090-1091`) is **off by default and gated behind explicit adult consent, if permitted at all.** And per WS10 §2.3 it isn't even an "ate" fact for a child — it's a "planned" fact — so sharing it publishes a claim the data can't support *about a child*. "Lilly discovered lentils" is adorable in the home and a safeguarding question the instant it leaves. |
| **Aggregate only?** | ✅ **Yes.** Aggregates ("12 new foods", "62 meals") may leave the house; the raw list of meals and dates never does. The share renderer reads the seasonal *aggregate*, not the entries. And because no comparison primitive exists (Part E), no share can leak a ranking even by accident. |
| **Delightful vs performative?** | ⚠️ **The seasonal cadence is the specific danger.** A recurring, designed-to-be-posted seasonal reveal is the Food-Wrapped failure mode (A.3, and below). The test stays WS10's: *would a kind friend say this out loud?* "We cooked a lot of pizza this spring 🍕" — yes. A seasonal card engineered for the share-count — no. **Optimise the card to make *you* smile, not to make an audience clap.** |

### F.3 The Food-Wrapped line, restated for a seasonal cadence

WS10 §7.3 named the four ways Spotify Wrapped fails a kitchen (hyper-precise, ranked, clout-shaped, annual
spectacle). The *seasonal* cadence makes the **fourth** sharpest: a thing that arrives on a schedule, designed
to be shared, *is* the spectacle. The guards: **quiet** (a gentle card surfacing in-app, not a push event),
**opt-in to even see it, opt-in again to share**, **skippable**, **private by default**, and **soft, rounded,
generous numbers** rather than Wrapped's false precision. The distinction in one line, inherited and seasonal:
**Wrapped tells you what you *did* this season so you'll *post* it; a Seasonal Story tells you what you
*loved* this season so you'll *smile* — and, if you like, gently turn the page.**

---

## PART G — RELATIONSHIP TO PREVIOUS WORKSTREAMS

### G.1 What a Seasonal Story *is*, architecturally

| The brief asks | Answer |
|---|---|
| **A read model?** | ✅ **Yes — primarily.** The backward half is `householdFoodMemory(householdId, lens = window)` (WS10 Rec. 4 / WS7 Rec. 5) — one reader, the lens being a date window. No new write path, no backfill. |
| **A scheduled summary?** | ⚠️ **Optionally — for delivery only.** A Seasonal Story *may* be assembled by a scheduled end-of-season job (zero-input, deficit-free) so it's ready when the season turns. Scheduling is a *delivery choice*, not the nature of the feature; the card can equally be computed on demand. |
| **A seasonal lens over the overlay?** | ✅ **Yes — exactly.** It is WS10's overlay with `WHERE createdAt BETWEEN [season start, end]`. The "lens" (WS10 §2.2) is here parameterised to a named season window. |
| **Discovery plus memory?** | ✅ **Yes — and this is the one-line definition.** A Seasonal Story = **windowed memory (WS10, backward) + seasonally-seeded Discovery (WS8, forward), hinged by a gentle handoff.** That hinge is WS11's only genuinely new idea; everything else is composition. |

### G.2 Lineage map

| Workstream | What WS11 builds on |
|---|---|
| **WS2B** | "Your Varieties" → a season's "explored N varieties" and the forward "broaden" block. |
| **WS2E** | Canonical spine + one-slug-one-food lock → every windowed count is honest (no double-count, no missed alias) or is not shown. |
| **WS6** | The Food Report contract → a Seasonal Story could surface as a seasonal *report section*; any nutritional aside reuses the report's Key Nutrients (one seam). |
| **WS7** | The two-layer model + framing contract. WS11 is WS7 Part E ("seasonal stories") fully deepened. |
| **WS8** | Discovery → **the entire forward half** of the hinge. Seasonal Discovery *is* WS8 with a seasonal seed (Part C). |
| **WS9** | Alternatives → explicitly **out of scope**. A Seasonal Story names what was loved and invites what's next; it never says "instead of X, try Y." Swaps are a different opt-in lens on a different surface. |
| **WS10** | **The backbone.** WS11 is WS10's Seasonal Story lens (WS10 §7) standing alone, inheriting honest-memory verbs (§2.3), the no-deficit/no-comparison architecture (§10), favourites (§4), firsts (§6), milestones (§3), the eraser (§9.2), and the child-privacy rule (§8.3) — adding only the seasonal-honesty constraint and the forward hinge. |

**The verdict on "separate system?": no.** A separate Seasonal Stories system would re-introduce exactly the
duplication WS6/WS7 exist to end. One graph (WS8), one overlay (WS7/WS10), one canonical spine (WS2E), one
more lens with one editorial seasonality field that *already exists*.

---

## TRUST PRINCIPLE (assumed true; consequences investigated)

> Stories remember. Discovery explores. **Seasonal Stories celebrate the chapter that ended and gently
> introduce the chapter that comes next.**

**Consequence 1 — A Seasonal Story is the only lens that is both backward and forward, so it inherits both the
safety of memory and a sliver of the risk of suggestion.** WS10 was safest because it never turned around;
WS11 turns around on purpose. The backward half stays as safe as WS10 (no deficit, no comparison — Part E);
the forward half must be held to Discovery's gentleness (invitational, opt-out, delight-seeded — Part C). The
hinge is where care concentrates.

**Consequence 2 — "Celebrate the chapter that ended" forbids "grade the chapter that ended."** A chapter that
*closed* is, by definition, finished — you cannot be asked to improve it. That is what makes seasonal memory
safe: it is already past. The danger is only ever in *comparing* one closed chapter to another, which Part E
makes uncomputable.

**Consequence 3 — "Gently introduce the next chapter" forbids "prescribe the next chapter."** An introduction
is an offer; a prescription is an order. The forward block must open a door (*"you might enjoy…"*) and never
push the household through it (*"you should eat…", "to improve…"*). Opt-out is the architectural form of
"gently."

**Consequence 4 — the chapter metaphor is the trust model, not decoration.** A *chapter* implies a book the
household is authoring with their own kitchen — each season a page they wrote, the next a page they get to
write. THA is the friend who remembers the last chapter fondly and says *"can't wait to see what you cook
next"* — not the critic scoring each instalment. Hold the metaphor and the feature stays warm; break it (into
trends, scores, comparisons) and it becomes a serialised report card.

---

## RECOMMENDATIONS

### Short-term (now, no schema / UI change)

1. **Adopt "Honest seasonality & the gentle hinge" as WS11's invariant (the 5th in the lineage):** a season
   is a place as well as a time; THA knows the time, not the place; so the forward "next chapter" is an
   editorial, approximate, opt-out **invitation**, never a local-supply claim, a target, or a "should."
2. **Reuse WS10's provenance-aware verb vocabulary unchanged** for the backward half (plan → "cooked/featured";
   adult diary → "ate/logged"; child → "introduced/planned for", never "ate"). A Seasonal Story adds no new
   verbs to the memory half.
3. **Add `trendOverSeasons` / `declineVsSelf` explicitly to the forbidden-primitive list** (extends WS10 §10).
   This is the single most important guard WS11 contributes: the season-over-season comparison is the natural
   next feature and the gateway to every red-list item (Part E). Forbid it by non-computation.

### Medium-term (before any build)

4. **Specify the Seasonal Story as a composition, not a new system:** backward half = `householdFoodMemory(
   householdId, lens = season-window)` (WS10 Rec. 4); forward half = `seasonalDiscover(lovedFoods,
   nextSeason)` = WS8 Discovery with a seasonal seed (Part C). Document the **hinge** (the handoff copy +
   the opt-out) as the only new surface.
5. **Author the forward-hinge framing sub-contract** (invitational mood only · delight-seeded not
   deficit-seeded · seasonally honest not supply-precise · opt-out) as an extension of WS10's framing
   contract module. The hinge is where a "should" can enter; this contract is its guard.
6. **Keep seasonality editorial and approximate.** Use the existing `knowledge_foods.seasonality` strings and
   the brief's UK-default seasonal groupings as the editorial seed; do **not** introduce region/climate
   personalisation without a separate location-data + privacy investigation.

### Long-term (implementation, future workstreams — each its own investigation + approval)

7. **Seasonal Story as a scheduled, zero-input, deficit-free, opt-in seasonal card**, surfaced quietly in-app
   (not pushed as an event), skippable, with the forward hinge individually opt-out (SUGGESTION).
8. **Optional structured seasonality** (a `season` enum or month-range on the canonical spine) *only if*
   parsing free-text `knowledge_foods.seasonality` proves limiting — still editorial, still approximate, never
   region-personalised without a separate privacy investigation (SUGGESTION).
9. **Seasonal sharing as opt-in aggregate rendering** with the hard child gate (WS10 §8.3) — built only after
   in-home Seasonal Stories are trusted, and tuned to make the household smile, not to maximise shares.

---

## RISKS

| # | Risk | Severity | Mitigation (where investigated) |
|---|---|---|---|
| R1 | **Season-over-season trend creep** — the natural "this spring vs last spring" feature, gateway to every red-list item | **High** | Forbid `trendOverSeasons` / `declineVsSelf` by non-computation (Part E, Rec. 3) |
| R2 | **The hinge smuggles a "should"** — "this summer you should eat more greens" | **High** | Invitational mood only; delight-seeded not deficit-seeded; opt-out (Part C, Rec. 5) |
| R3 | **Seasonal supply over-claim** — "peaches in season near you" when THA has no location | **High** | Editorial/approximate seasonality; soft "you might enjoy"; no region/climate (Part D, Rec. 1) |
| R4 | **Food-Wrapped drift, seasonal edition** — a recurring, share-optimised, ranked seasonal spectacle | **High** | Quiet card not event; opt-in to see + opt-in to share; affection markers not leaderboard; soft numbers (A.3, F.3) |
| R5 | **Deficit / "only" creep** in a quiet season | **High** | No deficit primitive; empty is silent (Part E, Invariant 3) |
| R6 | **Person- or household-ranking** ("Dad vs Lilly", "top 20%") | **High** | No `rankMembers` / `compareToOtherHousehold` / `average` (Part E / WS10 §10) |
| R7 | **Child exposure via a shared seasonal card** — naming a child + a "discovered" fact | **High** | Off-by-default + hard-gated; plan-based verbs; aggregates only (Part F, WS10 §8.3) |
| R8 | **Overclaiming consumption** — "you ate 62 meals" when THA saw the plan | **Medium** | Inherited provenance-aware verbs; honest source, not `activity_summary` (Rec. 2, WS10 §2.3–2.4) |
| R9 | **Optimisation smuggling** — attaching a WS9 swap to a loved food | **Medium** | Hard boundary: Stories name, Alternatives swap, different opt-in surface (G.2, WS10 §11.2) |
| R10 | **Notification spam** — a loud seasonal push every quarter | **Low–Med** | In-app, quiet, opt-in, skippable; one gentle card per season (Rec. 7, F.3) |
| R11 | **Stale / frozen favourite** carried across seasons | **Medium** | Recency-weighted favourites + pin/dismiss (WS10 §4.3–4.4) |
| R12 | **No eraser** — household cannot forget a season | **Medium** | Ship delete-a-fact / a-Story / all with the first surface (WS10 §9.2, Rec. 7) |

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** (`planner_entries`, `planner_entry_eaters`, `food_diary_days`/`_entries`, `user_item_usage`, `household_eaters`, canonical spine + `canonical_food_alias`, WS2B varieties, **`knowledge_foods.seasonality`**, optionally `meal_plan_templates.season`) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |
| DB changes | **NO** |
| Schema changes | **NO** |
| UI changes | **NO** |

---

## SCOPE LOCK

Investigation only. No implementation. No Food Wrapped. No rankings. No comparisons. No schema changes. No DB
changes. No UI changes. The ASCII blocks above are decompositions of the brief's own examples against verified
data sources — not designs. Every concrete build idea is confined to RECOMMENDATIONS (long-term) and
SUGGESTION below, and each requires its own investigation and approval before any commitment.

---

## SUGGESTION (future possibilities flagged, out of current scope)

- **SUGGESTION:** A **Seasonal Story read model** composing WS10's `householdFoodMemory(householdId, window)`
  (backward) with `seasonalDiscover(lovedFoods, nextSeason)` = WS8 Discovery + a seasonal seed (forward),
  joined by a documented **hinge** (handoff copy + opt-out). No new write path.
- **SUGGESTION:** A **forward-hinge framing sub-contract** (invitational-only · delight-seeded · seasonally-
  honest · opt-out), extending WS10's framing-contract module — the guard against a "should" in the one
  forward-facing block of the Stories family.
- **SUGGESTION:** Extend the forbidden-primitive list with **`trendOverSeasons` / `declineVsSelf`** so
  season-over-season comparison is uncomputable, not merely discouraged.
- **SUGGESTION:** A **scheduled, zero-input, deficit-free seasonal card**, opt-in, surfaced quietly in-app,
  skippable, with the forward hinge individually opt-out.
- **SUGGESTION:** **Structured editorial seasonality** (a `season` enum / month-range on the canonical spine)
  *only if* free-text `knowledge_foods.seasonality` proves limiting — still editorial, still approximate,
  never region-personalised without a separate location/privacy investigation.
- **SUGGESTION:** Lean the forward hinge on the existing **`meal_plan_templates.season`** primitive (seasonal
  plan templates), not only on food-level edges.
- **SUGGESTION:** **Opt-in aggregate seasonal sharing** with the hard child gate, tuned for delight not
  share-count, built only after in-home Seasonal Stories are trusted.

---

## DEFINITION OF DONE — checklist

| Required | Done |
|---|---|
| Seasonal philosophy defined | ✅ Exec. Summary, Parts A, Trust Principle |
| Story structure explored | ✅ Parts A, B |
| Discovery integration explored | ✅ Part C (the hinge) |
| Seasonal relationships investigated | ✅ Part D (grounded in `knowledge_foods.seasonality`) |
| Trust and privacy explored | ✅ Parts E, F, Trust Principle, Risks |
| Sharing explored | ✅ Part F |
| Recommendations provided | ✅ Recommendations + SUGGESTION |
| Risks provided | ✅ Risks (R1–R12) |
| No implementation / schema / UI / DB change | ✅ Scope Lock, Data Impact |

---

## FINAL QUESTION — answered explicitly

> **Can THA create Seasonal Stories that help households remember what they loved, while gently answering
> "what chapter comes next?"**

**Yes — and almost nothing new is needed to build it, because a Seasonal Story is two lenses THA has already
investigated, hinged together.**

**Why yes:**

1. **The backward half already exists, fully and safely.** It is WS10's overlay windowed by a season —
   `count`, `firstSeen`, `topByFrequency`, `rose` — every primitive already defined and every dangerous
   primitive (deficit, decline, ranking, comparison) already forbidden by non-computation (Part E / WS10 §10).
   No new write path, no backfill.
2. **The forward half already exists too.** "What comes next" is WS8 Discovery, seeded by the foods the
   household just loved and the next season's editorial seasonality, and reframed as the opening of a chapter
   (Part C). One engine, two seeds, one warm frame — not a new system.
3. **Seasonality is already editorial, already approximate, and that is exactly right.** It lives on
   `knowledge_foods.seasonality` today, honestly hedged. THA holds no location, so it offers a gentle seasonal
   *gesture*, never a local-supply *claim* (Part D) — and the gesture is warmer for being soft.
4. **The forbidden becomes impossible, not merely discouraged.** By refusing to compute `trendOverSeasons` /
   `declineVsSelf` (and inheriting WS10's refusals), every sentence on the brief's red list —
   "fewer than last spring", "only 2 ingredients", "below average", "Dad vs Lilly", "top 20%" — is
   *uncomputable*. Trust by non-computation, at no cost (Part E).

**The one honest constraint (which is the gift, not the catch):**

> **A season is a place as much as a time, and THA knows the time but not the place — so the chapter that
> comes next must be offered as a warm, editorial, approximate *invitation*, never a precise *prescription*.**
> "This summer you might enjoy peaches 🍑" is true, warm, and asks nothing; "peaches are in season near you,
> add them to improve your diet" is a claim THA can't support and a nudge a memory must never carry. The soft,
> seasonal, invitational voice is simultaneously the honest one and the warm one — exactly as planned-vs-eaten
> was for WS10.

So nothing is *missing* to begin — no new data, no new write path, no backfill. What is *required* is a
discipline, authored once: **a windowed memory that can only count up and never compare across seasons, a
forward hinge that only ever invites and never prescribes, an editorial seasonality that gestures rather than
claims, and the WS10 protections (honest verbs, child gate, eraser, private-by-default) carried through.** With
those, THA becomes a kitchen that closes each season with *"wasn't that lovely"* and opens the next with
*"can't wait to see what you cook"* — a friend turning the page with you, not a critic scoring your instalments.
**The architecture decides which; the brief's answer is yes.**

---

*End of WS11 — Seasonal Stories Investigation. Investigation only; no implementation performed.*
*Rollback: `git reset --hard rollback/ws11-pre-investigation-20260620`.*
