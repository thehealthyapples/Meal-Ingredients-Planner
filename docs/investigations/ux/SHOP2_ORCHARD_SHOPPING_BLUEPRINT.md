# SHOP2 — The Orchard Shopping Blueprint

**Workstream:** `SHOP2_Orchard_Shopping_Blueprint`
**Date:** 2026-07-16
**Rollback:** `rollback/SHOP1-orchard-shopping-blueprint-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation. It **creates no rule and no second owner**. Everything binding in it is binding because another document already says it, and is cited to that document. Where this file appears to state a law, the citation is the law and this file is commentary.
>
> It was asked to define Shopping *as the household's market basket*, in principles, without designing screens. It does that by **composition and citation** (§ 3–§ 4, § 7–§ 10), because Shopping's philosophy, feeling, exposure, light, material, signature moment and anti-patterns are **already owned completely** by seven governing documents. The honest deliverable was never new law. It is Shopping assembled into one legible room, plus **the two deliverables where the canon is silent or the platform contradicts it** (§ 5, § 6), plus what the live room is doing instead (§ 11).

---

## 0. THE MISSION, AND THE DEVIATIONS REPORTED

The mission: *"Using the existing Experience architecture and Orchard Blueprint, define Shopping as the household's market basket."*

### 0.1 Workstream ID deviation — `SHOP1` is taken

**`SHOP1` already exists**: `rollback/SHOP1-intelligent-shopping-evolution-20260712` → `docs/implementation/shopping/SHOP1_INTELLIGENT_SHOPPING_EVOLUTION.md` (2026-07-12, 442 lines, AMBER). It is **live prior art directly on this mission's third deliverable**, and — decisively — **it names this workstream by ID** (`SHOP1:320-327`, quoted at § 5.4). This document is therefore **`SHOP2`**, and its § 5 is written to *cite* SHOP1 rather than rediscover it.

*(The rollback tag was cut before that collision was found, so it reads `rollback/SHOP1-orchard-shopping-blueprint-20260716`. It is unambiguous — the two SHOP1 tags differ by slug and date — and renaming a rollback tag after the fact is worse than an untidy one. Recorded here so the identifier in § 14 is not mistaken for the 2026-07-12 tag.)*

### 0.2 Filing deviation — and it is a different call from `COOK1`'s

The mission said *"store the investigation under `docs/investigations/`"*. A loose file at that root **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47` — `docs/investigations/` explicitly excludes *"loose files at its root"*; `docs/investigations/README.md:11`) and **fails** `.engineering/scripts/repo-structure-verify.sh`. Filed under **`ux/`** — the Experience workstream, where `PLAN1`, `COOK1`, `PANTRY1`, `ORCH1`, `NORTH2`, `EXP5` and `WX10C` live. Filename preserved.

**Unlike `PANTRY1`, this decision had a genuine competing candidate, and rejecting it surfaced a real defect.** `docs/implementation/shopping/` **exists** and holds SHOP1. But `docs/investigations/README.md:18-30`'s workstream table — the canonical vocabulary — **does not list `shopping`.** It lists eleven folders: `intelligence`, `knowledge`, `planner`, `ux`, `cookbook`, `benchmarking`, `platform`, `engineering`, `governance`, `development_world`, `backups`.

> **`docs/investigations/README.md:12-13` states the vocabulary *"is shared with `docs/implementation/`"*. It is not. `implementation/shopping/` exists and `investigations/`'s table has no `shopping` row.** Recorded as a finding, not fixed — amending a governing index is not an investigation's to make (§ 13). `ux/` is correct on both readings: this document is about Shopping **as a place**, which is the `ux/` workstream's subject, exactly as `COOK1 § 0.1` reasoned when it declined `cookbook/`.

### 0.3 The noun deviation — and it is the sharpest of the four

The mission says *"the household's **market basket**."* **Neither word is the canon's, and each is wrong in a different way.**

**"Market" names a place the house does not contain.** `BLUEPRINT:149` — *"**Shopping is preparing to leave the house** — the list gathered by the door before the trip out."* `OHDB:262` — *"To gather the list by the door, **ready for the trip out**."* The Living Book's chapter is titled ***Preparing To Leave For The Shop*** (`OLB:94`) — and the shop is **off-stage**. The next chapter is *Returning Home* (`OLB:104`); **there is no chapter in which the household is at the market, because THA never goes there.** `OLB:96` is explicit about what the room is instead: *"**This is a room you pass through on your way out the door, not one you settle into.**"*

> **Shopping is not the market. It is the threshold before it.** A market is somewhere you *are*; this room is somewhere you *leave from*. The whole design — E1 light, one note, brisk, *"passed through, not lingered in"* (`BLUEPRINT:174`) — descends from that, and "market" inverts every line of it.

**"Basket" names a live surface — and it is the wrong one.** `/basket` is a **real route** (`App.tsx:388`) resolving to `shopping-list-page.tsx`, **4,242 lines**, which `WX10C` declared non-canonical and then never mentioned (§ 11.2). **Every fabrication this audit found is in it** (§ 5.2, § 11.3), and **neither SHOP1's cards nor the platform's sole safety-critical signal reach it** (§ 8.2). There is also a `user_basket` table, a basket badge, and fifteen `/api/basket/*` endpoints.

> **The mission's noun points at the one door in this room the canon does not govern and the platform does not guard.** That is not the mission's fault — it is the finding. **"Basket" is what the *code* calls this room; "the list by the door" is what the *canon* calls it; and the gap between those two names is § 11.**

**And "market basket" has a third meaning that must be refused explicitly:** in economics it is a *fixed basket of goods used to measure prices* — a **measurement instrument**. `EXPLANG:294` forbids *"measuring success by engagement or time-in-product rather than by stress removed"*, and this room is the one place in the house where a measuring instrument would look native. **The household's shopping is not an index.**

**I have kept the canon's noun: the list by the door.**

> **`PLAN1` refused its mission's noun because the canon contradicted it. `COOK1` kept its noun because it *was* the canon's. `PANTRY1` narrowed its noun to recover a virtue. `SHOP2` refuses both halves of its noun — and finds that one of them is the name of the room's own unguarded second door.**

No other deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**The room the canon calls *"the list by the door"* does not show the household their list.**

Seven findings, ordered by how much they should change what happens next:

1. **A household with fourteen items taps Shopping and sees an empty textarea.** `shopping-workspace-page.tsx:1212-1217` defaults `mode` to `"add"`; the list is gated `mode !== "add"` (`:2551`); and **the nav links carry no `?stage=`** (`nav-bar.tsx:43`, `:458`, `:512` — `WX10C` deliberately removed the parameter). So the default arrival is a blank auto-focused note (`:2340-2352`, `:1318-1320`) with **the household's actual list rendered nowhere on screen.** Against `OLB:96` — *"**The list is gathering by the door** — the things you need, ready to go"* — and `EXPLANG:408`, the room's Arrival beat: *"**a calm, ready list**, not an anxious tally."*

2. **The Experience Architecture names this room's primary action by name, and the room does something else.** `EXPARCH:140` — *"The primary action is the person's most likely intent, not the product's most desired behaviour. On a meal: cook or plan it. **On a shopping list: work through it.**"* **Shopping is the only realm whose primary action the canon states in its own words** — and the room opens on *add*, not *work through*. `EXPARCH:141`: *"A surface that cannot name its primary action is not finished being designed."* **This surface's primary action was named for it, three documents up, and the room disagrees.**

3. **THA computes the sentence that would tell you your list exists, and throws it away.** `shopping-workspace-page.tsx:2176-2178` builds `` `${items.length} items in list` `` — **on the `mode === "add"` branch specifically** — and its only container is gated `mode !== "add"` (`:2202`). **The one string written for the arrival is unreachable from the arrival.** *This is `PANTRY1 § 1.2`'s shape for the third time: the platform computes the honest signal and discards it at the last step.*

4. **The room has two doors and the wrong one is unguarded.** `WX10C` (2026-06-27) declared `/shopping-workspace` canonical, ticked *"No duplicate shopping workflows ✅"*, and **never mentions `shopping-list-page.tsx`** — 4,242 lines, still live at `/basket` and `/analyse-basket` (`App.tsx:387-388`), linked **three times from the Dashboard** (`dashboard.tsx:394`, `:449`, `:671`), and **advertised by the canonical page's own footer** (`shopping-workspace-page.tsx:2770` — *"Full product database also available in Basket."*). **Every fabrication below is in it.** So is the absence of the safety card (§ 8.2).

5. **THA tells a household its banana is *Industrial*.** `shopping-list-page.tsx:1150` — `canShowScoreForItem(item)` returns true for **any whole food** regardless of whether a score exists (`basket-item-classifier.ts:49-57`), and `(item.thaRating ?? 0)` turns a **null** score into `0`, which falls to the final branch and renders **"Industrial"** in red. Also `:888`, `:929`, `:1141` render a **0-apple rating** — the worst possible score — from absent data. **The same file gets it right eight lines earlier** (`:884` — `ratingColor(item.thaRating ?? null)`). **The server never fabricates a score** (`routes.ts:4115` — a `0` is `skipped`, never written). **The fabrication is added by the client, at the last inch.**

