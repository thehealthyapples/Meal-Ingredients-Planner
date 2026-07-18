# Session: ENGINT2_Engineering_Knowledge_Graph

| Field | Value |
|---|---|
| **Session ID** | `ENGINT2_Engineering_Knowledge_Graph` |
| **Rollback ID** | `rollback/ENGINT2-engineering-knowledge-graph-20260718` |
| **Start time** | 2026-07-18 |
| **Current stage** | **Complete — committed (`72412052`), awaiting owner review** |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/ENGINT2-engineering-knowledge-graph-20260718` → `0efcfc7f388f43f979543d61ea25dfecee5fe181` (annotated; == HEAD at start) |
| Working tree at start | **Dirty — NOT MINE.** 231 entries from sibling sessions. Tag covers committed state only. |
| This session's writes | 1 new test, 3 modified source files, 1 report — all in `72412052` |
| Rollback of this task only | `git revert 72412052` — ENGINT1 remains fully functional without it |

## Objective
Extend the **existing** Developer Intelligence capability with relationship
reasoning across the engineering record. **No new capability, registry, index,
database or source of truth. Relationships derived, never stored.**

## Method: measure the corpus before writing derivation rules
The mission's rule *"never infer unsupported relationships"* cannot be honoured by
writing plausible rules and hoping the corpus matches. The live corpus was measured
first, and the findings decided what was built and what was refused.

**Derivable → built:** impl→architecture (210/327 files, 843 citations) ·
impl→investigation (57/327) · architecture←promoted-from←investigation (12/40) ·
document→commit (73.8% of subjects carry an EWO id).

**Not derivable → refused with evidence:**
- **Commit → Release.** 900 tags, 750 rollback, **zero release tags**. RELEASE.md lists 2, last updated 2026-05-12.
- **Roadmap → Workstream.** Three colliding `WS<n>` schemes; "WS0" occurs ~1369 times, overwhelmingly the knowledge series.
- **Status → shipped.** 317 distinct values; `Complete` and `Investigation complete` mean opposite things.

Each refusal returns `answerable: false` plus the repository change that would fix it.

## Results
- **4,882 edges** across **796** documents, every one carrying `path:line`.
- Architecture with no implementation: **2** — and both (`THA_BRAND_CONSTITUTION.md`, `THA_INTELLIGENCE_LANGUAGE_GUIDE.md`) *declare themselves implementation-free*. Strong correctness signal.
- Implementations with no governing architecture: **94** of 323.
- Investigations with no recorded follow-through: **285** of 420.
- `capability-registry.ts` **untouched**; no verb added; §7 isolation re-asserted.

## Two defects found and fixed
1. **False unresolved gaps** — a filename stem in prose (`TIME1_HOUSEHOLD_TIME_FOUNDATION`) failed to resolve to its own document, filling the unresolved list with false gaps. Fixed with a three-form resolver; 4797 → 4882 edges; two regression assertions added.
2. **Stale ENGINT1 verification claim** — ENGINT1's report said the typecheck was clean; it was stale (a `Set`-iteration error from its late IDF edit). Fixed here and corrected in ENGINT2's report. Process failure: re-running only the fast check after a late edit.

## Verification
36/36 ENGINT2 · 34/34 ENGINT1 unbroken · 4 sibling suites green · no tsc error in any ENGINT1/ENGINT2 file.

## Next action
**Owner to review** `docs/implementation/engineering/ENGINT2_ENGINEERING_KNOWLEDGE_GRAPH.md`.
Four suggestions, all repository/process decisions, none begun:
1. Release tags (or a release field) — would make "what has shipped" answerable at all.
2. A distinct roadmap workstream identifier — resolves the three-way WS collision.
3. A controlled `Status:` vocabulary — 317 values makes the field unusable for reasoning.
4. Human pass over the 94 ungoverned reports and 285 unresolved investigations.

**Out of scope, not begun:** Engineering Automation, Remote Operations.
