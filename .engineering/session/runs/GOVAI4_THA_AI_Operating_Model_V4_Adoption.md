# GOVAI4 — THA AI Operating Model V4 Adoption

**Session ID:** `GOVAI4_THA_AI_Operating_Model_V4_Adoption`
**Opened:** 2026-07-26
**Objective:** Adopt THA AI Operating Model V4 as the repository's canonical AI
governance model and register it in the architecture index.
**Risk:** 🔴 RED — architecture and governance.
**Rollback identifier:** `rollback/GOVERNANCE-tha-ai-operating-model-v4-20260726`
→ `3cfc1f1bdd682452a942f971f9d13e6118bfbdf6`

---

## Stage

**STOPPED — conflicting ownership found before implementation.**

No tracked file has been modified. No file has been created under
`docs/architecture/` or `docs/implementation/`.

---

## Checkpoints reached

1. ✅ Read `docs/architecture/README.md` (209 lines, full) and the governing
   documents bearing on this work: `.engineering/README.md`,
   `.engineering/OPERATING_MANUAL.md`,
   `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`,
   `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`,
   `docs/architecture/ENGINEERING_WORKFLOW.md`,
   `docs/architecture/REPOSITORY_CONVENTIONS.md`,
   `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8).
2. ✅ Located and inspected the source archive. **Path divergence:** the archive
   on disk is `./tha-ai-operating-model-v4.zip.zip` (doubled extension from
   upload), not `./tha-ai-operating-model-v4.zip` as briefed. Same artefact.
   SHA256 `bbaae852179c070d7c397f09bbb0f796e0f4b10dd0f4225ee9dab0d8da717a2d`.
   All three expected members present.
3. ✅ Confirmed all four agreed corrections present in **all three** versions
   (mechanical grep, 1 hit each per file — see implementation report when filed).
4. ✅ Confirmed git status. 13 modified tracked files, 14 untracked entries, all
   pre-existing and authored by a prior session (`LARDER`/`VISREG` workstreams).
   Not touched. Archive is gitignored (`.gitignore:8` `*.zip`).
5. ✅ Rollback tag created from committed state only.
6. ✅ Rollback identifier reported.
7. ✅ This task file.
8. ⛔ **Implementation not started** — see Blocker.

---

## Blocker

The adoption as scoped **cannot demonstrate that it creates no duplicate
governance owner**, which the brief makes a precondition for implementation
("If ownership cannot be demonstrated, STOP before implementation").

Every instrument stated by `THA-Governing-AI-Operating-Model-V4.md` already has a
named canonical owner in this repository, and the two governing owners explicitly
declare **"Neither document restates the other"**
(`docs/architecture/ENGINEERING_WORKFLOW.md`, Document ownership, EOM1).

| V4 section | Existing verified owner |
|---|---|
| CHANGE CLASSIFICATION (🟢/🟡/🔴) | `.engineering/standards/RISK_AND_SCOPE_STANDARD.md` § 1 |
| APPROVAL / one decision at a time | `docs/architecture/ENGINEERING_WORKFLOW.md` STEP 4 |
| ROLLBACK | `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `OPERATING_MANUAL.md` Step 3 |
| Trust Check | `ENGINEERING_WORKFLOW.md` STEP 5; `RISK_AND_SCOPE_STANDARD.md` § 3 |
| Scope Lock | `RISK_AND_SCOPE_STANDARD.md` § 2; `ENGINEERING_WORKFLOW.md` STEP 5 |
| Data Impact / Definition of Done / Architecture Compliance | `ENGINEERING_WORKFLOW.md` STEP 5 |
| DOCUMENTATION (report destinations) | `docs/architecture/REPOSITORY_CONVENTIONS.md` §§ 3–5 |
| GOVERNING ARCHITECTURE / drift | `docs/architecture/README.md` Architecture Bootstrap |
| COMPLIANCE → AI work | `ENGINEERING_WORKFLOW.md` AI ARCHITECTURE COMPLIANCE |

Four of these are not merely restatements but **substantive divergences** (risk
boundaries, Trust Check definition, Scope Lock content, rollback form). Detail and
recommended resolution were reported to the user in full.

---

## Next action

**Awaiting the Home Owner's decision** between the three resolutions offered:

- **A** — install V4 at `docs/architecture/ai-operating-model.md` as an
  *assembly document* in the `UIOWN1` / Brand Constitution mould: cite each owner,
  restate none, and reconcile the four divergences at their owners first.
- **B** — install at `.engineering/AI_OPERATING_MODEL.md` (Engineering Governance
  layer, matching the four-layer model), and reconcile the same four divergences.
- **C** — proceed verbatim as briefed, accepting the recorded duplicate ownership
  as a governed exception logged in `.engineering/GOVERNANCE_EXCEPTIONS.md`.

Do not begin implementation until the decision is recorded.

---

## Files changed this session

None.
