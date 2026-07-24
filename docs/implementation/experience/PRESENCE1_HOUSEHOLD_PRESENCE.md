# PRESENCE1 — Household Presence

**Type:** Presence programme. Implementation record.
**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/PRESENCE1-household-presence-20260720` → `3d5500c29bf62805f1567a6442b5516cf7384ae5`
**Governed by:** `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (the Experience Constitution), and through it the Experience Governance canon.
**Written against:** `docs/investigations/experience/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md`

---

## 1. What this is

The house is built, lit, and honestly constructed. `EXPREVIEW1` walked it for a day and reached one sentence that this programme exists to answer:

> **The house is built and lit. It is not yet inhabited.**

This is not a redesign. It creates no room, no route, no capability, no entity, no permission, and no schema. It changes **no business logic, no canonical ownership, no permission, and no AI architecture.** Every change is at the presentation layer, and the great majority of them are **subtractions**.

The objective was not to add features. It was to make the house feel as though it has quietly been paying attention to the household — and the finding, stated once and plainly, is that **the reason it did not feel that way was not that THA had noticed nothing. It was that the space where noticing belongs was fully occupied by scoring.**

Every room was asked one question:

> *What would somebody who genuinely cared about this family notice?*

Somebody who cared would not open with a progress bar. They would not name, on a weekly schedule, the three things a family had failed to eat. They would not ask a tired parent to rate their mood out of five apples on the page where they record what they fed their children. And where they had nothing worth saying, they would say nothing.

### 1.1 The shape of the change, stated honestly up front

**This programme is 90% removal.** That deserves defending rather than apologising for, because a Presence programme that mostly deletes things looks, at a glance, like a programme that did not do its job.

`EXPREVIEW1` § "Joy and delight" is the argument:

> The product has built the entire apparatus of gamified motivation — targets, bars, tiers, praise, coverage checklists — and has built **none** of the quiet accuracy its own Constitution names as the only joy it wants.

The apparatus was not sitting *beside* the noticing. It was sitting *in its place*. `39/30` was what Nutrition said instead of a fact about this family's week; *"brilliant variety"* was what a room said instead of the Companion saying something true. Removing them is not clearing the ground for presence to be built later — for the surfaces below, **removing them is the presence**, because what was underneath was always the household's own life, with a verdict laid over it.

Where genuine noticing needed to be *added*, this programme deliberately did not invent it. See § 6.

---

## 2. The Experience Constitution Check (§ 18.2), answered before design

**✓ HOSPITALITY (§ 3.1).** No trade was required. Every removal here costs the household nothing they wanted and returns something efficiency cannot buy. The one place hospitality and information genuinely competed — Home's unanchored-planner sentence — was settled for hospitality: the fact is kept, its placement moved off the greeting.

**✓ OUTCOME (§ 3.5).** Principally **3 — less guilt**, and secondarily **1 — less on their mind**. This programme removes, from a household's ordinary week: a target they never set, four progress indicators toward it, three empty circles naming what their family did not eat, a completion state on their dinners, a compliment from a room with no speaker, a verdict on their activity level, a red number on their body, and the product's own emblem as the unit of their mood. `EXPREVIEW1` names the person this is for — *"a parent, tired, at six o'clock, already carrying some quiet guilt about the last three days of dinners"* — and every item above was a small daily judgement delivered to them.

**✓ WEIGHT (GEA2).** Every room this touches is **lighter**. No panel, badge or strip was added anywhere. Two surfaces (the Planner strip, the Nutrition tracker) lost content and gained nothing.

**✓ VOICE (GEA8/GEA9).** This is the programme's spine. Four authored coaching voices were removed from rooms — the Planner's advisory pill ticker, the Diary's UPF banner, Nutrition's *"brilliant variety"*, and Nutrition's *"Ideas to Broaden Your Week"*. Rooms now report; interpretation, encouragement and advice are the Companion's, which composes from the same facts at the moment it speaks.

**✓ RESTRAINT (§ 9 / § 13 / § 15).** Nothing scores, streaks, ranks or rewards after this change (GEA13). Home says nothing where it previously apologised (GEA15). No surplus space was filled.

**✓ LAYER (GEA20).** Every change sits at **Implementation**. It originates no law. Each realises a rule already owned above it — GEA13, GEA8, GEA9, GEA12, GEA15, GEA17, GEA18 — and § 11.2 of the Constitution for the identity findings. **Nothing durable was discovered that needed writing up to a governing owner**; every defect fixed here was already forbidden in writing before it was built, which is itself the finding of § 3.

