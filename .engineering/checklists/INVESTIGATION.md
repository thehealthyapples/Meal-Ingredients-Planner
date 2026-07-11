# Checklist — Investigation

An investigation **analyses and recommends. It changes nothing.** If it changed
code, it was an implementation.

Template: [`../templates/INVESTIGATION_TEMPLATE.md`](../templates/INVESTIGATION_TEMPLATE.md).

## Before starting

- [ ] Read `docs/architecture/README.md` and the governing documents in scope.
- [ ] `git status` reported.
- [ ] Rollback tag created and identifier reported.
      *(Yes, even for a read-only investigation — it creates documents and can be
      interrupted.)*
- [ ] The question stated in **one sentence**.

## While investigating

- [ ] Every finding cites evidence: a file path and line, or a command's output.
- [ ] **Observed**, **inferred**, and **unknown** are labelled distinctly.
- [ ] No inference presented as observation.
- [ ] No code, schema, route, or capability changed. *(If you changed something,
      stop and re-classify the work.)*

## Recommending

- [ ] Options laid out with cost, risk, and reversibility.
- [ ] One recommendation, with the reasoning that separates it from runners-up.
- [ ] Named what evidence would change the recommendation.
- [ ] Compliance with governing architecture assessed. Conflicts stated plainly.

## Close

- [ ] Investigation written from the template, filed in `docs/investigations/`
      *(or `.engineering/reports/investigations/` if it concerns engineering
      practice rather than the product)*.
- [ ] Unknowns listed as prominently as findings.
- [ ] Trust Check: nothing stated more confidently than the evidence supports.
- [ ] Local commit made; SHA and rollback ID reported.
- [ ] Session closed.
