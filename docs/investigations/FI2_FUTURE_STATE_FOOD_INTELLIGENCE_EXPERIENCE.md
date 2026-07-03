# FI2 — Future-State Food Intelligence Experience

**Document type:** Investigation & experience design only — no code, schema, route, runtime, or data change.
**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI2 (🔴 RED — architectural/experience vision; governs future experience workstreams)
**Author role:** Senior product designer + Companion conversation designer, working from the governing Food Intelligence Platform Architecture.
**Predecessor:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 — the governing platform architecture: three-layer separation, four-plane knowledge model, enrich-never-own Rule FI1, signal ladder, phased build roadmap).

**Governing architecture read before this investigation (STEP 2 bootstrap):**
- `docs/architecture/README.md` (canonical entry point)
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (domain ownership)
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (the governing document for this experience design — three-layer separation, four-plane model, Rules T0–T2/G1/E1–E2/GO1–GO2/LT1–LT3/S1/FI1, signal ladder, capability map, phased build roadmap)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`
- `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` (Summary → Companion Cards → Next Steps; the firewall against markdown/external URLs/provenance-on-card)
- `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` (Conversation discovers; canonical pages present; external sources provenance-only)
- `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (current launch sequencing — what is real today vs. still building)

**What this document is not:** it does not alter, extend, or re-derive the governing architecture. Every structural claim (the three layers, the four planes, the trust rules, the signal ladder, the capability map) is cited from `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` and used as a fixed constraint. This document's only job is the **experience** that sits on top of that architecture: what it feels like to be a household using it, described without being constrained by what is built today.

**Refined:** 2026-07-03 (EWO-FI2A) — added the governing Food Intelligence mission (§0), the Learning Loop as a sixth core experience principle (§2.4), and strengthened the philosophy already present in §1/§2.1. The architecture (§3, §11), the phased roadmap (§9), and the implementation phases named throughout are unchanged. See `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md`.

---

## ROLLBACK PROTECTION (STEP 1)

