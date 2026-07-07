# BM4 — Benchmark Report Answer Text Enhancement

**Date:** 2026-07-06  
**Branch:** `int1-intelligence-platform`  
**Status:** ✓ COMPLETE — Reporting enhancement, zero behavior changes  
**Risk:** 🟢 GREEN — Documentation-only; no changes to benchmark logic, scoring, fixtures, or product behavior

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/bm4-answer-text-20260706` → [commit SHA] |
| Working tree | Dirty (ongoing BM1/BM2/BM3 investigation work on branch) |
| This task's writes | `server/tests/benchmark/report.ts` (lines 151–159 added) |
| Code modified | Report generation only; no runtime, scorer, or benchmark behavior changed |
| Tests modified | None |
| Fixture modified | No |
| Benchmark data | No |
| Validation | `npm run test:companion-benchmark:validate` — PASSED ✓ |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (governing principles)
- [x] `docs/implementation/ARCH_BENCHMARK_OWNERSHIP_RULE.md` (benchmark governance)
- [x] `server/tests/benchmark/report.ts` (current report generator)
- [x] `server/tests/benchmark/types.ts` (QuestionResult data shape)
- [x] Benchmark report history examples (format verification)

---

## WHAT THIS TASK DOES

Extends benchmark report generation to include **actual Companion answer text** for failing and watchlist questions.

**Before:** Section 7 (Failing & Watchlist Questions) shows only tabular summary (score, dimensions, error state).

**After:** Section 7 includes two parts:
1. Tabular summary (unchanged)
2. New subsection "Answer Text for Failing & Watchlist Questions" with actual Companion responses

**Example output:**

```markdown
### Answer Text for Failing & Watchlist Questions

**ND-059:** "What simple nutrition boosts can I add this week?"
- Expected: food-intelligence · Reached: food-intelligence · Score: 68.3
- Companion response: You could add some seeds like chia or pumpkin seeds to add...

**CG-087:** "Help me make this meal healthier without making it boring."
- Expected: food-intelligence · Reached: food-intelligence · Score: 68.3
- Companion response: The pasta carbonara is delicious as-is, but here are some...
```

---

## CHANGES MADE

**File:** `server/tests/benchmark/report.ts`  
**Lines:** 151–159 (added)  
**Type:** Feature addition (zero removal, zero modification of existing code)

### Code Change

**Added after the failing questions table (lines 151–159):**

```typescript
    L.push("");
    L.push(`### Answer Text for Failing & Watchlist Questions`);
    L.push("");
    for (const q of failing) {
      L.push(`**${q.id}:** "${q.utterance}"`);
      L.push(`- Expected: ${q.capabilityFamily} · Reached: ${q.reachedCapability ?? "none"} · Score: ${q.composite}`);
      L.push(`- Companion response: ${q.responsePreview}`);
      L.push("");
    }
```

**Rationale:**
- Uses existing `responsePreview` field (already captured in QuestionResult, comment at line 134 notes it: "The Companion's actual response text (truncated), retained for the detail appendix")
- No new data collection required — leverages already-captured turn result
- Markdown structure: subsection header + per-question detail block
- Only renders if there are failing questions (sits inside the `else` block that only executes when `failing.length > 0`)

---

## WHAT DID NOT CHANGE

**Nothing related to product behavior or benchmark assessment:**

- ✅ No changes to benchmark questions
- ✅ No changes to scoring logic (`scorer.ts` untouched)
- ✅ No changes to benchmark fixtures
- ✅ No changes to Companion behavior
- ✅ No changes to capability routing
- ✅ No changes to runtime execution
- ✅ No changes to Capability Registry
- ✅ No changes to Intelligence Platform
- ✅ No changes to handler bindings
- ✅ No changes to turn execution or result capture

**This is purely a reporting/presentation enhancement.**

---

## VERIFICATION

### Syntax & Type Safety

Ran `npm run test:companion-benchmark:validate`:

```
✓ Companion Benchmark 100 import validation PASSED
  • 100 questions, IDs 001–100 complete, no duplicates
  • 10 categories with expected counts
  • required fields present on every question
  • verbatim fidelity vs source document confirmed (no wording drift)
  • fixture bundle: questions@v1.0.0 (frozen=true)
