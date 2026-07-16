# EXPCOMP2 — Home Experience Compliance Audit

**Session ID:** `EXPCOMP2_Home_Experience_Compliance_Audit`
**Objective:** Audit the live Home surface (`/home`) against the governing Experience Architecture and the EXPCOMP1 Experience Compliance Standard. Produce a prioritised compliance plan. **No implementation.**
**Rollback ID:** `rollback/EXPCOMP2-home-experience-compliance-audit-20260716` → `7d1dd2ce80e9b6e23f73212d70886ddaaf79cda2`
**Stage:** Waiting for User
**Started:** 2026-07-16

> The tag protects **committed state only**. The working tree was dirty at tag time
> (1 modified + 13 untracked files from prior sessions). This session authored one
> new untracked file, which the tag does not cover — to revert entirely, delete it.

---

## Checkpoints

- [x] Architecture Bootstrap — `docs/architecture/README.md` read
- [x] Governing Experience documents read (Blueprint § 5.1 / § 6.2 / § 7 / § 12 / § 13 / § 15.3 / § 18; UIA § 5 / § 8 / § 9 / § 15 / § 16 / § 17; EXP ARCH; EXPLANG § 3A)
- [x] EXPCOMP1 Standard + Audit Template read in full
- [x] HOME1 read (arrival behaviour; the `/dashboard` finding)
- [x] HOME2 read (the canonical Home decision model — the door)
- [x] Git status confirmed · rollback created · identifier reported
- [x] Home implementation assessed (`home-experience-page.tsx`, shell, tokens, Companion, a11y — measured, not eyeballed)
- [x] All 19 areas graded; findings carry rule + evidence + failure + mechanism
- [x] Audit filed at `docs/investigations/ux/HOME_COMPLIANCE_AUDIT_20260716.md`
- [x] No implementation performed · no architecture modified · no screen redesigned

## Outcome

**3 PASS · 9 WARNING · 7 FAIL — NON-COMPLIANT (3/19).**

**Headline:** Home has no door. Three identically-styled cards and a greeting that
*asks* the household what to do (`"How can I help your family today?"`) transfer the
product's prioritisation work onto the household — and it looks exactly like
restraint, which is why it survived the entire visual programme.

**Second finding (new, not in the canon):** Home renders `plantCount ?? 0` →
**"0 of 30 plants"** where the server deliberately returns `null` to mean *no
validated data* — a measurement that was never taken. Live Core Principle 6 defect.

**Third:** `/home`'s file header claims its Reminders section is dead. **It is not** —
PHASE5E fixed it. The comment is the defect; it misleads every future reader.

**Corrections to the canon, evidenced:** PX1's `hover-elevate` "defined nowhere" is
**stale** (defined `index.css:456-481`, register row 24 ✅). `PageHeader.tsx` was
**deleted** in PX1-W4 — it is not a live unadopted successor. NORTH1 § 8.1 cites the
backdrop opacity at `orchard-backdrop.tsx:9` (actually `:18`) and asserts a
**parallax that does not exist** (static `<img>`; the token has zero consumers).

## Next action

None — audit complete and filed. Awaiting direction on the § 6 roadmap.
Recommended first three (all deliverable now, all deletions or one-liners):
(1) stop the `?? 0` fabrication · (2) delete the false header comment ·
(3) the failing contrast floors (3.40:1 label, 1.51:1 focus ring).
The **door** (HOME2's resolver) is the highest-value item and is buildable today.

Five architectural conflicts routed to their owners, none resolved here — the
load-bearing one: **the canonical container has no rung for Home's mapped ground
posture**, so the naive conformance fix would destroy the map's requirement.
