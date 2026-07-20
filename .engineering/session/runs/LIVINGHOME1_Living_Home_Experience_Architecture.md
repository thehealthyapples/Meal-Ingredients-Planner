# Session: LIVINGHOME1_Living_Home_Experience_Architecture

| Field | Value |
|---|---|
| **Session ID** | `LIVINGHOME1_Living_Home_Experience_Architecture` |
| **Rollback ID** | `rollback/LIVINGHOME1-living-home-architecture-20260720` (annotated tag) → `1fe5e62c` |
| **Start time** | 2026-07-20 UTC |
| **Current stage** | Waiting for User |
| **Commit** | (recorded below after push) |

## Objective
Define the governing Living Home architecture: extend the approved North Star experience into one canonical home and one canonical orchard with room viewpoints, seasonal evolution, time-of-day atmosphere, household-defined traditions & celebrations, future Household → Traditions & Celebrations settings, Companion integration, and asset ownership/governance. Document only — no implementation. Deliverable: `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` with Architecture Compliance, AI Architecture Compliance, Definition of Done, Data Impact, Trust Check, Rollback Plan, Scope Lock, Manual Verification, and User Acceptance Evidence sections.

## Files being modified
- docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md — the governing Living Home architecture (to create)
- docs/architecture/README.md — index entry for the new governing document (if required by conventions)
- .engineering/session/CURRENT.md — session row
- .engineering/session/runs/LIVINGHOME1_Living_Home_Experience_Architecture.md — this file

## Checkpoints
- [x] Git status confirmed clean apart from CURRENT.md heartbeat.
- [x] Rollback tag created (annotated): `rollback/LIVINGHOME1-living-home-architecture-20260720` → `1fe5e62c`.
- [x] Governing canon digested (North Star / EXP1, Experience Governance, Household Time, Companion, workflow compliance blocks — three Explore briefs received)
- [x] Experience canon brief received. Layer model + precedence spine mapped; GEA1–GEA23 captured; verdict: every brief concern already owned EXCEPT household-declared traditions/celebrations — Living Home may lawfully own only the synthesis + the new domain, all else by citation.
- [x] Workflow/time/companion brief received. Key: HT13 (time aims words and doors, never light), HT14 (time triggers; Notice Engine decides), HT17 (season is not Household Time; season rule = shared/seasonal/season-rule.ts, Domain 11); Companion invariant (may change HOW said / WHICH true fact WHEN — never WHAT is true); COMP_AUTH1 (the page sets the subject; effective identity sets permissions); INT17 (model reads only Context Views); traditions/celebrations = NEW household fact → must be DECLARED before implementation (CPuBA transition rule), Register Rules 2/8; no Household Settings page exists today (profile-page.tsx is the surface); diary countdowns are localStorage-only (unowned — convergence candidate). Eight STEP 5 sections + compliance block formats captured verbatim.
- [x] North Star brief received. Load-bearing: one-morning law (Blueprint § 7) and one-season law (Blueprint § 6.1) are constitutional; seasonal dressing considered-and-declined (OHDB § 11, EXP5 § 5.3); NORTH2 § 3.5 REJECTED time-of-day atmosphere ("an atmosphere that varies by hour IS a theme"); shell constancy earns no exception for seasonal moments (EXPLANG § 332); per-room environments deferred to governed admission (EXP1 § 1.1/§ 8.1). Living Home must therefore express season/time through the household's LIFE and WORDS (data, doors, Companion), never the house's LIGHT — or record a governed amendment path with the cost named, owner-approved before any implementation.
- [x] LIVING_HOME_EXPERIENCE_ARCHITECTURE.md authored — Living Home Principle ("the house holds still; the life moves"), rooms-as-viewpoints, seasonal/time-of-day evolution assembled by citation (no owned rule restated), new Traditions & Celebrations domain DECLARED NOT BUILT with rules LH1–LH11 + 3-rung participation ladder + declared data shape, future settings surface governed, Companion integration via GEA21–23/CPA1/Notice Engine/INT17, asset governance synthesis, 5-phase roadmap, all nine mandated compliance/evidence sections completed.
- [x] README.md indexed (Experience Governance table row + Bootstrap blurb paragraph).
- [x] repo-structure-verify run: "every architecture document indexed" PASS; 2 loose-file FAILs pre-existing (also recorded at EXP1) — none introduced by this change.
- [ ] Committed and pushed

**Last checkpoint:** Document authored, indexed, structure-verified; ready to commit.

## Next action
Owner to review docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md — in particular the User Acceptance Evidence section's explicit decision: seasonal evolution and time-of-day atmosphere are delivered as the household's life (data, words, doors), never the house's light or calendar. If the owner instead intends the house itself to change visually, that is a Blueprint § 6.1/§ 7 amendment (reversal of the one-morning/one-season laws) which this document records as a STOP and does not propose. Then Phase 1 (Register domain declaration) may be commissioned as a separate governed act.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
