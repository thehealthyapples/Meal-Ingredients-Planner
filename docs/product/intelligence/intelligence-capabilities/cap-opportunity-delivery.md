---
entry: cap-opportunity-delivery
name: Opportunity Delivery capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Opportunity Delivery capability

> The one place THA's suggestions for your household — from any part of the
> platform — are collected, de-duplicated, and prioritised before you see one.

## What it means for the household

When THA has noticed something worth telling you — a safety conflict on your
shopping list, a planning gap, a nutrition opportunity — this capability is
what decides which one to surface first, explains an already-delivered
suggestion when you ask "why this?", and lets you acknowledge, accept, or
dismiss it.

## What it will never do

It owns no household or nutrition data of its own, and it invents no
suggestion — every opportunity it delivers was produced by another capability
that already reasoned over your household's real data; this one only governs
which of those genuine findings reaches you, and in what order.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`opportunity-delivery`) |
| Binding | `server/intelligence/bindings/opportunity-delivery.ts` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
