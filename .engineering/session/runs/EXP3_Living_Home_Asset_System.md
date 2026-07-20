# Session: EXP3_Living_Home_Asset_System

| Field | Value |
|---|---|
| **Session ID** | `EXP3_Living_Home_Asset_System` |
| **Rollback ID** | `rollback/EXP3-living-home-asset-system-20260720` (branch) → `81934cdf` |
| **Start time** | 2026-07-20 UTC |
| **Current stage** | Waiting for User |
| **Commit** | — (recorded after commit) |

## Objective
Design (do not build) the implementation architecture for the Living Home visual asset system that realises `docs/architecture/LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1): one canonical house and one canonical orchard held architecturally constant, with the life within the home (flowers, books, mugs, seasonal produce, recipes, textiles and other authentic household objects) evolving naturally as data-borne Living Details reflecting seasons, household rhythm and declared celebrations — never changing the canonical architecture. Deliverable: `docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md` covering shared architectural assets, room-specific foreground compositions, reusable asset layers, Living Details composition system, seasonal living details, responsive behaviour, performance, accessibility, future artwork pipeline, and implementation phases. Commit and push; report the rollback identifier.

## Files being modified
- docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md — the implementation architecture (to create)
- .engineering/session/CURRENT.md — session row
- .engineering/session/runs/EXP3_Living_Home_Asset_System.md — this file

## Checkpoints
- [x] Git status confirmed — clean apart from CURRENT.md heartbeat.
- [x] Rollback branch created: `rollback/EXP3-living-home-asset-system-20260720` → `81934cdf`.
- [x] Governing inputs read: docs/architecture/README.md (Bootstrap, both pages), LIVING_HOME_EXPERIENCE_ARCHITECTURE.md (full), EXP1 North Star implementation report (full), Blueprint § 6/§ 7/§ 8/§ 12/§ 14/§ 18.
- [x] Code/asset inventory received. Key: orchard-backdrop.tsx = only asset mounter (3 exports; E2 band via RoomThreshold/ROOM_EXPOSURE in app-shell.tsx); two orchard assets still split (/orchard.webp 384KB vs /orchard-bg.webp 50.5KB, 5 bypasses open under register row 40); exposure tokens live in index.css (e2 0.82 / e3 0.90 light; 0.12/0.18 dark — register row 41 + component comment stale at 0.55); Blueprint § 12.2 detail library nearly fully spent (Orchard room = only free slot); stillness/reduced-motion global; no image pipeline, no preload/fetchpriority today.
- [x] Load-bearing law checks: Blueprint § 12.1.2 painted-prop ban; TRANSLATION1 § 4 ceramics "no drawn ceramic, not a picture of pottery"; Blueprint § 8.2 rooms express character via ground+light only; LIVINGHOME1 § 5.2 empty-house rule of thumb; LH3/§ 10.4 no occasion asset ever.
- [x] EXP3_LIVING_HOME_ASSET_SYSTEM.md authored — two-register model (House checksum register = constancy mechanical; Life manifest = data bindings), instrument "if it changes, it must be data; if it is not data, it must never change"; 5-layer model; three design verdicts (authentic = data-known objects; no furniture layer; illustration-as-medium = owner decision, system lawful under either answer); per-room composition map with honest one-per-domain swap costs (Cookbook pilot "the open book"; Pantry flagged; Orchard room free slot; Home refused — greeting stays); seasonal double key (season ∩ household fact); celebrations transitive-only via planned food; responsive/performance/accessibility/pipeline; verify:living-home-assets enforcement design; 6 phases (Phase 1 = two-orchard convergence); all compliance/evidence sections.
- [x] Committed and pushed; rollback identifier reported.

**Last checkpoint:** Document authored; committing.

## Next action
Owner to review docs/implementation/EXP3_LIVING_HOME_ASSET_SYSTEM.md — in particular Verdict 3 (User Acceptance Evidence): whether true household facts may be rendered as commissioned still-life illustration or only in existing media (photography, type, material tokens). Phases 1–2 (orchard convergence; registers + verifier) are decision-free and may be commissioned as separate governed acts.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
