# EXPLANG1A — THA Experience Language Enhancements (Implementation Report)

**Workstream:** governance
**Status:** COMPLETE — enhancement adopted into governing architecture
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/EXPLANG1A-experience-language-enhancements-20260715` → `b7ddc442`
**Enhances:** [`docs/architecture/THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (EXPLANG1)
**Source of the principles:** the ARRIVAL1 Arrival Experience prototype ([`docs/implementation/ux/UX_ARRIVAL_EXPERIENCE_PROTOTYPE.md`](../ux/UX_ARRIVAL_EXPERIENCE_PROTOTYPE.md))

---

## 1. What this workstream did

Enhanced the existing governing **THA Experience Language** with the principles discovered during the Arrival experience prototype (`ARRIVAL1`). It is an **enhancement only** — no existing principle was rewritten, no existing guidance was duplicated, no ownership boundary was changed, and no production code, UI, schema, token, colour, or component was touched.

The enhancement adds one new section — **§ 4A, The Place Principles — What the Arrival Taught** — housing the eight new governing principles the brief requested, and extends § 6 (Experience Review Questions) and § 7 (Experience Anti-Patterns) *only* where a new principle genuinely required an additional check. The eight principles frame THA as a **place a household arrives in and moves through**, rather than a set of pages it operates — making § 1.1's *"walking into a calm kitchen"* literal and enforceable.

## 2. The eight new principles (§ 4A)

| # | Principle | Relationship to the existing thirteen |
|---|---|---|
| **A** | **The THA Promise** — reduce the invisible stress of everyday family food decisions; every decision must reduce effort, increase confidence, and give time back. | New. States the emotional purpose beneath § 1's stated purpose. |
| **B** | **THA is a place** — the orchard is the environment, not decoration; realms are rooms in one home, not disconnected pages. | Deepens **Principle 5**; cited, not restated. |
| **C** | **Arrival before work** — emotional arrival precedes functional interaction; a welcome is never combined with a workload. | Sharpens **Principle 1**; cited, not restated. |
| **D** | **Walking, not scrolling** — scrolling feels like movement through one continuous place, never like paging between screens. | New; the constructive counterpart of **Principle 12** (which forbids seizing the scroll). |
| **E** | **The application shell is constant** — the shell reassures through familiarity; emotional experimentation must not alter the canonical shell. | Deepens **Principle 9**; explicitly defers to it and adds only the arrival-specific guard. |
| **F** | **Light has meaning** — light carries welcome · warmth · calm · clarity · optimism, and never spectacle. | Deepens **Principle 6**; cited, not restated. |
| **G** | **Home is not the dashboard** — Home is the place the household arrives; the dashboard is the first workspace within it. | New. |
| **H** | **Premium through restraint** — *"if users notice the animation before they notice the content, the animation has failed."* | New governing test; operationalises **Principles 12, 13** and § 3 without restating them. |

## 3. Files changed

| File | Change |
|---|---|
| `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` | **Enhancement.** (1) Added **§ 4A** with the eight Place Principles, each in the document's own five-face format (why / how users should feel / practical implications / encourage / avoid), citing the § 4 principle it deepens where applicable. (2) Extended **§ 6** with a new *Place & Promise* group of four review questions — one per genuinely new evaluative lens (A; B+D; C; G). (3) Extended **§ 7** with three new anti-patterns (*Paging instead of walking* — D; *Home reduced to a dashboard* — G; *A welcome that is also work* — C). (4) Recorded the § 4A admission in **§ 8** (Governance and Admission). (5) Added the `Enhanced:` line to the header metadata and the EXPLANG1A tag to the rollback footer. |
| `docs/architecture/README.md` | Added one sentence to the Experience Language prose block naming the EXPLANG1A enhancement and the eight principles, so the architecture census stays accurate. |
| `docs/implementation/governance/EXPLANG1A_THA_EXPERIENCE_LANGUAGE_ENHANCEMENTS.md` | **New** — this report. |
| `.engineering/session/runs/EXPLANG1A_Experience_Language_Enhancements.md` | Run-file bookkeeping (session recovery). |
| `.engineering/session/CURRENT.md` | Dashboard row (session recovery). |

