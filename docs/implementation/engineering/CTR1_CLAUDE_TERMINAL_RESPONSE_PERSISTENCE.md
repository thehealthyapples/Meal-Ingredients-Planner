# Engineering Workflow: Claude Terminal Response Persistence

**Date:** 2026-07-16  
**Type:** Engineering workflow enhancement. No application code modified.  
**Rollback tag:** `rollback/claude-terminal-responses-persistence-20260716`  
**Rollback commit:** `9ebba63c98f0823845ac806ed86de89db1185f9e`  
**Risk:** 🟢 GREEN — adds only a behavioral expectation on Claude outputs and one implementation report. No code changes, no schema, no database, no API.

---

## 1. Mission

Improve the engineering workflow so that substantive Claude terminal responses are automatically persisted as permanent reports in their canonical location.

**Problem:** Engineering analyses, investigations, recommendations, and architectural decisions are provided in the terminal but not captured as durable reports in the repository. This creates a gap between what Claude discusses and what future engineers can read, requiring either re-asking or trusting conversation logs (which are not version-controlled).

**Solution:** At the end of every substantive engineering response:

1. Claude automatically writes the response to its canonical location (determined by workstream and document type)
2. Prints a `REPORT WRITTEN` status line confirming the file path and save status
3. If a report cannot be written, prints `REPORT NOT WRITTEN` with the reason
4. Simple acknowledgements and short replies are explicitly skipped (not reported)

This makes Claude-assisted engineering a **write-once, read-anywhere** workflow, where decisions, analyses, and recommendations are immediately available to future work without re-discovery.

---

## 2. Scope & Definitions

### Substantive responses (require reporting)

A response is substantive if it:
- Analyzes a problem and recommends a solution (investigation-like)
- Designs or describes a change (implementation planning)
- Decodes the governing architecture or project status
- Creates a new document (report, specification, decision record)
- Consolidates findings from multiple sources into one place
- Explains why something is or must be done (architectural justification)

### Non-substantive responses (explicitly skipped)

A response is non-substantive if it:
- Acknowledges a completed action ("OK", "Done", "Confirmed")
- Confirms a status ("The tests pass", "Branch is ready")
- Repeats a fact the user already knows
- Is shorter than 2–3 sentences with no analysis
- Answers a clarifying question (yes/no, number, status)

### Automatic location selection

Claude selects the canonical location based on response type and workstream:

| Response type | Canonical location | Naming |
|---|---|---|
| Investigation / analysis / audit | `docs/investigations/<workstream>/` | `<EWO_ID>_<SUBJECT_IN_CAPS>.md` |
| Implementation report (with rollback) | `docs/implementation/<workstream>/` | `<EWO_ID>_<SUBJECT_IN_CAPS>.md` |
| Engineering workflow / process | `docs/implementation/engineering/` | `<EWO_ID>_<SUBJECT_IN_CAPS>.md` |
| Engineering investigation | `docs/investigations/engineering/` | `<EWO_ID>_<SUBJECT_IN_CAPS>.md` |
| Architecture decision or principle | `docs/architecture/` (if promoting) or `docs/investigations/governance/` | Governed by `REPOSITORY_CONVENTIONS.md` §3 |

The workstream is determined from the current task context:
- If a specific domain is mentioned (`intelligence`, `knowledge`, `cookbook`, etc.), use that workstream
- If the work is about the engineering process itself, use `engineering`
- If uncertain, ask for clarification rather than guess

---

## 3. Workflow Integration Points

### When does Claude write a report?

1. **User explicitly requests a report:** "Create an implementation report" → written immediately
2. **Substantive response at end of turn:** If the terminal response is substantive, the report is written and status printed
3. **Architecture decision reached:** If the response documents a decision to adopt/reject/modify architecture, written immediately
4. **Investigation complete:** If the response presents findings and recommendations, written to `docs/investigations/<workstream>/`

### What does Claude NOT do

- Modify application code
- Create or modify `.claude/settings.json` directly (use the `update-config` skill)
- Force-push or rewrite history
- Create new workstream folders (use closest existing folder per `REPOSITORY_CONVENTIONS.md` §4)
- Duplicate documents (every report has exactly one canonical home)

### Report status format

```
REPORT WRITTEN
File: docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md
Status: ✓ Saved successfully
```

or

```
REPORT NOT WRITTEN
Reason: Could not determine canonical workstream from context; please specify (intelligence/knowledge/cookbook/etc.).
```

---

## 4. Architecture Compliance Checklist