---

## 3. The finding, stated as a number

`EXPREVIEW1` recorded that the house grades the household. The audit behind this programme counted it.

**Nineteen distinct judgement surfaces across eight rooms.** Not one of them was permitted by the governing architecture on the day it was written.

| | Judgement | Where | Rule it broke |
|---|---|---|---|
| 1 | `39 / 30` plants + progress bar | Nutrition summary tile | GEA13 |
| 2 | `39 / 30` plants + second progress bar | Nutrition "30 Plants This Week" | GEA13 |
| 3 | `6 / 9` categories "covered" | Nutrition summary tile | GEA13 |
| 4 | *"You've hit 30 plants this week — brilliant variety."* | Nutrition | GEA8, GEA13 |
| 5 | *"N more plants to reach 30"* / *"N plants still to go"* | Nutrition | GEA13 (deficit) |
| 6 | Three unticked circles: Seeds, Nuts, Fermented Foods | Nutrition | GEA13 (manufactured deficit) |
| 7 | Colour ramp grading the plant count (emerald→teal→amber) | Nutrition ×3 | GEA10 |
| 8 | *"Ideas to Broaden Your Week"* — authored suggestions | Nutrition | GEA8, GEA9 |
| 9 | `/30` hardcoded, unclamped | Planner strip | GEA13 |
| 10 | Truncated advisory pills (*"Looking ahead to autumn, you may…"*) | Planner strip | GEA8, GEA9 |
| 11 | `14 / 28 meals planned` | Planner header | GEA13 |
| 12 | Progress ring toward the target | Home | GEA13 |
| 13 | `plantCount / 30` | Home | GEA13 |
| 14 | *"Want to eat less processed food? Awareness beats restriction."* | Diary | GEA8, GEA9 |
| 15 | Five-apple **Mood** picker | Diary + Dashboard | GEA12, § 11.2 |
| 16 | Five-apple **Energy** picker | Diary + Dashboard | GEA12, § 11.2 |
| 17 | BMI traffic light (green / amber / **red**) | Diary + Profile | GEA10 |
| 18 | *"Optimal"* / *"Could improve"* on Activity | Diary + Profile | GEA8, GEA13 |
| 19 | THA mark + "THA" on the household's own card | Profile | GEA12 |

Three of these are worth naming individually, because each is worse than a rule violation.

**The mood apple (15, 16) is the sharpest.** `EXPREVIEW1` reached it and wrote *"this is the moment I would have closed the product if I were the household it is aimed at."* The mark on the door was the unit in which a household scored how they felt. Worse, and undiscovered by the review: the read-back delegated to `AppleRating`, whose accessible name is `"THA Score: N out of 5"` — so **a screen reader announced a household's mood as a THA food-processing score.**

