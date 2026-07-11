# EXP2 — THA Experience Architecture: Premium Experience Principles — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN
**Reason:** Architecture-only — extends one governing document (EXP1) with a new principles section and seven checklist items, and corrects one stale cross-reference. No code, schema, route, component, or capability change. Fully reversible by removing the added section and restoring two lines.

> Enhances the governing [THA Experience Architecture](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1, 2026-07-10) with **Premium Experience Principles** (§ 17) and a **Premium Standard** block in the UX Governance Checklist (§ 18). Filed per `REPOSITORY_CONVENTIONS.md` § 3/§ 4 in the `ux` workstream, alongside `UIA2_UI_ARCHITECTURE_IMPLEMENTATION.md` — the other Experience Governance report.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/EXP2-premium-experience-principles-20260711` → `a4324004d667406f65599c3af34865c8921ee88a` |
| Working tree | Intentionally dirty (787 entries) — carries a large pre-existing, uncommitted body of work (staged `.engineering/` tooling, `docs/architecture/` housekeeping, filed `docs/implementation/` reports) authored by parallel sessions. **Not authored by this task; not touched; not committed.** |
| ⚠️ Tag coverage | The tag protects **committed state only**. Both governing documents this task edits — `THA_EXPERIENCE_ARCHITECTURE.md` and `THA_UI_ARCHITECTURE.md` — are **untracked** (`??`): they exist on disk but are *not in `HEAD`*. **The tag therefore does not protect them at all,** and `git checkout HEAD <path>` fails on both. This was verified at the moment of editing, not assumed. |
| Pre-edit snapshot | Taken outside the repo before any edit, per `ROLLBACK_PROTECTION_PROTOCOL.md` § 3: `<scratch>/EXP2-pre-edit-snapshot/` — `THA_EXPERIENCE_ARCHITECTURE.md` (sha1 `1355280e…`), `THA_UI_ARCHITECTURE.md`, `README.md` (sha1 `04e7cfd2…`). The scratch directory is session-scoped, so the authoritative rollback is the edit list below, which does not depend on the snapshot surviving. |
| This task's writes | `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (enhanced), `docs/architecture/THA_UI_ARCHITECTURE.md` (one stale cross-reference corrected), `docs/implementation/ux/EXP2_ARCHITECTURE_PREMIUM_EXPERIENCE_ENHANCEMENT.md` (this report) |
| Not touched | `docs/architecture/README.md` — it carries **staged and unstaged modifications authored by another session** (`MM`). Protocol § 3 forbids touching uncommitted work this task did not author, so no index edit was made. None is required: EXP2 adds no new governing *document*, only a section within one already indexed. |

### Rollback this task only

Reversing EXP2 is exactly five edits — no snapshot or tag needed:

1. `THA_EXPERIENCE_ARCHITECTURE.md` — delete § 17 (`## 17. PREMIUM EXPERIENCE PRINCIPLES` through the end of § 17.12).
2. `THA_EXPERIENCE_ARCHITECTURE.md` — renumber `## 18. UX GOVERNANCE CHECKLIST` back to `## 17.`
3. `THA_EXPERIENCE_ARCHITECTURE.md` — delete the `── PREMIUM STANDARD (§17) ──` block and its seven checks from the checklist; delete the **Enhanced:** header line and the forward-pointer paragraph at the end of § 3; restore the original rollback footer line.
4. `THA_UI_ARCHITECTURE.md` — restore `(§ 17 there)` in the UI Governance Checklist preamble.
5. Delete this report.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — mandatory entry point)
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (EXP1 — the document this enhances)
- [x] `docs/architecture/THA_UI_ARCHITECTURE.md` (UIA2 — the subordinate visual constitution; checked for boundary conflict)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` (filing/naming for this report)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## CHANGES MADE

**1. `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` — new § 17, PREMIUM EXPERIENCE PRINCIPLES** (the deliverable).

Twelve numbered Premium Principles (PP1–PP12) in the house principle-block form, each elaborated in a numbered subsection (§ 17.1–§ 17.12). The section opens with a definition — *premium is the perceptible result of care taken on the household's behalf* — and an explicit constitutional statement that the premium principles are **a lens over Experience Principles 1–8, not a rival set**, and may never be read as licence to weaken one of them.

**2. Two principles were deliberately not restated as new law.** The mission's list overlaps EXP1 in two places, and EXP1's own Experience Principle 6 (*one canonical place for everything*) binds this document to itself:

| Mission principle | Disposition |
|---|---|
| *Calm before capability* | Already **Experience Principle 3** (§ 3, § 6). Recorded as PP2 with ownership explicitly assigned back to EP3; adds only what the premium standard demands ("calm is not merely the absence of noise, it is the presence of composure"). |
| *Trust is earned through honesty and consistency* | Already **Experience Principle 7** and § 12. Recorded as PP9 with ownership assigned back; adds only that trust must be *actively re-confirmed*, not merely never betrayed. |

All twelve requested principles appear, so nothing was dropped — but two appear as *cross-references with a premium delta* rather than as duplicate law. Restating them in full would have created a second canonical home for a principle that already has one.

**3. Three sections the mission implied but did not name** were added because the principles are not enforceable without them:

- **§ 17.9** defines what actually counts as a *meaningful* interaction (a first genuine outcome; completion of a journey with real effort in it; an honest milestone the household would themselves recognise) and rules that everything else — routine saves, navigations, edits, dismissals — resolves without ceremony. Without a closed list, "reserved for meaningful interactions" is unenforceable, since every team believes its own interaction is meaningful.
- **§ 17.11** carries the required world-class-quality guidance (below).
- **§ 17.12 — "What premium is not"** is the guard against visual excess the mission asked for: not *more*, not motion, not ceremony, not exclusivity, not polish over honesty. Stated as prohibitions because "don't be excessive" is not an operable rule.

**4. § 17.11 — the standard THA measures itself against, and the imitation it refuses.** THA holds itself to the quality of the world's best consumer products and "claims no discount on it for being small, young, or busy" — but the standard is **a level of craft, not a look**. The section fixes the distinction operationally: *benchmark the craft, never the artefact*; an imported aesthetic "arrives without the reasoning that produced it, and always reads as costume"; and where the prevailing premium aesthetic (sleek, minimal, individual, aspirational) conflicts with THA's identity (warm, honest, household, kitchen-table), **THA's identity wins**. The rule of thumb given: *"Would they have shipped this?" is a fair question. "What would they have made?" is not.*

**5. § 3** — a closing paragraph now points forward to § 17, stating that the eight Experience Principles say *what* the experience must do while the Premium Principles say *to what standard of craft*.

**6. § 17 → § 18** — the UX Governance Checklist was renumbered to make room. Its heading text is unchanged (`UX GOVERNANCE CHECKLIST`) so that the existing reference in `docs/architecture/README.md` — which this task must not edit — remains accurate.

**7. Checklist extended (§ 18)** — a `PREMIUM STANDARD (§17)` block adds seven checks to the existing fifteen: craft completeness; friction and cognitive load; intentionality; premium moment discipline; premium without excess; authentic identity; refinement, not accretion. Each cites the premium principle it enforces.

**8. Header** — an **Enhanced:** line records EXP2, 2026-07-11.

**9. Rollback footer corrected.** EXP1's footer instructed `git checkout HEAD docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`. That command **cannot work** — the file has never been committed. The footer now states the file's untracked status and points to this report. This is a factual correction, not a change of governance.

**10. `docs/architecture/THA_UI_ARCHITECTURE.md`** — one stale cross-reference corrected: its UI Governance Checklist preamble cited the Experience Architecture's checklist as "§ 17 there", now § 18. A second stale reference exists in `docs/investigations/ux/UIA1_UI_ARCHITECTURE_DISCOVERY.md` (line 316) and was **deliberately left alone**: investigations are point-in-time history under `REPOSITORY_CONVENTIONS.md` and are not retro-edited.

No code was implemented. Nothing was committed.

## MISSION REQUIREMENTS → WHERE SATISFIED

| Required principle | Where |
|---|---|
| Craftsmanship over feature quantity | PP1, § 17.1 |
| Calm before capability | PP2 → owned by EP3 (§ 3, § 6); premium delta at PP2 |
| Quality over novelty | PP3, § 17.2 |
| Every interaction should feel intentional | PP4, § 17.3 |
| Remove friction before adding functionality | PP5, § 17.4 |
| Reduce cognitive load wherever possible | PP6, § 17.5 |
| Moments of delight, not constant stimulation | PP7, § 17.6 |
| Premium through simplicity, clarity and confidence | PP8, § 17.7 |
| Trust earned through honesty and consistency | PP9 → owned by EP7 + § 12; premium delta at PP9 |
| Welcoming, reassuring, family-first | PP10, § 17.8 |
| Premium moments reserved for meaningful interactions | PP11, § 17.9 (with the qualifying moments named) |
| Continuous refinement, not periodic redesign | PP12, § 17.10 |
| World's-best quality, authentic not imitative | § 17.11 |
| Premium without visual excess | § 17.12 + checklist "Premium without excess" |
| Experience Governance Checklist updated | § 18 — Premium Standard block, 7 new checks |

## ARCHITECTURE COMPLIANCE CHECKLIST

- [x] **Architecture bootstrap performed** — `docs/architecture/README.md` read first, before any change.
- [x] **No ownership boundary moved** — Experience still consumes and never owns; § 17 introduces no fact, entity, or decision. The Experience/UI split is preserved: § 17 governs the *standard of craft*, and every visual expression of it (colour, motion, depth, density) is explicitly deferred to the UI Architecture, which remains subordinate to this document.
- [x] **No second canonical home created** — the two overlapping principles (calm; trust) cross-reference their existing owners rather than restating them (EP6).
- [x] **Technology-independent** — no framework, library, component, route, screen size, or pixel value is named in the added text, per EXP1 § 1.
- [x] **Does not weaken any existing principle** — § 17 is declared a lens over EP1–8 and is prohibited from licensing any relaxation of them.
- [x] **No code, schema, route, or capability change.**
- [x] **Filed per `REPOSITORY_CONVENTIONS.md`** — see deviation note below.

## VERIFICATION

```
Section headings          1–18, no duplicate or skipped number   ✅
Premium principles        12 declared (PP1–PP12)                 ✅
Premium subsections       12 (§ 17.1 – § 17.12)                  ✅
Checklist items           22 (15 original + 7 premium)           ✅
Fenced code blocks        2 (balanced)                           ✅
Stale § refs to checklist 1 found in governing docs, corrected   ✅
                          1 found in an investigation, left as history