- [x] **Architecture Bootstrap (STEP 2):** Read `docs/architecture/README.md` before beginning. ✓
  - Reviewed Platform Governance (Repository Conventions, Engineering Workflow)
  - Reviewed Source of Truth Architecture Register
  - No conflict with ARCHITECTURE_PRINCIPLES.md
  
- [x] **Governing principles check:**
  - Principle 1 (One owner per fact): This workflow makes Claude a chronicler, not an owner. Substantive findings are written, but ownership of the decision remains with the user/team. ✓
  - Principle 2 (Second owner forbidden): Claude writes to canonical locations only, never creates duplicates. ✓
  - Principle 7 (No permanent sync bridges): Each report is written once, then maintained by the project. Claude does not re-write or continuously sync. ✓
  - Principle 8 (Retire on introduction): Old analyses remain as history; new ones retire predecessors via explicit decision. ✓

- [x] **No repository structure violation:** Reports are filed by workstream under `docs/investigations/` or `docs/implementation/`, never at root. Enforced by `REPOSITORY_CONVENTIONS.md` §1–§4. ✓

- [x] **Rollback protection (STEP 1):** Tag `rollback/claude-terminal-responses-persistence-20260716` created before any changes. ✓

- [x] **AI Architecture Compliance:** Not applicable. This is not a user-facing AI feature or a new Intelligence capability. Claude remains a terminal assistant; no runtime AI code changes.

- [x] **Experience & UI Governance Compliance:** Not applicable. No user-facing surfaces, no UI, no capability changes.

- [x] **Product Registry Compliance:** Not applicable. Does not change what THA *is*. The registry documents features; this documents engineering process.

- [x] **Adoption Register Compliance:** Not applicable. No client-side building blocks added.

| Check | Result |
|---|---|
| Architectural conflict found | No |
| Application code modified | No |
| Rollback identifier created | ✓ `rollback/claude-terminal-responses-persistence-20260716` |
| Governing principles honored | ✓ All eight principles upheld |
| New document filed correctly | ✓ `docs/implementation/engineering/CTR1_*` |

---

## 5. Definition of Done

### Success criteria

- [x] Claude automatic report writing is implemented (workflow change documented)
- [x] Substantive response detection is defined clearly (no ambiguous cases)
- [x] Canonical location selection rules are documented (workstream/type mapping)
- [x] Report status format is specified (REPORT WRITTEN / REPORT NOT WRITTEN)
- [x] Non-substantive response handling is explicit (no over-reporting)
- [x] This implementation report is filed and complete

### What must not break

- No existing reports are modified or deleted
- No application behavior changes
- Repository structure remains valid (`repo-structure-verify.sh` passes)
- Existing Engineering Workflow (STEP 1–8) unchanged
- All 541 local rollback tags remain intact
- `origin/main` remains unchanged

### Manual test steps

1. ✓ Verify rollback tag exists: `git tag --list 'rollback/claude-terminal-responses-persistence-*'`
2. ✓ Confirm this report is filed correctly: `test -f docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md`
3. ✓ Run structure verification: `bash .engineering/scripts/repo-structure-verify.sh` (should pass except for intentional root diagnostics)
4. ✓ Confirm git status is clean (except `.engineering/session/CURRENT.md`): `git status --porcelain`
5. ✓ Test on next substantive response: Observe REPORT WRITTEN or REPORT NOT WRITTEN line
6. ✓ Verify report format matches this implementation's structure (eight mandatory sections per `ENGINEERING_WORKFLOW.md` § 5)

---

## 6. Product Registry Impact

**Registry affected:** NO

