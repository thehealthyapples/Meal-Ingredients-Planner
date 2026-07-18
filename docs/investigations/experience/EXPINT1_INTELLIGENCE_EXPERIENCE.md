# EXPINT1 — The Intelligence Experience — Design Investigation

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Design investigation only. **No code, schema, route, capability, or architecture change.** Authors this document.
**Risk:** 🟢 GREEN (design only; changes no runtime behaviour and no governing document)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/EXPINT1-intelligence-experience-20260717` → `7bfad50c` |
| Working tree | **Intentionally dirty — not this session's product code.** Uncommitted work from sibling sessions (NORTH, CONV1, INT19) was present at session start and was **not touched**. The tag protects committed state only. |
| This session's writes | This document only. |
| Product source modified | **None.** |

---

## MISSION

Design how THA Intelligence should **feel** across the platform — Home, Companion, Planner, Pantry, Shopping, Cookbook, quiet moments, celebration moments, micro-learning, and emotional tone — so that THA feels like **a calm, trusted member of the household rather than a nutrition app.** Do not implement. Do not create capabilities. Do not change architecture. Focus on the experience, and prioritise the highest-value experiences and quick wins.

This is a **feeling** document. Under the precedence the Experience Language fixes (behaviour > feeling > look), it names no colour, component, route, token, or motion value, and it changes no behaviour rule; where a design here would require either, it says so and defers to the owning architecture.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — the canonical entry point)
- [x] `THA_EXPERIENCE_LANGUAGE.md` (EXPLANG1/1A/1B — the feeling constitution: the 7 feelings, the 7-note Emotional Palette §3A, the 13 Principles of Feeling, the 8 Place Principles §4A, the 6-beat Rhythm §5, the Review Questions §6, the Anti-Patterns §7)
- [x] `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` (the Conversation discovers; canonical pages present; external = provenance)
- [x] `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` (Summary → Companion Cards → Next Steps; a card summarises, never owns/edits/duplicates)
- [x] `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (the Silence Rules, the 2-notice budget, the closed notice taxonomy, §9 stop rules)
- [x] `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (how a notice is *voiced*; the voice seam; the deterministic brain)
- [x] `THA_EXPERIENCE_BLUEPRINT.md` / `THA_EXPERIENCE_LANGUAGE.md §1.1, §3A` (the vision: *"a warm, lived-in home where someone has already thought about dinner"*)
- [x] The current live surfaces, as ground truth (`AmbientIntelligence`, the Companion notices route, `HomeIntelligenceCompanion`, `home-experience-page`), and the FI18/P0/INT19 findings on what is actually connected

---

## THE OBJECTIVE, MADE CONCRETE

"A calm, trusted member of the household rather than a nutrition app" is a feeling, and it is checkable. The two halves are opposites on a single axis, and every design below is measured against it:

| A nutrition app feels… | A trusted household member feels… |
|---|---|
| **Clinical** — scores, targets, macros, a dashboard reporting to you | **Warm** — someone who has already thought about dinner |
| **Assessing** — it audits what you ate and where you fell short | **Welcoming** — it meets you where you are and never keeps score against you |
| **Demanding** — it nags: log this, hit that, you're behind | **Effortless** — it has quietly done what it could, and asks for nothing |
| **Surveilling** — *"we noticed you skipped…"* | **Thoughtful** — it notices *for* you, not *on* you |
| **Loud** — it manufactures urgency to drive engagement | **Calm** — it speaks only when it has something worth the household's attention, and returns their attention at once |
| **Performing** — it shows off precision it doesn't have | **Decisive & honest** — confident about what it knows, plain about what it doesn't |

The Experience Language already fixes the target in one sentence — *"a warm, lived-in home where someone has already thought about dinner"* (§3A.2) — and the seven-note palette it must be played in: **calm · warm · energised · thoughtful · comforting · decisive · curious**, and never **cold · clinical · empty · silent · sterile · surveilling** (§3A.1). **A nutrition app is precisely the never-feel list.** The whole of this design is: keep THA's intelligence on the palette and off that list.

---

## THE CENTRAL FINDING — THA's proactive voice is inverted

This is the finding that shapes every design below, and it is not a surfacing problem.

THA's proactive intelligence — the things it says **without being asked** — is, today, almost entirely one register: **absence and alarm.** The one enrolled opportunity producer emits three things (measured in FI18): *"you have an empty day"*, *"you own this and haven't planned it"*, and *"this product conflicts with a restriction."* **Two of the three are absences** (*"you haven't done X"*) and the third is a safety alarm. That is the emotional profile of a nagging app and a smoke detector — not of a trusted household member.

A trusted member of the household does the opposite. They **notice presence, not absence.** They say *"nice — that's three new vegetables this week,"* *"the tomatoes are perfect right now,"* *"you've cooked six nights running."* They mention the gap rarely, gently, and never as a scold. And most of the time **they say nothing at all**, because nothing needs saying — and their silence is the reassurance, not a void.

**The warm, presence-noticing content already exists** — celebration, seasonal highlights, weekly progress, household insights are all built and rendering. But they live on the **wrong surface**: the legacy `/dashboard`'s `HomeIntelligenceCompanion`, an *ungoverned* channel (FI18 F6, NTC-P2) that INT19/NORTH have demoted to a quiet link at the bottom of Home. Meanwhile the *governed* Home surfaces the absence-dominated opportunities. **THA's warmest intelligence is on its coldest, most deprecated surface, and its most nagging intelligence is on its most important one.**

> **So the highest-value experience work is not building intelligence or adding surfaces. It is tone and routing: move THA's proactive register from *absence* to *presence*, using producers and categories that already exist, and make *silence* — the default state for almost every household — feel like calm rather than emptiness.** Everything else is detail.

Two hard constraints keep this honest, and every design respects them:

- **The attention budget is two, and fixed on purpose.** `MAX_NOTICES_PER_MOMENT = 2` (Notice Engine §6): *"improve the producers, not the volume."* More surfaces cannot produce more intelligence; a warmer *selection* of the same two can.
- **No citation, no card (Rule E1).** 600 of 610 foods have no citable evidence context (FI18 F8), so the ceiling on food teaching is **editorial, not experiential** — no design here raises it, and this document does not pretend otherwise.

---

## THE FEELING SPINE — the rhythm, applied to intelligence

The Experience Language's six-beat rhythm (**Arrival → Orientation → Confidence → Action → Understanding → Completion**, §5) is the diagnostic for every intelligence moment. Intelligence lives mostly in three of the beats, and gets each wrong in a characteristic way:

- **Orientation** — intelligence answers *"how are we doing, and what's worth knowing?"* It fails by answering with a gap the household didn't ask about.
- **Confidence** — intelligence must *read as honest*: grounded, cited, never fabricated, never more certain than the truth (Rule E1; the Behaviour Engine's voice seam). It fails as **precision theatre** — a nutrition app's signature move.
- **Understanding** — when the household acts, intelligence explains *why*, calmly. It fails by performing cleverness (Principle 7) or by stripping the *why* from the recommendation (micro-learning below).

And the beat intelligence most often violates is the one before all of these: **Arrival before information** (Principle 1) and **Intelligence never interrupts** (Principle 7). A trusted member lets you arrive before it says anything, and *waits to be asked* unless it has something genuinely worth the cost. That single discipline is most of the difference between a member and an app.

---

## THE TEN DESIGNS

Each design states: **the feeling to produce**, **the trusted-member test** (what a real household member would do), **what exists today**, **the design** (within existing architecture), and **the anti-pattern to refuse**.

### 1. Home intelligence

- **Feeling:** *Arrival, then reassurance.* The household walks into a warm place that expected them; the intelligence is the quiet sense that *today is under control*, before any figure. Home is the emotional centre, not a dashboard (Place Principle G).
- **Trusted-member test:** a member greets you at the door — they do not read you the day's deficits the moment you walk in.
- **What exists:** post-INT19, Home carries the one ambient surface (collapsed, renders nothing on the quiet day, a safety critical auto-opens) **and** the Companion reminders card (the same producer, phrased, ≤2). The warm presence-content (celebration/seasonal/progress) is on the demoted legacy dashboard.
- **Design:**
  1. **Arrival is never work** (Place Principle C). The greeting and the household's name land first, alone; intelligence is a later beat, below the arrival — never stapled to it. (INT19 already placed the ambient surface at the foot of the room; keep it there.)
  2. **The proactive card leads with presence.** When Home speaks unprompted, the first thing it says should be something the household *did* or something *good right now* (progress, a seasonal note, a genuine celebration) — not a gap. The gap is available, calm, and second. This is a **routing and ordering** choice over existing categories, not a new capability.
  3. **The reassurance must be honest.** On the quiet day (the default — see Design 7) Home says a warm, true, small thing or nothing, never a manufactured "all clear" and never a fabricated metric (Confidence beat; Rule E1).
- **Refuse:** Home rebuilt as a metrics dashboard (anti-pattern "Home reduced to a dashboard"); a wall of numbers on arrival; two ambient channels competing for the same eye (converge, don't stack — Notice Engine §9).

### 2. Companion conversations

- **Feeling:** *the friend at the counter* — present, calm, waiting to be addressed; honest about what it knows; it discovers and refers, then steps back. Never pounces on entry (Rhythm §5.7).
- **Trusted-member test:** a friend in your kitchen answers what you ask, points you to the right drawer, and does not narrate everything they know or pretend to remember what they don't.
- **What exists:** the canonical layout is fixed — **Summary → Companion Cards → Next Steps** (Companion Card Principle); the Companion *discovers and refers*, canonical pages present (Discovery Principle); the brain is deterministic — the model **phrases, never selects** (Rule LT3). Reachable engines: `report` (opportunities) and `compare` (COMP1) route from utterances; `recommend`/`explain` are deliberately unreachable (they would force the resolver to invent a slug — FI18/INT19). Deixis is thin: only meal-detail, food-detail, and planner publish what's on screen, so *"is this any good?"* on the Pantry, Shopping, Cookbook, Diary or Home reaches a Companion that cannot see what "this" is.
- **Design:**
  1. **Honesty over performance.** Every answer is *Summary → Cards → Next Steps*; the summary is one warm, plain, markdown-free line; unknowns are stated as honest gaps, never filled. A confident wrong answer is the worst thing this product can produce; the Companion never fakes certainty, memory, or emotion (§5.7 Confidence).
  2. **It refers; it never becomes a second page.** It hands the household to the one canonical place to see, edit, and act — never renders or edits an entity in the thread (Discovery Principle firewall).
  3. **It waits.** It answers when addressed or when it has something genuinely worth the household's attention; a dismissed thread stays dismissed; nothing repeats or escalates (Principle 7).
  4. **Deixis is the trusted-member unlock** (highest-value, see Priorities): a household member in the pantry who is asked *"is this any good?"* knows what you're holding. Until the Companion can see what page you're on, it is a stranger asking "which one?" — the opposite of trusted. *(Extending which pages publish context touches the pointer contract; it is named here as the design goal and deferred to the owning architecture, per the mandate.)*
- **Refuse:** a blocking modal for an observation; the Companion performing its cleverness; a domain-specific conversation layout (Card Principle fail test); the model *selecting* content rather than phrasing it (LT3).

### 3. Planner moments

- **Feeling:** *a calm, ordered week*, not a spreadsheet demanding entries; suggestions that read as grounded, not invented (§5.2).
- **Trusted-member test:** someone who plans with you points at the two empty nights *once*, kindly, and mostly notices that the week is shaping up — they do not re-list every blank cell each time you look.
- **What exists:** the Planner is the richest intelligence surface — and the one running **two ambient channels side by side** (the governed `AmbientIntelligence` and the ungoverned `PlannerIntelligenceStrip` reading the bypass — FI18 F6). Its one enrolled opportunity, `planner-empty-day`, is an absence.
- **Design:**
  1. **One voice per week.** Two ambient channels on one surface is *"a second Notice Engine wearing different clothes"* (§9) — and it *feels* like two people talking over each other about your week. The experience goal is **convergence to one calm strip**. *(The convergence itself is NTC-P2, a separately-gated workstream; named here as the experience target, not performed.)*
  2. **The gap is phrased as a member would.** *"Two nights still open — want a hand?"* is a companion; *"You have 2 empty days"* is a form validation error. The Behaviour Engine already voices notices in the household's personality — the design is that the empty-day notice must sound like an offer, never an audit (Orientation, not accusation).
  3. **Grounded, visibly.** When a suggestion appears, it carries its *why* (this fits your week / your restrictions), so the plan reads as trustworthy (Confidence).
- **Refuse:** two strips; the week presented as a list of deficits; urgency to "finish planning" (Principle 2 — nothing THA invented should hurry the household).

### 4. Pantry discoveries

- **Feeling:** *a sense of what we have* — a calm, ordered store, not a chore list (§5.6); the small pleasure of the product knowing your shelves.
- **Trusted-member test:** someone who knows your kitchen says *"you've got chickpeas — that curry would be quick tonight,"* not *"you own an item you have not used."*
- **What exists:** the ambient mount works; `pantry-item-unused-in-plan` is an absence. PANTRY1's richer assembler (season, familiarity, understanding, cookbook usage) is **fully built with zero importers** (FI18) — the presence-noticing pantry intelligence exists and is unheard.
- **Design:**
  1. **Turn the unused-item absence into a discovery.** The same fact — *you own this, it isn't in the plan* — is a nag as *"unused item"* and a gift as *"you've got X — here's a quick way to use it."* Presence framing over absence framing, same producer.
  2. **Season is the warmest pantry note.** *"Your squash is at its best this month"* is exactly the trusted-member voice, and it is knowledge THA already holds. Where PANTRY1's built intelligence could be heard, it is the pantry's highest-value warmth. *(Enrolling PANTRY1 as a producer is NTC-P3, out of mandate; named as the reachable win.)*
- **Refuse:** a pantry that reads as a to-do list of things you've failed to cook; inventory guilt.

### 5. Shopping guidance

- **Feeling:** *a ready list*, not an anxious tally; quiet confidence at the moment of a purchasing decision (§5.4).
- **Trusted-member test:** someone shopping with you quietly says *"that one's a cleaner choice"* and — critically — *"careful, that's got the thing Aran reacts to."* They help in the aisle; they don't lecture at the door.
- **What exists:** `shopping-restriction-conflict` is THA's **only** `critical` and its single most valuable proactive act — a product on the list conflicting with a named member's stored hard restriction. It is correct today and must not be touched. INT19 restored the per-item food story (`ShoppingIntelligencePanel`) to the workspace analyser.
- **Design:**
  1. **The safety critical is the one time intelligence may raise its voice** — and even then, calmly and specifically, naming the member and the reason (Principle 6 — alarm is reserved for genuine safety; the Emotional Palette's *decisive*, not alarmist). It auto-opens; the household must never have to click to discover a safety conflict.
  2. **Everything else is quiet, in-aisle, at the point of decision** — the food story (in season, meals it supports, the one "simply better" choice), shown where the choice is made, hiding entirely when there's nothing validated to say.
- **Refuse:** turning the safety signal into a general nag channel (it would spend the one piece of trust THA cannot re-earn); an upsell at the finish line (§5.4 Completion — *no upsell*).

### 6. Cookbook enrichment

- **Feeling:** *browsing a warm shelf*, the food itself carrying the warmth; honest presentation, nothing over-claimed (§5.3).
- **Trusted-member test:** someone leafing through your cookbook with you says *"these two are similar — this one's the better pick for you,"* not a fabricated "did you know" about a recipe.
- **What exists — stated honestly:** **no producer says anything about a cookbook today.** None of the three opportunity types is about a meal or a recipe. Mounting an ambient surface on Cookbook now would render an **empty room** — which Silence Rule 5 forbids (*the engine never pads, never invents*). The reachable intelligence is **COMP1**, a built, cited comparison engine ("which of these two is better for us?") reachable by the Companion but with **no canonical-page UI**.
- **Design:** the Cookbook's natural question is *comparison*, and the honest enrichment is to give COMP1 a home on the canonical page — the trusted-member "this one's the better pick for you," with its evidence. *(A Cookbook producer / COMP1 UI is its own gated workstream; named as the reachable win, not built.)* **Until a producer exists, the Cookbook stays quiet** — an honest, warm shelf is better than a padded one.
- **Refuse:** an ambient surface with nothing to say (a placeholder is not intelligence — Principle 8; Silence Rule 5); a "recipe of the day" tip with no household relevance.

### 7. Quiet moments — *the most important design in this document*

- **Feeling:** *"today is under control."* Silence as the product breathing, not the product empty (Principle 8; §3A.4 — *calm must never become lifeless*).
- **Why it is the most important:** for **almost every household, almost all the time, THA's intelligence renders nothing** — the attention budget is two, the producers are few, and CONV1 P8 measured **192 of 195 households unanchored** (so the ambient surface is silent for them by design). **The quiet state is not an edge case — it is the default experience of THA's intelligence.** If silence reads as *empty app / nothing here / broken*, THA feels like a nutrition app with no data. If silence reads as *a calm morning, nothing to worry about*, THA feels like a home that is in order. **This single distinction decides whether the objective is met for the median household.**
- **Trusted-member test:** a member who has nothing to flag doesn't fill the air — and their quiet is *reassuring*, because if something were wrong they'd say so.
- **Design:**
  1. **Silence is the designed default, not the failure state.** *"Silence is a first-class outcome … the default disposition of a noticeable fact is unspoken — the engine exists as much to withhold honestly as to surface"* (Notice Engine §4). The default posture is no notice, no motion, no sound (Principle 8); it is broken only when something has genuinely earned it.
  2. **When a surface must show its quiet, the empty state is warm and honest** — a single true sentence, at most one gentle action, never a placeholder, never fake activity, never a fabricated "all clear" (Principle 8; Rule E1). The unanchored-Home copy INT19 preserved (*"your plan is all still there"*) is the model: honest about the gap, warm about the state.
  3. **Degraded ≠ empty.** When a producer can't be reached, the surface renders *absence*, never a false "nothing to do" (`AmbientIntelligence` already does this — `trust.resolved === false`). A trusted member who couldn't check says so; they don't say "all clear."
- **Refuse:** silence dressed as brokenness; empty states padded with placeholders or filler (anti-patterns "clinical minimalism," "calm becoming lifeless"); a spinner or skeleton implying data that will never come.

### 8. Celebration moments

- **Feeling:** *quiet, earned acknowledgement* — *"that was noticed, and it mattered"* — and nothing at all everywhere else (Principle 10).
- **Trusted-member test:** a member says *"six nights in a row — nice"* once, warmly, and means it. They do not throw confetti when you save a shopping item.
- **What exists:** celebration is not a notice *category* — it is the calm *voicing* (`buildCelebration`) of two milestone notices, `streak-milestone` and `diversity-milestone`, which the Notice Engine fires **only at their notability gates (streak ×7, diversity ×10)** — *"an unremarkable true fact is silence, not filler"* (Silence Rule 4). The mechanism and the warmth exist; the legacy dashboard also already renders `celebration` and weekly-progress as calm one-line rows.
- **Design:**
  1. **Rare and true — and the gates already enforce it.** Delight fires only at a genuine milestone the household would recognise themselves (a streak at ×7, plant diversity at ×10, a first outcome, a completed effort) — never a routine save, navigation, or edit (Principle 10; the notability gates; §17.9 owns *which* moments qualify). A milestone whose data can't honestly be dated is phrased as a present-state fact, never as *"you just achieved this"* — THA does not manufacture a "just happened" it cannot prove.
  2. **It stays in THA's calm register** — acknowledgement, not celebration theatre. A warm sentence and a quiet mark, never confetti, never reward mechanics engineered to extend a session (anti-pattern "marketing-style gimmicks"; Principle 10).
  3. **Presence is the everyday micro-celebration.** The routing shift in Design 1 — leading Home with *what the household did* — is celebration at low volume, every day, without ceremony. This is where "trusted member" is won most often.
- **Refuse:** celebrating everything (which abolishes celebration); streak mechanics that manufacture anxiety about breaking them (that is a nutrition app coercing engagement).

### 9. Micro-learning

- **Feeling:** *"now I understand why."* Teaching as the natural by-product of a recommendation, never a lecture (§5.5 Understanding).
- **Trusted-member test:** a member explains their suggestion when you ask — *"I said that because you've had less fish lately"* — they do not read you a nutrition fact about kale unprompted.
- **What exists:** every opportunity already carries an `explanation` and `evidence`; the reachable teaching moment is *"this is why you're seeing this,"* pinned to what's already on screen. The hard boundary is explicit: **micro-learning must never become a tip of the day** (Silence Rule 5 — *never pads, never invents a "tip of the day"*), and an uncited card is forbidden (Rule E1).
- **Design:**
  1. **Teaching is the *why* behind a recommendation, not a fact beside it.** THA's teaching moment is *"this is why you're seeing this"* — the explanation and evidence the household can open on any opportunity (`opportunity-delivery:explain`, a calm READ) — not *"did you know?"* The evidence travels *with* the recommendation by construction: its Context View has **`evidence` PINNED**, *"so the model can never be handed a recommendation stripped of its justification and left to invent one"* (Notice Engine §8). Rule E1 is enforced structurally — an opportunity that cites nothing is *dropped*, never voiced uncited.
  2. **Learning is what repeated and was confirmed — never a single notice.** A confirmed household-learning signal (*"you tend to plan fish on weeknights"*) may be surfaced, always low-priority, and its rationale crosses the voice seam **verbatim** — because *a paraphrase is where "you tend to skip fish on weeknights" quietly becomes "you don't like fish."* THA never tells a household what it has learned about them until they have agreed it is true. **This is the single most trust-critical sentence in the whole intelligence experience.**
  3. **The ceiling is editorial, and named.** 600/610 foods can't render a teaching card at all (Rule E1). Micro-learning is deep where the evidence is (10 foods) and honestly silent everywhere else — a real limit, not a UI gap.
- **Refuse:** a tip-of-the-day; an uncited "fact"; paraphrasing a learned preference into a claim about the person; teaching that interrupts rather than waits to be opened.

### 10. Emotional tone — the through-line

- **Feeling:** the seven-note palette, played consistently across every intelligence surface and every state, including errors, empty states, and the quiet day: **calm · warm · energised · thoughtful · comforting · decisive · curious** (§3A.2) — and **never cold, clinical, empty, silent, sterile, surveilling** (§3A.1).
- **Trusted-member test:** the voice sounds like one warm, consistent person who knows the household — not a system, not a coach, not a marketer.
- **Design:**
  1. **One voice, phrased not selected.** The Behaviour Engine voices every notice in the household's chosen personality — one of six closed voices (companion · friend · coach · chef · teacher · sergeant) — *after* the deterministic engine has selected it: *"Selection, then phrasing — in that order, with nothing in between"* (Behaviour Engine §7.2; Rule LT3). Switching voice may change wording and order within the already-eligible set and **nothing else** — same disclosures, same ids, same counts. The tone is a *warm human sentence*, the same character everywhere (Principle 11 — consistency creates trust).
  2. **Notice *for*, never *on*.** The register is *thoughtful* (the platform thinks ahead for the household), never *surveilling* (*"we noticed you…"*). The difference between "I thought you'd want to know" and "we've been watching" is the whole difference between a member and an app, and it lives entirely in phrasing.
  3. **Decisive, not hedging; honest, not certain.** Recommendations read as considered, not hesitant (§3A.2 *decisive*) — but confidence is rendered exactly as strong as the evidence, never precision theatre (§5.5). A trusted member is sure of what they know and plain about what they don't.
  4. **Warm even in the machinery.** Errors, degraded reads, and empty states carry the same warmth — *"I couldn't check just now"*, not a cold failure. Correctness without warmth is the "emotionally distant" anti-pattern; the temperature must hold in every state.
- **Refuse:** a clinical/coaching/marketing register; surveillance phrasing; hedging or certainty theatre; a different voice per surface (Principle 11); warmth that survives the happy path but drops in errors and empties.

---

## PRIORITIES

Scored on **value** (how much it moves "app → member") against **cost** — and, per the mandate, restricted to what needs **no new capability and no architecture change.** Pure-experience work (tone, ordering, copy, honest-absence states) is the sweet spot: it is where the objective is mostly won, and it is nearly free.

### Highest-value experiences

1. **Invert the proactive register — presence over absence.** Lead Home (and every proactive moment) with what the household *did* or what's *good now*, using the celebration/seasonal/progress categories that already exist; demote the gap to calm and second. This is the single change that most moves THA from "app" to "member," and it is routing/ordering/tone, not new intelligence. *(The warm producers exist; the work is which get voice and in what order.)*
2. **Make the quiet day feel calm, not empty.** Design the default (silent / honest-empty) state of every intelligence surface so silence reads as *today is under control*. This is the median household's entire experience of THA intelligence (192/195), and it is copy and state design — the cheapest high-value work in the document.
3. **Deixis — the Companion can see what you're looking at.** Let the Companion answer *"is this any good?"* on the page the household is actually on. The largest single step from "stranger" to "trusted." *(Extends the pointer contract; named as the goal, deferred to the owning architecture.)*

### Quick wins (genuinely small, immediately felt, no new capability)

| # | Change | Why it's a quick win |
|---|---|---|
| **QW1** | **Honest, warm empty/quiet copy** across the intelligence surfaces (the unanchored-Home sentence is the model) | Pure copy + state; turns the default experience from "empty app" to "calm home" |
| **QW2** | **Phrase the empty-day/unused-item notices as offers, not audits** (Behaviour Engine voicing) | Same producers, same facts; the difference between a nag and a member is the sentence |
| **QW3** | **Lead the Home proactive card with presence** (order celebration/seasonal/progress ahead of gaps) | Ordering over existing categories; no new producer |
| **QW4** | **Keep arrival free of intelligence** — greeting first, notices a later beat (Place Principle C; INT19 already placed the ambient surface below the arrival) | Placement only; protects the "walked into a calm home" feeling |
| **QW5** | **Guard the safety critical's calm** — name the member and reason, never let it drift into a general nag channel | Protects THA's one irreplaceable piece of trust |

### Reachable, but their own gated workstreams (named, not done here)

- **Converge the Planner's two ambient channels** (NTC-P2) — one calm voice per week.
- **Give PANTRY1's built assembler a voice** (NTC-P3) — the pantry's presence-noticing warmth, already written.
- **Give COMP1 a canonical UI** — the Cookbook's "which is better for us?"
- **Extend `NUTRITION_CONTEXT` beyond 10 foods** — *editorial*, the true ceiling on food teaching (Rule E1). No experience work substitutes for it.

---

## WHAT THIS DESIGN DELIBERATELY DOES NOT DO

Per the mandate, and stated so nothing is smuggled in:

- **No new capability, producer, notice category, engine, or resolver matcher.** Every design uses producers and categories that already exist. Where the reachable win needs a new producer (PANTRY1, COMP1, Cookbook) it is named as a *remaining opportunity*, not designed as built.
- **No architecture change and no governing-document edit.** This document *cites* the Experience Language, the Discovery/Card Principles, the Notice/Behaviour Engines, and Rule E1 — it restates none of them and amends none of them.
- **No implementation.** No code, schema, route, or copy string is written. This is a design of how the existing intelligence should *feel*.
- **No cap raise.** `MAX_NOTICES_PER_MOMENT` stays two; the design improves the *selection*, never the volume (Notice Engine §6/§9).

---

## EXPERIENCE & ARCHITECTURE COMPLIANCE

| Rule / gate | Compliance |
|---|---|
| **Experience Language §3 / §3A** — the seven feelings, the palette, *calm must never become lifeless* | ✅ Every design is scored against the palette; the quiet-day design exists specifically to keep silence *warm* and off the never-feel list |
| **Principle 1 / Place Principle C** — arrival before information; welcome is never work | ✅ Home leads with arrival; intelligence is a later beat (QW4) |
| **Principle 7** — intelligence never interrupts | ✅ The Companion waits; notices are inline, calm, dismissible; nothing repeats or escalates |
| **Principle 8 / §3A.4** — silence is the interface; calm ≠ lifeless | ✅ Silence is the designed default; empty states are warm and honest, never padded |
| **Principle 10** — delight must be earned | ✅ Celebration is rare, true, calm; routine actions resolve without ceremony |
| **Notice Engine §6/§9** — two-notice budget; no second channel | ✅ No cap raise; the Planner two-channel case is named for *convergence*, not extended |
| **Silence Rule 5** — never pads, never invents a tip of the day | ✅ Micro-learning is *why-you're-seeing-this*, never a tip; the Cookbook stays quiet until a producer exists |
| **Rule E1** — no citation, no card | ✅ The 600/610 editorial ceiling is named as the real limit, not worked around |
| **Rule LT3** — the brain stays deterministic | ✅ The model phrases; producers select; no recommendation originates in phrasing |
| **Discovery & Companion Card Principles** — discover and refer; Summary → Cards → Next Steps | ✅ The Companion refers to canonical pages; no in-thread rendering/editing; no domain-specific layout |
| **The voice seam** — a learned preference crosses to the household verbatim | ✅ Named as the most trust-critical rule; paraphrase forbidden |
| **Mandate** — no new capability, no architecture change, no implementation | ✅ By construction; every "new producer" is a named remaining opportunity |

---

## TRUST CHECK

- **Is any claim stated more confidently than the evidence supports?** No. The proactive-register profile (3 types, 2 absences), the two-notice cap, the 192/195 unanchored figure, the 600/610 evidence ceiling, and the two-ambient-channel Planner are all measured facts carried from FI18/CONV1/INT19, cited as such. The *design* is opinion, and is labelled as design.
- **Is anything guessed but presented as measured?** No. Where a warm producer's exact current wording is not quoted, the design speaks to the *register* it must have, not to a string it already emits.
- **Are the unknowns named?** Yes: (1) whether the celebration/seasonal producers can be *re-ordered ahead of* opportunities without a producer change is an implementation question this design does not answer — it states the experience goal; (2) the deixis extension and every "reachable win" touches contracts or producers and is explicitly deferred; (3) this document did not run the app or read every producer's live phrasing — it designs the target, and the FI18/INT19 findings are its ground truth for what exists.

---

## OUTCOME — the one-line answer to the mission

**THA already has the intelligence and the feeling-architecture to feel like a trusted household member; what it lacks is that its proactive voice is inverted — it speaks absences and alarms where a trusted member speaks presence and stays warmly silent. Making THA feel like a member, not an app, is mostly tone and routing over producers that already exist, and the two cheapest, highest-value moves are the same two a real household member makes: notice what the household *did*, and be calm — not empty — when there is nothing worth saying.**

---

*Design investigation only. No code, capability, or architecture was changed in the production of this document.*
*Rollback: `rollback/EXPINT1-intelligence-experience-20260717` → `7bfad50c`.*
