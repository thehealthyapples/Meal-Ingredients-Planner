# ADMIN2 — Support Hub Experience (design investigation)

**Session ID:** `ADMIN2_Support_Hub_Experience`
**Objective:** Design the future Support Hub so it feels like part of The Healthy Apples
(the Orchard House) rather than a traditional admin console — same design language,
interaction patterns and UX philosophy. **Investigation/design only — implement nothing.**
**Rollback ID:** `rollback/ADMIN2-support-hub-experience-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`
**Report:** `docs/investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md`
(filed under the `admin` workstream per REPOSITORY_CONVENTIONS §4).

---

## Stage
Waiting for User — design document authored. Investigation complete; **nothing implemented**;
product source byte-untouched (git status modified-list identical to session start).

## Rollback
Annotated tag created at HEAD `7bfad50c` (ADMIN1 commit). Working tree **intentionally
dirty** at session start (sibling sessions NORTH3/4/5, FI18, P0, CONV1, INT19, ADMIN1
uncommitted material present) — the tag covers committed state only; ADMIN2 authors
documents only and touches no product source.

## Checkpoints
- [x] Rollback protection created and recorded
- [x] Read ADMIN1 investigation (governing prior)
- [x] Read recovery + rollback protocols
- [x] Extract THA UX philosophy (Explore agent — Admin = "the study off the hall", E0, §5.9 rhythm)
- [x] Catalog admin tasks + feedback-state defects (Explore agent — 13 pages, benchmark ×5 surfaces, silent Publish/Rollback)
- [x] Author ADMIN2 design document (7 deliverables, all evidence-anchored)
- [x] Reconcile run file + CURRENT.md before final response

## Key findings (evidence-locked)
- **HEADLINE:** the console is the one room that "left the house" — `/admin` opens on a generic
  card grid (`admin-page.tsx:189-192`), the exact *"cold, clinical admin-console temperature that
  leaves the house"* the Orchard House blueprint forbids (`ORCHARD_HOUSE:308`). Yet governance
  ALREADY binds it: Admin = "the study off the hall", E0, no Living Detail (`BLUEPRINT:181`);
  *"Calm Orchard governs… administrative surfaces. No surface is exempt"* (`UI:127`); *"never a
  second product"* (`LANGUAGE:453`). The brief's objective is a RETURN to governance, not invention.
- **Defining defect = silence.** The two canonical-knowledge mutations (Publish, Roll Back a
  Knowledge Release — `admin-knowledge-review:738-745, :794-799`) run with NO confirm, NO progress,
  NO spinner — disabled button + post-hoc toast. The longest op (Full benchmark ×10 households,
  `admin-benchmark-households:305-312`) reports nothing but a spinner and silently resets households
  first, unconfirmed. Confirmation is INVERSELY correlated with consequence.
- **Feedback uniform in mechanism, uneven in application** — toast usage 18→0 across pages; NO true
  progress reporting anywhere (0 progress bars / percent / job-status polls in all 13 pages).
- **Benchmark = the task-confusion case study** — appears on 5 surfaces (2 runners vs different
  worlds, 1 view-only echo, 2 hub cards); no single obvious place to benchmark.
- **Deliverables:** Support Hub philosophy (the study off the hall) · 5-domain IA w/ threshold ·
  progressive-guidance standard (3 layers, the brief's 7 questions, panel=confirm gate) ·
  long-running lifecycle (acknowledged→queued→running→progress→ETA→completed[/warnings/failed]→next,
  UNKNOWN≠green) · feedback standard · areas of confusion · prioritised roadmap (QW-1..4 all 🔴/🟠).
  **The one canonical pattern = the "Operation Card"** (operator twin of the Companion Card).

## Next action
None — complete; awaiting owner decision on Option A vs B, the Admin→Support Hub rename
(governance amendment if yes), and whether backend progress reporting is in scope.

## Blockers
None. (Open owner decisions listed above — not blockers to the investigation, which is complete.)
