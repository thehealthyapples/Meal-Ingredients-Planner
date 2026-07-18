
# Session: INT20_Natural_Language_Action_Resolution

| Field | Value |
|---|---|
| **Session ID** | `INT20_Natural_Language_Action_Resolution` |
| **Rollback ID** | `rollback/INT20-natural-language-action-resolution-20260718` |
| **Start time** | 2026-07-18T09:01:51Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Enable the Intent Engine to resolve natural-language household commands into existing THA capabilities (planner/shopping/pantry/diary) via COMP_ACT1 bindings

## The gap being closed (established by investigation)
- COMP_ACT1 made 8 write verbs genuinely executable; COMP_ACT2 surfaced them as
  proposals **from on-screen context only**.
- `PatternIntentResolver` emits **zero** write intents today (no `verb: "add" |
  "move" | "replace" | "delete"` anywhere in the file).
- `conversation-gateway.ts:225 detectWriteIntent()` short-circuits **every**
  conversational command with a blanket read-only refusal **before the resolver
  runs** (gateway ~line 473).
- Net effect: the verbs are live but unreachable by speech. INT20 replaces the
  blanket refusal with *resolution* into those same existing capabilities.

## Constraints (owner-stated)
No new capabilities, business logic, APIs or architecture. Reuse Intent Engine,
Capability Registry, Companion, planner/shopping/pantry services, existing
confirmation flow. Do not duplicate planner or shopping logic. Missing info →
ONE concise clarification, never a guess.

## Files being modified
- `server/intelligence/conversation/action-language.ts` — NEW, pure words → symbolic command
- `server/intelligence/conversation/action-resolution.ts` — NEW, symbolic → real ids via existing reads
- `server/intelligence/conversation/conversation-gateway.ts` — resolve before the write guard (one change)
- `server/tests/test-int20-natural-language-actions.ts` — NEW, 61 assertions
- `scripts/int20-verify-resolution.ts` — NEW, developer verification harness
- `package.json` — registered the new test in the chain
- `server/tests/test-intelligence-conversation-gateway.ts` — 1 stale assertion updated
- `server/tests/test-intelligence-behaviour-decision.ts` — exit-path count 5 → 6
- `docs/implementation/INT20_NATURAL_LANGUAGE_ACTION_RESOLUTION.md` — NEW, the report

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Git status confirmed — branch `int1-intelligence-platform`, HEAD `7bfad50c`
- [x] Rollback protection created + reported
- [x] Architecture investigated; the real gap located (see above)
- [x] Handler parameter contracts confirmed verbatim from the handlers
- [x] Action resolution implemented (pure parser + I/O resolver + one gateway seam)
- [x] Tests written + passing — 61/0
- [x] End-to-end verification caught a real ordering bug; fixed + regression-guarded
- [x] Regression sweep green; typecheck clean; 21 gate regressions confirmed pre-existing
- [x] Implementation doc written

**Last checkpoint:** Complete. All 8 bound write verbs reachable in speech; verified
live against real household data (planner.add → dayId 3 / mealId 115 cross-checked
against the DB). Nothing executed — every proposal left in `proposed`.

## Next action
Owner to review `docs/implementation/INT20_NATURAL_LANGUAGE_ACTION_RESOLUTION.md`
and decide commit + the three follow-ons in its §7: (1) add proposal/clarification
templates to the six personalities so the two new exit paths are registry-voiced;
(2) file COMP_ACT1 / COMP_ACT2 / INT20 together into `docs/implementation/companion/`
to clear the pre-existing structure-gate failure; (3) decide on the incorrect
`0 = Monday` comment at `opportunity-engine.ts:115` (reported, not changed).

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
