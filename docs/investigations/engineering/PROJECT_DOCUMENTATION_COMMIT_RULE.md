# PROJECT DOCUMENTATION COMMIT RULE

**Date:** 2026-06-30
**Branch:** main
**Risk:** 🟢 GREEN
**Reason:** Documentation-only governance extension. No application code changed.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-commit-rule-20260630` → `25b4ea12424f8aa1242714e582ab1b57ebbedf4a` |
| Working tree | Clean at time of change (untracked investigation files only) |
| This task's writes | `docs/ENGINEERING_WORKFLOW.md`, `docs/investigations/engineering/PROJECT_DOCUMENTATION_COMMIT_RULE.md` |
| Rollback command | `git checkout rollback/before-project-documentation-commit-rule-20260630 -- docs/ENGINEERING_WORKFLOW.md` |

---

## SUMMARY

This document records the extension of the Mandatory Project Documentation rule (Step 9) in `docs/ENGINEERING_WORKFLOW.md`.

The existing rule required every engineering task to produce a project document saved under `docs/investigations/`. This extension strengthens the completion gate by requiring that the document also be **staged and committed locally** before the task is considered complete.

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity keys are affected. Documentation files only.

☑ One owner per fact
  The single source of truth for engineering workflow rules remains
  docs/ENGINEERING_WORKFLOW.md. No new source of truth created.

☑ No duplicate entities
  This extends the existing Step 9 rule. No new rule section created.

☑ No duplicate ownership
  docs/ENGINEERING_WORKFLOW.md remains the sole governance document.

☑ No duplicate state
  No user or application state affected.

☑ Extends existing architecture
  Step 9 (Mandatory Project Documentation) is extended in-place.
  No parallel rule created.

☑ Progressive enrichment where appropriate
  Not applicable — governance document, not a knowledge entity.

☑ Honest gaps over fabricated information
  Not applicable — no knowledge claims.

☑ No permanent synchronisation bridge
  Not applicable — documentation only.

☑ Evolution over replacement
  The existing Step 9 completion gate is replaced with a strengthened
  version in the same location. No prior text is preserved alongside
  the new text (no duplication).
```

---

## CHANGES MADE

### `docs/ENGINEERING_WORKFLOW.md` — Step 9 Completion Gate

**Replaced:** The prior completion gate required only that the file be created and Claude report `Project File Created:`.

**Extended with:**
1. Git staging is mandatory.
2. Local commit is mandatory.
3. Claude must report: Project File Created, Git Commit SHA, Current Branch, Rollback Identifier.
4. Explicit clarification that pushing to GitHub is governed by the release workflow and is NOT automatically required.
5. Clarification that the documentation commit may be included in a later feature or release push.

### `docs/investigations/engineering/PROJECT_DOCUMENTATION_COMMIT_RULE.md`

Created this document as the project record for this governance update, satisfying the rule being introduced.

---

## VALIDATION PERFORMED

- Confirmed `docs/ENGINEERING_WORKFLOW.md` is the single engineering workflow document.
- Confirmed no duplicate documentation rule files were created.
- Confirmed no application code was touched.
- Confirmed `git diff` is limited to documentation files.
- Confirmed the updated Step 9 is an extension of the existing rule, not a replacement with a new section.

---

## DEFINITION OF DONE

- Rule successfully updated in `docs/ENGINEERING_WORKFLOW.md`.
- No application code changed.
- Git diff limited to documentation.
- Existing workflow remains the single source of truth.
- This project file committed alongside the workflow update.

---

## DATA IMPACT

- Reads existing data: NO
- Writes new data: NO (documentation only)
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## TRUST CHECK

- Could this mislead the user? NO — the rule is explicit and mandatory.
- Could this fabricate certainty? NO.
- Is anything guessed but shown as real? NO.
- What happens if the system is wrong? The rule is a governance policy; deviation is observable in git history.
- No architectural duplication introduced: YES
- No new source of truth created: YES
- No runtime behaviour altered: YES

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-commit-rule-20260630` |
| Tag points to | `25b4ea12424f8aa1242714e582ab1b57ebbedf4a` |
| Files modified | `docs/ENGINEERING_WORKFLOW.md`, `docs/investigations/engineering/PROJECT_DOCUMENTATION_COMMIT_RULE.md` |
| Rollback command | `git checkout rollback/before-project-documentation-commit-rule-20260630 -- docs/ENGINEERING_WORKFLOW.md && git rm docs/investigations/engineering/PROJECT_DOCUMENTATION_COMMIT_RULE.md` |
| Verification | Confirm Step 9 Completion Gate shows only `Project File Created:` requirement |

---

## SCOPE LOCK

**Implemented scope:**
- Extended Step 9 Completion Gate in `docs/ENGINEERING_WORKFLOW.md` to require git staging and local commit.
- Created this project document.

**Explicitly excluded scope:**
- No application code changes.
- No deployment.
- No push to GitHub remote.
- No changes to any other workflow or governance document.
- No changes to `docs/change-control.md`.
- No changes to `docs/ARCHITECTURE_PRINCIPLES.md`.

**Suggestions (do not implement without approval):**
- The eleven untracked investigation files visible in `git status` could be committed in a follow-up to bring the repo into compliance with the newly strengthened rule.
