
# Session: EXPGOV1_Governing_Experience_Architecture

| Field | Value |
|---|---|
| **Session ID** | `EXPGOV1_Governing_Experience_Architecture` |
| **Rollback ID** | `rollback/EXPGOV1-governing-experience-architecture-20260720` |
| **Start time** | 2026-07-20T09:02:07Z UTC |
| **Current stage** | Planning |

## Objective
Create the permanent Governing Experience Architecture and audit the implementation against it

## Files being modified
- <path> — <why>

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [ ] <checkpoint not yet done>

**Last checkpoint:** <none yet>

## Next action
<the single next concrete step to take on resume — keep this always accurate>

## Blockers
<none | describe the blocker and what is needed to clear it>

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._


## Outcome (EXPGOV1 — Complete)

**Stage:** Complete. Architecture programme; **no UX changes implemented**.

**Created**
- `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` — the Experience Constitution.
  20 principles (GEA1–GEA20), the three-layer model (Constitution → Architecture →
  Implementation), the ownership map (§ 17) and the verification map (§ 18).
- `docs/implementation/experience/EXPGOV1_GOVERNING_EXPERIENCE_ARCHITECTURE.md` —
  prioritised architectural gap analysis: 5 Critical, 6 Important, 5 Enhancement.

**Updated**
- `docs/architecture/README.md` — indexed at the head of Experience Governance;
  named in the Architecture Bootstrap as mandatory first read for UX/UI/frontend/
  visual work; EXPERIENCE CONSTITUTION COMPLIANCE added to the Compliance section.
- `docs/architecture/ENGINEERING_WORKFLOW.md` — Experience Constitution Check added
  as the first item of the EXPERIENCE & UI GOVERNANCE COMPLIANCE block, so the
  document is reachable by anyone following the workflow (the ARCH-VERIFY1 lesson).

**Constitutional position:** upstream of the Experience Governance documents on the
axis of principle; downstream of every one of them on the axis of rule. Restates no
rule; cites owners with section numbers throughout.

**Two codifications rather than inventions**
- GEA11 (surplus space becomes air and view) — the rule previously rested only on
  HOUSE1 § 19.3, explicitly marked "not governing architecture".
- GEA8 (the Companion owns coaching) — previously law only in commit 7a5b48cf and
  the Adoption Register; settles it against HOUSE_ACT2's contradicting rationale.

**Verification**
- `repo-structure-verify.sh`: "every architecture document indexed in README.md" PASS.
  Two FAILs (loose files under docs/implementation/ and docs/investigations/) are
  pre-existing — 21 loose files, none authored by this workstream.
- No file under `client/` modified. No runtime dependency created.

**Rollback:** rollback/EXPGOV1-governing-experience-architecture-20260720 → f011b3e7
Tag protects committed state only; tree was dirty at tag time (CURRENT.md,
benchmark/history/index.json, two untracked benchmark files — none ours).

**Next action:** none. Workstream complete.
