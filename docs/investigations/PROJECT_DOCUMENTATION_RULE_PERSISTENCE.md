# PROJECT DOCUMENTATION RULE PERSISTENCE

**Date:** 2026-06-29
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🟢 GREEN
**Reason:** Documentation-only change. No application logic, no production files modified.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-rule-20260629` → `556747e4d30bc1589eb52f4451e0d1ee350fa218` |
| Working tree | Intentionally dirty — pre-existing untracked investigation docs and modified RELEASE.md / scripts/verify-prod.ts (not touched by this task) |
| This task's writes | `docs/ENGINEERING_WORKFLOW.md`, `docs/investigations/PROJECT_DOCUMENTATION_RULE_PERSISTENCE.md` |
| Rollback command | `git checkout rollback/before-project-documentation-rule-20260629 -- docs/ENGINEERING_WORKFLOW.md` |

---

## SUMMARY

A standing rule requiring mandatory project documentation was added to the THA governing instructions file (`docs/ENGINEERING_WORKFLOW.md`). The rule mandates that every investigation, implementation, review, audit, repair, release, or significant task must produce a corresponding Markdown document saved under `docs/investigations/`, and that no task is considered complete until that document exists and its location has been reported to the user.

---

## FINDINGS

- The governing instructions file for THA tasks is `docs/ENGINEERING_WORKFLOW.md`.
- No CLAUDE.md file exists in the workspace root; `docs/ENGINEERING_WORKFLOW.md` is the canonical operating instructions document (referenced as governing document throughout the project).
- The rule was added as **STEP 9 — MANDATORY PROJECT DOCUMENTATION** at the end of the workflow, immediately before the CHANGE CONTROL section.
- The existing workflow already had steps 1–8 (ROLLBACK PROTECTION through ARCHITECTURE CONVERGENCE STATUS). Step 9 extends this naturally.

---

## DECISIONS

| Decision | Rationale |
|----------|-----------|
| Add as STEP 9 in ENGINEERING_WORKFLOW.md | This is the single governing instructions file for THA; adding the rule here ensures it applies to all future tasks |
| Placed before CHANGE CONTROL footer | Maintains logical ordering — all numbered steps appear before the closing change-control note |
| File naming convention: SCREAMING_SNAKE_CASE.md | Consistent with existing investigation documents in `docs/investigations/` |

---

## ARCHITECTURE COMPLIANCE

- No application code changed.
- No production files changed.
- No database or runtime behaviour altered.
- Change is limited to: one documentation/instruction file updated, one new investigation document created.

---

## CHANGES MADE

| File | Change Type | Description |
|------|-------------|-------------|
| `docs/ENGINEERING_WORKFLOW.md` | Modified | Added STEP 9 — MANDATORY PROJECT DOCUMENTATION rule |
| `docs/investigations/PROJECT_DOCUMENTATION_RULE_PERSISTENCE.md` | Created | This investigation document |

---

## VALIDATION

**Rule added to correct file:** `docs/ENGINEERING_WORKFLOW.md` — the THA governing instructions document. Confirmed by reading the file and verifying STEP 9 is present.

**No application code changed:** git diff is limited to `docs/ENGINEERING_WORKFLOW.md` (documentation) and the new `docs/investigations/PROJECT_DOCUMENTATION_RULE_PERSISTENCE.md`.

**No production files changed:** `RELEASE.md` and `scripts/verify-prod.ts` (pre-existing modified files) were not touched by this task.

**Git diff scope:** Documentation and instruction files only.

---

## DATA IMPACT

- Reads existing data: NO
- Writes new data: NO (documentation only)
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## TRUST CHECK

- Could this mislead the user? NO — rule is clear and explicit
- Could this fabricate certainty? NO
- Is anything guessed but shown as real? NO
- No architectural duplication introduced: YES
- No new source of truth created: YES
- No runtime behaviour altered: YES

---

## ROLLBACK INFORMATION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-rule-20260629` |
| Commit SHA | `556747e4d30bc1589eb52f4451e0d1ee350fa218` |
| Rollback command | `git checkout rollback/before-project-documentation-rule-20260629 -- docs/ENGINEERING_WORKFLOW.md && rm docs/investigations/PROJECT_DOCUMENTATION_RULE_PERSISTENCE.md` |

---

## OUTCOME

The mandatory project documentation rule is now persisted in `docs/ENGINEERING_WORKFLOW.md` as STEP 9. All future THA tasks are governed by this rule from this date forward.

---

## NEXT STEPS

- Apply the rule to all future tasks without exception.
- When any task is declared complete, confirm `docs/investigations/<filename>.md` exists and report its location.
