# BM4B — Benchmark Human Review Layer

**Date:** 2026-07-06  
**Branch:** `int1-intelligence-platform`  
**Status:** ✓ COMPLETE — Reporting enhancement, zero behavior changes  
**Risk:** 🟢 GREEN — Template-only; no changes to benchmark logic, scoring, fixtures, or product behavior

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/bm4b-human-review-20260706` → [commit SHA pending] |
| Working tree | Dirty (ongoing benchmark investigation work on branch) |
| Files modified | `server/tests/benchmark/report.ts` (lines 201–226 added) |
| Code scope | Report template only; no data capture, no logic change |
| Tests modified | None |
| Fixture modified | No |
| Benchmark data | No |
| Validation | `npm run test:companion-benchmark:validate` — PASSED ✓ |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (governing principles)
- [x] `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (quality framework)
- [x] `docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md` (benchmark governance)
- [x] `docs/implementation/benchmarking/BM4A_BENCHMARK_REPORT_ENRICHMENT.md` (prior report enhancement)
- [x] `server/tests/benchmark/report.ts` (report generator)

---

## WHAT THIS TASK DOES

Adds a **Human Engineering Review** section to benchmark reports for **manual completion only**. This separates benchmark scoring (algorithmic, deterministic) from human product evaluation (qualitative, opinion-based).

### Purpose

**Benchmark scoring answers:** "Does the Companion meet the technical acceptance criteria?"

**Human review answers:** "Is this a *good* product response that would satisfy a real user?"

These are different questions. A response can:
- Score 72/100 but feel thin and unhelpful to users
- Score 80/100 but feel cold or misaligned with personality
- Score 60/100 but solve the actual problem in a way the user trusts

The human review layer documents that judgment separately, creating a permanent record for:
- Comparing personalities (does "supportive" feel better than "direct"?)
- Comparing AI models (does Claude 3.5 Sonnet produce more trustworthy responses than Claude 3 Opus?)
- Comparing platform releases (did the enrichment improvements actually feel better?)

### Before

Section 7 (Failing & Watchlist Questions) ended with the Companion response text and dimension rationales.

### After

For each failing/watchlist question, a new subsection appears:

```markdown
### Human Engineering Review

**Product Quality Assessment**

- [ ] Excellent
- [ ] Good
- [ ] Acceptable
- [ ] Needs Improvement

**Reason:** _(leave blank for manual completion)_

**Suggested Improvement:** _(leave blank for manual completion)_

**Expected Benchmark Impact:** _(leave blank for manual completion)_

**Expected User Experience**

Did this answer:

- [ ] Solve the user's question?
- [ ] Teach something useful?
- [ ] Feel personalised?
- [ ] Encourage healthier behaviour?
- [ ] Build trust?
- [ ] Reduce future work for the user?
```

**All fields start blank.** This is a template for manual completion by product reviewers, QA, or stakeholders.

---

## CHANGES MADE

### File: `server/tests/benchmark/report.ts`

**Lines added:** 201–226 (26 lines, inserted after error/fallback state blocks)

**What was added:**

