# THA Brand Constitution — Governing Document

**Status:** GOVERNING ARCHITECTURE — the enduring statement of who The Healthy Apples is; required reading before any significant product decision, and before any change that alters what THA *is* to a household.
**Classification:** Platform Governance (canonical) — enduring identity
**Adopted:** 2026-07-17 (BRAND1)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) — this Constitution is **subordinate to it on the engineering law**, and is bound in particular by **Principle 2** (one owner per fact) and **Principle 6** (no fabricated knowledge). It is the reason this document *references* rather than *restates*.
**Serves, and is served by:** the four Experience Governance documents — [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (behaviour) · [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) (feeling) · [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (look) · [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) (vision) — and the voice owner [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](./THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (TIP3). **It states the identity they each express a face of; it never restates their rules.**
**Distinct from:** `THA_UI_ARCHITECTURE.md` § 10 (Brand Identity Architecture) and § 14 (Visual Trust), which own THA's **visual** identity — its marks, logo, the apple, colour, imagery. This Constitution owns THA's **enduring** identity — *why it exists, who it is, what it owes, and what it must never become*. Visual identity is one expression of enduring identity, and its owner is UI § 10, not here.
**Enforced by:** **The One Question before every release** (§ 9) and **the ten Constitutional Principles** (§ 10), completed alongside — never in place of — the existing gates (the UX Governance Checklist, the UI Governance Checklist, the Experience Review Questions, and the AI Architecture Compliance block of `ENGINEERING_WORKFLOW.md`).

---

> **What this document is.** It is the **Brand Constitution of The Healthy Apples** — the single, enduring statement of who THA is, written so that everyone who builds it is building the same thing, and so that a decade of features can be checked against one identity rather than one person's memory of it. It is the *why* and the *who* that the Experience Architecture (*behaviour*), the Experience Language (*feeling*), the UI Architecture (*look*), and the Experience Blueprint (*vision*) each serve a face of. It creates **no** entity, owner, service, capability, route, token, component, or business logic. It owns exactly one thing that no other document owns: **THA's enduring identity, assembled in one place.** Every *rule* beneath that identity — the Promise, the feelings, the voice, the visual marks, the non-fabrication law — is already owned above, and this document **references and quotes those owners and restates none of them.** Restating a rule creates a second owner of it, which the architecture forbids (`ARCHITECTURE_PRINCIPLES.md` Principle 2; `THA_EXPERIENCE_LANGUAGE.md` § 2). **If any line here is found to duplicate a rule owned elsewhere, the line here is the defect** and is corrected to a citation. A product decision that conflicts with this Constitution must **STOP, explain why, and not continue until approved.**

---

## 1. What the Constitution owns, and what it must never restate

The platform has, until now, had no document that says *who THA is* — only documents that say how it must behave, feel, look, and be built. That gap is what this Constitution fills, and its only legitimate territory. It sits:

- **Under `ARCHITECTURE_PRINCIPLES.md`** on the engineering-law axis. The Core Principles govern how facts are owned and how truth is kept; this Constitution obeys them. In particular it is bound by **Principle 6** — *"Trust is the product … Enrichment must not become a fabrication surface. This is non-negotiable."* — which is why it *references* every rule it touches rather than becoming a second copy of it.
- **Upstream of the Experience Governance documents** on the identity axis — it states the enduring identity those four documents express, and defers to each of them on its own question. Where this Constitution and an Experience document appear to conflict on a *rule*, the rule's **owner prevails and this Constitution is corrected**; this document never overrides them, because an identity is *expressed* by behaviour, feeling, look, and vision — never decreed over them.
- **Beside `THA_UI_ARCHITECTURE.md` § 10**, which owns THA's *visual* identity (*"the canon of everything that identifies THA"* — the marks, the logo, the apple, the imagery). This Constitution owns *enduring* identity and touches no pixel.

**The non-restatement rule, and the boundary table.** The concepts this Constitution assembles are, almost all of them, already owned. It quotes them to make the identity legible in one place, and cites their owner every time. It legitimately *owns* only the synthesis and the six instruments the mission names — the mission statement, the consolidated *never become*, the Household First Principle, the Trust Test, the One Question, and the ten Principles — and even those are built *from* the owners below and cite them.

| The identity this Constitution assembles | Its canonical owner (referenced, never restated) |
|---|---|
| The Promise — *"less to carry, not more"*; reduce effort, increase confidence, give time back | `THA_EXPERIENCE_LANGUAGE.md` § 4A, Principle A (*The THA Promise*) |
| The vision — *"a modern home in an ancient orchard, where technology quietly supports timeless family life"* | `THA_EXPERIENCE_BLUEPRINT.md` § 1.1, § 1.4, § 1.5, § 17 |
| The feeling — the seven feelings and the Emotional Palette (*calm must never become lifeless*) | `THA_EXPERIENCE_LANGUAGE.md` § 3, § 3A |
| The voice — *helpful · educational · encouraging · scientific-but-warm · calm · friendly — never judgemental, never alarmist* | TIP3 § 12.1 |
| Home as the emotional centre; calm before capability; the companion suggests, the person decides | `THA_EXPERIENCE_ARCHITECTURE.md` § 4, § 6, § 11 |
| Premium as *the perceptible result of care*, and *not exclusivity* | `THA_EXPERIENCE_ARCHITECTURE.md` § 17, § 17.12 |
| Non-fabrication; honest gaps over invented facts; *a confident wrong answer is the worst outcome the product can produce* | `ARCHITECTURE_PRINCIPLES.md` Principle 6; TIP3 § 12.2 |
| Never fabricate; no dark patterns; data belongs to the household | `THA_EXPERIENCE_ARCHITECTURE.md` § 12 |
| The feeling-layer anti-patterns THA rejects | `THA_EXPERIENCE_LANGUAGE.md` § 7 |
| Visual identity — marks, logo, apple, imagery, Visual Trust | `THA_UI_ARCHITECTURE.md` § 10, § 14 |

Everything above is *quoted here, owned there*. Everything below in §§ 2–10 is the identity those rules add up to.

---

## 2. Why THA exists

**The Healthy Apples exists to reduce the invisible stress of everyday family food decisions — so that households eat better, with less effort, and have more time to simply eat together.**

This is not a new claim. It is the purpose already stated across the platform — *"THA exists to help households eat better"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 1) and *"THA exists to reduce the invisible stress of everyday family food decisions"* (`THA_EXPERIENCE_LANGUAGE.md` § 4A, Principle A) — assembled here as the Constitution's first article so that every feature can be traced back to it. The wording *"reduce the invisible stress … less to carry, not more"* is owned by the Promise (`THA_EXPERIENCE_LANGUAGE.md` § 4A-A) and quoted, not re-legislated.

Two things follow, and they are the whole of why this article is worth stating:

- **The problem THA solves is a burden, not a lack of information.** Families do not struggle to eat well because facts are scarce; they struggle because the daily weight of deciding, remembering, and coordinating is relentless and invisible. THA exists to lift that weight — not to add a cleverer layer of facts on top of it.
- **Success is measured in the household's life, never in the product's engagement.** THA succeeds when *"the household ate better with less effort"*, and explicitly not when *"the household spent more time in the product"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 11). A feature that grows engagement while adding weight has failed the reason THA exists, however well it is built.

---

## 3. Our Promise

THA's promise to every household is owned, in full, by **The THA Promise** (`THA_EXPERIENCE_LANGUAGE.md` § 4A, Principle A): every experience must leave the household with *"less to carry, not more"*, tested by whether it *"reduce[s] effort … increase[s] confidence … [and] give[s] time back to the household."*

This Constitution adds nothing to that rule and takes nothing from it. It elevates it to a constitutional promise so that it is checkable at the level of *the whole product*, not only at the level of a single experience: **every household, on every plan, is owed a THA that lightens their load.** The Promise is not a premium feature and not a marketing line — it is the debt THA owes for existing, and § 9 turns it into the single question asked before anything ships.

---

## 4. Our Character

THA has one character, expressed in how it speaks, how it feels, and how it carries itself. Each trait below is a face of a rule already owned; the Constitution assembles them into a single portrait so a newcomer can recognise THA before reading a single checklist.

- **A knowledgeable, kind companion — never a clipboard, never a gimmick.** THA's voice is *"helpful · educational · encouraging · scientific-but-warm · calm · friendly — never judgemental, never alarmist"* (TIP3 § 12.1). It teaches; it does not scold, and it does not perform.
- **Calm, warm, and quietly alive.** THA must feel *calm · welcoming · effortless · intelligent · reassuring · premium · quietly memorable* (`THA_EXPERIENCE_LANGUAGE.md` § 3) and must never feel *cold, clinical, empty, sterile, or emotionally distant* (§ 3A.1) — because *"calm must never become lifeless"* (§ 3A.2). Its one-sentence feel is owned there too: *"a warm, lived-in home where someone has already thought about dinner."*
- **A home, not a dashboard.** THA is *"a modern home in an ancient orchard, where technology quietly supports timeless family life"* (`THA_EXPERIENCE_BLUEPRINT.md` § 17), and its Home is the emotional centre that answers *"How are we doing, and what's next?"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 4) — never a menu, a feed, or a control panel.
- **Present because it has done some thinking already — then out of the way.** *"Technology should quietly disappear. The household should always feel present"* (`THA_EXPERIENCE_BLUEPRINT.md` § 1.5). THA earns the right to speak; *"silence is the default; a summary is the norm; interruption is rare and reserved"* (TIP3 § 11).
- **Premium as care, offered to everyone.** Premium in THA is *"the perceptible result of care taken on the household's behalf"* and is explicitly *"not exclusivity … the quality every household receives — including the ones who pay nothing"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 17, § 17.12).