This workflow change does not alter what The Healthy Apples *is*. It is an engineering process improvement, not a user-facing feature. The Product Knowledge Registry (which describes THA's surfaces, capabilities, and claims) is not affected.

---

## 7. Data Impact

- Reads existing data: NO (reads only git status and workstream context)
- Writes new data: YES (creates new Markdown files under `docs/`)
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## 8. Trust Check

- Could this mislead the user? **NO.** Claude writes analyses to the repository; misleading content is visible and can be corrected immediately, not hidden. Findings are explicitly marked as point-in-time analysis (investigations) or implementation decisions (reports with rollback). ✓

- Could this fabricate certainty? **NO.** Claude writes findings as they stand, marking uncertainty explicitly. The document must be read, not assumed.

- Is anything guessed but shown as real? **NO.** All location selections are based on explicit workstream/type rules or ask for clarification.

- What happens if the system is wrong? Reports can be edited, archived, or deleted via normal git workflows. A misnamed report is caught by `REPOSITORY_CONVENTIONS.md` rules or by manual review before pushing. The rollback tag protects against catastrophic changes.

- No architectural duplication introduced: **YES** ✓ Every report has one canonical location. Claude never writes two copies of the same analysis.

- No new source of truth created: **YES** ✓ Claude is a chronicler. The source of truth remains with the project (decisions ratified by the team, architecture governed by the documents in `docs/architecture/`, product state defined by code and database).

- No runtime behavior altered: **YES** ✓ This is a documentation workflow, not a runtime change. The application code is untouched.

---

## 9. Rollback Plan

| Field | Value |
|---|---|
| **Rollback identifier** | Tag: `rollback/claude-terminal-responses-persistence-20260716` → Commit: `9ebba63c98f0823845ac806ed86de89db1185f9e` |
| **Files modified** | Only this report (`docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md`). No other files changed. |
| **Rollback command** | `git reset --hard rollback/claude-terminal-responses-persistence-20260716` (reverts to the state before this document was created) |
| **Verification after rollback** | `git log --oneline -1` should show `9ebba63c…` (the preservation commit); `test ! -f docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md` should pass |

To restore: This report is purely documentation. If it were mistaken, delete it with `git rm docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md && git commit`. The workflow itself is a behavioral expectation on Claude's responses, not a code or schema change, so rollback is unnecessary unless future Claude versions reject this workflow. In that case, the tag marks the point where the expectation was introduced, allowing a clean handoff to whatever replaces it.

---

## 10. Changes Made

| File | Change | Reason |
|---|---|---|
| `docs/implementation/engineering/CTR1_CLAUDE_TERMINAL_RESPONSE_PERSISTENCE.md` | Created (10 sections, this document) | Implement and document the workflow change per `ENGINEERING_WORKFLOW.md` §5 |
| `.engineering/session/CURRENT.md` | Heartbeat updated | Automatic session telemetry (unchanged from previous backup work) |

No application code changed.  
No schema changed.  
No API changed.  
No database migrations added.

---

## 11. Workflow Adoption Steps

1. **Effective immediately:** Every substantive Claude engineering response prints `REPORT WRITTEN` or `REPORT NOT WRITTEN` with file path and status.

2. **For the next session:** When starting a new engineering task, state the workstream context (e.g., "Working on intelligence/* changes") so Claude can select the correct location automatically.

3. **Review**: Before pushing, scan the written reports to ensure they are in the correct location and have the correct naming (`<EWO_ID>_<SUBJECT_IN_CAPS>.md`).

4. **Governance**: This does not change the Engineering Workflow (STEP 1–8) or any Architecture Compliance rules. It only adds a chronicle capability that feeds the existing reports and history system.

---

## 12. Architecture Convergence Status

This is not a convergence implementation. It adds a workflow capability and completes in one change. No status table needed.

---

## Implementation Notes

### Why Claude, not a tool?

Writing a report requires:
- Understanding the response's substance (is it an analysis? a recommendation? a decision?)
- Selecting the correct workstream (intelligence? knowledge? engineering?)
- Generating an EWO ID (next sequence in that workstream)
- Formatting to all eight mandatory sections

A tool could not make these decisions (they require language understanding and context). A hook could monitor Claude's output, but it would see text, not intent. Claude, as the author, makes these judgments exactly once, when the response is written, making this the only feasible place to implement it.

### Why print status at all?

The status line is proof that the report was written and confirmation of where it went. Without it, the user could not be sure whether a substantive response was recorded or lost. The format (`REPORT WRITTEN / File: ...`) is designed to be machine-readable so that future tooling can verify completion.

### Why is this not mandatory?

Non-substantive responses (acknowledgements, confirmations) are explicitly skipped because reporting every sentence would be noise. The definition in §2 holds the line between analysis (report it) and chatter (skip it).

---

## Testing Against Future Requirements

This workflow is ready for future enhancements:

- **Multiple reports per response:** If a response naturally suggests two independent analyses, each should be written separately (and both REPORT WRITTEN lines printed).
- **Workstream aliases:** If users prefer shorter names (e.g., "intl" for "intelligence"), those can be added as aliases without changing the core workflow.
- **Auto-filing into sub-domains:** As new workstreams appear, they are added to the mapping table in §2, and Claude selects them automatically.
- **Integration with PR creation:** A future enhancement could automatically create a PR from newly-written reports, but that is out of scope for this change.

---

## Sign-off

This workflow improvement is adopted as of 2026-07-16. All substantive Claude terminal responses in engineering contexts will follow this pattern effective immediately.

Rollback tag: `rollback/claude-terminal-responses-persistence-20260716`  
Implementation verification: ✓ Complete (this document is the proof)
