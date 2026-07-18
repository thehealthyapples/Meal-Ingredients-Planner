# Session: COMP3_Living_Relationship

| Field | Value |
|---|---|
| **Session ID** | `COMP3_Living_Relationship` |
| **Rollback ID** | `comp3-living-relationship-rollback-20260717` → working-tree snapshot `7a34f0c0` |
| **Start time** | 2026-07-17 |
| **Current stage** | Delivered — design philosophy; awaiting owner review |

## Objective
Design the **long-term relationship** between a household and the Companion — how trust quietly grows over
months and years so the Companion becomes a trusted part of family life without ever becoming intrusive.
Design philosophy workstream only: **no implementation, no AI logic, no behavioural implementation, no memory
implementation.** Continues COMP1 (identity) → COMP2 (presence) → COMP3 (the living relationship).

Core discipline: the Companion **never becomes more talkative — it becomes more understanding instead**, and
never announces it has learned. It must never say "I remember / I've learned / I noticed." Deliver:
relationship philosophy · relationship timeline (week · month · six months · one year · five years) ·
household rituals · seasonal relationship · family lifecycle journey · principles for long-term trust · what
must never change · what should gently evolve · beautiful moments only possible after years. Think as
hospitality designer, family psychologist, architect, lifelong friend — not an AI company.

## Outcome
Created `docs/implementation/COMP3_LIVING_RELATIONSHIP.md`. Grounded in the governing canon without restating
it: Blueprint § 13 (Companion Presence), COMP1 (identity + four states), COMP2 (presence philosophy),
`companion-card.ts`. COMP3 owns the previously-unowned layer: the **long-term relationship** and the manners
of deepening over time. Directly answers the COMP2-review gap #1 (the household/relationship dimension).

Central thesis: **deepening is subtraction, not addition — an assistant that has learned more says more; the
Companion that has understood more says less.** Understanding is *felt, never displayed*: the past shows up
only as better fit in the present, never as recall (the three forbidden sentences → replaced by the absence
of the sentence, § 2.1). Four convictions + four design stances (§ 1); the timeline (§ 3, week→5yr, volume
flat throughout, only fit changes); rituals stewarded never authored/scored/policed (§ 4); the year as the
unit of intimacy, continuity always forward never backward (§ 5); the full family lifecycle — children,
teenagers, new babies, life stages, retirement, moving house, celebrations, difficult periods, **bereavement**
(adjust by presence not sympathy-copy; the single most important paragraph), long absences (§ 6); a design
philosophy of memory/forgetting/fading — keep no grievance, let the transient fade, never a legible profile
(§ 7); ten long-trust principles (§ 8); must-never-change vs gently-evolve (§ 9); a beautiful-moments library
only years can make (§ 10).

Governance (§ 11): **no memory implementation** by explicit scope — COMP3 constrains only the *manners* any
future memory design must obey, bound by a separate gated privacy review. Inherits the COMP1/COMP2 § 320
aware-light gate and does not pre-empt it — deepening is expressed as fit + restraint, needing no new signal.
No motion / notification / colour / stored data added.

## Next action
Owner review of the COMP3 long-term relationship philosophy. When the identity + § 320 aware-light amendment
(COMP1 § 10) are ratified and a memory/privacy design review is opened, COMP3 becomes the relationship brief
that binds the manners of any later, gated memory + interaction build (memory/behaviour/AI still separate and
out of scope here).

## Product changed
**None (design philosophy).** No component, route, data, schema, migration, test, memory, or AI logic touched.
Added: this run file and `docs/implementation/COMP3_LIVING_RELATIONSHIP.md`.