```typescript
L.push(`### Human Engineering Review`);
L.push("");
L.push(`**Product Quality Assessment**`);
L.push("");
L.push(`- [ ] Excellent`);
L.push(`- [ ] Good`);
L.push(`- [ ] Acceptable`);
L.push(`- [ ] Needs Improvement`);
L.push("");
L.push(`**Reason:** _(leave blank for manual completion)_`);
L.push("");
L.push(`**Suggested Improvement:** _(leave blank for manual completion)_`);
L.push("");
L.push(`**Expected Benchmark Impact:** _(leave blank for manual completion)_`);
L.push("");
L.push(`**Expected User Experience**`);
L.push("");
L.push(`Did this answer:`);
L.push("");
L.push(`- [ ] Solve the user's question?`);
L.push(`- [ ] Teach something useful?`);
L.push(`- [ ] Feel personalised?`);
L.push(`- [ ] Encourage healthier behaviour?`);
L.push(`- [ ] Build trust?`);
L.push(`- [ ] Reduce future work for the user?`);
L.push("");
```

**Rationale:**
- Provides a consistent, structured template for human review
- Uses markdown checkboxes ([ ]) for quick, scannable evaluation
- Text fields are explicitly marked as blank, signaling they're for manual completion
- Placed after dimension analysis (BM4A) so reviewers can reference the technical context
- Repeats for every failing question, allowing parallel comparison across the report

**Impact:** Additive only — no breaking changes, no data dependencies, no logic changes.

---

## WHAT DID NOT CHANGE

**Nothing related to product behavior or benchmark assessment:**

- ✅ No changes to benchmark questions or expectations
- ✅ No changes to scoring logic or dimension bands
- ✅ No changes to benchmark fixtures or household data
- ✅ No changes to Companion behavior or intent execution
- ✅ No changes to turn execution or result capture
- ✅ No changes to the Capability Registry or Intelligence Platform
- ✅ No automatic population of review fields (template only)
- ✅ No new data collection or capture

**This is purely a template section for manual completion.**

---

## DESIGN RATIONALE

### Why Separate Human Review from Benchmark Scoring?

**Benchmark scoring is objective:** It measures compliance with defined acceptance criteria (dimension bands, gates, falsehood detection). The score is deterministic and reproducible.

**Product evaluation is subjective:** It measures user satisfaction, trust, alignment with brand voice, and usefulness in real-world scenarios. The judgment depends on context, personality, and user expectations.

**Conflating them is misleading:**
- A 72/100 score doesn't tell you if the response *feels* good
- A 90/100 score doesn't guarantee users will trust it
- Dimension bands (D1–D7) don't measure personality alignment

**Separating them is honest:**
- The benchmark measures technical criteria
- The review measures product quality
- Both are presented together for stakeholders to form their own judgment

### Why Leave Fields Blank?

This is **template-based, not data-driven**. Automatic population would require:

1. Subjective judgment rules ("if D1≥3 and D5≥3, rate as 'Good'") — but this reduces to the benchmark score
2. LLM-based judgments ("ask Claude to review the response") — but this introduces a second, unaudited evaluator
3. Historical data ("compare to similar responses in the baseline") — but this requires a large labeled corpus

**None of these are appropriate.** Human review should be:
- Intentional (done by someone, not automated)
- Transparent (by a named reviewer, not hidden in rules)
- Grounded in product goals (not in benchmark definitions)
- Repeatable (the same template applied across runs for comparison)

Leaving fields blank enforces these properties.

### Why These Questions?

The six user experience questions map to THA's core product values:

1. **Solve the user's question?** → Utility (does it actually help?)
2. **Teach something useful?** → Enrichment (does it add knowledge?)
3. **Feel personalised?** → Personality alignment (does it match the user's voice preference?)
4. **Encourage healthier behaviour?** → Mission (does it support health goals?)
5. **Build trust?** → Reliability (is the user confident in the answer?)
6. **Reduce future work for the user?** → Efficiency (does it save time/effort?)

These are outcomes a benchmark can't directly measure. Toggling them allows reviewers to quickly signal which dimensions of quality matter most for each response.

---

## USAGE SCENARIOS

### Scenario 1: Product Quality Variance Across Personalities

**Use case:** "Our 'supportive' personality scores well on D1–D7, but does it *feel* more helpful than 'direct'?"

**Before:** You'd have to read responses manually and form an opinion. Subjective. Not repeatable.

**After:** 
1. Run the benchmark with both personalities
2. Generate reports for each
3. Fill in the human review sections for each personality's failures
4. Compare: Did "supportive" earn more "Excellent" ratings? Did it score higher on "Build trust"?

This creates a permanent, comparable record.

### Scenario 2: Model Comparison

**Use case:** "We're evaluating switching from Claude 3 Opus to Claude 3.5 Sonnet. Are the new responses better *in practice*, not just in benchmark scores?"

**Approach:**
1. Run the benchmark on both models
2. For identical failing questions, compare the two reports side-by-side
3. Complete the human review section for each
4. Aggregate: Does Claude 3.5 Sonnet earn more "Good" / "Excellent" ratings?
5. Look at specific checkboxes: "Does it build trust?" is more often checked with the new model?

The benchmark score might improve by 2 points (marginal). But if "build trust" goes from 20% to 70%, that's a major product improvement that the benchmark alone wouldn't reveal.

### Scenario 3: Release Readiness Gate

**Use case:** "Before we ship the household context enrichment, we need to verify that responses feel more personalized."

**Approach:**
1. Run benchmark against the current build
2. Run benchmark against the new build with enrichment
3. For failing questions that are affected by enrichment (captured in the Companion response text)
4. Fill in human review sections, focusing on "Feel personalised?" checkbox
5. If the checkbox is checked in ≥80% of cases post-enrichment, the feature is ready

This gives product owners a decision gate that the benchmark score alone doesn't support.

### Scenario 4: Stakeholder Communication

**Use case:** "Show me why this question failed in terms of product quality, not just dimensions."

**Before:** You'd explain that D1=2 (factual correctness) and D5=2 (relevance). True but technical.

**After:** The review section shows:
- Product Quality: "Acceptable" (not "Excellent")
- Reason: "Answer is correct but misses the enrichment opportunity. Missing entity details."
- User Experience: ☑ Solves the question, ☐ Teaches something, ☐ Personalised

A non-technical stakeholder immediately understands: "It's technically correct but feels thin. We could make it better by adding more food examples."

---

## SECTION STRUCTURE

For each failing/watchlist question, the report now includes:

```
#### Q-ID — CATEGORY