THA's character is **its own**. It does not borrow an aesthetic or a persona from another product; *"an imported aesthetic … always reads as costume"* and *"THA's identity wins"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 17.11).

---

## 5. Our Responsibility

Because THA sits at a family's table and speaks about their food, their health, and their choices, it carries responsibilities that outrank every feature. These are owned at the behaviour and engineering layers; the Constitution names them as duties so that no feature can be shipped in ignorance of them.

- **The truth, always. Never fabrication.** *"Never fabricate. No invented facts, scores, or content, anywhere, ever"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 12). This is the platform's non-negotiable law — *"Trust is the product … This is non-negotiable"* (`ARCHITECTURE_PRINCIPLES.md` Principle 6) — and its human form is that *"a confident wrong answer is the worst outcome the product can produce; the assistant is built to prefer an honest 'I don't know'"* (TIP3 § 12.2). Where THA does not know, it says so; an honest gap is never dressed as a fact.
- **No dark patterns, without exception.** THA never manufactures urgency, guilt, or engagement, and never optimises against the household's interest (`THA_EXPERIENCE_ARCHITECTURE.md` § 12). Delight *"should reward healthier habits — never become a gimmick, never nag, never fabricate"* (TIP3 delight rule).
- **The household's data belongs to the household.** No dark corners; the household's information serves the household (`THA_EXPERIENCE_ARCHITECTURE.md` § 12).
- **Safety is the one thing THA will interrupt for — calmly.** A genuine safety signal (a product recall) is *"the only immediate exception"* to silence (TIP3 § 11.1), and even then THA is *never alarmist* (§ 12.1). It never spends that trust on anything that is not genuine safety.
- **Care is owed to every household, not the paying few.** The Promise (§ 3) and Premium-as-care (§ 4) are the quality *every* household receives, including those who pay nothing.

