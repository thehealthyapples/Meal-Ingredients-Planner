# DOC2 — NK1 Canon Correction

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/DOC2-nk1-canon-correction-20260716` → `7d1dd2ce`
**Stash:** `DOC2_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-16` (stash@{0}, re-applied — tree preserved)
**Scope:** Governing documentation only. **No application code, no schema, no runtime behaviour.**
**Authority:** `CONV1` § Tier 1 item `DOC-2`; § 7 phase P1.
**Report:** [`docs/implementation/governance/DOC2_NK1_CANON_CORRECTION.md`](../../../docs/implementation/governance/DOC2_NK1_CANON_CORRECTION.md)

---

## Mission

Implement CONV1 item `DOC-2` only. Correct the NK1 documentation so it accurately reflects the
implemented platform. Do not change code, schemas, OWN1, or runtime behaviour.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + stash, tree re-applied)
- [x] `git status` confirmed (dirty tree from concurrent sessions — preserved)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1` read — item `DOC-2`, § 7 phase P1
- [x] `LIFE1` § 4 / § 4.1 read (the source of the finding)
- [x] `DOC-1` implementation report read (house style + precedent)
- [x] Claims re-verified against live code rather than inherited (V1–V9 in the report)

## What changed

**One document: `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`** (22 insertions, 4 deletions)

| Site | Correction |
|---|---|
| `:73` | Scope *"Who eats, age, stage"* → *"Who eats"* — neither fact exists on **either** named owner |
| `:139` | Coverage/maturity no longer claim an age is stored and *Authoritative*; gap moved to the Gap column |
| `:535` | Launch criterion no longer names an age — **records the gap, decides nothing** |
| `:418` | Bare `§6.3` → cites `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` **§ 6.3** |

## Deviations reported, not silently applied

1. **`CONV1` and `LIFE1` § 4.1 are wrong that `§6.3` points at nothing.** The section is **real** —
   `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:225` (*What signals may never do*), with all four
   prohibitions and its reasoning at § 6.4. LIFE1's check never left NK1. The pointer was
   **mis-cited (document name dropped), not orphaned** — so `DOC-2`'s *"resolve or remove"* was
   settled by **resolve**. Investigations are history and were not edited; corrected in the report § 4.1.
2. **`NK1` + `NK2` status blocks are stale** (*"Investigation and design (no implementation)"* on two
   promoted governing documents). **Different defect class, systemic across the pair, out of `DOC-2`
   scope.** Reported as a recommended `DOC`-class follow-on; not fixed. Report § 6.2.
3. **`repo-structure-verify.sh` root check fails on two pre-existing stray files**
   (`.glibcheck.txt`, `.libdirs_uxhome.txt`) belonging to a concurrent session. Not created, not
   removed by this item. All `docs/` rules pass.

## Next action

Complete. **Next CONV1 item: `DOC-3`** — the false `dayOfWeek` comment (`server/routes.ts:11371`),
P1, no dependencies. Note it edits application code (a comment); `DOC-2`'s no-code constraint was
item-specific.
