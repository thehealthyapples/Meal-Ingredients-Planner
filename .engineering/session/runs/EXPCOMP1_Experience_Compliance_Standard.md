# Session: EXPCOMP1_Experience_Compliance_Standard

| Field | Value |
|---|---|
| **Session ID** | `EXPCOMP1_Experience_Compliance_Standard` |
| **Rollback ID** | `rollback/EXPCOMP1-experience-compliance-standard-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T10:15:00Z UTC |
| **Current stage** | In Progress |

## Objective
Create the governing **Experience Compliance Standard** — a repeatable, measurable,
reusable audit every major THA surface must pass before it is considered compliant
with the governing experience architecture. Define 19 compliance areas (what is
verified · why it matters · how to assess · typical failure patterns) each with a
PASS / WARNING / FAIL outcome, usable by designers, engineers, reviewers and future
AI agents. Then recommend a reusable audit report template, and recommend where both
documents should live within the governing architecture.

**Constraints (mission):** create **no** new experience principles · do **not**
redesign the product · produce **no** mock-ups · audit **no** screens · implement
**nothing** · maintain one owner per rule · do **not** modify the architecture
without explicit approval. Artefacts under `docs/investigations/`.

## Files being modified
- `docs/investigations/ux/EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md` — the standard (new)
- `docs/investigations/ux/EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_AUDIT_TEMPLATE.md` — the template (new)
- `.engineering/session/runs/EXPCOMP1_Experience_Compliance_Standard.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

**No governing document amended. No code, component, or token touched. No screen audited.**

## Checkpoints
- [x] Read `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
- [x] Read all governing Experience documents in full — Experience Architecture (EXP1/EXP2),
      Experience Blueprint (EXPBLUE1/EXPBLUE2), Experience Language (EXPLANG1/1A/1B),
      UI Architecture (UIA2), Orchard House Design Blueprint (OHDB1), Kept Room
      Translation (TRANSLATION1); Orchard Living Book (adds no rule — confirmed by header)
- [x] Read the `ENGINEERING_WORKFLOW.md` Experience & UI Governance Compliance block and
      Architecture Bootstrap STEP 2; read `REPOSITORY_CONVENTIONS.md` § 3–§ 4
- [x] Read NORTH1 and NORTH2 in full
- [x] Confirmed git status (branch `int1-intelligence-platform`; HEAD `7d1dd2ce`; dirty tree —
      untracked NORTH1/NORTH2 docs + run files, 2 pre-existing stray root `.txt` files,
      modified `CURRENT.md`; none of it authored here, none of it touched)
- [x] Created rollback tag (`→ 7d1dd2ce`) and reported the identifier **with its limits**
      (tag protects committed state only; the dirty tree above is NOT covered)
- [x] Authored the Compliance Standard
- [x] Authored the Audit Template
- [x] Placement recommendation
- [x] Reconcile run file + dashboard

## Findings

**The design that keeps one owner per rule.** The standard owns **no rule** — every one
of its 19 areas routes to an existing owner and quotes nothing as law. What it owns is
the instrument: the **audit method**, the **PASS/WARNING/FAIL scale**, the **evidence
standard**, and the **report shape**. This is the only construction that satisfies the
mission ("no new experience principles") and the canon simultaneously (Blueprint § 18 —
*"restating a rule creates a second owner of it"*).

**The genuine gap it fills.** The canon already has six gates (UX Governance Checklist ·
UI Governance Checklist · Experience Review Questions · Experience Test · Blueprint
Checks · Design Character Check). All six are **per-change and binary**. Nothing in the
canon verifies **a surface as a whole**, produces a **graded** outcome, permits
**comparison** between surfaces, or leaves a **retained artefact**. A surface can pass
every change-gate for two years and still be non-compliant, because each change was only
ever assessed against its own delta. That is the unowned instrument.

**Precedence hazard resolved explicitly.** WARNING must never weaken a gate's STOP. The
standard states that the audit *measures surfaces* and never *governs changes*: the six
gates bind every change regardless of any audit verdict, and no audit grade is a licence.

**Incidental finding, reported not fixed (workflow gap).** `ENGINEERING_WORKFLOW.md`
contains **no reference** to `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`,
`THA_KEPT_ROOM_TRANSLATION.md`, or `THA_ORCHARD_LIVING_BOOK.md` — not in the Architecture
Bootstrap STEP 2 reading list, not in the Experience & UI Governance Compliance block
(which names four documents and five checks). Yet OHDB's header declares *"Enforced by:
the Experience & UI Governance Compliance block"* and § 16.2's **Design Character Check
is therefore unreachable by anyone following the workflow** — the exact gap `ARCH-VERIFY1`
closed for the Experience/UI checklists on 2026-07-11, reopened by the three documents
adopted on 2026-07-15. Named in the standard; **not fixed** (it is a workflow amendment,
which needs approval).

**Performance & Responsiveness has no canonical owner** — the one mission-named area with
no owning document. Fragments exist (Experience Language Principle 2 *calm over speed*;
UIA § 12 *shape before spin*; Experience Architecture § 17.1's slow-connection state) but
no budget, threshold, or owner. Recorded as an **open item**, not invented as a rule.

**Truthful Objects — named carefully.** NORTH2 § 3.2 refused "Truthful Objects" as a *new
principle* (owned 3×). The standard uses the mission's name for the **audit area** only,
and routes it to Blueprint § 12.1 r2 / OHDB § 4 / TRANSLATION1 *Patina*. Auditing against
an owner is not adopting a principle — stated in the document so no future reader mistakes
it for NORTH1's rejected proposal.

**Placement recommendation.** The *obligation* to audit → **`THA_EXPERIENCE_BLUEPRINT.md`
§ 15** (one new § 15.4, by governed amendment): § 15 is already the only place holding the
gate system as a whole, and § 2.2 already lists the Blueprint Checks and Experience Test
among what it owns. The *standard and template themselves* → **operational**, at
`docs/implementation/ux/`, beside `ADOPTION_REGISTER.md` — the exact precedent (UIA § 17
mandates the register's *existence*; the register lives beside the implementation).
**Not applied** — no architecture modified.

**Last checkpoint:** Both documents authored under `docs/investigations/ux/`. No
architecture modified, no screen audited, no UI implemented, no principle created.

**Next action:** Awaiting review. If adopted: (1) apply the Blueprint § 15.4 mandate as a
named governance decision per Blueprint § 18; (2) promote the standard + template to
`docs/implementation/ux/`; (3) separately, close the workflow gap that leaves OHDB's
Design Character Check unreachable (`ARCH-VERIFY1`-shaped, needs its own approval);
(4) first audit subject recommended: **Home** (the gold standard every other room
inherits — HOUSE1 § 0.4).