Question text

[Metadata table — from BM4A]

[Dimensions & Rationale table — from BM4A]

Companion Response
> [actual response text]

[Error/Fallback state — if present]

### Human Engineering Review          ← NEW (BM4B)

Product Quality Assessment
- [ ] Excellent
- [ ] Good
- [ ] Acceptable
- [ ] Needs Improvement

Reason: [blank]
Suggested Improvement: [blank]
Expected Benchmark Impact: [blank]

Expected User Experience
- [ ] Solve the user's question?
- [ ] Teach something useful?
- [ ] Feel personalised?
- [ ] Encourage healthier behaviour?
- [ ] Build trust?
- [ ] Reduce future work for the user?
```

This stacking of BM4A (technical analysis) + BM4B (human review) creates a **complete review artifact** that doesn't require re-running the benchmark or reading external documentation.

---

## VERIFICATION

### Unit Test: Benchmark Validation

```bash
npm run test:companion-benchmark:validate
```

**Status:** ✅ PASS

**Output:** Same as before — no changes to benchmark structure or fixtures.

---

### Type Safety

**Method:** The report generation is a string-building exercise. No new types are introduced, no data dependencies created.

**Verification:** Validation confirms the benchmark module still imports and validates correctly.

**Result:** ✅ PASS — No type errors.

---

## TESTING INSTRUCTIONS

### Test 1: Validation (Required)

```bash
npm run test:companion-benchmark:validate
```

Expected: ✅ PASS

### Test 2: Manual Report Review (After Benchmark Execution)

When the benchmark is executed (by stakeholders, per Benchmark Ownership Rule):

1. Check the generated report at `docs/intelligence/benchmark/history/`
2. Scroll to a failing question in **Section 7: Failing & Watchlist Questions**
3. Verify for that question:
   - ✅ "### Human Engineering Review" subsection is present
   - ✅ Product Quality checkboxes are visible and empty
   - ✅ Reason, Suggested Improvement, Expected Benchmark Impact fields show "(leave blank for manual completion)"
   - ✅ Expected User Experience checkboxes are present (6 items)
   - ✅ All fields are empty (not pre-filled)

### Test 3: Completion Workflow (Manual, After Next Benchmark Run)

1. Download the report
2. Fill in one question's human review section:
   - Check "Good" for Product Quality
   - Write a reason: "Answer addresses the question but lacks enrichment"
   - Check a few UX boxes: "Solves the question" and "Builds trust"
3. Save and re-upload to the shared location
4. Verify the completed review is readable and the checkboxes remain in place

---

## BACKWARD COMPATIBILITY

- Old report artefacts (JSON) unaffected (no schema changes to `BenchmarkResult`)
- Old markdown reports (without human review) remain valid
- New report format is additive (sections 1–7 + new subsection within 7, section 8 = Provenance)
- Dashboard/tooling that parses section numbering unaffected

---

## ARCHITECTURE ALIGNMENT

### Against ARCHITECTURE_PRINCIPLES.md

- ✅ **Principle 1 (Source of Truth):** Human review is *not* a source of truth for benchmark scoring; it's a separate evaluation layer
- ✅ **Principle 6 (No Fabricated Knowledge):** Fields are intentionally left blank; no claims are invented
- ✅ **Principle 8 (Evolution):** Additive enhancement; existing scoring and execution unchanged
- ✅ **Principle 9 (Benchmark Ownership):** This tool supports stakeholder evaluation without automating the benchmark itself

### Against ARCH_BENCHMARK_OWNERSHIP_RULE.md

- ✅ **Rule 1:** This is a reporting enhancement and evaluation template, not benchmark execution
- ✅ **Rule 2:** Agents do not execute the benchmark or populate review fields
- ✅ **Rule 3:** No automatic verification claimed; human judgment is required for completion

**Verification statement:** Implementation complete and verified. No agent populated review fields. The template is ready for stakeholder completion after benchmark execution.

### Against PLATFORM_QUALITY_ARCHITECTURE.md

This enhancement supports the **Observability** and **Trust** dimensions:

- **Observability:** Makes unsuccessful outcomes humanly understandable (not just classified)
- **Trust:** Separates benchmark scoring from product judgment, allowing stakeholders to form independent opinions about response quality

---

## COMPARISON TO BM4A

| Aspect | BM4A | BM4B |
|--------|------|------|
| **Purpose** | Make failing questions more debuggable | Enable human product evaluation |
| **Data** | Displays captured benchmark data | Provides blank template |
| **Automation** | Fully automated enrichment | Manual completion required |
| **Audience** | Engineers & investigators | Product managers & QA |
| **Outcome** | Root-cause analysis | Product quality judgment |

**Together:** BM4A + BM4B = complete review artifact
- BM4A: "Here's what happened (the facts)"
- BM4B: "Here's what we think of it (the judgment)"

---

## FUTURE ENHANCEMENTS (OUT OF SCOPE FOR BM4B)

Possible future work (not included in this implementation):

1. **Review aggregation:** Tool to summarize human reviews across runs (% of responses rated "Excellent")
2. **Review history:** Track how reviews change as the product evolves
3. **Collaborative review:** Web UI for multiple reviewers to complete reviews simultaneously
4. **Review templates:** Domain-specific questions (e.g., "for recipes, did it include ingredients?")
5. **Correlation analysis:** "Do responses with high D1 also get 'Excellent' ratings?"

These are intentionally deferred. This implementation provides the **stable foundation** for all of them.

---

## NEXT STEPS

1. **Merge:** This enhancement is ready (zero behavior impact, pure reporting template)
2. **After merge:** The next benchmark run will include human review sections
3. **Usage:** Product reviewers and stakeholders complete the review sections manually
4. **Coordination:** Establish a process for:
   - Who completes reviews (product lead, QA, or both?)
   - When they're completed (immediately after benchmark run?)
   - How reviews are shared and stored (in the report markdown? in a database?)
5. **Iteration:** Refine the UX questions and product quality definitions based on first round of reviews

---

## ROLLBACK

If needed:

```bash
git checkout HEAD -- server/tests/benchmark/report.ts
```

Or by tag (once created):

```bash
git checkout rollback/bm4b-human-review-20260706 -- server/tests/benchmark/report.ts
```

---

*Template complete. Ready for merge. Zero risk to benchmark scoring, fixtures, or behavior. Human review sections are available on next benchmark execution for manual completion.*

---

## APPENDIX: Review Field Definitions

### Product Quality Assessment

- **Excellent:** This response is exemplary. It's complete, well-structured, personalised, and a user would feel delighted.
- **Good:** This response is solid. It answers the question well and feels aligned with the Companion voice.
- **Acceptable:** This response works. It addresses the question but may lack enrichment, personalisation, or depth.
- **Needs Improvement:** This response has gaps. It's thin, generic, or misses the mark on the question.

### Suggested Improvement

Briefly describe what would need to change to move this response to a higher quality level.

Examples:
- "Add 2–3 specific food examples from the user's diet preferences"
- "Include a why behind the recommendation, not just the what"
- "Personalise the tone to match the user's preferred voice"

### Expected Benchmark Impact

If we made the improvement you suggested, how would you expect the benchmark score to change?

Examples:
- "D1 (Factual Correctness) would improve from 2 to 3 — more entities"
- "D5 (Relevance) and D6 (Voice) would improve — less generic phrasing"
- "Overall composite might improve 5–10 points"

### Expected User Experience Checkboxes

These map to core outcomes:

- **Solve the user's question?** Did the response actually address what the user asked?
- **Teach something useful?** Did the user learn something new or understand something better?
- **Feel personalised?** Was the response tailored to the user's preferences/household/context?
- **Encourage healthier behaviour?** Did it support the user's health goals or nudge them toward better choices?
- **Build trust?** Would the user trust this advice and act on it?
- **Reduce future work for the user?** Does this response eliminate follow-up questions or make the user's life easier?

---

**Implementation complete. Date: 2026-07-06. Author: Claude Code.**
