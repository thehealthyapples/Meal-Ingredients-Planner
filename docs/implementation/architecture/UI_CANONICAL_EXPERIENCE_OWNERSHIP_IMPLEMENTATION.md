# UIOWN1 — UI Canonical Experience Ownership: Implementation Report

**Date:** 2026-07-20
**Status:** COMPLETE — governance only; no application code
**Deliverable:** `docs/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1`)
**Rollback identifier:** `rollback/UIOWN1-ui-canonical-experience-ownership-20260720` → `5c9ddb5d` (annotated tag)
**Session:** `.engineering/session/runs/UIOWN1_UI_Canonical_Experience_Ownership.md`

> **Filing note:** this report sits at the mission-specified path (`docs/implementation/` root). The repo-structure gate's "no loose files" check already fails at the rollback tag (pre-existing loose reports); this file follows the mission's explicit path per the `PLANNER_MEALS1` precedent and adds no *new* class of violation.

---

## 1. What was created

One governing architecture document, `docs/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`, indexed in `docs/architecture/README.md` (Experience Governance). It establishes:

- **Purpose:** UI renders published state and never owns business state (GEA17 + Register publication model, cited).
- **Position:** a Layer 2 assembly document owning exactly two things — the **per-experience ownership map** (the gap between the Source of Truth Register's facts→stores mapping and `GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 17's questions→documents mapping) and the **assembled UI Composition Rules**. Everything else is citation (restate-no-rule).
- **Eight governing principles**, each cited to its owner (Principles 2/4/6/7/8; GEA17/18; CPA1 § 1; TIP2 §§ 1, 5.3; COMP_AUTH1 § 10).
- **Fifteen canonical experience owners** (Living Home · Household · Companion · Planner · Cookbook · Pantry · Shopping · Nutrition · Canonical Food Platform · Diary · Community · Profile · Administration · Notifications · Seasonal/Environmental Dressing), each with Responsibilities / Owns / Does Not Own / Primary Consumers, bound to Register domain numbers and engine architectures.
- **UI Composition Rules** — five general rules plus the four named compositions (Home, Planner, Companion, Community/Orchard).
- **An Ownership Decision Matrix** — the ten mission examples, each with exactly one canonical owner, plus the method for every future element (no owner → STOP, declare first).
- **Architecture Compliance, AI Architecture Compliance, and an explicit governance-only Impact section** (no schema, no runtime, no persistence, no APIs, no implementation).

Research basis: three parallel read-only briefs over the canon — (a) `ARCHITECTURE_PRINCIPLES.md` + the full 38-domain Source of Truth Register; (b) the nine Intelligence/Companion governing documents' ownership boundaries; (c) GEA § 17/§ 2, UIA §§ 10/17, the Blueprint § 5.1 room map, and targeted searches for Community, referral, and notification ownership.

## 2. Cross-check performed (Living Home · Companion · Intelligence · Community)

- **Living Home:** bindings align with `LIVINGHOME1` (three lawful movements, each owner cited; traditions declared-not-built) and `LIVINGHOME2` (dressing declared-not-built; refusals in force until its § 10.2 amendments). The matrix's "Orchard dressing" row is a *refusal* with an owner, matching Blueprint § 6.1/ED5.
- **Companion:** bindings restate nothing — CPA1 § 1's invariant, TIP3 § 4.1's conversation store rule, INT17/INT20/INT21 single-owner mandates, and COMP_AUTH1's authority laws are cited as boundaries of the Companion experience entry and composition chain.
- **Intelligence:** capability→owner discipline (TIP2 §§ 1, 5.3) is the document's principle 5/7; no capability, intent, or context view is created.
- **Community:** Domains 37/38 (added `COMM1`/`COMM1A`, 2026-07-19) are the owners; the Orchard room is recorded as Domain 37's only client consumer; CM1–CM3 and the two-owner referral split (link vs attribution) are cited, not restated.

## 3. Conflicts found, and how each was resolved

