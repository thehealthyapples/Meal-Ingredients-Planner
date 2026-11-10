---
entry: cap-food-intelligence
name: Food Intelligence capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Food Intelligence capability

> Companion can recommend, explain, and compare foods using THA's own cited
> knowledge — never a second opinion it invented on the spot.

## What it means for the household

Ask Companion to recommend a food for a goal, explain why one specific food
earns that recommendation, show your own prioritised list of food opportunities,
or compare two or more named foods side by side — and it reasons over THA's
Food Knowledge Registry (and, where relevant, your own household's data) to
answer, with citations.

## What it will never do

It will not invent a comparison or recommendation from general knowledge outside
THA's own registry, and it owns no food or nutrition data of its own — every
fact it reasons over belongs to an existing canonical owner elsewhere in the
platform.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`food-intelligence`) |
| Binding | `server/intelligence/bindings/food-intelligence.ts` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
