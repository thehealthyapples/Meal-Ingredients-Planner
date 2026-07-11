<!-- Copy this file. Canonical home of the THA implementation report shape. -->
<!-- Relocated here from docs/architecture/ENGINEERING_WORKFLOW.md under EOM1 (2026-07-10). -->

# [WORKSTREAM NAME] — Implementation

**Date:** YYYY-MM-DD
**Branch:** [branch name]
**Risk:** 🟢 GREEN / 🟡 AMBER / 🔴 RED
**Reason:** [one sentence explaining the risk level]

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Working tree | Clean / Intentionally dirty — [reason, and what the tag does NOT cover] |
| This task's writes | [files changed] |
| Rollback to committed state | `git checkout rollback/[name]-[YYYYMMDD]` |

> A tag protects committed state only. If the tree was dirty, state explicitly
> what is not captured.

---

## REFERENCE DOCUMENTS READ

- [ ] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [ ] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [ ] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [ ] [any workstream-specific documents]

---

## ARCHITECTURE COMPLIANCE CHECKLIST

[Copy and complete the checklist from `docs/architecture/ENGINEERING_WORKFLOW.md`.]

---

## AI ARCHITECTURE COMPLIANCE

*(AI-related implementations only. Copy the block from `docs/architecture/ENGINEERING_WORKFLOW.md`.)*

---

## PRODUCT REGISTRY COMPLIANCE

*(User-facing implementations only. Copy the block from `docs/architecture/ENGINEERING_WORKFLOW.md`.)*

---

## PRODUCT REGISTRY IMPACT

*(Mandatory for every user-facing implementation. Added under `PKR2` (2026-07-11).
Governed by `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`.)*

The test is one question: **would a person's answer to "what is THA?" be different
after this change?** If yes, the Product Knowledge Registry is stale until updated —
and updating it belongs to *this* change, not a follow-up ticket. The registry is
read by the Companion, so a stale entry is not a documentation defect; it is the
product telling a household something false in its own voice.

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: YES / NO        (if unsure, it is YES)

Entries created:   [id — name — visibility — owner]   or NONE
Entries updated:   [id — what changed]                or NONE
Entries retired:   [id — replaced by]                 or NONE

Any entry set to `public` or `household`: [justify each]  or N/A
  Restrictive labels need no defence. Permissive ones do.

Product knowledge written into a prompt, template, fallback
string, fine-tune, or capability code: MUST BE NO   (Rule PKR27)
```

---

## DOMAIN IMPACT

[Copy and complete the Domain Impact Declaration from `docs/architecture/ENGINEERING_WORKFLOW.md`.]

---

## ARCHITECTURE CONVERGENCE STATUS

*(Mandatory for 🔴 RED implementations. See STEP 8 of `docs/architecture/ENGINEERING_WORKFLOW.md`.)*

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:                      [name]
Current Canonical Owner:     [file path or DB table]
Current Runtime Consumer(s): [list each consumer]
Duplicate Owners Remaining:  [list or NONE]
Duplicate State Remaining:   [list or NONE]
Duplicate Workflows Remaining: [list or NONE]
Current Convergence (%):     [X% — cite evidence: N of M attributes/files/workflows converged]
Target Convergence (%):      [target for this workstream]
Next Planned Milestone:      [milestone or N/A]
Remaining Architectural Risks: [list or NONE]
```

---

## IMPLEMENTATION

[What was built. Files created, modified, deleted — with counts.]

---

## DEFINITION OF DONE

- What success looks like
- What must not break
- Manual test steps

---

## VALIDATION PERFORMED

[Commands that actually ran, and their outcome. Tests, build, verification
scripts. Distinguish failures introduced by this work from pre-existing ones —
compare against the rollback tag if unsure. If the build was not run, say so and
say why.]

---

## DATA IMPACT

- Reads existing data: YES / NO
- Writes new data: YES / NO
- Changes meaning of existing data: YES / NO
- Requires backfill: YES / NO

---

## TRUST CHECK

- Could this mislead the user?
- Could this fabricate certainty?
- Is anything guessed but shown as real?
- What happens if the system is wrong?
- No architectural duplication introduced: YES / NO
- No new source of truth created: YES / NO
- No runtime behaviour altered (for governance-only work): YES / NO
- Every "verified" claim backed by a command that ran: YES / NO

---

## ROLLBACK PLAN

- Rollback identifier (tag name + commit SHA)
- Files modified
- Rollback commands
- Verification steps after rollback

---

## SCOPE LOCK

- **Implemented scope:** […]
- **Explicitly excluded scope:** [name what is NOT being done]

SUGGESTION:
[Any out-of-scope observations — do not implement without approval]

---

## OUTCOME

[One paragraph: what is now true that was not true before.]

## NEXT STEPS

[What remains, and what needs approval — including whether anything is
uncommitted, unpushed, or awaiting deployment approval.]