| Item | Value |
|---|---|
| Git status at start | Working tree already dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1-series work on this branch (pre-existing, unrelated to this task) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` |
| Rollback tag | `rollback/before-fi2-future-state-food-intelligence-experience-20260703` → `8ae0f7e` |
| This task's writes | Exactly one new file: `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` |
| Undo this doc only | `rm docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` |

**This task makes no code, schema, route, API, migration, or data change and generates no health claims.** It produces exactly this file plus one git tag.

---

# SECTION 0 — THE GOVERNING FOOD INTELLIGENCE MISSION

*(Added at EWO-FI2A.)*

> **Food Intelligence exists so a household spends less time thinking about nutrition, and more time enjoying food together.**

This is the mission every commitment, surface, and conversation in this document serves. It sits above the design brief (§1 — "Confidently Choose Better. Simply.") and the one-sentence experience test (§2.1): those are *how* the mission is delivered; this is *why* it exists at all. A future scene that makes a household think harder about nutrition, even briefly, has failed the mission — regardless of how well it satisfies any other rule in this document.

Two consequences follow directly, and govern every scene in §3 and every conversation in §5:

- **Thinking-about-nutrition time is a cost, not a feature.** Every ambient surface is judged by how little attention it demands, not by how much insight it displays — §8's simplicity contract is this mission's operating discipline, restated in engineering terms.
- **Time-together is the thing being protected.** The Companion, the ambient strips, and the Food Story do not exist to be used more. They exist so the food decisions a household makes together — what's for dinner, what's on this week's plan, what a guest can eat — take less effort, leaving more of the evening for the meal itself rather than the reasoning behind it.

This mission changes no architectural rule in FI1. It states why FI1's rules — ambient enrichment (Rule FI1), silence-by-default, one verb per moment — were the right rules to write in the first place.

---

# SECTION 1 — EXECUTIVE SUMMARY

The governing Food Intelligence Platform Architecture (FI1) answers the question *"where does the intelligence live and who owns what?"* This document answers the question FI1 deliberately left open: **what does it feel like?**

The future-state Food Intelligence experience has one job: make a household's next food decision easier, without ever asking them to think about "nutrition" as a subject. Intelligence shows up already dissolved into the decision — a Planner slot, a Shopping line, a Pantry glance, a Cookbook suggestion, a Companion reply, a shared meal from a friend — never as a destination the household must remember to visit. Its measure of success is not how much a household learns about nutrition — it is how much *less* they have to think about it, so more of the evening belongs to the meal and the people at the table, not the reasoning behind it (the mission stated explicitly at §0).

Three commitments, carried directly from FI1, shape every scene in this document:

1. **Ambient, not additional.** Food Intelligence never asks for a new tab, a new app, or a new habit. It rides inside the habits a household already has (§3).
2. **Decisions, not data.** Every surface answers "what should I do next?", never "here is a number about you" (§4).
3. **Simple enough to trust, deep enough to matter.** The engine underneath is a deterministic, cited, four-plane reasoning system (FI1 §4); the experience on top of it is one honest sentence, one card, one verb. Power is proven by restraint, not by how much is shown (§8).

**The one-line design brief this document exists to answer:** *Confidently Choose Better. Simply.* Every scene below is a test of that sentence — the intelligence can be arbitrarily deep underneath, but what the household sees must always be simple enough to act on in seconds.

**Confidence:** High on the ambient-surface design and the Companion conversation patterns — every pattern extends a real seed already live or specified in FI1/NUT1 (cited throughout). Medium on the long-term Community and partner-integration scenes — these depend on capabilities FI1 explicitly marks as not-yet-built (Community capability, Signals Gateway) and on commercial/regulatory work outside this document's control (flagged again at §9 and §10).

---

# SECTION 2 — THE EXPERIENCE VISION

## 2.1 One sentence

> **A household never has to ask "is this healthy?" — because by the time they're deciding what to plan, buy, cook, or eat, Food Intelligence has already quietly made sure the honest answer is folded into the choice in front of them.**

## 2.2 The five properties of the future-state experience

These are FI1's four architectural planes and its trust rules, translated into what a person actually notices:

| Property | What the household experiences | What in FI1 makes this true |
|---|---|---|
| **Ambient** | Intelligence appears *inside* the surface they're already using — never a separate "Nutrition" destination to remember. | Enrichment map (FI1 §3.1): Food Intelligence composes over each domain's existing assembled model; it never becomes a new page to visit. |
| **Household-shaped** | The answer is always *this household's* answer — every eater's restrictions, tastes and goals reconciled, never a generic population answer. | Plane 2 — Personal Intelligence (FI1 §4.2); Rules P1–P3, GO1–GO2. |
| **Explained on demand, never forced** | A short honest sentence by default; the full "why" is one tap away, never dumped on the household unasked. | Rule E1–E2 (no citation, no card; show uncertainty); the composition law (FI1 §4.5). |
| **A story that grows with them** | The household can look back — a week, a season, a year, eventually years — and see a food story that is genuinely theirs, not a generic streak counter. | Plane 2 personal history + Personalisation Event Log (FI1 §4.2, §7.2). |
| **Bounded and honest** | It never pretends to be a doctor. When a question needs one, it says so warmly and keeps helping with the food part. | Rules T0–T2 (safety, food-not-bodies, defer to a professional). |

## 2.3 What the future-state experience is deliberately NOT

Carried forward unchanged from FI1 (§5, §6.3) and restated here as experience-level promises the household can rely on:

- **Not a second app to open.** If a household ever says "let me check the nutrition thing," the ambient design has failed.
- **Not a scoreboard on the person.** Every count is about *food* — plants, gaps, streaks, swaps — never about a body, a weight, or a symptom (Rule T1).
- **Not a nag.** A week with nothing worth saying, says nothing. Silence is a legitimate, frequent, correct state.
- **Not a guesser.** When the honest answer is "we don't know," the experience says exactly that, in the same warm voice it uses for everything else.

## 2.4 The Learning Loop — a sixth core experience principle

*(Added at EWO-FI2A, alongside the five properties in §2.2.)*

Every ordinary action a household already takes — accepting a swap, dismissing a suggestion, adding a shared meal, trying a new plant — quietly becomes the input that makes next week's Food Intelligence better at being *this household's* Food Intelligence. This is what keeps the five properties in §2.2 true over time, not just at first use:

| What the household experiences | What in FI1 makes this true |
|---|---|
| Suggestions get quietly more relevant the longer the household lives with THA — not because they configured anything, but because they used it normally. | Plane 2 Personalisation Event Log (FI1 §4.2, §7.2); Rule P1 — learning re-weights, never authors. |
| A dismissed swap stops reappearing, but never turns into a permanent judgment against the household. | Rule P2 — decay over delete for negatives. |
| What Sam's taste teaches the engine stays Sam's; what the household decides to cook stays the household's. | Rule P3 — per-person learning, per-household action. |
| The loop is visible, not a black box — every learned weight can be shown as a reason, and reset at any time. | FI1 §8 Phase 2 gate: learned weights individually explainable; opt-out and reset ship before learning ships. |

**Why this belongs beside the other five properties, not only inside the architecture:** without a closing loop, "household-shaped" (§2.2) would mean only "shaped by what we told it once" — restrictions and stated goals, static forever. The Learning Loop is what lets the household-shaped answer keep being accurate as the household itself changes, using nothing more than the ordinary act of living with the product — the same mission stated at §0, extended across time rather than a single moment. This names, for the first time at the experience layer, that closing this loop is a first-class design commitment, not merely an implementation detail of FI1's Phase 2 (§9 of this document, FI1 §8 — unchanged, cited here as the gate this principle must clear before it ships).

---

# SECTION 3 — FOOD INTELLIGENCE, AMBIENT ACROSS EVERY SURFACE

One rule governs every surface below, inherited directly from FI1 Rule FI1 (enrichment, not ownership) and the Companion Card Experience Principle: **Food Intelligence never becomes a new place to go — it becomes a quiet layer inside the place the household already goes.** Each surface keeps its existing job; intelligence rides inside it.

### 3.1 Planner — the week that already knows what it's missing

**The everyday loop.** Maya builds her week in the Planner exactly as she does today — dragging meals into slots. Beneath the week, one quiet line reads:

```
This week: 26 plants (4 short of 30) · fibre well covered · oily fish absent 3 weeks running
```

Nothing else. No chart, no badge wall, no red/amber/green traffic lights. Each phrase is tappable to unfold its "why" (which meals contributed, which eater's need shaped it); nothing unfolds unless she asks.

**The decision, not the data point.** The strip never stops at the number. Beside "oily fish absent 3 weeks running" sits exactly one verb: *Fix this.* Tapping it does not open a report — it hands the moment straight to the Companion, which proposes two meals that already pass every eater's restrictions and places the accepted one on Thursday in a single confirmation. The Shopping list updates itself the moment the meal lands.

**Why this is Planner's job, not a new page's:** the Planner remains the one place a household decides *what* to eat and *when* — Food Intelligence enriches that existing decision surface (FI1 §3.1) rather than building a second one next to it.

### 3.2 Shopping — the list that explains itself without being asked

**The everyday loop.** The list is grouped exactly as today. Two kinds of quiet context ride inside existing lines, never above them:

```
Salmon fillets ................... covers this week's oily-fish gap
Natural yoghurt (500g) ........... same-category swap available → less sugar
```

The swap chip shows the comparison as a fact, not a verdict — "10g sugar vs. 4g sugar, same category" — and lets Maya ignore it with one tap that the system remembers (Rule P2 — dismissals decay, they don't accumulate as a scoreboard against her).

**The decision, not the data point.** A boosted item that Maya accepted from a Cookbook suggestion carries its reason onto the list line the same way — "pumpkin seeds — pairs with the oats you already buy" — so the *why* never gets lost between "I said yes" in the kitchen and "I'm buying it" at the shop.

### 3.3 Cookbook (Meals) — every recipe already knows this household

**The everyday loop.** Opening any meal — the household's own recipe or a newly imported one — shows the same three honest facts every time, never more: whether it fits every eater today, one *Simply Better* boost with its two-fact citation visible, and a plain-language nutrition context line. A vegetarian household never sees a meat swap suggested; a household with a dairy-free child sees that fact stated plainly on the meal, not discovered at the table.

**The decision, not the data point.** *Simply Better* offers exactly one boost at a time, framed as a pairing, never a correction: *"a source of magnesium, pairs with the oats you already buy."* Accepting it is one tap that flows straight to the next Shopping list — the household never re-types anything they've already decided.

### 3.4 Pantry — cook from what's already yours

**The everyday loop.** Pantry Explore remains the household's encyclopedic "why is this good for us" surface, unchanged in spirit. What's new in the future state is a second, much smaller everyday moment sitting beside it: a quiet read of *what tonight's dinner could be from what's already in the cupboard* — "cook from what you have," counted honestly against tonight's actual inventory, not a hypothetical shopping list.

**The decision, not the data point.** This never becomes a second recipe engine. It is one line — *"tonight's options from what's already home: 3"* — with a single tap into the Cookbook filtered to those three, keeping Pantry the inventory surface and Cookbook the recipe surface, exactly as their existing ownership already splits (FI1 §3.1).

### 3.5 Companion — the front door to everything above

**The everyday loop.** The Companion is where a scattered thought becomes a plan. "Fix the fish gap." "What can I make with what's in the fridge?" "Is this cereal actually decent?" "We're all knackered lately." Every one of these resolves through the same one assistant, the same Companion Card shape (Summary → Cards → Next Steps), the same honest boundary rules — never a special-purpose nutrition bot bolted on the side (Companion Card Experience Principle; Rule T0–T2).

**The decision, not the data point.** The Companion never answers with a wall of facts. It answers with a one-line honest summary, the one or two entities that matter (a meal, a swap, a plan slot), and the next verb — because the Companion *discovers and refers*, it never renders a page or edits an entity in place (Intelligence Discovery & Presentation Principle). Full example conversations are in §5.

### 3.6 Community — meals proven by people like you, re-grounded for your household

*(Not built today — this is the honest future-state shape FI1 §3.1 and §6.4 of NUT2 name for it.)*

**The everyday loop.** A friend shares a Tuesday-night curry. The household doesn't see the friend's card verbatim — they see it **re-grounded**: *"fits your household except Ivy's dairy-free — here's the swap that makes it work."* Popularity is an honest, visible fact ("1,200 households cook this in under 30 minutes") — never a health claim. A testimony like "this fixed my bloating" is never rendered as knowledge; it simply cannot enter the system as a fact (the testimony firewall, FI1 §4.6).

**The decision, not the data point.** Every shared meal carries exactly one verb — *Add to my week* — which drops it into the *viewer's* Planner already adapted to their own household's restrictions, never the sharer's.

### 3.7 Future partner integrations — the same intelligence, wherever the household already is

*(Signal partners not built today — FI1 §6 signal ladder, S-1 and beyond. Retail/voice/display partners are edge adapters over the one Gateway per FI1 §7.1.)*

**The everyday loop.** A wearable's weekly activity summary quietly reframes one Cookbook suggestion on a heavy-training day ("higher-protein options today"). A kitchen display shows the same Planner strip the phone shows, because it's the same Gateway, not a second brain. A grocery retail partner's own app shows the same "covers this week's gap" line on the same salmon, because Food Intelligence writes through Shopping's own registered capability, never a private channel to the partner (Rule FI1).

**The decision, not the data point.** No partner surface is ever allowed to introduce a diagnosis-shaped statement or a body-level claim — the same food-not-bodies line holds everywhere the intelligence appears, on every screen, in every partner's UI (Rule T1, Rule S1).

---

# SECTION 4 — DECISIONS, NOT ISOLATED NUTRITION INFORMATION

This is the crosscutting design law every surface in §3 obeys. The future-state experience is judged against one test: **does this help the household decide the next thing, or does it just tell them a fact about themselves?**

| Isolated nutrition information (what to avoid) | Everyday household decision (what the experience must do instead) |
|---|---|
| "Your household's fibre intake this week: 18g average per eater." | "Fibre's well covered this week — nothing to do." *(and if it weren't: "add one more wholegrain side this week — here's an easy one.")* |
| "This meal contains 340 calories per serving." | "This fits everyone in your household tonight — no swaps needed." |
| "You are deficient in magnesium." | "A magnesium-source pairing is available for Thursday's dinner — pairs with the oats you already buy." |
| "Your child ate 2 vegetables this week." | "Ivy tried 3 new plants this month" — framed as discovery and growth, never a shortfall (§6.3 of FI1; children get variety framing only, never a goal or a score). |
| A weekly PDF report full of charts. | A 90-second Food Story: what went well, one honest gap, one suggested focus for next week (§6). |

**The mechanism that makes this durable, not just a copywriting rule:** every everyday phrase co-locates with exactly one verb that acts on the surface where the household already is (FI1 §4's "decisions are offered where they are executed," carried forward from NUT2 §4). A fact with no verb attached is not a Food Intelligence surface — it is a report, and reports stay opt-in, occasional, and clearly labelled as such (the Food Story, §6).

---

# SECTION 5 — IDEAL COMPANION CONVERSATIONS FOR COMMON HOUSEHOLD SCENARIOS

Every conversation below follows the governing Companion Card shape — **Summary → Companion Cards → Next Steps** — and never breaks the firewall (no raw markdown, no external URLs, no provenance on a card; provenance stays two taps away, on the canonical page). Households: **the Reeves** (two adults — Maya, vegetarian; Sam, training for a half-marathon — and two children, one of whom, Ivy, is dairy-free), continued from FI1's own worked example; and **Priya**, a household of one, used for scenarios where a family framing would be misleading.

### 5.1 Sunday planning — "fix the fish gap"

> **Maya:** fix the fish gap this week
>
> **Companion:** Found two meals that work for everyone in your household and cover this week's oily-fish gap.
> **[Card] Baked Salmon Traybake** — fits everyone · 25 min · Open Meal · Add to Planner · Add to Shopping
> **[Card] Miso Mackerel Bowls** — fits everyone · 20 min · Open Meal · Add to Planner · Add to Shopping
> **Next step:** View all fish meals
>
> **Maya:** the first one, put it on Thursday
>
> **Companion:** Done — Baked Salmon Traybake is on Thursday. Your shopping list now has salmon, marked as covering this week's gap.

*Why this works:* one honest summary, two grounded cards, a single confirming action — the Companion never rendered a meal page in place, it linked to one (Companion Card Experience Principle); the write happened through Planner's own registered intent, never a private Food Intelligence write path (Rule FI1).

### 5.2 Weeknight scramble — "what can I make with what's already home?"

> **Maya:** what can i make tonight, don't want to shop
>
> **Companion:** 3 meals tonight from what's already in your pantry.
> **[Card] Veggie Fried Rice** — fits everyone · uses what you have · Open Meal · Add to Planner
> **[Card] Chickpea Curry** — fits everyone · uses what you have · Open Meal · Add to Planner
> **[Card] Pasta Primavera** — fits everyone except Ivy (contains dairy) — swap available · Open Meal
> **Next step:** View all pantry-ready meals

*Why this works:* the household-fit fact is stated honestly even on the meal that doesn't fit — never hidden, never silently filtered without saying why (Rule T0 — hard restrictions are never softened, but they're also never hidden as a mystery).

### 5.3 A new restriction just arrived — quiet, practical, never clinical

> **Maya:** we just found out ivy needs to go gluten-free too, not just dairy-free
>
> **Companion:** Got it — I've noted Ivy needs gluten-free and dairy-free. Here's what that changes this week: 2 planned meals need a swap.
> **[Card] Tuesday's Pasta Bake** — swap needed for Ivy · Open Meal · See gluten-free swap
> **[Card] Friday's Pizza Night** — swap needed for Ivy · Open Meal · See gluten-free swap
> **Next step:** Update Ivy's profile

*Why this works:* the Companion never diagnoses or comments on *why* — it treats the new fact exactly as a household-composition update (which happens through the Household capability, not a Food Intelligence write, FI1 §3.1) and immediately turns it into the two decisions it actually changes. No question is asked about medical cause; none is needed.

### 5.4 The honest boundary — "we're all knackered lately"

> **Priya:** we're all so tired lately, what should we look at food-wise?
>
> **Companion:** Persistent tiredness has a lot of possible causes, and if it's been going on a while, a GP conversation is the right place to start. On the food side, there are a few things I can help with — foods with magnesium and iron are commonly paired with energy-supporting diets, and I can check what's already in your meals this week.
> **[Card] This week's magnesium-source foods:** 4 meals include one · Open Food Story
> **Next step:** Add a magnesium-source side to Thursday

*Why this works:* Rule T2 in full — a warm, bounded redirect, never a cold refusal and never a guess at a medical cause — followed immediately by the food-scoped help the Companion is actually allowed to give (Rule T1: food, not bodies).

### 5.5 Hosting with an allergy guest — Cookbook meets Community

> **Sam:** we're having priya over friday, she's got a nut allergy, need something that works
>
> **Companion:** Found 3 meals in your Cookbook that are nut-free and fit everyone in your household too.
> **[Card] Thai Green Curry (nut-free version)** — fits everyone + nut-free · Open Meal · Add to Planner
> **[Card] Roast Chicken Traybake** — fits everyone + nut-free · Open Meal · Add to Planner
> **[Card] Stuffed Peppers** — fits everyone + nut-free · Open Meal · Add to Planner
> **Next step:** View all nut-free meals

*Why this works:* a guest's restriction is treated with the same seriousness as a household eater's — the Companion reconciles across everyone at the table for that one meal, without permanently altering the household's own eater profile.

### 5.6 The long-term check-in — a goal, tracked honestly over time

> **Sam:** how's the sleep goal going
>
> **Companion:** Three weeks in — magnesium-source foods have appeared in 9 of your meals, up from 3 the three weeks before you set the goal. Want to keep the current focus, or shift toward something else?
> **[Card] This month's Food Story** — Open Food Story
> **Next step:** Adjust goal · Keep going

*Why this works:* the progress statement is a count of food, never a claim about how Sam actually slept (Rule GO1 — the goal is an alias into the canonical chain, carrying no truth of its own about outcomes); the Companion offers, it never assumes the goal should continue (Rule LT2).

### 5.7 A child, framed only as discovery — never a score

> **Maya:** how's ivy doing with food this month
>
> **Companion:** Ivy tried 3 new plants this month — cucumber, sweetcorn, and butternut squash.
> **Next step:** Open Ivy's Food Story

*Why this works:* no count of "vegetables eaten," no goal, no body-level framing — variety and discovery only, exactly as FI1 §3.1 and NUT2 §3.4 require for any child eater, structurally, every time.

---

# SECTION 6 — THE HOUSEHOLD FOOD STORY & THE LONG-TERM JOURNEY

## 6.1 The shape of the Food Story artefact

The Food Story is the household's own record of its food life — never a report the household must remember to check, always a small, honest, optional read that's there when they want it.

```
YOUR FOOD STORY — this week

