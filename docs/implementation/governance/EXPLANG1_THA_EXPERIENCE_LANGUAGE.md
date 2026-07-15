# EXPLANG1 — THA Experience Language (Implementation Report)

**Workstream:** governance
**Status:** COMPLETE — adopted as governing architecture
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/EXPLANG1-tha-experience-language-20260715` → `0f0615aa`
**Run file:** [`.engineering/session/runs/EXPLANG1_THA_Experience_Language.md`](../../../.engineering/session/runs/EXPLANG1_THA_Experience_Language.md)

---

## 1. What this workstream did

Created the governing **THA Experience Language** — the emotional constitution of The Healthy Apples, governing *how the platform must feel* — and, on adoption, wired it into the two governance mechanisms that make a governing document reachable rather than merely written:

1. the **Architecture Bootstrap** (required reading before user-facing work), and
2. the **Experience & UI Governance Compliance** gate (the checklist every user-facing implementation must pass).

The document itself defines the seven target feelings (calm · welcoming · effortless · intelligent · reassuring · premium · quietly memorable, *without becoming theatrical, gimmicky or distracting*), thirteen **Principles of Feeling** (each with why it exists / how users should feel / practical implications / encourage / avoid), the canonical six-beat **Experience Rhythm** (Arrival → Orientation → Confidence → Action → Understanding → Completion) applied to every realm, the **Experience Review Questions** (§ 6), and the **Experience Anti-Patterns** (§ 7).

## 2. Files changed

| File | Change | Phase |
|---|---|---|
| `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` | **New** — the governing document (396 lines). **Content unchanged during adoption.** | Creation (prior) |
| `docs/architecture/README.md` | Indexed the document under **Experience Governance** (table row + explanatory prose block establishing it as the emotional constitution: subordinate to the Experience Architecture, sibling to the UI Architecture). | Creation (prior) |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | **Integration 1** — added `THA_EXPERIENCE_LANGUAGE.md` to the STEP 2 Architecture Bootstrap "for any user-facing implementation" required-reading list. **Integration 2** — added the Experience Language row to the Experience & UI Governance Compliance table (three documents now own the user-facing layer) and a check binding the **Experience Review Questions (§ 6)** and **Anti-Patterns (§ 7)** into the compliance block, with precedence restated (Experience Architecture prevails). | Adoption (this) |
| `.engineering/session/runs/EXPLANG1_THA_Experience_Language.md` | Run-file bookkeeping (session recovery). | Both |
| `.engineering/session/CURRENT.md` | Dashboard row (session recovery). | Both |

**No product code, UI, schema, token, colour, or component was touched.** No new principle or architecture was introduced during adoption — the two edits make the *existing* document reachable; they add no law of their own. `THA_EXPERIENCE_LANGUAGE.md` was **not** modified during adoption (verified §3).

## 3. Verification performed

- **Experience Language content unmodified during adoption** — file remains 396 lines; no edit was made to it in the adoption phase (only the two governance files and session bookkeeping changed).
- **Integration 1 renders correctly** — the STEP 2 user-facing required-reading list now names `THA_EXPERIENCE_LANGUAGE.md` between the Experience Architecture and the UI Architecture, described as *"how THA must feel … subordinate to the Experience Architecture."*
- **Integration 2 renders correctly** — the compliance table now lists three documents (Experience Architecture → Experience Language → UI Architecture), and the `EXPERIENCE & UI GOVERNANCE COMPLIANCE` checklist block now contains the Experience Review Questions (§ 6) check and the precedence line naming EXPLANG § 2.1.
- **No restatement / second-owner drift** — following the section's own rule, the workflow *names* the § 6 Experience Review Questions as the checklist rather than copying them; the questions live in exactly one place (`THA_EXPERIENCE_LANGUAGE.md` § 6). Same discipline the block already applies to the UX and UI checklists.
- **Repository structure** — `.engineering/scripts/repo-structure-verify.sh`: every EXPLANG1 file passes (new doc indexed, report filed by workstream, no duplicate content, no tooling under `docs/`). The only reported violations are two **pre-existing** stray root files (`.glibcheck.txt`, `.libdirs_uxhome.txt`) present at session start and unrelated to this workstream.
- **No conflicts with existing architecture** — the document is subordinate to the Experience Architecture (behaviour prevails over a description of feeling), a sibling to the UI Architecture (which retains sole ownership of the motion vocabulary and all visual values), restates neither the eight Experience Principles nor the eight UI Principles, and creates no runtime dependency. Its motion/nature/light principles are the *felt* faces of UI Architecture §§ 4, 7, 11 and Experience Architecture § 17 — alignment, not competition.

## 4. Confirmation

**EXPLANG1 is fully adopted.** The THA Experience Language is governing architecture: indexed in the canonical architecture README, named as required reading in the Architecture Bootstrap (STEP 2), and enforced through the Experience & UI Governance Compliance gate via its Experience Review Questions — reachable by anyone following `ENGINEERING_WORKFLOW.md`, on the same footing as the UX and UI Governance Checklists. Every future user-facing implementation is now evaluated against how it makes people *feel* before it is considered complete.

---

*Rollback: `git checkout HEAD docs/architecture/ENGINEERING_WORKFLOW.md docs/architecture/README.md` reverts the integrations; delete `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` and this report to revert the document. Tag `rollback/EXPLANG1-tha-experience-language-20260715` → `0f0615aa` pins the pre-work state.*