## 4. No-duplication discipline (the hard requirement)

The brief required that no existing guidance be duplicated. The reconciliation applied:

- **Principles that deepen an existing one (B, C, E, F)** cite the § 4 principle they extend (5, 1, 9, 6 respectively) and contribute only what the arrival revealed. Principle **E** in particular is nearly co-extensive with **Principle 9** (the shell is sacred); it is therefore written as a *pointer with one added guard* — "emotional experimentation earns no exception to the shell" — and explicitly defers to Principle 9 for everything else, rather than becoming a second owner of the shell rule.
- **§ 6 was extended by four questions, not more.** Checks already present were *not* re-added: the "notice the effect vs feel the care" question already covers Principle H; the "shell feels untouched" question already covers E; the warmth/welcome questions already cover F. Only A, B/D, C, and G introduced a genuinely new evaluative lens, and only those four questions were added.
- **§ 7 was extended by three anti-patterns, not more.** The shell-that-performs failure (E) already existed as *"A shell that performs"* — so it was **not** duplicated (only its cross-reference was widened to name Principle E); light-as-spectacle (F) is already covered by *"Attention seeking"* (glowing) and *"Decorative animation"*, so no light anti-pattern was added. Only *Paging instead of walking*, *Home reduced to a dashboard*, and *A welcome that is also work* were genuinely absent.

## 5. Architecture compliance (ownership preserved)

The enhancement introduces **no ownership overlap** and changes **no boundary**:

- **Experience Architecture owns behaviour.** Where a new principle touches behaviour (arrival shown once per session and yielding to intent — C; which surface is Home and what it must do — G; shell structure — E), the principle explicitly defers to the Experience Architecture and governs only the *feeling*.
- **Experience Language owns emotional intent.** All eight principles are stated purely as feeling and intent, consistent with § 2.
- **UI Architecture owns visual implementation.** Where a new principle touches a visual or motion value (transition motion — B; light values, gradients, and the motion of a light moment — F; motion — D, H), the principle defers to the UI Architecture (§§ 7, 11) and names no value of its own.
- **Precedence unchanged.** Experience Architecture (behaviour) > Experience Language (feeling), beside the UI Architecture (look). § 8's precedence statement is untouched; the § 8 admission bullet now records that § 4A entered by governance, as § 8 requires.

## 6. Verification performed

- **Enhancement only — no rewrite.** The thirteen § 4 Principles of Feeling are unchanged and unrenumbered; § 5 (Rhythm), the original § 6 questions, and the original § 7 anti-patterns are unchanged except for the additive extensions and one widened cross-reference. § 4A is inserted between § 4 and § 5, so **no existing section number moved** — the load-bearing cross-references to § 6 (Review Questions) and § 7 (Anti-Patterns) in `README.md` and `ENGINEERING_WORKFLOW.md` remain correct.
- **No second owner created.** Deepening principles cite rather than restate; § 6 and § 7 were extended only where a new principle required it (§ 4 above).
- **No production surface touched.** Docs only — no code, UI, schema, token, colour, component, or route. No runtime dependency created; the document remains description, never dependency (§ 2.3).
- **Rollback protection in place.** Tag `rollback/EXPLANG1A-experience-language-enhancements-20260715` → `b7ddc442` pins the pre-enhancement state; every EXPLANG1A change is confined to the five files in § 3.

## 7. Confirmation

**EXPLANG1A is complete.** The THA Experience Language now carries the eight Place Principles discovered in the ARRIVAL1 prototype, as governing architecture on the same footing as its thirteen Principles of Feeling — with the review questions and anti-patterns they genuinely require, no duplicated guidance, and no ownership conflict. Every future user-facing implementation is now also evaluated on whether it makes THA feel like *a place the household arrives in and moves through*.

---

*Rollback: `git checkout HEAD docs/architecture/THA_EXPERIENCE_LANGUAGE.md docs/architecture/README.md` reverts the enhancement and the README note; delete this report to revert it. Tag `rollback/EXPLANG1A-experience-language-enhancements-20260715` → `b7ddc442` pins the pre-enhancement state.*
