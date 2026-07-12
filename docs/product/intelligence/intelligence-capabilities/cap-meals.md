---
entry: cap-meals
name: Meals capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Meals capability

> Apple can find and explain the household's own recipes.

## What it means for the household

Ask Apple about a meal the household has saved — what is in it, how it is made —
and it will find it in the household's own cookbook (and THA's shared library)
and explain it back. It is the household's recipe collection, searchable in
plain language.

## What it will never do

It reads recipes; it does not write them. Apple does not create, edit or delete
a meal in the cookbook, and it will not surface another household's private
recipes. When it cannot find a matching recipe it says so rather than inventing
one.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`meals`) |
| Capability Card | `docs/architecture/capabilities/meals.md` |

The Capability Card owns the architecture; this entry only says what the
capability means for a household.

## Related

- [[dom-cookbook]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
