# THA ENGINEERING WORKFLOW — Architecture Convergence Status

**Date:** 2026-06-25
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🟢 GREEN
**Reason:** Documentation and governance enhancement only. No production behaviour changes. No runtime modified. No schema changed.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/pre-convergence-status-governance-20260625` → `a8a912a4ba923e756992ed7b51e92d89ff4a7171` |
| Working tree | Intentionally dirty — active workstream changes in progress on this branch |
| This task's writes | `docs/ENGINEERING_WORKFLOW.md`, `docs/investigations/engineering/THA_ENGINEERING_WORKFLOW_ARCHITECTURE_CONVERGENCE_STATUS.md` |
| Rollback command | `git checkout rollback/pre-convergence-status-governance-20260625 -- docs/ENGINEERING_WORKFLOW.md` |
| Full rollback | `git checkout rollback/pre-convergence-status-governance-20260625` |

---

## REFERENCE DOCUMENTS READ

- [x] docs/ENGINEERING_WORKFLOW.md
- [x] docs/ARCHITECTURE_PRINCIPLES.md (tag reference confirmed)
- [x] docs/investigations/governance/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md (referenced in new guidance)

---

## OBJECTIVE

Extend the THA Engineering Workflow so every future architectural (🔴 RED) implementation reports the convergence state of the domain being worked on.

This is a governance enhancement. It does not change application behaviour, runtime, or schemas.

---

## WORKFLOW CHANGES

### What was added to `docs/ENGINEERING_WORKFLOW.md`

**1. Architecture Convergence Status — added to STEP 5 (Mandatory Sections)**

Added a new mandatory section entry for `Architecture Convergence Status` in STEP 5, immediately before `Scope Lock`. This section is mandatory for all 🔴 RED architectural implementations and provides a summary table of the ten required fields.

**2. New STEP 8 — Architecture Convergence Status**

Inserted as a new step between the existing Trust and Claims Hard Stops (now STEP 7) and the Architecture Compliance Checklist. Contains:

- Purpose statement
- Full required-fields block with explanatory notes for each field
- Convergence Percentage Rules (five explicit rules)
- A worked example for the Food Intelligence domain

**3. Implementation Template updated**

Added a full `ARCHITECTURE CONVERGENCE STATUS` block to the Implementation Template, with the ten required fields and inline prompts for each. This ensures every new workstream document generated from the template includes the section automatically.

---

## TEMPLATE UPDATES

The Implementation Template in `docs/ENGINEERING_WORKFLOW.md` now includes:

```
## ARCHITECTURE CONVERGENCE STATUS

*(Mandatory for 🔴 RED implementations. See STEP 8 in docs/ENGINEERING_WORKFLOW.md for guidance and rules.)*

[ten-field block with prompts]
```

This section appears between `DOMAIN IMPACT` and `IMPLEMENTATION` so it is completed before implementation work begins.

---

## VERIFICATION

✓ Engineering Workflow updated — `docs/ENGINEERING_WORKFLOW.md` modified with STEP 8 and template section

✓ Template updated — Implementation Template now includes Architecture Convergence Status block

✓ Future architecture prompts — any 🔴 RED workstream using the template will include this section

✓ Existing implementations remain valid — no retroactive changes required; this is forward-only governance

---

## DEFINITION OF DONE

✓ Architecture Convergence Status section added to Engineering Workflow (STEP 8)

✓ Future implementation template updated (section added between DOMAIN IMPACT and IMPLEMENTATION)

✓ Governance documentation updated (this file)

✓ Project file created at `docs/investigations/engineering/THA_ENGINEERING_WORKFLOW_ARCHITECTURE_CONVERGENCE_STATUS.md`

---

## DATA IMPACT

- Reads existing data: NO
- Writes new data: NO
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## TRUST CHECK

- No architectural behaviour changed: YES
- No runtime changed: YES
- No schema changed: YES
- Only governance documentation updated: YES
- No permanent synchronisation bridge introduced: YES
- No new source of truth created: YES

---

## ROLLBACK INSTRUCTIONS

To undo only this governance change (restore ENGINEERING_WORKFLOW.md to its pre-change state):

```bash
git checkout rollback/pre-convergence-status-governance-20260625 -- docs/ENGINEERING_WORKFLOW.md
```

To undo only this project file:

```bash
rm docs/investigations/engineering/THA_ENGINEERING_WORKFLOW_ARCHITECTURE_CONVERGENCE_STATUS.md
```

To perform a full rollback of the branch to the pre-change state:

```bash
git checkout rollback/pre-convergence-status-governance-20260625
```

---

## SCOPE LOCK

**Implemented scope:**
- Added Architecture Convergence Status section to ENGINEERING_WORKFLOW.md (STEP 5 entry + STEP 8 full guidance)
- Added Architecture Convergence Status block to the Implementation Template
- Created this project file

**Explicitly excluded scope:**
- No application code modified
- No runtime modified
- No schema modified
- No existing architecture altered
- No retroactive updates to existing investigation documents
- No changes to ARCHITECTURE_PRINCIPLES.md or THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md

**Suggestions (do not implement without approval):**
- A future workstream could audit existing RED implementation documents and backfill the Architecture Convergence Status section retrospectively. This would provide a historical baseline but is out of scope here.