---

## 6. What THA will never become

These are the lines the identity forbids. Each is owned as a rule or anti-pattern at a lower layer; the Constitution consolidates them so that "we would never do that" has a single, citable home. THA will never become:

- **A product that fabricates.** No invented fact, score, field, or confirmation, ever — the hardest line in the product (`ARCHITECTURE_PRINCIPLES.md` Principle 6; `THA_EXPERIENCE_ARCHITECTURE.md` § 12; TIP3 § 12.2).
- **An engagement machine.** No dark patterns, no manufactured urgency, no nagging, no gamified treadmill, no *"marketing-style gimmicks inside functional workspaces"* (`THA_EXPERIENCE_LANGUAGE.md` § 7). Success is the household's life, not time-in-app (`THA_EXPERIENCE_ARCHITECTURE.md` § 11).
- **A dashboard, a feed, or a control panel.** Home is the emotional centre, never reduced to a dashboard, and a welcome is never also work (`THA_EXPERIENCE_ARCHITECTURE.md` § 4; `THA_EXPERIENCE_LANGUAGE.md` § 7).
- **Cold, clinical, or luxurious-for-its-own-sake.** THA must never feel *cold · clinical · empty · sterile · funeral-parlour calm · emotionally distant · luxury for luxury's sake* (`THA_EXPERIENCE_LANGUAGE.md` § 3A.1). Its calm must never become lifeless (§ 3A.2).
- **Exclusive.** Premium never means *"gated, elite, or aspirational-by-exclusion"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 17.12). THA is a kitchen-table product for every household.
- **A judge of the family.** THA never shames, nags, diagnoses, or lectures; it is *never judgemental, never alarmist* (TIP3 § 12.1).
- **A costume of another product.** THA never borrows an identity; *"authenticity outranks aspiration … THA's identity wins"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 17.11).
- **A product that performs instead of helps.** *"If a thing would make a person notice the product rather than feel at home in it, it is an anti-pattern — no matter how well it is made"* (`THA_EXPERIENCE_LANGUAGE.md` § 7).

---

## 7. The Household First Principle

**When the product's interest and the household's interest compete, the household wins. Always. Without exception.**

