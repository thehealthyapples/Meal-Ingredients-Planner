# THA Living Home Environmental Dressing Architecture

**Document ID:** `LIVINGHOME2`
**Date:** 2026-07-20
**Status:** GOVERNING — law in force for the layer it defines · Environmental Dressing register **DECLARED, NOT BUILT** · nothing may ship until the owner amendments in § 10.2 land
**Rollback identifier:** `rollback/LIVINGHOME2-environmental-dressing-20260720` → `d45c3f55`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow
**Governing parent:** `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (`LIVINGHOME1`) — *the house holds still; the life moves*

---

## 0. Mandate

The Living Home has, until this document, recognised exactly two registers:

- **The House** — the constant architecture: the walls, the one orchard, the one morning light. Byte-constant, checksummed, changed only by governed amendment.
- **Household Life** — the household's true data, shown truthfully: their food in season, their plans, their declared occasions. Data-borne or absent; never invented.

This document defines the missing third layer, between them:

> **Environmental Dressing** — the layer at which **the home quietly lives**.
>
> A bowl of apples on the counter. Spring flowers. A folded blanket in November. A warm mug. Pumpkins at harvest. These belong to the **home itself** — not to the architecture (they change with the year) and not to the household's data (they claim nothing about any household). They exist for one purpose: to express **warmth, hospitality, and the quiet passage of the year**, while the permanent identity of the house stays untouched.

The three layers, stated once, distinguished forever:

| Layer | One-line law | Changes? | Speaks about the household? |
|---|---|---|---|
| **House** | *Never changes.* | Never — byte-constant, amended only deliberately | Never |
| **Environmental Dressing** | *The home quietly lives.* | Only with the year, between registered states, identical for everyone | **Never** |
| **Household Life** | *The household's true data.* | Only with the household's own data | Only truthfully, from a canonical owner |

A real home is warm before its family walks in. The kitchen does not repaint itself in October (`LIVINGHOME1` § 0, cited) — but somebody sets a bowl of apples on the table, and in autumn there are pumpkins by the door. That somebody, here, is the home itself — one curated hand, the same for every household — and this document is the law under which that hand may act at all.

---

## 1. Why this document exists

`LIVINGHOME1` answered *how the house stays alive* with two registers and drew the boundary hard: **data-borne or dead**. `EXP3` made that boundary mechanical (the empty-house test: anything visible to a household with no data is dressing the house, refused). Both documents were correct on the day they were written — and both explicitly reserved the question this document answers:

1. **The canon's refusals were refusals of *unowned* dressing.** Seasonal dressing was *"considered and declined"* (`EXP5` § 5.3, recorded at `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 11); painted props were *"fabricated feeling, forbidden by construction"* (`THA_EXPERIENCE_BLUEPRINT.md` § 12.1.2); EXP3's Verdict 1 refused mugs, flowers and textiles because they had **no data owner**. Every one of those refusals was written against dressing arriving *by taste* — silently, personalised, or pretending to be data. None of them was written against a **governed, registered, meaning-free hospitality layer owned by the home** — because no such layer had been defined. `LIVINGHOME1`'s own User Acceptance Evidence names the reserved decision: if the owner intends the home's warmth to include the year, that is an owner decision recorded through governance, with its cost named.
2. **The owner has now made that decision.** This document records it, in the bounded form the canon can hold: the *house* still never changes — the orchard, the light, the walls, the geography keep their one season and one morning absolutely — and the *life* is still only the household's truth. What is admitted is a third, narrow register: the home's own quiet welcome.
3. **Without this document, the pressure returns as erosion.** "Make the home feel warmer" and "mark the seasons" will be proposed again — and without a governing owner, each proposal either gets refused on precedent (and the home stays colder than the owner intends) or slips through as taste (and the theme park begins). A defined layer with hard laws is how the home gets warmth **without** losing its stillness.

**What this document is not:** it is not a reversal of the one-season law, the one-morning law, the prop ban's purpose, or the empty-house test's purpose. Each of those survives intact in its owner; § 10.2 names the precise, bounded amendments first implementation requires, and until those amendments land in their owners' own files, **no dressing may ship**.

---

## 2. Position in governance

### 2.1 Layer and subordination

This is a **Layer 2 Experience Architecture document** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1), the second document of the Living Home canon:

- **Subordinate to** `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (`LIVINGHOME1`) — the Living Home Principle prevails in every conflict, and this document is an extension of its register model, not a rival to it.
- **Subordinate to** `THA_EXPERIENCE_ARCHITECTURE.md` (behaviour prevails) and, through it, the Governing Experience Architecture and the Brand Constitution.
- **Subordinate to** `THA_EXPERIENCE_BLUEPRINT.md` on every question of the place. Where this document's layer requires the Blueprint to move (§ 10.2), the Blueprint is amended **in its own file, by the owner's recorded decision** — never overridden from here.
- A **non-overriding sibling** of `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, and `THA_KEPT_ROOM_TRANSLATION.md`.
- **Bound by** `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18) for every season input, and by the Intelligence Governance canon for the one thing it says about the Companion (§ 8.4).

### 2.2 What this document owns — exactly, and nothing else

1. **The Environmental Dressing layer** — its definition, its place between House and Household Life, and the three-register classification test (§ 4.3).
2. **Rules ED1–ED12** (§ 4) — the governing principles of the layer.
3. **The celebration-dressing gate** (§ 7.2) — the principle under which the only occasion-shaped dressing that will ever exist is permitted.
4. **The amendment list** (§ 10.2) — the named, bounded changes to other owners that first implementation requires, recorded here so they can never happen silently or partially.
5. **The Dressing Register class** (§ 10.3) — declared, not built: the implementation shape's *requirements*, with the shape itself owned by the asset-system design (`EXP3`) at its own update.

It deliberately owns **nothing else**: no visual value, token, asset, placement, component, route, capability, string, schema, or gate that duplicates an existing gate. It creates no data store and no household-facing surface.

### 2.3 Restate-no-rule

As in `LIVINGHOME1` § 2.3: statements of already-owned law here are **citations**; any sentence later found to duplicate an owned rule is a defect in this document and is corrected to a citation.

---

## 3. Ownership

**The layer belongs to the home; the home belongs to THA; the law belongs here.**

- **Curation authority:** Environmental Dressing is authored by THA's design authority (the owner, through the admission pipeline) as **one governed collection, identical for every household**. It is never generated at runtime, never sourced from a third party at runtime, never household-authored, never personalised, and never varied per household except by the single permission gate of § 7.2. A household cannot add to it, and nothing a household does changes it — which is exactly why it can never lie about them.
- **The items** are owned by the future **Dressing Register** (§ 10.3) — one register, one component mouth, checksummed like the House Register, with the season key as its only axis of variation.
- **The season key** is owned by the season rule, `shared/seasonal/season-rule.ts` (Domain 11). Dressing **consumes** its answer and derives nothing (**HT17**, cited). No dressing item carries its own calendar.
- **The celebration gate** (§ 7.2) reads the future `household_traditions` domain (`LIVINGHOME1` § 7) **read-only**, as a permission and never as content.
- **The rules** are owned by this document. On any question of *rule* owned elsewhere, the owner prevails and this document is corrected.

---

## 4. Governing principles — ED1–ED12

- **ED1 — Dressing belongs to the home, not the household.** Every dressing item is a fact about THA's home — the same bowl of apples on every household's counter. It is authored once, admitted once, and shown identically to every household in the same season (subject only to § 7.2). There is no per-household dressing, no segment, no variant, no experiment.

- **ED2 — Never personalised, never data-driven.** Dressing reads **no household data**: not the pantry, planner, diary, cookbook, preferences, history, composition, or behaviour — nothing. Its only inputs are the season answer (Domain 11, consumed per HT17) and the single permission of § 7.2. Anything whose appearance depends on what a household *has, did, or is* belongs to Household Life (data-borne or dead — Blueprint § 12.1, cited) and is misclassified here.

- **ED3 — Never claims knowledge of the household.** A dressing item may never state, imply, depict, count, or suggest any fact about the household that sees it. The test is read from the household's chair: *could a reasonable household look at this and think "THA knows this about us"?* If yes, it is refused or reclassified. The bowl of apples is the home's bowl; the moment it could be read as *your* fruit bowl, it has crossed into a claim and out of this layer.

- **ED4 — Never competes with the data-driven experiences.** Dressing carries **zero information**: no text, no numbers, no status, no counts, no doors, no suggestions, no interaction. It never occupies a place where the Companion, Planner, Pantry, Cookbook, Shopping, Nutrition, Diary, Stories, or the Notice Engine speak; it never duplicates, previews, or gestures at their content. Where a dressing item and a Living Detail (Life register) would contest the same region, **the household's truth wins and the dressing yields** — permanently, not by tuning. Removing every dressing item loses no information, capability, or state.

- **ED5 — The permanent identity of the house is untouchable.** No dressing may alter the orchard, the one morning light, the palette, the tokens, the layout, the geography, the navigation, the typography, or any House Register byte. The orchard keeps its one season absolutely (Blueprint § 6.1, cited); light never encodes time or season (GEA10 / HT13, cited). **The passage of the year enters through the door as objects; it never enters through the window as weather.** Autumn in this home is pumpkins by the door — never leaves on the orchard, never an amber cast, never a shorter day.

- **ED6 — The year turns slowly, from one owner, and never the hour.** Dressing varies only with the season/part of year, resolved solely from Domain 11 on read (no scheduler — HT14, cited). A handful of registered states across the year, each admitted deliberately — the quiet passage of the year, not an animation of it. **No hour-of-day dressing, ever** (HT13 stands absolutely); no weather; no randomness; no rotation-for-freshness; no engagement-responsive anything. The same household opening THA twice in one week sees the same home.

- **ED7 — Quiet by construction.** Every dressing item is: **still** (no motion, no effects); **wordless** (no text, no faces, no marks beyond the house's own); **decorative-declared** (`aria-hidden`, empty alt, `pointer-events-none` — the `orchard-backdrop.tsx` manner, cited from EXP3 § 11); below the emphasis budget (Blueprint § 12.1.4, cited); within a declared token ceiling that is never tuned per surface (UIA § 15, cited); and removable with only a slight cooling. Restraint is the whole craft: a home with three well-chosen touches is warm; a home with thirty is a shop window.

- **ED8 — Hospitality is the only purpose, and it must be named.** Every admitted item states, in its admission brief, the hospitality it extends — welcome, comfort, care, the year's passage. *"It looks nice"* is not a purpose; decoration for decoration's sake is refused by this rule. If the brief cannot say what the item quietly does for a person arriving tired at the end of a day, the item does not enter.

- **ED9 — Celebration dressing exists only by the household's leave.** (§ 7.2 in full.) The only dressing that may relate to any occasion is bound to an occasion the household **declared** (LH1, cited) and **explicitly permitted dressing for**. Default is nothing; THA never suggests, pre-ticks, or assumes; a household that declares nothing sees a home with no occasion in it, completely and honestly.

- **ED10 — Admitted one at a time, registered, never a batch.** Each dressing item enters by the governed admission path (EXP3 § 12's pipeline, extended at § 10.3): named, briefed under ED8, registered with its season key and checksum, reviewed with-and-without, retired deliberately. A verifier makes silent dressing a build failure. There is no "dressing pack", no seasonal "theme drop", no bulk import.

- **ED11 — Dressing is never a channel.** No notice, nudge, campaign, promotion, announcement, upsell, or commerce may ever ride this layer, and it never marks *product* events — THA's launches, milestones, or anniversaries. The year that passes in this home is the calendar year of hearth and harvest, not the product's roadmap. This rule has no exception and no amendment path short of retiring the layer.

- **ED12 — Beneath words.** The Companion never narrates, explains, or draws attention to dressing, and dressing never enters a prompt, Context View, or capability (INT17's ownership of every byte the model reads is untouched — cited). The home's warmth is felt, not announced; a welcome that describes itself is a performance.

### 4.3 The classification test

Every visual thing in the Living Home is classified by three questions, asked in order:

1. **Does it ever change?** No → **House** (byte-constant, checksummed, amended only deliberately).
2. **Does its appearance depend on anything true of this household?** Yes → **Household Life** (data-borne or dead; the empty-house test applies in full — EXP3 § 8.1, cited). *The single exception:* the § 7.2 permission gate, which is a household **consent about dressing**, never a household fact **shown as dressing**.
3. **Does it exist solely to extend warmth, hospitality, or the year's quiet passage — with zero informational content, under ED1–ED12?** Yes → **Environmental Dressing**, admitted item-by-item. No → **refused**.

This test succeeds `LIVINGHOME1` § 5.2's rule of thumb (which knew only two registers) and is the wording § 10.2 amends it to. The old rule's *purpose* — nothing may dress the house while pretending to be the household's life — survives strengthened: the boundary is now owned instead of implied.

---

## 5. What belongs to Environmental Dressing

Objects of hospitality that a home itself would hold, each admitted individually under ED8's named purpose:

- **The standing welcome (year-round):** a bowl of apples — the home's quiet signature, and the house's own fruit; a warm mug; a basket by the back door; a folded blanket.
- **The year's turns (season-keyed via Domain 11):** spring flowers; a watering can in the growing months; the blanket unfolded a little more in autumn; pumpkins during harvest; deep-winter comfort in the home's quietest corners.
- **The home's own books (bounded):** *seasonal cookbooks as objects of the home* — unlabelled book forms, spines without legible titles, never rendered as real purchasable products and never confusable with the household's own Cookbook. The moment a book form names a title, links anywhere, or could be read as the household's collection, it violates ED3/ED4 and is refused. (The household's real most-cooked book is Household Life — EXP3 § 5.2's Cookbook pilot — and stays there.)
- **Celebration dressing (ED9/§ 7.2 only):** a simple Christmas wreath, for households who declared Christmas and permitted the home to hang it — and equivalents for other declared occasions, each admitted individually, each equally simple and quiet.

All of it renders as environment — within regions the asset system already commits (EXP3 § 5's band regions; the concrete placement map is implementation, § 10.3) — and none of it is ever content.

### 5.1 Placement law — dressing yields to the room's subject

A dressing item may not be placed where it would be read as the room's data: **no produce dressing in the Pantry room, no book dressing in the Cookbook room, no meal-shaped dressing in the Planner.** In a room whose subject is food data, food-shaped dressing is refused for that room even though the item itself is admitted — because context, not content, would turn the home's bowl of apples into a claim about your pantry (ED3). The general form: in every room, the dressing must be legible as *the home's warmth* and never as *this room's information*.

---

## 6. What must never belong to Environmental Dressing

Refused permanently, with the refusing rule named:

- **Anything personalised or household-derived** — dressing "for you", segment variants, taste-inferred touches, anything reading household data (ED1/ED2).
- **Anything that claims, counts, or informs** — text, numbers, labels, status, progress, a door, a suggestion, a preview of any data surface (ED3/ED4).
- **Any change to the house itself** — seasonal orchard states (leaves, snow, blossom), weather, light or palette shifts, evening dimming, per-room environments, layout or navigation change (ED5; the standing refusals of Blueprint § 6.1/§ 7, `NORTH2` § 3.5, `EXP5` § 5.3 continue to govern the *house* in full).
- **Hour-keyed anything** (ED6; HT13).
- **Undeclared occasions** — a default Christmas, an assumed Eid, a platform occasion calendar, any religious or cultural marker shown without the household's declaration *and* dressing permission (ED9; LH1).
- **Theatre** — motion, confetti, particles, ambience effects, seasonal "modes" or themes, an advent-calendar mechanic, countdowns (ED7; GEA13, cited).
- **Channels** — promotions, campaigns, product-event marks, commerce of any kind, sponsored objects (ED11).
- **Engagement machinery** — rotation for freshness, A/B-tested charm, novelty schedules, anything tuned to bring a household back (GEA3, cited).
- **Dressing deployed to cover honest absence** — an empty pantry, an empty planner, an empty tradition list must stay honestly empty (Blueprint § 12.1.3, cited); dressing may never be positioned to make an absent-data surface look alive. The home is warm *around* the household's honest state, never *instead of* it.
- **Household-authored dressing** — uploads, customisation, "decorate your home" features: the moment the household authors it, it is household data with an owner, a privacy surface, and a different law; it is not this layer.

---

## 7. Relationships

### 7.1 To House Architecture

**The house is what never changes; dressing is what the home sets upon it.** Dressing never modifies a House Register byte — the checksum register (EXP3 § 4.4) continues to prove the house cannot drift, and the Dressing Register is checksummed in the same manner: its items are constant *within* a registered season state, so the dressing can only turn like the year — **between reviewed, registered states, never by generation, never by taste at runtime**. Dressing composes inside regions the house already commits and adds no region, no layer of architecture, and no exposure mechanics (Blueprint § 6.2's Exposure Scale untouched, cited). If every dressing item were removed, the house would stand complete — slightly cooler, structurally identical.

### 7.2 To Household Traditions (`LIVINGHOME1` § 7)

The Traditions & Celebrations domain is the **only** door through which an occasion may ever reach the dressing layer, and the door opens one way:

1. The occasion must be in the household's **declared set** (LH1 — declared, never assumed; empty by default; never inferred).
2. The household must have **explicitly permitted dressing for that tradition** — a distinct, per-tradition consent, quietest-by-default, never suggested or pre-ticked. `LIVINGHOME1` § 7.3's ladder (Private · Aware · At the table) currently contains **no rung that permits dressing**; whether the permission becomes a fourth rung or a separate per-tradition switch is decided at the `LIVINGHOME1` amendment (§ 10.2), which owns the ladder. Until that amendment lands, **no celebration dressing is lawful at any rung**.
3. What appears is a **registered, universal dressing item** bound to that occasion (the one simple wreath — the same for every household that permits it), never themed per household, never generated, never escalating (LH2's never-more-than-chosen, cited).
4. The gate is a **permission, not a datum**: the dressing renders the home's welcome, not the household's declaration. Since a declared occasion can reveal belief (Article 9 — LH7, cited), celebration dressing is visible only inside the household's own signed-in experience, is never an input to anything, and disappears with the declaration or the permission in one act (LH11, cited).

Everything else in the Traditions domain is untouched: LH1's no-platform-calendar, LH4's no-theatre, LH5's observed-vs-declared boundary, LH9's one-mouth, and LH10's never-invent all continue to bind. The dressing calendar itself (§ 5) is **seasonal, not occasion-based** — the year's turns are hearth and harvest, owned by the home; occasions are owned by households, and only they can let one in.

### 7.3 To Household Life

**Life outranks dressing, everywhere and always.** The two layers never mix:

- A **Life** asset renders a household truth and must vanish when the truth is absent (empty-house test — EXP3 § 8.1, which after § 10.2's amendment applies *to the Life register*, exactly as designed).
- A **Dressing** item claims nothing and is therefore *permitted* to be present for an empty household — that presence is precisely the warmth a real home shows a family who has not yet unpacked. This is the one boundary the canon's old two-register wording could not express, and the whole reason this document exists.
- Classification is mechanical: **a data binding present → Life; no binding → Dressing or House** (EXP3 § 7.2's manifest discipline, extended). An item may never migrate between registers silently; reclassification is an admission event.
- Where they would contest space, the Life detail wins (ED4). Dressing never imitates life: nothing in the dressing layer may render *this household's* recipes, produce, plans, people, or words — those have owners, and the owners' surfaces are where they appear.

### 7.4 To the Companion and the data-driven experiences

Dressing is invisible to intelligence by law: it never enters a prompt, Context View, capability, notice, or story (ED12). The Companion, Planner, Pantry, Shopping, Nutrition, Diary, and Stories neither know nor say that dressing exists. Nothing in this layer observes, interprets, decides, or speaks — the rooms observe, the Companion understands, the household decides (GEA21–GEA23, cited), and the dressing does none of the three. It is the one layer of the home with **no voice, no eyes, and no memory** — which is what entitles it to be present uninvited.

---

## 8. Examples

Worked classifications, using § 4.3:

| Thing | Register | Why |
|---|---|---|
| The orchard through the window | House | Never changes; one season, one morning (Blueprint § 6.1) |
| Home's window joinery, the sill | House | Architecture, drawn by the house's own hand (EXP3 § 4.1) |
| A bowl of apples on the counter | **Dressing** | The home's standing welcome; claims nothing; year-round |
| Spring flowers | **Dressing** | Season-keyed from Domain 11; identical for everyone |
| A folded blanket, a warm mug | **Dressing** | Comfort named as purpose (ED8); wordless, still |
| A watering can; a basket by the back door | **Dressing** | The home is tended; hospitality of care |
| Pumpkins during harvest | **Dressing** | The year's turn, through the door — never on the orchard |
| Unlabelled seasonal cookbooks (home's books) | **Dressing** | § 5's bound form only; never titled, never a door |
| A simple Christmas wreath | **Dressing (celebration-gated)** | Only via § 7.2: declared + permitted; universal item; Phase 5 |
| The plums actually in this household's pantry, in season | Household Life | Data-bound (EXP3 § 8.1's double key); vanishes when untrue |
| The household's most-cooked recipe as the Cookbook's open book | Household Life | EXP3 § 5.2's pilot; a household truth with an owner |
| The greeting in THA's hand | Household Life | Data- and time-borne words, owned (INT21/HT13) |
| Autumn leaves drifting over the orchard | **Refused** | The house changing its own weather (ED5) |
| A "Happy Christmas!" banner | **Refused** | Text, occasion assumed, a channel (ED3/ED9/ED11) |
| A snowman in December for everyone | **Refused** | Occasion-shaped without declaration; weather (ED9/ED5) |
| A bowl of apples *in the Pantry room* | **Refused placement** | Reads as pantry data in that room (§ 5.1) — the item is lawful, the placement is not |
| "Cosy autumn theme" toggle | **Refused** | A theme is the costume (Blueprint § 16); dressing is not a mode |
| Dressing that appears because the planner is empty | **Refused** | Covering honest absence (§ 6); absence stays honest |

---

## 9. Anti-patterns

Named so the next proposal recognises itself:

1. **The stage set** — the house changing its own weather: seasonal orchard states, tinted light, evening dimming. Refused at ED5; the cost is the one `NORTH2` § 3.5 named — the household loses the one place that does not change.
2. **The theme park** — dressing as spectacle: themes, modes, effects, density. The Blueprint's own anti-pattern (§ 16, cited), now with a third register to police it.
3. **The mind-reader** — dressing that implies knowledge: a "favourite" mug, flowers "for" someone, anything a household could read as *THA knows us*. Refused at ED3 — this is the layer's cardinal sin, because it spends the exact trust the data-driven surfaces earn by being true.
4. **The shopkeeper** — dressing as channel: promotions, products, sponsorships, seasonal commerce. Refused at ED11, no exceptions.
5. **The advent calendar** — platform-owned occasion mechanics: countdowns, default holidays, festive escalation. Refused at ED9/LH1; occasions belong to households.
6. **The screensaver** — ambience: motion, particles, generative variety, rotation for freshness. Refused at ED6/ED7; a home is still.
7. **The understudy** — dressing standing in for absent data: charm deployed on empty surfaces so the product looks alive. Refused at § 6; honest absence is a complete state (Blueprint § 12.1.3, cited).
8. **The narrator** — the Companion mentioning the wreath, a notice about the pumpkins, dressing entering a prompt. Refused at ED12; warmth that describes itself is a performance.
9. **The collector** — accumulation: every season adding items until the sills are full. Policed by ED10 (one at a time, reviewed with-and-without) and ED7's restraint; the register's size is itself a governed fact, and *removing* dressing is as legitimate an act of curation as adding it.
10. **The forgery** — a dressing item quietly rebuilt as data-driven ("just show their actual apples") or a Life detail quietly demoted to dressing ("just show apples always"). Both are register migrations without admission — the classification test (§ 4.3) exists so this is always a caught, deliberate decision.

---

## 10. Implementation boundaries

### 10.1 What this document ships

Nothing. This is governing architecture only: no code, schema, migration, token, asset, string, route, capability, component, store, or test changes. The Environmental Dressing register is **DECLARED, NOT BUILT** — the `TIME3`/`LIVINGHOME1` precedent: the law first, so nothing rival grows while the layer is built.

### 10.2 The owner amendments first implementation requires — named, so they cannot happen silently

No dressing may ship until each of these lands **in the owner's own file**, citing this document, in the same governed change as the first implementation or before it:

1. **`THA_EXPERIENCE_BLUEPRINT.md` § 12.1.2** — the prop ban refined at its owner: a *prop* is a **claim without data** (fabricated feeling); a registered Environmental Dressing item is a **claim-free object of the home's hospitality**, admitted under this document. The ban's purpose (no fabricated feeling, no fake life) survives verbatim; what changes is that claim-free warmth gains a lawful, owned class.
2. **`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 11** (with `EXP5` § 5.3 recorded there) — the standing "seasonal dressing declined" verdict is annotated at its owner: declined *for the house* (which keeps its one season absolutely), superseded *for the registered dressing layer* by this owner decision.
3. **`LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`** — three bounded amendments at the parent: § 5.2's rule of thumb is succeeded by the three-register classification test (§ 4.3 here); § 7.2 **LH3** / § 7.3's ladder gain the explicit dressing permission (§ 7.2 here — fourth rung or per-tradition switch, decided there); § 10.4's *"no tradition ever carries an asset"* is refined to *"no tradition ever changes the House, and a tradition reaches the dressing layer only through the household's explicit dressing permission"* — with the cost that clause said must be named, now named and paid deliberately by the owner rather than eroded.
4. **`EXP3_LIVING_HOME_ASSET_SYSTEM.md`** — the two-register asset design is extended with the Dressing Register (§ 10.3 requirements), and its § 8.1/§ 8.3 empty-house gates are scoped to the Life register (their design intent), with the verifier gaining the third register's checks.

