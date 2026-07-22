# Session: ED1_Environmental_Dressing_Foundation

| Field | Value |
|---|---|
| **Session ID** | `ED1_Environmental_Dressing_Foundation` |
| **Rollback ID** | `rollback/ED1-environmental-dressing-foundation-20260722` → `94edc39a` (annotated tag; created before any change; covers committed state only — tree clean apart from the CURRENT.md heartbeat) |
| **Start time** | 2026-07-22 |
| **Current stage** | Complete — committed on `int1-intelligence-platform`; awaiting owner acceptance |

## Objective
Establish the canonical **Environmental Dressing Platform** that governs all future Living Home environmental dressing — ownership, registration, placement rules, rendering architecture only — **without introducing any visible dressing anywhere.**

## Governance conflict surfaced & resolved (Architecture Bootstrap STOP)
The brief, read literally ("implement the Registry + interfaces as artifacts"), jumps two hard gates `LIVINGHOME2` names: § 10.1 (*ships nothing*) and § 10.4 Phase 2 (register gated behind Phase-1 amendments + EXP3 Phase 2). Probed the repo and confirmed **both gates shut**: grep of the four owner files returned no `LIVINGHOME2`/"Environmental Dressing" citation (amendments not landed); `EXP3`'s base register/verifier absent in code (only `orchard-backdrop.tsx` present). Asked the owner; **owner chose the compliant path: Phase-1 amendments + DECLARED-NOT-BUILT foundation, zero code, zero dressing** — which is also the brief's own Scope Lock.

## Checkpoints
- [x] Read required docs (README both pages; LIVINGHOME2 in full; LHXP5; the four owner files at their exact anchors).
- [x] git status confirmed; annotated rollback tag created (`94edc39a`) & reported before any modification.
- [x] Surfaced the gate conflict; owner selected "Phase 1 + Foundation doc".
- [x] Landed the four § 10.2 owner amendments (8 edits), each a citation-based annotation preserving the original rule verbatim.
- [x] Wrote `docs/implementation/ED1_ENVIRONMENTAL_DRESSING_FOUNDATION.md` — full platform spec (owner · registry · placement · rendering · lifecycle · seasonal · visibility · eligibility · registration · extension points) DECLARED-NOT-BUILT, with all 9 required sections.
- [x] Verified diff is docs/session only — no code path.
- [ ] Commit; record commit hash here + dashboard.

## The four Phase-1 amendments landed (governance only)
1. **Blueprint § 12.1 item 2** — prop = *claim without data*; registered dressing = *claim-free hospitality object*. Ban's purpose untouched.
2. **OHDB § 11** — "seasonal dressing declined" annotated: declined for the house (absolute); superseded only for the registered dressing layer (objects through the door, never weather on the orchard).
3. **LIVINGHOME1 ×3** — § 5.2 rule of thumb → three-register test; LH3 core kept + dressing permission added as a **separate per-tradition switch, OFF by default** (not a fourth rung; reasoning recorded); § 10.4 item 4 refined (no tradition changes the House; reaches dressing only via explicit permission).
4. **EXP3 ×4** — declares the third (Dressing) register; scopes the empty-house test to the Life register; adds the verifier's future third-register checks; annotates § 8.3 refusals.

## Decision recorded for owner review
§ 8.2 celebration permission (LIVINGHOME2 § 7.2.2 reserved this to the LIVINGHOME1 amendment) → **separate per-tradition dressing switch, OFF by default, not a fourth rung**. Why: dressing consent renders belief *visually* (LH7 Article 9), is categorically different from participation, fails closed on its own axis, and doesn't renumber the governed rungs (LH2).

## Forbidden list — confirmed untouched
No code · schema · migration · token · asset · string · route · capability · component · register module · verifier. **No visible dressing:** bowls, flowers, blankets, books, fruit, candles, seasonal decorations, weather effects, animations, lighting, particles, room assets — none created, registered, or rendered. The register-as-code (LIVINGHOME2 Phase 2) NOT shipped — still gated behind these amendments + EXP3 Phase 2.

## Verification
Documentation-only. `git diff --stat` touches only 7 files under `docs/` and `.engineering/session/`; no `.ts/.tsx/.json/.css`/migration path. Typecheck/build/adoption unaffected (no code path) — not re-run beyond confirming the diff. Rollback tag verified → `94edc39a` before any write.

## Next action
Owner acceptance of the four Phase-1 amendments (holding any is a legitimate recorded outcome) + the § 8.2 switch decision. Then the lawful order: EXP3 Phase 2 (base register/verifier) → Dressing Register empty (Phase 2) → the standing welcome (Phase 3) → **ED2 — Seasonal Environmental Dressing Activation** (Phase 4). NOT deployed.

## Blockers
The register-as-code remains hard-blocked until (a) these amendments pass owner review and (b) EXP3 Phase 2 ships. Both separate governed acts.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
