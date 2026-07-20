# THA Home Owner Architecture

**Document ID:** `HOMEOWNER1`
**Date:** 2026-07-20
**Status:** GOVERNING — law in force · governance only, nothing built or changed
**Rollback identifier:** `rollback/HOMEOWNER1-home-owner-architecture-20260720` → `f36dfece`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow
**Role holder at adoption:** the platform owner (Colin Clapson)

---

# Philosophy

**A beautiful home does not happen accidentally.**

Someone cares for it. Someone chooses what belongs and what does not. Someone decides what feels welcoming, keeps the rooms calm, notices when something has crept in that does not belong, and takes it back out. In a real home that person has no job title; the home simply shows their care.

The Healthy Apples is treated as a lived home rather than a software product — that is the canon's founding vision (*"a warm, lived-in home where someone has already thought about dinner"* — `THA_EXPERIENCE_BLUEPRINT.md` § 1, cited; *"everything present is meant"* — `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` interior philosophy, cited). A home like that needs the person. The governing documents can state what the house is, how it must look, and how it must feel — but documents cannot exercise judgement, and the canon knows it: every aesthetic gate it defines ends in an approval it assigns to "the owner" without ever defining that role. `EXP3`'s Verdict 3 *awaits the owner*; `LIVINGHOME2`'s amendments *pass owner review*; every admission of a Living Detail, an asset, or a visual concern terminates in an owner decision. The seat exists throughout the canon; no document owns it.

**The Home Owner fulfils this architectural role.** This document defines it — the single creative authority responsible for the emotional, aesthetic and hospitality character of The Healthy Apples.

**This document governs feeling, not functionality.** The Home Owner does not own business logic, intelligence, or data. The Home Owner owns how the home feels.

### The one distinction this document rests on: rules versus judgement

The governing documents own the **rules** of the aesthetic layer, and this document does not move one of them: every colour, token and visual law stays the UI Architecture's; every feeling stays the Experience Language's; the place stays the Blueprint's; the dressing law stays `LIVINGHOME2`'s. What the Home Owner holds is what a rule cannot hold: **judgement where the rules end** — the approvals the gates require, the taste decisions the admissions defer, the final answer to *"is this beautiful enough for this house?"* — and the **authority to initiate amendment** when the character of the home requires a rule to change.

The consequence, stated as law: **the Home Owner exercises authority through the governing documents, never around them.** A Home Owner decision that contradicts a governing rule is an amendment proposal to that rule's owner — never an exception, never an override by instruction (the Architecture Bootstrap's STOP discipline, cited). This is what makes a single creative authority safe in a canon built on one-owner-per-fact: the role owns no rule, so it can duplicate none.

---

# Governing Principles

