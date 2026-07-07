# BM4C — Benchmark Lifecycle Tracking

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Status:** ✓ COMPLETE — Reporting enhancement, zero behavior changes
**Risk:** 🟢 GREEN — Template-only; no changes to benchmark logic, scoring, fixtures, or product behavior

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/bm4c-lifecycle-tracking-20260706` → [commit SHA pending] |
| Working tree | Dirty (ongoing benchmark investigation work on branch) |
| Files modified | `server/tests/benchmark/report.ts` (Engineering Lifecycle block added inside the per-question loop of Section 7) |
| Code scope | Report template only; no data capture, no logic change |
| Tests modified | None |
| Fixture modified | No |
| Benchmark data | No |
| Validation | `npm run test:companion-benchmark:validate` — PASSED ✓ |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (governing principles, incl. Principle 9 — Benchmark ownership)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 2 bootstrap, STEP 5 mandatory sections, STEP 7 trust/claims)
- [x] `docs/implementation/ARCH_BENCHMARK_OWNERSHIP_RULE.md` (benchmark governance)
- [x] `docs/implementation/BM4A_BENCHMARK_REPORT_ENRICHMENT.md` (prior report enhancement)
- [x] `docs/implementation/BM4B_BENCHMARK_HUMAN_REVIEW_LAYER.md` (prior report enhancement — direct predecessor of this work)
- [x] `docs/intelligence/benchmark/BENCHMARK_REPORT_TEMPLATE.md` (canonical report shape, §7 Failing & Watchlist Questions)
- [x] `server/tests/benchmark/report.ts` (report generator)

---

## WHAT THIS TASK DOES

Adds a blank **Engineering Lifecycle** section immediately after the existing **Human Engineering Review** section (BM4B) for every failing/watchlist question in Section 7 of the benchmark report. This gives each failing question a persistent, trackable engineering status separate from both the benchmark score (algorithmic) and the human product judgment (BM4B).

### Purpose

**Benchmark scoring answers:** "Does the Companion meet the technical acceptance criteria?"

**Human review (BM4B) answers:** "Is this a *good* product response that would satisfy a real user?"

**Engineering lifecycle (BM4C) answers:** "What is the engineering status of fixing this, and where is that work tracked?"

A failing question can persist across many benchmark runs while its engineering status changes — from unreviewed, to root-caused, to planned, to implemented, to eventually closed once the benchmark reflects the fix. Without a dedicated section, that status lives only in memory, chat history, or scattered investigation/implementation documents. This section gives each question a durable place to record: has anyone looked at this yet, is there a written investigation, is there a written implementation, and any free-text notes — without inferring or fabricating any of that from the benchmark data itself.

### Before

Section 7 (Failing & Watchlist Questions) ended each question's block with the Human Engineering Review subsection (BM4B).

### After

For each failing/watchlist question, a new subsection appears immediately after Human Engineering Review:

```markdown
### Engineering Lifecycle

**Status**

- [ ] Not Investigated
- [ ] Root Cause Identified
- [ ] Implementation Planned
- [ ] In Progress
- [ ] Implemented
- [ ] Benchmark Improved
- [ ] Closed

**Related Investigation(s):** _(leave blank for manual completion)_

**Related Implementation(s):** _(leave blank for manual completion)_

**Notes:** _(leave blank for manual completion)_
```

**All fields start blank.** This is a template for manual completion by engineers, investigators, or stakeholders tracking the question toward resolution.

---

## CHANGES MADE

### File: `server/tests/benchmark/report.ts`

**Location:** Inside the per-question `for (const q of failing)` loop of Section 7, immediately after the existing Human Engineering Review block (BM4B) and before the loop closes.

**What was added:**

```typescript
L.push(`### Engineering Lifecycle`);
L.push("");
L.push(`**Status**`);
L.push("");
L.push(`- [ ] Not Investigated`);
L.push(`- [ ] Root Cause Identified`);
L.push(`- [ ] Implementation Planned`);
L.push(`- [ ] In Progress`);
L.push(`- [ ] Implemented`);
L.push(`- [ ] Benchmark Improved`);
L.push(`- [ ] Closed`);
L.push("");
L.push(`**Related Investigation(s):** _(leave blank for manual completion)_`);
L.push("");
L.push(`**Related Implementation(s):** _(leave blank for manual completion)_`);
L.push("");
L.push(`**Notes:** _(leave blank for manual completion)_`);
L.push("");
```

**Rationale:**
- Reuses the same markdown checkbox convention as BM4B's Human Engineering Review for visual/structural consistency
- Status values form a linear lifecycle (unreviewed → root-caused → planned → in progress → implemented → benchmark-improved → closed) but are rendered as independent checkboxes rather than a forced radio choice, since a reviewer may want to mark more than one as historically true across runs
- "Related Investigation(s)" and "Related Implementation(s)" are free-text so they can reference existing docs (e.g. `docs/investigations/BM1_BENCHMARK_68_ROOT_CAUSE.md`, `docs/implementation/BM2_...md`) without the report generator needing to know about the documentation corpus
- Placed after Human Engineering Review (not before) so the reading order stays: technical facts (BM4A) → product judgment (BM4B) → engineering tracking (BM4C)
- Repeats for every failing question, exactly like the two preceding subsections

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
- ✅ No changes to the Human Engineering Review section (BM4B) — appended after it, untouched
- ✅ No automatic population of lifecycle fields (template only)
- ✅ No new data collection or capture

**This is purely a template section for manual completion.**

---

## SECTION STRUCTURE

For each failing/watchlist question, the report now includes (in order):

```
#### Q-ID — CATEGORY