26 plants this week (4 short of 30) · a personal high for autumn
Oily fish: absent 3 weeks running → 1 tap to fix
Ivy tried 3 new plants this month
Sam's sleep goal: magnesium-source meals up from 3 → 9 over 3 weeks

One thing to try next week: a wholegrain side, twice.
```

Ninety seconds to read. Nothing in it is a score of a person; everything is a count of food (§4). Every line is honest — a genuine gap is stated as plainly as a genuine win, because hiding the gap would be the fabrication the whole architecture exists to prevent (FI1 Rule G1's spirit, extended to the story-telling layer).

## 6.2 The journey across a household's life with THA

| Stage | What the household experiences | What makes it feel earned, not generic |
|---|---|---|
| **Week 1** | The Companion asks nothing except what it needs to keep everyone safe (restrictions) and useful (a first goal, optional). The first Food Story is short and welcoming, not a cold blank slate. | Onboarding is itself food-scoped — no body metrics ever collected as a condition of starting (Rule T1, from day one). |
| **First month** | The household starts noticing the ambient strips are usually quiet — a sign the system is working, not idle. The first "fix this" moment lands, gets accepted, and the household sees their own action reflected back next week. | Silence-by-default (§2.3) makes the *rare* nudge feel earned rather than routine. |
| **First season** | The Food Story starts making seasonal comparisons ("more root vegetables than last autumn") — the first hint of a story longer than a week. | Longitudinal framing only becomes available once there's genuinely something to compare — never invented for effect (honest gaps over fabricated comparisons, Core Principle 6). |
| **A life change** (new baby, new diagnosis, new training goal, a household member moves out) | The household tells the Companion once, conversationally (§5.3); every surface updates from that single fact — no separate settings screens to hunt through. | One household-composition fact, one owner (Household capability), read everywhere else (FI1 §3.1) — the experience of "tell it once" is the direct payoff of the enrich-never-own architecture. |
| **Multi-year** | The Food Story can honestly say things like "your household's plant diversity has grown every autumn since you joined" — a claim only possible because the underlying counts have been real and consistent the whole time. | Nothing new architecturally — this is Plane 2 personal history (FI1 §4.2), simply given enough time to accumulate. |

## 6.3 What the long-term journey deliberately never becomes

- **Never a loyalty mechanic.** No streak-shaming, no "don't break your streak" pressure — streaks are stated as a fact, never leveraged as a hook (Rule LT2 — offers, never assumes; extended here to never manufacture urgency).
- **Never a body timeline.** The multi-year story tracks food — variety, gaps, streaks, goals-as-food-aliases — never weight, never symptoms, never outcomes (Rule T1, permanently).
- **Never irreversible.** At any point, the household can view, reset, or delete their personalisation history and goals (Plane 2 contamination rule, FI1 §4.2) — the story is theirs to keep or clear.

---

# SECTION 7 — THE MAGICAL MOMENTS

The moments below are the ones designed to make a household say *"no other food app does this."* Each is grounded in a real seam FI1 already names — the magic is in the restraint and the honesty, not in novelty for its own sake.

1. **The week that closes its own gap.** The Planner doesn't just tell Maya she's short on oily fish — it hands her two meals that already fit everyone, and one tap later, Thursday is sorted and the shopping list already knows why. *No other app connects "you're missing X" to "here, already done" in one motion, because most apps don't own the plan, the list, and the reasoning under one roof.*

2. **The swap that shows its work.** The yoghurt swap chip in Shopping doesn't say "choose better" — it shows the two numbers side by side and lets the household decide. *Trust, not persuasion, is the differentiator.*

3. **The boost that remembers what's already in the cupboard.** *Simply Better* never suggests an ingredient the household has to go buy specially unless it says so — "pairs with the oats you already buy" is the kind of small, specific truth that only comes from genuinely knowing this household's pantry.

4. **The honest boundary that still helps.** "We're all knackered" gets a warm redirect to a GP *and* real food help in the same breath — never a cold refusal, never a guess dressed as diagnosis (§5.4). Most consumer nutrition AI either overreaches into medical territory or refuses outright; THA does neither.

5. **The silence that means everything's fine.** A week where the ambient strip says nothing is not a bug — it's the product working. Most apps manufacture something to show; THA's confidence is proven by how often it has nothing to say.

6. **The shared meal that re-grounds itself for you.** A friend's Tuesday curry arrives already adapted to Ivy's dairy-free need — the sharer never had to think about the Reeves' household, and the Reeves never had to manually check (§3.6).

7. **The child who is only ever celebrated, never scored.** "Ivy tried 3 new plants this month" is structurally incapable of becoming "Ivy only ate 2 vegetables" — the framing is a property of the architecture (children get variety-only framing, FI1 §3.1), not a copywriting choice that could drift.

8. **The two-tap truth.** Every fact the household sees can unfold to its full citation chain — source, review date, the household fact that shaped it — in two taps, every time, with no exceptions and no "trust us." Radical, consistent explainability is rare enough to be memorable.

9. **The goal that answers with a count, not a verdict.** "Nine meals had a magnesium source, up from three" is a fact Sam can check against his own week. It never claims his sleep improved — and precisely because it never overclaims, it's the rare tracking feature people actually believe.

10. **The story that gets better simply by being lived in.** By year three, the Food Story can say something true and specific about *this* household's autumns that no template could have written — it earned that sentence one honest week at a time.

---

# SECTION 8 — SIMPLICITY AS THE ORGANISING CONSTRAINT

**"Confidently Choose Better. Simply."** is not a tagline layered on top of the experience — it is the test every scene in this document had to pass before it was included. Five rules keep the underlying four-plane engine (which is genuinely complex, FI1 §4) from ever leaking its complexity onto the household:

1. **One honest sentence before one card, before one verb.** Never facts first — always: what's true → what it means → what to do. (§3, throughout.)
2. **Silence is a valid, frequent, correct answer.** A quiet week is not a missed opportunity to say something — it is the intended steady state (§2.3, §7.5).
3. **Counting before judging, always.** THA states the count; the household supplies the judgement. "Third week without oily fish" — never "you're not eating well." (§4.)
4. **Provenance is always available, never imposed.** Two taps to the full chain; zero taps of it forced onto a summary line (Rule E1–E2, Companion Card Experience Principle).
5. **One verb per moment.** Every ambient insight offers exactly one clear next action, co-located with the surface where it's executed (§4) — never a menu of options that turns a decision into homework.

The underlying engine can grow arbitrarily sophisticated — more signals (FI1 §6), more personalisation (Plane 2), eventually prediction (FI1 §8 Phase 3) — without any of that sophistication being allowed to add a second sentence, a second card, or a second decision to what the household sees. **Depth is the engine's job. Simplicity is the experience's non-negotiable contract with the household.**

---

# SECTION 9 — PHASED EXPERIENCE ROADMAP

This roadmap describes **what the household notices**, phased against FI1's own build roadmap (FI1 §8) so the experience never promises ahead of what the architecture underneath can honestly support (Rule LT1 — no stage skips its predecessor's trust bar).

## AT LAUNCH — today, and what completes it (maps to FI1 Phase 0)

What a household can rely on right now or as the current build finishes:

- Companion conversations that discover Cookbook meals and household fit, in the Summary → Cards → Next Steps shape (§5.1, §5.2 — live pattern today per INT36/INT37/NUT1).
- Household restriction gating that is absolute and structural (Rule T0) — no meal, swap, or suggestion ever crosses a hard restriction.
- *Simply Better* boosts with a visible two-fact citation on the meal (Cookbook, §3.3).
- Honest, bounded redirects for out-of-scope health questions (§5.4 pattern) rather than either a guess or a cold refusal.
- Pantry Explore as the household's trustworthy knowledge encyclopedia (unchanged, foundational).

**What's honestly not yet there at launch:** ambient strips inside Planner/Shopping (§3.1–3.2), the Food Story as a longitudinal artefact (§6), goals-over-time tracking (§5.6), Community (§3.6), and any partner/signal integration (§3.7). These require the Food Intelligence Engine and Goals capability FI1 names as Phase 1 build work, not yet started (FI1 §13).

## MEDIUM TERM — the ambient layer arrives (maps to FI1 Phase 1–2)

What the household starts to notice as the Reasoning Engine, Goals capability, and Personalisation Event Log come online:

- The Planner and Shopping ambient strips go live (§3.1, §3.2) — quiet counts with one co-located verb, silence-by-default.
- Goals become a real per-person thread the Companion tracks honestly over weeks (§5.6).
- The Weekly Report evolves into the Food Story (§6.1) — still weekly, now genuinely personal rather than templated.
- Provenance unfold ships everywhere a fact appears, not just in select surfaces.
- S-0 self-reported signals (sleep, mood, energy — already captured in the diary today) enter the visible ambient reasoning for the first time (FI1 §6.1).

**Gate before this phase ships to households:** every ambient statement must decompose per the composition law (FI1 §4.5) in production, with zero uncited cards — verified by test, not by inspection (FI1 §8 Phase 1 gate).

## LONG TERM — the full companion and the wider household world (maps to FI1 Phase 3–4)

What becomes possible once Community, predictive reasoning, and consented external signals are built and gated:

- Community goes live with viewer-household re-grounding and the testimony firewall (§3.6, §7.6).
- The Companion begins to *offer* — never assume — predictive, seasonal, gap-aware suggestions ("you usually plan curry on Fridays — here's a plant boost"), always framed as a suggestion (Rule LT2).
- Wearable and, eventually, consented health-signal partners contribute context on the household's own terms (§3.7), always as one more visible, re-weightable signal — never a diagnosis (Rule S1).
- The multi-year Food Story becomes possible for THA's earliest households (§6.2), simply because enough honest years have accumulated.

**Gate before this phase ships to households:** proactivity restraint verified in real usage data; wearable integrations blocked on privacy review; Community blocked on moderation and claim-firewall review; any biomarker-adjacent signal blocked on the §6.4 legal gate in FI1 — engineering does not decide that boundary alone (FI1 §8 Phase 3–4 gates).

---

# SECTION 10 — WHAT THIS EXPERIENCE DELIBERATELY EXCLUDES, PERMANENTLY

Carried forward unchanged from FI1 (§5, §6.3) as experience-level promises, not just engineering constraints:

- No diagnosis, no supplement dosing, no illness prediction, no calorie-restriction or weight-loss prescription, at any phase, regardless of how rich the available signal becomes.
- No experience surface that presents a body metric, a symptom, or an outcome claim as a Food Intelligence fact (Rule T1).
- No experience surface for a child that includes a goal, a score, or a body-level framing — variety and discovery only, structurally, forever.
- No experience that manufactures urgency, streak pressure, or shame to drive engagement.
- No experience that shows an external URL, raw markdown, or provenance link inside a conversation — those stay on the canonical page, always (Companion Card Experience Principle firewall).

---

# SECTION 11 — ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□✓ One canonical identity
  Experience design only — no entity created. Every entity referenced in every
  scene (meal, eater, household, plan slot, shopping line, goal) keys on the
  identities FI1 already names as existing or as named future stores.

□✓ One owner per fact
  Every scene respects FI1's enrichment map (§3.1): Planner facts come from
  Planner's own service, Shopping from Shopping's, Household composition from
  Household's — Food Intelligence is never shown originating a fact it doesn't
  own in any scene in this document.

□✓ No duplicate entities
  No new entity is proposed. The Food Story, ambient strips, and Companion
  Cards described here are presentation shapes over existing/FI1-named data,
  not new stores.

□✓ No duplicate ownership
  Confirmed throughout §3 and §5 — every write in every conversation example
  flows through the owning domain's own registered capability intent (Planner
  write intent, Shopping write intent, Household capability), never a private
  Food Intelligence write path (Rule FI1).

□✓ No duplicate state
  Confirmed — no state is proposed in two places. The Food Story (§6) reads
  existing/named Plane 2 history; it does not introduce a second copy of it.

□✓ Extends existing architecture
  Every scene extends a pattern FI1 or a prior governing document already
  names: the Companion Card shape (Companion Card Experience Principle), the
  enrichment map (FI1 §3.1), the four-plane composition law (FI1 §4.5), the
  signal ladder (FI1 §6), the phased build roadmap (FI1 §8).

□✓ Progressive enrichment where appropriate
  Not applicable at the experience layer — this document proposes no schema.
  Where it references FI1-named future stores (Personalisation Event Log,
  Goals), it treats their enrichment shape as FI1 already specifies it.

□✓ Honest gaps over fabricated information
  The design law of §4 and the "what this is not" sections (§2.3, §10) make
  honest-gap framing a first-class requirement of every scene, not an
  afterthought — e.g. §5.2 states a meal's dairy conflict rather than hiding
  it, §6.1's Food Story states a genuine gap as plainly as a genuine win.

□✓ No permanent synchronisation bridge
  No bridge is proposed. Every ambient surface reads its owning domain live
  at request time, per FI1's enrichment map — nothing is described as cached
  or duplicated across surfaces.

□✓ Evolution over replacement
  Nothing in this document replaces an existing surface. Planner, Shopping,
  Cookbook, and Pantry keep their existing jobs and ownership throughout;
  intelligence is described as riding inside them, never beside or instead
  of them.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform — every Companion scene in §5 is
  the one existing Gateway/Conversation Gateway, never a second assistant
✓ Uses the Capability Registry — every write action in every scene names the
  owning domain's registered capability, never a bypass
✓ Uses the Intent Engine — all actions in conversation examples are intents
  ("add to planner", "update profile"), not free-form mutation
✓ Reuses existing business services — Planner, Shopping, Cookbook, Household,
  Pantry keep their existing service ownership in every scene
✓ Does not create another assistant — Community, partner, and wearable
  scenes (§3.6–3.7) are explicitly described as edge adapters to the one
  Gateway, per FI1 §7.1
✓ Does not duplicate conversation state — no scene proposes a second
  conversation store or a per-domain chat history
✓ Uses registered capabilities only — confirmed throughout §3, §5
✓ Uses permission-aware access — consent-gated signal scenes (§3.7) are
  explicitly described as opt-in per FI1's signal ladder (§6.1)
✓ Produces honest gaps rather than fabricated knowledge — §4, §5.2, §5.3,
  §6.1 all state gaps/conflicts plainly rather than smoothing them over
```