**"Target aligned" (18's sibling) could not come out the other way.** It rendered green whenever a calorie figure existed. A verdict with only one possible value is not information; it is reassurance shaped like a finding.

**The activity level was fabricated.** `activityLevel` fell through to `"Moderate"` when it was **unset**, so the card stated an activity level for households who had never given one — a presentation layer inventing a fact (GEA17, Core Principle 6).

---

## 4. What changed, room by room

### 4.1 Nutrition — *the room that graded the week*

`client/src/components/PlantDiversityReport.tsx`

**Removed:** both progress bars; both `/ 30` denominators; the `6 / 9` "covered" denominator; all three colour ramps grading the count; the praise sentence; both deficit sentences; the nine-row coverage checklist's **unticked** circles; and the entire `BroadenYourWeek` panel with its `CATEGORY_SUGGESTIONS` table.

**Kept:** the three counts — plants, ingredients, plant categories — each stated plainly with "this week" beneath it. The category list now shows **what the household's week actually contained**, and renders nothing when it contained nothing.

**Why it feels more inhabited:** the room used to answer *"how did this family do?"* It now answers *"what did this family eat?"* The first is a verdict and only THA could hold an opinion about it; the second is the household's own life, handed back to them. GEA13's test settles it — three unticked circles labelled Seeds, Nuts and Fermented Foods do not measure food, they grade a week.

**The strongest single signal:** this file **no longer imports `WEEKLY_PLANT_TARGET` at all.** The Nutrition room now holds no number to measure a family against. The constant remains the single canonical owner of the target for consumers that legitimately reason about it — the room is simply no longer one of them.

`BroadenYourWeek` was retired rather than hidden (GEA18). It took the categories a household had *not* eaten and advised them, in the room's own voice, what to add — authored advice, written before this household existed, structurally incapable of detecting it had become wrong.

### 4.2 The Planner — *the room that made a family feel behind*

`client/src/components/PlannerIntelligenceStrip.tsx`, `client/src/pages/weekly-planner-page.tsx`

**Removed:** the advisory pill row and the `truncate()` helper that served it; the hardcoded `/30`; and the `14/28` completion state, along with the `total` it was computed from.

**The discovery here is a governance one.** `UX3` ruled on 2026-07-19 that *the Companion owns the coaching*, and removed the interpretation grid from this strip's **expanded panel** — leaving a comment in the code saying so. It missed the **compact row**. So the four advisory producers kept rendering, cut at 36 characters, and the code comment justifying the truncation (*"the full text is always available from the expanded panel below"*) had been made **false by the very change that was supposed to retire them.** A household could not finish reading advice they had not asked for, from a speaker the room does not have. PRESENCE1 finishes `UX3`.

A second consequence: the "Insights" toggle opened on the presence of those four fields, so a household could press it and be shown an **empty drawer**. The affordance now names only what the panel actually contains.

**Why it feels more inhabited:** `EXPREVIEW1` recorded the Planner's emotional result as *"Behind. Which is the precise emotion this product exists to remove."* Both mechanisms producing that are gone. The count of meals a household **has** planned is a fact they asked for and it stays; the target it was measured against does not.

### 4.3 The Diary — *the room where the household is most exposed*

`client/src/pages/food-diary-page.tsx`, `client/src/pages/dashboard.tsx`, `client/src/components/nutrition-insights-panel.tsx`

**Removed:** the UPF coaching banner; the five "Empty" labels; the "+ CSV" label; the orphaned *"I want to support…"* fragment.

**Replaced:** `ThaAppleScorePicker` → `HowYouFeltScale`. **The stored value, its 1–5 range, and the `moodApples` / `energyApples` fields are all untouched** — the household's record of their own day is theirs, and this programme does not touch business logic. Only the *instrument* changed: an unbranded row of marks, labelled in words (*Low · Quiet · Steady · Good · Bright*) rather than numbers, because "3 of 5" is a score and "steady" is a day. The read-back no longer announces a person's mood as a THA food score.

The dashboard carried a **second, inline copy** of the same five-apple scale. It now uses the one owner (GEA18) — the duplicate is retired, not left beside its replacement.

The UPF banner was not simply deleted. Removing it left `UPFInfoModal` with **zero importers anywhere in the client** — so PRESENCE1 rehomed it to the Profile's "UPF Preference" row, where a household has already opened the question themselves. Same explanation, opposite posture: **pulled, not pushed.**

**Why it feels more inhabited:** a diary with five rows saying *Empty* is a form reproaching you for not filling it in. A diary with five quiet rows is a book you have not written in yet. Same state, opposite meaning — which is precisely § 15.1's distinction between silence as absence and silence as restraint.

### 4.4 Home — *the room that apologised on arrival*

`client/src/pages/home-experience-page.tsx`

**Removed:** the progress ring's arc and `plantPct`; the `/ 30` denominator; the duplicate "View planner" door; and the unanchored-planner sentence **from the greeting position**.

**Rewritten:** the Meals card's explanation, from THA's bookkeeping language into the household's.

This is the most delicate change in the programme and it deserves precision. The unanchored-planner honesty is **hard-won** — it is the output of `CONV1 P8`, it is correct, and `EXPREVIEW1` explicitly defends it: *"the honesty is not the defect."* Nothing about that honesty was weakened here. What changed is **placement**. *"Your planner isn't linked to the calendar yet."* was the first sentence under *"Today at a glance"*, on the emotional centre of the house, on a household's first morning — a technical fact about THA's own record-keeping made into the room's greeting. It handed a guest a worry they did not arrive with: *what is a calendar link, and have I done something wrong?* Home now says nothing there (GEA15), and the Meals card still explains the situation in the one place where it bears on what the household sees.

The duplicate door is worth noting because of who it affected: `ViewLink` rendered **unconditionally**, so in the unanchored state — which the code's own comments record as the ordinary state for **192 of 195 households** — *"Open the planner ›"* and *"View planner ›"* stood stacked six pixels apart on the most looked-at card in the product.

### 4.5 Profile — *the page about the family, decorated with the product*

`client/src/pages/profile-page.tsx`

**Removed:** the THA apple mark and the letters "THA" from the household's own card; the BMI traffic light; the unconditional green *"Target aligned"*; the *"Optimal"* / *"Could improve"* verdict; and the fabricated *"Moderate"* default.

The mark sat in the trailing slot of the card about the family, doing nothing, and announced *"The Healthy Apples"* to a screen reader inside a person's own identity card. That is the product decorating with itself on the one page whose whole subject is the household (GEA12, § 3.4). The space is now air (GEA11) — a room that wants warmth wants light, not a logo.

BMI's **category** is kept, uncoloured: it is a published clinical classification of a number the household entered, not THA's opinion of them. The **colour** was the opinion, and a red number on a person's body is the house passing judgement in light (GEA10).

### 4.6 Shopping and the Analyser — *the machine showing through*

`client/src/pages/shopping-workspace-page.tsx`, `client/src/pages/products-page.tsx`

Shopping is, by `EXPREVIEW1`'s account, one of the two best rooms in the house — and its single sentence was *"Full product database also available in the Analyser."* The builders' language, stranded under a family's handwritten note. The door is genuinely useful and is kept; it now says what a person would say.

The Analyser's first-run card named **"NOVA group"** unglossed, on the household's literal first screen in the room, where somebody may be standing in an aisle holding a packet. The fact is kept and said in words: *how processed it is*.

**The Analyser's five-apple rating filter was deliberately left alone.** See § 5.

---

## 5. What this deliberately did NOT do

**The Analyser's apple rating is not a defect and was not touched.** GEA13 explicitly permits *"stating a rating with an explicit, published basis where the subject is a **product**, not the household."* An apple on a jar of sauce is information. The same glyph on a family's mood was the violation, and that is the one that was removed. `EXPREVIEW1` counted four meanings for the apple in one session; this programme removes two of them (the mood scale, the Profile decoration), leaving the mark with its sanctioned meanings.

**No business logic, ownership, permission, schema or AI architecture changed.** No server file was modified. No stored value changed meaning. `WEEKLY_PLANT_TARGET` remains the single canonical owner of the target; this programme removed *consumers* of it, never the fact.

**No observation engine was built, and no "I noticed…" sentence was authored.** This is the most important restraint in the programme and § 6 explains it.

**The Cookbook was not touched.** `EXPREVIEW1`'s single most transformative recommendation — *fill the house with the household's own food, photographed, and delete the five hundred generated suggestions* — is a content and product decision of a different order from a presentation change, and is recorded in § 7 as owner decision 1.

---

## 6. The thing that was hardest, and why silence won

The brief asked for quiet evidence that THA has been paying attention: *"I noticed you've been cooking with lentils more often."* *"You've bought broccoli three weeks in a row."*

**THA already produces sentences of exactly this kind, and they are good.** `shared/stories/engine.ts` derives, from a household's own eating history, headlines including:

> *"Chickpeas became a household favourite."*
> *"Lentils quietly appeared in more and more meals."*
> *"You explored whole grains: oats, then barley, then farro."*

These are data-borne, non-fabricated, trust-gated, and they are the raw material of the Presence Layer. The Planner strip was, until this change, **truncating them to 36 characters** and mixing them into a ticker with seasonal advice.

It would have been easy, and it would have looked impressive, to surface one of these in a room and declare the Presence Layer built. **This programme deliberately did not**, for three reasons:

1. **GEA8.** A household's eating history is not the Planner's fact, nor Nutrition's. Placing a story about a family's past in a room makes the room speak about the household in a register the room does not own — which is the exact defect this programme spent the rest of its effort removing. Doing it in the same change would have been incoherent.
2. **GEA15.** Where these sentences belong is a question about *when THA should speak at all*, and the default is silence. Choosing to open a room with an observation is a decision about the household's attention, and that decision is above an implementation's authority.
3. **The brief's own instruction.** *"If nothing meaningful has been noticed, say nothing. Silence is better than invention."* The honest position after this audit is that the space for noticing is now **empty and clean**, rather than occupied by scores. Filling it is the next decision, and it is the owner's.

So the deliverable is: **the counterfeit is gone, the genuine article exists and is verified to exist, and where it should be spoken is owner decision 2.**

---

## 7. Verification

### 7.1 Walking every room

Every room was walked and the question — *what would somebody who genuinely cared notice?* — asked of each.

| Room | What changed | Why it feels more inhabited | How the household becomes the subject |
|---|---|---|---|
| **Doorstep** | Nothing (see § 7.3) | — | — |
| **Arrival** | Nothing | — | — |
| **Home** | Apology moved off the greeting; ring arc, target and duplicate door removed | A guest is welcomed, not handed three notes about what is missing | Home shows the family's day, not THA's bookkeeping status |
| **Planner** | Advisory ticker, `/30`, `14/28` removed | The room stops making a family feel behind before they have done anything | The week is theirs to fill, not a form to complete |
| **Cookbook** | Nothing (owner decision 1) | — | — |
| **Pantry** | Nothing (see § 7.3) | — | — |
| **Shopping** | Footnote rewritten into household language | The best-judged room stops ending on a database reference | The note is the family's; the door is offered, not announced |
| **Nutrition** | 8 of the 19 judgements removed | The room reports the week instead of grading it | *What did this family eat* replaces *how did this family do* |
| **Diary** | Coaching banner, mood/energy apples, "Empty" ×5, verdicts, traffic light removed | The most exposed room stops assessing the person in it | Their record of their own day, in their own words, unbranded |
| **Orchard** | Nothing (see § 7.3) | — | — |
| **Analyser** | Jargon glossed | First contact stops naming a classification nobody has heard of | The answer is for the person in the aisle |
| **Profile** | Mark, traffic light, verdicts, fabricated default removed | The page about the family stops being decorated with the product | The household's card holds the household, and nothing else |

**Net across the house: 19 judgement surfaces removed, 0 added. 4 authored coaching voices removed, 0 added. 2 duplicate owners retired. 1 fabricated fact removed. 0 features added.**

### 7.2 Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | **88 errors, all pre-existing, all in `server/`.** This programme touched only `client/` and adds **zero** type errors. |
| `npm run build` | **PASS** — 3291 modules transformed, client bundle built clean. |
| `npm run adoption:check` | **99 passed · 9 failed — identical to the pre-change baseline**, verified by stashing the change and re-running. See § 7.2.1. |
| `npm run verify:coherence` | **2 failed — both pre-existing**, verified by stash, both in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, unrelated to this work. |
| `test:nut-verify1` | **55 passed, 0 failed** |
| `test:stories-engine` | **PASS** — all worked examples, gates and trust checks |
| `test:home2-home-primary-action` | **47 passed, 0 failed** |
| `test:household-nutrition` | **54 passed, 0 failed** |
| `test:time3-p8-t5-convergence` | **60 passed, 0 failed** |

The full `npm test` suite is entirely server-side and was not run in full. Every test file matching a string this programme changed was inspected: **all matches are coincidental server-side Companion strings** (e.g. *"Wednesday has no meals planned yet"*), and none asserts on a client surface touched here.

#### 7.2.1 The gate this change broke, and how it was closed

The adoption gate caught a genuine consequence: replacing the five-apple mood pickers removed **both** consumers of `client/src/components/icons/ThaAppleIcon.tsx`, leaving it authored-but-unadopted — the exact failure state UIA § 17 exists to end.

It was **not** silently left. It is recorded in `adoption-register.json` and `ADOPTION_REGISTER.md` as a **defect, not an exemption**, per that section's own doctrine, with its cause named and the owner decision stated. PRESENCE1 did not delete it, because retiring a brand-mark component is an owner's call and not an implementation's (owner decision 3).

Verified at the moment of recording: the mark's two sanctioned uses are unaffected and **neither passes through this component** — product ratings go via `AppleRating`, identity positions via the `tha-apple.png` asset directly. A repo-wide search confirms zero remaining references.

### 7.3 What verification could NOT establish

Stated plainly, because this programme's subject is a *feeling* and no gate measures one.

- **Nothing here was seen rendered.** No screenshots were taken. Every claim about how a room now feels is reasoned from the code and from `EXPREVIEW1`'s captures of the *previous* state.
- **The mobile experience is unverified**, and `EXPREVIEW1` § 0 records that the last photograph of it predates three experience workstreams. A household lives in this product at 390px.
- **Dark mode is unverified.** The removed colour ramps had dark-mode variants; the plain foreground colours that replaced them are theme tokens, but this was not seen.
- **Four rooms were not changed at all** — Doorstep, Pantry, Orchard, Cookbook. Their `EXPREVIEW1` findings are real and remain open. Three of them are composition and content problems rather than judgement problems, which put them outside this programme's remit; the Cookbook is owner decision 1.
- **Whether the house now feels inhabited is not established by this change.** What is established is that it has stopped feeling like it is assessing you. Those are different achievements, and § 6 is the honest account of the distance between them.

---

## 8. Remaining Presence decisions requiring owner approval

Five, in the order they matter.

### Decision 1 — The Cookbook: five hundred generated rice bowls

**Not addressed by this programme, and it is `EXPREVIEW1`'s single highest-value finding.** The room contains 500 combinatorially generated titles — one ending in the digit `2` because the generator collided with itself — and **not one photograph of food**. The review's verdict: *"Everything else in this review is recoverable. A household reaching Rice Bowl 2 stops believing the house."*

The recommendation was to replace them with a small, real, photographed collection. That is a **content and product decision**, not a presentation change, and it is the one change most likely to make the house feel inhabited, because it fills a room with food instead of with output.

**It also completes this programme's argument.** The review noted: *"Most of the gamification in this house exists because the rooms have nothing real to show and a number is the cheapest thing to put in an empty room."* PRESENCE1 removed the numbers. **The rooms are now quieter, and in the Cookbook's case emptier — and what fills them should be the household's food.**

**Owner decision:** approve a curated, photographed collection and the retirement of the generated set.

### Decision 2 — Where the noticing should be spoken

§ 6 is the substance. THA already derives true, trust-gated observations about a household from their own history (`shared/stories/engine.ts`). This programme cleared the space they belong in and deliberately did not fill it.

**Owner decision:** where should a household meet these?
- **(a) The Companion, and only the Companion** — the strict GEA8 reading, and this programme's recommendation. The advice already has an owner; the noticing should have the same one. It also answers `EXPREVIEW1`'s finding 3: *"The advice is everywhere and the adviser is nowhere."*
- **(b) A room, in the room's factual register** — permitted by GEA7.2 only if presented as a property of the household's data rather than an opinion, and requires deciding which room owns a fact about eating history.
- **(c) Not yet** — silence remains, until the Companion introduces itself.

### Decision 3 — `ThaAppleIcon.tsx`

Orphaned by this change (§ 7.2.1), recorded as a defect, deliberately not deleted. Its only consumers were misuses of the mark.

**Owner decision:** delete it, or adopt it for identity positions.

### Decision 4 — The invited nutrient-support widget

The *"I want to support…"* fragment in the Diary was rewritten into a complete invitation, and the **mechanism left standing** — it is opened by the household, can be closed, and states plainly that its contents are suggestions rather than a recommendation. That makes it materially different from the banner removed beside it.

But it is still a room offering food suggestions, and GEA8 admits no *invited-advice* exception.

**Owner decision:** does invited suggestion belong in a room, or should the door hand off to the Companion?

### Decision 5 — The Companion has still never introduced itself

Outside this programme's scope and named here because every decision above routes into it. `EXPREVIEW1`: *"A small green circle with an apple in it, bottom right, in every room. It never introduced itself. It never said anything."*

PRESENCE1 has now removed four coaching voices from rooms on the principle that **the Companion owns interpretation**. That principle is correct and it is now load-bearing: the house has been made quieter on the promise that the one voice will speak. **If the Companion stays silent, this programme has removed advice and replaced it with nothing** — which is a better failure than being judged daily, but it is not the goal.

**Owner decision:** approve the Companion's introduction as the next workstream. It is the keystone the rest of the Presence Layer rests on.

---

## 9. Rollback

```
rollback/PRESENCE1-household-presence-20260720 → 3d5500c29bf62805f1567a6442b5516cf7384ae5
```

**The working tree was NOT clean at tag time**, and the tag does not cover:

- `.engineering/session/CURRENT.md` — modified (the session dashboard's automated heartbeat line).
- `docs/investigations/experience/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md` — untracked at tag time; this programme's source document, committed as part of this change.

No other uncommitted work existed. Rolling back returns committed state only; neither file above is restored by it.

**Nothing was deleted from disk by this programme.** Two components were removed from the tree as source (`BroadenYourWeek`, `truncate`) and both are recoverable from history; `ThaAppleIcon.tsx` is intact on disk and recorded.

---

*PRESENCE1 removed nineteen judgements, four coaching voices, two duplicate owners and one fabricated fact from eight rooms, and added no feature. It changed no business logic, no canonical ownership, no permission and no AI architecture. The house is no longer assessing the household. Whether it has begun to notice them is decision 2, and it belongs to the owner.*