If any amendment is refused at review, this document's dependent parts do not come into practical effect, and the refusal is recorded here — the Bootstrap's STOP discipline, honoured in both directions.

### 10.3 Requirements on the future Dressing Register (declared here, designed at the EXP3 update)

- One register, one component mouth, in the EXP3 manner; items live once and are referenced, never copied per room.
- Every item carries: id · admission document id (no anonymous charm) · ED8 purpose statement · season key (Domain 11 vocabulary only — no dates, no clocks) · optional celebration binding (occasion reference + permission requirement, § 7.2) · declared strength/placement ceiling · checksum.
- **Structurally impossible, as schema:** motion fields · text/copy fields · any household-data binding (a `binding` field is what defines the *Life* register — its presence here is the § 9.10 forgery, a build failure) · hour keys · engagement keys · campaign/product-event keys.
- The verifier extends `verify:living-home-assets` (EXP3 § 7.4): register bytes match checksums; no household-data read reachable from the dressing mouth; celebration items unreachable without the § 7.2 permission; placement exclusions (§ 5.1) enforced; every item's admission doc exists.
- Budgets, accessibility, responsive and stillness law: inherited from EXP3 §§ 9–11 unchanged, including the E1/E0 zero-byte invariant — rooms without a view gain nothing.

### 10.4 Phases (all future; each a separate governed act with its own rollback, gates, and report)