**If any check had failed, this document would stop and flag it rather than proceed — none did.**

---

# SECTION 12 — DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence Experience (vision-level; touches Planner,
                 Shopping, Cookbook (Meals), Pantry, Household, Companion/
                 Intelligence Platform, plus the future Community and Signals
                 Gateway capabilities FI1 names but does not build)
Declared SoT: unchanged for every existing domain (per SoT Register); this
              document reads and narrates FI1's declared ownership, it does
              not redeclare any of it
New store created? NO (by this document). No store is proposed here beyond
  the four FI1 already names for future build (Personalisation Event Log,
  Goals, Signals Gateway summaries, Community shares) — each remains FI1's
  responsibility to govern at creation, not this document's
Existing store extended? NO
Consumer created? NO
```

---

# SECTION 13 — ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence Experience (the presentation/UX layer over the Food
  Intelligence Domain Intelligence layer defined in FI1)

Current Canonical Owner:
  This document creates no owner and changes none. The Food Intelligence
  domain's canonical owner remains exactly as FI1 §13 states: Food Knowledge
  Registry (shared/knowledge/ -> knowledge_* tables) for knowledge; per-SoT-
  Register owners for every transactional Business Domain (Planner, Shopping,
  Pantry, Meals, Household, Diary).

Current Runtime Consumer(s):
  Unchanged from FI1 §13: Food Report, Pantry Explore, Weekly Nutrition
  Report, Nutrition Centre (WX8), Simply Better, Intelligence Platform
  nutrition-knowledge binding + NUT1 Companion enrichment, meal/food
  intelligence assemblers. This document narrates a future experience over
  these consumers; it adds none.

Duplicate Owners Remaining:
  Unchanged from FI1 §13 (inherited, this document does not touch them):
  - client/src/lib/nutrition-benefit-library.ts (M1 pending)
  - client/src/lib/pantry-knowledge.ts (M2 pending)
  - client/src/lib/nutrition-variety.ts (M4 pending)

Duplicate State Remaining:
  None introduced by this document. FI1's inherited note stands unchanged:
  users.dietPattern/dietRestrictions vs household_eaters overlap (SoT
  Register contested item 4).

Duplicate Workflows Remaining:
  None introduced by this document.

Current Convergence (%):
  Unchanged from FI1 §13: ~60% at the Business Domain / Food Knowledge layer
  (inherited from the SoT Register). 0% Domain Intelligence layer build-out
  (by design — FI1 is governance-only and this document is experience-vision-
  only; neither has built the Food Intelligence Engine, Goals capability,
  Personalisation Event Log, Signals Gateway, or Community capability that
  the experience in §3, §5, §6 depends on for its medium- and long-term
  phases). This document changes neither number — it documents the
  experience those numbers will eventually support.

Target Convergence (%):
  This document changes nothing and sets no new target. It reaffirms FI1's
  own gate: 100% Business Domain / Plane 1 convergence (Phase 0) before any
  Phase 1+ Food Intelligence Engine build work begins — and, by extension,
  before any "Medium Term" experience in §9 of this document can honestly
  ship to households.

Next Planned Milestone:
  Unchanged from FI1: M1 (retire nutrition-benefit-library.ts), then M2, M4;
  Phase 0 of FI1 §8 is the umbrella; the Food Intelligence Engine (FI1 Phase
  1) is the prerequisite for this document's "Medium Term" phase (§9).

Remaining Architectural Risks:
  Unchanged from FI1 §13, plus one experience-specific addition: the risk
  that this document's launch-phase scenes (§9) are read as already fully
  live when several (ambient strips, Food Story, goals-over-time) explicitly
  are not — mitigated by §9's explicit "what's honestly not yet there at
  launch" callout.
```

