# THA Experience Compliance Audit — Report Template

## The reusable shape every surface audit takes

**Status:** PROPOSED TEMPLATE — the report shape through which the [`THA Experience Compliance Standard`](./EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md) is applied. **Not** governing architecture, **not** a specification, **not** implementation. It **creates no experience principle** and **no second owner**: it records verdicts against rules owned elsewhere and states none of its own.
**Classification:** Experience Governance (investigation → proposed operational template)
**Date:** 2026-07-16 (`EXPCOMP1`)
**Rollback ID:** `rollback/EXPCOMP1-experience-compliance-standard-20260716` → `7d1dd2ce`
**Governed by:** the Standard — its verdict scale (§ 2), its nineteen areas (§ 3), its evidence standard (§ 4), and its scoring rules (§ 5). **This template restates none of them; it is the shape they are recorded in.**

**No screen audited by this document. No UI designed. No UI implemented. No architecture modified.**

---

## 1. HOW TO USE THIS TEMPLATE

1. **Read the governing documents.** Not this template first — the Standard's § 4.1 evidence requirement is not satisfied by reading a template.
2. **Copy § 3 below** into a new file: `docs/investigations/ux/<SURFACE>_COMPLIANCE_AUDIT_<YYYYMMDD>.md` (`REPOSITORY_CONVENTIONS.md` § 3 — an audit is point-in-time analysis, filed by workstream, and **is history the moment it is written**; it is never edited afterward, it is superseded by the next audit).
3. **Fill every section.** A section removed because it had nothing in it is the failure mode this template exists to prevent — write *"None found"* and say what you looked at.
4. **Grade last, not first.** Fill the findings, then let the grades follow from them. A grade decided first will find its evidence.
5. **Do not add an area.** Nineteen is the standard's, and an audit with a twentieth area has quietly created a principle. If a surface has a problem no area reaches, that is a **gap** — record it in § 3.8 and route it to governance, exactly as the Standard does with Area 16 (§ 6.2 there).

> **The three rules that keep an audit honest, restated from the Standard because an assessor will have this file open and not that one:**
> **(1)** A verdict cites the **owner's** rule, never the Standard and never this template.
> **(2)** A WARNING must name **the mechanism by which the thing is currently true** — that is the entire content of a WARNING (Standard § 2.1).
> **(3)** An audit **never blocks and never permits a change** — the six gates do that, regardless of any grade here (Standard § 1.3).

---

## 2. WHAT THE TEMPLATE DELIBERATELY DOES NOT CONTAIN

- **No pre-filled verdicts, no example findings.** An assessor reading a plausible example will pattern-match to it. The areas are in the Standard; the judgement is the assessor's.
- **No weighting, no percentages.** The Standard's § 5 forbids both, and a template with a percentage field would create one by inviting it.
- **No sign-off by role.** An audit is a finding about a surface, not an approval by a person (Standard § 2.2). It records **who assessed** so the reader can weigh it — never **who approved**, because there is nothing here to approve.

---

## 3. THE TEMPLATE

*(Everything below this line is the copyable report. Replace every `<…>`.)*

---

# `<SURFACE>` — Experience Compliance Audit

**Status:** AUDIT — point-in-time analysis against the THA Experience Compliance Standard. It is **history the moment it is written** and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). It **creates no rule**, and **changes nothing**.
**Classification:** Experience Governance (investigation)
**Date:** `<YYYY-MM-DD>`
**Workstream / Audit ID:** `<ID>`
**Rollback ID:** `<rollback/…>` → `<sha>`
**Assessed by:** `<name or agent>` — **built by:** `<name, or "not the assessor">` *(Standard § 4.3: a self-audit is a useful draft and is not an audit.)*
**Supersedes:** `<previous audit of this surface, or "none — first audit">`

---

## 1. SURFACE UNDER REVIEW