6. **Shopping never asks the Pantry whether the household already owns the thing** — and this is documented, in writing, by the prior art. `POST /api/shopping-list/from-meals` (`routes.ts:4132-4314`) contains **zero pantry reads**. `SHOP1:419` states it plainly: *"`POST /api/shopping-list/from-meals` **still never consults the pantry** — SHOP1 *surfaces* the duplicate, it does not *prevent* it."* § 7.3.

7. **Shopping already has the co-authorship the Planner was found to lack.** `shopping_list.addedByUserId` (`schema.ts:177`) is written on every insert (`storage.ts:691`, `:744`), resolved to a name (`:2814-2819`), and **rendered**: *"Added by Dad"* (`shopping-list-page.tsx:98`). The list is **household-scoped** (`storage.ts:678-681`). **`PLAN1 § 6` named this exact gap and pointed at this exact room; confirmed from this side.** § 12.1.

> **The sentence this room is governed by:** ***"This is a room you pass through on your way out the door, not one you settle into. The list is gathering by the door — the things you need, ready to go… keys, bag, list, done"*** (`OLB:96`). Every principle below is written to survive that sentence being enforced against the platform — which, today, it does not survive at the first clause: **on arrival, there is no list by the door.**

---

## 2. THE GATE — APPLIED TO ALL EIGHT DELIVERABLES

`NORTH2:39` imposes a prior question on any proposal:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it, which the architecture forbids"* (Blueprint § 18; OHDB § 16.3; TRANSLATION1 § 7.3; Experience Principle 6).

Run against the mission's eight deliverables:

| # | Deliverable | Already owned? | Owner |
|---|---|---|---|
| 1 | The Shopping philosophy | **Yes** | `BLUEPRINT:149`, `:174`; `OHDB § 13.5:260-268`; `OLB:94-103` |
| 2 | How Shopping should feel | **Yes — completely, and it names the room's live defects** | `EXPLANG § 5.4:407-413`; `OHDB:264`; `OLB:96-103` |
| 3 | How buying decisions are supported | **⚠️ Owned by SHOP1 + the Analyser + WS9 — and the Experience canon is *silent on money entirely*** | `SHOP1 § 2`; `capabilities/partners.md` → § 5 |
| 4 | How confidence is created | **Yes — three times, structurally — and the field built for it is never rendered** | `item-resolver.ts:13`; `apple-score-trust.ts:31-33`; `EXPLANG:409` → § 6 |
| 5 | How Planner/Cookbook/Pantry feed Shopping | **⚠️ Two of three are built and correct; the third is refused deliberately** | `routes.ts:4132`; `SHOP1:419` → § 7 |
| 6 | How the Companion quietly participates | **Yes — and this room has the canon's second *quoted line* for it** | `OLB:100`; `BLUEPRINT § 13`; `NOTICE_ENGINE § 6` → § 8 |
| 7 | Moments of delight | **Yes — and the list is closed, and this room is named in the refusal** | `EXPARCH § 17.9:333-341`; `OLB:102`; `OHDB:268` |
| 8 | Anti-patterns to avoid | **Yes** | `BLUEPRINT § 16:435-445`; `OHDB:268`; `EXPLANG § 7:526-551`; `OLB:102` |

**Six of eight are owned with no remainder.** So §§ 3–4 and 7–10 are **composition**. **§ 5 and § 6 are where this document reports something real**, and § 11 is what the live room is doing instead.

> **Why compose at all, if nothing is new?** For `EXPBLUE1`'s own reason (`BLUEPRINT § 1.3`): the canon *"was becoming a library rather than a blueprint."* Shopping's identity is currently distributed across a verb line, a map row, a conditional exposure level, a light character, a ground posture, a Living Detail row, a design reading, a rhythm, a chapter, and a primary action stated in a fourth document. **This document makes that one read.**

---

## 3. THE SHOPPING PHILOSOPHY

Five principles. Each is a **composition of owned rules**, cited. None is new.

### P1 — It is a threshold, not a destination

`OLB:96` — *"**This is a room you pass through on your way out the door, not one you settle into.**"* `BLUEPRINT:174` — *"**passed through, not lingered in**"*. `OHDB:264` — *"Brisk, satisfying, **momentary** — a room passed through, not lingered in."*

This is the room's constitutional clause and it is a **negation**: Shopping is defined by how quickly you leave it. Where the Cookbook is explicitly *"made for lingering"* (`OLB:76`) and the Pantry is *"the most practical moment in the house"* (`OLB:85`), **Shopping is the only room the canon measures by its own brevity.** `OLB:102` forbids the inversion by name: *"**the quick room turned into a place that asks you to linger.**"*

Every temptation in this room — a price comparison, a better-product card, a savings total, a second look at the basket — is a reason to stay in a room defined by leaving. **That does not make them wrong. It makes them chargeable**, against `EXPARCH:178`: *"**every added tap must buy the person something**"* — and the person, not the product.

### P2 — The list is the room

`BLUEPRINT:174` — ground posture: *"**One note sized to its list**"*. `OLB:98` — *"The materials are as simple as a note by the door, **sized to exactly what's on it and no more**."* `EXPARCH:140` — *"On a shopping list: **work through it**."*

The Planner has a table that holds a week; the Cookbook has a shelf that holds a book; **Shopping has nothing but the list.** There is no furniture here that survives the list's absence — *"sized to exactly what's on it and no more"* is a material rule that makes the room **a function of its content**.

> **This is why § 1.1 is a philosophical failure and not a routing bug. A room whose only material is its list, arriving with no list on it, has not arrived badly — it has arrived as a different room.**

### P3 — Momentum is the register, and it is welcome

`OLB:98` — *"**There is momentum here, and it is welcome.**"* `EXPLANG:411` — *"**Action** — one uninterrupted flow: work through the list; **the product stays out of the way**."* `OHDB:264` — *"Brisk."*

Momentum is the only register in the house the canon actively *encourages* — every other room is calm, unhurried, or at rest. And it is precisely bounded: `EXPLANG:164` — *"**Nothing counts down, nothing expires for effect, nothing hurries the person toward a decision.**"*

> **The distinction is exact and load-bearing: momentum is the household's, never the product's.** A room that moves *with* a person who is already moving is brisk. A room that *makes* them move is urgency, and `EXPLANG:538` calls it *"exclamation urgency… friction wearing the costume of premium."*

### P4 — The smallest light, and the only room permitted to open its window when empty

`BLUEPRINT:174` — *"**E1** (E2 when clear) | Plain bright; passed through"*. `BLUEPRINT:223` — E1 is *"The orchard as illumination and warmth, **not image**… you don't see it while working."* `OLB:98` — *"The orchard is barely a thought here — a working brightness — **though on a clear day, when the list is short and honest, the room can afford to breathe a little and let a bit more of the morning in.**"*

The exception is `BLUEPRINT:229`'s rule 2 — and **the rule is stated using this room's own example**: *"An honestly empty working room may breathe at E2 — **the view beyond a clear list is exactly the right calm**."*

> **The Blueprint wrote its empty-state exposure law with Shopping in the frame.** *(Shopping is not alone in holding a conditional — the Analyser carries *"E1 (E2 before first use)"*, `BLUEPRINT:179`. Both conditions are emptiness conditions, and both return to level the moment content exists.)*

**The consequence is a constraint the live room breaks twice** (§ 11.5): E1 means the orchard is **light, not image** — and Shopping renders the orchard image **twice**, once globally and once inside its own writing surface.

### P5 — The room's job is to be left, prepared

`EXPLANG:413` — *"**Completion** — the list is done — a quiet, satisfying, complete state, **with no upsell at the finish line**."* `OLB:103` — *"What lingers — **the light, competent feeling of heading out prepared, with everything you need gathered and nothing forgotten.**"*

Every room's completion resolves *"at rest"*; **this one resolves *out the door*.** And it is the only room whose Completion beat carries an explicit commercial prohibition — which is the whole of § 5.1's finding: **the one time the Experience canon comes near money, it is to forbid something.**

---

## 4. HOW SHOPPING SHOULD FEEL

**Owned in full** by `THA_EXPERIENCE_LANGUAGE.md § 5.4:407-413`, which already applies the canonical six-beat Experience Rhythm to this room. Cited, not restated:

> - **Arrival** — a calm, ready list, not an anxious tally.
> - **Orientation** — *"here is what you need, organised the way you'll shop."*
> - **Confidence** — the list reflects the plan honestly; quantities and items feel trustworthy and complete.
> - **Action** — one uninterrupted flow: work through the list; the product stays out of the way.
> - **Understanding** — progress is quietly visible; the person always knows how much remains.
> - **Completion** — the list is done — a quiet, satisfying, complete state, with no upsell at the finish line.

`OHDB:264` fixes the tone — *"Brisk, satisfying, momentary — a room passed through, not lingered in"* — and `OLB:96-103` renders the six beats as lived experience, closing on the feeling to protect: *"**the light, competent feeling of heading out prepared, with everything you need gathered and nothing forgotten.**"*

**Three observations about the beats, reported as findings rather than principles:**

### 4.1 Beat 1 (*Arrival*) fails, and it fails in the one way no other room's has

`EXPLANG:455` states the diagnostic: *"A surface that feels wrong can almost always be traced to a missing or malformed beat: **it opens on information with no arrival**; it presents an action before the person is oriented…"*

