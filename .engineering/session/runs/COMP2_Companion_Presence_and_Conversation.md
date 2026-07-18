# Session: COMP2_Companion_Presence_and_Conversation

| Field | Value |
|---|---|
| **Session ID** | `COMP2_Companion_Presence_and_Conversation` |
| **Rollback ID** | `comp2-presence-conversation-rollback-20260717` → working-tree snapshot `5c44f610` |
| **Start time** | 2026-07-17 |
| **Current stage** | Delivered — design specification; awaiting owner review |

## Objective
Design the **living Companion experience** — what it *feels like to live with* every day, so the Companion
reads as a trusted member of the household ("a trusted friend making tea in the kitchen") rather than an AI
feature. Design & interaction workstream only: **no implementation, no behavioural changes, no AI logic
changes.** Continues COMP1 (what the Companion *looks* like) into COMP2 (what it *feels* like).

Deliver: the complete Presence philosophy · daily interaction journey (arrival · return · silence · offer ·
noticing · celebration · reassurance · exit · quiet day) · conversation entry patterns · conversation exit
patterns · presence rules · things it must never do · beautiful micro-moments · signature-experience
recommendations. Explore: silence as a feature, timing, anticipation, manners, confidence, restraint,
emotional pacing, presence without notifications. Think as product/interaction designer, behavioural
psychologist, hospitality designer — not AI engineer.

## Outcome
Created `docs/implementation/COMP2_COMPANION_PRESENCE_AND_CONVERSATION.md`. Grounded in the governing canon
without restating it: Experience Blueprint **§ 13 Companion Presence** ("the friend at the kitchen counter …
arrives a beat after you; that beat is its entire sign of life"), § 12 / § 9 / § 320 (motion & presence law),
COMP1 (visual identity + four states), and `companion-card.ts` (Summary → Cards → Next Steps, the machinery
of returning a person to the product). COMP2 owns the previously-unowned layer: the *experience of presence
and conversation*.

Core thesis: **the Companion earns its keep by mostly not speaking** — silence is the default and the sign of
trust; a *secure* (never anxious) presence; anticipation not surveillance; presence lives in the room, never
on the lock screen (no notifications/badges/counts, ever). Five convictions, the felt qualities + their
shadows, the invisible craft (timing/anticipation/manners/confidence/restraint/pacing), a full daily journey
(§ 3.1–3.9 incl. the silent/quiet day as a *designed success*), entry patterns (§ 4, never a blank prompt),
exit patterns (§ 5, "a hallway not a destination" — hand off via Next Steps), twelve presence rules (§ 6),
the never-do list (§ 7), a named micro-moment library (§ 8), and five signature-experience recommendations
(§ 9): The Silent Morning · The One Held Sentence · The Guilt-Free Return · Celebration by Noticing · The
Hallway not the Destination.

Governance (§ 10): parts of the choreography lean on COMP1's **aware light**, a second presence signal § 320
currently forbids — COMP2 **inherits that gate and does not pre-empt it**; the philosophy holds without any
new signal. No motion/notification/colour added.

## Next action
Owner review of the COMP2 presence & conversation design. When the identity + § 320 aware-light amendment
(COMP1 § 10) are ratified, COMP2 becomes the experience brief a later, gated interaction-build implements
(behaviour/AI still separate and out of scope here).

## Product changed
**None (design specification).** No component, route, data, schema, migration, test, or AI logic touched.
Added: this run file and `docs/implementation/COMP2_COMPANION_PRESENCE_AND_CONVERSATION.md`.
