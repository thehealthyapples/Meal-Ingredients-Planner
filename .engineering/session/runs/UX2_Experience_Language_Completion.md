
# Session: UX2_Experience_Language_Completion

| Field | Value |
|---|---|
| **Session ID** | `UX2_Experience_Language_Completion` |
| **Rollback ID** | `rollback/UX2-experience-language-completion-20260719` |
| **Start time** | 2026-07-19T22:23:39Z UTC |
| **Current stage** | Waiting for User |

## Objective
Review the complete THA experience against the agreed Orchard North Star and implement the remaining UX refinements so the product feels like one coherent home.

## Owner decisions received (2026-07-20)
- **Orchard green, hue 74, is the canonical platform primary colour.** This unblocks
  NORTH4 D1, which every prior run deferred as "the owner's decision, not taken here".
- **Caveat remains THA's signature handwriting font** for personal moments. No change
  required — `--font-signature` already holds it and `/home`'s greeting is its one
  adopted surface.

## Files being modified
- `client/src/index.css` — the header material, the brand relief, the Home room
  (Concept B), the Companion emblem and its light, and the platform primary swap.
- `client/src/components/workspace-header.tsx` — permanent header, embossed mark.
- `client/src/components/conversation/FloatingAssistant.tsx` — Companion presence.
- `client/src/components/layout/orchard-backdrop.tsx` — `OrchardArch` → `OrchardWindow`.
- `client/src/pages/home-experience-page.tsx` — the arch/console retired.
- `client/src/components/SiteBanner.tsx`, `TrialBanner.tsx` — unowned colours retired.
- `server/tests/test-comm2-orchard-experience.ts` — guard renamed with the shape.

## Checkpoints
- [x] Rollback tag cut — `rollback/UX2-experience-language-completion-20260719`
- [x] Permanent header rebuilt: `.shell-header`, one material in every room
- [x] Embossed brand mark replaces `logo-long.png`; second apple retired
- [x] Home rebuilt to Concept B — arch and oak console retired
- [x] Companion emblem + presence light (aware / speaking / listening)
- [x] `SiteBanner` / `TrialBanner` moved off unowned Tailwind colours
- [x] Platform primary swap 132 → 74, both modes, values re-derived per surface
- [x] ARRIVAL1's Home-scoped green override DELETED (not merely matched)
- [x] `--primary-tint` / `--primary-ink` added; intelligence greens moved onto them
- [x] Basket glyph quietened at rest; third duplicate apple (Planner) retired
- [x] **Defect found by picture:** `/tha-apple.png` unpublished — all three reliefs
      were rendering as nothing. Asset published; verifier asserts content-type.
- [x] **Defect found by picture:** wall apple laid across the Companion's sentences.
      Re-anchored to the floor, width derived from the margin it must fit.
- [x] `scripts/ux2-verify-experience-language.ts` — 29 assertions, all passing
- [x] Before/after captures — 12 each, six rooms × two viewports
- [x] Report: `docs/implementation/UX2_EXPERIENCE_LANGUAGE_COMPLETION.md`
      (beside its lineage — `UX_NAV1_ORCHARD_NAVIGATION_REFINEMENT.md`,
      `UX_REFINE1_HOUSEHOLD_EXPERIENCE_REFINEMENT.md`, `NAV1_APPLICATION_SHELL_IMPLEMENTATION.md`)
- [x] Committed and pushed
- [ ] **Owner decision needed** — Companion ownership of reminders/coaching
- [ ] **Owner decision needed** — Home's room hue (132 vs 74, collides with Analyser)

**Last checkpoint:** Report written, work committed and pushed. Stopped for two
genuine owner decisions.

## Next action
Await the owner's ruling on (1) whether the Companion is the sole voice of
coaching — this governs 8 `AmbientIntelligence` surfaces, a 9-card intelligence
family, 5 per-surface panels and 6 "Tip:" banners, all of which are OWNERSHIP
changes the brief forbade taking unilaterally — and (2) Home's room hue.

## Blockers
None blocking. Two owner decisions outstanding; neither prevents shipping what is
committed. Three pre-existing gate failures (coherence 2, adoption 9,
typecheck-gate 16) were confirmed present at HEAD and are NOT claimed to pass.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