---

# SECTION 14 — DEFINITION OF DONE

- **What success looks like:** a single canonical experience-design document exists that (1) describes the future-state Food Intelligence experience end-to-end from the household's point of view, unconstrained by current implementation, (2) shows Food Intelligence becoming ambient across Planner, Shopping, Cookbook, Pantry, Companion, Community, and future partner integrations (§3), (3) demonstrates the decisions-not-data design law with concrete before/after contrasts (§4), (4) defines ideal Companion conversations for common household scenarios grounded in the governing trust rules (§5), (5) designs the household Food Story and long-term journey (§6), (6) names the differentiating magical moments (§7), (7) states the simplicity contract that keeps the experience trustworthy as the engine grows (§8), and (8) sequences the experience into launch / medium-term / long-term, each gated against FI1's own build roadmap so nothing is promised ahead of what the architecture can honestly support (§9). Future experience workstreams (ambient strip implementation, Goals UI, Food Story build, Community UX) can each cite this document as their governing experience vision, alongside FI1 as their governing architecture.
- **What must not break:** nothing can — no code, schema, route, or data was touched. Verified: this task's only write is this file.
- **Manual test steps:** `git status` shows exactly one new file under `docs/investigations/`; rollback tag exists (`git tag -l 'rollback/before-fi2*'`); no other file differs from pre-task state.

