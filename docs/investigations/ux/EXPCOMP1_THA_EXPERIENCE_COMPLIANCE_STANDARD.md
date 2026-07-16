# THA Experience Compliance Standard

## The repeatable audit every major THA surface must pass

**Status:** PROPOSED STANDARD — an instrument, not a law. **Not** governing architecture (yet), **not** a specification, **not** implementation. It **creates no experience principle** and **no second owner**: every compliance area below routes to the document that already owns the rule (Experience Blueprint § 18; Architecture Principle 2; Experience Principle 6). It proposes its own adoption and destination (§ 7); it does not make one.
**Classification:** Experience Governance (investigation → proposed operational standard)
**Date:** 2026-07-16 (`EXPCOMP1`)
**Rollback ID:** `rollback/EXPCOMP1-experience-compliance-standard-20260716` → `7d1dd2ce`
**Companion document:** [`EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_AUDIT_TEMPLATE.md`](./EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_AUDIT_TEMPLATE.md) — the reusable report shape this standard is applied through.

**Governing documents this standard measures against (read in full before any audit):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) ·
[`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (EXPBLUE1/EXPBLUE2) ·
[`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (EXPLANG1/1A/1B) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2) ·
[`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (OHDB1) ·
[`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) (TRANSLATION1) ·
[`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) (OLB1 — adds no rule; read for the feeling being protected)

**No screen audited. No UI designed. No UI implemented. No architecture modified. No principle created.**

---

## 1. WHAT THIS STANDARD IS, AND THE ONE THING IT OWNS

The Experience Architecture is substantially complete. Seven governing documents describe THA's user-facing layer, and between them they hold **six gates** that every user-facing change must already pass:

| # | Gate | Owner |
|---|---|---|
| 1 | UX Governance Checklist (incl. the Premium Standard block) | Experience Architecture § 18 |
| 2 | UI Governance Checklist | UI Architecture § 18 |
| 3 | Experience Review Questions | Experience Language § 6 |
| 4 | The Experience Test | Experience Blueprint § 15.3 |
| 5 | The Blueprint Checks | Experience Blueprint § 15.2 |
| 6 | The Design Character Check | Orchard House Design Blueprint § 16.2 |

Those six gates are complete, correct, and enforced (`ENGINEERING_WORKFLOW.md`, Experience & UI Governance Compliance — with one live exception, § 6.1 below). **This standard adds no seventh gate.** Adding one would create a second owner of checks the architecture already owns once — the defect the Kept Room Translation explicitly refused to commit (`TRANSLATION1` § 2.5).

### 1.1 The gap the six gates cannot close

Every one of the six gates is **per-change** and **binary**. It fires when a person changes something, it asks whether *that change* is lawful, and it answers STOP or continue. That is the right instrument for a change, and it is the wrong instrument for four questions nobody can currently answer:

1. **Is this *surface* compliant?** A gate assesses a delta. Home could pass forty consecutive change-gates and still be non-compliant *as a room*, because no gate ever looked at the room — only at each change to it. Conformance is not the sum of lawful deltas.
2. **How compliant?** STOP/continue cannot express *"lawful, but drifting"* — the state in which almost all real debt lives, and the only state in which it is still cheap to fix.
3. **Compared to what?** There is no way to say Planner is in better shape than Pantry, and therefore no way to sequence the work.
4. **Says who, and when?** A gate leaves no artefact. It is applied, it passes, and it evaporates. Nothing is retained, so the next person to ask must rediscover the answer — the failure `PKR1` names as Risk R7 (*discovery without transfer of ownership*).

> **The gates verify that a change was lawful. Nothing verifies that a surface is right.** That is the unowned instrument, and it is the whole of what this standard is.

### 1.2 What this standard owns — and what it never owns

It is the canonical owner of exactly four things, none of which any governing document holds:

1. **The audit method** (§ 3) — the nineteen compliance areas, and the four faces each is assessed across.
2. **The verdict scale** (§ 2) — PASS / WARNING / FAIL, and what each means.
3. **The evidence standard** (§ 4) — what an assessor must have looked at before a verdict is honest.
4. **The report shape** (the companion template) and the compliance score (§ 5).

And it deliberately owns nothing else:

- **No rule.** Every compliance area in § 3 cites the document that owns the rule. This standard **never quotes a rule as its own** and never paraphrases one into a second form. Where an area's "what is verified" seems to state a rule, it is stating *what the owner's rule requires*, and the owner is named in the same row. If this standard and an owner ever disagree, **this standard is the defect** and is corrected to a citation (the yield clause — Blueprint § 18; OHDB § 16.3; TRANSLATION1 § 7.3).
- **No principle.** Not one. This document was written under an explicit instruction to create none, and the instruction is also the architecture's own law (Experience Principle 6). A new principle of feeling, a new anti-pattern, or a new spatial law enters through its owner's admission process (Experience Language § 8; Blueprint § 18) — never through an audit instrument.
- **No value.** No colour, token, size, duration, threshold, or pixel.
- **Nothing runtime.** No code reads this document.

### 1.3 The precedence hazard, resolved before it is used

A graded scale placed beside a binary gate is dangerous, and the danger has a name: **WARNING is a licence if you let it be one.** It must not be.

> **This standard measures surfaces. It never governs changes.** The six gates bind every change regardless of any audit verdict. A WARNING never downgrades a gate's STOP; a FAIL is not permission to ship; a PASS is not an exemption from the gates on the next change. If a gate says STOP, the work stops — whatever this document's grade says, and whoever holds it.

The two instruments answer different questions at different moments, and neither may be substituted for the other:

| | The six gates | This audit |
|---|---|---|
| **Unit** | One change | One surface |
| **Moment** | Before the change ships | Periodically, and before a surface is declared complete |
| **Outcome** | Binary — STOP or continue | Graded — PASS / WARNING / FAIL |
| **Applied by** | The implementer | An assessor who did not build it (§ 4.3) |
| **Leaves behind** | Nothing | A dated, retained report |
| **Authority** | **Binding.** A failed gate stops the work | **Diagnostic.** A FAIL commissions work; it never blocks a lawful change, and never permits an unlawful one |

## 2. THE VERDICT SCALE

Three outcomes, and no fourth. The scale is deliberately coarse: a five-point scale invites the assessor to average, and an averaged experience verdict is how *"mostly calm"* gets shipped.

> **PASS** — the surface honours the owner's rule, and an assessor can point at *where*. Not "nothing obviously wrong": PASS is a positive finding with evidence behind it. Absence of a defect is not presence of compliance.
>
> **WARNING** — the surface does not currently break the rule, but is **drifting toward** breaking it, or honours it **by accident rather than by construction**. Nothing must stop; something must be recorded. WARNING is the grade this standard exists for, and § 2.1 is its whole justification.
>
> **FAIL** — the surface breaks the owner's rule as written. A FAIL is a **conformance defect**, cited to the rule it breaks. It is not a matter of taste, and it is not negotiable by preference — it is closed by work, or the rule is changed by governance (Blueprint § 18), and nothing in between.

**N/A** is permitted and is not a grade. An area is N/A only when the surface genuinely has no instance of the concern (Admin has no Living Detail — *deliberately*: Blueprint § 5.1). **N/A must be justified in one line.** An unjustified N/A is how an audit quietly becomes shorter than the standard.

### 2.1 Why WARNING is the load-bearing grade

Because the canon's own history says so. NORTH1 § 8.2 found `--card: 0 0% 100%` — a pure-white working surface in a warm house — rendering *warm* only because cards ship at 82% opacity and the cream canvas bleeds through. The surface is currently warm. It breaks no rule *today*. And it is warm **by accident, through translucency, rather than by construction, through material** — so the day someone removes the opacity crutch for a perfectly good reason, the house goes cold, and nobody will connect the two changes.

A binary gate cannot say that. It says *"warm — continue."* This standard says **WARNING**, and names the mechanism. Every serious finding in the visual programme's history has this shape: correct today, correct for the wrong reason, one innocent change from wrong.

> **The WARNING test, in one line:** *would this still be true if the thing currently making it true were removed for an unrelated reason?* If no, it is a WARNING however good it looks today.

### 2.2 The verdict is about the surface, never the person

An audit finds that a **surface** disagrees with the architecture. It never finds that an implementer was careless. Most FAILs in this canon are inherited — the orchard backdrop, Home's missing door, and the cold card each predate anyone who would be asked to fix them. An audit that reads as an assessment of people will be gamed within two cycles, and an audit that is gamed is worse than no audit, because it produces a document that says the house is fine.

## 3. THE COMPLIANCE AREAS

Nineteen areas. Each is assessed across four faces, and each names the **owner of the rule** — which is the only thing that makes the verdict appealable to something other than the assessor's taste.

**How to read an area.** *What is verified* restates nothing; it says what the owner's rule requires, in the form an assessor can look for. *Why it matters* is the cost of the failure, not a re-argument of the rule. *How to assess* is a procedure a stranger could run. *Typical failure patterns* are drawn from the canon's own recorded findings and refusals, so an assessor recognises a defect they have not personally seen before.

**Areas 1–19 are ordered by what an assessor should look at first**, not by importance: place before pixels, structure before finish, feeling last — because the feeling is the consequence and it cannot be assessed before its causes.

---

### AREA 1 — One Door

**Owner:** Experience Architecture **Principle 4** and **§ 7** (behaviour). Visual expression: UI Architecture § 5. Translation: TRANSLATION1 *Thresholds* § 4, *Morning Rhythm* § 8.
*(The name is implementation-level language from `DESIGN1` § 0.1 / `HOUSE1` / `TRANSLATION1`. The **rule** is Principle 4's — *one primary action* — and this area invents nothing.)*

- **What is verified.** The surface has exactly one visually primary action; it is the **person's** most likely intent rather than the product's most desired behaviour; and every other action on the surface is visibly subordinate.
- **Why it matters.** A surface with two doors is doing two rooms' work and has not finished being designed (§ 7). A surface with **no** door is the more common and more invisible failure: it looks calm, it passes a glance, and it silently transfers the product's prioritisation work onto the household. Home currently has no door and this went unnoticed through the entire visual programme until NORTH1 § 8.3 — because *absence of a primary action looks exactly like restraint.*
- **How to assess.** Name the one door out loud, as a verb. Then count the elements competing for primacy — buttons, chevron rows, equal-weight card links, tiles. If naming the door requires a "well, it depends", the answer is that there isn't one. Then ask whether the door is the person's intent at this hour (Morning Rhythm § 8 — the one action is *re-aimed by relevance*, not fixed).
- **Typical failure patterns.** No primary action at all, disguised as calm · a launcher or tile grid presented as a threshold (NORTH1 § 5.3, § 5.4) · two co-primary actions "because both matter" · the door aimed at what the business wants (*upgrade*, *share*) rather than what the person came for (§ 7) · a menu at the arrival.
- **PASS** — one door, nameable as a verb in one sentence, visually primary, and it is the person's intent.
- **WARNING** — one door exists but competes with near-primary siblings; or it is correct but fixed where relevance should re-aim it; or it is primary by position rather than by construction.
- **FAIL** — no primary action; or two; or the primary serves the product rather than the person.

---

### AREA 2 — Orchard Exposure

**Owner:** Experience Blueprint **§ 6.2** (the Orchard Exposure Scale, E0–E3, and the three rules riding on it) and **§ 5.1** (the per-domain constant). Design reading: OHDB § 10. Translation: TRANSLATION1 *Windows*.

- **What is verified.** The surface sits at its domain's **governed** exposure level from the map (§ 5.1); the level was not chosen per-surface or adjusted mid-feature (rule 1); an honestly empty room opened its window **at most one level** and returns the moment content exists (rule 2); and no functional surface earned a view upgrade for looking plain (rule 3).
- **Why it matters.** The scale is the mechanism by which THA is many places without forking the product, and it encodes the inverse law — *exposure is inversely proportional to functional density*. Break it in one room and the room is merely wrong; break it uniformly and you have wallpaper, which is *the death of the place, however beautiful the image* (§ 16).
- **How to assess.** Look up the domain's row in the map (§ 5.1) and compare. Then check the **direction of the error**: too much view on a working surface is *all view, no room*; the same image at every level is *wallpaper*. Confirm the level is expressed as a governed value in the one token source, not a local decision (§ 6.2 rule 1).
- **Typical failure patterns.** One backdrop at one strength behind every room — the exposure scale not implemented at all (NORTH1 § 8.1 found exactly this, live) · a form given a view because it looked bare · an empty state opening two levels · a domain's level differing between two of its own screens · exposure as a component prop.
- **PASS** — the surface is at its mapped level, by a governed value, and the empty state obeys rule 2.
- **WARNING** — the level is right but set locally rather than by the token source; or an empty state opens the window and does not reliably return; or the domain's level is right on this screen and unverified on its siblings.
- **FAIL** — wrong level; or uniform exposure across domains (wallpaper); or a working surface mostly environment (*all view, no room*); or a taste-driven adjustment mid-feature.

---

### AREA 3 — One Morning

**Owner:** Experience Blueprint **§ 7** (one sun, one direction, one hour) and **§ 16** (*the second sun*). Design doctrine: OHDB § 11. Translation: TRANSLATION1 *Light* § 9, *Morning Rhythm* § 9 (which forbids the failure **by name** and instructs STOP).

- **What is verified.** One sun, upper-left, one hour, in every room; every shadow agrees; the surface never darkens for the hour, the mood, or "night as atmosphere"; light carries only the five permitted meanings — welcome · warmth · calm · clarity · optimism (Experience Language Principles 6, F); and the room's rhythm of the day is carried **entirely by the household's data**, never by the house's light.
- **Why it matters.** This is the most-cited law in the canon and the one whose violation is most attractive. It is what makes the house the one place that does not change under the household — and NORTH2 § 3.5 rejected a proposal to relax it, naming the cost precisely: *the household loses the one place that does not change under them.* "Atmosphere that varies by hour" **is** a theme; there is no third thing.
- **How to assess.** Check every shadow direction on the surface agrees. Then check whether *anything* about the surface's appearance is a function of the clock, the season, or a mood state — as opposed to a function of the household's true data. A greeting that reads *"Good evening"* from the real clock is **compliant** (Blueprint § 12.2 — the greeting is data-borne); a palette that warms at 6pm is a **FAIL**.
- **Typical failure patterns.** An evening theme, wind-down mode, or dimmed dinner-hour palette (forbidden by name — TRANSLATION1 *Morning Rhythm* § 9) · quieter rendered as darker in a reflective room (Diary; OHDB § 13.6) · multi-directional or cool shadow · a light sweep, glow, or flare that performs rather than warms · seasonal dressing (considered and **declined** — `EXP5` § 5.3; OHDB § 11).
- **PASS** — one morning, one shadow direction, no clock-driven appearance; time shows only through data.
- **WARNING** — the one morning holds but is asserted per-surface rather than by a shared value; or a light moment exists beyond the arrival's single sanctioned one; or a "reflective" room is trending quieter-as-dimmer without yet being dim.
- **FAIL** — any second sun: dusk, fog, spa-light, drama, night-as-mood, seasonal dressing, or any appearance that is a function of the hour.

---

### AREA 4 — Air & Space

**Owner:** Experience Blueprint **§ 8.2** (*air is a material*) · UI Architecture **§ 9** (the one spacing scale, density as the only modulator, one breakpoint truth, *breathing space is content's right*) · Experience Language **Principle 8** (the feeling). Translation: TRANSLATION1 *Space*.

- **What is verified.** Generous breathing space is the surface's **resting state**, not its leftover; all spacing comes from the one named scale with no private system; density is modulated only by the one density system; and content that will not fit with its air intact was **split, not compressed**.
- **Why it matters.** Space is the language's principal luxury and the cheapest thing to spend when a deadline arrives. Every compression is invisible individually and cumulative in aggregate: the product does not become cramped in one change, it becomes cramped in thirty. And *"a surface that must remove breathing space to fit its content has too much content"* is a rule about **scope**, not aesthetics — which is why removing air is a governance failure and not a trade-off (UIA § 9).
- **How to assess.** Look for raw spacing values and private scales first — they are mechanical and findable. Then ask the harder question: was anything compressed to fit? Compare the surface's density against its room's mapped posture (§ 5.1) — a bench is legitimately denser than a window seat, and both speak the same scale. On a large viewport, check that the extra width became **air and view, never more widgets** (TRANSLATION1 *Space* § 4).
- **Typical failure patterns.** Density arrived at by cramming rather than by design · a private spacing scale beside the canonical one · air removed to avoid splitting a surface · a wide screen filled with additional widgets · touch targets tightened at high density (UIA § 9 — touch is the default at *every* density).
- **PASS** — air is the resting state; every value from the one scale; density from the one system; nothing compressed.
- **WARNING** — spacing is correct but locally authored; or the surface is at the honest edge of its content budget and the next addition will cost air; or large-viewport width is filled rather than given to air and view.
- **FAIL** — raw or private spacing values; air removed to fit content that should have been split; density outside the one system; a second breakpoint truth.

---

### AREA 5 — Truthful Objects

**Owner:** Experience Blueprint **§ 12.1 rule 2** (*data-borne or dead* — *"a painted prop… is fabricated feeling, forbidden by construction"*) and **rule 3** (*honest in absence*) · OHDB **§ 4** (*the household's own life is the only ornament*) · TRANSLATION1 *Patina* § 9 (*patina by paint, never by data*). Behavioural root: Experience Architecture Principle 7 and § 12 (*never fabricate*).

> **Read this first.** `NORTH2` § 3.2 **refused "Truthful Objects" as a new principle**, on the ground that it is owned three times over. This area uses the name for the **audit**, and adopts nothing: it verifies the three owners' existing rules. Auditing against an owner is not creating a principle. If a future reader finds this area and NORTH1's rejected proposal and takes them for the same thing, this note is the correction.

- **What is verified.** Every object on the surface renders something **true** from a canonical owner; nothing is a painted prop; and when the data is silent the object is **absent** and the room is still complete.
- **Why it matters.** It is the one rule that is *structurally* enforceable rather than merely checkable — a detail that must invent content to exist is forbidden by construction, not by taste. And it is the substitution the whole visual programme turns on: **where a render puts a bowl of apples, the software puts the household's actual plan** (NORTH1 § 5.2). Warmth carried by set-dressing is warmth that will be found out.
- **How to assess.** For each object, name its canonical owner and the field it renders. If you cannot name one, it is a prop. Then remove the data in your head: does the object vanish and the room stay complete, or does it fall back to a placeholder? A fallback is a prop with a data source attached.
- **Typical failure patterns.** Drawn fruit, fake steam, decorative crumbs, worn edges, faux distress (Blueprint § 12.1 r2, by name) · a wall aphorism or framed "thought" — *not data-borne, and the product talking about itself on its own wall* (NORTH1 § 5.7) · a marketing tagline inside the working product · a placeholder styled as content · an object that persists with invented content when its data is empty.
- **PASS** — every object is data-borne from a named owner, and honest in absence.
- **WARNING** — an object is data-borne but falls back to generic content when empty; or its owner is nameable but not canonical; or absence has never been tested.
- **FAIL** — any painted prop, applied charm, fabricated feeling, or invented fallback content.

---

### AREA 6 — Honest Data

**Owner:** Experience Architecture **Principle 7** and **§ 12** (*never fabricate*; *show the working on request*) · UI Architecture **§ 14** (Visual Trust — evidence, confidence, uncertainty, semantic colour, status) · Core Principle 6 (honest gaps over invented facts).

- **What is verified.** Every displayed value comes from its single owner; nothing looks more certain, complete, urgent, or alive than the truth behind it; gaps render as designed honest absence; and no precision theatre, manufactured urgency, or optimistically pre-rendered status appears.
- **Why it matters.** This is where the visual layer can lie without a single false word. *"An interface can fabricate with styling just as surely as with words"* (UIA § 14). The test is the sharpest in the canon: **a person who believes exactly what the pixels imply must end up believing the truth.**
- **How to assess.** Take each number, score, status, and claim on the surface. Name its owner. Ask what evidence supports the precision shown — two decimal places on a derived estimate is a lie told in typography. Check that stale or unknown status **says so** rather than posing as current. Check the assertion can show its working (§ 12; UIA § 14).
- **Typical failure patterns.** Decimals beyond the knowledge's support (precision theatre) · greyed "estimates" a person will read as data · a status pre-rendered optimistically before the owner confirmed it · red for the merely unfinished (alarm styling on a routine state) · a value duplicated on the surface in two treatments (§ 9 — *a fact is styled once*) · an assertion with no path to its evidence.
- **PASS** — every value owned, every confidence honestly styled, every gap an honest absence, evidence reachable.
- **WARNING** — the data is honest but the evidence path is buried or inconsistent; or confidence is correct today but the styling would not weaken if the evidence did.
- **FAIL** — any fabrication, precision theatre, disguised uncertainty, manufactured urgency, or status posing as current.

---

### AREA 7 — Living Details

**Owner:** Experience Blueprint **§ 12** — the six laws (§ 12.1) and the governed library (§ 12.2).

- **What is verified.** **At most one** per domain (not one kind — *one*); data-borne; honest in absence; below the emphasis budget; **still**; and admitted as its own named decision rather than as part of a batch.
- **Why it matters.** *"Lived-in" is the hardest word in the palette and the easiest to fake.* The one-per-domain ceiling is what stops warmth from becoming decoration by accretion — each detail is defensible on its own, and the third one is what turns a room into a gift shop. The removal test is the proof of a working detail: *its loss felt only as a slight cooling* (§ 12.4).
- **How to assess.** Count them. If the count is above one, the area fails regardless of quality — *a second detail in a room retires the first in the same decision* (§ 12.1 r1). Check the detail against its library row (§ 12.2) — its data source and its **ceiling**. Then apply the removal test: remove it mentally; if nothing cools, it was never a Living Detail; if something breaks, it was never below the emphasis budget.
- **Typical failure patterns.** Two details in one room because the first was liked (*charm by the batch*, § 16) · a detail carrying status meaning or competing with the primary · a detail that animates (§ 12.5 — the Companion's arrival beat is the one governed exception) · a detail exceeding its library ceiling (a badge where the ceiling is a half-step of warmth) · a detail added to Admin because every other room has one (Admin's is **none — deliberately**, § 5.1).
- **PASS** — exactly one (or none, where mapped), data-borne, still, within its ceiling, honest in absence.
- **WARNING** — one detail, correct, but drifting toward its ceiling; or admitted as part of a batch rather than as its own decision; or its absence state is untested.
- **FAIL** — more than one per domain; any animated detail; any detail carrying status; any exceeding its library ceiling; any not in the library and not admitted by governance.

---

### AREA 8 — Companion Presence

**Owner:** Experience Blueprint **§ 13** (its place in the house) · Experience Architecture **§ 11** (its conduct) · Experience Language **Principle 7** and **§ 5.7** (its feeling) · UIA § 10 (its imagery). Knowledge and voice: the Intelligence Governance documents (INT17; PKR2 § 12).

- **What is verified.** One presence, one fixed chair, same position in every room; foreground; lit by the room it opens in and never differently; arriving a beat after the person; invited not intrusive; dismissible and non-repeating after dismissal; honest about its limits; suggesting and never deciding.
- **Why it matters.** The fastest way to make an intelligent product feel like a nagging one is to let it speak unprompted — *the trust it spends is the most expensive currency THA has*. And the spatial rule has a specific failure: a differently-lit Companion **becomes a stage** (§ 13), at which point the friend at the counter has become a performance of a friend.
- **How to assess.** Check its position against every other room's. Check its light against the room it is in. Dismiss it, then return — does it repeat as if new? Ask it something it cannot know — does it say so plainly, or does it fabricate? Check that it *refers* to canonical places rather than duplicating their presentation (the Discovery & Presentation Principle, which sits inside Experience Architecture § 11).
- **Typical failure patterns.** A face, avatar's gaze, pulse, typing dots, or simulated mood (UIA § 10; Blueprint § 13, by name) · greeting before the house has · following the household room to room · a modal for an observation · a dismissed notice returning as new · opening a return with everything that happened while they were out · a differently-lit panel (the stage) · **absence** — the friend having no chair in a room at all (NORTH1 § 9 noted the reference render omits it entirely).
- **PASS** — one presence, one chair, room's own light, the beat, dismissible, honest, referring not duplicating.
- **WARNING** — conduct correct but position or light asserted per-surface rather than shared; or the beat is right but implemented locally; or its honest-limits behaviour is untested.
- **FAIL** — any simulated life (face, pulse, typing, mood); modal interruption; repetition after dismissal; a second presence; a differently-lit stage; deciding rather than suggesting.

---

### AREA 9 — Canonical Navigation

**Owner:** Experience Architecture **§ 8** (behaviour — one canonical navigation, few stable destinations, Home in the anchor position, honest location, no dead ends, *boring on purpose*) · Experience Blueprint **§ 14** (the shell as the walls) · UI Architecture **§ 6** (the one page anatomy) · Experience Language **Principles 9 and E** (the feeling; *emotional experimentation earns no exception*).

- **What is verified.** Exactly one navigation, identical in content and order everywhere; the shell **byte-identical** beneath this surface; current location visibly marked; Home one obvious step away; and no exception claimed for emotional or experimental work.
- **Why it matters.** *The walls are what make many places one home.* The moment a room modifies the frame to feel more like itself, the house has lost a wall — **and every other room pays for it** (§ 14). The cost is never local, which is why this area has no soft version.
- **How to assess.** Diff the shell against another room's. Look for a private navigation grown inside the surface — a left rail, a launcher, a tile grid, a back-link pattern unique to this room. Check the container: NORTH1 § 8.4 located the canon's open item precisely — Home is the only one of sixteen `WorkspaceHeader` pages not using the canonical container. Check location marking is honest and every path has a way back.
- **Typical failure patterns.** A six-tile launcher on Home (NORTH1 § 5.3 — *"it is not just uncanonical, it is worse than what is already live"*) · a second navigation appearing in one room and not another — **the shell forked between two screens of the same concept** (§ 5.5) · subtitles or descriptions on nav items that cannot survive being identical in every room · adaptive/reordering navigation · a surface hand-rolling its container.
- **PASS** — one navigation, shell byte-identical, location honest, Home one step away.
- **WARNING** — the shell is visually identical but locally re-implemented rather than consumed from its owner; or an exemption exists and is recorded (UIA § 17) but unclosed; or Home's container divergence (Blueprint § 18.2) touches this surface.
- **FAIL** — a second navigation; any shell modification; an unrecorded exemption; a dead end; location marking that lies.

---

### AREA 10 — Progressive Disclosure

**Owner:** Experience Architecture **§ 5** and **Principle 2** (the three layers; *disclosure is by intent, not by accident*) · Experience Language **Principle 1** (arrival before information) · OHDB § 4 (*the interior is designed for the person standing in the doorway*).

- **What is verified.** The essence lands first; depth is revealed because the person **asked** (opened, expanded, followed) and never because a screen had room to fill; every summary honestly leads to its canonical depth; and the essential experience works for a person who never opens layer three.
- **Why it matters.** Depth imposed is clutter with a justification. And the rule has a second half that is routinely missed: *"every layer is honest about the next"* — a summary that does not visibly lead somewhere deeper is not a summary, it is an amputation, and the person cannot tell which.
- **How to assess.** Name layer one, layer two, layer three for this surface. Then check the *trigger* on each disclosure: is it the person's intent, or the layout's spare room? Then verify the surface still works if layer three is never opened. Then check the reverse: is anything at layer one that should be at layer two?
- **Typical failure patterns.** Depth shown at arrival because the surface looked bare · a summary with no path to its canonical page (a *"glance card with no door"* — NORTH1 § 5.4) · methodology imposed on everyone rather than offered to whoever asks · a surface that requires layer three to be usable · an expansion that reveals what should have been the essence.
- **PASS** — three honest layers, disclosure by intent, essence sufficient alone, each layer leads to the next.
- **WARNING** — layers are correct but a disclosure trigger is ambiguous; or the path to depth exists but is inconsistent with sibling surfaces; or layer one is at its honest limit.
- **FAIL** — depth imposed at arrival; a summary that leads nowhere; the essential experience requiring depth; disclosure driven by spare room.

---

### AREA 11 — Visual Hierarchy

**Owner:** UI Architecture **§ 5** (the order made visible; the two-second rule; *emphasis spends four currencies*; *a fact is styled once*) · Experience Architecture **§ 9** (the canonical attention order: orientation → state → primary action → detail → depth). Ordering law: TRANSLATION1 § 5.2 (*light before colour*).

- **What is verified.** Prominence descends in exactly the canonical order; a two-second glance yields orientation, state, and the one primary action; each fact is styled once; and emphasis is spent as a budget on the few items at the top and **deliberately withheld** from the rest.
- **Why it matters.** Hierarchy is the product's most repeated promise — *a person who has learned one THA page has learned them all* — so breaking it costs every future visit, not this one. *If everything is highlighted, nothing is.*
- **How to assess.** Glance for two seconds and write down what you got. Compare against the three required answers. Then trace the eye's path and compare against the canonical order. Then check *how* the primary leads: **it should lead by standing in the light, never by wearing a colour the room lacks** (TRANSLATION1 § 5.2) — a primary that needs an accent colour to win is a hierarchy failure wearing a paint job.
- **Typical failure patterns.** A two-second glance yielding decoration, promotion, or noise · two primary-styled actions · the same value shown twice in two treatments · hierarchy carried by colour where light and weight should carry it · an amber alert badge at a threshold (*attention taken rather than borrowed* — NORTH1 § 5.4) · emphasis sprinkled rather than spent.
- **PASS** — canonical order, two-second rule met, one primary style, each fact once, emphasis withheld.
- **WARNING** — the order holds but emphasis is at its budget's edge; or hierarchy is carried by colour where light would serve; or the two-second answer is correct but slow.
- **FAIL** — two primaries; a fact styled twice; a two-second glance yielding noise; prominence out of canonical order.

---

### AREA 12 — Calm Without Emptiness

**Owner:** Experience Language **§ 3A.4** (*calm must never become lifeless* — the governing principle) and **§ 3A.1** (the eight never-feelings) · OHDB **§ 4** (*composed emptiness, never bare emptiness*) · Experience Language **§ 7** (*clinical minimalism*, *cold luxury*, *emotionally distant*) · UIA § 12 (the canonical empty state). Translation: TRANSLATION1 *Quiet Corners*.

- **What is verified.** The surface is calm **and warm** — its quiet was not achieved by draining life out; its emptiness reads as *tended* rather than *abandoned*; and its empty state is the **warmest** state, not the coldest.
- **Why it matters.** This is the quiet counterfeit of calm, and it is the one the canon nearly missed: § 3 forbade the loud counterfeits from the start, and nothing forbade the quiet one until EXPLANG1B added § 3A in July. *"Calm's failure state rather than its achievement."* And it is the failure the reference render was commissioned to test — *THA's single greatest visual risk is cold, clinical, lifeless calm* (ORCHARD3 § 1.2).
- **How to assess.** Ask the § 6 questions verbatim: *does this feel warm as well as calm, or has the calm been achieved by cooling it down? Does this space feel alive — bright, fresh, optimistic — rather than still, misty, or hushed? Would a family feel welcomed here — not merely impressed?* Then find the surface's coldest plane and ask whether it is warm **by construction or by accident** (§ 2.1). Then assess the **empty state specifically**, not the populated one — a rendered good day cannot fail at warmth (NORTH1 § 3, on why the render could not be assessed here).
- **Typical failure patterns.** Any of the eight never-feelings — cold · clinical · empty · silent · sterile · luxury-for-luxury's-sake · funeral-parlour calm · emotionally distant · spa-like stillness or meditation-retreat aesthetics posing as serenity · a show home: *"impressive"* rather than *"I'm glad to be here"* · a cold plane masked by an opacity crutch rather than corrected by material (NORTH1 § 8.2) · an empty state that is a hole rather than a designed calm.
- **PASS** — calm and warm; emptiness composed and tended; the empty state is the warmest state; every plane warm by construction.
- **WARNING** — warm today but **by accident** — through translucency, a bleeding background, or any mechanism an unrelated change would remove (§ 2.1); or the populated state is warm and the empty state untested.
- **FAIL** — any never-feeling present; calm achieved by draining life; a cold plane; an empty state that reads as *nobody home*.

---

### AREA 13 — Household First

**Owner:** TRANSLATION1 *Household Presence* and **§ 5.6/§ 5.7** (*household before technology*; *people before data*) · Experience Blueprint **§ 1.5** (the Technology Principle) · Experience Language **§ 4A Principle A** (the THA Promise) · OHDB § 13.7.

- **What is verified.** The household is the most present thing on the surface; technology does not become the subject; a person is never reduced to fields, scores, or a dashboard about themselves; and the surface leaves the household with **less** to carry, not more.
- **Why it matters.** *Technology should quietly disappear; the household should always feel present* — five words quotable in any review: **the household present, the technology gone.** And the Promise's test is the one that catches a feature that works perfectly and is still wrong: it billed its cost back to the household as new effort, new decisions, or new worry.
- **How to assess.** Apply the Promise's three questions (Principle A): does this **reduce effort**, **increase confidence**, and **give time back**? A decision failing all three is *weight wearing the costume of a feature*. Then ask what the surface's subject is — if a stranger looked at it, would they say it is about a family, or about a system? Then check the surface never makes a person feel *less capable in their own kitchen* (the Orchard Promise, Orchard Living Book).
- **Typical failure patterns.** Dashboard furniture in place of the household — scores as trophies, streaks, notification piles, *"you haven't…"* (TRANSLATION1 *Household Presence* § 9) · a screen showing off its data density, configurability, or brand · people rendered as form fields (OHDB § 13.7) · success measured as engagement or time-in-product · an aspirational lifestyle image in which the household stops being the subject (NORTH1 § 5.8).
- **PASS** — the household is the subject; the Promise's three questions answer yes; nothing shows off.
- **WARNING** — the household is the subject but the surface is accruing product furniture; or one Promise question answers no and the other two carry it.
- **FAIL** — the technology or the design is the subject; people reduced to fields; the surface adds to what the household carries; guilt, streaks, or trophies.

---

### AREA 14 — Trust & Explainability

**Owner:** Experience Architecture **§ 12** (never fabricate · show the working on request · attribute honestly · data belongs to the household · **no dark patterns, without exception** · predictability is reassurance · destructive actions guarded proportionally) · UI Architecture **§ 14** (how evidence and confidence are rendered).

*(Area 6 audits whether what is shown is **true**. This area audits whether the person can **see why**, **correct it**, and **leave** — the relationship, not the value.)*

- **What is verified.** Any score, recommendation, or claim can explain itself on request; external content carries its provenance; the household can see, correct, and remove what THA knows; destructive actions are guarded proportionally and nothing irreversible happens as a side effect; and the surface is free of dark patterns.
- **Why it matters.** Trust is the currency; § 12 is the section protecting it, and it is the one place the canon says *without exception*. Note the premium standard's sharpening: *trust must be actively re-confirmed, not merely never betrayed* (PP9).
- **How to assess.** Pick the surface's strongest claim and try to reach its evidence. Try to correct something THA believes. Try to leave, downgrade, or delete — count the steps and look for friction placed deliberately in the path. Check each destructive action's guard is proportional to its consequence — *deleting a meal asks once, clearly; deleting a household's history explains consequences fully.*
- **Typical failure patterns.** Manufactured scarcity, guilt copy, confirm-shaming, hidden opt-outs, friction on leaving (§ 12, by name) · an assertion with no evidence path · content from outside THA presented as THA's own · a dark corner — data THA holds that the household cannot see · an irreversible side effect · a change that silently rearranged something people rely on.
- **PASS** — every claim explains itself; provenance honest; data visible and correctable; guards proportional; no dark patterns.
- **WARNING** — evidence is reachable but inconsistently placed; or a guard is proportional but its copy under-explains the consequence; or provenance is present but not in the canonical place.
- **FAIL** — any dark pattern (no exception exists); an unexplainable claim; a dark corner; an irreversible side effect; a disproportionate or missing guard.

---

### AREA 15 — Accessibility

**Owner:** Experience Architecture **§ 16** (accessibility as a **design input**, not a compliance pass; *no household shape is the "default"*; *calm design is accessible design*) · UI Architecture **§ 15** (the measurable floors).

- **What is verified.** Contrast **measured** against recognised standards as a floor for every semantic pairing in every supported mode; every interactive element has a visible focus state, a comfortable target, and an accessible name; text scales to at least double without loss of content or capability; meaning never colour-alone, never motion-alone, never imagery-alone; the type floor holds; and cognitive load was treated as seriously as contrast.
- **Why it matters.** A floor, not a ceiling — and *"calm is accessibility"*: **a surface may not trade calm away and call itself accessible** (UIA § 15). The reverse also binds: an inaccessible surface is not calm, it is calm-for-some.
- **How to assess.** Measure contrast — do not eyeball it, and note the trap NORTH1 § 5.6 named: **a translucent panel over an image has *contingent* contrast and cannot be measured once**, which is precisely why the canon requires type on *solid* ground. Tab the whole surface. Double the text. Turn off colour. Turn on reduced motion and confirm no meaning was lost. Then check the inclusivity half: does anything assume a household shape, a gender of cook, a body type of eater, or an idealised plate?
- **Typical failure patterns.** Contrast unmeasured, or unmeasurable because type sits on imagery (NORTH1 § 5.6) · an icon-only control with no accessible name · focus invisible somewhere in the surface · meaning carried by colour alone · text truncating rather than reflowing at 200% · a mode offered but not completely resolved (UIA § 7 — *if a mode is offered, it is offered completely*) · copy assuming a family shape · reduced motion losing meaning.
- **PASS** — every floor measured and met; every meaning multiply carried; text scales; nothing assumes a household shape.
- **WARNING** — floors met but unmeasured (met by inspection rather than by measurement); or met in one mode and unverified in another; or a target is comfortable at one density and untested at another.
- **FAIL** — any floor breached; contingent (unmeasurable) contrast; colour-alone or motion-alone meaning; a partially-resolved mode; capability lost at double text.

---

### AREA 16 — Performance & Responsiveness

**Owner: none — and this is a finding, not an omission by this document.** See § 6.2.

The fragments that exist, each owned: Experience Language **Principle 2** (*calm over speed* — *"fast where the person is waiting; calm where the person is deciding"*; responsive ≠ hurried) · UI Architecture **§ 12** (*loading — shape before spin*; layout-stable placeholders; loading is silent) · Experience Architecture **§ 17.1** (a feature is not done until its **slow-connection state** is designed) · Experience Language Principle 1 (*content reflowing or popping in as the person watches* — an anti-pattern) · Blueprint § 16 (*metaphor taxing function* — *any place-character that costs a click, a legibility point, or a frame of scroll performance*).

- **What is verified.** Speed is spent on removing waiting, never on producing a sensation of velocity; loading preserves the shape of what is coming and never lurches; the slow-connection state is **designed**, not incidental; nothing performs pace; and no place-character costs a frame.
- **Why it matters.** Performance is where calm is silently lost: a surface that lurches, pops in, or assembles in front of the person contradicts *arrival before information* at the one moment it matters most — *the shell is already there when they arrive, so nothing lurches into being* (Principle 1). The household experiences slowness as anxiety and never as an engineering fact.
- **How to assess.** Load the surface on a throttled connection and watch it **as a person**, not as a developer: does it assemble in front of you? Does anything lurch, pop, or reflow? Is there a full-page spinner or literal "Loading…" text (both retired — UIA § 12)? Is the slow state designed or merely what happens? Then check the inverse failure: does anything race or animate to *feel* fast?
- **Typical failure patterns.** Content popping in as the person watches · a full-page spinner or loading theatre · placeholders that do not preserve layout, so the page lurches · a slow-connection state nobody designed (making the feature a demonstration, not a feature — § 17.1) · motion racing to signal speed · a place-character costing scroll performance.
- **PASS** — nothing lurches; loading preserves shape and is silent; the slow state is designed; nothing performs pace.
- **WARNING** — the happy path is calm and the slow path is undesigned or untested; or loading is shape-preserving on some regions and spinner-driven on others.
- **FAIL** — the surface assembles in front of the person; loading theatre; a lurching layout; a place-character taxing performance.

> **Grade this area, and record the gap.** Because no document owns the *threshold*, a FAIL here can be cited to a named rule (*shape before spin*, *the slow-connection state is designed*) but a numeric budget cannot — there isn't one to cite. **Do not invent one in an audit.** Record the finding and route the gap to § 6.2.

---

### AREA 17 — Mobile Consistency

**Owner:** UI Architecture **§ 9** (density as the responsive model; **one breakpoint truth**; touch as the default at every density) and **§ 6** (the anatomy is universal) · Experience Architecture **§ 16** (text scales, time flexes) · TRANSLATION1 *Space* § 4 (*the extra width of a large screen becomes air and view, never more widgets*).

- **What is verified.** The surface is the **same room** at every size — same anatomy, same hierarchy, same one door, same shell; density modulates only through the one density system; what counts as small/medium/large is the one product-wide truth; touch targets are comfortable at every density; and the surface loses no capability at any size.
- **Why it matters.** *Most households arrive on a phone* (NORTH1 § 5.8; PX1). A design that exists only at its best size is not a design — **it is one composition at one size for one household** (§ 5.8). This is the area most often passed by assessing the desktop and assuming the rest.
- **How to assess.** Open the surface at three sizes and answer the Experience Test (Blueprint § 15.3) at each: *which room · how should someone feel · the one thing*. If the answers differ, it is not one room. Then check the large size specifically — did the extra width become air and view, or more widgets? Then check the small size: what was dropped, and was it capability?
- **Typical failure patterns.** Capability available only on desktop, without a recorded exemption (UIA § 6 — exemptions are *in the register, with a reason*, never assumed) · a second breakpoint truth (two surfaces disagreeing about whether the same screen is small — *a governance failure, not a detail*) · touch targets tightened at compact density · a composition with a fixed relationship that cannot reflow (NORTH1 § 5.8 — *"interfaces reflow; vanishing points do not"*) · the primary action moving between sizes · a hero that works at 1400px and has no honest 390px form.
- **PASS** — one room at every size; one density system; one breakpoint truth; touch comfortable throughout; no capability lost.
- **WARNING** — consistent but verified only at two of three sizes; or an exemption exists and is unrecorded; or extra width is filled rather than given to air.
- **FAIL** — a different room at a different size; capability lost without a recorded exemption; a second breakpoint truth; a composition that cannot honestly reflow.

---

### AREA 18 — Architectural Consistency

**Owner:** UI Architecture **Principle 4** (one canonical owner per visual concern), **Principle 5** (retire on introduction), **§ 16** (semantic tokens; *a raw value in a surface is a defect*), **§ 17** (the adoption register; *authored-but-unadopted must be impossible to hide*) · Experience Architecture **Principle 6** (one canonical place for everything) · Experience Language **Principle 11** (consistency creates trust). Register: `docs/implementation/ux/ADOPTION_REGISTER.md`.

- **What is verified.** Every visual concern the surface touches uses its **one canonical owner**; nothing is re-implemented beside its owner; every colour, size, spacing and duration references a semantic name; any successor introduced retired its predecessor in the same change; and every exemption is **in the register, with a reason**.
- **Why it matters.** *THA's visual problem has never been bad design; it is ungoverned convergence* (UIA § 1). The failure mode is always identical — **authored, partially adopted, never retired** — and PX1 found it live: `hover-elevate` consumed everywhere and defined nowhere; `prefersReducedMotion()` with zero consumers; `PageHeader.tsx`, a complete unadopted successor, sitting live-looking in the tree for the next workstream to adopt *instead of* the real owner.
- **How to assess.** For each visual concern on the surface (header, card, dialog, field, empty state, loading state, error boundary, status, rating mark, brand mark, icons, motion, tokens) name its owner and confirm the surface consumes it rather than reproducing it. Grep for raw values — they are mechanical and there is no judgement involved: *a raw value in a surface is a defect*. Then check the register: is anything the surface uses authored-but-unadopted, or exempt-but-unrecorded? Run `npm run adoption:check`.
- **Typical failure patterns.** Hardcoded colour literals bypassing the token system (NORTH1 § 8.5 found three on Home) · a concern re-implemented locally because the owner was *almost* right · a successor introduced with its predecessor left "dormant" (**prohibited** — UIA § 17) · a silent exemption · two owners of one concern defended as temporary · the same concept named two ways (Experience Language Principle 11).
- **PASS** — every concern from its owner; zero raw values; no unretired predecessor; every exemption registered; `adoption:check` passes.
- **WARNING** — canonical owners used but one exemption is recorded and unclosed; or a successor is mid-migration with a named, dated plan; or a value is semantic but its name is not yet admitted.
- **FAIL** — any raw value; any re-implementation beside an owner; any dormant predecessor; any unrecorded exemption; two owners of one concern.

---

### AREA 19 — Emotional Character

**Owner:** Experience Language **§ 3** (the seven feelings), **§ 3A** (the Emotional Palette), **§ 6** (the Experience Review Questions), **§ 7** (the anti-patterns) · OHDB **§ 16.2** (the Design Character Check) · Experience Blueprint **§ 17** (the Design North Star).

*(Assessed **last**, and only after areas 1–18. The feeling is the consequence of everything above it; assessed first, it becomes an opinion. Assessed last, it is the check on whether the other eighteen actually produced what they exist to produce.)*

- **What is verified.** The surface produces THA's feeling — calm · welcoming · effortless · intelligent · reassuring · premium · quietly memorable — at the palette's temperature, without becoming theatrical, gimmicky, or distracting; it adopts no anti-pattern; it is timeless rather than fashionable; and **the design disappears**.
- **Why it matters.** This is the one area no checklist can reach, and the reason the Experience Language exists: *a change can pass every box on both checklists and still feel cold, theatrical, cluttered, or slippery — because a checklist verifies that rules were followed, not that a feeling was produced.* A surface that passes areas 1–18 and fails this one **is not done** — that is the Experience Language's standing verdict, not this standard's invention.
- **How to assess.** Answer Experience Language § 6 in full — all six blocks, honestly. Apply OHDB § 16.2's Design Character Check. Then the three tests that settle it, each quotable: *would the household **feel** the care here — or only **notice** the effect?* · *if the person notices the animation before the content, the animation has failed* (Principle H) · *would this still look right in ten years, or would it look **of** a specific past moment?* (OHDB § 14.2). Then the North Star's tie-breaker: **when two designs both pass every gate, choose the one the household would feel and could not name.**
- **Typical failure patterns.** Any Experience Language § 7 anti-pattern · a signature effect designed to be remembered · frosted glass, or any technique that is *of this moment* (NORTH1 § 5.6 — *"the plaster and the oak pass, and the glass does not"*) · a surface built to be admired rather than lived in (a show home) · marketing gimmicks inside a functional workspace · correctness without care — *behaviourally and visually correct but feels like nobody is home* (§ 3A.2) · the design noticing itself.
- **PASS** — the seven feelings produced at the palette's temperature; no anti-pattern; timeless; the design disappears.
- **WARNING** — the feeling is produced but one technique is datable, or one effect is nameable by the person, or the care is inferable rather than felt.
- **FAIL** — any anti-pattern adopted; a never-feeling produced; a memorable effect rather than a memorable feeling; a surface that is admired rather than inhabited.

---

## 4. THE EVIDENCE STANDARD

A verdict without evidence is an opinion with a grade on it. **An audit is not honest until each of these is true.**

### 4.1 What must have been looked at

1. **The governing documents** listed at the head of this standard — read, not remembered. An assessor citing a rule from memory will cite the version they liked.
2. **The surface's row in the map** (Blueprint § 5.1) — exposure, light character, ground posture, Living Detail. Areas 2, 3, 4, 7 are unassessable without it.
3. **The surface at three sizes**, and in **every state** the canon designs: populated, **empty**, loading, error, slow-connection, and at least one awkward edge (a long household name, a large family, a very long list). *A feature is not done when it works; it is done when its empty, loading, error, slow-connection, and edge-case states have each been designed* (§ 17.1). **A surface assessed only on a good day has not been assessed** — this is exactly what NORTH1 § 3 found made the reference render unassessable at its hardest state.
4. **The adoption register**, for areas 9, 17 and 18 — an exemption that exists only in an assessor's head is an unrecorded exemption.
5. **The code**, where the area is mechanical. Areas 15 (contrast), 18 (raw values, dormant predecessors) and 2 (exposure as a governed value) are **verifiable, not judgeable**. NORTH1's most load-bearing findings came from reading three files. Judgement is for what cannot be measured; it is not a substitute for measuring what can.

### 4.2 What a finding must carry

Every WARNING and FAIL carries four things, or it is not a finding:

- **the rule**, cited to its owning document and section — never to this standard;
- **the evidence** — where it is, at `file:line` where the defect is in code, and at a named state and size where it is in the surface;
- **the failure**, stated as what a person would experience, not as a rule number;
- **the grade**, and — for a WARNING — **the mechanism by which it is currently true**, which is the whole content of a WARNING (§ 2.1).

### 4.3 Who may assess

- **Not the person who built it, alone.** Not for distrust — for the reason the whole canon is built on: the author knows what they *meant*, and every area here assesses what the surface *does*. A self-audit is a useful draft and is not an audit.
- **Any of the four audiences** may assess: a designer, an engineer, a reviewer, or an AI implementation agent. The standard is written to be applied identically by all four, which is why every area names an owner and a procedure rather than appealing to taste.
- **An AI agent has one extra obligation**, and it is the one it will most want to skip: *do not infer a rule.* If an area's owner does not say the thing you are about to grade against, **you are inventing a principle**, which this standard and the mission that created it both forbid. Cite, or do not grade. Where the canon is silent, record silence as a gap (§ 6.2) — never fill it.

## 5. THE COMPLIANCE SCORE

An overall score exists for **one** purpose — sequencing work across surfaces — and it is dangerous for every other purpose. It is stated as a fraction and a band, and it is **never** an average.

> **Score = (PASS count) / (applicable areas)**, with the band set by the worst grade present, not by the ratio:
>
> - **COMPLIANT** — no FAIL, no WARNING.
> - **COMPLIANT WITH DRIFT** — no FAIL; one or more WARNINGs. The surface is lawful and is decaying. This is where almost every real surface will land, and that is the correct and useful result.
> - **NON-COMPLIANT** — one or more FAILs. The count is reported; the band does not soften with a good ratio.

**The rules that keep the score honest:**

- **A FAIL is never averaged away.** 18 PASSes and one FAIL is NON-COMPLIANT. A surface that fabricates data is not 95% trustworthy.
- **The band is not a percentage of quality.** It is a count of areas, and areas are not equal. Nobody may report *"94% compliant"*.
- **The score never travels without its findings.** A band on its own is exactly the artefact this standard was built to prevent — a document that says the house is fine.
- **Scores compare surfaces; they never rank people** (§ 2.2).
- **A PASS expires.** It is a statement about a surface on a date, under the canon as it stood. Re-audit after material change to the surface, or after any amendment to an owner.

## 6. WHAT THIS STANDARD FOUND WHILE BEING WRITTEN

Two things surfaced that the standard cannot fix and must not hide.

### 6.1 Three governing documents declare an enforcement that does not exist

`ENGINEERING_WORKFLOW.md` contains **no reference** to `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_KEPT_ROOM_TRANSLATION.md`, or `THA_ORCHARD_LIVING_BOOK.md` — not in the Architecture Bootstrap (STEP 2) reading list, and not in the Experience & UI Governance Compliance block, which names four documents and five checks.

Yet OHDB's header declares *"**Enforced by:** the Experience & UI Governance Compliance block in `ENGINEERING_WORKFLOW.md`"*, and § 16.2 contributes the **Design Character Check** to that gate. **The check is unreachable by anyone following the workflow.** TRANSLATION1 (§ 7.1) declares itself *"required reading before any user-facing implementation"* and is likewise unnamed there.

This is precisely the gap `ARCH-VERIFY1` closed on 2026-07-11 — *"a governing rule that only fires when its author happens to remember it is not enforced; it is hoped for"* — reopened by the three documents adopted on 2026-07-15, each of which declared its enforcement without wiring it.

**Not fixed here.** It is a workflow amendment and needs its own approval. Recorded so it is not rediscovered a third time. **Until it lands, an auditor applies the Design Character Check via Area 19 regardless** — this standard names OHDB § 16.2 as an owner, which routes to it whether or not the workflow does.

### 6.2 Performance & Responsiveness has no owner

Area 16 is the only mission-named area with no owning document. Fragments exist and are cited there; a **threshold, a budget, or an owner** does not. The consequence is precise and worth stating plainly: an assessor can FAIL a surface for loading theatre (cited to UIA § 12) but cannot FAIL it for being slow, because no document says how fast is fast enough.

**This standard does not invent one** — that would be a new principle, which the mission forbids and the architecture would reject as an ownerless rule arriving through an audit instrument. Recorded as an open item for governance. The honest reading: THA governs *the feeling of speed* (Experience Language Principle 2) thoroughly, and *speed itself* not at all.

## 7. WHERE THESE DOCUMENTS SHOULD LIVE

*(A recommendation. **Nothing has been applied** — no governing document was modified, per the mission's instruction and Blueprint § 18's *"change enters by governance, never by shipping."*)*

### 7.1 The standard is not architecture, and the reason matters

It contains **no rule**. Every area cites an owner; the yield clause (§ 1.2) makes any rule found here a defect to be corrected into a citation. A document that owns no rule cannot be governing architecture in this canon's own terms — it is an **instrument**, and instruments in THA are *operational*: they live beside the implementation, they track debt, they are corrected rather than superseded, and their **existence** is mandated by architecture while their **content** is not.

The precedent is exact, and it is the register: **UIA § 17 mandates the adoption register's existence** — *"the register lives beside the implementation (it is operational, not architectural); its existence is mandated here"* — and `ADOPTION_REGISTER.md` lives at `docs/implementation/ux/`. This standard is the same shape. The audit obligation is architecture; the audit method is not.

### 7.2 The recommendation, in three parts

| What | Where | Why |
|---|---|---|
| **The obligation to audit** — that every major surface is audited against this standard before it is considered compliant, and re-audited after material change | **`THA_EXPERIENCE_BLUEPRINT.md` § 15**, as one new **§ 15.4**, by governed amendment | § 15 is already **the only place in the canon that holds the gate system as a whole** — § 15.1 enumerates the three gates it does not replace; § 15.2 and § 15.3 are its own. § 2.2 already lists *"the Blueprint Checks, the Experience Test, and the spatial anti-patterns"* among what it owns. A per-surface audit is the same kind of thing, in the same section, owned by the same document. **No renumbering; one subsection.** |
| **The standard itself** (this document) | **`docs/implementation/ux/`**, beside `ADOPTION_REGISTER.md` | Operational, per § 7.1. Corrected as owners change, not superseded. |
| **The audit template** | **`docs/implementation/ux/`**, beside the standard | Same. Completed reports are filed per `REPOSITORY_CONVENTIONS.md` § 3 — see § 7.4. |

### 7.3 The documents considered and rejected as owners of the obligation

| Candidate | Why not |
|---|---|
| **`THA_EXPERIENCE_ARCHITECTURE.md`** | It is **technology-independent** and **deliberately not a visual style guide** (§ 1). The audit spans place, light, material, and design-character areas. Putting it here would be the first time that document named a visual concern — **the exact move `NORTH2` § 1 refused for all five NORTH1 proposals**, five days ago, on this same reasoning. It stays byte-untouched. |
| **`THA_UI_ARCHITECTURE.md`** | The audit sets no value and spans far past presentation. UIA § 17 is the *pattern* for the recommendation (§ 7.1), not the home for it. |
| **`ENGINEERING_WORKFLOW.md`** | It governs **what a change must contain**. An audit is not a change — a surface can be audited with nothing shipped, which is the entire point (§ 1.3). The workflow should reference the obligation once the Blueprint owns it, in the same way it references the six gates and restates none of them. **And it has a prior obligation:** § 6.1's gap should be closed first, or the audit gets wired into a block that still cannot reach OHDB. |
| **`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`** | It owns design *character* and contributes one check. It is an owner the audit routes to, not the audit's home. |
| **A new governing document** | It would be the eighth. **The Blueprint's own § 1.3 warns that this canon *"was becoming a library rather than a blueprint — the vision reconstructible only by reading five documents in the right order"*; there are now seven.** NORTH2 § 1 refused four proposals partly on this ground. An audit instrument does not earn the eighth. |

### 7.4 If adopted, the sequence

1. **Apply the § 15.4 mandate** to the Experience Blueprint as a **named governance decision** per Blueprint § 18, citing `EXPCOMP1` as its source in the way § 2.4 records the EXP2–EXP5 graduations.
2. **Promote** this standard and the template to `docs/implementation/ux/`. These `docs/investigations/ux/` copies become what every investigation is — history, never law (`docs/architecture/README.md`; PKR1 § 4.4).
3. **Reference, do not restate,** in the workflow's Experience & UI Governance Compliance block — after § 6.1's gap is closed, and in the same voice the block already uses for the six gates.
4. **File completed audits** at `docs/investigations/ux/<SURFACE>_COMPLIANCE_AUDIT_<YYYYMMDD>.md` (`REPOSITORY_CONVENTIONS.md` § 3 — an audit is point-in-time analysis, filed by workstream, and is history the moment it is written).
5. **First subject: Home.** It is the room the canon has designed most (DESIGN1, HOUSE1, ORCHARD2, NORTH1), it holds three of the four known live conformance defects (NORTH2 § 6), and it is the **gold standard every future room inherits** (HOUSE1). If the standard cannot produce a useful verdict on Home, it will not produce one anywhere.

## 8. COMPLIANCE OF THIS DOCUMENT

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this work; every governing Experience document read in full.
- **No new experience principle.** Not one. Nineteen areas, nineteen owners, zero rules created. Where the canon is silent (Area 16), silence is recorded as a gap (§ 6.2) rather than filled.
- **One owner per rule** (Blueprint § 18; Architecture Principle 2; Experience Principle 6): the load-bearing test of this document. It is satisfied by construction — this standard owns the *instrument*, never the *rule*, and the yield clause (§ 1.2) makes any rule found here a defect.
- **No second gate.** The six gates stand unaltered and unrestated. This standard is diagnostic and never binding on a change (§ 1.3); a gate's STOP overrides any grade here.
- **`NORTH2`'s refusals respected.** Truthful Objects (Area 5) is named as an *audit area* routing to three existing owners, and the refusal of the *principle* is restated at the head of the area so the two are never confused. Nothing from NORTH1's rejected proposals — Presence, Interface as Guest, Time — appears here as a rule; the areas that touch their subject matter (12, 13, 3) route to the owners NORTH2 identified.
- **Scope:** no screen audited · no UI designed · no UI implemented · no mock-up produced · no component, token, route, or dependency touched · no second visual language · **no architecture modified.** The § 7 recommendation is a proposal, not an application.
- **This document creates no rule.** If it is adopted, it is adopted as an instrument, and the one governing sentence it proposes (§ 15.4) belongs to the Experience Blueprint, not to this document.

---

*A proposed standard — the repeatable per-surface audit that complements the six per-change gates the governing architecture already owns. It owns only the audit method, the verdict scale, the evidence standard, and the report shape; it restates no rule, sets no value, adds no gate, creates no principle, and jumps no governance path. Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the `EXPCOMP1` workstream: `rollback/EXPCOMP1-experience-compliance-standard-20260716` → `7d1dd2ce` (the tag protects committed state only; this untracked file is not covered by it).*