| Phase | Scope | Gate |
|---|---|---|
| **0 — This law** | Governing architecture in force; README indexed. **Complete on merge.** | — |
| **1 — Owner amendments** | § 10.2's four amendments, in their owners' files. Governance only; still no code. | Owner review of each amendment |
| **2 — The register** | Dressing Register + verifier extension per § 10.3, empty. Tooling only; no visual change. | Phase 1; EXP3 Phase 2 (registers/verifier) shipped first |
| **3 — The standing welcome** | First admitted item (candidate: the bowl of apples), full admission pipeline, with-and-without review. | Phase 2; full experience gate stack; ED8 brief |
| **4 — The year's turns** | Seasonal items admitted one at a time (§ 5), each its own act. | Phase 3 evidence; per-item admission |
| **5 — Celebration dressing** | The wreath and peers — only after `LIVINGHOME1` Phases 1–3 deliver declared traditions and the § 7.2 permission mechanism. | `LIVINGHOME1` Phase 3+; § 7.2 in full; LH7 privacy review |

Deliberately **not** phased, because refused rather than deferred: everything in § 6.

---

## 11. Compliance

### Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  Explain: One home, one orchard, one Companion reaffirmed by citation; the new
  layer has one owner (the Dressing Register, declared not built) and one law
  (this document).