**Shopping's Arrival is neither missing nor malformed. It is occupied by a different beat.** The room opens on **Action** — an auto-focused empty textarea (`shopping-workspace-page.tsx:1318-1320`) demanding input — with **Arrival and Orientation skipped entirely.** *"A calm, ready list"* (`:408`) and *"here is what you need"* (`:409`) both require the list to be on screen. It is not.

> **`PLAN1 § 11.1` found the Planner's arrival buried under five strips. `PANTRY1 § 4.1` found the Pantry's occupied by one. Shopping's arrival is not buried — it is *absent*, and an input field is standing in its place.** This is `EXPLANG:544`'s *"A welcome that is also work"* — *"a greeting fused with a task, so the household must labour at the very moment it should simply arrive"* — in the most literal form the audit has seen: **the greeting *is* the task, and it is a blank field.**

### 4.2 Beat 5 (*Understanding*) is the beat the room quietly gets right

*"Progress is quietly visible; the person always knows how much remains"* (`:412`). Live: `PrepGroupHeader` renders `` `${resolvedCount}/${count}` `` (`shopping-workspace-page.tsx:1133-1161`); `ShopGroupHeader` and `ShopCategoryHeader` render real array cardinalities (`:1164-1199`); empty filter pills are **suppressed** rather than shown as zeros (`:2207` — `if (id !== "all" && count === 0) return null`).

**Every count in the canonical workspace is a real cardinality of something the household can see.** No progress bar, no percentage, no target. **Recorded as a PASS** — and note *what kind* of pass it is: `:412` asks for progress *"quietly visible"*, and the room answers with counts of visible things rather than a bar. **That is the beat read correctly, not merely met.**

### 4.3 Beat 3 (*Confidence*) is where the room's honesty splits in two

*"The list reflects the plan honestly; quantities and items feel trustworthy and complete"* (`:410`). **Quantities are genuinely trustworthy** (§ 7.1 — real aggregation, real dedupe, member-swap labels excluded). **The canonical workspace is honest.** **The `/basket` surface is not** (§ 5.2). § 6 is this beat's full treatment.

**The temperature floor** (`EXPLANG § 3A`): Shopping is *"plain bright"* (`BLUEPRINT:174`) — **the least warm light the canon assigns any room**, and deliberately so: it is *"the light of a hallway you move through rather than a room you dwell in"* (`OLB:98`). **This is the one room where plainness is the specification rather than a risk** — but `EXPLANG:546`'s *"Clinical minimalism"* still binds, and the distance between *"a hallway"* and *"a form"* is exactly the width of `OLB:103`'s word **competent**. A hallway is plain and you are glad to be in it. A form is plain and you are not.

---

## 5. HOW BUYING DECISIONS ARE SUPPORTED

**This is the mission's most consequential deliverable, and the finding is not in the code. It is in the canon's silence.**

### 5.1 The Experience canon does not know THA sells anything

