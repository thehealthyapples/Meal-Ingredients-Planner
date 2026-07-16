# CONV1 — Architecture Convergence Programme

**Stage:** In progress
**Date:** 2026-07-16
**Rollback ID:** `rollback/CONV1-architecture-convergence-programme-20260716` → `7d1dd2ce`
**Stash:** `CONV1_ROLLBACK: pre-investigation dirty-tree snapshot 2026-07-16` (stash@{0}, re-applied — tree preserved)
**Scope:** Planning and governance only. **No code, no schema, no architecture documents modified.**

---

## Mission

Create the governing Architecture Convergence Programme from the completed investigations.
Identify every area where governing architecture and implementation have diverged; classify;
prioritise; produce a backlog, dependency map, delivery phases, risks, immediate high-priority
convergences, and a long-term strategy.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + stash, tree re-applied)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `ARCHITECTURE_PRINCIPLES.md` read
- [x] `PEOPLE1` read
- [x] `LIFE1` + `LIFE2` read
- [x] `TIME1` + `TIME2` read (both retired as sources of rule by TIME3)
- [x] `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (TIME3, governing) read — incl. § 14 retirement list, § 17 status
- [x] `HOME3` read
- [x] `CPI1` (Canonical Publication Integrity Audit) read
- [x] `git status` confirmed (46 entries, dirty tree from concurrent sessions — preserved)
- [x] **GOVTIME1 — does not exist.** No document, no run file. Its governance function was
      performed by **TIME3**, which promoted the Household Time Architecture. Read that instead.
      (Same finding LIFE1's run file recorded.)
- [x] Claims re-verified against live code rather than inherited from the investigations

## Deviations reported, not silently applied

1. **The mission's specified path violates governing architecture.**
   `docs/investigations/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` is a loose root file.
   Forbidden by `REPOSITORY_CONVENTIONS.md` § 3 (`:47`) and § 4 (`:74`), restated by
   `docs/investigations/README.md`, and **mechanically enforced** by
   `.engineering/scripts/repo-structure-verify.sh:52-54`. Filed at
   **`docs/investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md`** —
   the folder that already holds the Core Architecture Principles and the SoT Register
   investigations. Same deviation TIME2 § 0.2, LIFE1 § 18 and PEOPLE1 § 12 each hit and
   resolved identically.

2. **The mission's noun "governing" is declined.** An investigation cannot be governing
   (`docs/architecture/README.md:4`). CONV1 is a **programme**, not law: it plans convergence,
   it does not decree it. Promotion is a separate, deliberate act it does not perform on itself.

## Next action

Complete. Awaiting direction on the recommended first convergence workstream.
