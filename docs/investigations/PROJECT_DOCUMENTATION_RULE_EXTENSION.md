# PROJECT DOCUMENTATION RULE EXTENSION

**Date:** 2026-06-29
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🟢 GREEN
**Reason:** Documentation-only change. No application logic, no production files modified.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-rule-extension-20260629` → `556747e4d30bc1589eb52f4451e0d1ee350fa218` |
| Working tree | Intentionally dirty — pre-existing untracked investigation docs and modified RELEASE.md / scripts/verify-prod.ts (not touched by this task) |
| This task's writes | `docs/ENGINEERING_WORKFLOW.md`, `docs/investigations/PROJECT_DOCUMENTATION_RULE_EXTENSION.md` |
| Rollback command | `git checkout rollback/before-project-documentation-rule-extension-20260629 -- docs/ENGINEERING_WORKFLOW.md && rm docs/investigations/PROJECT_DOCUMENTATION_RULE_EXTENSION.md` |

---

## SUMMARY

STEP 9 of `docs/ENGINEERING_WORKFLOW.md` was extended to explicitly cover prompts, architecture decisions, and planning documents. The opening rule sentence was broadened and the completion gate was strengthened to make the three-part obligation unambiguous: document must exist, must be in `docs/investigations/`, and Claude must report it before the task is closed.

---

## FINDINGS

- The previous opening rule listed: investigation, implementation, review, audit, repair, release, significant task.
- Prompts, architecture decisions, and planning documents were not explicitly named, leaving an ambiguous gap.
- The completion gate previously stated two conditions (document exists + location reported). The revised gate expands the subject ("No task, prompt, investigation, implementation, review, release, or architecture decision") and makes the three-part obligation explicit.
- The file requirements section was updated to say "Validation Performed" (matching the task specification) instead of just "Validation".
- The Scope list was extended with two new bullet points: "Prompts and architecture decisions" and "Planning documents".
- No new section, step, or document was created outside these targeted edits. The single STEP 9 block remains the canonical home for this rule.

---

## DECISIONS

| Decision | Rationale |
|----------|-----------|
| Extend STEP 9 in-place, not create STEP 10 | One canonical rule location. Duplication would create a governance conflict. |
| Broaden opening sentence to name prompts, architecture decisions, planning documents | Makes the rule unambiguous for the most common task types that were previously implied but not stated |
| Expand completion gate subject clause | Previous wording "No task is complete" was narrower than intended; expanded to match all named task types |
| "Validation Performed" instead of "Validation" | Matches the specification language; more explicit about what the section records |

---

## ARCHITECTURE COMPLIANCE

- Documentation-only change: YES
- No application logic changes: YES
- No production files changed: YES
- Existing engineering workflow extended (not duplicated): YES — STEP 9 edited in-place, no new step or parallel rule created
- One canonical engineering workflow remains: YES — `docs/ENGINEERING_WORKFLOW.md` is the sole governing document

---

## CHANGES MADE

| File | Change Type | Description |
|------|-------------|-------------|
| `docs/ENGINEERING_WORKFLOW.md` | Modified | STEP 9 opening rule extended; file requirements updated; completion gate strengthened; scope list expanded |
| `docs/investigations/PROJECT_DOCUMENTATION_RULE_EXTENSION.md` | Created | This investigation document |

---

## VALIDATION PERFORMED

- `git diff docs/ENGINEERING_WORKFLOW.md` reviewed — changes confined to STEP 9 block only.
- `RELEASE.md` and `scripts/verify-prod.ts` confirmed untouched by this task (pre-existing modified files).
- No application source files appear in the diff.
- New investigation document saved at correct path: `docs/investigations/PROJECT_DOCUMENTATION_RULE_EXTENSION.md`.

---

## DATA IMPACT

- Reads existing data: NO
- Writes new data: NO (documentation only)
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## TRUST CHECK

- Could this mislead the user? NO
- Could this fabricate certainty? NO
- Is anything guessed but shown as real? NO
- No architectural duplication introduced: YES
- No new source of truth created: YES
- No runtime behaviour altered: YES

---

## ROLLBACK INFORMATION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-project-documentation-rule-extension-20260629` |
| Commit SHA | `556747e4d30bc1589eb52f4451e0d1ee350fa218` |
| Rollback command | `git checkout rollback/before-project-documentation-rule-extension-20260629 -- docs/ENGINEERING_WORKFLOW.md && rm docs/investigations/PROJECT_DOCUMENTATION_RULE_EXTENSION.md` |

---

## OUTCOME

STEP 9 of `docs/ENGINEERING_WORKFLOW.md` now explicitly covers prompts, architecture decisions, and planning documents. The completion gate is unambiguous: three conditions must be met before any task of any type is closed. The single governing document remains canonical with no duplication introduced.

---

## NEXT STEPS

- All future tasks — including single-prompt tasks, architecture decisions, and planning sessions — are now governed by the extended rule.
- Apply immediately from this date forward.