| Field | Value |
|---|---|
| **Surface** | `<Home · Planner · Shopping · Pantry · Cookbook · Companion · Profile · Admin · …>` |
| **Room in the house** | `<from the map — Experience Blueprint § 5.1>` |
| **The one thing it helps them do** | `<one verb — Experience Test Q3, Blueprint § 15.3>` |
| **Governed exposure** | `<E0 / E1 / E2 / E3, from § 5.1 — the mapped value, not the observed one>` |
| **Mapped Living Detail** | `<from § 12.2 — or "none, deliberately">` |
| **Routes / files assessed** | `<paths — the audit is anchored to what was actually opened>` |
| **States assessed** | `<populated · empty · loading · error · slow-connection · edge: …>` *(§ 17.1 — all of them, or the audit is a good-day audit)* |
| **Sizes assessed** | `<mobile · tablet · desktop>` |
| **Modes assessed** | `<light · dark · reduced motion · 200% text>` |

**The Experience Test (Blueprint § 15.3) — answered before anything else.** *A screen that cannot answer all three is not finished being designed, whatever state its code is in.*

| Question | Answer | Clear? |
|---|---|---|
| Which room of the home is this? | `<…>` | `<yes / no>` |
| How should someone feel here? | `<…>` | `<yes / no>` |
| What is the ONE thing this room helps them do? | `<…>` | `<yes / no>` |

> **If any answer is unclear: STOP the audit and say so.** The Standard's areas assess whether a designed room was built correctly; the Experience Test assesses whether the room was designed at all (Blueprint § 15.3). Grading areas 1–19 on an undesigned surface produces nineteen findings that all say the same thing.

---

## 2. GOVERNING DOCUMENTS CONSULTED

*(Read, not remembered — Standard § 4.1. Record the state each was in: the canon is uncommitted and moving.)*

| Document | Version / state at audit | Read in full? |
|---|---|---|
| `THA_EXPERIENCE_ARCHITECTURE.md` (EXP1/EXP2) | `<…>` | `<yes/no>` |
| `THA_EXPERIENCE_BLUEPRINT.md` (EXPBLUE1/2) | `<…>` | `<yes/no>` |
| `THA_EXPERIENCE_LANGUAGE.md` (EXPLANG1/1A/1B) | `<…>` | `<yes/no>` |
| `THA_UI_ARCHITECTURE.md` (UIA2) | `<…>` | `<yes/no>` |
| `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (OHDB1) | `<…>` | `<yes/no>` |
| `THA_KEPT_ROOM_TRANSLATION.md` (TRANSLATION1) | `<…>` | `<yes/no>` |
| `THA_ORCHARD_LIVING_BOOK.md` (OLB1) | `<…>` | `<yes/no>` |
| `docs/implementation/ux/ADOPTION_REGISTER.md` | `<…>` | `<consulted for areas 9, 17, 18>` |
| Other | `<design specs (DESIGN1/HOUSE1), prior audits, prior investigations — as **context**, never as law>` | |

**Open items standing over this audit:** `<Blueprint § 18's four — the orchard's owner · Home's header · the UIA § 4 amendment · dark mode — plus Standard § 6.1 (the workflow gap) and § 6.2 (performance has no owner). Say which of them touch this surface, because they change what a FAIL means: a surface cannot fail for not shipping something the governance path has not yet admitted.>`

---

## 3. COMPLIANCE SUMMARY

*(Three sentences maximum. Written last, read first. Lead with the outcome — what state this surface is in and what the reader should do about it. No preamble, no methodology.)*

`<…>`

**Headline finding:** `<the one thing that matters most, stated as what a person would experience>`

---

## 4. THE COMPLIANCE TABLE

