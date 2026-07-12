---
entry: cap-household
name: Household capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Household capability

> Apple can see who eats here and what each person avoids, so nothing it
> suggests puts them at risk.

## What it means for the household

Apple can see who eats in the household and what each person avoids. That is
what lets it keep its suggestions safe: it knows an allergy or an exclusion
belongs to a real person at this table, so nothing it proposes puts them at
risk.

## What it will never do

It reads who is in the household; it does not manage them. Apple does not add or
remove members or eaters, and it only ever sees this household — resolved from
the signed-in person, never named by anyone from outside. If someone belongs to
no household, Apple says so rather than inventing one.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`household`) |
| Capability Card | `docs/architecture/capabilities/household.md` |

The Capability Card owns the architecture; this entry only says what the
capability means for a household.

## Related

- [[dom-household]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
