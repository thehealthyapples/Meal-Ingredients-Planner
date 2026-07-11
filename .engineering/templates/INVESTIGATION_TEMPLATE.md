<!-- Copy this file. An investigation ANALYSES and RECOMMENDS. It changes nothing. -->

# [EWO_ID] — [Subject] — Investigation

**Date:** YYYY-MM-DD
**Branch:** [branch name]
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only investigation)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Working tree | Clean / Intentionally dirty — [reason] |

> An investigation still takes rollback protection. It may create documents, and
> it may be interrupted.

---

## REFERENCE DOCUMENTS READ

- [ ] `docs/architecture/README.md`
- [ ] [governing documents relevant to the question]

---

## QUESTION

[The single question this investigation answers. If you cannot state it in one
sentence, the scope is wrong.]

---

## METHOD

[How the question was investigated: which files were read, which commands were
run, what was measured. A reader must be able to reproduce the findings.]

---

## FINDINGS

[What is true. Each finding cites its evidence — a file path and line, or the
output of a command. Distinguish:
 - what was **observed**,
 - what was **inferred**,
 - what remains **unknown**.

Do not present inference as observation.]

---

## OPTIONS

| Option | Description | Cost | Risk | Reversible? |
|---|---|---|---|---|
| A | | | | |
| B | | | | |

---

## RECOMMENDATION

[One recommendation, with the reasoning that distinguishes it from the runners-up.
Name what would change your mind.]

---

## ARCHITECTURE COMPLIANCE

[Does the recommendation comply with the governing architecture? If it conflicts:
say so plainly. Do not proceed to implementation.]

---

## DATA IMPACT

None — investigation only. *(If this is not true, it is not an investigation.)*

---

## TRUST CHECK

- Is any finding stated more confidently than the evidence supports?
- Is anything guessed but presented as measured?
- Are the unknowns listed as plainly as the findings?

---

## OUTCOME

[What is now known that was not known before.]

## NEXT STEPS

[What implementation, if any, this unblocks — and what approval it needs.]