*(All nineteen areas, in the Standard's order — place before pixels, feeling last. **No area may be removed.** N/A requires a one-line justification (Standard § 2). "Evidence" points at where you looked, not at what you concluded.)*

| # | Area | Owner of the rule | Verdict | Evidence |
|---|---|---|---|---|
| 1 | One Door | EXP ARCH Principle 4, § 7 | `<PASS/WARNING/FAIL/N-A>` | `<…>` |
| 2 | Orchard Exposure | EXPBLUE § 6.2, § 5.1 | | |
| 3 | One Morning | EXPBLUE § 7, § 16 | | |
| 4 | Air & Space | EXPBLUE § 8.2 · UIA § 9 | | |
| 5 | Truthful Objects | EXPBLUE § 12.1 r2 · OHDB § 4 · TRANSLATION1 *Patina* | | |
| 6 | Honest Data | EXP ARCH Principle 7, § 12 · UIA § 14 | | |
| 7 | Living Details | EXPBLUE § 12 | | |
| 8 | Companion Presence | EXPBLUE § 13 · EXP ARCH § 11 · EXPLANG Principle 7 | | |
| 9 | Canonical Navigation | EXP ARCH § 8 · EXPBLUE § 14 · UIA § 6 | | |
| 10 | Progressive Disclosure | EXP ARCH § 5, Principle 2 | | |
| 11 | Visual Hierarchy | UIA § 5 · EXP ARCH § 9 | | |
| 12 | Calm Without Emptiness | EXPLANG § 3A.4, § 3A.1 · OHDB § 4 | | |
| 13 | Household First | TRANSLATION1 *Household Presence*, § 5.6–5.7 · EXPBLUE § 1.5 | | |
| 14 | Trust & Explainability | EXP ARCH § 12 · UIA § 14 | | |
| 15 | Accessibility | EXP ARCH § 16 · UIA § 15 | | |
| 16 | Performance & Responsiveness | **none — Standard § 6.2**; fragments: EXPLANG Principle 2 · UIA § 12 · EXP ARCH § 17.1 | | |
| 17 | Mobile Consistency | UIA § 9, § 6 · EXP ARCH § 16 | | |
| 18 | Architectural Consistency | UIA Principles 4–5, § 16, § 17 | | |
| 19 | Emotional Character | EXPLANG § 3, § 3A, § 6, § 7 · OHDB § 16.2 | | |

**Counts:** `<n>` PASS · `<n>` WARNING · `<n>` FAIL · `<n>` N/A

---

## 5. KEY FINDINGS

*(Every WARNING and FAIL, worst first. Each carries the four things a finding must carry — Standard § 4.2. PASSes are not listed individually; the table holds them. A finding is written so that a person who was not in the room can act on it without asking a question.)*

### FAIL — `<short name>`
- **The rule:** `<quoted or precisely cited to its OWNING document and section — never to the Standard>`
- **The evidence:** `<file:line, and/or the named state and size where it is visible>`
- **The failure:** `<what a person would experience — not a rule number>`
- **Inherited or introduced:** `<when this arrived, if known — most FAILs in this canon predate anyone who would fix them (Standard § 2.2)>`

### WARNING — `<short name>`
- **The rule:** `<cited to its owner>`
- **The evidence:** `<…>`
- **The mechanism by which it is currently true:** `<REQUIRED — this is the entire content of a WARNING. e.g. "warm only because cards render at 82% opacity and the cream canvas bleeds through">`
- **What removes it:** `<the innocent, unrelated change that would turn this into a FAIL, and nobody would connect the two>`

*(Repeat per finding. If there are none: **"None found"**, and state what was assessed — a findings section that is empty because nothing was looked at is indistinguishable from one that is empty because the surface is good, which is the exact document this standard exists to prevent.)*

---

## 6. RECOMMENDED IMPROVEMENTS

*(Ordered by value, not by severity — they differ, and the difference is the useful part of an audit. Each routes to the work it becomes. **An audit recommends; it never implements.**)*

| # | Improvement | Closes | Type | Blocked by | Value |
|---|---|---|---|---|---|
| 1 | `<…>` | `<finding>` | `<deletion / conformance fix / token change / behaviour change / design work / governance>` | `<open item, amendment, or "nothing — deliverable now">` | `<why this one first>` |

**Deliverable now** — needs no amendment, no new law, and removes a violation or a defect rather than adding a vocabulary: `<…>`
*(NORTH1 § 8's structure is the pattern worth copying: its first recommendation was a **deletion**, and every one of its five immediate items removed a defect rather than adding a design. **The first change is usually a deletion**, and deletions are almost never blocked.)*

**Blocked until the governance path lands — do not start:** `<…>`
*(Blueprint § 2.4: the depth/light vocabulary is unshippable until the **UIA § 4 amendment**; exposure values enter only as **tokens by admission**; each Living Detail is admitted **one at a time**. A recommendation that jumps this path is a defect in the audit, not a fast route.)*

---

## 7. ARCHITECTURAL CONFLICTS

*(**The most important section, and the one most likely to be left empty.** Record here anything where the surface is not wrong but the **architecture** is unclear, silent, self-contradictory, or unreachable. This section is how an audit gives something back to the canon rather than only taking from it — and it is the difference between an audit and a defect list.)*

| # | Conflict | Documents involved | Effect on this audit | Recommendation |
|---|---|---|---|---|
| 1 | `<…>` | `<…>` | `<which area(s) it made unassessable, or which verdict it changed>` | `<route to the owner — never resolve it here>` |

**The four kinds worth naming, because each has already occurred in this canon:**

- **Two owners appear to govern one thing.** Per Blueprint § 18, one of them is a defect to be corrected to a citation. **Name it; do not pick.**
- **The canon is silent.** Record the gap; **do not fill it.** Filling it is creating a principle through an audit, which the Standard forbids by construction (§ 1.2, § 4.3). Standard § 6.2 (performance has no owner) is the worked example.
- **A rule is unreachable.** It exists, it is correct, and nothing routes anyone to it. Standard § 6.1 is the live case: OHDB's **Design Character Check** is declared enforced by a workflow block that has never heard of the document. A rule that only fires when its author remembers it *"is not enforced; it is hoped for"* (`ARCH-VERIFY1`).
- **A design specification conflicts with a governing document.** The specification yields by its own terms and is **not** an architectural conflict — but it must be corrected knowingly rather than left to drift. NORTH2 § 3.1 is the worked example: adopting the aperture bullet means DESIGN1 § 4 / HOUSE1 § 2.2's *sky → light → surface → hand* horizon **is not an aperture** and needs revisiting in the same decision.

**If there are none:** *"None found"* — and say so deliberately. It is a real and good result; NORTH2 § 6's version of it is the strongest sentence in that report: *the canon already forbade every one of these, in writing, before the render exposed them — the architecture is sound and does not need refining; it needs **obeying**.*

---

## 8. GAPS THIS AUDIT COULD NOT ASSESS

*(Honest absence applies to audits too — Experience Principle 7. Anything not looked at, not measurable, or not decidable. **An unstated gap reads as a PASS**, which is the one thing an audit must never accidentally say.)*

| Area | What could not be assessed | Why | What would close it |
|---|---|---|---|
| `<n>` | `<…>` | `<no owner / no access / state not reachable / blocked by an open item>` | `<…>` |

---

## 9. OVERALL COMPLIANCE

*(Standard § 5. The band is set by the **worst grade present**, never by the ratio. A FAIL is never averaged away.)*

| | |
|---|---|
| **Applicable areas** | `<19 minus justified N/A>` |
| **PASS** | `<n>` |
| **WARNING** | `<n>` |
| **FAIL** | `<n>` |
| **Score** | `<PASS>/<applicable>` |
| **Band** | **`<COMPLIANT / COMPLIANT WITH DRIFT / NON-COMPLIANT>`** |
| **Expires** | On material change to this surface, or on any amendment to an owning document (Standard § 5) |

**What the band means for this surface, in one sentence:** `<…>`

> **This score never travels without its findings** (Standard § 5). A band on its own is the artefact the Standard was built to prevent — a document that says the house is fine. **No percentage. No ranking of people. No averaging.**

---

## 10. DEFINITION OF DONE

*(For **this audit**, not for the surface. An audit is done when it is honest and retained — not when it is favourable.)*

```
□ The Experience Test answered for the surface, in one sentence each (§ 1)
□ Every governing Experience document READ — not remembered (§ 2; Standard § 4.1)
□ All nineteen areas graded; every N/A justified in one line
□ Every WARNING and FAIL carries: the rule (cited to its OWNER), the evidence
  (file:line or state+size), the failure as a person would experience it, and —
  for a WARNING — the mechanism by which it is currently true (Standard § 4.2)
□ Every state assessed, not only the good day: populated, empty, loading, error,
  slow-connection, and at least one awkward edge (Standard § 4.1; EXP ARCH § 17.1)
□ Every size and mode assessed, or listed in § 8 as a gap
□ The mechanical areas MEASURED, not judged — contrast (15), raw values and
  dormant predecessors (18), exposure as a governed value (2) (Standard § 4.1)
□ Architectural conflicts recorded and ROUTED to their owners — none resolved
  here, none picked between, none filled (§ 7)
□ Gaps recorded rather than passed over (§ 8)
□ Recommendations separated into deliverable-now vs blocked-by-the-governance-
  path, and none of them jumps it (§ 6; Blueprint § 2.4)
□ No new principle created — nineteen areas, nineteen owners, zero rules (Standard
  § 1.2). Anything the areas could not reach is a GAP, never a twentieth area
□ No screen redesigned, no UI implemented, no mock-up produced, no architecture
  modified by this audit
□ The band set by the worst grade present, not by the ratio; no percentage stated
□ Assessed by someone other than the sole author of the surface (Standard § 4.3)
□ Filed at docs/investigations/ux/<SURFACE>_COMPLIANCE_AUDIT_<YYYYMMDD>.md, and
  never edited afterward — an audit is history; the next audit supersedes it
□ The previous audit of this surface named in the header as superseded
```

---

*An audit — point-in-time analysis of one surface against the THA Experience Compliance Standard. It records verdicts against rules owned elsewhere; it creates no rule, sets no value, adds no gate, designs nothing, and implements nothing. It is diagnostic and never binding on a change: the six governance gates bind every change regardless of any grade here (Standard § 1.3). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: `<tag>` → `<sha>`.*

---

*(End of copyable report.)*

---

## 4. COMPLIANCE OF THIS TEMPLATE

- **No new experience principle.** The template records; it does not legislate. Its nineteen rows are the Standard's areas and its citations are the owners'.
- **One owner per rule.** The template quotes the Standard's three operating rules (§ 1) and its four finding requirements — deliberately, because an assessor will have the report open and not the Standard, and a rule nobody can reach at the moment of use is not enforced (`ARCH-VERIFY1`). It is a **usage restatement inside the same instrument**, not a second owner of a governing rule: every *rule* cited routes to its governing document, and the Standard remains the owner of the method. If the Standard changes, this template is corrected — never the reverse.
- **No gate.** A completed audit blocks nothing and permits nothing (Standard § 1.3).
- **Scope:** no screen audited · no UI designed or implemented · no mock-up · no architecture modified.
- **Placement:** proposed for `docs/implementation/ux/` beside the Standard and `ADOPTION_REGISTER.md`; completed audits at `docs/investigations/ux/`. See Standard § 7.

---

*A proposed template — the reusable report shape for the THA Experience Compliance Standard. It owns nothing but the shape.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the `EXPCOMP1` workstream: `rollback/EXPCOMP1-experience-compliance-standard-20260716` → `7d1dd2ce` (the tag protects committed state only; this untracked file is not covered by it).*
