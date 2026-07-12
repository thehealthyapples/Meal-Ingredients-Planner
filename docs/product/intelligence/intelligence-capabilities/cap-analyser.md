---
entry: cap-analyser
name: Analyser capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Analyser capability

> Apple can look up any additive in THA's reference list; scoring a scanned
> product is a live calculation, not a fact it can read.

## What it means for the household

Ask Apple about an additive — what it is, what type it is, how it is rated — and
it will look it up in THA's reference list and explain it. That reference list
is settled knowledge Apple can read back.

## What it will never do

It will not tell you the score of a scanned product as though that were a stored
fact. A product's score is worked out fresh each time it is scanned — a live
calculation, not something Apple reads from a record — so Apple does not claim
to recall it. Additive facts it can look up; a product verdict it cannot.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`analyser`) |
| Capability Card | `docs/architecture/capabilities/analyser.md` |

The Capability Card owns the architecture, including why a scanned product's
score is a live computation rather than a stored read; this entry only says what
the capability means for a household.

## Related

- [[dom-analyser]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