1. **Risk of a second ownership map** (GEA § 17, the Register, TIP2 § 5.3, UIA § 17 each own a mapping). *Resolved in scoping:* UIOWN1 owns only the per-experience assembly none of them holds; each existing map is cited where it governs. No owner amended.
2. **Notifications: canonical chain dormant, parallel ungoverned channels live** (`GET /api/home/intelligence`, `GET /api/planner/weeks/:weekId/intelligence`, the WX7 pantry block) — recorded by INT20's own architecture as convergence debt. *Resolved by inheritance, not re-ownership:* UIOWN1 names the Notice Engine sole owner of the decision, forbids new consumers binding to the ungoverned channels, and adds no deadline. The debt stays with its owner.
3. **No push-notification infrastructure exists** (verified: no web push, no VAPID, no notifications table). *Resolved honestly:* recorded as correct — notices are in-app only; any future push channel must be a delivery adapter under the one decision-owner.
4. **No Administration domain in the Register.** *Resolved as correct-by-design:* Admin owns nothing; it is a pure consumer over `access.ts` + `admin_audit_log` + Domain 32's read-only views. No domain invented.
5. **Profile diet ownership:** `user_preferences.dietTypes` was a retired bridge; the owner is `household_eaters` (Domains 7/16, converged 2026-07-16). *Resolved by pointing at the converged owner* and stating the boundary in the Profile entry.
6. **Domain 18 (Nutrition Boost Display) is marked Contested in the Register.** *Not resolved here — deliberately:* the contest is the Register's to close by its own amendment; UIOWN1 binds no element to Domain 18 and records nothing that presupposes either claimant. Flagged to the owner as follow-up.
7. **Register staleness observed in passing** (Domain 6 still marked "Contested" though converged; the Register's Definition of Done still says "27 domains" while the live register runs to 38). *Reported here, not fixed:* Register corrections are that document's own governed act.
8. **Celebrations and seasonal decorations have no built owner.** *Resolved by refusal-until-owned:* both matrix rows name the declaring document (LIVINGHOME1 § 7 / LIVINGHOME2) and state that no surface may render them until the owners exist.
9. **Community has no dedicated `docs/architecture/` document** — governed distributively (Register Domains 37/38, Blueprint § 5.1 amendment, three `docs/implementation/community/` records). *Resolved by citing the distributed owners as they are;* whether Community earns a consolidated governing document is left to the owner.

**Cross-reference updates:** confined to `docs/architecture/README.md` (index row + Experience Governance summary — the DOCGOV1 gate). No other governing document was byte-touched: under restate-no-rule and owner-prevails, adding back-references into owners' files is an owner-side act and none was required for correctness.

## 4. Architecture compliance — confirmed

Both compliance blocks are completed in the architecture document itself (`UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § Architecture Compliance / § AI Architecture Compliance): one canonical identity · one owner per fact · no duplicate entities/ownership/state · progressive enrichment (Principle 3's knowledge/transactional split applied) · honest gaps (three absences recorded rather than filled) · no permanent synchronisation · evolution over replacement — and, on the AI side: Intelligence Platform reused · Capability Registry respected · Intent Engine reused · Companion remains an orchestration layer · business ownership unchanged (not one owner moves).

## 5. Verification

- `git status` clean before work apart from the session heartbeat; rollback tag created and verified → `5c9ddb5d` **before** any file was written.
- `git diff --stat` against the tag at commit time: only `docs/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (new), `docs/architecture/README.md` (index), this report, and the two `.engineering/session/` files.
- `repo-structure-verify.sh`: "every architecture document indexed in README.md" **PASS**; the two loose-file failures are pre-existing at the tag (see filing note).
- No build, typecheck, or test surface affected; none claimed re-run beyond confirming the diff contains no code path.

## 6. State

**Waiting for User.** Acceptance is the owner's review of the architecture document — in particular the fifteen ownership entries and matrix rows, and the two follow-ups surfaced for owner decision: closing Domain 18's contest at the Register, and whether Community earns a consolidated governing document.