This is the Constitution's central articulation of an identity already owned in fragments — *"Household before technology … the family wins"* (`THA_KEPT_ROOM_TRANSLATION.md` § 5, principle 6), the household as the emotional centre (`THA_EXPERIENCE_ARCHITECTURE.md` § 4), *"family-first … it speaks to a household, never to a user optimising themselves"* (`THA_EXPERIENCE_ARCHITECTURE.md` § 17, Premium Principle 10), and *"the household present, the technology gone"* (`THA_EXPERIENCE_BLUEPRINT.md` § 1.5). The Constitution names it as one principle so that it can be pointed at in any decision:

- The household's **wellbeing** outranks the product's growth.
- The household's **calm** outranks the product's opportunity to be clever.
- The household's **time** outranks the product's chance to hold attention.
- The household's **trust** outranks every metric there is.

A feature that serves the product at the household's expense is not a trade-off to be balanced — under this Constitution it is simply out of bounds.

---

## 8. The Trust Test

Trust is the thing THA cannot rebuild once spent, so it is tested directly, by one question applied to anything THA says, shows, or does:

> **If the household believed exactly what THA is telling them here — in its words, its numbers, its confidence, and its silence — would they end up believing something true?**

If yes, it may ship. If no — if the household would come away believing a fabricated fact, a manufactured urgency, a confidence THA has not earned, or a success that did not happen — it must not ship, no matter how good it looks or how well it performs.

The Trust Test is the Constitution's synthesis of three rules it does not restate: the non-fabrication law (*"Trust is the product … non-negotiable"* — `ARCHITECTURE_PRINCIPLES.md` Principle 6), the behaviour-layer honesty duties (`THA_EXPERIENCE_ARCHITECTURE.md` § 12), and Visual Trust — *"a person who believes exactly what the pixels imply must end up believing the truth"* (`THA_UI_ARCHITECTURE.md` § 14). It extends that visual test to the whole of what THA communicates: words, numbers, confidence, and the things it chooses not to say.

---

## 9. The One Question before every release

Before anything THA builds reaches a household, one question is asked of it — the compression of this entire Constitution into a single gate:

> **Does this leave the household with less to carry, and could they trust everything it tells them?**

- *Less to carry* is the Promise (§ 3) — does it reduce effort, increase confidence, or give time back, and does it add no weight (`THA_EXPERIENCE_LANGUAGE.md` § 4A-A)?
- *Trust everything it tells them* is the Trust Test (§ 8).

If the honest answer to either half is *no*, the release **STOPS** until it is corrected or an exception is approved. This question does not replace the existing gates — the UX Governance Checklist, the UI Governance Checklist, the Experience Review Questions (`THA_EXPERIENCE_LANGUAGE.md` § 6), the per-screen Experience Test (`THA_EXPERIENCE_BLUEPRINT.md` § 15.3), and the AI Architecture Compliance block. It sits **above** them as the identity check they each verify a part of: a change can pass every checklist and still fail this question, and if it does, it is not ready.

---

## 10. The ten Constitutional Principles

Every future feature must satisfy all ten before release. They are the compression of §§ 2–9 into checkable law. Each cites the layer that owns its rule; none restates it.

1. **The household comes first — always.** When product interest and household interest compete, the household wins, without exception. *(§ 7; `THA_KEPT_ROOM_TRANSLATION.md` § 5.6; `THA_EXPERIENCE_ARCHITECTURE.md` § 4.)*

2. **Lighten the load; never add to it.** Every feature must reduce effort, increase confidence, or give time back — and add no weight. *(§ 3; `THA_EXPERIENCE_LANGUAGE.md` § 4A-A.)*

3. **Tell only the truth; a gap is spoken as a gap.** THA never fabricates a fact, field, score, or confirmation; where it does not know, it says so plainly. *(§§ 5, 8; `ARCHITECTURE_PRINCIPLES.md` Principle 6; TIP3 § 12.2.)*

4. **Serve the household's life, never the product's metrics.** Success is measured in *ate better, with less effort* — never in time-in-app. *(§ 2; `THA_EXPERIENCE_ARCHITECTURE.md` § 11.)*

5. **Earn the right to speak; keep silence sacred.** Silent by default; a summary is the norm; interruption is reserved for genuine safety, delivered calmly. *(§§ 4, 5; TIP3 § 11.)*

6. **Be a calm, warm home — never a dashboard, never cold.** THA must feel calm and alive; it must never become clinical, sterile, or a control panel, and calm must never become lifeless. *(§§ 4, 6; `THA_EXPERIENCE_LANGUAGE.md` § 3, § 3A; `THA_EXPERIENCE_ARCHITECTURE.md` § 4.)*

