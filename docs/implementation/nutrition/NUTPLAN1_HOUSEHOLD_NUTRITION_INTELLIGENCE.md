# NUTPLAN1 — Household Nutrition Intelligence

**Status:** 🔄 In progress — preflight complete, inventory in progress.
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/NUTPLAN1-household-nutrition-intelligence-20260719` → `6b93a752` (annotated tag + branch); worktree snapshot `refs/snapshots/NUTPLAN1-worktree-20260719` → `a1db1cd5`
**Governing architecture:** [`README.md`](../../architecture/README.md) bootstrap read in full.

---

## 1. Mission

Complete the **remaining** household nutrition intelligence that powers planning decisions, by
extending the existing Canonical Food, Knowledge and Planner architecture.

**Explicitly out of scope:** another planner, another intelligence engine, any duplicate business
logic. Every recommendation must be evidence-backed where applicable and must respect the
canonical Household Dietary Safety Gate (`server/lib/household-dietary-safety.ts`, completed by
`PROD6`).

Because the mission word is **complete**, not *build*, the first act of this session is an
inventory of what already exists. Building a capability THA already has would be the precise
failure the mission forbids.

---

## 2. Preflight

| Step | Result |
|---|---|
| Architecture bootstrap (`docs/architecture/README.md`) | ✅ Read in full |
| Git status confirmed | ✅ `int1-intelligence-platform` @ `6b93a752`; 113 uncommitted paths from prior sessions (PROD2–PROD6, BUS1/2A, KNOW1, UX_REFINE1) |
| Rollback protection created | ✅ See below |
| `rollback-verify.sh` | ✅ PASS — tag exists, is annotated, resolves to a commit |

### Rollback identifier

```
rollback/NUTPLAN1-household-nutrition-intelligence-20260719  →  6b93a752   (annotated tag + branch)
refs/snapshots/NUTPLAN1-worktree-20260719                    →  a1db1cd5   (tracked-file worktree snapshot)
```

The snapshot captures **tracked** modifications only (`git stash create` does not include untracked
files). Untracked deliverables from prior sessions are not at risk: restoring the snapshot does not
remove untracked files. Recorded here rather than left implicit.

---

## 3. Architecture & AI Architecture Compliance

Confirmed against `ENGINEERING_WORKFLOW.md`. Both checklists are completed in full in **§8**, once
the inventory has established what is being extended — a compliance checklist answered before
knowing which owner is being extended would be a guess, and §8's "Extends existing architecture"
item is precisely the question the inventory exists to answer.

**Binding constraints carried into every decision below:**

- **Principle 2 — one owner per fact.** No nutrition fact may gain a second owner.
- **Principle 6 — non-fabrication.** Honest gaps over invented content. An unknown nutrient
  position renders as absent, never as an estimate.
- **Principle 8 — retire on introduction.** Any rival logic found is retired, not left beside.
- **AI compliance** — capabilities register through the Capability Registry and reach the model
  only via INT17 Context Composition. No second assistant, no prompt-templated facts.
- **Household Time** — season resolves only through `shared/seasonal/season-rule.ts`; planner-week
  meaning only through the `weekStartDate` anchor, which is `NULL` and never back-filled for 192 of
  195 households (**HT7**). Any weekly claim must degrade honestly for unanchored households.
- **Safety** — every food-producing surface reaches the canonical gate (`PROD6`).

---

## 4. Inventory of existing capability

_(in progress — populated from the codebase inventory before any implementation)_

---

## 5. Gaps selected for implementation

_(to follow)_

---

## 6. Implementation

_(to follow)_

---

## 7. Verification evidence

_(to follow)_

---

## 8. Compliance checklists

_(completed before implementation begins)_

---

## 9. Remaining risks

_(to follow)_
