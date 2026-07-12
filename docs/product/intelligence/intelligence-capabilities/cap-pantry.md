---
entry: cap-pantry
name: Pantry capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Pantry capability

> Apple can read what is in the household's own pantry and explain those
> ingredients.

## What it means for the household

Ask Apple what is in the pantry, fridge or freezer and it will read back what
the household has recorded, and explain those ingredients. It is the household's
own store cupboard, put into words.

## What it will never do

It reads the pantry; it does not stock it. Apple does not add, remove or change
what is recorded there on the household's behalf, and it only ever sees this
household's pantry — never anyone else's.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`pantry`) |

The registry owns the architecture; this entry only says what the capability
means for a household.

## Related

- [[dom-pantry]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