7. **Offer care to every household, gate it from none.** Premium is care, not exclusivity — the quality every household receives, including those who pay nothing. *(§§ 4, 6; `THA_EXPERIENCE_ARCHITECTURE.md` § 17.12.)*

8. **No dark patterns, ever.** No manufactured urgency, guilt, gamified treadmill, or design that works against the household's interest. *(§§ 5, 6; `THA_EXPERIENCE_ARCHITECTURE.md` § 12; `THA_EXPERIENCE_LANGUAGE.md` § 7.)*

9. **Help, never perform.** If a feature makes the household notice the product rather than feel at home in it, it fails — however well it is made. THA never wears another product's costume. *(§ 6; `THA_EXPERIENCE_LANGUAGE.md` § 7; `THA_EXPERIENCE_ARCHITECTURE.md` § 17.11.)*

10. **Guard trust above all — it cannot be rebuilt.** Anything THA says, shows, or withholds must leave the household believing something true. *(§ 8; `ARCHITECTURE_PRINCIPLES.md` Principle 6; `THA_UI_ARCHITECTURE.md` § 14.)*

---

## 11. Governance and admission

This is governing architecture. It owns exactly one thing — **THA's enduring identity, assembled in one place** — and creates **no runtime dependency**: no code, gate, or document reads it to decide anything, and it authors no fact, string, mark, token, or capability. Every rule it names is enforced by the rule's own owner and gate; the Constitution adds no new enforcement mechanism except the One Question (§ 9) and the ten Principles (§ 10), which sit above the existing checklists as the identity check they each verify a part of.

A change to THA's identity — a new principle, a revised promise, a redrawn line of *what THA will never become* — **is admitted by governance, never by shipping**: this document is amended first, then the product is built to it. If a proposed change conflicts with this Constitution, **STOP, explain why, and do not continue until the conflict is resolved or the exception is approved** (per the Architecture Bootstrap and `ENGINEERING_WORKFLOW.md` STEP 2).

**Precedence, stated once.** On the engineering-law axis: `ARCHITECTURE_PRINCIPLES.md` (Principles 2 and 6 in particular) **prevails over** this Constitution, which obeys it and is corrected on any conflict. On the identity axis: this Constitution states the enduring identity that the Experience Architecture (behaviour), the Experience Language (feeling), the UI Architecture (look), and the Experience Blueprint (vision) each express — and where a *rule* is in question, **the rule's owner prevails and this Constitution is corrected.** It overrides none of them and restates none of them; it is the place their shared identity is finally written down whole.

---

## 12. Definition of Done — CHECK

| The mission required | Where this document meets it |
|---|---|
| Read `docs/architecture/README.md` before changes | Done at session open (BRAND1) |
| Create rollback protection | `rollback/BRAND1-brand-constitution-20260717` → `7bfad50c`; WIP tag `brand1-wip-snapshot-7bfad50c` |
| Define the enduring identity of THA | §§ 2–10 |
| Do not implement; do not duplicate existing architecture; reference existing documents | § 1 (boundary table, non-restatement rule); § 11 — no code, schema, route, capability, token, or string; every rule cited to its owner |
| Why THA exists | § 2 |
| Our Promise | § 3 (references `THA_EXPERIENCE_LANGUAGE.md` § 4A-A) |
| Our Character | § 4 |
| Our Responsibility | § 5 |
| What THA will never become | § 6 |
| The Household First Principle | § 7 |
| The Trust Test | § 8 |
| The One Question before every release | § 9 |
| Ten constitutional principles every future feature must satisfy | § 10 |
| Store under `docs/architecture/` | This file: `docs/architecture/THA_BRAND_CONSTITUTION.md` |
| Report rollback identifier + file location | Reported in the session summary and § 12 above |

---

*Required reading before any significant product decision, and before any change that alters what THA is to a household.*
*Subordinate to `ARCHITECTURE_PRINCIPLES.md` (bound by Principle 2 and Principle 6) on the engineering law. The enduring identity that the Experience Architecture (behaviour), Experience Language (feeling), UI Architecture (look), and Experience Blueprint (vision) each express a face of — it states their shared identity and restates none of their rules; where a rule is in question, the rule's owner prevails and this Constitution is corrected. Distinct from `THA_UI_ARCHITECTURE.md` § 10, which owns THA's visual identity.*
*Rollback: `rollback/BRAND1-brand-constitution-20260717` → `7bfad50c` · WIP tag `brand1-wip-snapshot-7bfad50c`.*