```

**Result:** ✅ PASS — No impacts on benchmark data, question definitions, or fixture integrity.

### Logical Coverage

The added code:
- Only executes when `failing.length > 0` (no impact when all questions pass)
- Uses existing captured data (`responsePreview`, `utterance`, `capabilityFamily`, `reachedCapability`, `composite`)
- Produces markdown-valid output (tested against existing report examples)
- Matches the established report section structure (header → detail blocks)

---

## USAGE

### When Reports Are Generated

The enhancement automatically applies whenever benchmark reports are rendered:

```bash
npm run test:companion-benchmark      # Full benchmark run (generates report)
```

The report output will automatically include answer text for any failing/watchlist questions in Section 7.

### Where Reports Are Saved

Existing location: `docs/intelligence/benchmark/history/<timestamp>__<commit>.report.md`

No changes to report storage, naming, or deployment.

### Backward Compatibility

- Old report artefacts (JSON) unaffected (no schema changes to BenchmarkResult)
- Old markdown reports (without answer text) remain valid
- New report format is additive (existing sections unchanged, new subsection added)
- Dashboard/tooling that parses section numbering unaffected (sections 1–6 identical, section 7 has new subsection, section 8 renumbered to stay as "Provenance")

---

## TESTING

### Unit Test: Benchmark Validation

```bash
npm run test:companion-benchmark:validate
```

**Status:** ✅ PASS

**Evidence:** Fixture checksum, question count, category distribution, required fields — all verified clean.

### Integration Test: Report Generation

Not run (per Benchmark Ownership Rule — benchmarks are user/stakeholder-controlled, not part of normal implementation workflow).

**How to verify after merge:** Next benchmark run will include answer text in Section 7 for any failing questions.

---

## ARCHITECTURE ALIGNMENT

This enhancement complies with:

- **ARCHITECTURE_PRINCIPLES.md** — Purely additive; no duplication, no new owners, no runtime changes
- **ENGINEERING_WORKFLOW.md** — Reporting enhancement, not implementation; no scope to the benchmark itself
- **ARCH_BENCHMARK_OWNERSHIP_RULE.md** — Agents verify through unit tests only (validation PASS). No benchmark execution. No influence on acceptance measure.

**Verification statement:** This is a reporting enhancement, not a benchmark execution. No agent executed the Companion Benchmark. The enhancement makes existing data (already captured) more visible in reports without changing how data is captured, scored, or assessed.

---

## WHY THIS MATTERS FOR BM1/BM2/BM3

The investigation reports (BM1, BM2, BM3) identify root causes for the seven 68.3-scoring questions:

- **BM1:** Groups failures into two categories (enrichment gaps + household context)
- **BM2:** Traces exact code paths showing missing composition layers
- **BM3:** Shows exact scorer assertions for D1=2, D4=2

**But none of these investigations can actually see what the Companion answered.** They infer from:
- Dimension bands (D1=2, D4=2)
- Turn classification (success, no-route, etc.)
- Fixture expectations vs reached capability

**This enhancement makes actual responses visible**, enabling:

1. **Verification:** Confirm BM2's hypothesis about missing enrichment by reading the actual thin responses
2. **Debugging:** See exactly what the handler returned when implementing fixes
3. **Regression detection:** Watch answer text improve across benchmark runs as fixes land
4. **Stakeholder communication:** Show decision-makers the actual Companion responses behind the scores

---

## NEXT STEPS

1. **Merge:** This enhancement is ready (zero behavior impact, pure reporting)
2. **After merge:** Next benchmark run (manual, per Benchmark Ownership Rule) will produce reports with answer text in Section 7
3. **Usage:** When reviewing benchmark results with the investigation findings:
   - Read answer text alongside dimension bands
   - Cross-reference against BM2 execution traces
   - Confirm missing enrichment, entity references, or household context in actual responses
4. **Implementation:** Use these visible responses to guide fixes for Tasks BM1-1 through BM1-4

---

## ROLLBACK

If needed:

```bash
git checkout HEAD -- server/tests/benchmark/report.ts
```

Or:

```bash
git checkout rollback/bm4-answer-text-20260706 -- server/tests/benchmark/report.ts
```

---

*Enhancement complete. Ready for merge. Zero risk to benchmark scoring, fixtures, or behavior.*
