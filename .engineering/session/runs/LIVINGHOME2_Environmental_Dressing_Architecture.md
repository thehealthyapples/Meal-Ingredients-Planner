# Session: LIVINGHOME2_Environmental_Dressing_Architecture

| Field | Value |
|---|---|
| **Session ID** | `LIVINGHOME2_Environmental_Dressing_Architecture` |
| **Rollback ID** | `rollback/LIVINGHOME2-environmental-dressing-20260720` (annotated tag) → `d45c3f55` |
| **Start time** | 2026-07-20 UTC |
| **Current stage** | Rollback Complete |
| **Commit** | (pending) |

## Objective
Define (do not implement) the governing architecture for the **Environmental Dressing** layer of the Living Home — the missing third layer between the House (constant architecture) and Household Life (truthfully data-driven): dressing that belongs to the home itself, is not personalised, not data-driven, and exists to express warmth, hospitality and the quiet passage of the year while preserving the permanent identity of the house. Deliverable: `docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` with ownership, principles, belongs/never-belongs, relationships to House Architecture / Household Life / Household Traditions, implementation boundaries, examples, anti-patterns, and all compliance sections. Index in `docs/architecture/README.md`. Commit, push, report the rollback identifier.

## Files being modified
- docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md — the governing architecture (to create)
- docs/architecture/README.md — index entry (new architecture documents must be indexed — DOCGOV1 gate)
- .engineering/session/CURRENT.md — session row
- .engineering/session/runs/LIVINGHOME2_Environmental_Dressing_Architecture.md — this file

## Checkpoints
- [x] Git status confirmed — clean apart from CURRENT.md heartbeat.
- [x] Rollback tag created and verified: `rollback/LIVINGHOME2-environmental-dressing-20260720` → `d45c3f55`, **before** any file was written.
- [x] Governing inputs read: docs/architecture/README.md (both pages), LIVING_HOME_EXPERIENCE_ARCHITECTURE.md (full), docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md (full).
- [x] Conflict check done (Bootstrap): the mission is the **owner decision** the canon reserved — Blueprint § 12.1.2 (prop ban), EXP5 § 5.3/OHDB § 11 (seasonal dressing declined), LIVINGHOME1 § 5.2 (empty-house test) and § 10.4 (no occasion asset), EXP3 Verdict 1/§ 8.3 all refuse non-data-borne dressing *pending an owner admission*. The document must record the decision and name every owner amendment first implementation requires; it must NOT silently override any owner.
- [x] LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md authored — three-layer model (House *never changes* / Environmental Dressing *the home quietly lives* / Household Life *the household's true data*); rules ED1–ED12; classification test (§ 4.3); placement law (§ 5.1 — no produce dressing in the Pantry room); celebration gate (§ 7.2 — declared + explicit per-tradition dressing permission; no current ladder rung grants it, so no celebration dressing lawful until the LIVINGHOME1 amendment); belongs/never-belongs; examples table; ten anti-patterns; § 10.2 names the four owner amendments Phase 1 requires (Blueprint § 12.1.2, OHDB § 11/EXP5 § 5.3, LIVINGHOME1 § 5.2/LH3/§ 10.4, EXP3 registers/verifier) — all owners byte-untouched now; six phases; all compliance/evidence sections.
- [x] README index entry added (table row + Experience Governance summary paragraph).
- [x] repo-structure-verify.sh run: "every architecture document indexed in README.md" PASS; two pre-existing FAILs (loose files in docs/implementation/ and docs/investigations/) not attributable to this change — diff confirmed to touch only the four Rollback Plan files.
- [x] Committed and pushed; rollback identifier reported.

**Last checkpoint:** Document authored, indexed, verified; committing.

## Next action
Owner to review docs/architecture/LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md — in particular the User Acceptance Evidence: the document records (does not execute) the owner decision the canon reserved; the § 10.2 owner amendments are Phase 1, each confirmed file-by-file at its own review. Two sub-decisions surfaced: (1) § 7.2 permission mechanism — fourth ladder rung vs per-tradition switch (decided at the LIVINGHOME1 amendment); (2) rendering medium inherits EXP3 Verdict 3 unchanged.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
