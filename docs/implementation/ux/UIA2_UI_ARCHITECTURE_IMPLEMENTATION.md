# UIA2 — THA UI Architecture — Implementation

**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN
**Reason:** Documentation-only — creates one governing architecture document and indexes it in the architecture README. No code, schema, route, or capability change; fully reversible by deleting/reverting two files.

> Implements P1 of the approved [UIA1 UI Architecture Discovery](../../investigations/ux/UIA1_UI_ARCHITECTURE_DISCOVERY.md) (Option A — govern first, converge by priority). Filed per `REPOSITORY_CONVENTIONS.md` § 3/§ 4 in the `ux` workstream folder, paired with the UIA1 investigation.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/UIA2-ui-architecture-20260710` → `a4324004d667406f65599c3af34865c8921ee88a` |
| Working tree | Intentionally dirty — carries a large pre-existing, uncommitted body of work (staged `.engineering/` tooling, `docs/architecture/` housekeeping, the uncommitted `THA_EXPERIENCE_ARCHITECTURE.md` (EXP1), and filed `docs/implementation/ux/` reports) authored by parallel sessions. Not authored by this task; not touched; not committed. The tag protects committed state only and does **not** cover that work. |
| This task's writes | `docs/architecture/THA_UI_ARCHITECTURE.md` (new), `docs/architecture/README.md` (Experience Governance index entry + note), `docs/implementation/ux/UIA2_UI_ARCHITECTURE_IMPLEMENTATION.md` (this report) |
| Rollback this task only | Delete `docs/architecture/THA_UI_ARCHITECTURE.md` and this report; revert the Experience Governance edits in `docs/architecture/README.md` (note: a plain `git checkout` of the README would also discard the pre-existing unstaged EXP1 index edit — revert this task's lines specifically) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (EXP1 — the governing layer this document sits beneath)
- [x] `docs/investigations/ux/UIA1_UI_ARCHITECTURE_DISCOVERY.md` (the approved discovery this implements)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` (filing/naming for this report)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight Core Principles)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## CHANGES MADE

1. **`docs/architecture/THA_UI_ARCHITECTURE.md`** (new — the deliverable). The governing UI Architecture, in the house governing-document form (status header, STOP-on-conflict rule, principle blocks, compliance checklist, rollback footer). Timeless, framework-independent, implementation-independent: no technology, library, file, or pixel value is named in the governing body; token *values* are explicitly delegated to a single implementation source the document points to.

2. **`docs/architecture/README.md`** — added `THA_UI_ARCHITECTURE.md` to the Experience Governance table and extended the section note to state its scope and subordination (indexed at creation per the README's own convention).

3. **This report.**

No code was implemented. Nothing was committed.

## MISSION REQUIREMENTS → WHERE SATISFIED

| Requirement | Where |
|---|---|
| Expands EXP1 into visual principles, subordinate to it | Header; § 1; § 2 (behaviour vs presentation split, precedence table) |
| Experience governs behaviour / UI governs presentation; Experience prevails on conflict | § 2 (stated as the governing rule), header, footer, checklist item 1 |
| Visual Language (formerly Design Language) as canonical visual identity | § 4 (term renamed once and finally) |
| "Calm Orchard" officially adopted | § 4 |
| Beauty Through Consistency as core UI principle | § 3 (UI Principle 2), § 18 checklist |
| Brand Identity Architecture (logos, apple, domain icons, illustration, photography, companion imagery, empty-state imagery) | § 10 |
| Visual Trust (evidence, confidence, uncertainty, semantic colour, status communication) | § 14 (with § 7 colour law) |
| One canonical owner for every visual concern | § 3 (UI Principle 4), § 17 |
| Retire-on-introduction as governing UI principle | § 3 (UI Principle 5), § 17 |
| UI Governance Checklist | § 18 |
| UIA1 recommendations incorporated | R1→§4, R2→§5, R3→§6, R4→§6/§5, R5→§12/§6, R6→§5/§12, R7→§13, R8→§10, R9→§7/§14, R10→§8, R11→§9, R12→§11, R13/R14/R15→§12, R16→§9, R17→§15, R18→§17, R19→§16, R20→§5/§9 (split rule, emphasis budget, calm feedback), R21→§17 (ownership/adoption register — component-level naming deliberately left to the register beside the code, keeping the document implementation-independent) |
| Update architecture README | Done (change 2) |

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity          ✓ No entity touched; one canonical document created.
□ One owner per fact              ✓ The document restates no owned facts; token values,
                                    adoption registers, and component ownership are
                                    explicitly delegated to their single homes.
□ No duplicate entities           ✓ No second visual-governance document exists; UIA1
                                    remains point-in-time analysis, pointed to, not copied.
□ No duplicate ownership          ✓ EXP1's behavioural territory is not restated —
                                    § 2 divides the questions and yields precedence upward.
□ No duplicate state              ✓ Documentation only.
□ Extends existing architecture   ✓ Fills the visual layer EXP1 explicitly disclaims;
                                    modelled on EXP1's governing form; indexed in README.
□ Honest gaps over fabrication    ✓ § 12 (empty states) and § 14 (Visual Trust) carry
                                    Core Principle 6 to the visual layer.
□ No permanent sync bridge        ✓ None created.
□ Evolution over replacement      ✓ Adopts the existing Calm Orchard language rather than
                                    inventing one (UIA1 Option A); § 17 makes
                                    retire-on-introduction governing for all future UI.
```

## VERIFICATION

- `.engineering/scripts/repo-structure-verify.sh` — **PASS** (all checks; run after all three writes).
- README index entry links resolve (document exists at the linked path).
- Body of `THA_UI_ARCHITECTURE.md` contains no framework, library, or component-file names and no concrete token values (technology-independence requirement).

## EXPLICIT DEVIATIONS / NOTES

- **EXP1 is still uncommitted.** UIA1's Next Steps gated this work on EXP1 being committed; this mission was nonetheless explicitly commissioned, so the document was authored against EXP1's current working-tree text. If EXP1 changes before commit, § 2's precedence mapping and the section cross-references (§ 5→EXP1 § 9, § 12→EXP1 § 14, § 15→EXP1 § 16, § 10→EXP1 § 11) must be re-checked.
- UIA1's current-implementation notes (specific components, counts, pixel values) were deliberately **not** carried into the governing document — they are convergence work-list material for the P2–P10 workstreams, and embedding them would break the timelessness requirement.

## OUTCOME

THA now has a governing UI Architecture: Calm Orchard is the officially adopted Visual Language; presentation is governed by eight UI Principles under the Experience Architecture's precedence; every visual concern has the one-owner and retire-on-introduction law UIA1 identified as the missing root-cause fix; and every future UI implementation must pass the § 18 UI Governance Checklist. The UIA1 priority sequence P2–P10 can now proceed as individually gated workstreams under this document.