☑ One owner per fact
  Explain: Every owned rule cited to its owner (§ 2.3); season stays Domain 11's
  (HT17); occasions stay the household's (LH1); the only new facts (registered
  dressing items) get exactly one owner at Phase 2.
☑ No duplicate entities
  Explain: No entity created. The register class extends EXP3's register model
  rather than rivalling it; required amendments are named (§ 10.2), never copied.
☑ No duplicate ownership
  Explain: § 2.2 lists exactly what this document owns; conflicts with standing
  refusals are resolved by amendment AT THE OWNER (§ 10.2), never by a second
  statement here.
☑ No duplicate state
  Explain: No state created; the register is a code/CI artefact; nothing derived
  is stored; season resolves on read (HT14).
☑ Extends existing architecture
  Explain: Extends LIVINGHOME1's register model with the third register both it
  and EXP3 reserved space for; invents no rival layer.
☑ Progressive enrichment where appropriate
  Explain: Six-phase path, each additive and separately gated; quietest default
  everywhere (empty register, no celebration dressing without opt-in).
☑ Knowledge domain compliance
  Explain: No knowledge domain touched; Product Registry impact nil until a
  user-facing phase ships.
☑ Honest gaps over fabricated information
  Explain: The layer is defined as claim-free (ED3); dressing may never cover
  honest absence (§ 6); Life's empty-house test survives at full strength (§ 7.3).
