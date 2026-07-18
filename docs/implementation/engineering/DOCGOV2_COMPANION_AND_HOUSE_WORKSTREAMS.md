# DOCGOV2 — Companion & House Documentation Workstreams

**Status:** Implementation report. Repository structure & documentation-governance.
**Date:** 2026-07-18
**Governs nothing new** — extends the workstream vocabulary of
[`../../architecture/REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md)
§4 with two streams and makes their filing self-enforcing. Follows [DOCGOV1](./DOCGOV1_CANONICAL_FILING_RESTORATION.md).

---

## Rollback identifier

- **Tag:** `rollback/companion-house-workstreams-20260718` → `7bfad50c`
- **Worktree patch:** `scratchpad/rollback-worktree-companion-house-workstreams-20260718.patch`
  (496 KB, full `git diff HEAD` at start).

## Workstreams created

`docs/implementation/companion/`, `docs/investigations/companion/`,
`docs/implementation/house/`, `docs/investigations/house/`.

- **companion/** — the Companion as a surface and as intelligence: identity,
  presence, conversation, authority, integration, runtime behaviour, Companion
  Intelligence implementation. Carved out of `intelligence/` and `ux/`.
- **house/** — the House experience: Home, Arrival, North Star, Orchard House,
  rooms, spatial experience, household interior design language. Carved out of
  `ux/`. **Not** general UX-system work, which stays in `ux/`.

## Files moved (45 total; `git mv` where tracked, `mv` where untracked)

**→ `docs/implementation/companion/` (16)** — from `ux/`: COMP1_COMPANION_VISUAL_IDENTITY,
COMP2_COMPANION_PRESENCE_AND_CONVERSATION, COMP3_LIVING_RELATIONSHIP,
COMP_INT1_COMPANION_INTEGRATION_AUDIT, CP1_COMPANION_PRESENCE_FOUNDATION,
CP1A_COMPANION_LOGO_IDENTITY_IMPLEMENTATION, CP1B_COMPANION_ENTRY_LOGO_IMPLEMENTATION,
UI1A_CANONICAL_COMPANION_CLEANUP, INT18_PHASE2_FLOATING_ASSISTANT; from `intelligence/`:
COMP1_COMPANION_RESPONSE_ENRICHMENT, COMP2_NATURAL_CONVERSATION,
INT38_COMPANION_GUIDANCE_AND_ACTION_FRAMEWORK, INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS,
INTQ8_COMPANION_INTELLIGENCE_ARCHITECTURAL_HARDENING_IMPLEMENTATION,
INTQ10_COMPANION_INTELLIGENCE_CAPABILITY_EXPANSION_IMPLEMENTATION; filed from a loose root:
COMP_VERIFY1_COMPANION_RUNTIME_CONFORMANCE_AUDIT.

**→ `docs/implementation/house/` (19)** — from `ux/`: ARRIVAL1_DEFINITIVE_HOME,
HOME_ARRIVAL_PRODUCTION_LOCK, HOME_ARRIVAL_REIMAGINED, HOME_EMOTIONAL_INTERIOR_DESIGN,
HOME_FINAL_CONCEPTS, HOME_INTERIOR_ARCHITECTURE, NORTH1_HOME_IMPLEMENTATION,
NORTH1_THE_VISUAL_NORTH_STAR, NORTH2_HOME_REFINEMENT, NORTH3_HOME_REIMAGINED,
NORTH4_CONCEPT_B_EVOLUTION, NORTH4_HOME_CONCEPT_EXPLORATION, NORTH5_HOME_REFINEMENT,
UX0_HOME_EXPERIENCE, UX_ARRIVAL_EXPERIENCE_PROTOTYPE, ODL1_HOME_ORCHARD_DESIGN_LANGUAGE,
EXP2_ARRIVAL_EXPERIENCE_EXPLORATION, EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES; filed from a loose
root: HOUSE5_KITCHEN_EXPERIENCE.

**→ `docs/investigations/house/` (5)** — HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION,
HOME2_CANONICAL_HOME_DECISION_MODEL, HOME_COMPLIANCE_AUDIT_20260716,
HOUSE4_ORCHARD_HOUSE_BLUEPRINT, HOUSE5_ORCHARD_HOUSE_CONCEPT.

**→ `docs/investigations/companion/` (4)** — COMP4A4_COMPANION_RESPONSE_ASSEMBLY_AUDIT,
COMP4A4_COMPANION_RESPONSE_EXECUTION_TRACE, COMPANION_ROLLOUT_SEQUENCE,
CP2_COMPANION_RESPONSE_INTELLIGENCE_AUDIT.

*(A third loose-root file that appeared mid-run from a concurrent session,
AFI1_AMBIENT_FOOD_INTELLIGENCE, was filed to its own workstream `intelligence/`,
not Companion/House.)*

## Filing rules added

1. **`REPOSITORY_CONVENTIONS.md` §4** — added the `companion/` and `house/` rows;
   narrowed the `intelligence/` row ("**Not the Companion itself**") and the `ux/`
   row ("**General** UI/interaction … not the Companion, not the House"); added the
   **Companion and House routing** subsection and the grandfather allow-list with
   per-file reasons.
2. **`repo-structure-verify.sh` check #8** — *no Companion/House reports in the
   generic `ux/` folder*. Fails on a Companion-named (`COMPANION`, `CP<n>`) or
   House-named (`ARRIVAL`, `NORTH<n>`, `HOME`, `HOUSE<n>`, `ORCHARD_HOUSE`) report
   directly under `docs/implementation/ux/` or `docs/investigations/ux/`. Loose-root
   filing is already caught by check #3, and this gate runs at session completion
   (DOCGOV1), so a misfiled Companion/House report blocks completion.

## Ambiguous / cited files left unchanged (reported, not moved)

- **Cited by governing architecture** (moving breaks a governing-doc path citation,
  which §5 forbids) — left in place, on the verifier allow-list where they sit in
  `ux/`: `CP2_COMPANION_PERSONALITIES_ACTIVATION`, `EWX1_LIVING_COMPANION_EXPERIENCE`,
  `INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION`, `EXP5_ONE_HOME_MANY_PLACES` (ux);
  `EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION`,
  `INT35B_COMPANION_LEARNING_AND_OBSERVABILITY`,
  `INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD`,
  `EWO1_COMPANION_PLATFORM_FOUNDATION`,
  `THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION` (intelligence).
- **`ux/`↔`architecture/` name-duplication** (same EWO name, *different* content in
  both folders — a pre-existing "one canonical home" defect for the owner to
  resolve, not a filing move): `DESIGN1_HOME_VISUAL_DESIGN`, `HOUSE1_THE_ENTRANCE_HALL`,
  `ORCHARD2_FIRST_LIGHT`, `ORCHARD3_VISUAL_CONCEPT_EXPLORATION`.
- **Cross-domain hybrids / general experience** (owning workstream is a judgment
  call for the owner): `WX2_HOME_INTELLIGENCE_COMPANION_IMPLEMENTATION`,
  `WX3_PLANNER_INTELLIGENCE_COMPANION_IMPLEMENTATION`,
  `NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT`.
- **`docs/implementation/architecture/` folder** (OHDB1, OLB1, TRANSLATION1,
  EXPBLUE1, plus the ORCHARD2/3/DESIGN1/HOUSE1 twins) — a coherent pre-existing
  folder of governing-doc implementation reports, not "loose" nor in the generic
  `ux/` folder, and containing EXPBLUE1 which is general Experience vision, not
  House. Left intact; the enforcement rule does not target it.
- **Per-domain Orchard room blueprints** (`COOK1`/`PANTRY1`/`PLAN1`/`SHOP2_ORCHARD_*_BLUEPRINT`)
  and **`FI*` Food-Intelligence-with-Companion** reports — owned by their domain /
  Food Intelligence workstream, not the Companion, and left there.
- **Governing architecture documents** — not moved (per mission): the Companion
  Platform Architecture, Companion Authority Model, AI Experience & Conversation
  Architecture, Behaviour/Notice/Card-Experience documents all remain in
  `docs/architecture/`.

## Verification results

- `repo-structure-verify.sh`: **11/11 PASS** on the clean tree.
- `session-verify.sh`: **all boundary checks PASS**.
- Rejection proven: a Companion report placed in `docs/implementation/ux/` and a
  House report placed in `docs/investigations/ux/` each fail check #8 (exit 1) and
  block `session-complete.sh`, with `CURRENT.md` left byte-unchanged.
