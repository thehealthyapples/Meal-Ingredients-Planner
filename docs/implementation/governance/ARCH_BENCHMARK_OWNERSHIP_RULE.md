# ARCH — Benchmark Ownership Rule

**Date:** 2026-07-06  
**Status:** GOVERNING RULE — Implementation Guidance  
**Adopted into:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (Rule 9)  
**Enforcement point:** `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 7 Trust and Claims)  
**Related documents:**
- `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (Verification § 4.1)
- `docs/architecture/README.md` (Implementation Governance section)

---

## Summary

The Companion Benchmark is the platform's **authoritative acceptance measure** for implementation verification. This rule establishes permanent ownership of benchmark execution, ensuring:

1. The benchmark remains a user/stakeholder-controlled acceptance activity
2. Implementation agents focus on validation (unit/integration/regression tests)
3. No automated benchmark execution during normal implementation workflow
4. Clear pause-point and handoff between implementation and acceptance verification

---

## Rule Statement

### The Companion Benchmark is the platform's acceptance benchmark.

The benchmark measures platform capability, quality, and performance against customer-visible acceptance criteria. It is the authoritative measure of feature readiness.

### Implementation agents must NOT execute the Companion Benchmark unless explicitly instructed.

During normal implementation work, the benchmark is not executed automatically. The benchmark is reserved for:
- Explicit user instruction to run the benchmark
- Scheduled acceptance verification (at milestones or release gates)
- Architecture decisions or reviews that explicitly require benchmark evidence

### After completing an implementation, agents should:

**Run only:**
- Unit tests relevant to the changed code
- Integration tests for the changed subsystem
- Regression tests to confirm nothing broke in related systems

**Confirm implementation readiness:**
- All unit/integration/regression tests pass
- Type checking passes
- No new architecture violations introduced
- Changes comply with Architecture Principles

**Pause and wait:**
- Confirm to the user/stakeholder: "Implementation complete and verified. Ready for acceptance benchmark."
- Wait for explicit instruction to execute the benchmark
- Do not proceed to benchmark unless instructed

### The benchmark remains the authoritative acceptance measure.

The benchmark is:
- Not part of continuous verification for implementation changes
- The final gate for accepting new capability or quality improvements
- User/stakeholder-controlled, not automated on all commits
- The measure that validates feature completeness, not a development-time optimization loop

---

## Rationale

### Why separate benchmark ownership?

**Benchmark execution is expensive and should be intentional.**
- Full-platform benchmarks are slow (minutes to hours depending on scope)
- Running on every change creates noise and delays feedback
- Automated execution on unfinished work produces meaningless data

**The benchmark measures acceptance, not development correctness.**
- Unit/integration/regression tests validate that the code works as intended
- The benchmark validates that the feature meets customer-visible acceptance criteria
- These are different verification activities with different timing

**Clear handoffs prevent silent gaps.**
- If agents automatically run the benchmark, it becomes background noise
- If the benchmark never runs, defects hide until late-stage discovery
- Explicit pause-points make acceptance decisions visible and intentional

**User/stakeholder control preserves trust.**
- Benchmark evidence is often presented to decision-makers
- Automated runs on unfinished work can be misleading
- Intentional execution at defined gates ensures data integrity

---

## Scope & Application

### Applies to all implementation work

This rule applies universally:
- Feature implementations (all risk levels: GREEN/AMBER/RED)
- Bug fixes and hotfixes
- Architecture convergence work
- Performance or quality improvements
- Any change that could affect customer-visible behavior

### Does NOT change the test requirement

Testing requirements remain unchanged:
- Unit tests remain mandatory per capability
- Integration tests remain mandatory for cross-subsystem changes
- Regression tests remain mandatory to prevent breakage
- Type checking and linting remain mandatory

### Does NOT prevent test-driven development

Agents may use the benchmark as evidence *during* architecture/design discussions:
- "Should we approach this problem this way?" → benchmark evidence can inform design
- "What would the acceptance criteria look like?" → benchmark definition informs scope
- "Does this architecture satisfy the quality goals?" → benchmark can validate design

Agents must not execute the benchmark as part of ongoing implementation, but may reference it in discussions.

---

## Implementation Checklist

For every implementation, before reporting completion:

```
BENCHMARK OWNERSHIP CHECKLIST
==============================

□ Unit tests for changed code pass
□ Integration tests for changed subsystem pass
□ Regression tests for related systems pass
□ Type checking passes
□ No new architecture principle violations introduced
□ No new architecture compliance failures introduced
□ Implementation matches scope lock (nothing unintended shipped)

□ Ready for benchmark: YES
  Confirmation message:
  "Implementation complete and verified against unit/integration/regression tests.
   Ready for acceptance benchmark execution. Awaiting explicit instruction."

□ Benchmark NOT executed
  (This implementation did not run the Companion Benchmark)

□ If benchmark was explicitly requested:
  Benchmark executed: [dates and results in separate section]
```