1. **There is one Home Owner.** One person holds the role at any time. Aesthetic authority that fragments produces a house decorated by committee — many hands, no home. The role is named in this document's header and succeeded only by deliberate amendment here.
2. **Beauty is intentional.** Nothing visible ships by accident, habit, or default. Everything present is meant (`OHDB` interior philosophy, cited); anything unmeant is removed, and removal is as legitimate an act of care as addition (`LIVINGHOME2` § 9.9's curation clause, cited).
3. **Hospitality comes before decoration.** The home exists to receive a household well, not to be admired. Where a decorative impulse and the household's ease conflict, ease wins (**GEA1** — hospitality wins over efficiency; a fortiori over ornament, cited).
4. **Calm is preferred over stimulation.** The home's register is calm — and calm must never become lifeless (`THA_EXPERIENCE_LANGUAGE.md` § 3/§ 3A, cited). The Home Owner guards both edges: against noise, and against the cold.
5. **Technology should disappear into the experience.** The household should always feel present; the technology never (`THA_EXPERIENCE_BLUEPRINT.md` § 1.5, the Technology Principle, cited).
6. **Every visual decision should strengthen the feeling of home.** Not the feeling of an app, a brand campaign, or a trend — the feeling of the one house (`OHDB` § 15's Design Manifesto, cited).
7. **Decoration never overrides usability.** Behaviour prevails over presentation in every conflict (`THA_EXPERIENCE_ARCHITECTURE.md` precedence, cited); new capability must not increase the felt weight of a room (**GEA2**, cited).
8. **Every aesthetic decision should support trust.** The look is part of the promise: honest photography, no fabricated charm, visual trust (`THA_UI_ARCHITECTURE.md` § 14, cited; `ARCHITECTURE_PRINCIPLES.md` Principle 6, cited).
9. **Emotional consistency is more important than novelty.** The house is timeless, not fashionable; it refuses trends that would date it to a season of design (`OHDB` § 14, cited). A decade of features must feel like one home.
10. **The Home Owner has final approval over the aesthetic character of the platform** — exercised at the gates the canon already defines, recorded where those gates record decisions, and bounded by every principle above.

---

# The Home Owner Owns

**What the role owns is the decision authority — the rules stay with their owners.** For every concern below: the *rule owner* (unchanged, cited) continues to own every value, law, and vocabulary; the Home Owner holds **final aesthetic approval, refusal, and amendment initiative** for that concern. No entry re-states a rule, and no entry may be read as a second owner of one.

| Concern | Rule owner (unchanged) | The Home Owner's authority |
|---|---|---|
| Overall atmosphere · sense of calm · sense of joy · sense of welcome · emotional tone | `THA_EXPERIENCE_LANGUAGE.md` (the seven feelings, the emotional palette) | Judges whether a shipped or proposed surface *produces* the governed feeling; approves or refuses on feel |
| Hospitality | **GEA1** · `THA_BRAND_CONSTITUTION.md` | Holds the standard of welcome; answers the Decision Framework's questions |
| Visual identity · colour palette · texture · typography direction · icon style · illustration style | `THA_UI_ARCHITECTURE.md` (§§ 7–10 — the visual constitution; every value a token) | Approves aesthetic direction; initiates UIA amendment when the character requires change; no value changes except through UIA's own governance |
| Materials · lighting style · layout harmony | `THA_EXPERIENCE_BLUEPRINT.md` §§ 7–8 · `OHDB` · `THA_KEPT_ROOM_TRANSLATION.md` | Judges whether an implementation honours the material and light translations; approves the reading |
| Motion language · animation style | `THA_UI_ARCHITECTURE.md` (motion law) · the stillness laws (Blueprint § 6.1) | Approves what little moves; defends stillness as the default |
| Seasonal dressing approval · environmental dressing approval · decorative objects | `LIVINGHOME2` (ED1–ED12, the admission pipeline) | **Is** the approval those admissions require — each item admitted, refused, or retired by the Home Owner under ED8's named-purpose brief |
| North Star visual quality | `EXP1` · Blueprint § 17 (the Design North Star) | Holds the bar: whether work meets the North Star standard before it ships |

Two clauses bind the whole table:

- **Approvals are recorded.** A Home Owner decision lives where the canon already records decisions — the admission's document, the Adoption Register row, the amendment's file. An unrecorded approval is not an approval (the canon's recorded-reasoning discipline — GEA on unrecorded rules, cited).
- **Refusal needs no rule.** The Home Owner may refuse a proposal that passes every gate, on character alone — *it does not belong in this house* is a complete verdict. The reverse is not true: approval cannot pass what a gate fails.

---

# The Home Owner Does Not Own

Explicitly, with the true owner named:

- **Business logic** — the owning services and engines (Source of Truth Register; TIP2's capability→owner bindings).
- **Data ownership** — the Register's 38 domains; not one moves.
- **Household information** — Domain 16 and its kin; the Home Owner has no read into any household's data, and the role confers none.
- **Planner behaviour** — Domain 14 and the planner services.
- **Companion reasoning** — the Intelligence spine (TIP1/TIP2/TIP3, INT17, INT20, INT21); what is true, selected, and grounded is never the Home Owner's.
- **Intelligence** — the Intelligence Platform, untouched.
- **Permissions** — `server/lib/access.ts`, the only authorisation authority.
- **Security** — its existing owners; aesthetic approval never weakens a boundary.
- **APIs** — no route is the Home Owner's.
- **Database schema** — no table, no column.
- **Product capability** — what THA can do is the capability owners'; the Home Owner governs how doing it feels.
- **Engineering implementation** — how code is built is `ENGINEERING_WORKFLOW.md`'s; the Home Owner approves outcomes at the gates, not implementations in the editor.

And one boundary the mission's list implies but this canon must state: **the Home Owner's authority is over the product's character, never over a household.** What a family celebrates, eats, declares, or decides is permanently theirs (**GEA23**, cited); the Home Owner decorates the house, not their lives.

---

# Relationship with Existing Architecture

**The Home Owner governs presentation and emotional quality only. Existing architectural owners continue to own behaviour and business state.** Per relationship:

- **Living Home (`LIVINGHOME1`/`LIVINGHOME2`)** — the Living Home's laws stand; the Home Owner is the person its gates were waiting for: dressing admissions, asset approvals, the § 10.2 amendment reviews, `EXP3`'s Verdict 3. *The house holds still; the life moves; the Home Owner decides what the home itself may quietly set out.*
- **UI Canonical Experience Ownership (`UIOWN1`)** — the two documents share an axis-split: `UIOWN1` binds every visible element to the owner of its **fact**; this document names the authority over its **feeling**. Neither touches the other's axis: the Home Owner cannot rebind a fact to a new owner, and no fact-owner's publication makes a surface beautiful. A surface is done when both are satisfied.
- **Intelligence Platform** — untouched. The Home Owner approves nothing inside the spine: not grounding (INT17), not selection (INT20), not capability bindings (TIP2). Where intelligence *surfaces* — the Companion Card, notice presentation — the aesthetic gates apply as they do to any surface, and the Home Owner's approval rides those gates.
- **Companion** — the Companion's voice, persona and conversation law are owned (TIP3; the Behaviour Engine; `THA_INTELLIGENCE_LANGUAGE_GUIDE.md`). The Home Owner judges the Companion's *presence in the house* — its card, its chair, its visual restraint — through the existing owners, and never reaches its reasoning, words, or knowledge.
- **Community** — Domains 37/38 own every fact; the Orchard room's *feel* passes the same gates as any room. The Home Owner's authority ends at the port: presences, never profiles, is a rule (CM2), not a taste.
- **Household** — Domain 16 owns the facts; the household owns their decisions (GEA23). The Home Owner's hospitality is exercised *for* households, never *about* them.
- **Planner** — Domain 14 and the planner services own behaviour and state; the family table's calm, light and material are the aesthetic layer's, approved by the Home Owner through the gates.

---

# Decision Framework

The questions that belong to the Home Owner — asked at approval, after the gates have done their mechanical work:

1. **Does this feel welcoming?**
2. **Does this belong in the house?**
3. **Is this beautiful enough?**
4. **Does this create unnecessary noise?**
5. **Does this preserve calm?**
6. **Does this feel timeless?**
7. **Would someone enjoy spending time here?**
8. **Does this strengthen hospitality?**

These questions **complement the existing gates; they replace none of them.** The Experience Constitution Check, the Experience Test, the UX/UI checklists, the Experience Review Questions, the Blueprint Checks, the Design Character Check and the Intelligence Language Check all continue to bind exactly as their owners state (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18, cited). The gates verify that the rules were followed; the Home Owner's questions ask what no checklist can — whether the result is a home. A change can pass every gate and still fail question 2; that failure is final. A change that fails a gate cannot be rescued by passing all eight; that is the amendment path, not the approval path.

---

# Design Authority

- **Implementation teams may propose designs.** Proposal is open to anyone; the canon's gates screen every proposal identically.
- **The Home Owner provides the final approval for the emotional and aesthetic direction.** No user-facing surface ships a new aesthetic character — a new feeling, a new material reading, a new dressing item, a changed atmosphere — without it.
- **Engineering must never substitute convenience for experience quality without explicit approval.** A cheaper component, a default style, a skipped state, a "temporary" placeholder that ships — each is an aesthetic decision made by omission, and omission is not approval (**GEA1**, cited; `PX1`'s finding that THA's experience defects are defects of adoption, not knowledge, cited). Where cost genuinely forces a quality trade, the trade is brought to the Home Owner and recorded — the platform's existing discipline of named costs (`NORTH2` § 3.5's pattern, cited).
- **Authority is bounded by governance.** The Home Owner cannot instruct past a gate, a law, or an owner. The role's power is exactly: approve, refuse, and propose amendment — recorded, at the gates, through the owners.

---

# Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ No duplicate ownership
  Explain: The role owns judgement and approval — a seat every aesthetic gate
  already references and no document owned. Every RULE named in this document
  is cited to its unchanged owner; the Owns table's first clause forbids
  reading any row as a second rule-owner.
☑ No duplicate business logic
  Explain: None touched; the Does Not Own list names the true owner of every
  excluded concern.
☑ No duplicate state
  Explain: No state, store, or record created; approvals are recorded in the
  canon's EXISTING decision records (admissions, registers, amendments).
☑ Existing owners remain unchanged
  Explain: Not one rule, value, token, law, domain, or engine moves. The
  Home Owner exercises authority through the owners' own governance paths.
☑ Governance only
  Explain: This document defines a role and its bounds; it ships nothing.
☑ Extends existing architecture
  Explain: Completes the canon's own pattern — the "owner approval" its gates
  require now has a defined, bounded, single holder. No rival layer; no new
  gate; the existing gate stack is explicitly preserved (Decision Framework).

If any item cannot be checked, implementation must stop and explain why.
```

# AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ No new AI capability — none defined, registered, or consumed.
✓ Companion ownership unchanged — reasoning, voice law, grounding, selection,
  and conversation state stay with TIP3/INT21/INT17/INT20; the Home Owner
  reaches only the aesthetic gates every surface already passes.
✓ Intelligence Platform unchanged — no spine component gains or loses an
  owner, input, or authority.
✓ Capability Registry unchanged — no binding added, moved, or removed.
✓ Intent Engine unchanged — no intent, path, or bypass.

If any check fails: STOP. Explain why. Do not continue.
```

# Impact

**This document establishes governance only.**

- **No runtime behaviour changes.** Nothing renders, routes, or resolves differently.
- **No schema changes.** No table, column, or migration.
- **No APIs.** No endpoint added, changed, or removed.
- **No implementation.** No code, token, asset, string, component, or store is touched.

The only observable change is governance: aesthetic and emotional approvals that the canon already required now have a defined authority, a bounded scope, a decision framework, and a recording obligation.

---

*Every home that feels cared for is cared for by someone. This document does not make the house beautiful — it names who answers for whether it is, and binds even that authority to the house's own laws. The rules keep the home one home; the Home Owner keeps it worth coming home to.*
