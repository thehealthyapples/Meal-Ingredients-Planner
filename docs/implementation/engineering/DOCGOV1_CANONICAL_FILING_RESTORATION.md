# DOCGOV1 — Canonical Documentation Filing Restoration

**Status:** Implementation report. Repository structure & documentation-governance restoration.
**Date:** 2026-07-17
**Governs nothing new** — restores the filing behaviour already mandated by
[`../../architecture/REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md)
(HOUSE2/HOUSE3, DOCSTRUCT1), which had regressed.

---

## Rollback identifier

- **Tag:** `rollback/audit-canonical-governance-20260717` → `7bfad50c`
- **Working-tree patch:** `scratchpad/rollback-worktree-audit-canonical-governance-20260717.patch`
  (467 KB, full `git diff HEAD` at start — captures the pre-existing dirty tree,
  including the files removed/relocated below).

## Regression found

The mechanical enforcer `.engineering/scripts/repo-structure-verify.sh` had gone
from **9/9 PASS** (recorded in commit `4c89cc0c`, HOUSE3) to **6/9** — three
failing checks:

1. **Root documentation drift** — two tracked diagnostic strays at the repository
   root: `.glibcheck.txt` (empty) and `.libdirs_uxhome.txt` (a single Nix store
   path). Committed in `9900e405` ("preserve workspace before DEV diet_pattern
   launch recovery"). Violates REPOSITORY_CONVENTIONS §1 rules 1 & 5.
2. **`docs/implementation/` loose files** — 25 implementation reports written to
   the tree root instead of a workstream subfolder (§4).
3. **`docs/investigations/` loose files** — 1 investigation at the tree root (§4).

**Reverted behaviour, not a one-off.** Commit `35d84533` (DEV1) *itself* committed
`DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` and `DEV_DIET_PATTERN_LAUNCH_FAILURE.md`
loose at the two tree roots — proving the filing discipline had lapsed in
*committed history*, not only the working tree. The remaining 24 loose reports
(BRAND/COMP/HOME/NORTH/ARRIVAL/ODL2/FI20/OPS1/SUP*) were uncommitted, accumulating
the same way.

**Root cause.** `repo-structure-verify.sh` is a *manual* Definition-of-Done gate;
it is **not** wired into any Stop/pre-commit hook (the only hooks are session
recovery). Recent sessions stopped running it at Review, so the regression grew
silently. No hook was deleted — the enforcement was always manual, and the manual
step was skipped.

## Fixes applied

- Removed both root strays (`git rm`).
- Relocated all 26 loose reports into their workstream subfolders, **keeping each in
  its existing tree** (implementation ↔ investigations). Tracked files moved with
  `git mv` to preserve history; untracked files moved in place.
- Re-ran both verifiers: **repo-structure-verify.sh 9/9 PASS**, **session-verify.sh
  all PASS**.

## Files relocated

| → workstream | files |
|---|---|
| `docs/implementation/ux/` | ARRIVAL1_DEFINITIVE_HOME, BRAND1_ARCHITECTURAL_BRANDING, BRAND2_EMBOSSED_APPLE_EXPLORATION, COMP1_COMPANION_VISUAL_IDENTITY, COMP2_COMPANION_PRESENCE_AND_CONVERSATION, COMP3_LIVING_RELATIONSHIP, COMP_INT1_COMPANION_INTEGRATION_AUDIT, HOME_ARRIVAL_PRODUCTION_LOCK, HOME_ARRIVAL_REIMAGINED, HOME_EMOTIONAL_INTERIOR_DESIGN, HOME_FINAL_CONCEPTS, HOME_INTERIOR_ARCHITECTURE, NORTH1_HOME_IMPLEMENTATION, NORTH2_HOME_REFINEMENT, NORTH3_HOME_REIMAGINED, NORTH4_CONCEPT_B_EVOLUTION, NORTH4_HOME_CONCEPT_EXPLORATION, NORTH5_HOME_REFINEMENT, ODL2_VISUAL_LANGUAGE_FOUNDATION |
| `docs/implementation/intelligence/` | FI20_FOOD_INTELLIGENCE_ACTIVATION |
| `docs/implementation/admin/` | OPS1_CANONICAL_OPERATION_EXPERIENCE, SUP1_SUPPORT_HUB_FOUNDATION, SUP2_STEWARD_DASHBOARD, SUP3_SUPPORT_HUB_CHECKIN |
| `docs/implementation/engineering/` | DEV_DIET_PATTERN_LAUNCH_RECOVERY |
| `docs/investigations/engineering/` | DEV_DIET_PATTERN_LAUNCH_FAILURE |

Workstream assignment was made by matching each report to where its subject
siblings already live (ux holds the Home/orchard/arrival/Companion-identity
lineage; intelligence holds the FI* family; admin holds the ADMIN/SUP support-hub
lineage; the DEV pair sits with its migration/dev-status siblings in engineering).
No filename collisions in any target folder.

## Verified clean (no regression)

- **Architecture documents** — all present under `docs/architecture/` (location rule
  satisfied); none had drifted elsewhere.
- **Prompts** — no canonical documentation location is defined for prompts; prompt
  *composition* is owned by INT17 (Context Composition Engine); `attached_assets/`
  is the long-standing Replit input convention (289 tracked files, unchanged). No
  loose prompt files at root or in `docs/`.
- **Root** — no `.md`/`.txt` report drift remains.

## Governance still open (not auto-fixed — needs owner action)

Both items below were **closed on 2026-07-17** by the follow-up self-enforcement
work — see the update at the end of this report.

- **Unindexed governing architecture ("invisible-by-navigation").** Five governing
  documents sit in `docs/architecture/` but are absent from its `README.md` index:
  two new this session — `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`,
  `INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md` — and three long-standing —
  `GOV2_CANONICAL_ALIAS_PRINCIPLE.md`, `PLATFORM_QUALITY_ARCHITECTURE.md`,
  `THA_COMPANION_PLATFORM_ARCHITECTURE.md`. Each declares itself *governing*; the
  README requires governing docs to be indexed (the exact defect the INT17 note
  names).
- **No automated enforcement.** Recommend wiring `repo-structure-verify.sh` into a
  Stop hook (or pre-commit) so the filing rule fails loudly instead of relying on a
  skippable manual step — the mechanism that let this regression grow.

---

## Update — 2026-07-17: canonical filing made self-enforcing

Both open items above are now closed.

1. **All five governing documents indexed.** `docs/architecture/README.md` now
   lists each in its correct section — GOV2 Canonical Alias Principle and THA
   Platform Quality Architecture under **Platform Governance**; THA Companion
   Platform Architecture, INTARCH1 Intelligence Reasoning Architecture, and
   COMP_AUTH1 Companion Authority Model under **Intelligence Governance**.

2. **Enforcement is now automatic, not manual.**
   - `repo-structure-verify.sh` gained a tenth check — *every architecture document
     is indexed in README.md* — so a new architecture report can no longer land
     "invisible by navigation" (the drift class that produced item 1).
   - `session-complete.sh` runs the verifier as a **canonical filing gate** before
     it moves any session state: a misfiled report, a root stray, or an unindexed
     architecture doc **refuses completion** and mutates nothing. Documented in
     `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md` §3 step 4.

   Proven end-to-end: a loose report and an unindexed architecture doc each fail
   the verifier (exit 1) and block `session-complete.sh` with `CURRENT.md` left
   byte-unchanged; the clean tree passes 10/10. All three report types are now
   covered — implementation and investigation reports by the loose-file checks,
   architecture documents by the index check.