Question text

[Metadata table — BM4A]

[Dimensions & Rationale table — BM4A]

Companion Response
> [actual response text]

[Error/Fallback state — if present]

### Human Engineering Review          ← BM4B

[Product Quality Assessment, Reason, Suggested Improvement,
 Expected Benchmark Impact, Expected User Experience checkboxes]

### Engineering Lifecycle             ← NEW (BM4C)

Status
- [ ] Not Investigated
- [ ] Root Cause Identified
- [ ] Implementation Planned
- [ ] In Progress
- [ ] Implemented
- [ ] Benchmark Improved
- [ ] Closed

Related Investigation(s): [blank]
Related Implementation(s): [blank]
Notes: [blank]
```

BM4A (technical facts) + BM4B (product judgment) + BM4C (engineering tracking) together form a complete, self-contained review artifact per failing question — no external doc or memory needed to know what a question is, why it scored as it did, whether it's a good/bad product answer, and where its fix stands.

---

## VERIFICATION

### Unit Test: Benchmark Validation

```bash
npm run test:companion-benchmark:validate
```

**Status:** ✅ PASS — question count, category distribution, required fields, and fixture checksum all confirmed unchanged.

### Type Safety

```bash
npx tsc --noEmit -p .
```

**Result:** ✅ No errors reported in `server/tests/benchmark/report.ts` or elsewhere attributable to this change.

### Rendering Check (existing captured data, no benchmark execution)

Per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`, this task did not execute the Companion Benchmark. Instead, `renderReport()` was invoked directly against an **already-captured** result artefact already present in the repository (`docs/intelligence/benchmark/history/2026-07-06T13-09-07Z__d63d7cd.json`) to confirm the new section renders correctly:

- ✅ "### Engineering Lifecycle" appears once per failing question
- ✅ It appears immediately after "### Human Engineering Review" and before the next question's header
- ✅ All seven status checkboxes render unchecked
- ✅ "Related Investigation(s)", "Related Implementation(s)", and "Notes" all render with the blank placeholder text
- ✅ No existing section content (Section 1–6, metadata table, dimensions table, Companion response, Human Engineering Review) was altered

This is re-rendering of already-existing benchmark data through the report generator — not a new benchmark run.

---

## ARCHITECTURE ALIGNMENT

### Against ARCHITECTURE_PRINCIPLES.md

- ✅ **Principle 1 (Source of Truth):** The Engineering Lifecycle section is not a new source of truth for benchmark scoring or question status — it is a manual tracking template layered on top of the report
- ✅ **Principle 6 (No Fabricated Knowledge):** All fields are intentionally left blank; nothing is inferred or invented about investigation/implementation status
- ✅ **Principle 8 (Evolution):** Purely additive to the BM4A/BM4B stack; existing sections are unchanged
- ✅ **Principle 9 (Benchmark ownership remains with the user):** This is a reporting enhancement, not benchmark execution; no agent populated a lifecycle field or claimed a question's status

### Against ARCH_BENCHMARK_OWNERSHIP_RULE.md

- ✅ **Rule 1:** Reporting/template enhancement, not benchmark execution
- ✅ **Rule 2:** No agent executed the benchmark or populated lifecycle fields
- ✅ **Rule 3:** No verification claimed beyond validation script and direct rendering check against existing captured data

### Against BENCHMARK_REPORT_TEMPLATE.md

- ✅ Section order is unchanged (headline → regression → safety → breakdowns → failures → provenance); the new subsection nests inside the existing §7 per-question block, after BM4B, before the loop moves to the next question
- ✅ No change to the tabular summary at the top of §7, so any tooling parsing that table is unaffected

---

## BACKWARD COMPATIBILITY

- Old report artefacts (JSON `result.json`) unaffected — no schema changes, this is presentation-only
- Old markdown reports (without Engineering Lifecycle, or without Human Engineering Review) remain valid as historical records
- New report format is additive: Sections 1–6 unchanged, Section 7 gains one more per-question subsection, Section 8 (Provenance) unchanged
- Dashboard/tooling that parses section numbering is unaffected

---

## NEXT STEPS

1. **Merge:** This enhancement is ready (zero behavior impact, pure reporting template)
2. **After merge:** The next benchmark run will include the Engineering Lifecycle section for every failing/watchlist question
3. **Usage:** As investigations (e.g. BM1, BM2, BM3) and implementations land for a given failing question, a reviewer manually updates that question's Status checkbox(es) and links the relevant investigation/implementation documents and notes
4. **Coordination:** Establish who is responsible for keeping lifecycle fields current as work progresses (same question BM4B raised for human review ownership)

---

## ROLLBACK

If needed:

```bash
git checkout HEAD -- server/tests/benchmark/report.ts
```

Or by tag (once created):

```bash
git checkout rollback/bm4c-lifecycle-tracking-20260706 -- server/tests/benchmark/report.ts
```

---

*Template complete. Ready for merge. Zero risk to benchmark scoring, fixtures, or behavior. Engineering Lifecycle sections are available on next benchmark execution for manual completion.*

---

**Implementation complete. Date: 2026-07-06. Author: Claude Code.**