Pre-edit snapshot         3 files, sha1 recorded                 ✅
```

Structure verified mechanically (heading sequence, principle/subsection counts, fence balance, cross-reference sweep). The deliverable is prose governance: its substance is verified by review, not by execution — there is no runtime surface to exercise, and none was claimed.

## EXPLICIT DEVIATIONS / NOTES

1. **Report path changed from the one requested.** The mission asked for `docs/implementation/EXP_ARCHITECTURE_PREMIUM_EXPERIENCE_ENHANCEMENT.md`. That path is a **loose file at the root of `docs/implementation/`**, which `REPOSITORY_CONVENTIONS.md` § 3 explicitly forbids ("Implementation reports, filed by workstream … *never*: loose files at its root") and which `.engineering/scripts/repo-structure-verify.sh` fails mechanically. The report is therefore filed at **`docs/implementation/ux/EXP2_ARCHITECTURE_PREMIUM_EXPERIENCE_ENHANCEMENT.md`** — the requested subject name, kept intact, with the mandatory EWO ID prefix (`EXP2`, verified unused) in the `ux` workstream beside `UIA2_UI_ARCHITECTURE_IMPLEMENTATION.md`. Writing it where asked would have broken the repository's own verifier on the first run.

2. **`docs/architecture/README.md` was not updated.** It carries staged *and* unstaged edits from a parallel session; Rollback Protection Protocol § 3 forbids touching uncommitted work this task did not author. No update is needed — EXP2 adds a section to an already-indexed document, not a new one. **If the index note is later refreshed by whoever owns that dirty state,** the natural addition is that EXP1 now also carries the Premium Experience Principles.

3. **The governing document is not under version control.** `THA_EXPERIENCE_ARCHITECTURE.md` and `THA_UI_ARCHITECTURE.md` are both untracked and exist only in the working tree. Two of THA's governing documents currently have **no git protection whatsoever** — a `git clean` would destroy them, and no rollback tag can help. This is a pre-existing condition inherited from the parallel session, not created here, and it is out of scope to fix (committing another session's work is forbidden by the same protocol). **It is the most significant risk in the repository right now and should be resolved by committing the pending governance work.**

## OUTCOME

The THA Experience Architecture now governs not only what the experience must do, but the standard of craft to which it must be done. Twelve Premium Experience Principles are law; the checklist enforces them on every user-facing implementation; premium is defined as felt care rather than visual expenditure, and explicitly bounded against excess, ceremony, and imitation.

**Status:** ✅ Complete — architecture enhancement only, no code, nothing committed.