# SECTION 15 — DATA IMPACT

- Reads existing data: **NO** (documentation reads only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

# SECTION 16 — TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. Every scene in this document is written to be honest about what is live today versus future (§9 states this explicitly per phase), and every conversation example (§5) obeys the trust rules (T0–T2, G1, E1–E2, GO1–GO2, LT1–LT3, S1, FI1) rather than inventing new ones.
- **Could this fabricate certainty?** No. Forward-looking scenes (Community, §3.6; partner integrations, §3.7; multi-year Food Story, §6.2) are explicitly labelled as not-yet-built and gated against FI1's own phase gates (§9).
- **Is anything guessed but shown as real?** No. Every architectural claim used as a constraint (the four-plane model, the trust rules, the enrichment map, the signal ladder) is cited directly from `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; nothing about the current build state is overstated (§9's launch section is explicit about what is and is not live today).
- **What happens if the system is wrong?** If this experience vision proves wrong in practice, it is corrected by a successor document, exactly as this document sits alongside (not above) FI1. Nothing here is irreversible; nothing here is code.
- No architectural duplication introduced: **YES** (none — no code, no new entity)
- No new source of truth created: **YES** (none — this document narrates FI1-named future stores, it does not create or redeclare any)
- No runtime behaviour altered (governance-only work): **YES**

# SECTION 17 — ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-fi2-future-state-food-intelligence-experience-20260703` → `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` |
| Files modified | None. One file created: `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` |
| Rollback commands | `rm docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` (or `git rm` + commit after the doc commit) |
| Verification after rollback | `git status` clean of this file; tag may be deleted with `git tag -d rollback/before-fi2-future-state-food-intelligence-experience-20260703` |

# SECTION 18 — SCOPE LOCK

- **Implemented scope:** exactly the EWO-FI2 brief — the future-state Food Intelligence experience design, governed by FI1: ambient presence across Planner, Shopping, Cookbook, Pantry, Companion, Community and future partner integrations (§3); everyday-decision framing over isolated nutrition information (§4); ideal Companion conversations for common household scenarios (§5); the household Food Story and long-term journey (§6); the differentiating magical moments (§7); simplicity as the organising constraint (§8); a phased experience roadmap — launch, medium-term, long-term (§9). One document, no code.
- **Explicitly excluded (out of scope — not implemented):** any implementation of the ambient strips, Food Story build, Goals UI, Community capability, Signals Gateway, or any Companion conversation flow shown in §5; any schema, route, capability, or registry change; any change to FI1, the Master Evolution Roadmap, or the SoT Register (all referenced, none edited); any decision on regulatory classification for signal integrations (deferred to FI1 §6.4, which flags it for legal, not engineering, and not this document).
- **Suggestions (out of scope — do not implement without approval):**
  1. When Phase 1 build work begins (FI1 §8), the ambient-strip copy patterns in §3.1–3.2 and the Companion conversation patterns in §5 are strong candidates for a shared "conversation and copy pattern library" so every surface that adopts the Food Intelligence Engine reuses the same voice rather than each team inventing its own.
  2. The magical-moments list (§7) is a natural input to future marketing/positioning work, but that use is explicitly outside this document's engineering scope and should go through its own review before any external claim is made from it.
  3. Before the "Medium Term" phase (§9) begins implementation, a dedicated capability card (per the existing INT-style pattern) should precede any Goals capability or ambient-strip binding work, consistent with FI1 §7.2's own "each a future EWO" framing.

---

*Investigation only. No code was changed in the production of this document.*
*Rollback: `rollback/before-fi2-future-state-food-intelligence-experience-20260703` → `8ae0f7e`.*