**Searched all seven governing Experience documents** — `THA_EXPERIENCE_BLUEPRINT.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_ORCHARD_LIVING_BOOK.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_KEPT_ROOM_TRANSLATION.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, and `EXP5` — **for**: `price`, `prices`, `pricing`, `money`, `commerce`, `retailer`, `supermarket`, `checkout`, `affiliate`, `revenue`, `monetise`, `monetize`.

> **Zero hits.** *(The only matches in the whole set are the word "price" appearing nowhere and the rollback footers of two documents. `cost` appears only as **attention cost** and **effort cost**; `buy` appears only in `EXPARCH:178` — "every added tap must **buy** the person something" — a metaphor about effort.)*

**The canon mentions commerce exactly four times, and every one is a prohibition:**

- `EXPLANG:413` — *"the list is done… **with no upsell at the finish line**."*
- `EXPLANG:379` — *"never a dead end, **never an upsell**, never an immediate demand for the next task."*
- `EXPLANG:493` — a Review Question: *"Does the person end this in a restful state, **not a dead end or an upsell**?"*
- `EXPARCH:176` — *"never into a dead end **or an upsell**."*

And `EXPARCH:140` completes it: the primary action is *"never 'upgrade', 'share', or **whatever the business currently wishes people did more**."*

> **THA's emotional constitution, its blueprint, its design language, its lived account and its behavioural law — five documents, ~2,600 lines — say nothing whatever about how it should feel to spend money, and mention money only to forbid being sold to.**

**Meanwhile the live room runs a shop:** fifteen `/api/basket/*` and `/api/supermarkets/*` endpoints including **`POST /api/basket/checkout`** (`routes.ts:829`), nine UK retailers (`supermarket-basket-service.ts:224`), real prices (`:159`, `:193`), per-supermarket and per-tier totals (`routes.ts:4455`), and a retailer basket handoff.

### 5.2 This is a gap, and it must be stated precisely — not overclaimed

**Commerce is not ungoverned.** `docs/architecture/capabilities/partners.md` is **governing architecture** and is indexed in the README. It owns *Partners / Supermarkets* — and it is unsparing about its own subject (`partners.md`, Honest gaps):

> *"**MAJOR FINDING** — none of the three apiSurface routes the registry lists are what 'Partners / Supermarkets' implies"* — `/api/routing` is *"NOT retailer routing"*; `/api/savings/aggregates` is *"NOT retailer price-comparison savings"*. Only `read`, scoped to *"the static 9-retailer list"*, is executable; *"`recommend` and `compare` have **NO safe, grounded owner**"*.

**So the precise statement is this, and no more:**

> **A Capability Card governs what the *Companion* may say about retailers. No document governs what it should *feel like* to be a household spending money inside a house whose entire emotional constitution was written about calm, care, and having nothing sold to you.**

**This is not a defect in any document.** Each of the seven is doing exactly its stated job, and `EXPLANG § 8` is explicit that it *"owns feeling and nothing else"*. **It is a question no one has been asked**, and it sits precisely where `BLUEPRINT § 4.1`'s metaphor runs out: *"Shopping is preparing to leave the house."* **The house ends at the door. The money is spent outside it — and the code brought the shop indoors without anyone writing down how that should feel.**

**Recorded and routed (§ 14.4), not answered.** Answering it would be creating governing law inside an investigation, which `PKR1` R7 and `NORTH2` both forbid.

### 5.3 What *is* owned, and it is owned well

`SHOP1 § 2:67-96` already did the hardest reasoning this deliverable needs, and **it did it by splitting the mission's own phrase in half.** Asked for *"healthier product recommendations"*, it found `shared/alternatives/trust.ts` **bans the word "healthier"** and fails closed — so it separated:

| Level | Question | Owner | May it rank? |
|---|---|---|---|
| **FOOD** | *"What else could fill this role?"* | WS9 `shared/alternatives` | **No** |
| **PRODUCT** | *"Is this product well-rated?"* | Analyser `calculateTHAAppleRating` | **Yes** — *"a rating is literally what it computes"* |

And it fixed the governing grammar test (`SHOP1:75`):

> *"**Could a kind, knowledgeable friend say this sentence to your face, about a food you just chose, without it sounding like a correction?** If not, it is banned."*

> **That sentence is `OLB:100`'s Companion — *"the friend who catches you at the threshold"* — expressed as a string-validation rule, written independently, three days before the Living Book gave the friend those words.** It is the fourth time this audit series has found the canon and the engine writing the same law in the same voice without ever having been introduced.

SHOP1 refused, mechanically and for every string it emits: the words *"healthier"/"better"/"you should swap"* (`:91`); **treating an unrated line as a 0 to beat** (`:147-150`); any write path at all (`:249`).

> **`SHOP1:147-150` refused the exact fabrication that `shopping-list-page.tsx:1150` commits.** The engine declines to treat a null as a zero; the client turns the same null into *"Industrial"*. **The rule is written, held on the server, and broken in the browser.**

### 5.4 SHOP1 named this workstream, and named its own gaps

`SHOP1:320-327` — *"**SHOP2** — retire client-side product reasoning. Move `rankChoices`/`buildWhyBetter` behind the Analyser (server-side, typed, cited), rewire `WorkspaceAnalyserSheet.tsx` and `shopping-list-page.tsx` to render server output, delete `analyser-choice.ts` and `whole-food-alternatives.ts`, and delete the dead `/api/product-alternatives` route."*

It also named the **drift risk** (`:329-334`) — the client ranker weighs NOVA and additive counts; the server states only the rating (`upf-analysis-service.ts:401` — *"**NOVA is not a factor.** Score is deterministic and ingredient-text-driven"*) — so *"a household could see the Analyser modal and the shopping card **disagree about which product is preferable**"*; the **WS9 content gap** (`:425`) — only **6 of 10 anchors** carry `lower_upf` options, so the less-processed card *"will fire rarely"*, its *"single highest-leverage follow-up"*; the **coverage gap** (`:428-434`) — *"a household working from `/basket` will therefore **not see a single SHOP1 card**"*; and its own honest state (`:391`): *"**nobody has yet watched a SHOP1 card appear on the shopping workspace**."*

**This document adds one thing to that list and stops:** the same `/basket` surface that receives none of SHOP1's cards is the one **rendering the fabricated verdicts SHOP1 refused** (§ 5.2, § 11.3) — *and it is the surface the Dashboard sends households to three times.*

---

## 6. HOW CONFIDENCE IS CREATED

**Owned three times, structurally, and each owner is genuinely good. The finding is that the room has a confidence field it has never once shown anyone.**

### 6.1 The canon's answer: confidence is created by refusing to guess

`EXPLANG:409` — *"the list reflects the plan honestly; **quantities and items feel trustworthy and complete**."*

The platform's three answers, each a real running gate:

- **Resolution** — `server/lib/item-resolver.ts:13`: *"**Never silently force a bad category — prefer `needs_review` over a wrong guess.**"* Every entry point must pass through it (`:4-6`), and the POST route honours it: a resolver failure marks the item `needs_review` / `unrecognised_item` rather than dropping it (`routes.ts:3666-3683`), and resolution fields are *"always taken from the resolver, never the client"* (`:3693`).
- **Scoring** — `shared/apple-score-trust.ts:31-33`: *"**A product may only display an authoritative Apple Score if it is a trusted whole food OR a resolved analysed product.**"*
- **Pricing** — `routes.ts:4341-4351`, the **HARD FAIL-SAFE**, and the best comment in the domain:

> *"**HARD FAIL-SAFE: never look up prices for unrecognised items.** Use only the stored category — do NOT run keyword detection on the product name here. The product name may have been assigned by AI from a nonsense input (e.g. "Boorboans"→"Bourbon Biscuits"), and keyword-matching it would silently grant it a real category and **trigger fake prices**."*

> **THA's shopping domain has independently arrived at the same doctrine three times, in three files, in three registers: a bad guess is worse than an admitted gap.** That is `ARCHITECTURE_PRINCIPLES.md:74`'s Principle 6 — *"honest gaps over invented facts"* — implemented by people who appear never to have needed to be told.

**And the failures propagate honestly**: an unmatched item gets **no `product_matches` rows** — no placeholder, no fabricated price — and because SHOP1's cards read `product_matches`, it silently gets no rating card either. **The absence travels.**

### 6.2 The field built to carry confidence is rendered nowhere

`shopping_list.confidenceLevel` and `confidenceReason` exist (`schema.ts:201-202`), are writable via PATCH (`routes.ts:3862-3863`), are carried through the storage `Pick` types (`storage.ts:79`, `:753`), **and reach the Intelligence read handler** (`shopping-read-handler.ts:64`, `:128`).

> **Grep of the entire `client/src` for `confidenceLevel` or `confidenceReason` returns zero hits.** The column is plumbed end-to-end on the server and **dead at the presentation layer.**

**This is the third instance of one shape in three consecutive audits**, and it is now a pattern rather than a coincidence:

| Room | The honest signal | Where it dies |
|---|---|---|
| **Pantry** | `isDefault` — *"we put this here, not you"* | Declared on the client type, `pantry-page.tsx:58`, never used |
| **Shopping** | `confidenceLevel` — *"how sure we are"* | Reaches the Intelligence handler; **zero** client hits |
| **Shopping** | `headerStatusText` — *"14 items in list"* | Computed at `:2176`, container gated `:2202` |

> **THA does not have a confidence problem. It has a *last-inch* problem.** The gates are real, the fields are computed, the values reach the browser — and the sentence that would tell the household is dropped at the final step, three times, in three rooms, by three different mechanisms.

**What the household sees instead is good**, and should be recorded as such: the resolution lifecycle — `resolutionState` (`raw | needs_review | resolved | matched_to_product`), `reviewReason`, `reviewSuggestions` (`schema.ts:210-222`) — plus the trust gate's honest labels, *"Analysis Required"* / *"Select Product"* (`apple-score-trust.ts:80-85`). **The room tells you it does not know. It does not tell you how sure it is when it does.**

### 6.3 The trust gate's own declared risks are this room's confidence ceiling

`docs/implementation/ux/apple-score-trust-gate-complete.txt` decided enforcement is **purely at the display layer** — *"no schema changes, no scoring formula changes, no server-side modifications"* (`:8-9`) — so an auto-estimated score on an unresolved packaged item is **blocked and replaced with "Analysis required"** (`:29-32`) while **the number stays in the database** (`:120-123`).

It declared three live risks (`:148-166`), all of which are this room's:

- **(a)** `autoSmp` still writes scores for unresolved packaged items. The proposed fix — a `thaRatingSource` column distinguishing `auto_estimated` from `product_confirmed` — **"REQUIRES APPROVAL before any such schema change"** (`:155`).
- **(b)** Sort-by-apple-score **still sorts by the ungated `thaRating`**, including blocked auto-scores — justified as *"an organisational feature, not an authoritative score display"*. **Recorded without a verdict**: it is defensible, and it means the household's list order is partly set by numbers the platform has decided it may not show them.
- **(c)** `getItemThaRating()` falls through to `productMatches.thaRating` **ungated**.

**And one dead arm:** `deriveAppleScoreTrustState` (`:35-57`) **can never return `MANUAL_OVERRIDE`** — no branch produces it — so that clause of `canShowAuthoritativeAppleScore` (`:72`) is unreachable. The document admits it (*"Reserved for future use"*, `:37`). **Recorded, not graded** — a documented reservation is not a defect.

> **A trust gate enforced only at the display layer is `PKCA:169`'s Rule KC8 exactly: *"A trust rule that exists only as prose… is not yet a trust guarantee — it is a hope."*** Here it is better than prose — it is a real function — **but it guards the window, not the well**, and `shopping-list-page.tsx:1150` is what walking around it looks like.

---

## 7. HOW THE PLANNER, COOKBOOK AND PANTRY FEED SHOPPING

**Two of the three feeds are built and genuinely good. The third is refused — deliberately, in writing, for a reason worth protecting.**

### 7.1 Planner → Shopping: the best-engineered path in the domain

`POST /api/shopping-list/from-meals` (`routes.ts:4132-4314`):

- **Freezer stock is deducted first** (`:4170-4176`) — if frozen portions cover the request, the meal is skipped entirely. *The house checks its own freezer before it writes a list.*
- **Ready meals are not decomposed** (`:4220-4244`) — a pack is a pack, one line.
- **Quantities aggregate**: `consolidateAndNormalize` (`:4248`) keys on `` `${normalizedName}|${parsed.unit}` `` and sums (`ingredient-utils.ts:881`, `:885`). **Two meals each needing one onion produce one row, quantity two.** A second pass reconciles `g`/`ml`/`unit` variants (`:899-927`).
- **Dedupe happens twice** — in memory, then at the DB on `householdId + normalizedName + unit` (`storage.ts:709-713`), **adding to the existing row rather than inserting** (`:723-726`). Re-running increments; it does not duplicate.
- **Member swaps are protected** — `vegetarian_swap`, `keto_swap`, `optional` are excluded from merging (`:701-717`) *"so a vegetarian swap never collapses into the shared ingredient line."*

> **Against `EXPLANG:409` — *"quantities and items feel trustworthy and complete"* — this is the beat met by construction.** It is also the answer to the mission's word *"naturally"*: **the feed is natural because it aggregates like a person would.** Recorded as a PASS, and the strongest engineering in this room.

**One caveat, reported not graded:** `ingredientMatchesMeal` (`routes.ts:255-279`) accepts a **substring match** (`:266-268`) and **60% token overlap** (`:270-275`), so *"onion"* and *"spring onion"* cross-attribute. **An item can claim provenance from a meal that did not contribute it.** This affects the *"From <meal>"* line, not the quantities.

### 7.2 Cookbook → Shopping: it exists, and it is the Planner's wire

`meal-detail-page.tsx:335-352` POSTs `from-meals` with `{ mealSelections: [{ mealId, count: 1 }] }` — **the same route**, full ingredient decomposition. A second path (`:354-369`) adds the meal name as a single line. The pattern repeats at `meals-page.tsx:427`, `:470`, `:734`, `:751`.

> **The Cookbook does not have a shopping wire. It is a caller of the Planner's.** That is the correct shape — one owner, one funnel — and it means every finding in § 7.1 and § 7.3 applies to the Cookbook identically, without anyone having to maintain a second path.

**But `COOK1 § 1.1`'s defect reaches through it.** `from-meals` gates meals on `meal.userId === req.user!.id || meal.isSystemMeal` (`routes.ts:4168`) — a **user-scoped** read — and then writes the result into a **household-scoped** list (`storage.ts:680`).

> **A household member cannot generate a shopping list from their partner's recipe.** The seam is exactly where `COOK1` said it was: *the shared table draws from private books*. **Invisible in every single-member household**, and it is the same one line of scope.

### 7.3 Pantry → Shopping: one direction only, and the refusal is principled

**The Pantry feeds Shopping**: `pantry-page.tsx:442-467` POSTs each selected item with `source: "pantry"` (`:454`), and the source survives (`storage.ts:688-690` — *"Caller-supplied source wins"*).

**Shopping never asks the Pantry anything.** `from-meals` (`:4132-4314`) contains **zero pantry reads** — verified against every `getPantryItems` call site in `server/`; none is in the generation path. `SHOP1:419` states it as a deliberate exclusion:

> *"Deducting the pantry during shopping-list generation (`POST /api/shopping-list/from-meals` **still never consults the pantry** — SHOP1 *surfaces* the duplicate, it does not *prevent* it)."*

and `SHOP1:426`:

> *"The pantry↔shopping disconnect at *generation* time is the deeper fix: **SHOP1 tells a household they already own something *after* it lands on the list.**"*

**The near-miss is the important part.** `shopping_list.cupboardQuantity` (`schema.ts:223-224`) — *"how much the user already has at home (partial cupboard check)"* — looks exactly like the pantry bridge and is **hand-edited only** (its sole server write is `routes.ts:3876-3885`). **SHOP1 refused to wire it, and the reason is the one to protect** (`SHOP1:129-131`):

> *"`shopping_list.cupboardQuantity` is **deliberately NOT read or written** — it is a separate hand-edited field not derived from the pantry, and **deriving it here would give one fact two owners**."*

> **That is `ARCHITECTURE_PRINCIPLES.md` Principle 2 held under pressure, by an implementation that wanted the feature.** Any future pantry-at-generation work must resolve the **ownership** question first, not merely add the read — and `PANTRY1 § 1.1` supplies the reason it must not be rushed: **~141 pantry items are fabricated.** A generation path that deducted today's pantry would silently remove real groceries from a real list on the strength of a hardcoded array.

> **The two rooms' defects compose into something worse than either.** Recorded here because neither investigation could see it alone: **Shopping must not read the Pantry until the Pantry is true.**

### 7.4 The provenance the household is owed is built, read, rendered — and never written

`getItemAttributionText` (`shopping-list-page.tsx:96-109`) already composes *"Added by Dad"*, *"Needed for Tuesday dinner"*, and *"From <meal>"*. The schema carries `weekNumber`, `dayOfWeek`, `mealSlot` (`schema.ts:590-592`). The read path returns them (`routes.ts:4574-4583`).

> **`addIngredientSource` has exactly two call sites — `routes.ts:4236` and `:4283` — and neither passes `dayOfWeek`, `weekNumber` or `mealSlot`.** The columns are always NULL, so the *"Needed for Tuesday dinner"* branch (`:102-104`) is **unreachable**. The household is told *which meal*, never *which day*.

**The schema, the read, and the UI all support day-level provenance. Only the write is missing.** It is the cheapest genuine improvement in this document (§ 14.5) — and it is `EXPLANG:409`'s *"the list reflects the plan honestly"* at its most literal: **the list can currently say what a thing is for, but not when.**

---

## 8. HOW THE COMPANION QUIETLY PARTICIPATES

**Owned in full — and this room, like the Pantry, has a line the canon writes out in full.**

- **Its place** — `BLUEPRINT § 13` — *"not a room… the person in the house"*; *"One presence, one fixed chair"*; *"It arrives a beat after you."*
- **Its translation** — `TRANSLATION1:369-383` — *"Invited, not intrusive; suggesting, never deciding; honest about its limits; silence a valid state."*
- **Its volume** — `NOTICE_ENGINE § 6` — *"**Honest absence.** No producer data → no notice → an empty set."*
- **Its conduct in *this* room** — `OLB:100`:

> *"The Companion is **the friend who catches you at the threshold** — **"you're out of the thing you use every week,"** offered once, easy to take or leave. **It helps you leave prepared; it never holds you at the door.**"*

**Every clause is load-bearing, and the last one is the room's whole Companion law.** *"Never holds you at the door"* is P1 (§ 3) enforced against the one actor with a motive to break it: a Companion that helps you leave is a friend; a Companion that has one more thing to show you before you go is a checkout queue.

### 8.1 The friend is in the right chair, and the title proves it

`shopping-workspace-page.tsx:2310-2315` — `AmbientIntelligence surfaceKey="shopping"`, `domains={["shopping"]}`, **`title="Worth a look before you shop"`**. It self-hides: `AmbientIntelligence.tsx:105` — `if (isPending || items.length === 0) return null;`, with the comment *"nothing to say → say nothing."*

> ***"Worth a look before you shop"* is `OLB:100`'s threshold, in production.** *Before you shop* — it is timed to the leaving, offered once, and it is the only title in the house with a **deadline built into its grammar**. **`PANTRY1 § 8.1` found the Pantry's title was that chapter's own sentence; Shopping's is its chapter's own *moment*.** Recorded as a PASS.

**And the safety card is exemplary.** `shopping-restriction-conflict` (`opportunity-engine.ts:290-318`) fires on **unchecked** items only (`:298` — *"already actioned by the household — not an open opportunity"*), reuses `resolveIngredientRestrictions` rather than writing a second matcher, cites **two evidence rows** (`:309-312`), and **never modifies the list** (`:276-288` — *"it only surfaces the conflict as a suggestion for the human to review"*).

It is **the platform's sole `critical` emitter**, and the allowlist is **structurally enforced, not conventional** (`shared/attention/index.ts:80-89`, `:115-121` — `assertCriticalAllowed` **throws**):

> *"`critical` is valuable precisely and only in proportion to how rarely it is used… so no future producer can inflate an inconvenience into a harm signal merely by naming it `critical`."*

> **The one place THA is permitted to raise its voice is in the room where the household is about to spend money on something that could hurt someone — and the platform has made it structurally impossible for anything else to claim that voice.** That is the best single piece of architecture this four-room audit has touched.

### 8.2 …and the friend is not standing at the other door

**`shopping-list-page.tsx` mounts no `AmbientIntelligence`** — zero hits. So on `/basket`:

- **No SHOP1 cards** — `SHOP1:428-434` names this: *"a household working from `/basket` will therefore not see a single SHOP1 card."*
- **No `shopping-restriction-conflict`.** The platform's only `critical` safety signal — the allergen conflict — **does not render on the surface the Dashboard links to three times** (`dashboard.tsx:394`, `:449`, `:671`).

> **This is the finding to act on.** The signal is architecturally perfect, structurally protected, and **absent from one of the room's two doors** — the door the canon never knew existed (§ 11.2) and the household is sent to from Home.

*(`shopping-list-page.tsx` has its own `ShoppingIntelligencePanel` (`:895`) — a per-item panel, a separate channel. It is not the Companion, and it does not carry the conflict.)*

### 8.3 The question `PLAN1` and `COOK1` both left open is answered here

Both recorded that no governing document says what the friend does when **two people** are involved. **Shopping answers it** — `shopping_list` is household-scoped (`storage.ts:678-681`), records `addedByUserId` on every insert (`:691`, `:744`), resolves it to a name (`:2814-2819`), and renders *"Added by Dad"* (`shopping-list-page.tsx:98`).

**And it protects the answer**: `storage.ts:2805-2806` — *"Always order by id (insertion order) so that marking an item 'already_got' / 'in_basket' **never changes its position** in the list after the query refetches."*

> **Someone thought about two people using this list at once, and then thought about how it would feel if the list moved under their hands.** § 12.1.

---

## 9. MOMENTS OF DELIGHT

**The list of qualifying moments is closed, and this room is named in the refusal — twice.** `EXPARCH § 17.9:333-341` owns which moments qualify: a household's **first genuine outcome** — *"a first plan made, **a first list completed**"* (`:337`); the **completion of a journey that had real effort in it**; an **honest milestone the household would themselves recognise**. Everything else *"resolves quietly and without ceremony"* (`:341`).

### 9.1 Shopping owns one of only two named qualifying moments in the entire canon

`EXPARCH:337` names exactly two examples: *"a first plan made, **a first list completed**"*.

> **Of the house's ten rooms, the canon's closed list of qualifying premium moments names two — and one of them is Shopping's.** The Planner has the other. **The Cookbook, the Pantry, Nutrition, the Diary and the Analyser have none.** *(`ORCH1:39` already noted where that list stops: it does not name a first meal cooked — THA's celebration list stops exactly where its sight stops.)*

### 9.2 …and the canon then forbids celebrating it

`OLB:102` — *"**Never here — confetti or celebration for finishing a shopping list.**"* `OHDB:268` — *"**Things to avoid.** Confetti or reward animation on completion (decorative delight; earned delight only)."* `EXPLANG:413` — *"a **quiet**, satisfying, complete state."*

**This is not a contradiction, and reading it as one is the trap.** `EXPARCH:341` resolves it in the same breath as the permission: *"even a qualifying moment stays inside THA's calm register: **acknowledgement, not celebration theatre**."*

> **Shopping is the sharpest test of the delight law in the house: the canon says the moment *qualifies*, and then says the obvious way to mark it is *forbidden*. The permitted expression of THA's most-earned moment is that the list is simply, quietly, done — and the room lets you leave.** `OLB:103` — *"the light, competent feeling of heading out prepared."*

### 9.3 The Living Detail is met exactly — the audit's cleanest PASS

`BLUEPRINT:313` — *"**The crossing-off** | Shopping | List item state | *The trip is working* | **Struck and settled into shade; no celebration per item**."*

Live (`shopping-workspace-page.tsx:835`): `item.checked ? "line-through text-muted-foreground" : "text-foreground"`. The row carries `transition-colors` (`:798`) — a colour fade, no transform, no height animation. The mutation (`:1483-1511`) has **no `onSuccess` handler at all**: optimistic update, error toast, nothing else.

**And `grep -rn "confetti\|canvas-confetti" client/src` returns zero hits. There is no confetti library in `package.json`.**

> ***"Struck and settled into shade; no celebration per item."*** **`line-through text-muted-foreground` is literally struck and shaded, and the mutation has no success path to celebrate from. The ceiling is not merely respected — it is met to the word, and the room could not celebrate an item if it wanted to.**

### 9.4 The one line to watch

`shopping-workspace-page.tsx:2686-2696` — when nothing is left to find, Shop mode renders an emerald tick and:

> **"All items accounted for"** / **"Great shop — nothing left to find"**

**Reported precisely, because precision is the whole point here.** It is **static** — no animation, no confetti, no interstitial — so it does not touch `OHDB:268`'s *"confetti or reward animation"*, and `CelebrationCard` is imported **only** by the Planner (`PlannerIntelligenceStrip.tsx:28`), never here. The first line is a clean state report and passes `EXPLANG:413` outright.

**The second line is praise.** *"Great shop"* commends the household on their shopping. Against `OLB:102`'s *"celebration for finishing a shopping list"* and `EXPARCH:341`'s *"acknowledgement, not celebration theatre"*, it sits on the line: **it is not theatre, and it is not acknowledgement either — it is a compliment.**

> **Recorded as the room's one line to watch, not as a violation.** The distinction that decides it is `EXPARCH § 17.9`'s own: *"an honest milestone the household would themselves recognise"* — **a household finishing a shop would recognise the milestone and would not describe it as *great*.** This is a copy decision for a workstream with a view of the whole room, not a fix for an investigation.

---

## 10. ANTI-PATTERNS TO AVOID

Every one is **already forbidden by a rule with an owner**. Listed because Shopping is the room each is most likely to enter, with the entry route named.

### 10.1 The upsell at the finish line

`EXPLANG:413` — *"with **no upsell at the finish line**."* `EXPLANG:379`, `:493`; `EXPARCH:176`; `EXPARCH:140` — *"never 'upgrade'… or whatever the business currently wishes people did more."*

**Entry route: the only one the canon names four times, and the only commercial rule it has.** § 5.1 is the reason it matters more here than anywhere: **this room already runs a checkout** (`routes.ts:829`), and the canon's *only* instruction about money is *don't sell at the end*. **A room with a checkout and one rule about commerce should treat that rule as load-bearing rather than as a formality.** Nothing in the live room violates it today — **there is no upsell anywhere in either shopping surface, verified.** Recorded to keep it that way.

### 10.2 The quick room turned into a place that asks you to linger

`OLB:102` — *"**the quick room turned into a place that asks you to linger**."* `BLUEPRINT:174` — *"passed through, not lingered in."* `EXPARCH:178` — *"every added tap must buy the person something."*

**Entry route: every good idea this room will ever have.** Price comparison, per-retailer totals, better-product cards, basket analysis — each is genuinely useful and each is a reason to stay. **The live room already has a 4,242-line surface built entirely out of reasons to stay** (§ 11.2), and its own canonical page links to it (`:2770`).

> **This is the anti-pattern most likely to be *reasoned into*, because every step is defensible and only the sum is wrong.** P1's test is the one to apply: *does this help them leave prepared, or does it hold them at the door?* (`OLB:100`).

### 10.3 All view, no room — and it is live, in the room's own default

`BLUEPRINT:442` — *"**All view, no room.** A working surface that is mostly environment — **a search box floating on a landscape**, a list above two-thirds of raw scenery. It reads as *nobody home*."* `OHDB:268` — Shopping's own row: *"**a full landscape behind a short list** (all view, no room)."*

**Entry route: taken, and by the room's default arrival.** `shopping-workspace-page.tsx:2325-2333` gives the Add-mode writing surface **its own `backgroundImage: url('/orchard-bg.webp')`**, with `:2336` laying `rgba(255,255,255,0.80)` over it.

> **On a default arrival, Shopping is an input box on a picture of an orchard. `BLUEPRINT:442`'s anti-pattern is *"a search box floating on a landscape"*. The room's default state is that sentence, rendered.**

**And it breaks the exposure law twice over.** Shopping is **E1** — *"the orchard as illumination and warmth, **not image**… you don't see it while working"* (`BLUEPRINT:223`) — and the room renders the orchard **image** twice: once globally (`orchard-backdrop.tsx:18`, `opacity: 0.90`) and once locally in its own panel. `OHDB:193` has the phrase for it, coined about seasonal dressing: ***"it is a second orchard by the back door."***

> **Shopping has built one. Not as a metaphor — as an `<img>` and a `backgroundImage`, stacked.**

*(And the tint is `rgba(255,255,255,0.80)` — **not theme-aware**, unlike every `bg-card/NN` on the page. In dark mode it is a bright white panel in a dark shell. Recorded under § 11.5.)*

### 10.4 The scold at the door

`OLB:100` — *"never something that makes you feel you've been caught out"* is the Pantry's clause; Shopping's is `:100`'s *"**easy to take or leave**"* and `SHOP1:75`'s grammar test — *"without it sounding like a correction."* `stories/types.ts:14` — *"NO deficits"*.

**Entry route: `shopping-list-page.tsx:1150`, and it is live** (§ 5.2, § 11.3). **"Industrial", in red, about a banana THA never scored** is a correction — of a food the household already chose, at the moment they are trying to leave. **It is the exact sentence SHOP1's grammar test was written to make impossible**, arriving from a file SHOP1 never touched.

### 10.5 Marketing gimmicks in a functional workspace

`EXPLANG:538` — *"**Marketing-style gimmicks inside functional workspaces.** Splash screens, celebratory interstitials, loading theatre, hype copy, exclamation urgency, or 'delight' that costs the person time — friction wearing the costume of premium. **The working product is never a campaign.**"*

**Entry route: the retailer relationship.** This is the room where a partner logo, a "deal", or a promoted product would arrive wearing a business rationale rather than a household one. **`EXPARCH:140` pre-refuses it** — *"never… whatever the business currently wishes people did more"* — and § 5.1 is the reason it needs saying: **the canon has no positive account of commerce to weigh against a commercial proposal, so the only thing standing here is a prohibition.** § 14.4.

### 10.6 Clinical minimalism — and this room is *supposed* to be plain

`EXPLANG:546` — *"**Clinical minimalism.** Emptiness and sterility wearing the costume of elegance… the room with the furniture removed."* `EXPLANG § 3A.4:133` — *"**Calm must never become lifeless.**"*

**Entry route: fixing § 10.3.** Identical in shape to `PLAN1 § 10.5`, `COOK1 § 11.6` and `PANTRY1 § 10.6` — and **uniquely tricky here**, because Shopping is the one room the canon *wants* plain: *"plain and bright, the light of a hallway"* (`OLB:98`). **There is no warmth budget to restore.** The room's entire defence against sterility is one word — `OLB:103`'s **competent** — and the household's own list. **Strip the second orchard and what must remain is not warmth but *competence*: the list, legible, correct, and ready.**

### 10.7 The Companion holding you at the door

`OLB:100` — *"**It helps you leave prepared; it never holds you at the door.**"* `TRANSLATION1:371-383` — *"suggesting, never deciding."* `NOTICE_ENGINE:135` — *"**No notice executes anything.**"*

**Entry route: the safety card's own success.** `shopping-restriction-conflict` is `critical`, exempt from muting, and fills the attention budget first (`shared/attention/index.ts:98-106`). **It has earned every one of those exemptions** (§ 8.1) — and it is precisely because they are correct that nothing else may acquire them. `attention/index.ts:80-89` already makes that structural. **Recorded to name what the exemption is *for*: the one thing worth holding a household at the door for is the thing that could hurt someone.**

---

## 11. WHAT THE LIVE SHOPPING IS DOING INSTEAD — REPORTED, NOT FIXED

Verified against live code at `7d1dd2ce`. **Nothing here was changed.** Each is a **conformance defect against an owned rule** — `NORTH2:220-229`'s category: *"not gaps in the architecture; they are the product disagreeing with it… **All of them require work.**"*

### 11.1 The room does not show the list — the defect

§ 1.1, § 1.2, § 1.3. `shopping-workspace-page.tsx:1212-1217` (default `"add"`), `:2551` (list gated `mode !== "add"`), `nav-bar.tsx:43`/`:458`/`:512` (no `?stage=`), `:2340-2352` + `:1318-1320` (empty auto-focused textarea), `:2176-2178` + `:2202` (the discarded string).

> **Shopping scores **zero** always-on strips between its page container and its content — tying the Cookbook, beating the Pantry's one and the Planner's five. It scores zero because the content is not there to bury.** The cleanest arrival in the house is clean because it is empty.

### 11.2 The room has two doors, and `WX10C` closed the wrong one

§ 1.4. `App.tsx:387-388`; `dashboard.tsx:394`, `:449`, `:671`; `shopping-workspace-page.tsx:2770`; `nav-bar.tsx:663` (an alias map lighting the Shopping pip for `/basket`).

**`WX10C` (2026-06-27) resolved a *different* duplication** — `ListPage` ("Quick List") vs `ShoppingWorkspacePage` — declared `/shopping-workspace` canonical, redirected `/list` and `/shopping-list`, and ticked *"No duplicate shopping workflows ✅"* / *"No duplicate routes left active ✅"*.

> **`WX10C` never mentions `shopping-list-page.tsx`.** Its compliance table is true of the nav and false of the app. **The two surfaces are not redundant** — the workspace's own footer concedes the old page holds capability it lacks (`:2770`) — which means this is an **unresolved ownership question wearing a resolved tick**, and `EXPARCH:211`'s one-name-per-concept plus `BLUEPRINT § 5`'s *"never a separate application wearing the same colours"* both bind it.

**And a dead link:** `shopping-workspace-page.tsx:2155` — `<Link href="/shopping">` on a `DropdownMenuItem` labelled **"Basket"**. **There is no `/shopping` route**; it falls to `App.tsx:419`'s `NotFound`. **The canonical page's Basket menu item navigates to a 404.**

### 11.3 "Industrial" — the fabricated verdict

§ 1.5, § 5.2, § 10.4. `shopping-list-page.tsx:1150` (the verdict), `:888`, `:929`, `:1141` (0-apple ratings), `:1023`, `:1159` (alternatives). `basket-item-classifier.ts:49-57`.

**The canonical workspace pairs the same classifier with a null check** — `shopping-workspace-page.tsx:909`, `:912`, `:1008`: `canShowScoreForItem(item) && item.thaRating != null` — **and is therefore correct.** `ShoppingListView.tsx:1602` is correct. **`shopping-list-page.tsx` is the only surface missing the second clause**, and `:884` in that same file gets it right.

> **This completes a pattern across four rooms, and it is the reason to read them together:**
>
> | Room | The fabrication | Locus |
> |---|---|---|
> | **Planner** | a fabricated **zero** — *"🌱 0/30"* on an empty week | `PlannerIntelligenceStrip.tsx:152-156` |
> | **Cookbook** | a fabricated **verb** — *"Cooked N times"* from plan counts | `CookbookMealIntelligenceStrip.tsx:183-186` |
> | **Pantry** | a fabricated **inventory** — ~141 items nobody added | `storage.ts:2232-2353` |
> | **Shopping** | a fabricated **verdict** — *"Industrial"*, about an unscored banana | `shopping-list-page.tsx:1150` |
>
> **Each room fabricates in its own currency: the Planner counts, the Cookbook remembers, the Pantry stocks, Shopping judges. Every one is a `?? 0` or its cousin, added by a client, over a server that returned an honest null.** *(`routes.ts:4115` — a `0` rating is `skipped`, never written. The server has never fabricated a score.)*

### 11.4 `Est. total` — real numbers, dishonest framing

`shopping-list-page.tsx:4107-4109` renders `` `Est. total: ${basketResult.estimatedTotal.toFixed(2)}` ``.

**The server is honest**: `supermarket-basket-service.ts:212` returns `undefined` rather than `0` when nothing is priced — *a priceless basket has no total, not a £0 total.* Prices are **real** retailer prices (`:159`, `:193`).

**The render is not**, in two ways:

1. **It is a partial sum presented as a total.** The loop only adds inside `if (supermarketMatch)` → `if (supermarketMatch.price)` (`:161-200`); **unmatched items contribute nothing.** A ten-item list with three priced matches renders `Est. total: 12.40` — the cost of three items. The sibling `message` (*"3 of 10 items matched"*, `:213-215`) states the count and **never connects it to the total**. Against `EXPLANG:409` — *"quantities and items feel trustworthy and **complete**"*.
2. **No currency symbol.** `.toFixed(2)` renders bare. `ShoppingListView.tsx:1969` renders `£{cheaperMatch.price.toFixed(2)}` correctly, and the `total-cost` endpoint returns a `currency` field this call site does not use (`shopping-list-page.tsx:1815`).

*(`estimatedTotal?: number` is declared in the canonical workspace's state type at `:1244` and **never rendered** — the canonical surface shows no basket total at all. Recorded: the honest room shows no total; the dishonest one shows a partial.)*

### 11.5 The material diverges three ways, and one of them is a second orchard

§ 10.3. **The global orchard applies unmodified** (`orchard-backdrop.tsx:18`, `opacity: 0.90`, mounted `App.tsx:210`).

**The card system does not.** `card.tsx:11` — `bg-card/82 backdrop-blur-md`. In `shopping-workspace-page.tsx`:

- **`<Card>` is imported (`:42`) and never rendered.** The list is a raw div — `:2569`: `bg-card/60`, **no `backdrop-blur-md`**. Also `:2490`, `:2507`, `:2535`, `:2558`. **22 points more transparent than the platform card, and unblurred — orchard detail reads through the list sharp.**
- **`bg-card` at full opacity** (`:2852`, `:2873`, `:2892`) — a third material in one file.
- **The second orchard** (`:2325-2333`) + a non-theme-aware white tint (`:2336`).

Against `BLUEPRINT § 5`'s *"A room is differentiated by purpose, light, material, and one sign of life — **never by its own architecture, navigation, palette, or theme**"* and `OHDB:108` — *"A room is a **use** of the shared furniture… never a fork of it into a bespoke style."*

> **This is `BLUEPRINT:440`'s *costume* — *"A realm growing its own… component styling… to 'feel like itself'"* — and it is the only room of the four where the divergence is the room's own code rather than `card.tsx:12` reaching it.** `PLAN1`, `COOK1` and `PANTRY1` all found one shared defect in four rooms. **Shopping added three of its own.**

### 11.6 Recorded as PASSes, and they are substantial

- **The crossing-off is met to the word** (§ 9.3). No confetti exists in the codebase.
- **No scoreboard, no progress bar, no percentage, no streak, no savings claim** anywhere in either shopping surface — verified by grep.
- **The canonical workspace has no framer-motion at all.** All motion is `animate-spin` pending spinners, `animate-pulse` skeletons, and `transition-colors` hover fades. `AppleRating` is called with `animate={false}` at every workspace site (`:1009`). *(The non-canonical `/basket` **does** use framer-motion — `:58`, `:1202`, `:1240`, `:1282`, `:1371`, `:3189`, `:3559`. **The two surfaces have different motion policies**, which is § 11.2 again.)*
- **The `?? 0` in the canonical workspace is honest** — `:373` and `:1559` are consumed by `> 0` tests; the zero case says *"All scores are already up to date."*, never *"0 items"*.
- **The list is household-scoped, records its author, and refuses to reorder under a second pair of hands** (§ 8.3).

### 11.7 The room has no `data-realm`

`grep -rn "data-realm" client/src` returns the Planner, Cookbook, Pantry, Diary, Analyser, List and Plant-diversity pages — **and neither shopping surface.** Shopping's only `data-realm` is on `workspace-header.tsx:243`, which is **portalled out of the page** (`:483` → `App.tsx:216`) into a **sibling** of `<main>`, not an ancestor.

**Reported as a measurement finding, not a defect**: it is why § 11.1's count needed stating twice (0 strips inside the page container; 2 always-on rows if the portalled platform header is counted). **Recorded so the next room audit has a consistent anchor** — and because a realm the DOM cannot name is a realm no automated Blueprint check can ever verify.

---

## 12. CORRECTIONS TO THE CANON

### 12.1 `PLAN1 § 6`'s gap is closed — in this room, already, correctly

`PLAN1 § 6` named *together* as the canon's most-used word about the Planner with no owner, and observed: *"`shopping_list` records one **and surfaces it by name**: **'Dad added this' is already built — for the list by the door, not for the family table.**"*

**Verified from this side, and it is better than PLAN1 could see.** `addedByUserId` (`schema.ts:177`) written on every insert (`storage.ts:691`, `:744`), resolved (`:2814-2819`), rendered (`shopping-list-page.tsx:98`) — **plus** household scoping on every read (`:678-681`, `:2807`, `:2842`), dedupe keyed on `householdId` (`:710`), and insertion-order stability so a second person's checkbox never moves your row (`:2805-2806`).

> **Shopping is the only room of the four that is household-scoped, author-aware, and concurrency-considerate. The Planner has the household and not the hand; the Cookbook has neither; the Pantry has the household and not the hand. Shopping has both, and thought about what it feels like when two people hold the same list.**
>
> **This is the existence proof `PLAN1 § 14.4` and `COOK1 § 15.4` both needed: co-authorship is not a research problem in this codebase. It is done, it is small, and it is forty lines away in a sibling file.**

**One correction to that good news** (§ 7.2): `from-meals` reads meals **user-scoped** (`routes.ts:4168`) and writes **household-scoped** (`storage.ts:680`). **The seam is real and it is `COOK1`'s, not Shopping's.**

### 12.2 The Experience canon has no account of money — reported, not filled

§ 5.1, § 5.2. **Recorded as an open question with a named owner-shaped hole**, not as a defect in any document, and explicitly **not answered here** (§ 13).

### 12.3 `docs/investigations/README.md:12-13` describes a shared vocabulary that is not shared

§ 0.2. `implementation/shopping/` exists; the investigations workstream table has no `shopping` row. **Recorded, not fixed.**

### 12.4 Not a correction — a confirmation worth recording

`SHOP1:391` — *"nobody has yet watched a SHOP1 card appear on the shopping workspace."* **This audit did not watch one either.** It is a static read. **`SHOP1`'s honesty about its own unobserved state is confirmed as still true**, and § 14 does not assume otherwise.

---

## 13. WHAT THIS DOCUMENT DID NOT DO

Stated explicitly, because the mission's constraints were explicit:

- **No screens designed.** No layout, no wireframe, no component, no ASCII sketch, no plate. §§ 3–10 are principles and citations only.
- **Nothing implemented.** No code, no schema, no migration, no route, no token, no colour, no value of any kind. **The `?? 0` at `shopping-list-page.tsx:1150` was not changed**, though § 11.3 is the sharpest live defect here — it is a UI behaviour change on a live surface and belongs to a workstream. **The default `mode` at `:1214` was not changed**, though § 1.1 is the headline — it is a one-word diff with a real design question behind it (§ 14.1).
- **No architecture modified.** All seven governing Experience documents, `ARCHITECTURE_PRINCIPLES.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `capabilities/partners.md`, the Source of Truth Register and `docs/investigations/README.md` are **byte-untouched**. `docs/architecture/README.md` is untouched — this is an investigation and is not indexed as governing (`README.md:4`).
- **No rule created.** Applying `NORTH2`'s gate to my own output: every principle in §§ 3–10 traces to an owner. **If any statement here duplicates a rule owned elsewhere, the statement here is the defect** (`BLUEPRINT § 18`'s yield clause, applied to this file).
- **The § 5 money question not answered** (§ 5.2, § 12.2). Naming it is this document's job; **writing THA's account of commerce is governance's**, and an investigation that wrote it would create the second owner `PKR13` forbids.
- **`SHOP1` not duplicated.** Its § 2 reasoning is cited, never restated. **Its named follow-ons are not re-derived** — § 14 cites them and adds two.
- **`WX10C` not overturned** (§ 11.2). Recorded with citations; the ownership decision is a workstream's.
- **Nothing renamed.** Shopping remains *the list by the door* (`BLUEPRINT:174`). The mission's *"market basket"* is discussed (§ 0.3) and refused.
- **The § 11 defects not fixed.** Reported with file:line, as `EXPCOMP2`, `TIME2`, `HOME3`, `PLAN1`, `COOK1` and `PANTRY1` did.

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**. *(The pre-existing, unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root persists — untracked before this session, noted also by `ORCH1`, `PLAN1`, `COOK1` and `PANTRY1`.)*

---

## 14. RECOMMENDED FOLLOW-ON WORK

By value, ordered by dependency.

1. **Show the household their list.** § 1.1, § 4.1, § 11.1. `shopping-workspace-page.tsx:1214`. **The most valuable item in this document and the only one that is not a defect fix — it is the room's Arrival beat, missing.** The one-word diff (default `"review"` rather than `"add"`) is *probably* wrong on its own: `WX10C` made `add` the default deliberately when it folded Quick List in, and reversing that without reading its reasoning would re-open the duplication it closed. **The honest shape is a workstream that answers one question — *what does a household with a list see when they arrive, and what does a household without one see?* — against `EXPLANG:408` and `BLUEPRINT:229`'s empty-state rule (the room may open its window to E2 when the list is genuinely clear).** Note the free win sitting inside it: `:2176-2178` **already computes *"14 items in list"*** and its container is add-mode-gated (`:2202`).

2. **Stop calling unscored food "Industrial".** § 1.5, § 5.2, § 11.3. `shopping-list-page.tsx:1150`, plus the 0-apple renders at `:888`, `:929`, `:1141`. **The fix is already written three times in this codebase** — `shopping-workspace-page.tsx:909`/`:912`/`:1008` and `ShoppingListView.tsx:1602` all pair the classifier with `!= null`, and `:884` does it in the same file, eight lines up. **This is adding one clause to a condition.** It is not blocked by anything and it needs no design. **Do it first among the fixes** — it is the only one that puts a false verdict about a household's food in front of them, and it is the sentence `SHOP1:147-150` refused to write.

3. **Put the safety card on the other door — or close the door.** § 8.2, § 11.2. **The platform's sole `critical` emitter does not render on `/basket`, and the Dashboard links there three times** (`dashboard.tsx:394`, `:449`, `:671`). Two honest routes: mount `AmbientIntelligence` on `shopping-list-page.tsx`, **or** resolve the ownership question `WX10C` left (`:2770` says the old page is still needed; the tick says it is not). **Resolving ownership is the better one and the bigger one; mounting the card is the safer one and should not wait for it.** Fix the `/shopping` 404 (`:2155`) in the same visit.

4. **Ask governance the question this document may not answer: what does money feel like in this house?** § 5.1, § 5.2, § 12.2. **Seven Experience documents, ~2,600 lines, zero mentions of price, retailer, or checkout — and four prohibitions on upselling.** Meanwhile `POST /api/basket/checkout` is live. `capabilities/partners.md` governs what the *Companion* may say about retailers and states its own major finding that the capability is not what its name implies. **This is not a defect in any document — it is a question nobody has been asked**, and it will be asked by the first commercial proposal rather than before it. **Recommended shape: a governance decision, not an investigation** — the Experience Blueprint owns the house's vision and § 4.1's *"Shopping is preparing to leave the house"* is exactly where the metaphor stops and the shop starts.

5. **Write the day into the provenance.** § 7.4. `addIngredientSource` (`routes.ts:4236`, `:4283`) omits `dayOfWeek`, `weekNumber`, `mealSlot`; **the schema holds them, the read returns them, and the UI already renders them** (`shopping-list-page.tsx:102-104`). **The cheapest real improvement here: two call sites, no schema change, no design.** *"Needed for Tuesday dinner"* is written and unreachable. *(Worth pairing with the over-attribution caveat at `routes.ts:266-275` — a substring matcher that cross-attributes "onion" and "spring onion" will put the wrong day on the right item.)*

6. **Retire the second orchard and the bespoke card materials.** § 10.3, § 11.5. `shopping-workspace-page.tsx:2325-2336` (the second orchard + non-theme-aware white tint), `:2569` et al (`bg-card/60`, unblurred), `:2852`/`:2873`/`:2892` (full-opacity `bg-card`), `:42` (`Card` imported, never used). **Unlike the sibling rooms' orchard finding, this one is the room's own code and is fixable without touching `card.tsx`.** **But do it with § 10.6 in hand**: Shopping has no warmth budget to fall back on, and the thing that must survive the removal is *competence*, not warmth.

7. **`SHOP1`'s own follow-ons remain open and are not re-derived here** (§ 5.4): retire the client-side product reasoning (`SHOP1:320-327` — the work it named `SHOP2`, which this document is **not**); close the client/server ranking **drift** (`:329-334`); fill the **WS9 content gap** (`:425` — 6 of 10 anchors, its *"single highest-leverage follow-up"*). **Note the ID collision this creates:** SHOP1 reserved the name `SHOP2` for the client-reasoning retirement. **This document has taken it for a blueprint.** The next workstream should be named deliberately rather than by sequence.

**Explicitly not recommended:**

- **Wiring the Pantry into list generation.** § 7.3. It is the obvious missing feed and it is the one to *not* build next. `SHOP1:129-131` refused `cupboardQuantity` because *"deriving it here would give one fact two owners"* — **that refusal is correct and should hold** — and `PANTRY1 § 1.1` supplies the harder reason: **~141 pantry items are fabricated.** A generation path that deducted today's pantry would remove real groceries from a real list on the authority of a hardcoded array. **Shopping must not read the Pantry until the Pantry is true.**
- **Any Shopping visual prototype.** `EXP5:951` fixed the sequence — *"each a fresh decision informed by P1's photographs"* — and **P1 (Home) has not run.**
- **Changing "Great shop — nothing left to find".** § 9.4. It is the room's one line to watch, it is static, and it is a copy decision for someone with a view of the whole room. **Recorded so it is not lost, and not raised to a defect it is not.**

---

## 15. THE ONE THING TO REMEMBER

> **Shopping is not the market. It is the threshold before it — the list gathered by the door, in the plainest light in the house, on a note sized to exactly what's on it and no more. Its register is momentum, the only room the canon lets move. Its whole grace is that you leave it: keys, bag, list, done. The Experience Architecture names its primary action in its own words — *work through it* — the only room in the house it does that for. And its one sign of life is a line struck through and settled into shade, no fanfare, because the canon says a finished shopping list qualifies as one of only two premium moments it names, and then forbids celebrating it.**
>
> **The room gets a startling amount right. Nothing in it counts, scores, or scolds. It has no confetti — the codebase has no confetti. The crossing-off is met to the word. The Companion sits at the threshold under a title that is that chapter's own moment — *"Worth a look before you shop"* — and the one signal permitted to raise its voice in this house is the one that says the thing in your basket could hurt someone, structurally protected so nothing else can ever claim that voice. The list knows whose hand added each item, refuses to move under a second pair of hands, and belongs to the household rather than to whoever opened it — which is the co-authorship two other rooms were found to be missing, already built, forty lines away.**
>
> **And a household with fourteen items on their list opens the door and finds a blank note. THA computed the sentence that would have told them — *"14 items in list"* — and dropped it at the last inch, the same last inch where the Pantry drops `isDefault` and Shopping drops `confidenceLevel`. Behind the blank note is a second orchard, painted by this room over the one the house already has, which is the picture the Blueprint calls *a search box floating on a landscape* and names an anti-pattern. And through the other door — the one the Dashboard sends them to, the one no canon governs and no safety card reaches — THA tells them their banana is Industrial.**
>
> **The work is not to define this room. It is to open the door onto the list.**