☑ No permanent synchronisation bridge
  Explain: None; no scheduler (HT14); the celebration gate is a read-time
  permission check against the future traditions owner.
☑ Evolution over replacement
  Explain: Nothing retired here; every superseded wording is amended at its
  owner with both-ways citations (§ 10.2), the reverse path recorded.

If any item cannot be checked, implementation must stop and explain why.
```

### AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
No AI surface, capability, prompt, context view, or Companion behaviour is
created, altered, or consumed. The layer's one AI rule is exclusion: dressing
never enters a prompt, Context View, capability, notice, or story, and the
Companion never narrates it (ED12 — INT17's ownership of every byte the model
reads is cited, untouched). No capability registered, none consumed; no second
assistant; no conversation state; nothing here observes, interprets, or speaks.
```

### Definition of Done

- **What success looks like:** this document exists at `docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md`, is indexed in `docs/architecture/README.md`, defines the three-layer model (House / Environmental Dressing / Household Life), states ED1–ED12, the classification test, the celebration gate, and the § 10.2 amendment list — and is committed and pushed with the rollback identifier reported.
- **What must not break:** nothing runtime — this change touches documentation and session files only. Every cited owner (`THA_EXPERIENCE_BLUEPRINT.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, `EXP3`, the one-season and one-morning laws) is **byte-untouched** — the amendments are named for Phase 1, not made now.
- **Manual test steps:** `git diff --stat <rollback-tag>..HEAD` shows only `docs/` and `.engineering/session/` paths; the README index entry resolves to this file; `repo-structure-verify.sh` reports no new failures attributable to these paths.
- **Product Registry impact:** none now (no user-facing surface ships); Phases 3–5 each carry their own Product Registry Impact section.

### Data Impact

- **Reads existing data:** NO (document only). The future layer reads only Domain 11's season answer and, at Phase 5, the household's dressing permission — read-only, as a gate.
- **Writes new data:** NO. (The Dressing Register is a future code/CI artefact, not household data; the § 7.2 permission is a future fact of the *traditions* domain, owned there.)
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO — and the layer forbids inference by construction (ED2), so there is nothing a backfill could ever compute.

### Trust Check

- **Could this mislead the user?** No runtime change. The layer's defining law is that it *cannot* make claims (ED3): a dressing item carries zero information, so it has nothing to be wrong about. The one genuine mislead-risk — dressing read as household data — is closed structurally (§ 5.1 placement law, § 7.3 register separation, the § 9.3 mind-reader anti-pattern).
- **Could this fabricate certainty?** No. Dressing asserts nothing; Household Life's honesty laws are untouched and explicitly outrank it (§ 7.3); dressing may never stand in for absent data (§ 6).
- **Is anything guessed but shown as real?** No. Nothing is inferred, ever (ED2); occasions appear only by declaration plus explicit permission (§ 7.2).
- **What happens if the system is wrong?** For this change: a documentation defect, corrected by amendment. For the future layer: a wrong dressing item is at worst a mistimed pumpkin — traceable to one registered state and one admission document, corrected in one place, having claimed nothing about anyone.
- **Special-category exposure:** celebration dressing renders only inside the household's own experience, only from their declaration plus consent, and disappears with either in one act (§ 7.2.4; LH7/LH11 cited).
- **No architectural duplication introduced:** YES. **No new source of truth created:** YES (one declared for the future, created nowhere). **No runtime behaviour altered:** YES.

### Rollback Plan

- **Rollback identifier:** `rollback/LIVINGHOME2-environmental-dressing-20260720` → `d45c3f55` (annotated tag).
- **Files modified:** `docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (new) · `docs/architecture/README.md` (index entry) · `.engineering/session/CURRENT.md` (session row) · `.engineering/session/runs/LIVINGHOME2_Environmental_Dressing_Architecture.md` (session record).
- **Rollback commands:**
  ```
  git checkout rollback/LIVINGHOME2-environmental-dressing-20260720 -- docs/architecture/README.md .engineering/session/CURRENT.md
  git rm docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md
  git rm .engineering/session/runs/LIVINGHOME2_Environmental_Dressing_Architecture.md
  git commit -m "Rollback LIVINGHOME2"
  ```
- **Verification after rollback:** `git diff rollback/LIVINGHOME2-environmental-dressing-20260720 -- docs/ .engineering/` is empty; no runtime surface existed to verify.

### Scope Lock

- **Implemented scope:** this governing document; its README index entry; the session record. Nothing else.
- **Explicitly excluded:** all code, schema, migrations, tokens, assets, strings, routes, capabilities, components, registers, verifier changes, and — deliberately — **every § 10.2 amendment**: `THA_EXPERIENCE_BLUEPRINT.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, and `EXP3` are byte-untouched, and the standing refusals remain in force in their owners until Phase 1 amends them by review.
- **Suggestions recorded, not taken:** the Phase 3 pilot candidate (the bowl of apples); the fourth-rung-vs-switch decision (§ 7.2.2, deferred to its owner).

### Manual Verification

Performed for this change (documentation-only):

1. `git status` confirmed clean before work apart from the session heartbeat; rollback tag created and verified to resolve to `d45c3f55` **before** any file was written.
2. All three mandated inputs read in full (`docs/architecture/README.md` both pages; `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`; `EXP3_LIVING_HOME_ASSET_SYSTEM.md`), and the conflict check performed under the Architecture Bootstrap: every standing refusal this layer touches is named in § 1 and § 10.2 rather than silently overridden.
3. `git diff --stat` at commit time confirmed the change touches only the four files named in the Rollback Plan.
4. The README index entry verified to link to this file's exact path; `repo-structure-verify.sh` run and its result recorded in the session record (pre-existing failures, if any, are not claimed to pass and none are introduced by these paths).
5. No build, typecheck, or test surface is affected; none is claimed to have been re-run beyond confirming the diff contains no code path.

### User Acceptance Evidence

- **State: Waiting for User.** This is a governing-law deliverable; acceptance is the owner's review of this document. There is no household-facing surface to evidence, and none is claimed.
- **The decision this document records rather than assumes:** the mission itself is the owner's decision that the home may hold a governed, claim-free, non-personalised hospitality layer that marks the quiet passage of the year — the decision `LIVINGHOME1`'s User Acceptance Evidence and `EXP3`'s Verdict 1 both reserved to the owner. This document gives that decision its narrowest lawful form and **stops short of executing it**: the standing refusals stay in force in their owners until the § 10.2 amendments pass their own review, which is where the owner confirms the decision a second time, file by file.
- **The two sub-decisions surfaced for that review:** (1) the § 7.2 permission mechanism — a fourth ladder rung vs a per-tradition switch — decided at the `LIVINGHOME1` amendment; (2) the rendering medium of dressing items, which inherits `EXP3` Verdict 3's open illustration question unchanged and adds no position to it.
- Evidence for review: this document; the session record at `.engineering/session/runs/LIVINGHOME2_Environmental_Dressing_Architecture.md`; and the refusals this document bounds rather than erases (`EXP5` § 5.3 / OHDB § 11, Blueprint § 12.1.2, `LIVINGHOME1` § 5.2/§ 10.4, `EXP3` § 8.3).

---

*The house never changes: that is its gift. The household's life moves through it truthfully: that is its purpose. And between the two, the home itself keeps a bowl of apples on the counter and pumpkins by the door in October — asking nothing, knowing nothing, meaning only: you are welcome here, in every season of the year.*
