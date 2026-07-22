# Session: LHXP4_Living_Home_Experience_Pass4_Companion_Presence

| Field | Value |
|---|---|
| **Session ID** | `LHXP4_Living_Home_Experience_Pass4_Companion_Presence` |
| **Rollback ID** | `rollback/LIVING-HOME-PASS4-20260722` → `ed2a3cc3` (annotated tag, object `340abde6`; created before any change; covers committed state only — tree clean apart from the CURRENT.md heartbeat) |
| **Start time** | 2026-07-22 |
| **Current stage** | Complete — committed `43f2b714` on `int1-intelligence-platform`; awaiting Home Owner walk-through |

## Objective
Living Home Experience Pass 4 — Companion Presence. Make the Companion feel like a calm, trusted member of the household — quietly present when needed, respectfully absent when not. A **presentation-only** pass on the Companion UI (`FloatingAssistant.tsx`): validated against *"does this feel like someone quietly helping?"* and the five nevers (interrupt / demand attention / dominate / chatbot / compete with the room). No AI behaviour, prompt, capability, conversation flow, or owned word touched — the Companion Constitution's § 0 invariant held.

## Checkpoints
- [x] Read all required docs (architecture README + governance; LHC1, LHXP1-3, LIVINGHOME1, HOMEOWNER1, UIOWN1).
- [x] git status confirmed; rollback tag created & reported.
- [x] Mapped every Companion surface in code (1 thorough read-only investigation): launcher, glow, open/close motion, scrim, header, empty/waiting states, suggestion/action affordances, notices, quick-actions — each tagged presentation vs owned-logic.
- [x] Shipped 2 read-decidable, presentation-only edits; reviewed all other surfaces and recorded them as already-exemplary / left-well; staged the motion-feel items.
- [x] Verified: typecheck 88 (0 client, 0 FloatingAssistant); build exit 0; adoption 100·0·9 — all baseline-identical.
- [x] Wrote the deliverable with all 9 required sections + Pass 5 (Delight & Craftsmanship) recommendation.
- [ ] Commit; record commit hash here + dashboard.

## Changes shipped
1. **Double-"Apple" de-dup** — persona badge suppressed on the floating surface (where it merely repeated the "Apple" title); still renders on all 11 room surfaces where it names the room context → no dead code (resolves the LHXP1-recorded blocker). Guard: `SURFACE_LABEL[surface] !== "Apple"`.
2. **Suggestion affordance** — enrichment note container restyled from a bordered accent chip (which read as a withheld button) to a passive left-rule note (`border-l-2 border-primary/20 bg-muted/25`), clearly distinct from the tappable action pills. No `onClick` added (making it tappable would be new behaviour — refused).

## Next action
None outstanding once committed. Acceptance gate (owner-side): Home Owner opens the Companion from the floating launcher (header reads "Apple" once), opens it on a room surface (badge still frames context), and triggers an enrichment suggestion (reads as an offer, not a stuck button); then directs the staged motion-feel refinements on the running drawer. NOT deployed.

## Blockers
none — non-interactive; both shipped changes decidable by reading (a proven duplicate; a proven non-action wearing action chrome). Motion feel (waiting-state dots, open/close curve) staged for the running drawer per standing discipline. The Companion's words/behaviour are owned and were never in scope.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