---

## Enforcement

### Where this rule is enforced

1. **During implementation** — included in STEP 7 (Trust and Claims) of ENGINEERING_WORKFLOW.md
2. **In agent instructions** — this rule governs when Claude Code agents execute benchmarks
3. **In architecture reviews** — verification sections must distinguish benchmark from test verification
4. **In project documentation** — implementation reports must confirm benchmark was not automatically run

### Violations

A violation occurs when:
- The benchmark is executed during normal implementation without explicit instruction
- An implementation is reported complete based solely on benchmark results
- Test verification is omitted in favor of benchmark-only verification
- Benchmark execution is automated on all commits

If a violation is suspected, pause and explain before continuing.

---

## References & Related Rules

### Architecture Principles
- **Principle 3** (Progressive enrichment for knowledge entities) — quality verification patterns differ by entity type
- **Principle 8** (Prefer evolution over replacement) — verification should confirm both new and retained behavior

### Governance Rules
- **Rule 8** from ARCHITECTURE_PRINCIPLES.md — "No new knowledge store is created without verification"
- Verification here means test verification, not necessarily benchmark verification

### Quality Architecture
- PLATFORM_QUALITY_ARCHITECTURE.md § 4.1 "Verification" — distinguishes between unit/system/acceptance verification
- This rule formalizes the acceptance/benchmark tier as user-controlled

### Engineering Workflow
- STEP 7 (Trust and Claims) — hard stops that require explicit approval
- STEP 9 (Mandatory Project Documentation) — implementation reports must include verification summary

---

## Examples

### ✅ CORRECT — Benchmark ownership respected

> Implementation of FI7 (Household Nutrition Opportunity Prioritisation) completes.
> 
> Unit tests: PASS (42 tests)  
> Integration tests: PASS (8 tests)  
> Regression tests: PASS (124 tests in related systems)  
> Type checking: PASS  
> Architecture compliance: PASS  
> 
> **Status:** Implementation verified and ready for acceptance benchmark.
> 
> *Benchmark execution awaiting explicit instruction from stakeholders.*

---

### ❌ INCORRECT — Benchmark executed without instruction

> Implementation of FI7 completes.
> 
> Unit tests: PASS  
> Integration tests: PASS  
> Regression tests: PASS  
> **Companion Benchmark: PASS (1250 acceptance criteria, 2234 ms runtime)**
> 
> *Status: Feature ready for release.*

**Problem:** The benchmark was executed without explicit instruction. The verification evidence is now mixed (unit/integration + acceptance) without clear handoff. Users cannot distinguish between implementation correctness and acceptance completion.

---

### ✅ CORRECT — Benchmark used in design, not execution

> During architecture review of capability design:
> 
> "This approach would satisfy the acceptance criteria because:
> - The benchmark expects [capability behavior X]
> - Our proposed design implements [implementation Y] which satisfies X
> - Unit tests can validate Y; acceptance would be measured by the benchmark on [date]"
> 
> No benchmark execution has occurred. This is design justification only.

---

## Historical Context

### Why this rule was needed

Prior pattern: Implementation work would execute the full Companion Benchmark at completion, reporting both unit-test pass AND benchmark pass in the same summary. This created ambiguity:

- Was the feature functionally correct? (unit tests answer this)
- Did the feature meet acceptance criteria? (benchmark answers this)
- When should stakeholders review acceptance? (unclear — mixed into implementation)

Result: Acceptance decisions became implicit rather than explicit, and acceptance evidence lost credibility because it was mixed with development-time optimization runs.

### Promoted from operational practice

This rule formalizes the practice that has emerged as the platform matured:
- **Before** (EWO1-EWX1): agents would run benchmarks to verify their work
- **After** (EWO2+): agents run unit/integration tests; benchmarks are user-controlled
- **This rule** (2026-07-06): permanently encodes the separated responsibility

Agents will default to this discipline; the rule makes the expectation permanent and reviewable.

---

## Document History

| Date | Change | Status |
|------|--------|--------|
| 2026-07-06 | Rule adopted into ARCHITECTURE_PRINCIPLES.md (Rule 9) | CURRENT |
| 2026-07-06 | Enforcement point added to ENGINEERING_WORKFLOW.md STEP 7 | CURRENT |
| 2026-07-06 | This document created at docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md | CURRENT |

---

## Next Steps

1. **Immediate:** Add Rule 9 to ARCHITECTURE_PRINCIPLES.md
2. **Immediate:** Update ENGINEERING_WORKFLOW.md STEP 7 to reference this rule
3. **Immediate:** Update README.md Implementation Guidance section to include link
4. **Ongoing:** Agent instructions incorporate this rule as permanent discipline
5. **Optional:** Create an agent hook in Claude Code settings to prompt on benchmark-related keywords

---

*This rule is governing and permanent. It applies to all future implementation work on The Healthy Apples platform.*

*Questions about application or conflicts → stop and report before continuing.*
